import type {PrismaClient} from '@/infrastructure/db/generated/client';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {checkedBody} from './current-financial';
import {sha} from './registry';
import type {CurrentScoringDatasets,CurrentScoringDataset} from '@/ports/current-scoring-datasets';
import type {PreScoringContext,PreScoringDatasetReference} from '@/ports/pre-scoring-datasets';
import {CurrentPreScoringBindings} from './pre-scoring-binding';
import {CurrentFinancialCoverage} from './current-coverage';
import {CurrentFinancialDatasets} from './current-dataset';
import {validateEvidence} from '@/domain/scoring/evidence';
import {deepFreeze} from '@/domain/portfolio/transaction';
import {instant} from '@/shared/time';
/** Governed current DI consumer. Does not invoke the historical snapshot bridge. */
export class CurrentPurposeScoringConsumer implements CurrentScoringDatasets {
 constructor(private readonly db:PrismaClient,private readonly bindings:CurrentPreScoringBindings,private readonly coverage:CurrentFinancialCoverage,private readonly datasets:CurrentFinancialDatasets){}
 async resolve(reference:PreScoringDatasetReference,context:PreScoringContext):Promise<CurrentScoringDataset>{
  await this.bindings.verify(reference,context);
  const enriched=await this.coverage.consume(reference.bindingId,context);
  const native=await this.datasets.consume(enriched.parentDatasetId,context);
  if(!native.financialCoverageComplete||!enriched.historicalWindowsBound||!enriched.currentNativeCoreDebtQualified)throw Error('CURRENT_CONSUMER_INCOMPLETE_DATA');
  const facts=[...native.facts,enriched.qualifiedDebtFact],evidence=facts.map(f=>f.evidence);
  // Economic date remains the original cutoff; operational receipts may legitimately be later.
  const economicAsOf=context.economicCutoff+'T23:59:59.999Z';instant(economicAsOf);
  const conflicts=validateEvidence(evidence,context.securityId,economicAsOf,context.knownAt,'CURRENT_FORMAL_VALUATION');
  if(conflicts.length||evidence.some(e=>e.quality!=='VALID'||e.validThrough<economicAsOf))throw Error('CURRENT_CONSUMER_UNQUALIFIED_EVIDENCE');
  const receipt={contract:'current-purpose-scoring-consumption-v1',status:'ACCEPTED_CURRENT_DATA',purpose:'CURRENT_FORMAL_VALUATION',bindingId:reference.bindingId,manifestHash:reference.manifestHash,parentDatasetId:enriched.parentDatasetId,
   context:{...context},originalBindingKnownAt:reference.context.knownAt,facts,evidence,history:enriched.previouslyAdmittedHistory,research:enriched.research,price:native.price,shares:native.shares,
   financialAssemblyComplete:true,fullM3CoverageCertified:false,gates:{assessment:'NOT_GRANTED',M1:'NOT_GRANTED',confidence:'NOT_GRANTED',scoringAuthorization:'NOT_GRANTED'},readyForScoring:false,historicalPitGranted:false,VNM17Promoted:false} as const;
  const dataAcceptanceId='current-data-acceptance:'+hash(receipt);
  const acceptance={contract:'current-purpose-data-initialization-acceptance-v1',id:dataAcceptanceId,bindingId:reference.bindingId,context:{...context},manifestHash:reference.manifestHash,consumedDatasetHash:hash(receipt),status:'ACCEPTED_CURRENT_DATA',readyForScoring:false,historicalPitGranted:false};
  const body=canonicalJson(acceptance);
  await this.db.$transaction(async tx=>{
   const rows=await tx.$queryRawUnsafe<{body:string;body_hash:string;binding_id:string}[]>('SELECT body,body_hash,binding_id FROM current_scoring_data_acceptance WHERE id=?',dataAcceptanceId);
   if(rows.length){if(rows[0].binding_id!==reference.bindingId||hash(checkedBody(rows[0]))!==hash(acceptance))throw Error('CURRENT_DATA_ACCEPTANCE_INTEGRITY');}
   else await tx.$executeRawUnsafe('INSERT INTO current_scoring_data_acceptance VALUES(?,?,?,?)',dataAcceptanceId,reference.bindingId,body,sha(body));
  });
  return deepFreeze({...receipt,dataAcceptanceId});
 }
}
