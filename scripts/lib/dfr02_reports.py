"""Readable research reports and exact-band partial judgments; never total scores."""
from collections import Counter
from decimal import Decimal
import json
from .dfr02 import PILOT, VERSION, SECTORS, number, disposition
from .r4_rubric_completion import validate_partial_assessment


NARRATIVES={
 'FPT':dict(health='Disclosed financial borrowings must be read against cash and equity, not interpreted as complete contractual debt. Rising assets and borrowings fund an expanding technology/telecom platform; investment in infrastructure consumes cash before any owner distribution.',growth='The four full-year consolidated revenue and profit observations distinguish operating scale growth from per-share compounding. Parent-attributable NPAT and total group NPAT are separate; the common-earnings fund deduction is not applied to group cash-conversion ratios.',cash='Four-year cash realization and annual CFO less disclosed acquisition spending measure reported cash generation. The FY2025 cash/capex change tests whether growth is consuming more capital; acquisition spending is not automatically maintenance capex.',risks='Client IT budgets, execution/wage costs and infrastructure reinvestment are sector risk channels, not measured forecasts. Source v4 explicitly does not establish exhaustive one-off or full-cycle normalization; this prevents a complete earnings-quality or forward-runway band.',valuation='The inherited owner-cash scenarios depend on cash conversion, funded growth, incremental returns and terminal economics. They are conditional estimates, not accepted equity value or a dated share-price target.'),
 'VNM':dict(health='Consumer-dairy cash generation is assessed separately from inventory, receivables and disclosed borrowings. A current ratio is a balance-sheet diagnostic, not proof of unrestricted cash or covenant headroom.',growth='Consolidated reported revenue, group NPAT and parent-attributable NPAT show the growth/margin pattern without mixing in standalone profits. Neither a low-growth mature demand profile nor accounting profit persistence alone proves normalized per-share compounding.',cash='The consolidated four-year CFO/NPAT series is diagnostic. The separately reviewed standalone FY2024–FY2025 cash bridge contains working-capital flows, current versus paid tax, interest/dividends received, acquisition spending and fund accrual/use. Deposit income and subsidiary distributions are not stripped out and then added a second time.',risks='Consumer demand, input-milk/feed costs, competition and mix are economic risks; no external market-share forecast is inserted. The standalone model retains subsidiary economics, and the recurrence of other finance credits remains qualified.',valuation='The standalone owner-cash DCF is kept separate from consolidated reported earnings. Maintenance capex, incremental return, reinvestment reserve and tax timing remain explicit model assumptions; subsidiaries are not valued and added again.'),
 'BID':dict(health='Customer loans/deposits, reserves/gross loans, reported CAR and group capital/asset ratios are bank diagnostics. Customer loans/deposits is not the regulatory LDR; reserves/gross loans is not NPL coverage; NII/total assets is not NIM. The original reported CAR framework is retained.',growth='Compare loan, deposit, NII, asset and profit growth on full annual consolidated windows. Stronger credit growth can raise future credit cost and capital demand; it is not automatically high-quality growth.',cash='Industrial CFO/NPAT and industrial net-debt/EBITDA are deliberately absent. The economic realization review uses source-read recoveries, investment-risk reversal and the limitations of the total-credit-cost proxy.',risks='Recoveries and reversal contributions create a concrete earnings-quality dependency. Loan-level credit cost, NPL migration, accrued-interest quality, deposit composition and distributable regulatory headroom are not manufactured from aggregate assets.',valuation='Residual-income sensitivity uses an accounting parent-capital reference and conditional common earnings. Recoverable/distributable bank capital, persistence of credit returns and same-cutoff share/action/price evidence remain unqualified.'),
 'TCX':dict(health='The securities balance sheet is a funding/margin-financing business: margin loans/equity and financing debt/equity are more relevant than an industrial working-capital shortcut. Client segregation, collateral quality and maturity/covenant detail remain distinct.',growth='Standalone margin-loan, profit, equity and asset growth are shown across FY2022–FY2025. Equity issuance can enlarge the lending denominator; these aggregate increases do not establish organic or per-share compounding.',cash='Fair-value gains/losses and realized trading activity are separated. The reviewed paired revaluation adjustment is not gross securities sales revenue. No industrial CFO realization score is inferred from financing-book movements.',risks='Market turnover, asset-price/credit shocks, collateral liquidity and funding spreads are the economic channels. Source-based realized-trading alternatives are conditional and do not prove a full market cycle; a retained 1-VND discrepancy stays visible.',valuation='Standalone residual-income sensitivities use the exact date-key capital review. Regulatory/distributable capital, trading-cycle persistence and share/action/market compatibility remain prerequisites; provider share counts do not become an approved denominator.'),
 'VIC':dict(health='A complex group requires disclosed borrowing and capital analysis without treating consolidated cash as freely remittable to the parent. NCI and preferred economic claims remain separate from accounting total equity.',growth='High reported revenue/profit growth can coexist with changes in business perimeter, sponsor/disposal events and different common-owner incidence. It is not a measured sustainable per-share growth rate.',cash='Reported CFO and cash acquisition spending show financing and reinvestment demands. Consolidated property/industrial cash cannot be allocated to ordinary-parent shareholders from the headline CFO/NPAT ratio.',risks='Named sponsor/disposal earnings and unresolved tax/preference waterfalls already support the retained high-uncertainty judgment. Positive consolidated profit and available source arithmetic are counterevidence against equating uncertainty with accounting failure.',valuation='No common-earnings midpoint or selected base is invented. Group capital-return crosschecks are not SOTP/RNAV; project cash, debt, minorities and preferred claims require an attributable economic waterfall.'),
 'VHM':dict(health='Borrowings, total equity, receivables, inventory and current liabilities are reviewed in a developer context. Customer advances and project inventory can dominate accounting liquidity; the ratio does not prove realizable project cash.',growth='Handover timing can make annual revenue/profit growth lumpy. Full-year consolidated windows are kept separate from unresolved interim columns; property-sales growth is not converted into an assumed presale/collection pipeline.',cash='Four-year operating cash realization and yearly swings matter more than a single positive FY2025. CFO less acquisition spending is a diagnostic, not normalized owner cash or project RNAV. The source-read termination and investment-transfer income remain separately identified.',risks='Known transaction income, cash-timing volatility, project funding and common-claim incidence materially affect earnings/value precision. Investment transfers may recur as part of development, so removing all such income is a conservative case rather than proven recurring earnings.',valuation='Use the checked closing-column/NCI overlay for accounting parent capital. RNAV requires project economics, completion costs, restrictions, tax/debt and minority waterfalls that are not supplied by an accounting-book multiple.'),
}

TOPIC_GAPS={
 'BQ-EQ':('GROUP_ROE_AVG','GROUP_ROA_AVG','GROSS_MARGIN','REPORTED_NET_MARGIN','Common-owner capital/normalized returns, persistence and cost-of-capital comparison are not proved by reported group returns.'),
 'BQ-MOAT':('REVENUE','GROSS_MARGIN','REPORTED_NET_MARGIN','Economic persistence alone does not identify a durable advantage; customer/competition/barrier evidence is incomplete.'),
 'BQ-CASH':('CUMULATIVE_CFO_REPORTED_NPAT','CFO_REPORTED_NPAT','NOTE_','Complete realization/one-off/working-capital/recognition topics using the sector substitute; a ratio does not finish the band.'),
 'BQ-RES':('DISCLOSED_BORROWINGS_EQUITY','MARGIN_LOANS_EQUITY','LOAN_DEPOSIT','Concentration, pricing power and severe plausible operating stress remain incompletely reviewed.'),
 'FH-BS':('GROUP_EQUITY_ASSETS','BANK_REPORTED_CAR','RESERVES_GROSS_LOANS','FINANCIAL_DEBT_EQUITY','DISCLOSED_BORROWINGS_EQUITY','Complete asset quality, capital/funding resilience and full contractual-debt scope; bank reserves/loans is not NPL coverage.'),
 'FH-LIQ':('CURRENT_RATIO','CASH_AND_EQUIVALENTS','LOAN_DEPOSIT','CASH_FINANCIAL_DEBT','Maturity/covenant/funding concentration and unrestricted liquidity are not established by balance-sheet ratios.'),
 'FH-STRESS':('GROUP_EQUITY_ASSETS','DISCLOSED_BORROWINGS_EQUITY','FINANCIAL_DEBT_EQUITY','LOAN_DEPOSIT','Need source-supported scenario loss, funding response and capital response; no invented stress inputs.'),
 'GQ-HIST':('REVENUE_YOY','NET_INCOME_YOY','BANK_GROSS_CUSTOMER_LOANS_YOY','SECURITIES_MARGIN_LOANS_YOY','Reported trends available; acquisition/perimeter, base-effect and action-adjusted per-share tests remain incomplete.'),
 'GQ-FWD':('POST_ACQUISITION_CASH','BANK_GROSS_CUSTOMER_LOANS','SECURITIES_MARGIN_LOANS','Independent runway, funded reinvestment and execution evidence is required; historical growth is not a forecast.'),
 'GQ-INC':('TOTAL_EQUITY_YOY','TOTAL_ASSETS_YOY','GROUP_ROE_AVG','Need incremental-return attribution, a qualified invested-capital denominator and sector unit economics.'),
 'IC-IND':('REVENUE_YOY','GROSS_MARGIN','Industry barriers, competition, demand and disruption need corroborated industry-level evidence; no new external claims inserted.'),
 'IC-POS':('REVENUE','BANK_GROSS_CUSTOMER_LOANS','SECURITIES_MARGIN_LOANS','Market share, relative cost and distribution advantage are not proved by issuer scale.'),
 'IC-CYCLE':('NET_INCOME_YOY','CFO','NOTE_','A normalized forward cycle asymmetry and survivability review remains incomplete; spot growth is insufficient.'),
 'VAL-PRIMARY':('PARENT_ACCOUNTING_CAPITAL','NOTE_','Conditional models do not qualify normalized common economics, crosscheck and same-cutoff price/share/action basis.'),
 'VAL-RET':('PARENT_ACCOUNTING_CAPITAL','Starting value, distributions, dilution, funded growth and conservative exit evidence do not support a dated expected return.'),
 'VAL-MOS':('PARENT_ACCOUNTING_CAPITAL','DISCLOSED_BORROWINGS_EQUITY','No qualified conservative per-share value and contained impairment downside at a compatible price cutoff.'),
 'RG-GOV':('NOTE_','No completed disclosure/related-party/minority/auditor review; source arithmetic cannot establish governance quality.'),
 'RG-RISK':('DISCLOSED_BORROWINGS_EQUITY','LOAN_DEPOSIT','MARGIN_LOANS_EQUITY','Distinct residual-risk channels and mitigants require a double-count review after category-specific analysis.'),
 'RG-UNC':('CUMULATIVE_CFO_REPORTED_NPAT','NOTE_','Need a substantive future-estimate uncertainty judgment based on source economic alternatives and counterevidence, not data absence.'),
 'CA-REINV':('CASH_CAPEX_REPORTED','POST_ACQUISITION_CASH','Allocation outcomes across capex, acquisitions and divestments are not established by expenditure amounts.'),
 'CA-DIST':('CFO','FUND_ACCRUED','FUND_USED','Retention/distribution policy, buyback valuation and downside resilience have not all been reviewed.'),
 'CA-DIL':('TOTAL_EQUITY_YOY','Issue terms, proceeds and attributable per-share outcomes are incomplete; accounting equity growth does not establish accretion.'),
 'CA-PSV':('NET_INCOME_ATTRIBUTABLE_PARENT_YOY','A comparable action-adjusted, cycle-normalized per-share series is unavailable; aggregate NPAT growth is not per-share compounding.'),
}


def publish_reports(root,out,dossiers,conflicts,rules,inp):
    def write(name,s): (out/name).write_text(s.rstrip()+'\n')
    specs=json.loads((root/'scripts/dfr02-assessments.json').read_text()) if (root/'scripts/dfr02-assessments.json').exists() else {'assessments':[]}
    rulemap={r['id']:r for r in rules};readiness=[];results=[]
    old=json.loads((root/'docs/fundamental-data-engine/dfr-01/2026-11-04/issuers/VIC.json').read_text())
    old_vic=next(r for r in old['rubrics'] if r['rubric']=='RG-UNC')
    for d in dossiers:
        t=d['ticker'];nodes={n['id']:n for n in d['metrics']}
        note_ids=[n['id'] for n in d['metrics'] if n['concept'].startswith('NOTE_') and n['status']=='SUPPORTED']
        for rule in rules:
            prior=t=='VIC' and rule['id']=='RG-UNC'
            spec=next((a for a in specs['assessments'] if a['ticker']==t and a['rubric']==rule['id']),None)
            available=[n['id'] for n in d['metrics'] if n['status']=='SUPPORTED' and n['year']==2025]
            gap=TOPIC_GAPS[rule['id']];concepts=gap[:-1]
            topic_candidates=[n['id'] for n in d['metrics'] if n['status']=='SUPPORTED' and any(n['concept'].startswith(k) for k in concepts)]
            r=dict(ticker=t,rubric=rule['id'],maxPoints=rule['max'],status='NOT_RATED',points=None,band=None,kind='JUDGMENT',newCompleted=False,provisional=True,requiredTopics=rule['topics'],dependencyIds=[],availableMetricIds=topic_candidates,topicReadiness={topic:dict(status='NOT_RATED',candidateMetricIds=topic_candidates,reviewGap=gap[-1]) for topic in rule['topics']},missing=[t+': '+gap[-1]],formalScoringReady=False)
            if prior:
                r.update(status='SUPPORTED',points=old_vic['points'],band=old_vic['band'],assessment=old_vic['assessment'],inheritedFromDfr01=True,missing=[],dependencyIds=['ESTIMATE:VIC'])
            elif spec:
                evidence=[];dependencies=[]
                for topic in rule['topics']:
                    item=spec['topics'][topic]
                    for ref in item['refs']:
                        if ref.startswith('METRIC:'):
                            n=nodes[ref[7:]]
                            if n['status']!='SUPPORTED': raise ValueError('RUBRIC_OPERAND_UNQUALIFIED:'+ref)
                            dependencies.append(n['id'])
                        elif ref=='ESTIMATE:'+t:dependencies.append(ref)
                        elif ref=='STANDALONE_CASH:VNM' and t=='VNM':dependencies.append(ref)
                        else:raise ValueError('UNRESOLVED_ASSESSMENT_REFERENCE:'+ref)
                    evidence.append(dict(topic=topic,refs=item['refs'],rationale=item['rationale']))
                a=dict(subcategory=rule['id'],assessment=spec['band'],selectedPoints=spec['points'],source='AI',analyst='CHATGPT',methodologyVersion='1.0.0',rationale=spec['rationale'],economicChannel=spec['economicChannel'],disconfirmingEvidence=spec['counterevidence'],maximumPrerequisitesMet=False,evidence=evidence)
                validate_partial_assessment(a,rule)
                # A complete preparation can be review-ready without an assigned band.
                if spec.get('challengeAccepted') is not True:
                    r.update(status='READY_FOR_REVIEW',proposedAssessment=a,dependencyIds=sorted(set(dependencies)),missing=['Distinct challenge disposition not completed; no points assigned.'])
                    if 'ESTIMATE:'+t in dependencies and d['estimates']['status']=='CONFLICT':
                        r.update(status='CONFLICT',missing=['Exact common-numerator source conflict affects this candidate estimate; challenge/funding review also remains incomplete. No band/points assigned.'])
                else:
                    r.update(status='SUPPORTED',points=spec['points'],band=spec['band'],assessment=a,newCompleted=True,missing=[],dependencyIds=sorted(set(dependencies)),preparation=dict(actor='CHATGPT',mode='SOURCE_AND_METRIC_REVIEW'),challenge=dict(actor='CHATGPT',mode='SEPARATE_SELF_CHALLENGE_PASS',independentHumanReviewClaimed=False,rationale=spec['challengeRationale'],authenticatedModelSessionId=None))
            readiness.append(r)
            if r['status'] in ('SUPPORTED','READY_FOR_REVIEW','CONFLICT') and (r.get('assessment') or r.get('proposedAssessment')):
                r['topicReadiness']={e['topic']:dict(status=r['status'],refs=e['refs'],rationale=e['rationale']) for e in (r.get('assessment') or r.get('proposedAssessment'))['evidence']}
            if r['status']=='SUPPORTED':results.append(r)
        d['rubrics']=[r for r in readiness if r['ticker']==t]
        # Preserve exact standalone cash source for the one qualified consumer cash review.
        if t=='VNM':
            p='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-underwriting-r4/vnm-parent-owner-cash-input.json'
            v=inp.read(p);d['standaloneCashReview']={'binding':inp.pin(p),'values':v['valuesByYear'],'source':v['source'],'mixedWithConsolidated':False}
        (out/'issuers'/f'{t}.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
    (out/'rubric-readiness.json').write_text(json.dumps(readiness,ensure_ascii=False,indent=2)+'\n')
    (out/'assessment-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
    metric_rows=[];summary=[]
    for d in dossiers:
        t=d['ticker'];n=NARRATIVES[t];scope='STANDALONE' if t=='TCX' else 'CONSOLIDATED'
        lookup={(x['concept'],x['year'],x['scope']):x for x in d['metrics']}
        concepts=['REVENUE','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','TOTAL_ASSETS','TOTAL_EQUITY']
        concepts+=['BANK_NET_INTEREST_INCOME','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS','BANK_REPORTED_CAR','LOAN_DEPOSIT','RESERVES_GROSS_LOANS'] if t=='BID' else ['SECURITIES_MARGIN_LOANS','FINANCIAL_DEBT','MARGIN_LOANS_EQUITY','FINANCIAL_DEBT_EQUITY'] if t=='TCX' else ['CFO','CASH_CAPEX_REPORTED','POST_ACQUISITION_CASH','CFO_REPORTED_NPAT','CURRENT_RATIO','DISCLOSED_BORROWINGS_EQUITY']
        table=['| Metric | FY2022 | FY2023 | FY2024 | FY2025 |','|---|---:|---:|---:|---:|']
        for k in concepts:
            cells=[]
            for y in range(2022,2026):
                m=lookup.get((k,y,scope))
                if not m or m['status']!='SUPPORTED':cells.append('— '+(m['status'] if m else 'MISSING'));continue
                val=number(m['value'])
                cells.append(f'{val/Decimal(10**12):,.3f} T VND' if m['unit']=='CURRENCY' else f'{val:.6f} ×')
            table.append('| '+k+' | '+' | '.join(cells)+' |')
        growth=[]
        for k in ['REVENUE','NET_INCOME','BANK_GROSS_CUSTOMER_LOANS','SECURITIES_MARGIN_LOANS']:
            m=lookup.get((k+'_FY22_25_CHANGE',2025,scope))
            if m and m['status']=='SUPPORTED':growth.append(f'{k}: {number(m["value"])*100:.2f}% FY22→FY25 cumulative change (not CAGR).')
        completed=[r for r in readiness if r['ticker']==t and r['status']=='SUPPORTED']
        named_cases=d['estimates']['conditionalValuationCases']
        cases_text='\n'.join(f'- {c["name"]}: {number(c["equityValueVnd"])/Decimal(10**12):,.3f} T VND; assumptions {json.dumps(c["assumptions"])}; {c["status"]}.' for c in named_cases if c['name'] in ('BEAR','BASE','BULL'))
        if not cases_text:cases_text=f'{len(named_cases)} named conditional capital-return sensitivities are retained with exact case bindings, discount/return-policy/horizon assumptions and invalidation conditions in the dossier; no selected intrinsic-value base is created.'
        parts=[f'## {t} · {SECTORS[t]}','\n'.join(table),' '.join(growth),f'**Financial health.** {n["health"]}',f'**Growth.** {n["growth"]}',f'**Cash/economic realization.** {n["cash"]}',f'**Industry and issuer risks.** {n["risks"]}',f'**Conditional valuation.** {n["valuation"]}',f'Retained conditional equity range: {json.dumps(d["estimates"]["conditionalEquityRange"],ensure_ascii=False)}. No current per-share target or MoS. These ranges are conditional sensitivity estimates, not confidence intervals or fair-value bounds.',cases_text,f'Research bands completed: {", ".join(r["rubric"]+" = "+r["band"]+" ("+str(r["points"])+")" for r in completed) or "none; topic review remains incomplete"}. [Exact dossier](issuers/{t}.json).']
        summary.append('\n\n'.join(parts))
        for m in d['metrics']:
            metric_rows.append(f'| {t} | {m["concept"]} | {m["year"]} | {m["scope"]} | {m["kind"]} | {m["status"]} | {m.get("value") if m.get("value") is not None else "null"} | {m["unit"]} |')
    write('DFR_02_FINANCIAL_SUMMARIES.md','# DFR-02 financial summaries\n\nRESEARCH PROVISIONAL · AS_REVISED · FY2022–FY2025 original reviewed vintages. Display amounts are rounded to trillion VND; exact native values, decimal results and pointers remain in JSON. Ratios shown with ×; CAR 0.0918 × = 9.18%. Estimates are not facts. No investment action.\n\n'+'\n\n'.join(summary))
    write('DFR_02_METRIC_MAPPING.md',f'''# DFR-02 sector metric mapping

Mapping version `{VERSION}`. Exact source record definition, issuer, period, scope, retained PDF hash and page are required. Existing reviewed PDF records take precedence over unreviewed OCR; source-page/period plus explicit caption or reviewed row code locate extraction candidates. Equal amounts never establish mappings. CaféF remains a crosscheck unless template, mode, period, scope and declared unit are qualified; no such numerical fallback is qualified in this run.

Facts reuse the pinned `native-review-sources.json` capture payload's original verified PDF record, with its checked transcription where present. Each node binds both the observation JSON Pointer and the capture payload string plus its inner `/originalCanonicalRecord` pointer. Retained PDF extraction candidates, original values, declared native scales, page boxes and lexical strings remain attached when exact captions/codes resolve. A missing candidate does not erase an existing exact-page verified transcription, and that reuse is explicitly labelled; it is not new visual review or automatic OCR approval.

| Sector | Metrics used | Forbidden substitution |
|---|---|---|
| Technology FPT | reported revenue/margins, average group returns, receivables, CFO, acquisition spending, disclosed borrowing/current ratios | reported CFO/NPAT → normalized owner earnings; capex → maintenance |
| Consumer dairy VNM | group trends and separate standalone cash/tax/fund bridge | standalone numerator with consolidated denominator |
| Bank BID | NII, customer loans/deposits, reserves/gross loans, reported CAR with framework | NII/assets → NIM; reserves/loans → NPL coverage; industrial CFO or debt ratios |
| Securities TCX | margin loans/equity, financing debt/equity, reported group returns and paired trading adjustments | margin-book flows → industrial cash conversion; equity growth → organic per-share growth |
| Complex VIC / developer VHM | reported handover/group growth, CFO variability, disclosed borrowings, exact closing-column/NCI overlays, named earnings adjustments | book capital → RNAV/SOTP; single-year CFO → presale collection quality |

All arithmetic uses Decimal, precision 70. Add/subtract/multiply native scales preserve exact finite decimals. Ratio values round HALF_EVEN to 12 decimals while preserving exact numerator/denominator. Trends use YoY and FY22→FY25 cumulative change, not an approximate-root CAGR. Nonpositive growth bases and missing denominators remain unavailable. Four-year cumulative ratios carry MULTI_YEAR windows; annual and stock observations remain distinct.

Only full calendar-year annual flows and 31 December instant balances are used. `SEPARATE_STANDALONE` is a declared scope alias for STANDALONE; no consolidated/parent inference from file name. Original reviewed vintages form this series, not an asserted latest-restated panel. Known restatement bridges remain attached and a changed vintage invalidates comparability. Interim, quarter, YTD and unresolved columns cannot enter a trend by year-key equality. TCX date keys are accepted through exact source-date identity; VIC/VHM closing columns are accepted only on their exact predecessor reviewed-page overlay.

SUPPORTED means research-supported, never formally admitted. READY_FOR_REVIEW retains a specific review candidate without granting calculation/band authority. REFERENCE_ONLY retains an unqualified reference. CONFLICT blocks only descendants of that node. MISSING preserves unavailable operands. NOT_RATED has null points. Aggregate score/ranking/decision/ledger DTOs are never constructed.

## Exact metric ledger

| Issuer | Concept | FY | Scope | Kind | Disposition | Exact value | Unit |
|---|---|---:|---|---|---|---:|---|
'''+'\n'.join(metric_rows))
    ready_table=['| Issuer | Rubric | Disposition | Points | Missing/review reason |','|---|---|---|---:|---|']
    for r in readiness:ready_table.append(f'| {r["ticker"]} | {r["rubric"]} | {r["status"]} | {r["points"] if r["points"] is not None else "null"} | {"; ".join(r["missing"])} |')
    write('DFR_02_RUBRIC_READINESS.md','# DFR-02 rubric readiness\n\nMetric support is not topic sufficiency. All approved topics and exact M3 bands are retained. No missing→zero, weight redistribution or incomplete total. Exact topic references, rationales and dependency IDs: [readiness JSON](rubric-readiness.json).\n\n'+'\n'.join(ready_table))
    assessment_text=[]
    for r in results:
        a=r['assessment'];assessment_text.append(f'## {r["ticker"]} · {r["rubric"]}\n\n**{r["band"]} · {r["points"]}/{r["maxPoints"]} · SUPPORTED RESEARCH ONLY** · {"new" if r["newCompleted"] else "inherited DFR-01"}\n\n{a["rationale"]}\n\n'+ '\n'.join(f'- **{e["topic"]}:** {e["rationale"]} References: '+', '.join(e['refs']) for e in a['evidence'])+'\n\nCounterevidence:\n\n'+'\n'.join('- '+x for x in a['disconfirmingEvidence'])+'\n\nChallenge: '+r.get('challenge',{}).get('rationale','Prior exact pinned R4 preparation/challenge disposition retained; not renewed formal provenance.'))
    counts=dict(completed=len(results),newCompleted=sum(r['newCompleted'] for r in results),notRated=sum(r['status']=='NOT_RATED' for r in readiness),readyForReview=sum(r['status']=='READY_FOR_REVIEW' for r in readiness),conflict=sum(r['status']=='CONFLICT' for r in readiness),total=138)
    counts['remainingUnscored']=138-counts['completed']
    (out/'rubric-progress.json').write_text(json.dumps(counts,indent=2)+'\n')
    write('DFR_02_ASSESSMENT_RESULTS.md','# DFR-02 partial research assessments\n\n'+json.dumps(counts)+'\n\nAI preparation and a separate self-challenge pass, not independent human review or authenticated formal AI acceptance. Band selection is issuer/topic judgment, never a formula from ratio thresholds.\n\n'+'\n\n'.join(assessment_text))
    new_derived=[m for d in dossiers for m in d['metrics'] if m['status']=='SUPPORTED' and m['kind']=='DERIVED_METRIC' and not m.get('existingDfr01Metric')]
    facts=[m for d in dossiers for m in d['metrics'] if m['status']=='SUPPORTED' and m['kind']=='REPORTED_FACT']
    progress=dict(dfr01=dict(supportedFinancialMetricInstances=4,completedResearchRubrics=1,notRatedRubrics=137),dfr02=dict(newSupportedDerivedMetricInstances=len(new_derived),newDerivedMetricConcepts=sorted({m['concept'] for m in new_derived}),newlyResearchSupportedFactInstances=len(facts),existingSupportedCapitalMetrics=4,newCompletedResearchRubrics=counts['newCompleted'],completedResearchRubrics=counts['completed'],notRatedRubrics=counts['notRated'],readyForReviewRubrics=counts['readyForReview'],conflictingRubrics=counts['conflict'],remainingUnscored=counts['remainingUnscored']),countingPolicy='Instances = issuer × concept × period × scope; concepts counted separately. Reused source values are not newly admitted accounting facts. No synthetic score totals.')
    (out/'progress-vs-dfr01.json').write_text(json.dumps(progress,indent=2)+'\n')
    issues=[
     dict(id='DFR02-MAJ-01',severity='Major',issuers=['VHM'],state='EXACT_OVERLAY_RESOLVED_EXTRACTION_REMAINS_CONFLICT',finding='NCI extraction 11137.640 versus verified 11137640 in million VND; original bytes preserved.',nextAction='Keep raw candidate blocked; use only the exact pinned closing-page overlay for corrected accounting capital.'),
     dict(id='DFR02-MAJ-02',severity='Major',issuers=['VIC','VHM'],state='BOUNDED_CLOSING_OVERLAY_ONLY',finding='Unresolved closing-column extraction keys cannot qualify an entire statement by calendar-year inference.',nextAction='Review only needed additional source columns with exact page/cell/scope bindings; no generic unresolved→annual relabel.'),
     dict(id='DFR02-MAJ-03',severity='Major',issuers=['FPT','VHM'],state='OPEN',finding='Restated/changed source-hash bindings for certain FY2025 assets, liabilities and receivables remain READY_FOR_REVIEW; dependent ratios/growth withheld.',nextAction='Reconcile retained source-vintage/caption bridges; do not substitute original or prior-year balances silently.'),
     dict(id='DFR02-MAJ-04',severity='Major',issuers=list(PILOT),state='OPEN_PROVIDER_FALLBACK_BLOCKED',finding='CafeF provider units/scope/template quality remain unqualified; zero clusters and mode mismatches cannot fill PDF gaps.',nextAction='Qualify exact provider dimensions before numerical fallback; reference raw pointers remain available.'),
     dict(id='DFR02-MAJ-05',severity='Major',issuers=list(PILOT),state='OPEN',finding=f'{counts["remainingUnscored"]}/138 rubrics remain unscored: {counts["notRated"]} NOT_RATED, {counts["readyForReview"]} READY_FOR_REVIEW, {counts["conflict"]} CONFLICT.',nextAction='Complete issuer/topic economic evidence and counterevidence. Preserve null points and full approved weights.'),
     dict(id='DFR02-MAJ-06',severity='Major',issuers=list(PILOT),state='OPEN_FORMAL_ACCEPTANCE_SEPARATE',finding='Same-cutoff share/action/price basis, common economic claims, primary model qualification and authenticated formal execution/DI acceptance remain incomplete.',nextAction='Keep per-share/MoS/total/ranking/decisions blocked. Project RNAV, bank capital and parent cash need sector-specific review.'),
     dict(id='DFR02-MIN-01',severity='Minor',issuers=['TCX'],state='OPEN_EXACT_SOURCE_CONFLICT',finding='Printed common EPS numerator 5683331855109 versus retained common reference 5683331855108 differs by 1 VND.',nextAction='Resolve the printed common-numerator path; preserve separately reviewed standalone total NPAT and capital rather than globally blocking the issuer.'),
     dict(id='DFR02-MIN-02',severity='Minor',issuers=['VNM'],state='OPEN_LOCATOR_GRANULARITY',finding='Reviewed standalone input supplies exact value JSON Pointers plus a source-page bundle; not every field has a separately qualified page/box.',nextAction='Improve field-specific page/box locators before formal handoff; do not claim new full-page visual review.')
    ]
    (out/'issues.json').write_text(json.dumps(dict(critical=0,major=6,minor=2,scope='DFR-02 partial research readiness, not a restatement of historical release severity',issues=issues),indent=2)+'\n')
