import { RUBRICS } from "@/domain/scoring/methodology";
import { evaluatePublicProxy, PUBLIC_PROXY_REVIEW_OBSERVATION, type ProxyReview } from "./public-proxy-review";
import type { Assessment, ScoreInput } from "./scorecard";

export const capitalIds = ["CA-REINV","CA-DIST","CA-DIL","CA-PSV"] as const;
type Id = typeof capitalIds[number];
export type Transfer = { before: number; issued: number; value: number; netProceeds: number; incrementalBenefit: number };
export function economicTransfer(x: Transfer) {
  const { before, issued, value, netProceeds, incrementalBenefit } = x;
  if (![before, issued, value, netProceeds, incrementalBenefit].every(Number.isFinite) || before <= 0 || issued < 0 || value <= 0)
    throw Error("INVALID_SHAREHOLDER_ECONOMICS");
  const postShareValue = (before * value + netProceeds + incrementalBenefit) / (before + issued);
  return { postShareValue, economicLoss: 1 - postShareValue / value,
    breakEvenBenefit: issued * value - netProceeds, transferredBeforeBenefits: issued * value - netProceeds };
}
export function compoundRatios(ratios: readonly number[]) {
  if (!ratios.length || ratios.some(x => !Number.isFinite(x) || x <= 0)) throw Error("INVALID_COMPARABLE_RATIOS");
  const factor = ratios.reduce((total, ratio) => total * ratio, 1);
  return { factor, growth: factor - 1, cagr: factor ** (1 / ratios.length) - 1 };
}
export function parentCashBridge(row: { cfo: number; capex: number; receipts: number; paid: number; contributions: number }) {
  return { residual: row.cfo - row.capex + row.receipts - row.paid - row.contributions,
    distributionToReceipts: row.receipts > 0 ? row.paid / row.receipts : null };
}

type Route = "B" | "PROXY" | "A";
type Model = {
  route: Route; points: number | null; band: string | null; topics: Record<string,string[]>;
  rationale: string; counterevidence: string; limitation: string; reopening: string;
  confidence: number[]; criteria: Record<string, boolean>; overlapResolved: boolean;
  maximum?: { prerequisite: string; rationale: string; refs: string[] };
  proxy?: ProxyReview;
};
type Proposal = { ticker: string; cutoff: string; freeze: string; revision: number; previous?: string;
  models: Record<Id, Partial<Record<Route,Model>>> };
type Review = { proposal: string; freeze: string; revision: number; rows: Record<Id,{
  disposition: string; dimensions: { id: string; challenge: string; finding: string; refs: string[] }[];
  blockers: { code: string; finding: string }[];
}> };
export type CapitalPacket = { initial: Proposal; initialReview: Review; revision?: Proposal; finalReview: Review };
type Freeze = { sector: Assessment["sector"]; ticker: string; cutoff: string; informationCutoff: string; sha256: string;
  facts: { id: string; source: string; pointer: string; publicBy: string; classification: string }[] };
const prerequisites = {
  "CA-REINV": ["identifiedDecisions","deployedResources","outcomeLinkage","commissioningReviewed","maAndDisposalsReviewed"],
  "CA-DIST": ["parentCash","paidVsAnnounced","retentionEconomics","buybackDisposition","resilience"],
  "CA-DIL": ["materialEventCoverage","authoritativeTerms","eventValue","netProceedsOrBounds","offsetsBounded","entitlementAligned"],
  "CA-PSV": ["actionsComparable","cycleReviewed","scopeComparable","distinctPerShareCrossCheck"],
};
const filled = (...s: string[]) => s.every(x => typeof x === "string" && !!x.trim());

export function assessCapitalAllocation(freeze: Freeze, packet: CapitalPacket, digest: (v:unknown)=>string,
  sourceUsable:(source:string,pointer:string)=>boolean) {
  const { initial, initialReview, revision, finalReview } = packet;
  const final = revision ?? initial;
  const refs = new Set(freeze.facts.map(f => f.id));
  const usable = (ids:string[]) => ids.length > 0 && ids.every(id => refs.has(id));
  const bound = (p: Proposal, r: Review) => p.ticker === freeze.ticker && p.cutoff === freeze.cutoff &&
    p.freeze === freeze.sha256 && r.freeze === p.freeze && r.proposal === digest(p) && r.revision === p.revision;
  const requested = capitalIds.filter(id=>initialReview.rows[id]?.disposition==="REVISION_REQUIRED");
  const valid = bound(initial,initialReview) && bound(final,finalReview) && initial.revision===0 && !initial.previous &&
    (revision ? revision.revision===1 && revision.previous===digest(initial) && requested.length>0 : requested.length===0) &&
    refs.size===freeze.facts.length && freeze.facts.every(f => f.classification==="FACT" && f.publicBy<=freeze.informationCutoff &&
      sourceUsable(f.source,f.pointer));
  const reviewValid = (r: Review["rows"][Id]) => r?.dimensions.length===6 &&
    r.dimensions.every((d,i)=>d.id===`RV0${i+1}` && filled(d.challenge,d.finding) && (i===1&&!d.refs.length || usable(d.refs))) &&
    r.blockers.every(b=>/^RB0[1-5]$/.test(b.code)&&filled(b.finding));
  return capitalIds.map(id=>{
    const rubric=RUBRICS.find(r=>r.id===id)!;
    const review=finalReview.rows[id];
    const check=(route: Route)=>{
      const m=final.models[id]?.[route];
      if (!m) return { points:null, gaps:["NO_EVIDENCED_CANDIDATE"], model:null };
      const gaps:string[]=[];
      if (!valid) gaps.push("FREEZE_OR_REVIEW_BINDING");
      if (!reviewValid(initialReview.rows[id]) || !reviewValid(review) ||
          (!requested.includes(id) && digest(initial.models[id])!==digest(final.models[id]))) gaps.push("REVIEW_LINEAGE");
      if (!m.overlapResolved || m.route!==route || !filled(m.rationale,m.counterevidence,m.limitation,m.reopening) ||
        m.confidence.length!==5 || m.confidence.some(v=>![0,1,2].includes(v))) gaps.push("ANALYST_REASONING_OR_OWNERSHIP");
      const missing=prerequisites[id].filter(key=>m.criteria[key]!==true);
      if (route==="PROXY") {
        const reference="proxy-estimate";
        const assessment={ subcategory:id, assessment:m.band ?? rubric.bands[0].label, selectedPoints:m.points ?? 0,
          sector:freeze.sector, evidence:rubric.topics.map(topic=>({topic,refs:[reference,...(m.topics[topic]??[])]})),
          maximumPrerequisitesMet:!!m.maximum, exceptionalJustification:m.maximum?.rationale, disconfirmingEvidence:m.maximum?.refs??[] } as unknown as Assessment;
        const evidence=[{ id:reference, observation:PUBLIC_PROXY_REVIEW_OBSERVATION, classification:"ESTIMATE",
          unit:"TEXT",value:JSON.stringify(m.proxy) }] as unknown as ScoreInput["evidence"];
        const proxy=evaluatePublicProxy(assessment,{metrics:[],evidence},key=>key===reference || refs.has(key));
        if (!m.proxy || !proxy.eligible) gaps.push("EXISTING_PROXY_INELIGIBLE");
        if (proxy.requiresAction && !m.criteria.actionsComparable) gaps.push("ACTION_COMPARABILITY_REQUIRED");
      }
      if (m.points===null) gaps.push("NO_DEFENSIBLE_BAND",...missing);
      else {
        if (!["ACCEPTED","ACCEPTED_WITH_LIMITATIONS"].includes(review.disposition) || review.blockers.length ||
            rubric.topics.some(topic=>!m.topics[topic] || !usable(m.topics[topic]))) gaps.push("REVIEW_OR_NATIVE_TOPICS");
        if (missing.length) gaps.push(...missing);
        if (!Number.isInteger(m.points)||!rubric.bands.some(b=>b.label===m.band&&m.points!>=b.min&&m.points!<=b.max)||
          route==="A"&&m.points>1) gaps.push("CANONICAL_BAND_OR_CEILING");
        if (m.points===rubric.max && (!m.maximum || m.maximum.prerequisite!==rubric.maximumPrerequisite ||
          !filled(m.maximum.rationale) || !usable(m.maximum.refs))) gaps.push("MAXIMUM_PREREQUISITES");
      }
      return {model:m,points:gaps.length?null:m.points,gaps};
    };
    const routes={ B:check("B"), PROXY:check("PROXY"), A:check("A") };
    const selected=Object.values(routes).find(r=>r.points!==null);
    const model=selected?.model??routes.A.model;
    return { id, points:selected?.points??null, reviewCutoff:freeze.cutoff,
      validity:selected?"CONFIRMED_CURRENT":"N/R",basis:selected?"CURRENT_DIRECT_RESEARCH":null,
      confidence:model?{dimensions:model.confidence,total:model.confidence.reduce((a,b)=>a+b,0)}:null,
      routeQualification:{route:selected?.model?.route??null,researchOnly:true,synthetic:false,
        freeze:freeze.sha256,proposal:finalReview.proposal,disposition:review.disposition,limitation:model?.limitation??null},
      routes };
  });
}
type Result = ReturnType<typeof assessCapitalAllocation>[number];
export function resolveCapitalEffective(current:Result,historical:Result,carry?:{
  validUntil:string; unaffected:boolean; reviewed:boolean; rationale:string;
}) {
  const inherited=!!carry && current.points===null && historical.points!==null && historical.id===current.id &&
    historical.reviewCutoff<current.reviewCutoff && current.reviewCutoff<=carry.validUntil &&
    carry.reviewed && carry.unaffected && filled(carry.rationale) &&
    Object.values(current.routes).every(route=>!route.gaps.some(gap=>["FREEZE_OR_REVIEW_BINDING","REVIEW_LINEAGE"].includes(gap)));
  return { ...current, points:inherited?historical.points:current.points,
    validity:inherited?"PROVISIONAL":current.validity,basis:inherited?"LATEST_VALID_HISTORICAL_ASSESSMENT":current.basis,
    confidence:inherited?historical.confidence:current.confidence,
    routeQualification:inherited?historical.routeQualification:current.routeQualification,
    underlyingAssessmentCutoff:inherited?historical.reviewCutoff:current.points===null?null:current.reviewCutoff,
    historicalAssessmentPoints:historical.points,currentReassessmentPoints:current.points,inheritance:inherited?carry:null };
}

/** Complete research score requires each canonical ID exactly once and a valid point on every rubric. */
export function fullCapitalResearchScore(rows: readonly { id: string; points: number | null }[]) {
  const byId = new Map(rows.map(row=>[row.id,row.points]));
  if (rows.length!==RUBRICS.length || byId.size!==RUBRICS.length) return null;
  let total=0;
  for (const rubric of RUBRICS) {
    const points=byId.get(rubric.id);
    if (points===undefined || points===null || !Number.isInteger(points) || points<0 || points>rubric.max) return null;
    total+=points;
  }
  return total;
}
