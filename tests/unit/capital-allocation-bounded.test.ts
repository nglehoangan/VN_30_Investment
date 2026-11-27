import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { RUBRICS } from "@/domain/scoring/methodology";
import { fullCapitalResearchScore } from "@/domain/current-scoring/capital-allocation-research";
import { portfolioLinkage, eventValueAssessment, ownershipBridge, reviewParentCash,
  resolveBoundedCapitalEffective, sequentialTransfer } from "@/domain/current-scoring/capital-allocation-bounded";

const loc="docs/fundamental-data-engine/fpt-capital-allocation/v1.1";
const read=(name:string)=>JSON.parse(readFileSync(`${loc}/${name}.json`,"utf8"));
const result=()=>read("FPT_CAPITAL_ALLOCATION_RESULT");

it("requires linked outcomes for material investment groups without forcing project IRRs",()=>{
  const group={decision:"Deploy network assets",deployed:"Paid capital bound",outcome:"Observed service volumes",counterevidence:"Maturity still short",
    material:true,attribution:"SUPPORTED" as const,refs:["note"]};
  expect(portfolioLinkage([group],r=>r==="note")).toBe(true);
  expect(portfolioLinkage([group,{...group,attribution:"UNRESOLVED"}],()=>true)).toBe(false);
  expect(portfolioLinkage([group],()=>false)).toBe(false);
});
it("reconciles H1 parent independently from cutoff dates and retains only the qualified result",()=>{
  const data=result();
  const h1=read("DATA_FREEZE_H1");
  expect(reviewParentCash(h1.parentH1)).toMatchObject({residual:598075238288,reconstructed:2655261460729,netBorrowing:-1339000000000,reconciles:true});
  expect(data.capital.h1[1]).toMatchObject({points:1,reviewCutoff:"2026-06-30"});
  expect(data.capital.h1[1].routes.A.model.maximum.refs).toContain("h1Paid");
  expect(data.capital.current[1].points).toBeNull();
});
it("keeps a later review pending distinct from invalidation or stale carry",()=>{
  const {capital}=result();
  const review=read("APPLICABILITY_REVIEW")["CA-DIST"];
  const current=capital.current[1], annual=capital.annual[1], eligible=capital.h1[1];
  const run=(r:typeof review,usable=()=>true)=>resolveBoundedCapitalEffective(current,annual,eligible,r,usable);
  expect(run(review)).toMatchObject({points:1,validity:"PROVISIONAL",underlyingAssessmentCutoff:"2026-06-30",
    currentReassessmentPoints:null,updateStatus:"MATERIAL_REVIEW_PENDING"});
  expect(run({...review,reviewThrough:"2026-11-12"}).points).toBeNull();
  expect(run({...review,validUntil:"2026-11-12"}).points).toBeNull();
  expect(run({...review,status:"UPDATE_PENDING"}).points).toBeNull();
  expect(run({...review,events:[...review.events,{date:"2026-11-14",impact:"BOUNDED",ref:"future",reason:"Late"}]}).points).toBeNull();
  expect(run(review,()=>false).points).toBeNull();
  expect(run({...review,status:"INVALIDATED",events:[{...review.events[0],impact:"INVALIDATING"}]}))
    .toMatchObject({points:null,updateStatus:"INVALIDATED"});
});
it("uses dated comparable analyst estimates and keeps unknown benefits outside the final band",()=>{
  const candidate={before:1471069183,issued:10260939,valueRange:[84850,100820],eventDate:"2025-06-30",
    valueKnownBy:"2025-04-01",comparabilityVerified:true,grossProceeds:102609390000,netProceeds:null,
    benefitsBounded:false,materialityReason:"Cost scale plus supported counterevidence."};
  const analysis=eventValueAssessment(candidate);
  expect(analysis.qualifiedValue).toBe(true);
  expect(analysis.economicConclusionEligible).toBe(false);
  expect(analysis.sensitivities.map(s=>s.breakEvenBenefit)).toEqual([768031284150,931898479980]);
  expect(eventValueAssessment({...candidate,valueKnownBy:"2025-07-01"}).qualifiedValue).toBe(false);
  expect(eventValueAssessment({...candidate,benefitsBounded:true,netProceedsBounds:[100e9,102e9]}).economicConclusionEligible).toBe(true);
  expect(eventValueAssessment({...candidate,benefitsBounded:true,netProceedsBounds:[100e9,102e9],materialityReason:""}).economicConclusionEligible).toBe(false);
  expect(sequentialTransfer([.01,.02])).toBeCloseTo(.0298);
});
it("isolates employee and pro-rata effects, rejecting unreconciled shares",()=>{
  const bridge=ownershipBridge(4944.5,4811,1703507121,10819301,171401226,1885727648);
  expect(bridge.annualOnProRataBasis).toBeCloseTo(4495,0);
  expect(bridge.annualRestatedDenominatorOnly).toBeLessThan(bridge.annualOnProRataBasis);
  expect(bridge.employeeOwnershipFactor).toBeCloseTo(.99369);
  expect(()=>ownershipBridge(4944.5,4811,1703507121,10819301,171401226,1885727647)).toThrow();
});
it("keeps numeric zero distinct from incomplete or complete totals",()=>{
  const rows=RUBRICS.map(r=>({id:r.id,points:r.max as number|null}));
  expect(fullCapitalResearchScore(rows)).toBe(100);
  rows[0].points=0;
  expect(fullCapitalResearchScore(rows)).toBe(100-RUBRICS[0].max);
  rows[0].points=null;
  expect(fullCapitalResearchScore(rows)).toBeNull();
});
it("replays actual FPT with two scoped provisional points and exact predecessor scores",()=>{
  const argv=["tools/scoring/validate_fpt_bounded_capital_allocation.mjs","--ticker","FPT"];
  const bytes=execFileSync(process.execPath,argv,{encoding:"utf8"});
  expect(bytes).toBe(readFileSync(`${loc}/FPT_CAPITAL_ALLOCATION_RESULT.json`,"utf8"));
  const data=JSON.parse(bytes);
  const baseline=JSON.parse(readFileSync(`${loc}/../v1.0/FPT_CAPITAL_ALLOCATION_RESULT.json`,"utf8"));
  expect(data.aggregation.effectiveScores.slice(0,19)).toEqual(baseline.aggregation.effectiveScores.slice(0,19));
  expect(data.aggregation).toMatchObject({assessedPoints:45,ratedWeight:97,completeResearchScore:null,formalScore:null});
  expect(data.aggregation.effectiveScores.slice(19).map((x:{points:number|null})=>x.points)).toEqual([null,1,null,1]);
  expect(data.investmentDecisionInput.formalDecisionAuthorized).toBe(false);
  expect(spawnSync(process.execPath,[...argv,"--publish"]).status).not.toBe(0);
});
