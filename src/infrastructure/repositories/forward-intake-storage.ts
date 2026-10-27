import { createHash } from "node:crypto";
import type { Prisma } from "@/infrastructure/db/generated/client";
import { settlementCanonical } from "@/domain/portfolio/dividend-settlement";
import type { Transaction } from "@/domain/portfolio/transaction";
import { requireRule } from "@/domain/portfolio/values";
export const intakeHash = (value: unknown) => createHash("sha256").update(settlementCanonical(value)).digest("hex");
export type IntakePostingGuard = (tx: Prisma.TransactionClient, history: readonly Transaction[], additions: readonly Transaction[], revision: string) => Promise<void>;
export async function intakeStorageExists(tx: Prisma.TransactionClient) { return (await tx.$queryRaw<unknown[]>`SELECT name FROM sqlite_master WHERE type='table' AND name='forward_intake_event'`).length === 1; }
export async function requireIntakeGuard(tx: Prisma.TransactionClient, portfolio: string, guard?: IntakePostingGuard) {
  if (guard || !await intakeStorageExists(tx)) return;
  const rows = await tx.$queryRaw<unknown[]>`SELECT transaction_id FROM forward_intake_event WHERE portfolio_id=${portfolio} LIMIT 1`;
  requireRule(rows.length === 0,"ENROLLED_PORTFOLIO_REQUIRES_FORWARD_INTAKE");
}
export async function verifyIntakeRead(tx: Prisma.TransactionClient, history: readonly Transaction[]) {
  if (!history.length || !await intakeStorageExists(tx)) return;
  const portfolio = history[0].facts.portfolioId;
  const rows = await tx.$queryRaw<{transaction_id:string;body:string;body_hash:string}[]>`SELECT transaction_id, body, body_hash FROM forward_intake_event WHERE portfolio_id=${portfolio}`;
  for (const row of rows) {
    const t = history.find(t => t.facts.id === row.transaction_id); if (!t) continue; // explicit old watermark
    const body = JSON.parse(row.body);
    requireRule(row.body_hash === intakeHash(body) && body.factsHash === intakeHash(t.facts) && body.transactionId === t.facts.id,"FORWARD_INTAKE_AUDIT_INTEGRITY");
  }
}
