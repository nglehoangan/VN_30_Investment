import { createHash } from "node:crypto";
import type { PrismaClient } from "@/infrastructure/db/generated/client";
import type { Scorecard } from "@/domain/scoring/scorecard";
import type { Ranking } from "@/domain/ranking/rank";
import type { AnalyticalArtifacts } from "@/ports/scoring";
import { ConflictError, DataIntegrityError } from "@/shared/errors";
import { check, id, snapshot } from "@/domain/scoring/validation";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { instant } from "@/shared/time";
const hash=(body:string)=>createHash("sha256").update(body).digest("hex");
/** Serialization and checksum integrity only. No metric, score, category or ranking computation. */
export class PrismaAnalyticalArtifacts implements AnalyticalArtifacts {
  constructor(private readonly client:PrismaClient){}
  async append(artifact:Scorecard|Ranking){
    check(Object.isFrozen(artifact)&&Object.isFrozen(artifact.input),"IMMUTABLE_DOMAIN_ARTIFACT_REQUIRED");
    const result=snapshot(artifact),score="totalScore" in result;
    id(result.id);instant(result.asOf);instant(result.calculatedAt);
    const method=score?result.methodology.methodologyId:result.input.cards[0]?.methodology.methodologyId;
    check(method,"RANKING_METHODOLOGY_REQUIRED");const body=JSON.stringify(result);
    try {await this.client.analyticalArtifact.create({data:{id:result.id,kind:score?"SCORECARD":"RANKING",methodologyId:method,asOf:result.asOf,calculatedAt:result.calculatedAt,body,bodyHash:hash(body)}});}
    catch(error){if(error&&typeof error==="object"&&"code" in error&&error.code==="P2002")throw new ConflictError();throw new DataIntegrityError({cause:error});}
  }
  async find(key:string){
    id(key);const row=await this.client.analyticalArtifact.findUnique({where:{id:key}});if(!row)return null;
    try {
      check(hash(row.body)===row.bodyHash,"ARTIFACT_CHECKSUM_MISMATCH");
      const result=snapshot(JSON.parse(row.body)) as Scorecard|Ranking;
      const score="totalScore" in result;
      check(result.id===row.id&&result.asOf===row.asOf&&result.calculatedAt===row.calculatedAt&&row.kind===(score?"SCORECARD":"RANKING"),"ARTIFACT_METADATA_MISMATCH");
      check(row.methodologyId===(score?result.methodology.methodologyId:result.input.cards[0]?.methodology.methodologyId),"ARTIFACT_METHOD_MISMATCH");return deepFreeze(result);
    }catch(error){throw new DataIntegrityError({cause:error});}
  }
}
