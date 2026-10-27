# Market Price Qualification Validation

Date: 2026-10-27. Scope: Phase 3.2 isolated implementation only.

`priceReasons` validates exact ledger/unit identity and market UUID/provider code/ISIN or evidenced alternate; venue HOSE/class COMMON_SHARE; VND/VND_PER_SHARE/multiplier1; positive exact RAW decimal; matching CA hash; approved EOD kind; session/date/calendar/policy/T; knowledge/retrieval/source pins and revocation.

Identical canonical duplicate observations are deduplicated; distinct rows for the same unit block as conflicting prices even if amounts agree. Extra/unheld prices block. Shared market UUID/provider/ISIN across different ledger securities blocks ambiguous valuation. No ticker-only identity is supported.

Expiry equals the accepted next-completed-session boundary, exclusive; no arbitrary age threshold. Latest-completed date must match session; calendar must cover both session and next boundary. Policy and calendar themselves require trusted exact scoped proof. Legacy VALUATION authorization cannot qualify PORTFOLIO_NAV.

Pure validation does not request TCBS, authenticate files or confer accepted identity/source authority. Future provider must hash retained bytes and consult authenticated records. No actual source is approved in this phase.
