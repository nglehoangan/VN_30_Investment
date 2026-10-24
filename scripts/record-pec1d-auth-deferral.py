"""Record the owner-authorized documentation amendment; no runtime or DB writes."""
import argparse
import datetime
import importlib.util
import json
from pathlib import Path
from lib.pe4_evidence import sha, digest, verify_seal, replay_package
from lib.pec1b_workflow import pec2_preparation_boundary
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'docs/fundamental-data-engine/evidence';OUT=E/'2026-10-24-pec1d-authentication-deferral-amendment'
ADR=ROOT/'docs/adr/0005-local-authentication-deferral.md'
CURRENT=ROOT/'docs/fundamental-data-engine/PEC1D_CURRENT_DECISION.md'
def read(p):return json.loads(p.read_text())
def save(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def md(n,t):(OUT/n).write_text(t.strip()+'\n')
def require(ok,reason):
 if not ok:raise ValueError(reason)
def helpers():
 spec=importlib.util.spec_from_file_location('prior_readonly_helpers',ROOT/'scripts/prepare-pec1b-evidence.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.OUT=OUT;return m

def prepare():
 require(not (OUT/'PROTECTED_INPUT_HASHES.json').exists(),'BASELINE_ALREADY_EXISTS')
 require(not ADR.exists() and not CURRENT.exists(),'CURRENT_DECISION_DOCUMENT_EXISTS_REVIEW_BEFORE_OVERWRITE')
 OUT.mkdir(exist_ok=True);(OUT/'validation').mkdir(exist_ok=True)
 h=helpers();save('PROTECTED_INPUT_HASHES.json',h.baseline());save('DATABASE_BASELINE.json',h.database())
 previous=E/'2026-10-23-pec1d-operational-integration-decision'
 packages=[ROOT/r['package'] for r in read(previous/'PRIOR_EVIDENCE_VERIFICATION.json')['seals']]+[previous]
 save('PRIOR_SEAL_VERIFICATION.json',[verify_seal(ROOT,p) for p in packages])
 save('OWNER_DEFERRAL_INSTRUCTION.json',{'instructionSource':'User message in this conversation: PEC-1D — Authentication Deferral Amendment','recordKind':'ARCHITECTURE_SCOPE_INSTRUCTION_NOT_AUTHENTICATED_SOURCE_AUTHORITY_OR_ACCEPTANCE','documentDate':'2026-10-24','localDeployment':'Personal Mac; local application','authenticationImplementation':'DEFERRED_BY_OWNER','googleOIDCImplementation':'DEFERRED_BY_OWNER','newLoginOrSessionImplementationAuthorized':False,'sourceApprovalAuthorized':False,'independentAcceptanceAuthorized':False,'databaseMigrationAuthorized':False,'scoringActivationAuthorized':False,'authenticatedActorOrSessionCreated':False,'meaning':'The current user instruction authorizes this architecture documentation amendment. This locally written record is not a substitute for an authenticated source approval, independent acceptance, formal event or admission receipt.'})
 md('ARCHITECTURE_DECISION_AMENDMENT.md','''# PEC-1D authentication deferral amendment

Date: 2026-10-24. **Current architecture decision: AUTHENTICATION DEFERRED_BY_OWNER. Amendment ready for owner review; PEC-1D is not marked approved.**

The owner now specifies a local application on a personal Mac, with no login/authentication implementation at this stage. Google OIDC implementation is DEFERRED_BY_OWNER; any identity integration may be considered only in a future separately authorized milestone. Preserve the current Next.js, Prisma and SQLite architecture and loopback deployment configuration.

This supersedes PEC-1D's immediate request to choose/install a managed OIDC provider and its current-login architecture decision gate. It does not select another provider or authorize owner-controlled local authentication. No OS username, local JSON, unsigned record, HMAC confirmation, broker token or Codex output becomes authenticated identity or authority.

## Local operation and formal authority remain separate

Ordinary local portfolio viewing, retained artifact inspection and analysis can continue under their existing data validity, accounting, market-freshness and actionability rules. Deferred login is not an additional prerequisite or global blocker for those functions. Empty/missing/corrupt data and existing domain safety gates still retain their original behavior. No change to existing write/confirmation controls or investment logic is authorized by deferring login.

Authenticated owner source approval, formal knowledge events, independent acceptance, production admission and scoring activation continue to require their existing evidence/authorization. Those operations remain BLOCKED while authenticated infrastructure is absent. A local user can view a retained artifact without that artifact becoming an approved source or a new production score. No role grants or synthetic approvals are created.

PEC-1C identity/authorization/capture contracts and PEC-1B/PEC-2 fail-closed boundaries remain unchanged for future integration. Historical preparation timestamps remain non-authoritative. Clock/anchor/restore limitations remain unresolved prerequisites for any future formal evidence workflow; they do not impose a new login gate on local viewing.

## Historical evidence

The sealed 2026-10-23 PEC-1D package remains immutable audit history. This versioned amendment and docs/adr/0005-local-authentication-deferral.md define the current documentation decision; docs/fundamental-data-engine/PEC1D_CURRENT_DECISION.md points here. No old seal or owner/source decision is rewritten.

No provider/library installation, login screen, session store, identity assignment, database migration, D2/scoring activation, PEC-1E or PEC-3 work is performed. Stop after this amendment and await owner review.
''')
 save('AUTHENTICATION_DEFERRAL_STATUS.json',{'status':'DEFERRED_BY_OWNER','googleOIDC':'DEFERRED_BY_OWNER','applicationLogin':'NOT_IMPLEMENTED_NOT_REQUIRED_FOR_CURRENT_LOCAL_VIEWING','deployment':'LOCAL_PERSONAL_MAC','identityProviderSelected':None,'identityOrRoleAssignmentsCreated':0,'loginScreensCreated':0,'sessionsCreated':0,'authenticationLibrariesInstalled':0,'PEC1CContracts':'PRESERVED_UNCHANGED_FOR_FUTURE_INTEGRATION','ordinaryLocalViewing':'NO_NEW_LOGIN_GATE; EXISTING_DATA_AND_ACTIONABILITY_GATES_APPLY','authenticatedSourceAuthority':'BLOCKED_AUTHENTICATION_REQUIREMENTS_UNSATISFIED','independentAcceptance':'BLOCKED_AUTHENTICATION_REQUIREMENTS_UNSATISFIED','productionAdmission':'BLOCKED_EXISTING_GATES_UNCHANGED','scoringActivation':'BLOCKED_NOT_EXECUTED'})
 save('OPERATIONAL_BLOCKERS.json',{'amendmentStatus':'READY_FOR_OWNER_REVIEW','authenticationDecision':'DEFERRED_BY_OWNER','googleOIDCImplementation':'DEFERRED_BY_OWNER','supersedesImmediateProviderSelectionGate':True,'blockers':[{'id':'D1_IDENTITY_ARCHITECTURE_PROVIDER','status':'DEFERRED_BY_OWNER','blocksCurrentLocalViewing':False,'meaning':'Do not choose/install Google OIDC or another login provider now. Reopen only under a future separately authorized scope.'},{'id':'AUTHENTICATED_SOURCE_AUTHORITY','status':'BLOCKED','blocksCurrentLocalViewing':False,'meaning':'Real authenticated owner source approval remains mandatory. Local JSON, OS identity, broker credentials and Codex output cannot replace it.'},{'id':'OPERATIONAL_INDEPENDENT_ACCEPTANCE','status':'BLOCKED','blocksCurrentLocalViewing':False,'meaning':'Requires authenticated producer-distinct reviewer and exact evidence acceptance. No acceptance created.'},{'id':'FORMAL_KNOWLEDGE_AND_DATASET_CUTOFFS','status':'BLOCKED','blocksCurrentLocalViewing':False,'meaning':'Mandatory formal events and actual cutoffs remain absent; no historical clock backfill or AS_KNOWN promotion.'},{'id':'DATABASE_EXECUTOR_AND_MIGRATION','status':'FUTURE_FORMAL_WORKFLOW_PREREQUISITE_NOT_AUTHORIZED','blocksCurrentLocalViewing':False,'meaning':'Existing Next/Prisma/SQLite local operation remains. No production migration or new executor integration now.'},{'id':'TRUSTED_CLOCK_EXTERNAL_ANCHOR_RESTORE','status':'UNRESOLVED_FUTURE_FORMAL_WORKFLOW_PREREQUISITE','blocksCurrentLocalViewing':False,'meaning':'Valid-prefix rollback limitation and operational clock/audit controls are not declared solved by login deferral.'},{'id':'PRODUCTION_ADMISSION_D2_SCORING','status':'BLOCKED_NOT_ACTIVATED','blocksCurrentLocalViewing':False,'meaning':'All existing source, mapping, knowledge, independent acceptance, owner and activation gates remain separate and mandatory.'}],'candidateStates':{'DEFERRED':8},'newAuthenticatedApprovals':0,'effectiveAdmissions':0,'D2Activated':False,'scoringActivated':False,'PEC1EStarted':False,'PEC3Started':False})
 md('IMPLEMENTATION_ROADMAP.md','''# Amended implementation roadmap

## Current authorized scope

Run locally on the personal Mac using existing Next.js/Prisma/SQLite and current loopback settings. Keep ordinary portfolio/retained-data viewing and analysis available under existing integrity/freshness/actionability rules. No login, Google OIDC, new sessions, identity assignment, authentication dependencies or migrations. No runtime code change is needed because the current local read/view composition has no login prerequisite.

## Deferred work

Google OIDC and all application authentication implementation: **DEFERRED_BY_OWNER**. The previous immediate provider-selection request is superseded; no provider decision is required just to continue current local viewing. Preserve PEC-1C contracts as dormant integration boundaries rather than deleting or bypassing them.

Only a future separately authorized milestone may revisit identity provider/deployment, named subject/grant/revocation policy, real same-transaction business/audit integration, healthy UTC, external audit anchoring and restore protection. Any migration then needs its own explicit authorization. This amendment does not commission that implementation or start PEC-1E/PEC-3.

## Unchanged formal evidence prerequisites

Authenticated source authority, mapping/perimeter acceptance, formal lineage and actual dataset cutoffs, producer-distinct independent acceptance and exact scope/evidence binding remain mandatory. Those gates stay blocked until satisfied with authentic evidence. Source approval, admission, D2 activation and production scoring remain separate later decisions; deferral creates no automatic path to any of them.

## Owner review

Review this amendment and its safety results. No renewed provider-selection question is pending in the current local-use milestone. No operational independent approval or authenticated owner source receipt is manufactured from the architecture instruction.
''')
 md('LOCAL_VIEWING_AND_GATE_ASSESSMENT.md','''# Local viewing and preserved gates

Inspected app/server/dashboard.ts::loadDashboard/readDashboard and app/server/current.ts::currentServices: local reads use the existing database/configuration, portfolio/artifact readers, optional research and current-data services. They do not require RuntimeReviewerIdentity, PEC-1C capture authentication or an OIDC session. app/server/runtime.ts retains ordinary clock/ID composition; no login middleware/redirect/provider was added by PEC-1D.

Therefore no application code bypass or authentication feature flag is needed. Keep the existing loopback Next application and private SQLite configuration. Portfolio/accounting reconstruction, available retained reports, research displays and historical artifacts remain viewable according to existing data availability. A displayed missing/stale/corrupt-data warning, blocked actionability, absent approval or withheld score is a data/governance condition, not a request to implement deferred login.

Selected existing unit/UI regressions exercise portfolio/holdings rendering, route catalog/empty states, current DTOs and review blocking, research evidence disclosure and data freshness/lineage. They use synthetic in-memory fixtures and no database migrations. Source-level unchanged-file checks protect the actual server composition. These checks do not claim a new live deployment/browser acceptance or real production dataset readiness.

Unchanged source approval, independent acceptance, formal capture, admission and scoring boundaries are checked by PEC-1B/PEC-2 regressions, immutable PEC-1C code pins and the original eight real empty-trust candidate evaluations. No authenticated approval may be replaced by this documentation, local OS identity or unsigned records.
''')
 md('CLOSURE_REPORT.md','''# PEC-1D authentication deferral amendment closure

**Amendment status: READY_FOR_OWNER_REVIEW. Authentication and Google OIDC implementation: DEFERRED_BY_OWNER. PEC-1D is not marked approved.**

Recorded the owner's local-personal-Mac architecture instruction, superseding the immediate managed-provider decision gate. Preserved Next.js/Prisma/SQLite, all existing local viewing/analysis behavior and PEC-1C contracts. No login/provider/session/identity implementation or runtime code change is needed for the amendment.

Authenticated source authority and independent acceptance remain BLOCKED. Formal knowledge/cutoff, source admission, D2/scoring and operational clock/anchor/restore prerequisites remain unchanged; local JSON, OS username, unsigned records, broker tokens or Codex output grant no authority. Eight candidates remain DEFERRED. Deferring login does not relax missing/corrupt/stale-data or financial policy checks.

The updated roadmap defers authentication to a future separately authorized milestone. No library/provider installation, identity assignment, database migration, D2/scoring activation or PEC-1E/PEC-3 work is performed. All prior sealed packages remain audit history; this append-only amendment plus the current decision pointer/ADR replaces their login recommendation for current local use.

## Deliverables

- [Updated architecture decision](ARCHITECTURE_DECISION_AMENDMENT.md)
- [Authentication and Google OIDC status](AUTHENTICATION_DEFERRAL_STATUS.json)
- [Updated blockers](OPERATIONAL_BLOCKERS.json)
- [Updated roadmap](IMPLEMENTATION_ROADMAP.md)
- [Local viewing/gate assessment](LOCAL_VIEWING_AND_GATE_ASSESSMENT.md)
- [Validation results](VALIDATION_RESULTS.json)

Validation uses selected migration-free unit/UI regressions, existing PEC-1B/PEC-2 denial tests, read-only DB/seal/input checks and eight original candidate evaluations. Positive UI fixtures are not authenticated acceptance or scoring activation. Stop after the amendment and await owner review.
''')
 ADR.write_text('''# ADR 0005 — Local authentication deferral\n\nDate: 2026-10-24. Current instruction: **DEFERRED_BY_OWNER**.\n\nThe application runs locally on the owner's personal Mac. No login/authentication implementation is commissioned now. Google OIDC is deferred to a future separately authorized milestone. Preserve Next.js, Prisma and SQLite and keep ordinary portfolio viewing and analysis available under existing data integrity/actionability rules.\n\nThis supersedes PEC-1D's immediate provider-selection recommendation. It does not approve a new local identity system or waive authenticated source authority, independent acceptance, formal knowledge, production admission, D2 or scoring gates. PEC-1C contracts remain unchanged for future integration. Never substitute OS username, local JSON, unsigned records or Codex output for authenticated approvals.\n\nNo libraries/providers, screens/sessions, identities, database migrations or scoring activation are authorized. See [the versioned amendment](../fundamental-data-engine/evidence/2026-10-24-pec1d-authentication-deferral-amendment/CLOSURE_REPORT.md) and [current decision](../fundamental-data-engine/PEC1D_CURRENT_DECISION.md). The sealed original PEC-1D report remains immutable history. Amendment is awaiting owner review; no source approval is created.\n''')
 CURRENT.write_text('''# PEC-1D current architecture decision\n\nAs of the owner instruction dated 2026-10-24: application local on personal Mac; authentication and Google OIDC implementation **DEFERRED_BY_OWNER**. The immediate provider-selection request in the sealed 2026-10-23 report is superseded for this milestone.\n\nNo login is required for ordinary local viewing/analysis. Existing data integrity, admission and scoring gates remain unchanged; authenticated source approval and independent acceptance stay BLOCKED. Preserve Next.js/Prisma/SQLite and PEC-1C contracts. No migrations, identities, sessions or providers are created.\n\n[Architecture amendment](evidence/2026-10-24-pec1d-authentication-deferral-amendment/ARCHITECTURE_DECISION_AMENDMENT.md) · [Status](evidence/2026-10-24-pec1d-authentication-deferral-amendment/AUTHENTICATION_DEFERRAL_STATUS.json) · [Blockers](evidence/2026-10-24-pec1d-authentication-deferral-amendment/OPERATIONAL_BLOCKERS.json) · [Roadmap](evidence/2026-10-24-pec1d-authentication-deferral-amendment/IMPLEMENTATION_ROADMAP.md) · [Closure](evidence/2026-10-24-pec1d-authentication-deferral-amendment/CLOSURE_REPORT.md). Await owner review; do not advance to PEC-1E/PEC-3.\n''')
 print('Owner deferral recorded; sealed history and runtime code preserved.')

def verify(sealed=False):
 h=helpers();baseline=read(OUT/'PROTECTED_INPUT_HASHES.json')
 for path,expected in baseline.items():require(sha(ROOT/path)==expected,'PROTECTED_INPUT_CHANGED:'+path)
 require(h.database()==read(OUT/'DATABASE_BASELINE.json'),'DATABASE_CHANGED')
 require({p for p in baseline if p.startswith('data/')}=={str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file() and '__pycache__' not in p.parts},'DATA_NAMESPACE_CHANGED')
 require({p for p in baseline if p.startswith('prisma/')}=={str(p.relative_to(ROOT)) for p in (ROOT/'prisma').rglob('*') if p.is_file() and p.name!='.DS_Store'},'SCHEMA_OR_MIGRATION_CHANGED')
 for row in read(OUT/'PRIOR_SEAL_VERIFICATION.json'):require(verify_seal(ROOT,ROOT/row['package'])==row,'PRIOR_SEAL_CHANGED')
 require(read(OUT/'AUTHENTICATION_DEFERRAL_STATUS.json')['googleOIDC']=='DEFERRED_BY_OWNER','DEFERRAL_STATUS')
 p=E/'2026-10-23-production-evidence-closure-pec2';records=read(p/'ADMISSION_CANDIDATES.json')['records'];bundles=read(p/'EVIDENCE_BUNDLES.json')['bundles']
 now=datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z');evaluations=[]
 for r in records:
  b=next(x for x in bundles if x['core']['pec1Candidate']['candidateId']==r['candidateId'])
  result=pec2_preparation_boundary(r,b['core'],b['receipts'],records,now,root=ROOT)
  require(result['PEC2Result']['effectiveAdmissionState']=='DEFERRED' and result['productionUseAuthorized'] is False,'SOURCE_GATE_CHANGED');evaluations.append(result)
 require(len(evaluations)==8,'CANDIDATE_COUNT')
 for filename,expected in [('pec1b-regressions.json',25),('pec2-regressions.json',62)]:
  result=read(OUT/'validation'/filename);require(result['success'] and result['testsRun']==expected and not result['errors'],'REGRESSION_FAILURE:'+filename)
 require('PASS boundaries:' in (OUT/'validation/architecture-boundaries.log').read_text(),'ARCHITECTURE_BOUNDARY_FAILURE')
 ui=read(OUT/'validation/local-viewing-tests.json');require(ui['success'] and ui['numFailedTests']==0 and ui['numPassedTests']>0,'UI_REGRESSION')
 if sealed:verify_seal(ROOT,OUT)
 result={'status':'PASS_TECHNICAL_SAFETY_NOT_AUTHENTICATED_APPROVAL','protectedFilesUnchanged':len(baseline),'priorSealsVerified':len(read(OUT/'PRIOR_SEAL_VERIFICATION.json')),'databaseUnchanged':True,'applicationAndPolicyCodeUnchanged':True,'ordinaryLocalViewingTestsPassed':ui['numPassedTests'],'PEC1BRegressions':25,'PEC2Regressions':62,'candidateStates':{'DEFERRED':8},'authenticatedApprovalsCreated':0,'effectiveAdmissions':0,'providerInstallations':0,'sessionsCreated':0,'identitiesAssigned':0,'databaseMigrationsExecuted':0,'D2Activated':False,'scoringActivated':False,'PEC1EStarted':False,'PEC3Started':False,'packetSealChecked':sealed,'evaluations':evaluations}
 save('validation/safety-verification.json',result);print(json.dumps({k:v for k,v in result.items() if k!='evaluations'},indent=2))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--verify',action='store_true');p.add_argument('--require-seal',action='store_true');a=p.parse_args()
 if a.verify:verify(a.require_seal)
 else:prepare()
