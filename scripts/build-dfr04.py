"""Bounded evidence recovery. Never imports production repositories or opens SQLite."""
import json,hashlib,sys,unicodedata
from pathlib import Path
from datetime import datetime,timezone
from collections import Counter
from copy import deepcopy
from lib.dfr02 import PILOT,pointer
from lib.dfr03 import validate_review,propagate
ROOT=Path(__file__).resolve().parents[1]
BASE='docs/fundamental-data-engine'
D2=BASE+'/dfr-02/2026-11-04';D3=BASE+'/dfr-03/2026-11-05';REL=BASE+'/dfr-04/2026-11-05';OUT=ROOT/REL
CATEGORIES={
 'financial':['luu chuyen','phai thu','hang ton kho','no xau','qua han','von chu so huu','thanh khoan','dao han','cam ket'],
 'business':['ghi nhan doanh thu','bo phan','hoat dong chinh','khach hang'],
 'industry_competition':['thi phan','doi thu','canh tranh','rao can'],
 'governance':['ben lien quan','hoi dong quan tri','kiem toan','co dong thieu so'],
 'valuation':['loi nhuan tren co phieu','lai co ban tren co phieu','gia tri hop ly','co phieu pho thong'],
 'conflicts':['trinh bay lai','dieu chinh hoi to','phan loai lai','thay doi chinh sach']}
GROUPS={'BQ-EQ':'financial','BQ-MOAT':'industry_competition','BQ-CASH':'financial','BQ-RES':'business','FH-BS':'financial','FH-LIQ':'financial','FH-STRESS':'financial','GQ-HIST':'financial','GQ-FWD':'business','GQ-INC':'financial','IC-IND':'industry_competition','IC-POS':'industry_competition','IC-CYCLE':'industry_competition','VAL-PRIMARY':'valuation','VAL-RET':'valuation','VAL-MOS':'valuation','RG-GOV':'governance','RG-RISK':'financial','RG-UNC':'conflicts','CA-REINV':'financial','CA-DIST':'financial','CA-DIL':'valuation','CA-PSV':'valuation'}
# Exact missing analytical product, not a repeated request for existing financial files.
DEPENDENCIES={
 'BQ-EQ':'Reconcile recurring returns and margins across FY22–25 to average invested capital and an explicit cost-of-capital assumption; reported ROE alone cannot establish economic spread.',
 'BQ-MOAT':'Bind comparative competitor/customer evidence to advantage, observable pricing/cost behavior and persistence; accounting scale and recognition policy do not demonstrate a moat.',
 'BQ-CASH':'Bank-specific loan-quality/provision, interest accrual-to-receipt and deposit/funding reconciliation; industrial CFO/NPAT is ineligible for BID.',
 'BQ-RES':'Bind customer/product concentration, pricing response and an actual adverse-period operating response; segment descriptions alone do not establish resilience.',
 'FH-BS':'Qualify asset-quality notes and restricted/pledged assets against capital and funding by sector; reconcile note totals to pinned closing balances before assigning a band.',
 'FH-LIQ':'Build one matched obligation/maturity/unrestricted-liquidity schedule and identify contractual covenant obligations/headroom or expressly documented absence; management renewal expectations are not committed lines.',
 'FH-STRESS':'Specify a plausible issuer shock and quantified funding/capital response including restrictions and maturities; an earnings sensitivity grid is insufficient.',
 'GQ-HIST':'Bridge acquisitions, scope changes and base effects into comparable per-share FY22–25 growth; consolidated revenue CAGR is insufficient.',
 'GQ-FWD':'Bind a dated operating runway to reinvestment, committed funding and observable execution milestones; no forward growth is inferred from accounting balances.',
 'GQ-INC':'Identify incremental recurring earnings, aligned invested-capital cohorts and unit economics; no ratio of unmatched changes.',
 'IC-IND':'Obtain dated sector evidence on barriers, competition, demand and disruption from a named qualified comparative source; no financial-note keyword proves industry attractiveness.',
 'IC-POS':'Obtain matched-date market-share denominator, relative cost position and distribution comparison; issuer size is not market share.',
 'IC-CYCLE':'Bind sector cycle indicators to normalized forward asymmetry and issuer survivability; historical statements alone are insufficient.',
 'VAL-PRIMARY':'Bind the existing conditional primary model to normalized common denominator, cutoff-matched price, share/action basis and independent cross-check.',
 'VAL-RET':'Bind entry price, exit value, distributions, dilution and economic scenarios on one per-share/cutoff basis; conditional earnings are not an expected-return forecast.',
 'VAL-MOS':'Establish conservative common-equity value and downside with encumbrances/NCI waterfall, matched market price and share/action basis.',
 'RG-GOV':'Assess auditor findings, specific related-party terms, disclosure consistency and minority outcomes; related-party disclosure alone is neither good nor bad governance.',
 'RG-RISK':'Separate residual loss channels from already scored normalization/uncertainty and test documented mitigations; a policy statement is not control-effectiveness evidence.',
 'RG-UNC':'Review forecast denominator/sensitivity/dependencies against actual scope and normalization exceptions; model grid width alone cannot earn a band.',
 'CA-REINV':'Trace material capex/acquisition/divestment cohorts to realized economic outcomes; spending alone proves neither destruction nor accretion.',
 'CA-DIST':'Link retention/distributions and buyback terms to valuation and through-cycle resilience; a paid dividend alone does not establish discipline.',
 'CA-DIL':'Reconcile issue terms, proceeds use and per-share economic impact with the full corporate-action sequence.',
 'CA-PSV':'Build split/bonus/issuance-adjusted per-share value and distributions over a comparable cycle; no raw EPS compounding inference.'}
CONTEXT={
 'FPT':'Technology/services: completion estimates and FTEL equity-method scope change; telecom receivable classification bridge is not a cash/scope bridge.',
 'VNM':'Consumer/dairy: reported cash realization is already rated; competitive pricing/customer demand, acquisition economics and buyback valuation need distinct proof.',
 'BID':'Bank: asset classification, provisioning, interest realization, deposit stability and regulatory capital; never substitute industrial free cash flow.',
 'TCX':'Securities: margin/AFS/HTM expansion consumes operating cash; collateral market value is not a stressed realizable recovery.',
 'VIC':'Diversified/property/EV: donor support, project cash, creditors and EV residual-value obligations; group cash cannot be allocated to parent by NPAT ratio.',
 'VHM':'Property: handover timing, project inventories, partner/customer advances, restricted maintenance funds and NCI waterfall; no straight-through group FCFE.'}

TOPIC_PRODUCTS={
'capital':'Reconcile ordinary/parent capital, deductions and applicable sector buffer to the pinned balance sheet.',
'asset_quality':'Reconcile aged/impaired assets, provisions, collateral restrictions and concentrations to closing exposure.',
'funding':'Separate deposits, borrowings, advances, committed lines and restricted funds by economic availability.',
'leverage_context':'Evaluate matched obligations against sector earning assets and downside capital; do not use an industrial shortcut for financials.',
'obligations':'List contractual principal, interest, guarantees and operating/project obligations without double counting.',
'liquidity':'Identify unrestricted cash and committed usable lines; exclude maintenance/shared/pledged funds.',
'maturities':'Match contractual time buckets and stress rollover; saleable securities are not contractual cash repayments.',
'covenants':'Locate exact covenant terms and measured headroom/waivers, or an explicit source statement that none apply.',
'trend':'Reconcile annual reported trend to recurring earnings under constant reporting scope.',
'acquisitions':'Separate acquired/divested contribution and link transaction cost to realized operating outcomes.',
'base_effects':'Identify scope, restatement, cycle and exceptional-base changes with signed bridges.',
'per_share':'Bind split/bonus/issuance-adjusted numerator and share basis on comparable dates.',
'auditor':'Read exact opinion/key findings and their economic relevance; do not infer governance quality from the word audited.',
'disclosure':'Assess actual timeliness/consistency and corrections with dated evidence; unknown original publication dates stay null.',
'related_parties':'Evaluate named counterparties, terms, balances and realized outcomes; disclosure itself proves neither fairness nor abuse.',
'minority':'Locate actual minority-shareholder outcomes, approval terms and economic allocation; NCI balances alone are insufficient.',
'share':'Bind market-share numerator and industry denominator to one definition and date.',
'cost_position':'Compare like-for-like peer unit costs and economics with source definitions.',
'distribution':'Distinguish actual distribution/channel reach or cash distributions according to this rubric; bind outcomes and comparison.',
'advantage':'Identify the specific claimed advantage and falsifiable evidence relative to competitors.',
'economic_behavior':'Show observed pricing/retention/cost behavior attributable to the proposed advantage.',
'persistence':'Test the claimed economic advantage/returns across multiple comparable periods including adversity.',
'price':'Bind an eligible dated quote, currency and corporate-action/share basis to the research cutoff.',
'normalized_denominator':'Reconcile recurring after-tax common earnings/owner cash with NCI and economic adjustments.',
'primary_model':'Specify the approved sector valuation model and all source-bound inputs/assumptions.',
'cross_check':'Supply an independently reasoned sector-appropriate value cross-check.',
'issue_terms':'Identify issuance prices, eligibility, rights, fees and relevant market/value comparison.',
'proceeds':'Trace proceeds to actual uses and resulting common-owner economics.',
'actions':'Reconcile all corporate actions and effective share changes before per-share comparisons.',
'capex':'Separate maintenance/growth and tie material cohorts to observed returns; no guessed maintenance ratio.',
'divestments':'Trace proceeds, tax/NCI and lost recurring earnings from named disposals.',
'forecast_range':'Define economic forecast cases around actual scope/normalization dependencies, not arbitrary grid width.',
'sensitivity':'Show economic drivers and transmission to recurring common earnings/cash.',
'dependencies':'List and test the decisive operating, reporting-scope and financing dependencies.'}

def read(p):return json.loads((ROOT/p).read_text())
def sha(p):return hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
def h(x):return hashlib.sha256(json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def now():return datetime.now(timezone.utc).isoformat()
def dump(p,x):
 f=OUT/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def load(p):return read(REL+'/'+p)
def norm(s):return ''.join(c for c in unicodedata.normalize('NFD',s.lower().replace('đ','d')) if unicodedata.category(c)!='Mn')
def rules():return json.loads((ROOT/'src/domain/scoring/methodology.ts').read_text().split('deepFreeze(',1)[1].rsplit(');',1)[0])
def protected():
 out={}
 for base in ['src','app','prisma','config','docs','data']:
  for p in sorted((ROOT/base).rglob('*')):
   if p.is_file() and 'dfr-04' not in p.parts:out[str(p.relative_to(ROOT))]=sha(str(p.relative_to(ROOT)))
 for p in (ROOT/'scripts').rglob('*'):
  if p.is_file() and 'dfr04' not in p.name and '__pycache__' not in p.parts:out[str(p.relative_to(ROOT))]=sha(str(p.relative_to(ROOT)))
 return out

def check():
 s=load('inspection.json')
 for p,v in s['pins'].items():
  if sha(p)!=v:raise ValueError('INPUT_CHANGED:'+p)
 if protected()!=s['protectedBefore']:raise ValueError('PROTECTED_CHANGED')
 return s

def inspect():
 before=protected();pins={};inventory=[];candidates=[];prior=[]
 # Revalidate sealed predecessor outputs and original source pins, including DFR01 references retained by DFR02.
 for p,v in read(D2+'/input-snapshot.json')['pins'].items():
  if sha(p)!=v:raise ValueError('DFR02_SOURCE_CHANGED:'+p)
  pins[p]=v
 for stage in [D2,D3]:
  for name,key in [('manifest.json','outputs'),('final-review-manifest.json','files')]:
   for p,v in read(stage+'/'+name)[key].items():
    if sha(stage+'/'+p)!=v:raise ValueError('PREDECESSOR_CHANGED:'+p)
    pins[stage+'/'+p]=v
   pins[stage+'/'+name]=sha(stage+'/'+name)
 for t in PILOT:
  for p in [f'data/manual-extracted-pdf/{t}.json',f'data/manual-extracted-api/{t}.json',f'data/combine/{t}.json',f'data/manual-extracted-pdf/notes/{t}.json']:
   read(p);pins[p]=sha(p)
  p=f'data/manual-extracted-pdf/notes/{t}.json'
  for di,d in enumerate(read(p)['documents']):
   paths=[]
   for pdf in d['pdfPaths']:
    exists=(ROOT/pdf).is_file();actual=sha(pdf) if exists else None
    if exists and actual!=d['sourceHash']:raise ValueError('PDF_HASH_MISMATCH:'+pdf)
    paths.append(dict(path=pdf,exists=exists,sha256=actual))
    if exists:pins[pdf]=actual
   inventory.append(dict(ticker=t,notesPath=p,jsonPointer=f'/documents/{di}',identity=d.get('identity'),sourceHash=d['sourceHash'],pdfPaths=paths,pageCount=d['pageCount']))
   for pi,page in enumerate(d['pages']):
    text=norm(page['text']);cats=[cat for cat,terms in CATEGORIES.items() if any(term in text for term in terms)]
    if cats:candidates.append(dict(id=f'{t}:D{di}:P{page["page"]}',ticker=t,path=p,sha256=pins[p],jsonPointer=f'/documents/{di}/pages/{pi}',page=page['page'],pdfHash=d['sourceHash'],categories=cats,status='CANDIDATE_ONLY',sourceStatus=page.get('status'),scopeCandidate=page.get('scopeCandidate'),reportCandidate=page.get('reportCandidate')))
 # Search retained prior evidence across the repository without copying other issuer datasets.
 for p in sorted((ROOT/BASE).rglob('*.json')):
  if 'dfr-04' in p.parts:continue
  if p.stem in PILOT or any(t in p.name for t in PILOT):
   rel=str(p.relative_to(ROOT));prior.append(dict(path=rel,sha256=sha(rel)));pins[rel]=sha(rel)
 for p in ['scripts/build-dfr04.py','scripts/dfr04-preparation.json','scripts/dfr04-challenge.json','scripts/dfr04-reviewed-evidence.json','scripts/test-dfr04.py','scripts/lib/dfr04_reports.py','scripts/verify-dfr04-boundaries.mjs'] :pins[p]=sha(p)
 parity={t:dict(path=D2+f'/issuers/{t}.json',sha256=sha(D2+f'/issuers/{t}.json'),metricsHash=h(read(D2+f'/issuers/{t}.json')['metrics'])) for t in PILOT}
 dump('inspection.json',dict(inspectedAt=now(),pins=pins,protectedBefore=before,financialParity=parity,baselineCompleted=7))
 dump('source-inventory.json',dict(documents=inventory,priorEvidence=prior,searchRoots=['data/manual-extracted-pdf','data/manual-extracted-api','data/combine',BASE],limitations='Keyword indexing is discovery, not page-by-page analytical qualification. Absence means not located in bounded retained sources, not proof of universal absence.'))
 dump('candidate-index.json',candidates)
 # Qualify ONLY the explicitly read/reviewed observations, never all keyword hits.
 reviewed=read('scripts/dfr04-reviewed-evidence.json')
 for e in reviewed:
  obj=pointer(read(e['path']),e['jsonPointer'])
  if e.get('pdfPath') and sha(e['pdfPath'])!=e['pdfHash']:raise ValueError('REVIEWED_PDF_CHANGED')
  e['sha256']=sha(e['path']);e['boundObjectHash']=h(obj)
 dump('evidence-map.json',dict(categories=CATEGORIES,rubricCategories=GROUPS,qualified=reviewed,candidateQualificationRule='Explicit topic-specific reading; amount requires prior verified extraction or original-page inspection. No automatic promotion of OCR, units, market-share or governance claims.'))

def resolve(ref):
 if ref.startswith('NOTE:'):
  e=next(e for e in load('evidence-map.json')['qualified'] if e['id']==ref)
  if e['status']!='QUALIFIED_CONTEXT':raise ValueError('CANDIDATE_NOT_QUALIFIED')
  if h(pointer(read(e['path']),e['jsonPointer']))!=e['boundObjectHash']:raise ValueError('EVIDENCE_CHANGED')
  return e
 if ref.startswith('D2:'):
  t=ref.split(':')[1];p=D2+f'/issuers/{t}.json'
  return dict(status='QUALIFIED_CONTEXT',path=p,sha256=sha(p),jsonPointer='/estimates',kind='CONDITIONAL_NOT_FACT')
 raise ValueError('UNKNOWN_EVIDENCE')

def validate(a,rule):
 validate_review(a,rule,resolve)
 for e in a['evidence']:
  topics=set()
  for ref in e['refs']:
   b=resolve(ref)
   if ref.startswith('NOTE:'):topics.update(b['qualifiedTopics'])
   elif ref.startswith('D2:'):topics.update(['forecast_range','sensitivity','dependencies'])
  if e['topic'] not in topics:raise ValueError('TOPIC_NOT_QUALIFIED:'+e['topic'])
 return True

def prepare():
 check();rm={r['id']:r for r in rules()};aa=read('scripts/dfr04-preparation.json')
 for a in aa:
  validate(a,rm[a['subcategory']])
  a['bindings']={ref:resolve(ref) for e in a['evidence']+a['counterevidence'] for ref in e['refs']}
 dump('preparation.json',dict(preparedAt=now(),inspectionHash=sha(REL+'/inspection.json'),actor='CHATGPT',independentHumanReviewClaimed=False,batchOrder=['FOUR_ANALYST_PENDING','ADDITIONAL_TOPIC_READY'],assessments=aa))

def challenge():
 check();p=load('preparation.json');cs=read('scripts/dfr04-challenge.json');out=[];rm={r['id']:r for r in rules()}
 for a in p['assessments']:
  c=next(c for c in cs if c['id']==a['id']);final=deepcopy(a);final.update(selectedPoints=c['points'],assessment=c['band'])
  if len(c['counterTests'])<3 or not c['rationale']:raise ValueError('CHALLENGE_INSUFFICIENT')
  validate(final,rm[a['subcategory']])
  out.append(dict(id=a['id'],preparationHash=h(a),challenge=c,finalAssessment=final))
 dump('challenge.json',dict(challengedAt=now(),preparationHash=sha(REL+'/preparation.json'),specificationHash=sha('scripts/dfr04-challenge.json'),reviewMode='DISTINCT_SELF_CHALLENGE_NOT_INDEPENDENT_HUMAN',records=out))

def deferred(t,r,candidates):
 qualified=[e for e in load('evidence-map.json')['qualified'] if e['ticker']==t]
 cat=GROUPS[r['id']];hits=[x['id'] for x in candidates if x['ticker']==t and cat in x['categories']]
 val=r['id'].startswith('VAL-') or r['id'] in ('CA-DIL','CA-PSV')
 external=r['id'].startswith('IC-') or r['id']=='BQ-MOAT'
 cl='VALUATION_MARKET_DEPENDENCY' if val else ('GENUINELY_ABSENT' if external else 'EXISTS_MAPPING_INCOMPLETE')
 blocker='E3' if val else ('E1' if external else 'E2')
 if r['id']=='RG-GOV':cl='EXISTS_ANALYST_JUDGMENT';blocker='E1'
 if cl=='GENUINELY_ABSENT' and any(set(e['qualifiedTopics']).intersection(r['topics']) for e in qualified):cl='EXISTS_MAPPING_INCOMPLETE';blocker='E2'
 dep=DEPENDENCIES[r['id']]
 if t=='TCX' and r['id'].startswith('VAL-'):dep+=' Retain the 1 VND printed-common-numerator conflict as MINOR; conditional estimate references remain conflicted until exact reconciliation, without treating this as material issuer-wide uncertainty.'
 return dict(classification=cl,exactDependency=dep,issuerContext=CONTEXT[t],candidateEvidenceIds=hits,qualifiedTopicCompleteness=False,sourceConflict={'id':'TCX:PRINTED_COMMON_NUMERATOR','severity':'MINOR','amountVnd':'1','resolutionPath':'E4'} if t=='TCX' and r['id'].startswith('VAL-') else None,resolutionOwner='OWNER_SOURCE_SCOPE_DECISION' if external else 'RESEARCH_ANALYST',resolutionPath=blocker,requiredTopics=r['topics'],topicDependencies=[dict(topic=x,requiredProduct=TOPIC_PRODUCTS.get(x, 'Produce topic-specific source-bound '+x+' evidence and counterevidence. ')+ ' '+dep,candidateCategory=cat,candidateEvidenceIds=hits,qualifiedEvidenceIds=[e['id'] for e in qualified if x in e['qualifiedTopics']],qualification='QUALIFIED_CONTEXT_AVAILABLE_BUT_RUBRIC_INCOMPLETE' if any(x in e['qualifiedTopics'] for e in qualified) else 'NOT_YET_TOPIC_BOUND') for x in r['topics']])

def finalize():
 s=check();p=load('preparation.json');c=load('challenge.json');rm={r['id']:r for r in rules()}
 if not s['inspectedAt']<p['preparedAt']<c['challengedAt']:raise ValueError('PASS_ORDER')
 if c['preparationHash']!=sha(REL+'/preparation.json') or c['specificationHash']!=sha('scripts/dfr04-challenge.json'):raise ValueError('PASS_HASH')
 new={x['id']:x['finalAssessment'] for x in c['records']};rows=[];ci=load('candidate-index.json')
 for t in PILOT:
  old=read(D3+f'/issuers/{t}.json');own=[]
  for o in old['rubrics']:
   x=deepcopy(o);a=new.get(o['id']);x['newCompleted']=a is not None;x['baselineCompleted']=o['status']=='COMPLETED_RESEARCH'
   if a:
    validate(a,rm[x['rubric']]);x.update(status='COMPLETED_RESEARCH',eligibility='READY_FOR_ASSESSMENT',points=a['selectedPoints'],band=a['assessment'],assessment=a,topicBlockers=[],reason=a['rationale'],deferred=None)
   elif x['baselineCompleted']:x['deferred']=None
   else:
    d=deferred(t,rm[x['rubric']],ci);x.update(status='NOT_RATED',points=None,band=None,assessment=None,deferred=d,reason=d['exactDependency'],eligibility=d['classification'],topicBlockers=d['topicDependencies'])
   own.append(x);rows.append(x)
  old.update(contract='dfr04-partial-research-v1',classification='RESEARCH_PROVISIONAL',rubrics=own,totalScore=None,ranking=None,currentSignal=None,valuationPerShare=None,productionAdmissible=False,scoringAuthorized=False);dump(f'issuers/{t}.json',old)
 assert len(rows)==138 and len({x['id'] for x in rows})==138
 done=[x for x in rows if x['status']=='COMPLETED_RESEARCH'];remaining=[x for x in rows if x['status']=='NOT_RATED']
 summary=dict(baselineCompleted=7,completed=len(done),newCompleted=len(new),remainingNotRated=len(remaining),fourPendingResolved=sum(x['id'] in new for x in read(D3+'/eligibility.json') if x['eligibility']=='ANALYST_REVIEW_PENDING'),completeIssuerScorecards=0,remainingClasses=dict(Counter(x['eligibility'] for x in remaining)),financialMetricChanges=0,formalAcceptance=0,productionActivated=False,ownerApproval='PENDING')
 dump('completion-matrix.json',rows);dump('assessment-results.json',done);dump('summary.json',summary)
 dump('financial-parity.json',dict(status='PASS',references=s['financialParity'],metricChanges=0,periodScopeUnits='DFR02 FY22–25 qualification, explicit exclusions and unknown CafeF units unchanged'))
 from lib.dfr04_reports import reports
 reports(OUT,rows,summary,load('source-inventory.json'),load('evidence-map.json'))
 print(json.dumps(summary))

if __name__=='__main__':globals()[sys.argv[1]]()
