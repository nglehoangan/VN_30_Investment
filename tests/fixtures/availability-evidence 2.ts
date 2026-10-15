import {snapshotFixture} from './snapshot';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {assessAvailability,isEvidenceAssessment} from '@/domain/fundamentals/availability';
import type {EvidenceAvailabilityPolicy} from '@/domain/fundamentals/availability';
import type {ProviderReceiptEvidenceBinding} from '@/domain/fundamentals/availability-evidence';
/** Synthetic approvals only. January source/authority are explicitly historical test metadata. */
export function dateOnlyEvidenceFixture(suffix='evidence'){
 const f=snapshotFixture(suffix),source={...f.source,recordedAt:f.policy.recordedAt},observation={...f.observation,
  publication:{publishedAt:null,publicationDate:'2026-07-25',publicationPrecision:'DATE_ONLY' as const,publicationStatus:'VERIFIED' as const,timezone:'Asia/Ho_Chi_Minh',evidenceReference:'synthetic-date-disclosure'},
  providerReceivedAt:'2026-07-25T15:00:00.000Z',retrievedAt:'2026-07-25T16:00:00.000Z',ingestedAt:'2026-07-25T16:01:00.000Z'};
 const capture={...f.capture,retrievedAt:observation.retrievedAt},batch={...f.batch,startedAt:'2026-07-25T15:59:00.000Z',completedAt:observation.retrievedAt,ingestedAt:observation.ingestedAt};
 const policy:EvidenceAvailabilityPolicy={...f.policy,version:'synthetic-evidence-v2',algorithm:'operational-evidence-v2',governanceStatus:'APPROVED',approvalReference:'synthetic-external-availability-approval',dateOnlyEvidenceClasses:['TRUSTED_PROVIDER_RECEIPT']};
 const providerEvidenceBinding:ProviderReceiptEvidenceBinding={authority:{version:'synthetic-public-feed-v1',evidenceClass:'TRUSTED_PROVIDER_RECEIPT',receiptSemantics:'PUBLICLY_RECEIVABLE_DOCUMENT',sourceVersionId:source.id,sourceHash:snapshotHash(source),provider:source.provider,governanceStatus:'APPROVED',approvalReference:'synthetic-provider-approval',authorityReference:'synthetic-public-filing-feed-contract',methodologyIdentity:'synthetic-provider-receipt-method',recordedAt:f.policy.recordedAt},receipt:{observationHash:snapshotHash(observation),receivedAt:observation.providerReceivedAt,evidenceReference:observation.providerReceiptReference!,status:'VERIFIED',knownAt:observation.ingestedAt}};
 const assessment=assessAvailability({id:f.assessment.id,observation,registry:f.registry,policy,assessedAt:f.assessment.assessedAt,providerEvidenceBinding,hash:snapshotHash});
 if(!isEvidenceAssessment(assessment))throw new Error('Synthetic v2 assessment required');
 const request={...f.request,policy,decisionAsOf:'2026-07-25T16:01:00.000Z',systemKnownAt:'2026-07-25T16:01:00.000Z',marketCutoff:'2026-07-25T16:01:00.000Z',fundamentalCutoff:'2026-07-25T16:01:00.000Z'};
 return {...f,source,capture,batch,observation,policy,assessment,providerEvidenceBinding,request,inputs:{...f.inputs,observations:[observation],assessments:[assessment],providerEvidenceBindings:[providerEvidenceBinding]}};
}
