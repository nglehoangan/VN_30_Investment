import { readFileSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveSubAccount } from './sub-account.mjs';
import { getTokenSession, invalidateTokenSession } from './token-session.mjs';

// Read-only API smoke test. API Key/OTP/JWT and response payloads never enter reports.
const root = fileURLToPath(new URL('..', import.meta.url));
const credentials = path.join(root, 'api/.env.local');
if (statSync(credentials).mode & 0o077) throw new Error('Credential file must have mode 0600');
process.loadEnvFile(credentials);
const { TCBS_API_KEY: key, TCBS_CUSTODY_CODE: custody } = process.env;
if (!key || !custody) throw new Error('Missing local TCBS configuration');
const catalog = JSON.parse(readFileSync(path.join(root, 'api/tcbs-api-catalog.json'), 'utf8'));
if (catalog.base_url !== 'https://openapi.tcbs.com.vn') throw new Error('Unexpected API host');
const report = { format: 'vvios-tcbs-smoke-v1', startedAt: new Date().toISOString(), scope: 'Authentication + read-only GET smoke checks; no financial posting', results: [] };
let token;
const sessionFolder = path.join(root, 'data/tcbs-session');
let profileCache;
let stopped = false;
async function request(method, pathname, parameters, body) {
  if (stopped) throw new Error('API_SESSION_STOPPED');
  if (method === 'GET' && pathname.startsWith('/eros/v2/get-profile/') && profileCache) return profileCache;
  const url = new URL(pathname, catalog.base_url);
  for (const [k,v] of Object.entries(parameters ?? {})) url.searchParams.set(k,v);
  const response = await fetch(url, { method, redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}) });
  const bytes = await response.text();
  let data;
  try { data = JSON.parse(bytes); } catch { data = null; }
  const result = { status: response.status, ok: response.ok, data, retryAfterMs: /^\d+$/.test(response.headers.get('retry-after') ?? '') ? Number(response.headers.get('retry-after'))*1000 : undefined };
  if (method === 'GET' && [401,429].includes(response.status)) {
    if (response.status === 401) invalidateTokenSession(sessionFolder);
    stopped = true;
  }
  if (method === 'GET' && pathname.startsWith('/eros/v2/get-profile/') && response.ok) profileCache=result;
  return result;
}
function record(id, state, httpStatus, count) {
  const row = { id, state, ...(httpStatus === undefined ? {} : { httpStatus }), ...(count === undefined ? {} : { returnedRows: count }) };
  report.results.push(row);
  console.log(JSON.stringify(row));
}
function save() {
  const folder = path.join(root, 'data/api-tests');
  mkdirSync(folder, { recursive: true, mode: 0o700 });
  writeFileSync(path.join(folder, 'latest-smoke.json'), JSON.stringify(report,null,2)+'\n', { mode: 0o600 });
}
try {
  const session = await getTokenSession({folder:sessionFolder,key,custody,request,readOtp:async()=>{
    if(process.argv.includes('--cached-token-only')) throw new Error('TOKEN_CACHE_UNAVAILABLE_OR_EXPIRED');
    if(process.argv.includes('--otp-stdin')) return readFileSync(0,'utf8').trim();
    const prompt=spawnSync('python3',['-c','import getpass; print(getpass.getpass("TCInvest Smart OTP (hidden): "))'],{stdio:['inherit','pipe','inherit'],encoding:'utf8'});
    if(prompt.status!==0)throw new Error('OTP_INPUT_UNAVAILABLE');
    return prompt.stdout.trim();
  }});
  token=session.token;
  record('1.1',session.reused?'REUSED_VALID_TOKEN':'PASS');
  {
    try {
      await resolveSubAccount(request, custody, 'NORMAL');
      record('2.1','PASS');
    } catch (error) {
      record('2.1',error.message);
    }
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date());
    const specs = [
      ['4.14','NORMAL',account=>`/aion/v1/accounts/${encodeURIComponent(account)}/se`,()=>({}),d=>d?.assets],
      ['4.15','NORMAL',account=>`/aion/v1/accounts/${encodeURIComponent(account)}/cashInvestments`,()=>({}),d=>d?.data],
      ['4.16','NORMAL',()=>'/erebos/v2/digital/trans-hist-cashStatements',account=>({accountno:account,fromDate:'2026-09-30',toDate:today,pageSize:'25',pageIndex:'1'}),d=>d?.response?.data],
      ['5.1',null,()=>'/tartarus/v1/tickerCommons',()=>({index:'2'}),d=>d?.data],
      ['4.6','NORMAL',account=>`/aion/v1/accounts/${encodeURIComponent(account)}/matching-details`,()=>({}),d=>d?.data],
      ['4.4','NORMAL',account=>`/aion/v1/accounts/${encodeURIComponent(account)}/orders`,()=>({}),d=>d?.orders],
      ['4.17','MARGIN',()=>'/erebos/v2/digital/margin-info',account=>({acctno:account,custodycd:custody,fromdate:'2026-09-30',toDate:today,page:'1',size:'25'}),d=>d?.response?.data],
      ['5.11',null,()=>'/ananke/v1/securities',()=>({fields:'all',filter:'symbol=FPT'}),d=>d?.data],
    ];
    for (const [id,type,pathname,params,rows] of specs) {
      if(stopped){record(id,'SKIPPED_SESSION_STOPPED');continue;}
      let account;
      if (type) {
        try { account = await resolveSubAccount(request,custody,type); }
        catch { record(id,'SKIPPED_SUB_ACCOUNT_NOT_RESOLVED'); continue; }
      }
      try {
        const result = await request('GET',pathname(account),params(account));
        const values = rows(result.data);
        record(id, !result.ok ? 'HTTP_ERROR' : Array.isArray(values) ? 'PASS' : 'RESPONSE_SCHEMA_UNCONFIRMED', result.status, Array.isArray(values) ? values.length : undefined);
      } catch { record(id,'NETWORK_OR_TIMEOUT'); }
    }
    if (report.results.some(r=>!['PASS','REUSED_VALID_TOKEN'].includes(r.state))) process.exitCode=1;
  }
} catch(error) {
  const known=/^(AUTH_|OTP_|TOKEN_|SIX_DIGIT_|PRIVATE_SESSION_)/.test(error.message);
  record('test',known?error.message:'BLOCKED_OR_NETWORK_ERROR'); process.exitCode=1;
} finally {
  token=undefined;
  report.finishedAt=new Date().toISOString(); save();
}
