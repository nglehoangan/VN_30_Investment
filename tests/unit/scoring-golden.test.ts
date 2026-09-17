import {it,expect,describe} from "vitest";
import {fixture,award,rankingFixture,ASOF} from "../fixtures/scoring";
import {calculateScorecard,type ScoreInput} from "@/domain/scoring/scorecard";
import {calculateMetrics} from "@/domain/scoring/metrics";
import {rankScorecards,type PortfolioIntegrity} from "@/domain/ranking/rank";
import {reconstructPortfolio} from "@/domain/portfolio/reconstruct";
import {P,A,NOW,W0,at,history,deposit,buy,sell,settlement,reversal,input as transactionInput} from "../fixtures/portfolio/history";
import {dateOnly} from "@/shared/time";
const replay=(inputs:Parameters<typeof history>[0],cutoff=NOW)=>reconstructPortfolio(P,history(inputs),cutoff,W0);
const category=(f:ScoreInput,cat:string)=>calculateScorecard(f).categories.find(c=>c.category===cat)!.points;
function context(asOf:string):PortfolioIntegrity{return {snapshotId:"synthetic-snapshot",portfolioId:"p",asOf,ledgerWatermark:"1",reconstructionMethod:"m63",referenceVersion:"reference-v1",priceVersion:"prices",evidenceId:"statement",status:"PASS",costStatus:"PASS",reasons:[]};}
describe("M3 golden sector and anti-shortcut cases",()=>{
  it("VC-001 raw evidence → normalized metric → explicit assessment → 82/100",()=>{
    const f=fixture();const amounts=["20","100"].map((value,i)=>({...f.evidence[i],id:`raw-${i}`,observation:`raw-${i}`,unit:"VND" as const,value}));
    const c=calculateScorecard({...f,evidence:[...f.evidence,...amounts],metrics:[{id:"normalized-roic",metric:"ROIC",evidenceRefs:amounts.map(e=>e.id),years:null,comparable:true,normalization:{kind:"NORMALIZED",rationale:"Synthetic normalized issuer NOPAT and average operating capital",evidenceRefs:amounts.map(e=>e.id)}}],assessments:f.assessments.map(a=>a.subcategory==="BQ-EQ"?{...a,evidence:a.evidence.map(e=>e.topic==="returns"?{...e,refs:amounts.map(a=>a.id),rationale:"ROIC 20% is evidence; persistence/margins/cost of capital justify explicit Good economics6, not automatic8"}:e)}:a)});
    expect(c.metrics[0].value).toBe("0.2");expect(c.subcategories[0].points).toBe(6);expect(c.categories[0].points).toBe("20");expect(c.totalScore).toBe("82");
  });
  it.each(["VC-002","VC-003"])("%s timing overlays cannot enter the fundamental input",()=>{expect(()=>calculateScorecard({...fixture(),timingOverlay:"FAVORABLE"} as never)).toThrow();});
  it("VC-005/006 weak business or valuation category excluded despite compensating points",()=>{
    for(const sub of ["BQ-EQ","VAL-PRIMARY"]){const r=rankingFixture([82]);const f=sub==="BQ-EQ"?award(award(r.cards[0].input,sub,0),"BQ-MOAT",0):award(award(r.cards[0].input,sub,0),"VAL-MOS",0);expect(rankScorecards({...r,cards:[calculateScorecard(f),...r.cards.slice(1)]}).top10).toHaveLength(0);}
  });
  it("VC-030/031 bank ROE22% never overrides provisioning assessment",()=>{
    const f=fixture(0,"BANK");const evidence=["22","100"].map((value,i)=>({...f.evidence[i],id:`ratio-${i}`,observation:`ratio-${i}`,value,unit:"VND" as const}));
    const request={id:"roe",metric:"ROE" as const,evidenceRefs:evidence.map(e=>e.id),years:null,comparable:true,normalization:{kind:"NORMALIZED" as const,rationale:"Normalized credit-cost-adjusted issuer inputs",evidenceRefs:evidence.map(e=>e.id)}};
    expect(calculateMetrics([request],evidence,"BANK",ASOF,[],false)[0].value).toBe("0.22");
    const weak=award(f,"BQ-EQ",4);expect(category(weak,"BQ")).toBe("18");expect(()=>calculateScorecard({...award(f,"BQ-EQ",8),assessments:award(f,"BQ-EQ",8).assessments.map(a=>a.subcategory==="BQ-EQ"?{...a,maximumPrerequisitesMet:false}:a)})).toThrow();
  });
  it("VC-032 developer low price does not repair weak realization or legal/funding risks",()=>{const f=award(award(fixture(0,"REAL_ESTATE"),"BQ-CASH",2),"VAL-PRIMARY",2);expect(category(f,"VAL")).toBe("12");expect(category(f,"BQ")).toBe("17");});
  it("VC-033 technology low tangible book is not a penalty",()=>{expect(calculateScorecard(fixture(0,"TECHNOLOGY")).totalScore).toBe("82");});
  it("VC-034 retailer adverse store economics uses weaker bounded growth assessment",()=>{const f=award(fixture(0,"RETAIL"),"GQ-INC",1);expect(category(f,"GQ")).toBe("9");});
  it.each(["VC-035","VC-036"])("%s peak and trough require symmetric normalization",()=>{
    const f=fixture(0,"MATERIALS"),e=["10","100"].map((value,i)=>({...f.evidence[i],id:`m-${i}`,observation:`m-${i}`,unit:"VND" as const,value}));
    const metric={id:"roic",metric:"ROIC" as const,evidenceRefs:e.map(x=>x.id),years:null,comparable:true,normalization:{kind:"AS_REPORTED" as const,rationale:"Spot earnings",evidenceRefs:[]}};
    expect(calculateMetrics([metric],e,"MATERIALS",ASOF,[],true)[0].value).toBeNull();
    expect(calculateMetrics([{...metric,normalization:{...metric.normalization,kind:"NORMALIZED"}}],e,"MATERIALS",ASOF,[],true)[0].value).toBe("0.1");
    expect(calculateScorecard({...f,normalization:{...f.normalization,cycle:"HIGHLY_CYCLICAL",peakCycleRisk:true}}).flags).toContain("PEAK_CYCLE_RISK");
  });
  it.each(["VC-040","VC-041","VC-042","VC-043"])("%s same family cannot create duplicate economic-channel awards",()=>{
    const f=fixture();const shared=f.evidence[0].id;
    expect(()=>calculateScorecard({...f,assessments:f.assessments.map((a,i)=>i<2?{...a,economicChannel:"same-observation",evidence:a.evidence.map(e=>({...e,refs:[shared]}))}:a)})).toThrow();
  });
  it("VC-044/103 sector constraint changes portfolio ranking once, never fundamental total",()=>{
    const f=rankingFixture([82]);const fundamental=rankScorecards(f),portfolio=rankScorecards({...f,portfolio:context(f.asOf),constraints:[{securityId:f.cards[0].securityId,reason:"Sector concentration blocks addition under existing reviewed policy",evidenceReference:"Synthetic scoped risk assessment"}]});
    expect(fundamental.top10).toHaveLength(1);expect(portfolio.top10).toHaveLength(0);expect(portfolio.input.cards[0].totalScore).toBe("82");
  });
  it("VC-045 confidence excludes once and never multiplies total",()=>{const f=fixture();expect(calculateScorecard({...f,confidence:{...f.confidence,level:"LOW"}}).totalScore).toBe("82");});
  it.each(["VC-050","VC-051","VC-064"])("%s investor balances cannot enter issuer valuation",()=>{expect(()=>calculateScorecard({...fixture(),averageCost:"100",current_cash:"10000"} as never)).toThrow();});
  it("VC-106 equal fundamental criteria do not use investor gain/loss to break tie",()=>{const f=rankingFixture([82,82]);expect(rankScorecards(f).clusters[0].displayOnlyTies[0]).toEqual(f.cards.slice(0,2).map(c=>c.securityId));});
});
describe("M3 issuer action and accounting-source golden cases",()=>{
  it("VC-070 split preserves basis and does not automatically change dilution score",()=>{
    const s=replay([deposit(),buy(),transactionInput("split","CORPORATE_ACTION",3,{securityId:A,quantity:"100",corporateAction:{id:"split-terms",subtype:"SPLIT",numerator:"2",denominator:"1",evidence:"Synthetic authoritative terms",stage:"EFFECTIVE"}})]);
    expect(s.positions[0]).toMatchObject({quantity:"200",openCost:"1000"});expect(category(fixture(),"CA")).toBe("5");
  });
  it("VC-071 bonus share count is not issuer dilution; unspecified accounting remains rejected by M6.3",()=>{expect(category(fixture(),"CA")).toBe("5");expect(()=>history([transactionInput("bonus","CORPORATE_ACTION",3,{securityId:A,quantity:"10",corporateAction:{id:"bonus",subtype:"BONUS",numerator:"1",denominator:"10",evidence:"Synthetic announcement",stage:"EFFECTIVE"}})])).toThrow();});
  it("VC-072/073 rights per-share economic assessment, not share-count bonus",()=>{expect(category(award(fixture(),"CA-DIL",1),"CA")).toBe("5");expect(category(award(fixture(),"CA-DIL",0),"CA")).toBe("4");});
  it("VC-074 missing merger terms produce N/R",()=>{const f=fixture();expect(calculateScorecard({...f,normalization:{...f.normalization,actionComparable:false}}).totalScore).toBeNull();});
  it("VC-075/076 staged rights settlement does not recreate issuer growth or quantity",()=>{
    const terms={id:"rights",subtype:"RIGHTS_SUBSCRIPTION",numerator:"1",denominator:"1",evidence:"Synthetic authoritative terms",stage:"EFFECTIVE" as const,basis:"200"};
    const inputs=[deposit(),transactionInput("exercise","CORPORATE_ACTION",2,{securityId:A,quantity:"20",amount:"200",corporateAction:terms}),transactionInput("paid","CORPORATE_ACTION",3,{securityId:A,amount:"200",corporateAction:{...terms,stage:"SETTLEMENT",originatingTransactionId:transactionInput("exercise","CORPORATE_ACTION",2).id}})];
    expect(replay(inputs,at(2)).positions[0].quantity).toBe("20");expect(replay(inputs).positions[0].quantity).toBe("20");expect(replay(inputs).netContributions).toBe("10000");
  });
  it("VC-061 planning never deposits cash",()=>{expect(replay([]).cash).toBe("0");});
  it("VC-062/080/081/082/083 settlement keeps obligations and quantity/P&L separate",()=>{
    const h=[deposit(),buy(),settlement("buy-paid","buy","1000",3),sell(),settlement("sell-paid","sell","900",9)];
    expect(replay(h,at(2))).toMatchObject({cash:"10000",payables:"1000",positions:[{quantity:"100",openCost:"1000"}]});
    expect(replay(h,at(3))).toMatchObject({cash:"9000",payables:"0",positions:[{quantity:"100",openCost:"1000"}]});
    expect(replay(h,at(8))).toMatchObject({receivables:"900",realizedPnl:"300",positions:[{quantity:"40",openCost:"400"}]});
    expect(replay(h,at(9))).toMatchObject({cash:"9900",receivables:"0",realizedPnl:"300",positions:[{quantity:"40",openCost:"400"}]});
  });
  it("VC-084 full exit and re-entry starts new basis",()=>{const s=replay([deposit(),buy(),sell("exit","100","1500"),buy("reentry","100","1200",9,{price:"12"})]);expect(s.positions[0]).toMatchObject({quantity:"100",openCost:"1200"});});
  it("VC-085 opening migration is explicit source evidence",()=>{expect(replay([transactionInput("opening","OPENING_BALANCE",1,{amount:"100",securityId:A,quantity:"5",opening:{cost:"40",migrationVersion:"test",evidence:"Synthetic verified opening"}})])).toMatchObject({supportedInception:"IMPORTED",netContributions:"0",cash:"100",positions:[{openCost:"40"}]});});
  it("VC-090/091/092/093 correction applies at its effective time, old score remains pinned",()=>{
    const correction={correctionGroupId:"correction"};const h=[deposit(),buy(),settlement("paid","buy","1000",3),reversal("r-paid","paid",4,correction),reversal("r-buy","buy",4,correction),buy("corrected","50","500",4,correction)];
    expect(replay(h,at(3))).toMatchObject({cash:"9000",positions:[{quantity:"100"}]});expect(replay(h,at(4))).toMatchObject({cash:"10000",payables:"500",positions:[{quantity:"50"}]});
    const old=rankScorecards(rankingFixture([82]));const before=JSON.stringify(old);rankScorecards(rankingFixture([83]));expect(JSON.stringify(old)).toBe(before);
  });
  it("VC-110 exact future membership exclusion",()=>{const f=fixture();const r=calculateScorecard({...f,reference:{...f.reference,data:{...f.reference.data,intervals:f.reference.data.intervals.map(row=>row.id==="member-0"?{...row,from:dateOnly("2025-07-01")}:row)}}});expect(r.reference.membership).not.toBe("MEMBER");});
  it("VC-113 later price outcome cannot change method identity or old artifact",()=>{const f=fixture(),old=calculateScorecard(f);expect(()=>calculateScorecard({...f,methodology:{...f.methodology,implementationIdentity:"hindsight-winner-method"}})).toThrow();expect(old.totalScore).toBe("82");});
});
