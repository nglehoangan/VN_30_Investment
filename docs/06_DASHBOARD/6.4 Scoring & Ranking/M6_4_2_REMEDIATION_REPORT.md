# M6.4.2 Remediation Report

Date: 2026-09-20  
Reviewed commit: `b3a30def5ad0c37517cb9e39e239f073fe36ecf5`  
Scope: M6.4 only; M6.5 was not started.

## Findings addressed

| Finding | Resolution |
| --- | --- |
| M64-R2-M01 — M6.4 owned M1/M4 policy concepts | Scorecards now accept dated external Stage 0, veto and residual-risk assessments. Ranking accepts dated M4 required-return and portfolio-constraint results. M6.4 validates lineage and consumes status; it contains no M4 hurdle thresholds or exception policy. |
| M64-R2-M02 — proposed clarification was the only executable methodology | Methodology records now carry governance status and intended use. The clarification fixture is PROPOSED/TEST and can produce only synthetic test artifacts. Formal artifacts require APPROVED/PRODUCTION plus an external approval reference. |
| Minor — methodology auditability | Implementation identity/category maxima and sector definitions are isolated from the rubric specification. |
| Minor — ranking exclusion auditability | Every exclusion is a structured code, detail and evidence reference. |

## Gate ownership matrix

| Gate or calculation | Owner | M6.4 behavior |
| --- | --- | --- |
| Stage 0 eligibility | M1 Stage 0 | Consume external result and lineage |
| Hard veto and residual-risk policy | M1 Risk Policy | Consume external result and lineage |
| Score /100, evidence sufficiency and confidence | M3 / M6.4 | Calculate deterministically |
| Category minimums and investable ranking eligibility | M3 / M6.4 | Calculate and disclose structured exclusions |
| Required-return hurdle and exception | M4 | Consume external PASS/FAIL result; never derive thresholds |
| Portfolio limits and opportunity cost | M4 | Consume external constraint result when supplied |
| Portfolio reconstruction and reconciliation | M6.3 | Consume immutable integrity context |
| BUY/SELL/HOLD decision | M4/M6.5 downstream | Not emitted by M6.4 |

## Approval state

No production methodology approval is claimed. `m64-clarification-1` remains PROPOSED and TEST-only. Production activation requires the project methodology owner to supply a real approval reference and effective date through the registry. The database migration records this external state; it does not grant approval.

## Verification contract

Tests cover synthetic versus formal activation, rejection of unapproved formal methods, immutable historical method identity, external M4 PASS/FAIL consumption without threshold recalculation, stable M3 arithmetic when M4 changes, structured exclusion evidence, and additive migration over populated portfolio data.
