import {describe,it,expect} from "vitest";
import {PortfolioEngine} from "@/application/portfolio/engine";
import {scopedIntegrity,DerivedScoringPortfolioRead} from "@/application/scoring/portfolio-context";
import {P,A,B,NOW,W0,at,history,goldenInputs} from "../fixtures/portfolio/history";
import {dateOnly} from "@/shared/time";
import type {ReconciliationEvidence} from "@/domain/portfolio/reconciliation";
import {lotContext} from "@/application/scoring/execution-context";
import {rankScorecards} from "@/domain/ranking/rank";
import {rankingFixture} from "../fixtures/scoring";
const statement=():ReconciliationEvidence=>({id:"statement",portfolioId:P,asOf:at(12),receivedAt:at(12),sourceReference:"Synthetic statement",cash:"8270",receivables:"0",payables:"0",unresolvedDiscrepancy:false,positions:[{securityId:A,quantity:"90",openCost:"966"},{securityId:B,quantity:"20",openCost:"1000"}]});
async function derived(e:ReconciliationEvidence|null){
  const transactions=history(goldenInputs());let writes=0;
  const engine=new PortfolioEngine({read:async()=>({inceptionAt:at(1),watermark:W0,transactions}),commit:async()=>{writes++;throw new Error("No scoring writes");}},{now:()=>NOW});
  const snapshot=await engine.snapshot(P,at(12),{version:"p",methodologyId:"test-valuation",observations:[A,B].map((sid,i)=>({id:`price-${i}`,securityId:sid,price:i?"60":"15",currency:"VND",observedAt:at(12),receivedAt:at(12),validThrough:at(12),sourceReference:"Synthetic"}))},e,{version:"reference-v1",intervals:[A,B].flatMap((sid,i)=>[{id:`m-${i}`,kind:"MEMBERSHIP",securityId:sid,from:dateOnly("2026-01-01"),to:null,value:"MEMBER",taxonomy:null,sourceReference:"Synthetic"},{id:`s-${i}`,kind:"SECTOR",securityId:sid,from:dateOnly("2026-01-01"),to:null,value:"INDUSTRIAL",taxonomy:"test",sourceReference:"Synthetic"}])},"test");
  return {snapshot,writes:()=>writes};
}
describe("M3 field-scoped M6.3 application integration",()=>{
  it("VC-063/105: 100-share cash accumulation is a display overlay only",async()=>{
    const e=statement(),{snapshot}=await derived(e),integrity=scopedIntegrity(snapshot,e,true);
    const price={id:"expensive-fixture-price",securityId:A,price:"100",currency:"VND" as const,observedAt:at(12),receivedAt:at(12),validThrough:at(12),sourceReference:"Synthetic price"};
    expect(lotContext(snapshot,integrity,price,"0",false).status).toBe("REQUIRES CASH ACCUMULATION");
    expect(lotContext(snapshot,integrity,{...price,price:"10"},"0",false).status).toBe("EXECUTABLE NOW");
    expect(lotContext(snapshot,integrity,price,null,false).status).toBe("NOT ASSESSED");
    expect(lotContext(snapshot,integrity,price,"0",true).status).toBe("BLOCKED BY PORTFOLIO LIMIT");
    expect(snapshot.state.cash).toBe("8270");
  });
  it("VC-052/053/086/121: cost-only missing evidence permits exposure and omits cost context",async()=>{
    const e={...statement(),positions:statement().positions.map(p=>({...p,openCost:null}))};const {snapshot,writes}=await derived(e);
    expect(snapshot.actionabilityBlocked).toBe(true);const result=scopedIntegrity(snapshot,e,true);expect(result.status).toBe("PASS");expect(result.costStatus).toBe("BLOCKED");expect(result).not.toHaveProperty("openCost");expect(writes()).toBe(0);
    expect(await new DerivedScoringPortfolioRead(async()=>({snapshot,evidence:e,current:true})).read(snapshot.asOf)).toEqual(result);
  });
  it.each(["cash","quantity","obligations","unknown","absent"])("VC-060/120/122/123/125: %s corruption blocks scoped ranking",async kind=>{
    let e:ReconciliationEvidence|null=statement();if(kind==="cash")e={...e,cash:"8271"};if(kind==="quantity")e={...e,positions:[]};if(kind==="obligations")e={...e,payables:null};if(kind==="unknown")e={...e,unresolvedDiscrepancy:true};if(kind==="absent")e=null;
    const {snapshot,writes}=await derived(e);expect(scopedIntegrity(snapshot,e,true).status).toBe("BLOCKED");expect(writes()).toBe(0);expect(snapshot.state.cash).toBe("8270");
  });
  it("VC-124: same existing snapshot gives same context; stale watermark blocks",async()=>{const e=statement(),{snapshot}=await derived(e);expect(scopedIntegrity(snapshot,e,true)).toEqual(scopedIntegrity(snapshot,e,true));expect(scopedIntegrity(snapshot,e,false).status).toBe("BLOCKED");});
  it("blocked accounting removes portfolio-aware entries without changing issuer score",()=>{
    const f=rankingFixture([82]);const r=rankScorecards({...f,portfolio:{snapshotId:"snapshot",portfolioId:"portfolio",asOf:f.asOf,ledgerWatermark:"1",reconstructionMethod:"m63",referenceVersion:"reference-v1",priceVersion:"price-v1",evidenceId:null,status:"BLOCKED",costStatus:"BLOCKED",reasons:["MISSING_RECONCILIATION"]}});
    expect(r.top10).toEqual([]);expect(r.input.cards[0].totalScore).toBe("82");expect(rankScorecards(f).top10).toHaveLength(1);
  });
});
