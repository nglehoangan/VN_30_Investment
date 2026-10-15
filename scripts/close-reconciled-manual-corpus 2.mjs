import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const {evaluateManualEvidence}=await import('../src/domain/fundamentals/manual-first.ts');
const base=resolve(process.argv[2]);
assert(!existsSync(join(base,'ARTIFACT_HASHES.json')),'Evidence package sealed; choose a new output directory');
const read=name=>JSON.parse(readFileSync(join(base,name),'utf8'));
const write=(name,value)=>writeFileSync(join(base,name),JSON.stringify(value,null,2)+'\n');
const physical=read('PHYSICAL_MANUAL_CORPUS_INVENTORY.json'),snapshot=read('CURRENT_ANALYSIS_SNAPSHOT.json'),summary=read('REPROCESS_SUMMARY.json');
assert.equal(physical.unexplainedFiles,0,'CORPUS_RECONCILIATION_FAILED');
assert.equal(read('MANUAL_SOURCE_MANIFEST.json').manualPdfCount,physical.counts.eligibleFinancialDocuments);
const series=new Map();
for(const c of snapshot.canonicalFacts){const f=c.facts[0];const key=JSON.stringify([f.ticker,f.itemId,f.scope,f.currency,f.unit]);if(!series.has(key))series.set(key,{ticker:f.ticker,itemId:f.itemId,scope:f.scope,currency:f.currency,unit:f.unit,points:[]});series.get(key).points.push({period:f.period,status:c.status,value:c.value,selectedFactIds:c.selectedFactIds,sourceHashes:[...new Set(c.facts.map(f=>f.sourceHash))].sort()});}
const rows=[...series.values()].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
for(const r of rows)r.points.sort((a,b)=>a.period.end.localeCompare(b.period.end)||a.period.start.localeCompare(b.period.start));
write('HISTORICAL_FINANCIAL_SERIES.json',{mode:'CURRENT_ANALYSIS_OF_RETAINED_HISTORICAL_STATEMENTS',historicalPitAdmission:false,series:rows});
const coverage=snapshot.readiness.map(r=>{
 const periods=[...new Set(snapshot.statements.filter(s=>s.ticker===r.ticker&&s.reviewStatus==='QUALIFIED').map(s=>s.reportingPeriod.end))].sort();
 const history=periods.map(end=>{const v=evaluateManualEvidence(r.ticker,r.sector,snapshot.statements.filter(s=>s.reportingPeriod.end<=end),snapshot.canonicalFacts,snapshot.derivedMetrics,snapshot.analysisAt);return {periodEnd:end,scope:v.scope,CORE:v.coreFinancialReady,SECTOR_CORE:v.sectorFinancialReady,missingMaterialEvidence:v.missingMaterialEvidence};});
 return {ticker:r.ticker,CORE:r.coreFinancialReady,SECTOR_CORE:r.sectorFinancialReady,financialEvidenceStatus:r.financialEvidenceStatus,fundamentalScorable:r.fundamentalScorable,currentFinancialDataReady:r.coreFinancialReady&&r.sectorFinancialReady&&r.freshness==='CURRENT',historicalFinancialAnalysisReady:history.filter(h=>h.CORE&&h.SECTOR_CORE).length>=2,historicalPeriodCoverage:history};
});
write('DEEP_EXTRACTION_COVERAGE_CLOSURE.json',{status:'PHYSICAL_CORPUS_RECONCILED_FINANCIAL_COVERAGE_INCOMPLETE',counts:{...physical.counts,qualifiedDocuments:summary.qualified,reviewedFacts:summary.reviewedFacts,availableCanonicalFacts:summary.canonicalFacts,conflictingCanonicalFacts:summary.conflicts,invalidCanonicalFacts:summary.invalid,historicalSeries:rows.length,multiPeriodAvailableSeries:rows.filter(r=>r.points.filter(p=>p.status==='AVAILABLE').length>=2).length,derivedMetrics:summary.derived,CORE:coverage.filter(r=>r.CORE).length,SECTOR_CORE:coverage.filter(r=>r.SECTOR_CORE).length,FULL:summary.FULL,PARTIAL:summary.PARTIAL,INSUFFICIENT:summary.INSUFFICIENT,historicalFinancialAnalysisReady:coverage.filter(r=>r.historicalFinancialAnalysisReady).length,currentFinancialDataReady:coverage.filter(r=>r.currentFinancialDataReady).length,fundamentalScorable:coverage.filter(r=>r.fundamentalScorable).length},readinessDefinitions:{historicalFinancialAnalysisReady:'At least two qualified reporting periods with CORE and SECTOR_CORE complete, evaluated for current analysis; does not authorize historical point-in-time use.',currentFinancialDataReady:'Latest selected qualified period has complete CORE and SECTOR_CORE and CURRENT reporting-cycle freshness.'},coverage,unexplainedFiles:0,corpusExhaustionClaimed:false,extractionMethod:'All retained PDFs reparsed for validity; qualification and reviewed source cells rebound to fresh retained hashes and canonicalized. New unreviewed OCR facts are not admitted.',openDocumentReviews:read('MANUAL_DOCUMENT_QUALIFICATION.json').documents.filter(d=>d.status!=='QUALIFIED'),prohibitedRuns:{scoring:false,ranking:false,top10:false,decisions:false,DCA:false}});
console.log(JSON.stringify(read('DEEP_EXTRACTION_COVERAGE_CLOSURE.json').counts,null,2));
