import type { FundamentalSourceVersion, FundamentalRawCapture, FundamentalImportBatch, FundamentalObservation } from '@/domain/fundamentals/contracts';
import type { DocumentQualification, VerifiedRawDocument, QualifiedNormalizationCandidate, DocumentIssuerIdentity } from '@/domain/fundamentals/document-qualification';
import type { NormalizationAssessment } from '@/domain/fundamentals/normalization';
/** No fetch, latest-wins selection, mutation, scoring or portfolio posting capability. */
export interface FundamentalRepository {
  appendSource(source: FundamentalSourceVersion): Promise<void>;
  appendImport(batch: FundamentalImportBatch, captures: readonly FundamentalRawCapture[]): Promise<void>;
  appendObservation(observation: FundamentalObservation): Promise<void>;
  findSource(id: string): Promise<FundamentalSourceVersion | null>;
  findImport(id: string): Promise<FundamentalImportBatch | null>;
  findCapture(id: string): Promise<FundamentalRawCapture | null>;
  findObservation(id: string): Promise<FundamentalObservation | null>;
}

/** Raw document collection only: no canonical financial observations. */
export interface FundamentalDocumentCollector {
  collect(executionId: string): Promise<{
    source: FundamentalSourceVersion;
    batch: FundamentalImportBatch;
    captures: readonly FundamentalRawCapture[];
  }>;
}

/** Generic issuer-independent boundary; discovered source configuration grants no qualification. */
export interface FundamentalDocumentReader {
  reconstruct(captureIds: readonly string[]): Promise<VerifiedRawDocument>;
}
export interface DocumentQualificationRepository {
  append(qualification: DocumentQualification): Promise<void>;
  history(documentId: string): Promise<readonly DocumentQualification[]>;
}
/** Normalization receives documents through this qualification boundary. */
export interface QualifiedDocumentInput {
  candidate(captureIds: readonly string[], intendedIssuer: DocumentIssuerIdentity): Promise<QualifiedNormalizationCandidate>;
}

export interface NormalizationTools {
  now(): string;
  hash(value: unknown): string;
}
export interface FundamentalNormalizationRepository {
  comparable(observations: readonly FundamentalObservation[]): Promise<readonly FundamentalObservation[]>;
  append(assessment: NormalizationAssessment): Promise<void>;
  find(id: string): Promise<NormalizationAssessment | null>;
}
