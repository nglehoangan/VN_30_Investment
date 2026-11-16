/** Current-purpose enrichment: verified reported borrowing receipt + adopted closed research/history.
 * No new economic model, fake publication dates, comprehensive-debt certification or scoring points.
 */
import type {PrismaClient} from '@/infrastructure/db/generated/client';
import {CurrentFinancialAdmissions,checkedBody,type QualifiedCurrentFact} from './current-financial';
import {CurrentFinancialDatasets,type CurrentDatasetContext} from './current-dataset';
import {sourceBytes,sha,type SourcePin} from './registry';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {decimal} from '@/domain/portfolio/values';
import {DEBT_CONTRACT,evaluateDebtReceipt,type DebtPopulationReceipt,type DebtMetadata,type IncludedCurrentPortionEvidence} from '@/domain/fundamentals/debt-contract';
import {calculateMetrics,type MetricOperand,type MetricRequest,type MetricId} from '@/domain/scoring/metrics';
import {instant} from '@/shared/time';
import {assertNotRevoked,admissionEvent} from '@/infrastructure/repositories/unified-admission';
import {validateEvidence,type CurrentValuationEvidence} from '@/domain/scoring/evidence';
export const COVERAGE_CODE=[
 'src/infrastructure/source-admission/current-coverage.ts',
 'src/domain/fundamentals/debt-contract.ts','src/domain/fundamentals/debt-contract-v2.json',
 'src/domain/fundamentals/current-portion-presentation-v1.json','src/domain/scoring/metrics.ts',
 'prisma/proposals/current-financial-enrichment-v1.sql',
] as const;
export interface CoverageComposition {
 registry():SourcePin;debtReview:SourcePin;history:SourcePin;research:SourcePin;clock:{now():string};
}
type AnyRecord=Record<string,any>;
function must(v:unknown,reason:string):asserts v{if(!v)throw Error(reason);}
function seal<T extends object>(value:T){return {...value,bodyHash:hash(value)};}
/** Existing metric calculator consumes arithmetic operands, not invented historical Evidence. */
function arithmetic(metric:MetricId,a:string,b:string,start:string,end:string,normalization:MetricRequest['normalization']['kind']='AS_REPORTED'){
 const operand=(id:string,value:string):MetricOperand=>({id,value,unit:'VND',periodStart:start,periodEnd:end,quality:'VALID',validThrough:'2026-10-30T23:59:59.999Z'});
 return calculateMetrics([{id:'adopted-'+metric,metric,evidenceRefs:['a','b'],years:null,comparable:true,normalization:{kind:normalization,rationale:'Reused retained arithmetic; not formal scoring authorization',evidenceRefs:[]}}],[operand('a',a),operand('b',b)],'RETAIL','2026-10-30T23:59:59.999Z',[],false)[0].value;
}
export class CurrentFinancialCoverage {
 constructor(private readonly db:PrismaClient,private readonly root:string,private readonly financial:CurrentFinancialAdmissions,private readonly datasets:CurrentFinancialDatasets,private readonly composition:CoverageComposition){}
 private json(pin:SourcePin){return JSON.parse(sourceBytes(this.root,pin).toString()) as AnyRecord;}
 private authority(knownAt:string){
  const pin=this.composition.registry(),registry=this.json(pin);instant(registry.recordedAt);must(registry.recordedAt<=knownAt,'COVERAGE_AUTHORITY_NOT_YET_KNOWN');
  const entries=registry.authorities.filter((a:AnyRecord)=>a.domain==='F2');must(entries.length===1,'AMBIGUOUS_COVERAGE_AUTHORITY');const a=entries[0];
  must(a.status==='APPROVED','STANDING_AUTHORITY_REVOKED');
  must(a.currentEnrichment?.adapterVersion==='current-research-and-reported-debt-v1','COVERAGE_VERSION_NOT_BOUND');
  for(const path of COVERAGE_CODE)must(a.code.some((p:SourcePin)=>p.path===path),'COVERAGE_CODE_NOT_BOUND:'+path);
  for(const p of a.code)sourceBytes(this.root,p);
  for(const p of [this.composition.debtReview,this.composition.history,this.composition.research])must(a.currentEnrichment.catalogs.some((q:SourcePin)=>q.path===p.path&&q.sha256===p.sha256),'COVERAGE_CATALOG_NOT_BOUND');
  const authorization=this.json(a.currentEnrichment.implementationAuthorization);
  must(authorization.implementationAuthorized===true&&authorization.formalScoresAuthorized===false&&authorization.productionActivated===false,'COVERAGE_AUTHORIZATION_SCOPE');
  instant(authorization.recordedAt);must(authorization.recordedAt<=knownAt,'COVERAGE_AUTHORIZATION_NOT_YET_KNOWN');
  const instruction=sourceBytes(this.root,authorization.source).toString();must(instruction.includes('Coverage')&&instruction.includes('REPORTED_BORROWINGS'),'EXPLICIT_COVERAGE_IMPLEMENTATION_INSTRUCTION_REQUIRED');
  return {id:a.id,version:a.version,registry:pin};
 }
 private debt(facts:QualifiedCurrentFact[],context:CurrentDatasetContext,ingestedAt:string){
  const review=this.json(this.composition.debtReview);instant(review.reviewedAt);
  must(review.ticker===context.ticker&&review.scope==='CONSOLIDATED'&&review.periodEnd==='2026-09-30','DEBT_REVIEW_DIMENSIONS');
  const matches=(item:string)=>facts.filter(f=>f.itemId===item&&f.scope===review.scope&&f.period.start===review.periodEnd&&f.period.end===review.periodEnd&&f.raw.sha256===review.raw.sha256);
  const short=matches('SHORT_TERM_FINANCIAL_BORROWINGS'),long=matches('LONG_TERM_FINANCIAL_BORROWINGS');must(short.length===1&&long.length===1,'UNIQUE_ADMITTED_DEBT_OPERANDS_REQUIRED');
  const s=short[0],l=long[0];must(s.value===review.reportedShort&&l.value===review.reportedNoncurrentLong,'DEBT_REVIEW_VALUE_MISMATCH');
  sourceBytes(this.root,review.raw);const pages=this.json(review.reviewedPages);
  for(const n of review.reviewedPages.physicalPages)must(pages.pages.some((p:AnyRecord)=>p.page===n),'DEBT_SOURCE_LOCATOR_MISSING');
  const ref=this.composition.debtReview.path,refHash=this.composition.debtReview.sha256;
  const metadata:DebtMetadata=seal({contractVersion:DEBT_CONTRACT.version,ticker:context.ticker,periodEnd:review.periodEnd,scope:'CONSOLIDATED' as const,unit:'CURRENCY' as const,currency:'VND' as const,measurementBasis:'ISSUER_REPORTED_CARRYING_AMOUNT' as const,leasePolicyVersion:DEBT_CONTRACT.leasePolicyVersion,reportedPopulationStatus:'REPORTED_COMPLETE' as const,comprehensivePopulationStatus:'COMPREHENSIVE_UNVERIFIED' as const,knownFinancingOmission:false as const,sourceHashes:[review.raw.sha256],evidenceReference:ref,evidenceHash:refHash,reviewedAt:review.reviewedAt,uncertainty:review.uncertainty,exhaustiveEvidenceReference:null});
  const presentation:IncludedCurrentPortionEvidence=seal({version:'current-portion-presentation-v1' as const,status:'INCLUDED_IN_SHORT_NOT_SEPARATELY_DISCLOSED' as const,ticker:context.ticker,periodEnd:review.periodEnd,scope:'CONSOLIDATED' as const,currency:'VND' as const,unit:'CURRENCY' as const,shortCanonicalId:s.id,longCanonicalId:l.id,shortValue:s.value,longValue:l.value,shortPresentationVerified:true as const,noncurrentLongPresentationVerified:true as const,sourcePath:review.raw.path,sourceHash:review.raw.sha256,shortLocator:review.shortLocator,longLocator:review.longLocator,inclusionLocator:review.inclusionLocator,exclusionLocator:review.exclusionLocator,evidenceReference:ref,evidenceHash:refHash,reviewedAt:review.reviewedAt});
  const receipt:DebtPopulationReceipt=seal({id:'current-debt-receipt:'+hash({short:s.id,long:l.id,refHash}),ticker:context.ticker,sector:'RETAIL',periodEnd:review.periodEnd,shortCanonicalId:s.id,longCanonicalId:l.id,shortValue:s.value,longValue:l.value,currentPortion:null,currentPortionPresentation:presentation,shortIncludesCurrentPortion:true,longIncludesCurrentPortion:false,knownFinancingItems:review.knownFinancingItems,reportedSurveyVerified:true,currentPortionVerified:true,metadata});
  const validationContext={analysisAt:context.economicCutoff+'T23:59:59.999Z',systemKnownAt:context.knownAt,sourceBindings:[review.raw,this.composition.debtReview,review.reviewedPages],statements:[{ticker:context.ticker,reportingScope:'CONSOLIDATED',reportingPeriod:{end:review.periodEnd},SHA256:review.raw.sha256,verifiedHash:review.raw.sha256,reviewStatus:'QUALIFIED'}]};
  const result=evaluateDebtReceipt(receipt,facts,validationContext,hash);must(result,'REPORTED_DEBT_CONTRACT_REJECTED');
  const id='current-reported-debt:'+hash(receipt),availableAt=[s.evidence.time.originalReceivedAt,review.reviewedAt,ingestedAt].sort().at(-1)!;
  const evidence:CurrentValuationEvidence={...s.evidence,id,observation:'REPORTED_BORROWINGS',value:result.value,family:'FINANCIAL_DERIVED',receivedAt:availableAt,time:{...s.evidence.time,qualificationReference:ref,reviewedAt:review.reviewedAt,ingestedAt,availableAt},debtAccounting:{contractVersion:DEBT_CONTRACT.version,role:'DEBT',ticker:context.ticker,periodEnd:review.periodEnd,scope:'CONSOLIDATED',currency:'VND',measurementBasis:metadata.measurementBasis,leasePolicyVersion:metadata.leasePolicyVersion,qualifiedEvidenceReference:ref,sourceHashes:metadata.sourceHashes,qualificationStatus:'VERIFIED',selectedDebtMetric:'REPORTED_BORROWINGS',cashEconomicAvailabilityVerified:false,normalizedOrDownside:false}};
  validateEvidence([evidence],context.securityId,evidence.asOf,context.knownAt,'CURRENT_FORMAL_VALUATION');
  const fact={...s,id,itemId:'REPORTED_BORROWINGS',mappingIds:[...s.mappingIds,...l.mappingIds],value:result.value,evidence,debtMetadata:metadata,derivation:{kind:'QUALIFIED_REPORTED_BORROWINGS',formula:'SHORT_PLUS_NONCURRENT_LONG_NO_UNDISCLOSED_CURRENT_ADJUSTMENT',operands:[{id:s.id,hash:hash(s)},{id:l.id,hash:hash(l)}],receipt},retainedProvenance:{sourceReview:this.composition.debtReview,source:s.raw,currentPortion:null,comprehensiveCertification:false}};
  return {fact,receipt,validationContext};
 }
 private history(){
  const archive=this.json(this.composition.history);must(archive.contract==='retained-admitted-financial-history-v1'&&archive.ticker==='VNM'&&sha(archive.body)===archive.bodyHash,'HISTORY_ADMISSION_BODY_HASH');
  const snapshot=JSON.parse(archive.body);must(snapshot.contract==='structured-issuer-verified-current-v1','HISTORY_ADMISSION_CONTRACT');
  const facts=snapshot.canonicalFacts;must(facts.every((f:AnyRecord)=>f.ticker==='VNM'&&f.qualified===true),'HISTORY_TICKER_OR_QUALIFICATION');
  return {admissionId:archive.admissionId,bodyHash:archive.bodyHash,facts,originalDerivedMetrics:snapshot.derivedMetrics,source:this.composition.history,historicalPitGranted:false};
 }
 private research(history:ReturnType<CurrentFinancialCoverage['history']>,current:QualifiedCurrentFact[],context:CurrentDatasetContext){
  const catalog=this.json(this.composition.research),documents:Record<string,AnyRecord>={};
  must(catalog.contract==='closed-research-current-adoption-v1'&&catalog.ticker===context.ticker&&catalog.economicCutoff===context.economicCutoff,'RESEARCH_ADOPTION_SCOPE');
  for(const [name,pin]of Object.entries(catalog.files))documents[name]=this.json(pin as SourcePin);
  for(const name of ['S1Acceptance','S2Acceptance','S5Acceptance'])must(documents[name].status==='CLOSED','ACCEPTED_RESEARCH_CLOSURE_REQUIRED');
  const facts=history.facts as AnyRecord[];
  const exact=(item:string,start:string,end:string)=>{const matches=facts.filter(f=>f.itemId===item&&f.scope==='CONSOLIDATED'&&f.unit==='CURRENCY'&&f.period.start===start&&f.period.end===end);must(matches.length===1,'HISTORY_PERIOD_OR_DEFINITION_AMBIGUOUS:'+item+':'+end);return matches[0];};
  const roic=documents.S1Annual.engineArithmeticInputs.map((r:AnyRecord)=>{const value=arithmetic('ROIC',r.nopat,r.averageCapital,r.year+'-01-01',r.year+'-12-31','NORMALIZED');must(value===r.expectedRoic12dp,'ACCEPTED_ROIC_REPLAY_MISMATCH');return {year:r.year,value,classification:'ESTIMATE',nopat:r.nopat,averageCapital:r.averageCapital,source:{...catalog.files.S1Annual,pointer:'/engineArithmeticInputs/'+documents.S1Annual.engineArithmeticInputs.indexOf(r)}};});
  const diagnostics:AnyRecord[]=[];
  for(const y of [2022,2023,2024,2025]){
   const start=y+'-01-01',end=y+'-12-31',cfo=exact('CFO',start,end),npat=exact('NET_INCOME',start,end);
   const legacy=history.originalDerivedMetrics.find((d:AnyRecord)=>d.metric==='CFO_CONVERSION'&&d.period.start===start&&d.period.end===end&&d.scope==='CONSOLIDATED');
   const value=decimal(cfo.value).div(decimal(npat.value)).toString();must(legacy?.value===value,'RETAINED_CFO_DIAGNOSTIC_REPLAY');
   diagnostics.push({metric:'REPORTED_CFO_TO_REPORTED_GROUP_NPAT',period:{start,end},scope:'CONSOLIDATED',value,operands:[cfo.id,npat.id],normalization:'AS_REPORTED_NOT_NORMALIZED_NPAT'});
   if(y>2022){const op=exact('TOTAL_EQUITY',(y-1)+'-12-31',(y-1)+'-12-31'),cl=exact('TOTAL_EQUITY',end,end),avg=decimal(op.value).add(decimal(cl.value)).div(decimal('2')).toString();diagnostics.push({metric:'REPORTED_GROUP_ROE',period:{start,end},scope:'CONSOLIDATED',value:decimal(npat.value).div(decimal(avg)).toString(),operands:[npat.id,op.id,cl.id],normalization:'GROUP_NPAT_TOTAL_EQUITY_NOT_NORMALIZED_COMMON_ROE'});}
  }
  const revStart=exact('REVENUE','2022-01-01','2022-12-31'),revEnd=exact('REVENUE','2025-01-01','2025-12-31');
  const revenueOperands=[revEnd,revStart].map(f=>({id:f.id,value:f.value,unit:'VND' as const,periodStart:f.period.start,periodEnd:f.period.end,quality:'VALID' as const,validThrough:context.economicCutoff+'T23:59:59.999Z',source:f.sourceDocumentId}));
  const revenueCagr=calculateMetrics([{id:'adopted-revenue-cagr-2022-2025',metric:'REVENUE_CAGR',evidenceRefs:revenueOperands.map(f=>f.id),years:3,comparable:true,growthOperands:revenueOperands.map(f=>({evidenceRef:f.id,scope:'CONSOLIDATED',periodType:'ANNUAL',periodStart:f.periodStart,periodEnd:f.periodEnd,sourceReference:f.source,revisionPolicy:'RETAINED_ORIGINAL_ANNUAL_CURRENT_YEAR_COLUMNS_NOT_Q3_RECLASSIFIED'})),normalization:{kind:'AS_REPORTED',rationale:'Existing admitted annual net revenue, three-year window, separate from reclassified YTD',evidenceRefs:[]}}],revenueOperands,'RETAIL',context.economicCutoff+'T23:59:59.999Z',[],false)[0];
  const sf=documents.Shared.facts;
  const parentFcf=arithmetic('FCF',sf.parentCfo25.value,sf.parentCapexCash25.value,'2025-01-01','2025-12-31');
  const q3Cfo=current.find(f=>f.itemId==='CFO'&&f.period.end==='2026-09-30')!,q3Capex=current.find(f=>f.itemId==='ASSET_PURCHASE_CASH_OUTFLOW'&&f.period.end==='2026-09-30')!;
  must(q3Cfo&&q3Capex,'CURRENT_CFO_CAPEX_REQUIRED');
  const q3Fcf=arithmetic('FCF',q3Cfo.value,q3Capex.value,q3Cfo.period.start,q3Cfo.period.end);
  const metricRows=documents.MetricMatrix.executableMetricRows.filter((r:AnyRecord)=>r.ticker===context.ticker);
  const dispositions=metricRows.map((r:AnyRecord)=>({metric:r.metric,applicability:r.applicability,status:r.applicability==='BANK_SPECIFIC'?'NOT_APPLICABLE':r.metric==='ROIC'?'BOUND_ACCEPTED_ESTIMATE_RANGES':r.metric==='REVENUE_CAGR'?'BOUND_QUALIFIED_ANNUAL_ARITHMETIC':r.metric==='FCF'?'BOUND_REPORTED_CASHFLOW_DIAGNOSTIC_AND_S5_EQUITY_SCENARIOS':r.metric==='ROE'||r.metric==='CFO_CONVERSION'?'BOUND_REPORTED_DIAGNOSTICS_NORMALIZED_POINT_N_R':r.metric==='MOS'?'BOUND_ACCEPTED_S5_MOS_DISPOSITION_NO_UNSUPPORTED_POINT': ['FCF_YIELD','DIVIDEND_YIELD','EARNINGS_YIELD','EV_EBIT','PB'].includes(r.metric)?'OPTIONAL_POINT_N_R_PRIMARY_S5_VALUATION_BOUND':'N_R_WITH_EXISTING_CONTRACT_LIMITATION',reason:r.metric==='INCREMENTAL_ROIC'?'Accepted S1: incremental capital comparability/materiality unresolved; no project attribution demanded.':r.metric==='EPS_CAGR'?'Retained common EPS history/CAGR diagnostic bound; no new action-adjusted EPS certification inferred.':r.metric==='NET_DEBT'||r.metric==='NET_DEBT_EBITDA'?'Reported borrowing qualified; unrestricted consolidated cash/compatible normalized EBITDA not certified by reported balances. S2 closure unchanged.':r.metric==='INTEREST_COVERAGE'?'S2 reported parent EBIT/gross interest context preserved; not blindly transferred to normalized group/net-interest metric.':r.metric==='ROE'?'Normalized common ROE not invented from group profit/total equity. Accepted annual ROIC supports return assessment.':r.metric==='CFO_CONVERSION'?'Reported CFO/NPAT diagnostics are not relabelled cumulative normalized NPAT. Existing BQ-CASH research alternative retained.':null,mandatoryExactPointNotInferred:true}));
  return {contract:'adopted-current-research-metrics-v1',ticker:context.ticker,purpose:'CURRENT_FORMAL_VALUATION',sourceCatalog:this.composition.research,
   acceptedClosures:{S1:catalog.files.S1Acceptance,S2:catalog.files.S2Acceptance,S5:catalog.files.S5Acceptance},roic:{classification:'ESTIMATE_RANGE',annual:roic,acceptedRanges:documents.S1Annual.historicalAnnualSummary.map((r:AnyRecord)=>({year:r.year,range:r.roicSensitivityRange,periodStart:r.year+'-01-01',periodEnd:r.year+'-12-31',scope:'CONSOLIDATED'})),currentQ3:documents.S1Current.q3CurrentPeriod,exactTtmRoic:'N_R_RETAINED_ACCEPTED_S1_DISPOSITION',incremental:documents.S1Current.incrementalComparability},
   historicalReportedDiagnostics:diagnostics,revenueCagr:{value:revenueCagr.value,years:3,scope:'CONSOLIDATED',periods:[revStart.period,revEnd.period],operandIds:[revEnd.id,revStart.id],classification:'AS_REPORTED_DERIVED'},
   fcf:{classification:'AS_REPORTED_CFO_MINUS_ASSET_PURCHASE_PAYMENTS_NOT_NORMALIZED_FCFE',parentFY2025:{value:parentFcf,scope:'STANDALONE',period:{start:'2025-01-01',end:'2025-12-31'},operandRefs:[{...catalog.files.Shared,pointer:'/facts/parentCfo25'},{...catalog.files.Shared,pointer:'/facts/parentCapexCash25'}]},consolidated9m2026:{value:q3Fcf,scope:'CONSOLIDATED',period:q3Cfo.period,operandIds:[q3Cfo.id,q3Capex.id]}},
   commonEpsHistory:documents.Shared.realEpsSeries,commonAttribution:documents.Shared.commonNumeratorAttribution,realCommonEpsCagrDiagnostic:documents.Shared.metrics.realCommonEpsCagr22to25,
   liquidity:{acceptance:documents.S2Acceptance,retainedSensitivitySurface:documents.S2Results,closedResearchReopened:false},valuation:{classification:'ESTIMATE_WITH_ASSUMPTIONS',scope:'STANDALONE_PARENT_EQUITY_MODEL_NOT_GROUP_ROIC',inputs:documents.S5Inputs.reconciliation,modelAssumptions:documents.S5Inputs.modelNumbers,scenarios:documents.S5Scenarios.cases,expectedReturns:documents.S5Returns,sourceRefs:[catalog.files.S5Inputs,catalog.files.S5Scenarios,catalog.files.S5Returns]},
   metricDispositions:dispositions,allRequestedMetricsDispositioned:dispositions.length===metricRows.length,sourceFactsRequalified:false,estimatesPromotedToFacts:false,historicalPitGranted:false,formalPointsGranted:false};
 }
 async build(datasetId:string,context:CurrentDatasetContext,adoptionAt=context.knownAt){
  must(context.purpose==='CURRENT_FORMAL_VALUATION','CURRENT_ONLY_NOT_PIT');const now=this.composition.clock.now();instant(now);must(context.knownAt<=now,'FUTURE_OPERATIONAL_KNOWLEDGE');
  const authority=this.authority(context.knownAt),base=await this.datasets.consume(datasetId,context),native=await this.financial.consume(base.manifest.admissionId,context);
  const history=this.history(),debt=this.debt(native.facts,context,adoptionAt),research=this.research(history,native.facts,context);
  return {contract:'current-financial-coverage-enrichment-v1' as const,context,authority,parentDatasetId:datasetId,parentManifestHash:hash(base.manifest),admissionId:native.id,baseFacts:base.manifest.facts,qualifiedDebt:debt,history,research,price:base.price,shares:base.shares,
   currentNativeCoreDebtQualified:true,historicalWindowsBound:true,estimatesRemainEstimates:true,readyForScoring:false as const,historicalPitGranted:false as const,VNM17Promoted:false as const};
 }
 async bind(datasetId:string,context:CurrentDatasetContext){
  const now=this.composition.clock.now();instant(now);must(context.knownAt<=now,'FUTURE_OPERATIONAL_KNOWLEDGE');
  const operational={...context,knownAt:now},authority=this.authority(now);
  const id='current-coverage:'+hash({datasetId,ticker:context.ticker,securityId:context.securityId,economicCutoff:context.economicCutoff,authority,debtReview:this.composition.debtReview,history:this.composition.history,research:this.composition.research});
  await assertNotRevoked(this.db,id);
  const previous=await this.db.$queryRawUnsafe<{body:string;body_hash:string}[]>('SELECT body,body_hash FROM current_financial_enrichment WHERE id=?',id);
  if(previous.length){await this.consume(id,operational);return {id,duplicate:true,result:checkedBody<{result:Awaited<ReturnType<CurrentFinancialCoverage['build']>>}>(previous[0]).result};}
  const result=await this.build(datasetId,operational,now),body=canonicalJson({id,result});
  return this.db.$transaction(async tx=>{
   await assertNotRevoked(tx,id);const rows=await tx.$queryRawUnsafe<{body:string;body_hash:string}[]>('SELECT body,body_hash FROM current_financial_enrichment WHERE id=?',id);
   if(rows.length){const old=checkedBody<{result:Awaited<ReturnType<CurrentFinancialCoverage['build']>>}>(rows[0]);must(old.result.parentManifestHash===result.parentManifestHash,'COVERAGE_BINDING_ID_REUSE');return {id,duplicate:true,result:old.result};}
   const f=result.qualifiedDebt.fact;
   const previous=await tx.$queryRawUnsafe<{body:string;body_hash:string}[]>('SELECT body,body_hash FROM current_financial_fact WHERE id=?',f.id);
   if(previous.length)must(checkedBody<AnyRecord>(previous[0]).value===f.value,'REPORTED_DEBT_IMMUTABLE_CONFLICT');
   else {const fb=canonicalJson(f);await tx.$executeRawUnsafe('INSERT INTO current_financial_fact VALUES(?,?,?,?,?)',f.id,result.admissionId,f.raw.sha256,fb,sha(fb));}
   for(const p of [this.composition.debtReview,this.composition.history,this.composition.research])await tx.$executeRawUnsafe('INSERT OR IGNORE INTO current_financial_raw VALUES(?,?,?)',p.sha256,p.path,sourceBytes(this.root,p));
   await tx.$executeRawUnsafe('INSERT INTO current_financial_enrichment VALUES(?,?,?,?,?)',id,datasetId,result.admissionId,body,sha(body));
   return {id,duplicate:false,result};
  });
 }
 async consume(id:string,context:CurrentDatasetContext){
  must(context.purpose==='CURRENT_FORMAL_VALUATION','CURRENT_ONLY_NOT_PIT');await assertNotRevoked(this.db,id);
  const rows=await this.db.$queryRawUnsafe<{body:string;body_hash:string}[]>('SELECT body,body_hash FROM current_financial_enrichment WHERE id=?',id);
  const stored=checkedBody<{id:string;result:Awaited<ReturnType<CurrentFinancialCoverage['build']>>}>(rows[0]);must(stored.id===id&&stored.result.context.ticker===context.ticker&&stored.result.context.securityId===context.securityId&&stored.result.context.knownAt<=context.knownAt,'COVERAGE_CONSUMPTION_SCOPE');
  const replay=await this.build(stored.result.parentDatasetId,stored.result.context);must(hash(replay)===hash(stored.result),'COVERAGE_DETERMINISTIC_REPLAY_MISMATCH');
  this.authority(context.knownAt);await this.datasets.consume(stored.result.parentDatasetId,context);
  const f=stored.result.qualifiedDebt.fact;await assertNotRevoked(this.db,f.id);
  const fr=await this.db.$queryRawUnsafe<{body:string;body_hash:string}[]>('SELECT body,body_hash FROM current_financial_fact WHERE id=?',f.id);must(hash(checkedBody(fr[0]))===hash(f),'QUALIFIED_DEBT_STORED_INTEGRITY');
  for(const p of [this.composition.debtReview,this.composition.history,this.composition.research]){const rows=await this.db.$queryRawUnsafe<{payload:Uint8Array}[]>('SELECT payload FROM current_financial_raw WHERE hash=?',p.sha256);must(rows.length===1&&sha(rows[0].payload)===p.sha256,'COVERAGE_STORED_PROOF_HASH');}
  return {id,...stored.result,qualifiedDebtFact:f,metricInputs:stored.result.research,previouslyAdmittedHistory:stored.result.history.facts,readyForScoring:false as const};
 }
 async revoke(id:string,reason:string,knownAt:string){must(reason.trim(),'REVOCATION_REASON_REQUIRED');return admissionEvent(this.db,'REVOCATION',id,knownAt,{reason});}
}
