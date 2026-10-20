import 'server-only';
import type { BoundaryAuthority, BoundaryStore } from '@/ports/market-boundary';
import type { Clock } from '@/ports/runtime';
import { BoundaryLifecycle } from '@/application/market-boundary/lifecycle';
import { RetainedMarketAuthority } from '@/infrastructure/market-boundary-authority';
import { createTcbsEodAdapter, replayTcbsPipeline, requireTcbsIndependentAcceptance, type TcbsPipelineCandidate } from '@/infrastructure/market-boundary/tcbs-pipeline';
import { requireBoundary, reference, same } from '@/domain/market-boundary/validation';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
/** Only trusted composition supplies independently verified acceptance hashes and existing risk/portfolio authorities. */
export function tcbsBoundaryServices(root:string,candidate:TcbsPipelineCandidate,store:BoundaryStore,clock:Clock,
 independentAcceptedHashes:readonly string[],other:Pick<BoundaryAuthority,'portfolioCurrent'|'prerequisite'|'currentDependencies'>){
 replayTcbsPipeline(root,candidate);requireTcbsIndependentAcceptance(candidate,independentAcceptedHashes);
 const c=candidate.capability.body;
 const authority=new RetainedMarketAuthority(root,{
  adapters:[createTcbsEodAdapter(candidate.profile)],policies:[candidate.policy],
  approvals:[c.sourceContract,c.corporateActionPolicy,c.freshnessPolicy,c.calendar,c.negativeValidation,...c.rawSamples.map(r=>r.request),candidate.initialization.body.universe,candidate.initialization.body.securityMaster,candidate.initialization.body.sectorMaster,candidate.initialization.body.fundamentals,candidate.initialization.body.qualifications,candidate.initialization.body.dispositions,candidate.initialization.body.partition,candidate.initialization.body.provenanceContract,candidate.initialization.body.dataClassPolicy,...candidate.initialization.body.exceptions],
  initializationCurrent:async record=>{replayTcbsPipeline(root,candidate);requireBoundary(same(reference(record),reference(candidate.initialization)),'CURRENT_INITIALIZATION_PIN');},
  marketCurrent:async(record,request)=>{replayTcbsPipeline(root,candidate);requireBoundary(request.purpose==='VALUATION'&&same(reference(record),reference(candidate.market)),'CURRENT_MARKET_SCOPE_OR_REVISION');},
  portfolioCurrent:(p,at)=>other.portfolioCurrent(p,at),prerequisite:(p,r)=>other.prerequisite(p,r),currentDependencies:()=>other.currentDependencies(),
 });
 return {authority,lifecycle:new BoundaryLifecycle(store,authority,clock),acceptanceHash:snapshotHash({capability:reference(candidate.capability),initialization:reference(candidate.initialization),policy:candidate.policy})};
}
