# Phase A1 — Portfolio Production Acceptance Assessment

**Decision: `BLOCKED_REMEDIATION_REQUIRED`**
**Assessment date:** 2026-10-31, Asia/Ho_Chi_Minh (date only).
**Scope:** Portfolio Data Pipeline only; assessment, not remediation or production approval.

## 1. Executive summary

The portfolio pipeline is suitable for its already approved dated, read-only owner display/reconciliation scope. It is **not ready for production NAV or complete portfolio accounting acceptance**. All six production acceptance gates below remain BLOCKED, despite several specifically verified technical controls passing.

A new material discrepancy was found in evidence already retained locally: TCBS holdings received on 2026-10-29 report **TCB totalQtty=150, availableTrading=100, stockDividend=50**. The owner observation dated 2026-10-28 and ledger retain TCB=100 with pendingQuantity=0. The additional 50 are a provider-reported pending stock-dividend quantity, not 50 newly settled/tradable ordinary shares. No entitlement, conversion date, posting or valuation adjustment is invented here.

The actual ledger contains only 12 OPENING_BALANCE transactions/24 legs, revision1, supported inception 2026-10-08T11:38:01.705Z. Replaying those facts at the assessment's diagnostic cutoff gives cash232,420, receivables570,000, payables0. The dated owner/account observations give cash327,420, pending475,000, custody fee420. The cash/receivable offsets do not establish accepted dividend settlement or complete liabilities. The production NAV input provider deliberately cannot supply a complete accepted plan.

Completed work remains closed: the required 21/21 migrations are applied with matching checksums; the exact approved executable authority verifies; account API4.16/4.17 HTTP400 remediation and display-price integration are not reopened. Existing current-identity/Excel-source, pending-display and imported-cost decisions remain valid in their bounded owner scopes. None grants production NAV acceptance.

Assessment performed by Codex across the requested investment, portfolio, financial-audit, risk, architecture and release perspectives. These are assessment perspectives, not six separate human reviewers, independent E3 acceptance or signed release approvals.

## 2. Repository and governance baseline

| Item | Assessment baseline |
| --- | --- |
| Inspected repository HEAD | `01d7aeeb9ebe9b098404a3f65f9d6628f29a873b` |
| Governance evidence baseline | `b3f432d24c93f8574171d848132c5fa7b52c414b` |
| Difference | Exactly one added governance document, 190 lines; no intervening application/API/schema/data/configuration change. This is a comparison, not extension of approval to later commits. |
| Starting working tree | Clean |
| Governance record | GOV, `DATA-PIPELINE-REAPPROVAL-2026-10-31-R1` |
| Pipeline A permission | `APPROVED_WITH_RESTRICTIONS_V1.0`; owner subsequently confirmed governance review completion in conversation. |
| Production NAV | `NOT_APPROVED`; this assessment issues no approval. |
| Pipeline B | Independent research scope; not assessed or advanced in Phase A1. |

All assessment findings concern the inspected HEAD and exact evidence listed below. Evidence retrieval dates, economic dates and this assessment date are different concepts. No retained 28/29/30October observation is asserted to certify account state on31October.

## 3. Current implementation and observed data

### 3.1 Implemented paths

- **Accounting:** TRANSACTIONS builds immutable typed cash, quantity, basis and obligation legs. RECONSTRUCT performs Decimal12 deterministic replay and moving weighted-average cost, separates trade/settlement, caps claim settlement, preserves cost through supported corporate actions and blocks unsupported funding/negative positions. LEDGER rebuilds saved facts, checks headers/legs, guards idempotency/revision and validates settlement/intake audit records. Immutability is a control over recorded facts, not proof those facts include all broker activity.
- **Owner display:** PERSONAL_READER requires portfolio/revision and all quantities/imported costs to match the ledger; it does not reconcile newer raw broker quantities before rendering. PERSONAL_MODEL validates tradable+pending partitions, computes dated source price×owned quantity and P/L using imported basis. UI labels dates, pending dividends and accrued fees, and prevents conceptual double addition of buying power/linked bank/pending to broker NAV. COMPOSITION wires this dated view into the dashboard.
- **Prices:** PRICES checks persisted body/raw hashes, ticker/date/unit, exact raw pointers and eligible display selection. It is explicitly display-only. It does not issue a PORTFOLIO_NAV authority proof or accept a pending-rights valuation basis.
- **NAV:** LEGACY_VALUE computes a generic ledger valuation and accounting bridge, not a qualified production NAV. NAV_CALC uses cash + eligible securities + accepted receivables − liabilities, and produces no operational permission even for a synthetic QUALIFIED_NAV result. NAV_QUALIFY requires exact economics/as-of, identity, RAW/action-compatible prices, calendar, component completeness and scoped authorities. Pending-right units are unsupported, not silently ordinary.
- **Read service/provider:** NAV_SERVICE is intentionally outside production composition and rejects unavailable plans or changing facts/evidence. NAV_PROVIDER.load always returns null, isCurrent returns false, and preparation explicitly reports absent source/identity/market/calendar/acceptance and financial-completeness gates. BROKER_READER accepts bounded typed evidence envelopes only as observed, never as financially accepted sources; real raw broker interpretation/admission is not supplied by a valid JSON/hash alone.

### 3.2 Fresh read-only checks at this assessment

| Check | Actual result | Boundary |
| --- | --- | --- |
| SQLite structure | PASS: integrity_check=ok; zero FK violations | Structural integrity only. |
| Required migrations | PASS:21 database rows and21 repository migrations; every checksum matches, finished, not rolled back | Includes202610270001/002; old migration blocker remains closed. No migrate command run. |
| Ledger facts/legs | PASS:12 canonical transaction rebuilds;24 stored legs match saved facts; all12 POSTED | All are opening transactions, not a reconstructed transaction history. |
| Ledger economics | Cash232,420 / receivables570,000 / payables0;11positions; total imported basis81,980,830VND | Diagnostic replay cutoff2026-10-31T00:00:00Z is a calculation parameter, not a new source observation. |
| Owner-to-ledger snapshot match | PASS:11 quantities/imported costs match OWNER/BASIS at revision1 | This bounded match does not compare against latest raw broker total ownership. |
| Latest retained account/profile | Profile2.1, holdings4.14 and balance4.15 on29October: custody values match; NORMAL account matches profile | Local transport/scope consistency; identifiers/names/tokens are not copied here. Retrieval times differ; no common economic instant or independent authenticity acceptance is inferred. |
| Broker quantities versus owner | BLOCKED:TCB150 total versus100; ten other aggregate quantities match | TCB100available+50stockDividend. FPT220total=200available+20stockDividend; t0/t1/t2 zero for these two rows. Not complete settlement-history certification. |
| Raw observation integrity | PASS:all1,038 broker_observation body hashes match | Unchanged bytes do not prove broker authenticity or financial completeness. |
| Retained held-security display prices | PASS:11/11 exact Decimal raw-cell/hash replays; session2026-10-30 | Last retained completed-close references, not live31October quotes or production NAV prices. A weekend date alone is not evidence that the prior session is invalid. |
| Executable authority | PASS:37artifacts,9compatibilities,133historical files unchanged; approved hash8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1 | Static executable authority is not NAV profile/source/dataset acceptance. |
| Focused current tests | PASS:179/179 across five existing unit files | E2 supporting tests, synthetic inputs/temp files; no new E3 oracle or complete release campaign. |

The29October4.15fields repeat the dated owner amounts: cashBalance327,420, cashDevident475,000, depoFee420, avlWithdraw327,000; mrused/adused0. These are individual provider fields, not a certification of all liabilities or a replacement for30/31October evidence. Cash statement export coverage already reviewed through26October is not missing input to request again.

### 3.3 Settlement and time distinctions

| Component | Ledger replay | Owner28October / latest retained29October fields | Acceptance consequence |
| --- | ---: | ---: | --- |
| Cash | 232,420 | 327,420 | Difference+95,000; no posted matching settlement. |
| Receivables/pending dividends | 570,000 | 475,000 | Difference−95,000; opening claim must be allocated and matched, not amount-netted. |
| Payables/accrued custody fee | 0 | 420 | Missing dated liability bridge; fee is not presumed paid or accruing at an invented rate. |
| TCB ownership | 100 aggregate | 150 total incl50stockDividend,100available | New ownership/pending conflict; ordinary/pending and valuation basis need evidence. |
| FPT ownership | 220 aggregate | 220total,200available,20stockDividend | Aggregate match does not qualify pending-right valuation or prove conversion. |

Cash+claims equals802,420 on both sides, but that arithmetic neither closes settlement nor proves same-date economic completeness; it must not hide the420liability difference. Existing cash history explicitly identifies MWG95,000 received16October, but a recognized broker cash row alone does not authenticate allocation of the ledger's opening570,000 claim. Pending475,000 issuer/action remain unknown in PENDING; do not infer GAS merely from an equal amount.

## 4. Acceptance gate matrix

PASS below applies only to the described sub-checks. Every unresolved production gate is BLOCKED.

| Gate | Supported sub-checks | Unresolved production requirement | Gate result | Issues |
| --- | --- | --- | --- | --- |
| A1 — Source Identity | Owner bounded11ticker/ISIN identity resolved; account/profile scope match;1038hashes match; source dates explicit | Accepted account→instrument→economic-unit/action mapping, authenticity/provenance/authority for the proposed snapshot; local hashes and provider labels insufficient | BLOCKED | PA1-M01,PA1-C01 |
| A2 — Portfolio Reconciliation | Owner-to-ledger opening quantities/costs match; dated cash statement arithmetic already resolved; latest account fields retained | TCBpending50; cash/claim95k transition,420fee, pending/FPT lifecycle and complete settlement coverage not admitted at a common cutoff | BLOCKED | PA1-C01,PA1-M02,PA1-M05 |
| A3 — Market Data Qualification | TCBS display/raw lineage and30October session verified for11held tickers | NAV-purpose source/session/calendar acceptance, adjustment/action basis and unit-level mapping/validity; display is not qualified valuation | BLOCKED | PA1-M03 |
| A4 — NAV Calculation | Formula/Decimal/no-double-count/fail-closed behavior supported by current tests and inspected code | Complete accepted same-instant plan, pending-right treatment and operationally authorized read path absent; historical NAV separately not ready | BLOCKED | PA1-M04,PA1-M05;PA1-M06 for historical scope |
| A5 — Accounting Integrity |12headers/24legs canonical; immutability guards present; required schema checksums/integrity pass; imported basis preserved | Full external-to-ledger financial reconciliation, claim allocation/receipt/fee/CA completeness and accepted actual-case settlement still missing | BLOCKED | PA1-C01,PA1-M02,PA1-M05 |
| A6 — Production Release |21/21migration subgate closed; exact executable authority verifies; engineering regressions remain separately evidenced | Scoped E3/M7/PIT acceptance, complete NAV authority, release/operational evidence and separate explicit production authorization absent | BLOCKED | PA1-M07 |

## 5. Evidence inventory and provenance

The file inventory at the end pins inspected repository bytes. Sources OWNER/PENDING/BASIS are local dated observations/policies, not original broker signatures. Original XLSX private files were not reopened in this phase; prior inventories/reconciliations remain supporting historical evidence. No fresh broker login/network request, source admission, source authority promotion, external reviewer signature or owner timestamp is fabricated.

### Private SQLite references

- Database:`data/vn30.sqlite`;42tables;1portfolio;revision1;12ledger_transaction;24ledger_leg;1projection;1,038broker_observation. No WAL/SHM sidecars were present before assessment. Immutable/read-only SQLite access was used throughout.
- Profile29October:`TCBS_API_RESPONSE:2aafee3f2905ea8ac3d3db67e77cd936302f710e31cc750167af54a6b3be606c`, received2026-10-29T04:56:23.806Z.
- Holdings/TCB:`TCBS_API_RESPONSE:99fcccfa342efaa7587aa48ffeafa3646f8230fc119946a57726762e5b2b448a`, received2026-10-29T04:56:24.764Z. Its body SHA-256 equals the64hex suffix; raw API text SHA-256:`71b46783bf6713fef6a169ca42075c698e7d0e4d582426ec1e9b290c14159717`. Exact pointers are recorded below.
- Balance:`TCBS_API_RESPONSE:9e37ee7a6e882888e80370237c151efa02184399815df7c879f66405f3836253`, received2026-10-29T04:56:25.703Z; normalized data at`/data/data/0`.
- MARKET contains the exact11held price observation IDs, source IDs and session; its wider universe is30, not an assertion of30held positions.
- SQLite body hashes are integrity bindings, not proof of authentic external signing. No names, account numbers, OTP, tokens or private API response bodies are copied into the assessment.

TCB body pointers: `/data/stock/6/totalQtty`, `/data/stock/6/availableTrading`, `/data/stock/6/stockDividend` =150/100/50. Earlier retained account observations through11October show100/100/0; both29October captures show150/100/50. No event/effective date between those retrievals is inferred.

## 6. Issue register

Severity describes production-acceptance risk, not permission to repair. A blocked-by-design capability is not automatically an exploitable defect. No MINOR issue was confirmed; issues are not downgraded to permit release.

### PA1-C01 — CRITICAL — TCB pending ownership absent from the current owner/ledger model

- **Description/evidence:** Private holdings observation and pointers above versus OWNER TCBquantity100/pending0 and immutable openingTCB100. New finding; not a reopened B1 ISIN/PDF issue.
- **Impact:** Full ownership/CA perimeter disagrees by50provider-reported pending shares. Any production total built from the current100 alone would have incomplete claim coverage. Do not quantify the NAV impact before choosing an evidenced pending-right/price basis.
- **Root cause:** The owner read model is revision-bound to opening ledger facts; the guard does not compare newer broker pending quantities. The API observations are retained but not financially admitted or bridged into accounting.
- **Proposed resolution:** Reconcile the existing29October account rows, entitlement/action identity, effective/known times and pending valuation/cost conservation; prepare a reviewed prospective intake or correction proposal. Never convert50 to settled ordinary shares or mutate opening facts to force agreement.
- **Acceptance criteria:** Exact account/action mapping and evidence identify100available plus50pending (or a source-supported corrected interpretation), quantity/basis conservation, no duplicate receipt/posting, tested mismatch rejection, and accepted treatment at the intended valuation cutoff. Later implementation/posting requires separate authorization.
- **Codex without new owner evidence:** PARTIAL. Existing raw rows suffice to reproduce/characterize the conflict. Full resolution requires source-supported action/lifecycle details if not recoverable from retained evidence; Codex cannot invent them or authorize posting.
- **Escalation:** New finding; no invented count of earlier TCB remediation attempts.

### PA1-M01 — MAJOR — Production account/source/identity acceptance missing

- **Description/evidence:** B1 resolves the11issuer identity for owner display; profile/holdings account scope agrees. BROKER_READER still returns accepted=false; NAV_PROVIDER requires source/identity acceptance. GOV preserves that boundary.
- **Impact:** Hash-valid account rows or public ISINs cannot establish all account-specific economic rights or source authority for production NAV.
- **Root cause:** Observation/integrity and source authenticity/financial admission are different contracts. Existing source-policy approval is deliberately scoped.
- **Proposed resolution:** Inventory already retained account/profile/Excel/public identity evidence, resolve instrument/economic-unit/time bindings and document an explicit admissibility/authenticity decision for the target snapshot. Obtain only genuinely missing evidence after that inventory; do not re-request11ISINs or a compulsory historical PDF chain.
- **Acceptance criteria:** Each held/claim unit is bound to account, provider/master identifiers, effective/known times and accepted source purpose; ambiguous/revoked/mismatched evidence fails closed. Required review provenance is real and contract-compatible.
- **Codex without new owner evidence:** PARTIAL; mapping/integrity can be checked locally, missing authenticity/authority cannot be manufactured. Existing scoped owner decisions cannot be widened unilaterally.
- **Escalation:** Carry forward only remaining production-authenticity scope from historicalB1; owner-display identity closure remains closed. See section9.

### PA1-M02 — MAJOR — Opening ledger has no accepted cash/claim/fee forward reconciliation

- **Description/evidence:** RECONSTRUCT/SQL reproduce232,420/570,000/0 versus dated327,420/475,000/420. Twelve opening entries only; no actual dividend-receivable settlement, fee accrual/payment or forward trade posting exists. RUNTIME/B2/API record the later observations separately.
- **Impact:** Current financial components and settlement completeness cannot be certified. Offset95k movements must not be hidden by unchanged cash+claims.
- **Root cause:** Correctly separated read observations were never equivalent to accepted accounting events. Existing95k cash evidence lacks a fully accepted allocation/receipt bridge to the opening obligation.
- **Proposed resolution:** Prepare event-level same-cutoff reconciliation from retained statements/API, distinguish receipt from income, allocate the original claim and recognize/pay custody fee only on supported dates. Apply no balancing transactions or fee-rate guesses. Preserve imported history and deduplicate any future admitted receipts.
- **Acceptance criteria:** Exact source→claim/action→receipt/cash and fee obligations reconcile each component; allocation totals agree, partial/duplicate/over-settlement negative cases pass, and any actual-case posting is separately authorized/audited. Unknown liabilities remain unknown, not zero.
- **Codex without new owner evidence:** PARTIAL; many existing statements/rows can be joined now, but genuinely absent allocation IDs/economic cutoffs/fee events need source evidence or an explicit separately reviewed scoped policy. No repeat request for already reconciled cash Excel.
- **Escalation:** Residual claim/historical-obligation acceptance remains escalated; B2's dated current cash/420classification is not reopened.

### PA1-M03 — MAJOR — Display prices have no production NAV qualification

- **Description/evidence:** MARKET/PRICES verify30October closes, exact raw lineage and mapping for display. MARKET declares PROVIDER_UNDECLARED adjustment and DISPLAY_AND_REVIEW_REFERENCE_ONLY. NAV_QUALIFY requires RAW/action-aligned units, exact session/calendar and purpose-specific authorities.
- **Impact:** A display price cannot value FPT/TCB pending rights or be published as production NAV evidence without explicit semantics and eligible purpose.
- **Root cause:** Price ingestion/display selection and NAV qualification are deliberately independent; the missing object is an accepted NAV snapshot/authority, not another HTTP fix.
- **Proposed resolution:** Document provider close/adjustment/action semantics; bind the target session, calendar/validity, economic-unit mapping and source proofs into a reviewed NAV plan. Do not rewrite raw values or turn undeclared basis into RAW by assertion.
- **Acceptance criteria:** All held/claim units have unique source-supported prices for one eligible valuation instant; unknown basis, stale/foreign-session prices, conflicts and mismatched actions block; price purpose and provenance are accepted.
- **Codex without new owner evidence:** PARTIAL; local lineage/session tests need no owner upload. Missing provider semantics/source-purpose acceptance may need additional provider documentation or scoped authority decisions, not an OTP sent to chat.
- **Escalation:** Production snapshot residual is escalated across repeated market/NAV reviews; completed display integration and API400 fixes remain closed.

### PA1-M04 — MAJOR — No complete operationally eligible NAV input plan/provider

- **Description/evidence:** NAV_PROVIDER.load returns null/isCurrentfalse; NAV_SERVICE produces INPUT_PLAN_UNAVAILABLE. NAV_CALC hardcodes productionAuthorized/officialUseEligible/snapshotPersisted=false; origins are research/synthetic. Current dashboard's owner display is a separate read path.
- **Impact:** The inspected implementation cannot supply accepted production NAV even if its arithmetic passes synthetic tests. Promoting a display subtotal or renaming a research QUALIFIED_NAV result would bypass gates.
- **Root cause:** Deliberately bounded earlier SliceA implementation, with remaining economics/authorities/composition not authorized or completed.
- **Proposed resolution:** After prerequisite data decisions, design and separately authorize a versioned complete provider, authority/provenance path and production integration; retain calculator boundaries and explicit ownership/pending rules. No implementation in PhaseA1.
- **Acceptance criteria:** End-to-end accepted actual-case inputs reach the intended read-only calculator with coherent revision/evidence head/as-of, separate proof verification and reproducible expected/actual results; no flags alone grant production use. Activation remains separately authorized.
- **Codex without new owner evidence:** YES for future implementation/testing once approved and inputs resolved; NO for granting scope or inventing financial evidence. This is an authorization/dependency issue, not a request for duplicate files.
- **Escalation:** Earlier3.5/3.6 planning cycles are not counted as additional implementation attempts.

### PA1-M05 — MAJOR — Pending corporate-action/dividend valuation and lifecycle remain unaccepted

- **Description/evidence:** FPT220 contains200ordinary+20pending; TCB pending50 is separately PA1-C01. PENDING475,000 has no issuer/action/payment date. NAV_QUALIFY rejects unsupported pending-right units. Latest FPT account observation confirms a provider partition, not a legal conversion event.
- **Impact:** Full ownership, availability, claim valuation and settlements cannot be collapsed into ordinary shares/cash; double counting or unsupported realization would distort NAV.
- **Root cause:** Aggregate imported ownership and dated pending presentation do not supply accepted entitlement/action/lifecycle/price semantics.
- **Proposed resolution:** Preserve ownership and availability separately; obtain or extract exact action/entitlement, recognition and conversion/payment evidence, with a prospective supported scope where historical dates cannot be reconstructed. Specify the pending-right valuation policy before broadening code support.
- **Acceptance criteria:** No duplicate20FPT/50TCB, cost conservation, no early tradability/received cash, supported pending valuation and matched receipts; absent data visibly blocks full NAV rather than zero-filling.
- **Codex without new owner evidence:** PARTIAL; retained quantities and evidence links can be reviewed. Missing lifecycle/action evidence cannot be supplied by the ordinary share's public price or equal amount alone.
- **Escalation:** FPT/claim residuals remain escalated; owner pending-display approval remains closed and unchanged.

### PA1-M06 — MAJOR — Historical NAV and historical/PIT claims not ready

- **Description/evidence:** HISTORY reconstructs484cash days and17trades/93cashrows offline, but calculated daily NAV remainsn.a.; incomplete prices (including formerly heldTPB/early periods), RAW/adjusted/action/obligation coverage and AS_KNOWN proof remain. Actual ledger supported inception is imported8October2026, not30June2025.
- **Impact:** No accepted full historical NAV curve, lifetime accounting P/L or TWR/XIRR/performance claim is supported. A broker-reported point or retrospective close is not a reconstructed accepted historical value.
- **Root cause:** Cash history and opening balances alone lack the full historical ownership/price/claims/liability and knowledge-time perimeter.
- **Proposed resolution:** Define historical scope and evidence availability; build a separately authorized frozen reconstruction/qualification package using only supported dates, keeping gaps unknown. Do not reinstate a mandatory PDFchain for current identity.
- **Acceptance criteria:** Per-date position/settlement/cash/claims/debt, action-compatible price and information-availability lineage reproduce against an independent oracle. Missing periods remain unavailable. A narrower current-NAV release, if proposed later, must explicitly exclude historical/performance claims rather than pretend historical reconstruction is complete.
- **Codex without new owner evidence:** PARTIAL; existing cash/securities artifacts can be checked, public price evidence may be acquired in a later authorized phase, but missing private event/obligation facts cannot be invented.
- **Escalation:** Historical cash/trade, statement-synthesis and market-price review paths are all documented; no new package is counted as a resolution.

### PA1-M07 — MAJOR — Scoped E3/M7/PIT and production release acceptance absent

- **Description/evidence:** GOV/RELEASE preserve NOT_APPROVED; M7 records carried-forward E3/historical gaps; REHEARSAL retains OR11NOTEXECUTED. Current179tests and approved executable authority are supporting/authority checks, not a new exact-release NAV acceptance decision.
- **Impact:** Neither code/test success nor this multi-perspective assessment permits production accounting/NAV, publication or deployment.
- **Root cause:** Technical readiness and source/reconciliation/production-review evidence have separate acceptance contracts. No new scoped E3 oracle, accepted NAV authority, exact-release operational package or explicit production authorization was created.
- **Proposed resolution:** Assemble a PipelineA-specific expected-vs-actual E3 package, source/account/market/time proofs, release identity/config/security and recovery evidence, defined historical limitations and final owner/release decision. Reuse valid migration/authority/recovery evidence only within its actual scope. Owner-authorized AI self-review is not mislabeled as independent human review; any required production provenance-contract alignment needs a separate explicit decision.
- **Acceptance criteria:** All mandatory PipelineA gates evidence-backed, adverse cases reproduced, no material unexplained discrepancies, exact release/source/schema/config identified and separately authorized for production. Do not import PipelineB's scoring dataset blockers into this assessment as substitutes.
- **Codex without new owner evidence:** PARTIAL; Codex can prepare evidence/oracles and identify gaps in a future phase; it cannot fabricate independent acceptance or issue the owner's activation authorization.
- **Escalation:** HistoricalB6release residual remains escalated; old migrationB7is closed, not carried as an unresolved release defect.

## 7. Historical NAV readiness

**Not ready.** The existing cash history is useful and does not need to be supplied again, but no accepted historical security/claim/debt valuation series was found. A7October broker-reported NAV point and23October scenario subtotal in HISTORY are explicitly historical diagnostics. No current or full historical NAV is calculated/published in this assessment. The legacy “economicGainSinceSupportedInception” bridge is absolute VND, not TWR/CAGR/XIRR or proof of an annual investment objective. Current-NAV and historical/performance acceptance must have explicit separate scopes.

## 8. Production NAV readiness

**Not ready for production acceptance review.** Formula/no-double-count controls are present; actual production qualification/inputs/economic reconciliation and activation permissions are not. Maintain existing dated display/reconciliation scope. A31October request may legitimately refer to a prior completed trading session if policy supports it, but must never call that price live or pair it with unqualified cash/claims/ownership dates. The420custody liability and TCBpending50 cannot be silently omitted, and FPTpending20 cannot be priced as freely tradable stock without accepted treatment.

## 9. Escalations and remediation order

ESCALATIONS already marks historical source/claim/FPT/release blockers escalated, with conservative minimum review counts B1=7,B2=7,B3=8,B4=7,B5=5,B6=6,B7=3 and named attempted paths. These are **historical review counts, not newly verified counts of code-fix attempts**. Repeated documentation is not remediation. Carry escalation only for the unresolved production residual; do not resurrect owner-resolved identity/cash/basis or the completed migration blocker.

| Current issue | Escalation disposition | Evidence/next decision |
| --- | --- | --- |
| PA1-M01 | ESCALATED residual authenticity/production admission | Historical source dossiers, targeted discovery, read-adapter and intake-preparation paths leave production acceptance absent; agree the minimum admissible proof and review contract, not another compulsory11ISIN/PDF request. |
| PA1-M02/PA1-M05 | ESCALATED claim/FPT lifecycle residuals | Repeated statement, cash/securities, settlement-contract and qualification reviews have not supplied accepted actual-case linkage; target missing action/receipt/lifecycle fields. |
| PA1-M03 | ESCALATED production-purpose market qualification | Multiple historical EOD/NAV and later direct-display reviews; accepted production source/session/action basis remains absent. Not escalation of fixed HTTP400/display bugs. |
| PA1-M06 | ESCALATED historical reconstruction gap | HISTORY_PRICE,HISTORY_STATEMENT,HISTORY are three documented attempted evidence paths; none produces an accepted historical NAV series. |
| PA1-M07 | ESCALATED release residual | Existing release register/reviews carry the gate; request scope/evidence/provenance decision, not nominal approval to bypass finance. |
| PA1-C01 | NEW; not assigned fabricated past attempts | Review retainedTCB50pending evidence first. |
| PA1-M04 | Dependency/authorization decision; no >2implementation-attempt claim | Design-only followups do not establish three failed implementations. |

Recommended order, **proposals only**:

1. Resolve the TCB ownership/pending evidence conflict and choose an explicit dated accounting/NAV perimeter. Reuse already held evidence first.
2. Close source/identity admissibility and exact lifecycle/claim/cash/fee reconciliation together (M01/M02/M05), preserving imported basis and original ledger.
3. Qualify purpose-specific market/session/action prices (M03); specify pending-right treatment.
4. Separately authorize and implement/test the complete NAV plan/provider/authority path (M04), if desired after assessment approval.
5. Decide whether historical/performance scope is required; either close M06 with evidence or explicitly exclude unsupported claims from any narrower prospective proposal. PIT correctness for the chosen scope still applies.
6. Complete scoped E3/M7/operational release evidence and separate production authorization (M07). Keep21/21migration and exact-manifest authority subgates closed unless genuine drift is observed.

Required owner decisions are the intended valuation/accounting cutoff and historical scope, the missing-evidence/admissibility/review route where existing sources are insufficient, and whether to authorize a separate remediation phase. No new owner upload is requested during this assessment. Do not send OTP/tokens to chat; exact action evidence should be requested only after retained evidence is exhausted. Production activation/publication is a later separate decision and cannot be granted merely to remove a blocker. No migration is requested.

## 10. Validation, reproducibility and final recommendation

### Checks executed

- Inspected HEAD/governance diff and clean starting tree; read relevant source and current/historical evidence, respecting scope supersessions.
- Opened SQLite only with`file:data/vn30.sqlite?mode=ro&immutable=1` while no WAL/SHM existed; integrity/FK/migration checks, header/leg checks and local observation hash checks are SELECT/PRAGMA read operations. No trigger mutation probe, DB transaction posting or schema migration was run.
- Rebuilt12saved transactions and replayed the actual ledger through existing pure domain functions; read OWNER with existing read-only guards. Compared dated values and current raw broker partitions independently; no forced reconciliation.
- Verified11held display-price source pointers with exact Decimal numeric equality. An initial scratch check used lexical numeric-string comparison and rejected a JSONnumber formatted with`.0`; correction to exact Decimal equality passed all11without changing source bytes. This was a validation-script assumption, not a source mismatch hidden as a PASS.
- Ran the five existing unit files below:179passed,0failed. No tests were added or fixed; unit fixtures/temp files do not admit actual accounting evidence. Full suite, build/typecheck, isolated DB integration/migration tests, live API/authentication, browser, E3campaign and operational rehearsal were not run in this assessment.
- Ran the read-only approved-authority verifier:PASS37artifacts/9proofs/133historical files; no approval/activation script executed.
- Rechecked protected DB and all four account-current JSON hashes after assessment; no changes. Checked only this assessment is added and Git diff whitespace/links/pins are valid before commit. Runtime/config/schema/history/approval files are unchanged.

### Replay procedure

Use the inspected HEAD and the exact private DB hash below; later observations require a new assessment rather than rewriting this one. Source files must match the inventory. No private account identifiers need to be printed.

```sh
NODE=/private/tmp/node-v22.23.2-darwin-arm64/bin/node
"$NODE" scripts/verify-approved-scoring-authority.mjs
PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH pnpm exec vitest run tests/unit/portfolio-accounting.test.ts tests/unit/current-nav.test.ts tests/unit/dividend-settlement.test.ts tests/unit/personal-account.test.tsx tests/unit/nav-read-adapters.test.ts --reporter=json --outputFile=/private/tmp/phase-a1-unit-tests.json
```

For independent data replay, connect using the immutable/read-only URI above (refuse this replay if a live nonempty WAL exists), verify all observation body hashes against UTF-8 SHA-256, and select the exact observation IDs/pointers in section5. Compare profile`data.basicInfo.code105C` with holdings/balance`custodyID` and the NORMAL subaccount number privately; assert equality without logging those values. Parse raw numeric JSON with`decimal.Decimal` rather than binary float. For prices, resolve MARKET's held-symbol rows, price`sourceObservationId` and`sourcePointer`; the first`/data`is the retained envelope's normalized-data prefix, so resolve the remaining pointer against the parsed raw payload. Check values, dates and hashes separately from production purpose eligibility.

For actual accounting replay, read saved`ledger_transaction.facts` and ordered`ledger_leg` via the read-only URI. Compare every leg to the saved transaction and rebuild with`buildTransaction(t.facts,t.createdAt,historyWithoutT)`. Replay with`reconstructPortfolio(portfolioId('tcbs-personal-v1'),history,'2026-10-31T00:00:00.000Z',watermark('1'),'2026-10-08T11:38:01.705Z')`; expected12transactions/11positions/cash232420/receivables570000/payables0/importedcost81980830. Then call`readPersonalAccount` with that state (no broker/API writes): expected ownerdate28October and11quantities/costs matched, not a full-account reconciliation. Compare TCB against the exact4.14pointer, never by assuming the ledger guard reads raw broker data.

### Final recommendation

**`BLOCKED_REMEDIATION_REQUIRED`**. Retain`APPROVED_WITH_RESTRICTIONS_V1.0`for dated owner display/reconciliation only. Production NAV and portfolio accounting acceptance are not issued. The assessment is complete as PhaseA1; no fixes, postings, migration, source promotion, production configuration, activation, publication or PhaseB1 work is authorized or started by this document.

### File evidence pins

SHA-256 pins below identify inspected bytes, not external authenticity or owner signatures. Private local data may not be present in a public clone; absence blocks reproduction, not permission to fabricate it.

| ID | File | SHA-256 |
| --- | --- | --- |
| GOV | [docs/fundamental-data-engine/governance/DATA_PIPELINE_REAPPROVAL_2026-10-31.md](DATA_PIPELINE_REAPPROVAL_2026-10-31.md) | `a5a9a61101e81c1be0fa182f0a01d35eca82cac61a3f04a1d731245e08a96522` |
| OWNER | [data/account-current/personal-account.json](../../../data/account-current/personal-account.json) | `f683477cea82b42b15621e45aa3d9225eadb1adb531616c8ccc0811ac689ca70` |
| PENDING | [data/account-current/pending-dividends.json](../../../data/account-current/pending-dividends.json) | `b6deebe8085ece5931b3bc264d307503f29ea0c1f1873502237f3572683ed7fe` |
| BASIS | [data/account-current/selected-pnl-basis.json](../../../data/account-current/selected-pnl-basis.json) | `33c97f3cebf7bef54fa3135565e75a4c83e681499470f5a7e243f572093bdc58` |
| B1 | [docs/fundamental-data-engine/evidence/2026-10-28-b1-excel-source-policy/CURRENT_POLICY.json](../evidence/2026-10-28-b1-excel-source-policy/CURRENT_POLICY.json) | `c3b1bc1797a95f8d715d59b58e2a21be85c502f98494a4dc93a632049ff8ef27` |
| B2 | [docs/fundamental-data-engine/evidence/2026-10-28-b2-cash-excel-screen-review/STATUS.json](../evidence/2026-10-28-b2-cash-excel-screen-review/STATUS.json) | `522876b379b3c88968af7da607e5565f6c107ac8aec7d1dee79636557d4d075a` |
| B5 | [docs/fundamental-data-engine/evidence/2026-10-28-b5-excel-cost-basis/STATUS.json](../evidence/2026-10-28-b5-excel-cost-basis/STATUS.json) | `ac0fd7492903c01ff9dafd596babfa7a8f98b1fd94f1816b3dc2c1d5d4c4a436` |
| RUNTIME | [docs/fundamental-data-engine/evidence/2026-10-28-b1-b5-runtime-integration/REPORT.md](../evidence/2026-10-28-b1-b5-runtime-integration/REPORT.md) | `906dc77763f14973fa96f457d30ff12eafc2fdef4bf92acb949dff5f9a2da663` |
| API | [docs/fundamental-data-engine/evidence/2026-10-29-account-api-review/REPORT.md](../evidence/2026-10-29-account-api-review/REPORT.md) | `79a9614a0a5a0aa1ba4dac9d27187b02e8a324043f68413ee198df02a5336594` |
| MARKET | [docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-economics-r3/market-review.json](../scoring-dataset-acceptance/2026-10-30/b6-economics-r3/market-review.json) | `cc3f91020d43176b261db14ea62837e0c1f1e4f26b1a9716cb85165076886832` |
| MIGRATE | [docs/fundamental-data-engine/evidence/2026-10-29-live-account-migrations/FINAL_STATUS.json](../evidence/2026-10-29-live-account-migrations/FINAL_STATUS.json) | `cd0542f2cec8cb1fab079b3d6e9a9e5188ef761d173ed16f96c648ef83fed76f` |
| TRIGGERS | [docs/fundamental-data-engine/evidence/2026-10-29-live-account-migrations/TRIGGER_AND_SCHEMA_CHECK.json](../evidence/2026-10-29-live-account-migrations/TRIGGER_AND_SCHEMA_CHECK.json) | `e183f79effb001d3e26a461ea7c348d382883476e2ed42a312b00fc00cdb258a` |
| AUTHORITY | [docs/fundamental-data-engine/evidence/2026-10-29-approved-authority-activation/REPORT.md](../evidence/2026-10-29-approved-authority-activation/REPORT.md) | `68b584676d837282643d00d8192c91e4622d96ddde17003a34133bdae1a84614` |
| ESCALATIONS | [docs/fundamental-data-engine/evidence/2026-10-28-m8-phase3-6-external-identity-intake-preparation/EXTERNAL_DEPENDENCY_STATUS.json](../evidence/2026-10-28-m8-phase3-6-external-identity-intake-preparation/EXTERNAL_DEPENDENCY_STATUS.json) | `b1dc35861cf875c721b3c52a2daeface57ddba2d3b9c572b1093a19b977022bd` |
| HISTORY | [docs/fundamental-data-engine/evidence/2026-10-26-m8-historical-nav-cash-trade-integration/HISTORICAL_NAV_REPORT.md](../evidence/2026-10-26-m8-historical-nav-cash-trade-integration/HISTORICAL_NAV_REPORT.md) | `615c516825edf7dffb0c9920389216816824e2a59478607979ac985e9b28cd69` |
| HISTORY_PRICE | [docs/fundamental-data-engine/evidence/2026-10-26-m8-historical-market-price-validation/CLOSURE_REPORT.md](../evidence/2026-10-26-m8-historical-market-price-validation/CLOSURE_REPORT.md) | `0c035e9a77efb62a3a29067116c262dae06842a4cabdf19a38ade2952e478fd1` |
| HISTORY_STATEMENT | [docs/fundamental-data-engine/evidence/2026-10-26-m8-historical-nav-statement-synthesis/HISTORICAL_NAV_REPORT.md](../evidence/2026-10-26-m8-historical-nav-statement-synthesis/HISTORICAL_NAV_REPORT.md) | `68abb954c567789bc55b6e56eb3d0c137a80b1eea500960e570ed2489fdbf422` |
| M7 | [docs/07_VALIDATION/FINAL_VALIDATION_REPORT.md](../../07_VALIDATION/FINAL_VALIDATION_REPORT.md) | `ba526ca47489dda29357794cd32bf826dde7d4763922ddc158fdc83a389edea4` |
| E3 | [docs/07_VALIDATION/VALIDATION_STRATEGY.md](../../07_VALIDATION/VALIDATION_STRATEGY.md) | `b5df573ccae31812f9b0c4194c576eae8b8e240cc894831fe95cfa921600f94b` |
| RELEASE | [docs/08_CONTINUOUS_IMPROVEMENT/PRODUCTION_ACCEPTANCE.md](../../08_CONTINUOUS_IMPROVEMENT/PRODUCTION_ACCEPTANCE.md) | `53cb1aae6809cc945b6c6778ac3b613f34e412d1cef509f409c00f3a646264e4` |
| REHEARSAL | [docs/08_CONTINUOUS_IMPROVEMENT/OPERATIONAL_RUNBOOK.md](../../08_CONTINUOUS_IMPROVEMENT/OPERATIONAL_RUNBOOK.md) | `0ab64ff2c7d073b7bc428f7a8993ce6d093e2334c85b179d62502618be60b148` |
| RECONSTRUCT | [src/domain/portfolio/reconstruct.ts](../../../src/domain/portfolio/reconstruct.ts) | `450d24b7fa7bdd98b1638887f3ceeea5756753cfc64c5265a6a69c919710ea6b` |
| TRANSACTIONS | [src/domain/portfolio/transaction.ts](../../../src/domain/portfolio/transaction.ts) | `0041a731fba6a025c6599130600397cd9cafeafc1b92410a76d2eecee1bb71d5` |
| LEDGER | [src/infrastructure/repositories/portfolio-ledger.ts](../../../src/infrastructure/repositories/portfolio-ledger.ts) | `5b8a1938ee594252d0528c90a33a339ceb078b3298f52e4fe5b6b8353b916d56` |
| SETTLEMENT | [src/domain/portfolio/dividend-settlement.ts](../../../src/domain/portfolio/dividend-settlement.ts) | `3e1a3fa7c80fccdb8812ccbf015438d4e32ee5ca8ba2605ffe92bff732daef99` |
| RECONCILE | [src/domain/portfolio/reconciliation.ts](../../../src/domain/portfolio/reconciliation.ts) | `5941ae8a3a7633e01f063bbf727faf13a26d561e51cc5b5d3f3a70b726e3777e` |
| LEGACY_VALUE | [src/domain/portfolio/valuation.ts](../../../src/domain/portfolio/valuation.ts) | `80850601619e1beaa101a448fd1ae036ab60e9ae5c6d37bbab681539e97c0b3e` |
| NAV_CALC | [src/domain/current-nav/calculate.ts](../../../src/domain/current-nav/calculate.ts) | `8d0714a7ad49a3fea432e22b55990bc7873dc0aa41c8cfeb36005b5d1dc9b980` |
| NAV_QUALIFY | [src/domain/current-nav/qualification.ts](../../../src/domain/current-nav/qualification.ts) | `8ca57fc55358126ce559ae7fe15aebe1cfd048dd52eb4e3a530c58cc3a254f7d` |
| NAV_PROVIDER | [src/application/current-nav/input-provider-skeleton.ts](../../../src/application/current-nav/input-provider-skeleton.ts) | `37028b6750e38dee491aadfbdeb6300acbf4b1b06ddc16b0656325929e6dd8d5` |
| NAV_SERVICE | [src/application/current-nav/read-service.ts](../../../src/application/current-nav/read-service.ts) | `1dc4877784e30cc2546c45bea6098544c95867704642adb22ae6b3c979537be4` |
| BROKER_READER | [src/infrastructure/current-nav/broker-evidence-reader.ts](../../../src/infrastructure/current-nav/broker-evidence-reader.ts) | `0d39e8785c9ff7316f4fc8156fc228f3a1e578ced8d4415698afe3ca11c5f8d9` |
| PRICES | [src/infrastructure/repositories/direct-market-prices.ts](../../../src/infrastructure/repositories/direct-market-prices.ts) | `e727940a0a53a89538a9fc0f66bb0a834a1d3f46c1dd7c803cd191da891dc12d` |
| PERSONAL_READER | [src/infrastructure/personal-account.ts](../../../src/infrastructure/personal-account.ts) | `bf2f9cf5842a1adaedea0359467f320a1492a9c4c1da0020d7741f9a001152b4` |
| PERSONAL_MODEL | [src/domain/portfolio/personal-account.ts](../../../src/domain/portfolio/personal-account.ts) | `7644fff822fed0bcdd6698fc64a2b69acd855361bda255d949da3a6f2a6b8c13` |
| UI | [src/ui/personal-account.tsx](../../../src/ui/personal-account.tsx) | `a200a9a51fee8f8781685ca5f8c4cfb3c0232b1b53ebf122393c85d3bccdf8d6` |
| COMPOSITION | [app/server/dashboard.ts](../../../app/server/dashboard.ts) | `df10204902cf35dd06c2a092aeb6300ead8fb07be459a55e78c283704ee2ad83` |

Protected private-data baseline (unchanged after assessment):

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `data/vn30.sqlite` | 22917120 | `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65` |
| `data/account-current/selected-pnl-basis.json` | 7682 | `33c97f3cebf7bef54fa3135565e75a4c83e681499470f5a7e243f572093bdc58` |
| `data/account-current/pending-dividends.json` | 1355 | `b6deebe8085ece5931b3bc264d307503f29ea0c1f1873502237f3572683ed7fe` |
| `data/account-current/acquisition-cost-basis.json` | 26396 | `ae938c4ffb0da3c292b17cecd175018606d3c25d76e8f7432c7078f5343e34ff` |
| `data/account-current/personal-account.json` | 2410 | `f683477cea82b42b15621e45aa3d9225eadb1adb531616c8ccc0811ac689ca70` |
