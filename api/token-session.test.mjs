import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getTokenSession, invalidateTokenSession } from './token-session.mjs';
const now=()=>1800000000000;
const custody='TEST_CUSTODY';
const jwt='header.'+Buffer.from(JSON.stringify({custodyID:custody,exp:1800000600})).toString('base64url')+'.signature';
const setup=()=>({folder:mkdtempSync(path.join(tmpdir(),'vvios-session-')),key:'test-only-key',custody,now});
test('one OTP exchange; subsequent run reuses token without OTP or auth call',async()=>{
 const s=setup();let calls=0,otpReads=0;
 const options={...s,readOtp:async()=>{otpReads++;return '123456';},request:async()=>{calls++;return {ok:true,status:200,data:{token:jwt}};}};
 try {
  assert.equal((await getTokenSession(options)).reused,false);
  assert.equal((await getTokenSession(options)).reused,true);
  assert.equal(calls,1);assert.equal(otpReads,1);
  assert.equal(statSync(path.join(s.folder,'session.json')).mode&0o777,0o600);
  invalidateTokenSession(s.folder);
  await assert.rejects(getTokenSession(options),/OTP_ALREADY_ATTEMPTED/);
  assert.equal(calls,1);
 }finally{rmSync(s.folder,{recursive:true,force:true});}
});
test('429 blocks immediate repeat without rereading OTP or network',async()=>{
 const s=setup();let calls=0;
 const options={...s,readOtp:async()=> '123456',request:async()=>{calls++;return {ok:false,status:429};}};
 try {
  await assert.rejects(getTokenSession(options),/RATE_LIMITED_429/);
  await assert.rejects(getTokenSession({...options,readOtp:async()=>{throw new Error('must not prompt');}}),/COOLDOWN/);
  assert.equal(calls,1);
 }finally{rmSync(s.folder,{recursive:true,force:true});}
});
test('invalid custody claim is not cached and same OTP cannot be retried',async()=>{
 const s=setup();
 const wrong='header.'+Buffer.from(JSON.stringify({custodyID:'OTHER',exp:1800000600})).toString('base64url')+'.sig';
 const options={...s,readOtp:async()=> '123456',request:async()=>({ok:true,status:200,data:{token:wrong}})};
 try {
  await assert.rejects(getTokenSession(options),/CUSTODY_MISMATCH/);
  await assert.rejects(getTokenSession(options),/OTP_ALREADY_ATTEMPTED/);
 }finally{rmSync(s.folder,{recursive:true,force:true});}
});
