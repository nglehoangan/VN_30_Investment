// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { FptDocumentCollector, discoverFptReports } from '@/infrastructure/fundamentals/fpt';
import type { FptCollectionDependencies } from '@/infrastructure/fundamentals/fpt';

const URL = 'https://fpt.com/api/media/FPT_BCTC_hop_nhat_Q2_2026.pdf';
// Synthetic fixtures based on the independently browsed URL/title shape, not real report content.
const HTML = `<html><a href="/api/media/FPT_BCTC_hop_nhat_Q2_2026.pdf">BCTC</a></html>`;
const hash = (body: Uint8Array | string) => createHash('sha256').update(body).digest('hex');
function dependencies(request: FptCollectionDependencies['request']) {
  const calls: number[] = [];
  return { deps: { request, now: () => '2026-10-09T10:00:00.000Z',
    sleep: async (ms: number) => { calls.push(ms); } }, calls };
}
const html = () => new Response(HTML, { headers: { 'content-type':'text/html; charset=utf-8' } });
const pdf = () => new Response('%PDF-1.7\nSYNTHETIC ONLY', { headers: { 'content-type':'application/pdf' } });

describe('FPT raw documents, no live network', () => {
  it('discovers only approved financial PDF URLs and removes duplicates', () => {
    expect(discoverFptReports(HTML + HTML + `<a href="https://evil.invalid/bctc.pdf">x</a>
      <a href="/api/media/BCTC.pdf?token=secret">x</a><a href="/api/media/annual.pdf">x</a>`)).toEqual([URL]);
    expect(() => new FptDocumentCollector({ reportUrls: ['https://127.0.0.1/bctc.pdf'] })).toThrow();
    expect(() => new FptDocumentCollector({ reportUrls: [URL + '?token=secret'] })).toThrow();
  });
  it('preserves binary bytes and hashes, captures landing page and stays PARTIAL', async () => {
    const bytes = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(1_100_000, 255)]);
    const { deps, calls } = dependencies(async (url, init) => {
      expect(init.redirect).toBe('manual'); expect(init.credentials).toBe('omit');
      return url === URL ? new Response(bytes, { headers:{'content-type':'application/pdf'} }) : html();
    });
    const result = await new FptDocumentCollector({}, deps).collect('binary-run');
    expect(result.batch.completion).toBe('PARTIAL'); expect(result.captures).toHaveLength(3);
    const chunks = result.captures.slice(1).map(c => {
      expect(hash(c.payload)).toBe(c.payloadHash); return JSON.parse(c.payload);
    });
    expect(chunks.map(c => c.chunkIndex)).toEqual([0,1]);
    expect(Buffer.concat(chunks.map(c => Buffer.from(c.bytes,'base64')))).toEqual(bytes);
    expect(chunks[0].bodySha256).toBe(hash(bytes)); expect(calls).toEqual([1000]);
    expect(result.batch.captureIds).toEqual(result.captures.map(c => c.id));
  });
  it('retains 429 and retry success as separate events', async () => {
    let requests = 0;
    const { deps } = dependencies(async url => url !== URL ? html() : ++requests === 1
      ? new Response('busy', { status:429 }) : pdf());
    const result = await new FptDocumentCollector({},deps).collect('retry-run');
    expect(result.captures).toHaveLength(3);
    const failed = JSON.parse(result.captures[1].payload);
    expect(failed.httpStatus).toBe(429); expect(failed.error).toBe('HTTP_ERROR');
    expect(Buffer.from(failed.bytes,'base64').toString()).toBe('busy');
    expect(JSON.parse(result.captures[2].payload).attempt).toBe(2);
    expect(result.batch.errors.some(e => e.includes('HTTP_ERROR'))).toBe(true);
  });
  it('records transport failure without leaking exception secrets', async () => {
    const { deps } = dependencies(async () => { throw new Error('Authorization secret'); });
    const result = await new FptDocumentCollector({ attempts:2 },deps).collect('failure-run');
    expect(result.batch.completion).toBe('FAILED'); expect(result.captures).toHaveLength(2);
    expect(JSON.stringify(result)).not.toContain('Authorization secret');
    expect(JSON.parse(result.captures[0].payload).httpStatus).toBeNull();
  });
  it('bounds a stalled transport and records each timeout', async () => {
    const { deps } = dependencies(async () => new Promise<Response>(() => {}));
    const result = await new FptDocumentCollector({ timeoutMs:5, attempts:1 },deps).collect('timeout-run');
    expect(result.batch.completion).toBe('FAILED');
    expect(JSON.parse(result.captures[0].payload).error).toBe('TIMEOUT');
  });
  it('rejects redirect, oversized body, wrong MIME and invalid PDF without retry', async () => {
    for (const [response, code, limit] of [
      [() => new Response(null,{ status:302,headers:{location:'http://localhost/private'} }), 'REDIRECT_REQUIRES_REVIEW', 1000],
      [() => pdf(), 'BODY_LIMIT', 5],
      [() => new Response('%PDF-1.7',{headers:{'content-type':'text/html'}}), 'MEDIA_TYPE_MISMATCH', 1000],
      [() => new Response('not a pdf',{headers:{'content-type':'application/pdf'}}), 'PDF_SIGNATURE_MISMATCH', 1000],
    ] as const) {
      const { deps } = dependencies(async url => url === URL ? response() : html());
      const result = await new FptDocumentCollector({ reportUrls:[URL], maxBytes:limit },deps).collect('invalid-run');
      expect(result.batch.completion).toBe('FAILED');
      expect(result.batch.errors.some(e => e.includes(code))).toBe(true);
    }
  });
  it('uses reviewed seed links when discovery is dynamic and flags bounded document coverage', async () => {
    const second = 'https://fpt.com/api/media/FPT_BCTC_Q1.pdf';
    const { deps } = dependencies(async url => url.endsWith('.pdf') ? pdf() : new Response('<div>dynamic</div>',{headers:{'content-type':'text/html'}}));
    const result = await new FptDocumentCollector({ reportUrls:[URL,second], maxDocuments:1 },deps).collect('seed-run');
    expect(result.captures).toHaveLength(2);
    expect(result.batch.errors).toContain('STATIC_REPORT_DISCOVERY_UNVERIFIED');
    expect(result.batch.errors).toContain('DOCUMENT_LIMIT_PARTIAL');
  });
});
