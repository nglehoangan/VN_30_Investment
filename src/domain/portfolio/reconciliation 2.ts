import { instant, type Instant } from "@/shared/time";
import { decimal, requireRule } from "./values";
import type { PortfolioState } from "./reconstruct";
import { deepFreeze } from "./transaction";
export interface ReconciliationEvidence {
  readonly id: string; readonly portfolioId: string; readonly asOf: Instant; readonly receivedAt: Instant;
  readonly sourceReference: string; readonly cash: string;
  readonly positions: readonly { securityId: string; quantity: string; openCost: string | null }[];
  readonly receivables: string | null; readonly payables: string | null; readonly unresolvedDiscrepancy: boolean;
}
export function reconcilePortfolio(state: PortfolioState, reference: ReconciliationEvidence | null, calculatedAt: Instant) {
  instant(calculatedAt);
  const differences: { field: string; securityId: string | null; internal: string; external: string; difference: string; material: boolean }[] = [];
  let status: "MATCH" | "MISMATCH" | "MISSING_EVIDENCE" | "NOT_COMPARABLE" = "MATCH";
  if (!reference || !reference.sourceReference.trim()) status = "MISSING_EVIDENCE";
  else {
    instant(reference.asOf); instant(reference.receivedAt);
    requireRule(reference.receivedAt <= calculatedAt, "FUTURE_REFERENCE_EVIDENCE");
    requireRule(new Set(reference.positions.map(p => p.securityId)).size === reference.positions.length, "DUPLICATE_REFERENCE_POSITION");
    if (reference.portfolioId !== state.portfolioId || reference.asOf !== state.asOf) status = "NOT_COMPARABLE";
    else {
      const diff = (field: string, internal: string, external: string, securityId: string | null = null) => {
        const d = decimal(external).sub(decimal(internal));
        differences.push({ field, securityId, internal, external, difference: d.toString(), material: !d.isZero });
      };
      diff("cash", state.cash, reference.cash);
      if (reference.receivables !== null) diff("receivables", state.receivables, reference.receivables);
      if (reference.payables !== null) diff("payables", state.payables, reference.payables);
      for (const id of new Set([...state.positions.map(p => p.securityId), ...reference.positions.map(p => p.securityId)])) {
        const p = state.positions.find(p => p.securityId === id), r = reference.positions.find(p => p.securityId === id);
        diff("quantity", p?.quantity ?? "0", r?.quantity ?? "0", id);
        if (r?.openCost !== null && r?.openCost !== undefined) diff("openCost", p?.openCost ?? "0", r.openCost, id);
      }
      if (differences.some(d => d.material) || reference.unresolvedDiscrepancy) status = "MISMATCH";
      else if (reference.receivables === null || reference.payables === null || reference.positions.some(p => p.openCost === null)) status = "MISSING_EVIDENCE";
    }
  }
  return deepFreeze({ portfolioId: state.portfolioId, asOf: state.asOf, ledgerWatermark: state.ledgerWatermark, calculatedAt,
    methodology: "m63-exact-reconciliation-v1", sourceReference: reference?.sourceReference ?? null, evidenceId: reference?.id ?? null,
    referenceAsOf: reference?.asOf ?? null, unresolvedDiscrepancy: reference?.unresolvedDiscrepancy ?? false, status, quality: status === "MATCH" ? "VALID" : "BLOCKED", differences,
    actionabilityBlocked: status !== "MATCH" });
}
export type ReconciliationResult = ReturnType<typeof reconcilePortfolio>;
