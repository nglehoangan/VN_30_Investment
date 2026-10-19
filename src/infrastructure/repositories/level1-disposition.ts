import type {PrismaClient} from '@/infrastructure/db/generated/client';
import {validateLevel1Disposition,level1AnalyticalContext,assertLevel1Action,type Level1DispositionRelease} from '@/domain/fundamentals/level1-disposition';
import type {PolicyBAction} from '@/domain/fundamentals/partial-universe';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {requireFundamental} from '@/domain/fundamentals/validation';
export interface Level1ReleaseBinding {readonly id:string;readonly bodyHash:string;readonly approvalHash:string}
/** A pinned governance release is independently readable while DI acceptance remains blocked. */
export class PrismaLevel1Disposition {
 constructor(private readonly db:PrismaClient,private readonly binding:Level1ReleaseBinding){}
 async append(raw:Level1DispositionRelease){const r=validateLevel1Disposition(raw,snapshotHash);requireFundamental(r.id===this.binding.id&&snapshotHash(r)===this.binding.bodyHash&&r.approvalHash===this.binding.approvalHash,'LEVEL1_APPROVAL_BINDING');
  const existing=await this.db.fundamentalDispositionRelease.findUnique({where:{id:r.id}});if(existing){requireFundamental(existing.bodyHash===this.binding.bodyHash,'LEVEL1_RELEASE_REUSE');return;}
  await this.db.fundamentalDispositionRelease.create({data:{id:r.id,previousRelease:r.previousRelease,approvedAt:r.approvedAt,approvalHash:r.approvalHash,body:canonicalJson(r),bodyHash:snapshotHash(r)}});
 }
 async current(){const row=await this.db.fundamentalDispositionRelease.findUnique({where:{id:this.binding.id}});requireFundamental(row&&row.bodyHash===this.binding.bodyHash&&row.approvalHash===this.binding.approvalHash,'LEVEL1_PINNED_RELEASE_REQUIRED');const r=JSON.parse(row!.body) as Level1DispositionRelease;requireFundamental(snapshotHash(r)===row!.bodyHash&&canonicalJson(r)===row!.body&&r.id===row!.id&&r.previousRelease===row!.previousRelease&&r.approvedAt===row!.approvedAt&&r.approvalHash===row!.approvalHash,'LEVEL1_BODY_INTEGRITY');return validateLevel1Disposition(r,snapshotHash);}
 async context(ticker:string){return level1AnalyticalContext(await this.current(),ticker,snapshotHash);}
 async assertAction(securityId:string,action:PolicyBAction){return assertLevel1Action(await this.current(),securityId,action,snapshotHash);}
}
