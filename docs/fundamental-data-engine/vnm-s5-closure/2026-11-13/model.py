"""Unlevered parent operating DCF + financial-asset/liability runoff + shareholder allocation.
No portfolio/scoring writes. Decimal strings retain source units. No forecast is a fact.
"""
from decimal import Decimal as D,localcontext

def irr(cashflows):
 with localcontext() as c:
  c.prec=45
  if not cashflows or cashflows[0][1]>=0 or any(v<0 for t,v in cashflows[1:]):raise ValueError('NONSTANDARD_SHAREHOLDER_CASHFLOW')
  def npv(r):return sum(v/(1+r)**t for t,v in cashflows)
  lo,hi=D('-.99'),D('10')
  if npv(lo)*npv(hi)>0:return None
  for _ in range(180):
   mid=(lo+hi)/2
   if npv(mid)>0:lo=mid
   else:hi=mid
  return str((lo+hi)/2)

def operating_year(revenue,previous_revenue,*,margin,tax,fund,da0,revenue0,maintenance_multiple,wc_intensity,fixed_intensity,return_cap,strategic,downside_wc=0,operating_risk=0):
 with localcontext() as c:
  c.prec=45
  rev,prev,mg,t,f,da_base,rev0,mm,wci,fai,rc,st,wc_shock=map(D,[revenue,previous_revenue,margin,tax,fund,da0,revenue0,maintenance_multiple,wc_intensity,fixed_intensity,return_cap,strategic,downside_wc])
  if rev<=0 or rev0<=0 or not 0<=mg<1 or not 0<=t<1 or not 0<=f<1 or mm<1 or rc<=0:raise ValueError('INVALID_OPERATING_ASSUMPTION')
  raw_ebit=rev*mg;risk=D(operating_risk)*max(D(1),rev/rev0);ebit=raw_ebit-risk;nopat=ebit*(1-t);employee=nopat*f;economic_nopat=nopat-employee
  da=da_base*max(D(1),rev/rev0);maintenance=da*mm
  growth_rev=max(D(0),rev-prev);wc=growth_rev*wci;asset_growth=growth_rev*fai
  growth_nopat=max(D(0),growth_rev*(mg-D(operating_risk)/rev0)*(1-t)*(1-f))
  return_floor=growth_nopat/rc
  total_growth=max(wc+asset_growth,return_floor)
  extra=total_growth-wc-asset_growth
  fcff=economic_nopat+da-maintenance-total_growth-st-wc_shock
  return {k:str(v) for k,v in {'revenue':rev,'coreEbitBeforeRiskBudget':raw_ebit,'noninterestOperatingRiskBudget':risk,'coreEbit':ebit,'afterTaxOperatingEarnings':nopat,'employeeFundCharge':employee,'economicNopat':economic_nopat,'depreciation':da,'maintenanceCapex':maintenance,'incrementalWorkingCapitalIncludingOperatingCash':wc,'assetGrowthCapex':asset_growth,'extraGrowthFundingToRespectReturnCeiling':extra,'totalGrowthReinvestment':total_growth,'strategicInvestmentOutsideCoreParent':st,'downsideWorkingCapitalLock':wc_shock,'fcff':fcff}.items()}

def value(inputs,spec,*,rate=None,terminal_g=None,extra_maintenance=0,financial_recovery=None,dilution=0,strategic_override=None):
 with localcontext() as c:
  c.prec=45
  F={k:D(v) for k,v in inputs['modelNumbers'].items()};r=D(rate if rate is not None else spec['discountRate']);g=D(terminal_g if terminal_g is not None else spec['terminalGrowth']);dil=D(dilution)
  if r<=g or r<=0 or g<0 or dil<0:raise ValueError('TERMINAL_OR_DILUTION_INVALID')
  recovery=D(financial_recovery if financial_recovery is not None else spec['financialAssetRecovery'])
  if not 0<=recovery<=1:raise ValueError('INVALID_FINANCIAL_RECOVERY')
  strategic=D(spec['strategicBudget'] if strategic_override is None else strategic_override)
  kwargs=dict(margin=spec['coreOperatingMargin'],tax=spec['taxRate'],fund=F['fundRate'],da0=F['daAnnualAnchor'],revenue0=F['revenueTTM'],maintenance_multiple=spec['maintenanceMultiple'],wc_intensity=F['workingCapitalIntensity'],fixed_intensity=F['fixedCapitalIntensity'],return_cap=spec['growthReturnCeiling'],strategic=strategic,operating_risk=spec.get('annualOperatingRiskBudget','0'))
  years=[];prev=F['revenueTTM']
  for yr,growth in enumerate(spec['growthPath'],1):
   rev=prev*(1+D(growth));row=operating_year(rev,prev,**kwargs)
   if D(extra_maintenance):row['fcff']=str(D(row['fcff'])-D(extra_maintenance));row['extraMaintenanceSensitivity']=str(extra_maintenance)
   row['year']=yr;years.append(row);prev=rev
  # Recompute year6 reinvestment at terminal growth, not year5 conversion.
  terminal_kwargs={**kwargs,'strategic':D(spec['terminalStrategicBudget']) if strategic_override is None else D(strategic_override)}
  terminal=operating_year(prev*(1+g),prev,**terminal_kwargs)
  if D(extra_maintenance):terminal['fcff']=str(D(terminal['fcff'])-D(extra_maintenance))
  tv=D(terminal['fcff'])/(r-g)
  # Debt retired out of asset runoff. No interest charge in unlevered FCFF; pay
  # reported accrued interest and a full-year gross interest budget in bridge once.
  debt_and_prior_claims=F['debt']+F['accruedInterest']+F['fullYearInterestBudget']+F['oldDividendPayable']+F['openingEmployeeFundLiability']+F['openingIncomeTaxPayable']
  liquid_fin_assets=F['shortTermInvestments']*recovery+F['longTermInvestments']*D(spec['longDepositRecovery'])
  runoff=liquid_fin_assets-debt_and_prior_claims
  stake_exit=F['nonDepositFinancialHoldingsNetBook']*D(spec['unqualifiedStakeBookRealization'])
  # Existing operating cash is retained within the business, never added again.
  # Source fiscal2025 DPS is a forecast payout cap, not future authorization.
  ledger=D(0);known_total=F['declaredDps']*F['shares'];tau=F['declaredPaymentYearFraction']
  cashflows=[(D(0),-F['price'])];funded=True
  for row in years:
   yr=row['year'];available=ledger+D(row['fcff'])+(runoff if yr==1 else 0)
   share_year=F['shares']*(1+dil)**yr
   target=F['historicalDpsCap']*share_year
   if available<0:funded=False
   distribution=min(max(D(0),available),target)
   if yr==1:
    if available<known_total:funded=False
    distribution=max(distribution,known_total)
    cashflows.append((tau,F['declaredDps']))
    regular=distribution-known_total
   else:regular=distribution
   ledger=available-distribution
   row.update({'netFinancialRunoff':str(runoff if yr==1 else 0),'shareholderDistribution':str(distribution),'regularPerShareDistribution':str(regular/share_year),'retainedCashEnd':str(ledger),'dilutedShares':str(share_year)})
   cashflows.append((D(yr),regular/share_year))
  exit_equity=tv+ledger+stake_exit;exit_ps=exit_equity/(F['shares']*(1+dil)**5)
  cashflows.append((D(5),exit_ps))
  fair=sum(v/(1+r)**t for t,v in cashflows[1:]);ret=irr(cashflows) if funded and ledger>=0 and exit_equity>0 else None
  pv_operating=sum(D(x['fcff'])/(1+r)**x['year'] for x in years)+tv/(1+r)**5
  pv_fin=runoff/(1+r);pv_stake=stake_exit/(1+r)**5
  # Full immediate-FCFE-capacity PV is a crosscheck. Shareholder timing can
  # differ because retained cash earns0 and payouts are capped, except declared.
  capacity=(pv_operating+pv_fin+pv_stake)/F['shares']
  return {'case':spec['name'],'specification':spec,'years':years,'terminalYear':terminal,'terminalOperatingValueAtYear5':str(tv),'financialRunoff':{'grossAssets':str(liquid_fin_assets),'debtAndPriorClaimsPaidOnce':str(debt_and_prior_claims),'netRunoffYear1':str(runoff),'operatingCashAdded':'0','futureFinancialIncomeIncluded':'0','unqualifiedHoldingsValueAtExit':str(stake_exit)},'equityCashflowsPerShare':[{'yearFraction':str(t),'amountVnd':str(v)} for t,v in cashflows],'retainedCashEarnedReturn':'0','intrinsicValuePerShare':str(fair),'fcfeCapacityPvCrosscheckPerShare':str(capacity),'terminalExitPerShare':str(exit_ps),'fiveYearShareholderIRR':ret,'fundedWithoutNewEquityOrBorrowing':funded and ledger>=0,'marginOfSafety':None,'discountRate':str(r),'terminalGrowth':str(g),'futureDilutionAssumption':str(dil),'scope':'PARENT_UNLEVERED_OPERATING_FCFF_TO_COMMON_EQUITY_DISTRIBUTION_DCF','notFormalPoints':True}
