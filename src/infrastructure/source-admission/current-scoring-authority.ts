import type {MethodologyRecord} from '@/domain/methodology/record';
import type {CurrentExecutableAuthority} from './current-scoring';
import {sourceBytes,type SourcePin} from './registry';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {check} from '@/domain/scoring/validation';
import {verifyProductionAuthorityBundle} from '@/infrastructure/dependencies/production-authority';
import {ACB_LIMITED_METHOD} from '@/domain/current-scoring/limited-coverage';
import {instant,dateOnly} from '@/shared/time';
export const CURRENT_SCORING_RUNTIME=[
 'src/domain/fundamentals/scoring-bridge.ts','src/infrastructure/dependencies/production-authority.ts',
 'src/infrastructure/market-boundary/tcbs-pipeline.ts','src/domain/market-boundary/freshness.ts','src/domain/market-boundary/hose-calendar.ts','src/domain/market-boundary/tcbs-eod.ts',
 'src/domain/fundamentals/level1-disposition.ts','src/domain/fundamentals/partial-universe.ts','src/infrastructure/dependencies/authority-receipts.ts',
 'src/application/scoring/purpose-aware-engine.ts','src/ports/current-scoring-execution.ts',
 'src/domain/current-scoring/time.ts','src/domain/current-scoring/scorecard.ts','src/domain/current-scoring/action-dependencies.ts',
 'src/infrastructure/source-admission/current-scoring.ts','src/infrastructure/source-admission/current-scoring-authority.ts',
 'src/domain/personal-ai/scorecard.ts','src/domain/personal-ai/provenance.ts','src/domain/personal-ai/scoring-readiness.ts','src/domain/personal-ai/scoring-bridge.ts',
 'prisma/proposals/current-scoring-artifact-v1.sql','scripts/generate-current-scoring.mjs',
 'src/domain/current-scoring/provenance.ts','src/infrastructure/source-admission/current-review.ts',
] as const;
export const ACB_BANK_PENDING_REVIEW_RUNTIME=[
 ...CURRENT_SCORING_RUNTIME.filter(path=>path!=='scripts/generate-current-scoring.mjs'),
 'tools/scoring/verify-current-parity.mjs',
 'tools/scoring/vn30_score.py',
 'tools/scoring/vn30_score_worker.mjs',
 'tools/scoring/acb-bank-adapter.ts',
 'src/infrastructure/source-admission/current-bank-scoring.ts',
 'src/infrastructure/source-admission/current-bank-dataset.ts',
 'src/infrastructure/source-admission/current-bank-admission.ts',
 'app/server/acb-bank-admission.ts',
 'app/server/acb-f1-runtime.ts',
 'docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/assessment/ACB_M1_SUCCESSOR_REVIEW.json',
] as const;
export const ACB_BANK_PENDING_REVIEW_RECOVERY_RUNTIME=[
 ...ACB_BANK_PENDING_REVIEW_RUNTIME.slice(0,-1),
 'docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/assessment/ACB_M1_SUCCESSOR_REVIEW_RECOVERY.json',
 'docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/f1-successor/F1_RUNTIME_APPROVED_RECOVERY.json',
] as const;
export const ACB_OFFICIAL_LIMITED_RUNTIME=[
 ...ACB_BANK_PENDING_REVIEW_RECOVERY_RUNTIME,
 'src/domain/current-scoring/limited-coverage.ts',
 'src/ports/current-publication.ts',
 'src/ui/dashboard.tsx',
 'src/ui/limited-coverage.tsx',
 'docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/assessment/ACB_OFFICIAL_LIMITED_POLICY_APPROVAL.json',
 'docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/assessment/ACB_CIO_NR_DISPOSITIONS_APPROVAL.json',
 'docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/assessment/ACB_CIO_LIMITED_COVERAGE_DISPOSITION.md',
 'docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/assessment/ACB_LIMITED_COVERAGE_SCOPE_DECISION_PROPOSAL.md',
 'docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/assessment/ACB_OFFICIAL_LIMITED_V3_NR_SCOPE_APPROVAL.json',
] as const;
/** Stable exact-content review payload. Governance receipt fields are bound at application,
 * never invented/backdated in a proposal merely to make its hash match future approval. */
export function currentAuthorityApprovalPayload(method:MethodologyRecord,codeHash:string,baselineManifestHash:string){
 return {purpose:'CURRENT_FORMAL_VALUATION',baselineManifestHash,codeHash,methodology:{methodologyId:method.methodologyId,family:method.family,semanticVersion:method.semanticVersion,implementationIdentity:method.implementationIdentity,configurationReference:method.configurationReference,governingDocumentReference:method.governingDocumentReference}};
}
/** Exact version acceptance only. A user URL, standing data authority or caller boolean cannot approve code. */
export class PinnedCurrentExecutableAuthority implements CurrentExecutableAuthority {
 constructor(private readonly root:string,private readonly authority:SourcePin,private readonly clock:{now():string}){}
 async verify(method:MethodologyRecord){
  const a=JSON.parse(sourceBytes(this.root,this.authority).toString());
  check(a.contract==='current-scoring-executable-authority-v2'&&a.status==='APPROVED'&&a.purpose==='CURRENT_FORMAL_VALUATION','CURRENT_EXECUTABLE_APPROVAL_PENDING');
  const base=verifyProductionAuthorityBundle(this.root,a.baseAuthority);
  check(a.baselineManifestHash===base.manifest.contentHash,'CURRENT_EXECUTABLE_BASELINE_BINDING');
  const {contentHash,...body}=a;check(contentHash===hash(body),'CURRENT_EXECUTABLE_CONTENT_HASH');
  check(method.family==='SCORING'&&method.governanceStatus==='APPROVED'&&method.intendedUse==='PRODUCTION'&&method.configurationReference==='current-scoring-executable-code-sha256:'+a.codeHash,'CURRENT_EXECUTABLE_METHOD_NOT_APPROVED');
  check(a.methodologyHash===hash(method)&&a.ownerApproval?.scope==='CURRENT_SCORING_EXECUTABLE_VERSION','CURRENT_EXECUTABLE_METHOD_BINDING');
  const approvalPayloadHash=hash(currentAuthorityApprovalPayload(method,a.codeHash,a.baselineManifestHash));
  check(a.approvalPayloadHash===approvalPayloadHash,'CURRENT_EXECUTABLE_APPROVAL_PAYLOAD');
  const owner=JSON.parse(sourceBytes(this.root,a.ownerApproval.receipt).toString());
  check(owner.ownerAuthority==='PROJECT_OWNER'&&owner.statement===`Approve exact current-purpose scoring authority ${approvalPayloadHash} for CURRENT_FORMAL_VALUATION`,'CURRENT_EXECUTABLE_OWNER_AUTHORIZATION_REQUIRED');
  check(sourceBytes(this.root,owner.source).toString().includes(owner.statement),'CURRENT_EXECUTABLE_VERBATIM_OWNER_SOURCE_REQUIRED');
  instant(owner.recordedAt);instant(this.clock.now());check(owner.recordedAt<=this.clock.now()&&method.recordedAt===owner.recordedAt&&method.effectiveDate===owner.recordedAt.slice(0,10)&&method.approvalReference===a.ownerApproval.receipt.path,'CURRENT_EXECUTABLE_APPROVAL_TIME');
  check(a.runtimeProfile===undefined||['ACB_BANK_PENDING_REVIEW_V1','ACB_BANK_PENDING_REVIEW_RECOVERY_V1','ACB_OFFICIAL_LIMITED_V1'].includes(a.runtimeProfile),'CURRENT_EXECUTABLE_RUNTIME_PROFILE');
  check((a.runtimeProfile==='ACB_OFFICIAL_LIMITED_V1')===(method.methodologyId===ACB_LIMITED_METHOD),'CURRENT_EXECUTABLE_LIMITED_METHOD_PROFILE_MISMATCH');
  const runtime=a.runtimeProfile==='ACB_OFFICIAL_LIMITED_V1'?ACB_OFFICIAL_LIMITED_RUNTIME:
   a.runtimeProfile==='ACB_BANK_PENDING_REVIEW_RECOVERY_V1'?ACB_BANK_PENDING_REVIEW_RECOVERY_RUNTIME:
   a.runtimeProfile==='ACB_BANK_PENDING_REVIEW_V1'?ACB_BANK_PENDING_REVIEW_RUNTIME:CURRENT_SCORING_RUNTIME;
  check(Array.isArray(a.code)&&a.code.length===runtime.length&&new Set(a.code.map((p:SourcePin)=>p.path)).size===runtime.length&&runtime.every(path=>a.code.some((p:SourcePin)=>p.path===path))&&a.codeHash===hash(a.code),'CURRENT_EXECUTABLE_COMPLETE_CODE_BINDING');
  for(const pin of a.code)sourceBytes(this.root,pin);
 }
}
/** Prepare the successor objects only after a genuine owner receipt exists. The verifier
 * still validates its exact source bytes and approval statement before consumption. */
export function applyCurrentAuthorityProposal(proposal:{contract:string;status:string;purpose:string;codeHash:string;baselineManifestHash:string;approvalPayloadHash:string;contentHash:string;[key:string]:unknown},draft:MethodologyRecord,receipt:SourcePin,recordedAt:string){
 check(proposal.contract==='current-scoring-executable-authority-v2'&&proposal.status==='PROPOSED','CURRENT_PROPOSAL_REQUIRED');instant(recordedAt);
 check(draft.recordedAt<=recordedAt&&proposal.approvalPayloadHash===hash(currentAuthorityApprovalPayload(draft,proposal.codeHash,proposal.baselineManifestHash)),'CURRENT_REVIEW_PAYLOAD_MISMATCH');
 const method={...draft,governanceStatus:'APPROVED' as const,approvalReference:receipt.path,recordedAt:instant(recordedAt),effectiveDate:dateOnly(recordedAt.slice(0,10))};
 const {contentHash:oldHash,...body}=proposal;check(oldHash===hash(body),'CURRENT_PROPOSAL_CONTENT_HASH');
 const approved={...body,status:'APPROVED',methodologyHash:hash(method),ownerApproval:{scope:'CURRENT_SCORING_EXECUTABLE_VERSION',receipt}};
 check(hash(currentAuthorityApprovalPayload(method,proposal.codeHash,proposal.baselineManifestHash))===proposal.approvalPayloadHash,'CURRENT_REVIEW_PAYLOAD_CHANGED');
 return {method,authority:{...approved,contentHash:hash(approved)}};
}
