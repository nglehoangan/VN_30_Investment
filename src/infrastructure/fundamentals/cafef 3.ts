/** Isolated structured-provider review candidate. Never a production admission adapter. */
import {createHash} from 'node:crypto';
import {cafeFResponseSchema as response,cafeFRecordSchema as record,cafeFGroupSchema as group,type CafeFTemplateRow} from '@/shared/validation/cafef';
import type {FundamentalObservation, FundamentalRawCapture, MeasurementSemantic} from '@/domain/fundamentals/contracts';
import {decimal} from '@/domain/portfolio/values';
import {validateFundamentalCapture} from '@/domain/fundamentals/validation';
import {normalizeLexical} from '@/domain/fundamentals/normalization';

export const CAFEF_ENDPOINTS={GetReportCDKT:'v2',GetReportLCTT:'v1',GetReportDetail:'v1',GetReportSummary:'v1'} as const;
export type CafeFEndpoint=keyof typeof CAFEF_ENDPOINTS;
// LUYKE remains parseable only for immutable historical evidence replay.
export type CafeFMode='NAM'|'QUY'|'LUYKE';
export const CAFEF_ACTIVE_MODES=['NAM','QUY'] as const;
export type CafeFNamespace='STANDARD_CORPORATE'|'BANK'|'SECURITIES'|'REAL_ESTATE'|'OTHER_SPECIAL';
export type CafeFStatus='VALID_VALUE'|'VALID_ZERO'|'MISSING'|'NOT_APPLICABLE'|'PROVIDER_ANOMALY'|'CONFLICT'|'UNVERIFIED';
export const payloadHash=(body:string|Uint8Array)=>createHash('sha256').update(body).digest('hex');
/** Lossless JSON number tokens: preserve financial integers/decimals before JS numeric coercion. */
export function parseCafeFJson(body:string):unknown {
 return JSON.parse(body.replace(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,token=>token.startsWith('"')?token:JSON.stringify(token)));
}
export interface CafeFRecord {symbol:string;year:number;quater:number;type:string;content:string;time:string;data:{code:string;value:string|number|null}[];group:string|null}
export function validateCafeFResponse(body:string,endpoint:CafeFEndpoint,symbol:string,mode:CafeFMode){
 const parsed=response.parse(parseCafeFJson(body));
 if(parsed.value.timeType!==undefined&&parsed.value.timeType!==mode)throw Error('TIME_MODE_MISMATCH');
 if(endpoint==='GetReportDetail'&&parsed.value.type!=='KQKD')throw Error('REPORT_TYPE_MISMATCH');
 const templates=parsed.value.templace.flatMap(t=>'data'in t&&Array.isArray(t.data)?t.data:[t]) as CafeFTemplateRow[];
 const records:CafeFRecord[]=[];
 for(const r of parsed.value.data){if(typeof r.symbol==='string')records.push({...record.parse(r),group:null});else {const g=group.parse(r);records.push(...g.data.map(x=>({...x,group:g.code})));}}
 if(records.some(r=>r.symbol!==symbol))throw Error('SYMBOL_MISMATCH');
 const rejectedRecords=records.filter(r=>r.year<1900||r.year>2200||r.quater<0||r.quater>4);
 const usableRecords=records.filter(r=>!rejectedRecords.includes(r));
 for(const r of usableRecords){const coded=r.data.filter(c=>c.code.trim());if(new Set(coded.map(c=>c.code.trim())).size!==coded.length)throw Error('DUPLICATE_PROVIDER_CODE');}
 return {templates,records:usableRecords,rejectedRecords,count:parsed.value.count,unit:parsed.value.unit??null,providerType:parsed.value.type??null,rawValue:parsed.value};
}
export interface CafeFPeriod extends Pick<FundamentalObservation,'periodStart'|'periodEnd'|'periodType'|'fiscalYear'|'fiscalQuarter'> {monthsCovered:number;modeMismatch:boolean;calendarConfidence:'UNVERIFIED_CALENDAR'}
export function cafeFPeriod(r:Pick<CafeFRecord,'year'|'quater'>,mode:CafeFMode):CafeFPeriod {
 const year=r.year,q=r.quater;if(!Number.isInteger(year)||year<1900||year>2200||!Number.isInteger(q)||q<0||q>4)throw Error('INVALID_PROVIDER_PERIOD');
 // Provider quarter 0 is annual even when an endpoint ignores QUY/LUYKE.
 const periodType=q===0?'ANNUAL':mode==='LUYKE'?'YTD':mode==='QUY'?'QUARTER':'YTD';
 const month=q===0?12:q*3,start=periodType==='QUARTER'?(q-1)*3+1:1;
 const end=new Date(Date.UTC(year,month,0)).toISOString().slice(0,10);
 return {periodStart:`${year}-${String(start).padStart(2,'0')}-01`,periodEnd:end,periodType,fiscalYear:year,fiscalQuarter:q===0?null:q as 1|2|3|4,monthsCovered:periodType==='QUARTER'?3:month,modeMismatch:(mode==='NAM'&&q!==0)||(mode!=='NAM'&&q===0),calendarConfidence:'UNVERIFIED_CALENDAR'};
}
export function cafeFAuditStatus(content:string):FundamentalObservation['auditStatus'] {
 return /^Đã kiểm toán$/iu.test(content.trim())?'AUDITED':/^Đã soát xét$/iu.test(content.trim())?'REVIEWED':/^Chưa kiểm toán$/iu.test(content.trim())?'UNAUDITED':'UNKNOWN';
}
type Mapping={itemId:string;label:string;semantic:MeasurementSemantic;sign?:'NEGATE_NONPOSITIVE'};
const standard:Record<string,Mapping>={
 'KQKD:10':{itemId:'REVENUE',label:'Doanh thu thuần',semantic:'FLOW'},'KQKD:20':{itemId:'GROSS_PROFIT',label:'Lợi nhuận gộp',semantic:'FLOW'},
 'KQKD:60':{itemId:'NET_INCOME',label:'Lợi nhuận sau thuế',semantic:'FLOW'},'KQKD:61':{itemId:'NET_INCOME_ATTRIBUTABLE_PARENT',label:'Lợi nhuận sau thuế của cổ đông',semantic:'FLOW'},'KQKD:70':{itemId:'BASIC_EPS',label:'Lãi cơ bản',semantic:'PER_SHARE'},
 'CDKT:110':{itemId:'CASH_AND_EQUIVALENTS',label:'Tiền và các khoản tương đương tiền',semantic:'STOCK'},'CDKT:130':{itemId:'RECEIVABLES',label:'phải thu ngắn hạn',semantic:'STOCK'},'CDKT:140':{itemId:'INVENTORY',label:'Hàng tồn kho',semantic:'STOCK'},'CDKT:270':{itemId:'TOTAL_ASSETS',label:'TỔNG CỘNG TÀI SẢN',semantic:'STOCK'},'CDKT:400':{itemId:'TOTAL_EQUITY',label:'VỐN CHỦ SỞ HỮU',semantic:'STOCK'},'CDKT:100':{itemId:'CURRENT_ASSETS',label:'TÀI SẢN NGẮN HẠN',semantic:'STOCK'},'CDKT:310':{itemId:'CURRENT_LIABILITIES',label:'Nợ ngắn hạn',semantic:'STOCK'},
 'LCTT:HDKD_20':{itemId:'CFO',label:'Lưu chuyển tiền thuần từ hoạt động kinh doanh',semantic:'FLOW'},'LCTT:HDDT_22':{itemId:'CASH_CAPEX_REPORTED',label:'Tiền chi để mua sắm',semantic:'FLOW',sign:'NEGATE_NONPOSITIVE'}
};
const bank:Record<string,Mapping>={
 'CDKT:300':{itemId:'TOTAL_ASSETS',label:'TỔNG TÀI SẢN',semantic:'STOCK'},'CDKT:500':{itemId:'TOTAL_EQUITY',label:'VỐN CHỦ SỞ HỮU',semantic:'STOCK'},'CDKT:161':{itemId:'BANK_GROSS_CUSTOMER_LOANS',label:'Cho vay và cho thuê tài chính khách hàng',semantic:'STOCK'},'CDKT:169':{itemId:'BANK_LOAN_LOSS_RESERVES',label:'Dự phòng rủi ro cho vay',semantic:'STOCK',sign:'NEGATE_NONPOSITIVE'},'CDKT:330':{itemId:'BANK_CUSTOMER_DEPOSITS',label:'Tiền gửi của khách hàng',semantic:'STOCK'},'KQKD:3':{itemId:'BANK_NET_INTEREST_INCOME',label:'Thu nhập lãi thuần',semantic:'FLOW'},'KQKD:21':{itemId:'NET_INCOME',label:'Lợi nhuận sau thuế',semantic:'FLOW'},'KQKD:26':{itemId:'NET_INCOME_ATTRIBUTABLE_PARENT',label:'Lợi nhuận sau thuế của cổ đông',semantic:'FLOW'},'KQKD:23':{itemId:'BASIC_EPS',label:'Lãi cơ bản',semantic:'PER_SHARE'},'LCTT:HDKD_27':{itemId:'CFO',label:'Lưu chuyền tiền thuần từ hoạt động kinh doanh',semantic:'FLOW'}
};
const securities:Record<string,Mapping>={
 'CDKT:270':standard['CDKT:270'],'CDKT:400':standard['CDKT:400'],'CDKT:111':{itemId:'CASH_AND_EQUIVALENTS',label:'Tiền và các khoản tương đương tiền',semantic:'STOCK'},'KQKD:200':{itemId:'NET_INCOME',label:'LỢI NHUẬN KẾ TOÁN SAU THUẾ',semantic:'FLOW'},'KQKD:501':{itemId:'BASIC_EPS',label:'Lãi cơ bản',semantic:'PER_SHARE'},'KQKD:201':{itemId:'NET_INCOME_ATTRIBUTABLE_PARENT',label:'Lợi nhuận sau thuế phân bổ cho chủ sở hữu',semantic:'FLOW'},'LCTT:HDKD_46':{itemId:'CFO',label:'Lưu chuyển tiền thuần (sử dụng vào) hoạt động kinh doanh',semantic:'FLOW'},'LCTT:HDDT_48':{itemId:'CASH_CAPEX_REPORTED',label:'Tiền chi để mua sắm',semantic:'FLOW',sign:'NEGATE_NONPOSITIVE'}
};
const summary:Record<string,Mapping>={
 'KQKD:KQKD_2':standard['KQKD:10'],'KQKD:KQKD_4':standard['KQKD:20'],'KQKD:KQKD_13':standard['KQKD:60'],'KQKD:KQKD_14':{...standard['KQKD:61'],label:'Lợi nhuận sau thuế của cổ đông Công ty mẹ'},'KQKD:KQKD_15':standard['KQKD:70'],
 'CDKT:CDKT_18':standard['CDKT:110'],'CDKT:CDKT_20':standard['CDKT:130'],'CDKT:CDKT_21':standard['CDKT:140'],'CDKT:CDKT_27':standard['CDKT:270'],'CDKT:CDKT_31':standard['CDKT:400']
};
const bankSummary:Record<string,Mapping>={
 'KQKD:KQKD_2':bank['KQKD:3'],'KQKD:KQKD_13':bank['KQKD:21'],'KQKD:KQKD_14':bank['KQKD:26'],'KQKD:KQKD_15':bank['KQKD:23'],
 'CDKT:CDKT_29':{...bank['CDKT:300'],label:'Tổng cộng tài sản'}
};
const securitiesSummary:Record<string,Mapping>={
 'KQKD:KQKD_10':{...securities['KQKD:200'],label:'Lợi nhuận sau thuế'},'KQKD:KQKD_12':securities['KQKD:501'],
 'CDKT:CDKT_15':securities['CDKT:111'],'CDKT:CDKT_22':{...securities['CDKT:270'],label:'Tổng cộng tài sản'},'CDKT:CDKT_26':securities['CDKT:400']
};
export function cafeFMapping(namespace:CafeFNamespace,statement:string,code:string,label:string,isSummary=false,extended=false):Mapping|null {
 const map=isSummary?(namespace==='BANK'?bankSummary:namespace==='SECURITIES'?securitiesSummary:namespace==='STANDARD_CORPORATE'||namespace==='REAL_ESTATE'?summary:{}):namespace==='BANK'?bank:namespace==='SECURITIES'?securities:standard;
 const borrowings:Record<string,Mapping>={'CDKT:320':{itemId:'SHORT_TERM_FINANCIAL_BORROWINGS',label:'Vay và nợ thuê tài chính ngắn hạn',semantic:'STOCK'},'CDKT:338':{itemId:'LONG_TERM_FINANCIAL_BORROWINGS',label:'Vay và nợ thuê tài chính dài hạn',semantic:'STOCK'}};
 const entry=extended&&!isSummary&&!['BANK','SECURITIES'].includes(namespace)?borrowings[statement+':'+code.trim()]??map[statement+':'+code.trim()]:map[statement+':'+code.trim()];
 // Code owns identity. A template label is only a fail-closed definition-drift check.
 return entry&&label.toLocaleLowerCase('vi').includes(entry.label.toLocaleLowerCase('vi'))?entry:null;
}
export interface CafeFProviderFact extends Pick<FundamentalObservation,'ticker'|'itemId'|'statementType'|'measurementSemantic'|'periodStart'|'periodEnd'|'periodType'|'fiscalYear'|'fiscalQuarter'|'auditStatus'|'normalized'|'publication'> {
 id:string;scope:'REVIEW_CANDIDATE';valueType:'FACT'|'MECHANICALLY_DERIVED';providerStatus:CafeFStatus;lexicalStatus:CafeFStatus;reportingScope:FundamentalObservation['reportingScope']|null;
 reportPeriodType:'ANNUAL'|'QUARTER'|'YTD';monthsCovered:number;ambiguousQuarterlyFlow:boolean;providerType:string;providerContent:string;providerTime:string;requestMode:CafeFMode;modeMismatch:boolean;
 currencyEvidence:'PROVIDER_UNDECLARED';calendarConfidence:'UNVERIFIED_CALENDAR';sourceHash:string;endpoint:CafeFEndpoint;providerCode:string|null;rawLocator:string;mappingNamespace:CafeFNamespace;mappingVersion:'cafef-poc-code-map-v1';productionAdmissible:false;retrievedAt:string;sourceFactIds:string[];
}
export function normalizeCafeF(body:string,endpoint:CafeFEndpoint,symbol:string,mode:CafeFMode,namespace:CafeFNamespace,retrievedAt:string,extended=false){
 const parsed=validateCafeFResponse(body,endpoint,symbol,mode),hash=payloadHash(body),facts:CafeFProviderFact[]=[],unmapped:{code:string;label:string;group:string|null}[]=[];
 parsed.records.forEach((r,index)=>{const period=cafeFPeriod(r,mode);const anomaly=cafeFAllZeroAnomaly(parsed.records.filter(x=>x.year===r.year&&x.quater===r.quater&&x.type===r.type)).anomaly;const statement=endpoint==='GetReportCDKT'?'CDKT':endpoint==='GetReportLCTT'?'LCTT':endpoint==='GetReportDetail'?'KQKD':r.group;
  r.data.forEach((c,line)=>{const t=parsed.templates.find(t=>t.code.trim()===c.code.trim()),label=t?.name??'';const map=cafeFMapping(namespace,statement??'',c.code,label,endpoint==='GetReportSummary',extended);
   if(!map){unmapped.push({code:c.code,label,group:r.group});return;}
   const value=c.value===null?null:String(c.value),unit=map.semantic==='PER_SHARE'?'CURRENCY_PER_SHARE':'CURRENCY';
   const normalized=value===null?null:normalizeLexical(value,{format:'CANONICAL',unit,sign:map.sign??'IDENTITY',missingTokens:[]});
   const numeric=normalized?.state==='AVAILABLE'?normalized.value:null,lexicalStatus=numeric===null?value===null?'MISSING':'UNVERIFIED':decimal(numeric).isZero?'VALID_ZERO':'VALID_VALUE';
   facts.push({id:payloadHash([hash,endpoint,mode,index,line,namespace].join(':')),scope:'REVIEW_CANDIDATE',ticker:symbol,itemId:map.itemId,statementType:statement==='CDKT'?'BALANCE':statement==='LCTT'?'CASH_FLOW':'INCOME',measurementSemantic:map.semantic,periodStart:map.semantic==='STOCK'?period.periodEnd:period.periodStart,periodEnd:period.periodEnd,periodType:map.semantic==='STOCK'?'INSTANT':period.periodType,reportPeriodType:period.periodType as 'ANNUAL'|'QUARTER'|'YTD',fiscalYear:period.fiscalYear,fiscalQuarter:period.fiscalQuarter,monthsCovered:period.monthsCovered,ambiguousQuarterlyFlow:statement==='LCTT'&&period.periodType==='QUARTER'&&r.quater>1,calendarConfidence:period.calendarConfidence,auditStatus:cafeFAuditStatus(r.content),normalized:{value:numeric,unit,currency:'VND'},providerStatus:numeric===null?value===null?'MISSING':'PROVIDER_ANOMALY':anomaly?'PROVIDER_ANOMALY':'UNVERIFIED',lexicalStatus,reportingScope:null,providerType:r.type,providerContent:r.content,providerTime:r.time,requestMode:mode,modeMismatch:period.modeMismatch,currencyEvidence:'PROVIDER_UNDECLARED',publication:{publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN',publicationStatus:'UNKNOWN',timezone:null,evidenceReference:null},sourceHash:hash,endpoint,providerCode:c.code,rawLocator:`value/data/record:${index}/data/${line}`,mappingNamespace:namespace,mappingVersion:'cafef-poc-code-map-v1',valueType:'FACT',productionAdmissible:false,retrievedAt,sourceFactIds:[]});
  });
 });
 return {...parsed,facts,unmapped};
}
/** Entire all/near-zero records stay quarantined even when adjacent evidence is unavailable. */
export function cafeFAllZeroAnomaly(records:readonly CafeFRecord[]){
 const cells=records.flatMap(r=>r.data).filter(c=>c.value!==null&&/^-?\d+(?:\.\d+)?$/.test(String(c.value)));
 const zero=cells.filter(c=>decimal(String(c.value)).isZero).length;
 return {anomaly:cells.length>=8&&zero/cells.length>=0.95,zeroLines:zero,observedLines:cells.length};
}
export type ReconciliationStatus='MATCH'|'MATCH_WITHIN_TOLERANCE'|'CONFLICT'|'NOT_COMPARABLE'|'MISSING';
export function reconcileCafeFValues(a:string|null,b:string|null,comparable=true,absolute='1000',relative='0.000001'):ReconciliationStatus {
 if(!comparable)return 'NOT_COMPARABLE';if(a===null||b===null)return 'MISSING';const x=decimal(a),y=decimal(b);if(x.eq(y))return 'MATCH';const delta=x.sub(y);const abs=delta.negative?delta.neg():delta;const magnitude=(x.negative?x.neg():x).add(y.negative?y.neg():y);
 return abs.units<=decimal(absolute).units||abs.units*2n*1000000000000n<=magnitude.units*decimal(relative).units?'MATCH_WITHIN_TOLERANCE':'CONFLICT';
}
export function selectCafeFAnalysisPeriod(facts:readonly CafeFProviderFact[],asOf:string,mode:'CURRENT_ANALYSIS'|'HISTORICAL_REPLAY'){
 // Unknown public timestamps cannot become historical PIT evidence by using retrieval time.
 const eligible=facts.filter(f=>f.periodEnd<=asOf.slice(0,10)&&f.retrievedAt<=asOf&&(f.publication.publishedAt===null||f.publication.publishedAt<=asOf)&&!f.modeMismatch&&!f.ambiguousQuarterlyFlow&&f.normalized.value!==null&&!['PROVIDER_ANOMALY','CONFLICT','MISSING'].includes(f.providerStatus)&&f.endpoint!=='GetReportSummary'&&(mode==='CURRENT_ANALYSIS'||f.publication.publicationStatus==='VERIFIED'&&f.publication.publishedAt!==null&&f.publication.publishedAt<=asOf&&f.retrievedAt<=asOf));
 const latest=(type:CafeFProviderFact['periodType'])=>eligible.filter(f=>(f.periodType==='INSTANT'?f.reportPeriodType:f.periodType)===type).sort((a,b)=>b.periodEnd.localeCompare(a.periodEnd)||(b.auditStatus==='AUDITED'?1:0)-(a.auditStatus==='AUDITED'?1:0)||(b.reportingScope==='CONSOLIDATED'?1:0)-(a.reportingScope==='CONSOLIDATED'?1:0)||a.providerType.localeCompare(b.providerType)||a.id.localeCompare(b.id))[0]??null;
 const annual=latest('ANNUAL'),quarter=latest('QUARTER'),ytd=latest('YTD'),year=Number(asOf.slice(0,4));
 const effective=annual?.fiscalYear===year?annual:ytd?.fiscalYear===year?ytd:quarter?.fiscalYear===year?quarter:annual;
 return {latestAnnual:annual,latestQuarter:quarter,latestYtd:ytd,effectiveAnalysisPeriod:effective,productionAdmissible:false as const};
}
export function cafeFRawCapture(row:{payloadHash:string;requestFingerprint:string;url:string;symbol:string;retrievedAt:string;httpStatus:number|null},body:string):FundamentalRawCapture {
 if(payloadHash(body)!==row.payloadHash)throw Error('RAW_HASH_MISMATCH');
 return validateFundamentalCapture({id:payloadHash(row.requestFingerprint+row.retrievedAt+row.payloadHash),sourceVersionId:'cafef-structured-poc-v1',importExecutionId:'cafef-poc-2026-10-13',requestFingerprint:row.requestFingerprint,resourceReference:'cafef-public-request-sha256:'+payloadHash(row.url),sourceRecordId:row.symbol,sourceRecordVersion:null,retrievedAt:row.retrievedAt,mediaType:'application/json',responseStatus:row.httpStatus??599,payload:body,payloadHash:row.payloadHash});
}
