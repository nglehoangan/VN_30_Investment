import debtCrosswalk from './debt-derivation-crosswalk-v2.json' with {type:'json'};
import {debtContractActive} from '@/domain/fundamentals/debt-contract';
import {requireFundamental} from '@/domain/fundamentals/validation';
import manifest from './derivation-crosswalk-v1.json' with {type:'json'};
import { validateCrosswalk } from '@/domain/fundamentals/derivation';
import type { DerivationCrosswalk } from '@/domain/fundamentals/derivation';
import type { RegistryRelease } from '@/domain/fundamentals/contracts';
import { normalizationHash } from './reviewed-statement';
export function loadDerivationCrosswalk(registry:RegistryRelease,value:unknown=manifest){
  const crosswalk=validateCrosswalk(value as DerivationCrosswalk,registry);return {crosswalk,hash:normalizationHash(crosswalk)};
}

/** The scoped debt bridge has stricter cash/basis guards than the legacy generic crosswalk. */
export function loadDebtDerivationCrosswalk(at:string,knownAt=at){requireFundamental(debtContractActive(at,knownAt),'DEBT_CONTRACT_NOT_YET_EFFECTIVE');return {crosswalk:debtCrosswalk,hash:normalizationHash(debtCrosswalk)};}
