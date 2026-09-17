import { dateOnly, instant, vietnamBusinessDate } from "@/shared/time";
import { referenceAt, type ReferenceData } from "@/domain/portfolio/reference";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { decimal } from "@/domain/portfolio/values";
import type { MethodologyRecord } from "@/domain/methodology/record";
import { CATEGORY_MAXIMA, IMPLEMENTATION, RUBRICS, SECTORS, VERSION, type Category, type Sector } from "./methodology";
import { check, id, keys, list, snapshot, text, unique } from "./validation";
import { available, validateEvidence, type Evidence } from "./evidence";
import { calculateMetrics, type MetricRequest } from "./metrics";
export interface Assessment {
  readonly subcategory: string; readonly assessment: string; readonly selectedPoints: number;
  readonly analyst: string; readonly source: "HUMAN"; readonly assessedAt: string; readonly methodologyVersion: string;
  readonly rationale: string; readonly strongerEvidence: boolean; readonly maximumPrerequisitesMet: boolean;
  readonly exceptionalJustification: string | null; readonly disconfirmingEvidence: readonly string[];
  readonly evidence: readonly { readonly topic: string; readonly refs: readonly string[]; readonly rationale: string }[];
  readonly sector: Sector; readonly sectorRationale: string; readonly economicChannel: string;
}
export type Confidence = "HIGH" | "MEDIUM" | "LOW";
export type ResidualRisk = "LOW" | "MODERATE" | "ELEVATED_CONTROLLED" | "ELEVATED_WEAK" | "HIGH" | "UNACCEPTABLE";
export interface ScoreInput {
  readonly id: string; readonly securityId: string; readonly companyName: string; readonly asOf: string; readonly knownAt: string; readonly calculatedAt: string;
  readonly priorScorecardId: string | null; readonly revisionReason: string | null; readonly methodology: MethodologyRecord;
  readonly reference: { readonly data: ReferenceData; readonly receivedAt: string; readonly taxonomy: string };
  readonly normalization: { readonly sector: Sector; readonly cycle: "NON_CYCLICAL" | "MILDLY_CYCLICAL" | "CYCLICAL" | "HIGHLY_CYCLICAL"; readonly peakCycleRisk: boolean; readonly method: string; readonly peerIds: readonly string[]; readonly peerBasis: "ABSOLUTE_HISTORY" | "VN30" | "BROADER"; readonly rationale: string; readonly actionComparable: boolean; readonly actionEvidenceRefs: readonly string[] };
  readonly evidence: readonly Evidence[]; readonly metrics: readonly MetricRequest[]; readonly assessments: readonly Assessment[];
  readonly stage0: "PASS" | "FAIL" | "UNKNOWN"; readonly hardVeto: boolean;
  readonly confidence: { readonly level: Confidence; readonly analyst: string; readonly rationale: string; readonly dimensions: readonly ("Strong" | "Adequate" | "Weak")[] };
  readonly residualRisk: ResidualRisk; readonly expectedReturn: { readonly value: string; readonly modelConfidence: Confidence; readonly assumptionBasis: string; readonly aggressiveExpansion: boolean; readonly downsideDominates: boolean; readonly nearLowerBoundary: boolean; readonly hurdle: { readonly required:string; readonly analyst:string; readonly rationale:string; readonly evidenceRefs:readonly string[]; readonly exception: { readonly veryHighQuality:boolean; readonly downsideProtection:string; readonly portfolioResilience:string } | null } } | null;
  readonly criticalMissing: readonly string[]; readonly thesis: { readonly core: string; readonly compounding: string; readonly valuation: string; readonly downside: string; readonly invalidation: string };
  readonly doubleCountReview: { readonly analyst: string; readonly rationale: string; readonly passed: boolean };
}
export function calculateScorecard(raw: ScoreInput) {
  const input=snapshot(raw);
  keys(input,"id securityId companyName asOf knownAt calculatedAt priorScorecardId revisionReason methodology reference normalization evidence metrics assessments stage0 hardVeto confidence residualRisk expectedReturn criticalMissing thesis doubleCountReview");
  id(input.id); id(input.securityId); text(input.companyName);
  [input.asOf,input.knownAt,input.calculatedAt].forEach(instant);
  check(input.asOf <= input.knownAt && input.knownAt <= input.calculatedAt,"INVALID_CALCULATION_CUTOFF");
  if (input.priorScorecardId !== null) { id(input.priorScorecardId); text(input.revisionReason); }
  keys(input.methodology,"methodologyId family semanticVersion approvalReference effectiveDate configurationReference implementationIdentity governingDocumentReference recordedAt");
  Object.values(input.methodology).forEach(text); dateOnly(input.methodology.effectiveDate); instant(input.methodology.recordedAt);
  check(input.methodology.family === "SCORING" && input.methodology.implementationIdentity === IMPLEMENTATION && input.methodology.semanticVersion === VERSION,"UNSUPPORTED_METHODOLOGY");
  check(input.methodology.effectiveDate <= input.asOf.slice(0,10) && input.methodology.recordedAt <= input.knownAt,"FUTURE_METHODOLOGY");
  keys(input.reference,"data receivedAt taxonomy"); instant(input.reference.receivedAt); text(input.reference.taxonomy);
  check(input.reference.receivedAt <= input.knownAt,"FUTURE_REFERENCE");
  keys(input.reference.data,"version intervals");
  for (const row of input.reference.data.intervals) keys(row,"id kind securityId from to value taxonomy sourceReference");
  const reference=referenceAt(input.reference.data,input.securityId,vietnamBusinessDate(instant(input.asOf)),input.reference.taxonomy);
  const n=input.normalization;
  keys(n,"sector cycle peakCycleRisk method peerIds peerBasis rationale actionComparable actionEvidenceRefs");
  check(SECTORS.includes(n.sector) && reference.sector === n.sector,"MISSING_OR_MISMATCHED_SECTOR");
  check(["NON_CYCLICAL","MILDLY_CYCLICAL","CYCLICAL","HIGHLY_CYCLICAL"].includes(n.cycle),"INVALID_CYCLE");
  check(["ABSOLUTE_HISTORY","VN30","BROADER"].includes(n.peerBasis),"INVALID_PEER_BASIS");
  list(n.peerIds); unique(n.peerIds); n.peerIds.forEach(id); text(n.method); text(n.rationale);
  check(n.peerBasis !== "VN30" || n.peerIds.length >= 4,"SMALL_PEER_PERCENTILE_PROHIBITED");
  check(typeof n.peakCycleRisk === "boolean" && typeof n.actionComparable === "boolean","NORMALIZATION_FLAGS_REQUIRED");
  list(n.actionEvidenceRefs);
  const conflicts=validateEvidence(input.evidence,input.securityId,input.asOf,input.knownAt);
  const usable=(ref: string) => input.evidence.some(e => e.id === ref && available(e,input.asOf,conflicts));
  const metrics=calculateMetrics(input.metrics,input.evidence,n.sector,input.asOf,conflicts,["CYCLICAL","HIGHLY_CYCLICAL"].includes(n.cycle));
  check(["PASS","FAIL","UNKNOWN"].includes(input.stage0) && typeof input.hardVeto === "boolean","INVALID_GATE");
  check(["LOW","MODERATE","ELEVATED_CONTROLLED","ELEVATED_WEAK","HIGH","UNACCEPTABLE"].includes(input.residualRisk),"INVALID_RISK");
  keys(input.confidence,"level analyst rationale dimensions"); text(input.confidence.analyst); text(input.confidence.rationale);
  check(["HIGH","MEDIUM","LOW"].includes(input.confidence.level),"INVALID_CONFIDENCE");
  list(input.confidence.dimensions); check(input.confidence.dimensions.length===5 && input.confidence.dimensions.every(d => ["Strong","Adequate","Weak"].includes(d)),"FIVE_CONFIDENCE_DIMENSIONS_REQUIRED");
  keys(input.thesis,"core compounding valuation downside invalidation"); Object.values(input.thesis).forEach(text);
  check(Object.keys(input.thesis).length===5,"THESIS_REQUIRED");
  keys(input.doubleCountReview,"analyst rationale passed"); text(input.doubleCountReview.analyst); text(input.doubleCountReview.rationale); check(typeof input.doubleCountReview.passed === "boolean","REVIEW_REQUIRED");
  if (input.expectedReturn) {
    keys(input.expectedReturn,"value modelConfidence assumptionBasis aggressiveExpansion downsideDominates nearLowerBoundary hurdle");
    decimal(input.expectedReturn.value); text(input.expectedReturn.assumptionBasis);
    const h=input.expectedReturn.hurdle;keys(h,"required analyst rationale evidenceRefs exception");text(h.analyst);text(h.rationale);list(h.evidenceRefs);check(h.evidenceRefs.length>0,"HURDLE_EVIDENCE_REQUIRED");
    const required=decimal(h.required);check(required.units>=decimal("0.12").units,"BELOW_ABSOLUTE_RETURN_FLOOR");
    if(required.units<decimal("0.15").units){
      check(h.exception,"EXPLICIT_HURDLE_EXCEPTION_REQUIRED");keys(h.exception,"veryHighQuality downsideProtection portfolioResilience");
      check(h.exception.veryHighQuality&&input.residualRisk==="LOW"&&input.confidence.level==="HIGH","HURDLE_EXCEPTION_QUALIFIERS_REQUIRED");text(h.exception.downsideProtection);text(h.exception.portfolioResilience);
    } else check(h.exception===null,"UNNECESSARY_HURDLE_EXCEPTION");
    if(input.residualRisk.startsWith("ELEVATED"))check(required.units>decimal("0.15").units,"HIGHER_RISK_REQUIRES_HIGHER_HURDLE");
    check(["HIGH","MEDIUM","LOW"].includes(input.expectedReturn.modelConfidence),"INVALID_MODEL_CONFIDENCE");
    check([input.expectedReturn.aggressiveExpansion,input.expectedReturn.downsideDominates,input.expectedReturn.nearLowerBoundary].every(v => typeof v === "boolean"),"RETURN_QUALIFIERS_REQUIRED");
  }
  list(input.criticalMissing); input.criticalMissing.forEach(text); list(input.assessments,23); unique(input.assessments.map(a => a.subcategory));
  for (const a of input.assessments) {
    keys(a,"subcategory assessment selectedPoints analyst source assessedAt methodologyVersion rationale strongerEvidence maximumPrerequisitesMet exceptionalJustification disconfirmingEvidence evidence sector sectorRationale economicChannel");
    const rubric=RUBRICS.find(r => r.id===a.subcategory); check(rubric,"UNKNOWN_SUBCATEGORY");
    const band=rubric.bands.find(b => b.label===a.assessment);
    check(band && Number.isInteger(a.selectedPoints) && a.selectedPoints>=band.min && a.selectedPoints<=band.max,"POINT_OUTSIDE_ASSESSMENT_BAND");
    check(a.source==="HUMAN" && a.methodologyVersion===VERSION,"EXPLICIT_HUMAN_ASSESSMENT_REQUIRED");
    [a.analyst,a.rationale,a.sectorRationale,a.economicChannel].forEach(text); instant(a.assessedAt);
    check(a.assessedAt<=input.knownAt && a.sector===n.sector,"ASSESSMENT_CONTEXT_MISMATCH");
    check(typeof a.strongerEvidence === "boolean" && typeof a.maximumPrerequisitesMet === "boolean","ASSESSMENT_FLAGS_REQUIRED");
    if (band.max>band.min && a.selectedPoints===band.max) check(a.strongerEvidence,"UPPER_POINT_SUPPORT_REQUIRED");
    list(a.disconfirmingEvidence); list(a.evidence); unique(a.evidence.map(e => e.topic));
    for (const e of a.evidence) { keys(e,"topic refs rationale"); check(rubric.topics.includes(e.topic),"UNKNOWN_EVIDENCE_TOPIC"); list(e.refs); check(e.refs.length>0,"EVIDENCE_REF_REQUIRED"); text(e.rationale); }
    if (a.selectedPoints===rubric.max) { check(a.maximumPrerequisitesMet && a.disconfirmingEvidence.length>0,"MAXIMUM_PREREQUISITES_REQUIRED"); text(a.exceptionalJustification); }
    if (a.subcategory==="RG-RISK") check(a.assessment===input.residualRisk,"RESIDUAL_RISK_MISMATCH");
    if (a.subcategory==="VAL-RET" && input.expectedReturn) {
      const r=decimal(input.expectedReturn.value).units;
      const idx=r>=decimal("0.22").units?5:r>=decimal("0.18").units?4:r>=decimal("0.15").units?3:r>=decimal("0.12").units?2:r>=decimal("0.08").units?1:0;
      check(a.assessment===rubric.bands[idx].label,"RETURN_BAND_MISMATCH");
      if (a.selectedPoints>band.min) check(input.expectedReturn.modelConfidence!=="LOW" && !input.expectedReturn.nearLowerBoundary && !input.expectedReturn.downsideDominates,"RETURN_UPPER_POINT_UNSUPPORTED");
      if (a.selectedPoints===8) check(!input.expectedReturn.aggressiveExpansion,"AGGRESSIVE_EXPANSION_NO_AUTOMATIC_MAXIMUM");
    }
  }
  // Reusing a family requires a distinct, explicit economic channel per assessment.
  for (const a of input.assessments) for (const b of input.assessments) {
    if (a.subcategory >= b.subcategory) continue;
    const families = (x:Assessment) => x.evidence.flatMap(t => t.refs).map(ref => input.evidence.find(e => e.id===ref)?.family);
    if (families(a).some(f => f && families(b).includes(f))) check(a.economicChannel !== b.economicChannel,"DOUBLE_COUNTED_EVIDENCE_CHANNEL");
  }
  const missing=[...input.criticalMissing];
  const results=RUBRICS.map(r => {
    const a=input.assessments.find(a => a.subcategory===r.id);
    const absent=a ? r.topics.filter(topic => !a.evidence.some(e => e.topic===topic && e.refs.every(usable))) : r.topics;
    const badCounter=a?.disconfirmingEvidence.some(ref => !usable(ref)) ?? false;
    const actionProblem=!n.actionComparable || n.actionEvidenceRefs.some(ref => !usable(ref));
    const badReturn=r.id==="VAL-RET" && (!input.expectedReturn || !input.expectedReturn.hurdle.evidenceRefs.every(usable));
    const complete=!!a && !absent.length && !badCounter && !actionProblem && !badReturn;
    if (!complete) missing.push(r.id);
    return { id:r.id,category:r.category,max:r.max,points:complete?a.selectedPoints:null,assessment:a??null,missingTopics:absent,status:complete?"SCORED":"N/R" };
  });
  const categories=Object.entries(CATEGORY_MAXIMA).map(([category,max]) => {
    const rows=results.filter(r => r.category===category);
    const points=rows.some(r => r.points===null)?null:rows.reduce((sum,r)=>sum+BigInt(r.points!),0n).toString();
    return { category:category as Category,max,points };
  });
  const critical=[...input.evidence.filter(e => e.critical && !available(e,input.asOf,conflicts)).map(e=>e.id),...metrics.filter(m=>m.value===null).map(m=>m.id)];
  const totalScore=categories.some(c=>c.points===null)||critical.length||input.criticalMissing.length||!input.doubleCountReview.passed?null:categories.reduce((sum,c)=>sum+BigInt(c.points!),0n).toString();
  const dataProblems=input.evidence.filter(e=>!available(e,input.asOf,conflicts)).map(e=>e.id);
  const confidence:Confidence=dataProblems.length||input.confidence.dimensions.includes("Weak")||input.expectedReturn?.aggressiveExpansion?"LOW":input.confidence.level;
  const veto=input.hardVeto||input.residualRisk==="UNACCEPTABLE";
  const validity=totalScore===null?"NOT RELIABLY SCORABLE":input.stage0!=="PASS"?"RESEARCH ONLY":veto||input.residualRisk==="HIGH"||confidence==="LOW"?"VALID — NON-ACTIONABLE":"VALID — ACTIONABLE";
  return deepFreeze({ id:input.id,securityId:input.securityId,ticker:reference.identifier,asOf:input.asOf,calculatedAt:input.calculatedAt,methodology:input.methodology,
    input,reference,metrics,subcategories:results,categories,totalScore,confidence,validity,dataQuality:dataProblems.length?"PROVISIONAL":"VALID",
    missingEvidence:[...new Set(missing)],blockingEvidence:critical,flags:n.peakCycleRisk?["PEAK_CYCLE_RISK"]:[],portfolioContext:null });
}
export type Scorecard = ReturnType<typeof calculateScorecard>;
