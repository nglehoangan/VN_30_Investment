// Existing approved F1 lifecycle, new qualified reference pins, disposable DB.
import {readFileSync,writeFileSync,realpathSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';import {tmpdir} from 'node:os';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
const root=process.cwd(),out=resolve('docs/fundamental-data-engine/vnm-f1-membership-closure/2026-11-15'),base='docs/fundamental-data-engine/standing-authority-version/2026-11-12',read=p=>JSON.parse(readFileSync(p,'utf8'));
const vr=createRequire(realpathSync('node_modules/vitest/package.json')),jr=createRequire(vr.resolve('vite/package.json')),{createJiti}=await import(pathToFileURL(jr.resolve('jiti')).href);
const jiti=createJiti(import.meta.url,{alias:{'@':resolve(root,'src'),'server-only':resolve(root,'node_modules/next/dist/compiled/server-only/empty.js')},fsCache:false,moduleCache:true}),load=p=>jiti.import(resolve(root,p));
const {sha}=await load('src/infrastructure/source-admission/registry.ts'),{snapshotHash:hash}=await load('src/infrastructure/fundamentals/snapshot-hash.ts');
const {VersionStandingAuthority}=await load('src/infrastructure/source-admission/versioned-authority.ts');const {buildCafefCandidate,consumeCafefValuation,checkProfile}=await load('src/infrastructure/market-boundary/cafef-standing.ts');const {ingestCafef}=await load('app/server/cafef-standing-services.ts');
const {openDatabase}=await load('src/infrastructure/db/client.ts'),{loadDatabaseConfig}=await load('src/infrastructure/config/database.ts'),{PrismaBoundaryStore}=await load('src/infrastructure/repositories/market-boundary.ts');
const pin=path=>({path,sha256:sha(readFileSync(path))}),registry=pin(base+'/VERSIONED_SOURCE_REGISTRY.json'),bindings=read(join(out,'TRUSTED_SOURCE_INPUTS_SUCCESSOR.json')),profile=read(join(out,'MARKET_PROFILE.json')),at=profile.knownAt;
const authority=new VersionStandingAuthority(root,()=>registry,bindings),trust=authority.marketTrust(),spec={raw:bindings.catalogs.cafef[0],ticker:'VNM',exchange:'HOSE',date:'2026-10-30',knownAt:at},candidate=buildCafefCandidate(root,profile,spec);
assert.equal(candidate.market.body.observations[0].value,'56900');assert.equal(hash(candidate),hash(buildCafefCandidate(root,profile,spec)));
const checks=[];async function rejects(name,fn,re){let reason;try{await fn();}catch(e){reason=String(e)+(e?.issues?' | '+e.issues.map(i=>i.reason).join('|'):'');}assert(reason&&re.test(reason),name+':'+reason);checks.push({name,status:'PASS',reason});}
await rejects('caller cannot extend coverage beyond qualified asOf',()=>checkProfile(root,{...profile,membership:{...profile.membership,through:'2027-02-01'}}),/MEMBERSHIP_COVERAGE_BINDING/);
await rejects('old16Oct coverage still rejects30Oct',()=>buildCafefCandidate(root,read(base+'/REAL_MARKET_PROFILE.json'),spec),/VN30_MEMBERSHIP_OUTSIDE_VERIFIED_INTERVAL/);
await rejects('wrong raw source hash',()=>buildCafefCandidate(root,profile,{...spec,raw:{...spec.raw,sha256:'0'.repeat(64)}}),/SOURCE_HASH_MISMATCH/);
await rejects('missing member cannot pass',()=>checkProfile(root,{...profile,membership:{...profile.membership,members:profile.membership.members.filter(m=>m.ticker!=='VNM')}}),/VN30_COVERAGE/);
const dir=mkdtempSync(join(tmpdir(),'vnm-f1-membership-'));let db;
try{
 db=await openDatabase(loadDatabaseConfig({DATABASE_URL:'file:'+join(dir,'f1.sqlite')},root));
 for(const path of ['prisma/migrations/202610190002_market_boundary/migration.sql','prisma/migrations/202611120001_market_ingest/migration.sql'])for(const sql of readFileSync(path,'utf8').match(/CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|UNIQUE INDEX|INDEX)[\s\S]*?;/g)??[])await db.$executeRawUnsafe(sql);
 const repo=new PrismaBoundaryStore(db),clock={now:()=>at},before=await db.marketBoundaryRecord.count();
 const result=await ingestCafef(root,repo,'vnm-f1-membership-closure',[candidate],trust);assert.equal(result.accepted.length,1);
 const after=await db.marketBoundaryRecord.count(),duplicate=await ingestCafef(root,repo,'vnm-f1-membership-replay',[candidate],trust);assert.equal(duplicate.duplicates.length,1);assert.equal(await db.marketBoundaryRecord.count(),after);
 const request={mode:'HISTORICAL',requestedAt:candidate.market.body.requestedAsOf,knownAt:at,now:at,purpose:'VALUATION',securityIds:[candidate.market.body.observations[0].securityId],universe:candidate.market.body.universe};
 const consumed=await consumeCafefValuation(root,candidate,trust,repo,request,clock);assert.equal(consumed.observation.value,'56900');assert.equal(consumed.freshness.status,'PASS');
 const oldAuthority=new VersionStandingAuthority(root,()=>registry,read(base+'/TRUSTED_SOURCE_INPUTS.json'));
 await rejects('old host pins do not accept arbitrary new membership references',()=>consumeCafefValuation(root,candidate,oldAuthority.marketTrust(),repo,request,clock),/UNTRUSTED_MARKET_REFERENCE/);
 await rejects('wrong consumer purpose',()=>consumeCafefValuation(root,candidate,trust,repo,{...request,purpose:'TRADING'},clock),/PURPOSE|CONSUMPTION|VALUATION/);
 const artifact={contract:'vnm-f1-membership-runtime-v1',ticker:'VNM',economicDate:'2026-10-30',knownAt:at,status:'ADMITTED_AND_CONSUMED',membershipCoverage:{from:profile.membership.from,through:profile.membership.through,reference:profile.membership},authority:registry,adapterCodeUnchanged:true,rawClose:{value:consumed.observation.value,unit:consumed.observation.unit,adjustment:consumed.observation.adjustment,pointer:consumed.observation.pointer},freshness:consumed.freshness.status,accepted:result.accepted,duplicate:duplicate.duplicates,counts:{before,after,afterDuplicate:await db.marketBoundaryRecord.count()},candidateReplayHash:hash(candidate),negativeChecks:checks,liveDatabaseChanged:false,historicalPITGranted:false,productionActivation:'NOT_AUTHORIZED',F2Changed:false,datasetBindingGranted:false};
 writeFileSync(join(out,'REAL_F1_ADMISSION.json'),JSON.stringify(artifact,null,2)+'\n');console.log(JSON.stringify({status:artifact.status,value:artifact.rawClose.value,records:after,negativeChecks:checks.length}));
}finally{if(db)await db.$disconnect();rmSync(dir,{recursive:true,force:true});}
