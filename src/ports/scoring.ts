import type { Scorecard } from "@/domain/scoring/scorecard";
import type { Ranking, PortfolioIntegrity } from "@/domain/ranking/rank";
export interface AnalyticalArtifacts {
  append(artifact: Scorecard | Ranking): Promise<void>;
  find(id: string): Promise<Scorecard | Ranking | null>;
}
/** Application supplies a derived, current, field-scoped M6.3 result. No ledger mutation capability. */
export interface ScoringPortfolioRead { read(asOf: string): Promise<PortfolioIntegrity>; }
