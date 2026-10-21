import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {main,cashStatementPage} from './tcbs.mjs';

test('one OTP/token fetches accounts, two cash pages, full30 EOD, history, index and WSS together',async()=>{
 const root=mkdtempSync(path.join(tmpdir(),'tcbs-unified-'));
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
  await main(['--seconds=1','--from=2026-10-01','--to=2026-10-20'],{root,getIntervalMs:0,WebSocket:Socket,
   readOtp:async()=>{otpReads++;return '123456';},
   fetch:async(url,init)=>{
    calls.push({url:new URL(url),init});
    if(init.method==='POST')return Response.json({token});
    assert.equal(init.headers.Authorization,'Bearer '+token);
    if(url.pathname.startsWith('/eros/'))return Response.json({basicInfo:{code105C:custody},bankSubAccounts:[{accountType:'NORMAL',status:'1',accountNo:'normal'},{accountType:'MARGIN',status:'1',accountNo:'margin'}]});
    if(url.pathname.includes('cashStatements')){
     const page=Number(url.searchParams.get('pageIndex'));
     return Response.json({response:{pageIndex:page,pageSize:25,totalCount:26,data:Array.from({length:page===1?25:1},()=>({debitAmount:'1234567890123456789.123'}))}});
    }
    return new Response('{"value":1234567890123456789.123456789}',{headers:{'content-type':'application/json'}});
   }});
  assert.equal(otpReads,1);assert.equal(calls.filter(c=>c.init.method==='POST').length,1);
  assert.equal(calls.filter(c=>c.url.pathname.startsWith('/eros/')).length,1);
  const folder=path.join(root,'data/market-source/tcbs',readdirSync(path.join(root,'data/market-source/tcbs'))[0]);
  const result=JSON.parse(readFileSync(path.join(folder,'capture.json'),'utf8'));
  assert.equal(result.state,'CAPTURED_NOT_QUALIFIED');assert.equal(result.requests.length,102);
  assert.equal(result.scope.accounts,true);assert.equal(result.cashHistory.complete,true);assert.equal(result.cashHistory.receivedRows,26);
  assert.ok(result.requests.some(r=>r.apiId==='4.7'));
  assert.equal(new Set(result.requests.map(r=>r.rawPath)).size,102);
  assert.ok(result.requests.filter(r=>r.apiId==='5.13').every(r=>r.raw.includes('1234567890123456789.123456789')));
  const pages=result.requests.filter(r=>r.apiId==='4.16');assert.equal(pages.length,2);
  assert.ok(pages.every(p=>p.parameters.fromDate==='2026-10-01'&&p.parameters.toDate==='2026-10-20'));
  assert.equal(JSON.parse(readFileSync(path.join(folder,'manifest.json'),'utf8')).requests.length,61);
  assert.deepEqual(result.websocket.missingSymbols,[]);assert.ok(!JSON.stringify(result).includes(token));
 }finally{
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
