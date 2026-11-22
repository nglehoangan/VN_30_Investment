import { Metrics, Panel } from "./primitives";

type Baseline = { label: string; cutoff: string; verified: boolean };
type Change = { label: string; rubrics: readonly string[] };

export function ScoringFreshness({ baseline, marketDate, evidence = [] }: {
  baseline?: Baseline; marketDate: string | null; evidence?: readonly Change[];
}) {
  const laterMarket = baseline && marketDate && marketDate > baseline.cutoff ? marketDate : null;
  const changes = laterMarket ? [
    ...evidence, { label: `Market observation · ${laterMarket}`, rubrics: ["VAL-RET", "VAL-MOS"] },
  ] : evidence;
  const affected = [...new Set(changes.flatMap(change => change.rubrics))].sort();
  const reviewRequired = !baseline?.verified || ((!marketDate || marketDate < baseline.cutoff) && changes.length === 0);
  return <Panel title="Scoring freshness">
    <Metrics values={{
      "Latest published scoring": baseline ? `${baseline.label} · ${baseline.cutoff}` : "Unavailable",
      "Latest available market data": marketDate ?? "No verified observation available",
      "Scoring status": reviewRequired ? "Review required" : changes.length ? "Update available" : "Up to date",
      "Changed evidence": changes.map(change => change.label).join("; ") || "No newer evidence verified",
      "Affected rubrics to review": affected.join(", ") || "—",
      "Next action": !baseline?.verified ? "Verify publication baseline" : changes.length ? "Incremental scoring" :
        (!marketDate || marketDate < baseline.cutoff) ? "Verify market observations" : "Monitor for new evidence",
    }} />
    <p>Status compares the published cutoff with available market observations and recorded reassessment evidence. Market data is display-only.</p>
  </Panel>;
}
