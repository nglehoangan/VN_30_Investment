# Verified application infrastructure

Status: **OWNER_ARCHITECTURE_DECISION_REQUIRED**. No provider, production executor, deployment ownership or migration authorization is established. Repository facts and runtime assumptions are separated below.

| Area | Verified repository fact | Exact reference |
|---|---|---|
| Framework | Next.js 16.3.4, React 19.3.0, TypeScript; pinned Node >=22.23.2 <23 | [package.json:59](../../../../package.json); [package.json:7](../../../../package.json) |
| Deployment declaration | Next dev/start bind 127.0.0.1; default single-user local app | [package.json:11](../../../../package.json); README.md:84 |
| Authentication | RuntimeReviewerIdentity is a subject/session/three-role port; no concrete app provider configured | [src/ports/runtime-readiness.ts:6](../../../../src/ports/runtime-readiness.ts); CONFIGURATION_PRESENCE.json |
| User/session/roles | No app User/Session/Role/Permission models or corresponding inspected DB tables; seven PEC-1C permissions remain unassigned | prisma/schema.prisma; DATABASE_TARGET_ASSESSMENT.json |
| Broker authentication | TCBS private JWT/OTP session authenticates broker account access, not app owner/reviewer permissions | [api/tcbs.mjs:11](../../../../api/tcbs.mjs); [api/tcbs.mjs:47](../../../../api/tcbs.mjs) |
| UI confirmation | Process-random HMAC key seals transaction confirmation payloads; no named subject/session or durable identity audit | [src/infrastructure/dashboard-support.ts:4](../../../../src/infrastructure/dashboard-support.ts) |
| DB default | Private local SQLite at data/vn30.sqlite; absolute local file override allowed; no remote DB URL | [prisma/schema.prisma:7](../../../../prisma/schema.prisma); [src/infrastructure/config/database.ts:22](../../../../src/infrastructure/config/database.ts) |
| DB connections | Prisma 7.10.0 with better-sqlite3; foreign keys/recursive triggers, DELETE journal and bounded busy timeout | [src/infrastructure/db/client.ts:8](../../../../src/infrastructure/db/client.ts); [src/infrastructure/db/client.ts:14](../../../../src/infrastructure/db/client.ts) |
| DB lifecycle | Explicit open/close persistence and migration CLI, no automatic startup migration | [app/server/persistence.ts:7](../../../../app/server/persistence.ts); [scripts/database.mjs:8](../../../../scripts/database.mjs) |
| Transactions | Existing Prisma transaction composition and fundamental import transaction | [src/infrastructure/repositories/workflow-artifacts.ts:61](../../../../src/infrastructure/repositories/workflow-artifacts.ts); [src/infrastructure/repositories/fundamentals.ts:42](../../../../src/infrastructure/repositories/fundamentals.ts) |
| Review/audit | FileHumanReviews is isolated staging; portfolio workflow audit is a different business domain | [src/infrastructure/repositories/file-human-reviews.ts:10](../../../../src/infrastructure/repositories/file-human-reviews.ts); prisma/schema.prisma |
| Operational logging | Allowlisted redacted diagnostics, not independently retained authentication audit | [src/infrastructure/logging/logger.ts:11](../../../../src/infrastructure/logging/logger.ts) |
| Secrets/config | .env.local loading; ignored env/live data; runtime tracing excludes local data/secrets. No managed secrets service identified | [.env.example:5](../../../../.env.example); [.gitignore:5](../../../../.gitignore); [next.config.ts:6](../../../../next.config.ts) |
| Clock | System Date UTC; PEC-1C adds monotonic/persisted-order checks. No external UTC health attestation configured | [src/infrastructure/runtime.ts:4](../../../../src/infrastructure/runtime.ts); [scripts/lib/pec1c_capture.py:88](../../../../scripts/lib/pec1c_capture.py) |
| Backup | VACUUM INTO, checksummed manifest, isolated restore candidate without automatic activation | [scripts/backup.mjs:49](../../../../scripts/backup.mjs); [scripts/backup.mjs:104](../../../../scripts/backup.mjs) |

INFRASTRUCTURE_REFERENCES.json pins exact bytes and line references. DATABASE_TARGET_ASSESSMENT.json lists read-only table/migration facts, file modes and OS ownership; these do not identify an accountable production owner or attest an active server's DATABASE_URL. No remote deployment manifest was identified in the inspected non-vendor tree; absence from this tree does not rule out external infrastructure. No private token, API key or password value is emitted or retained in the packet.

The verified local SQLite target is suitable for evaluating an additive integration; active production deployment, database ownership, off-device backup, identity tenancy and independent operator access still require owner confirmation. No provider is inferred from TCBS login or a generic interface. No OS username is promoted to Investment System Owner.
