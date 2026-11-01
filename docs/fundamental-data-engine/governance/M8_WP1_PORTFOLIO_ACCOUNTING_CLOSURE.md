# M8 Full Production v1.0 — WP1 Portfolio Accounting Closure

Date: 2026-11-01, Asia/Ho_Chi_Minh. Scope: WP1 only, full production criteria preserved.

## 1. Executive summary

**Final state: `WP1_BLOCKED_REMEDIATION`.** Economic explanations and read-only detection are now reproducible, but actual production accounting/admission is not closed. No material difference is dismissed merely because cash plus claims agrees. This is a remediation delivery with executable checks, not another unchanged assessment. It is not production acceptance or a request to reconfirm known owner facts.

The owner-confirmed MWG receipt explains cash +95,000 and claims −95,000. The 420 custody fee is accrued payable, not settled. TCB is 150 owned = 100 available +50 pending in the retained 29 October observation, while the ledger remains 100. FPT remains 220 owned =200 available +20 pending, with imported total cost conserved. These explanations close the factual questions, not the corresponding production issue IDs. No production blocker is declared fully closed by a diagnostic test.

No actual-account ledger posting, correction, production migration, source promotion, production activation, push, merge or WP2 work was performed. Existing integration fixtures exercise postings/migrations only in isolated temporary test databases. No opening history, dated personal observation, original assessment, source seal or approved authority was edited. The dashboard retains its approved dated owner display; the new checker is an offline reconciliation component, not an activated production guard.

## 2. Exact commit and evidence baseline

- Starting HEAD: `e51ec112fb8bd0d7bb1d1b5b4a322ca72e791925`; clean working tree. This includes the successor owner confirmations. Historical A1 assessed `01d7aeeb9ebe9b098404a3f65f9d6628f29a873b`; governance evidence remains scoped to `b3f432d24c93f8574171d848132c5fa7b52c414b`.
- Required baselines: [pipeline re-approval](DATA_PIPELINE_REAPPROVAL_2026-10-31.md), [A1 assessment](PORTFOLIO_PRODUCTION_ACCEPTANCE_ASSESSMENT.md), [production acceptance contract](../../08_CONTINUOUS_IMPROVEMENT/PRODUCTION_ACCEPTANCE.md), [successor owner record](PORTFOLIO_OWNER_CONFIRMATIONS_2026-10-31.md) and its adjacent JSON. The contract remains full production; selecting Full Production does not waive PA1–PA20.
- Actual replay evidence: [retained-accounting-audit.json](../evidence/2026-11-01-m8-wp1/retained-accounting-audit.json). It records all protected DB/account-current hashes, observed partitions, exact original claim pointer, receipt cells and balances without private account identifiers. The database remains `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65`.
- [validation.json](../evidence/2026-11-01-m8-wp1/validation.json) records exact commands, outcomes, test identities and candidate artifact hashes. A delivery commit identifies this package; it does not extend earlier approval baselines. The commit SHA is returned with delivery, avoiding a self-referential commit hash inside its own bytes.

Actual data: 12 opening transactions/24 stored legs, 11 positions, imported total basis 81,980,830 VND. All saved legs match stored rows; domain transaction rebuilding and replay are exercised against the actual private fixture. Source observations are dated evidence, not current balances on 1 November. Receipt/known/economic dates are not interchangeable.

## 3. Single consolidated blocker register

This is the sole WP1 blocker register. Existing IDs are reused; no duplicate B1/B2/B4/B5 issues are opened. `ESCALATED` carries A1 section 9's unresolved production residuals and its referenced historical escalation record. Historical review counts are not recast as failed code-fix counts. Exact unsuccessful implementation-attempt counts are not established; no counts are invented. Any subsequently evidenced count >2 must remain ESCALATED. C01 and M04 have no supported >2 failed implementation history.

| Existing ID / state | Exact evidence and root cause | Missing dependency / remediation owner | Acceptance criteria / permission under WP1 |
| --- | --- | --- | --- |
| **PA1-C01 — PARTIALLY REMEDIATED; production BLOCKED** | Owner record fact `TCB_PENDING_50`; latest holdings `/data/stock/6` =150/100/50; audit `ledgerPositions` TCB100. Revision-bound owner model follows opening ledger; raw pending rights have no accepted accounting application. New checker exposes +50. | Financial systems engineer: exact account/action/economic-time intake binding and prospective application proposal; financial reviewer: pending ownership/cost/valuation treatment. Effective/conversion date and broker action ID are unknown, not presumed missing owner confirmation. | 100available+50pending represented without new purchase, duplicate50 or changed total basis; exact evidence/cutoff, lifecycle and valuation treatment reviewed; separately authorized immutable application reconciles. **Permitted:** detection/tests/proposal. **Not permitted:** posting/correction or changing active owner snapshot. |
| **PA1-M01 — ESCALATED; production BLOCKED** | Owner source policy and successor record; audit verifies seven file pins, all observation body hashes and private account-scope equality. `ImmutableBrokerEvidenceReader` still observes rather than admits. Hashes/local account matches do not prove external authenticity or purpose authority. | Data/source reviewer + financial systems engineer: accepted account→instrument→economic-unit/action/time mappings, provenance/authenticity review and exact production-purpose bindings. Reuse existing B1 identity/imported-cost dossiers. | Every unit/claim and source is accepted for the proposed cutoff/purpose; mismatched, revoked or ambiguous evidence fails closed. **Permitted:** inventory/validation. Source promotion or widened authority requires separate authorization. No compulsory historical PDF chain or repeated ISIN request. |
| **PA1-M02 — ESCALATED; explanation RESOLVED, application BLOCKED** | Owner record facts `CASH_95000`, `DIVIDEND_RECEIVABLE_TO_CASH`, `CUSTODY_FEE_420`; CASH_HISTORY `/reports/1/rows/57`; opening claim pointer and opening ledger receivable leg below. Original imported aggregate claim was not allocated/admitted into an actual settlement; fee observation was not an accounting accrual. | Financial systems engineer: typed allocation/receipt IDs, exact supported economics/knowledge time and fee accrual proposal, bound to existing evidence. Financial reviewer: admission and completeness at selected cutoff. Owner: separate authorization only after a reviewable event proposal exists. | Accepted MWG receipt settles 95,000 exactly once (cash+, claim−, no income/deposit), remaining475,000 preserved; fee liability420 recognized without invented payment; actual ledger replay matches accepted components. Duplicate/partial/over-settlement and reversal controls pass. **Permitted:** pure tests and read-only bridge. **Forbidden:** balancing transactions, real postings or migration. |
| **PA1-M03 — ESCALATED; dependent valuation gate BLOCKED** | A1 M03; re-approval M1 close references and `PROVIDER_UNDECLARED` basis; NAV qualification rejects unsupported purpose/action units. Display integration is already closed. | Market-data/valuation reviewer: accepted source/session/calendar, action/adjustment semantics and pending-unit price policy. This is a production valuation dependency, not another API/display fix. | Every priced unit has accepted purpose/session/action-compatible price and provenance; unknown basis or stale/conflicting data blocks. **Permitted:** retain limits/test rejection. No source qualification or price-authority promotion granted. |
| **PA1-M04 — DEPENDENCY BLOCKED** | A1 M04 and `src/application/current-nav/input-provider-skeleton.ts`: no complete accepted plan; deliberate null provider is not cured by arithmetic agreement. | Application engineer after M01/M02/M03/M05: separately scoped complete provider/authority/composition proposal and authorization. | Accepted actual inputs with coherent revision/evidence/cutoff reach intended calculator and reproduce oracle results; activation separately authorized. **Permitted:** offline diagnostic support. Full production integration/activation is outside WP1 permission. |
| **PA1-M05 — ESCALATED; ownership policy RESOLVED, lifecycle/valuation BLOCKED** | Owner `FPT_PENDING_20` and `TCB_PENDING_50`; audit FPT220/200/20 and TCB150/100/50. FPT opening basis16,065,060. Owner snapshot includes pending in aggregate; this is not accepted rights valuation or a conversion event. | CA/financial reviewer + engineer: accepted action/unit/cutoff semantics, valuation policy and actual conversion/debit evidence only when conversion/settlement is claimed. Unknown future conversion/payment dates remain null. | No double20/50, no early tradability/cash, total cost conserved; availability conversion never increases aggregate ownership; unsupported pending valuation blocks. **Permitted:** validation/lifecycle regression. No production entitlement/settlement posting or valuation admission. |
| **PA1-M06 — ESCALATED; full-production historical/PIT dependency BLOCKED** | A1 M06/HISTORY: cash/trade history does not supply accepted per-date positions, action-compatible prices, claims/debt and knowledge-time lineage; supported ledger inception8October2026. | Historical validation engineer + financial reviewer: frozen historical accounting/valuation/PIT package and independent recomputation; recover only genuinely missing event evidence after retained inventory. | Required historical scope reproducible per date with missing periods explicit; no retroactive knowledge leakage or fabricated performance curve. **Permitted:** preserve gap. WP1 does not waive Full Production historical requirements or replace them with a narrower release. |
| **PA1-M07 — ESCALATED; release dependency BLOCKED** | Re-approval/production acceptance PA7–PA10, PA16–PA20; A1 M07: engineering/authority checks are not E3/M7/operational acceptance. | QA/financial/release reviewers: exact release, actual-case oracle and source/admission/recovery/operational/security evidence; owner: later explicit production decision. | Required production gates and genuine reviewer provenance pass against exact release, no unresolved material financial issue; separate activation authorization. **Permitted:** WP1 evidence preparation only. No acceptance/activation flag or authority change. |

M03/M04/M06/M07 are carried dependencies, not new work packages started here. Completed migration, API4.16/4.17 remediation, direct display prices, bounded B1 identity and selected B5 imported-basis work remain closed. The entire production IDs C01/M01/M02/M05 remain open despite factual subclosures. Missing engineering bindings must not be relabeled `OWNER_EVIDENCE`.

## 4. TCB findings

Retained 4.14 observation ID `TCBS_API_RESPONSE:99fcccfa342efaa7587aa48ffeafa3646f8230fc119946a57726762e5b2b448a`, received `2026-10-29T04:56:24.764Z`; `/data/stock/6/{totalQtty,availableTrading,stockDividend}` =150/100/50. Opening source `TCBS_API_RESPONSE:eb2aa9ffb0894ac080aa8cfbce2eca7d86628ba5a346b8ef78e2d8d450786c62`, received `2026-10-08T11:38:01.650Z`, shows100/100/0. Owner confirmation explicitly acknowledges the retained pending50. The 28October owner view remains100 and is not silently rewritten or backdated.

Exact discrepancy: **ledger aggregate ownership is short50 relative to the later provider partition**; available100 itself agrees. These are pending stock-dividend rights/shares, not an extra cash purchase or150tradable. Current evidence does not establish creation/entitlement/conversion timestamps or production rights-price semantics. The checker reports this mismatch, missing action evidence and unknown common economic cutoff; it never returns a posting or eligible pending valuation. Any eventual bonus application must conserve imported total TCB basis, rather than capitalize an invented purchase price.

## 5. Cash and dividend reconciliation

Original ledger obligation: `tcbs-personal-v1:opening:cash:leg:2`, receivable570,000; saved opening evidence `BROKER_SNAPSHOT:cc46785ff2d4f7477911d0cb7dad6ee38b872b5cc6a8566a78683637fdf43852`. The corresponding retained opening4.14 MWG row `/data/stock/4/cashDividend` is95,000, and GAS row `/data/stock/1/cashDividend` is475,000. This supports the issuer breakdown of that observation; it does not retrospectively assign the anonymous475,000 in the28October image to GAS.

Receipt: [CASH_HISTORY.json](../evidence/2026-10-28-b2-cash-excel-screen-review/CASH_HISTORY.json) `/reports/1/rows/57`, workbook2026 row71, A71–E71. Date16October, MWG description, record date08October, net95,000, ending cash327,420. Latest4.14 MWG pending is0. Issuer, record-date description and original claim evidence support the bridge, not merely amount equality. Exact broker action ID remains null. Source row has a date, not an intraday credit timestamp; no midnight economic event is invented. The receipt is known from a later supplied/exported statement, not assumed available at the original opening knowledge time.

| Component | Opening ledger | Explained movement | Dated owner observation |
| --- | ---: | ---: | ---: |
| Cash | 232,420 | MWG received +95,000 | 327,420 |
| Claims/pending | 570,000 | MWG settled −95,000 | 475,000 |
| Cash+claims | 802,420 | 0 | 802,420 |
| Custody payable | 0 | Observed accrued +420; no posted accrual | 420 |

The first three rows establish the owner-confirmed economic bridge, not a posted settlement or a certified common-instant production snapshot. Current327,420 already includes the receipt; current475,000 already excludes it. Do not repeat either adjustment. Receipt is not newly earned dividend income or external contribution, and cash dividends do not reduce the chosen imported cost basis. Production residue: allocate the existing aggregate leg with exact, reviewed source/claim/receipt/effective-known-time bindings and completeness review, then seek separate posting authorization. No balancing entry is proposed.

## 6. Custody fee reconciliation

420 VND is owner-confirmed **accrued custody fee payable at28October**, repeated as `depoFee` in the29October balance observation. The latter also reports cash327,420 and `avlWithdraw`327,000; this is provider-field evidence, not an actual420cash debit. No fee payment or settled-fee status is supported. Daily rate, accrual inception and actual deduction date remain unknown. A month-end policy is not proof that payment occurred on31October.

Ledger payables0 versus observed accrued420 is an explained but unapplied liability discrepancy. Keep cash327,420; never subtract420again from broker-reported NAV, which already nets it. Cash+pending less accrued fee is802,000 for this dated diagnostic bridge, not NAV. New fee diagnostics reject a claimed payment with no debit; even equal debit amounts require account/obligation admission and cannot authorize settlement. Required future work is a supported accrual proposal and actual debit matching only if payment is claimed.

## 7. FPT corporate-action findings

Both retained opening/latest observations show total220, available200, pending20. Existing ledger quantity220 and imported basis16,065,060 already include the20ownership units. They must not receive another20-share ownership posting. The existing owner instruction associates pending with `FPT_WFT`; the provider row labels `stockDividend`, not a fully admitted legal action identity.

Cost conservation: unchanged total imported basis across200available+20pending and any evidenced future220available+0pending partition. Available-share conversion changes availability only; it is not another acquisition or automatic income. Actual private replay checks quantity220 and basis16,065,060; synthetic lifecycle regression checks aggregate220through availability conversion. No actual conversion date or conversion event has been found/claimed.

Owner display may use dated ordinary prices under its existing explicit display scope. It does not establish accepted pending-right valuation. Production pending-unit eligibility stays false; missing action/valuation evidence blocks full production valuation rather than pricing pending units at zero or freely tradable ordinary prices.

## 8. Source admission status

Reused the closed Excel-preferred B1 policy, selected imported B5 cost and owner facts. Seven successor-record file pins verified. Actual DB observation body hashes verified; opening/latest holdings match their pinned IDs/times/values, and latest raw-text hash and normalized/raw stock data agree. Profile/holdings/balance and opening/latest account scope compare privately without copying identifiers. See the audit for exact counts/hashes.

Opening4.14 stores a normalized envelope but no `raw` text; latest4.14 has both. This is an explicit original-evidence limit, not a recreated raw file or failed hash hidden as a pass. Observations and statement receipts remain evidence, not source authenticity proofs. No external broker signing or independently accepted production provenance is asserted.

Remaining production-specific work: exact source admissibility/purpose, account/instrument/action/economic-unit and effective/known-time mappings, lifecycle/settlement completeness, and the actual production review contract. These require an engineering/admission package first. No repeat Excel/PDF/ISIN request or new owner-evidence upload request is justified by the five saved facts. Formal source promotion remains separately authorized.

## 9. Implemented fixes

- Added `src/domain/portfolio/ownership-reconciliation.ts`: immutable pure reconciliation of ledger aggregate versus provider total/available/pending; explicit source/account, perimeter, receipt age/future-time and economic-cutoff checks; duplicate/integer/negative quantity guards. Missing action evidence stays visible even when aggregates agree. Results never accept production or pending valuation and produce no ledger commands. Receipt age policy is supplied by the diagnostic caller, not asserted to be an approved production policy.
- Added a read-only custody payable/debit inspector in the same module; payment claims without actual debit fail support checks; equal debit amounts still cannot establish admission.
- Added `scripts/audit-wp1-accounting.py`: immutable/read-only SQLite with refusal of nonempty WAL/journal, integrity/FK checks, owner pin/all body hash verification, latest raw comparison, private account-scope checks, actual saved-leg comparisons, exact Decimal cash/claim bridge and protected-byte verification. It performs no API call or result persistence to the application DB. Stdout is sanitized diagnostic evidence; `--transactions` exposes local saved transactions only to the private replay test and is not persisted in this package.
- Added unit regression tests and opt-in actual-private-DB integration tests. Standard clones explicitly skip the latter unless `WP1_PRIVATE_DB=1`; this delivery executed them with the flag, without skips. Existing tests remain unchanged.

The new module is exercised by the private integration harness; it is intentionally not wired into dashboard/production composition. It cannot make the production provider eligible or change the dated owner data.

## 10. Validation evidence

Exact executed commands, per-file/per-case results and hashes are in [validation.json](../evidence/2026-11-01-m8-wp1/validation.json). **Final combined run: 279/279 passed across 12 files, zero failures and zero skips.** This is the authoritative non-overlapping test total; earlier focused/integration runs overlap and must not be summed. All commands use supported Node22.23.2 via `/private/tmp/node-v22.23.2-darwin-arm64/bin` where Node is required.

Coverage includes actual12transaction/24leg reconstruction and FPT cost replay; cash/claim/source read-only reconciliation; portfolio integration/regressions; dividend allocation/partial/duplicate/over-settlement/reversal; corporate actions and financial invariants; personal display and NAV qualification/adapters. Explicit negative cases:

| Required negative case | Executable evidence |
| --- | --- |
| Duplicate dividend settlement | Existing `tests/unit/dividend-settlement.test.ts` distinct-event/source duplicate receipt and reversal reimport rejection; integration duplicate/atomic settlement regressions |
| Pending treated as tradable | New ownership partition failure and preserved100/50,200/20 tests; existing current-NAV pending-right rejection |
| Incorrect ownership totals | New TCB+50, FPT duplicate20, malformed totals, fractional/negative/duplicate/perimeter tests |
| Unsupported fee settlement | New custody claimedPaid/no-debit and unmatched-debit tests; equal amount alone never admits payment |
| Source mismatch | New account/source-reference mismatch; existing NAV adapter source/hash/scope tests |
| Stale observation | New stale/future receipt and unknown/mismatched economic-cutoff tests; existing adapter time checks |
| Missing corporate-action evidence | New missing-action checks on both actualTCB/FPT and synthetic fixtures; existing unsupported CA/NAV checks |

TypeScript, changed-code ESLint and architecture boundaries were checked. The initial typecheck found an incorrect test-only type import (`PostedTransaction`); corrected to existing `Transaction`. A later typecheck caught replacement of a readonly fixture array element; changed to editing the fixture element fields. Final typecheck was rerun successfully. The first audit assumed the opening envelope contained `raw`; corrected to report original raw availability explicitly while retaining body-pin checks. No source bytes were changed to satisfy either check.

Full repository suite, full lint/build/browser, new E3 independent acceptance, security/recovery/release rehearsals and live broker calls were not run for WP1; no broader PASS is claimed. Existing successful migration/authority/recovery evidence remains historical and scoped. This package does not fabricate an independent reviewer or re-sign the release.

## 11. Remaining blockers

C01: accepted TCB pending accounting application; M02: actual admitted MWG settlement/allocation and accrued fee application; M01/M05: exact production source/action/lifecycle/valuation bindings. Dependencies M03/M04/M06/M07 remain as in the register. Unknown actual dates remain null, rather than conditions to fabricate dates or reconfirm ownership. Full production cannot pass while these are unapplied or unaccepted.

## 12. Required owner decisions

No reconfirmation or upload is requested for TCB50, MWG95,000, cash327,420/pending475,000, custody420or FPT20. There is no new contradictory evidence in this package.

Before a later accounting application, the engineer must produce a concrete reviewable proposal binding the original claim leg, real receipt, dated fee obligation and TCB pending unit to exact source IDs/hashes, supported effective/known times, ledger revision and preserved costs. The owner would then separately authorize the precise ledger posting/correction, if appropriate. The present prompt expressly withholds that authority; this report is not a generic posting request or a request to invent missing dates/action IDs.

The production review must choose an explicit coherent accounting/valuation cutoff and admissibility/pending-right policy within Full Production requirements. Reuse known dated facts; retain unsupported times/periods as unavailable. Actual source promotion, migration, production composition/activation and publication each require separately scoped authorization after their reviewable prerequisites exist. No historical-scope reduction or waiver is requested. Exact additional external evidence, if needed by that future proposal, concerns action/unit semantics, source authenticity or an actually claimed conversion/payment, not the five resolved facts.

## 13. WP1 final status

**`WP1_BLOCKED_REMEDIATION`**. Recommend reviewing and retaining these diagnostic fixes and the economic explanation, while withholding WP1 production acceptance. Facts are explained; financial application and production admission remain open. Continue only through a separately authorized, evidence-bound accounting/remediation proposal. Stop at WP1; WP2 has not started.
