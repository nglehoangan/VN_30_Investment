import { describe, it, expect } from "vitest";
import { history, NOW, P, W0, A, at, input, reversal } from "../fixtures/portfolio/history";
import { openingClaim, openingPosition, receipt, allocation } from "../fixtures/portfolio/dividend-settlement";
import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import type { TransactionInput } from "@/domain/portfolio/transaction";
const replay = (events: TransactionInput[]) => reconstructPortfolio(P, history([openingClaim(), openingPosition(), ...events]), NOW, W0, at(1));
type WritableFixture<T> = T extends string ? string : T extends ReadonlyArray<infer V> ? WritableFixture<V>[] : T extends object ? { -readonly [K in keyof T]-?: WritableFixture<T[K]> } : T;
type Draft = WritableFixture<Required<TransactionInput>>;
const change = (f: TransactionInput, mutate: (f: Draft) => void) => { const copy = JSON.parse(JSON.stringify(f)) as Draft; mutate(copy); return copy as unknown as TransactionInput; };
describe("Phase2.1 synthetic dividend receivable semantics", () => {
  it("full subclaim settlement has exactly cash+70/receivable-70; no income/flow/quantity/MWAC/P&L", () => {
    const state = replay([receipt()]); expect(state).toMatchObject({ cash: "80", receivables: "30", netDividends: "0", netContributions: "0", realizedPnl: "0", positions: [{ quantity: "2", openCost: "20", averageCost: "10" }] });
    const t = history([openingClaim(),receipt()])[1]; expect(t.legs.map(l => [l.type,l.amount,l.settlementReference])).toEqual([["CASH","70",null],["RECEIVABLE","-70","opening-claim:leg:2"]]); expect(t.externalFlow).toBe("NONE");
  });
  it("partial, multiple partials and all subclaims leave exact residuals", () => {
    expect(replay([receipt("p1","40")])).toMatchObject({receivables:"60",dividendClaims:[{claimId:"claim-a",remaining:"30"},{claimId:"claim-b",remaining:"30"}]});
    const b = change(receipt("b","30",5), f => { f.securityId = "security-b"; f.dividendSettlement.claimId="claim-b";f.dividendSettlement.actionId="action-b";f.dividendSettlement.receipt.securityId="security-b";f.dividendSettlement.receipt.actionId="action-b"; });
    expect(replay([receipt("p1","40"),receipt("p2","30",4),b])).toMatchObject({ cash:"110",receivables:"0" });
  });
  it.each([
    ["over settlement", (f:Draft)=>{f.amount="71";f.dividendSettlement.receipt.net="71";}],
    ["cross portfolio",(f:Draft)=>{f.dividendSettlement.allocation.portfolioId="other";}],
    ["wrong issuer",(f:Draft)=>{f.securityId="security-b";}],
    ["wrong action",(f:Draft)=>{f.dividendSettlement.actionId="unrelated";}],
    ["missing allocation",(f:Draft)=>{Reflect.deleteProperty(f,"dividendSettlement");}],
    ["missing evidence",(f:Draft)=>{f.dividendSettlement.receipt.evidence=[];}],
    ["gross rejected",(f:Draft)=>{f.dividendSettlement.allocation.basis="GROSS";}],
    ["net mismatch",(f:Draft)=>{f.dividendSettlement.receipt.net="69";}],
    ["allocation total",(f:Draft)=>{f.dividendSettlement.allocation.claims[0].amount="69";}],
    ["overlapping subclaim",(f:Draft)=>{f.dividendSettlement.allocation.claims[1]=f.dividendSettlement.allocation.claims[0];}],
    ["future knowledge",(f:Draft)=>{f.dividendSettlement.knownAt="2030-01-01T00:00:00.000Z";}],
    ["future evidence",(f:Draft)=>{f.dividendSettlement.receipt.evidence[0].knownAt="2030-01-01T00:00:00.000Z";}],
    ["wrong original leg",(f:Draft)=>{f.dividendSettlement.allocation.originalLegId="opening-claim:leg:1";}],
    ["unknown schema",(f:Draft)=>{f.dividendSettlement.version="v2";}],
  ])("rejects %s",(_label,mutate)=>{expect(()=>replay([change(receipt(),mutate)])).toThrow();});
  it("rejects aggregate over-settlement across distinct receipts",()=>expect(()=>replay([receipt("p1","40"),receipt("p2","31",4)])).toThrow());
  it("rejects duplicate receipt even with different event and source",()=>expect(()=>replay([receipt("p1","30"),change(receipt("p2","30",4),f=>{f.dividendSettlement.receipt.id="receipt-p1";})])).toThrow());
  it("rejects alternative allocation of original leg",()=>expect(()=>replay([receipt("p1","30"),change(receipt("p2","30",4),f=>{f.dividendSettlement.allocation.id="alternate";})])).toThrow());
  it("immutable reversal restores cash and claim; earlier asOf unchanged",()=>{
    const inputs=[openingClaim(),openingPosition(),receipt(),reversal("r","s1",4)];const h=history(inputs);expect(reconstructPortfolio(P,h,NOW,W0)).toMatchObject({cash:"10",receivables:"100",netDividends:"0"});expect(reconstructPortfolio(P,h,at(3),W0).cash).toBe("80");expect(h[2].legs[0].amount).toBe("70");expect(Object.isFrozen(h[2].facts)).toBe(true);
  });
  it("rejects reversal with spent cash",()=>expect(()=>replay([receipt(),input("withdraw","CASH_WITHDRAWAL",4,{amount:"80"}),reversal("r","s1",5)])).toThrow());
  it("explicit atomic reversal/replacement preserves receipt ownership and income",()=>{
    const r=reversal("a-reverse","s1",4,{correctionGroupId:"correction"});
    const next=change(receipt("z-replace","70",4),f=>{f.correctionGroupId="correction";f.dividendSettlement.correctionOf="s1";f.dividendSettlement.receipt.id="receipt-s1";f.dividendSettlement.receipt.effectiveAt=at(3);});
    expect(replay([receipt(),r,next])).toMatchObject({cash:"80",receivables:"30",netDividends:"0"});
  });
  it("reversal does not free a receipt for unrelated reimport",()=>expect(()=>replay([receipt(),reversal("r","s1",4),change(receipt("s2","70",5),f=>{f.dividendSettlement.receipt.id="receipt-s1";})])).toThrow());
  it("legacy DIVIDEND_CASH still records income and CASH_DEPOSIT external flow",()=>{
    expect(replay([input("d","DIVIDEND_CASH",3,{securityId:A,dividend:{net:"5",gross:null,withholding:null}}),input("c","CASH_DEPOSIT",4,{amount:"2"})])).toMatchObject({cash:"17",receivables:"100",netDividends:"5",netContributions:"2"});
  });
  it("allocation metadata never creates assets",()=>{expect(allocation().claims).toHaveLength(2);expect(replay([])).toMatchObject({cash:"10",receivables:"100"});});
});
