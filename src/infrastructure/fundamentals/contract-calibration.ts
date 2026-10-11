import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {cafeFSchema} from './cafef-schema';
import {auditCafeFRefresh} from './cafef-refresh';
import {financialHash} from './hybrid-input';
import {CAFEF_ACTIVE_MODES,payloadHash,reconcileCafeFValues,type CafeFEndpoint,type CafeFMode,type CafeFNamespace} from './cafef';
import {independentComparable,CONTRACT_VERSION,contractBodyHash,type ContractRegistry,type ProviderContract,type MappingContract,type CalibrationReference} from '@/domain/fundamentals/structured-certification';
import {buildHybridAdmission,type HybridInput,type StructuredFinancialCandidate} from '@/domain/fundamentals/hybrid-admission';
import {decimal} from '@/domain/portfolio/values';
export const NORMALIZER_VERSION='cafef-structured-sector-v3:contract-observation-v1';
interface Request {symbol:string;endpoint:CafeFEndpoint;TypeTime:CafeFMode;rawPayloadLocation:string;payloadHash:string;requestFingerprint:string;retrievedAt:string;error:string|null;httpStatus:number|null;pageIndex?:number}
export function calibrateCafeFContracts(root:string,input:HybridInput,requests:readonly Request[],options:{historicalCafeFReplay?:boolean}={}){
 if(!options.historicalCafeFReplay){requests=requests.filter(r=>CAFEF_ACTIVE_MODES.some(mode=>mode===r.TypeTime));input={...input,candidates:input.candidates.filter(c=>CAFEF_ACTIVE_MODES.some(mode=>mode===c.requestMode))};}
 const base=buildHybridAdmission({...input,contractRegistry:undefined},financialHash);
 const selectedIssuerIds=new Set(base.canonicalFacts.flatMap(f=>f.verificationIds));
 const validVerifications=input.verifications.filter(v=>!base.invalidVerificationIds.includes(v.id)&&selectedIssuerIds.has(v.id));
 const schemas=new Map<string,ReturnType<typeof cafeFSchema>>(),captures=[],schemaErrors=[] as {request:string;error:string}[];
 for(const r of requests.filter(r=>r.httpStatus===200&&!r.error)){
  const namespace=input.candidates.find(c=>c.ticker===r.symbol)?.mappingNamespace as CafeFNamespace|undefined;if(!namespace)continue;
  const body=readFileSync(resolve(root,r.rawPayloadLocation),'utf8');if(payloadHash(body)!==r.payloadHash)throw Error('RETAINED_CAPTURE_HASH');
  try{const schema=cafeFSchema(body,r.endpoint,r.symbol,r.TypeTime,namespace);schemas.set([r.payloadHash,r.endpoint,r.TypeTime,namespace].join('|'),schema);captures.push({...r,namespace,fingerprint:schema.fingerprint,material:schema.material,rows:schema.rows,collisionCodes:schema.collisionCodes,recordCount:schema.parsed.records.length,rejectedPeriods:schema.parsed.rejectedRecords.length});}catch(e){schemaErrors.push({request:r.requestFingerprint,error:e instanceof Error?e.message:'SCHEMA_INVALID'});}
 }
 const refreshAudits=[] as ReturnType<typeof auditCafeFRefresh>[];
 const priorCaptures=new Map<string,typeof captures[number]>();
 const changedCells=new Set<string>();
 for(const capture of [...captures].sort((a,b)=>a.retrievedAt.localeCompare(b.retrievedAt)||a.requestFingerprint.localeCompare(b.requestFingerprint))){
  const key=[capture.symbol,capture.endpoint,capture.TypeTime,capture.namespace,capture.pageIndex??1].join('|'),prior=priorCaptures.get(key)??capture;
  const audit=auditCafeFRefresh(readFileSync(resolve(root,prior.rawPayloadLocation),'utf8'),readFileSync(resolve(root,capture.rawPayloadLocation),'utf8'),capture.endpoint,capture.symbol,capture.TypeTime,capture.namespace);refreshAudits.push(audit);
  for(const revision of audit.revisions)changedCells.add([capture.payloadHash,capture.endpoint,capture.TypeTime,revision.year,revision.quarter,revision.providerType,revision.rawCode.trim()].join('|'));
  priorCaptures.set(key,capture);
 }
 const candidates=input.candidates.map(c=>{
  const schema=schemas.get([c.sourceHash,c.endpoint,c.requestMode,c.mappingNamespace].join('|'));if(!schema)return c;
  const records=schema.parsed.records.filter(r=>r.year===c.fiscalYear&&r.quater===(c.fiscalQuarter??0)&&r.type===c.providerType);
  const cells=records.flatMap(r=>r.data),raw=cells.find(cell=>cell.code.trim()===c.providerCode?.trim());
  const grouped=new Map<string,string[]>();for(const cell of cells){const key=cell.code.trim(),value=String(cell.value);grouped.set(key,[...(grouped.get(key)??[]),value]);}
  const conflict=[...grouped.values()].some(v=>new Set(v).size>1);
  let identity:'PASS'|'FAIL'|'NOT_APPLICABLE'|'UNKNOWN'=c.endpoint==='GetReportCDKT'?'UNKNOWN':'NOT_APPLICABLE';
  if(c.endpoint==='GetReportCDKT'){
   const codes=c.mappingNamespace==='BANK'?['300','400','500']:['270','300','400'];
   const labels=codes.map(code=>schema.rows.find(row=>row.normalizedCode===code)?.label.toLowerCase()??'');
   const values=codes.map(code=>cells.find(cell=>cell.code.trim()===code)?.value??null);
   if(labels[0].includes('tài sản')&&labels[1].includes('nợ phải trả')&&labels[2].includes('vốn chủ sở hữu')&&values.every(v=>v!==null))try{identity=reconcileCafeFValues(String(values[0]),decimal(String(values[1])).add(decimal(String(values[2]))).toString())==='CONFLICT'?'FAIL':'PASS';}catch{identity='FAIL';}
  }
  const numeric=cells.filter(cell=>cell.value!==null&&/^-?\d+(?:\.\d+)?$/.test(String(cell.value)));const zero=numeric.filter(cell=>decimal(String(cell.value)).isZero).length;
  return {...c,contractMetadata:{schemaFingerprint:schema.fingerprint,reportType:c.endpoint==='GetReportDetail'?'KQKD':'ALL',rawCode:c.providerCode??'',normalizedCode:c.providerCode?.trim()??'',rawValue:raw?.value===null||raw?.value===undefined?null:String(raw.value),rawProviderUnit:schema.parsed.unit,normalizerVersion:NORMALIZER_VERSION,schemaValid:true,crossEndpointUncertain:false,crossEndpointConflict:input.candidates.some(other=>other.id!==c.id&&other.ticker===c.ticker&&other.itemId===c.itemId&&other.normalized.unit===c.normalized.unit&&other.normalized.currency===c.normalized.currency&&!other.modeMismatch&&other.periodEnd===c.periodEnd&&(c.measurementSemantic==='STOCK'||other.periodStart===c.periodStart&&other.reportPeriodType===c.reportPeriodType)&&other.normalized.value!==null&&c.normalized.value!==null&&reconcileCafeFValues(c.normalized.value,other.normalized.value,true,c.normalized.unit==='CURRENCY_PER_SHARE'?'0.01':'1000')==='CONFLICT'),knownIssuerConflict:validVerifications.some(v=>v.scope==='CONSOLIDATED'&&independentComparable(c,v)&&c.normalized.value!==null&&reconcileCafeFValues(c.normalized.value,v.value,true,v.unit==='CURRENCY_PER_SHARE'?'0.01':'1000')==='CONFLICT'),codeCollision:schema.collisionCodes.includes(c.providerCode?.trim()??''),statementAnomaly:numeric.length>=8&&zero/numeric.length>=0.95,accountingIdentity:identity,duplicateAmbiguity:conflict,revisionState:changedCells.has([c.sourceHash,c.endpoint,c.requestMode,c.fiscalYear,c.fiscalQuarter??0,c.providerType,c.providerCode?.trim()].join('|'))?'UNEXPLAINED_CHANGE' as const:'UNCHANGED_RETAINED_VINTAGE' as const,revisionEvidence:null}} satisfies StructuredFinancialCandidate;
 });
 const pkey=(c:StructuredFinancialCandidate)=>[c.endpoint,c.requestMode,c.mappingNamespace,c.contractMetadata?.schemaFingerprint,c.providerType].join('|');
 const keys=[...new Set(candidates.filter(c=>c.contractMetadata&&c.endpoint!=='GetReportSummary').map(pkey))].sort();
 const allSamples:CalibrationReference[]=[],providers:ProviderContract[]=[],mappings:MappingContract[]=[];
 for(const key of keys){
  const rows=candidates.filter(c=>pkey(c)===key),seed=rows[0],pairs:CalibrationReference[]=[];
  for(const c of rows)for(const v of validVerifications.filter(v=>independentComparable(c,v)&&v.scope==='CONSOLIDATED')){
   if(c.normalized.value===null||decimal(c.normalized.value).isZero||c.modeMismatch||c.ambiguousQuarterlyFlow&&!(c.requestMode==='QUY'&&v.reportPeriodType==='QUARTER'&&v.definitionVerified)||c.providerStatus==='PROVIDER_ANOMALY'||c.providerStatus==='CONFLICT'||c.contractMetadata?.codeCollision)continue;
   const result=reconcileCafeFValues(c.normalized.value,v.value,true,v.unit==='CURRENCY_PER_SHARE'?'0.01':'1000');
   pairs.push({id:'calibration:'+financialHash({candidate:c.id,issuer:v.id}),candidateId:c.id,issuerFactId:v.id,ticker:c.ticker,fiscalYear:c.fiscalYear,scope:v.scope,sourceHash:v.sourceHash,rawHash:c.sourceHash,evidenceReference:v.evidenceReference,result:result==='MATCH'||result==='MATCH_WITHIN_TOLERANCE'?result:'PROVIDER_ERROR',value:c.normalized.value,issuerValue:v.value,phase:'SEMANTIC_CERTIFICATION'});
  }
  const unique=[...new Map(pairs.map(r=>{const c=rows.find(c=>c.id===r.candidateId)!;return [[r.ticker,c.itemId,c.periodStart,c.periodEnd,r.scope].join('|'),r];})).values()].sort((a,b)=>a.id.localeCompare(b.id));
  const positive=unique.filter(s=>s.result==='MATCH'||s.result==='MATCH_WITHIN_TOLERANCE');
  const providerId='provider-contract:'+financialHash({key,version:CONTRACT_VERSION});
  const symbols=[...new Set(positive.map(s=>s.ticker))].sort();
  const periodBasis:ProviderContract['periodBasis']=seed.measurementSemantic==='STOCK'?'STOCK':seed.requestMode==='NAM'?'ANNUAL':seed.requestMode==='LUYKE'?'YTD':seed.endpoint==='GetReportLCTT'&&!positive.some(s=>(rows.find(c=>c.id===s.candidateId)?.fiscalQuarter??0)>1)?'UNKNOWN':'STANDALONE_QUARTER';
  const pbody={id:providerId,provider:'CAFEF' as const,endpoint:seed.endpoint,reportType:seed.endpoint==='GetReportDetail'?'KQKD':'ALL',statementFamily:seed.endpoint==='GetReportCDKT'?'BALANCE_SHEET':seed.endpoint==='GetReportDetail'?'INCOME_STATEMENT':'CASH_FLOW',mode:seed.requestMode,namespace:seed.mappingNamespace,schemaFingerprint:seed.contractMetadata!.schemaFingerprint,providerType:seed.providerType,scope:'CONSOLIDATED' as const,periodBasis,calendar:'JAN_DEC' as const,auditSemantics:'PROVIDER_CONTENT_STATUS_NOT_AUDIT_AUTHORITY',revisionPolicy:'NO_UNEXPLAINED_CHANGE' as const,applicableSymbols:symbols,sampleReferences:positive.map(s=>s.id),state:symbols.length>=2&&positive.length>=4&&periodBasis!=='UNKNOWN'?'CERTIFIED' as const:'REVIEW_REQUIRED' as const,reviewedAt:input.systemKnownAt,reviewerEvidenceIdentity:'RETAINED_QUALIFIED_ISSUER_SEMANTIC_CALIBRATION_V1; independent-review-required-before-promotion',normalizerVersion:NORMALIZER_VERSION};
  providers.push({...pbody,bodyHash:contractBodyHash(pbody,financialHash)});
  const mkeys=[...new Set(rows.filter(c=>c.providerCode).map(c=>[c.providerCode!.trim(),c.itemId].join('|')))].sort();
  for(const mk of mkeys){
   const subset=rows.filter(c=>[c.providerCode?.trim(),c.itemId].join('|')===mk),c=subset[0];
   const samples=unique.filter(s=>subset.some(c=>c.id===s.candidateId));
   const matched=samples.filter(s=>s.result==='MATCH'||s.result==='MATCH_WITHIN_TOLERANCE');
   const holdout=samples.at(-1);if(holdout)holdout.phase='HOLDOUT_CALIBRATION';
   const training=matched.filter(s=>s!==holdout);
   const periods=new Set(training.map(s=>{const x=subset.find(c=>c.id===s.candidateId)!;return x.periodStart+'|'+x.periodEnd;}));
   const enough=holdout!==undefined&&['MATCH','MATCH_WITHIN_TOLERANCE'].includes(holdout.result)&&new Set(training.map(s=>s.ticker)).size>=2&&periods.size>=2&&training.length>=3&&holdout!==undefined;
   // Known factual exceptions remain explicit observation vetoes; systematic mismatch invalidates the mapping.
   const errors=samples.filter(s=>s.result==='PROVIDER_ERROR');
   const basisProven=c.measurementSemantic==='STOCK'||c.requestMode==='NAM'||training.some(s=>(subset.find(c=>c.id===s.candidateId)?.fiscalQuarter??0)>1);
   const systematic=errors.length>0&&errors.length/Math.max(1,samples.length)>=0.2;
   const mbody={id:'mapping-contract:'+financialHash({providerId,mk,version:CONTRACT_VERSION}),providerContractId:providerId,provider:'CAFEF' as const,endpoint:c.endpoint,reportType:pbody.reportType,mode:c.requestMode,namespace:c.mappingNamespace,schemaFingerprint:pbody.schemaFingerprint,rawCodes:[...new Set(subset.map(c=>c.providerCode!))].sort(),normalizedCode:c.providerCode!.trim(),metric:c.itemId,measurementSemantic:c.measurementSemantic,unit:c.normalized.unit,currency:c.normalized.currency,sign:['CASH_CAPEX_REPORTED','BANK_LOAN_LOSS_RESERVES'].includes(c.itemId)?'NEGATE_NONPOSITIVE' as const:'IDENTITY' as const,scope:'CONSOLIDATED' as const,sampleReferences:samples.map(s=>s.id),knownExceptions:errors.map(s=>s.candidateId),mappingVersion:c.mappingVersion,normalizerVersion:NORMALIZER_VERSION,state:pbody.state==='CERTIFIED'&&enough&&basisProven&&!systematic?'CERTIFIED' as const:'REVIEW_REQUIRED' as const,reviewedAt:input.systemKnownAt};
   mappings.push({...mbody,bodyHash:contractBodyHash(mbody,financialHash)});
  }
  allSamples.push(...unique);
 }
 const compatibleMapping=(c:StructuredFinancialCandidate)=>{const p=providers.find(p=>p.state==='CERTIFIED'&&p.endpoint===c.endpoint&&p.mode===c.requestMode&&p.namespace===c.mappingNamespace&&p.providerType===c.providerType&&p.schemaFingerprint===c.contractMetadata?.schemaFingerprint&&p.applicableSymbols.includes(c.ticker));const m=p&&mappings.find(m=>m.state==='CERTIFIED'&&m.providerContractId===p.id&&m.metric===c.itemId&&m.normalizedCode===c.providerCode?.trim());return m?{scope:p!.scope,unit:m.unit,currency:m.currency}:null;};
 for(const c of candidates){if(!c.contractMetadata)continue;const primary=compatibleMapping(c);const discrepant=candidates.filter(other=>other.id!==c.id&&other.ticker===c.ticker&&other.itemId===c.itemId&&!other.modeMismatch&&other.periodEnd===c.periodEnd&&(c.measurementSemantic==='STOCK'||other.periodStart===c.periodStart&&other.reportPeriodType===c.reportPeriodType)&&other.normalized.value!==null&&c.normalized.value!==null&&reconcileCafeFValues(c.normalized.value,other.normalized.value,true,c.normalized.unit==='CURRENCY_PER_SHARE'?'0.01':'1000')==='CONFLICT');const comparable=discrepant.filter(other=>{const peer=compatibleMapping(other);return primary&&peer&&primary.scope===peer.scope&&primary.unit===peer.unit&&primary.currency===peer.currency;});c.contractMetadata.crossEndpointConflict=comparable.length>0;c.contractMetadata.crossEndpointUncertain=discrepant.length>comparable.length;}
 const registry:ContractRegistry={version:CONTRACT_VERSION,providers,mappings,samples:allSamples.sort((a,b)=>a.id.localeCompare(b.id)),revokedIds:[],...options.historicalCafeFReplay?{}:{allowedModes:CAFEF_ACTIVE_MODES}};
 return {input:{...input,candidates,contractRegistry:registry},registry,captures,schemaErrors,refreshAudits,base};
}
