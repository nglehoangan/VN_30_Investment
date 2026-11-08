"""Bounded TCB underwriting package; all writes confined to P2.6 docs."""
import json,sys,hashlib
from pathlib import Path
from collections import Counter
from decimal import Decimal
import normalize as n
import underwrite,valuation_model
OUT,ROOT=n.OUT,n.ROOT
P25='docs/fundamental-data-engine/dfr-05/p2-5-b1-readiness-74510523/'
POLICIES=['docs/01 SYSTEM/INVESTMENT_POLICY.md','docs/01 SYSTEM/SCORING_MODEL_v1.0.md','docs/01 SYSTEM/RISK_POLICY_v1.0.md','docs/01 SYSTEM/DECISION_FRAMEWORK_v1.0.md','docs/03 SCORING/METRIC_DEFINITIONS.md','docs/03 SCORING/SECTOR_NORMALIZATION.md','docs/03 SCORING/SCORING_ENGINE.md','docs/03 SCORING/SCORECARD_TEMPLATE.md','docs/03 SCORING/RANKING_RULES_v1.0.md','docs/04_DECISION_ENGINE/DECISION_ENGINE.md','src/domain/scoring/methodology.ts','src/domain/scoring/scorecard.ts','src/domain/decision/engine.ts','src/infrastructure/dependencies/active-authorities.json','docs/fundamental-data-engine/VIETSTOCK_ONLY_SOURCE_POLICY.md','docs/fundamental-data-engine/dfr-04/closure-37e12f2/DFR_04_RESEARCH_SOURCE_SCOPE.md','docs/fundamental-data-engine/governance/DATA_PIPELINE_REAPPROVAL_2026-10-31.md']

def choices():
 rows=[
 ('D1','Cutoff and timezone','2025-12-31T23:59:59+07:00; Asia/Ho_Chi_Minh, retrospective FY2025 balance-date research','2026-10-30 completed-close research using later financials/actions; or latest2026-11-08 research after compatible evidence exists','FY2025 alternative minimizes the share/book temporal bridge, but needs compatible historical-price adjustment qualification and is not as-known underwriting.'),
 ('D2','Research basis','Explicit retrospective FY2025 audited-document basis, using later-audited current/comparative columns as labeled','Strict historical as-known: use only evidence demonstrably available at cutoff; latest-available: review retained2026interims and subsequent events','16March2026audit date is not publication. The FY2025 audit cannot be silently used as information known31December2025.'),
 ('D3','Price source/staleness','Retained TCBS close for selected date only after unit/action/adjustment semantics qualification; missing compatible close→MISSING, not older/current relabel','Choose another already-authorized source with independently qualified semantics; otherwise SOURCE_AUTHORITY_REQUIRED','Display/review approval is preserved, not re-requested. Research valuation eligibility is a separate intended-use choice. No stale carry-forward or correction factor inferred.'),
 ('D4','Shares/actions','Issuer Note23closing ordinary shares for point-in-time book/value; Note34weighted shares only for EPS. Require complete issuer action bridge for any different cutoff','A later qualified issuer action/share record; do not use broker holdings or infer shares from EPS','FY2025closing7,086,240,414 and weighted7,069,481,069 are different denominators. 2026personal100+50pending does not prove issuer adjustment factor.'),
 ('D5','Missing/incompatible evidence','Fail closed at affected metric/model/rubric; preserve original records and explicit conditional cases','Approve a tightly evidenced conservative scenario, labelled estimate with bounds and approvals; no neutral fill','Approval cannot turn unknown source facts into facts. No latest-wins or equal-value matching.'),
 ('D6','Research/production separation','Keep RESEARCH_PROVISIONAL; no formal points, ranking, decision, NAV or ledger admission','Separate authenticated financial/market/portfolio admission and owner authority workflow after case qualification','P2.6 and case approval alone do not change accepted static authorities or activate production.')]
 return dict(status='OWNER_DECISIONS_PENDING',selectedCutoff=None,selectedBasis=None,approvalReceipt=None,items=[dict(id=i,topic=t,recommendedDefault=r,alternatives=a,consequences=c,ownerDecision=None,ownerApproval=None) for i,t,r,a,c in rows])

def sources_and_decisions():
 p=P25+'market-portfolio-inventory.json';old=n.read(p);price=old['latestRetainedDisplayPrices']['TCB']
 history='data/market-source/tcbs/2026-10-29T01-48-59.704Z-unified/5.13-TCB-history.raw.json';raw=ROOT/history;n.PINS[history]=n.p1.sha(raw);data=json.loads(raw.read_text(),parse_float=Decimal,parse_int=Decimal);candidates=[]
 if data.get('ticker')!='TCB':raise ValueError('FOREIGN_PRICE')
 for i,r in enumerate(data['data']):
  if r['tradingDate'].startswith('2025-12-31'):
   candidates.append(dict(path=history,sha256=n.PINS[history],jsonPointer=f'/data/{i}',tradingDate=r['tradingDate'],rawClose=str(r['close']),declaredNativeUnit=None,adjustment='UNDECLARED_IN_RETAINED_HISTORY',qualifiedForValuation=False,status='CANDIDATE_REQUIRES_UNIT_ACTION_AND_SOURCE_POLICY_QUALIFICATION'))
 confirm='docs/fundamental-data-engine/governance/PORTFOLIO_OWNER_CONFIRMATIONS_2026-10-31.json';n.read(confirm)
 return dict(ticker='TCB',priceReference=dict(sourceBinding=n.bind(p,'/latestRetainedDisplayPrices/TCB'),observation=price,selectedForModel=False),historicalPriceCandidates=candidates,portfolio=dict(sourceBinding=n.bind(p,'/portfolio'),ownerConfirmationBinding=n.bind(confirm),knownFacts='TCB150=100available+50pending; dated cash327420/pending475000/fee420 and MWG95,000already received remain settled. No new balance inferred.',reconfirmationRequired=False,valuationCutoffBinding=None,formalSnapshot=None),decisionStatus='DECISION_NOT_AUTHORIZED',thesis='PARTIAL',financialHealth='HISTORICAL_DRAFT_ONLY',valuation='BLOCKED',dataConfidence='NO_FORMAL_FIVE_DIMENSION_ASSESSMENT',nav=None,executableCash=None,sectorConcentration=None,positionSizing=None,lotAffordability=None,opportunityCost=None,marketMoneyFlow='UNQUALIFIED_AT_CHOSEN_CUTOFF',technicalEntry='UNQUALIFIED_AT_CHOSEN_CUTOFF',hardVetoStatus='NOT_ASSESSED_NOT_CLEAR',liveInvestmentDecision=None)


def closure(round_no):
 rows=[
 ('U1','PARTIALLY_RESOLVED','Reported common EPS numerator, parent-equity rollforward, explicit shares, population-correct NPL/allowance and current credit-cost/funding/cash/maturity schedules are now qualified.','Common/tangible capital, sustainable ROE/credit cost, full average earning assets/NIM, CASA semantics, unrestricted funds/covenants and complete action/normalization outcomes remain unqualified.','Bank analyst + data reviewer','Use named retained notes to establish exact missing definitions/allocations; no repeat source-identity discovery. Owner chooses valuation scope; estimates need explicit approval.'),
 ('U2','PARTIALLY_RESOLVED_SOURCE_AUTHORITY_REQUIRED','Business activities, deposit/fee mix, unmodified audit opinion, equal ordinary-share rights, related-party definitions and reported risk governance are linked to reviewed pages.','Independent moat/market share/competition/cycle and beneficial-control/transaction-fairness/complete minority-protection evidence not qualified.','Owner/source-policy authority; analyst/challenger','Approve/amend/defer finite source classes: dated public banking-industry/regulatory data and TCB governance/share-issue/ownership disclosures. No URL, document publication date or approval is invented; no acquisition.'),
 ('U3','DECISION_SHEET_COMPLETE_OWNER_DECISION_PENDING','D1–D6 specify recommended cutoff/basis/source/share/action/missing/authority treatments, alternatives and consequences. Existing retained TCB price references are located.','No owner valuation-cutoff/source/action choice; historical API adjustment/unit basis still unqualified for a share-coherent price.','Owner / CIO','Approve/amend/defer named D1–D6 choices. Approval does not qualify missing source semantics or create a current quote.'),
 ('U4','MODEL_SPECIFICATION_COMPLETE_CASE_INPUTS_BLOCKED','Executable-ready RI/justified-PB specification, bear/base/bull assumption templates, sensitivity and capital/dilution controls prepared; actual case evaluation rejects missing inputs.','No qualified/approved sustainable common return/capital, cost of equity, growth/payout/tax/stress/terminal values, or independent crosscheck.','Bank valuation analyst + Risk/owner approval','Qualify A-BOOK/A-NORMALIZE then evidence-bound and approve A-ROE/KE/GROWTH/PAYOUT/STRESS/CAPITAL/TERMINAL/ACTIONS/XCHECK. No numerical economic default.'),
 ('U5','DECISIVELY_BLOCKED_FORMAL_AND_DATED_BINDINGS','Known dated personal/price facts and accepted static authorities are preserved; no owner fact is reopened.','Thesis/valuation/confidence/approval, compatible portfolio/cash/NAV/concentration/lot/opportunity/market/technical and formal data bindings absent.','Owner + independent data/portfolio acceptance + Risk','A separately approved dated case/portfolio/admission contract is required. No formal scoring/ranking/decision or ledger/database changes in P2.6.')]
 return dict(round=round_no,status='ESCALATED' if round_no==2 else 'ROUND1_PREPARED',maximumRounds=2,automaticFurtherPhase=False,items=[dict(id=i,status=s,closureEvidence=e,remainingDependency=m,responsibleRole=o,concreteResolutionOrOwnerDecision=r,severity='Major',escalated=round_no==2) for i,s,e,m,o,r in rows],sourcePolicyStops=['Independent industry/competition/market-share evidence outside current retained authority: SOURCE_AUTHORITY_REQUIRED','New TCB governance/beneficial-control/issue-term source outside current policy: SOURCE_AUTHORITY_REQUIRED'],remainingCriticalIssues=0,remainingMajorIssueGroups=5)


def build(round_no=1):
 if round_no not in (1,2):raise ValueError('MAXIMUM_TWO_REMEDIATION_ROUNDS')
 if round_no==1 and (OUT/'round1/manifest.json').exists():raise ValueError('ROUND1_ALREADY_SEALED_NO_NEW_ROUND1')
 e=n.financials('TCB');rubrics=underwrite.build(e);model=valuation_model.specification();decision=sources_and_decisions();sheet=choices();cl=closure(round_no)
 for p in POLICIES:n.PINS[p]=n.p1.sha(ROOT/p)
 payloads={'evidence-ledger.json':e,'rubric-underwriting.json':rubrics,'assumption-register.json':model['assumptions'],'valuation-model-specification.json':model,'valuation-owner-decision-sheet.json':sheet,'decision-readiness.json':decision,'blocker-closure.json':cl}
 for file,x in payloads.items():n.write(file,x)
 n.write('source-input-pins.json',n.PINS)
 report(e,rubrics,model,sheet,decision,cl,round_no)
 if round_no==1:
  if (OUT/'round1/manifest.json').exists():raise ValueError('ROUND1_ALREADY_SEALED_NO_NEW_ROUND1')
  for file,x in payloads.items():n.write('round1/'+file,x)
  n.write('round1/findings.json',dict(maximumFurtherRounds=1,findings=[dict(id='P26-M01',severity='Major',dependency='NPL denominator definition',finding='Prior P2.3 NPL/all-group-loan diagnostic includes securities margin/advances outside the classified bank NPL population. New core-population ratio is separately derived; old records preserved.',round2Action='Independently verify source page51population, ratios and exact baseline preservation.'),dict(id='P26-M02',severity='Major',dependency='Source column fidelity',finding='Retained text order interleaves FY2025/FY2024 interest-expense components; direct page72image supplies correct2025borrowing3,203,209 and issued-instrument8,228,548million values.',round2Action='Verify image-column qualification and total expense reconciliation.'),dict(id='P26-M03',severity='Major',dependency='Liquidity scope',finding='Page98gross assets and behavioural deposit maturity cannot establish unrestricted funds/covenant coverage.',round2Action='Reject free-cash/fully-contractual interpretations; keep FH-LIQ/stress deferred.'),dict(id='P26-M04',severity='Major',dependency='Capital/earnings/model semantics',finding='Parent book proxy and exact common EPS numerator are not sustainable common return/TCE; direct retained capital transaction must not enter P&L.',round2Action='Verify parent rollforward; reject incomplete valuation case and Strong FH-BS maximum; check all23topic/band boundaries.')]))
  files={str(p.relative_to(OUT/'round1')):n.p1.sha(p) for p in sorted((OUT/'round1').rglob('*')) if p.is_file()};n.write('round1/manifest.json',dict(status='ROUND1_SEALED',files=files,contentHash=n.p1.digest(files)))
 n.write('summary.json',dict(baselineCommit=n.BASELINE,implementationCommit=None,implementationState='UNCOMMITTED',round=round_no,analysisReadiness='ANALYSIS_PARTIALLY_READY',M3_RUBRIC_READINESS=dict(qualifiedHistoricalDraft=1,blockedForCompleteAssessment=22,formalAssessments=0,proposedQualitativeBands=1,officialPointAssignments=0,totalScore=None),VALUATION_READINESS='EXECUTABLE_SPECIFICATION_READY_CASE_INPUTS_BLOCKED',M4_DECISION_READINESS='DECISION_NOT_AUTHORIZED',PRODUCTION_AUTHORITY='NOT_AUTHORIZED_BY_P26; EXISTING_STATIC_AUTHORITIES_UNCHANGED',endToEndAnalysisReady=False,resumeB2_B4Recommended=False,escalationStatus=cl['status'],factCount=sum(f['classification']=='REPORTED_FACT' for f in e['financials'].values()),derivedCount=sum(f['classification']=='DERIVED_METRIC' for f in e['financials'].values()),missingDependencies=len(e['missing']),criticalIssues=0,majorIssueGroups=5,acquiredSources=0))
 print(json.dumps(dict(round=round_no,status=cl['status'],facts=sum(f['classification']=='REPORTED_FACT' for f in e['financials'].values()),derived=sum(f['classification']=='DERIVED_METRIC' for f in e['financials'].values()),draftQualified=1,blocked=22,valuation=model['status'])),flush=True)
 return payloads


def report(e,rubrics,model,sheet,decision,cl,round_no):
 f=e['financials']
 def value(k,y=2025):return f[k+':'+str(y)]['value']
 def md(name,text):(OUT/('DFR_05_P2_6_'+name+'.md')).write_text(text.strip()+'\n')
 intro=f'''Baseline `{n.BASELINE}`. TCB only; round {round_no}/2. RESEARCH_PROVISIONAL, formal points/bands/assessments/totals/ranking=null; no live investment decision. Existing M1–M4, approved source/scope identities and historical dossiers are unchanged. New records are a separate versioned research overlay; no source acquisition or production/DB/master/authority write. Report date2026-11-08, Asia/Ho_Chi_Minh.\n'''
 table='| Reading / diagnostic | FY2025 canonical value | Unit / status | Exact source or operands |\n|---|---:|---|---|\n'
 for k,x in f.items():
  if x.get('year')!=2025:continue
  src=x.get('source');where=(f"{Path(src['path']).name} p{src['physicalPage']}; {src['caption']}; column {src['column']}" if src else ', '.join(x['operandIds']))
  table+=f"| {x['key']} | {x['value']} | {x['unit']} / {x['status']} | {where} |\n"
 missing='\n'.join(f'- **{k}:** {v}' for k,v in e['missing'].items())
 md('TCB_FINANCIAL_NORMALIZATION',f'''# TCB financial/economic normalization
{intro}
## Resolved reported and derived reconciliations

FY2025 group NPAT25,954,472million remains its prior source fact. Parent NPAT25,290,230million plus welfare adjustment−35,379million reconciles to ordinary EPS numerator**25,254,851million**. That is reported common EPS earnings, not sustainable common earning power. Parent book**170,044,504million** equals group equity179,501,442 less NCI9,456,938; direct retained-capital transaction6,244,850million remains outside P&L. The full parent-equity rollforward reconciles exactly. Other equity7,764,086million is neither assumed preferred nor automatically removed; its common/TCE/valuation treatment remains unqualified. Group intangibles5,779,202million cannot simply be subtracted from parent book without allocation review. Historical group ROE in P2.3 and the16.011%EPS-numerator/parent-book proxy are different diagnostics; neither is sustainable ROE/ROTE.

**Population exception P26-M01:** Note9.1classifies bank loans**723,757,397million** separately from securities margin/advances43,859,732million; combined gross is767,617,129million. Groups3–5sum8,198,375million. The banking-population NPL ratio is**{value('NPL_BANK_CORE_RATIO')}**, whereas the frozen P2.3ratio0.010680291893 divides by combined gross. The latter is retained as a historical all-group-loan statistic, not used here as a bank-core NPL ratio. Customer allowance10,485,620million excludes margin allowance12,758million; coverage**{value('NPL_COVERAGE_BANK_CORE')}** uses the matching NPL population. No approved observation or M3 definition is changed; the evidence-discovered scope/label application is corrected only in this overlay. Do not use P2.5's broad population-consistency wording as proof against the new source evidence.

Reported customer provision flow4,475,370million divided by simple average same-population bank loans gives**{value('CUSTOMER_CREDIT_COST_REPORTED')}**; this is not normalized/stressed credit cost. Demand deposits213,415,080million /customer deposits618,911,535million give**{value('DEMAND_DEPOSIT_SHARE')}**, versus{value('DEMAND_DEPOSIT_SHARE',2024)}in the comparative. This is a demand-deposit share, not automatically approved CASA or competitive funding advantage. Customer-only funding cost is not deposit expense divided by customer deposits because the expense population is broader.

Recognized interest68,017,450million less total interest expense29,862,359million gives NII38,155,091million. Image review resolves interleaved extraction columns: borrowing expense**3,203,209million**, issued-instrument interest**8,228,548million**, deposit interest18,124,418million and other306,184million sum exactly to the total. Cash interest received67,231,128million and paid27,761,618million remain separate; no forced full accrual/fee bridge or bank CFO/free-cash-flow shortcut. NIM remains MISSING because an exact average earning-asset population is not qualified.

TT41regulatory consolidated Tier1/Tier2/deductions170,177/13,073/1,380**billion** reconcile to181,870billion regulatory capital, with RWA1,244,531billion. Reported CAR14.61%and Tier1ratio13.67%are not accounting equity or CET1.6.61percentage points above the issuer-stated8%floor is a reported-floor diagnostic, not complete current legal/Pillar2or stress headroom. Source component rounding is preserved.

The page98ladder has gross assets1,203,451,967million and liabilities1,012,842,695million, net190,609,272million. Net gaps≤1month−33,439,423million,1–3months−32,600,658million,3–12months+22,636,985million,1–5years−78,518,149million and>5years+310,274,969million do not equal spendable liquidity. Page97explicitly uses behavioural assumptions for demand deposits; NHNN deposits include required reserves. Complete covenant/unrestricted-fund and stress schedules remain missing.

FY2025closing shares7,086,240,414and weighted basic/diluted7,069,481,069are explicit; they are not inferred from EPS.21,388,675issued shares reconcile opening to closing. Reported EPS3572versus3049and common-numerator growth are confined to the reviewed current/comparative cohort; full FY2022–FY2025issue-term, acquisition and later2026action bridges remain separate. Declared equity dividend movement−7,086,240million is not labelled a cash payment. Capital allocation events and their subsequent returns are distinct.

## Exact FY2025 ledger

{table}

Every ledger node has exact Decimal/native unit/multiplier, period, scope/population, explicit column/revision, source PDF hash/page and notes/transcription pointer, formula/operands, confidence and limits. Ratios are12dp HALF_EVEN with exact fractions. FY2024comparatives remain labelled as the FY2025filing cohort; earlier originals are not overwritten. No publication date is invented from the16March2026audit date. Source-image review is limited to the disclosed pages in `reviewed-bindings.json`; accepted source identity/scope is reused.

## Remaining exact dependencies

{missing}
''')
 md('TCB_BUSINESS_RESEARCH',f'''# TCB business underwriting
{intro}
The retained audited filing explicitly describes deposit taking, credit, payments/treasury, investments and FX (physical p17). That establishes activities, not a moat. The observed302branches/offices and group subsidiaries do not prove customer retention or channel efficiency. Note26supports a real fee business: gross12,526,963million and net8,771,995million, with payments/cash, agency, advisory, insurance cooperation and securities-related lines. No financial processing of a separate issuer is performed; these are TCB consolidated disclosures.

Funding franchise: demand balances are material, but mix falls from35.943%to34.482%. Disclosed low demand-deposit interest ranges and higher term-deposit ranges describe different contracts, not independently proven pricing power versus peers. Deposit inflows, FI funding and issued instruments must be considered together. CASA semantics, customer retention/churn, full allocated funding costs and relative service economics remain unqualified. A favorable moat or funding-advantage label is withheld.

Earnings resilience: ordinary EPS numerator25,254,851million differs from group and parent NPAT; cash/accrual interest and provision populations are now visible. Securities margin growth, new insurance control and direct retained-capital transactions complicate an organic earnings narrative. Gross/current reported earnings are not forecast forward or assigned a sustainable ROE. The equity movement identifies allocation events; outcome quality is still a research question.

Supporting evidence is keyed by exact node IDs in `evidence-ledger.json` (common/fee/deposit/cash/credit/share nodes and BUSINESS_MODEL/ALLOCATION_EVENTS narratives). Counterevidence includes declining demand-deposit mix, property business concentration and behavioural maturity gaps. Empirical competitive moat, differentiated pricing and adverse-cycle customer franchise are **SOURCE_AUTHORITY_REQUIRED** where the retained approved scope cannot support them. No source search hit becomes verified evidence.
''')
 md('TCB_INDUSTRY_GOVERNANCE',f'''# TCB industry, governance and risks
{intro}
Industry structure/competition/cycle: a regulated banking licence and an issuer's TT41regulatory description establish reported context only. No independently qualified banking-industry return pool, peer funding cost/share denominator, competitive behavior or full credit/property cycle is available under the selected retained evidence. The capital report's "leading" language is issuer opinion, not independent leadership evidence. IC-IND/IC-POS/IC-CYCLE remain unassessed. The existing Vietstock-only financial-document rule is not generalized into permission to collect arbitrary external industry/governance sources. The prior finite nonfinancial scope is a proposal, not an approval.

Governance: p10contains an unmodified EY opinion dated16March2026; that is not a guarantee against fraud or a favorable governance band. p71states one vote per ordinary share/equal residual priority. Note41(p80,p89) defines related-party relationships including common control/influence, overlapping managers/boards and connected entities. Tables on p81–p88remain retained candidate transaction evidence; no fairness/arm's-length conclusion is made merely from disclosure. Complete beneficial ownership, issue/ESOP terms, minority safeguards, incentives and actual treatment still require qualification. Reported board/BRC policies on p90are evidence of stated structures, not independent operating-effectiveness assurance.

Risk channels are distinct: bank-core classified loans and NPL reserve coverage; property-business sector loans207,026,817million (28.604%of core bank loans, not all property-correlated exposure); group margin/advances43,859,732million; wholesale funding/issued instruments; repricing and behavioural deposit maturity; common/NCI/capital-action attribution. NPL ratios do not capture unallocated household mortgage, collateral values or all correlated concentration. Negative near/medium maturity buckets coexist with a positive total gross gap and reported capital; neither proves distress nor stress survival. CET1and unqualified covenant/usable liquidity are not silently inferred.

Authority stop: independent dated Vietnamese banking/credit/property/funding data and TCB ownership/charter/issue-term/related-party economic evidence outside existing approval are **SOURCE_AUTHORITY_REQUIRED**. Proposed finite request: approve/amend/defer the precise dated source classes and at most4documents (up to2banking-industry/regulatory and2TCB governance/action documents) for this issuer after retained-material review. No URLs, notices, publication dates, market share or documents are fabricated or fetched; source class approval would not replace content qualification. Retained unresolved source leads remain **mapping/judgment gaps**, not assertions that no public evidence exists.
''')
 choices_table='| ID / decision | Recommended default (NOT APPROVED) | Alternatives / consequence | Owner decision |\n|---|---|---|---|\n'+''.join(f"| {x['id']} — {x['topic']} | {x['recommendedDefault']} | {x['alternatives']} — {x['consequences']} | null / PENDING |\n" for x in sheet['items'])
 md('TCB_VALUATION_DECISION_SHEET',f'''# TCB owner valuation choices
{intro}
No owner choice or approval receipt is recorded. Proposed cutoff is not selectedCutoff; actual selectedCutoff/basis remain null. No essential economic parameter is defaulted to an arbitrary number.

{choices_table}

Retained reference: TCB TCBS display close21,600VND/share dated2026-10-30is preserved with exact observation/body/source hashes, not selected as a valuation price. It cannot be combined blindly with FY2025shares. A retained historical2025-12-31API bar is located in `decision-readiness.json` with exact raw pointer/hash if present; provider-native history unit and adjustment semantics remain unqualified. A date match alone is not price/share compatibility. No source, share count or price policy is approved by this sheet.

Owner/analyst must also resolve qualified common-book treatment and evidence-backed A-ROE/KE/GROWTH/PAYOUT/TERMINAL/STRESS/CAPITAL/XCHECK cases. The existing normal15%forward-return hurdle and exceptional12%floor stay approved policy; neither is a selected discount rate. Historical broker holdings150=100+50pending and known cash/dividend/fee categories are settled; they are not issuer share counts or evidence of current balances. Approval is requested only for genuinely unresolved case scope/assumptions/source intent, not settled facts.
''')
 assumptions_table='| ID / parameter | Evidence/rationale | Value / approval |\n|---|---|---|\n'+''.join(f"| {a['id']} — {a['parameter']} | {a['rationale']} Evidence: {', '.join(a['evidenceSupport']) or 'approved methodology / external case evidence still required'} | null; owner={a['ownerApprovalStatus']}; analyst={a['analystApprovalStatus']} |\n" for a in model['assumptions'])
 md('TCB_VALUATION_MODEL',f'''# TCB bank valuation — executable-ready specification
{intro}
**Specification ready; case/model inputs BLOCKED. No intrinsic-value range, margin of safety or expected return is produced.** `valuation_model.py` is an unactivated documentation/research specification; it is not a new production methodology identity or M3 amendment. Current TCB case evaluation returns BLOCKED_INPUTS_OR_APPROVAL with null outputs. Mathematical tests use visibly synthetic fixtures, not TCB economic assumptions.

Primary approved bank principle: sustainable common ROE versus cost of equity, justified P/B/residual income. For a consistent constant-state case with qualified common book B0, g=ROE×(1−payout), ke>g and ROE>g:

`justified P/B=(ROE−g)/(ke−g)`

`V0=B0+Σ residualIncome_t/(1+ke)^t+discounted terminal residual-income value`

`residualIncome_t=(ROE_t−ke)×commonBook_(t−1)`

These are common-equity economics, not regulatory capital multiplied by a book multiple. Finite transition cases need approved year-by-year ROE/payout/capital paths; the delivered executable constant-state kernel validates the limiting case, while the specification records the complete transition dependencies. It refuses an incomplete issuer case and cannot silently select horizon/scenarios. Growth and payout must reconcile; no independent manipulation to boost value. Common regulatory-capital targets/conversion must be qualified before certifying feasible growth/distributions.

Bear/base/bull templates in `valuation-model-specification.json` all have null numerical parameters and NOT_APPROVED statuses. Bear requires evidence-bounded credit/property/funding stress and capital response; base requires normalized common economics; bull requires sustainably funded improvement without automatic multiple expansion or unjustified lower cost of equity. Rationale, evidence, approval and downside/sensitivity implications are recorded for every assumption below.

{assumptions_table}

Sensitivity specification: d(P/B)/dROE=1/(ke−g); d(P/B)/dke=−(ROE−g)/(ke−g)^2; d(P/B)/dg=(ROE−ke)/(ke−g)^2. Credit-cost effects require average matched-population loans, qualified tax and parent attribution; no tax rate assumed. Payout changes imply growth/capital changes. A dilution case needs exact new shares, net common funds, price/rights and common-capital treatment; recompute equity, normalized return, regulatory feasibility and per-share value. Personal pending shares are not issuer dilution inputs.

Economically independent crosscheck: issuer-only historical normalized P/E/earnings calibration is a candidate only when normalized common earnings, dated price history and action/share compatibility are qualified. No other issuer is processed. Gordon/DDM and constant-state RI using the same ROE/ke/g are arithmetic consistency tests, not independent corroboration. This crosscheck is **MISSING**, not invented from multiple weak correlated models.

MOS requires a qualified conservative per-share range and compatible selected price; expected return requires initial price, action-adjusted distributions and terminal scenario. None is executed. Owner case approval does not admit research into formal scoring/NAV/M4/production.
''')
 body=''
 for r in rubrics:
  body+=f"\n## {r['rubric']} — {r['status']}\n\n**Business assessment / reasoning:** {r['businessAssessment']}\n\n**Support:** {', '.join(r['supportingEvidence']+r['reportedDisclosureEvidence']) or 'No qualified full-topic support; authority dependency recorded.'}\n\n**Counterevidence:** {', '.join(r['contradictoryEvidence']) or 'Critical absence of independent/qualified required topic evidence; no favorable inference.'}\n\n**Risk:** {r['riskFactors'][0]}\n\n**Confidence:** {r['confidence']}. **Assumptions:** {', '.join(r['assumptionDependencies'])}.\n\n**Proposed qualitative band:** {r['proposedQualitativeBand'] or 'null — not defensible yet'}. Official points/band/assessment=null. **Exact missing evidence / conditions:** {'; '.join(r['missingEvidence']+r['conditions'])}.\n\n**Invalidation:** {'; '.join(r['invalidationConditions'])}\n"
 md('TCB_RUBRIC_UNDERWRITING',f'''# All23TCB draft rubric assessments
{intro}
**1/23 QUALIFIED_HISTORICAL_DRAFT (FH-BS),22blocked for complete assessment. Zero formal assessments/points.** Historical fiscal-position qualification does not establish a current or AS_KNOWN case. The proposed **Adequate** FH-BS band is an existing unchanged M3 label; no point within its range is selected. Strong is rejected because normalized/downside maximum prerequisites are not demonstrated. It is not an investment recommendation or a formal Financial Health category score.

FH-BS's four mandatory topics have explicit separate evidence: capital (TT41capital, deductions and reported ratios); asset_quality (same-population NPL/allowance, group2and sector concentration); funding (demand/term/wholesale mix plus maturity counterevidence); leverage_context (book equity and loan/risk-asset scope, without bank industrial debt shortcuts). Unqualified CET1/TCE/sustainable returns and full stress/usable-liquidity remain limitations and separately block other rubrics/case readiness; they do not create unsupported maximum credit. All support/counter IDs resolve in `evidence-ledger.json`; original145P2.3metric objects and23rubric dispositions remain unchanged.

{body}
''')
 md('TCB_DECISION_READINESS',f'''# TCB M4 and portfolio readiness
{intro}
**DECISION_NOT_AUTHORIZED.** No live state, rank, position, quantity or transaction is generated. The following are independent from a descriptive draft FH-BS band:

| Input | Status / precise binding still required |
|---|---|
| Thesis | Partial: full moat/industry/governance, forward economics, downside/invalidation and fresh underwriting still need qualified evidence. |
| Valuation | Case inputs, independent crosscheck and D1–D6owner decisions absent. |
| Data confidence/veto | No complete formal five-dimension assessment, availableAt history or affirmative CLEAR veto finding. Unmodified audit alone cannot supply it. |
| Holdings | TCB150=100available+50stockDividend pending is already confirmed from retained29Oct observations in31Oct record. Do not re-ask or call150tradable. |
| Cash | Dated28Oct cash327420, pending475000, accrued fee420 and linked-bank availability12152752are resolved; already-received MWG95000is included in cash. No double counting or invented later fee/payment/rate. |
| NAV/cash/sector/size | A cutoff-compatible admitted portfolio snapshot with positions, dated market values, selected cost basis, cash/fees/obligations and ledger/reconciliation watermark is missing. Dated personal facts are not automatically a current formal contract. |
| Lot | Existing100-share planning rule is retained; selected date/eligible price/fee/cash/lot affordability not supplied. No new exchange-rule claim. |
| Opportunity cost | No compatible actionable comparator contracts/required return, friction, marginal capacity or cash-alternative evaluation. No additional issuer analysis authorized. |
| Market/flow/technical | Display/history reference evidence exists; purpose/cutoff/adjustment/independent acceptance and money-flow/technical execution assessments are unqualified. |
| Production/formal admission | Existing accepted static authorities remain intact. New research data, human assessment and market/portfolio/decision acceptance are independent and not granted by P2.6. |

Exact prior dated facts and price observation bindings are in `decision-readiness.json`. Cost basis is not an intrinsic-value anchor. No formal scorer, ranking, decision, DCA, NAV or ledger is invoked. The mandated single-case proof cannot authorize a production action, even if one draft financial rubric becomes supportable.
''')
 closuretable='| Blocker | Closure result | Exact remaining dependency / owner resolution |\n|---|---|---|\n'+''.join(f"| {b['id']} | {b['status']} — {b['closureEvidence']} | {b['remainingDependency']} Owner: {b['responsibleRole']}. {b['concreteResolutionOrOwnerDecision']} |\n" for b in cl['items'])
 md('BLOCKER_CLOSURE',f'''# P2.5 U1–U5 bounded closure
{intro}
{closuretable}

Round1qualifies retained evidence, creates financial/economic reconciliations and proposed underwriting/assumption/case sheets. `round1/` freezes those artifacts and4specific challenge findings. Round2is restricted to these demonstrated denominator/column/liquidity/capital-and-model defects/dependencies, exact lineage/completeness and independent-style challenge. No P2.6.3is created. The same agent performs distinct preparation/challenge passes; independent human acceptance is not claimed.

After round2unresolved U1–U5are **ESCALATED**, with named owner/data/analyst decisions rather than another source-discovery phase. New-source dependencies outside existing authority stop at SOURCE_AUTHORITY_REQUIRED. At most4specified source documents are proposed for a separate owner source-scope decision; none fetched. Retained unavailable mapping is not labelled proof no public evidence exists.

Remaining Critical0; Major5research/case/authority issue groups. The demonstrated old group-vs-core NPL population interpretation is resolved only in the new overlay; no sealed dossier/source corrected or reaccepted. Current/prior expense-column ambiguity is resolved by reviewed image bindings. Unrestricted liquidity/common capital/model approval gaps remain visibly blocked, not silently repaired or graded zero. Baseline integrity and technical model tests do not constitute financial acceptance.
''')
 md('FINAL_REVIEW',f'''# P2.6 TCB final review
{intro}
**ANALYSIS_PARTIALLY_READY.** The package supports substantive TCB historical underwriting with exact reported common earnings/share/capital/credit/funding/cash/maturity and source-disclosed business/governance evidence. Full end-to-end case readiness is not established.

| Independent gate | Outcome |
|---|---|
| M3_RUBRIC_READINESS |1historical draft-qualified FH-BS,22blocked for complete assessments; zero formal points, total=null. Proposed Adequate label only; no Strong maximum or current-case claim. |
| VALUATION_READINESS |Executable-ready model specification; all actual bear/base/bull parameters/case approval inputs remain blocked. No qualified intrinsic range, MOS or expected return. |
| M4_DECISION_READINESS |DECISION_NOT_AUTHORIZED; thesis/valuation/confidence/risk/dated portfolio/market/execution/opportunity bindings incomplete. |
| PRODUCTION_AUTHORITY |Not authorized by P2.6; accepted static authority unchanged. No scoring/ranking/decision/DB/portfolio activation. |

Actual new findings: ordinary EPS numerator25,254,851million after welfare adjustment; parent book170,044,504million with direct retained-capital transaction kept outside earnings; explicit ordinary closing/weighted shares; banking NPL1.132751808%using723,757,397million core loans rather than mixed group denominator; matching reserve/NPL coverage; reported customer credit-cost0.6732050583%not normalized; demand mix34.4823%not certified CASA; gross behavioural maturity gaps not free cash. These improve underwriting evidence without fabricating sustainable return or future prices.

**Can TCB be analyzed under M1–M4?** Yes for the scoped historical/draft analysis; no for a complete approved end-to-end current/as-known investment case. **All23rubrics?** All have substantive support/counterevidence, reasoning, confidence, risks, assumptions and exact blockers; only1has complete historical descriptive topic evidence for a proposed band. **Qualified intrinsic range?** No: common/TCE/normalization and ke/growth/payout/terminal/capital/independent-crosscheck plus D1–D6approvals unresolved. **Formal scoring/M4?** Separate full topic/human/data/market/portfolio/risk/confidence/decision authority required. **Unresolvable within this execution?** U2outside-policy independent industry/governance evidence and unapproved owner/case choices cannot be manufactured; new evidence/source authority and actual approvals required. Existing dated personal facts are not reopened.

U1andU2partially resolved, U3decision sheet complete pending owner, U4specification complete with blocked case, U5decisively blocked at dated/formal boundary. Remaining Critical0 / Major5research/case/authority groups; no newly remaining engineering defect is asserted from absent evidence. The legacy denominator application issue and text-column ambiguity are isolated/challenged in the new overlay; predecessor observations and histories stay intact.

Recommendation: review/accept the bounded research overlay and explicit owner D1–D6/assumption/source-scope decisions; do not treat technical validation as investment approval. **Do not resume B2–B4 to solve these shared end-to-end gaps.** More issuer metric objects would not supply normalized economics, industry/governance, case approvals or formal decision bindings. This is a readiness recommendation about workflow, not a security recommendation.

Round2 challenge also demonstrated that the draft constant-state model ignored nonzero issuance when terms were marked qualified. The final kernel now requires explicit zero issuance/cash assumptions and rejects every nonzero capital action for separate post-issuance modelling; positive cost of equity is enforced. Synthetic tests only; no TCB value was calculated.

Round2result: **{'ESCALATED — STOP' if round_no==2 else 'ROUND1 PREPARATION; one bounded challenge round remains'}**. No automatic additional phase, acquisition or remediation. Full source/code/output parity, Decimal/lineage/model rejection and bounded tests are recorded in validation receipts/results; these are not whole-release production tests. Implementation artifacts are uncommitted; HEAD remains{n.BASELINE}.
''')

if __name__=='__main__':build(2 if '--round2' in sys.argv else 1)
