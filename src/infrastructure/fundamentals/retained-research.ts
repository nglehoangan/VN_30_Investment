import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {combinedResearchSchema,manifestSchema,parseApiManifest,parsePdfManifest,parseDownloadManifest,parseApiRequests,parseExtractionManifest,type ResearchVariantPayload} from '@/infrastructure/config/retained-research';
import type {RetainedResearch} from '@/domain/fundamentals/retained-research';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const check=(ok:unknown,why:string)=>{if(!ok)throw Error(why);};
const escape=(s:string)=>s.replace(/~/g,'~0').replace(/\//g,'~1');
export function jsonPointer(value:unknown,pointer:string):unknown {
 check(pointer.startsWith('/'),'INVALID_POINTER');
 return pointer.slice(1).split('/').reduce<unknown>((v,k)=>{k=k.replace(/~1/g,'/').replace(/~0/g,'~');check(v!==null&&typeof v==='object'&&Object.hasOwn(v,k),'MISSING_POINTER');return (v as Record<string,unknown>)[k];},value);
}
/** Reporting boundary only; it is NEVER a publication/knowledge timestamp. */
export function researchPeriodEnd(v:{asOf?:string|null;year?:number|null;quarter?:number|null;periodType?:string}):string|null {
 if(v.asOf)return /^\d{4}-\d{2}-\d{2}$/.test(v.asOf)&&Number.isFinite(Date.parse(v.asOf))&&new Date(v.asOf).toISOString().slice(0,10)===v.asOf?v.asOf:null;
 if(!v.year||!Number.isInteger(v.year)||v.year<1900||v.year>2200)return null;
 if(v.periodType==='ANNUAL')return `${v.year}-12-31`;
 if(['YTD','QUARTERLY','QUARTER'].includes(v.periodType??'')&&v.quarter&&Number.isInteger(v.quarter)&&v.quarter>=1&&v.quarter<=4)return new Date(Date.UTC(v.year,v.quarter*3,0)).toISOString().slice(0,10);
 return null;
}
export async function readRetainedResearch(root:string,ticker?:string,selection?:string,pageInput?:string,viewedAt=new Date().toISOString()):Promise<RetainedResearch> {
 check(Number.isFinite(Date.parse(viewedAt)),'INVALID_VIEW_CLOCK');
 const decoded=new Map<string,unknown>(),checkedHashes=new Map<string,string>();
 const dataRoot=await realpath(resolve(root,'data'));const cache=new Map<string,Promise<Buffer>>();
 const bytes=(path:string,limit=170_000_000)=>{
  if(!cache.has(path))cache.set(path,(async()=>{check(path.startsWith('data/'),'DATA_PATH_REQUIRED');const target=await realpath(resolve(root,path)),rel=relative(dataRoot,target);check(!rel.startsWith('..')&&!isAbsolute(rel),'RESEARCH_PATH_ESCAPE');check((await stat(target)).size<=limit,'RESEARCH_SIZE_BOUND');return readFile(target);})());
  return cache.get(path)!;
 };
 const json=async(path:string)=>JSON.parse((await bytes(path)).toString('utf8'));
 const manifestPath='data/combine/manifest.json',manifestBytes=await bytes(manifestPath),m=manifestSchema.parse(JSON.parse(manifestBytes.toString('utf8')));
 check(new Set(m.files.map(f=>f.ticker)).size===m.files.length,'DUPLICATE_TICKER');
 const api=parseApiManifest(await json('data/manual-extracted-api/manifest.json'));
 const pdf=parsePdfManifest(await json('data/manual-extracted-pdf/display-manifest.json'));
 const downloads=parseDownloadManifest(await json('data/manual-download/manifest.json'));
 const requests=parseApiRequests(await json('data/manual-extracted-api/requests.json'));
 const extraction=parseExtractionManifest(await json('data/manual-extracted-pdf/manifest.json'));
 const result:RetainedResearch={contract:'retained-financial-research-v1',classification:'RETAINED_RESEARCH_DATA',productionAdmissible:false,scoringAuthorized:false,historicalAsKnownSupported:false,viewedAt,manifestPath,manifestHash:sha(manifestBytes),catalog:m.files.map(f=>({ticker:f.ticker,selections:f.selections})),quarantines:api.failures.map(f=>({ticker:f.ticker,endpoint:f.endpoint,mode:f.mode,path:f.rawPayloadLocation,reason:f.error})),variants:[],rows:[],totalRows:0,page:0,pageSize:100,warnings:['Unreviewed retained presentation; not PRODUCTION_ADMITTED_FINANCIAL_DATA.','Publication timestamps and formal knowledge are unqualified. Historical AS_KNOWN use is unsupported.','Retrieval dates indicate capture age, not current financial freshness or issuer publication. Unknown units, scopes and periods remain unknown.']};
 if(!ticker)return result;
 const file=m.files.find(f=>f.ticker===ticker);check(file&&file.path===`data/combine/${ticker}.json`,'UNSUPPORTED_RESEARCH_TICKER');
 const body=await bytes(file!.path);check(sha(body)===file!.sha256,'COMBINED_HASH_MISMATCH');
 const parsed=combinedResearchSchema.parse(JSON.parse(body.toString('utf8')));check(parsed.ticker===ticker,'TICKER_BINDING_MISMATCH');
 result.ticker=ticker;result.fileHash=file!.sha256;
 const variants:{v:ResearchVariantPayload;report:string;period:string;pointer:string}[]=[];
 for(const [rk,r] of Object.entries(parsed.reports))for(const [pk,p] of Object.entries(r.periods))for(const [i,v] of p.variants.entries())variants.push({v,report:r.label,period:pk,pointer:`/reports/${escape(rk)}/periods/${escape(pk)}/variants/${i}`});
 check(variants.length<=10000,'VARIANT_BOUND');
 result.variants=variants.map(({v,report,period},index)=>{const path=v.source.pdfPath??v.source.rawPayloadLocation??'';const retained=downloads.requests.filter(r=>r.path===path&&r.sha256===(v.source.rawPayloadHash??v.source.payloadHash));const times=[...new Set(retained.map(r=>r.retrievedAt).filter((t):t is string=>!!t))];return {index,id:v.id,report,periodKey:period,periodType:v.periodType??'UNKNOWN',label:v.label??period,reportingScope:v.reportingScope??'UNKNOWN',scopeStatus:v.scopeStatus??'UNQUALIFIED',sourcePath:path,sourceHash:v.source.rawPayloadHash??v.source.payloadHash??'',provider:v.source.provider,retrievedAt:v.source.retrievedAt??(times.length===1?times[0]:null),publicationAt:null,periodEnd:researchPeriodEnd(v)};});
 const preferred=result.variants.findIndex(v=>v.provider==='MANUAL_PDF'&&v.periodEnd!==null&&v.periodEnd<=viewedAt.slice(0,10));
 const index=selection===undefined?(preferred<0?0:preferred):Number(selection);check(Number.isInteger(index)&&index>=0&&index<variants.length&& (selection===undefined||/^\d+$/.test(selection)),'INVALID_VARIANT');
 const page=pageInput===undefined?0:Number(pageInput);check(Number.isInteger(page)&&page>=0&&(pageInput===undefined||/^\d+$/.test(pageInput)),'INVALID_PAGE');
 const chosen=variants[index],meta=result.variants[index];result.selected=meta;result.page=page;
 const flat=chosen.v.groups.flatMap((g,gi)=>g.rows.map((r,ri)=>({r,g,pointer:`${chosen.pointer}/groups/${gi}/rows/${ri}`})));
 result.totalRows=flat.length;check(page===0||page*100<flat.length,'PAGE_OUT_OF_RANGE');
 const blocked:string[]=[];
 if(!meta.periodEnd)blocked.push('UNKNOWN_REPORT_PERIOD');else if(meta.periodEnd>viewedAt.slice(0,10))blocked.push('FUTURE_REPORT_PERIOD');
 if(!meta.retrievedAt||!Number.isFinite(Date.parse(meta.retrievedAt)))blocked.push('UNKNOWN_RETRIEVAL_TIME');else if(Date.parse(meta.retrievedAt)>Date.parse(viewedAt))blocked.push('FUTURE_CAPTURE');
 if(api.failures.some(f=>f.rawPayloadLocation===meta.sourcePath))blocked.push('QUARANTINED_API_CAPTURE');
 try{
  check(meta.provider==='MANUAL_PDF'||meta.provider==='CAFEF','UNKNOWN_PROVIDER');check(!!meta.sourceHash,'SOURCE_HASH_MISSING');
  const raw=await bytes(meta.sourcePath);check(sha(raw)===meta.sourceHash,'SOURCE_HASH_MISMATCH');
  if(meta.provider==='CAFEF')check(requests.some(r=>r.symbol===ticker&&r.payloadHash===meta.sourceHash&&r.rawPayloadLocation===meta.sourcePath&&r.retrievedAt===meta.retrievedAt&&r.httpStatus===200),'API_REQUEST_BINDING');
  if(meta.provider==='MANUAL_PDF'){
   check(raw.subarray(0,5).toString('ascii')==='%PDF-','INVALID_PDF');
   check(downloads.requests.some(d=>d.ticker===ticker&&d.path===meta.sourcePath&&d.sha256===meta.sourceHash&&d.status==='DOWNLOADED'&&d.retrievedAt===meta.retrievedAt),'DOWNLOAD_BINDING');
   check(extraction.documents.some(d=>d.pdfPath===meta.sourcePath&&d.sourceHash===meta.sourceHash),'PDF_EXTRACTION_BINDING');
  }
 }catch{blocked.push('SOURCE_LINEAGE_INVALID');}
 for(const {r,g,pointer} of flat.slice(page*100,page*100+100)){
  const reasons=[...(r.reviewReasons??[]),...blocked];let value=r.value;
  if(value!==null&&!/^-?(0|[1-9]\d*)(\.\d+)?$/.test(value))reasons.push('INVALID_DECIMAL');
  if(!['PDF_REPORTED','PDF_EXPLICIT_AGGREGATE','CAFEF_REFERENCE','MISSING','UNRESOLVED_MAPPING'].includes(r.source))reasons.push('INVALID_SELECTION_SOURCE');
  if(['MISSING','UNRESOLVED_MAPPING'].includes(r.source)){value=null;reasons.push(r.source);}
  const e=r.pdfEvidence??r.apiEvidence;
  try{
   if(value!==null){
    check(!!e,'MISSING_VALUE_LINEAGE');
    const expectedPath=r.source==='CAFEF_REFERENCE'?`data/manual-extracted-api/${ticker}.json`:`data/manual-extracted-pdf/${ticker}.json`;
    check(e!.path===expectedPath,'EXTRACTION_PATH_BINDING');
    const expectedHash=r.source==='CAFEF_REFERENCE'?api.files.find(f=>f.ticker===ticker)?.sha256:pdf.files.find(f=>f.ticker===ticker)?.sha256;
    const extracted=await bytes(expectedPath);if(!checkedHashes.has(expectedPath))checkedHashes.set(expectedPath,sha(extracted));check(checkedHashes.get(expectedPath)===expectedHash,'EXTRACTION_HASH');
    // Parse once per page/source, not once per row.
    if(!decoded.has(expectedPath))decoded.set(expectedPath,JSON.parse(extracted.toString('utf8')));
    const original=jsonPointer(decoded.get(expectedPath),e!.jsonPointer) as {value?:unknown;rawLocator?:string;label?:unknown;code?:unknown};check(original.value===value,'VALUE_POINTER_MISMATCH');check(original.label===r.label&&(original.code??null)===(r.code??null),'CAPTION_CODE_POINTER_MISMATCH');
    const originalVariant=jsonPointer(decoded.get(expectedPath),e!.jsonPointer.split('/groups/')[0]) as {year?:number|null;quarter?:number|null;periodType?:string;asOf?:string|null;source?:{payloadHash?:string;rawPayloadHash?:string;rawPayloadLocation?:string;pdfPath?:string}};
    for(const key of ['year','quarter','periodType','asOf'] as const)check((originalVariant[key]??null)===(chosen.v[key]??null),'REPORT_PERIOD_POINTER_MISMATCH');
    check((originalVariant.source?.rawPayloadHash??originalVariant.source?.payloadHash)===meta.sourceHash,'EXTRACTION_SOURCE_HASH_BINDING');
    check((originalVariant.source?.pdfPath??originalVariant.source?.rawPayloadLocation)===meta.sourcePath,'EXTRACTION_SOURCE_PATH_BINDING');
    if(r.source==='CAFEF_REFERENCE')check(r.rawLocator===original.rawLocator&&!!r.rawLocator,'RAW_POINTER_BINDING');
    if(r.source!=='CAFEF_REFERENCE')check(r.pdfEvidence?.pdfPath===meta.sourcePath,'PDF_SOURCE_BINDING');
    if(r.source==='CAFEF_REFERENCE')check(meta.provider==='CAFEF','API_VARIANT_BINDING');
   }
  }catch{reasons.push('ROW_LINEAGE_INVALID');}
  const invalid=reasons.some(x=>['UNKNOWN_REPORT_PERIOD','FUTURE_REPORT_PERIOD','UNKNOWN_RETRIEVAL_TIME','FUTURE_CAPTURE','QUARANTINED_API_CAPTURE','SOURCE_LINEAGE_INVALID','ROW_LINEAGE_INVALID','INVALID_DECIMAL','INVALID_SELECTION_SOURCE'].includes(x));
  result.rows.push({id:r.id,code:r.code??null,label:r.label??'Unknown caption',group:g.label??g.id,value:invalid?null:value,source:r.source,status:invalid?'WITHHELD':r.status??(value===null?'MISSING':'VALUE'),unit:r.unit??null,currency:r.currency??null,scale:r.scale??null,reportingScope:r.reportingScope??meta.reportingScope,reasons,pointer,evidencePath:e?.path??null,evidencePointer:e?.jsonPointer??null,pdfPath:r.pdfEvidence?.pdfPath??null,page:r.pdfEvidence?.page??null,sourceHash:meta.sourceHash,rawLocator:r.rawLocator??null});
 }
 result.warnings.push(...blocked);return result;
 // Each invocation owns its decoded evidence cache; no stale cross-request acceptance.
}
