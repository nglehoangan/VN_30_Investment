# VN30 Value Investing OS — Implementation Plan

**Document:** `06_DASHBOARD/IMPLEMENTATION_PLAN.md`  
**Milestone:** 6 — Dashboard & Automation  
**Sub-milestone:** M6.1 — Requirements & Architecture  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-09  

## Governing Baselines

This implementation plan is constrained by all approved M1–M5 baselines and the approved M6.1 files through `TEST_STRATEGY.md` v1.0.

This file plans implementation sequencing only. It does **not** authorize code yet and does not alter upstream investment rules.

---

# 1. Purpose

Sequence M6 implementation to minimize rework, validate accounting/data integrity before UI breadth, and keep every Codex implementation independently reviewable.

Approved implementation order:

1. M6.2 — Project Foundation
2. M6.3 — Portfolio & Transaction Engine
3. M6.4 — Scoring & Ranking
4. M6.5 — Decision Engine
5. M6.6 — DCA & Portfolio Workflow
6. M6.7 — Dashboard UI
7. M6.8 — Integration & Validation

---

# 2. Delivery Principles

- Correctness before breadth.
- Vertical proof before mass implementation.
- Approved baselines are authoritative.
- No business logic in UI.
- Every sub-milestone ends with validation evidence and diff review.
- Missing/conflicting upstream rule => Change Request, safe blocked behavior, no invented rule.
- No broker automation, margin, microservices, Kubernetes, Redis, or distributed architecture.

---

# 3. M6.2 — Project Foundation

## Objective
Create a minimal local-first, testable application skeleton.

## Scope
- Next.js + TypeScript foundation
- modular boundaries: domain/application/ports/infrastructure/ui/shared
- SQLite + Prisma
- Zod
- Vitest + React Testing Library + Playwright setup
- environment config
- controlled clock/ID abstractions
- methodology registry skeleton
- typed errors
- migration workflow
- loopback-only local start
- lint/typecheck/test/build scripts

## Early technical proofs
1. Prisma + SQLite migration works.
2. Decimal/numeric round-trip is deterministic.
3. Domain imports no Prisma/Next.js.
4. Test DB isolation works.
5. Loopback binding is confirmed.
6. Secrets are excluded from source.

## Exit gate
`lint`, `typecheck`, unit tests, build, migration validation, `git diff --check` all PASS; Critical=0, Major=0.

---

# 4. M6.3 — Portfolio & Transaction Engine

## Objective
Make ledger and portfolio reconstruction trustworthy before analytical layers.

## Order
1. Money, ShareQuantity, Ratio, dates/as-of, LedgerWatermark, SourceReference
2. Portfolio/Security/reference minimums
3. Transaction + TransactionLeg
4. persistence constraints and idempotency
5. replay/reconstruction
6. valuation/NAV/P&L
7. reconciliation
8. PortfolioSnapshot + stale/watermark handling
9. reversals/corrections
10. supported corporate actions

## Required vertical slices
- CASH_DEPOSIT -> CashState -> snapshot -> reconciliation
- BUY -> quantity/cash/cost basis -> valuation
- SELL -> realized P&L -> settlement -> snapshot
- reversal -> immutable lineage -> replay -> restored supported state

## Exit gate
Reconstruction, oversell rejection, duplicate prevention, reversal, reconciliation, precision, watermark/stale blocking all PASS.

---

# 5. M6.4 — Scoring & Ranking

## Objective
Implement M3 exactly.

## Order
1. evidence/metric model
2. metric definitions/methodology
3. freshness/data quality
4. sector normalization
5. subcategory/category scoring
6. total score
7. confidence/validity
8. Scorecard persistence
9. RankingRun
10. official Top 10

## Golden cases
Encode approved M3 validation cases and pin methodology identity.

## Exit gate
Scoring, normalization, confidence, ranking, Top 10, and evidence lineage reproduce approved behavior. Simple score sort must not masquerade as official ranking.

---

# 6. M6.5 — Decision Engine

## Objective
Implement M4 as the only source of Decision State.

## Order
1. decision input contract
2. Stage 0/eligibility
3. thesis
4. valuation/expected return
5. risk vetoes
6. portfolio/cash/lot constraints
7. opportunity cost
8. position sizing
9. precedence/state selection
10. DecisionRecord
11. Execution Status
12. invalidation/review triggers

## Mandatory tests
All seven states:
STRONG BUY, BUY, ACCUMULATE, HOLD, REDUCE, SELL, AVOID.

Anti-shortcut:
- high score alone != BUY
- low PE alone != BUY
- price drop alone != ACCUMULATE
- +20% gain alone != REDUCE/SELL

## Exit gate
All M4 golden cases pass; no transaction side effect from decision creation.

---

# 7. M6.6 — DCA & Portfolio Workflow

## Objective
Implement DCA, risk, reviews, and journal using approved M3/M4/M5 services.

## Order

### DCA
- planned contribution
- actual contribution from ledger
- cash
- ranking
- prices
- lot feasibility
- post-trade position/sector impact
- opportunity cost
- HOLD CASH

### Risk
- largest position
- Top 3
- sector
- cash
- drawdown
- thesis/confidence
- stale/reconciliation
- GREEN/WATCH/WARNING/BREACH

### Reviews
1. Weekly
2. Monthly DCA
3. Quarterly
4. Event-Driven
5. VN30 Reconstitution
6. Annual
7. Performance
8. Behavioral
9. Decision Audit

### Journal
- Decision/Review linkage
- thesis/rationale
- invalidation
- 3/6/12-month audit links

## Exit gate
HOLD CASH and NO ACTION work; review never forces trade; VN30 change triggers review only.

---

# 8. M6.7 — Dashboard UI

## Objective
Build UI only over stable application/domain services.

## Recommended order
1. global shell + trust strip
2. Dashboard
3. Holdings
4. Transactions
5. Security Detail
6. VN30 Universe
7. Scoring & Ranking
8. Decision Center
9. DCA Planner
10. Risk
11. Reviews
12. Journal
13. Performance
14. Imports
15. Data & Audit
16. Settings

## Rules
- no Prisma in UI
- no score/risk/decision logic in components
- current vs historical as-of explicit
- stale/reconciliation state visible
- authoritative writes revalidated server-side
- no broker execution

---

# 9. M6.8 — Integration & Validation

## Objective
Prove the full system coherently with a deterministic representative portfolio.

## Sample scenario must include
- cash contributions
- multiple BUYs
- partial SELL
- dividend
- fees/taxes
- reversal/correction
- multiple sectors
- price history
- VN30 membership history
- scoring/ranking
- decision paths
- DCA
- risk
- reviews
- journal
- benchmark history

## Full proof
`import -> ledger -> reconstruction -> reconciliation -> scoring -> ranking -> decision -> DCA -> risk -> reviews -> UI`

## Backup proof
`backup -> clean restore -> rebuild -> reconciliation -> same authoritative portfolio state`

## Exit gate
Critical=0, Major=0 and all production-readiness criteria from `TEST_STRATEGY.md` pass.

---

# 10. Codex Prompt Contract

Every Codex prompt must include:
- objective
- approved source documents
- exact scope
- explicit non-goals
- architecture constraints
- expected modules/files
- required tests
- validation commands
- prohibition on changing upstream policy

Codex must return:
1. summary
2. files changed
3. design decisions
4. test evidence
5. known issues

Never send a vague prompt like “Build the VN30 app”.

---

# 11. Diff Review Procedure

After Codex implementation review:
1. Functional correctness against owning baseline
2. Architecture boundaries
3. Data integrity/precision/effective dating/lineage
4. Security
5. Portfolio-system semantics
6. Tests and regression coverage

Classify Critical/Major/Minor. No approval with unresolved Critical/Major.

---

# 12. Validation Baseline

Expected commands once tooling exists:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Where relevant:

```text
pnpm test:integration
pnpm test:e2e
prisma validate
prisma migrate status
security/dependency audit command
```

Exact script names may differ.

---

# 13. ADRs During M6.2

Create only when decisions become real:
1. modular monolith
2. SQLite-first
3. Prisma
4. financial numeric representation
5. ledger watermark strategy
6. local data directory
7. provider ports
8. AI no-write authority
9. backup strategy
10. test DB isolation

---

# 14. Migration and Demo Data

- Schema migrations must preserve authoritative history.
- Never use “delete DB and recreate” as normal upgrade behavior.
- Demo/test data must use a separate deterministic database.
- Demo reset must never target the real portfolio database.

---

# 15. Local Run Target

```text
install dependencies
configure local env
migrate database
start application
open localhost
```

Docker is not a hard MVP requirement unless evidence shows a concrete need.

---

# 16. Change Request Workflow

```text
Implementation blocker
 -> log Change Request
 -> cite owning baseline
 -> define impact
 -> define safe temporary behavior
 -> no invented rule
 -> obtain approval
 -> update baseline
 -> resume
```

---

# 17. Acceptance Criteria

`IMPLEMENTATION_PLAN.md` is acceptable only if:

1. dependency order is correct;
2. ledger precedes dependent analytics/UI;
3. M3 precedes M4;
4. M4 precedes DCA;
5. domain workflows precede full UI;
6. sub-milestones have explicit scope/non-goals;
7. Codex prompts are scoped;
8. validation evidence is mandatory;
9. diff review is mandatory;
10. M3/M4/M5 golden cases are reused;
11. SQLite/decimal risk is proven early;
12. backup/restore is validated before M6 completion;
13. no broker automation;
14. no distributed overengineering;
15. Change Request prevents rule invention;
16. docs stay synchronized;
17. final M6 has Critical=0, Major=0;
18. no M1–M5 rule changes.

---

# 18. Initial Multi-Role Review

## Product Manager
Critical: 0. Major: 0 unresolved. Sequencing protects MVP scope and prevents UI-first rework. **PASS.**

## Software Architect
Critical: 0. Major: 0 unresolved. Technical-risk proofs occur early; dependency order is correct. **PASS.**

## Portfolio Manager
Critical: 0. Major: 0 unresolved. Scoring -> Decision -> DCA governance is preserved. **PASS.**

## Data Engineer
Critical: 0. Major: 0 unresolved. Precision, migration, reconstruction, reconciliation, and backup are explicit. **PASS.**

## Security Reviewer
Critical: 0. Major: 0 unresolved. Security starts in M6.2 and broker/remote scope remains excluded. **PASS.**

---

# 19. Issue Register

## Critical unresolved
**0**

## Major unresolved
**0**

## Minor / Deferred
1. exact package versions
2. exact decimal library
3. exact local data directory
4. exact dependency-boundary tool
5. exact CI platform
6. final chart library
7. exact performance SLA
8. exact live providers

All belong to implementation-time decisions constrained by approved architecture.

---

# 20. Approval Gate

> **APPROVED BASELINE v1.0**

If approved:
1. promote `06_DASHBOARD/IMPLEMENTATION_PLAN.md` to **Approved Baseline v1.0**;
2. create/update the approved baseline artifact;
3. continue automatically to `06_DASHBOARD/VALIDATION_CASES.md`;
4. do **not** start implementation/code yet;
5. stop at `VALIDATION_CASES.md` until review and approval.
