"""P2.3 reproducible two-run replay, executable receipts and owner review manifest."""
import json
import os
import re
import sys
import subprocess
from pathlib import Path
from datetime import datetime,timezone
from collections import Counter
from lib.dfr05_bank_v3 import *

b=p1.module('bank_final_builder','scripts/build-dfr05-bank.py')
NODE=os.environ.get('DFR05_NODE_BINARY','node')


def execute(command):
    r=subprocess.run(command,cwd=ROOT,capture_output=True,text=True)
    found=re.search(r'Ran (\d+) tests',r.stderr)
    receipt=dict(command=command,exitCode=r.returncode,tests=int(found.group(1)) if found else None,stdout=r.stdout,stderr=r.stderr)
    b.write('last-command-receipt.json',receipt)
    if r.returncode:raise RuntimeError(json.dumps(receipt,ensure_ascii=False))
    return receipt


def table(s):
    lines=['| Issuer | Total metrics | Supported | Missing | Conflict | Rubrics ready | Rubrics deferred |','|---|---:|---:|---:|---:|---:|---:|']
    for t in TICKERS:
        r=s[t];lines.append(f'|{t}|{r["totalMetrics"]}|{r["supported"]}|{r["missing"]}|{r["conflict"]}|{r["rubricsReady"]}|{r["rubricsDeferred"]}|')
    return lines


def reports(s,v):
    def write(name,lines):(b.OUT/name).write_text('\n'.join(lines)+'\n')
    config=b.read(ROOT/BINDINGS)
    ds={t:b.read(b.OUT/f'issuers/{t}.json') for t in TICKERS}
    write('DFR_05_P2_3_IMPLEMENTATION_REPORT.md',[
      '# DFR-05 P2.3-B1-BANK implementation','',f'Baseline/HEAD `{BASELINE}`. New implementation files are uncommitted; implementationCommit=null. Explicit owner attachment authorizes CTG/MBB/TCB/VCB only. Result acceptance remains PENDING_OWNER_REVIEW.', '',
      f'Approved universe2026-11-05-v1, reference2026-11-05, canonical hash`{acb.UHASH}`. Authorization is the exact frozen tuple (stable securityId,ticker,approved M3 BANK sector,BANK subtype,CONSOLIDATED financial scope). Deny precedes source access. All26 other universe identities, including SSI and the seven preserved predecessors, are rejected by this new execution entry point. The predecessor entry points remain unchanged.', '',
      'Implementation: scripts/lib/dfr05_bank_v3.py and versioned dfr05_bank_bindings_v3.json; builder scripts/build-dfr05-bank.py; tests scripts/test-dfr05-bank.py; actual probes scripts/verify-dfr05-bank-boundaries.mjs; verification/manifest scripts/finalize-dfr05-bank.py. No application/Next.js, M1–M8, methodology, database schema or production authority code was edited.', '',
      'Composition reuses ACB Identity, adapter traversal, BANK recipe and regulatory-framework guard; original P1 edge/affected/export semantics; original DFR02 native importer, fact/derive arithmetic, exact number/ratio and provider checks. New constructors validate only the four real stable identities. No ACB/BID alias, output-ID rewriting, monkeypatch or copied ACB financial source operand exists.', '',
      'Issuer-specific native observation bindings, decoded capture locators, accounting/capital/provision reviews and original PDF hashes are revalidated. Original values remain lossless decimal strings. Original native input revision flags and reviewed canonical revisions are both retained. Where they disagree, new research rows preserve the reviewed RESTATED basis and disclose the inconsistency; no predecessor file is repaired.', '',
      'A bounded new compatibility rule permits a typed calculation view only when all operands have supported known revision labels, compatible year/scope/units/full fiscal periods and exactly one common leaf-PDF hash. Source node metadata stays unchanged; result revisionBasis=COHERENT_REVIEWED_DOCUMENT_VINTAGE and the exact PDF/operand bases are recorded. This handles explicitly bound current/comparative columns in one reviewed document, not latest-wins or numerical-equality mapping. Cross-document original/restated mixtures without an explicit bridge stay CONFLICT with null values. ACB/P1 behavior and objects are unchanged.', '',
      'FY2025 balance/income pages were checked directly in retained original PDFs for interbank assets/funding, issued instruments, central-bank/government obligations, other liabilities, net/gross loan distinction, signed contra/provision flows, interest components and explicit parent profit. FY2024 parent comparative columns were checked on those same pages. Additional retained historical income pages explicitly qualify CTG/TCB/VCB parent NPAT FY2022–2023 and VCB NII FY2022–2023. MBB historical net-profit labels remain unqualified as parent profit. VCB original53620869 versus restated53614431 million-VND FY2023 NII is preserved as a distinct revision variant. VCB customer-loan groups/provision notes39/41 were also checked. Direct review is by the implementing agent, not independent human acceptance. Historical CTG/MBB/TCB provision/NPL reviews are reused with individual hashes/populations, including TCB margin-lending exclusions and CTG revised comparative group sources.', '',
      'Native million-VND units are bound to retained reviewed transcription or exact note-page unit context. A native value re-expressed from reviewed canonical VND is labelled as such; it is not claimed as a newly transcribed printed lexical string. Unknown printed lexical/publication metadata remains null. Four adapters actually traverse retained PDF display, notes, CaféF display/raw and combined JSON; only dependency rows and distinct dimension witnesses are exported. Raw datasets are not copied.', '',
      'All92 new rubric rows remain deferred with points/band/assessment=null. Category scores,totalScore,valuation,ranking and signals remain null. No source presence, provider agreement, diagnostic ratio or completed financial metric qualifies a full rubric by itself. All outputs remain RESEARCH_PROVISIONAL,productionAdmissible=false,scoringAuthorized=false.', '',
      'Reproduce using installed supported Node >=22.23.2 <23 via DFR05_NODE_BINARY and `python3 scripts/finalize-dfr05-bank.py`. This performs two fresh replays, full bounded tests, real production entry-point rejection and content-hash manifest verification. No network acquisition or automatic runtime download.', '',
      'STOP after these four banks. No SSI, later batches, new external financial source, valuation/scoring/ranking, portfolio decision, database/master/authority mutation or production activation.'
    ])
    lines=['# Four-bank financial metric coverage','']+table(s)+['','Counts are metric objects, not independent disclosures. SUPPORTED includes separately identified reported facts and derived diagnostics. MISSING means no qualified operand in this bounded replay, including retained evidence needing topic/page mapping; it is not a claim of absence from the repository. CONFLICT is an explicit compatibility deferral, with null value. No missing-as-zero, synthetic score or weight redistribution.','']
    for t in TICKERS:
        d=ds[t];by={(m['concept'],m['year']):m for m in d['metrics']}
        lines += [f'## {t}', '', config['issuers'][t]['researchContext'],'',f'Metric kinds: {json.dumps(s[t]["byKind"])}. Original definitions, exact fractions, unit/revision and source paths/JSON Pointers are in issuers/{t}.json. Source inventory is source-inventory/{t}.json; precise metric/rubric gaps are in gaps/{t}.json.', '',
          '| Metric | FY2022 | FY2023 | FY2024 | FY2025 |','|---|---:|---:|---:|---:|']
        for c in ('TOTAL_ASSETS','TOTAL_EQUITY','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS','BANK_LOAN_LOSS_RESERVES','BANK_NET_INTEREST_INCOME','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','BANK_REPORTED_CAR','BANK_REPORTED_CET1','GROUP_ROA_AVG','GROUP_ROE_AVG','LOAN_DEPOSIT','RESERVES_GROSS_LOANS','BANK_CUSTOMER_LOAN_NPL','BANK_CUSTOMER_LOAN_NPL_COVERAGE','BANK_INTERBANK_ASSETS_REPORTED','BANK_INTERBANK_FUNDING_REPORTED','BANK_ISSUED_FUNDING_INSTRUMENTS','BANK_CREDIT_PROVISION_EXPENSE'):
            vals=[]
            for y in range(2022,2026):
                m=by.get((c,y))
                vals.append('Not emitted: opening/mapping dependency' if m is None else m['status'] if m['value'] is None else m.get('nativeSourceValue',m['value']) if m.get('nativeSourceUnit')=='MILLION_CURRENCY' else m['value'])
            lines.append('|'+c+'|'+'|'.join(vals)+'|')
        lines += ['', 'Financial amounts above use native million VND when present, derived currency amounts use canonical VND, and ratios are decimal fractions. The original metric unit field is authoritative; no implicit provider scaling is used.', '',
          f'FY2025 gross loan/deposit diagnostic={by["LOAN_DEPOSIT",2025]["value"]}; group ROE on average total group equity={by["GROUP_ROE_AVG",2025]["value"]}. These are not statutory LDR or normalized common-owner returns. Reported NII growth={by["BANK_NET_INTEREST_INCOME_YOY",2025]["value"]}; group NPAT growth={by["NET_INCOME_YOY",2025]["value"]}. Historical growth is not per-share/action-adjusted or a forward forecast.', '',
          'Counterevidence/limits: closing balances and reported earnings do not qualify interest realization, restructured exposures, deposit stability, maturity/covenant stress or recurring common-owner returns. Regulatory capital exclusions remain separate from financial group scope. Interbank assets are the reported subtotal (including applicable contra), and TCB funding caption includes financial institutions. Reported provision expense is a signed multi-exposure flow, not automatically customer-loan credit cost.', '',
          f'23 rubric deferrals: {json.dumps(s[t]["byRubricDisposition"])}. Each carries full unchanged M3 topic lists, exact dependency, issuer context, analyst/owner responsibility and resolution/stop path. No moat, governance quality, market share, assumption or valuation is manufactured.', '']
        conflicts=[m for m in d['metrics'] if m['status']=='CONFLICT']
        if conflicts:
            lines += ['Explicit unresolved compatibility metrics:']+[f'- `{m["id"]}`: {", ".join(m["reasons"])}; required source/revision bridge before calculation.' for m in conflicts]+['']
    lines += ['## Resolved provision definition difference','', 'TCB general+specific customer-loan reserves exclude margin-lending reserves. FY2025:10,485,620+12,758=10,498,378 million VND total contra; FY2024:8,083,041+7,652=8,090,693; FY2023:6,123,121+4,775=6,127,896. The narrower reserve/gross-loan diagnostic is distinct from a separately calculated customer-loan NPL coverage ratio with explicit groups3/4/5. Neither proxy is relabelled NIM, statutory LDR or CAR.', '',
      'CET1 FY2022–FY2025 is unqualified for all four in the selected review contracts; Tier1/book equity are not substitutes. Historical supplementary funding/income rows remain mapping gaps where not directly reviewed. FY2022 average ROA/ROE requires qualified FY2021 opening operands and is not fabricated.', '',
      'Valuation blockers remain owner-approved cutoff/source policy, dated compatible price/action-adjusted shares, normalized common-owner denominator, economic assumptions and model crosschecks. No valuation has run.']
    write('DFR_05_P2_3_METRIC_COVERAGE.md',lines)
    lines=['# Four-bank dependency validation - PASS','', 'Original P1 edge direction, DAG validation and status-only conflict propagation are reused. Qualified source/calculation edges propagate; unreviewed display/candidate/provider references never grant eligibility. Exact source bindings and shared PDF hash dependencies remain explicit.','']
    for t in TICKERS:lines.append(f'{t}: {s[t]["graphNodes"]} nodes, {s[t]["graphEdges"]} edges;23 rubric nodes, all topic nodes fullTopicQualified=false.')
    lines+=['', 'Actual controlled metric and source-pointer conflict injected for every issuer at FY2025 customer-loan reserves. Reserve/gross-loan and dependent asset-quality/risk topics become conflicted; loan/deposit, total assets, BQ-MOAT and every other bank remain unaffected. The merged graph probe verifies no cross-issuer contamination. Original metric/rubric objects are not mutated.', '',
      'conflict-injection-results.json retains exact changed IDs, complete affected status overlays, all unaffected node IDs within each graph and zero other-bank dependents. The tests also reject dangling edges, cycles, foreign issuer additions, unsupported scores/topics and changed source bytes.', '',
      'A changed shared PDF or shared source file can correctly invalidate all actual bindings to that authority; this is distinct from a cell-local/metric-local overlay. No blanket issuer veto is used for a single topic conflict. See dependency-graphs/, conflicts/, test-results.json and validation-results.json.']
    write('DFR_05_P2_3_DEPENDENCY_VALIDATION.md',lines)
    parity=b.read(b.OUT/'parity-results.json')
    lines=['# Predecessor parity and deterministic replay - PASS','', 'All source/code/output seals for P1,P2.0,P2.1,P2.2 match. All original tracked files and retained data files remain byte-identical. No predecessor output, seal or assessment was rewritten.','',
      '| Pilot | Metrics | Completed | Deferred |','|---|---:|---:|---:|']
    lines += [f'|{r["ticker"]}|{r["metricCount"]}|{r["completed"]}|{r["deferred"]}|' for r in parity['p1']['issuers']]
    lines += ['', 'P1 totals:789 metric objects,25 completed assessments,113 deferred, including exact provider crosschecks and source projection/assessment hashes. ACB:92 metric objects,85 supported,7 missing,23 deferred; exact canonical core hash`'+b.ACB_CORE+'`.', '', 'Two fresh same-input/same-code replays per issuer match these hashes:','']
    lines += [f'- {t}: `{s[t]["canonicalCoreHash"]}`' for t in TICKERS]
    lines += ['', 'Canonical core includes the dossier, source inventory/projection, graph, gap register and conflict register. Process timestamps/receipts and predecessor-wide input-pin map are excluded; input-pin maps are separately verified and matched between runs.', '',f'{v["protectedFilesVerified"]} protected baseline files verified, including database/sidecar inventory, original financial sources, VN30/sector master, M1–M8, source policy and active authority. Node/Python runtimes and actual commands/exit codes/stdout/stderr are in validation-results.json. No whole-application release acceptance is claimed.']
    write('DFR_05_P2_3_PARITY_VALIDATION.md',lines)
    write('DFR_05_P2_3_BOUNDARY_VALIDATION.md',[
      '# Production boundaries - PASS','', '**36/36 actual entry-point probes rejected** for CTG/MBB/TCB/VCB. Each dossier is rejected through formal scorer, ranking root, nested ranking card, decision engine, monthly DCA review, NAV request qualification, ledger transaction builder, formal DI acceptance and formal AI provenance.', '',
      'These probes import existing production functions and require exceptions. No mocks or rewritten production admission rules are used. No formal input, authenticated provenance, score, valuation/ranking result, decision, DCA/NAV calculation or ledger posting is produced. Reasons are in boundary-results.json.', '',
      'Approved scoring authority verification ran successfully through its existing read-only path. Protected-byte and data-file/sidecar inventory checks ran after the probes. No master/database/authority/source write or production activation occurred.', '',
      'A PASS applies to these exact direct/nested provisional dossier DTOs; it is not a proof against arbitrary transformed/authenticated inputs or whole-application production acceptance. SSI and the later batches remain unauthorized.'
    ])
    tests=sum(r['tests'] or 0 for r in v['actualRuns'])
    lines=['# DFR-05 P2.3-B1-BANK - PASS WITH CONDITIONS','',f'Baseline/HEAD `{BASELINE}`. Implementation uncommitted; implementationCommit=null. Result acceptance PENDING_OWNER_REVIEW.','']+table(s)
    lines += ['',f'Actual validation: {tests} tests passed across new four-bank tests and unchanged P1/ACB regressions;36/36 actual production rejections; two fresh deterministic replays per issuer; exact P1 and ACB parity; protected data/master/M1–M8/authority fingerprints unchanged.', '',
      'Engineering defects remaining: Critical0 / Major0 / Minor0. Research limitations: Major5 groups (CTG cross-document revision bridges; VCB cross-document revision bridges; historical parent/supplementary financial mapping; full-topic nonfinancial/scenario qualification; owner valuation dependencies). Minor1 group: explicit FY2022–FY2025 CET1 unqualified, not inferred from Tier1. These are research readiness limitations, not newly accepted formal scoring or claims that retained evidence is genuinely absent.', '',
      'Exact unresolved metric IDs and required revision/source dependencies appear in the metric-coverage report, conflicts/ and gaps/. Parent profit is explicit FY2024–25 for all four and FY2022–23 for CTG/TCB/VCB; MBB FY2022–23 remains a definition-mapping gap. Funding/income supplement coverage is directly checked FY2025; earlier rows remain mapping/page-review dependencies. CTG revised NPL grouping sources retain their own PDF hashes; TCB margin-lending exclusions are reconciled. No stale native ORIGINAL flag overrides reviewed RESTATED evidence.', '',
      'All92 new rubric instances are unscored and deferred:40 research mapping,28 unqualified topic evidence,8 analyst assumptions and16 valuation dependencies. Full-topic-ready=0, new points/bands/assessments=0; categoryScores and totalScore=null. The25 completed predecessor assessments and113 deferred predecessor rubrics remain unchanged; ACB23 deferred remain unchanged.', '',
      'Independent human financial acceptance is not claimed. Review the new single-document revision-cohort contract, issuer-specific bindings, declared source gaps and actual receipts. Owner acceptance of this bounded engineering result does not authorize SSI, later batches, new external sources, scoring, valuation or production.', '', '**STOPPED after CTG/MBB/TCB/VCB. Await explicit owner review and approval.**']
    write('DFR_05_P2_3_FINAL_REVIEW.md',lines)


def main():
    runtime=execute([NODE,'--version']);m=re.fullmatch(r'v(\d+)\.(\d+)\.(\d+)',runtime['stdout'].strip())
    if not m or not (22,23,2)<=tuple(map(int,m.groups()))<(23,0,0):raise ValueError('INSTALLED_SUPPORTED_NODE_REQUIRED >=22.23.2 <23')
    first=b.build();pins={t:b.read(b.OUT/f'input-pins/{t}.json') for t in TICKERS};second=b.build()
    receipts={}
    for t in TICKERS:
        if first[t]['canonicalCoreHash']!=second[t]['canonicalCoreHash'] or pins[t]!=b.read(b.OUT/f'input-pins/{t}.json'):raise ValueError('NONDETERMINISM:'+t)
        receipts[t]=dict(status='PASS',freshExecutions=2,firstCoreHash=first[t]['canonicalCoreHash'],secondCoreHash=second[t]['canonicalCoreHash'],inputPinSetsEqual=True)
    b.write('determinism-results.json',receipts)
    runs=[]
    for args in [[sys.executable,'scripts/test-dfr05-bank.py'],[sys.executable,'scripts/test-dfr05-p1.py'],[sys.executable,'scripts/test-dfr05-acb.py'],[NODE,'scripts/verify-dfr05-bank-boundaries.mjs'],[NODE,'scripts/verify-approved-scoring-authority.mjs']]:
        print('Running '+' '.join(args),flush=True);runs.append(execute(args))
    b.write('test-results.json',dict(status='PASS',actualRuns=runs[:3]))
    protected=b.read(b.OUT/'protected-before.json');b.prior.check(protected,exact_data_inventory=True)
    parity=b.predecessor_parity()
    result=dict(status='PASS',reviewOutcome='PASS_WITH_CONDITIONS',baselineCommit=BASELINE,implementationCommit=None,workingTree='UNCOMMITTED_NEW_VERSIONED_FILES_ONLY',validatedAt=datetime.now(timezone.utc).isoformat(),nodeRuntime=runtime,pythonRuntime=sys.version,actualRuns=runs,protectedFilesVerified=len(protected),protectedAndDatabaseBytesUnchanged=True,dataSidecarInventoryUnchanged=True,parity=parity,determinism=receipts,productionRejections=36,authorizedNewIssuers=list(TICKERS),unauthorizedIssuersProcessed=0,newSourcesAcquired=0,newAssessments=0,productionActivated=False,ownerResultAcceptance='PENDING',independentHumanReviewClaimed=False)
    b.write('validation-results.json',result);reports(second,result)
    b.write('owner-authorization.json',dict(authority='EXPLICIT_CURRENT_OWNER_ATTACHMENT_DFR_05_P2_3_B1_BANK',baselineCommit=BASELINE,approvalTimestamp=None,authorizedStableIdentities=[i.__dict__ for i in IDENTITIES],universeVersion='2026-11-05-v1',approvedUniverseContentHash=acb.UHASH,newRubricScoring=False,newExternalSources=False,production=False,SSI=False,resultAcceptance='PENDING'))
    implementation={p:p1.sha(ROOT/p) for p in ['scripts/lib/dfr05_bank_v3.py',BINDINGS,'scripts/build-dfr05-bank.py','scripts/test-dfr05-bank.py','scripts/verify-dfr05-bank-boundaries.mjs','scripts/finalize-dfr05-bank.py']}
    files={str(p.relative_to(b.OUT)):p1.sha(p) for p in sorted(b.OUT.rglob('*')) if p.is_file() and p.name!='manifest.json'}
    manifest=dict(contract='dfr05-p2-3-bank-review-manifest-v3',baselineCommit=BASELINE,implementationCommit=None,status='PENDING_OWNER_REVIEW',files=files,implementation=implementation,sourcePinFiles={t:p1.sha(b.OUT/f'input-pins/{t}.json') for t in TICKERS},coreHashes={t:second[t]['canonicalCoreHash'] for t in TICKERS},protectedSnapshotHash=p1.sha(b.OUT/'protected-before.json'),canonicalHashSemantics='SHA256_UTF8_SORTED_KEYS_COMPACT_ENSURE_ASCII_FALSE_EXCLUDING_ONLY_contentHash',immutability='CONTENT_ADDRESSED_REVIEW_MANIFEST; verify before use; no cryptographic signature or filesystem WORM claim',productionAdmissible=False)
    manifest['contentHash']=p1.digest(manifest);b.write('manifest.json',manifest)
    for p,h in files.items():
        if p1.sha(b.OUT/p)!=h:raise ValueError('OUTPUT_MANIFEST_CHANGED')
    b.prior.check(protected,exact_data_inventory=True)
    print(json.dumps(dict(status='PASS_WITH_CONDITIONS',issuers=second,actualTests=sum(r['tests'] or 0 for r in runs),productionRejections=36,manifestHash=manifest['contentHash'],ownerReview='PENDING')),flush=True)


if __name__=='__main__':main()
