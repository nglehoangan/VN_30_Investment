import { createElement as h } from "react";
import { ResearchEffectiveScoreView } from "./research-effective-score";
import type { aggregateResearchBusinessQuality } from "@/domain/current-scoring/research-combined-bq";

export function ResearchMoatScoreView({ ticker, score }: {
  ticker: string;
  score: ReturnType<typeof aggregateResearchBusinessQuality>;
}) {
  const moat = score.moat;
  const coverage = score.coverage;
  const fields = [
    ["Assessment foundation", moat.foundationFinancialPeriod ?? "N/R"],
    ["Latest reviewed period", moat.reviewedFinancialPeriod],
    ["Review cutoff", moat.reviewCutoff],
    ["Current reassessment", moat.currentReassessmentPoints ?? "N/R"],
    ["Update status", moat.updateStatus],
    ["Effective Score quality", moat.validity],
    ["Confidence", `${moat.confidence.total}/10`],
    ["Confirmed current coverage", `${coverage.confirmedCurrent.count}/23 · ${coverage.confirmedCurrent.weight}/100 weight`],
    ["Provisional coverage", `${coverage.provisional.count}/23 · ${coverage.provisional.weight}/100 weight`],
  ];
  return h("div", null,
    h(ResearchEffectiveScoreView, { ticker, score }),
    h("section", { "aria-label": "Competitive advantage" },
      h("h2", null, `BQ-MOAT ${moat.points === null ? "N/R" : `${moat.points}/6`}`),
      h("dl", null, fields.map(([label, value]) =>
        h("div", { key: label }, h("dt", null, label), h("dd", null, value)))),
      ...moat.limitations.map(text => h("p", { key: text }, text)),
      ...moat.materialDependencies.map(change => h("p", { key: change.topic }, change.impact))));
}
