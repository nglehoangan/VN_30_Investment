// @vitest-environment node
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testDatabase } from "../fixtures/database";
import { adapterEvidence } from "../fixtures/nav-adapter-evidence";
import { isolatedNavAdapters } from "../fixtures/nav-adapter-composition";
import { methodologyFixture } from "../fixtures/methodology";
import { navHistory, NP, NS, NI, NC, NT, navMethod, nh } from "../fixtures/current-nav";
import { initializePortfolio } from "@/application/portfolio/initialize";
import { PrismaPortfolioLedger, PrismaPortfolioSetup } from "@/infrastructure/repositories/portfolio-ledger";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { ACCOUNTING_METHOD } from "@/domain/portfolio/values";
import { PortfolioNavLedgerReader } from "@/application/current-nav/ledger-read-adapter";
import { ImmutableBrokerEvidenceReader } from "@/infrastructure/current-nav/broker-evidence-reader";

describe("SliceA disposable SQLite integration (synthetic only)", () => {
 let db: Awaited<ReturnType<typeof testDatabase>>, e: Awaited<ReturnType<typeof adapterEvidence>>, ledger: PrismaPortfolioLedger;
 beforeAll(async () => {
  db = await testDatabase({ portfolioOnly: true }); e = await adapterEvidence();
  await db.registry.append({ ...methodologyFixture(navMethod), implementationIdentity: ACCOUNTING_METHOD });
  await initializePortfolio(new PrismaPortfolioSetup(db.client), { id: NP, name: "SYNTHETIC_ONLY", currency: "VND", inceptionAt: NI, createdAt: NC }, [{ id: NS, name: "SyntheticA" }]);
  ledger = new PrismaPortfolioLedger(db.client); const setup = new PortfolioEngine(ledger, { now: () => NC });
  for (const t of navHistory()) await setup.post([t.facts], (await ledger.read(NP)).watermark);
 });
 afterAll(async () => { await e?.close(); await db?.close(); });
 it("repository integrity, ledger snapshot and isolated composition leave every financial row/revision unchanged", async () => {
  const before = await db.client.ledgerTransaction.findMany({ include: { legs: true }, orderBy: { id: "asc" } });
  const request = { ...e.fixture.request, ledgerRevision: "3" };
  const snapshot = await new PortfolioNavLedgerReader(ledger, nh).snapshot(request, NT);
  expect(snapshot.state).toMatchObject({ cash: "1000", receivables: "30", payables: "10" });
  expect(snapshot.ledger.transactions).toHaveLength(3);
  const app = isolatedNavAdapters(ledger, new ImmutableBrokerEvidenceReader(e.directory), { portfolioId: NP, accountId: e.observation.accountId, perimeterId: e.observation.perimeterId, valuationAt: NT, evidence: [e.pin] }, { now: () => NC }, nh);
  const result = await app.read(request);
  expect(result.nav).toMatchObject({ navState: "NAV_BLOCKED", totalNav: null, indicativeValue: null, productionAuthorized: false, scoringAuthorized: false, snapshotPersisted: false });
  expect(result.preparation?.reasons).toContain("SOURCE_AUTHORITY_MISSING");
  expect(await db.client.ledgerTransaction.findMany({ include: { legs: true }, orderBy: { id: "asc" } })).toEqual(before);
  expect((await ledger.read(NP)).watermark).toBe("3");
 });
 it("corrupt saved transaction or leg fails repository integrity and blocks adapter output", async () => {
  const row = await db.client.ledgerLeg.findFirstOrThrow({ where: { amount: { not: null } } });
  // Existing immutable trigger must deny modification. Fault injection below is ONLY in this disposable database.
  await expect(db.client.ledgerLeg.update({ where: { id: row.id }, data: { amount: "999" } })).rejects.toThrow();
  const triggers = await db.client.$queryRawUnsafe<{ sql: string }[]>("SELECT sql FROM sqlite_master WHERE type='trigger' AND name='ledger_leg_update'");
  expect(triggers).toHaveLength(1);
  await db.client.$executeRawUnsafe("DROP TRIGGER ledger_leg_update");
  try {
    await db.client.ledgerLeg.update({ where: { id: row.id }, data: { amount: "999" } });
    await expect(new PortfolioNavLedgerReader(ledger, nh).snapshot({ ...e.fixture.request, ledgerRevision: "3" }, NT)).rejects.toThrow();
  } finally {
    await db.client.ledgerLeg.update({ where: { id: row.id }, data: { amount: row.amount } });
    await db.client.$executeRawUnsafe(triggers[0].sql);
  }

 });
});
