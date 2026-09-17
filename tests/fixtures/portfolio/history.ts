import { instant, dateOnly } from "@/shared/time";
import { methodologyId } from "@/shared/ids";
import { portfolioId, transactionId, securityId, sourceReference, watermark } from "@/domain/portfolio/values";
import { buildTransaction, type TransactionInput, type Transaction } from "@/domain/portfolio/transaction";
export const P = portfolioId("portfolio-test"), A = securityId("security-a"), B = securityId("security-b");
export const NOW = instant("2026-09-16T12:00:00.000Z");
export const at = (day: number) => instant(`2026-01-${String(day).padStart(2, "0")}T09:00:00.000Z`);
export const method = methodologyId("accounting-test-v1");
export const W0 = watermark("0");
export function input(id: string, type: TransactionInput["type"], day: number, extra: Partial<TransactionInput> = {}): TransactionInput {
  return { id: transactionId(id), portfolioId: P, type, eventAt: at(day), effectiveAt: at(day), currency: "VND", source: sourceReference("FIXTURE", id), idempotencyKey: id, methodologyId: method, ...extra };
}
export const deposit = (id = "deposit", amount = "10000", day = 1) => input(id, "CASH_DEPOSIT", day, { amount });
export const buy = (id = "buy", quantity = "100", amount = "1000", day = 2, extra: Partial<TransactionInput> = {}) => input(id, "BUY", day, { securityId: A, quantity, price: "10", amount, tradeDate: dateOnly(`2026-01-${String(day).padStart(2, "0")}`), representation: "NET_SETTLEMENT", ...extra });
export const sell = (id = "sell", quantity = "60", amount = "900", day = 8, extra: Partial<TransactionInput> = {}) => input(id, "SELL", day, { securityId: A, quantity, price: "15", amount, tradeDate: dateOnly(`2026-01-${String(day).padStart(2, "0")}`), representation: "NET_SETTLEMENT", ...extra });
export const settlement = (id: string, settlesId: string, amount: string, day: number) => input(id, "TRADE_SETTLEMENT", day, { settlesId: transactionId(settlesId), amount, settlementDate: dateOnly(`2026-01-${String(day).padStart(2, "0")}`) });
export const reversal = (id: string, reversesId: string, day: number, extra: Partial<TransactionInput> = {}) => input(id, "REVERSAL", day, { reversesId: transactionId(reversesId), ...extra });
export function history(inputs: readonly TransactionInput[]): Transaction[] {
  const result: Transaction[] = []; for (const f of inputs) result.push(buildTransaction(f, NOW, result)); return result;
}
export const goldenInputs = () => [deposit(), buy("buy-a1", "100", "1000", 2, { fee: "10" }), settlement("settle-a1", "buy-a1", "1010", 3),
  buy("buy-a2", "50", "600", 4, { price: "12" }), settlement("settle-a2", "buy-a2", "600", 5),
  buy("buy-b", "20", "1000", 6, { securityId: B, price: "50" }), settlement("settle-b", "buy-b", "1000", 7),
  sell("sell-a", "60", "900", 8, { fee: "9", tax: "1" }), settlement("settle-sale", "sell-a", "890", 9),
  input("dividend", "DIVIDEND_CASH", 10, { securityId: A, dividend: { gross: "100", withholding: "5", net: "95" } }),
  input("fee", "FEE", 11, { amount: "5" }), input("withdraw", "CASH_WITHDRAWAL", 12, { amount: "100" })];
