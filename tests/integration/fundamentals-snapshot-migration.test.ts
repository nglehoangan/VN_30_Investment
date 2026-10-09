// @vitest-environment node
import { it,expect } from 'vitest';
import { testDatabase } from '../fixtures/database';
import { fundamentalFixture } from '../fixtures/fundamentals';
import { PrismaFundamentals } from '@/infrastructure/repositories/fundamentals';
it('upgrades populated Slice4 baseline additively and preserves every prior table, trigger and row',async()=>{
 const db=await testDatabase({snapshotBaseline:true});try{
  const f=fundamentalFixture(),repo=new PrismaFundamentals(db.client);await db.client.security.create({data:{id:f.observation.securityId,name:'Synthetic pre-snapshot issuer'}});await repo.appendSource(f.source);await repo.appendImport(f.batch,[f.capture]);await repo.appendObservation(f.observation);
  await db.client.fundamentalDerivation.create({data:{id:'old-derivation',securityId:f.observation.securityId,recordedAt:f.observation.ingestedAt,status:'N_R',body:'{"fixture":"prior immutable derivation"}',bodyHash:'0'.repeat(64)}});await db.client.fundamentalDerivationInput.create({data:{derivationId:'old-derivation',operand:0,position:0,observationId:f.observation.id}});
  const sql="SELECT name,type,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name",before=await db.client.$queryRawUnsafe<Array<{name:string;type:string;sql:string}>>(sql),tables=before.filter(s=>s.type==='table').map(s=>s.name),rows=new Map<string,unknown>();
  for(const t of tables){expect(t).toMatch(/^[a-z_]+$/);rows.set(t,await db.client.$queryRawUnsafe(`SELECT * FROM "${t}" ORDER BY rowid`));}
  expect(tables).not.toContain('fundamental_snapshot_content');expect(db.migration('migrate')).toBe(0);expect(db.migration('migrate')).toBe(0);
  const after=await db.client.$queryRawUnsafe<typeof before>(sql);for(const old of before)expect(after.find(s=>s.name===old.name)).toEqual(old);for(const t of tables)expect(await db.client.$queryRawUnsafe(`SELECT * FROM "${t}" ORDER BY rowid`)).toEqual(rows.get(t));
  expect(after.filter(s=>s.type==='table'&&!tables.includes(s.name)).map(s=>s.name)).toEqual(['data_initialization_acceptance','fundamental_availability_assessment','fundamental_snapshot_content','fundamental_snapshot_derived_member','fundamental_snapshot_member','fundamental_snapshot_run','scoring_dataset_binding']);expect(await repo.findObservation(f.observation.id)).toEqual(f.observation);expect(await db.client.$queryRawUnsafe('PRAGMA foreign_key_check')).toEqual([]);expect(db.migration('status')).toBe(0);
 }finally{await db.close();}
},30_000);
