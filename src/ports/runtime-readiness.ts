import type { HumanReviewRecord } from '@/domain/fundamentals/runtime-review';
import type { FormalLineageReceipt } from '@/domain/fundamentals/runtime-provenance';
import type { RuntimeAuthorityPin } from '@/domain/fundamentals/runtime-authority';
import type { MethodologyRecord } from '@/domain/methodology/record';
/** Configured server identity provider, never request JSON. */
export interface RuntimeReviewerIdentity {
  current():Promise<{readonly subject:string;readonly sessionReference:string;readonly roles:readonly ('ANALYST'|'OWNER'|'INDEPENDENT_DATASET_REVIEWER')[]}>;
}
export interface HumanReviewStore {
  head(id:string):Promise<HumanReviewRecord|null>;
  append(record:HumanReviewRecord,expectedHash:string|null):Promise<void>;
}
/** Trusted verifier checks source bytes, JSON pointers, exact canonical/normalization and publication evidence. */
export interface RuntimeEvidenceAuthority {
  authority(hash:string):Promise<{readonly pin:RuntimeAuthorityPin;readonly method:MethodologyRecord}|null>;
  lineage(hash:string):Promise<FormalLineageReceipt|null>;
}
