"""Distinct financial challenge pass; reads prepared outputs, not the preparer calculation functions."""
import json,datetime,hashlib
from pathlib import Path
from fractions import Fraction
from decimal import Decimal,localcontext,ROUND_HALF_EVEN
OUT=Path(__file__).resolve().parent
D=Decimal

def read(n):return json.loads((OUT/n).read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 start=datetime.datetime.now(datetime.timezone.utc).isoformat();ev=read('evidence-register.json');f=ev['facts'];a=read('assumption-register.json');book=read('common-equity-bridge.json');en=read('normalized-earnings-register.json');price=read('price-action-register.json');ke=read('cost-of-equity-framework.json');findings=[]
 def check(id,claim,condition,disposition):
  if not condition:raise AssertionError((id,claim))
  findings.append(dict(id=id,challenge=claim,status='PASS',financialDisposition=disposition))
 def v(k):return D(f[k]['value'])
 check('FC01','Does the parent component sum reconcile to group minus separately presented NCI?',v('PARENT_COMPONENT_SUM')==v('P26:GROUP_EQUITY:2025')-v('P26:NCI_EQUITY:2025')==D(book['A_BOOK']),'Qualified ordinary non-tangible accounting common book only, not TCE, cash or regulatory capital.')
 check('FC02','Can other equity be mislabelled as a new preferred claim merely from its caption?',v('RESERVES_TRANSFER_2022')+v('EARNINGS_TRANSFER_2022')+v('NCI_TRANSFER_2022')+v('OTHER_RESERVE_ORIGIN_2022')==0 and v('OTHER_RESERVE_RETAINED_OFFSET_2024')+v('OTHER_RESERVE_NCI_OFFSET_2024')+v('OTHER_RESERVE_RECLASS_2024')==0 and v('OTHER_RESERVE_ORIGIN_2022')+v('OTHER_RESERVE_RECLASS_2024')==v('P26:OTHER_EQUITY:2025'),'Entire reserve origin traced through zero-sum subsidiary reclassifications/reallocations. Do not create profit or remove reserve as preferred without contrary evidence.')
 check('FC03','Is common book wrongly treated as tangible/distributable capital?',book['TCE'] is None and book['ownerNumericalCaseApproval']=='PENDING' and 'not distributable' in book['qualificationScope'],'Reject the stronger claim: group intangible ownership/goodwill/common allocation and usable funds remain unqualified.')
 check('FC04','Was welfare deducted twice or direct capital booked as profit?',D(en['reportedCommonEpsEarnings'])==v('P26:PARENT_NPAT:2025')-D('35379000000') and v('P26:PARENT_RETAINED_CAPITAL_TRANSACTION:2025')==D('6244850000000'),'Common EPS numerator25254851million is reported, not sustainable; capital transaction stays outside P&L.')
 # Independent exact-rational check of historical ratios, using native recorded source values.
 charge=[D('4208730000000'),D('4629535000000'),D('4475370000000')]
 loans=[D('411169101000000'),D('502022401000000'),D('605813718000000'),D('723757397000000')]
 avg=[(loans[i]+loans[i+1])/2 for i in range(3)];exact=[Fraction(charge[i])/Fraction(avg[i]) for i in range(3)]
 def q(frac):
  with localcontext() as c:c.prec=70;return (D(frac.numerator)/D(frac.denominator)).quantize(D('0.000000000001'),rounding=ROUND_HALF_EVEN)
 check('FC05','Are bank-customer charges divided by group loans including securities margin?',all(v('CORE_CREDIT_COST_'+str(y))==q(exact[i]) for i,y in enumerate((2023,2024,2025))),'Matching bank-core population used; reject frozen group-denominator shortcut and margin/other-credit reversals.')
 pooled=Fraction(sum(charge))/Fraction(sum(avg))
 check('FC06','Is BASE an unweighted mean or an arbitrary cycle multiplier?',v('CORE_CREDIT_COST_POOLED')==q(pooled) and min(exact)<pooled<max(exact),'BASE is exposure-weighted historical calibration; no scalar added. Still not a qualified full-cycle expected-loss rate.')
 values={s['name']:next(c for c in s['cells'] if c['axis']=='creditCost')['value'] for s in a['scenarios']}
 check('FC07','Do proposed credit axes match observed worst/pooled/best without pretending complete tail coverage?',D(values['BEAR'])==q(max(exact)) and D(values['BASE'])==q(pooled) and D(values['BULL'])==q(min(exact)) and all(next(c for c in s['cells'] if c['axis']=='creditCost')['qualification']=='SUPPORTED_LIMITED_HISTORICAL_SENSITIVITY' for s in a['scenarios']),'Accept only limited sensitivity proposals. Reject claims of full bear/base/bull readiness or certified credit/funding stress bounds.')
 check('FC08','Were2024property-sale gains/insurance termination incorrectly applied toFY2025?',v('PROPERTY_GAIN_2024')==D('497035000000') and f['INSURANCE_TERMINATION_2024']['year']==2024 and v('SUB_REVALUATION_EXPENSE_2025')==D('-3354000000') and all(f[k]['value'] is None for k in ['PROPERTY_SALE_INCOME_2025_DASH','PROPERTY_SALE_COST_2025_DASH','INSURANCE_TERMINATION_2025_DASH']),'Column-specific one-off context qualified; no current-year addback or dash-to-zero inference.')
 check('FC09','Does reported20%bank tax automatically supply every normalized marginal tax/common incidence?',v('REPORTED_BANK_TAX_RATE_2025')==D('0.20') and en['normalizedCommonEarnings'] is None and en['sustainableCommonRoe'] is None,'Reject uniform20%, tax0 or parent-incidence1 without entity/adjustment evidence. Prior conditional V4earnings envelope not sustainable.')
 cells=[c for s in a['scenarios'] for c in s['cells']]
 check('FC10','Is a generic hurdle silently selected as cost of equity?',all(c['value'] is None for c in cells if c['axis']=='costOfEquity') and ke['inputs']['ke'] is None and ke['status']=='SOURCE_AUTHORITY_REQUIRED','ke stays null. D1–D6approval does not approve ERP/risk-free inputs or KE-S1–S3acquisition.')
 check('FC11','Do historical lending growth/dividends/regulatory floor become forward g/payout/buffer?',all(c['value'] is None for c in cells if c['axis'] in ['growth','payout','capitalRequirements','terminalEconomics','fundingStress','sustainableCommonRoe']),'Reject these unsupported numerical promotions. Clean-surplus and regulatory feasibility cannot yet be demonstrated.')
 check('FC12','Are explicit zero issuance restrictions mistaken for historical or forecast facts?',all(c['value']=={'newShares':'0','netNewCommonCash':'0'} and c['classification']=='ASSUMPTION' and c['ownerStatus']=='PENDING' and c['qualification']=='PROPOSED_MODELLING_RESTRICTION_ONLY' for c in cells if c['axis']=='issuanceDilution'),'Proposed design restriction only; reject feasible-capital certification. Nonzero action requires separate specification and explicit future execution approval.')
 check('FC13','Does matching daily date22789.00or closing shares certify price/share compatibility?',price['status']=='BLOCKED' and price['selectedPrice'] is None and price['rawCandidate']['nativeUnit'] is None and not price['corporateActionBridgeQualified'],'Reject raw magnitude→VND/share, provider-display convention, personal share split and October2026price substitution.')
 check('FC14','Are all economic assumptions still pending and complete scenarios blocked?',len(cells)==27 and sum(c['value'] is None for c in cells)==21 and all(c['ownerStatus']=='PENDING' and c['analystStatus']=='PROPOSED' for c in cells) and a['fullyReadyScenarios']==0,'3credit sensitivity proposals and3capital-action restrictions are not6complete scenarios or approved economics. There are0ready valuations.')
 result=dict(status='PASS_WITH_EXPLICIT_FINANCIAL_LIMITATIONS',passKind='Separate financial challenge of preparation artifacts by the same agent; not an independent human review',startedAt=start,finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),findings=findings,preparedInputHashes={p:sha(OUT/p) for p in ['evidence-register.json','assumption-register.json','common-equity-bridge.json','normalized-earnings-register.json','price-action-register.json','cost-of-equity-framework.json']},financialReadiness='PARTIAL',valuationExecuted=False,productionExecuted=False,fullScenarioQualificationRejected=True)
 (OUT/'financial-challenge.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 text='# Separate financial challenge\n\nSame agent, distinct preparation/challenge passes; no independent human acceptance claimed. **14checks PASS with explicit financial limitations**; a complete scenario valuation is not qualified or executed.\n'
 for r in findings:text+=f"\n- **{r['id']}:** {r['challenge']} {r['financialDisposition']}\n"
 text+='\nThe principal adverse conclusion is retained: historical credit anchors do not establish a full-cycle loss bound; no ke, sustainable ROE, forward capital/buffer or compatible price is supplied. Common accounting book is qualified only for the stated non-tangible parent residual definition. Existing methodology and prior records remain unchanged.\n'
 (OUT/'FINANCIAL_CHALLENGE.md').write_text(text)
 print(json.dumps(dict(status=result['status'],checks=len(findings),valuationExecuted=False)))
if __name__=='__main__':main()
