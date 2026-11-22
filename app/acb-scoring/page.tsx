import Link from "next/link";
import { readAcbPublishedScore } from "../server/acb-published-score";
import { ScoringDetailsShell } from "@/ui/scoring-details-shell";
import { Metrics, Panel, Status, Table } from "@/ui/primitives";
import { readAcbEvidence } from "../server/acb-evidence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Evidence = ReturnType<typeof readAcbEvidence>;

function AcbEvidenceDetails({ closure, reports, events, candidates }: Evidence) {
  return <>
    <Panel title="Scoring overview">
      <Metrics values={{
        Version: closure.version, Cutoff: closure.cutoff, "Rated weight": closure.ratedMaxPoints + "%",
        "Confirmed points": closure.confirmedScore, "Score bounds": `${closure.scoreLowerBound}–${closure.scoreUpperBound}`,
        "Research status": closure.researchStatus, "Full official score": "—",
        "Investment ranking": "Ineligible", "Capital allocation": "Unauthorized",
      }} />
    </Panel>
    <Panel title="Rubric assessment">
      <Table headers={["Rubric", "Points", "Maximum", "Disposition", "Evidence and confidence", "Assessment", "Last assessed"]}
        rows={closure.rubrics.map(r => [r.rubric, r.points ?? "—", r.maximum,
          <Status key={r.rubric}>{r.state === "NOT_RATED" ? "N/R" : r.state}</Status>,
          `${r.evidence.length} pinned references · ${r.confidence}`,
          <details key={r.rubric}><summary>{r.explanation}</summary><p>{r.counterEvidence}</p>
            <p>{r.missingInformation}</p><p>{r.reassessmentCondition}</p>
            <ul>{r.evidence.map(e => <li key={e.path}>{e.path} · {e.publicationDate ?? "Publication date unrecorded"} · <code>{e.sha256}</code></li>)}</ul>
          </details>, r.lastAssessedAt.slice(0, 10)])} />
    </Panel>
    <Panel title="Evidence waiting list">
      <Table headers={["Expected report", "Missing evidence", "Rubrics", "Publication window", "Status", "Reassessment trigger"]}
        rows={reports.map(({ id, report }) => {
          const history = events.filter(event => event.report_id === id);
          const latest = history[0];
          return [`${report.documentType} · ${report.reportingPeriod}`, report.missingFields.join(", "), report.rubrics.join(", "),
            report.expectedWindow, <details key={id}><summary>{latest?.status ?? "EXPECTED"}</summary>
              <p>{report.owner} · {latest?.status === "ADMITTED" ? "Admitted" : "Not admitted"}</p>
              {history.map(event => <p key={event.source_hash + event.status}>
                {event.status} · Published {event.request.actualPublicationDate} · Checked {event.checkedAt} ·
                Next review {event.request.nextReviewDate ?? "Unscheduled"} · {event.request.sourceUrl} · <code>{event.source_hash}</code>
              </p>)}
            </details>, report.question];
        })} />
    </Panel>
    <Panel title="Pending reassessments">
      <Table headers={["New cutoff", "Affected rubrics", "Changed evidence", "Prior result", "Review requirements"]}
        rows={candidates.map(c => [c.cutoff, c.rubrics.join(", "), <details key={c.id}><summary>{Object.keys(c.fields).join(", ")}</summary>
          <p>{c.sourceHashes.join(", ")}</p></details>, `${c.priorConfirmedScore} points at ${c.priorRatedMaxPoints}% coverage`,
          `${c.status} · ${c.requirements.join(" · ")}`])} />
    </Panel>
    <Panel title="Score history">
      <Table headers={["Version", "Cutoff", "Status", "Points", "Coverage", "Bounds", "Full score"]}
        rows={[closure.baseline, closure].map((score, i) => [score.version, closure.cutoff,
          i ? "Research closed" : "Official limited coverage · local artifact", score.confirmedScore, score.ratedMaxPoints + "%",
          `${score.scoreLowerBound}–${score.scoreUpperBound}`, score.fullOfficialScore ?? "—"])} />
    </Panel>
  </>;
}

export default async function Page() {
  const published = await readAcbPublishedScore().catch(() => null);
  const limited = published?.limitedCoverage;
  let evidence: Evidence | undefined;
  try { evidence = readAcbEvidence(); } catch { /* Fails closed for absent or invalid local registry. */ }
  return <ScoringDetailsShell route="acb-scoring" title="ACB Scoring Details">
    <Panel title="Latest verified publication">
      {published && limited ? <>
        <Metrics values={{ Version: "V4", Cutoff: published.asOf.slice(0, 10),
          "Confirmed points": limited.confirmedScore, Coverage: limited.ratedMaxPoints + "/" + limited.totalMaxPoints,
          "Score bounds": `${limited.scoreLowerBound}–${limited.scoreUpperBound}`,
          "Unrated rubrics": limited.totalRubricCount - limited.ratedRubricCount,
          "Official full score": limited.fullOfficialScore ?? "—",
          "Investment ranking": limited.eligibleForRanking ? "Eligible" : "Ineligible",
          "Capital allocation": limited.allocationAuthorized ? "Authorized" : "Unauthorized" }} />
        <Link href={`/scoring/${published.id}`}>Published V4 scorecard</Link>
      </> : <p>No verified ACB publication is available.</p>}
    </Panel>
    {evidence ? <AcbEvidenceDetails {...evidence} /> : <p role="alert">The local ACB evidence register is unavailable.</p>}
  </ScoringDetailsShell>;
}
