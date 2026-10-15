import { reconstructPortfolio, type PortfolioState } from "@/domain/portfolio/reconstruct";
import type { LedgerRead, PortfolioLedger, PortfolioProjection } from "@/ports/portfolio";
import type { PortfolioId } from "@/domain/portfolio/values";
import { DataIntegrityError, ValidationError, errorCode, toPublicError } from "@/shared/errors";
import type { Instant } from "@/shared/time";

/** These results acknowledge a successful commit. Never compensate or invite an economic retry. */
export async function completePost(id: PortfolioId, committed: LedgerRead, now: Instant, ledger: PortfolioLedger, projection?: PortfolioProjection) {
  const base = { status: "POSTED" as const, ledgerWatermark: committed.watermark };
  const integrityFailure = (phase: "RECONSTRUCTION" | "PROJECTION" | "CURRENTNESS", error: unknown) => ({
    ...base, projectionStatus: "BLOCKED" as const, portfolioTrust: "BLOCKED" as const, actionabilityBlocked: true,
    state: null, reason: "POST_COMMIT_INTEGRITY_FAILURE" as const,
    error: toPublicError(new DataIntegrityError()),
    // Allowlisted structured investigation context; no raw message, stack, SQL, path or cause.
    diagnostics: { phase, code: errorCode(error) },
  });
  let state: PortfolioState;
  try { state = reconstructPortfolio(id, committed.transactions, now, committed.watermark, committed.inceptionAt); }
  catch (error) { return integrityFailure("RECONSTRUCTION", error); }

  let projectionFailure: { code: ReturnType<typeof errorCode> } | null = null;
  try { await projection?.rebuild(state, now); }
  catch (error) {
    if (error instanceof DataIntegrityError || error instanceof ValidationError) return integrityFailure("PROJECTION", error);
    projectionFailure = { code: errorCode(error) };
  }
  // Always check advancement, including when rebuild failed because another writer won the revision.
  try {
    const latest = await ledger.read(id);
    if (latest.watermark !== committed.watermark) return { ...base, projectionStatus: "STALE" as const,
      portfolioTrust: "STALE" as const, actionabilityBlocked: true, reason: "LEDGER_ADVANCED" as const, state: null };
  } catch (error) { return integrityFailure("CURRENTNESS", error); }
  if (projectionFailure) return { ...base, projectionStatus: "BLOCKED" as const, portfolioTrust: "VALID" as const,
    actionabilityBlocked: true, reason: "PROJECTION_REBUILD_REQUIRED" as const, state: null,
    diagnostics: { phase: "PROJECTION" as const, code: projectionFailure.code } };
  return { ...base, projectionStatus: "VALID" as const, portfolioTrust: "VALID" as const,
    actionabilityBlocked: false, reason: null, state };
}
