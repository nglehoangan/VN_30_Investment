"""Retained VNM economic bridges, without new downloads or invented band selections."""
import json,hashlib
from pathlib import Path
from decimal import Decimal,localcontext
R=Path.cwd();O=Path(__file__).resolve().parent;B=R/'docs/fundamental-data-engine'
read=lambda p:json.loads(p.read_text())
def pin(p):return {'path':str(p.relative_to(R)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
def write(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,sort_keys=True,indent=2)+'\n')
s1=B/'vnm-s1-economic-returns/2026-11-13/S1_ECONOMIC_RETURNS.json';i=B/'vnm-s1-economic-returns/2026-11-13/S1_INPUTS.json';six=B/'vnm-final-scoring-closure/2026-11-11/six-rubrics.json';s5=B/'vnm-s5-closure/2026-11-13/S5_VALUATION_INPUTS.json';prior=B/'vnm-step4-scoring-validation/2026-11-17/VNM_4_RUBRIC_RESOLUTION.json'
S=read(s1);I=read(i);H=read(six);V=read(s5);P=read(prior)
with localcontext() as c:
 c.prec=45
 group=[]
 for y,f in I['flows'].items():
  core=Decimal(f['grossProfit'])-Decimal(f['selling'])-Decimal(f['admin']);group.append({'year':int(y),'scope':f['scope'],'reportedCoreEbitVnd':str(core),'netProfitVnd':f['netProfit'],'associateResultVnd':f['associateResult'],'fundAppropriationVnd':f['fundAppropriation']})
 scenario=[]
 for s in S['scenarios']:
  annual=s['annual'];a,z=annual[0],annual[-1];dn=Decimal(z['nopatEstimate'])-Decimal(a['nopatEstimate']);dc=Decimal(z['closingCapital']['value'])-Decimal(a['closingCapital']['value'])
  scenario.append({'scenario':s['id'],'period':'2022-2025','scope':'CONSOLIDATED','deltaNormalizedNopatEstimateVnd':str(dn),'deltaNetBookCapitalVnd':str(dc),'unqualifiedBookDeltaQuotient':str(dn/dc) if dc>0 else None,'qualifiedIncrementalReturn':None})
 eps=H['commonEarningsPerShareSeries'];common=[]
 for a,z in zip(eps,eps[1:]):
  growth=Decimal(z['commonAfterFundsVnd'])/Decimal(a['commonAfterFundsVnd'])-1
  common.append({'from':a['year'],'to':z['year'],'scope':'CONSOLIDATED_COMMON_AFTER_FUNDS','deltaCommonEarningsVnd':str(Decimal(z['commonAfterFundsVnd'])-Decimal(a['commonAfterFundsVnd'])),'sharesStart':a['weightedShares'],'sharesEnd':z['weightedShares'],'nominalEpsGrowth':str(growth),'cycleNormalizedPerShareValueGrowth':None})
 # Reconstruct parent cash distribution from actual cash/common earnings ratios; retain reported formula inputs.
 m=H['metrics'];earn=Decimal(m['parentCommonAfterFundsVnd']);paid=Decimal('11181261630750');declared=Decimal('10136283908250');runoff=Decimal(m['parentDepositRunoffVnd']);netBorrow=Decimal(m['parentNetCashBeforeFxVnd'])-Decimal(m['parentOperatingCashPlusInvestingLessDividendsVnd'])
 funding={'period':'FY2025','scope':'STANDALONE','commonAfterFundsVnd':str(earn),'cashDividendsPaidVnd':str(paid),'declaredDividendsVnd':str(declared),'cashDistributionAboveCurrentCommonEarningsVnd':str(paid-earn),'cashPayoutRatioRecomputed':str(paid/earn),'declaredPayoutRatioRecomputed':str(declared/earn),'depositRunoffVnd':str(runoff),'netBorrowingReconstructedVnd':str(netBorrow),'beforeFxCashChangeVnd':m['parentNetCashBeforeFxVnd'],'allocationJudgment':'Funding reconciliation explains payment; use of excess deposits can be rational. It does not establish availability/returns of alternative investments or prove a destructive decision.'}
 assert abs(Decimal(funding['cashPayoutRatioRecomputed'])-Decimal(m['parentCashPayoutRatio']))<Decimal('1e-25')
 r=V['reconciliation'];parent={'scope':'STANDALONE','period':'TTM_FY2025_plus_9M2026_minus_9M2025','coreEbitTTMRecomputed':str(Decimal(r['coreEbitFY2025'])+Decimal(r['coreEbit9m2026'])-Decimal(r['coreEbit9m2025'])),'revenueTTMRecomputed':str(Decimal(r['revenueFY2025'])+Decimal(r['revenue9m2026'])-Decimal(r['revenue9m2025'])),'comparabilityLimit':r['scopeCaveat']}
 assert parent['coreEbitTTMRecomputed']==r['coreEbitTTM'];assert parent['revenueTTMRecomputed']==r['revenueTTM']
write('VNM_ECONOMIC_BRIDGES.json',{'contract':'vnm-targeted-economic-bridges-v1','cutoff':'2026-10-30','groupOperatingHistory':group,'incrementalScenarioBridge':scenario,'commonOwnerPerShareBridge':common,'parentDistributionFundingBridge':funding,'currentParentUpdate':parent,'retainedAllocationBridge':P['calculations']['allocationBridge'],'rows':P['rows'],'conclusion':'All four remain N/R. New calculations distinguish reported improvements and distributable-funding mechanics from marginal investment returns and normalized intrinsic compounding. No extra project-level requirement and no missing-as-zero band.','classification':{'reportedInputs':'FACT_AS_RETAINED','normalizedAmounts':'ESTIMATE','forwardReinvestmentBudgets':'ASSUMPTION_NOT_REALIZED_OUTCOME','bandDisposition':'ANALYST_JUDGMENT_NOT_FORMAL_ADOPTION'},'sourcePins':[pin(p) for p in [s1,i,six,s5,prior]],'newUserSourceRequired':False,'formalPoints':None,'S1_S5Reopened':False})
print('Retained economic bridges replayed; no unsupported band selected.')
