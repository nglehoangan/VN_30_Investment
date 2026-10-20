/** Bounded read-only market-documentation verification. Cached auth only, no account endpoints. */
import { statSync,mkdirSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getTokenSession,invalidateTokenSession } from './token-session.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const config=path.join(root,'api/.env.local');if(statSync(config).mode&0o077)throw Error('PRIVATE_CONFIGURATION_REQUIRED');process.loadEnvFile(config);
const sessionFolder=path.join(root,'data/tcbs-session');let token;
const folder=path.join(root,'data/market-source/tcbs',new Date().toISOString().replaceAll(':','-')+'-5x-review');mkdirSync(folder,{recursive:true,mode:0o700});
const report={version:'tcbs-5x-bounded-review-v1',startedAt:new Date().toISOString(),ticker:'TCB',purpose:'READ_ONLY_SOURCE_ASSESSMENT_NOT_ADMISSION',capability:'NOT_QUALIFIED',requests:[],excluded:{'5.9':'PRIVATE_ACCOUNT_ORDER_STREAM_NOT_MARKET_SOURCE'},previousSample:'data/market-source/tcbs/2026-10-20T00-48-00.793Z/manifest.json'};
const end=String(Math.floor(Date.now()/1000));
const specs=[
 ['5.1','/tartarus/v1/tickerCommons',{tickers:'TCB'}],
 ['5.3','/tartarus/v1/tickerSnaps',{index:'2'}],
 ['5.4','/tartarus/v1/putThroughSnaps',{floor:'1'}],
 ['5.6','/nyx/v1/intraday/TCB/bsa-ext',{timeWindow:'15',tWindow:'15',type:'all'}],
 ['5.7','/nyx/v1/intraday/TCB/bsa',{type:'all'}],
 ['5.8','/nyx/v1/intraday/TCB/bsa-month',{timeWindow:'1M',type:'all'}],
 ['5.11','/ananke/v1/securities',{fields:'all',filter:'symbol=TCB'}],
 ['5.12','/nyx/v2/stock/bars',{ticker:'TCB',type:'stock',resolution:'60',to:end,countBack:'5'}],
 ['5.13','/nyx/v2/stock/bars-long-term',{ticker:'TCB',type:'stock',resolution:'D',to:end,countBack:'5'}],
];
try{
 token=(await getTokenSession({folder:sessionFolder,key:process.env.TCBS_API_KEY,custody:process.env.TCBS_CUSTODY_CODE,request:async()=>{throw Error('NO_AUTH_CALL_ALLOWED');},readOtp:async()=>{throw Error('TOKEN_CACHE_UNAVAILABLE_OR_EXPIRED');}})).token;
 for(const[id,pathname,parameters]of specs){
  const url=new URL(pathname,'https://openapi.tcbs.com.vn');for(const[k,v]of Object.entries(parameters))url.searchParams.set(k,v);
  const startedAt=new Date().toISOString();
  try{
   const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}});
   const row={apiId:id,method:'GET',url:new URL(pathname,'https://openapi.tcbs.com.vn').href,parameters,startedAt,retrievedAt:new Date().toISOString(),httpStatus:r.status,providerHttpDate:r.headers.get('date')};
   if(r.ok){const chunks=[];let size=0;for await(const part of r.body){size+=part.length;if(size>4_000_000)throw Error('PAYLOAD_LIMIT');chunks.push(part);}const raw=Buffer.concat(chunks);row.rawPath=id+'.raw.json';row.sha256=createHash('sha256').update(raw).digest('hex');writeFileSync(path.join(folder,row.rawPath),raw,{mode:0o600,flag:'wx'});row.retrievedAt=new Date().toISOString();let d;try{d=JSON.parse(raw);}catch{d=null;}row.state=d?'CAPTURED_SCHEMA_UNREVIEWED':'CAPTURED_NON_JSON';row.topLevelKeys=d&&typeof d==='object'?Object.keys(d):[];}
   else row.state='HTTP_ERROR';
   report.requests.push(row);console.log(JSON.stringify({apiId:id,httpStatus:r.status,state:row.state}));
   if([401,429].includes(r.status)){if(r.status===401)invalidateTokenSession(sessionFolder);throw Error('SESSION_STOPPED_HTTP_'+r.status);}
  }catch(error){if(error.message.startsWith('SESSION_STOPPED_'))throw error;report.requests.push({apiId:id,startedAt,state:'NETWORK_TIMEOUT_OR_PAYLOAD_LIMIT'});console.log(JSON.stringify({apiId:id,state:'NETWORK_TIMEOUT_OR_PAYLOAD_LIMIT'}));}
 }
 report.state=report.requests.every(r=>r.state==='CAPTURED_SCHEMA_UNREVIEWED')?'COMPLETED_NOT_QUALIFIED':'PARTIAL_CAPTURE_NOT_QUALIFIED';
}catch(error){report.state=/^(TOKEN_|AUTH_|SESSION_STOPPED_)/.test(error.message)?error.message:'BLOCKED';process.exitCode=1;}
finally{token=undefined;report.finishedAt=new Date().toISOString();writeFileSync(path.join(folder,'manifest.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});console.log(JSON.stringify({state:report.state,manifest:path.relative(root,path.join(folder,'manifest.json'))}));}
