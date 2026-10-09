// @vitest-environment node
import { describe,it,expect } from 'vitest';
import { join } from 'node:path';
import { testDatabase } from '../fixtures/database';
import { normalizationFixture,normalizationIssuer } from '../fixtures/normalization';
import { PrismaFundamentals } from '@/infrastructure/repositories/fundamentals';
import { PrismaFundamentalNormalization } from '@/infrastructure/repositories/fundamental-normalization';
import { RepositoryRawDocuments } from '@/infrastructure/fundamentals/raw-document';
import { FileDocumentQualifications } from '@/infrastructure/repositories/document-qualifications';
import { FundamentalDocumentGate } from '@/application/fundamentals/document-qualification';
import { NormalizeFundamentals } from '@/application/fundamentals/normalize';
import { normalizationHash } from '@/infrastructure/fundamentals/reviewed-statement';
import { release } from '../fixtures/fundamentals';
import { openDatabase } from '@/infrastructure/db/client';

async function setup(db:Awaited<ReturnType<typeof testDatabase>>) {
  await db.client.security.create({data:{id:normalizationIssuer.securityId,name:'Synthetic FPT fixture'}});
  const rawRepository=new PrismaFundamentals(db.client);
  const store=new FileDocumentQualifications(join(db.directory,'qualifications'));
  const gate=new FundamentalDocumentGate(new RepositoryRawDocuments(rawRepository),store);
  const repository=new PrismaFundamentalNormalization(db.client,gate);
  const seed=async(suffix:string)=>{
    const f=await normalizationFixture(suffix);
    if(!await rawRepository.findSource(f.collection.source.id)) await rawRepository.appendSource(f.collection.source);
    await rawRepository.appendImport(f.collection.batch,f.collection.captures);
    await gate.record(f.qualification);
    return f;
  };
  const f=await seed('first');
  const service=new NormalizeFundamentals(gate,repository,release,f.mapping,{hash:normalizationHash,now:()=> '2026-10-09T13:00:00.000Z'});
  return {rawRepository,store,gate,repository,seed,service,f};
}
const request=(f:Awaited<ReturnType<typeof normalizationFixture>>,id:string)=>({id,scope:'SYNTHETIC_TEST' as const,captureIds:f.ids,issuer:normalizationIssuer,extract:f.extract});

describe('qualification-bound normalization and immutable validation storage',()=>{
  it('persists validated observations, exact lineage and unknown publication/availability; reopens and rejects duplicate writes',async()=>{
    const db=await testDatabase();try{
      const s=await setup(db), before=await s.rawRepository.findCapture(s.f.ids[0]);
      const result=await s.service.run(request(s.f,'normalization-1'));
      expect(await s.repository.find(result.id)).toEqual(result);
      const observation=await s.rawRepository.findObservation(result.observations[0].id);
      expect(observation!.normalized.value).toBe('15123500000');expect(observation!.availability.availableAt).toBeNull();
      expect(await s.rawRepository.findCapture(s.f.ids[0])).toEqual(before);
      await expect(s.repository.append(result)).rejects.toThrow();
      expect(await db.client.fundamentalNormalization.count()).toBe(1);expect(await db.client.fundamentalObservation.count()).toBe(1);
      await db.client.$disconnect();const reopened=await openDatabase(db.config);
      try{expect(await new PrismaFundamentalNormalization(reopened,s.gate).find(result.id)).toEqual(result);}finally{await reopened.$disconnect();}
    }finally{await db.close();}
  },30_000);
  it('retains cross-receipt conflicts and unknown mappings as BLOCKED artifacts without overwriting prior facts',async()=>{
    const db=await testDatabase();try{
      const s=await setup(db), original=await s.service.run(request(s.f,'original-run'));
      const second=await s.seed('second'),extract={...second.extract,rows:[{...second.extract.rows[0],lexicalValue:'1'}]};
      const blocked=await s.service.run({...request(second,'conflict-run'),extract});
      expect(blocked.status).toBe('BLOCKED');expect(blocked.observations[0].quality).toBe('CONFLICTING');
      expect(await s.repository.find(blocked.id)).toEqual(blocked);
      expect(await db.client.fundamentalObservation.count()).toBe(1);
      expect(await s.rawRepository.findObservation(original.observations[0].id)).toEqual(original.observations[0]);
      const unknown=await s.service.run({...request(second,'unknown-run'),extract:{...second.extract,rows:[{...second.extract.rows[0],fieldId:'arbitrary-alias'}]}});
      expect(unknown.findings[0].code).toBe('UNKNOWN_FIELD_MAPPING');expect(unknown.observations).toEqual([]);
      expect(await s.repository.find(unknown.id)).toEqual(unknown);
      expect(await db.client.fundamentalNormalization.count()).toBe(3);
    }finally{await db.close();}
  },30_000);
  it('missing data stays null; corrected/revoked qualification and FORMAL unapproved maps block normalization',async()=>{
    const db=await testDatabase();try{
      const s=await setup(db);
      const extract={...s.f.extract,rows:[{...s.f.extract.rows[0],lexicalValue:null}]};
      const missing=await s.service.run({...request(s.f,'missing-run'),extract});
      expect(missing.status).toBe('PARTIAL');expect((await s.rawRepository.findObservation(missing.observations[0].id))!.normalized.value).toBeNull();
      await expect(s.service.run({...request(s.f,'formal-run'),scope:'FORMAL'})).rejects.toThrow();
      await s.gate.record({...s.f.qualification,id:'revoked',status:'REJECTED',supersedesQualificationId:s.f.qualification.id,correctionReason:'fixture evidence wrong'});
      await expect(s.service.run(request(s.f,'revoked-run'))).rejects.toThrow();
      expect(await s.repository.find(missing.id)).toEqual(missing); // audit read is not renewed eligibility
      expect(await db.client.fundamentalNormalization.count()).toBe(1);
    }finally{await db.close();}
  },30_000);
  it('atomic persistence rejects forged output/context and rollback leaves no partial artifact',async()=>{
    const db=await testDatabase();try{
      const s=await setup(db),result=s.f.result();
      await expect(s.repository.append({...result,observations:result.observations.map(o=>({...o,normalized:{...o.normalized,value:'999'}}))})).rejects.toThrow();
      expect(await db.client.fundamentalNormalization.count()).toBe(0);expect(await db.client.fundamentalObservation.count()).toBe(0);
      await s.service.run(request(s.f,'first-run'));
      const second=await s.seed('second');const stale=second.result();
      await expect(s.repository.append(stale)).rejects.toThrow(); // context gained a comparable observation
      expect(await db.client.fundamentalNormalization.count()).toBe(1);
      await expect(s.service.run(request(s.f,'duplicate-capture-new-id'))).rejects.toThrow();
      expect(await db.client.fundamentalNormalization.count()).toBe(1);
    }finally{await db.close();}
  },30_000);
  it('SQL mutation/replacement guards, restrictive foreign keys and read tamper detection hold',async()=>{
    const db=await testDatabase();try{
      const s=await setup(db),r=await s.service.run(request(s.f,'immutable-run'));
      await expect(db.client.$executeRaw`UPDATE fundamental_normalization SET status='BLOCKED' WHERE id=${r.id}`).rejects.toThrow();
      await expect(db.client.$executeRaw`DELETE FROM fundamental_normalization WHERE id=${r.id}`).rejects.toThrow();
      await expect(db.client.$executeRaw`INSERT OR REPLACE INTO fundamental_normalization SELECT * FROM fundamental_normalization WHERE id=${r.id}`).rejects.toThrow();
      await expect(db.client.fundamentalNormalization.create({data:{id:'bad-fk',securityId:'missing',sourceVersionId:r.sourceVersionId,
        importExecutionId:r.importExecutionId,rawCaptureId:r.rawCaptureId,recordedAt:r.recordedAt,status:r.status,body:'{}',bodyHash:'0'.repeat(64)}})).rejects.toThrow();
      const forged={...r,id:'forged-direct',observations:r.observations.map(o=>({...o,id:'forged-value',normalized:{...o.normalized,value:'0'}}))};
      await db.client.fundamentalNormalization.create({data:{id:forged.id,securityId:normalizationIssuer.securityId,sourceVersionId:r.sourceVersionId,
        importExecutionId:r.importExecutionId,rawCaptureId:r.rawCaptureId,recordedAt:r.recordedAt,status:r.status,body:JSON.stringify(forged),bodyHash:normalizationHash(forged)}});
      await expect(s.repository.find(forged.id)).rejects.toThrow();
      expect(await db.client.$queryRawUnsafe('PRAGMA foreign_key_check')).toEqual([]);
    }finally{await db.close();}
  },30_000);
});
