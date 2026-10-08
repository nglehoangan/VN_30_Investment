import { z } from "zod";
import { parseBoundary } from "@/shared/validation/parse";
import { decimal } from "@/domain/portfolio/values";
import { instant, dateOnly } from "@/shared/time";
import type { BrokerSnapshot } from "@/domain/portfolio/broker-snapshot";

const amount = z.string().regex(/^(0|[1-9]\d{0,29})(\.\d{1,12})?$/);
const quantity = z.string().regex(/^(0|[1-9]\d{0,29})$/);
const time = z.string().refine(value => { try { instant(value); return true; } catch { return false; } });
const day = z.string().refine(value => { try { dateOnly(value); return true; } catch { return false; } });
const schema = z.strictObject({
  format: z.literal("vvios-broker-snapshot-v1"), broker: z.string().min(1).max(50), currency: z.literal("VND"),
  timeBasis: z.literal("RETRIEVED_AT").optional(), holdingsAsOf: time, cashAsOf: time, trackingStartDate: day,
  positions: z.array(z.strictObject({ symbol: z.string().regex(/^[A-Z0-9_]{1,30}$/),
    status: z.enum(["Giao dịch", "Chờ giao dịch", "Chờ về", "Chưa khả dụng"]), quantity, unitCost: amount,
    openCost: amount, price: amount, marketValue: amount })).min(1).max(100),
  cash: z.strictObject({ balance: amount, pendingDividends: amount, total: amount, withdrawable: amount }),
  totals: z.strictObject({ quantity, tradeableQuantity: quantity, marketValue: amount, openCost: amount }),
  sources: z.array(z.strictObject({ kind: z.enum(["HOLDINGS", "CASH"]),
    file: z.string().regex(/^[a-zA-Z0-9_-]+\.(pdf|png|json)$/), sha256: z.string().regex(/^[a-f0-9]{64}$/) })).length(2),
});

export function parseBrokerSnapshot(value: unknown): BrokerSnapshot {
  const snapshot = parseBoundary(schema, value, { "$": "Complete broker snapshot with exact amounts and dated sources" });
  const check = (valid: boolean) => { if (!valid) throw new Error("BROKER_SNAPSHOT_INCONSISTENT"); };
  check(new Set(snapshot.positions.map(p => p.symbol)).size === snapshot.positions.length);
  check(new Set(snapshot.sources.map(s => s.kind)).size === 2);
  for (const p of snapshot.positions) {
    check(decimal(p.quantity).positive && decimal(p.price).positive);
    check(decimal(p.quantity).mul(decimal(p.unitCost)).eq(decimal(p.openCost)));
    check(decimal(p.quantity).mul(decimal(p.price)).eq(decimal(p.marketValue)));
  }
  const sum = (field: "quantity" | "marketValue" | "openCost", tradeable = false) =>
    snapshot.positions.filter(p => !tradeable || p.status === "Giao dịch")
      .reduce((total, p) => total.add(decimal(p[field])), decimal("0"));
  check(sum("quantity").eq(decimal(snapshot.totals.quantity)));
  check(sum("quantity", true).eq(decimal(snapshot.totals.tradeableQuantity)));
  check(sum("marketValue").eq(decimal(snapshot.totals.marketValue)));
  check(sum("openCost").eq(decimal(snapshot.totals.openCost)));
  check(decimal(snapshot.cash.balance).add(decimal(snapshot.cash.pendingDividends)).eq(decimal(snapshot.cash.total)));
  check(decimal(snapshot.cash.withdrawable).units <= decimal(snapshot.cash.balance).units);
  return snapshot;
}
