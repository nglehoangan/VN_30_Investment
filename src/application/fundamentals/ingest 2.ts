import type { FundamentalDocumentCollector, FundamentalRepository } from '@/ports/fundamentals';

/** Caller supplies the execution identity and explicit repository target. */
export async function ingestFundamentalDocuments(
  collector: FundamentalDocumentCollector,
  repository: FundamentalRepository,
  executionId: string,
) {
  const result = await collector.collect(executionId);
  const existing = await repository.findSource(result.source.id);
  if (existing && JSON.stringify(existing) !== JSON.stringify(result.source)) {
    throw new Error('SOURCE_VERSION_CONFLICT');
  }
  if (!existing) await repository.appendSource(result.source);
  await repository.appendImport(result.batch, result.captures);
  return result.batch;
}
