// @vitest-environment node
import {expectPreservedSchema,migrateAndRepeat,ledgerStructure,assertLedgerGuards} from '../fixtures/migration-invariants';
import { it,expect } from 'vitest';
import { testDatabase } from '../fixtures/database';
import { fundamentalFixture } from '../fixtures/fundamentals';
import { fixture as scoringFixture } from '../fixtures/scoring';
import { methodologyFixture } from '../fixtures/methodology';
import { P,NOW,at,method,W0,goldenInputs,A,B,reversal } from '../fixtures/portfolio/history';
import { ACCOUNTING_METHOD } from '@/domain/portfolio/values';
import { PortfolioEngine } from '@/application/portfolio/engine';
import { PrismaPortfolioLedger,PrismaPortfolioProjection } from '@/infrastructure/repositories/portfolio-ledger';
import { PrismaAnalyticalArtifacts } from '@/infrastructure/repositories/analytical-artifacts';
import { calculateScorecard } from '@/domain/scoring/scorecard';
import { PrismaFundamentals } from '@/infrastructure/repositories/fundamentals';
import { sha } from '../fixtures/fundamentals';
it('populated latest baseline upgrade, repeat deployment and all previous rows/triggers/portfolio replay are preserved',async()=>{
  const db=await testDatabase({fundamentalsBaseline:true});try {
    await db.client.portfolio.create({data:{id:P,name:'Synthetic migration portfolio',currency:'VND',inceptionAt:at(1),createdAt:NOW}});
    await db.registry.append({...methodologyFixture(method),implementationIdentity:ACCOUNTING_METHOD});
    await db.client.security.createMany({data:[{id:A,name:'A'},{id:B,name:'B'}]});
    const engine=new PortfolioEngine(new PrismaPortfolioLedger(db.client),{now:()=>NOW},new PrismaPortfolioProjection(db.client));
    let expected=W0;for(const input of [...goldenInputs(),reversal('reverse-fee','fee',13)])expected=(await engine.post([input],expected)).ledgerWatermark;
    const card=scoringFixture();await db.registry.append(card.methodology);await new PrismaAnalyticalArtifacts(db.client).append(calculateScorecard(card));
    await db.client.brokerObservation.create({data:{id:'synthetic-capture',kind:'TEST_ONLY',receivedAt:NOW,body:'{"synthetic":true}',bodyHash:sha('{"synthetic":true}')}});
    const schema=await db.client.$queryRawUnsafe<Array<{name:string;type:string;sql:string}>>("SELECT name,type,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name");
    const tables=schema.filter(t=>t.type==='table').map(t=>t.name);
    expect(tables).not.toContain('fundamental_observation');
    const before=new Map<string,unknown>();for(const table of tables){expect(table).toMatch(/^[a-z_]+$/);before.set(table,await db.client.$queryRawUnsafe(`SELECT * FROM "${table}" ORDER BY rowid`));}
    const structure=ledgerStructure(db.config.filePath),replay=await engine.reconstruct(P,NOW);await migrateAndRepeat(db);
    for(const table of tables)expect(await db.client.$queryRawUnsafe(`SELECT * FROM "${table}" ORDER BY rowid`)).toEqual(before.get(table));
    const after=await db.client.$queryRawUnsafe<Array<{name:string;type:string;sql:string}>>("SELECT name,type,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name");
    expectPreservedSchema(schema,after);
    const fresh=await testDatabase();try{expect(await fresh.client.$queryRawUnsafe("SELECT name,type,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name")).toEqual(after);}finally{await fresh.close();}
    expect(after.filter(s=>s.type==='table'&&!tables.includes(s.name)).map(s=>s.name).sort()).toEqual(["data_initialization_acceptance","dependency_object_identity","dependency_release","dividend_receipt_owner","dividend_settlement_audit","forward_intake_event","fundamental_admission_run","fundamental_availability_assessment","fundamental_derivation","fundamental_derivation_input","fundamental_disposition_release","fundamental_import_batch","fundamental_normalization","fundamental_observation","fundamental_raw_capture","fundamental_snapshot_content","fundamental_snapshot_derived_member","fundamental_snapshot_member","fundamental_snapshot_run","fundamental_source_version","market_boundary_decision_seal","market_boundary_dependency_head","market_boundary_ranking_publication","market_boundary_record","production_dependency_publication","scoring_dataset_binding"]);
    expect(ledgerStructure(db.config.filePath)).toEqual(structure);assertLedgerGuards(db.config.filePath);
    expect(await engine.reconstruct(P,NOW)).toEqual(replay);expect(await db.client.$queryRawUnsafe('PRAGMA foreign_key_check')).toEqual([]);
    const f=fundamentalFixture();await db.client.security.create({data:{id:f.observation.securityId,name:'Test issuer'}});const repo=new PrismaFundamentals(db.client);await repo.appendSource(f.source);await repo.appendImport(f.batch,[f.capture]);await repo.appendObservation(f.observation);expect(await repo.findObservation(f.observation.id)).toEqual(f.observation);
    expect(db.migration('status')).toBe(0);
  }finally{await db.close();}
});
