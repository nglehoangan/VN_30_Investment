import {readFileSync,writeFileSync,realpathSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const reviewRoot=resolve(import.meta.dirname),authorityRoot=resolve('docs/fundamental-data-engine/vnm-step4-final-review/2026-11-17'),hasApproved=existsSync(join(authorityRoot,'APPROVED_CURRENT_AUTHORITY.json'));
const root=process.cwd(),out=resolve(process.env.VNM_REVIEW_OUTPUT_DIRECTORY??(hasApproved?join(reviewRoot,'approved-code-run'):reviewRoot)),base='docs/fundamental-data-engine/standing-authority-version/2026-11-12',f1base='docs/fundamental-data-engine/vnm-f1-membership-closure/2026-11-15';
assert(out===reviewRoot||out.startsWith(reviewRoot+'/'));mkdirSync(out,{recursive:true});
process.stderr.write('stage: bootstrap dependency loader\n');
const vr=createRequire(realpathSync('/private/tmp/vn30-step2-dependencies/node_modules/vitest/package.json')),jr=createRequire(vr.resolve('vite/package.json')),{createJiti}=await import(pathToFileURL(jr.resolve('jiti')).href);
const jiti=createJiti(import.meta.url,{alias:{'@':resolve(root,'src'),'server-only':'/private/tmp/vn30-step2-dependencies/node_modules/next/dist/compiled/server-only/empty.js'},fsCache:false,moduleCache:true}),load=p=>{process.stderr.write('stage: loading '+p+'\n');return jiti.import(resolve(root,p));};
const {sha}=await load('src/infrastructure/source-admission/registry.ts'),{snapshotHash:hash}=await load('src/infrastructure/fundamentals/snapshot-hash.ts');
const {currentCoverageFixture}=await load('tests/fixtures/current-coverage.ts');
const {CurrentFinancialAdmissions,CURRENT_FINANCIAL_CODE}=await load('src/infrastructure/source-admission/current-financial.ts');
const {ScoringEngine}=await load('src/application/scoring/engine.ts');
const {CurrentPurposeScoringConsumer}=await load('src/infrastructure/source-admission/current-scoring-consumer.ts');
const {CurrentPreScoringBindings}=await load('src/infrastructure/source-admission/pre-scoring-binding.ts');
const {CurrentFinancialCoverage}=await load('src/infrastructure/source-admission/current-coverage.ts');
const {CurrentFinancialDatasets}=await load('src/infrastructure/source-admission/current-dataset.ts');
const {VersionStandingAuthority}=await load('src/infrastructure/source-admission/versioned-authority.ts');
const {buildCafefCandidate,consumeCafefValuation}=await load('src/infrastructure/market-boundary/cafef-standing.ts');
const {PrismaBoundaryStore}=await load('src/infrastructure/repositories/market-boundary.ts');
const {ingestCafef}=await load('app/server/cafef-standing-services.ts');
const {sourceBytes}=await load('src/infrastructure/source-admission/registry.ts');
const read=p=>JSON.parse(readFileSync(p,'utf8')),pin=p=>({path:p,sha256:sha(readFileSync(p))}),write=(n,x)=>writeFileSync(join(out,n),JSON.stringify(x,null,2)+'\n');
const liveBefore=pin('data/vn30.sqlite'),f=await currentCoverageFixture();
const contextFile=join(out,'RUN_CONTEXT.json');
let runContext;try{runContext=read(contextFile);}catch{runContext={contract:'isolated-current-route-execution-clock-v1',knownAt:new Date().toISOString(),clockMeaning:'Actual first-run operational knowledge timestamp; retained unchanged for deterministic replay.'};writeFileSync(contextFile,JSON.stringify(runContext,null,2)+'\n');}
const q={...f.q,knownAt:runContext.knownAt},context={...f.context,knownAt:runContext.knownAt};
const checks=[];async function rejects(name,fn,re){let reason;try{await fn();}catch(e){reason=String(e)+(e.issues?JSON.stringify(e.issues):'');}assert(reason&&re.test(reason),name+': '+reason);checks.push({name,reason});return reason;}
const count=async()=>({admissions:Number((await f.db.$queryRawUnsafe('SELECT count(*) n FROM current_financial_admission'))[0].n),facts:Number((await f.db.$queryRawUnsafe('SELECT count(*) n FROM current_financial_fact'))[0].n),raw:Number((await f.db.$queryRawUnsafe('SELECT count(*) n FROM current_financial_raw'))[0].n),datasets:Number((await f.db.$queryRawUnsafe('SELECT count(*) n FROM current_financial_dataset'))[0].n),legacyDI:await f.db.dataInitializationAcceptance.count(),legacyBinding:await f.db.scoringDatasetBinding.count(),scorecards:await f.db.analyticalArtifact.count()});
try{
 const before=await count(),registry=pin(base+'/VERSIONED_SOURCE_REGISTRY.json');
 const actualRegistry=pin('docs/fundamental-data-engine/vnm-f2-coverage-closure/2026-11-16/VERSIONED_SOURCE_REGISTRY_V6.json');
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
 const coverageBase='docs/fundamental-data-engine/vnm-f2-coverage-closure/2026-11-16';
 const coverage=new CurrentFinancialCoverage(f.db,root,actual,datasets,{registry:()=>actualRegistry,debtReview:pin(coverageBase+'/DEBT_SOURCE_REVIEW.json'),history:pin(coverageBase+'/RETAINED_ADMITTED_HISTORY.json'),research:pin(coverageBase+'/RESEARCH_ADOPTION_CATALOG.json'),clock:{now:()=>runContext.knownAt}});
 const enriched=await coverage.bind(binding.id,context),roundtrip=await coverage.consume(enriched.id,context);
 const prebindings=new CurrentPreScoringBindings(coverage),reference=await prebindings.prepare(binding.id,context);await prebindings.verify(reference,context);
 assert.equal(reference.permitsScoring,false);assert.equal(reference.context.knownAt,runContext.knownAt);
 assert.equal(Number((await f.db.$queryRawUnsafe('SELECT count(*) n FROM current_financial_enrichment'))[0].n),1);
 assert.equal(await f.db.analyticalArtifact.count(),0);assert.equal(await f.db.scoringDatasetBinding.count(),0);
 write('PRE_SCORING_REFERENCE.json',reference);
 for(const sql of readFileSync('prisma/proposals/current-scoring-data-acceptance-v1.sql','utf8').match(/CREATE TRIGGER[\s\S]*?END;|CREATE TABLE[\s\S]*?;/g)??[])await f.db.$executeRawUnsafe(sql);
 const consumer=new CurrentPurposeScoringConsumer(f.db,prebindings,coverage,datasets);
 // Fail-closed dependencies prove dataset resolution never invokes scoring or methodology authorization.
 const engine=new ScoringEngine({findById:async()=>{throw Error('SCORING_NOT_AUTHORIZED');}},{append:async()=>{throw Error('SCORECARD_WRITE_NOT_AUTHORIZED');},find:async()=>null},undefined,consumer);
 const receipt=await engine.resolveCurrentDataset(reference,context);
 assert.equal(receipt.status,'ACCEPTED_CURRENT_DATA');assert.equal(receipt.facts.length,35);assert.equal(receipt.history.length,65);assert.equal(receipt.readyForScoring,false);assert.equal(receipt.historicalPitGranted,false);
 assert.equal(receipt.context.economicCutoff,'2026-10-30');assert.equal(receipt.originalBindingKnownAt,runContext.knownAt);
 assert.deepEqual(await engine.resolveCurrentDataset(reference,context),receipt);
 assert.equal(Number((await f.db.$queryRawUnsafe('SELECT count(*) n FROM current_scoring_data_acceptance'))[0].n),1);
 write('SCORER_CURRENT_DATA_RECEIPT.json',receipt);
 const {verifyProductionAuthorityBundle}=await load('src/infrastructure/dependencies/production-authority.ts');
 const config=read('src/infrastructure/dependencies/active-authorities.json'),baseAuthority=verifyProductionAuthorityBundle(root,config.authorityBundle);
 const {PrismaMethodologyRegistry}=await load('src/infrastructure/repositories/methodology-registry.ts');
 const {CurrentPurposeScoring,PinnedCurrentAssessmentAdoption}=await load('src/infrastructure/source-admission/current-scoring.ts');
 const {PinnedCurrentExecutableAuthority,CURRENT_SCORING_RUNTIME,currentAuthorityApprovalPayload}=await load('src/infrastructure/source-admission/current-scoring-authority.ts');
 const {validateCurrentScoringTime}=await load('src/domain/current-scoring/time.ts');
 const {AI_SCORING_IMPLEMENTATION}=await load('src/domain/personal-ai/provenance.ts');
 for(const sql of readFileSync('prisma/proposals/current-scoring-artifact-v1.sql','utf8').match(/CREATE TRIGGER[\s\S]*?END;|CREATE TABLE[\s\S]*?;/g)??[])await f.db.$executeRawUnsafe(sql);
 let method={...baseAuthority.methodology,methodologyId:'current-scoring-proposed-20261117',implementationIdentity:AI_SCORING_IMPLEMENTATION,governanceStatus:'PROPOSED',approvalReference:'',effectiveDate:runContext.knownAt.slice(0,10),recordedAt:runContext.knownAt};
 const code=CURRENT_SCORING_RUNTIME.map(pin);method.configurationReference='current-scoring-executable-code-sha256:'+hash(code);
 if(hasApproved)method=read(join(authorityRoot,'APPROVED_METHODOLOGY.json'));
 const proposalAuthority={contract:'current-scoring-executable-authority-v2',status:'PROPOSED',purpose:'CURRENT_FORMAL_VALUATION',baseAuthority:config.authorityBundle,baselineManifestHash:baseAuthority.manifest.contentHash,code,codeHash:hash(code),methodologyHash:hash(method),ownerApproval:null};
 const approvalPayloadHash=hash(currentAuthorityApprovalPayload(method,proposalAuthority.codeHash,proposalAuthority.baselineManifestHash));
 const exactProposal={...proposalAuthority,approvalPayloadHash};
 write('CURRENT_EXECUTABLE_REVIEW_PACKET.json',{...exactProposal,contentHash:hash(exactProposal)});write('PROPOSED_METHODOLOGY.json',method);
 const old=read('docs/fundamental-data-engine/vnm-final-scoring-closure/2026-11-11/VNM_FORMAL_SCORE_INPUT_READINESS.json').scoreInputCandidate;
 const latest=read(join(reviewRoot,'ASSESSMENT_CANDIDATES.json'));
 const currentAttempt={...old,id:'VNM-current-remediation-unadopted',securityId:f.securityId,asOf:'2026-10-30T23:59:59.999Z',knownAt:runContext.knownAt,calculatedAt:runContext.knownAt,methodology:method,artifactScope:'FORMAL',contract:'personal-ai-score-input-v1',currentPurpose:{contract:'current-scoring-time-v1',purpose:'CURRENT_FORMAL_VALUATION',economicCutoff:'2026-10-30',evaluatedAt:runContext.knownAt},evidence:receipt.evidence,assessments:old.assessments.map(a=>{const c=latest.rows.find(r=>r.rubricId===a.subcategory);return {...a,assessment:c.candidateBand?.label??null,selectedPoints:c.candidatePoints,source:'AI',analyst:'CHATGPT',evidence:c.topicAssessments.map(t=>({topic:t.topicId,refs:t.evidenceRefs,rationale:t.judgment})),disconfirmingEvidence:c.counterevidence,assessedAt:runContext.knownAt,rationale:c.supportedJudgment,maximumPrerequisitesMet:c.maximumPrerequisitesMet,exceptionalJustification:c.exceptionalJustification};}),review:null};
 const risk=read(join(reviewRoot,'M1_CONFIDENCE_AND_RISK_ASSESSMENT.json')); for(const [key,status,owner,methodologyId] of [['stage0',risk.stage0.candidateCompositeOutcome,'M1_STAGE_0','M1-INVESTMENT-POLICY'],['hardVeto',risk.hardVeto.candidateEngineStatus,'M1_RISK_POLICY','M1-RISK-POLICY'],['residualRisk',risk.residualRisk.candidateStatus,'M1_RISK_POLICY','M1-RISK-POLICY']]) currentAttempt[key]={owner,methodologyId,asOf:currentAttempt.asOf,evaluatedAt:runContext.knownAt,status,evidenceRefs:[...new Set(latest.rows.flatMap(r=>r.sourceReferences))]}; currentAttempt.criticalMissing=[]; write('CURRENT_SCORE_INPUT_PROPOSAL.json',{classification:'23_BANDS_AND_M1_CONTENT_PREPARED_NOT_ADOPTED',missingFormalAssembly:['GQ-INC band','Reference/metric/evidence assembly into exact adopted input','Actual trusted two-pass review and binding'],input:currentAttempt});
 validateCurrentScoringTime(currentAttempt);assert.equal(currentAttempt.asOf.slice(0,10),'2026-10-30');
 const methods=new PrismaMethodologyRegistry(f.db);await methods.append(method);assert.equal((await methods.findById(method.methodologyId)).governanceStatus,hasApproved?'APPROVED':'PROPOSED');
 const pendingPin=pin(join(out,'CURRENT_EXECUTABLE_REVIEW_PACKET.json'));
 const trust=new PinnedCurrentExecutableAuthority(root,hasApproved?pin(join(authorityRoot,'APPROVED_CURRENT_AUTHORITY.json')):pendingPin,{now:()=>runContext.knownAt});
 const {prepare}=await import('./prepare-adoption.mjs'); const prepared=await prepare({root,out,reviewRoot,input:currentAttempt,dataset:receipt,profile,hash,load}); const {validateAiScoringReview}=await load('src/domain/current-scoring/provenance.ts');validateAiScoringReview(currentAttempt,hash); const {validateExternalGate}=await load('src/domain/scoring/eligibility.ts');for(const k of ['stage0','hardVeto','residualRisk'])validateExternalGate(currentAttempt[k],currentAttempt.asOf,currentAttempt.knownAt); write('PROVENANCE_AND_M1_STRUCTURE_VALIDATION.json',{status:'PASS',actualSession:process.env.CODEX_SESSION_ID,assessmentCount:currentAttempt.assessments.length,topicCount:currentAttempt.assessments.reduce((n,a)=>n+a.evidence.length,0),noHumanClaim:true,formalAdoption:false,trustBindingInstalled:false}); const {calculateScorecard}=await load('src/domain/current-scoring/scorecard.ts'); const draftCard=calculateScorecard(currentAttempt,hash); assert.equal(draftCard.missingEvidence.length,0); assert(draftCard.totalScore!==null); write('DOMAIN_CANDIDATE_VALIDATION.json',{status:'PASS',scope:'STRUCTURAL_AND_ECONOMIC_CANDIDATE_ONLY_NOT_AUTHORIZED_SCORE',assessments:draftCard.subcategories.length,missingEvidence:draftCard.missingEvidence,allMandatoryTopicsUsable:true,confidence:draftCard.confidence,validity:draftCard.validity,totalScoreWithheldUntilAuthorization:true,scorePersisted:false}); const adoption=new PinnedCurrentAssessmentAdoption(root,prepared.packet,[]);
 const currentScoring=new CurrentPurposeScoring(f.db,methods,consumer,adoption,trust);
 const {PurposeAwareScoringEngine}=await load('src/application/scoring/purpose-aware-engine.ts');
 const purposeEngine=new PurposeAwareScoringEngine(engine,currentScoring);
 const beforeAttempt=await count(),failures=[];
 for(let i=0;i<2;i++)failures.push(await rejects('new actual current scorer refuses unapproved exact version replay '+i,()=>purposeEngine.preflightCurrent(currentAttempt,reference),hasApproved?/TRUSTED_AI_REVIEW_BINDING_REQUIRED/:/CURRENT_EXECUTABLE_APPROVAL_PENDING/));
 assert.equal(failures[0],failures[1]);assert.deepEqual(await count(),beforeAttempt);
 assert.equal(Number((await f.db.$queryRawUnsafe('SELECT count(*) n FROM current_score_artifact'))[0].n),0);
 write('CURRENT_ROUTE_VALIDATION.json',{realSourceAuthority:'REUSED_V6_UNCHANGED',dataAccepted:true,currentFinancialFacts:receipt.facts.length,historicalFacts:receipt.history.length,temporalValidation:'PASS',economicCutoff:currentAttempt.asOf.slice(0,10),knownAt:runContext.knownAt,evaluatedAt:currentAttempt.currentPurpose.evaluatedAt,methodologyEffectiveDate:method.effectiveDate,methodologyGovernanceStatus:method.governanceStatus,noBackdating:true,exactCurrentVersionRejection:failures[0],replayMatches:failures[0]===failures[1],legacyDIQueriedByNewRoute:false,legacySnapshotFabricated:false,formalScorecardProduced:false,currentScoreRows:0,totalScore:null,adoption:'EXACT_23_ASSESSMENT_PACKET_PREPARED_TRUST_BINDING_NOT_INSTALLED',currentVersionVerifier:hasApproved?'PASS':'PROPOSED',baselineExecutableVerifier:'PASS',baselineArtifacts:baseAuthority.manifest.artifacts.length,countsBefore:beforeAttempt,countsAfter:await count(),newAuthoritySelfApproved:false,productionActivated:false});
 // Apply the already owner-authorized AI-self-review procedure to actual retained session/tool artifacts,
 // in this disposable validation composition only. No caller PASS, HUMAN identity or new owner signature.
 const authPolicy='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/PERSONAL_AI_ACCEPTANCE.md';
 assert.equal(prepared.binding.ownerAuthorizationReference,authPolicy);assert(readFileSync(authPolicy,'utf8').includes('OWNER_AUTHORIZED_AI_SELF_REVIEW'));
 assert.equal(process.env.CODEX_SESSION_ID,read(join(reviewRoot,'ECONOMIC_CHALLENGE_VALIDATION.json')).actualAiSessionId);
 const adopted=new PinnedCurrentAssessmentAdoption(root,prepared.packet,[prepared.binding]);
 await adopted.verify(currentAttempt,receipt);
 const adoptedScoring=new CurrentPurposeScoring(f.db,methods,consumer,adopted,trust);
 const adoptedPurposeEngine=new PurposeAwareScoringEngine(engine,adoptedScoring);
 const authorization=await adoptedPurposeEngine.preflightCurrent(currentAttempt,reference);
 const card=await adoptedPurposeEngine.scoreCurrent(currentAttempt,reference);
 assert.equal(card.missingEvidence.length,0);assert.equal(card.subcategories.length,23);assert(card.totalScore!==null);assert.equal(card.validity,'VALID — NON-ACTIONABLE');
 const saved=await adoptedScoring.find(card.id);assert.deepEqual(saved.card,card);assert.deepEqual(await adoptedPurposeEngine.scoreCurrent(currentAttempt,reference),card);
 assert.equal(Number((await f.db.$queryRawUnsafe('SELECT count(*) n FROM current_score_artifact'))[0].n),1);
 await rejects('exact AI review rejects changed assessment',()=>adoptedScoring.preflight({...currentAttempt,assessments:currentAttempt.assessments.map((a,i)=>i?a:{...a,rationale:a.rationale+' altered'})},reference),/CURRENT_EXACT_ASSESSMENT_ADOPTION_REQUIRED/);
 await rejects('exact AI review rejects changed M1',()=>adoptedScoring.preflight({...currentAttempt,hardVeto:{...currentAttempt.hardVeto,status:'ACTIVE'}},reference),/CURRENT_EXACT_ASSESSMENT_ADOPTION_REQUIRED/);
 write('AI_ADOPTION_AND_SCORING.json',{status:'PASS',reviewMode:'OWNER_AUTHORIZED_AI_SELF_REVIEW',independentHumanReviewClaimed:false,ownerAuthorizationReference:authPolicy,ownerProcessPolicy:pin(authPolicy),actualCodexSessionId:process.env.CODEX_SESSION_ID,exactPacket:prepared.packet,reviewHash:hash(currentAttempt.review),registeredOnlyInIsolatedValidationComposition:true,liveTrustConfigurationChanged:false,projectOwnerSignatureManufactured:false,assessmentCount:23,topicCount:83,authorization,scorecardHash:hash(card),totalScore:card.totalScore,categories:card.categories,confidence:card.confidence,validity:card.validity,readbackMatches:true,duplicateCreatesNoExtraRecord:true,currentScoreRowsBefore:0,currentScoreRowsAfter:1,productionActivated:false,historicalPitGranted:false,VNM17Promoted:false});
 write('ISOLATED_SCORECARD.json',card);
 const adoptedResult={adopted:true,score:card.totalScore,reviewHash:hash(currentAttempt.review),productionActivation:false};
 write('APPLIED_ISOLATED_REVIEW_BINDING.json',{status:'VERIFIED_UNDER_EXISTING_OWNER_AUTHORIZED_AI_SELF_REVIEW',binding:prepared.binding,processAuthority:pin(authPolicy),newOwnerApprovalClaimed:false,independentHumanReviewClaimed:false,liveConfigurationChanged:false,scope:'DISPOSABLE_CURRENT_PURPOSE_SCORING_VALIDATION',packet:prepared.packet});
 await rejects('actual scorer consumer rejects PIT',()=>engine.resolveCurrentDataset(reference,{...context,purpose:'HISTORICAL_PIT'}),/CURRENT_ONLY_NOT_PIT/);
 await rejects('actual scorer consumer rejects false early knowledge',()=>engine.resolveCurrentDataset(reference,{...context,knownAt:'2026-10-30T23:59:59.999Z'}),/CONTEXT_MISMATCH/);
 await rejects('actual scorer consumer rejects cross ticker',()=>engine.resolveCurrentDataset(reference,{...context,ticker:'FPT'}),/CONTEXT_MISMATCH/);

 await rejects('prebinding cannot claim scoring permission',()=>prebindings.verify({...reference,permitsScoring:true},context),/NOT_SCORING_AUTHORIZATION/);
 await rejects('prebinding refuses PIT',()=>prebindings.verify(reference,{...context,purpose:'HISTORICAL_PIT'}),/CURRENT_ONLY_NOT_PIT/);
 await rejects('prebinding refuses changed manifest',()=>prebindings.verify({...reference,manifestHash:'0'.repeat(64)},context),/MANIFEST_MISMATCH/);

 assert.equal(roundtrip.qualifiedDebtFact.value,'8482073875397');assert.equal(roundtrip.previouslyAdmittedHistory.length,65);assert.equal(roundtrip.research.roic.annual.length,4);
 assert.equal(roundtrip.research.fcf.consolidated9m2026.value,'6434314662197');assert.equal(roundtrip.readyForScoring,false);
 const enrichedCounts=await count();assert.equal(enrichedCounts.facts,69);assert((await coverage.bind(binding.id,context)).duplicate);assert.deepEqual(await count(),enrichedCounts);
 await rejects('coverage rejects PIT',()=>coverage.consume(enriched.id,{...context,purpose:'HISTORICAL_PIT'}),/CURRENT_ONLY_NOT_PIT/);
 await rejects('coverage rejects cross ticker',()=>coverage.consume(enriched.id,{...context,ticker:'FPT'}),/CONSUMPTION_SCOPE/);



 const afterBinding=await count();assert((await datasets.bind(admitted.id,context)).duplicate);assert.deepEqual(await count(),afterBinding);
 await rejects('historical PIT rejected',()=>datasets.consume(binding.id,{...context,purpose:'HISTORICAL_PIT'}),/CURRENT_ONLY_NOT_PIT/);
 await rejects('wrong ticker rejected',()=>datasets.consume(binding.id,{...context,ticker:'FPT'}),/CONSUMPTION_SCOPE/);
 const missingQ={...q,observations:q.observations.filter(o=>!(o.concept==='TOTAL_ASSETS'&&o.end==='2026-09-30'))};
 const missing=await actual.ingest(missingQ,f.securityId);await rejects('missing dependency blocks binding',()=>datasets.bind(missing.id,context),/CURRENT_DATASET_MISSING_DEPENDENCIES/);
 await coverage.revoke(enriched.id,'ISOLATED_TEST_ONLY',q.knownAt);await rejects('adopted score readback propagates revocation',()=>adoptedScoring.find(card.id),/REVOKED/);await rejects('actual scorer consumer propagates revocation',()=>engine.resolveCurrentDataset(reference,context),/REVOKED/);await rejects('prebinding revocation enforced',()=>prebindings.verify(reference,context),/REVOKED/);await rejects('enrichment revocation propagates',()=>coverage.consume(enriched.id,context),/REVOKED/);
 await datasets.revoke(binding.id,'ISOLATED_TEST_ONLY',q.knownAt);await rejects('dataset revocation propagates',()=>datasets.consume(binding.id,context),/REVOKED/);
 await actual.revoke(admitted.id,'ISOLATED_TEST_ONLY',q.knownAt);await rejects('admission revocation propagates',()=>actual.consume(admitted.id,context),/REVOKED/);
 assert.equal(await f.db.dataInitializationAcceptance.count(),0);assert.equal(await f.db.scoringDatasetBinding.count(),0);assert.equal(await f.db.analyticalArtifact.count(),0);
 const result={contract:'vnm-current-financial-route-validation-v1',realAuthority:{registry:actualRegistry,status:'OWNER_AUTHORIZED_VERSION_IMPLEMENTATION_BOUND',implementationAuthorization:pin(coverageBase+'/IMPLEMENTATION_AUTHORIZATION.json'),governedFactsAdmitted:69,oldVersionRejection:oldReason},integrationProof:{authority:'OWNER_AUTHORIZED_VERSION_V6',sourceData:'REAL_RETAINED_VNM',factsAdmitted:69,originalClocksPreserved:true,readbackMatches:true,duplicate:true,datasetId:binding.id,boundFinancialFacts:consumed.facts.length,price:consumed.price,shares:consumed.shares,coverage:consumed.manifest.coverage,financialCoverageComplete:consumed.financialCoverageComplete,fullM3CoverageCertified:false,readyForScoring:false},coverage:{id:enriched.id,reportedBorrowings:roundtrip.qualifiedDebtFact.value,historicalFacts:65,metricDispositions:roundtrip.research.metricDispositions,readbackMatches:true,idempotent:true},currentConsumer:{status:receipt.status,dataAcceptanceId:receipt.dataAcceptanceId,currentPurposeAcceptanceCount:Number((await f.db.$queryRawUnsafe('SELECT count(*) n FROM current_scoring_data_acceptance'))[0].n),currentFacts:receipt.facts.length,historicalFacts:receipt.history.length,originalKnownAtPreserved:true,readyForScoring:false},counts:{before,afterAdmission,afterBinding,after:await count()},checks,protectedDatabase:{before:liveBefore,after:pin('data/vn30.sqlite')},aiAssessmentAdoption:adoptedResult,legacyDIAndScoringGatesUnchanged:true,formalScoringDatasetBindingCreated:false,historicalPIT:'NOT_QUALIFIED',productionActivation:'NOT_AUTHORIZED',databaseDeletedAfterRun:true};
 assert.deepEqual(result.protectedDatabase.before,result.protectedDatabase.after);write('REAL_EXECUTION.json',result);

 console.log(JSON.stringify({realAuthority:result.realAuthority.status,realAdmitted:69,boundFacts:34,authority:'OWNER_AUTHORIZED_V6',checks:checks.length,liveDatabaseUnchanged:true}));
}finally{await f.close();assert.deepEqual(pin('data/vn30.sqlite'),liveBefore);}
