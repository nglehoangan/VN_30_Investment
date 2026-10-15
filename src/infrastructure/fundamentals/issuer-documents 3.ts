import {createHash} from 'node:crypto';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import type {FundamentalDocumentCollector} from '@/ports/fundamentals';
import type {FundamentalRawCapture,FundamentalSourceVersion} from '@/domain/fundamentals/contracts';
import {fundamentalId,validateFundamentalSource,validateFundamentalCapture,validateFundamentalBatch} from '@/domain/fundamentals/validation';
import {publicDocumentQuery,rawResourceReference} from './public-resource';
import {RAW_DOCUMENT_MEDIA_TYPE,INTERNAL_RAW_FAILURE_STATUS,pdfDocumentMediaType} from './raw-document';

const sha=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
const fold=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
export interface IssuerEntry {ticker:string;issuer:string;discoveryUrl:string;sampleUrl:string|null}
export function publicAddress(address:string):boolean {
 if(isIP(address)===4){const [a,b]=address.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&[0,168].includes(b)||a===100&&b>=64&&b<=127||a===198&&[18,19].includes(b));}
 if(isIP(address)===6)return !/^(::|fc|fd|fe[89ab]|ff)/i.test(address);
 return false;
}
/** Exact resource identity is retained; query/fragment/userinfo/local URLs are not stripped. */
export function issuerResource(raw:string,base?:string):string {
 const u=new URL(raw,base),h=u.hostname;
 if(u.protocol!=='https:'||/[@#]/.test(u.href)||u.username||u.password||!publicDocumentQuery(u)||u.hash||!h.includes('.')||h.endsWith('.local')||h.endsWith('.localhost')||h.endsWith('.internal')||isIP(h.replace(/^\[|\]$/g,'')))throw new Error('UNSAFE_PUBLIC_RESOURCE');
 return u.href;
}
export function discoverIssuerLinks(body:string,base:string):{pdfs:string[];pages:string[]} {
 const pdfs=new Set<string>(),pages=new Set<string>(),text=body.slice(0,4_000_000).replace(/\\\//g,'/').replace(/&amp;/g,'&');
 const matches:[string,string][]=[...text.matchAll(/(?:href|src|data-src)\s*=\s*["']([^"']{1,2048})["']([^>]{0,512}>[^<]{0,512})?/gi)].map(m=>[m[1],m[2]??'']);
 for(const m of text.matchAll(/<a\b[^>]{0,2048}href=["']([^"']{1,2048})["'][^>]{0,2048}>([\s\S]{0,10000}?)<\/a>/gi))matches.push([m[1],m[2].replace(/<[^>]*>/g,' ')]);
 for(const m of text.matchAll(/["']([^"'<>\s]{1,2048}\.pdf)["']/gi))matches.push([m[1],m[1]]);
 for(const row of text.matchAll(/<tr\b[^>]{0,2048}>([\s\S]{0,20000}?)<\/tr>/gi))for(const link of row[1].matchAll(/href=["']([^"']{1,2048})["']/gi))matches.push([link[1],row[1].replace(/<[^>]*>/g,' ')]);
 for(const [href,label] of matches){try{const url=issuerResource(href,base),context=fold(decodeURI(url)+' '+label),year=/2025|2026|fy25|fy26|hy25|hy26|[1-4]q(?:25|26)|q[1-4][_.-]?(?:25|26)|interim(?:25|26)|ye(?:25|26)/.test(context),financial=/bctc|tai.chinh|financial|consol|hop.nhat|annual.report/.test(context);
  if((/\.pdf(?:$|\/)/i.test(new URL(url).pathname)||new URL(url).pathname.endsWith('/DocumentDownload.ashx')||new URL(url).pathname==='/c/document_library/get_file')&&year&&financial&&!/(?:quy|quarter|q)[ _.-]*(?:3|4|iii|iv)[ _.-]*(?:nam[ _.-]*)?2026|[34]q26|q[34][_.-]?26/.test(context))pdfs.add(url);
  else if(new URL(url).hostname.replace(/^www\./,'')===new URL(base).hostname.replace(/^www\./,'')&&financial&&!/\.pdf(?:$|\/)/i.test(new URL(url).pathname))pages.add(url);
 }catch{/* Unusable references remain uncollected, not rewritten. */}}
 return {pdfs:[...pdfs].sort(),pages:[...pages].sort()};
}
export function issuerSource(entry:IssuerEntry,recordedAt:string):FundamentalSourceVersion {
 if(!/^[A-Z0-9]{2,10}$/.test(entry.ticker))throw new Error('INVALID_ISSUER');issuerResource(entry.discoveryUrl);if(entry.sampleUrl)issuerResource(entry.sampleUrl);
 return validateFundamentalSource({id:'issuer-'+entry.ticker.toLowerCase()+'-08b-'+sha(JSON.stringify({entry,recordedAt})).slice(0,16),provider:(new URL(entry.discoveryUrl).hostname==='finance.vietstock.vn'?'Vietstock public document mirror for ':'Issuer public report discovery for ')+entry.issuer,documentationReference:'docs/fundamental-data-engine/SLICE_08B_FULL_UNIVERSE_REPORT.md',termsReference:'owner-selected-public-disclosures-access-retention-unverified',adapterVersion:'issuer-public-documents-2.3.0',schemaVersion:'raw-document-envelope-v2',coverageLimitations:['Unqualified raw discovery only; no official membership or complete-history certification','Requested reporting window 2025-01-01 through 2026-06-30; document periods require independent qualification'],temporalLimitations:['Publication precision unverified; local retrieval cannot establish historical knowledge'],recordedAt});
}
export interface IssuerCollectionDependencies {request(url:string,init:RequestInit):Promise<Response>;now():string;sleep(ms:number):Promise<void>;ensurePublicHost(host:string):Promise<void>;consumeBytes?(bytes:number):void}
export const issuerCollectionDependencies:IssuerCollectionDependencies={request:(url,init)=>fetch(url,init),now:()=>new Date().toISOString(),sleep:ms=>new Promise(r=>setTimeout(r,ms)),ensurePublicHost:async host=>{const rows=await lookup(host,{all:true});if(!rows.length||rows.some(r=>!publicAddress(r.address)))throw new Error('UNSAFE_DNS');}};
/** Public, credential-free raw collection. Linked PDF discovery never grants document/financial authority. */
export class IssuerDocumentCollector implements FundamentalDocumentCollector {
 constructor(private readonly entry:IssuerEntry,private readonly source:FundamentalSourceVersion,private readonly deps:IssuerCollectionDependencies=issuerCollectionDependencies,private readonly seeds:readonly string[]=[],private readonly maxDocuments=20){validateFundamentalSource(source);issuerResource(entry.discoveryUrl);for(const u of seeds)issuerResource(u);if(!Number.isInteger(maxDocuments)||maxDocuments<1||maxDocuments>40)throw new Error('INVALID_LIMIT');}
 async collect(executionId:string){
  fundamentalId(executionId);const startedAt=this.deps.now(),captures:FundamentalRawCapture[]=[],errors:string[]=[];let requests=0,documents=0;
  const retrieve=async(initial:string,pdf:boolean):Promise<{body:Buffer;url:string;mediaType:string}|null>=>{
   let url=issuerResource(initial);const archive=pdf&&new URL(url).hostname==='static2.vietstock.vn'&&new URL(url).pathname.endsWith('.zip');
   for(let redirect=0;redirect<3;redirect++){
    if(requests++)await this.deps.sleep(1000);const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);let status:number|null=null,mediaType='',failure:string|null=null,location:string|null=null;const parts:Uint8Array[]=[];let size=0;
    try{const operation=async()=>{await this.deps.ensurePublicHost(new URL(url).hostname);if(controller.signal.aborted)throw new Error('TIMEOUT');const response=await this.deps.request(url,{redirect:'manual',credentials:'omit',signal:controller.signal,headers:{Accept:pdf?'application/pdf':'text/html,application/xhtml+xml'}});status=response.status;mediaType=(response.headers.get('content-type')??'').split(';')[0].trim().toLowerCase();location=response.headers.get('location');
     const reader=response.body?.getReader();if(reader)try{while(true){const r=await reader.read();if(controller.signal.aborted)throw new Error('TIMEOUT');if(r.done)break;if(size+r.value.length>64_000_000)throw new Error('BODY_LIMIT');this.deps.consumeBytes?.(r.value.length);size+=r.value.length;parts.push(r.value);}}finally{await reader.cancel().catch(()=>undefined);}
     if(status>=300&&status<400)failure='REDIRECT_REQUIRES_VALIDATION';else if(status<200||status>=300)failure='HTTP_ERROR';else if(pdf&&!(archive?['application/zip','application/x-zip-compressed','application/octet-stream'].includes(mediaType):pdfDocumentMediaType('raw-document-envelope-v2',mediaType)))failure='MEDIA_TYPE_MISMATCH';};await Promise.race([operation(),new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(new Error('TIMEOUT')),{once:true}))]);
    }catch(error){const code=error instanceof Error?error.message:'';failure=controller.signal.aborted?'TIMEOUT':['BODY_LIMIT','RUN_BYTE_LIMIT','UNSAFE_DNS'].includes(code)?code:'TRANSPORT_ERROR';}finally{clearTimeout(timer);}
    const body=Buffer.concat(parts);if(!failure&&pdf&&(archive?body.subarray(0,4).toString('hex')!=='504b0304':body.subarray(0,5).toString()!=='%PDF-'))failure=archive?'ZIP_SIGNATURE_MISMATCH':'PDF_SIGNATURE_MISMATCH';const retrievedAt=this.deps.now(),count=Math.max(1,Math.ceil(body.length/1_000_000)),bodySha256=sha(body);
    for(let i=0;i<count;i++){const payload=JSON.stringify({schema:'raw-document-envelope-v2',url,attempt:redirect+1,httpStatus:status,mediaType,error:failure,bodyComplete:failure===null,encoding:'base64',chunkIndex:i,chunkCount:count,byteLength:body.length,bodySha256,bytes:body.subarray(i*1_000_000,(i+1)*1_000_000).toString('base64')});captures.push(validateFundamentalCapture({id:executionId+'-capture-'+(captures.length+1),sourceVersionId:this.source.id,importExecutionId:executionId,requestFingerprint:sha(JSON.stringify({method:'GET',url,attempt:redirect+1})),resourceReference:rawResourceReference(url),sourceRecordId:null,sourceRecordVersion:null,retrievedAt,mediaType:RAW_DOCUMENT_MEDIA_TYPE,responseStatus:failure?INTERNAL_RAW_FAILURE_STATUS:status!,payload,payloadHash:sha(payload)}));}
    if(!failure)return {body,url,mediaType};errors.push('request-'+requests+':'+failure);
    if(failure!=='REDIRECT_REQUIRES_VALIDATION'||!location)break;
    try{const next=issuerResource(location,url);if(!pdf&&new URL(next).hostname.replace(/^www\./,'')!==new URL(this.entry.discoveryUrl).hostname.replace(/^www\./,''))break;url=next;}catch{break;}
   }
   return null;
  };
  const landing=await retrieve(this.entry.discoveryUrl,false),urls=new Set<string>([...this.seeds,...(this.entry.sampleUrl?[this.entry.sampleUrl]:[])]);
  if(landing&&landing.body.length>4_000_000)errors.push('DISCOVERY_TEXT_LIMIT_PARTIAL');
  if(landing&&['text/html','application/xhtml+xml'].includes(landing.mediaType)){const links=discoverIssuerLinks(landing.body.toString('utf8'),landing.url);links.pdfs.forEach(u=>urls.add(u));for(const page of links.pages.slice(0,3)){const r=await retrieve(page,false);if(r&&r.body.length>4_000_000)errors.push('page-'+requests+':DISCOVERY_TEXT_LIMIT_PARTIAL');if(r&&['text/html','application/xhtml+xml'].includes(r.mediaType))discoverIssuerLinks(r.body.toString('utf8'),r.url).pdfs.forEach(u=>urls.add(u));}}
  if(urls.size>this.maxDocuments)errors.push('DOCUMENT_LIMIT_PARTIAL');for(const url of [...urls].sort().slice(0,this.maxDocuments))if(await retrieve(url,true)){if(new URL(url).pathname.endsWith('.zip')){if(!errors.includes('ARCHIVE_CAPTURED_PDF_MEMBERS_REQUIRE_INSPECTION'))errors.push('ARCHIVE_CAPTURED_PDF_MEMBERS_REQUIRE_INSPECTION');}else documents++;}
  if(!documents)errors.push('NO_COMPLETE_PDF_DISCOVERED');errors.push('HISTORY_PUBLICATION_ISSUER_AND_PERIOD_QUALIFICATION_REQUIRED');
  const completedAt=this.deps.now(),batch=validateFundamentalBatch({id:executionId,sourceVersionId:this.source.id,requestFingerprint:sha(JSON.stringify({entry:this.entry,urls:[...urls].sort()})),startedAt,completedAt,ingestedAt:this.deps.now(),completion:'PARTIAL',captureIds:captures.map(c=>c.id),errors});return {source:this.source,batch,captures};
 }
}
