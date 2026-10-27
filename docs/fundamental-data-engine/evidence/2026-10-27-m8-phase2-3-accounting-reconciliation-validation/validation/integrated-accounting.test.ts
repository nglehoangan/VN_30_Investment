import { beforeEach,afterEach,describe,it,expect } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync,writeFileSync } from "node:fs";
import path from "node:path";
import { testDatabase } from "../../../../../tests/fixtures/database";
import { methodologyFixture } from "../../../../../tests/fixtures/methodology";
import { P,A,B,NOW,at,method,input,buy,sell,settlement,reversal,deposit } from "../../../../../tests/fixtures/portfolio/history";
import { openingClaim,openingPosition,receipt,syntheticAuthority } from "../../../../../tests/fixtures/portfolio/dividend-settlement";
import { forwardRecord,syntheticIntakeAuthority } from "../../../../../tests/fixtures/portfolio/forward-intake";
import { initializePortfolio } from "@/application/portfolio/initialize";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { PrismaPortfolioLedger,PrismaPortfolioSetup } from "@/infrastructure/repositories/portfolio-ledger";
import { PrismaForwardEventIntake } from "@/infrastructure/repositories/forward-intake";
import { ACCOUNTING_METHOD,watermark } from "@/domain/portfolio/values";
import { reconcilePortfolio,type ReconciliationEvidence } from "@/domain/portfolio/reconciliation";
import type { ForwardRecord } from "@/domain/portfolio/forward-intake";
const output=path.join(process.cwd(),"docs/fundamental-data-engine/evidence/2026-10-27-m8-phase2-3-accounting-reconciliation-validation/validation");
const expected={cash:"1171",receivables:"30",payables:"0",realizedPnl:"72.5",netDividends:"9",netContributions:"150",expenses:"4",quantity:"30",openCost:"226.5",averageCost:"7.55",transactions:17,legs:25,revision:"5"};
describe("Phase2.3 independently tabulated synthetic integrated sequence",()=>{
 let db:Awaited<ReturnType<typeof testDatabase>>,ledger:PrismaPortfolioLedger,engine:PortfolioEngine,intake:PrismaForwardEventIntake;
 beforeEach(async()=>{
  db=await testDatabase({portfolioOnly:true});await db.registry.append({...methodologyFixture(method),implementationIdentity:ACCOUNTING_METHOD});
  await initializePortfolio(new PrismaPortfolioSetup(db.client),{id:P,name:"SYNTHETIC_VALIDATION_ONLY",currency:"VND",inceptionAt:at(1),createdAt:NOW},[{id:A,name:"A"},{id:B,name:"B"}]);
  const sql=new DatabaseSync(db.config.filePath);for(const m of ["202610270001_dividend_settlement","202610270002_forward_intake"])sql.exec(readFileSync(`prisma/migrations/${m}/migration.sql`,"utf8"));sql.close();
  ledger=new PrismaPortfolioLedger(db.client,syntheticAuthority);engine=new PortfolioEngine(ledger,{now:()=>NOW});
  await engine.post([{...openingClaim(),amount:"1000"}],watermark("0"));await engine.post([{...openingPosition(),quantity:"10",opening:{cost:"100",migrationVersion:"SYNTHETIC",evidence:"SYNTHETIC"}}],watermark("1"));
  intake=new PrismaForwardEventIntake(db.client,{now:()=>NOW},syntheticIntakeAuthority,syntheticAuthority);
 });
 afterEach(async()=>{await db?.close();});
 const post=async(rs:readonly ForwardRecord[])=>intake.post(P,rs,(await ledger.read(P)).watermark);
 async function stream(){
  const events=[deposit("capital","200",3),buy("buy","10","200",4,{price:"20",fee:"2"}),settlement("buy-settle","buy","202",5),sell("sell","5","150",6,{price:"30",fee:"1",tax:"1"}),settlement("sell-settle","sell","148",7),input("income","DIVIDEND_CASH",8,{securityId:A,dividend:{net:"9",gross:"10",withholding:"1"}}),receipt("claim-part-1","40",9),receipt("claim-part-2","30",10),input("split","CORPORATE_ACTION",11,{securityId:A,quantity:"15",corporateAction:{id:"SYNTHETIC_SPLIT",subtype:"SPLIT",numerator:"2",denominator:"1",evidence:"SYNTHETIC_ONLY",stage:"EFFECTIVE"}}),input("fee","FEE",12,{amount:"3"}),input("tax","TAX",13,{amount:"2"}),input("withdraw","CASH_WITHDRAWAL",14,{amount:"50"})];
  const original=await ledger.read(P);const result=await post(events.map(f=>forwardRecord(f)));expect(result.status).toBe("POSTED");
  await post([forwardRecord(reversal("fee-reversal","fee",15),{economicId:"fee",component:"REVERSAL",revision:"2",corrects:"fee"})]);
  const replace={...input("z-tax-replacement","TAX",16,{amount:"4"}),correctionGroupId:"tax-correction"};
  await post([forwardRecord(reversal("a-tax-reversal","tax",16,{correctionGroupId:"tax-correction"}),{economicId:"tax",component:"REVERSAL",revision:"2",corrects:"tax"}),forwardRecord(replace,{economicId:"tax",revision:"2",corrects:"tax"})]);
  const after=await ledger.read(P);for(const t of original.transactions)expect(after.transactions.find(x=>x.facts.id===t.facts.id)).toEqual(t);
  return {after,events};
 }
 it("integrated cash/quantity/MWAC/P&L/claims/flows and immutable history agree with independent expected table",async()=>{
  const {after,events}=await stream();const state=await engine.reconstruct(P,NOW);
  expect(state).toMatchObject({cash:expected.cash,receivables:expected.receivables,payables:expected.payables,realizedPnl:expected.realizedPnl,netDividends:expected.netDividends,netContributions:expected.netContributions,expenses:expected.expenses,positions:[{quantity:expected.quantity,openCost:expected.openCost,averageCost:expected.averageCost}]});
  expect(after.transactions).toHaveLength(expected.transactions);expect(after.watermark).toBe(expected.revision);expect(await db.client.ledgerLeg.count()).toBe(expected.legs);
  expect(await db.client.$queryRaw`SELECT * FROM forward_intake_event`).toHaveLength(15);expect(await db.client.$queryRaw`SELECT * FROM dividend_settlement_audit`).toHaveLength(2);
  const terms=[1000n,200n,-202n,148n,9n,40n,30n,-3n,-2n,-50n,3n,2n,-4n];expect(terms.reduce((a,b)=>a+b,0n).toString()).toBe(expected.cash);
  // Independent exact carrying-component identity (basis, NOT market value or NAV):
  // (1171 + 30 + 226.5) - (1000 + 100 + 100) = 150 + 72.5 + 9 - 4 = 227.5.
  expect(11710+300+2265-10000-1000-1000).toBe(1500+725+90-40);
  expect((await post(events.map(f=>forwardRecord(f,{document:"SECOND_FORMAT"})))).status).toBe("DUPLICATE");expect((await ledger.read(P)).watermark).toBe(expected.revision);
  writeFileSync(path.join(output,"INTEGRATED_EXPECTED_ACTUAL.json"),JSON.stringify({classification:"SYNTHETIC_ISOLATED_SQLITE_NOT_PRODUCTION_ACCEPTANCE",status:"PASS",expected,actual:{cash:state.cash,receivables:state.receivables,payables:state.payables,realizedPnl:state.realizedPnl,netDividends:state.netDividends,netContributions:state.netContributions,expenses:state.expenses,positions:state.positions,transactionCount:after.transactions.length,legCount:await db.client.ledgerLeg.count(),revision:after.watermark},independentCashTerms:terms.map(String),bookCarryingComponentBridge:"1427.5-1200 = 150+72.5+9-4 = 227.5; NOT NAV",inputCommands:events,originalHistoryUnchanged:true},null,2)+'\n');
 });
 it("reconciliation detects unknown obligations, mismatches and cross-date observations",async()=>{
  await stream();const state=await engine.reconstruct(P,NOW);
  const reference:ReconciliationEvidence={id:"SYNTHETIC",portfolioId:P,asOf:NOW,receivedAt:NOW,sourceReference:"SYNTHETIC_ONLY",cash:"1171",positions:[{securityId:A,quantity:"30",openCost:"226.5"}],receivables:"30",payables:"0",unresolvedDiscrepancy:false};
  const results=[reconcilePortfolio(state,reference,NOW),reconcilePortfolio(state,{...reference,payables:null},NOW),reconcilePortfolio(state,{...reference,payables:"105"},NOW),reconcilePortfolio(state,{...reference,asOf:at(20)},NOW),reconcilePortfolio(state,{...reference,unresolvedDiscrepancy:true},NOW)];
  expect(results.map(r=>r.status)).toEqual(["MATCH","MISSING_EVIDENCE","MISMATCH","NOT_COMPARABLE","MISMATCH"]);expect(results.slice(1).every(r=>r.actionabilityBlocked)).toBe(true);
  writeFileSync(path.join(output,"RECONCILIATION_GUARD_RESULTS.json"),JSON.stringify({classification:"SYNTHETIC_CONTRACT_VALIDATION",results},null,2)+'\n');
 });
 it("default source authority remains absent, and unknown categories never post",async()=>{
  const noAuthority=new PrismaForwardEventIntake(db.client,{now:()=>NOW});expect((await noAuthority.post(P,[forwardRecord(deposit("d","5",3))],watermark("2"))).status).toBe("BLOCKED");
  const unsupported={...forwardRecord(deposit("d","5",3)),category:"AMBIGUOUS_DIVIDEND_OR_CAPITAL"};expect((await post([unsupported])).outcomes[0].status).toBe("UNSUPPORTED");expect(await db.client.ledgerTransaction.count()).toBe(2);
 });
 it("canonical receipt correction after claim enrollment remains explicitly fail-closed",async()=>{
  const canonical={...syntheticAuthority,async receiptIdentity(tx:Parameters<typeof syntheticAuthority.receiptIdentity>[0],f:Parameters<typeof syntheticAuthority.receiptIdentity>[1]){if(f.id==="capital"||f.id==="z-capital-replacement")return {namespace:"SYNTHETIC",id:"ONE_CAPITAL_RECEIPT"};return syntheticAuthority.receiptIdentity(tx,f);}};
  const flow=new PrismaForwardEventIntake(db.client,{now:()=>NOW},syntheticIntakeAuthority,canonical);
  await flow.post(P,[forwardRecord(deposit("capital","5",3)),forwardRecord(receipt("claim","40",4))],watermark("2"));
  const replace={...deposit("z-capital-replacement","6",5),correctionGroupId:"g"};
  const result=await flow.post(P,[forwardRecord(reversal("a-capital-reversal","capital",5,{correctionGroupId:"g"}),{economicId:"capital",component:"REVERSAL",revision:"2",corrects:"capital"}),forwardRecord(replace,{economicId:"capital",revision:"2",corrects:"capital"})],watermark("3"));
  expect(result.status).toBe("BLOCKED");expect((await ledger.read(P)).watermark).toBe("3");expect(await db.client.ledgerTransaction.count()).toBe(4);
 });
});
