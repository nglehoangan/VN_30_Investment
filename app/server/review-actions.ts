"use server";
import "server-only";
import { reviewIntentSchema } from "@/shared/validation/current-source";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { loadDatabaseConfig } from "@/infrastructure/config/database";
import { openDatabase } from "@/infrastructure/db/client";
import { existingDatabase } from "@/infrastructure/dashboard-support";
import { currentServices } from "./current";
import { assertLocalOrigin } from "./manual-transactions";
import type { ReviewResponse } from "@/application/current/review-initiation";
export async function initiateReview(mode:"preview"|"create",intent:unknown):Promise<ReviewResponse>{
 let client;try{
 intent=reviewIntentSchema.parse(intent);
 const h=await headers();assertLocalOrigin(h.get("origin"),h.get("host"));
 const config=loadDatabaseConfig(process.env,process.cwd());if(!existingDatabase(config.filePath))throw new Error("UNAVAILABLE");
 client=await openDatabase(config);const portfolios=await client.portfolio.findMany({take:2,select:{id:true}});if(portfolios.length!==1)throw new Error("UNAVAILABLE");
 const service=currentServices(client).reviews;
 if(mode==="preview")return await service.preview(portfolios[0].id,intent);
 if(mode!=="create")throw new Error("INVALID_INTENT");
 const result=await service.create(portfolios[0].id,intent);if(result.artifactId)revalidatePath("/","layout");return result;
 }catch{return {status:"BLOCKED",reasons:["Invalid intent, unavailable authoritative inputs, or conflicting source state. Inspect data status and retry readiness."],portfolio:"BLOCKED",marketData:"UNKNOWN",analystEvidence:"INPUT REQUIRED",type:null};}
 finally{await client?.$disconnect();}
}
