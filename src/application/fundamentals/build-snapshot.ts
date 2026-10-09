import type { FundamentalSnapshotRepository } from '@/ports/fundamentals';
import type { SnapshotRequest } from '@/domain/fundamentals/snapshot';
import { validateSnapshotRequest } from '@/domain/fundamentals/snapshot';
/** Repository enumerates the complete candidate set and seals content + provenance atomically. */
export class BuildFundamentalSnapshot {
  constructor(private readonly snapshots:FundamentalSnapshotRepository){}
  run(request:SnapshotRequest){return this.snapshots.seal(validateSnapshotRequest(request));}
}
