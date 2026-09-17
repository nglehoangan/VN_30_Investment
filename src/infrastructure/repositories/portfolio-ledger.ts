import type { PrismaClient, Prisma } from "@/infrastructure/db/generated/client";
import type { PortfolioLedger, PortfolioProjection, LedgerRead } from "@/ports/portfolio";
import { buildTransaction, type Transaction, type TransactionInput } from "@/domain/portfolio/transaction";
import { watermark, requireRule, type PortfolioId, type LedgerWatermark } from "@/domain/portfolio/values";
import type { PortfolioState } from "@/domain/portfolio/reconstruct";
import { ConflictError, DataIntegrityError, NotFoundError, AppError } from "@/shared/errors";
import { instant, vietnamBusinessDate, type Instant } from "@/shared/time";

type Storage = Prisma.TransactionClient;
function actionTerms(c: NonNullable<TransactionInput["corporateAction"]>) {
  return JSON.stringify({ id: c.id, subtype: c.subtype, numerator: c.numerator, denominator: c.denominator, evidence: c.evidence });
}
async function read(storage: Storage, id: PortfolioId, through?: LedgerWatermark): Promise<LedgerRead> {
  const portfolio = await storage.portfolio.findUnique({ where: { id } });
  if (!portfolio) throw new NotFoundError();
  const rows = await storage.ledgerTransaction.findMany({ where: { portfolioId: id, status: "POSTED" }, include: { corporateAction: true, legs: { orderBy: { sequence: "asc" } } } });
  if (through) requireRule(BigInt(through) <= BigInt(portfolio.revision), "FUTURE_LEDGER_WATERMARK");
  const loaded = rows.filter(row => !through || BigInt(row.revision) <= BigInt(through)).map(row => ({ row, saved: JSON.parse(row.facts) as Transaction }));
  // Canonical reconstruction detects malformed JSON facts, divergent legs and stale/unknown method payloads.
  const history = loaded.map(r => r.saved);
  for (const { row, saved } of loaded) {
    const before = history.filter(t => t.facts.id !== row.id && !(saved.facts.reversesId && t.facts.reversesId === saved.facts.reversesId));
    const rebuilt = buildTransaction(saved.facts, instant(row.createdAt), before);
    if (saved.facts.corporateAction && row.corporateAction?.terms !== actionTerms(saved.facts.corporateAction)) throw new DataIntegrityError();
    const legs = row.legs.map(l => ({ id: l.id, sequence: l.sequence, type: l.type, effectiveAt: l.effectiveAt, securityId: l.securityId, quantity: l.quantity, amount: l.amount, settlementReference: l.settlementReference }));
    if (JSON.stringify(rebuilt) !== JSON.stringify(saved) || JSON.stringify(rebuilt.legs) !== JSON.stringify(legs) || row.reversesId !== (saved.facts.reversesId ?? null) || row.settlesId !== (saved.facts.settlesId ?? null) || row.corporateActionId !== (saved.facts.corporateAction?.id ?? null) || row.idempotencyKey !== saved.facts.idempotencyKey || row.eventAt !== saved.facts.eventAt || row.securityId !== (saved.facts.securityId ?? null) || row.id !== saved.facts.id || row.type !== saved.facts.type || row.portfolioId !== saved.facts.portfolioId || row.legCount !== legs.length || row.source !== saved.facts.source.source || row.sourceReference !== saved.facts.source.reference || row.methodologyId !== saved.facts.methodologyId) throw new DataIntegrityError();
  }
  return { inceptionAt: instant(portfolio.inceptionAt), watermark: through ?? watermark(portfolio.revision), transactions: history };
}
export class PrismaPortfolioLedger implements PortfolioLedger {
  constructor(private readonly client: PrismaClient) {}
  async read(id: PortfolioId, through?: LedgerWatermark) {
    try { return await this.client.$transaction(tx => read(tx, id, through)); }
    catch (e) { if (e instanceof NotFoundError) throw e; throw new DataIntegrityError(); }
  }
  async commit(id: PortfolioId, expected: LedgerWatermark, prepare: (history: readonly Transaction[]) => readonly Transaction[]) {
    try {
      return await this.client.$transaction(async tx => {
        const next = watermark((BigInt(expected) + 1n).toString());
        // Write claim before read/validation: independent SQLite connections serialize or fail closed.
        const claimed = await tx.portfolio.updateMany({ where: { id, revision: expected }, data: { revision: next } });
        if (claimed.count !== 1) throw new ConflictError();
        const current = await read(tx, id), additions = prepare(current.transactions);
        requireRule(additions.length > 0, "EMPTY_COMMIT");
        const portfolio = await tx.portfolio.findUniqueOrThrow({ where: { id } });
        for (const t of additions) {
          const f = t.facts;
          requireRule(f.portfolioId === id && t.legs.every(l => l.effectiveAt >= portfolio.inceptionAt), "BEFORE_SUPPORTED_INCEPTION");
          if (f.type === "OPENING_BALANCE") requireRule(f.effectiveAt === portfolio.inceptionAt, "OPENING_REQUIRES_SUPPORTED_INCEPTION");
          const method = await tx.methodologyRecord.findUnique({ where: { methodologyId: f.methodologyId } });
          requireRule(method && method.implementationIdentity === t.accountingMethod && method.effectiveDate <= vietnamBusinessDate(f.effectiveAt), "ACCOUNTING_METHODOLOGY_UNAVAILABLE");
          if (f.corporateAction) {
            const terms = actionTerms(f.corporateAction), existing = await tx.corporateActionReference.findUnique({ where: { id: f.corporateAction.id } });
            if (existing) requireRule(existing.terms === terms, "CORPORATE_ACTION_REFERENCE_CONFLICT");
            else await tx.corporateActionReference.create({ data: { id: f.corporateAction.id, terms } });
          }
          await tx.ledgerTransaction.create({ data: { corporateActionId: f.corporateAction?.id ?? null, id: f.id, portfolioId: id, securityId: f.securityId ?? null,
            type: f.type, status: "PENDING", eventAt: f.eventAt, createdAt: t.createdAt, source: f.source.source,
            sourceReference: f.source.reference, idempotencyKey: f.idempotencyKey, methodologyId: f.methodologyId,
            revision: next, facts: JSON.stringify(t), legCount: t.legs.length, reversesId: f.reversesId ?? null, settlesId: f.settlesId ?? null } });
          for (const l of t.legs) await tx.ledgerLeg.create({ data: { ...l, transactionId: f.id } });
          await tx.ledgerTransaction.update({ where: { id: f.id }, data: { status: "POSTED" } });
        }
        return { inceptionAt: current.inceptionAt, watermark: next, transactions: [...current.transactions, ...additions] };
      });
    } catch (e) {
      if (e instanceof AppError) throw e;
      if (typeof e === "object" && e && "code" in e && ["P2002", "P2034", "P1008", "P2028"].includes(String(e.code))) throw new ConflictError();
      throw new DataIntegrityError();
    }
  }
}
export class PrismaPortfolioProjection implements PortfolioProjection {
  constructor(private readonly client: PrismaClient) {}
  async rebuild(state: PortfolioState, calculatedAt: Instant) {
    const data = { watermark: state.ledgerWatermark, asOf: state.asOf, calculatedAt, payload: JSON.stringify(state) };
    await this.client.$transaction(async tx => {
      const portfolio = await tx.portfolio.findUniqueOrThrow({ where: { id: state.portfolioId } });
      if (portfolio.revision !== state.ledgerWatermark) throw new ConflictError();
      await tx.portfolioProjection.upsert({ where: { portfolioId: state.portfolioId }, create: { portfolioId: state.portfolioId, ...data }, update: data });
    });
  }
  /** Always check the authoritative revision; a failed rebuild leaves the old row detectably STALE. */
  async inspect(id: PortfolioId) {
    return this.client.$transaction(async tx => {
      const p = await tx.portfolio.findUniqueOrThrow({ where: { id } });
      const row = await tx.portfolioProjection.findUnique({ where: { portfolioId: id } });
      return { status: row?.watermark === p.revision ? "VALID" : "STALE", watermark: row?.watermark ?? null } as const;
    });
  }
}
// Input transport is deliberately separate from the domain aggregate; no HTTP endpoint is exposed.
export type PortfolioCommandInput = TransactionInput;

export class PrismaPortfolioSetup {
  constructor(private readonly client: PrismaClient) {}
  async initialize(portfolio: import("@/ports/portfolio").PortfolioDefinition, securities: readonly import("@/ports/portfolio").SecurityDefinition[]) {
    try {
      await this.client.$transaction(async tx => {
        await tx.portfolio.create({ data: portfolio });
        for (const s of securities) {
          const existing = await tx.security.findUnique({ where: { id: s.id } });
          if (existing) { if (existing.name !== s.name) throw new ConflictError(); }
          else await tx.security.create({ data: s });
        }
      });
    } catch (e) { if (e instanceof AppError) throw e; throw new ConflictError(); }
  }
}
