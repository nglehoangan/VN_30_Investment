"""Bounded analytical WACC/current-period comparison; never admission or scoring authority."""
from decimal import Decimal as D, localcontext

def dec(v):
 if v is None:raise ValueError('MISSING_MODEL_INPUT')
 x=D(str(v))
 if not x.is_finite():raise ValueError('NONFINITE_MODEL_INPUT')
 return x

def wacc(government_yield,default_spread,mature_erp,unlevered_beta,country_erp,debt_cost,tax,debt,equity):
 with localcontext() as ctx:
  ctx.prec=45
  g,ds,erp,beta,crp,kd,t,d,e=map(dec,[government_yield,default_spread,mature_erp,unlevered_beta,country_erp,debt_cost,tax,debt,equity])
  if not(0<g<1 and 0<=ds<g and 0<erp<1 and 0<beta<3 and 0<=crp<1 and 0<kd<1 and 0<=t<1 and d>=0 and e>0):raise ValueError('INVALID_WACC_DIMENSIONS_OR_INPUTS')
  rf=g-ds;levered=beta*(1+(1-t)*d/e)
  ke=rf+levered*erp+crp
  dw=d/(d+e);ew=e/(d+e);value=ew*ke+dw*kd*(1-t)
  return {'riskFreeEstimate':str(rf),'leveredBetaProxy':str(levered),'costOfEquity':str(ke),'debtCost':str(kd),'taxRate':str(t),'debtWeight':str(dw),'equityWeight':str(ew),'value':str(value),'countryRiskCount':1,'governmentDefaultSpreadDeducted':str(ds),'formula':'Ke = (VND government yield - estimated sovereign default spread) + betaL*mature ERP + explicit country ERP; WACC = E/V*Ke + D/V*Kd*(1-t)','estimateNotObservation':True}

def period_return(nopat,opening_capital,closing_capital):
 a,b=dec(opening_capital),dec(closing_capital)
 if a<=0 or b<=0:raise ValueError('NONPOSITIVE_MATCHED_PERIOD_CAPITAL')
 with localcontext() as ctx:
  ctx.prec=45
  return dec(nopat)/((a+b)/2)

def incremental_result(delta_nopat,delta_capital,comparability_verified,materiality_verified):
 n,d=dec(delta_nopat),dec(delta_capital)
 if d<=0:return {'value':None,'status':'N_R_NONPOSITIVE_CAPITAL_CHANGE'}
 if not comparability_verified or not materiality_verified:return {'value':None,'status':'N_R_COMPARABILITY_OR_CAPITAL_CHANGE_MATERIALITY'}
 with localcontext() as ctx:
  ctx.prec=45
  return {'value':str(n/d),'status':'SUPPORTED_AGGREGATE_ESTIMATE_NOT_PROJECT_IRR'}

def ttm_flow(annual,current_ytd,prior_ytd):
 for item in [annual,current_ytd,prior_ytd]:
  if item.get('scope')!='CONSOLIDATED' or item.get('currency')!='VND':raise ValueError('TTM_SCOPE_CURRENCY_MISMATCH')
 if current_ytd['months']!=9 or prior_ytd['months']!=9 or current_ytd['year']!=prior_ytd['year']+1 or annual['year']!=prior_ytd['year']:raise ValueError('TTM_YTD_PERIOD_REQUIRED')
 with localcontext() as ctx:
  ctx.prec=45
  return {k:str(dec(annual[k])+dec(current_ytd[k])-dec(prior_ytd[k])) for k in ['allInOperatingEbit','fundAppropriation','otherIncome','otherExpense','noninterestFinanceCost']}
