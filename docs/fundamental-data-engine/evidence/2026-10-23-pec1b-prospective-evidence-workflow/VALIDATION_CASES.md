# PEC-1B validation cases

Command: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pec1b-workflow.py --json <package>/validation/pec1b-tests.json`.

| Requested case | Coverage |
|---|---|
| 1 Valid prospective ingestion | test_01: new acquisition -> verification -> ingestion PREPARATIONS with actual local capture window, all formal clocks null. This is NOT a positive authenticated FORMAL ingestion test; that remains dependency blocked. |
| 2 Missing authentication | test_02, test_18: even a reference or authenticated=true argument cannot enable formal capture. |
| 3 Unauthorized actor | test_03: wrong operation role rejected. |
| 4 Producer self-approval | test_04: mapping/independent producer distinction. |
| 5 Duplicate event | test_05: exact retry idempotent, modified retry conflicts. |
| 6 Modified evidence | test_06: byte change detected on replay. |
| 7 Backdated recordedAt | test_07: caller timestamps forbidden. |
| 8 Missing knowledge | test_08, test_22: incomplete chain, no clock promotion. |
| 9 Invalid order | test_09, test_23: missing/foreign predecessor and ingestion without verification. |
| 10 Future leakage | test_10: knowledge after cutoff rejected. |
| 11 Missing dataset cutoff | test_11: null cutoff denied. |
| 12 Invalid dataset version | test_12, test_14: noncanonical/changed content denied. |
| 13 Revoked acceptance | test_13: acceptance=false, revoked blocker retained. |
| 14 Changed source | test_14, test_21: exact source/method/dataset/cutoff binding. |
| 15 Invalid PEC-2 admission | test_15 plus original eight real empty-trust replays and existing v2 regressions. |
| 16 Unauthorized activation | test_16: unconditional denial. |

Additional tests cover modified events, field completeness, false auth claims, structurally valid dataset still blocked, scope-bound reviewer preparation and explicit revalidation. All positive examples use SYNTHETIC identifiers and TemporaryDirectory outside real authority stores. No test grants production authority. Authenticated end-to-end capture/commit, provider permission revocation, formal ingestion, complete authenticated MAX-boundary chain and actual independent acceptance cannot be tested as successful production operations without the missing provider/composition; these are explicitly NOT claimed passed.

Applicable existing commands: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pec2-final-review.py --json <package>/validation/pec2-regressions.json`, `PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pec1-authority.py`, and `node scripts/check-boundaries.mjs`. No schema migration or app/runtime build is needed for this offline Python preparation change. Prior evidence verifiers that assert a closed evidence namespace are not modified to admit new packages; actual historical seals/code pins are directly rehashed. PEC-1A verifier is not rerun because it rewrites its own historical execution receipt; its seal is verified read-only instead.
