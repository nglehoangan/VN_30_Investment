import type { Prisma } from "@/infrastructure/db/generated/client";
import type { Transaction, TransactionInput } from "@/domain/portfolio/transaction";
import { settlementCanonical } from "@/domain/portfolio/dividend-settlement";
import { requireRule } from "@/domain/portfolio/values";
import { createHash } from "node:crypto";

/** Trusted server integration, NEVER client claims. No operational implementation is configured.
 * Implementations must resolve exact immutable accepted records, current revocation/role state,
 * scoped portfolio/issuer/action and knowledge times using this same transaction snapshot.
 */
export interface DividendSettlementAuthority {
  authorize(tx: Prisma.TransactionClient, event: TransactionInput, original: TransactionInput | null): Promise<{ acceptanceReference: string; verifierReference: string; allocationHash: string; receiptHash: string }>;
  /** Resolve cash receipts across *all* representations to one stable economic identity; throw on unknown. */
  receiptIdentity(tx: Prisma.TransactionClient, event: TransactionInput): Promise<{ namespace: string; id: string }>;
}
const digest = (v: unknown) => createHash("sha256").update(settlementCanonical(v)).digest("hex");
export async function persistDividendGuards(tx: Prisma.TransactionClient, history: readonly Transaction[], additions: readonly Transaction[], authority?: DividendSettlementAuthority) {
  const all = [...history, ...additions];
  const special = additions.filter(t => t.facts.dividendSettlement || all.find(o => o.facts.id === t.facts.reversesId)?.facts.dividendSettlement);
  const credits = additions.filter(t => ["CASH_DEPOSIT", "DIVIDEND_CASH"].includes(t.facts.type));
  const enabled = all.some(t => t.facts.dividendSettlement);
  if (!special.length && !(enabled && credits.length)) return;
  requireRule(authority, "DIVIDEND_AUTHORITY_ADAPTER_UNAVAILABLE");
  // An enrollment cannot ignore a receipt previously imported under a different representation.
  const identities = new Map<string, string>();
  for (const t of all.filter(t => t.facts.dividendSettlement || ["CASH_DEPOSIT", "DIVIDEND_CASH"].includes(t.facts.type)).sort((a,b) => a.facts.effectiveAt.localeCompare(b.facts.effectiveAt) || a.facts.eventAt.localeCompare(b.facts.eventAt) || a.facts.id.localeCompare(b.facts.id))) {
    const identity = await authority.receiptIdentity(tx, t.facts);
    requireRule(identity.namespace.trim() && identity.id.trim(), "STABLE_RECEIPT_ID_REQUIRED");
    if (t.facts.dividendSettlement) {
      const receipt = t.facts.dividendSettlement.receipt;
      requireRule(receipt.namespace === identity.namespace && receipt.id === identity.id, "RECEIPT_IDENTITY_MISMATCH");
    }
    const key = settlementCanonical(identity);
    const previous = identities.get(key);
    requireRule(!previous || t.facts.dividendSettlement?.correctionOf === previous, "DUPLICATE_ECONOMIC_RECEIPT"); identities.set(key, t.facts.id);
  }
  for (const t of special) {
    const original = all.find(o => o.facts.id === t.facts.reversesId)?.facts ?? null;
    const acceptance = await authority.authorize(tx, t.facts, original);
    requireRule(acceptance.acceptanceReference.trim() && acceptance.verifierReference.trim(), "AUTHENTICATED_ACCEPTANCE_REQUIRED");
    const accepted = t.facts.dividendSettlement ?? original?.dividendSettlement;
    requireRule(accepted && acceptance.allocationHash === digest(accepted.allocation) && acceptance.receiptHash === digest(accepted.receipt) && acceptance.acceptanceReference === accepted.allocation.acceptanceReference, "ACCEPTANCE_CONTENT_BINDING_MISMATCH");
    const posted = await tx.ledgerTransaction.findUniqueOrThrow({ where: { id: t.facts.id } });
    const result = { status: "POSTED", transactionId: t.facts.id, ledgerWatermark: posted.revision, idempotencyKey: t.facts.idempotencyKey };
    const body = settlementCanonical({ result, version: "dividend-settlement-audit-v1", transactionId: t.facts.id, factsHash: digest(t.facts), originalId: original?.id ?? null, acceptance, recordedAt: t.createdAt });
    await tx.$executeRaw`INSERT INTO dividend_settlement_audit (transaction_id, body, body_hash) VALUES (${t.facts.id}, ${body}, ${digest(JSON.parse(body))})`;
  }
  for (const t of additions.filter(t => t.facts.dividendSettlement || ["CASH_DEPOSIT", "DIVIDEND_CASH"].includes(t.facts.type))) {
    if (t.facts.dividendSettlement?.correctionOf) continue; // reservation remains owned by the immutable original lineage
    const identity = await authority.receiptIdentity(tx, t.facts);
    await tx.$executeRaw`INSERT INTO dividend_receipt_owner (portfolio_id, namespace, receipt_id, transaction_id) VALUES (${t.facts.portfolioId}, ${identity.namespace}, ${identity.id}, ${t.facts.id})`;
  }
}

export async function verifyDividendGuardsRead(tx: Prisma.TransactionClient, history: readonly Transaction[]) {
  for (const t of history) {
    if (!t.facts.dividendSettlement && !history.find(o => o.facts.id === t.facts.reversesId)?.facts.dividendSettlement) continue;
    const rows = await tx.$queryRaw<{ body: string; body_hash: string }[]>`SELECT body, body_hash FROM dividend_settlement_audit WHERE transaction_id=${t.facts.id}`;
    requireRule(rows.length === 1, "MISSING_SETTLEMENT_AUDIT");
    const audit = JSON.parse(rows[0].body);
    requireRule(digest(audit) === rows[0].body_hash && audit.factsHash === digest(t.facts) && audit.transactionId === t.facts.id && audit.recordedAt === t.createdAt && audit.result?.transactionId === t.facts.id && audit.result?.idempotencyKey === t.facts.idempotencyKey && audit.result?.status === "POSTED", "SETTLEMENT_AUDIT_INTEGRITY");
    const s = t.facts.dividendSettlement;
    if (s && !s.correctionOf) {
      const owners = await tx.$queryRaw<{ transaction_id: string }[]>`SELECT transaction_id FROM dividend_receipt_owner WHERE portfolio_id=${t.facts.portfolioId} AND namespace=${s.receipt.namespace} AND receipt_id=${s.receipt.id}`;
      requireRule(owners.length === 1 && owners[0].transaction_id === t.facts.id, "SETTLEMENT_RECEIPT_OWNERSHIP_INTEGRITY");
    }
  }
}
