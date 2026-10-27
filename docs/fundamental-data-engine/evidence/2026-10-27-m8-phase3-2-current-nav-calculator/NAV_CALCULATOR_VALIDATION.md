# Nav Calculator Validation

Date: 2026-10-27. Scope: Phase 3.2 isolated implementation only.

Pure `calculateCurrentNav` clones inputs, canonicalizes unordered sets, validates observations/authority and uses Decimal multiplication/addition/subtraction. SecuritiesMarketValue=sum(quantity×price); NAV=cash+securities+receivables−liabilities. Outputs are exact decimal strings; no Number financial arithmetic, implicit zero, clamp, price averaging, latest-wins conflict selection or trade-price substitution.

SYNTHETIC expected point: cash1000 + 2×100 + claims30 − payable10 =1220. Price0.123456789012 yields MV0.246913578024 and NAV1020.246913578024. A thirteenth fractional digit is rejected by existing Decimal policy. Zero NAV is preserved/nonpositive flagged. Pure expression0+10+0−20=−10; this arithmetic test does not waive M2 no-margin.

Unit coverage is exact against reconstructed quantities. Missing/duplicate positions, ambiguous reverse market identities, duplicate economic units or mismatched unit partition block total NAV. Corporate pending rights block full NAV and are excluded from ordinary subtotal. Synthetic200ordinary+20pending remains220, not240. Synthetic accepted split100→200 preserves basis and yields200×50=10000. No actual FPT status is inferred.
