import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const {buildHybridAdmission}=await import('../src/domain/fundamentals/hybrid-admission.ts');
const {financialHash}=await import('../src/infrastructure/fundamentals/hybrid-input.ts');
const {financialTargets,evaluateHybridTarget,hybridCoverage,selectHybridCurrentPeriods}=await import('../src/domain/fundamentals/hybrid-sufficiency.ts');
const ticker=process.argv.find(a=>a.startsWith('--ticker='))?.slice(9);
assert(['GVR'].includes(ticker),'Explicit GVR ticker required');
const evidence=`docs/fundamental-data-engine/evidence/2026-10-16-ticker-closure-${ticker}`;
const out=resolve(process.argv.find(a=>a.startsWith('--out='))?.slice(6)??evidence);
mkdirSync(out,{recursive:true});
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(n,v)=>writeFileSync(resolve(out,n),JSON.stringify(v,null,2)+'\n');
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const old=read('docs/fundamental-data-engine/evidence/2026-10-14-structured-certification-closure/RETAINED_ADMISSION_INPUT.json');
const universe=old.universe.filter(u=>u.ticker===ticker);
assert.equal(universe.length,1);
const sector=universe[0].sector;
const baselineInput={...old,snapshotId:ticker.toLowerCase()+'-level-one-2026-10-16',analysisAt:'2026-10-16T02:00:00.000Z',systemKnownAt:'2026-10-16T02:00:00.000Z',universe,candidates:old.candidates.filter(c=>c.ticker===ticker&&['NAM','QUY'].includes(c.requestMode)),verifications:old.verifications.filter(v=>v.ticker===ticker),certificationWitnesses:{candidates:old.candidates.filter(c=>c.ticker!==ticker),verifications:old.verifications.filter(v=>v.ticker!==ticker)}};
function summary(input,snapshot){
 const periods=financialTargets(input).map(t=>evaluateHybridTarget(t,sector,snapshot,input));
 const coverage=Object.fromEntries(['CORE','SECTOR_CORE','SUPPORTING'].map(k=>{const required=periods.reduce((s,p)=>s+p[k].required,0),admitted=periods.reduce((s,p)=>s+p[k].available,0);return [k,{required,admitted,missing:required-admitted}];}));
 return {periods,coverage};
}
if(process.argv.includes('--baseline')){
 assert(!existsSync(resolve(out,ticker+'_BASELINE.json')),'Baseline already frozen');
 const snapshot=buildHybridAdmission(baselineInput,financialHash);
 write(ticker+'_BASELINE.json',{ticker,startingHead:'80f78a14c09a1dbced380a572585c437c28eeb30',sector,...summary(baselineInput,snapshot),current:selectHybridCurrentPeriods(baselineInput,snapshot),unresolvedIssuerConflicts:snapshot.unresolvedIssuerConflicts,invalidVerificationIds:snapshot.invalidVerificationIds,providerAnomalies:baselineInput.candidates.filter(c=>c.providerStatus==='PROVIDER_ANOMALY'||Object.values(c.contractMetadata??{}).some(v=>v===true)),suspiciousZeros:baselineInput.candidates.filter(c=>c.normalized.value==='0').map(c=>c.id),originals:old.statements.filter(d=>d.ticker===ticker),qualificationGaps:{current:'Retained 6M2026 original awaits independent qualification',debt:'No v2 population receipts; borrowing operands are not qualified population totals',scope:'Annual source identities require independent review',units:'No inferred unit multiplier',period:'QUARTER does not satisfy YTD; 60-day grace applies'}});
 console.log(JSON.stringify({ticker,sector,...summary(baselineInput,snapshot).coverage}));
} else {
 assert(!existsSync(resolve(out,'ARTIFACT_HASHES.json')),'Sealed evidence: use --out');
 const review=read(evidence+'/'+ticker+'_ISSUER_VERIFICATION.json');
 const debt=read(evidence+'/'+ticker+'_DEBT_RECONCILIATION.json');
 const {qualifyGvrAccountingRow,gvrAccountingCategory}=await import('../src/domain/fundamentals/gvr-accounting-contract.ts');
 for(const row of review.rows)assert.equal(qualifyGvrAccountingRow(ticker,row.metric,{start:row.start,end:row.end,frame:row.frame},{...row,sourceCategory:gvrAccountingCategory(row.metric)}).status,'AVAILABLE',JSON.stringify(row));
 const candidates=baselineInput.candidates;
 const previous=old.verifications.filter(v=>v.ticker===ticker).map(v=>Object.fromEntries(Object.entries(v).filter(([k])=>k!=='retainedReaderProof')));
 const verifications=[...previous,...review.verifications].map(v=>Object.fromEntries(Object.entries(v).filter(([k])=>k!=='retainedReaderProof')));
 const hashes=new Set(candidates.map(c=>c.sourceHash));
 const bindings=old.sourceBindings.filter(b=>hashes.has(b.sha256));
 for(const d of review.statements){assert.equal(sha(d.retainedPath),d.SHA256);bindings.push({path:d.retainedPath,sha256:d.SHA256});}
 for(const suffix of ['ISSUER_VERIFICATION','DEBT_RECONCILIATION','RESTATEMENT_REVIEW']){const path=evidence+'/'+ticker+'_'+suffix+'.json';bindings.push({path,sha256:sha(path)});}
 const namespaces=new Set(candidates.map(c=>c.mappingNamespace));
 const providers=old.contractRegistry.providers.filter(p=>namespaces.has(p.namespace)&&['NAM','QUY'].includes(p.mode));
 const providerIds=new Set(providers.map(p=>p.id));
 const mappings=old.contractRegistry.mappings.filter(m=>providerIds.has(m.providerContractId));
 const sampleIds=new Set([...providers,...mappings].flatMap(p=>p.sampleReferences));
 const input={snapshotId:baselineInput.snapshotId,analysisAt:review.reviewedAt,systemKnownAt:review.reviewedAt,mode:'CURRENT_ANALYSIS',universe,candidates,verifications,statements:review.statements,certificates:[],sourceBindings:[...new Map(bindings.map(b=>[b.path,b])).values()],contractRegistry:{...old.contractRegistry,providers,mappings,samples:old.contractRegistry.samples.filter(s=>sampleIds.has(s.id)),allowedModes:['NAM','QUY']},certificationWitnesses:{candidates:[],verifications:[]}};
 const beforeDebt=buildHybridAdmission(input,financialHash);
 const bodyHash=x=>({...x,bodyHash:financialHash(x)});
 input.reportedDebtReceipts=debt.periods.filter(p=>p.status==='QUALIFIED').map(p=>{
  const short=beforeDebt.canonicalFacts.find(f=>f.itemId==='SHORT_TERM_FINANCIAL_BORROWINGS'&&f.period.end===p.periodEnd);
  const long=beforeDebt.canonicalFacts.find(f=>f.itemId==='LONG_TERM_FINANCIAL_BORROWINGS'&&f.period.end===p.periodEnd);
  assert(short&&long,'Qualified debt must have independent issuer operands');assert.equal(short.value,p.short);assert.equal(long.value,p.long);
  const metadata=bodyHash({contractVersion:'nonfinancial-debt-contract-v2',ticker,periodEnd:p.periodEnd,scope:'CONSOLIDATED',unit:'CURRENCY',currency:'VND',measurementBasis:'ISSUER_REPORTED_CARRYING_AMOUNT',leasePolicyVersion:'issuer-recognized-financing-leases-v1',reportedPopulationStatus:'REPORTED_COMPLETE',comprehensivePopulationStatus:'COMPREHENSIVE_UNVERIFIED',knownFinancingOmission:false,sourceHashes:[p.sourceHash],evidenceReference:evidence+'/'+ticker+'_DEBT_RECONCILIATION.json',evidenceHash:sha(evidence+'/'+ticker+'_DEBT_RECONCILIATION.json'),reviewedAt:input.systemKnownAt,uncertainty:{components:p.uncertaintyComponents,unclassifiedLiabilityAmount:null,unclassifiedLiabilityRatioToBorrowings:null,materialityAssessment:'UNASSESSED',materialityEvidenceReference:null},exhaustiveEvidenceReference:null});
  return bodyHash({id:ticker.toLowerCase()+'-reported-debt:'+p.periodEnd,ticker,sector,periodEnd:p.periodEnd,shortCanonicalId:short.id,longCanonicalId:long.id,shortValue:short.value,longValue:long.value,currentPortion:p.currentPortion,shortIncludesCurrentPortion:true,longIncludesCurrentPortion:false,knownFinancingItems:p.knownFinancingItems,reportedSurveyVerified:true,currentPortionVerified:true,metadata});
 });
 assert.deepEqual(input.universe,universe,'Approved ticker classification must be preserved');
 assert(input.candidates.every(c=>c.ticker===ticker&&['NAM','QUY'].includes(c.requestMode)));
 assert(input.verifications.every(v=>v.ticker===ticker));
 const snapshot=buildHybridAdmission(input,financialHash),result=summary(input,snapshot),matrix=hybridCoverage(financialTargets(input),snapshot,input);
 write(ticker+'_RETAINED_ADMISSION_INPUT.json',input);
 write(ticker+'_CANONICAL_FACTS.json',snapshot);
 const csv=(name,rows,empty=['metric','period','classification','status'])=>{const keys=rows.length?Object.keys(rows[0]):empty;writeFileSync(resolve(out,name),[keys.join(','),...rows.map(r=>keys.map(k=>'"'+String(Array.isArray(r[k])?r[k].join(';'):r[k]??'').replaceAll('"','""')+'"').join(','))].join('\n')+'\n');};
 for(const tier of ['CORE','SECTOR_CORE','SUPPORTING'])csv(ticker+'_'+tier+'_CLOSURE.csv',matrix.matrix.filter(r=>r.evidenceClass===tier));
 const current=selectHybridCurrentPeriods(input,snapshot)[0];
 write(ticker+'_CURRENT_TRAJECTORY.json',current);
 csv(ticker+'_PROVIDER_ANOMALIES.csv',input.candidates.filter(c=>c.providerStatus==='PROVIDER_ANOMALY'||Object.values(c.contractMetadata??{}).some(v=>v===true)||c.normalized.value==='0').map(c=>({id:c.id,metric:c.itemId,end:c.periodEnd,frame:c.reportPeriodType,value:c.normalized.value,state:c.normalized.value==='0'?'SUSPECT_ZERO':'PROVIDER_ANOMALY',disposition:snapshot.candidateAssessments.find(a=>a.candidateId===c.id)?.status,reasons:snapshot.candidateAssessments.find(a=>a.candidateId===c.id)?.reasons.join(';')})));
 csv(ticker+'_CONFLICT_RESOLUTION.csv',snapshot.canonicalFacts.filter(f=>f.verificationState==='ISSUER_RESOLVED_CONFLICT').map(f=>({metric:f.itemId,end:f.period.end,frame:f.reportPeriodType,classification:'ISSUER_CORRECT',value:f.value,verificationIds:f.verificationIds,resolved:true})).concat(snapshot.unresolvedIssuerConflicts.map(k=>({metric:k,end:'',frame:'',classification:'UNRESOLVED',value:null,verificationIds:[],resolved:false}))).concat((review.externalConflicts??[]).map(c=>({metric:c.metric,end:c.end,frame:c.frame,classification:c.classification,value:c.values.join(';'),verificationIds:c.locators,resolved:c.resolved}))));
 const ready=result.coverage.CORE.missing===0&&result.coverage.SECTOR_CORE.missing===0&&!current.CURRENT_TRAJECTORY.missingCurrentYtd&&snapshot.unresolvedIssuerConflicts.length===0&&snapshot.invalidVerificationIds.length===0&&review.materialGaps.length===0;
 write(ticker+'_FINAL_SUFFICIENCY.json',{ticker,sector,startingHead:'80f78a14c09a1dbced380a572585c437c28eeb30',finalHead:'PENDING_COMMIT',levelOneReady:ready,...result,currentAnalysis:ready?'READY_LEVEL_ONE':'NOT_READY',historicalPIT:'NOT_READY',historicalPITBlocksCurrentAnalysis:false,verdict:ready?`B. ${ticker} CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD`:`C. ${ticker} BLOCKED — MATERIAL LEVEL-1 DATA-INTEGRITY GAPS REMAIN`,materialGaps:review.materialGaps,independentReviewRequired:true,projectOwnerApprovalRequired:true,readyForScoring:false,decisionReady:false,DI14:'NOT_APPROVED',DI15:'NOT_APPROVED'});
 write('OPEN_ISSUES.json',{ticker,dataIntegrity:{Critical:[],Major:[...review.materialGaps,...snapshot.unresolvedIssuerConflicts,...snapshot.invalidVerificationIds,...(!review.materialGaps.length&&(result.coverage.CORE.missing||result.coverage.SECTOR_CORE.missing)?['Required accounting groups incomplete; see exact sufficiency matrix']:[])],Minor:review.minorIssues??[]},historicalPIT:'NOT_READY; does not block CURRENT_ANALYSIS',analyticalQualification:ticker+'_DEFERRED_ANALYTICAL_GAPS.json',independentReview:'PENDING',projectOwnerApproval:'PENDING'});
 console.log(JSON.stringify({ticker,...result.coverage,ready,invalid:snapshot.invalidVerificationIds.length,conflicts:snapshot.unresolvedIssuerConflicts.length}));
}
