"""TCB-only retained-evidence qualification; no scenario valuation or runtime imports."""
import json,hashlib,subprocess,datetime
from pathlib import Path
from decimal import Decimal,localcontext,ROUND_HALF_EVEN
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
P26='docs/fundamental-data-engine/dfr-05/p2-6-tcb-78d7069d'
OWNER='docs/fundamental-data-engine/dfr-05/p2-6-owner-escalation-969e36ab'
BASE='4a2052611cc37002ad0ba7d15a15b8a8c03a3ebf';RESEARCH='969e36ab241a61f31d89d4371e83ece977db3458'
NOTES='data/manual-extracted-pdf/notes/TCB.json'
V4='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-04/earnings-normalization-v4/issuers/TCB.json'
PRIOR='docs/fundamental-data-engine/dfr-05/p2-3-b1-bank-07b94a51/issuers/TCB.json'
HISTORY='data/market-source/tcbs/2026-10-29T01-48-59.704Z-unified/5.13-TCB-history.raw.json'
D=Decimal;PINS={};CACHE={}
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def digest(x):return hashlib.sha256(json.dumps(x,sort_keys=True,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode()).hexdigest()
def read(p):
 PINS[p]=sha(ROOT/p)
 if p not in CACHE:CACHE[p]=json.loads((ROOT/p).read_text())
 return CACHE[p]
def ptr(x,p):
 for k in p.split('/')[1:]:x=x[int(k)] if isinstance(x,list) else x[k.replace('~1','/').replace('~0','~')]
 return x

def bind(p,pointer=''):return dict(path=p,sha256=sha(ROOT/p),jsonPointer=pointer,objectHash=digest(ptr(read(p),pointer)))
def text(d):return format(d,'f')
def ratio(a,b):
 with localcontext() as c:c.prec=70;return text((D(a)/D(b)).quantize(D('0.000000000001'),rounding=ROUND_HALF_EVEN))
def write(name,x):(OUT/name).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def build():
 head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();assert head==BASE
 if not (OUT/'protected-before.json').exists():
  paths={p for p in subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0') if p and (ROOT/p).is_file()}|{str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()}
  write('protected-before.json',{p:sha(ROOT/p) for p in sorted(paths)})
 notes=read(NOTES);prior=read(P26+'/evidence-ledger.json');facts={};narratives=[]
 def reported(id,value,doc,page,caption,year=2025,unit='MILLION_VND',column=None,review='NEW_IMAGE_REVIEW',population='CONSOLIDATED_GROUP'):
  docobj=notes['documents'][doc];pdf=docobj['pdfPaths'][0];h=sha(ROOT/pdf);assert h==docobj['sourceHash'];PINS[pdf]=h
  mult='1000000' if unit=='MILLION_VND' else '0.01' if unit=='PERCENT' else '1';v=text(D(value)*D(mult)) if value is not None else None
  facts[id]=dict(id=id,ticker='TCB',classification='FACT',factNature='REPORTED_READING',value=v,nativeValue=value,nativeUnit=unit,multiplier=mult,unit='VND' if unit=='MILLION_VND' else 'RATIO' if unit=='PERCENT' else unit,year=year,periodEnd=str(year)+'-12-31',scope='CONSOLIDATED',population=population,column=column or str(year)+' CURRENT',revision='EXPLICIT_ORIGINAL_OR_COMPARATIVE_AS_LABELLED',caption=caption,source=dict(path=pdf,sha256=h,physicalPage=page,href=pdf+'#page='+str(page)),notesBinding=bind(NOTES,f'/documents/{doc}/pages/{page-1}'),review=review,productionAdmissible=False,publicationAt=None)
  return id
 def legacy(key):
  id='P26:'+key;x=prior['financials'][key];facts[id]=dict(id=id,ticker='TCB',classification='FACT',factNature=x['classification'],value=x['value'],unit=x['unit'],year=x.get('year'),scope=x['scope'],population=x.get('population'),status=x['status'],limitations=x['limitations'],binding=bind(P26+'/evidence-ledger.json','/financials/'+key),productionAdmissible=False);return id
 for k in ['GROUP_EQUITY','NCI_EQUITY','PARENT_EQUITY','OTHER_EQUITY','INTANGIBLE_ASSETS','PARENT_NPAT','COMMON_EPS_NUMERATOR','PARENT_RETAINED_CAPITAL_TRANSACTION','PARENT_BOOK_ROLLFORWARD','CLOSING_SHARES','WEIGHTED_BASIC_SHARES','CUSTOMER_PROVISION_FLOW','BANK_CORE_LOANS','CUSTOMER_CREDIT_COST_REPORTED','PARENT_DIVIDEND_MOVEMENT','REPORTED_CAR','REPORTED_MIN_CAR','TOTAL_RWA','REGULATORY_CAPITAL','TIER1_RATIO','DEMAND_DEPOSIT_SHARE','FEE_NET','LIQ_GAP_LT1M','LIQ_GAP_1_5Y']:
  legacy(k+':2025')
 for k in ['PARENT_EQUITY','COMMON_EPS_NUMERATOR','BANK_CORE_LOANS','CUSTOMER_PROVISION_FLOW']:legacy(k+':2024')
 reported('OTHER_RESERVE_ORIGIN_2022','555997',5,65,'Subsidiary transfer of reserves and undistributed earnings: other equity',2022)
 reported('OTHER_RESERVE_RECLASS_2024','7208089',12,60,'Subsidiary capital increase from equity: other-equity reclassification',2024)
 reported('OTHER_RESERVE_OPEN_2024','555997',12,60,'Other-equity opening2024',2023,column='1/1/2024 opening')
 reported('OTHER_RESERVE_RETAINED_OFFSET_2024','-8242064',12,60,'Retained earnings offset for subsidiary capital increase',2024)
 reported('OTHER_RESERVE_NCI_OFFSET_2024','1033975',12,60,'NCI offset for subsidiary capital increase',2024)
 reported('RESERVES_TRANSFER_2022','-233838',5,65,'Total reserves transferred by subsidiary',2022)
 reported('EARNINGS_TRANSFER_2022','-390881',5,65,'Undistributed earnings transferred by subsidiary',2022)
 reported('NCI_TRANSFER_2022','68722',5,65,'NCI reallocation on subsidiary transfer',2022)
 reported('SHARE_CAPITAL_2025','70862404',2,70,'Share capital',review='REUSED_P26_PAGE_REVIEW')
 reported('SHARE_PREMIUM_2025','-124',2,70,'Share premium',review='REUSED_P26_PAGE_REVIEW')
 reported('RESERVES_2025','28644562',2,70,'Total reserves',review='REUSED_P26_PAGE_REVIEW')
 reported('RETAINED_EARNINGS_2025','62773576',2,70,'Retained earnings',review='REUSED_P26_PAGE_REVIEW')
 for year,val,doc,page,col in [(2022,'411169101',0,45,'FY2022 comparative in FY2023'),(2023,'502022401',0,45,'FY2023 current'),(2024,'605813718',12,41,'FY2024 current')]:reported('CORE_LOANS_'+str(year),val,doc,page,'Classified banking customer loans excluding securities margin/advances',year,column=col,population='BANK_CORE_CUSTOMER_EX_MARGIN')
 reported('PROVISION_GENERAL_2023','679579',0,70,'General bank customer-loan provision expense',2023,population='BANK_CORE_CUSTOMER_EX_MARGIN')
 reported('PROVISION_SPECIFIC_2023','3529151',0,70,'Specific bank customer-loan provision expense',2023,population='BANK_CORE_CUSTOMER_EX_MARGIN')
 for id,val,caption,year in [('PROPERTY_SALE_INCOME_2024','1732136','Property sale income',2024),('PROPERTY_SALE_COST_2024','-1235101','Property sale cost',2024),('INSURANCE_TERMINATION_2024','-1808413','Insurance partnership termination expense',2024),('SUB_REVALUATION_EXPENSE_2025','-3354','Subsidiary investment revaluation difference expense',2025),('RECOVERIES_2025','1354286','Recovery of written-off debts',2025),('RECOVERIES_2024','1138200','Recovery of written-off debts',2024)]:reported(id,val,2,74,caption,year)
 for id,cap in [('PROPERTY_SALE_INCOME_2025_DASH','Property sale income dash'),('PROPERTY_SALE_COST_2025_DASH','Property sale cost dash'),('INSURANCE_TERMINATION_2025_DASH','Insurance termination expense dash')]:reported(id,None,2,74,cap)
 reported('REPORTED_BANK_TAX_RATE_2025','20',2,68,'Stated bank corporate income tax rate FY2025',unit='PERCENT')
 reported('GROUP_PRETAX_2025','32538066',2,68,'Reported group profit before tax')
 reported('GROUP_CURRENT_TAX_2025','6544225',2,68,'Reported current-year current income tax expense')
 # Historical parent earnings remain original qualified P2.3 objects, not new common/sustainable estimates.
 old=read(PRIOR)
 for i,m in enumerate(old['metrics']):
  if m['concept']=='NET_INCOME_ATTRIBUTABLE_PARENT' and m['year'] in (2022,2023):facts['PRIOR_PARENT_'+str(m['year'])]=dict(id='PRIOR_PARENT_'+str(m['year']),ticker='TCB',classification='FACT',value=m['value'],unit='VND',year=m['year'],scope=m['scope'],status=m['status'],binding=bind(PRIOR,'/metrics/'+str(i)),productionAdmissible=False)
 for doc,page,claim in [(2,20,'Consolidation policy explicitly separates NCI interests in subsidiary profit and net assets.'),(2,71,'All disclosed issued parent shares are ordinary with equal residual priority; dividend decisions are AGM-dependent.'),(2,18,'Insurance stakes/control change during2025; full-year comparable economics cannot be assumed.'),(2,72,'Fee composition includes securities and insurance activities; line recurrence is not a guaranteed future level.'),(2,60,'Group intangible assets are not an allocated parent TCE deduction.'),(0,65,'FY2023 retains the other-equity reserve555997million.'),(2,70,'FY2025 retains other equity7764086million; direct retained capital event is outside P&L.')]:
  narratives.append(dict(id=f'N:{doc}:{page}',claim=claim,ticker='TCB',notesBinding=bind(NOTES,f'/documents/{doc}/pages/{page-1}'),source=notes['documents'][doc]['pdfPaths'][0],page=page,status='QUALIFIED_REPORTED_CONTEXT_RESEARCH_ONLY',review='REUSED_P26_REVIEW' if doc==2 and page in [71,18,72,60,70] else 'RETAINED_JSON_CONTENT_REVIEW',productionAdmissible=False))
 def val(k):return D(facts[k]['value'])
 def calc(id,operands,formula,value,unit='VND',limit='Exact historical reconciliation, not forecast.'):
  facts[id]=dict(id=id,ticker='TCB',classification='FACT',factNature='DERIVED_HISTORICAL_DIAGNOSTIC',value=text(value) if isinstance(value,D) else value,unit=unit,operandIds=operands,formula=formula,limitations=limit,productionAdmissible=False)
 calc('OTHER_EQUITY_BRIDGE',['OTHER_RESERVE_ORIGIN_2022','OTHER_RESERVE_RECLASS_2024'],'555997+7208089 million, unchanged2025',val('OTHER_RESERVE_ORIGIN_2022')+val('OTHER_RESERVE_RECLASS_2024'))
 calc('PARENT_COMPONENT_SUM',['SHARE_CAPITAL_2025','SHARE_PREMIUM_2025','RESERVES_2025','RETAINED_EARNINGS_2025','OTHER_EQUITY_BRIDGE'],'sum share capital+premium+reserves+retained earnings+other reserve',sum([val(k) for k in ['SHARE_CAPITAL_2025','SHARE_PREMIUM_2025','RESERVES_2025','RETAINED_EARNINGS_2025','OTHER_EQUITY_BRIDGE']],D(0)))
 calc('PROPERTY_GAIN_2024',['PROPERTY_SALE_INCOME_2024','PROPERTY_SALE_COST_2024'],'1732136−1235101 million',val('PROPERTY_SALE_INCOME_2024')+val('PROPERTY_SALE_COST_2024'))
 calc('CUSTOMER_CHARGE_2023',['PROVISION_GENERAL_2023','PROVISION_SPECIFIC_2023'],'679579+3529151 million',val('PROVISION_GENERAL_2023')+val('PROVISION_SPECIFIC_2023'))
 loans={2022:val('CORE_LOANS_2022'),2023:val('CORE_LOANS_2023'),2024:val('CORE_LOANS_2024'),2025:val('P26:BANK_CORE_LOANS:2025')}
 charges={2023:val('CUSTOMER_CHARGE_2023'),2024:val('P26:CUSTOMER_PROVISION_FLOW:2024'),2025:val('P26:CUSTOMER_PROVISION_FLOW:2025')};averages={y:(loans[y-1]+loans[y])/2 for y in charges};rates={}
 for y in charges:
  deps=['CORE_LOANS_'+str(y-1),'CORE_LOANS_'+str(y),'CUSTOMER_CHARGE_2023'] if y==2023 else (['CORE_LOANS_2023','CORE_LOANS_2024','P26:CUSTOMER_PROVISION_FLOW:2024'] if y==2024 else ['CORE_LOANS_2024','P26:BANK_CORE_LOANS:2025','P26:CUSTOMER_PROVISION_FLOW:2025'])
  r=ratio(charges[y],averages[y]);rates[y]=r;calc('CORE_CREDIT_COST_'+str(y),deps,'bank customer provision charge / simple average classified bank-core loans',r,'RATIO','Same population excludes securities margin; dates/vintages explicitly bound. Historical reported charge, not expected loss or full stress calibration.');facts['CORE_CREDIT_COST_'+str(y)]['exactFraction']=dict(numerator=text(charges[y]),denominator=text(averages[y]))
 pooled=ratio(sum(charges.values(),D(0)),sum(averages.values(),D(0)))
 calc('CORE_CREDIT_COST_POOLED',['CORE_CREDIT_COST_2023','CORE_CREDIT_COST_2024','CORE_CREDIT_COST_2025'],'sum2023–2025bank customer charges / sum2023–2025simple-average core loans',pooled,'RATIO','Loan-exposure-weighted historical sensitivity anchor; not a full-cycle estimate.');facts['CORE_CREDIT_COST_POOLED']['exactFraction']=dict(numerator=text(sum(charges.values(),D(0))),denominator=text(sum(averages.values(),D(0))))
 authorization=dict(schema='tcb-assumption-qualification-owner-authorization-v1',issuer='TCB',case='TCB-FY2025-RETROSPECTIVE',recordDate='2026-11-09',timezone='Asia/Ho_Chi_Minh',approvalSource='Explicit owner attachment: TCB Draft Valuation Assumption Qualification; followed by owner instruction tiếp tục thực hiện',ownerApprovalAt=None,scope='One bounded retained-evidence assumption qualification package; not P2.6 remediation round3',approvedBaselines=[RESEARCH,BASE],scopeApproval='APPROVED',numericalEconomicAssumptionsApproved=False,decisions=[],priorAuthorizationBinding=bind(OWNER+'/owner-decision-register.json'),conditionsRemain=True,sourceIdentityDiscovery=False,externalSourceAcquisitionAuthorized=False,draftValuationExecution='NOT_AUTHORIZED_IN_THIS_STEP',formalM3M4Production='NOT_AUTHORIZED')
 choices=[('D1','2025-12-31T23:59:59+07:00','Asia/Ho_Chi_Minh; FY2025 close-date research, not an intraday quoted price.'),('D2','RETROSPECTIVE_FY2025_AUDITED_RESEARCH','Not AS_KNOWN at FY2025 balance date; audit date is not publication time.'),('D3','RETAINED_TCBS_EXACT_DATE_ONLY_IF_UNIT_AND_ADJUSTMENT_QUALIFIED','Price eligibility conditional; no price is approved. Unit/adjustment semantics unresolved.'),('D4','FY2025_CLOSING_ORDINARY_SHARES_FOR_PER_SHARE_VALUE','7086240414closing ordinary shares; issuer action bridge required; weighted-average shares EPS-only.'),('D5','NULL_AND_BLOCK_DEPENDENT_OUTPUT','No unknown-as-zero, midpoint, stale values or unsupported estimates.'),('D6','RESEARCH_PROVISIONAL_DRAFT_ONLY','No formal scoring, ranking, M4 decision or production admission.')]
 for id,choice,condition in choices:authorization['decisions'].append(dict(id=id,issuer='TCB',case=authorization['case'],approvedChoice=choice,status='APPROVED',approvalSource=authorization['approvalSource'],ownerApprovalAt=None,effectiveResearchScope=authorization['case'],conditions=[condition],unresolvedEvidenceDependencies={'D1':[],'D2':[],'D3':['Native historical price units and adjustment algorithm/event coverage'],'D4':['Full issuer-wide price/share corporate-action bridge, distinct from annual net share totals'],'D5':['Missing economics stay null'],'D6':['Separate formal admission/acceptance not authorized']}[id]))
 write('owner-authorization.json',authorization)
 common=dict(ticker='TCB',status='QUALIFIED',qualificationScope='FY2025 consolidated non-tangible ordinary parent-attributable accounting book for draft P/B/RI research; not distributable cash, TCE, regulatory capital or formal admission',A_BOOK='170044504000000',unit='VND',asOf='2025-12-31',classification='FACT_DERIVED_ACCOUNTING_BRIDGE',ownerNumericalCaseApproval='PENDING',components=['P26:GROUP_EQUITY:2025','P26:NCI_EQUITY:2025','PARENT_COMPONENT_SUM','OTHER_EQUITY_BRIDGE'],rationale='NCI is explicitly separate in consolidation policy. All reported parent issued shares are ordinary. Other equity is traced to subsidiary reserve/retained-earnings reclassifications, not assumed to be preferred instruments. The full parent component sum equals group equity minus NCI. Include reported parent reserve in ordinary accounting book, without claiming free distribution.',TCE=None,TCEBlocker='Group intangibles/goodwill and NCI allocation/common deductions not qualified; no automatic subtraction.',closingShares='7086240414',weightedSharesEpsOnly='7069481069',priceCompatibilityQualified=False,productionAdmissible=False)
 write('common-equity-bridge.json',common)
 blockers={
 'sustainableCommonRoe':'Normalized common earnings not qualified; historical return proxy is not sustainable and no full-cycle common return interval is proven.',
 'costOfEquity':'Case-date nominal VND risk-free term, equity premium/country/bank risk calibration not qualified under existing selected source authority.',
 'growth':'Requires qualified sustainable common ROE, payout, RWA mix, capital buffer and growth feasibility; historical loan growth is not terminal common-book growth.',
 'payout':'Reported distribution movement is not a recurring cash policy; future retention/distribution and capital feasibility are unqualified.',
 'fundingStress':'No empirical outflow/rollover/spread calibration, usable-liquidity/repricing allocation or correlated-loss capital plan.',
 'capitalRequirements':'Historical reported capital floor is not an approved forward target; common-to-regulatory bridge, case-applicable constraints/RWA migration and management buffer missing.',
 'terminalEconomics':'No qualified terminal common ROE/ke/g/payout/horizon/transition economics; arbitrary multiple/spread prohibited.'}
 scenarios=[];selected={'BEAR':('CORE_CREDIT_COST_2023',max(rates.values(),key=D),'Highest2023–2025same-population reported rate as adverse historical credit-cost anchor. It is not a certified downside tail or full credit-cycle stress.'),'BASE':('CORE_CREDIT_COST_POOLED',pooled,'Exposure-weighted2023–2025same-population rate rather than a naive mean of ratios; this is a bounded calibration choice, not accepted sustainable credit cost.'),'BULL':('CORE_CREDIT_COST_2025',min(rates.values(),key=D),'Lowest2023–2025same-population reported rate as favorable historical anchor; it is not a lower loss bound or recovery forecast.')}
 for scenario,(anchor,rate,rationale) in selected.items():
  cells=[]
  for axis in ['sustainableCommonRoe','costOfEquity','growth','payout','creditCost','fundingStress','capitalRequirements','terminalEconomics','issuanceDilution']:
   iscredit=axis=='creditCost';issuance=axis=='issuanceDilution'
   value=rate if iscredit else dict(newShares='0',netNewCommonCash='0') if issuance else None
   cells.append(dict(id=scenario+':'+axis,axis=axis,value=value,range=None,unit='RATIO' if axis in ['sustainableCommonRoe','costOfEquity','growth','payout','creditCost'] else 'STRUCTURED',classification='ASSUMPTION',analystStatus='PROPOSED',ownerStatus='PENDING',qualification='SUPPORTED_LIMITED_HISTORICAL_SENSITIVITY' if iscredit else 'PROPOSED_MODELLING_RESTRICTION_ONLY' if issuance else 'BLOCKED_NUMERICAL_EVIDENCE',evidenceIds=[anchor] if iscredit else ['P26:CLOSING_SHARES:2025'] if issuance else [],rationale=rationale if iscredit else 'Explicit no-new-issuance and no-net-cash-raise constant-state scenario restriction only; not a historical fact, predicted financing policy or certified capital feasibility.' if issuance else blockers[axis],formula='Matched loan provision / simple-average core loan exposure; BASE=sumcharges/sumaverages. Apply only with compatible future exposure and parent/tax bridge.' if iscredit else 'newShares=0;netNewCommonCash=0; feasible only if retained common earnings can fund approved RWA growth and buffer.' if issuance else 'g=ROE*(1-payout), ke>0,ke>g,ROE>g where relevant; prerequisites unresolved.',confidence='MEDIUM_FOR_HISTORICAL_ANCHOR;LOW_FOR_STRESS_FORECAST' if iscredit else 'CONDITIONAL_MODELLING_DESIGN;NOT_EMPIRICAL_FORECAST' if issuance else 'INSUFFICIENT_FOR_NUMERICAL_RANGE',sensitivity='Δcommon earnings=−ΔcreditCost×qualified average future core loans×(1−qualified marginal tax)×qualified common attribution; no tax/incidence default.' if iscredit else 'Nonzero issuance changes book/share denominator, common return and capital; existing constant-state kernel must reject it.' if issuance else 'ROE/ke/g jointly determine(PB); payout and RWA/capital must reconcile. Do not vary one unsupported input to offset another.',downsideImplication='Observed worst of three years may understate correlated property/funding loss; it does not bound stress.' if iscredit else 'Zero issuance can be infeasible; reduce growth/payout or use a separately qualified capital-action case, never invent proceeds.' if issuance else blockers[axis],preciseBlocker=None if iscredit else 'Retained-earnings/RWA/capital feasibility still required; restriction not approved.' if issuance else blockers[axis],productionAdmissible=False))
  scenarios.append(dict(name=scenario,status='PARTIAL_NOT_EXECUTION_READY',cells=cells,draftEquityValue=None,draftPerShareValue=None,approvedValuation=None))
 write('assumption-register.json',dict(ticker='TCB',ownerCaseChoices='APPROVED_D1_D6',scenarios=scenarios,axisCount=9,slotCount=27,numericalCreditSensitivityCells=3,issuanceRestrictionCells=3,individualZeroRestrictionParameters=6,blockedNumericalEconomicCells=21,fullyReadyScenarios=0,numericalEconomicAssumptionsApproved=0,A_BOOK=common['A_BOOK'],A_BOOKKind='QUALIFIED_HISTORICAL_ACCOUNTING_FACT_NOT_FORECAST',draftValuationExecution='NOT_AUTHORIZED_IN_THIS_STEP',productionAdmissible=False))
 raw=(ROOT/HISTORY).read_text();PINS[HISTORY]=sha(ROOT/HISTORY);h=json.loads(raw,parse_float=D,parse_int=D);bar=h['data'][47];assert bar['tradingDate'].startswith('2025-12-31') and text(bar['close'])=='22789.00'
 price=dict(ticker='TCB',status='BLOCKED',selectedPrice=None,approvedPrice=None,ownerD3ChoiceApproved=True,rawCandidate=dict(path=HISTORY,sha256=PINS[HISTORY],jsonPointer='/data/47',rawClose=text(bar['close']),tradingDate=bar['tradingDate'],nativeUnit=None,adjustment=None,dividendTreatment=None,splitTreatment=None,rawSemantics='UNQUALIFIED; do not infer VND/share from magnitude or display API conventions.'),dateMatch='EXACT_RETAINED_DAILY_DATE_LABEL; not an intraday timestamp quote',historicalShareCountsQualified=True,corporateActionBridgeQualified=False,missing=['Provider5.13native price unit for this retained capture','Adjusted/unadjusted mode and event/factor/dividend methodology, including any postcutoff back-adjustment','Issuer-wide action IDs/ex-dates/terms and matching price/share basis; annual share changes alone are insufficient'],rejected=['October2026display price for FY2025','Inferred1.5orother adjustment factor from personal pending shares','Assuming no action because candidate has no action fields'],evidenceBindings=[bind(P26+'/decision-readiness.json','/historicalPriceCandidates/0'),bind(OWNER+'/valuation-choice-register.json','/items/2')],productionAdmissible=False)
 write('price-action-register.json',price)
 historicalreadings=read(V4)['sourceReadings'];oldnorm=read(V4)
 earnings=dict(status='PARTIAL',reportedCommonEpsEarnings='25254851000000',normalizedCommonEarnings=None,sustainableCommonRoe=None,reportedNumeratorBridge='25290230000000−35379000000; welfare already deducted once',history2022_2025=dict(parentNetIncome={'2022':facts['PRIOR_PARENT_2022']['value'],'2023':facts['PRIOR_PARENT_2023']['value'],'2024':facts['P26:COMMON_EPS_NUMERATOR:2024']['value'],'2025':facts['P26:COMMON_EPS_NUMERATOR:2025']['value']},warning='FY2022/2023 entries are parent NPAT; FY2024/2025 are ordinary EPS numerator after welfare. Distinct numerator populations, not a single common earnings growth series.'),historicalCreditCost={str(y):r for y,r in rates.items()},pooledCreditCost=pooled,adjustmentReview=[dict(topic='Credit expense',status='HISTORICAL_AXIS_SUPPORTED_ONLY',evidenceIds=['CUSTOMER_CHARGE_2023','P26:CUSTOMER_PROVISION_FLOW:2024','P26:CUSTOMER_PROVISION_FLOW:2025'],reason='Exclude securities margin/other credit reversals; no full-cycle loss or guarantee.'),dict(topic='Nonrecurring other income',status='COLUMN_QUALIFIED_NO_NORMALIZED_TOTAL',evidenceIds=['PROPERTY_GAIN_2024','INSURANCE_TERMINATION_2024','SUB_REVALUATION_EXPENSE_2025','RECOVERIES_2024','RECOVERIES_2025'],reason='Property gain497035million and insurance termination1808413million belong2024, not2025. FY2025revaluation expense3354million is distinct. FY2025property/termination dashes stay null. No automatic addback.'),dict(topic='Fee sustainability',status='PARTIAL',evidenceIds=['P26:FEE_NET:2025','N:2:72'],reason='Payments, securities and insurance lines have different cyclicality; no qualified recurring run-rate/margin.'),dict(topic='Tax/attribution',status='PARTIAL',evidenceIds=['REPORTED_BANK_TAX_RATE_2025','GROUP_PRETAX_2025','GROUP_CURRENT_TAX_2025','N:2:18'],reason='Reported20%bank tax is a fact, not every adjustment marginal tax. Entity attribution, deductibility, acquisition timing and parent incidence remain unresolved.'),dict(topic='Capital transactions',status='KEPT_OUTSIDE_EARNINGS',evidenceIds=['P26:PARENT_RETAINED_CAPITAL_TRANSACTION:2025'],reason='6244850million retained capital movement is not operating profit.'),dict(topic='Existing conditional normalization',status='NOT_PROMOTED',priorBinding=bind(V4),reason='V4uses tax0/commonIncidence1 as adverse incidence conventions, fullCycleQualified=false and acceptedNormalizedCommonEarnings=null. Do not copy its earnings envelope into sustainable ROE.' )],blockers=['Exhaustive recurring/nonrecurring and fee run-rate qualification','Entity-specific marginal tax/common attribution and full-year acquisition effects','Credit/property/funding cycle and loss-vintage calibration; normalized common ROE not proven'],productionAdmissible=False)
 write('normalized-earnings-register.json',earnings)
 write('evidence-register.json',dict(ticker='TCB',classification='RESEARCH_PROVISIONAL',facts=facts,narratives=narratives,reviewedPages=[dict(docIndex=d,page=p,reason=r) for d,p,r in [(5,65,'OCR row/capital reserve origin'),(12,60,'Other equity reclassification columns'),(2,74,'Other-income current/prior column ambiguity'),(2,68,'Reported bank tax vs marginal attribution'),(0,45,'Bank-core population by original/comparative year'),(0,70,'Bank customer loan charge versus margin and other reversals'),(12,41,'Core-loan comparable2023/2024')]],sourceIdentityReopened=False,retainedJsonFirst=True,publicationDatesInvented=False))
 # Explicit source-policy request; no collection or authority mutation.
 scope=dict(status='SOURCE_AUTHORITY_REQUIRED',purpose='Nominal VND ke calibration for approved retrospective FY2025TCB case only',automaticAcquisition=False,requests=[dict(id='KE-S1',proposedAuthority='Vietnam public sovereign-bond yield authority such as State Treasury/HNX bond market publication; proposed only, not claimed already approved',needed='Dated2025-12-31VND term structure/selected matched-duration yield; coupon/YTM/spot, tenor, observation time and any sovereign-default adjustment explicitly documented',cap='One dated yield record and its methodology',approval='PENDING'),dict(id='KE-S2',proposedAuthority='One named independently documented ERP/country-risk methodology/provider, selected explicitly by owner/source policy',needed='Dated ERP basis, country/default components, currency and nominal assumptions, method and uncertainty; historical versus retrospective availableAt explicit',cap='One dated input table and one methodology document',approval='PENDING'),dict(id='KE-S3',proposedAuthority='Already-authorized TCB price/action evidence only for issuer-specific risk estimation; any broader data authority requires separate approval',needed='Sufficient compatible total-return/action-adjusted series plus a justified banking exposure/risk adjustment; no other issuer processing here',cap='Evidence specification only; no download',approval='PENDING')],framework='ke_nominalVND = coherent risk-free nominal VND basis + systematic equity exposure×qualified equity premium + explicitly non-overlapping country/bank increments if not already embedded. Neither sovereign yield nor ERP is automatically default-free/risk-exclusive. A USD framework would need a qualified currency/inflation bridge, not addition to a VND yield.',inputs=dict(riskFree=None,equityPremium=None,systematicExposure=None,countryIncrement=None,bankIncrement=None,ke=None),doubleCountingControls=['Do not add country premium twice through VND sovereign/default basis and ERP','Do not add generic bank premium when beta/exposure already captures it','Do not replace discount rate with15%policyhurdle/12%floor','No arbitrary standalone risk add-on to compensate for missing evidence'])
 write('cost-of-equity-framework.json',scope)
 gates=dict(OWNER_CASE_CHOICES='APPROVED_D1_D6',COMMON_BOOK_READINESS='QUALIFIED',NORMALIZED_EARNINGS_READINESS='PARTIAL',SCENARIO_ASSUMPTION_READINESS='PARTIAL',PRICE_ACTION_COMPATIBILITY='BLOCKED',DRAFT_VALUATION_EXECUTION='NOT_AUTHORIZED_IN_THIS_STEP',FORMAL_M3_M4_PRODUCTION='NOT_AUTHORIZED')
 write('qualification-summary.json',dict(ticker='TCB',approvedBaseline=BASE,gates=gates,commonBookVnd=common['A_BOOK'],TCE=None,normalizedCommonEarnings=None,selectedPrice=None,numericalCreditSensitivityProposals=3,empiricalEconomicAxesSupported=1,issuanceRestrictionProposals=3,blockedScenarioCells=21,fullyReadyScenarios=0,formalM3Points=None,formalM3Total=None,ranking=None,M4Decision=None,draftValuation=None,approvedValuation=None,criticalIssues=0,majorIssueGroups=5,minorIssues=0,remainingOwnerDecisions=['No reapproval of D1–D6','Approve/amend/defer proposed limited credit anchors and no-issuance restrictions; no numerical economics currently approved','Approve/amend/defer exact KE source-authority scope before any new collection','Separate later valuation execution authorization only after economics, price/action and independent crosscheck qualify'],sourceAcquisition=False,otherIssuerProcessing=False,newRemediationRound=False))
 for p in [P26+'/manifest.json',OWNER+'/manifest.json','docs/fundamental-data-engine/VIETSTOCK_ONLY_SOURCE_POLICY.md','docs/fundamental-data-engine/governance/DATA_PIPELINE_REAPPROVAL_2026-10-31.md','api/tcbs-api-catalog.json','docs/fundamental-data-engine/TCBS_API_WEB_APP_REVIEW.md','docs/fundamental-data-engine/evidence/2026-10-28-m8-phase3-5-source-identity-qualification-planning/CORPORATE_ACTION_REQUIREMENTS.json']:
  PINS[p]=sha(ROOT/p)
 write('input-pins.json',PINS)
 reports(authorization,common,earnings,scenarios,price,scope,gates,facts)
 print(json.dumps(dict(status='PREPARED',ownerChoices='APPROVED_D1_D6',commonBook=common['A_BOOK'],creditAnchors={k:v[1] for k,v in selected.items()},blockedScenarioCells=21,valuationExecuted=False)))

def reports(auth,book,earnings,scenarios,price,ke,gates,facts):
 intro=f'''TCB only · recorded2026-11-09 · Asia/Ho_Chi_Minh. Approved research baseline `{RESEARCH}` and owner decision baseline `{BASE}` remain immutable. This is the newly authorized assumption-qualification package, **not P2.6 remediation round3**. D1–D6 are APPROVED; no numerical economic assumption is approved. No valuation is executed.\n'''
 def md(name,body):(OUT/name).write_text(body.strip()+'\n')
 dtable='| Decision | Exact approved choice | Conditions |\n|---|---|---|\n'+''.join(f"|{x['id']}|{x['approvedChoice']}|{' '.join(x['conditions'])}|\n" for x in auth['decisions'])
 md('TCB_OWNER_VALUATION_AUTHORIZATION.md',f'''# TCB owner valuation authorization

{intro}
Owner approval source: the explicit attached request “TCB Draft Valuation Assumption Qualification”, followed by “tiếp tục thực hiện”. The record captures the case `TCB-FY2025-RETROSPECTIVE`. Approval timestamp remains null because none was supplied; the record date is not a signature time. Original attachments are not copied as invented repository evidence; exact choices and source description are persisted in `owner-authorization.json`.

{dtable}

D4 explicitly approves **7,086,240,414 closing ordinary shares** for per-share value, conditional on a qualified issuer action/price bridge. Weighted-average shares remain EPS-only. D3 approves a conditional eligibility rule, **not the22789.00price or any other price**. No request to reapprove these settled case choices is made.

Numerical scenarios/discount assumptions remain PROPOSED/PENDING. New market-source authority is not granted by Option B or D3. No automatic financial-source acquisition, source-identity rediscovery, additional issuer processing, method/weight/dossier rewrite, points/rank/M4/NAV/ledger/portfolio write or production admission. No third remediation round or automatic subsequent execution. The P2.6 one historical draft/22blocked rubric baseline stays unchanged.
''')
 md('TCB_COMMON_EQUITY_BRIDGE.md',f'''# FY2025 TCB common equity bridge

{intro}
**COMMON_BOOK_READINESS: QUALIFIED**, limited to consolidated non-tangible parent-attributable ordinary accounting book for draft RI/justified P/B. This is a new evidence-supported interpretation in a separate package, not a rewrite of the prior A-BOOK=null decision record. No forecast or case approval is inferred.

| Bridge, native million VND | Value |
|---|---:|
| Group equity |179,501,442|
| Less separately reported NCI |9,456,938|
| Parent-attributable book |170,044,504|
| Parent share capital |70,862,404|
| Share premium |−124|
| Reserves |28,644,562|
| Retained earnings |62,773,576|
| Other-equity reserve |7,764,086|
| Sum of five parent components |170,044,504|

**A-BOOK=170,044,504,000,000VND at2025-12-31.** All components retain native million-VND precision; the result is not exact to one economic đồng beyond the rounded source presentation. Source: FY2025consolidated physical pp12,70–71; original P2.6 nodes retained in `evidence-register.json`.

The exact previously unresolved reserve is now traced using retained notes/images:

- FY2022p65: subsidiary transfer of reserves−233,838million and retained earnings−390,881million reallocates+68,722million to NCI and+555,997million to other equity. Their sum is zero at group level; do not create new earnings, assets or cash.
- FY2023p65 carries the555,997million reserve unchanged.
- FY2024searchable PDFp60: “Công ty con tăng vốn điều lệ từ nguồn vốn chủ sở hữu” shifts−8,242,064million retained earnings to+1,033,975million NCI and+7,208,089million other equity. Again group sum is zero.555,997+7,208,089=7,764,086million, carried unchanged in FY2025p70.
- FY2025p20 explains NCI profit/net-asset interests are separately presented; p71 identifies all reported parent issued shares as ordinary with equal residual priority. The reserve origin is a subsidiary equity reclassification/reallocation, not evidence of a preferred claim. Include the residual parent reserve in ordinary accounting book after separately excluding NCI. Do not deduct NCI again or discard other equity solely because its caption says “other”.

This supports a consistent **accounting common-book definition**, not a legal opinion, an unrestricted distribution certificate or TCE. Group intangibles5,779,202million remain at consolidated scope, and goodwill/common/NCI allocations and possible economic deductions are not bridged. **TCE stays null.** Regulatory capital is a separate scope and not the A-BOOK numerator. Closing ordinary shares7,086,240,414 are a qualified fact/owner-approved denominator choice; price/action compatibility remains blocked. No per-share intrinsic value is computed.

Confidence: HIGH for arithmetic/transcription, MEDIUM for the bounded accounting interpretation, insufficient for tangible/distributable/economic capital. Invalidate this qualification on a qualified source revision, additional priority claim or corrected ownership classification affecting the residual parent components. Numerical case approval remains PENDING; factual qualification is not owner approval of a valuation.
''')
 rates=earnings['historicalCreditCost'];rt='| Year | Bank-customer charge, million VND | Average bank-core loans, million VND | Reported ratio |\n|---|---:|---:|---:|\n'
 for y in [2023,2024,2025]:
  r=facts['CORE_CREDIT_COST_'+str(y)];frac=r['exactFraction'];rt+=f"|{y}|{text(D(frac['numerator'])/D('1000000'))}|{text(D(frac['denominator'])/D('1000000'))}|{r['value']}|\n"
 md('TCB_NORMALIZED_EARNINGS.md',f'''# TCB earnings normalization qualification

{intro}
**NORMALIZED_EARNINGS_READINESS: PARTIAL.** Reported ordinary EPS earnings25,254,851million =parent NPAT25,290,230million−welfare35,379million. The welfare deduction is already applied once. Direct retained-capital transaction6,244,850million is outside P&L. Normalized common earnings and sustainable ROE remain **null**.

Retained FY2022–FY2025 parent NPAT is20,150,377 /18,003,802 /21,522,928 /25,290,230million; the FY2024/FY2025common EPS numerators after welfare are21,486,928 /25,254,851million. Do not splice parent NPAT and post-welfare common earnings into one unlabelled growth series. Four reported periods are evidence of variation, not proof a full credit cycle was covered or all one-offs eliminated.

## Credit charge and population

{rt}

Core loans exclude securities margin/advances: FY2022comparative in FY2023=411,169,101million; FY2023current=502,022,401million, corroborated by FY2024comparative; FY2024current=605,813,718million, matching FY2025comparative; FY2025current=723,757,397million. No group-gross denominator is substituted. FY2023general679,579+specific3,529,151=4,208,730million; FY2024charge4,629,535million; FY2025charge4,475,370million. Margin/other-credit reversals are separate. The exposure-weighted three-year diagnostic is**{earnings['pooledCreditCost']}**. Rates retain exact fractions with12dp HALF_EVEN display and70-digit Decimal working precision. The FY2022loan opening anchor is a comparative, not a silent rewriting of an original vintage; no FY2022credit-cost rate is invented without the2021matched exposure/charge qualification.

## Recurring versus nonrecurring review

FY2025physical p74image resolves the interleaved notes: property sale income1,732,136million and cost1,235,101million, net497,035million, belong **FY2024**. The insurance partnership termination expense1,808,413million also belongs **FY2024**. They must not be added back/deducted from FY2025. FY2025subsidiary-investment revaluation expense3,354million is a separate candidate. FY2025property sale/termination cells are dashes and remain null, not numerical zeros. Recoveries1,138,200million in FY2024 and1,354,286million in FY2025 require collection expense/tax/attribution and loss-cycle consideration, not automatic removal.

Fee net8,771,995million is supported, but payments, securities-linked and insurance lines differ in recurrence, cost and cycle. FY2025notes p18 shows insurance control/stake changes and new life-insurance funding during the year: full-year comparable contribution and acquisition effects are not qualified. Do not analyze a separate subsidiary issuer or infer normalized margins from the consolidated fee total.

FY2025p68 reports bank tax20% and a group taxable-income bridge; this resolves the existence of a reported tax rate, **not the marginal tax benefit of each proposed adjustment**, legal deductibility or common-owner incidence. NCI/current ownership cannot be applied uniformly to every consolidated fee/provision line. Do not automatically apply20%, zero tax or100%parent incidence.

The retained `earnings-normalization-v4/issuers/TCB.json` is inspected, not promoted: its conditional incidence envelopes explicitly use tax0/commonIncidence1 and state full-cycle/exhaustive-one-off coverage=false and acceptedNormalizedCommonEarnings=null. Copying its22.6–25.2trillion conditional results into sustainable ROE would import unsupported economic assumptions. Sensitivity history is useful counterevidence; it is not a qualified complete earnings bound.

Unresolved: complete recurring/nonrecurring and acquisition contribution bridge; entity-specific marginal tax/common ownership; full-cycle default/severity/recovery and funding calibration. Even with a qualified accounting B0, one historical ROE cannot become sustainable ROE. Confidence is high for the reported bridge and arithmetic; low for a complete sustainable common-earnings range. No arbitrary range is proposed.
''')
 req='| Request | Needed evidence / bounded scope | Owner status |\n|---|---|---|\n'+''.join(f"|{r['id']}|{r['proposedAuthority']}; {r['needed']}; cap: {r['cap']}|PENDING|\n" for r in ke['requests'])
 md('TCB_COST_OF_EQUITY.md',f'''# Nominal VND cost of equity qualification

{intro}
**ke, risk-free rate, ERP, country increment and bank increment remain null.** No numerical risk premium is invented. The approved15%policy forward-return hurdle and12%exceptional floor do not select ke or establish its bounds.

Framework: `ke_nominalVND=coherent VND risk-free basis + systematic exposure×qualified ERP + only demonstrably non-overlapping country/bank increments`. Define whether the VND sovereign yield includes default/country components and whether ERP is mature-market or country-inclusive before combining. Do not add the same risk through sovereign yield, ERP, beta/exposure and an extra bank spread. A USD calibration cannot be appended to a VND risk-free input without a qualified currency/nominal-inflation bridge.

Match case-date and cash-flow duration; disclose coupon/YTM/spot choice, observation convention, retrieval time, methodology availability and whether retrospective FY2025 evidence was published later. D2permits retrospective research; it does not invent historical availability or numerical inputs. The existing retained TCB price/action series is unqualified for return-risk estimation, and no empirical beta is claimed. A banking risk narrative is not a numerical bank premium.

## Exact source-policy decision, no collection now

{req}

These are proposed authorities/classes and finite records, not claims of existing approval, current law, source URLs or actual retrieved data. Approve/amend/defer **KE-S1–S3** before any collection outside existing authority. Existing Vietstock-only financial-PDF rules are not a general permission for risk-premium/market-data acquisition, and no issuer/exchange financial-document fallback is authorized. Owner approval of D1–D6 will not be requested again.

Sensitivity after qualification: d(P/B)/dke=−(ROE−g)/(ke−g)^2. Require ke>0 and ke>g and report sensitivity near the denominator boundary. Confidence insufficient for numerical ke; production authority remains unchanged. Do not run the draft model to manufacture a discount-rate answer.
''')
 md('TCB_GROWTH_PAYOUT_CAPITAL.md',f'''# TCB growth, payout and capital consistency

{intro}
Sustainable common-book growth, payout, regulatory target/buffer and terminal economics remain null. Reported one-year core lending growth is not common-equity/terminal growth, and net equity issuance/subsidiary ownership events complicate book growth. Cash/stock distributions, reserve transfers, direct equity capital and operating earnings must stay separate.

FY2025parent distribution movement−7,086,240million is an equity statement fact, not proof of cash payment, recurring payout policy or funded future capacity. FY2025p71 leaves dividend decisions to AGM. Reserve allocations described in accounting notes are reported context, not an independently verified forward legal capital requirement. No new legal conclusion is made.

Reported CAR14.61%, Tier1ratio13.67%, total regulatory capital181,870billion and RWA1,244,531billion retain regulatory scope. The issuer-stated8%floor is historical reported context, not a selected future buffer or a stress certificate. Tier1 is not CET1; group accounting common book is not regulatory capital. Qualify current-case constraints, RWA mix/density/migration, common/regulatory bridge, internal target and loss/outflow response before approving growth or payout.

For each eventual constant-state case enforce **g=sustainable common ROE×(1−payout)**. Common book evolution must reconcile with earnings, distributions and other capital movements. Regulatory target capital must remain funded by eligible retained capital through the stress path; one book equation alone does not prove regulatory feasibility.

## Explicit proposed scenario restriction

For each of BEAR/BASE/BULL propose **newShares=0 and netNewCommonCash=0**, owner PENDING, solely as the boundary of a no-new-issuance constant-state modelling case. Historical closing shares support the starting denominator; they do not prove this future restriction true. Feasibility remains unproven until retained earnings, RWA/capital targets and payout/growth are qualified. This is not a forecast of no ESOP, rights issue or other capital action.

If capital needs require external equity, the existing constant-state kernel must reject nonzero issuance; do not ignore dilution or invent issue proceeds. A separately qualified post-issuance case would need terms, cash, share changes, common return and regulatory feasibility; no such model is implemented or run now. Do not use portfolio100+50pending as issuer-wide issuance terms or adjustment evidence.

Sensitivity: changes to payout require coherent changes to g and capital; loss and funding shocks can force reduced growth/distributions or dilution. Confidence high for historical capital facts, conditional for modelling restrictions, insufficient for numerical forward targets. No zero issuance assumption is automatically approved.
''')
 table='| Scenario | Credit-cost anchor (annual ratio) | Basis | Issuance restriction | Other7economics |\n|---|---:|---|---|---|\n'
 for s in scenarios:
  c=next(x for x in s['cells'] if x['axis']=='creditCost');table+=f"|{s['name']}|{c['value']}|{c['evidenceIds'][0]}|newShares0/netNewCommonCash0; PENDING|null / BLOCKED|\n"
 md('TCB_SCENARIO_ASSUMPTIONS.md',f'''# TCB bear/base/bull assumption qualification

{intro}
**SCENARIO_ASSUMPTION_READINESS: PARTIAL.** Every proposed cell has analyst status PROPOSED and owner status PENDING. No economic parameter is approved by the six case choices. No tax/incidence or ke default is introduced.

{table}

BEAR uses the highest observed same-population2023–2025reported bank-customer credit-charge rate; BASE uses total customer charges /total simple-average bank-core exposures, not a mean of ratios; BULL uses the lowest observed rate. These are three **limited historical credit-axis sensitivity proposals**, not certified sustainable loss rates, tail bounds or three qualified valuations. A3yearmaximum may understate property/funding stress; improvements may not persist. Changes in credit policy/regime and borrower vintage remain material counterevidence.

Each credit sensitivity must eventually operate on qualified future average core exposure, tax and common attribution: `ΔcommonEarnings=−ΔcreditCost×averageCoreLoans×(1−marginalTax)×commonIncidence`, with all currently unqualified operands left null. No normalized common earnings/ROE is calculated from these proposed inputs.

Count definitions are explicit: **27 scenario-axis cells** (9×3). **3 credit-cost numerical cells** are supported only for the limited sensitivity purpose. **3 capital-action restriction cells** each contain2explicit proposed zero parameters (6zeros total), justified as model design, not empirical forecasts. **21 economic cells remain null**, representing7unqualified axes per scenario: sustainable common ROE, ke, growth, payout, funding stress, capital requirements and terminal economics. Fully qualified scenarios=0. Accounting A-BOOK and historical shares are facts/prerequisites outside these27cells; they are not counted as forecast assumptions.

All cell-level evidence IDs, formula/rationale, confidence, sensitivities, downside and precise blockers are in `assumption-register.json`. Upper/lower mathematical domains are validation constraints, not evidence-supported economic ranges. The three calibrated credit values and the zero restrictions require explicit owner review; neither approval nor valuation execution is inferred. A complete bear/base/bull range remains unavailable.
''')
 md('TCB_PRICE_ACTION_COMPATIBILITY.md',f'''# Retained TCB price/action compatibility

{intro}
**PRICE_ACTION_COMPATIBILITY: BLOCKED; selectedPrice=null.** D3andD4are APPROVED conditional choices; the condition is not fulfilled merely by approval.

Existing retained candidate: `{HISTORY}` `/data/47`, close lexical**22789.00**, tradingDate**2025-12-31T00:00:00.000Z**. The daily date label matches the selected session; it is not a23:59:59transaction quote. Exact source bytes and pointer remain pinned, and raw floating numbers are read as Decimal without unit inference. No new quote or historical request was made.

The retained candidate does not declare native unit, adjusted/unadjusted mode, dividend/split methodology or action factors. The retained API catalog/review documents state historical adjustment/total-return corporate-action semantics remain unqualified. An adapter's display-price convention cannot certify this historical endpoint. No magnitude matching or implied1.5factor is evidence.

Audited annual shares explicitly reconcile FY2023closing3,522,510,811; FY2024closing7,064,851,739; FY2025closing7,086,240,414. Annual issues include3,542,340,928shares in FY2024and21,388,675in FY2025; the former is not automatically one pure2:1split. Annual totals do not establish each action's terms/ex-date or the provider's retrospective back-adjustment. A later capture can back-adjust earlier prices for postcutoff actions, so the complete relevant event window and factor basis must be qualified. Individual owner holdings are not an issuer action master.

Exact missing bridge: native price unit for the retained5.13capture; adjusted/unadjusted definition and cash-dividend/stock-dividend/split factors/event coverage; issuer-wide action identifiers/ex-dates/ratios/rounding tied to the same raw or adjusted share basis. Existing action-identity requirement records remain requirements, not event evidence. No source identity search is reopened. No new financial or market source is acquired.

The21600VND/shareOctober2026display reference cannot replace aFY2025price. No conversion, correction, carry-forward, market cap, MOS or return is computed. Owner need not reapprove D1–D6; this is an evidence dependency, not an unresolved case-date preference.
''')
 md('TCB_INDEPENDENT_CROSSCHECK.md',f'''# Economically independent TCB crosscheck

{intro}
**Not qualified.** A TCB-only own-history normalized-earnings/P-E calibration is a possible economically distinct check only if the compatible price/action series and normalized common earnings are qualified, and its calibration evidence is independent from the ROE/ke/g set driving RI. Neither prerequisite is currently complete. No peer issuer is processed or independent market multiple invented.

Residual income, justified P/B and Gordon/DDM with identical ROE/ke/g/common capital are algebraically related. Their numerical agreement would test arithmetic consistency, not provide independent economic corroboration. A relative P/B derived from that same ROE/ke/g is equally circular.

No RNAV/liquidation shortcut: group intangibles are not an allocated TCE deduction; unrestricted liquidity and collateral/property realizable values are unqualified. Accounting book alone is not independent evidence of intrinsic value. The newly qualified accounting bridge resolves a starting denominator, not this crosscheck.

Exact blockers: no matched raw/adjusted historical price/share/action series, no accepted recurring common earnings across comparable vintages and no independently justified own-history earnings capitalization interval. New external calibration would require explicit source authority, not relaxed M3 requirements. Confidence insufficient; crosscheck value=null. No valuation calculation or acceptance waiver is proposed.
''')
 gt='| Independent gate | Result |\n|---|---|\n'+''.join(f'|{k}|{v}|\n' for k,v in gates.items())
 md('TCB_ASSUMPTION_QUALIFICATION_FINAL_REVIEW.md',f'''# TCB assumption qualification final review

{intro}
{gt}

D1–D6are persisted exactly as **APPROVED_D1_D6** with issuer/case/conditions and owner source; approval time is null. No reapproval requested. Reported price approval remains absent by the expressly approved D3condition.

Material improvement: the entire7,764,086million other-equity balance is traced to FY2022andFY2024subsidiary equity reclassifications/reallocations. All parent issued shares are reported ordinary; the component bridge and separately excluded NCI support **170,044,504,000,000VND non-tangible ordinary accounting common book**. This does not qualify TCE or distributable capital, or approve an economic starting-value adjustment. Prior null records remain unchanged as dated history.

Three observed/pooled bank-core credit-cost anchors are proposed as limited historical sensitivities with exact population/period arithmetic; **3 numerical credit-cost cells**, not3qualified full scenarios. Three proposed no-issuance cells contain6explicit zeros as restrictions, not facts. **21/27economic scenario cells remain null;0full scenarios ready**. Sustainable common earnings and ROE remain unqualified despite the common-book improvement. FY2024property sale/insurance termination items are not applied toFY2025; reported20%bank tax is not silently used as adjustment incidence. Prior conditional earnings envelopes remain unaccepted.

**Draft TCB scenario valuation cannot proceed now:** execution is NOT_AUTHORIZED_IN_THIS_STEP, and normalized common economics, nominal VND ke/source policy, coherent growth/payout/capital/terminal, price/action compatibility and independent crosscheck remain incomplete. No intrinsic value, MOS, expected return, live recommendation, score, ranking or M4 decision is calculated.

Remaining owner decisions: approve/amend/defer limited credit-axis proposals and explicit no-issuance restrictions; approve/amend/defer KE-S1–S3source-policy scope before any external calibration. Do not reapprove D1–D6. New evidence/analyst qualification, not owner preference alone, must resolve missing economics and price semantics. Future valuation execution needs separate authorization after prerequisites; no automatic successor or closure phase.

Remaining issues: **Critical0 / Major5groups / Minor0**. AQ-M1normalized earnings/full-cycle common return; AQ-M2nominal VND ke and source authority; AQ-M3growth/payout/RWA/funding stress/capital/terminal; AQ-M4price/action semantics; AQ-M5independent crosscheck. These are substantive evidence/approval limitations, not assertions that new executable defects were found. The scoped common-book issue is resolved for accounting book; TCE remains outside that qualification. Full formal P2.6 investment readiness remains ANALYSIS_PARTIALLY_READY / ESCALATED.

Separate financial challenge and technical validation are required in this package; their receipts report exact results and limitations without claiming independent human acceptance or whole-release PASS. All prior M1–M4financial records, decisions, source bytes, weights and production/database/portfolio boundaries must remain unchanged.

**STOP — await owner review. No scenario valuation executed, no third remediation round, no production activation.**
''')

if __name__=='__main__':build()
