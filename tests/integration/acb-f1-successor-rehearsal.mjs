// Isolated integration test. The owner receipt exists only inside the disposable test root.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath,pathToFileURL} from 'node:url';

registerHooks({
 resolve(specifier,context,next){
  if(specifier==='server-only')return {url:'data:text/javascript,export%20default%20null',shortCircuit:true};
  const url=specifier.startsWith('@/')?pathToFileURL(resolve('src',specifier.slice(2))):
   specifier.startsWith('.')&&context.parentURL?new URL(specifier,context.parentURL):null;
  if(url?.protocol==='file:'){
   if(specifier.startsWith('@/') && existsSync(fileURLToPath(url)) && statSync(fileURLToPath(url)).isFile())return next(url.href,context);
   for(const suffix of ['.ts','/index.ts'])if(existsSync(fileURLToPath(url)+suffix))return next(url.href+suffix,context);
  }
  return next(specifier,context);
 },
 load(url,context,next){
  if(url.startsWith(pathToFileURL(resolve('src')+'/').href)&&url.endsWith('.json')&&
    !context.importAttributes?.type&&!(statSync(new URL(url)).st_flags&0x40000000)){
   return {format:'module',source:'export default '+readFileSync(new URL(url),'utf8'),shortCircuit:true};
  }
  return next(url,context);
 },
});
const load=p=>import(pathToFileURL(resolve(p)));
const {VersionStandingAuthority}=await load('src/infrastructure/source-admission/versioned-authority.ts');
const {availability,buildCafefCandidate,assertStandingTrust}=await load('src/infrastructure/market-boundary/cafef-standing.ts');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const f1='docs/fundamental-data-engine/vnm-f1-membership-closure/2026-11-15/';
const registryPath='docs/fundamental-data-engine/standing-authority-version/2026-11-12/VERSIONED_SOURCE_REGISTRY.json';
const rawPath='data/market-history/cafef/ACB.json';
const read=(p)=>{

 if(p.includes('1118c918fb7f.pdf')&&process.env.ACB_S4_CONTRACT_PDF)return readFileSync(process.env.ACB_S4_CONTRACT_PDF);
 if(p.includes('c92805e5efab.pdf')&&process.env.ACB_S4_BOND_PDF)return readFileSync(process.env.ACB_S4_BOND_PDF);
 if(p.startsWith('src/')||p.startsWith('prisma/')||!existsSync(p)||(statSync(p).st_flags&0x40000000)){
  for(const rev of ['HEAD','9126732^']){
   try{return execFileSync('git',['show',rev+':'+p],{stdio:['ignore','pipe','ignore'],maxBuffer:32_000_000});}catch{}
  }
 }
 return readFileSync(p);
};
const json=p=>JSON.parse(read(p));
const pin=path=>({path,sha256:hash(read(path))});
const profile=json(f1+'MARKET_PROFILE.json'), prior=json(f1+'TRUSTED_SOURCE_INPUTS_SUCCESSOR.json');
const registry=pin(registryPath), config=json(registryPath), authorization=json(profile.authorization.path);
const capture=json(rawPath);
const received=availability(capture.prices[0].receivedAt),raw=pin(rawPath);
const authorityBindings={catalogs:{cafef:[raw],pdfReceipts:[],apiReceipts:[],pdfExtractions:[],financialSemantics:[]},marketReferences:prior.marketReferences};
const root=mkdtempSync(join(tmpdir(),'acb-f1-standing-'));
const native=new DatabaseSync(join(root,'isolated.sqlite'),{readBigInts:false});
try{
 for(const p of [registry,config.ownerDecision,config.legacyAuthorizations.F1,authorization.source,
  raw,profile.policyFile,profile.authorization,profile.membership,profile.membership.identitySource,
  profile.unitSource,profile.unitReceipt,...profile.calendarSources,...profile.code]){
  const bytes=read(p.path);assert.equal(hash(bytes),p.sha256,p.path);
  const dest=join(root,p.path);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,bytes);
 }
 const authority=new VersionStandingAuthority(root,()=>registry,authorityBindings),trust=authority.marketTrust();
 const candidate=buildCafefCandidate(root,profile,{ticker:'ACB',exchange:'HOSE',date:'2026-10-30',knownAt:received,raw});
 assertStandingTrust(root,candidate,trust);
 assert.equal(candidate.market.body.observations[0].value,'21000');
 assert.equal(candidate.market.body.observations[0].securityId,'658fafbe-65b3-4176-999f-d4d32e1bd838');
 const untrusted=new VersionStandingAuthority(root,()=>registry,{...authorityBindings,catalogs:{...authorityBindings.catalogs,cafef:[]}});
 assert.throws(()=>assertStandingTrust(root,candidate,untrusted.marketTrust()),/UNVERIFIED_CAFEF_CAPTURE/);
 for(const path of ['prisma/migrations/202610190002_market_boundary/migration.sql','prisma/migrations/202611120001_market_ingest/migration.sql'])native.exec(read(path).toString());
 const db={
  $queryRawUnsafe:async(q,...args)=>native.prepare(q).all(...args),
  $executeRawUnsafe:async(q,...args)=>native.prepare(q).run(...args).changes,
  $transaction:async fn=>{native.exec('BEGIN');try{const out=await fn(db);native.exec('COMMIT');return out;}catch(e){native.exec('ROLLBACK');throw e;}},
  marketBoundaryRecord:{
   findUnique:async({where:{id}})=>native.prepare('SELECT id,kind,contract_version AS contractVersion,created_at AS createdAt,body,body_hash AS bodyHash FROM market_boundary_record WHERE id=?').get(id),
   create:async({data:d})=>native.prepare('INSERT INTO market_boundary_record VALUES(?,?,?,?,?,?)').run(d.id,d.kind,d.contractVersion,d.createdAt,d.body,d.bodyHash),
  },
 };
 const {withRegisteredAcbF1Admission}=await load('app/server/acb-bank-admission.ts');
 const {acbF1RuntimeApprovalHash}=await load('app/server/acb-f1-runtime.ts');
 const bp='docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/bank-admission/';
 const routePin=pin(bp+'ACB_ADMISSION_ROUTE_REGISTERED.json'),route=json(routePin.path);
 const v=json(route.version.path),catalog=json(v.catalog.path),policy=json(v.standingPolicy.path);
 const review=json(route.shares.path);
 for(const p of [routePin,route.version,route.requirements,route.shares,route.market.profile,
  route.market.trustedReferences,route.market.receipt,v.catalog,v.standingPolicy,policy.source,v.ownerSource,
  ...v.code,...review.inventoryPins,...review.reviewedPotentialEvents,
  ...catalog.documents.map(d=>({path:d.receiptPath,sha256:d.receiptHash}))]){
  const bytes=read(p.path);
  assert.equal(hash(bytes),p.sha256,p.path);
  const dest=join(root,p.path);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,bytes);
 }
 for(const d of catalog.documents){
  const bytes=d.id==='564804'&&process.argv[2]?readFileSync(process.argv[2]):read(d.path);
  assert.equal(hash(bytes),d.sha256,d.path);
  const dest=join(root,d.path);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,bytes);
 }
 native.exec(read('prisma/proposals/current-financial-dataset-v1.sql').toString());
 native.exec('CREATE TABLE source_admission_event(id TEXT,kind TEXT,target_id TEXT)');
 const proposalPath='docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/f1-successor/F1_RUNTIME_PROPOSED.json';
 const proposal=json(proposalPath);
 const put=(path,bytes)=>{
  const dest=join(root,path);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,bytes);
  return {path,sha256:hash(bytes)};
 };
 for(const p of [...proposal.localPins,...proposal.runtime]){
  const bytes=read(p.path);assert.equal(hash(bytes),p.sha256,p.path);put(p.path,bytes);
 }
 rmSync(join(root,'scripts'),{recursive:true,force:true});
 put('.git','gitdir: '+resolve('.git')+'\n');
 const proposalPin=put(proposalPath,read(proposalPath));
 const clock={now:()=>route.recordedAt};
 const call=(p,fn)=>withRegisteredAcbF1Admission(db,root,p,fn,clock);
 await assert.rejects(call(proposalPin,async()=>{throw Error('unexpected callback');}),/ACB_F1_SUCCESSOR_APPROVAL_REQUIRED/);
 const approvalHash=acbF1RuntimeApprovalHash(proposal);
 const wrongOwner=put('isolated-wrong.txt','Unrelated authorization');
 const wrongApproval=put('isolated-wrong.json',JSON.stringify({...proposal,status:'APPROVED',ownerSource:wrongOwner}));
 await assert.rejects(call(wrongApproval,async()=>{throw Error('unexpected callback');}),/ACB_F1_SUCCESSOR_OWNER_HASH_REQUIRED/);
 const syntheticOwner=put('isolated-synthetic-owner.txt','Approve exact ACB F1 pinned runtime '+approvalHash+' for 2026-10-30\n');
 const fixture=put('isolated-approved.json',JSON.stringify({...proposal,status:'APPROVED',ownerSource:syntheticOwner}));
 const verified=await call(fixture,async liveRoute=>{
  assert.equal(native.prepare('SELECT count(*) n FROM market_boundary_ingest_link').get().n,0);
  const row=await liveRoute.materialize();
  assert.equal(native.prepare('SELECT count(*) n FROM market_boundary_ingest_link').get().n,1);
  assert.deepEqual(await liveRoute.materialize(),row);
  native.exec('PRAGMA query_only=ON');
  const data=await liveRoute.consume(row.datasetId,liveRoute.scope);
  assert.equal(row.datasetHash,data.datasetHash);
  assert.equal(data.facts.length,14);
  assert.equal(data.shares.value,'5804421957');assert.equal(data.price.value,'21000');
  await assert.rejects(liveRoute.consume(row.datasetId,{...liveRoute.scope,ticker:'VNM'}),/ACB_DATASET_CONTEXT/);
  return {row,price:data.price.value,shares:data.shares.value,facts:data.facts.length};
 });
 assert.equal(existsSync(join(root,proposal.archive.path)),false);
 console.log(JSON.stringify({status:'PASS_F1_PIN_SUCCESSOR_ISOLATED',approvalHash,
  proposedRejected:true,mismatchedOwnerReceiptRejected:true,ownerProof:'SYNTHETIC_TEST_ONLY',
  isolatedDatasetHash:verified.row.datasetHash,facts:verified.facts,price:verified.price,shares:verified.shares,
  duplicatePass:true,queryOnlyReadback:true,crossScopeRejected:true,
  originalScriptRestored:false,activeDatabaseChanged:false,officialDatasetHash:null},null,2));
}finally{native.close();rmSync(root,{recursive:true,force:true});}
