"""Numerical/lineage/scope validation for B1–B6, not scoring/admission."""
import json,pathlib,hashlib,sqlite3
from decimal import Decimal as D,getcontext
getcontext().prec=45
R=pathlib.Path.cwd();O=pathlib.Path(__file__).resolve().parent;checks=[];seen=set();cache={}
def load(p):
 p=pathlib.Path(p)
 if p not in cache:cache[p]=json.loads(p.read_text())
 return cache[p]
def check(ok,name):checks.append(dict(name=name,passed=bool(ok)))
def near(x,y,name,tolerance='.0001'):check(abs(D(x)-D(y))<D(tolerance),name)
def bind(b):
 k=(b['path'],b['sha256'],b.get('jsonPointer',''))
 if k in seen:return
 seen.add(k);p=R/b['path'];check(p.is_file(),'file '+str(k))
 if not p.is_file():return
 check(hashlib.sha256(p.read_bytes()).hexdigest()==b['sha256'],'hash '+str(k))
 if b.get('jsonPointer'):
  try:
   z=load(p)
   for a in b['jsonPointer'].lstrip('/').split('/'):
    a=a.replace('~1','/').replace('~0','~');z=z[int(a)] if isinstance(z,list) else z[a]
   check(True,'pointer '+str(k))
  except (KeyError,IndexError,TypeError,ValueError):check(False,'pointer '+str(k))
 if b.get('pdfPath'):
  p=R/b['pdfPath'];check(p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest()==b.get('pdfSha256',b.get('documentSha256')),'PDF '+str(k))
def walk(x):
 if isinstance(x,dict):
  if x.get('path') and x.get('sha256'):bind(x)
  for y in x.values():walk(y)
 elif isinstance(x,list):
  for y in x:walk(y)
d=load(O/'evidence-products.json');u=load(O/'VNM_RUBRIC_UNBLOCK_MATRIX.json');old=load(R/'docs/fundamental-data-engine/vnm-final-scoring-closure/2026-11-11/VNM_FORMAL_SCORE_INPUT_READINESS.json')
walk(d);walk(u)
f=lambda k:D(d['facts'][k]['value']);m=lambda k:D(d['metrics'][k]['value'])
check(len(u['rows'])==23,'23 explicit rows');check(u['beforeResearchScoreable']==9 and u['afterResearchScoreable']==9 and u['newResearchScoreable']==0,'honest9-to9 counts')
oldRows={r['rubricId']:r for r in old['researchConclusions']}
for r in u['rows']:
 check(r['beforeResearchProposedPoints']==oldRows[r['rubricId']]['researchProposedPoints'] and r['afterResearchProposedPoints']==r['beforeResearchProposedPoints'],'challenged conclusion unchanged '+r['rubricId'])
 check(r['formalPoints'] is None and not r['newScoringAuthority'],'no approval '+r['rubricId'])
 check(r['afterResearchProposedPoints'] is not None or bool(r['smallestRemainingSourceOrMethodDecision']),'exact per-rubric remainder '+r['rubricId'])
check(sum(r['afterResearchProposedPoints'] is not None for r in u['rows'])==9,'nine retained research-scored rubrics')
check(not u['all23EvidenceSupported'] and u['totalScore'] is None and u['formalScore'] is None and not u['B7B8Performed'],'no total/formal/B7/B8')
for y in ['24','25']:
 near(f('parentGrossProfit'+y)-f('parentSelling'+y)-f('parentAdmin'+y),m('parentCoreEbit'+y),'coreEBIT '+y)
 ni=f('parentSubsidiaryCost'+y)+f('parentAssociateCost'+y)+f('parentOtherInvestments')-f('parentInvestmentProvision'+y)
 near(ni,m('parentNetFinancialEquityInvestments'+y),'investment perimeter '+y)
 near(f('parentEquity'+y)+f('parentDebt'+y)-f('parentCash'+y)-f('parentShortDeposits'+y)-f('parentLongDeposits'+y)-ni,m('parentCoreCapitalProxy'+y),'capital matching '+y)
 near(f('parentTradeReceivable'+y)+f('parentInventory'+y)-f('parentTradePayable'+y)-f('parentCustomerAdvance'+y),m('parentCoreTradeNwc'+y),'coreNWC '+y)
for x in d['returnsSensitivity']:
 near(m('parentCoreEbit25')*(1-D(x['assumedOperatingTax']))/m('parentCoreCapitalAverage'),x['coreReturnProxy'],'ROIC-proxy sensitivity')
 check(x['costOfCapital'] is None and x['incrementalProjectReturn'] is None,'no fabricated economic hurdle/IRR')
near(f('parentCurrentTaxPayable24')+f('parentCurrentTaxAccrued25')-f('parentCashTax25'),f('parentCurrentTaxPayable25'),'tax liability rollforward')
near(f('parentCurrentTaxExpense25')-f('parentCurrentTaxAccrued25'),'36253022852','remittance tax distinction')
near(m('parentCashClosingReplay'),f('parentCash25'),'full parent cash replay')
near(f('parentCfo25')+f('parentReceivedFinanceCash25')-f('parentCapexCash25')-f('parentSubCash25'),m('parentHistoricalCashCapacity'),'historical cash capacity')
near(f('parentLaoJagroCapital25')-f('parentLaoJagroCapital24')+f('parentCoconutCapital25')-f('parentCoconutCapital24'),f('parentSubCash25'),'known subsidiary/associate deployment components')
# Cash deployment classification caption is retained; sum does not create a concept mapping.
check(d['facts']['parentClosingDividendPayableOriginal']['value'] is None,'PDF dash retained')
near(D(d['facts']['parentFullyDepreciatedInUse25']['originalPrintedValue'])*D('1000000'),f('parentFullyDepreciatedInUse25'),'declared million-VND scaling')
near(D('9393736731992')+D('62907826150'),f('groupDebt25'),'reported borrowing sum')
# Recompute CPI chain with explicit annual-average boundary.
index=D(1);cpi={2023:D('.0325'),2024:D('.0363'),2025:D('.0331')}
for x,a in zip(d['realEpsSeries'],d['commonNumeratorAttribution']):
 if x['year']>2022:index*=1+cpi[x['year']]
 near(x['averageCpiIndex2022eq1'],index,'CPI chain '+str(x['year']));near(D(x['commonAfterFundsVnd'])/D(x['shares']),x['nominalEps'],'nominalEPS '+str(x['year']));near(D(x['nominalEps'])/index,x['realEpsIn2022AveragePurchasingPower'],'realEPS '+str(x['year']));near(D(a['preFundParentNpatVnd'])-D(a['commonFundDeductionVnd']),a['commonAfterFundsVnd'],'fund bridge '+str(x['year']))
x=d['realEpsSeries'];near((D(x[-1]['realEpsIn2022AveragePurchasingPower'])/D(x[0]['realEpsIn2022AveragePurchasingPower']))**(D(1)/3)-1,m('realCommonEpsCagr22to25'),'realEPS CAGR')
for r in d['liquidityLadder']:check(r['availableForStressVnd'] is None and r['earliestContractDate'] is None and r['latestContractDate'] is None,'no invented access/dates '+r['item'])
near(D('4591000000000')+D('1250000000000')+D('3000000000000'),f('parentDebt25'),'parent bank sum')
for c in d['stressCases']:
 p='parent' if c['entity']=='PARENT' else 'group';rev=f(p+'Revenue25');gp=f(p+'GrossProfit25') if p=='parent' else f('groupGp25');cfo=f(p+'Cfo25');inv=f(p+'Inventory25');cash=f(p+'Cash25');dep=f(p+'ShortDeposits25');debt=f('parentDebt25') if p=='parent' else f('groupShortDebt25');lease=f(p+'Lease1y');cap=f('parentSignedCapex25') if p=='parent' else f('groupCapitalCommitment25')
 shocked=cfo-(gp-rev*D('.9')*(gp/rev-D('.03')))-inv*D('.2');need=debt+lease+cap;gap=need-cash-shocked
 near(shocked,c['shockedCfoVnd'],'shock '+p);near(need,c['borrowingLeaseCapexNeedVnd'],'obligation bound '+p);near(gap,c['gapAssumingCashAvailableBeforeDepositsVnd'],'gap '+p);near(gap/dep,c['minimumDepositAvailabilityFraction'],'availability threshold '+p)
check(all(not r['actualAvailabilityKnown'] for r in d['fundingSensitivity']),'waterfall assumptions not facts')
# Cash model independent identities and terminal funded on year6.
S=D('2089955445')
for c in d['parentForecastOptions']:
 check(not c['researchAdopted'] and not c['assumptions']['ownerApproved'],'forecast not adopted')
 prevE=D('8369595220974');prevWC=m('parentCoreTradeNwc25')
 for year in c['years']:
  e=D(year['commonEarnings']);wc=D(year['coreTradeNwc']);growth=(e-prevE)/D('.15');wf=wc-prevWC
  near(growth,year['totalIncrementalCapitalFunding'],'growth capital year'+str(year['year']));near(wf,year['workingCapitalFunding'],'WC growth year'+str(year['year']));near(growth-wf,year['nonWcGrowthCapitalFunding'],'nonWC capital year'+str(year['year']));near(e+D(year['da'])-D(year['maintenance'])-growth-D(year['additionalSubsidiaryFunding']),year['commonCash'],'nonduplicated commoncash year'+str(year['year']));check(year['noSeparateMeanWcReserve'],'no repeated meanWC reserve');prevE=e;prevWC=wc
 tv=D(c['years'][5]['commonCash'])/(D('.15')-D('.01'));near(tv,c['terminalValueYear5'],'terminal funded6');pv=sum(D(q['commonCash'])/D('1.15')**q['year'] for q in c['years'][:5])+tv/D('1.15')**5;near(pv,c['conditionalEquityValueVnd'],'DCF funding sensitivity');near(pv/S,c['conditionalPerShare'],'conditional per-share')
# Verify exact immutable DB bytes read, without copies or mutation.
conn=sqlite3.connect('file:data/vn30.sqlite?mode=ro',uri=True)
market=load(O/'market-reconciliation.json')
for r in market['observations']:
 row=conn.execute('select body,body_hash from broker_observation where id=?',(r['id'],)).fetchone();check(row is not None and hashlib.sha256(row[0].encode()).hexdigest()==r['storedBodySha256']==row[1],'immutable DB receipt '+r['id'])
 b=json.loads(row[0])
 if 'raw' in b:
  # Raw contains retained escaped quotation representation; compare stored declared hash and parsed selected value, do not reinterpret escaped lexical bytes.
  near(b['data']['data'][1]['close'],'56900','raw parsed close');check(b['rawSha256']==r['declaredRawSha256'],'raw receipt hash identity')
 else:check(b['value']=='56900' and b['tradingDate']=='2026-10-30' and b['adjustment']=='PROVIDER_UNDECLARED','dated price no invented adjustment')
check(not market['ownerApproved'],'30Oct remains candidate')
for pin in load(O/'protected-before.json'):bind(pin)
for name in ['VNM_SHARED_EVIDENCE_PRODUCTS.md','VNM_LIQUIDITY_STRESS_LADDER.md','VNM_COMMON_CASH_AND_VALUATION_BRIDGE.md','VNM_RUBRIC_UNBLOCK_MATRIX.json','VNM_OWNER_DECISIONS.md','FINAL_REVIEW.md']:check((O/name).is_file(),'output '+name)
failed=[q for q in checks if not q['passed']];report=dict(checks=len(checks),uniqueBindings=len(seen),failures=failed,scope='B1–B6 research evidence/lineage/arithmetic only; no authority/formal scoring or B7/B8',before=9,after=9)
(O/'validation-results.json').write_text(json.dumps(dict(**report,details=checks),indent=2)+'\n')
(O/'VALIDATION.md').write_text('# VNM — B1–B6 Validation\n\n'+str(len(checks))+' checks; '+str(len(failed))+' failures; '+str(len(seen))+' unique source bindings.\n\nValidated source hashes and JSON Pointers/PDF identity, M3/prior package/database preservation, exact retention of nine research conclusions, per-rubric remainders, matched capital/earnings and fund/tax/cash rollforwards, declared-unit scaling, CPI-real EPS arithmetic, entity separation and stress thresholds, explicit WC/growth overlap and funded terminal/DCF arithmetic, and immutable TCBS observation lineage.\n\nResearch-scoreable before9/23, after9/23; no new scores, no total, no formal/HUMAN/owner-adopted assumptions. Validation does not prove financial source-image correctness, bank access or economic recurrence. Raw/source data unchanged; no current quote, financial download or B7/B8 operation. Public CPI facts are sourced to NSO with semantic research receipts; no claim an original HTTP response hash was captured by web search. Kantar indexed method evidence/direct-open failure retained explicitly.\n\nRun from repository root: `python3 '+str(O.relative_to(R))+'/build.py`, `python3 '+str(O.relative_to(R))+'/render.py`, `python3 '+str(O.relative_to(R))+'/validate.py`. Market receipt is an immutable read-only inspection; original API raw remains in DB. No app code changed or unrelated full-suite/build claim.\n\n'+('Failures: '+json.dumps(failed) if failed else 'STOP for CIO/Owner review.'))
print(json.dumps(report));raise SystemExit(bool(failed))
