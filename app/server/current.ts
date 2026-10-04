import "server-only";
import { reviewIdentity } from "@/infrastructure/dashboard-support";
import type { PrismaClient } from "@/infrastructure/db/generated/client";
import { LocalCurrentSource } from "@/infrastructure/current-source";
import { PrismaPortfolioLedger } from "@/infrastructure/repositories/portfolio-ledger";
import { PrismaWorkflowArtifacts } from "@/infrastructure/repositories/workflow-artifacts";
import { PrismaAnalyticalArtifacts } from "@/infrastructure/repositories/analytical-artifacts";
import { PrismaDecisionArtifacts } from "@/infrastructure/repositories/decision-artifacts";
import { PrismaMethodologyRegistry } from "@/infrastructure/repositories/methodology-registry";
import { CurrentReadService } from "@/application/current/read-model";
import { ReviewInitiationService } from "@/application/current/review-initiation";
import { runtime } from "./runtime";
export function currentServices(client:PrismaClient){
 const ledger=new PrismaPortfolioLedger(client), current=new CurrentReadService(ledger,new LocalCurrentSource(process.env.VN30_CURRENT_SOURCE_FILE),runtime.clock);
 const reviews=new ReviewInitiationService(current,ledger,new PrismaWorkflowArtifacts(client),new PrismaDecisionArtifacts(client),new PrismaAnalyticalArtifacts(client),new PrismaMethodologyRegistry(client),runtime.clock,{candidates:async(asOf)=>{
 const decisions=await client.decisionArtifact.findMany({where:{asOf},take:31,select:{id:true}});
 const rankings=await client.analyticalArtifact.findMany({where:{asOf,kind:"RANKING"},take:2,select:{id:true}});
 if(decisions.length>30||rankings.length!==1)return {decisionIds:[],rankingId:null};
 return {decisionIds:decisions.map(d=>d.id),rankingId:rankings[0].id};
 }},reviewIdentity);
 return {current,reviews};
}
