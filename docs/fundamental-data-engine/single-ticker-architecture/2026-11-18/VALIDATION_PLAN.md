# Validation plan

All executable queue tests use synthetic callback results in TemporaryDirectory stores. Real retained universe files are read only for common membership/security/sector validation. No live worker, source download, financial calculation, scoring, production deployment or publication is executed.

| Invariant | Test/evidence |
| --- | --- |
| All five Skill contracts require exactly one ticker | Reject missing/list/ALL/VN30/wildcard/joined/Unicode/path input for each Skill |
| No CLI override/batch escape | Repeated --ticker, hidden symbols parameter, unknown --run and plural request fields rejected |
| Versioned universe and relevant date | Known qualified version, ticker/exchange/security match, interval endpoints, uncovered reference dates and changed profile hash |
| Read-only universe inventory | 30-constituent report, no store files/worker; financial readiness and PIT not inferred |
| Sector-specific context | Preserve BANK / TECHNOLOGY / INDUSTRIAL; no missing/unknown sector or VNM default |
| Ticker-scoped inputs/references/results | Reject VNM authority for FPT, mismatched input cutoff, other issuer result/evidence and permission escalation fields |
| Sequential execution | One callback per run_next, ordered dispatch, concurrency other than integer1 rejected, overlapping dispatcher lock rejected |
| Separate durable identity/evidence | Distinct execution IDs/home directories, per-attempt checkpoint/result files and immutable requests |
| Failure isolation | A failing ticker leaves completed ticker bytes intact; next independent pending ticker continues |
| Idempotent retry | Same operation key, new attempt ID, no completed callback replay, identical replanning preserves state |
| Interrupted recovery | Verified checkpoint resume for trusted idempotent adapter; ambiguous effects require reconciliation |
| Corrupt result | Only affected ticker is INTEGRITY_BLOCKED; completed other ticker remains readable and unchanged |
| Governance preservation | All permissions false; no live adapter or CLI execution command; VNM worker hashes, production DB and existing registration hashes unchanged |

Commands:

```sh
python3 -B -m unittest discover -s tests/unit -p 'test_single_ticker_rollout.py' -v
python3 <skill-creator>/scripts/quick_validate.py skills/<skill-name>
```

Run quick_validate on the five updated Skills plus the new orchestrator; check local reference links and parse the registry JSON. Validate new/changed scripts without downloading dependencies or generating production data. Record actual results and protected fingerprints in VALIDATION.json. No full repository suite, economic closure or live rollout PASS may be inferred from these scoped tests.

Before future live integration: run the exact trusted one-ticker adapter through this host in a disposable environment, prove input/output scope and side-effect idempotence/reconciliation, and retain original consumer authority/time gates. That test is outside this planning-only amendment and is NOT_RUN here.
