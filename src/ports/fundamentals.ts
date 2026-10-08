import type { FundamentalSourceVersion, FundamentalRawCapture, FundamentalImportBatch, FundamentalObservation } from '@/domain/fundamentals/contracts';
/** No fetch, latest-wins selection, mutation, scoring or portfolio posting capability. */
export interface FundamentalRepository {
  appendSource(source: FundamentalSourceVersion): Promise<void>;
  appendImport(batch: FundamentalImportBatch, captures: readonly FundamentalRawCapture[]): Promise<void>;
  appendObservation(observation: FundamentalObservation): Promise<void>;
  findSource(id: string): Promise<FundamentalSourceVersion | null>;
  findImport(id: string): Promise<FundamentalImportBatch | null>;
  findCapture(id: string): Promise<FundamentalRawCapture | null>;
  findObservation(id: string): Promise<FundamentalObservation | null>;
}
