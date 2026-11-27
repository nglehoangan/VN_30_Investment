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
