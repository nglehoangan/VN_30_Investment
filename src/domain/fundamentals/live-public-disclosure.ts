import type { FundamentalObservation } from './contracts';
import { fundamentalHash, fundamentalId, requireFundamental } from './validation';
import { instant } from '@/shared/time';
import { deepFreeze } from '@/domain/portfolio/transaction';
/** Proof of public access to exact source bytes, never a historical publication assertion. */
export interface LivePublicDisclosureBinding {
 readonly observationHash:string;readonly sourceVersionId:string;readonly bodyHash:string;
 readonly documentUrl:string;readonly retrievedAt:string;readonly verifiedAt:string;
 readonly evidenceReference:string;readonly publicAccess:'UNAUTHENTICATED_PUBLIC_DOCUMENT';
 readonly responseBodyHash:string;readonly status:'VERIFIED';
}
export function bindLivePublicDisclosure(b:LivePublicDisclosureBinding,o:FundamentalObservation,assessedAt:string,hash:(v:unknown)=>string){
 requireFundamental(Object.keys(b).sort().join(' ')==='bodyHash documentUrl evidenceReference observationHash publicAccess responseBodyHash retrievedAt sourceVersionId status verifiedAt','LIVE_PUBLIC_EVIDENCE_FIELDS');
 [b.observationHash,b.bodyHash,b.responseBodyHash].forEach(fundamentalHash);fundamentalId(b.sourceVersionId);
 instant(b.retrievedAt);instant(b.verifiedAt);
 requireFundamental(b.status==='VERIFIED'&&b.publicAccess==='UNAUTHENTICATED_PUBLIC_DOCUMENT'&&b.responseBodyHash===b.bodyHash,'LIVE_PUBLIC_DOCUMENT_PROOF');
 requireFundamental(/^https:\/\//.test(b.documentUrl)&&!new URL(b.documentUrl).username&&!new URL(b.documentUrl).password&&b.evidenceReference.length>0&&b.evidenceReference.length<=4000,'LIVE_PUBLIC_SOURCE_REFERENCE');
 requireFundamental(b.observationHash===hash(o)&&b.sourceVersionId===o.sourceVersionId&&o.transformationReferences.includes('document-sha256:'+b.bodyHash)&&b.retrievedAt===o.retrievedAt,'LIVE_PUBLIC_EXACT_OBSERVATION_BINDING');
 requireFundamental(b.retrievedAt<=b.verifiedAt&&b.verifiedAt<=assessedAt,'LIVE_PUBLIC_KNOWLEDGE_CHRONOLOGY');
 return deepFreeze({...b});
}
