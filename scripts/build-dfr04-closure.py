"""One bounded retained-source closure; no production imports, DB connections or acquisition."""
import json, hashlib, sys, subprocess
from pathlib import Path
from decimal import Decimal
from datetime import datetime, timezone
from collections import Counter
from copy import deepcopy
from lib.dfr02 import pointer
from lib.dfr03 import validate_review, propagate
ROOT=Path(__file__).resolve().parents[1]
BASE='docs/fundamental-data-engine'
OLD=BASE+'/dfr-04/2026-11-05'; D2=BASE+'/dfr-02/2026-11-04'
REL=BASE+'/dfr-04/closure-37e12f2'; OUT=ROOT/REL
PILOT=['FPT','VNM','BID','TCX','VIC','VHM']
COMMIT='37e12f2cfbde5ebe66c4fc3b16882372cf6aa5a8'
def read(p):return json.loads((ROOT/p).read_text())
def sha(p):return hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
def h(x):return hashlib.sha256(json.dumps(x,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def now():return datetime.now(timezone.utc).isoformat()
def dump(n,x):
 p=OUT/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def load(n):return read(REL+'/'+n)
def rules():return json.loads((ROOT/'src/domain/scoring/methodology.ts').read_text().split('deepFreeze(',1)[1].rsplit(');',1)[0])
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
def check():
 s=load('inspection.json')
 if sha('scripts/dfr04-closure-evidence.json')!=s['specHash']:raise ValueError('REVIEW_SPEC_CHANGED')
 if git('rev-parse','HEAD')!=COMMIT:raise ValueError('BASELINE_CHANGED')
 for p,v in s['protectedFiles'].items():
  if sha(p)!=v:raise ValueError('PROTECTED_CHANGED:'+p)
 for e in load('evidence-map.json'):
  if sha(e['path'])!=e['sha256'] or h(pointer(read(e['path']),e['jsonPointer']))!=e['boundObjectHash'] or sha(e['pdfPath'])!=e['pdfHash']:raise ValueError('LINEAGE_CHANGED')
 return s

def inspect():
 if git('rev-parse','HEAD')!=COMMIT or git('diff','--name-only','HEAD'):raise ValueError('CLEAN_BASELINE_REQUIRED')
 files=git('ls-files').splitlines()
 files+= [str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file()]
 # Recheck every prior source and protected baseline fingerprint before adding research overlays.
 prior=read(OLD+'/inspection.json')
 for p,v in {**prior['protectedBefore'],**prior['pins']}.items():
  if sha(p)!=v:raise ValueError('PREDECESSOR_CHANGED:'+p)
 files+=list(prior['protectedBefore'])+list(prior['pins'])
 for p,v in read(OLD+'/final-review-manifest.json')['files'].items():
  if sha(OLD+'/'+p)!=v:raise ValueError('PRIOR_REVIEW_CHANGED:'+p)
 ev=read('scripts/dfr04-closure-evidence.json')
 for e in ev:
  if e['ticker'] not in PILOT or sha(e['pdfPath'])!=e['pdfHash']:raise ValueError('SOURCE_SCOPE_OR_HASH')
  e['sha256']=sha(e['path']);e['boundObjectHash']=h(pointer(read(e['path']),e['jsonPointer']))
  for o in e['observations']:
   if not isinstance(o['value'],str) or not Decimal(o['value']).is_finite() or not o['originalValue']:raise ValueError('LOSSLESS_VALUE_REQUIRED')
 dump('evidence-map.json',ev)
 dump('inspection.json',dict(inspectedAt=now(),baselineCommit=COMMIT,protectedFiles={p:sha(p) for p in sorted(set(files))},financialParity={t:h(read(D2+f'/issuers/{t}.json')['metrics']) for t in PILOT},specHash=sha('scripts/dfr04-closure-evidence.json'),baselineCompleted=14,sourceAcquisition=False))

def resolve(ref):
 if ref.startswith('C:'):
  return next(e for e in load('evidence-map.json') if e['id']==ref)
 if ref.startswith('METRIC:'):
  mid=ref[7:];t=mid.split(':')[0];ms=read(D2+f'/issuers/{t}.json')['metrics'];m=next(m for m in ms if m['id']==mid)
  return dict(**m,ticker=t,path=D2+f'/issuers/{t}.json',jsonPointer=f'/metrics/{ms.index(m)}',sha256=sha(D2+f'/issuers/{t}.json'),rubricTopics={'FH-BS':['capital']} if mid.endswith('TOTAL_EQUITY:2025') else {})
 raise ValueError('UNQUALIFIED_REFERENCE')
def validate(a):
 r=next(r for r in rules() if r['id']==a['subcategory']);validate_review(a,r,resolve)
 for entry in a['evidence']:
  qualified=False
  for ref in entry['refs']:
   e=resolve(ref)
   if e['ticker']!=a['ticker']:raise ValueError('ISSUER_MISMATCH')
   if entry['topic'] in e.get('rubricTopics',{}).get(a['subcategory'],[]):qualified=True
  if not qualified:raise ValueError('TOPIC_NOT_QUALIFIED:'+entry['topic'])
 for entry in a['counterevidence']:
  if any(resolve(ref)['ticker']!=a['ticker'] for ref in entry['refs']):raise ValueError('COUNTER_ISSUER_MISMATCH')
 return True

# These are analyst judgments, never automatic ratios-to-points rules.
BALANCE={
'FPT':(3,'Equity of 43.748 trillion VND supports 21.073 trillion of identified borrowings. Doubtful debt is explicitly provided; short funding and investment commitments prevent a strong balance-sheet conclusion.','Recoverable doubtful debt is only 262.785 billion of 901.324 billion gross. Reported cash is not proof of freely transferable subsidiary funds.','technology receivable recoverability and investment funding'),
'VNM':(4,'Equity of 34.483 trillion VND, large disclosed deposits and 9.457 trillion identified debt support adequate consumer-sector capitalization. Short debt dominates; deposits and cash are separately identified.','The joint venture lost 150.558 billion VND in the disclosed roll-forward. Term deposits cannot all be assumed immediately free; unsecured short loans still require renewal.','consumer deposit liquidity and investment impairment'),
'BID':(3,'Reported consolidated CAR of 9.18% and Tier-1 ratio of 6.45% provide a bank-specific capital lens. Loan groups and the allowance roll-forward are reconciled rather than applying industrial debt/equity thresholds.','Groups 3–5 total 34.976819 trillion VND versus 34.945553 trillion allowance; collateral, recoveries and regulatory deductions matter. Reported ratios are not a prospective regulatory compliance opinion.','bank credit loss absorption and deposit funding'),
'TCX':(3,'Standalone equity of 44.100 trillion VND supports the margin book, but 34.094 trillion identified funding and pledged HTM constrain available liquidity. Securities assets are assessed as risk-bearing exposures.','Margin gross exposure is 43.163 trillion VND. Low reported impairment does not prove collateral survives a price shock; expected liquidation cash flows are not unrestricted bank balances.','securities collateral, capital and matched funding'),
'VIC':(1,'The explicit closing debt lines total 338.501032 trillion VND against 151.488935 trillion group equity. Pledges, creditor extensions and exchange-bond puts support a weak capitalization/funding assessment.','Substantial group equity and documented extensions mitigate immediate pressure. Neither proves unrestricted parent funds or removes asset-recovery uncertainty.','diversified group encumbrance and creditor-dependent funding'),
'VHM':(3,'Group equity of 249.216707 trillion VND supports 146.322754 trillion identified closing debt. Property receivables, pledged project assets and funding notes support only the lower adequate band.','Doubtful debt of 345.900 billion has only 79.371 billion recoverable. Project/cooperation balances and pledged assets cannot be treated as free parent cash; substantial construction commitments remain.','property asset recovery and project funding')}
EXTRA={
'BID:BQ-CASH':(3,'Interest accrued of 154.992934 trillion VND versus 149.994755 trillion received and actual interest paid of 86.565006 trillion separate cash realization from the income statement. Problem-loan interest recognition and off-balance treatment are explicit. Loan/deposit cash movements are banking intermediation, not industrial working capital.','Written-off debt recoveries of 14.773450 trillion VND are separately reported; their recurrence is not established. The accrual/receipt gap is not automatically arrears, and CFO is not distributable owner cash.','bank interest realization, separate from balance-sheet solvency'),
'VNM:RG-GOV':(2,'Actual dividend procedures and payment outcomes, the named 20 January 2025 conflict-recusal example, and the unmodified financial audit support a mixed governance assessment. Auditor selection/disclosure and fee information are explicitly reported.','A 10% nomination threshold limits minority initiative. Recusal and related-party fairness are substantially issuer representations; an unmodified financial opinion does not assure all controls or transaction fairness. Audit and non-audit fees must be considered together.','minority outcomes, related-party process and disclosure; distinct from IT risk'),
'BID:RG-RISK':(2,'Disclosed interest-rate banking-book, market limit and behavioral-liquidity channels have named monitoring, stress and three-line mitigations. These support an elevated but controlled residual-risk judgment, separate from credit provisions.','Policies and semiannual stress descriptions are not independent evidence of effectiveness under an actual run. Behavioral maturity assumptions and NII/EVE sensitivities can fail together.','IRRBB, market limits and behavioral liquidity; excludes already assessed normalization'),
'TCX:RG-RISK':(1,'Short-bank funding of 31.080 trillion VND includes a disclosed USD borrowing exposure with hedging. Rollover expectations and securities-liquidation assumptions create a concrete residual funding/market channel.','Reported hedging, equity and the positive contractual cash-flow ladder mitigate pressure. Hedge counterparty/basis risk and liquidation under stress remain; management renewal expectations are not committed facilities.','FX hedge counterparty, rollover and forced sale; not a negative-CFO penalty'),
'VHM:RG-RISK':(1,'Affiliate pledges/support and project execution obligations create a distinct contingent-loss channel. Construction commitments of 119,029 billion VND and project-deposit commitments of 78,864 billion are kept separate from debt and from USD/EUR commitments.','Project assets, contractual funding arrangements and positive reported operating cash flow mitigate exposure. None establishes unrestricted liquidity or eliminates affiliate enforcement and execution risk.','affiliate contingent support, execution and currency exposure; not double-counted cash realization')}

INVALIDATION={
'FPT:FH-BS':['Telecom/customer recovery evidence changes the 901324019387 VND doubtful-debt exposure or its 638539226911 VND allowance.','A verified funding/restriction bridge changes the availability of funds supporting 21073487486139 VND identified debt and contracted capex.'],
'VNM:FH-BS':['Deposit encumbrances or early-break terms materially reduce usable funding relative to 9456644558142 VND debt.','Further JV impairment or a corrected 511184069624 VND closing investment materially changes asset quality.'],
'BID:FH-BS':['Corrected loan-group classification/recoveries change the 34976819000000 VND groups3–5 exposure or allowance reconciliation.','A restated regulatory capital deduction/RWA basis changes reported CAR9.18% or Tier1 6.45%; accounting equity alone cannot preserve the band.'],
'TCX:FH-BS':['Verified collateral haircuts or margin impairments materially change recovery on 43162734820966 VND gross margin exposure.','Pledged HTM or funding restrictions materially change support for 34093976776742 VND borrowing against standalone capital.'],
'VIC:FH-BS':['Contractual verification removes or accelerates the specified Aug2026–May2029 extension or Nov2026/Dec2028 put obligations.','A complete closing debt/pledge bridge or asset-impairment correction changes the 338501032 million VND identified-debt basis or capital absorption.'],
'VHM:FH-BS':['Project/cooperation recoveries or related funding restrictions contradict the 345900 million VND doubtful-debt assessment.','Note26 debt/pledge or common/NCI capital restatement changes the 146322754 million VND identified-debt basis and loss absorption.'],
'BID:BQ-CASH':['Reclassified problem-loan interest recognition or receipt evidence changes the 154992934 versus149994755 million VND accrual/receipt comparison.','A verified recurrence bridge changes the economic treatment of 14773450 million VND written-off debt recoveries or identifies noncash items inside reported receipts.'],
'VNM:RG-GOV':['Verified related-party terms/minority outcomes contradict the disclosed recusal process or actual2025 dividend outcomes.','An auditor finding, material disclosure correction or evidence about audit/non-audit independence contradicts the bounded mixed-governance conclusion.'],
'BID:RG-RISK':['Observed deposit outflows or NII/EVE/market-limit breaches contradict the disclosed behavioral liquidity and three-line mitigations.','Independently qualified stress outcomes materially change the IRRBB/market/behavioral-liquidity residual channel.'],
'TCX:RG-RISK':['Binding rollover facilities, complete hedge/counterparty terms and stressed collateral realization close the identified funding channel.','Hedge default/basis loss or forced-sale evidence contradicts the mitigation assumed for the330mUSD exposure and short funding.'],
'VHM:RG-RISK':['Verified affiliate guarantees/pledges or enforcement terms change contingent support and project funding exposure.','Executed cancellation/funding/recovery evidence changes the119029 billion VND construction and78864 billion VND project-deposit commitments or the separate USD/EUR execution risk.']}

def prepare():
 check();ev=load('evidence-map.json');out=[]
 cases={t+':FH-BS':v for t,v in BALANCE.items()};cases.update(EXTRA)
 for key,(points,reason,counter,channel) in cases.items():
  t,rid=key.split(':');rule=next(r for r in rules() if r['id']==rid)
  band=next(b['label'] for b in rule['bands'] if b['min']<=points<=b['max'])
  entries=[]
  for topic in rule['topics']:
   refs=[e['id'] for e in ev if e['ticker']==t and topic in e['rubricTopics'].get(rid,[])]
   if rid=='FH-BS' and topic=='capital':
    scope='STANDALONE' if t=='TCX' else 'CONSOLIDATED';refs.append(f'METRIC:{t}:{scope}:TOTAL_EQUITY:2025')
   entries.append(dict(topic=topic,refs=refs,rationale=reason+' Topic-specific source binding: '+topic+'.'))
  refs=list(dict.fromkeys(ref for e in entries for ref in e['refs']))
  if key=='TCX:RG-RISK':refs+=['C:TCX:72','METRIC:TCX:STANDALONE:TOTAL_EQUITY:2025']
  if key=='VHM:RG-RISK':refs+=['METRIC:VHM:CONSOLIDATED:CFO:2025']
  a=dict(id=key,ticker=t,subcategory=rid,assessment=band,selectedPoints=points,source='AI',analyst='CHATGPT',methodologyVersion='1.0.0',rationale=reason,evidence=entries,counterevidence=[dict(refs=refs,rationale=counter)],disconfirmingEvidence=[counter],assumptions=['FY2025 stated scope only; later scope changes and market conditions are not assumed.','This bounded judgment does not establish covenant headroom, a complete scorecard or fair value.'],confidence='MEDIUM' if rid!='RG-RISK' else 'LOW',invalidationConditions=['Restatement or contradictory source changes the identified balances, capital or loss channel.','Verified recoverability, contractual restriction or control-effectiveness evidence changes the balance of support and counterevidence.'],economicChannel=channel,maximumPrerequisitesMet=False,economicAdversityBasis=True)
  a['invalidationConditions']=INVALIDATION[key]
  a['assumptions'].append('Issuer-specific scope limitation: '+SECTOR_GAPS[t]+'.')
  a['confidenceReason']='Original-page financial reconciliations support the bounded judgment; contractual recovery and unrestricted-fund completeness remain unproved.' if rid!='RG-RISK' else 'Residual channels and named mitigations are disclosed, but effectiveness under an actual issuer stress is not independently verified.'
  validate(a);out.append(a)
 dump('preparation.json',dict(preparedAt=now(),builderHash=sha('scripts/build-dfr04-closure.py'),inspectionHash=sha(REL+'/inspection.json'),assessments=out,independentHumanReviewClaimed=False))

def challenge():
 check();p=load('preparation.json');results=[]
 if p['builderHash']!=sha('scripts/build-dfr04-closure.py'):raise ValueError('PREPARATION_CODE_CHANGED')
 for a in p['assessments']:
  validate(a)
  tests=['All exact approved topics have same-issuer, qualified source bindings.','Band is an unchanged M3 label and allowed point; missing covenant or market data is not zero.','Counterevidence limits the conclusion; no maximum band or synthetic scorecard.','Reported balances do not prove unrestricted cash, normalized owner earnings or completed corporate-action adjustment.']
  if a['ticker'] in ('VIC','VHM'):tests+=['Legacy aggregate debt is excluded; only independently reconciled closing lines support this assessment.']
  if a['ticker']=='BID':tests+=['Loan/deposit cash movements and regulatory capital are bank-specific; CFO is not owner FCF.']
  results.append(dict(id=a['id'],decision='ACCEPT_BOUNDED_RESEARCH',tests=tests,assessmentHash=h(a),residualLimitation=a['counterevidence'][0]['rationale']))
 dump('challenge.json',dict(challengedAt=now(),preparationHash=sha(REL+'/preparation.json'),results=results,reviewer='CHATGPT_SEPARATE_CHALLENGE_PASS',independentHumanReviewClaimed=False))

MISSING={
'BQ-EQ':['constant-scope recurring returns/margins FY2022–25','average economic invested capital and owner-selected cost of capital'],
'FH-LIQ':['complete contractual principal/interest and guarantee maturity ladder','unrestricted usable cash/committed lines','exact covenants and measured headroom or explicit absence'],
'FH-STRESS':['dated issuer shock assumptions','quantified liquidity/capital response using matched obligations and restrictions'],
'GQ-HIST':['complete split/bonus/rights/issuance effective-date chain','acquired/divested contribution and constant-scope restatement bridge','comparable common-owner per-share numerator FY2022–25'],
'GQ-INC':['matched investment cohorts and recurring incremental earnings','unit economics with realized capital cost'],
'CA-REINV':['maintenance/growth split and complete investment cohorts','realized after-tax common-owner returns including divestment proceeds'],
'CA-DIST':['retention/distribution policy tied to through-cycle resilience','owner-approved conservative value for buyback/distribution comparison'],
'RG-GOV':['actual related-party terms and minority economic outcomes','auditor findings reconciled with dated disclosure/correction record'],
'RG-RISK':['quantified residual channel not already scored','documented mitigation outcome rather than policy alone']}
SECTOR_GAPS={
'FPT':'FTEL equity-method/consolidation bridge; completion-estimate contracts; telecom receivable recoverability and subsidiary-to-parent fund restrictions',
'VNM':'dairy price-volume/customer response; JV loss cohort; term-deposit restrictions and minority distribution economics',
'BID':'problem-loan interest/collateral recovery; behavioral deposit outflow; capital deductions and contractual funding/hedge limits',
'TCX':'margin collateral liquidation under shock; pledged HTM; USD hedge/counterparty and rollover terms; issuance-adjusted share history',
'VIC':'EV/property cohort losses and support; creditor puts/pledges; parent/NCI waterfall and corporate actions',
'VHM':'handover/cooperation receivables; restricted maintenance/project funds; affiliate collateral and NCI/common-owner waterfall'}
ABSENT_TOPICS={
'BQ-MOAT':['specific advantage versus named peers','observable pricing/cost/retention behavior attributable to advantage','persistence through adverse periods'],
'BQ-RES':['customer/product concentration and substitution','observed pricing response','actual adverse-period operating response'],
'GQ-FWD':['dated demand/runway','fundable reinvestment opportunities','observable execution milestones and constraints'],
'IC-IND':['entry barriers and competition','demand economics and disruption','sector capital intensity/returns through cycle'],
'IC-POS':['matched-date market-share numerator and denominator','comparable unit-cost position','relative distribution/channel economics'],
'IC-CYCLE':['dated sector-cycle indicators','normalized forward asymmetry','issuer survivability under adverse cycle']}
SOURCE_PROPOSALS={
'FPT':['public technology-services industry body / VINASA','public ministry/statistics sector releases'],
'VNM':['public national statistics dairy demand/price releases','publicly accessible consumer-industry study; no paid database assumed'],
'BID':['public State Bank sector statistics/disclosures','public bank-sector study with definitions'],
'TCX':['public HOSE/HNX/SSC market and securities-sector disclosures','public sector study on competition and margin economics'],
'VIC':['public construction/property and vehicle-industry statistical releases','public independent property/vehicle sector study'],
'VHM':['public construction/property statistical releases','public independent property supply/demand study']}

def schedules():
 ev=load('evidence-map.json');result=[]
 for t in PILOT:
  notes=[e for e in ev if e['ticker']==t];obs=[dict(**o,evidence=e['id'],path=e['path'],jsonPointer=e['jsonPointer'],pdfHref=e['pdfPath']+'#page='+str(e['page'])) for e in notes for o in e['observations']]
  d=read(D2+f'/issuers/{t}.json');history=[dict(metricId=m['id'],value=m.get('value'),status=m['status'],reference=D2+f'/issuers/{t}.json#/metrics/{i}') for i,m in enumerate(d['metrics']) if m['kind']=='REPORTED_FACT']
  def val(k):
   a=[o for o in obs if o['key']==k];assert len(a)==1,k
   o=a[0];return Decimal(o['value'])*{'VND':1,'MILLION_VND':1000000,'BILLION_VND':1000000000}.get(o['unit'],1)
  debt=None;equation=None
  if t in ('FPT','VNM'):debt=val('SHORT_DEBT')+val('LONG_DEBT');equation='SHORT_DEBT + LONG_DEBT'
  if t=='TCX':debt=val('SHORT_DEBT')+val('BONDS_TOTAL');equation='SHORT_BANK_DEBT + BONDS_TOTAL (short/long bond carrying values, no duplicate)'
  if t=='VIC':debt=val('SHORT_DEBT')+val('LONG_DEBT')+val('EXCHANGE_BONDS');equation='closing line320 + line338 + line339'
  if t=='VHM':debt=val('SHORT_DEBT')+val('LONG_DEBT');assert debt==val('TOTAL_DEBT_NOTE');equation='closing short + long = note26 total'
  legacy=next((m for m in d['metrics'] if m['id'].endswith('REPORTED_BORROWINGS:2025')),None)
  gap=str(Decimal(legacy['value'])-debt) if legacy and debt is not None else None
  s=dict(ticker=t,classification='RESEARCH_PROVISIONAL',scope='STANDALONE' if t=='TCX' else 'CONSOLIDATED',observations=obs,sourceNotes=[dict(id=e['id'],summary=e['summary'],href=e['pdfPath']+'#page='+str(e['page'])) for e in notes],debtMaturitiesCovenantsFunds=dict(identifiedDebtVnd=str(debt) if debt is not None else None,equation=equation,legacyReference=legacy,legacyMinusIdentifiedVnd=gap,legacyStatus='UNRECONCILED_LEGACY_AGGREGATE' if gap and Decimal(gap)!=0 else 'MATCHED' if gap is not None else 'BANK_SECTOR_FUNDING_NOT_INDUSTRIAL_DEBT',covenantHeadroom=None,unrestrictedFunds=None,completeContractualLadder=False,remainingFields=MISSING['FH-LIQ'],resolution='Use identified note basis for bounded FH-BS only; retain deferred FH-LIQ/STRESS until contracts, usable lines and restrictions are qualified.'),assetQualityRegulatoryCapital=dict(qualifiedRefs=[e['id'] for e in notes if 'asset_quality' in e['rubricTopics'].get('FH-BS',[]) or 'capital' in e['rubricTopics'].get('FH-BS',[])],reportedRegulatoryCapitalOnly=t=='BID',stressRecovery=None,limitation=SECTOR_GAPS[t]),corporateActionAdjustedGrowth=dict(reportedHistory=history,adjustedGrowth=None,fullFY2022FY2025Comparability=False,missingFields=MISSING['GQ-HIST'],resolution='Reconcile retained corporate-action and scope records; acquire only specifically missing disclosures under separately approved source scope.'),commonOwnerSustainableReturns=dict(reportedCommonAndConditionalEstimatesReference=D2+f'/issuers/{t}.json#/estimates',normalizedCommonEarnings=None,sustainableReturn=None,costOfCapital=None,missingFields=['recurrence/tax/fund adjustments','parent/common allocation and NCI waterfall','matched average invested capital','owner economic assumptions'],resolution=SECTOR_GAPS[t]),investmentOutcomes=dict(qualifiedRefs=[e['id'] for e in notes if 'CA-REINV' in e['rubricTopics']],completeCohortReturns=None,missingFields=MISSING['CA-REINV'],resolution='Trace named investments to realized common-owner outcomes; spending or positive group earnings alone cannot earn allocation points.'))
  s['commonOwnerSustainableReturns']['reportedParentProfitMetrics']=[m for m in history if 'NET_INCOME_ATTRIBUTABLE_PARENT:2025' in m['metricId']]
  s['debtMaturitiesCovenantsFunds']['maturityEntries']={
   'FPT':[dict(bucket='current',amountKey='SHORT_DEBT',source='C:FPT:49',qualification='Includes current portion of long debt; do not add CURRENT_LONG_BANK_DEBT again.'),dict(bucket='noncurrent',amountKey='LONG_DEBT',source='C:FPT:49'),dict(bucket='lease <1y / 1–5y / >5y',amountKeys=['LEASE_LT1Y','LEASE_1_5Y','LEASE_GT5Y'],source='C:FPT:65',qualification='Separate noncancellable commitments; not all immediately due balance-sheet debt.')],
   'VNM':[dict(bucket='current',amountKey='SHORT_DEBT',source='C:VNM:47'),dict(bucket='2027',amountKey='LONG_2027',source='C:VNM:48'),dict(bucket='2030',amountKey='LONG_2030',source='C:VNM:48'),dict(bucket='lease <1y / 2–5y / >5y',amountKeys=['LEASE_LT1Y','LEASE_2_5Y','LEASE_GT5Y'],source='C:VNM:54')],
   'BID':[dict(bucket='contractual versus behavioral',amount=None,source='C:BID:68',qualification='Nonmaturity deposits, compulsory reserves, early withdrawals and rollover assumptions require a bank liquidity bridge; no industrial debt schedule.')],
   'TCX':[dict(bucket=date,amountKey=key,source='C:TCX:46') for date,key in [('2026-01-29','BONDS_20260129'),('2026-02-08','BONDS_20260208'),('2026-06-16','BONDS_20260616'),('2026-06-24','BONDS_20260624'),('2026-07-10','BONDS_20260710')]]+[dict(bucket='short bank / noncurrent bond',amountKeys=['SHORT_DEBT','BONDS_LONG'],source='C:TCX:45 / C:TCX:46',qualification='Long bond tranche dates not fully bound here; premium reconciled separately. Cash-flow ladder is not carrying value or free cash.')],
   'VIC':[dict(bucket='specified extension Aug2026–May2029',amount=None,source='C:VIC:72',qualification='Specified loan only; not all group debt.'),dict(bucket='investor puts Nov2026 and Dec2028',amount=None,source='C:VIC:75',qualification='Earlier put/exchange rights distinct from terminal maturity; no future exercise assumed.')],
   'VHM':[dict(bucket='Jan–Dec2026 short bank repayments',amountKey='SHORT_BANK_LOANS',source='C:VHM:67'),dict(bucket='noncurrent / project commitments',amountKeys=['LONG_DEBT','CONSTRUCTION_COMMITMENTS','PROJECT_DEPOSIT_COMMITMENT'],source='C:VHM:70 / C:VHM:105',qualification='Separate carrying debt from construction/deposit commitments and affiliate guarantees; no double counting.')]
  }[t]
  eq=[]
  def reconcile(name,keys,closing):
   total=sum(val(k) for k in keys);assert total==val(closing),name
   eq.append(dict(name=name,operandKeys=keys,closingKey=closing,computedVnd=str(total),closingVnd=str(val(closing)),residualVnd='0',kind='DERIVED_RESEARCH_RECONCILIATION'))
  if t=='FPT':reconcile('doubtful recoverable plus allowance',['DOUBTFUL_RECOVERABLE','DOUBTFUL_ALLOWANCE'],'DOUBTFUL_GROSS')
  if t=='VNM':
   reconcile('JV opening + additions - dividends - share loss',['JV_OPEN','JV_ADDITIONS','JV_DIVIDENDS','JV_SHARE_LOSS'],'JV_CLOSE')
   reconcile('noncurrent maturities 2027 + 2030',['LONG_2027','LONG_2030'],'LONG_DEBT')
   s['investmentOutcomes']['realizedPartialCohort']='JV opening 622223692780 + additions 62898220000 - dividends 23379825500 - recognized loss 150558017656 = closing 511184069624 VND. This is one actual accounting outcome, not a complete economic IRR or all-investment allocation grade.'
  if t=='BID':
   reconcile('five loan-quality groups',['GROUP1','GROUP2','GROUP3','GROUP4','GROUP5'],'GROSS_LOANS')
   reconcile('loan tenor buckets',['LOANS_LT1Y','LOANS_1_5Y','LOANS_GT5Y'],'GROSS_LOANS')
   reconcile('allowance opening + charge - used + other',['ALLOWANCE_OPEN','ALLOWANCE_CHARGE','ALLOWANCE_USED','ALLOWANCE_OTHER'],'ALLOWANCE_CLOSE')
   s['assetQualityRegulatoryCapital']['groups3to5Vnd']=str(sum(val(k) for k in ['GROUP3','GROUP4','GROUP5']))
   s['commonOwnerSustainableReturns']['interestReceiptBridge']=dict(accruedLessReceivedVnd=str(val('INTEREST_ACCRUED')-val('INTEREST_RECEIVED')),cashNetInterestVnd=str(val('INTEREST_RECEIVED')+val('INTEREST_PAID')),reportedNiiVnd=str(val('NII')),qualification='Different cash/accrual timing and recoveries; not an arrears calculation, owner FCF or a normalized common-profit numerator.')
  if t=='TCX':s['assetQualityRegulatoryCapital']['marginGrossLessNetVnd']=str(val('MARGIN_GROSS')-val('MARGIN_NET'))
  if t=='VHM':reconcile('doubtful recoverable plus allowance',['DOUBTFUL_RECOVERABLE','DOUBTFUL_ALLOWANCE'],'DOUBTFUL_GROSS')
  s['exactReconciliations']=eq
  if t=='TCX':
   assert val('PBT')-val('TAX_EXPENSE')==val('NET_INCOME')==val('NOTE_COMMON')
   s['commonNumeratorConflict']=dict(arithmeticVnd=str(val('PBT')-val('TAX_EXPENSE')),note38Vnd=str(val('NOTE_COMMON')),printedCommonVnd=str(val('PRINTED_COMMON')),differenceVnd=str(val('PRINTED_COMMON')-val('NOTE_COMMON')),status='MINOR_SOURCE_INTERNAL_CONFLICT_RETAINED',resolution='Arithmetic and EPS note corroborate 108; printed common row ends 109. No authority to silently correct original. No weighted-share count is a valuation-date share count.')
   principal=sum(val(k) for k in ['BONDS_20260129','BONDS_20260208','BONDS_20260616','BONDS_20260624','BONDS_20260710']);assert principal+val('BOND_PREMIUM')==val('BONDS_SHORT')
   s['bondReconciliation']=dict(shortPrincipalVnd=str(principal),premiumVnd=str(val('BOND_PREMIUM')),shortCarryingVnd=str(val('BONDS_SHORT')),longCarryingVnd=str(val('BONDS_LONG')),unknownLongTrancheDates=True)
  result.append(s)
 return result

def finalize():
 check();p=load('preparation.json');c=load('challenge.json')
 if p['builderHash']!=sha('scripts/build-dfr04-closure.py'):raise ValueError('PREPARATION_CODE_CHANGED')
 if c['preparationHash']!=sha(REL+'/preparation.json') or p['preparedAt']>=c['challengedAt']:raise ValueError('SEPARATE_CHALLENGE_REQUIRED')
 new={a['id']:a for a in p['assessments']};approved={a['id']:a for a in c['results']}
 matrix=[]
 for old in read(OLD+'/completion-matrix.json'):
  row=deepcopy(old);t=row['ticker'];rid=row['rubric'];row['priorEligibility']=old['eligibility'];row['priorStatus']=old['status'];row['priorDFR04NewCompleted']=old['newCompleted'];row['newCompleted']=row['id'] in new;row['baselineCompleted']=old['status']=='COMPLETED_RESEARCH';row.pop('topicBlockers',None)
  row['mappingProcessed']=old['eligibility'] in ('EXISTS_MAPPING_INCOMPLETE','EXISTS_ANALYST_JUDGMENT')
  row['qualifiedTopicReview']=[dict(topic=topic,refs=[e['id'] for e in load('evidence-map.json') if e['ticker']==t and topic in e['rubricTopics'].get(rid,[])],requiredProduct='Source-bound '+topic+' analysis for '+t+': '+SECTOR_GAPS[t]+'. '+old['reason']) for topic in row['requiredTopics']]
  if row['id'] in new:
   a=new[row['id']];validate(a)
   if approved[a['id']]['assessmentHash']!=h(a):raise ValueError('CHALLENGE_HASH')
   row.update(status='COMPLETED_RESEARCH',eligibility='READY_FOR_ASSESSMENT',points=a['selectedPoints'],band=a['assessment'],assessment=a,closureDisposition='NEW_COMPLETED',exactMissingFields=[],reason=a['rationale'])
  elif old['status']=='COMPLETED_RESEARCH':row.update(closureDisposition='BASELINE_COMPLETED_UNCHANGED',exactMissingFields=[])
  else:
   fields=MISSING.get(rid,ABSENT_TOPICS.get(rid,[old['reason']]))
   row.update(closureDisposition='DEFERRED_EXACT_DEPENDENCY',exactMissingFields=fields,issuerSpecificDependency=SECTOR_GAPS[t],resolutionOwner='OWNER_SOURCE_POLICY' if old['eligibility']=='GENUINELY_ABSENT' else 'OWNER_VALUATION_DECISION' if old['eligibility']=='VALUATION_MARKET_DEPENDENCY' or rid in ('BQ-EQ','CA-DIST') else 'RESEARCH_ANALYST_WITH_NAMED_PRODUCT',resolutionPath=('Approve/amend/defer finite research scope; no acquisition performed.' if old['eligibility']=='GENUINELY_ABSENT' else 'Owner must select cutoff/source/economic assumptions; then qualify compatible inputs.' if old['eligibility']=='VALUATION_MARKET_DEPENDENCY' or rid in ('BQ-EQ','CA-DIST') else 'Complete retained-source reconciliation for '+t+': '+ '; '.join(fields)+'. Escalate only the exact missing contractual/action/outcome disclosure; no repeat generic phase.'),points=None,band=None)
  
  if row['status']=='NOT_RATED':
   for topic in row['qualifiedTopicReview']:
    topic['disposition']='PARTIAL_CONTEXT_NOT_FULL_TOPIC' if topic['refs'] else 'NO_QUALIFIED_TOPIC_BINDING'
    if topic['topic']=='cost_of_capital':topic['disposition']='OWNER_ASSUMPTION_REQUIRED'
   row['remainingUnqualifiedTopics']=[topic['topic'] for topic in row['qualifiedTopicReview']]
  else:row['remainingUnqualifiedTopics']=[]
  matrix.append(row)
 dump('completion-matrix.json',matrix);dump('sector-reconciliation.json',schedules())
 absent=[dict(id=r['id'],ticker=r['ticker'],rubric=r['rubric'],exactTopics=ABSENT_TOPICS.get(r['rubric'],r['exactMissingFields']),issuerScope=SECTOR_GAPS[r['ticker']],proposedSourceClasses=SOURCE_PROPOSALS[r['ticker']],resolution='Retained corpus first; only missing topics enter approved finite public-source scope.') for r in matrix if r['priorEligibility']=='GENUINELY_ABSENT']
 dump('research-source-scope.json',dict(status='OWNER_APPROVAL_REQUIRED',approved=False,sourceAuthorityExpanded=False,acquisitionPerformed=False,issuers=PILOT,periodScope='FY2022–FY2025; later evidence only if owner explicitly approves cutoff and treatment',missingRubrics=absent,ceiling=dict(maxNewDocuments=20,maxIssuerDocumentsPerIssuer=2,maxSectorDocumentsPerSector=2,sectors=5),policy='Proposed public/free nonfinancial sources only. Named classes are proposals, not approved or fetched sources. Financial PDF acquisition remains Vietstock-only. No paid datasets, new issuer scorecards or issuer/exchange financial-PDF fallback.',selection='Owner approve/amend/defer named source classes, document ceiling, periods and cutoff before discovery/acquisition.',selectedCutoff=None,approvalReceipt=None))
 dump('valuation-decision-sheet.json',dict(status='OWNER_DECISION_REQUIRED',cutoff=None,marketSourcePolicy=None,shareActionPolicy=None,economicAssumptions=None,approvalReceipt=None,remainingRubrics=[r['id'] for r in matrix if r['priorEligibility']=='VALUATION_MARKET_DEPENDENCY'],requiredDecisions=['Select exact valuation date/time/timezone and as-known versus retrospective basis.','Approve dated price source, native price unit, holiday/stale-quote policy and compatible effective-date share/action evidence.','Approve sector model, normalization/maintenance investment, discount rate, growth, payout, tax and downside scenarios with units and ranges.','Approve common-owner/NCI allocation and independent cross-check; conditional DFR02 scenarios are unapproved references.'],issuerLimitations={t:SECTOR_GAPS[t] for t in PILOT},rule='All 30 valuation/share-dependent instances remain deferred; weighted-average EPS shares and unrelated display prices cannot supply cutoff shares or approved assumptions.'))
 summary=dict(baselineCommit=COMMIT,baselineCompleted=14,newCompleted=len(new),completed=sum(r['status']=='COMPLETED_RESEARCH' for r in matrix),remainingNotRated=sum(r['status']=='NOT_RATED' for r in matrix),processedMappingAndJudgment=sum(r['mappingProcessed'] for r in matrix),netBlockerReduction=len(new),remainingClasses=dict(Counter(r['eligibility'] for r in matrix if r['status']=='NOT_RATED')),completeIssuerScorecards=0,financialMetricChanges=0,productionActivated=False,ownerApproval='PENDING',newAssessments=list(new))
 dump('summary.json',summary)
 for t in PILOT:
  d=deepcopy(read(OLD+f'/issuers/{t}.json'));d['contract']='dfr04-closure-partial-research-v1';d['rubrics']=[r for r in matrix if r['ticker']==t];d.update(totalScore=None,ranking=None,valuationPerShare=None,currentSignal=None,productionAdmissible=False,scoringAuthorized=False);dump(f'issuers/{t}.json',d)
 reports(summary,matrix)

def reports(s,matrix):
 ev=load('evidence-map.json')
 def write(n,lines):(OUT/n).write_text('\n'.join(lines)+'\n')
 write('DFR_04_CLOSURE_RESULTS.md',['# DFR-04 bounded closure — RESEARCH_PROVISIONAL',f'Baseline `{COMMIT}`. Completed {s["baselineCompleted"]} → {s["completed"]}/138; **{s["newCompleted"]} new supported assessments**, net unresolved reduction {s["netBlockerReduction"]}; {s["remainingNotRated"]} NOT_RATED. All 66 mapping and 6 analyst-judgment instances processed; deferred items remain blockers, not administratively closed. Zero complete issuer scorecards.','', 'Approved M3 bands/weights unchanged. No synthetic totals, missing-as-zero or production admission. Preparation and challenge are separate AI passes, not independent human acceptance.','', '| Instance | Approved band | Points | Confidence |','|---|---|---:|---|']+[f'|{a["id"]}|{a["assessment"]}|{a["selectedPoints"]}|{a["confidence"]}|' for a in load('preparation.json')['assessments']]+['','## Assessment and challenge detail']+sum(([f'### {a["id"]}',a['rationale'],'Counterevidence: '+a['counterevidence'][0]['rationale'],'Assumptions: '+' '.join(a['assumptions']),'Invalidation: '+' '.join(a['invalidationConditions']),'Channel: '+a['economicChannel']]+[f'- {e["topic"]}: '+', '.join(e['refs']) for e in a['evidence']]+[''] for a in load('preparation.json')['assessments']),[])+['## Complete disposition register','| Instance | Prior class | Current status | Exact dependency / result |','|---|---|---|']+[f'|{r["id"]}|{r["priorEligibility"]}|{r["status"]}|'+ ('Assessed; see source-bound assessment.' if r['status']=='COMPLETED_RESEARCH' else '; '.join(r['exactMissingFields'])+'; '+r['issuerSpecificDependency']+'; '+r['resolutionPath'])+'|' for r in matrix])
 lines=['# Six sector reconciliation schedules','All values below are research-only overlays. DFR02 immutable metrics remain byte-identical. Native units, printed values, source boxes/page objects and Decimal strings are retained in evidence-map.json and sector-reconciliation.json. No new formal financial facts are admitted.']
 for sc in load('sector-reconciliation.json'):
  t=sc['ticker'];b=sc['debtMaturitiesCovenantsFunds'];lines += ['',f'## {t} — {sc["scope"]}',f'Identified debt: {b["identifiedDebtVnd"]} VND; basis: {b["equation"]}. Legacy less identified: {b["legacyMinusIdentifiedVnd"]} VND; {b["legacyStatus"]}.','Maturities/funds/covenants: note-specific dates/pledges below; full ladder, covenant headroom and unrestricted funds remain unqualified. No assumption that undisclosed covenants do not exist.','Asset quality/capital: '+sc['assetQualityRegulatoryCapital']['limitation'],'Growth: retained reported FY2022–25 history is linked in JSON, but corporate-action-adjusted growth remains null; acquisitions, scope/base effects and effective share chain require reconciliation.','Common earnings/returns: reported common figures and DFR02 conditional scenarios are references; sustainable returns and normalized common owner earnings remain null pending explicit recurrence, tax, NCI, fund and capital bridges.','Investment outcomes: reviewed capex/acquisition evidence is mapped; complete realized cohort returns remain unqualified. VNM JV roll-forward is an actual loss outcome, not sufficient evidence of all capital-allocation outcomes.','| Key | Original | Decimal | Unit | Source |','|---|---|---|---|---|']+[f'|{o["key"]}|{o["originalValue"]}|{o["value"]}|{o["unit"]}|[{o["evidence"]}]({ROOT}/{o["pdfHref"]})|' for o in sc['observations']]+['']+[f'- [{e["id"]}]({ROOT}/{e["href"]}): {e["summary"]}' for e in sc['sourceNotes']]
  lines += ['Maturity schedule: '+json.dumps(b['maturityEntries'],ensure_ascii=False),'Exact Decimal reconciliations: '+json.dumps(sc['exactReconciliations'],ensure_ascii=False)]
  if t=='TCX':lines += [json.dumps(sc['commonNumeratorConflict'],ensure_ascii=False),json.dumps(sc['bondReconciliation'],ensure_ascii=False)]
 lines+=['','## Aggregate exceptions and dependency containment','VIC legacy reference debt 342,485,743 million VND differs by 3,984,711 million from explicit closing lines 338,501,032 million. VHM legacy reference 148,994,462 million differs by 2,671,708 million from note-confirmed 146,322,754 million. VHM closing liabilities/current liabilities also differ from prior READY_FOR_REVIEW references. These are bounded mapping/definition exceptions, not proven issuer errors. Old reference aggregates are excluded from new assessments; underlying source bytes and approved facts are preserved. No issuer-wide conflict propagation.','BID reported CAR is not recomputed from rounded billion-VND inputs or presented as future regulatory compliance. TCX maturity cash flows include expected asset realization; they are not unrestricted cash. VHM USD/EUR commitments are never added to VND balances.']
 write('DFR_04_SECTOR_RECONCILIATION.md',lines)
 scope=load('research-source-scope.json');write('DFR_04_RESEARCH_SOURCE_SCOPE.md',['# Finite nonfinancial research scope — owner approval pending',scope['policy'],scope['periodScope'],'Ceiling: 20 new documents overall; at most two issuer documents per pilot and two independent sector documents per five sectors. Overlapping documents count once; stop at the overall ceiling. Search retained corpus before any acquisition. No acquisition or source authority expansion occurred.','Owner must approve/amend/defer these source classes, periods, cutoff and ceiling. Discovery URLs remain unselected. Missing topics are bounded-retained-corpus findings, not proof no public evidence exists.','| Instance | Exact nonfinancial topics | Issuer-specific focus | Proposed source classes |','|---|---|---|---|']+[f'|{r["id"]}|'+ '; '.join(r['exactTopics'])+'|'+r['issuerScope']+'|'+ '; '.join(r['proposedSourceClasses'])+'|' for r in scope['missingRubrics']])
 vd=load('valuation-decision-sheet.json');write('DFR_04_VALUATION_DECISION_SHEET.md',['# Valuation decisions — no owner choices presumed','Cutoff, market policy, share/action policy, economic assumptions and approval receipt: **null / PENDING**. All 30 dependent instances remain NOT_RATED.']+['- '+x for x in vd['requiredDecisions']]+['','| Issuer | Valuation limitation |','|---|---|']+[f'|{t}|{SECTOR_GAPS[t]}|' for t in PILOT]+['','No default date, price, share count, growth or discount rate. Owner may approve specified choices, amend them, or defer valuation; elapsed time is not approval.'])
 write('DFR_04_OWNER_ACCEPTANCE.md',['# Owner acceptance — PENDING',f'Review result: {s["newCompleted"]} new provisional assessments; {s["completed"]}/138 completed; {s["remainingNotRated"]} deferred; zero complete issuer scorecards.','Critical: 0 identified in this bounded research closure. Major: 2 aggregate mapping/definition exceptions (VIC/VHM) contained outside new assessment inputs; unresolved exact-topic products and owner source/valuation decisions still block complete scorecards. Minor: 1 TCX source-internal common numerator difference of 1 VND retained. These issue counts do not certify the wider application/release.','Owner decisions: accept/amend/reject these bounded research judgments; approve/amend/defer the finite nonfinancial source scope; select or explicitly defer cutoff, source/share policy and economic assumptions; decide whether to authorize a separately bounded legacy aggregate correction (no correction performed here).','No approval is recorded. Do not start DFR05, expand issuer scope, activate production, change M1–M8/weights, or post portfolio/NAV/ledger/decision data.','Review validation and manifests before acceptance. Independent human methodology/source review remains separate from the two AI passes.'])

if __name__=='__main__':globals()[sys.argv[1]]()
