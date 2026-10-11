// @vitest-environment node
import {it,expect} from 'vitest';
import {snapshotFixture} from '../fixtures/snapshot';
import {assessAvailability,type LiveAvailabilityPolicy} from '@/domain/fundamentals/availability';
import {buildFundamentalSnapshot} from '@/domain/fundamentals/snapshot';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
function fixture(){
 const f=snapshotFixture('economic-equivalence-pit'),at=f.request.systemKnownAt;
 const known={...f.observation,scope:'REVIEW_CANDIDATE' as const};
 const unknown={...known,id:'unknown-public-boundary',publication:{publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN' as const,publicationStatus:'UNKNOWN' as const,timezone:null,evidenceReference:null}};
 const policy:LiveAvailabilityPolicy={...f.policy,algorithm:'operational-live-public-v3',applicability:'INITIAL_LIVE_ONLY',dateOnlyEvidenceClasses:[]};
 const rows=[known,unknown],assessments=rows.map((observation,i)=>assessAvailability({id:'pit-equivalence-assessment-'+i,observation,registry:f.registry,policy,assessedAt:at,hash}));
 const hashes=rows.map(hash).sort(),resolution={kind:'SAME_ECONOMIC_FACT' as const,observationHashes:hashes,representativeHash:hashes[0],recordedAt:at,reason:'Two independent source declarations and exact economic definitions agree',sourcePageEvidenceHashes:['a'.repeat(64),'b'.repeat(64)],status:'REVIEW_CANDIDATE' as const,approvalReference:null};
 return {f,known,unknown,rows,assessments,resolution,request:{...f.request,scope:'REVIEW_CANDIDATE' as const,policy,assessmentPins:assessments.map(a=>({observationId:a.observationId,assessmentId:a.id}))},inputs:{registry:f.registry,observations:rows,assessments,derived:[]}};
}
it('resolves proved economic identity while selecting only the PIT-verified occurrence',()=>{
 const x=fixture();expect(x.assessments.map(a=>a.status)).toEqual(['VERIFIED','UNKNOWN']);
 expect(buildFundamentalSnapshot(x.request,x.inputs,hash).blockers).toContain('BLOCKED_CONFLICT');
 const inputs={...x.inputs,equivalenceResolutions:[x.resolution]},s=buildFundamentalSnapshot(x.request,inputs,hash);
 expect(s.members.map(m=>m.observationId)).toEqual([x.known.id]);expect(s.blockers).not.toContain('BLOCKED_CONFLICT');
 expect(x.assessments[1].availableAt).toBeNull();expect(x.unknown.publication.publicationStatus).toBe('UNKNOWN');
 expect(buildFundamentalSnapshot(x.request,{...inputs,observations:[...x.rows].reverse()},hash).contentHash).toBe(s.contentHash);
});
it('does not select any unknown public boundary or use future equivalence evidence',()=>{
 const x=fixture();expect(()=>buildFundamentalSnapshot(x.request,{...x.inputs,equivalenceResolutions:[{...x.resolution,recordedAt:'2099-01-01T00:00:00.000Z'}]},hash)).toThrow();
 const known={...x.known,publication:x.unknown.publication},rows=[known,x.unknown],assessments=rows.map((observation,i)=>assessAvailability({id:'all-unknown-'+i,observation,registry:x.f.registry,policy:x.request.policy,assessedAt:x.request.systemKnownAt,hash}));
 const hashes=rows.map(hash).sort(),request={...x.request,assessmentPins:assessments.map(a=>({observationId:a.observationId,assessmentId:a.id}))};
 const s=buildFundamentalSnapshot(request,{...x.inputs,observations:rows,assessments,equivalenceResolutions:[{...x.resolution,observationHashes:hashes,representativeHash:hashes[0]}]},hash);
 expect(s.members).toEqual([]);expect(s.blockers).toContain('BLOCKED_PUBLICATION_UNKNOWN');expect(assessments.every(a=>a.availableAt===null)).toBe(true);
});
