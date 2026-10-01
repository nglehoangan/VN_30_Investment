# M6.6 implementation report

## Status

Implemented the workflow command, domain and persistence boundaries. **The M6.6 completion gate is not met.** Sequential multi-lot allocation and qualified affordable substitution remain blocked by missing upstream contracts (CR-01 and CR-02). The implementation fails closed instead of fabricating marginal risk or investment policy. No production portfolio database was used for validation.

## A. Rule ownership

The pre-implementation [ownership audit](RULE_OWNERSHIP_MATRIX.md) maps the M5 baseline and M1–M4/M6.1 dependencies. Accounting remains M6.3-owned; scorecards/ranking remain M6.4-owned; investment states, risk, sizing and opportunity assessments remain M6.5-owned.

| M5 rule | Owner | M6.6 responsibility | Source implementation | Tests |
|---|---|---|---|---|
| Monthly contribution differs from deployment | M6.3 cash; M4 DCA | Verify deposit lineage; retain unallocated cash | `portfolio-context.ts`, `allocation.ts` | DCA-01/02; real cash adapter |
| Ranking does not authorize trades | M6.4/M6.5 | Require persisted decision and matching scorecard | `engine.ts`, `capitalIssues` | DCA-03/04/12; missing/corrupt authority |
| Economic merit before affordability | M6.5 | Consume exact linked robust comparisons | `allocation.ts` | DCA-09; unaffordable preferred candidate |
| Periodic and event reviews | M5 | Completeness, precedence, disposition and refresh handoffs | `reviews.ts` | Weekly, quarterly, annual, event unit cases |
| Behavioral controls | M5 | Preserve structured observations and control evidence | `validation.ts`, `reviews.ts` | Indicators, all bias tags, false positives |
| Journal and post-decision audit | M5 | Immutable references; independent quality dimensions | `engine.ts`, repository | Audit quality matrix and history tests |
| Immutable history | M6.1 | Append-only records, hashes, replay, deduplication | Workflow migration and repository | SQL mutation rejection; R1/A1 → R2/A2 |

Paths above are under `src/domain/workflow`, `src/application/workflow`, or `src/infrastructure/repositories/workflow-artifacts.ts`. Server composition is `app/server/workflow.ts`.

## B. DCA state matrix

| Input | Result | Evidence |
|---|---|---|
| Fresh authorized eligible one-lot BUY with sufficient cash | BUY proposal; residual cash retained | DCA-02 |
| Owned holding with fresh ACCUMULATE authority | ACCUMULATE proposal | DCA-06 |
| Contribution but no qualified candidate | HOLD CASH | DCA-01 |
| Preferred candidate lacks executable lot cash | HOLD CASH; merit preserved | DCA-08; substitution test |
| Stale decision/evidence | REVIEW REQUIRED; no items | Freshness test |
| Blocked portfolio | REVIEW REQUIRED; no items | DCA-11 |
| Required return fails | HOLD CASH | DCA-10 |
| Multiple candidates with robust linked comparison | Economic priority derived from M6.5; one supported lot only | DCA-09 |
| Multiple candidates tied or comparison incomplete | REVIEW REQUIRED | 2/5/15-candidate cases |
| Multiple executable lots | REVIEW REQUIRED, CR-01 | Sequential simulation guard |

Proposal estimates never post a transaction. `executionReadiness` checks freshness, supersession, events and existing execution links. `linkExecution` only links a separately posted matching M6.3 BUY and preserves execution variance.

## C. Review workflow matrix

| Workflow | Trigger | Normal outcome | Escalation | Refresh | Capital permission |
|---|---|---|---|---|---|
| Weekly | Explicit scheduled command | NO ACTION when complete/unchanged | Missing evidence or material event | Material sections drive handoff | None |
| Monthly DCA | Explicit monthly command | BUY/ACCUMULATE proposal or HOLD CASH, separate from review disposition | Stale authority, event, comparison gap | Formal decision required for new material trigger | Supported upstream-approved lot only |
| Quarterly | Explicit period review | NO ACTION with complete holding checks | Missing thesis or weakening/broken thesis | Score/valuation changes and formal decision handoff | None |
| Annual | Explicit governance review | NO ACTION with complete assessment | Missing benchmark/governance or material changes | Evidence-driven handoff; no policy mutation | None |
| Event-driven | Recorded effective-dated finding | T0/no material action | Verified, decision-ready T3/T4 → DECISION REQUIRED | Formal M6.5 handoff | None; open event blocks monthly allocation |

Disposition stays NO ACTION / REVIEW REQUIRED / DECISION REQUIRED. ESCALATED is a workflow status. HOLD CASH is an allocation outcome, never an eighth investment Decision State. Commands do not implement a scheduler or news feed.

## D. Anti-shortcut evidence

`tests/unit/dca.test.ts` covers forced monthly deployment, price-decline averaging down, profit-threshold selling, score/rank authority, cash availability as authority, HOLD accumulation, required-return failure, portfolio/sector blocks, missing formal decisions, economic ties and automatic affordability substitution. Textual rationales cannot override M6.5 outputs. Weekly passage and periodic review do not create transactions. Integration tests compare ledger counts and reject injected quantity/outcome fields.

## E. Historical lineage

Portfolio snapshot ID/as-of/watermark and captured context → persisted scorecards/ranking → persisted M6.5 decisions → immutable review → atomic allocation proposal and embedded journal → separately posted transaction link.

Review inputs include evidence cutoff, scope, methodology identities, prior/superseded review IDs, original rationale and event references. SHA-256 hashes detect changed stored bodies; SQLite triggers prohibit update/delete and replacement. A later month changes cash, snapshot, scoring identity, ranking and decisions without changing R1/A1. Upgrade tests preserve actual M6.3 deposits and M6.4/M6.5 artifacts across repeated migrations.

## F. Behavioral controls

Observations require explicit structured indicators, evidence references, rationale and control status. Unresolved controls route to review. All supported bias tags require evidence. Price losses and profitable outcomes alone create no behavioral diagnosis and cannot mutate decisions. Audit process, decision, evidence, thesis, risk, execution and outcome quality are recorded separately; unknown dimensions produce PARTIALLY BLOCKED. Approximate 3/6/12-month reminders clamp calendar month ends and never cause a trade.

## G. Validation

See [validation report](VALIDATION_REPORT.md), command logs and machine-readable results. Tests use temporary SQLite fixtures and explicit synthetic scope; production composition accepts formal upstream authority only.

## H. Findings

- Critical unresolved: **0 identified**.
- Major unresolved: **2** — sequential marginal allocation (CR-01), affordable substitution authorization (CR-02).
- Minor unresolved: **0 identified in implemented paths**; this is not an independent audit conclusion.
- Deferred calibration: CR-03. No numeric freshness/materiality/bias thresholds invented.
- Existing production dependency: CR-04, approved upstream methodology records. Synthetic test data does not satisfy it.
- Technical debt: minimal embedded journal/behavior boundaries; no separate journal editing interface; workflow method is a versioned implementation constant. Open-event reads scan portfolio reviews. Richer user interfaces and automatic event ingestion are outside this delivery.

See [change requests](CHANGE_REQUESTS.md). The major gaps prevent marking M6.6 complete or ready under the requested completion gate.

## I. Scope

**M6.7+ functionality implemented: NO.** No automatic trade posting, policy approval, new investment state, independent scoring/ranking engine, or accounting recalculation was introduced.
