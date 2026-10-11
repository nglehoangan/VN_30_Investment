import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {HybridAdmissionSnapshot} from '@/domain/fundamentals/hybrid-admission';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {createHash} from 'node:crypto';
import {requireFundamental} from '@/domain/fundamentals/validation';
/** Append-only candidate/canonical run; no portfolio, scoring or old-fact mutation. */
export class PrismaFinancialAdmission {
 constructor(private readonly db:PrismaClient){}
 async append(snapshot:HybridAdmissionSnapshot,previousManualSnapshotId:string,createdAt:string){
  requireFundamental(snapshot.contract==='structured-issuer-verified-current-v1'&&!snapshot.readyForScoring,'ADMISSION_NOT_SCORING_APPROVAL');
  const body=canonicalJson(snapshot),bodyHash=createHash('sha256').update(body).digest('hex');
  const existing=await this.db.fundamentalAdmissionRun.findUnique({where:{id:snapshot.snapshotId}});
  if(existing){requireFundamental(existing.bodyHash===bodyHash&&existing.previousManualSnapshotId===previousManualSnapshotId,'ADMISSION_ID_REUSE');return existing;}
  return this.db.fundamentalAdmissionRun.create({data:{id:snapshot.snapshotId,contentHash:snapshot.contentHash,policyVersion:snapshot.sourcePolicy.version,analysisAt:snapshot.analysisAt,body,bodyHash,previousManualSnapshotId,createdAt}});
 }
 async find(id:string){const row=await this.db.fundamentalAdmissionRun.findUnique({where:{id}});if(!row)return null;requireFundamental(createHash('sha256').update(row.body).digest('hex')===row.bodyHash,'ADMISSION_BODY_INTEGRITY');return JSON.parse(row.body) as HybridAdmissionSnapshot;}
}
