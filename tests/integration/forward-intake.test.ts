// @vitest-environment node
import { beforeEach,afterEach,describe,it,expect } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { testDatabase } from "../fixtures/database";
import { methodologyFixture } from "../fixtures/methodology";
import { initializePortfolio } from "@/application/portfolio/initialize";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { PrismaPortfolioLedger,PrismaPortfolioSetup } from "@/infrastructure/repositories/portfolio-ledger";
import { PrismaForwardEventIntake,type ForwardIntakeAuthority } from "@/infrastructure/repositories/forward-intake";
import { openDatabase } from "@/infrastructure/db/client";
import { ACCOUNTING_METHOD,watermark } from "@/domain/portfolio/values";
import { P,A,B,NOW,at,method,input,buy,sell,settlement,reversal,deposit } from "../fixtures/portfolio/history";
import { openingClaim,openingPosition,receipt,syntheticAuthority } from "../fixtures/portfolio/dividend-settlement";
import { forwardRecord,syntheticIntakeAuthority } from "../fixtures/portfolio/forward-intake";
import type { ForwardRecord } from "@/domain/portfolio/forward-intake";
describe("Phase2.2 isolated forward intake",()=>{
 let db:Awaited<ReturnType<typeof testDatabase>>,ledger:PrismaPortfolioLedger,engine:PortfolioEngine,intake:PrismaForwardEventIntake;
 beforeEach(async()=>{
  db=await testDatabase({portfolioOnly:true});await db.registry.append({...methodologyFixture(method),implementationIdentity:ACCOUNTING_METHOD});
  await initializePortfolio(new PrismaPortfolioSetup(db.client),{id:P,name:"SYNTHETIC_ONLY",currency:"VND",inceptionAt:at(1),createdAt:NOW},[{id:A,name:"A"},{id:B,name:"B"}]);
  const sql=new DatabaseSync(db.config.filePath);for(const m of ["202610270001_dividend_settlement","202610270002_forward_intake"])sql.exec(readFileSync(`prisma/migrations/${m}/migration.sql`,"utf8"));sql.close();
  ledger=new PrismaPortfolioLedger(db.client,syntheticAuthority);engine=new PortfolioEngine(ledger,{now:()=>NOW});
  await engine.post([{...openingClaim(),amount:"10000"}],watermark("0"));await engine.post([openingPosition()],watermark("1"));
  intake=new PrismaForwardEventIntake(db.client,{now:()=>NOW},syntheticIntakeAuthority,syntheticAuthority);
 });
 afterEach(async()=>{await db?.close();});
 const post=async(records:readonly ForwardRecord[])=>intake.post(P,records,(await ledger.read(P)).watermark);
 it("BUY + separate settlement reuse engine in one atomic multi-time batch",async()=>{
  const result=await post([forwardRecord(buy("b","1","10",3)),forwardRecord(settlement("bs","b","10",4))]);expect(result).toMatchObject({status:"POSTED",postedCount:2,ledgerWatermark:"3"});expect((await engine.reconstruct(P,NOW))).toMatchObject({cash:"9990",payables:"0",positions:[{quantity:"3",openCost:"30"}]});expect(await db.client.$queryRaw`SELECT * FROM forward_intake_event`).toHaveLength(2);
 });
 it("SELL + settlement realizes P&L once",async()=>{
  await post([forwardRecord(sell("s","1","15",3)),forwardRecord(settlement("ss","s","15",4))]);expect(await engine.reconstruct(P,NOW)).toMatchObject({cash:"10015",receivables:"100",realizedPnl:"5",positions:[{quantity:"1",openCost:"10"}]});
 });
 it("deposit, withdrawal, fees and taxes preserve separate capital/expense semantics",async()=>{
  await post([forwardRecord(deposit("d","50",3)),forwardRecord(input("w","CASH_WITHDRAWAL",4,{amount:"10"})),forwardRecord(input("fee","FEE",5,{amount:"2"})),forwardRecord(input("tax","TAX",6,{amount:"1"}))]);expect(await engine.reconstruct(P,NOW)).toMatchObject({cash:"10037",netContributions:"40",expenses:"3",netDividends:"0"});
 });
 it("cash dividend records income but no external flow",async()=>{
  await post([forwardRecord(input("div","DIVIDEND_CASH",3,{securityId:A,dividend:{net:"5",gross:null,withholding:null}}))]);expect(await engine.reconstruct(P,NOW)).toMatchObject({cash:"10005",netDividends:"5",netContributions:"0"});
 });
 it("net claim settlement retains Phase2.1 receipt protection and zero duplicate income",async()=>{
  expect((await post([forwardRecord(receipt())])).status).toBe("POSTED");expect(await engine.reconstruct(P,NOW)).toMatchObject({cash:"10070",receivables:"30",netDividends:"0"});
  const duplicate=input("alias","CASH_DEPOSIT",4,{amount:"70",source:{source:"OTHER_FORMAT",reference:"receipt-s1"}});
  expect(await post([forwardRecord(duplicate)])).toMatchObject({status:"BLOCKED",postedCount:0});expect(await db.client.ledgerTransaction.count()).toBe(3);
 });
 it("supported split preserves total MWAC basis",async()=>{
  const action=input("split","CORPORATE_ACTION",3,{securityId:A,quantity:"2",corporateAction:{id:"fixture-split",subtype:"SPLIT",numerator:"2",denominator:"1",evidence:"SYNTHETIC_TERMS",stage:"EFFECTIVE"}});
  await post([forwardRecord(action)]);expect((await engine.reconstruct(P,NOW)).positions[0]).toMatchObject({quantity:"4",openCost:"20",averageCost:"5"});
 });
 it("repeat/cross-file/cross-format receipts return DUPLICATE with no revision change",async()=>{
  const f=deposit("d","50",3);await post([forwardRecord(f)]);
  const alternate={...f,id:input("alternate","CASH_DEPOSIT",3).id,idempotencyKey:"alternate",source:{source:"OTHER",reference:"other-row"}};
  const result=await post([forwardRecord(alternate,{economicId:"d",document:"another-file"})]);expect(result).toMatchObject({status:"DUPLICATE",postedCount:0,duplicateCount:1,ledgerWatermark:"3"});expect(result.outcomes[0].transactionId).toBe("d");expect(await db.client.ledgerTransaction.count()).toBe(3);
 });
 it("duplicates in one batch are explicit and retained, not silently discarded",async()=>{
  const r=forwardRecord(deposit("d","5",3));const result=await post([r,{...r,source:{...r.source,documentId:"other"}}]);expect(result).toMatchObject({status:"POSTED",postedCount:1,duplicateCount:1});expect(result.outcomes).toHaveLength(2);
 });
 it("conflicting content under same stable event/revision NEEDS_REVIEW",async()=>{
  await post([forwardRecord(deposit("d","5",3))]);const result=await post([forwardRecord(deposit("alias","6",3),{economicId:"d"})]);expect(result.status).toBe("BLOCKED");expect(result.outcomes[0]).toMatchObject({status:"NEEDS_REVIEW",reason:"ECONOMIC_EVENT_CONTENT_CONFLICT"});
 });
 it("legacy direct ledger transaction is detected by verified economic identity",async()=>{
  await engine.post([deposit("legacy","5",3)],watermark("2"));const result=await post([forwardRecord(deposit("other","5",3),{economicId:"legacy"})]);expect(result.status).toBe("DUPLICATE");expect(await db.client.ledgerTransaction.count()).toBe(3);
 });
 it("unresolved legacy provenance blocks rather than assuming no duplicate",async()=>{
  await engine.post([deposit("legacy","5",3)],watermark("2"));const a={...syntheticIntakeAuthority,async legacyIdentity(){return null;}};
  const result=await new PrismaForwardEventIntake(db.client,{now:()=>NOW},a).post(P,[forwardRecord(deposit("new","5",4))],watermark("3"));expect(result.outcomes[0].reason).toBe("EXISTING_LEDGER_ECONOMIC_IDENTITY_UNRESOLVED");expect(result.status).toBe("BLOCKED");
 });
 it("pre-opening event and date-only cannot be imported",async()=>{
  const f=deposit("old","5",1);const old=await post([forwardRecord(f)]);expect(old.outcomes[0].status).toBe("BLOCKED_OPENING_BOUNDARY");
  const r=forwardRecord(deposit("date","5",3));const result=await post([{...r,source:{...r.source,effective:{precision:"DATE",value:"2026-01-03"}}}]);expect(result.outcomes[0].reason).toBe("EXACT_EFFECTIVE_INSTANT_REQUIRED");expect(await db.client.ledgerTransaction.count()).toBe(2);
 });
 it("missing source/identity and unsupported categories preserve every original record",async()=>{
  const r=forwardRecord(buy("b","1","10",3));const records=[{...r,source:{...r.source,eventId:""}},{...r,security:null},{...r,category:"INTEREST_UNCLASSIFIED"}];const result=await post(records);expect(result.outcomes.map(o=>o.status)).toEqual(["BLOCKED_SOURCE","BLOCKED_IDENTITY","UNSUPPORTED"]);expect(result.outcomes.map(o=>o.record)).toEqual(records);expect(result.postedCount).toBe(0);
 });
 it("no real acceptance adapter defaults BLOCKED_SOURCE",async()=>{
  const r=await new PrismaForwardEventIntake(db.client,{now:()=>NOW}).post(P,[forwardRecord(deposit("d","5",3))],watermark("2"));expect(r.status).toBe("BLOCKED");expect(r.outcomes[0].reason).toBe("AUTHENTICATED_SOURCE_ADAPTER_UNAVAILABLE");
 });
 it("hash mismatch, wrong accepted security/account, self-review and future knowledge fail closed",async()=>{
  const r=forwardRecord(buy("b","1","10",3));
  const bad={...r,source:{...r.source,contentHash:"0".repeat(64)}};expect((await post([bad])).outcomes[0].status).toBe("BLOCKED_SOURCE");
  const a:ForwardIntakeAuthority={...syntheticIntakeAuthority,async qualify(tx,r,now){const g=(await syntheticIntakeAuthority.qualify(tx,r,now))!;return {...g,securityId:B};}};
  expect((await new PrismaForwardEventIntake(db.client,{now:()=>NOW},a).post(P,[r],watermark("2"))).outcomes[0].status).toBe("BLOCKED_IDENTITY");
  const invalid={...r,source:{...r.source,knownAt:"2030-01-01T00:00:00.000Z" as typeof NOW,retrievedAt:"2030-01-01T00:00:00.000Z" as typeof NOW}};
  expect((await post([invalid])).outcomes[0].reason).toBe("FUTURE_OR_INCONSISTENT_KNOWLEDGE");
 });
 it("invalid financial event in second record rolls back the entire batch",async()=>{
  const result=await post([forwardRecord(deposit("d","5",3)),forwardRecord(input("w","CASH_WITHDRAWAL",4,{amount:"20000"}))]);expect(result.status).toBe("BLOCKED");expect(result.postedCount).toBe(0);expect((await ledger.read(P)).watermark).toBe("2");expect(await db.client.$queryRaw`SELECT * FROM forward_intake_event`).toHaveLength(0);
 });
 it("audit failure and revoked acceptance at atomic commit roll back business legs",async()=>{
  await db.client.$executeRawUnsafe("CREATE TRIGGER synthetic_audit_fault BEFORE INSERT ON forward_intake_event BEGIN SELECT RAISE(ABORT,'fixture audit failure'); END;");await expect(post([forwardRecord(deposit("d","5",3))])).rejects.toThrow();expect((await ledger.read(P)).watermark).toBe("2");
  await db.client.$executeRawUnsafe("DROP TRIGGER synthetic_audit_fault");let calls=0;
  const a:ForwardIntakeAuthority={...syntheticIntakeAuthority,async qualify(tx,r,now){return ++calls===1?syntheticIntakeAuthority.qualify(tx,r,now):null;}};
  const result=await new PrismaForwardEventIntake(db.client,{now:()=>NOW},a).post(P,[forwardRecord(deposit("d","5",3))],watermark("2"));expect(result.status).toBe("BLOCKED");expect(await db.client.ledgerTransaction.count()).toBe(2);
 });
 it("explicit immutable reversal is supported and opening reversal is blocked",async()=>{
  await post([forwardRecord(deposit("d","5",3))]);expect((await post([forwardRecord(reversal("r","d",4),{economicId:"d",component:"REVERSAL",revision:"2",corrects:"d"})])).status).toBe("POSTED");expect((await engine.reconstruct(P,NOW)).cash).toBe("10000");
  const blocked=await post([forwardRecord(reversal("ro","opening-position",5),{corrects:"opening-position"})]);expect(blocked.status).toBe("BLOCKED");
 });
 it("corrected broker revision requires paired reversal/replacement; duplicate revision cannot repost",async()=>{
  await post([forwardRecord(deposit("d","5",3))]);const replacement={...deposit("z-replace","6",4),correctionGroupId:"g"};
  const unsupported=await post([forwardRecord(replacement,{economicId:"d",revision:"2",corrects:"d"})]);expect(unsupported.status).toBe("BLOCKED");
  const records=[forwardRecord(reversal("a-reverse","d",4,{correctionGroupId:"g"}),{economicId:"d",component:"REVERSAL",revision:"2",corrects:"d"}),forwardRecord(replacement,{economicId:"d",revision:"2",corrects:"d"})];
  expect((await post(records)).status).toBe("POSTED");expect((await engine.reconstruct(P,NOW)).cash).toBe("10006");expect((await post(records)).status).toBe("DUPLICATE");
 });
 it("enrolled portfolio cannot bypass intake/audit via the old posting facade",async()=>{
  await post([forwardRecord(deposit("d","5",3))]);await expect(engine.post([deposit("bypass","5",4)],watermark("3"))).rejects.toThrow();expect(await db.client.ledgerTransaction.count()).toBe(3);
 });
 it("concurrent imports use CAS; retry identical event is idempotent",async()=>{
  const other=await openDatabase(db.config);try{
   const i2=new PrismaForwardEventIntake(other,{now:()=>NOW},syntheticIntakeAuthority,syntheticAuthority);const record=forwardRecord(deposit("d","5",3));
   const results=await Promise.allSettled([intake.post(P,[record],watermark("2")),i2.post(P,[record],watermark("2"))]);expect(results.some(x=>x.status==="fulfilled")).toBe(true);expect(await db.client.ledgerTransaction.count()).toBe(3);expect((await i2.post(P,[record],watermark("2"))).status).toBe("DUPLICATE");
   await expect(i2.post(P,[forwardRecord(deposit("stale","1",4))],watermark("2"))).rejects.toThrow();
  }finally{await other.$disconnect();}
 });
 it("different concurrent imports cannot both claim the same revision",async()=>{
  const other=await openDatabase(db.config);try{
   const i2=new PrismaForwardEventIntake(other,{now:()=>NOW},syntheticIntakeAuthority,syntheticAuthority);
   const results=await Promise.allSettled([intake.post(P,[forwardRecord(deposit("c1","5",3))],watermark("2")),i2.post(P,[forwardRecord(deposit("c2","5",3))],watermark("2"))]);
   expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);expect(await db.client.ledgerTransaction.count()).toBe(3);expect((await ledger.read(P)).watermark).toBe("3");
  }finally{await other.$disconnect();}
 });
 it("oversell and unfunded margin fail existing accounting rules",async()=>{
  expect((await post([forwardRecord(sell("oversell","3","45",3))])).status).toBe("BLOCKED");
  expect((await post([forwardRecord(buy("margin","2000","20000",3))])).status).toBe("BLOCKED");
  expect((await ledger.read(P)).watermark).toBe("2");expect(await db.client.ledgerTransaction.count()).toBe(2);
 });
 it("audit is immutable and tampered retained audit fails read integrity",async()=>{
  await post([forwardRecord(deposit("d","5",3))]);await expect(db.client.$executeRaw`DELETE FROM forward_intake_event`).rejects.toThrow();await expect(db.client.$executeRaw`INSERT OR REPLACE INTO forward_intake_event SELECT * FROM forward_intake_event`).rejects.toThrow();
  await db.client.$executeRawUnsafe("DROP TRIGGER forward_intake_event_update");await db.client.$executeRaw`UPDATE forward_intake_event SET body='{}'`;await expect(ledger.read(P)).rejects.toThrow();
 });
});
