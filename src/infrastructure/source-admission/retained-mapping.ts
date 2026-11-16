/** Retained reviewed-cell admission adapter. No authority/DB/score promotion. */
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { normalizeLexical } from '@/domain/fundamentals/normalization';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
import { dateOnly, instant } from '@/shared/time';
import { sha, type SourcePin } from './registry';

export const RETAINED_MAPPING_ADAPTER_VERSION = 'retained-reviewed-financial-admission-v1';
export const RETAINED_MAPPING_POLICY_VERSION = 'retained-current-purpose-validation-v1';
type ObjectValue = Record<string, unknown>;
export interface RetainedMapping {
 id:string; ticker:string; concept:string; scope:string; start:string; end:string;
 vintage:string; unit:string; category:string; path:string; sha256:string; pointer:string;
 checks:ObjectValue; valueKey?:string; scalarReviewedCell?:boolean;
 evidenceReference?:string; evidenceSha256?:string;
}
export interface MappedObservation {
 mappingId:string; ticker:string; concept:string; scope:string; start:string; end:string;
 vintage:string; unit:string; value:string|null; sourceHash:string;
 /** Echo the exact source label/code/column/period witnesses, not only the amount. */
 witnesses:ObjectValue;
}
export interface RetainedAdmissionRequest {
 ticker:string; economicCutoff:string; knownAt:string;
 purpose:'CURRENT_FORMAL_VALUATION'|'HISTORICAL_PIT'; observations:readonly MappedObservation[];
}
function must(value:unknown,reason:string):asserts value { if(!value) throw Error(reason); }
function object(value:unknown):ObjectValue { must(value!==null&&typeof value==='object'&&!Array.isArray(value),'OBJECT_REQUIRED'); return value as ObjectValue; }
function at(value:unknown,pointer:string):unknown {
 must(pointer.startsWith('/'),'EXACT_POINTER_REQUIRED');
 return pointer.slice(1).split('/').reduce<unknown>((v,k)=>{
  const key=k.replace(/~1/g,'/').replace(/~0/g,'~');
  must(v!==null&&typeof v==='object'&&Object.hasOwn(v,key),'SOURCE_POINTER_MISSING');
  return (v as ObjectValue)[key];
 },value);
}
const same=(a:unknown,b:unknown)=>snapshotHash(a)===snapshotHash(b);

const STOCK_CONCEPTS = new Set([
 'TOTAL_ASSETS','TOTAL_EQUITY','TOTAL_LIABILITIES','CASH','CASH_EQUIVALENTS','CASH_AND_EQUIVALENTS',
 'SHORT_TERM_FINANCIAL_ASSETS','LONG_TERM_FINANCIAL_ASSETS','SHORT_TERM_DEPOSITS','LONG_TERM_DEPOSITS',
 'HELD_TO_MATURITY_CURRENT','LONG_TERM_INVESTMENTS','RECEIVABLES','TRADE_RECEIVABLES','INVENTORY','INVENTORY_GROSS',
 'CURRENT_ASSETS','CURRENT_LIABILITIES','TRADE_PAYABLES','CUSTOMER_ADVANCES','PAYROLL_PAYABLES',
 'SHORT_TERM_FINANCIAL_BORROWINGS','LONG_TERM_FINANCIAL_BORROWINGS','REPORTED_BORROWINGS',
 'CURRENT_TAX_PAYABLE','DIVIDEND_PAYABLE','EMPLOYEE_FUND_LIABILITY','SIGNED_CAPEX_COMMITMENT',
 'LEASE1Y','LEASE2TO5Y','LEASEOVER5Y',
]);
const FLOW_CONCEPTS = new Set([
 'REVENUE','COST_OF_SALES','GROSS_PROFIT','SELLING_EXPENSE','ADMIN_EXPENSE','FINANCE_EXPENSE','FINANCE_INCOME',
 'INTEREST_EXPENSE','NET_PROFIT_GROUP','NET_PROFIT_STANDALONE','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT',
 'PRETAX_PROFIT','OTHER_EXPENSE','OTHER_INCOME','ASSOCIATE_RESULT','CURRENT_TAX_EXPENSE','DEFERRED_TAX_EXPENSE',
 'CFO','DEPRECIATION_AMORTIZATION','ASSET_PURCHASE_CASH_OUTFLOW','CASH_TAX_PAID','CASH_INTEREST_PAID',
 'BORROWING_PROCEEDS','BORROWING_REPAYMENTS','RECEIVED_FINANCE_CASH','DIVIDENDS_PAID',
 'EMPLOYEE_FUND_APPROPRIATION','EMPLOYEE_FUND_ACCRUAL','EMPLOYEE_FUND_USE',
]);
const ALIASES:Readonly<Record<string,string>>={NET_PROFIT_GROUP:'NET_INCOME'};
const OUTFLOW_MAGNITUDES=new Set(['ASSET_PURCHASE_CASH_OUTFLOW','CASH_TAX_PAID','CASH_INTEREST_PAID','DIVIDENDS_PAID','BORROWING_REPAYMENTS','EMPLOYEE_FUND_USE']);
/** Port supplied by trusted application composition, never a field in an ingest request.
 * The pinned mapping is a semantic/normalization catalog, not an owner authorization.
 * Constructor pins the whole catalog; submitted observations cannot change mappings/checks.
 */
export class RetainedFinancialAdmissionAdapter {
 private readonly root:string;
 private readonly catalog:SourcePin;
 private readonly mappings:readonly RetainedMapping[];
 constructor(root:string,catalog:SourcePin){
  this.root=realpathSync(root);this.catalog=structuredClone(catalog);
  const body=object(JSON.parse(this.bytes(catalog).toString()));
  must(body.contract==='retained-financial-mapping-v1'&&typeof body.version==='string'&&body.version.length>0,'UNSUPPORTED_MAPPING_CONTRACT_VERSION');
  must(Array.isArray(body.bindings)&&body.bindings.length>0,'MAPPING_SCHEMA_REQUIRED');
  this.mappings=structuredClone(body.bindings as RetainedMapping[]);
  must(new Set(this.mappings.map(m=>m.id)).size===this.mappings.length,'DUPLICATE_MAPPING_ID');
  for(const m of this.mappings){
   must(/^[A-Z0-9]{2,8}$/.test(m.ticker)&&m.id.startsWith(m.ticker+':'),'MAPPING_TICKER_ID');
   must(['CONSOLIDATED','STANDALONE'].includes(m.scope)&&m.unit==='VND','MAPPING_SCOPE_UNIT');
   dateOnly(m.start);dateOnly(m.end);must(m.start<=m.end,'MAPPING_PERIOD');
   must(STOCK_CONCEPTS.has(m.concept)||FLOW_CONCEPTS.has(m.concept),'UNSUPPORTED_CONCEPT');
   must(STOCK_CONCEPTS.has(m.concept)?m.start===m.end:m.start<m.end,'STOCK_FLOW_PERIOD_MISMATCH');
   must(m.checks&&typeof m.checks==='object'&&!Array.isArray(m.checks),'MAPPING_WITNESSES_REQUIRED');
   must(Object.keys(m.checks).length>0||m.scalarReviewedCell===true,'EMPTY_SEMANTIC_WITNESS');
   must(!m.scalarReviewedCell||(!!m.evidenceReference&&!!m.evidenceSha256),'SCALAR_REVIEW_EVIDENCE_REQUIRED');
  }
 }
 private bytes(pin:SourcePin):Buffer {
  must(/^[a-f0-9]{64}$/.test(pin.sha256),'INVALID_HASH');
  const path=realpathSync(resolve(this.root,pin.path)),rel=relative(this.root,path);
  must(rel!==''&&rel!=='..'&&!rel.startsWith('../')&&!isAbsolute(rel),'SOURCE_OUTSIDE_ROOT');
  const bytes=readFileSync(path);must(sha(bytes)===pin.sha256,'SOURCE_HASH_CHANGED:'+pin.path);return bytes;
 }
 /** Cache exists only within one invocation; later calls recheck hashes and revocation upstream. */
 private reader(){
  const bytes=new Map<string,Buffer>(),json=new Map<string,unknown>();
  const read=(p:SourcePin)=>{const key=p.path+':'+p.sha256;if(!bytes.has(key))bytes.set(key,this.bytes(p));return bytes.get(key)!;};
  return {read,json:(p:SourcePin)=>{const key=p.path+':'+p.sha256;if(!json.has(key))json.set(key,JSON.parse(read(p).toString()));return json.get(key);}};
 }
 private cell(m:RetainedMapping,read:ReturnType<RetainedFinancialAdmissionAdapter['reader']>){
  const document=read.json({path:m.path,sha256:m.sha256});
  const raw=at(document,m.pointer);
  const cell:ObjectValue=m.scalarReviewedCell?{value:raw}:object(raw);
  for(const [key,value] of Object.entries(m.checks))must(same(cell[key],value),'SOURCE_WITNESS_MISMATCH:'+key);
  if(m.evidenceReference)read.read({path:m.evidenceReference,sha256:m.evidenceSha256!});
  const doc:ObjectValue=document!==null&&typeof document==='object'&&!Array.isArray(document)?document as ObjectValue:{};
  const flowLocators=Array.isArray(doc.newFlowNativeLocators)?doc.newFlowNativeLocators:[];
  const reviewedLocator=m.scalarReviewedCell?flowLocators.find(v=>object(v).field===m.pointer.split('/').at(-1)):undefined;
  const source=cell.source??reviewedLocator,refs=Array.isArray(source)?[...source]:source?[source]:[];
  if(cell.pdfPath)refs.push(cell);
  for(const item of refs){
   const ref=object(item);
   if(ref.path&&ref.sha256){
    const original=read.json({path:String(ref.path),sha256:String(ref.sha256)});
    if(ref.jsonPointer)at(original,String(ref.jsonPointer));
   }
   if(ref.pdfPath&&ref.pdfSha256)must(read.read({path:String(ref.pdfPath),sha256:String(ref.pdfSha256)}).subarray(0,5).toString()==='%PDF-','PDF_IDENTITY_REQUIRED');
  }
  // Explicit dimensions on the retained cell must agree, not just the request echoes.
  for(const [key,expected] of Object.entries({ticker:m.ticker,scope:m.scope,periodEnd:m.end,currency:'VND'}))
   if(cell[key]!==undefined)must(cell[key]===expected,'SOURCE_DIMENSION_MISMATCH:'+key);
  if(cell.period)must(same(cell.period,{start:m.start,end:m.end}),'SOURCE_PERIOD_MISMATCH');
  return {document,cell,source:source??(cell.pdfPath?{pdfPath:cell.pdfPath,pdfSha256:cell.pdfSha256??null,physicalPage:cell.physicalPage??null,nativeMatches:cell.nativeMatches??null,caption:cell.caption??null}:null)};
 }
 /** Generate observations from the exact pinned cells. Values never select concepts. */
 retainedObservations():MappedObservation[]{
  this.bytes(this.catalog);const read=this.reader();
  return this.mappings.map(m=>{
   const {cell}=this.cell(m,read);
   return {mappingId:m.id,ticker:m.ticker,concept:m.concept,scope:m.scope,start:m.start,end:m.end,
    vintage:m.vintage,unit:m.unit,value:cell[m.valueKey??'value'] as string|null,sourceHash:m.sha256,witnesses:structuredClone(m.checks)};
  });
 }
 plan(request:RetainedAdmissionRequest){
  this.bytes(this.catalog);dateOnly(request.economicCutoff);instant(request.knownAt);
  must(request.economicCutoff<=request.knownAt.slice(0,10),'FUTURE_ECONOMIC_CUTOFF');
  must(request.purpose==='CURRENT_FORMAL_VALUATION','HISTORICAL_PIT_NOT_QUALIFIED');
  const read=this.reader(),quarantine:{id:string;reason:string}[]=[];
  const candidates:ReturnType<RetainedFinancialAdmissionAdapter['normalize']>[]=[],seen=new Set<string>();
  for(const observation of request.observations){try{
   must(!seen.has(observation.mappingId),'DUPLICATE_OBSERVATION');seen.add(observation.mappingId);
   const m=this.mappings.find(m=>m.id===observation.mappingId);must(m,'UNKNOWN_MAPPING_ID');
   must(m.ticker===request.ticker&&observation.ticker===request.ticker,'CROSS_TICKER_OBSERVATION');
   for(const key of ['concept','scope','start','end','vintage','unit'] as const)
    must(observation[key]===m[key],'OBSERVATION_DIMENSION_MISMATCH:'+key);
   must(m.end<=request.economicCutoff,'POST_CUTOFF_OBSERVATION');
   must(observation.sourceHash===m.sha256,'OBSERVATION_SOURCE_HASH_MISMATCH');
   must(same(observation.witnesses,m.checks),'OBSERVATION_WITNESS_MISMATCH');
   const {cell,source,document}=this.cell(m,read);
   must(cell[m.valueKey??'value']===observation.value,'NATIVE_VALUE_MISMATCH');
   candidates.push(this.normalize(m,cell,source,document,request));
  }catch(error){quarantine.push({id:observation.mappingId,reason:error instanceof Error?error.message:String(error)});}}
  // Aliases share conflict identity. Different vintages/scopes are deliberately never latest-wins merged.
  const groups=new Map<string,typeof candidates>();
  for(const c of candidates){const key=snapshotHash([c.ticker,c.itemId,c.scope,c.period,c.vintage]);groups.set(key,[...(groups.get(key)??[]),c]);}
  const conflicts=new Set<string>();
  for(const group of groups.values())if(new Set(group.map(c=>c.value)).size>1)for(const c of group)conflicts.add(c.mappingId);
  for(const id of conflicts)quarantine.push({id,reason:'CONFLICTING_FINANCIAL_FACT'});
  const accepted=candidates.filter(c=>!conflicts.has(c.mappingId));
  const equivalentObservationGroups=[...groups.values()].filter(g=>g.length>1&&new Set(g.map(c=>c.value)).size===1).map(g=>g.map(c=>c.mappingId));
  return {contract:'retained-current-financial-admission-plan-v1' as const,adapterVersion:RETAINED_MAPPING_ADAPTER_VERSION,
   policyVersion:RETAINED_MAPPING_POLICY_VERSION,mappingCatalog:{...this.catalog},purpose:request.purpose,
   accepted,quarantine,equivalentObservationGroups,additive:false as const,formalAdmission:false as const,historicalPitGranted:false as const,
   databaseWritten:false as const,readyForScoring:false as const};
 }
 private normalize(m:RetainedMapping,cell:ObjectValue,source:unknown,document:unknown,request:RetainedAdmissionRequest){
  const native=cell[m.valueKey??'value'];must(typeof native==='string'&&/^-?\d+(?:\.\d+)?$/.test(native),'NON_NUMERIC_NOT_ZERO');
  // This catalog declares VND canonical numeric cells. Unknown/scaled units cannot silently become VND.
  if(cell.unit!==undefined)must(cell.unit==='CURRENCY'||cell.unit==='VND','SOURCE_UNIT_MISMATCH');
  if(cell.scale!==undefined)must(cell.scale==='1','SOURCE_SCALE_MISMATCH');
  const normalized=normalizeLexical(native,{format:'CANONICAL',unit:'CURRENCY',sign:'IDENTITY',missingTokens:[]});
  must(normalized.state==='AVAILABLE'&&normalized.value!==null,'NORMALIZATION_FAILED');
  const periodType=m.start===m.end?'STOCK':m.end.endsWith('-12-31')?'ANNUAL':'YTD';
  const root:ObjectValue=document!==null&&typeof document==='object'&&!Array.isArray(document)?document as ObjectValue:{};
  // Preserve available clocks verbatim. A review time never supplies a missing original receipt/publication.
  const q3=root.q3Source as {retrievalEvidence?:{record?:ObjectValue};reviewedAt?:string}|undefined;
  const receipt=(root.sourceReceipt as ObjectValue|undefined)??q3?.retrievalEvidence?.record;
  const clocks={publishedAt:cell.publishedAt??null,originalReceivedAt:cell.retrievedAt??receipt?.retrievedAt??null,
   reviewedAt:cell.reviewedAt??root.reviewKnownAt??q3?.reviewedAt??null,
   reviewDate:root.reviewDate??root.researchDate??null,validationKnownAt:request.knownAt};
  if(typeof clocks.reviewDate==='string')must(clocks.reviewDate.slice(0,10)<=request.knownAt.slice(0,10),'POST_KNOWLEDGE_REVIEW_DATE');
  for(const value of [clocks.publishedAt,clocks.originalReceivedAt,clocks.reviewedAt])
   if(typeof value==='string'){must(Number.isFinite(Date.parse(value)),'INVALID_SOURCE_TIME');must(Date.parse(value)<=Date.parse(request.knownAt),'POST_KNOWLEDGE_CUTOFF_EVIDENCE');}
  const classification=m.category==='REUSED_CANONICAL_SAFE_DERIVED'?'DERIVED':'REPORTED';
  return {mappingId:m.id,ticker:m.ticker,itemId:ALIASES[m.concept]??m.concept,sourceConcept:m.concept,
   scope:m.scope,period:{start:m.start,end:m.end},periodType,vintage:m.vintage,
   value:normalized.value!,unit:'CURRENCY' as const,currency:'VND' as const,classification,
   signConvention:OUTFLOW_MAGNITUDES.has(m.concept)?'REVIEWED_OUTFLOW_MAGNITUDE':'SOURCE_REVIEWED_SIGN',
   status:'ACCEPTED_BY_ADAPTER' as const,
   provenance:{mapping:{...this.catalog,pointer:'/bindings/'+this.mappings.indexOf(m)},
    retainedCell:{path:m.path,sha256:m.sha256,pointer:m.pointer,valueKey:m.valueKey??'value'},
    nativeValue:native,nativeUnit:m.unit,normalizedValue:normalized.value!,source,
    sourceDocumentId:cell.sourceDocumentId??null,rawHash:cell.sourceHash??(source&&typeof source==='object'&&!Array.isArray(source)?(source as ObjectValue).pdfSha256??null:null),
    sourceRole:cell.authority??receipt?.sourceRole??null,
    originalReceipt:receipt?{retrievedAt:receipt.retrievedAt??null,sourceUrl:receipt.sourceUrl??receipt.url??null,sha256:receipt.sha256??null}:null,
    verificationIds:cell.verificationIds??[],
    originalProvenance:cell.provenance??null,
    supportingEvidence:m.evidenceReference?{path:m.evidenceReference,sha256:m.evidenceSha256}:null,
    clocks,adapterVersion:RETAINED_MAPPING_ADAPTER_VERSION,policyVersion:RETAINED_MAPPING_POLICY_VERSION},
   consumption:{purpose:'CURRENT_FORMAL_VALUATION' as const,historicalPitEligible:false as const,
    formalAuthorityGranted:false as const,requiresGovernedPersistence:true as const,
    aggregation:'EXPLICIT_FORMULA_ONLY' as const}};
 }
}
