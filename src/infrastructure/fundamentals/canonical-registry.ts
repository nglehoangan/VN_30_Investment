import { createHash } from 'node:crypto';
import manifest from './canonical-items-v1.json';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { validateCanonicalRegistry, requireFundamental, fundamentalHash } from '@/domain/fundamentals/validation';
import type { RegistryRelease, RegistryApprovalBinding } from '@/domain/fundamentals/contracts';
import type { MethodologyRecord } from '@/domain/methodology/record';
/** Registry release serialization only; this is not a fundamental dataset/snapshot builder. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const object=value as Record<string,unknown>;
  return `{${Object.keys(object).sort().map(k=>`${JSON.stringify(k)}:${canonical(object[k])}`).join(',')}}`;
}
export function loadCanonicalRegistry(value: unknown = manifest): RegistryRelease {
  const validated=validateCanonicalRegistry(value);
  return deepFreeze({manifest:validated,registryHash:createHash('sha256').update(canonical(validated)).digest('hex')});
}
/** Metadata consistency is necessary, not external authenticity certification. Owner must review the exact release hash. */
export function verifyRegistryApproval(release: RegistryRelease, binding: RegistryApprovalBinding | null, method: MethodologyRecord | null) {
  fundamentalHash(release.registryHash);
  requireFundamental(binding && method && release.manifest.governanceStatus==='APPROVED','REGISTRY_EXTERNAL_APPROVAL_REQUIRED');
  requireFundamental(Object.keys(binding).sort().join(' ')==='approvalReference crosswalkVersion methodologyIdentity registryHash','EXACT_APPROVAL_BINDING_REQUIRED');
  requireFundamental(binding.registryHash===release.registryHash && binding.crosswalkVersion===release.manifest.crosswalkVersion && binding.methodologyIdentity===release.manifest.methodologyIdentity && binding.approvalReference===release.manifest.approvalReference,'REGISTRY_APPROVAL_HASH_MISMATCH');
  requireFundamental(method.methodologyId===binding.methodologyIdentity && method.governanceStatus==='APPROVED' && method.intendedUse==='PRODUCTION' && method.approvalReference===binding.approvalReference && method.configurationReference===`registry-sha256:${release.registryHash}`,'REGISTRY_METHOD_BINDING_MISMATCH');
}
