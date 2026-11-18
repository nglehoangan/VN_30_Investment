import 'server-only';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {instant} from '@/shared/time';
import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {AiReviewTrustBinding} from './current-review';
import {sourceBytes,sha} from './registry';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {CurrentFinancialAdmissions} from './current-financial';
import {CurrentFinancialDatasets} from './current-dataset';
import {CurrentFinancialCoverage} from './current-coverage';
import {CurrentPreScoringBindings} from './pre-scoring-binding';
import {CurrentPurposeScoringConsumer} from './current-scoring-consumer';
import {CurrentPurposeScoring,PinnedCurrentAssessmentAdoption} from './current-scoring';
import {PinnedCurrentExecutableAuthority} from './current-scoring-authority';
import {PrismaMethodologyRegistry} from '@/infrastructure/repositories/methodology-registry';
import {VersionStandingAuthority} from './versioned-authority';
import {PrismaBoundaryStore} from '@/infrastructure/repositories/market-boundary';
import {buildCafefCandidate,consumeCafefValuation} from '@/infrastructure/market-boundary/cafef-standing';

const REGISTRATION={path:'docs/fundamental-data-engine/vnm-production-materialization/2026-11-18/superseding-execution/CURRENT_REGISTRATION.json',sha256:'511d18a776dc4a91eb33d853822063f78f4e6898eeb4956d92f86fd151dc6312'};
/** Source qualification reuses the existing services. This view can never insert a missing receipt. */
function readOnly(db:PrismaClient):PrismaClient{
 return new Proxy(db,{get(target,key){
  if(key==='$executeRawUnsafe'||key==='$executeRaw')return async()=>{throw Error('CURRENT_READER_WRITE_FORBIDDEN');};
  if(key==='$transaction')return async(fn:(tx:PrismaClient)=>Promise<unknown>)=>target.$transaction(tx=>fn(readOnly(tx as PrismaClient)));
  const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;
 }});
}
/** Exact previously registered VNM reader. No fetch, ingestion, score(), or caller-selected review. */
export function registeredCurrentScoreReader(client:PrismaClient,root=process.cwd()):Pick<CurrentPurposeScoring,'find'>{
 const db=readOnly(client),read=(path:string)=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
 const pin=(path:string)=>({path,sha256:sha(readFileSync(resolve(root,path)))});
 const registration=JSON.parse(sourceBytes(root,REGISTRATION).toString()) as {status:string;reviewBinding:AiReviewTrustBinding;reviewHash:string;assessmentPacket:{path:string;sha256:string};executable:{path:string;sha256:string}};
 if(registration.status!=='REGISTERED'||!registration.reviewBinding)throw Error('CURRENT_REGISTRATION_REQUIRED');
 const packet=JSON.parse(sourceBytes(root,registration.assessmentPacket).toString()),input=packet.input;
 if(hash(input.review)!==registration.reviewHash)throw Error('CURRENT_REGISTERED_REVIEW_MISMATCH');
 const route='docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16',coverageBase='docs/fundamental-data-engine/vnm-f2-coverage-closure/2026-11-16',base='docs/fundamental-data-engine/standing-authority-version/2026-11-12',f1base='docs/fundamental-data-engine/vnm-f1-membership-closure/2026-11-15';
 const selected=read(route+'/SELECTED_MAPPING_IDS_V2.json'),securityId=selected.securityId;
 const admissions=new CurrentFinancialAdmissions(db,root,{registry:()=>pin(coverageBase+'/VERSIONED_SOURCE_REGISTRY_V6.json'),mapping:pin(route+'/MAPPING_CONTRACT_V3.json'),documents:pin(route+'/DOCUMENT_BINDINGS_V2.json'),identities:read(base+'/REAL_FINANCIAL_REQUEST.json').material.identities,clock:{now:()=>input.knownAt}});
 const registry=pin(base+'/VERSIONED_SOURCE_REGISTRY.json'),bindings=read(f1base+'/TRUSTED_SOURCE_INPUTS_SUCCESSOR.json'),profile=read(f1base+'/MARKET_PROFILE.json'),authority=new VersionStandingAuthority(root,()=>registry,bindings),store=new PrismaBoundaryStore(db);
 const candidate=buildCafefCandidate(root,profile,{raw:bindings.catalogs.cafef[0],ticker:'VNM',exchange:'HOSE',date:'2026-10-30',knownAt:profile.knownAt});
 const datasets=new CurrentFinancialDatasets(db,root,admissions,{requirements:pin(route+'/DATASET_REQUIREMENTS_V2.json'),market:async context=>{
  const consumed=await consumeCafefValuation(root,candidate,authority.marketTrust(),store,{mode:'HISTORICAL',requestedAt:candidate.market.body.requestedAsOf,knownAt:context.knownAt,now:context.knownAt,purpose:'VALUATION',securityIds:[securityId],universe:candidate.market.body.universe},{now:()=>instant(context.knownAt)});
  return {ticker:'VNM',securityId,date:'2026-10-30',value:consumed.observation.value,unit:'VND_PER_SHARE',field:'GiaDongCua',lineage:{raw:candidate.spec.raw,pointer:consumed.observation.pointer,authority:registry}};
 },shares:async context=>{
  const reviewPin=pin('docs/fundamental-data-engine/vnm-s4-share-carry-forward/2026-11-12/REVIEW.json'),policyPin=pin('docs/fundamental-data-engine/governance/SHARE_COUNT_CARRY_FORWARD_OWNER_DECISION_2026-11-12.json');
  const review=JSON.parse(sourceBytes(root,reviewPin).toString()),policy=JSON.parse(sourceBytes(root,policyPin).toString());
  if(review.decision.status!=='CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS'||review.cutoff!==context.economicCutoff||review.review.reviewedAt>context.knownAt||review.decision.shares!==policy.vnmScope.shares)throw Error('CURRENT_REGISTERED_SHARE_LINEAGE');
  sourceBytes(root,{path:review.anchor.pdfPath,sha256:review.anchor.pdfSha256});sourceBytes(root,review.anchor.sourcePin);
  return {ticker:'VNM',securityId,asOf:context.economicCutoff,value:review.decision.shares,unit:'SHARES',status:review.decision.status,lineage:{review:reviewPin,policy:policyPin,formalSourceAdmission:review.decision.sourceAdmission,completeNegativeSearch:review.decision.completeNegativeSearch,productionActivation:false}};
 }});
 const coverage=new CurrentFinancialCoverage(db,root,admissions,datasets,{registry:()=>pin(coverageBase+'/VERSIONED_SOURCE_REGISTRY_V6.json'),debtReview:pin(coverageBase+'/DEBT_SOURCE_REVIEW.json'),history:pin(coverageBase+'/RETAINED_ADMITTED_HISTORY.json'),research:pin(coverageBase+'/RESEARCH_ADOPTION_CATALOG.json'),clock:{now:()=>input.knownAt}});
 const consumer=new CurrentPurposeScoringConsumer(db,new CurrentPreScoringBindings(coverage),coverage,datasets);
 const adoption=new PinnedCurrentAssessmentAdoption(root,{reference:'VNM_EXACT_CURRENT_REVIEW_PROPOSAL',...registration.assessmentPacket},[registration.reviewBinding]);
 const scorer=new CurrentPurposeScoring(db,new PrismaMethodologyRegistry(db),consumer,adoption,new PinnedCurrentExecutableAuthority(root,registration.executable,{now:()=>input.knownAt}));
 return {find:id=>scorer.find(id)};
}
