import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { assertPrivateLocation, loadDatabaseConfig } from "@/infrastructure/config/database";

type Rubric = {
  rubric: string; maximum: number; points: number | null; state: string;
  confidence: string; explanation: string; counterEvidence: string;
  missingInformation: string | null; reassessmentCondition: string;
  evidence: { path: string; sha256: string; publicationDate: string | null }[];
  lastAssessedAt: string;
};
type Score = {
  version: string; confirmedScore: number; ratedMaxPoints: number;
  scoreLowerBound: number; scoreUpperBound: number; artifactSha256?: string;
  fullOfficialScore: number | null;
};
type Closure = Score & { cutoff: string; researchStatus: string; baseline: Score; rubrics: Rubric[] };
type Report = {
  documentType: string; reportingPeriod: string; expectedWindow: string;
  missingFields: string[]; rubrics: string[]; question: string; owner: string;
};
type Event = {
  request: { sourceUrl: string; actualPublicationDate: string; nextReviewDate?: string };
  checkedAt: string;
};
type Candidate = {
  cutoff: string; rubrics: string[]; sourceHashes: string[]; status: string;
  priorConfirmedScore: number; priorRatedMaxPoints: number; requirements: string[];
  fields: Record<string, {value: string; locator: string}>;
};
type Body = { id: string; body: string };
type EventRow = { report_id: string; status: string; source_hash: string; body: string };

export function readAcbEvidence() {
  const config = loadDatabaseConfig(process.env, process.cwd());
  const file = realpathSync(config.filePath);
  assertPrivateLocation(file, config.projectDirectory);
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const row = db.prepare("SELECT body,body_hash FROM acb_research_closure WHERE id=?").get("ACB-V4-20261030");
    if (!row || typeof row.body !== "string" || createHash("sha256").update(row.body).digest("hex") !== row.body_hash) {
      throw new Error("ACB research closure is missing or failed integrity verification");
    }
    const reports = (db.prepare("SELECT id,body FROM acb_future_evidence ORDER BY rowid").all() as Body[])
      .map(({ id, body }) => ({ id, report: JSON.parse(body) as Report }));
    const events = (db.prepare("SELECT report_id,status,source_hash,body FROM acb_future_evidence_event ORDER BY seq DESC").all() as EventRow[])
      .map(({ body, ...row }) => ({ ...row, ...JSON.parse(body) as Event }));
    const candidates = (db.prepare("SELECT id,report_id,body FROM acb_reassessment_candidate ORDER BY rowid DESC").all() as (Body & { report_id: string })[])
      .map(({ id, report_id, body }) => ({ id, reportId: report_id, ...JSON.parse(body) as Candidate }))
      .filter(candidate => candidate.sourceHashes.every(hash => {
        const latest = events.find(event => event.report_id === candidate.reportId && event.source_hash === hash);
        return latest?.status === "VALIDATED" || latest?.status === "ADMITTED";
      }));
    return { closure: JSON.parse(row.body) as Closure, reports, events, candidates };
  } finally {
    db.close();
  }
}
