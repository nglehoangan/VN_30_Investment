"""PEC-1D evidence/decision preparation only; no provider installation or migrations."""
import datetime
import importlib.util
import json
import os
import re
import sqlite3
import subprocess
from pathlib import Path
from lib.pe4_evidence import sha, verify_seal, replay_package
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/fundamental-data-engine/evidence';OUT=E/'2026-10-23-pec1d-operational-integration-decision'
def save(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def md(n,t):(OUT/n).write_text(t.strip()+'\n')
def reference(path,needle):
 p=ROOT/path;lines=p.read_text().splitlines();line=next(i+1 for i,s in enumerate(lines) if needle in s)
 return {'path':path,'sha256':sha(p),'line':line,'matchedText':lines[line-1].strip()}
def link(r):return '['+r['path']+':'+str(r['line'])+'](../../../../'+r['path']+')'
def main():
 if (OUT/'PROTECTED_INPUT_HASHES.json').exists():raise SystemExit('Refuse baseline overwrite.')
 OUT.mkdir(exist_ok=True);(OUT/'validation').mkdir(exist_ok=True)
 spec=importlib.util.spec_from_file_location('prior_readonly_helpers',ROOT/'scripts/prepare-pec1b-evidence.py');helpers=importlib.util.module_from_spec(spec);spec.loader.exec_module(helpers);helpers.OUT=OUT
 save('PROTECTED_INPUT_HASHES.json',helpers.baseline());save('DATABASE_BASELINE.json',helpers.database())
 names=['2026-10-21-primary-publication-evidence-pe1','2026-10-22-primary-publication-evidence-pe2','2026-10-22-primary-publication-evidence-pe3','2026-10-22-primary-publication-evidence-pe4','2026-10-22-production-evidence-closure-pec1','2026-10-23-production-evidence-closure-pec2','2026-10-23-pec2-final-implementation-review','2026-10-23-pec1a-authenticated-source-authority-decision','2026-10-23-pec1b-prospective-evidence-workflow','2026-10-23-pec1c-authenticated-trusted-capture']
 save('PRIOR_EVIDENCE_VERIFICATION.json',{'seals':[verify_seal(ROOT,E/n) for n in names],'PE4Replay':replay_package(ROOT)})
 selections={
 'framework':('package.json','"next":'), 'node':('package.json','"node":'), 'loopback':('package.json','"start":'),
 'sqlite':('prisma/schema.prisma','provider = "sqlite"'), 'defaultDb':('src/infrastructure/config/database.ts','const supplied = environment.DATABASE_URL'),
 'dbAdapter':('src/infrastructure/db/client.ts','new PrismaClient'), 'dbModes':('src/infrastructure/db/client.ts','PRAGMA journal_mode'),
 'dbPrivate':('src/infrastructure/db/files.ts','stat.nlink'), 'dbCli':('scripts/database.mjs','const commands ='),
 'persistence':('app/server/persistence.ts','export async function openPersistence'), 'transactions':('src/infrastructure/repositories/workflow-artifacts.ts','this.client.$transaction'),
 'formalWrites':('src/infrastructure/repositories/fundamentals.ts','async appendImport'),
 'identityPort':('src/ports/runtime-readiness.ts','interface RuntimeReviewerIdentity'), 'reviewPort':('src/ports/runtime-readiness.ts','interface HumanReviewStore'),
 'reviewStore':('src/infrastructure/repositories/file-human-reviews.ts','Isolated append-only'), 'independence':('src/application/fundamentals/accept-runtime-dataset.ts','PRODUCER_CANNOT_SELF_ACCEPT'),
 'brokerSession':('api/tcbs.mjs','export async function getTokenSession'), 'brokerScope':('api/tcbs.mjs','TOKEN_CUSTODY_MISMATCH'),
 'confirmation':('src/infrastructure/dashboard-support.ts','const secret = randomBytes'), 'diagnosticLogs':('src/infrastructure/logging/logger.ts','Allowlist redaction'),
 'clock':('src/infrastructure/runtime.ts','export const systemClock'), 'checkedClock':('scripts/lib/pec1c_capture.py','class CheckedClock'),
 'unconfiguredCapture':('scripts/lib/pec1c_capture.py','def production_capture'), 'captureTransaction':('scripts/lib/pec1c_capture.py',"BEGIN IMMEDIATE"),
 'auditContract':('scripts/contracts/pec1c-audit.sql','CREATE TABLE'), 'backup':('scripts/backup.mjs','export function snapshotDatabase'),
 'restoreCandidate':('scripts/backup.mjs','RESTORE_CANDIDATE_VALIDATED'), 'secretExclusion':('next.config.ts','outputFileTracingExcludes'),
 'envExample':('.env.example','Optional DATABASE_URL'), 'gitExclusion':('.gitignore','.env*')}
 refs={k:reference(*v) for k,v in selections.items()};save('INFRASTRUCTURE_REFERENCES.json',{'baseCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'references':refs})
 # Inventory names/presence only, never credentials, token contents or environment values.
 pattern=re.compile(r'^(?:AUTH0_|OIDC_|NEXTAUTH_|AUTH_SECRET$|AUTH_URL$|CLERK_|AZURE_AD_|COGNITO_)')
 cfg={'processIdentitySettingNames':[k for k in os.environ if pattern.match(k)],'files':[],'secretValuesRetainedOrEmitted':False,'limits':'Names/presence inspection is not deployed-process or external-provider attestation; no private values retained.'}
 for rel in ['.env.local','api/.env.local']:
  p=ROOT/rel;names=[]
  if p.is_file():
   for line in p.read_text().splitlines():
    m=re.match(r'\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=',line)
    if m:names.append(m[1])
  cfg['files'].append({'path':rel,'exists':p.is_file(),'identitySettingNames':[k for k in names if pattern.match(k)],'databaseUrlKeyPresent':'DATABASE_URL' in names,'credentialValuesRetained':False})
 save('CONFIGURATION_PRESENCE.json',cfg)
 with sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro',uri=True) as db:
  tables=[r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
  migrations=[{'name':r[0],'checksum':r[1],'finished':r[2] is not None,'rolledBack':r[3] is not None} for r in db.execute('SELECT migration_name,checksum,finished_at,rolled_back_at FROM _prisma_migrations ORDER BY migration_name')]
 stat=(ROOT/'data/vn30.sqlite').stat()
 save('DATABASE_TARGET_ASSESSMENT.json',{'inspectedDatabase':'data/vn30.sqlite','mode':'READ_ONLY','tableNames':tables,'tableCount':len(tables),'migrationRecords':migrations,'identityTablesMatchingNames':[n for n in tables if re.search(r'(?:^|_)(user|session|role|permission|identity)(?:_|$)',n,re.I)],'formalKnowledgeAuditInstalled':'formal_knowledge_audit' in tables,'fileMode':oct(stat.st_mode&0o777),'ownedByCurrentOSUser':stat.st_uid==os.getuid(),'parentMode':oct((ROOT/'data').stat().st_mode&0o777),'configuredLiveProcessDatabaseAttested':False,'accountableDatabaseOwnerConfirmed':False,'interpretation':'Verified retained local database and repository default; not proof of the active deployed production target or authorization to migrate. File OS ownership does not authenticate Investment System Owner.'})
 save('PUBLIC_REFERENCE_CHECKS.json',{'checkedOn':'2026-10-23','classification':'PUBLIC_DOCUMENTATION_NOT_PROVIDER_APPROVAL_OR_CONFIGURED_TENANT','sources':[{'title':'OpenID Connect Core ID Token Validation','url':'https://openid.net/specs/openid-connect-core-1_0-18.html#IDTokenValidation'},{'title':'Auth0 session management and plan requirements','url':'https://auth0.com/docs/manage-users/sessions/manage-user-sessions-with-auth0-management-api'},{'title':'Auth0 log retention','url':'https://auth0.com/docs/deploy-monitor/logs/log-data-retention'},{'title':'Auth0 pricing','url':'https://auth0.com/pricing'}],'limitations':'Reviewed live primary docs; no immutable vendor-page capture or actual tenant entitlement is claimed. Costs/plan availability must be reconfirmed before approval.'})
 md('INFRASTRUCTURE_ASSESSMENT.md',f'''# Verified application infrastructure

Status: **OWNER_ARCHITECTURE_DECISION_REQUIRED**. No provider, production executor, deployment ownership or migration authorization is established. Repository facts and runtime assumptions are separated below.

| Area | Verified repository fact | Exact reference |
|---|---|---|
| Framework | Next.js 16.3.4, React 19.3.0, TypeScript; pinned Node >=22.23.2 <23 | {link(refs['framework'])}; {link(refs['node'])} |
| Deployment declaration | Next dev/start bind 127.0.0.1; default single-user local app | {link(refs['loopback'])}; README.md:84 |
| Authentication | RuntimeReviewerIdentity is a subject/session/three-role port; no concrete app provider configured | {link(refs['identityPort'])}; CONFIGURATION_PRESENCE.json |
| User/session/roles | No app User/Session/Role/Permission models or corresponding inspected DB tables; seven PEC-1C permissions remain unassigned | prisma/schema.prisma; DATABASE_TARGET_ASSESSMENT.json |
| Broker authentication | TCBS private JWT/OTP session authenticates broker account access, not app owner/reviewer permissions | {link(refs['brokerSession'])}; {link(refs['brokerScope'])} |
| UI confirmation | Process-random HMAC key seals transaction confirmation payloads; no named subject/session or durable identity audit | {link(refs['confirmation'])} |
| DB default | Private local SQLite at data/vn30.sqlite; absolute local file override allowed; no remote DB URL | {link(refs['sqlite'])}; {link(refs['defaultDb'])} |
| DB connections | Prisma 7.10.0 with better-sqlite3; foreign keys/recursive triggers, DELETE journal and bounded busy timeout | {link(refs['dbAdapter'])}; {link(refs['dbModes'])} |
| DB lifecycle | Explicit open/close persistence and migration CLI, no automatic startup migration | {link(refs['persistence'])}; {link(refs['dbCli'])} |
| Transactions | Existing Prisma transaction composition and fundamental import transaction | {link(refs['transactions'])}; {link(refs['formalWrites'])} |
| Review/audit | FileHumanReviews is isolated staging; portfolio workflow audit is a different business domain | {link(refs['reviewStore'])}; prisma/schema.prisma |
| Operational logging | Allowlisted redacted diagnostics, not independently retained authentication audit | {link(refs['diagnosticLogs'])} |
| Secrets/config | .env.local loading; ignored env/live data; runtime tracing excludes local data/secrets. No managed secrets service identified | {link(refs['envExample'])}; {link(refs['gitExclusion'])}; {link(refs['secretExclusion'])} |
| Clock | System Date UTC; PEC-1C adds monotonic/persisted-order checks. No external UTC health attestation configured | {link(refs['clock'])}; {link(refs['checkedClock'])} |
| Backup | VACUUM INTO, checksummed manifest, isolated restore candidate without automatic activation | {link(refs['backup'])}; {link(refs['restoreCandidate'])} |

INFRASTRUCTURE_REFERENCES.json pins exact bytes and line references. DATABASE_TARGET_ASSESSMENT.json lists read-only table/migration facts, file modes and OS ownership; these do not identify an accountable production owner or attest an active server's DATABASE_URL. No remote deployment manifest was identified in the inspected non-vendor tree; absence from this tree does not rule out external infrastructure. No private token, API key or password value is emitted or retained in the packet.

The verified local SQLite target is suitable for evaluating an additive integration; active production deployment, database ownership, off-device backup, identity tenancy and independent operator access still require owner confirmation. No provider is inferred from TCBS login or a generic interface. No OS username is promoted to Investment System Owner.
''')
 md('IDENTITY_PROVIDER_DECISION.md','''# Identity provider architecture decision

**Recommendation: reuse an already approved organizational OIDC provider if the owner can identify one (A). Otherwise approve architecture B: an established managed OpenID Connect provider with server-controlled application sessions and exact scoped grants. Vendor/tenant selection remains a separate explicit approval; no new provider is installed.**

No usable approved application provider was found in repository composition. Existing TCBS authentication and transaction HMAC confirmations are outside the required owner/reviewer identity trust domain. Option A is currently unavailable as verified implementation; it can be reopened by supplying actual approved issuer/tenant and entitlement evidence.

| Criterion | A Existing approved organizational provider | B Established managed OIDC provider | C Owner-controlled local authentication |
|---|---|---|---|
| Security | Reuse verified identity lifecycle if this application is actually authorized | Mature provider verification + MFA; app still owns session/grant controls | Can fit loopback, but OS login/shared local account alone is insufficient; per-person authenticators and recovery design needed |
| Complexity | Lowest if a suitable tenant/integration already exists | Moderate application integration; no new self-hosted IdP service | Fewer external services but substantial credential enrollment, session, revocation, recovery and audit code |
| Cost | Existing license may cover it; entitlement/usage unverified | Recurring plan/API/log-export costs; no free-tier sufficiency assumed | No provider subscription, but security engineering, device/recovery and independent audit costs |
| Maintainability | Existing tenant administration plus app adapter | Provider lifecycle maintained externally; SDK/key rotation and app controls remain ours | Application owner maintains authentication/keys and recovery lifecycle |
| Auditability | Must export exact authentication/grant decisions beyond vendor retention | Durable audit export/independent anchoring required; standard login logs may be delayed | Independent evidence store/key custody required; same OS user's writable logs are insufficient |
| Revocation | Verify online session/role/subject invalidation and app session kill | Explicit app session/grant ledger plus provider revocation/back-channel/current lookup, fail closed if unknown | Local revocation ledger/key expiry/recovery must be designed and independently controlled |
| Separation of duties | Named distinct producer/validator accounts and scoped grants | Same, with explicit seven-role policy; no automatic owner grant | Requires distinct named people/keys and independent validation access; single shared account fails |
| Decision | First choice ONLY if an approved tenant can be evidenced | Recommended fallback architecture, pending owner/vendor decision | Not recommended as a shortcut to formal authority; consider only after deployment/reviewer workflow is confirmed |

## Concrete minimum B proposal

Keep the existing loopback Next application and SQLite. Add no hosted application deployment, new database service, broker-login reuse or self-hosted identity service. After approval, use server-side Authorization Code/OIDC validation, state/nonce and PKCE, an opaque HttpOnly application session with explicit revocation, and server-controlled exact operation/subject/version/scope grants. Distinct producer/validator identities are mandatory. Preserve seven PEC-1C permissions separately from provider display roles. Authorize each write against current session/subject/role state; a cached role-bearing JWT alone is insufficient. Plan the session/grant schema under the existing Prisma migration owner, not in an unrelated shadow database.

These validation requirements follow [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0-18.html#IDTokenValidation): check trusted issuer, audience, signing verification, expiry and nonce, including authorized-party rules where applicable. PKCE does not replace those checks or application authorization.

Auth0 was screened as an established managed-provider example, **not selected**. Its documented [session inspection/deletion endpoints](https://auth0.com/docs/manage-users/sessions/manage-user-sessions-with-auth0-management-api) require an Enterprise plan; do not assume a low-cost tenant supplies the needed online session control. Its [log retention](https://auth0.com/docs/deploy-monitor/logs/log-data-retention) is plan-dependent and logs may be delayed. The [pricing page](https://auth0.com/pricing) must be checked against exact required capabilities before any purchase. No price quote, tenant entitlement or sufficient free plan is asserted. This constraint is why architecture approval must not silently become approval to buy an arbitrary vendor plan.

## Decision gate

D1: identify an existing approved provider/tenant, or approve B and name the managed provider/tenant, allowed costs and required revocation/audit capabilities. C needs explicit approval of a new local security design and distinct reviewer identities. Provider configuration/registration, SDK installation, accounts/roles, secrets, migrations, live capture and operational integration are **not authorized by this recommendation**. No authenticated owner decision is recorded in this package.
''')
 md('AUTHENTICATION_ADAPTER.md','''# Authentication adapter preparation

**Operational authentication: BLOCKED. No provider-specific implementation is installed.** This is reviewed preparation at the explicit architecture gate, not a mock adapter reported as real integration.

Preserve PEC-1C IdentityAuthority.resolve / authorize / authorize_saved and VerifiedSession contracts. The future server-only adapter must bind issuer/subject, expected audience/client identity, provider session and actual authentication/audit references to the original exact operation request. Invalid credentials, unknown keys, algorithm substitution, missing assurance, expired session or unknown current invalidation must deny access. Signature decoding alone is not verification. Never accept a client-selected issuer/JWKS URL, role, actorId, producer list, cutoff or clock.

After an actual tenant/client is approved: allowlist issuer/discovery/JWKS and algorithms; verify token signature and token type, issuer/audience/azp/nonce/expiry; protect authorization-code state, PKCE and redirect registration. ID tokens establish login only and are not generic API authorization tokens. Use opaque server-side app sessions with CSRF protection and appropriate cookie/origin controls for the approved local deployment. Do not assume secure-cookie/callback settings without verifying actual browser/origin behavior. Pin a maintained Next-compatible integration only after provider approval, following this repository's installed Next docs.

resolve obtains independently verified identity/session/audit evidence, not broker custody claims. authorize resolves current server-controlled session/subject/grant revocation and exact scope; authorize_saved verifies original audit evidence and current invalidation when replaying immutable events. App session expiry/revocation and provider session/role invalidation are different layers: deleting a browser cookie or waiting for JWT expiry is insufficient. Store credentials server-side in an approved secret facility/private config; no secret in browser bundles, logs, source, reports or test fixtures.

RuntimeReviewerIdentity can be adapted from the same verified server session for TypeScript review use. PEC-1C is Python while actual Prisma repositories are TypeScript: select the transaction-owning runtime before wiring capture. An HTTP identity assertion or Python audit call outside a Prisma transaction cannot be called atomic business/audit persistence. Avoid a new service merely to bridge the languages.

Required before code: authenticated architecture decision, actual issuer/client/audience/redirects, verification and revocation capability/entitlements, named grants, audit retention, secret custodian, deployment origin and transaction owner. Provider decisions remain null. Existing production_capture is unconfigured and rejects all captures and formal-boundary resolutions.
''')
 md('DATABASE_INTEGRATION.md','''# Production database integration decision

Verified target: retained local data/vn30.sqlite, inspected read-only. Its tables, migration checksums, OS ownership/modes and missing formal_knowledge_audit table are recorded in DATABASE_TARGET_ASSESSMENT.json. This is not an attestation of an active deployed production database or confirmation of the accountable database owner. No production migration is executed.

## Reuse and transaction decision

Actual app persistence is Prisma/better-sqlite3 through app/server/persistence.ts and existing repository transactions. PEC-1C uses Python sqlite3 and supplies scripts/contracts/pec1c-audit.sql as a tested installation contract, not an installed Prisma migration. Two connections, two processes or a Python audit call from inside an unrelated Prisma transaction do NOT share one atomic transaction.

Recommended for this Next application: let the existing TypeScript/Prisma transaction composition own BOTH the formal business operation and audit row. Prepare an additive Prisma model/migration and a transaction-bound capture adapter ONLY after D1/D2 approval. Preserve PEC-1C's exact request/authorization/evidence/clock/hash/chain semantics and test cross-runtime canonical JSON/hash parity before using old Python receipts as reference. Do not create a separate audit database or invent portfolio workflow records to fit existing audit FKs. No such port/model/migration is installed here because the runtime/database ownership decision is not confirmed.

Alternative Python-owned offline executor is acceptable only if the owner explicitly designates it as the sole writer for a bounded newly authorized operation and it implements the actual formal business writes on the SAME connection. Current generic FixtureExecutor cannot be connected to production. No adapter may commit independently or perform irreversible external IO while claiming SQLite atomicity.

## Required migration/recovery authorization

D2 must confirm the real target, responsible operator, deployment/transaction runtime and operation scope. D3 must separately authorize a specific reviewed additive migration with before/after schema hashes, checksum, tested backup/restore candidate, concurrency/rollback results and operator/time. Architecture approval does not authorize production DDL. Existing PEC-1C SQL is reusable design input, not permission to execute it.

After those decisions: rehearse against an isolated representative restored DB; verify event identity/idempotency, exact-head CAS, no UPDATE/DELETE/REPLACE, same-transaction operation+audit rollback, evidence bytes, foreign keys and current revocation. Verify Prisma/client/generated code and backup manifest compatibility. Current backup inspector has generic body/body_hash assumptions; test any new audit table's BLOB/body structure explicitly instead of assuming old restore checks validate its cryptographic/authentication semantics.

A migration is never used to create historical events, backfill preparation clocks, approve sources or activate scoring. Keep existing database and old sealed evidence unchanged throughout preparation.
''')
 md('AUDIT_AND_CLOCK_ASSURANCE.md','''# Operational clock, audit anchoring and recovery assurance

## Current verified limits

SystemClock uses server Date; PEC-1C CheckedClock compares UTC/monotonic progression and persisted recordedAt. This detects defined local anomalies, not external UTC accuracy, privileged database replacement, a restored valid prefix or an off-device durable audit. SQLite triggers and SHA-256 do not establish absolute tamper resistance.

An isolated PEC-1D diagnostic restores an earlier valid SQLite prefix after a second synthetic event. PEC-1C replay accepts that internally valid earlier prefix when no independent anchor is supplied. This **reproduces an expected external-anchor dependency**; rollback-attack prevention is BLOCKED, not passed or fixed. The default production boundary still denies use because no provider/executor is configured. Do not deploy operational capture on the assumption that local replay detects this attack.

## Required operational clock contract (specified, not configured)

Owner selects trusted host/runtime, UTC synchronization source and health monitor. Capture should require recent healthy synchronization evidence (observed offset/uncertainty, last successful sync, boot identity), use monotonic progression during execution, compare persisted audit boundaries on restart and reject stale/unknown health, backward jumps or disallowed drift. Rebase after restart only against verified durable state; no caller-supplied recordedAt. Record actual operation completion, pre-insert recording decision, applicability and conservative knownAt separately. No approved numeric offset/freshness/SLA is invented here; D4 must approve measured bounds and failure behavior. Clock health never proves historical publication or source availability.

## External anchor contract (specified, not configured)

Anchor must live outside the application host/primary database failure domain, with separate custody and a write-once/versioned append policy the application cannot rewrite/delete. A local adjacent checksum, Git commit or a file controlled by the same OS account is insufficient. Anchor binds deployment/database identity, schema/migration version, monotonically ordered anchor sequence, every relevant stream head/event count, prior anchor hash, latest capture knownAt, provider authentication/revocation policy versions and independent receipt/signature identity. Verify the actual external authority and current receipt, not only a copied hash.

SQLite business+audit capture remains locally atomic. External anchoring is a separate durability/qualification step: a committed but unanchored event must not supply qualified formal knowledge or production admission. No claim of distributed atomicity is made. Define retry/idempotent anchoring, orphan/pending handling and a deny-on-missing/stale acknowledgement rule. An external anchor outage blocks qualification; it does not authorize fallback to local history. D4 must choose actual custody/store, privileges, retention and outage bounds before implementation.

## Backup and restore protocol

Reuse existing VACUUM INTO + manifest + isolated restore-candidate tooling, preserving private paths and no automatic activation. Owner must confirm off-device durable location, encryption/key recovery, retention, RPO/RTO and independent custodian; current local snapshot capability is not evidence those controls exist.

Restore verification must obtain the latest independently retained trusted anchor before opening the candidate for writes. Check source snapshot checksum, migrations/schema, SQL/foreign-key integrity, exact audit heads/counts/chains/evidence, original authentication proofs and CURRENT revocations. A database missing an externally anchored event, with changed identity or an unknown anchor is quarantined. Newer unanchored records require explicit reconciliation/independent review; never reset the external anchor to make an old DB pass. Reconcile legitimate later business operations and record the actual recovery decision/drill. No production restore or anchor bootstrap occurs here.

Operational independent validation requires a named producer-distinct human to review live provider grants/revocation, actual migration rehearsal, clock evidence, off-device anchor acknowledgement and stale-prefix restore rejection. Existing synthetic tests and this report are not that acceptance.
''')
 save('OPERATIONAL_BLOCKERS.json',{'status':'OWNER_ARCHITECTURE_DECISION_REQUIRED','architectureApproved':False,'providerSelected':None,'authenticatedOwnerDecision':None,'blockers':[{'id':'D1_IDENTITY_ARCHITECTURE_PROVIDER','status':'OWNER_DECISION_REQUIRED','role':'Investment System Owner + security administrator','requiredAction':'Identify an existing approved OIDC tenant or approve managed OIDC architecture and a named provider/tenant/entitlements. C requires separately approved local credential/reviewer security design.'},{'id':'D2_DATABASE_DEPLOYMENT_EXECUTOR_OWNER','status':'OWNER_CONFIRMATION_REQUIRED','role':'Database owner + production engineer','requiredAction':'Attest actual runtime/target database, operator and same-transaction writer runtime; recommended Next/Prisma-owned audit and business transaction. OS file ownership is insufficient.'},{'id':'D3_PRODUCTION_MIGRATION','status':'NOT_AUTHORIZED_NOT_EXECUTED','role':'Accountable database owner','requiredAction':'After D1/D2, review a concrete additive model/migration and isolated recovery rehearsal; separately authorize exact production execution. No current package grants this authorization.'},{'id':'D4_CLOCK_ANCHOR_BACKUP','status':'EXTERNAL_CONTROL_DECISION_REQUIRED','role':'Production/security owner + independent audit custodian','requiredAction':'Choose measured UTC health bounds, separately controlled off-device append-only anchor and durable backup/restore policies; require anchor acknowledgement before qualification.'},{'id':'D5_OPERATIONAL_INDEPENDENT_ACCEPTANCE','status':'BLOCKED_PREREQUISITES_MISSING','role':'Named Independent Validator distinct from all producers','requiredAction':'Validate actual configured provider/signature/issuer/audience/current revocation, business+audit transaction, approved migration rehearsal, clock and anchored restore-rejection evidence. Synthetic tests do not close this.'}],'noProviderOrSDKInstalled':True,'noNewProductionAdapterOrMigration':True,'realProviderIntegrationTests':'NOT_RUN_NO_APPROVED_CONFIGURED_PROVIDER','invalidSignatureWrongIssuerAudienceTests':'NOT_RUN_NO_ADAPTER','restoreAttackPrevention':'BLOCKED_VALID_PREFIX_LIMITATION_REPRODUCED','ownerSourceApprovalsCreated':0,'effectiveAdmissions':0,'D2Activated':False,'productionScoringActivated':False,'PEC1EStarted':False,'PEC3Started':False})
 md('OWNER_DECISIONS_REQUIRED.md','''# Owner architecture and operational decisions required

**Decision gate: no new provider is selected/installed and no production migration or capture adapter is wired.** This follows PEC-1D Task 2: “If choosing a new provider or changing security architecture requires owner approval, stop at an explicit decision gate.” Task 4 separately prohibits production migrations without explicit authorization. No independent skill or automatic approval rejection created this gate.

## D1 — choose the identity path

Recommended: A if you can name an already approved organizational OIDC issuer/tenant with the required capabilities; otherwise B, managed OIDC plus server-controlled revocable app sessions and exact scoped grants. C requires a separate explicitly approved local per-person authentication/recovery/audit design; OS login, TCBS JWT and HMAC confirmations do not satisfy it.

Required response: choose A/B/C; name the exact provider/tenant or request a specific vendor shortlist; confirm approved identity/security administrator, budget/required revocation and audit entitlements, intended local deployment/reviewer access and allowed client registration/origin. Auth0 was screened, not selected; session-control entitlements must be verified before purchase. Supply no secret, API key, OTP, password or private signing key in a decision response. Approval of a vendor-neutral pattern alone does not authorize registration/purchase of an unnamed vendor.

Owner decision: **NOT SUPPLIED**. Provider/issuer/client/audience: **NOT SUPPLIED**. Authenticated decision reference and actual decision time: **NOT SUPPLIED**. No local document field or recommendation manufactures authentication.

## D2 — confirm deployment and transaction ownership

Confirm that inspected data/vn30.sqlite is the intended target or name the actual deployed target through secure operator configuration. Identify accountable database owner, operator, host/runtime and independent reviewer. Decide Next/Prisma-owned business+audit transaction (recommended for the actual app) versus an explicitly bounded Python-owned offline writer. Two connections are not atomic. A local filesystem UID is not production ownership authorization.

Confirmation/decision: **NOT SUPPLIED**. This is not permission to connect or migrate a newly named target automatically.

## D3 — authorize a concrete migration later

Not requested for execution now: no approved target/runtime/provider integration exists. After D1/D2, prepare a specific additive migration with schema/checksum, exact operation adapter, isolated representative restore rehearsal and forward/recovery plan. Production execution requires a separate explicit target/operator/migration authorization. Current PEC-1C SQL must not be applied merely because architecture is approved.

Production migration authorization: **NOT SUPPLIED; nothing executed**.

## D4 — clock, independent audit custody and recovery

Name trusted UTC health owner and approve measured offset/freshness/rollback behavior; choose separately controlled off-device audit-head retention, credentials/custodian, anchor acknowledgement and outage policy. Confirm durable backup destination, encryption/key recovery, retention, RPO/RTO and restore-quarantine/acceptance. Do not invent a new managed storage service or treat same-host files as independent anchors.

Control/operational decision: **NOT SUPPLIED**.

## D5 — operational independent validation

Assign a real producer-distinct validator and require exact configured provider/session/grant/signature/issuer/audience results, transaction/migration rehearsal, clock health and external-anchor rollback-restore rejection. This occurs only after D1–D4 prerequisites exist. Codex does not self-approve operational acceptance.

Assignment/acceptance: **NOT SUPPLIED**.

None of these decisions approves a source candidate, backdates knowledge, completes financial mapping/perimeter/knowledge/cutoff gates, admits data, activates D2 or scoring, or starts PEC-1E/PEC-3. Eight candidates remain DEFERRED. Stop at this reviewable package and await D1/D2 before provider/runtime implementation.
''')
 md('CLOSURE_REPORT.md','''# PEC-1D closure report

**Final status: OWNER_ARCHITECTURE_DECISION_REQUIRED. PEC-1D is not approved.**

Verified actual Next/React/TypeScript loopback configuration, SQLite/Prisma persistence and transaction conventions, isolated human-review staging, broker authentication versus application identity, private configuration/logging and local backup/restore tooling. No approved application IdP, app user/session store, accountable production target/operator, external UTC attestation or independently retained audit anchor was established.

## Architecture and implementation disposition

Recommend A only with evidence of an existing approved organizational OIDC provider; otherwise B, an established managed OIDC provider with server-controlled app sessions and exact revocable scoped grants. No vendor is selected. Auth0 was screened and its session-management entitlement constraint prevents an unverified free-plan assumption. Local authentication C has no subscription dependency but adds credential/recovery/independent-review security responsibilities and requires explicit approval.

The explicit owner decision gate prevents installation, provider-specific adapter implementation, role/account creation, secret changes, new production migration or executor wiring. Existing PEC-1C implementation is reused unchanged. New code is limited to evidence preparation, read-only safety verification and isolated boundary/restore diagnostics. Actual provider integration, signature/issuer/audience verification and deployed independent validation remain BLOCKED/NOT RUN, not silently counted as passing tests.

## Important restore finding

The isolated valid-prefix restore diagnostic reproduces the known unanchored limitation: local hashes/triggers and a synthetic authenticated replay do not detect restoration of an older internally valid prefix. This is not reported as successful rollback-attack prevention. An external trusted head with independent custody and deny-before-qualification behavior is required. No existing gate is weakened or enabled to hide that dependency.

## Safety and acceptance

SECURITY_VALIDATION_RESULTS.json records exact commands/results, synthetic versus integration coverage and missing operational tests. The safety verifier rehashes protected inputs, database bytes/logical dump/counts/approvals, ten prior package seals and unchanged original candidate evaluations. No production DDL, new identity, owner approval, effective admission, D2/scoring activation or source acquisition occurs. No frozen policy changes; no PEC-1E or PEC-3 work.

## Deliverables

- [Infrastructure assessment](INFRASTRUCTURE_ASSESSMENT.md)
- [Identity architecture comparison/recommendation](IDENTITY_PROVIDER_DECISION.md)
- [Adapter preparation and unmet prerequisites](AUTHENTICATION_ADAPTER.md)
- [Database ownership/transaction integration](DATABASE_INTEGRATION.md)
- [Clock, anchors and recovery](AUDIT_AND_CLOCK_ASSURANCE.md)
- [Security validation results](SECURITY_VALIDATION_RESULTS.json)
- [Operational blockers](OPERATIONAL_BLOCKERS.json)
- [Exact owner decisions required](OWNER_DECISIONS_REQUIRED.md)

The next necessary action is D1/D2, not another generic implementation review. Package SHA-256 sealing demonstrates integrity only, not owner authentication or independent operational acceptance. Stop after PEC-1D.
''')
 print('PEC-1D decision package prepared; explicit architecture gate preserved.')

if __name__=='__main__':main()
