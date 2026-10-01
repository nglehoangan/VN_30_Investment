import { ValidationError } from "@/shared/errors";
import { instant } from "@/shared/time";
import { decimal } from "@/domain/portfolio/values";
import { snapshot, id, text, list, unique } from "@/domain/scoring/validation";
import { BIASES, EVENT_CATEGORIES, EVENT_PRIORITIES, REVIEW_TYPES, type ReviewCommand, type FollowUpCommand } from "./contracts";
export function requireWorkflow(value: unknown, reason: string): asserts value {
  if (!value) throw new ValidationError([{ field: "workflow", reason, expected: "M5 / M6.6 workflow contract" }]);
}
export function exact(value: object, fields: string) {
  requireWorkflow(value && typeof value === "object" && !Array.isArray(value), "OBJECT_REQUIRED");
  const allowed = fields.split(" ");
  requireWorkflow(Object.keys(value).length === allowed.length && allowed.every(k => Object.hasOwn(value, k)), "EXACT_FIELDS_REQUIRED");
}
function refs(values: readonly string[], evidence: readonly { id: string }[]) {
  list(values); unique(values); values.forEach(id);
  requireWorkflow(values.every(r => evidence.some(e => e.id === r)), "MISSING_EVIDENCE_REFERENCE");
}
export function validateReview(raw: ReviewCommand) {
  const c = snapshot(raw);
  exact(c, "id type portfolioId period reviewDate asOf evidenceCutoff snapshotId scope reviewer priorReviewId supersedesReviewId decisionIds rankingId contributionId plannedContribution evidence triggers sections theses behavioral nextReview governance");
  [c.id, c.portfolioId].forEach(id); [c.period, c.reviewer, c.snapshotId, c.nextReview].forEach(text);
  requireWorkflow(REVIEW_TYPES.includes(c.type) && ["FORMAL", "SYNTHETIC_TEST"].includes(c.scope), "INVALID_REVIEW_TYPE_OR_SCOPE");
  [c.reviewDate, c.asOf, c.evidenceCutoff].forEach(instant);
  requireWorkflow(c.asOf <= c.reviewDate && c.evidenceCutoff <= c.reviewDate, "INVALID_REVIEW_TIME");
  [c.priorReviewId, c.supersedesReviewId, c.rankingId, c.contributionId].forEach(x => { if (x !== null) id(x); });
  requireWorkflow(c.priorReviewId !== c.id && c.supersedesReviewId !== c.id, "SELF_REFERENCE");
  if (c.plannedContribution !== null) requireWorkflow(!decimal(c.plannedContribution).negative, "NEGATIVE_PLAN");
  list(c.decisionIds, 30); unique(c.decisionIds); c.decisionIds.forEach(id);
  list(c.evidence); unique(c.evidence.map(e => e.id));
  for (const e of c.evidence) {
    exact(e, "id source asOf receivedAt validThrough classification summary"); id(e.id); text(e.source); text(e.summary);
    [e.asOf, e.receivedAt, e.validThrough].forEach(instant);
    requireWorkflow(e.asOf <= c.asOf && e.receivedAt <= c.evidenceCutoff && e.validThrough >= e.asOf && ["FACT", "ESTIMATE", "ASSUMPTION"].includes(e.classification), "INVALID_EVIDENCE_TIME_OR_CLASS");
  }
  list(c.triggers); unique(c.triggers.map(t => t.id));
  for (const t of c.triggers) {
    exact(t, "id category priority severity effectiveAt evidenceRefs verified decisionReady governingRule affectedSecurityId requiredEvidence rationale"); id(t.id); instant(t.effectiveAt);
    requireWorkflow(EVENT_CATEGORIES.includes(t.category) && EVENT_PRIORITIES.includes(t.priority) && ["T0", "T1", "T2", "T3", "T4"].includes(t.severity), "INVALID_TRIGGER");
    requireWorkflow(typeof t.verified === "boolean" && typeof t.decisionReady === "boolean", "BOOLEAN_REQUIRED");
    requireWorkflow(!t.decisionReady || t.verified, "UNVERIFIED_DECISION_TRIGGER");
    [t.governingRule, t.requiredEvidence, t.rationale].forEach(text); if (t.affectedSecurityId !== null) id(t.affectedSecurityId);
    refs(t.evidenceRefs, c.evidence); requireWorkflow(t.evidenceRefs.length > 0, "TRIGGER_EVIDENCE_REQUIRED");
  }
  list(c.sections); unique(c.sections.map(s => `${s.area}:${s.securityId}`));
  for (const s of c.sections) {
    exact(s, "area securityId evidenceRefs finding rationale"); text(s.area); text(s.rationale); if (s.securityId !== null) id(s.securityId);
    requireWorkflow(["UNCHANGED", "MATERIAL CHANGE", "MISSING", "NOT APPLICABLE"].includes(s.finding), "INVALID_SECTION");
    refs(s.evidenceRefs, c.evidence); requireWorkflow(["MISSING", "NOT APPLICABLE"].includes(s.finding) || s.evidenceRefs.length > 0, "SECTION_EVIDENCE_REQUIRED");
  }
  list(c.theses); unique(c.theses.map(t => t.securityId));
  for (const t of c.theses) {
    exact(t, "securityId prior current evidenceRefs rationale"); id(t.securityId); text(t.rationale);
    requireWorkflow([t.prior, t.current].every(s => ["INTACT", "IMPROVING", "WEAKENING", "BROKEN", "PENDING"].includes(s)), "INVALID_THESIS");
    refs(t.evidenceRefs, c.evidence); requireWorkflow(t.evidenceRefs.length > 0, "THESIS_EVIDENCE_REQUIRED");
  }
  list(c.behavioral);
  for (const b of c.behavioral) {
    exact(b, "bias evidenceRefs originalWording indicator controlApplied control");
    requireWorkflow(BIASES.includes(b.bias) && ["PRICE DECLINE ONLY", "FORCED MONTHLY DEPLOYMENT", "PROFIT THRESHOLD ONLY", "DOCUMENTED PROCESS DEVIATION"].includes(b.indicator) && typeof b.controlApplied === "boolean", "INVALID_BEHAVIORAL_OBSERVATION");
    text(b.originalWording); text(b.control); refs(b.evidenceRefs, c.evidence); requireWorkflow(b.evidenceRefs.length > 0, "BEHAVIORAL_EVIDENCE_REQUIRED");
  }
  requireWorkflow(c.governance === null || (c.type === "ANNUAL" && ["NO POLICY CHANGE", "OPERATIONAL IMPROVEMENTS ONLY", "MODEL/RULE VALIDATION REQUIRED", "POLICY REVIEW PROPOSAL REQUIRED"].includes(c.governance)), "INVALID_GOVERNANCE");
  requireWorkflow(c.type !== "EVENT_DRIVEN" || c.triggers.length > 0, "EVENT_TRIGGER_REQUIRED");
  return c;
}
export function validateFollowUp(raw: FollowUpCommand) {
  const c = snapshot(raw);
  exact(c, "id reviewId journalId decisionId horizon auditDate evidence processQuality decisionQuality evidenceQuality thesisAccuracy riskAssessmentQuality executionQuality outcomeQuality rationale");
  [c.id, c.reviewId, c.journalId, c.decisionId].forEach(id); instant(c.auditDate); text(c.rationale);
  requireWorkflow([3, 6, 12].includes(c.horizon), "INVALID_AUDIT_HORIZON");
  for (const value of [c.processQuality, c.decisionQuality, c.evidenceQuality, c.thesisAccuracy, c.riskAssessmentQuality, c.executionQuality, c.outcomeQuality]) requireWorkflow(["GOOD", "BAD", "UNKNOWN"].includes(value), "INVALID_QUALITY");
  list(c.evidence); requireWorkflow(c.evidence.length > 0, "AUDIT_EVIDENCE_REQUIRED");
  for (const e of c.evidence) { exact(e, "id source asOf receivedAt validThrough classification summary"); id(e.id); text(e.source); text(e.summary); [e.asOf, e.receivedAt, e.validThrough].forEach(instant); requireWorkflow(e.receivedAt <= c.auditDate && e.asOf <= c.auditDate && e.validThrough >= e.asOf && ["FACT", "ESTIMATE", "ASSUMPTION"].includes(e.classification), "INVALID_AUDIT_EVIDENCE"); }
  return c;
}
