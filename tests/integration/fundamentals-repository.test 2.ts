// @vitest-environment node
import { describe,it,expect } from 'vitest';
import { testDatabase } from '../fixtures/database';
import { fundamentalFixture,release,sha } from '../fixtures/fundamentals';
import { PrismaFundamentals } from '@/infrastructure/repositories/fundamentals';
import { openDatabase } from '@/infrastructure/db/client';
import { DataIntegrityError } from '@/shared/errors';
async function seed(db:Awaited<ReturnType<typeof testDatabase>>) {
  const f=fundamentalFixture(),repo=new PrismaFundamentals(db.client);
  await db.client.security.create({data:{id:f.observation.securityId,name:'Synthetic issuer only'}});
  await repo.appendSource(f.source);await repo.appendImport(f.batch,[f.capture]);return {f,repo};
}
describe('immutable fundamental SQLite repository',()=>{
  it('exact source/capture/import/observation round-trip, reopen and no ledger mutation',async()=>{
    const db=await testDatabase();try{
      const {f,repo}=await seed(db);await repo.appendObservation(f.observation);
      expect(await repo.findSource(f.source.id)).toEqual(f.source);expect(await repo.findImport(f.batch.id)).toEqual(f.batch);expect(await repo.findCapture(f.capture.id)).toEqual(f.capture);expect(await repo.findObservation(f.observation.id)).toEqual(f.observation);
      expect(await repo.findObservation('absent')).toBeNull();
      const exact={...f.observation,id:'exact',mappingVersion:'synthetic-exact',normalized:{...f.observation.normalized,value:'9007199254740993.123456789012'}};await repo.appendObservation(exact);
      const rows=await db.client.$queryRawUnsafe<Array<{v:string;t:string}>>('SELECT normalized_value AS v, typeof(normalized_value) AS t FROM fundamental_observation WHERE id=\'exact\'');expect(rows[0]).toEqual({v:exact.normalized.value,t:'text'});
      await expect(repo.appendObservation(f.observation)).rejects.toThrow();await expect(repo.appendObservation({...f.observation,id:'duplicate-slot'})).rejects.toThrow();
      expect(await db.client.ledgerTransaction.count()).toBe(0);await db.client.$disconnect();
      const reopened=await openDatabase(db.config);try{expect(await new PrismaFundamentals(reopened).findObservation(exact.id)).toEqual(exact);}finally{await reopened.$disconnect();}
    }finally{await db.close();}
  });
  it('retains conflicts and every correction kind without latest-wins or overwrites',async()=>{
    const db=await testDatabase();try{
      const {f,repo}=await seed(db);await repo.appendObservation(f.observation);
      for(const [i,revisionKind] of (['ISSUER_RESTATEMENT','PROVIDER_CORRECTION','MAPPING_CORRECTION'] as const).entries()) {
        const next=fundamentalFixture(`rev-${i}`);await repo.appendImport(next.batch,[next.capture]);
        const revised={...next.observation,revisionKind,supersedesObservationId:f.observation.id,revisionReason:'synthetic correction',revisionEvidenceReference:'synthetic evidence',correctionKnownAt:next.observation.ingestedAt,normalized:{...next.observation.normalized,value:String(i)},publication:revisionKind==='ISSUER_RESTATEMENT'?{...next.observation.publication,evidenceReference:'new-issuer-disclosure'}:next.observation.publication};
        await repo.appendObservation(revised);expect(await repo.findObservation(revised.id)).toEqual(revised);
      }
      const conflicting=fundamentalFixture('conflict');await repo.appendImport(conflicting.batch,[conflicting.capture]);await repo.appendObservation({...conflicting.observation,quality:'CONFLICTING',normalized:{...conflicting.observation.normalized,value:'-10'}});
      expect(await repo.findObservation(f.observation.id)).toEqual(f.observation);expect(await db.client.fundamentalObservation.count()).toBe(5);
    }finally{await db.close();}
  });
  it('raw invalid payload remains available and failed/partial imports cannot imply completeness',async()=>{
    const db=await testDatabase();try{
      const {repo}=await seed(db);const f=fundamentalFixture('invalid');const c={...f.capture,responseStatus:503,payload:'malformed response',payloadHash:sha('malformed response')};
      await repo.appendImport({...f.batch,completion:'PARTIAL',errors:['SOURCE_UNAVAILABLE']},[c]);expect((await repo.findCapture(c.id))?.payload).toBe('malformed response');await expect(repo.appendObservation(f.observation)).rejects.toThrow();
      await expect(repo.appendImport({...f.batch,id:'bad-manifest'},[c])).rejects.toThrow();
      const orphan=fundamentalFixture('orphan');await expect(repo.appendImport({...orphan.batch,sourceVersionId:'missing'},[{...orphan.capture,sourceVersionId:'missing'}])).rejects.toThrow();expect(await repo.findImport(orphan.batch.id)).toBeNull();
    }finally{await db.close();}
  });
  it('rejects unknown Security/capture/lineage and forged registry/formal production writes',async()=>{
    const db=await testDatabase();try{
      const {f,repo}=await seed(db);
      await expect(repo.appendObservation({...f.observation,scope:'FORMAL'})).rejects.toThrow();
      await expect(repo.appendObservation({...f.observation,securityId:'missing' as never})).rejects.toThrow();await expect(repo.appendObservation({...f.observation,rawCaptureId:'missing'})).rejects.toThrow();
      expect(()=>new PrismaFundamentals(db.client,{...release,registryHash:'0'.repeat(64)})).toThrow();
      await repo.appendObservation(f.observation);const next=fundamentalFixture('bad-rev');await repo.appendImport(next.batch,[next.capture]);
      await expect(repo.appendObservation({...next.observation,revisionKind:'PROVIDER_CORRECTION',supersedesObservationId:f.observation.id,revisionReason:'fixture',revisionEvidenceReference:'fixture',correctionKnownAt:next.observation.ingestedAt,publication:{...next.observation.publication,evidenceReference:'invented-new-publication'}})).rejects.toThrow();
    }finally{await db.close();}
  });
  it('guards UPDATE DELETE REPLACE and ON CONFLICT mutation at the database boundary',async()=>{
    const db=await testDatabase();try{
      const {f,repo}=await seed(db);await repo.appendObservation(f.observation);
      for(const table of ['fundamental_source_version','fundamental_import_batch','fundamental_raw_capture','fundamental_observation']) {
        for(const sql of [`UPDATE ${table} SET body='{}'`,`DELETE FROM ${table}`,`INSERT OR REPLACE INTO ${table} SELECT * FROM ${table}`,`INSERT INTO ${table} SELECT * FROM ${table} WHERE true ON CONFLICT(id) DO UPDATE SET body='{}'`])await expect(db.client.$executeRawUnsafe(sql)).rejects.toThrow();
      }
      await expect(db.client.$executeRawUnsafe("UPDATE fundamental_observation SET available_at='2026-06-30T00:00:00.000Z',availability_status='VERIFIED'")).rejects.toThrow();
      await expect(db.client.security.delete({where:{id:f.observation.securityId}})).rejects.toThrow();expect(await repo.findObservation(f.observation.id)).toEqual(f.observation);
    }finally{await db.close();}
  });
  it('detects body, scalar metadata and raw payload tampering on read',async()=>{
    const db=await testDatabase();try{
      const {f,repo}=await seed(db);await repo.appendObservation(f.observation);
      // Adversarial isolated owner bypass: never perform against a private database.
      await db.client.$executeRawUnsafe('DROP TRIGGER fundamental_observation_no_update');
      await db.client.$executeRawUnsafe("UPDATE fundamental_observation SET normalized_value='999'");await expect(repo.findObservation(f.observation.id)).rejects.toBeInstanceOf(DataIntegrityError);
      await db.client.$executeRawUnsafe('DROP TRIGGER fundamental_raw_capture_no_update');
      await db.client.$executeRawUnsafe("UPDATE fundamental_raw_capture SET body='{}'");await expect(repo.findCapture(f.capture.id)).rejects.toBeInstanceOf(DataIntegrityError);
    }finally{await db.close();}
  });
});
