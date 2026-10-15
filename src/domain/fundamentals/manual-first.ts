import {validCommonShareQualification,validAnalyticalQualificationWitness,type AnalyticalQualificationWitness,type CommonShareQualification} from './current-qualification';
import {DEBT_CONTRACT,debtContractActive,debtRequirementsAt,isDebtMetric,validDebtMetadata,validCashQualification,validEbitdaQualification,selectCompatibleDebt,qualifiedNetDebt,type ComprehensiveDebtProof,type DebtMetadata,type CashQualification,type EbitdaQualification} from './debt-contract';
import {decimal} from '@/domain/portfolio/values';
import {deepFreeze} from '@/domain/portfolio/transaction';
import {instant,dateOnly} from '@/shared/time';
import {requireFundamental} from './validation';
import {canonicalJson} from './snapshot';
import type {Sector} from '@/domain/scoring/methodology';
import requirements from './manual-fundamental-evidence-requirements-v1.json' with {type:'json'};

export const MANUAL_EVIDENCE_REQUIREMENTS = deepFreeze(requirements);
export type FinancialEvidenceState = 'AVAILABLE'|'N_R'|'INSUFFICIENT'|'INVALID'|'CONFLICTING';
export type FinancialScope = 'CONSOLIDATED'|'STANDALONE';
export type AnalysisContext = {mode:'CURRENT_ANALYSIS';analysisAt:string}|{mode:'HISTORICAL_REPLAY';decisionAt:string;systemKnownAt:string};
export interface ManualStatement {
 readonly documentId:string;readonly SHA256:string;readonly ticker:string;readonly issuer:string;
 readonly documentType:'FINANCIAL_STATEMENTS'|'ANNUAL_REPORT'|'REGULATORY_DISCLOSURE';
 readonly reportingPeriod:{start:string;end:string};readonly fiscalYear:number;readonly fiscalQuarter:number|null;
 readonly reportingScope:FinancialScope;readonly currency:string;readonly unitBasis:string;
 readonly retainedPath:string;readonly importedAt:string;readonly reviewedAt:string;
 readonly publishedAt:string|null;readonly historicalAvailability:'VERIFIED'|'UNKNOWN';
 readonly reviewStatus:'QUALIFIED'|'REVIEW_REQUIRED'|'INVALID';readonly reviewReference:string;
 readonly verifiedHash:string;readonly cadence:'QUARTERLY'|'ANNUAL';readonly fiscalYearEndMonth:number|null;
}
export interface ManualFact {readonly commonShareQualification?:CommonShareQualification;readonly debtMetadata?:DebtMetadata;readonly cashQualification?:CashQualification;readonly ebitdaQualification?:EbitdaQualification;
 readonly id:string;readonly ticker:string;readonly itemId:string;readonly value:string|null;
 readonly unit:string;readonly currency:string|null;readonly period:{start:string;end:string};readonly scope:FinancialScope;
 readonly sourceDocumentId:string;readonly sourceHash:string;readonly evidenceLocator:string;
 readonly extractionMethod:'REVIEWED_TRANSCRIPTION'|'REVIEWED_EXTRACTION';readonly reviewStatus:'REVIEWED'|'REVIEW_REQUIRED';
 readonly reviewReference:string;readonly reviewedAt:string;readonly quality:'VALID'|'INVALID';
 readonly revisionStatus:'ORIGINAL'|'RESTATED';readonly supersedesFactId:string|null;readonly revisionEvidence:string|null;
 readonly classification:'REPORTED';
}
export interface CanonicalManualFact {
 readonly key:string;readonly status:FinancialEvidenceState;readonly value:string|null;
 readonly selectedFactIds:readonly string[];readonly facts:readonly ManualFact[];
}
export interface ManualDerivedMetric {
 readonly id:string;readonly ticker:string;readonly metric:string;readonly value:string|null;
 readonly status:'AVAILABLE'|'N_R';readonly reason:string|null;readonly unit:'RATIO'|'CURRENCY';
 readonly formulaVersion:string;readonly operandIds:readonly string[];readonly sourceDocuments:readonly string[];
 readonly sourceHashes:readonly string[];readonly period:{start:string;end:string};readonly scope:FinancialScope;
 readonly calculatedAt:string;readonly quality:'VALID'|'INSUFFICIENT';readonly confidence:'HIGH'|'INSUFFICIENT';
 readonly classification:'MECHANICALLY_DERIVED';
}
export const SOURCE_OWNERSHIP = deepFreeze({ACCOUNTING:'MANUAL_FINANCIAL_STATEMENTS',MARKET:'APPROVED_MARKET_SOURCE',VN30:'OFFICIAL_INDEX_REFERENCE',PORTFOLIO:'PORTFOLIO_LEDGER_BROKER'} as const);
const accountingItems=new Set([
 ...Object.values(requirements.sectors).flatMap(r=>[...r.CORE,...r.SECTOR_CORE].flatMap(g=>g.anyOf).concat(r.SUPPORTING)),
 'REPORTED_BORROWINGS','COMPREHENSIVE_FINANCIAL_DEBT','UNRESTRICTED_ECONOMICALLY_AVAILABLE_CASH','NORMALIZED_EBITDA','BVPS','COMMON_EQUITY','ORDINARY_SHARES_OUTSTANDING','GROSS_PROFIT','CURRENT_ASSETS','CURRENT_LIABILITIES','RECEIVABLES','CASH_DIVIDENDS_DECLARED','SHARE_REPURCHASES',
 'BANK_NET_FEE_INCOME','BANK_OPERATING_INCOME','BANK_OPERATING_EXPENSES','BANK_CURRENT_AND_SAVINGS_DEPOSITS','BANK_REPORTED_LDR','REPORTED_ROE','REPORTED_ROA','REPORTED_ROIC',
]);
const ratioItems=new Set(['BANK_REPORTED_CAR','BANK_REPORTED_CET1','BANK_REPORTED_NIM','BANK_REPORTED_NPL','BANK_REPORTED_CREDIT_GROWTH','BANK_REPORTED_LDR','REPORTED_ROE','REPORTED_ROA','REPORTED_ROIC','INSURANCE_SOLVENCY_RATIO']);
function accountingDimensions(f:ManualFact){
 const expected=ratioItems.has(f.itemId)?'RATIO':['BASIC_EPS','BVPS'].includes(f.itemId)?'CURRENCY_PER_SHARE':f.itemId==='ORDINARY_SHARES_OUTSTANDING'?'SHARES':'CURRENCY';
 return f.unit===expected&&(['RATIO','SHARES'].includes(expected)?f.currency===null:f.currency!==null);
}
export function assertSourceOwner(domain:keyof typeof SOURCE_OWNERSHIP,owner:string){requireFundamental(SOURCE_OWNERSHIP[domain]===owner,'SOURCE_DOMAIN_OWNERSHIP');}
export function admitManualStatement(s:ManualStatement,c:AnalysisContext):boolean {
 try {
  requireFundamental(c.mode==='CURRENT_ANALYSIS'||c.mode==='HISTORICAL_REPLAY','EXPLICIT_ANALYSIS_MODE');
  const cutoff=c.mode==='CURRENT_ANALYSIS'?c.analysisAt:c.decisionAt;instant(cutoff);instant(s.importedAt);instant(s.reviewedAt);
  dateOnly(s.reportingPeriod.start);dateOnly(s.reportingPeriod.end);
  requireFundamental(/^[a-f0-9]{64}$/.test(s.SHA256)&&s.verifiedHash===s.SHA256&&s.retainedPath.length>0&&s.documentId.length>0,'RETAINED_HASH_REQUIRED');
  requireFundamental(s.ticker.length>0&&s.issuer.length>0&&['FINANCIAL_STATEMENTS','ANNUAL_REPORT','REGULATORY_DISCLOSURE'].includes(s.documentType)&&['CONSOLIDATED','STANDALONE'].includes(s.reportingScope)&&s.currency.length>0&&s.unitBasis.length>0,'MANUAL_IDENTITY_REQUIRED');
  requireFundamental(s.reviewStatus==='QUALIFIED'&&s.reviewReference.length>0&&['QUARTERLY','ANNUAL'].includes(s.cadence)&&s.reportingPeriod.start<=s.reportingPeriod.end&&s.reportingPeriod.end<=cutoff.slice(0,10)&&s.importedAt<=cutoff&&s.reviewedAt<=cutoff&&s.importedAt<=s.reviewedAt,'MANUAL_QUALIFICATION_OR_FUTURE_PERIOD');
  requireFundamental(Number.isInteger(s.fiscalYear)&&s.fiscalYear>=1900&&s.fiscalYear<=Number(s.reportingPeriod.end.slice(0,4))+1&&(s.fiscalQuarter===null||[1,2,3,4].includes(s.fiscalQuarter)),'MANUAL_FISCAL_IDENTITY');
  if(s.publishedAt!==null){instant(s.publishedAt);requireFundamental(s.publishedAt<=cutoff,'FUTURE_PUBLICATION');}
  if(c.mode==='HISTORICAL_REPLAY'){
   instant(c.systemKnownAt);
   requireFundamental(s.historicalAvailability==='VERIFIED'&&s.publishedAt!==null&&s.publishedAt<=c.decisionAt&&s.importedAt<=c.systemKnownAt&&s.reviewedAt<=c.systemKnownAt,'STRICT_HISTORICAL_PIT_REQUIRED');
  }
  return true;
 }catch{return false;}
}
const factKey=(f:ManualFact)=>[f.ticker,f.itemId,f.period.start,f.period.end,f.scope].join('|');
/** Provider observations cannot enter this API. No latest-wins resolution exists. */
export function canonicalizeManualFacts(facts:readonly ManualFact[],statements:readonly ManualStatement[],context:AnalysisContext,metadataContext?:{analyticalQualificationWitnesses?:readonly AnalyticalQualificationWitness[];commonShareReviewWitnesses?:readonly CommonShareQualification[];decisionGradeQualificationVersion?:string;comprehensiveDebtProofs?:readonly ComprehensiveDebtProof[];universe:readonly {ticker:string;sector:Sector}[];sourceBindings:readonly {path:string;sha256:string}[];hash:(x:unknown)=>string}):readonly CanonicalManualFact[] {
 requireFundamental(!metadataContext?.decisionGradeQualificationVersion||context.mode==='CURRENT_ANALYSIS'&&metadataContext.universe.length===1&&metadataContext.universe[0].ticker==='HPG','HPG_CURRENT_QUALIFICATION_SCOPE_ONLY');
 requireFundamental(new Set(facts.map(f=>f.id)).size===facts.length&&new Set(statements.map(s=>s.documentId)).size===statements.length,'UNIQUE_MANUAL_IDENTITIES');
 const docs=new Map(statements.filter(s=>admitManualStatement(s,context)).map(s=>[s.documentId,s]));
 const groups=new Map<string,ManualFact[]>();
 for(const f of [...facts].sort((a,b)=>a.id.localeCompare(b.id))){
  requireFundamental(accountingItems.has(f.itemId),'MANUAL_ACCOUNTING_ITEM_OWNERSHIP');
  const s=docs.get(f.sourceDocumentId);
  if(!s||s.SHA256!==f.sourceHash||s.ticker!==f.ticker||s.reportingScope!==f.scope||f.period.end>s.reportingPeriod.end||f.period.start>f.period.end||f.currency!==s.currency&&f.currency!==null)continue;
  const cutoff=context.mode==='CURRENT_ANALYSIS'?context.analysisAt:context.systemKnownAt;
  if(f.reviewStatus!=='REVIEWED'||!['REVIEWED_TRANSCRIPTION','REVIEWED_EXTRACTION'].includes(f.extractionMethod)||!f.reviewReference||!f.evidenceLocator||f.reviewedAt>cutoff)continue;
  instant(f.reviewedAt);dateOnly(f.period.start);dateOnly(f.period.end);
  if(metadataContext?.decisionGradeQualificationVersion&&['UNRESTRICTED_ECONOMICALLY_AVAILABLE_CASH','NORMALIZED_EBITDA'].includes(f.itemId)){if(f.value===null||!validAnalyticalQualificationWitness({...f,value:f.value},f.itemId==='NORMALIZED_EBITDA'?'NORMALIZED_EBITDA':'UNRESTRICTED_CASH',{analysisAt:cutoff,systemKnownAt:cutoff,statements,analyticalQualificationWitnesses:metadataContext.analyticalQualificationWitnesses,sourceBindings:metadataContext.sourceBindings},metadataContext.hash))continue;}
  if(metadataContext?.decisionGradeQualificationVersion&&f.itemId==='OPERATING_PROFIT')continue;
  if(metadataContext?.decisionGradeQualificationVersion&&f.itemId==='NET_INCOME_ATTRIBUTABLE_COMMON'){if(f.value===null||!validCommonShareQualification({...f,value:f.value},{analysisAt:cutoff,systemKnownAt:cutoff,statements,commonShareReviewWitnesses:metadataContext.commonShareReviewWitnesses,sourceBindings:metadataContext.sourceBindings},metadataContext.hash))continue;}
  if(isDebtMetric(f.itemId)||['UNRESTRICTED_ECONOMICALLY_AVAILABLE_CASH','NORMALIZED_EBITDA'].includes(f.itemId)){const c={analysisAt:cutoff,systemKnownAt:cutoff,statements,comprehensiveDebtProofs:metadataContext?.comprehensiveDebtProofs,sourceBindings:metadataContext?.sourceBindings??[]};if(!metadataContext||f.value===null||!DEBT_CONTRACT.applicableSectors.includes(metadataContext.universe.find(u=>u.ticker===f.ticker)?.sector??''))continue;const dimension={...f,value:f.value};if(isDebtMetric(f.itemId)?!f.debtMetadata||!validDebtMetadata(f.debtMetadata,f.itemId,dimension,c,metadataContext.hash):f.itemId==='NORMALIZED_EBITDA'?!validEbitdaQualification(dimension,c,metadataContext.hash):!validCashQualification(dimension,c,metadataContext.hash))continue;}
  const key=factKey(f);groups.set(key,[...(groups.get(key)??[]),f]);
 }
 return deepFreeze([...groups.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([key,rows])=>{
  let invalid=rows.some(f=>f.quality!=='VALID'||f.classification!=='REPORTED'||!accountingDimensions(f))||new Set(rows.map(f=>f.unit+'|'+f.currency)).size>1;
  for(const f of rows){try{if(f.value!==null){const value=decimal(f.value);if(['TOTAL_ASSETS','FINANCIAL_DEBT','CASH_AND_EQUIVALENTS','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS'].includes(f.itemId)&&value.negative)invalid=true;}}catch{invalid=true;}}
  const superseded=new Set<string>();
  for(const f of rows){
   if(f.revisionStatus==='RESTATED'){
    const parent=rows.find(x=>x.id===f.supersedesFactId);
    if(!parent||!f.revisionEvidence||parent.reviewedAt>f.reviewedAt){invalid=true;continue;}
    const visited=new Set([f.id]);let cursor:ManualFact|undefined=parent;
    while(cursor){if(visited.has(cursor.id)){invalid=true;break;}visited.add(cursor.id);cursor=rows.find(x=>x.id===cursor!.supersedesFactId);}
    superseded.add(parent.id);
   }else if(f.supersedesFactId!==null||f.revisionEvidence!==null)invalid=true;
  }
  const active=rows.filter(f=>!superseded.has(f.id)),values=new Set(active.filter(f=>f.value!==null).map(f=>decimal(f.value!).toString()));
  const status:FinancialEvidenceState=invalid?'INVALID':values.size>1?'CONFLICTING':values.size===0?'N_R':'AVAILABLE';
  return {key,status,value:status==='AVAILABLE'?[...values][0]:null,selectedFactIds:status==='AVAILABLE'?active.filter(f=>f.value!==null).map(f=>f.id):[],facts:rows};
 }));
}
export type StatementFreshness='CURRENT'|'AGING'|'STALE'|'UNKNOWN';
/** Fiscal quarter endpoints are anchored to the issuer's reported fiscal year end. */
export function manualStatementFreshness(latest:ManualStatement|null,analysisAt:string,fiscalYearEndMonth=12):StatementFreshness {
 instant(analysisAt);if(!latest||latest.reviewStatus!=='QUALIFIED'||latest.reportingPeriod.end>analysisAt.slice(0,10)||!Number.isInteger(fiscalYearEndMonth)||fiscalYearEndMonth<1||fiscalYearEndMonth>12)return 'UNKNOWN';
 const year=Number(analysisAt.slice(0,4));const due:string[]=[];
 for(let y=year-3;y<=year;y++)for(let m=1;m<=12;m++){
  if(latest.cadence==='ANNUAL'?m!==fiscalYearEndMonth:(m-fiscalYearEndMonth+12)%3!==0)continue;
  const end=new Date(Date.UTC(y,m,0)).toISOString().slice(0,10),grace=latest.cadence==='ANNUAL'?requirements.freshness.annualGraceDays:requirements.freshness.quarterlyGraceDays;
  if(Date.parse(end+'T00:00:00.000Z')+grace*86400000<=Date.parse(analysisAt))due.push(end);
 }
 const missed=due.filter(end=>end>latest.reportingPeriod.end).length;
 return missed===0?'CURRENT':missed===1?'AGING':'STALE';
}
export interface ManualEvidenceReadiness {
 readonly ticker:string;readonly sector:Sector;readonly analysisMode:'CURRENT_ANALYSIS';
 readonly latestStatement:ManualStatement|null;readonly scope:FinancialScope|null;readonly reportingPeriod:string|null;
 readonly documentReady:boolean;readonly coreFinancialReady:boolean;readonly sectorFinancialReady:boolean;
 readonly coreCoverage:{available:number;required:number};readonly sectorCoreCoverage:{available:number;required:number};
 readonly supportingCoverage:{available:number;total:number};readonly derivationCoverage:{available:number;total:number};
 readonly financialEvidenceStatus:'FULL'|'PARTIAL'|'INSUFFICIENT';readonly financialConfidence:'HIGH'|'MEDIUM'|'LOW'|'INSUFFICIENT';
 readonly freshness:StatementFreshness;readonly fundamentalScorable:boolean;
 readonly marketReady:boolean;readonly valuationReady:boolean;readonly qualitativeReady:boolean;readonly readyForScoring:boolean;readonly decisionReady:boolean;
 readonly missingMaterialEvidence:readonly {id:string;component:string;status:FinancialEvidenceState}[];
 readonly missingSupportingEvidence:readonly string[];readonly optionalMissingMetrics:readonly string[];
}
export interface CurrentAnalysisSnapshot {
 readonly contract:'manual-current-analysis-snapshot-v1';readonly mode:'CURRENT_ANALYSIS';readonly snapshotId:string;readonly analysisAt:string;
 readonly requirementsVersion:string;readonly statements:readonly ManualStatement[];readonly canonicalFacts:readonly CanonicalManualFact[];
 readonly derivedMetrics:readonly ManualDerivedMetric[];readonly readiness:readonly ManualEvidenceReadiness[];
 readonly referenceStatus:'VERIFIED'|'UNRESOLVED';readonly contentHash:string;
 readonly DI14:'AWAITING_INDEPENDENT_REVIEW';readonly DI15:'AWAITING_PROJECT_OWNER_APPROVAL';
}
export function evaluateManualEvidence(ticker:string,sector:Sector,statements:readonly ManualStatement[],facts:readonly CanonicalManualFact[],derived:readonly ManualDerivedMetric[],analysisAt:string):ManualEvidenceReadiness {
 const eligible=statements.filter(s=>s.ticker===ticker&&admitManualStatement(s,{mode:'CURRENT_ANALYSIS',analysisAt}));
 // Prefer consolidated group evidence. Never patch its holes with standalone facts.
 const scope:FinancialScope|null=eligible.some(s=>s.reportingScope==='CONSOLIDATED')?'CONSOLIDATED':eligible.length?'STANDALONE':null;
 const latest=[...eligible].filter(s=>s.reportingScope===scope).sort((a,b)=>b.reportingPeriod.end.localeCompare(a.reportingPeriod.end)||a.documentId.localeCompare(b.documentId))[0]??null;
 const period=latest?.reportingPeriod.end??null,route=debtRequirementsAt(analysisAt).sectors[sector];
 const current=facts.filter(f=>f.facts[0]?.ticker===ticker&&f.facts[0].scope===scope&&f.facts[0].period.end===period);
 function state(items:readonly string[]):FinancialEvidenceState {
  const matches=current.filter(f=>items.includes(f.facts[0].itemId));
  if(matches.some(f=>f.status==='CONFLICTING'))return 'CONFLICTING';
  if(matches.some(f=>f.status==='INVALID'))return 'INVALID';
  return matches.some(f=>f.status==='AVAILABLE')?'AVAILABLE':'INSUFFICIENT';
 }
 const material=[...route.CORE,...route.SECTOR_CORE],missing=material.filter(g=>state(g.anyOf)!=='AVAILABLE').map(g=>({id:g.id,component:g.component,status:state(g.anyOf)}));
 const core=route.CORE.filter(g=>state(g.anyOf)==='AVAILABLE').length,sectorCore=route.SECTOR_CORE.filter(g=>state(g.anyOf)==='AVAILABLE').length;
 const supporting=route.SUPPORTING.filter(item=>state([item])==='AVAILABLE').length;
 const metrics=derived.filter(d=>d.ticker===ticker&&d.scope===scope&&d.period.end===period);
 const freshness=latest?.fiscalYearEndMonth===null?'UNKNOWN':manualStatementFreshness(latest,analysisAt,latest?.fiscalYearEndMonth);
 const activeDebt=debtContractActive(analysisAt)&&DEBT_CONTRACT.applicableSectors.includes(sector),selectedDebt=activeDebt?selectCompatibleDebt(current.filter(c=>c.status==='AVAILABLE').map(c=>({...c.facts[0],value:c.value!})),{ticker,periodEnd:period??'',scope:scope??'CONSOLIDATED'}).fact:null;
 const debtRiskPending=activeDebt&&!!selectedDebt?.debtMetadata?.uncertainty.components.length&&selectedDebt.debtMetadata.uncertainty.materialityAssessment!=='NON_MATERIAL_VERIFIED';
 const cashBridgePending=activeDebt&&!metrics.some(m=>m.metric==='NET_DEBT'&&m.status==='AVAILABLE'&&m.formulaVersion.includes('qualified-debt-unrestricted-cash-v2'));
 const insufficient=!latest||missing.length>0,partial=supporting<route.SUPPORTING.length||debtRiskPending||cashBridgePending;
 const status=insufficient?'INSUFFICIENT':partial?'PARTIAL':'FULL';
 const confidence=insufficient?'INSUFFICIENT':freshness==='STALE'||freshness==='UNKNOWN'||debtRiskPending||cashBridgePending?'LOW':partial||freshness==='AGING'?'MEDIUM':'HIGH';
 return deepFreeze({ticker,sector,analysisMode:'CURRENT_ANALYSIS',latestStatement:latest,scope,reportingPeriod:period,documentReady:!!latest,coreFinancialReady:core===route.CORE.length,sectorFinancialReady:sectorCore===route.SECTOR_CORE.length,coreCoverage:{available:core,required:route.CORE.length},sectorCoreCoverage:{available:sectorCore,required:route.SECTOR_CORE.length},supportingCoverage:{available:supporting,total:route.SUPPORTING.length},derivationCoverage:{available:metrics.filter(d=>d.status==='AVAILABLE').length,total:metrics.length},financialEvidenceStatus:status,financialConfidence:confidence,freshness,fundamentalScorable:!insufficient&&confidence!=='LOW',marketReady:false,valuationReady:false,qualitativeReady:false,readyForScoring:false,decisionReady:false,missingMaterialEvidence:missing,missingSupportingEvidence:route.SUPPORTING.filter(item=>state([item])!=='AVAILABLE'),optionalMissingMetrics:route.OPTIONAL.filter(item=>state([item])!=='AVAILABLE'&&!metrics.some(d=>d.metric===item&&d.status==='AVAILABLE'))});
}
/** New mode has a distinct contract. It cannot be passed to the legacy PIT bridge. */
export function buildManualCurrentSnapshot(input:{analyticalQualificationWitnesses?:readonly AnalyticalQualificationWitness[];commonShareReviewWitnesses?:readonly CommonShareQualification[];decisionGradeQualificationVersion?:string;comprehensiveDebtProofs?:readonly ComprehensiveDebtProof[];sourceBindings?:readonly {path:string;sha256:string}[];snapshotId:string;analysisAt:string;statements:readonly ManualStatement[];facts:readonly ManualFact[];universe:readonly {ticker:string;sector:Sector}[];referenceStatus:'VERIFIED'|'UNRESOLVED'},hash:(v:unknown)=>string):CurrentAnalysisSnapshot {
 instant(input.analysisAt);requireFundamental(input.snapshotId.length>0&&new Set(input.universe.map(u=>u.ticker)).size===input.universe.length,'MANUAL_SNAPSHOT_IDENTITY');
 const statements=[...input.statements].sort((a,b)=>a.documentId.localeCompare(b.documentId));
 const canonicalFacts=canonicalizeManualFacts(input.facts,statements,{mode:'CURRENT_ANALYSIS',analysisAt:input.analysisAt},{universe:input.universe,analyticalQualificationWitnesses:input.analyticalQualificationWitnesses,commonShareReviewWitnesses:input.commonShareReviewWitnesses,decisionGradeQualificationVersion:input.decisionGradeQualificationVersion,comprehensiveDebtProofs:input.comprehensiveDebtProofs,sourceBindings:input.sourceBindings??[],hash});
 const derivedMetrics=deriveManualMetrics(canonicalFacts,input.universe,input.analysisAt);
 const readiness=[...input.universe].sort((a,b)=>a.ticker.localeCompare(b.ticker)).map(u=>evaluateManualEvidence(u.ticker,u.sector,statements,canonicalFacts,derivedMetrics,input.analysisAt));
 const content={contract:'manual-current-analysis-snapshot-v1' as const,mode:'CURRENT_ANALYSIS' as const,snapshotId:input.snapshotId,analysisAt:input.analysisAt,requirementsVersion:debtRequirementsAt(input.analysisAt).version,statements,canonicalFacts,derivedMetrics,readiness,referenceStatus:input.referenceStatus,DI14:'AWAITING_INDEPENDENT_REVIEW' as const,DI15:'AWAITING_PROJECT_OWNER_APPROVAL' as const};
 return deepFreeze({...content,contentHash:hash(JSON.parse(canonicalJson(content)))});
}

export type AccountingOperand=Pick<ManualFact,'id'|'ticker'|'itemId'|'unit'|'currency'|'period'|'scope'|'sourceDocumentId'|'sourceHash'|'debtMetadata'|'cashQualification'|'ebitdaQualification'|'commonShareQualification'>;
export type CanonicalAccountingOperand=Omit<CanonicalManualFact,'facts'>&{readonly facts:readonly AccountingOperand[]};
export function deriveManualMetrics(facts:readonly CanonicalAccountingOperand[],universe:readonly {ticker:string;sector:Sector}[],calculatedAt:string,legacyDebtFormula=!debtContractActive(calculatedAt)):readonly ManualDerivedMetric[] {
 instant(calculatedAt);
 const out:ManualDerivedMetric[]=[];
 const available=facts.filter(f=>f.status==='AVAILABLE');
 for(const u of universe){
  const keys=[...new Set(available.filter(c=>c.facts[0].ticker===u.ticker).map(c=>c.facts[0].period.end+'|'+c.facts[0].scope))].sort();
  for(const key of keys){const [end,scope]=key.split('|') as [string,FinancialScope];
   const same=available.filter(c=>c.facts[0].ticker===u.ticker&&c.facts[0].period.end===end&&c.facts[0].scope===scope);
   const flows=same.filter(c=>c.facts[0].period.start!==end);
   for(const start of [...new Set(flows.map(c=>c.facts[0].period.start))].sort()){
    const get=(item:string,stock=false)=>{const candidates=same.filter(c=>c.facts[0].itemId===item&&c.facts[0].period.start===(stock?end:start));return candidates.length===1?candidates[0]:undefined;};
    function emit(metric:string,inputs:(CanonicalAccountingOperand|undefined)[],unit:'RATIO'|'CURRENCY',formula:(values:ReturnType<typeof decimal>[])=>string,version:string){
     let value:string|null=null,reason:string|null='EXACT_OPERANDS_UNAVAILABLE';
     if(inputs.every(i=>i&&i.facts[0].currency==='VND'&&i.facts[0].unit==='CURRENCY'))try{value=formula(inputs.map(i=>decimal(i!.value!)));reason=null;}catch{reason='INVALID_DENOMINATOR_OR_PRECISION';}
     const bound=inputs.filter((i):i is CanonicalAccountingOperand=>!!i).flatMap(i=>i.facts.filter(f=>i.selectedFactIds.includes(f.id)));
     out.push({id:[u.ticker,metric,start,end,scope].join(':'),ticker:u.ticker,metric,value,status:value===null?'N_R':'AVAILABLE',reason,unit,formulaVersion:'manual-mechanical-v1:'+version,operandIds:bound.map(f=>f.id).sort(),sourceDocuments:[...new Set(bound.map(f=>f.sourceDocumentId))].sort(),sourceHashes:[...new Set(bound.map(f=>f.sourceHash))].sort(),period:{start,end},scope,calculatedAt,quality:value===null?'INSUFFICIENT':'VALID',confidence:value===null?'INSUFFICIENT':'HIGH',classification:'MECHANICALLY_DERIVED'});
    }
    const ratio=(v:ReturnType<typeof decimal>[])=>{requireFundamental(v[1].positive,'POSITIVE_DENOMINATOR_REQUIRED');return v[0].div(v[1]).toString();};
    if(u.sector!=='BANK'&&u.sector!=='INSURANCE'&&u.sector!=='SECURITIES'){
     emit('NET_MARGIN',[get('NET_INCOME'),get('REVENUE')],'RATIO',ratio,'net-income/revenue');
     emit('OPERATING_MARGIN',[get('OPERATING_PROFIT'),get('REVENUE')],'RATIO',ratio,'operating-profit/revenue');
     emit('CFO_CONVERSION',[get('CFO'),get('NET_INCOME')],'RATIO',ratio,'cfo/net-income');
     emit('FCF',[get('CFO'),get('CASH_CAPEX_REPORTED')],'CURRENCY',v=>{requireFundamental(!v[1].negative,'CAPEX_OUTFLOW_MAGNITUDE_REQUIRED');return v[0].sub(v[1]).toString();},'cfo-capex-positive-outflow');
     emit('FCF_CONVERSION',[get('CFO'),get('CASH_CAPEX_REPORTED'),get('NET_INCOME')],'RATIO',v=>{requireFundamental(!v[1].negative&&v[2].positive,'FCF_OPERAND_DIMENSIONS');return v[0].sub(v[1]).div(v[2]).toString();},'(cfo-capex)/net-income');
     if(legacyDebtFormula)emit('NET_DEBT',[get('FINANCIAL_DEBT',true),get('CASH_AND_EQUIVALENTS',true)],'CURRENCY',v=>v[0].sub(v[1]).toString(),'debt-cash');
     else {const dimensional=same.map(c=>({...c.facts[0],value:c.value!})),selected=selectCompatibleDebt(dimensional,{ticker:u.ticker,periodEnd:end,scope}),selectedCanonical=selected.fact?same.find(c=>c.selectedFactIds.includes(selected.fact!.id)):undefined,cash=get('UNRESTRICTED_ECONOMICALLY_AVAILABLE_CASH',true);emit('NET_DEBT',[selectedCanonical,cash],'CURRENCY',()=>{const result=qualifiedNetDebt(selected.fact,cash?{...cash.facts[0],value:cash.value!}:undefined);requireFundamental(result.value!==null,'QUALIFIED_UNRESTRICTED_CASH_REQUIRED');return result.value;},'qualified-debt-unrestricted-cash-v2');}
    }
    // Average endpoints, no annualization of partial periods and no closing-equity ROE proxy.
    const opening=new Date(Date.parse(start+'T00:00:00.000Z')-86400000).toISOString().slice(0,10);
    const prior=(item:string)=>available.find(c=>c.facts[0].ticker===u.ticker&&c.facts[0].scope===scope&&c.facts[0].itemId===item&&c.facts[0].period.start===opening&&c.facts[0].period.end===opening);
    emit('ROE',[get('NET_INCOME_ATTRIBUTABLE_COMMON'),prior('COMMON_EQUITY'),get('COMMON_EQUITY',true)],'RATIO',v=>{const avg=v[1].add(v[2]).div(decimal('2'));requireFundamental(avg.positive,'POSITIVE_AVERAGE_EQUITY');return v[0].div(avg).toString();},'common-profit/average-common-equity-period-return');
    emit('ROA',[get('NET_INCOME'),prior('TOTAL_ASSETS'),get('TOTAL_ASSETS',true)],'RATIO',v=>{const avg=v[1].add(v[2]).div(decimal('2'));requireFundamental(avg.positive,'POSITIVE_AVERAGE_ASSETS');return v[0].div(avg).toString();},'net-income/average-assets-period-return');
   }
  }
 }
 return deepFreeze(out.sort((a,b)=>a.id.localeCompare(b.id)));
}

/** Source-neutral arithmetic; admission is performed before calling this function. */
export const deriveAccountingMetrics=deriveManualMetrics;
