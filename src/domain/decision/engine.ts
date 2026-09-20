import { decimal, Decimal } from "@/domain/portfolio/values";
import type { RequiredReturnAssessment } from "@/domain/scoring/eligibility";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { type DecisionInput, type DecisionState, EXECUTION, METHOD } from "./contracts";
import { requireDecision, validateDecision } from "./validation";
const atLeast = (a: string, b: string) => decimal(a).units >= decimal(b).units;
const above = (a: string, b: string) => decimal(a).units > decimal(b).units;
const category = (i: DecisionInput, key: string, minimum: number) => {
  const value = i.scorecard.categories.find(c => c.category === key)?.points;
  return value !== null && value !== undefined && BigInt(value) >= BigInt(minimum);
};
/** M4 executable owner; estimates/qualitative exception evidence remain analyst-owned. */
function requiredReturn(i: DecisionInput): Omit<RequiredReturnAssessment, "expectedReturn"> & { readonly expectedReturn: string | null } {
  const a = i.assessment, h = a.requiredReturn, expected = a.valuation.expectedReturn;
  const owned = i.portfolio.positions.some(p => p.securityId === i.securityId && decimal(p.shares).positive);
  const riskAdjusted = h.riskAdjustmentRequired || i.scorecard.input.residualRisk.status.startsWith("ELEVATED") || i.scorecard.input.normalization.cycle === "HIGHLY_CYCLICAL";
  const exception = !owned && h.exceptionRequested && !riskAdjusted && h.veryHighQuality && h.strongFinancialResilience && h.strongDownsideProtection && h.resilienceBenefit && h.noBetterQualifiedAlternative && i.scorecard.confidence === "HIGH" && i.scorecard.input.residualRisk.status === "LOW" && a.valuation.confidence === "HIGH";
  const calibrated = !riskAdjusted || (h.adjustedHurdle !== null && above(h.adjustedHurdle, "0.15") && h.calibrationReference !== null);
  const hurdle = riskAdjusted && calibrated ? h.adjustedHurdle! : exception ? "0.12" : "0.15";
  const assessed = expected !== null && calibrated;
  const pass = assessed && atLeast(expected!, hurdle);
  return deepFreeze({ owner: "M4", methodologyId: i.methods.requiredReturn.methodologyId, asOf: i.asOf, evaluatedAt: i.recordedAt,
    status: !assessed ? "NOT_ASSESSED" : pass ? "PASS" : "FAIL", evidenceRefs: a.evidenceRefs,
    expectedReturn: expected, requiredReturn: hurdle, hurdleMet: pass,
    exceptionApplied: pass && exception && !atLeast(expected!, "0.15") });
}
function portfolioImpact(i: DecisionInput) {
  const p = i.portfolio, s = i.assessment.sizing, r = i.assessment.risk;
  const position = p.positions.find(p => p.securityId === i.securityId);
  const sector = i.scorecard.reference.sector;
  const owned = position !== undefined && decimal(position.shares).positive;
  const complete = p.integrity.status === "PASS" && p.nav !== null && decimal(p.nav).positive && p.executableCash !== null && p.positions.every(x => x.marketValue !== null && x.sector !== null);
  const cashRequired = decimal(s.proposedShares).mul(decimal(s.price)).add(decimal(s.fees));
  if (!complete) return { owned, shares: position?.shares ?? "0", status: "BLOCKED" as const, currentWeight: null, postWeight: null, sectorWeight: null, postSectorWeight: null, cashRequired: cashRequired.toString(), cashSufficient: false, allocationBlocked: true, reductionRequired: false, reasons: ["ACTIONABILITY BLOCKED — PORTFOLIO STATE UNRECONCILED"] };
  const nav = decimal(p.nav!), value = decimal(position?.marketValue ?? "0");
  const sectorValue = p.positions.filter(x => x.sector === sector).reduce((n, x) => n.add(decimal(x.marketValue!)), Decimal.zero);
  const currentWeight = value.div(nav).toString(), sectorWeight = sectorValue.div(nav).toString();
  const tradeValue = decimal(s.proposedShares).mul(decimal(s.price));
  const postNav = nav.sub(decimal(s.fees));
  requireDecision(postNav.positive, "FEES_EXCEED_NAV");
  const postWeight = value.add(tradeValue).div(postNav).toString(), postSectorWeight = sectorValue.add(tradeValue).div(postNav).toString();
  const reasons: string[] = [];
  const exception = r.smallNavException && r.approvalReference !== null && r.normalizationPlan !== null && !above(currentWeight, "0.15");
  if (above(currentWeight, "0.15")) reasons.push("CURRENT_POSITION_NO_ADD");
  if (above(postWeight, "0.15") && !exception) reasons.push("POST_POSITION_NO_ADD");
  if (above(postWeight, "0.30")) reasons.push("EMERGENCY_CEILING");
  if (above(postWeight, "0.10") && r.elevatedSizeJustification === null) reasons.push("ELEVATED_SIZE_JUSTIFICATION_REQUIRED");
  if (above(postWeight, s.economicTargetUpper)) reasons.push("ECONOMIC_TARGET_CAP");
  if (above(postSectorWeight, "0.30") && !(above(postSectorWeight, "0.35") && !above(postSectorWeight, "0.40") && r.approvalReference)) reasons.push("SECTOR_NO_ADD");
  if (above(postSectorWeight, "0.40")) reasons.push("SECTOR_CEILING");
  if (r.hiddenFactorBlocksAdd) reasons.push("HIDDEN_FACTOR_NO_ADD");
  if (["CRITICAL", "SEVERE"].includes(r.drawdown) && r.riskIncreasing && !r.approvalReference) reasons.push("DRAWDOWN_APPROVAL_REQUIRED");
  if (["NEGATIVE — DO NOT ADD", "REQUIRES REDUCTION"].includes(s.portfolioImpact)) reasons.push(s.portfolioImpact);
  return { owned, shares: position?.shares ?? "0", status: "PASS" as const, currentWeight, postWeight, sectorWeight, postSectorWeight,
    cashRequired: cashRequired.toString(), cashSufficient: decimal(p.executableCash!).units >= cashRequired.units,
    allocationBlocked: reasons.length > 0, reductionRequired: (above(currentWeight, "0.25") && !(r.smallNavException && r.approvalReference && r.normalizationPlan)) || s.portfolioImpact === "REQUIRES REDUCTION", reasons };
}
function opportunityCost(i: DecisionInput) {
  const a = i.assessment, o = a.opportunity;
  const comparators = o.comparators.map(x => {
    const c = i.comparatorScorecards.find(c => c.id === x.scorecardId)!;
    const current = x.evidenceRefs.every(ref => i.evidence.find(e => e.id === ref)!.validThrough >= i.asOf);
    const eligible = x.eligible && current && c.validity === "VALID — ACTIONABLE" && c.confidence !== "LOW" && c.reference.membership === "MEMBER" && decimal(x.marginalCapacity).positive;
    const confidenceOrder = ["HIGH", "MEDIUM", "LOW"];
    const riskOrder = ["LOW", "MODERATE", "ELEVATED_CONTROLLED", "ELEVATED_WEAK", "HIGH", "UNACCEPTABLE"];
    const noWorse = x.qualityNoWorse && x.riskNoWorse && x.confidenceNoLower && x.thesisNoWorse && x.fitNoWorse &&
      confidenceOrder.indexOf(c.confidence) <= confidenceOrder.indexOf(i.scorecard.confidence) &&
      riskOrder.indexOf(c.input.residualRisk.status) <= riskOrder.indexOf(i.scorecard.input.residualRisk.status) &&
      c.methodology.methodologyId === i.scorecard.methodology.methodologyId && c.input.expectedReturn?.assumptionBasis === i.scorecard.input.expectedReturn?.assumptionBasis;
    const advantage = a.valuation.expectedReturn === null ? null : decimal(x.expectedReturn).sub(decimal(a.valuation.expectedReturn)).toString();
    return { securityId: x.securityId, scorecardId: x.scorecardId, eligible, noWorse, advantage, robust: x.robustlySuperior && noWorse && eligible, evidenceRefs: x.evidenceRefs };
  });
  const replacement = comparators.find(x => x.securityId === o.switchingTo);
  const cashAdvantage = o.cashExpectedReturn !== null && a.valuation.expectedReturn !== null ? decimal(o.cashExpectedReturn).sub(decimal(a.valuation.expectedReturn)).toString() : null;
  const cashSwitch = o.switchingTo === "CASH" && o.cash === "BETTER" && cashAdvantage !== null && atLeast(cashAdvantage, "0.03");
  const stockSwitch = !!replacement?.robust && replacement.advantage !== null && atLeast(replacement.advantage, "0.03");
  const switchEligible = o.mode === "EXISTING CAPITAL REALLOCATION" && (cashSwitch || stockSwitch) && o.robustAfterFriction;
  const dominates = comparators.some(x => x.robust && x.advantage !== null && above(x.advantage, "0.02"));
  const incrementalEligible = !dominates && o.cash !== "BETTER" && ["SUPERIOR", "COMPETITIVE"].includes(o.relativeMerit);
  return { comparators, switchEligible, incrementalEligible, cash: o.cash, relativeMerit: dominates ? "INFERIOR" : o.relativeMerit,
    capitalUse: incrementalEligible ? "CANDIDATE" : "HOLD CASH", scope: o.comparisonScope, frictionAndUncertainty: o.frictionAndUncertainty };
}
/** Pure, deterministic M4 routing. Does not calculate scores, rank securities or replay a ledger. */
export function decide(raw: DecisionInput) {
  const i = validateDecision(raw), a = i.assessment, c = i.scorecard, p = portfolioImpact(i), oc = opportunityCost(i), hurdle = requiredReturn(i);
  const member = c.reference.membership === "MEMBER";
  const missing = [...a.missingCritical, ...a.evidenceRefs.filter(ref => i.evidence.find(e => e.id === ref)!.validThrough < i.asOf).map(ref => `STALE:${ref}`)];
  const pending = missing.length > 0 || a.stage0.outcome.startsWith("PENDING") || a.thesis.status === "PENDING" || a.reviewStatus !== "FINAL" || a.risk.mandatoryReview || c.totalScore === null || c.missingEvidence.length > 0 || c.blockingEvidence.length > 0 || a.valuation.expectedReturn === null || a.valuation.status === "UNRELIABLE / PENDING" || p.status === "BLOCKED";
  const reasons: string[] = [];
  let state: DecisionState;
  const ownershipExit = a.risk.ownershipProhibited || a.risk.veto === "OWNERSHIP VETO" || a.thesis.status === "BROKEN";
  const exitReason = a.risk.ownershipProhibited ? "OWNERSHIP_PROHIBITED" : a.risk.veto === "OWNERSHIP VETO" ? "OWNERSHIP_VETO" : "THESIS_BROKEN";
  const valuedExit = a.valuation.status === "EXTREME" && a.valuation.extremeRobust && a.valuation.returnInadequate && a.valuation.confidence !== "LOW" && oc.switchEligible && a.opportunity.zeroSuperiorToResidual;
  const residual = a.ownershipCase.continuedOwnership && a.ownershipCase.residualRationale !== null;
  const reduction = a.ownershipCase.reductionReason;
  const independentReduce = (reduction === "RISK" && (a.risk.hiddenFactorBlocksAdd || a.risk.materialDeterioration)) || (reduction === "THESIS" && a.thesis.status === "WEAKENING") || (reduction === "CONCENTRATION" && p.currentWeight !== null && above(p.currentWeight, "0.15")) || (reduction === "LEGACY" && !member && a.ownershipCase.legacyExitPlan !== null);
  const discretionaryReduce = !pending && ((reduction === "VALUATION" && ["EXPENSIVE", "EXTREME"].includes(a.valuation.status) && a.valuation.returnInadequate && a.valuation.confidence !== "LOW") || (reduction === "OPPORTUNITY COST" && oc.switchEligible));
  if (ownershipExit) { state = p.owned ? "SELL" : "AVOID"; reasons.push(exitReason); }
  else if (p.owned && !pending && !a.ownershipCase.continuedOwnership && ((a.ownershipCase.zeroOwnershipReason === "VALUATION" && valuedExit) || (a.ownershipCase.zeroOwnershipReason === "OPPORTUNITY COST" && oc.switchEligible && a.opportunity.zeroSuperiorToResidual) || (a.ownershipCase.zeroOwnershipReason === "RISK" && a.risk.materialDeterioration) || (a.ownershipCase.zeroOwnershipReason === "LEGACY" && !member && a.ownershipCase.legacyExitPlan))) { state = "SELL"; reasons.push(`ZERO_OWNERSHIP_${a.ownershipCase.zeroOwnershipReason}`); }
  else if (p.owned && residual && (p.reductionRequired || independentReduce || discretionaryReduce)) { state = "REDUCE"; reasons.push(p.reductionRequired ? "PORTFOLIO_REQUIRES_REDUCTION" : `REDUCTION_${reduction}`); }
  else {
    const blocks: string[] = [];
    if (!member) blocks.push("NON_MEMBER_NO_NEW_CAPITAL");
    const conditional = !p.owned && a.stage0.outcome === "PASS WITH CONDITIONS" && a.stage0.conditionalBuyPermitted && a.stage0.conditionalMitigation !== null && a.risk.veto === "NONE";
    if (a.stage0.outcome !== "PASS" && !conditional) blocks.push(a.stage0.outcome);
    if (c.validity !== "VALID — ACTIONABLE") blocks.push(c.validity);
    if (c.totalScore === null || c.missingEvidence.length || c.blockingEvidence.length || c.dataQuality !== "VALID") blocks.push("SCORING_EVIDENCE_INCOMPLETE");
    if (c.confidence === "LOW") blocks.push("LOW_CONFIDENCE_NO_NEW_CAPITAL");
    if (pending) blocks.push("PENDING_EVIDENCE_OR_REVIEW");
    if (!["INTACT", "IMPROVING"].includes(a.thesis.status) || !a.thesis.freshUnderwriting) blocks.push("FRESH_VALID_THESIS_REQUIRED");
    if (a.risk.veto !== "NONE" || a.risk.mandatoryReview || a.risk.materialDeterioration || ["HIGH", "UNACCEPTABLE"].includes(c.input.residualRisk.status)) blocks.push("RISK_BLOCKS_NEW_CAPITAL");
    if (![["BQ", 13], ["FH", 8], ["RG", 5], ["VAL", 10]].every(([key, min]) => category(i, String(key), Number(min)))) blocks.push("CATEGORY_GATE_FAILED");
    if (hurdle.status !== "PASS") blocks.push(`REQUIRED_RETURN_${hurdle.status}`);
    if (!["ATTRACTIVE", "DEEPLY ATTRACTIVE"].includes(a.valuation.status) && !(a.valuation.status === "FAIR" && hurdle.exceptionApplied)) blocks.push("VALUATION_NOT_ATTRACTIVE");
    if (a.valuation.intrinsicLow === null || a.valuation.intrinsicHigh === null || a.valuation.lowerReturn === null || a.valuation.upperReturn === null || !a.valuation.crossChecks.length || a.valuation.confidence === "LOW" || a.valuation.aggressiveExpansion) blocks.push("VALUATION_EVIDENCE_INSUFFICIENT");
    if (p.allocationBlocked) blocks.push(...p.reasons);
    if (!oc.incrementalEligible) blocks.push("OPPORTUNITY_COST_FAVORS_ALTERNATIVE_OR_CASH");
    if (p.owned && (!a.thesis.incrementalCase || !a.thesis.declineReviewComplete || a.thesis.valueTrap || (a.thesis.averagingDown && !a.thesis.forwardEconomicsImproved))) blocks.push("ADD_UNDERWRITING_FAILED");
    if (blocks.length) {
      reasons.push(...blocks);
      if (!p.owned) state = "AVOID";
      else {
        requireDecision(a.ownershipCase.continuedOwnership && (member || a.ownershipCase.legacyExitPlan !== null), "OWNED_RESIDUAL_CASE_REQUIRED");
        requireDecision(a.stage0.outcome !== "FAIL — INVESTABILITY", "INVESTABILITY_FAILURE_REQUIRES_REDUCE_SELL_REVIEW");
        state = "HOLD";
      }
    } else {
      const strong = a.stage0.outcome === "PASS" && c.confidence === "HIGH" && category(i, "BQ", 18) && category(i, "FH", 11) && category(i, "RG", 7) && ["LOW", "MODERATE"].includes(c.input.residualRisk.status) && atLeast(a.valuation.expectedReturn!, "0.18") && a.valuation.significantMos && a.valuation.exceptionalAsymmetry && a.valuation.confidence === "HIGH" && a.opportunity.topTier && a.opportunity.relativeMerit === "SUPERIOR" && a.opportunity.cash === "INFERIOR";
      state = strong ? "STRONG BUY" : p.owned ? "ACCUMULATE" : "BUY";
      reasons.push("THESIS_CATEGORY_VALUATION_RISK_PORTFOLIO_OPPORTUNITY_GATES_PASSED");
    }
  }
  if (state === "REDUCE") requireDecision(a.ownershipCase.targetShares !== null && decimal(a.ownershipCase.targetShares).positive && decimal(a.ownershipCase.targetShares).units < decimal(p.shares).units, "REDUCE_TARGET_REQUIRED");
  const positive = ["STRONG BUY", "BUY", "ACCUMULATE"].includes(state), sale = state === "SELL" || state === "REDUCE";
  const invalidLot = positive && (!decimal(a.sizing.proposedShares).positive || decimal(a.sizing.proposedShares).units % decimal(a.sizing.boardLot).units !== 0n);
  if (invalidLot) reasons.push("NO_VALID_PROPOSED_LOT");
  let execution: typeof EXECUTION[number] = positive || sale ? "EXECUTE" : "NOT ACTIONABLE";
  if ((positive || sale) && (p.status === "BLOCKED" || a.sizing.operationalBlock || invalidLot)) execution = "BLOCKED — PORTFOLIO/RISK";
  else if (positive && !p.cashSufficient) execution = "REQUIRES CASH ACCUMULATION";
  else if (positive || sale) {
    execution = a.technical.timing;
    if (sale && ownershipExit && execution === "TEMPORARILY DEFERRED" && !a.technical.mandatoryExitDelaySafe) execution = "STAGED";
  }
  const reviewStatus = a.reviewStatus === "ESCALATED" || a.risk.veto === "POSSIBLE / UNRESOLVED VETO" ? "ESCALATED" : pending ? "PENDING" : "FINAL";
  const authorized = execution === "EXECUTE" || execution === "STAGED";
  const action = positive ? p.owned ? "ADD" : "INITIATE" : state;
  const target = state === "SELL" ? "0" : state === "REDUCE" ? a.ownershipCase.targetShares : null;
  const quantity = !authorized ? null : sale ? decimal(p.shares).sub(decimal(target!)).toString() : positive ? a.sizing.proposedShares : null;
  let finalPortfolioImpact = p;
  if (sale && p.status === "PASS" && target !== null) {
    const position = i.portfolio.positions.find(x => x.securityId === i.securityId)!;
    const sold = decimal(p.shares).sub(decimal(target));
    const releasedValue = decimal(position.marketValue!).proportional(sold, decimal(p.shares));
    const navAfterFees = decimal(i.portfolio.nav!).sub(decimal(a.sizing.fees));
    const sectorValue = i.portfolio.positions.filter(x => x.sector === position.sector).reduce((sum, x) => sum.add(decimal(x.marketValue!)), Decimal.zero);
    finalPortfolioImpact = { ...p, postWeight: decimal(position.marketValue!).sub(releasedValue).div(navAfterFees).toString(), postSectorWeight: sectorValue.sub(releasedValue).div(navAfterFees).toString() };
  }

  return deepFreeze({ id: i.id, securityId: i.securityId, ticker: c.ticker, asOf: i.asOf, knownAt: i.knownAt, recordedAt: i.recordedAt, scope: i.scope,
    methodology: METHOD, priorDecisionId: i.priorDecisionId, decisionState: state, executionStatus: execution, reviewStatus,
    decisionQualifier: state === "HOLD" && reviewStatus !== "FINAL" ? "Provisional HOLD" : state === "AVOID" && reviewStatus !== "FINAL" ? "TEMPORARY — PENDING EVIDENCE" : null,
    ownership: p.owned ? "OWNED" : "UNOWNED", membership: member ? "CURRENT" : p.owned ? "LEGACY" : "NON-ELIGIBLE",
    tradeAuthorization: authorized ? "AUTHORIZED" : "NOT AUTHORIZED", suggestedAction: authorized ? `${action} ${quantity ?? "0"} shares` : positive || sale ? "DO NOT TRADE NOW" : state === "HOLD" ? "HOLD — DO NOT DEPLOY CAPITAL" : "DO NOT BUY",
    action, executableShares: quantity, targetShares: target, reasons, missingEvidence: missing, requiredReturn: hurdle, portfolioImpact: finalPortfolioImpact, opportunityCost: { ...oc, capitalUse: positive && p.cashSufficient ? "CANDIDATE" : "HOLD CASH" },
    lineage: { scorecardId: c.id, rankingId: i.ranking?.id ?? null, snapshotId: i.portfolio.integrity.snapshotId, ledgerWatermark: i.portfolio.integrity.ledgerWatermark, methods: i.methods, scoringMethod: c.methodology, evidenceCutoff: i.knownAt, evidenceRefs: a.evidenceRefs, priorDecisionId: i.priorDecisionId },
    pipeline: ["Business Quality", "Financial Health", "Growth", "Industry", "Valuation", "Risks", "Market / Money Flow", "Technical Entry", "Existing Portfolio", "Opportunity Cost", "Final Decision"].map(step => ({ step, status: a.stage0.outcome.startsWith("FAIL") && !p.owned && step !== "Final Decision" ? "N/A — TERMINATED AT STAGE 0" : "ASSESSED", reference: ["Business Quality", "Financial Health", "Growth", "Industry"].includes(step) ? c.id : i.id })), input: i });
}
export type Decision = ReturnType<typeof decide>;

/** The M6.4 ranking boundary accepts only an actual estimate, never fabricated zero. */
export function assessRequiredReturn(raw: DecisionInput) {
  return requiredReturn(validateDecision(raw));
}
export function rankingRequiredReturn(raw: DecisionInput): RequiredReturnAssessment {
  const result = assessRequiredReturn(raw);
  requireDecision(result.expectedReturn !== null, "RETURN_ESTIMATE_MISSING");
  return deepFreeze({ ...result, expectedReturn: result.expectedReturn });
}
