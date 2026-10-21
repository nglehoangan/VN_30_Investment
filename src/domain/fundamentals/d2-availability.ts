import candidate from './d2-policy-candidate-v1.json' with {type:'json'};
import type {FundamentalObservation,FundamentalSourceVersion,RegistryRelease} from './contracts';
import type {MethodologyRecord} from '@/domain/methodology/record';
import type {PublicationMetadataCapture,PublicationDocumentBinding,SourcePublicationContract} from './source-publication';
import {assessSourcePublication} from './source-publication';
import {validateFundamentalObservation,validateFundamentalSource,requireFundamental,fundamentalHash} from './validation';
import {dateOnly,instant} from '@/shared/time';
import {canonicalJson} from './snapshot';
import {deepFreeze} from '@/domain/portfolio/transaction';
export const D2_POLICY_CANDIDATE=deepFreeze(candidate);
export interface D2IdentityBinding {
 readonly version:string;readonly governanceStatus:'PROPOSED'|'APPROVED';readonly approvalReference:string|null;
 readonly sourceVersionId:string;readonly sourceHash:string;readonly sourceContractHash:string;
 readonly ticker:string;readonly documentUrl:string;readonly documentHash:string;
 readonly publicationCaptures:readonly {readonly sha256:string;readonly pageUrl:string}[];
 readonly recordedAt:string;
}
export interface D2KnowledgeEvidence {
 readonly observationHash:string;readonly sourceVersionId:string;readonly sourceHash:string;
 readonly documentHash:string;readonly registryHash:string;readonly mappingVersion:string;
 readonly mappingKnownAt:string;readonly mappingEvidenceReference:string;
 readonly methodologyKnownAt:string;readonly methodologyEvidenceReference:string;
 readonly otherBoundaries:readonly {readonly id:string;readonly at:string;readonly evidenceReference:string}[];
}
/** Configured verifier provides immutable captures/document bytes/knowledge evidence. This is not request authority. */
export interface D2SourceEvidence {
 readonly observationHash:string;readonly sourceVersionId:string;readonly sourceHash:string;
 readonly filing:PublicationDocumentBinding;readonly documentRetrievedAt:string;readonly documentVerifiedAt:string;
 readonly publicationCaptures:readonly PublicationMetadataCapture[];
 readonly requiredOtherBoundaryIds:readonly string[];readonly knowledge:D2KnowledgeEvidence;
 readonly immutableEvidenceHash:string;readonly identityBindingHash:string;
}
export interface D2Cutoff {readonly decisionAsOf:string;readonly systemKnownAt:string;readonly assessedAt:string}
function reference(v:string){requireFundamental(typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=4000&&!/[\x00-\x1f<>]/.test(v),'D2_REQUIRED_EVIDENCE_REFERENCE');}
function exact(v:object,keys:string){requireFundamental(v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(' ')===keys.split(' ').sort().join(' '),'D2_EXACT_FIELDS');}
/** UTC+7 has no DST in the supported calendar range. Never returns an asserted publication timestamp. */
export function d2ConservativeBoundary(publicationDate:string){
 dateOnly(publicationDate);
 const boundary=new Date(Date.parse(publicationDate+'T00:00:00.000Z')+17*3600000).toISOString();
 instant(boundary);return boundary;
}
/** Evidence-only evaluation. No registry write, FORMAL admission, approved availability receipt or activation. */
export function assessD2Availability(input:{observation:FundamentalObservation;registry:RegistryRelease;source:FundamentalSourceVersion;sourceContract:SourcePublicationContract;sourceMethod:MethodologyRecord|null;identityBinding:D2IdentityBinding;identityMethod:MethodologyRecord|null;evidence:D2SourceEvidence;cutoff:D2Cutoff;hash:(v:unknown)=>string}){
 const {registry,source,sourceContract,sourceMethod,identityBinding:identity,identityMethod,evidence:e,cutoff,hash}=input;
 exact(cutoff,'decisionAsOf systemKnownAt assessedAt');Object.values(cutoff).forEach(instant);
 requireFundamental(cutoff.systemKnownAt<=cutoff.decisionAsOf&&cutoff.decisionAsOf<=cutoff.assessedAt,'D2_CUTOFF_ORDER');
 const o=validateFundamentalObservation(input.observation,registry);validateFundamentalSource(source);
 const k=e.knowledge;exact(k,'observationHash sourceVersionId sourceHash documentHash registryHash mappingVersion mappingKnownAt mappingEvidenceReference methodologyKnownAt methodologyEvidenceReference otherBoundaries');
 [e.identityBindingHash,e.observationHash,e.sourceHash,e.filing.documentHash,e.immutableEvidenceHash,k.observationHash,k.sourceHash,k.documentHash,k.registryHash].forEach(fundamentalHash);
 [e.documentRetrievedAt,e.documentVerifiedAt,k.mappingKnownAt,k.methodologyKnownAt,identity.recordedAt,source.recordedAt,registry.manifest.recordedAt,D2_POLICY_CANDIDATE.recordedAt].forEach(instant);
 [k.mappingEvidenceReference,k.methodologyEvidenceReference].forEach(reference);
 requireFundamental(hash(registry.manifest)===registry.registryHash,'D2_REGISTRY_HASH_MISMATCH');
 requireFundamental(o.scope==='FORMAL'&&o.quality==='VALID'&&o.normalized.value!==null&&o.applicability==='APPLICABLE'&&o.scopeFallback===null,'D2_QUALIFIED_FORMAL_OBSERVATION_REQUIRED');
 requireFundamental(e.observationHash===hash(o)&&k.observationHash===hash(o)&&o.sourceVersionId===source.id&&e.sourceVersionId===source.id&&k.sourceVersionId===source.id&&
  e.sourceHash===hash(source)&&k.sourceHash===hash(source)&&sourceContract.sourceHash===hash(source)&&sourceContract.sourceVersionId===source.id&&
  k.documentHash===e.filing.documentHash&&k.registryHash===registry.registryHash&&o.registryHash===registry.registryHash&&k.mappingVersion===o.mappingVersion&&
  o.ticker===e.filing.ticker&&o.transformationReferences.includes('document-sha256:'+e.filing.documentHash)&&o.retrievedAt===e.documentRetrievedAt,'D2_EXACT_SOURCE_DOCUMENT_OBSERVATION_BINDING');
 requireFundamental(e.documentRetrievedAt<=e.documentVerifiedAt&&e.documentVerifiedAt<=cutoff.assessedAt,'D2_DOCUMENT_VERIFICATION_CHRONOLOGY');
 requireFundamental(Array.isArray(e.publicationCaptures)&&e.publicationCaptures.length>0&&new Set(e.publicationCaptures.map(c=>c.artifactHash)).size===e.publicationCaptures.length,'D2_IMMUTABLE_PUBLICATION_CAPTURES_REQUIRED');
 requireFundamental(Array.isArray(e.requiredOtherBoundaryIds)&&new Set(e.requiredOtherBoundaryIds).size===e.requiredOtherBoundaryIds.length,'D2_REQUIRED_BOUNDARY_IDS');e.requiredOtherBoundaryIds.forEach(reference);
 requireFundamental(Array.isArray(k.otherBoundaries)&&new Set(k.otherBoundaries.map(b=>b.id)).size===k.otherBoundaries.length&&e.requiredOtherBoundaryIds.every(id=>k.otherBoundaries.some(b=>b.id===id)),'D2_REQUIRED_CONTRACT_BOUNDARY_MISSING');
 k.otherBoundaries.forEach(b=>{exact(b,'id at evidenceReference');reference(b.id);reference(b.evidenceReference);instant(b.at);});
 const boundaries:{kind:string;at:string;reference:string}[]=[];
 const add=(kind:string,at:string,ref:string)=>{instant(at);reference(ref);boundaries.push({kind,at,reference:ref});};
 const policyHash=hash(D2_POLICY_CANDIDATE);
 const seal=<T extends object>(body:T)=>deepFreeze({...body,contentHash:hash(body)});
 const blocked=(finding:string,publicBoundary:string|null=null,effectiveKnownAt:string|null=null)=>seal({contract:'d2-availability-candidate-assessment-v1',cutoff:{...cutoff},status:'BLOCKED' as const,finding,publication:o.publication,publicBoundary,effectiveKnownAt,asKnownEligible:false,policyHash,observationHash:hash(o),immutableEvidenceHash:e.immutableEvidenceHash,boundaries,admissionAuthorized:false as const,productionActivated:false as const});
 exact(identity,'version governanceStatus approvalReference sourceVersionId sourceHash sourceContractHash ticker documentUrl documentHash publicationCaptures recordedAt');
 if(identity.governanceStatus!=='APPROVED'||!identity.approvalReference||!identityMethod||identityMethod.governanceStatus!=='APPROVED'||identityMethod.intendedUse!=='PRODUCTION'||identityMethod.approvalReference!==identity.approvalReference||identityMethod.configurationReference!=='d2-source-identity-sha256:'+hash(identity))return blocked('D2_SOURCE_IDENTITY_NOT_APPROVED');
 requireFundamental(e.identityBindingHash===hash(identity)&&identity.sourceVersionId===source.id&&identity.sourceHash===hash(source)&&identity.sourceContractHash===hash(sourceContract)&&identity.ticker===o.ticker&&identity.documentHash===e.filing.documentHash&&identity.documentUrl===e.filing.documentUrl,'D2_APPROVED_IDENTITY_BINDING_MISMATCH');
 requireFundamental(Array.isArray(identity.publicationCaptures)&&identity.publicationCaptures.length===e.publicationCaptures.length&&new Set(identity.publicationCaptures.map(p=>p.sha256)).size===identity.publicationCaptures.length&&identity.publicationCaptures.every(p=>e.publicationCaptures.some(c=>c.artifactHash===p.sha256)),'D2_IDENTITY_CAPTURE_SET_MISMATCH');
 identity.publicationCaptures.forEach(p=>{fundamentalHash(p.sha256);reference(p.pageUrl);requireFundamental(/^https:\/\//.test(p.pageUrl)&&!new URL(p.pageUrl).username&&!new URL(p.pageUrl).password,'D2_AUTHORITATIVE_PAGE_REFERENCE');});
 if(o.periodEnd>cutoff.decisionAsOf.slice(0,10)||sourceContract.effectiveFrom>cutoff.decisionAsOf||sourceMethod&&sourceMethod.effectiveDate>cutoff.decisionAsOf.slice(0,10)||identityMethod.effectiveDate>cutoff.decisionAsOf.slice(0,10))return blocked('D2_PERIOD_OR_AUTHORITY_NOT_EFFECTIVE_AT_CUTOFF');
 if(o.publication.publicationStatus!=='VERIFIED')return blocked('D2_PUBLICATION_UNVERIFIED');
 if(o.publication.publicationPrecision==='DATE_ONLY'&&(!D2_POLICY_CANDIDATE.dateOnlySourceKinds.includes(sourceContract.sourceKind)||sourceContract.timezone!=='Asia/Ho_Chi_Minh'||o.publication.timezone!=='Asia/Ho_Chi_Minh'||o.publication.publishedAt!==null))return blocked('D2_AUTHORITATIVE_ISSUER_EXCHANGE_DATE_ONLY_REQUIRED');
 const proofs=e.publicationCaptures.map(c=>assessSourcePublication(sourceContract,sourceMethod,c,e.filing,cutoff.assessedAt,hash));
 if(proofs.some(p=>p.status!=='PROVEN'||p.publication===null))return blocked('D2_SOURCE_PUBLICATION_NOT_PROVEN');
 const semantic=(p:FundamentalObservation['publication'])=>canonicalJson({publishedAt:p.publishedAt,publicationDate:p.publicationDate,publicationPrecision:p.publicationPrecision,publicationStatus:p.publicationStatus,timezone:p.timezone});
 if(new Set(proofs.map(p=>semantic(p.publication!))).size!==1||proofs.some(p=>semantic(p.publication!)!==semantic(o.publication)))return blocked('D2_CONFLICTING_PUBLICATION_EVIDENCE');
 if(!e.publicationCaptures.some(c=>c.reference===o.publication.evidenceReference))return blocked('D2_PUBLICATION_REFERENCE_UNBOUND');
 const pub=o.publication;
 const publicBoundary=pub.publicationPrecision==='DATE_ONLY'?d2ConservativeBoundary(pub.publicationDate!):pub.publicationPrecision==='TIMESTAMP'?pub.publishedAt:null;
 if(publicBoundary===null)return blocked('D2_PUBLICATION_PRECISION_UNKNOWN');
 add(pub.publicationPrecision==='DATE_ONLY'?'CONSERVATIVE_DATE_ONLY_BOUNDARY':'EXACT_PUBLICATION_TIMESTAMP',publicBoundary,pub.evidenceReference!);
 add('DOCUMENT_RETRIEVAL',e.documentRetrievedAt,'document-sha256:'+e.filing.documentHash);add('DOCUMENT_VERIFICATION',e.documentVerifiedAt,'verified-document-sha256:'+e.filing.documentHash);
 add('INGESTION',o.ingestedAt,'observation:'+o.id);add('MAPPING_KNOWLEDGE',k.mappingKnownAt,k.mappingEvidenceReference);add('METHODOLOGY_KNOWLEDGE',k.methodologyKnownAt,k.methodologyEvidenceReference);
 add('SOURCE_KNOWLEDGE',source.recordedAt,'source-sha256:'+hash(source));add('REGISTRY_KNOWLEDGE',registry.manifest.recordedAt,'registry-sha256:'+registry.registryHash);
 add('IDENTITY_KNOWLEDGE',identity.recordedAt,'d2-source-identity-sha256:'+hash(identity));add('IDENTITY_METHOD_KNOWLEDGE',identityMethod.recordedAt,'identity-method-sha256:'+hash(identityMethod));
 add('SOURCE_CONTRACT_EFFECTIVE_FROM',sourceContract.effectiveFrom,'source-contract-sha256:'+hash(sourceContract));
 add('D2_POLICY_KNOWLEDGE',D2_POLICY_CANDIDATE.recordedAt,'d2-policy-sha256:'+policyHash);
 add('SOURCE_CONTRACT_KNOWLEDGE',sourceContract.recordedAt,'source-contract-sha256:'+hash(sourceContract));add('SOURCE_METHOD_KNOWLEDGE',sourceMethod!.recordedAt,'source-method-sha256:'+hash(sourceMethod));
 for(const c of e.publicationCaptures){add('METADATA_RETRIEVAL',c.retrievedAt,c.reference);add('METADATA_VERIFICATION',c.verifiedAt,c.reference);}
 if(o.providerReceivedAt!==null)add('PROVIDER_RECEIPT_LOWER_BOUND_ONLY',o.providerReceivedAt,o.providerReceiptReference!);
 if(o.correctionKnownAt!==null)add('CORRECTION_KNOWLEDGE',o.correctionKnownAt,o.revisionEvidenceReference!);
 for(const b of k.otherBoundaries)add('CONTRACT:'+b.id,b.at,b.evidenceReference);
 requireFundamental(boundaries.filter(b=>b.kind!=='CONSERVATIVE_DATE_ONLY_BOUNDARY').every(b=>b.at<=cutoff.assessedAt),'D2_REQUIRED_KNOWLEDGE_AFTER_ASSESSMENT');
 const effectiveKnownAt=boundaries.map(b=>b.at).sort().at(-1)!;
 if(effectiveKnownAt>cutoff.systemKnownAt||publicBoundary>cutoff.decisionAsOf)return blocked('D2_AS_KNOWN_LOOKAHEAD',publicBoundary,effectiveKnownAt);
 return seal({contract:'d2-availability-candidate-assessment-v1',cutoff:{...cutoff},status:'QUALIFIED_CANDIDATE' as const,finding:null,publication:pub,publicBoundary,effectiveKnownAt,asKnownEligible:true,policyHash,observationHash:hash(o),immutableEvidenceHash:e.immutableEvidenceHash,boundaries,admissionAuthorized:false as const,productionActivated:false as const});
}
