import {test} from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,chmodSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {main,cashStatementPage} from './tcbs.mjs';
import {localSession} from '../src/shared/market-display-session.mjs';

for(const failAccounts of [false,true])test(failAccounts?'account 4.16/4.17 HTTP400 stays separate while all30 market prices update':'one OTP/token fetches accounts, two cash pages, full30 EOD, history, index and WSS together',async()=>{
 const root=mkdtempSync(path.join(tmpdir(),'tcbs-unified-'));
 mkdirSync(path.join(root,'data'),{mode:0o700});const database=path.join(root,'data/vn30.sqlite');const db=new DatabaseSync(database);db.exec(readFileSync(new URL('../prisma/migrations/202610080001_broker_observations/migration.sql',import.meta.url),'utf8'));db.close();chmodSync(database,0o600);
 const oldKey=process.env.TCBS_API_KEY,oldCustody=process.env.TCBS_CUSTODY_CODE;
 const custody='TEST',token='h.'+Buffer.from(JSON.stringify({custodyID:custody,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.sig';
 const symbols=Array.from({length:30},(_,i)=>'T'+String(i).padStart(2,'0'));
 const calls=[];let otpReads=0;
 class Socket extends EventTarget{
  readyState=1;
  constructor(){super();queueMicrotask(()=>this.dispatchEvent(new Event('open')));}
  send(text){
   if(text.startsWith('d|a|'))queueMicrotask(()=>this.dispatchEvent(new MessageEvent('message',{data:'d|0|{"success":true}'})));
   if(text.startsWith('d|s|'))queueMicrotask(()=>this.dispatchEvent(new MessageEvent('message',{data:'s|38|'+JSON.stringify({data:symbols.map(symbol=>({symbol}))})})));
  }
  close(){this.readyState=3;}
 }
 try{
  const release='docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json';
  mkdirSync(path.dirname(path.join(root,release)),{recursive:true});mkdirSync(path.join(root,'api'));
  writeFileSync(path.join(root,release),JSON.stringify({partition:{members:symbols.map(ticker=>({ticker,securityId:'id-'+ticker}))}}));
  writeFileSync(path.join(root,'api/.env.local'),'TCBS_API_KEY=test-key\nTCBS_CUSTODY_CODE=TEST\n',{mode:0o600});
  const result=await main(['--seconds=1','--from=2026-10-01','--to=2026-10-20'],{root,databaseFile:database,getIntervalMs:0,WebSocket:Socket,
   readOtp:async()=>{otpReads++;return '123456';},
   fetch:async(url,init)=>{
    calls.push({url:new URL(url),init});
    if(init.method==='POST')return Response.json({token});
    assert.equal(init.headers.Authorization,'Bearer '+token);
    if(url.pathname.startsWith('/eros/'))return Response.json({basicInfo:{code105C:custody},bankSubAccounts:[{accountType:'NORMAL',status:'1',accountNo:'normal'},{accountType:'MARGIN',status:'1',accountNo:'margin'}]});
    if(url.pathname.includes('cashStatements')){
     assert.equal(url.searchParams.get('acctno'),'normal');
     if(failAccounts)return Response.json({code:'BAD_REQUEST'},{status:400});
     const page=Number(url.searchParams.get('pageIndex'));
     return Response.json({response:{pageIndex:page,pageSize:25,totalCount:26,data:Array.from({length:page===1?25:1},()=>({debitAmount:'1234567890123456789.123'}))}});
    }
    if(url.pathname.endsWith('/margin-info')){assert.equal(url.searchParams.get('acctno'),'margin');assert.equal(url.searchParams.get('custodycd'),custody);assert.equal(url.searchParams.get('fromdate'),'2026-10-01');assert.equal(url.searchParams.get('todate'),'2026-10-20');if(failAccounts)return Response.json({code:'BAD_REQUEST'},{status:400});}
    if(url.pathname.endsWith('/tickerCommons')){const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());return Response.json({tradingDate:date,data:symbols.map(symbol=>({symbol,matchPrice:54000,open:54000}))});}
    if(url.pathname.includes('bars-long-term'))return Response.json({ticker:url.searchParams.get('ticker'),data:[...new Set([localSession(new Date().toISOString()).expectedCloseDate,localSession(new Date().toISOString()).previousSession])].map(date=>({tradingDate:date+'T00:00:00.000Z',close:54000,low:53000,high:55000,volume:1000}))});
    return new Response('{"value":1234567890123456789.123456789}',{headers:{'content-type':'application/json'}});
   }});
  assert.equal(otpReads,1);assert.equal(calls.filter(c=>c.init.method==='POST').length,1);
  assert.equal(calls.filter(c=>c.url.pathname.startsWith('/eros/')).length,1);
  assert.equal(existsSync(path.join(root,'data/market-source')),false);
  const saved=new DatabaseSync(database,{readOnly:true});
  assert.equal(result.state,failAccounts?'PARTIAL_CAPTURE':'CAPTURED_NOT_QUALIFIED');assert.equal(result.requests.length,failAccounts?101:102);
  assert.equal(result.accountCapture.state,failAccounts?'PARTIAL_CAPTURE':'CAPTURED_NOT_QUALIFIED');assert.equal(result.marketCapture.state,'CAPTURED_NOT_QUALIFIED');
  if(failAccounts)assert.deepEqual(result.accountCapture.issues.map(i=>[i.apiId,i.reason]),[['4.16','HTTP_400'],['4.17','HTTP_400']]);
  assert.equal(result.scope.accounts,true);if(!failAccounts){assert.equal(result.cashHistory.complete,true);assert.equal(result.cashHistory.receivedRows,26);}else assert.equal(result.cashHistory,undefined);
  assert.ok(result.requests.some(r=>r.apiId==='4.7'));
  assert.equal(new Set(result.requests.map(r=>r.observationId)).size,failAccounts?101:102);
  assert.equal(result.displayPrices.state,'UPDATED');assert.equal(result.displayPrices.published,30);
  assert.equal(saved.prepare("SELECT count(*) AS n FROM broker_observation WHERE kind='TCBS_MARKET_PRICE'").get().n,30);
  const exact=saved.prepare("SELECT body FROM broker_observation WHERE kind='TCBS_API_RESPONSE' AND api_id='5.3'").get();assert.ok(JSON.parse(exact.body).raw.includes('1234567890123456789.123456789'));
  const pages=result.requests.filter(r=>r.apiId==='4.16');assert.equal(pages.length,failAccounts?1:2);
  assert.ok(pages.every(p=>p.parameters.fromDate==='2026-10-01'&&p.parameters.toDate==='2026-10-20'));
  assert.equal(result.marketCore.requests.length,61);saved.close();
  assert.deepEqual(result.websocket.missingSymbols,[]);assert.ok(!JSON.stringify(result).includes(token));
 }finally{
  process.exitCode=0;
  if(oldKey===undefined)delete process.env.TCBS_API_KEY;else process.env.TCBS_API_KEY=oldKey;
  if(oldCustody===undefined)delete process.env.TCBS_CUSTODY_CODE;else process.env.TCBS_CUSTODY_CODE=oldCustody;
  rmSync(root,{recursive:true,force:true});
 }
});
test('cash pagination refuses unknown totals, wrong pages and unconfirmed schema',()=>{
 for(const response of [{data:[]},{totalCount:1,pageIndex:2,pageSize:25,data:[]},{totalCount:1,pageIndex:1,pageSize:25,data:null}]){
  assert.throws(()=>cashStatementPage(Buffer.from(JSON.stringify({response})),1),/UNCONFIRMED/);
 }
});
