// @vitest-environment node
import { describe,it,expect,vi } from "vitest";
vi.mock("server-only",()=>({}));
const runtimeClock=vi.hoisted(()=>({value:"2026-10-04T09:00:00.000Z"}));
vi.mock("../../app/server/runtime",()=>({runtime:{clock:{now:()=>runtimeClock.value}}}));
import { currentServices } from "../../app/server/current";
import { m68System,NOW } from "../fixtures/m68";
import { projectAllocation } from "@/domain/portfolio/allocation-projection";
import { buy,P,reversal } from "../fixtures/portfolio/history";
import { securityId,watermark } from "@/domain/portfolio/values";
import { instant,dateOnly } from "@/shared/time";
import { currentSourceSchema,reviewIntentSchema } from "@/shared/validation/current-source";
import { LocalCurrentSource } from "@/infrastructure/current-source";
import { ScoringEngine } from "@/application/scoring/engine";
import { writeFileSync,mkdirSync } from "node:fs";
import path from "node:path";
const intent={type:"MONTHLY_DCA" as const,requestedDate:"2026-10-04",contributionReference:"m68-contribution",eventReference:null};
function plan(x:Awaited<ReturnType<typeof m68System>>){
 const d=x.bases[0],s=d.input.assessment.sizing;
 const lot={securityId:d.securityId,sector:d.input.scorecard.reference.sector!,quantity:s.boardLot,price:s.price,fees:s.fees};
 return {id:"m68-marginal-A",baseDecisionIds:[d.id],evidenceCutoff:NOW,frames:[[],[lot],[lot,lot]].map(lots=>({projection:projectAllocation(x.context,lots),candidates:[{decisionId:d.id,assessment:d.input.assessment,evidence:d.input.evidence}]}))};
}
describe("M6.8 formal end-to-end authority chain (disposable test evidence)",()=>{
 it("A: contribution, cash-only current state, excluded formal universe and HOLD CASH never buy",async()=>{
  const x=await m68System(false);try{
   const before=await x.current.capture(P);expect(before.model.nav).toBe("100000000");expect(before.snapshot?.state.positions).toEqual([]);
   expect(x.ranking.entries).toEqual([]);const result=await x.initiation.create(P,intent);expect(result.status).toBe("READY");
   const review=await x.reviews.find(result.artifactId!);expect(review?.proposal?.outcome).toBe("HOLD CASH");expect(review?.proposal?.unallocatedCash).toBe("100000000");
   expect(await x.db.client.ledgerTransaction.count()).toBe(1);expect((await x.current.capture(P)).snapshot?.state).toEqual(before.snapshot?.state);
  }finally{await x.db.close();}
 });
 it("B/G/U/Q/S: score → BUY → persisted marginal lots → review/proposal → explicit ledger → reconstruction/reversal; history survives",async()=>{
  const x=await m68System();try{
   expect(x.bases[0].decisionState).toBe("BUY");expect(x.ranking.entries[0].securityId).toBe(x.bases[0].securityId);
   const m=await x.marginalEngine.create(plan(x));expect(m.steps.map(s=>s.result)).toEqual(["AUTHORIZED","AUTHORIZED","HOLD CASH"]);expect(m.finalProjection.context.executableCash).toBe("96000000");x.setMarginalIds([m.id]);
   expect((await x.initiation.preview(P,intent)).status).toBe("READY");expect(await x.db.client.workflowReview.count()).toBe(0);
   const response=await x.initiation.create(P,intent),r=await x.reviews.find(response.artifactId!);expect(r?.proposal?.items.map(i=>i.quantity)).toEqual(["100","100"]);expect(r?.proposal?.unallocatedCash).toBe("96000000");expect(r?.command.marginalAllocationId).toBe(m.id);expect(r?.proposal?.rationale).toEqual(m.steps[2].reasons);
   expect(await x.db.client.ledgerTransaction.count()).toBe(1);expect((await x.current.capture(P)).snapshot?.state.positions).toEqual([]);
   const before={decision:await x.decisions.find(x.bases[0].id),marginal:await x.marginal.find(m.id),review:await x.reviews.find(r!.id)};
   await x.accounting.post([buy("m68-explicit-trade","100","2000000",2,{securityId:securityId(x.bases[0].securityId),price:"20000",tradeDate:dateOnly("2026-01-02")})],watermark("1"));
   const state=await x.accounting.reconstruct(P,NOW);expect(state.positions[0]).toMatchObject({quantity:"100",openCost:"2000000"});expect(state.payables).toBe("2000000");expect((await x.current.capture(P)).model.actionability).toBe("BLOCKED");
   await x.accounting.reverse({...reversal("m68-reversal","m68-explicit-trade",3),type:"REVERSAL"},watermark("2"));
   const corrected=await x.accounting.reconstruct(P,NOW);expect(corrected.positions.filter(p=>p.quantity!=="0")).toEqual([]);expect(corrected.payables).toBe("0");expect(corrected.cash).toBe("100000000");expect(await x.db.client.ledgerTransaction.count()).toBe(3);
   expect({decision:await x.decisions.find(x.bases[0].id),marginal:await x.marginal.find(m.id),review:await x.reviews.find(r!.id)}).toEqual(before);
  }finally{await x.db.close();}
 });
 it("ambiguous, mismatched, missing and tampered marginal authority never falls back to an allocation",async()=>{
  const x=await m68System();try{
   const m=await x.marginalEngine.create(plan(x));
   x.setMarginalIds([m.id,"another"]);expect((await x.initiation.create(P,intent)).reasons).toEqual(["AMBIGUOUS_MARGINAL_AUTHORITY"]);
   x.setMarginalIds(["missing"]);expect((await x.initiation.create(P,intent)).reasons).toEqual(["CURRENT_MARGINAL_AUTHORITY_REQUIRED"]);
   x.setMarginalIds([m.id]);await x.db.client.$executeRawUnsafe("DROP TRIGGER marginal_no_update");await x.db.client.marginalAllocation.update({where:{id:m.id},data:{bodyHash:"tampered"}});
   await expect(x.initiation.create(P,intent)).rejects.toThrow();expect(await x.db.client.workflowReview.count()).toBe(0);expect(await x.db.client.ledgerTransaction.count()).toBe(1);
  }finally{await x.db.close();}
 });
 it("later calculations use issuance cutoff; retry preserves time and revised proposal supersedes history",async()=>{
  const x=await m68System(true,60000);try{
   const file=path.join(x.db.directory,"delayed-current.json");writeFileSync(file,JSON.stringify(x.source));vi.stubEnv("VN30_CURRENT_SOURCE_FILE",file);
   runtimeClock.value="2026-10-04T09:01:00.000Z";x.setNow(runtimeClock.value);
   const service=currentServices(x.db.client).reviews;
   const first=await service.create(P,intent);expect(first.status).toBe("READY");const original=await x.reviews.find(first.artifactId!);expect(original?.command.evidenceCutoff).toBe(runtimeClock.value);
   runtimeClock.value="2026-10-04T09:02:00.000Z";x.setNow(runtimeClock.value);
   expect((await service.create(P,intent)).artifactId).toBe(first.artifactId);
   const m=await x.marginalEngine.create({...plan(x),evidenceCutoff:runtimeClock.value});
   const revised=await service.create(P,intent);expect(revised.status).toBe("READY");const r=await x.reviews.find(revised.artifactId!);
   expect(r?.proposal?.items).toHaveLength(2);expect(r?.command.supersedesReviewId).toBe(first.artifactId);expect(r?.proposal?.supersedesProposalId).toBe(original?.proposal?.id);expect(r?.command.marginalAllocationId).toBe(m.id);
   expect(await x.reviews.isSuperseded(first.artifactId!)).toBe(true);expect(await x.reviews.find(first.artifactId!)).toEqual(original);
   runtimeClock.value="2026-10-04T09:03:00.000Z";x.setNow(runtimeClock.value);expect((await service.create(P,intent)).artifactId).toBe(revised.artifactId);
   expect(await x.db.client.workflowReview.count()).toBe(2);expect(await x.db.client.ledgerTransaction.count()).toBe(1);
  }finally{runtimeClock.value=NOW;vi.unstubAllEnvs();await x.db.close();}
 });
 it("production catalog cannot hide a corrupt marginal body by changing its scope before selection",async()=>{
  const x=await m68System();try{
   const m=await x.marginalEngine.create(plan(x));const file=path.join(x.db.directory,"corrupt-catalog.json");writeFileSync(file,JSON.stringify(x.source));vi.stubEnv("VN30_CURRENT_SOURCE_FILE",file);
   await x.db.client.$executeRawUnsafe("DROP TRIGGER marginal_no_update");
   await x.db.client.marginalAllocation.update({where:{id:m.id},data:{body:JSON.stringify({...m,scope:"SYNTHETIC_TEST"})}});
   await expect(currentServices(x.db.client).reviews.create(P,intent)).rejects.toThrow();
   expect(await x.db.client.workflowReview.count()).toBe(0);expect(await x.db.client.ledgerTransaction.count()).toBe(1);
  }finally{vi.unstubAllEnvs();await x.db.close();}
 });
 it("production server composition resolves persisted marginal authority without browser input",async()=>{
  const x=await m68System();try{
   const m=await x.marginalEngine.create(plan(x));const file=x.db.directory+"/source.json";writeFileSync(file,JSON.stringify(x.source));vi.stubEnv("VN30_CURRENT_SOURCE_FILE",file);
   const service=currentServices(x.db.client).reviews;expect((await service.preview(P,intent)).status).toBe("READY");
   const response=await service.create(P,intent),review=await x.reviews.find(response.artifactId!);expect(review?.command.marginalAllocationId).toBe(m.id);expect(review?.proposal?.items).toHaveLength(2);expect(await x.db.client.ledgerTransaction.count()).toBe(1);
   await x.marginalEngine.create({...plan(x),id:"second-authority"});expect((await service.create(P,intent)).reasons).toEqual(["AMBIGUOUS_MARGINAL_AUTHORITY"]);expect(await x.db.client.workflowReview.count()).toBe(1);
  }finally{vi.unstubAllEnvs();await x.db.close();}
 });
 it("security: all injected authority and lineage fields fail before a review write",async()=>{
  const x=await m68System(false);try{
   for(const field of ["cash","quantity","costBasis","nav","marketPrice","score","rank","decisionState","riskPass","methodologyApproval","freshness","reconciliation","candidatePriority","authorizedQuantity","allocationOutcome","reviewDisposition","transactionAmount","artifactId","bodyHash","version","asOf","evidenceCutoff","methodologyId","snapshotId","decisionIds","reviewId","proposalId","marginalAllocationId"]){
    const forged={...intent,[field]:"FORGED"};expect(reviewIntentSchema.safeParse(forged).success).toBe(false);await expect(x.initiation.create(P,forged)).rejects.toThrow();
   }
   expect(await x.db.client.workflowReview.count()).toBe(0);expect(await x.db.client.ledgerTransaction.count()).toBe(1);
  }finally{await x.db.close();}
 });
 it("fresh/populated M6.7 database: repeated deploy/status preserves all rows and historical replay",async()=>{
  const x=await m68System();try{
   const m=await x.marginalEngine.create(plan(x));x.setMarginalIds([m.id]);const r=await x.initiation.create(P,intent);
   const rows=async()=>({transactions:await x.db.client.ledgerTransaction.findMany(),methods:await x.db.client.methodologyRecord.findMany(),cards:await x.db.client.analyticalArtifact.findMany(),decisions:await x.db.client.decisionArtifact.findMany(),marginal:await x.db.client.marginalAllocation.findMany(),reviews:await x.db.client.workflowReview.findMany(),proposals:await x.db.client.workflowProposal.findMany()});
   const before=await rows(),state=await x.accounting.reconstruct(P,NOW),review=await x.reviews.find(r.artifactId!);
   for(let run=0;run<2;run++){expect(x.db.migration("migrate")).toBe(0);expect(x.db.migration("status")).toBe(0);expect(await rows()).toEqual(before);expect(await x.accounting.reconstruct(P,NOW)).toEqual(state);expect(await x.reviews.find(r.artifactId!)).toEqual(review);expect(await x.marginal.find(m.id)).toEqual(m);expect(await x.decisions.find(x.bases[0].id)).toEqual(x.bases[0]);}
  }finally{await x.db.close();}
 });
 it("adapter failures and future source times block formal action without fallback",async()=>{
  const x=await m68System(false);try{
   const file=x.db.directory+"/source.json",provider=new LocalCurrentSource(file);
   await expect(provider.load(P)).rejects.toThrow();writeFileSync(file,"{malformed");await expect(provider.load(P)).rejects.toThrow();
   writeFileSync(file,JSON.stringify({...x.source,nav:"999"}));await expect(provider.load(P)).rejects.toThrow();
   expect(currentSourceSchema.safeParse({...x.source,prices:[{...x.source.prices[0],price:"NaN"}]}).success).toBe(false);
   x.source.receivedAt="2026-10-05T09:00:00.000Z";await expect(x.current.capture(P)).rejects.toThrow();
   x.source.receivedAt=NOW;x.source.prices[0].observedAt="2026-10-05T09:00:00.000Z";await expect(x.current.capture(P)).rejects.toThrow();
   expect(await x.db.client.workflowReview.count()).toBe(0);
  }finally{await x.db.close();}
 });
 it("concurrent/repeated monthly initiation is idempotent and never changes accounting",async()=>{
  const x=await m68System();try{
   const m=await x.marginalEngine.create(plan(x));x.setMarginalIds([m.id]);const responses=await Promise.allSettled([x.initiation.create(P,intent),x.initiation.create(P,intent)]);expect(responses.filter(r=>r.status==="fulfilled").length).toBeGreaterThan(0);
   const r=await x.initiation.create(P,intent);expect(r.status).toBe("READY");expect(await x.db.client.workflowReview.count()).toBe(1);expect(await x.db.client.workflowProposal.count()).toBe(1);expect(await x.db.client.ledgerTransaction.count()).toBe(1);expect((await x.accounting.reconstruct(P,instant(NOW))).cash).toBe("100000000");
  }finally{await x.db.close();}
 });
 it("V: corrected dataset B creates a new score and current context without rewriting decision A",async()=>{
  const x=await m68System();try{
   const original=x.bases[0],saved=JSON.stringify(await x.decisions.find(original.id));
   const input=structuredClone(original.input.scorecard.input);
   const revised=await new ScoringEngine(x.db.registry,x.analytical).score({...input,id:"m68-corrected-score-B",priorScorecardId:original.lineage.scorecardId,revisionReason:"TEST ONLY dataset B correction",evidence:input.evidence.map(e=>({...e,version:"corrected-dataset-B"}))});
   x.source.version="m68-prices-B";x.source.prices[0].revision="B";x.source.prices[0].price="21000";
   const current=await x.current.context(P);expect(current.model.sourceVersion).toBe("m68-prices-B");expect(current.context?.integrity.snapshotId).not.toBe(original.lineage.snapshotId);
   expect(revised.input.evidence[0].version).toBe("corrected-dataset-B");expect(JSON.stringify(await x.decisions.find(original.id))).toBe(saved);expect(await x.analytical.find(original.lineage.scorecardId)).toEqual(original.input.scorecard);
   expect((await x.initiation.create(P,intent)).reasons).toEqual(["CURRENT_FORMAL_RANKING_REQUIRED"]);expect(await x.db.client.ledgerTransaction.count()).toBe(1);
  }finally{await x.db.close();}
 });
 it("performance sanity: current reads at 30 holdings preserve exact NAV and record local latency",async()=>{
  const x=await m68System(false);try{
   for(const [index,p] of x.source.prices.entries())await x.accounting.post([buy(`m68-scale-${index}`,"100","2000000",2,{securityId:securityId(p.securityId),price:"20000"})],watermark(String(index+1)));
   const state=await x.accounting.reconstruct(P,NOW);x.source.ledgerWatermark="31";x.source.reconciliation!.positions=state.positions.map(p=>({securityId:p.securityId,quantity:p.quantity,openCost:p.openCost}));x.source.reconciliation!.payables=state.payables;
   const times=[];for(let n=0;n<5;n++){const start=performance.now();const capture=await x.current.capture(P);times.push(performance.now()-start);expect(capture.model.actionability).toBe("PASS");expect(capture.model.nav).toBe("100000000");expect(capture.model.positions).toHaveLength(30);}
   const measurement={profile:"VN30 30 holdings / 31 immutable ledger events",currentReadMilliseconds:times,meanMilliseconds:times.reduce((a,b)=>a+b,0)/times.length,ledgerReadsPerCaptureFromSourceAudit:5,limitation:"full-history reconstruction; measurements are local, not an SLA"};
   console.log(JSON.stringify(measurement));
   if(process.env.VN30_VALIDATION_VISUAL_DIRECTORY){const directory=path.dirname(process.env.VN30_VALIDATION_VISUAL_DIRECTORY);mkdirSync(directory,{recursive:true});writeFileSync(path.join(directory,"performance.json"),JSON.stringify(measurement,null,2)+"\n");}
  }finally{await x.db.close();}
 });
});
