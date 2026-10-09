import { createHash } from 'node:crypto';
import type { RegistryRelease } from '@/domain/fundamentals/contracts';
import type { StatementMapping, MappingRelease, StatementExtract } from '@/domain/fundamentals/normalization';
import { validateStatementMapping, validateStatementExtract } from '@/domain/fundamentals/normalization';
import { requireFundamental } from '@/domain/fundamentals/validation';
import { deepFreeze } from '@/domain/portfolio/transaction';
import type { NormalizationTools } from '@/ports/fundamentals';
import fptMapping from './fpt-reviewed-mapping-v1.json';

/** Exact serialized JSON digest; retained manifests preserve their key order. */
export const normalizationHash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const normalizationTools: NormalizationTools = {hash:normalizationHash,now:()=>new Date().toISOString()};
export function loadStatementMapping(registry:RegistryRelease, value:unknown = fptMapping):MappingRelease {
  const manifest = validateStatementMapping(value as StatementMapping,registry);
  return deepFreeze({manifest,hash:normalizationHash(manifest)});
}
/** Reviewed offline import, not a PDF/OCR/table parser or a provider-field guessing engine. */
export function parseReviewedStatement(body:string):StatementExtract {
  requireFundamental(typeof body === 'string' && Buffer.byteLength(body,'utf8') <= 4_000_000,'BOUNDED_REVIEWED_EXTRACT');
  return validateStatementExtract(JSON.parse(body));
}
