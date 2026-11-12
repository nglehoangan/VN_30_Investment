import {it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PinnedStandingRegistry,sha,type StandingRegistryBindings} from '@/infrastructure/source-admission/registry';
const H='a'.repeat(64),at='2026-11-12T12:00:00.000Z';
function registryFixture(){
 const root=mkdtempSync(join(tmpdir(),'standing-registry-test-'));
 const put=(path:string,v:unknown)=>{const s=JSON.stringify(v);writeFileSync(join(root,path),s);return {path,sha256:sha(s)};};
 const auth=put('auth.json',{origin:'SYNTHETIC_POLICY_TEST'});
 const body={contract:'registered-independent-material-acceptance-v1',domain:'F2',decision:'ACCEPTED',superseded:false,knownAt:at,materialHash:H,reviewer:'SYNTHETIC_INDEPENDENT_REVIEWER',policyVersion:'standing-financial-current-v1',authorization:auth};
 const receipt=put('receipt.json',body);
 const bindings:StandingRegistryBindings={authorizations:{F1:auth,F2:auth},materials:[{domain:'F2',materialHash:H,reference:receipt,reviewer:body.reviewer,policyVersion:body.policyVersion}],captures:[]};
 return {root,put,auth,body,receipt,bindings,close:()=>rmSync(root,{recursive:true,force:true})};
}
it('a registered exact material receipt resolves; arbitrary on-disk ACCEPTED JSON does not enroll itself',()=>{const f=registryFixture();try{expect(new PinnedStandingRegistry(f.root,f.bindings).independentAcceptance(H)).toEqual(f.receipt);expect(new PinnedStandingRegistry(f.root,{...f.bindings,materials:[]}).independentAcceptance(H)).toBeNull();}finally{f.close();}});
for(const [name,patch] of Object.entries({fakeReviewer:{reviewer:'IMPOSTOR'},superseded:{superseded:true},staleMaterial:{materialHash:'b'.repeat(64)},wrongDomain:{domain:'F1'},wrongPolicy:{policyVersion:'unknown'},fakeAuthorization:{authorization:{path:'fake.json',sha256:'c'.repeat(64)}},proposalOnly:{decision:'PROPOSED'},invalidTime:{knownAt:'yesterday'}}))it('rejects independently pinned receipt with '+name,()=>{const f=registryFixture();try{const altered=f.put('altered.json',{...f.body,...patch});const b={...f.bindings,materials:f.bindings.materials.map(r=>({...r,reference:altered}))};expect(new PinnedStandingRegistry(f.root,b).independentAcceptance(H)).toBeNull();}finally{f.close();}});
it('rejects changed receipt bytes even if JSON still says ACCEPTED',()=>{const f=registryFixture();try{f.put(f.receipt.path,{...f.body,knownAt:'2026-11-12T13:00:00.000Z'});expect(new PinnedStandingRegistry(f.root,f.bindings).independentAcceptance(H)).toBeNull();}finally{f.close();}});
it('trusted binding snapshots cannot be changed by later mutation of submitted configuration',()=>{const f=registryFixture();try{const trusted=new PinnedStandingRegistry(f.root,f.bindings),expected={...f.receipt};f.bindings.materials[0].reference.sha256='0'.repeat(64);expect(trusted.independentAcceptance(H)).toEqual(expected);}finally{f.close();}});
it('F1 lookup cannot inherit F2 approval and capture JSON cannot self-register',()=>{const f=registryFixture();try{const registry=new PinnedStandingRegistry(f.root,f.bindings);expect(registry.marketTrust().independentMaterialAcceptance(H)).toBeNull();expect(registry.marketTrust().capturedSource(f.auth,H)).toBeNull();}finally{f.close();}});
