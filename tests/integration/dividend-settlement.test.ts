// @vitest-environment node
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { testDatabase } from "../fixtures/database";
import { methodologyFixture } from "../fixtures/methodology";
import { initializePortfolio } from "@/application/portfolio/initialize";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { PrismaPortfolioLedger, PrismaPortfolioSetup } from "@/infrastructure/repositories/portfolio-ledger";
import { ACCOUNTING_METHOD, watermark } from "@/domain/portfolio/values";
import { parsePortfolioCommands } from "@/infrastructure/repositories/portfolio-command-schema";
import { openDatabase } from "@/infrastructure/db/client";
import { P, A, B, NOW, at, method, input, reversal } from "../fixtures/portfolio/history";
import { openingClaim, openingPosition, receipt, syntheticAuthority } from "../fixtures/portfolio/dividend-settlement";
import type { TransactionInput } from "@/domain/portfolio/transaction";
import type { DividendSettlementAuthority } from "@/infrastructure/repositories/dividend-settlement-guard";
describe("Phase2.1 isolated real SQLite / CAS / immutable audit", () => {
 let db: Awaited<ReturnType<typeof testDatabase>>, ledger: PrismaPortfolioLedger, engine: PortfolioEngine;
 beforeEach(async()=>{
  db=await testDatabase({portfolioOnly:true});
  await db.registry.append({...methodologyFixture(method),implementationIdentity:ACCOUNTING_METHOD});
  await initializePortfolio(new PrismaPortfolioSetup(db.client),{id:P,name:"SYNTHETIC_ONLY",currency:"VND",inceptionAt:at(1),createdAt:NOW},[{id:A,name:"A"},{id:B,name:"B"}]);
  ledger=new PrismaPortfolioLedger(db.client,syntheticAuthority);engine=new PortfolioEngine(ledger,{now:()=>NOW});
  await engine.post([openingClaim()],watermark("0"));await engine.post([openingPosition()],watermark("1"));
  // Rehearse table rebuild with existing legacy facts, legs and self/FK references intact.
  const before=await db.client.ledgerTransaction.findMany({include:{legs:true}});
  const sql=new DatabaseSync(db.config.filePath);sql.exec(readFileSync("prisma/migrations/202610270001_dividend_settlement/migration.sql","utf8"));expect(sql.prepare("PRAGMA foreign_key_check").all()).toHaveLength(0);sql.close();
  expect(await db.client.ledgerTransaction.findMany({include:{legs:true}})).toEqual(before);
 });
 afterEach(async()=>{await db?.close();});
 const post=async(f:TransactionInput)=>engine.post([f],(await ledger.read(P)).watermark);
 it("persists exact legs, one receipt owner, audit and idempotent retry even stale revision",async()=>{
  expect(parsePortfolioCommands([receipt()])[0].dividendSettlement?.version).toBe("dividend-receivable-settlement-v1");
  const first=await post(receipt());expect(first).toMatchObject({ledgerWatermark:"3",state:{cash:"80",receivables:"30",netDividends:"0",netContributions:"0"}});
  const retry=await engine.post([receipt()],watermark("0"));expect(retry.ledgerWatermark).toBe("3");expect(await db.client.ledgerTransaction.count()).toBe(3);
  expect(await db.client.$queryRaw`SELECT * FROM dividend_receipt_owner`).toHaveLength(1);expect(await db.client.$queryRaw`SELECT * FROM dividend_settlement_audit`).toHaveLength(1);
  await expect(engine.post([{...receipt(),amount:"69"}],watermark("3"))).rejects.toThrow();
 });
 it("missing operational adapter fails closed and rolls back business/revision",async()=>{
  const e=new PortfolioEngine(new PrismaPortfolioLedger(db.client),{now:()=>NOW});await expect(e.post([receipt()],watermark("2"))).rejects.toThrow();expect(await db.client.ledgerTransaction.count()).toBe(2);expect((await ledger.read(P)).watermark).toBe("2");
 });
 it("acceptance rejection is atomic, including corrections",async()=>{
  const denied:DividendSettlementAuthority={...syntheticAuthority,async authorize(){throw Error("revoked or unauthenticated");}};
  const e=new PortfolioEngine(new PrismaPortfolioLedger(db.client,denied),{now:()=>NOW});await expect(e.post([receipt()],watermark("2"))).rejects.toThrow();expect(await db.client.$queryRaw`SELECT * FROM dividend_receipt_owner`).toHaveLength(0);expect(await db.client.ledgerTransaction.count()).toBe(2);
 });
 it("audit persistence failure rolls back event, legs, revision and receipt",async()=>{
  await db.client.$executeRawUnsafe("CREATE TRIGGER synthetic_audit_failure BEFORE INSERT ON dividend_settlement_audit BEGIN SELECT RAISE(ABORT,'synthetic crash'); END;");
  await expect(post(receipt())).rejects.toThrow();expect(await db.client.ledgerTransaction.count()).toBe(2);expect(await db.client.ledgerLeg.count()).toBe(4);expect((await ledger.read(P)).watermark).toBe("2");expect(await db.client.$queryRaw`SELECT * FROM dividend_receipt_owner`).toHaveLength(0);
 });
 it.each(["DIVIDEND_CASH","CASH_DEPOSIT"] as const)("rejects duplicate receipt via %s after settlement even with alternate source",async(type)=>{
  await post(receipt());const f=input("alias",type,4,{source:{source:"OTHER_EXPORT",reference:"receipt-s1"},...(type==="CASH_DEPOSIT"?{amount:"70"}:{securityId:A,dividend:{net:"70",gross:null,withholding:null}})});
  await expect(post(f)).rejects.toThrow();expect(await db.client.ledgerTransaction.count()).toBe(3);
 });
 it("detects a receipt already posted through legacy cash before settlement enrollment",async()=>{
  await post(input("earlier-cash","CASH_DEPOSIT",2,{amount:"70",source:{source:"OTHER",reference:"receipt-s1"}}));
  await expect(post(receipt())).rejects.toThrow();expect((await ledger.read(P)).watermark).toBe("3");
 });
 it("no adapter cannot bypass receipt registry by posting legacy credit after settlement",async()=>{
  await post(receipt());const e=new PortfolioEngine(new PrismaPortfolioLedger(db.client),{now:()=>NOW});await expect(e.post([input("alias","CASH_DEPOSIT",4,{amount:"70"})],watermark("3"))).rejects.toThrow();
 });
 it("multiple partial receipts persist; duplicate receipt / overclaim rolls back",async()=>{
  await post(receipt("p1","40"));await post(receipt("p2","30",4));expect((await engine.reconstruct(P,NOW)).receivables).toBe("30");
  await expect(post(receipt("extra","1",5))).rejects.toThrow();expect(await db.client.ledgerTransaction.count()).toBe(4);
 });
 it("immutable reversal and explicit correction are audited; receipt stays reserved",async()=>{
  await post(receipt());const r=reversal("a-reverse","s1",4,{correctionGroupId:"g"});
  const replacement=receipt("z-replace","70",4);const s=replacement.dividendSettlement!;
  const fixed={...replacement,correctionGroupId:"g",dividendSettlement:{...s,correctionOf:"s1",receipt:{...s.receipt,id:"receipt-s1",effectiveAt:at(3)}}};
  await engine.post([r,fixed],watermark("3"));expect((await engine.reconstruct(P,NOW))).toMatchObject({cash:"80",receivables:"30",netDividends:"0"});expect(await db.client.$queryRaw`SELECT * FROM dividend_settlement_audit`).toHaveLength(3);expect(await db.client.$queryRaw`SELECT * FROM dividend_receipt_owner`).toHaveLength(1);
  await expect(db.client.$executeRaw`UPDATE ledger_leg SET amount='1' WHERE transaction_id='s1'`).rejects.toThrow();await expect(db.client.$executeRaw`DELETE FROM dividend_settlement_audit`).rejects.toThrow();await expect(db.client.$executeRaw`DELETE FROM dividend_receipt_owner`).rejects.toThrow();
 });
 it("CAS rejects stale different event; two independent connections cannot over-settle",async()=>{
  const other=await openDatabase(db.config);try{
   const e2=new PortfolioEngine(new PrismaPortfolioLedger(other,syntheticAuthority),{now:()=>NOW});
   const results=await Promise.allSettled([engine.post([receipt("c1","50")],watermark("2")),e2.post([receipt("c2","50")],watermark("2"))]);
   expect(results.filter(x=>x.status==="fulfilled")).toHaveLength(1);expect((await ledger.read(P)).watermark).toBe("3");expect((await engine.reconstruct(P,NOW)).receivables).toBe("50");
   await expect(e2.post([receipt("stale","1")],watermark("2"))).rejects.toThrow();await expect(post(receipt("over","21",4))).rejects.toThrow();
  }finally{await other.$disconnect();}
 });
 it("concurrent identical requests never double-post; in-flight CAS conflict retries to original result",async()=>{
  const other=await openDatabase(db.config);try {
   const e2=new PortfolioEngine(new PrismaPortfolioLedger(other,syntheticAuthority),{now:()=>NOW});
   const results=await Promise.allSettled([engine.post([receipt()],watermark("2")),e2.post([receipt()],watermark("2"))]);
   expect(results.some(r=>r.status==="fulfilled")).toBe(true);
   const retry=await e2.post([receipt()],watermark("2"));expect(retry.ledgerWatermark).toBe("3");expect(await db.client.ledgerTransaction.count()).toBe(3);expect(await db.client.$queryRaw`SELECT * FROM dividend_settlement_audit`).toHaveLength(1);
  } finally {await other.$disconnect();}
 });
 it("reversal and correction cannot bypass current source acceptance",async()=>{
  await post(receipt());
  const denied:DividendSettlementAuthority={...syntheticAuthority,async authorize(){throw Error("synthetic revoked acceptance");}};
  const e=new PortfolioEngine(new PrismaPortfolioLedger(db.client,denied),{now:()=>NOW});
  await expect(e.post([reversal("denied-reverse","s1",4)],watermark("3"))).rejects.toThrow();
  expect((await engine.reconstruct(P,NOW)).cash).toBe("80");expect(await db.client.ledgerTransaction.count()).toBe(3);
 });
 it("missing canonical receipt identity rejects, and SQL replace cannot alter immutable audit",async()=>{
  const unknown:DividendSettlementAuthority={...syntheticAuthority,async receiptIdentity(){throw Error("unresolved receipt");}};
  await expect(new PortfolioEngine(new PrismaPortfolioLedger(db.client,unknown),{now:()=>NOW}).post([receipt()],watermark("2"))).rejects.toThrow();
  await post(receipt());
  await expect(db.client.$executeRaw`INSERT OR REPLACE INTO dividend_settlement_audit SELECT * FROM dividend_settlement_audit`).rejects.toThrow();
  await expect(db.client.$executeRaw`UPDATE dividend_receipt_owner SET receipt_id='alias'`).rejects.toThrow();
 });
 it("accepted evidence digest is bound to exact allocation and receipt, not a client accepted flag",async()=>{
  const mismatch:DividendSettlementAuthority={...syntheticAuthority,async authorize(tx,f,original){return {...await syntheticAuthority.authorize(tx,f,original),receiptHash:"0".repeat(64)};}};
  await expect(new PortfolioEngine(new PrismaPortfolioLedger(db.client,mismatch),{now:()=>NOW}).post([receipt()],watermark("2"))).rejects.toThrow();
  expect(await db.client.ledgerTransaction.count()).toBe(2);expect((await ledger.read(P)).watermark).toBe("2");
 });
 it("audit tampering is rejected on read even if SQL immutability was administratively disabled",async()=>{
  await post(receipt());await db.client.$executeRawUnsafe("DROP TRIGGER dividend_settlement_audit_update");await db.client.$executeRaw`UPDATE dividend_settlement_audit SET body='{}' WHERE transaction_id='s1'`;await expect(ledger.read(P)).rejects.toThrow();
 });
});
