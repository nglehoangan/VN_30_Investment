/** Reuse actual P2.3 probes against exactly the SSI research dossier. */
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
const out='docs/fundamental-data-engine/dfr-05/p2-4-b1-ssi-fc688e49';
const records=[];
for(const ticker of ['SSI']) {
 const path=`${out}/dossier.json`;
 const dossier=JSON.parse(readFileSync(path,'utf8'));
 const securityId=dossier.securityId??'11111111-1111-4111-8111-111111111111';
 const nestedRank={id:'dfr05-bank-boundary-probe',asOf:'2026-11-05T00:00:00.000Z',calculatedAt:'2026-11-05T00:00:00.000Z',cards:[{securityId,input:dossier}],universe:{referenceVersion:'probe-only',securityIds:[securityId],complete:false},portfolio:null,requiredReturnAssessments:[]};
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
 ]) {
  let rejected=false,reason=null;
  try {fn();} catch(error) {rejected=true;reason=error.issues?.[0]?.reason??error.message;}
  assert.ok(rejected,`${ticker}: research entered ${entry}`);
  records.push({ticker,entry,status:'REJECTED',reason});
 }
 assert.equal(dossier.totalScore,null);assert.equal(dossier.ranking,null);assert.equal(dossier.valuationPerShare,null);
}
assert.equal(records.length,9);
writeFileSync(`${out}/boundary-results.json`,JSON.stringify({status:'PASS',probes:records.length,records,scope:'Actual direct and nested dossier rejection; not proof against arbitrary transformed/authenticated inputs',productionActivation:false},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',rejectionProbes:records.length}));
