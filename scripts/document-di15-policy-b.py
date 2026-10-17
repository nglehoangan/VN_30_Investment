import json,pathlib,hashlib,subprocess
O=pathlib.Path('docs/fundamental-data-engine/evidence/2026-10-17-di15-partial-universe-amendment');HEAD='c24455fbb47374b355a888247af7bd4e3934ee57'
sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def read(n):return json.loads((O/n).read_text())
def write(n,d):(O/(n+'.json')).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
p=read('UNIVERSE_PARTITION.json');review=read('DI15_ACCEPTANCE_REVIEW.json');report=read('DEFERRED_EXCEPTION_REGISTER.json')['reporting']
paths=['docs/01 SYSTEM/INVESTMENT_POLICY.md','docs/01 SYSTEM/DECISION_FRAMEWORK_v1.0.md','docs/01 SYSTEM/RISK_POLICY_v1.0.md','docs/01 SYSTEM/SCORING_MODEL_v1.0.md','docs/01 SYSTEM/SYSTEM_PROMPT_v1.0.md','docs/08_CONTINUOUS_IMPROVEMENT/DATA_INITIALIZATION.md','docs/08_CONTINUOUS_IMPROVEMENT/INITIAL_SCORING_REPORT.md','src/domain/fundamentals/scoring-readiness.ts','src/infrastructure/repositories/scoring-datasets.ts','src/domain/fundamentals/freshness.ts','src/ui/data-freshness.tsx']
proofs=[]
for path in paths:
 before=hashlib.sha256(subprocess.check_output(['git','show',HEAD+':'+path])).hexdigest();after=sha(path);assert before==after
 proofs.append({'path':path,'startingSHA256':before,'currentSHA256':after,'unchanged':True})
authority=[{'path':paths[0],'finding':'VN30-only and evidence-first; missing information must remain missing (§§data integrity, lines574–589). No requirement to fabricate an all-member score. No broad M1 rewrite needed.'},{'path':paths[1],'finding':'Every investment decision retains its ordered decision/risk gates. Admission eligibility does not authorize a positive state.'},{'path':paths[2],'finding':'Capital protection and uncertainty restrictions remain; no quarantine waiver of LOW confidence or material uncertainty.'},{'path':paths[3],'finding':'§13.4 forbids neutral midpoint scores; lines828/969 preserve LOW-confidence and not-reliably-scorable restrictions. Weights unchanged.'},{'path':paths[4],'finding':'Lines39/80/840–846 preserve missing-input, VN30-only and no-fabrication rules.'},{'path':paths[5],'finding':'§28 legacy DI15 and all mandatory DI gates remain frozen for v1; new dated Owner amendment supplies v2 semantics.'},{'path':'docs/08_CONTINUOUS_IMPROVEMENT/DI15_PARTIAL_UNIVERSE_POLICY_B.md','finding':'Minimum approved dated clarification/amendment: new admission disposition, not issue resolution, capital policy, weights or DI14 approval.'}]
write('POLICY_AUTHORITY_TRACE',{'ownerDecision':'Policy B — Quarantined Partial-Universe approved by Owner','date':'2026-10-17','M1ModificationRequired':'Narrow prospective clarification in a separate approved amendment; original five frozen M1 documents remain unchanged. Their existing principles already support exclusion of insufficient evidence.','authority':authority,'frozenBaselinePreservation':proofs,'productionActivation':False})
write('POLICY_CHANGELOG',{'version':'1.0.0','effectiveDate':'2026-10-17','ownerApproval':'OWNER_POLICY_DECISION.json','previousRule':'independent-di-acceptance-v1 requires resolution of every Critical/Major across its full accepted scope.','newRule':'independent-di-acceptance-v2 adds quarantined-partial-universe-v1. Only ticker-isolated evidence blockers can remain OPEN Major, with exact register/provenance/triggers and technical exclusion. All unresolved Critical and shared-system blockers remain global; every other DI gate remains required.','reason':'Retain honest full-universe reporting without fabricated evidence or reopening concrete unavailable-source/definition blockers.','affectedAcceptanceContract':'independent-di-acceptance-v2','newImplementation':['src/domain/fundamentals/partial-universe.ts','src/domain/fundamentals/scoring-readiness-policy-b.ts','src/infrastructure/repositories/scoring-datasets-policy-b.ts','src/application/fundamentals/policy-b-ports.ts','app/server/policy-b-services.ts','src/domain/fundamentals/freshness-policy-b.ts','src/infrastructure/repositories/data-freshness-policy-b.ts','src/ui/policy-b-data-freshness.tsx'],'compatibility':'Additive versioned files. No old contract bytes, hashes, registry releases, accounting facts or historical snapshots are rewritten. Legacy v1 readers remain strict. New production Policy B must use the explicit server-only factory and pinned current acceptance, never a legacy v1 service as a partial-release substitute.','databaseMigration':'Not required; existing append-only acceptance JSON and body hashes support versioned bodies.','independentReview':'DI14 is not supplied by Owner policy approval; exact new body/partition/source ledger must have trusted independent review capability before insertion/use.'})
write('DI15_CONTRACT_BEFORE',{'version':'independent-di-acceptance-v1','source':'src/domain/fundamentals/scoring-readiness.ts','sourceSHA256':sha('src/domain/fundamentals/scoring-readiness.ts'),'unresolvedCriticalMajor':'Globally prohibited','all 15DIGates':'PASS required','independentApproval':'Exact trusted acceptance hash and reviewer/methodology binding required','historicalSemantics':'UNCHANGED'})
write('DI15_CONTRACT_AFTER',{'version':'independent-di-acceptance-v2','partitionVersion':'quarantined-partial-universe-v1','source':'src/domain/fundamentals/scoring-readiness-policy-b.ts','sourceSHA256':sha('src/domain/fundamentals/scoring-readiness-policy-b.ts'),'ownerApproval':'OWNER_POLICY_DECISION.json','fullUniverseAccounting':'Exactly30 certified IDs and ticker identities; complete disjoint partition; hash bound to the sealed snapshot universe','scorable':'Level-1 evidence PASS; no unresolved admission Critical/Major; all other readiness gates still required','deferred':'Level-1 non-PASS, original OPEN Major issues retained verbatim in source register; null score; evidence-only deterministic triggers; technical exclusion','Critical':'Every unresolved Critical remains a global blocker, including purported isolated Critical (stricter legacy rule preserved)','sharedSystem':'No GLOBAL_SYSTEM_BLOCKER may be quarantined, regardless of member placement','issueIntegrity':'Exact equal hash-bound source issue ledger; no missing/downgraded/resolved-by-quarantine issue','releaseDI15':'Requires valid quarantine and all DI1–DI14 PASS, per Owner condition 8','independentApproval':'Existing trusted capability now pins the entire new acceptance body including policy, partition and ledger. No self-approval.','backwardCompatibility':'v1 source/serialized fields/hashes/replay preserved unchanged'})
scorable=[m['ticker'] for m in p['members'] if m['state']=='SCORABLE'];deferred=[m['ticker'] for m in p['members'] if m['state']=='DEFERRED']
(O/'README.md').write_text('''# DI15 Policy B amendment — Owner-approved review candidate

Starting HEAD: `c24455fbb47374b355a888247af7bd4e3934ee57`. Effective date: 2026-10-17. [Approved amendment](../../../08_CONTINUOUS_IMPROVEMENT/DI15_PARTIAL_UNIVERSE_POLICY_B.md).

Read [FINAL_REVIEW.md](FINAL_REVIEW.md), [DI15_ACCEPTANCE_REVIEW.json](DI15_ACCEPTANCE_REVIEW.json), [TEST_RESULTS.json](TEST_RESULTS.json), and [OPEN_ISSUES.json](OPEN_ISSUES.json).

Policy B implementation and quarantine: PASS. Full 30 / Scorable admission candidates 25 / Deferred 5. Technical shared-system blockers 0. All six Major ticker issues remain OPEN. Release DI15 FAIL because independent DI14 and other exact-release mandatory gate approvals remain PENDING; structural quarantine PASS is recorded separately. readyForScoring=false; decisionReady=false.

All baseline source, policy and evidence files remain byte-for-byte unchanged. New v2 acceptance/repository/reporting modules are explicit opt-in through `app/server/policy-b-services.ts`, which pins the trusted current acceptance and supplies guarded ports to existing scoring/decision/marginal/workflow/DCA engines. There is no automatic production activation or acceptance insert.

Reproduce current release without changing accounting facts: `node scripts/build-di15-policy-b.mjs`, then `python3 scripts/document-di15-policy-b.py` under repository-required Node22.23.2. Tests and protected replay commands are recorded with exact exits in TEST_RESULTS.json. The builder reads each canonical/input pair at starting HEAD and compares its physical SHA256 before replay. It stops on a disposition discrepancy. Do not run historical generators with record/seal flags.

ARTIFACT_HASHES.json seals all package files except itself plus all new implementation/review sources. The DI14 candidate binds the base commit and hashed working-tree overlay; final review commit/signoff is pending. Prior source issue severities and blockers are preserved; quarantine is not resolution.

STOP. Await **Review DI15 Partial-Universe Amendment**.
''')
(O/'FINAL_REVIEW.md').write_text('''# DI15 Partial-Universe Amendment

Starting HEAD: `c24455fbb47374b355a888247af7bd4e3934ee57`. Effective: 2026-10-17. **Policy B — Quarantined Partial-Universe approved by Owner.** Exact Owner request and SHA256 are retained. No ticker forensic work, accounting edit, production score/ranking/Top10, valuation, investment recommendation or portfolio action was performed. Test scores/actions use synthetic fixtures only.

## Separate outcomes

|Outcome|Result|
|---|---|
|POLICY_B_IMPLEMENTATION|PASS|
|FULL_UNIVERSE|30, certified as-of 2026-10-16|
|SCORABLE_UNIVERSE|25 Level-1 admission candidates|
|DEFERRED_UNIVERSE|5|
|GLOBAL_SYSTEM_BLOCKERS|0 observed technical integrity blockers|
|Structural partition/quarantine|PASS|
|DI15 release evaluation|FAIL — other mandatory exact-release gate approvals pending|
|DI14|PENDING_INDEPENDENT_APPROVAL|
|readyForScoring|false|
|decisionReady|false|

SCORABLE admission candidates: '''+', '.join(scorable)+'''.

DEFERRED: '''+', '.join(deferred)+'''.

The complete disjoint partition is derived from certified effective membership, independent canonical replay, current-period coverage and the retained original issue register. It is not a manually asserted 25/5 list. The expected set/count is checked only after reconstruction; a mismatch stops the builder. Every old input/canonical file is SHA256-compared with the starting commit before replay. No existing accounting fact or source issue can be rewritten by this amendment.

## Contract and enforcement

`independent-di-acceptance-v1` remains frozen and strict. `independent-di-acceptance-v2` adds `quarantined-partial-universe-v1`, with the full certified universe reference/hash, stable ID-to-ticker identities, exact partition, original source issue ledger/hash, true severity/status/provenance, reopen triggers and technical exclusion. v1 does not acquire Policy B semantics retroactively. Existing trusted independent acceptance/methodology bindings still pin the exact complete body. A caller-authored PASS or recomputed checksum cannot confer approval.

An admitted member requires Level-1 PASS and no unresolved admission Critical/Major. A deferred member requires Level-1 non-PASS, exact original material blockers and authoritative-evidence-only reopen triggers. Scores remain null; enabling any scoring, ranking, Top10, positive-capital, DCA or redistribution capability fails validation. Dropping an issue, changing Major to Minor or using quarantine as a resolution fails source-ledger equality. Schema/mapping/registry/universe/unit/engine/contamination/replay/database/infrastructure failures cannot masquerade as isolated source insufficiency. Every unresolved Critical remains globally blocking, preserving the stricter legacy rule even if claimed ticker-isolated.

The new repository is pinned to a server-selected current acceptance; the caller cannot select an older release to escape quarantine. It rejects deferred formal input/bridge before score calculation or persistence. New formal acceptance still needs all 15 PASS gates and trusted independent authority. New server-only composition supplies guarded analytical/decision/marginal/workflow ports to existing engines. These check cached positive scorecards, old decisions, marginal plans, DCA proposals and execution append paths against the current partition. Legacy historical readers remain available unchanged; they cannot be used as Policy B partial-release authority because v1 still rejects unresolved Major issues.

The new report model/view discloses FULL_UNIVERSE_COUNT, SCORABLE_UNIVERSE_COUNT, DEFERRED_UNIVERSE_COUNT and deferred members/real Major severity/reopen triggers. Coverage is not reported as completed scores. Future partial ranking labels are qualified as “Top ranked among currently scorable VN30 constituents”. No Top10 or partial-ranking algorithm is implemented. No score weight or excluded capital is redistributed, including to scorable members merely because others are deferred. Existing M3 weights, M4/M5 financial/capital rules and LOW-confidence restrictions are unchanged.

## Preserved exceptions

All six original Major Level-1 issues remain OPEN, unresolved and provenance-bound:

- VNM: FY2024/FY2025/6M2026 financing/current-portion population qualification.
- TCX: FY2022 Két Vàng managed-investor-payable/complete financing population.
- MBB: authoritative regulatory capital effective 2026-06-30 unavailable.
- VIB: current regulatory capital unavailable and unresolved headline/customer-loan NPL definition bridge.
- VIC: qualifying reviewed consolidated 6M2026 original unavailable.

The exception register retains original issue IDs, true severity, source-register hash, exact detail and deterministic reopen evidence. Price movement, sentiment, ranking needs and desired counts are invalid reopen types. New evidence requires a newly reviewed partition/acceptance; nothing automatically promotes a ticker. The original governance Major issue for independent DI14 is also retained outside the ticker Level-1 ledger. Owner approval closes only the earlier partial-universe-policy decision, not the six accounting/source issues or DI14.

## DI15 and DI14 result

The Owner's condition 8 requires every other mandatory DI gate to remain satisfied. Therefore this implementation separates structural quarantine PASS from release DI15 PASS. The reconstructed partition is valid, all 25 admission candidates have no unresolved material Level-1 blocker, all 5 are completely quarantined and no shared-system corruption is observed. However, exact new-release approvals for DI3–DI12 and independent DI14 are PENDING. This does not erase prior technical reports or mark historical work unexecuted; it avoids inventing a completed independent Policy B release acceptance from ticker closure/tests alone. **DI15 remains FAIL until those mandatory gates are satisfied.** Independent DI14 and DI15 can then be evaluated together against an exact reviewed final release; structural PASS supplies no authority on its own.

The DI14_UPDATED_CANDIDATE binds Owner policy/hash, acceptance/partition versions, full universe hash, final partition/exception register hashes, all 30 unchanged snapshot hashes, the base commit plus exact file overlay and tests. Reviewer signoff, final review commit and independent capability remain null. No real acceptance row, review capability or production readiness was created.

## Governance scope and compatibility

The five M1 documents already require VN30-only, evidence-first decisions, missing-data honesty, no neutral scoring and no new capital under LOW confidence/material uncertainty. A single dated approved amendment is the minimum clarification; no M1 baseline is broadly rewritten. M8's v1 table and historical pending reports remain intact; the new approved addendum explicitly supplies prospective v2 authority. POLICY_AUTHORITY_TRACE.json and POLICY_CHANGELOG.json record before/after rules, rationale, approval, effective date, exact frozen baseline hashes, affected contracts and compatibility impact. No unrelated registry, methodology weights, database schema or source package is promoted.

During development, strict protected replay caught in-place edits of frozen baseline source files. Those edits were restored byte-for-byte and the implementation moved to additive versioned modules; failed logs are retained. A new timestamp-validation regression also caught microsecond precision where the repository requires UTC milliseconds. The new universe reference now derives a conservative millisecond capture upper bound from retained receipt timestamps; this is operational capture knowledge, not an invented issuer publication time. Historical source timestamps/facts remain unchanged. An initial composition-layer boundary failure was fixed by moving the new factory to the existing server-only composition layer; the boundary rule was not weakened.

## Validation

See TEST_RESULTS.json, REGRESSION_RESULTS.json, PROTECTED_REPLAY_RESULTS.json and validation-logs for actual commands/counts/exits, all initial failures and final retests. Source/evidence preservation checks cover the complete current 30 dispositions and all historical ticker producers; structured certification, fundamental-data tests, DI acceptance, architecture, lint/typecheck, DB and full application/E2E checks are recorded separately. No tests or configuration were weakened; the full suite uses the previously documented command-level 60000ms timeout for slow backup checks, with unchanged assertions. No existing tracked source/evidence change is included; any E2E-generated screenshots are restored from starting HEAD.

**STOP. Await “Review DI15 Partial-Universe Amendment”.**
''')
print('Documented authority, versioning and final outcome candidate')
