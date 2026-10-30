// @vitest-environment node
import {it,expect} from 'vitest';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {verifyProductionAuthorityBundle,type FilePin} from '@/infrastructure/dependencies/production-authority';
import {LocalAcceptedDependencyCatalog} from '@/infrastructure/dependencies/catalog';
import {PrismaDependencyRegistry} from '@/infrastructure/repositories/dependencies';
import {ProductionDependencies} from '@/application/dependencies/service';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {makeRelease,ref,head} from '@/domain/dependencies/validation';
import {testDatabase} from '../fixtures/database';
const root=process.cwd();
const config=JSON.parse(readFileSync('src/infrastructure/dependencies/active-authorities.json','utf8')) as {authorityBundle:FilePin};
const P=dirname(config.authorityBundle.path);
const executable=JSON.parse(readFileSync(P+'/SCORING_EXECUTABLE_AUTHORITY.json','utf8')) as {manifest:FilePin};
const catalog=()=>new LocalAcceptedDependencyCatalog(root,{find:async()=>{throw Error('NO_ANALYSIS');},append:async()=>{throw Error('NO_ANALYSIS');},sealDecision:async()=>{throw Error('NO_DECISION');},sealRanking:async()=>{throw Error('NO_RANKING');}},()=>{throw Error('NO_LIFECYCLE_EXECUTION');});
it('real Owner-approved bundle resolves exact reviewed m64 executable and all11 static heads; no scoring',async()=>{const b=verifyProductionAuthorityBundle(root,config.authorityBundle),h=await catalog().readAccepted();expect(b.manifest.implementationId).toBe('m64-clarification-1');expect(b.manifest.categoryMaxima).toEqual({BQ:25,FH:15,GQ:15,IC:10,VAL:20,RG:10,CA:5});expect(h).toHaveLength(11);await expect(catalog().assertCurrent(h,new Date().toISOString())).resolves.toBeUndefined();});
function negative(file:string,mutate:(d:Record<string,unknown>)=>void){
 const dir=mkdtempSync(join(tmpdir(),'production-authority-negative-'));const seen=new Set<string>();
 const copy=(path:string)=>{if(seen.has(path))return;seen.add(path);const bytes=readFileSync(path);mkdirSync(dirname(join(dir,path)),{recursive:true});writeFileSync(join(dir,path),bytes);if(path.endsWith('.json')){const walk=(v:unknown)=>{if(!v||typeof v!=='object')return;if('path' in v&&'sha256' in v&&typeof v.path==='string')copy(v.path);for(const x of Object.values(v))walk(x);};walk(JSON.parse(bytes.toString()));}};
 try{copy(config.authorityBundle.path);const target=join(dir,file);if(file.endsWith('.json')){const d=JSON.parse(readFileSync(target,'utf8'));mutate(d);writeFileSync(target,JSON.stringify(d));}else writeFileSync(target,readFileSync(target,'utf8')+'\n// changed after approval\n');expect(()=>verifyProductionAuthorityBundle(dir,config.authorityBundle)).toThrow();}finally{rmSync(dir,{recursive:true,force:true});}
}
it.each([
 ['OWNER_APPROVAL_MISSING','OWNER_APPROVAL_RECEIPT.json',(d:Record<string,unknown>)=>{d.statement='';}],
 ['OWNER_APPROVAL_SCOPE_MISMATCH','OWNER_APPROVAL_RECEIPT.json',(d:Record<string,unknown>)=>{d.approvalScope='TEST_ONLY';}],
 ['SCORING_EXECUTABLE_VERSION_MISMATCH','SCORING_EXECUTABLE_AUTHORITY.json',(d:Record<string,unknown>)=>{d.semanticVersion='1.0.1';}],
 ['SCORING_EXECUTABLE_HASH_MISMATCH','SCORING_EXECUTABLE_MANIFEST.json',(d:Record<string,unknown>)=>{d.contentHash='0'.repeat(64);}],
 ['SCORING_EXECUTABLE_CHANGED_AFTER_APPROVAL','SCORING_EXECUTABLE_MANIFEST.json',(d:Record<string,unknown>)=>{d.reviewedCommit='future';}],
 ['SCORING_MODEL_EXECUTABLE_INCOMPATIBLE','SCORING_EXECUTABLE_MANIFEST.json',(d:Record<string,unknown>)=>{d.categoryMaxima={BQ:99};}],
 ['POLICY_SCORING_INCOMPATIBLE','COMPATIBILITY_POLICY_SCORING_EXECUTABLE.json',(d:Record<string,unknown>)=>{d.result='BLOCKED';}],
 ['SCORING_DECISION_INCOMPATIBLE','COMPATIBILITY_SCORING_EXECUTABLE_DECISION_ENGINE.json',(d:Record<string,unknown>)=>{d.result='INCOMPATIBLE';}],
 ['PARTIAL_AUTHORITY_BUNDLE','PRODUCTION_AUTHORITY_BUNDLE.json',(d:Record<string,unknown>)=>{d.authorities=[];}],
] as const)('%s pinned artifacts fail closed',(name,file,change)=>{void name;negative(file==='SCORING_EXECUTABLE_MANIFEST.json'?executable.manifest.path:P+'/'+file,change);});
it('actual executable source drift fails the real bundle verifier despite unchanged version text',()=>negative('src/domain/scoring/methodology/identity.ts',()=>{}));
it('new dividend dependency is pinned by approved manifest',()=>negative('src/domain/portfolio/dividend-settlement.ts',()=>{}));
it.each(['scope','manifest','statement'] as const)('rehashed receipt cannot change approved %s',field=>{
 const dir=mkdtempSync(join(tmpdir(),'authority-resealed-'));
 try{
  // Only the approval branch is needed: semantic rejection precedes artifact/proof traversal.
  const b=JSON.parse(readFileSync(config.authorityBundle.path,'utf8'));
  const ex=b.authorities.find((a:{type:string})=>a.type==='SCORING_EXECUTABLE');
  const e=JSON.parse(readFileSync(ex.artifact.path,'utf8'));
  const a=JSON.parse(readFileSync(e.ownerApproval.path,'utf8'));
  const write=(path:string,value:Record<string,unknown>)=>{const {contentHash,...body}=value;void contentHash;const sealed={...body,contentHash:hash(body)},bytes=JSON.stringify(sealed);mkdirSync(dirname(join(dir,path)),{recursive:true});writeFileSync(join(dir,path),bytes);return {sealed,pin:{path,sha256:createHash('sha256').update(bytes).digest('hex')}};};
  const copy=(p:FilePin)=>{mkdirSync(dirname(join(dir,p.path)),{recursive:true});writeFileSync(join(dir,p.path),readFileSync(p.path));};
  for(const row of b.authorities.filter((r:{type:string})=>r.type!=='SCORING_EXECUTABLE')){
   const seen=new Set<string>();const visit=(p:FilePin)=>{if(seen.has(p.path))return;seen.add(p.path);copy(p);if(p.path.endsWith('.json')){const walk=(v:unknown)=>{if(!v||typeof v!=='object')return;if('path' in v&&'sha256' in v&&typeof v.path==='string')visit(v as FilePin);Object.values(v).forEach(walk);};walk(JSON.parse(readFileSync(p.path,'utf8')));}};visit(row.artifact);
  }
  copy(e.manifest);copy(a.source);
  if(field==='scope')a.approvalScope='TEST_ONLY';
  if(field==='manifest')a.manifest.hash='0'.repeat(64);
  if(field==='statement')a.statement='Approve another version';
  e.ownerApproval=write(e.ownerApproval.path,a).pin;
  const changed=write(ex.artifact.path,e);ex.artifact=changed.pin;ex.hash=changed.sealed.contentHash;
  const updated=write(config.authorityBundle.path,b);
  expect(()=>verifyProductionAuthorityBundle(dir,updated.pin)).toThrow(field==='scope'?'OWNER_APPROVAL_SCOPE_MISMATCH':field==='manifest'?'SCORING_EXECUTABLE_HASH_MISMATCH':'OWNER_APPROVAL_MISSING');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
it('approved method registration + release/CAS bootstrap atomic; rollback leaks no method or partial heads',async()=>{const db=await testDatabase();try{const c=catalog(),heads=await c.readAccepted(),at=new Date().toISOString(),repo=new PrismaDependencyRegistry(db.client),service=new ProductionDependencies(repo,c,{now:()=>at as never},hash),method=(head(heads,'SCORING_MODEL').content as {methodology:{methodologyId:string}}).methodology;
 await db.client.$executeRawUnsafe("CREATE TRIGGER test_authority_failure BEFORE INSERT ON dependency_release BEGIN SELECT RAISE(ABORT,'injected'); END");await expect(service.activate(null,'test rollback only')).rejects.toThrow();expect(await repo.current()).toBeNull();expect(await db.client.methodologyRecord.findUnique({where:{methodologyId:method.methodologyId}})).toBeNull();expect(await db.client.dependencyObjectIdentity.count()).toBe(0);await db.client.$executeRawUnsafe('DROP TRIGGER test_authority_failure');
 const a=await service.activate(null,'disposable complete approved authority bootstrap'),r=await service.resolveProductionAnalysisDependencies({purpose:'FUNDAMENTAL_DESCRIPTION',requestedAsOf:at});expect(r.release).toEqual(ref(a));expect(await db.client.methodologyRecord.findUnique({where:{methodologyId:method.methodologyId}})).not.toBeNull();
 for(const key of ['scoringExecutable','scoringModel','policy','riskPolicy','decisionEngine','release'])await expect(service.resolveProductionAnalysisDependencies({purpose:'FUNDAMENTAL_DESCRIPTION',requestedAsOf:at,[key]:'UNAPPROVED_OLD'} as never)).rejects.toThrow('CALLER_SELECTED_STALE_HEAD');
 const b=makeRelease(heads,ref(a),at,'disposable superseding release same compatible authorities',hash);await repo.activate(b,ref(a));await expect(repo.activate(makeRelease(heads,ref(a),at,'stale CAS',hash),ref(a))).rejects.toThrow('CAS_CONFLICT');expect((await service.replayHistorical(ref(a),at)).publicationAuthority).toBe(false);expect(ref((await repo.current())!)).toEqual(ref(b));expect(await db.client.productionDependencyPublication.count()).toBe(0);expect(await db.client.marketBoundaryRecord.count({where:{kind:'ANALYSIS'}})).toBe(0);
 }finally{await db.close();}});
