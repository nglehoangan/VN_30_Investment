import { monotonicDecision } from "./decision";
import { rankingFixture, ASOF } from "./scoring";
import { rankScorecards } from "@/domain/ranking/rank";
import { calculateScorecard } from "@/domain/scoring/scorecard";
import { decide } from "@/domain/decision/engine";
import type { PinnedReview, ReviewSection } from "@/domain/workflow/contracts";
export type Mutable<T> = T extends string | number | boolean | null | undefined ? T : { -readonly [K in keyof T]: Mutable<T[K]> };
export const NOW = "2026-10-01T09:00:00.000Z";
export function workflowFixture(count = 1, configure?: (i: ReturnType<typeof monotonicDecision>, index: number) => void): Mutable<PinnedReview> {
  const rankInput = JSON.parse(JSON.stringify(rankingFixture(Array.from({ length: count }, () => 82))).replaceAll(ASOF, NOW)) as Mutable<ReturnType<typeof rankingFixture>>;
  const inputs = Array.from({ length: count }, (_, index) => {
    const i = monotonicDecision(); i.id = `workflow-decision-${index}`; i.securityId = rankInput.cards[index].securityId;
    i.scorecard = JSON.parse(JSON.stringify(rankInput.cards[index])); configure?.(i, index);
    rankInput.cards[index] = i.scorecard; return i;
  });
  const portfolio = inputs[0]?.portfolio ?? monotonicDecision().portfolio;
  const ranking = rankScorecards({ ...rankInput, cards: rankInput.cards.map(c => calculateScorecard(c.input)), portfolio: portfolio.integrity });
  for (const i of inputs) { i.scorecard = JSON.parse(JSON.stringify(ranking.input.cards.find(c => c.securityId === i.securityId)!)); i.ranking = JSON.parse(JSON.stringify(ranking)); }
  const decisions = inputs.map(decide);
  return JSON.parse(JSON.stringify({ command: { id: "review-1", type: "MONTHLY_DCA", portfolioId: portfolio.integrity.portfolioId, period: "2026-10", reviewDate: NOW, asOf: NOW, evidenceCutoff: NOW,
    snapshotId: portfolio.integrity.snapshotId, scope: "SYNTHETIC_TEST", reviewer: "Fixture reviewer", priorReviewId: null, supersedesReviewId: null,
    decisionIds: decisions.map(d => d.id), rankingId: ranking.id, contributionId: null, plannedContribution: "5000000",
    evidence: monotonicDecision().evidence, triggers: [], sections: [], theses: [], behavioral: [], nextReview: "Next contribution cycle or material event", governance: null },
    portfolio: { decisionContext: portfolio, ledgerCash: portfolio.executableCash!, reservedCash: "0", contribution: null }, decisions, ranking, recordedAt: NOW, openEventReviewIds: [] } satisfies PinnedReview));
}
export function sections(areas: readonly string[], securityId: string | null = null): Mutable<ReviewSection>[] {
  return areas.map(area => ({ area, securityId, evidenceRefs: ["decision-evidence"], finding: "UNCHANGED", rationale: "Evidence reviewed; no material change" }));
}

/** Test-only fixture uses the real M6.5 comparator computation. */
export function orderedWorkflowFixture() {
  return workflowFixture(2, (i, index) => {
    if (index === 0) i.assessment.valuation.expectedReturn = "0.17";
    else {
      const a = monotonicDecision();
      i.comparatorScorecards = [a.scorecard];
      i.assessment.opportunity.comparators = [{ analyst: "Fixture human", source: "HUMAN", assessedAt: NOW, evidenceRefs: ["decision-evidence"], rationale: "Robust comparative evidence with no worse risk and fit", securityId: a.securityId, scorecardId: a.scorecard.id, decisionId: "workflow-decision-0", kind: "NEW", expectedReturn: "0.17", lowerReturn: "0.12", upperReturn: "0.22", eligible: true, qualityNoWorse: true, riskNoWorse: true, confidenceNoLower: true, thesisNoWorse: true, fitNoWorse: true, robustlySuperior: true, marginalCapacity: "100" }];
    }
  });
}
