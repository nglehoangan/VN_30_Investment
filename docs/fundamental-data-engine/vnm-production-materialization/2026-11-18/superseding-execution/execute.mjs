import {readFileSync,writeFileSync,realpathSync,existsSync,mkdirSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(),out=import.meta.dirname,mode=process.argv[2];assert(['rehearse','execute','readback'].includes(mode));
const read=p=>JSON.parse(readFileSync(p,'utf8')),write=(n,v)=>writeFileSync(join(out,n),JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x,2)+'\n');
const req=createRequire('/private/tmp/vn30-step2-dependencies/package.json'),vr=createRequire(realpathSync(req.resolve('vitest/package.json'))),jr=createRequire(vr.resolve('vite/package.json')),{createJiti}=await import(pathToFileURL(jr.resolve('jiti')).href);
const jiti=createJiti(import.meta.url,{alias:{'@':join(root,'src'),'server-only':'/private/tmp/vn30-step2-dependencies/node_modules/next/dist/compiled/server-only/empty.js','@prisma/adapter-better-sqlite3':req.resolve('@prisma/adapter-better-sqlite3'),'@prisma/client/runtime/client':req.resolve('@prisma/client/runtime/client')},fsCache:false,moduleCache:true});
const load=p=>jiti.import(resolve(root,p));
const {sha,sourceBytes}=await load('src/infrastructure/source-admission/registry.ts');
const {snapshotHash:hash}=await load('src/infrastructure/fundamentals/snapshot-hash.ts');
const pin=p=>({path:p,sha256:sha(readFileSync(resolve(root,p)))});
const manifestPath='docs/fundamental-data-engine/vnm-production-materialization/2026-11-18/PROPOSED_DEPLOYMENT_MANIFEST.json',manifest=read(manifestPath),context=read(join(out,'PREPARED_CONTEXT.json'));
const {contentHash,...body}=manifest;assert.equal(hash(body),contentHash);assert.equal(contentHash,'95d1b994e1b0d04b0bd3f2ddd583b98526ab6a75600517930f841dd95925b6fa');assert.equal(hash(manifest.request),manifest.requestHash);
for(const p of [...manifest.request.sourcePins,...manifest.schemaPrerequisites])sourceBytes(root,p);
const migrations=read(join(out,'MIGRATION_PLAN.json'));for(const p of migrations){sourceBytes(root,p);assert(manifest.schemaPrerequisites.some(s=>s.sha256===p.sha256));}
const authorization={statement:'Approve VNM Superseding Deployment Manifest',source:pin(join(out,'OWNER_REQUEST.txt')),manifest:pin(manifestPath),contentHash,requestHash:manifest.requestHash,target:context.target,originalDatabaseHash:context.originalSha256,scope:'GOVERNED_CURRENT_MATERIALIZATION_AND_REGISTRATION_ONLY',publication:false,trading:false,historicalPit:false};
assert(sourceBytes(root,authorization.source).toString().includes(authorization.statement));
const {openDatabase}=await load('src/infrastructure/db/client.ts'),{loadDatabaseConfig}=await load('src/infrastructure/config/database.ts');
const target=mode==='rehearse'?realpathSync(context.rehearsal):context.target;
assert.equal(realpathSync(target),target);assert(mode!=='rehearse'||target!==context.target);
const authorityRoot='docs/fundamental-data-engine/vnm-step4-final-review/2026-11-17',reviewRoot='docs/fundamental-data-engine/vnm-step4-assessment-conversion/2026-11-18',route='docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16',coverageBase='docs/fundamental-data-engine/vnm-f2-coverage-closure/2026-11-16',base='docs/fundamental-data-engine/standing-authority-version/2026-11-12',f1base='docs/fundamental-data-engine/vnm-f1-membership-closure/2026-11-15';
const method=read(authorityRoot+'/APPROVED_METHODOLOGY.json'),exactPacketPath=reviewRoot+'/final-reviewed-run/EXACT_ADOPTION_PACKET.json',packet=read(exactPacketPath),input=packet.input;
const originalBinding=read(reviewRoot+'/final-reviewed-run/APPLIED_ISOLATED_REVIEW_BINDING.json').binding;let runtimeBinding=originalBinding;
const {PinnedCurrentExecutableAuthority}=await load('src/infrastructure/source-admission/current-scoring-authority.ts');
const executable=new PinnedCurrentExecutableAuthority(root,pin(authorityRoot+'/APPROVED_CURRENT_AUTHORITY.json'),{now:()=>input.knownAt});await executable.verify(method);
const {verifyProductionAuthorityBundle}=await load('src/infrastructure/dependencies/production-authority.ts');verifyProductionAuthorityBundle(root,read('src/infrastructure/dependencies/active-authorities.json').authorityBundle);
// File hashes and immutable accepted heads are checked before opening the exclusive writer.
const {retainedDependencyBootstrap}=await load('src/infrastructure/dependency-catalog.ts');const bootstrap=retainedDependencyBootstrap(root);assert.equal(bootstrap.bootstrapRoute.route,'ACCEPTED_STATIC_DATA_SUCCESSOR');
const {RetainedFinancialAdmissionAdapter}=await load('src/infrastructure/source-admission/retained-mapping.ts');
const selected=read(route+'/SELECTED_MAPPING_IDS_V2.json'),ids=new Set(selected.mappingIds),adapter=new RetainedFinancialAdmissionAdapter(root,pin(route+'/MAPPING_CONTRACT_V3.json'));
const q={ticker:'VNM',economicCutoff:'2026-10-30',knownAt:input.knownAt,purpose:'CURRENT_FORMAL_VALUATION',observations:adapter.retainedObservations().filter(o=>ids.has(o.mappingId))};
const ctx={ticker:q.ticker,securityId:selected.securityId,economicCutoff:q.economicCutoff,knownAt:q.knownAt,purpose:q.purpose};
async function logicalSnapshot(c){
 const schema=await c.$queryRawUnsafe("SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name"),tables={};
 for(const row of schema.filter(r=>r.type==='table')){const values=await c.$queryRawUnsafe('SELECT * FROM "'+row.name.replaceAll('"','""')+'"');tables[row.name]=values.map(v=>JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x)).sort();}
 return hash({schema,tables});
}
let lockedBaseline;
if(mode==='execute'){
 const backupClient=await openDatabase(loadDatabaseConfig({DATABASE_URL:'file:'+context.backup},root));try{lockedBaseline=await logicalSnapshot(backupClient);}finally{await backupClient.$disconnect();}
}
const client=await openDatabase(loadDatabaseConfig({DATABASE_URL:'file:'+target},root));
let locked=false,committed=false,writesAttempted=false,lockFd,lockFile=join(root,'data/.vnm-governed-deployment.lock');
const proxy=new Proxy(client,{get(t,k){if(k==='$transaction')return async fn=>{assert(locked||mode==='readback','OUTER_EXCLUSIVE_TRANSACTION_REQUIRED');return fn(proxy);};const v=Reflect.get(t,k);return typeof v==='function'?v.bind(t):v;}});
const db=proxy;
const counts=async()=>{const names=['current_financial_fact','current_financial_admission','current_financial_dataset','current_financial_enrichment','current_scoring_data_acceptance','current_score_artifact','analytical_artifact'];const result={};for(const n of names){const exists=await db.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' AND name=?",n);result[n]=exists.length?Number((await db.$queryRawUnsafe('SELECT count(*) n FROM '+n))[0].n):0;}return result;};
async function services(){
 const {CurrentFinancialAdmissions}=await load('src/infrastructure/source-admission/current-financial.ts');
 const actual=new CurrentFinancialAdmissions(db,root,{registry:()=>pin(coverageBase+'/VERSIONED_SOURCE_REGISTRY_V6.json'),mapping:pin(route+'/MAPPING_CONTRACT_V3.json'),documents:pin(route+'/DOCUMENT_BINDINGS_V2.json'),identities:read(base+'/REAL_FINANCIAL_REQUEST.json').material.identities,clock:{now:()=>input.knownAt}});
 const {VersionStandingAuthority}=await load('src/infrastructure/source-admission/versioned-authority.ts'),{PrismaBoundaryStore}=await load('src/infrastructure/repositories/market-boundary.ts'),{buildCafefCandidate,consumeCafefValuation}=await load('src/infrastructure/market-boundary/cafef-standing.ts'),{ingestCafef}=await load('app/server/cafef-standing-services.ts');
 const registry=pin(base+'/VERSIONED_SOURCE_REGISTRY.json'),f1bindings=read(f1base+'/TRUSTED_SOURCE_INPUTS_SUCCESSOR.json'),profile=read(f1base+'/MARKET_PROFILE.json'),authority=new VersionStandingAuthority(root,()=>registry,f1bindings),repo=new PrismaBoundaryStore(db),candidate=buildCafefCandidate(root,profile,{raw:f1bindings.catalogs.cafef[0],ticker:'VNM',exchange:'HOSE',date:'2026-10-30',knownAt:profile.knownAt});
 const market=async context=>{const c=await consumeCafefValuation(root,candidate,authority.marketTrust(),repo,{mode:'HISTORICAL',requestedAt:candidate.market.body.requestedAsOf,knownAt:context.knownAt,now:context.knownAt,purpose:'VALUATION',securityIds:[ctx.securityId],universe:candidate.market.body.universe},{now:()=>context.knownAt});return {ticker:'VNM',securityId:ctx.securityId,date:'2026-10-30',value:c.observation.value,unit:'VND_PER_SHARE',field:'GiaDongCua',lineage:{raw:candidate.spec.raw,pointer:c.observation.pointer,authority:registry}};};
 const shares=async context=>{const reviewPin=pin('docs/fundamental-data-engine/vnm-s4-share-carry-forward/2026-11-12/REVIEW.json'),policyPin=pin('docs/fundamental-data-engine/governance/SHARE_COUNT_CARRY_FORWARD_OWNER_DECISION_2026-11-12.json'),r=JSON.parse(sourceBytes(root,reviewPin)),p=JSON.parse(sourceBytes(root,policyPin));assert.equal(r.decision.status,'CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS');assert.equal(r.cutoff,context.economicCutoff);assert(r.review.reviewedAt<=context.knownAt);sourceBytes(root,{path:r.anchor.pdfPath,sha256:r.anchor.pdfSha256});sourceBytes(root,r.anchor.sourcePin);assert.equal(r.decision.shares,p.vnmScope.shares);return {ticker:'VNM',securityId:ctx.securityId,asOf:context.economicCutoff,value:r.decision.shares,unit:'SHARES',status:r.decision.status,lineage:{review:reviewPin,policy:policyPin,formalSourceAdmission:r.decision.sourceAdmission,completeNegativeSearch:r.decision.completeNegativeSearch,productionActivation:false}};};
 const {CurrentFinancialDatasets}=await load('src/infrastructure/source-admission/current-dataset.ts'),{CurrentFinancialCoverage}=await load('src/infrastructure/source-admission/current-coverage.ts'),{CurrentPreScoringBindings}=await load('src/infrastructure/source-admission/pre-scoring-binding.ts'),{CurrentPurposeScoringConsumer}=await load('src/infrastructure/source-admission/current-scoring-consumer.ts'),{PrismaMethodologyRegistry}=await load('src/infrastructure/repositories/methodology-registry.ts'),{CurrentPurposeScoring,PinnedCurrentAssessmentAdoption}=await load('src/infrastructure/source-admission/current-scoring.ts');
 const datasets=new CurrentFinancialDatasets(db,root,actual,{requirements:pin(route+'/DATASET_REQUIREMENTS_V2.json'),market,shares}),coverage=new CurrentFinancialCoverage(db,root,actual,datasets,{registry:()=>pin(coverageBase+'/VERSIONED_SOURCE_REGISTRY_V6.json'),debtReview:pin(coverageBase+'/DEBT_SOURCE_REVIEW.json'),history:pin(coverageBase+'/RETAINED_ADMITTED_HISTORY.json'),research:pin(coverageBase+'/RESEARCH_ADOPTION_CATALOG.json'),clock:{now:()=>input.knownAt}}),bindings=new CurrentPreScoringBindings(coverage),consumer=new CurrentPurposeScoringConsumer(db,bindings,coverage,datasets),methods=new PrismaMethodologyRegistry(db);
 const adoption=new PinnedCurrentAssessmentAdoption(root,{reference:'VNM_EXACT_CURRENT_REVIEW_PROPOSAL',...pin(exactPacketPath)},[runtimeBinding]),scorer=new CurrentPurposeScoring(db,methods,consumer,adoption,executable);
 return {actual,datasets,coverage,bindings,consumer,methods,adoption,scorer,ingest:()=>ingestCafef(root,repo,'vnm-current-financial-dataset',[candidate],authority.marketTrust())};
}
async function recipe(){
 const s=await services(),oldMethod=await s.methods.findById(method.methodologyId);if(oldMethod)assert.equal(hash(oldMethod),hash(method));else await s.methods.append(method);
 const ad=await s.actual.ingest(q,ctx.securityId);assert.equal(ad.plan.facts.length,68);assert.equal(ad.plan.quarantine.length,0);assert.deepEqual((await s.actual.consume(ad.id,ctx)).facts,ad.plan.facts);
 await s.ingest();const dataset=await s.datasets.bind(ad.id,ctx),enriched=await s.coverage.bind(dataset.id,ctx),reference=await s.bindings.prepare(dataset.id,ctx),data=await s.consumer.resolve(reference,ctx);
 assert.equal(hash(data),packet.datasetHash);assert.equal(data.facts.length,35);assert.equal(data.history.length,65);assert.equal(data.price.value,'56900');assert.equal(data.shares.value,'2089955445');assert.equal(data.historicalPitGranted,false);
 await s.adoption.verify(input,data);await executable.verify(method);const authorization=await s.scorer.preflight(input,reference),card=await s.scorer.score(input,reference),saved=await s.scorer.find(card.id);
 const subject={scorecardId:card.id,scorecardHash:hash(card),datasetHash:hash(data),methodologyHash:hash(method),reviewHash:hash(card.input.review)};for(const [k,v] of Object.entries(subject))assert.equal(v,manifest.request[k],k);
 assert.equal(card.totalScore,'43');assert.equal(card.confidence,'LOW');assert.equal(card.validity,'VALID — NON-ACTIONABLE');assert.equal(card.subcategories.length,23);assert.equal(card.input.assessments.flatMap(a=>a.evidence).length,83);assert.equal(card.asOf.slice(0,10),'2026-10-30');assert.deepEqual(saved.card,card);
 return {s,subject,card,data,reference,authorization,admissionId:ad.id,datasetId:dataset.id,enrichmentId:enriched.id};
}
try{
 if(mode==='readback'){
  await client.$executeRawUnsafe('PRAGMA query_only=ON');
  const registered=read(join(out,'CURRENT_REGISTRATION.json'));assert.equal(registered.manifestContentHash,contentHash);assert.equal(hash(registered.reviewBinding),hash(originalBinding));assert.equal(registered.target,target);runtimeBinding=registered.reviewBinding;
  const s=await services(),saved=await s.scorer.find(manifest.request.scorecardId);assert(saved);assert.equal(hash(saved.card),manifest.request.scorecardHash);const beforeRetry=await counts();assert.deepEqual(await s.scorer.score(input,saved.authorization.reference),saved.card);assert.deepEqual(await s.scorer.score(input,saved.authorization.reference),saved.card);assert.deepEqual(await counts(),beforeRetry);write('PERSISTED_CURRENT_READBACK.json',{status:'PASS',target,sqliteQueryOnly:true,postCommitIdempotentScoreRetry:true,scorecardHash:hash(saved.card),totalScore:saved.card.totalScore,confidence:saved.card.confidence,validity:saved.card.validity,authorization:saved.authorization,counts:await counts()});
 }else{
  if(mode==='execute'){
   assert.equal(spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),'fc2415da3ff48c3a03671ee6e255cb7852923b51');
   const rehearsal=read(join(out,'REHEARSAL_RESULT.json'));assert.equal(rehearsal.status,'PASS');assert.equal(rehearsal.authorization.contentHash,contentHash);assert.equal(sha(readFileSync(context.target)),context.originalSha256);assert.equal(sha(readFileSync(context.backup)),read(join(out,'BACKUP_AND_RECOVERY_VALIDATION.json')).backupSha256);
   lockFd=openSync(lockFile,'wx',0o600);writeFileSync(lockFd,JSON.stringify({pid:process.pid,contentHash,target}));
  }
  await client.$executeRawUnsafe('PRAGMA busy_timeout=0');await client.$executeRawUnsafe('BEGIN EXCLUSIVE');locked=true;
  if(mode==='execute')assert.equal(await logicalSnapshot(client),lockedBaseline,'DATABASE_CHANGED_BEFORE_EXCLUSIVE_LOCK');
  const other=spawnSync('python3',['-c',"import sqlite3,sys\nc=sqlite3.connect(sys.argv[1],timeout=0)\ntry: c.execute('BEGIN IMMEDIATE');sys.exit(2)\nexcept sqlite3.OperationalError as e:\n assert 'locked' in str(e);print('SECOND_WRITER_BLOCKED')",target],{encoding:'utf8'});assert.equal(other.status,0,other.stderr);assert(other.stdout.includes('SECOND_WRITER_BLOCKED'));
  const before=await counts();writesAttempted=true;
  for(const m of migrations){const old=await db.$queryRawUnsafe('SELECT checksum FROM _prisma_migrations WHERE migration_name=?',m.name);assert.equal(old.length,0);const sql=sourceBytes(root,m).toString();assert(!/\b(?:DROP|ALTER|DELETE|UPDATE|INSERT)\s+(?:TABLE|INTO|FROM)\b/i.test(sql.replace(/CREATE TRIGGER[\s\S]*?END;/g,'')));for(const statement of sql.match(/CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|INDEX)[\s\S]*?;/g)??[])await db.$executeRawUnsafe(statement);await db.$executeRawUnsafe('INSERT INTO _prisma_migrations(id,checksum,finished_at,migration_name,logs,rolled_back_at,started_at,applied_steps_count) VALUES(?,?,?,?,NULL,NULL,?,1)',randomUUID(),m.sha256,Date.now(),m.name,Date.now());}
  const first=await recipe(),after=await counts(),second=await recipe();assert.deepEqual(await counts(),after);assert.deepEqual(second.subject,first.subject);assert.equal(after.current_financial_fact,69);assert.equal(after.current_score_artifact,1);assert.equal(after.analytical_artifact,before.analytical_artifact);
  const checks=[];async function rejects(name,fn){let e;try{await fn();}catch(x){e=String(x)+' '+JSON.stringify(x.issues??{});}assert(e,name);checks.push({name,result:'REJECTED',reason:e});}
  await rejects('unauthorized modified assessment',()=>first.s.scorer.preflight({...input,assessments:input.assessments.map((a,i)=>i?a:{...a,rationale:a.rationale+' MODIFIED'})},first.reference));
  const {PinnedCurrentAssessmentAdoption,CurrentPurposeScoring}=await load('src/infrastructure/source-admission/current-scoring.ts');
  const untrusted=new CurrentPurposeScoring(db,first.s.methods,first.s.consumer,new PinnedCurrentAssessmentAdoption(root,{reference:'VNM_EXACT_CURRENT_REVIEW_PROPOSAL',...pin(exactPacketPath)},[]),executable);await rejects('unregistered AI authority',()=>untrusted.find(first.card.id));
  await rejects('historical PIT promotion',()=>first.s.consumer.resolve(first.reference,{...ctx,purpose:'HISTORICAL_PIT'}));
  if(mode==='rehearse'){
   await rejects('scorecard tamper blocked by immutable trigger',()=>db.$executeRawUnsafe("UPDATE current_score_artifact SET body='{}' WHERE id=?",first.card.id));
   await db.$executeRawUnsafe('SAVEPOINT revocation_probe');await db.$executeRawUnsafe('INSERT INTO source_admission_event VALUES(?,?,?,?,?,?)',randomUUID(),'REVOCATION',first.reference.bindingId,new Date().toISOString(),'{}',sha('{}'));await rejects('revoked dataset readback',()=>first.s.scorer.find(first.card.id));await db.$executeRawUnsafe('ROLLBACK TO revocation_probe');await db.$executeRawUnsafe('RELEASE revocation_probe');assert(await first.s.scorer.find(first.card.id));
  }
  const result={status:'PASS',mode,target,authorization,subject:first.subject,before,after,financialFacts:after.current_financial_fact,currentEvidence:first.data.facts.length,historicalFacts:first.data.history.length,score:43,confidence:first.card.confidence,validity:first.card.validity,rubrics:23,topics:83,reference:first.reference,scoreAuthorization:first.authorization,idempotent:true,checks,exclusiveLock:true,secondWriterBlocked:true,lockedBaselineVerified:mode==='execute',noMainFileDescriptorOpenedAfterLock:true,publicationCreated:false,methodology:pin(authorityRoot+'/APPROVED_METHODOLOGY.json'),executable:pin(authorityRoot+'/APPROVED_CURRENT_AUTHORITY.json'),assessmentPacket:pin(exactPacketPath),reviewBinding:originalBinding,appliedMigrations:migrations};
  if(mode==='rehearse')write('PREFLIGHT_RUNTIME_RESULT.json',result);
  await client.$executeRawUnsafe('COMMIT');locked=false;committed=true;write(mode==='rehearse'?'REHEARSAL_RESULT.json':'PRODUCTION_RESULT.json',result);if(mode==='execute')write('CURRENT_REGISTRATION.json',{contract:'owner-authorized-current-registration-v1',status:'REGISTERED',target,manifestContentHash:contentHash,authorization,methodology:result.methodology,methodologyHash:first.subject.methodologyHash,executable:result.executable,assessmentPacket:result.assessmentPacket,reviewBinding:originalBinding,reviewHash:first.subject.reviewHash,datasetReference:first.reference,publicationEnabled:false,tradingAuthorized:false,historicalPitGranted:false,recordedAt:new Date().toISOString()});
 }
}catch(e){if(locked){await client.$executeRawUnsafe('ROLLBACK');locked=false;}write(mode==='rehearse'?'REHEARSAL_FAILURE.json':'EXECUTION_FAILURE.json',{classification:(committed||writesAttempted)?'VALIDATION_FAILED':'BLOCKED_PREWRITE',mode,error:String(e),stack:e.stack,issues:e.issues,committed});throw e;
}finally{await client.$disconnect();if(lockFd!==undefined){closeSync(lockFd);unlinkSync(lockFile);}}
