/** Read-only qualification of one explicit direct-SQLite TCBS run; no API/raw staging files. */
import './lib/ts-runtime.mjs';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {verifyDisplaySelection} from '../src/shared/market-display-session.mjs';
const {latestDirectMarketPrices}=await import('../src/infrastructure/repositories/direct-market-prices.ts');
const root='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-economics-r3';
const hash=s=>createHash('sha256').update(s).digest('hex');
const runId=process.argv[2];assert.ok(runId?.startsWith('TCBS_CAPTURE_RUN:'),'EXPLICIT_RUN_ID_REQUIRED');
const db=new DatabaseSync('data/vn30.sqlite',{readOnly:true});
try{
 const get=id=>{const r=db.prepare('SELECT * FROM broker_observation WHERE id=?').get(id);assert.ok(r,'MISSING_OBSERVATION');assert.equal(hash(r.body),r.body_hash);assert.equal(r.id,r.kind+':'+r.body_hash);return {row:r,body:JSON.parse(r.body)};};
 const {body:run}=get(runId);assert.equal(run.scope.accounts,false);assert.equal(run.displayPrices.state,'UPDATED');assert.equal(run.displayPrices.published,30);assert.equal(run.marketCapture.restState,'CAPTURED_NOT_QUALIFIED');
 const members=JSON.parse(readFileSync('docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json')).partition.members;
 assert.deepEqual([...run.symbols].sort(),members.map(m=>m.ticker).sort());
 const requests=new Map();for(const r of run.requests){assert.equal(r.httpStatus,200);assert.equal(r.state,'CAPTURED_NOT_QUALIFIED');const x=get(r.observationId);assert.equal(x.row.kind,'TCBS_API_RESPONSE');assert.equal(hash(x.body.raw),r.sha256);assert.equal(x.body.rawSha256,r.sha256);assert.equal(x.body.request.ticker??undefined,r.ticker);assert.equal(x.body.apiId,r.apiId);assert.equal(x.body.httpStatus,200);assert.deepEqual(JSON.parse(x.body.raw),x.body.data);requests.set(r.observationId,r);}
 const records=db.prepare("SELECT id,body FROM broker_observation WHERE kind='TCBS_MARKET_PRICE' AND json_extract(body,'$.selectedAt')=?").all(run.finishedAt);
 assert.equal(records.length,30);const rows=[];
 for(const rec of records){const {body:p}=get(rec.id),member=members.find(m=>m.ticker===p.ticker);assert.ok(member);verifyDisplaySelection(p);assert.equal(p.tradingDate,'2026-10-30');assert.equal(p.expectedCloseDate,'2026-10-30');assert.equal(p.selectionStatus,'COMPLETED_CLOSE_SELECTED');assert.equal(p.unit,'VND_PER_SHARE');assert.equal(p.field,'DAILY_BAR_CLOSE_REFERENCE');assert.ok(p.openingReference);assert.equal(p.openingReference.tradingDate,'2026-10-29');
  for(const ref of [p,p.openingReference]){const r=requests.get(ref.sourceObservationId);assert.ok(r,'PRICE_SOURCE_OUTSIDE_EXPLICIT_RUN');assert.equal(r.ticker,p.ticker);assert.equal(r.securityId,member.securityId);assert.equal(r.sha256,ref.rawSourceSha256);let v=get(ref.sourceObservationId).body;for(const key of ref.sourcePointer.slice(1).split('/'))v=v[key.replaceAll('~1','/').replaceAll('~0','~')];assert.equal(String(v),ref.value);assert.ok(/^\d+$/.test(ref.value)&&BigInt(ref.value)>0n);}
  rows.push({ticker:p.ticker,securityId:member.securityId,observationId:rec.id,tradingDate:p.tradingDate,sourceObservationId:p.sourceObservationId,qualification:'CHECKED_COMPLETED_CLOSE_REFERENCE',adjustment:p.adjustment});
 }
 assert.equal(new Set(rows.map(r=>r.ticker)).size,30);
 // Exercise the application's reader through a read-only SQL port against the real database.
 const port={
  $queryRaw:async(strings,...values)=>db.prepare(strings.join('?')).all(...values),
  brokerObservation:{findUnique:async({where})=>db.prepare('SELECT body,body_hash AS bodyHash FROM broker_observation WHERE id=?').get(where.id)},
 };
 const now=new Date().toISOString(),display=await latestDirectMarketPrices(port,members.map(m=>m.ticker),now);
 assert.equal(display.length,30);assert.ok(display.every(p=>p.asOfDate==='2026-10-30'));
 for(const p of display){const ref=rows.find(r=>r.ticker===p.ticker);assert.equal(p.price,get(ref.observationId).body.value);}
 const result={contract:'b6-direct-sqlite-market-review-v1',reviewedAt:now,runId,capturedAt:run.finishedAt,session:'2026-10-30',state:'PASS_COMPLETED_CLOSE_REFERENCE',restRequests:run.requests.length,checkedPrices:30,checkedPreviousCloseReferences:30,applicationPriceReader:{state:'PASS',prices:display.length,transport:'READ_ONLY_SQL_PORT',browserUiChecked:false},websocketState:run.marketCapture.websocketState,websocketRequiredForCompletedDailyClose:false,scope:'DISPLAY_AND_REVIEW_REFERENCE_ONLY',productionScoringAuthorized:false,remaining:['Provider adjustment basis is undeclared; not qualified for adjusted historical/total-return analysis','Accounting, valuation and score admission remain separate'],rows:rows.sort((a,b)=>a.ticker.localeCompare(b.ticker))};
 writeFileSync(root+'/market-review.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({state:result.state,checkedPrices:30,restRequests:result.restRequests,websocketState:result.websocketState}));
}finally{db.close();}
