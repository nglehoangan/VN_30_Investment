import { RUBRICS } from "@/domain/scoring/methodology";
import { shareholderIrr } from "./valuation-research";

export const riskIds = ["RG-GOV", "RG-RISK", "RG-UNC"] as const;
type Id = typeof riskIds[number];
type Scenario = Parameters<typeof shareholderIrr>[1];
type Fact = { id: string; classification: "FACT"; state: string; topic: string; kind: string; detail: string;
  source: string; pointer: string; publicBy: string; evidence: "PRIMARY" | "RETAINED_REVIEW" | "UNKNOWN" };
type Control = { stage: "PLANNED" | "IMPLEMENTED" | "EVIDENCED_EFFECTIVE" | "UNKNOWN";
  refs: string[]; through: string; detail: string; effectiveness: string };
export type RiskChannel = {
  id: string; exposure: string; trigger: string; transmission: string; loss: string; owner: string;
  priorTreatment: string; consequenceType: string; control: Control; remaining: string; severity: string; plausibility: string;
  horizon: string; materiality: string; counterevidence: string; distinct: boolean; refs: string[];
  conclusion: string; reviewerDisposition: string;
};
type Model = {
  route: "A" | "B"; points: number; band: string; topics: Record<string, string[]>;
  rationale: string; higher: string; lower: string; counterevidence: string; limits: string;
  confidence: number[]; confidenceRationale: string; materialContradiction: boolean;
  maximum?: { prerequisite: string; disconfirmingRefs: string[] };
  detailedRefs?: string[];
  findings?: { type: "REPORTING_RELIABILITY" | "POTENTIAL_VETO" | "MONITOR"; policy: string; fact: string; rationale: string }[];
  channels?: RiskChannel[]; researchStatus?: string;
  thesis?: { classification: "HIGH" | "MANAGEABLE" | "NARROW"; observedVariability: string;
    refs: string[]; shared: string[]; scenarioCoherence: string; rangeJustification: string; artificialRange: boolean };
};
type Proposal = { ticker: string; cutoff: string; freeze: string; revision: 0 | 1; previous?: string;
  candidates: Partial<Record<Id, Partial<Record<"A" | "B", Model>>>> };
type Review = { proposal: string; freeze: string; revision: number; rubrics: Record<Id, {
  disposition: string; dimensions: { id: string; challenge: string; finding: string; refs: string[] }[];
  blockers: { code: string; dependency: string; reason: string }[]; limits: string;
}> };
export type RiskPacket = { initial: Proposal; initialReview: Review; revision?: Proposal; finalReview: Review };
type Freeze = { ticker: string; cutoff: string; informationCutoff: string; sha256: string; facts: Fact[] };
const filled = (...items: string[]) => items.every(item => typeof item === "string" && item.trim().length > 0);

export function thesisSensitivity(price: number, scenarios: { downside: Scenario; base: Scenario; upside: Scenario }) {
  const variables = ["eps", "growth", "dilution", "payout", "exitMultiple"] as const;
  const base = shareholderIrr(price, scenarios.base);
  const rows = variables.map(variable => {
    const endpoints = [scenarios.downside[variable], scenarios.upside[variable]].sort((a, b) => a - b);
    const irr = endpoints.map(value => shareholderIrr(price, { ...scenarios.base, [variable]: value }));
    return { variable, base: scenarios.base[variable], endpoints, irr,
      direction: variable === "dilution" ? "DECREASING" : "INCREASING",
      sharedDependency: { eps: "normalized earnings", growth: "sustainable growth", dilution: "shareholder entitlement",
        payout: "cash conversion and distribution", exitMultiple: "terminal valuation" }[variable],
      spread: irr[0] === null || irr[1] === null ? null : Math.abs(irr[1] - irr[0]) };
  });
  const joint = { downside: shareholderIrr(price, scenarios.downside), base, upside: shareholderIrr(price, scenarios.upside) };
  return { classification: "CALCULATED", rows, joint };
}

export function evaluateRiskGovernance(freeze: Freeze, packet: RiskPacket, sensitivity: ReturnType<typeof thesisSensitivity>,
  digest: (value: unknown) => string, known: (source: string, pointer: string) => boolean) {
  const { initial, initialReview, revision, finalReview } = packet;
  const final = revision ?? initial;
  const binds = (p: Proposal, r: Review) => p.ticker === freeze.ticker && p.cutoff === freeze.cutoff &&
    p.freeze === freeze.sha256 && r.freeze === p.freeze && r.revision === p.revision && r.proposal === digest(p);
  const requested = riskIds.filter(id => initialReview.rubrics[id]?.disposition === "REVISION_REQUIRED");
  const facts = new Map(freeze.facts.map(fact => [fact.id, fact]));
  const validFact = (fact: Fact) => fact.classification === "FACT" && fact.publicBy <= freeze.informationCutoff &&
    filled(fact.detail, fact.pointer) && ["PRIMARY", "RETAINED_REVIEW", "UNKNOWN"].includes(fact.evidence) &&
    ["OBSERVED", "NOT_OBSERVED_IN_REVIEWED_DOCUMENTS", "UNKNOWN", "NOT_APPLICABLE_WITH_REASON"].includes(fact.state) &&
    known(fact.source, fact.pointer) &&
    !(fact.state === "OBSERVED" && (fact.evidence === "UNKNOWN" || ["SANCTIONS_ABSENT", "RPT_FAIRNESS_ASSUMED"].includes(fact.kind)));
  const common = binds(initial, initialReview) && binds(final, finalReview) && initial.revision === 0 && !initial.previous &&
    (revision ? revision.revision === 1 && revision.previous === digest(initial) && requested.length > 0 :
      requested.length === 0) && facts.size === freeze.facts.length && freeze.facts.every(validFact);
  const usable = (refs: string[]) => refs.length > 0 && refs.every(ref => facts.has(ref));
  const observed = (refs: string[]) => refs.some(ref => facts.get(ref)?.state === "OBSERVED");
  const checkReview = (r: Review["rubrics"][Id]) => !!r && filled(r.limits) &&
    r.dimensions.length === 6 && r.dimensions.every((x,i) => x.id === `RV0${i+1}` &&
      filled(x.challenge, x.finding) && ((i === 1 && x.refs.length === 0) || usable(x.refs))) &&
    r.blockers.every(b => /^RB0[1-5]$/.test(b.code) && filled(b.dependency,b.reason));
  return riskIds.map(id => {
    const rubric = RUBRICS.find(row => row.id === id)!;
    const review = finalReview.rubrics[id];
    const originalReview = initialReview.rubrics[id];
    const cutoffPoints = id === "RG-UNC" ? 2 : 3;
    const assess = (route: "A" | "B") => {
      const model = final.candidates[id]?.[route];
      if (!model) return { gaps: ["ROUTE_NOT_SUPPORTED"], model: null, points: null };
      const gaps: string[] = [];
      const add = (invalid: boolean, code: string) => { if (invalid) gaps.push(code); };
      add(!common, "FREEZE_PROPOSAL_OR_REVISION_BINDING");
      add(!checkReview(originalReview) || !checkReview(review) || !["ACCEPTED","ACCEPTED_WITH_LIMITATIONS"].includes(review.disposition)
        || review.blockers.length > 0 || (requested.includes(id) && !originalReview.blockers.length) ||
        (!!revision && !requested.includes(id) && digest(initial.candidates[id] ?? null) !== digest(final.candidates[id] ?? null)),
        "REASONABLENESS_REVIEW_UNQUALIFIED");
      add(model.route !== route || !rubric.bands.some(b => b.label === model.band && b.min <= model.points && model.points <= b.max) ||
        !Number.isInteger(model.points) || (route === "A" && model.points > cutoffPoints), "CANONICAL_BAND_OR_CEILING");
      add(rubric.topics.some(topic => !model.topics[topic] || !usable(model.topics[topic]) || !observed(model.topics[topic])),
        "NATIVE_EVIDENCE_TOPICS_UNQUALIFIED");
      add(!filled(model.rationale,model.higher,model.lower,model.counterevidence,model.limits,model.confidenceRationale) ||
        model.confidence.length !== 5 || model.confidence.some(v => ![0,1,2].includes(v)) ||
        model.materialContradiction, "MODEL_REASONING_OR_COUNTEREVIDENCE");
      add(route === "B" && (!model.detailedRefs || !usable(model.detailedRefs) ||
        !model.detailedRefs.every(ref => facts.get(ref)?.evidence === "PRIMARY")), "DETAILED_ROUTE_REQUIRES_DIRECT_EVIDENCE");
      add(model.points === rubric.max && (!model.maximum || model.maximum.prerequisite !== rubric.maximumPrerequisite ||
        !usable(model.maximum.disconfirmingRefs) || !observed(model.maximum.disconfirmingRefs)), "MAXIMUM_PREREQUISITE");
      if (id === "RG-GOV") {
        const primaryKinds = (topic: string) => (model.topics[topic] ?? [])
          .some(ref => facts.get(ref)?.evidence === "PRIMARY" && facts.get(ref)?.state === "OBSERVED");
        add(!primaryKinds("auditor") || !primaryKinds("related_parties"), "GOVERNANCE_FACTUAL_BASIS_REQUIRED");
        add(model.points === 4 && !primaryKinds("minority"), "DETAILED_MINORITY_OUTCOMES_REQUIRED");
        add((model.findings ?? []).some(f => !filled(f.rationale,f.policy) || facts.get(f.fact)?.state !== "OBSERVED"),
          "GOVERNANCE_FINDING_UNBOUND");
        add((model.findings ?? []).some(f => f.type !== "MONITOR"), "POLICY_ESCALATION_REQUIRED");
      }
      if (id === "RG-RISK") {
        const channels = model.channels ?? [];
        add(model.researchStatus !== model.band || model.researchStatus === "UNACCEPTABLE", "RESIDUAL_MAPPING_OR_POLICY_VETO");
        const priorLosses = new Set(["DEBT_PRINCIPAL","ROLLOVER_SHORTFALL","STRESS_SURVIVABILITY","GROUP_FCF_LEVEL",
          "INDUSTRY_DEMAND","VALUATION_LEVEL","DILUTION_VALUE"]);
        add(!channels.length || new Set(channels.map(c=>c.id)).size !== channels.length ||
          new Set(channels.map(c=>c.consequenceType)).size !== channels.length || channels.some(c =>
          !c.distinct || !filled(c.consequenceType) || priorLosses.has(c.consequenceType) || !usable(c.refs) || !observed(c.refs) || !RUBRICS.some(r => r.id === c.owner) ||
          !filled(c.id,c.exposure,c.trigger,c.transmission,c.loss,c.priorTreatment,c.control.detail,c.control.effectiveness,
            c.remaining,c.severity,c.plausibility,c.horizon,c.materiality,c.counterevidence,c.conclusion,c.reviewerDisposition) ||
          (c.control.stage !== "UNKNOWN" && (!usable(c.control.refs) || !observed(c.control.refs))) ||
          (c.control.stage === "EVIDENCED_EFFECTIVE" && (c.control.through !== freeze.cutoff ||
            !c.control.refs.some(ref => facts.get(ref)?.kind === "CONTROL_EFFECTIVENESS")))),
          "RISK_CHANNEL_OWNERSHIP_OR_CONTROL_UNQUALIFIED");
        add(model.points >= 2 && !channels.some(c => c.control.stage === "EVIDENCED_EFFECTIVE"),
          "RESIDUAL_CONTROL_EFFECTIVENESS_UNQUALIFIED");
      }
      if (id === "RG-UNC") {
        const t = model.thesis;
        const expected = ["HIGH","MANAGEABLE","NARROW"][model.points];
        add(!t || t.classification !== expected || t.artificialRange || !usable(t.refs) || !observed(t.refs) ||
          !filled(t.observedVariability,t.scenarioCoherence,t.rangeJustification) ||
          new Set(t.shared).size < 2 || sensitivity.rows.length !== 5 || sensitivity.rows.some(r => r.spread === null) ||
          (t.classification === "HIGH" && (!sensitivity.rows.some(r => (r.spread ?? 0) > 0) ||
            !(t.refs ?? []).some(ref => ["OBSERVED_VARIABILITY","SCOPE_CHANGE","FORECAST_REVISION"].includes(facts.get(ref)?.kind ?? "")))) ||
          Object.values(sensitivity.joint).some(value => value === null), "THESIS_SENSITIVITY_OR_DEPENDENCIES_UNQUALIFIED");
      }
      return { gaps, model, points: gaps.length ? null : model.points };
    };
    const B = assess("B"), A = assess("A");
    const chosen = B.points !== null ? B : A;
    const findings = [...(A.model?.findings ?? []), ...(B.model?.findings ?? [])];
    const escalation = findings.some(finding => finding.type !== "MONITOR") ||
      [A,B].some(route => route.model?.researchStatus === "UNACCEPTABLE");
    const points = escalation ? null : chosen.points;
    const model = points === null ? null : chosen.model;
    return { id, points, policyEscalationRequired: escalation, reviewCutoff: freeze.cutoff,
      validity: points === null ? "N/R" : "CONFIRMED_CURRENT", basis: model ? "CURRENT_DIRECT_RESEARCH" : null,
      confidence: model ? { dimensions: model.confidence, total: model.confidence.reduce((sum,v)=>sum+v,0),
        rationale: model.confidenceRationale } : null, findings,
      routeQualification: { route: model?.route ?? null, researchOnly: true, synthetic: false,
        freeze: freeze.sha256, proposal: finalReview.proposal, disposition: review?.disposition ?? null,
        researchResidualRisk: model?.researchStatus ?? null, formalResidualRisk: "NOT_RATED",
        limits: model?.limits ?? review?.limits ?? null }, routes: { A,B } };
  });
}

type RiskResult = ReturnType<typeof evaluateRiskGovernance>[number];

/** A separate current result remains visible even when a valid historical result supplies a provisional Effective Score. */
export function resolveRiskEffectiveScore(current: RiskResult, historical: RiskResult,
  carry?: { validUntil: string; materialEvent: boolean; applicabilityReviewed: boolean; coverage: "RETAINED_ONLY"; rationale: string }) {
  const eligible = !!carry && current.points === null && historical.points !== null && historical.id === current.id &&
    historical.reviewCutoff < current.reviewCutoff && current.reviewCutoff <= carry.validUntil &&
    carry.applicabilityReviewed && !carry.materialEvent && filled(carry.rationale) &&
    current.findings.every(f => f.type === "MONITOR") &&
    [current.routes.A, current.routes.B].every(route => route.gaps.every(gap => gap === "ROUTE_NOT_SUPPORTED"));
  return {
    ...(eligible ? { ...current, points: historical.points, validity: "PROVISIONAL",
      basis: "LATEST_VALID_HISTORICAL_ASSESSMENT", confidence: historical.confidence,
      routeQualification: historical.routeQualification } : current),
    currentReassessmentPoints: current.points, historicalAssessmentPoints: historical.points,
    underlyingAssessmentCutoff: eligible ? historical.reviewCutoff : current.points === null ? null : current.reviewCutoff,
    lifecycle: eligible ? "PROVISIONAL_INHERITED" : current.points === null ? "CURRENT_N/R" : "CURRENT_DIRECT",
    carry: eligible ? carry : null,
  };
}
