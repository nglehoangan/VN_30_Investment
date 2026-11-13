# F2 closure criteria and validation design

These are future implementation acceptance tests, not tests executed by this assessment. Existing v4 success is retained; synthetic fixtures alone cannot establish multi-sector real-data closure.

## Representative real-data paths

Select actual native cells using the matrix's canonical fact IDs / ledger references, then build exact plans from retained documents. Assert native lexical value and declared units normalize to the retained expected amount, not a copied expected scalar disconnected from source.

| Fixture | Minimum bounded facts/periods | Required proof |
| --- | --- | --- |
| VNM / RETAIL | Total assets/equity, revenue, earnings, CFO, inventory, qualifying debt alternative and cash; FY2025 + H1 2026, then retained Q3/YTD current columns | Source aliases by SHA, original receipts, exact consolidated native cells, cashflow period, no automatic normalized/common-profit/cash inference; do not promote pending VNM17 proposal. |
| ACB / BANK | Assets/equity/earnings, loans, deposits, loan-loss reserves and CAR or CET1; FY2025 + H1 2026, then retained Q3/YTD current columns | Exact loan/reserve populations, bank report definitions/units, capital disclosure identity and current Q3/YTD freshness;  bank-specific NPL/coverage/CASA mappings only where evidence supports them. |
| HPG / MATERIALS | Core quantities plus gross/operating margin and debt components | Existing debt-v2 population/lease/unknown-liability proofs; cyclical normalized/downside output only when independently supported economically. |
| SSI / SECURITIES | Assets/equity/earnings, liquidity, debt and margin loans | Sector definitions, no nonfinancial debt-v2 assumption or bank-population reuse. |
| VHM, FPT, BSR, GAS, VJC | Corresponding real-estate inventory/realization, services reinvestment, energy margin and utility cash-capex core | One exact real witness per distinct native statement family and each configured sector, including VJC industrial reinvestment; preserve heterogeneous captions and scope. |

Use a newly created isolated temporary SQLite database with migrations and a fixed clock; the active database remains untouched. For each fixture run the actual financial ingest planner, lexical normalization, hybrid/canonical validators, standing trust verifier, Evidence validation with CURRENT_FORMAL_VALUATION, persistence and governed consumption. Check raw bytes/hash, original receipt/review/publication identities, source role, issuer, schema/adapter/policy version, exact dimensions and all observation/fact lineage. Replay deterministically; inspect persisted rows and consumed evidence, not merely planner success. Preserve an immutable validation report with input/policy/code/output hashes.

## Required positive and negative cases

- Approved-source real PDF admission and readback for banking and nonbanking; structured API path only after its native adapter is qualified.
- Original source/hash/issuer/report-period/scope/unit/cell locator matches, including scale and negative financial values. Dash/null/missing never converted to zero.
- Reject untrusted URLs, spoofed domain/issuer, changed raw bytes/hash/schema/caption, altered receipt/review time, arbitrary supplied review JSON and unsupported adapter/version. No per-material approval requirement.
- Quarantine conflicting equal-dimension financial facts, incompatible periods/revisions and unsupported normalization. Preserve dissenting raw observations; no latest-wins.
- Repeated input is idempotent; no duplicate observations/facts/raw multipart payloads. Cross-ticker fact/capture/semantic catalogs cannot leak.
- Revoked/superseded standing version or admitted record cannot be consumed. A material adapter change cannot reuse stale code authorization hashes.
- Later operational knowledge may pass CURRENT_FORMAL_VALUATION when all controls pass; the same fact must fail historical PIT without independently established publication/availability. DATE_ONLY publication is not an invented timestamp.
- Known newer disclosure triggers existing freshness treatment; quarter and YTD remain distinct. Missing H1 comparative/opening stock blocks only dependent TTM/average/metric, not an unrelated valid scalar.
- Bank industrial-ratio substitutions fail. Reported profit/cash/debt cannot masquerade as normalized common profit/unrestricted cash/comprehensive debt.
- Current consumer explicitly receives intended purpose and governed data; legacy strict AS_KNOWN and scoring/analyst completeness gates remain unchanged. Successful ingestion cannot auto-produce a score, portfolio action or production activation.

## Closure decision contract

Full financial coverage requires all applicable CORE/SECTOR_CORE OR-groups and required periods to be economically/dimensionally verified, or a policy-permitted explicit blocked/N/R treatment; supporting/optional and five-year-preferred gaps remain disclosed without invented mandatory gates. The approved 23-rubric model still requires analyst/topic/forward/normalization evidence; F2 raw ingestion is not full score readiness.

F2 admission expansion is accepted only after representative real-data source-to-fact persistence AND consumption pass in isolation, with deterministic replay and negative cases above; then quantify remaining ticker/metric/period exceptions against this inventory. No unsupported “all VN30 ready” claim from representative tests. Historical PIT remains NOT_QUALIFIED unless separately established. Production activation remains NOT_AUTHORIZED. CIO implementation approval is the next gate for this package, not renewed source approval.
