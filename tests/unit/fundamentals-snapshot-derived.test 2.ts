// @vitest-environment node
import {it,expect} from 'vitest';
import {release} from '../fixtures/fundamentals';
import {snapshotDerivationFixture} from '../fixtures/snapshot';
import {loadDerivationCrosswalk} from '@/infrastructure/fundamentals/derivation-crosswalk';
import {normalizationHash} from '@/infrastructure/fundamentals/reviewed-statement';
import {deriveFundamentals} from '@/domain/fundamentals/derivation';
import {assessAvailability} from '@/domain/fundamentals/availability';
import {buildFundamentalSnapshot} from '@/domain/fundamentals/snapshot';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import type {SnapshotInputs} from '@/domain/fundamentals/snapshot';
function fixture(){
 const f=snapshotDerivationFixture(),c=loadDerivationCrosswalk(release),crosswalk={...c.crosswalk,registryHash:f.registry.registryHash,recordedAt:f.policy.recordedAt,effectiveDate:'2026-01-01'};
 const request={id:f.request.derivedIds[0],scope:f.request.scope,securityId:f.observation.securityId,sector:f.observation.sector,metric:'FCF' as const,periodStart:f.observation.periodStart,periodEnd:f.observation.periodEnd,cyclical:false,operands:f.observations.map(o=>({id:'operand-'+o.id,operation:'REPORTED' as const,observationIds:[o.id],adjustment:null}))};
 const result=deriveFundamentals({request,recordedAt:f.request.builtAt,registry:f.registry,crosswalk,crosswalkHash:normalizationHash(crosswalk),observations:f.observations,hash:normalizationHash});
 const inputs:SnapshotInputs={registry:f.registry,observations:f.observations,assessments:f.observations.map(o=>assessAvailability({id:'assessment-'+o.id,observation:o,registry:f.registry,policy:f.policy,assessedAt:f.request.builtAt,hash:snapshotHash})),derived:[result]};return {...f,result,inputs};
}
it('inherits availability of all selected operands, pins formula/precision/order and excludes calculation clocks',()=>{
 const f=fixture(),s=buildFundamentalSnapshot(f.request,f.inputs,snapshotHash),m=JSON.parse(s.manifest);expect(s.derivedIds).toEqual([f.result.id]);expect(m.derived[0].value).toBe('70');expect(m.derived[0].availableAt).toBe(f.assessment.availableAt);expect(m.derived[0].operands[0].inputs).toHaveLength(1);expect(m.derived[0].crosswalk.formulaVersion).toBe('existing-metrics-v1');
 const later={...f.result,recordedAt:'2026-07-29T00:00:00.000Z'};expect(buildFundamentalSnapshot({...f.request,runId:'later-derived-build',builtAt:'2026-07-30T00:00:00.000Z'},{...f.inputs,derived:[later]},snapshotHash).contentHash).toBe(s.contentHash);
});
it('PIT-ineligible or unknown publication operands cannot enter a derived snapshot result',()=>{
 const f=fixture(),cutoff='2026-07-25T23:59:59.999Z',r={...f.request,decisionAsOf:cutoff,systemKnownAt:cutoff,marketCutoff:cutoff,fundamentalCutoff:cutoff,assessmentPins:[]},s=buildFundamentalSnapshot(r,f.inputs,snapshotHash);expect(s.derivedIds).toEqual([]);expect(s.blockers).toContain('BLOCKED_DERIVED_INPUTS');
 const observations=f.observations.map(o=>({...o,publication:{publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN' as const,publicationStatus:'UNKNOWN' as const,timezone:null,evidenceReference:null}})),assessments=observations.map(o=>assessAvailability({id:'assessment-'+o.id,observation:o,registry:f.registry,policy:f.policy,assessedAt:f.request.builtAt,hash:snapshotHash}));expect(buildFundamentalSnapshot(f.request,{...f.inputs,observations,assessments},snapshotHash).derivedIds).toEqual([]);
});
it('a derivation governance release known after cutoff cannot gain historical eligibility from a later build',()=>{
 const f=fixture(),d={...f.result,crosswalk:{...f.result.crosswalk,recordedAt:'2026-07-28T00:00:00.000Z'}},s=buildFundamentalSnapshot(f.request,{...f.inputs,derived:[d]},snapshotHash);expect(s.blockers).toContain('BLOCKED_DERIVED_INPUTS');expect(s.derivedIds).toEqual([]);
});
it('equivalent crosswalk JSON key ordering changes transport hash while retaining derived semantic identity',()=>{
 const f=fixture(),crosswalk=Object.fromEntries(Object.entries(f.result.crosswalk).reverse()) as typeof f.result.crosswalk,d={...f.result,crosswalk,crosswalkHash:normalizationHash(crosswalk)};expect(d.crosswalkHash).not.toBe(f.result.crosswalkHash);expect(buildFundamentalSnapshot(f.request,{...f.inputs,derived:[d]},snapshotHash).contentHash).toBe(buildFundamentalSnapshot(f.request,f.inputs,snapshotHash).contentHash);
});
