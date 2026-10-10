import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const {RepositoryRawDocuments,RAW_DOCUMENT_MEDIA_TYPE}=await import('../src/infrastructure/fundamentals/raw-document.ts');
const {rawResourceReference}=await import('../src/infrastructure/fundamentals/public-resource.ts');
const {validateFundamentalSource,validateFundamentalCapture}=await import('../src/domain/fundamentals/validation.ts');
const B='data/initialization-08b-final-work/',sha=b=>createHash('sha256').update(b).digest('hex');
const output=B+'targeted-recovery.json';if(existsSync(output))throw Error('RECOVERY_ALREADY_FROZEN');
const routes=[
 ['STB','https://www.sacombank.com.vn/content/dam/sacombank/files/nhadautu/baocaotaichinh/2026/BCTC-Hop-nhat-ban-nien-2026-soat-xet.pdf'],
 ['STB','https://www.sacombank.com.vn/content/dam/sacombank/files/nhadautu/baocaotaichinh/2026/BCTC-Hop-nhat-Q2.2026.pdf'],
 ['GVR','https://vrg.vn/wp-content/uploads/2026/08/20260828-GVR-Bao-cao-tai-chinh-hop-nhat-ban-nien-2026-kem-Giai-trinh.pdf?x43976'],
 ['GVR','https://vrg.vn/wp-content/uploads/2026/03/20260330-GVR-Bao-cao-tai-chinh-hop-nhat-nam-2025.pdf?x43976'],
];
process.umask(0o077);const sources=[],imports=[],captures=[],documents=[],exceptions=[];
for(const [ticker,url] of routes){
 const startedAt=new Date().toISOString(),key=sha(url).slice(0,16),file=B+'recovery-'+key+'.pdf';
 const r=spawnSync('curl',['--fail','--location','--silent','--show-error','--max-time','60','--max-filesize','64000000','--output',file,'--write-out','%{http_code}',url],{timeout:65000});
 const completedAt=new Date().toISOString(),status=Number(r.stdout.toString());
 if(r.status!==0||status<200||status>=300){exceptions.push({ticker,url,error:'TARGETED_PUBLIC_FETCH_FAILED',httpStatus:status,startedAt,completedAt});continue;}
 const bytes=readFileSync(file);if(bytes.subarray(0,5).toString()!=='%PDF-'){exceptions.push({ticker,url,error:'NOT_PDF',status});continue;}
 const hash=sha(bytes),id='closure-recovery-'+key,sourceVersionId=id+'-source',importExecutionId=id+'-import';
 const source={id:sourceVersionId,provider:'PUBLIC_ISSUER_'+ticker,documentationReference:'slice08b-targeted-recovery-existing-issuer-index',termsReference:'owner-authorized-public-financial-document-retention',adapterVersion:'targeted-public-pdf-v1',schemaVersion:'raw-document-envelope-v2',coverageLimitations:['EXACT_FOUR_ROUTES_ONLY_NOT_BROAD_CRAWL'],temporalLimitations:['LOCAL_RETRIEVAL_NOT_ISSUER_PUBLICATION'],recordedAt:startedAt};validateFundamentalSource(source);sources.push(source);
 const count=Math.max(1,Math.ceil(bytes.length/1000000)),ids=[];
 for(let i=0;i<count;i++){
  const payload=JSON.stringify({schema:source.schemaVersion,url,attempt:1,httpStatus:status,mediaType:'application/pdf',error:null,bodyComplete:true,encoding:'base64',chunkIndex:i,chunkCount:count,byteLength:bytes.length,bodySha256:hash,bytes:bytes.subarray(i*1000000,(i+1)*1000000).toString('base64')});
  const c={id:id+'-capture-'+i,sourceVersionId,importExecutionId,requestFingerprint:sha(JSON.stringify({method:'GET',url,attempt:1})),resourceReference:rawResourceReference(url),sourceRecordId:null,sourceRecordVersion:null,retrievedAt:completedAt,mediaType:RAW_DOCUMENT_MEDIA_TYPE,responseStatus:status,payload,payloadHash:sha(payload)};validateFundamentalCapture(c);captures.push(c);ids.push(c.id);
 }
 const batch={id:importExecutionId,sourceVersionId,requestFingerprint:sha(url),startedAt,completedAt,ingestedAt:completedAt,completion:'COMPLETE',captureIds:ids,errors:[]};imports.push(batch);
 const reader=new RepositoryRawDocuments({findCapture:async id=>captures.find(c=>c.id===id)??null,findImport:async id=>imports.find(i=>i.id===id)??null,findSource:async id=>sources.find(s=>s.id===id)??null});
 const raw=await reader.reconstruct(ids);const metadata={...raw};delete metadata.bodyBase64;
 if(!existsSync(B+hash+'.pdf'))writeFileSync(B+hash+'.pdf',bytes,{flag:'wx',mode:0o600});
 documents.push({...metadata,ticker,file:hash+'.pdf',originalPublicUrl:url,recoveryReason:'CURRENT_CONSOLIDATED_OR_FY2025_M3_DOCUMENT_MISSING_FROM_EXISTING_CORPUS'});
}
writeFileSync(output,JSON.stringify({sources,imports,captures,documents,exceptions},null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({targetedDocuments:documents.length,exceptions}));
