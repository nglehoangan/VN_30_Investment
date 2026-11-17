import type {ScoreInput,calculateScorecard} from '@/domain/current-scoring/scorecard';
import type {PreScoringDatasetReference} from './pre-scoring-datasets';
export interface CurrentScoringExecution {
 preflight(input:ScoreInput,reference:PreScoringDatasetReference):Promise<unknown>;
 score(input:ScoreInput,reference:PreScoringDatasetReference):Promise<ReturnType<typeof calculateScorecard>>;
}
