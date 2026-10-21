import type { PublicationProvenance } from './contracts';
import type { MethodologyRecord } from '@/domain/methodology/record';
import { dateOnly,instant } from '@/shared/time';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { fundamentalHash,requireFundamental } from './validation';

export interface SourcePublicationContract {
  readonly version:string;readonly sourceVersionId:string;readonly sourceHash:string;
  readonly governanceStatus:'PROPOSED'|'APPROVED';readonly approvalReference:string|null;
  readonly semantics:'PUBLIC_DISCLOSURE_EVENT';
  readonly sourceKind:'ISSUER_DISCLOSURE'|'EXCHANGE_DISCLOSURE'|'OFFICIAL_SOURCE_METADATA'|'APPROVED_API_PUBLICATION';
  readonly precision:'TIMESTAMP'|'DATE_ONLY';readonly timezone:'UTC'|'Asia/Ho_Chi_Minh';
  readonly fields:{readonly publication:string;readonly ticker:string;readonly documentUrl:string};
  readonly recordedAt:string;readonly effectiveFrom:string;readonly effectiveThrough:string|null;
}
export interface PublicationMetadataCapture {
  readonly sourceVersionId:string;readonly sourceHash:string;readonly artifactHash:string;
  readonly payload:unknown;readonly retrievedAt:string;readonly verifiedAt:string;readonly reference:string;
}
export interface PublicationDocumentBinding {readonly ticker:string;readonly documentHash:string;readonly documentUrl:string}
function atPointer(raw:unknown,path:string):unknown {
  requireFundamental(path.startsWith('/')&&!/~(?![01])/u.test(path),'PUBLICATION_JSON_POINTER');
  return path.slice(1).split('/').reduce<unknown>((v,k)=>{
    const key=k.replace(/~1/g,'/').replace(/~0/g,'~');
    requireFundamental(v!==null&&typeof v==='object'&&Object.hasOwn(v,key),'PUBLICATION_FIELD_ABSENT');
    return (v as Record<string,unknown>)[key];
  },raw);
}
/** Publication proof only. Existing availability policy still owns operational/date-only cutoffs. */
export function assessSourcePublication(contract:SourcePublicationContract,method:MethodologyRecord|null,capture:PublicationMetadataCapture,filing:PublicationDocumentBinding,assessedAt:string,hash:(v:unknown)=>string) {
  [capture.retrievedAt,capture.verifiedAt,assessedAt,contract.recordedAt,contract.effectiveFrom].forEach(instant);
  [contract.sourceHash,capture.sourceHash,capture.artifactHash,filing.documentHash].forEach(fundamentalHash);
  requireFundamental(capture.retrievedAt<=capture.verifiedAt&&capture.verifiedAt<=assessedAt,'PUBLICATION_CAPTURE_CHRONOLOGY');
  const contractHash=hash(contract);
  const blocked=(reason:string,state:'UNPROVEN'|'CONFLICTED'='UNPROVEN')=>deepFreeze({status:state,reason,publication:null,filing,contractHash,artifactHash:capture.artifactHash,knownAt:null,historicalAdmissionGranted:false as const});
  if(contract.governanceStatus!=='APPROVED'||!contract.approvalReference||!method||method.governanceStatus!=='APPROVED'||method.intendedUse!=='PRODUCTION'||
    method.approvalReference!==contract.approvalReference||method.configurationReference!=='source-publication-authority-sha256:'+contractHash)return blocked('SOURCE_PUBLICATION_AUTHORITY_NOT_APPROVED');
  if(contract.semantics!=='PUBLIC_DISCLOSURE_EVENT'||!['ISSUER_DISCLOSURE','EXCHANGE_DISCLOSURE','OFFICIAL_SOURCE_METADATA','APPROVED_API_PUBLICATION'].includes(contract.sourceKind))return blocked('TIMESTAMP_SEMANTICS_NOT_PUBLICATION');
  const field=contract.fields.publication.split('/').at(-1)!.replace(/~1/g,'/').replace(/~0/g,'~').replace(/[_-]/g,'').toLowerCase();
  if(['periodstart','periodend','reportdate','reportasof','retrievedat','ingestedat','systemingestedat','createdat','creationdate','modifiedat','modificationdate','signedat','signingdate'].includes(field))return blocked('NON_PUBLICATION_CLOCK_FIELD');
  if(contract.sourceVersionId!==capture.sourceVersionId||contract.sourceHash!==capture.sourceHash)return blocked('PUBLICATION_SOURCE_IDENTITY_CONFLICT','CONFLICTED');
  if(contract.effectiveThrough!==null){instant(contract.effectiveThrough);requireFundamental(contract.effectiveThrough>contract.effectiveFrom,'PUBLICATION_AUTHORITY_INTERVAL');}
  if(method.recordedAt>assessedAt||contract.recordedAt>assessedAt||contract.effectiveFrom>assessedAt||method.effectiveDate>assessedAt.slice(0,10)||
    contract.effectiveThrough!==null&&assessedAt>=contract.effectiveThrough)return blocked('PUBLICATION_AUTHORITY_NOT_EFFECTIVE');
  requireFundamental(filing.ticker.trim()&&/^https:\/\//.test(filing.documentUrl)&&capture.reference.trim(),'PUBLICATION_DOCUMENT_REFERENCE');
  const ticker=atPointer(capture.payload,contract.fields.ticker),url=atPointer(capture.payload,contract.fields.documentUrl),value=atPointer(capture.payload,contract.fields.publication);
  if(ticker!==filing.ticker||url!==filing.documentUrl)return blocked('PUBLICATION_DOCUMENT_IDENTITY_CONFLICT','CONFLICTED');
  if(typeof value!=='string')return blocked('PUBLICATION_METADATA_ABSENT');
  let publication:PublicationProvenance;
  if(contract.precision==='TIMESTAMP'){
    requireFundamental(contract.timezone==='UTC','PUBLICATION_TIMESTAMP_ZONE');instant(value);
    if(value>capture.retrievedAt)return blocked('PUBLICATION_AFTER_RETRIEVAL','CONFLICTED');
    publication={publishedAt:value,publicationDate:null,publicationPrecision:'TIMESTAMP',publicationStatus:'VERIFIED',timezone:'UTC',evidenceReference:capture.reference};
  }else{
    requireFundamental(contract.precision==='DATE_ONLY'&&['UTC','Asia/Ho_Chi_Minh'].includes(contract.timezone),'PUBLICATION_PRECISION');dateOnly(value);
    const start=Date.parse(value+'T00:00:00.000Z')-(contract.timezone==='Asia/Ho_Chi_Minh'?7*3600000:0);
    if(start>Date.parse(capture.retrievedAt))return blocked('PUBLICATION_DAY_AFTER_RETRIEVAL','CONFLICTED');
    publication={publishedAt:null,publicationDate:value,publicationPrecision:'DATE_ONLY',publicationStatus:'VERIFIED',timezone:contract.timezone,evidenceReference:capture.reference};
  }
  return deepFreeze({status:'PROVEN' as const,reason:null,publication,filing,contractHash,artifactHash:capture.artifactHash,
    knownAt:[capture.retrievedAt,capture.verifiedAt,contract.recordedAt,method.recordedAt].sort().at(-1)!,historicalAdmissionGranted:false as const});
}
