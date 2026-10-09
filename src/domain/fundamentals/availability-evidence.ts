import type { FundamentalObservation } from './contracts';
import { requireFundamental, fundamentalId, fundamentalHash } from './validation';
import { instant } from '@/shared/time';
import { snapshot } from '@/domain/scoring/validation';
import { deepFreeze } from '@/domain/portfolio/transaction';

export type AvailabilityEvidenceClass = 'ISSUER_PUBLICATION_TIMESTAMP' | 'TRUSTED_PROVIDER_RECEIPT' |
  'UNTRUSTED_PROVIDER_RECEIPT' | 'LOCAL_RETRIEVAL' | 'LOCAL_INGESTION' | 'CORRECTION_KNOWLEDGE';
/** Externally approved source capability; receipt of a confidential/private feed does not qualify. */
export interface ProviderReceiptAuthority {
  readonly version:string; readonly evidenceClass:'TRUSTED_PROVIDER_RECEIPT';
  readonly receiptSemantics:'PUBLICLY_RECEIVABLE_DOCUMENT';
  readonly sourceVersionId:string; readonly sourceHash:string; readonly provider:string;
  readonly governanceStatus:'APPROVED'; readonly approvalReference:string;
  readonly authorityReference:string; readonly methodologyIdentity:string; readonly recordedAt:string;
}
/** Trusted composition supplies exact, verified receipt lineage; neither observation nor request grants trust. */
export interface ProviderReceiptEvidenceBinding {
  readonly authority:ProviderReceiptAuthority;
  readonly receipt:{readonly observationHash:string; readonly receivedAt:string; readonly evidenceReference:string;
    readonly status:'VERIFIED'; readonly knownAt:string};
}
export interface AvailabilityEvidenceInput {
  readonly evidenceClass:AvailabilityEvidenceClass; readonly timestamp:string;
  readonly evidenceReference:string; readonly canEstablishPublicBoundary:boolean;
  readonly authorityHash:string|null; readonly knownAt:string|null;
}
function exact(x:object,fields:string){requireFundamental(x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(' ')===fields.split(' ').sort().join(' '),'AVAILABILITY_EVIDENCE_EXACT_FIELDS');}
function reference(value:string){requireFundamental(typeof value==='string'&&value.trim()===value&&value.length>0&&value.length<=4000&&!/[\x00-\x1f<>]/.test(value),'AVAILABILITY_EVIDENCE_REFERENCE');}
export function validateProviderReceiptEvidence(raw:ProviderReceiptEvidenceBinding){
  const b=snapshot(raw);exact(b,'authority receipt');const a=b.authority,r=b.receipt;
  exact(a,'version evidenceClass receiptSemantics sourceVersionId sourceHash provider governanceStatus approvalReference authorityReference methodologyIdentity recordedAt');
  [a.version,a.sourceVersionId,a.methodologyIdentity].forEach(fundamentalId);fundamentalHash(a.sourceHash);
  [a.provider,a.approvalReference,a.authorityReference].forEach(reference);instant(a.recordedAt);
  requireFundamental(a.evidenceClass==='TRUSTED_PROVIDER_RECEIPT'&&a.receiptSemantics==='PUBLICLY_RECEIVABLE_DOCUMENT'&&a.governanceStatus==='APPROVED','PUBLIC_RECEIPT_AUTHORITY_REQUIRED');
  exact(r,'observationHash receivedAt evidenceReference status knownAt');fundamentalHash(r.observationHash);reference(r.evidenceReference);instant(r.receivedAt);instant(r.knownAt);
  requireFundamental(r.status==='VERIFIED'&&r.receivedAt<=r.knownAt,'VERIFIED_PROVIDER_RECEIPT_REQUIRED');return deepFreeze(b);
}
export function bindProviderReceipt(raw:ProviderReceiptEvidenceBinding,o:FundamentalObservation,assessedAt:string,hash:(v:unknown)=>string){
  const b=validateProviderReceiptEvidence(raw);
  requireFundamental(b.receipt.observationHash===hash(o)&&b.authority.sourceVersionId===o.sourceVersionId&&b.receipt.receivedAt===o.providerReceivedAt&&b.receipt.evidenceReference===o.providerReceiptReference,'PROVIDER_RECEIPT_EXACT_OBSERVATION_BINDING');
  requireFundamental(b.authority.recordedAt<=assessedAt&&b.receipt.knownAt<=assessedAt,'PROVIDER_RECEIPT_AUTHORITY_NOT_KNOWN');return b;
}
