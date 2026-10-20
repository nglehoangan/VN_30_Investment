import type { Readiness } from './contracts';
/** Candidate qualification does not authorize DI14/DI15 or investment output. */
export const boundaryCandidateReadiness = (marketCapable: boolean, durableQualified = false, manifestReproduced = false): Readiness & { initializationCandidate: 'PASS_CANDIDATE' | 'BLOCKED'; DI14: 'PENDING_INDEPENDENT_APPROVAL'; DI15: 'PENDING'; readyForScoring: false } => Object.freeze({
  initialized:false, initializationCandidate:marketCapable&&durableQualified&&manifestReproduced?'PASS_CANDIDATE':'BLOCKED',
  marketCapability:marketCapable,marketCurrent:false,analysisReady:false,decisionReady:false,
  DI14:'PENDING_INDEPENDENT_APPROVAL',DI15:'PENDING',readyForScoring:false,
});
export const marketBlockerChildren = Object.freeze({
  parent:'RELEASE-MARKET-SOURCE-REPLAY-UNAVAILABLE',parentHistory:'PRESERVED',
  children:[{id:'MARKET_CAPABILITY_REPLAY_NOT_QUALIFIED',owner:'INITIALIZATION',status:'OPEN'},
    {id:'CURRENT_MARKET_SNAPSHOT_NOT_AVAILABLE',owner:'ANALYSIS_TIME',status:'OPEN'}],
});
