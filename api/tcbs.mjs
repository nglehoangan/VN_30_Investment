/** Single TCBS entry point: one private OTP/session, bounded REST + 5.2 WSS capture. Node 22.23.2. */
import {mkdirSync,readFileSync,writeFileSync,statSync,openSync,closeSync,unlinkSync,renameSync,existsSync} from 'node:fs';
import {createHash,createHmac} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
export function requireSupportedNode(version=process.versions.node){
 const [major,minor,patch]=version.split('.').map(Number);
 if(major!==22||minor<23||(minor===23&&patch<2))throw Error(`UNSUPPORTED_NODE_VERSION: Node ${version}; can Node >=22.23.2 <23 (xem .nvmrc). Chuyen phien ban Node truoc khi chay lai; chua goi API hoac ghi DB.`);
}
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export const WS_URL='wss://openapi.tcbs.com.vn/ws/thesis/v1/stream/normal';
/** Private session cache. Token is never returned in log/report; no automatic re-authentication. */
export async function getTokenSession({ folder, key, custody, request, readOtp, now = () => Date.now() }) {
  mkdirSync(folder,{recursive:true,mode:0o700});
  if (statSync(folder).mode & 0o077) throw new Error('PRIVATE_SESSION_DIRECTORY_REQUIRED');
  const file=path.join(folder,'session.json'), lock=path.join(folder,'session.lock');
  let fd;
  try { fd=openSync(lock,'wx',0o600); } catch { throw new Error('AUTH_SESSION_BUSY'); }
  try {
    const binding=createHash('sha256').update(key+'\0'+custody).digest('hex');
    let cached={};
    try {
      if (statSync(file).mode & 0o077) throw new Error('PRIVATE_SESSION_FILE_REQUIRED');
      cached=JSON.parse(readFileSync(file,'utf8'));
    } catch(e) { if(e.code!=='ENOENT')throw e; }
    if (cached.binding===binding && cached.retryAfter>now()) throw new Error('AUTH_RATE_LIMIT_COOLDOWN');
    if (cached.binding===binding && typeof cached.token==='string' && cached.expiresAt>now()+60000)
      return { token:cached.token, reused:true };
    const otp=await readOtp();
    if(!/^\d{6}$/.test(otp))throw new Error('SIX_DIGIT_SMART_OTP_REQUIRED');
    const otpIdentity=createHmac('sha256',key).update(otp).digest('hex');
    if(cached.binding===binding && cached.otpIdentity===otpIdentity)throw new Error('OTP_ALREADY_ATTEMPTED');
    const state={binding,otpIdentity,attemptedAt:now()};
    const save=value=>{
      const temp=file+'.tmp';
      writeFileSync(temp,JSON.stringify(value)+'\n',{mode:0o600});renameSync(temp,file);
    };
    // Record before sending, so timeouts and concurrent invocations cannot replay this OTP.
    save(state);
    const auth=await request('POST','/gaia/v1/oauth2/openapi/token',{}, {apiKey:key,otp});
    if(auth.status===429){
      save({...state,retryAfter:now()+Math.max(60000,auth.retryAfterMs??60000)});
      throw new Error('AUTH_RATE_LIMITED_429');
    }
    if(!auth.ok||typeof auth.data?.token!=='string')throw new Error(`AUTH_FAILED_HTTP_${auth.status}`);
    let claims;
    try { claims=JSON.parse(Buffer.from(auth.data.token.split('.')[1],'base64url').toString()); }
    catch { throw new Error('AUTH_TOKEN_FORMAT_UNCONFIRMED'); }
    if(claims.custodyID!==custody)throw new Error('TOKEN_CUSTODY_MISMATCH');
    if(!Number.isFinite(claims.exp)||claims.exp*1000<=now()+60000)throw new Error('TOKEN_EXPIRATION_UNCONFIRMED');
    save({...state,token:auth.data.token,expiresAt:claims.exp*1000});
    return {token:auth.data.token,reused:false};
  } finally { closeSync(fd);unlinkSync(lock); }
}
export function invalidateTokenSession(folder) {
  const file=path.join(folder,'session.json');
  try { const state=JSON.parse(readFileSync(file,'utf8'));delete state.token;delete state.expiresAt;writeFileSync(file,JSON.stringify(state)+'\n',{mode:0o600}); }
  catch(e){if(e.code!=='ENOENT')throw e;}
}

export function rateLimitSession(folder,retryAfterMs=60000,now=Date.now()){
 const lock=path.join(folder,'session.lock'),file=path.join(folder,'session.json');
 const fd=openSync(lock,'wx',0o600);
 try{
  if(statSync(file).mode&0o077)throw Error('PRIVATE_SESSION_FILE_REQUIRED');
  const state=JSON.parse(readFileSync(file,'utf8'));
  state.retryAfter=Math.max(state.retryAfter??0,now+Math.max(60000,retryAfterMs));
  const temp=file+'.tmp';writeFileSync(temp,JSON.stringify(state)+'\n',{mode:0o600});renameSync(temp,file);
 }finally{closeSync(fd);unlinkSync(lock);}
}

/** Resolve a sub-account from API 2.1 for this request. Never persist account numbers. */
export async function resolveSubAccount(request, custody, type = 'NORMAL') {
  if (!['NORMAL', 'MARGIN', 'DERIVATIVE'].includes(type)) throw new Error('INVALID_ACCOUNT_TYPE');
  const profile = await request('GET', `/eros/v2/get-profile/by-username/${encodeURIComponent(custody)}`,
    { fields: 'basicInfo,bankSubAccounts' });
  if (!profile.ok) throw new Error('PROFILE_HTTP_ERROR');
  const identity = profile.data?.basicInfo?.code105C ?? profile.data?.basicInfo?.custodyCode;
  if (identity !== custody) throw new Error('PROFILE_CUSTODY_MISMATCH');
  const accounts = profile.data?.bankSubAccounts;
  if (!Array.isArray(accounts)) throw new Error('PROFILE_SCHEMA_UNCONFIRMED');
  const matches = accounts.filter(a => a.accountType === type && a.status === '1' &&
    typeof a.accountNo === 'string' && a.accountNo.trim() === a.accountNo && a.accountNo.length > 0);
  if (matches.length !== 1) throw new Error(matches.length ? 'AMBIGUOUS_SUB_ACCOUNT' : 'ACTIVE_SUB_ACCOUNT_NOT_FOUND');
  return matches[0].accountNo;
}

/** Parse only provider data frames. Retain original text separately to preserve decimal tokens. */
export function marketFrame(text){
 if(typeof text!=='string'||!text.startsWith('s|'))return null;
 const match=/^s\|(\d+)\|([\s\S]+)$/.exec(text);
 if(!match)throw Error('UNCONFIRMED_MARKET_FRAME');
 return {channel:match[1],payload:JSON.parse(match[2])};
}

/** Native Node WebSocket sends no automatic periodic ping; only TCBS application heartbeats. */
export function captureBoard(token,symbols,{WebSocketImpl=globalThis.WebSocket,durationMs=30000,authTimeoutMs=5000,maxFrames=3000}={}){
 return new Promise((resolve,reject)=>{
  const ws=new WebSocketImpl(WS_URL),frames=[],requested=new Set(symbols);
  let heartbeat,timer,done=false,authenticated=false,totalBytes=0;
  const finish=(error,completion)=>{
   if(done)return;done=true;clearTimeout(timer);clearInterval(heartbeat);
   try{ws.close();}catch{/* Already closed. */}
   const result={state:error?'PARTIAL_CAPTURE':frames.length?'CAPTURED_NOT_QUALIFIED':'NO_MARKET_FRAMES',
    completion:error?.message??completion,frames,missingSymbols:symbols.filter(s=>!frames.some(f=>f.symbols.includes(s)))};
   if(error){error.capture=result;reject(error);}else resolve(result);
  };
  timer=setTimeout(()=>finish(Error('WEBSOCKET_AUTH_TIMEOUT')),authTimeoutMs);
  ws.addEventListener('open',()=>{if(!done)ws.send('d|a|||'+Buffer.from(token).toString('base64'));});
  ws.addEventListener('error',()=>finish(Error('WEBSOCKET_NETWORK_ERROR')));
  ws.addEventListener('close',()=>{if(!done)finish(Error('WEBSOCKET_CLOSED_BEFORE_COMPLETION'));});
  ws.addEventListener('message',event=>{
   if(done)return;
   try{
    if(typeof event.data!=='string'||Buffer.byteLength(event.data)>4_000_000)throw Error('WEBSOCKET_PAYLOAD_LIMIT');
    const text=event.data;
    if(text.startsWith('d|0|')&&!authenticated){
     if(JSON.parse(text.slice(4)).success!==true)throw Error('WEBSOCKET_AUTH_REJECTED');
     authenticated=true;clearTimeout(timer);
     ws.send('d|s|tk|bp+bi+tm+mp+op+fe|'+symbols.join(','));
     ws.send('d|p|||');
     heartbeat=setInterval(()=>{try{if(ws.readyState===1)ws.send('d|p|||');}catch{finish(Error('WEBSOCKET_HEARTBEAT_FAILED'));}},2000);
     timer=setTimeout(()=>finish(null,'WINDOW_COMPLETE'),durationMs);return;
    }
    if(text.startsWith('d|'))return;
    const frame=marketFrame(text);
    if(!frame)return;
    if(!authenticated)throw Error('WEBSOCKET_DATA_BEFORE_AUTH');
    const payloads=Array.isArray(frame.payload)?frame.payload:Array.isArray(frame.payload?.data)?frame.payload.data:[frame.payload];
    const frameSymbols=[...new Set(payloads.map(p=>p?.symbol).filter(s=>requested.has(s)))];
    if(!frameSymbols.length)throw Error('WEBSOCKET_SYMBOL_UNCONFIRMED');
    totalBytes+=Buffer.byteLength(text);
    if(totalBytes>16_000_000)throw Error('WEBSOCKET_TOTAL_PAYLOAD_LIMIT');
    // Raw frame text is authoritative; JSON.parse above is used for identity checks only.
    frames.push({channel:frame.channel,symbol:frameSymbols.length===1?frameSymbols[0]:null,symbols:frameSymbols,receivedAt:new Date().toISOString(),raw:text,sha256:digest(text)});
    if(frames.length>=maxFrames)finish(null,'FRAME_LIMIT_REACHED');
   }catch(error){finish(Error(/^WEBSOCKET_/.test(error.message)?error.message:'WEBSOCKET_SCHEMA_UNCONFIRMED'));}
  });
 });
}

export function marketRequests(members,to,{extended=false,historyBars=252}={}){
 const core=[{apiId:'5.3',pathname:'/tartarus/v1/tickerSnaps',parameters:{index:'2'}}];
 for(const m of members){
  core.push({apiId:'5.11',...m,pathname:'/ananke/v1/securities',parameters:{fields:'all',filter:'symbol='+m.ticker}});
  core.push({apiId:'5.13',...m,pathname:'/nyx/v2/stock/bars-long-term',parameters:{ticker:m.ticker,type:'stock',resolution:'D',to,countBack:'2'}});
 }
 const extra=[{apiId:'5.1',pathname:'/tartarus/v1/tickerCommons',parameters:{tickers:members.map(m=>m.ticker).join(',')}},
  {apiId:'5.13',ticker:'VN30',variant:'benchmark',pathname:'/nyx/v2/stock/bars-long-term',parameters:{ticker:'VN30',type:'index',resolution:'D',to,countBack:String(historyBars)}}];
 for(const m of members)extra.push({apiId:'5.13',...m,variant:'history',pathname:'/nyx/v2/stock/bars-long-term',parameters:{ticker:m.ticker,type:'stock',resolution:'D',to,countBack:String(historyBars)}});
 if(extended)extra.push({apiId:'5.4',pathname:'/tartarus/v1/putThroughSnaps',parameters:{floor:'1'}});
 if(extended)for(const m of members)for(const [apiId,pathname,parameters]of [
  ['5.5',`/nyx/v1/intraday/${m.ticker}/his/paging`,{page:'0',size:'20'}],
  ['5.6',`/nyx/v1/intraday/${m.ticker}/bsa-ext`,{timeWindow:'15',tWindow:'15',type:'all'}],
  ['5.7',`/nyx/v1/intraday/${m.ticker}/bsa`,{type:'all'}],
  ['5.8',`/nyx/v1/intraday/${m.ticker}/bsa-month`,{timeWindow:'1M',type:'all'}],
  ['5.12','/nyx/v2/stock/bars',{ticker:m.ticker,type:'stock',resolution:'60',to,countBack:'5'}],
 ])extra.push({apiId,...m,pathname,parameters});
 return {core,extra};
}

// Live contract verified 2026-10-29: 4.16 acctno and 4.17 todate differ from published docs.
export function accountRequests(today,from=today,to=today){
 return [
  ['4.14','NORMAL',a=>`/aion/v1/accounts/${encodeURIComponent(a)}/se`,()=>({})],
  ['4.15','NORMAL',a=>`/aion/v1/accounts/${encodeURIComponent(a)}/cashInvestments`,()=>({})],
  ['4.16','NORMAL',()=>'/erebos/v2/digital/trans-hist-cashStatements',a=>({acctno:a,fromDate:from,toDate:to,pageSize:'25',pageIndex:'1'})],
  ['4.6','NORMAL',a=>`/aion/v1/accounts/${encodeURIComponent(a)}/matching-details`,()=>({})],
  ['4.4','NORMAL',a=>`/aion/v1/accounts/${encodeURIComponent(a)}/orders`,()=>({})],
  ['4.7','NORMAL',a=>`/aion/v1/accounts/${encodeURIComponent(a)}/ppse`,()=>({})],
  ['4.17','MARGIN',()=>'/erebos/v2/digital/margin-info',a=>({acctno:a,custodycd:null,fromdate:from,todate:to,page:'1',size:'25'})],
 ];
}

/** Only pagination metadata is used; financial tokens stay authoritative in the raw response. */
export function cashStatementPage(bytes,page){
 let response;
 try{response=JSON.parse(bytes.toString('utf8')).response;}catch{throw Error('CASH_STATEMENT_SCHEMA_UNCONFIRMED');}
 if(!response||!Number.isSafeInteger(response.totalCount)||response.totalCount<0||!Number.isSafeInteger(response.pageIndex)||response.pageIndex!==page||response.pageSize!==25||!Array.isArray(response.data)||response.data.length>25)throw Error('CASH_STATEMENT_PAGINATION_UNCONFIRMED');
 return {totalCount:response.totalCount,rows:response.data.length};
}

export async function main(args=process.argv.slice(2),dependencies={}){
 const projectRoot=dependencies.root??root,fetchImpl=dependencies.fetch??globalThis.fetch;
 const getInterval=dependencies.getIntervalMs??1000;
 if(args.includes('--help')){
  console.log('node api/tcbs.mjs [--cached-token-only] [--symbols=FPT,VNM,HPG] [--seconds=30] [--market-only] [--extended-market] [--history-bars=252] [--from=YYYY-MM-DD] [--to=YYYY-MM-DD]\nDefault: accounts + essential VN30 market/history + 5.2 in ONE session. --accounts is a legacy alias for the default. Cash statements paginate up to 25 pages; direct API data and display-price writes to SQLite; no ledger/scoring writes.');return;
 }
 requireSupportedNode();
 // Check the runtime before loading node:sqlite, unavailable by default on older Node.
 const {openDirectData,directDatabasePath}=await import('./direct-data.mjs');
 if(args.some(a=>!['--cached-token-only','--accounts','--market-only','--extended-market'].includes(a)&&!['--symbols=','--seconds=','--history-bars=','--from=','--to='].some(prefix=>a.startsWith(prefix))))throw Error('UNKNOWN_ARGUMENT');
 if(args.includes('--accounts')&&args.includes('--market-only'))throw Error('CONFLICTING_ACCOUNT_OPTIONS');
 const value=name=>args.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
 const historyBars=Number(value('history-bars')??252);
 if(!Number.isInteger(historyBars)||historyBars<2||historyBars>1000)throw Error('HISTORY_BARS_MUST_BE_2_TO_1000');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const from=value('from')??today,to=value('to')??today;
 const validDate=d=>/^\d{4}-\d\d-\d\d$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
 if(!validDate(from)||!validDate(to)||from>to||to>today)throw Error('INVALID_HISTORY_DATE_RANGE');
 const seconds=Number(args.find(a=>a.startsWith('--seconds='))?.slice(10)??30);
 if(!Number.isInteger(seconds)||seconds<1||seconds>120)throw Error('SECONDS_MUST_BE_1_TO_120');
 const releasePath='docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json';
 const releaseBytes=readFileSync(path.join(projectRoot,releasePath)),all=JSON.parse(releaseBytes).partition.members;
 if(all.length!==30||new Set(all.map(m=>m.ticker)).size!==30)throw Error('CERTIFIED_FULL30_REQUIRED');
 const selection=args.find(a=>a.startsWith('--symbols='))?.slice(10).split(',');
 if(selection&&(!selection.length||new Set(selection).size!==selection.length||selection.some(s=>!all.some(m=>m.ticker===s))))throw Error('INVALID_UNIVERSE_SYMBOLS');
 const members=all.filter(m=>!selection||selection.includes(m.ticker)).map(({ticker,securityId})=>({ticker,securityId}));
 if(existsSync(path.join(projectRoot,'.env.local')))process.loadEnvFile(path.join(projectRoot,'.env.local'));
 const config=path.join(projectRoot,'api/.env.local');if(statSync(config).mode&0o077)throw Error('PRIVATE_CONFIGURATION_REQUIRED');process.loadEnvFile(config);
 const key=process.env.TCBS_API_KEY,custody=process.env.TCBS_CUSTODY_CODE;if(!key||!custody)throw Error('LOCAL_CONFIGURATION_MISSING');
 const databaseFile=directDatabasePath(projectRoot,dependencies.databaseFile?'file:'+dependencies.databaseFile:process.env.DATABASE_URL);
 const storage=openDirectData(databaseFile);
 const sessionFolder=path.join(projectRoot,'data/tcbs-session');let token,stopped=false,boardResult,lastGetAt=0;
 const report={version:'tcbs-unified-capture-v2',createdAt:new Date().toISOString(),scope:{accounts:!args.includes('--market-only'),extendedMarket:args.includes('--extended-market'),historyBars,from,to},universe:{path:releasePath,sha256:digest(releaseBytes)},symbols:members.map(m=>m.ticker),state:'STARTED',requests:[],issues:[]};
 const core={version:members.length===30?'tcbs-vn30-source-capture-v2':'tcbs-subset-source-capture-v1',createdAt:report.createdAt,universe:report.universe,state:'STARTED',requests:[]};
 const deadline=AbortSignal.timeout(360000);
 async function request(method,pathname,parameters={},body){
  if(stopped)throw Error('SESSION_STOPPED');
  // Space sequential GETs conservatively; provider 429 still stops without retry.
  if(method==='GET'){
   const pause=Math.max(0,getInterval-(Date.now()-lastGetAt));
   if(pause)await new Promise(resolve=>setTimeout(resolve,pause));
   if(stopped)throw Error('SESSION_STOPPED');lastGetAt=Date.now();
  }
  const url=new URL(pathname,'https://openapi.tcbs.com.vn');for(const[k,v]of Object.entries(parameters))url.searchParams.set(k,v);
  const response=await fetchImpl(url,{method,redirect:'error',signal:AbortSignal.any([deadline,AbortSignal.timeout(20000)]),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const chunks=[];let size=0;
  for await(const chunk of response.body){size+=chunk.length;if(size>4_000_000)throw Error('REST_PAYLOAD_LIMIT');chunks.push(chunk);}
  const bytes=Buffer.concat(chunks);let data;
  // Preserve raw numeric tokens in saved bytes. Parse only for auth/account routing.
  if(method==='POST'||pathname.startsWith('/eros/')){try{data=JSON.parse(bytes.toString('utf8'));}catch{data=null;}}
  const retryHeader=response.headers.get('retry-after');
  const retryAfterMs=/^\d+$/.test(retryHeader??'')?Number(retryHeader)*1000:Number.isFinite(Date.parse(retryHeader??''))?Math.max(0,Date.parse(retryHeader)-Date.now()):60000;
  if([401,429].includes(response.status)){
   stopped=true;
   if(response.status===401)invalidateTokenSession(sessionFolder);
   else if(method==='GET')rateLimitSession(sessionFolder,retryAfterMs);
  }
  return {response,bytes,data,ok:response.ok,status:response.status,retryAfterMs};
 }
 async function capture(spec,target){
  const {apiId,pathname,parameters,ticker,securityId,variant}=spec;
  const row={apiId,...(ticker?{ticker,securityId}:{}),...(variant?{variant}:{}),method:'GET',url:new URL(pathname,'https://openapi.tcbs.com.vn').href,parameters,startedAt:new Date().toISOString()};
  target?.requests.push(row);report.requests.push(row);
  try{
   const result=await request('GET',pathname,parameters);
   Object.assign(row,{httpStatus:result.status,retrievedAt:new Date().toISOString(),providerAt:result.response.headers.get('date')});
   Object.assign(row,storage.response(row,result.bytes));
   if(!result.ok){row.state='HTTP_'+result.status;throw Error(row.state);}
   row.state='CAPTURED_NOT_QUALIFIED';
   return result;
  }catch(error){row.state??='NETWORK_TIMEOUT_OR_PAYLOAD_ERROR';row.retrievedAt??=new Date().toISOString();throw error;}
 }
 let board;
 try{
  const session=await getTokenSession({folder:sessionFolder,key,custody,request,readOtp:async()=>{
   if(args.includes('--cached-token-only'))throw Error('TOKEN_CACHE_UNAVAILABLE_OR_EXPIRED');
   if(dependencies.readOtp)return dependencies.readOtp();
   if(!process.stdin.isTTY)throw Error('OTP_REQUIRES_LOCAL_TERMINAL');
   const prompt=spawnSync('python3',['-c','import getpass; print(getpass.getpass("TCInvest Smart OTP (hidden): "))'],{stdio:['inherit','pipe','inherit'],encoding:'utf8'});
   if(prompt.status!==0)throw Error('OTP_INPUT_UNAVAILABLE');return prompt.stdout.trim();
  }});token=session.token;
  console.log(JSON.stringify({authentication:session.reused?'REUSED_VALID_TOKEN':'AUTHENTICATED',symbols:members.length,accounts:report.scope.accounts}));
  // Attach rejection immediately; REST and bounded streaming use the same authenticated session.
  board=captureBoard(token,report.symbols,{durationMs:seconds*1000,WebSocketImpl:dependencies.WebSocket??globalThis.WebSocket}).then(r=>{boardResult=r;},e=>{boardResult=e.capture??{state:'PARTIAL_CAPTURE',completion:'WEBSOCKET_FAILURE',frames:[]};if(e.message==='WEBSOCKET_AUTH_REJECTED'){stopped=true;invalidateTokenSession(sessionFolder);}});
  if(report.scope.accounts){
   try{
   const profile=await capture({apiId:'2.1',pathname:'/eros/v2/get-profile/by-username/'+encodeURIComponent(custody),parameters:{fields:'basicInfo,bankSubAccounts'}});
   console.log(JSON.stringify({scope:'ACCOUNT',apiId:'2.1',httpStatus:profile.status,state:'CAPTURED_NOT_QUALIFIED'}));
   const cachedProfile=async()=>profile;
   for(const [apiId,type,route,params]of accountRequests(today,from,to)){
    try{
     const a=await resolveSubAccount(cachedProfile,custody,type),parameters=params(a);
     if(apiId==='4.17')parameters.custodycd=custody;
     const result=await capture({apiId,pathname:route(a),parameters,...(apiId==='4.16'?{variant:'page-1'}:{})});
     console.log(JSON.stringify({scope:'ACCOUNT',apiId,accountType:type,httpStatus:result.status,state:'CAPTURED_NOT_QUALIFIED'}));
     if(apiId==='4.16'){
      const first=cashStatementPage(result.bytes,1);let received=first.rows;
      const pages=Math.ceil(first.totalCount/25);
      for(let page=2;page<=Math.min(pages,25);page++){
       const next=await capture({apiId,pathname:route(a),parameters:{...parameters,pageIndex:String(page)},variant:'page-'+page});
       const meta=cashStatementPage(next.bytes,page);
       if(meta.totalCount!==first.totalCount)throw Error('CASH_STATEMENT_CHANGED_DURING_CAPTURE');
       received+=meta.rows;
      }
      report.cashHistory={from,to,totalCount:first.totalCount,receivedRows:received,complete:received===first.totalCount};
      if(received!==first.totalCount)throw Error('CASH_STATEMENT_INCOMPLETE_OR_PAGE_LIMIT');
     }
    }
    catch(error){if(stopped||deadline.aborted)throw error;const reason=/^(HTTP_\d{3}$|CASH_|PROFILE_|ACTIVE_|AMBIGUOUS_)/.test(error.message)?error.message:'ACCOUNT_CAPTURE_INCOMPLETE';report.issues.push({scope:'ACCOUNT',apiId,accountType:type,reason});if(!report.requests.some(r=>r.apiId===apiId))report.requests.push({apiId,state:'SUB_ACCOUNT_NOT_RESOLVED'});console.log(JSON.stringify({scope:'ACCOUNT',apiId,accountType:type,state:reason}));}
   }
   }catch(error){if(stopped||deadline.aborted)throw error;report.issues.push({scope:'ACCOUNT',apiId:'2.1',reason:/^HTTP_\d{3}$/.test(error.message)?error.message:'PROFILE_CAPTURE_INCOMPLETE'});console.log(JSON.stringify({scope:'ACCOUNT',apiId:'2.1',state:report.issues.at(-1).reason}));}
  }
  const specs=marketRequests(members,String(Math.floor(Date.now()/1000)),{extended:report.scope.extendedMarket,historyBars});
  for(const spec of specs.core){await capture(spec,core);console.log(JSON.stringify({apiId:spec.apiId,ticker:spec.ticker,state:'CAPTURED_NOT_QUALIFIED'}));}
  core.state='CAPTURED_NOT_QUALIFIED';
  for(const spec of specs.extra){
   try{await capture(spec);}catch(error){if(stopped||deadline.aborted)throw error;}
  }
  await board;
  report.state=!report.issues.length&&report.requests.every(r=>r.state==='CAPTURED_NOT_QUALIFIED')&&boardResult.state==='CAPTURED_NOT_QUALIFIED'?'CAPTURED_NOT_QUALIFIED':'PARTIAL_CAPTURE';
 }catch(error){
  report.state=/^(TOKEN_|AUTH_|OTP_|SIX_DIGIT_|PRIVATE_SESSION_|HTTP_|SESSION_)/.test(error.message)?error.message:'NETWORK_OR_CAPTURE_FAILURE';
  report.failureReason=report.state;
 }finally{
  await board;token=undefined;
  report.finishedAt=new Date().toISOString();core.finishedAt=report.finishedAt;
  if(core.state==='STARTED')core.state='PARTIAL_CAPTURE';
  if(boardResult)report.websocket={apiId:'5.2',url:WS_URL,subscription:'d|s|tk|bp+bi+tm+mp+op+fe|'+report.symbols.join(','),...boardResult};
  // Final observations are in SQLite; no raw/manifest/capture data files are written.
  try {
   report.displayPrices=storage.publishPrices(report.requests,members,report.finishedAt);
   if(report.displayPrices.state!=='UPDATED'){report.issues.push({apiId:'DISPLAY_PRICES',reason:'PRICE_COVERAGE_INCOMPLETE'});if(!report.failureReason)report.state='PARTIAL_CAPTURE';}
   report.marketCore=core;
   const accountRows=report.requests.filter(r=>r.apiId==='2.1'||r.apiId.startsWith('4.'));
   const marketRows=report.requests.filter(r=>r.apiId.startsWith('5.'));
   report.accountCapture={state:!report.scope.accounts?'NOT_REQUESTED':!accountRows.length||accountRows.some(r=>r.state!=='CAPTURED_NOT_QUALIFIED')||report.issues.some(i=>i.scope==='ACCOUNT')?'PARTIAL_CAPTURE':'CAPTURED_NOT_QUALIFIED',requests:accountRows.map(({apiId,httpStatus,state})=>({apiId,httpStatus,state})),issues:report.issues.filter(i=>i.scope==='ACCOUNT')};
   const marketRestState=marketRows.length&&core.state==='CAPTURED_NOT_QUALIFIED'&&marketRows.every(r=>r.state==='CAPTURED_NOT_QUALIFIED')?'CAPTURED_NOT_QUALIFIED':'PARTIAL_CAPTURE';
   report.marketCapture={state:marketRestState==='CAPTURED_NOT_QUALIFIED'&&boardResult?.state==='CAPTURED_NOT_QUALIFIED'?'CAPTURED_NOT_QUALIFIED':'PARTIAL_CAPTURE',restState:marketRestState,websocketState:boardResult?.state??'NOT_CAPTURED',displayPrices:report.displayPrices};
   const saved=storage.saveRun(report);
   console.log(JSON.stringify({state:report.state,storage:'SQLITE',runId:saved.id,requests:report.requests.length,accountCapture:report.accountCapture,marketCapture:report.marketCapture,displayPrices:report.displayPrices,websocketFrames:boardResult?.frames.length??0}));
  } finally {storage.close();}
  if(report.state!=='CAPTURED_NOT_QUALIFIED')process.exitCode=1;
  return report;
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{await main();}catch(error){
  if(!error.message?.startsWith('UNSUPPORTED_NODE_VERSION:'))throw error;
  console.error(error.message);process.exitCode=1;
 }
}
