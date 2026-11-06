# P2.1 sector-route qualification — proposal only

Baseline `653d67f78df519ce087c65a6a6cc773c9f615b2e`. Planning date06/11/2026; fixed approved research date05/11/2026 and universe2026-11-05-v1, hash `931e8355854bccc45918b38f2c5061bfda0786bf4bb8779fbe213be8e5107d56`. P1 Engineering Baseline v1.0 and P2.0 Research Universe Baseline v1.0 are APPROVED by the current owner request. Historical sealed documents remain unchanged; no request to approve those requirements again.

**Planning and qualification only. No24-issuer financial pipeline, assessment, scorecard, valuation or batch has run.** READY means a route specification is defined under existing approved methodology; it does not mean source sufficiency, implemented software or an investment rating. READY_WITH_CONDITIONS identifies a specific implementation/reconciliation bridge, not a reason to invent data. BLOCKED would require a genuine unresolved route-method contradiction, not merely missing financial evidence.

Route counts: READY 16; READY_WITH_CONDITIONS 8; BLOCKED0. There is no identified need to amend M3 bands, weights or formal sector taxonomy. These custom research subtypes are descriptive route labels only.

## Existing contracts and concrete engineering gaps
P1 Store/Adapter/DependencyGraph contracts, source priority, Decimal/pointer semantics, DFR02 metric formulas and DFR03/04 complete-topic validators are reusable. P1 issuer() and DFR02 Graph still reject non-pilots; build_metrics currently branches bank/securities by BID/TCX, and its securities scope is TCX standalone. An extension must dispatch by explicit approved stable identity, M3 sector, research subtype and qualified scope instead of simply adding tickers to a list. These are engineering changes in a later authorized package, not changes to the investment methodology. Implement them in a new versioned route/adapter/graph-construction layer: keep sealed P1 and DFR02 source bytes unchanged, delegate reusable traversal/arithmetic/definition primitives, and regression-check the old kernels independently. Never monkeypatch PILOT, run a new issuer under BID/TCX identity, or rename computed pilot IDs afterward.

The approved manual evidence-requirements JSON defines required input groups for all current M3 sectors. The wrapper sector-requirement-templates.ts exposes the nine relevant sectors and explicitly does not assert full scoring sufficiency. Never silently change mandatory group alternatives; optional economic context does not replace an unsatisfied canonical input. The seven M3 category weights25/15/15/10/20/10/5 stay unchanged. No percentile score, peer sample, cycle assumption, tax rate or valuation input is manufactured.

## Route economics and reconciliation contracts
### BANK — READY
Reuse: BID/BANK. Approved normalization sections: 5, 18, 19.1, 20, 20A.1.
Metric families: BANK_NET_INTEREST_INCOME; BANK_GROSS_CUSTOMER_LOANS; BANK_CUSTOMER_DEPOSITS; BANK_LOAN_LOSS_RESERVES; BANK_REPORTED_CAR or BANK_REPORTED_CET1; GROUP_ROA_AVG/GROUP_ROE_AVG; LOAN_DEPOSIT; RESERVES_GROSS_LOANS; NII_ASSETS_CLOSING (not NIM)

- Regulatory CAR/CET1 numerator, RWA, framework, regulatory scope/date versus book equity; reported CAR cannot be recreated from rounded inputs.
- Loan-quality groups → gross loans → specific/general provisions, write-offs/recoveries and credit-cost recurrence; reserves/gross loans is not NPL coverage.
- Interest accrual/receipt/problem-loan recognition; funding/deposit concentration, contractual/behavioral maturity and liquid-fund restrictions.
- Consolidated parent/NCI, acquired credit portfolios and action-adjusted shares/BVPS; no bank CFO/NPAT, industrial debt/equity or current-ratio substitute.

Conditions: No unresolved method condition; ordinary future code/issuer-evidence tests still apply.
Valuation policy: Existing M3 bank P/B/residual income and sustainable ROE; no new valuation inputs or values.

### SECURITIES — READY
Reuse: TCX/SECURITIES. Approved normalization sections: 13.1, 18, 20.
Metric families: standalone or consolidated equity/assets/NPAT in one explicitly selected scope; SECURITIES_MARGIN_LOANS; FINANCIAL_DEBT; CASH_AND_EQUIVALENTS; DFR02 MARGIN_LOANS_EQUITY, FINANCIAL_DEBT_EQUITY, CASH_FINANCIAL_DEBT; through-cycle fee/trading income as qualified context

- Separate broker/client/restricted funds; margin exposures/collateral/impairment; AFS/HTM/FVTPL and noncash revaluation.
- Debt principal/premium/interest and maturity ladder, FX/hedges, rollover and stressed liquidation; securities are not free cash.
- Bind SSI actual source scope and any NCI explicitly; TCX standalone is not an SSI scope default.
- Track corporate actions and consistent earnings/equity/share denominators; market turnover context is not a forecast.

Conditions: No unresolved method condition; ordinary future code/issuer-evidence tests still apply.
Valuation policy: Existing M3 P/B or P/E relative to sustainable through-cycle ROE; valuation deferred.

### CONSUMER_MANUFACTURER — READY
Reuse: VNM/CONSUMER_DAIRY financial kernels; subtype-specific source mapping. Approved normalization sections: 8, 18, 20.
Metric families: reported assets/equity/group NPAT/parent-attributable profit; explicit common/NCI separation; reported revenue/margins, receivables/inventory and acquisition cash spending; DFR02 same-scope FY2022–25 reported diagnostics; these are not normalized owner FCF or per-share growth; price/volume/mix, brand/distribution and production economics only when topic evidence qualified

- Price-volume/mix and distributor/customer/channel changes; no fabricated same-store metric for a manufacturer.
- Raw/finished inventory, impairment, supplier terms, working-capital cash and tax/interest/fund timing.
- Factory capex versus maintenance/growth, investments/dividends and common-owner/NCI; no VNM-specific caption crosswalk or parent cash bridge copied.
- Separate organic/acquired growth and the effective share/action chain.

Conditions: No unresolved method condition; ordinary future code/issuer-evidence tests still apply.
Valuation policy: Existing M3 consumer normalized P/E, EV/EBIT or DCF; parameters remain unapproved.

### RETAIL_STORE_NETWORK — READY
Reuse: VNM common corporate kernels; M3 §8 retailer-specific topic map. Approved normalization sections: 8, 18, 19.3, 20.
Metric families: reported assets/equity/group NPAT/parent-attributable profit; explicit common/NCI separation; reported revenue/margins, receivables/inventory and acquisition cash spending; DFR02 same-scope FY2022–25 reported diagnostics; these are not normalized owner FCF or per-share growth; mature/new-store cohorts, comparable sales, payback and lease-adjusted funding only with qualified source operands

- Mature-store sales/productivity versus openings/closures, acquisition growth and inflation; store count is not value creation.
- Obsolete inventory/provisions, supplier financing and signed operating-WC cash; avoid triple-counting one inventory root cause.
- Consistent lease commitments/liabilities, interest/capex and maintenance/growth; reconcile chains/segments and parent/common cash.

Conditions: No unresolved method condition; ordinary future code/issuer-evidence tests still apply.
Valuation policy: Existing M3 consumer normalized P/E, EV/EBIT/DCF; no forecast or lease multiple assumed.

### REFINING_ENERGY — READY_WITH_CONDITIONS
Reuse: P1 corporate source/metric kernels; no validated P1 refining overlay. Approved normalization sections: 12, 10, 16, 18.
Metric families: reported assets/equity/group NPAT/parent-attributable profit; explicit common/NCI separation; reported revenue/margins, receivables/inventory and acquisition cash spending; DFR02 same-scope FY2022–25 reported diagnostics; these are not normalized owner FCF or per-share growth; reported refining gross/operating margin, inventory valuation and disclosed commodity/FX drivers; normalized crack/inventory/through-cycle earnings context only after qualified bridge

- Separate physical refining economics from inventory-price gains/losses, derivative/FX effects, tax and nonrecurring items.
- Bind crude/product inventory valuation and signed inventory cash, planned shutdown/maintenance versus expansion capex and debt/funds.
- Do not label FY2022–25 reported margins mid-cycle; disclosed/approved normalization evidence required; no spot earnings valuation shortcut.

Conditions: RF-01: typed refining/inventory normalization bridge and missing-cycle-data fixture must be implemented and challenged; no new band or synthetic crack spread.
Valuation policy: M3 energy normalization and materials cycle principles; normalized valuation remains deferred without inputs.

### GAS_INFRASTRUCTURE — READY_WITH_CONDITIONS
Reuse: P1 corporate kernels; new utility contract/project bridge. Approved normalization sections: 11, 12, 18.
Metric families: reported assets/equity/group NPAT/parent-attributable profit; explicit common/NCI separation; reported revenue/margins, receivables/inventory and acquisition cash spending; DFR02 same-scope FY2022–25 reported diagnostics; these are not normalized owner FCF or per-share growth; disclosed gas transport/processing/trading segments and contracted/regulated versus commodity-sensitive income; qualified project/corporate funding, tariff/concession, utilization and DSCR where directly supported

- Separate gas commodity/trading price exposure from contracted/regulated transport and processing; stable cash flows are not assumed from the sector label.
- Project versus corporate debt, restricted accounts, usable lines and maturity; DSCR only on a matched debt-service/available-cash definition.
- Contract pricing/pass-through/collection, capex commitments, maintenance/growth and common-owner distributions.

Conditions: UT-01: define contract/project boundary and debt-service population fixture; unsupported tariffs, concessions or DSCR remain NOT_RATED.
Valuation policy: Existing utilities DCF/EV-EBITDA with capex/debt context; no tariff or discount assumptions selected.

### INTEGRATED_STEEL — READY_WITH_CONDITIONS
Reuse: P1 corporate kernels; new commodity-cycle/capacity-cohort bridge. Approved normalization sections: 10, 16, 17, 19.4, 20.
Metric families: reported assets/equity/group NPAT/parent-attributable profit; explicit common/NCI separation; reported revenue/margins, receivables/inventory and acquisition cash spending; DFR02 same-scope FY2022–25 reported diagnostics; these are not normalized owner FCF or per-share growth; reported steel margin, inventory/provisions, project commissioning and utilization context; through-cycle/trough leverage and realized incremental capital return only when qualified

- Steel/input price spread and inventory effects versus operating efficiency; peak price/margin/EPS are one economic family.
- Expansion construction/capitalized costs/interest, commissioning and mature-cohort returns; spending is not an outcome.
- M3 5–10Y cycle context where possible is not supplied automatically by four DFR02 annual observations; otherwise retain explicit normalization gaps.

Conditions: ST-01: implement cycle-window and ramp-up/cohort reconciliation; no automatic normalized EBITDA from four reported years.
Valuation policy: M3 materials normalized earnings, mid-cycle EV multiples/replacement value where defensible; valuations deferred.

### RUBBER_INDUSTRIAL_LAND_HOLDING — READY_WITH_CONDITIONS
Reuse: P1 corporate kernels and VIC look-through principles; new rubber/land split. Approved normalization sections: 10, 14, 18, 20A.5.
Metric families: reported assets/equity/group NPAT/parent-attributable profit; explicit common/NCI separation; reported revenue/margins, receivables/inventory and acquisition cash spending; DFR02 same-scope FY2022–25 reported diagnostics; these are not normalized owner FCF or per-share growth; rubber operating results and biological/plantation economics as reported; industrial-land subsidiaries, land/conversion/transfer gains and parent/common allocations

- Separate rubber commodity operations from industrial-park/land cash and nonrecurring conversion/disposal gains; do not call land gains rubber pricing power.
- Parent versus subsidiary debt/cash/restrictions, NCI and distributions; land/biological assets require disclosed definition-specific classification.
- Reconcile recurring versus disposal/land earning populations and capex cohorts; source periods/scopes/units remain separate.

Conditions: RH-01: segment-to-group, land/conversion and NCI/parent-cash reconciliation must be specified in the implementation; retain MATERIALS M3 sector.
Valuation policy: M3 materials plus §14 look-through context; no blanket holding discount or invented land/RNAV assumptions.

### CONSUMER_PLATFORM_HOLDING — READY_WITH_CONDITIONS
Reuse: VNM consumer kernels + VIC COMPLEX_GROUP safeguards; new consumer-platform ownership bridge. Approved normalization sections: 8, 14, 18, 20A.5.
Metric families: reported assets/equity/group NPAT/parent-attributable profit; explicit common/NCI separation; reported revenue/margins, receivables/inventory and acquisition cash spending; DFR02 same-scope FY2022–25 reported diagnostics; these are not normalized owner FCF or per-share growth; consumer/retail segment earnings, associates and ownership hierarchy as reported; holdco/operating debt, cash distribution and common-owner/NCI waterfall

- Separate consumer product/channel/store results from holding/associate/disposal income; do not add subsidiary earnings twice.
- Holdco versus operating-company debt, recourse, unrestricted distributable cash and layers of NCI; no NPAT-based subsidiary cash allocation.
- Acquisition/disposal and segment-scope bridges, retention/distributions and attributable share/action history.

Conditions: CH-01: implement group/segment/common-owner and cash-transfer bridge; preserve RETAIL M3 label and weights.
Valuation policy: Existing §8 methods with §14 look-through/SOTP context where appropriate; no multiple/haircut/discount default.

### AVIATION_LEASE_OPERATOR — READY_WITH_CONDITIONS
Reuse: P1 corporate kernels; new aircraft/lease/deferred-ticket bridge. Approved normalization sections: 9, 18, 20.
Metric families: reported assets/equity/group NPAT/parent-attributable profit; explicit common/NCI separation; reported revenue/margins, receivables/inventory and acquisition cash spending; DFR02 same-scope FY2022–25 reported diagnostics; these are not normalized owner FCF or per-share growth; reported transport income versus aircraft sales/SLB/ancillary/other income; aircraft/lease deposits and obligations, maintenance/return commitments, ticket liabilities and FX exposure

- Transport/ancillary recurring operating population versus aircraft disposal/sale-and-leaseback, financing and recognition timing.
- Aircraft purchases/deposits, recognized leases and off-balance commitments; maintenance/return obligations, FX/hedges and common debt maturity with no double capitalization.
- Ticket advances/deferred revenue and cash collection, capacity/traffic and acquisition/action comparability; EBITDA without capex/lease context is insufficient.

Conditions: AV-01: qualify aircraft/SLB/lease/maintenance populations and consistent lease treatment; no new IFRS/restatement assumption or simple industrial FCF conclusion.
Valuation policy: M3 industrial normalized earnings/FCF/DCF and capex-controlled multiples; no forecast/lease costs invented.

### HOSPITALITY_RESORT_OPERATIONS — READY_WITH_CONDITIONS
Reuse: VHM property and VIC segment/common-owner safeguards; new hospitality operating-asset bridge. Approved normalization sections: 2.2, 4, 6, 14, 18.
Metric families: reported assets/equity/group NPAT/parent-attributable profit; explicit common/NCI separation; reported revenue/margins, receivables/inventory and acquisition cash spending; DFR02 same-scope FY2022–25 reported diagnostics; these are not normalized owner FCF or per-share growth; disclosed hotel/resort/entertainment operating segments versus development/transfer income; operating investment/fixed assets, maintenance/project capex, deferred customer receipts and segment/common cash

- Hotel/resort operating receipts and costs versus real-estate deliveries/transfers/disposals; no presumed developer presale economics.
- Operating assets versus project inventory, leases/capex, restricted project cash and recourse; mandatory REAL_ESTATE input groups are not silently substituted.
- Group/segment/associate/NCI and tax/finance/unallocated items to common earnings; no automatic headline RNAV or subsidiary cash allocation.

Conditions: HO-01: implement explicit hospitality-versus-development and unallocated/common-owner bridge under existing §2/§6/§14 translation; unresolved valuation topics stay deferred. No formal sector reclassification.
Valuation policy: Existing M3 property cash-flow/look-through framework translated to operating assets; valuation/model-specific prerequisites remain deferred until supported, not a new investment method.

### PROPERTY_RETAIL_OPERATIONS — READY_WITH_CONDITIONS
Reuse: VHM property kernels; new rental/development separation. Approved normalization sections: 2.2, 6, 14, 18.
Metric families: reported assets/equity/group NPAT/parent-attributable profit; explicit common/NCI separation; reported revenue/margins, receivables/inventory and acquisition cash spending; DFR02 same-scope FY2022–25 reported diagnostics; these are not normalized owner FCF or per-share growth; reported mall leasing/service operations versus property disposal/development handovers; operating property/lease receivables, capex and distributable cash; any NOI must use a documented source definition

- Recurring rental/service revenue and property operating costs versus handover/transfer/revaluation gains.
- Investment/fixed property versus developer inventory, occupancy/incentives/deposits and tenant receivable quality; no inferred cap rate.
- Operating maintenance/refurbishment/expansion cash and debt/restricted funds; any asset value/common-owner bridge includes NCI/leakage once.

Conditions: PR-01: implement rental/operating-asset versus development cash-flow bridge; do not replace required canonical INVENTORY with investment property without an approved definition. Missing formal fields remain deferred.
Valuation policy: Existing property cash-flow valuation with §2 translation and realizability; no new NOI/capitalization formula or assumptions selected.

## Source inspection limits
All96 retained source JSON files were opened and their root identity/schema, report/variant structures, candidate dimension metadata and immutable hashes inspected. 73 routing-text contexts were located in retained notes. Context quotes are source-indexed narrative candidates, not new qualified rubric evidence or financial facts. No financial amount was extracted, compared or calculated. File presence, report labels, candidate annual years and source row counts do not establish qualified FY2022–25 coverage. Do not ask the owner to resend these files; qualify exact missing cells later within an authorized package.

Banks and SSI preserve financial-sector rules. MCH/SAB manufacturer economics use price/volume/distribution instead of fictitious same-store measures; MWG uses actual store cohorts if disclosed. MSN and GVR need look-through/segment populations. BSR and HPG require cycle normalization rather than spot-profit valuation; GAS separates contract/regulatory and commodity exposure; VJC separates aircraft/lease/transport economics; VPL/VRE separate operating hospitality/rentals from developer handovers. These distinctions use retained activity context plus approved M3 sections, not broad GICS inference alone.

VPL and VRE retain REAL_ESTATE; MSN retains RETAIL; GVR retains MATERIALS. Existing §2/§4 allow economic metric/valuation translation while weights remain fixed, and §14 provides look-through safeguards. No investment-property-for-INVENTORY substitution or formal reclassification is authorized. Missing model-specific evidence defers that metric/rubric rather than creating a new methodology approval campaign.

Developer route VHM and diversified route VIC remain existing P1 pilots, excluded from the24-member partition. They are regression/reference components only, not reopened assessments.
