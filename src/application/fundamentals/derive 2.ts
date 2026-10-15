import { deriveFundamentals,validateDerivationRequest } from '@/domain/fundamentals/derivation';
import type { DerivationRequest,DerivationCrosswalk } from '@/domain/fundamentals/derivation';
import type { RegistryRelease } from '@/domain/fundamentals/contracts';
import type { FundamentalRepository,FundamentalDerivationRepository,NormalizationTools } from '@/ports/fundamentals';
import { requireFundamental } from '@/domain/fundamentals/validation';
export class DeriveFundamentals {
  constructor(private readonly facts:FundamentalRepository,private readonly results:FundamentalDerivationRepository,
    private readonly registry:RegistryRelease,private readonly crosswalk:DerivationCrosswalk,private readonly tools:NormalizationTools){}
  async run(raw:DerivationRequest){
    const request=validateDerivationRequest(raw),ids=[...new Set(request.operands.flatMap(o=>o.observationIds))];
    const observations=await Promise.all(ids.map(async id=>{const o=await this.facts.findObservation(id);requireFundamental(o!==null,'DERIVATION_INPUT_NOT_FOUND');return o!;}));
    const result=deriveFundamentals({request,recordedAt:this.tools.now(),registry:this.registry,crosswalk:this.crosswalk,
      crosswalkHash:this.tools.hash(this.crosswalk),observations,hash:this.tools.hash});
    await this.results.append(result);return result;
  }
}
