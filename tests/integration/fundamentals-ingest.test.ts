// @vitest-environment node
import { it, expect } from 'vitest';
import { testDatabase } from '../fixtures/database';
import { FptDocumentCollector } from '@/infrastructure/fundamentals/fpt';
import { PrismaFundamentals } from '@/infrastructure/repositories/fundamentals';
import { ingestFundamentalDocuments } from '@/application/fundamentals/ingest';

it('persists immutable raw page/error/PDF manifests and retains independent refreshes', async () => {
  const db = await testDatabase();
  try {
    const repository = new PrismaFundamentals(db.client);
    const collector = new FptDocumentCollector({ reportUrls:['https://fpt.com/api/media/FPT_BCTC_Q2.pdf'] }, {
      request: async url => new Response(url.endsWith('.pdf') ? '%PDF-1.7\nTEST ONLY' : '<div>dynamic</div>',
        { headers:{ 'content-type':url.endsWith('.pdf') ? 'application/pdf' : 'text/html' } }),
      now: () => '2026-10-09T10:00:00.000Z', sleep: async () => {},
    });
    const batch = await ingestFundamentalDocuments(collector,repository,'first-run');
    expect(await repository.findImport(batch.id)).toEqual(batch);
    const capture = await repository.findCapture(batch.captureIds[1]);
    expect(Buffer.from(JSON.parse(capture!.payload).bytes,'base64').toString()).toBe('%PDF-1.7\nTEST ONLY');
    await ingestFundamentalDocuments(collector,repository,'second-run');
    expect(await db.client.fundamentalImportBatch.count()).toBe(2);
    expect(await db.client.fundamentalSourceVersion.count()).toBe(1);
    expect(await db.client.fundamentalObservation.count()).toBe(0);
    await expect(ingestFundamentalDocuments(collector,repository,'first-run')).rejects.toThrow();
    expect(await repository.findImport(batch.id)).toEqual(batch);
  } finally { await db.close(); }
}, 30_000);
