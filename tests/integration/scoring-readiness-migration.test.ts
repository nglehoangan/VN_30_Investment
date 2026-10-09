// @vitest-environment node
import {it,expect} from 'vitest';
import {testDatabase} from '../fixtures/database';
import {setupScoringReadiness} from '../fixtures/scoring-readiness-db';
import {fixture} from '../fixtures/scoring';
import {calculateScorecard} from '@/domain/scoring/scorecard';
it('populated Slice05 upgrade preserves every old table, trigger, snapshot and historical score without retroactive bindings',async()=>{
 const db=await testDatabase({readinessBaseline:true});try{
  const f=await setupScoringReadiness(db,false),old={...fixture(),id:'pre-slice6-score'};await db.registry.append(old.methodology);await f.artifacts.append(calculateScorecard(old));
  const query="SELECT name,type,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name",before=await db.client.$queryRawUnsafe<Array<{name:string;type:string;sql:string}>>(query),tables=before.filter(r=>r.type==='table').map(r=>r.name),rows=new Map<string,unknown>();
  expect(tables).not.toContain('data_initialization_acceptance');for(const t of tables){expect(t).toMatch(/^[a-z_]+$/);rows.set(t,await db.client.$queryRawUnsafe(`SELECT * FROM "${t}" ORDER BY rowid`));}
  expect(db.migration('migrate')).toBe(0);expect(db.migration('migrate')).toBe(0);
  const after=await db.client.$queryRawUnsafe<typeof before>(query);for(const r of before)expect(after.find(v=>v.name===r.name)).toEqual(r);for(const t of tables)expect(await db.client.$queryRawUnsafe(`SELECT * FROM "${t}" ORDER BY rowid`)).toEqual(rows.get(t));
  expect(after.filter(r=>r.type==='table'&&!tables.includes(r.name)).map(r=>r.name)).toEqual(['data_initialization_acceptance','scoring_dataset_binding']);expect(await db.client.scoringDatasetBinding.count()).toBe(0);expect(await db.client.dataInitializationAcceptance.count()).toBe(0);expect(await f.snapshots.findRun(f.request.runId)).toEqual(f.snapshot);expect(await f.artifacts.find(old.id)).toEqual(calculateScorecard(old));
  await f.datasets.appendAcceptance(f.acceptance);const card=await f.engine.score(f.input,f.selection);expect(await f.datasets.findBinding(card.id)).not.toBeNull();expect(await db.client.$queryRawUnsafe('PRAGMA foreign_key_check')).toEqual([]);expect(db.migration('status')).toBe(0);
 }finally{await db.close();}
},30_000);
