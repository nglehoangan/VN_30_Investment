"""Seal the observed DFR04 review receipts; no production operations."""
import json,hashlib,importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('dfr04',Path(__file__).with_name('build-dfr04.py'));d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d)
s=d.check();out=d.OUT;summary=d.load('summary.json');matrix=d.load('completion-matrix.json');evidence=d.load('evidence-map.json');ready=[]
for t in d.PILOT:
 topics={topic for e in evidence['qualified'] if e['ticker']==t for topic in e['qualifiedTopics']}
 for r in d.rules():
  if set(r['topics']).issubset(topics):
   row=next(x for x in matrix if x['id']==t+':'+r['id']);assert row['status']=='COMPLETED_RESEARCH';ready.append(row['id'])
assert d.load('boundary-results.json')['probes']==54
# These command results were observed in this execution, not simulated by this sealing script.
results=dict(status='PASS',sealedAt=d.now(),observedCommands=[
 dict(command='python3 scripts/test-dfr04.py',tests=20,exitCode=0,result='OK',durationSeconds='13.583'),
 dict(command='python3 scripts/test-dfr02.py',tests=25,exitCode=0,result='OK',durationSeconds='9.305'),
 dict(command='python3 scripts/test-dfr03.py',tests=17,exitCode=0,result='OK',durationSeconds='8.126',timing='Predecessor regression executed before DFR04 export files were written; original closed-set fingerprint assertion passed at that time. Final unchanged existing bytes verified independently by DFR04 protected snapshot.'),
 dict(command='/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/verify-dfr04-boundaries.mjs',probes=54,exitCode=0,result='PASS'),
 dict(command='/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/verify-approved-scoring-authority.mjs',exitCode=0,result='PASS',authorityHash='8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1',artifacts=37,historicalFilesUnchanged=133,compatibilities=9)],
 allRecoveredTopicReadyAssessed=ready,protectedFileCount=len(s['protectedBefore']),protectedStatus='UNCHANGED',financialParity='PASS',newFinancialMetrics=0,changedFinancialMetrics=0,materialSourceConflicts=0,minorSourceConflict='TCX:PRINTED_COMMON_NUMERATOR:1_VND',selfChallengeNotIndependentAcceptance=True,productionReleaseAcceptanceClaimed=False)
d.dump('validation-results.json',results)
validation='''# DFR-04 Validation

**PASS for this bounded research package.** Whole-production release acceptance is not claimed.

| Check | Observed result |
|---|---|
| DFR04 suite | 20/20 PASS |
| DFR02 regressions | 25/25 PASS |
| DFR03 regressions | 17/17 PASS, executed before new DFR04 exports |
| Real production entry-point rejection probes | 54/54 PASS across all six dossiers |
| Six issuers / exact unique rubric instances | 6 / 138 |
| All recovered, qualified-topic-ready instances assessed | 7/7 |
| Four previously analyst-pending instances | 4/4 completed first |
| Inherited seven assessments | Exact points, band and assessment objects preserved |
| FY22–25 financial parity | Exact DFR02 metric hashes and source pins unchanged |
| Missing-as-zero / invented band / wrong-topic evidence | Rejected |
| Conflict propagation | A changed VIC86 dependency blocks VIC cash only, not its distinct residual-risk judgment |
| TCX conflict materiality | 1 VND remains MINOR; no issuer-wide MATERIAL_CONFLICT |
| Decimal/source column integrity | Native decimal strings; VIC86 and VHM20 current/prior exceptions checked |
| Approved authority | 37 artifacts, 133 historical files, 9 compatibilities PASS |

Protected fingerprints cover **9755 existing files** across src/app/prisma/config/docs/data and prior scripts, including every retained data file and SQLite/sidecars present at inspection. All existing bytes remain unchanged. New DFR04 docs/scripts are outside that before-set. The older DFR03 test has a closed-set directory assertion; its successful regression run preceded the new exports. DFR04 performs the final before/after comparison and verifies old source/export hashes directly, rather than editing predecessor receipts to accommodate new research files.

Tests retain the DFR02 bank/securities/technology/consumer/property distinctions, FY22–25 annual/scope/unit comparability, VHM NCI, VIC closing-column, TCX date keys, unknown CaféF units, HPG zero-cashflow fixture, and source-to-dependent-metric/rubric propagation. DFR04 adds actual source-pointer checks, topic qualification rejection, original-column exceptions, first-batch ordering, inherited judgment preservation, all deferred resolution paths and null totals.

Distinct real inspect → prepare → challenge → finalize invocations have increasing timestamps and hash-bound input/specification references. Challenge is a separate ChatGPT self-review; it is not authenticated independent human acceptance. Keyword candidates are not qualified by a boolean bulk promotion. No market share, governance quality, missing financial metric, quote, share denominator or original publication date is invented.

Production tests exercise scorer, root/nested ranking, decision, DCA review, NAV request, ledger builder, DI acceptance and AI provenance. Actual research dossiers are rejected. This verifies these existing entry points against the submitted shapes; it is not a proof against adversarial transformations. No runtime admission path, database connection or source promotion is introduced by the research builder.

Machine receipts: [validation-results.json](validation-results.json), [boundary-results.json](boundary-results.json), [financial-parity.json](financial-parity.json), [inspection.json](inspection.json), [phase preparation](preparation.json), [challenge](challenge.json). Final manifests hash review artifacts and new scripts; source pins include all predecessor inputs and outputs.
'''
(out/'DFR_04_VALIDATION.md').write_text(validation)
lines=['# DFR-04 Final Review','**RESEARCH_PROVISIONAL — PENDING OWNER APPROVAL.** Work stops here. No automatic DFR05, expansion or production activation.',
'| Measure | DFR03 | DFR04 |\n|---|---:|---:|\n| Completed research rubrics | 7/138 | **14/138** |\n| Newly completed | — | **7** |\n| Analyst-pending batch resolved | — | **4/4** |\n| NOT_RATED | 131 | **124** |\n| Complete issuer scorecards | 0 | **0** |\n| Financial metric modifications/new metrics | — | **0/0** |\n| Formal acceptance / production activation | 0 | **0** |',
'New exact M3 judgments: FPT RG-UNC **0/2 High uncertainty**; TCX BQ-CASH **3/6 Adequate realization with material qualifications**; VIC BQ-CASH **2/6 Weak realization with recurring adverse adjustments**; VHM BQ-CASH **2/6 Weak realization with recurring adverse adjustments**; VIC RG-RISK **0/4 HIGH**; VNM IC-IND **2/4 Mixed/cyclical/average**; VNM RG-RISK **1/4 ELEVATED_WEAK**. Zero points here express supported economic uncertainty/risk, never missing information. All seven predecessor judgments remain unchanged. No category or total score is computed.',
'| Issuer | Completed / 23 | Remaining |\n|---|---:|---:|']
for t in d.PILOT:
 n=sum(x['status']=='COMPLETED_RESEARCH' for x in matrix if x['ticker']==t);lines[-1]+=f'\n| {t} | {n} | {23-n} |'
lines += ['The unresolved count falls by 7; 124 instances now have explicit classification, candidate locators, topic dependencies, resolution product and owner. **66 EXISTS_MAPPING_INCOMPLETE; 6 EXISTS_ANALYST_JUDGMENT; 22 GENUINELY_ABSENT within the bounded qualified corpus; 30 VALUATION_MARKET_DEPENDENCY; 0 MATERIAL_CONFLICT.** These are completion blockers, not 124 missing physical files. “Analyst judgment” for governance does not claim sufficient qualified evidence for all four topics; minority/auditor/terms evaluation remains explicitly unresolved.',
'67 retained note-document variants, 3753 candidate pages and 249 prior issuer JSON artifacts were indexed/pinned. Fifteen original PDF exception pages were visually checked. Seven recovered topic-complete instances were assessed and separately challenged. The retained VNM annual report adds actual industry structure, risk responses and audit-committee counterevidence; attributed outside studies were not independently retrieved. VNM IC-CYCLE moves to mapping-incomplete because cycle/asymmetry evidence exists but survivability is not topic-qualified. No other new rubric has all required topics qualified in this map; raw candidate existence is insufficient. The search does not establish that all retained pages have exhausted their analytical potential.',
'Financial parity and lineage pass. 20 DFR04 tests, 25 DFR02 tests, 17 pre-export DFR03 regressions and 54 production rejection probes passed; authority verifies unchanged. Final DFR04 fingerprints verify 9755 existing files unchanged, including retained sources/database. Exact phase/source receipts and timing limits are in validation. No independent-human or whole-release PASS claim is made.',
'**Source exceptions:** original pages resolve VIC FY25 disposal/writeoff loss to 2,994,348 million VND and VHM FY25 investment-gain cash adjustment to −28,111,513 million VND; OCR text ordering is not used. No DFR02 supported metric is modified. TCX 1 VND common-numerator discrepancy remains a **minor** source conflict on exact estimate references, not a material issuer-wide problem. No new material financial source conflict was identified.',
'**Valuation limitations remain issuer-specific:** FPT FTEL annual cash/scope; VNM recurring owner cash/reinvestment; BID distributable/regulatory capital; TCX printed common numerator plus recoverable capital/full-cycle returns; VIC sponsor/tax/NCI/EV funding waterfall; VHM project RNAV, partner/restricted funds and NCI allocation. All require a coherent price/share/action/cutoff basis and explicit economic assumptions. Existing scenario references are not accepted intrinsic values or return forecasts.',
'**Issues:** Critical 0; Major **3 open** root blockers (comparative/nonfinancial source scope, sector contractual/outcome reconciliation, valuation binding); Minor **1 open** TCX exact 1 VND reconciliation and **1 resolved** OCR column-order issue. These research severities do not supersede existing production release gates.',
'**Owner decision requested:** approve/amend the seven provisional bands and choose whether to authorize the finite resolution products in [escalated blockers](DFR_04_ESCALATED_BLOCKERS.md): a dated six-issuer comparative evidence pack/source-scope amendment, sector obligation/asset-quality/outcome schedules from retained sources, and one chosen valuation cutoff/assumption set. Alternatively retain the affected 124 rubrics as NOT_RATED. No same-file resubmission is requested and no successor phase is started.',
'Deliverables: [Evidence recovery](DFR_04_EVIDENCE_RECOVERY.md), [Batch assessments](DFR_04_BATCH_ASSESSMENTS.md), [138-instance completion matrix](DFR_04_RUBRIC_COMPLETION_MATRIX.md), [Escalated blockers](DFR_04_ESCALATED_BLOCKERS.md), [Validation](DFR_04_VALIDATION.md), this final review. Machine results: [summary](summary.json), [matrix](completion-matrix.json), [qualified evidence map](evidence-map.json), [source inventory](source-inventory.json).',
'No source/accounting admission, production scoring, ranking, portfolio, decision/DCA, NAV or ledger change. No commit, push or deployment. Stop for owner approval.']
(out/'DFR_04_FINAL_REVIEW.md').write_text('\n\n'.join(lines)+'\n')
# Recurrence is documented across the three predecessor review cycles, not inferred from missing filenames.
registry=[]
for ident,severity,action in [
 ('E1','MAJOR','Owner approve/amend one finite comparative industry/business and governance/minority evidence pack with named allowed sources, or explicitly retain dependent rubrics NOT_RATED.'),
 ('E2','MAJOR','Owner assign one bounded six-issuer contractual/asset-quality/action/cohort reconciliation from retained sources; close each undisclosed field explicitly instead of another generic phase.'),
 ('E3','MAJOR','Owner choose one research cutoff and approve explicit model assumptions; bind verified price/action/share and normalized common inputs before any valuation bands.'),
 ('E4','MINOR','Reconcile TCX printed common numerator and exact source operands; preserve immutable estimates as conflicted references until exact resolution.')]:
 affected=[x['id'] for x in matrix if x.get('deferred') and (x['deferred']['resolutionPath']==ident or (x['deferred'].get('sourceConflict') or {}).get('resolutionPath')==ident)]
 registry.append(dict(id=ident,severity=severity,status='OPEN',predecessorReviewCycles=['DFR01','DFR02','DFR03'],affectedRubricIds=affected,concreteResolutionOrDecision=action,nextPhaseAutomaticallyAuthorized=False))
registry.append(dict(id='E5',severity='MINOR',status='RESOLVED_LOCALLY',affectedRubricIds=['VIC:BQ-CASH','VHM:BQ-CASH'],resolution='Original PDF current/prior column review; observations separately bound, no source rewrite.'))
d.dump('escalated-blockers.json',registry)
# Explicit review seal, not formal approval or production authority.
files={str(p.relative_to(out)):d.sha(str(p.relative_to(d.ROOT))) for p in sorted(out.rglob('*')) if p.is_file() and p.name not in ['manifest.json','final-review-manifest.json']}
d.dump('manifest.json',dict(status='PENDING_OWNER_APPROVAL',classification='RESEARCH_PROVISIONAL',outputs=files,productionAuthority=False))
scripts={str(p.relative_to(d.ROOT)):d.sha(str(p.relative_to(d.ROOT))) for p in sorted((d.ROOT/'scripts').rglob('*dfr04*')) if p.is_file() and '__pycache__' not in p.parts}
d.dump('final-review-manifest.json',dict(status='PENDING_OWNER_APPROVAL',files={**files,'manifest.json':d.sha(d.REL+'/manifest.json')},scripts=scripts,approvalGranted=False))
print(json.dumps(dict(status='SEALED_REVIEW_CANDIDATE',outputFiles=len(files),scripts=len(scripts),summary=summary)))
