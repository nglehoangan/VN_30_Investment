import { deepFreeze } from "@/domain/portfolio/transaction";
export { IMPLEMENTATION, VERSION, CATEGORY_MAXIMA, type Category } from "./methodology/identity";
export { SECTORS, type Sector } from "./methodology/sectors";
export const RUBRICS = deepFreeze([
  {
    "id": "BQ-EQ",
    "category": "BQ",
    "name": "Economic quality",
    "max": 8,
    "owner": "M1 \u00a75.1 / M3 \u00a74.1",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Value destructive"
      },
      {
        "min": 1,
        "max": 2,
        "label": "Weak economics"
      },
      {
        "min": 3,
        "max": 4,
        "label": "Average economics"
      },
      {
        "min": 5,
        "max": 6,
        "label": "Good economics"
      },
      {
        "min": 7,
        "max": 8,
        "label": "Consistently superior economics"
      }
    ],
    "topics": [
      "returns",
      "persistence",
      "margins",
      "cost_of_capital"
    ],
    "maximumPrerequisite": "Durable superior returns, not leverage/provisioning artifacts"
  },
  {
    "id": "BQ-MOAT",
    "category": "BQ",
    "name": "Competitive advantage",
    "max": 6,
    "owner": "M3 \u00a74.2",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Commodity/disadvantaged"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Minimal advantage"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Weak/narrow advantage"
      },
      {
        "min": 3,
        "max": 3,
        "label": "Some differentiation"
      },
      {
        "min": 4,
        "max": 4,
        "label": "Meaningful contestable advantage"
      },
      {
        "min": 5,
        "max": 5,
        "label": "Strong durable advantage"
      },
      {
        "min": 6,
        "max": 6,
        "label": "Multiple durable advantages"
      }
    ],
    "topics": [
      "advantage",
      "economic_behavior",
      "persistence"
    ],
    "maximumPrerequisite": "Multiple advantages proven through persistence and economics"
  },
  {
    "id": "BQ-CASH",
    "category": "BQ",
    "name": "Earnings quality",
    "max": 6,
    "owner": "M3 \u00a74.3",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Persistent failure of economic realization"
      },
      {
        "min": 1,
        "max": 2,
        "label": "Weak realization with recurring adverse adjustments"
      },
      {
        "min": 3,
        "max": 4,
        "label": "Adequate realization with material qualifications"
      },
      {
        "min": 5,
        "max": 6,
        "label": "Strong recurring realization and adjustment quality"
      }
    ],
    "topics": [
      "realization",
      "one_offs",
      "working_capital",
      "recognition"
    ],
    "maximumPrerequisite": "Recurring realization, transparent adjustments and sound recognition; ratio alone insufficient"
  },
  {
    "id": "BQ-RES",
    "category": "BQ",
    "name": "Business resilience",
    "max": 5,
    "owner": "M3 \u00a74.4",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Structurally fragile"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Severe unmitigated dependence"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Material vulnerabilities"
      },
      {
        "min": 3,
        "max": 3,
        "label": "Balanced resilience"
      },
      {
        "min": 4,
        "max": 4,
        "label": "Strong diversified resilience"
      },
      {
        "min": 5,
        "max": 5,
        "label": "Proven stress-resilient franchise"
      }
    ],
    "topics": [
      "concentration",
      "pricing_power",
      "cyclicality",
      "stress"
    ],
    "maximumPrerequisite": "Protect franchise without distressed capital actions under severe plausible stress"
  },
  {
    "id": "FH-BS",
    "category": "FH",
    "name": "Balance-sheet strength",
    "max": 6,
    "owner": "M1 \u00a76.1 / M3 \u00a75.1",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Unacceptable"
      },
      {
        "min": 1,
        "max": 2,
        "label": "Weak"
      },
      {
        "min": 3,
        "max": 4,
        "label": "Adequate"
      },
      {
        "min": 5,
        "max": 6,
        "label": "Strong"
      }
    ],
    "topics": [
      "capital",
      "asset_quality",
      "funding",
      "leverage_context"
    ],
    "maximumPrerequisite": "Strong buffers under normalized/downside economics; no bank industrial debt shortcut"
  },
  {
    "id": "FH-LIQ",
    "category": "FH",
    "name": "Liquidity and refinancing",
    "max": 4,
    "owner": "M3 \u00a75.2",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Uncovered obligations without credible funding"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Severe funding dependence"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Adequate with material refinancing dependence"
      },
      {
        "min": 3,
        "max": 3,
        "label": "Sound coverage with manageable refinancing"
      },
      {
        "min": 4,
        "max": 4,
        "label": "Resilient liquidity and diversified funding"
      }
    ],
    "topics": [
      "obligations",
      "liquidity",
      "maturities",
      "covenants"
    ],
    "maximumPrerequisite": "Coverage, maturity and covenant resilience, not one accounting ratio"
  },
  {
    "id": "FH-STRESS",
    "category": "FH",
    "name": "Downside survivability",
    "max": 5,
    "owner": "M3 \u00a75.3",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Fails plausible stress"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Likely distressed financing"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Severe stress vulnerability"
      },
      {
        "min": 3,
        "max": 3,
        "label": "Survives with material constraints"
      },
      {
        "min": 4,
        "max": 4,
        "label": "Resilient with manageable constraints"
      },
      {
        "min": 5,
        "max": 5,
        "label": "Robust survival without distressed capital actions"
      }
    ],
    "topics": [
      "scenario",
      "funding_response",
      "capital_response"
    ],
    "maximumPrerequisite": "Severe sector stress survived without emergency dilution, distressed sales or damaging refinancing"
  },
  {
    "id": "GQ-HIST",
    "category": "GQ",
    "name": "Historical growth quality",
    "max": 5,
    "owner": "M3 \u00a76.1",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Structural value-destructive contraction"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Weak normalized trend"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Limited/low-quality trend"
      },
      {
        "min": 3,
        "max": 3,
        "label": "Moderate value-creating trend"
      },
      {
        "min": 4,
        "max": 4,
        "label": "Strong comparable growth"
      },
      {
        "min": 5,
        "max": 5,
        "label": "Durable high-quality per-share growth"
      }
    ],
    "topics": [
      "trend",
      "acquisitions",
      "base_effects",
      "per_share"
    ],
    "maximumPrerequisite": "Comparable cycle/action-adjusted growth; bank credit/capital and retailer unit economics sound"
  },
  {
    "id": "GQ-FWD",
    "category": "GQ",
    "name": "Forward growth durability",
    "max": 5,
    "owner": "M3 \u00a76.2",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Structural decline"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Weak visibility/stagnation"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Limited/cyclical"
      },
      {
        "min": 3,
        "max": 3,
        "label": "Moderate visibility"
      },
      {
        "min": 4,
        "max": 4,
        "label": "Good runway"
      },
      {
        "min": 5,
        "max": 5,
        "label": "High-confidence attractive multi-year runway"
      }
    ],
    "topics": [
      "runway",
      "reinvestment",
      "funding",
      "execution"
    ],
    "maximumPrerequisite": "Independent runway and funding evidence, not consensus alone"
  },
  {
    "id": "GQ-INC",
    "category": "GQ",
    "name": "Incremental returns",
    "max": 5,
    "owner": "M3 \u00a76.3",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Value-destructive expansion"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Weak incremental economics"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Mediocre incremental economics"
      },
      {
        "min": 3,
        "max": 3,
        "label": "Acceptable incremental economics"
      },
      {
        "min": 4,
        "max": 4,
        "label": "Strong incremental economics"
      },
      {
        "min": 5,
        "max": 5,
        "label": "Exceptional durable incremental economics"
      }
    ],
    "topics": [
      "incremental_return",
      "denominator",
      "unit_economics"
    ],
    "maximumPrerequisite": "Robust denominator, attractive returns after credit/funding/capital cost; no deteriorating store economics"
  },
  {
    "id": "IC-IND",
    "category": "IC",
    "name": "Industry structure",
    "max": 4,
    "owner": "M3 \u00a77.1",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Value-destructive industry"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Structurally difficult"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Mixed/cyclical/average"
      },
      {
        "min": 3,
        "max": 3,
        "label": "Generally attractive"
      },
      {
        "min": 4,
        "max": 4,
        "label": "Structurally attractive/rational/durable"
      }
    ],
    "topics": [
      "barriers",
      "competition",
      "demand",
      "disruption"
    ],
    "maximumPrerequisite": "Industry-level economic strength, not best of a weak group"
  },
  {
    "id": "IC-POS",
    "category": "IC",
    "name": "Company position",
    "max": 4,
    "owner": "M3 \u00a77.2",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Disadvantaged"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Weak"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Competitive"
      },
      {
        "min": 3,
        "max": 3,
        "label": "Strong top-tier"
      },
      {
        "min": 4,
        "max": 4,
        "label": "Sustainable clear leader"
      }
    ],
    "topics": [
      "share",
      "cost_position",
      "distribution"
    ],
    "maximumPrerequisite": "Sustainable leadership distinct from moat evidence"
  },
  {
    "id": "IC-CYCLE",
    "category": "IC",
    "name": "Cycle position",
    "max": 2,
    "owner": "M3 \u00a77.3",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Adverse normalized forward asymmetry"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Balanced normalized forward asymmetry"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Favorable normalized forward asymmetry"
      }
    ],
    "topics": [
      "cycle",
      "forward_asymmetry",
      "survivability"
    ],
    "maximumPrerequisite": "Favorable normalized forward asymmetry, not spot momentum or duplicated valuation"
  },
  {
    "id": "VAL-PRIMARY",
    "category": "VAL",
    "name": "Primary valuation",
    "max": 8,
    "owner": "M3 \u00a78.1",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Clearly overvalued"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Very expensive"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Expensive"
      },
      {
        "min": 3,
        "max": 3,
        "label": "Slightly expensive"
      },
      {
        "min": 4,
        "max": 4,
        "label": "Fair"
      },
      {
        "min": 5,
        "max": 5,
        "label": "Moderately attractive"
      },
      {
        "min": 6,
        "max": 6,
        "label": "Attractive"
      },
      {
        "min": 7,
        "max": 7,
        "label": "Very attractive"
      },
      {
        "min": 8,
        "max": 8,
        "label": "Deeply attractive"
      }
    ],
    "topics": [
      "primary_model",
      "normalized_denominator",
      "price",
      "cross_check"
    ],
    "maximumPrerequisite": "Conservative normalized assumptions; low PE alone insufficient"
  },
  {
    "id": "VAL-RET",
    "category": "VAL",
    "name": "Expected 5Y return",
    "max": 8,
    "owner": "M3 \u00a78.2",
    "bands": [
      {
        "min": 0,
        "max": 1,
        "label": "Below 8%"
      },
      {
        "min": 2,
        "max": 3,
        "label": "8% to below 12%"
      },
      {
        "min": 4,
        "max": 5,
        "label": "12% to below 15%"
      },
      {
        "min": 6,
        "max": 6,
        "label": "15% to below 18%"
      },
      {
        "min": 7,
        "max": 7,
        "label": "18% to below 22%"
      },
      {
        "min": 8,
        "max": 8,
        "label": "At least 22%"
      }
    ],
    "topics": [
      "starting_value",
      "growth",
      "exit_value",
      "distributions",
      "dilution",
      "scenarios"
    ],
    "maximumPrerequisite": "Strong downside-supported estimate; aggressive multiple expansion never gets automatic 8"
  },
  {
    "id": "VAL-MOS",
    "category": "VAL",
    "name": "Margin of safety",
    "max": 4,
    "owner": "M3 \u00a78.3",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Poor asymmetry"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Thin/meaningful downside"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Balanced/fair"
      },
      {
        "min": 3,
        "max": 3,
        "label": "Attractive asymmetry"
      },
      {
        "min": 4,
        "max": 4,
        "label": "Strong discount/contained downside/high evidence"
      }
    ],
    "topics": [
      "conservative_value",
      "downside",
      "balance_sheet"
    ],
    "maximumPrerequisite": "Discount plus contained impairment risk and high-quality evidence"
  },
  {
    "id": "RG-GOV",
    "category": "RG",
    "name": "Governance",
    "max": 4,
    "owner": "M3 \u00a79.1",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Serious weakness short of veto"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Significant concerns"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Mixed concerns"
      },
      {
        "min": 3,
        "max": 3,
        "label": "Generally sound"
      },
      {
        "min": 4,
        "max": 4,
        "label": "Strong disclosure/alignment/minority treatment"
      }
    ],
    "topics": [
      "disclosure",
      "related_parties",
      "minority",
      "auditor"
    ],
    "maximumPrerequisite": "Corroborated disclosure and minority treatment; hard veto outside arithmetic"
  },
  {
    "id": "RG-RISK",
    "category": "RG",
    "name": "Residual risk",
    "max": 4,
    "owner": "M3 \u00a79.2",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "HIGH"
      },
      {
        "min": 1,
        "max": 1,
        "label": "ELEVATED_WEAK"
      },
      {
        "min": 2,
        "max": 2,
        "label": "ELEVATED_CONTROLLED"
      },
      {
        "min": 3,
        "max": 3,
        "label": "MODERATE"
      },
      {
        "min": 4,
        "max": 4,
        "label": "LOW"
      }
    ],
    "topics": [
      "residual_risks",
      "mitigation",
      "distinct_channels"
    ],
    "maximumPrerequisite": "Only residual risk after category-specific analysis"
  },
  {
    "id": "RG-UNC",
    "category": "RG",
    "name": "Thesis uncertainty",
    "max": 2,
    "owner": "M3 \u00a79.3",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "High uncertainty"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Material manageable uncertainty"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Narrow supported range"
      }
    ],
    "topics": [
      "forecast_range",
      "sensitivity",
      "dependencies"
    ],
    "maximumPrerequisite": "Narrow supported range; shared assumptions identified"
  },
  {
    "id": "CA-REINV",
    "category": "CA",
    "name": "Reinvestment",
    "max": 2,
    "owner": "M3 \u00a710.1",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Repeated value destruction"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Mixed/acceptable"
      },
      {
        "min": 2,
        "max": 2,
        "label": "Consistently accretive"
      }
    ],
    "topics": [
      "capex",
      "acquisitions",
      "divestments"
    ],
    "maximumPrerequisite": "Distinct management allocation outcomes beyond incremental-return ratio"
  },
  {
    "id": "CA-DIST",
    "category": "CA",
    "name": "Distribution",
    "max": 1,
    "owner": "M3 \u00a710.2",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Evidence does not demonstrate disciplined distribution"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Disciplined distribution/retention"
      }
    ],
    "topics": [
      "retention",
      "distribution",
      "buyback_valuation",
      "resilience"
    ],
    "maximumPrerequisite": "Retain for high returns, distribute otherwise; sensible buyback prices and resilient balance sheet"
  },
  {
    "id": "CA-DIL",
    "category": "CA",
    "name": "Dilution",
    "max": 1,
    "owner": "M3 \u00a710.3",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Material value-destructive dilution"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Disciplined neutral/accretive issuance"
      }
    ],
    "topics": [
      "issue_terms",
      "proceeds",
      "per_share"
    ],
    "maximumPrerequisite": "Economic per-share impact; mechanical split is not dilution"
  },
  {
    "id": "CA-PSV",
    "category": "CA",
    "name": "Per-share value",
    "max": 1,
    "owner": "M3 \u00a710.4",
    "bands": [
      {
        "min": 0,
        "max": 0,
        "label": "Evidence does not demonstrate real compounding"
      },
      {
        "min": 1,
        "max": 1,
        "label": "Real per-share compounding"
      }
    ],
    "topics": [
      "per_share",
      "actions",
      "cycle_adjustment"
    ],
    "maximumPrerequisite": "Real comparable compounding after cycle and corporate-action adjustments"
  }
]);
