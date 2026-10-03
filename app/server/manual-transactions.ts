import "server-only";
import { sealConfirmation, openConfirmation } from "@/infrastructure/dashboard-support";
import { runtime } from "./runtime";
import type { PrismaClient } from "@/infrastructure/db/generated/client";
import { PrismaPortfolioLedger, PrismaPortfolioProjection } from "@/infrastructure/repositories/portfolio-ledger";
import { parsePortfolioCommands } from "@/infrastructure/repositories/portfolio-command-schema";
import { manualTransactionSchema } from "@/shared/validation/manual-transaction";
import { prepareCandidate } from "@/application/portfolio/candidate";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { ACCOUNTING_METHOD, decimal, portfolioId, watermark } from "@/domain/portfolio/values";
import { instant, dateOnly } from "@/shared/time";
import { ConflictError, ValidationError } from "@/shared/errors";
import type { Clock } from "@/ports/runtime";
import type { TransactionInput } from "@/domain/portfolio/transaction";
const invalid = () => new ValidationError([{ field: "$", reason: "Invalid or expired confirmation", expected: "Fresh server-validated transaction preview" }]);
export function assertLocalOrigin(origin: string | null, host: string | null) {
  if (!origin || !host) throw invalid();
  const url = new URL(origin);
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || url.host !== host) throw invalid();
}
export async function previewTransaction(client: PrismaClient, payload: unknown, clock: Clock) {
  const parsed = manualTransactionSchema.safeParse(payload);
  if (!parsed.success) throw invalid();
  const d = parsed.data;
  const portfolios = await client.portfolio.findMany({ take: 2 });
  if (portfolios.length !== 1) throw invalid();
  const p = portfolios[0], now = clock.now();
  dateOnly(d.date);
  const at = instant(new Date(`${d.date}T${d.time}:00+07:00`).toISOString());
  const method = await client.methodologyRecord.findFirst({ where: { implementationIdentity: ACCOUNTING_METHOD, governanceStatus: "APPROVED", intendedUse: "PRODUCTION", effectiveDate: { lte: d.date } }, orderBy: { effectiveDate: "desc" } });
  if (!method || at < p.inceptionAt || at > now) throw invalid();
  const ledger = new PrismaPortfolioLedger(client), read = await ledger.read(portfolioId(p.id));
  const id = runtime.ids.next(), trade = d.type === "BUY" || d.type === "SELL";
  const command = parsePortfolioCommands([{
    id, portfolioId: p.id, type: d.type, eventAt: at, effectiveAt: at, currency: "VND", methodologyId: method.methodologyId,
    source: { source: "MANUAL_UI", reference: d.sourceReference }, idempotencyKey: id,
    ...(trade ? { securityId: d.security, quantity: d.quantity, price: d.price, amount: decimal(d.quantity).mul(decimal(d.price)).toString(), fee: d.fee || "0", tax: d.tax || "0", tradeDate: d.date, representation: "NET_SETTLEMENT" } : d.type === "REVERSAL" ? { reversesId: d.reference } : d.type === "DIVIDEND_CASH" ? { securityId: d.security, dividend: { net: d.amount, gross: null, withholding: null } } : { amount: d.amount }),
    ...(d.type === "TRADE_SETTLEMENT" ? { settlesId: d.reference, settlementDate: d.date } : {}),
  }])[0];
  if (command.securityId && !await client.security.findUnique({ where: { id: command.securityId } })) throw invalid();
  const transaction = prepareCandidate(portfolioId(p.id), read.transactions, [command], now, watermark((BigInt(read.watermark) + 1n).toString()))[0];
  return { token: sealConfirmation({ command, expected: read.watermark, expires: Date.parse(now) + 600000 }), transaction };
}
export async function confirmTransaction(client: PrismaClient, token: unknown, clock: Clock) {
  const saved = openConfirmation(token) as { command: TransactionInput; expected: string; expires: number };
  if (saved.expires < Date.parse(clock.now())) throw invalid();
  const command = parsePortfolioCommands([saved.command]);
  const method = await client.methodologyRecord.findUnique({ where: { methodologyId: command[0].methodologyId } });
  if (!method || method.governanceStatus !== "APPROVED" || method.intendedUse !== "PRODUCTION" || method.implementationIdentity !== ACCOUNTING_METHOD) throw invalid();
  const p = await client.portfolio.findUnique({ where: { id: command[0].portfolioId } });
  if (!p || p.revision !== saved.expected) throw new ConflictError();
  const result = await new PortfolioEngine(new PrismaPortfolioLedger(client), clock, new PrismaPortfolioProjection(client)).post(command, watermark(saved.expected));
  return { result, transactionId: command[0].id };
}
