import {DEBT_CONTRACT,debtContractActive,debtRequirementsAt,selectCompatibleDebt,debtSeriesStatus} from './debt-contract';
import {MANUAL_EVIDENCE_REQUIREMENTS,manualStatementFreshness,type FinancialScope} from './manual-first';
import type {HybridInput,HybridAdmissionSnapshot,FinancialFrame,HybridCanonicalFact} from './hybrid-admission';
import type {Sector} from '@/domain/scoring/methodology';
import {requireFundamental} from './validation';
import {deepFreeze} from '@/domain/portfolio/transaction';
export interface FinancialTarget {readonly ticker:string;readonly frame:FinancialFrame;readonly start:string;readonly end:string;readonly fiscalYear:number;readonly quarter:number|null;readonly track:'LONG_TERM_BASELINE'|'CURRENT_TRAJECTORY'}
export function financialTargets(input:HybridInput){
 const out:FinancialTarget[]=[];
 for(const u of input.universe){
  for(const year of [2022,2023,2024,2025])out.push({ticker:u.ticker,frame:'ANNUAL',start:`${year}-01-01`,end:`${year}-12-31`,fiscalYear:year,quarter:null,track:'LONG_TERM_BASELINE'});
  // Reporting obligations determine the current window, never provider availability.
  const currentYear=Number(input.analysisAt.slice(0,4));
  const cutoff=Date.parse(input.analysisAt);
  const quarter=[3,2,1].find(q=>{const end=Date.UTC(currentYear,q*3,0);return end+MANUAL_EVIDENCE_REQUIREMENTS.freshness.quarterlyGraceDays*86400000<=cutoff;})??1;
  const end=new Date(Date.UTC(currentYear,quarter*3,0)).toISOString().slice(0,10);
  out.push({ticker:u.ticker,frame:'YTD',start:`${currentYear}-01-01`,end,fiscalYear:currentYear,quarter,track:'CURRENT_TRAJECTORY'});
 }
 return deepFreeze(out.sort((a,b)=>a.ticker.localeCompare(b.ticker)||a.track.localeCompare(b.track)||a.end.localeCompare(b.end)));
}
export function evaluateHybridTarget(target:FinancialTarget,sector:Sector,snapshot:HybridAdmissionSnapshot,input:HybridInput){
 const atEnd=snapshot.canonicalFacts.filter(f=>f.ticker===target.ticker&&f.period.end===target.end&&(f.period.start===f.period.end||f.reportPeriodType===target.frame&&f.period.start===target.start));
 const scope:FinancialScope|null=atEnd.some(f=>f.scope==='CONSOLIDATED')?'CONSOLIDATED':atEnd.some(f=>f.scope==='STANDALONE')?'STANDALONE':null;
 const facts=atEnd.filter(f=>f.scope===scope),route=debtRequirementsAt(input.analysisAt,input.systemKnownAt).sectors[sector];
 const active=debtContractActive(input.analysisAt,input.systemKnownAt)&&DEBT_CONTRACT.applicableSectors.includes(sector);const debt=active?selectCompatibleDebt(facts,{ticker:target.ticker,periodEnd:target.end,scope:scope??'CONSOLIDATED'}):null;
 const available=(ids:readonly string[])=>active&&ids.includes('REPORTED_BORROWINGS')?!!debt?.fact:facts.some(f=>ids.includes(f.itemId));
 const core=route.CORE.filter(g=>available(g.anyOf)),sectorCore=route.SECTOR_CORE.filter(g=>available(g.anyOf)),supporting=route.SUPPORTING.filter(id=>available([id]));
 const missing=[...route.CORE,...route.SECTOR_CORE].filter(g=>!available(g.anyOf)).map(g=>({id:g.id,anyOf:g.anyOf,component:g.component}));
 const seriesStatus=active?debtSeriesStatus(snapshot.canonicalFacts,target.ticker):'COMPATIBLE';
 const debtUncertainty=debt?.fact?.debtMetadata?.uncertainty;const debtRiskPending=active&&(seriesStatus!=='COMPATIBLE'||!!debtUncertainty&&debtUncertainty.materialityAssessment!=='NON_MATERIAL_VERIFIED'&&debtUncertainty.components.length>0);
 const netDebtQualified=!active||snapshot.derivedMetrics.some(d=>d.ticker===target.ticker&&d.metric==='NET_DEBT'&&d.period.end===target.end&&d.status==='AVAILABLE'&&d.formulaVersion.includes('qualified-debt-unrestricted-cash-v2'));
 const bridgePending=active&&!netDebtQualified;
 const status=missing.length?'INSUFFICIENT':supporting.length<route.SUPPORTING.length||debtRiskPending||bridgePending?'PARTIAL':'FULL';
 const documents=input.statements.filter(s=>s.ticker===target.ticker&&s.reviewStatus==='QUALIFIED'&&s.reportingPeriod.end===target.end&&s.reportingScope===scope).sort((a,b)=>a.documentId.localeCompare(b.documentId));
 const freshness=documents[0]?manualStatementFreshness(documents[0],input.analysisAt,documents[0].fiscalYearEndMonth??undefined):'UNKNOWN';
 const confidence=status==='INSUFFICIENT'?'INSUFFICIENT':freshness==='STALE'||freshness==='UNKNOWN'||debtRiskPending||bridgePending?'LOW':status==='PARTIAL'||freshness==='AGING'?'MEDIUM':'HIGH';
 return deepFreeze({ticker:target.ticker,sector,target,scope,...active?{debtContractVersion:DEBT_CONTRACT.version,selectedDebtMetric:debt?.fact?.itemId??null,debtSeriesStatus:seriesStatus,debtUncertainty:debtUncertainty??null,netDebtQualified,financialHealthReadiness:bridgePending?'QUALIFIED_UNRESTRICTED_CASH_REQUIRED':debtRiskPending?'MATERIALITY_REVIEW_REQUIRED':missing.some(m=>m.id==='debt')?'DEBT_INPUT_UNAVAILABLE':'RATIO_AND_GOVERNANCE_REVIEW_REQUIRED'}:{},CORE:{required:route.CORE.length,available:core.length},SECTOR_CORE:{required:route.SECTOR_CORE.length,available:sectorCore.length},SUPPORTING:{required:route.SUPPORTING.length,available:supporting.length},financialEvidenceStatus:status,financialConfidence:confidence,missingRequirements:missing,providerAnomalies:input.candidates.filter(c=>c.ticker===target.ticker&&c.periodEnd===target.end&&c.providerStatus==='PROVIDER_ANOMALY').map(c=>c.id).sort(),fallbackRequired:snapshot.fallbackQueue.filter(t=>t.ticker===target.ticker&&t.periodEnd===target.end&&t.status!=='RESOLVED_ISSUER').length,issuerConflicts:snapshot.unresolvedIssuerConflicts.filter(k=>k.startsWith(target.ticker+'|')),freshness,fundamentalScorable:status!=='INSUFFICIENT'&&confidence!=='LOW',readyForScoring:false,decisionReady:false});
}
export function hybridCoverage(targets:readonly FinancialTarget[],snapshot:HybridAdmissionSnapshot,input:HybridInput){
 const matrix=[] as {ticker:string;sector:Sector;track:string;frame:string;start:string;end:string;evidenceClass:string;metric:string;classification:string;canonicalIds:string[];value:string|null;scope:string|null}[];
 const groups=[] as {ticker:string;track:string;end:string;evidenceClass:string;requirementId:string;anyOf:readonly string[];available:boolean}[];
 for(const target of targets){const sector=input.universe.find(u=>u.ticker===target.ticker)!.sector;const evaluated=evaluateHybridTarget(target,sector,snapshot,input);const route=debtRequirementsAt(input.analysisAt,input.systemKnownAt).sectors[sector];
  const relevant=(itemId:string)=>snapshot.canonicalFacts.filter(f=>f.ticker===target.ticker&&f.itemId===itemId&&f.scope===evaluated.scope&&f.period.end===target.end&&(f.period.start===f.period.end||f.reportPeriodType===target.frame&&f.period.start===target.start));
  for(const evidenceClass of ['CORE','SECTOR_CORE','SUPPORTING','OPTIONAL'] as const){const list=evidenceClass==='CORE'||evidenceClass==='SECTOR_CORE'?route[evidenceClass].flatMap(g=>g.anyOf):route[evidenceClass];for(const metric of [...new Set(list)]){const facts=relevant(metric),candidate=input.candidates.filter(c=>c.ticker===target.ticker&&c.itemId===metric&&c.reportPeriodType===target.frame&&c.periodEnd===target.end&&c.endpoint!=='GetReportSummary');let classification=facts.length?facts[0].classification:candidate.some(c=>c.providerStatus==='CONFLICT')?'CONFLICT':candidate.some(c=>c.providerStatus==='PROVIDER_ANOMALY')?'PROVIDER_ANOMALY':candidate.length?'FALLBACK_REQUIRED':'UNAVAILABLE';if(snapshot.unresolvedIssuerConflicts.some(k=>k.startsWith(target.ticker+'|'+metric+'|')&&k.includes(target.end)))classification='CONFLICT';matrix.push({ticker:target.ticker,sector,track:target.track,frame:target.frame,start:target.start,end:target.end,evidenceClass,metric,classification,canonicalIds:facts.map(f=>f.id).sort(),value:facts[0]?.value??null,scope:evaluated.scope});}}
  for(const evidenceClass of ['CORE','SECTOR_CORE'] as const)for(const g of route[evidenceClass])groups.push({ticker:target.ticker,track:target.track,end:target.end,evidenceClass,requirementId:g.id,anyOf:g.anyOf,available:debtContractActive(input.analysisAt,input.systemKnownAt)&&g.anyOf.includes('REPORTED_BORROWINGS')?!!selectCompatibleDebt(snapshot.canonicalFacts,{ticker:target.ticker,periodEnd:target.end,scope:evaluated.scope??'CONSOLIDATED'}).fact:g.anyOf.some(id=>relevant(id).length>0)});
 }
 return deepFreeze({matrix:matrix.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),groups:groups.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))});
}
export function financialBridge(snapshot:HybridAdmissionSnapshot){requireFundamental(snapshot.mode==='CURRENT_ANALYSIS'&&snapshot.contract==='structured-issuer-verified-current-v1','CURRENT_FINANCIAL_BRIDGE_MODE');return deepFreeze({mode:'CURRENT_ANALYSIS' as const,facts:snapshot.canonicalFacts,derivedMetrics:snapshot.derivedMetrics,sourcePolicy:snapshot.sourcePolicy,readyForScoring:false,decisionReady:false,officialScores:[]});}
export type HybridSufficiencyRow=ReturnType<typeof evaluateHybridTarget>;
export type StructuredFinancialDashboard={snapshotId:string;contentHash:string;analysisAt:string;sourcePolicy:HybridAdmissionSnapshot['sourcePolicy'];canonicalCount:number;fallbackRequired:number;rows:readonly HybridSufficiencyRow[];readyForScoring:false};
export const canonicalFrameFact=(f:HybridCanonicalFact)=>f.period.start===f.period.end?'INSTANT':f.reportPeriodType;
/** Optional quarter trajectories stay separate; they never replace required YTD obligations. */
export function selectHybridCurrentPeriods(input:HybridInput,snapshot:HybridAdmissionSnapshot){
 const year=Number(input.analysisAt.slice(0,4));
 return input.universe.map(u=>{
  const rows=snapshot.canonicalFacts.filter(f=>f.ticker===u.ticker&&f.period.end<=input.analysisAt.slice(0,10));
  const latest=(frame:FinancialFrame,current:boolean)=>rows.filter(f=>f.reportPeriodType===frame&&f.period.start!==f.period.end&&(!current||f.fiscalYear===year)).sort((a,b)=>b.period.end.localeCompare(a.period.end)||a.id.localeCompare(b.id))[0]??null;
  const annual=latest('ANNUAL',false),ytd=latest('YTD',true),quarter=latest('QUARTER',true);
  const obligation=financialTargets(input).find(t=>t.ticker===u.ticker&&t.track==='CURRENT_TRAJECTORY')!;
  return {ticker:u.ticker,LONG_TERM_BASELINE:financialTargets(input).filter(t=>t.ticker===u.ticker&&t.track==='LONG_TERM_BASELINE'),CURRENT_TRAJECTORY:{latestAnnual:annual?{start:annual.period.start,end:annual.period.end}:null,latestValidYtd:ytd?{start:ytd.period.start,end:ytd.period.end}:null,latestVerifiedQuarter:quarter?{start:quarter.period.start,end:quarter.period.end}:null,requiredYtd:obligation,missingCurrentYtd:!ytd||ytd.period.end<obligation.end,quarterSubstitutesForYtd:false,annualization:false}};
 });
}
