// @vitest-environment node
import { describe, expect, it } from "vitest";
import { prepareCandidate } from "@/application/portfolio/candidate";
import { parsePortfolioCommands } from "@/infrastructure/repositories/portfolio-command-schema";
import { buildTransaction } from "@/domain/portfolio/transaction";
import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import { PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import type { PrismaClient } from "@/infrastructure/db/generated/client";
import { input, history, reversal, P, NOW, W0, at } from "../fixtures/portfolio/history";
const opening = (receivable?: string) => input("opening", "OPENING_BALANCE", 1, {
  amount: "100", opening: { cost: "0", migrationVersion: "evidenced-import-v1", evidence: "immutable-reference", ...(receivable === undefined ? {} : { receivable }) },
});
const replay = (h: ReturnType<typeof history>) => reconstructPortfolio(P, h, NOW, W0);
describe("evidenced opening receivable compatibility", () => {
  it("accepts the typed command field while retaining strict decimal validation", () => {
    expect(parsePortfolioCommands([opening("2")])[0].opening?.receivable).toBe("2");
    expect(()=>parsePortfolioCommands([opening("1e3")])).toThrow();
    expect(()=>parsePortfolioCommands([{...opening("2"),opening:{...opening("2").opening,unrecognized:"x"}}])).toThrow();
  });
  it("preserves exact cash, obligation, identity, timestamps and facts without recognizing income", () => {
    const f = opening("9007199254740993.125"), before = JSON.stringify(f), t = buildTransaction(f, NOW, []);
    expect(JSON.stringify(f)).toBe(before); expect(t.facts).toEqual(f); expect(t.createdAt).toBe(NOW);
    expect(t.legs.map(l => [l.id, l.type, l.amount])).toEqual([["opening:leg:1", "CASH", "100"], ["opening:leg:2", "RECEIVABLE", "9007199254740993.125"]]);
    expect(replay([t])).toMatchObject({cash:"100",receivables:"9007199254740993.125",payables:"0",netContributions:"0",netDividends:"0",realizedPnl:"0"});
    expect(Object.isFrozen(t.facts.opening)).toBe(true); expect(Object.isFrozen(t.legs[1])).toBe(true);
    expect(() => { (t.legs[1] as {amount:string}).amount="0"; }).toThrow();
  });
  it.each([undefined, "0", "0.000"])("keeps preexisting cash-only leg shape for %s", value => expect(history([opening(value)])[0].legs.map(l=>l.type)).toEqual(["CASH"]));
  it.each(["-1", "NaN", "1e3", "01", "1.0000000000001", "", null, 1])("rejects invalid obligation %s", value => expect(()=>history([opening(value as string)])).toThrow());
  it("supports receivable-only evidenced opening, but rejects an empty opening", () => {
    expect(replay(history([{...opening("2"),amount:undefined}])).receivables).toBe("2");
    expect(()=>history([{...opening("0"),amount:undefined}])).toThrow();
  });
  it("requires evidence, and refuses opening detail on other types", () => {
    expect(()=>history([{...opening("2"),opening:{...opening("2").opening!,evidence:""}}])).toThrow();
    expect(()=>history([{...opening("2"),type:"CASH_DEPOSIT"}])).toThrow();
  });
  it("does not make receivables spendable or bypass duplicate detection", () => {
    expect(()=>replay(history([opening("1000"),input("withdraw","CASH_WITHDRAWAL",2,{amount:"101"})]))).toThrow();
    const t=history([opening("2")])[0]; expect(()=>replay([t,t])).toThrow();
  });
  it.each(["id", "idempotencyKey", "source"] as const)("rejects duplicate %s before commit", key => {
    const original=opening("2"), draft={...opening("2"),id:input("new","OPENING_BALANCE",1).id,idempotencyKey:"new",source:{source:"other",reference:"other"}};
    Object.assign(draft,{[key]:original[key]});
    expect(()=>prepareCandidate(P,history([original]),[draft],NOW,W0)).toThrow();
  });
  it("reverses both original accounts through existing obligation lineage", () => {
    expect(replay(history([opening("2"),reversal("reverse","opening",2)]))).toMatchObject({cash:"0",receivables:"0",netDividends:"0"});
  });
});
// Adapter tests use a synthetic read-only Prisma seam, never the actual SQLite database.
type AdapterRow = ReturnType<typeof adapterRow>;
function adapterRow() {
 const t=history([opening("2")])[0],f=t.facts;
 return {id:String(f.id),portfolioId:P,type:f.type,status:"POSTED",eventAt:f.eventAt,createdAt:t.createdAt,revision:"1",facts:JSON.stringify(t),legCount:t.legs.length,legs:t.legs.map(l=>({...l})),corporateAction:null,corporateActionId:null,reversesId:null,settlesId:null,idempotencyKey:f.idempotencyKey,securityId:null,source:f.source.source,sourceReference:f.source.reference,methodologyId:f.methodologyId};
}
function adapter(mutate:(row:AdapterRow)=>void = ()=>{},intakeRows:{transaction_id:string;body:string;body_hash:string}[] = []) {
  const row=adapterRow();
  mutate(row);
  const tx={$queryRaw:async(query:TemplateStringsArray)=>{const sql=query.join("?");if(sql.includes("sqlite_master")&&sql.includes("forward_intake_event"))return [{name:"forward_intake_event"}];if(sql.includes("FROM forward_intake_event"))return intakeRows;throw Error("UNEXPECTED_ADAPTER_QUERY");},portfolio:{findUnique:async()=>({inceptionAt:at(1),revision:"1"})},ledgerTransaction:{findMany:async()=>[row]}};
  return new PrismaPortfolioLedger({$transaction:async(fn:(value:typeof tx)=>unknown)=>fn(tx)} as unknown as PrismaClient);
}
it("strict adapter accepts complete canonical opening aggregate",async()=>expect((await adapter().read(P)).transactions).toHaveLength(1));
it.each([
  ["relational amount",(r:AdapterRow)=>{r.legs[1].amount="3";}],
  ["missing leg",(r:AdapterRow)=>{r.legs.pop();}],
  ["fact divergence",(r:AdapterRow)=>{const t=JSON.parse(r.facts);t.facts.opening.receivable="3";r.facts=JSON.stringify(t);}],
  ["timestamp divergence",(r:AdapterRow)=>{r.eventAt=at(2);}],
  ["identity divergence",(r:AdapterRow)=>{r.id="other";}],
  ["invalid JSON",(r:AdapterRow)=>{r.facts="{";}],
])("fails closed on genuinely corrupt %s",async(_name,mutate)=>expect(adapter(mutate as (r:AdapterRow)=>void).read(P)).rejects.toMatchObject({code:"DATA_INTEGRITY_ERROR"}));

it("current adapter seam still rejects tampered forward-intake evidence",async()=>{await expect(adapter(()=>{},[{transaction_id:"opening",body:JSON.stringify({transactionId:"opening",factsHash:"forged"}),body_hash:"0".repeat(64)}]).read(P)).rejects.toMatchObject({code:"DATA_INTEGRITY_ERROR"});});
