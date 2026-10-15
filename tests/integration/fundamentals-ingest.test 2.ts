// @vitest-environment node
import { it, expect } from 'vitest';
import { testDatabase } from '../fixtures/database';
import { FptDocumentCollector } from '@/infrastructure/fundamentals/fpt';
import { PrismaFundamentals } from '@/infrastructure/repositories/fundamentals';
import { ingestFundamentalDocuments } from '@/application/fundamentals/ingest';
import { RepositoryRawDocuments } from '@/infrastructure/fundamentals/raw-document';
import { FileDocumentQualifications } from '@/infrastructure/repositories/document-qualifications';
import { FundamentalDocumentGate } from '@/application/fundamentals/document-qualification';
import { securityId } from '@/domain/portfolio/values';
import { join } from 'node:path';
import type { DocumentQualification } from '@/domain/fundamentals/document-qualification';

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
    const original = await repository.findCapture(batch.captureIds[1]);
    const reader = new RepositoryRawDocuments(repository);
    const document = await reader.reconstruct([batch.captureIds[1]]);
    const store = new FileDocumentQualifications(join(db.directory,'document-qualifications'));
    const gate = new FundamentalDocumentGate(reader,store);
    const issuer = {securityId:securityId('fixture-fpt'),ticker:'FPT',issuerReference:'fixture-security-master:FPT-Corporation'};
    await expect(gate.candidate(document.captureIds,issuer)).rejects.toThrow();
    const q: DocumentQualification = {id:'fixture-qualified',documentId:document.documentId,bodyHash:document.bodyHash,
      sourceVersionId:document.sourceVersionId,importExecutionId:document.importExecutionId,captureIds:document.captureIds,
      intendedIssuer:issuer,evidencedIssuer:issuer,documentType:'FINANCIAL_STATEMENTS',
      period:{start:'2026-04-01',end:'2026-06-30',type:'QUARTER',fiscalYear:2026,fiscalQuarter:2,calendarReference:'fixture-calendar'},
      reportingScope:'CONSOLIDATED',status:'QUALIFIED',method:'DOCUMENT_CONTENT_REVIEW',
      evidence:(['ISSUER_IDENTITY','DOCUMENT_TYPE','REPORTING_PERIOD','REPORTING_SCOPE'] as const).map(dimension =>
        ({dimension,reference:'fixture-content-review',locator:'page:1',bodyHash:document.bodyHash})),
      reviewedAt:'2026-10-09T11:00:00.000Z',reviewerReference:'fixture-reviewer',policyVersion:'manual-document-identity-v1',
      supersedesQualificationId:null,correctionReason:null};
    await gate.record(q);
    expect((await gate.candidate(document.captureIds,issuer)).qualification.id).toBe(q.id);
    await gate.record({...q,id:'fixture-rejected',status:'REJECTED',supersedesQualificationId:q.id,correctionReason:'fixture correction'});
    await expect(gate.candidate(document.captureIds,issuer)).rejects.toThrow();
    expect(await store.history(document.documentId)).toHaveLength(2);
    expect(await repository.findCapture(batch.captureIds[1])).toEqual(original);
    expect(await db.client.fundamentalObservation.count()).toBe(0);
    await expect(ingestFundamentalDocuments(collector,repository,'first-run')).rejects.toThrow();
    expect(await repository.findImport(batch.id)).toEqual(batch);
  } finally { await db.close(); }
}, 30_000);
