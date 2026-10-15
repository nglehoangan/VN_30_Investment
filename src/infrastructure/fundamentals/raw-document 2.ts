import { createHash } from 'node:crypto';
import type { FundamentalRawCapture } from '@/domain/fundamentals/contracts';
import type { VerifiedRawDocument } from '@/domain/fundamentals/document-qualification';
import type { FundamentalRepository, FundamentalDocumentReader } from '@/ports/fundamentals';
import { validateFundamentalCapture, requireFundamental, fundamentalHash } from '@/domain/fundamentals/validation';
import {publicDocumentQuery,rawResourceReference} from './public-resource';
import { deepFreeze } from '@/domain/portfolio/transaction';

/** RESERVED INTERNAL FAILURE SENTINEL; never an assertion that the provider returned HTTP 599. */
export const INTERNAL_RAW_FAILURE_STATUS = 599;
export const RAW_DOCUMENT_MEDIA_TYPE = 'application/vnd.vn30.raw-document+json';
export const pdfDocumentMediaType=(schema:string,mediaType:string)=>mediaType==='application/pdf'||schema==='raw-document-envelope-v2'&&mediaType==='application/octet-stream';
const sha = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');
interface RawDocumentEnvelope {
  schema: 'raw-document-envelope-v1' | 'raw-document-envelope-v2'; url: string; attempt: number; httpStatus: number | null;
  mediaType: string; error: string | null; bodyComplete: boolean; encoding: 'base64';
  chunkIndex: number; chunkCount: number; byteLength: number; bodySha256: string; bytes: string;
}
function envelope(raw: FundamentalRawCapture): RawDocumentEnvelope {
  const c = validateFundamentalCapture(raw);
  requireFundamental(c.mediaType === RAW_DOCUMENT_MEDIA_TYPE && sha(c.payload) === c.payloadHash,'RAW_ENVELOPE_INTEGRITY');
  const e = JSON.parse(c.payload) as RawDocumentEnvelope;
  requireFundamental(e !== null && typeof e === 'object' &&
    Object.keys(e).sort().join(' ') === 'attempt bodyComplete bodySha256 byteLength bytes chunkCount chunkIndex encoding error httpStatus mediaType schema url',
    'RAW_ENVELOPE_FIELDS');
  requireFundamental(['raw-document-envelope-v1','raw-document-envelope-v2'].includes(e.schema) && e.encoding === 'base64' &&
    (e.schema === 'raw-document-envelope-v1' ? e.url === c.resourceReference : rawResourceReference(e.url) === c.resourceReference) && Number.isInteger(e.attempt) && e.attempt >= 1 && e.attempt <= 3 &&
    (e.httpStatus === null || (Number.isInteger(e.httpStatus) && e.httpStatus >= 100 && e.httpStatus <= 599)) &&
    typeof e.mediaType === 'string' && (e.error === null || (typeof e.error === 'string' && /^[A-Z_]{1,80}$/.test(e.error))) &&
    typeof e.bodyComplete === 'boolean','RAW_ENVELOPE_METADATA');
  const u = new URL(e.url);
  requireFundamental(u.protocol === 'https:' && !u.username && !u.password && !u.hash && (e.schema === 'raw-document-envelope-v1' ? !u.search : publicDocumentQuery(u)),'RAW_ENVELOPE_URL');
  requireFundamental(Number.isInteger(e.byteLength) && e.byteLength >= 0 && e.byteLength <= 64_000_000 &&
    e.chunkCount === Math.max(1,Math.ceil(e.byteLength / 1_000_000)) && Number.isInteger(e.chunkIndex) &&
    e.chunkIndex >= 0 && e.chunkIndex < e.chunkCount && typeof e.bytes === 'string' &&
    e.bytes.length <= 1_333_336 && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(e.bytes),
    'RAW_ENVELOPE_CHUNK');
  fundamentalHash(e.bodySha256);
  requireFundamental(c.requestFingerprint === sha(JSON.stringify({method:'GET',url:e.url,attempt:e.attempt})), 'RAW_REQUEST_FINGERPRINT');
  requireFundamental(e.error === null
    ? e.bodyComplete && e.httpStatus !== null && e.httpStatus >= 200 && e.httpStatus < 300 && c.responseStatus === e.httpStatus
    : !e.bodyComplete && c.responseStatus === INTERNAL_RAW_FAILURE_STATUS,'RAW_HTTP_SENTINEL_MISMATCH');
  return e;
}

/** Each contiguous response is a separate retrieval, even for the same URL/clock/body. */
export function completeRawPdfGroups(captures:readonly FundamentalRawCapture[]):string[][] {
  const groups:string[][]=[];
  for(let index=0;index<captures.length;){
    const e=envelope(captures[index]);
    requireFundamental(e.chunkIndex===0&&index+e.chunkCount<=captures.length,'RAW_RESPONSE_GROUP_BOUNDARY');
    if(e.error===null&&pdfDocumentMediaType(e.schema,e.mediaType)&&Buffer.from(e.bytes,'base64').subarray(0,5).toString()==='%PDF-')groups.push(captures.slice(index,index+e.chunkCount).map(c=>c.id));
    index+=e.chunkCount;
  }
  return groups;
}

/** Consumers read actual nullable provider evidence, never the reserved capture sentinel. */
export function rawDocumentHttpEvidence(capture: FundamentalRawCapture) {
  const e = envelope(capture);
  return Object.freeze({httpStatus:e.httpStatus,localFailure:e.error});
}

/** Generic lossless reconstruction, independent of issuer discovery/qualification. */
export class RepositoryRawDocuments implements FundamentalDocumentReader {
  constructor(private readonly repository: FundamentalRepository) {}
  async reconstruct(captureIds: readonly string[]): Promise<VerifiedRawDocument> {
    requireFundamental(captureIds.length > 0 && captureIds.length <= 64 && new Set(captureIds).size === captureIds.length,'RAW_DOCUMENT_CAPTURES');
    const captures = await Promise.all(captureIds.map(id => this.repository.findCapture(id)));
    requireFundamental(captures.every(c => c !== null),'RAW_DOCUMENT_CAPTURE_MISSING');
    const rows = captures.map(c => ({capture:c!,envelope:envelope(c!)})).sort((a,b) => a.envelope.chunkIndex-b.envelope.chunkIndex);
    const first = rows[0], c = first.capture, e = first.envelope;
    const batch = await this.repository.findImport(c.importExecutionId);
    const source = await this.repository.findSource(c.sourceVersionId);
    requireFundamental(source !== null && source.id === c.sourceVersionId && source.schemaVersion === e.schema &&
      batch !== null && batch.id === c.importExecutionId && batch.sourceVersionId === c.sourceVersionId &&
      e.error === null && pdfDocumentMediaType(e.schema,e.mediaType) && rows.length === e.chunkCount,'RAW_DOCUMENT_NOT_COMPLETE_PDF');
    for (const [index,row] of rows.entries()) {
      const other = row.envelope, capture = row.capture;
      requireFundamental(other.chunkIndex === index && other.chunkCount === e.chunkCount && other.bodySha256 === e.bodySha256 &&
        other.byteLength === e.byteLength && other.url === e.url && other.attempt === e.attempt && other.error === null &&
        other.mediaType === e.mediaType && other.httpStatus === e.httpStatus && other.bodyComplete &&
        capture.sourceVersionId === c.sourceVersionId && capture.importExecutionId === c.importExecutionId &&
        capture.retrievedAt === c.retrievedAt && batch!.captureIds.includes(capture.id) &&
        batch!.startedAt <= capture.retrievedAt && capture.retrievedAt <= batch!.completedAt,'RAW_DOCUMENT_CHUNK_LINEAGE');
      const bytes = Buffer.from(other.bytes,'base64');
      requireFundamental(bytes.toString('base64') === other.bytes &&
        bytes.length === Math.min(1_000_000,e.byteLength-index*1_000_000),'RAW_DOCUMENT_CHUNK_BYTES');
    }
    const body = Buffer.concat(rows.map(row => Buffer.from(row.envelope.bytes,'base64')));
    requireFundamental(body.length === e.byteLength && sha(body) === e.bodySha256 && body.subarray(0,5).toString('ascii') === '%PDF-', 'RAW_DOCUMENT_BODY_INTEGRITY');
    const ids = rows.map(row => row.capture.id);
    const documentId = sha(JSON.stringify({sourceVersionId:c.sourceVersionId,importExecutionId:c.importExecutionId,
      resourceReference:e.url,attempt:e.attempt,captureIds:ids,payloadHashes:rows.map(row => row.capture.payloadHash),bodyHash:e.bodySha256}));
    return deepFreeze({documentId,bodyHash:e.bodySha256,sourceVersionId:c.sourceVersionId,importExecutionId:c.importExecutionId,
      captureIds:ids,resourceReference:c.resourceReference,retrievedAt:c.retrievedAt,ingestedAt:batch!.ingestedAt,bodyBase64:body.toString('base64')}) as unknown as VerifiedRawDocument;
  }
}
