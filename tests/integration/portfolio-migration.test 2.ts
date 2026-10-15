// @vitest-environment node
import { it, expect } from "vitest";
import { testDatabase } from "../fixtures/database";
import { methodologyFixture } from "../fixtures/methodology";
import { ACCOUNTING_METHOD } from "@/domain/portfolio/values";
import { PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { P, NOW, at, method, W0, deposit } from "../fixtures/portfolio/history";
it("populated M6.2 -> M6.3 additive migration preserves config records and replays fixture", async () => {
  const db = await testDatabase({ foundationOnly: true });
  try {
    const record = { ...methodologyFixture(method), implementationIdentity: ACCOUNTING_METHOD };
    await db.registry.append(record);
    const before = await db.client.$queryRaw<Array<{ name: string }>>`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`;
    expect(before.map(t => t.name)).toEqual(["_prisma_migrations", "methodology_record"]);
    expect(db.migration("migrate")).toBe(0); expect(db.migration("status")).toBe(0); expect(await db.registry.findById(method)).toEqual(record);
    await db.client.portfolio.create({ data: { id: P, name: "upgrade test", currency: "VND", inceptionAt: at(1), createdAt: NOW } });
    const engine = new PortfolioEngine(new PrismaPortfolioLedger(db.client), { now: () => NOW });
    expect(await engine.post([deposit()], W0)).toMatchObject({ status: "POSTED", state: { cash: "10000" } });
    expect(db.migration("migrate")).toBe(0); expect(await db.registry.findById(method)).toEqual(record);
  } finally { await db.close(); }
});
