import type { FundamentalObservation } from '@/domain/fundamentals/contracts';
import type { FundamentalSnapshot } from '@/domain/fundamentals/snapshot';
import type { TickerScoringReadiness } from '@/domain/fundamentals/scoring-readiness';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { instant } from '@/shared/time';
export interface PublicFinancialFact {
 readonly id:string;readonly securityId:string;readonly ticker:string;readonly itemId:string;
 readonly selected:boolean;readonly reportingScope:string;readonly periodStart:string;readonly periodEnd:string;
 readonly value:string|null;readonly unit:string;readonly currency:string|null;readonly quality:string;readonly applicability:string;
 readonly publication:Pick<FundamentalObservation['publication'],'publishedAt'|'publicationDate'|'publicationPrecision'|'publicationStatus'|'timezone'>;
 readonly publicationEvidence:{readonly recorded:boolean;readonly url:string|null};
 readonly providerReceivedAt:string|null;readonly retrievedAt:string;readonly ingestedAt:string;
 readonly availability:{readonly assessmentId:string;readonly status:string;readonly availableAt:string|null;readonly publicBoundary:string|null;readonly publicFallbackBoundary:string|null;readonly evidenceBackedBoundary:string|null;readonly boundaryBasis:string|null;readonly policyVersion:string;readonly policyHash:string;readonly receiptKnownAt:string|null;readonly finding:string|null};
 readonly source:{readonly versionId:string;readonly provider:string;readonly adapterVersion:string;readonly schemaVersion:string;readonly documentUrl:string|null;readonly captureId:string;readonly payloadHash:string};
 readonly revision:{readonly kind:string;readonly predecessorId:string|null;readonly correctionKnownAt:string|null;readonly chain:readonly string[]};
}
export interface PublicFinancialDerivation {
 readonly id:string;readonly securityId:string;readonly metric:string;readonly selected:boolean;readonly status:string;
 readonly value:string|null;readonly unit:string|null;readonly confidence:string;readonly crosswalkVersion:string;
 readonly operands:readonly {readonly role:string;readonly operation:string;readonly value:string|null;readonly observationIds:readonly string[];readonly reviewKnownAt:string|null}[];
}
export interface DataFreshnessModel {
 readonly status:'VERIFIED'|'EMPTY'|'BLOCKED';readonly viewedAt:string;readonly blockers:readonly string[];
 readonly catalog:readonly {readonly runId:string;readonly builtAt:string}[];readonly catalogTruncated:boolean;
 readonly snapshot:{readonly runId:string;readonly contentHash:string;readonly scope:string;readonly mode:string;readonly builtAt:string;readonly decisionAsOf:string;readonly systemKnownAt:string;readonly fundamentalCutoff:string;readonly marketCutoff:string;readonly requirementsVersion:string;readonly universeVersion:string;readonly universeKnownAt:string;readonly blockers:readonly string[]}|null;
 readonly acceptanceChoices:readonly {readonly id:string;readonly acceptedAt:string}[];
 readonly review:{readonly status:'VERIFIED'|'UNAVAILABLE'|'BLOCKED';readonly acceptanceId:string|null;readonly acceptedAt:string|null;readonly algorithm:string|null};
 readonly counts:{readonly universe:number|null;readonly coveredSecurities:number|null;readonly selectedFacts:number|null;readonly dataReady:number|null;readonly scoringReady:number|null};
 readonly securities:readonly {readonly securityId:string;readonly ticker:string;readonly sector:string|null;readonly covered:boolean;readonly readiness:TickerScoringReadiness|null;readonly requirements:readonly {readonly itemId:string;readonly reportingScope:string;readonly periodStart:string;readonly periodEnd:string;readonly maxAgeDays:number;readonly selectedIds:readonly string[];readonly finding:string|null;readonly freshnessAtCutoff:'WITHIN_PINNED_THRESHOLD'|'EXCEEDS_PINNED_THRESHOLD'|'MISSING_OR_BLOCKED';readonly ageDaysAtView:number;readonly freshnessAtView:'WITHIN_PINNED_THRESHOLD'|'EXCEEDS_PINNED_THRESHOLD'|'FUTURE_PERIOD'|'MISSING_OR_BLOCKED'}[]}[];
 readonly facts:readonly PublicFinancialFact[];readonly derived:readonly PublicFinancialDerivation[];
}
export function emptyDataFreshness(viewedAt:string,status:DataFreshnessModel['status']='EMPTY',blockers:readonly string[]=[]):DataFreshnessModel{
 instant(viewedAt);return deepFreeze({status,viewedAt,blockers,catalog:[],catalogTruncated:false,snapshot:null,acceptanceChoices:[],review:{status:'UNAVAILABLE',acceptanceId:null,acceptedAt:null,algorithm:null},counts:{universe:null,coveredSecurities:null,selectedFacts:null,dataReady:null,scoringReady:null},securities:[],facts:[],derived:[]});
}
/** Only verified snapshot semantics and already projected public evidence enter this model.
 * Viewed-time age is diagnostic under the pinned threshold, never new scoring admission. */
export function buildDataFreshness(s:FundamentalSnapshot,facts:readonly PublicFinancialFact[],derived:readonly PublicFinancialDerivation[],viewedAt:string,review:DataFreshnessModel['review'],readiness:readonly TickerScoringReadiness[]|null):DataFreshnessModel{
 instant(viewedAt);const r=s.request,universe=r.references.find(v=>v.kind==='UNIVERSE')!,sectors=r.references.find(v=>v.kind==='SECTOR')!;
 const findings=(JSON.parse(s.manifest) as {findings:readonly {requirement?:{securityId:string;itemId:string;reportingScope:string;periodStart:string;periodEnd:string};code:string}[]}).findings;
 const securities=universe.content.map(securityId=>{
  const requirements=r.requirements.filter(q=>q.securityId===securityId).map(q=>{
   const selectedIds=facts.filter(f=>f.selected&&f.securityId===securityId&&f.itemId===q.itemId&&f.reportingScope===q.reportingScope&&f.periodStart===q.periodStart&&f.periodEnd===q.periodEnd).map(f=>f.id);
   const end=Date.parse(q.periodEnd+'T00:00:00.000Z'),age=Date.parse(viewedAt)-end,limit=q.maxAgeDays*86400000;
   const finding=findings.find(f=>f.requirement&&f.requirement.securityId===securityId&&f.requirement.itemId===q.itemId&&f.requirement.reportingScope===q.reportingScope&&f.requirement.periodStart===q.periodStart&&f.requirement.periodEnd===q.periodEnd)?.code??null;
   return {...q,selectedIds,finding,freshnessAtCutoff:selectedIds.length!==1?'MISSING_OR_BLOCKED' as const:Date.parse(r.fundamentalCutoff)-end<=limit?'WITHIN_PINNED_THRESHOLD' as const:'EXCEEDS_PINNED_THRESHOLD' as const,ageDaysAtView:Math.floor(age/86400000),freshnessAtView:selectedIds.length!==1?'MISSING_OR_BLOCKED' as const:age<0?'FUTURE_PERIOD' as const:age<=limit?'WITHIN_PINNED_THRESHOLD' as const:'EXCEEDS_PINNED_THRESHOLD' as const};
  });
  return {securityId,ticker:facts.find(f=>f.securityId===securityId)?.ticker??securityId,sector:sectors.content.find(v=>v.startsWith(securityId+':'))?.slice(securityId.length+1)??null,covered:requirements.length>0&&requirements.every(q=>q.selectedIds.length===1),readiness:readiness?.find(v=>v.securityId===securityId)??null,requirements};
 });
 return deepFreeze({...emptyDataFreshness(viewedAt),status:'VERIFIED',snapshot:{runId:r.runId,contentHash:s.contentHash,scope:r.scope,mode:r.mode,builtAt:r.builtAt,decisionAsOf:r.decisionAsOf,systemKnownAt:r.systemKnownAt,fundamentalCutoff:r.fundamentalCutoff,marketCutoff:r.marketCutoff,requirementsVersion:r.requirementsVersion,universeVersion:universe.version,universeKnownAt:universe.knownAt,blockers:s.blockers},review,counts:{universe:universe.content.length,coveredSecurities:securities.filter(v=>v.covered).length,selectedFacts:facts.filter(f=>f.selected).length,dataReady:readiness&&review.algorithm==='strict-canonical-m3-readiness-v2'?readiness.filter(v=>v.dataReady).length:null,scoringReady:readiness?readiness.filter(v=>v.readyForScoring).length:null},securities,facts,derived});
}
