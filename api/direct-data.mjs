/** Direct API -> SQLite storage. No capture folders or staging data files. */
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { statSync, realpathSync, lstatSync } from 'node:fs';
import path from 'node:path';
import {DISPLAY_PRICE_POLICY,localSession,closeInstant,isTradingDay,verifyDisplaySelection} from '../src/shared/market-display-session.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
const day = value => {
 const text=typeof value==='string'?value:'';
 const d=/^\d{4}-\d{2}-\d{2}(T00:00:00(?:\.000)?Z)?$/.test(text)?text.slice(0,10):/^\d{2}\/\d{2}\/\d{4}$/.test(text)?text.slice(6)+'-'+text.slice(3,5)+'-'+text.slice(0,2):'';
 if(!d||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)throw Error('INVALID_PRICE_DATE');
 return d;
};
const vietnamDay = date => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date));
const price = n => { if(!Number.isSafeInteger(n)||n<=0)throw Error('PRICE_NOT_EXACT_POSITIVE_VND_INTEGER');return String(n); };
export function directDatabasePath(root, url=process.env.DATABASE_URL) {
 const file=url===undefined?path.join(realpathSync(root),'data/vn30.sqlite'):url.startsWith('file:/')&&!url.startsWith('file://')&&!/[?%#\0]/.test(url)?url.slice(5):'';
 if(!path.isAbsolute(file)||! /\.(sqlite3?|db)$/.test(file))throw Error('INVALID_DIRECT_DATABASE_PATH');
 for(const dir of ['public','.next']){const rel=path.relative(path.resolve(root,dir),file);if(rel===''||(!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel)))throw Error('UNSAFE_DIRECT_DATABASE_PATH');}
 if(lstatSync(file).isSymbolicLink()||statSync(file).mode&0o077)throw Error('PRIVATE_DIRECT_DATABASE_REQUIRED');
 const actual=realpathSync(file);
 for(const dir of ['public','.next']){const rel=path.relative(path.resolve(realpathSync(root),dir),actual);if(rel===''||(!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel)))throw Error('UNSAFE_DIRECT_DATABASE_PATH');}
 return actual;
}
export function openDirectData(file) {
 const db=new DatabaseSync(file);db.exec('PRAGMA busy_timeout=5000');
 if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='broker_observation'").get()){db.close();throw Error('BROKER_OBSERVATION_SCHEMA_REQUIRED');}
 const insert=db.prepare('INSERT OR IGNORE INTO broker_observation(id,kind,api_id,received_at,body,body_hash) VALUES(?,?,?,?,?,?)');
 function append(kind,apiId,receivedAt,value){const body=JSON.stringify(value),sha256=hash(body),id=kind+':'+sha256;insert.run(id,kind,apiId,receivedAt,body,sha256);return {id,sha256};}
 function response(row,bytes){
  const raw=bytes.toString('utf8');let data=null;try{data=JSON.parse(raw);}catch{/* Invalid JSON remains a raw failed observation. */}
  const saved=append('TCBS_API_RESPONSE',row.apiId,row.retrievedAt,{apiId:row.apiId,receivedAt:row.retrievedAt,httpStatus:row.httpStatus,data,raw,request:{method:row.method,url:row.url,parameters:row.parameters,ticker:row.ticker??null,variant:row.variant??null},rawSha256:hash(bytes)});
  return {observationId:saved.id,sha256:hash(bytes)};
 }
 function raw(row){const r=db.prepare('SELECT body,body_hash FROM broker_observation WHERE id=?').get(row.observationId);if(!r||hash(r.body)!==r.body_hash)throw Error('DIRECT_RAW_INTEGRITY');return JSON.parse(r.body);}
 function publishPrices(rows,members,selectedAt){
  const core=rows.filter(r=>r.httpStatus===200&&r.observationId),byTicker=[],rejected=[];
  selectedAt??=core.map(r=>r.retrievedAt).sort().at(-1)??new Date().toISOString();
  let session;
  try{session=localSession(selectedAt);}catch(e){return {state:'PARTIAL',published:0,requested:members.length,missing:members.map(m=>m.ticker),rejected:members.map(m=>({ticker:m.ticker,reason:e.message}))};}
  let quote;
  const board=core.filter(r=>r.apiId==='5.1'&&r.retrievedAt<=selectedAt).sort((a,b)=>b.retrievedAt.localeCompare(a.retrievedAt))[0];
  if(board){try{const b=raw(board).data;const date=day(b.tradingDate);if(date>vietnamDay(board.retrievedAt))throw Error('FUTURE_QUOTE');const seen=new Set();for(const q of b.data??[]){if(seen.has(q.symbol))throw Error('DUPLICATE_QUOTE');seen.add(q.symbol);}quote={date,data:b.data,row:board};}catch{quote=undefined;}}
  const reference=(r,i,field,date,value)=>({value:price(value),tradingDate:date,receivedAt:r.retrievedAt,sourceObservationId:r.observationId,sourcePointer:'/data/data/'+i+'/'+field,rawSourceSha256:r.sha256});
  for(const m of members){
   try{
    const qIndex=quote?.data?.findIndex(q=>q.symbol===m.ticker),q=qIndex>=0?quote.data[qIndex]:undefined;
    const r=core.filter(r=>r.apiId==='5.13'&&r.ticker===m.ticker&&!r.variant&&r.retrievedAt<=selectedAt).sort((a,b)=>b.retrievedAt.localeCompare(a.retrievedAt))[0];
    let eligible=[];
    if(r){
     const b=raw(r).data;if(b.ticker!==m.ticker||!Array.isArray(b.data))throw Error('BAR_IDENTITY_SCHEMA');
     eligible=b.data.map((v,i)=>({v,i,date:day(v.tradingDate)})).filter(x=>x.date.slice(0,4)===session.date.slice(0,4)&&x.date<=session.expectedCloseDate&&isTradingDay(x.date)&&Date.parse(closeInstant(x.date))<=Date.parse(r.retrievedAt)).sort((a,b)=>b.date.localeCompare(a.date));
    }
    const closeRef=x=>{if(eligible.filter(v=>v.date===x.date).length!==1)throw Error('DUPLICATE_BAR_DATE');if(!(Number.isFinite(x.v.low)&&Number.isFinite(x.v.high)&&x.v.low<=x.v.close&&x.v.close<=x.v.high))throw Error('BAR_OHLC');return reference(r,x.i,'close',x.date,x.v.close);};
    const prior=eligible.find(x=>x.date===session.previousSession);
    const openingReference=prior?closeRef(prior):null;
    const exchangeOpen=session.state!=='NON_TRADING_DAY'&&quote?.date===session.date&&q?.open>0?reference(quote.row,qIndex,'open',quote.date,q.open):null;
    const activeQuote=session.inSession&&quote?.date===session.date&&localSession(quote.row.retrievedAt).inSession&&q?.matchPrice>0&&q?.open>0;
    let chosen,field,selectionStatus;
    if(activeQuote){chosen=reference(quote.row,qIndex,'matchPrice',quote.date,q.matchPrice);field='MATCH_PRICE';selectionStatus='MATCH_PRICE_SELECTED';}
    else{
     const x=eligible[0];if(!x){rejected.push({ticker:m.ticker,reason:'COMPLETED_CLOSE_UNAVAILABLE'});continue;}
     chosen=closeRef(x);field='DAILY_BAR_CLOSE_REFERENCE';selectionStatus=x.date!==session.expectedCloseDate?'EXPECTED_CLOSE_NOT_AVAILABLE':session.inSession?'MATCH_UNAVAILABLE_USING_COMPLETED_CLOSE':'COMPLETED_CLOSE_SELECTED';
    }
    const p={schemaVersion:'tcbs-display-price-v2',ticker:m.ticker,...chosen,field,unit:'VND_PER_SHARE',policyVersion:DISPLAY_PRICE_POLICY,selectedAt,sessionDate:session.date,sessionState:session.state,selectionMode:session.inSession?'IN_SESSION':'OUTSIDE_SESSION',timezone:'Asia/Ho_Chi_Minh',calendarVersion:session.calendarVersion,expectedCloseDate:session.expectedCloseDate,selectionStatus,openingReferenceBasis:'PREVIOUS_SESSION_CLOSE_BY_OWNER_RULE',openingReference,exchangeOpen,adjustment:'PROVIDER_UNDECLARED'};
    verifyDisplaySelection(p);byTicker.push(p);
   }catch(e){rejected.push({ticker:m.ticker,reason:/^[A-Z_]+$/.test(e.message??'')?e.message:'PRICE_SCHEMA_INVALID'});}
  }
  // Coverage is explicit; a failed account endpoint cannot undo valid market rows.
  let published=0;db.exec('BEGIN IMMEDIATE');
  try{for(const p of byTicker){
   const previous=db.prepare("SELECT body FROM broker_observation WHERE kind='TCBS_MARKET_PRICE' AND api_id=? ORDER BY CASE WHEN json_extract(body,'$.schemaVersion')='tcbs-display-price-v2' THEN 1 ELSE 0 END DESC,COALESCE(json_extract(body,'$.selectedAt'),received_at) DESC,id ASC LIMIT 1").get(p.ticker);
   if(previous){const old=JSON.parse(previous.body);if((old.selectedAt??old.receivedAt)>p.selectedAt)continue;if(old.field==='DAILY_BAR_CLOSE_REFERENCE'&&p.field==='DAILY_BAR_CLOSE_REFERENCE'&&old.tradingDate>p.tradingDate){rejected.push({ticker:p.ticker,reason:'OLDER_COMPLETED_CLOSE_NOT_PUBLISHED'});continue;}}
   append('TCBS_MARKET_PRICE',p.ticker,p.receivedAt,p);published++;
  }db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
  return {state:published===members.length&&byTicker.every(p=>p.selectionStatus!=='EXPECTED_CLOSE_NOT_AVAILABLE'&&(!session.inSession||(p.openingReference&&p.field==='MATCH_PRICE')))?'UPDATED':'PARTIAL',published,requested:members.length,missing:members.filter(m=>!byTicker.some(p=>p.ticker===m.ticker)).map(m=>m.ticker),openingReferenceMissing:byTicker.filter(p=>!p.openingReference).map(p=>p.ticker),awaitingMatchPrice:byTicker.filter(p=>session.inSession&&p.field!=='MATCH_PRICE').map(p=>p.ticker),awaitingExpectedClose:byTicker.filter(p=>p.selectionStatus==='EXPECTED_CLOSE_NOT_AVAILABLE').map(p=>p.ticker),rejected};
 }
 return {response,publishPrices,saveRun:report=>append('TCBS_CAPTURE_RUN',null,report.finishedAt,report),close:()=>db.close()};
}
