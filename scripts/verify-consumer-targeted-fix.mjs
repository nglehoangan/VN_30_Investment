import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdtempSync,rmSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {root,read,sha} from './close-consumer-targeted-fix.mjs';
const {buildHybridAdmission}=await import('../src/domain/fundamentals/hybrid-admission.ts');
const {financialHash}=await import('../src/infrastructure/fundamentals/hybrid-input.ts');
const {evaluateDebtReceipt}=await import('../src/domain/fundamentals/debt-contract.ts');
const {financialTargets,evaluateHybridTarget,selectHybridCurrentPeriods}=await import('../src/domain/fundamentals/hybrid-sufficiency.ts');
const results=[];
for(const t of ['MSN','VNM','SAB']){
 const dir=resolve(root,t),input=read(dir+'/RETAINED_ADMISSION_INPUT.json'),snapshot=read(dir+'/CANONICAL_FACTS.json'),review=read(dir+'/TARGETED_REVIEW.json'),final=read(dir+'/FINAL_SUFFICIENCY.json');
 if(existsSync(dir+'/ARTIFACT_HASHES.json'))for(const [name,hash] of Object.entries(read(dir+'/ARTIFACT_HASHES.json')))assert.equal(sha(resolve(dir,name)),hash,name);
 const baseline=read(`docs/fundamental-data-engine/evidence/2026-10-15-ticker-closure-${t}/${t}_RETAINED_ADMISSION_INPUT.json`),previous=buildHybridAdmission(baseline,financialHash);
 for(const b of input.sourceBindings)assert.equal(sha(b.path),b.sha256,b.path);
 assert.deepEqual(buildHybridAdmission(input,financialHash),snapshot);assert.deepEqual(snapshot.invalidVerificationIds,[]);assert.deepEqual(snapshot.unresolvedIssuerConflicts,[]);
 assert.deepEqual(input.universe,baseline.universe);assert.deepEqual(input.candidates,baseline.candidates);assert.deepEqual(input.certificationWitnesses,{candidates:[],verifications:[]});
 for(const v of baseline.verifications)assert.deepEqual(input.verifications.find(n=>n.id===v.id),v,'Never overwrite original observation');
 assert.equal(final.coverage.SUPPORTING.admitted,{MSN:19,VNM:16,SAB:18}[t]);assert.equal(final.coverage.CORE.required,35);assert.equal(final.coverage.SECTOR_CORE.required,5);assert.equal(final.coverage.SUPPORTING.required,40);
 const periods=financialTargets(input).map(target=>evaluateHybridTarget(target,input.universe[0].sector,snapshot,input));
 for(const tier of ['CORE','SECTOR_CORE','SUPPORTING']){assert.equal(periods.reduce((sum,p)=>sum+p[tier].available,0),final.coverage[tier].admitted);assert.equal(periods.reduce((sum,p)=>sum+p[tier].required,0),final.coverage[tier].required);}
 const current=selectHybridCurrentPeriods(input,snapshot);assert.deepEqual(current,read(dir+'/CURRENT_TRAJECTORY.json'));
 assert.equal(final.levelOneReady,!final.coverage.CORE.missing&&!final.coverage.SECTOR_CORE.missing&&!review.materialGaps.length&&!current[0].CURRENT_TRAJECTORY.missingCurrentYtd);
 const changed=f=>t==='SAB'?f.itemId==='CFO'&&f.period.end==='2023-12-31':t==='MSN'?f.itemId==='REPORTED_BORROWINGS':false;
 for(const f of previous.canonicalFacts.filter(f=>!changed(f)))assert.deepEqual(snapshot.canonicalFacts.find(n=>n.id===f.id),f,'Already qualified accounting facts preserved');
 for(const p of review.periods){
  const debt=snapshot.canonicalFacts.find(f=>f.itemId==='REPORTED_BORROWINGS'&&f.period.end===p.periodEnd);
  if(p.status!=='QUALIFIED'){assert(!debt);assert.equal(p.currentPortion,null);assert.equal(p.reportedBorrowings,null);continue;}
  assert.equal(debt?.value,p.reportedBorrowings);const receipt=input.reportedDebtReceipts.find(r=>r.periodEnd===p.periodEnd);assert.equal(evaluateDebtReceipt(receipt,snapshot.canonicalFacts,input,financialHash)?.value,p.reportedBorrowings);
  assert.equal(receipt.shortIncludesCurrentPortion,true);assert.equal(receipt.longIncludesCurrentPortion,false);
  if(t==='MSN'){
   for(const side of ['SHORT','LONG'])assert.equal(p.components.filter(c=>c.alreadyIncludedIn===side).reduce((sum,c)=>sum+BigInt(c.amount),0n).toString(),side==='SHORT'?p.short:p.long);
   assert.equal((BigInt(p.short)+BigInt(p.long)+p.additions.reduce((sum,c)=>sum+BigInt(c.amount),0n)).toString(),debt.value);
   assert(p.uncertaintyComponents.some(c=>c.amount===null));assert.equal(debt.debtMetadata.uncertainty.unclassifiedLiabilityAmount,null);assert.equal(debt.debtMetadata.comprehensivePopulationStatus,'COMPREHENSIVE_UNVERIFIED');
  }
 }
 if(t==='SAB'){
  assert.deepEqual(input.reportedDebtReceipts,baseline.reportedDebtReceipts);const r=review.revision,b=r.bridge;
  assert.equal((BigInt(r.comparative.value)-BigInt(r.original.value)).toString(),b.operatingIncrease);assert.equal((BigInt(b.originalInvesting)-BigInt(b.comparativeInvesting)).toString(),b.investingDecrease);assert.equal(b.operatingIncrease,b.investingDecrease);
  assert.equal(snapshot.canonicalFacts.find(f=>f.itemId==='CFO'&&f.period.end==='2023-12-31').value,r.comparative.value);
  for(const id of r.predecessorIds){const successors=input.verifications.filter(v=>v.supersedesFactId===id);assert.equal(successors.length,1);assert.equal(successors[0].revisionEvidence,root+'/SAB/TARGETED_REVIEW.json');}
 }
 if(t==='VNM'){
  assert.equal(sha(review.source.retainedPath),review.source.SHA256);assert.equal(readFileSync(review.source.retainedPath).subarray(0,5).toString(),'%PDF-');
  for(const metric of ['REVENUE','NET_INCOME','CFO']){const f=snapshot.canonicalFacts.find(f=>f.itemId===metric&&f.period.end==='2026-06-30'&&f.reportPeriodType==='YTD');assert(f);assert.equal(f.period.start,'2026-01-01');}
  assert.equal(final.levelOneReady,false);assert.equal(final.coverage.CORE.admitted,32);assert.equal(review.periods.filter(p=>p.status!=='QUALIFIED').length,3);
 }
 assert(!/manual-extracted|\/private\/tmp\/|retainedReaderProof|\.png"/.test(JSON.stringify(input)));
 const temp=mkdtempSync(resolve(tmpdir(),'consumer-targeted-replay-'));
 try{execFileSync(process.execPath,['scripts/close-consumer-targeted-fix.mjs','--ticker='+t,'--out='+temp],{stdio:'pipe'});for(const n of readdirSync(temp))assert.equal(readFileSync(resolve(temp,n),'utf8'),readFileSync(resolve(dir,n),'utf8'),n);}finally{rmSync(temp,{force:true,recursive:true});}
 results.push({ticker:t,status:'PASS',verdict:final.verdict,separateProcessReplay:true,contentHash:snapshot.contentHash});
}
for(const b of read(root+'/PROTECTED_BASELINE.json').bindings)assert.equal(sha(b.path),b.sha256,b.path);
if(process.argv.includes('--seal'))for(const t of ['MSN','VNM','SAB']){const dir=resolve(root,t);writeFileSync(dir+'/ARTIFACT_HASHES.json',JSON.stringify(Object.fromEntries(readdirSync(dir).filter(n=>n!=='ARTIFACT_HASHES.json').sort().map(n=>[n,sha(resolve(dir,n))])),null,2)+'\n');}
if(process.argv.includes('--record'))writeFileSync(root+'/INDEPENDENT_REPLAY.json',JSON.stringify({offline:true,independentHumanReview:false,results},null,2)+'\n');
console.log(JSON.stringify(results));
