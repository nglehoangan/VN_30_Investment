# Standing CaféF source principle and governed price ingestion

Owner authorization and source contract: `docs/fundamental-data-engine/cafef-standing-source/2026-11-12/{STANDING_SOURCE_POLICY.md,SOURCE_POLICY_AUTHORIZATION.json,INGEST_TRANSFORM_CONTRACT.md}`. The exact owner request authorizes a **versioned source-governance principle**. It does not approve arbitrary observations, arbitrary code, F2 financial facts, the prior VNM17-fact proposal or production.

Use `app/server/cafef-standing-services.ts::ingestRetainedCafef` when the task authorizes governed raw-price ingestion. It transforms the existing fetching skill's raw container during ingestion, using existing domain normalizer/lifecycle contracts and the existing SQLite Market Boundary store. The fetching skill itself remains raw-only. Never create a competing price calculation or silently write financial/accounting data.

A trusted host must supply current standing authorization, independently accepted **material hash** and controlled collector/retained-capture handoff. These are registry/host dependencies, not `PASS` values accepted from input. An unchanged independently accepted schema/adapter/policy/material supports routine per-observation validation across eligible tickers without repetitive manual source approval. Unknown code/schema/semantics/unit changes or superseded policies suspend the affected scope and require requalification; do not auto-enroll a new version.

First verify dated VN30 membership and raw availability. Under the retained real snapshot, membership is checked only3Aug–16Oct2026; a null end date is not complete later history. Current retained CaféF history has VNM only. FPT/HPG/VCB TCBS quotes and financial-report API values are not CaféF raw-close history. Run the existing S4 offline review where sufficient reviewed action/share evidence exists; otherwise identify the exact missing inputs. Do not invent dividends/share counts or fetch new statements/action histories just to force pilot PASS. Synthetic fixtures are labelled test coverage, never real pilot acceptance or inherited VNM approvals.

Dry-run command (no active DB writes or new source discovery):

```sh
node scripts/cafef-standing.mjs --package docs/fundamental-data-engine/cafef-standing-source/2026-11-12
```

The real work package currently has **no independently accepted new material**, so F1 remains BLOCKED, F2 OPEN and formal S4 NOT_CLOSED. R1/R4 remain CLOSED; R3 only limits historical completeness. Accepted SQL writes/valuation consumption are exercised in disposable synthetic fixtures; do not describe them as real admissions. See the dated `FINAL_CIO_REVIEW.md` for exact blockers, migration/rollback and readiness. STOP before production activation.
