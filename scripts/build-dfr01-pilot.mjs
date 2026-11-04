/** Owner-approved read-only pilot. Run with supported Node 22; writes only new DFR-01 exports. */
import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, renameSync} from 'node:fs';
import {resolve, relative, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {PILOT, CONTRACT, rowDisposition, parentCapital, requireResearchMode, clusteredZeros, losslessJson} from './lib/dfr01.mjs';
const {readRetainedResearch, jsonPointer} = await import('../src/infrastructure/fundamentals/retained-research.ts');
const {RUBRICS} = await import('../src/domain/scoring/methodology.ts');
const {validateDIAcceptance} = await import('../src/domain/personal-ai/scoring-readiness.ts');
const {validateAiScoringReview} = await import('../src/domain/personal-ai/provenance.ts');
const {snapshotHash} = await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const startedAt=new Date().toISOString();
const ROOT = process.cwd(), OUT = 'docs/fundamental-data-engine/dfr-01/2026-11-04';
process.on('uncaughtException',error=>{
 const marker=`${OUT}/manifest.json`;
 if(existsSync(marker))renameSync(marker,`${OUT}/invalidated-manifest-${Date.now()}.json`);
 console.error(error);process.exitCode=1;
});
const BASE = 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-04';
const RESEARCH = `${BASE}/investment-research-v2`, R4 = `${BASE}/m8-r4-evidence-rubric-completion-v1`;
const cutoff = process.env.DFR01_CUTOFF ?? '2026-11-04T16:59:59.999Z', mode = process.env.DFR01_MODE ?? 'AS_REVISED';
requireResearchMode(mode); assert.ok(Number.isFinite(Date.parse(cutoff)), 'INVALID_CUTOFF');
assert.equal(cutoff,'2026-11-04T16:59:59.999Z','NEW_CUTOFF_REQUIRES_NEW_RUN_DIRECTORY');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const sha = p => digest(readFileSync(p));
const read = p => JSON.parse(readFileSync(p,'utf8'));
const pins = {};
function pin(path, jsonPointer = '') {const sha256=pins[path]??sha(path); pins[path]=sha256; return {path,sha256,jsonPointer};}
function verifyManifest(path, groups) {
 const m=read(path); pin(path);
 for(const group of groups) for(const [p,h] of Object.entries(m[group] ?? {})) {
  const target=existsSync(p)?p:relative(ROOT,resolve(dirname(path),p)); assert.equal(sha(target),h,`PIN_CHANGED:${target}`);pin(target);
 }
}
function protectedFiles() {
 const result={};
 const walk=p=>{if(!existsSync(p))return; for(const e of readdirSync(p)){const f=`${p}/${e}`;if(statSync(f).isDirectory())walk(f);else result[f]=sha(f);}};
 for(const p of ['src','app','prisma','config','docs/fundamental-data-engine/scoring-dataset-acceptance'])walk(p);
 for(const f of ['data/vn30.sqlite','data/vn30.sqlite-wal','data/vn30.sqlite-shm'])if(existsSync(f))result[f]=sha(f);
 return result;
}
const before=protectedFiles();
for(const path of ['scripts/build-dfr01-pilot.mjs','scripts/lib/dfr01.mjs','scripts/test-dfr01-pilot.mjs','docs/fundamental-data-engine/dfr-01/APPROVAL.md','docs/fundamental-data-engine/dfr-01/PROPOSAL-v0.1.md'])pin(path);
const output={}; const emit=(path,value)=>{output[path]=typeof value==='string'?value:JSON.stringify(value,null,2)+'\n';};
// Verify the predecessor's complete recorded dependency sets, not just a dossier hash.
verifyManifest(`${RESEARCH}/manifest.json`,['inputPins','outputs']);
verifyManifest(`${R4}/manifest.json`,['sourcePins','outputs']);
const inventory=[];
for(const [folder,manifest,key,pathKey] of [
 ['data/manual-extracted-pdf','display-manifest.json','files','file'],
 ['data/manual-extracted-api','manifest.json','files','path'],
 ['data/combine','manifest.json','files','path']]) {
 const mp=`${folder}/${manifest}`;pin(mp);const m=read(mp);
 assert.equal(m[key].length,30);
 for(const f of m[key]) {const p=f[pathKey].startsWith('data/')?f[pathKey]:`${folder}/${f[pathKey]}`;assert.equal(sha(p),f.sha256,`SHARD_HASH:${p}`);pin(p);read(p);}
}
pin('data/manual-extracted-api/requests.json');
const catalog=await readRetainedResearch(ROOT,undefined,undefined,undefined,cutoff);
assert.equal(catalog.catalog.length,30);assert.equal(new Set(catalog.catalog.map(x=>x.ticker)).size,30);
for(const {ticker} of catalog.catalog) {
 const d=read(`data/combine/${ticker}.json`);const counts={};
 for(const [report,r] of Object.entries(d.reports)) {
  counts[report]={};for(const year of ['2022','2023','2024','2025'])counts[report][year]=r.periods[year]?.variants.length??0;
 }
 const notes=`data/manual-extracted-pdf/notes/${ticker}.json`;read(notes);pin(notes);
 inventory.push({ticker,counts,nonYearKeys:[...new Set(Object.values(d.reports).flatMap(r=>Object.keys(r.periods).filter(k=>!/^\d{4}$/.test(k))))],status:'INVENTORY_ONLY_NOT_OPERAND_COMPLETENESS'});
}
const checkedPath=`${RESEARCH}/checked-capital-readings.json`,checked=read(checkedPath).readings;
const coverage=read(`${R4}/rubric-coverage.json`),assessments=read(`${R4}/assessments/current-research-assessments.json`);
const exceptions=[], dossiers=[], apiReplay=[];
const common={contract:CONTRACT,classification:'RESEARCH_PROVISIONAL',mode,cutoff,productionAdmissible:false,scoringAuthorized:false,historicalAsKnownSupported:false,totalScore:null,ranking:null,currentSignal:null};
for(const ticker of PILOT) {
 console.log(`DFR-01: replaying ${ticker}`);
 const dataPath=`data/combine/${ticker}.json`,raw=read(dataPath),first=await readRetainedResearch(ROOT,ticker,undefined,undefined,cutoff);
 const rows=[],separatePeriods=[];
 for(const variant of first.variants) {
  if(!['2025','2025-12-31'].includes(variant.periodKey)||!['ANNUAL','INSTANT'].includes(variant.periodType)||!['Cân đối kế toán','Kết quả kinh doanh','Lưu chuyển tiền tệ'].includes(variant.report)) {separatePeriods.push(variant);continue;}
  let page=0;
  do {
   const view=await readRetainedResearch(ROOT,ticker,String(variant.index),String(page),cutoff);
   for(const row of view.rows) {
    const original=jsonPointer(raw,row.pointer), disposition=rowDisposition(row,variant,original);
    const item={...row,...disposition,id:`${ticker}:variant:${variant.index}:${row.pointer}`,kind:'EXTRACTED_CANDIDATE',period:variant.periodKey,periodType:variant.periodType,periodEnd:variant.periodEnd,months:variant.periodType==='ANNUAL'?12:null,scope:row.reportingScope,variantId:variant.id,mappingVersion:'dfr01-exact-source-row-v1',mappingIdentity:{template:variant.id,code:row.code,occurrencePointer:row.pointer,caption:row.label},combineBinding:pin(dataPath,row.pointer),extractedBinding:row.evidencePath?pin(row.evidencePath,row.evidencePointer):null,sourceBinding:variant.sourcePath&&existsSync(variant.sourcePath)?pin(variant.sourcePath):null,retrievedAt:variant.retrievedAt,publicationAt:null,auditRestatementStatus:'NOT_INDEPENDENTLY_QUALIFIED',candidateValue:original.value,lexicalValue:original.lexicalValue??original.pdfLexicalValue??null,needsReview:original.needsReview??true,mappingBasis:original.mappingBasis??null,comparisonDimensionsVerified:original.comparisonDimensionsVerified??null,dependencyIds:[],conflicts:original.conflicts??[],cafefReferences:original.cafefReferences??[],pdfEvidence:original.pdfEvidence??null,apiRequest:variant.provider==='CAFEF'?jsonPointer(raw,row.pointer.split('/groups/')[0]).source:null};
    rows.push(item);
    if(row.source==='CAFEF_REFERENCE'&&row.value!==null&&row.rawLocator&&!apiReplay.some(p=>p.ticker===ticker&&p.variantId===variant.id)) {
     const raw=losslessJson(readFileSync(variant.sourcePath,'utf8')),rawValue=jsonPointer(raw,row.rawLocator);
     assert.equal(rawValue,row.value,`RAW_API_VALUE_MISMATCH:${ticker}:${row.rawLocator}`);
     apiReplay.push({ticker,variantId:variant.id,status:'REPLAYED_REFERENCE_NOT_CALCULATION_QUALIFIED',value:row.value,rawBinding:pin(variant.sourcePath,row.rawLocator),extractedBinding:item.extractedBinding,request:item.apiRequest});
    }
   }
   page++;if(page*100>=view.totalRows)break;
  } while(true);
 }
 const inherited=read(`${RESEARCH}/issuers/${ticker}.json`),metrics=[];
 metrics.push({id:`${ticker}:reported-common-earnings-reference`,kind:'INHERITED_RESEARCH_REFERENCE',metric:'reportedCommonEarningsReference',status:'REFERENCE_ONLY',value:inherited.earnings.reportedCommonReferenceVnd,unit:'CURRENCY',currency:'VND',scale:'1',period:'FY2025',scope:inherited.earnings.reportedReferenceScope,binding:pin(`${RESEARCH}/issuers/${ticker}.json`,'/earnings/reportedCommonReferenceVnd'),dependencyIds:[inherited.earnings.binding.path],normalizationBinding:inherited.earnings.binding,reasons:['REPORTED_EARNINGS_NOT_AUTOMATICALLY_RECURRING_COMMON_EARNINGS','REUSE_PREDECESSOR_NORMALIZATION_WITH_ORIGINAL_LIMITATIONS']});
 const reading=checked.find(r=>r.ticker===ticker);
 if(reading) {
  assert.equal(sha(reading.source.pdfPath),reading.source.sha256);
  const value=parentCapital(reading);assert.equal(value.value,inherited.capitalBridge.parentCapitalReferenceVnd);
  const overlay={id:`${ticker}:checked-capital`,kind:'REUSED_REVIEW_OVERLAY',status:'SUPPORTED',metric:'parentAccountingCapitalReference',value:value.value,unit:'CURRENCY',currency:'VND',scale:'1',nativeOperands:{equity:reading.selectedEquitySubtotalNative,nci:reading.nciNative,multiplier:reading.multiplier},formula:value.formula,scope:reading.sourceScope,period:'FY2025',periodEnd:reading.periodEnd,months:null,mappingVersion:'dfr01-checked-capital-v1',dependencyIds:[],binding:pin(checkedPath,`/readings/${checked.indexOf(reading)}`),pdfEvidence:reading.source,review:{actor:'CHATGPT',mode:'REUSE_PREDECESSOR_PAGE_REVIEW',reviewDate:reading.reviewDate,exactReviewTime:reading.exactReviewTime,newVisualInspection:false},predecessor:pin(`${RESEARCH}/issuers/${ticker}.json`,'/capitalReading'),reasons:['ACCOUNTING_CAPITAL_ONLY_NOT_COMMON_SHARE_FAIR_VALUE','PREFERRED_ECONOMIC_CLAIMS_NOT_ASSUMED_ZERO']};
  metrics.push(overlay);
  if(['TCX','VIC','VHM'].includes(ticker))exceptions.push({ticker,itemId:overlay.id,status:'REFERENCE_ONLY',reasons:[ticker==='TCX'?'DATE_KEY_AND_ROW_PAGE_SCHEMA_PRESERVED':ticker==='VHM'?'EXTRACTED_NCI_MAGNITUDE_AND_UNRESOLVED_CLOSING_COLUMN':'UNRESOLVED_CLOSING_COLUMN'],resolution:'Exact predecessor PDF page/column capital reading reused as a separate overlay; all original extraction candidates preserved.',overlay,dependentMetricIds:[`${ticker}:checked-capital`],sourceRowsNotOverwritten:true});
 }
 const rubrics=coverage.rows.filter(x=>x.ticker===ticker).map(r=>{
  const rule=RUBRICS.find(x=>x.id===r.rubricId);assert.deepEqual(r.topics,[...rule.topics]);
  const a=assessments.assessments.find(x=>x.ticker===ticker&&x.assessment.subcategory===r.rubricId);
  if(a) {const band=rule.bands.find(b=>b.label===a.assessment.assessment);assert.ok(band&&a.assessment.selectedPoints>=band.min&&a.assessment.selectedPoints<=band.max);assert.deepEqual(a.assessment.evidence.map(x=>x.topic).sort(),[...rule.topics].sort());assert.ok(a.assessment.disconfirmingEvidence.length);}
  return {id:r.id,rubric:r.rubricId,status:a?'SUPPORTED':'NOT_RATED',kind:'JUDGMENT',provisional:true,points:a?a.assessment.selectedPoints:null,band:a?a.assessment.assessment:null,topics:r.topics,assessment:a?.assessment??null,reason:a?'REUSED_EXACT_PINNED_R4_RESEARCH_JUDGMENT':'TOPIC_SUPPORT_COUNTEREVIDENCE_AND_BAND_REVIEW_INCOMPLETE',blockers:r.missingOrConflictingEvidence,dependencyIds:a?a.assessment.evidence.flatMap(e=>e.refs):[],predecessor:pin(`${R4}/rubric-coverage.json`,`/rows/${coverage.rows.indexOf(r)}`),formalScoringReady:false};
 });
 for(const row of rows.filter(x=>x.status!=='SUPPORTED')) exceptions.push({ticker,itemId:row.id,status:row.status,reasons:row.reasons,dependencyIds:row.dependencyIds,binding:row.combineBinding,action:'Inspect exact PDF page/caption/column or qualify API dimensions; defer dependent calculations only.'});
 for(const r of rubrics.filter(x=>x.status==='NOT_RATED'))exceptions.push({ticker,itemId:r.id,status:r.status,reasons:[r.reason],blockers:r.blockers,action:'Prepare topic-specific evidence and distinct counterevidence before band selection.'});
 const dossier={...common,ticker,primaryPeriod:'FY2025',rows,metrics,rubrics,separatePeriods,historyPolicy:'FY2022-FY2024 retained as separate variants; no unqualified growth comparison',inheritedResearch:{binding:pin(`${RESEARCH}/issuers/${ticker}.json`),earnings:inherited.earnings,scenarios:inherited.modelScenarios,conditions:inherited.researchConditions,blockers:inherited.blockingBeforeDatedTradeConclusion,kind:'ESTIMATES_AND_CONDITIONAL_SCENARIOS',status:'REFERENCE_ONLY',model:inherited.researchModelFamily??'PRIOR_11_CONDITIONAL_MODEL',invalidation:['Input pin changes','Period/scope/unit mismatch','Unresolved common claims','Share/action/market cutoff not qualified'],perShareValue:null,marginOfSafety:null},preparation:{actor:'CHATGPT',review:'Reused exact pinned source reviews; checked row and capital arithmetic; no new whole-statement source-image review.'},challenge:{actor:'CHATGPT',independentHumanReviewClaimed:false,authenticatedRuntimeIdentity:null,findings:['Inventory does not establish metric completeness.','Bank and securities accounting capital is not distributable equity.','Unresolved tax/preference/NCI and recurring earnings prevent share-price inference.','Unknown provider units and clustered zeros cannot supply missing cashflow operands.'],newRatingsAssigned:0}};
 assert.throws(()=>validateDIAcceptance(dossier));assert.throws(()=>validateAiScoringReview(dossier,snapshotHash));
 dossiers.push(dossier);emit(`issuers/${ticker}.json`,dossier);
 const metricText=metrics.map(x=>`- ${x.metric}: ${x.value} VND (${x.scope}), **${x.status}**${x.formula?`; ${x.formula}; [PDF](../../../../../${x.pdfEvidence.href})`:''}`).join('\n');
 const readingText=`Reported common earnings reference: ${inherited.earnings.reportedCommonReferenceVnd} VND (${inherited.earnings.reportedReferenceScope}). Working conditional case: ${inherited.earnings.workingCaseVnd??'not selected'} VND (${inherited.earnings.workingScope}); these bases remain separate. Model: ${dossier.inheritedResearch.model}. The retained scenario range is ${inherited.equityScenarioRange.minimumVnd}–${inherited.equityScenarioRange.maximumVnd} VND, a sensitivity range rather than a confidence interval or accepted fair value.`;
 const ratingText=rubrics.filter(r=>r.assessment).map(r=>`${r.rubric}: ${r.assessment.rationale}\n\nCounterevidence: ${JSON.stringify(r.assessment.disconfirmingEvidence)}; exact evidence and rationale remain in the JSON dossier.`).join('\n\n');
 emit(`issuers/${ticker}.md`, `# ${ticker} — Research Provisional\n\nFY2025 · AS_REVISED · cutoff ${cutoff}\n\n${rows.length} retained row candidates; ${metrics.filter(x=>x.status==='SUPPORTED').length} supported accounting-capital metric; ${rubrics.filter(x=>x.status==='SUPPORTED').length}/23 reused rubric judgments. Total score, ranking, per-share value and MoS: withheld.\n\n## Financial reading and conditional scenarios\n\n${readingText}\n\n${ratingText}\n\n## Metrics\n\n${metricText}\n\n## Rubrics\n\n| Rubric | Status | Band | Points |\n|---|---|---|---:|\n${rubrics.map(r=>`| ${r.rubric} | ${r.status} | ${r.band??'—'} | ${r.points??'—'} |`).join('\n')}\n\n## Exceptions and counterevidence\n\n${dossier.challenge.findings.map(x=>`- ${x}`).join('\n')}\n\nIssuer-specific deferred prerequisites:\n\n${inherited.blockingBeforeDatedTradeConclusion.map(x=>`- ${x}`).join('\n')}\n\nExact item reasons, operands, source hashes, JSON Pointers, source PDF boxes/API raw locators and predecessor reviews: [JSON dossier](${ticker}.json). Independent formal acceptance remains separate.\n`);
}
const hpg=read('data/manual-extracted-api/HPG.json'),zeroClusters=[];
for(const [report,r] of Object.entries(hpg.reports))if(report==='luu-chuyen-tien-te')for(const [period,p] of Object.entries(r.periods))for(const v of p.variants)if(clusteredZeros(v.groups.flatMap(g=>g.rows)))zeroClusters.push({report,period,variantId:v.id,source:v.source});
assert.ok(zeroClusters.length,'EXPECTED_RETAINED_HPG_ZERO_CLUSTER');
emit('exception-probes.json',{hpg:{ticker:'HPG',status:'REFERENCE_ONLY',reason:'CLUSTERED_PROVIDER_ZEROS_REQUIRE_SOURCE_REVIEW_NOT_CASHFLOW_FACTS',binding:pin('data/manual-extracted-api/HPG.json'),zeroClusters},tcx:{dateKeyPreserved:true},vhm:{originalExtractionUnchanged:true,correctionOnlyInPinnedPredecessorOverlay:true}});
emit('api-replay.json',{status:'PASS_REFERENCE_LINEAGE_ONLY',probes:apiReplay});
// Stop before exporting if input bytes or protected runtime/baseline state changed.
for(const [p,h] of Object.entries(pins))assert.equal(sha(p),h,`INPUT_CHANGED_DURING_RUN:${p}`);
assert.deepEqual(protectedFiles(),before,'PROTECTED_STATE_CHANGED');
const supported=dossiers.reduce((n,d)=>n+d.rubrics.filter(x=>x.status==='SUPPORTED').length,0);
emit('inventory.json',{...common,universe:inventory,quarantines:catalog.quarantines});
emit('exceptions.json',{...common,items:exceptions});
emit('input-snapshot.json',{...common,baselineHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),pins});
emit('boundary-verification.json',{status:'PASS_SCOPED_PILOT',protectedBefore:before,protectedAfter:before,formalDIRejected:true,formalAIReviewRejected:true,productionActivation:false});
emit('REPORT.md',`# DFR-01 — owner-approved read-only pilot\n\nDesign and six-issuer pilot authorized by owner on 2026-11-04. Output remains provisional and awaits dossier review before expansion.\n\n30-issuer inventory; six dossiers; ${supported}/138 reused supported rubric judgment, ${138-supported}/138 NOT_RATED; ${dossiers.reduce((n,d)=>n+d.metrics.filter(x=>x.status==='SUPPORTED').length,0)} supported accounting-capital references. No new rubric ratings assigned. R4's 4/690 receipt is unchanged.\n\n${PILOT.map(t=>`- [${t} dossier](issuers/${t}.md)`).join('\n')}\n\n[Inventory](inventory.json) · [Exceptions](exceptions.json) · [Pinned inputs](input-snapshot.json) · [Boundary verification](boundary-verification.json)\n\nSource rows preserve their PDF/API candidate values, conflicts, unknown dimensions and original review reasons. Checked capital overlays reuse prior exact-page reviews; no new visual inspection claimed. FY2022–FY2024/interim/unresolved variants remain separate. Inherited scenarios are conditional references, not fresh valuation acceptance.\n\nReplay: supported Node 22, run \`node scripts/build-dfr01-pilot.mjs\`. Cutoff defaults to the end of 2026-11-04 Asia/Ho_Chi_Minh; a different DFR01_CUTOFF is rejected and requires a new run directory. AS_KNOWN is rejected. Outputs are deterministic for the same pinned inputs/cutoff/code. If any lineage or protected-state assertion fails, no exports are published.\n\nScope: file exports only, no website/runtime activation. Formal production acceptance, authenticated preparation/challenge, DI1–DI15, share/action/market qualification and deployment remain separate.\n`);
const outputs=Object.fromEntries(Object.entries(output).map(([p,b])=>[p,digest(b)]));
// Build all artifacts in memory first. Manifest is the final publication marker.
for(const [p,b] of Object.entries(output)){mkdirSync(`${OUT}/${dirname(p)}`,{recursive:true});writeFileSync(`${OUT}/${p}`,b);}
writeFileSync(`${OUT}/manifest.json`,JSON.stringify({contract:CONTRACT,mode,cutoff,outputs},null,2)+'\n');
writeFileSync(`${OUT}/EXECUTION.json`,JSON.stringify({startedAt,completedAt:new Date().toISOString(),manifestSha256:sha(`${OUT}/manifest.json`),actor:'CHATGPT',authenticatedModelSessionId:null,formalExecutionAttestation:false},null,2)+'\n');
console.log(JSON.stringify({status:'PASS_SCOPED_PILOT',tickers:PILOT,supportedRubrics:supported,notRated:138-supported,sourcePins:Object.keys(pins).length,outputs:Object.keys(outputs).length}));
