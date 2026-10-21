import {scoringReadinessFixture} from './scoring-readiness';
import {snapshotHash,manifestDigest} from '@/infrastructure/fundamentals/snapshot-hash';
import type {FormalPreparation,FormalLineageReceipt} from '@/domain/fundamentals/runtime-provenance';
import type {RuntimeAuthorityKind,RuntimeAuthorityPin} from '@/domain/fundamentals/runtime-authority';
import type {MethodologyRecord} from '@/domain/methodology/record';
import {methodologyId} from '@/shared/ids';
import {instant} from '@/shared/time';
import type {RuntimeEvidenceAuthority,RuntimeReviewerIdentity} from '@/ports/runtime-readiness';
export function runtimeFixture(){
  const f=scoringReadinessFixture();
  const observation={...f.observations[0],ancestorReferences:['canonical-run-sha256:'+snapshotHash('canonical')+'#/canonicalFacts/0'],raw:{...f.observations[0].raw,fieldLocator:'/netProfitAfterTax'}};
  const source=f.source,capture=f.captures[0],batch=f.batch;
  const receipt={observationHash:snapshotHash(observation),canonicalRunHash:snapshotHash('canonical'),canonicalFactId:'canonical-test',canonicalPointer:'/canonicalFacts/0',
    sourceArtifactHash:capture.payloadHash,sourcePointer:observation.raw.fieldLocator,importHash:snapshotHash(batch),captureHash:snapshotHash(capture),sourceHash:snapshotHash(source),normalizationHash:snapshotHash('normalization'),authorityHash:f.registry.registryHash,
    publication:{kind:'ISSUER_DISCLOSURE' as const,publishedAt:observation.publication.publishedAt!,reference:observation.publication.evidenceReference!,artifactHash:snapshotHash('publication'),verifiedAt:observation.ingestedAt}};
  const preparation:FormalPreparation={observation,source,capture,batch,registry:f.registry,policy:f.policy,receipt,asOf:f.request.decisionAsOf,knownAt:f.request.systemKnownAt};
  const registrations=new Map<string,{pin:RuntimeAuthorityPin;method:MethodologyRecord}>();
  function register(hash:string,kind:RuntimeAuthorityKind){
    const pin:RuntimeAuthorityPin={hash,kind,methodId:'synthetic-runtime-'+kind,approvalReference:'SYNTHETIC ONLY approval '+kind,effectiveFrom:'2026-01-01T00:00:00.000Z',effectiveThrough:null,dependencies:[]};
    const method:MethodologyRecord={...f.input.methodology,methodologyId:methodologyId(pin.methodId),approvalReference:pin.approvalReference,configurationReference:kind+'-sha256:'+hash,recordedAt:instant('2026-01-01T00:00:00.000Z')};
    registrations.set(hash,{pin,method});return {pin,method};
  }
  register(f.registry.registryHash,'registry');register(snapshotHash(f.policy),'availability');register(snapshotHash(f.requirements),'readiness-requirements');
  const receipts=new Map<string,FormalLineageReceipt>([[snapshotHash(receipt),receipt]]);
  const authority:RuntimeEvidenceAuthority={authority:async h=>registrations.get(h)??null,lineage:async h=>receipts.get(h)??null};
  const identity={subject:'synthetic-authenticated-analyst',sessionReference:'synthetic-authenticated-session',roles:['ANALYST'] as ('ANALYST'|'OWNER'|'INDEPENDENT_DATASET_REVIEWER')[]};
  const identityPort:RuntimeReviewerIdentity={current:async()=>structuredClone(identity)};
  return {...f,preparation,register,registrations,receipts,authority,identity,identityPort,hash:snapshotHash,digest:manifestDigest};
}
