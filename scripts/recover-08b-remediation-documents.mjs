import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const {RepositoryRawDocuments,RAW_DOCUMENT_MEDIA_TYPE}=await import('../src/infrastructure/fundamentals/raw-document.ts');
const {rawResourceReference}=await import('../src/infrastructure/fundamentals/public-resource.ts');
const {validateFundamentalSource,validateFundamentalCapture}=await import('../src/domain/fundamentals/validation.ts');
const B='data/initialization-08b-remediation-work/',sha=b=>createHash('sha256').update(b).digest('hex');
const outputName=process.env.VN30_RECOVERY_OUTPUT??'remediation-targeted-recovery.json';if(!/^[a-z0-9-]+\.json$/.test(outputName))throw Error('RECOVERY_OUTPUT_NAME');const output=B+outputName;if(existsSync(output))throw Error('RECOVERY_ALREADY_FROZEN');
const routesName=process.env.VN30_RECOVERY_ROUTES??'explicit-recovery-routes.json';if(!/^[a-z0-9-]+\.json$/.test(routesName))throw Error('RECOVERY_ROUTES_NAME');const routes=JSON.parse(readFileSync(B+routesName,'utf8'));if(!Array.isArray(routes)||routes.some(r=>!Array.isArray(r)||r.length!==2||! /^[A-Z]{3}$/.test(r[0])||! /^https:\/\//.test(r[1])))throw Error('EXACT_PUBLIC_RECOVERY_ROUTES_REQUIRED');
process.umask(0o077);const sources=[],imports=[],captures=[],documents=[],exceptions=[];
const maxBytes=Number(process.env.VN30_RECOVERY_MAX_BYTES??64000000);if(!Number.isInteger(maxBytes)||maxBytes<1000000||maxBytes>128000000)throw Error('CONTROLLED_PDF_SIZE_LIMIT');
for(const [ticker,url] of routes){
 const startedAt=new Date().toISOString(),key=sha(JSON.stringify({url,startedAt,outputName})).slice(0,16),file=B+'recovery-'+key+'.pdf';
 const r=spawnSync('curl',['--fail','--location','--silent','--show-error','--max-time','60','--max-filesize',String(maxBytes),'--output',file,'--write-out','%{http_code}',url],{timeout:65000});
 const completedAt=new Date().toISOString(),status=Number(r.stdout.toString());
 if(r.status!==0||status<200||status>=300){exceptions.push({ticker,url,error:'TARGETED_PUBLIC_FETCH_FAILED',httpStatus:status,curlExit:r.status,processError:r.error?.code??null,publicFetchError:r.stderr.toString().slice(0,1000),maxBytes,startedAt,completedAt});continue;}
 const bytes=readFileSync(file);if(bytes.subarray(0,5).toString()!=='%PDF-'){exceptions.push({ticker,url,error:'NOT_PDF',status});continue;}
 const hash=sha(bytes),id='remediation-recovery-'+key,sourceVersionId=id+'-source',importExecutionId=id+'-import';
 if(bytes.length>64000000){exceptions.push({ticker,url,error:'EXCEEDS_EXISTING_RAW_DOCUMENT_CONTRACT_LIMIT',httpStatus:status,byteLength:bytes.length,bodyHash:hash,retainedBinaryFile:file,completeBinaryRetained:true,rawDocumentAdmitted:false,contractMaxBytes:64000000,startedAt,completedAt});continue;}
 const source={id:sourceVersionId,provider:new URL(url).hostname==='staticfile.hsx.vn'?'PUBLIC_EXCHANGE_HOSE':new URL(url).hostname==='owa.hnx.vn'?'PUBLIC_EXCHANGE_HNX':new URL(url).hostname==='static2.vietstock.vn'?'PUBLIC_DOCUMENT_PROVIDER_VIETSTOCK':'PUBLIC_ISSUER_'+ticker,documentationReference:'slice08b-targeted-public-route:'+routesName,termsReference:'owner-authorized-public-financial-document-retention',adapterVersion:'targeted-public-pdf-v2-distinct-execution-identities',schemaVersion:'raw-document-envelope-v2',coverageLimitations:['EXACT_M3_BACKLOG_ROUTES_ONLY_NOT_BROAD_CRAWL'],temporalLimitations:['LOCAL_RETRIEVAL_NOT_ISSUER_PUBLICATION'],recordedAt:startedAt};validateFundamentalSource(source);sources.push(source);
 const count=Math.max(1,Math.ceil(bytes.length/1000000)),ids=[];
 for(let i=0;i<count;i++){
  const payload=JSON.stringify({schema:source.schemaVersion,url,attempt:1,httpStatus:status,mediaType:'application/pdf',error:null,bodyComplete:true,encoding:'base64',chunkIndex:i,chunkCount:count,byteLength:bytes.length,bodySha256:hash,bytes:bytes.subarray(i*1000000,(i+1)*1000000).toString('base64')});
  const c={id:id+'-capture-'+i,sourceVersionId,importExecutionId,requestFingerprint:sha(JSON.stringify({method:'GET',url,attempt:1})),resourceReference:rawResourceReference(url),sourceRecordId:null,sourceRecordVersion:null,retrievedAt:completedAt,mediaType:RAW_DOCUMENT_MEDIA_TYPE,responseStatus:status,payload,payloadHash:sha(payload)};validateFundamentalCapture(c);captures.push(c);ids.push(c.id);
 }
 const batch={id:importExecutionId,sourceVersionId,requestFingerprint:sha(url),startedAt,completedAt,ingestedAt:completedAt,completion:'COMPLETE',captureIds:ids,errors:[]};imports.push(batch);
 const reader=new RepositoryRawDocuments({findCapture:async id=>captures.find(c=>c.id===id)??null,findImport:async id=>imports.find(i=>i.id===id)??null,findSource:async id=>sources.find(s=>s.id===id)??null});
 const raw=await reader.reconstruct(ids);const metadata={...raw};delete metadata.bodyBase64;
 if(!existsSync(B+hash+'.pdf'))writeFileSync(B+hash+'.pdf',bytes,{flag:'wx',mode:0o600});
 documents.push({...metadata,ticker,file:hash+'.pdf',originalPublicUrl:url,recoveryReason:'REQUIRED_M3_HISTORY_OR_UNREADABLE_EXISTING_REQUIRED_FACTS'});
}
writeFileSync(output,JSON.stringify({sources,imports,captures,documents,exceptions},null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({targetedDocuments:documents.length,exceptions}));
