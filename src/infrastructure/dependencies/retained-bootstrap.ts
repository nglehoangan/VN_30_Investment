import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import type {Head,Release} from '@/domain/dependencies/contracts';
import type {TcbsPipelineCandidate} from '@/infrastructure/market-boundary/tcbs-pipeline';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {hashBytes} from '@/infrastructure/market-boundary/tcbs-pipeline';
import {requireBoundary as check,same} from '@/domain/market-boundary/validation';
import {readRelease} from '@/domain/dependencies/validation';
/** Consume the accepted immutable release, not old fetch executables against today's HEAD.
 * Historical replayTcbsPipeline and its original source pins remain unchanged. */
export function verifyRetainedBootstrap(root:string,c:TcbsPipelineCandidate){
 const path='docs/fundamental-data-engine/vnm-step3-authority-closure/2026-11-17/RETAINED_STATIC_HEAD_BINDING.json';
 const bytes=readFileSync(resolve(root,path));
 check(hashBytes(bytes)==='94b211962c2281159706236d02479539dd1b793db604ce97fbb9648a0d38fd05','RETAINED_BOOTSTRAP_RECEIPT_HASH');
 const receipt=JSON.parse(bytes.toString()) as {status:string;sourceRelease:{id:string;hash:string};retained:{type:string;path:string;sha256:string;headPin:{id:string;hash:string}}[]};
 check(receipt.status==='BOUND_EXISTING_ACCEPTED_HEADS_UNCHANGED'&&receipt.retained.length===7,'RETAINED_BOOTSTRAP_SCOPE');
 const db=new DatabaseSync(resolve(root,'data/vn30.sqlite'),{readOnly:true});let release:Release;
 try{const row=db.prepare('SELECT body,body_hash FROM dependency_release WHERE id=?').get(receipt.sourceRelease.id) as {body:string;body_hash:string}|undefined;check(row&&row.body_hash===receipt.sourceRelease.hash,'RETAINED_BOOTSTRAP_ACCEPTED_RELEASE');release=readRelease(JSON.parse(row.body),hash);check(release.contentHash===row.body_hash,'RETAINED_BOOTSTRAP_RELEASE_HASH');}finally{db.close();}
 const heads:Head[]=[];
 for(const pin of receipt.retained){const b=readFileSync(resolve(root,pin.path));check(hashBytes(b)===pin.sha256,'RETAINED_BOOTSTRAP_HEAD_BYTES');const h=JSON.parse(b.toString()) as Head;check(h.type===pin.type&&same(h.pin,pin.headPin)&&release.heads.some(old=>old.type===h.type&&hash(old)===hash(h)),'RETAINED_BOOTSTRAP_HEAD_BINDING');heads.push(h);}
 const content=(type:string)=>heads.find(h=>h.type===type)!.content;
 check(same(content('INITIALIZATION'),c.initialization)&&same(content('MARKET_CAPABILITY'),c.capability)&&same(content('SESSION_POLICY'),c.policy)&&same(content('FUNDAMENTALS'),c.canonical)&&same(content('REFERENCE_DATA'),{security:c.profile.identities,sectors:c.sectors}),'RETAINED_BOOTSTRAP_DATA_CHANGED');
 return {route:'ACCEPTED_STATIC_DATA_SUCCESSOR' as const,receipt:path,sourceRelease:receipt.sourceRelease};
}
