import {decimal} from '@/domain/portfolio/values';
import {instant,dateOnly} from '@/shared/time';
import type {StructuredFinancialCandidate,FinancialVerification,HybridInput} from './hybrid-admission';
import type {FinancialScope} from './manual-first';
export const CONTRACT_VERSION='cafef-contract-certification-v1';
export type ContractState='CERTIFIED'|'REVIEW_REQUIRED'|'REVOKED';
export interface CalibrationReference {id:string;candidateId:string;issuerFactId:string;ticker:string;fiscalYear:number;scope:FinancialScope;sourceHash:string;rawHash:string;evidenceReference:string;result:'MATCH'|'MATCH_WITHIN_TOLERANCE'|'PROVIDER_ERROR'|'UNRESOLVED';value:string;issuerValue:string;phase:'SEMANTIC_CERTIFICATION'|'HOLDOUT_CALIBRATION'}
export interface ProviderContract {id:string;provider:'CAFEF';endpoint:string;reportType:string;statementFamily:string;mode:string;namespace:string;schemaFingerprint:string;providerType:string;scope:FinancialScope|null;periodBasis:'ANNUAL'|'STOCK'|'STANDALONE_QUARTER'|'YTD'|'UNKNOWN';calendar:'JAN_DEC'|'UNKNOWN';auditSemantics:string;revisionPolicy:'NO_UNEXPLAINED_CHANGE';applicableSymbols:readonly string[];sampleReferences:readonly string[];state:ContractState;reviewedAt:string;reviewerEvidenceIdentity:string;normalizerVersion:string;bodyHash:string}
export interface MappingContract {id:string;providerContractId:string;provider:'CAFEF';endpoint:string;reportType:string;mode:string;namespace:string;schemaFingerprint:string;rawCodes:readonly string[];normalizedCode:string;metric:string;measurementSemantic:string;unit:string|null;currency:string|null;sign:'IDENTITY'|'NEGATE_NONPOSITIVE';scope:FinancialScope|null;sampleReferences:readonly string[];knownExceptions:readonly string[];mappingVersion:string;normalizerVersion:string;state:ContractState;reviewedAt:string;bodyHash:string}
export interface ContractRegistry {allowedModes?:readonly string[];version:typeof CONTRACT_VERSION;providers:readonly ProviderContract[];mappings:readonly MappingContract[];samples:readonly CalibrationReference[];revokedIds:readonly string[]}
export interface ContractObservationMetadata {schemaFingerprint:string;reportType:string;rawCode:string;normalizedCode:string;rawValue:string|null;rawProviderUnit:unknown;normalizerVersion:string;schemaValid:boolean;codeCollision:boolean;crossEndpointConflict:boolean;crossEndpointUncertain:boolean;knownIssuerConflict:boolean;statementAnomaly:boolean;accountingIdentity:'PASS'|'FAIL'|'NOT_APPLICABLE'|'UNKNOWN';duplicateAmbiguity:boolean;revisionState:'UNCHANGED_RETAINED_VINTAGE'|'EXPLAINED_REVISION'|'UNEXPLAINED_CHANGE';revisionEvidence:string|null}
export interface ContractObservationValidation {id:string;candidateId:string;providerContractId:string|null;mappingContractId:string|null;contractCertificateId:string|null;schemaFingerprint:string|null;scope:FinancialScope|null;unit:string|null;currency:string|null;accepted:boolean;reasons:readonly string[];bodyHash:string}
export const contractBodyHash=(v:object,hash:(v:unknown)=>string)=>hash(Object.fromEntries(Object.entries(v).filter(([k])=>k!=='bodyHash')));
function parseableNonZero(v:string|null){try{return v!==null&&!decimal(v).isZero;}catch{return false;}}
function calibrationOutcome(a:string|null,b:string,unit:string){try{if(a===null)return 'UNRESOLVED';const x=decimal(a),y=decimal(b);if(x.eq(y))return 'MATCH';const d=x.sub(y),abs=d.negative?d.neg():d,m=(x.negative?x.neg():x).add(y.negative?y.neg():y);return abs.units<=decimal(unit==='CURRENCY_PER_SHARE'?'0.01':'1000').units||abs.units*2n*1000000000000n<=m.units*1000000n?'MATCH_WITHIN_TOLERANCE':'PROVIDER_ERROR';}catch{return 'UNRESOLVED';}}
export interface RegistryEvidenceValidation {providerIds:ReadonlySet<string>;mappingIds:ReadonlySet<string>}
export function validateRegistryEvidence(registry:ContractRegistry,context:Pick<HybridInput,'candidates'|'verifications'>,hash:(v:unknown)=>string):RegistryEvidenceValidation {
 const candidates=new Map(context.candidates.map(c=>[c.id,c])),issuers=new Map(context.verifications.map(v=>[v.id,v])),samples=new Map(registry.samples.map(s=>[s.id,s]));
 if(new Set(registry.samples.map(s=>s.id)).size!==registry.samples.length)return {providerIds:new Set(),mappingIds:new Set()};
 const bound=(s:CalibrationReference,p:ProviderContract,m?:MappingContract)=>{const c=candidates.get(s.candidateId),v=issuers.get(s.issuerFactId);return !!c&&!!v&&s.ticker===c.ticker&&s.fiscalYear===c.fiscalYear&&s.scope===v.scope&&parseableNonZero(c.normalized.value)&&calibrationOutcome(c.normalized.value,v.value,v.unit)===s.result&&independentComparable(c,v)&&v.scope===p.scope&&v.sourceHash===s.sourceHash&&c.sourceHash===s.rawHash&&v.value===s.issuerValue&&c.normalized.value===s.value&&v.evidenceReference===s.evidenceReference&&c.endpoint===p.endpoint&&c.requestMode===p.mode&&c.mappingNamespace===p.namespace&&c.providerType===p.providerType&&c.contractMetadata?.schemaFingerprint===p.schemaFingerprint&&(!m||c.itemId===m.metric&&c.providerCode?.trim()===m.normalizedCode);};
 const providerIds=new Set<string>(),mappingIds=new Set<string>();
 for(const p of registry.providers){const refs=p.sampleReferences.map(id=>samples.get(id));if(p.state==='CERTIFIED'&&p.bodyHash===contractBodyHash(p,hash)&&refs.length>=4&&new Set(p.sampleReferences).size===p.sampleReferences.length&&refs.every(s=>s&&bound(s,p)&&['MATCH','MATCH_WITHIN_TOLERANCE'].includes(s.result))&&new Set(refs.map(s=>s!.ticker)).size>=2&&p.applicableSymbols.every(t=>refs.some(s=>s!.ticker===t)))providerIds.add(p.id);}
 for(const m of registry.mappings){const p=registry.providers.find(p=>p.id===m.providerContractId),refs=m.sampleReferences.map(id=>samples.get(id));if(!p||!providerIds.has(p.id)||m.state!=='CERTIFIED'||m.bodyHash!==contractBodyHash(m,hash)||new Set(m.sampleReferences).size!==m.sampleReferences.length||!refs.every(s=>s&&bound(s,p,m)))continue;
  const train=refs.filter(s=>s!.phase==='SEMANTIC_CERTIFICATION'&&['MATCH','MATCH_WITHIN_TOLERANCE'].includes(s!.result));const holdouts=refs.filter(s=>s!.phase==='HOLDOUT_CALIBRATION');const periods=new Set(train.map(s=>{const c=candidates.get(s!.candidateId)!;return c.periodStart+'|'+c.periodEnd;}));
  if(train.length>=3&&new Set(train.map(s=>s!.ticker)).size>=2&&periods.size>=2&&holdouts.length>=1&&holdouts.every(s=>['MATCH','MATCH_WITHIN_TOLERANCE'].includes(s!.result))&&refs.filter(s=>s!.result==='PROVIDER_ERROR').every(s=>m.knownExceptions.includes(s!.candidateId)))mappingIds.add(m.id);
 }
 return {providerIds,mappingIds};
}
export function validateContractObservation(c:StructuredFinancialCandidate,registry:ContractRegistry,context:Pick<HybridInput,'analysisAt'|'systemKnownAt'|'mode'|'candidates'|'verifications'|'sourceBindings'>,hash:(v:unknown)=>string,evidence=validateRegistryEvidence(registry,context,hash)):ContractObservationValidation {
 const reasons:string[]=[],meta=c.contractMetadata;
 if(registry.allowedModes&&!registry.allowedModes.includes(c.requestMode))reasons.push('CAFEF_MODE_DISABLED');
 if(registry.version!==CONTRACT_VERSION)reasons.push('CONTRACT_VERSION_UNSUPPORTED');
 const providerMatches=meta?registry.providers.filter(p=>p.endpoint===c.endpoint&&p.mode===c.requestMode&&p.namespace===c.mappingNamespace&&p.schemaFingerprint===meta.schemaFingerprint&&p.providerType===c.providerType):[];const p=providerMatches[0];
 const mappingMatches=p?registry.mappings.filter(m=>m.providerContractId===p.id&&m.normalizedCode===c.providerCode?.trim()&&m.metric===c.itemId):[];const m=mappingMatches[0];
 if(providerMatches.length>1)reasons.push('PROVIDER_CONTRACT_AMBIGUITY');if(mappingMatches.length>1)reasons.push('MAPPING_CONTRACT_AMBIGUITY');
 const valid=(x:ProviderContract|MappingContract)=>x.state==='CERTIFIED'&&!registry.revokedIds.includes(x.id)&&x.bodyHash===contractBodyHash(x,hash)&&x.reviewedAt<=context.systemKnownAt;
 if(!meta||!meta.schemaValid)reasons.push('SCHEMA_UNCERTIFIED');
 if(!p||!valid(p)||!evidence.providerIds.has(p.id))reasons.push('PROVIDER_CONTRACT_UNCERTIFIED');
 if(!m||!valid(m)||!evidence.mappingIds.has(m.id))reasons.push('MAPPING_CONTRACT_UNCERTIFIED');
 try{dateOnly(c.periodStart);dateOnly(c.periodEnd);instant(c.retrievedAt);if(c.normalized.value===null)reasons.push('MISSING_VALUE');else if(decimal(c.normalized.value).isZero)reasons.push('ZERO_REQUIRES_ISSUER_VERIFICATION');if(p)instant(p.reviewedAt);if(m)instant(m.reviewedAt);}catch{reasons.push('MALFORMED_VALUE_OR_PERIOD');}
 if(c.modeMismatch||c.periodStart>c.periodEnd||c.periodEnd>context.analysisAt.slice(0,10)||c.retrievedAt>context.systemKnownAt||c.fiscalQuarter!==null&&![1,2,3,4].includes(c.fiscalQuarter))reasons.push('INVALID_PERIOD_OR_MODE');
 const quarterEnd=c.fiscalQuarter===null?null:['03-31','06-30','09-30','12-31'][c.fiscalQuarter-1],expectedEnd=c.reportPeriodType==='ANNUAL'?`${c.fiscalYear}-12-31`:quarterEnd?`${c.fiscalYear}-${quarterEnd}`:null;const expectedStart=c.measurementSemantic==='STOCK'?expectedEnd:c.reportPeriodType==='QUARTER'&&c.fiscalQuarter!==null?`${c.fiscalYear}-${String((c.fiscalQuarter-1)*3+1).padStart(2,'0')}-01`:`${c.fiscalYear}-01-01`;
 if(c.periodEnd!==expectedEnd||c.periodStart!==expectedStart||c.requestMode!==({ANNUAL:'NAM',QUARTER:'QUY',YTD:'LUYKE'} as const)[c.reportPeriodType])reasons.push('FISCAL_CALENDAR_WINDOW_MISMATCH');
 try{if(c.normalized.value!==null&&['TOTAL_ASSETS','CASH_AND_EQUIVALENTS','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS','SHORT_TERM_FINANCIAL_BORROWINGS','LONG_TERM_FINANCIAL_BORROWINGS'].includes(c.itemId)&&decimal(c.normalized.value).negative)reasons.push('IMPOSSIBLE_ACCOUNTING_SIGN');}catch{reasons.push('MALFORMED_VALUE_OR_PERIOD');}
 if(c.valueType!=='FACT'||c.endpoint==='GetReportSummary')reasons.push('NON_INDEPENDENT_OR_DERIVED_PROVIDER_VALUE');
 if(['PROVIDER_ANOMALY','CONFLICT'].includes(c.providerStatus)||meta?.statementAnomaly)reasons.push('PROVIDER_ANOMALY_OR_CONFLICT');
 if(meta?.accountingIdentity==='FAIL'||c.measurementSemantic==='STOCK'&&c.endpoint==='GetReportCDKT'&&meta?.accountingIdentity!=='PASS')reasons.push('ACCOUNTING_IDENTITY_UNPROVEN_OR_FAILED');
 if(meta?.codeCollision)reasons.push('NORMALIZED_CODE_COLLISION');
 if(meta?.crossEndpointUncertain)reasons.push('PEER_COMPARABILITY_UNVERIFIED');
 if(meta?.crossEndpointConflict)reasons.push('CROSS_ENDPOINT_MATERIAL_CONFLICT');
 if(meta?.knownIssuerConflict)reasons.push('KNOWN_ISSUER_CONFLICT');
 if(meta?.duplicateAmbiguity)reasons.push('DUPLICATE_AMBIGUITY');
 if(meta?.revisionState==='UNEXPLAINED_CHANGE'||meta?.revisionState==='EXPLAINED_REVISION'&&(!meta.revisionEvidence||!context.sourceBindings.some(b=>b.path===meta.revisionEvidence&&/^[a-f0-9]{64}$/.test(b.sha256))||!context.verifications.some(v=>independentComparable(c,v)&&v.revisionStatus==='RESTATED'&&v.revisionEvidence===meta.revisionEvidence&&v.supersedesFactId!==null&&context.verifications.some(previous=>previous.id===v.supersedesFactId&&independentComparable(c,previous)))))reasons.push('REVISION_UNEXPLAINED');
 if(p&&m&&meta){
  if(!p.applicableSymbols.includes(c.ticker))reasons.push('SYMBOL_SCOPE_NOT_CALIBRATED');
  if(p.calendar!=='JAN_DEC'||p.scope===null||m.scope!==p.scope)reasons.push('SCOPE_OR_CALENDAR_UNCERTIFIED');
  if(m.unit!==c.normalized.unit||m.currency!==c.normalized.currency||m.unit===null)reasons.push('UNIT_UNCERTIFIED');
  if(m.normalizerVersion!==meta.normalizerVersion||p.normalizerVersion!==meta.normalizerVersion||m.mappingVersion!==c.mappingVersion||m.measurementSemantic!==c.measurementSemantic||m.schemaFingerprint!==meta.schemaFingerprint||m.namespace!==c.mappingNamespace||m.mode!==c.requestMode||m.endpoint!==c.endpoint||meta.rawCode!==c.providerCode||meta.normalizedCode!==c.providerCode?.trim()||p.reportType!==meta.reportType||m.reportType!==meta.reportType)reasons.push('CONTRACT_BINDING_MISMATCH');
  try{if(meta.rawValue===null)reasons.push('RAW_VALUE_MISSING');else{const raw=decimal(meta.rawValue);const expected=m.sign==='NEGATE_NONPOSITIVE'?raw.neg():raw;if(m.sign==='NEGATE_NONPOSITIVE'&&!raw.negative&&!raw.isZero||c.normalized.value===null||!expected.eq(decimal(c.normalized.value)))reasons.push('VALUE_NORMALIZATION_MISMATCH');}}catch{reasons.push('MALFORMED_RAW_VALUE');}
  if(m.knownExceptions.includes(c.id))reasons.push('KNOWN_PROVIDER_ERROR');
  if(c.reportPeriodType==='ANNUAL'&&(p.periodBasis!=='ANNUAL'&&p.periodBasis!=='STOCK'||c.monthsCovered!==12||c.fiscalQuarter!==null))reasons.push('ANNUAL_SEMANTICS_UNCERTIFIED');
  if(c.reportPeriodType==='QUARTER'&&c.measurementSemantic!=='STOCK'&&(p.periodBasis!=='STANDALONE_QUARTER'||c.monthsCovered!==3))reasons.push('QUARTER_FLOW_BASIS_UNVERIFIED');
  if(c.reportPeriodType==='YTD'&&c.measurementSemantic!=='STOCK'&&(p.periodBasis!=='YTD'||c.monthsCovered!==(c.fiscalQuarter??0)*3||c.periodStart!==`${c.fiscalYear}-01-01`))reasons.push('YTD_SEMANTICS_UNCERTIFIED');
  if(c.measurementSemantic==='STOCK'&&(c.periodType!=='INSTANT'||c.periodStart!==c.periodEnd))reasons.push('STOCK_PERIOD_INVALID');
 }
 if(c.reportPeriodType==='QUARTER'&&c.measurementSemantic!=='STOCK'&&p?.periodBasis!=='STANDALONE_QUARTER')reasons.push('QUARTER_FLOW_BASIS_UNVERIFIED');
 if(c.reportPeriodType==='YTD'&&c.measurementSemantic!=='STOCK'&&p?.periodBasis!=='YTD')reasons.push('YTD_SEMANTICS_UNCERTIFIED');
 if(c.ambiguousQuarterlyFlow&&!(p?.periodBasis==='STANDALONE_QUARTER'&&m&&valid(p)&&valid(m)&&evidence.providerIds.has(p.id)&&evidence.mappingIds.has(m.id)))reasons.push('QUARTER_FLOW_BASIS_UNVERIFIED');
 if(context.mode==='HISTORICAL_REPLAY'&&(c.publication.publicationStatus!=='VERIFIED'||c.publication.publishedAt===null||c.publication.publishedAt>context.analysisAt))reasons.push('HISTORICAL_PIT_UNPROVEN');
 const body={id:'observation-validation:'+hash({candidateId:c.id,provider:p?.bodyHash??null,mapping:m?.bodyHash??null,mode:context.mode,reasons:[...new Set(reasons)].sort()}),candidateId:c.id,providerContractId:p?.id??null,mappingContractId:m?.id??null,contractCertificateId:p&&m?'contract-certificate:'+hash({provider:p.bodyHash,mapping:m.bodyHash}):null,schemaFingerprint:meta?.schemaFingerprint??null,scope:p?.scope??null,unit:m?.unit??null,currency:m?.currency??null,accepted:reasons.length===0,reasons:[...new Set(reasons)].sort()};
 return {...body,bodyHash:hash(body)};
}
/** Samples establish semantics within their observed issuer/schema/mode domain, never population accuracy. */
export function independentComparable(c:StructuredFinancialCandidate,v:FinancialVerification){return v.qualified&&v.definitionVerified&&v.valueVerified&&v.provenanceVerified&&c.ticker===v.ticker&&c.itemId===v.itemId&&c.periodStart===v.period.start&&c.periodEnd===v.period.end&&(c.measurementSemantic==='STOCK'||c.reportPeriodType===v.reportPeriodType)&&c.normalized.unit===v.unit&&c.normalized.currency===v.currency;}
export function revokeContracts(registry:ContractRegistry,ids:readonly string[]):ContractRegistry{return {...registry,revokedIds:[...new Set([...registry.revokedIds,...ids])].sort()};}
