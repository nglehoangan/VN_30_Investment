import type { FundamentalDocumentReader, DocumentQualificationRepository, QualifiedDocumentInput } from '@/ports/fundamentals';
import type { DocumentIssuerIdentity, DocumentQualification } from '@/domain/fundamentals/document-qualification';
import { requireQualifiedDocument, validateDocumentQualification } from '@/domain/fundamentals/document-qualification';
import { requireFundamental } from '@/domain/fundamentals/validation';

export class FundamentalDocumentGate implements QualifiedDocumentInput {
  constructor(private readonly reader: FundamentalDocumentReader, private readonly qualifications: DocumentQualificationRepository) {}
  async record(raw: DocumentQualification) {
    const q = validateDocumentQualification(raw);
    const rawDocument = await this.reader.reconstruct(q.captureIds);
    requireFundamental(q.documentId === rawDocument.documentId && q.bodyHash === rawDocument.bodyHash &&
      q.sourceVersionId === rawDocument.sourceVersionId && q.importExecutionId === rawDocument.importExecutionId &&
      JSON.stringify(q.captureIds) === JSON.stringify(rawDocument.captureIds) && q.reviewedAt >= rawDocument.ingestedAt,
      'DOCUMENT_QUALIFICATION_BINDING');
    await this.qualifications.append(q);
  }
  async candidate(captureIds: readonly string[], intendedIssuer: DocumentIssuerIdentity) {
    const rawDocument = await this.reader.reconstruct(captureIds);
    return requireQualifiedDocument(rawDocument,await this.qualifications.history(rawDocument.documentId),intendedIssuer);
  }
}
