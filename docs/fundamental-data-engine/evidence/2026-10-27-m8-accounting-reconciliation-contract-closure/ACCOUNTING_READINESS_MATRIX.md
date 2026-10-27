# Accounting readiness matrix

Assessment date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 1 design/evidence closure only. Owner approved the prior architecture assessment as baseline v1.0 in the current task; this is not authenticated source/identity acceptance or Phase 2 authorization. Original baselines and sealed evidence remain unchanged. SOURCE_REFERENCES.json pins inspected files; JSON Pointers below address those pinned bytes.

READY describes the explicitly scoped contract or existing technical capability, not effective production acceptance.

|Component|Status|Missing evidence / owner decision|Acceptance / contract / migration / validation|
|---|---|---|---|
|Original12/24 replay, immutable book|READY technical|None for exact replay; economic completeness separate|Existing accepted method unchanged; actual replay PASS; no migration|
|Broker-only perimeter|PARTIALLY_READY|Ratify linked-bank exclusion and subaccount perimeter|Contract review; source account mapping; flow classification tests|
|Opening cash/obligation economic reconciliation|BLOCKED|500k definition,105 debt,07→08 complete events|Broker dated records; independent reconciliation; no plug; potential liability event contract|
|570k claim allocation|BLOCKED|Exact GAS/MWG claims, net/gross/tax and issuer/action|Accepted allocation references to original leg; additive metadata/index review|
|MWG95k forward receipt|PARTIALLY_READY evidence|Opening claim link + accepted settlement extension|No DIVIDEND_CASH duplicate; atomic settlement tests; no current posting|
|GAS475k remaining claim|BLOCKED|Entitlement and unsettled balance, overlap with cash-equivalent|Broker/source independent acceptance; explicit residual tests|
|Historical17/93/29 files|READY offline arithmetic|Not an approved lifetime book/zero start|No import; hashes/row references and93 cash conservation verified|
|11 current positions|PARTIALLY_READY|Forward completeness, identity and FPT status|Opening quantity replay valid, not current completeness; status schema review|
|FPT pending20|BLOCKED authoritative lifecycle|Action/recognition/conversion and basis evidence|No extra20; interval/status model requires approved extension; transfer tests|
|Imported MWAC replay|READY technical|Original basis provenance differences unresolved|Keep exact numeric method; no rounding change|
|Lifetime MWAC/realized history|BLOCKED|Certified start, action terms and basis differences|Separate approved versioned book/rebase only; not current-management prerequisite|
|Forward BUY/SELL/cash basic engine|PARTIALLY_READY|Accepted actual events/source and atomic governance audit|Existing transaction/CAS not sufficient operational authority; rollback/CAS tests|
|Nontrade claim settlement|PARTIALLY_READY design|Approve new event + allocation/version semantics|Versioned extension; possible additive persistence; full synthetic regression before Phase2 acceptance|
|Liability/interest completeness|BLOCKED|105 lifecycle, unsupported claim/debt/income categories|Owner/source qualification; explicit missing-state and posting contract; no guessed events|
|Production NAV/scoring/D2|BLOCKED, outsidePhase1|Qualified identity/source/calendar/price + reconciled full economic state|No activation; future NAV phases independently authorized|

No automatic dependency from missing daily NAV to basic accounting. Missing current obligations/status still blocks complete economic reconciliation. M7 restrictive release verdict and its outstanding independent validation remain unchanged; architecture baseline v1.0 approval is not unrestricted M7 release. Ready technical operations do not authorize implementation/import/source approval.
