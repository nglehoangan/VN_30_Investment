import type { Decision } from "@/domain/decision/engine";
import type { DecisionPortfolio } from "@/domain/decision/contracts";
export interface DecisionArtifacts {
  append(decision: Decision): Promise<void>;
  find(id: string): Promise<Decision | null>;
}
export interface DecisionPortfolioRead {
  read(asOf: string): Promise<DecisionPortfolio>;
  isCurrent(snapshot: DecisionPortfolio): Promise<boolean>;
}
