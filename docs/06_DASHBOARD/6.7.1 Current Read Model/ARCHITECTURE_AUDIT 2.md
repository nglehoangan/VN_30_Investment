# M6.7.1 ownership audit

Baseline HEAD: d9e05f8627a551f0f63309cae695e3369e2b69ae. The approved M6.1 files are versioned documents in `../6.1 Requirements & Architecture/`.

| Concern | Approved ownership and implementation |
| --- | --- |
| Market prices | MARKET_DATA_ADAPTER §§4–5,12,15,19,24,29–30: normalized source records preserve security, actual market as-of, retrieval, source/provider, revision, quality, RAW/ADJUSTED and explicit validity-policy reference. `LocalCurrentSource` reads a bounded configured local normalized dataset. No vendor selected and no network refresh added. |
| Reference / sector | MARKET_DATA_ADAPTER §§8–9; M6.3 `referenceAt`: effective dated intervals, exclusive end date and taxonomy version. No historical backfill. |
| Quantity / cost / realized P&L / cash | M6.3 ledger replay and `PortfolioEngine.reconstruct`; no changes to accounting authority. |
| NAV / market value / unrealized / weights | M6.3 `valuePortfolio`: holdings market value + ledger cash + recognized receivables − recognized payables. Pending corporate accounting and supported inception status flow through the existing snapshot. No new NAV or return formula. |
| Sector exposure | Application read query sums M6.3 valuation rows by M6.3 effective-dated sector. It is informational; no M6.5 risk limit or authorization is reproduced. |
| Freshness | MARKET_DATA_ADAPTER §15 and existing M6.3 `validThrough`: source validity is explicit and policy referenced. No numeric age threshold. Missing validity or policy reference is UNKNOWN and blocks current valuation/readiness. Receipt never substitutes for market as-of. |
| Reconciliation | Existing M6.3 `reconcilePortfolio` compares independent normalized source evidence with reconstructed state. It requires matching portfolio/as-of and complete cash, obligations, quantity and cost evidence. Successful DB reads alone never imply MATCH. |
| Current actionability | `CurrentReadService` composes M6.3 snapshot and field-scoped M6.5 context. PASS requires FORMAL sources, current ledger/cutoff, valid price/reference freshness, and unblocked M6.3 snapshot. PASS is input integrity readiness, not trade authorization. |
| Workflow inputs | DATA_FLOW and UI IA §§25/32/SECURITY input validation; M6.6 `ReviewCommand`, `validateReview`, `WorkflowEngine`, `createReview`, `allocate`. Minimal intent resolves normalized analyst evidence and approved persisted artifacts on the server. React submits no formal command. |
| Weekly | All nine M6.6 WEEKLY_AREAS require provenance-backed analyst sections. No rescoring/reranking/decision refresh is invoked; actual material sections remain M6.6's refresh authority. |
| Monthly | Contribution must be a posted, unreversed M6.3 deposit in the pinned cutoff. Requires matching persisted FORMAL ranking/scorecard/decision evidence, including actual reference-data content/taxonomy and source cutoff rather than version labels alone. M6.6 produces HOLD CASH or proposal. No deployment quota or UI quantity selection. |
| Quarterly | M6.6 QUARTERLY_AREAS and thesis assessments required for held securities. Missing fundamentals produce INPUT REQUIRED before persistence; no invented unchanged assessment. |
| Annual | M6.6 ANNUAL_AREAS and analyst governance recommendation required. No policy or registry mutation is available. |
| Event driven | Explicit reference must resolve to a verified normalized trigger with provenance-backed evidence in the local analyst dataset. Free text cannot manufacture formal event authority. |

The normalized local provider is the minimum manual-file source capability permitted by the approved adapter. It is not the deferred general CSV/Excel staging/import UI. The filesystem remains a trust boundary: strict schema, bounded bytes/records, identity/date/unit validation and domain calculations apply. It cannot accept precomputed NAV, formal decision, risk PASS, allocation, review disposition or authorization fields.

Current analytical context is stable for a captured dataset/cutoff, while historical persisted artifacts remain immutable. Source revisions must use new versions and be retained externally as provenance; review artifacts embed consumed normalized evidence and captured portfolio context. No M6.8 scheduler, vendor refresh, broker or automatic execution is introduced.
