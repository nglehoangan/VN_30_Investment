import type { ScoreInput, Scorecard } from "@/domain/personal-ai/scorecard";
import type { DataInitializationAcceptance, TickerScoringReadiness } from "@/domain/personal-ai/scoring-readiness";
export interface AiDatasetSelection { readonly snapshotRunId: string; readonly acceptanceId: string }
export interface AiDatasetBinding {
  readonly contract: "personal-ai-scoring-dataset-binding-v1";
  readonly selection: AiDatasetSelection; readonly acceptanceHash: string;
  readonly inputHash: string; readonly reviewHash: string; readonly requirementsHash: string;
  readonly readiness: readonly TickerScoringReadiness[];
}
/** Trusted server configuration supplies pinned records. Request JSON cannot grant acceptance. */
export interface AiAcceptanceReader { read(id: string): Promise<DataInitializationAcceptance> }
export interface AiReviewVerifier { verify(input: ScoreInput): Promise<void> }
export interface AiScoreArtifact { readonly contract: "personal-ai-score-artifact-v1"; readonly card: Scorecard; readonly binding: AiDatasetBinding }
/** Dedicated namespace; never decoded as a legacy HUMAN scorecard or an official ranking. */
export interface AiScoreArtifactStore {
  append(record: AiScoreArtifact): Promise<void>;
  find(id: string): Promise<AiScoreArtifact | null>;
}
export interface AiScoringDatasets {
  authorize(input: ScoreInput, selection: AiDatasetSelection): Promise<AiDatasetBinding>;
  append(card: Scorecard, binding: AiDatasetBinding): Promise<void>;
  find(id: string): Promise<AiScoreArtifact | null>;
}
