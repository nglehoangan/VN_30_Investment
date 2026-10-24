# Local viewing and preserved gates

Inspected app/server/dashboard.ts::loadDashboard/readDashboard and app/server/current.ts::currentServices: local reads use the existing database/configuration, portfolio/artifact readers, optional research and current-data services. They do not require RuntimeReviewerIdentity, PEC-1C capture authentication or an OIDC session. app/server/runtime.ts retains ordinary clock/ID composition; no login middleware/redirect/provider was added by PEC-1D.

Therefore no application code bypass or authentication feature flag is needed. Keep the existing loopback Next application and private SQLite configuration. Portfolio/accounting reconstruction, available retained reports, research displays and historical artifacts remain viewable according to existing data availability. A displayed missing/stale/corrupt-data warning, blocked actionability, absent approval or withheld score is a data/governance condition, not a request to implement deferred login.

Selected existing unit/UI regressions exercise portfolio/holdings rendering, route catalog/empty states, current DTOs and review blocking, research evidence disclosure and data freshness/lineage. They use synthetic in-memory fixtures and no database migrations. Source-level unchanged-file checks protect the actual server composition. These checks do not claim a new live deployment/browser acceptance or real production dataset readiness.

Unchanged source approval, independent acceptance, formal capture, admission and scoring boundaries are checked by PEC-1B/PEC-2 regressions, immutable PEC-1C code pins and the original eight real empty-trust candidate evaluations. No authenticated approval may be replaced by this documentation, local OS identity or unsigned records.
