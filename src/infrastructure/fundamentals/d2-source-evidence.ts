import {readFileSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import type {MethodologyRecord} from '@/domain/methodology/record';
import type {FundamentalObservation,FundamentalSourceVersion,RegistryRelease} from '@/domain/fundamentals/contracts';
import type {SourcePublicationContract} from '@/domain/fundamentals/source-publication';
import type {PublicationCapturePin} from './source-publication';
import {assessD2Availability,type D2Cutoff,type D2IdentityBinding,type D2KnowledgeEvidence} from '@/domain/fundamentals/d2-availability';
import {requireFundamental,fundamentalHash} from '@/domain/fundamentals/validation';
import {deepFreeze} from '@/domain/portfolio/transaction';
import {snapshotHash} from './snapshot-hash';
export interface D2FilingPin {
 readonly observationHash:string;readonly observationPath:string;readonly observationSha256:string;
 readonly documentPath:string;readonly documentRetrievedAt:string;readonly documentVerifiedAt:string;
 readonly identityBinding:D2IdentityBinding;readonly identityMethod:MethodologyRecord|null;
 readonly publicationCaptures:readonly PublicationCapturePin[];
 readonly knowledgePath:string;readonly knowledgeSha256:string;readonly requiredOtherBoundaryIds:readonly string[];
}
export interface D2EvidenceConfiguration {
 readonly source:FundamentalSourceVersion;readonly registry:RegistryRelease;
 readonly sourceContract:SourcePublicationContract;readonly sourceMethod:MethodologyRecord|null;
 readonly filings:readonly D2FilingPin[];
}
/** Configured immutable read-only verifier; never accepts request-supplied files, clocks or source approvals.
 * Deliberately not composed into production admission or any active authority. */
export class PinnedD2Availability {
 private readonly config:D2EvidenceConfiguration;
 constructor(private readonly root:string,config:D2EvidenceConfiguration){this.config=deepFreeze(structuredClone(config));}
 private read(path:string,expected:string,maxBytes=8_000_000){
  fundamentalHash(expected);const root=realpathSync(this.root),target=realpathSync(resolve(root,path));
  requireFundamental(target.startsWith(root+sep),'D2_SOURCE_PATH_ESCAPE');
  const bytes=readFileSync(target);requireFundamental(bytes.length<=maxBytes&&createHash('sha256').update(bytes).digest('hex')===expected,'D2_IMMUTABLE_SOURCE_HASH');return bytes;
 }
 assess(observationHash:string,cutoff:D2Cutoff){
  fundamentalHash(observationHash);const matches=this.config.filings.filter(f=>f.observationHash===observationHash);requireFundamental(matches.length===1,'D2_EXACT_CONFIGURED_FILING_REQUIRED');const pin=matches[0];
  const observation=JSON.parse(this.read(pin.observationPath,pin.observationSha256).toString('utf8')) as FundamentalObservation;
  requireFundamental(snapshotHash(observation)===observationHash,'D2_CONFIGURED_OBSERVATION_HASH');
  this.read(pin.documentPath,pin.identityBinding.documentHash,200_000_000);
  const knowledge=JSON.parse(this.read(pin.knowledgePath,pin.knowledgeSha256).toString('utf8')) as D2KnowledgeEvidence;
  const publicationCaptures=pin.publicationCaptures.map(p=>({sourceVersionId:p.sourceVersionId,sourceHash:p.sourceHash,artifactHash:p.sha256,
   payload:JSON.parse(this.read(p.path,p.sha256).toString('utf8')),retrievedAt:p.retrievedAt,verifiedAt:p.verifiedAt,reference:p.reference}));
  return assessD2Availability({observation,registry:this.config.registry,source:this.config.source,sourceContract:this.config.sourceContract,sourceMethod:this.config.sourceMethod,
   identityBinding:pin.identityBinding,identityMethod:pin.identityMethod,evidence:{observationHash,sourceVersionId:this.config.source.id,sourceHash:snapshotHash(this.config.source),
    filing:{ticker:pin.identityBinding.ticker,documentUrl:pin.identityBinding.documentUrl,documentHash:pin.identityBinding.documentHash},
    documentRetrievedAt:pin.documentRetrievedAt,documentVerifiedAt:pin.documentVerifiedAt,publicationCaptures,
    requiredOtherBoundaryIds:pin.requiredOtherBoundaryIds,knowledge,identityBindingHash:snapshotHash(pin.identityBinding),immutableEvidenceHash:snapshotHash(pin)},cutoff,hash:snapshotHash});
 }
}
