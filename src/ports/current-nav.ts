import type { CurrentNavPlanV1, CurrentNavRequestV1 } from "@/domain/current-nav/contracts";
/** Read-only server input reader. No operational implementation is provided in Phase3.2.
 * Must verify retained bytes/source pins; data/JSON fields are never acceptance credentials. */
export interface CurrentNavInputProvider {
  load(request: CurrentNavRequestV1, ledger: { readonly revision: string; readonly inceptionAt: string; readonly factsHash: string }, calculatedAt: string): Promise<CurrentNavPlanV1 | null>;
  isCurrent(evidenceHead: string): Promise<boolean>;
}
