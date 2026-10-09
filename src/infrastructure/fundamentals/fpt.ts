import { createHash } from 'node:crypto';
import type { FundamentalDocumentCollector } from '@/ports/fundamentals';
import type { FundamentalRawCapture, FundamentalSourceVersion } from '@/domain/fundamentals/contracts';
import { fundamentalId, validateFundamentalSource, validateFundamentalBatch, validateFundamentalCapture } from '@/domain/fundamentals/validation';
import { INTERNAL_RAW_FAILURE_STATUS, RAW_DOCUMENT_MEDIA_TYPE } from './raw-document';

const ROOT = 'https://fpt.com/vi/nha-dau-tu';
const digest = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const CHUNK = 1_000_000;
export const FPT_SOURCE: FundamentalSourceVersion = validateFundamentalSource({
  id: 'fpt-public-documents-v1', provider: 'FPT Corporation public investor disclosures',
  documentationReference: 'docs/fundamental-data-engine/SLICE_2_IMPLEMENTATION_REPORT.md',
  termsReference: 'owner-selected-public-disclosures-access-retention-unverified',
  adapterVersion: '1.0.0', schemaVersion: 'raw-document-envelope-v1',
  coverageLimitations: ['FPT only; explicit report seed URLs supported; static landing-page discovery is not complete historical coverage'],
  temporalLimitations: ['Publication timestamps unverified; filename dates are not publication dates; no PIT or canonical acceptance'],
  recordedAt: '2026-10-09T00:00:00.000Z',
});

function allowed(raw: string, page = false) {
  const u = new URL(raw);
  if (u.origin !== 'https://fpt.com' || u.username || u.password || u.search || u.hash ||
      (page ? u.pathname !== '/vi/nha-dau-tu' : !/^\/api\/media\/[A-Za-z0-9_.%-]+\.pdf$/i.test(u.pathname))) {
    throw new Error('UNAPPROVED_RESOURCE');
  }
  return u.href;
}

/** Narrow static HTML contract. Unknown/dynamic formats remain PARTIAL. */
export function discoverFptReports(html: string): string[] {
  const links = new Set<string>();
  for (const match of html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    try {
      const url = new URL(match[1].replace(/&amp;/g, '&'), ROOT).href;
      if (/bctc|bao[_-]?cao[_-]?tai[_-]?chinh/i.test(url)) links.add(allowed(url));
    } catch { /* Not an approved report resource. */ }
  }
  return [...links].sort();
}

export interface FptCollectionOptions {
  /** Explicit report links from reviewed issuer disclosures; no arbitrary endpoints. */
  readonly reportUrls?: readonly string[];
  readonly maxDocuments?: number;
  readonly maxBytes?: number;
  readonly timeoutMs?: number;
  readonly attempts?: number;
  readonly intervalMs?: number;
}
export interface FptCollectionDependencies {
  readonly request: (url: string, init: RequestInit) => Promise<Response>;
  readonly now: () => string;
  readonly sleep: (ms: number) => Promise<void>;
}

/** Sequential, allowlisted, credential-free HTTP; inject transport/clock in tests. */
export class FptDocumentCollector implements FundamentalDocumentCollector {
  private readonly options: Required<FptCollectionOptions>;
  private readonly deps: FptCollectionDependencies;
  constructor(options: FptCollectionOptions = {}, dependencies?: FptCollectionDependencies) {
    this.options = { maxDocuments: 20, maxBytes: 32_000_000,
      timeoutMs: 15_000, attempts: 2, intervalMs: 1_000, ...options,
      reportUrls: Object.freeze([...(options.reportUrls ?? [])]) };
    for (const [key, min, max] of [['maxDocuments',1,100], ['maxBytes',1,64_000_000],
      ['timeoutMs',1,60_000], ['attempts',1,3], ['intervalMs',1_000,60_000]] as const) {
      const value = this.options[key];
      if (!Number.isInteger(value) || value < min || value > max) throw new Error('INVALID_COLLECTION_LIMIT');
    }
    this.options.reportUrls.forEach(url => allowed(url));
    this.deps = dependencies ?? { request: (url, init) => fetch(url, init),
      now: () => new Date().toISOString(), sleep: ms => new Promise(resolve => setTimeout(resolve, ms)) };
  }
  async collect(executionId: string) {
    fundamentalId(executionId);
    const startedAt = this.deps.now();
    const captures: FundamentalRawCapture[] = [];
    const errors: string[] = [];
    let requestCount = 0, documents = 0;
    const retrieve = async (url: string, page: boolean): Promise<Uint8Array | null> => {
      allowed(url, page);
      for (let attempt = 1; attempt <= this.options.attempts; attempt++) {
        if (requestCount++) await this.deps.sleep(this.options.intervalMs);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);
        let status: number | null = null, mediaType = '', failure: string | null = null;
        const parts: Uint8Array[] = [];
        let size = 0;
        try {
          // Race also bounds injected or stalled transports that ignore AbortSignal.
          const operation = async () => {
            const response = await this.deps.request(url, { redirect: 'manual', credentials: 'omit',
              cache: 'no-store', signal: controller.signal, headers: { Accept: page ? 'text/html' : 'application/pdf' } });
            if (controller.signal.aborted) throw new Error('TIMEOUT');
            status = response.status;
            mediaType = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
            if (response.url && response.url !== url) throw new Error('UNEXPECTED_RESPONSE_URL');
            if (status >= 300 && status < 400) throw new Error('REDIRECT_REQUIRES_REVIEW');
            const reader = response.body?.getReader();
            if (reader) {
              try {
                while (true) {
                  const result = await reader.read();
                  if (controller.signal.aborted) throw new Error('TIMEOUT');
                  if (result.done) break;
                  if (size + result.value.length > this.options.maxBytes) throw new Error('BODY_LIMIT');
                  parts.push(result.value); size += result.value.length;
                }
              } finally { await reader.cancel().catch(() => undefined); }
            }
            if (status < 200 || status >= 300) throw new Error('HTTP_ERROR');
            if (mediaType !== (page ? 'text/html' : 'application/pdf')) throw new Error('MEDIA_TYPE_MISMATCH');
          };
          await Promise.race([operation(), new Promise<never>((_, reject) => {
            controller.signal.addEventListener('abort', () => reject(new Error('TIMEOUT')), { once: true });
          })]);
        } catch (error) {
          const known = ['REDIRECT_REQUIRES_REVIEW','UNEXPECTED_RESPONSE_URL','BODY_LIMIT','HTTP_ERROR','MEDIA_TYPE_MISMATCH','TIMEOUT'];
          failure = error instanceof Error && known.includes(error.message) ? error.message : 'TRANSPORT_ERROR';
        } finally { clearTimeout(timer); controller.abort(); }
        const body = Buffer.concat(parts);
        if (!failure && !page && body.subarray(0,5).toString('ascii') !== '%PDF-') failure = 'PDF_SIGNATURE_MISMATCH';
        const retrievedAt = this.deps.now();
        // Binary chunks fit the foundational 4M-character payload ceiling losslessly.
        const count = Math.max(1, Math.ceil(body.length / CHUNK));
        const bodySha256 = digest(body);
        for (let index = 0; index < count; index++) {
          const payload = JSON.stringify({ schema: 'raw-document-envelope-v1', url, attempt,
            httpStatus: status, mediaType, error: failure, bodyComplete: failure === null,
            encoding: 'base64', chunkIndex: index, chunkCount: count, byteLength: body.length,
            bodySha256, bytes: body.subarray(index * CHUNK,(index + 1) * CHUNK).toString('base64') });
          captures.push(validateFundamentalCapture({ id: `${executionId}-capture-${captures.length + 1}`,
            sourceVersionId: FPT_SOURCE.id, importExecutionId: executionId,
            requestFingerprint: digest(JSON.stringify({ method:'GET',url,attempt })), resourceReference: url,
            sourceRecordId: null, sourceRecordVersion: null, retrievedAt,
            mediaType: RAW_DOCUMENT_MEDIA_TYPE,
            // 599 is a local capture sentinel; real HTTP status remains nullable in envelope.
            responseStatus: failure ? INTERNAL_RAW_FAILURE_STATUS : status!, payload, payloadHash: digest(payload) }));
        }
        if (!failure) return body;
        errors.push(`request-${requestCount}-attempt-${attempt}:${failure}${status === null ? '' : `:http-${status}`}`);
        if (!['TRANSPORT_ERROR','TIMEOUT','HTTP_ERROR'].includes(failure) ||
          (failure === 'HTTP_ERROR' && status !== 429 && (status ?? 0) < 500)) break;
      }
      return null;
    };
    const page = await retrieve(ROOT, true);
    const discovered = page ? discoverFptReports(new TextDecoder().decode(page)) : [];
    if (!discovered.length) errors.push('STATIC_REPORT_DISCOVERY_UNVERIFIED');
    const urls = [...new Set([...this.options.reportUrls, ...discovered])].sort();
    if (urls.length > this.options.maxDocuments) errors.push('DOCUMENT_LIMIT_PARTIAL');
    for (const url of urls.slice(0,this.options.maxDocuments)) if (await retrieve(url,false)) documents++;
    // Static discovery does not certify archive/pagination coverage, even on success.
    errors.push('HISTORICAL_AND_DYNAMIC_COVERAGE_UNVERIFIED');
    const completedAt = this.deps.now();
    const batch = validateFundamentalBatch({ id: executionId, sourceVersionId: FPT_SOURCE.id,
      requestFingerprint: digest(JSON.stringify({ root:ROOT,urls,options:this.options })), startedAt, completedAt,
      ingestedAt: this.deps.now(), completion: documents ? 'PARTIAL' : 'FAILED',
      captureIds: captures.map(c => c.id), errors });
    return { source: FPT_SOURCE, batch, captures };
  }
}
