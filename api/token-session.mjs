import { mkdirSync, readFileSync, writeFileSync, statSync, openSync, closeSync, unlinkSync, renameSync } from 'node:fs';
import { createHash, createHmac } from 'node:crypto';
import path from 'node:path';

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
    if (cached.binding===binding && typeof cached.token==='string' && cached.expiresAt>now()+60000)
      return { token:cached.token, reused:true };
    if (cached.binding===binding && cached.retryAfter>now()) throw new Error('AUTH_RATE_LIMIT_COOLDOWN');
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
