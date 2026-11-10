"""Separate bounded financial challenge pass, no model/valuation execution."""
import json,hashlib,datetime
from pathlib import Path
from fractions import Fraction
from decimal import Decimal,localcontext,ROUND_HALF_EVEN
OUT=Path(__file__).resolve().parent
D=Decimal
def load(name):return json.loads((OUT/name).read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 start=datetime.datetime.now(datetime.timezone.utc).isoformat();auth=load('owner-decision-register.json');e=load('evidence-register.json');f=e['financials'];a=load('assumption-register.json');src=load('source-qualification.json');ke=load('cost-of-equity-calibration.json');price=load('price-action-register.json');capital=load('capital-feasibility-register.json');sens=load('credit-sensitivity-estimates.json')['items'];rows=[]
 def check(id,question,condition,result):
  if not condition:raise AssertionError((id,question))
  rows.append(dict(id=id,challenge=question,status='PASS',financialConclusion=result))
 check('BC-F01','Did scope approval silently approve numerical ke or21missing scenario cells?',not auth['numericalKeApproved'] and len(auth['conditionalAssumptions'])==6 and all(c['value'] is None for s in a['scenarios'] for c in s['cells'] if c['axis'] not in ['creditCost','issuanceDilution']),'Six existing conditional approvals only; all new ke/forward economics unapproved.')
 check('BC-F02','Is a failed HNXresponse or search snippet treated as a dated risk-free observation?',src['KE_S1']['selectedRiskFree'] is None and src['KE_S1']['selectedSovereignYield'] is None and src['KE_S1']['observationDate'] is None,'Reject monthly auction/current snippet substitution for exact case-date/default-freeVNDyield.')
 check('BC-F03','Are HTTP200headers/partial bytes sufficient to qualify the methodology PDF?',src['KE_S2']['methodDocument']['status']=='INCOMPLETE_TRANSFER_NOT_QUALIFIED' and not src['KE_S2']['methodDocument']['selected'] and not (OUT/'sources/damodaran-countryrisk-method.pdf').exists(),'Reject partial download as a source document; partial hash is not the original PDFhash.')
 table=src['KE_S2']['inputTable'];vals=table['values']
 check('BC-F04','Does January2026heading prove an immutable Vietnamrow as-of date?',table['mixedVintagePage'] and table['countryRowRevisionAt'] is None and not table['selectedForFY2025'],'Retrospective basis permits later publication, but does not establish an unknown mixed-row vintage. Provider numbers reference-only.')
 check('BC-F05','Are provider country/total premiums combined twice?',D(vals['totalEquityRiskPremium'])==D(vals['countryRiskPremium'])+D(table['derivedMatureERP']['value']) and D(table['derivedMatureERP']['value'])==D('0.0423'),'8.13%already contains3.90%country component;4.23%is arithmetic reference, not a fourth independent risk calibration or VNDke.')
 check('BC-F06','Were native percentages silently relabelled as VND yields?',table['nativeUnit']=='PERCENT_DISPLAY' and 'not automatically nominalVND' in table['currencyContext'] and ke['nominalVndKe'] is None,'Keep percent source labels separate from currency/default/exposure assumptions; reject unqualified nominalVNDtransfer.')
 check('BC-F07','Does missing issuer risk become beta1or generic bank spread?',ke['beta'] is None and ke['bankSpecificSpread'] is None and src['KE_S3']['selectedBeta'] is None,'No retained compatible total-return/market-risk contract; no peer acquisition authorized.')
 avg=Fraction(D('605813718000000')+D('723757397000000'))/2;actual=Fraction(D('4475370000000'));rates={'BEAR':D('0.009217628484'),'BASE':D('0.007947018458'),'BULL':D('0.006732050583')}
 for x in sens:
  exact=Fraction(rates[x['scenario']])*avg-actual
  with localcontext() as c:c.prec=70;want=D(exact.numerator)/D(exact.denominator)
  check('BC-F08-'+x['scenario'],'Is the credit sensitivity exact on approved anchor and matched historical exposure?',D(x['value'])==want and D(x['fixedExposure'])==D(avg.numerator)/D(avg.denominator),'Exact pretax charge sensitivity; not future loan forecast or common earnings.')
 check('BC-F09','Was BULLrounded-rate residue hidden as zero or a profit forecast?',sens[2]['classification']=='REFERENCE_ONLY_ROUNDING_RESIDUE' and D(sens[2]['value'])!=0 and abs(D(sens[2]['value']))<D('333'),'Preserve bounded12dp ratio residue; no economic improvement claim.')
 check('BC-F10','Were approved credit anchors promoted to expected losses/tail bounds?',all('Historical sensitivity only' in r['conditions'] for r in auth['conditionalAssumptions'] if r['id'].startswith('CREDIT:')) and all(c['qualification']=='SUPPORTED_LIMITED_HISTORICAL_SENSITIVITY' for s in a['scenarios'] for c in s['cells'] if c['axis']=='creditCost'),'Reject complete-bear/tail or full-cycle forecast inference from historical maxima.')
 check('BC-F11','Are tax/common incidence silently0or1or bank20%?',all(x['marginalTax'] is None and x['commonIncidence'] is None and x['netCommonEarningsDelta'] is None and x['sustainableEarnings'] is None for x in sens),'No net common-earnings or sustainableROErange derived from incomplete attribution/recurrence.')
 check('BC-F12','Were H1capital/RWAcomparatives read from standalone instead of consolidated columns?',D(f['REG_CAPITAL_H1_2025']['value'])==D('165500000000000') and D(f['RWA_H1_2025']['value'])==D('1105897000000000') and all(f[k]['scope']=='REGULATORY_CONSOLIDATED' for k in ['REG_CAPITAL_H1_2025','RWA_H1_2025']),'Correct June30consolidated column; not parent/standalone capital or accounting book.')
 with localcontext() as c:
  c.prec=70
  cg=((D('181870')-D('165500'))/D('165500')).quantize(D('0.000000000001'),rounding=ROUND_HALF_EVEN);rg=((D('1244531')-D('1105897'))/D('1105897')).quantize(D('0.000000000001'),rounding=ROUND_HALF_EVEN)
 check('BC-F13','Are capital/RWAgrowth diagnostics annualized or assumed forward funding capacity?',D(f['REG_CAPITAL_H2_GROWTH']['value'])==cg and D(f['RWA_H2_GROWTH']['value'])==rg and rg>cg and 'NOT_ANNUALIZED' in f['RWA_H2_GROWTH']['unit'],'Six-month RWAexpanded faster than eligible reported capital; concrete warning, not predicted distress/capacity.')
 check('BC-F14','Does zero issuance approval certify feasible retention/growth?',capital['restrictionStatus']=='APPROVED_CONDITIONAL_ASSUMPTION' and capital['capitalFeasible'] is None and capital['eligibleRetention'] is None and capital['caseTargetCAR'] is None,'No. Common/regulatory retention, RWA, target, stress and payout path still required.')
 check('BC-F15','Is Tier1CET1or the historical8%floor a selected target?',capital['Tier1NotCET1'] and capital['historicalFloorNotForwardTarget'] and capital['caseTargetCAR'] is None,'Reject both shortcuts; parent no-issuance is distinct from subsidiary/NCI/Tier2flows.')
 check('BC-F16','Does a matching retained date/raw22789.00qualify the share/action or beta basis?',price['selectedPrice'] is None and not price['corporateActionBridgeQualified'] and price['issuerSpecificBeta'] is None,'No units/factors/ex-dates/dividend treatment; no magnitude inference or October2026replacement.')
 check('BC-F17','Are algebraically related methods counted as independent corroboration?',load('crosscheck-register.json')['algebraicEquivalenceNotIndependence'] and load('crosscheck-register.json')['status']=='BLOCKED','Independent own-history capitalization still needs compatible prices and normalized earnings; no intrinsic value computed.')
 check('BC-F18','Are approvals/reference rows/four historical inputs relabelled as completed scenarios?',a['completeScenarios']==0 and a['pendingNumericalCells']==21 and all(s['draftEquityValue'] is None for s in a['scenarios']),'0complete scenarios; no model/valuation execution authorized.')
 files=['owner-decision-register.json','evidence-register.json','assumption-register.json','cost-of-equity-calibration.json','capital-feasibility-register.json','price-action-register.json','credit-sensitivity-estimates.json','source-qualification.json']
 result=dict(status='PASS_WITH_FINANCIAL_BLOCKERS_RETAINED',reviewType='Distinct financial challenge pass by the same agent; no independent human acceptance claimed',startedAt=start,finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),findings=rows,preparedInputHashes={p:sha(OUT/p) for p in files},valuationExecuted=False,keNumericalRangeQualified=False,completeScenarioQualificationRejected=True)
 (OUT/'financial-challenge.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 body='# Financial challenge\n\n**'+str(len(rows))+'checks PASS with financial blockers retained.** Distinct same-agent preparation/challenge passes; not independent human acceptance. This result does not authorize valuation or production.\n'
 for r in rows:body+='\n- **'+r['id']+':** '+r['challenge']+' '+r['financialConclusion']+'\n'
 body+='\nAdverse result retained: exact risk-free/default/currency/exposure, compatible price/actions, normalized owner earnings, capital path and independent crosscheck remain incomplete. New source bytes and financial arithmetic do not fill21missing scenario inputs. No valuation/model executed.\n'
 (OUT/'FINANCIAL_CHALLENGE.md').write_text(body);print(json.dumps(dict(status=result['status'],checks=len(rows))))
if __name__=='__main__':main()
