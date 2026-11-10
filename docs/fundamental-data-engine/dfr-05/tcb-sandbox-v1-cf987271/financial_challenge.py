"""Separate quantitative/financial challenge of generated hypothetical outputs."""
from decimal import Decimal,localcontext
from fractions import Fraction
import datetime
from prepare import OUT,read,write,sha
D=Decimal

def main():
 start=datetime.datetime.now(datetime.timezone.utc).isoformat();r=read(OUT/'scenario-outputs.json');a=read(OUT/'anchors.json');c=read(OUT/'scenario-inputs.json');checks=[]
 def check(id,question,ok,conclusion):
  if not ok:raise AssertionError((id,question))
  checks.append(dict(id=id,challenge=question,status='PASS',conclusion=conclusion))
 check('SQ01','Are numeric model anchors historical accounting facts with explicit scope?',a['commonBook']['value']=='170044504000000' and a['closingShares']['value']=='7086240414' and a['ordinaryEpsNumerator']['value']=='25254851000000','Closing ordinary shares, not EPSweighted shares. Book is not TCE/unrestricted capital; reported earnings are context, not a sustainable forecast.')
 with localcontext() as ctx:
  ctx.prec=70
  for s,frac in zip(r['scenarios'],[Fraction(3,7),Fraction(49,44),Fraction(14,5)]):
   target=D(frac.numerator)/D(frac.denominator);check('SQ02-'+s['scenario'],'Independent rational check of P/Band finiteRIidentity',D(s['hypotheticalPB'])==target and abs(D(s['hypotheticalEquityValue'])-D(s['constantStateRiCheck']['hypotheticalEquityValue']))<D('1e-45'),'Mathematical consistency only; not independent economic corroboration or a price recommendation.')
  for s in r['scenarios']:
   x=s['hypotheticalAssumptions']['inputs'];roe=D(x['roe']['value']);g=D(x['growth']['value']);p=D(x['payout']['value']);check('SQ03-'+s['scenario'],'Does the chosen combination obey clean common-book retention?',g==roe*(1-p),'Coherent illustrative constant-state relationship; return/payout economics not empirically qualified.')
   z=s['stressReconciliation'];book=D(a['commonBook']['value']);recon=D(z['reconciledHypotheticalPreStressRoe'])*book-D(z['hypotheticalCommonCreditDelta'])-D(z['hypotheticalCommonFundingDelta']);check('SQ04-'+s['scenario'],'Are credit/funding taxes and common attribution applied only once?',abs(recon-D(s['hypotheticalCommonEarnings']))<D('1e-45') and not z['stressSubtractedAgain'] and not z['fundingAddedToKe'],'All-inROEused once; forward credit/tax/common/funding values hypothetical. kecontains no mechanical funding spread add-on.')
 check('SQ05','Is capital-infeasible BEARpresented as admissible because P/Bis positive?',r['scenarios'][0]['capitalFeasibility']['status']=='CAPITAL_INFEASIBLE' and r['scenarios'][0]['economicAdmissibility']=='REJECTED_CAPITAL_INFEASIBLE','Rejected. Retain numerical equation output only as an explicitly infeasible illustration.')
 check('SQ06','Do BASE/BULLcapital passes establish actual issuer capital feasibility?',all(s['capitalFeasibility']['status']=='HYPOTHETICALLY_CAPITAL_FEASIBLE' and not s['capitalFeasibility']['empiricallyQualified'] for s in r['scenarios'][1:]),'Pass only conditional eligible-retention/target/buffer/deduction/RWA/book assumptions; not a real bank capital forecast.')
 with localcontext() as ctx:
  ctx.prec=70
  for s in r['scenarios'][1:]:
   x=s['hypotheticalAssumptions']['inputs'];limit=D(x['eligibleRetentionFraction']['value'])*D(a['commonBook']['value'])/D(a['rwa']['value']);check('SQ07-'+s['scenario'],'Is the perpetual capital claim backed by the stated constant-state limit?',D(s['capitalFeasibility']['hypotheticalLongRunCarLimit'])==limit and D(x['growth']['value'])==D(x['rwaGrowth']['value']) and limit>=D(s['capitalFeasibility']['targetWithBuffer']),'Constant-state limit with one-time non-P&Ldeduction; not an actual regulatory rule. Common accounting floor remains distinct from CET1/TCE.')
 tables=r['sensitivities']['tables'];priceRows=tables['roeVsKe']+tables['growthVsKe']+tables['payoutVsRoe']
 check('SQ08','Are invalid/near-zero denominator combinations concealed?',any(x['status']=='INVALID_ECONOMIC_COMBINATION' and x['hypotheticalPB'] is None for x in priceRows) and any('UNSTABLE_KE_MINUS_G' in x.get('flags',[]) for x in priceRows),'Invalid cells null; unstable/extreme positive outputs flagged. No inference of investable opportunity from a large multiple.')
 check('SQ09','Are hypothetical inputs relabelled as qualified forecasts or owner numerical approvals?',all(v['classification']=='HYPOTHETICAL_ASSUMPTION' and v['ownerApprovalStatus'] in ['SANDBOX_SCOPE_ONLY_NOT_NUMERICAL_ECONOMICS_APPROVED','APPROVED_CONDITIONAL_RESTRICTION_NOT_PREDICTION'] for s in c['scenarios'] for v in s['inputs'].values()),'Scope/model restrictions only. ke/ROE/tax/incidence/capital choices illustrative; no new market authority.')
 check('SQ10','Are a live price, return/MOSor formal M3/M4fields produced?',all(o[k] is None for o in [r]+r['scenarios'] for k in ['approvedIntrinsicValue','selectedPrice','marginOfSafety','expectedReturn','formalM3Points','formalM3Total','ranking','M4Decision']),'No market-price comparison, security recommendation, score/rank/decision or production admission.')
 result=dict(status='PASS_WITH_HYPOTHETICAL_LIMITATIONS',passType='Distinct same-agent preparation and quantitative financial challenge; independent human acceptance not claimed',startedAt=start,finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),checks=checks,inputHashes={p:sha(OUT/p) for p in ['scenario-inputs.json','anchors.json','scenario-outputs.json','model.py']},forecastValidity='NOT_ESTABLISHED',ownerNumericalEconomicApproval=False,bearCapitalInfeasibleRetained=True)
 write('financial-challenge.json',result)
 body='# Financial challenge\n\n**'+str(len(checks))+'checks PASS with hypothetical limitations.** Separate same-agent pass, not independent human acceptance. Mathematical/capital equation validity is not economic forecast validity.\n'
 for row in checks:body+='\n- **'+row['id']+':** '+row['challenge']+' '+row['conclusion']+'\n'
 (OUT/'FINANCIAL_CHALLENGE.md').write_text(body);print('Financial challenge checks:'+str(len(checks)))
if __name__=='__main__':main()
