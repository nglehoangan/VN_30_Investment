import type {MethodologyRecord} from '@/domain/methodology/record';
import type {CurrentExecutableAuthority} from './current-scoring';
import {sourceBytes,type SourcePin} from './registry';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {check} from '@/domain/scoring/validation';
import {verifyProductionAuthorityBundle} from '@/infrastructure/dependencies/production-authority';
import {instant} from '@/shared/time';
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
/** Exact version acceptance only. A user URL, standing data authority or caller boolean cannot approve code. */
export class PinnedCurrentExecutableAuthority implements CurrentExecutableAuthority {
 constructor(private readonly root:string,private readonly authority:SourcePin,private readonly clock:{now():string}){}
 async verify(method:MethodologyRecord){
  const a=JSON.parse(sourceBytes(this.root,this.authority).toString());
  check(a.contract==='current-scoring-executable-authority-v1'&&a.status==='APPROVED'&&a.purpose==='CURRENT_FORMAL_VALUATION','CURRENT_EXECUTABLE_APPROVAL_PENDING');
  const base=verifyProductionAuthorityBundle(this.root,a.baseAuthority);
  check(a.baselineManifestHash===base.manifest.contentHash,'CURRENT_EXECUTABLE_BASELINE_BINDING');
  const {contentHash,...body}=a;check(contentHash===hash(body),'CURRENT_EXECUTABLE_CONTENT_HASH');
  check(method.family==='SCORING'&&method.governanceStatus==='APPROVED'&&method.intendedUse==='PRODUCTION'&&method.configurationReference==='current-scoring-executable-code-sha256:'+a.codeHash,'CURRENT_EXECUTABLE_METHOD_NOT_APPROVED');
  check(a.methodologyHash===hash(method)&&a.ownerApproval?.scope==='CURRENT_SCORING_EXECUTABLE_VERSION','CURRENT_EXECUTABLE_METHOD_BINDING');
  const approvalPayloadHash=hash({purpose:a.purpose,methodologyHash:a.methodologyHash,baselineManifestHash:a.baselineManifestHash,codeHash:a.codeHash});
  check(a.approvalPayloadHash===approvalPayloadHash,'CURRENT_EXECUTABLE_APPROVAL_PAYLOAD');
  const owner=JSON.parse(sourceBytes(this.root,a.ownerApproval.receipt).toString());
  check(owner.ownerAuthority==='PROJECT_OWNER'&&owner.statement===`Approve exact current-purpose scoring authority ${approvalPayloadHash} for CURRENT_FORMAL_VALUATION`,'CURRENT_EXECUTABLE_OWNER_AUTHORIZATION_REQUIRED');
  instant(owner.recordedAt);instant(this.clock.now());check(owner.recordedAt<=this.clock.now()&&method.recordedAt<=this.clock.now(),'CURRENT_EXECUTABLE_APPROVAL_TIME');
  check(Array.isArray(a.code)&&a.code.length===CURRENT_SCORING_RUNTIME.length&&new Set(a.code.map((p:SourcePin)=>p.path)).size===CURRENT_SCORING_RUNTIME.length&&CURRENT_SCORING_RUNTIME.every(path=>a.code.some((p:SourcePin)=>p.path===path))&&a.codeHash===hash(a.code),'CURRENT_EXECUTABLE_COMPLETE_CODE_BINDING');
  for(const pin of a.code)sourceBytes(this.root,pin);
 }
}
