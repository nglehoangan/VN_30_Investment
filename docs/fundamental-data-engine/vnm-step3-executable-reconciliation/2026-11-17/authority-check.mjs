import {readFileSync,writeFileSync,realpathSync} from 'node:fs';import {resolve,join} from 'node:path';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root=process.cwd(),out=import.meta.dirname,dep=process.argv[2]??root;
const vr=createRequire(realpathSync(join(dep,'node_modules/vitest/package.json'))),jr=createRequire(vr.resolve('vite/package.json')),{createJiti}=await import(pathToFileURL(jr.resolve('jiti')).href);
const jiti=createJiti(import.meta.url,{alias:{'@':resolve(root,'src'),'server-only':resolve(root,'node_modules/next/dist/compiled/server-only/empty.js')},fsCache:false,moduleCache:true});
const {verifyProductionAuthorityBundle}=await jiti.import(resolve(root,'src/infrastructure/dependencies/production-authority.ts'));
const {approvedExecutableFixture}=await jiti.import(resolve(root,'tests/fixtures/step3-approved-executable.ts'));
const config=JSON.parse(readFileSync('src/infrastructure/dependencies/active-authorities.json','utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const f=approvedExecutableFixture();
function verify(dir){try{const v=verifyProductionAuthorityBundle(dir,config.authorityBundle);return {status:'PASS',manifest:v.manifest.contentHash,bundle:v.bundle.contentHash};}catch(e){return {status:'BLOCKED',error:String(e),issues:e.issues??null};}}
try{
 const before=verify(root);assert.equal(before.status,'BLOCKED');
 const approvedControl=verify(f.root);assert.equal(approvedControl.status,'PASS');
 const independent=[];
 for(const row of f.comparison.mismatches){const p=join(f.root,row.path),b=readFileSync(p);writeFileSync(p,readFileSync(row.path));const result=verify(f.root);assert.equal(result.status,'BLOCKED');assert(result.error.includes(row.path));independent.push({path:row.path,...result});writeFileSync(p,b);}
 const after=verify(root);assert.deepEqual(after,before);
 const result={before,after,approvedBytesControl:{...approvedControl,environment:'COUNTERFACTUAL_TEMP_ROOT_ONLY_NOT_LIVE_RESTORATION'},independent,liveSourceRestored:false,activeConfigurationChanged:false,verifierChanged:false,verifier:{path:'src/infrastructure/dependencies/production-authority.ts',sha256:sha(readFileSync('src/infrastructure/dependencies/production-authority.ts'))},activeConfig:{path:'src/infrastructure/dependencies/active-authorities.json',sha256:sha(readFileSync('src/infrastructure/dependencies/active-authorities.json'))},authorizedChangeApplied:false};
 writeFileSync(join(out,'VERIFIER_BEFORE_AFTER.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({before:before.status,after:after.status,approvedControl:approvedControl.status,independentRejections:independent.length}));
}finally{f.close();}
