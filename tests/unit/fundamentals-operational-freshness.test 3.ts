import {it,expect} from 'vitest';
import {assessOperationalFreshness} from '@/domain/fundamentals/operational-freshness';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
const policy={version:'cycle-v1',recordedAt:'2026-10-10T00:00:00.000Z',governanceStatus:'PROPOSED' as const,approvalReference:null,methodologyReference:'DATA_INITIALIZATION-14-15',algorithm:'reporting-cycle-and-version-v1' as const,graceRule:'EXPLICIT_PREEXISTING_CYCLE_OR_WORKFLOW_EVIDENCE_ONLY' as const};
const evidence={class:'FUNDAMENTALS' as const,cutoff:'2026-10-10T12:00:00.000Z',periodOrVersion:'2026-06-30',requiredPeriodOrVersion:'2026-06-30',requirementKnownAt:policy.recordedAt,requirementEvidenceReference:'public-index-complete',publicationUsable:true,inventoryVerifiedThrough:policy.recordedAt,graceUntil:null,graceEvidenceReference:null,validUntil:null,contentHash:'a'.repeat(64)};
it('current cycle facts stay current without a universal age rule',()=>expect(assessOperationalFreshness(policy,evidence,snapshotHash).status).toBe('CURRENT'));
it('known newer required period is stale; only explicit evidenced grace permits aging',()=>{
 const e={...evidence,requiredPeriodOrVersion:'2026-09-30'};expect(assessOperationalFreshness(policy,e,snapshotHash).status).toBe('STALE');expect(assessOperationalFreshness(policy,{...e,graceUntil:'2026-10-11T00:00:00.000Z',graceEvidenceReference:'cycle-grace'},snapshotHash).status).toBe('AGING');
});
it('unknown public availability or inventory never becomes current',()=>{
 for(const patch of [{publicationUsable:false},{inventoryVerifiedThrough:null},{requiredPeriodOrVersion:null}])expect(assessOperationalFreshness(policy,{...evidence,...patch},snapshotHash).status).toBe('UNKNOWN');
});
it('future knowledge and unproved estimate validity fail closed',()=>{
 expect(()=>assessOperationalFreshness(policy,{...evidence,requirementKnownAt:'2026-10-11T00:00:00.000Z'},snapshotHash)).toThrow();expect(assessOperationalFreshness(policy,{...evidence,class:'ESTIMATES'},snapshotHash).status).toBe('UNKNOWN');
});
