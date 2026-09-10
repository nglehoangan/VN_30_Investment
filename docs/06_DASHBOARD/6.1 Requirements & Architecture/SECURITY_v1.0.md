# VN30 Value Investing OS — Security Architecture

**Document:** `06_DASHBOARD/SECURITY.md`  
**Milestone:** 6 — Dashboard & Automation  
**Sub-milestone:** M6.1 — Requirements & Architecture  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-09  

## Governing Baselines

This document operationalizes:

- `06_DASHBOARD/REQUIREMENTS.md` — Approved Baseline v1.0
- `06_DASHBOARD/ARCHITECTURE.md` — Approved Baseline v1.0
- `06_DASHBOARD/DOMAIN_MODEL.md` — Approved Baseline v1.0
- `06_DASHBOARD/DATA_FLOW.md` — Approved Baseline v1.0
- `06_DASHBOARD/UI_INFORMATION_ARCHITECTURE.md` — Approved Baseline v1.0
- `06_DASHBOARD/MARKET_DATA_ADAPTER.md` — Approved Baseline v1.0
- `06_DASHBOARD/AI_INTEGRATION.md` — Approved Baseline v1.0
- all approved M1–M5 baselines

This document defines security boundaries, trust assumptions, controls, and future security gates.

It does **not** create broker integration, remote multi-user access, or autonomous trading.

---

# 1. Security Objective

The M6 application must protect:

- authoritative transaction ledger;
- portfolio state and audit history;
- imported financial data;
- methodology/version records;
- AI/provider credentials;
- backup artifacts;
- user trust in what is current, valid, and executable.

The primary MVP posture is:

> **single-user, local-first, loopback-only, no broker execution, no margin, no secrets in source code.**

---

# 2. Threat Model Scope

MVP threats considered:

1. accidental LAN/public exposure;
2. malicious or malformed CSV/Excel imports;
3. CSRF/origin abuse against local write actions;
4. stale browser state causing unsafe authoritative write;
5. duplicate/replayed authoritative requests;
6. direct database mutation bypassing domain logic;
7. AI prompt injection;
8. external API secret leakage;
9. sensitive financial data leakage through logs;
10. backup corruption or unintended disclosure;
11. dependency/supply-chain compromise;
12. local filesystem tampering;
13. unauthorized process/user access on the same machine;
14. restoration from incompatible or corrupted backups.

Explicitly outside MVP:

- internet-facing multi-user application;
- brokerage credential storage;
- live order placement;
- institutional RBAC;
- public REST API;
- distributed service-to-service authentication.

---

# 3. Trust Boundaries

```text
Browser
  |
  | same-origin / loopback boundary
  v
Next.js Application
  |
  +--> Application / Domain Layer
  |
  +--> Persistence Adapter --> SQLite
  |
  +--> File Import Boundary
  |
  +--> Market Data Provider Boundary
  |
  +--> AI Provider Boundary
  |
  +--> Backup / Export Boundary
```

Every external input crossing these boundaries is untrusted until validated.

---

# 4. Local-First Network Posture

## 4.1 Approved default

MVP shall bind only to:

```text
127.0.0.1
```

or equivalent loopback interface.

It shall not intentionally bind to:

```text
0.0.0.0
```

or a LAN/public interface by default.

## 4.2 Remote access trigger

Any future requirement for LAN/remote/cloud access triggers separate review for:

- authentication;
- authorization;
- TLS;
- session security;
- CSRF;
- remote database;
- rate limiting;
- threat model;
- secrets management;
- backup encryption;
- audit access.

Remote access is not an implementation toggle to be enabled casually.

---

# 5. Browser-to-Server Write Security

All state-changing actions must:

- use same-origin framework-supported mechanisms;
- apply CSRF/origin protection appropriate to the chosen Next.js write primitive;
- validate server-side;
- revalidate current domain state before commit;
- reject stale or conflicting writes;
- require explicit confirmation for authoritative economic actions.

Client-side validation is supplementary only.

---

# 6. Stale Form / TOCTOU Protection

Before authoritative commit, server must re-check:

- current ledger watermark;
- duplicate/idempotency key;
- current security/VN30 eligibility where relevant;
- current cash/quantity constraints;
- correction/reversal state;
- referenced DecisionRecord where applicable.

A transaction draft generated from stale context must not be committed blindly.

---

# 7. Idempotency and Replay Protection

Authoritative write workflows should use:

- stable idempotency/source keys;
- duplicate checks;
- transaction-safe uniqueness constraints.

Applies especially to:

- imported transactions;
- provider retrieval jobs;
- retryable application requests;
- correction/reversal actions.

A browser double-submit must not create duplicate economic events.

---

# 8. Database Access Boundary

Forbidden:

```text
Browser -> generic CRUD -> database
```

Required:

```text
Browser
 -> Application Use Case
 -> Domain Validation
 -> Repository Adapter
 -> Database
```

No UI route or client hook may bypass application/domain rules for authoritative writes.

---

# 9. SQLite File Protection

MVP SQLite database should be stored:

- outside public/static web directories;
- in an application-controlled local data directory;
- with OS permissions restricted to the local user/application context.

The application must never serve raw DB files over HTTP.

---

# 10. Local At-Rest Protection

Primary MVP protection may rely on:

- OS user account security;
- device encryption such as FileVault or equivalent;
- restricted filesystem permissions.

Application-level DB encryption is optional unless device/environment risk requires it.

If application-level encryption is introduced:

- key must not be stored alongside encrypted DB in plaintext;
- backup/restore design must include key management;
- migration/recovery must be tested.

---

# 11. File Import Security

CSV/Excel/import files are untrusted.

Required controls:

- file size limit;
- extension/type validation;
- parser allowlist;
- bounded row/cell count;
- bounded string length;
- path traversal prevention;
- no macro execution;
- no arbitrary formula execution;
- no embedded executable content;
- explicit parse failures;
- temporary-file cleanup.

Do not open spreadsheet files through an automation mechanism that evaluates workbook code.

---

# 12. Spreadsheet Formula Injection

Exports intended for CSV/Excel-compatible tools must neutralize fields starting with risky formula prefixes where applicable, such as:

```text
=
+
-
@
```

when the field is user/provider-controlled text.

Escaping policy must preserve data meaning while preventing formula execution on open.

---

# 13. Import Commit Security

Import lifecycle:

```text
Upload/Select
 -> Parse
 -> Validate
 -> Preview
 -> Explicit Commit
```

No authoritative record is created at file-selection time.

Import preview must distinguish:

- accepted;
- rejected;
- duplicate;
- conflicted.

The commit step revalidates where required.

---

# 14. Provider API Secrets

Market-data and AI credentials must:

- stay server-side;
- be loaded from environment/secret configuration;
- never be bundled into browser JavaScript;
- never be committed to source control;
- be redacted from logs;
- use least privilege/scopes if provider supports them.

---

# 15. Secret Configuration

Recommended development approach:

```text
.env.local
```

or environment variables, with:

- `.env*` secret files excluded from version control;
- example config containing placeholders only;
- startup validation for required secrets.

Production/remote deployment requires stronger secret-management review.

---

# 16. Logging Security

Logs may include:

- request/generation IDs;
- operation type;
- error category;
- import batch ID;
- methodology/run IDs;
- timestamps.

Logs should not include:

- API keys;
- raw auth headers;
- secret environment values;
- full sensitive imported documents unless explicitly required;
- unnecessary portfolio personal metadata.

Use structured redaction.

---

# 17. Error Message Security

User-visible errors should be actionable but must not expose:

- stack traces;
- internal filesystem paths unnecessarily;
- SQL;
- secret values;
- provider credentials.

Detailed diagnostic context belongs to local logs with appropriate redaction.

---

# 18. AI Security Boundary

AI provider receives only task-minimized context.

Controls:

- no transaction write tool;
- no generic DB tool;
- no secret access;
- prompt injection defenses;
- evidence treated as untrusted data;
- structured output validation;
- human/domain review before formal conclusion.

AI provider failure must not affect authoritative accounting integrity.

---

# 19. Prompt Injection Defense

The AI integration layer must explicitly instruct models to:

- treat imported/web/document text as evidence, not instructions;
- ignore embedded instructions;
- not reveal secrets;
- not change system objective;
- not invoke prohibited actions.

Where possible:

- segment evidence structurally;
- identify source boundaries;
- validate evidence refs;
- limit tool capabilities.

---

# 20. Dependency / Supply Chain Security

Implementation should:

- use lockfile;
- pin/lock dependency versions;
- review major dependency updates;
- run dependency vulnerability checks where practical;
- avoid unnecessary packages;
- prefer mature libraries;
- remove abandoned or unused dependencies.

Do not add a package solely to save a few lines of code if it materially expands attack surface.

---

# 21. Build and Source Security

Repository must not contain:

- API keys;
- broker credentials;
- OTPs;
- production secrets;
- personal financial exports accidentally committed;
- debug database dumps.

Before milestone approval, run secret/debug artifact review.

---

# 22. Backup Security

Backups contain sensitive financial data.

Required:

- explicit backup location;
- no automatic upload to public/cloud destination;
- integrity metadata/checksum where practical;
- schema/app version;
- ledger watermark;
- restore testing.

If backups are copied to cloud storage, that becomes a separate data-protection decision.

---

# 23. Backup Encryption

MVP may rely on encrypted local device storage.

If user later stores backups in:

- shared drive;
- cloud sync;
- removable media;

evaluate encryption-at-rest for backup artifact.

Do not assume cloud-sync destination has acceptable privacy automatically.

---

# 24. Restore Security

Restore workflow must verify:

- expected file type;
- integrity/checksum where available;
- schema compatibility;
- application version compatibility;
- methodology registry presence.

Restore should require explicit user confirmation.

After restore:

- rebuild derived projections;
- run reconciliation;
- do not immediately permit actionable decisions if integrity checks fail.

---

# 25. Authorization Model

MVP is single-user local application.

No complex RBAC is required.

However code should not hardwire assumptions that every future remote user is an administrator.

If multi-user scope appears, authorization must be designed before implementation.

---

# 26. Authentication

MVP loopback-only deployment does not require a full login system by default.

This is based on:

- local machine user trust;
- loopback-only network binding;
- single-user scope.

If the application is intentionally exposed beyond loopback, authentication becomes mandatory.

---

# 27. Session and Cookie Security — Future Remote Deployment

If remote deployment is approved later, review at minimum:

- secure cookies;
- HttpOnly;
- SameSite;
- session rotation;
- CSRF;
- session expiry;
- password/passkey/OAuth approach;
- account recovery.

Not required for local MVP.

---

# 28. Transaction Confirmation

Before final transaction commit, confirmation UI must display at least:

- transaction type;
- security;
- quantity;
- price where applicable;
- fee/tax;
- trade/effective date;
- settlement date where applicable;
- linked decision;
- correction/reversal relationship where applicable.

The confirmation summary is not a substitute for server-side revalidation.

---

# 29. Dangerous Operations

High-risk local operations require explicit confirmation:

- transaction posting;
- transaction reversal/correction;
- committed import;
- backup restore;
- methodology activation if ever exposed;
- destructive cache reset if it could disrupt current workflow.

The system must not provide a generic “Reset Database” action in normal UI.

---

# 30. Audit Integrity

Audit records should be append-oriented.

Material records should not be editable silently after finalization:

- posted transaction;
- finalized decision;
- finalized review;
- methodology identity;
- committed import batch.

Changes use:

- new version;
- reversal;
- supersession;
- linked correction.

---

# 31. Tamper Detection — Optional Enhancement

MVP does not require cryptographic ledger chaining.

Optional future controls may include:

- content hashes;
- export manifest hashes;
- methodology content hashes;
- append-log hash chains.

Do not introduce blockchain/distributed ledger technology.

---

# 32. Security of Reconciliation

Reconciliation detects mismatch.

It must not expose a “Fix automatically” button that mutates authoritative accounting state.

Resolution routes to:

- inspect source;
- create correction;
- reverse transaction;
- re-import valid data.

---

# 33. Data Minimization

Persist only what is necessary for:

- accounting;
- analysis;
- audit;
- reproducibility;
- user workflow.

Avoid storing unnecessary:

- third-party personal data;
- credentials;
- full raw payloads indefinitely;
- browser/device telemetry.

---

# 34. Privacy

The application should treat portfolio holdings, transaction history, journal text, and investment theses as private financial data.

MVP should avoid external telemetry by default.

If analytics/telemetry are added later:

- disclose clearly;
- minimize payload;
- never send portfolio details without explicit design/approval.

---

# 35. Network Egress

Core local operation should not require network access.

External egress only occurs when explicitly using:

- market-data provider;
- AI provider;
- future approved services.

This reduces dependency and privacy risk.

---

# 36. External Provider Failure

If provider fails or is compromised:

- authoritative ledger remains intact;
- last valid observations remain preserved;
- new observations are quarantined/rejected if invalid;
- user sees provider/data warning;
- actionability may be blocked if critical data unavailable.

---

# 37. Security Testing Requirements

At minimum include tests/checks for:

## Network
- app binds loopback in MVP config;
- no accidental public bind.

## Writes
- CSRF/origin rejection where applicable;
- stale watermark rejection;
- duplicate submit/idempotency.

## Imports
- oversized file;
- too many rows;
- invalid extension/type;
- path traversal payload;
- formula injection;
- malformed workbook/CSV.

## Secrets
- browser bundle does not contain provider secrets;
- logs redact secrets.

## AI
- prompt injection attempts;
- prohibited transaction-write tool;
- secret exfiltration prompt.

## Restore
- invalid backup;
- incompatible schema;
- failed reconciliation after restore.

---

# 38. Security Acceptance Criteria

`SECURITY.md` is acceptable only if:

1. MVP is loopback-only by default;
2. no broker credentials/order execution exist;
3. authoritative writes use application/domain boundary;
4. state-changing requests are same-origin/CSRF protected;
5. stale context is revalidated before commit;
6. duplicate/replayed writes are controlled;
7. DB is not web-accessible;
8. file imports are untrusted and bounded;
9. spreadsheet formula injection is mitigated;
10. provider/AI secrets stay server-side;
11. secrets are not committed/logged;
12. AI has no ledger write authority;
13. backups are treated as sensitive;
14. restore validates compatibility/integrity;
15. finalized audit history is append-oriented;
16. external telemetry is not required for MVP;
17. provider failure cannot corrupt accounting truth;
18. dependency/security review exists;
19. remote exposure triggers separate security design;
20. no M1–M5 rule is changed.

---

# 39. Initial Multi-Role Review

## Product Manager

### Critical
0 unresolved.

### Major resolved
- Security posture remains proportional to local MVP.
- No login/RBAC overengineering before remote access exists.
- Backup/privacy implications are explicit.

**Result:** PASS.

## Software Architect

### Critical
0 unresolved.

### Major resolved
- Trust boundaries are explicit.
- Remote-access security is separated from local MVP.
- Write/revalidation/idempotency boundaries are clear.

**Result:** PASS.

## Portfolio Manager

### Critical
0 unresolved.

### Major resolved
- Security controls cannot mutate ledger silently.
- Reconciliation remains detection, not auto-fix.
- restore failure blocks actionability safely.

**Result:** PASS.

## Data Engineer

### Critical
0 unresolved.

### Major resolved
- DB/backup integrity constraints are explicit.
- file parser boundaries are bounded.
- secret/log/data-retention constraints are defined.

**Result:** PASS.

## Security Reviewer

### Critical
0 unresolved.

### Major resolved
- loopback-only default;
- same-origin/CSRF control;
- TOCTOU protection;
- idempotency;
- import attack surface;
- secret handling;
- AI injection boundary;
- backup/restore security;
- supply-chain review.

### Minor
- exact local encryption mechanism depends on target OS/environment.
- exact CSRF implementation depends on selected Next.js write primitive.

**Result:** PASS.

---

# 40. Issue Register

## Critical unresolved

**0**

## Major unresolved

**0**

## Minor / Deferred

1. exact application data directory by OS;
2. exact DB encryption decision;
3. exact CSRF implementation;
4. exact dependency scanning tool;
5. exact secret-loading mechanism;
6. exact backup encryption format if needed;
7. exact remote-auth design if remote deployment is approved;
8. exact retention periods for logs/raw provider payloads.

These are implementation/deployment concerns.

---

# 41. Approval Gate

Current state:

> **APPROVED BASELINE v1.0**

If approved:

1. promote `06_DASHBOARD/SECURITY.md` to **Approved Baseline v1.0**;
2. create/update its approved baseline artifact;
3. continue automatically to:
   **`06_DASHBOARD/TEST_STRATEGY.md`**;
4. do not move beyond `TEST_STRATEGY.md` until reviewed and approved.
