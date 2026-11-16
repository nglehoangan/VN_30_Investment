import {it,expect} from 'vitest';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {sha} from '@/infrastructure/source-admission/registry';
import {verifyRetainedAdapterAuthority} from '@/infrastructure/source-admission/retained-authority-gate';
const path='docs/fundamental-data-engine/standing-authority-version/2026-11-12/VERSIONED_SOURCE_REGISTRY.json';
it('real v4 does not authorize the expanded adapter by provider approval alone',()=>{
 expect(()=>verifyRetainedAdapterAuthority(process.cwd(),{path,sha256:sha(readFileSync(path))},'2026-11-16T06:30:00.000Z')).toThrow('RETAINED_ADAPTER_VERSION_NOT_REGISTERED');
});
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'synthetic-version-gate-'));
 const put=(path:string,value:unknown)=>{const bytes=typeof value==='string'?value:JSON.stringify(value);mkdirSync(dirname(join(root,path)),{recursive:true});writeFileSync(join(root,path),bytes);return {path,sha256:sha(bytes)};};
 const decision=put('synthetic-owner.json','synthetic test only');
 const code=['retained-mapping.ts','retained-authority-gate.ts'].map(name=>put('src/infrastructure/source-admission/'+name,'synthetic implementation'));
 const authority={domain:'F2',id:'synthetic-f2',version:'synthetic-1',status:'APPROVED',adapterVersion:'retained-reviewed-financial-admission-v1',schemaVersion:'retained-current-financial-admission-plan-v1',code,normalizerVersion:'financial-normalize-lexical-v1',policyVersion:'standing-financial-current-v1'};
 const registry={contract:'standing-source-authority-per-version-v1',recordedAt:'2026-11-15T00:00:00.000Z',ownerDecision:decision,legacyAuthorizations:{F2:decision},authorities:[authority]};
 return {root,put,authority,registry,close:()=>rmSync(root,{recursive:true,force:true})};
}
it('synthetic trusted version needs exact active code/schema/policy binding',()=>{
 const f=fixture();try{const pin=f.put('registry.json',f.registry);expect(verifyRetainedAdapterAuthority(f.root,pin,'2026-11-16T00:00:00.000Z').id).toBe('synthetic-f2');}finally{f.close();}
});
for(const [name,mutate,reason] of [
 ['revoked',(f:ReturnType<typeof fixture>)=>{f.authority.status='REVOKED';},'STANDING_AUTHORITY_REVOKED'],
 ['missing code',(f:ReturnType<typeof fixture>)=>{f.authority.code=[];},'RETAINED_ADAPTER_CODE_NOT_BOUND'],
 ['changed policy',(f:ReturnType<typeof fixture>)=>{f.authority.policyVersion='unknown';},'RETAINED_ADAPTER_POLICY_MISMATCH'],
 ['future registry',(f:ReturnType<typeof fixture>)=>{f.registry.recordedAt='2027-01-01T00:00:00.000Z';},'AUTHORITY_NOT_YET_KNOWN'],
] as const)it('rejects '+name,()=>{const f=fixture();try{mutate(f);const pin=f.put('registry.json',f.registry);expect(()=>verifyRetainedAdapterAuthority(f.root,pin,'2026-11-16T00:00:00.000Z')).toThrow(reason);}finally{f.close();}});
it('rejects a changed registered code hash',()=>{const f=fixture();try{const pin=f.put('registry.json',f.registry);f.put(f.authority.code[0].path,'tampered');expect(()=>verifyRetainedAdapterAuthority(f.root,pin,'2026-11-16T00:00:00.000Z')).toThrow('SOURCE_HASH_MISMATCH');}finally{f.close();}});
