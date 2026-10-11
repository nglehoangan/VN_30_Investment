import {createHash} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {reconstructManualDocument, type ManualDocumentReceipt} from '@/infrastructure/fundamentals/manual-document';
import {requireQualifiedDocument} from '@/domain/fundamentals/document-qualification';
import type {FundamentalSourceVersion,FundamentalImportBatch} from '@/domain/fundamentals/contracts';
import {securityId} from '@/domain/portfolio/values';
const bytes = Buffer.from('%PDF-1.7\nfixture');
const receipt: ManualDocumentReceipt = {schema:'manual-document-receipt-v1',sourceVersionId:'manual-source',
  importExecutionId:'manual-import',receiptId:'manual-receipt',bodyHash:createHash('sha256').update(bytes).digest('hex'),
  byteLength:bytes.length,suppliedByReference:'project-owner-supplied',originalProvenanceReference:'original-sha256-receipt',
  retrievedAt:'2026-10-11T12:00:00.000Z',ingestedAt:'2026-10-11T13:00:00.000Z',recordedAt:'2026-10-11T13:00:00.000Z'};
const source:FundamentalSourceVersion={id:receipt.sourceVersionId,provider:'MANUAL_DOCUMENT',documentationReference:'manual-receipt-contract',termsReference:'owner-authorized-retention',adapterVersion:'manual-v1',schemaVersion:receipt.schema,coverageLimitations:['CONTENT_QUALIFICATION_REQUIRED'],temporalLimitations:['LOCAL_RECEIPT_NOT_PUBLICATION'],recordedAt:receipt.recordedAt};
const batch:FundamentalImportBatch={id:receipt.importExecutionId,sourceVersionId:source.id,requestFingerprint:'a'.repeat(64),startedAt:receipt.retrievedAt,completedAt:receipt.retrievedAt,ingestedAt:receipt.ingestedAt,completion:'COMPLETE',captureIds:[receipt.receiptId],errors:[]};
describe('manual raw-document admission',()=>{
  it('preserves bytes, local provenance and initial-live clocks without HTTP evidence',()=>{
    const raw=reconstructManualDocument(bytes,receipt,source,batch);
    expect(Buffer.from(raw.bodyBase64,'base64')).toEqual(bytes);
    expect(raw.resourceReference).toBe('manual-document-sha256:'+receipt.bodyHash);
    expect(raw.ingestedAt).toBe(receipt.ingestedAt);
    expect(raw).not.toHaveProperty('responseStatus');
    expect(reconstructManualDocument(bytes,{...receipt,originalProvenanceReference:'other-receipt'},source,batch).documentId).not.toBe(raw.documentId);
  });
  it('rejects mismatched source schema and import lineage',()=>{
    expect(()=>reconstructManualDocument(bytes,receipt,{...source,schemaVersion:'raw-document-envelope-v2'},batch)).toThrow();
    expect(()=>reconstructManualDocument(bytes,receipt,source,{...batch,captureIds:['unrelated-receipt']})).toThrow();
  });
  it('does not bypass document qualification',()=>{
    expect(()=>requireQualifiedDocument(reconstructManualDocument(bytes,receipt,source,batch),[],
      {securityId:securityId('658fafbe-65b3-4176-999f-d4d32e1bd838'),ticker:'ACB',issuerReference:'frozen-identity'})).toThrow();
  });
  it.each([
    {...receipt,bodyHash:'0'.repeat(64)}, {...receipt,byteLength:bytes.length+1},
    {...receipt,ingestedAt:'2026-10-11T11:00:00.000Z'}, {...receipt,recordedAt:'2026-10-11T12:00:00.000Z'},
    {...receipt,suppliedByReference:''}, {...receipt,originalProvenanceReference:'token=secret'},
  ])('rejects tampered integrity, backdated admission and missing provenance',r=>expect(()=>reconstructManualDocument(bytes,r,source,batch)).toThrow());
});
