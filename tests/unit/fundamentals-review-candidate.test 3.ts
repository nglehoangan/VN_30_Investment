// @vitest-environment node
import {it,expect,vi} from 'vitest';
import {normalizationFixture} from '../fixtures/normalization';
import {normalizeStatement} from '@/domain/fundamentals/normalization';
import {PrismaFundamentals} from '@/infrastructure/repositories/fundamentals';
import {assessAvailability,isEvidenceAssessment} from '@/domain/fundamentals/availability';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import type {PrismaClient} from '@/infrastructure/db/generated/client';
it('real review candidates normalize without claiming FORMAL authority and cannot enter production repository',async()=>{
 const f=await normalizationFixture();const result=normalizeStatement({...f.input,scope:'REVIEW_CANDIDATE'});
 expect(result.observations.length).toBeGreaterThan(0);expect(result.observations[0].scope).toBe('REVIEW_CANDIDATE');
 expect(()=>normalizeStatement({...f.input,scope:'FORMAL'})).toThrow();
 const create=vi.fn();const repo=new PrismaFundamentals({fundamentalObservation:{create}} as unknown as PrismaClient,f.input.registry);
 await expect(repo.appendObservation(result.observations[0])).rejects.toThrow();expect(create).not.toHaveBeenCalled();
});
it('candidate scope preserves unknown publication and never promotes local ingestion into public knowledge',async()=>{
 const f=await normalizationFixture(),r=normalizeStatement({...f.input,scope:'REVIEW_CANDIDATE'}),o=r.observations[0];
 const p={version:'candidate-policy-v1',algorithm:'operational-evidence-v2' as const,governanceStatus:'PROPOSED' as const,approvalReference:null,recordedAt:o.ingestedAt,dateOnlyZones:['Asia/Ho_Chi_Minh' as const],dateOnlyEvidenceClasses:[]};
 const a=assessAvailability({id:'candidate-assessment',observation:o,registry:f.input.registry,policy:p,assessedAt:o.ingestedAt,hash:snapshotHash});
 expect(a.status).toBe('UNKNOWN');expect(a.availableAt).toBeNull();expect(a.publicBoundary).toBeNull();
 if(!isEvidenceAssessment(a))throw Error('Wrong evidence policy');
 expect(a.evidenceInputs.filter(e=>e.evidenceClass==='LOCAL_INGESTION'||e.evidenceClass==='LOCAL_RETRIEVAL').every(e=>!e.canEstablishPublicBoundary)).toBe(true);
});

import {snapshotFixture} from '../fixtures/snapshot';
import {buildFundamentalSnapshot,validateSnapshotRequest} from '@/domain/fundamentals/snapshot';
it('unknown freshness is fail-closed for isolated candidates and prohibited for FORMAL',()=>{
 const f=snapshotFixture(),request={...f.request,scope:'REVIEW_CANDIDATE' as const,requirements:f.request.requirements.map(r=>({...r,maxAgeDays:null}))};
 const observation={...f.observation,scope:'REVIEW_CANDIDATE' as const};
 const assessment=assessAvailability({id:f.assessment.id,observation,registry:f.registry,policy:f.policy,assessedAt:f.request.builtAt,hash:snapshotHash});
 const s=buildFundamentalSnapshot(request,{...f.inputs,observations:[observation],assessments:[assessment]},snapshotHash);
 expect(s.members).toHaveLength(0);expect(s.blockers).toContain('BLOCKED_FRESHNESS_POLICY_UNRESOLVED');
 expect(()=>validateSnapshotRequest({...request,scope:'FORMAL'})).toThrow();
});

import {eligibleScoringFact} from '@/domain/fundamentals/scoring-bridge';
it('an otherwise selected review-candidate fact cannot bridge into scoring',()=>{
 const f=snapshotFixture(),observation={...f.observation,scope:'REVIEW_CANDIDATE' as const};
 const assessment=assessAvailability({id:f.assessment.id,observation,registry:f.registry,policy:f.policy,assessedAt:f.request.builtAt,hash:snapshotHash});
 const inputs={...f.inputs,observations:[observation],assessments:[assessment]};
 const s=buildFundamentalSnapshot({...f.request,scope:'REVIEW_CANDIDATE'},inputs,snapshotHash);
 expect(s.members).toHaveLength(1);expect(()=>eligibleScoringFact(s,observation.securityId,inputs,observation.id)).toThrow();
});
