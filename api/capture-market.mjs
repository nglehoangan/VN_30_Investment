import { statSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getTokenSession, invalidateTokenSession } from './token-session.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
/** Only provider market data frames are retained. Auth/JWT/control messages are excluded. */
export function marketFrame(text){
 if(typeof text!=='string'||!text.startsWith('s|'))return null;
 const match=/^s\|(\d+)\|([\s\S]+)$/.exec(text);if(!match)throw Error('UNCONFIRMED_MARKET_FRAME');
 const payload=JSON.parse(match[2]);return {channel:match[1],payload};
}
async function captureBoard(token,ticker){
 return new Promise((resolve,reject)=>{
  const ws=new WebSocket('wss://openapi.tcbs.com.vn/ws/thesis/v1/stream/normal');let heartbeat,done=false;
  const timer=setTimeout(()=>finish(Error('WEBSOCKET_TIMEOUT')),20000);
  function finish(error,bytes){if(done)return;done=true;clearTimeout(timer);clearInterval(heartbeat);ws.close();if(error)reject(error);else resolve(bytes);}
  ws.addEventListener('open',()=>{ws.send('d|a|||'+Buffer.from(token).toString('base64'));heartbeat=setInterval(()=>{if(ws.readyState===1)ws.send('d|p|||');},2000);});
  ws.addEventListener('error',()=>finish(Error('WEBSOCKET_NETWORK_ERROR')));
  ws.addEventListener('close',()=>{if(!done)finish(Error('WEBSOCKET_CLOSED_BEFORE_SNAPSHOT'));});
  ws.addEventListener('message',event=>{
   try{
    if(typeof event.data!=='string'||Buffer.byteLength(event.data)>4_000_000)throw Error('WEBSOCKET_PAYLOAD_LIMIT');
    const text=event.data;
    if(text.startsWith('d|0|')){const auth=JSON.parse(text.slice(4));if(auth.success!==true)return finish(Error('WEBSOCKET_AUTH_REJECTED'));ws.send('d|r|tk||'+ticker);return;}
    const frame=marketFrame(text);if(frame?.channel==='38')finish(null,Buffer.from(text));
   }catch{finish(Error('WEBSOCKET_SCHEMA_UNCONFIRMED'));}
  });
 });
}
export async function main(args=process.argv.slice(2)){
 if(args.includes('--help')){console.log('node api/capture-market.mjs [--authenticate] [--ticker=TCB]\nDefault: cached token only. --authenticate asks Smart OTP locally via hidden terminal. Captures bounded5.1+5.5 REST and5.2 one-shot WSS; no account/ledger/scoring calls.');return;}
 const ticker=args.find(a=>a.startsWith('--ticker='))?.slice(9)??'TCB';if(!/^[A-Z]{3}$/.test(ticker))throw Error('INVALID_TICKER');
 const file=path.join(root,'api/.env.local');if(statSync(file).mode&0o077)throw Error('PRIVATE_CREDENTIAL_FILE_REQUIRED');process.loadEnvFile(file);
 const key=process.env.TCBS_API_KEY,custody=process.env.TCBS_CUSTODY_CODE;if(!key||!custody)throw Error('LOCAL_CONFIGURATION_MISSING');
 const sessionFolder=path.join(root,'data/tcbs-session');let token;
 const folder=path.join(root,'data/market-source/tcbs',new Date().toISOString().replaceAll(':','-'));mkdirSync(folder,{recursive:true,mode:0o700});
 const manifest={version:'tcbs-market-capture-v1',ticker,startedAt:new Date().toISOString(),purpose:'BOUNDED_CAPABILITY_SOURCE_CANDIDATE',capability:'NOT_QUALIFIED',requests:[]};
 async function request(method,pathname,params,body){
  const url=new URL(pathname,'https://openapi.tcbs.com.vn');for(const[k,v]of Object.entries(params??{}))url.searchParams.set(k,v);
  const r=await fetch(url,{method,redirect:'error',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(method==='POST'){let data;try{data=await r.json();}catch{data=null;}return {ok:r.ok,status:r.status,data,retryAfterMs:/^\d+$/.test(r.headers.get('retry-after')??'')?Number(r.headers.get('retry-after'))*1000:undefined};}
  const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length>4_000_000)throw Error('REST_PAYLOAD_LIMIT');return {response:r,bytes};
 }
 try{
  const session=await getTokenSession({folder:sessionFolder,key,custody,request,readOtp:async()=>{
   if(!args.includes('--authenticate'))throw Error('TOKEN_CACHE_UNAVAILABLE_OR_EXPIRED');
   const prompt=spawnSync('python3',['-c','import getpass; print(getpass.getpass("TCInvest Smart OTP (hidden): "))'],{stdio:['inherit','pipe','inherit'],encoding:'utf8'});
   if(prompt.status!==0)throw Error('OTP_INPUT_UNAVAILABLE');return prompt.stdout.trim();
  }});token=session.token;
  for(const[id,pathname,params]of [['5.1','/tartarus/v1/tickerCommons',{tickers:ticker}],['5.5',`/nyx/v1/intraday/${ticker}/his/paging`,{page:'0',size:'20'}]]){
   const startedAt=new Date().toISOString(),{response,bytes}=await request('GET',pathname,params);
   const row={apiId:id,method:'GET',url:new URL(pathname,'https://openapi.tcbs.com.vn').href,parameters:params,startedAt,retrievedAt:new Date().toISOString(),httpStatus:response.status,providerDate:response.headers.get('date'),rawPath:null,sha256:null};
   if(response.ok){const name=id+'.raw.json';writeFileSync(path.join(folder,name),bytes,{mode:0o600,flag:'wx'});row.rawPath=name;row.sha256=digest(bytes);}
   manifest.requests.push(row);console.log(JSON.stringify({apiId:id,httpStatus:response.status,rawRetained:response.ok}));
   if(!response.ok){if(response.status===401)invalidateTokenSession(sessionFolder);throw Error('MARKET_HTTP_'+response.status);}
  }
  const startedAt=new Date().toISOString();
  try{const bytes=await captureBoard(token,ticker),name='5.2.raw.txt';writeFileSync(path.join(folder,name),bytes,{mode:0o600,flag:'wx'});manifest.requests.push({apiId:'5.2',method:'WSS_ONE_SHOT',url:'wss://openapi.tcbs.com.vn/ws/thesis/v1/stream/normal',request:'d|r|tk||'+ticker,startedAt,retrievedAt:new Date().toISOString(),rawPath:name,sha256:digest(bytes),channel:'38'});console.log(JSON.stringify({apiId:'5.2',state:'CAPTURED_NOT_QUALIFIED'}));}
  catch{manifest.requests.push({apiId:'5.2',state:'BLOCKED_WEBSOCKET_CAPTURE',startedAt});process.exitCode=1;}
  manifest.state=process.exitCode?'PARTIAL_CAPTURE':'CAPTURED_NOT_QUALIFIED';
 }catch(error){
  const safe=/^(TOKEN_|AUTH_|OTP_|SIX_DIGIT_|PRIVATE_SESSION_|MARKET_HTTP_)/.test(error.message)?error.message:'NETWORK_OR_CAPTURE_ERROR';manifest.state=safe;console.log(JSON.stringify({state:safe}));process.exitCode=1;
 }finally{token=undefined;manifest.finishedAt=new Date().toISOString();writeFileSync(path.join(folder,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{mode:0o600,flag:'wx'});console.log(JSON.stringify({manifest:path.relative(root,path.join(folder,'manifest.json')),capability:'NOT_QUALIFIED'}));}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
