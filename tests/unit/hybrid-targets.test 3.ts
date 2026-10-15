import {it,expect} from 'vitest';
import {financialTargets} from '@/domain/fundamentals/hybrid-sufficiency';
import type {HybridInput} from '@/domain/fundamentals/hybrid-admission';
const input:HybridInput={snapshotId:'synthetic-target',analysisAt:'2026-10-14T00:00:00.000Z',systemKnownAt:'2026-10-14T00:00:00.000Z',mode:'CURRENT_ANALYSIS',candidates:[],certificates:[],verifications:[],universe:[{ticker:'HPG',sector:'MATERIALS'}],statements:[],sourceBindings:[]};
it('preserves four annual obligations and missing current YTD without provider-dependent denominators',()=>{
 const targets=financialTargets(input);
 expect(targets).toHaveLength(5);
 expect(targets.filter(t=>t.track==='LONG_TERM_BASELINE').map(t=>t.fiscalYear)).toEqual([2022,2023,2024,2025]);
 expect(targets.find(t=>t.track==='CURRENT_TRAJECTORY')).toMatchObject({frame:'YTD',start:'2026-01-01',end:'2026-06-30',quarter:2});
});
it('advances the expected window by reporting calendar even with no provider candidates',()=>{
 expect(financialTargets({...input,analysisAt:'2026-12-01T00:00:00.000Z'}).find(t=>t.track==='CURRENT_TRAJECTORY')).toMatchObject({frame:'YTD',start:'2026-01-01',end:'2026-09-30',quarter:3});
});
