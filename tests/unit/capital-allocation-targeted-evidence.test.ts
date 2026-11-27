import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { evaluateOperatingLink, issueSensitivity, managementAllocation, reverseAnnualBenefit } from "@/domain/current-scoring/capital-allocation-targeted-evidence";

const root="docs/fundamental-data-engine/fpt-capital-allocation";
const directory=root+"/targeted-evidence-update-2026-11-27";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));

it("requires matched operating evidence, invested capital and ownership",()=>{
  const supported={sameProject:true,capitalBasis:"DEPLOYED" as const,commercialOutcome:true,sameEconomicScope:true,attribution:"Matched actual operating output."};
  expect(evaluateOperatingLink(supported)).toBe(true);
  expect(evaluateOperatingLink({...supported,capitalBasis:"CWIP_ONLY"})).toBe(false);
  expect(evaluateOperatingLink({...supported,sameProject:false})).toBe(false);
  expect(evaluateOperatingLink({...supported,commercialOutcome:false})).toBe(false);
  expect(evaluateOperatingLink({...supported,sameEconomicScope:false})).toBe(false);
});

it("replays separate KPI legs, thresholds and caps",()=>{
  expect(managementAllocation(.1926,-.2635,1703507121)).toMatchObject({tsrPart:0});
  expect(managementAllocation(.1926,-.2635,1703507121).profitPart).toBeCloseTo(.0013482,10);
  expect(managementAllocation(.099,1,1000)).toMatchObject({profitPart:0,tsrPart:.00075});
  expect(managementAllocation(1,0,1000).profitPart).toBe(.00175);
});

it("uses actual gross proceeds, exposes fee sensitivity and reverses required annual benefits",()=>{
  const result=issueSensitivity(1703507121,10819301,70800,108193010000,0,0);
  expect(result.breakEvenBenefit).toBe(657813500800);
  expect(result.economicLoss).toBeCloseTo(.0054197095,9);
  expect(issueSensitivity(1703507121,10819301,70800,108193010000,1e9,0).breakEvenBenefit)
    .toBe(result.breakEvenBenefit+1e9);
  expect(reverseAnnualBenefit(result.breakEvenBenefit,3,.12)).toBeCloseTo(273879980456.3604,0);
  expect(issueSensitivity(1703507121,10819301,70800,108193010000,0,result.breakEvenBenefit).economicLoss).toBeCloseTo(0);
});

it("replays retained evidence and only updates the two authorized rubric objects",()=>{
  const command=["tools/scoring/validate_fpt_targeted_capital_evidence.mjs","--ticker","FPT"];
  const output=execFileSync(process.execPath,command,{encoding:"utf8"});
  expect(output).toBe(readFileSync(directory+"/FPT_TARGETED_RESULT.json","utf8"));
  const actual=JSON.parse(output);
  const baseline=read(root+"/v1.1/FPT_CAPITAL_ALLOCATION_RESULT.json");
  const preserve=(row:{id:string})=>!["CA-REINV","CA-DIL"].includes(row.id);
  expect(actual.aggregation.effectiveScores.filter(preserve)).toEqual(baseline.aggregation.effectiveScores.filter(preserve));
  expect(actual.products.annual.esop).toBeNull();
  expect(read(directory+"/UPDATED_FREEZE_ANNUAL.json").evidenceIds).not.toContain("TE09");
  expect(actual.products.current.esop.issue.employee.lockYears).toBe(3);
  expect(actual.products.current.esop.issue.managers.lockYears).toBe(10);
  expect(actual.products.current.esop.netProceeds).toBeNull();
  expect(actual.products.current.esop.incrementalBenefit).toBeNull();
  expect(actual.products.current.esop.quote).toBe(70800);
  expect(actual.aggregation).toMatchObject({completeResearchScore:null,formalScore:null,ratedWeight:97});
  expect(spawnSync(process.execPath,[...command,"--publish"]).status).not.toBe(0);
});
