import type { DecisionPortfolio } from "@/domain/decision/contracts";
import { decimal, requireRule } from "./values";
import { deepFreeze } from "./transaction";

export interface ProposedLot {
  readonly securityId: string; readonly sector: string; readonly quantity: string;
  readonly price: string; readonly fees: string;
}
export interface AllocationProjection {
  readonly kind: "HYPOTHETICAL — NOT ACCOUNTING TRUTH";
  readonly baseSnapshotId: string; readonly baseLedgerWatermark: string;
  readonly step: number; readonly context: DecisionPortfolio;
  readonly sectorExposure: readonly { readonly sector: string; readonly marketValue: string }[];
}
/** Cash/exposure scenario only. Does not produce transactions, cost basis or ledger snapshots. */
export function projectAllocation(base: DecisionPortfolio, lots: readonly ProposedLot[]): AllocationProjection {
  requireRule(base.integrity.status === "PASS" && base.nav !== null && base.executableCash !== null && base.positions.every(p => p.marketValue !== null && p.sector !== null), "PROJECTION_BASE_INCOMPLETE");
  let cash = decimal(base.executableCash!), nav = decimal(base.nav!);
  const positions = base.positions.map(p => ({ ...p }));
  for (const lot of lots) {
    const quantity = decimal(lot.quantity), price = decimal(lot.price), fees = decimal(lot.fees);
    requireRule(quantity.positive && quantity.integer && price.positive && !fees.negative, "INVALID_PROJECTED_LOT");
    const value = quantity.mul(price); cash = cash.sub(value).sub(fees); nav = nav.sub(fees);
    requireRule(!cash.negative && nav.positive, "INVALID_PROJECTED_CASH_OR_NAV");
    const position = positions.find(p => p.securityId === lot.securityId);
    if (position) {
      requireRule(position.sector === lot.sector, "PROJECTED_SECTOR_MISMATCH");
      position.shares = decimal(position.shares).add(quantity).toString();
      position.marketValue = decimal(position.marketValue!).add(value).toString();
    } else positions.push({ securityId: lot.securityId, shares: lot.quantity, marketValue: value.toString(), sector: lot.sector });
  }
  const sectors = [...new Set(positions.map(p => p.sector!))].sort();
  return deepFreeze({ kind: "HYPOTHETICAL — NOT ACCOUNTING TRUTH", baseSnapshotId: base.integrity.snapshotId, baseLedgerWatermark: base.integrity.ledgerWatermark, step: lots.length,
    context: { ...base, integrity: { ...base.integrity, snapshotId: `projected:${base.integrity.snapshotId}:${lots.length}` }, nav: nav.toString(), executableCash: cash.toString(), positions },
    sectorExposure: sectors.map(sector => ({ sector, marketValue: positions.filter(p => p.sector === sector).reduce((n, p) => n.add(decimal(p.marketValue!)), decimal("0")).toString() })) });
}
