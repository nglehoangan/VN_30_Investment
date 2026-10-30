export interface DirectResponseMeta {
  apiId: string; retrievedAt: string; httpStatus: number; method: string; url: string;
  parameters?: Record<string, string | number | null>; ticker?: string; variant?: string;
}
export interface StoredResponse { observationId: string; sha256: string }
export interface PricePublication {
  state: "UPDATED" | "PARTIAL"; published: number; requested: number; missing: string[];
  awaitingMatchPrice?: string[]; openingReferenceMissing?: string[]; awaitingExpectedClose?: string[];
  rejected: { ticker: string; reason: string }[];
}
export function directDatabasePath(root: string, url?: string): string;
export function openDirectData(file: string): {
  response(row: DirectResponseMeta, bytes: Buffer): StoredResponse;
  publishPrices(rows: readonly (DirectResponseMeta & Partial<StoredResponse>)[], members: readonly { ticker: string; securityId: string }[], selectedAt?: string): PricePublication;
  saveRun(report: Record<string, unknown> & { finishedAt: string }): { id: string; sha256: string };
  close(): void;
};
