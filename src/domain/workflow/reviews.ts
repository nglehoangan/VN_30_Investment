import { deepFreeze } from "@/domain/portfolio/transaction";
import { decimal } from "@/domain/portfolio/values";
import { instant } from "@/shared/time";
import { validateReview, requireWorkflow } from "./validation";
import { allocate } from "./allocation";
import { EVENT_PRIORITIES, WORKFLOW_METHOD, type PinnedReview, type ReviewArtifact, type Disposition } from "./contracts";
export const WEEKLY_AREAS = ["PORTFOLIO", "CASH", "CONCENTRATION", "PRICE / VALUATION", "COMPANY / EARNINGS", "MEMBERSHIP", "THESIS / RISK", "RANKING", "UNRESOLVED ITEMS"] as const;
export const QUARTERLY_AREAS = ["BUSINESS QUALITY", "FINANCIAL HEALTH", "GROWTH", "INDUSTRY", "MANAGEMENT / CAPITAL ALLOCATION", "VALUATION", "RISK", "THESIS", "SCORE / CONFIDENCE", "PORTFOLIO / OPPORTUNITY COST"] as const;
export const ANNUAL_AREAS = ["PERFORMANCE", "BENCHMARK", "RISK / CONCENTRATION", "DECISION QUALITY", "BEHAVIORAL PATTERNS", "SCORING / RANKING EFFECTIVENESS", "POLICY ASSUMPTIONS"] as const;
export function reviewIdentity(p: PinnedReview) {
  const { id: _id, priorReviewId: _prior, supersedesReviewId: _supersedes, ...command } = p.command;
  void _id; void _prior; void _supersedes;
  // Collision-free canonical payload; the persistence adapter hashes this bounded identity.
  return JSON.stringify({ method: WORKFLOW_METHOD, command, portfolio: p.portfolio, events: p.openEventReviewIds });
}
export function createReview(p: PinnedReview, supersedesProposalId: string | null = null): ReviewArtifact {
  const c = validateReview(p.command), s = p.portfolio.decisionContext;
  instant(p.recordedAt); requireWorkflow(p.recordedAt >= c.reviewDate, "REVIEW_FROM_FUTURE");
  requireWorkflow(c.portfolioId === s.integrity.portfolioId && c.snapshotId === s.integrity.snapshotId && c.asOf === s.integrity.asOf, "PINNED_SNAPSHOT_REQUIRED");
  requireWorkflow(p.decisions.length === c.decisionIds.length && p.decisions.every(d => c.decisionIds.includes(d.id)), "PINNED_DECISIONS_REQUIRED");
  requireWorkflow(new Set(p.decisions.map(d => d.securityId)).size === p.decisions.length, "ONE_CURRENT_DECISION_PER_SECURITY");
  for (const value of [p.portfolio.ledgerCash, p.portfolio.reservedCash]) requireWorkflow(!decimal(value).negative, "INVALID_CASH_CONTEXT");
  const reasons: string[] = [];
  if (s.integrity.status !== "PASS") reasons.push("PORTFOLIO STATE BLOCKED");
  if (p.openEventReviewIds.length && c.type !== "EVENT_DRIVEN") reasons.push("OPEN EVENT REVIEW TAKES PRECEDENCE");
  if (c.evidence.some(e => e.validThrough < c.reviewDate)) reasons.push("STALE REVIEW EVIDENCE");
  const applicable = c.triggers.filter(t => t.effectiveAt <= c.asOf).sort((a, b) => EVENT_PRIORITIES.indexOf(a.priority) - EVENT_PRIORITIES.indexOf(b.priority));
  const ready = applicable.some(t => ["T3", "T4"].includes(t.severity) && t.verified && t.decisionReady);
  if (applicable.some(t => t.severity !== "T0" && !t.decisionReady)) reasons.push("MATERIAL EVENT REQUIRES REVIEW");
  if (c.theses.some(t => t.current === "PENDING")) reasons.push("THESIS EVIDENCE PENDING");
  if (c.behavioral.some(b => !b.controlApplied)) reasons.push("BIAS CONCERN UNRESOLVED — RESTATE INVESTMENT CASE");
  const checkAreas = (areas: readonly string[], securityId: string | null) => {
    for (const area of areas) if (!c.sections.some(x => x.area === area && x.securityId === securityId && x.finding !== "MISSING")) reasons.push(`REQUIRED REVIEW AREA:${securityId ?? "PORTFOLIO"}:${area}`);
  };
  if (c.type === "WEEKLY") checkAreas(WEEKLY_AREAS, null);
  if (c.type === "QUARTERLY") for (const position of s.positions.filter(x => decimal(x.shares).positive)) {
    checkAreas(QUARTERLY_AREAS, position.securityId);
    if (!c.theses.some(t => t.securityId === position.securityId)) reasons.push(`THESIS REVIEW REQUIRED:${position.securityId}`);
  }
  if (c.type === "ANNUAL") { checkAreas(ANNUAL_AREAS, null); if (c.governance === null) reasons.push("ANNUAL GOVERNANCE ASSESSMENT REQUIRED"); }
  if (c.sections.some(x => x.finding === "MISSING")) reasons.push("REVIEW EVIDENCE INCOMPLETE");
  if (c.sections.some(x => x.finding === "MATERIAL CHANGE")) reasons.push("MATERIAL CHANGE REQUIRES REFRESH / REVIEW");
  const decisionNeeded = ready || c.theses.some(t => ["WEAKENING", "BROKEN"].includes(t.current));
  let disposition: Disposition = decisionNeeded ? "DECISION REQUIRED" : reasons.length ? "REVIEW REQUIRED" : "NO ACTION";
  const blocks = [...reasons, ...(decisionNeeded ? ["DECISION REQUIRED — NEW MATERIAL TRIGGER"] : [])];
  const proposal = c.type === "MONTHLY_DCA" ? allocate(p, blocks, supersedesProposalId) : null;
  if (proposal?.outcome === "REVIEW REQUIRED") disposition = decisionNeeded ? "DECISION REQUIRED" : "REVIEW REQUIRED";
  if (proposal?.outcome === "DECISION REQUIRED") disposition = "DECISION REQUIRED";
  const materialScore = c.sections.some(x => x.finding === "MATERIAL CHANGE" && !["PRICE / VALUATION", "VALUATION"].includes(x.area));
  const valuation = c.sections.some(x => x.finding === "MATERIAL CHANGE" && ["PRICE / VALUATION", "VALUATION"].includes(x.area));
  return deepFreeze({ id: c.id, idempotencyKey: reviewIdentity(p), methodology: WORKFLOW_METHOD, command: c, portfolio: p.portfolio, recordedAt: p.recordedAt,
    disposition, status: applicable.some(t => t.severity === "T4") || p.openEventReviewIds.length ? "ESCALATED" : disposition === "REVIEW REQUIRED" ? "PENDING" : "FINAL",
    reasons: [...reasons, ...(decisionNeeded ? ["FORMAL M6.5 DECISION REFRESH REQUIRED"] : [])], linkedEventReviewIds: [...p.openEventReviewIds],
    refresh: { score: materialScore, ranking: materialScore || valuation || (c.type === "MONTHLY_DCA" && !p.ranking), valuation, decision: disposition === "DECISION REQUIRED" }, proposal,
    journal: proposal && ["HOLD CASH", "BUY", "ACCUMULATE"].includes(proposal.outcome) ? { id: `${c.id}:journal`, entryType: proposal.outcome === "HOLD CASH" ? "HOLD_CASH" : "TRADE_DECISION", decisionIds: c.decisionIds, rationale: proposal.rationale, nextReview: c.nextReview } : decisionNeeded ? { id: `${c.id}:journal`, entryType: "RISK_ESCALATION", decisionIds: c.decisionIds, rationale: ["MATERIAL DECISION TRIGGER"], nextReview: c.nextReview } : null });
}
/** M5 specifies approximate horizons. These dates are reminders, never expiry or trade rules. */
export function suggestedAuditDate(originalDate: string, months: 3 | 6 | 12) {
  instant(originalDate); const d = new Date(originalDate), day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + months);
  const end = new Date(d.getTime()); end.setUTCMonth(end.getUTCMonth() + 1); end.setUTCDate(0);
  d.setUTCDate(Math.min(day, end.getUTCDate())); return d.toISOString();
}
