/** Explicit bounded refresh of public market metadata/bars for the retained30. No account APIs or auto-auth. */
import { readFileSync,statSync,mkdirSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getTokenSession,invalidateTokenSession } from './token-session.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const releasePath='docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json';
const releaseBytes=readFileSync(path.join(root,releasePath)),release=JSON.parse(releaseBytes),members=release.partition.members;
if(members.length!==30||new Set(members.map(m=>m.ticker)).size!==30)throw Error('CERTIFIED_FULL30_REQUIRED');
const credentials=path.join(root,'api/.env.local');if(statSync(credentials).mode&0o077)throw Error('PRIVATE_CONFIGURATION_REQUIRED');process.loadEnvFile(credentials);
const folder=path.join(root,'data/market-source/tcbs',new Date().toISOString().replaceAll(':','-')+'-vn30');mkdirSync(folder,{recursive:true,mode:0o700});
const report={version:'tcbs-vn30-source-capture-v2',createdAt:new Date().toISOString(),universe:{path:releasePath,sha256:createHash('sha256').update(releaseBytes).digest('hex')},purpose:'BOUNDED_VN30_IDENTITY_AND_LATEST_DAILY_BAR_CANDIDATE',requests:[],state:'STARTED'};
const sessionFolder=path.join(root,'data/tcbs-session'),deadline=AbortSignal.timeout(150000);let token;
async function readBounded(response){const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>4_000_000)throw Error('PAYLOAD_LIMIT');chunks.push(chunk);}return Buffer.concat(chunks);}
try{
 token=(await getTokenSession({folder:sessionFolder,key:process.env.TCBS_API_KEY,custody:process.env.TCBS_CUSTODY_CODE,request:async()=>{throw Error('AUTH_NOT_ALLOWED');},readOtp:async()=>{throw Error('TOKEN_CACHE_UNAVAILABLE_OR_EXPIRED');}})).token;
 const boardUrl='https://openapi.tcbs.com.vn/tartarus/v1/tickerSnaps';
 const boardRow={apiId:'5.3',method:'GET',url:boardUrl,parameters:{index:'2'},startedAt:new Date().toISOString()};report.requests.push(boardRow);
 const boardResponse=await fetch(boardUrl+'?index=2',{redirect:'error',signal:AbortSignal.any([AbortSignal.timeout(20000),deadline]),headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}});
 boardRow.httpStatus=boardResponse.status;boardRow.providerAt=boardResponse.headers.get('date');
 if(!boardResponse.ok){boardRow.retrievedAt=new Date().toISOString();if(boardResponse.status===401)invalidateTokenSession(sessionFolder);throw Error('HTTP_'+boardResponse.status);}
 const boardBytes=await readBounded(boardResponse);
 Object.assign(boardRow,{retrievedAt:new Date().toISOString(),rawPath:'5.3.raw.json',sha256:createHash('sha256').update(boardBytes).digest('hex')});
 writeFileSync(path.join(folder,boardRow.rawPath),boardBytes,{mode:0o600,flag:'wx'});
 const to=String(Math.floor(Date.now()/1000));
 for(const m of members){for(const[apiId,pathname,parameters]of [['5.11','/ananke/v1/securities',{fields:'all',filter:'symbol='+m.ticker}],['5.13','/nyx/v2/stock/bars-long-term',{ticker:m.ticker,type:'stock',resolution:'D',to,countBack:'2'}]]){
  const url=new URL(pathname,'https://openapi.tcbs.com.vn');for(const[k,v]of Object.entries(parameters))url.searchParams.set(k,v);
  const row={apiId,ticker:m.ticker,securityId:m.securityId,method:'GET',url:new URL(pathname,'https://openapi.tcbs.com.vn').href,parameters,startedAt:new Date().toISOString()};report.requests.push(row);
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.any([AbortSignal.timeout(20000),deadline]),headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}});row.httpStatus=response.status;row.providerAt=response.headers.get('date');
  if(!response.ok){row.retrievedAt=new Date().toISOString();if(response.status===401)invalidateTokenSession(sessionFolder);throw Error('HTTP_'+response.status);}
  const bytes=await readBounded(response);
  row.retrievedAt=new Date().toISOString();row.rawPath=apiId+'-'+m.ticker+'.raw.json';row.sha256=createHash('sha256').update(bytes).digest('hex');writeFileSync(path.join(folder,row.rawPath),bytes,{mode:0o600,flag:'wx'});
 }console.log(JSON.stringify({ticker:m.ticker,captured:['5.11','5.13']}));}
 report.state='CAPTURED_NOT_QUALIFIED';
}catch(error){report.state=/^(TOKEN_|AUTH_|HTTP_|PAYLOAD_)/.test(error.message)?error.message:'NETWORK_OR_CAPTURE_FAILURE';process.exitCode=1;}
finally{token=undefined;report.finishedAt=new Date().toISOString();writeFileSync(path.join(folder,'manifest.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});console.log(JSON.stringify({state:report.state,manifest:path.relative(root,path.join(folder,'manifest.json')),requests:report.requests.length}));}
