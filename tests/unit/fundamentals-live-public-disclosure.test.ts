// @vitest-environment node
import {it,expect} from 'vitest';
import {normalizationFixture} from '../fixtures/normalization';
import {normalizeStatement} from '@/domain/fundamentals/normalization';
import {assessAvailability,isEvidenceAssessment} from '@/domain/fundamentals/availability';
import {buildFundamentalSnapshot} from '@/domain/fundamentals/snapshot';
import {snapshotFixture} from '../fixtures/snapshot';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
async function fixture(){
 const f=await normalizationFixture(),n=normalizeStatement({...f.input,scope:'REVIEW_CANDIDATE'}),o=n.observations[0];
 const policy={version:'initial-live-public-v3',algorithm:'operational-live-public-v3' as const,applicability:'INITIAL_LIVE_ONLY' as const,governanceStatus:'PROPOSED' as const,approvalReference:null,recordedAt:o.ingestedAt,dateOnlyZones:['Asia/Ho_Chi_Minh' as const],dateOnlyEvidenceClasses:[]};
 const proof={observationHash:hash(o),sourceVersionId:o.sourceVersionId,bodyHash:n.bodyHash,responseBodyHash:n.bodyHash,documentUrl:'https://issuer.example/financial.pdf',retrievedAt:o.retrievedAt,verifiedAt:o.ingestedAt,evidenceReference:'verified-public-response-1',publicAccess:'UNAUTHENTICATED_PUBLIC_DOCUMENT' as const,status:'VERIFIED' as const};
 return {id:'live-assessment',observation:o,registry:f.input.registry,policy,assessedAt:o.ingestedAt,hash,livePublicDisclosureBinding:proof};
}
it('conservative initial live proof never rewrites unknown historical publication or backdates knowledge',async()=>{
 const f=await fixture(),a=assessAvailability(f);expect(a.status).toBe('VERIFIED');expect(a.availableAt).toBe(f.observation.ingestedAt);
 expect(f.observation.publication.publicationPrecision).toBe('UNKNOWN');expect(isEvidenceAssessment(a)&&a.boundaryBasis).toBe('CONSERVATIVE_INITIAL_LIVE_PUBLIC_DISCLOSURE');
 expect(a.availableAt!>f.observation.retrievedAt).toBe(true);
});
it('local retrieval without exact public-document proof still leaves UNKNOWN',async()=>{
 const f=await fixture();expect(assessAvailability({...f,livePublicDisclosureBinding:null}).status).toBe('UNKNOWN');
});
it('public proof rejects different bytes, source, observation, private access and future verification',async()=>{
 const f=await fixture();for(const patch of [{responseBodyHash:'a'.repeat(64)},{sourceVersionId:'other-source'},{observationHash:'b'.repeat(64)},{publicAccess:'PRIVATE_DOCUMENT'},{verifiedAt:'2099-01-01T00:00:00.000Z'}]){
 expect(()=>assessAvailability({...f,livePublicDisclosureBinding:{...f.livePublicDisclosureBinding,...patch} as typeof f.livePublicDisclosureBinding})).toThrow();
 }
});

it('live snapshot requires replayable public and current-cycle bindings and preserves failed snapshots',async()=>{
 const f=await fixture(),o=f.observation,a=assessAvailability(f),base=snapshotFixture('live-replay'),at=f.assessedAt;
 const request={...base.request,scope:'REVIEW_CANDIDATE' as const,runId:'new-live-run',policy:f.policy,decisionAsOf:at,systemKnownAt:at,fundamentalCutoff:at,marketCutoff:at,builtAt:at,
 requirements:[{securityId:o.securityId,itemId:o.itemId,reportingScope:o.reportingScope,periodStart:o.periodStart,periodEnd:o.periodEnd,maxAgeDays:null}],
 assessmentPins:[{observationId:o.id,assessmentId:a.id}],references:[{kind:'UNIVERSE' as const,version:'test-universe',knownAt:at,content:[o.securityId]},{kind:'SECTOR' as const,version:'test-sector',knownAt:at,content:[o.securityId+':'+o.sector]},{kind:'MARKET' as const,version:'test-market',knownAt:at,content:['test-market']} ]};
 const inputs={registry:f.registry,observations:[o],assessments:[a],derived:[],livePublicDisclosureBindings:[f.livePublicDisclosureBinding]};
 const failed=buildFundamentalSnapshot(request,inputs,hash);expect(failed.members).toHaveLength(0);
 const freshness={observationId:o.id,policy:{version:'cycle-test-v1',recordedAt:at,governanceStatus:'PROPOSED' as const,approvalReference:null,methodologyReference:'test-cycle',algorithm:'reporting-cycle-and-version-v1' as const,graceRule:'EXPLICIT_PREEXISTING_CYCLE_OR_WORKFLOW_EVIDENCE_ONLY' as const},evidence:{class:'FUNDAMENTALS' as const,cutoff:at,periodOrVersion:o.periodEnd,requiredPeriodOrVersion:o.periodEnd,requirementKnownAt:at,requirementEvidenceReference:'test-issuer-latest-period',publicationUsable:true,inventoryVerifiedThrough:at,graceUntil:null,graceEvidenceReference:null,validUntil:null,contentHash:hash(o)}};
 const ready=buildFundamentalSnapshot({...request,runId:'ready-live-run'},{...inputs,operationalFreshnessBindings:[freshness]},hash);expect(ready.members).toHaveLength(1);expect(failed.members).toHaveLength(0);expect(ready.contentHash).not.toBe(failed.contentHash);
 expect(()=>buildFundamentalSnapshot(request,{...inputs,livePublicDisclosureBindings:[]},hash)).toThrow();
 expect(()=>buildFundamentalSnapshot(request,{...inputs,operationalFreshnessBindings:[{...freshness,evidence:{...freshness.evidence,contentHash:'a'.repeat(64)}}]},hash)).toThrow();
});
