import { calculateScorecard, type Scorecard } from "@/domain/scoring/scorecard";
import { check, id, keys, list, snapshot, text, unique } from "@/domain/scoring/validation";
import { decimal } from "@/domain/portfolio/values";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { instant } from "@/shared/time";
import { validatePortfolioConstraint, validateRequiredReturn, type PortfolioConstraintAssessment, type RequiredReturnAssessment } from "@/domain/scoring/eligibility";
export interface PortfolioIntegrity {
  readonly snapshotId: string; readonly portfolioId: string; readonly asOf: string; readonly ledgerWatermark: string;
  readonly reconstructionMethod: string; readonly referenceVersion: string; readonly priceVersion: string;
  readonly evidenceId: string | null; readonly status: "PASS" | "BLOCKED"; readonly costStatus: "PASS" | "BLOCKED";
  readonly reasons: readonly string[];
}
export interface RankInput {
  readonly id: string; readonly asOf: string; readonly calculatedAt: string; readonly cards: readonly Scorecard[];
  readonly universe: { readonly referenceVersion: string; readonly securityIds: readonly string[]; readonly complete: boolean };
  readonly portfolio: PortfolioIntegrity | null;
  readonly requiredReturnAssessments: readonly { readonly securityId:string; readonly assessment:RequiredReturnAssessment }[];
  readonly portfolioConstraints?: readonly PortfolioConstraintAssessment[];
}
export interface ExclusionReason { readonly code:string; readonly detail:string; readonly evidenceReference:string; }
const riskOrder=["LOW","MODERATE","ELEVATED_CONTROLLED","ELEVATED_WEAK","HIGH","UNACCEPTABLE"];
const confidenceOrder=["HIGH","MEDIUM","LOW"];
const compareText=(a:string,b:string)=>a<b?-1:a>b?1:0;
const desc=(a:string,b:string)=>decimal(a).units>decimal(b).units?-1:decimal(a).units<decimal(b).units?1:0;
const points=(c:Scorecard,category:string)=>c.categories.find(x=>x.category===category)!.points!;
function band(score:string) { const n=BigInt(score); return n>=90n?"Exceptional":n>=82n?"Very Strong":n>=75n?"Strong":n>=68n?"Acceptable":n>=60n?"Weak":"Poor / High Caution"; }
export function rankScorecards(raw:RankInput) {
  const input=snapshot(raw); keys(input,"id asOf calculatedAt cards universe portfolio requiredReturnAssessments portfolioConstraints"); id(input.id); instant(input.asOf); instant(input.calculatedAt);
  check(input.asOf<=input.calculatedAt,"INVALID_RANK_TIME"); list(input.cards,30); unique(input.cards.map(c=>c.securityId));
  keys(input.universe,"referenceVersion securityIds complete"); text(input.universe.referenceVersion); list(input.universe.securityIds,30); input.universe.securityIds.forEach(id); unique(input.universe.securityIds);
  check(typeof input.universe.complete==="boolean","UNIVERSE_COVERAGE_REQUIRED");
  // Never trust a supplied total or validity badge. Reconstruct from its pinned formal input.
  const cards=input.cards.map(c=>calculateScorecard(c.input));
  for (const c of cards) {
    check(c.asOf===input.asOf && c.calculatedAt<=input.calculatedAt && c.reference.referenceVersion===input.universe.referenceVersion,"MIXED_RANK_CONTEXT");
    check(input.universe.securityIds.includes(c.securityId),"CARD_OUTSIDE_UNIVERSE");
  }
  check(new Set(cards.map(c=>c.methodology.methodologyId)).size<=1,"MIXED_SCORING_METHODOLOGIES");
  const portfolio=input.portfolio;
  if (portfolio) {
    keys(portfolio,"snapshotId portfolioId asOf ledgerWatermark reconstructionMethod referenceVersion priceVersion evidenceId status costStatus reasons");
    [portfolio.snapshotId,portfolio.portfolioId,portfolio.ledgerWatermark,portfolio.reconstructionMethod,portfolio.referenceVersion,portfolio.priceVersion].forEach(text);
    check(portfolio.asOf===input.asOf && portfolio.referenceVersion===input.universe.referenceVersion,"PORTFOLIO_CONTEXT_MISMATCH");
    check(["PASS","BLOCKED"].includes(portfolio.status)&&["PASS","BLOCKED"].includes(portfolio.costStatus),"INVALID_INTEGRITY"); list(portfolio.reasons); portfolio.reasons.forEach(text);
  }
  list(input.requiredReturnAssessments,30); unique(input.requiredReturnAssessments.map(g=>g.securityId));
  for(const g of input.requiredReturnAssessments){keys(g,"securityId assessment");id(g.securityId);check(input.universe.securityIds.includes(g.securityId),"RETURN_GATE_OUTSIDE_UNIVERSE");validateRequiredReturn(g.assessment,input.asOf,input.calculatedAt);}
  if(input.portfolioConstraints) { list(input.portfolioConstraints,30);unique(input.portfolioConstraints.map(c=>c.securityId));check(portfolio,"PORTFOLIO_CONSTRAINT_SCOPE_REQUIRED");for(const c of input.portfolioConstraints){validatePortfolioConstraint(c,input.asOf,input.calculatedAt);check(input.universe.securityIds.includes(c.securityId),"CONSTRAINT_OUTSIDE_UNIVERSE");} }
  const missingCards=input.universe.securityIds.filter(s=>!cards.some(c=>c.securityId===s));
  const universeBlocked=!input.universe.complete||input.universe.securityIds.length!==30||missingCards.length>0;
  const excluded:{securityId:string;score:string|null;reasons:ExclusionReason[]}[]=[];
  const eligible=cards.filter(c=>{
    const reasons:ExclusionReason[]=[];
    const add=(code:string,detail:string,evidenceReference:string)=>reasons.push({code,detail,evidenceReference});
    if (universeBlocked) add("INCOMPLETE_SOURCE_DATA","Complete 30-member universe or formal scorecard coverage is missing",input.universe.referenceVersion);
    if(c.reference.membership!=="MEMBER") add("NOT_ELIGIBLE","Security is not a confirmed VN30 member at the ranking cutoff",c.reference.referenceVersion);
    if(c.input.stage0.status!=="PASS") add("STAGE_0_NOT_PASS",`External Stage 0 result is ${c.input.stage0.status}`,c.input.stage0.methodologyId);
    if(c.input.hardVeto.status!=="CLEAR"||c.input.residualRisk.status==="UNACCEPTABLE") add("HARD_VETO","External risk-policy result prohibits investable ranking",c.input.hardVeto.methodologyId);
    if(c.input.residualRisk.status==="HIGH") add("HIGH_RESIDUAL_RISK","External residual-risk classification is HIGH",c.input.residualRisk.methodologyId);
    const returnGate=input.requiredReturnAssessments.find(g=>g.securityId===c.securityId)?.assessment;
    if(!returnGate) add("REQUIRED_RETURN_NOT_ASSESSED","No external M4 required-return assessment was supplied",c.id);
    else if(returnGate.status!=="PASS"||!returnGate.hurdleMet) add("FORWARD_RETURN_HURDLE_NOT_MET",`External M4 result is ${returnGate.status}`,returnGate.methodologyId);
    if(c.confidence==="LOW") add("LOW_CONFIDENCE","M3 confidence is LOW",c.id);
    if(c.missingEvidence.length||c.blockingEvidence.length||c.totalScore===null) add("CRITICAL_EVIDENCE_MISSING","Scorecard has missing or blocking evidence",c.id);
    if(c.validity!=="VALID — ACTIONABLE") add("SCORE_NOT_ACTIONABLE",c.validity,c.id);
    for(const [category,min] of [["BQ",13],["FH",8],["RG",5],["VAL",10]] as const) {
      const p=points(c,category); if(p===null||BigInt(p)<BigInt(min)) add(`CATEGORY_GATE_${category}`,`${category} does not meet the approved M3 minimum`,c.methodology.methodologyId);
    }
    const constraint=input.portfolioConstraints?.find(x=>x.securityId===c.securityId);if(constraint?.status==="BLOCKED") add("PORTFOLIO_LIMIT",constraint.detail,constraint.methodologyId);
    if(portfolio?.status==="BLOCKED") add("ACCOUNTING_STATE_BLOCKED","Portfolio-aware ranking state is unreconciled",portfolio.evidenceId??portfolio.snapshotId);
    if(reasons.length) excluded.push({securityId:c.securityId,score:c.totalScore,reasons});
    return reasons.length===0;
  }).sort((a,b)=>desc(a.totalScore!,b.totalScore!)||compareText(a.securityId,b.securityId));
  const clusters:{anchor:string;securityIds:string[];returnTieBreakUsed:boolean;displayOnlyTies:string[][]}[]=[];
  const ordered:Scorecard[]=[];
  while(eligible.length) {
    const anchor=eligible[0].totalScore!; const threshold=BigInt(anchor)-2n;
    let size=0;while(size<eligible.length&&BigInt(eligible[size].totalScore!)>=threshold)size++;
    const cluster=eligible.splice(0,size);
    const first=cluster[0].input.expectedReturn;
    const useReturn=!!first&&cluster.every(c=>c.input.expectedReturn&&c.confidence===cluster[0].confidence&&c.input.expectedReturn.modelConfidence===first.modelConfidence&&c.input.expectedReturn.assumptionBasis===first.assumptionBasis&&!c.input.expectedReturn.aggressiveExpansion&&!c.input.expectedReturn.downsideDominates);
    const fundamental=(a:Scorecard,b:Scorecard)=>
      (useReturn?desc(a.input.expectedReturn!.value,b.input.expectedReturn!.value):0)||
      riskOrder.indexOf(a.input.residualRisk.status)-riskOrder.indexOf(b.input.residualRisk.status)||
      confidenceOrder.indexOf(a.confidence)-confidenceOrder.indexOf(b.confidence)||
      desc(a.subcategories.find(s=>s.id==="VAL-MOS")!.points!.toString(),b.subcategories.find(s=>s.id==="VAL-MOS")!.points!.toString())||
      desc(points(a,"BQ"),points(b,"BQ"))||desc(points(a,"FH"),points(b,"FH"))||desc(points(a,"CA"),points(b,"CA"));
    cluster.sort((a,b)=>fundamental(a,b)||compareText(a.securityId,b.securityId));
    const ties:string[][]=[];
    for(const card of cluster) {
      const group=ties.find(g=>fundamental(cluster.find(c=>c.securityId===g[0])!,card)===0);
      if(group)group.push(card.securityId);else ties.push([card.securityId]);
    }
    clusters.push({anchor,securityIds:cluster.map(c=>c.securityId),returnTieBreakUsed:useReturn,displayOnlyTies:ties.filter(g=>g.length>1)});
    ordered.push(...cluster);
  }
  const entries=ordered.map((c,i)=>({securityId:c.securityId,scorecardId:c.id,displayRank:i+1,score:c.totalScore!,band:band(c.totalScore!),cluster:clusters.findIndex(g=>g.securityIds.includes(c.securityId))+1}));
  const boundary=entries.length>10&&entries[9].cluster===entries[10].cluster?clusters[entries[9].cluster-1]:null;
  return deepFreeze({id:input.id,asOf:input.asOf,calculatedAt:input.calculatedAt,methodology:"m64-clarification-1",input,
    status:universeBlocked||portfolio?.status==="BLOCKED"?"BLOCKED":"VALID",entries,clusters,top10:entries.slice(0,10),
    boundaryTie:boundary?{securityIds:boundary.securityIds,selected:entries.slice(0,10).filter(e=>boundary.securityIds.includes(e.securityId)).map(e=>e.securityId),omitted:entries.slice(10).filter(e=>boundary.securityIds.includes(e.securityId)).map(e=>e.securityId),reason:"DISPLAY_CAPACITY — NO ECONOMIC_SUPERIORITY_IMPLIED"}:null,
    excluded:excluded.sort((a,b)=>compareText(a.securityId,b.securityId)),missingCards,portfolio,
    portfolioPriority:"NOT ASSESSED",notice:"Analytical ranking only. Display order and Top 10 membership do not establish economic superiority or authorize capital action."});
}
export type Ranking = ReturnType<typeof rankScorecards>;
