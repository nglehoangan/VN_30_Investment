// @vitest-environment node
import { beforeEach,afterEach,describe,it,expect } from "vitest";
import { testDatabase } from "../fixtures/database";
import { methodologyFixture } from "../fixtures/methodology";
import { navFixture,navHistory,navInput,NP,NS,NI,NC,NT,navMethod,nh,syntheticNavAuthority } from "../fixtures/current-nav";
import { initializePortfolio } from "@/application/portfolio/initialize";
import { PrismaPortfolioLedger,PrismaPortfolioSetup } from "@/infrastructure/repositories/portfolio-ledger";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { CurrentNavReadService } from "@/application/current-nav/read-service";
import { ACCOUNTING_METHOD,watermark } from "@/domain/portfolio/values";
import type { CurrentNavInputProvider } from "@/ports/current-nav";
describe("Phase3.2 readonly service on isolated actual SQLite",()=>{
 let db:Awaited<ReturnType<typeof testDatabase>>,ledger:PrismaPortfolioLedger,fixture:ReturnType<typeof navFixture>,provider:CurrentNavInputProvider;
 beforeEach(async()=>{
  db=await testDatabase({portfolioOnly:true});await db.registry.append({...methodologyFixture(navMethod),implementationIdentity:ACCOUNTING_METHOD});
  await initializePortfolio(new PrismaPortfolioSetup(db.client),{id:NP,name:"SYNTHETIC_ONLY",currency:"VND",inceptionAt:NI,createdAt:NC},[{id:NS,name:"SyntheticA"}]);
  ledger=new PrismaPortfolioLedger(db.client);const engine=new PortfolioEngine(ledger,{now:()=>NC});
  for(const t of navHistory())await engine.post([t.facts],(await ledger.read(NP)).watermark);
  fixture=navFixture();fixture={...fixture,request:{...fixture.request,ledgerRevision:"3"},plan:{...fixture.plan,ledgerRevision:"3"}};
  provider={async load(){return fixture.plan;},async isCurrent(){return true;}};
 });
 afterEach(async()=>{await db?.close();});
 const service=(source=provider,authority=syntheticNavAuthority,origin:"SYNTHETIC_TEST"|"RETAINED_RESEARCH"="SYNTHETIC_TEST")=>new CurrentNavReadService(ledger,source,{now:()=>NC},nh,authority,origin);
 it("assembles pinned ledger-derived plan, returns1220 immutable manifest and makes no writes",async()=>{
  const before=await db.client.ledgerTransaction.findMany({include:{legs:true}}),revision=(await ledger.read(NP)).watermark;
  const result=await service().read(fixture.request);expect(result).toMatchObject({navState:"QUALIFIED_NAV",totalNav:"1220",ledgerRevision:"3",snapshotPersisted:false,productionAuthorized:false});
  expect(result.manifest.ledgerStateHash).toMatch(/^[a-f0-9]{64}$/);expect(await db.client.ledgerTransaction.findMany({include:{legs:true}})).toEqual(before);expect((await ledger.read(NP)).watermark).toBe(revision);
 });
 it("defaults to nonoperational retained mode and no authority, never trusts test/JSONflags",async()=>{
  const reader=new CurrentNavReadService(ledger,provider,{now:()=>NC},nh);
  const r=await reader.read(fixture.request);expect(r.navState).toBe("NAV_BLOCKED");expect(r.totalNav).toBeNull();expect(r.productionAuthorized).toBe(false);
  expect((await service(provider,syntheticNavAuthority,"RETAINED_RESEARCH").read(fixture.request)).navState).toBe("NAV_BLOCKED");
 });
 it("missing real input source returnsNAV_BLOCKED without reconstructing fake prices",async()=>{
  const result=await service({async load(){return null;},async isCurrent(){return false;}}).read(fixture.request);expect(result.blockingReasons).toContain("INPUT_PLAN_UNAVAILABLE");expect(result.totalNav).toBeNull();
 });
 it("rechecks ledger revision after reading source and blocks racing results",async()=>{
  const changing={read:async()=>{const r=await ledger.read(NP);return {...r,watermark:watermark(calls++?"4":"3")};}};let calls=0;
  const r=await new CurrentNavReadService(changing,provider,{now:()=>NC},nh,syntheticNavAuthority,"SYNTHETIC_TEST").read(fixture.request);expect(r.navState).toBe("NAV_BLOCKED");expect(r.blockingReasons).toContain("LEDGER_REVISION_CHANGED");expect(await db.client.ledgerTransaction.count()).toBe(3);
 });
 it("evidence-head race, source failure and clock rollback fail closed",async()=>{
  expect((await service({...provider,async isCurrent(){return false;}}).read(fixture.request)).blockingReasons).toContain("EVIDENCE_HEAD_CHANGED");
  const reader=new CurrentNavReadService(ledger,{async load(){throw Error("source unavailable");},async isCurrent(){return true;}},{now:()=>NC},nh);expect((await reader.read(fixture.request)).navState).toBe("NAV_BLOCKED");
  let calls=0;const rollback=new CurrentNavReadService(ledger,provider,{now:()=>calls++?NT:NC},nh,syntheticNavAuthority,"SYNTHETIC_TEST");expect((await rollback.read(fixture.request)).navState).toBe("NAV_BLOCKED");
 });
 it("does not claim AS_KNOWN or ignore late-known ledger facts",async()=>{
  expect((await service().read({...fixture.request,knowledgeMode:"AS_KNOWN" as "RETROSPECTIVE"})).blockingReasons).toContain("BITEMPORAL_QUERY_UNSUPPORTED");
  const r=await service().read({...fixture.request,knowledgeCutoff:NT});expect(r.blockingReasons).toContain("FUTURE_LEDGER_KNOWLEDGE");
 });
 it("post-close known events are not mixed into earlier EOD cash",async()=>{
  const engine=new PortfolioEngine(ledger,{now:()=>NC});
  await engine.post([navInput("post-close-cash","CASH_DEPOSIT",{amount:"5",eventAt:NC,effectiveAt:NC})],(await ledger.read(NP)).watermark);
  fixture={...fixture,request:{...fixture.request,ledgerRevision:"4"},plan:{...fixture.plan,ledgerRevision:"4"}};
  const r=await service().read(fixture.request);expect(r.valuationAt).toBe(NT);expect(r.cash).toBe("1000");expect(r.representsCurrentAccountNow).toBe(false);
 });
});
