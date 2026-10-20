import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {DependencyRegistry} from '@/ports/dependencies';
import type {Release,Publication} from '@/domain/dependencies/contracts';
import {PROJECTION_ID} from '@/domain/dependencies/contracts';
import {readRelease,readPublication,ref,head} from '@/domain/dependencies/validation';
import type {Pin} from '@/domain/market-boundary/contracts';
import {requireBoundary as check,same} from '@/domain/market-boundary/validation';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
export class PrismaDependencyRegistry implements DependencyRegistry {
 constructor(private readonly db:PrismaClient){}
 async current(){const p=await this.db.marketBoundaryDependencyHead.findUnique({where:{id:PROJECTION_ID}});if(!p)return null;const r=await this.db.dependencyRelease.findUnique({where:{bodyHash:p.bodyHash}});check(r,'UNKNOWN_HEAD');return this.find({id:r.id,hash:r.bodyHash});}
 async find(pin:Pin){const row=await this.db.dependencyRelease.findUnique({where:{id:pin.id}});check(row&&row.bodyHash===pin.hash,'UNKNOWN_HEAD_OR_HASH_MISMATCH');const r=readRelease(JSON.parse(row.body),hash);check(same(ref(r),pin)&&canonicalJson(r)===row.body&&r.recordedAt===row.recordedAt&&r.supersedes?.id=== (row.supersedesId??undefined),'RELEASE_INDEX_MISMATCH');return r;}
 async activate(release:Release,expected:Pin|null){readRelease(release,hash);check(same(release.supersedes,expected),'CAS_EXPECTATION_BINDING');
  await this.db.$transaction(async tx=>{
   const p=await tx.marketBoundaryDependencyHead.findUnique({where:{id:PROJECTION_ID}});
   check(expected?p?.bodyHash===expected.hash:!p,'CAS_CONFLICT');
   if(expected){const old=await tx.dependencyRelease.findUnique({where:{id:expected.id}});check(old?.bodyHash===expected.hash,'CAS_CONFLICT');}
   for(const h of release.heads){const key=hash({type:h.type,id:h.pin.id}),old=await tx.dependencyObjectIdentity.findUnique({where:{key}});if(old)check(old.bodyHash===h.pin.hash,'HEAD_ID_CONTENT_CHANGED');else await tx.dependencyObjectIdentity.create({data:{key,type:h.type,objectId:h.pin.id,bodyHash:h.pin.hash}});}
   for(const h of release.heads.filter(h=>h.scheme==='BOUNDARY')){const record=h.content as import('@/domain/market-boundary/contracts').Sealed;const existing=await tx.marketBoundaryRecord.findUnique({where:{id:record.id}});if(existing)check(existing.bodyHash===record.contentHash&&existing.body===canonicalJson(record),'HEAD_OBJECT_CONTENT_CHANGED');else await tx.marketBoundaryRecord.create({data:{id:record.id,kind:record.kind,contractVersion:record.contractVersion,createdAt:record.createdAt,body:canonicalJson(record),bodyHash:record.contentHash}});}
   await tx.dependencyRelease.create({data:{id:release.id,body:canonicalJson(release),bodyHash:release.contentHash,recordedAt:release.recordedAt,supersedesId:expected?.id??null}});
   if(expected){const result=await tx.marketBoundaryDependencyHead.updateMany({where:{id:PROJECTION_ID,bodyHash:expected.hash},data:{bodyHash:release.contentHash,updatedAt:release.recordedAt}});check(result.count===1,'CAS_CONFLICT');}
   else await tx.marketBoundaryDependencyHead.create({data:{id:PROJECTION_ID,bodyHash:release.contentHash,updatedAt:release.recordedAt}});
  });
 }
 async publish(p:Publication,expected:Pin,now:()=>string){readPublication(p,hash);check(same(p.decisionRelease??p.analysisRelease,expected),'PUBLICATION_RELEASE_BINDING');
  await this.db.$transaction(async tx=>{
   const projection=await tx.marketBoundaryDependencyHead.findUnique({where:{id:PROJECTION_ID}});check(projection?.bodyHash===expected.hash,'DEPENDENCY_CHANGED_AT_PUBLICATION');
   const row=await tx.dependencyRelease.findUnique({where:{id:expected.id}});check(row?.bodyHash===expected.hash,'UNKNOWN_HEAD');const release=readRelease(JSON.parse(row.body),hash);
   const record=p.snapshot;const pin=(x:{id:string;hash:string})=>({id:x.id,hash:x.hash});
   check(same(record.body.initialization,head(release.heads,'INITIALIZATION').pin)&&same(pin(record.body.policy),head(release.heads,'POLICY').pin)&&same(pin(record.body.scoringModel),head(release.heads,'SCORING_MODEL').pin),'CALLER_SELECTED_STALE_HEAD');
   check(record.body.engineVersion===(record.kind==='ANALYSIS'?(head(release.heads,'SCORING_MODEL').content as {implementationIdentity:string}).implementationIdentity:head(release.heads,'DECISION_ENGINE').contract),'INCOMPATIBLE_DEPENDENCY_SET');
   if(record.body.market)check(same(record.body.market,head(release.heads,'MARKET').pin),'CALLER_SELECTED_STALE_HEAD:MARKET');
   if(record.kind==='DECISION'){
    const portfolio=release.heads.find(h=>h.type==='PORTFOLIO');check(portfolio,'MISSING_HEAD:PORTFOLIO');
    const body=(portfolio.content as {body:{portfolioSnapshotId:string;ledgerWatermark:string}}).body;
    // Watermark is re-read inside the same SQLite write transaction, never a caller-selected cached pin.
    check(portfolio.ownerId,'MISSING_PORTFOLIO_OWNER');const ledger=await tx.portfolio.findUnique({where:{id:portfolio.ownerId}});check(ledger?.revision===body.ledgerWatermark,'PORTFOLIO_CHANGED_AT_PUBLICATION');
    const analysis=await tx.productionDependencyPublication.findFirst({where:{recordId:record.body.analysis.id,kind:'ANALYSIS'}});check(analysis&&analysis.releaseHash===p.analysisRelease.hash,'ACCEPTED_PRODUCTION_ANALYSIS_REQUIRED');
    check(['NEW_CAPITAL','DCA','EXECUTION'].includes(record.body.freshness.purpose),'DECISION_PURPOSE_NOT_QUALIFIED');
   }
   const freshness=record.body.freshness;
   check(record.kind==='ANALYSIS'&&record.body.marketRequirement==='MARKET_DATA_NOT_REQUIRED'||freshness.status==='PASS'&&freshness.eligibleUntil!==null&&now()<=freshness.eligibleUntil,'EXPIRED_MARKET_AT_PUBLICATION');
   await tx.marketBoundaryRecord.create({data:{id:record.id,kind:record.kind,contractVersion:record.contractVersion,createdAt:record.createdAt,body:canonicalJson(record),bodyHash:record.contentHash}});
   if(record.kind==='DECISION')await tx.marketBoundaryDecisionSeal.create({data:{decisionId:record.body.decisionId,recordId:record.id,dependencyId:PROJECTION_ID,dependencyHash:expected.hash}});
   await tx.productionDependencyPublication.create({data:{id:p.id,kind:p.kind,recordId:record.id,releaseHash:expected.hash,body:canonicalJson(p),bodyHash:p.contentHash}});
   check(record.kind==='ANALYSIS'&&record.body.marketRequirement==='MARKET_DATA_NOT_REQUIRED'||freshness.eligibleUntil!==null&&now()<=freshness.eligibleUntil,'EXPIRED_MARKET_AT_PUBLICATION');
  });
 }
 async publication(pin:Pin){const row=await this.db.productionDependencyPublication.findUnique({where:{id:pin.id}});check(row&&row.bodyHash===pin.hash,'UNKNOWN_PUBLICATION');const p=readPublication(JSON.parse(row.body),hash);check(same(ref(p),pin)&&p.snapshot.id===row.recordId&&p.kind===row.kind&&canonicalJson(p)===row.body,'PUBLICATION_INDEX_BINDING');const record=await this.db.marketBoundaryRecord.findUnique({where:{id:p.snapshot.id}});check(record?.bodyHash===p.snapshot.contentHash&&record.body===canonicalJson(p.snapshot),'PUBLICATION_RECORD_HASH');await this.find(p.analysisRelease);if(p.decisionRelease)await this.find(p.decisionRelease);return p;}
}
