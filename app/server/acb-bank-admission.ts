import 'server-only';
import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {PreScoringContext} from '@/ports/pre-scoring-datasets';
import type {CurrentMarketValue,CurrentShareValue} from '@/infrastructure/source-admission/current-dataset';
import {GovernedBankAdmissions,bankVersionApprovalHash} from '@/infrastructure/source-admission/current-bank-admission';
import {CurrentBankFinancialDatasets} from '@/infrastructure/source-admission/current-bank-dataset';
import {sourceBytes,type SourcePin} from '@/infrastructure/source-admission/registry';
import {VersionStandingAuthority,type VersionAuthorityBindings} from '@/infrastructure/source-admission/versioned-authority';
import {PrismaBoundaryStore} from '@/infrastructure/repositories/market-boundary';
import {assertStandingTrust,buildCafefCandidate,consumeCafefValuation,type StandingProfile} from '@/infrastructure/market-boundary/cafef-standing';
import {ingestCafef} from './cafef-standing-services';
import {withApprovedAcbF1Root} from './acb-f1-runtime';

const ACB_ROUTE={
 path:'docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/bank-admission/ACB_ADMISSION_ROUTE_REGISTERED.json',
 sha256:'029a57fe263ae00f295f6da8d3b6372ded21d292664505e90ebc03cdde43436d',
};
interface AdmissionRoute {
 contract:string; status:string; approvalHash:string; recordedAt:string;
 scope:{ticker:string;securityId:string;exchange:'HOSE';sector:'BANK';referenceDate:string};
 version:SourcePin;requirements:SourcePin;shares:SourcePin;
 market:{profile:SourcePin;trustedReferences:SourcePin;registry:SourcePin;capture:SourcePin;receipt:SourcePin};
 scoringAuthorized:false;productionActivationGranted:false;
}
function requireAcb(condition:unknown,reason:string):asserts condition{
 if(!condition)throw Error(reason);
}

/** Operator composition. Calling this function only preflights sources. No automatic task runs. */
export function registeredAcbBankAdmission(db:PrismaClient,root=process.cwd(),clock={now:()=>new Date().toISOString()}){
 return composeAcbBankAdmission(db,root,root,clock);
}

/** Explicit successor invocation; legacy route and registry keep their pinned bytes. */
export async function withRegisteredAcbF1Admission<T>(db:PrismaClient,root:string,version:SourcePin,
 run:(route:ReturnType<typeof composeAcbBankAdmission>)=>Promise<T>,clock={now:()=>new Date().toISOString()}){
 return withApprovedAcbF1Root(root,version,clock.now(),marketRoot=>
  run(composeAcbBankAdmission(db,root,marketRoot,clock)));
}
function composeAcbBankAdmission(db:PrismaClient,root:string,marketRoot:string,clock:{now():string}){
 const json=<T>(pin:SourcePin):T=>JSON.parse(sourceBytes(root,pin).toString()) as T;
 const route=json<AdmissionRoute>(ACB_ROUTE),subject=route.scope;
 requireAcb(route.contract==='registered-bank-admission-route-v1'&&route.status==='REGISTERED'&&
  route.scoringAuthorized===false&&route.productionActivationGranted===false&&
  subject.ticker==='ACB'&&subject.exchange==='HOSE'&&subject.sector==='BANK'&&
  subject.referenceDate==='2026-10-30'&&subject.securityId==='658fafbe-65b3-4176-999f-d4d32e1bd838',
  'ACB_ADMISSION_ROUTE_SCOPE');
 const version=json<Parameters<typeof bankVersionApprovalHash>[0]>(route.version);
 requireAcb(version.status==='APPROVED'&&version.recordedAt===route.recordedAt&&
  bankVersionApprovalHash(version)===route.approvalHash,'ACB_ADMISSION_VERSION_BINDING');
 const context:PreScoringContext={ticker:subject.ticker,securityId:subject.securityId,
  economicCutoff:subject.referenceDate,knownAt:route.recordedAt,purpose:'CURRENT_FORMAL_VALUATION'};
 const verifyContext=(c:PreScoringContext)=>requireAcb(c.ticker===context.ticker&&c.securityId===context.securityId&&
  c.economicCutoff===context.economicCutoff&&c.purpose===context.purpose&&c.knownAt>=context.knownAt,
  'ACB_DATASET_CONTEXT');

 const profile=json<StandingProfile>(route.market.profile);
 const marketReceipt=json<{status:string;ticker:string;date:string;securityId:string;knownAt:string;
  marketHash:string;responseHash:string}>(route.market.receipt);
 requireAcb(marketReceipt.status==='PASS_F1_ADMITTED_CONSUMED_ISOLATED'&&marketReceipt.ticker===context.ticker&&
  marketReceipt.securityId===context.securityId&&marketReceipt.date===context.economicCutoff&&
  marketReceipt.knownAt<=context.knownAt,'ACB_F1_RECEIPT_SCOPE');
 const trusted=json<Omit<VersionAuthorityBindings,'registry'>>(route.market.trustedReferences);
 const marketAuthority=new VersionStandingAuthority(marketRoot,()=>route.market.registry,{
  ...trusted,catalogs:{cafef:[route.market.capture],apiReceipts:[],pdfReceipts:[],pdfExtractions:[],financialSemantics:[]},
 });
 const candidate=buildCafefCandidate(marketRoot,profile,{ticker:subject.ticker,exchange:subject.exchange,
  date:context.economicCutoff,knownAt:marketReceipt.knownAt,raw:route.market.capture});
 const trust=marketAuthority.marketTrust();
 assertStandingTrust(marketRoot,candidate,trust);
 requireAcb(candidate.market.contentHash===marketReceipt.marketHash&&
  candidate.provenance.responseSha256===marketReceipt.responseHash,'ACB_F1_REPLAY_HASH');
 const repo=new PrismaBoundaryStore(db,clock);

 const shares=async(c:PreScoringContext):Promise<CurrentShareValue>=>{
  verifyContext(c);
  const review=json<{ticker:string;cutoff:string;inventoryPins:SourcePin[];reviewedPotentialEvents:SourcePin[];
   shares:{value:string;anchor:string;proposedAsOf:string;status:CurrentShareValue['status'];
    coverageComplete:boolean;reviewWindow:string[];
    anchorEvidence:{pdfPath:string;pdfSha256:string;physicalPage:number;outstandingCommonShares:string}}}>(route.shares);
  const s=review.shares,a=s.anchorEvidence;
  requireAcb(review.ticker===c.ticker&&review.cutoff===c.economicCutoff&&s.proposedAsOf===c.economicCutoff&&
   s.anchor==='2026-09-30'&&s.reviewWindow.join('/')==='2026-10-01/2026-10-30'&&
   s.status==='CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS'&&
   a.physicalPage===24&&s.value===a.outstandingCommonShares&&review.inventoryPins.length>0&&
   review.reviewedPotentialEvents.length>0,'ACB_SHARE_REVIEW_SCOPE');
  for(const pin of [{path:a.pdfPath,sha256:a.pdfSha256},...review.inventoryPins,...review.reviewedPotentialEvents])
   sourceBytes(root,pin);
  return {ticker:c.ticker,securityId:c.securityId,asOf:c.economicCutoff,value:s.value,unit:'SHARES',
   status:s.status,lineage:{review:route.shares,sourcePage:a.physicalPage,coverageComplete:s.coverageComplete}};
 };
 const market=async(c:PreScoringContext):Promise<CurrentMarketValue>=>{
  verifyContext(c);
  const result=await consumeCafefValuation(marketRoot,candidate,trust,repo,{
   mode:'HISTORICAL',requestedAt:candidate.market.body.requestedAsOf,knownAt:marketReceipt.knownAt,
   now:marketReceipt.knownAt,purpose:'VALUATION',securityIds:[c.securityId],universe:candidate.market.body.universe,
  },{now:()=>marketReceipt.knownAt});
  const obs=result.observation;
  requireAcb(obs.securityId===c.securityId&&obs.adjustment==='RAW'&&obs.unit==='VND_PER_SHARE','ACB_RAW_CLOSE_SCOPE');
  return {ticker:c.ticker,securityId:c.securityId,date:c.economicCutoff,value:obs.value,unit:'VND_PER_SHARE',
   field:'GiaDongCua',lineage:{raw:route.market.capture,marketHash:marketReceipt.marketHash,receipt:route.market.receipt}};
 };
 const admissions=new GovernedBankAdmissions(db,root,()=>route.version,clock);
 const datasets=new CurrentBankFinancialDatasets(db,root,admissions,{requirements:route.requirements,market,shares});
 return {
  scope:context,
  async materialize(){
   await shares(context);
   sourceBytes(root,route.requirements);
   const admission=await admissions.ingest(context);
   await ingestCafef(marketRoot,repo,'acb-f1-20261030',[candidate],trust);
   const binding=await datasets.bind(admission.id,context);
   const readback=await datasets.consume(binding.id,{...context,knownAt:clock.now()});
   requireAcb(readback.datasetHash===binding.datasetHash,'ACB_DATASET_READBACK_HASH');
   return {admissionId:admission.id,datasetId:binding.id,datasetHash:readback.datasetHash,
    readyForScoring:false};
  },
  async consume(datasetId:string,c:PreScoringContext){
   verifyContext(c);
   return datasets.consume(datasetId,c);
  },
 };
}
