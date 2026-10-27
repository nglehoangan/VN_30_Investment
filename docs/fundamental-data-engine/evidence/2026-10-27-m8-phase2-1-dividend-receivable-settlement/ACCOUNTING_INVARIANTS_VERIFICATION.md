# Accounting invariants verification

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Scope: owner-authorized Phase 2.1 implementation and isolated validation only. No Phase 2.2, production posting, source acceptance or migration execution authorized.

For net amount a>0: CASH+a, RECEIVABLE−a pointing to original obligation leg. No SECURITY_QUANTITY, COST_BASIS_ADJUSTMENT, TAX or fee legs. No new dividend income, external flow, MWAC change or realized P&L. Original dividend/cash/deposit/trade-settlement logic is unchanged.

Tests verify synthetic opening cash10, receivable100, position2/basis20; claimA70 andB30. A70 receipt gives cash80/claim total30, dividend0/flow0/realized0, quantity2/basis20/average10. Partial40 then30 clears A; distinct B30 clears aggregate. Over71 against A70 or40+31 fails, no tolerance change. Gross/net mismatch, incomplete evidence, cross-portfolio/issuer/action, overlapping/allocation totals and future knowledge fail.

Actual read-only production replay separately verifies12 transactions24 original legs11 positions, cash232420/receivables570000/payables0, all quantities/basis equal original projection. This is legacy technical integrity, not economic completeness or authorization to post MWG95000. Costs remain approved decimal12 half-even, no changes in values.ts or the BUY/SELL released-basis calculation. Existing accounting regressions run unchanged.
