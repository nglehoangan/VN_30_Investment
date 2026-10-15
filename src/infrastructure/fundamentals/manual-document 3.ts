import {createHash} from 'node:crypto';
import type {VerifiedRawDocument} from '@/domain/fundamentals/document-qualification';
import {fundamentalId, fundamentalHash, requireFundamental,validateFundamentalSource,validateFundamentalBatch} from '@/domain/fundamentals/validation';
import type {FundamentalSourceVersion,FundamentalImportBatch} from '@/domain/fundamentals/contracts';
import {instant} from '@/shared/time';
import {deepFreeze} from '@/domain/portfolio/transaction';

/** Local admission is a separate transport. It never fabricates an HTTP response. */
export interface ManualDocumentReceipt {
  readonly schema: 'manual-document-receipt-v1';
  readonly sourceVersionId: string;
  readonly importExecutionId: string;
  readonly receiptId: string;
  readonly bodyHash: string;
  readonly byteLength: number;
  readonly suppliedByReference: string;
  readonly originalProvenanceReference: string;
  readonly retrievedAt: string;
  readonly ingestedAt: string;
  readonly recordedAt: string;
}
const sha = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
export function reconstructManualDocument(bytes: Uint8Array, receipt: ManualDocumentReceipt, source: FundamentalSourceVersion, batch: FundamentalImportBatch): VerifiedRawDocument {
  validateFundamentalSource(source);validateFundamentalBatch(batch);
  requireFundamental(source.id===receipt.sourceVersionId&&source.schemaVersion==='manual-document-receipt-v1'&&batch.sourceVersionId===source.id&&
    batch.id===receipt.importExecutionId&&batch.completion==='COMPLETE'&&batch.captureIds.length===1&&batch.captureIds[0]===receipt.receiptId&&
    batch.startedAt===receipt.retrievedAt&&batch.completedAt===receipt.retrievedAt&&batch.ingestedAt===receipt.ingestedAt&&source.recordedAt<=receipt.recordedAt,'MANUAL_SOURCE_IMPORT_BINDING');
  requireFundamental(Object.keys(receipt).sort().join(' ') ===
    'bodyHash byteLength importExecutionId ingestedAt originalProvenanceReference receiptId recordedAt retrievedAt schema sourceVersionId suppliedByReference', 'MANUAL_RECEIPT_FIELDS');
  requireFundamental(receipt.schema === 'manual-document-receipt-v1', 'MANUAL_RECEIPT_SCHEMA');
  [receipt.sourceVersionId, receipt.importExecutionId, receipt.receiptId].forEach(fundamentalId);
  fundamentalHash(receipt.bodyHash);
  [receipt.retrievedAt, receipt.ingestedAt, receipt.recordedAt].forEach(instant);
  requireFundamental(receipt.retrievedAt <= receipt.ingestedAt && receipt.ingestedAt <= receipt.recordedAt, 'MANUAL_RECEIPT_TIME');
  for (const reference of [receipt.suppliedByReference, receipt.originalProvenanceReference]) {
    requireFundamental(typeof reference === 'string' && reference.length > 0 && reference.length <= 4000 &&
      !/[\x00-\x1f<>]/.test(reference) && !/bearer\s|token\s*=|api[_-]?key\s*=/i.test(reference), 'MANUAL_PROVENANCE_REQUIRED');
  }
  const body = Buffer.from(bytes);
  requireFundamental(Number.isInteger(receipt.byteLength) && receipt.byteLength > 0 && receipt.byteLength <= 64_000_000 &&
    body.length === receipt.byteLength && sha(body) === receipt.bodyHash && body.subarray(0,5).toString('ascii') === '%PDF-', 'MANUAL_BODY_INTEGRITY');
  const resourceReference = 'manual-document-sha256:' + receipt.bodyHash;
  const documentId = sha(JSON.stringify({receipt, resourceReference}));
  // The ID binds the immutable local receipt; it is not an HTTP raw-capture ID.
  return deepFreeze({documentId, bodyHash: receipt.bodyHash, sourceVersionId: receipt.sourceVersionId,
    importExecutionId: receipt.importExecutionId, captureIds: [receipt.receiptId], resourceReference,
    retrievedAt: receipt.retrievedAt, ingestedAt: receipt.ingestedAt, bodyBase64: body.toString('base64')}) as unknown as VerifiedRawDocument;
}
