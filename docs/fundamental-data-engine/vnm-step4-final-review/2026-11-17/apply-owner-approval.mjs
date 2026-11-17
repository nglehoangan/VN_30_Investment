/** Run only after the owner actually supplies the exact approval statement.
 * Append-only governance evidence; never changes active config, live DB or production CAS. */
import {readFileSync,writeFileSync,realpathSync,existsSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(),out=import.meta.dirname,read=p=>JSON.parse(readFileSync(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex'),pin=path=>({path:relative(root,path),sha256:sha(readFileSync(path))});
const rawPath=join(out,'OWNER_APPROVAL_VERBATIM.txt');assert(existsSync(rawPath),'Actual owner reply has not been captured; no approval is inferred from a fix request.');
const proposalPath=join(out,'CURRENT_EXECUTABLE_REVIEW_PACKET.json'),proposal=read(proposalPath),draft=read(join(out,'PROPOSED_METHODOLOGY.json'));
const statement=`Approve exact current-purpose scoring authority ${proposal.approvalPayloadHash} for CURRENT_FORMAL_VALUATION`;
assert.equal(readFileSync(rawPath,'utf8').trim(),statement,'Exact owner authorization required; do not substitute assistant text.');
for(const p of proposal.code)assert.equal(sha(readFileSync(resolve(root,p.path))),p.sha256);
const vr=createRequire(realpathSync('/private/tmp/vn30-step2-dependencies/node_modules/vitest/package.json')),jr=createRequire(vr.resolve('vite/package.json')),{createJiti}=await import(pathToFileURL(jr.resolve('jiti')).href);
const jiti=createJiti(import.meta.url,{alias:{'@':resolve(root,'src'),'server-only':resolve(root,'node_modules/next/dist/compiled/server-only/empty.js')},fsCache:false,moduleCache:true});
const {applyCurrentAuthorityProposal,PinnedCurrentExecutableAuthority}=await jiti.import(resolve('src/infrastructure/source-admission/current-scoring-authority.ts'));
const recordedAt=new Date().toISOString(),receiptPath=join(out,'OWNER_APPROVAL_RECEIPT.json');
const receipt={contract:'current-scoring-owner-approval-v1',ownerAuthority:'PROJECT_OWNER',statement,recordedAt,ownerMessageTimestamp:null,meaning:'Actual receipt recording time; exact message send timestamp unavailable. No cryptographic signature or independent-human assessment claimed.',source:pin(rawPath),reviewProposal:pin(proposalPath),scope:'CURRENT_SCORING_EXECUTABLE_VERSION',productionActivated:false};
writeFileSync(receiptPath,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
const applied=applyCurrentAuthorityProposal(proposal,draft,pin(receiptPath),recordedAt);
const methodPath=join(out,'APPROVED_METHODOLOGY.json'),authorityPath=join(out,'APPROVED_CURRENT_AUTHORITY.json');
writeFileSync(methodPath,JSON.stringify(applied.method,null,2)+'\n',{flag:'wx'});writeFileSync(authorityPath,JSON.stringify(applied.authority,null,2)+'\n',{flag:'wx'});
await new PinnedCurrentExecutableAuthority(root,pin(authorityPath),{now:()=>new Date().toISOString()}).verify(applied.method);
writeFileSync(join(out,'APPLIED_VERSION_VERIFICATION.json'),JSON.stringify({status:'PASS',approvalPayloadHash:proposal.approvalPayloadHash,authority:pin(authorityPath),methodology:pin(methodPath),ownerReceipt:pin(receiptPath),oldManifestRehashed:false,activeConfigChanged:false,liveDatabaseChanged:false,casActivated:false,productionActivated:false,assessmentAdoptionGranted:false},null,2)+'\n',{flag:'wx'});
console.log('Exact approved version verified; no activation or assessment admission.');
