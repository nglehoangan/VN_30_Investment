import { instant, type Instant } from "@/shared/time";
import { requireRule } from "./values";
import type { TransactionInput } from "./transaction";
export type IntakeStatus = "SUPPORTED_EVENT" | "DUPLICATE" | "NEEDS_REVIEW" | "UNSUPPORTED" | "BLOCKED_SOURCE" | "BLOCKED_IDENTITY" | "BLOCKED_OPENING_BOUNDARY";
export interface ForwardRecord {
  readonly version: "forward-event-intake-v1";
  readonly source: { readonly namespace: string; readonly documentId: string; readonly documentHash: string; readonly eventId: string; readonly reference: string; readonly accountId: string; readonly portfolioId: string; readonly contentHash: string; readonly originalValues: unknown; readonly effective: { readonly precision: "INSTANT" | "DATE"; readonly value: string }; readonly knownAt: Instant; readonly retrievedAt: Instant; readonly provenance: readonly { readonly reference: string; readonly sha256: string; readonly pointer: string }[] };
  readonly security: { readonly ledgerSecurityId: string; readonly evidenceReference: string } | null;
  readonly category: string; readonly command: TransactionInput | null;
}
export interface EconomicIdentity { readonly namespace: string; readonly eventId: string; readonly component: string; readonly revision: string }
/** Returned ONLY by a trusted server authority integration; no client acceptance flags are consumed. */
export interface IntakeGrant {
  readonly status: "QUALIFIED";
  readonly recordHash: string; readonly commandHash: string;
  readonly portfolioId: string; readonly accountId: string; readonly securityId: string | null; readonly category: string;
  readonly sourceAuthorityReference: string; readonly identityAcceptanceReference: string | null;
  readonly producerReference: string; readonly independentValidatorReference: string;
  readonly identity: EconomicIdentity; readonly correctsTransactionId: string | null;
}
export interface IntakeOutcome { readonly status: IntakeStatus; readonly reason: string; readonly record: ForwardRecord; readonly grant: IntakeGrant | null; readonly transactionId: string | null }
export type IntakeHash = (value: unknown) => string;
export const forwardCategories = ["BUY", "SELL", "TRADE_SETTLEMENT", "CASH_DEPOSIT", "CASH_WITHDRAWAL", "DIVIDEND_CASH", "DIVIDEND_RECEIVABLE_SETTLEMENT", "CORPORATE_ACTION", "FEE", "TAX", "REVERSAL"] as const;
export function economicKey(i: EconomicIdentity) { return JSON.stringify([i.namespace,i.eventId,i.component]); }
/** Transport identity/notes cannot hide an economic content conflict across formats. */
export function financialHash(f: TransactionInput, hash: IntakeHash) {
  const { id: _id, idempotencyKey: _key, source: _source, notes: _notes, ...financial } = f;
  void _id; void _key; void _source; void _notes;
  return hash(financial);
}
function nonempty(v: unknown) { return typeof v === "string" && v.trim().length > 0 && v.length <= 512; }
export function classifyForwardRecord(record: ForwardRecord, opening: Instant, portfolioId: string, now: Instant, hash: IntakeHash, grant: IntakeGrant | null): IntakeOutcome {
  const result = (status: IntakeStatus, reason: string): IntakeOutcome => ({ status,reason,record,grant,transactionId:null });
  try {
    const s = record.source, f = record.command;
    if (record.version !== "forward-event-intake-v1") return result("UNSUPPORTED","INTAKE_VERSION_UNSUPPORTED");
    if (!s || ![s.namespace,s.documentId,s.eventId,s.reference,s.accountId,s.portfolioId].every(nonempty) || !/^[a-f0-9]{64}$/.test(s.documentHash) || !/^[a-f0-9]{64}$/.test(s.contentHash)) return result("BLOCKED_SOURCE","SOURCE_IDENTITY_REQUIRED");
    if (hash(s.originalValues) !== s.contentHash || !Array.isArray(s.provenance) || !s.provenance.length || s.provenance.some(p => !nonempty(p.reference) || !/^[a-f0-9]{64}$/.test(p.sha256) || !p.pointer?.startsWith("/"))) return result("BLOCKED_SOURCE","SOURCE_HASH_OR_PROVENANCE_INVALID");
    if (!(forwardCategories as readonly string[]).includes(record.category)) return result("UNSUPPORTED","UNSUPPORTED_EXPLICIT_CATEGORY");
    if (!f || f.type !== record.category) return result("NEEDS_REVIEW","EXPLICIT_COMMAND_CLASSIFICATION_REQUIRED");
    instant(opening);instant(now);instant(s.knownAt);instant(s.retrievedAt);instant(f.eventAt);instant(f.effectiveAt);
    if (!s.effective || s.effective.precision !== "INSTANT") return result("BLOCKED_OPENING_BOUNDARY","EXACT_EFFECTIVE_INSTANT_REQUIRED");
    instant(s.effective.value);
    if (f.effectiveAt !== s.effective.value || f.eventAt <= opening || f.effectiveAt <= opening) return result("BLOCKED_OPENING_BOUNDARY","NOT_PROVEN_AFTER_SUPPORTED_OPENING");
    if (s.knownAt > s.retrievedAt || s.retrievedAt > now || f.eventAt > s.knownAt || f.effectiveAt > now) return result("BLOCKED_SOURCE","FUTURE_OR_INCONSISTENT_KNOWLEDGE");
    if (s.portfolioId !== portfolioId || f.portfolioId !== portfolioId) return result("BLOCKED_SOURCE","PORTFOLIO_ACCOUNT_SCOPE_MISMATCH");
    if (f.securityId && (!record.security || record.security.ledgerSecurityId !== f.securityId || !nonempty(record.security.evidenceReference))) return result("BLOCKED_IDENTITY","EXACT_SECURITY_IDENTITY_REQUIRED");
    if (!grant) return result("BLOCKED_SOURCE","AUTHENTICATED_SOURCE_ADAPTER_UNAVAILABLE");
    if (grant.status !== "QUALIFIED" || grant.recordHash !== hash(record) || grant.commandHash !== hash(f) || grant.portfolioId !== portfolioId || grant.accountId !== s.accountId || grant.category !== record.category || !nonempty(grant.sourceAuthorityReference) || !nonempty(grant.producerReference) || !nonempty(grant.independentValidatorReference) || grant.producerReference === grant.independentValidatorReference) return result("BLOCKED_SOURCE","ACCEPTED_SOURCE_SCOPE_OR_CONTENT_MISMATCH");
    if (grant.securityId !== (f.securityId ?? null) || (f.securityId && !nonempty(grant.identityAcceptanceReference))) return result("BLOCKED_IDENTITY","ACCEPTED_SECURITY_SCOPE_MISMATCH");
    if (![grant.identity.namespace,grant.identity.eventId,grant.identity.component,grant.identity.revision].every(nonempty)) return result("BLOCKED_SOURCE","STABLE_ECONOMIC_EVENT_ID_REQUIRED");
    if (f.type === "CORPORATE_ACTION" && (!f.corporateAction || !["SPLIT","REVERSE_SPLIT","RIGHTS_SUBSCRIPTION","MERGER","SPINOFF"].includes(f.corporateAction.subtype))) return result("UNSUPPORTED","UNSUPPORTED_CORPORATE_ACTION_TERMS");
    return result("SUPPORTED_EVENT","QUALIFIED_FOR_ISOLATED_COMMAND_VALIDATION");
  } catch { return result("NEEDS_REVIEW","MALFORMED_OR_AMBIGUOUS_SOURCE_RECORD"); }
}
export function requireIntakeBatch(records: readonly ForwardRecord[]) { requireRule(records.length > 0 && records.length <= 100,"BOUNDED_INTAKE_BATCH_REQUIRED"); }
