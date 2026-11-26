import { createElement as h } from 'react';
import type { aggregateResearchEffectiveScores } from '@/domain/current-scoring/research-effective-score';

export function ResearchEffectiveScoreView({ ticker, score }: {
  ticker: string;
  score: ReturnType<typeof aggregateResearchEffectiveScores>;
}) {
  const rubric = score.rubric;
  const bq = score.categories.find(category => category.id === 'BQ')!;
  const fields = [
    ['Basis', rubric.financialPeriod?.endsWith('-12-31') ? `FY${rubric.financialPeriod.slice(0, 4)}` : rubric.financialPeriod ?? 'Unavailable'],
    ['Latest review cutoff', rubric.reviewCutoff],
    ['Latest financial period reviewed', rubric.reviewedFinancialPeriod],
    ['Status', rubric.updateStatus],
    ['Current reassessment', rubric.currentReassessmentPoints ?? 'N/R'],
    ['Current comparable ROIC', rubric.currentComparableRoic === null ? 'Unavailable' : `${(rubric.currentComparableRoic * 100).toFixed(2)}%`],
    ['Effective Score quality', rubric.validity],
    ['Business Quality', `${bq.assessedPoints} points assessed on ${bq.ratedWeight}/${bq.max} weight`],
    ['Investment Score', score.provisionalInvestmentScore !== null ? `${score.provisionalInvestmentScore}/100 (provisional)`
      : score.confirmedCurrentInvestmentScore !== null ? `${score.confirmedCurrentInvestmentScore}/100 (current research)` : 'Incomplete'],
  ];
  return h('main', null, h('h1', null, `${ticker} · BQ-EQ ${rubric.points === null ? 'N/R' : `${rubric.points}/8`}`),
    h('p', null, 'Research scorecard. Formal ranking and capital allocation are unavailable.'),
    h('dl', null, fields.map(([label, value]) => h('div', { key: label }, h('dt', null, label), h('dd', null, value)))),
    ...rubric.materialDependencies.map(change => h('p', { key: change.topic }, change.impact)));
}
