# TCB valuation feasibility
Approved baseline `74510523aa68696a117386751047fea638737279`; P2.5 authorization: read-only feasibility for ACB, CTG, MBB, TCB, VCB, SSI. Report date **2026-11-08**, Asia/Ho_Chi_Minh. Financial context FY2022–FY2025; no valuation cutoff chosen. Owner approval of P2.4 engineering is recorded by this request; it does not approve valuation assumptions or production data. Prior evidence and dispositions remain unchanged. New files are confined to this versioned P2.5 folder.

**BLOCKED. Intrinsic value=null; margin of safety=null; selected price/shares=null.**

| Dependency | State | Exact finding |
|---|---|---|
| COMMON_OWNER_EARNINGS | MISSING | Reported parent NPAT is a qualified historical fact for TCB, but not a sustainable common-owner numerator; NCI/fund/preference/action treatment still needs qualification. |
| SUSTAINABLE_EARNINGS | MISSING | Through-cycle NIM/credit cost, fee quality and common-owner normalization not qualified. Group ROE is not sustainable ROE. |
| COMPATIBLE_SHARE_COUNT | MISSING | No qualified effective-date issued/treasury/diluted/common-share bridge admitted for the selected valuation cutoff; holdings quantity is not issuer share count. |
| CORPORATE_ACTION_ADJUSTMENTS | MISSING | Historical actions/issuance terms and denominator changes not mapped to a compatible per-share cohort. Empty formal corporate_action_reference is recorded, not proof that the issuer had no actions. |
| VALUATION_CUTOFF | REQUIRES_APPROVAL | Date/time/timezone and retrospective/as-known treatment are null. Approved VN30 reference date2026-11-05 does not choose a valuation cutoff. |
| QUALIFIED_PRICE_EVIDENCE | REQUIRES_APPROVAL | Dated display-price observations exist; select approved research-valuation source/cutoff/adjustment/staleness treatment and qualify compatible evidence. No current quote or intrinsic-value input selected. |
| DISCOUNT_REQUIRED_RETURN_ASSUMPTIONS | REQUIRES_APPROVAL | Risk Policy normal15% forward 5Y hurdle and exceptional12% floor already exist; neither selects TCB cost of equity/discount rate. No new hurdle/method approval is requested. |
| SCENARIO_ASSUMPTIONS | REQUIRES_APPROVAL | Evidence-bounded growth, credit loss, funding/NIM, payout/tax and capital scenarios unapproved. |
| TERMINAL_ASSUMPTIONS | REQUIRES_APPROVAL | Terminal growth/ROE/capital/payout or multiple consistency not approved; no arbitrary terminal value. |
| MARGIN_OF_SAFETY_METHODOLOGY | AVAILABLE | Existing M3 Metric Definitions§8.3 and§12.17 and M1 Investment Policy§11.3 define conservative value/price and uncertainty/downside principles; inputs and any case-specific requirements remain absent. |
| SECTOR_PRIMARY_AND_CROSSCHECK_POLICY | AVAILABLE | Sector Normalization§5.4: P/B versus sustainable ROE/cost of equity and residual income/justified P/B; economically independent crosscheck required, not an average of correlated variants. |

Retained latest display price reference: dated2026-10-30; unitVND_PER_SHARE; adjustment `PROVIDER_UNDECLARED`. Exact immutable DB row/body hash/source pointer are in `market-portfolio-inventory.json`; no price amount is promoted to a model input. Broker/personal ownership quantity cannot be used as issuer shares outstanding.

Method definition, case inputs and permission are separate. Existing M3 margin-of-safety and bank primary-method policies are available; no new valuation methodology is needed merely to diagnose missing data. Risk Policy normal15% five-year hurdle is already approved, but selecting15% as discount rate would be an unsupported economic assumption. Multiple justified-P/B/residual-income views sharing identical assumptions are not automatically independent crosschecks. Low P/E cannot establish undervaluation. Cutoff and original historical availability remain unresolved even when financial reports are audited.
