import manifest from './derivation-crosswalk-v1.json' with {type:'json'};
import { validateCrosswalk } from '@/domain/fundamentals/derivation';
import type { DerivationCrosswalk } from '@/domain/fundamentals/derivation';
import type { RegistryRelease } from '@/domain/fundamentals/contracts';
import { normalizationHash } from './reviewed-statement';
export function loadDerivationCrosswalk(registry:RegistryRelease,value:unknown=manifest){
  const crosswalk=validateCrosswalk(value as DerivationCrosswalk,registry);return {crosswalk,hash:normalizationHash(crosswalk)};
}
