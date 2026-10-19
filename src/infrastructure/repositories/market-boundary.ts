import type { PrismaClient } from '@/infrastructure/db/generated/client';
import type { Clock } from '@/ports/runtime';
import { systemClock } from '@/infrastructure/runtime';
import type { BoundaryStore, RankingPublication } from '@/ports/market-boundary';
import { rankPolicyB } from '@/domain/ranking/rank';
import type { Kind, Pin, Sealed } from '@/domain/market-boundary/contracts';
import { readSealed, requireBoundary } from '@/domain/market-boundary/validation';
import { canonicalJson } from '@/domain/fundamentals/snapshot';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
export class PrismaBoundaryStore implements BoundaryStore {
  constructor(private readonly db: PrismaClient, private readonly clock: Clock = systemClock) {}
  private data(record: Sealed) { const r=readSealed(record,record.kind,snapshotHash);return {id:r.id,kind:r.kind,contractVersion:r.contractVersion,createdAt:r.createdAt,body:canonicalJson(r),bodyHash:r.contentHash}; }
  async append(record: Sealed) { requireBoundary(record.kind!=='DECISION','DECISION_REQUIRES_ATOMIC_SEAL');await this.db.marketBoundaryRecord.create({data:this.data(record)}); }
  async find<K extends Kind>(pin: Pin, kind: K): Promise<Sealed<K>> {
    const row=await this.db.marketBoundaryRecord.findUnique({where:{id:pin.id}});
    requireBoundary(row&&row.bodyHash===pin.hash&&row.kind===kind,'PINNED_SNAPSHOT_REQUIRED');
    const record=readSealed(JSON.parse(row.body),kind,snapshotHash);
    requireBoundary(record.id===row.id&&record.contentHash===row.bodyHash&&record.createdAt===row.createdAt&&record.contractVersion===row.contractVersion&&canonicalJson(record)===row.body,'SNAPSHOT_INDEX_BINDING');
    if(record.kind==='DECISION'){
      const seal=await this.db.marketBoundaryDecisionSeal.findUnique({where:{recordId:record.id}});
      requireBoundary(seal&&seal.decisionId===record.body.decisionId&&seal.dependencyHash===record.body.dependenciesHash,'ATOMIC_DECISION_SEAL_REQUIRED');
    }
    return record;
  }
  async findRanking(pin: Pin): Promise<RankingPublication> {
    const row=await this.db.marketBoundaryRankingPublication.findUnique({where:{id:pin.id}});
    requireBoundary(row&&row.bodyHash===pin.hash,'RANKING_PIN_REQUIRED');
    const record=JSON.parse(row.body) as RankingPublication,{contentHash,...payload}=record;
    requireBoundary(record.contractVersion==='policy-b-ranking-publication-v1'&&record.id===row.id&&record.analysis.id===row.analysisId&&snapshotHash(payload)===contentHash&&contentHash===pin.hash&&canonicalJson(record)===row.body,'RANKING_VERSION_OR_CHECKSUM');
    await this.find(record.analysis,'ANALYSIS');const i=await this.find(record.initialization,'INITIALIZATION');
    requireBoundary(canonicalJson(rankPolicyB(record.output.ranking.input,i,snapshotHash))===canonicalJson(record.output),'RANKING_REPLAY_MISMATCH');return record;
  }
  async sealRanking(record: RankingPublication, expected: Pin) {
    const {contentHash,...body}=record;
    requireBoundary(record.contractVersion==='policy-b-ranking-publication-v1'&&snapshotHash(body)===contentHash&&record.dependenciesHash===expected.hash,'RANKING_PUBLICATION_CONTRACT');
    await this.db.$transaction(async tx=>{
      const head=await tx.marketBoundaryDependencyHead.findUnique({where:{id:expected.id}});
      const analysis=await tx.marketBoundaryRecord.findUnique({where:{id:record.analysis.id}});
      requireBoundary(head?.bodyHash===expected.hash&&analysis?.kind==='ANALYSIS'&&analysis.bodyHash===record.analysis.hash,'RANKING_PUBLICATION_DEPENDENCY');
      requireBoundary(record.freshness.status==='PASS'&&record.freshness.eligibleUntil!==null&&this.clock.now()<=record.freshness.eligibleUntil,'RANKING_FRESHNESS_AT_PUBLICATION');
      await tx.marketBoundaryRankingPublication.create({data:{id:record.id,analysisId:record.analysis.id,body:canonicalJson(record),bodyHash:contentHash}});
    });
  }
  async sealDecision(record: Sealed<'DECISION'>, expected: Pin) {
    const data=this.data(record);
    await this.db.$transaction(async tx=>{
      const head=await tx.marketBoundaryDependencyHead.findUnique({where:{id:expected.id}});
      requireBoundary(head&&head.bodyHash===expected.hash&&record.body.dependenciesHash===head.bodyHash,'DEPENDENCIES_CHANGED_AT_PUBLICATION');
      // SQLite transaction serializes the dependency check and immutable record/seal insertion.
      for(const [pin,kind] of [[record.body.analysis,'ANALYSIS'],[record.body.portfolio,'PORTFOLIO'],[record.body.market,'MARKET'],[record.body.initialization,'INITIALIZATION']] as const){
        const row=await tx.marketBoundaryRecord.findUnique({where:{id:pin.id}});requireBoundary(row&&row.kind===kind&&row.bodyHash===pin.hash,'MISSING_PUBLICATION_DEPENDENCY');requireBoundary(readSealed(JSON.parse(row.body),kind,snapshotHash).contentHash===pin.hash,'CORRUPT_PUBLICATION_DEPENDENCY');
      }
      await tx.marketBoundaryRecord.create({data});
      requireBoundary(record.body.freshness.eligibleUntil!==null&&this.clock.now()<=record.body.freshness.eligibleUntil,'FRESHNESS_EXPIRED_AT_SEAL');
      await tx.marketBoundaryDecisionSeal.create({data:{decisionId:record.body.decisionId,recordId:record.id,dependencyId:expected.id,dependencyHash:expected.hash}});
    });
  }
}
