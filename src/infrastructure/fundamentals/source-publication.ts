import {readFileSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import type {MethodologyRecord} from '@/domain/methodology/record';
import {assessSourcePublication,type SourcePublicationContract,type PublicationDocumentBinding} from '@/domain/fundamentals/source-publication';
import {requireFundamental} from '@/domain/fundamentals/validation';
import {snapshotHash} from './snapshot-hash';
import {deepFreeze} from '@/domain/portfolio/transaction';
export interface PublicationCapturePin {
  readonly path:string;readonly sha256:string;readonly sourceVersionId:string;readonly sourceHash:string;
  readonly retrievedAt:string;readonly verifiedAt:string;readonly reference:string;
}
export interface TrustedPublicationDocument extends PublicationDocumentBinding {readonly publicationCaptureHash:string}
/** A configured immutable source capture only; no fetch, discovery, authority registration or admission. */
export class PinnedSourcePublication {
  private readonly selected:SourcePublicationContract;
  private readonly method:MethodologyRecord|null;
  private readonly documents:readonly TrustedPublicationDocument[];
  private readonly captures:readonly PublicationCapturePin[];
  constructor(private readonly root:string,contract:SourcePublicationContract,method:MethodologyRecord|null,documents:readonly TrustedPublicationDocument[],captures:readonly PublicationCapturePin[]){this.selected=deepFreeze(structuredClone(contract));this.method=method?deepFreeze(structuredClone(method)):null;this.documents=deepFreeze(structuredClone(documents));this.captures=deepFreeze(structuredClone(captures));}
  assess(captureHash:string,documentHash:string,at:string){
    const pin=this.captures.find(p=>p.sha256===captureHash);requireFundamental(pin,'TRUSTED_PUBLICATION_CAPTURE_REQUIRED');
    const root=realpathSync(this.root),path=realpathSync(resolve(root,pin.path));requireFundamental(path.startsWith(root+sep),'PUBLICATION_PATH_ESCAPE');
    const bytes=readFileSync(path);requireFundamental(bytes.length<=8_000_000&&createHash('sha256').update(bytes).digest('hex')===pin.sha256,'PUBLICATION_CAPTURE_HASH');
    const document=this.documents.find(d=>d.documentHash===documentHash&&d.publicationCaptureHash===pin.sha256);requireFundamental(document,'TRUSTED_PUBLICATION_DOCUMENT_BINDING_REQUIRED');
    return assessSourcePublication(this.selected,this.method,{sourceVersionId:pin.sourceVersionId,sourceHash:pin.sourceHash,artifactHash:pin.sha256,payload:JSON.parse(bytes.toString('utf8')),retrievedAt:pin.retrievedAt,verifiedAt:pin.verifiedAt,reference:pin.reference},document,at,snapshotHash);
  }
}
