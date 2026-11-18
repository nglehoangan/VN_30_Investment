/** Negative/bounded publication rehearsal only. Never opens production through Prisma. */
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=process.cwd(),out=import.meta.dirname,base='docs/fundamental-data-engine/vnm-step4-assessment-conversion/2026-11-18',old='docs/fundamental-data-engine/vnm-step4-final-review/2026-11-17';
const vr=createRequire(realpathSync('/private/tmp/vn30-step2-dependencies/node_modules/vitest/package.json')),jr=createRequire(vr.resolve('vite/package.json')),{createJiti}=await import(pathToFileURL(jr.resolve('jiti')).href);
const jiti=createJiti(import.meta.url,{alias:{'@':resolve(root,'src'),'server-only':'/private/tmp/vn30-step2-dependencies/node_modules/next/dist/compiled/server-only/empty.js'},fsCache:false,moduleCache:true});
const load=p=>jiti.import(resolve(root,p)),read=p=>JSON.parse(readFileSync(p,'utf8'));
const {snapshotHash:hash}=await load('src/infrastructure/fundamentals/snapshot-hash.ts'),{sha}=await load('src/infrastructure/source-admission/registry.ts'),{canonicalJson}=await load('src/domain/fundamentals/snapshot.ts');
const pin=p=>({path:p,sha256:sha(readFileSync(p))}),write=(n,x)=>writeFileSync(join(out,n),JSON.stringify(x,null,2)+'\n');
const {deepFreeze}=await load('src/domain/portfolio/transaction.ts');
const {PinnedCurrentExecutableAuthority}=await load('src/infrastructure/source-admission/current-scoring-authority.ts');
const {PinnedCurrentAssessmentAdoption,CurrentPurposeScoring}=await load('src/infrastructure/source-admission/current-scoring.ts');
const {validateAiScoringReview}=await load('src/domain/current-scoring/provenance.ts');
const card=deepFreeze(read(base+'/final-reviewed-run/ISOLATED_SCORECARD.json')),prior=read(base+'/final-reviewed-run/AI_ADOPTION_AND_SCORING.json'),packet=read(base+'/final-reviewed-run/EXACT_ADOPTION_PACKET.json'),dataset=read(base+'/final-reviewed-run/SCORER_CURRENT_DATA_RECEIPT.json'),binding=read(base+'/final-reviewed-run/APPLIED_ISOLATED_REVIEW_BINDING.json');
assert.equal(sha(readFileSync(prior.ownerProcessPolicy.path)),prior.ownerProcessPolicy.sha256);assert.equal(hash(card),prior.scorecardHash);assert.equal(hash(packet.input),hash(card.input));assert.equal(hash(dataset),packet.datasetHash);validateAiScoringReview(card.input,hash);
const method=read(old+'/APPROVED_METHODOLOGY.json');assert.equal(hash(method),hash(card.methodology));
const exact=new PinnedCurrentExecutableAuthority(root,pin(old+'/APPROVED_CURRENT_AUTHORITY.json'),{now:()=>new Date().toISOString()});await exact.verify(method);
const actualTrust=new PinnedCurrentAssessmentAdoption(root,prior.exactPacket,[binding.binding]);await actualTrust.verify(card.input,dataset);
const checks=[];
async function rejects(name,fn,re){let reason;try{await fn();}catch(e){reason=String(e)+(e.issues?JSON.stringify(e.issues):'');}assert(reason&&re.test(reason),name+': '+reason);checks.push({name,status:'EXPECTED_REJECTION',reason});return reason;}
await rejects('same isolated packet without configured trust remains rejected',()=>new PinnedCurrentAssessmentAdoption(root,prior.exactPacket,[]).verify(card.input,dataset),/TRUSTED_AI_REVIEW_BINDING_REQUIRED/);
await rejects('changed assessment cannot inherit prior review',()=>actualTrust.verify({...card.input,assessments:card.input.assessments.map((a,i)=>i?a:{...a,rationale:a.rationale+' altered'})},dataset),/CURRENT_EXACT_ASSESSMENT_ADOPTION_REQUIRED/);
await rejects('altered dataset cannot inherit review',()=>actualTrust.verify(card.input,{...dataset,manifestHash:'0'.repeat(64)}),/CURRENT_ASSESSMENT_DATASET_BINDING_REQUIRED/);
assert.notEqual(hash({...card,totalScore:'99'}),prior.scorecardHash);
const config=read('src/infrastructure/dependencies/active-authorities.json'),headPin=config.bindings.find(p=>p.path.endsWith('HEAD_SCORING_MODEL.json')),head=read(headPin.path);
write('AUTHORITY_AND_TRUST_VALIDATION.json',{approvedCurrentExecutableVerifier:'PASS',approvedCurrentAuthority:pin(old+'/APPROVED_CURRENT_AUTHORITY.json'),approvedMethod:pin(old+'/APPROVED_METHODOLOGY.json'),step4SemanticScorecardHash:hash(card),step4SemanticInputHash:hash(card.input),step4ReviewHash:hash(card.input.review),step4DatasetHash:hash(dataset),exactIsolatedInputAndReview:'PASS',actualPriorCodexSession:card.input.review.passes[0].sessionReference,originalOwnerProcessAuthority:prior.ownerProcessPolicy,isolatedAuthorityScope:'Existing owner-authorized AI self-review, disposable validation composition only; not a publication permit.',liveScopeInferred:false,activeConfig:pin('src/infrastructure/dependencies/active-authorities.json'),activeScoringHead:headPin,activeScoringMethodology:head.content.methodology.methodologyId,approvedCurrentMethodology:method.methodologyId,currentMethodMatchesActiveStaticHead:hash(head.content.methodology)===hash(method),liveTrustedCurrentReviewRegistrationFound:false,publicationApproval:'NOT_AUTHORIZED_PER_OWNER_REVIEW_INPUT',requiresSeparateOwnerPublicationApproval:true,canRegisterIsolatedBindingAutomaticallyInLive:false,registrationMeaning:'Technically reusable immutable review pins; requires explicit authorized live registration/accepted dependency binding, with exact source/policy compatibility and revocation checks. No repeat provider approval.',checks});
const {testDatabase}=await load('tests/fixtures/step2-validation-database.ts');
const {PrismaAnalyticalArtifacts}=await load('src/infrastructure/repositories/analytical-artifacts.ts');
const {PrismaMethodologyRegistry}=await load('src/infrastructure/repositories/methodology-registry.ts');
const {readDashboard}=await load('app/server/dashboard.ts');
const {productionDependencyServices}=await load('app/server/production-dependencies.ts');
const db=await testDatabase();
try{
 const count=async()=>({analyticalArtifacts:await db.client.analyticalArtifact.count(),publicationRows:await db.client.productionDependencyPublication.count(),ledgerTransactions:await db.client.ledgerTransaction.count(),methodologies:await db.client.methodologyRecord.count(),dependencyReleases:await db.client.dependencyRelease.count()});
 const before=await count();
 const {productionBootstrapInventory}=await load('app/server/production-dependencies.ts'); await rejects('actual production bootstrap inventory retains an incompatible historical source pin',async()=>productionBootstrapInventory(),/SOURCE_HASH_MISMATCH:src\/domain\/market-boundary\/validation\.ts/);
 const {LocalAcceptedDependencyCatalog}=await load('src/infrastructure/dependencies/catalog.ts');const {PrismaBoundaryStore}=await load('src/infrastructure/repositories/market-boundary.ts'); const staticHeads=await new LocalAcceptedDependencyCatalog(root,new PrismaBoundaryStore(db.client),()=>{throw Error('NO_TEST_LIFECYCLE_PUBLICATION_AUTHORIZED');}).readAccepted();assert.equal(staticHeads.length,11);write('STATIC_HEAD_AND_BOOTSTRAP_VALIDATION.json',{acceptedStaticHeadRead:'PASS',staticHeadCount:staticHeads.length,currentPurposeExecutableVerifier:'PASS',historicalBootstrapInventory:'FAIL_SOURCE_HASH_MISMATCH',doesNotInvalidateOwnerApprovedCurrentBytes:true});
 await rejects('real legacy artifact writer refuses formal current scorecard',()=>new PrismaAnalyticalArtifacts(db.client).append(card),/FORMAL_SCORECARD_REQUIRES_DATASET_REPOSITORY/);
 const publication=productionDependencyServices(db.client,()=>{throw Error('NO_TEST_LIFECYCLE_PUBLICATION_AUTHORIZED');});
 await rejects('real production publication resolver refuses missing accepted head in disposable DB',()=>publication.resolveProductionAnalysisDependencies({purpose:'VALUATION',requestedAsOf:card.asOf}),/MISSING_HEAD/);
 assert.deepEqual(await count(),before);
 // Exact previously retained storage-body reconstruction only: no admission/source/approval fixture is invented.
 // This row is intentionally not governed in this empty DB and is never called a published score.
 for(const sql of readFileSync('prisma/proposals/current-scoring-artifact-v1.sql','utf8').match(/CREATE TRIGGER[\s\S]*?END;|CREATE TABLE[\s\S]*?;/g)??[])await db.client.$executeRawUnsafe(sql);
 const body={card,authorization:prior.authorization};
 await db.client.$executeRawUnsafe('INSERT INTO current_score_artifact VALUES(?,?,?,?,?)',card.id,prior.authorization.reference.bindingId,dataset.dataAcceptanceId,canonicalJson(body),hash(body));
 const model=await readDashboard(db.client,'scoring',card.id);assert.equal(model.cards.length,0);assert.equal(model.status,'EMPTY');
 const closedPort={resolve:async()=>{throw Error('NO_LIVE_DATA_OR_AUTHORIZATION_FIXTURE');}};
 const current=new CurrentPurposeScoring(db.client,new PrismaMethodologyRegistry(db.client),closedPort,actualTrust,exact);
 await rejects('exact cached body alone cannot pass current-purpose read authorization',()=>current.find(card.id),/UNREGISTERED_CURRENT_METHODOLOGY/);
 const {DatabaseSync}=await import('node:sqlite');const native=new DatabaseSync(db.config.filePath);try{await rejects('immutable storage refuses replacement of same ID',async()=>native.prepare('INSERT INTO current_score_artifact VALUES(?,?,?,?,?)').run(card.id,prior.authorization.reference.bindingId,dataset.dataAcceptanceId,canonicalJson(body),hash(body)),/immutable current score/);}finally{native.close();}
 assert.deepEqual(await count(),before);
 write('ISOLATED_PUBLICATION_REHEARSAL.json',{status:'BLOCKED_AT_EXISTING_CONTRACT_BOUNDARY',database:'DISPOSABLE_FRESH_PRIVATE_DATABASE',sourceCardHash:hash(card),reconstructedPayload:'Exact retained Step4 cache body only; explicitly unpublished/unqualified in this empty test DB, not fabricated governed source/admission or publication.',realPathsExercised:['PrismaAnalyticalArtifacts.append','ProductionDependencies.resolveProductionAnalysisDependencies','readDashboard(scoring,id)','CurrentPurposeScoring.find'],readOnlyConsumerResult:{status:model.status,visibleCards:model.cards.length,currentStorageRows:1},countsBefore:before,countsAfter:await count(),publicationRowsCreated:0,formalCurrentSourceRecordsFabricated:0,testAuthorityBindingsActivated:0,successfulPublication:false,publicationReadbackAndIdempotency:'NOT_REACHABLE_NO_CURRENT_SCORE_PUBLICATION_BRIDGE',replacementControl:'PASS_SAME_ID_IMMUTABLE; latest published revision selection not established',revocationPublicationControl:'NOT_REACHABLE; current service revocation passed retained Step4, but dashboard does not use that service',databaseRemovedAfterRun:true,checks});
}finally{await db.close();}
console.log('PASS bounded rehearsal: exact integrity verified, real current publication boundary blocked, no live writes or publication.');
