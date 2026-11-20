import 'server-only';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import type {SourcePin} from '@/infrastructure/source-admission/registry';
import {sha,sourceBytes} from '@/infrastructure/source-admission/registry';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {instant} from '@/shared/time';

interface AcbF1Version {
 contract:'acb-f1-pinned-runtime-v1';status:'PROPOSED'|'APPROVED';recordedAt:string;
 ticker:'ACB';securityId:string;cutoff:string;purpose:'VALUATION';
 archive:SourcePin & {gitBlob:string};
 localPins:SourcePin[];
 runtime:SourcePin[];
 permitsScoring:false;productionActivationGranted:false;
 ownerSource?:SourcePin;
}
function requirePin(value:unknown,reason:string):asserts value {
 if(!value)throw Error(reason);
}
export function acbF1RuntimeApprovalHash(version:AcbF1Version){
 const {status:_status,recordedAt:_recordedAt,ownerSource:_source,...scope}=version;
 return snapshotHash(scope);
}

/** Rebuild the exact F1 verification inputs without executing the archived operator script. */
export async function withApprovedAcbF1Root<T>(repo:string,versionPin:SourcePin,knownAt:string,
 run:(marketRoot:string)=>Promise<T>){
 const v=JSON.parse(sourceBytes(repo,versionPin).toString()) as AcbF1Version;
 instant(knownAt);instant(v.recordedAt);
 requirePin(v.contract==='acb-f1-pinned-runtime-v1'&&v.status==='APPROVED'&&v.ownerSource&&
  v.recordedAt<=knownAt&&v.ticker==='ACB'&&v.securityId==='658fafbe-65b3-4176-999f-d4d32e1bd838'&&
  v.cutoff==='2026-10-30'&&v.purpose==='VALUATION'&&v.permitsScoring===false&&
  v.productionActivationGranted===false,'ACB_F1_SUCCESSOR_APPROVAL_REQUIRED');
 const statement='Approve exact ACB F1 pinned runtime '+acbF1RuntimeApprovalHash(v)+' for 2026-10-30';
 requirePin(sourceBytes(repo,v.ownerSource).toString().split(/\r?\n/).includes(statement),
  'ACB_F1_SUCCESSOR_OWNER_HASH_REQUIRED');
 const names=new Set(v.localPins.map(p=>p.path));
 requirePin(names.size===v.localPins.length&&!names.has(v.archive.path)&&
  v.archive.path==='scripts/cafef-standing.mjs'&&v.archive.gitBlob==='a087ca60d1dcbdfa6177175a844ac720ca799948'&&
  v.archive.sha256==='5ecec10cff3b6e43f25877fb0df480809d458aa4bb1210acfc2d983de578b698',
  'ACB_F1_SUCCESSOR_ARCHIVE_SCOPE');
 requirePin(v.runtime.some(p=>p.path==='app/server/acb-f1-runtime.ts')&&
  v.runtime.some(p=>p.path==='app/server/acb-bank-admission.ts'),'ACB_F1_SUCCESSOR_RUNTIME_REQUIRED');
 for(const p of v.runtime)sourceBytes(repo,p);
 const dir=mkdtempSync(join(tmpdir(),'acb-f1-pinned-'));
 try{
  const write=(pin:SourcePin,bytes:Uint8Array)=>{
   requirePin(!pin.path.startsWith('/')&&!pin.path.includes('\\')&&
    !pin.path.split('/').some(part=>!part||part==='.'||part==='..'),'ACB_F1_PIN_PATH');
   requirePin(sha(bytes)===pin.sha256,'ACB_F1_PIN_HASH:'+pin.path);
   const target=join(dir,pin.path);
   requirePin(!existsSync(target),'ACB_F1_PIN_COLLISION');
   mkdirSync(dirname(target),{recursive:true});
   writeFileSync(target,bytes,{flag:'wx',mode:0o400});
  };
  for(const p of v.localPins)write(p,sourceBytes(repo,p));
  const archived=execFileSync('git',['cat-file','blob',v.archive.gitBlob],{cwd:repo});
  write(v.archive,archived);
  return await run(dir);
 }finally{rmSync(dir,{recursive:true,force:true});}
}
