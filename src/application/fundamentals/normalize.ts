import type { QualifiedDocumentInput } from '@/ports/fundamentals';
import type { DocumentIssuerIdentity } from '@/domain/fundamentals/document-qualification';
import type { FundamentalObservation, RegistryRelease } from '@/domain/fundamentals/contracts';
import type { MappingRelease, StatementExtract, NormalizationAssessment } from '@/domain/fundamentals/normalization';
import { normalizeStatement } from '@/domain/fundamentals/normalization';
import type { FundamentalNormalizationRepository, NormalizationTools } from '@/ports/fundamentals';

export class NormalizeFundamentals {
  constructor(private readonly gate:QualifiedDocumentInput,private readonly repository:FundamentalNormalizationRepository,
    private readonly registry:RegistryRelease,private readonly mapping:MappingRelease,private readonly tools:NormalizationTools) {}
  async run(request:{id:string;scope:FundamentalObservation['scope'];captureIds:readonly string[];issuer:DocumentIssuerIdentity;extract:StatementExtract}):Promise<NormalizationAssessment> {
    const candidate = await this.gate.candidate(request.captureIds,request.issuer);
    const provisional = normalizeStatement({id:request.id,scope:request.scope,recordedAt:this.tools.now(),candidate,
      extract:request.extract,extractHash:this.tools.hash(request.extract),mapping:this.mapping,registry:this.registry,prior:[],hash:this.tools.hash});
    const prior = await this.repository.comparable(provisional.observations);
    const result = normalizeStatement({id:request.id,scope:request.scope,recordedAt:provisional.recordedAt,candidate,
      extract:request.extract,extractHash:provisional.extractHash,mapping:this.mapping,registry:this.registry,prior,hash:this.tools.hash});
    // Recheck current qualification after extraction/comparison, before publishing immutable results.
    const current = await this.gate.candidate(request.captureIds,request.issuer);
    if (this.tools.hash(current.qualification) !== this.tools.hash(candidate.qualification)) throw new Error('QUALIFICATION_CHANGED_DURING_NORMALIZATION');
    await this.repository.append(result);
    return result;
  }
}
