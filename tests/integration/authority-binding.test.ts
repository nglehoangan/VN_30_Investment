// @vitest-environment node
import {describe,it,expect} from 'vitest';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyAuthorityReceipt,requireCompleteAuthoritySet,type AuthorityReceipt,type CompatibilityProof} from '@/infrastructure/dependencies/authority-receipts';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
const P='docs/fundamental-data-engine/evidence/2026-10-20-production-authority-binding-activation/';
const files=['POLICY_AUTHORITY.json','RISK_POLICY_AUTHORITY.json','SCORING_MODEL_AUTHORITY.json','DECISION_ENGINE_AUTHORITY.json'];
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const receipts=()=>files.map(f=>verifyAuthorityReceipt(process.cwd(),P+f,sha(readFileSync(P+f))));
const at='2099-01-01T00:00:00.000Z';
function fixture(run:(root:string,path:string,r:AuthorityReceipt,save:(r:AuthorityReceipt)=>string)=>void){
 const root=mkdtempSync(join(tmpdir(),'authority-binding-')),path='receipt.json',r=receipts()[0];
 try{for(const p of [...r.artifacts,...r.approvalEvidence.map(e=>e.artifact)]){mkdirSync(dirname(join(root,p.path)),{recursive:true});writeFileSync(join(root,p.path),readFileSync(p.path));}
 const save=(r:AuthorityReceipt)=>{const {receiptSha256,...body}=r;void receiptSha256;const bytes=Buffer.from(JSON.stringify({...body,receiptSha256:snapshotHash(body)}));writeFileSync(join(root,path),bytes);return sha(bytes);};save(r);run(root,path,r,save);
 }finally{rmSync(root,{recursive:true,force:true});}
}
/** Synthetic compatibility probes below are structural preflight tests only.
 * They do not register or approve the real m64 implementation, nor execute scores. */
function synthetic(){const rs=structuredClone(receipts());rs[2]={...rs[2],scope:'EXECUTABLE_IMPLEMENTATION'};const {receiptSha256,...body}=rs[2];void receiptSha256;rs[2]={...body,receiptSha256:snapshotHash(body)};const pairs=['POLICY:RISK_POLICY','POLICY:SCORING_MODEL','POLICY:DECISION_ENGINE','SCORING_MODEL:DECISION_ENGINE','RISK_POLICY:DECISION_ENGINE'];
 const proofs:CompatibilityProof[]=pairs.map(pair=>{const [l,r]=pair.split(':');return {pair,leftReceiptHash:rs.find(x=>x.authorityType===l)!.receiptSha256,rightReceiptHash:rs.find(x=>x.authorityType===r)!.receiptSha256,result:'COMPATIBLE',evidence:[{path:'TEST_ONLY',sha256:'a'.repeat(64),rule:'SYNTHETIC ONLY',implementation:'SYNTHETIC ONLY'}]};});return {rs,proofs};}
describe('authority binding: staging cannot grant executable approval',()=>{
 it('replays all four exact receipts; scoring remains documentary baseline only',()=>{const rs=receipts();expect(rs.map(r=>r.semanticVersion)).toEqual(['1.1','1.0','1.0','1.0.2']);expect(rs[2].scope).toBe('DOCUMENT_BASELINE');expect(()=>requireCompleteAuthoritySet(rs,[],at)).toThrow('SCORING_EXECUTABLE_APPROVAL_MISSING');});
 for(const type of ['POLICY','RISK_POLICY','SCORING_MODEL','DECISION_ENGINE'])it('MISSING_'+type+'_AUTHORITY',()=>{expect(()=>requireCompleteAuthoritySet(receipts().filter(r=>r.authorityType!==type),[],at)).toThrow('MISSING_'+type+'_AUTHORITY');});
 it('AMBIGUOUS_AUTHORITY',()=>{const rs=receipts();expect(()=>requireCompleteAuthoritySet([...rs,rs[0]],[],at)).toThrow('AMBIGUOUS_AUTHORITY');});
 it('UNAPPROVED_AUTHORITY and future authority',()=>{const rs=receipts();expect(()=>requireCompleteAuthoritySet([{...rs[0],approvalState:'PROPOSED'} as unknown as AuthorityReceipt,...rs.slice(1)],[],at)).toThrow('UNAPPROVED_OR_FUTURE_AUTHORITY');expect(()=>requireCompleteAuthoritySet(rs,[],'2000-01-01T00:00:00.000Z')).toThrow('UNAPPROVED_OR_FUTURE_AUTHORITY');});
 it('receipt byte/hash mismatch',()=>{expect(()=>verifyAuthorityReceipt(process.cwd(),P+files[0],'0'.repeat(64))).toThrow('AUTHORITY_RECEIPT_HASH');});
 it('receipt content hash mismatch despite new byte hash',()=>fixture((root,path,r)=>{const bytes=Buffer.from(JSON.stringify({...r,semanticVersion:'9.9'}));writeFileSync(join(root,path),bytes);expect(()=>verifyAuthorityReceipt(root,path,sha(bytes))).toThrow('AUTHORITY_RECEIPT_CONTENT_HASH');}));
 it('ARTIFACT_HASH_MISMATCH even when receipt stays intact',()=>fixture((root,path,r,save)=>{const hash=save(r);writeFileSync(join(root,r.artifacts[0].path),'altered policy');expect(()=>verifyAuthorityReceipt(root,path,hash)).toThrow('ARTIFACT_HASH_MISMATCH');}));
 it('APPROVAL_PROVENANCE_MISSING cannot be repaired by rehashing',()=>fixture((root,path,r,save)=>{const hash=save({...r,approvalEvidence:[]});expect(()=>verifyAuthorityReceipt(root,path,hash)).toThrow('APPROVAL_PROVENANCE_MISSING');}));
 it('approval evidence statement and source commit shape are checked',()=>fixture((root,path,r,save)=>{const hash=save({...r,approvalEvidence:r.approvalEvidence.map(e=>({...e,exactStatement:'FAKE APPROVAL'}))});expect(()=>verifyAuthorityReceipt(root,path,hash)).toThrow('APPROVAL_EVIDENCE_STATEMENT_MISMATCH');const bad=save({...r,artifacts:r.artifacts.map(p=>({...p,sourceCommit:'latest'}))});expect(()=>verifyAuthorityReceipt(root,path,bad)).toThrow('AUTHORITY_SOURCE_COMMIT');}));
 it('unapproved/superseded receipt and path escape fail closed',()=>fixture((root,path,r,save)=>{const bad=save({...r,approvalState:'DRAFT'} as unknown as AuthorityReceipt);expect(()=>verifyAuthorityReceipt(root,path,bad)).toThrow('UNAPPROVED_AUTHORITY');const superseded=save({...r,effectiveState:'SUPERSEDED'} as unknown as AuthorityReceipt);expect(()=>verifyAuthorityReceipt(root,path,superseded)).toThrow('SUPERSEDED_OR_UNSUPPORTED_AUTHORITY');const escape=save({...r,artifacts:r.artifacts.map(p=>({...p,path:'../outside'}))});expect(()=>verifyAuthorityReceipt(root,path,escape)).toThrow('AUTHORITY_PATH_ESCAPE');}));
 for(const pair of ['POLICY:RISK_POLICY','POLICY:SCORING_MODEL','POLICY:DECISION_ENGINE','SCORING_MODEL:DECISION_ENGINE','RISK_POLICY:DECISION_ENGINE'])it(pair+' incompatibility/missing evidence/hash mismatch fail closed',()=>{const {rs,proofs}=synthetic();expect(()=>requireCompleteAuthoritySet(rs,proofs,at)).not.toThrow();for(const change of [{result:'INCOMPATIBLE' as const},{result:'BLOCKED' as const},{evidence:[]},{leftReceiptHash:'0'.repeat(64)}])expect(()=>requireCompleteAuthoritySet(rs,proofs.map(p=>p.pair===pair?{...p,...change}:p),at)).toThrow('AUTHORITY_COMPATIBILITY_BLOCKED:'+pair);});
});
