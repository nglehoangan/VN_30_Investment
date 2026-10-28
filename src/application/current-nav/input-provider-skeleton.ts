import type { CurrentNavInputProvider } from "@/ports/current-nav";
import type { BlockedNavInputsV1, BrokerEvidencePinV1, BrokerEvidenceReader, NavLedgerSnapshotReader } from "@/ports/nav-read-adapters";
import type { CurrentNavRequestV1, NavDigest } from "@/domain/current-nav/contracts";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { decimal } from "@/domain/portfolio/values";
import { instant } from "@/shared/time";
import { NavReadError, adapterCheck } from "./ledger-read-adapter";

export interface NavReadAdapterScope {
  readonly portfolioId: string; readonly accountId: string; readonly perimeterId: string; readonly valuationAt: string;
  readonly evidence: readonly BrokerEvidencePinV1[];
  readonly expectedStateHash?: string; readonly expectedEvidenceHead?: string;
}
/** Slice A only. It can never manufacture a complete plan or an accepted source. */
export class ReadOnlyNavInputProvider implements CurrentNavInputProvider {
  private readonly scope: NavReadAdapterScope;
  constructor(private readonly ledger: NavLedgerSnapshotReader, private readonly broker: BrokerEvidenceReader, scope: NavReadAdapterScope, private readonly hash: NavDigest) {
    this.scope = deepFreeze(JSON.parse(JSON.stringify(scope)) as NavReadAdapterScope);
  }
  async prepare(request: CurrentNavRequestV1, calculatedAt: string, expectedFactsHash?: string): Promise<BlockedNavInputsV1> {
    const r = deepFreeze(JSON.parse(JSON.stringify(request)) as CurrentNavRequestV1), scope = this.scope;
    let ledger: BlockedNavInputsV1["ledger"] = null;
    const observations: BlockedNavInputsV1["observations"][number][] = [];
    const reasons = ["SOURCE_AUTHORITY_MISSING", "INDEPENDENT_ACCEPTANCE_MISSING", "FORWARD_TRANSACTION_COVERAGE_UNVERIFIED", "SECURITY_IDENTITY_ACCEPTANCE_MISSING", "MARKET_AND_CALENDAR_QUALIFICATION_MISSING"];
    try {
      instant(calculatedAt); instant(scope.valuationAt); instant(r.knowledgeCutoff);
      adapterCheck(r.portfolioId === scope.portfolioId, "PORTFOLIO_SCOPE_MISMATCH");
      adapterCheck(r.knowledgeCutoff <= calculatedAt, "FUTURE_INFORMATION");
      adapterCheck(scope.accountId.trim().length > 0 && scope.perimeterId.trim().length > 0, "ACCOUNT_PERIMETER_UNRESOLVED");
      ledger = await this.ledger.snapshot(r, scope.valuationAt, { stateHash: scope.expectedStateHash, factsHash: expectedFactsHash });
      const pins = [...scope.evidence].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
      adapterCheck(new Set(pins.map(p => p.id)).size === pins.length && new Set(pins.map(p => p.documentId)).size === pins.length && new Set(pins.map(p => p.path)).size === pins.length, "DUPLICATE_EVIDENCE_IDENTIFIER");
      for (const pin of pins) {
        adapterCheck(pin.accountId === scope.accountId && pin.portfolioId === scope.portfolioId && pin.perimeterId === scope.perimeterId, "ACCOUNT_PERIMETER_MISMATCH");
        const observed = await this.broker.read(pin, { valuationAt: scope.valuationAt, knowledgeCutoff: r.knowledgeCutoff, calculatedAt });
        observations.push(observed);
        if (observed.status === "BLOCKED") reasons.push(...observed.reasons);
      }
      const fields = observations.filter(o => o.status === "OBSERVED").flatMap(o => o.observation.fields);
      const seen = new Set<string>();
      for (const f of fields) {
        const key = JSON.stringify([f.kind, f.securityId, f.field]);
        if (seen.has(key)) reasons.push("CONFLICTING_BROKER_OBSERVATIONS"); seen.add(key);
        if (f.kind === "CORPORATE_ACTION" || f.lifecycle === "PENDING" || f.lifecycle === "UNKNOWN") reasons.push("CORPORATE_ACTION_LIFECYCLE_UNQUALIFIED");
      }
      const security = fields.filter(f => f.kind === "SECURITY").map(f => f.securityId);
      if (new Set(security).size !== security.length) reasons.push("DUPLICATE_SECURITY_IDENTITY");
      for (const [kind, recorded, missing] of [["CASH", ledger.state.cash, "MISSING_CASH_OBSERVATION"], ["RECEIVABLE", ledger.state.receivables, "MISSING_RECEIVABLE_EVIDENCE"], ["LIABILITY", ledger.state.payables, "UNKNOWN_LIABILITY"]] as const) {
        const found = fields.filter(f => f.kind === kind);
        if (found.length !== 1 || found[0].value === null) reasons.push(missing);
        else if (!decimal(found[0].value).eq(decimal(recorded))) reasons.push(kind === "CASH" ? "CASH_DISCREPANCY_UNRESOLVED" : kind + "_DISCREPANCY_UNRESOLVED");
      }
      // Known recorded amounts still do not establish the actual completeness of these components.
      reasons.push("CASH_COMPLETENESS_UNVERIFIED", "RECEIVABLE_COMPLETENESS_UNVERIFIED", "LIABILITY_COMPLETENESS_UNVERIFIED");
      const latest = await this.ledger.snapshot(r, scope.valuationAt, { stateHash: ledger.stateHash, factsHash: ledger.factsHash });
      adapterCheck(latest.ledgerRevision === ledger.ledgerRevision, "LEDGER_REVISION_CHANGED");
    } catch (error) { reasons.push(error instanceof NavReadError ? error.reason : "INPUT_PREPARATION_INVALID"); }
    const evidenceHead = this.hash({ request: r, sourcePins: [...scope.evidence].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0), portfolioId: scope.portfolioId, accountId: scope.accountId, perimeterId: scope.perimeterId, valuationAt: scope.valuationAt, knowledgeCutoff: r.knowledgeCutoff, ledgerFactsHash: ledger?.factsHash ?? null, ledgerStateHash: ledger?.stateHash ?? null, observations });
    if (scope.expectedEvidenceHead && scope.expectedEvidenceHead !== evidenceHead) reasons.push("EVIDENCE_HEAD_MISMATCH");
    return deepFreeze({ version: "nav-input-preparation-v1", status: "BLOCKED", portfolioId: r.portfolioId, valuationAt: scope.valuationAt, knowledgeCutoff: r.knowledgeCutoff, ledgerRevision: r.ledgerRevision, ledger, observations, sourcePins: [...scope.evidence].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0), evidenceHead, reasons: [...new Set(reasons)].sort(), limitations: ["SLICE_A_OBSERVATIONS_ONLY_NOT_COMPLETE_PLAN", "OBSERVED_SOURCE_FIELDS_NOT_ACCEPTED_FINANCIAL_INTERPRETATION", "NO_OPERATIONAL_AUTHORITY_OR_PUBLICATION"], productionAuthorized: false, completePlanAvailable: false });
  }
  async load(request: CurrentNavRequestV1, ledger: { readonly revision: string; readonly inceptionAt: string; readonly factsHash: string }, calculatedAt: string) {
    await this.prepare(request, calculatedAt, ledger.factsHash);
    return null;
  }
  async isCurrent(head: string) { void head; return false; }
}
