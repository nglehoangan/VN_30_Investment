"""P2.5 read-only analysis proof. Writes only its own versioned documentation folder.
No financial replay, scorer/decision invocation, source acquisition or DB writes.
"""
from pathlib import Path
from collections import Counter
from decimal import Decimal
import json,sys,hashlib,re,sqlite3,subprocess
ROOT=Path(__file__).resolve().parents[4]
assert (ROOT/'AGENTS.md').exists()
sys.path.insert(0,str(ROOT/'scripts'))
from lib import dfr05_p1 as p1
OUT=Path(__file__).resolve().parent
BASELINE='74510523aa68696a117386751047fea638737279'
BASE='docs/fundamental-data-engine/dfr-05/'
DOSSIERS={'ACB':BASE+'p2-2-acb-01-264c7120/ACB.json',**{t:BASE+f'p2-3-b1-bank-07b94a51/issuers/{t}.json' for t in ['CTG','MBB','TCB','VCB']},'SSI':BASE+'p2-4-b1-ssi-fc688e49/dossier.json'}
TICKERS=tuple(DOSSIERS)
PINS={};CACHE={}
def read(path):
 if path not in CACHE:
  p=ROOT/path;PINS[path]=p1.sha(p);CACHE[path]=json.loads(p.read_text())
 return CACHE[path]
def write(name,x):
 (OUT/name).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def bind(path,ptr=''):
 x=read(path);return dict(path=path,sha256=PINS[path],jsonPointer=ptr,objectHash=p1.digest(p1.pointer(x,ptr)))
def markdown(name,text):
 for a,b in [('has43','has 43'),('dependencies:37','dependencies: 37'),('ofFY','of FY'),('plus5FY2025','plus 5 FY2025'),('plus6','plus 6'),('cover37','cover 37'),('the37','the 37'),('with6','with 6'),('has8','has 8'),('VCB10','VCB 10'),('priority3','priority 3'),('are0','are 0'),('all37','all 37'),('but8','but 8'),('but10','but 10'),('exactly138','exactly 138'),('forTCB','for TCB'),('acrossB1','across B1'),('boundedTCB','bounded TCB'),('and23','and 23'),('stays745','stays 745'),('/54','/ 54'),('/84','/ 84')]:text=text.replace(a,b)
 text=re.sub(r'provides(\d+)',r'provides \1',text)
 (OUT/('DFR_05_P2_5_'+name+'.md')).write_text(text.strip()+'\n')
def link(path,label=None):return f'[{label or Path(path).name}](/{ROOT.relative_to(ROOT.anchor)}/{path})'

def specs():
 PINS['src/domain/scoring/methodology.ts']=p1.sha(ROOT/'src/domain/scoring/methodology.ts')
 return p1.module('p25_specs_only','scripts/build-dfr02.py').rubrics()

# Context mappings are research-readiness mappings, never new M3 scoring rules.
# Missing mandatory topics remain blocked regardless of the number of metrics.
COMMON={
 'BQ-EQ':['TOTAL_EQUITY','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','GROUP_ROE_AVG','GROUP_ROA_AVG'],
 'BQ-CASH':['NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT'],
 'BQ-RES':['TOTAL_ASSETS','TOTAL_EQUITY'],
 'FH-BS':['TOTAL_ASSETS','TOTAL_EQUITY'],
 'FH-LIQ':[],
 'FH-STRESS':['TOTAL_EQUITY'],
 'GQ-HIST':['TOTAL_ASSETS_YOY','TOTAL_EQUITY_YOY','NET_INCOME_YOY','NET_INCOME_ATTRIBUTABLE_PARENT_YOY','NET_INCOME_ATTRIBUTABLE_PARENT','NET_INCOME_FY22_25_CHANGE'],
 'GQ-FWD':['TOTAL_EQUITY'], 'GQ-INC':['TOTAL_EQUITY','NET_INCOME_ATTRIBUTABLE_PARENT','GROUP_ROE_AVG'],
 'IC-CYCLE':['NET_INCOME_YOY'], 'RG-RISK':['TOTAL_EQUITY'], 'RG-UNC':['NET_INCOME_ATTRIBUTABLE_PARENT'],
 'CA-REINV':['TOTAL_EQUITY','TOTAL_ASSETS','NET_INCOME_ATTRIBUTABLE_PARENT'],
 'CA-DIST':['TOTAL_EQUITY'], 'CA-PSV':['NET_INCOME_ATTRIBUTABLE_PARENT']}
BANK={
 'BQ-EQ':['BANK_NET_INTEREST_INCOME','NII_ASSETS_CLOSING','BANK_CREDIT_PROVISION_EXPENSE'],
 'BQ-CASH':['BANK_INTEREST_INCOME','BANK_INTEREST_EXPENSE','BANK_CREDIT_PROVISION_EXPENSE','BANK_NII_COMPONENT_RECONCILIATION'],
 'BQ-RES':['BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS','LOAN_DEPOSIT'],
 'FH-BS':['BANK_REPORTED_CAR','BANK_REPORTED_CET1','BANK_CUSTOMER_LOAN_NPL_RATIO','BANK_CUSTOMER_LOAN_NPL_COVERAGE','BANK_LOAN_LOSS_RESERVES','GROUP_EQUITY_ASSETS','BANK_CUSTOMER_LOAN_NPL'],
 'FH-LIQ':['BANK_CUSTOMER_DEPOSITS','LOAN_DEPOSIT','BANK_INTERBANK_FUNDING_REPORTED','BANK_ISSUED_FUNDING_INSTRUMENTS','BANK_CENTRAL_BANK_GOVT_FUNDING'],
 'FH-STRESS':['BANK_REPORTED_CAR','BANK_CUSTOMER_LOAN_NPL_RATIO'],
 'GQ-HIST':['BANK_GROSS_CUSTOMER_LOANS_YOY','BANK_CUSTOMER_DEPOSITS_YOY','BANK_NET_INTEREST_INCOME_YOY','BANK_GROSS_CUSTOMER_LOANS_FY22_25_CHANGE'],
 'GQ-FWD':['BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS','BANK_REPORTED_CAR'],
 'GQ-INC':['BANK_GROSS_CUSTOMER_LOANS','BANK_LOAN_LOSS_RESERVES'],
 'RG-RISK':['BANK_CUSTOMER_LOAN_NPL_RATIO','BANK_CUSTOMER_LOAN_NPL_COVERAGE','LOAN_DEPOSIT','BANK_REPORTED_CAR'],
 'CA-REINV':['BANK_GROSS_CUSTOMER_LOANS']}
SEC={
 'BQ-EQ':['OPERATING_REVENUE','FVTPL_GROSS_GAINS','FVTPL_GROSS_LOSSES','NET_FVTPL_REPORTED'],
 'BQ-CASH':['FVTPL_REALIZED_GAINS','FVTPL_UNREALIZED_GAINS','FVTPL_REALIZED_LOSSES','FVTPL_UNREALIZED_LOSSES','LOAN_RECEIVABLE_INTEREST'],
 'BQ-RES':['SECURITIES_MARGIN_LOANS','FINANCIAL_DEBT','MARGIN_EQUITY'],
 'FH-BS':['FVTPL_ASSETS','AFS_ASSETS','HTM_ASSETS','FINANCIAL_DEBT_EQUITY','MARGIN_EQUITY'],
 'FH-LIQ':['CASH_AND_EQUIVALENTS','REPORTED_CASH_FINANCIAL_DEBT','FINANCIAL_DEBT','CUSTOMER_CASH_OFF_BALANCE','RESTRICTED_CASH','UNRESTRICTED_CORPORATE_LIQUIDITY','CUSTOMER_PAYABLES_OFF_BALANCE'],
 'FH-STRESS':['MARGIN_EQUITY','FINANCIAL_DEBT_EQUITY'],
 'GQ-HIST':['OPERATING_REVENUE_YOY','SECURITIES_MARGIN_LOANS_YOY'],
 'GQ-FWD':['SECURITIES_MARGIN_LOANS','TOTAL_EQUITY'], 'GQ-INC':['SECURITIES_MARGIN_LOANS'],
 'RG-RISK':['MARGIN_EQUITY','FINANCIAL_DEBT_EQUITY','CUSTOMER_CASH_OFF_BALANCE'],
 'CA-REINV':['SECURITIES_MARGIN_LOANS','FVTPL_ASSETS']}
# A narrative about a ratio does not meet critical topic evidence for these rows.
CRITICAL_ROWS={'BQ-MOAT','FH-STRESS','GQ-FWD','IC-IND','IC-POS','IC-CYCLE','VAL-PRIMARY','VAL-RET','VAL-MOS','RG-GOV','RG-UNC','CA-DIST','CA-DIL','CA-PSV'}
DEPENDENCIES={
 'BQ-EQ':'Sustainable common-owner returns and comparable economic capital; normalized margins and through-cycle costs; cost-of-capital basis, persistence and downside qualifications.',
 'BQ-MOAT':'Issuer-specific advantage, economic customer/pricing behavior and durability; audited financial statements or size do not establish moat.',
 'BQ-CASH':'Cash realization versus accrual recognition; recurring/one-off bridge; working-capital/interest recognition and loss adjustments appropriate to sector.',
 'BQ-RES':'Customer/borrower/collateral and funding concentration; pricing power; cycle response and evidenced adverse-stress behavior.',
 'FH-BS':'Full asset-quality population, common/regulatory-capital deductions and buffers, funding quality and normalized/downside resilience.',
 'FH-LIQ':'Dated contractual obligations and maturity ladder, unrestricted usable funds, funding concentration, collateral/encumbrances and covenant terms.',
 'FH-STRESS':'Evidence-bounded sector stress scenarios plus approved analyst assumptions and quantified funding/capital response; no fabricated shock values.',
 'GQ-HIST':'Acquisition/base-effect, revision and corporate-action bridges; comparable common-owner per-share growth and cycle adjustments.',
 'GQ-FWD':'Qualified forward runway, reinvestment opportunities, funding constraints and execution evidence; historical growth is not a forecast.',
 'GQ-INC':'Incremental recurring common-owner return, correct deployed-capital denominator/lag and unit economics net of risk/funding costs.',
 'IC-IND':'Dated industry barriers, competitive behavior, demand economics and disruption evidence under existing source authority.',
 'IC-POS':'Qualified market-share denominator and cohort; relative cost and distribution economics; no size-to-market-share inference.',
 'IC-CYCLE':'Independent dated cycle position and sector downside asymmetry; one issuer earnings trend is insufficient.',
 'VAL-PRIMARY':'Approved valuation cutoff/source policy, sustainable common earnings/book basis, compatible shares/actions, economic assumptions and independent crosscheck.',
 'VAL-RET':'Compatible starting price, action-adjusted shares/distributions, scenario assumptions and 5-year terminal economics; no synthetic return.',
 'VAL-MOS':'Conservative qualified intrinsic-value range and price cutoff; downside asymmetry and approved margin-of-safety method.',
 'RG-GOV':'Qualified auditor findings, related-party terms, disclosure behavior, minority protections and incentives; audit status alone is insufficient.',
 'RG-RISK':'Distinct residual risk channels and evidenced mitigations after BQ/FH analysis, with overlap/double-count review.',
 'RG-UNC':'Qualified forecast ranges, sensitivities and shared model/source dependencies; no invented confidence or forecast range.',
 'CA-REINV':'Named management allocation decisions, acquisition/divestment/reinvestment deployment and subsequent economic outcomes; growth balances alone are insufficient.',
 'CA-DIST':'Actual retention/distribution decisions, sensible buyback valuation where relevant, and resilience; no blank N/A without evidence.',
 'CA-DIL':'Complete issuer action/issue terms, proceeds use, share basis and per-share economic effects.',
 'CA-PSV':'Comparable common-owner per-share value across actions and cycle; shares cannot be inferred from EPS or group NPAT.'}
ASSUMPTIONS={
 'BQ-EQ':'Normalized credit/trading cost, sustainable returns and cost of equity require identified analyst basis; none selected here.',
 'FH-STRESS':'Collateral/credit loss, deposit outflow, spread/market shock and funding/capital responses require approved assumptions.',
 'GQ-FWD':'Forecast runway, balance growth and funding/capital paths are not approved.',
 'GQ-INC':'Lagged economic capital and risk-adjusted incremental earnings require analyst qualification.',
 'RG-UNC':'Forecast ranges and sensitivity assumptions are unapproved.',
 'VAL-PRIMARY':'Discount/required return, normalized earnings/book, growth/payout/tax and terminal inputs not selected.',
 'VAL-RET':'Five-year scenarios, distributions, dilution and terminal exit economics not approved.',
 'VAL-MOS':'Downside scenarios and uncertainty range not approved.'}
ISSUER_CONTEXT={
 'ACB':'FY2025 reported CAR/CET1 have their own TT14 framework; no cross-bank capital percentage inference. Parent NPAT is unqualified in the sealed dossier; CASA/NIM remain definition gaps.',
 'CTG':'Eight sealed revision-dependent conflicts remain. FY2024 NPL denominator/grouping and original/restated FY2022 bridges affect only named dependent calculations; funding/income supplements before FY2025 remain unmapped.',
 'MBB':'Group subsidiaries/minorities matter: FY2025 group and explicit parent earnings differ. FY2022/FY2023 parent NPAT and earlier funding/income supplements are unmapped; no organic/per-share growth inference.',
 'TCB':'Customer-loan allowance excludes margin-lending allowance: customer reserve10,485,620 million versus total-contra magnitude10,498,378 million. TCBS/minority and issuer corporate actions require separate common-owner and per-share bridges.',
 'VCB':'Ten sealed cross-vintage conflicts constrain FY2023/FY2024 returns and growth. Historical share/EPS and later comparative versions remain separate; FY2025 NPL diagnostics do not establish stressed asset quality.',
 'SSI':'Consolidated scope; client cash/custody remain separate from corporate liquidity. Gross FVTPL gains are not recurring earnings; FY2025 parent-growth bridge is narrowly qualified, not a general same-PDF rule.'}
TOPIC_CONTEXT={
 'returns':['GROUP_ROE_AVG','GROUP_ROA_AVG'],'persistence':['NET_INCOME_YOY','NET_INCOME'],
 'margins':['BANK_NET_INTEREST_INCOME','NII_ASSETS_CLOSING','OPERATING_REVENUE','NET_FVTPL_REPORTED'],
 'realization':['BANK_INTEREST_INCOME','LOAN_RECEIVABLE_INTEREST'],'one_offs':['FVTPL_UNREALIZED_GAINS','BANK_CREDIT_PROVISION_EXPENSE'],
 'recognition':['BANK_LOAN_LOSS_RESERVES','FVTPL_REALIZED_GAINS'],
 'concentration':['BANK_GROSS_CUSTOMER_LOANS','SECURITIES_MARGIN_LOANS'],
 'capital':['BANK_REPORTED_CAR','BANK_REPORTED_CET1','TOTAL_EQUITY'],
 'asset_quality':['BANK_CUSTOMER_LOAN_NPL_RATIO','BANK_CUSTOMER_LOAN_NPL_COVERAGE','BANK_LOAN_LOSS_RESERVES','FVTPL_ASSETS'],
 'funding':['BANK_CUSTOMER_DEPOSITS','LOAN_DEPOSIT','FINANCIAL_DEBT'],
 'leverage_context':['GROUP_EQUITY_ASSETS','FINANCIAL_DEBT_EQUITY','MARGIN_EQUITY'],
 'obligations':['BANK_ISSUED_FUNDING_INSTRUMENTS','FINANCIAL_DEBT'],
 'liquidity':['CASH_AND_EQUIVALENTS','CUSTOMER_CASH_OFF_BALANCE','LOAN_DEPOSIT'],
 'trend':['NET_INCOME_YOY','TOTAL_ASSETS_YOY','NET_INCOME_ATTRIBUTABLE_PARENT_YOY','SECURITIES_MARGIN_LOANS_YOY'],
 'denominator':['TOTAL_EQUITY'],'incremental_return':['GROUP_ROE_AVG'],
 'residual_risks':['LOAN_DEPOSIT','BANK_CUSTOMER_LOAN_NPL_RATIO','MARGIN_EQUITY'],
 'dependencies':['NET_INCOME_ATTRIBUTABLE_PARENT','BANK_REPORTED_CAR'],
 'reinvestment':['BANK_GROSS_CUSTOMER_LOANS','SECURITIES_MARGIN_LOANS'],
 'retention':['TOTAL_EQUITY'],'resilience':['BANK_REPORTED_CAR','TOTAL_EQUITY']}
NOTE_TERMS={
 'business':['hoạt động chính','hoạt động chủ yếu'], 'recognition':['lãi dự thu','lãi phải thu','ghi nhận thu nhập'],
 'liquidity':['rủi ro thanh khoản','thời hạn còn lại','kỳ hạn còn lại'],
 'governance':['bên liên quan','ý kiến kiểm toán'], 'actions':['tăng vốn','phát hành cổ phiếu','cổ tức bằng cổ phiếu'],
 'industry':['thị phần','đối thủ cạnh tranh']}

POLICIES=['docs/01 SYSTEM/INVESTMENT_POLICY.md','docs/01 SYSTEM/DECISION_FRAMEWORK_v1.0.md','docs/01 SYSTEM/RISK_POLICY_v1.0.md','docs/01 SYSTEM/SCORING_MODEL_v1.0.md','docs/03 SCORING/METRIC_DEFINITIONS.md','docs/03 SCORING/SECTOR_NORMALIZATION.md','docs/03 SCORING/RANKING_RULES_v1.0.md','docs/03 SCORING/SCORING_ENGINE.md','docs/03 SCORING/SCORECARD_TEMPLATE.md','docs/04_DECISION_ENGINE/DECISION_ENGINE.md','docs/04_DECISION_ENGINE/OPPORTUNITY_COST.md','docs/04_DECISION_ENGINE/POSITION_SIZING.md','docs/06_DASHBOARD/6.4 Scoring & Ranking/METHODOLOGY_CLARIFICATION.md','docs/06_DASHBOARD/6.5 Decision Engine/M653_SECTOR_POLICY.md','src/domain/scoring/methodology.ts','src/domain/scoring/scorecard.ts','src/domain/scoring/metrics.ts','src/domain/scoring/evidence.ts','src/domain/ranking/rank.ts','src/domain/decision/engine.ts','src/domain/decision/validation.ts','src/domain/decision/approved-methodology.ts']

def note_search(t,d):
 path=f'data/manual-extracted-pdf/notes/{t}.json';source=read(path)
 hashes={m.get('pdfEvidence',{}).get('sha256') for m in d['metrics'] if m.get('year')==2025 and m['status']=='SUPPORTED'}-{None}
 results=[]
 for theme,terms in NOTE_TERMS.items():
  for di,doc in enumerate(source['documents']):
   if doc['sourceHash'] not in hashes:continue
   for pi,page in enumerate(doc['pages']):
    hits=[term for term in terms if term in page['text'].lower()]
    if hits:
     results.append(dict(ticker=t,theme=theme,status='CANDIDATE_ONLY_NOT_QUALIFIED_TOPIC',binding=bind(path,f'/documents/{di}/pages/{pi}'),pdfHash=doc['sourceHash'],physicalPage=page['page'],pdfPaths=doc['pdfPaths'],terms=hits))
 return results

def readiness(required_topics,topic_states,critical_row,supported_count,full_evidence=False,assumptions=False,authority=False):
 if full_evidence and assumptions and authority and all(topic_states[t]=='QUALIFIED' for t in required_topics):return 'READY'
 if critical_row or supported_count==0:return 'BLOCKED'
 return 'PARTIALLY_READY'

def collect():
 dossiers={t:read(p) for t,p in DOSSIERS.items()};schema=specs();ledger={};rows=[];leads={};search_inventory=[]
 for t,d in dossiers.items():
  leads[t]=note_search(t,d)
  folder=next((ROOT/'docs/fundamental-data-engine/evidence').glob('*ticker-closure-'+t))
  for p in sorted(folder.iterdir()):
   if p.suffix in ('.json','.md','.csv'):
    rel=str(p.relative_to(ROOT));PINS[rel]=p1.sha(p);search_inventory.append(dict(ticker=t,path=rel,sha256=PINS[rel],scope='Existing issuer closure/search/gap/review inventory; not a new topic qualification'))
  for i,m in enumerate(d['metrics']):
   ledger[m['id']]=dict(id=m['id'],ticker=t,concept=m['concept'],year=m['year'],scope=m['scope'],kind=m['kind'],status=m['status'],value=m['value'],unit=m.get('unit'),currency=m.get('currency'),scale=m.get('scale'),periodStart=m.get('periodStart'),periodEnd=m.get('periodEnd'),periodType=m.get('periodType'),nativeSourceValue=m.get('nativeSourceValue',m.get('raw',{}).get('lexicalValue')),nativeSourceMultiplier=m.get('nativeSourceMultiplier',m.get('raw',{}).get('multiplier')),nativeSourceUnit=m.get('nativeSourceUnit',m.get('raw',{}).get('unit')),originalValue=m.get('originalValue'),canonicalRevision=m.get('canonicalRevision'),originalRevision=m.get('originalRevision'),revisionBasis=m.get('revisionBasis'),sourceBinding=bind(DOSSIERS[t],f'/metrics/{i}'),pdfEvidence=m.get('pdfEvidence'),observationBinding=m.get('observationBinding',m.get('binding')),noteBinding=m.get('noteBinding'),dependencyIds=m['dependencyIds'],publicationAt=m.get('publicationAt'),historicalAvailability='UNKNOWN_NO_HISTORICAL_AS_KNOWN_CLAIM')
  sector=SEC if t=='SSI' else BANK
  for ri,s in enumerate(schema):
   rid=s['id'];concepts=set(COMMON.get(rid,[])+sector.get(rid,[]));context=[m for m in d['metrics'] if m['concept'] in concepts]
   supported=[m['id'] for m in context if m['status']=='SUPPORTED'];states={topic:'PARTIAL_FINANCIAL_CONTEXT' if any(m['status']=='SUPPORTED' and m['concept'] in TOPIC_CONTEXT.get(topic,[]) for m in context) else 'NOT_QUALIFIED' for topic in s['topics']}
   row_status=readiness(s['topics'],states,rid in CRITICAL_ROWS,len(supported))
   old=next((r for r in d['rubrics'] if r['rubric']==rid))
   thematic=('liquidity' if rid.startswith('FH-') else 'actions' if rid.startswith('CA-') or rid.startswith('GQ-') else 'governance' if rid=='RG-GOV' else 'industry' if rid.startswith('IC-') or rid=='BQ-MOAT' else 'recognition')
   row=dict(ticker=t,rubric=rid,category=s['category'],requiredTopics=s['topics'],status=row_status,topicEvidence=[dict(topic=topic,status=states[topic],financialContextIds=[m['id'] for m in context if m['status']=='SUPPORTED' and m['concept'] in TOPIC_CONTEXT.get(topic,[])],fullTopicQualified=False) for topic in s['topics']],qualifiedReportedFacts=[m['id'] for m in context if m['status']=='SUPPORTED' and m['kind']=='REPORTED_FACT'],supportedMetrics=[m['id'] for m in context if m['status']=='SUPPORTED' and m['kind']=='DERIVED_METRIC'],missingMetrics=[m['id'] for m in context if m['status']=='MISSING'],unmappedRequiredConcepts=sorted(concepts-{m['concept'] for m in context}),conflicts=[m['id'] for m in context if m['status']=='CONFLICT'],referenceOnly=[m['id'] for m in context if m['status']=='REFERENCE_ONLY'],qualitativeEvidenceRequirements=DEPENDENCIES[rid],analystAssumptions=ASSUMPTIONS.get(rid,'No new economic assumption selected; topic-specific evidence and analyst judgment still require qualification.'),valuationDependencies=['VALUATION_CUTOFF','SOURCE_SHARE_ACTION_PRICE_POLICY','SUSTAINABLE_COMMON_EARNINGS','MODEL_ASSUMPTIONS'] if rid.startswith('VAL-') or rid in ('CA-DIST','CA-PSV') else [],historicalAvailabilityLimitations='Financial periods do not establish publication/availableAt dates. Source capture and later review are not original availability. This is retrospective FY2022–FY2025 context, not current-cutoff underwriting.',issuerSpecificContext=ISSUER_CONTEXT[t],exactBlockingDependencies=[DEPENDENCIES[rid],ISSUER_CONTEXT[t]],retainedEvidenceLeads=[x for x in leads[t] if x['theme']==thematic][:4],canScoreNow=False,partialNarrativePossible=bool(supported),points=None,band=None,assessment=None,categoryScore=None,priorRubricBinding=bind(DOSSIERS[t],f'/rubrics/{d["rubrics"].index(old)}'),priorDisposition=old['status'],blockingRegisterIds=blocker_ids(rid))
   rows.append(row)
 return dossiers,ledger,rows,leads,search_inventory

def blocker_ids(rid):
 ids=['U5']
 if rid in ('BQ-EQ','BQ-CASH','BQ-RES','FH-BS','FH-LIQ','GQ-HIST','GQ-INC','RG-RISK','CA-REINV','CA-DIL','CA-PSV'):ids+=['U1']
 if rid in ('BQ-MOAT','BQ-RES','IC-IND','IC-POS','IC-CYCLE','RG-GOV','CA-REINV','CA-DIST','CA-DIL'):ids+=['U2']
 if rid.startswith('VAL-') or rid in ('CA-DIST','CA-PSV'):ids+=['U3']
 if rid in ('BQ-EQ','FH-STRESS','GQ-FWD','GQ-INC','RG-UNC') or rid.startswith('VAL-'):ids+=['U4']
 return ids

BANK_SLOT_CONCEPTS=['TOTAL_ASSETS','TOTAL_EQUITY','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','BANK_NET_INTEREST_INCOME','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS','BANK_LOAN_LOSS_RESERVES']
SSI_SLOT_CONCEPTS=['TOTAL_ASSETS','TOTAL_EQUITY','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','OPERATING_REVENUE','SECURITIES_MARGIN_LOANS','FINANCIAL_DEBT','FVTPL_ASSETS']

def select(dossiers,rows):
 results=[]
 for t,d in dossiers.items():
  concepts=SSI_SLOT_CONCEPTS if t=='SSI' else BANK_SLOT_CONCEPTS
  diagnostics=['GROUP_ROE_AVG','MARGIN_EQUITY','REPORTED_CASH_FINANCIAL_DEBT','NET_FVTPL_REPORTED','CUSTOMER_CASH_OFF_BALANCE'] if t=='SSI' else ['BANK_REPORTED_CAR','BANK_CUSTOMER_LOAN_NPL_RATIO','BANK_CUSTOMER_LOAN_NPL_COVERAGE','GROUP_ROE_AVG','LOAN_DEPOSIT']
  slots=[(c,y) for c in concepts for y in range(2022,2026)]+[(c,2025) for c in diagnostics]
  details=[]
  for c,y in slots:
   found=[m for m in d['metrics'] if m['concept']==c and m['year']==y];m=found[0] if len(found)==1 else None
   details.append(dict(concept=c,year=y,status=m['status'] if m else 'UNMAPPED_OR_AMBIGUOUS',metricId=m['id'] if m else None))
  economics=['SUSTAINABLE_COMMON_EARNINGS','THROUGH_CYCLE_BROKERAGE_TRADING' if t=='SSI' else 'NORMALIZED_NIM_AVERAGE_EARNING_ASSETS','MARGIN_COLLATERAL_STRESS_LOSS' if t=='SSI' else 'NORMALIZED_CREDIT_COST','COMMON_OWNER_CAPITAL','ACTION_ADJUSTED_COMMON_SHARES','MATURITY_COVENANT_USABLE_FUNDS']
  for requirement in economics:details.append(dict(requirement=requirement,concept=None,year=None,status='NOT_QUALIFIED',metricId=None,notAFinancialObservation=True,methodologyBasis='Sector Normalization§5/§13.1; Metric Definitions§5–8; whole-topic financial/economic prerequisites. No new metric or scoring band.'))
  ready=sum(r['status']=='READY' for r in rows if r['ticker']==t);coverage=sum(s['status']=='SUPPORTED' for s in details);conflicts=sum(m['status']=='CONFLICT' for m in d['metrics'])
  # These financial observations are prerequisites, never a complete valuation input set.
  valuation_compatible=0
  available=[m for m in d['metrics'] if m['status']=='SUPPORTED' and m['kind']=='REPORTED_FACT']
  auditable=all(bool(m.get('pdfEvidence')) and bool(m.get('observationBinding') or m.get('binding') or m.get('reviewPayloadBinding')) for m in available)
  key=(-ready,-coverage,conflicts,-valuation_compatible,-int(auditable),t)
  results.append(dict(ticker=t,fullyQualifiedRubrics=ready,financialDependenciesSupported=coverage,financialDependenciesTotal=len(details),historicalContextSlots=37,unqualifiedEconomicRequirements=6,slots=details,materialConflictMetricCount=conflicts,completeCompatibleValuationSets=valuation_compatible,qualifiedPdfLineage=auditable,selectionKey=list(key),financialObjectStates=dict(Counter(m['status'] for m in d['metrics'])),rubricReadiness=dict(Counter(r['status'] for r in rows if r['ticker']==t))))
 ordered=sorted(results,key=lambda r:r['selectionKey'])
 return dict(selected=ordered[0]['ticker'],proofType='BLOCKED_FEASIBILITY_PROOF' if ordered[0]['fullyQualifiedRubrics']==0 else 'READINESS_PROOF',rule='Lexicographic: fully qualified whole rubrics DESC; supported fixed 43 sector-specific financial/economic dependencies DESC; all registered conflict metrics ASC; complete compatible valuation sets DESC; qualified PDF lineage DESC; ticker ASC only as final deterministic display tie-break. No price/performance/return or metric-total input.',isInvestmentRanking=False,comparison=results,diagnosticOrder=[r['ticker'] for r in ordered])


def market_inventory():
 path='data/vn30.sqlite';PINS[path]=p1.sha(ROOT/path)
 c=sqlite3.connect((ROOT/path).as_uri()+'?mode=ro&immutable=1',uri=True);c.execute('PRAGMA query_only=ON')
 records=[]
 for ident,body,h,received in c.execute("SELECT id,body,body_hash,received_at FROM broker_observation WHERE kind='TCBS_MARKET_PRICE'"):
  x=json.loads(body)
  if x.get('ticker') not in TICKERS:continue
  if hashlib.sha256(body.encode()).hexdigest()!=h:raise ValueError('DB_BODY_HASH')
  records.append(dict(ticker=x['ticker'],rowId=ident,bodyHash=h,tradingDate=x.get('tradingDate'),receivedAt=received,selectedAt=x.get('selectedAt'),unit=x.get('unit'),value=x.get('value'),adjustment=x.get('adjustment'),rawSourceSha256=x.get('rawSourceSha256'),sourceObservationId=x.get('sourceObservationId'),sourcePointer=x.get('sourcePointer'),qualifiedForValuation=False,status='RETAINED_DISPLAY_REFERENCE_ONLY'))
 latest={t:max([r for r in records if r['ticker']==t],key=lambda r:r['selectedAt'] or r['receivedAt'],default=None) for t in TICKERS}
 counts={t:c.execute('SELECT count(*) FROM '+t).fetchone()[0] for t in ['corporate_action_reference','scoring_dataset_binding']};c.close()
 account=read('data/account-current/personal-account.json');confirmed=read('docs/fundamental-data-engine/governance/PORTFOLIO_OWNER_CONFIRMATIONS_2026-10-31.json')
 active=read('data/market-boundary/active-candidate.json');candidate=read(active['path'])
 if p1.digest(candidate)!=active['sha256']:raise ValueError('ACTIVE_MARKET_CANDIDATE_HASH')
 policy='docs/fundamental-data-engine/evidence/2026-10-29-owner-price-selection/REPORT.md';PINS[policy]=p1.sha(ROOT/policy)
 return dict(database=dict(path=path,sha256=PINS[path],uriMode='ro&immutable=1',queryOnly=True,queries=["SELECT id,body,body_hash,received_at FROM broker_observation WHERE kind='TCBS_MARKET_PRICE'",'SELECT count(*) FROM corporate_action_reference','SELECT count(*) FROM scoring_dataset_binding'],counts=counts),latestRetainedDisplayPrices=latest,marketAcceptance=dict(pointer=active,readyForScoring=candidate.get('readyForScoring'),decisionReady=candidate.get('decisionReady'),independentAcceptance=candidate.get('independentAcceptance')),portfolio=dict(personalSnapshotDate=account['asOfDate'],personalSnapshotBinding=bind('data/account-current/personal-account.json'),ownerConfirmationsBinding=bind('docs/fundamental-data-engine/governance/PORTFOLIO_OWNER_CONFIRMATIONS_2026-10-31.json'),knownFactsNotReopened=True,executableCashAtNewCutoff=None,currentFees=None,formalPortfolioIntegrityAtValuationCutoff=None),valuationCutoff=None)


def blockers(rows,leads):
 table=[
 ('U1','A',1,'Qualified financial context is not complete economic underwriting','Bank/securities analyst + data reviewer','MEDIUM: bounded retained-note mapping/reconciliation; historical bridges may be HIGH','Full common-owner/capital, normalized credit/trading costs, interest realization, maturity/covenant/usable-funds, action-adjusted growth and allocation-outcome schedules. Do not repeat source identity discovery.','Only affected BQ/FH/GQ/RG/CA topics; together required for a complete score','YES for retained pages; genuinely missing disclosures must be identified after mapping.'),
 ('U2','C',2,'Qualitative topics have not been qualified','Research analyst + independent challenger','MEDIUM/HIGH: issuer/topic review, not more generic extraction','Qualify issuer-specific moat/resilience, industry competition/share/cycle, governance/minority protections and management allocation outcomes. Notes are candidate leads, not automatic topic acceptance.','Affected BQ/IC/RG/CA topics; complete score blocked','PARTLY: related-party/business/action notes exist; industry/share evidence not qualified in searched scope.'),
 ('U3','E',3,'No explicit valuation cutoff and compatible source/share/action policy','Owner / CIO','SMALL owner decision sheet; separate mapping effort','Choose valuation date/time/timezone and retrospective/as-known basis; price/share/action source eligibility and adjustment policy; then qualify a compatible issuer share count/action bridge. Universe date is not valuation approval.','VAL and valuation-dependent CA topics; intrinsic value and M4','YES for decisions; sufficiency of retained compatible data depends on the chosen cutoff.'),
 ('U4','D',4,'Sustainable earnings, scenarios and valuation assumptions unapproved','Analyst prepares; CIO/Risk or owner approves under applicable mandate','MEDIUM/HIGH: evidence-bounded scenarios + challenge','Supply sustainable common earnings and common/tangible capital, cost of equity/discount basis, credit/trading/margin normalization, growth/payout/tax, downside/funding response and terminal/crosscheck assumptions. Policy return hurdle is not a selected discount rate.','BQ-EQ, FH-STRESS, GQ-FWD/GQ-INC, RG-UNC and VAL; no total/valuation','YES for assumption preparation with retained evidence; no values approved by this proof.'),
 ('U5','G',5,'Research-to-formal admission and dated decision/portfolio contract incomplete','Owner / data acceptance / portfolio engineer / Risk','HIGH: independent acceptance and compatible dated bindings; not re-confirmation of settled owner facts','Preserve accepted static authorities. Separately qualify historical availability, human assessments and exact data/admission bindings; compatible portfolio integrity/NAV/cash/fees/exposure, lot/execution, market/technical and opportunity-cost inputs. Known TCB150=100+50 and cash/dividend/fee facts remain settled and dated.','All formal scoring/admission and M4; does not prevent historical narrative','PARTLY: dated personal and display observations already exist; formal/cutoff reconciliation remains.'),
 ('U6','B',6,'Conditional dated-evidence absence after retained market horizon','Market-data reviewer; owner for cutoff/source scope','CONDITIONAL: none if an admissible retained cutoff suffices; otherwise new authority is required','If owner requires 2026-11-05/current underwriting, the inspected retained display-price set ends 2026-10-30. No compatible later price is present in that set; existing quote cannot be relabelled current. No acquisition authorized. Unknown publication dates cannot be reconstructed by assumption.','Conditional valuation/M4/history gate, not every retrospective financial topic','NO for a later absent quote; YES to choose a defensible retained retrospective scope with explicit approval.')]
 out=[]
 for ident,kind,priority,title,owner,effort,required,scope,external in table:
  affected=[r for r in rows if ident in r['blockingRegisterIds']]
  out.append(dict(id=ident,classification=kind,priority=priority,title=title,affectedIssuers=list(TICKERS),affectedRubrics=sorted({r['rubric'] for r in affected}) if ident!='U6' else ['VAL-PRIMARY','VAL-RET','VAL-MOS'],requiredEvidenceOrDecision=required,responsibleRole=owner,estimatedEffortCategory=effort,blockingScope=scope,canResolveWithoutExternalAcquisition=external,closureResult='NOT_IMPLEMENTED; owner review only',acceptanceTest='Every named mandatory topic and operand has exact compatible evidence/approval; independent challenge passes; no missing-as-zero or revised predecessor observations.',stopCondition='No source/evidence/methodology/authority mutation or acquisition under P2.5.',repeatsSourceDiscovery=False,retainedLeadCount=sum(len(v) for v in leads.values()) if ident in ('U1','U2') else None))
 return dict(items=out,methodologyExecutableDefect=dict(classification='F',status='NO_NEW_BLOCKING_DEFECT_ESTABLISHED',basis='Static completeness/human assessment, sector normalization and fail-closed M4 contracts inspected. No formal scoring/decision or whole-release testing executed. Legacy same-PDF cohort proof is not expanded into new calculations; no method changes proposed.'),minimumUnblockPlan=['Owner selects one bounded valuation/as-known/source policy package (U3), without reconfirming settled personal facts.','Map/challenge TCB retained economic schedules and issuer action/common-capital bridges (U1).','Qualify every required nonfinancial topic; isolate genuinely absent industry/share evidence before proposing a finite source-authority request (U2).','Prepare and obtain actual approvals for bounded economic scenarios and model inputs (U4).','Only after evidence completeness: independent dated admission/portfolio/market/lot/opportunity-cost acceptance and separate formal workflow authorization (U5; U6 only if cutoff requires absent data).'],sufficientSetCaveat='These are necessary cross-cutting dependency packages, not a promise that five approvals alone make 23 rubrics ready. All individual required topics in the matrix must pass. No unblock step executed.')

def valuation(t,d,market):
 common='Reported parent NPAT is a qualified historical fact for TCB, but not a sustainable common-owner numerator; NCI/fund/preference/action treatment still needs qualification.'
 definitions=[
 ('COMMON_OWNER_EARNINGS','MISSING',common,'U1'),
 ('SUSTAINABLE_EARNINGS','MISSING','Through-cycle NIM/credit cost, fee quality and common-owner normalization not qualified. Group ROE is not sustainable ROE.','U1'),
 ('COMPATIBLE_SHARE_COUNT','MISSING','No qualified effective-date issued/treasury/diluted/common-share bridge admitted for the selected valuation cutoff; holdings quantity is not issuer share count.','U1'),
 ('CORPORATE_ACTION_ADJUSTMENTS','MISSING','Historical actions/issuance terms and denominator changes not mapped to a compatible per-share cohort. Empty formal corporate_action_reference is recorded, not proof that the issuer had no actions.','U1'),
 ('VALUATION_CUTOFF','REQUIRES_APPROVAL','Date/time/timezone and retrospective/as-known treatment are null. Approved VN30 reference date2026-11-05 does not choose a valuation cutoff.','U3'),
 ('QUALIFIED_PRICE_EVIDENCE','REQUIRES_APPROVAL','Dated display-price observations exist; select approved research-valuation source/cutoff/adjustment/staleness treatment and qualify compatible evidence. No current quote or intrinsic-value input selected.','U3'),
 ('DISCOUNT_REQUIRED_RETURN_ASSUMPTIONS','REQUIRES_APPROVAL','Risk Policy normal15% forward 5Y hurdle and exceptional12% floor already exist; neither selects TCB cost of equity/discount rate. No new hurdle/method approval is requested.','U4'),
 ('SCENARIO_ASSUMPTIONS','REQUIRES_APPROVAL','Evidence-bounded growth, credit loss, funding/NIM, payout/tax and capital scenarios unapproved.','U4'),
 ('TERMINAL_ASSUMPTIONS','REQUIRES_APPROVAL','Terminal growth/ROE/capital/payout or multiple consistency not approved; no arbitrary terminal value.','U4'),
 ('MARGIN_OF_SAFETY_METHODOLOGY','AVAILABLE','Existing M3 Metric Definitions§8.3 and§12.17 and M1 Investment Policy§11.3 define conservative value/price and uncertainty/downside principles; inputs and any case-specific requirements remain absent.','U3'),
 ('SECTOR_PRIMARY_AND_CROSSCHECK_POLICY','AVAILABLE','Sector Normalization§5.4: P/B versus sustainable ROE/cost of equity and residual income/justified P/B; economically independent crosscheck required, not an average of correlated variants.','U3')]
 return dict(ticker=t,status='BLOCKED',intrinsicValue=None,marginOfSafety=None,selectedPrice=None,selectedShares=None,approvedEconomicInputs=None,dependencies=[dict(dependency=k,status=s,reason=r,blockerId=b) for k,s,r,b in definitions],retainedDisplayReference=market['latestRetainedDisplayPrices'][t],scoringOrValuationExecuted=False)

def decision(t,market):
 items=[
 ('investment_thesis','NOT_QUALIFIED','Full quality/industry/downside/invalidation and fresh underwriting absent.'),
 ('financial_health','PARTIAL','CAR, loans, allowance/NPL and funding context available; no full liquidity/stress/veto qualification.'),
 ('valuation','BLOCKED','No qualified intrinsic range, expected return, independent crosscheck or case assumptions.'),
 ('data_confidence','NOT_QUALIFIED','Formal five-dimension confidence, dates and critical-evidence assessment absent; engineering PASS does not grant HIGH confidence.'),
 ('portfolio_ownership','DATED_FACTS_AVAILABLE','TCB150 owned=100 available+50 stockDividend pending is confirmed from retained29Oct observation in31Oct record. Do not ask again or treat150 as tradable; not a current valuation-cutoff portfolio contract.'),
 ('cash_availability','DATED_FACTS_AVAILABLE','Cash327420, pending475000, accrued fee420 and linked-bank availability12152752 are known dated28Oct categories. Buying power is not standalone owned cash; pending is not spendable. Later cash/fee state and acceptance at an approved cutoff are not established.'),
 ('position_sizing','BLOCKED','Compatible NAV, prices/exposures, economic target, transaction fees and fresh Risk approvals absent.'),
 ('sector_concentration','BLOCKED','No cutoff-compatible reconciled sector/hidden-factor exposure. M6.5.3 capacity fails closed above ordinary30% sector no-add; generic exception strings do not authorize additions.'),
 ('lot_size','POLICY_AVAILABLE_EXECUTION_BLOCKED','Existing planning lot100 is an operational parameter, not a new exchange-rule verification; compatible price, cash/fees and lot affordability are not approved.'),
 ('opportunity_cost','BLOCKED','No actionably scored comparators and aligned forward return, confidence, friction and marginal-capacity evidence; cash remains a comparator, not an assumed forecast return.'),
 ('risk_policy_vetoes','NOT_ASSESSED','No affirmative CLEAR finding; absent veto evidence cannot be treated as absence of a veto. Existing static authority remains accepted.'),
 ('market_money_flow','UNQUALIFIED','Dated retained price/history candidate exists but full flow/market assessment and compatible cutoff are unqualified; flow cannot create a thesis.'),
 ('technical_entry','UNQUALIFIED','No qualified cutoff-aligned liquidity/volatility/spread or entry/tranche conditions. Chart appearance cannot bypass fundamental or risk gates.')]
 return dict(ticker=t,status='DECISION_NOT_AUTHORIZED',investmentDecision=None,scorerExecuted=False,decisionEngineExecuted=False,inputs=[dict(input=k,state=s,reason=r) for k,s,r in items],portfolioEvidence=market['portfolio'],methodology='Accepted M6.5.3 identity; static authority is available but this research dossier is not an admitted M4 input.')

def analysis_claims(t,d,ledger,leads,market):
 assert t=='TCB','Candidate-specific proof must be rewritten if the deterministic winner changes.'
 def mid(c,y=2025):return next(m['id'] for m in d['metrics'] if m['concept']==c and m['year']==y)
 claims=[]
 def add(section,kind,text,concepts=(),policy=(),extra=None):
  ids=[mid(c) for c in concepts];claims.append(dict(id=f'P{len(claims)+1:02}',section=section,classification=kind,text=text,metricIds=ids,evidenceBindings=[ledger[i]['sourceBinding'] for i in ids],policyReferences=list(policy),extraEvidence=extra))
 add('Business model','FACT','The retained consolidated statement presents customer lending and deposit funding, net interest income, interbank/funding instruments and explicit parent earnings. This supports a balance-sheet intermediation description; it does not establish a moat or a complete segment earnings mix.',['BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS','BANK_NET_INTEREST_INCOME','BANK_INTERBANK_FUNDING_REPORTED','BANK_ISSUED_FUNDING_INSTRUMENTS'])
 add('Business model','UNQUALIFIED','Customer mix, distribution economics, fee/TCBS contribution and competitive advantage are not qualified by this proof. Retained business/related-party pages are leads requiring review.',extra=[x for x in leads[t] if x['theme']=='business'][:3])
 add('Business quality','FACT','FY2025 group NPAT25,954,472,000,000 VND differs from parent NPAT25,290,230,000,000 VND. Group average-equity ROE0.158529121315 is a historical group return, not normalized common-owner or tangible return.',['NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','GROUP_ROE_AVG'])
 add('Business quality','UNQUALIFIED','Sustainable NIM, CASA, fee quality, normalized credit cost, common capital and cost of equity remain unqualified. No quality class, moat or M3 band follows from the reported ROE.',policy=['docs/03 SCORING/SECTOR_NORMALIZATION.md#5.1'])
 add('Financial health','FACT','FY2025 consolidated assets1,192,344,137,000,000 VND and equity179,501,442,000,000 VND are accounting balances. Reported CAR0.1461 has REGULATORY_CONSOLIDATED scope and its own regulatory framework, distinct from book equity/assets.',['TOTAL_ASSETS','TOTAL_EQUITY','BANK_REPORTED_CAR','GROUP_EQUITY_ASSETS'])
 add('Financial health','FACT','Customer-loan NPL ratio0.010680291893 and customer reserve/NPL coverage1.278987604251 are reported-population diagnostics. Customer allowance10,485,620,000,000 VND excludes the margin-loan component in total-contra magnitude10,498,378,000,000 VND (reported signed contra is -10,498,378,000,000 VND); do not swap denominators/populations.',['BANK_CUSTOMER_LOAN_NPL_RATIO','BANK_CUSTOMER_LOAN_NPL_COVERAGE','BANK_LOAN_LOSS_RESERVES','BANK_TOTAL_LOAN_CONTRA_REPORTED'])
 add('Financial health','ESTIMATE','The balance sheet warrants focused funding/credit downside review: simple customer loans/deposits1.240269546762 is a funding-mix indicator, not regulatory LDR and not proof of distress. Issued instruments and interbank funding also matter. No liquidity or survivability classification is asserted.',['LOAN_DEPOSIT','BANK_INTERBANK_FUNDING_REPORTED','BANK_ISSUED_FUNDING_INSTRUMENTS'])
 add('Historical growth','FACT','FY2025 reported group NPAT growth0.192754961098, NII growth0.074550263556, customer-loan growth0.215112861995 and deposit growth0.160330730278 are existing compatible historical diagnostics. They are not forward forecasts or corporate-action-adjusted per-share growth.',['NET_INCOME_YOY','BANK_NET_INTEREST_INCOME_YOY','BANK_GROSS_CUSTOMER_LOANS_YOY','BANK_CUSTOMER_DEPOSITS_YOY'])
 add('Historical growth','ESTIMATE','Loan growth exceeding deposit growth motivates investigation of wholesale funding, asset mix and capital use; it does not prove a deposit franchise deterioration or sustainable incremental return.',['BANK_GROSS_CUSTOMER_LOANS_YOY','BANK_CUSTOMER_DEPOSITS_YOY','BANK_INTERBANK_FUNDING_REPORTED'])
 add('Industry and competitive position','UNQUALIFIED','No dated qualified market-share, competitor economics, industry barriers or cycle cohort supports a leadership or industry-attractiveness conclusion. Large assets and strong historical profit cannot substitute.',policy=['docs/03 SCORING/SECTOR_NORMALIZATION.md#5','src/domain/scoring/methodology.ts#IC-IND/IC-POS/IC-CYCLE'])
 add('Valuation prerequisites','FACT','Approved bank sector policy favors P/B relative to sustainable ROE/cost of equity and residual income/justified P/B, with meaningful crosschecks. A defined method is available; a qualified model input set is not.',policy=['docs/03 SCORING/SECTOR_NORMALIZATION.md#5.4','docs/01 SYSTEM/INVESTMENT_POLICY.md#11'])
 add('Valuation prerequisites','ASSUMPTION','No new economic assumption is adopted. Valuation cutoff, normalized common earnings/capital, compatible issuer shares/actions and discount/scenario/terminal parameters remain null pending qualification/approval.',policy=['docs/fundamental-data-engine/dfr-04/closure-37e12f2/DFR_04_VALUATION_DECISION_SHEET.md'])
 add('Material risks','ESTIMATE','Reported lending, allowance, funding instruments and parent/group difference identify credit, funding, recognition and minority/corporate-action channels to investigate. These are exposure-based research questions, not findings of governance misconduct, insolvency or a policy veto.',['BANK_GROSS_CUSTOMER_LOANS','BANK_LOAN_LOSS_RESERVES','BANK_INTERBANK_FUNDING_REPORTED','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT'])
 add('Material risks','UNQUALIFIED','Stress loss/rollover, collateral realization, concentration/covenants, related-party terms and residual-risk mitigation are not fully qualified. Hard-veto status remains unassessed, not CLEAR.',policy=['docs/01 SYSTEM/RISK_POLICY_v1.0.md#11'])
 add('Market and money-flow prerequisites','FACT','The immutable read-only DB inspection found retained TCB display-price data dated2026-10-30, with original row/body hash, VND_PER_SHARE unit, source pointer and provider-declared adjustment status retained. No price is selected as a valuation input or represented as current.',extra=market['latestRetainedDisplayPrices'][t])
 add('Market and money-flow prerequisites','UNQUALIFIED','Market candidate readyForScoring=false, decisionReady=false and independentAcceptance=PENDING_INDEPENDENT_REVIEW. Display approval does not admit a valuation or money-flow assessment.',extra=market['marketAcceptance'])
 add('Technical-entry prerequisites','UNQUALIFIED','No cutoff-specific qualified liquidity, execution spread/volatility, tranche plan or temporary deferral conditions are supplied. Technicals remain an execution overlay and cannot repair absent fundamental evidence.',policy=['docs/01 SYSTEM/INVESTMENT_POLICY.md#12','docs/04_DECISION_ENGINE/DECISION_ENGINE.md#18'])
 add('Existing-portfolio prerequisites','FACT','TCB ownership150=100 available+50 pending stockDividend is already confirmed from retained29Oct observations in the31Oct owner record. Known28Oct cash/dividend/custody categories stay resolved and dated. They are not an issuer share count or a new cutoff NAV/cash contract.',extra=market['portfolio'])
 add('Existing-portfolio prerequisites','UNQUALIFIED','A compatible dated portfolio integrity/NAV/cost/cash/fees/exposure binding is still required for M4; this is a reconciliation/admission dependency, not a request to reconfirm already-settled owner facts.',policy=['docs/04_DECISION_ENGINE/DECISION_ENGINE.md#3.2'])
 add('Opportunity cost','UNQUALIFIED','No compatible actionable comparator scorecards, expected-return confidence, marginal capacity and after-friction comparison are qualified. The diagnostic candidate order is not an investment ranking; no allocation superiority versus cash is concluded.',policy=['docs/03 SCORING/RANKING_RULES_v1.0.md#4','docs/04_DECISION_ENGINE/OPPORTUNITY_COST.md'])
 add('Final decision prerequisites','FACT','The executable completeness contract requires23 human assessments with all mandatory topics, action comparability, usable dated evidence, gate/confidence/thesis checks and complete category scores before a total can exist. Accepted static authority does not accept this dataset.',policy=['src/domain/scoring/scorecard.ts#calculateScorecard','src/domain/decision/engine.ts','src/infrastructure/dependencies/active-authorities.json'])
 add('Final decision prerequisites','UNQUALIFIED','DECISION_NOT_AUTHORIZED. No score, intrinsic value, margin of safety, return estimate, rank, allocation state or trade is produced. This proof cannot certify complete end-to-end underwriting.',policy=['docs/04_DECISION_ENGINE/DECISION_ENGINE.md#6'])
 return claims


def methodology_ledger():
 records=[]
 for path in POLICIES:
  text=(ROOT/path).read_text();PINS[path]=p1.sha(ROOT/path)
  anchors=[dict(line=i+1,text=l) for i,l in enumerate(text.splitlines()) if l.startswith('#') or any(key in l for key in ('list(input.assessments,23)','AI may not','totalScore=','NO_NEW','SCORING_EVIDENCE_INCOMPLETE','DECISION_NOT_AUTHORIZED','REQUIRED_RETURN_'))]
  records.append(dict(path=path,sha256=PINS[path],inspection='Read governing contract and relevant sector/completeness/risk/ranking/decision clauses; static inspection only.',anchors=anchors))
 active=read('src/infrastructure/dependencies/active-authorities.json')
 for p in active['bindings']:
  if p1.sha(ROOT/p['path'])!=p['sha256']:raise ValueError('ACTIVE_AUTHORITY_PIN')
  read(p['path'])
 bundle=read(active['authorityBundle']['path'])
 if PINS[active['authorityBundle']['path']]!=active['authorityBundle']['sha256']:raise ValueError('AUTHORITY_BUNDLE_PIN')
 for path in ['docs/fundamental-data-engine/dfr-05/readiness-4e718504/DFR_04_OWNER_DECISION_RECORD.md','docs/fundamental-data-engine/dfr-04/closure-37e12f2/DFR_04_VALUATION_DECISION_SHEET.md']:
  PINS[path]=p1.sha(ROOT/path)
 return dict(documents=records,activeStaticAuthority=active,status='EXISTING_APPROVED_STATIC_AUTHORITY_PRESERVED',newAssessmentValuationDecisionAuthority=False)


def build():
 if subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()!=BASELINE:raise ValueError('APPROVED_BASELINE_HEAD_REQUIRED_FOR_PROOF_PREPARATION')
 dossiers,ledger,rows,leads,inventory=collect();selection=select(dossiers,rows);market=market_inventory();method=methodology_ledger();candidate=selection['selected'];v=valuation(candidate,dossiers[candidate],market);dec=decision(candidate,market);claims=analysis_claims(candidate,dossiers[candidate],ledger,leads,market);reg=blockers(rows,leads)
 matrix=dict(contract='dfr05-p25-analysis-readiness-v1',baselineCommit=BASELINE,reportDate='2026-11-08',analysisType='READ_ONLY_RETROSPECTIVE_FEASIBILITY',financialPeriod='FY2022–FY2025',classification='RESEARCH_PROVISIONAL',productionAdmissible=False,scoringAuthorized=False,counts={state:sum(r['status']==state for r in rows) for state in ('READY','PARTIALLY_READY','BLOCKED')},countUnit='138 whole issuer-rubric instances; constituent evidence topics separately itemized, never counted as complete rubrics',rows=rows,totalScore=None,categoryScores=None)
 outputs={'readiness-matrix.json':matrix,'metric-evidence.json':ledger,'candidate-selection.json':selection,'retained-evidence-leads.json':leads,'source-search-inventory.json':inventory,'market-portfolio-inventory.json':market,'methodology-inspection.json':method,'blocker-register.json':reg,'valuation-feasibility.json':v,'decision-feasibility.json':dec,'analysis-claims.json':claims}
 for name,x in outputs.items():write(name,x)
 make_reports(matrix,ledger,selection,leads,v,dec,claims,reg,market)
 write('input-pins.json',PINS)
 coreHash=p1.digest(outputs);write('proof-content-hash.json',dict(canonicalContentHash=coreHash,algorithm='SHA256 canonical UTF8 sorted JSON',scope='Machine proof payloads listed in proof.py; excluding command receipts and this hash'))
 print(json.dumps(dict(status='GENERATED',selected=candidate,counts=matrix['counts'],canonicalContentHash=coreHash)))
 return outputs


def make_reports(matrix,ledger,selection,leads,v,dec,claims,reg,market):
 t=selection['selected'];rows=matrix['rows'];comparisons=selection['comparison'];count=matrix['counts']
 intro=f'''Approved baseline `{BASELINE}`; P2.5 authorization: read-only feasibility for ACB, CTG, MBB, TCB, VCB, SSI. Report date **2026-11-08**, Asia/Ho_Chi_Minh. Financial context FY2022–FY2025; no valuation cutoff chosen. Owner approval of P2.4 engineering is recorded by this request; it does not approve valuation assumptions or production data. Prior evidence and dispositions remain unchanged. New files are confined to this versioned P2.5 folder.\n'''
 comparison='| Issuer | Supported / missing / conflict metrics | Ready | Partial | Blocked | Fixed financial dependencies |\n|---|---|---:|---:|---:|---:|\n'
 for c in comparisons:
  states=c['financialObjectStates'];r=c['rubricReadiness'];comparison+=f"| {c['ticker']} | {states.get('SUPPORTED',0)} / {states.get('MISSING',0)} / {states.get('CONFLICT',0)} | {r.get('READY',0)} | {r.get('PARTIALLY_READY',0)} | {r.get('BLOCKED',0)} | {c['financialDependenciesSupported']}/{c['financialDependenciesTotal']} |\n"
 detail=''
 for issuer in TICKERS:
  detail+=f'\n## {issuer}\n\n{ISSUER_CONTEXT[issuer]}\n\n'
  detail+='| Rubric | Readiness | Qualified reported / derived context | Missing / conflict metric IDs | Exact remaining dependency |\n|---|---|---|---|---|\n'
  for row in rows:
   if row['ticker']!=issuer:continue
   metrics=[ledger[i] for i in row['qualifiedReportedFacts']+row['supportedMetrics']]
   context='; '.join(f"{m['concept']} FY{m['year']}={m['value']} [{m['scope']}]" for m in metrics) or 'None qualified for this rubric'
   blocked='; '.join(row['missingMetrics']+row['conflicts']) or 'Full-topic mapping/qualitative/assumption gap; no metric-local numerical conflict'
   detail+=f"| {row['rubric']} | {row['status']} | {context} | {blocked} | {row['qualitativeEvidenceRequirements']} |\n"
 markdown('B1_READINESS_MATRIX',f'''# B1 whole-rubric readiness matrix
{intro}
{comparison}
**{count.get('READY',0)} READY / {count.get('PARTIALLY_READY',0)} PARTIALLY_READY / {count.get('BLOCKED',0)} BLOCKED**, across exactly138 instances. These are new feasibility classifications, not replacements for approved NOT_RATED dispositions. Financial object counts are not scores.

Classification rule: READY requires every mandatory topic, compatible evidence, necessary approved assumptions and methodological/authority conditions. Critical absent moat, stress/forecast, industry, governance/uncertainty, valuation and per-share/distribution evidence makes its rubric BLOCKED even where a historical financial paragraph is possible. The other nine rows are PARTIALLY_READY only if supported sector-appropriate financial context exists; no financial metric proves full-topic acceptance. Thus identical9/14 counts reflect common mandatory-topic gaps, not identical issuer economics or identical financial coverage.

`readiness-matrix.json` contains every mandatory subtopic and its state, exact supported reported facts/derived IDs, missing and conflict IDs, qualitative requirements, analyst assumptions, valuation dependencies, historical limitations, issuer-specific blockers and prior-rubric pointer/hash. `metric-evidence.json` maps each ID to its immutable dossier pointer/object hash, value, units, scope, period, revision, PDF/page and operand lineage. `retained-evidence-leads.json` provides125 candidate page/topic matches; counts are search leads, not new qualified evidence. Their exact count is reproducible in JSON.

{detail}

All rows inherit UNKNOWN original publication/availableAt where not qualified. Capture/review time is not publication time; no historical AS_KNOWN scoring or current financial freshness is claimed. Retained interim2026 evidence is outside the approved annual dossiers and would need a separate compatible freshness review after a cutoff decision. No missing item is set to zero; no weight redistributed.
'''.replace('provides125 candidate',f'provides{sum(len(x) for x in leads.values())} candidate'))
 why={'ACB':'31/43: historical parent profit and qualified current NPL-ratio/coverage dependencies absent in its sealed dossier; reported CAR/CET1 does not complete topics.','CTG':'37/43 dependency slots (all37 historical context slots), but8 registered dependent conflicts; no preference based on the size of its profit or bank assets.','MBB':'35/43: FY2022 and FY2023 parent NPAT not mapped; fewer complete historical common-parent contexts than TCB.','VCB':'37/43 dependency slots (all37 historical context slots), but10 cross-vintage dependent conflicts; recent NPL coverage does not remove them.','SSI':'29/43 under its securities-specific contract; historic revenue/FVTPL and early parent-profit slots incomplete. Client cash is not corporate cash; bank metrics are not required of SSI.'}
 markdown('CANDIDATE_SELECTION',f'''# Deterministic diagnostic candidate
{intro}
Selected **{t}**. Exercise classification: **{selection['proofType']}** because no issuer has a fully qualified whole M3 rubric. This is a coverage/auditability choice, not an investment recommendation, quality score or investable ranking.

Rule fixed before comparing values: {selection['rule']}

Each issuer has43 financial/economic dependencies:37 historical-context slots (8 named sector-appropriate concepts for each ofFY2022–FY2025, plus5FY2025 diagnostics), plus6 mandatory economic-normalization requirements. The latter are sustainable common earnings; normalized NIM/average earning assets or through-cycle brokerage/trading; normalized credit cost or margin-collateral stress loss; common-owner capital; action-adjusted common shares; and maturity/covenant/usable funds. All six remain NOT_QUALIFIED for each issuer; no new financial observations are created. These requirements trace the approved sector/metric definitions rather than new scoring thresholds. BANK concepts: {', '.join(BANK_SLOT_CONCEPTS)}. SSI concepts: {', '.join(SSI_SLOT_CONCEPTS)}. Five bank diagnostics: CAR, NPL ratio, reserve/NPL coverage, group ROE-average, customer loan/deposit. Five SSI diagnostics: group ROE-average, margin/equity, reported cash/financial debt, paired reported FVTPL net, off-balance client cash. These are audit prerequisites for comparison, not an M3 completeness list or changed scoring weight. Client cash's presence earns no liquidity or valuation conclusion.

{comparison}
TCB, CTG and VCB cover37/43 (the37 historical context slots, with6 economic requirements unqualified); TCB has no registered conflict metrics, whereas CTG has8 and VCB10. TCB therefore wins at priority3. Complete compatible valuation sets are0 for all six. Qualified PDF lineage is retained for reported facts; its existence does not independently qualify qualitative topics. No final ticker tie-break is needed for this winner.

'''+'\n'.join(f'- **{x}:** {why[x]}' for x in TICKERS if x!=t)+'''\n\nExact slot IDs and comparison keys are in `candidate-selection.json`. Registered conflict counts preserve baseline statuses; no historical financial observation, revision bridge or score is repaired by this proof.
''')
 proof=''
 for section in dict.fromkeys(c['section'] for c in claims):
  proof+='\n## '+section+'\n\n'
  for c in claims:
   if c['section']!=section:continue
   proof+=f"**{c['id']} — {c['classification']}.** {c['text']}\n\n"
   if c['metricIds']:
    proof+='Evidence: '+ '; '.join(link(ledger[i]['sourceBinding']['path'],i)+' `'+ledger[i]['sourceBinding']['jsonPointer']+'`' for i in c['metricIds'])+'. Exact object/hash/PDF-page and recursive operand lineage: `metric-evidence.json`.\n\n'
   if c['policyReferences']:proof+='Policy/contract: '+ '; '.join('`'+p+'`' for p in c['policyReferences'])+'.\n\n'
   if c['extraEvidence'] is not None:proof+='Exact retained contextual bindings: `analysis-claims.json#'+c['id']+'` (array entry identified by id; exact evidence pointers/hashes/source dates retained). Candidate keyword pages remain UNQUALIFIED until reviewed.\n\n'
 markdown('ANALYSIS_PROOF',f'''# TCB actual historical analysis proof
{intro}
Meaningful audited-financial narrative is feasible; complete end-to-end investment underwriting remains **BLOCKED**. FACT means an exact retained reported/derived observation or approved contract, not a new current estimate. ESTIMATE labels a conditional analytical inference with explicit limitations; no numerical forecast is invented. ASSUMPTION records an unselected assumption requirement, not an adopted value. UNQUALIFIED means no investment conclusion may be inferred.

{proof}
No original PDF was reopened: existing reviewed financial values and extracted full-page notes are reused. No new image review, qualitative qualification, intrinsic value, human score or confidence grade is claimed. The proof uses the final approved P2.3 values, not a reconstructed replacement dataset.
''')
 scoretable='| Rubric | Can score now? | Financial narrative? | Exact qualification / blocking evidence |\n|---|---|---|---|\n'
 for r in rows:
  if r['ticker']==t:scoretable+=f"| {r['rubric']} | NO; points=null, band=null | {'YES — partial only' if r['partialNarrativePossible'] else 'No qualified rubric-specific evidence'} | {r['qualitativeEvidenceRequirements']} Qualified context IDs: {', '.join(r['qualifiedReportedFacts']+r['supportedMetrics']) or 'none'}. |\n"
 markdown('SCORECARD_FEASIBILITY',f'''# TCB approved M3 scorecard feasibility
{intro}
**0/23 rubrics scoreable now. Complete approved M3 total: NOT FEASIBLE.** Complete qualified facts/metrics do not equal a human assessment of all mandatory topics. Partial narrative can be written even for some BLOCKED rubrics; it is not topic acceptance.

Approved source hierarchy: M1 Scoring Model100-point categories25/15/15/10/20/10/5; M3 sector normalization and metric definitions; current executable `m64-clarification-1` and accepted29Oct static authority. The M6.4 clarification's old proposal header is historical; current accepted authority is inspected separately. No method is declared unapproved merely because an old document header predates acceptance.

`src/domain/scoring/scorecard.ts` requires23 unique HUMAN assessments; every named topic requires usable evidence and rationale; explicit band/selectedPoints and stronger/max prerequisites apply; action comparability and expected-return evidence are separate. Incomplete category scores and total remain null; no midpoint, missing-as-zero, normalized partial total or weight redistribution. A count of financial metrics cannot satisfy this contract. No scorer was invoked.

{scoretable}
Formal totalScore=null; categoryScores=null; points/band/assessment=null for all proof rows. Approved predecessor rubrics retain their original NOT_RATED status, and P1's25 completed/113 deferred assessments remain byte-identical. Separate human assessment authorization and data/admission provenance are still required after topic evidence is qualified. Ranking consumes only complete actionable formal inputs and is not attempted.
''')
 valtable='| Dependency | State | Exact finding |\n|---|---|---|\n'+''.join(f"| {x['dependency']} | {x['status']} | {x['reason']} |\n" for x in v['dependencies'])
 markdown('VALUATION_FEASIBILITY',f'''# TCB valuation feasibility
{intro}
**BLOCKED. Intrinsic value=null; margin of safety=null; selected price/shares=null.**

{valtable}
Retained latest display price reference: dated{v['retainedDisplayReference']['tradingDate']}; unit{v['retainedDisplayReference']['unit']}; adjustment `{v['retainedDisplayReference']['adjustment']}`. Exact immutable DB row/body hash/source pointer are in `market-portfolio-inventory.json`; no price amount is promoted to a model input. Broker/personal ownership quantity cannot be used as issuer shares outstanding.

Method definition, case inputs and permission are separate. Existing M3 margin-of-safety and bank primary-method policies are available; no new valuation methodology is needed merely to diagnose missing data. Risk Policy normal15% five-year hurdle is already approved, but selecting15% as discount rate would be an unsupported economic assumption. Multiple justified-P/B/residual-income views sharing identical assumptions are not automatically independent crosschecks. Low P/E cannot establish undervaluation. Cutoff and original historical availability remain unresolved even when financial reports are audited.
''')
 dectable='| Input | Feasibility | Exact blocker / retained fact |\n|---|---|---|\n'+''.join(f"| {x['input']} | {x['state']} | {x['reason']} |\n" for x in dec['inputs'])
 markdown('DECISION_FEASIBILITY',f'''# TCB M4 decision feasibility
{intro}
**DECISION_NOT_AUTHORIZED.** No live investment Decision State is emitted, including HOLD or AVOID. The missing-input outcome is a feasibility result, not an eighth M4 state or a new policy rule. No M4/scorer/ranking function is invoked.

{dectable}
Approved M4 consumes mandate/veto/Stage0 → thesis → category gates → valuation/return → portfolio risk → cash/lot → opportunity cost → technical execution. Existing score thresholds and static authority are preserved. Financial health is PARTIAL, not an assumed stage0PASS; absence of a known veto does not produce CLEAR. Portfolio display/owner facts stay resolved, but no admission/ledger rewrite is authorized.

Current accepted decision implementation is `m65-decision-v1-sector-monotonicity-20261001` (M6.5.3). Above ordinary30% sector no-add, a generic approvalReference cannot authenticate a sector-add exception; this is documented fail-closed behavior, not a newly discovered missing methodology. Any future exceptional contract is separate and is not implemented here.

A ranking or higher count of qualified financial metrics cannot override these gates. Opportunity-cost proof requires compatible genuinely actionable comparators and cash analysis, not this diagnostic candidate ordering. Existing personal confirmations must be reused; no request to reconfirm TCB150, already received MWG95,000, pending475,000 or custody-fee nature is introduced.
''')
 blocktable='| Priority / ID / class | Affected scope | Owner / effort | Minimum closure evidence or decision | External acquisition? |\n|---|---|---|---|---|\n'
 for b in reg['items']:
  blocktable+=f"| {b['priority']} / {b['id']} / {b['classification']} | {b['blockingScope']} Rubrics: {', '.join(b['affectedRubrics'])}. | {b['responsibleRole']}; {b['estimatedEffortCategory']} | {b['requiredEvidenceOrDecision']} | {b['canResolveWithoutExternalAcquisition']} |\n"
 markdown('BLOCKER_PRIORITIZATION',f'''# Minimum unblock plan — proposal only
{intro}
Priority is ability to unlock actual underwriting, not volume of missing financial objects. No rediscovery phase is proposed: issuer/PDF identity and engineering closures are preserved. All six issuers are affected by U1–U5; CTG/VCB add their exact existing conflict dependencies and MBB adds early parent-profit mapping. TCB is the smallest diagnostic target under the fixed rule, not a guaranteed complete research target.

Classification: A retained evidence not mapped; B genuinely absent within the explicitly inspected dated/qualified source scope; C qualitative research not qualified; D analyst assumptions unapproved; E owner policy/valuation decision; F methodology/executable defect; G production/data/decision authority limitation. No new blocking F defect is established by this static review; whole-release correctness is not tested or certified. U6 is conditional absence after the retained quote horizon, not a claim that the entire repository has no prices or shares.

{blocktable}

## Necessary dependency packages

'''+ '\n'.join(f'{i+1}. {step}' for i,step in enumerate(reg['minimumUnblockPlan']))+f'''

Every individual matrix topic must pass; these packages do not promise automatic23/23 completion or pre-approve source expansion. Existing report prices, share/action notes, related-party notes and interim data must be searched/mapped first. Candidate note matches do not prove moat/market share or favorable governance. No blocker is labelled physically absent merely because the current metric mapper does not expose it.

Acceptance: exact evidence pointers/hashes, compatible periods/scope/revisions/units and approved assumptions; independent challenge and full-topic coverage; no synthetic scores; dated admission and portfolio integrity only after separate approval. Stop if a named mandatory topic or actual authority remains missing. **Unblock plan NOT IMPLEMENTED.**
''')
 questions=[
 ('Can VN30 Value Investing OS currently produce a defensible investment analysis for a Batch B1 issuer?','YES for an auditable historical partial financial narrative (demonstrated forTCB); NO for complete end-to-end investment underwriting.'),
 ('Can it produce a complete approved M3 score?','NO:0/23 complete rubric topics forTCB,0/138 acrossB1; required human/full-topic/assumption and admission conditions remain absent. No total created.'),
 ('Can it produce a qualified intrinsic value?','NO: sustainable common earnings/capital, compatible shares/actions, approved cutoff/source and case economic assumptions are incomplete; policy methods already exist.'),
 ('Can it produce an authorized M4 investment decision?','NO: DECISION_NOT_AUTHORIZED; no complete score/valuation/thesis/risk-confidence/portfolio/market/execution/opportunity-cost input contract.'),
 ('Would continuing to Batch B2–B4 without remediation repeat the same failure?','YES, likely the same financial-context→full-topic→valuation/decision gap. More issuer metric objects do not close the shared blockers; no future batch is started.')]
 markdown('FINAL_REVIEW',f'''# P2.5 final owner review
{intro}
**Verdict: PARTIALLY_READY for meaningful auditable historical narrative. End-to-end readiness: BLOCKED. Candidate exercise: BLOCKED_FEASIBILITY_PROOF.** These labels address different levels: no whole M3 rubric is READY, but the retained evidence supports substantive factual financial analysis. Engineering completion is not investment-analysis acceptance.

{comparison}
Aggregate **0 READY /54 PARTIALLY_READY /84 BLOCKED** whole rubric instances. Candidate **TCB:0/9/14**. Selected by fixed dependency coverage37/43, then absence of registered conflicts; no performance or investment-preference input. Existing financial object totals and23 sealed dispositions per issuer are unchanged.

TCB proof: explicit group versus parent earnings, group historical ROE, separate regulatory CAR versus accounting equity, population-consistent NPL/coverage/customer allowance, funding instruments and different loan/deposit growth rates are auditable. No sustainable economics, competitive moat, stress survival, intrinsic value or investment recommendation is inferred from them. Every finding has FACT/ESTIMATE/ASSUMPTION/UNQUALIFIED labels and exact evidence references in the proof and machine claim ledger.

'''+ '\n\n'.join('**'+q+'**\n\n'+a for q,a in questions)+f'''

## Top five root blockers

1. U1 — full retained economic/common-owner/financial topic mapping and reconciliations.
2. U2 — issuer-specific qualitative/industry/governance qualification.
3. U3 — explicit valuation/as-known cutoff and compatible source/share/action policy.
4. U4 — sustainable earnings and bounded scenario/discount/terminal assumptions with actual approvals.
5. U5 — dated independent admission, human assessment and compatible portfolio/market/execution/opportunity-cost contracts.

U6 is conditional if the owner selects a cutoff later than the retained quote horizon. Minimum proposal: one boundedTCB target; owner cutoff/source choice; retained mapping and topic qualification; approved model scenarios; then separate acceptance/decision workflow. Nothing in that plan is implemented.

Engineering versus research: no new blocking executable defect is established; static methodology, input/output hash and bounded readiness checks do not constitute production or whole-repo test acceptance. Core blockers are evidence mapping, full-topic research, unapproved case assumptions/cutoff and data/admission bindings, not a request to redefine M3/M4 or rediscover source identities. Existing policy return hurdles and accepted static authorities are already available. Their presence does not grant financial dataset or decision authority.

Baseline exact source/code/output verification is recorded in `baseline-integrity.json`; M1–M4/active authority inspection in `methodology-inspection.json`; source pins and protected before/after fingerprints preserve M1–M8, masters, all retained sources, predecessor outputs and database/sidecars. Actual commands/runtime/exit codes/check counts and reproducibility are recorded in `validation-receipts.json` and `validation-results.json`. No formal scorer, ranking, decision, financial-source acquisition or production invocation is authorized/executed by this proof. Implementation is a new documentation/analysis artifact and remains uncommitted; HEAD stays{BASELINE}.

**STOP. Await owner review of this feasibility proof and minimum plan. No remediation, new issuer, B2/B3/B4, financial/authority rewrite or production activation.**
''')

if __name__=='__main__':build()
