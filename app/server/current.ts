import "server-only";
import { reviewIdentity } from "@/infrastructure/dashboard-support";
import type { PrismaClient } from "@/infrastructure/db/generated/client";
import { LocalCurrentSource } from "@/infrastructure/current-source";
import { PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import { PrismaWorkflowArtifacts } from "@/infrastructure/repositories/workflow-artifacts";
import { PrismaAnalyticalArtifacts } from "@/infrastructure/repositories/analytical-artifacts";
import { PrismaDecisionArtifacts } from "@/infrastructure/repositories/decision-artifacts";
import { PrismaMethodologyRegistry } from "@/infrastructure/repositories/methodology-registry";
import { PrismaMarginalArtifacts } from "@/infrastructure/repositories/marginal-artifacts";
import { CurrentReadService } from "@/application/current/read-model";
import { ReviewInitiationService } from "@/application/current/review-initiation";
import { runtime } from "./runtime";
export function currentServices(client:PrismaClient){
 const ledger=new PrismaPortfolioLedger(client), marginal=new PrismaMarginalArtifacts(client), current=new CurrentReadService(ledger,new LocalCurrentSource(process.env.VN30_CURRENT_SOURCE_FILE),runtime.clock);
 const reviews=new ReviewInitiationService(current,ledger,new PrismaWorkflowArtifacts(client),new PrismaDecisionArtifacts(client),new PrismaAnalyticalArtifacts(client),new PrismaMethodologyRegistry(client),runtime.clock,{candidates:async(asOf)=>{
 const decisions=await client.decisionArtifact.findMany({where:{asOf},take:31,select:{id:true}});
 const rankings=await client.analyticalArtifact.findMany({where:{asOf,kind:"RANKING"},take:2,select:{id:true}});
 if(decisions.length>30||rankings.length!==1)return {decisionIds:[],rankingId:null};
 return {decisionIds:decisions.map(d=>d.id),rankingId:rankings[0].id};
 },marginalCandidates:(snapshotId,cutoff)=>marginal.currentCandidates(snapshotId,cutoff),priorMonthlyReviews:async(portfolioId,snapshotId,excludeId,through)=>{
 const rows=await client.$queryRawUnsafe<{id:string}[]>(
   "SELECT r.id FROM workflow_review r WHERE r.portfolio_id = ? AND r.type = 'MONTHLY_DCA' AND json_extract(r.body, '$.command.snapshotId') = ? AND r.id <> ? AND r.recorded_at <= ? AND NOT EXISTS (SELECT 1 FROM workflow_review n WHERE n.supersedes_id = r.id) ORDER BY r.id LIMIT 2",
   portfolioId,snapshotId,excludeId,through);
 return rows.map(row=>row.id);
 }},reviewIdentity,marginal);
 return {current,reviews};
}
