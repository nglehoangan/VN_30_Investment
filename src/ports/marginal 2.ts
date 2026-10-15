import type { MarginalAllocation } from "@/domain/decision/marginal";
export interface MarginalArtifacts {
  substitutionHistory(portfolioId: string, scope: string, cutoff: string): Promise<readonly string[]>;
  find(id: string): Promise<MarginalAllocation | null>;
  append(artifact: MarginalAllocation): Promise<void>;
}
