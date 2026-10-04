// @vitest-environment node
import { beforeEach, afterEach, it, expect, vi } from "vitest";
vi.mock("server-only",()=>({}));
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { testDatabase } from "../fixtures/database";
import { initializePortfolio } from "@/application/portfolio/initialize";
import { PrismaPortfolioSetup, PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { CurrentReadService } from "@/application/current/read-model";
import { ReviewInitiationService } from "@/application/current/review-initiation";
import { LocalCurrentSource } from "@/infrastructure/current-source";
import { PrismaWorkflowArtifacts } from "@/infrastructure/repositories/workflow-artifacts";
import { PrismaDecisionArtifacts } from "@/infrastructure/repositories/decision-artifacts";
import { PrismaAnalyticalArtifacts } from "@/infrastructure/repositories/analytical-artifacts";
import { methodologyFixture } from "../fixtures/methodology";
import { P,A,B,NOW,method,deposit,buy,W0 } from "../fixtures/portfolio/history";
import { ACCOUNTING_METHOD } from "@/domain/portfolio/values";
import { instant } from "@/shared/time";
import type { CurrentSource, ReviewIntent } from "@/ports/current";
import { currentSourceSchema, reviewIntentSchema } from "@/shared/validation/current-source";
import { WEEKLY_AREAS, ANNUAL_AREAS } from "@/domain/workflow/reviews";
import { fixture, ASOF, IDS } from "../fixtures/scoring";
import { calculateScorecard } from "@/domain/scoring/scorecard";
import { rankScorecards } from "@/domain/ranking/rank";
let db:Awaited<ReturnType<typeof testDatabase>>, source:CurrentSource, current:CurrentReadService, initiation:ReviewInitiationService, rankingId:string|null;
const clock={now:()=>NOW},future="2026-09-17T12:00:00.000Z";
const intent:ReviewIntent={type:"WEEKLY",requestedDate:"2026-09-16",contributionReference:null,eventReference:null};
beforeEach(async()=>{
 db=await testDatabase(); await db.registry.append({...methodologyFixture(method),family:"ACCOUNTING",approvalReference:"TEST ONLY production-path governance fixture",intendedUse:"PRODUCTION",governanceStatus:"APPROVED",implementationIdentity:ACCOUNTING_METHOD});
 await initializePortfolio(new PrismaPortfolioSetup(db.client),{id:P,name:"TEST ONLY",currency:"VND",inceptionAt:instant("2026-01-01T00:00:00.000Z"),createdAt:NOW},[{id:A,name:"A"},{id:B,name:"B"}]);
 const ledger=new PrismaPortfolioLedger(db.client);await new PortfolioEngine(ledger,clock).post([deposit()],W0);await new PortfolioEngine(ledger,clock).post([buy()],"1" as typeof W0);
 source={version:"price-1",portfolioId:P,scope:"FORMAL",asOf:NOW,receivedAt:NOW,ledgerWatermark:"2",taxonomy:"test-taxonomy",valuationMethodologyId:"m63-existing-valuation",prices:[{id:"price-a",securityId:A,price:"20",currency:"VND",observedAt:NOW,receivedAt:NOW,validThrough:future,sourceReference:"TEST ONLY external quote",provider:"test-provider",revision:"1",quality:"VALID",policyReference:"TEST ONLY explicit valid-through",adjustment:"RAW"}],references:{version:"ref-1",intervals:[{id:"member",kind:"MEMBERSHIP",securityId:A,from:"2026-01-01",to:null,value:"VN30",taxonomy:null,sourceReference:"TEST ONLY"},{id:"sector",kind:"SECTOR",securityId:A,from:"2026-01-01",to:null,value:"INDUSTRIAL",taxonomy:"test-taxonomy",sourceReference:"TEST ONLY"}]},referenceAsOf:NOW,referenceValidThrough:future,referencePolicy:"TEST ONLY policy",reconciliation:{id:"recon",portfolioId:P,asOf:NOW,receivedAt:NOW,sourceReference:"TEST ONLY independent statement",cash:"10000",positions:[{securityId:A,quantity:"100",openCost:"1000"}],receivables:"0",payables:"1000",unresolvedDiscrepancy:false},analyst:{version:"analyst-1",reviewer:"TEST ONLY analyst",asOf:NOW,receivedAt:NOW,validThrough:future,sourceReference:"TEST ONLY assessment",evidence:[{id:"e1",source:"TEST ONLY statement review",asOf:NOW,receivedAt:NOW,validThrough:future,classification:"FACT",summary:"TEST ONLY surveillance"}],sections:WEEKLY_AREAS.map(area=>({area,securityId:null,evidenceRefs:["e1"],finding:"UNCHANGED",rationale:"TEST ONLY reviewed"})),theses:[],triggers:[],nextReview:"Next scheduled review or material event",governance:null}};
 current=new CurrentReadService(ledger,{load:async()=>currentSourceSchema.parse(source)},clock);rankingId=null;
 initiation=new ReviewInitiationService(current,ledger,new PrismaWorkflowArtifacts(db.client),new PrismaDecisionArtifacts(db.client),new PrismaAnalyticalArtifacts(db.client),db.registry,clock,{candidates:async()=>({decisionIds:[],rankingId})},s=>`review-${createHash("sha256").update(s).digest("hex")}`);
});
afterEach(async()=>{await db?.close();});
it("A: authoritative NAV includes payable; price changes never alter accounting or transactions",async()=>{
 const before=await current.capture(P);expect(before.model.actionability).toBe("PASS");expect(before.model.nav).toBe("11000");expect(before.model.marketValue).toBe("2000");expect(before.model.unrealizedPnl).toBe("1000");expect(before.model.positions[0].weight).toBe("0.181818181818");
 source.prices=[{...source.prices[0],price:"30"}];source.version="price-2";
 const after=await current.capture(P);expect(after.model.marketValue).toBe("3000");expect(after.model.unrealizedPnl).toBe("2000");expect(after.snapshot?.state).toEqual(before.snapshot?.state);expect(await db.client.ledgerTransaction.count()).toBe(2);
});
it("B/C: missing, stale, unknown and conflicted latest price fail closed",async()=>{
 for(const prices of [[],[{...source.prices[0],validThrough:"2026-09-16T11:00:00.000Z",observedAt:"2026-09-15T12:00:00.000Z"}],[{...source.prices[0],policyReference:null}],[{...source.prices[0],quality:"CONFLICTING_DATA" as const}]]){source.prices=prices;const r=await current.capture(P);expect(r.model.actionability).toBe("BLOCKED");expect(r.model.nav).toBeNull();}
});
it("D: effective-dated sector changes do not mutate old captured evidence",async()=>{
 const before=await current.capture(P);source.references.intervals=[...source.references.intervals.filter(r=>r.kind!=="SECTOR"),{...source.references.intervals[1],to:"2026-09-16"},{...source.references.intervals[1],id:"sector-new",from:"2026-09-16",value:"FINANCIAL"}];
 expect((await current.capture(P)).model.positions[0].sector).toBe("FINANCIAL");expect(before.model.positions[0].sector).toBe("INDUSTRIAL");
});
it("E: reconciliation discrepancy and stale ledger block actionability despite valid prices",async()=>{
 source.reconciliation!.unresolvedDiscrepancy=true;expect((await current.capture(P)).model.actionability).toBe("BLOCKED");source.reconciliation=null;expect((await current.capture(P)).model.reconciliation).toBe("MISSING_EVIDENCE");source.ledgerWatermark="1";expect((await current.capture(P)).model.status).toBe("STALE");
});
it("F/H: preview does not write; concurrent weekly submissions persist one formal review without refresh/trade",async()=>{
 expect((await initiation.preview(P,intent)).status).toBe("READY");expect(await db.client.workflowReview.count()).toBe(0);
 const results=await Promise.allSettled([initiation.create(P,intent),initiation.create(P,intent)]);expect(results.some(r=>r.status==="fulfilled"&&r.value.artifactId)).toBe(true);
 const result=await initiation.create(P,intent);expect(result.artifactId).toBeTruthy();expect(await db.client.workflowReview.count()).toBe(1);expect(await db.client.ledgerTransaction.count()).toBe(2);
 const review=await new PrismaWorkflowArtifacts(db.client).find(result.artifactId!);expect(review?.command.scope).toBe("FORMAL");expect(review?.refresh).toEqual({score:false,ranking:false,valuation:false,decision:false});expect(review?.disposition).toBe("NO ACTION");
});
it("I/security: browser authority fields are rejected before any formal write",async()=>{
 for(const field of ["price","cash","nav","portfolioValue","freshness","priceFreshness","reconciliation","reconciliationStatus","methodology","methodologyId","evidenceCutoff","decisionState","riskStatus","reviewOutcome","disposition","candidates","candidateIds","allocation","allocationResult"]){const injected={...intent,[field]:"FAKE"};expect(reviewIntentSchema.safeParse(injected).success).toBe(false);await expect(initiation.create(P,injected)).rejects.toThrow();}expect(await db.client.workflowReview.count()).toBe(0);
});
it("J/K/L: missing analyst evidence, synthetic sources and arbitrary events cannot create reviews",async()=>{
 const original=source.analyst;source.analyst=null;expect((await initiation.create(P,intent)).status).toBe("INPUT REQUIRED");source.analyst=original;source.scope="SYNTHETIC_TEST";expect((await initiation.create(P,intent)).status).toBe("BLOCKED");source.scope="FORMAL";
 expect((await initiation.create(P,{...intent,type:"EVENT_DRIVEN",eventReference:"free text claim"})).status).toBe("INPUT REQUIRED");expect(await db.client.workflowReview.count()).toBe(0);
});
it("G: posted monthly contribution with formal excluded universe preserves HOLD CASH and cash",async()=>{
 const cards=IDS.map((_,index)=>{const f=JSON.parse(JSON.stringify(fixture(index)).replaceAll(ASOF,NOW).replaceAll("SYNTHETIC-00",A));f.reference.data.version=source.references.version;f.artifactScope="FORMAL";f.methodology={...f.methodology,family:"SCORING",governanceStatus:"APPROVED",intendedUse:"PRODUCTION",approvalReference:"TEST ONLY formal-path fixture"};f.confidence.level="LOW";return calculateScorecard(f);});
 source.references=cards[0].input.reference.data;source.taxonomy=cards[0].input.reference.taxonomy;
 const context=(await current.context(P)).context!;
 await db.registry.append(cards[0].methodology);const analytical=new PrismaAnalyticalArtifacts(db.client);for(const c of cards)await analytical.append(c);
 const rank=rankScorecards({id:"formal-test-rank",asOf:NOW,calculatedAt:NOW,cards,universe:{referenceVersion:source.references.version,securityIds:cards.map(c=>c.securityId),complete:true},portfolio:context.integrity,requiredReturnAssessments:[]});expect(rank.entries).toHaveLength(0);expect(rank.status).toBe("VALID");await analytical.append(rank);rankingId=rank.id;
 const result=await initiation.create(P,{...intent,type:"MONTHLY_DCA",contributionReference:"deposit"});expect(result.status).toBe("READY");
 const review=await new PrismaWorkflowArtifacts(db.client).find(result.artifactId!);expect(review?.proposal?.outcome).toBe("HOLD CASH");expect(review?.proposal?.newMonthlyContribution).toBe("10000");expect(review?.proposal?.ledgerCash).toBe("10000");expect(await db.client.ledgerTransaction.count()).toBe(2);
 source.references={...source.references,intervals:source.references.intervals.map(r=>r.kind==="SECTOR"?{...r,value:"FINANCIAL"}:r)};
 const mismatched=await initiation.create(P,{...intent,type:"MONTHLY_DCA",contributionReference:"deposit"});expect(mismatched.reasons).toContain("REFERENCE_DATASET_LINEAGE_MISMATCH");expect(await db.client.workflowReview.count()).toBe(1);
});
it("annual evidence remains separate from policy; missing quarterly evidence fails closed",async()=>{
 expect((await initiation.create(P,{...intent,type:"QUARTERLY"})).status).toBe("INPUT REQUIRED");source.analyst!.sections=ANNUAL_AREAS.map(area=>({area,securityId:null,evidenceRefs:["e1"],finding:"UNCHANGED",rationale:"TEST ONLY reviewed"}));source.analyst!.governance="NO POLICY CHANGE";
 const r=await initiation.create(P,{...intent,type:"ANNUAL"});expect(r.artifactId).toBeTruthy();expect(await db.client.ledgerTransaction.count()).toBe(2);
});
it("normalized local adapter rejects forged outputs and preserves source as-of separately from retrieval",async()=>{
 const file=db.directory+"/source.json";writeFileSync(file,JSON.stringify(source));const provider=new LocalCurrentSource(file);expect((await provider.load(P))?.prices[0].observedAt).toBe(NOW);
 writeFileSync(file,JSON.stringify({...source,nav:"999"}));await expect(provider.load(P)).rejects.toThrow();expect(await new LocalCurrentSource(undefined).load(P)).toBeNull();
});

it("missing one of two held prices suppresses total NAV instead of a partial total",async()=>{
 const ledger=new PrismaPortfolioLedger(db.client);await new PortfolioEngine(ledger,clock).post([buy("buy-b","100","1000",3,{securityId:B})],"2" as typeof W0);source.ledgerWatermark="3";source.reconciliation!.payables="2000";source.reconciliation!.positions=[...source.reconciliation!.positions,{securityId:B,quantity:"100",openCost:"1000"}];
 const r=await current.capture(P);expect(r.model.nav).toBeNull();expect(r.model.marketValue).toBeNull();expect(r.model.positions.find(p=>p.securityId===B)?.priceStatus).toBe("MISSING_REQUIRED_DATA");
});
it("latest invalid or ambiguous quote cannot fall back to an older valid quote",async()=>{
 const p=source.prices[0];source.prices=[{...p,id:"old",observedAt:"2026-09-15T12:00:00.000Z"},{...p,quality:"INVALID"}];let r=await current.capture(P);expect(r.model.nav).toBeNull();expect(r.model.positions[0].priceStatus).toBe("INVALID");
 source.prices=[p,{...p,id:"conflict",price:"21"}];r=await current.capture(P);expect(r.model.nav).toBeNull();expect(r.model.reasons).toContain("CONFLICTING_DATA");
});
