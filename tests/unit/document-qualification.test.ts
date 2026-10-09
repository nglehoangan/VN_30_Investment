// @vitest-environment node
import { describe,it,expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readdirSync, chmodSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { FptDocumentCollector } from '@/infrastructure/fundamentals/fpt';
import { RepositoryRawDocuments, rawDocumentHttpEvidence, INTERNAL_RAW_FAILURE_STATUS } from '@/infrastructure/fundamentals/raw-document';
import { FileDocumentQualifications } from '@/infrastructure/repositories/document-qualifications';
import { FundamentalDocumentGate } from '@/application/fundamentals/document-qualification';
import { securityId } from '@/domain/portfolio/values';
import { qualificationHead,validateDocumentQualification,documentQualificationStatus } from '@/domain/fundamentals/document-qualification';
import type { DocumentQualification,VerifiedRawDocument,QualifiedNormalizationCandidate } from '@/domain/fundamentals/document-qualification';
import type { FundamentalRepository } from '@/ports/fundamentals';
import type { FundamentalRawCapture } from '@/domain/fundamentals/contracts';

const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const issuer = {securityId:securityId('fixture-fpt'),ticker:'FPT',issuerReference:'fixture-security-master:FPT-Corporation'};
const reportUrl = 'https://fpt.com/api/media/FPT_BCTC_hop_nhat_Q2_2026.pdf';
export function qualificationFixture(document: VerifiedRawDocument): DocumentQualification {
  return {id:'review-1',documentId:document.documentId,bodyHash:document.bodyHash,
    sourceVersionId:document.sourceVersionId,importExecutionId:document.importExecutionId,captureIds:document.captureIds,
    intendedIssuer:issuer,evidencedIssuer:issuer,documentType:'FINANCIAL_STATEMENTS',
    period:{start:'2026-04-01',end:'2026-06-30',type:'QUARTER',fiscalYear:2026,fiscalQuarter:2,calendarReference:'fixture-calendar-reviewed'},
    reportingScope:'CONSOLIDATED',status:'QUALIFIED',method:'DOCUMENT_CONTENT_REVIEW',
    evidence: (['ISSUER_IDENTITY','DOCUMENT_TYPE','REPORTING_PERIOD','REPORTING_SCOPE'] as const).map(dimension =>
      ({dimension,reference:'fixture-independent-manual-review',locator:'page:1',bodyHash:document.bodyHash})),
    reviewedAt:'2026-10-09T11:00:00.000Z',reviewerReference:'fixture-reviewer',policyVersion:'manual-document-identity-v1',
    supersedesQualificationId:null,correctionReason:null};
}
async function fixture(body = '%PDF-1.7\nSynthetic identity fixture, no financial numbers') {
  const result = await new FptDocumentCollector({reportUrls:[reportUrl]}, {
    request: async url => new Response(url === reportUrl ? body : '<div>dynamic</div>',
      {headers:{'content-type':url === reportUrl ? 'application/pdf' : 'text/html'}}),
    now: () => '2026-10-09T10:00:00.000Z',sleep:async () => {},
  }).collect('identity-run');
  let captures = [...result.captures];
  const repo: FundamentalRepository = {
    findCapture:async id => captures.find(c => c.id === id) ?? null,
    findSource:async () => result.source,findImport:async () => result.batch,
    appendSource:async () => {},appendImport:async () => {},appendObservation:async () => {},findObservation:async () => null,
  };
  const reader = new RepositoryRawDocuments(repo), ids = captures.filter(c => c.resourceReference === reportUrl).map(c => c.id);
  return {result,reader,ids,replace:(rows: FundamentalRawCapture[]) => {captures = rows;}};
}

describe('document identity qualification is separate from raw transport', () => {
  it('A: HTTPS, HTTP200, MIME, PDF signature and filename remain UNQUALIFIED until explicit content review', async () => {
    const f = await fixture(), directory = mkdtempSync(join(tmpdir(),'vn30-qual-'));
    try {
      const store = new FileDocumentQualifications(directory), gate = new FundamentalDocumentGate(f.reader,store);
      const document = await f.reader.reconstruct(f.ids);
      expect(qualificationHead(await store.history(document.documentId))).toBeNull();
      expect(documentQualificationStatus(await store.history(document.documentId))).toBe('UNQUALIFIED');
      await expect(gate.candidate(f.ids,issuer)).rejects.toThrow();
      const q = qualificationFixture(document);
      await gate.record({...q,status:'UNQUALIFIED',method:'NOT_REVIEWED',evidencedIssuer:null,documentType:null,
        period:null,reportingScope:null,evidence:[],reviewerReference:null});
      await expect(gate.candidate(f.ids,issuer)).rejects.toThrow();
      await gate.record({...q,id:'review-2',supersedesQualificationId:'review-1',correctionReason:'identity reviewed'});
      expect((await gate.candidate(f.ids,issuer)).qualification.status).toBe('QUALIFIED');
    } finally {rmSync(directory,{recursive:true,force:true});}
  });
  it('B/C/D: rejects wrong issuer, missing period/scope, wrong type and filename-only evidence', async () => {
    const f = await fixture(), document = await f.reader.reconstruct(f.ids), q = qualificationFixture(document);
    for (const patch of [
      {evidencedIssuer:{securityId:securityId('fixture-fpt-online'),ticker:'FOC',issuerReference:'fixture-security-master:FPT-Online'}},
      {period:null},{reportingScope:null},{documentType:'OTHER'},
      {evidence:q.evidence.map(e => ({...e,locator:'filename:Q2_2026_hop_nhat'}))},
      {evidence:q.evidence.slice(0,1)}, {method:'NOT_REVIEWED'},
    ]) expect(() => validateDocumentQualification({...q,...patch} as DocumentQualification)).toThrow();
  });
  it('E: append-only rejection/correction preserves history, blocks stale/forked approvals and reopens', async () => {
    const f = await fixture(), directory = mkdtempSync(join(tmpdir(),'vn30-qual-'));
    try {
      const store = new FileDocumentQualifications(directory), gate = new FundamentalDocumentGate(f.reader,store);
      const q = qualificationFixture(await f.reader.reconstruct(f.ids));
      await gate.record(q);
      await gate.record({...q,id:'review-2',status:'REJECTED',supersedesQualificationId:q.id,correctionReason:'later evidence contradicts identity'});
      await expect(gate.candidate(f.ids,issuer)).rejects.toThrow();
      await expect(gate.record({...q,id:'review-3'})).rejects.toThrow();
      const history = await new FileDocumentQualifications(directory).history(q.documentId);
      expect(history.map(x => x.status)).toEqual(['QUALIFIED','REJECTED']);
      expect(history[0]).toEqual(q);
      expect(() => qualificationHead([...history,{...q,id:'fork',supersedesQualificationId:q.id,correctionReason:'fork'}])).toThrow();
    } finally {rmSync(directory,{recursive:true,force:true});}
  });
  it('F: altered bytes/hash, missing or duplicate chunks and mismatched evidence cannot reuse qualification', async () => {
    const f = await fixture(), directory = mkdtempSync(join(tmpdir(),'vn30-qual-'));
    try {
      const gate = new FundamentalDocumentGate(f.reader,new FileDocumentQualifications(directory));
      const q = qualificationFixture(await f.reader.reconstruct(f.ids)); await gate.record(q);
      await expect(gate.record({...q,id:'wrong-hash',bodyHash:'0'.repeat(64),evidence:q.evidence.map(e => ({...e,bodyHash:'0'.repeat(64)}))})).rejects.toThrow();
      await expect(f.reader.reconstruct([...f.ids,...f.ids])).rejects.toThrow();
      const c = f.result.captures[1], envelope = JSON.parse(c.payload);
      const payload = JSON.stringify({...envelope,bytes:Buffer.from('%PDF-1.7\nAltered').toString('base64')});
      f.replace([f.result.captures[0],{...c,payload,payloadHash:sha(payload)}]);
      await expect(gate.candidate(f.ids,issuer)).rejects.toThrow();
      f.replace([]); await expect(gate.candidate(f.ids,issuer)).rejects.toThrow();
    } finally {rmSync(directory,{recursive:true,force:true});}
  });
  it('all nonqualified states and intended-security mismatch fail closed', async () => {
    const f = await fixture(), directory = mkdtempSync(join(tmpdir(),'vn30-qual-'));
    try {
      const gate = new FundamentalDocumentGate(f.reader,new FileDocumentQualifications(directory));
      const q = qualificationFixture(await f.reader.reconstruct(f.ids)); await gate.record(q);
      await expect(gate.candidate(f.ids,{...issuer,securityId:securityId('other-security')})).rejects.toThrow();
      await gate.record({...q,id:'conflict',status:'CONFLICTED',supersedesQualificationId:q.id,correctionReason:'conflicting review'});
      await expect(gate.candidate(f.ids,issuer)).rejects.toThrow();
    } finally {rmSync(directory,{recursive:true,force:true});}
  });
  it('private journal detects stored tampering', async () => {
    const f = await fixture(), directory = mkdtempSync(join(tmpdir(),'vn30-qual-'));
    try {
      const store = new FileDocumentQualifications(directory), gate = new FundamentalDocumentGate(f.reader,store);
      const q = qualificationFixture(await f.reader.reconstruct(f.ids)); await gate.record(q);
      const file = join(directory,readdirSync(directory).find(name => name.endsWith('.json'))!);
      chmodSync(file,0o600);writeFileSync(file,'{"body":"{}","bodyHash":"wrong","previousHash":null}');
      await expect(gate.candidate(f.ids,issuer)).rejects.toThrow();
    } finally {rmSync(directory,{recursive:true,force:true});}
  });
  it('missing final correction or interrupted append fails closed through commit receipts', async () => {
    const f = await fixture(), directory = mkdtempSync(join(tmpdir(),'vn30-qual-'));
    try {
      const store = new FileDocumentQualifications(directory), gate = new FundamentalDocumentGate(f.reader,store);
      const q = qualificationFixture(await f.reader.reconstruct(f.ids)); await gate.record(q);
      await gate.record({...q,id:'rejected',status:'REJECTED',supersedesQualificationId:q.id,correctionReason:'test correction'});
      const name = readdirSync(directory).filter(name => name.endsWith('.json')).sort().at(-1)!;
      unlinkSync(join(directory,name));
      await expect(gate.candidate(f.ids,issuer)).rejects.toThrow();
    } finally {rmSync(directory,{recursive:true,force:true});}
  });
  it('fully rehashed replacement bytes require a distinct qualification identity', async () => {
    const f = await fixture(), directory = mkdtempSync(join(tmpdir(),'vn30-qual-'));
    try {
      const gate = new FundamentalDocumentGate(f.reader,new FileDocumentQualifications(directory));
      const q = qualificationFixture(await f.reader.reconstruct(f.ids)); await gate.record(q);
      const c = f.result.captures[1], bytes = Buffer.from('%PDF-1.7\nDifferent synthetic document');
      const payload = JSON.stringify({...JSON.parse(c.payload),bytes:bytes.toString('base64'),byteLength:bytes.length,bodySha256:sha(bytes.toString())});
      f.replace([f.result.captures[0],{...c,payload,payloadHash:sha(payload)}]);
      const changed = await f.reader.reconstruct(f.ids);
      expect(changed.documentId).not.toBe(q.documentId); expect(changed.bodyHash).not.toBe(q.bodyHash);
      await expect(gate.candidate(f.ids,issuer)).rejects.toThrow();
      await expect(gate.record({...q,id:'reuse-approval'})).rejects.toThrow();
    } finally {rmSync(directory,{recursive:true,force:true});}
  });
  it('generic reconstruction orders all chunks and rejects missing/mixed retrieval lineage', async () => {
    const f = await fixture('%PDF-1.7\n' + 'x'.repeat(1_100_000));
    const raw = await f.reader.reconstruct([...f.ids].reverse());
    expect(raw.captureIds).toEqual(f.ids);
    await expect(f.reader.reconstruct(f.ids.slice(0,1))).rejects.toThrow();
    const bad = f.result.captures.map(c => c.id === f.ids[1] ? {...c,importExecutionId:'other-import'} : c);
    f.replace(bad); await expect(f.reader.reconstruct(f.ids)).rejects.toThrow();
  });
  it('599 is local failure while actual provider evidence stays nullable or explicit', async () => {
    for (const response of [async () => {throw new Error('secret');},async () => new Response('busy',{status:503}),
      async () => new Response('provider error',{status:599})]) {
      const result = await new FptDocumentCollector({attempts:1}, {request:response,
        now:() => '2026-10-09T10:00:00.000Z',sleep:async () => {}}).collect('sentinel-test');
      const c = result.captures[0]; expect(c.responseStatus).toBe(INTERNAL_RAW_FAILURE_STATUS);
      const evidence = rawDocumentHttpEvidence(c);
      expect(evidence.localFailure).not.toBeNull();
      expect(evidence.httpStatus).toBe(JSON.parse(c.payload).httpStatus);
      const payload = JSON.stringify({...JSON.parse(c.payload),error:null,bodyComplete:true});
      expect(() => rawDocumentHttpEvidence({...c,payload,payloadHash:sha(payload)})).toThrow();
    }
  });
  it('compile-time input contract excludes raw captures and unbranded documents', () => {
    function compileOnly(capture: FundamentalRawCapture) {
      // @ts-expect-error Raw capture is not a verified raw document.
      const raw: VerifiedRawDocument = capture;
      // @ts-expect-error A raw capture is never a qualified normalization candidate.
      const candidate: QualifiedNormalizationCandidate = capture;
      return {raw,candidate};
    }
    expect(typeof compileOnly).toBe('function');
  });
});
