# CafeF market history — raw close only

Owner decision12Nov2026: [receipt](governance/CAFEF_RAW_CLOSE_ONLY_OWNER_DECISION_2026-11-12.json). Machine policy: `src/domain/market-boundary/cafef-raw-close-policy.json`, version `cafef-raw-close-only-v1`.

For every CafeF calculation consumer, including valuation, scoring, portfolio analytics, historical returns and backtests, **only `GiaDongCua` is eligible**. `GiaDieuChinh` remains in immutable source responses for audit; it is never a fallback. Missing/null/zero/invalid raw close is not qualified. Source values stay in native raw units; calculation normalization multiplies by1000 using exact decimal arithmetic only with explicit thousand-VND unit evidence. Receipt time, ticker, trading date, row pointer, source hash and corporate-action policy are retained. Owner selection is not source admission.

## Enforcement

- `normalizeCafefRawClose` is the owned calculation-field reader. It reads only `GiaDongCua`, produces `CLOSE/RAW/VND_PER_SHARE`, points to that raw field and does not mutate the input.
- `validation.ts` checks CafeF capability semantics and rejects adjusted observations or adjusted field pointers even when falsely labelled RAW. This applies to every market purpose. Non-CafeF provider policies remain unchanged; no existing seal is rewritten.
- `qualifyCafefHistoricalUse` is a separate **input eligibility gate**, not a new return engine. It requires raw closes, verified complete action/register evidence for the same security/interval, evidenced session coverage and separate PIT evidence for backtests. Unknown/incomplete actions produce `NOT_QUALIFIED` with `returnValue:null`. Even qualified synthetic inputs return no numeric performance claim; a governed model and authority remain separate.
- Actions stay separate from prices. Never infer cash dividends or split/rights factors from the adjusted/raw price difference, add dividends twice or manufacture a no-actions certificate from an empty list.
- Regression architecture checks forbid direct adjusted-field reads in application code and raw-field reads outside the owned normalizer. Raw collectors and archived audit analyses retain original fields; audit retention is not eligible calculation use.

## Consumers located

| Existing path | Role / treatment |
| --- | --- |
| `skills/fetch-cafef-price-history/scripts/fetch.py` | Raw acquisition, page validation, deduplication and source audit. Retains all provider fields. No investment calculation output or SQLite/dashboard integration. Retrieval code and stored bytes unchanged. |
| `docs/fundamental-data-engine/vnm-s4-skills/2026-11-11/build_analysis.py` | Archived diagnostic assessment. Adjusted value in that historical report is audit context, not an eligible valuation input. Historical replay must now be explicit; it must not regenerate current S4 decisions or reopen S4-R4. |
| `data/market-history/cafef/VNM.json` |1197 immutable source rows/receipts; adjusted fields preserved. |
| `data/market-history/VNM.json` |1200-date provider index, including3 separate owner Vietstock rows. CafeF policy applies to the1197 CafeF rows, not as an invented unit/method declaration for the3 XLS rows. Index/source files unchanged by this policy change. |
| App valuation/scoring/portfolio/dashboard | No CafeF history reader was wired at the reviewed baseline. Current display path uses TCBS via `direct-market-prices.ts`; no wiring, authority or activation is changed. Newly normalized CafeF candidates must still pass existing qualification/consumption gates. |

## Current VNM S4 decision

| Item | Status |
| --- | --- |
| `RAW_CLOSE_CUTOFF` | `RESEARCH_QUALIFIED` —30Oct2026 `GiaDongCua=56.9`, explicitly sourced thousand-VND conversion →56,900 VND/share. |
| `ADJUSTED_PRICE_SERIES` | `EXCLUDED_BY_OWNER_POLICY` |
| `S4-R4` | `CLOSED_BY_SCOPE_EXCLUSION` — adjusted-methodology requirement permanently removed for this owner-selected use. |
| Historical total return / backtesting | `NOT_QUALIFIED` when corporate-action/session/PIT evidence is incomplete; only raw close plus separate verified actions may qualify. |

The identifier `S4-R4` above is the adjusted-series scope item named in the current owner decision. It does **not** close the earlier remediation report's section R4 **source admission proposal**. Cutoff share-count qualification and formal source/time-purpose admission retain their existing limitations. No adjusted-methodology documentation is required or to be requested again. STOP for CIO review; no source promotion, portfolio posting or production activation.
