import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {buildHybridAdmission}=await import('../src/domain/fundamentals/hybrid-admission.ts');
const {financialHash}=await import('../src/infrastructure/fundamentals/hybrid-input.ts');
const {financialTargets,evaluateHybridTarget,selectHybridCurrentPeriods}=await import('../src/domain/fundamentals/hybrid-sufficiency.ts');
const dir='docs/fundamental-data-engine/evidence/2026-10-16-di-governance-closure/';
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const details=read(dir+'DISPOSITION_DETAILS_AFTER_FIX.json'),results=[];
assert.equal(details.rows.length,30);assert.equal(new Set(details.rows.map(r=>r.ticker)).size,30);
assert.deepEqual([...details.rows.map(r=>r.ticker)].sort(),[...read(dir+'OFFICIAL_VN30_UNIVERSE_REVIEW.json').composition].sort());
for(const row of details.rows){
 const input=read(row.inputPath),expected=read(row.canonicalPath),actual=buildHybridAdmission(input,financialHash);
 assert.deepEqual(actual,expected,row.ticker+' canonical replay');assert.equal(actual.readyForScoring,false);
 for(const b of input.sourceBindings)assert.equal(sha(b.path),b.sha256,b.path);
 const periods=financialTargets(input).map(t=>evaluateHybridTarget(t,row.sector,actual,input));
 for(const tier of ['CORE','SECTOR_CORE','SUPPORTING']){assert.equal(periods.reduce((n,p)=>n+p[tier].required,0),row.coverage[tier].required);assert.equal(periods.reduce((n,p)=>n+p[tier].available,0),row.coverage[tier].admitted);}
 const current=selectHybridCurrentPeriods(input,actual).find(r=>r.ticker===row.ticker);
 const ready=periods.every(p=>p.CORE.required===p.CORE.available&&p.SECTOR_CORE.required===p.SECTOR_CORE.available)&&!current.CURRENT_TRAJECTORY.missingCurrentYtd&&!actual.unresolvedIssuerConflicts.length;
 assert.equal(ready,row.state==='CLOSED',row.ticker+' disposition');
 assert.equal(row.readyForScoring,false);assert.equal(row.decisionReady,false);assert.equal(row.score,null);assert.equal(row.top10Eligible,false);assert.equal(row.newCapitalEligible,false);
 results.push({ticker:row.ticker,state:row.state,status:'PASS',contentHash:actual.contentHash,inputHash:sha(row.inputPath),canonicalFileHash:sha(row.canonicalPath),coverage:row.coverage,current,exactBlockerEvidence:row.blockerEvidence,readyForScoring:false,decisionReady:false});
}
const result={status:'PASS',offline:true,results,counts:Object.fromEntries(['CLOSED','DEFERRED_BLOCKED','UNPROCESSED','INCONSISTENT'].map(s=>[s,results.filter(r=>r.state===s).length])),separateProducerCommands:read(dir+'REPLAY_COMMANDS.json'),historicalEvidenceChanged:false};
assert(result.separateProducerCommands.every(r=>r.exitCode===0));
if(process.argv.includes('--record'))writeFileSync(dir+'PROTECTED_REPLAY_RESULTS.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,tickers:results.length,counts:result.counts,producerCommands:result.separateProducerCommands.length}));
