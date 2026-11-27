import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { RUBRICS } from "@/domain/scoring/methodology";
import { assessCapitalAllocation, economicTransfer, compoundRatios, parentCashBridge,
  resolveCapitalEffective, fullCapitalResearchScore, type CapitalPacket } from "@/domain/current-scoring/capital-allocation-research";

const dir="docs/fundamental-data-engine/fpt-capital-allocation/v1.0";
const read=(name:string)=>JSON.parse(readFileSync(`${dir}/${name}.json`,"utf8"));
const sha=(data:string)=>createHash("sha256").update(data).digest("hex");
const digest=(data:unknown)=>sha(JSON.stringify(data));
function fixture(period="ANNUAL") {
  const freeze=read(`DATA_FREEZE_${period}`);
  freeze.sha256=sha(readFileSync(`${dir}/DATA_FREEZE_${period}.json`,"utf8"));
  const packet:CapitalPacket={initial:read(`ANALYST_ASSESSMENT_${period}`),initialReview:read(`INITIAL_REVIEW_${period}`),
    finalReview:read(`FINAL_REVIEW_${period}`)};
  return {freeze,packet};
}
const run=({freeze,packet}:ReturnType<typeof fixture>)=>assessCapitalAllocation(freeze,packet,digest,()=>true);
function rebind({packet}:ReturnType<typeof fixture>) {
  packet.initialReview.proposal=digest(packet.initial);
  packet.finalReview.proposal=digest(packet.revision??packet.initial);
}
it("recomputes shareholder transfer, net proceeds, break even and mechanical neutrality",()=>{
  const sample={before:1471069183,issued:10260939,value:60000,netProceeds:102609390000,incrementalBenefit:0};
  const model=economicTransfer(sample);
  expect(model.breakEvenBenefit).toBe(513046950000);
  expect(model.economicLoss).toBeGreaterThan(0);
  expect(economicTransfer({...sample,incrementalBenefit:model.breakEvenBenefit}).economicLoss).toBeCloseTo(0);
  expect(economicTransfer({...sample,netProceeds:sample.netProceeds-1}).breakEvenBenefit).toBe(model.breakEvenBenefit+1);
  expect(economicTransfer({...sample,issued:0,netProceeds:0}).economicLoss).toBe(0);
  expect(compoundRatios([.99,.99]).factor).toBeCloseTo(.9801);
});
it("reproduces cash and paired EPS without inferring a continuous absolute series",()=>{
  const f=fixture();
  expect(parentCashBridge(f.freeze.parentFY).residual).toBe(264415441626);
  expect(compoundRatios([4661/3847,4944/4052,5216/4292]).growth).toBeCloseTo(.7966,4);
});
it("requires a linked allocation outcome and preserves the approved proxy gate",()=>{
  const f=fixture();
  const m=f.packet.initial.models["CA-REINV"].A!;
  const model={points:1,band:"Mixed/acceptable"};
  Object.assign(m,model);
  for(const review of [f.packet.initialReview,f.packet.finalReview]) {
    review.rows["CA-REINV"].disposition="ACCEPTED_WITH_LIMITATIONS";
    review.rows["CA-REINV"].blockers=[];
  }
  rebind(f);
  expect(run(f)[0].routes.A.gaps).toContain("outcomeLinkage");
  expect(run(f)[0].routes.PROXY.gaps).toContain("EXISTING_PROXY_INELIGIBLE");
  m.criteria.outcomeLinkage=true;
  rebind(f);
  expect(run(f)[0].points).toBe(1);
  Object.assign(m,{points:2,band:"Consistently accretive"});
  rebind(f);
  expect(run(f)[0].routes.A.gaps).toContain("CANONICAL_BAND_OR_CEILING");
});
it("requires parent evidence, explicit buyback applicability and maximum support",()=>{
  const f=fixture();
  expect(run(f)[1].points).toBe(1);
  const m=f.packet.initial.models["CA-DIST"].A!;
  m.criteria.parentCash=false;
  m.criteria.buybackDisposition=false;
  delete m.maximum;
  rebind(f);
  expect(run(f)[1].routes.A.gaps).toEqual(expect.arrayContaining(["parentCash","buybackDisposition","MAXIMUM_PREREQUISITES"]));
  expect(run(fixture("CURRENT"))[1].points).toBeNull();
});
it("does not force zero from missing offset ranges or event coverage",()=>{
  const f=fixture();
  Object.assign(f.packet.initial.models["CA-DIL"].A!,{points:0,band:"Material value-destructive dilution"});
  rebind(f);
  expect(run(f)[2].routes.A.gaps).toEqual(expect.arrayContaining(["offsetsBounded","materialEventCoverage"]));
  expect(run(f)[2].routes.PROXY.gaps).toContain("EXISTING_PROXY_INELIGIBLE");
});
it("requires comparable scope and a second economic dimension for per-share maximum",()=>{
  const f=fixture();
  expect(run(f)[3].points).toBe(1);
  f.packet.initial.models["CA-PSV"].A!.criteria.scopeComparable=false;
  f.packet.initial.models["CA-PSV"].A!.criteria.distinctPerShareCrossCheck=false;
  rebind(f);
  expect(run(f)[3].routes.A.gaps).toEqual(expect.arrayContaining(["scopeComparable","distinctPerShareCrossCheck"]));
});
it("rejects future inputs and unbound revision, and requires unaffected applicability to carry",()=>{
  const f=fixture("CURRENT");
  const latest=run(f)[1];
  const previous=run(fixture())[1];
  const carry={validUntil:"2026-11-30",unaffected:true,reviewed:true,rationale:"Synthetic applicability bound."};
  expect(resolveCapitalEffective(latest,previous,carry)).toMatchObject({points:1,validity:"PROVISIONAL",currentReassessmentPoints:null});
  expect(resolveCapitalEffective(latest,previous,{...carry,unaffected:false}).points).toBeNull();
  f.freeze.facts[0].publicBy="2026-11-14";
  expect(run(f)[1].routes.A.gaps).toContain("FREEZE_OR_REVIEW_BINDING");
  f.freeze.facts[0].publicBy="2026-03-19";
  f.packet.revision={...f.packet.initial,revision:2,previous:digest(f.packet.initial)};
  f.packet.finalReview.revision=2;
  rebind(f);
  expect(run(f)[1].routes.A.gaps).toContain("FREEZE_OR_REVIEW_BINDING");
});
it("distinguishes zero and required N/R in canonical complete aggregation",()=>{
  const rows=RUBRICS.map(row=>({id:row.id,points:row.max as number|null}));
  expect(fullCapitalResearchScore(rows)).toBe(100);
  rows.at(-1)!.points=0;
  expect(fullCapitalResearchScore(rows)).toBe(99);
  rows.at(-1)!.points=null;
  expect(fullCapitalResearchScore(rows)).toBeNull();
});
it("replays actual retained FPT and exposes all 23 rubrics with formal scope isolated",()=>{
  const cmd=["tools/scoring/validate_fpt_capital_allocation.mjs","--ticker","FPT"];
  const result=execFileSync(process.execPath,cmd,{encoding:"utf8"});
  expect(result).toBe(readFileSync(`${dir}/FPT_CAPITAL_ALLOCATION_RESULT.json`,"utf8"));
  const data=JSON.parse(result);
  expect(data.scorecard).toHaveLength(23);
  expect(data.aggregation).toMatchObject({assessedPoints:43,ratedWeight:95,completeResearchScore:null,formalScore:null});
  expect(data.investmentDecisionInput.formalDecisionAuthorized).toBe(false);
  expect(spawnSync(process.execPath,[...cmd,"--publish"]).status).not.toBe(0);
});
