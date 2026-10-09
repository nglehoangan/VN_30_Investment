import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {FundamentalSnapshotRepository,FundamentalRepository,FundamentalDerivationRepository} from '@/ports/fundamentals';
import type {ScoringReadinessRead} from '@/ports/scoring';
import {PrismaFundamentalSnapshot} from './fundamental-snapshot';
import {PrismaFundamentals} from './fundamentals';
import {PrismaFundamentalDerivation} from './fundamental-derivation';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {isEvidenceAssessment,type AvailabilityAssessment} from '@/domain/fundamentals/availability';
import {requireFundamental,fundamentalId} from '@/domain/fundamentals/validation';
import {validateDIAcceptance,type TickerScoringReadiness} from '@/domain/fundamentals/scoring-readiness';
import {buildDataFreshness,emptyDataFreshness,type PublicFinancialFact,type DataFreshnessModel} from '@/domain/fundamentals/freshness';
import {instant} from "@/shared/time";
import {deepFreeze} from '@/domain/portfolio/transaction';
/** Capabilities come from trusted server composition, never URL/body/env approval declarations. */
export interface DataFreshnessServices {
 readonly snapshots:Pick<FundamentalSnapshotRepository,'findRun'>;
 readonly facts:Pick<FundamentalRepository,'findObservation'|'findSource'|'findCapture'>;
 readonly derivations:Pick<FundamentalDerivationRepository,'find'>;
 readonly readiness?:ScoringReadinessRead;
}
/** Links only: no fetch. Credentials, signed query strings, fragments and local resources are withheld. */
export function publicDocumentUrl(reference:string|null):string|null{
 if(!reference)return null;
 try{const u=new URL(reference);if(u.protocol!=='https:'||u.search||u.hash||u.username||u.password||!u.hostname.includes('.')||u.hostname.endsWith('.local')||u.hostname.endsWith('.localhost')||/^[\d.]+$/.test(u.hostname)||u.hostname.startsWith('['))return null;return u.href;}catch{return null;}
}
export async function readDataFreshness(client:PrismaClient,viewedAt:string,runId?:string,services:DataFreshnessServices={snapshots:new PrismaFundamentalSnapshot(client),facts:new PrismaFundamentals(client),derivations:new PrismaFundamentalDerivation(client)},acceptanceId?:string):Promise<DataFreshnessModel>{
 const base=emptyDataFreshness(viewedAt);let catalog:DataFreshnessModel['catalog']=[],catalogTruncated=false;
 try{
  if(runId!==undefined)fundamentalId(runId);if(acceptanceId!==undefined)fundamentalId(acceptanceId);
  const rows=await client.fundamentalSnapshotRun.findMany({take:51,orderBy:[{builtAt:'desc'},{runId:'asc'}],select:{runId:true,builtAt:true}});for(const row of rows){fundamentalId(row.runId);instant(row.builtAt);}catalog=rows.slice(0,50);catalogTruncated=rows.length>50;
  const selected=runId??catalog[0]?.runId;if(!selected)return deepFreeze({...base,catalog,catalogTruncated});
  const s=await services.snapshots.findRun(selected);requireFundamental(s,'DATA_SNAPSHOT_NOT_FOUND');
  requireFundamental(s.request.assessmentPins.length<=5000&&s.request.derivedIds.length<=1000,'DATA_DISPLAY_BOUND_EXCEEDED');
  const facts:PublicFinancialFact[]=[];
  for(const p of s.request.assessmentPins){
   const o=await services.facts.findObservation(p.observationId),row=await client.fundamentalAvailabilityAssessment.findUniqueOrThrow({where:{id:p.assessmentId}}),a=JSON.parse(row.body) as AvailabilityAssessment;
   requireFundamental(o&&snapshotHash(a)===row.bodyHash&&a.observationId===o.id&&a.id===p.assessmentId&&a.observationHash===snapshotHash(o)&&a.availableAt===row.availableAt&&a.assessedAt===row.assessedAt&&a.policy.version===row.policyVersion,'DATA_ASSESSMENT_INTEGRITY');
   const source=await services.facts.findSource(o.sourceVersionId),capture=await services.facts.findCapture(o.rawCaptureId);requireFundamental(source&&capture&&capture.sourceVersionId===source.id,'DATA_SOURCE_LINEAGE');
   const chain:string[]=[];let previous=o.supersedesObservationId;
   while(previous){requireFundamental(chain.length<100&&!chain.includes(previous),'DATA_REVISION_CHAIN');chain.push(previous);const ancestor=await services.facts.findObservation(previous);requireFundamental(ancestor,'DATA_PREDECESSOR_REQUIRED');previous=ancestor.supersedesObservationId;}
   const v2=isEvidenceAssessment(a)?a:null;
   facts.push({id:o.id,securityId:o.securityId,ticker:o.ticker,itemId:o.itemId,selected:s.members.some(m=>m.observationId===o.id),reportingScope:o.reportingScope,periodStart:o.periodStart,periodEnd:o.periodEnd,value:o.normalized.value,unit:o.normalized.unit,currency:o.normalized.currency,quality:o.quality,applicability:o.applicability,publication:{publishedAt:o.publication.publishedAt,publicationDate:o.publication.publicationDate,publicationPrecision:o.publication.publicationPrecision,publicationStatus:o.publication.publicationStatus,timezone:o.publication.timezone},publicationEvidence:{recorded:o.publication.evidenceReference!==null,url:publicDocumentUrl(o.publication.evidenceReference)},providerReceivedAt:o.providerReceivedAt,retrievedAt:o.retrievedAt,ingestedAt:o.ingestedAt,availability:{assessmentId:a.id,status:a.status,availableAt:a.availableAt,publicBoundary:a.publicBoundary,publicFallbackBoundary:v2?v2.publicFallbackBoundary:o.publication.publicationPrecision==='DATE_ONLY'?a.publicBoundary:null,evidenceBackedBoundary:v2?.evidenceBackedBoundary??null,boundaryBasis:v2?v2.boundaryBasis:a.publicBoundary===null?null:(o.publication.publicationPrecision==='TIMESTAMP'?'ISSUER_PUBLICATION_TIMESTAMP':o.publication.publicationPrecision==='DATE_ONLY'?'CONSERVATIVE_DATE_ONLY_FALLBACK':null),policyVersion:a.policy.version,policyHash:a.policyHash,receiptKnownAt:v2?.providerEvidenceBinding?.receipt.knownAt??null,finding:a.finding},source:{versionId:source.id,provider:source.provider,adapterVersion:source.adapterVersion,schemaVersion:source.schemaVersion,documentUrl:publicDocumentUrl(capture.resourceReference),captureId:capture.id,payloadHash:capture.payloadHash},revision:{kind:o.revisionKind,predecessorId:o.supersedesObservationId,correctionKnownAt:o.correctionKnownAt,chain}});
  }
  const derived=await Promise.all(s.request.derivedIds.map(async id=>{const d=await services.derivations.find(id);requireFundamental(d,'DATA_DERIVATION_REQUIRED');return {id:d.id,securityId:d.request.securityId,metric:d.request.metric,selected:s.derivedIds.includes(id),status:d.status,value:d.value,unit:d.unit,confidence:d.confidence,crosswalkVersion:d.crosswalk.version,operands:d.operands.map((v,i)=>({role:v.role,operation:v.operation,value:v.value,observationIds:v.observationIds,reviewKnownAt:d.request.operands[i].adjustment?.reviewedAt??null}))};}));
  const choices=await client.dataInitializationAcceptance.findMany({where:{snapshotRunId:s.request.runId},take:51,orderBy:[{acceptedAt:'desc'},{id:'asc'}],select:{id:true,acceptedAt:true}});
  for(const choice of choices){fundamentalId(choice.id);instant(choice.acceptedAt);}
  let readiness:readonly TickerScoringReadiness[]|null=null,review:DataFreshnessModel['review']={status:'UNAVAILABLE',acceptanceId:acceptanceId??null,acceptedAt:null,algorithm:null};
  if(acceptanceId){
   try{
    requireFundamental(services.readiness,'DATA_INDEPENDENT_REVIEW_CAPABILITY_REQUIRED');const row=await client.dataInitializationAcceptance.findUniqueOrThrow({where:{id:acceptanceId}});
    const a=validateDIAcceptance(JSON.parse(row.body));requireFundamental(a.snapshotRunId===s.request.runId&&a.contentHash===s.contentHash&&snapshotHash(a)===row.bodyHash&&a.id===row.id&&a.acceptedAt===row.acceptedAt,'DATA_REVIEW_RUN_BINDING');
    readiness=await services.readiness.readiness(acceptanceId);const ids=s.request.references.find(v=>v.kind==='UNIVERSE')!.content;
    requireFundamental(readiness.length===ids.length&&new Set(readiness.map(v=>v.securityId)).size===ids.length&&readiness.every(v=>ids.includes(v.securityId)),'DATA_REVIEW_UNIVERSE_BINDING');
    review={status:'VERIFIED',acceptanceId:a.id,acceptedAt:a.acceptedAt,algorithm:a.requirements.algorithm};
   }catch{readiness=null;review={status:'BLOCKED',acceptanceId,acceptedAt:null,algorithm:null};}
  }
  return deepFreeze({...buildDataFreshness(s,facts,derived,viewedAt,review,readiness),catalog,catalogTruncated:catalogTruncated||choices.length>50,acceptanceChoices:choices.slice(0,50)});
 }catch{return deepFreeze({...emptyDataFreshness(viewedAt,'BLOCKED',['BLOCKED_SNAPSHOT_INTEGRITY_OR_GOVERNANCE']),catalog,catalogTruncated});}
}
