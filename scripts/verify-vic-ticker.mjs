import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
const {buildHybridAdmission}=await import('../src/domain/fundamentals/hybrid-admission.ts');
const {financialHash}=await import('../src/infrastructure/fundamentals/hybrid-input.ts');
const {validateCafeFResponse}=await import('../src/infrastructure/fundamentals/cafef.ts');
const {financialTargets,evaluateHybridTarget,selectHybridCurrentPeriods}=await import('../src/domain/fundamentals/hybrid-sufficiency.ts');
const ticker=process.argv.find(a=>a.startsWith('--ticker='))?.slice(9);
assert(['VIC'].includes(ticker));
const dir=resolve('docs/fundamental-data-engine/evidence/2026-10-16-ticker-closure-'+ticker);
const read=n=>JSON.parse(readFileSync(resolve(dir,n),'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
if(existsSync(resolve(dir,'ARTIFACT_HASHES.json')))for(const [n,h] of Object.entries(read('ARTIFACT_HASHES.json')))assert.equal(sha(resolve(dir,n)),h,'Sealed artifact '+n);
const input=read(ticker+'_RETAINED_ADMISSION_INPUT.json'),expected=read(ticker+'_CANONICAL_FACTS.json'),checks=[];
const check=(name,fn)=>{fn();checks.push({name,status:'PASS'});};
check('All durable source bindings match exact physical bytes',()=>{for(const b of input.sourceBindings)assert.equal(sha(b.path),b.sha256,b.path);for(const d of input.statements){assert.equal(d.ticker,ticker);assert.equal(d.reportingScope,'CONSOLIDATED');assert.equal(readFileSync(d.retainedPath).subarray(0,5).toString(),'%PDF-');}});
check('Ticker-specific immutable CafeF raw snapshots parse in NAM or QUY',()=>{for(const c of input.candidates){assert.equal(c.ticker,ticker);assert(['NAM','QUY'].includes(c.requestMode));const binding=input.sourceBindings.find(b=>b.sha256===c.sourceHash);assert(binding);assert(validateCafeFResponse(readFileSync(binding.path,'utf8'),c.endpoint,ticker,c.requestMode).records.length);}});
const replay=buildHybridAdmission(input,financialHash);
check('Offline canonical replay exactly equals retained output',()=>assert.deepEqual(replay,expected));
check('No foreign issuer observations or calibration witnesses enter this closure',()=>{assert.deepEqual(input.certificationWitnesses,{candidates:[],verifications:[]});assert(input.verifications.every(v=>v.ticker===ticker));assert(replay.canonicalFacts.every(f=>f.ticker===ticker));assert.equal(replay.readyForScoring,false);});
check('Fixed denominators and honest per-ticker readiness',()=>{const targets=financialTargets(input);assert.equal(targets.length,5);const periods=targets.map(t=>evaluateHybridTarget(t,input.universe[0].sector,replay,input));const coverage=Object.fromEntries(['CORE','SECTOR_CORE','SUPPORTING'].map(k=>{const required=periods.reduce((s,p)=>s+p[k].required,0),admitted=periods.reduce((s,p)=>s+p[k].available,0);return [k,{required,admitted,missing:required-admitted}];}));const final=read(ticker+'_FINAL_SUFFICIENCY.json');assert.deepEqual(coverage,final.coverage);assert.equal(coverage.CORE.required,35);assert.equal(coverage.SECTOR_CORE.required,5);assert.equal(coverage.SUPPORTING.required,40);const material=read(ticker+'_ISSUER_VERIFICATION.json').materialGaps;const ready=coverage.CORE.missing===0&&coverage.SECTOR_CORE.missing===0&&!selectHybridCurrentPeriods(input,replay)[0].CURRENT_TRAJECTORY.missingCurrentYtd&&!material.length&&!replay.invalidVerificationIds.length&&!replay.unresolvedIssuerConflicts.length;assert.equal(final.levelOneReady,ready);});
check('Qualified debt sums and included financing reconcile independently',()=>{for(const p of read(ticker+'_DEBT_RECONCILIATION.json').periods){const f=replay.canonicalFacts.find(f=>f.itemId==='REPORTED_BORROWINGS'&&f.period.end===p.periodEnd);if(p.status!=='QUALIFIED'){assert(!f);continue;}const sum=g=>p.components.filter(c=>c.alreadyIncludedIn===g).reduce((n,c)=>n+BigInt(c.amount),0n);assert.equal(sum('SHORT').toString(),p.short);assert.equal(sum('LONG').toString(),p.long);assert.equal((sum('SHORT')+sum('LONG')+(p.additions??[]).reduce((n,c)=>n+BigInt(c.amount),0n)).toString(),p.reportedBorrowings);assert.equal(f?.value,p.reportedBorrowings);assert.equal(p.comprehensiveDebtValue,null);}});
check('All annual requirements actually qualified despite missing current source',()=>{
 const final=read(ticker+'_FINAL_SUFFICIENCY.json');assert.equal(final.annualAccountingQualified,true);
 assert.deepEqual(final.coverage.CORE,{required:35,admitted:28,missing:7});assert.deepEqual(final.coverage.SECTOR_CORE,{required:5,admitted:4,missing:1});
 assert.equal(input.reportedDebtReceipts.length,4);
 const annual=financialTargets(input).filter(t=>t.frame==='ANNUAL');for(const t of annual){const p=evaluateHybridTarget(t,input.universe[0].sector,replay,input);assert.equal(p.CORE.available,7);assert.equal(p.SECTOR_CORE.available,1);}
 const search=read('VIC_CURRENT_SOURCE_SEARCH.json');assert.equal(search.classification,'SOURCE_UNAVAILABLE_AFTER_REASONABLE_SEARCH');assert.equal(search.originalAcquired,false);
 const gaps=read('OPEN_ISSUES.json').dataIntegrity.Major;assert.equal(gaps.length,1);assert.equal(gaps[0].classification,search.classification);assert.equal(gaps[0].period.end,'2026-06-30');
 assert.equal(final.startingHead,'8502faa06bed266a375188fc45fb1f8d7476286e');assert.equal(final.finalHead,'PENDING_COMMIT');assert.equal(final.readyForScoring,false);assert.equal(final.decisionReady,false);
});
check('Issuer comparative lineage, inventory, NCI, cash and hybrid arithmetic are independent of extraction files',()=>{
 for(const edge of read('VIC_RESTATEMENT_REVIEW.json').revisions){const original=input.verifications.find(v=>v.id===edge.originalId),revised=input.verifications.find(v=>v.id===edge.revisedId);assert(original&&revised);assert.equal(original.value,edge.originalValue);assert.equal(revised.value,edge.revisedValue);assert.equal(revised.supersedesFactId,original.id);assert.equal(replay.canonicalFacts.find(f=>f.itemId===edge.metric&&f.period.end===edge.period.end)?.value,revised.value);}
 for(const p of read('VIC_INVENTORY_REVIEW.json').periods){assert.equal(Object.values(p.componentsMillion).reduce((n,v)=>n+BigInt(v),0n).toString(),String(p.grossMillion));assert.equal(BigInt(p.grossMillion)+BigInt(p.provisionMillion),BigInt(p.netMillion));}
 for(const p of read('VIC_NCI_RECONCILIATION.json').periods)assert.equal(BigInt(p.parentNPAT)+BigInt(p.NCIProfit),BigInt(p.totalNPAT));
 for(const p of read('VIC_CASH_REVIEW.json').periods)assert.equal(Object.values(p.componentsMillion).reduce((n,v)=>n+BigInt(v),0n)*1000000n,BigInt(p.cashAndEquivalents));
 for(const b of Object.values(read('VIC_HYBRID_FINANCING_REVIEW.json').carryingBridgesMillion))assert.equal(Object.entries(b).filter(([k,v])=>k!=='closing'&&typeof v==='number').reduce((n,[,v])=>n+BigInt(v),0n),BigInt(b.closing));
 const p=read('VIC_CONSOLIDATION_PERIMETER.json');assert.equal(p.organicGrowthNormalizationRequiredForLevelOne,false);assert.equal(p.periods.length,4);assert(p.periods.every(p=>p.status==='QUALIFIED_MATERIAL_BOUNDARIES_DOCUMENTED'&&p.materialChanges.length));
});
check('All protected ticker source and evidence bytes are unchanged',()=>{for(const b of read('PROTECTED_BASELINE.json').bindings)assert.equal(sha(b.path),b.sha256,b.path);});
check('No replay dependency on disposable OCR, images, page text or scratch paths',()=>assert(!/retainedReaderProof|manual-extracted|\.png"|\/private\/tmp\//.test(JSON.stringify(input))));
check('Independent producer process reproduces every generated artifact byte-for-byte',()=>{const temp=mkdtempSync(resolve(tmpdir(),ticker.toLowerCase()+'-vic-replay-'));try{execFileSync(process.execPath,['scripts/close-vic-ticker.mjs','--ticker='+ticker,'--out='+temp],{stdio:'pipe'});for(const n of readdirSync(temp))assert.equal(readFileSync(resolve(temp,n),'utf8'),readFileSync(resolve(dir,n),'utf8'),n);}finally{rmSync(temp,{recursive:true,force:true});}});
const result={ticker,status:'PASS',closureVerdict:read(ticker+'_FINAL_SUFFICIENCY.json').verdict,offline:true,separateProcess:true,contentHash:replay.contentHash,independentHumanReview:false,checks};
if(process.argv.includes('--record'))writeFileSync(resolve(dir,'INDEPENDENT_REPLAY.json'),JSON.stringify(result,null,2)+'\n');
if(process.argv.includes('--seal'))writeFileSync(resolve(dir,'ARTIFACT_HASHES.json'),JSON.stringify(Object.fromEntries(readdirSync(dir).filter(n=>n!=='ARTIFACT_HASHES.json').sort().map(n=>[n,sha(resolve(dir,n))])),null,2)+'\n');
console.log(JSON.stringify({ticker,status:result.status,checks:checks.length,closureVerdict:result.closureVerdict}));
