import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const {loadHybridInput,financialHash}=await import('../src/infrastructure/fundamentals/hybrid-input.ts');
const {buildHybridAdmission}=await import('../src/domain/fundamentals/hybrid-admission.ts');
const {financialTargets,evaluateHybridTarget,hybridCoverage,selectHybridCurrentPeriods}=await import('../src/domain/fundamentals/hybrid-sufficiency.ts');
const {independentComparable}=await import('../src/domain/fundamentals/structured-certification.ts');
const {reconcileCafeFValues}=await import('../src/infrastructure/fundamentals/cafef.ts');
const {bankNpl,bankRatio,reportedBankCapital,bankLevelOneReadiness}=await import('../src/domain/fundamentals/bank-contract.ts');
const root=resolve(import.meta.dirname,'..'),dir='docs/fundamental-data-engine/evidence/2026-10-15-ticker-closure-VCB',out=resolve(root,process.argv.find(a=>a.startsWith('--out='))?.slice(6)??dir);
mkdirSync(out,{recursive:true});
assert(!existsSync(join(out,'ARTIFACT_HASHES.json')),'Sealed VCB evidence: replay into --out, never overwrite');
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8')),write=(n,v)=>writeFileSync(join(out,n),JSON.stringify(v,null,2)+'\n');
const sha=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');
const analysisAt='2026-10-15T05:00:00.000Z';
const old=read('docs/fundamental-data-engine/evidence/2026-10-14-structured-certification-closure/RETAINED_ADMISSION_INPUT.json');
const loaded=loadHybridInput(root,analysisAt,'vcb-ticker-closure-2026-10-15','CURRENT_ANALYSIS',{ticker:'VCB',selectiveEvidencePaths:['docs/fundamental-data-engine/evidence/2026-10-14-structured-certification-closure/SELECTIVE_ISSUER_CELL_EVIDENCE.json']});
const prior=new Map(old.candidates.map(c=>[c.id,c]));
const candidates=loaded.input.candidates.map(c=>{const p=prior.get(c.id);assert(p?.contractMetadata,'Unknown schema fails closed');return {...c,contractMetadata:{...p.contractMetadata,knownIssuerConflict:loaded.input.verifications.some(v=>v.scope==='CONSOLIDATED'&&independentComparable(c,v)&&c.normalized.value!==null&&reconcileCafeFValues(c.normalized.value,v.value,true,v.unit==='CURRENCY_PER_SHARE'?'0.01':'1000')==='CONFLICT')}};});
const input={...loaded.input,candidates,contractRegistry:{...old.contractRegistry,allowedModes:['NAM','QUY']},certificationWitnesses:{candidates:old.candidates.filter(c=>!candidates.some(a=>a.id===c.id)),verifications:old.verifications.filter(v=>!loaded.input.verifications.some(a=>a.id===v.id))},sourceBindings:[...new Map([...old.sourceBindings,...loaded.input.sourceBindings].map(b=>[b.path,b])).values()]};
const baseline=buildHybridAdmission(input,financialHash);
function summary(snapshot,source){const periods=financialTargets(source).map(t=>evaluateHybridTarget(t,'BANK',snapshot,source));return {coverage:Object.fromEntries(['CORE','SECTOR_CORE','SUPPORTING'].map(k=>{const required=periods.reduce((s,p)=>s+p[k].required,0),admitted=periods.reduce((s,p)=>s+p[k].available,0);return [k,{required,admitted,missing:required-admitted}];})),periods,unresolvedIssuerConflicts:snapshot.unresolvedIssuerConflicts};}
const baselinePath=join(root,dir,'VCB_BASELINE.json');
if(!existsSync(baselinePath)){assert.equal(out,resolve(root,dir));write('VCB_BASELINE.json',{startingHead:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),expectedHead:'bf2e3106c535c0665dbaf9154427484c23739b0f',expectedTreeMatches:true,analysisAt,...summary(baseline,input),sourceBindings:loaded.input.sourceBindings,providerAnomalies:candidates.filter(c=>c.providerStatus==='PROVIDER_ANOMALY').map(c=>c.id),fallbackRequired:baseline.fallbackQueue.filter(q=>q.status!=='RESOLVED_ISSUER').length});}
if(process.argv.includes('--baseline')){console.log(JSON.stringify(summary(baseline,input).coverage));process.exit(0);}
const review=read(dir+'/VCB_ISSUER_VERIFICATION.json');
for(const doc of review.statements){assert.equal(sha(doc.retainedPath),doc.SHA256);assert(readFileSync(resolve(root,doc.retainedPath)).subarray(0,5).toString()==='%PDF-');}
const bindings=new Map(input.sourceBindings.map(b=>[b.path,b]));
bindings.set(dir+'/VCB_ISSUER_VERIFICATION.json',{path:dir+'/VCB_ISSUER_VERIFICATION.json',sha256:sha(dir+'/VCB_ISSUER_VERIFICATION.json')});
bindings.set(dir+'/VCB_BANK_INPUTS.json',{path:dir+'/VCB_BANK_INPUTS.json',sha256:sha(dir+'/VCB_BANK_INPUTS.json')});
for(const d of review.statements)bindings.set(d.retainedPath,{path:d.retainedPath,sha256:d.SHA256});
// Preserve original observations and explicitly supersede the original FY2023
// earnings with the issuer's labelled restated comparative, never latest-wins.
const newVerifications=review.verifications.flatMap(v=>{
 if(v.itemId!=='NET_INCOME'||v.period.end!=='2023-12-31')return [v];
 const previous=input.verifications.filter(p=>p.itemId===v.itemId&&p.period.end===v.period.end);
 assert(previous.length>0);
 return previous.map(p=>({...v,id:v.id+':supersedes:'+p.id,revisionStatus:'RESTATED',supersedesFactId:p.id,revisionEvidence:v.evidenceLocator+'; column labelled trinh bay lai'}));
});
// Scope reusable certification evidence to exact BANK contracts and witnesses.
const providers=input.contractRegistry.providers.filter(p=>p.namespace==='BANK'&&['NAM','QUY'].includes(p.mode)&&candidates.some(c=>c.endpoint===p.endpoint&&c.requestMode===p.mode&&c.contractMetadata.schemaFingerprint===p.schemaFingerprint&&c.providerType===p.providerType));
const providerIds=new Set(providers.map(p=>p.id)),mappings=input.contractRegistry.mappings.filter(m=>providerIds.has(m.providerContractId)),sampleIds=new Set([...providers,...mappings].flatMap(x=>x.sampleReferences)),samples=input.contractRegistry.samples.filter(s=>sampleIds.has(s.id));
const wc=new Set(samples.map(s=>s.candidateId)),wv=new Set(samples.map(s=>s.issuerFactId));
const witnesses={candidates:input.certificationWitnesses.candidates.filter(c=>wc.has(c.id)),verifications:input.certificationWitnesses.verifications.filter(v=>wv.has(v.id))};
const documents=new Map([...input.statements,...review.statements].map(d=>[d.documentId,d]));
const excludedCommon=input.verifications.filter(v=>v.itemId==='NET_INCOME_ATTRIBUTABLE_COMMON'&&!v.commonShareQualification);
const finalVerifications=[...input.verifications.filter(v=>!excludedCommon.includes(v)),...newVerifications];
write('VCB_QUARANTINED_LEGACY_OBSERVATIONS.json',excludedCommon.map(v=>({observation:{id:v.id,itemId:v.itemId,value:v.value,period:v.period,sourceHash:v.sourceHash,evidenceLocator:v.evidenceLocator},classification:'DEFINITION_MISMATCH',disposition:'UNAVAILABLE',reason:'Legacy parent/common proxy lacks explicit ordinary-share earnings qualification; preserved as observation, excluded from canonical admission'})));
const docIds=new Set([...finalVerifications,...witnesses.verifications].map(v=>v.sourceDocumentId));
const statements=[...documents.values()].filter(d=>docIds.has(d.documentId));
const sourcePaths=new Set([...statements.map(d=>d.retainedPath),...loaded.rawRequests.map(r=>r.rawPayloadLocation),dir+'/VCB_ISSUER_VERIFICATION.json',dir+'/VCB_BANK_INPUTS.json']);
const rawHashes=new Set([...candidates,...witnesses.candidates].map(c=>c.sourceHash));
for(const b of bindings.values())if(rawHashes.has(b.sha256))sourcePaths.add(b.path);
const compact=v=>Object.fromEntries(Object.entries(v).filter(([k])=>k!=='retainedReaderProof'));
const finalInput={...input,contractRegistry:{...input.contractRegistry,providers,mappings,samples},certificationWitnesses:{candidates:witnesses.candidates,verifications:witnesses.verifications.map(compact)},statements,verifications:finalVerifications.map(compact),sourceBindings:[...bindings.values()].filter(b=>sourcePaths.has(b.path))};
const snapshot=buildHybridAdmission(finalInput,financialHash);
write('VCB_RETAINED_ADMISSION_INPUT.json',finalInput);write('VCB_CANONICAL_FACTS.json',snapshot);
write('VCB_CURRENT_TRAJECTORY.json',selectHybridCurrentPeriods(finalInput,snapshot)[0]);
const coverage=hybridCoverage(financialTargets(finalInput),snapshot,finalInput);
for(const tier of ['CORE','SECTOR_CORE','SUPPORTING']){const rows=tier==='SUPPORTING'?coverage.matrix.filter(r=>r.evidenceClass===tier):coverage.groups.filter(r=>r.evidenceClass===tier);const keys=Object.keys(rows[0]);writeFileSync(join(out,'VCB_'+tier+'_CLOSURE.csv'),[keys.join(','),...rows.map(r=>keys.map(k=>'"'+String(r[k]??'').replaceAll('"','""')+'"').join(','))].join('\n')+'\n');}
const fy=snapshot.canonicalFacts.find(f=>f.itemId==='NET_INCOME_ATTRIBUTABLE_PARENT'&&f.period.end==='2025-12-31');
assert.equal(fy?.value,'35177663000000');assert.notEqual(fy.classification,'DIRECT_STRUCTURED');
write('VCB_FY2025_NPAT_REGRESSION.json',{status:'PASS',canonical:fy,conflictingObservations:candidates.filter(c=>fy.candidateIds.includes(c.id)&&c.normalized.value!==fy.value),issuerReview:review.verifications.filter(v=>v.itemId===fy.itemId&&v.period.end===fy.period.end)});
write('VCB_COVERAGE_AFTER.json',summary(snapshot,finalInput));
const bankInputs=read(dir+'/VCB_BANK_INPUTS.json');
const bankMetrics=bankInputs.periods.map(p=>{
 const npl=bankNpl(p.groups,p.grossLoans);
 const llr=bankRatio('LLR',p.allowance,{...p.grossLoans,id:'derived-npl:'+p.end,concept:'NPL_CUSTOMER_LOANS',value:npl.value});
 const casa=bankRatio('CASA',p.casaNumerator,p.deposits);
 const nim=bankRatio('NIM',p.netInterestIncome,p.averageEarningAssets);
 return {end:p.end,NPL:npl,NPL_RATIO:{status:npl.status,value:npl.ratio??null,classification:npl.classification,formula:'(group3+group4+group5) / gross customer loans; no interbank or off-balance-sheet exposure'},LLR:{...llr,formula:'customer-loan allowance (general + specific) / customer-loan groups 3+4+5'},CASA:casa,NIM:nim,CAR:reportedBankCapital(p.car),CET1:reportedBankCapital(p.cet1),definitionNotes:p.definitionNotes};
});
write('VCB_BANK_METRICS.json',{periods:bankMetrics,sourceInputs:dir+'/VCB_BANK_INPUTS.json',registryUnchanged:true,NIM:'No earning-assets average qualified; no total-assets proxy or automatic interim annualization',CASA:'Demand deposits disclosed separately; no unapproved mapping to current-and-savings population'});
const after=summary(snapshot,finalInput),current=selectHybridCurrentPeriods(finalInput,snapshot)[0];
const readiness=bankLevelOneReadiness({coreMissing:after.coverage.CORE.missing,sectorCoreMissing:after.coverage.SECTOR_CORE.missing,materialConflicts:snapshot.unresolvedIssuerConflicts.length,criticalIssues:0,currentYtdMissing:current.CURRENT_TRAJECTORY.missingCurrentYtd,historicalPit:'NOT_READY'});
write('VCB_FINAL_SUFFICIENCY.json',{...readiness,...after,verdict:readiness.levelOneReady?'B. VCB CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD':'C. VCB BLOCKED — MATERIAL DATA-INTEGRITY GAPS REMAIN',independentReviewRequired:true,projectOwnerApprovalRequired:true,DI14:'NOT_APPROVED',DI15:'NOT_APPROVED'});
write('VCB_DEFERRED_ANALYTICAL_GAPS.json',{classification:'DEFERRED_ANALYTICAL_QUALIFICATION',items:['Normalized sustainable earnings, including 6M2026 business-combination fair-value gain','Through-cycle NIM and credit cost','Stress NPL and forward regulatory capital','Qualified CASA population mapping','Average earning-assets denominator and approved interim NIM rule','Common-share earnings qualification, including welfare/profit allocation','Valuation/scenario assumptions'],supportingDisclosureGaps:{classification:'NONBLOCKING_SUPPORTING_DISCLOSURE_GAPS_NOT_ALL_LEVEL_2',items:coverage.matrix.filter(r=>r.evidenceClass==='SUPPORTING'&&!r.canonicalIds.length).map(r=>({metric:r.metric,start:r.start,end:r.end,status:'UNAVAILABLE',value:null}))},blocksLevelOne:false});
const conflicts=snapshot.canonicalFacts.filter(f=>f.verificationState==='ISSUER_RESOLVED_CONFLICT').map(f=>({metric:f.itemId,end:f.period.end,classification:'ISSUER_CORRECT',selected:f.value,issuerHashes:f.verificationIds.map(id=>finalInput.verifications.find(v=>v.id===id)?.sourceHash).filter(Boolean).join(';'),providerValues:finalInput.candidates.filter(c=>f.candidateIds.includes(c.id)).map(c=>c.normalized.value).join(';'),unresolved:false}));
for(const v of newVerifications.filter(v=>v.revisionStatus==='RESTATED'))conflicts.push({metric:v.itemId,end:v.period.end,classification:'ISSUER_CORRECT',selected:v.value,issuerHashes:v.sourceHash,providerValues:'Original issuer observation superseded: '+v.supersedesFactId,unresolved:false});
function csv(name,rows,empty=['status']){const keys=rows.length?Object.keys(rows[0]):empty;writeFileSync(join(out,name),[keys.join(','),...rows.map(r=>keys.map(k=>'"'+String(r[k]??'').replaceAll('"','""')+'"').join(','))].join('\n')+'\n');}
csv('VCB_CONFLICT_RESOLUTION.csv',conflicts);
csv('VCB_PROVIDER_ANOMALIES.csv',finalInput.candidates.filter(c=>c.providerStatus==='PROVIDER_ANOMALY'||c.contractMetadata?.knownIssuerConflict||c.contractMetadata?.crossEndpointConflict||c.contractMetadata?.statementAnomaly||c.contractMetadata?.duplicateAmbiguity).map(c=>({id:c.id,metric:c.itemId,start:c.periodStart,end:c.periodEnd,mode:c.requestMode,value:c.normalized.value,classification:'PROVIDER_ANOMALY',reason:c.contractMetadata.knownIssuerConflict?'ISSUER_ACCOUNTING_CONFLICT':'OBSERVATION_VALIDATION_VETO',canonicalDisposition:snapshot.candidateAssessments.find(a=>a.candidateId===c.id)?.status})));
write('OPEN_ISSUES.json',{dataIntegrity:{Critical:[],Major:[],Minor:[]},historicalPit:{status:'NOT_READY',reason:'Publication/revision chronology not qualified; separate from current Level-1'},analytical:dir+'/VCB_DEFERRED_ANALYTICAL_GAPS.json',governance:['Independent review and Project Owner approval outstanding'],unavailableIsZero:false});
console.log(JSON.stringify(summary(snapshot,finalInput).coverage));
