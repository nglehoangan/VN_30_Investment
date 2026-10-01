import { APPROVED_METHOD } from "./approved-methodology";
import { decimal } from "@/domain/portfolio/values";
import type { DecisionInput } from "./contracts";

/** CR-01: exact downward capacity calculation, before board-lot feasibility.
 * Fees reduce NAV; neither available cash nor the board lot changes economic capacity.
 */
export function incrementalSize(i: DecisionInput, reasons: readonly string[]) {
  const s = i.assessment.sizing, r = i.assessment.risk, p = i.portfolio;
  const scale = decimal("1").units;
  const nav = decimal(p.nav!).units, postNav = nav - decimal(s.fees).units;
  const position = p.positions.find(x => x.securityId === i.securityId);
  const value = decimal(position?.marketValue ?? "0").units;
  const sectorValue = p.positions.filter(x => x.sector === i.scorecard.reference.sector)
    .reduce((sum, x) => sum + decimal(x.marketValue!).units, 0n);
  const above = (amount: bigint, cap: string) => amount * scale > nav * decimal(cap).units;
  const exception = r.smallNavException && r.approvalReference !== null && r.normalizationPlan !== null && !above(value, "0.15");
  const prohibited = above(value, "0.15") || r.hiddenFactorBlocksAdd ||
    (["CRITICAL", "SEVERE"].includes(r.drawdown) && r.riskIncreasing && !r.approvalReference) ||
    ["NEGATIVE — DO NOT ADD", "REQUIRES REDUCTION"].includes(s.portfolioImpact);
  // Keep the M6.5.2 defect solely for immutable historical replay.
  // M6.5.3: M1 §7.2/7.3 requires scoped sector-add authority, which this
  // contract cannot validate. Generic approval/normalization strings grant none.
  const sectorCap = i.methods.decision.implementationIdentity === APPROVED_METHOD && above(sectorValue, "0.35") && r.approvalReference ? "0.40" : "0.30";
  const capacity = (amount: bigint, cap: string) => (decimal(cap).units * postNav - amount * scale) / decimal(s.price).units;
  const limits = [capacity(value, exception ? "0.30" : "0.15"),
    capacity(value, s.economicTargetUpper), capacity(sectorValue, sectorCap)];
  if (!r.elevatedSizeJustification) limits.push(capacity(value, "0.10"));
  const minimum = limits.reduce((a, b) => a < b ? a : b);
  const availableUnits = prohibited || minimum < 0n ? 0n : minimum;
  const requestedUnits = decimal(s.proposedShares).units;
  const riskUnits = availableUnits < requestedUnits ? availableUnits : requestedUnits;
  const lotUnits = decimal(s.boardLot).units;
  const executableUnits = riskUnits / lotUnits * lotUnits;
  const format = (units: bigint) => `${units / scale}.${(units % scale).toString().padStart(12, "0")}`.replace(/\.?0+$/, "");
  const riskCompliantShares = riskUnits === 0n ? "0" : format(riskUnits);
  const boardLotExecutableShares = (executableUnits / scale).toString();
  const cashRequired = decimal(boardLotExecutableShares).mul(decimal(s.price)).add(decimal(s.fees));
  return {
    requestedShares: s.proposedShares, riskCompliantShares, boardLotExecutableShares,
    constrained: riskUnits < decimal(s.proposedShares).units,
    allocationBlocked: availableUnits === 0n,
    reasons: availableUnits === 0n && reasons.length === 0 ? ["NO_COMPLIANT_INCREMENTAL_CAPACITY"] : [...reasons],
    cashRequired: cashRequired.toString(),
    cashSufficient: decimal(p.executableCash!).units >= cashRequired.units,
  };
}
