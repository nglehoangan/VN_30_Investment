import { ScoringDetailsShell } from "@/ui/scoring-details-shell";
import { Metrics, Panel, Status, Table } from "@/ui/primitives";
import { readVnmScoringHistory } from "../server/vnm-scoring-history";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function Page() {
  let card: ReturnType<typeof readVnmScoringHistory> | undefined;
  try { card = readVnmScoringHistory(); } catch { /* The archived record is unavailable or failed verification. */ }
  return <ScoringDetailsShell route="vnm-scoring" title="VNM Scoring Details">
    {card ? <>
      <p className="notice">Archived PUB-04 publication. Current publication replay is unavailable.</p>
      <Panel title="Scoring overview">
        <Metrics values={{ Version: "PUB-04", Cutoff: card.asOf.slice(0, 10), "Published score": card.totalScore + "/100",
          Confidence: card.confidence, Validity: card.validity, "Capital allocation": "Unauthorized" }} />
      </Panel>
      <Panel title="Rubric assessment">
        <Table headers={["Rubric", "Points", "Maximum", "Assessment", "Evidence", "Last assessed"]}
          rows={card.subcategories.map(r => [r.id, r.points ?? "—", r.max,
            <Status key={r.id}>{r.assessment?.assessment ?? "N/R"}</Status>,
            r.assessment && <details key={r.id}><summary>{r.assessment.rationale}</summary>
              <ul>{r.assessment.evidence.map(e => <li key={e.topic}>{e.rationale}</li>)}</ul>
            </details>, r.assessment?.assessedAt.slice(0, 10)])} />
      </Panel>
      <Panel title="Evidence waiting list">
        <Table headers={["Rubric", "Missing topics"]} rows={card.subcategories.filter(r => r.missingTopics.length)
          .map(r => [r.id, r.missingTopics.join(", ")])} empty="The archived scorecard has no open rubric evidence entries." />
      </Panel>
      <Panel title="Score history">
        <Table headers={["Version", "Cutoff", "Calculated", "Score", "Status"]}
          rows={[["PUB-04", card.asOf.slice(0, 10), card.calculatedAt.slice(0, 10), card.totalScore + "/100", card.validity]]} />
      </Panel>
    </> : <p role="alert">The archived VNM scorecard is unavailable.</p>}
  </ScoringDetailsShell>;
}
