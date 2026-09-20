import { ValidationError } from "@/shared/errors";
import { instant, dateOnly } from "@/shared/time";
import { decimal } from "@/domain/portfolio/values";
import { snapshot } from "@/domain/scoring/validation";
import { METHOD, STAGE0, type DecisionInput } from "./contracts";
export function requireDecision(condition: unknown, reason: string): asserts condition {
  if (!condition) throw new ValidationError([{ field: "decision", reason, expected: "Approved M4 decision evidence and lineage" }]);
}
export function fields(value: unknown, names: string) {
  requireDecision(value !== null && typeof value === "object" && !Array.isArray(value), "OBJECT_REQUIRED");
  const expected = names.split(" ");
  requireDecision(Object.keys(value).length === expected.length && expected.every(k => Object.hasOwn(value, k)), "EXACT_FIELDS_REQUIRED");
}
export function text(value: unknown): asserts value is string {
  requireDecision(typeof value === "string" && value.trim().length > 0 && value.length <= 4000 && !/[<>\x00-\x08]/.test(value), "PLAIN_TEXT_REQUIRED");
}
export function identifier(value: unknown): asserts value is string {
  requireDecision(typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value), "IDENTIFIER_REQUIRED");
}
function enumeration(value: unknown, allowed: readonly string[]) { requireDecision(typeof value === "string" && allowed.includes(value), "INVALID_ENUM"); }
function texts(value: readonly string[], nonempty = false) { requireDecision(Array.isArray(value) && value.length <= 100 && (!nonempty || value.length > 0), "BOUNDED_LIST_REQUIRED"); value.forEach(text); }
function flags(value: object, names: string) { for (const key of names.split(" ")) requireDecision(typeof value[key as keyof typeof value] === "boolean", "BOOLEAN_REQUIRED"); }
function optionalText(value: unknown) { if (value !== null) text(value); }
function number(value: string, nonnegative = false, whole = false) { const n = decimal(value); requireDecision((!nonnegative || !n.negative) && (!whole || n.integer), "INVALID_NUMERIC_INPUT"); }
export function validateDecision(raw: DecisionInput): DecisionInput {
  const i = snapshot(raw);
  fields(i, "id securityId asOf knownAt recordedAt priorDecisionId revisionReason reviewType scope methods scorecard ranking comparatorScorecards portfolio evidence assessment");
  identifier(i.id); identifier(i.securityId); [i.asOf, i.knownAt, i.recordedAt].forEach(instant);
  requireDecision(i.asOf <= i.knownAt && i.knownAt <= i.recordedAt, "INVALID_CUTOFF");
  if (i.priorDecisionId !== null) { identifier(i.priorDecisionId); text(i.revisionReason); requireDecision(i.id !== i.priorDecisionId, "SELF_LINEAGE"); } else requireDecision(i.revisionReason === null, "REVISION_WITHOUT_PRIOR");
  enumeration(i.reviewType, ["INITIAL", "SCHEDULED", "TRIGGERED", "DCA", "REBALANCE", "EXIT", "OTHER"]);
  enumeration(i.scope, ["FORMAL", "SYNTHETIC_TEST"]);
  fields(i.methods, "decision risk requiredReturn stage0");
  for (const method of Object.values(i.methods)) {
    fields(method, "methodologyId family semanticVersion approvalReference governanceStatus intendedUse effectiveDate configurationReference implementationIdentity governingDocumentReference recordedAt");
    identifier(method.methodologyId); dateOnly(method.effectiveDate); instant(method.recordedAt);
    [method.family, method.semanticVersion, method.configurationReference, method.implementationIdentity, method.governingDocumentReference].forEach(text);
    requireDecision(method.effectiveDate <= i.asOf.slice(0, 10) && method.recordedAt <= i.knownAt, "FUTURE_METHODOLOGY");
    if (i.scope === "FORMAL") requireDecision(method.governanceStatus === "APPROVED" && method.intendedUse === "PRODUCTION" && !!method.approvalReference.trim(), "FORMAL_METHOD_NOT_APPROVED");
    else requireDecision(method.intendedUse === "TEST" && method.family === "TEST_ONLY" && method.governanceStatus === "PROPOSED" && method.approvalReference === "", "SYNTHETIC_METHOD_REQUIRED");
  }
  requireDecision(i.methods.decision.implementationIdentity === METHOD && i.methods.requiredReturn.implementationIdentity === METHOD, "UNSUPPORTED_DECISION_METHOD");
  const c = i.scorecard;
  requireDecision(c.securityId === i.securityId && c.asOf === i.asOf && c.calculatedAt <= i.knownAt && c.input.knownAt <= i.knownAt, "SCORECARD_CONTEXT_MISMATCH");
  requireDecision(c.input.artifactScope === i.scope, "SCORECARD_SCOPE_MISMATCH");
  if (i.scope === "FORMAL") requireDecision(c.methodology.governanceStatus === "APPROVED" && c.methodology.intendedUse === "PRODUCTION", "SCORING_APPROVAL_REQUIRED");
  if (i.ranking) {
    requireDecision(i.ranking.asOf === i.asOf && i.ranking.calculatedAt <= i.knownAt, "RANKING_CONTEXT_MISMATCH");
    const ranked = i.ranking.input.cards.find(x => x.securityId === i.securityId);
    requireDecision(ranked?.id === c.id && JSON.stringify(ranked) === JSON.stringify(c), "RANKING_SCORECARD_MISMATCH");
  }
  requireDecision(Array.isArray(i.evidence) && i.evidence.length > 0 && i.evidence.length <= 1000, "EVIDENCE_REQUIRED");
  const ids = new Set<string>();
  for (const e of i.evidence) {
    fields(e, "id source asOf receivedAt validThrough classification summary"); identifier(e.id); text(e.source); text(e.summary);
    [e.asOf, e.receivedAt, e.validThrough].forEach(instant); enumeration(e.classification, ["FACT", "ESTIMATE", "ASSUMPTION"]);
    requireDecision(e.asOf <= i.asOf && e.receivedAt <= i.knownAt && e.asOf <= e.receivedAt && e.validThrough >= e.asOf, "FUTURE_EVIDENCE");
    requireDecision(!ids.has(e.id), "DUPLICATE_EVIDENCE"); ids.add(e.id);
  }
  const provenance = (a: { analyst: string; source: string; assessedAt: string; evidenceRefs: readonly string[]; rationale: string }) => {
    text(a.analyst); text(a.rationale); instant(a.assessedAt); requireDecision(a.source === "HUMAN" && a.assessedAt <= i.knownAt, "HUMAN_ASSESSMENT_REQUIRED");
    texts(a.evidenceRefs, true); requireDecision(a.evidenceRefs.every(ref => ids.has(ref)), "UNRESOLVED_EVIDENCE_REFERENCE");
  };
  const a = i.assessment;
  fields(a, "analyst source assessedAt evidenceRefs rationale stage0 reviewStatus thesis valuation requiredReturn risk ownershipCase opportunity technical sizing keyPositives keyRisks invalidationConditions nextReviewTrigger missingCritical");
  provenance(a); enumeration(a.reviewStatus, ["FINAL", "PENDING", "ESCALATED"]);
  texts(a.keyPositives); texts(a.keyRisks); texts(a.invalidationConditions, true); text(a.nextReviewTrigger); texts(a.missingCritical);
  fields(a.stage0, "outcome findings methodologyId conditionalBuyPermitted conditionalMitigation");
  enumeration(a.stage0.outcome, STAGE0); texts(a.stage0.findings, true); a.stage0.findings.forEach(x => enumeration(x, STAGE0));
  requireDecision(a.stage0.methodologyId === i.methods.stage0.methodologyId, "STAGE0_METHOD_MISMATCH");
  requireDecision(a.stage0.outcome === STAGE0[Math.min(...a.stage0.findings.map(x => STAGE0.indexOf(x)))], "STAGE0_PRECEDENCE_MISMATCH");
  flags(a.stage0, "conditionalBuyPermitted"); optionalText(a.stage0.conditionalMitigation);
  const expectedStage = ["PASS", "PASS WITH CONDITIONS"].includes(a.stage0.outcome) ? a.stage0.outcome : a.stage0.outcome.startsWith("FAIL") ? "FAIL" : "UNKNOWN";
  requireDecision(c.input.stage0.status === expectedStage, "STAGE0_SCORECARD_CONFLICT");
  fields(a.thesis, "original current status strength breakConditions violatedCondition changes freshUnderwriting incrementalCase declineReviewComplete averagingDown forwardEconomicsImproved valueTrap");
  const t = a.thesis;
  [t.original, t.current, t.changes].forEach(text); texts(t.breakConditions, true); optionalText(t.violatedCondition); optionalText(t.incrementalCase);
  enumeration(t.status, ["INTACT", "IMPROVING", "WEAKENING", "BROKEN", "PENDING"]); enumeration(t.strength, ["HIGH", "MEDIUM", "LOW"]);
  flags(t, "freshUnderwriting declineReviewComplete averagingDown forwardEconomicsImproved valueTrap");
  if (t.status === "BROKEN") text(t.violatedCondition);
  fields(a.valuation, "status expectedReturn lowerReturn upperReturn primaryMethod crossChecks intrinsicLow intrinsicHigh downside upside assumptions sensitivity confidence significantMos exceptionalAsymmetry aggressiveExpansion extremeRobust returnInadequate");
  const v = a.valuation;
  enumeration(v.status, ["DEEPLY ATTRACTIVE", "ATTRACTIVE", "FAIR", "EXPENSIVE", "EXTREME", "UNRELIABLE / PENDING"]); enumeration(v.confidence, ["HIGH", "MEDIUM", "LOW"]);
  [v.primaryMethod, v.downside, v.upside, v.assumptions, v.sensitivity].forEach(text); texts(v.crossChecks);
  flags(v, "significantMos exceptionalAsymmetry aggressiveExpansion extremeRobust returnInadequate");
  for (const n of [v.expectedReturn, v.lowerReturn, v.upperReturn, v.intrinsicLow, v.intrinsicHigh]) if (n !== null) number(n);
  if (v.expectedReturn !== null && v.lowerReturn !== null && v.upperReturn !== null) requireDecision(decimal(v.lowerReturn).units <= decimal(v.expectedReturn).units && decimal(v.expectedReturn).units <= decimal(v.upperReturn).units, "INVALID_RETURN_RANGE");
  if (v.intrinsicLow !== null && v.intrinsicHigh !== null) requireDecision(decimal(v.intrinsicLow).positive && decimal(v.intrinsicLow).units <= decimal(v.intrinsicHigh).units, "INVALID_VALUE_RANGE");
  fields(a.requiredReturn, "riskAdjustmentRequired adjustedHurdle calibrationReference exceptionRequested veryHighQuality strongFinancialResilience strongDownsideProtection resilienceBenefit noBetterQualifiedAlternative rationale");
  const h = a.requiredReturn;
  flags(h, "riskAdjustmentRequired exceptionRequested veryHighQuality strongFinancialResilience strongDownsideProtection resilienceBenefit noBetterQualifiedAlternative"); text(h.rationale); optionalText(h.calibrationReference); if (h.adjustedHurdle !== null) number(h.adjustedHurdle, true);
  fields(a.risk, "veto ownershipProhibited mandatoryReview materialDeterioration hiddenFactorBlocksAdd drawdown riskIncreasing approvalReference smallNavException normalizationPlan elevatedSizeJustification");
  const r = a.risk;
  enumeration(r.veto, ["NONE", "CAPITAL-ALLOCATION VETO", "OWNERSHIP VETO", "POSSIBLE / UNRESOLVED VETO"]); enumeration(r.drawdown, ["NORMAL", "WATCH", "ELEVATED", "CRITICAL", "SEVERE"]);
  flags(r, "ownershipProhibited mandatoryReview materialDeterioration hiddenFactorBlocksAdd riskIncreasing smallNavException"); [r.approvalReference, r.normalizationPlan, r.elevatedSizeJustification].forEach(optionalText);
  const veto = r.veto === "NONE" ? "CLEAR" : r.veto === "POSSIBLE / UNRESOLVED VETO" ? "PENDING" : "ACTIVE";
  requireDecision(c.input.hardVeto.status === veto, "VETO_SCORECARD_CONFLICT");
  fields(a.ownershipCase, "continuedOwnership whyNotAdd whyNotExit whyHoldVersusAlternatives reductionReason zeroOwnershipReason residualRationale targetShares legacyExitPlan");
  const o = a.ownershipCase; flags(o, "continuedOwnership"); [o.whyNotAdd, o.whyNotExit, o.whyHoldVersusAlternatives].forEach(text); [o.residualRationale, o.legacyExitPlan].forEach(optionalText);
  enumeration(o.reductionReason, ["NONE", "CONCENTRATION", "RISK", "THESIS", "VALUATION", "OPPORTUNITY COST", "LEGACY"]); enumeration(o.zeroOwnershipReason, ["NONE", "RISK", "VALUATION", "OPPORTUNITY COST", "LEGACY"]); if (o.targetShares !== null) number(o.targetShares, true, true);
  fields(a.opportunity, "mode comparisonScope excludedComparators cash cashRationale cashExpectedReturn relativeMerit topTier comparators switchingTo robustAfterFriction frictionAndUncertainty zeroSuperiorToResidual");
  const oc = a.opportunity; if (oc.cashExpectedReturn !== null) number(oc.cashExpectedReturn); enumeration(oc.mode, ["INCREMENTAL CAPITAL", "EXISTING CAPITAL REALLOCATION"]); enumeration(oc.cash, ["BETTER", "COMPETITIVE", "INFERIOR"]); enumeration(oc.relativeMerit, ["SUPERIOR", "COMPETITIVE", "INFERIOR", "INDETERMINATE"]);
  [oc.comparisonScope, oc.cashRationale, oc.frictionAndUncertainty].forEach(text); texts(oc.excludedComparators); flags(oc, "topTier robustAfterFriction zeroSuperiorToResidual"); optionalText(oc.switchingTo);
  requireDecision(Array.isArray(oc.comparators) && oc.comparators.length <= 30 && Array.isArray(i.comparatorScorecards) && i.comparatorScorecards.length <= 30, "BOUNDED_COMPARATORS_REQUIRED");
  const seen = new Set<string>();
  for (const x of oc.comparators) {
    fields(x, "analyst source assessedAt evidenceRefs rationale securityId scorecardId decisionId kind expectedReturn lowerReturn upperReturn eligible qualityNoWorse riskNoWorse confidenceNoLower thesisNoWorse fitNoWorse robustlySuperior marginalCapacity");
    provenance(x); identifier(x.securityId); identifier(x.scorecardId); identifier(x.decisionId); enumeration(x.kind, ["NEW", "ADD"]);
    requireDecision(x.securityId !== i.securityId && !seen.has(x.securityId), "DUPLICATE_COMPARATOR"); seen.add(x.securityId);
    [x.expectedReturn, x.lowerReturn, x.upperReturn].forEach(n => number(n)); number(x.marginalCapacity, true);
    requireDecision(decimal(x.lowerReturn).units <= decimal(x.expectedReturn).units && decimal(x.expectedReturn).units <= decimal(x.upperReturn).units, "INVALID_COMPARATOR_RANGE");
    flags(x, "eligible qualityNoWorse riskNoWorse confidenceNoLower thesisNoWorse fitNoWorse robustlySuperior");
    const card = i.comparatorScorecards.find(card => card.id === x.scorecardId);
    requireDecision(card && card.securityId === x.securityId && card.asOf === i.asOf && card.calculatedAt <= i.knownAt && card.input.artifactScope === i.scope, "COMPARATOR_LINEAGE_MISMATCH");
  }
  fields(a.technical, "status timing concreteRisk resumeCondition expiryTrigger mandatoryExitDelaySafe marketMoneyFlow");
  enumeration(a.technical.status, ["FAVORABLE", "NEUTRAL", "UNFAVORABLE", "NOT ASSESSED"]); enumeration(a.technical.timing, ["EXECUTE", "STAGED", "TEMPORARILY DEFERRED"]); flags(a.technical, "mandatoryExitDelaySafe"); text(a.technical.marketMoneyFlow);
  [a.technical.concreteRisk, a.technical.resumeCondition, a.technical.expiryTrigger].forEach(optionalText);
  if (a.technical.timing === "TEMPORARILY DEFERRED") [a.technical.concreteRisk, a.technical.resumeCondition, a.technical.expiryTrigger].forEach(text);
  fields(a.sizing, "proposedShares boardLot price fees economicTargetUpper portfolioImpact whyNotLarger whyNotSmaller operationalBlock");
  const s = a.sizing; [s.proposedShares, s.boardLot].forEach(n => number(n, true, true)); [s.price, s.fees, s.economicTargetUpper].forEach(n => number(n, true));
  requireDecision(decimal(s.boardLot).positive && decimal(s.price).positive && decimal(s.economicTargetUpper).units <= decimal("1").units, "INVALID_SIZING");
  enumeration(s.portfolioImpact, ["IMPROVES PORTFOLIO", "NEUTRAL / ACCEPTABLE", "CONSTRAINED — SMALLER SIZE REQUIRED", "NEGATIVE — DO NOT ADD", "REQUIRES REDUCTION"]);
  text(s.whyNotLarger); text(s.whyNotSmaller); optionalText(s.operationalBlock);
  const p = i.portfolio; fields(p, "integrity capturedAt nav executableCash positions"); instant(p.capturedAt); requireDecision(p.capturedAt <= i.knownAt, "FUTURE_PORTFOLIO");
  fields(p.integrity, "snapshotId portfolioId asOf ledgerWatermark reconstructionMethod referenceVersion priceVersion evidenceId status costStatus reasons");
  requireDecision(p.integrity.asOf === i.asOf && p.integrity.referenceVersion === c.reference.referenceVersion, "PORTFOLIO_CONTEXT_MISMATCH");
  [p.integrity.snapshotId, p.integrity.portfolioId, p.integrity.ledgerWatermark, p.integrity.reconstructionMethod, p.integrity.referenceVersion, p.integrity.priceVersion].forEach(text);
  enumeration(p.integrity.status, ["PASS", "BLOCKED"]); enumeration(p.integrity.costStatus, ["PASS", "BLOCKED"]); texts(p.integrity.reasons); optionalText(p.integrity.evidenceId);
  if (p.nav !== null) number(p.nav, true); if (p.executableCash !== null) number(p.executableCash, true);
  requireDecision(Array.isArray(p.positions) && p.positions.length <= 1000, "POSITIONS_REQUIRED"); const positions = new Set<string>();
  for (const pos of p.positions) { fields(pos, "securityId shares marketValue sector"); identifier(pos.securityId); requireDecision(!positions.has(pos.securityId), "DUPLICATE_POSITION"); positions.add(pos.securityId); number(pos.shares, true, true); if (pos.marketValue !== null) number(pos.marketValue, true); optionalText(pos.sector); }
  return i;
}
