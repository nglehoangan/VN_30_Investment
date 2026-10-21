import { readFileSync,realpathSync } from 'node:fs';
import { resolve,sep } from 'node:path';
import { createHash } from 'node:crypto';
import type { RuntimeEvidenceAuthority } from '@/ports/runtime-readiness';
import type { FormalLineageReceipt } from '@/domain/fundamentals/runtime-provenance';
import type { RuntimeAuthorityPin } from '@/domain/fundamentals/runtime-authority';
import type { MethodologyRecord } from '@/domain/methodology/record';
import { requireFundamental } from '@/domain/fundamentals/validation';
import { snapshotHash } from './snapshot-hash';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { exactJson } from '@/infrastructure/market-boundary/exact-json';
export interface RuntimeFilePin {readonly path:string;readonly sha256:string}
export interface LineageEvidenceFiles {
  readonly receipt:RuntimeFilePin;readonly canonicalRun:RuntimeFilePin;readonly raw:RuntimeFilePin;
  readonly normalization:RuntimeFilePin;readonly publication:RuntimeFilePin;readonly publishedAtPointer:string;
  /** Direct-PDF review receipt must itself be externally approved and pinned by composition. */
  readonly pdfQualification?:{readonly file:RuntimeFilePin;readonly pointer:string};
}
function pointer(raw:unknown,path:string):unknown {
  requireFundamental(path.startsWith('/'),'EXACT_JSON_POINTER_REQUIRED');
  return path.slice(1).split('/').reduce<unknown>((v,key)=>{
    const k=key.replace(/~1/g,'/').replace(/~0/g,'~');
    requireFundamental(v!==null&&typeof v==='object'&&Object.hasOwn(v,k),'LINEAGE_POINTER_MISSING');
    return (v as Record<string,unknown>)[k];
  },raw);
}
/** Exact files approved by trusted composition; no directory discovery or request-supplied pin registration. */
export class PinnedRuntimeEvidence implements RuntimeEvidenceAuthority {
  private readonly methods:readonly {readonly pin:RuntimeAuthorityPin;readonly method:MethodologyRecord}[];
  private readonly evidence:readonly LineageEvidenceFiles[];
  constructor(private readonly root:string,methods:readonly {readonly pin:RuntimeAuthorityPin;readonly method:MethodologyRecord}[],evidence:readonly LineageEvidenceFiles[]) {
    this.methods=deepFreeze(structuredClone(methods));this.evidence=deepFreeze(structuredClone(evidence));
  }
  private read(pin:RuntimeFilePin) {
    const root=realpathSync(this.root),file=realpathSync(resolve(root,pin.path));requireFundamental(file.startsWith(root+sep),'RUNTIME_SOURCE_PATH_ESCAPE');
    const bytes=readFileSync(file);requireFundamental(bytes.length<=32_000_000&&createHash('sha256').update(bytes).digest('hex')===pin.sha256,'RUNTIME_PIN_MISMATCH');return bytes;
  }
  async authority(hash:string) {return this.methods.find(m=>m.pin.hash===hash)??null;}
  async lineage(hash:string):Promise<FormalLineageReceipt|null> {
    for(const files of this.evidence) {
      const r=JSON.parse(this.read(files.receipt).toString('utf8')) as FormalLineageReceipt;
      if(snapshotHash(r)!==hash)continue;
      const canonical=this.read(files.canonicalRun),raw=this.read(files.raw),normalization=this.read(files.normalization),publication=this.read(files.publication);
      requireFundamental(files.canonicalRun.sha256===r.canonicalRunHash&&files.raw.sha256===r.sourceArtifactHash&&files.publication.sha256===r.publication.artifactHash,'LINEAGE_FILE_BINDING');
      const fact=pointer(JSON.parse(canonical.toString('utf8')),r.canonicalPointer) as {id:string;value:string;itemId:string;ticker:string;scope:string;period:{start:string;end:string}};
      requireFundamental(fact.id===r.canonicalFactId,'CANONICAL_FACT_ID_MISMATCH');
      const n=JSON.parse(normalization.toString('utf8')) as {observations:readonly {normalized:{value:string;unit:string};raw:{lexicalValue:string};itemId:string;ticker:string;reportingScope:string;periodStart:string;periodEnd:string}[]};
      const o=n.observations.find(o=>snapshotHash(o)===r.observationHash);
      requireFundamental(snapshotHash(n)===r.normalizationHash&&o&&o.normalized.value===fact.value&&o.itemId===fact.itemId&&o.ticker===fact.ticker&&o.reportingScope===fact.scope&&o.periodStart===fact.period.start&&o.periodEnd===fact.period.end,'NORMALIZATION_CANONICAL_BINDING');
      // Raw cells are verified as present. Normalization artifact retains declared scale and exact lexical value.
      if(files.pdfQualification){
        requireFundamental(raw.subarray(0,5).toString()==='%PDF-','PDF_BYTES_REQUIRED');
        const q=pointer(JSON.parse(this.read(files.pdfQualification.file).toString('utf8')),files.pdfQualification.pointer) as {status:string;approvalReference:string;sourceHash:string;page:number;box:readonly number[];nativeValue:string;normalizedValue:string;unit:string;scope:string;periodStart:string;periodEnd:string;ticker:string;itemId:string};
        requireFundamental(q.status==='REVIEWED'&&q.approvalReference.trim()&&q.sourceHash===r.sourceArtifactHash&&Number.isInteger(q.page)&&q.page>0&&r.sourcePointer.endsWith('#page='+q.page)&&
          q.box.length===4&&q.box.every(v=>Number.isFinite(v)&&v>=0&&v<=1)&&q.box[0]<q.box[2]&&q.box[1]<q.box[3]&&
          q.nativeValue===o.raw.lexicalValue&&q.normalizedValue===o.normalized.value&&q.unit===o.normalized.unit&&q.scope===o.reportingScope&&q.periodStart===o.periodStart&&q.periodEnd===o.periodEnd&&q.ticker===o.ticker&&q.itemId===o.itemId,'DIRECT_PDF_QUALIFICATION_REQUIRED');
      }else requireFundamental(pointer(exactJson(raw.toString('utf8')),r.sourcePointer)===o.raw.lexicalValue,'RAW_CELL_VALUE_MISMATCH');
      requireFundamental(pointer(JSON.parse(publication.toString('utf8')),files.publishedAtPointer)===r.publication.publishedAt,'PUBLICATION_METADATA_MISMATCH');
      return deepFreeze(r);
    }
    return null;
  }
}
