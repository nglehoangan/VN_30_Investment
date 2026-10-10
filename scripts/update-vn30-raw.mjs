import './lib/ts-runtime.mjs';
import {systemPublicHttp} from './lib/system-public-http.mjs';
import {readFileSync,existsSync,mkdirSync,writeFileSync,appendFileSync} from 'node:fs';
import {resolve,dirname,join,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
const {IssuerDocumentCollector,issuerSource,issuerCollectionDependencies,issuerResource}=await import('../src/infrastructure/fundamentals/issuer-documents.ts');
const {loadDatabaseConfig}=await import('../src/infrastructure/config/database.ts');
const {openDatabase}=await import('../src/infrastructure/db/client.ts');
const {PrismaFundamentals}=await import('../src/infrastructure/repositories/fundamentals.ts');
const {RepositoryRawDocuments,completeRawPdfGroups}=await import('../src/infrastructure/fundamentals/raw-document.ts');
const {ingestFundamentalDocuments}=await import('../src/application/fundamentals/ingest.ts');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),sha=b=>createHash('sha256').update(b).digest('hex');
async function main(){
 const args=process.argv.slice(2),opts={};for(let i=0;i<args.length;i+=2){if(!['--database','--output','--seeds','--tickers'].includes(args[i])||!args[i+1]||opts[args[i]])throw new Error('INVALID_ARGUMENTS');opts[args[i]]=args[i+1];}
 if(!isAbsolute(opts['--database']??'')||!isAbsolute(opts['--output']??'')||existsSync(opts['--output']))throw new Error('EXPLICIT_TARGET_AND_NEW_OUTPUT_REQUIRED');
 const config=loadDatabaseConfig({DATABASE_URL:'file:'+opts['--database']},root),previous=JSON.parse(readFileSync(config.filePath+'.08b.json','utf8'));
 if(!existsSync(config.filePath)||previous.stage!=='RAW_COLLECTION_ONLY')throw new Error('RAW_INITIALIZATION_TARGET_REQUIRED');
 const catalogBytes=readFileSync(join(root,'docs/fundamental-data-engine/issuer-sources.json')),catalog=JSON.parse(catalogBytes),rows=catalog.sources.filter(s=>s.scope==='research_basket');
 if(rows.length!==30||new Set(rows.map(r=>r.ticker)).size!==30)throw new Error('SOURCE_REGISTER_EXPECTED_30_CANDIDATES');
 const selected=opts['--tickers']?opts['--tickers'].split(','):rows.map(r=>r.ticker);if(selected.some(t=>!rows.some(r=>r.ticker===t))||new Set(selected).size!==selected.length)throw new Error('INVALID_TICKERS');
 const savedRoutesPath=join(root,'docs/fundamental-data-engine/issuer-document-routes.json'),savedRoutes=existsSync(savedRoutesPath)?JSON.parse(readFileSync(savedRoutesPath,'utf8')):null,inputSeeds={...(savedRoutes?Object.fromEntries(savedRoutes.issuers.map(r=>[r.ticker,r.documents.slice(0,40).map(d=>d.url)])):{}),...(opts['--seeds']?JSON.parse(readFileSync(opts['--seeds'],'utf8')):{})},seeds={},rejectedSeedCounts={};
 for(const [ticker,urls] of Object.entries(inputSeeds)){if(!rows.some(r=>r.ticker===ticker)||!Array.isArray(urls)||urls.length>40)throw new Error('INVALID_SEED_MAP');seeds[ticker]=[];rejectedSeedCounts[ticker]=0;for(const url of urls){try{seeds[ticker].push(issuerResource(url));}catch{rejectedSeedCounts[ticker]++;}}}
 const client=await openDatabase(config);try{
  if(await client.fundamentalObservation.count()||await client.fundamentalSnapshotRun.count()||await client.dataInitializationAcceptance.count()||await client.portfolio.count())throw new Error('RAW_ONLY_TARGET_REQUIRED');
  mkdirSync(opts['--output'],{mode:0o700});const runId='vn30-raw-'+randomUUID(),recordedAt=new Date().toISOString(),entries=rows.filter(r=>selected.includes(r.ticker)).map(r=>({ticker:r.ticker,issuer:r.issuer,discoveryUrl:r.discoveryUrl,sampleUrl:r.sample?.url??null}));
  writeFileSync(join(opts['--output'],'plan.json'),JSON.stringify({runId,recordedAt,catalogHash:sha(catalogBytes),requestedWindow:{start:'2025-01-01',end:'2026-06-30'},entries,seeds,rejectedSeedCounts,savedRoutesHash:savedRoutes?sha(readFileSync(savedRoutesPath)):null,implementationHashes:Object.fromEntries(['scripts/update-vn30-raw.mjs','scripts/lib/system-public-http.mjs','src/infrastructure/fundamentals/issuer-documents.ts','src/infrastructure/fundamentals/public-resource.ts','src/infrastructure/fundamentals/raw-document.ts'].map(p=>[p,sha(readFileSync(join(root,p)))]))},null,2),{flag:'wx',mode:0o600});
  const facts=new PrismaFundamentals(client),documents=new RepositoryRawDocuments(facts),results=[];let cursor=0,writes=Promise.resolve(),totalBytes=0;
  async function store(entry,result){
   await ingestFundamentalDocuments({collect:async()=>result},facts,result.batch.id);
   const groups=completeRawPdfGroups(result.captures);
   const verified=[];for(const ids of groups){const d=await documents.reconstruct(ids);verified.push({documentId:d.documentId,bodyHash:d.bodyHash,resourceReference:d.resourceReference,captureIds:d.captureIds,retrievedAt:d.retrievedAt,qualification:'NOT_REVIEWED'});}
   return {ticker:entry.ticker,status:verified.length?'RAW_PDF_CAPTURED_UNQUALIFIED':'BLOCKED_NO_COMPLETE_PDF',sourceVersionId:result.source.id,batchId:result.batch.id,captures:result.captures.length,documents:verified,blockers:result.batch.errors};
  }
  async function worker(){while(cursor<entries.length){const entry=entries[cursor++];try{
   const collector=new IssuerDocumentCollector(entry,issuerSource(entry,recordedAt),{...issuerCollectionDependencies,...(entry.ticker==='BSR'||new URL(entry.discoveryUrl).hostname==='finance.vietstock.vn'?{request:systemPublicHttp}:{}),consumeBytes:n=>{if(totalBytes+n>1_073_741_824)throw new Error('RUN_BYTE_LIMIT');totalBytes+=n;}},seeds[entry.ticker]??[]);
   // Shared cap covers actual downloaded response bytes, not only selected PDFs.
   const result=await collector.collect(runId+'-'+entry.ticker.toLowerCase()),body=JSON.stringify({mode:'PUBLIC_HTTP',...result});writeFileSync(join(opts['--output'],entry.ticker+'.json'),body,{flag:'wx',mode:0o600});writeFileSync(join(opts['--output'],entry.ticker+'.sha256'),sha(body),{flag:'wx',mode:0o600});
   const work=writes.then(()=>store(entry,result));writes=work.catch(()=>undefined);const summary=await work;results.push(summary);appendFileSync(join(opts['--output'],'progress.jsonl'),JSON.stringify(summary)+'\n',{mode:0o600});console.log(entry.ticker+': '+summary.status+'; '+summary.documents.length+' PDFs');
  }catch(error){console.error(entry.ticker+': '+(error instanceof Error?error.message:'UNKNOWN'));const r={ticker:entry.ticker,status:'BLOCKED_COLLECTION_OR_IMPORT',documents:[],blockers:['COLLECTION_OR_IMPORT_FAILED_REQUIRES_REVIEW']};results.push(r);appendFileSync(join(opts['--output'],'progress.jsonl'),JSON.stringify(r)+'\n',{mode:0o600});console.log(entry.ticker+': BLOCKED_COLLECTION_OR_IMPORT');}}}
  await Promise.all(Array.from({length:Math.min(4,entries.length)},()=>worker()));await writes;
  const counts={sources:await client.fundamentalSourceVersion.count(),imports:await client.fundamentalImportBatch.count(),captures:await client.fundamentalRawCapture.count(),observations:await client.fundamentalObservation.count(),snapshots:await client.fundamentalSnapshotRun.count(),acceptances:await client.dataInitializationAcceptance.count()};
  const summary={schemaVersion:1,runId,stage:'RAW_COLLECTION_ONLY',status:'PARTIAL_INITIALIZATION',catalogHash:sha(catalogBytes),sourceRegisterCandidates:30,officialUniverseCount:null,requestedReportingWindow:{start:'2025-01-01',end:'2026-06-30'},completedAt:new Date().toISOString(),totalResponseBytes:totalBytes,counts,results:results.sort((a,b)=>a.ticker.localeCompare(b.ticker)),diStatus:'NOT_EXECUTED',blockers:['OFFICIAL_UNIVERSE_SECTOR_MARKET_REVIEW_REQUIRED','DOCUMENT_PERIOD_SCOPE_NORMALIZATION_PUBLICATION_REVIEW_REQUIRED','INDEPENDENT_DI_ACCEPTANCE_REQUIRED']};
  writeFileSync(join(opts['--output'],'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({runId,counts,pdfIssuers:results.filter(r=>r.documents.length).length,attempted:results.length}));
 }finally{await client.$disconnect();}
}
main().catch(()=>{console.error('VN30 raw update failed. Existing captures/target are preserved; no financial admission or DI approval was granted.');process.exitCode=1;});
