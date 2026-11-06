"""Write the bounded owner package and hash manifest after actual validation."""
import json,re
from collections import Counter
from pathlib import Path
from lib.dfr05_ssi_v4 import *
OUT=ROOT/REL

def read(p):return json.loads((OUT/p).read_text())
def md(name,text):(OUT/('DFR_05_P2_4_SSI_'+name+'.md')).write_text(text.strip()+'\n')
def finalize():
 d=read('dossier.json');metrics=d['metrics'];counts=Counter(m['status'] for m in metrics);kinds=Counter(m['kind'] for m in metrics if m['status']=='SUPPORTED');receipts=read('validation-receipts.json')
 if len(receipts['records'])!=4 or any(r['exitCode'] for r in receipts['records']):raise ValueError('ACTUAL_VALIDATION_REQUIRED')
 if read('boundary-results.json')['probes']!=9 or read('parity-results.json')['status']!='PASS':raise ValueError('BOUNDARY_PARITY')
 test_count=int(re.search(r'Ran (\d+) tests',receipts['records'][1]['stderr']).group(1))
 summary=dict(unitTestsPassed=test_count,productionRejectionProbes=9,classification='RESEARCH_PROVISIONAL',baselineCommit=BASELINE,implementationCommit=None,implementationState='UNCOMMITTED',scope='CONSOLIDATED',years=[2022,2023,2024,2025],metricCount=len(metrics),counts={s:counts[s] for s in ['SUPPORTED','MISSING','CONFLICT','REFERENCE_ONLY']},supportedKinds=dict(kinds),rubrics=23,scored=0,rubricDispositions=dict(Counter(r['eligibility'] for r in d['rubrics'])),engineeringDefects=dict(Critical=0,Major=0,Minor=0),researchEvidenceIssues=dict(Critical=0,Major=4,Minor=0),governanceLimitations=['No scoring, valuation or production authority','Publication dates and historical availability remain unknown'],recommendation='PASS WITH CONDITIONS',financialResearchAcceptance=False)
 (OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
 common=f'''Baseline `{BASELINE}`. Implementation: **uncommitted**. SSI only; RESEARCH_PROVISIONAL, productionAdmissible=false, scoringAuthorized=false. All 23 rubrics have null points/band/assessment; categoryScores/totalScore/ranking/valuation remain null. No external acquisition or production mutation.
'''
 md('IMPLEMENTATION_REPORT',f'''# SSI implementation report
{common}
Versioned exact-tuple dispatch validates stable SSI identity, approved dated universe hash, M3 SECURITIES route and independently qualified CONSOLIDATED scope before financial reads. P1 adapter traversal, dependency propagation and DFR02 Decimal calculations are composed without changing predecessor kernels. New bindings are in `scripts/lib/dfr05_ssi_bindings_v4.json`.

{len(metrics)} metric objects: {counts['SUPPORTED']} supported ({kinds['REPORTED_FACT']} reported facts; {kinds['DERIVED_METRIC']} derived), {counts['MISSING']} missing, {counts['CONFLICT']} conflict, {counts['REFERENCE_ONLY']} reference-only. Historical investigative evidence and provider references remain explicitly reference-only outside this metric count.

Run `python3 scripts/validate-dfr05-ssi.py` to rebuild and validate the new SSI package. Run `python3 scripts/finalize-dfr05-ssi.py` to seal the resulting package. Then run `python3 scripts/build-dfr05-ssi.py --verify` for a read-only recomputation/seal check. The verify guard accepts the approved commit or a descendant through git ancestry plus exact protected-byte/code/output/source pins; it does not require HEAD to equal the pre-implementation commit. No committed-descendant execution is claimed while this implementation is uncommitted.

Only new SSI files are written. The before fingerprint covers {len(read('protected-before.json'))} baseline tracked/data files and checks the exact data-file inventory, including database/sidecars.
''')
 md('SCOPE_QUALIFICATION',f'''# SSI reporting scope qualification
{common}
Retained document-level review qualifies consolidated VND statements for each FY2022–FY2025 calendar year. Scope gate requires reviewed document hash, currency and native CURRENCY unit. `scopeQualification.json` retains review records, unknown publication dates and historical paths alongside current byte-identical PDF paths. TCX standalone assumptions are not inherited.

Prior original-image review is reused for 26 core financial facts; this is distinguished from new direct page-image review of FY2025 physical pages 10, 14, 16 and 17. The latter qualifies 29 additional current-column facts; source hash, page, exact row/caption, year, current versus restated-comparative column and native VND are recorded in versioned bindings. Historical alternative FY2025 UNKNOWN-unit and interim evidence stays outside the selected annual scope.

FY2024 parent profit 2,704,221,369,052 VND is RESTATED. The native assembly's ORIGINAL flag is not allowed to erase the canonical revision. No same-PDF shortcut or implicit revision bridge is used. A narrowly qualified bridge now permits FY2025 parent earnings growth: source hash, physical page17, row201, current FY2025 and restated comparative FY2024 columns, exact values, full annual periods, scope and VND unit are bound explicitly in revisionBridges. Original/restated source metadata is preserved; only a calculation view uses this exact cohort. No broader revision override is allowed. Group NPAT is not substituted for parent profit.

Client cash 8,393,795,223,327 VND and related client payables 8,328,556,709,625 VND are separate off-balance concepts from corporate cash/equivalents 3,646,492,763,118 VND. The 9,177,825,490,000 VND custody figure is explicitly an untraded-custody component, not total custody or recognized shareholder assets. Client VSDC margin cash is also separate. Pledged deposits are not assumed to be the complete restricted-cash population. Unrestricted corporate liquidity remains MISSING.
''')
 table='| Concept | FY2022 | FY2023 | FY2024 | FY2025 |\n|---|---:|---:|---:|---:|\n'
 for c in ['TOTAL_ASSETS','TOTAL_EQUITY','CASH_AND_EQUIVALENTS','FINANCIAL_DEBT','SECURITIES_MARGIN_LOANS','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','FINANCIAL_DEBT_EQUITY','MARGIN_EQUITY','GROUP_ROE_AVG']:
  table+='| '+c+' | '+' | '.join(next((m['value'] if m['value'] is not None else m['status'] for m in metrics if m['concept']==c and m['year']==y),'MISSING') for y in range(2022,2026))+' |\n'
 md('METRIC_COVERAGE',f'''# SSI financial metric coverage
{common}
Amounts below are exact VND; ratios are fractions rounded to 12 decimal places HALF_EVEN, with exact numerator/denominator in the dossier.

{table}
SSI margin lending grows substantially faster than equity across the retained years. FY2025 gross margin lending is 38,616,232,016,646 VND; customer advances are not included. Financial borrowings are 60,160,501,864,584 VND against equity 32,066,318,460,762 VND. These balances establish funding and collateral exposure, not a stress-tested solvency conclusion. Reported corporate cash is not certified unrestricted liquidity.

FY2025 operating revenue is 12,930,736,690,184 VND, including brokerage 2,344,721,484,003 VND and loan/receivable interest 3,562,009,243,140 VND. The latter is not labelled margin-only interest. Gross FVTPL gains 6,160,760,603,213 VND and losses 3,081,274,818,853 VND remain separately identified, including realized/unrealized asset and warrant components. Their paired difference is a reported diagnostic, not normalized recurring income. Components are never added to revenue a second time. Reported result/revenue includes financing and administration and is labelled accordingly.

FY2022 lacks a qualified opening 2021 capital denominator, so average-return diagnostics begin FY2023. Missing historic revenue components, full HTM population, restricted/unrestricted funds, collateral obligations, bonds, NCI capital and sustainable common earnings remain explicit. No industrial FCF, inferred bonds-zero, inferred share count or valuation is generated.

`metricReconciliation.json` records an authoritative observation or operand lineage for every supported metric, definition-matched extraction candidates, available notes and provider references. Combined JSON is pinned and inventoried as a representation, not independent authority. CaféF unknown units/scope/revisions remain reference-only; no numeric-agreement unit inference. Full candidate and raw JSON are retained in their original paths rather than copied.
''')
 md('DEPENDENCY_VALIDATION',f'''# SSI dependency validation
{common}
`dependencyGraph.json` links hash-pinned PDFs → bound observations → financial facts → derived metrics → topic context → all 23 rubric dispositions. Financial context cannot grant full-topic qualification. Graph validation rejects cycles, dangling edges and cross-issuer additions.

`conflict-injection-results.json` records actual controlled overlays for margin lending, financial borrowings, customer cash and parent NPAT FY2025. Each receipt lists every affected and unaffected graph node and a mutated-copy hash. Expected reachability is independently computed by fixed-point closure. Original inputs and dossier remain unchanged. Customer cash affects liquidity readiness only through explicit context; it cannot affect group ROA, corporate cash/debt or shareholder capital. Parent profit does not contaminate group-profit return diagnostics.

The negative revision fixture deliberately uses one PDF with different before/after column cohorts and rejects compatibility. Original/restated metadata is never replaced merely because source hashes match.
''')
 md('PARITY_VALIDATION',f'''# SSI predecessor parity
{common}
PASS: exact P1 full metric/provider/rubric objects and sealed bytes preserve 789 metrics, 25 completed assessments and 113 deferred dispositions. ACB preserves all 92 metrics, 85 supported, 7 missing and 23 deferred; canonical core `5c1accb54b0373ba8beaf097d3fc4d9d8b758104054b259d1dfc3c69c599f09f`.

P2.3 full canonical dossier/inventory/projection/graph/gap/conflict cores match all four approved hashes. CTG 145/115/22/8; MBB 145/121/24/0; TCB 145/123/22/0; VCB 128/90/28/10 (total/supported/missing/conflict). All retain 23 deferred rubrics and zero new scores. See `parity-results.json` for per-issuer hashes.

Every predecessor manifest file and implementation pin and source pin is checked. Protected full-file fingerprints and exact data inventory pass. Approved M1–M8, masters, database and authority files are included; no baseline repair or resealing occurred. Two fresh SSI replay core hashes and identical source-pin-set hashes are in `determinism.json`.
''')
 md('BOUNDARY_VALIDATION',f'''# SSI boundary validation
{common}
PASS: all 9 actual direct/nested probes rejected: scorer, ranking root, ranking nested card, decision, monthly DCA command, NAV request, ledger transaction builder, DI acceptance and AI provenance. See `boundary-results.json` for exact entrypoints and reasons. These checks establish dossier rejection, not immunity to arbitrary transformed authenticated inputs.

Actual commands, Python/Node runtime versions, exit codes, stdout/stderr and unittest totals are in `validation-receipts.json`. Authority verification was executed read-only. The SSI test suite covers authorization, scope/period/unit/revision, raw Decimal replay, segregation, missing/null/zero, graph consistency, conflict locality, predecessor full parity and fresh deterministic replay. Whole-repository test/lint/release acceptance is outside this bounded validation; no such PASS is claimed.
''')
 rubric='| Rubric | Disposition | Exact remaining dependency |\n|---|---|---|\n'+''.join('| '+r['rubric']+' | '+r['eligibility']+' | '+r['missingEvidence']+' |\n' for r in d['rubrics'])
 md('FINAL_REVIEW',f'''# SSI final owner review
{common}
**PASS WITH CONDITIONS for bounded engineering delivery; financial research acceptance remains pending.** {len(metrics)} financial objects: {counts['SUPPORTED']} supported ({kinds['REPORTED_FACT']} reported / {kinds['DERIVED_METRIC']} derived), {counts['MISSING']} missing, {counts['CONFLICT']} conflict metrics, {counts['REFERENCE_ONLY']} reference-only metric objects. Reference evidence is separately preserved. 23/23 readiness dispositions, zero scores.

Engineering defects: Critical 0 / Major 0 / Minor 0 found in executed bounded checks. Research-evidence issues: Critical 0 / Major 4 / Minor 0. The former FY2024/FY2025 parent-profit compatibility blocker is closed by the explicit row201 column bridge. This is not a claim that absent research evidence is an engineering failure.

| Issue | Severity / owner | Resolution and acceptance / stop |
|---|---|---|
| Incomplete funding/maturity/collateral/regulatory and unrestricted-funds qualification | Major / securities analyst | Qualify remaining retained notes against exact scope/period/units and segregation; no liquidity/stress rating until complete. |
| Incomplete historical revenue/trading/common-capital and action-adjusted outcomes | Major / securities analyst | Bind historic captions and common-owner/action bridges; no normalized/per-share assessment before qualification. |
| Qualitative moat, competition, governance and cycle topic evidence unqualified | Major / research lead | Qualify each full approved topic under existing source authority; request separate authority if genuinely new sources needed. No scoring in this task. |
| Valuation cutoff, compatible price/share/actions and economic assumptions not approved | Major / owner | Separate explicit owner decisions and qualified compatible evidence; all valuation remains deferred. |
| FY2024 restated parent / FY2025 original growth cohort | CLOSED / data reviewer | Exact row201 current and restated comparative columns qualified; growth supported, original metadata preserved; negative mismatched-operand test rejects. |

Governance: publication dates/historical availability remain unknown. No AS_KNOWN claim, production acceptance or additional issuer authorization is implied. P1/ACB/P2.3 full parity, two fresh replays, protected fingerprints and 9 production rejection probes pass; exact process receipts are attached.

{rubric}
Owner decision requested: review/accept this SSI research engineering package and its documented limitations. STOP here. No next batch, new source acquisition, rubric scores, valuation, ranking, transactions, database writes or production activation.
''')
 scripts=['scripts/lib/dfr05_ssi_v4.py','scripts/lib/dfr05_ssi_bindings_v4.json','scripts/build-dfr05-ssi.py','scripts/test-dfr05-ssi.py','scripts/validate-dfr05-ssi.py','scripts/verify-dfr05-ssi-boundaries.mjs','scripts/finalize-dfr05-ssi.py']
 manifest=dict(schema='dfr05-ssi-manifest-v4',baselineCommit=BASELINE,canonicalHashSemantics='SHA256 canonical sorted UTF8 JSON excluding contentHash',files={str(p.relative_to(OUT)):p1.sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name not in ('manifest.json','read-only-verification.json')},implementation={p:p1.sha(ROOT/p) for p in scripts},excludedReceipts=['read-only-verification.json: post-seal read-only process receipt; no source or result authority'])
 manifest['contentHash']=p1.digest(manifest);(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(summary))
if __name__=='__main__':finalize()
