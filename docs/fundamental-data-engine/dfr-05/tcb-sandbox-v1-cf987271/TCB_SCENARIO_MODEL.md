# Isolated Decimal model and provenance

**RESEARCH_ONLY · HYPOTHETICAL · NOT_AN_APPROVED_INTRINSIC_VALUE · NOT_FOR_M3_M4_OR_PRODUCTION**

TCB only,2026-11-10. Historical FY2025accounting anchors plus configurable illustrative assumptions. No market price, formal intrinsic value, M3/M4or production purpose.

**Framework:** justified P/B=(ROE−g)/(ke−g), with g=ROE×(1−payout); hypothetical equity=B0×P/B; per-share model value=equity/closing ordinary shares. Enforce ke>0,ke>g,ROE>g,0<=payout<=1,nonnegative unit ratios and constant-state terminal equality. Values remain arbitrary economic hypotheses even when mathematics passes.

Historical book is170,044,504,000,000VND; closing ordinary shares7,086,240,414; reported ordinary common EPS numerator25,254,851,000,000VND. The numerator is a historical context anchor, not mechanically carried into future ROE. Original record/native units, scope, period, exact JSONpointers and hashes are preserved in `anchors.json`, including source equity/NCIoperands and the approved common-book definition. Regulatory capital and RWAremain regulatory-consolidated; book is neither TCE nor unrestricted distributable capital. No TCBSprice enters the anchors.

Decimal working precision70,12dp historical credit-anchor strings preserved, no binary floats. Monetary results retain full working precision; readable values are rounded for display only. P/Bexact numerator/denominator and RIprojection permit reproduction. The finite constant-state RIcheck converges algebraically to P/Bfor any accepted integer horizon; it is a consistency check, not an independent economic crosscheck.

Credit sensitivity: hypothetical forward rate×fixed averageFY2024/FY2025core bank loans minus actual reported bank-customer provision charge. Then apply explicitly hypothetical tax/common incidence. Funding stress: hypothetical spread×closing issued-instrument pocket, with the same explicit tax/incidence. `preStressROE=(allInROE×B0+creditCommonDelta+fundingCommonDelta)/B0` reconciles the components. The model uses all-inROEonce: it does not deduct these diagnostics a second time or add funding spread to ke. Missing stress inputs reject rather than fill zero. Additional capital-loss charges are rejected without a separate bridge; one-time prudential deductions remain outside P&L.

Replay offline:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 docs/fundamental-data-engine/dfr-05/tcb-sandbox-v1-cf987271/run.py
PYTHONDONTWRITEBYTECODE=1 python3 docs/fundamental-data-engine/dfr-05/tcb-sandbox-v1-cf987271/test_model.py
PYTHONDONTWRITEBYTECODE=1 python3 docs/fundamental-data-engine/dfr-05/tcb-sandbox-v1-cf987271/report.py
```

`run.py` optionally accepts an explicit config-file path; all writes remain in this sandbox. Source pins and anchor values/units are checked before calculation. `prepare.py` preserves an existing editable scenario-inputs file. After edits, rerun and validate; the current sealed manifest intentionally rejects changed outputs until a new review. No external libraries, production imports or network calls are needed by the model.
