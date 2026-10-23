# Security and database validation

Command: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pec1c-capture.py --json <package>/validation/security-tests.json`.

Tests 01–18 correspond directly to all eighteen requested cases: authenticated actor (synthetic only), missing authentication, expired session, revoked session, revoked role, denied operation, denied exact dataset scope, producer self-approval, caller historical timestamp, duplicate, concurrent duplicate, modified evidence, invalid chain, partial transaction failure, clock rollback, unauthorized owner operation, PEC-2 admission denial and scoring activation denial.

Additional tests cover SQL UPDATE/DELETE/REPLACE denial, missing immutability guard, revocation on saved replay, preparation namespace rejection, exact boundary resolution, UTC/monotonic divergence, grant scope substitution, expiry during execution, one-winner concurrent head CAS, corrupted stored BLOB with restored schema, PEC-1B event field/role compatibility, subject revocation and role revocation immediately after business writes with rollback. All production-provider and executor implementations remain external dependencies.

FixtureIdentity/FixtureExecutor/FixtureClock exist ONLY in the test file. Every database is TemporaryDirectory synthetic SQLite; no real identities, approvals, financial observations or production authority stores are written. Positive authentication and formal-event tests demonstrate the integration contract using fixtures, not operationally configured provider readiness. Partial transaction tests cover same-connection SQLite writes; external IO/distributed commits, power loss and live provider deployment are not claimed tested.

The first 27-case run found stale pre-lock replay time and fixture concurrency/diagnostic issues. Capture now re-samples and reauthorizes inside BEGIN IMMEDIATE; a synchronized fixture clock and an actual competing-head test preserve the gates. initial-security-failure.json records the initial nonzero result and resolution. Subsequent tests also verify schema tampering and producer/scope/role compatibility.

Regression commands: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pec1b-workflow.py --json <package>/validation/pec1b-regressions.json` (25); `PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-pec2-final-review.py --json <package>/validation/pec2-regressions.json` (62). Architecture: `/private/tmp/node-v22.23.2-darwin-arm64/bin/node scripts/check-boundaries.mjs`. Actual commands/exits/counts and read-only production safety replay are in VALIDATION_RESULTS.json and validation/.
