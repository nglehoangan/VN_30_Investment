import {it,expect} from 'vitest';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {verifyProductionAuthorityBundle} from '@/infrastructure/dependencies/production-authority';
import {PinnedFiles} from '@/infrastructure/market-boundary/tcbs-pipeline';
import {LocalAcceptedDependencyCatalog} from '@/infrastructure/dependencies/catalog';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
const config=JSON.parse(readFileSync('src/infrastructure/dependencies/active-authorities.json','utf8'));
function fixture(){const root=mkdtempSync(join(tmpdir(),'step3-current-authority-negative-')),seen=new Set<string>();
 const copy=(path:string)=>{if(seen.has(path))return;seen.add(path);const bytes=readFileSync(path);mkdirSync(dirname(join(root,path)),{recursive:true});writeFileSync(join(root,path),bytes);if(path.endsWith('.json')){const walk=(v:unknown)=>{if(!v||typeof v!=='object')return;if('path'in v&&'sha256'in v&&typeof v.path==='string')copy(v.path);for(const [k,x]of Object.entries(v))if(!['historicalPins','baselineManifest','builder','predecessor','trustedCompositionInputs','reviewPacket'].includes(k))walk(x);};walk(JSON.parse(bytes.toString()));}};
 try{copy(config.authorityBundle.path);return {root,close:()=>rmSync(root,{recursive:true,force:true})};}catch(e){rmSync(root,{recursive:true,force:true});throw e;}}
it('actual active verifier accepts exact new owner-authorized static binding without CAS or scoring',()=>{
 const v=verifyProductionAuthorityBundle(process.cwd(),config.authorityBundle);
 expect(v.manifest.contentHash).toBe('67a28b1cad9fc3efcd97bed9a1191d4d8fc52c5a0976c7d1e120a596de339c33');expect(v.ownerApproval.statement).toBe('Approve exact scoring executable manifest '+v.manifest.contentHash+' for SCORING_EXECUTABLE_PRODUCTION');expect(v.compatibilities).toHaveLength(9);
 expect(config.status).toBe('ACCEPTED_STATIC_AUTHORITIES_PENDING_CAS');
});
for(const path of ['src/application/scoring/engine.ts','src/domain/market-boundary/validation.ts','src/domain/scoring/evidence.ts','src/domain/scoring/metrics.ts','src/domain/scoring/scorecard.ts','src/infrastructure/source-admission/current-scoring-consumer.ts'])it('new authority rejects altered executable '+path,()=>{
 const f=fixture();try{verifyProductionAuthorityBundle(f.root,config.authorityBundle);const p=join(f.root,path);writeFileSync(p,readFileSync(p,'utf8')+'\n// altered after approval\n');expect(()=>verifyProductionAuthorityBundle(f.root,config.authorityBundle)).toThrow('SCORING_EXECUTABLE_HASH_MISMATCH:'+path);}finally{f.close();}
});
it('rehashing a receipt cannot replace the exact owner statement with an implementation request',()=>{
 const f=fixture();try{
  const read=(p:string)=>JSON.parse(readFileSync(join(f.root,p),'utf8'));
  const put=(p:string,v:Record<string,unknown>)=>{const {contentHash:unused,...body}=v;const obj={...body,contentHash:hash(body)},bytes=JSON.stringify(obj);writeFileSync(join(f.root,p),bytes);return {obj,pin:{path:p,sha256:createHash('sha256').update(bytes).digest('hex')}};};
  const b=read(config.authorityBundle.path),ex=b.authorities.find((a:{type:string})=>a.type==='SCORING_EXECUTABLE'),e=read(ex.artifact.path),a=read(e.ownerApproval.path);
  a.statement='Xử lý 2 blocker này cho hoàn tất closed';e.ownerApproval=put(e.ownerApproval.path,a).pin;
  const changed=put(ex.artifact.path,e);ex.artifact=changed.pin;ex.hash=changed.obj.contentHash;
  const changedBundle=put(config.authorityBundle.path,b);
  expect(()=>verifyProductionAuthorityBundle(f.root,changedBundle.pin)).toThrow('OWNER_APPROVAL_MISSING');
 }finally{f.close();}
});

it('complete fixed static configuration resolves accepted heads and rejects changed head bytes',async()=>{
 const f=fixture();try{
  const cfgPath='src/infrastructure/dependencies/active-authorities.json';mkdirSync(dirname(join(f.root,cfgPath)),{recursive:true});writeFileSync(join(f.root,cfgPath),JSON.stringify(config));
  for(const pin of config.bindings){mkdirSync(dirname(join(f.root,pin.path)),{recursive:true});writeFileSync(join(f.root,pin.path),readFileSync(pin.path));}
  const deny=async()=>{throw Error('NO_RUNTIME_ACTIVATION');};
  const c=new LocalAcceptedDependencyCatalog(f.root,{find:deny,append:deny,sealDecision:deny,sealRanking:deny},()=>{throw Error('NO_LIFECYCLE');});
  expect(await c.readAccepted()).toHaveLength(11);
  const pin=config.bindings.find((p:{path:string})=>p.path.includes('RETAINED_HEAD_INITIALIZATION'));
  expect(pin).toBeTruthy();writeFileSync(join(f.root,pin.path),'{}');
  await expect(c.readAccepted()).rejects.toThrow('AUTHORITY_RECEIPT_HASH');
 }finally{f.close();}
});

it('legacy code-pin reader still rejects drift; static reuse does not waive its checks',()=>{
 const m=JSON.parse(readFileSync('docs/fundamental-data-engine/evidence/2026-10-29-current-authority-review/SCORING_EXECUTABLE_REVIEW_MANIFEST.json','utf8'));
 const pin=m.artifacts.find((p:{path:string})=>p.path==='src/domain/market-boundary/validation.ts');
 expect(()=>new PinnedFiles(process.cwd()).read(pin.path,pin.sha256)).toThrow('SOURCE_HASH_MISMATCH:'+pin.path);
});
