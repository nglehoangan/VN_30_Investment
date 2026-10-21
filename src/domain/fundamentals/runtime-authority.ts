import type { MethodologyRecord } from '@/domain/methodology/record';
import { instant } from '@/shared/time';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { fundamentalHash, requireFundamental } from './validation';

export type RuntimeAuthorityKind = 'registry' | 'availability' | 'readiness-requirements' | 'di-acceptance' | 'derivation-crosswalk';
export interface RuntimeAuthorityPin {
  readonly kind: RuntimeAuthorityKind; readonly hash: string; readonly methodId: string;
  readonly approvalReference: string; readonly effectiveFrom: string; readonly effectiveThrough: string | null;
  readonly dependencies: readonly string[];
}
/** Selection comes from trusted composition. Existing MethodologyRecord remains the approval record. */
export function bindRuntimeAuthority(pin: RuntimeAuthorityPin, method: MethodologyRecord | null, at: string, knownAt: string) {
  instant(at); instant(knownAt); instant(pin.effectiveFrom); fundamentalHash(pin.hash);
  pin.dependencies.forEach(fundamentalHash);
  if (pin.effectiveThrough !== null) { instant(pin.effectiveThrough); requireFundamental(pin.effectiveThrough > pin.effectiveFrom, 'AUTHORITY_INTERVAL'); }
  requireFundamental(method && method.methodologyId === pin.methodId && method.governanceStatus === 'APPROVED' && method.intendedUse === 'PRODUCTION' &&
    method.approvalReference === pin.approvalReference && pin.approvalReference.trim() && method.configurationReference === pin.kind + '-sha256:' + pin.hash,
  'RUNTIME_AUTHORITY_NOT_APPROVED');
  requireFundamental(method.recordedAt <= knownAt && method.effectiveDate <= at.slice(0, 10) && pin.effectiveFrom <= at &&
    (pin.effectiveThrough === null || at < pin.effectiveThrough), 'RUNTIME_AUTHORITY_NOT_EFFECTIVE');
  return deepFreeze({ state: 'ACTIVE' as const, pin: JSON.parse(JSON.stringify(pin)) as RuntimeAuthorityPin, method });
}
