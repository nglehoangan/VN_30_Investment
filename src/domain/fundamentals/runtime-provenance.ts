import type { FundamentalObservation, FundamentalSourceVersion, FundamentalRawCapture, FundamentalImportBatch, RegistryRelease } from './contracts';
import { assessAvailability, type AvailabilityPolicy } from './availability';
import { fundamentalHash, requireFundamental, validateFundamentalObservation, validateFundamentalSource, validateFundamentalCapture, validateFundamentalBatch } from './validation';
import { instant } from '@/shared/time';
import { deepFreeze } from '@/domain/portfolio/transaction';

/** This receipt is evidence, not a request assertion: the service resolves its exact hash from a trusted verifier. */
export interface FormalLineageReceipt {
  readonly observationHash: string; readonly canonicalRunHash: string; readonly canonicalFactId: string;
  readonly canonicalPointer: string; readonly sourceArtifactHash: string; readonly sourcePointer: string;
  readonly importHash: string; readonly captureHash: string; readonly sourceHash: string;
  readonly normalizationHash: string; readonly authorityHash: string;
  readonly publication: { readonly kind: 'ISSUER_DISCLOSURE' | 'EXCHANGE_DISCLOSURE' | 'OFFICIAL_SOURCE_METADATA' | 'APPROVED_API_PUBLICATION'; readonly publishedAt: string; readonly reference: string; readonly artifactHash: string; readonly verifiedAt: string };
}
export interface FormalPreparation {
  readonly observation: FundamentalObservation; readonly source: FundamentalSourceVersion;
  readonly capture: FundamentalRawCapture; readonly batch: FundamentalImportBatch;
  readonly registry: RegistryRelease; readonly policy: AvailabilityPolicy; readonly receipt: FormalLineageReceipt;
  readonly asOf: string; readonly knownAt: string;
}
/** Reuse observation/availability validation. No promotion by relabelling CURRENT_ANALYSIS facts. */
export function prepareFormalObservation(input: FormalPreparation, hash: (v: unknown) => string, digest: (v: string) => string) {
  const { receipt: r, source, capture, batch, registry, policy, asOf, knownAt } = input;
  instant(asOf); instant(knownAt); requireFundamental(knownAt <= asOf, 'RUNTIME_CUTOFF_ORDER');
  const o = validateFundamentalObservation(input.observation, registry);
  validateFundamentalSource(source); validateFundamentalCapture(capture); validateFundamentalBatch(batch);
  [r.observationHash,r.canonicalRunHash,r.sourceArtifactHash,r.importHash,r.captureHash,r.sourceHash,r.normalizationHash,r.authorityHash,r.publication.artifactHash].forEach(fundamentalHash);
  requireFundamental(o.scope === 'FORMAL' && policy.governanceStatus === 'APPROVED', 'FORMAL_RUNTIME_GOVERNANCE_REQUIRED');
  requireFundamental(r.observationHash === hash(o) && r.sourceHash === hash(source) && r.captureHash === hash(capture) && r.importHash === hash(batch) &&
    capture.payloadHash === digest(capture.payload) && r.sourceArtifactHash === capture.payloadHash && o.rawCaptureId === capture.id && o.sourceVersionId === source.id && capture.sourceVersionId === source.id &&
    capture.importExecutionId === batch.id && batch.sourceVersionId === source.id && batch.captureIds.includes(capture.id) && batch.completion === 'COMPLETE' &&
    o.retrievedAt === capture.retrievedAt && o.ingestedAt === batch.ingestedAt && o.raw.fieldLocator === r.sourcePointer &&
    r.canonicalFactId.trim() && /^\/canonicalFacts\/\d+$/.test(r.canonicalPointer) && r.sourcePointer.trim() &&
    o.ancestorReferences.includes('canonical-run-sha256:'+r.canonicalRunHash+'#'+r.canonicalPointer), 'FORMAL_LINEAGE_INCOMPLETE');
  const p = r.publication;
  requireFundamental(['ISSUER_DISCLOSURE','EXCHANGE_DISCLOSURE','OFFICIAL_SOURCE_METADATA','APPROVED_API_PUBLICATION'].includes(p.kind), 'PUBLICATION_EVIDENCE_KIND');
  instant(p.publishedAt); instant(p.verifiedAt);
  requireFundamental(o.publication.publicationStatus === 'VERIFIED' && o.publication.publicationPrecision === 'TIMESTAMP' &&
    o.publication.publishedAt === p.publishedAt && o.publication.evidenceReference === p.reference && p.reference.trim(), 'AVAILABILITY_UNPROVEN');
  requireFundamental(p.verifiedAt <= o.ingestedAt && p.verifiedAt <= knownAt && source.recordedAt <= knownAt && batch.ingestedAt <= knownAt && o.periodEnd <= asOf.slice(0,10), 'FUTURE_OBSERVATION');
  const availability = assessAvailability({ id: 'runtime-availability-' + hash(o).slice(0, 32), observation: o, registry, policy, assessedAt: knownAt, hash });
  requireFundamental(availability.status === 'VERIFIED' && availability.availableAt !== null && availability.availableAt <= knownAt, 'AVAILABILITY_UNPROVEN_OR_FUTURE');
  return deepFreeze({ observation: o, availability, lineage: r, lineageHash: hash(r), clocks: {
    periodStart:o.periodStart, periodEnd:o.periodEnd, reportAsOf:o.reportDate, sourcePublishedAt:p.publishedAt,
    sourceRetrievedAt:o.retrievedAt, systemIngestedAt:o.ingestedAt, correctedAt:o.correctionKnownAt,
    knownAt:[availability.availableAt,p.verifiedAt].sort().at(-1)!, validFrom:asOf, validThrough:null,
  }});
}
