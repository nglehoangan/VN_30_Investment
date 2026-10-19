import { instant, dateOnly } from '@/shared/time';
import { deepFreeze } from '@/domain/portfolio/transaction';
import type { Consumption, Digest, FreshnessProof, Sealed, SessionPolicy } from './contracts';
import { evidence, nonempty, readSealed, reference, requireBoundary, same } from './validation';
/** Caller supplies an independently pinned policy/calendar, never client JSON authority. */
export function marketFreshness(market: Sealed<'MARKET'> | null, capability: Sealed<'CAPABILITY'> | null, policy: SessionPolicy, request: Consumption, hash: Digest): FreshnessProof {
  const reasons: string[]=[];
  instant(request.now); instant(request.requestedAt); instant(request.knownAt);
  evidence(policy,request.knownAt); evidence(policy.calendar,request.knownAt); evidence(request.universe,request.knownAt);
  requireBoundary(request.mode==='LIVE'||request.mode==='HISTORICAL','REQUEST_MODE');
  requireBoundary(request.knownAt<=request.now && request.requestedAt<=request.now,'FUTURE_REQUEST');
  requireBoundary(request.mode!=='LIVE'||request.requestedAt===request.now,'LIVE_TRUSTED_CLOCK_REQUIRED');
  requireBoundary(request.securityIds.length>0&&new Set(request.securityIds).size===request.securityIds.length,'COVERAGE_REQUIRED');
  requireBoundary(request.purpose!=='FUNDAMENTAL_DESCRIPTION','DESCRIPTIVE_ANALYSIS_USES_NO_MARKET_GATE');
  if(policy.timezone!=='Asia/Ho_Chi_Minh'||!policy.purposes.includes(request.purpose)) reasons.push('UNKNOWN_SESSION_POLICY');
  const windows=policy.windows.filter(w=>w.from<=request.requestedAt&&request.requestedAt<=w.through);
  for(const w of policy.windows){instant(w.from);instant(w.through);instant(w.observationCutoff);dateOnly(w.tradingDate);requireBoundary(w.from<=w.through&&nonempty(w.session),'INVALID_SESSION_WINDOW');}
  if(windows.length!==1)reasons.push('UNKNOWN_OR_AMBIGUOUS_SESSION');
  if(!market)reasons.push('CURRENT_MARKET_SNAPSHOT_NOT_AVAILABLE');
  if(!capability)reasons.push('MARKET_CAPABILITY_REPLAY_NOT_QUALIFIED');
  if(market&&capability){
    const m=readSealed(market,'MARKET',hash),c=readSealed(capability,'CAPABILITY',hash),b=m.body;
    if(!same(b.capability,reference(c)))reasons.push('CAPABILITY_BINDING');
    if(c.knownAt>request.knownAt||m.knownAt>request.knownAt||m.createdAt>request.now)reasons.push('PIT_MARKET_UNAVAILABLE');
    if(!same(b.universe,request.universe))reasons.push('UNIVERSE_CHANGED');
    if(b.purpose!==request.purpose)reasons.push('PURPOSE_MISMATCH');
    if(!same(b.freshnessPolicy,policy)||!same(b.calendar,policy.calendar)) {
      // SessionPolicy extends its identity pin; snapshots retain the evidence identity, not mutable windows.
      if(!same(b.freshnessPolicy,{id:policy.id,hash:policy.hash,knownAt:policy.knownAt,effectiveAt:policy.effectiveAt})||!same(b.calendar,policy.calendar))reasons.push('POLICY_CALENDAR_CHANGED');
    }
    if(!same(c.body.freshnessPolicy,b.freshnessPolicy)||!same(c.body.calendar,b.calendar)||c.body.normalizerVersion!==b.normalizationVersion)reasons.push('UNQUALIFIED_PIPELINE_VERSION');
    if(b.sources.some(s=>s.sourceId!==c.body.sourceId||s.schemaVersion!==c.body.sourceSchema))reasons.push('UNQUALIFIED_SOURCE_SCHEMA');
    const w=windows[0];
    if(w&&(b.acceptedTradingDate!==w.tradingDate||b.session!==w.session))reasons.push('STALE_SESSION');
    for(const id of request.securityIds){
      const rows=b.observations.filter(o=>o.securityId===id&&o.field===policy.field&&o.adjustment===policy.adjustment);
      if(rows.length!==1){reasons.push('MISSING_OR_AMBIGUOUS_OBSERVATION:'+id);continue;}
      const o=rows[0];
      if(o.availableAt>request.knownAt||o.observedAt>request.requestedAt||(w&&o.observedAt>w.observationCutoff))reasons.push('FUTURE_OBSERVATION:'+id);
      if(o.tradingDate!==b.acceptedTradingDate||o.session!==b.session)reasons.push('SESSION_MISMATCH:'+id);
      if(o.corporateActions.knownAt>request.knownAt||!same(o.corporateActions,c.body.corporateActionPolicy))reasons.push('CORPORATE_ACTION_KNOWLEDGE:'+id);
    }
  }
  return deepFreeze({status:reasons.length?'BLOCKED':'PASS',reasons,market:market?reference(market):null,at:request.requestedAt,purpose:request.purpose,policy:{id:policy.id,hash:policy.hash},calendar:{id:policy.calendar.id,hash:policy.calendar.hash},coverageHash:hash([...request.securityIds].sort()),eligibleUntil:reasons.length?null:windows[0].through});
}
