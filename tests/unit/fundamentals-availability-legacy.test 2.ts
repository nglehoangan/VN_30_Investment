// @vitest-environment node
import {it,expect} from 'vitest';
import golden from '../fixtures/reviewed-slice5-v1-golden.json';
import {snapshotFixture} from '../fixtures/snapshot';
import {assessAvailability} from '@/domain/fundamentals/availability';
import {buildFundamentalSnapshot} from '@/domain/fundamentals/snapshot';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
/** Static bytes generated using availability.ts and snapshot.ts from reviewed commit, not current code. */
it('replays reviewed v1 DATE_ONLY assessment and full snapshot exactly without importing v2 semantics',()=>{
 const f=snapshotFixture('legacy-golden'),observation={...f.observation,publication:{publishedAt:null,publicationDate:'2026-07-25',publicationPrecision:'DATE_ONLY' as const,publicationStatus:'VERIFIED' as const,timezone:'Asia/Ho_Chi_Minh',evidenceReference:'synthetic-date-disclosure'}},policy={...f.policy,governanceStatus:'APPROVED' as const,approvalReference:'synthetic-approved-v1'},assessment=assessAvailability({id:f.assessment.id,observation,registry:f.registry,policy,assessedAt:f.assessment.assessedAt,hash:snapshotHash});
 expect(golden.reviewedCommit).toBe('86a2755cbca1b4aa502ee1cfc72eb8fba936e0d5');expect(assessment).toEqual(golden.assessment);expect(assessment).not.toHaveProperty('evidenceInputs');
 expect(buildFundamentalSnapshot({...f.request,policy},{...f.inputs,observations:[observation],assessments:[assessment]},snapshotHash)).toEqual(golden.snapshot);
});
