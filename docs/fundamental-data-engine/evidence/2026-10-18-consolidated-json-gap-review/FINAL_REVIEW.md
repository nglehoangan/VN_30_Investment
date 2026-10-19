# Consolidated JSON gap review — 2026-10-18

Source: `data/comparisons/VN30/annual-pdf-first.json` (SHA256 `75b77cd8c5c37a2a7178dcfcffd7f9e43a48c5a2327447e7a1f94cfcdf9f1fd4`, 53224124 bytes). Annual 2022–2025 only; 30 tickers; primary balance sheet, income and cash flow. Candidate evidence only.

| Item | Result | Exact unresolved information |
|---|---|---|
| VNM | PARTIALLY_RESOLVED | Missing issuer-qualified closing financing population and current-portion/finance-lease boundary for 2024-12-31, 2025-12-31 and 2026-06-30; annual borrowing captions alone do not establish complete FINANCIAL_DEBT. |
| TCX | STILL_BLOCKED | Missing FY2022 note/contract bridge establishing whether the 5,284,485,167,173 VND Két Vàng managed-investor payable is interest-bearing financing within FINANCIAL_DEBT, including repayment and asset-backed/managed-fund obligations. |
| MBB | STILL_BLOCKED | Missing consolidated reported CAR explicitly as-of 2026-06-30, regulatory framework and source locator. |
| VIB_CAR | STILL_BLOCKED | Missing consolidated reported CAR explicitly as-of 2026-06-30, regulatory framework and source locator. |
| VIB_NPL | STILL_BLOCKED | Missing issuer/regulatory definition of the published 2.10% numerator and denominator, component reconciliation, scope and exact 2026-06-30 date bridge. |
| VIC | STILL_BLOCKED | Missing verified extraction tied to the original reviewed consolidated 6M2026 Vingroup report identity, original hash, review firm/status and page/note locators. |

LEVEL1_PROMOTION_CANDIDATES: []

STILL_DEFERRED: [VNM, TCX, MBB, VIB, VIC]

NEW_CRITICAL_GAPS: 0; NEW_MAJOR_GAPS: 0 **new confirmed accounting blockers**. The annual dataset omits current mandatory observations for all 30 tickers. These are dataset coverage omissions, not 30 new canonical failures; prior evidence remains independent. Caption candidates and unmatched captions do not certify completeness or prove absence. See the contract-slot inventory and source-search locators.

VNM annual short/long borrowing captions are explicit, but do not prove the complete financing/current-portion boundary. The two borrowing caption sums are not QUALIFIED_FINANCIAL_DEBT. Provider template zeros do not prove absence. Cash-flow proceeds/repayments and interest expense are movements, not closing debt.

TCX FY2022 remains a standalone contract scope; no forced consolidated substitution. The disputed managed-investor payable needs financing semantics, not merely the number or later iSave descriptions.

The bank contract requires CAR **or** qualifying CET1; it does not require both. BANK_REPORTED_NPL is SUPPORTING, not an additional mandatory Level1 observation. The VIB published-ratio definition conflict remains open independently. Historical CARs and MBB March 31 CAR cannot qualify June 30.

Authorized cleanup removed original data-folder PDFs/readers. Physical PDF retention is not imposed anew. A verified extraction with identity/hash/review qualification and locators could support VIC review, but that qualifying June2026 source linkage is not established. Historical paths are not claimed to exist.

No canonical facts, blockers, disposition, Policy B, DI14/DI15 or scoreability changed. No scoring, ranking or decisions ran. Review stopped; await **Review Consolidated JSON Gap Analysis**.
