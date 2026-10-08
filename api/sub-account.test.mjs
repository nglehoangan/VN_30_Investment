import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSubAccount } from './sub-account.mjs';
const custody='TEST_CUSTODY';
const result=accounts=>({ok:true,data:{basicInfo:{code105C:custody},bankSubAccounts:accounts}});
const account=(accountNo,accountType='NORMAL',status='1')=>({accountNo,accountType,status});
test('refreshes from API 2.1 on every request and picks requested type',async()=>{
 let calls=0;
 const request=async(method,route,params)=>{
  calls++;
  assert.equal(method,'GET');assert.equal(route,`/eros/v2/get-profile/by-username/${custody}`);
  assert.equal(params.fields,'basicInfo,bankSubAccounts');
  return result([account(`normal-${calls}`),account('margin','MARGIN'),account('inactive','NORMAL','0')]);
 };
 assert.equal(await resolveSubAccount(request,custody),'normal-1');
 assert.equal(await resolveSubAccount(request,custody),'normal-2');
 assert.equal(await resolveSubAccount(request,custody,'MARGIN'),'margin');
 assert.equal(calls,3);
});
test('does not choose first/default, inactive or wrong account type',async()=>{
 await assert.rejects(resolveSubAccount(async()=>result([account('a'),account('b')]),custody),/AMBIGUOUS/);
 await assert.rejects(resolveSubAccount(async()=>result([account('a','MARGIN'),account('b','NORMAL','0')]),custody),/NOT_FOUND/);
});
test('blocks identity mismatch, HTTP failure and malformed profile',async()=>{
 await assert.rejects(resolveSubAccount(async()=>({ok:true,data:{basicInfo:{code105C:'OTHER'},bankSubAccounts:[account('a')]}}),custody),/MISMATCH/);
 await assert.rejects(resolveSubAccount(async()=>({ok:false}),custody),/HTTP_ERROR/);
 await assert.rejects(resolveSubAccount(async()=>({ok:true,data:{basicInfo:{code105C:custody}}}),custody),/SCHEMA/);
});
