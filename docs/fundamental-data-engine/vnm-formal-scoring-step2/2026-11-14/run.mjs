// Real retained VNM observations; disposable SQLite only. Never opens the live DB.
import {readFileSync,writeFileSync,realpathSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=process.cwd(),out=resolve('docs/fundamental-data-engine/vnm-formal-scoring-step2/2026-11-14'),base='docs/fundamental-data-engine/standing-authority-version/2026-11-12';
const read=p=>JSON.parse(readFileSync(p,'utf8')),write=(n,x)=>writeFileSync(join(out,n),JSON.stringify(x,null,2)+'\n');
const vr=createRequire(realpathSync('node_modules/vitest/package.json')),jr=createRequire(vr.resolve('vite/package.json')),{createJiti}=await import(pathToFileURL(jr.resolve('jiti')).href);
const jiti=createJiti(import.meta.url,{alias:{'@':resolve(root,'src'),'server-only':resolve(root,'node_modules/next/dist/compiled/server-only/empty.js')},fsCache:false,moduleCache:true}),load=p=>jiti.import(resolve(root,p));
const {sha}=await load('src/infrastructure/source-admission/registry.ts'),{snapshotHash:hash}=await load('src/infrastructure/fundamentals/snapshot-hash.ts');
const {VersionStandingAuthority}=await load('src/infrastructure/source-admission/versioned-authority.ts');
const {implementationPins,buildCafefCandidate,consumeCafefValuation}=await load('src/infrastructure/market-boundary/cafef-standing.ts');
const {selectCafefRawCloseValue}=await load('src/domain/market-boundary/cafef-raw-close.ts');
const {isHoseSession}=await load('src/domain/market-boundary/hose-calendar.ts');
const {financialCodePins,qualifyFinancialPlan}=await load('src/infrastructure/source-admission/financial.ts');
const {ingestStandingFinancial,consumeStandingFinancial}=await load('app/server/unified-admission-services.ts');
const {ingestCafef}=await load('app/server/cafef-standing-services.ts');
const {openDatabase}=await load('src/infrastructure/db/client.ts'),{loadDatabaseConfig}=await load('src/infrastructure/config/database.ts');
const {PrismaBoundaryStore}=await load('src/infrastructure/repositories/market-boundary.ts');
const {PrismaScoringDatasets}=await load('src/infrastructure/repositories/scoring-datasets.ts');
const {PrismaFundamentals}=await load('src/infrastructure/repositories/fundamentals.ts'),{PrismaFundamentalSnapshot}=await load('src/infrastructure/repositories/fundamental-snapshot.ts'),{PrismaFundamentalDerivation}=await load('src/infrastructure/repositories/fundamental-derivation.ts');
const {loadCanonicalRegistry}=await load('src/infrastructure/fundamentals/canonical-registry.ts');
const {validateEvidence}=await load('src/domain/scoring/evidence.ts');
const pin=path=>({path,sha256:sha(readFileSync(path))}),registryPin=pin(base+'/VERSIONED_SOURCE_REGISTRY.json'),registry=read(registryPin.path),bindings=read(base+'/TRUSTED_SOURCE_INPUTS.json'),at=read(join(out,'RUN_CONTEXT.json')).operationalKnownAt;
assert(at>=registry.recordedAt);
const authority=new VersionStandingAuthority(root,()=>registryPin,bindings),profile=read(base+'/REAL_MARKET_PROFILE.json');profile.knownAt=at;profile.code=implementationPins(root);profile.calendar.evidence={...profile.calendar.evidence,knownAt:at,effectiveAt:at};
const spec={raw:bindings.catalogs.cafef[0],ticker:'VNM',exchange:'HOSE',date:'2026-10-30',knownAt:at};
const q=read(base+'/REAL_FINANCIAL_REQUEST.json');q.knownAt=at;q.ingestedAt=at; // update actual operational clock only; original receipts/reviews remain.
assert.deepEqual(q.material.code,financialCodePins(root)); // do not rehash an authority or silently enroll changed adapters.
const planned=qualifyFinancialPlan(root,q,authority);assert.equal(hash(planned),hash(qualifyFinancialPlan(root,q,authority)));
const checks=[];
async function rejects(name,fn,pattern){let reason;try{await fn();}catch(e){reason=String(e)+(Array.isArray(e?.issues)?" | "+e.issues.map(i=>i.reason).join(" | "):"");}assert(reason&&pattern.test(reason),name+': '+reason);checks.push({name,status:'PASS',reason});return reason;}
const cutoffReason=await rejects('missing dated30Oct membership',()=>buildCafefCandidate(root,profile,spec),/VN30_MEMBERSHIP_OUTSIDE_VERIFIED_INTERVAL/);
const obs=read(spec.raw.path).prices.find(p=>p.date===spec.date);assert(obs);
const unitEvidence={id:'retained-cafef-unit',hash:profile.unitSource.sha256,knownAt:at,effectiveAt:at};const rp={ticker:'VNM',tradingDate:'2026-10-30',sourceUnit:'THOUSAND_VND_PER_SHARE',unitEvidence};
const value=selectCafefRawCloseValue(obs.raw,rp);assert.equal(value,'56900');assert(isHoseSession('2026-10-30',profile.calendar));
await rejects('no adjusted fallback',()=>selectCafefRawCloseValue({...obs.raw,GiaDongCua:undefined},rp),/RAW_CLOSE_REQUIRED_NO_FALLBACK/);
const temp=mkdtempSync(join(tmpdir(),'vnm-step2-real-'));let db;
try{
 db=await openDatabase(loadDatabaseConfig({DATABASE_URL:'file:'+join(temp,'step2.sqlite')},root));
 const migrations=['202609100001_methodology_registry','202609170001_scoring_artifacts','202610080002_fundamental_foundation','202610090001_fundamental_normalization','202610090002_fundamental_derivation','202610090003_fundamental_snapshot','202610090004_scoring_readiness','202610130001_structured_admission','202610190002_market_boundary','202611120001_market_ingest','202611120002_unified_admission'];
 for(const name of migrations)for(const sql of readFileSync('prisma/migrations/'+name+'/migration.sql','utf8').match(/CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|UNIQUE INDEX|INDEX)[\s\S]*?;/g)??[])await db.$executeRawUnsafe(sql);
 const count=async()=>({marketBoundaryRecords:await db.marketBoundaryRecord.count(),financialAdmissionRuns:await db.fundamentalAdmissionRun.count(),financialRawCaptures:await db.fundamentalRawCapture.count(),sourceAdmissionEvents:Number((await db.$queryRawUnsafe('SELECT count(*) AS n FROM source_admission_event'))[0].n),fundamentalSnapshotRuns:await db.fundamentalSnapshotRun.count(),dataInitializationAcceptances:await db.dataInitializationAcceptance.count(),scoringDatasetBindings:await db.scoringDatasetBinding.count(),analyticalArtifacts:await db.analyticalArtifact.count()});
 const before=await count(),clock={now:()=>at};
 // Positive F1 control only on16Oct, explicitly NOT a substitute for requested30Oct.
 const repo=new PrismaBoundaryStore(db),control=buildCafefCandidate(root,profile,{...spec,date:'2026-10-16'}),trust=authority.marketTrust();
 const f1=await ingestCafef(root,repo,'vnm-step2-control-only',[control],trust);assert.equal(f1.accepted.length,1);
 const controlConsumed=await consumeCafefValuation(root,control,trust,repo,{mode:'HISTORICAL',requestedAt:control.market.body.requestedAsOf,knownAt:at,now:at,purpose:'VALUATION',securityIds:[q.securityId],universe:control.market.body.universe},clock);
 const first=await ingestStandingFinancial(db,root,q,authority,clock),afterAdmission=await count(),dup=await ingestStandingFinancial(db,root,q,authority,clock),afterDuplicate=await count();assert(dup.duplicate);assert.deepEqual(afterAdmission,afterDuplicate);
 const consumed=await consumeStandingFinancial(db,root,first.id,authority,{...q,purpose:'CURRENT_FORMAL_VALUATION'},clock);assert.equal(consumed.evidence.length,1);assert.equal(consumed.evidence[0].observation,'TOTAL_ASSETS');assert.equal(consumed.readyForScoring,false);
 checks.push({name:'real F2 current-purpose persist consume and duplicate idempotence',status:'PASS'});
 await rejects('fake historical PIT',()=>consumeStandingFinancial(db,root,first.id,authority,{...q,purpose:'HISTORICAL_PIT'},clock),/CURRENT_ONLY_NOT_PIT/);
 await rejects('wrong purpose',()=>consumeStandingFinancial(db,root,first.id,authority,{...q,purpose:'SCORING'},clock),/CURRENT_ONLY_NOT_PIT/);
 await rejects('wrong ticker identity',()=>consumeStandingFinancial(db,root,first.id,authority,{...q,ticker:'FPT',purpose:'CURRENT_FORMAL_VALUATION'},clock),/FINANCIAL_CONSUMPTION_SCOPE/);
 await rejects('postdated operational knowledge',()=>consumeStandingFinancial(db,root,first.id,authority,{...q,knownAt:new Date(Date.parse(at)+86400000).toISOString(),purpose:'CURRENT_FORMAL_VALUATION'},clock),/FUTURE_OPERATIONAL_KNOWLEDGE/);
 await rejects('unsupported user URL',()=>ingestStandingFinancial(db,root,{...q,sourceInputs:[{rawHash:planned.transforms[0].rawHash,url:'https://evil.example/VNM.pdf'}]},authority,clock),/FINANCIAL_SOURCE_TRUST/);
 await rejects('current-only cannot pass legacy evidence default',()=>validateEvidence(consumed.evidence,q.securityId,'2026-10-30T23:59:59.999Z',at),/CURRENT|PURPOSE/);
 const datasets=new PrismaScoringDatasets(db,new PrismaFundamentalSnapshot(db),new PrismaFundamentals(db),new PrismaFundamentalDerivation(db),loadCanonicalRegistry());
 await rejects('missing real acceptance rejected by intended consumer',()=>datasets.readiness('vnm-step2-no-acceptance'),/DI_ACCEPTANCE_REQUIRED/);
 await rejects('invalid caller acceptance rejected before insert',()=>datasets.appendAcceptance({contract:'independent-di-acceptance-v1',id:'invalid-step2-test'}),/EXACT_FIELDS/);
 assert.equal(await datasets.findBinding('vnm-step2-no-scorecard'),null);
 const after=await count();assert.equal(after.dataInitializationAcceptances,0);assert.equal(after.scoringDatasetBindings,0);assert.equal(after.analyticalArtifacts,0);assert.equal(after.fundamentalSnapshotRuns,0);
 const stored=await db.fundamentalAdmissionRun.findUniqueOrThrow({where:{id:first.id}});
 write('REAL_EXECUTION.json',{mode:'REAL_RETAINED_VNM_DISPOSABLE_SQLITE_NOT_LIVE',knownAt:at,requestedCutoff:'2026-10-30',authority:registryPin,counts:{before,afterAdmission,afterDuplicate,after},F1:{requestedDate:spec.date,status:'BLOCKED_MEMBERSHIP',reason:cutoffReason,rawCloseResearchValidation:{value,unit:'VND_PER_SHARE',field:'GiaDongCua',source:spec.raw,rowPointer:'/prices/'+read(spec.raw.path).prices.findIndex(p=>p.date===spec.date),originalReceipt:obs.receivedAt,responseSha256:obs.responseSha256,sourceUrl:obs.sourceUrl,tradingSession:true},positiveControl:{date:'2026-10-16',substitutesRequestedCutoff:false,value:controlConsumed.observation.value,accepted:f1.accepted}},F2:{status:'REAL_SELECTED_FACT_ADMITTED_AND_CONSUMED_CURRENT_ONLY',admissionId:first.id,admissionBodyHash:stored.bodyHash??sha(stored.body),duplicate:dup.duplicate,normalizedReplayHash:hash(planned),evidence:consumed.evidence,transforms:planned.transforms,automatedSourceVerification:planned.standingVerification,fullFinancialCoverage:false,readyForScoring:consumed.readyForScoring},consumer:{class:'PrismaScoringDatasets',acceptancePersisted:false,bindingPersisted:false,bindingResolved:false,missingBindingResult:null,formalScoreEngineInvoked:false},checks,productionActivation:'NOT_AUTHORIZED',step3Executed:false,temporaryDatabaseDeletedAfterRun:true});
 console.log(JSON.stringify({status:'BLOCKING_WITH_REAL_PARTIAL_ADMISSION',F2:first.id,counts:after,checks:checks.length}));
}finally{if(db)await db.$disconnect();rmSync(temp,{recursive:true,force:true});}
