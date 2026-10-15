/** Imported broker observations, separate from reconstructed ledger truth. */
export interface BrokerSnapshot {
  format: "vvios-broker-snapshot-v1";
  broker: string;
  timeBasis?: "RETRIEVED_AT";
  currency: "VND";
  holdingsAsOf: string;
  cashAsOf: string;
  trackingStartDate: string;
  positions: readonly {
    symbol: string;
    status: "Giao dịch" | "Chờ giao dịch" | "Chờ về" | "Chưa khả dụng";
    quantity: string;
    unitCost: string;
    openCost: string;
    price: string;
    marketValue: string;
  }[];
  cash: { balance: string; pendingDividends: string; total: string; withdrawable: string };
  totals: { quantity: string; tradeableQuantity: string; marketValue: string; openCost: string };
  sources: readonly { kind: "HOLDINGS" | "CASH"; file: string; sha256: string }[];
}
