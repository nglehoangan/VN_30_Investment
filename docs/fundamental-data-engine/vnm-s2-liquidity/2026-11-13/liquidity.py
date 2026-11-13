"""Research liquidity arithmetic. No source admission, scoring, or portfolio writes."""
from decimal import Decimal as D, localcontext

def cash_available(assets,scope,asof):
 ids=set();amount=D(0)
 for x in assets:
  if x['id'] in ids: raise ValueError('DUPLICATE_ASSET')
  ids.add(x['id'])
  if D(x['amountVnd'])<0:raise ValueError('NEGATIVE_ASSET')
  if x['classification'] not in {'CONFIRMED_AVAILABLE','RESTRICTED','UNKNOWN'}:raise ValueError('INVALID_CLASSIFICATION')
  if x['scope']!=scope or x['asOf']!=asof:raise ValueError('SCOPE_DATE_MISMATCH')
  if x['classification']=='CONFIRMED_AVAILABLE':amount+=D(x['amountVnd'])
 return amount

def coverage(resources,obligations):
 with localcontext() as c:
  c.prec=45;r=D(resources);o=D(obligations)
  if r<0 or o<0:raise ValueError('NEGATIVE_INPUT')
  return {'resourcesVnd':str(r),'obligationsVnd':str(o),'surplusVnd':str(r-o),'coverage':str(r/o) if o else None,'coversIncludedObligations':r>=o}

def stress_cfo(*,cfo,interest_paid,revenue,gross_profit,inventory,decline,margin_compression,inventory_lock):
 """Historical-CFO repeat sensitivity, before future financing burden; no tax relief/cost savings."""
 with localcontext() as c:
  c.prec=45
  cf,ip,r,gp,inv,d,m,w=map(D,[cfo,interest_paid,revenue,gross_profit,inventory,decline,margin_compression,inventory_lock])
  if not 0<=d<=1 or not 0<=m<=1 or not 0<=w<=1:raise ValueError('INVALID_SHOCK')
  revenue_loss=r*d;lost_gp=gp*d;compressed=(r-revenue_loss)*m;wc=inv*w
  v=cf+ip-lost_gp-compressed-wc
  return {'preFutureInterestCfoVnd':str(v),'lostGrossProfitVnd':str(lost_gp),'marginCompressionVnd':str(compressed),'extraWorkingCapitalOutflowVnd':str(wc),'historicalInterestAddedBackVnd':str(ip),'taxRelief':'0','costSavings':'0','status':'ASSUMED_REPEAT_SENSITIVITY_NOT_COMMITTED_FUNDING'}

def current_gate(*,stress_covers,complete_obligations,timing_verified,availability_verified,validation_passed):
 return 'CLOSED' if all([stress_covers,complete_obligations,timing_verified,availability_verified,validation_passed]) else 'BLOCKING'
