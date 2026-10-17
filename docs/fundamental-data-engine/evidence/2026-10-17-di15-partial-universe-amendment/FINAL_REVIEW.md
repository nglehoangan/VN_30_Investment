# DI15 Partial-Universe Amendment

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

SCORABLE admission candidates: ACB, BID, BSR, CTG, FPT, GAS, GVR, HDB, HPG, LPB, MCH, MSN, MWG, SAB, SHB, SSB, SSI, STB, TCB, VCB, VHM, VJC, VPB, VPL, VRE.

DEFERRED: MBB, TCX, VIB, VIC, VNM.

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

**Final validation: 1,902/1,902 full-suite tests, including 98 new regressions; 12/12 browser E2E; 32/32 protected replay commands; structured certification, fundamental-data, boundaries, lint, typecheck, database validation and production build PASS.**

The initial full-suite run encountered two historical screenshot hash failures while browser testing regenerated protected images. All 48 original images were restored byte-for-byte, and the sequential full-suite rerun passed. No assertion or expected hash was changed.

See TEST_RESULTS.json, REGRESSION_RESULTS.json, PROTECTED_REPLAY_RESULTS.json and validation-logs for actual commands/counts/exits, all initial failures and final retests. Source/evidence preservation checks cover the complete current 30 dispositions and all historical ticker producers; structured certification, fundamental-data tests, DI acceptance, architecture, lint/typecheck, DB and full application/E2E checks are recorded separately. No tests or configuration were weakened; the full suite uses the previously documented command-level 60000ms timeout for slow backup checks, with unchanged assertions. No existing tracked source/evidence change is included; any E2E-generated screenshots are restored from starting HEAD.

**STOP. Await “Review DI15 Partial-Universe Amendment”.**
