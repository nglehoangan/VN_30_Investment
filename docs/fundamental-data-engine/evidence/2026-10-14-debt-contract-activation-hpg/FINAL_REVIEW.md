# Debt metric contract activation and HPG re-evaluation — final review

Starting HEAD: `257a55dab28e510a8349c6e0d89c5d7c4c555c30`.
Scope: Owner-approved debt semantic contract activation and HPG only. No other ticker closure, official scoring, ranking, Top10, DCA or investment decision was run.

## Separate verdicts

**CONTRACT ACTIVATION: A. PASS**

**HPG: C. HPG BLOCKED — MATERIAL DATA GAPS REMAIN**

The Owner-approved non-financial contract is active as `nonfinancial-debt-contract-v2`, effective and recorded at `2026-10-14T08:37:39.885Z`. The debt CORE group accepts compatible COMPREHENSIVE_FINANCIAL_DEBT or REPORTED_BORROWINGS, with comprehensive preference only after separate exhaustive proof. Default basis is consolidated issuer-reported carrying amount in VND. Legacy FINANCIAL_DEBT and pre-effective frozen replay retain their exact prior semantics; unrelated proposed base registry/crosswalk items are not promoted. BANK/SECURITIES/INSURANCE requirement definitions are unchanged.

Canonical registry, requirement groups, sector routes, metadata admission, uncertainty, M3 accounting projection and scoring/derivation guards are versioned consistently. Reported metadata cannot imply comprehensive completeness. A comprehensive proof needs separately retained exact dimensions, verified financing classes and a non-overlapping quantity reconciliation. Conflicting reported population receipts quarantine the debt group. Generic reported cash cannot supply qualified unrestricted cash; normalized EBITDA and lease treatment need separate qualified evidence. No materiality threshold, EBITDA or annualization was invented.

## HPG production admission and coverage

All five issuer sources were independently re-confirmed from retained qualified PDFs. Scope, periods, VND, carrying basis, short/long reconciliation, current portion counted once, known financing population and source/proof hashes were checked. Five REPORTED_BORROWINGS facts are SAFE_DERIVED from admitted issuer borrowing components:

| Period | Reported borrowings (VND) |
| --- | ---: |
| FY2022 | 57,900,321,604,873 |
| FY2023 | 65,381,002,473,117 |
| FY2024 | 82,963,129,469,555 |
| FY2025 | 92,174,151,302,217 |
| 6M2026 | 98,529,977,232,553 |

6M2026 short borrowing remains the corrected 71,433,383,400,905 VND. Principal amount is not proven. Unknown miscellaneous liabilities remain UNKNOWN, separately quantified, outside reported borrowing quantities, with materiality UNASSESSED. No comprehensive debt fact was admitted.

Actual requirement coverage, with unchanged denominators:

| Tier | Admitted/required | DIRECT_STRUCTURED | SAFE_DERIVED | PDF_VERIFIED | ISSUER_VERIFIED | FALLBACK_REQUIRED | PROVIDER_ANOMALY | CONFLICT | UNAVAILABLE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| CORE | 35/35 | 17 | 5 | 13 | 0 | 0 | 0 | 0 | 0 |
| SECTOR_CORE | 5/5 | 4 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| SUPPORTING | 30/40 | 13 | 0 | 17 | 0 | 0 | 0 | 0 | 10 |

CORE changes from 30/35 to 35/35 solely through five admitted reported-borrowing facts under the approved anyOf group. SECTOR_CORE stays 5/5 and SUPPORTING stays 30/40. This is HPG coverage, not a VN30-wide admission claim. All 79 previous canonical facts are byte-preserved; DIRECT_STRUCTURED fact count remains 42. FY2024 CFO 6,608,320,655,215 VND and cash CapEx 35,495,026,797,327 VND remain PDF_VERIFIED and the CafeF false zeros stay vetoed. Existing structured certificates were not weakened.

The active CORE/SECTOR_CORE fallback queue has zero missing groups. Ten supporting definition requirements remain; the 77 retained provider tasks are preserved separately from active requirement denominators. No broad PDF extraction or new issuer campaign was performed. Five retained qualified issuer PDFs support the new debt admission; verified PDF CORE fallback remains 13/35 and SECTOR_CORE fallback remains 1/5.

Current trajectory and overall financial evidence remain PARTIAL, financial confidence LOW, fundamentalScorable false. NET_DEBT remains N_R because unrestricted economically available cash is unproven. Normalized/downside EBITDA and lease comparability remain unavailable. Comprehensive debt remains unproven.

## Remaining issues and governance

Critical: 0. Major HPG issue groups: 4. Minor: 0. Contract activation blockers: 0.

1. Miscellaneous financing classification/materiality remains unassessed; comprehensive population is unproven.
2. Unrestricted economically available cash, normalized/downside EBITDA and compatible lease treatment are not established.
3. Ten supporting definitions remain unavailable: five common-share earnings requirements and five economic operating-profit requirements.
4. Historical publication-time evidence remains insufficient for PIT readiness.

Quantitative CORE completion does not approve HPG ticker closure. DI14 remains AWAITING_INDEPENDENT_REVIEW; DI15 remains AWAITING_PROJECT_OWNER_APPROVAL. This review grants neither gate. HPGClosureApproved=false, readyForScoring=false, decisionReady=false. Insufficient/blocked symbol in this scoped re-evaluation: HPG.

## Validation and independent replay

Complete frozen-source suite: 102 files / 1,279 tests passed. Focused debt/HPG/certification/sector/manual/M3 suite: 10 files / 208 tests passed, including 32 permanent activation tests and every mandatory regression. Architecture suite: 8 files / 98 tests passed. Lint, typecheck, boundaries, database validation and whitespace checks all exit 0. One intermediate typecheck diagnostic was resolved; its failed log and the final passing logs remain retained.

Exact commands, exit codes and log hashes are in [TEST_RESULTS.json](TEST_RESULTS.json). Final commands:

- `pnpm test` — exit 0
- `pnpm exec vitest run tests/unit/debt-contract-activation.test.ts tests/unit/debt-metric-contract-proposal.test.ts tests/unit/hpg-debt-final-closure.test.ts tests/unit/hpg-ticker-closure.test.ts tests/unit/structured-certification.test.ts tests/unit/hybrid-targets.test.ts tests/unit/fundamentals-contracts.test.ts tests/unit/decision-sector.test.ts tests/unit/manual-first.test.ts tests/unit/scoring-bridge-derived.test.ts` — exit 0
- `pnpm lint` — exit 0
- `pnpm typecheck` — exit 0
- `pnpm test:boundaries` — exit 0
- `pnpm db:validate` — exit 0
- `node scripts/activate-debt-contract-hpg.mjs` — exit 0
- `node scripts/verify-debt-contract-activation-hpg.mjs` — exit 0
- `git diff --check` — exit 0

Independent offline replay passes 20/20 checks, reproduces 14 producer artifacts byte-for-byte and exactly replays the frozen pre-activation HPG snapshot. All 1,408 historical evidence artifacts and 8 database hashes remain unchanged. The independent issuer confirmer checked quantity provenance; the independent reviewer challenged architecture, accounting, risk, QA, complete suite results and replay. See [HPG_ISSUER_CONFIRMATION.json](HPG_ISSUER_CONFIRMATION.json), [INDEPENDENT_REVIEW.json](INDEPENDENT_REVIEW.json) and [INDEPENDENT_REPLAY.json](INDEPENDENT_REPLAY.json).

## Changed implementation files

- `docs/03 SCORING/DEBT_METRIC_CONTRACT_v2.md`
- `scripts/activate-debt-contract-hpg.mjs`
- `scripts/verify-debt-contract-activation-hpg.mjs`
- `src/domain/fundamentals/contracts.ts`
- `src/domain/fundamentals/debt-contract-v2.json`
- `src/domain/fundamentals/debt-contract.ts`
- `src/domain/fundamentals/hybrid-admission.ts`
- `src/domain/fundamentals/hybrid-sufficiency.ts`
- `src/domain/fundamentals/manual-first.ts`
- `src/domain/fundamentals/manual-fundamental-evidence-requirements-v2.json`
- `src/domain/fundamentals/scoring-bridge.ts`
- `src/domain/fundamentals/validation.ts`
- `src/domain/scoring/evidence.ts`
- `src/domain/scoring/metrics.ts`
- `src/infrastructure/fundamentals/canonical-registry.ts`
- `src/infrastructure/fundamentals/debt-canonical-items-v2.json`
- `src/infrastructure/fundamentals/debt-derivation-crosswalk-v2.json`
- `src/infrastructure/fundamentals/derivation-crosswalk.ts`
- `tests/unit/debt-contract-activation.test.ts`

All new closure evidence is in this directory. SOURCE_CHANGES.json binds implementation hashes; ARTIFACT_HASHES.json seals every evidence file except itself and separately binds implementation sources. The local closure commit containing this review is the final task commit; its SHA is returned in the completion response. No historical evidence was modified.

Stop after this activation and HPG re-evaluation. Further HPG qualification and reserved DI/Owner gates require separate authorization and review.
