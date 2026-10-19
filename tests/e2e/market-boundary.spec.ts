import { test, expect } from '@playwright/test';
test('readiness API distinguishes initialization, capability, freshness and decision approval without an automatic fetch',async({request})=>{
 const response=await request.get('/api/readiness');expect(response.status()).toBe(200);expect(response.headers()['cache-control']).toBe('no-store');
 const state=await response.json();expect(state).toMatchObject({amendment:'di-market-boundary-v1',initialized:false,initializationCandidate:'BLOCKED',marketCapability:false,marketCurrent:false,analysisReady:false,decisionReady:false,readyForScoring:false,DI14:'PENDING_INDEPENDENT_APPROVAL',DI15:'PENDING'});
 expect(state.reasons).toContain('MARKET_CAPABILITY_REPLAY_NOT_QUALIFIED');expect(state.reasons).toContain('CURRENT_MARKET_SNAPSHOT_NOT_AVAILABLE');
});
