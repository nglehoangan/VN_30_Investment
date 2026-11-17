/** Test a text-only proposal in a disposable source directory; no owner approval is created. */
import {readFileSync,writeFileSync,realpathSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';import {resolve,join,dirname} from 'node:path';import {tmpdir} from 'node:os';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const root=process.cwd(),out=import.meta.dirname,dep=process.argv[2]??root,vr=createRequire(realpathSync(join(dep,'node_modules/vitest/package.json'))),jr=createRequire(vr.resolve('vite/package.json')),{createJiti}=await import(pathToFileURL(jr.resolve('jiti')).href);
const jiti=createJiti(import.meta.url,{alias:{'@':resolve(root,'src')},fsCache:false,moduleCache:true});
const {snapshotHash:hash}=await jiti.import(resolve('src/infrastructure/fundamentals/snapshot-hash.ts')),{approvedExecutableFixture}=await jiti.import(resolve('tests/fixtures/step3-approved-executable.ts'));
const dir=mkdtempSync(join(tmpdir(),'step3-unapproved-verifier-text-'));let f;
try{
 const file=join(dir,'production-authority.ts');writeFileSync(file,readFileSync(join(out,'proposed/production-authority.ts.txt')));writeFileSync(join(dir,'authority-receipts.ts'),readFileSync('src/infrastructure/dependencies/authority-receipts.ts'));
 const {verifyProductionAuthorityBundle:verify}=await jiti.import(file);f=approvedExecutableFixture();assert.equal(verify(f.root,f.config.authorityBundle).manifest.contentHash,'8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1');
 const cases=[];
 for(const r of f.comparison.mismatches){const target=join(f.root,r.path),saved=readFileSync(target);writeFileSync(target,readFileSync(r.path));let error;try{verify(f.root,f.config.authorityBundle);}catch(e){error=String(e);}assert(error?.includes(r.path));cases.push({path:r.path,status:'REJECTED',error});writeFileSync(target,saved);}
 const b=JSON.parse(readFileSync(join(f.root,f.config.authorityBundle.path),'utf8')),ex=b.authorities.find(a=>a.type==='SCORING_EXECUTABLE'),e=JSON.parse(readFileSync(join(f.root,ex.artifact.path),'utf8')),candidate=JSON.parse(readFileSync(join(out,'PROPOSED_EXECUTABLE_REVIEW_MANIFEST.json'),'utf8'));
 const put=(path,value)=>{const {contentHash:ignored,...body}=value;const obj={...body,contentHash:hash(body)},bytes=JSON.stringify(obj);mkdirSync(dirname(join(f.root,path)),{recursive:true});writeFileSync(join(f.root,path),bytes);return {obj,pin:{path,sha256:createHash('sha256').update(bytes).digest('hex')}};};
 e.manifest=put('SYNTHETIC_NEGATIVE_ONLY/candidate.json',candidate).pin;
 const changed=put(ex.artifact.path,e);ex.artifact=changed.pin;ex.hash=changed.obj.contentHash;
 const changedBundle=put(f.config.authorityBundle.path,b);let error;try{verify(f.root,changedBundle.pin);}catch(e){error=String(e);}assert(error?.includes('OWNER_APPROVAL_MISSING'));
 const result={proposalAppliedToLive:false,oldApprovedTupleStillPasses:true,oldTupleStillRejectsAllFiveChangedFiles:cases,newManifestCannotInheritOldOwnerApproval:{status:'REJECTED',error},futureOwnerApprovalManufactured:false,productionActivated:false};
 writeFileSync(join(out,'PROPOSED_VERIFIER_CONTROLS.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({oldApprovedPass:true,currentChangedFilesRejected:cases.length,newManifestOldApproval:'REJECTED',applied:false}));
}finally{f?.close();rmSync(dir,{recursive:true,force:true});}
