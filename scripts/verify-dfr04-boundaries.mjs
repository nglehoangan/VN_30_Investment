/** Exercise existing production entry points with actual DFR-04 dossier objects. */
import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const {calculateScorecard}=await import('../src/domain/scoring/scorecard.ts');
const {rankScorecards}=await import('../src/domain/ranking/rank.ts');
const {decide}=await import('../src/domain/decision/engine.ts');
const {validateReview}=await import('../src/domain/workflow/validation.ts');
const {requestReasons}=await import('../src/domain/current-nav/qualification.ts');
const {buildTransaction}=await import('../src/domain/portfolio/transaction.ts');
const {validateDIAcceptance}=await import('../src/domain/personal-ai/scoring-readiness.ts');
const {validateAiScoringReview}=await import('../src/domain/personal-ai/provenance.ts');
const {snapshotHash}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const out='docs/fundamental-data-engine/dfr-04/2026-11-05';
const records=[];
for(const ticker of ['FPT','VNM','BID','TCX','VIC','VHM']){
 const dossier=JSON.parse(readFileSync(`${out}/issuers/${ticker}.json`,'utf8'));
 const nestedRank={id:'dfr04-rank-probe',asOf:'2026-11-05T00:00:00.000Z',calculatedAt:'2026-11-05T00:00:00.000Z',cards:[{securityId:'11111111-1111-4111-8111-111111111111',input:dossier}],universe:{referenceVersion:'probe-only',securityIds:['11111111-1111-4111-8111-111111111111'],complete:false},portfolio:null,requiredReturnAssessments:[]};
 for(const [entry,fn] of [
  ['formal scoring',()=>calculateScorecard(dossier)],
  ['ranking root',()=>rankScorecards(dossier)],
  ['ranking nested card',()=>rankScorecards(nestedRank)],
  ['decision',()=>decide(dossier)],
  ['monthly DCA command',()=>validateReview({...dossier,type:'MONTHLY_DCA'})],
  ['NAV request',()=>requestReasons(dossier,{})],
  ['ledger transaction builder',()=>buildTransaction(dossier,'2026-11-05T00:00:00.000Z',[])],
  ['formal DI acceptance',()=>validateDIAcceptance(dossier)],
  ['formal AI provenance',()=>validateAiScoringReview(dossier,snapshotHash)]
 ]){
  let rejected=false,reason=null;
  try{fn();}catch(error){rejected=true;reason=error.issues?.[0]?.reason??error.message;}
  assert.ok(rejected,`${ticker}: research entered ${entry}`);
  records.push({ticker,entry,status:'REJECTED',reason});
 }
 assert.equal(dossier.totalScore,null);assert.equal(dossier.ranking,null);assert.equal(dossier.valuationPerShare,null);
}
const result={status:'PASS',probes:records.length,records,scope:'Direct dossier and nested ranking-card incompatibility; no adversarial transformation or authenticated provenance claim',productionActivation:false};
writeFileSync(`${out}/boundary-results.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,rejectionProbes:records.length}));
