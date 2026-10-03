# M6.7 implementation map

Architecture audit: approved M6.1 documents are under `6.1 Requirements & Architecture` with versioned filenames, rather than the logical paths in the prompt. Existing foundation is Next 16.3.4, server composition in app/server, pure application engines, immutable checksummed repositories and SQLite. Read the installed Next page and Server Action guides before implementation. M6.6 baseline: c059254d56c4f635d1ff9b09867ac6b4de970cf1.

| Screen / route | User goal | Authoritative source / read | Write boundary | Allowed transformation | Forbidden logic | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard / | Operational summary | M6.3 reconstruction; bounded artifact catalog | None | Label summaries and reference links | NAV/P&L or decisions from browser data | UI + E2E |
| Holdings /holdings | Inspect owned positions | PortfolioEngine.reconstruct | None | Exact decimal display | Accounting arithmetic | UI + integration |
| VN30 Universe /vn30 | Inspect membership as-of | M6.4 scorecard pinned effective-date reference | None | Latest artifact per security; label historical scope | Infer current universe from partial cards | UI |
| Scoring /scoring/:id | Inspect formal evidence | AnalyticalArtifacts.find checksum validation | None | Category/subcategory tables and evidence inspector | Override points | UI |
| Ranking /ranking | Inspect formal Top 10 | Persisted M6.4 Ranking | None | Table rows and exclusion labels | Rank authorizes purchase | UI |
| Decision Center /decisions/:id | Inspect economic state and execution separately | DecisionArtifacts.find deterministic replay | None | Display reason codes and linked evidence | Economic state mapping | UI + E2E |
| DCA Planner /dca/:reviewId | Inspect proposal and marginal trace | WorkflowArtifacts.find | None | Candidate, lot, step tables | Allocate, substitute or auto-execute | UI + E2E |
| Review Center /reviews/:id | Inspect five review types | WorkflowArtifacts.find | None | Event-first display order | Reinterpret review as decision | UI |
| Journal /journal/:reviewId | Read approved embedded journal | ReviewArtifact.journal + command behavioral observations | None | Potential-bias wording; linked review | Text authorizes investment | UI |
| Transactions /transactions/:id | Inspect immutable facts and legs | PrismaPortfolioLedger.read (M6.3 validation) | None | Page list of facts | Update/delete posted history | integration |
| Transaction entry /transactions/new | Record already occurred economic facts | Server-resolved portfolio, registry, ledger | Explicit preview → confirmed M6.3 post | Draft input validation | Browser balance/method/authority or proposal execution | UI + integration + E2E |
| Audit /audit | Inspect lineage | Validated artifacts + methodology registry | None | Collapsible fields and reference links | Generic artifact mutation | UI |
| Risk /risk, Performance /performance | Inspect supported evidence | Persisted decision risk; M6.3 realized P&L | None | Show unavailable unsupported series | Invent concentration/benchmark return | UI |
| Data /data, Settings /settings, Imports /imports | Understand trust and gaps | Catalog as-of; missing upstream services explicit | None | Warnings and read-only method identities | Policy changes or fabricated freshness | E2E |

DTO boundary: server composition opens only an existing database, catalogs bounded IDs, then delegates artifact decoding to existing repositories. M6.3 reconstruction supplies all accounting fields. No arbitrary body from a DB row goes directly to the UI. Historical analytical artifacts retain scope, as-of, evidence cutoff and methodology; no current-actionability claim is made without a current approved snapshot. No mock production seeding. No M6.8.
