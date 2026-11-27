---
name: vn30-external-research-evidence
description: Admit owner-listed broker, industry, macro and valuation-method PDFs as traceable research evidence for one VN30 ticker. Use for publication, forecast revision, share-basis and valuation-assumption qualification.
---

# External Research Evidence

Prepare one required ticker, pinned universe, sector, cutoff, evidence purpose and an explicit owner-provided list of URLs or local PDFs with type, issuer scope and intended assumption mapping. Reject aggregate tickers. Use the [single-ticker contract](../vn30-rollout-orchestrator/references/single-ticker-contract.md). Reuse matching extracted JSON and immutable PDFs before fetching anything. Limit downloads to the selected list and its verified redirects. Use [JSON-first PDF reading](../read-pdf-json-first/SKILL.md) for document matching and extraction. Record missing, invalid and out-of-scope documents as dispositions.

1. Hash exact PDF bytes. Verify publisher, analyst if stated, title, issuer, actual document date, conservative availability bound, horizon, and page count. Preserve original and final URLs, retrieval timestamp, type, family and authority separately. A retrieval or filename date alone cannot establish point-in-time eligibility.
2. Extract reviewable page/table rows with exact values, units, reporting periods, forecast versus actual, definition, scope, corporate-action basis, and source lineage. Resolve ambiguous tables against the page. Keep issuer financial facts authoritative when repeated in research. Distinguish an estimate, target, observation, scenario and methodology reference.
3. Group publications by publisher/research process. Reconcile revisions on comparable years and denominators. Preserve older reports for audit and select the newest eligible scope-compatible observation per dependency. Reject future information, mismatched issuers, and projections outside their horizon. Financial years on forecast tables do not determine publication dates.
4. Map candidate observations to the existing assumption registry per rubric, route, model and period. Record remaining conflicts and counterevidence. Normalize investor entitlement and distinguish stock distributions from economic dilution. Never import target prices or unrelated issuer numbers into intrinsic value. A document's admission does not qualify its financial assumptions.
5. Emit the pinned manifest, extracted observations, qualification candidates and precise rejections. Keep production and formal authority unchanged. See the [WP5 v1.1 evidence schema and runner contract](../../docs/03%20SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.1.json).


### WP5 bounded shareholder IRR

For one ticker and cutoff, use the [scoped VAL-RET v1.2 amendment](../../docs/03%20SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.2.json). Distinguish qualified point, conservative case, single-band range, unexplained cross-band range and sensitivity only. Low or negative supported returns can score; zero points and N/R are distinct. Qualify the complete coherent uncertainty set, endpoints and material adverse cases. Review entitlement, terminal horizon, distribution credit and contraction. Use admitted analyst forecasts as evidence, and qualify material bounds independently. Exclude irrelevant model dependencies. Keep the existing cumulative workflow, price and share binding, counterevidence, model and band lineage, exact assessment record and research-only authority.

### WP5 v2.0 analyst-driven valuation

For one ticker and an eligible sector model, follow [RR01–RR20](../../docs/03%20SCORING/WP5_VALUE_INVESTING_ANALYSIS_AMENDMENT_v2.0.json). Pin a Data Freeze per period. Separate facts, reproducible calculations and analyst-generated estimates. Persist the model proposal and reasonableness challenge separately. External corroboration is optional. Classify material blockers RB01–RB05, allow a single revision, and bind the final economic disposition and limitations to the exact proposal. Preserve model-specific lineage, Method B priority, bounded return forms, five confidence dimensions, current-price Effective Score and existing research authority.

### WP6 Risk & Governance research

Use the [RG01–RG20 amendment](../../docs/03%20SCORING/WP6_RISK_GOVERNANCE_AMENDMENT_v1.0.json) for one ticker, eligible sector and frozen information window. Preserve factual audit, governance, sanctions and veto evidence separately from judgments. Review public governance and distinct residual loss channels. Record the prior rubric owner and distinguish planned controls, implementation and demonstrated effectiveness at the assessment date. Recompute thesis sensitivities using eligible retained scenarios and record shared dependencies separately from score levels. Use RV01–RV06, RB01–RB05 and at most one revision. Apply Effective Score freshness and material-event rules. Preserve formal Stage 0, Hard Veto and Risk Policy status independently from research classifications.

### WP7 Capital Allocation Quality research

Use the [CA01–CA24 research amendment](../../docs/03%20SCORING/WP7_CAPITAL_ALLOCATION_AMENDMENT_v1.0.json) for one eligible ticker and sector. Freeze factual decisions, deployed capital, commissioning and attributable outcomes. Reconcile parent cash retention, paid distributions and buyback applicability. Separate new issuance, treasury transfers and pro-rata entitlement changes. Calculate event-aligned transfer, ESOP break-even benefits and sequential per-share effects. Prioritize detailed, unchanged PX04/PX05 and then applicable bounded routes. Bind both comparative share basis and distinct cycle-adjusted support before awarding binary maxima. Preserve any N/R and provisional origins in the complete 23-rubric display. Aggregate complete research totals only when all Effective Scores qualify, with existing formal authority kept separate.

### WP7 v1.1 bounded economic closure

Apply [CA25–CA34](../../docs/03%20SCORING/WP7_CAPITAL_ALLOCATION_AMENDMENT_v1.1.json) for one eligible ticker and sector. Group capital decisions only where deployed resources and observed economic outcomes support attribution. Consider the latest eligible parent cash assessment with a dated subsequent-event review. Keep the original date and direct N/R visible when provisional research carry applies. Distinguish unresolved scope or materiality from proven invalidation. Use event-aligned analyst valuation and benefit materiality with dated facts, economic bounds and share-entitlement reconciliation. Unknown ESOP offsets remain unknown. PX04/PX05, canonical maxima and formal gates continue to apply. Finalize the bounded review with at most one analyst revision.

### Targeted capital-allocation evidence updates

Audit retained materials first and distinguish extracted, unextracted, derivable, unused, missing and nonrequired inputs. Pin the narrow evidence inventory and its availability window. Match project identities and classify outcomes as financial, operational or execution evidence. For ESOP, verify each cohort's terms, KPI, rights, event dates, eligible raw prices and actual gross versus net proceeds. Use human-capital indicators as scoped proxies, calculate reverse benefit thresholds and challenge overlap across annual programmes. Stop after the authorized pass and preserve unaffected Effective Scores, proxy behavior and formal authority.
