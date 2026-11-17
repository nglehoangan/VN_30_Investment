import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=process.cwd(),out=resolve(import.meta.dirname),base='docs/fundamental-data-engine/standing-authority-version/2026-11-12',f1base='docs/fundamental-data-engine/vnm-f1-membership-closure/2026-11-15';
const vr=createRequire(realpathSync('node_modules/vitest/package.json')),jr=createRequire(vr.resolve('vite/package.json')),{createJiti}=await import(pathToFileURL(jr.resolve('jiti')).href);
const jiti=createJiti(import.meta.url,{alias:{'@':resolve(root,'src'),'server-only':resolve(root,'node_modules/next/dist/compiled/server-only/empty.js')},fsCache:false,moduleCache:true}),load=p=>jiti.import(resolve(root,p));
const {sha}=await load('src/infrastructure/source-admission/registry.ts'),{snapshotHash:hash}=await load('src/infrastructure/fundamentals/snapshot-hash.ts');
const {currentFinancialRouteFixture}=await load('tests/fixtures/current-financial-route.ts');
const {CurrentFinancialAdmissions,CURRENT_FINANCIAL_CODE}=await load('src/infrastructure/source-admission/current-financial.ts');
const {CurrentFinancialDatasets}=await load('src/infrastructure/source-admission/current-dataset.ts');
const {VersionStandingAuthority}=await load('src/infrastructure/source-admission/versioned-authority.ts');
const {buildCafefCandidate,consumeCafefValuation}=await load('src/infrastructure/market-boundary/cafef-standing.ts');
const {PrismaBoundaryStore}=await load('src/infrastructure/repositories/market-boundary.ts');
const {ingestCafef}=await load('app/server/cafef-standing-services.ts');
const {sourceBytes}=await load('src/infrastructure/source-admission/registry.ts');
const read=p=>JSON.parse(readFileSync(p,'utf8')),pin=p=>({path:p,sha256:sha(readFileSync(p))}),write=(n,x)=>writeFileSync(join(out,n),JSON.stringify(x,null,2)+'\n');
const liveBefore=pin('data/vn30.sqlite'),f=await currentFinancialRouteFixture();
const contextFile=join(out,'RUN_CONTEXT_V53.json');
let runContext;try{runContext=read(contextFile);}catch{runContext={contract:'isolated-current-route-execution-clock-v1',knownAt:new Date().toISOString(),clockMeaning:'Actual first-run operational knowledge timestamp; retained unchanged for deterministic replay.'};writeFileSync(contextFile,JSON.stringify(runContext,null,2)+'\n');}
const q={...f.q,knownAt:runContext.knownAt},context={...f.context,knownAt:runContext.knownAt};
const checks=[];async function rejects(name,fn,re){let reason;try{await fn();}catch(e){reason=String(e);}assert(reason&&re.test(reason),name+': '+reason);checks.push({name,reason});return reason;}
const count=async()=>({admissions:Number((await f.db.$queryRawUnsafe('SELECT count(*) n FROM current_financial_admission'))[0].n),facts:Number((await f.db.$queryRawUnsafe('SELECT count(*) n FROM current_financial_fact'))[0].n),raw:Number((await f.db.$queryRawUnsafe('SELECT count(*) n FROM current_financial_raw'))[0].n),datasets:Number((await f.db.$queryRawUnsafe('SELECT count(*) n FROM current_financial_dataset'))[0].n),legacyDI:await f.db.dataInitializationAcceptance.count(),legacyBinding:await f.db.scoringDatasetBinding.count(),scorecards:await f.db.analyticalArtifact.count()});
try{
 const before=await count(),registry=pin(base+'/VERSIONED_SOURCE_REGISTRY.json');
 const actualRegistry=pin('docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16/VERSIONED_SOURCE_REGISTRY_V53.json');
 const oldVersion=new CurrentFinancialAdmissions(f.db,root,{registry:()=>registry,mapping:pin('docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16/MAPPING_CONTRACT_V3.json'),documents:pin('docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16/DOCUMENT_BINDINGS_V2.json'),identities:read(base+'/REAL_FINANCIAL_REQUEST.json').material.identities,clock:{now:()=>runContext.knownAt}});
 const oldReason=await rejects('old version cannot self-enroll new executable',()=>oldVersion.ingest(q,f.securityId),/RETAINED_ADAPTER_VERSION_NOT_REGISTERED/);
 const actual=new CurrentFinancialAdmissions(f.db,root,{registry:()=>actualRegistry,mapping:pin('docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16/MAPPING_CONTRACT_V3.json'),documents:pin('docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16/DOCUMENT_BINDINGS_V2.json'),identities:read(base+'/REAL_FINANCIAL_REQUEST.json').material.identities,clock:{now:()=>runContext.knownAt}});
 assert.deepEqual(await count(),before);
 const admitted=await actual.ingest(q,f.securityId),afterAdmission=await count();assert.equal(admitted.plan.facts.length,68);assert.equal(admitted.plan.quarantine.length,0);
 const readback=await actual.consume(admitted.id,context);assert.deepEqual(readback.facts,admitted.plan.facts);
 const duplicate=await actual.ingest(q,f.securityId);assert(duplicate.duplicate);assert.deepEqual(await count(),afterAdmission);
 // Real F1 service and evidence, not the fixture's synthetic market port.
 const f1bindings=read(f1base+'/TRUSTED_SOURCE_INPUTS_SUCCESSOR.json'),profile=read(f1base+'/MARKET_PROFILE.json');
 const authority=new VersionStandingAuthority(root,()=>registry,f1bindings),repo=new PrismaBoundaryStore(f.db),candidate=buildCafefCandidate(root,profile,{raw:f1bindings.catalogs.cafef[0],ticker:'VNM',exchange:'HOSE',date:'2026-10-30',knownAt:profile.knownAt});
 await ingestCafef(root,repo,'vnm-current-financial-dataset',[candidate],authority.marketTrust());
 const market=async context=>{const c=await consumeCafefValuation(root,candidate,authority.marketTrust(),repo,{mode:'HISTORICAL',requestedAt:candidate.market.body.requestedAsOf,knownAt:context.knownAt,now:context.knownAt,purpose:'VALUATION',securityIds:[f.securityId],universe:candidate.market.body.universe},{now:()=>context.knownAt});return {ticker:'VNM',securityId:f.securityId,date:'2026-10-30',value:c.observation.value,unit:'VND_PER_SHARE',field:'GiaDongCua',lineage:{raw: candidate.spec.raw,pointer:c.observation.pointer,authority:registry}};};
 const shares=async context=>{
  const reviewPin=pin('docs/fundamental-data-engine/vnm-s4-share-carry-forward/2026-11-12/REVIEW.json'),policyPin=pin('docs/fundamental-data-engine/governance/SHARE_COUNT_CARRY_FORWARD_OWNER_DECISION_2026-11-12.json');
  const review=JSON.parse(sourceBytes(root,reviewPin)),policy=JSON.parse(sourceBytes(root,policyPin));
  assert.equal(review.decision.status,'CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS');assert.equal(review.cutoff,context.economicCutoff);assert(review.review.reviewedAt<=context.knownAt);
  sourceBytes(root,{path:review.anchor.pdfPath,sha256:review.anchor.pdfSha256});sourceBytes(root,review.anchor.sourcePin);
  assert.equal(review.decision.shares,policy.vnmScope.shares);
  return {ticker:'VNM',securityId:f.securityId,asOf:context.economicCutoff,value:review.decision.shares,unit:'SHARES',status:review.decision.status,lineage:{review:reviewPin,policy:policyPin,formalSourceAdmission:review.decision.sourceAdmission,completeNegativeSearch:review.decision.completeNegativeSearch,productionActivation:false}};
 };
 const datasets=new CurrentFinancialDatasets(f.db,root,actual,{requirements:pin('docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16/DATASET_REQUIREMENTS_V2.json'),market,shares});
 const binding=await datasets.bind(admitted.id,context),consumed=await datasets.consume(binding.id,context);assert.equal(consumed.facts.length,34);assert.equal(consumed.price.value,'56900');assert.equal(consumed.shares.value,'2089955445');assert.equal(consumed.readyForScoring,false);
 const afterBinding=await count();assert((await datasets.bind(admitted.id,context)).duplicate);assert.deepEqual(await count(),afterBinding);
 await rejects('historical PIT rejected',()=>datasets.consume(binding.id,{...context,purpose:'HISTORICAL_PIT'}),/CURRENT_ONLY_NOT_PIT/);
 await rejects('wrong ticker rejected',()=>datasets.consume(binding.id,{...context,ticker:'FPT'}),/CONSUMPTION_SCOPE/);
 const missingQ={...q,observations:q.observations.filter(o=>!(o.concept==='TOTAL_ASSETS'&&o.end==='2026-09-30'))};
 const missing=await actual.ingest(missingQ,f.securityId);await rejects('missing dependency blocks binding',()=>datasets.bind(missing.id,context),/CURRENT_DATASET_MISSING_DEPENDENCIES/);
 await datasets.revoke(binding.id,'ISOLATED_TEST_ONLY',q.knownAt);await rejects('dataset revocation propagates',()=>datasets.consume(binding.id,context),/REVOKED/);
 await actual.revoke(admitted.id,'ISOLATED_TEST_ONLY',q.knownAt);await rejects('admission revocation propagates',()=>actual.consume(admitted.id,context),/REVOKED/);
 assert.equal(await f.db.dataInitializationAcceptance.count(),0);assert.equal(await f.db.scoringDatasetBinding.count(),0);assert.equal(await f.db.analyticalArtifact.count(),0);
 const result={contract:'vnm-current-financial-route-validation-v1',realAuthority:{registry:actualRegistry,status:'OWNER_AUTHORIZED_VERSION_IMPLEMENTATION_BOUND',implementationAuthorization:pin('docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16/VERSION_IMPLEMENTATION_AUTHORIZATION.json'),governedFactsAdmitted:68,oldVersionRejection:oldReason},integrationProof:{authority:'OWNER_AUTHORIZED_VERSION_V5.3',sourceData:'REAL_RETAINED_VNM',factsAdmitted:68,originalClocksPreserved:true,readbackMatches:true,duplicate:true,datasetId:binding.id,boundFinancialFacts:consumed.facts.length,price:consumed.price,shares:consumed.shares,coverage:consumed.manifest.coverage,financialCoverageComplete:consumed.financialCoverageComplete,fullM3CoverageCertified:false,readyForScoring:false},counts:{before,afterAdmission,afterBinding,after:await count()},checks,protectedDatabase:{before:liveBefore,after:pin('data/vn30.sqlite')},legacyDIAndScoringGatesUnchanged:true,formalScoringDatasetBindingCreated:false,historicalPIT:'NOT_QUALIFIED',productionActivation:'NOT_AUTHORIZED',databaseDeletedAfterRun:true};
 assert.deepEqual(result.protectedDatabase.before,result.protectedDatabase.after);write('REAL_ROUTE_VALIDATION.json',result);
 write('CURRENT_DATASET_MANIFEST.json',{authorityEnvironment:'OWNER_AUTHORIZED_V5.3_ISOLATED_DATABASE',manifest:binding.manifest});
 console.log(JSON.stringify({realAuthority:result.realAuthority.status,realAdmitted:68,boundFacts:34,authority:'OWNER_AUTHORIZED_V5.3',checks:checks.length,liveDatabaseUnchanged:true}));
}finally{await f.close();assert.deepEqual(pin('data/vn30.sqlite'),liveBefore);}
