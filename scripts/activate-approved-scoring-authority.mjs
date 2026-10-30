import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const {openDatabase}=await import('../src/infrastructure/db/client.ts');
const {loadDatabaseConfig}=await import('../src/infrastructure/config/database.ts');
const {PrismaDependencyRegistry}=await import('../src/infrastructure/repositories/dependencies.ts');
const {LocalAcceptedDependencyCatalog}=await import('../src/infrastructure/dependencies/catalog.ts');
const {ProductionDependencies}=await import('../src/application/dependencies/service.ts');
const {snapshotHash:hash}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const {ref}=await import('../src/domain/dependencies/validation.ts');
const {verifyProductionAuthorityBundle}=await import('../src/infrastructure/dependencies/production-authority.ts');
const out='docs/fundamental-data-engine/evidence/2026-10-29-approved-authority-activation';
if(existsSync(out+'/CAS_ACTIVATION.json'))throw Error('ACTIVATION_RECEIPT_EXISTS');
const config=JSON.parse(readFileSync('src/infrastructure/dependencies/active-authorities.json','utf8'));
const authority=verifyProductionAuthorityBundle(process.cwd(),config.authorityBundle);
if(authority.bundle.id!=='production-authority-bundle-20261029-r1')throw Error('WRONG_BUNDLE');
const dbConfig=loadDatabaseConfig({},process.cwd());
function accounting(){const db=new DatabaseSync(dbConfig.filePath,{readOnly:true});try{return Object.fromEntries(['portfolio','ledger_transaction','ledger_leg','portfolio_projection','production_dependency_publication','scoring_dataset_binding','analytical_artifact'].map(table=>{const rows=db.prepare('SELECT * FROM '+table+' ORDER BY rowid').all();return [table,{count:rows.length,hash:hash(rows)}];}));}finally{db.close();}}
const before=accounting();
const db=await openDatabase(dbConfig);
try{
 const deny=async()=>{throw Error('STATIC_AUTHORITY_ACTIVATION_ONLY');};
 const catalog=new LocalAcceptedDependencyCatalog(process.cwd(),{find:deny,append:deny,sealDecision:deny,sealRanking:deny},()=>{throw Error('STATIC_AUTHORITY_ACTIVATION_ONLY');});
 const registry=new PrismaDependencyRegistry(db);
 const previous=await registry.current();
 const accepted=await catalog.readAccepted();
 if(previous&&previous.heads.some(h=>!accepted.some(a=>a.type===h.type)))throw Error('WOULD_DROP_DYNAMIC_HEAD');
 if(previous?.heads.some(h=>h.type==='SCORING_MODEL'&&h.content.executableAuthority?.id===authority.executable.id))throw Error('ALREADY_ACTIVE');
 const service=new ProductionDependencies(registry,catalog,{now:()=>new Date().toISOString()},hash);
 const current=await service.activate(previous?ref(previous):null,'Owner-approved exact 20261029-r1 scoring executable manifest; static authorities only');
 const resolved=await service.resolveProductionAnalysisDependencies({purpose:'FUNDAMENTAL_DESCRIPTION',requestedAsOf:new Date().toISOString()});
 const after=accounting();
 const unchanged=JSON.stringify(before)===JSON.stringify(after);
 writeFileSync(out+'/CAS_ACTIVATION.json',JSON.stringify({status:'ACTIVATED',recordedAt:new Date().toISOString(),previous:previous?ref(previous):null,current:ref(current),resolved:resolved.release,manifestContentHash:authority.manifest.contentHash,accountingBefore:before,accountingAfter:after,accountingUnchanged:unchanged,publicationCreated:false,scoringExecuted:false},null,2)+'\n');
 if(!unchanged)throw Error('UNEXPECTED_ACCOUNTING_CHANGE');
 console.log(JSON.stringify({status:'ACTIVATED',release:ref(current),accountingUnchanged:unchanged}));
}finally{await db.$disconnect();}
