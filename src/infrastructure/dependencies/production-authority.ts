import {readFileSync,realpathSync} from 'node:fs';
import {resolve,sep,isAbsolute} from 'node:path';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {hashBytes} from '@/infrastructure/market-boundary/tcbs-pipeline';
import {requireBoundary as check,same} from '@/domain/market-boundary/validation';
import {verifyAuthorityReceipt} from './authority-receipts';
import {validateMethodology} from '@/infrastructure/repositories/methodology-schema';
import {instant} from '@/shared/time';
export interface FilePin {readonly path:string;readonly sha256:string}
interface SealedJSON {readonly id:string;readonly contract:string;readonly contentHash:string}
interface Manifest extends SealedJSON {
 readonly implementationId:string;readonly version:string;readonly reviewedCommit:string;
 readonly artifacts:readonly (FilePin&{size:number;sourceCommit:string})[];
 readonly categoryMaxima:Readonly<Record<string,number>>;readonly runtimeDependencyPins:readonly FilePin[];
}
interface Approval extends SealedJSON {
 readonly approvalMode:string;readonly approvalScope:string;readonly implementation:string;readonly version:string;
 readonly ownerApprovalDate:string;readonly statement:string;readonly source:FilePin;readonly manifest:{id:string;hash:string};readonly recordedAt:string;readonly effectiveFrom:string;
}
interface Executable extends SealedJSON {
 readonly authorityType:string;readonly implementation:string;readonly semanticVersion:string;readonly status:string;
 readonly manifest:FilePin;readonly ownerApproval:FilePin;readonly scoringModelAuthority:{id:string;hash:string};
}
interface Compatibility extends SealedJSON {
 readonly pair:string;readonly result:string;readonly authorities:readonly {type:string;id:string;hash:string}[];
 readonly rules:readonly {id:string;result:string;governing:FilePin;implementation:FilePin;testReferences:readonly string[]}[];
}
interface Bundle extends SealedJSON {
 readonly authorities:readonly {type:string;id:string;hash:string;artifact:FilePin}[];
 readonly compatibilities:readonly FilePin[];readonly recordedAt:string;readonly scope:string;
 readonly methodology:unknown;readonly requirements:FilePin;
}
export function authorityBytes(root:string,pin:FilePin){
 check(!isAbsolute(pin.path)&&!pin.path.split(/[\\/]/).includes('..'),'AUTHORITY_PATH_ESCAPE');
 const file=realpathSync(resolve(root,pin.path));check(file.startsWith(realpathSync(root)+sep),'AUTHORITY_PATH_ESCAPE');
 const bytes=readFileSync(file);check(bytes.length<=4_000_000&&hashBytes(bytes)===pin.sha256,'SCORING_EXECUTABLE_HASH_MISMATCH:'+pin.path);return bytes;
}
function sealed<T extends SealedJSON>(root:string,pin:FilePin):T{const r=JSON.parse(authorityBytes(root,pin).toString('utf8')) as T;const {contentHash,...body}=r;check(hash(body)===contentHash,'AUTHORITY_CONTENT_HASH');return r;}
const pairs=['POLICY:RISK_POLICY','POLICY:SCORING_MODEL','POLICY:SCORING_EXECUTABLE','RISK_POLICY:SCORING_EXECUTABLE','SCORING_MODEL:SCORING_EXECUTABLE','SCORING_MODEL:DECISION_ENGINE','SCORING_EXECUTABLE:DECISION_ENGINE','POLICY:DECISION_ENGINE','RISK_POLICY:DECISION_ENGINE'];
/** Fixed server-owned bundle pin is the trust anchor. No caller approval or active/latest selection. */
export function verifyProductionAuthorityBundle(root:string,pin:FilePin){
 const b=sealed<Bundle>(root,pin);check(b.contract==='production-authority-bundle-v1'&&b.scope==='STATIC_AUTHORITY_ONLY','AUTHORITY_BUNDLE_CONTRACT');instant(b.recordedAt);
 check(b.authorities.length===5&&new Set(b.authorities.map(a=>a.type)).size===5,'PARTIAL_AUTHORITY_BUNDLE');
 for(const type of ['POLICY','RISK_POLICY','SCORING_MODEL','SCORING_EXECUTABLE','DECISION_ENGINE'])check(b.authorities.some(a=>a.type===type),'PARTIAL_AUTHORITY_BUNDLE');
 for(const a of b.authorities.filter(a=>a.type!=='SCORING_EXECUTABLE')){const r=verifyAuthorityReceipt(root,a.artifact.path,a.artifact.sha256);check(r.authorityType===a.type&&r.authorityReceiptId===a.id&&r.receiptSha256===a.hash,'AUTHORITY_RECEIPT_BINDING');}
 const ex=b.authorities.find(a=>a.type==='SCORING_EXECUTABLE')!,e=sealed<Executable>(root,ex.artifact);
 check(e.id===ex.id&&e.contentHash===ex.hash&&e.authorityType==='SCORING_EXECUTABLE'&&e.status==='APPROVED_PRODUCTION','UNAPPROVED_SCORING_EXECUTABLE');
 check(e.implementation==='m64-clarification-1'&&e.semanticVersion==='1.0.0','SCORING_EXECUTABLE_VERSION_MISMATCH');
 const m=sealed<Manifest>(root,e.manifest),a=sealed<Approval>(root,e.ownerApproval);
 check(m.contract==='scoring-executable-manifest-v1'&&m.implementationId===e.implementation&&m.version===e.semanticVersion&&m.reviewedCommit==='d97e9486e28cb5b3164234c7f35a2a43dc092401','SCORING_EXECUTABLE_CHANGED_AFTER_APPROVAL');
 check(a.contract==='owner-scoring-production-approval-v1'&&a.approvalMode==='OWNER_GOVERNANCE_APPROVAL'&&a.approvalScope==='SCORING_EXECUTABLE_PRODUCTION','OWNER_APPROVAL_SCOPE_MISMATCH');
 check(a.implementation===e.implementation&&a.version===e.semanticVersion&&a.ownerApprovalDate==='2026-10-20'&&a.statement==='Approve m64-clarification-1 v1.0.0 for Production','OWNER_APPROVAL_MISSING');
 check(same(a.manifest,{id:m.id,hash:m.contentHash}),'SCORING_EXECUTABLE_HASH_MISMATCH');instant(a.recordedAt);instant(a.effectiveFrom);check(a.effectiveFrom<=a.recordedAt&&a.recordedAt<=b.recordedAt,'OWNER_APPROVAL_EFFECTIVE_TIME');
 check(authorityBytes(root,a.source).toString('utf8').includes(a.statement),'OWNER_APPROVAL_MISSING');
 check(m.artifacts.length>0&&new Set(m.artifacts.map(p=>p.path)).size===m.artifacts.length,'SCORING_EXECUTABLE_MANIFEST');
 check(m.runtimeDependencyPins.length===2&&m.runtimeDependencyPins.some(p=>p.path==='pnpm-lock.yaml')&&m.runtimeDependencyPins.some(p=>p.path==='package.json'),'SCORING_EXECUTABLE_DEPENDENCY_PINS');m.runtimeDependencyPins.forEach(p=>authorityBytes(root,p));
 for(const p of m.artifacts){check(/^[a-f0-9]{40}$/.test(p.sourceCommit),'AUTHORITY_SOURCE_COMMIT');check(authorityBytes(root,p).length===p.size,'SCORING_EXECUTABLE_HASH_MISMATCH');}
 check(same(m.categoryMaxima,{BQ:25,FH:15,GQ:15,IC:10,VAL:20,RG:10,CA:5}),'SCORING_MODEL_EXECUTABLE_INCOMPATIBLE');
 const model=b.authorities.find(a=>a.type==='SCORING_MODEL')!;check(same(e.scoringModelAuthority,{id:model.id,hash:model.hash}),'SCORING_MODEL_EXECUTABLE_INCOMPATIBLE');
 const proofs=b.compatibilities.map(p=>sealed<Compatibility>(root,p));
 check(proofs.length===pairs.length&&new Set(proofs.map(p=>p.pair)).size===pairs.length,'PARTIAL_AUTHORITY_BUNDLE');
 for(const pair of pairs){const proof=proofs.find(p=>p.pair===pair);check(proof?.result==='COMPATIBLE'&&proof.contract==='production-authority-compatibility-v1','AUTHORITY_COMPATIBILITY_BLOCKED:'+pair);
  const expected=pair.split(':').map(type=>{const a=b.authorities.find(a=>a.type===type)!;return {type,id:a.id,hash:a.hash};});check(same(proof.authorities,expected)&&proof.rules.length>0,'AUTHORITY_COMPATIBILITY_BINDING');
  for(const rule of proof.rules){check(rule.result==='PASS'&&rule.id.length>0&&rule.testReferences.length>0,'AUTHORITY_COMPATIBILITY_BLOCKED:'+pair);authorityBytes(root,rule.governing);authorityBytes(root,rule.implementation);}
 }
 const method=validateMethodology(b.methodology);check(method.family==='SCORING'&&method.implementationIdentity===e.implementation&&method.semanticVersion===e.semanticVersion&&method.governanceStatus==='APPROVED'&&method.intendedUse==='PRODUCTION'&&method.configurationReference==='scoring-executable-manifest-sha256:'+m.contentHash&&method.approvalReference===e.ownerApproval.path&&method.recordedAt===a.recordedAt,'SCORING_METHOD_AUTHORITY_BINDING');
 authorityBytes(root,b.requirements);
 return {bundle:b,executable:e,manifest:m,ownerApproval:a,methodology:method,compatibilities:proofs};
}
