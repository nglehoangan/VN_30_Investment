import './lib/ts-runtime.mjs';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {resolve,join,isAbsolute,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const {loadDatabaseConfig}=await import('../src/infrastructure/config/database.ts');
const {openDatabase}=await import('../src/infrastructure/db/client.ts');
const {PrismaFundamentals}=await import('../src/infrastructure/repositories/fundamentals.ts');
const {ingestFundamentalDocuments}=await import('../src/application/fundamentals/ingest.ts');
const {FPT_SOURCE,FptDocumentCollector}=await import('../src/infrastructure/fundamentals/fpt.ts');
const {validateFundamentalBatch,validateFundamentalCapture}=await import('../src/domain/fundamentals/validation.ts');
const {rawDocumentHttpEvidence,RepositoryRawDocuments}=await import('../src/infrastructure/fundamentals/raw-document.ts');

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
/** Raw-only stage. No observation/qualification/snapshot/DI/scoring write capability exposed. */
async function main(){
 const args=process.argv.slice(2),options={};let append=false;if(args.includes('--append-raw')){if(args.filter(a=>a==='--append-raw').length!==1)throw new Error('INVALID_ARGUMENTS');args.splice(args.indexOf('--append-raw'),1);append=true;}for(let i=0;i<args.length;i+=2){if(!['--database','--manifest-dir'].includes(args[i])||!args[i+1]||options[args[i]])throw new Error('INVALID_ARGUMENTS');options[args[i]]=args[i+1];}
 const target=options['--database'],directory=options['--manifest-dir'];if(!target||!directory||!isAbsolute(target)||!isAbsolute(directory))throw new Error('EXPLICIT_ABSOLUTE_INPUTS_REQUIRED');
 const config=loadDatabaseConfig({DATABASE_URL:'file:'+target},root);if(!append&&(existsSync(config.filePath)||existsSync(config.filePath+'-journal')||existsSync(config.filePath+'-wal')||existsSync(config.filePath+'-shm')||existsSync(config.filePath+'.08b.json')))throw new Error('NEW_TARGET_REQUIRED');
 if(append){const previous=JSON.parse(readFileSync(config.filePath+'.08b.json','utf8'));if(!existsSync(config.filePath)||previous.stage!=='RAW_COLLECTION_ONLY'||previous.counts.observations||previous.counts.snapshots||previous.counts.acceptances)throw new Error('RAW_STAGE_RECEIPT_REQUIRED');}
 const bytes=readFileSync(join(directory,'manifest.json')),digest=readFileSync(join(directory,'manifest.sha256'),'utf8').trim();if(sha(bytes)!==digest)throw new Error('MANIFEST_INTEGRITY');
 const m=JSON.parse(bytes);if(m.mode!=='PUBLIC_HTTP'||JSON.stringify(m.source)!==JSON.stringify(FPT_SOURCE))throw new Error('RAW_PUBLIC_FPT_ONLY');
 const batch=validateFundamentalBatch(m.batch);if(batch.completion==='FAILED'||!Array.isArray(m.captures)||!m.captures.length)throw new Error('NO_RAW_DOCUMENTS');
 if(new Set(m.captures.map(c=>c.id)).size!==m.captures.length||JSON.stringify([...batch.captureIds].sort())!==JSON.stringify(m.captures.map(c=>c.id).sort())||m.captures.some(c=>c.sourceVersionId!==m.source.id||c.importExecutionId!==batch.id))throw new Error('CAPTURE_BINDING');
 new FptDocumentCollector({reportUrls:m.captures.map(c=>c.resourceReference).filter(u=>u!=='https://fpt.com/vi/nha-dau-tu')});
 const groups=new Map();for(const c of m.captures){validateFundamentalCapture(c);rawDocumentHttpEvidence(c);const e=JSON.parse(c.payload);if(e.mediaType==='application/pdf'&&e.error===null){const key=e.url+'|'+e.attempt;groups.set(key,[...(groups.get(key)??[]),c.id]);}}
 const reader=new RepositoryRawDocuments({findCapture:async id=>m.captures.find(c=>c.id===id)??null,findImport:async()=>batch,findSource:async()=>m.source});
 const documents=[];for(const ids of groups.values()){const d=await reader.reconstruct(ids);documents.push({documentId:d.documentId,bodyHash:d.bodyHash,captureIds:d.captureIds,resourceReference:d.resourceReference,retrievedAt:d.retrievedAt,qualification:'NOT_REVIEWED'});}if(!documents.length)throw new Error('NO_COMPLETE_PDF');
 // Schema install is isolated to the explicit new target; never loads .env files.
 const migration=append?{status:0}:spawnSync(process.execPath,[join(root,'scripts/database.mjs'),'migrate','--no-env-file'],{cwd:root,env:{...process.env,DATABASE_URL:config.url},stdio:'pipe',timeout:60000});if(migration.status!==0)throw new Error('SCHEMA_INSTALL_FAILED');
 const client=await openDatabase(config);try{
  if(append&&(await client.fundamentalObservation.count()||await client.fundamentalSnapshotRun.count()||await client.dataInitializationAcceptance.count()||await client.portfolio.count()))throw new Error('RAW_STAGE_ONLY_TARGET');
  await ingestFundamentalDocuments({collect:async()=>({source:m.source,batch,captures:m.captures})},new PrismaFundamentals(client),batch.id);
  const counts={sources:await client.fundamentalSourceVersion.count(),imports:await client.fundamentalImportBatch.count(),captures:await client.fundamentalRawCapture.count(),observations:await client.fundamentalObservation.count(),snapshots:await client.fundamentalSnapshotRun.count(),acceptances:await client.dataInitializationAcceptance.count()};
  if(counts.observations||counts.snapshots||counts.acceptances)throw new Error('RAW_STAGE_BOUNDARY');
  const receipt={stage:'RAW_COLLECTION_ONLY',status:'PARTIAL_INITIALIZATION',requestedReportingWindow:{start:'2025-01-01',end:'2026-06-30',semantics:'REQUESTED_WINDOW_NOT_DOCUMENT_QUALIFICATION'},recordedAt:new Date().toISOString(),manifestHash:digest,documents,batchId:batch.id,batchCompletion:batch.completion,counts,diStatus:'NOT_EXECUTED',blockers:['FULL_UNIVERSE_HISTORY_NOT_COLLECTED','INDEPENDENT_QUALIFICATION_AND_INTERPRETATION_REQUIRED','OFFICIAL_UNIVERSE_SECTOR_MARKET_REQUIRED','CANONICAL_SNAPSHOT_NOT_BUILT']};
  writeFileSync(config.filePath+(append?'.08b-'+batch.id+'.json':'.08b.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(receipt));
 }finally{await client.$disconnect();}
}
main().catch(()=>{console.error('08B raw initialization failed; existing targets require an explicit raw-stage receipt and append mode. Inspect the explicit new target before retrying; no DI acceptance was granted.');process.exitCode=1;});
