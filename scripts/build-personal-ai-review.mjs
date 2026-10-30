/** Assemble an owner-authorized AI review dossier; not legacy independent acceptance. */
import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
const {RUBRICS}=await import('../src/domain/scoring/methodology.ts');
const {snapshotHash}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const out='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/ai-review-r1';
assert(!existsSync(out+'/readiness-policy.proposed.json'),'REVIEW_ALREADY_EXISTS');
const at=new Date().toISOString(),before=hash('data/vn30.sqlite');
const audit=read(out+'/pdf-dimension-audit.refined.json');
const visual=read(out+'/visual-review.json');
const policyPath='src/domain/fundamentals/manual-fundamental-evidence-requirements-v2.json';
const requirements=read(policyPath);
const baselinePath='docs/fundamental-data-engine/evidence/2026-10-17-data-initialization-final-acceptance/ACCOUNTING_RECONSTRUCTION.json';
const catalog=read('docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json').partition.members;
const sectors=new Map(read(baselinePath).rows.map(m=>[m.ticker,m.sector]));
const registryPath='src/infrastructure/fundamentals/canonical-items-v1.json';
const registry=read(registryPath);
const debtRegistry=read('src/infrastructure/fundamentals/debt-canonical-items-v2.json');
const registryItems=[...registry.items,...(debtRegistry.items??[])];
const files=[];
function write(name,value){const path=out+'/'+name;mkdirSync(path.slice(0,path.lastIndexOf('/')),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n');files.push({path,sha256:hash(path)});}
const ownerInstruction='Đây là dự án riêng sẽ không có người nghiệm thu độc lập, hãy đưa ra các tiêu chí đế chat gpt nghiệm thu. tiếp tục đối chiếu phạm vi/đơn vị trên PDF đang giữ, kiểm tra bằng chứng thời điểm, soạn policy và tạo bảng input/bridge cho từng mã. Chỉ những dữ kiện thực sự thiếu mới cần bổ sung';
const criteria=[
 ['AI01','Source integrity','All retained PDF/API/JSON hashes and exact provenance resolve; failed requests remain visible.'],
 ['AI02','Universe and sector','Exactly 30 unique security IDs; effective universe/sector bindings checked; deferred members retained.'],
 ['AI03','Scope and statement identity','Confirm issuer, statement, consolidated/separate scope and revision directly in relevant PDF pages; mixed cover letters cannot decide statement scope.'],
 ['AI04','Units and precision','Confirm declared unit/currency/scale; preserve decimal strings, zero/null/dash and per-share exceptions; no guessed conversions.'],
 ['AI05','Periods and comparability','Separate instant/annual/quarter/YTD and current/prior columns; do not mix standalone/consolidated or annualize YTD without explicit model.'],
 ['AI06','Required accounting coverage','Evaluate every sector anyOf group per period with definition-qualified alternatives; do not flatten alternatives or match by amount.'],
 ['AI07','Point-in-time','Verify publication evidence precision; availableAt is no earlier than public boundary, retrieval, ingestion and review. Date-only uses governed conservative boundary; no backdating.'],
 ['AI08','Market and actions','Purpose-qualified dated prices, shares/market-cap/EV where the valuation model needs them, action adjustment and calendar/session/freshness checks.'],
 ['AI09','Derived metrics','Replay exact formulas with compatible scope/period/unit, operand IDs and normalized/debt qualification; denominator and cycle failures remain N/R.'],
 ['AI10','Valuation and assumptions','Explicit sector valuation model, conservative/base/downside assumptions and sensitivity; estimates are labelled and traced.'],
 ['AI11','Assessment coverage','All 23 rubric assessments and required topics have reasoned evidence and counter-evidence, with no fabricated neutral points or HUMAN attribution for AI.'],
 ['AI12','Input and bridge equality','Exact snapshot, methodology, source/assessment/derivation IDs; runtime-validated ScoreInput and bridge reproduce identical evidence and metrics.'],
 ['AI13','Adversarial check','Second checking pass reopens sources and attempts to refute producer conclusions; uses separate expected/actual records plus mutation/negative tests. This is AI self-review, not human independence.'],
 ['AI14','Reproducibility and issue closure','Repeatable hashes and tests; no unresolved Critical/Major issue affecting requested use. One blocked ticker does not get a fabricated score.'],
 ['AI15','Personal AI release record','Exact dataset hash, review tool/model/session identity where available, date and owner-authorized review mode recorded; no synthetic legacy independent reviewer.'],
].map(([id,name,passCondition])=>({id,name,passCondition,required:true}));
write('ai-acceptance-criteria.json',{contract:'personal-ai-dataset-review-criteria-v1',version:'1.0.0',reviewMode:'OWNER_AUTHORIZED_AI_SELF_REVIEW',ownerInstruction,ownerInstructionSha256:createHash('sha256').update(ownerInstruction).digest('hex'),recordedAt:at,humanIndependentReviewerRequired:false,notEquivalentToHumanIndependentReview:true,acceptanceRule:'All applicable required criteria PASS, each bound to expected/actual and hashed evidence; no unresolved Critical/Major. BLOCKED/FAIL cannot be converted to PASS by self-attestation.',criteria,legacyRuntimeContract:'independent-di-acceptance-v1',legacyRuntimeContractUnchanged:true,newReviewContractMustNotMasqueradeAsLegacy:true});
const routes=Object.entries(requirements.sectors).map(([sector,r])=>({sector,requiredGroups:[...r.CORE.map(g=>({...g,group:'CORE'})),...r.SECTOR_CORE.map(g=>({...g,group:'SECTOR_CORE'}))],supporting:r.SUPPORTING,optional:r.OPTIONAL,rationale:r.rationale,accountingRequiredDerivations:r.requiredDerivations,scoringMetricSelection:'EXPLICIT_MODEL_AND_OPERAND_REVIEW_REQUIRED_NOT_INFERRED_FROM_EMPTY_ACCOUNTING_LIST',requiredMarketObservations:['price'],valuationModelRequirements:sector==='BANK'?['sustainable_ROE','common_BVPS','cost_of_equity','conservative_value','expected_return_scenarios']:sector==='REAL_ESTATE'?['project_asset_quality','economic_debt','cash_realisation_timing','conservative_value','expected_return_scenarios']:sector==='SECURITIES'?['normalized_earnings','capital_and_margin_risk','conservative_value','expected_return_scenarios']:['normalized_cash_earnings','reinvestment_and_returns','economic_debt','conservative_value','expected_return_scenarios'],additionalMarketRequirements:'shares/market_cap for capitalization models; EV only for enterprise valuation; share class and adjustment must match model'}));
write('readiness-policy.proposed.json',{contract:'personal-ai-readiness-policy-proposal-v1',version:'1.0.0',status:'PROPOSED_NOT_RUNTIME_AUTHORITY',recordedAt:at,sourcePolicy:{path:policyPath,sha256:hash(policyPath),version:requirements.version},sourceMethodologyReferences:requirements.authorityReferences,categoryWeights:requirements.categoryWeights,freshness:requirements.freshness,sourcePriority:'PDF_FIRST_NUMERIC; CafeF reference only when PDF unavailable and explicitly labelled; no automatic accounting admission',scopeRule:'CONSOLIDATED preferred for group economics; standalone kept separate; fallback must be justified, never silently mixed',periodRule:'FY2022-FY2025 plus 2026 YTD at 2026-06-30; retain earlier facts for averages/history; actual required windows depend on sector/model and reporting-cycle freshness',publicationRule:'Explicit published date or timestamp requires source review. Signed/audit/report dates, PDF metadata and retrieval alone are not original publication. DATE_ONLY conservatively available after end of that local date and no earlier than retrieval/ingestion/review.',reviewMode:'OWNER_AUTHORIZED_AI_SELF_REVIEW',humanIndependentReviewerRequired:false,aiAssessmentAttribution:'AI, never HUMAN; current scorer HUMAN-only constraint requires an additive versioned implementation before AI assessments enter FORMAL scoring',routes,representation:'Preserve anyOf/preference. Current flat native readiness contract needs explicit sector-requirement-group binding; do not coerce this proposal into ScoringReadinessRequirements.',productionAdmissible:false});
const db=new DatabaseSync('data/vn30.sqlite',{readOnly:true});
const summaries=[],blockers=[],pitRows=[];
const docsByHash=new Map();for(const d of audit.documents)if(d.sha256){if(!docsByHash.has(d.sha256))docsByHash.set(d.sha256,[]);docsByHash.get(d.sha256).push(d);}
const selectedVisual=new Map(visual.pages.map(p=>[p.sha256+':'+p.page,p]));
try{
for(const member of catalog){
 const sector=sectors.get(member.ticker);assert(sector);const route=routes.find(r=>r.sector===sector);assert(route);
 const records=db.prepare("SELECT id,body,body_hash AS bodyHash FROM fundamental_admission_run WHERE json_extract(body,'$.canonicalFacts[0].ticker')=? ORDER BY id").all(member.ticker);
 const admissions=records.map(r=>{assert.equal(createHash('sha256').update(r.body).digest('hex'),r.bodyHash);return {id:r.id,bodyHash:r.bodyHash,body:JSON.parse(r.body)};});
 const facts=admissions.flatMap(a=>a.body.canonicalFacts.map(f=>({...f,admissionRunId:a.id})));
 const endDates=['2022-12-31','2023-12-31','2024-12-31','2025-12-31','2026-06-30'];
 const factRows=facts.map(f=>{
  const docs=docsByHash.get(f.sourceHash)??[];
  const match=/PDF page\s+(\d+)/i.exec(f.evidenceLocator??'');const page=match?Number(match[1]):null;
  const sourcePage=docs.flatMap(d=>d.pages).find(p=>p.page===page);
  const checked=page?selectedVisual.get(f.sourceHash+':'+page):null;
  const pub=docs.flatMap(d=>d.pages.flatMap(p=>p.publicationCandidates.map(c=>({path:d.path,page:p.page,...c}))));
  const result={factId:f.id,itemId:f.itemId,value:f.value,period:f.period,scope:f.scope,unit:f.unit,currency:f.currency,admissionRunId:f.admissionRunId,existingReviewReference:f.reviewReference,sourceHash:f.sourceHash,retainedPdfPaths:docs.map(d=>d.path),sourcePage:page,scopeFromPage:sourcePage?.scopeCandidate??null,unitDeclaration:sourcePage?.unitCandidate??null,visualScopeUnit:checked??null,publication:{existingPublishedAt:f.publishedAt??null,historicalPitEligible:f.historicalPitEligible===true,candidates:pub,status:f.historicalPitEligible===true&&f.publishedAt?'EXISTING_PIT_REQUIRES_NATIVE_BINDING':pub.length?'DECLARATION_LOCATED_REQUIRES_SOURCE_REVIEW':'PUBLICATION_NOT_YET_VERIFIED'},nativeObservationId:null,nativeAssessmentId:null,formalBridgeEligible:false};
  if(sourcePage&&sourcePage.scopeCandidate!==null&&sourcePage.scopeCandidate!=='AMBIGUOUS'&&sourcePage.scopeCandidate!==f.scope)blockers.push({ticker:member.ticker,kind:'SCOPE_DISAGREEMENT_TO_RECHECK',factId:f.id,declared:f.scope,pageCandidate:sourcePage.scopeCandidate,sourceHash:f.sourceHash,page});
  return result;
 });
 const inputRows=endDates.flatMap(end=>route.requiredGroups.map(g=>{
  const candidates=factRows.filter(f=>g.anyOf.includes(f.itemId)&&f.period.end===end&&f.scope==='CONSOLIDATED');
  const chosen=(g.preference??g.anyOf).find(item=>candidates.some(c=>c.itemId===item))??null;
  return {periodEnd:end,group:g.group,requirementId:g.id,component:g.component,anyOf:g.anyOf,preference:g.preference??[],candidateSelectedItem:chosen,candidateFactIds:candidates.filter(c=>c.itemId===chosen).map(c=>c.factId),alternatives:candidates.map(c=>({itemId:c.itemId,factId:c.factId,value:c.value,period:c.period,scope:c.scope})),status:candidates.length?'RETAINED_CANONICAL_COVERAGE_NATIVE_BRIDGE_PENDING':'NOT_LOCATED_IN_RETAINED_CANONICAL_RECHECK_PDF_API',nativeDefinitions:g.anyOf.map(itemId=>({itemId,available:registryItems.some(i=>i.itemId===itemId),registryGovernanceStatus:registry.governanceStatus})),readyForScoring:false};
 }));
 const metrics=admissions.flatMap(a=>a.body.derivedMetrics).map(d=>({id:d.id,metric:d.metric,value:d.value,status:d.status,quality:d.quality,period:d.period,scope:d.scope,operandIds:d.operandIds,reason:d.reason??null,formulaVersion:d.formulaVersion,nativeDerivationId:null,formalBridgeEligible:false}));
 const rubricPlan=RUBRICS.map(r=>({subcategory:r.id,category:r.category,max:r.max,topics:r.topics.map(topic=>({topic,candidateFactIds:factRows.filter(f=>registryItems.some(i=>i.itemId===f.itemId&&i.evidenceTopicMappings?.some(m=>m.rubricId===r.id&&m.topic===topic))).map(f=>f.factId),assessment:null,evidenceBindingStatus:'MAPPING_CANDIDATE_REQUIRES_ECONOMIC_AND_PERIOD_REVIEW'})),assessmentSource:'AI_PROPOSED_NOT_HUMAN',selectedPoints:null,rationale:null,counterEvidence:[],status:'ASSESSMENT_NOT_PERFORMED'}));
 const market=db.prepare("SELECT id,body,body_hash AS bodyHash FROM broker_observation WHERE kind='TCBS_MARKET_PRICE' AND api_id=? ORDER BY CASE WHEN json_extract(body,'$.schemaVersion')='tcbs-display-price-v2' THEN 1 ELSE 0 END DESC,COALESCE(json_extract(body,'$.selectedAt'),received_at) DESC,id ASC LIMIT 1").get(member.ticker);
 if(market)assert.equal(createHash('sha256').update(market.body).digest('hex'),market.bodyHash);
 const dossier={contract:'personal-ai-ticker-input-bridge-preparation-v1',ticker:member.ticker,securityId:member.securityId,sector,asOf:at,knownAt:at,retainedPartitionState:member.state,productionAdmissible:false,readyForScoring:false,admissionPins:records.map(({id,bodyHash})=>({id,bodyHash})),requiredAccountingInputs:inputRows,factEvidence:factRows,metricCandidates:metrics,marketInput:market?{observationId:market.id,bodyHash:market.bodyHash,price:JSON.parse(market.body),productionQualified:false}:null,rubricInputPlan:rubricPlan,bridgePreparation:{nativeSnapshotRunId:null,nativeObservationAndAssessmentPins:[],nativeDerivationIds:[],runtimeBridgePlan:null,note:'Retained canonical IDs are not native observation IDs. Mapping cannot be invented to make validateBridgePlan pass.'},scoreInput:null,blockers:['NATIVE_OBSERVATION_ASSESSMENT_SNAPSHOT_BINDINGS','SOURCE_SCOPE_UNIT_AND_PUBLICATION_REVIEW','QUALIFIED_MARKET_AND_EXPLICIT_VALUATION','23_EVIDENCE_BACKED_AI_ASSESSMENTS','AI_REVIEW_CONTRACT_RUNTIME_INTEGRATION']};
 write(`tickers/${member.ticker}.json`,dossier);
 const covered=inputRows.filter(r=>r.candidateFactIds.length).length;
 summaries.push({ticker:member.ticker,sector,facts:factRows.length,requirements:inputRows.length,canonicalCovered:covered,canonicalUnlocated:inputRows.length-covered,retainedPdfSources:new Set(factRows.flatMap(f=>f.retainedPdfPaths)).size,visualMatchedFacts:factRows.filter(f=>f.visualScopeUnit).length,publicationCandidates:factRows.filter(f=>f.publication.candidates.length).length,metricsAvailable:metrics.filter(m=>m.status==='AVAILABLE'&&m.quality==='VALID').length,readyForScoring:false,path:`${out}/tickers/${member.ticker}.json`});
 pitRows.push(...audit.documents.filter(d=>d.ticker===member.ticker).map(d=>({ticker:member.ticker,path:d.path,sha256:d.sha256,retrievedAt:d.retrievedAt,sourceStatus:d.status,publicationVerified:false,candidates:d.pages?.flatMap(p=>p.publicationCandidates.map(c=>({page:p.page,...c})))??[]})));
}
}finally{db.close();}
assert.equal(hash('data/vn30.sqlite'),before,'DATABASE_CHANGED');
write('point-in-time-review.json',{contract:'personal-ai-publication-evidence-review-v1',publicationConfirmed:false,note:'Each candidate is tied to its own retained PDF. No propagation across standalone/consolidated files or original/revision variants. Audit/signature dates are not publication. Historical source-receipt gaps are not fixed by current retrieval.',documents:pitRows});
write('input-bridge-index.json',{contract:'personal-ai-input-bridge-index-v1',status:'PREPARED_NOT_FORMAL_SCORE_INPUT',members:summaries,sourceScopeDisagreements:blockers,userSupplementRequests:[],supplementRule:'No request inferred from canonical gaps. Search existing source PDFs/API and separate extraction/mapping/code gaps from genuinely absent documents before asking owner.',runtimeGaps:['Current independent-di-acceptance-v1 requires legacy independent-review binding; do not fake a reviewer to satisfy it.','Current Assessment.source supports HUMAN only. Add an explicitly versioned AI provenance path before FORMAL scoring; do not label AI as HUMAN.','Native observations/assessments/derivations/snapshot and item-definition/anyOf gaps require implementation and qualified bindings, not new uploads.']});
write('review-manifest.json',{contract:'personal-ai-review-dossier-manifest-v1',createdAt:at,productionAdmissible:false,scoringAuthorized:false,databaseUnchanged:true,databaseSha256:before,inputPins:[policyPath,registryPath,baselinePath,out+'/pdf-dimension-audit.refined.json',out+'/visual-review.json'].map(path=>({path,sha256:hash(path)})),builder:{path:'scripts/build-personal-ai-review.mjs',sha256:hash('scripts/build-personal-ai-review.mjs')},artifacts:[...files],criteriaHash:snapshotHash(read(out+'/ai-acceptance-criteria.json'))});
console.log(JSON.stringify({tickers:summaries.length,facts:summaries.reduce((n,s)=>n+s.facts,0),requiredInputRows:summaries.reduce((n,s)=>n+s.requirements,0),unlocated:summaries.reduce((n,s)=>n+s.canonicalUnlocated,0),databaseUnchanged:true,scoringAuthorized:false}));
