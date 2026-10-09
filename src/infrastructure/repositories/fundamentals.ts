import { createHash } from 'node:crypto';
import type { PrismaClient, Prisma } from '@/infrastructure/db/generated/client';
import { PrismaMethodologyRegistry } from './methodology-registry';
import { loadCanonicalRegistry, verifyRegistryApproval } from '@/infrastructure/fundamentals/canonical-registry';
import type { RegistryRelease, RegistryApprovalBinding, FundamentalSourceVersion, FundamentalImportBatch, FundamentalRawCapture, FundamentalObservation } from '@/domain/fundamentals/contracts';
import { fundamentalId, requireFundamental, validateFundamentalSource, validateFundamentalBatch, validateFundamentalCapture, validateFundamentalObservation } from '@/domain/fundamentals/validation';
import type { FundamentalRepository } from '@/ports/fundamentals';
import { ConflictError, DataIntegrityError } from '@/shared/errors';
import { comparableKey } from '@/domain/fundamentals/normalization';
import { methodologyId } from '@/shared/ids';

const hash=(body:string)=>createHash('sha256').update(body).digest('hex');
const encode=(value:unknown)=>{const body=JSON.stringify(value);return {body,bodyHash:hash(body)};};
function stored<T>(row:{id:string;body:string;bodyHash:string}, validate:(value:T)=>T): T {
  requireFundamental(hash(row.body)===row.bodyHash,'FUNDAMENTAL_BODY_HASH_MISMATCH');
  const result=validate(JSON.parse(row.body));requireFundamental((result as {id:string}).id===row.id,'FUNDAMENTAL_ID_MISMATCH');return result;
}
function failure(error:unknown):never {
  if(error&&typeof error==='object'&&'code' in error&&error.code==='P2002')throw new ConflictError();
  throw new DataIntegrityError({cause:error});
}
/** All IO is here. Never selects latest values, derives availability or posts ledger facts. */
export class PrismaFundamentals implements FundamentalRepository {
  private readonly release:RegistryRelease;
  private readonly binding:RegistryApprovalBinding|null;
  constructor(private readonly client:PrismaClient | Prisma.TransactionClient,release:RegistryRelease=loadCanonicalRegistry(),binding:RegistryApprovalBinding|null=null) {
    const verified=loadCanonicalRegistry(release.manifest);
    requireFundamental(verified.registryHash===release.registryHash,'REGISTRY_RELEASE_HASH_MISMATCH');
    this.release=verified;this.binding=binding?Object.freeze({...binding}):null;
  }
  private async verifyFormal(o:FundamentalObservation) {
    if(o.scope==='FORMAL') {
      const method=await new PrismaMethodologyRegistry(this.client).findById(methodologyId(this.release.manifest.methodologyIdentity));
      verifyRegistryApproval(this.release,this.binding,method);
      requireFundamental(this.release.manifest.recordedAt<=o.ingestedAt && this.release.manifest.effectiveDate<=o.ingestedAt.slice(0,10) && method!.recordedAt<=o.ingestedAt,'REGISTRY_NOT_KNOWN_AT_INGESTION');
    }
  }
  async appendSource(raw:FundamentalSourceVersion) {
    const s=validateFundamentalSource(raw);
    try{await this.client.fundamentalSourceVersion.create({data:{id:s.id,recordedAt:s.recordedAt,...encode(s)}});}catch(error){failure(error);}
  }
  async appendImport(raw:FundamentalImportBatch,rawCaptures:readonly FundamentalRawCapture[]) {
    const b=validateFundamentalBatch(raw),captures=rawCaptures.map(validateFundamentalCapture);
    requireFundamental(captures.length===b.captureIds.length && new Set(captures.map(c=>c.id)).size===captures.length && captures.every(c=>b.captureIds.includes(c.id)),'CAPTURE_MANIFEST_MISMATCH');
    for(const c of captures){
      requireFundamental(c.sourceVersionId===b.sourceVersionId && c.importExecutionId===b.id && b.startedAt<=c.retrievedAt && c.retrievedAt<=b.completedAt,'CAPTURE_BATCH_MISMATCH');
      requireFundamental(hash(c.payload)===c.payloadHash,'RAW_PAYLOAD_HASH_MISMATCH');
    }
    const insert = async (tx: Prisma.TransactionClient) => {
      await tx.fundamentalImportBatch.create({data:{id:b.id,sourceVersionId:b.sourceVersionId,completedAt:b.completedAt,...encode(b)}});
      for(const c of captures)await tx.fundamentalRawCapture.create({data:{id:c.id,sourceVersionId:c.sourceVersionId,importExecutionId:c.importExecutionId,retrievedAt:c.retrievedAt,payloadHash:c.payloadHash,...encode(c)}});
    };
    try{if ('$transaction' in this.client) await this.client.$transaction(insert); else await insert(this.client);}catch(error){failure(error);}
  }
  async appendObservation(raw:FundamentalObservation) {
    const o=validateFundamentalObservation(raw,this.release);
    await this.verifyFormal(o);
    const c=await this.findCapture(o.rawCaptureId);
    requireFundamental(c && c.sourceVersionId===o.sourceVersionId && c.retrievedAt===o.retrievedAt && c.responseStatus>=200 && c.responseStatus<300,'OBSERVATION_CAPTURE_MISMATCH');
    const batch=await this.findImport(c.importExecutionId);
    requireFundamental(batch && batch.ingestedAt<=o.ingestedAt,'OBSERVATION_BEFORE_BATCH_INGESTION');
    if(o.supersedesObservationId!==null){
      const old=await this.findObservation(o.supersedesObservationId);
      requireFundamental(old&&comparableKey(old)===comparableKey(o)&&old.ingestedAt<=o.ingestedAt&&o.correctionKnownAt!==null&&old.ingestedAt<=o.correctionKnownAt,'REVISION_PREDECESSOR_MISMATCH');
      if(o.revisionKind==='PROVIDER_CORRECTION'||o.revisionKind==='MAPPING_CORRECTION')requireFundamental(JSON.stringify(old.publication)===JSON.stringify(o.publication),'CORRECTION_CANNOT_INVENT_ISSUER_PUBLICATION');
      if(o.revisionKind==='ISSUER_RESTATEMENT')requireFundamental(o.publication.evidenceReference!==null && o.publication.evidenceReference!==old.publication.evidenceReference,'RESTATEMENT_REQUIRES_OWN_DISCLOSURE');
    }
    try{await this.client.fundamentalObservation.create({data:{id:o.id,securityId:o.securityId,sourceVersionId:o.sourceVersionId,rawCaptureId:o.rawCaptureId,itemId:o.itemId,registryHash:o.registryHash,reportingScope:o.reportingScope,periodStart:o.periodStart,periodEnd:o.periodEnd,fieldLocator:o.raw.fieldLocator,mappingVersion:o.mappingVersion,ingestedAt:o.ingestedAt,normalizedValue:o.normalized.value,availableAt:null,availabilityStatus:'UNKNOWN',supersedesObservationId:o.supersedesObservationId,...encode(o)}});}catch(error){failure(error);}
  }
  async findSource(id:string) {
    fundamentalId(id);try{const row=await this.client.fundamentalSourceVersion.findUnique({where:{id}});if(!row)return null;
      const s=stored(row,validateFundamentalSource);requireFundamental(row.recordedAt===s.recordedAt,'SOURCE_METADATA_MISMATCH');return s;
    }catch(error){failure(error);}
  }
  async findImport(id:string) {
    fundamentalId(id);try{const row=await this.client.fundamentalImportBatch.findUnique({where:{id}});if(!row)return null;
      const b=stored(row,validateFundamentalBatch);requireFundamental(row.sourceVersionId===b.sourceVersionId&&row.completedAt===b.completedAt,'BATCH_METADATA_MISMATCH');
      const captures=await this.client.fundamentalRawCapture.findMany({where:{importExecutionId:id},select:{id:true}});
      requireFundamental(captures.length===b.captureIds.length&&captures.every(c=>b.captureIds.includes(c.id)),'STORED_CAPTURE_MANIFEST_MISMATCH');return b;
    }catch(error){failure(error);}
  }
  async findCapture(id:string) {
    fundamentalId(id);try{const row=await this.client.fundamentalRawCapture.findUnique({where:{id}});if(!row)return null;
      const c=stored(row,validateFundamentalCapture);requireFundamental(hash(c.payload)===c.payloadHash&&row.payloadHash===c.payloadHash&&row.sourceVersionId===c.sourceVersionId&&row.importExecutionId===c.importExecutionId&&row.retrievedAt===c.retrievedAt,'CAPTURE_METADATA_OR_PAYLOAD_MISMATCH');return c;
    }catch(error){failure(error);}
  }
  async findObservation(id:string, visited:readonly string[]=[]):Promise<FundamentalObservation|null> {
    fundamentalId(id);requireFundamental(!visited.includes(id),'REVISION_CYCLE');try{const row=await this.client.fundamentalObservation.findUnique({where:{id}});if(!row)return null;
      const o=stored<FundamentalObservation>(row,value=>validateFundamentalObservation(value,this.release));
      requireFundamental(row.securityId===o.securityId&&row.sourceVersionId===o.sourceVersionId&&row.rawCaptureId===o.rawCaptureId&&row.itemId===o.itemId&&row.registryHash===o.registryHash&&row.reportingScope===o.reportingScope&&row.periodStart===o.periodStart&&row.periodEnd===o.periodEnd&&row.fieldLocator===o.raw.fieldLocator&&row.mappingVersion===o.mappingVersion&&row.ingestedAt===o.ingestedAt&&row.normalizedValue===o.normalized.value&&row.availableAt===null&&row.availabilityStatus==='UNKNOWN'&&row.supersedesObservationId===o.supersedesObservationId,'OBSERVATION_METADATA_MISMATCH');
      await this.verifyFormal(o);
      const c=await this.findCapture(o.rawCaptureId);requireFundamental(c&&c.sourceVersionId===o.sourceVersionId&&c.retrievedAt===o.retrievedAt,'OBSERVATION_LINEAGE_MISSING');
      if(o.supersedesObservationId !== null) {
        const old=await this.findObservation(o.supersedesObservationId,[...visited,id]);
        requireFundamental(old && comparableKey(old) === comparableKey(o) && old.ingestedAt <= o.correctionKnownAt! && old.ingestedAt <= o.ingestedAt,'REVISION_PREDECESSOR_MISMATCH');
        if(o.revisionKind==='PROVIDER_CORRECTION'||o.revisionKind==='MAPPING_CORRECTION') requireFundamental(JSON.stringify(old.publication)===JSON.stringify(o.publication),'CORRECTION_CANNOT_INVENT_ISSUER_PUBLICATION');
        if(o.revisionKind==='ISSUER_RESTATEMENT') requireFundamental(o.publication.evidenceReference!==null && o.publication.evidenceReference!==old.publication.evidenceReference,'RESTATEMENT_REQUIRES_OWN_DISCLOSURE');
      }
      return o;
    }catch(error){failure(error);}
  }
}
