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
const {availability,buildCafefCandidate,assertStandingTrust,consumeCafefValuation}=await load('src/infrastructure/market-boundary/cafef-standing.ts');
const {PrismaBoundaryStore}=await load('src/infrastructure/repositories/market-boundary.ts');
const {ingestCafef}=await load('app/server/cafef-standing-services.ts');
const {snapshotHash}=await load('src/infrastructure/fundamentals/snapshot-hash.ts');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const f1='docs/fundamental-data-engine/vnm-f1-membership-closure/2026-11-15/';
const registryPath='docs/fundamental-data-engine/standing-authority-version/2026-11-12/VERSIONED_SOURCE_REGISTRY.json';
const rawPath='data/market-history/cafef/ACB.json';
const read=(p)=>{
 if(!existsSync(p)||(statSync(p).st_flags&0x40000000)){
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
 const repo=new PrismaBoundaryStore(db,{now:()=>received});
 const result=await ingestCafef(root,repo,'acb-f1-isolated',[candidate],trust);
 assert.equal(result.accepted.length,1);
 const duplicate=await ingestCafef(root,repo,'acb-f1-isolated-retry',[candidate],trust);
 assert.equal(duplicate.duplicates.length,1);
 const request={mode:'HISTORICAL',requestedAt:candidate.market.body.requestedAsOf,knownAt:received,now:received,purpose:'VALUATION',securityIds:[candidate.market.body.observations[0].securityId],universe:candidate.market.body.universe};
 const consumed=await consumeCafefValuation(root,candidate,trust,repo,request,{now:()=>received});
 assert.equal(consumed.observation.value,'21000');assert.equal(consumed.freshness.status,'PASS');
 assert.equal(await repo.revokeMarketRun('acb-f1-isolated',received,'ISOLATED_REVOCATION_TEST'),1);
 await assert.rejects(consumeCafefValuation(root,candidate,trust,repo,request,{now:()=>received}),/MARKET_INGEST_REVOKED/);
 console.log(JSON.stringify({status:'PASS_F1_ADMITTED_CONSUMED_ISOLATED',ticker:'ACB',date:request.requestedAt.slice(0,10),securityId:request.securityIds[0],knownAt:received,raw,
  responseHash:candidate.provenance.responseSha256,marketId:candidate.market.id,marketHash:candidate.market.contentHash,
  candidateHash:snapshotHash(candidate),value:consumed.observation.value,unit:consumed.observation.unit,freshness:consumed.freshness.status,
  idempotency:true,untrustedCaptureRejected:true,revocationBlockedReadback:true,activeDatabaseChanged:false,historicalPIT:false},null,2));
}finally{native.close();rmSync(root,{recursive:true,force:true});}
