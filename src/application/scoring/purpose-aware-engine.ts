import type {ScoringEngine} from './engine';
import type {CurrentScoringExecution} from '@/ports/current-scoring-execution';
import type {ScoreInput as CurrentInput} from '@/domain/current-scoring/scorecard';
import type {ScoreInput as HistoricalInput} from '@/domain/scoring/scorecard';
import type {ScoringDatasetSelection} from '@/ports/scoring';
import type {PreScoringDatasetReference} from '@/ports/pre-scoring-datasets';
import {check} from '@/domain/scoring/validation';
/** Explicit application routing. No automatic CURRENT_ONLY→AS_KNOWN conversion or activation. */
export class PurposeAwareScoringEngine {
 constructor(private readonly historical:Pick<ScoringEngine,'score'>,private readonly current:CurrentScoringExecution){}
 async preflightCurrent(input:CurrentInput,reference:PreScoringDatasetReference){
  check(input.currentPurpose?.purpose==='CURRENT_FORMAL_VALUATION'&&reference.context.purpose==='CURRENT_FORMAL_VALUATION','CURRENT_ONLY_NOT_PIT');
  return this.current.preflight(input,reference);
 }
 async scoreCurrent(input:CurrentInput,reference:PreScoringDatasetReference){
  check(input.currentPurpose?.purpose==='CURRENT_FORMAL_VALUATION'&&reference.context.purpose==='CURRENT_FORMAL_VALUATION','CURRENT_ONLY_NOT_PIT');
  return this.current.score(input,reference);
 }
 async scoreHistorical(input:HistoricalInput,selection:ScoringDatasetSelection){
  check(!Object.hasOwn(input,'currentPurpose'),'CURRENT_ONLY_NOT_PIT');
  return this.historical.score(input,selection);
 }
}
