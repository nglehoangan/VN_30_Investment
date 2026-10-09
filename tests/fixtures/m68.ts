import { createHash } from "node:crypto";
import { testDatabase } from "./database";
import { fixture, ASOF, IDS } from "./scoring";
import { monotonicDecision } from "./decision";
import { methodologyFixture } from "./methodology";
import { deposit, method, P, W0 } from "./portfolio/history";
import { ACCOUNTING_METHOD, securityId } from "@/domain/portfolio/values";
import { methodologyId } from "@/shared/ids";
import { instant } from "@/shared/time";
import { initializePortfolio } from "@/application/portfolio/initialize";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { calculateScorecard } from "@/domain/scoring/scorecard";
import { rankScorecards } from "@/domain/ranking/rank";
import { seedHistoricalScorecard, seedHistoricalRanking } from "./historical-scorecard";
import { DecisionEngine } from "@/application/decision/engine";
import { MarginalDecisionEngine } from "@/application/decision/marginal";
import { CurrentReadService } from "@/application/current/read-model";
import { ReviewInitiationService, type ReviewCatalog } from "@/application/current/review-initiation";
import { PrismaPortfolioSetup, PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import { PrismaAnalyticalArtifacts } from "@/infrastructure/repositories/analytical-artifacts";
import { PrismaDecisionArtifacts } from "@/infrastructure/repositories/decision-artifacts";
import { PrismaMarginalArtifacts } from "@/infrastructure/repositories/marginal-artifacts";
import { PrismaWorkflowArtifacts } from "@/infrastructure/repositories/workflow-artifacts";
import { currentSourceSchema, type CurrentSource } from "@/shared/validation/current-source";
import { WEEKLY_AREAS } from "@/domain/workflow/reviews";
import type { Decision } from "@/domain/decision/engine";
export const NOW = instant("2026-10-04T09:00:00.000Z");
const validThrough = "2026-10-05T09:00:00.000Z";
/** Formal-path governance fixtures exist ONLY in disposable databases; never real-data approval. */
export async function m68System(qualified = true, analysisDelayMs = 0) {
  const db = await testDatabase();
  try {
    let currentTime = NOW; const clock = {now: () => currentTime};
    await db.registry.append({...methodologyFixture(method), family:"ACCOUNTING", governanceStatus:"APPROVED",intendedUse:"PRODUCTION",approvalReference:"TEST ONLY formal-path fixture",implementationIdentity:ACCOUNTING_METHOD});
    await initializePortfolio(new PrismaPortfolioSetup(db.client), {id:P,name:"M6.8 TEST ONLY",currency:"VND",inceptionAt:instant("2026-01-01T00:00:00.000Z"),createdAt:NOW}, IDS.map(id=>({id:securityId(id),name:"TEST ONLY"})));
    const ledger = new PrismaPortfolioLedger(db.client), accounting = new PortfolioEngine(ledger,clock);
    await accounting.post([deposit("m68-contribution","100000000")],W0);
    currentTime=instant(new Date(Date.parse(NOW)+analysisDelayMs).toISOString());
    const inputs = IDS.map((_,index)=>{
      const f = JSON.parse(JSON.stringify(fixture(index)).replaceAll(ASOF,NOW)) as ReturnType<typeof fixture>;
      return {...f,calculatedAt:currentTime,artifactScope:"FORMAL" as const,methodology:{...f.methodology,family:"SCORING",governanceStatus:"APPROVED" as const,intendedUse:"PRODUCTION" as const,approvalReference:"TEST ONLY scoring governance"},evidence:f.evidence.map(e=>({...e,validThrough})),confidence:{...f.confidence,level:qualified&&index===0?"HIGH" as const:"LOW" as const}};
    });
    const source:CurrentSource={version:"m68-prices-A",portfolioId:P,scope:"FORMAL",asOf:NOW,receivedAt:NOW,ledgerWatermark:"1",taxonomy:inputs[0].reference.taxonomy,valuationMethodologyId:"m63-valuation-v1",prices:IDS.map(id=>({id:`quote-${id}`,securityId:id,price:"20000",currency:"VND",observedAt:NOW,receivedAt:NOW,validThrough,sourceReference:"TEST ONLY quote",provider:"TEST ONLY",revision:"A",quality:"VALID",policyReference:"TEST ONLY external validity",adjustment:"RAW"})),references:{...inputs[0].reference.data,intervals:[...inputs[0].reference.data.intervals]},referenceAsOf:NOW,referenceValidThrough:validThrough,referencePolicy:"TEST ONLY",reconciliation:{id:"m68-reconciliation",portfolioId:P,asOf:NOW,receivedAt:NOW,sourceReference:"TEST ONLY independent statement",cash:"100000000",positions:[],receivables:"0",payables:"0",unresolvedDiscrepancy:false},analyst:{version:"m68-analyst-A",reviewer:"TEST ONLY human",asOf:NOW,receivedAt:NOW,validThrough,sourceReference:"TEST ONLY",evidence:[{id:"review-evidence",source:"TEST ONLY",asOf:NOW,receivedAt:NOW,validThrough,classification:"FACT",summary:"Independent statement and underwriting review"}],sections:WEEKLY_AREAS.map(area=>({area,securityId:null,evidenceRefs:["review-evidence"],finding:"UNCHANGED",rationale:"TEST ONLY reviewed"})),theses:[],triggers:[],nextReview:"Next scheduled or material review",governance:null}};
    const current = new CurrentReadService(ledger,{load:async()=>currentSourceSchema.parse(source)},clock);
    const captured = await current.context(P); if(!captured.context) throw new Error("M68 fixture integrity blocked");
    const context = captured.context;
    const read = {read:async()=>context,isCurrent:async()=>JSON.stringify((await current.context(P)).context)===JSON.stringify(context)};
    const analytical = new PrismaAnalyticalArtifacts(db.client), decisions = new PrismaDecisionArtifacts(db.client), marginal = new PrismaMarginalArtifacts(db.client), reviews = new PrismaWorkflowArtifacts(db.client);
    // Downstream M6.8 regressions retain pre-Slice06 upstream artifacts. No new scoring activation/DI claim.
    await db.registry.append(inputs[0].methodology);
    const cards=inputs.map(calculateScorecard);for(const card of cards)await seedHistoricalScorecard(db.client,card);
    const ranking=rankScorecards({id:"m68-ranking-A",asOf:NOW,calculatedAt:currentTime,cards,universe:{referenceVersion:source.references.version,securityIds:IDS,complete:true},portfolio:context.integrity,requiredReturnAssessments:qualified?[{securityId:IDS[0],assessment:{owner:"M4",methodologyId:"TEST-ONLY-required-return",asOf:NOW,evaluatedAt:NOW,status:"PASS",evidenceRefs:["TEST ONLY"],expectedReturn:"0.16",requiredReturn:"0.15",hurdleMet:true,exceptionApplied:false}}]:[]});await seedHistoricalRanking(db.client,ranking);
    const bases:Decision[]=[];
    if(qualified){
      const i=JSON.parse(JSON.stringify(monotonicDecision()).replaceAll("2026-10-01T09:00:00.000Z",NOW)) as ReturnType<typeof monotonicDecision>;
      // Keep the exact approved M6.5.3 metadata; only upstream test approvals are simulated.
      const original=monotonicDecision();i.methods.decision=original.methods.decision;i.methods.requiredReturn=original.methods.requiredReturn;
      for(const key of ["risk","stage0"] as const)i.methods[key]={...i.methods[key],methodologyId:methodologyId(`m68-test-${key}`),implementationIdentity:`m68-test-${key}`,family:key.toUpperCase(),governanceStatus:"APPROVED",intendedUse:"PRODUCTION",approvalReference:"TEST ONLY formal-path approval"};
      for(const m of Object.values(i.methods))if(!(await db.registry.findById(m.methodologyId)))await db.registry.append(m);
      i.assessment.stage0.methodologyId=i.methods.stage0.methodologyId;i.scope="FORMAL";i.knownAt=currentTime;i.id="m68-decision-A";i.assessment.sizing.fees="0";i.assessment.sizing.economicTargetUpper="0.04";i.evidence[0].validThrough=validThrough;
      const {portfolio:_p,scorecard:_s,ranking:_r,comparatorScorecards:_c,recordedAt:_t,...command}=i;void _p;void _s;void _r;void _c;void _t;
      bases.push(await new DecisionEngine(db.registry,analytical,decisions,read,clock).create({...command,scorecardId:cards[0].id,rankingId:ranking.id,comparatorScorecardIds:[]}));
    }
    let marginalIds:readonly string[]=[];
    const catalog:ReviewCatalog={candidates:async()=>({decisionIds:bases.map(d=>d.id),rankingId:ranking.id}),marginalCandidates:async()=>marginalIds};
    const initiation=new ReviewInitiationService(current,ledger,reviews,decisions,analytical,db.registry,clock,catalog,s=>`m68-review-${createHash("sha256").update(s).digest("hex")}`,marginal);
    const marginalEngine=new MarginalDecisionEngine(marginal,decisions,analytical,db.registry,read,clock);
    return {setNow:(value:string)=>{currentTime=instant(value);},db,clock,source,ledger,accounting,current,context,analytical,decisions,marginal,reviews,ranking,bases,initiation,marginalEngine,setMarginalIds:(ids:readonly string[])=>{marginalIds=ids;}};
  }catch(error){await db.close();throw error;}
}
