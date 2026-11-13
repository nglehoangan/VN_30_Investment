"""Retained Q3 and bounded public macro references. No acquisitions or live writes on replay."""
from pathlib import Path
import sys,importlib.util,json,hashlib,re,html,itertools
from html.parser import HTMLParser
from decimal import Decimal as D,getcontext
from model import wacc,period_return,incremental_result,ttm_flow
sys.dont_write_bytecode=True;getcontext().prec=45
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
PRE='docs/fundamental-data-engine/vnm-s1-economic-returns/2026-11-13/'
PINS={}
def sha(p):return hashlib.sha256((R/p).read_bytes()).hexdigest()
def read(p):PINS[p]=sha(p);return json.loads((R/p).read_text())
def pin(p,ptr=''):
 if p not in PINS:PINS[p]=sha(p)
 return {'path':p,'sha256':PINS[p],'jsonPointer':ptr}
def write(n,x):(O/n).write_text(json.dumps(x,indent=2,sort_keys=True,ensure_ascii=False)+'\n')
def md(n,t):(O/n).write_text(t.strip()+'\n')
def table(h,rows):return '| '+' | '.join(h)+' |\n| '+' | '.join(['---']*len(h))+' |\n'+'\n'.join('| '+' | '.join(str(x).replace('|','/') for x in row)+' |' for row in rows)
base=read(PRE+'S1_INPUTS.json');old=read(PRE+'S1_ECONOMIC_RETURNS.json');pages=read(str((O/'Q3_SELECTED_PAGES.json').relative_to(R)));receipts=read(str((O/'sources/CAPTURE_RECEIPTS.json').relative_to(R)))
assert sha(pages['pdfPath'])==pages['pdfSha256']
pin(pages['pdfPath'])
for p in ['docs/03 SCORING/METRIC_DEFINITIONS.md','docs/03 SCORING/SECTOR_NORMALIZATION.md','src/domain/scoring/metrics.ts','src/domain/scoring/methodology.ts','src/domain/scoring/scorecard.ts','src/domain/scoring/evidence.ts','src/domain/fundamentals/standing-source-policy.ts',PRE+'returns.py',PRE+'OWNER_POLICY.md']:
 pin(p)
spec=importlib.util.spec_from_file_location('retained_returns',R/(PRE+'returns.py'));rr=importlib.util.module_from_spec(spec);spec.loader.exec_module(rr)
pageby={p['page']:p for p in pages['pages']};selected=[]
def field(value,page,caption,column,rowcode=None):
 lex=f'{int(abs(D(value))):,}'.replace(',','.')
 matches=[(j,line) for j,line in enumerate(pageby[page]['lines']) if lex in line['text']]
 if page in [11,12] and column.startswith('YTD'):
  lo,hi=(D('.68'),D('.82')) if column=='YTD_2026' else (D('.82'),D('1'))
  matches=[m for m in matches if lo<=D(str(m[1]['x']))<hi]
 if not matches:raise ValueError(f'SOURCE_NATIVE_CELL_NOT_FOUND:{value}:{page}:{caption}:{column}')
 j,line=matches[0]
 selected.append({'value':str(value),'nativeLexeme':lex,'page':page,'caption':caption,'rowCode':rowcode,'column':column,'source':{**pin(str((O/'Q3_SELECTED_PAGES.json').relative_to(R)),f'/pages/{pages["pages"].index(pageby[page])}/lines/{j}'),'pdfPath':pages['pdfPath'],'pdfSha256':pages['pdfSha256'],'href':pages['pdfPath']+'#page='+str(page),'lineBox':{k:line[k] for k in ['x','y','width','height']},'lineText':line['text'],'boxPrecision':'OCR_LINE_MAY_SPAN_CELLS'},'review':'SELECTED_CAPTION_COLUMN_AND_IMAGE_CHECK; not formal financial admission'})
 return str(value)
# Scope/row/column are explicit issuer mappings, never inferred from amount equality.
stocks={}
vals={
 '2025-12-31_RECLASSIFIED':['53312370717301','18829355431194','34483015286107','1794879718871','21891390273656','958690776186','9393736731992','62907826150','3923308706878','253080586375','321578564134'],
 '2026-09-30':['57892388235962','19628191437455','38264196798507','3611993886527','22926037976040','1117302478944','8384686375137','97387500260','4388353832571','307119403827','302421649500']}
keys=['assets','totalLiabilities','totalEquity','cash','shortFinancialAssets','longFinancialAssets','shortDebt','longDebt','tradePayables','customerAdvances','payrollPayables'];locs=[9,10,10,7,7,9,10,10,10,10,10]
for date,values in vals.items():
 col='2026_09_30' if date=='2026-09-30' else '2026_01_01_RECLASSIFIED'
 row={'date':date[:10],'scope':'CONSOLIDATED','currency':'VND'}
 for k,v,p in zip(keys,values,locs):row[k]=field(v,p,k,col)
 assert D(row['assets'])==D(row['totalLiabilities'])+D(row['totalEquity'])
 stocks[date]=row
nci=field('3792930557985',10,'Non-controlling interests','2026_09_30','429')
flows={}
ytdvals={
 2026:['53461195965104','30724635665886','22736560299218','11713828801320','1518774526030','1413095568270','453303861156','333641849665','139697340648','64438390033','60314443939','10607569965724','8604835000871','1984600326506','18134638347','870909645011'],
 2025:['46688775992595','27419159265535','19269616727060','10454856763069','1358993328536','1138510712384','242667487576','235824165641','-174542489928','41273669298','45355696781','8172985342852','6586390691537','1584951058728','1643592587','718174318739']}
fkeys=['revenue','costOfSales','grossProfit','selling','admin','financeIncome','financeExpense','interestExpense','associateResult','otherIncome','otherExpense','pretaxProfit','netProfit','currentTax','deferredTax','fundAppropriation']
for year,values in ytdvals.items():
 row={'year':year,'months':9,'periodStart':f'{year}-01-01','periodEnd':f'{year}-09-30','scope':'CONSOLIDATED','currency':'VND','basis':'2026_PRESENTATION; 2025_COMPARATIVE_RECLASSIFIED'}
 for k,v in zip(fkeys,values):
  p=56 if k=='fundAppropriation' else 12 if k in ['netProfit','currentTax','deferredTax'] else 11
  row[k]=field(v,p,k,f'YTD_{year}' if p in [11,12] else f'NINE_MONTHS_{year}')
 row['coreEbit']=str(D(row['grossProfit'])-D(row['selling'])-D(row['admin']))
 row['allInOperatingEbit']=str(D(row['coreEbit'])+D(row['otherIncome'])-D(row['otherExpense']))
 row['noninterestFinanceCost']=str(max(D(0),D(row['financeExpense'])-D(row['interestExpense'])))
 assert D(row['revenue'])-D(row['costOfSales'])==D(row['grossProfit'])
 assert D(row['allInOperatingEbit'])+D(row['financeIncome'])-D(row['financeExpense'])+D(row['associateResult'])==D(row['pretaxProfit'])
 assert D(row['pretaxProfit'])-D(row['currentTax'])-D(row['deferredTax'])==D(row['netProfit'])
 flows[str(year)]=row
# Restatement is quantified, not silently merged into a different vintage.
reclass={'grossRevenueOld':field('46678098629757',71,'gross revenue as previously reported','YTD_2025_OLD'), 'grossRevenueNew':field('46754540272079',71,'gross revenue reclassified','YTD_2025_RECLASSIFIED'),'cogsOld':field('27292877149086',71,'cost of sales previously reported','YTD_2025_OLD'),'cogsNew':field('27419159265535',71,'cost of sales reclassified','YTD_2025_RECLASSIFIED'),'otherIncomeOld':field('117715311620',71,'other income previously reported','YTD_2025_OLD'),'otherIncomeNew':field('41273669298',71,'other income reclassified','YTD_2025_RECLASSIFIED'),'otherExpenseOld':field('171637813230',71,'other expense previously reported','YTD_2025_OLD'),'otherExpenseNew':field('45355696781',71,'other expense reclassified','YTD_2025_RECLASSIFIED')}
core_delta=(D(reclass['grossRevenueNew'])-D(reclass['grossRevenueOld']))-(D(reclass['cogsNew'])-D(reclass['cogsOld']))
other_delta=(D(reclass['otherIncomeNew'])-D(reclass['otherIncomeOld']))-(D(reclass['otherExpenseNew'])-D(reclass['otherExpenseOld']))
assert core_delta+other_delta==0
oldstock=base['stocks']['2025'];restock=stocks['2025-12-31_RECLASSIFIED']
capital_reclass=sum(D(restock[k])-D(oldstock[k]) for k in ['shortFinancialAssets','longFinancialAssets'])
restatement={'nativeComparatives':reclass,'coreEbitReclassificationDelta':str(core_delta),'otherNetReclassificationDelta':str(other_delta),'allInOperatingEbitDelta':'0','pretaxProfitDelta':'0','openingFinancialAssetClassificationDelta':str(capital_reclass),'treatment':'Use same Q3 presentation for opening/closing current capital. Use core+other net for invariant operating-earnings TTM bridge; do not call the old/new core-EBIT definitions comparable. No raw or canonical historical amount rewritten.','sourcePage':70}
# Parse retained macro/provider tables, and retain original vintage caveats.
class Tables(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.row=None;self.cell=None
 def handle_starttag(self,tag,attrs):
  if tag=='tr':self.row=[]
  if tag in ['td','th']:self.cell=[]
 def handle_data(self,data):
  if self.cell is not None:self.cell.append(data)
 def handle_endtag(self,tag):
  if tag in ['td','th'] and self.cell is not None:
   if self.row is not None:self.row.append(re.sub(r'\s+',' ',' '.join(self.cell)).strip())
   self.cell=None
  if tag=='tr' and self.row is not None:self.rows.append(self.row);self.row=None
source_dir=O/'sources'
def parsed(name):
 p=str((source_dir/name).relative_to(R));pin(p);parser=Tables();parser.feed((R/p).read_text());return parser.rows
countries=parsed('damodaran-country.html');gb=parsed('damodaran-global-beta.html');ub=parsed('damodaran-us-beta.html')
def row_named(rows,name):
 rows=[r for r in rows if r and r[0].strip()==name]
 assert len(rows)==1,(name,len(rows));return rows[0]
def percent(s):return D(s.replace('%','').strip())/100
vn=row_named(countries,'Vietnam');laos=row_named(countries,'Laos');food=row_named(gb,'Food Processing');usfood=row_named(ub,'Food Processing');house=row_named(gb,'Household Products')
assert vn[2:5]==['2.56%','3.90%','8.13%'];assert food[7]=='0.56' and usfood[7]=='0.47' and house[7]=='0.77'
mature=percent(vn[4])-percent(vn[3]);default=percent(vn[2]);country=percent(vn[3]);gov=D('.0443')
hnxpath=str((source_dir/'hnx-oct2026.html').relative_to(R));pin(hnxpath)
hnx=html.unescape((R/hnxpath).read_text());assert '4,43%/năm' in hnx and '06/11/2026' in hnx
hnxreceipt=[r for r in receipts if r.get('path')==hnxpath and r.get('status')==200][-1];assert hnxreceipt['sha256']==sha(hnxpath)
# WACC market equity includes parent market cap plus a disclosed book-NCI proxy for group scope.
market_input_path='docs/fundamental-data-engine/vnm-final-s1-s5-scoring/2026-11-13/VNM_SCORING_INPUTS.json';market_input=read(market_input_path)
assert market_input['price']['sourceField']=='GiaDongCua' and market_input['price']['adjustedFieldEligible'] is False
price=D(market_input['price']['valueVndPerShare']);shares=D(market_input['shares']['value']);assert shares==D('2089955445')
parent_cap=price*shares;group_equity=parent_cap+D(nci)
debt_q3=D(stocks['2026-09-30']['shortDebt'])+D(stocks['2026-09-30']['longDebt']);debt_fy=D(oldstock['shortDebt'])+D(oldstock['longDebt'])
debt24=D(base['stocks']['2024']['shortDebt'])+D(base['stocks']['2024']['longDebt'])
kd_fy=D(base['flows']['2025']['interestExpense'])/((debt24+debt_fy)/2)
kd_ytd=D(flows['2026']['interestExpense'])/((debt_fy+debt_q3)/2)/D('.75')
kd_low=max(kd_fy,gov);kd_high=max(kd_low,kd_ytd)
foreign=field('12147719113096',69,'foreign net sales','NINE_MONTHS_2026');domestic=field('41313476852008',69,'domestic net sales','NINE_MONTHS_2026')
assert D(foreign)+D(domestic)==D(flows['2026']['revenue'])
foreign_fraction=D(foreign)/D(flows['2026']['revenue'])
crp_stress=(1-foreign_fraction)*country+foreign_fraction*percent(laos[3])
wc=[]
for beta,crp,kd,debt,tax in itertools.product([D(usfood[7]),D(food[7]),D(house[7])],[country,crp_stress],[kd_low,kd_high],[D(0),debt_q3,debt_fy],[D('.20'),D('.21')]):
 v=wacc(gov,default,mature,beta,crp,kd,tax,debt,group_equity)
 wc.append({'capitalWeightCase':'ALL_EQUITY_OPERATING_COST_STRESS_NOT_REPORTED_ZERO_DEBT' if debt==0 else 'REPORTED_GROSS_DEBT_PROXY','unleveredBetaProxy':str(beta),'countryPremiumEstimate':str(crp),'grossDebtProxy':str(debt),**v})
wlo=min(D(x['value']) for x in wc);whi=max(D(x['value']) for x in wc)
macro={'governmentYield':{'value':str(gov),'currency':'VND','tenor':'10Y','type':'LAST_OCTOBER_2026_AUCTION_YIELD_NOT_DAILY_SECONDARY_SPOT_OR_DEFAULT_FREE_FACT','economicPeriod':'2026-10','publicationDate':'2026-11-06','source':pin(hnxpath)},'countryTable':{'vietnam':vn,'laosStressReference':laos,'matureErpDerived':str(mature),'providerVintageLabel':'January5_2026; mutable page includes later country updates; no PIT/version inference','source':pin(str((source_dir/'damodaran-country.html').relative_to(R)))},'betaReferences':{'globalFoodProcessing':food,'usFoodProcessing':usfood,'globalHouseholdStress':house,'meaning':'Bottom-up operating-beta proxy estimates from food processing; household consumer products is an adverse adjacent-sector sensitivity, not a measured VNM beta or exact peer set.','source':[pin(str((source_dir/f).relative_to(R))) for f in ['damodaran-global-beta.html','damodaran-us-beta.html']]},'countryExposure':{'primary':'Full Vietnam country ERP as a group operating-location proxy; report says production assets primarily in Vietnam.','adverseEstimate':'Domestic sales retain VN CRP; all foreign sales assigned Laos CRP, one known group operating jurisdiction; this is deliberately adverse, not actual geographic allocation or a mathematical maximum of all countries.','foreignSalesFraction':str(foreign_fraction),'adverseCrp':str(crp_stress)},'tax':{'primary':'0.20','adverse':'0.21','sourcePage':66,'source':pin(str((O/'Q3_SELECTED_PAGES.json').relative_to(R)),'/pages/'+str(pages['pages'].index(pageby[66]))),'reason':'Q3 tax note reports group rates10–21%; use20–21% for this conservative estimate, not a claim all entities pay20%.'},'marketValueReferences':{'price':pin(market_input_path,'/price'),'shares':pin(market_input_path,'/shares'),'noVnm17PromotionOrAdjustedFallback':True},'funding':{'parentMarketCap':str(parent_cap),'NciBookValueProxy':nci,'groupEquityProxy':str(group_equity),'q3Debt':str(debt_q3),'fyDebtSensitivity':str(debt_fy),'fy2025ExpenseImpliedDebtCost':str(kd_fy),'annualizedNineMonth2026ExpenseImpliedDebtCost':str(kd_ytd),'estimatedDebtCostRange':[str(kd_low),str(kd_high)],'zeroDebtStressMeaning':'An all-equity operating-cost stress removes financing tax-shield/weight assumptions for the conservative comparison; does not assert VNM has zero debt or unrestricted net cash.','limitations':'Mixed-currency expense/book-debt proxy, not a quoted marginal lending rate. Sovereign reference floor is a conservative model choice; NCI book value proxies market value; no claim debt stayed unchanged through October.'},'doubleCountControl':'Deduct provider sovereign default estimate once from VND government reference, then add explicit country equity premium once; mature ERP=total VN ERP minus country ERP. No addition of country ERP to total ERP and no TCB beta transfer.','defaultSpreadLimitation':'Rating-based spread is an approximate local sovereign-credit adjustment, not a verified VND CDS or exact currency/tenor-matched spread. Main range is a documented analyst estimate, not guaranteed WACC bounds.','authority':'Research model references/assumptions only; not new F1/F2 source authority or approved observations.'}
# Reuse old qualified annual quantities. Extend tax sensitivity to current report's documented21% upper rate.
annual=[]
for year in range(2022,2026):
 cases=[a for s in old['scenarios'] for a in s['annual'] if a['year']==year]
 for cash,liab,cost in itertools.product([0,1],[0,1],[False,True]):cases.append(rr.annual_return(base['flows'][str(year)],base['stocks'][str(year-1)],base['stocks'][str(year)],D('.21'),cash,liab,cost))
 lo=min(D(a['roicEstimate']) for a in cases);hi=max(D(a['roicEstimate']) for a in cases)
 annual.append({'year':year,'roicSensitivity':[str(lo),str(hi)],'spreadVsCurrentWaccReference':[str(lo-whi),str(hi-wlo)],'robustAcrossTestedCases':lo>whi,'timeMeaning':'Historical reported/normalized sensitivities compared with current-reference WACC estimate; not contemporaneous year-specific WACC or PIT economic profit.'})
# Current nine-month operating return uses exact matching nine-month capital endpoints.
current=[];ytd=flows['2026'];opening=stocks['2025-12-31_RECLASSIFIED'];closing=stocks['2026-09-30']
for t,cash,liab,known_costs,mode in itertools.product([D('.20'),D('.21')],[0,1],[0,1],[False,True],['CORE_ONLY','ALL_IN_OPERATING']):
 ebit=D(ytd['coreEbit']) if mode=='CORE_ONLY' else D(ytd['allInOperatingEbit'])
 costs=D(ytd['noninterestFinanceCost'])+(D(ytd['otherExpense']) if mode=='CORE_ONLY' else D(ytd['otherIncome'])) if known_costs else D(0)
 nopat=(ebit-costs)*(1-t)-D(ytd['fundAppropriation'])
 a=rr.invested_capital(opening,cash,liab);b=rr.invested_capital(closing,cash,liab);ret=period_return(nopat,a['value'],b['value'])
 current.append({'tax':str(t),'cashExclusionFraction':cash,'residualOperatingFraction':liab,'knownCostSensitivity':known_costs,'earningsMode':mode,'nopatNineMonths':str(nopat),'openingCapital':a,'closingCapital':b,'averageCapital':str((D(a['value'])+D(b['value']))/2),'returnNineMonthsNotAnnualized':str(ret)})
retlo=min(D(x['returnNineMonthsNotAnnualized']) for x in current);rethi=max(D(x['returnNineMonthsNotAnnualized']) for x in current)
period_cost_lo=wlo*D('.75');period_cost_hi=whi*D('.75')
# The all-in invariant bridge prevents the documented 2025 reclassification from contaminating TTM core earnings.
f=base['flows']['2025'];fy={'year':2025,'months':12,'scope':'CONSOLIDATED','currency':'VND','allInOperatingEbit':str(D(f['grossProfit'])-D(f['selling'])-D(f['admin'])+D(f['otherIncome'])-D(f['otherExpense'])),'fundAppropriation':f['fundAppropriation'],'otherIncome':f['otherIncome'],'otherExpense':f['otherExpense'],'noninterestFinanceCost':str(max(D(0),D(f['financeExpense'])-D(f['interestExpense'])))}
ttm=ttm_flow(fy,flows['2026'],flows['2025']);ttm_nopat=[]
for t,loss in itertools.product([D('.20'),D('.21')],[False,True]):
 profit=D(ttm['allInOperatingEbit'])-(D(ttm['otherIncome'])+D(ttm['noninterestFinanceCost']) if loss else D(0));ttm_nopat.append({'tax':str(t),'knownCostSensitivity':loss,'value':str(profit*(1-t)-D(ttm['fundAppropriation']))})
# Incremental comparison quantified: class/scope/cash movements and the disclosed stock/earnings reclassification.
incremental=[]
for s in old['scenarios']:
 a,b=s['annual'][-2:];n=D(b['nopatEstimate'])-D(a['nopatEstimate']);d=D(b['closingCapital']['value'])-D(a['closingCapital']['value']);v=incremental_result(n,d,False,False)
 incremental.append({'scenario':s['id'],'deltaNopat':str(n),'deltaCapital':str(d),'openingYearEndCapital':a['closingCapital']['value'],'capitalChangeFraction':str(d/D(a['closingCapital']['value'])),'presentationClassificationAmountForContext':str(capital_reclass),'mixedVintageCapitalDeltaIfNew2025ClassificationWereMisapplied':str(d-capital_reclass),'mixedVintageWarning':'This counterfactual demonstrates classification sensitivity; it is not the actual matched annual capital change.',**v})
multi_year=[]
for scenario in old['scenarios']:
    a,b=scenario['annual'][0],scenario['annual'][-1]
    dn=D(b['nopatEstimate'])-D(a['nopatEstimate']);dc=D(b['closingCapital']['value'])-D(a['closingCapital']['value'])
    multi_year.append({'from':2022,'to':2025,'scenario':scenario['id'],'deltaNopat':str(dn),'deltaBookInvestedCapital':str(dc),'incrementalRatio':None,'reason':'Longer window reduces single-year noise but net-book changes still embed maintenance/depreciation, FX, cash allocation and scope effects; no certified marginal-capital return inferred.'})
acquisition_path='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/vn30-underwriting-v2/acquisition-manifest.json'
acquisition=read(acquisition_path)
matching=[(j,r) for j,r in enumerate(acquisition['rows']) if r.get('ticker')=='VNM' and r.get('pdfPath')==pages['pdfPath'] and r.get('sha256')==pages['pdfSha256']]
assert len(matching)==1
original_receipt={'binding':pin(acquisition_path,'/rows/'+str(matching[0][0])),'record':matching[0][1]}
stress_hurdles=[]
for stress in [D('.12'),D('.15'),D('.18')]:
    stress_hurdles.append({'annualCostStress':str(stress),'historicalMinimumSpread':str(min(D(a['roicSensitivity'][0]) for a in annual)-stress),'currentNineMonthMinimumSpread':str(retlo-stress*D('.75')),'classification':'ROBUSTNESS_STRESS_ONLY_NOT_SOURCED_WACC_ESTIMATE_OR_APPROVED_REQUIRED_RETURN','origin':'Existing retained VNM conditional discount-rate grid, reused as stress axes only; does not qualify the WACC model.'})
inputs={'contract':'vnm-s1-wacc-current-inputs-v1','baseline':old['baseline'],'ticker':'VNM','purpose':'CURRENT_RETROSPECTIVE_RESEARCH_NOT_PIT','economicCutoff':'2026-10-30','q3Source':{'path':pages['pdfPath'],'sha256':pages['pdfSha256'],'retrievalEvidence':original_receipt,'reviewedAt':pages['reviewedAt'],'publicationNotInferredFromSignatureDate':True},'stocks':stocks,'flows':flows,'selectedFields':selected,'restatementBridge':restatement,'macroAndWaccInputs':macro,'sourceReceipts':receipts,'earlierCanonicalFactsRequalified':False,'formalSourceAdmissionGranted':False}
write('WACC_Q3_INPUTS.json',inputs)
result={'contract':'vnm-s1-wacc-current-assessment-v1','status':'FOUR_REQUESTED_ACTIONS_COMPLETED','wacc':{'low':str(wlo),'high':str(whi),'currency':'VND','scope':'CONSOLIDATED','basis':'NOMINAL_UNLEVERED_COMPATIBLE_ESTIMATE_WITH_RECORDED_PROXY_LIMITS','classification':'TRACEABLE_ANALYST_ESTIMATE_RANGE_NOT_OBSERVED_OR_FORMALLY_ADMITTED','modelCount':len(wc),'scenarios':wc,'sourceGapDisposition':'S1_CAPITAL_COST_RANGE_RESOLVED_AT_ANALYTICAL_ESTIMATE_LEVEL; no default hurdle used'},'annualRoicComparison':annual,'additionalCostStressHurdles':stress_hurdles,'q3CurrentPeriod':{'status':'RETAINED_Q3_REVIEWED_AND_RECONCILED','latestKnownPeriod':'NINE_MONTHS_TO_2026_09_30','sourcePeriodScopeVerified':True,'scenarios':current,'returnNineMonthsRange':[str(retlo),str(rethi)],'capitalChargeNineMonthsRange':[str(period_cost_lo),str(period_cost_hi)],'conservativeSpreadNineMonths':str(retlo-period_cost_hi),'convention':'Actual nine-month NOPAT/average matching nine-month capital versus0.75*annual WACC capital charge. Neither quarter-only profit nor an annualized nine-month ROIC is substituted for TTM.','restatementBridge':restatement,'TTM':{'from':'2025-10-01','through':'2026-09-30','operatingFlowBridge':ttm,'nopatSensitivity':ttm_nopat,'roic':None,'status':'TTM_NOPAT_ESTIMATED; TTM_ROIC_N_R_EXACT_OPENING_CAPITAL_UNAVAILABLE','exactMissing':'Consolidated same-basis operating-capital population at2025-09-30; equity alone in note21 is insufficient. Do not use2025-12-31 as a twelve-month opening balance. No new PDF demanded.'}},'incrementalComparability':{'status':'ASSESSED_N_R_RETAINED','matchedHistoricalChanges':incremental,'multiYear2022to2025Changes':multi_year,'reasons':['Annual capital changes are sensitive to operating-cash/residual-liability allocation; goodwill amortization, FX and scope/carrying changes have not been isolated into an economically comparable incremental denominator.','2026 opening financial-asset reclassification is quantified separately; it is not a new investment or an annual2025 economic capital flow.','A small/distorted book-capital change must not generate spurious incremental ROIC under M3 §6.3. Aggregate reconciliation or a supported range can suffice; no exact project/factory attribution demanded.'],'numericalIncrementalRoic':None,'notAutomaticZeroOrMidpoint':True},'S1Disposition':{'capitalCostInput':'RESOLVED_WITH_SUPPORTED_ESTIMATE_AND_EXPLICIT_LIMITATIONS','historicalReturnSpread':'POSITIVE_ACROSS_TESTED_SOURCED_AND_CONSERVATIVE_ASSUMPTIONS','currentQuarterFreshness':'Q3_CURRENT_UPDATE_COMPLETED; exact TTM ROIC remains N/R','overall':'BOUNDED_ECONOMIC_ASSESSMENT_SUPPORTED; NOT_FORMAL_SCORING_ADMISSION_OR_FULL_VNM_CLOSURE','S1FormalClosureGranted':False,'reason':'This completes the requested analytical work and resolves the absent benchmark; proxy/model and incremental/TTM N/R limitations are retained. No authority or completed formal rubric score is invented.'},'dataConfidence':{'historicalQuantityLineage':'REUSED_UNCHANGED','q3SelectedCells':'TEXT_GEOMETRY_AND_IMAGE_CHECKED_WITH_STATEMENT_RECONCILIATIONS','waccEstimate':'MEDIUM; country/beta/debt/NCI/currency/tenor proxy sensitivities explicit, not guaranteed bounds','normalization':'BOUNDED_SENSITIVITY; all-in bridge invariant to documented presentation reclassification; recurring economic uncertainty retained'},'totalScore':None,'M3Changes':False,'newAdmissions':0,'portfolioChanges':False,'productionActivation':'NOT_AUTHORIZED'}
write('WACC_ROIC_Q3_ASSESSMENT.json',result)
write('S1_CURRENT_DISPOSITION.json',{'contract':'vnm-s1-current-analytical-disposition-v1','supersedesFinding':{'path':PRE+'S1_ECONOMIC_RETURNS.json','finding':'S1_CAPITAL_COST_RANGE_UNAVAILABLE'},'currentFinding':'RESOLVED_WITH_DOCUMENTED_WACC_ESTIMATE_RANGE','waccRange':[str(wlo),str(whi)],'annualAndCurrentEconomicSpread':'POSITIVE_WITHIN_TESTED_ESTIMATE_AND_NORMALIZATION_CASES','currentQ3':'REVIEWED_WITH_QUANTIFIED_RECLASSIFICATION','incrementalRoic':'N_R_SPECIFIC_COMPARABILITY_AND_MATERIALITY_LIMIT','ttmRoic':'N_R_SAME_BASIS_OPENING_2025_09_30_CAPITAL_NOT_ESTABLISHED','formalS1ScoringAdmission':'NOT_GRANTED','fullVnmProductionScoringClosure':False,'newSourceAuthorityGranted':False,'VNM17Promoted':False,'nextMandatoryUserSourceApproval':None,'noNewMilestonesOrGenericSourceDiscovery':True})
# Report is the current handoff; original S1 calculation/evidence stays unchanged for audit.
pct=lambda x:f'{D(x)*100:.2f}%';pp=lambda x:f'{D(x)*100:.2f} pp';tn=lambda x:f'{D(x)/D(10)**12:.3f}'
md('FINAL_REVIEW.md',f'''# VNM S1 — WACC, capital efficiency and Q3 update

**All four requested actions completed. Estimated nominal-VND group WACC: {pct(wlo)}–{pct(whi)}.** This resolves `S1_CAPITAL_COST_RANGE` at the documented analytical-estimate level. The range is not an observed WACC, a guaranteed bound, formal source admission or a final VNM score. Original qualified facts and prior S1 outputs remain unchanged.

## WACC inputs and construction

- [HNX October2026 government-bond report](https://hnx.vn/vi-vn/chi-tiet-tin-60023812-0.html), published6November: final monthly10Y auction yield4.43%. It is neither an exact30Oct secondary-market quote nor certified default-free. Successful verified-TLS curl capture, hash and original failed attempts are retained.
- [Damodaran country table](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/ctryprem.html): VN default-spread estimate2.56%, country equity premium3.90%, total ERP8.13%; mature ERP4.23% derived. Current downloaded version has a January2026 label and mixed update dates; this is a retrospective current-reference estimate, not PIT or an exact historical-vintage certification.
- [Global industry beta table](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/BetasGlobal.html) and [US table](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/Betas.html): cash-corrected unlevered food-processing proxies0.56 and0.47; adjacent household-products0.77 is an adverse consumer-risk sensitivity. These are estimates applied to VNM's operating economics, not a measured VNM regression beta or a change to the registered RETAIL sector.
- VNM financing: market parent equity {tn(parent_cap)}tn VND at retained raw close56,900 and2,089,955,445 shares; book NCI {tn(nci)}tn as a disclosed group-equity proxy. Gross debt {tn(debt_q3)}tn at30Sep2026 and {tn(debt_fy)}tn FY2025 sensitivity. These are source-date proxies, not a claim October debt was unchanged.
- Debt-cost proxy: FY2025 interest/average debt={pct(kd_fy)}; nine-month2026 expense/average debt, annualized only for financing-cost comparability={pct(kd_ytd)}. Model range {pct(kd_low)}–{pct(kd_high)} uses the sovereign reference floor and observed carrying-cost proxy; it is not a quoted forward VND borrowing rate. Mixed currency, average-balance approximation and tax shield are disclosed.

`Rf estimate = government reference − provider sovereign default estimate`.

`Ke = Rf + betaU×[1+(1−tax)D/E]×mature ERP + country equity premium`.

`WACC = E/(D+E)×Ke + D/(D+E)×Kd×(1−tax)`.

Country equity risk is added **once**; total ERP is not added again. The rating-based default adjustment is an approximation, not a measured tenor/currency-matched CDS spread. Full-Vietnam exposure is the primary operating-location proxy, supported by the report's production-location narrative. The adverse country case assigns all foreign-sales share ({pct(foreign_fraction)}) to Laos country risk, a known group operating jurisdiction. That is an explicit adverse assumption, not VNM's actual country allocation or a universal maximum. No arbitrary beta1, TCB beta, issuer spread or15% cost default is used. An all-equity operating-cost stress also removes financing/tax-shield assumptions without asserting debt is actually zero. Market weights/NCI, leverage, tax20–21% and proxy ranges are all retained in {len(wc)} reproducible scenarios.

## ROIC versus conservative WACC

{table(['Year','ROIC sensitivity','Conservative spread vs WACC high'],[[a['year'],pct(a['roicSensitivity'][0])+'–'+pct(a['roicSensitivity'][1]),pp(a['spreadVsCurrentWaccReference'][0])] for a in annual])}

Existing annual ROIC sensitivities are reused; a21% tax stress is added from the current report's disclosed tax range. The historical returns exceed the current-reference WACC range in every tested scenario. This supports a positive economic-return spread **under the stated estimates**; it does not prove contemporaneous historical WACC, future persistence or an exact normalized fair value. Earnings/core-cost/fund/capital ranges retain their prior analytical limitations, including leases on the reported-expense basis. No rubric points follow automatically from the numerical spread. As an extra robustness check, the existing12/15/18% discount grid is reused strictly as unsourced stress hurdles, never as the estimated WACC: even at18%, the tested historical minimum spread is {pp(min(D(a['roicSensitivity'][0]) for a in annual)-D('.18'))} and the current9M minimum spread is {pp(retlo-D('.18')*D('.75'))}. These scenarios do not certify an upper bound on real capital costs.

## Q3/2026 now incorporated

Selected source: retained consolidated report `data/manual-download/VNM/2026-11-02-remediation/565717-Q3_2026.pdf`, physical pages7–12 and named notes. Native text was absent; only relevant pages were locally OCRed, and selected captions/columns were checked against images. Direct PDF/page/line-box references, original SHA, original acquisition receipt and review time are preserved. New extraction remains analytical evidence, not an automatic financial-admission receipt.

Current nine-month revenue {tn(flows['2026']['revenue'])}tn, gross profit {tn(flows['2026']['grossProfit'])}tn, core EBIT {tn(flows['2026']['coreEbit'])}tn and total-group fund appropriation {tn(flows['2026']['fundAppropriation'])}tn. Group NPAT is {tn(flows['2026']['netProfit'])}tn; parent/NCI profits and quarter-only versus nine-month columns are not interchanged. Funds are charged once, not both appropriation and cash use.

The report reclassifies the prior9M2025 presentation: core EBIT shifts {tn(core_delta)}tn and other net income offsets {tn(other_delta)}tn; combined operating EBIT and pretax profit are unchanged. Opening financial assets reclassify by {tn(capital_reclass)}tn. This is a presentation/operating-capital mapping change, not new capital deployed. Current opening and closing capital therefore use the same report's reclassified basis; biological assets are not dropped or double-counted. Old canonical/annual evidence is preserved rather than overwritten.

Nine-month operating-return sensitivity: **{pct(retlo)}–{pct(rethi)}**, unannualized, on matching31Dec2025/30Sep2026 capital. Nine-month capital charge at0.75×WACC: **{pct(period_cost_lo)}–{pct(period_cost_hi)}**. Conservative period spread: **{pp(retlo-period_cost_hi)}**. This is a nine-month economic-capital comparison, not a TTM return or an IRR.

TTM operating earnings/NOPAT are bridged as FY2025+9M2026−9M2025 using the operating-EBIT-plus-other-net definition invariant to the disclosed reclassification. The finance-cost bridge uses matched net noninterest-cost flows; the FY2025 annual credit reversal is not assigned to a quarter without supporting allocation. **TTM ROIC stays N/R** because a same-basis30Sep2025 operating-capital population is not established in selected retained inputs; the equity movement table alone is insufficient. Substituting31Dec2025 for the twelve-month opening date would be wrong. No new PDF request is created by this N/R result.

## Incremental capital efficiency

Annual and FY2022→FY2025 multi-year changes in normalized earnings and book capital are quantified across consistent cash/liability/tax scenarios. Applying the new opening-financial-asset classification to just one annual endpoint would shift incremental capital by0.538tn and can reverse its sign in some scenarios; that counterfactual is explicitly separated from actual economic investment. The added bridge separates the current presentation change from historical capital growth. FX, goodwill amortization, acquisitions/scope and working-capital/nonoperating allocation are not sufficiently isolated to certify a material, comparable incremental denominator; M3 §6.3 therefore retains **incremental ROIC=N/R**. No ratio on a small/distorted denominator, project failure, zero or midpoint is inferred. An aggregate reconciliation can suffice; factory/project attribution is not demanded.

## Final disposition

The previously absent WACC comparator is now replaced by a traceable analyst estimate with explicit limitations; the four requested calculations/checks are delivered. Positive historical and current-period spreads hold within the tested assumptions. This is a bounded S1 economic assessment, **not formal S1 scoring admission or full VNM production closure**. Incremental ROIC and exact TTM ROIC remain N/R for their specific comparability/period reasons; they do not trigger another generic source-discovery phase. Existing source authority, pending VNM17, R1/R4, M3 weights, M1 and production permissions remain unchanged. No score, portfolio transaction, NAV mutation or production activation is written.

Outputs: WACC_Q3_INPUTS.json, WACC_ROIC_Q3_ASSESSMENT.json, Q3_SELECTED_PAGES.json, source captures/receipts and VALIDATION.json. Focused tests and deterministic replay verify arithmetic, restatement invariance, period/scope guards, nonduplication of country/fund costs and unchanged protected bytes.
''')
write('SOURCE_PINS.json',{'files':[pin(p) for p in sorted(PINS)],'scripts':[pin(str(p.relative_to(R))) for p in sorted(O.glob('*.py'))],'protectedDatabase':{'path':'data/vn30.sqlite','sha256':sha('data/vn30.sqlite')},'protectedAccountFiles':[{'path':str(p.relative_to(R)),'sha256':sha(str(p.relative_to(R)))} for p in sorted((R/'data/account-current').glob('*.json'))]})
print(json.dumps({'waccRange':[str(wlo),str(whi)],'annualConservativeSpreadMin':str(min(D(a['spreadVsCurrentWaccReference'][0]) for a in annual)),'q3ReturnNineMonths':[str(retlo),str(rethi)],'selectedQ3Fields':len(selected),'ttmRoic':None,'incrementalRoic':None}))
