import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {CurrentScoringDataset,CurrentScoringDatasets} from '@/ports/current-scoring-datasets';
import type {PreScoringContext,PreScoringDatasetReference} from '@/ports/pre-scoring-datasets';
import {decimal} from '@/domain/portfolio/values';
import {validateEvidence} from '@/domain/scoring/evidence';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {assertNotRevoked} from '@/infrastructure/repositories/unified-admission';
import {dateOnly,instant} from '@/shared/time';
import {checkedBody} from './current-financial';
import type {CurrentFinancialDatasets} from './current-dataset';
import {sha} from './registry';

type Subject = Pick<PreScoringContext,'ticker'|'securityId'> & {sector:'BANK';cutoff:string};
type BankManifest = {
 contract:'current-bank-enrichment-v1';context:PreScoringContext;parentDatasetId:string;
 admissionId:string;nativeManifestHash:string;facts:readonly {id:string;sha256:string}[];
};
type BodyRow = {body:string;body_hash:string;dataset_id:string;admission_id:string};

function requireBank(value:unknown,reason:string):asserts value {
 if(!value)throw Error(reason);
}

/** Consumes the exact BANK requirements bound by CurrentFinancialDatasets.
 * No RETAIL debt derivation and no reuse of another issuer's admitted history.
 */
export class CurrentBankScoringConsumer implements CurrentScoringDatasets {
 constructor(private readonly db:PrismaClient,private readonly datasets:CurrentFinancialDatasets,
  private readonly subject:Readonly<Subject>){
  this.subject=Object.freeze({...subject});
 }

 private verifyContext(context:PreScoringContext){
  requireBank(this.subject.sector==='BANK'&&context.ticker===this.subject.ticker&&
   context.securityId===this.subject.securityId&&context.economicCutoff===this.subject.cutoff,'BANK_DATASET_IDENTITY');
  requireBank(context.purpose==='CURRENT_FORMAL_VALUATION','CURRENT_ONLY_NOT_PIT');
  dateOnly(context.economicCutoff);
  instant(context.knownAt);
 }

 private async assemble(datasetId:string,context:PreScoringContext){
  this.verifyContext(context);
  const native=await this.datasets.consume(datasetId,context);
  const {facts,manifest}=native;
  const core=['TOTAL_ASSETS','TOTAL_EQUITY','NET_INCOME','BANK_GROSS_CUSTOMER_LOANS',
   'BANK_CUSTOMER_DEPOSITS','BANK_LOAN_LOSS_RESERVES'];
  const latestBalance=manifest.coverage.filter(r=>r.requirement.itemId==='TOTAL_ASSETS')
   .map(r=>r.requirement.end).sort().at(-1);
  requireBank(latestBalance&&latestBalance<=context.economicCutoff&&native.financialCoverageComplete,
   'BANK_DATASET_INCOMPLETE');
  requireBank(core.every(item=>facts.some(f=>f.itemId===item&&f.scope==='CONSOLIDATED'&&
   f.period.end===latestBalance&&f.evidence.unit==='VND')),'BANK_DATASET_CORE_MISSING');
  requireBank(facts.some(f=>['BANK_REPORTED_CAR','BANK_REPORTED_CET1'].includes(f.itemId)&&
   f.period.end<=latestBalance&&f.evidence.unit==='RATIO'&&decimal(f.value).positive&&
   decimal(f.value).units<=decimal('1').units),'BANK_CAPITAL_RATIO_REQUIRED');
  requireBank(facts.every(f=>f.ticker===context.ticker&&f.evidence.securityId===context.securityId),
   'BANK_FACT_IDENTITY');
  return {native,manifest:{contract:'current-bank-enrichment-v1',context:{...context},
   parentDatasetId:datasetId,admissionId:manifest.admissionId,nativeManifestHash:hash(manifest),
   facts:facts.map(f=>({id:f.id,sha256:hash(f)}))}} as const;
 }

 /** Persist data-only binding and its acceptance in the isolated governance workflow. */
 async bind(datasetId:string,context:PreScoringContext):Promise<PreScoringDatasetReference>{
  const {manifest}=await this.assemble(datasetId,context);
  const manifestHash=hash(manifest),bindingId='current-bank-coverage:'+manifestHash;
  const body=canonicalJson(manifest);
  await this.db.$transaction(async tx=>{
   for(const id of [bindingId,datasetId,manifest.admissionId])await assertNotRevoked(tx,id);
   const [row]=await tx.$queryRawUnsafe<BodyRow[]>(
    'SELECT dataset_id,admission_id,body,body_hash FROM current_financial_enrichment WHERE id=?',bindingId);
   if(row)requireBank(row.dataset_id===datasetId&&row.admission_id===manifest.admissionId&&
    row.body===body&&row.body_hash===sha(body),'BANK_BINDING_CONFLICT');
   else await tx.$executeRawUnsafe('INSERT INTO current_financial_enrichment VALUES(?,?,?,?,?)',
    bindingId,datasetId,manifest.admissionId,body,sha(body));
  });
  return {contract:'current-purpose-pre-scoring-reference-v1',bindingId,manifestHash,context:{...context},
   permitsScoring:false,historicalPitGranted:false};
 }

 private async verify(reference:PreScoringDatasetReference,context:PreScoringContext){
  this.verifyContext(context);
  this.verifyContext(reference.context);
  requireBank(reference.contract==='current-purpose-pre-scoring-reference-v1'&&reference.permitsScoring===false&&
   reference.historicalPitGranted===false&&reference.bindingId==='current-bank-coverage:'+reference.manifestHash&&
   reference.context.economicCutoff===context.economicCutoff&&reference.context.knownAt<=context.knownAt,
   'BANK_REFERENCE_SCOPE');
  await assertNotRevoked(this.db,reference.bindingId);
  const [row]=await this.db.$queryRawUnsafe<BodyRow[]>(
   'SELECT dataset_id,admission_id,body,body_hash FROM current_financial_enrichment WHERE id=?',reference.bindingId);
  const stored=checkedBody<BankManifest>(row);
  const replay=await this.assemble(row.dataset_id,reference.context);
  requireBank(row.admission_id===stored.admissionId&&hash(stored)===reference.manifestHash&&
   hash(replay.manifest)===reference.manifestHash,'BANK_BINDING_REPLAY_MISMATCH');
  const now=await this.datasets.consume(row.dataset_id,context);
  const evidence=now.facts.map(f=>f.evidence);
  const asOf=context.economicCutoff+'T23:59:59.999Z';
  requireBank(evidence.every(e=>e.quality==='VALID'&&e.validThrough>=asOf)&&
   !validateEvidence(evidence,context.securityId,asOf,context.knownAt,'CURRENT_FORMAL_VALUATION').length,
   'BANK_UNQUALIFIED_EVIDENCE');
  const receipt={
   contract:'current-purpose-scoring-consumption-v1',status:'ACCEPTED_CURRENT_DATA',purpose:'CURRENT_FORMAL_VALUATION',
   bindingId:reference.bindingId,manifestHash:reference.manifestHash,parentDatasetId:row.dataset_id,
   context:{...context},originalBindingKnownAt:reference.context.knownAt,facts:now.facts,evidence,
   history:now.facts.filter(f=>f.period.end.endsWith('-12-31')),
   research:{sector:'BANK'},price:now.price,shares:now.shares,financialAssemblyComplete:true,
   fullM3CoverageCertified:false,gates:{assessment:'NOT_GRANTED',M1:'NOT_GRANTED',confidence:'NOT_GRANTED',
    scoringAuthorization:'NOT_GRANTED'},readyForScoring:false,historicalPitGranted:false,VNM17Promoted:false,
  } as const satisfies Omit<CurrentScoringDataset,'dataAcceptanceId'>;
  const dataAcceptanceId='current-data-acceptance:'+hash(receipt);
  const body=canonicalJson({contract:'current-bank-data-acceptance-v1',id:dataAcceptanceId,
   bindingId:reference.bindingId,receiptHash:hash(receipt)});
  return {dataset:{...receipt,dataAcceptanceId},body,admissionId:stored.admissionId};
 }

 async materialize(reference:PreScoringDatasetReference,context:PreScoringContext){
  const {dataset,body,admissionId}=await this.verify(reference,context);
  await this.db.$transaction(async tx=>{
   for(const id of [reference.bindingId,dataset.parentDatasetId,dataset.dataAcceptanceId,admissionId])
    await assertNotRevoked(tx,id);
   const [row]=await tx.$queryRawUnsafe<{binding_id:string;body:string;body_hash:string}[]>(
    'SELECT binding_id,body,body_hash FROM current_scoring_data_acceptance WHERE id=?',dataset.dataAcceptanceId);
   if(row)requireBank(row.binding_id===reference.bindingId&&row.body===body&&
    row.body_hash===sha(body),'BANK_ACCEPTANCE_CONFLICT');
   else await tx.$executeRawUnsafe('INSERT INTO current_scoring_data_acceptance VALUES(?,?,?,?)',
    dataset.dataAcceptanceId,reference.bindingId,body,sha(body));
  });
  return dataset;
 }

 async resolve(reference:PreScoringDatasetReference,context:PreScoringContext):Promise<CurrentScoringDataset>{
  const {dataset,body}=await this.verify(reference,context);
  await assertNotRevoked(this.db,dataset.dataAcceptanceId);
  const [row]=await this.db.$queryRawUnsafe<{binding_id:string;body:string;body_hash:string}[]>(
   'SELECT binding_id,body,body_hash FROM current_scoring_data_acceptance WHERE id=?',dataset.dataAcceptanceId);
  requireBank(row?.binding_id===reference.bindingId&&row.body===body&&row.body_hash===sha(body),
   'BANK_DATA_ACCEPTANCE_REQUIRED');
  return dataset;
 }
}
