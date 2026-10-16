import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const {buildHybridAdmission}=await import('../src/domain/fundamentals/hybrid-admission.ts');
const {financialHash}=await import('../src/infrastructure/fundamentals/hybrid-input.ts');
const {financialTargets,evaluateHybridTarget,hybridCoverage,selectHybridCurrentPeriods}=await import('../src/domain/fundamentals/hybrid-sufficiency.ts');
const {debtRequirementsAt}=await import('../src/domain/fundamentals/debt-contract.ts');
const {qualifyTcxAccountingRow}=await import('../src/domain/fundamentals/tcx-accounting-contract.ts');
const evidence='docs/fundamental-data-engine/evidence/2026-10-16-ticker-closure-TCX';
const out=resolve(process.argv.find(a=>a.startsWith('--out='))?.slice(6)??evidence);
mkdirSync(out,{recursive:true});
assert(!existsSync(resolve(out,'ARTIFACT_HASHES.json')),'Sealed evidence; replay into --out');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(n,x)=>writeFileSync(resolve(out,n),JSON.stringify(x,null,2)+'\n');
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const old=read('docs/fundamental-data-engine/evidence/2026-10-14-structured-certification-closure/RETAINED_ADMISSION_INPUT.json');
const review=read(evidence+'/TCX_ISSUER_VERIFICATION.json');
const candidates=old.candidates.filter(c=>c.ticker==='TCX'&&['NAM','QUY'].includes(c.requestMode));
assert.deepEqual(old.universe.filter(u=>u.ticker==='TCX'),[{ticker:'TCX',sector:'SECURITIES'}]);
const verifications=[];
for(const r of review.rows){
 const result=qualifyTcxAccountingRow(r.metric,{start:r.start,end:r.end,frame:r.frame},r);
 if(result.status!=='AVAILABLE'){assert.equal(r.metric,'FINANCIAL_DEBT');assert.equal(r.end,'2022-12-31');continue;}
 const doc=review.statements.find(d=>d.SHA256===r.source.hash);
 assert(doc&&doc.ticker==='TCX'&&doc.retainedPath===r.source.path);
 assert.equal(sha(doc.retainedPath),r.source.hash);
 const stock=r.frame==='INSTANT',year=Number(r.end.slice(0,4));
 verifications.push({id:'tcx-issuer:'+year+':'+r.metric,ticker:'TCX',itemId:r.metric,value:r.value,period:{start:r.start,end:r.end},periodType:stock?'INSTANT':year===2026?'YTD':'ANNUAL',reportPeriodType:year===2026?'YTD':'ANNUAL',fiscalYear:year,fiscalQuarter:year===2026?2:null,measurementSemantic:stock?'STOCK':'FLOW',definition:r.concept+'; '+r.basis,scope:r.scope,unit:r.unit,currency:r.currency,auditStatus:r.source.audit,sourceDocumentId:doc.documentId,sourceHash:r.source.hash,evidenceLocator:r.source.locator,evidenceReference:r.source.locator,extractionMethod:'REVIEWED_PDF_TRANSCRIPTION',reviewStatus:'QUALIFIED',reviewReference:evidence+'/TCX_ISSUER_VERIFICATION.json',authority:year===2026?'REVIEWED_PDF':'AUDITED_PDF',qualified:true,reviewedAt:review.reviewedAt,publishedAt:null,historicalAvailability:'UNKNOWN',definitionVerified:true,valueVerified:true,zeroVerified:r.value==='0',provenanceVerified:true,origin:'RETAINED_REVIEWED_FACT',revisionStatus:'ORIGINAL',supersedesFactId:null,revisionEvidence:null,...r.metric==='SECURITIES_MARGIN_LOANS'?{securitiesEvidence:{concept:'MARGIN_LOANS',value:r.value,frame:'INSTANT',scope:r.scope,start:r.start,end:r.end,sourceHash:r.source.hash,locator:r.source.locator,components:[{concept:'MARGIN_LOANS',value:r.value}]}}:{}});
}
// Explicit issuer comparative revision; the original remains an immutable input.
const original=verifications.find(v=>v.id==='tcx-issuer:2024:BASIC_EPS');
const revisedDoc=review.statements.find(d=>d.fiscalYear===2025);
verifications.push({...original,id:'tcx-issuer:2024:EPS-restated-in-2025',value:'1964',sourceDocumentId:revisedDoc.documentId,sourceHash:revisedDoc.SHA256,evidenceLocator:revisedDoc.retainedPath+'#PDF-page=62; note 38; restated FY2024 EPS',evidenceReference:revisedDoc.retainedPath+'#PDF-page=62; note 38; restated FY2024 EPS',revisionStatus:'RESTATED',supersedesFactId:original.id,revisionEvidence:evidence+'/TCX_RESTATEMENT_REVIEW.json'});
const hashes=new Set(candidates.map(c=>c.sourceHash));
const sourceBindings=old.sourceBindings.filter(b=>hashes.has(b.sha256));
for(const d of review.statements)sourceBindings.push({path:d.retainedPath,sha256:sha(d.retainedPath)});
for(const name of ['ISSUER_VERIFICATION','FINANCIAL_DEBT_RECONCILIATION','MARGIN_LOAN_RECONCILIATION','RESTATEMENT_REVIEW','SOURCE_MANIFEST']){const path=evidence+'/TCX_'+name+'.json';sourceBindings.push({path,sha256:sha(path)});}
const providers=old.contractRegistry.providers.filter(p=>p.namespace==='SECURITIES'&&['NAM','QUY'].includes(p.mode));
const ids=new Set(providers.map(p=>p.id));
// Shared mapping definitions are retained, but foreign issuer calibration is not TCX accounting evidence.
// No TCX exact issuer calibration samples were approved in the sealed registry: fail closed on direct certification.
const input={snapshotId:'tcx-level-one-2026-10-16',analysisAt:review.reviewedAt,systemKnownAt:review.reviewedAt,mode:'CURRENT_ANALYSIS',universe:[{ticker:'TCX',sector:'SECURITIES'}],candidates,verifications,certificates:[],statements:review.statements,sourceBindings:[...new Map(sourceBindings.map(b=>[b.path,b])).values()],contractRegistry:{...old.contractRegistry,providers,mappings:old.contractRegistry.mappings.filter(m=>ids.has(m.providerContractId)),samples:[],allowedModes:['NAM','QUY']},certificationWitnesses:{candidates:[],verifications:[]}};
const snapshot=buildHybridAdmission(input,financialHash);
const periods=financialTargets(input).map(t=>evaluateHybridTarget(t,'SECURITIES',snapshot,input));
const coverage=Object.fromEntries(['CORE','SECTOR_CORE','SUPPORTING'].map(k=>{const required=periods.reduce((n,p)=>n+p[k].required,0),admitted=periods.reduce((n,p)=>n+p[k].available,0);return[k,{required,admitted,missing:required-admitted}];}));
const current=selectHybridCurrentPeriods(input,snapshot)[0];
const matrix=hybridCoverage(financialTargets(input),snapshot,input);
const csv=(n,rows,empty=['metric','end','classification','reason'])=>{const keys=rows.length?Object.keys(rows[0]):empty;writeFileSync(resolve(out,n),[keys.join(','),...rows.map(r=>keys.map(k=>'"'+String(Array.isArray(r[k])?r[k].join(';'):r[k]??'').replaceAll('"','""')+'"').join(','))].join('\n')+'\n');};
write('TCX_RETAINED_ADMISSION_INPUT.json',input);
write('TCX_CANONICAL_FACTS.json',snapshot);
for(const tier of ['CORE','SECTOR_CORE','SUPPORTING'])csv('TCX_'+tier+'_CLOSURE.csv',matrix.matrix.filter(r=>r.evidenceClass===tier));
write('TCX_CURRENT_TRAJECTORY.json',{...current,scope:'STANDALONE',issuerAuditStatus:'REVIEWED',publishedDate:'2026-08-10',publicationTimestamp:null,latestQualifiedRequiredPeriod:'2026-06-30',quarterToYtdInference:false});
const conflicts=snapshot.canonicalFacts.filter(f=>f.verificationState==='ISSUER_RESOLVED_CONFLICT').map(f=>({metric:f.itemId,end:f.period.end,frame:f.reportPeriodType,classification:'ISSUER_CORRECT',value:f.value,providerValues:input.candidates.filter(c=>f.candidateIds.includes(c.id)).map(c=>c.normalized.value).join(';'),locator:f.evidenceLocator,resolved:true}));
csv('TCX_CONFLICT_RESOLUTION.csv',conflicts);
const anomalies=candidates.filter(c=>c.providerStatus==='PROVIDER_ANOMALY'||c.normalized.value==='0'||['knownIssuerConflict','crossEndpointConflict','statementAnomaly','duplicateAmbiguity','codeCollision'].some(k=>c.contractMetadata?.[k]===true));
csv('TCX_PROVIDER_ANOMALIES.csv',anomalies.map(c=>({id:c.id,metric:c.itemId,end:c.periodEnd,frame:c.reportPeriodType,value:c.normalized.value,state:c.providerStatus==='PROVIDER_ANOMALY'?'PROVIDER_ANOMALY':c.normalized.value==='0'?'SUSPECT_ZERO':'PROVIDER_ANOMALY',disposition:snapshot.candidateAssessments.find(a=>a.candidateId===c.id)?.status,reasons:snapshot.candidateAssessments.find(a=>a.candidateId===c.id)?.reasons.join(';')})));
write('TCX_CONTRACT_TRACE.json',{ticker:'TCX',sector:'SECURITIES',classificationAuthority:'Production structured-certification retained universe; TCX SECURITIES; unchanged',methodologyAuthorities:['docs/01 SYSTEM/SCORING_MODEL_v1.0.md','docs/03 SCORING/METRIC_DEFINITIONS.md','docs/03 SCORING/SECTOR_NORMALIZATION.md#13.1','docs/03 SCORING/SCORECARD_TEMPLATE.md'],runtimeAuthorities:['src/infrastructure/fundamentals/canonical-items-v1.json','src/domain/fundamentals/manual-fundamental-evidence-requirements-v2.json','src/domain/fundamentals/debt-contract.ts','src/domain/fundamentals/securities-contract.ts','src/domain/fundamentals/hybrid-sufficiency.ts','src/domain/fundamentals/hybrid-admission.ts'],requirements:debtRequirementsAt(input.analysisAt,input.systemKnownAt).sectors.SECURITIES,denominators:{CORE:15,SECTOR_CORE:15,SUPPORTING:40},targets:financialTargets(input),listingBoundaryException:false,nonfinancialDebtV2Applies:false,validationCases:['tests/unit/ssi-ticker-closure.test.ts','tests/unit/tcx-ticker-closure.test.ts'],providerSchemaReview:{candidateCount:candidates.length,keys:['provider','statementFamily','normalizedCode','schemaFingerprint'],fingerprints:[...new Set(candidates.map(c=>c.contractMetadata?.schemaFingerprint))],TCXCodes:[...new Set(candidates.map(c=>[c.endpoint,c.providerCode,c.itemId].join('|')))].sort(),rawHashes:[...hashes].sort(),directStructuredCount:snapshot.canonicalFacts.filter(f=>f.classification==='DIRECT_STRUCTURED').length,disposition:'TCX actual retained raw candidates inspected; no foreign exact-record samples used. Shared provider mappings are not promoted to TCX certification. Issuer-verified quantities use TCX PDFs; uncertified scope/unit/schema remains explicit fallback.',unknownDrift:'FAIL_CLOSED',allowedModes:['NAM','QUY']}});
const ready=coverage.CORE.missing===0&&coverage.SECTOR_CORE.missing===0&&!current.CURRENT_TRAJECTORY.missingCurrentYtd&&!review.materialGaps.length&&!snapshot.invalidVerificationIds.length&&!snapshot.unresolvedIssuerConflicts.length;
write('TCX_FINAL_SUFFICIENCY.json',{ticker:'TCX',sector:'SECURITIES',startingHead:'910a4d64fdc3368721f6236d9f2c76e3068347a3',finalHead:'PENDING_COMMIT',coverage,periods,levelOneReady:ready,verdict:ready?'B. TCX CONDITIONALLY CLOSED — ANALYTICAL GAPS CARRIED FORWARD':'C. TCX BLOCKED — MATERIAL LEVEL-1 DATA-INTEGRITY GAPS REMAIN',exceptionQueue:!ready,materialGaps:review.materialGaps,unresolvedIssuerConflicts:snapshot.unresolvedIssuerConflicts,invalidVerificationIds:snapshot.invalidVerificationIds,providerAnomalies:anomalies.length,resolvedProviderConflicts:conflicts.length,historicalPIT:'NOT_READY',historicalPITBlocksCurrentAnalysis:false,readyForScoring:false,decisionReady:false,DI14:'NOT_APPROVED',DI15:'NOT_APPROVED',scope:'STANDALONE',currentPeriod:'2026-06-30',independentHumanReview:'PENDING'});
write('OPEN_ISSUES.json',{ticker:'TCX',dataIntegrity:{Critical:[],Major:[{id:'TCX-DEBT-2022-MANAGED-POPULATION',amount:'5284485167173',currency:'VND',status:'UNRESOLVED',requiredAction:'Obtain issuer-specific proof of FY2022 Két Vàng managed-payable financing nature and population boundary; only targeted fix after review. No automatic debt inclusion/exclusion.',evidence:'TCX_FINANCIAL_DEBT_RECONCILIATION.json'}],Minor:read(evidence+'/TCX_RESTATEMENT_REVIEW.json').minorIssues},historicalPIT:'NOT_READY; nonblocking CURRENT_ANALYSIS',analyticalGaps:'TCX_DEFERRED_ANALYTICAL_GAPS.json',governanceStop:'TCX exception queue. Stop after TCX; await Review TCX Level-1 Closure.',readyForScoring:false,decisionReady:false});
console.log(JSON.stringify({coverage,ready,invalid:snapshot.invalidVerificationIds,conflicts:snapshot.unresolvedIssuerConflicts}));
