import { z } from "zod";
export const manualTransactionSchema = z.strictObject({
  type: z.enum(["CASH_DEPOSIT", "CASH_WITHDRAWAL", "BUY", "SELL", "FEE", "TAX", "REVERSAL", "TRADE_SETTLEMENT", "DIVIDEND_CASH"]),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  security: z.string().max(128), quantity: z.string().max(64), price: z.string().max(64),
  amount: z.string().max(64), fee: z.string().max(64), tax: z.string().max(64), reference: z.string().max(128),
  sourceReference: z.string().trim().min(1).max(128),
});
export type ManualTransactionDraft = z.infer<typeof manualTransactionSchema>;
