"""Two fresh bounded executions, real entry-point tests and content-hash manifest."""
import importlib.util
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from collections import Counter
from datetime import datetime,timezone
from lib.dfr05_acb_v2 import *

spec=importlib.util.spec_from_file_location('acb_builder',ROOT/'scripts/build-dfr05-acb.py')
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
NODE=os.environ.get('DFR05_NODE_BINARY','node')


def execute(command):
    result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True)
    found=re.search(r'Ran (\d+) tests',result.stderr)
    receipt=dict(command=command,exitCode=result.returncode,tests=int(found.group(1)) if found else None,stdout=result.stdout,stderr=result.stderr)
    b.write('last-command-receipt.json',receipt)
    if result.returncode:raise RuntimeError(json.dumps(receipt,ensure_ascii=False))
    return receipt


def reports(summary,validation):
    d=b.read(b.OUT/'ACB.json');ms=d['metrics'];by={(m['concept'],m['year']):m for m in ms}
    def write(name,lines):(b.OUT/name).write_text('\n'.join(lines)+'\n')
    write('DFR_05_P2_2_ACB_IMPLEMENTATION_REPORT.md',[
      '# DFR-05 P2.2-ACB-01 implementation', '',
      f'Baseline/HEAD: `{BASELINE}`. Working-tree implementation is uncommitted; no new commit SHA is claimed. Owner request explicitly authorizes ACB only. Implementation acceptance remains PENDING_OWNER_REVIEW.', '',
      f'Universe: 2026-11-05-v1, reference date 2026-11-05, canonical hash `{UHASH}`. Stable ACB security ID `{ACB.securityId}`. New dispatcher authorization requires the complete stable identity + BANK approved M3 sector + BANK economic subtype + CONSOLIDATED qualified financial reporting scope. It denies every other tuple before source access.', '',
      'New implementation: scripts/lib/dfr05_acb_v2.py; builder: scripts/build-dfr05-acb.py; tests: scripts/test-dfr05-acb.py; boundary probes: scripts/verify-dfr05-acb-boundaries.mjs; finalizer: scripts/finalize-dfr05-acb.py. Sealed DFR02/P1 files, pilot constants, financial facts, bands and weights were not edited. The BANK recipe uses real ACB identities and composes original DFR02 Graph.add/fact/derive and original P1 adapter traversal, raw Decimal checks and dependency edge/affected semantics. No BID execution, ID replacement or pilot-guard bypass occurs.', '',
      'Four retained source structures were actually traversed: manual PDF display, full-page notes, CaféF display/raw JSON and combined display. Source inventory reports full available row/page counts and original dimensions. Export materializes dependency rows and distinct period/scope/unit/state/mode witnesses; it does not duplicate the whole retained history. Presence never qualifies a financial operand. PDF native review is preferred; CaféF remains a raw-hash/pointer-checked reference with unknown units left unknown. Combined JSON remains a presentation candidate.', '',
      'The retained native source records carry original normalized VND operands, review flags, original revision, reviewed scope and source hashes. ACB-01 additionally checked original PDF financial pages7/8/10 and loan-reserve notes50/50/52/51 for FY2022/23/24/25 because display extraction omits page8 balances and some total rows, and the reserve definition required reconciliation. Direct review is by the implementing agent, not an independent human. Full historical OCR reconstruction is not claimed; no deleted readers or new sources were acquired.', '',
      'Specific/general reserve components are distinct reported facts; their sum is explicitly a derived aggregate. The four retained aggregates are preserved in value and source audit, with their narrower definition recorded. Regulatory CAR/CET1 are reported percentage conversions, not accounting-derived capital. Regulatory consolidation and TT41 versus TT14 frameworks stay separate from accounting scope; no across-framework CAR growth is generated.', '',
      'All new rubric points, bands, assessments, categoryScores, totalScore, ranking, signal and valuation remain null. All output is RESEARCH_PROVISIONAL; productionAdmissible=false and scoringAuthorized=false. No new qualitative evidence, source authority, share count, publication date or owner economic assumption is invented.', '',
      'Reproduce: set DFR05_NODE_BINARY to an installed repository-supported Node >=22.23.2 <23; run `python3 scripts/finalize-dfr05-acb.py`. It runs twice and validates baseline/source/output hashes, actual tests and production rejections. No runtime download occurs. Python standard library is sufficient for replay; PDF rendering was a bounded manual inspection, not a replay dependency.', '',
      'STOP for owner review. No CTG/MBB/TCB/VCB/SSI or other non-pilot processing; no rest of Batch B1, acquisition, scoring, production activation or data/database/master write.'
    ])
    lines=['# ACB financial metric coverage','','Reported financial statement values below are native **million VND**; ratios are decimal fractions. Native originals, canonical VND, exact fractions, dates, revision, source pointers/hashes and full definitions are retained in ACB.json.','',
      f'Total {len(ms)} metric objects: {summary["metricsByStatus"].get("SUPPORTED",0)} SUPPORTED, {summary["metricsByStatus"].get("MISSING",0)} MISSING, {summary["metricsByStatus"].get("CONFLICT",0)} CONFLICT. Supported count includes distinct component facts and derived metrics; it is not the number of independent reported disclosures.', '',
      '| Concept | FY2022 | FY2023 | FY2024 | FY2025 |','|---|---:|---:|---:|---:|']
    for c in BOOK_CONCEPTS+('BANK_LOAN_LOSS_RESERVES','BANK_REPORTED_CAR','BANK_REPORTED_CET1','NET_INCOME_ATTRIBUTABLE_PARENT','GROUP_ROA_AVG','GROUP_ROE_AVG','LOAN_DEPOSIT','RESERVES_GROSS_LOANS','NII_ASSETS_CLOSING'):
        values=[]
        for y in range(2022,2026):
            m=by.get((c,y));values.append('Not calculated: FY2021 opening balance outside window' if m is None else 'MISSING' if m['value'] is None else m.get('nativeSourceValue',m['value']) if m.get('nativeSourceUnit')=='MILLION_CURRENCY' else m['value'])
        lines.append('|'+c+'|'+'|'.join(values)+'|')
    lines+=['', 'Thirty-three retained FY2022–FY2025 observations are reused. Four reserve aggregates are classified as derived sums; eight specific/general component facts are explicit and hash-linked. All48 derived objects use exact Decimal operands; ratios retain DFR02 12dp HALF_EVEN and exact fractions. Accounting growth uses same original-vintage full-year/December31 scope; no comparative/latest-column substitution, YTD annualization, per-share inference or CAR cross-framework trend.', '',
      '## Reserve reconciliation', '', '| FY | Specific | General | Excluded margin lending | Total contra | Unit |','|---|---:|---:|---:|---:|---|']
    for y in range(2022,2026):
        r=by['BANK_LOAN_LOSS_RESERVES',y]['componentReconciliation'];lines.append(f'|{y}|{r["specific"]}|{r["general"]}|{r["excludedMarginLending"]}|{r["totalContra"]}|million VND|')
    lines+=['', 'The FY2025 retained narrower reserve amount7,507,253 million VND equals2,525,003+4,982,250; total contra7,624,729 also includes117,476 margin-lending provision. This is a resolved definition difference, not an unresolved numeric contradiction. The ratio remains specific+general reserves/gross customer loans, not NPL coverage. Restructuring-related provisioning and denominator coverage still require topic qualification before any asset-quality assessment.', '',
      '## Financial reading and counterevidence', '',
      f'FY2025 gross customer loans grew {by["BANK_GROSS_CUSTOMER_LOANS_YOY",2025]["value"]} while customer deposits grew {by["BANK_CUSTOMER_DEPOSITS_YOY",2025]["value"]}. Gross loans/customer deposits reached {by["LOAN_DEPOSIT",2025]["value"]}; this balance-sheet funding diagnostic is not statutory LDR or proof of liquidity distress. Interbank funding, issued instruments and maturity gaps require their own reconciliation.', '',
      f'Assets increased while group NPAT changed {by["NET_INCOME_YOY",2025]["value"]} and NII changed {by["BANK_NET_INTEREST_INCOME_YOY",2025]["value"]} in FY2025. Reported group ROE on average total equity is {by["GROUP_ROE_AVG",2025]["value"]}. These observations support analysis of weaker earnings against a larger balance sheet; they do not establish normalized common-owner returns or a moat.', '',
      'Reported CAR is12.8%,12.48%,11.82%,12.45%; FY2025 explicit CET1 is12.07%. FY2022–2024 CET1 is not disclosed in the qualified review; Tier1 is not substituted. FY2025 changes to TT14 versus earlier TT41 and regulatory exclusions prevent an unqualified like-for-like capital trend. Book equity/assets is a separate diagnostic.', '',
      'Seven explicit metric gaps: parent-attributable NPAT four years; explicit CET1 FY2022–2024. Parent profit is unqualified, not proved absent everywhere in the retained corpus. No group=parent, NCI=0 or EPS-derived share inference. FY2022 average ROA/ROE additionally require FY2021 opening operands outside this authorized window and are not emitted as invented values.', '',
      'Full topic readiness:0;23 deferred and unscored. Financial metrics support partial context, not full M3 topic sets. Deferred classes: '+json.dumps(summary['rubricReadiness'])+'. Each rubric has an exact dependency and resolution in gap-register.json. Source existence is distinguished from qualified topic evidence; no claim of seven genuinely absent nonfinancial sources is made.', '',
      'Valuation remains deferred: compatible dated price, corporate-action-adjusted shares, normalized common-owner denominator, owner-approved cutoff/source policy and economic assumptions are not supplied or presumed. No valuation execution occurred.'
    ]
    write('DFR_05_P2_2_ACB_METRIC_COVERAGE.md',lines)
    write('DFR_05_P2_2_ACB_DEPENDENCY_VALIDATION.md',[
      '# ACB dependency validation - PASS','',f'{summary["graphNodes"]} nodes, {summary["graphEdges"]} edges. Source bindings preserve path/hash/JSON Pointer; decoded review-payload locators remain attached to metric objects. Original PDF byte changes affect all actually bound metrics; exact observation changes affect only their dependent metrics/topics/rubrics.', '',
      'Original P1 graph edge validation, cycle checks, propagation and export are composed unchanged. ACB graph add validates its stable identity and rejects other issuers. Calculation/qualified operand/source hash edges propagate. Unreviewed display/provider lineage edges do not grant eligibility. Metric-to-topic edges are explicitly PARTIAL_FINANCIAL_CONTEXT; every fullTopicQualified=false, and no topic becomes a rating.', '',
      'Actual tests inject a conflict at FY2025 loan reserves and its observation pointer: reserve/gross-loan ratio and affected asset-quality/risk topics propagate; gross loan/deposit ratio, total assets and BQ-MOAT do not. Conflict overlays keep null points and do not mutate original metric values or rubrics. All33 original native values replay against their decoded reviewed captures; exact note/page/unit and PDF hashes are retained.', '',
      'All23 unchanged M3 rubric/topic lists are represented, with explicit deferrals. No estimated facts, new approved bands, zero substitutes or weight redistribution. Legacy VIC/VHM debt and TCX1VND conflicts stay in unchanged pilot outputs and have no edges into ACB.', '',
      'See dependency-graph.json, test-results.json, determinism-results.json and validation-results.json. Passed tests certify this bounded research graph, not independent analyst acceptance or whole production.'
    ])
    parity=b.read(b.OUT/'parity-results.json')
    lines=['# Six-pilot parity validation - PASS','','Exact full-object comparison to sealed DFR02 metrics/provider crosschecks and DFR04 closure rubrics; P1 code/source/output seals also verified. No rebuilding, repair or resealing of historical results.','','| Issuer | Metrics | Completed | Deferred |','|---|---:|---:|---:|']
    lines += [f'|{r["ticker"]}|{r["metricCount"]}|{r["completed"]}|{r["deferred"]}|' for r in parity['issuers']]
    lines += ['', 'Totals unchanged:789 financial metric objects,25 completed provisional assessments,113 deferred dispositions, six original identities. Provider crosschecks, metric/rubric object hashes, original source projections and dossier bytes are recorded in parity-results.json.', '',
      f'Two fresh same-code ACB executions produced identical core payload hash `{summary["deterministicPayloadHash"]}`. Core includes dossier, graph, source inventory/projection and gap register. Execution timestamps/receipts and expanded predecessor pin map are outside the core; input bytes are separately verified and the pin set is compared between runs.', '',
      f'{validation["protectedFilesVerified"]} baseline files match protected-before.json, including all original tracked files and every retained data file; initial pre-implementation snapshot comparison was also executed. Database/sidecars, master records, M1–M8 code/data and scoring authority remain unchanged. This is byte integrity, not a new approval of their historical financial conclusions.'
    ]
    write('DFR_05_P2_2_ACB_PARITY_VALIDATION.md',lines)
    write('DFR_05_P2_2_ACB_BOUNDARY_VALIDATION.md',[
      '# ACB production boundaries - PASS','', '**63/63 actual entry-point probes rejected**: ACB plus six unchanged pilot dossiers, each tested against formal scorer, ranking root, nested ranking card, decision, monthly DCA validation, NAV request qualification, ledger transaction builder, formal DI acceptance and formal AI provenance.', '',
      'Probes import the existing production functions and require rejection; they do not use mocks or call write repositories. Rejection reasons are retained in boundary-results.json. This validates direct and nested research DTO incompatibility; it does not claim protection against arbitrary transformations, authenticated promotion or all application workflows.', '',
      'Approved scoring authority verifier executed successfully. All original tracked files and data fingerprints were checked again after the actual probes. No production database connection was opened by the ACB pipeline; the authority verifier uses its existing read-only path. No DB/master/authority write, financial admission, new score, ranking result, portfolio decision, DCA, NAV calculation or ledger posting was performed.', '',
      'No whole-application release PASS is claimed. Existing release issues and legacy pilot exceptions remain under their original governance. See validation-results.json for executable/runtime versions, exact commands, exit codes, stdout and stderr.'
    ])
    testcount=sum(r['tests'] or 0 for r in validation['actualRuns'])
    write('DFR_05_P2_2_ACB_FINAL_REVIEW.md',[
      '# DFR-05 P2.2-ACB-01 - PASS WITH CONDITIONS','',f'Baseline/HEAD commit `{BASELINE}`; new work is uncommitted. ACB-only implementation completed, owner result review pending. Reference universe2026-11-05-v1/hash`{UHASH}`.', '',
      f'ACB:{summary["metricCount"]} financial metric objects, {summary["metricsByStatus"].get("SUPPORTED",0)} supported, seven missing, zero unresolved source conflicts. Supported objects include37 reported facts and48 derived metrics, including the explicitly classified reserve-component aggregates. No estimate, valuation or new assessment is manufactured.', '',
      'ACB rubric readiness:0 full-topic-ready,23 deferred,0 newly scored. Deferrals:10 research mapping;7 topic-evidence unqualified;2 analyst assumptions required;4 valuation dependencies. Every row retains null points/band/assessment; categoryScores and totalScore remain null.', '',
      f'Actual validation: {testcount} automated tests passed across ACB, P1 and DFR02;63/63 production rejections; two fresh deterministic replays; exact789/25/113 pilot parity; approved authority and protected bytes PASS. Details in validation-results.json. Independent human review and whole-production acceptance are not claimed.', '',
      'Implementation issues remaining: Critical0 / Major0 / Minor0. Research limitations (not implementation defects): Major3 groups - unqualified common-owner earnings; full-topic financial/nonfinancial and scenario qualification; missing valuation inputs/owner choices. Minor1 group - no explicit historical CET1 and framework comparability limitation. No unresolved ACB numeric conflict: reserve/contra difference was reconciled to separately disclosed margin-lending provision. Inherited VIC/VHM debt exceptions (Major2) and TCX1VND conflict (Minor1) remain unchanged outside ACB; no blanket data clearance is implied.', '',
      'Exact source/definition blockers: qualify parent-attributable NPAT2022–25 without group substitution; obtain explicit CET1 evidence or retain FY2022–24 gap; reconcile credit-group/restructured exposures, interest realization, deposit/maturity/covenant restrictions and action-adjusted common-owner metrics. Financial statements alone do not establish moat, market position, governance quality or forward scenarios. These dependencies already have concrete paths in gap-register.json; no new generic historical closure campaign is opened.', '',
      'Owner decision: accept or reject this ACB research engineering replay, its narrower reserve definition, regulatory scope isolation and explicit unscored deferrals. Acceptance does not authorize new scoring, new sources, other issuers or production. Any later expansion requires separate explicit approval.', '',
      '**STOPPED for owner review.** No remaining Batch B1 issuer, external financial source, valuation, ranking, decision, DCA, NAV, ledger write or production activation.'
    ])


def main():
    version=execute([NODE,'--version'])
    match=re.fullmatch(r'v(\d+)\.(\d+)\.(\d+)',version['stdout'].strip())
    if not match or not (22,23,2)<=tuple(map(int,match.groups()))<(23,0,0):raise ValueError('SUPPORTED_INSTALLED_NODE_REQUIRED >=22.23.2 <23')
    one=b.build();pins=b.read(b.OUT/'input-pins.json')
    two=b.build()
    if one['deterministicPayloadHash']!=two['deterministicPayloadHash'] or pins!=b.read(b.OUT/'input-pins.json'):raise ValueError('DETERMINISM_FAILURE')
    b.write('determinism-results.json',dict(status='PASS',independentExecutions=2,firstPayloadHash=one['deterministicPayloadHash'],secondPayloadHash=two['deterministicPayloadHash'],sourcePinSetsEqual=True,exclusions=['Receipt timestamps and process output','Predecessor source-pin map (verified separately)']))
    runs=[]
    for args in [[sys.executable,'scripts/test-dfr05-acb.py'],[sys.executable,'scripts/test-dfr05-p1.py'],[sys.executable,'scripts/test-dfr02.py'],[NODE,'scripts/verify-dfr05-acb-boundaries.mjs'],[NODE,'scripts/verify-approved-scoring-authority.mjs']]:
        print('Running '+' '.join(args),flush=True);runs.append(execute(args))
    b.write('test-results.json',dict(status='PASS',actualRuns=runs[:3]))
    protected=b.read(b.OUT/'protected-before.json');b.check(protected,exact_data_inventory=True)
    initial=Path('/private/tmp/dfr05-acb/before.json')
    initial_checked=None
    if initial.exists():
        original=b.read(initial);b.check(original,exact_data_inventory=True)
        if original!=protected:raise ValueError('INITIAL_SNAPSHOT_DIFFERS_FROM_REPLAY_BASELINE')
        initial_checked=dict(fileCount=len(original),snapshotHash=p1.sha(initial))
    p1.Store(expected=pins).validate()
    result=dict(status='PASS',reviewOutcome='PASS_WITH_CONDITIONS',validatedAt=datetime.now(timezone.utc).isoformat(),baselineCommit=BASELINE,implementationCommit=None,workingTree='UNCOMMITTED_NEW_VERSIONED_FILES_ONLY',runtime=version,actualRuns=runs,protectedFilesVerified=len(protected),initialPreImplementationSnapshot=initial_checked,protectedAndDatabaseBytesUnchanged=True,sourcePinsVerified=len(pins),p1MetricsUnchanged=789,p1AssessmentsUnchanged=25,p1DeferredUnchanged=113,deterministicTwoRunReplay=True,actualProductionRejections=63,other23IssuersProcessed=0,newAssessments=0,newExternalFinancialSources=0,productionActivated=False,ownerResultAcceptance='PENDING',independentHumanReviewClaimed=False)
    b.write('validation-results.json',result)
    reports(two,result)
    b.write('owner-authorization.json',dict(scope='P2.2-ACB-01 only',authority='EXPLICIT_OWNER_ATTACHMENT_IN_CURRENT_CONVERSATION',attachmentName='VN30 Value Investing OS - DFR-05 P2.2-ACB-01',approvedIssuerSecurityId=ACB.securityId,approvedM3Sector='BANK',researchSubtype='BANK',qualifiedReportingScope='CONSOLIDATED',approvalTimestamp=None,resultAcceptance='PENDING',newScoringAuthorized=False,other23Authorized=False,newExternalSourcesAuthorized=False,productionAuthorized=False))
    implementations={p:p1.sha(ROOT/p) for p in ['scripts/lib/dfr05_acb_v2.py','scripts/build-dfr05-acb.py','scripts/test-dfr05-acb.py','scripts/verify-dfr05-acb-boundaries.mjs','scripts/finalize-dfr05-acb.py']}
    files={str(p.relative_to(b.OUT)):p1.sha(p) for p in sorted(b.OUT.rglob('*')) if p.is_file() and p.name!='manifest.json'}
    manifest=dict(contract='dfr05-p2-2-acb-content-manifest-v2',baselineCommit=BASELINE,status='PENDING_OWNER_REVIEW',files=files,implementation=implementations,sourcePinsHash=p1.sha(b.OUT/'input-pins.json'),protectedSnapshotHash=p1.sha(b.OUT/'protected-before.json'),deterministicPayloadHash=two['deterministicPayloadHash'],canonicalHashSemantics='SHA256_UTF8_SORTED_KEYS_COMPACT_ENSURE_ASCII_FALSE_EXCLUDING_ONLY_contentHash',immutability='CONTENT_ADDRESSED_REVIEW_MANIFEST; verify hashes before use; no cryptographic signature or filesystem WORM claim',productionAdmissible=False)
    manifest['contentHash']=p1.digest(manifest)
    b.write('manifest.json',manifest)
    b.check(protected,exact_data_inventory=True)
    for p,h in files.items():
        if p1.sha(b.OUT/p)!=h:raise ValueError('OUTPUT_HASH_DRIFT:'+p)
    print(json.dumps(dict(status='PASS_WITH_CONDITIONS',supported=two['metricsByStatus']['SUPPORTED'],missing=two['metricsByStatus']['MISSING'],newScores=0,actualTests=sum(r['tests'] or 0 for r in runs),productionRejections=63,ownerReview='PENDING',manifestHash=manifest['contentHash'])),flush=True)


if __name__=='__main__':main()
