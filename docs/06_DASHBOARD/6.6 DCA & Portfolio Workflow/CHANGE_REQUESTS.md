# M6.6 change requests

## CR-01 — Sequential hypothetical allocation contract (open, major capability gap)

M5 Monthly §22–23 requires renewed portfolio, risk and marginal opportunity-cost evidence after each lot. M6.5 `DecisionEngine.create` only reads a real M6.3 snapshot; `DecisionPortfolioRead` exposes no immutable hypothetical projection chain. Reusing multiple decisions against the same pre-trade snapshot would violate that rule. M6.6 must not create its own accounting/risk engine.

Requested owning-boundary extension: an M6.3-owned, non-ledger scenario projection and M6.5-owned per-step risk/opportunity assessment, with immutable parent-step references. Until available, propose only a decision whose approved executable quantity equals its upstream board lot. Do not shrink/reprice a multi-lot decision locally. Multi-lot requests fail closed and leave all cash unallocated. Additional actual transactions require a new review/snapshot. This is not an approved one-lot investment policy.

## CR-02 — Affordable substitution evidence (open, major capability gap)

M4 Opportunity Cost §12 requires MOS comparison, uncertainty, relative portfolio fit and repeated-substitution protection. M6.5's comparator output does not expose a complete validated substitution authorization. Preserve preferred-candidate merit and HOLD CASH when it is non-executable; do not infer substitution from ranking or affordability.

## CR-03 — Materiality/freshness calibration (deferred)

M5 explicitly leaves exact event thresholds, recurrence counts and review weekdays flexible. Use sourced human findings and upstream validThrough dates. Do not introduce a days-to-expiry rule, keyword classifier or numeric bias count. Capital allocation requires the same as-of and portfolio snapshot as its formal decisions, plus evidence valid at the review date. Surveillance may record limitations without forcing trades.

## CR-04 — Upstream production prerequisites (existing governance dependency)

M6.4 formal issuance requires approved production scoring/risk/Stage 0 registry records. Synthetic fixtures are not approval. M6.6 accepts only FORMAL decisions in production; test-only synthetic mode is explicitly isolated. This implementation does not approve or rewrite upstream methodologies.
