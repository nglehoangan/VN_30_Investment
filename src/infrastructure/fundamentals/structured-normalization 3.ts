import {normalizeCafeF,cafeFAllZeroAnomaly,cafeFPeriod,parseCafeFJson,type CafeFEndpoint,type CafeFMode,type CafeFNamespace,type CafeFProviderFact} from './cafef';
import {decimal} from '@/domain/portfolio/values';
export interface StructuredRawResponse {symbol:string;endpoint:CafeFEndpoint;TypeTime:CafeFMode;retrievedAt:string;payloadHash:string;httpStatus:number|null;error:string|null;rawPayloadLocation:string;requestFingerprint:string}
export function normalizeStructuredResponse(body:string,request:StructuredRawResponse,namespace:CafeFNamespace,extended=false){
 const normalized=normalizeCafeF(body,request.endpoint,request.symbol,request.TypeTime,namespace,request.retrievedAt,extended);
 // Prospective namespace release; legacy POC callers retain their original mapping version.
 for(const f of normalized.facts)Object.assign(f,{mappingVersion:extended?'cafef-structured-sector-v3':'cafef-structured-sector-v2'});
 const events:{kind:string;symbol:string;sourceHash:string;periodEnd:string|null;frame:string|null;providerType:string|null;detail:string}[]=[];
 for(const r of normalized.rejectedRecords)events.push({kind:'INVALID_QUARTER_SENTINEL',symbol:request.symbol,sourceHash:request.payloadHash,periodEnd:null,frame:null,providerType:r.type,detail:`year=${r.year},quater=${r.quater}`});
 const groups=new Map<string,typeof normalized.records>();for(const r of normalized.records){const key=[r.year,r.quater,r.type].join('|');groups.set(key,[...(groups.get(key)??[]),r]);}
 for(const records of groups.values()){
  const r=records[0],period=cafeFPeriod(r,request.TypeTime),values=new Map(records.flatMap(r=>r.data).map(c=>[c.code.trim(),c.value===null?null:String(c.value)]));
  const emit=(kind:string,detail:string)=>events.push({kind,symbol:request.symbol,sourceHash:request.payloadHash,periodEnd:period.periodEnd,frame:period.periodType,providerType:r.type,detail});
  if(cafeFAllZeroAnomaly(records).anomaly)emit('PROVIDER_ANOMALY','All/near-zero numeric statement; independent issuer value verification required.');
  if(request.endpoint==='GetReportLCTT'&&period.periodType==='QUARTER'&&r.quater>1)emit('QUARTER_CASH_FLOW_BASIS_UNVERIFIED','Standalone-quarter basis unproved; no CFO/FCF derivatives.');
  if(period.modeMismatch)emit('PERIOD_UNCERTAIN','Request mode and provider fiscal-quarter metadata disagree.');
  if(request.endpoint==='GetReportCDKT'){
   const codes=namespace==='BANK'?['300','400','500']:['270','300','400'];
   const labels=codes.map(code=>normalized.templates.find(t=>t.code.trim()===code)?.name.toLowerCase()??'');
   if(!labels[0].includes('tài sản')||!labels[1].includes('nợ phải trả')||!labels[2].includes('vốn chủ sở hữu')){emit('DEFINITION_UNCERTAIN','Accounting identity template labels do not establish canonical populations.');continue;}
   const [a,l,e]=codes.map(c=>values.get(c));if(a!==undefined&&l!==undefined&&e!==undefined&&a!==null&&l!==null&&e!==null){const assets=decimal(a),sum=decimal(l).add(decimal(e)),difference=assets.sub(sum),abs=difference.negative?difference.neg():difference,m=(assets.negative?assets.neg():assets).add(sum.negative?sum.neg():sum);if(abs.units>decimal('1000').units&&abs.units*2n*1000000000000n>m.units*1000000n){emit('ACCOUNTING_IDENTITY_CONFLICT',`assets=${a}; liabilities+equity=${sum.toString()}`);for(const fact of normalized.facts.filter(f=>f.fiscalYear===r.year&&f.fiscalQuarter===(r.quater||null)&&f.providerType===r.type&&['TOTAL_ASSETS','TOTAL_EQUITY'].includes(f.itemId)))fact.providerStatus='CONFLICT';}}
  }
 }
 return {...normalized,events};
}
/** No raw-derived debt is promoted: its component sum is recomputed after canonical admission. */
export function candidateOnly(facts:readonly CafeFProviderFact[]){return facts.filter(f=>f.endpoint!=='GetReportSummary'&&f.valueType==='FACT');}
export function findRawProviderCell(body:string,year:number,quarter:number|null,type:string,code:string):string|null{
 const root=parseCafeFJson(body) as {value:{data:Record<string,unknown>[]}};
 const records=root.value.data.flatMap(g=>typeof g.symbol==='string'?[g]:g.data as Record<string,unknown>[]);
 const r=records.find(r=>Number(r.year)===year&&Number(r.quater)===(quarter??0)&&r.type===type);
 const cell=(r?.data as {code:string;value:unknown}[]|undefined)?.find(c=>c.code.trim()===code);return cell?.value===undefined||cell.value===null?null:String(cell.value);
}
