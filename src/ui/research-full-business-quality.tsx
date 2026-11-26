import { createElement as h } from "react";
import type { aggregateFullResearchBusinessQuality } from "@/domain/current-scoring/research-full-business-quality";

export function FullBusinessQualityResearchView({ ticker, score }: {
  ticker: string;
  score: ReturnType<typeof aggregateFullResearchBusinessQuality>;
}) {
  const bq = score.businessQuality;
  const coverage = score.coverage;
  return h("main", null,
    h("h1", null, `${ticker} · Business Quality ${bq.points === null
      ? `${bq.assessedPoints} assessed points on ${bq.ratedWeight}/25 weight` : `${bq.points}/25`}`),
    h("p", null, `${bq.validity} · Research only · Full Investment Score incomplete`),
    h("p", null, `Coverage ${coverage.effective.count}/23 (${coverage.effective.weight}/100 weight). Confirmed ${coverage.confirmedCurrent.count}; provisional ${coverage.provisional.count}.`),
    ...score.effectiveScores.map(row =>
      h("section", { key: row.id },
        h("h2", null, `${row.id} · ${row.points ?? "N/R"} · ${row.validity}`),
        h("p", null, `Basis ${"foundationFinancialPeriod" in row ? row.foundationFinancialPeriod ?? "N/R" : row.financialPeriod ?? "N/R"} · Reviewed period ${row.reviewedFinancialPeriod} · Cutoff ${row.reviewCutoff}`),
        h("p", null, `Current reassessment ${row.currentReassessmentPoints ?? "N/R"} · ${row.updateStatus} · Review confidence ${row.confidence.total}/10`),
        ...row.limitations.map(limit => h("p", { key: limit }, limit)),
        ...row.materialDependencies.map(change => h("p", { key: change.topic }, change.impact)))));
}
