/** Replays actual SQLite API bytes into purpose-bound EOD snapshots. No fetch/temp raw files. */
import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {exactJson}=await import('../src/infrastructure/market-boundary/exact-json.ts');
const {parseTcbsIdentity,normalizeTcbsEod,TCBS_EOD_VERSION}=await import('../src/domain/market-boundary/tcbs-eod.ts');
const {HOSE_HOLIDAYS_2026,eodPolicy}=await import('../src/domain/market-boundary/hose-calendar.ts');
const {latestCompletedHoseSession}=await import('../src/domain/market-boundary/completed-session.ts');
const {seal,reference,readSealed}=await import('../src/domain/market-boundary/validation.ts');
const {marketFreshness}=await import('../src/domain/market-boundary/freshness.ts');
const {snapshotHash,manifestDigest}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const {canonicalJson}=await import('../src/domain/fundamentals/snapshot.ts');
const {openDatabase}=await import('../src/infrastructure/db/client.ts');
const {loadDatabaseConfig}=await import('../src/infrastructure/config/database.ts');
const {PrismaBoundaryStore}=await import('../src/infrastructure/repositories/market-boundary.ts');
const out='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/b6-integration-r1';
mkdirSync(out,{recursive:true});assert(!existsSync(out+'/market-qualification.json'),'OUTPUT_EXISTS');
const at=new Date().toISOString(),sha=b=>createHash('sha256').update(b).digest('hex');
const db=new DatabaseSync('data/vn30.sqlite',{readOnly:true});
const ev=(id,value,knownAt=at)=>({id,hash:snapshotHash(value),knownAt,effectiveAt:knownAt});
const save=(name,x)=>writeFileSync(out+'/'+name,JSON.stringify(x,null,2)+'\n');
const members=JSON.parse(readFileSync('docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json','utf8')).partition.members;
assert.equal(members.length,30);const sourcePins=new Map();
function capture(row){
 assert(row);assert.equal(sha(row.body),row.body_hash);const r=JSON.parse(row.body);
 assert.equal(r.httpStatus,200);assert.equal(sha(r.raw),r.rawSha256);assert(r.receivedAt<=at);
 sourcePins.set(row.id,{id:row.id,bodyHash:row.body_hash,rawHash:r.rawSha256,receivedAt:r.receivedAt,apiId:r.apiId});
 return {...r,id:row.id,parsed:exactJson(r.raw)};
}
const api=(id,ticker)=>capture(db.prepare("SELECT * FROM broker_observation WHERE kind='TCBS_API_RESPONSE' AND api_id=? AND (? IS NULL OR json_extract(body,'$.request.ticker')=?) ORDER BY received_at DESC,id ASC LIMIT 1").get(id,ticker??null,ticker??null));
try{
 const boardCapture=api('5.1');assert.equal(boardCapture.request.url,'https://openapi.tcbs.com.vn/tartarus/v1/tickerCommons');
 const rawDate=boardCapture.parsed.tradingDate;assert(/^\d\d\/\d\d\/\d{4}$/.test(rawDate));
 const date=rawDate.slice(6)+'-'+rawDate.slice(3,5)+'-'+rawDate.slice(0,2);
 const board=boardCapture.parsed.data.filter(b=>members.some(m=>m.ticker===b.symbol)).map(b=>({ticker:b.symbol,value:b.matchPrice}));
 assert.equal(board.length,30);assert.equal(new Set(board.map(b=>b.ticker)).size,30);
 const identities=members.map(m=>{const c=api('5.11',m.ticker);assert.equal(c.request.parameters.filter,'symbol='+m.ticker);return parseTcbsIdentity(c.parsed,m,c.receivedAt);});
 assert.equal(new Set(identities.map(i=>i.codeId)).size,30);assert.equal(new Set(identities.map(i=>i.isin)).size,30);
 const corporateBody={adjustment:'NO_BACK_ADJUSTMENT',scope:'LATEST_COMPLETED_BAR_ONLY',boardMatch:'REQUIRED',historicalTotalReturn:'UNSUPPORTED',shareAccounting:'EXISTING_LEDGER_ONLY'};
 const corporateActions=ev('tcbs-raw-latest-eod-policy-v1',corporateBody);
 const calendarBody={version:'hose-calendar-2026-v1',validFrom:'2026-01-01',validThrough:'2026-12-31',holidays:HOSE_HOLIDAYS_2026,sourceModule:'src/domain/market-boundary/hose-calendar.ts',sourceHash:sha(readFileSync('src/domain/market-boundary/hose-calendar.ts')),cutoff:'15:00 Vietnam conservative completed session boundary'};
 const calendar={version:calendarBody.version,validFrom:calendarBody.validFrom,validThrough:calendarBody.validThrough,holidayDates:calendarBody.holidays,evidence:ev('hose-calendar-2026-v1',calendarBody)};
 assert.equal(latestCompletedHoseSession(at,calendar),date,'NOT_LATEST_COMPLETED_SESSION');
 let policy=eodPolicy(date,calendar,ev('tcbs-sqlite-eod-valuation-session-v1',{}));
 const {hash:_hash,...policyWithoutHash}=policy;void _hash;policy={...policy,hash:snapshotHash(policyWithoutHash)};
 const profile={contractVersion:TCBS_EOD_VERSION,currency:'VND',unit:'VND_PER_SHARE',multiplier:'1',tradingDate:date,session:'HOSE_DAILY_COMPLETED',barEnd:date+'T08:00:00.000Z',adjustment:'RAW_LATEST_CLOSE_MATCHED_TO_BOARD',corporateActions,identities,board};
 const sources=[],observations=[],inputs=[];
 for(const m of members){
  const row=db.prepare("SELECT * FROM broker_observation WHERE kind='TCBS_MARKET_PRICE' AND api_id=? AND json_extract(body,'$.schemaVersion')='tcbs-display-price-v2' ORDER BY json_extract(body,'$.selectedAt') DESC LIMIT 1").get(m.ticker);
  assert(row);assert.equal(sha(row.body),row.body_hash);const p=JSON.parse(row.body);
  assert.equal(p.field,'DAILY_BAR_CLOSE_REFERENCE');assert.equal(p.tradingDate,date);
  const c=capture(db.prepare('SELECT * FROM broker_observation WHERE id=?').get(p.sourceObservationId));
  assert.equal(c.apiId,'5.13');assert.equal(c.request.parameters.ticker,m.ticker);assert.equal(c.request.parameters.countBack,'2');
  assert(c.receivedAt>=profile.barEnd,'PRE_CLOSE_CAPTURE');assert(boardCapture.receivedAt>=profile.barEnd);
  const source={id:c.id,hash:c.rawSha256,sourceId:'TCBS_OPENAPI_EOD',request:ev('request-'+m.ticker,c.request,c.receivedAt),rawPath:'sqlite:data/vn30.sqlite#broker_observation/'+c.id+'/raw',retrievedAt:c.receivedAt,providerAt:null,schemaVersion:'tcbs-bars-long-term-v1',origin:'REAL_SOURCE'};
  const obs=normalizeTcbsEod(c.parsed,source,profile);assert.equal(obs[0].value,p.value);
  sources.push(source);observations.push(...obs);inputs.push({raw:c.parsed,source});
 }
 const negative=[];
 function rejects(name,fn){assert.throws(fn);negative.push({name,status:'PASS_REJECTED'});}
 const first=inputs[0];
 rejects('wrongIdentity',()=>normalizeTcbsEod({...first.raw,ticker:'NOT_IN_UNIVERSE'},first.source,profile));
 rejects('wrongUnitMultiplier',()=>normalizeTcbsEod(first.raw,first.source,{...profile,multiplier:'1000'}));
 rejects('historicalAdjustmentMislabel',()=>normalizeTcbsEod(first.raw,first.source,{...profile,adjustment:'ADJUSTED_TOTAL_RETURN'}));
 const bar=first.raw.data.find(b=>b.tradingDate===date+'T00:00:00.000Z');assert(bar);
 rejects('duplicateSession',()=>normalizeTcbsEod({...first.raw,data:[...first.raw.data,bar]},first.source,profile));
 rejects('boardConflict',()=>normalizeTcbsEod(first.raw,first.source,{...profile,board:board.map(b=>b.ticker===first.raw.ticker?{...b,value:'1'}:b)}));
 rejects('uncompletedSource',()=>normalizeTcbsEod(first.raw,{...first.source,retrievedAt:date+'T07:00:00.000Z'},profile));
 const badOHLC={...first.raw,data:first.raw.data.map(b=>b===bar?{...b,low:'999999999'}:b)};
 rejects('impossibleOHLC',()=>normalizeTcbsEod(badOHLC,first.source,profile));
 const sourceContract=ev('tcbs-sqlite-source-contract-v1',{profile,unitBasis:'VND_PER_SHARE_MULTIPLIER_1_BOARD_MATCHED',scope:'CURRENT_KNOWLEDGE_LATEST_COMPLETED_EOD_VALUATION_ONLY',rawStore:'SQLite immutable broker_observation response body',sourcePins:[...sourcePins.values()]});
 const capabilityBody={sourceContract,sourceId:'TCBS_OPENAPI_EOD',sourceSchema:'tcbs-bars-long-term-v1',normalizerVersion:TCBS_EOD_VERSION,identityVersion:snapshotHash(identities),semanticsVersion:'VND_PER_SHARE_RAW_LATEST_EOD_MULTIPLIER_1',corporateActionPolicy:corporateActions,freshnessPolicy:{id:policy.id,hash:policy.hash,knownAt:policy.knownAt,effectiveAt:policy.effectiveAt},calendar:calendar.evidence,rawSamples:sources,normalizedSampleHash:snapshotHash(observations),negativeValidation:ev('tcbs-sqlite-negative-validation-v1',negative),missingBehavior:'BLOCK',duplicateBehavior:'BLOCK_CONFLICT'};
 const capability=seal('CAPABILITY','tcbs-sqlite-capability-'+snapshotHash(capabilityBody).slice(0,24),at,at,capabilityBody,snapshotHash);
 const universe=ev('retained-project-universe-30-v1',members.map(m=>({securityId:m.securityId,ticker:m.ticker})));
 const marketBody={capability:reference(capability),universe,requestedAsOf:at,purpose:'VALUATION',acceptedTradingDate:date,session:profile.session,observations,sources,normalizationVersion:TCBS_EOD_VERSION,freshnessPolicy:capabilityBody.freshnessPolicy,calendar:calendar.evidence};
 const market=seal('MARKET','tcbs-sqlite-market-'+snapshotHash(marketBody).slice(0,24),at,at,marketBody,snapshotHash);
 const request={mode:'LIVE',requestedAt:at,knownAt:at,now:at,purpose:'VALUATION',securityIds:members.map(m=>m.securityId),universe};
 const proof=marketFreshness(market,capability,policy,request,snapshotHash);assert.equal(proof.status,'PASS');
 for(const purpose of ['EXECUTION','SCORING','TECHNICAL','PORTFOLIO_NAV']){
  const p=marketFreshness(market,capability,policy,{...request,purpose},snapshotHash);assert.equal(p.status,'BLOCKED');negative.push({name:'purpose-'+purpose,status:'PASS_BLOCKED'});
 }
 const next=policy.windows[0].through;const expiredAt=new Date(Date.parse(next)+1).toISOString();assert.equal(marketFreshness(market,capability,policy,{...request,requestedAt:expiredAt,knownAt:expiredAt,now:expiredAt},snapshotHash).status,'BLOCKED');negative.push({name:'expiredSession',status:'PASS_BLOCKED'});
 // Persist only on explicit flag, after an independently created backup. No activation/head/approval.
 let persisted=false;
 if(process.argv.includes('--persist')){
  assert(existsSync('backups/2026-10-29-b6-data-integration/before.sqlite'),'BACKUP_REQUIRED');
  const client=await openDatabase(loadDatabaseConfig({DATABASE_URL:'file:'+process.cwd()+'/data/vn30.sqlite'},process.cwd()));
  try{
   await client.$transaction(async tx=>{const store=new PrismaBoundaryStore(tx);await store.append(capability);await store.append(market);});
   const store=new PrismaBoundaryStore(client);assert.equal((await store.find(reference(market),'MARKET')).contentHash,market.contentHash);persisted=true;
  }finally{await client.$disconnect();}
 }
 save('market-qualification.json',{status:'PASS_TECHNICAL_VALUATION_EOD',productionActivation:false,aiAcceptanceRuntimePending:true,builtAt:at,tradingDate:date,sourceContract,corporatePolicy:corporateBody,calendar:calendarBody,policy,profile,capability,market,freshness:proof,negativeTests:negative,sourcePins:[...sourcePins.values()],persisted,limitations:['Latest completed daily CLOSE only; no historical total-return/corporate-action series qualification.','VALUATION only; no execution, intraday, portfolio NAV or scoring purpose accepted.','No production dependency head or legacy independent approval activated; AI acceptance runtime remains separate item4.']});
 assert.equal(readSealed(market,'MARKET',snapshotHash).contentHash,market.contentHash);assert.equal(manifestDigest(canonicalJson(market)),sha(canonicalJson(market)));
 console.log(JSON.stringify({status:proof.status,observations:observations.length,identities:identities.length,negativeTests:negative.length,tradingDate:date,eligibleUntil:proof.eligibleUntil,persisted,activation:false}));
}finally{db.close();}
