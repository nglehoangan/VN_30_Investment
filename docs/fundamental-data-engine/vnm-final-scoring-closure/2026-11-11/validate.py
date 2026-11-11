"""Validate VNM research package; never call formal engine with incomplete authority."""
import json,pathlib,hashlib,subprocess
from decimal import Decimal as D,getcontext
getcontext().prec=45
R=pathlib.Path.cwd();O=pathlib.Path(__file__).resolve().parent;checks=[];cache={};bindings=set()
def load(p):
 p=pathlib.Path(p)
 if p not in cache:cache[p]=json.loads(p.read_text())
 return cache[p]
def check(ok,name):checks.append(dict(name=name,passed=bool(ok)))
def binding(b):
 k=(b['path'],b['sha256'],b.get('jsonPointer',''))
 if k in bindings:return
 bindings.add(k);p=R/b['path'];check(p.is_file(),'source exists '+str(k))
 if not p.exists():return
 check(hashlib.sha256(p.read_bytes()).hexdigest()==b['sha256'],'source hash '+str(k))
 ptr=b.get('jsonPointer','')
 if ptr:
  try:
   x=load(p)
   for part in ptr.lstrip('/').split('/'):
    part=part.replace('~1','/').replace('~0','~');x=x[int(part)] if isinstance(x,list) else x[part]
   check(True,'pointer '+str(k))
  except (KeyError,IndexError,TypeError,ValueError):check(False,'pointer '+str(k))
 if b.get('pdfPath') and b.get('documentSha256'):
  p=R/b['pdfPath'];check(p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest()==b['documentSha256'],'retained PDF '+b['pdfPath'])
def walk(x):
 if isinstance(x,dict):
  if x.get('path') and x.get('sha256'):binding(x)
  for a in x.values():walk(a)
 elif isinstance(x,list):
  for a in x:walk(a)
def near(a,b,name,tol='.0001'):check(abs(D(a)-D(b))<D(tol),name)
d=load(O/'VNM_FORMAL_SCORE_INPUT_READINESS.json');c=load(O/'challenge.json');s=load(O/'six-rubrics.json');v=load(O/'valuation-decision.json')
for x in [d,c,s,v]:walk(x)
code=(R/'src/domain/scoring/methodology.ts').read_text();rubrics=json.loads(code[code.index('['):code.rindex(']')+1]);by={r['id']:r for r in rubrics}
check(len(d['researchConclusions'])==23 and set(x['rubricId'] for x in d['researchConclusions'])==set(by),'23 unique exact rubrics')
check(d['weights']==dict(BQ=25,FH=15,GQ=15,IC=10,VAL=20,RG=10,CA=5),'M3 category maxima unchanged')
for r in d['researchConclusions']:
 m=by[r['rubricId']];p=r['researchProposedPoints'];band=r['researchBand'];check(set(r['mandatoryTopics'])==set(m['topics']),'all mandatory topic conclusions '+m['id']);check(r['formalApprovedPoints'] is None,'null formal '+m['id'])
 check((p is None and band is None) or any(b['label']==band and b['min']<=p<=b['max'] for b in m['bands']),'M3 band '+m['id'])
 check(p is not None or bool(r['missingEvidenceProduct']),'pending has concrete product '+m['id'])
 if p==m['max']:check(r['maximumPrerequisitesResearchMet'] and bool(r['maximumPrerequisitesResearchJustification']),'maximum research justification '+m['id'])
check([sum(r['decision']==z for r in c['rows']) for z in ['ACCEPT','REVISE','REJECT']]==[6,2,6],'14 challenge verdicts')
check(sum(r['researchProposedPoints'] is not None for r in d['researchConclusions'])==9,'9 proposed')
check(next(r for r in d['researchConclusions'] if r['rubricId']=='RG-UNC')['researchBand']=='High uncertainty','supported zero uncertainty band')
check(next(r for r in d['researchConclusions'] if r['rubricId']=='CA-DIL')['researchProposedPoints']==1,'historical dilution research closed')
slots=d['scoreInputCandidate'];keys='id securityId companyName asOf knownAt calculatedAt priorScorecardId revisionReason methodology reference normalization evidence metrics assessments artifactScope stage0 hardVeto confidence residualRisk expectedReturn criticalMissing thesis doubleCountReview'.split()
check(set(slots)==set(keys),'all ScoreInput fields present')
check(len(slots['assessments'])==23,'all23 assessment slots')
aks='subcategory assessment selectedPoints analyst source assessedAt methodologyVersion rationale strongerEvidence maximumPrerequisitesMet exceptionalJustification disconfirmingEvidence evidence sector sectorRationale economicChannel'.split()
for a in slots['assessments']:
 check(set(a)==set(aks),'assessment fields '+a['subcategory']);check(a['source'] is None and a['analyst'] is None and a['assessedAt'] is None,'no HUMAN fabrication '+a['subcategory']);check(set(e['topic'] for e in a['evidence'])==set(by[a['subcategory']]['topics']),'candidate topic slots '+a['subcategory']);check(all(not e['refs'] for e in a['evidence']),'no context auto-admission '+a['subcategory'])
check(len(slots['evidence'])>0,'retained numeric evidence slots populated')
for e in slots['evidence']:
 check(e['quality'] is None and e['classification'] is None and e['validThrough'] is None and e['asOf'] is None,'numeric evidence not auto-qualified '+e['id'])
 source,ptr=e['source'].split('#',1);x=load(R/source)
 for k in ptr.lstrip('/').split('/'):
  k=k.replace('~1','/').replace('~0','~');x=x[int(k)] if isinstance(x,list) else x[k]
 check(e['value']==x['financialRecord']['value'],'retained numeric lexical value '+e['id'])
check(slots['metrics'][0]['metric']=='REVENUE_CAGR' and not slots['metrics'][0]['comparable'],'reported growth candidate remains blocked')
check(len(slots['confidence']['dimensions'])==5,'five confidence dimensions')
check(len(d['blockers'])==8 and len(slots['criticalMissing'])==8,'finite eight deduplicated dependencies')
check(not d['isExecutableScoreInput'] and d['formalEngineExecution']['status']=='NOT_RUN_NO_AUTHORIZED_COMPLETE_INPUT','formal call guarded')
check(d['totalScore'] is None and slots['expectedReturn'] is None and d['formalApprovedPointsCount']==0,'no partial total or expected return')
check(v['scenarioProbabilities'] is None and v['humanApproval'] is None and v['acceptedFairValue'] is None,'valuation remains unapproved')
for a in v['ownerDecisions']:check(a['approval'] is None,'owner choice unapproved '+a['id'])
# Independent case calculations, including terminal funding; do not import producer.
shares=D('2089955445');price=D('56900');DA=D('1113338463424');reserve=D('676743665122')
for case in v['cases']+ [dict(option={**v['cases'][1]['option'],'discount':x['discount'],'terminal':x['terminal']},additive=x) for x in v['sensitivity']]:
 opt=case['option']
 for typ in ['additive','completeOverlapBound']:
  if typ not in case:continue
  actual=case[typ];e0=D(opt['earnings']);e=e0;cf=[];ri=D(opt['incrementalReturn']);rate=D(opt['discount']);terminal=D(opt['terminal']);maintenance=D(opt['maintenance'])
  for idx,g in enumerate(map(D,opt['growth'])):
   prev=e;e*=1+g;scale=e/e0;growth=(e-prev)/ri;stand=reserve*scale;fund=growth+stand if typ=='additive' else max(growth,stand);cash=e+(DA-maintenance)*scale-fund;cf.append(cash);near(cash,actual['years'][idx]['commonCash'],'year cash '+opt['name']+str(idx)+typ)
  et=e*(1+terminal);sc=et/e0;growth=(et-e)/ri;stand=reserve*sc;fund=growth+stand if typ=='additive' else max(growth,stand);tc=et+(DA-maintenance)*sc-fund;tv=tc/(rate-terminal);pv=sum(x/(1+rate)**(i+1) for i,x in enumerate(cf))+tv/(1+rate)**5
  near(tv,actual['terminalValueYear5'],'terminal replay '+opt['name']+typ);near(pv,actual['equityValueVnd'],'DCF replay '+opt['name']+typ);near(pv/shares,actual['conditionalVndPerShare'],'per-share replay '+opt['name']+typ)
  irr=D(actual['conditionalFiveYearIrr']);npv=sum(x/(1+irr)**(i+1) for i,x in enumerate(cf))+tv/(1+irr)**5-price*shares;near(npv,0,'IRR replay '+opt['name']+typ,'1')
for year in s['commonEarningsPerShareSeries']:near(D(year['commonAfterFundsVnd'])/D(year['weightedShares']),year['derivedCommonEpsVnd'],'EPS '+str(year['year']))
m=s['metrics'];near(D('10136283908250')+D('1044977722500')-D('11181261630750'),m['parentDividendPayableClosingImpliedVnd'],'parent declaration/payable/cash reconciliation')
near(D('11181261630750')/shares,m['cashDividendPerShare2025'],'cash dividend/share')
op24=D('25590176323124')-D('13357706796806')-D('1827916838987');op25=D('26209474194531')-D('13641689163684')-D('1904069825709');near(op25-op24,m['deltaOperatingProfitBeforeFinanceVnd'],'operating incremental numerator');near((op25-op24)/D(m['deltaAllCashDepositAdjustedGroupCapitalVnd']),m['incrementalPretaxDiagnosticNotRoic'],'incremental diagnostic')
near(D('7690701645261')+D('1571241822856')-D('1029529085769')-D('421094220000'),v['crosscheck']['cashVnd'],'cash crosscheck')
for p in load(O/'protected-before.json'):binding(p)
auth=load(O/'authority-inspection.json');check(len(auth['changedScoringPins'])==2,'two documented exact-byte authority mismatches')
for p in auth['changedScoringPins']:check(p['approvedSha256']!=p['currentSha256'],'authority mismatch retained '+p['path'])
req=['VNM_14_SCORE_CHALLENGE.md','VNM_6_REMAINING_RUBRICS.md','VNM_VALUATION_DECISION_PACKAGE.md','VNM_FORMAL_SCORE_INPUT_READINESS.json','VNM_OWNER_APPROVAL_SHEET.md','FINAL_REVIEW.md']
for p in req:check((O/p).is_file(),'deliverable '+p)
failed=[x for x in checks if not x['passed']];report=dict(scope='RESEARCH_ARTIFACT_VALIDATION_NOT_FORMAL_SCORING_ACCEPTANCE',checks=len(checks),uniqueSourceBindings=len(bindings),failures=failed,formalEngineCalled=False,totalScore=None)
(O/'validation-results.json').write_text(json.dumps(dict(**report,details=checks),ensure_ascii=False,indent=2)+'\n')
text='# VNM — Final Scoring Validation\n\n'+str(len(checks))+' checks; '+str(len(failed))+' failures; '+str(len(bindings))+' unique source bindings. Research artifact validation only.\n\nValidated: executable M3 bands/weights/topics; all23 rubric conclusions and ScoreInput/Assessment field slots; exact source hashes/JSON Pointers and retained PDF hashes; 14 challenge verdicts; maximum CA-DIL support; independent case/terminal-funding/DCF/IRR arithmetic; EPS, dividend/payable, incremental-return and cash crosschecks; protected database/code/M3 bytes unchanged.\n\n9 research-proposed points selections;0 formal approved rows; totalScore=null. RG-UNC0 is High uncertainty supported by model range, not missing-as-zero. All owner decisions remain null. No partial numeric subtotal or price-derived BUY/SELL.\n\nFormal engine NOT RUN: candidate intentionally contains null analyst/source/date/gates, no admitted topic Evidence IDs or qualified expected return, and current executable pins differ. Running it would not constitute valid formal acceptance. Shape completeness is not type/runtime validity. Methodology approval record exists but does not extend to changed source bytes.\n\nReproduce from repository root: `python3 '+str(O.relative_to(R))+'/assemble.py`, then `python3 '+str(O.relative_to(R))+'/write-review.py`, then `python3 '+str(O.relative_to(R))+'/validate.py`. Model numbers can be regenerated separately with `valuation-model.py`. No app code changed; no unrelated app build/full-suite or source-image reinspection claim. Source/time inventory is a scoped candidate-binding inspection, not proof publication evidence is absent everywhere.\n\n'
if failed:text+='Failures: '+json.dumps(failed)
(O/'VNM_FINAL_SCORING_VALIDATION.md').write_text(text)
print(json.dumps(report));raise SystemExit(bool(failed))
