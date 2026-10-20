import { STATIC_CLASSES,DEPENDENCY_VERSION,type Head,type Release,type Publication,type DependencyClass } from './contracts';
import type { Digest,Pin,Sealed } from '@/domain/market-boundary/contracts';
import { requireBoundary as check,readSealed,same,reference } from '@/domain/market-boundary/validation';
import { validateLevel1Disposition,type Level1DispositionRelease } from '@/domain/fundamentals/level1-disposition';
import { instant } from '@/shared/time';
export const ref=(r:Release|Publication):Pin=>({id:r.id,hash:r.contentHash});
export function head(heads:readonly Head[],type:DependencyClass):Head {const rows=heads.filter(h=>h.type===type);check(rows.length===1,'MISSING_OR_UNKNOWN_HEAD:'+type);return rows[0];}
export function boundary<K extends 'INITIALIZATION'|'CAPABILITY'|'MARKET'|'PORTFOLIO'>(heads:readonly Head[],type:DependencyClass,kind:K,hash:Digest):Sealed<K>{return readSealed(head(heads,type).content as Sealed<K>,kind,hash);}
export function validateHeads(heads:readonly Head[],hash:Digest){
 check(new Set(heads.map(h=>h.type)).size===heads.length,'DUPLICATE_DEPENDENCY_CLASS');
 const allowed=[...STATIC_CLASSES,'MARKET','PORTFOLIO','RISK_STATE'];
 for(const h of heads){
  check(allowed.includes(h.type)&&h.status==='ACCEPTED'&&h.contract.length>0&&h.sourceReference.length>0&&h.authorityReference.length>0,'UNKNOWN_OR_UNAPPROVED_HEAD');instant(h.effectiveFrom);instant(h.recordedAt);
  check(/^[a-f0-9]{64}$/.test(h.pin.hash)&&h.pin.id.length>0,'HEAD_PIN');
  if(h.scheme==='BOUNDARY'){const r=h.content as Sealed;readSealed(r,r.kind,hash);check(same(reference(r),h.pin)&&r.contractVersion===h.contract&&r.knownAt<=h.recordedAt,'HEAD_HASH_MISMATCH');}
  else if(h.scheme==='SESSION'){const {id,_unused,...rest}=h.content as {id:string;hash:string;_unused?:unknown};void _unused;const {hash:sum,...body}=rest;check(id===h.pin.id&&sum===h.pin.hash&&hash(body)===sum,'HEAD_HASH_MISMATCH');}
  else check(h.scheme==='JSON'&&hash(h.content)===h.pin.hash,'HEAD_HASH_MISMATCH');
  for(const r of h.requires)check(same(head(heads,r.type).pin,r.pin),'INCOMPATIBLE_DEPENDENCY_SET:'+h.type+':'+r.type);
 }
 for(const type of STATIC_CLASSES)head(heads,type);
 const i=boundary(heads,'INITIALIZATION','INITIALIZATION',hash),b=i.body;
 check(same(b.universe,head(heads,'UNIVERSE').pin)||same({id:b.universe.id,hash:b.universe.hash},head(heads,'UNIVERSE').pin),'UNIVERSE_HEAD_BINDING');
 check(same({id:b.fundamentals.id,hash:b.fundamentals.hash},head(heads,'FUNDAMENTALS').pin)&&same(b.capability,head(heads,'MARKET_CAPABILITY').pin),'INITIALIZATION_HEAD_BINDING');
 const refs=head(heads,'REFERENCE_DATA').content as {security:unknown;sectors:unknown};check(hash(refs.security)===b.securityMaster.hash&&hash(refs.sectors)===b.sectorMaster.hash,'REFERENCE_DATA_BINDING');
 const level=validateLevel1Disposition(head(heads,'LEVEL1_RELEASE').content as Level1DispositionRelease,hash);
 const runs=head(heads,'FUNDAMENTALS').content as {id:string;bodyHash:string;ticker:string}[];
 check(Array.isArray(runs)&&runs.length===30&&new Set(runs.map(r=>r.ticker)).size===30&&level.dispositions.every(d=>runs.some(r=>r.id===d.canonicalRunId&&r.ticker===d.ticker)),'FUNDAMENTAL_RELEASE_COMPATIBILITY');
 check(hash(level.partition.universe)===head(heads,'UNIVERSE').pin.hash&&level.partition.members.filter(m=>m.state==='SCORABLE').length===29,'UNIVERSE_PARTITION_COMPATIBILITY');
 check(hash(level.partition)===b.partition.hash&&hash(level.dispositions)===b.dispositions.hash,'PARTITION_HEAD_BINDING');
 check(level.partition.members.every(m=>b.members.some(n=>n.securityId===m.securityId&&n.ticker===m.ticker&&n.state===m.state))&&b.members.length===30,'UNIVERSE_PARTITION_COMPATIBILITY');
 check(b.exceptions.length===1&&b.exceptions[0].hash===hash(level.exceptions[0])&&b.exceptions[0].amountVnd==='5284485167173','TCX_EXCEPTION_HEAD_BINDING');
 const cap=boundary(heads,'MARKET_CAPABILITY','CAPABILITY',hash);check(same({id:cap.body.freshnessPolicy.id,hash:cap.body.freshnessPolicy.hash},head(heads,'SESSION_POLICY').pin),'SESSION_HEAD_BINDING');
 if(heads.some(h=>h.type==='MARKET')){const m=boundary(heads,'MARKET','MARKET',hash);check(same(m.body.capability,reference(cap))&&same(m.body.universe,b.universe),'MARKET_HEAD_COMPATIBILITY');}
 if(heads.some(h=>h.type==='PORTFOLIO')){boundary(heads,'PORTFOLIO','PORTFOLIO',hash);check(head(heads,'PORTFOLIO').ownerId,'MISSING_PORTFOLIO_OWNER');}
 if(heads.some(h=>h.type==='RISK_STATE'))check(head(heads,'RISK_STATE').requires.some(r=>r.type==='RISK_POLICY'),'MISSING_RISK_STATE_COMPATIBILITY');
 const model=head(heads,'SCORING_MODEL').content as {implementationIdentity?:unknown};check(typeof model.implementationIdentity==='string'&&model.implementationIdentity.length>0,'MISSING_SCORING_ENGINE_IDENTITY');
 // Policy/model/engine/risk compatibility is mandatory, pinned in their immutable accepted receipts.
 for(const type of ['SCORING_MODEL','DECISION_ENGINE','RISK_POLICY'] as const)check(head(heads,type).requires.some(r=>r.type==='POLICY'),'MISSING_POLICY_COMPATIBILITY:'+type);
}
export function makeRelease(heads:readonly Head[],previous:Pin|null,at:string,reason:string,hash:Digest):Release {
 validateHeads(heads,hash);instant(at);check(reason.length>0&&heads.every(h=>h.recordedAt<=at&&h.effectiveFrom<=at),'FUTURE_OR_UNREASONED_ACTIVATION');
 const payload={contract:DEPENDENCY_VERSION,recordedAt:at,effectiveFrom:at,supersedes:previous,activationReason:reason,actor:'SYSTEM_ACCEPTED_ARTIFACTS' as const,heads:[...heads].sort((a,b)=>a.type.localeCompare(b.type))};
 const id='dependency-release-'+hash(payload),body={...payload,id};return {...body,contentHash:hash(body)};
}
export function readRelease(r:Release,hash:Digest){const {contentHash,...body}=r;check(r.contract===DEPENDENCY_VERSION&&hash(body)===contentHash,'DEPENDENCY_RELEASE_HASH');validateHeads(r.heads,hash);return r;}
export function readPublication(p:Publication,hash:Digest){const {contentHash,...body}=p;check(p.contract==='production-dependency-publication-v1'&&hash(body)===contentHash,'PUBLICATION_HASH');readSealed(p.snapshot,p.kind,hash);check(p.kind==='ANALYSIS'?p.decisionRelease===null:p.decisionRelease!==null,'PUBLICATION_RELEASE_BINDING');return p;}
