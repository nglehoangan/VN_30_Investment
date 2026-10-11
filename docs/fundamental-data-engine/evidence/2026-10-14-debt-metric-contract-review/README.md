# Debt metric semantic contract review

Read DEBT_METRIC_CONTRACT_REVIEW.md and PROPOSED_AMENDMENT.md for the recommended taxonomy and exact dormant requirement change. CURRENT_FINANCIAL_DEBT_TRACE.json/M3_DEPENDENCY_ANALYSIS.json trace approved intent and actual code. CROSS_TICKER_DEBT_DISCLOSURE_SAMPLE.json uses retained evidence only; it grants no other-ticker admission.

Definitions and HPG_REEVALUATION_PROVISIONAL.json are PROPOSED_UNAPPROVED. Actual CORE30/35 remains unchanged. Hypothetical35/35 is quantity-only; no HPG approval/scoring. Carrying/principal and uncertainty metadata stay explicit.

Node22.23.2 isolated regeneration: `node scripts/review-debt-metric-contract.mjs --out=/private/tmp/debt-contract-review-replay`. Sealed directory refuses producer writes. Dormant scripts/lib/debt-metric-proposal.ts is imported only by review tooling/tests. Independent review, regression/test results and ARTIFACT_HASHES.json retain approval/validation boundaries. Stop after contract review and await Project Owner decision.
