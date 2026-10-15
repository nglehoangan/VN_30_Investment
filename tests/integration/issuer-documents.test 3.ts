import {it,expect} from 'vitest';
import {IssuerDocumentCollector,issuerSource} from '@/infrastructure/fundamentals/issuer-documents';
import {ingestFundamentalDocuments} from '@/application/fundamentals/ingest';
import {PrismaFundamentals} from '@/infrastructure/repositories/fundamentals';
import {RepositoryRawDocuments} from '@/infrastructure/fundamentals/raw-document';
import {testDatabase} from '../fixtures/database';
it('generic issuer collection persists only raw events and document lineage with no canonical/DI promotion',async()=>{
 const db=await testDatabase();try{const entry={ticker:'TEST',issuer:'SYNTHETIC TEST ONLY',discoveryUrl:'https://issuer.example/financial',sampleUrl:'https://issuer.example/BCTC_2025.pdf'},collector=new IssuerDocumentCollector(entry,issuerSource(entry,'2026-10-09T00:00:00.000Z'),{now:()=> '2026-10-10T01:00:00.000Z',sleep:async()=>{},ensurePublicHost:async()=>{},request:async url=>new Response(url.endsWith('.pdf')?'%PDF-1.7 SYNTHETIC ONLY':'<html>fixture</html>',{headers:{'content-type':url.endsWith('.pdf')?'application/pdf':'text/html'}})}),facts=new PrismaFundamentals(db.client);
 await ingestFundamentalDocuments(collector,facts,'generic-issuer-persist');const batch=await facts.findImport('generic-issuer-persist');expect(batch!.completion).toBe('PARTIAL');const d=await new RepositoryRawDocuments(facts).reconstruct([batch!.captureIds[1]]);expect(Buffer.from(d.bodyBase64,'base64').toString()).toContain('SYNTHETIC ONLY');expect(await db.client.fundamentalObservation.count()).toBe(0);expect(await db.client.fundamentalSnapshotRun.count()).toBe(0);expect(await db.client.dataInitializationAcceptance.count()).toBe(0);
 }finally{await db.close();}
});
