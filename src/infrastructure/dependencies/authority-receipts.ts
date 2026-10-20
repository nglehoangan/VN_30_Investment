import {readFileSync,realpathSync} from 'node:fs';
import {isAbsolute,resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {requireBoundary as check} from '@/domain/market-boundary/validation';
import {instant} from '@/shared/time';

export type AuthorityType='POLICY'|'RISK_POLICY'|'SCORING_MODEL'|'DECISION_ENGINE';
export interface ArtifactPin {readonly path:string;readonly size:number;readonly sha256:string;readonly sourceCommit:string}
export interface AuthorityReceipt {
 readonly version:'production-authority-receipt-v1';readonly authorityReceiptId:string;
 readonly authorityType:AuthorityType;readonly semanticVersion:string;
 readonly scope:'DOCUMENT_BASELINE'|'EXECUTABLE_IMPLEMENTATION';
 readonly artifacts:readonly ArtifactPin[];
 readonly approvalState:'APPROVED';readonly approvalMode:'OWNER_GOVERNANCE_APPROVAL';
 readonly approvalEvidence:readonly {readonly artifact:ArtifactPin;readonly exactStatement:string;readonly limitation:string}[];
 readonly effectiveState:'EFFECTIVE';readonly effectiveFrom:string;readonly recordedAt:string;
 readonly supersedesReceiptId:string|null;readonly compatibilityContract:string;
 readonly activationMode:'STAGED_NOT_ACTIVATED';readonly receiptSha256:string;
}
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const types:readonly AuthorityType[]=['POLICY','RISK_POLICY','SCORING_MODEL','DECISION_ENGINE'];
function pinnedFile(root:string,pin:ArtifactPin){
 check(!isAbsolute(pin.path)&&!pin.path.split(/[\\/]/).includes('..'),'AUTHORITY_PATH_ESCAPE');
 const file=realpathSync(resolve(root,pin.path));check(file.startsWith(realpathSync(root)+sep),'AUTHORITY_PATH_ESCAPE');
 check(/^[a-f0-9]{40}$/.test(pin.sourceCommit),'AUTHORITY_SOURCE_COMMIT');
 const bytes=readFileSync(file);check(bytes.length===pin.size&&sha(bytes)===pin.sha256,'ARTIFACT_HASH_MISMATCH');return bytes;
}
/** A fixed exact-byte receipt pin is the trust anchor. Hash checks do not grant human approval.
 * This reader stages evidence only; activation remains owned by ProductionDependencies/CAS. */
export function verifyAuthorityReceipt(root:string,path:string,expectedByteHash:string):AuthorityReceipt {
 const file=realpathSync(resolve(root,path));check(!isAbsolute(path)&&file.startsWith(realpathSync(root)+sep),'AUTHORITY_PATH_ESCAPE');
 const bytes=readFileSync(file);check(bytes.length<=4_000_000&&sha(bytes)===expectedByteHash,'AUTHORITY_RECEIPT_HASH');
 const r=JSON.parse(bytes.toString('utf8')) as AuthorityReceipt;
 const {receiptSha256,...body}=r;check(snapshotHash(body)===receiptSha256,'AUTHORITY_RECEIPT_CONTENT_HASH');
 check(r.version==='production-authority-receipt-v1'&&types.includes(r.authorityType),'UNKNOWN_AUTHORITY');
 check(r.approvalState==='APPROVED'&&r.approvalMode==='OWNER_GOVERNANCE_APPROVAL','UNAPPROVED_AUTHORITY');
 check(r.effectiveState==='EFFECTIVE'&&r.activationMode==='STAGED_NOT_ACTIVATED','SUPERSEDED_OR_UNSUPPORTED_AUTHORITY');
 check(['DOCUMENT_BASELINE','EXECUTABLE_IMPLEMENTATION'].includes(r.scope),'AUTHORITY_SCOPE');
 check(r.authorityReceiptId.length>0&&/^\d+\.\d+(\.\d+)?$/.test(r.semanticVersion)&&r.compatibilityContract.length>0,'AUTHORITY_IDENTITY');
 instant(r.recordedAt);instant(r.effectiveFrom);check(r.effectiveFrom<=r.recordedAt,'AUTHORITY_EFFECTIVE_TIME');
 check(r.supersedesReceiptId===null||typeof r.supersedesReceiptId==='string'&&r.supersedesReceiptId.length>0,'AUTHORITY_SUPERSESSION');
 check(Array.isArray(r.artifacts)&&r.artifacts.length>0&&new Set(r.artifacts.map(p=>p.path)).size===r.artifacts.length,'AUTHORITY_ARTIFACT_SET');
 r.artifacts.forEach(p=>pinnedFile(root,p));
 check(Array.isArray(r.approvalEvidence)&&r.approvalEvidence.length>0,'APPROVAL_PROVENANCE_MISSING');
 for(const e of r.approvalEvidence){check(typeof e.exactStatement==='string'&&e.exactStatement.trim().length>0&&typeof e.limitation==='string'&&e.limitation.trim().length>0,'APPROVAL_PROVENANCE_MISSING');check(pinnedFile(root,e.artifact).toString('utf8').includes(e.exactStatement),'APPROVAL_EVIDENCE_STATEMENT_MISMATCH');}
 return r;
}
export interface CompatibilityProof {
 readonly pair:string;readonly leftReceiptHash:string;readonly rightReceiptHash:string;
 readonly result:'COMPATIBLE'|'INCOMPATIBLE'|'NOT_APPLICABLE'|'BLOCKED';
 readonly evidence:readonly {readonly path:string;readonly sha256:string;readonly rule:string;readonly implementation:string}[];
}
/** Fail before migration/backup/activation when a baseline has no approved executable bridge.
 * No heads, policy settings or approvals are manufactured by this preflight. */
export function requireCompleteAuthoritySet(receipts:readonly AuthorityReceipt[],proofs:readonly CompatibilityProof[],at:string){
 instant(at);
 for(const type of types){const rows=receipts.filter(r=>r.authorityType===type);check(rows.length===1,rows.length?'AMBIGUOUS_AUTHORITY':'MISSING_'+type+'_AUTHORITY');const r=rows[0];check(r.approvalState==='APPROVED'&&r.effectiveState==='EFFECTIVE'&&r.effectiveFrom<=at&&r.recordedAt<=at,'UNAPPROVED_OR_FUTURE_AUTHORITY');const {receiptSha256,...body}=r;check(snapshotHash(body)===receiptSha256,'AUTHORITY_RECEIPT_CONTENT_HASH');}
 const scoring=receipts.find(r=>r.authorityType==='SCORING_MODEL')!;
 check(scoring.scope==='EXECUTABLE_IMPLEMENTATION','SCORING_EXECUTABLE_APPROVAL_MISSING');
 for(const pair of ['POLICY:RISK_POLICY','POLICY:SCORING_MODEL','POLICY:DECISION_ENGINE','SCORING_MODEL:DECISION_ENGINE','RISK_POLICY:DECISION_ENGINE']){
  const proof=proofs.filter(p=>p.pair===pair),[left,right]=pair.split(':');
  check(proof.length===1&&proof[0].result==='COMPATIBLE'&&proof[0].leftReceiptHash===receipts.find(r=>r.authorityType===left)!.receiptSha256&&proof[0].rightReceiptHash===receipts.find(r=>r.authorityType===right)!.receiptSha256&&proof[0].evidence.length>0&&proof[0].evidence.every(e=>/^[a-f0-9]{64}$/.test(e.sha256)&&e.path.length>0&&e.rule.length>0&&e.implementation.length>0),'AUTHORITY_COMPATIBILITY_BLOCKED:'+pair);
 }
}
