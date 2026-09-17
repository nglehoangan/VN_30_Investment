import { calculateScorecard, type Scorecard } from "@/domain/scoring/scorecard";
import { check, id, keys, list, snapshot, text, unique } from "@/domain/scoring/validation";
import { decimal } from "@/domain/portfolio/values";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { instant } from "@/shared/time";
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
  readonly constraints?: readonly { readonly securityId:string; readonly reason:string; readonly evidenceReference:string }[];
}
const riskOrder=["LOW","MODERATE","ELEVATED_CONTROLLED","ELEVATED_WEAK","HIGH","UNACCEPTABLE"];
const confidenceOrder=["HIGH","MEDIUM","LOW"];
const compareText=(a:string,b:string)=>a<b?-1:a>b?1:0;
const desc=(a:string,b:string)=>decimal(a).units>decimal(b).units?-1:decimal(a).units<decimal(b).units?1:0;
const points=(c:Scorecard,category:string)=>c.categories.find(x=>x.category===category)!.points!;
function band(score:string) { const n=BigInt(score); return n>=90n?"Exceptional":n>=82n?"Very Strong":n>=75n?"Strong":n>=68n?"Acceptable":n>=60n?"Weak":"Poor / High Caution"; }
export function rankScorecards(raw:RankInput) {
  const input=snapshot(raw); keys(input,"id asOf calculatedAt cards universe portfolio constraints"); id(input.id); instant(input.asOf); instant(input.calculatedAt);
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
  if(input.constraints) { list(input.constraints,30);unique(input.constraints.map(c=>c.securityId));check(portfolio,"PORTFOLIO_CONSTRAINT_SCOPE_REQUIRED");for(const c of input.constraints){keys(c,"securityId reason evidenceReference");id(c.securityId);text(c.reason);text(c.evidenceReference);check(input.universe.securityIds.includes(c.securityId),"CONSTRAINT_OUTSIDE_UNIVERSE");} }
  const missingCards=input.universe.securityIds.filter(s=>!cards.some(c=>c.securityId===s));
  const universeBlocked=!input.universe.complete||input.universe.securityIds.length!==30||missingCards.length>0;
  const excluded:{securityId:string;score:string|null;reasons:string[]}[]=[];
  const eligible=cards.filter(c=>{
    const reasons:string[]=[];
    if (universeBlocked) reasons.push("INCOMPLETE_SOURCE_DATA");
    if(c.reference.membership!=="MEMBER") reasons.push("NOT_ELIGIBLE");
    if(c.input.stage0!=="PASS") reasons.push("STAGE_0_NOT_PASS");
    if(c.input.hardVeto||c.input.residualRisk==="UNACCEPTABLE") reasons.push("HARD_VETO");
    if(c.input.residualRisk==="HIGH") reasons.push("HIGH_RESIDUAL_RISK");
    if(c.input.expectedReturn && decimal(c.input.expectedReturn.value).units<decimal(c.input.expectedReturn.hurdle.required).units)reasons.push("FORWARD_RETURN_HURDLE_NOT_MET");
    if(c.confidence==="LOW") reasons.push("LOW_CONFIDENCE");
    if(c.missingEvidence.length||c.blockingEvidence.length||c.totalScore===null) reasons.push("CRITICAL_EVIDENCE_MISSING");
    if(c.validity!=="VALID — ACTIONABLE") reasons.push(c.validity);
    for(const [category,min] of [["BQ",13],["FH",8],["RG",5],["VAL",10]] as const) {
      const p=points(c,category); if(p===null||BigInt(p)<BigInt(min)) reasons.push(`CATEGORY_GATE_${category}`);
    }
    const constraint=input.constraints?.find(x=>x.securityId===c.securityId);if(constraint)reasons.push(`PORTFOLIO_LIMIT: ${constraint.reason}`);
    if(portfolio?.status==="BLOCKED") reasons.push("BLOCKED — PORTFOLIO STATE UNRECONCILED");
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
      riskOrder.indexOf(a.input.residualRisk)-riskOrder.indexOf(b.input.residualRisk)||
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
