"""Retained VNM S1 economic returns under the owner's resolution policy; no live writes."""
from pathlib import Path
from decimal import Decimal as D, getcontext, ROUND_HALF_EVEN
import json,hashlib,sqlite3,itertools,re
from returns import annual_return,incremental_efficiency,compare_capital_cost
getcontext().prec=45
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
BASE='33d1a3d7b70625b064c93e2a56879f2cc1997fd7';N='data/manual-extracted-pdf/notes/VNM.json';PINS={}
def sha(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
def read(p):PINS[p]=sha(p);return json.loads((R/p).read_text())
def pin(p,ptr=''):
 if p not in PINS:PINS[p]=sha(p)
 return {'path':p,'sha256':PINS[p],'jsonPointer':ptr}
def write(n,x):(O/n).write_text(json.dumps(x,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
def md(n,t):(O/n).write_text(t.strip()+'\n')
def table(headers,rows):return '| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+'\n'.join('| '+' | '.join(str(x) for x in row)+' |' for row in rows)
notes=read(N);prior=read('docs/fundamental-data-engine/vnm-final-s1-s5-scoring/2026-11-13/VNM_SCORING_INPUTS.json')
shared=read('docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/evidence-products.json')
for p in ['docs/03 SCORING/METRIC_DEFINITIONS.md','docs/03 SCORING/SECTOR_NORMALIZATION.md','docs/01 SYSTEM/SCORING_MODEL_v1.0.md','src/domain/scoring/metrics.ts','src/domain/scoring/methodology.ts','src/domain/portfolio/values.ts','src/domain/scoring/scorecard.ts','docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/VNM_SHARED_EVIDENCE_PRODUCTS.md','docs/fundamental-data-engine/dfr-05/tcb-bounded-economic-b5c8fe27/TCB_COST_OF_EQUITY_CALIBRATION.md']:
 pin(p)
read('docs/fundamental-data-engine/dfr-05/tcb-bounded-economic-b5c8fe27/cost-of-equity-calibration.json')
pin(str((O/'OWNER_POLICY.md').relative_to(R)))
checks=[]
def source(di,page):
 doc=notes['documents'][di]
 return {**pin(N,f'/documents/{di}/pages/{page-1}'),'pdfPath':doc['pdfPath'],'pdfSha256':doc['sourceHash'],'physicalPage':page,'scope':'CONSOLIDATED','unit':'VND','sourceTextReused':True,'formalAdmissionGranted':False}
def checked(value,di,page,caption,column):
 text=notes['documents'][di]['pages'][page-1]['text']
 tokens={t.replace('.','').replace(',','') for t in re.findall(r'(?<![\d.,])\d{1,3}(?:[.,]\d{3})+(?![\d.,])',text)}
 if str(value) not in tokens:raise ValueError(f'EXACT_RETAINED_AMOUNT_NOT_PRESENT:{value}:doc{di}:page{page}')
 checks.append({'value':str(value),'caption':caption,'column':column,'source':source(di,page),'status':'EXACT_AMOUNT_IN_FULL_PAGE_TEXT; caption/column reviewed with statement and balance reconciliations; not amount-only concept inference'})
 return str(value)
# Compact row specification: total assets, total liabilities, total equity, cash,
# short/long financial investment populations, short/long borrowings, trade/advance/payroll.
raw_stocks={
2021:('53332403438219','17482289188835','35850114249384','2348551874348','21025735779475','742670306431','9382354118118','75636000000','4213887652294','66036392886','304671997074'),
2022:('48482664236220','15666145881135','32816518355085','2299943527624','17414055328683','743862023831','4867129839103','66028725000','4284158390163','161708567120','287914221269'),
2023:('52673371104460','17647627338990','35025743765470','2912027359925','20137243800460','831227597345','8217757172267','238476074100','3805885429198','164712782108','289224237367'),
2024:('55049061537061','18874658707398','36174402829663','2225943732075','23260088671767','1373189677193','9115435107250','157903902450','3874064349587','191336029327','307904216360'),
2025:('53312370717301','18829355431194','34483015286107','1794879718871','21354863600460','957072946110','9393736731992','62907826150','3923308706878','253080586375','321578564134')}
stock_fields=['assets','totalLiabilities','totalEquity','cash','shortFinancialAssets','longFinancialAssets','shortDebt','longDebt','tradePayables','customerAdvances','payrollPayables']
field_pages=[8,9,9,7,7,8,9,9,9,9,9]
stock_docs={2021:2,2022:2,2023:3,2024:5,2025:6};stocks={}
for year,values in raw_stocks.items():
 di=stock_docs[year];column='PRIOR_COMPARATIVE_2021_12_31' if year==2021 else 'CURRENT_YEAR_END'
 row={'year':year,'date':f'{year}-12-31','scope':'CONSOLIDATED','currency':'VND','sourceDocument':notes['documents'][di]['pdfPath']}
 for k,v,page in zip(stock_fields,values,field_pages):row[k]=checked(v,di,page,k,column)
 assert D(row['assets'])==D(row['totalLiabilities'])+D(row['totalEquity'])
 stocks[str(year)]=row
# Income statement: revenue, gross profit, selling/G&A, financial expense/interest,
# gross other expense, pretax profit, net profit, total GROUP personnel fund appropriation.
raw_flows={
2022:('59956247197418','23897231506707','12548212246871','1595845681078','617537182995','166039091744','284551949482','10495534676745','8577575319708','948573877583'),
2023:('60368915511505','24544731615410','13018093111879','1755619128197','503122771214','354094837255','289142381872','10967899391486','9019354165051','968335437517'),
2024:('61782609528445','25590176323124','13357706796806','1827916838987','428238548859','279424561295','224955575646','11599653741335','9452892989948','1000905110715'),
2025:('63645886756227','26209474194531','13641689163684','1904069825709','350234100207','325804350407','255507743517','11649985224938','9413589732469','1003615673134')}
flow_fields=['revenue','grossProfit','selling','admin','financeExpense','interestExpense','otherExpense','pretaxProfit','netProfit','fundAppropriation']
flow_docs={2022:2,2023:3,2024:5,2025:6};fund_pages={2022:51,2023:50,2024:51,2025:51};flows={}
for year,values in raw_flows.items():
 di=flow_docs[year];row={'year':year,'scope':'CONSOLIDATED','currency':'VND','periodStart':f'{year}-01-01','periodEnd':f'{year}-12-31'}
 for k,v in zip(flow_fields,values):row[k]=checked(v,di,fund_pages[year] if k=='fundAppropriation' else 10,k,'CURRENT_YEAR')
 row['identifiedFinanceCredit']='0' # analytical adjustment choice, NOT assertion reported reversals are zero.
 row['identifiedFinanceCreditMeaning']='No additional named reversal adjustment selected for this historical scenario; not an absence claim.'
 if year==2025:
  row['identifiedFinanceCredit']=checked('47681715030',6,56,'negative other-finance-cost credit removed from conservative sensitivity','2025')
  row['identifiedFinanceCreditMeaning']='Explicit negative other-finance-cost line; net noninterest expense is grossed up in the conservative cost case.'
 flows[str(year)]=row
# Independent reported-PBT reconstruction checks the native line/column attribution.
other_income={2022:'289021799127',2023:'353408891551',2024:'230631678594',2025:'245717978992'}
finance_income={2022:'1379904407740',2023:'1716367576333',2024:'1585660836067',2025:'1496851902188'}
associate={2022:'-24475976403',2023:'-80631298646',2024:'32002663848',2025:'-150558017656'}
statement_checks=[]
for year in range(2022,2026):
    f=flows[str(year)];di=flow_docs[year]
    f['otherIncome']=checked(other_income[year],di,10,'gross other income excluded from core EBIT','CURRENT_YEAR')
    f['financeIncome']=checked(finance_income[year],di,10,'finance income excluded from core EBIT','CURRENT_YEAR')
    a=associate[year];checked(str(abs(D(a))),di,10,'signed JV/associate result excluded from core EBIT','CURRENT_YEAR');f['associateResult']=a
    if a.startswith('-'):
        formatted=f'{int(abs(D(a))):,}'.replace(',','.')
        assert '('+formatted+')' in notes['documents'][di]['pages'][9]['text']
    reconstructed=D(f['grossProfit'])-D(f['selling'])-D(f['admin'])+D(f['financeIncome'])-D(f['financeExpense'])+D(f['associateResult'])+D(f['otherIncome'])-D(f['otherExpense'])
    assert reconstructed==D(f['pretaxProfit'])
    statement_checks.append({'year':year,'reportedPbt':f['pretaxProfit'],'reconstructedPbt':str(reconstructed),'status':'EXACT_MATCH'})
# Reuse canonical facts exactly and reconcile available comparable quantities; do not overwrite any.
c=sqlite3.connect('file:'+str(R/'data/vn30.sqlite')+'?mode=ro&immutable=1',uri=True)
row=c.execute("select body,body_hash from fundamental_admission_run where id='reviewed-vn30-20261019-VNM'").fetchone();canonical=json.loads(row[0]);c.close()
assert canonical['canonicalFacts']==prior['qualifiedFinancialFacts']['canonicalFacts']
crosschecks=[]
concepts={'TOTAL_ASSETS':'assets','TOTAL_EQUITY':'totalEquity','CASH_AND_EQUIVALENTS':'cash','SHORT_TERM_FINANCIAL_BORROWINGS':'shortDebt','LONG_TERM_FINANCIAL_BORROWINGS':'longDebt','REVENUE':'revenue','GROSS_PROFIT':'grossProfit','NET_INCOME':'netProfit'}
for f in canonical['canonicalFacts']:
 year=f['period']['end'][:4];field=concepts.get(f['itemId'])
 if f.get('scope')=='CONSOLIDATED' and f['period']['end'].endswith('12-31') and field and year in flows:
  v=stocks[year].get(field,flows[year].get(field))
  if v is not None:
   assert D(v)==D(f['value']),(f['id'],v,f['value'])
   crosschecks.append({'factId':f['id'],'concept':f['itemId'],'year':year,'value':v,'canonicalRunBodyHash':row[1],'status':'EXACT_MATCH; historical qualification reused unchanged'})
# 20% is anchored to the issuer standard-tax reconciliation, not imported as an unsourced legal assertion.
checked('2329997044988',6,59,'tax at company rate','2025')
observed_rates={y:str((D(f['pretaxProfit'])-D(f['netProfit']))/D(f['pretaxProfit'])) for y,f in flows.items()}
min_rate=min(D(v) for v in observed_rates.values());tax_rates=[D('0.20'),min_rate]
scenarios=[]
for t,cash,liab,cost in itertools.product(tax_rates,[0,1],[0,1],[False,True]):
 key=f'tax={t}:cash={cash}:residual={liab}:knownCosts={cost}'
 annual=[annual_return(flows[str(y)],stocks[str(y-1)],stocks[str(y)],t,cash,liab,cost) for y in range(2022,2026)]
 incremental=[incremental_efficiency(a,b) for a,b in zip(annual,annual[1:])]
 scenarios.append({'id':key,'annual':annual,'incremental':incremental})
summary=[]
for year in range(2022,2026):
 rows=[s['annual'][year-2022] for s in scenarios]
 primary=[r for r in rows if r['taxRate']=='0.20' and r['cashExclusionFraction']=='0' and r['residualLiabilityOperatingFraction']=='0' and not r['knownCostCase']][0]
 summary.append({'year':year,'nopatEstimateRange':[str(min(D(r['nopatEstimate']) for r in rows)),str(max(D(r['nopatEstimate']) for r in rows))],'averageCapitalRange':[str(min(D(r['averageInvestedCapital']) for r in rows)),str(max(D(r['averageInvestedCapital']) for r in rows))],'roicSensitivityRange':[str(min(D(r['roicEstimate']) for r in rows)),str(max(D(r['roicEstimate']) for r in rows))],'pairedScenarioExtremaOnly':True,'primaryConservativeCapitalCase':primary,'grossMargin':str(D(flows[str(year)]['grossProfit'])/D(flows[str(year)]['revenue']))})
comparison=compare_capital_cost([r['roicSensitivityRange'][0] for r in summary],None)
method={'earningsScope':'CONSOLIDATED, including NCI; not parent common EPS','coreEbit':'gross profit - selling - G&A; finance income, JV/associate result and other income excluded','recurringEconomicCompensation':'Total group post-tax fund appropriation is charged once; cash fund use and dividends are not additionally deducted. EBIT-equivalent adjustment = appropriation/(1-tax).','nopat':'(core EBIT - selected identified cost sensitivity)*(1-tax) - group fund appropriation','tax':'Primary 20% estimate anchored to company-tax reconciliation. Sensitivity uses minimum observed group effective rate FY22–25 to 20%; an historical, evidence-anchored scenario range, not a proven future tax bound.','capital':'Operating assets = total assets - short/long financial investments - selected cash. Operating liabilities = explicit supplier/customer-advance/payroll + selected residual noninterest liabilities. Opening/closing use identical allocations and consolidated scope. Goodwill, CWIP and investment property retained; property operations remain in gross profit.','residualPopulation':'total liabilities - reported short/long borrowings - explicit supplier/customer-advance/payroll; 0/100% operating classification is sensitivity, not a claim all residuals are operating or non-operating.','cash':'0/100% exclusion endpoints: no chosen amount is called unrestricted or freely spendable. Classification ranges are separate from S2 instrument liquidity.','leases':'Consistent reported VAS operating-lease expense/book-asset basis; no unsupported capitalization or EBIT rent addback. Alternate economic lease capitalization not claimed complete.','incremental':'Display matched deltas using available aggregate history. No ratio if capital-change comparability/materiality is not established, including nonpositive denominator; M3 §6.3 guard is preserved. Project/factory attribution not an automatic requirement.','ranges':'Economic sensitivity estimates under declared assumptions, not certified exhaustive confidence intervals or accepted scoring Evidence. Extrema taken from complete coherent scenarios; never combine unmatched numerator/capital endpoints.','costOfCapital':'No numeric default. Retained VNM 12/15/18% discount choices are valuation assumptions, not an appropriately supported WACC. TCB country table/risk inputs are not VNM capital cost or transferable issuer beta.'}
input_doc={'contract':'vnm-s1-retained-economic-inputs-v1','baseline':BASE,'ticker':'VNM','currency':'VND','scope':'CONSOLIDATED','stocks':stocks,'flows':flows,'taxMethod':method['tax'],'observedEffectiveTaxRates':observed_rates,'selectedTaxRates':[str(t) for t in tax_rates],'nativeTextChecks':checks,'canonicalCrosschecks':crosschecks,'reportedStatementReconciliations':statement_checks,'canonicalFactsRequalified':False,'canonicalRunBodyHash':row[1],'method':method,'projectOrFactoryAttributionRequired':False,'policy':pin(str((O/'OWNER_POLICY.md').relative_to(R)))}
write('S1_INPUTS.json',input_doc)
block={'id':'S1_CAPITAL_COST_RANGE','status':'BLOCKING','missingInput':'A supported nominal-VND capital-cost estimate/range or defensible principle-equivalent benchmark compatible with consolidated unlevered returns and the assessment horizon.','sourceRequirement':'Dated, traceable estimate with currency, economic risk/country treatment and funding/exposure basis; does not prescribe CAPM, exact project data, a specific provider or a new approval.','whyIndispensable':'Owner rule5 and M3 BQ-EQ topic cost_of_capital require an economic return comparison. A high ROIC sensitivity does not by itself prove return above capital cost.','checkedEvidence':['Prior VNM S1/valuation rates are sensitivity assumptions only.','Retained TCB cost-of-equity evidence remains incomplete and issuer-specific; no VNM WACC is supplied.'],'noDefaultBetaOrCost':True,'ownerApprovalAloneCannotSupplyMissingFact':True}
# A safe scalar adapter for the existing M3 arithmetic test: rounding is explicit, original source amounts stay exact.
def accounting(x):return format(D(x).quantize(D('.000000000001'),rounding=ROUND_HALF_EVEN),'f').rstrip('0').rstrip('.')
engine_rows=[]
for r in summary:
 a=r['primaryConservativeCapitalCase'];engine_rows.append({'year':r['year'],'nopat':accounting(a['nopatEstimate']),'averageCapital':accounting(a['averageInvestedCapital']),'expectedRoic12dp':accounting(a['roicEstimate']),'meaning':'Arithmetic-only adapter to existing calculateMetrics; no formal Evidence or scoring authority.'})
result={'contract':'vnm-s1-economic-returns-resolution-v1','baseline':BASE,'status':'BLOCKING','resolutionPolicyImplemented':True,'sourceRequalificationPerformed':False,'ticker':'VNM','scope':'CONSOLIDATED','method':method,'historicalAnnualSummary':summary,'scenarios':scenarios,'engineArithmeticInputs':engine_rows,'costOfCapitalComparison':comparison,'indispensableBlockers':[block],'optionalDetailDisposition':{'projectFactoryAttribution':'NOT_MANDATORY; removed as a blanket S1 blocker','fiveYearHistory':'PREFERRED_NOT_NEW_MANDATORY_SOURCE_REQUEST; four annual observations and prior opening stock retained','exactOperatingCashOrAllResidualClassifications':'RANGED; no automatic zero/midpoint and no S2 restriction claim','projectCohortIRR':'NOT_REQUIRED_FOR_AGGREGATE_ROIC; N/R is not project failure'},'incrementalEfficiencyAssessment':'Matched group NOPAT and capital changes disclosed. Incremental ratio N/R because full capital-population/scope/FX comparability and small-denominator materiality have not been established; no factory schedule demanded.','sustainabilityAssessment':'Positive core operating profitability across FY2022–25 and stable high gross margins support persistence; scenario range and accounting/acquisition/tax/fund/lease assumptions prevent an unqualified durable-spread claim. No individual ROIC threshold assigns BQ-EQ points.','confidence':'LOW_ANALYTICAL_ESTIMATES; source identities/native checks and accounting reconciliations explicit, normalized full-cycle completeness not asserted.','currentPeriodCoverage':{'latestAuditedAnnual':'FY2025','annualWindow':'FY2022–FY2025','openingCapital':'2021-12-31','latestTTM':None,'knownQ3_2026':'Retained source exists; no claim this annual-only return study incorporates current Q3/YTD normalization. Existing current-scoring freshness limitations remain separate; no new PDF request.'},'acceptance':{'traceableNormalizationMethodAndInputs':True,'consistentCapitalAndMeasurementPeriod':True,'reproducibleHistoricalArithmetic':True,'documentedAdjustmentsAssumptions':True,'mandatoryEconomicCostComparisonSatisfied':False,'automaticScoringOrS1Closure':False,'unresolvedSelectedInputAccountingContradictions':[],'classificationUncertainty':'RANGED_NOT_ERASED; sensitivity endpoints are estimates, not formally admitted exact economic facts.'},'M3WeightsChanged':False,'sourceAuthorityChanged':False,'S1Closed':False,'formalRubricPoints':None,'fullVnmScore':None,'productionActivation':'NOT_AUTHORIZED'}
write('S1_ECONOMIC_RETURNS.json',result)
write('SOURCE_PINS.json',{'baseline':BASE,'files':[pin(p) for p in sorted(PINS)],'protectedDatabase':{'path':'data/vn30.sqlite','sha256':sha('data/vn30.sqlite')},'protectedPersonalAccountFiles':[{'path':str(p.relative_to(R)),'sha256':sha(str(p.relative_to(R)))} for p in sorted((R/'data/account-current').glob('*.json'))],'scriptFiles':[pin(str(p.relative_to(R))) for p in sorted(O.glob('*.py'))]})
rows=[]
for x in summary:
 pct=lambda x:f'{D(x)*100:.2f}%'
 tri=lambda x:f'{D(x)/D(10)**12:.3f}'
 rows.append([x['year'],tri(x['nopatEstimateRange'][0])+'–'+tri(x['nopatEstimateRange'][1]),tri(x['averageCapitalRange'][0])+'–'+tri(x['averageCapitalRange'][1]),pct(x['roicSensitivityRange'][0])+'–'+pct(x['roicSensitivityRange'][1]),pct(x['grossMargin'])])
md('S1_RESOLUTION.md',f'''# VNM S1 — economic returns resolution

**Policy implemented; S1 remains BLOCKING at `S1_CAPITAL_COST_RANGE`. No score is assigned.** Exact project/factory attribution is no longer a blanket S1 requirement. The user policy is retained in OWNER_POLICY.md; it does not amend M3 or approve financial observations.

## What was calculated

Existing canonical records are reused unchanged. The retained consolidated notes support four annual periods FY2022–FY2025, plus 31 December 2021 opening capital. Every selected native amount has a caption/column/page binding and statement/balance reconciliation; {len(crosschecks)} overlapping canonical values match exactly. No PDF was downloaded, no canonical fact was overwritten or requalified and no formal admission was created. New analytical selections from retained text remain distinct from accepted canonical financial facts.

{table(['Year','NOPAT sensitivity (tn VND)','Average invested capital (tn VND)','Paired ROIC sensitivity','Gross margin'],rows)}

The range consists of coherent scenarios, not independently mixed best numerator/worst denominator. It is an evidence-anchored historical sensitivity envelope, **not** an exhaustive bound on all future recurring economics and not accepted Scoring Evidence. In particular, a high observed historical range is not a proof of an economic spread without a supported capital-cost comparator.

## Earnings normalization

Use **consolidated** gross profit less selling and G&A. Remove finance income and JV/associate earnings by construction; remove their financial investment populations from capital. Retain group NCI in both numerator and capital. This avoids the earlier parent transfer-pricing/capital-perimeter distortion and does not confuse common EPS with group operating earnings.

Charge the disclosed total-group employee fund appropriation once as a recurring after-tax economic cost. Its pretax equivalent is `fund/(1-tax)`, so `NOPAT = normalized EBIT × (1-tax)`. Do not deduct fund cash use, dividends or parent EPS adjustments again. No unsupported one-off addback is used. A conservative cost scenario charges identified other expenses and noninterest finance costs; the FY2025 explicit negative finance-cost credit is removed when forming that cost scenario. This is a sensitivity to recurring classification, not a declaration every other expense recurs or all embedded gains have been exhaustively found.

Primary tax estimate is 20%, anchored to the company's tax reconciliation in retained FY2025 NoteVI.10, physical page59. A historical sensitivity from the minimum observed group effective rate to 20% is disclosed. It is not an asserted future group rate, a cash-tax rate, or an unsourced legal rate. Tax, financial classification, fund and lease uncertainty remains in confidence; no arbitrary 15% tax default is used.

## Invested capital consistency

`Operating assets = total assets − short/long financial investments − selected cash exclusion`.

`Operating liabilities = explicit trade payables + customer advances + payroll + selected residual noninterest liabilities`.

The residual population is reconciled to total liabilities less reported short/long borrowings and those explicit operating liabilities. A 0/100% residual classification range and 0/100% cash exclusion range preserve uncertainty; neither end asserts all cash is spendable. For the all-residual operating endpoint, the formula reconciles to equity (including NCI) plus borrowings less financial investments and selected cash. The same scope, tax, cash and liability conventions apply to opening and closing balances. Annual NOPAT divides by their mean, not year-end capital.

Goodwill/CWIP remain in capital; no arbitrary tangible-only denominator inflates returns. Investment property stays in capital because related operations remain in gross profit. Operating leases stay on the consistent reported expense/book-capital basis; no unsupported lease capitalization or rent addback is invented. The interval is an analytical classification range, not a comprehensive debt-v2 certification or an S2 liquidity conclusion.

## Historical persistence and incremental efficiency

The four-year observations show positive operating profitability and broadly stable gross margins. They support persistence of reported operations, with material normalization/capital-method sensitivities retained. Five years plus latest TTM are preferred in M3; missing optional factory detail or a fifth year is not turned into a new mandatory source request. This annual study does not claim to incorporate known Q3/2026 current-period normalization or close current-scoring freshness gates.

Matched changes in group NOPAT and year-end invested capital are reproducible in S1_ECONOMIC_RETURNS.json. **Incremental ROIC remains N/R** until capital-change comparability/materiality is supported; M3 §6.3 forbids a mechanical ratio when the denominator is very small or distorted by acquisitions/actions. Book changes include FX, scope, depreciation and disposals; N/R is not evidence of failed projects. Aggregate historical evidence or a supported range can resolve this; exact project/factory attribution is not prescribed. Incremental efficiency evidence is not duplicated into BQ-EQ or CA-REINV points.

## One indispensable unresolved comparison

**`S1_CAPITAL_COST_RANGE`** — no appropriately supported, nominal-VND capital-cost estimate/range compatible with these consolidated operating returns is retained in the reviewed evidence. This directly leaves owner rule5 / BQ-EQ topic `cost_of_capital` unfulfilled.

The existing VNM 12/15/18% valuation discount grid is a conditional judgment, not an observed/qualified WACC. Retained TCB country-risk source work does not supply a VNM issuer exposure or compatible funding benchmark; a country premium is not a WACC, and a TCB beta cannot be transferred. No beta1, policy hurdle, zero spread, midpoint or default capital cost is invented. CAPM is one possible method, **not a newly required contract**. A defensibly sourced compatible estimate, range or principle-equivalent benchmark is sufficient; no new approval or specific provider is demanded.

Until that comparator exists, ROIC-minus-cost and durable economic-spread conclusions are N/R, S1 is **not CLOSED**, and no BQ-EQ/GQ-INC/CA-REINV score is manufactured. This result supersedes old blanket project/cohort-data demands, not the retained source facts or broader S2–S5/executable blockers. Normalization and current-period limitations stay visible; passing arithmetic validation cannot alone make the estimates formally decision-grade.

## Validation and boundaries

S1_INPUTS.json contains exact sources/native checks/canonical matches; S1_ECONOMIC_RETURNS.json contains formulas, all scenarios, acceptance flags and the exact blocker. SOURCE_PINS.json and VALIDATION.json bind inputs, deterministic replay, focused Python tests and existing M3 metric arithmetic. No investment rules, source authority, holdings, ledger, NAV or production permissions change.
''')
print(json.dumps({'status':result['status'],'historicalYears':len(summary),'scenarios':len(scenarios),'canonicalMatches':len(crosschecks),'nativeChecks':len(checks),'blocker':block['id']}))
