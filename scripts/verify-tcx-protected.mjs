import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='docs/fundamental-data-engine/evidence/';
const output=root+'2026-10-16-ticker-closure-TCX/';
const tickers='HPG VCB SSI FPT VHM VRE VPL MSN MWG SAB MCH GAS BSR GVR VJC'.split(' ');
const ticker=process.argv.find(a=>a.startsWith('--ticker='))?.slice(9);
if(ticker){
 assert(tickers.includes(ticker));
 const dir=root+readdirSync(root).find(d=>d.includes('ticker-closure-')&&d.endsWith('-'+ticker));
 const input=JSON.parse(readFileSync(dir+'/'+ticker+'_RETAINED_ADMISSION_INPUT.json','utf8'));
 const expected=JSON.parse(readFileSync(dir+'/'+ticker+'_CANONICAL_FACTS.json','utf8'));
 const {buildHybridAdmission}=await import('../src/domain/fundamentals/hybrid-admission.ts');
 const {financialHash}=await import('../src/infrastructure/fundamentals/hybrid-input.ts');
 for(const b of input.sourceBindings)assert.equal(createHash('sha256').update(readFileSync(b.path)).digest('hex'),b.sha256,b.path);
 const replay=buildHybridAdmission(input,financialHash);assert.deepEqual(replay,expected);
 console.log(JSON.stringify({ticker,status:'PASS',offline:true,separateProcess:true,sourceBindings:input.sourceBindings.length,contentHash:replay.contentHash}));
}else{
 const results=tickers.map(t=>{try{return JSON.parse(execFileSync(process.execPath,['scripts/verify-tcx-protected.mjs','--ticker='+t],{encoding:'utf8',timeout:60000}));}catch(e){return {ticker:t,status:'FAIL',error:String(e.stderr??e.message)};}});
 const vnm=JSON.parse(readFileSync(root+'2026-10-15-ticker-closure-VNM/VNM_FINAL_SUFFICIENCY.json','utf8'));
 const result={status:results.every(r=>r.status==='PASS')&&!vnm.levelOneReady?'PASS':'FAIL',results,VNM:{levelOneReady:vnm.levelOneReady,verdict:vnm.verdict,status:'DEFERRED BLOCKED'}};
 if(process.argv.includes('--record'))writeFileSync(output+'PROTECTED_REPLAY_RESULTS.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
 assert.equal(result.status,'PASS');
}
