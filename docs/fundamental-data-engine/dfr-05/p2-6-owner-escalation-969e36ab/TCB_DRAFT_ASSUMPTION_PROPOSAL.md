# TCB draft assumption proposal

TCB only. Recorded 2026-11-09, Asia/Ho_Chi_Minh. Decision preparation following the owner-approved P2.6 baseline; **not a third remediation round**. Existing P2.6 remains ANALYSIS_PARTIALLY_READY / ESCALATED for formal investment readiness.

**Seven required economic groups and two additional model prerequisites are documented. All proposed numerical values/ranges are null; owner approval is PENDING.** The selected retained evidence does not support defensible numerical bounds. This is an explicit proposal to qualify the listed inputs before assigning numbers, not another evidence-closure phase. Exact historical observations are context, not forecast bounds. No source was acquired and no new financial normalization was performed.

## A-ROE — Sustainable common ROE

**Classification:** ASSUMPTION. **Value/range:** null/null (RATIO). **Owner:** PENDING. **Confidence:** INSUFFICIENT_FOR_NUMERICAL_RANGE; retained reported fact confidence remains separate.

**Evidence and rationale:** Historical proxy 0.160112585266 is REFERENCE_ONLY: no common/TCE allocation, normalized credit cycle/fees/acquisition attribution or through-cycle return interval. Exact qualified evidence references: EPS_NUMERATOR_PARENT_BOOK_RETURN_PROXY:2025, COMMON_EPS_NUMERATOR:2025, PARENT_EQUITY:2025, OTHER_EQUITY:2025

**Sensitivity:** d(P/B)/dROE=1/(ke-g); reconcile ROE with common capital, earnings and payout.

**Downside:** Lower sustainable return compresses justified book multiple, even when reported EPS grows.

**Precise resolution:** Qualify common book and common-normalized earnings, then build a dated through-cycle numerator/denominator bridge and downside/base supported bounds; owner/analyst case approval required.

## A-KE — Cost of equity

**Classification:** ASSUMPTION. **Value/range:** null/null (RATIO). **Owner:** PENDING. **Confidence:** INSUFFICIENT_FOR_NUMERICAL_RANGE; retained reported fact confidence remains separate.

**Evidence and rationale:** No qualified case-date risk-free term/currency basis, equity/country/bank risk premium or alternative approved discount calibration. Policy 15%/12% forward-return hurdles are not ke bounds. Exact qualified evidence references: No qualified numerical calibration in the approved selected ledger.

**Sensitivity:** d(P/B)/dke=-(ROE-g)/(ke-g)^2; retain ke>0 and ke>g.

**Downside:** Higher common risk premium reduces value; policy return hurdle is not a substitute.

**Precise resolution:** Provide an evidence-supported nominal-VND discount framework at the chosen retrospective basis, avoiding double-counted country/bank risks; approve its numerical inputs and sensitivity. New source classes require separate authority.

## A-GROWTH — Sustainable common-book growth

**Classification:** ASSUMPTION. **Value/range:** null/null (RATIO). **Owner:** PENDING. **Confidence:** INSUFFICIENT_FOR_NUMERICAL_RANGE; retained reported fact confidence remains separate.

**Evidence and rationale:** One-year core loan growth 0.194686378825 and EPS-numerator growth 0.175358850739 are different historical populations, not bounds on sustainable book/terminal growth. Exact qualified evidence references: BANK_CORE_LOANS_GROWTH:2025, COMMON_EPS_NUMERATOR_GROWTH:2025

**Sensitivity:** d(P/B)/dg=(ROE-ke)/(ke-g)^2 with payout/capital consistency.

**Downside:** Growth can destroy value if sustainable ROE falls below ke; no automatic growth premium.

**Precise resolution:** Qualify sustainable ROE, payout/retention, RWA mix and capital funding; derive g consistently as ROE*(1-payout) for the constant-state case.

## A-PAYOUT — Sustainable payout

**Classification:** ASSUMPTION. **Value/range:** null/null (RATIO). **Owner:** PENDING. **Confidence:** INSUFFICIENT_FOR_NUMERICAL_RANGE; retained reported fact confidence remains separate.

**Evidence and rationale:** Declared parent equity dividend movement−7086240000000VND is not a cash payment, a sustainable payout policy or a future distribution commitment. Exact qualified evidence references: PARENT_DIVIDEND_MOVEMENT:2025, COMMON_EPS_NUMERATOR:2025

**Sensitivity:** Change g consistently through g=ROE*(1-payout); recalculate regulatory funding feasibility.

**Downside:** Distributions unsupported by common/regulatory capital imply issuance or reduced growth.

**Precise resolution:** Qualify declaration/rights and future distribution economics against normalized owner earnings and regulatory/common capital. Reconcile payout with growth and capital feasibility.

## A-STRESS — Credit and funding stress

**Classification:** ASSUMPTION. **Value/range:** null/null (STRUCTURED_SCENARIO). **Owner:** PENDING. **Confidence:** INSUFFICIENT_FOR_NUMERICAL_RANGE; retained reported fact confidence remains separate.

**Evidence and rationale:** Reported customer credit-cost 0.006732050583, narrow property share 0.286044492061 and behavioural liquidity gaps do not bound stressed PD/LGD, outflows, funding spreads or haircuts. Exact qualified evidence references: CUSTOMER_CREDIT_COST_REPORTED:2025, REAL_ESTATE_BUSINESS_SHARE:2025, LIQ_GAP_LT1M:2025, LIQ_GAP_1_5Y:2025

**Sensitivity:** Separate property default/severity, collateral, deposit outflow and repricing shocks; quantify only with approved calibrated bounds.

**Downside:** Correlated credit and funding shocks can exhaust reported buffers; positive gross maturity gap offers no assurance.

**Precise resolution:** Qualify population-specific loss/outflow/repricing calibration, usable liquidity and correlated capital response; qualify tax and common-owner attribution. Do not equate gross maturity surplus with free cash.

## A-CAPITAL — Required common/regulatory capital and buffer

**Classification:** ASSUMPTION. **Value/range:** null/null (STRUCTURED_CAPITAL_TARGET). **Owner:** PENDING. **Confidence:** INSUFFICIENT_FOR_NUMERICAL_RANGE; retained reported fact confidence remains separate.

**Evidence and rationale:** Reported CAR 0.1461 and issuer-stated floor 0.08 are historical facts, not a selected forward requirement or adequate stress target; Tier1 is not CET1 or common book. Exact qualified evidence references: REPORTED_CAR:2025, REPORTED_MIN_CAR:2025, TIER1_RATIO:2025, REGULATORY_CAPITAL:2025, TOTAL_RWA:2025

**Sensitivity:** Reconcile target capital, RWA mix, retained common earnings and distributions for each approved scenario.

**Downside:** Regulatory constraints can force dilution or reduce growth/payout despite accounting profits.

**Precise resolution:** Qualify case-applicable requirements, restrictions, target management buffer, RWA migration and common-to-regulatory bridge; approve a stress-consistent growth/distribution/capital path. No new legal conclusion.

## A-TERMINAL — Terminal economics

**Classification:** ASSUMPTION. **Value/range:** null/null (STRUCTURED_TERMINAL). **Owner:** PENDING. **Confidence:** INSUFFICIENT_FOR_NUMERICAL_RANGE; retained reported fact confidence remains separate.

**Evidence and rationale:** No qualified terminal ROE/ke/g/payout or transition horizon; extrapolating FY2025 or using an arbitrary multiple is unsupported. Exact qualified evidence references: No qualified numerical calibration in the approved selected ledger.

**Sensitivity:** Vary only approved terminal economics/transition paths; test sensitivity near ke-g boundary.

**Downside:** A narrow unsubstantiated ke-g spread can dominate value and invalidate a stable terminal case.

**Precise resolution:** Approve stable common economics and transition evidence, ke>0, ke>g and ROE>g; growth/payout and capital constraints must reconcile. Horizon must be explicit, never defaulted.

## A-BOOK — Initial common book for model

**Classification:** ASSUMPTION. **Value/range:** null/null (VND). **Owner:** PENDING. **Confidence:** INSUFFICIENT_FOR_NUMERICAL_RANGE; retained reported fact confidence remains separate.

**Evidence and rationale:** Parent book170044504000000VND is qualified but common/TCE treatment of other equity and group intangibles/NCI is unresolved. Exact qualified evidence references: PARENT_EQUITY:2025, OTHER_EQUITY:2025, INTANGIBLE_ASSETS:2025

**Sensitivity:** V scales with qualified B0 at fixed justified P/B; test each separately supported other-equity/intangible allocation.

**Downside:** Overstated common book overstates both capital available for distributions and value.

**Precise resolution:** Qualify the actual common-capital definition used by the selected model; do not automatically deduct group intangibles from parent book.

## A-ACTIONS — Future capital actions / net common funds

**Classification:** ASSUMPTION. **Value/range:** null/null (SHARES_AND_VND). **Owner:** PENDING. **Confidence:** INSUFFICIENT_FOR_NUMERICAL_RANGE; retained reported fact confidence remains separate.

**Evidence and rationale:** FY2025closing and EPS shares are qualified historical counts; they cannot prove zero future issuance or cash raised. Exact qualified evidence references: CLOSING_SHARES:2025, WEIGHTED_BASIC_SHARES:2025

**Sensitivity:** Kernel requires explicit zero new shares/net cash; any nonzero action is rejected for separately qualified post-issuance B and shares.

**Downside:** Ignoring issuance price, cash proceeds or rights changes can materially overstate per-share value.

**Precise resolution:** For the existing constant-state kernel explicitly propose and approve zero newShares and zero netNewCommonCash as a bounded scenario restriction, not a forecast fact. Otherwise require separately authorized post-issuance specification; none is executed here.

Every evidence binding resolves to the immutable P2.6 financial ledger, which retains PDF/page/native-unit, formula, period, scope and revision lineage. Historical reporting floors, exact shares and growth endpoints are not promoted to forward scenarios. No risk-free rate, premium, tax, forecast, terminal spread, haircut or no-issuance default has been invented. Analyst estimates remain empty; all actual draft/approved valuation outputs remain null.
