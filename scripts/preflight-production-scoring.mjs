/** Read-only runtime probe. Does not create acceptances, scores or dependency heads. */
import './lib/ts-runtime.mjs';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {LocalAcceptedDependencyCatalog}=await import('../src/infrastructure/dependencies/catalog.ts');
const {ProductionDependencies}=await import('../src/application/dependencies/service.ts');
const {readRelease,ref}=await import('../src/domain/dependencies/validation.ts');
const {snapshotHash}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');

const at=new Date().toISOString(),path='data/vn30.sqlite';
const digest=()=>createHash('sha256').update(readFileSync(path)).digest('hex');
const before=digest(),db=new DatabaseSync(path,{readOnly:true});
const deny=async()=>{throw Error('READ_ONLY_PREFLIGHT');};
try{
 const registry={
  current:async()=>{
   const row=db.prepare('SELECT r.body,r.body_hash FROM dependency_release r JOIN market_boundary_dependency_head h ON h.body_hash=r.body_hash WHERE h.id=?').get('production-dependencies-v1');
   if(!row)return null;
   const release=readRelease(JSON.parse(row.body),snapshotHash);
   if(release.contentHash!==row.body_hash)throw Error('RELEASE_HASH_MISMATCH');
   return release;
  },activate:deny,publish:deny,publication:deny,find:deny,
 };
 const catalog=new LocalAcceptedDependencyCatalog(process.cwd(),{find:deny,append:deny,sealDecision:deny,sealRanking:deny},()=>{throw Error('READ_ONLY_PREFLIGHT');});
 const service=new ProductionDependencies(registry,catalog,{now:()=>at},snapshotHash);
 const probes=[];
 for(const purpose of ['FUNDAMENTAL_DESCRIPTION','VALUATION']){
  try{const r=await service.resolveProductionAnalysisDependencies({purpose,requestedAsOf:at});probes.push({purpose,status:'PASS',release:r.release});}
  catch(error){probes.push({purpose,status:'BLOCKED',reason:error.message});}
 }
 const release=await registry.current();
 if(!release)throw Error('MISSING_HEAD');
 const partition=release.heads.find(h=>h.type==='LEVEL1_RELEASE').content.partition;
 const count=t=>db.prepare('SELECT count(*) AS n FROM '+t).get().n;
 const acceptanceCount=count('data_initialization_acceptance');
 const blockers=[];
 if(probes.some(p=>p.status==='BLOCKED'))blockers.push('PRODUCTION_DEPENDENCY_RESOLUTION_BLOCKED');
 if(!acceptanceCount)blockers.push('FORMAL_SCORING_DATASET_ACCEPTANCE_MISSING');
 const capturePath=process.argv[2];
 const capture=capturePath?JSON.parse(readFileSync(capturePath,'utf8')):null;
 if(capture&&capture.state!=='CAPTURED_NOT_QUALIFIED')blockers.push('MARKET_REFRESH_FAILED:'+capture.state);
 const report={contract:'production-scoring-preflight-v1',attemptedAt:at,status:blockers.length?'BLOCKED':'PREFLIGHT_ONLY_NOT_SCORING_AUTHORIZATION',
  release:ref(release),probes,blockers,marketCapture:capture?{path:capturePath,state:capture.state,requests:capture.requests.length}:null,
  fullUniverse:partition.members.length,eligible:partition.members.filter(m=>m.state==='SCORABLE').length,
  members:partition.members.map(m=>({ticker:m.ticker,securityId:m.securityId,admissionState:m.state,cycleStatus:m.state==='DEFERRED'?'DEFERRED':'BLOCKED',score:null,rank:null})),
  persisted:{acceptances:acceptanceCount,scoreBindings:count('scoring_dataset_binding'),analyticalArtifacts:count('analytical_artifact'),productionPublications:count('production_dependency_publication'),boundaryKinds:db.prepare('SELECT kind,count(*) AS count FROM market_boundary_record GROUP BY kind ORDER BY kind').all()},
  scoresCreated:0,rankingsCreated:0,decisionsCreated:0,databaseBeforeSHA256:before};
 db.close();report.databaseAfterSHA256=digest();report.databaseUnchanged=before===report.databaseAfterSHA256;
 if(!report.databaseUnchanged)throw Error('CONCURRENT_DATABASE_CHANGE');
 console.log(JSON.stringify(report,null,2));
 if(blockers.length)process.exitCode=2;
}finally{if(db.isOpen)db.close();}
