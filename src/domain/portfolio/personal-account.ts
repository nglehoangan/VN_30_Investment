import { decimal, requireRule } from "./values";
import type { BrokerSnapshot } from "./broker-snapshot";

export interface PersonalAccountObservation {
  schemaVersion: "personal-account-v1";
  portfolioId: string;
  ledgerWatermark: string;
  asOfDate: string;
  cash: string;
  pendingDividends: string;
  custodyFee: string;
  withdrawable: string;
  linkedBankAvailable: string;
  buyingPower: string;
  brokerReportedNav: string;
  positions: { ticker: string; isin: string; quantity: string; tradableQuantity: string; pendingQuantity: string; importedCost: string }[];
}
export interface PersonalMarketPrice { ticker: string; price: string; asOfDate: string; receivedAt: string; sourceReference: string }
export interface PersonalAccountView extends PersonalAccountObservation {
  valuationAsOf: string | null;
  sourceMarketValue: string | null;
  sourceUnrealizedPnl: string | null;
  positions: (PersonalAccountObservation["positions"][number] & { price: string | null; marketValue: string | null; unrealizedPnl: string | null; priceAsOf: string | null; priceSource: string | null })[];
}
/** Owner observations are a separate dated view, never ledger postings or capital authorization. */
export function personalAccountView(observation: PersonalAccountObservation, snapshot?: BrokerSnapshot, marketPrices: readonly PersonalMarketPrice[] = []): PersonalAccountView {
  requireRule(new Set(observation.positions.map(p => p.ticker)).size === observation.positions.length, "DUPLICATE_PERSONAL_POSITION");
  requireRule(new Set(observation.positions.map(p => p.isin)).size === observation.positions.length, "DUPLICATE_PERSONAL_ISIN");
  requireRule(decimal(observation.withdrawable).units <= decimal(observation.cash).units, "PERSONAL_WITHDRAWABLE_EXCEEDS_CASH");
  requireRule(decimal(observation.cash).add(decimal(observation.linkedBankAvailable)).sub(decimal(observation.custodyFee)).eq(decimal(observation.buyingPower)), "PERSONAL_BUYING_POWER_MISMATCH");
  const positions = observation.positions.map(p => {
    requireRule(decimal(p.quantity).positive && decimal(p.importedCost).positive, "INVALID_PERSONAL_POSITION");
    requireRule(decimal(p.tradableQuantity).add(decimal(p.pendingQuantity)).eq(decimal(p.quantity)), "PERSONAL_QUANTITY_MISMATCH");
    const direct = marketPrices.find(q => q.ticker === p.ticker);
    const quote = marketPrices.length ? undefined : snapshot?.positions.find(q => q.symbol === p.ticker);
    const price = direct?.price ?? quote?.price ?? null;
    const priceAsOf = direct?.asOfDate ?? (quote ? snapshot!.holdingsAsOf : null);
    const priceSource = direct?.sourceReference ?? (quote ? "BROKER_SNAPSHOT" : null);
    const marketValue = price === null ? null : decimal(price).mul(decimal(p.quantity)).toString();
    return { ...p, price, priceAsOf, priceSource, marketValue, unrealizedPnl: marketValue === null ? null : decimal(marketValue).sub(decimal(p.importedCost)).toString() };
  });
  const dates = [...new Set(positions.map(p => p.priceAsOf))];
  const complete = positions.every(p => p.marketValue !== null) && dates.length === 1;
  const sum = (field: "marketValue" | "unrealizedPnl") => positions.reduce((n, p) => n.add(decimal(p[field]!)), decimal("0")).toString();
  return { ...observation, positions, valuationAsOf: dates.length === 1 ? dates[0] : null, sourceMarketValue: complete ? sum("marketValue") : null, sourceUnrealizedPnl: complete ? sum("unrealizedPnl") : null };
}
