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

## 14. Final remediation — application preview and closure matrix

This section records the owner-requested final implementation follow-up from **`6c49b6d5a78489d03260eca15d42f78be0de096d`**, reviewed as CONDITIONALLY PASSED for diagnostics. It supersedes the earlier statement that reconciliation exists only as an offline checker. Sections 1–13 and the original `validation.json` describe the first delivery; that evidence's report hash binds the report at commit6c49b6d, not this amended version. All earlier source/governance evidence and that historical validation file are preserved. No accounting assessment was restarted.

### 14.1 Exact prospective event plan

The executable proposal is at `/plan/events` in [actual-case-preview.json](../evidence/2026-11-01-m8-wp1/final-remediation/actual-case-preview.json), including source IDs, SHA-256, cell/row pointers, per-source known/retrieved instants, original ledger relationship, cost impact, duplicate keys, blockers and authorization. Its plan/evidence/ledger hashes bind the exact revision and diagnostic replay cutoff; they are integrity references, not source or posting acceptance. Local event and receipt IDs below are proposal identities, **not invented broker action IDs**. Every `brokerActionId` and every canonical `economicEffectiveAt` remains null.

Source abbreviations for the table:

- **L:** `TCBS_API_RESPONSE:99fcccfa342efaa7587aa48ffeafa3646f8230fc119946a57726762e5b2b448a`; received/known in the local observation store `2026-10-29T04:56:24.764Z`.
- **O:** `TCBS_API_RESPONSE:eb2aa9ffb0894ac080aa8cfbce2eca7d86628ba5a346b8ef78e2d8d450786c62`; received/known locally `2026-10-08T11:38:01.650Z`.
- **B:** `TCBS_API_RESPONSE:9e37ee7a6e882888e80370237c151efa02184399815df7c879f66405f3836253`; received/known locally `2026-10-29T04:56:25.703Z`.
- **R:** `docs/fundamental-data-engine/evidence/2026-10-28-b2-cash-excel-screen-review/CASH_HISTORY.json`, SHA-256 `685dcc245ab3ce1ca69add62fae05432dfd07eaea98105337366cee1e84a82d4`; `/reports/1/rows/57`, A71–E71. Exact original retrieval/knowledge instants are unknown; retained review date is28October.
- **C:** `PORTFOLIO_OWNER_CONFIRMATIONS_2026-10-31.json`, SHA-256 `a2ff8d7457023a809bddffd9c0855784ffa8a1f3a48e1df22be8e051b6ff5542`. Date31October, exact message/retrieval/knowledge instants unknown. The reader verifies C and every one of its seven file bindings.

Transport/store knowledge times are not an entitlement/receipt/conversion effective time or a claim of earliest external publication. Reader verification today does not fill unknown original timestamps. The original opening snapshot `BROKER_SNAPSHOT:cc46785ff2d4f7477911d0cb7dad6ee38b872b5cc6a8566a78683637fdf43852` remains the ledger source relationship, received locally `2026-10-08T11:38:01.705Z`.

| Proposal / evidence | Supported date and ledger relationship | Treatment and cost basis | Duplicate prevention / authorization |
| --- | --- | --- | --- |
| **WP1-TCB-PENDING** — L `/data/stock/6`; C `/facts/0` | Entitlement/effective/conversion date unknown. Observation receipt is29October, not the economic date. OpeningTCB owns100. | Conditional pending recognition delta+50; total150=100available+50pending. No purchase/cash/income or added basis. Preserve total imported TCB cost. | Stable source-cell economic key plus event ID; changed opening relationship requires replan. Preview only; real application needs exact reviewed action/time/unit/source binding, pending-ownership ledger capability and separate owner posting authorization. |
| **WP1-MWG-RECEIPT** — O `/data/stock/4/cashDividend`; R; C `/facts/2`; L same MWG pointer | Receipt **2026-10-16**, record **2026-10-08**, exact receipt/knowledge instant unknown. Original obligation `tcbs-personal-v1:opening:cash:leg:2`=570,000, matched MWG component95,000, residual475,000. | Conditional cash+95,000 and receivable−95,000; no new dividend income, deposit, basis reduction or balancing cash adjustment. `MWG_2026-10-16_EXCEL_A71_E71` is the retained owner receipt identity. Residual475,000 is not reallocated from the anonymous image. | Receipt ID across renamed events, economic key, original-leg linkage, bounded opening-state check; existing canonical dividend settlement duplicate/partial/reversal controls remain. Real posting additionally needs reviewed allocation/source admission, a supported exact instant or separately approved date-precision accounting contract, and exact-event owner authorization. A date-only record cannot enter today's INSTANT intake. |
| **WP1-CUSTODY-ACCRUAL** — B `/data/data/0/depoFee`; C `/facts/3`; cash-review STATUS `/asOfDate` | Liability is confirmed **as of2026-10-28**; accrual recognition/inception instant is unknown. Ledger payable0. Actual cash debit/settlement date unknown. | Conditional accrued payable+420 and accrued expense delta420; cash unchanged, imported cost unchanged. This is an unpaid liability observation, not a settled fee or guessed daily accrual. | Dated custody-obligation economic key and event ID. No payment event generated. Real application needs reviewed recognition basis/source binding, accrued-liability ledger capability and separate owner authorization; payment requires actual debit evidence. |
| **WP1-FPT-PARTITION** — O and L `/data/stock/0`; C `/facts/4` | Entitlement/conversion date unknown. Earliest retained partition observation8October; aggregate220already in opening ledger. | Classification only:200available+20pending=220owned. **Zero additional ownership** and zero cost delta; preserve16,065,060 imported cost. | Stable opening source-cell key/event ID; refuses an aggregate different from the existing220. No20-share acquisition posting is proposed. A future evidenced availability conversion preserves total ownership and basis; it would need its own source/time/authorization review. |

### 14.2 Implemented application path and safeguards

`PortfolioAccountingValidation.preview` is the new read-only accounting validation workflow. It accepts only `Pick<PortfolioLedger,"read">`, uses the existing canonical transaction builder and replay, reads verified evidence, constructs the prospective event plan, invokes the existing `reconcileOwnership` on both ledger and preview ownership, and rereads ledger/evidence to detect revision or evidence drift. It cannot call ledger.commit, rebuild projections, accept a source, publish a NAV or grant trading authority. No dashboard route, UI, personal-account JSON, canonical transaction type, approved authority manifest or production schema was changed.

`RetainedWp1EvidenceReader` opens SQLite read-only, refuses live journal/WAL sidecars, checks exact owner/file/observation hashes and IDs, stock row identities/values, raw-vs-normalized holdings, opening snapshot and original receipt cells, fee as-of policy, and private account/profile consistency. It returns observations only. This resolves the engineering binding for **preview**, not authenticity or production source promotion.

`proposeWp1Events` binds the original claim and both ownership partitions to the existing immutable ledger. It refuses changed opening economics, non-opening history, already-used receipt identity or incorrect TCB/FPT baseline relationships rather than reapplying a stale fixed bridge. The preview uses typed claim-to-cash, accrued-payable, pending-ownership and partition effects, never a generic balancing transaction. `applyAccountingPreview` preserves costs, records complete source lineage, rejects event/economic-key/receipt reuse and refuses any payload differing from the server-generated proposal, including dates, timestamps, action IDs, sources or amounts. A client cannot turn a blocked proposal into a canonical command; `requireWp1PostingAuthority` always rejects.

The separately tested conversion preview requires a matching source-bound conversion proposal and supported exact timestamp, transfers units from pending to available, retains aggregate ownership/imported cost, records conversion lineage and rejects duplicates/over-conversion. Its fixture is explicitly synthetic. No actual conversion is inferred or added to the retained case.

Preview classification leaves availability **unknown** for other holdings rather than assuming they are all tradable. The connected ownership guard still compares all11aggregate quantities. Source mismatches and malformed ownership cannot proceed; stale/future observations, missing action evidence and missing economic cutoff remain visible blocks. Matching the preview totals does not accept pending-right valuation or establish a common cutoff. Receipt-age limits in tests are diagnostic parameters, not a newly approved production policy.

### 14.3 Actual disposable-copy validation

The private integration test copies the actual SQLite database into a fresh temporary directory and uses the actual Prisma ledger reader on that copy. Only a **test-only preview journal** is added there: immutable proposal payloads, unique economic keys, plan hashes and chained replay-result hashes. No canonical accounting event is posted, even in that copy, because the retained source dates/actions do not satisfy the production contract. Preview journal reload/replay produces:

| Component | Canonical opening replay | Conditional evidence-bound preview |
| --- | ---: | ---: |
| Cash | 232,420 | 327,420 |
| Receivables | 570,000 | 475,000 |
| Payables | 0 | 420 accrued, unpaid |
| TCB | 100 aggregate, no availability assumption | 100available+50pending=150 |
| FPT | 220 aggregate, imported basis16,065,060 | 200available+20pending=220, same basis |
| Total imported basis | 81,980,830 | 81,980,830 |

Each event is rejected on second application in the pure transition and on duplicate insertion in the disposable SQLite preview journal. A renamed event cannot reuse the same receipt. Modified dates/source identities/amounts/action IDs block. Additional isolated fault copies demonstrate rejection of corrupted observation bytes and changed owner-record bytes; production/source triggers remain intact. Existing canonical settlement tests prove duplicate/partial/over-settlement and atomic/reversal handling; existing forward-intake tests retain date-only/unsupported-source rejection.

All12original canonical transactions and24legs remain unchanged in the disposable main copy, and the original database hash is identical before and after tests. The test directory is removed. No account identifiers or raw broker responses are published in the evidence artifact.

**Final run: 339/339 tests passed across 16 files, zero failures/skips; TypeScript, scoped ESLint and 277-module architecture boundaries PASS.** Final exact commands, test identities/counts and artifact hashes are recorded in [final-validation.json](../evidence/2026-11-01-m8-wp1/final-remediation/final-validation.json). Earlier exploratory runs are retained as summarized outcomes there; they are not added to the final unique test count. The initial negative assertions incorrectly searched the localized public error message for internal rule names; corrected to verify structured `ValidationError.issues` reasons, with no production error behavior changed. Full-suite/build/full-lint, new independent production acceptance, operational/recovery rehearsals and live source calls were not run or claimed.

### 14.4 Final closure matrix

This matrix updates the existing register's implementation disposition; it creates no new issues and supersedes only the earlier offline-only implementation status. Production acceptance is separate from the diagnostic implementation's conditional pass.

| Issue ID | Implemented remediation | Evidence | Test result | Production application status | Remaining dependency | Acceptance decision |
| --- | --- | --- | --- | --- | --- | --- |
| PA1-C01 | Evidence-bound TCB pending recognition proposal; +50pending only, no purchase/basis change; connected before/after ownership guards | Actual-case `/plan/events/0`, preview TCB row; reader pinned L/C | Actual retained-case replay and duplicate/source/date/quantity negative cases PASS | No production posting; ledger still100 | Supported recognition/action/time/unit admission and separately authorized pending-ledger application | Preview implementation accepted for review; **production issue OPEN** |
| PA1-M01 | Verified retained account/source/cell/hash bindings; reader exposes no grant | Actual-case event source pins; owner seven file bindings; corrupt-source tests | PASS source/account/owner/hash rejection | No source promotion/authenticity acceptance | Actual production admissibility, economic-unit/action mapping and review provenance | Preview engineering gap resolved; **ESCALATED production residual OPEN** |
| PA1-M02 | Original-leg-bound MWG95,000 claim-to-cash preview; accrued420payable/expense with no debit; immutable duplicate guards | Actual-case `/plan/events/1` and `/plan/events/2`, before/preview balances | PASS exact bridge, retained-cost replay, duplicate receipt/event, canonical settlement/intake regressions | No actual receipt/accrual posting | Exact receipt/recognition precision contract, typed admitted allocation/source and supported liability capability; owner exact-event authorization | Economic/proposal integration validated; **ESCALATED application/admission residual OPEN** |
| PA1-M03 | Production price boundary retained; preview never values rights or invokes NAV | Existing NAV qualification regressions and new false authority flags | Focused regression PASS; no production price acceptance attempted | Not applied | Accepted production-purpose session/action/rights valuation | **ESCALATED dependency OPEN**, no new market assessment |
| PA1-M04 | Read-only accounting workflow supplies evidence-bound preview without touching the null production NAV provider | Application service; actual-case blocked result; posting authority rejection | PASS canonical replay, stale revision/evidence drift and false NAV/trading flags | No provider activation | Separately scoped complete accepted NAV plan/provider/composition after financial prerequisites | Preview workflow delivered; **production dependency OPEN** |
| PA1-M05 | FPT220partition without adding20; TCB pending units separate; evidenced conversion preview conserves ownership/basis | Actual-case `/plan/events/3`; synthetic conversion lineage | PASS FPT/TCB partitions, cost conservation, missing/duplicate/excess conversion negatives | No actual conversion or pending-right valuation | Accepted action/lifecycle/valuation semantics; actual conversion evidence only when a conversion is claimed | Lifecycle proposal implementation validated; **ESCALATED production residual OPEN** |
| PA1-M06 | PIT/unknown-date barriers preserved; no guessed economic or receipt-knowledge instant | Null timestamps/actions, date-only intake regressions; common cutoff null | Focused time/intake regression PASS, not historical production validation | No historical accounting rewrite | Full required historical/PIT evidence and independent recomputation | **ESCALATED dependency OPEN**, no scope reduction |
| PA1-M07 | Evidence package binds exact implementation/test case; no release/source/authority flags changed | Final validation pins and actual-case original DB hash | Relevant regressions/checks PASS, not E3/release sign-off | No activation, migration, publication, push or merge | Production source/financial/E3/release gates and later explicit activation decision | **ESCALATED dependency OPEN**, no release acceptance |

### 14.5 Exact remaining authorization and recommendation

No new owner evidence is requested for the already established ownership, cash receipt, pending total or fee classification. No contradictory event was found. Remaining source authenticity/action/precision metadata is an admission/implementation dependency, not a request to reconfirm those facts. If a later reviewer requires additional external action or payment evidence, it must be scoped to that genuinely new production requirement; actual conversion/debit is required only if someone claims it occurred.

The current plan is **not postable by blanket approval**. To post later, first produce a new exact command package against a freshly checked ledger revision, binding (1) accepted source/account/unit/action evidence and hashes, (2) the original claim leg and unambiguous receipt allocation/identity, (3) supported economic and knowledge instants or an explicitly reviewed date-precision contract, and (4) TCB pending ownership/accrued-liability capabilities preserving imported cost. Then obtain a separate owner instruction authorizing those exact prospective events/command hashes and the intended cutoff. FPT20already exists; authorization must not add another20. An actual payment or availability conversion requires a distinct evidenced event. Any capability/schema/source promotion would require its own scoped review/authorization; none is executed here.

**Latest recommendation and final state: `WP1_BLOCKED_REMEDIATION`.** The supported proposal/application-preview and reconciliation integration work is delivered and validated. Retain the conditional diagnostic implementation pass; do not close the production accounting/source-admission issues, activate NAV or weaken Full Production criteria. WP2 has not started.


## 15. Exact command review package — successor 2026-11-02

The authorized follow-up adds a **review instruction package**, not postable TransactionInput payloads. The earlier final-remediation evidence remains unchanged. The read-only application now exposes `PortfolioAccountingValidation.commandPackage`, which calls the existing fresh-ledger/evidence/staleness/reconciliation workflow before binding each proposed effect. It has no commit port. Actual retained-case integration runs on a disposable SQLite copy.

Package: [wp1-command-package.json](../scoring-dataset-acceptance/2026-11-02/acceptance-remediation-v1/wp1-command-package.json). The saved package is based on the historical retained preview; it explicitly requires a fresh runtime ledger/evidence check. Its hashes certify byte/content integrity only. They do not admit a source, establish an action/time, or authenticate owner authorization.

| Proposal | Exact review instruction hash | Source/action/time admission | Production status |
|---|---|---|---|
| WP1-TCB-PENDING | `fa2756fd5fc548694b29cf8d40701489f9bcce64081e9be62c1c117505e77972` | NOT_ADMITTED / NOT_ADMITTED / NOT_ADMITTED | BLOCKED; no posting authorization |
| WP1-MWG-RECEIPT | `b098b9cf49e04ebaae6377945f7e297aceae06178aed859d52137833fb683913` | NOT_ADMITTED / NOT_ADMITTED / NOT_ADMITTED | BLOCKED; no posting authorization |
| WP1-CUSTODY-ACCRUAL | `4eda426c0aeab347dc495427db20948797791a89288b69134674a4ef6bdbf82b` | NOT_ADMITTED / NOT_ADMITTED / NOT_ADMITTED | BLOCKED; no posting authorization |
| WP1-FPT-PARTITION | `66acc51af4a4b9864908354f9e2cfc59560a4de6ba39f2ca32617ca690fbd727` | NOT_ADMITTED / NOT_ADMITTED / NOT_ADMITTED | BLOCKED; no posting authorization |

The MWG instruction remains cash +95,000 / original receivable −95,000, leaving475,000. TCB remains +50 pending ownership only with unchanged imported cost. Custody remains accrued payable/expense420 with no cash debit. FPT is a partition of the existing220, not another20-share acquisition. No conversion or payment is asserted.

Production cannot be authorized by approving this preview hash alone. Before a separately authorized posting, source/account/unit/action identities and exact economic/knowledge precision must be admitted; unknown dates cannot be replaced by midnight or transport receipt times. Required pending-ownership and accrued-liability ledger capabilities must be reviewed. A fresh command package must then contain supported canonical commands, current ledger revision, the original MWG claim/receipt allocation, preserved cost, intended cutoff and admission references. The owner would separately authorize those exact canonical command hashes. NAV, source promotion, production scoring and deployment remain separate permissions.

| Issue IDs | Additional remediation | Validation | Application / remaining dependency | Acceptance decision |
|---|---|---|---|---|
| PA1-C01, PA1-M02, PA1-M05 | Exact per-event effect/source/ledger/cost review hashes; explicit null time/action metadata; FPT non-additive partition | Actual-case disposable-copy package and duplicate/source/time/receipt/ownership regressions pass | No production commands; supported source/action/time admission and ledger capability still required | Review-package implementation delivered; production OPEN |
| PA1-M01, PA1-M06 | Package verifier rejects changed revision, evidence, effects, fabricated time/source and injected authority | Unit plus retained-case tests pass | Source authenticity/admission and historical/PIT precision remain unapproved | OPEN; no promotion or time waiver |
| PA1-M03, PA1-M04, PA1-M07 | Read-only package cannot grant NAV/trading authority; approval injection rejected | False-authority and fresh-read workflow checks pass | No provider/runtime/activation changes | OPEN; no production sign-off |

The exact commands, tests and remaining financial/topic/DI dependencies are indexed in the successor research package's [VALIDATION.json](../scoring-dataset-acceptance/2026-11-02/acceptance-remediation-v1/VALIDATION.json). This follow-up does not close WP1, alter prior matrices or start WP2. **Recommendation remains `WP1_BLOCKED_REMEDIATION`.** No owner reconfirmation of the retained portfolio facts is needed.
