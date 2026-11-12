# VNM S4 — final targeted remediation

Owner share-count amendment12Nov2026: **S4-R1=CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY**; outstanding **2,089,955,445** carried from Q3 at30Sep through30Oct. [Reviewed-document decision and limitations](../../vnm-s4-share-carry-forward/2026-11-12/FINAL_REVIEW.md). Incomplete coverage is not a complete negative search. This S4-R1 identifier is the owner’s share-count item, separate from the historical section R1 adjustment investigation.

Owner policy addendum12Nov2026: **`RAW_CLOSE_CUTOFF=RESEARCH_QUALIFIED`; `ADJUSTED_PRICE_SERIES=EXCLUDED_BY_OWNER_POLICY`; `S4-R4=CLOSED_BY_SCOPE_EXCLUSION`**. [Raw-close-only policy](../../CAFEF_RAW_CLOSE_ONLY_POLICY.md) supersedes adjusted-methodology eligibility discussion below. Only `GiaDongCua` may enter calculations; raw adjusted fields remain audit evidence. No adjusted-method documentation is required. The historical source-admission section R4 remains a separate pending proposal, not this scope exclusion.

Reviewed commit: `f8857c4aef7701f40933207f175a29f0de351483`. Research cutoff: **2026-10-30**, not a current quote. This successor assessment separates uses; it preserves the earlier evidence and changes no source authority. **S4_OVERALL: PARTIALLY_CLOSED_RESEARCH_ONLY; formal admission remains pending CIO review.** No progress percentage is used.

Reused unchanged: **1,197 price rows, 15 historical cash-dividend components, 11 PDF reviews, official receipts and 24 scoped tests**. No price/event history re-fetch, skill rebuild, raw overwrite or backfill. Supporting decisions, policy pins and the targeted capital bridge are in [TARGETED_FINDINGS.json](TARGETED_FINDINGS.json); preservation/tests are in [PRESERVATION_CHECK.json](PRESERVATION_CHECK.json).

## Independent use-case decisions

| Decision | Result and sufficient evidence | Remaining issue / materiality | Blocks VNM valuation at this cutoff? |
| --- | --- | --- | --- |
| `RAW_CLOSE_CUTOFF` (A) | **RESEARCH_QUALIFIED**: CafeF `GiaDongCua=56.9`, dated30Oct, provider UI declares thousand VND and separates adjusted close. Thus **56,900 VND/share**, corroborated by retained30Oct TCBS/Vietstock. Identity, receipt/hash and row pointer exist. | Formal source/capability/time-purpose admission is pending. No numerical close discrepancy. | **No** for labelled retrospective research. Formal consumption still needs its own admission. Missing adjusted-series methodology does not veto this raw observation. |
| `CASH_DIVIDENDS` (B) | **RESEARCH_QUALIFIED for the15 reviewed components**: source PDF terms, cash classification, fiscal/ex/record/payment periods retained. PDF/VSDC1,850 supersedes API1,800 for research selection; raw stays unchanged. | No remaining amount/date dispute in this bounded set. Publication/admission proof is separate; this is not an exhaustive capital register or proof of investor receipt. | **No** for these historical terms. Do not treat history as a forward dividend forecast or count announced future cash as received. |
| `SHARE_COUNT_CUTOFF` (C) | **CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS**: Q3 Note22 outstanding **2,089,955,445** at30Sep. **S4-R1=CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY**. | No effective October change found in reviewed downloaded Vietstock documents. Coverage is incomplete; legal issued/treasury flows remain unknown, not zero. Q3 listing timestamp31Oct does not prove PIT availability. | **No** for the owner-approved retrospective denominator. Formal source/time/PIT admission remains separate. |
| `ADJUSTED_PRICE_SERIES` (D) | **EXCLUDED_BY_OWNER_POLICY**. Preserved adjusted observations remain audit-only raw data. | None within excluded scope. Do not require methodology documentation. | **No**; calculation use is prohibited. |
| `HISTORICAL_TOTAL_RETURN` (D) | **NOT_QUALIFIED**. Cash components alone do not establish a complete comparable price/action chain. | Action continuity, three coverage gaps, return/reinvestment/tax convention remain unqualified. Do not double-adjust dividends. | **No**, provided historical realized returns are excluded. Prospective5Y return does not require a historical adjusted-price backtest. |
| Historical backtesting / PIT (E) | **NOT_QUALIFIED**. Some contemporaneous receipts exist, but the whole historical decision-time chain is not proven. | Publication/revision, availableAt and review-knownAt proof at each historical decision point remains material. Retrieval11/12Nov is not30Oct operational knowledge. | **No** for retrospective sensitivity; **yes** for a PIT/backtest claim. |
| `S4_OVERALL` | **PARTIALLY_CLOSED_RESEARCH_ONLY — CIO REVIEW**. A/B sufficient for their bounded research purpose; C carried forward under owner policy; adjusted calculation excluded and TR/PIT remain unqualified. | Owner carry-forward closes the denominator scope; scope-specific formal admission remains. | No blanket S4 veto on supported inputs; no unconditional/formal valuation authorization. Other valuation work is outside scope. |

## Exact policy requirements, without new gates

- **`docs/03 SCORING/METRIC_DEFINITIONS.md` §§3.2,3A.6:** comparable per-share denominators from issuer restatement/authoritative terms; do not derive historical denominators merely from current shares. **§§8.1–8.3**, especially §8.2 required components, use dated market price, normalized starting value, growth/exit assumptions, distributions and dilution. They do **not** expressly require a historical adjusted-price method to use a raw spot close or to model prospective5Y returns. No rubric definition or band is changed here.
- **Implemented market contracts**, not newly asserted owner-approved authority: `src/domain/market-boundary/tcbs-eod.ts::normalizeTcbsEod` (`TCBS_SCOPE_ADJUSTMENT`, `EOD_BOARD_PRICE_CONFLICT`) admits only the matching latest completed RAW bar under a bound profile; historical adjusted/return series are expressly outside scope. `validation.ts` checks `PRICE_SEMANTICS`, `PRICE_UNIT_CURRENCY`, `OBSERVATION_TIME`, `OBSERVATION_LINEAGE`, `RAW_SOURCE_REQUIRED` and capability semantics. RAW and ADJUSTED are separate values. These candidate/technical contracts do not themselves prove an approved CafeF capability or source admission; no owner-approved rule requiring a full adjusted factor history for this raw close was identified.
- **Formal time/source gate:** `src/domain/scoring/evidence.ts::validateTime` requires its applicable publication/availability provenance; canonical time binds availability/review knowledge to cutoff (`INVALID_OPERATIONAL_KNOWLEDGE`). `src/domain/fundamentals/source-authority.ts::FINANCIAL_SOURCE_POLICY` distinguishes ingestion from qualified fact authority, same-definition conflict resolution, and exact historical publication/revision proof. Financial-report CafeF approval is not blanket market API approval.
- **Actual owner authority scope:** `evidence/2026-10-29-approved-authority-activation/OWNER_APPROVAL_RECEIPT.json` explicitly excludes **market/data admission**. Approval of executable scoring code cannot admit these facts. The matrix below is a proposal, not an approval. Policy files/hashes and precise functions are bound in `TARGETED_FINDINGS.json#/policies`.

## R1 — adjustment investigation

**CLOSED_BY_SCOPE_EXCLUSION for S4-R4.** Owner prohibits adjusted-price calculation use. Existing raw fields and prior diagnostic search remain audit history; unknown method/factors/anchor/revision remain null without creating an evidence request. Only `GiaDongCua` may enter calculations, with no adjusted fallback. Historical total returns/backtests need raw closes plus separately verified actions; incomplete evidence returns NOT_QUALIFIED. No formula was fitted or factor invented.

## R2 — dated issued / treasury / outstanding bridge

| Interval / point | Issued / outstanding evidence | Treasury and continuity conclusion |
| --- | --- | --- |
| FY2022, FY2023, FY2024, FY2025 | Each accepted annual chronology has opening=closing issued and outstanding2,089,955,445, with no parent movement identified in reviewed equity/financing rollforwards. Reuse prior verified bounded research conclusions. | Issued minus outstanding implies0 at endpoints. This arithmetic is not a new independent treasury-custody certificate or proof against every gross round trip. |
| 01Jan–30Jun2026 | Retained issuer note, consolidated PDF physical p59 (`notes/VNM.json#/documents/4/pages/58`), explicitly shows both endpoints at2,089,955,445. | Endpoints verified; no new exhaustive daily no-action claim. |
| 30Jun–30Sep2026 | Reuse Q3 issuer anchor2,089,955,445 issued/outstanding, physical p59, PDF hash `fd144a9a…5d7c8378`, previously visually reviewed. | Endpoints corroborated; continuous event-register completeness not proven from equality alone. |
| 01–30Oct2026 | Retained30Oct Vietstock profile has listed/outstanding2,089,955,445. Its footnote includes provisional corporate-action shares. | **Independent cutoff issuer-issued, treasury and effective movements remain unverified/null.** Owner now carries Q3 outstanding2089955445 forward under the reviewed-document rule; no verified zero-flow claim. |
| VSDC registration cross-check, retrieved12Nov | [Official VNM register](https://vsdc.vn/vi/s-detail/943):16 visible registration entries; total2,089,955,445; last listed change/certificate27Oct2020, increase348,267,652. Exact new source retained. | Measures **registered securities**, not treasury or trading-outstanding. Supports registered-base chronology; not a saved30Oct page or PIT proof. |

The owner carry-forward amendment supersedes the earlier requirement for a separate cutoff attestation in this bounded denominator scope. The retained endpoint and legal-flow limitations remain explicit. See the reviewed inventory and dated decision in [the carry-forward review](../../vnm-s4-share-carry-forward/2026-11-12/FINAL_REVIEW.md). No historical zero movement is invented.

## R3 — only the three requested dates

| Date | Targeted finding | Treatment |
| --- | --- | --- |
| 2025-08-14 | Thursday; absent from accepted CafeF data and prior13–15Aug probe. Newly retained HOSE2079/TB-SGDHCM26Dec2024 annual calendar p1 does not list it as a holiday. No official VNM daily observation or dated special-closure/halt determination obtained in bounded search. | Retain as provider coverage limitation, not a holiday or invented bar. |
| 2026-01-29 | Thursday; absent from prior28Jan–2Feb probe and retained2026 holiday list. That display calendar was not independently admitted. | Day-level official observation/exception unresolved; coverage limitation remains. |
| 2026-01-30 | Friday; same probe/calendar limitation. | Same treatment; no imputation. |

New HOSE February2026 handbook p2 confirms normal ATC14:30–14:45 and negotiated trades through15:00; it does **not** certify that a particular January date traded. Secondary vendor/broker context suggests trading on affected dates, but is not used to backfill official OHLC. No other missing date was investigated. These gaps limit complete-series/TR/PIT claims and **do not block the existing30Oct closing observation**.

## R4 — source admission proposal

| Evidence / use | Research classification | Existing-policy formal route / present status |
| --- | --- | --- |
| CafeF30Oct original close + own unit/column declaration | **Research-qualified**, dated56,900 | Market capability, exact semantics/session/source/time-purpose binding and authorized acceptance needed. **Not formally admitted.** |
| Fifteen PDF-reviewed cash terms with official cross-checks | **Research-qualified**, bounded event set | Qualified issuer/disclosure/verified-PDF route is permitted by existing policy; exact fact/publication/availability/adoption conditions still apply. **Eligible route, not present admission.** |
| TCBS30Oct daily bar | **Restricted to historical sensitivity/corroboration** | Existing field remains `PROVIDER_UNDECLARED`; do not fabricate latest-EOD RAW authority from price equality. |
| Cutoff shares from Q3 Note22 plus reviewed downloaded disclosures | **Owner-approved carry-forward denominator**,2089955445 | S4-R1 closed under the bounded rule; incomplete coverage and formal source/time admission remain explicit. Registration is corroboration only. |
| Adjusted series / historical total return / PIT | **Not qualified** for those uses | No automatic admission or exception proposed. Retain raw evidence; exclude derived claims. |

**No source is declared formally admitted by this report.** “Formally admissible under existing policy” identifies a conditional qualification route, not a satisfied authorization. Owner choices are in [OWNER_DECISION_SHEET.md](OWNER_DECISION_SHEET.md).

## Only unresolved material blockers for unrestricted valuation

1. **Formal source/time-purpose admission:** bind and accept the exact price/cash/share facts under the existing qualification/availability route before formal consumption. Owner choice does not cure absent documentary/time proof.

Adjusted methodology, three historical gaps and PIT proof remain restrictions of **excluded use cases**, not additional vetoes on the supported raw close/cash inputs. Prior cash1,800/1,850 resolution is preserved; volume differences are not valuation inputs and are not reopened. No score /100, M3/M4 change, production promotion or portfolio mutation. **STOP for CIO approval.**
