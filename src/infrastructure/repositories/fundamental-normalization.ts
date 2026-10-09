import type { PrismaClient, Prisma } from '@/infrastructure/db/generated/client';
import type { FundamentalNormalizationRepository, QualifiedDocumentInput } from '@/ports/fundamentals';
import type { NormalizationAssessment } from '@/domain/fundamentals/normalization';
import { normalizeStatement, comparableKey } from '@/domain/fundamentals/normalization';
import type { FundamentalObservation, RegistryRelease, RegistryApprovalBinding } from '@/domain/fundamentals/contracts';
import { fundamentalId, requireFundamental } from '@/domain/fundamentals/validation';
import { loadCanonicalRegistry } from '@/infrastructure/fundamentals/canonical-registry';
import { normalizationHash } from '@/infrastructure/fundamentals/reviewed-statement';
import { RepositoryRawDocuments } from '@/infrastructure/fundamentals/raw-document';
import { requireQualifiedDocument, validateDocumentQualification } from '@/domain/fundamentals/document-qualification';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { PrismaFundamentals } from './fundamentals';
import { ConflictError, DataIntegrityError } from '@/shared/errors';

/** Validation artifacts and admitted observations commit atomically; blocked proposals remain in the artifact. */
export class PrismaFundamentalNormalization implements FundamentalNormalizationRepository {
  private readonly release:RegistryRelease;
  constructor(private readonly client:PrismaClient,private readonly gate:QualifiedDocumentInput,
    release:RegistryRelease=loadCanonicalRegistry(),private readonly binding:RegistryApprovalBinding|null=null) {
    this.release = loadCanonicalRegistry(release.manifest);
    requireFundamental(this.release.registryHash === release.registryHash,'NORMALIZATION_REGISTRY_HASH');
  }
  private async compareWith(client:Prisma.TransactionClient, candidates:readonly FundamentalObservation[]) {
    if (!candidates.length) return [];
    const keys = new Set(candidates.map(comparableKey));
    const rows = await client.fundamentalObservation.findMany({where:{OR:candidates.map(o=>({
      securityId:o.securityId,itemId:o.itemId,reportingScope:o.reportingScope,periodStart:o.periodStart,periodEnd:o.periodEnd,
    }))},orderBy:{id:'asc'},select:{id:true}});
    const repository = new PrismaFundamentals(client,this.release,this.binding);
    const values = await Promise.all(rows.map(row=>repository.findObservation(row.id)));
    return values.filter((o):o is FundamentalObservation=>o !== null && keys.has(comparableKey(o)));
  }
  comparable(observations:readonly FundamentalObservation[]) {return this.compareWith(this.client,observations);}
  async append(raw:NormalizationAssessment) {
    fundamentalId(raw.id);
    const candidate = await this.gate.candidate(raw.captureIds,raw.qualification.intendedIssuer);
    requireFundamental(normalizationHash(candidate.qualification) === normalizationHash(raw.qualification) &&
      raw.registry.registryHash === this.release.registryHash && normalizationHash(raw.registry) === normalizationHash(this.release), 'NORMALIZATION_GATE_CHANGED');
    try {
      await this.client.$transaction(async tx=>{
        const prior = await this.compareWith(tx,raw.observations);
        const result = normalizeStatement({id:raw.id,scope:raw.scope,recordedAt:raw.recordedAt,candidate,extract:raw.extract,
          extractHash:raw.extractHash,mapping:raw.mapping,registry:this.release,prior,hash:normalizationHash});
        requireFundamental(normalizationHash(raw) === normalizationHash(result),'NORMALIZATION_REPLAY_OR_CONTEXT_MISMATCH');
        const body = JSON.stringify(result);
        requireFundamental(Buffer.byteLength(body,'utf8') <= 4_000_000,'BOUNDED_NORMALIZATION_ARTIFACT');
        await tx.fundamentalNormalization.create({data:{id:result.id,securityId:result.qualification.intendedIssuer.securityId,
          sourceVersionId:result.sourceVersionId,importExecutionId:result.importExecutionId,rawCaptureId:result.rawCaptureId,
          recordedAt:result.recordedAt,status:result.status,body,bodyHash:normalizationHash(result)}});
        if (result.status !== 'BLOCKED') {
          const repository = new PrismaFundamentals(tx,this.release,this.binding);
          for (const o of result.observations) await repository.appendObservation(o);
        }
      });
    } catch(error) {
      if(error && typeof error === 'object' && 'code' in error && error.code === 'P2002') throw new ConflictError();
      throw new DataIntegrityError({cause:error});
    }
  }
  async find(id:string):Promise<NormalizationAssessment|null> {
    fundamentalId(id);
    try {
      const row = await this.client.fundamentalNormalization.findUnique({where:{id}});
      if (!row) return null;
      const result = JSON.parse(row.body) as NormalizationAssessment;
      requireFundamental(normalizationHash(result) === row.bodyHash && result.id === row.id && result.recordedAt === row.recordedAt &&
        result.status === row.status && result.sourceVersionId === row.sourceVersionId && result.importExecutionId === row.importExecutionId &&
        result.rawCaptureId === row.rawCaptureId && result.qualification.intendedIssuer.securityId === row.securityId,'NORMALIZATION_STORED_INTEGRITY');
      // Read immutable evidence, not current qualification eligibility or latest-wins selection.
      requireFundamental(result.registry.registryHash === this.release.registryHash &&
        normalizationHash(result.extract) === result.extractHash && normalizationHash(result.mapping.manifest) === result.mapping.hash,'NORMALIZATION_STORED_MANIFESTS');
      const repository = new PrismaFundamentals(this.client,this.release,this.binding);
      const raw = await new RepositoryRawDocuments(repository).reconstruct(result.captureIds);
      const q = validateDocumentQualification(result.qualification);
      const verified = requireQualifiedDocument(raw,[{...q,supersedesQualificationId:null,correctionReason:null}],q.intendedIssuer);
      const prior = await Promise.all(result.compared.map(async ref=>{
        const o = await repository.findObservation(ref.id);
        requireFundamental(o !== null && normalizationHash(o) === ref.hash,'NORMALIZATION_CONTEXT_INTEGRITY');return o!;
      }));
      const replay = normalizeStatement({id:result.id,scope:result.scope,recordedAt:result.recordedAt,
        candidate:{...verified,qualification:q},extract:result.extract,extractHash:result.extractHash,mapping:result.mapping,
        registry:this.release,prior,hash:normalizationHash});
      requireFundamental(normalizationHash(replay) === row.bodyHash,'NORMALIZATION_STORED_REPLAY');
      for (const o of result.observations) {
        const stored = await repository.findObservation(o.id);
        requireFundamental(result.status === 'BLOCKED' ? stored === null : stored !== null && normalizationHash(stored) === normalizationHash(o),'NORMALIZATION_OBSERVATION_MANIFEST');
      }
      return deepFreeze(result);
    } catch(error) {throw new DataIntegrityError({cause:error});}
  }
}
