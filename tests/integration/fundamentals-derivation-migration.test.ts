// @vitest-environment node
import { it,expect } from 'vitest';
import { testDatabase } from '../fixtures/database';
import { fundamentalFixture } from '../fixtures/fundamentals';
import { PrismaFundamentals } from '@/infrastructure/repositories/fundamentals';
it('upgrades populated Slice 3 baseline additively, preserves every old table/trigger/row and repeats deployment',async()=>{
  const db=await testDatabase({derivationBaseline:true});try{
    const f=fundamentalFixture(),repo=new PrismaFundamentals(db.client);
    await db.client.security.create({data:{id:f.observation.securityId,name:'Synthetic pre-derivation issuer'}});
    await repo.appendSource(f.source);await repo.appendImport(f.batch,[f.capture]);await repo.appendObservation(f.observation);
    await db.client.fundamentalNormalization.create({data:{id:'old-normalization-fixture',securityId:f.observation.securityId,sourceVersionId:f.source.id,importExecutionId:f.batch.id,rawCaptureId:f.capture.id,recordedAt:f.observation.ingestedAt,status:'BLOCKED',body:'{"fixture":"synthetic prior immutable row"}',bodyHash:'0'.repeat(64)}});
    const schema=await db.client.$queryRawUnsafe<Array<{name:string;type:string;sql:string}>>("SELECT name,type,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name");
    const tables=schema.filter(s=>s.type==='table').map(s=>s.name),before=new Map<string,unknown>();
    expect(tables).not.toContain('fundamental_derivation');
    for(const table of tables){expect(table).toMatch(/^[a-z_]+$/);before.set(table,await db.client.$queryRawUnsafe(`SELECT * FROM "${table}" ORDER BY rowid`));}
    expect(db.migration('migrate')).toBe(0);expect(db.migration('migrate')).toBe(0);
    const after=await db.client.$queryRawUnsafe<Array<{name:string;type:string;sql:string}>>("SELECT name,type,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name");
    for(const old of schema)expect(after.find(s=>s.name===old.name)).toEqual(old);
    for(const table of tables)expect(await db.client.$queryRawUnsafe(`SELECT * FROM "${table}" ORDER BY rowid`)).toEqual(before.get(table));
    expect(after.filter(s=>s.type==='table'&&!tables.includes(s.name)).map(s=>s.name)).toEqual(['data_initialization_acceptance','fundamental_availability_assessment','fundamental_derivation','fundamental_derivation_input','fundamental_snapshot_content','fundamental_snapshot_derived_member','fundamental_snapshot_member','fundamental_snapshot_run','scoring_dataset_binding']);
    expect(await repo.findObservation(f.observation.id)).toEqual(f.observation);
    expect(await db.client.$queryRawUnsafe('PRAGMA foreign_key_check')).toEqual([]);
    expect(db.migration('status')).toBe(0);
  }finally{await db.close();}
},30_000);
