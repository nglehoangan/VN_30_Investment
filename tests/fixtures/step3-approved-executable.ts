/** Counterfactual test root only. Never restores live source or activates authority. */
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
export const STEP3='docs/fundamental-data-engine/vnm-step3-executable-reconciliation/2026-11-17';
export function approvedExecutableFixture(){
 const root=mkdtempSync(join(tmpdir(),'step3-approved-control-')),seen=new Set<string>();
 // This fixture intentionally tests the historical 20261029 authority, never active/latest.
 const bundlePath='docs/fundamental-data-engine/evidence/2026-10-29-approved-authority-activation/PRODUCTION_AUTHORITY_BUNDLE.json';
 const config={authorityBundle:{path:bundlePath,sha256:createHash('sha256').update(readFileSync(bundlePath)).digest('hex')}};
 const comparison=JSON.parse(readFileSync(STEP3+'/EXECUTABLE_HASH_COMPARISON.json','utf8')) as {mismatches:{path:string;approvedSnapshot:string;approvedSha256:string}[]};
 const copy=(path:string)=>{
  if(seen.has(path))return;seen.add(path);const b=readFileSync(path);mkdirSync(dirname(join(root,path)),{recursive:true});writeFileSync(join(root,path),b);
  if(path.endsWith('.json')){const walk=(v:unknown)=>{if(!v||typeof v!=='object')return;if('path' in v&&'sha256' in v&&typeof v.path==='string')copy(v.path);for(const [k,x]of Object.entries(v))if(!['historicalPins','baselineManifest','builder'].includes(k))walk(x);};walk(JSON.parse(b.toString()));}
 };
 try{
  copy(config.authorityBundle.path);
  for(const r of comparison.mismatches){const b=readFileSync(STEP3+'/'+r.approvedSnapshot);if(createHash('sha256').update(b).digest('hex')!==r.approvedSha256)throw Error('APPROVED_SNAPSHOT_HASH');writeFileSync(join(root,r.path),b);}
  return {root,config,comparison,close:()=>rmSync(root,{recursive:true,force:true})};
 }catch(e){rmSync(root,{recursive:true,force:true});throw e;}
}
