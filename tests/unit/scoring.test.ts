import { describe,it,expect } from "vitest";
import { fixture,award,rankingFixture,ASOF,BASE_POINTS } from "../fixtures/scoring";
import { calculateScorecard } from "@/domain/scoring/scorecard";
import { RUBRICS,SECTORS } from "@/domain/scoring/methodology";
import { rankScorecards } from "@/domain/ranking/rank";
import { calculateMetrics } from "@/domain/scoring/metrics";
import { dateOnly } from "@/shared/time";
describe("M3 bounded analyst scoring",()=>{
  it("VC-001: deterministic complete /100 composition; high score is not BUY",()=>{
    const f=fixture(),a=calculateScorecard(f);expect(a).toEqual(calculateScorecard(f));expect(a.totalScore).toBe("82");
    expect(a.categories.map(c=>c.points)).toEqual(["20","12","12","8","16","9","5"]);
    expect(RUBRICS.reduce((s,r)=>s+r.max,0)).toBe(100);expect(BASE_POINTS.reduce((s,p)=>s+p,0)).toBe(82);
    expect(a).not.toHaveProperty("decision");expect(a).not.toHaveProperty("action");expect(Object.isFrozen(a.input.assessments)).toBe(true);
  });
  it.each(SECTORS)("sector %s preserves identical weights and explicit equivalent assessment",sector=>{const c=calculateScorecard(fixture(0,sector));expect(c.totalScore).toBe("82");expect(c.reference.sector).toBe(sector);});
  it.each(RUBRICS.map(r=>[r.id,r.max] as const))("%s rejects points above %i maximum",(id,max)=>{
    const f=fixture();expect(()=>calculateScorecard({...f,assessments:f.assessments.map(a=>a.subcategory===id?{...a,selectedPoints:max+1}:a)})).toThrow();
  });
  it("every clarified band accepts explicit bounded selection when economic qualifiers permit",()=>{
    for(const r of RUBRICS.filter(r=>!["VAL-RET","RG-RISK"].includes(r.id)))for(const b of r.bands){expect(calculateScorecard(award(fixture(),r.id,b.min)).subcategories.find(s=>s.id===r.id)!.points).toBe(b.min);}
  });
  it("VC-020/021/022: missing is neither zero nor midpoint, no redistribution",()=>{
    const f=fixture();const c=calculateScorecard({...f,evidence:f.evidence.filter(e=>e.id!=="BQ-CASH-realization")});
    expect(c.totalScore).toBeNull();expect(c.categories[0].points).toBeNull();expect(c.categories[1].points).toBe("12");expect(c.validity).toBe("NOT RELIABLY SCORABLE");
  });
  it("strong CFO alone does not automatically award maximum earnings quality",()=>{
    const f=fixture();const a=f.assessments.find(a=>a.subcategory==="BQ-CASH")!;
    const c=calculateScorecard({...f,assessments:f.assessments.map(x=>x===a?{...a,evidence:a.evidence.slice(0,1)}:x)});
    expect(c.subcategories.find(s=>s.id==="BQ-CASH")!.points).toBeNull();
  });
  it("rejects AI, silent range selection, absent maximum review and raw formula injection",()=>{
    const f=fixture();for(const patch of [{source:"AI"},{selectedPoints:undefined},{selectedPoints:6,maximumPrerequisitesMet:false},{formula:"return 100"}])
      expect(()=>calculateScorecard({...f,assessments:f.assessments.map(a=>a.subcategory==="BQ-CASH"?{...a,...patch}:a)} as never)).toThrow();
  });
  it("VC-023: stale and conflicting data remain explicit and lower confidence",()=>{
    const f=fixture();const stale=calculateScorecard({...f,evidence:f.evidence.map((e,i)=>i?e:{...e,quality:"STALE"})});expect(stale.confidence).toBe("LOW");expect(stale.totalScore).toBeNull();
    const conflict=calculateScorecard({...f,evidence:[...f.evidence,{...f.evidence[0],id:"conflict",value:"Conflicting statement"}]});expect(conflict.blockingEvidence).toContain(f.evidence[0].id);
  });
  it("VC-040–045: double count review cannot be bypassed",()=>{const f=fixture();expect(calculateScorecard({...f,doubleCountReview:{...f.doubleCountReview,passed:false}}).totalScore).toBeNull();});
  it("VC-070–076: missing action comparability never fabricates continuous per-share history",()=>{const f=fixture();expect(calculateScorecard({...f,normalization:{...f.normalization,actionComparable:false}}).totalScore).toBeNull();});
  it("VC-110/111: half-open historical sector assignment; never backfill current sector",()=>{
    const f=fixture();const rows=f.reference.data.intervals.map(r=>r.id==="sector-0"?{...r,to:dateOnly("2025-07-01")}:r);
    const later={...rows.find(r=>r.id==="sector-0")!,id:"later-sector",from:dateOnly("2025-07-01"),to:null,value:"BANK"};
    const c=calculateScorecard({...f,reference:{...f.reference,data:{...f.reference.data,intervals:[...rows,later]}}});expect(c.reference.sector).toBe("INDUSTRIAL");
    expect(()=>calculateScorecard({...f,reference:{...f.reference,data:{...f.reference.data,intervals:f.reference.data.intervals.filter(r=>r.id!=="sector-0")}}})).toThrow();
  });
  it("VC-112/114: future evidence and reference cannot leak into historical cutoff",()=>{const f=fixture();expect(()=>calculateScorecard({...f,evidence:f.evidence.map((e,i)=>i?e:{...e,publishedAt:"2026-01-01T00:00:00.000Z"})})).toThrow();});
  it("later evidence and methodology do not mutate prior artifact",()=>{
    const f=fixture();const old=calculateScorecard(f),before=JSON.stringify(old);const next=calculateScorecard({...award(f,"BQ-EQ",7),id:"revised",priorScorecardId:old.id,revisionReason:"New synthetic evidence",methodology:{...f.methodology,methodologyId:"new-method" as never}});
    expect(next.totalScore).toBe("83");expect(JSON.stringify(old)).toBe(before);expect(old.methodology.methodologyId).not.toBe(next.methodology.methodologyId);
    expect(()=>calculateScorecard({...f,methodology:{...f.methodology,implementationIdentity:"unregistered-code"}})).toThrow();
  });
  it("low PE / price decline / cost basis / technical momentum cannot inject points",()=>{
    for(const field of ["pe","priceDecline","averageCost","technical","moneyFlow","weights"])expect(()=>calculateScorecard({...fixture(),[field]:1} as never)).toThrow();
  });
  it("exact metric lineage: raw normalized NOPAT20/capital100 gives ROIC0.2, no points",()=>{
    const f=fixture();const rows=[20,100].map((v,i)=>({...f.evidence[i],id:`metric-${i}`,observation:`metric-${i}`,value:String(v),unit:"VND" as const}));
    const request={id:"roic",metric:"ROIC" as const,evidenceRefs:rows.map(r=>r.id),years:null,comparable:true,normalization:{kind:"NORMALIZED" as const,rationale:"Synthetic normalized issuer EBIT and invested capital",evidenceRefs:rows.map(r=>r.id)}};
    const result=calculateMetrics([request],rows,"INDUSTRIAL",ASOF,[],false)[0];expect(result.value).toBe("0.2");expect(result.operands).toEqual(rows);expect(result).not.toHaveProperty("points");
    expect(()=>calculateMetrics([request],rows,"BANK",ASOF,[],false)).toThrow();
    expect(calculateMetrics([{...request,normalization:{...request.normalization,kind:"AS_REPORTED"}}],rows,"MATERIALS",ASOF,[],true)[0].value).toBeNull();
  });
});
describe("official ranking, gates and economic ties",()=>{
  it.each([[[84,82,80],[2,1]],[[83,82,81],[3]],[[82,81],[2]],[[82,80],[2]],[[82,79],[1,1]],[[82,82,82],[3]]] as const)("scores %j have clusters %j",(scores,sizes)=>{
    const f=rankingFixture([...scores]),r=rankScorecards(f);expect(r.clusters.map(c=>c.securityIds.length)).toEqual(sizes);
    expect(rankScorecards({...f,cards:[...f.cards].reverse()}).entries).toEqual(r.entries);
  });
  it("VC-004–008/104: LOW-confidence high score, hard veto and category failures are excluded",()=>{
    const f=rankingFixture([90,82]);const high=f.cards[0];const low=calculateScorecard({...high.input,confidence:{...high.input.confidence,level:"LOW"}});
    const r=rankScorecards({...f,cards:[low,...f.cards.slice(1)]});expect(r.top10.map(c=>c.securityId)).toEqual([f.cards[1].securityId]);expect(r.excluded[0].reasons).toContain("LOW_CONFIDENCE");
    const veto=rankScorecards({...f,cards:[calculateScorecard({...high.input,hardVeto:true}),...f.cards.slice(1)]});expect(veto.excluded[0].reasons).toContain("HARD_VETO");
    const weak=rankScorecards({...f,cards:[calculateScorecard(award(award(high.input,"FH-BS",0),"FH-LIQ",0)),...f.cards.slice(1)]});expect(weak.excluded[0].reasons).toContain("CATEGORY_GATE_FH");
  });
  it("positions9–12 preserve full boundary tie and only ten display entries",()=>{
    const r=rankScorecards(rankingFixture([94,94,94,94,94,94,94,94,82,82,82,82]));expect(r.top10).toHaveLength(10);expect(r.boundaryTie?.securityIds).toHaveLength(4);expect(r.boundaryTie?.omitted).toHaveLength(2);expect(r.clusters.at(-1)?.displayOnlyTies[0]).toHaveLength(4);
  });
  it("VC-101/102: incomparable model confidence cannot win on higher return alone",()=>{
    const f=rankingFixture([82,82]);const a=f.cards[0];const changed=calculateScorecard({...a.input,expectedReturn:{...a.input.expectedReturn!,value:"0.17",modelConfidence:"MEDIUM"}});
    const r=rankScorecards({...f,cards:[changed,...f.cards.slice(1)]});expect(r.clusters[0].returnTieBreakUsed).toBe(false);
  });
  it("requires complete dated universe and rejects mixed scoring method versions",()=>{
    const f=rankingFixture();expect(rankScorecards({...f,universe:{...f.universe,complete:false}}).status).toBe("BLOCKED");
    expect(()=>rankScorecards({...f,cards:[calculateScorecard({...f.cards[0].input,methodology:{...f.cards[0].methodology,methodologyId:"different" as never}}),...f.cards.slice(1)]})).toThrow();
  });
});
