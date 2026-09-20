# M6.4 methodology clarification — revision 1

Status: explicit clarification proposal implemented for independent review under the user's remediation instruction. Not a claim of investment-policy or milestone approval. Old approved documents remain unchanged. Implementation identity: `m64-clarification-1`; semantic version `1.0.0`. A future policy/implementation revision must register a different immutable method identity.

## M64-R1-M01 / CR-M64-01

Owning baseline: M1 Scoring Model §§3–11; M3 Engine §§4–6; Metric Definitions §§3–10; Sector Normalization; Scorecard §§6–18. Existing wording permits “bounded analyst rubric” and says subcategory points are not a sum of all metrics. The ambiguity is missing intermediate assessment levels and unrecorded within-band choices. The clarification below records the human assessment as evidence, maps it to bounded points, and never infers judgment from a ratio. No weight, investment hurdle, sector rule or Decision State changes.

### Complete 100-point audit

Evidence is defined for every row. “Complete” means an existing assessment-to-point table, not automatic judgment from raw financial data. Range selection and binary-complement cases still need explicit artifact semantics. Maxima sum to 100.

| Category | Subcategory | Max | Evidence defined? | Existing point rubric deterministic? | Gap / clarification |
| --- | --- | ---: | --- | --- | --- |
| BQ | BQ-EQ: Economic quality | 8 | Yes: M1 §5.1 / M3 §4.1 | No / incomplete selection | Range selection |
| BQ | BQ-MOAT: Competitive advantage | 6 | Yes: M3 §4.2 | Yes, given human assessment | Complete |
| BQ | BQ-CASH: Earnings quality | 6 | Yes: M3 §4.3 | No / incomplete selection | Missing |
| BQ | BQ-RES: Business resilience | 5 | Yes: M3 §4.4 | No / incomplete selection | Missing |
| FH | FH-BS: Balance-sheet strength | 6 | Yes: M1 §6.1 / M3 §5.1 | No / incomplete selection | Range selection |
| FH | FH-LIQ: Liquidity and refinancing | 4 | Yes: M3 §5.2 | No / incomplete selection | Missing |
| FH | FH-STRESS: Downside survivability | 5 | Yes: M3 §5.3 | No / incomplete selection | Missing |
| GQ | GQ-HIST: Historical growth quality | 5 | Yes: M3 §6.1 | No / incomplete selection | Missing |
| GQ | GQ-FWD: Forward growth durability | 5 | Yes: M3 §6.2 | Yes, given human assessment | Complete |
| GQ | GQ-INC: Incremental returns | 5 | Yes: M3 §6.3 | No / incomplete selection | Missing |
| IC | IC-IND: Industry structure | 4 | Yes: M3 §7.1 | Yes, given human assessment | Complete |
| IC | IC-POS: Company position | 4 | Yes: M3 §7.2 | Yes, given human assessment | Complete |
| IC | IC-CYCLE: Cycle position | 2 | Yes: M3 §7.3 | No / incomplete selection | Missing |
| VAL | VAL-PRIMARY: Primary valuation | 8 | Yes: M3 §8.1 | Yes, given human assessment | Complete |
| VAL | VAL-RET: Expected 5Y return | 8 | Yes: M3 §8.2 | No / incomplete selection | Range selection |
| VAL | VAL-MOS: Margin of safety | 4 | Yes: M3 §8.3 | Yes, given human assessment | Complete |
| RG | RG-GOV: Governance | 4 | Yes: M3 §9.1 | Yes, given human assessment | Complete |
| RG | RG-RISK: Residual risk | 4 | Yes: M3 §9.2 | Yes, given human assessment | Complete |
| RG | RG-UNC: Thesis uncertainty | 2 | Yes: M3 §9.3 | Yes, given human assessment | Complete |
| CA | CA-REINV: Reinvestment | 2 | Yes: M3 §10.1 | Yes, given human assessment | Complete |
| CA | CA-DIST: Distribution | 1 | Yes: M3 §10.2 | No / incomplete selection | Binary complement |
| CA | CA-DIL: Dilution | 1 | Yes: M3 §10.3 | Yes, given human assessment | Complete |
| CA | CA-PSV: Per-share value | 1 | Yes: M3 §10.4 | No / incomplete selection | Binary complement |

### Mandatory contract applying to every row

1. **Assessment levels and allowed points:** tables below. Human analyst selects the named level and an integer point within its range. Single-point levels have no discretion. There is no averaging or silent midpoint.
2. **Evidence requirements:** every listed topic must have an explicit evidence reference and topic-specific rationale; non-applicable items require an evidenced explanation, never an empty field. One family used in several subcategories needs distinct economic-channel rationale for each use. A ratio alone cannot satisfy a whole assessment.
3. **Maximum prerequisites:** per-row requirement below plus explicit exceptional justification and disconfirming evidence. Analyst must assert the prerequisites after reviewing sector-equivalent evidence. The engine validates this attestation; it does not pretend to independently verify economic truth.
4. **Disqualifying evidence:** material contradictory evidence or a failed maximum prerequisite prevents maximum credit. Unresolved critical evidence prevents reliable score construction. Hard veto never becomes an arithmetic penalty. Below maximum, documented adverse economic evidence informs the selected assessment; no invented numerical penalty is added.
5. **Missing evidence:** N/R, no points; incomplete category and total remain null, never normalized to 100. A supported substitution must be explicit and principle-equivalent. Source conflicts/staleness are retained. Conservative estimates are permitted only as identified human inputs with lineage; no generated substitute.
6. **Within-band discretion:** explicit `selectedPoints`, named `assessment`, selection rationale, evidence refs, methodology version, analyst/source and calculation timestamp are pinned in the formal artifact. Higher point in a range needs explicit stronger-evidence/downside support; lower point is not automatically assigned if selection is absent. Forward-return band is additionally checked against the supplied estimate; high uncertainty/near-lower-boundary prohibits upper point. Aggressive multiple-expansion estimates require reassessment instead of automatic maximum.
7. **Historical truth:** changing evidence, assessment or executable methodology creates a new artifact. Recompute never edits prior artifacts. Human provenance must be explicit. AI may not supply, default or overwrite formal selected points.

### Per-subcategory clarification

The following are descriptive assessment labels, not new capital-action states. Newly filled gaps provide an ordinal bounded interpretation of the economic principles already mandated; no new financial-ratio thresholds are introduced.

#### BQ-EQ — Economic quality /8

Owner: M1 §5.1 / M3 §4.1. Audit: Range selection.

**Value destructive** = 0; **Weak economics** = 1–2; **Average economics** = 3–4; **Good economics** = 5–6; **Consistently superior economics** = 7–8.

Required evidence topics: returns, persistence, margins, cost_of_capital. Maximum prerequisite: Durable superior returns, not leverage/provisioning artifacts. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### BQ-MOAT — Competitive advantage /6

Owner: M3 §4.2. Audit: Complete.

**Commodity/disadvantaged** = 0; **Minimal advantage** = 1; **Weak/narrow advantage** = 2; **Some differentiation** = 3; **Meaningful contestable advantage** = 4; **Strong durable advantage** = 5; **Multiple durable advantages** = 6.

Required evidence topics: advantage, economic_behavior, persistence. Maximum prerequisite: Multiple advantages proven through persistence and economics. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### BQ-CASH — Earnings quality /6

Owner: M3 §4.3. Audit: Missing.

**Persistent failure of economic realization** = 0; **Weak realization with recurring adverse adjustments** = 1–2; **Adequate realization with material qualifications** = 3–4; **Strong recurring realization and adjustment quality** = 5–6.

Required evidence topics: realization, one_offs, working_capital, recognition. Maximum prerequisite: Recurring realization, transparent adjustments and sound recognition; ratio alone insufficient. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### BQ-RES — Business resilience /5

Owner: M3 §4.4. Audit: Missing.

**Structurally fragile** = 0; **Severe unmitigated dependence** = 1; **Material vulnerabilities** = 2; **Balanced resilience** = 3; **Strong diversified resilience** = 4; **Proven stress-resilient franchise** = 5.

Required evidence topics: concentration, pricing_power, cyclicality, stress. Maximum prerequisite: Protect franchise without distressed capital actions under severe plausible stress. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### FH-BS — Balance-sheet strength /6

Owner: M1 §6.1 / M3 §5.1. Audit: Range selection.

**Unacceptable** = 0; **Weak** = 1–2; **Adequate** = 3–4; **Strong** = 5–6.

Required evidence topics: capital, asset_quality, funding, leverage_context. Maximum prerequisite: Strong buffers under normalized/downside economics; no bank industrial debt shortcut. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### FH-LIQ — Liquidity and refinancing /4

Owner: M3 §5.2. Audit: Missing.

**Uncovered obligations without credible funding** = 0; **Severe funding dependence** = 1; **Adequate with material refinancing dependence** = 2; **Sound coverage with manageable refinancing** = 3; **Resilient liquidity and diversified funding** = 4.

Required evidence topics: obligations, liquidity, maturities, covenants. Maximum prerequisite: Coverage, maturity and covenant resilience, not one accounting ratio. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### FH-STRESS — Downside survivability /5

Owner: M3 §5.3. Audit: Missing.

**Fails plausible stress** = 0; **Likely distressed financing** = 1; **Severe stress vulnerability** = 2; **Survives with material constraints** = 3; **Resilient with manageable constraints** = 4; **Robust survival without distressed capital actions** = 5.

Required evidence topics: scenario, funding_response, capital_response. Maximum prerequisite: Severe sector stress survived without emergency dilution, distressed sales or damaging refinancing. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### GQ-HIST — Historical growth quality /5

Owner: M3 §6.1. Audit: Missing.

**Structural value-destructive contraction** = 0; **Weak normalized trend** = 1; **Limited/low-quality trend** = 2; **Moderate value-creating trend** = 3; **Strong comparable growth** = 4; **Durable high-quality per-share growth** = 5.

Required evidence topics: trend, acquisitions, base_effects, per_share. Maximum prerequisite: Comparable cycle/action-adjusted growth; bank credit/capital and retailer unit economics sound. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### GQ-FWD — Forward growth durability /5

Owner: M3 §6.2. Audit: Complete.

**Structural decline** = 0; **Weak visibility/stagnation** = 1; **Limited/cyclical** = 2; **Moderate visibility** = 3; **Good runway** = 4; **High-confidence attractive multi-year runway** = 5.

Required evidence topics: runway, reinvestment, funding, execution. Maximum prerequisite: Independent runway and funding evidence, not consensus alone. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### GQ-INC — Incremental returns /5

Owner: M3 §6.3. Audit: Missing.

**Value-destructive expansion** = 0; **Weak incremental economics** = 1; **Mediocre incremental economics** = 2; **Acceptable incremental economics** = 3; **Strong incremental economics** = 4; **Exceptional durable incremental economics** = 5.

Required evidence topics: incremental_return, denominator, unit_economics. Maximum prerequisite: Robust denominator, attractive returns after credit/funding/capital cost; no deteriorating store economics. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### IC-IND — Industry structure /4

Owner: M3 §7.1. Audit: Complete.

**Value-destructive industry** = 0; **Structurally difficult** = 1; **Mixed/cyclical/average** = 2; **Generally attractive** = 3; **Structurally attractive/rational/durable** = 4.

Required evidence topics: barriers, competition, demand, disruption. Maximum prerequisite: Industry-level economic strength, not best of a weak group. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### IC-POS — Company position /4

Owner: M3 §7.2. Audit: Complete.

**Disadvantaged** = 0; **Weak** = 1; **Competitive** = 2; **Strong top-tier** = 3; **Sustainable clear leader** = 4.

Required evidence topics: share, cost_position, distribution. Maximum prerequisite: Sustainable leadership distinct from moat evidence. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### IC-CYCLE — Cycle position /2

Owner: M3 §7.3. Audit: Missing.

**Adverse normalized forward asymmetry** = 0; **Balanced normalized forward asymmetry** = 1; **Favorable normalized forward asymmetry** = 2.

Required evidence topics: cycle, forward_asymmetry, survivability. Maximum prerequisite: Favorable normalized forward asymmetry, not spot momentum or duplicated valuation. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### VAL-PRIMARY — Primary valuation /8

Owner: M3 §8.1. Audit: Complete.

**Clearly overvalued** = 0; **Very expensive** = 1; **Expensive** = 2; **Slightly expensive** = 3; **Fair** = 4; **Moderately attractive** = 5; **Attractive** = 6; **Very attractive** = 7; **Deeply attractive** = 8.

Required evidence topics: primary_model, normalized_denominator, price, cross_check. Maximum prerequisite: Conservative normalized assumptions; low PE alone insufficient. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### VAL-RET — Expected 5Y return /8

Owner: M3 §8.2. Audit: Range selection.

**Below 8%** = 0–1; **8% to below 12%** = 2–3; **12% to below 15%** = 4–5; **15% to below 18%** = 6; **18% to below 22%** = 7; **At least 22%** = 8.

Required evidence topics: starting_value, growth, exit_value, distributions, dilution, scenarios. Maximum prerequisite: Strong downside-supported estimate; aggressive multiple expansion never gets automatic 8. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### VAL-MOS — Margin of safety /4

Owner: M3 §8.3. Audit: Complete.

**Poor asymmetry** = 0; **Thin/meaningful downside** = 1; **Balanced/fair** = 2; **Attractive asymmetry** = 3; **Strong discount/contained downside/high evidence** = 4.

Required evidence topics: conservative_value, downside, balance_sheet. Maximum prerequisite: Discount plus contained impairment risk and high-quality evidence. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### RG-GOV — Governance /4

Owner: M3 §9.1. Audit: Complete.

**Serious weakness short of veto** = 0; **Significant concerns** = 1; **Mixed concerns** = 2; **Generally sound** = 3; **Strong disclosure/alignment/minority treatment** = 4.

Required evidence topics: disclosure, related_parties, minority, auditor. Maximum prerequisite: Corroborated disclosure and minority treatment; hard veto outside arithmetic. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### RG-RISK — Residual risk /4

Owner: M3 §9.2. Audit: Complete.

**HIGH** = 0; **ELEVATED_WEAK** = 1; **ELEVATED_CONTROLLED** = 2; **MODERATE** = 3; **LOW** = 4.

Required evidence topics: residual_risks, mitigation, distinct_channels. Maximum prerequisite: Only residual risk after category-specific analysis. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### RG-UNC — Thesis uncertainty /2

Owner: M3 §9.3. Audit: Complete.

**High uncertainty** = 0; **Material manageable uncertainty** = 1; **Narrow supported range** = 2.

Required evidence topics: forecast_range, sensitivity, dependencies. Maximum prerequisite: Narrow supported range; shared assumptions identified. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### CA-REINV — Reinvestment /2

Owner: M3 §10.1. Audit: Complete.

**Repeated value destruction** = 0; **Mixed/acceptable** = 1; **Consistently accretive** = 2.

Required evidence topics: capex, acquisitions, divestments. Maximum prerequisite: Distinct management allocation outcomes beyond incremental-return ratio. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### CA-DIST — Distribution /1

Owner: M3 §10.2. Audit: Binary complement.

**Evidence does not demonstrate disciplined distribution** = 0; **Disciplined distribution/retention** = 1.

Required evidence topics: retention, distribution, buyback_valuation, resilience. Maximum prerequisite: Retain for high returns, distribute otherwise; sensible buyback prices and resilient balance sheet. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### CA-DIL — Dilution /1

Owner: M3 §10.3. Audit: Complete.

**Material value-destructive dilution** = 0; **Disciplined neutral/accretive issuance** = 1.

Required evidence topics: issue_terms, proceeds, per_share. Maximum prerequisite: Economic per-share impact; mechanical split is not dilution. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

#### CA-PSV — Per-share value /1

Owner: M3 §10.4. Audit: Binary complement.

**Evidence does not demonstrate real compounding** = 0; **Real per-share compounding** = 1.

Required evidence topics: per_share, actions, cycle_adjustment. Maximum prerequisite: Real comparable compounding after cycle and corporate-action adjustments. Disqualifier: evidence contradicting this prerequisite excludes maximum; absence of required evidence yields N/R. Sector equivalence, discretion, rationale and reference requirements are the mandatory contract above and the matrix below.

### Sector equivalence (applies to every subcategory)

| Principle | Bank | Real Estate | Retail | Technology/services | Industrial/manufacturing |
| --- | --- | --- | --- | --- | --- |
| Returns / incremental returns | Sustainable ROE after credit cost/capital consumption | Project returns, normalized ROE and realization | Store/mature-store ROIC and payback | Asset-light ROIC, recurring economics, incremental margins | Through-cycle ROIC and capex returns |
| Earnings realization | NPL recognition, provisioning, accrued interest, fee recurrence | Collections, handover, inventory monetization | CFO with inventory/working-capital context | CFO/FCF and recurring contract/deferred revenue quality | Multi-year CFO/FCF and working capital |
| Balance sheet / liquidity / stress | CAR, capital buffers, NPL/coverage, funding/LDR and credit stress | Maturities, legal delay, cash interest, refinancing | Leases, inventory, working-capital stress | Net cash, acquisition debt, customer loss | Normalized/trough leverage, utilization and margins |
| Growth / per-share outcomes | Loans/deposits/fees/BVPS adjusted for capital | Presales/backlog/collections/project NAV | Organic SSS plus sustainable store economics | Organic vs acquisition growth and retention | Organic capacity/backlog/M&A/cycle separation |
| Valuation / return / MOS | P/B vs sustainable ROE, residual income | RNAV adjusted for legal/funding/realization | Normalized earnings, EV/EBIT and DCF | Owner earnings/DCF/EV-EBIT | Normalized earnings/FCF/EV-EBIT |
| Moat / resilience / industry | Funding franchise and competition | Project/land/legal quality and concentration | Distribution, customer and supplier power | Retention, switching costs and concentration | Cost position, backlog and customer concentration |
| Governance / residual risk / uncertainty / allocation | Common principles applied to each sector's disclosures, related parties, remaining risks, forecast sensitivity, reinvestment, distributions and economic issuance | Same principles; project-specific evidence | Same principles; store economics | Same principles; acquisition/retention economics | Same principles; capex/cycle economics |

Every assessment records its sector and explicit evidence translation. Banks prohibit industrial debt/equity and CFO/NPAT as scoring metrics. Corporate-action comparability must be established before per-share use; mechanical share growth is not economic dilution. Cyclical normalization is symmetric; peak profits cannot create cheapness and trough profits cannot fabricate expensiveness. No percentile supplies points. With fewer than four comparable VN30 peers, broader peers or absolute/own-history evidence is required.

Acceptance: all 23 ranges and out-of-range selections; five-sector full scorecards; missing/disconfirming evidence; ratio-only refusal; exact existing return bands; no double-counting; immutable human assessment replay; all approved VC cases.

## M64-R1-M02 / CR-M64-02

Owner: Ranking Rules §§8–16,22,33. Existing wording: scores within two points form a tie cluster; economic differences of 1–2 are normally indistinguishable; final security-ID ordering has no economic meaning. Ambiguity: pairwise closeness is not transitive; adjacent bands and rank-ten cutoff are unspecified.

| Option | Economic meaning / chain | Determinism / stability | Band boundaries | Top 10 |
| --- | --- | --- | --- | --- |
| A: highest remaining anchor | Every member is within 2 of anchor; cluster span <=2; prevents long chains | Deterministic descending anchors; adding a higher anchor can change partition (disclose) | Adjacent bands may cross when within 2 | Sort within bounded clusters, show boundary cluster |
| B: adjacent connected | Transitive chains can join 90 down to 60 with steps <=2, implying far wider equivalence | Deterministic but bridging entry can merge large groups | Crosses arbitrarily many bands through chains | Many materially different scores may be reordered together |
| C: force same band | Preserves categorical boundaries but 82/81 becomes distinct | Stable at band boundaries but contradicts normal 1-point indistinguishability | Never crosses | Artificial preference at 10 when a boundary is crossed |

**Recommendation / implemented clarification: Option A.** Sort eligible entries descending by total, then immutable security ID. Highest unassigned total is anchor. Take all remaining scores at least anchor minus 2, then repeat. Adjacent bands may share a cluster: bands label analytical strength, not an absolute barrier to the two-point rule. Across clusters, a small pairwise difference still does not establish economic superiority: cluster partition is a reproducible display procedure, not a proof of preference.

| Scores | Anchor clusters |
| --- | --- |
| 84 / 82 / 80 | [84,82], [80] |
| 83 / 82 / 81 | [83,82,81] |
| 82 / 81 | [82,81] |
| 82 / 80 | [82,80] |
| 82 / 79 | [82], [79] |
| Equal totals | One cluster |

Within each cluster apply approved secondary criteria in order. Expected return is used only when all cluster estimates have comparable declared model/assumption reliability, no aggressive expansion dependence and no dominant hidden downside. Otherwise skip that dimension for the whole cluster (avoids a non-transitive pair comparator). Residual risk, confidence, MOS/downside assessment, Business Quality, Financial Health and Capital Allocation follow. Portfolio-aware criteria must be supplied as explicit evidence-backed human ordinal assessments of impact, concentration and opportunity cost, outside score arithmetic. If unavailable they cannot establish preference; exposure-only ranking discloses not assessed. Security ID resolves fully equal criteria for display only.

**Top 10 + boundary tie disclosure:** up to ten eligible entries in deterministic display order. If a cluster spans positions 9–12, top10 contains 9 and 10, while boundaryTie discloses all four IDs, their display positions, selected IDs and omitted IDs. Omissions are capacity/display omissions, not failed eligibility. No expansion to a misleading Top 12 or hidden economic winner. Output states display order is not an investment recommendation, with economic ties retained independently of display rank. Fewer than ten eligible names is valid.

Acceptance: every table example, shuffled inputs, equal secondary criteria, 9–12 boundary, fewer than ten, eligibility before clustering, return-confidence mismatch, LOW confidence/veto/category/critical-evidence and scoped accounting gates. Version impact: new immutable clarification identity; no rewrite of prior records.

## Resolution

CR-M64-01 and CR-M64-02: RESOLVED_BY_CLARIFICATION for the explicit implementation above, pending independent review. The user's instruction authorizes implementation after these deterministic clarifications; it does not grant production methodology approval. Existing baseline prose and weights are unchanged. Assessment truth remains analyst responsibility; the software enforces bounded auditable selection rather than pretending to verify investment judgments.

## Ownership boundary

M6.4 owns M3 score arithmetic, evidence sufficiency, confidence, category gates, deterministic tie clustering and ranking presentation. It does not calculate Stage 0, hard veto, residual-risk policy, required-return hurdles, exceptions, purchase decisions, concentration limits or opportunity cost.

Stage 0, veto and residual-risk classifications arrive as immutable, dated external assessments with the responsible methodology identity and evidence references. Required-return and portfolio-constraint results arrive from M4 with the same lineage. M6.4 validates their shape and cutoff, then consumes their declared status where M3 ranking requires it. It never reproduces M1 or M4 thresholds. M6.3 remains the authority for portfolio reconstruction and reconciliation; M6.4 consumes its integrity result without rewriting accounting truth.

## Approval handoff

| Field | Value |
| --- | --- |
| Governance status | PROPOSED |
| Intended use | TEST only |
| Method identity | `m64-clarification-1` / `1.0.0` |
| Approval reference | Not provided |
| Effective production date | Not set |
| Required approver | Project methodology owner |

The clarification is executable only for synthetic tests while it remains PROPOSED. Formal artifacts require a separately recorded APPROVED methodology, PRODUCTION intent, and a non-empty external approval reference. Recording or running this code does not create that approval. Existing immutable artifacts retain the exact methodology and approval reference under which they were produced.
