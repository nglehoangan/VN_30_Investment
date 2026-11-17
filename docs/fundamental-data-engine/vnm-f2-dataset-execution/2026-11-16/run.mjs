// Actual lifecycle against a fresh migrated SQLite DB. Never opens the live DB for writing.
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=process.cwd(),out=resolve(import.meta.dirname),base='docs/fundamental-data-engine/standing-authority-version/2026-11-12',mapping='docs/fundamental-data-engine/vnm-f2-mapping/2026-11-16';
const read=p=>JSON.parse(readFileSync(p,'utf8')),write=(name,data)=>writeFileSync(join(out,name),JSON.stringify(data,null,2)+'\n');
const vr=createRequire(realpathSync('node_modules/vitest/package.json')),jr=createRequire(vr.resolve('vite/package.json')),{createJiti}=await import(pathToFileURL(jr.resolve('jiti')).href);
const jiti=createJiti(import.meta.url,{alias:{'@':resolve(root,'src'),'server-only':resolve(root,'node_modules/next/dist/compiled/server-only/empty.js')},fsCache:false,moduleCache:true}),load=p=>jiti.import(resolve(root,p));
const {sha}=await load('src/infrastructure/source-admission/registry.ts'),{snapshotHash:hash}=await load('src/infrastructure/fundamentals/snapshot-hash.ts');
const pin=path=>({path,sha256:sha(readFileSync(path))});
const dbBefore=pin('data/vn30.sqlite'),at='2026-11-16T06:30:00.000Z';
const {testDatabase}=await load('docs/fundamental-data-engine/vnm-formal-scoring-step2/2026-11-14/native-test-database.ts');
const {VersionStandingAuthority}=await load('src/infrastructure/source-admission/versioned-authority.ts');
const {RetainedFinancialAdmissionAdapter}=await load('src/infrastructure/source-admission/retained-mapping.ts');
const {verifyRetainedAdapterAuthority}=await load('src/infrastructure/source-admission/retained-authority-gate.ts');
const {ingestStandingFinancial,consumeStandingFinancial,revokeStandingFinancial}=await load('app/server/unified-admission-services.ts');
const {qualifyFinancialPlan}=await load('src/infrastructure/source-admission/financial.ts');
const {admissionEvent}=await load('src/infrastructure/repositories/unified-admission.ts');
const {PrismaScoringDatasets}=await load('src/infrastructure/repositories/scoring-datasets.ts');
const {PrismaFundamentals}=await load('src/infrastructure/repositories/fundamentals.ts'),{PrismaFundamentalSnapshot}=await load('src/infrastructure/repositories/fundamental-snapshot.ts'),{PrismaFundamentalDerivation}=await load('src/infrastructure/repositories/fundamental-derivation.ts');
const {loadCanonicalRegistry}=await load('src/infrastructure/fundamentals/canonical-registry.ts');
const {PrismaBoundaryStore}=await load('src/infrastructure/repositories/market-boundary.ts');
const {buildCafefCandidate,consumeCafefValuation}=await load('src/infrastructure/market-boundary/cafef-standing.ts');
const {ingestCafef}=await load('app/server/cafef-standing-services.ts');
const registry=pin(base+'/VERSIONED_SOURCE_REGISTRY.json'),authority=new VersionStandingAuthority(root,()=>registry,read(base+'/TRUSTED_SOURCE_INPUTS.json'));
const q=read(base+'/REAL_FINANCIAL_REQUEST.json');q.knownAt=at;q.ingestedAt=at;
const adapter=new RetainedFinancialAdmissionAdapter(root,pin(mapping+'/MAPPING_CONTRACT.json'));
const observations=adapter.retainedObservations(),plan=adapter.plan({ticker:'VNM',economicCutoff:'2026-10-30',knownAt:at,purpose:'CURRENT_FORMAL_VALUATION',observations});
assert.equal(plan.accepted.length,294);assert.equal(plan.quarantine.length,0);
const checks=[];
async function rejects(name,fn,pattern){let reason;try{await fn();}catch(e){reason=String(e)+(e?.issues?' | '+e.issues.map(i=>i.reason).join('|'):'');}assert(reason&&pattern.test(reason),name+':'+reason);checks.push({name,status:'PASS',reason});return reason;}
const fixture=await testDatabase(),db=fixture.client,clock={now:()=>at};
const counts=async()=>({admissionRuns:await db.fundamentalAdmissionRun.count(),rawCaptures:await db.fundamentalRawCapture.count(),events:Number((await db.$queryRawUnsafe('SELECT count(*) n FROM source_admission_event'))[0].n),marketRecords:await db.marketBoundaryRecord.count(),snapshots:await db.fundamentalSnapshotRun.count(),acceptances:await db.dataInitializationAcceptance.count(),bindings:await db.scoringDatasetBinding.count(),scorecards:await db.analyticalArtifact.count()});
try{
 const before=await counts();
 // Reuse accepted successor dated F1 references; never reopen membership.
 const f1base='docs/fundamental-data-engine/vnm-f1-membership-closure/2026-11-15';
 const bindings=read(f1base+'/TRUSTED_SOURCE_INPUTS_SUCCESSOR.json'),profile=read(f1base+'/MARKET_PROFILE.json');
 const f1authority=new VersionStandingAuthority(root,()=>registry,bindings),candidate=buildCafefCandidate(root,profile,{raw:bindings.catalogs.cafef[0],ticker:'VNM',exchange:'HOSE',date:'2026-10-30',knownAt:profile.knownAt}),market=new PrismaBoundaryStore(db);
 const f1=await ingestCafef(root,market,'vnm-current-dataset-execution',[candidate],f1authority.marketTrust());assert.equal(f1.accepted.length,1);
 const f1consumed=await consumeCafefValuation(root,candidate,f1authority.marketTrust(),market,{mode:'HISTORICAL',requestedAt:candidate.market.body.requestedAsOf,knownAt:profile.knownAt,now:profile.knownAt,purpose:'VALUATION',securityIds:[q.securityId],universe:candidate.market.body.universe},{now:()=>profile.knownAt});assert.equal(f1consumed.observation.value,'56900');
 const actual=await ingestStandingFinancial(db,root,q,authority,clock),afterAdmission=await counts();
 const duplicate=await ingestStandingFinancial(db,root,q,authority,clock);assert(duplicate.duplicate);assert.deepEqual(await counts(),afterAdmission);
 const financial=await consumeStandingFinancial(db,root,actual.id,authority,{...q,purpose:'CURRENT_FORMAL_VALUATION'},clock);
 const qualified=qualifyFinancialPlan(root,q,authority);assert.equal(financial.evidence.length,1);assert.equal(financial.evidence[0].value,qualified.evidence[0].value);
 const native=qualified.transforms[0];assert.equal(native.normalizedValue,financial.evidence[0].value);
 const broadReason=await rejects('expanded adapter cannot inherit v4 executable approval',()=>verifyRetainedAdapterAuthority(root,registry,at),/RETAINED_ADAPTER_VERSION_NOT_REGISTERED/);
 // Persist/read the complete expanded payload as QUARANTINE, never as an admitted canonical snapshot.
 const target='retained-probe:'+hash(plan),probeId=await admissionEvent(db,'QUARANTINE',target,at,{reason:broadReason,plan});
 const afterProbe=await counts();await admissionEvent(db,'QUARANTINE',target,at,{reason:broadReason,plan});assert.deepEqual(await counts(),afterProbe);
 const rows=await db.$queryRawUnsafe('SELECT body,body_hash FROM source_admission_event WHERE id=?',probeId);assert.equal(sha(rows[0].body),rows[0].body_hash);assert.deepEqual(JSON.parse(rows[0].body).details.plan,plan);
 await rejects('CURRENT_ONLY cannot become PIT',()=>consumeStandingFinancial(db,root,actual.id,authority,{...q,purpose:'HISTORICAL_PIT'},clock),/CURRENT_ONLY_NOT_PIT/);
 await rejects('cross ticker consumer',()=>consumeStandingFinancial(db,root,actual.id,authority,{...q,ticker:'FPT',purpose:'CURRENT_FORMAL_VALUATION'},clock),/FINANCIAL_CONSUMPTION_SCOPE/);
 await rejects('changed raw hash',()=>ingestStandingFinancial(db,root,{...q,material:{...q.material,sourceBindings:q.material.sourceBindings.map(p=>p.sha256===native.rawHash?{...p,sha256:'0'.repeat(64)}:p)}},authority,clock),/SOURCE_HASH_MISMATCH/);
 const datasets=new PrismaScoringDatasets(db,new PrismaFundamentalSnapshot(db),new PrismaFundamentals(db),new PrismaFundamentalDerivation(db),loadCanonicalRegistry());
 const readinessReason=await rejects('actual scoring consumer cannot resolve absent DI acceptance',()=>datasets.readiness('vnm-current-dataset-unaccepted'),/DI_ACCEPTANCE_REQUIRED/);
 const retainedScoreInput=read('docs/fundamental-data-engine/vnm-final-s1-s5-scoring/2026-11-13/VNM_SCORING_INPUTS.json').existingScoringInputPreparation;
 await rejects('intended scorer dataset authorization requires a real reviewed acceptance',()=>datasets.authorize(retainedScoreInput,{snapshotRunId:actual.id,acceptanceId:'vnm-current-dataset-unaccepted'}),/DI_ACCEPTANCE_REQUIRED/);
 await rejects('financial admission id is not a DI acceptance',()=>datasets.readiness(actual.id),/DI_ACCEPTANCE_REQUIRED/);
 await rejects('invalid acceptance cannot be inserted',()=>datasets.appendAcceptance({contract:'independent-di-acceptance-v1',id:'vnm-fabricated-acceptance'}),/EXACT_FIELDS/);
 assert.equal(await datasets.findBinding('vnm-no-scorecard'),null);
 await revokeStandingFinancial(db,actual.id,'ISOLATED_TEST_ONLY',clock);
 await rejects('revoked accepted record cannot be consumed',()=>consumeStandingFinancial(db,root,actual.id,authority,{...q,purpose:'CURRENT_FORMAL_VALUATION'},clock),/REVOKED/);
 // Coverage reports adapter availability separately from actual governed admission. No false M3 READY flag.
 const needed=['TOTAL_ASSETS','TOTAL_EQUITY','CASH_AND_EQUIVALENTS','REPORTED_BORROWINGS','REVENUE','GROSS_PROFIT','SELLING_EXPENSE','ADMIN_EXPENSE','INTEREST_EXPENSE','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','CFO','DEPRECIATION_AMORTIZATION','ASSET_PURCHASE_CASH_OUTFLOW'];
 const coverage=needed.map(itemId=>({itemId,requirementBasis:'BOUNDED_REQUESTED_FINANCIAL_INPUTS_NOT_COMPLETE_M3_METRIC_CERTIFICATION',adapterPeriods:plan.accepted.filter(f=>f.itemId===itemId).map(f=>({scope:f.scope,...f.period,vintage:f.vintage})),admittedPeriods:financial.evidence.filter(f=>f.observation===itemId).map(f=>({start:f.periodStart,end:f.periodEnd})),currentQ3Governed:financial.evidence.some(f=>f.observation===itemId&&f.periodEnd==='2026-09-30')}));
 const after=await counts();assert.equal(after.acceptances,0);assert.equal(after.bindings,0);assert.equal(after.scorecards,0);assert.equal(after.snapshots,0);
 assert.deepEqual(pin('data/vn30.sqlite'),dbBefore);
 write('REAL_EXECUTION.json',{contract:'vnm-expanded-current-dataset-execution-v1',knownAt:at,economicCutoff:'2026-10-30',database:'FRESH_MIGRATED_DISPOSABLE_SQLITE',counts:{before,afterAdmission,afterProbe,after},F1:{status:'ADMITTED_AND_CONSUMED',rawClose:f1consumed.observation.value},F2:{legacy:{admissionId:actual.id,evidence:financial.evidence,transforms:qualified.transforms,duplicate:duplicate.duplicate,readbackMatches:true,revokedAtEndForNegativeTest:true},expanded:{adapterAccepted:plan.accepted.length,governedAdmitted:0,status:'QUARANTINED_VERSION_GATE',reason:broadReason,quarantineReadbackMatches:true,probeId,planHash:hash(plan)}},coverage,consumer:{class:'PrismaScoringDatasets',status:'BLOCKED',reason:readinessReason,acceptancePersisted:false,bindingPersisted:false,scoreExecuted:false},checks,activeDatabase:{before:dbBefore,after:pin('data/vn30.sqlite'),unchanged:true},F2Decision:'PARTIAL_NOT_CLOSED',historicalPIT:'NOT_QUALIFIED',productionActivation:'NOT_AUTHORIZED',temporaryDatabaseDeletedAfterRun:true});
 write('COVERAGE.json',{contract:'requested-financial-current-coverage-v1',completeM3CoverageCertified:false,rows:coverage});
 const r=read(registry.path),a=r.authorities.find(a=>a.domain==='F2');
 write('ADAPTER_VERSION_REVIEW_PACKET.json',{status:'PROPOSAL_NOT_APPROVED',existingStandingSourceApprovalsPreserved:true,existingAuthority:registry,current:{id:a.id,version:a.version,adapterVersion:a.adapterVersion,schemaVersion:a.schemaVersion,validatedAdapterScope:a.validatedAdapterScope},requestedImplementation:{adapterVersion:plan.adapterVersion,schemaVersion:plan.contract,mappingCatalog:plan.mappingCatalog,code:[pin('src/infrastructure/source-admission/retained-mapping.ts'),pin('src/infrastructure/source-admission/retained-authority-gate.ts')],normalizerVersion:a.normalizerVersion,policyVersion:a.policyVersion},missingFacts:['The active registry binds F2 adapter retained-qualified-extraction-v1 and unified-current-financial-plan-v1, not the new adapter/schema/code.'],provenanceFollowup:'Nullable output metadata does not prove missing source data; resolve required clocks/source roles from retained catalogs before downstream Evidence qualification.',notASourceApprovalRequest:true,doesNotPromoteVNM17:true});
 console.log(JSON.stringify({F1:'PASS',legacyF2:'PERSISTED_READBACK_CONSUMED',expanded:plan.accepted.length,governedExpanded:0,checks:checks.length,binding:0,dbUnchanged:true}));
}finally{await fixture.close();assert.deepEqual(pin('data/vn30.sqlite'),dbBefore);}
