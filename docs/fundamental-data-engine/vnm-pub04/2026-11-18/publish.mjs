import {readFileSync,writeFileSync,realpathSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(),out=import.meta.dirname,mode=process.argv[2];assert(['rehearse','publish','readback'].includes(mode));
const read=p=>JSON.parse(readFileSync(p,'utf8')),write=(n,v)=>writeFileSync(join(out,n),JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x,2)+'\n');
const req=createRequire('/private/tmp/vn30-step2-dependencies/package.json'),vr=createRequire(realpathSync(req.resolve('vitest/package.json'))),jr=createRequire(vr.resolve('vite/package.json')),{createJiti}=await import(pathToFileURL(jr.resolve('jiti')).href);
const jiti=createJiti(import.meta.url,{alias:{'@':join(root,'src'),'server-only':'/private/tmp/vn30-step2-dependencies/node_modules/next/dist/compiled/server-only/empty.js','@prisma/adapter-better-sqlite3':req.resolve('@prisma/adapter-better-sqlite3'),'@prisma/client/runtime/client':req.resolve('@prisma/client/runtime/client')},fsCache:false,moduleCache:true}),load=p=>jiti.import(resolve(root,p));
const {sha}=await load('src/infrastructure/source-admission/registry.ts'),{snapshotHash:hash}=await load('src/infrastructure/fundamentals/snapshot-hash.ts');
const {openDatabase}=await load('src/infrastructure/db/client.ts'),{loadDatabaseConfig}=await load('src/infrastructure/config/database.ts'),{registeredCurrentScoreReader}=await load('src/infrastructure/source-admission/registered-current-reader.ts'),{pub04Gate,PUB04_REGISTRATION,registeredCurrentPublications}=await load('src/infrastructure/source-admission/pub04-registration.ts'),{CurrentScorePublications}=await load('src/infrastructure/source-admission/current-publication.ts');
const ctx=read(join(out,'CONTEXT.json')),authority=read(PUB04_REGISTRATION),target=mode==='rehearse'?ctx.clone:ctx.target;
if(mode!=='readback')assert.equal(spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),'d1c7eb5e3d1261c76ac9ade85d2ca8ed2f00f23a');
async function snapshot(c){const schema=await c.$queryRawUnsafe('SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name'),tables={};for(const row of schema.filter(r=>r.type==='table')){const values=await c.$queryRawUnsafe('SELECT * FROM "'+row.name.replaceAll('"','""')+'"');tables[row.name]=values.map(v=>JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x)).sort();}return hash({schema,tables});}
let expected;if(mode==='publish'){assert.equal(sha(readFileSync(target)),ctx.originalSha256);const b=await openDatabase(loadDatabaseConfig({DATABASE_URL:'file:'+ctx.backup},root));try{expected=await snapshot(b);}finally{await b.$disconnect();}}
const client=await openDatabase(loadDatabaseConfig({DATABASE_URL:'file:'+target},root));let locked=false,committed=false;
const db=new Proxy(client,{get(t,k){if(k==='$transaction'&&mode!=='readback')return async fn=>{assert(locked);return fn(db);};const v=Reflect.get(t,k);return typeof v==='function'?v.bind(t):v;}});
const source=registeredCurrentScoreReader(db),gate=pub04Gate(db),service=new CurrentScorePublications(db,source,gate),checks=[];
async function rejects(name,fn,pattern){let reason;try{await fn();}catch(e){reason=String(e)+' '+JSON.stringify(e.issues??{});}assert(reason&&(!pattern||pattern.test(reason)),name+': '+reason);checks.push({name,result:'REJECTED',reason});}
async function verify(){const saved=await source.find(authority.subject.scorecardId);assert(saved);const c=saved.card,a=saved.authorization,subject={scorecardId:c.id,scorecardHash:hash(c),datasetHash:a.datasetHash,methodologyHash:a.methodologyHash,reviewHash:a.reviewHash};assert.deepEqual(subject,authority.subject);assert.equal(c.ticker,'VNM');assert.equal(c.totalScore,'43');assert.equal(c.confidence,'LOW');assert.equal(c.validity,'VALID — NON-ACTIONABLE');assert.equal(c.asOf.slice(0,10),'2026-10-30');assert.equal(a.purpose,'CURRENT_FORMAL_VALUATION');assert.equal(c.operationalAuthorizationGranted,false);const all=await db.$queryRawUnsafe('SELECT body FROM current_score_artifact');assert.equal(all.length,1,'UNREVIEWED_CURRENT_REVISION');return {saved,subject};}
try{
 if(mode==='readback')await client.$executeRawUnsafe('PRAGMA query_only=ON');
 else{
  await client.$executeRawUnsafe('PRAGMA busy_timeout=0');await client.$executeRawUnsafe('BEGIN EXCLUSIVE');locked=true;
  if(mode==='publish')assert.equal(await snapshot(client),expected,'PRODUCTION_BASELINE_CHANGED_UNDER_LOCK');
  const probe=spawnSync('python3',['-c',"import sqlite3,sys\nc=sqlite3.connect(sys.argv[1],timeout=0)\ntry:c.execute('BEGIN IMMEDIATE');sys.exit(2)\nexcept sqlite3.OperationalError as e:assert 'locked' in str(e);print('BLOCKED')",target],{encoding:'utf8'});assert.equal(probe.status,0);assert(probe.stdout.includes('BLOCKED'));
 }
 const original=await verify();await gate.verify('READ',original.subject);
 if(mode==='publish'){assert.equal(read(join(out,'REHEARSAL.json')).status,'PASS');assert.equal(read(join(out,'PUB04_PREFLIGHT_VALIDATION.json')).status,'PASS');}
 let first,second;
 if(mode!=='readback'){first=await service.publish(authority.subject.scorecardId);second=await service.publish(authority.subject.scorecardId);assert.equal(first.duplicate,false);assert.equal(second.duplicate,true);}
 if(mode==='readback'){assert.equal((await service.publish(authority.subject.scorecardId)).duplicate,true);assert.equal((await service.publish(authority.subject.scorecardId)).duplicate,true);}
 const card=await service.find(authority.subject.scorecardId),latest=await service.latest();assert.equal(latest.length,1);assert.equal(hash(card),authority.subject.scorecardHash);assert.equal(hash(latest[0]),hash(card));
 const rows=await db.analyticalArtifact.findMany(),publications=rows.filter(r=>JSON.parse(r.body).contract==='current-read-only-publication-v1');assert.equal(publications.length,1);const row=publications[0];assert.equal(row.id,authority.subject.scorecardId);
 await rejects('different ticker/subject cannot obtain publication authority',()=>gate.verify('PUBLISH',{...original.subject,scorecardId:'OTHER_TICKER'}),/PUB04_EXACT/);
 await rejects('publication grant cannot authorize materialization',()=>gate.verify('MATERIALIZE',original.subject),/PUB04_EXACT/);
 if(mode==='rehearse'){
  for(const [name,id] of [['publication revoked',row.id],['dataset revoked',original.saved.authorization.reference.bindingId],['authority revoked',gate.authorityReference]]){
   await db.$executeRawUnsafe('SAVEPOINT probe');await db.$executeRawUnsafe('INSERT INTO source_admission_event VALUES(?,?,?,?,?,?)',randomUUID(),'REVOCATION',id,new Date().toISOString(),'{}',sha('{}'));await rejects(name,()=>registeredCurrentPublications(db).latest(),/REVOKED/);await db.$executeRawUnsafe('ROLLBACK TO probe');await db.$executeRawUnsafe('RELEASE probe');assert.equal((await service.latest()).length,1);
  }
  await db.$executeRawUnsafe('SAVEPOINT latest_probe');const newer={...JSON.parse(row.body),scorecardId:'VNM_UNAUTHORIZED_NEWER',calculatedAt:'2026-11-18T23:59:59.999Z'},body=JSON.stringify(newer,Object.keys(newer).sort());await db.analyticalArtifact.create({data:{id:newer.scorecardId,kind:row.kind,asOf:row.asOf,calculatedAt:newer.calculatedAt,methodologyId:row.methodologyId,body,bodyHash:hash(newer)}});await rejects('unauthorized newest revision blocks visibility without older fallback',()=>service.latest(),/PUB04_EXACT/);await db.$executeRawUnsafe('ROLLBACK TO latest_probe');await db.$executeRawUnsafe('RELEASE latest_probe');
  const copyRoot=join(dirname(ctx.clone),'authority-negative');for(const path of [PUB04_REGISTRATION,authority.ownerSource.path]){mkdirSync(dirname(join(copyRoot,path)),{recursive:true});copyFileSync(path,join(copyRoot,path));}const tampered={...authority,status:'REVOKED'};writeFileSync(join(copyRoot,PUB04_REGISTRATION),JSON.stringify(tampered));await rejects('changed or revoked authority bytes fail closed',async()=>pub04Gate(db,copyRoot),/HASH/);rmSync(copyRoot,{recursive:true,force:true});
 }
 const result={status:'PASS',mode,target,subject:original.subject,publicationId:row.id,publicationHash:row.bodyHash,envelope:JSON.parse(row.body),first,second,oneAuthorizedVnmPublication:true,currentScoreCount:1,noScoreInvocation:true,scorecardHashUnchanged:true,latestMatchesApprovedSubject:true,authorityReference:gate.authorityReference,authorityHash:gate.authorityHash,checks,metadata:{ticker:card.ticker,score:card.totalScore,confidence:card.confidence,validity:card.validity,economicCutoff:card.asOf,knownAt:card.input.knownAt,calculatedAt:card.calculatedAt,purpose:'CURRENT_FORMAL_VALUATION'},exclusiveLock:mode!=='readback',postReadbackQueryOnly:mode==='readback',postCommitIdempotentRetry:mode==='readback'};
 if(locked){await client.$executeRawUnsafe('COMMIT');locked=false;committed=true;}
 write(mode==='rehearse'?'REHEARSAL.json':mode==='publish'?'PRODUCTION_PUBLICATION.json':'GOVERNED_READBACK.json',result);
}catch(e){if(locked){await client.$executeRawUnsafe('ROLLBACK');locked=false;}write('ATTEMPT_FAILURE_'+mode+'.json',{mode,committed,error:String(e),stack:e.stack,issues:e.issues});throw e;}finally{await client.$disconnect();}
