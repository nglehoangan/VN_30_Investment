// @vitest-environment node
import { beforeEach, afterEach, it, expect } from "vitest";
import { testDatabase } from "../fixtures/database";
import { methodologyFixture } from "../fixtures/methodology";
import { PrismaPortfolioLedger, PrismaPortfolioSetup } from "@/infrastructure/repositories/portfolio-ledger";
import { initializePortfolio } from "@/application/portfolio/initialize";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { ACCOUNTING_METHOD } from "@/domain/portfolio/values";
import type { TransactionInput } from "@/domain/portfolio/transaction";
import type { PortfolioLedger } from "@/ports/portfolio";
import { DataIntegrityError, ConflictError, toPublicError } from "@/shared/errors";
import { P, A, at, method, deposit, buy, sell, settlement, reversal, input } from "../fixtures/portfolio/history";

const NOW = at(10);
let db: Awaited<ReturnType<typeof testDatabase>>, ledger: PrismaPortfolioLedger, engine: PortfolioEngine;
beforeEach(async () => {
  db = await testDatabase();
  await db.registry.append({ ...methodologyFixture(method), implementationIdentity: ACCOUNTING_METHOD });
  await initializePortfolio(new PrismaPortfolioSetup(db.client), { id: P, name: "review fixture", currency: "VND", inceptionAt: at(1), createdAt: NOW }, [{ id: A, name: "A" }]);
  ledger = new PrismaPortfolioLedger(db.client); engine = new PortfolioEngine(ledger, { now: () => NOW });
});
afterEach(async () => { await db?.close(); });
const post = async (f: TransactionInput) => engine.post([f], (await ledger.read(P)).watermark);
// Confirmed event now; economic transition later. A future eventAt is still speculative.
const confirmed = (f: TransactionInput): TransactionInput => ({ ...f, eventAt: NOW });
async function rejectUnchanged(f: TransactionInput, reason: string) {
  const before = await ledger.read(P), count = await db.client.ledgerTransaction.count();
  await expect(post(f)).rejects.toMatchObject({ code: "VALIDATION_ERROR", issues: [{ reason }] });
  expect(await ledger.read(P)).toEqual(before);
  expect(await db.client.ledgerTransaction.count()).toBe(count);
}
it("R2-C01 future oversell rejects before commit; 100 current shares and watermark remain unchanged", async () => {
  await post(deposit()); await post(buy());
  await rejectUnchanged(confirmed(sell("future-oversell", "200", "3000", 12)), "NEGATIVE_POSITION_ERROR");
  expect((await engine.reconstruct(P, NOW)).positions[0].quantity).toBe("100");
});
it("R2-C01 future BUY then SELL and both settlements are accepted at valid economic transitions", async () => {
  await post(deposit());
  expect(await post(confirmed(buy("future-buy", "100", "1000", 12)))).toMatchObject({ status: "POSTED", state: { positions: [] } });
  await post(confirmed(sell("future-sell", "100", "1500", 13)));
  await post(confirmed(settlement("buy-paid", "future-buy", "1000", 14)));
  await post(confirmed(settlement("sell-paid", "future-sell", "1500", 15)));
  expect(await engine.reconstruct(P, NOW)).toMatchObject({ cash: "10000", positions: [] });
  expect(await engine.reconstruct(P, at(12))).toMatchObject({ payables: "1000", positions: [{ quantity: "100", openCost: "1000" }] });
  expect(await engine.reconstruct(P, at(15))).toMatchObject({ cash: "10500", payables: "0", receivables: "0", realizedPnl: "500", positions: [{ quantity: "0", openCost: "0" }] });
});
it("R2-C01 future corporate-action duplicate EFFECTIVE stage is rejected before commit", async () => {
  await post(deposit()); await post(buy());
  const corporateAction = { id: "issuer-action", subtype: "SPLIT", numerator: "2", denominator: "1", evidence: "confirmed issuer terms", stage: "EFFECTIVE" as const };
  await post(confirmed(input("split-first", "CORPORATE_ACTION", 12, { securityId: A, quantity: "100", corporateAction })));
  await rejectUnchanged(confirmed(input("split-duplicate", "CORPORATE_ACTION", 13, { securityId: A, quantity: "200", corporateAction })), "DUPLICATE_CORPORATE_ACTION_STAGE");
});
it("R2-C01 future unfunded payable cannot hide beyond now", async () => {
  await post(deposit());
  await rejectUnchanged(confirmed(buy("unfunded", "100", "20000", 12, { price: "200" })), "UNFUNDED_PAYABLE_REQUIRES_REVIEW");
});
it("R2-C01 new earlier SELL cannot consume shares promised to an existing later future SELL", async () => {
  await post(deposit()); await post(buy());
  await post(confirmed(sell("later-sale", "100", "1500", 15)));
  await rejectUnchanged(confirmed(sell("earlier-sale", "100", "1500", 12)), "NEGATIVE_POSITION_ERROR");
});
it("R2-C01 validates intermediate boundaries even when final future quantity would recover", async () => {
  await post(deposit()); await post(buy());
  await post(confirmed(buy("late-buy", "100", "1000", 15)));
  await rejectUnchanged(confirmed(sell("early-oversell", "200", "3000", 12)), "NEGATIVE_POSITION_ERROR");
});
it("R2-C01 future excessive settlement is rejected atomically", async () => {
  await post(deposit()); await post(confirmed(buy("future-buy", "100", "1000", 12)));
  await rejectUnchanged(confirmed(settlement("too-much", "future-buy", "1001", 14)), "SETTLEMENT_MISMATCH");
});
it("R2-C01 future settlement before originating obligation is rejected", async () => {
  await post(deposit()); await post(confirmed(buy("future-buy", "100", "1000", 14)));
  await rejectUnchanged(confirmed(settlement("too-early", "future-buy", "1000", 12)), "UNMATCHED_OBLIGATION");
});
it("R2-C01 future reversal cannot invalidate an already committed later sale", async () => {
  await post(deposit()); await post(buy());
  await post(confirmed(sell("future-sell", "100", "1500", 15)));
  await rejectUnchanged(confirmed(reversal("future-reversal", "buy", 12)), "NEGATIVE_POSITION_ERROR");
});
it("R2-C01 future settled-trade correction preserves atomicity and reversal lineage", async () => {
  await post(deposit()); await post(buy()); await post(settlement("paid", "buy", "1000", 3));
  const group = { correctionGroupId: "future-fix" };
  await engine.post([confirmed(reversal("01-undo-paid", "paid", 12, group)), confirmed(reversal("02-undo-buy", "buy", 12, group)),
    confirmed(buy("03-replacement", "50", "500", 12, group))], (await ledger.read(P)).watermark);
  expect((await engine.reconstruct(P, NOW)).positions[0].quantity).toBe("100");
  expect(await engine.reconstruct(P, at(12))).toMatchObject({ cash: "10000", payables: "500", positions: [{ quantity: "50", openCost: "500" }] });
  expect((await ledger.read(P)).transactions.find(t => t.facts.id === "02-undo-buy")?.facts.reversesId).toBe("buy");
});
it("R2-C01 future speculative event is still rejected, separate from confirmed future effect", async () => {
  await rejectUnchanged(deposit("speculative", "100", 12), "FUTURE_SPECULATIVE_POSTING");
});

const sensitive = "SELECT secret FROM ledger /private/customer.sqlite stack: secret-token";
it("R2-M01 projection infrastructure failure preserves ledger without claiming accounting corruption", async () => {
  const e = new PortfolioEngine(ledger, { now: () => NOW }, { rebuild: async () => { throw new Error(sensitive); } });
  const result = await e.post([deposit()], (await ledger.read(P)).watermark);
  expect(result).toMatchObject({ status: "POSTED", ledgerWatermark: "1", portfolioTrust: "VALID", projectionStatus: "BLOCKED", actionabilityBlocked: true, reason: "PROJECTION_REBUILD_REQUIRED" });
  expect(await db.client.ledgerTransaction.count()).toBe(1);
  expect((await engine.reconstruct(P, NOW)).cash).toBe("10000");
  expect(JSON.stringify(result)).not.toContain(sensitive);
});
it.each([false, true])("R2-M01 concurrent watermark produces STALE even if rebuild throws ConflictError=%s", async (fail) => {
  const e = new PortfolioEngine(ledger, { now: () => NOW }, { rebuild: async () => {
    await post(deposit("concurrent", "100", 2));
    if (fail) throw new ConflictError();
  } });
  const result = await e.post([deposit()], (await ledger.read(P)).watermark);
  expect(result).toMatchObject({ status: "POSTED", ledgerWatermark: "1", projectionStatus: "STALE", portfolioTrust: "STALE", reason: "LEDGER_ADVANCED", actionabilityBlocked: true });
  expect((await ledger.read(P)).watermark).toBe("2"); expect(await db.client.ledgerTransaction.count()).toBe(2);
});
it("R2-M01 unexpected post-commit reconstruction failure explicitly blocks trust without compensation", async () => {
  // Real commit succeeds; an adapter fault corrupts only its returned accounting-method payload.
  const faulty: PortfolioLedger = { read: (id, through) => ledger.read(id, through), commit: async (id, expected, prepare) => {
    const saved = await ledger.commit(id, expected, prepare);
    return { ...saved, transactions: saved.transactions.map(t => ({ ...t, accountingMethod: "unsupported" as typeof ACCOUNTING_METHOD })) };
  } };
  const e = new PortfolioEngine(faulty, { now: () => NOW });
  const result = await e.post([deposit()], (await ledger.read(P)).watermark);
  expect(result).toMatchObject({ status: "POSTED", ledgerWatermark: "1", portfolioTrust: "BLOCKED", actionabilityBlocked: true, reason: "POST_COMMIT_INTEGRITY_FAILURE", error: { code: "DATA_INTEGRITY_ERROR" }, diagnostics: { phase: "RECONSTRUCTION", code: "VALIDATION_ERROR" } });
  expect(await db.client.ledgerTransaction.count()).toBe(1);
  expect((await engine.reconstruct(P, NOW)).cash).toBe("10000");
});
it("R2-M01 typed integrity error from projection is not an ordinary rebuild failure", async () => {
  const e = new PortfolioEngine(ledger, { now: () => NOW }, { rebuild: async () => { throw new DataIntegrityError({ cause: new Error(sensitive) }); } });
  const result = await e.post([deposit()], (await ledger.read(P)).watermark);
  expect(result).toMatchObject({ reason: "POST_COMMIT_INTEGRITY_FAILURE", portfolioTrust: "BLOCKED", diagnostics: { phase: "PROJECTION", code: "DATA_INTEGRITY_ERROR" } });
  expect(JSON.stringify(result)).not.toContain(sensitive);
  expect(await db.client.ledgerTransaction.count()).toBe(1);
});
it("R2-M01 post-commit integrity read failure is explicit and contains only safe diagnostics", async () => {
  const faulty: PortfolioLedger = { commit: (id, expected, prepare) => ledger.commit(id, expected, prepare), read: async () => { throw new DataIntegrityError({ cause: new Error(sensitive) }); } };
  const e = new PortfolioEngine(faulty, { now: () => NOW });
  const result = await e.post([deposit()], (await ledger.read(P)).watermark);
  expect(result).toMatchObject({ status: "POSTED", portfolioTrust: "BLOCKED", reason: "POST_COMMIT_INTEGRITY_FAILURE", diagnostics: { phase: "CURRENTNESS", code: "DATA_INTEGRITY_ERROR" } });
  expect(JSON.stringify(result)).not.toMatch(/SELECT|customer\.sqlite|secret-token|stack/);
  expect(await db.client.ledgerTransaction.count()).toBe(1);
});

it.each(["malformed-json", "column-mismatch", "leg-mismatch", "unknown-method", "action-terms"] as const)("R2-m03 persisted %s rejects with safe DataIntegrityError", async kind => {
  await post(deposit());
  if (kind === "action-terms") {
    await post(buy());
    await post(input("split", "CORPORATE_ACTION", 3, { securityId: A, quantity: "100", corporateAction: { id: "issuer", subtype: "SPLIT", numerator: "2", denominator: "1", evidence: "official", stage: "EFFECTIVE" } }));
    // Only in this disposable fixture: emulate corruption/restore damage, never change production guards.
    await db.client.$executeRawUnsafe("DROP TRIGGER action_reference_update");
    await db.client.corporateActionReference.update({ where: { id: "issuer" }, data: { terms: '{}' } });
  } else if (kind === "leg-mismatch") {
    await db.client.$executeRawUnsafe("DROP TRIGGER ledger_leg_update");
    await db.client.ledgerLeg.updateMany({ where: { transactionId: "deposit" }, data: { amount: "999" } });
  } else {
    await db.client.$executeRawUnsafe("DROP TRIGGER ledger_header_update");
    if (kind === "malformed-json") {
      await db.client.$executeRawUnsafe("PRAGMA ignore_check_constraints=ON");
      await db.client.ledgerTransaction.update({ where: { id: "deposit" }, data: { facts: '{malformed' } });
    } else if (kind === "column-mismatch") {
      await db.client.ledgerTransaction.update({ where: { id: "deposit" }, data: { source: sensitive } });
    } else {
      const row = await db.client.ledgerTransaction.findUniqueOrThrow({ where: { id: "deposit" } });
      const facts = JSON.parse(row.facts); facts.accountingMethod = "unknown-version";
      await db.client.ledgerTransaction.update({ where: { id: "deposit" }, data: { facts: JSON.stringify(facts) } });
    }
  }
  await expect(ledger.read(P)).rejects.toBeInstanceOf(DataIntegrityError);
  await expect(engine.reconstruct(P, NOW)).rejects.toBeInstanceOf(DataIntegrityError);
  const failure = await ledger.read(P).catch(error => error);
  const publicError = toPublicError(failure);
  expect(publicError).toEqual({ code: "DATA_INTEGRITY_ERROR", message: "Không thể xác nhận tính toàn vẹn của dữ liệu." });
  expect(JSON.stringify(publicError)).not.toMatch(/SELECT|sqlite|secret|stack|cause/i);
});
