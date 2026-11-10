"""Isolated Decimal-only TCB hypothetical sandbox. No I/O, network or production imports."""
from decimal import Decimal,localcontext
D=Decimal
LABELS=['RESEARCH_ONLY','HYPOTHETICAL','NOT_AN_APPROVED_INTRINSIC_VALUE','NOT_FOR_M3_M4_OR_PRODUCTION']
PARAMS={'roe':'ANNUAL_RATIO','ke':'ANNUAL_RATIO','growth':'ANNUAL_RATIO','payout':'RATIO','forwardCreditCost':'ANNUAL_RATIO','fundingSpreadShock':'ANNUAL_RATIO','taxRate':'RATIO','commonIncidence':'RATIO','regulatoryTarget':'RATIO','commonBookRwaTarget':'RATIO','managementBuffer':'RATIO','rwaGrowth':'ANNUAL_RATIO','eligibleRetentionFraction':'RATIO','capitalDeductions':'VND','capitalLosses':'VND','terminalRoe':'ANNUAL_RATIO','terminalGrowth':'ANNUAL_RATIO','terminalKe':'ANNUAL_RATIO','transitionHorizon':'YEARS_INTEGER','newShares':'SHARES','netNewCommonCash':'VND'}

def dec(x):
 if not isinstance(x,str):raise ValueError('LOSSLESS_DECIMAL_STRING_REQUIRED')
 try:d=D(x)
 except Exception as e:raise ValueError('DECIMAL_REQUIRED') from e
 if not d.is_finite():raise ValueError('FINITE_REQUIRED')
 return d

def txt(x):return format(x,'f')
def check_labels(labels):
 if not isinstance(labels,list) or len(labels)!=len(LABELS) or set(labels)!=set(LABELS):raise ValueError('MISLEADING_OR_MISSING_OUTPUT_LABEL')

def validate(s):
 name=s['name'];p=s['inputs'];out={}
 if name not in ['BEAR','BASE','BULL']:raise ValueError('SCENARIO_NAME')
 if set(p)!=set(PARAMS):raise ValueError('EXACT_INPUT_CONTRACT_REQUIRED')
 for k,unit in PARAMS.items():
  item=p[k]
  if item.get('classification')!='HYPOTHETICAL_ASSUMPTION' or item.get('unit')!=unit or item.get('applicableScenario')!=name:raise ValueError('CLASSIFICATION_UNIT_OR_SCENARIO')
  if not all(key in item for key in ['rationale','evidenceStatus','ownerApprovalStatus','sensitivityRange']):raise ValueError('ASSUMPTION_METADATA')
  if item['ownerApprovalStatus'] not in ['SANDBOX_SCOPE_ONLY_NOT_NUMERICAL_ECONOMICS_APPROVED','APPROVED_CONDITIONAL_RESTRICTION_NOT_PREDICTION']:raise ValueError('FALSE_NUMERICAL_APPROVAL')
  out[k]=dec(item['value'])
 for k in ['roe','ke','growth','payout','forwardCreditCost','fundingSpreadShock','taxRate','commonIncidence','regulatoryTarget','commonBookRwaTarget','managementBuffer','rwaGrowth','eligibleRetentionFraction','terminalRoe','terminalGrowth','terminalKe']:
  if not 0<=out[k]<=1:raise ValueError('NONNEGATIVE_UNIT_RATIO_REQUIRED:'+k)
 for k in ['capitalDeductions','capitalLosses']:
  if out[k]<0:raise ValueError('NEGATIVE_CAPITAL_DEDUCTION')
 h=out['transitionHorizon']
 if h!=h.to_integral_value() or h<1 or h>50:raise ValueError('HORIZON_1_TO_50_INTEGER')
 if out['newShares']!=0 or out['netNewCommonCash']!=0:raise ValueError('NO_NEW_ISSUANCE_CONSTANT_STATE_RESTRICTION')
 if out['capitalLosses']!=0:raise ValueError('CAPITAL_LOSS_DOUBLECOUNT_REQUIRES_SEPARATE_BRIDGE')
 if s.get('stressAccounting')!='ALL_IN_ROE_DIAGNOSTIC_ONLY' or s.get('fundingRiskAddedToKe') is not False:raise ValueError('CREDIT_FUNDING_DOUBLE_COUNT')
 if out['terminalRoe']!=out['roe'] or out['terminalGrowth']!=out['growth'] or out['terminalKe']!=out['ke']:raise ValueError('CONSTANT_STATE_TERMINAL_MUST_MATCH')
 if not 0<out['regulatoryTarget']+out['managementBuffer']<=1:raise ValueError('CAPITAL_TARGET_PLUS_BUFFER')
 validate_economics(out['roe'],out['ke'],out['growth'],out['payout'])
 return out

def validate_economics(r,k,g,p):
 if k<=0 or k<=g:raise ValueError('KE_POSITIVE_AND_ABOVE_G')
 if r<=g:raise ValueError('ROE_ABOVE_G')
 if not 0<=p<=1 or g<0 or r<0:raise ValueError('ROE_G_PAYOUT_DOMAIN')
 if abs(g-r*(1-p))>D('1e-50'):raise ValueError('G_ROE_PAYOUT_INCONSISTENT')

def pb(r,k,g,p,unstable=D('0.005'),extreme=D('5')):
 with localcontext() as c:
  c.prec=70;validate_economics(r,k,g,p);den=k-g;value=(r-g)/den;flags=[]
  if den<=unstable:flags.append('UNSTABLE_KE_MINUS_G')
  if value>=extreme:flags.append('EXTREME_HYPOTHETICAL_PB')
  return dict(hypotheticalPB=txt(value),denominator=txt(den),exactFraction=dict(numerator=txt(r-g),denominator=txt(den)),flags=flags)

def ri(book,r,k,g,h):
 with localcontext() as c:
  c.prec=70;b=book;pv=D(0);discount=D(1);flows=[]
  for year in range(1,h+1):
   income=(r-k)*b;discount*=1+k;pv+=income/discount;flows.append(dict(year=year,openingBook=txt(b),hypotheticalResidualIncome=txt(income),discountFactor=txt(discount)));b*=1+g
  terminal=(r-k)*b/(k-g)
  return dict(hypotheticalEquityValue=txt(book+pv+terminal/discount),terminalBook=txt(b),terminalResidualIncomeValueAtHorizon=txt(terminal),flows=flows,interpretation='Constant-state RI/PB arithmetic consistency, not an independent valuation crosscheck')

def capital(x,anchors):
 with localcontext() as c:
  c.prec=70;b=dec(anchors['commonBook']['value']);reg=dec(anchors['regulatoryCapital']['value']);rwa=dec(anchors['rwa']['value']);target=x['regulatoryTarget']+x['managementBuffer'];rows=[];fails=[]
  initialCar=reg/rwa
  initialCommonRatio=b/rwa
  if initialCar<target or initialCommonRatio<x['commonBookRwaTarget']:fails.append(0)
  for y in range(1,int(x['transitionHorizon'])+1):
   earnings=b*x['roe'];retained=earnings*(1-x['payout']);eligible=retained*x['eligibleRetentionFraction'];deduction=x['capitalDeductions'] if y==1 else D(0)
   reg+=eligible-deduction;rwa*=1+x['rwaGrowth'];b*=1+x['growth'];car=reg/rwa
   if reg<0 or car<target or b/rwa<x['commonBookRwaTarget']:fails.append(y)
   rows.append(dict(year=y,hypotheticalCommonBook=txt(b),hypotheticalCommonEarnings=txt(earnings),hypotheticalRetainedCommonEarnings=txt(retained),hypotheticalEligibleRetention=txt(eligible),hypotheticalCapitalDeductions=txt(deduction),hypotheticalCapitalLosses='0',hypotheticalRegulatoryCapital=txt(reg),hypotheticalRwa=txt(rwa),hypotheticalCar=txt(car),hypotheticalCommonBookRwaRatio=txt(b/rwa),hypotheticalCommonBookRwaTarget=txt(x['commonBookRwaTarget']),hypotheticalTargetWithBuffer=txt(target),status='CAPITAL_INFEASIBLE' if reg<0 or car<target or b/rwa<x['commonBookRwaTarget'] else 'HYPOTHETICAL_HORIZON_CAPITAL_PASS'))
  terminalLimit=None;terminalStatus='NOT_DEMONSTRATED_FOR_NONMATCHED_GROWTH'
  if x['growth']==x['rwaGrowth'] and x['growth']>0:
   terminalLimit=x['eligibleRetentionFraction']*dec(anchors['commonBook']['value'])/dec(anchors['rwa']['value']);terminalStatus='HYPOTHETICAL_CONSTANT_STATE_LIMIT_PASS' if terminalLimit>=target and initialCommonRatio>=x['commonBookRwaTarget'] else 'CAPITAL_INFEASIBLE'
  elif x['rwaGrowth']>x['growth']:
   terminalLimit=D(0);terminalStatus='CAPITAL_INFEASIBLE'
  status='CAPITAL_INFEASIBLE' if fails or terminalStatus=='CAPITAL_INFEASIBLE' else 'HYPOTHETICALLY_CAPITAL_FEASIBLE' if terminalStatus=='HYPOTHETICAL_CONSTANT_STATE_LIMIT_PASS' else 'CAPITAL_NOT_DEMONSTRATED'
  return dict(status=status,initialCar=txt(initialCar),commonBookRwaTarget=txt(x['commonBookRwaTarget']),commonAccountingRatioNotCet1=True,targetWithBuffer=txt(target),failingYears=fails,rows=rows,hypotheticalLongRunCarLimit=txt(terminalLimit) if terminalLimit is not None else None,terminalStatus=terminalStatus,empiricallyQualified=False,scope='Hypothetical eligible retention/one-time prudential deduction/RWA path only; no liquidity or actual regulatory acceptance',Tier1EqualsCet1=False)

def run_scenario(s,anchors,controls):
 with localcontext() as ctx:
  ctx.prec=70;x=validate(s);book=dec(anchors['commonBook']['value']);shares=dec(anchors['closingShares']['value'])
  if book<=0 or shares<=0 or shares!=shares.to_integral_value():raise ValueError('BOOK_SHARES_UNIT_DOMAIN')
  result=pb(x['roe'],x['ke'],x['growth'],x['payout'],dec(controls['unstableDenominator']['value']),dec(controls['extremePb']['value']));eq=book*dec(result['hypotheticalPB']);cap=capital(x,anchors)
  avg=(dec(anchors['coreLoans2024']['value'])+dec(anchors['coreLoans2025']['value']))/2;reportedCharge=dec(anchors['customerProvision2025']['value']);creditPre=x['forwardCreditCost']*avg-reportedCharge
  creditCommon=creditPre*(1-x['taxRate'])*x['commonIncidence'];fundingPre=x['fundingSpreadShock']*dec(anchors['fundingExposure']['value']);fundingCommon=fundingPre*(1-x['taxRate'])*x['commonIncidence'];modelEarnings=book*x['roe'];preStressRoe=(modelEarnings+creditCommon+fundingCommon)/book
  result.update(scenario=s['name'],ticker='TCB',labels=list(LABELS),classification='HYPOTHETICAL',historicalAnchorRefs={k:a['provenance'] for k,a in anchors.items() if isinstance(a,dict) and 'provenance' in a},hypotheticalAssumptions=s,hypotheticalEquityValue=txt(eq),hypotheticalPerShareModelValue=txt(eq/shares),formula='B0×(ROE−g)/(ke−g); g=ROE×(1−payout); per-share uses closing ordinary shares',constantStateRiCheck=ri(book,x['roe'],x['ke'],x['growth'],int(x['transitionHorizon'])),hypotheticalCommonEarnings=txt(modelEarnings),stressReconciliation=dict(mode='ALL_IN_ROE_DIAGNOSTIC_ONLY',reportedHistoricalCreditCharge=txt(reportedCharge),historicalCreditCost=anchors['reportedCreditCost']['value'],hypotheticalForwardCreditCost=txt(x['forwardCreditCost']),fixedHistoricalAverageCoreLoans=txt(avg),hypotheticalPretaxCreditExpenseDelta=txt(creditPre),hypotheticalTaxRate=txt(x['taxRate']),hypotheticalCommonIncidence=txt(x['commonIncidence']),hypotheticalCommonCreditDelta=txt(creditCommon),hypotheticalFundingSpread=txt(x['fundingSpreadShock']),historicalFundingPocketProxy=anchors['fundingExposure']['value'],hypotheticalPretaxFundingDelta=txt(fundingPre),hypotheticalCommonFundingDelta=txt(fundingCommon),reconciledHypotheticalPreStressRoe=txt(preStressRoe),allInRoeUsedByModel=txt(x['roe']),stressSubtractedAgain=False,fundingAddedToKe=False),capitalFeasibility=cap,economicAdmissibility='REJECTED_CAPITAL_INFEASIBLE' if cap['status']=='CAPITAL_INFEASIBLE' else 'CONDITIONAL_HYPOTHETICAL_ONLY_NOT_EMPIRICALLY_ADMISSIBLE',economicLimitations=['Illustrative economic choices, not qualified sustainable forecasts or owner-approved numerical economics','Accounting book is not TCE or unrestricted distributable capital','Historical credit anchors are not tail-loss bounds; funding proxy is a closing issued-instrument pocket, not average funding cost','Constant-state terminal/horizon assumptions and capital conversion are hypothetical','No selected live/historical price, MOS, expected return, recommendation or independent economic crosscheck'],validationStatus='MATHEMATICAL_PASS_WITH_FLAGS' if result['flags'] else 'MATHEMATICAL_PASS',approvedIntrinsicValue=None,targetPrice=None,marginOfSafety=None,expectedReturn=None,selectedPrice=None,formalM3Points=None,formalM3Total=None,ranking=None,M4Decision=None,productionAdmissible=False)
  local=[]
  for axis,delta in [('roe',D('-0.02')),('roe',D('0.02')),('ke',D('-0.01')),('ke',D('0.01'))]:
   rr=x['roe']+delta if axis=='roe' else x['roe'];kk=x['ke']+delta if axis=='ke' else x['ke'];gg=x['growth'];pp=1-gg/rr
   try:
    z=pb(rr,kk,gg,pp,dec(controls['unstableDenominator']['value']),dec(controls['extremePb']['value']));local.append(dict(axis=axis,change=txt(delta),roe=txt(rr),ke=txt(kk),growth=txt(gg),payout=txt(pp),hypotheticalPB=z['hypotheticalPB'],hypotheticalPerShareModelValue=txt(book*dec(z['hypotheticalPB'])/shares),flags=z['flags'],status='HYPOTHETICAL_MATH_ONLY'))
   except ValueError as e:local.append(dict(axis=axis,change=txt(delta),status='INVALID_ECONOMIC_COMBINATION',hypotheticalPB=None,error=str(e)))
  result['sensitivityResults']=dict(localOneAtATime=local,fiveTableResultsRef='sensitivity-results.json',localBasis='Hold g fixed and derive payout; no additional capital or economic acceptance implied',classification='HYPOTHETICAL')
  result['historicalReportedOrdinaryCommonEarnings']=anchors['ordinaryEpsNumerator']['value']
  return result

def sensitivities(config,anchors):
 with localcontext() as ctx:
  ctx.prec=70;base=next(s for s in config['scenarios'] if s['name']=='BASE');x=validate(base);grid=config['sensitivityGrids'];tables={};book=dec(anchors['commonBook']['value']);shares=dec(anchors['closingShares']['value'])
  def cell(r,k,g,p,axes):
   try:
    v=pb(r,k,g,p,dec(config['controls']['unstableDenominator']['value']),dec(config['controls']['extremePb']['value']));return dict(**axes,status='HYPOTHETICAL_MATH_ONLY',growth=txt(g),payout=txt(p),hypotheticalPB=v['hypotheticalPB'],hypotheticalPerShareModelValue=txt(book*dec(v['hypotheticalPB'])/shares),flags=v['flags'],capitalFeasibility='NOT_TESTED_IN_THIS_PRICE_SENSITIVITY')
   except ValueError as e:return dict(**axes,status='INVALID_ECONOMIC_COMBINATION',hypotheticalPB=None,hypotheticalPerShareModelValue=None,error=str(e))
  rs=list(map(dec,grid['roe']['value']));ks=list(map(dec,grid['ke']['value']));gs=list(map(dec,grid['growth']['value']));ps=list(map(dec,grid['payout']['value']))
  tables['roeVsKe']=[cell(r,k,x['growth'],1-x['growth']/r,dict(roe=txt(r),ke=txt(k))) for r in rs for k in ks]
  tables['growthVsKe']=[cell(x['roe'],k,g,1-g/x['roe'],dict(growthInput=txt(g),ke=txt(k))) for g in gs for k in ks]
  tables['payoutVsRoe']=[cell(r,x['ke'],r*(1-p),p,dict(roe=txt(r),payoutInput=txt(p))) for p in ps for r in rs]
  avg=(dec(anchors['coreLoans2024']['value'])+dec(anchors['coreLoans2025']['value']))/2
  tables['creditVsCommonEarnings']=[]
  for rate in map(dec,grid['creditCost']['value']):
   e=book*x['roe']-(rate-x['forwardCreditCost'])*avg*(1-x['taxRate'])*x['commonIncidence'];tables['creditVsCommonEarnings'].append(dict(hypotheticalCreditCost=txt(rate),hypotheticalCommonEarnings=txt(e),hypotheticalRoe=txt(e/book),status='HYPOTHETICAL_COMMON_LOSS' if e<0 else 'HYPOTHETICAL_ONLY',baseline='Hold reconciled pre-stress economics/funding fixed; change credit once relative to BASEforward credit cost',notQualifiedForecast=True))
  tables['capitalTargetVsRwaGrowth']=[]
  for target in map(dec,grid['capitalTarget']['value']):
   for growth in map(dec,grid['rwaGrowth']['value']):
    y=dict(x,regulatoryTarget=target,rwaGrowth=growth);cap=capital(y,anchors);tables['capitalTargetVsRwaGrowth'].append(dict(hypotheticalRegulatoryTarget=txt(target),managementBuffer=txt(x['managementBuffer']),hypotheticalRwaGrowth=txt(growth),status=cap['status'],failingYears=cap['failingYears'],terminalStatus=cap['terminalStatus'],lastYearCar=cap['rows'][-1]['hypotheticalCar']))
  return dict(labels=list(LABELS),classification='HYPOTHETICAL',tables=tables,basis='BASEanchors; grids illustrative. ROE/ke holds g fixed and derives payout; growth/ke holds ROE fixed and derives payout; payout/ROEderives g. Price surfaces do not certify capital.',noMarketPrice=True)

def run(config,anchors):
 if set(config)!={'schema','ticker','labels','marketPrice','scenarios','controls','sensitivityGrids'}:raise ValueError('EXACT_ROOT_CONFIG_NO_FORMAL_OR_PRICE_FIELDS')
 if config.get('ticker')!='TCB' or anchors.get('ticker')!='TCB':raise ValueError('TCB_ONLY')
 check_labels(config['labels'])
 if config.get('marketPrice') is not None:raise ValueError('NO_MARKET_PRICE_ALLOWED')
 if {s['name'] for s in config['scenarios']}!={'BEAR','BASE','BULL'} or len(config['scenarios'])!=3:raise ValueError('EXACT_THREE_SCENARIOS')
 for k in ['commonBook','regulatoryCapital','rwa','coreLoans2024','coreLoans2025','customerProvision2025','fundingExposure']:
  if anchors[k].get('classification')!='HISTORICAL_QUALIFIED_ANCHOR':raise ValueError('HISTORICAL_ANCHOR_CLASSIFICATION')
  if anchors[k]['unit']!='VND' or dec(anchors[k]['value'])<=0:raise ValueError('ANCHOR_CURRENCY_UNIT')
 if anchors['closingShares']['originalRecord']['key']!='CLOSING_SHARES' or anchors['commonBook']['originalRecord']['key']!='PARENT_EQUITY':raise ValueError('CLOSING_COMMON_BOOK_DEFINITION')
 if anchors['closingShares']['unit']!='SHARES':raise ValueError('CLOSING_SHARES_UNIT')
 for item in list(config['controls'].values())+list(config['sensitivityGrids'].values()):
  if item['classification']!='HYPOTHETICAL_ASSUMPTION' or not all(k in item for k in ['unit','rationale','evidenceStatus','ownerApprovalStatus','sensitivityRange','applicableScenario']):raise ValueError('GRID_CONTROL_METADATA')
  if item['ownerApprovalStatus']!='SANDBOX_SCOPE_ONLY_NOT_NUMERICAL_ECONOMICS_APPROVED':raise ValueError('FALSE_NUMERICAL_APPROVAL')
  vals=item['value'] if isinstance(item['value'],list) else [item['value']]
  for value in vals:
   if dec(value)<0:raise ValueError('NEGATIVE_GRID_CONTROL')
 if config['controls']['unstableDenominator']['unit']!='RATIO' or config['controls']['extremePb']['unit']!='PB':raise ValueError('CONTROL_UNIT')
 if set(config['controls'])!={'unstableDenominator','extremePb'} or any(dec(x['value'])<=0 for x in config['controls'].values()):raise ValueError('POSITIVE_WARNING_CONTROLS')
 if set(config['sensitivityGrids'])!={'roe','ke','growth','payout','creditCost','capitalTarget','rwaGrowth'}:raise ValueError('EXACT_GRID_CONTRACT')
 for name,item in config['sensitivityGrids'].items():
  if item['unit']!='RATIO' or not item['value']:raise ValueError('GRID_UNIT_OR_EMPTY')
  if any(not 0<=dec(v)<=1 or (name in ['roe','ke','capitalTarget'] and dec(v)<=0) for v in item['value']):raise ValueError('GRID_DOMAIN')
 out=[run_scenario(s,anchors,config['controls']) for s in config['scenarios']]
 return dict(schema='tcb-hypothetical-sandbox-output-v1',ticker='TCB',labels=list(LABELS),scenarios=out,sensitivities=sensitivities(config,anchors),formalM3Points=None,formalM3Total=None,ranking=None,M4Decision=None,approvedIntrinsicValue=None,selectedPrice=None,marginOfSafety=None,expectedReturn=None,productionAdmissible=False)
