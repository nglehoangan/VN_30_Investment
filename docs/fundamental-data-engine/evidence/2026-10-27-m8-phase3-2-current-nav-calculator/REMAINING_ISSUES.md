# Remaining Issues

Date: 2026-10-27. Scope: Phase 3.2 isolated implementation only.

No known unresolved Phase3.2 implementation defect after final tests. Review classifications below distinguish fixed local defects from external blockers.

|Finding|Severity|Disposition|
|---|---|---|
|Cross-ledger market identity reuse could double-value same instrument|MAJOR|Fixed reverse UUID/provider/ISIN uniqueness; tested|
|Incomplete semantic result hash left permission/nonpositive fields outside digest|MAJOR|Fixed complete semantic hash; independently reconstructed in test|
|Proof fixture accidentally copied C and undermined reproducibility|MINOR|Fixed declared-only fields and strict proof schema; malformed extra-field test|
|Date-only component error diagnostic lacked explicit boundary reason|MINOR|Fixed explicit rejection reason|
|New test callback returned result / branded IDs/times incorrectly typed|MINOR|Fixed fixtures/types without weakening gates|
|Correction test retained original tradeDate after changed effective date|MINOR|Fixed synthetic trade facts to existing invariant; no domain gate changed|
|Actual authenticated source/identity/independent evidence missing (B1)|CRITICAL|External blocker preserved, ESCALATED|
|Actual economic/release/deployment gaps B2–B7|MAJOR|External blockers preserved|

Limits: no real accepted input provider or authority verifier, no operational integration test, no trusted-clock infrastructure, no snapshot store or publication route. These are deliberate scope/dependency limits. No AS_KNOWN or current-account-now support. Negative arithmetic is verified without inventing a valid no-margin debt ledger. Read-only actual test deliberately has no input plan; it does not establish completeness from stored balances.

Role review: CIO preserves no-release/source authority; portfolio manager confirms no cash/rights double counting; research analyst restricts indicative/full/subtotal semantics; risk manager preserves unknown-obligation/revocation/negative controls; architect confirms isolated read ports/revision pins. These are the implementing agent’s technical review perspectives, not independent signed acceptance.
