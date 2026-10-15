import { z } from "zod";
import { parseBoundary } from "@/shared/validation/parse";
import { decimalString } from "@/shared/validation/decimal-string";
import { transactionTypes, type TransactionInput } from "@/domain/portfolio/transaction";
import { transactionId, portfolioId, securityId } from "@/domain/portfolio/values";
import { methodologyId } from "@/shared/ids";
import { instant, dateOnly } from "@/shared/time";
const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/);
const text = z.string().trim().min(1).max(512);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timestamp = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
const amount = decimalString;
const schema = z.strictObject({
  id, portfolioId: id, type: z.enum(transactionTypes), eventAt: timestamp, effectiveAt: timestamp,
  source: z.strictObject({ source: text, reference: text }), idempotencyKey: id, methodologyId: id, currency: z.literal("VND"),
  securityId: id.optional(), tradeDate: date.optional(), settlementDate: date.optional(), quantity: amount.optional(), price: amount.optional(), amount: amount.optional(),
  fee: amount.optional(), tax: amount.optional(), representation: z.enum(["NET_SETTLEMENT", "SPLIT_SETTLEMENT"]).optional(),
  settlesId: id.optional(), reversesId: id.optional(), correctionGroupId: id.optional(), notes: text.optional(),
  dividend: z.strictObject({ net: amount, gross: amount.nullable(), withholding: amount.nullable(), entitlementDate: date.optional(), eventReference: text.optional() }).optional(),
  adjustment: z.strictObject({ reasonCode: text, evidence: text, note: text }).optional(),
  opening: z.strictObject({ cost: amount, migrationVersion: text, evidence: text }).optional(),
  corporateAction: z.strictObject({ id, subtype: text, numerator: amount, denominator: amount, evidence: text, stage: z.enum(["EFFECTIVE", "SETTLEMENT"]), basis: amount.optional(), destinationSecurityId: id.optional(), destinationQuantity: amount.optional(), originatingTransactionId: id.optional() }).optional(),
});
/** Domain constructors subsequently validate nominal IDs, calendar dates and economic invariants. */
export function parsePortfolioCommands(value: unknown): readonly TransactionInput[] {
  const parsed = parseBoundary(z.array(schema).min(1).max(100), value, { "$": "Explicit bounded transaction command with exact decimal strings" });
  return parsed.map(f => ({ ...f, id: transactionId(f.id), portfolioId: portfolioId(f.portfolioId), methodologyId: methodologyId(f.methodologyId),
    eventAt: instant(f.eventAt), effectiveAt: instant(f.effectiveAt), securityId: f.securityId ? securityId(f.securityId) : undefined,
    tradeDate: f.tradeDate ? dateOnly(f.tradeDate) : undefined, settlementDate: f.settlementDate ? dateOnly(f.settlementDate) : undefined,
    settlesId: f.settlesId ? transactionId(f.settlesId) : undefined, reversesId: f.reversesId ? transactionId(f.reversesId) : undefined,
    corporateAction: f.corporateAction ? { ...f.corporateAction, destinationSecurityId: f.corporateAction.destinationSecurityId ? securityId(f.corporateAction.destinationSecurityId) : undefined, originatingTransactionId: f.corporateAction.originatingTransactionId ? transactionId(f.corporateAction.originatingTransactionId) : undefined } : undefined,
    dividend: f.dividend ? { ...f.dividend, entitlementDate: f.dividend.entitlementDate ? dateOnly(f.dividend.entitlementDate) : undefined } : undefined }));
}
