import type { BrokerSnapshot } from "@/domain/portfolio/broker-snapshot";
export function brokerSnapshotFixture(): BrokerSnapshot {
  return {
    format: "vvios-broker-snapshot-v1", broker: "Example Broker", currency: "VND",
    holdingsAsOf: "2026-09-30T16:59:59.999Z", cashAsOf: "2026-10-07T09:03:26.000Z", trackingStartDate: "2026-09-30",
    positions: [{ symbol: "AAA", status: "Giao dịch", quantity: "100", unitCost: "10000", openCost: "1000000", price: "12000", marketValue: "1200000" },
      { symbol: "AAA_WFT", status: "Chờ về", quantity: "10", unitCost: "10000", openCost: "100000", price: "12000", marketValue: "120000" }],
    cash: { balance: "200", pendingDividends: "500", total: "700", withdrawable: "190" },
    totals: { quantity: "110", tradeableQuantity: "100", marketValue: "1320000", openCost: "1100000" },
    sources: [{ kind: "HOLDINGS", file: "statement.pdf", sha256: "0".repeat(64) }, { kind: "CASH", file: "cash.png", sha256: "1".repeat(64) }],
  };
}
