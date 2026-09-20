import { decimal } from "@/domain/portfolio/values";
import { instant } from "@/shared/time";
import { check, id, keys, list, text } from "./validation";

export interface ExternalGate<TStatus extends string> {
  readonly owner: "M1_STAGE_0" | "M1_RISK_POLICY" | "M4";
  readonly methodologyId: string;
  readonly asOf: string;
  readonly evaluatedAt: string;
  readonly status: TStatus;
  readonly evidenceRefs: readonly string[];
}

export type Stage0Assessment = ExternalGate<"PASS" | "FAIL" | "UNKNOWN">;
export type HardVetoAssessment = ExternalGate<"CLEAR" | "ACTIVE" | "PENDING">;
export type ResidualRisk = "LOW" | "MODERATE" | "ELEVATED_CONTROLLED" | "ELEVATED_WEAK" | "HIGH" | "UNACCEPTABLE";
export type ResidualRiskAssessment = ExternalGate<ResidualRisk>;

/** Supplied by M4/Risk Policy evaluation. M6.4 records and consumes hurdleMet; it never derives it. */
export interface RequiredReturnAssessment extends ExternalGate<"PASS" | "FAIL" | "NOT_ASSESSED"> {
  readonly owner: "M4";
  readonly expectedReturn: string;
  readonly requiredReturn: string;
  readonly hurdleMet: boolean;
  readonly exceptionApplied: boolean;
}

export interface PortfolioConstraintAssessment extends ExternalGate<"PASS" | "BLOCKED"> {
  readonly owner: "M4";
  readonly securityId: string;
  readonly detail: string;
}

export function validateExternalGate<T extends ExternalGate<string>>(gate: T, asOf: string, knownAt: string): T {
  check(["M1_STAGE_0", "M1_RISK_POLICY", "M4"].includes(gate.owner), "GATE_OWNER_REQUIRED");
  id(gate.methodologyId); instant(gate.asOf); instant(gate.evaluatedAt); text(gate.status); list(gate.evidenceRefs);
  check(gate.evidenceRefs.length > 0 && gate.asOf === asOf && gate.evaluatedAt <= knownAt, "GATE_LINEAGE_REQUIRED");
  gate.evidenceRefs.forEach(text);
  return gate;
}

export function validateRequiredReturn(gate: RequiredReturnAssessment, asOf: string, knownAt: string) {
  keys(gate, "owner methodologyId asOf evaluatedAt status evidenceRefs expectedReturn requiredReturn hurdleMet exceptionApplied");
  validateExternalGate(gate, asOf, knownAt);
  check(gate.owner === "M4" && ["PASS", "FAIL", "NOT_ASSESSED"].includes(gate.status), "INVALID_REQUIRED_RETURN_GATE");
  decimal(gate.expectedReturn); decimal(gate.requiredReturn);
  check(typeof gate.hurdleMet === "boolean" && typeof gate.exceptionApplied === "boolean", "REQUIRED_RETURN_RESULT_REQUIRED");
  check((gate.status === "PASS") === gate.hurdleMet && (gate.status !== "NOT_ASSESSED" || !gate.exceptionApplied), "INCONSISTENT_REQUIRED_RETURN_RESULT");
  return gate;
}

export function validatePortfolioConstraint(gate: PortfolioConstraintAssessment, asOf: string, knownAt: string) {
  keys(gate, "owner methodologyId asOf evaluatedAt status evidenceRefs securityId detail");
  validateExternalGate(gate, asOf, knownAt); id(gate.securityId); text(gate.detail);
  check(gate.owner === "M4" && ["PASS", "BLOCKED"].includes(gate.status), "INVALID_PORTFOLIO_GATE");
  return gate;
}
