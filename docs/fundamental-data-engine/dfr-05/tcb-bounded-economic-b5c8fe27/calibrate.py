"""One TCB research overlay. Never imports valuation/scoring/runtime engines."""
import json,hashlib,subprocess,datetime,copy
from pathlib import Path
from decimal import Decimal,localcontext,ROUND_HALF_EVEN
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
BASE='b5c8fe27ce9fb2f8786b603463176f6d5437c6f1'
PRIOR='docs/fundamental-data-engine/dfr-05/tcb-assumption-qualification-4a205261'
P26='docs/fundamental-data-engine/dfr-05/p2-6-tcb-78d7069d';OWNER='docs/fundamental-data-engine/dfr-05/p2-6-owner-escalation-969e36ab'
NOTES='data/manual-extracted-pdf/notes/TCB.json';HISTORY='data/market-source/tcbs/2026-10-29T01-48-59.704Z-unified/5.13-TCB-history.raw.json'
D=Decimal;PINS={}
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def digest(x):return hashlib.sha256(json.dumps(x,sort_keys=True,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode()).hexdigest()
def read(path):PINS[path]=sha(ROOT/path);return json.loads((ROOT/path).read_text())
def pointer(x,p):
 for k in p.split('/')[1:]:x=x[int(k)] if isinstance(x,list) else x[k.replace('~1','/').replace('~0','~')]
 return x

def bind(path,ptr=''):return dict(path=path,sha256=sha(ROOT/path),jsonPointer=ptr,objectHash=digest(pointer(read(path),ptr)))
def write(name,x):(OUT/name).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def text(x):return format(x,'f')
def ratio(a,b):
 with localcontext() as c:c.prec=70;return text((a/b).quantize(D('0.000000000001'),rounding=ROUND_HALF_EVEN))
class Tables(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.row=None;self.cell=None
 def handle_starttag(self,t,attrs):
  if t=='tr':self.row=[]
  if t in ('td','th'):self.cell=[]
 def handle_data(self,d):
  if self.cell is not None:self.cell.append(d)
 def handle_endtag(self,t):
  if t in ('td','th') and self.row is not None and self.cell is not None:self.row.append(' '.join(''.join(self.cell).split()));self.cell=None
  if t=='tr' and self.row is not None:self.rows.append(self.row);self.row=None

def build():
 head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();assert head==BASE
 acquisition=json.loads((OUT/'source-acquisition.json').read_text());oldauth=read(PRIOR+'/owner-authorization.json');oldass=read(PRIOR+'/assumption-register.json');oldfacts=read(PRIOR+'/evidence-register.json');oldprice=read(PRIOR+'/price-action-register.json')
 auth=copy.deepcopy(oldauth);auth.update(schema='tcb-bounded-economic-authorization-v1',recordDate='2026-11-09',researchBaseline=BASE,approvalSource='Owner attachment: DFR-05 — TCB Bounded Economic Evidence & Assumption Calibration',approvalEvidence=dict(path='owner-request.txt',sha256=sha(OUT/'owner-request.txt')),ownerApprovalAt=None,scopeApproval='APPROVED_SCOPE',boundedCycleCount=1,newRemediationRound=False,sourceIdentityRediscovery=False,valuationExecutionAuthorized=False)
 for row in auth['decisions']:row['approvalSource']=auth['approvalSource'];row['status']='APPROVED';row['ownerApprovalAt']=None
 auth['conditionalAssumptions']=[dict(id='CREDIT:'+name,status='APPROVED_CONDITIONAL_ASSUMPTION',value=value,unit='ANNUAL_RATIO',conditions=['Historical sensitivity only','Not full-cycle expected loss or a tail bound','Not a complete scenario forecast'],ownerApprovalAt=None) for name,value in [('BEAR','0.009217628484'),('BASE','0.007947018458'),('BULL','0.006732050583')]]+[dict(id='ISSUANCE:'+name,status='APPROVED_CONDITIONAL_ASSUMPTION',value=dict(newShares='0',netNewCommonCash='0'),conditions=['Constant-state modelling restriction, not a factual prediction','Capital feasibility must be demonstrated before scenario qualification'],ownerApprovalAt=None) for name in ['BEAR','BASE','BULL']]
 auth['sourceAuthority']=[dict(id='KE-S1',status='APPROVED_SCOPE',limit='One dated Vietnam sovereign-bond yield observation and methodology; nominalVND,tenor,convention,observation time required',selectedProvider='HNX',conditions='Source identity/publication/native unit/method/case-date compatibility; no risk-free or ke number approved'),dict(id='KE-S2',status='APPROVED_SCOPE',limit='One named ERP provider; one dated table and one methodology document',selectedProvider='Aswath Damodaran/NYU Stern',conditions='Market/country/default/nominal-currency compatibility; no selected numerical ke approved'),dict(id='KE-S3',status='APPROVED_SCOPE',limit='Retained TCB price/action evidence only; no broader series or peer acquisition',selectedProvider='Retained TCBS TCB artifacts',conditions='No beta fabrication; broader acquisition remains unauthorized')]
 auth['scope']='One bounded TCB economic-evidence and calibration cycle; no valuation or third remediation round'
 auth['approvedBaselines']=['969e36ab241a61f31d89d4371e83ece977db3458','4a2052611cc37002ad0ba7d15a15b8a8c03a3ebf',BASE]
 auth['externalSourceAcquisitionAuthorized']='KE-S1/S2bounded objects only;KE-S3retained only'
 auth['numericalEconomicAssumptionsApproved']=dict(conditionalCreditAnchors=3,conditionalNoIssuanceCases=3,newKeOrOtherFullEconomicEstimates=False)
 auth['numericalKeApproved']=False;write('owner-decision-register.json',auth)
 # Read the one complete table; incomplete bodies are never qualified.
 table_rec=next(r for r in acquisition['records'] if r['id']=='damodaran-jan2026-table');assert table_rec['outcome']=='CAPTURED_NOT_YET_QUALIFIED'
 raw=(OUT/table_rec['path']).read_text();parser=Tables();parser.feed(raw)
 rowindex,row=next((i,r) for i,r in enumerate(parser.rows) if r and r[0]=='Vietnam');assert row[:5]==['Vietnam','Ba2','2.56%','3.90%','8.13%']
 later_revision=any('updated February 2026' in c for r in parser.rows for c in r)
 table=dict(id='ERP-VIETNAM-PROVIDER-ROW',classification='QUALIFIED_EVIDENCE',qualificationScope='Exact currently retrieved provider-reported row only; NOT a frozen FY2025case input',provider='Aswath Damodaran/NYU Stern',sourceUrl=table_rec['url'],path=table_rec['path'],sha256=table_rec['sha256'],retrievedAt=table_rec['retrievedAt'],publishedAt=None,lastUpdatedLabel='January 5, 2026',publicationDateStatus='VISIBLE_UPDATE_LABEL_NOT_PROVEN_FIRST_PUBLICATION_TIMESTAMP',observationAt=None,selectedForFY2025=False,countryRowRevisionAt=None,mixedVintagePage=later_revision,reason='Live page has a later-country February2026revision under a January2026heading; no proof of Vietnam-row as-of date or immutable January snapshot. D2allows retrospective use, not silent unknown-vintage substitution.',tableRowIndex=rowindex,columnHeaders=parser.rows[5][:5],rawCells=row[:5],rating=row[1],nativeUnit='PERCENT_DISPLAY',unit='RATIO_REFERENCE',currencyContext='US_DOLLAR_IMPLIED_RETURN_FRAMEWORK_IN_HTML_INTRO;not automatically nominalVND',yieldFrequencyQualification='ERPintro describes annual expected return; default-spread compounding not separately qualified',values=dict(adjustedDefaultSpread='0.0256',countryRiskPremium='0.0390',totalEquityRiskPremium='0.0813'),selectionStatus='BLOCKED_CASE_VINTAGE_AND_CURRENCY_RISK_EXPOSURE')
 with localcontext() as c:c.prec=70;mature=D(table['values']['totalEquityRiskPremium'])-D(table['values']['countryRiskPremium'])
 table['derivedMatureERP']=dict(value=text(mature),formula='totalEquityRiskPremium−countryRiskPremium',status='PROVIDER_ROW_IDENTITY_REFERENCE_ONLY',notIndependentObservation=True)
 # A document update date is not silently a data observation date or publication time.
 s1=next(r for r in acquisition['records'] if r['sourceClass']=='KE-S1');method=next(r for r in acquisition['records'] if r['id']=='damodaran-countryrisk-method')
 dispositions=dict(cycleCount=1,searchClosed=True,alternativeProvidersUsed=False,KE_S1=dict(status='BLOCKED',selectedRiskFree=None,selectedSovereignYield=None,sourceAttempt=s1,observationDate=None,tenor=None,currency=None,yieldConvention=None,publishedAt=None,missing='TLS-authenticated exact2025-12-31HNXyield record, nominal VND/tenor/yield convention/observation timestamp and methodology. Indexed monthly auction commentary is not that record.',searchLeadOnly=dict(url=s1['url'],description='December2025monthly market article; not qualified exact-date yield evidence',publishedTimeHint='09/01/2026 17:27 from search rendering only, not verified source bytes',notSelected=True)),KE_S2=dict(status='PARTIAL_PROVIDER_REFERENCE_ONLY',inputTable=table,methodDocument=dict(status='INCOMPLETE_TRANSFER_NOT_QUALIFIED',sourceUrl=method['url'],headerPath=method['headerPath'],httpStatus=method['httpStatus'],curlExitCode=method['curlExitCode'],retrievedAt=method['retrievedAt'],partialContentHash=method['sha256'],partialBytesNotOriginalPdfHash=True,publishedAt=None,methodologyVersionAt=None,selected=False),capturedInlineMethodContext='Complete HTMLintro explains default-spread/CRP/ERP construction; it does not fulfill the missing complete selected methodology-document/currency-case qualification.'),KE_S3=dict(status='BLOCKED',selectedBeta=None,selectedBankRiskPremium=None,newAcquisition=False,reason='Retained22789.00price has undeclared units/action adjustment and no qualified compatible total-return exposure/market calibration contract; no beta=1default or extra bank premium.'))
 partial=OUT/(method['path'] or 'sources/absent')
 cleanup=OUT/'source-fragment-removal.json'
 if partial.exists():
  tomb=dict(path=method['path'],removedBytes=partial.stat().st_size,partialSha256=sha(partial),reason='Timed-out partial PDF is not a source document; removed per intermediate/partial cleanup policy. Acquisition receipt records the failed attempt, not an extant original PDF.',originalPdfSha256=None);partial.unlink();write('source-fragment-removal.json',tomb)
 else:assert cleanup.exists()
 write('source-qualification.json',dispositions)
 # Reuse qualified retained TCB operands; retain exact provenance and scope.
 facts={};financial=read(P26+'/evidence-ledger.json')['financials']
 def old(k):
  x=financial[k];facts[k]=dict(id=k,ticker='TCB',classification='QUALIFIED_EVIDENCE',kind='RETAINED_REPORTED_OR_DERIVED_FINANCIAL',value=x['value'],unit=x['unit'],scope=x['scope'],year=x.get('year'),status=x['status'],binding=bind(P26+'/evidence-ledger.json','/financials/'+k),productionAdmissible=False);return D(x['value'])
 for k in ['REGULATORY_CAPITAL:2025','TOTAL_RWA:2025','TIER1_RATIO:2025','REPORTED_CAR:2025','REPORTED_MIN_CAR:2025','BANK_CORE_LOANS:2024','BANK_CORE_LOANS:2025','CUSTOMER_PROVISION_FLOW:2025','COMMON_EPS_NUMERATOR:2025','NII:2024','NII:2025','FEE_NET:2024','FEE_NET:2025','DEPOSIT_INTEREST_EXPENSE:2024','DEPOSIT_INTEREST_EXPENSE:2025','INSTRUMENT_INTEREST_EXPENSE:2024','INSTRUMENT_INTEREST_EXPENSE:2025','PARENT_DIVIDEND_MOVEMENT:2025','PARENT_RETAINED_CAPITAL_TRANSACTION:2025']:
  old(k)
 notes=read(NOTES);regdoc=notes['documents'][8];pdf=regdoc['pdfPaths'][0];PINS[pdf]=sha(ROOT/pdf);assert PINS[pdf]==regdoc['sourceHash']
 # Same already-qualified regulatory filing, not a new-source identity qualification.
 for id,native in [('REG_CAPITAL_H1_2025','165500'),('RWA_H1_2025','1105897')]:
  page=5 if id.startswith('REG_CAPITAL') else 6
  facts[id]=dict(id=id,ticker='TCB',classification='QUALIFIED_EVIDENCE',kind='NEWLY_BOUND_RETAINED_HISTORICAL_READING',value=text(D(native)*D('1000000000')),nativeValue=native,nativeUnit='BILLION_VND',multiplier='1000000000',unit='VND',scope='REGULATORY_CONSOLIDATED',periodEnd='2025-06-30',sourceCohort='FY2025REGULATORY_REPORT_H1_COMPARATIVE',column='30/06/2025 Hợp nhất',source=dict(path=pdf,sha256=PINS[pdf],physicalPage=page),notesBinding=bind(NOTES,f'/documents/8/pages/{page-1}'),confidence='HIGH_FOR_CLEAR_RETAINED_TABLE;not forward capital feasibility',productionAdmissible=False)
 for id,closing,opening in [('REG_CAPITAL_H2_GROWTH','REGULATORY_CAPITAL:2025','REG_CAPITAL_H1_2025'),('RWA_H2_GROWTH','TOTAL_RWA:2025','RWA_H1_2025')]:
  a,b=D(facts[closing]['value']),D(facts[opening]['value']);facts[id]=dict(id=id,ticker='TCB',classification='QUALIFIED_EVIDENCE',kind='NEW_DERIVED_HISTORICAL_DIAGNOSTIC',value=ratio(a-b,b),unit='RATIO_SIX_MONTH_CHANGE_NOT_ANNUALIZED',scope='REGULATORY_CONSOLIDATED',periodStart='2025-06-30',periodEnd='2025-12-31',formula='(closing−opening)/opening',operandIds=[closing,opening],exactFraction=dict(numerator=text(a-b),denominator=text(b)),confidence='HIGH_ARITHMETIC;not forecast',productionAdmissible=False)
 estimates=[];avg=(D(facts['BANK_CORE_LOANS:2024']['value'])+D(facts['BANK_CORE_LOANS:2025']['value']))/2;actual=D(facts['CUSTOMER_PROVISION_FLOW:2025']['value'])
 for scenario,rate in [('BEAR','0.009217628484'),('BASE','0.007947018458'),('BULL','0.006732050583')]:
  with localcontext() as c:c.prec=70;hypo=D(rate)*avg;delta=hypo-actual
  estimates.append(dict(id='CREDIT_EXPENSE_SENSITIVITY:'+scenario,ticker='TCB',classification='PROPOSED_ECONOMIC_ESTIMATE' if scenario!='BULL' else 'REFERENCE_ONLY_ROUNDING_RESIDUE',scenario=scenario,rate=rate,rateApprovalStatus='APPROVED_CONDITIONAL_ASSUMPTION',ownerDecisionPointer='/conditionalAssumptions/'+str(['BEAR','BASE','BULL'].index(scenario)),approvalEvidencePath='owner-decision-register.json',fixedExposure=text(avg),exposurePeriod='Simple average FY2024/FY2025closing bank-core loans; fixed historical scale, not future loan forecast',value=text(delta),unit='VND_PRETAX_ADDITIONAL_PROVISION_EXPENSE',hypotheticalCharge=text(hypo),actualCharge=text(actual),formula='approvedAnchor×qualifiedFY2025averageCoreLoans−reportedFY2025bankCustomerCharge',evidenceIds=['BANK_CORE_LOANS:2024','BANK_CORE_LOANS:2025','CUSTOMER_PROVISION_FLOW:2025'],analystStatus='PROPOSED' if scenario!='BULL' else 'ROUNDING_DIAGNOSTIC_ONLY',ownerStatus='PENDING_NUMERICAL_APPROVAL' if scenario!='BULL' else 'NOT_A_NEW_ECONOMIC_ASSUMPTION',marginalTax=None,commonIncidence=None,netCommonEarningsDelta=None,sustainableEarnings=None,confidence='HIGH_MECHANICAL;LOW_FULL_EARNINGS_NORMALIZATION',sensitivity='Linear in the fixed exposure and credit rate; tax/common attribution and expense recurrence remain unqualified.',downside='Observed historical rate need not cover correlated loss severity; no complete downside or future sustainable earnings bound.',precision='Exact arithmetic on approved12dp anchor and rounded native source values; output precision is not additional source accuracy.',productionAdmissible=False))
 write('credit-sensitivity-estimates.json',dict(items=estimates,newEconomicEstimates=2,roundingReferences=1,normalizedCommonEarnings=None,sustainableCommonRoe=None,valuationExecuted=False))
 assumptions=copy.deepcopy(oldass)
 for s in assumptions['scenarios']:
  for c in s['cells']:
   if c['axis'] in ['creditCost','issuanceDilution']:
    c['ownerStatus']='APPROVED_CONDITIONAL_ASSUMPTION';c['approvalSource']='owner-request.txt';c['conditions']=auth['conditionalAssumptions'][(['BEAR','BASE','BULL'].index(s['name']))+(0 if c['axis']=='creditCost' else 3)]['conditions']
   else:c['ownerStatus']='PENDING_NUMERICAL_APPROVAL';assert c['value'] is None
  s['capitalFeasibility']='BLOCKED';s['draftEquityValue']=None;s['draftPerShareValue']=None
 assumptions.update(schema='tcb-bounded-economic-assumptions-v1',approvalScopeUpdated=True,newIndependentScenarioAssumptions=0,approvedConditionalCells=6,pendingNumericalCells=21,completeScenarios=0,costOfEquity=None,selectedPrice=None,normalizedCommonEarnings=None,sustainableCommonRoe=None,valuationExecution='NOT_AUTHORIZED',formalM3Points=None,formalM3Total=None,ranking=None,M4Decision=None)
 assumptions['numericalEconomicAssumptionsApproved']=dict(fullNewEconomicEstimates=0,conditionalCreditSensitivityCells=3,conditionalIssuanceRestrictionCells=3)
 write('assumption-register.json',assumptions)
 price=copy.deepcopy(oldprice);price.update(KE_S3Status='RETAINED_ONLY_NO_BETA_CALIBRATION',newProviderDocumentationAcquired=False,issuerSpecificBeta=None,rawDateLabelVerified=True,investigationResult='Original raw object contains price/volume/date fields but no native unit, action factors, ex-date/event IDs or dividend/split convention. Annual issuer aggregate share movements cannot supply the historical adjustment bridge. Existing approved capture/review never qualified total-return compatibility.')
 rawprice=json.loads((ROOT/HISTORY).read_text(),parse_float=D,parse_int=D);PINS[HISTORY]=sha(ROOT/HISTORY);assert rawprice['data'][47]['tradingDate'].startswith('2025-12-31') and rawprice['data'][47]['close']==D('22789.00')
 price['rawCandidate']['originalRawObjectKeys']=list(rawprice['data'][47]);write('price-action-register.json',price)
 feasibility=dict(status='BLOCKED',restrictionStatus='APPROVED_CONDITIONAL_ASSUMPTION',newShares='0',netNewCommonCash='0',caseTargetCAR=None,managementBuffer=None,sustainableCommonROE=None,payout=None,g=None,gRWA=None,eligibleRetention=None,stressLoss=None,capitalFeasible=None,reportedRegCapital=facts['REGULATORY_CAPITAL:2025'],reportedRWA=facts['TOTAL_RWA:2025'],H2CapitalGrowth=facts['REG_CAPITAL_H2_GROWTH'],H2RWAGrowth=facts['RWA_H2_GROWTH'],constraints=['g=ROE*(1-payout)','Creg1=Creg0+eligible retained common earnings−regulatory losses/deductions+only qualified other eligible capital movements','Creg1 / RWA1 >= approved case target; RWA1=RWA0*(1+gRWA)','No-new-parent-issuance restriction is not a promise of subsidiary/NCI/Tier2capital flows or unconstrained liquidity'],blockers=['Eligible common-retention to regulatory-capital conversion and deduction bridge','Approved economically justified target/buffer and forward RWA risk mix','Credit/funding loss/outflow and payout/growth/terminal path'],historicalFloorNotForwardTarget=True,Tier1NotCET1=True,productionAdmissible=False)
 write('capital-feasibility-register.json',feasibility)
 economic=dict(status='BLOCKED',nominalVndKe=None,riskFree=None,beta=None,bankSpecificSpread=None,countryExposure=None,providerReference=table,framework='ke_VND=qualified default-free nominalVND base + justified systematic exposure×mature ERP + separately justified country exposure×CRP. Use the total country ERP only within a consistent alternative formulation, never add its CRP again.',doubleCountingControls=['Do not use nominal sovereign yield as default-free without a qualified sovereign-default treatment','Do not subtract a USD/rating default spread from VND yield without demonstrated comparability','Do not add provider CRP to provider total ERP: total already includes country component','No default beta1, no default country exposure1, no generic bank add-on','No mixing USD implied ERP calibration and nominalVND cash flows without the documented currency/nominal/default framework','No policy15%/12% hurdle as ke'],proposedKeRange=None,ownerKeApproval='PENDING_NUMERICAL_APPROVAL',conditions=['Exact HNXobservation/methodology unavailable','Selected complete methodology document unavailable','Immutable/current Vietnamrow vintage and case-date compatibility unresolved','Qualified issuer-specific risk exposure/price actions unavailable'])
 write('cost-of-equity-calibration.json',economic)
 cross=dict(status='BLOCKED',methodCandidate='TCB own-history normalized common earnings capitalization only with independent calibration',priceSeriesQualified=False,normalizedCommonEarningsQualified=False,independentCapitalizationRange=None,algebraicEquivalenceNotIndependence=True,peerIssuersProcessed=False,intrinsicValue=None)
 write('crosscheck-register.json',cross)
 summary=dict(baselineCommit=BASE,implementationCommit=None,implementationState='UNCOMMITTED',issuer='TCB',cycleCount=1,newQualifiedHistoricalEconomicInputs=4,newInputIds=['REG_CAPITAL_H1_2025','RWA_H1_2025','REG_CAPITAL_H2_GROWTH','RWA_H2_GROWTH'],providerReportedReferenceComponents=4,newQualifiedForwardKeInputs=0,newIndependentNumericalScenarioAssumptions=0,newProposedNumericalCreditExpenseEstimates=2,approvedConditionalCells=6,remainingBlockedNumericalScenarioCells=21,completeBearBaseBullScenarios=0,nominalVndKeReadiness='BLOCKED',priceActionCompatibility='BLOCKED',normalizedCommonEarningsReadiness='PARTIAL_NORMALIZATION_NOT_QUALIFIED',sustainableRoeReadiness='BLOCKED',capitalFeasibility='BLOCKED',independentCrosscheck='BLOCKED',commonAccountingBook='QUALIFIED_RETAINED_BASELINE',formalM3Points=None,formalM3Total=None,ranking=None,M4Decision=None,intrinsicValue=None,nextStepMayRequestDraftValuationAuthorization=False,criticalIssues=0,majorIssueGroups=5,minorIssues=0,result='BLOCKED_WITH_EXACT_DEPENDENCIES')
 write('summary.json',summary)
 write('evidence-register.json',dict(ticker='TCB',classification='RESEARCH_PROVISIONAL',financials=facts,providerEvidence=table,sourceAcquisitionReceipt='source-acquisition.json',newFinancialSourceAcquisition=False,newIssuerProcessing=False,sourceIdentityRediscovery=False,caseAsKnown=False,allDatesRetrospective=True))
 for path in [PRIOR+'/manifest.json',OWNER+'/manifest.json',P26+'/manifest.json',PRIOR+'/normalized-earnings-register.json',PRIOR+'/common-equity-bridge.json','docs/fundamental-data-engine/VIETSTOCK_ONLY_SOURCE_POLICY.md','api/tcbs-api-catalog.json','docs/fundamental-data-engine/TCBS_API_WEB_APP_REVIEW.md']:PINS[path]=sha(ROOT/path)
 write('input-pins.json',PINS)
 reports(auth,dispositions,economic,estimates,facts,feasibility,summary)
 print(json.dumps(dict(status='PREPARED',result=summary['result'],newHistoricalInputs=4,newCreditExpenseEstimates=2,completeScenarios=0,valuationExecuted=False)))

def reports(auth,sources,ke,estimates,facts,capital,summary):
 intro=f'''TCB only. Recorded2026-11-09, Asia/Ho_Chi_Minh. Execution baseline `{BASE}`. Exactly one bounded economic-evidence cycle; no P2.6remediation round3, no valuation execution. Approved source/assumption scope is distinct from qualified evidence, proposed economics and formal investment authority.\n'''
 def md(name,body):
  for a,b in {'Recorded2026':'Recorded 2026','P2.6remediation round3':'P2.6 remediation round 3','D1–D6remain':'D1–D6 remain','D3andD4are':'D3 and D4 are','newShares0/netNewCommonCash0':'newShares = 0 / netNewCommonCash = 0','21numerical':'21 numerical','0complete':'0 complete','6conditionally':'6 conditionally','27scenario':'27 scenario','H1regulatory':'H1 regulatory','H1RWA':'H1 RWA','H2capital':'H2 capital','H2RWA':'H2 RWA','FY2025average':'FY2025 average','FY2025bank':'FY2025 bank','FY2024andFY2025':'FY2024 and FY2025','D2permits':'D2 permits','KE-S3is':'KE-S3 is','14.61%is':'14.61% is','13.67%is':'13.67% is'}.items():body=body.replace(a,b)
  (OUT/name).write_text(body.strip()+'\n')
 md('TCB_BOUNDED_RESEARCH_AUTHORIZATION.md',f'''# Bounded TCB research authorization

{intro}
Approved baselines: P2.6Research969e36ab241a61f31d89d4371e83ece977db3458; owner decision4a2052611cc37002ad0ba7d15a15b8a8c03a3ebf; assumption qualification `{BASE}`. Owner approval source is the attached request, preserved byte-for-byte in `owner-request.txt` with SHA256. No approval timestamp was supplied: ownerApprovalAt=null. Retrieval/record dates are not approval timestamps.

D1–D6remain APPROVED:2025-12-31T23:59:59+07:00, Asia/Ho_Chi_Minh; RETROSPECTIVE_FY2025_AUDITED_RESEARCH, not AS_KNOWN; retained TCBS exact-date price only if unit/adjustment qualified, no price approved;7,086,240,414closing ordinary shares conditional on corporate-action compatibility, weighted shares EPS-only; null/block missing data; research-provisional only. These decisions are persisted without asking again.

| Status | Authorized interpretation |
|---|---|
| APPROVED_SCOPE | KE-S1one dated HNXsovereign-yield record/method; KE-S2one named NYU/Damodaran table and one methodology document; KE-S3retained TCBprice/action only. |
| APPROVED_CONDITIONAL_ASSUMPTION | BEAR/BASE/BULLcredit anchors0.009217628484 /0.007947018458 /0.006732050583, historical sensitivities only; not full-cycle loss/tail/forecast bounds. |
| APPROVED_CONDITIONAL_ASSUMPTION | newShares0/netNewCommonCash0 in each constant-state case; modelling restrictions only, capital feasibility still required. |
| QUALIFIED_EVIDENCE | Clear retained-source historical facts/diagnostics; captured provider row qualified only as retrieved reference, not a frozen FY2025input. |
| PROPOSED_ECONOMIC_ESTIMATE | New fixed-exposure pretax credit-expense sensitivities, not common-owner earnings or valuation. |
| PENDING_NUMERICAL_APPROVAL | New economic estimates, ke and all other full forward assumptions. Scope approval is not numerical approval. |
| BLOCKED | Unqualified yield/default/currency/exposure, price/actions, common normalization, capital/stress and independent crosscheck. |

No peer acquisition, financial-report acquisition, source authority mutation, immutable dossier edit, method/weight change, formal score/rank/M4/NAV/ledger/portfolio write or production activation. No technical-adapter retry can certify financial semantics. The bounded source attempts are closed: failures/incompatibilities are recorded, with no alternate-provider search or automatic successor phase.
''')
 md('TCB_COST_OF_EQUITY_CALIBRATION.md',f'''# Nominal VND cost-of-equity calibration

{intro}
**ke readiness BLOCKED; selectedRiskFree, beta, bank premium and ke range remain null.** New authority is persisted as approved scope, not re-requested.

## KE-S1 outcome

Selected authoritative publisher: HNX. [Exact attempted HNXrecord](https://portal.hnx.vn/vi-vn/chi-tiet-tin-60022163-0.html). The authenticated fetch failed hostname certificate validation; web reads also failed. TLS verification was not bypassed, and no replacement provider was acquired. Source original body/content hash, observation date/time, tenor, native unit, currency and yield convention cannot be qualified. `source-acquisition.json` retains actual URL, receipt times, exit/error and header outcome.

The indexed lead concerns December2025monthly auction commentary. Even if delivered, a last-month auction rate is not proof of the2025-12-31secondary-market/default-free nominalVNDyield, tenor convention or observation timestamp. It was not selected, and no search result rate enters the model. Exact remaining evidence: an authenticated HNXcase-date yield observation and its spot/YTM/coupon/day-count methodology, with nominal currency/default treatment and dated publication/observation provenance. Scope already allows this class; the problem is delivery and economic compatibility, not owner reapproval.

## KE-S2 outcome

[NYU/Damodaran input table](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/ctryprem.html) was captured fully. Vietnam row reports ratingBa2, adjusted default spread2.56%, country risk premium3.90%and total equity premium8.13%; the arithmetic residual mature premium is4.23%. These are provider estimates/reference components, not selected ke inputs. Percent labels and exact strings/hashes are retained. The webpage says January5,2026but also contains a later-country February2026update: that is evidence of a mutable/mixed-vintage page, not proof of the Vietnam row's exact as-of date. The HTTP response has no usable first-publication timestamp. Last-updated label, row observation date and retrieval time remain distinct.

[Selected methodology PDF](https://pages.stern.nyu.edu/~adamodar/pdfiles/blog/CountryRisk2025.pdf) timed out after a partial transfer; its fragments were removed. The partial hash is not a complete PDFhash, and no methodology page was extracted or qualified from it. Complete inline HTMLcontext is retained but not substituted as an independently completed selected methodology document. No second dataset/provider/method file was collected.

D2permits retrospective analysis using later-published evidence; it does not silently establish an unknown data vintage as the balance-date observation. Thus four provider components are reference evidence only; **zero new complete forward ke inputs** are qualified. No currency conversion or default-risk adjustment is invented.

## Transparent framework and anti-double-counting gate

Use one consistent formulation: qualified default-free nominalVNDbase plus justified systematic exposure to mature-market ERP plus separately justified country exposure to CRP. A total country ERPalready contains its CRP; do not add it again. Do not presume sovereign yield default-free or subtract a rating/USDdefault spread without comparability. Do not default beta or country exposure to1, add an arbitrary bank spread or use15%/12%policy hurdles as ke. No equation is evaluated numerically.

KE-S3is retained-only. The unqualified price/action series cannot estimate a defensible issuer-specific beta; no peers or broader market series were acquired. Exact ke blockers are authenticated risk-free basis, immutable compatible provider vintage/completed methodology, consistent sovereign-default/currency treatment and justified TCBsystematic/country risk exposure. Sensitivity remains d(P/B)/dke=−(ROE−g)/(ke−g)^2 after qualification; no P/Bor intrinsic value is calculated now.
''')
 md('TCB_PRICE_ACTION_EVIDENCE.md',f'''# Retained TCB historical price/action evidence

{intro}
**BLOCKED; selectedPrice=null; issuerSpecificBeta=null.** Original raw retained source `{HISTORY}`, exact `/data/47/close`, lexical22789.00, daily tradingDate2025-12-31T00:00:00.000Z, source hash1a53d00d5405a9d12ac028670605980c6c421255294a66827762d501be1bed63. Raw reads use Decimal. Date label matches the approved session, not an intraday execution quote.

The target raw object provides OHLCV/date but no declared native price unit, raw/adjusted mode, cash-/stock-dividend factors, split/issuance adjustments, event IDs or ex/effective dates. The retained APIcatalog/review previously left adjustment/total-return compatibility unqualified. Current display-price units cannot certify this historical endpoint. No fresh TCBSrequest or documentation acquisition was made.

Qualified annual shares establish a balance-date total, not the provider's historical adjustment policy or complete event chronology. FY2024shares rose3,542,340,928andFY2025shares rose21,388,675; these net movements cannot be treated as one pure split. Personal holdings150=100+50pending are settled owner facts, not issuer-wide factors. A later historical capture could adjust earlier prices for postcutoff actions; that relevant event window and share basis remain unqualified.

Exact unresolved bridge: source-native unit; complete adjusted/unadjusted and cash/stock-dividend/split/issue methodology; issuer action IDs/terms/ratios/rounding/ex-dates/effective dates tied to the same FY2025share basis. No conversion factor is inferred from magnitude, no October2026price replacement, no beta1default, no peer data. Both price/action and issuer-risk estimation stay blocked. D3andD4are already approved; no owner choice is reopened.
''')
 et='| Credit axis | Fixed FY2025average core exposure, VND | Hypothetical charge, VND | Additional pretax expense, VND | Status |\n|---|---:|---:|---:|---|\n'
 for e in estimates:et+=f"|{e['scenario']}|{e['fixedExposure']}|{e['hypotheticalCharge']}|{e['value']}|{e['classification']}|\n"
 md('TCB_NORMALIZED_EARNINGS_CALIBRATION.md',f'''# TCB common earnings and credit sensitivity calibration

{intro}
**Reported ordinary EPS earnings remain25,254,851million VND after welfare; normalized common earnings and sustainable ROE remain null.** The approved common accounting book170,044,504million is retained, not recomputed/promoted into economic or tangible capital. The shareholder-numerator and common-return normalization questions are separate.

## New bounded credit-expense sensitivities

{et}

Formula: approved12dp credit anchor×simple averageFY2024/FY2025bank-core loans−reportedFY2025bank-customer provision charge. Core exposure excludes securities margin/advances. The actual customer charge is4,475,370,000,000VND; interbank/other-credit/margin reversals are not substituted. These calculations fix the **historical exposure scale**; they are not future loan-growth or default predictions. BEARandBASEproduce two new PROPOSED/PENDING_NUMERICAL_APPROVALpretax estimates. BULL's tiny nonzero difference is the approved rounded-rate residue, not an economic profit forecast; it is not silently set to zero. Exact input arithmetic is not extra source precision beyond native rounded statements.

No common-owner after-tax effect is calculated. Marginal tax, deductibility, subsidiary/common incidence and the recurring earnings bridge remain null. Historical credit anchors are not full-cycle expected-loss or tail bounds; simply choosing the highest of three reported rates does not complete a downside scenario.

## Recurring income, recoveries and funding

Retained NII rises from35,507,963million inFY2024to38,155,091million inFY2025; net fees rise8,042,248to8,771,995million. Their growth alone does not establish recurring margins. Deposit interest expense rises13,775,447to18,124,418million and issued-instrument interest4,794,992to8,228,548million; expense populations and average balances differ, so no customer-only funding rate, NIMor forward funding-spread range is invented. Fees contain payments, securities and insurance activities with distinct cycles/costs; a consolidated total is not an accepted run-rate.

Recoveries1,138,200million/FY2024and1,354,286million/FY2025are separate from loan-provision charges; preserve recovery costs, timing, marginal tax and common attribution. Avoid adjusting recovery economics twice if a later expected-loss calibration already includes recoveries. Property-sale gain497,035million and insurance termination expense1,808,413million belongFY2024, notFY2025; FY2025dashes stay null. FY2025subsidiary revaluation expense3,354million is a distinct candidate. Insurance control/consolidation dates, one-off/fee recurrence and full-year owner contribution remain incompletely normalized. The6,244,850million direct retained-capital transaction is not P&L.

Reported bank tax20%does not prove each adjustment's marginal common-owner incidence. Prior conditional working earnings that assumed tax0/common incidence1were not approved sustainable earnings and are not imported. Existing FY2022–FY2025reported periods show variation but do not prove a full credit/property/funding cycle. Thus no sustainable earnings or ROErange can yet be defended from these inputs alone.
''')
 capg=facts['REG_CAPITAL_H2_GROWTH']['value'];rwag=facts['RWA_H2_GROWTH']['value']
 md('TCB_CAPITAL_FEASIBILITY.md',f'''# TCB no-issuance capital feasibility

{intro}
**Capital feasibility BLOCKED.** newShares0/netNewCommonCash0are APPROVED_CONDITIONAL_ASSUMPTION, not historical/factual predictions. They do not certify funded growth or distributions.

New retained comparative bindings in the same FY2025regulatory filing: physicalp5,30June2025consolidated regulatory capital165,500billion VND; physicalp6,30June2025consolidated RWA1,105,897billion. FY2025closing values remain181,870billion and1,244,531billion. H2changes are **{capg}**capital and **{rwag}**RWA, six-month diagnostics, not annualized forecasts. All values use regulatory consolidated scope and billion-VND native units; source columns do not use the smaller standalone values.

RWAexpanded faster than reported eligible capital over this interval. This is concrete counterevidence against treating a comfortable year-end CARas unlimited no-issuance growth capacity. It does not by itself demonstrate distress or a future capital shortfall. Tier1ratio13.67%is not CET1; reported CAR14.61%is not accounting ROE. The issuer-reported historical8%floor is not an automatically chosen forward target/management buffer. No current legal or stress headroom certificate is inferred.

Required checks: `g=ROE*(1-payout)`; `Creg1=Creg0+eligible retained common earnings−regulatory losses/deductions+qualified other eligible capital movements`; `Creg1/RWA1>=approved target`, with `RWA1=RWA0*(1+gRWA)`. Every missing operand remains null. Common book and regulatory capital require a valid bridge; parent no-issuance does not promise no subsidiary/NCIorTier2capital change. Positive group earnings, Tier1or book growth cannot automatically fund common dividends and risk-weighted growth.

Exact blockers: normalized common ROE/payout; eligible retention/deduction conversion; prospective RWAcomposition/growth; justified target/buffer; correlated credit/funding losses/outflows and terminal distribution/capital path. No numerical growth/payout/capital target is chosen. Conditional zero issuance remains approved, but a complete scenario stays blocked until these equations and funding constraints are supported.
''')
 md('TCB_SCENARIO_CALIBRATION.md',f'''# TCB scenario calibration register

{intro}
**27 scenario-axis cells;6conditionally approved,21numerical cells still blocked,0complete scenarios.** Each BEAR/BASE/BULLcase retains its approved historical credit anchor and explicit zero issuance/net-cash restriction. Approval conditions remain attached; no request for reapproval is made.

| Axis | BEAR | BASE | BULL | Numerical approval |
|---|---|---|---|---|
| Sustainable common ROE |null|null|null|PENDING_NUMERICAL_APPROVAL|
| Nominal VNDke |null|null|null|PENDING_NUMERICAL_APPROVAL|
| Growth |null|null|null|PENDING_NUMERICAL_APPROVAL|
| Payout |null|null|null|PENDING_NUMERICAL_APPROVAL|
| Credit sensitivity |0.009217628484|0.007947018458|0.006732050583|APPROVED_CONDITIONAL_ASSUMPTION|
| Funding stress |null|null|null|PENDING_NUMERICAL_APPROVAL|
| Regulatory/common capital target |null|null|null|PENDING_NUMERICAL_APPROVAL|
| Terminal economics |null|null|null|PENDING_NUMERICAL_APPROVAL|
| New shares/net common cash |0/0|0/0|0/0|APPROVED_CONDITIONAL_ASSUMPTION; feasibility not demonstrated|

There are **zero new independent full-scenario numerical assumptions**. Two new numerical **credit-expense estimates** quantify the approved anchors at fixed historical exposure and remain PROPOSED/PENDING_NUMERICAL_APPROVAL. A rounding residue reference is not a third economic estimate. Four new historical capital inputs comprise two comparative readings and two derived growth diagnostics; none is a forward capital target. Four provider risk components are captured reference data, not qualified FY2025ke inputs. These categories are counted separately to avoid relabeling source collection as completed underwriting.

Cell/estimate records carry evidence IDs, period/unit, economic rationale, formula, confidence, downside/sensitivity and approval status. Capital feasibility explicitly remains blocked; approved no-issuance restrictions do not fill missing growth/payout/return. No arbitrary beta, risk premium, tax, bank spread, terminal spread, payout or generic bank range is inserted. All new economics require explicit numerical approval after evidence qualification; none is approved by acquisition authority.
''')
 md('TCB_INDEPENDENT_CROSSCHECK_ASSESSMENT.md',f'''# Independent TCB crosscheck assessment

{intro}
**BLOCKED.** TCB own-history normalized common earnings capitalization remains a potential independent approach only if prices/actions/earnings are comparable and its capitalization interval has separate economic support. Neither comparable historical prices/actions nor accepted sustainable owner earnings are qualified. The new credit-expense sensitivities do not supply that denominator or interval.

Residual income, Gordon growth/DDMand justified P/Busing identical ROE/ke/gare algebraic consistency checks, not independent corroboration. A provider ERPdoes not supply an issuer capitalization multiple or independent value. Accounting common book is not realizable/liquidation value; group intangibles and unrestricted funds/collateral realization remain unresolved for that purpose.

No peers, market-price replacement, capitalization multiple, intrinsic value or MOSis calculated. Exact remaining dependencies: compatible own-history price/action basis, normalized common-earnings series, independently justified capitalization evidence and approved source/method compatibility. Existing crosscheck requirements are not waived because this cycle is bounded. More identical-method outputs would not resolve the gap.
''')
 md('TCB_BOUNDED_RESEARCH_FINAL_REVIEW.md',f'''# TCB bounded economic research — final review

{intro}
**BLOCKED_WITH_EXACT_DEPENDENCIES.** Substantive progress is limited and explicit: approvals persisted; one bounded source attempt per selected object recorded; provider reference row captured with vintage limitations; two retained capital readings and two historical growth diagnostics qualified; two new fixed-exposure credit-expense sensitivities proposed. No complete scenario or ke is manufactured from these results.

| Required outcome | Result |
|---|---|
| Exact execution baseline |`{BASE}`; no new commit created, implementation uncommitted|
| Changed files |Only new folder `docs/fundamental-data-engine/dfr-05/tcb-bounded-economic-b5c8fe27/`; exact file inventory/hashes in manifest.json and changed-files.json|
| New qualified historical economic inputs |4: H1regulatory capital, H1RWA, H2capital growth, H2RWAgrowth;2readings+2diagnostics, not4forward assumptions|
| New qualified forward ke inputs |0;4provider reference components are not selected case inputs|
| New numerical proposals |2pretax credit-expense estimates;0new independent scenario assumptions;1rounding reference excluded|
| Existing conditional approval |3credit anchors+3no-issuance cells approved with conditions|
| Remaining blocked assumptions |21of27scenario cells; all3capital feasibility checks remain blocked|
| Nominal VNDke |BLOCKED: missing exact authenticated yield/method, complete selected method/vintage compatibility and issuer-risk exposure|
| Historical price/action |BLOCKED; selectedPrice=null; no unit/factor/date convention inferred|
| Normalized common earnings / sustainable ROE |Normalization PARTIAL but accepted value/range null; sustainable ROE BLOCKED|
| Capital feasibility |BLOCKED; no selected forward buffer/target, eligible-retention/RWA/stress path|
| Independent crosscheck |BLOCKED; no compatible own-history normalized capitalization evidence|
| Complete bear/base/bull scenarios |0|
| Critical / Major / Minor |0 /5groups /0|
| Request authorization for draft valuation next? |No; full prerequisites remain unmet and no valuation execution is authorized|

Remaining Major groups: BE-M1ke authenticated economic basis/provider vintage/issuer exposure; BE-M2price/action compatibility; BE-M3common recurring earnings/tax/ownership/credit-cycle/funding; BE-M4capital/growth/payout/stress/terminal feasibility; BE-M5independent crosscheck. These are evidence/economic limitations, not new formal methodology defects. Prior common accounting book qualification and P2.6readiness/dispositions remain unchanged.

No reapproval of D1–D6, the credit anchors, no-issuance scope or KE-S1–S3scope is requested. Exact substantive requirements are delivery of an authenticated case-date HNXrecord/method, a complete compatible and immutable provider calibration with justified TCBexposures, the issuer action bridge, normalized owner cash/earnings attribution and capital path. They cannot be replaced by owner preference, a generic risk spread or repeated readiness documents. This cycle stops after the failed/incompatible attempts; no alternate-provider search or automatic follow-on phase is created.

No formal M3points/totals/rank, M4decision, intrinsic value, live security recommendation, production admission or portfolio/database mutation. Technical and separate financial challenge receipts are bounded research checks, not independent human or whole-release acceptance.

**STOP — await owner review. No valuation execution.**
''')

if __name__=='__main__':build()
