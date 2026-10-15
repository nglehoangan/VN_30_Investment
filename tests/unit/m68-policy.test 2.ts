import { it,expect } from "vitest";
import { monotonicDecision } from "../fixtures/decision";
import { decide } from "@/domain/decision/engine";
import { createReview,WEEKLY_AREAS } from "@/domain/workflow/reviews";
import { workflowFixture,sections } from "../fixtures/workflow";
import { decimal } from "@/domain/portfolio/values";
it("C: cheaper price alone cannot turn HOLD into ACCUMULATE; fresh formal underwriting can",()=>{
 const i=monotonicDecision(true);i.assessment.thesis.freshUnderwriting=false;i.assessment.thesis.incrementalCase=null;
 expect(decide(i).decisionState).toBe("HOLD");i.assessment.sizing.price="15000";expect(decide(i).decisionState).toBe("HOLD");
 i.assessment.thesis.freshUnderwriting=true;i.assessment.thesis.incrementalCase="Fresh evidenced incremental value beats cash";expect(decide(i).decisionState).toBe("ACCUMULATE");
});
it("D/W: gain above 20 percent and biased rationales do not overwrite formal HOLD",()=>{
 const i=monotonicDecision(true);i.assessment.thesis.freshUnderwriting=false;i.assessment.thesis.incrementalCase=null;
 const before=decide(i);expect(before.decisionState).toBe("HOLD");
 i.portfolio.positions[0].marketValue="2500000";i.assessment.sizing.price="25000";
 expect(decimal("2500000").sub(decimal("2000000")).div(decimal("2000000")).toString()).toBe("0.25");
 expect(decide(i).decisionState).toBe("HOLD");
 for(const wording of ["price fell so buy more","I want to break even","it already gained 20%, sell it","rank #1 so buy","monthly money must be invested"]){
  const p=workflowFixture();p.command.type="WEEKLY";p.command.sections=sections(WEEKLY_AREAS);p.command.sections[0].rationale=wording;
  const pinned=JSON.stringify(p.decisions);expect(createReview(p).disposition).toBe("NO ACTION");expect(JSON.stringify(p.decisions)).toBe(pinned);
 }
});
it("E: rank one remains excluded from capital when M6.5 does not authorize",()=>{
 const p=workflowFixture(1,i=>{i.assessment.opportunity.cash="BETTER";});
 expect(p.ranking!.entries[0].displayRank).toBe(1);expect(p.decisions[0].decisionState).toBe("AVOID");
 const r=createReview(p);expect(r.proposal?.outcome).toBe("HOLD CASH");expect(r.proposal?.items).toEqual([]);
});
it("H: exact single-name no-add boundary never unlocks more capacity",()=>{
 let prior:bigint|null=null;
 for(const value of ["9999999.999999999999","10000000","10000000.000000000001","14999999.999999999999","15000000","15000000.000000000001","19999999.999999999999","20000000","20000000.000000000001"]){
  const i=monotonicDecision(true);i.assessment.risk.elevatedSizeJustification="Same evidenced justification";i.assessment.sizing.economicTargetUpper="0.4";i.portfolio.positions[0].marketValue=value;
  const d=decide(i),capacity=decimal(("sizing" in d.portfolioImpact ? d.portfolioImpact.sizing?.riskCompliantShares : null)??"0").units;
  if(prior!==null)expect(capacity).toBeLessThanOrEqual(prior);prior=capacity;
  if(decimal(value).units>=decimal("15000000").units)expect(d.tradeAuthorization).toBe("NOT AUTHORIZED");
 }
});
it("I: drawdown escalation restricts new risk without automatic liquidation",()=>{
 const i=monotonicDecision(true);i.assessment.risk.drawdown="CRITICAL";expect(decide(i).decisionState).toBe("HOLD");expect(decide(i).tradeAuthorization).toBe("NOT AUTHORIZED");
 i.assessment.risk.approvalReference="TEST ONLY explicit CIO/Risk approval";expect(decide(i).decisionState).toBe("ACCUMULATE");
});
