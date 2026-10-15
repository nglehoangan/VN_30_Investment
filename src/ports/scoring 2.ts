import type { Scorecard } from "@/domain/scoring/scorecard";
import type { Ranking, PortfolioIntegrity } from "@/domain/ranking/rank";
export interface AnalyticalArtifacts {
  append(artifact: Scorecard | Ranking): Promise<void>;
  find(id: string): Promise<Scorecard | Ranking | null>;
}
/** Application supplies a derived, current, field-scoped M6.3 result. No ledger mutation capability. */
export interface ScoringPortfolioRead { read(asOf: string): Promise<PortfolioIntegrity>; }

export interface ScoringDatasetSelection {readonly snapshotRunId:string;readonly acceptanceId:string}
export interface ScoringDatasetAuthorization {
 readonly contract:'scoring-dataset-binding-v1'|'scoring-dataset-binding-v2';
 readonly selection:ScoringDatasetSelection;readonly acceptanceHash:string;readonly inputHash:string;
 readonly requirementsHash:string;readonly readiness:readonly import('@/domain/fundamentals/scoring-readiness').TickerScoringReadiness[];
}
/** Trusted production boundary: authorizes reviewed input, then atomically writes score and dataset link. */
export interface ScoringDatasets {
 authorize(input:import('@/domain/scoring/scorecard').ScoreInput,selection:ScoringDatasetSelection):Promise<ScoringDatasetAuthorization>;
 append(card:Scorecard,authorization:ScoringDatasetAuthorization):Promise<void>;
 findBinding(scorecardId:string):Promise<ScoringDatasetAuthorization|null>;
}

/** Every row is computed from the verified pinned dataset; no caller READY override. */
export interface ScoringReadinessRead {
 readiness(acceptanceId:string):Promise<readonly import('@/domain/fundamentals/scoring-readiness').TickerScoringReadiness[]>;
}
