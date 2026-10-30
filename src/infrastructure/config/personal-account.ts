import { z } from "zod";
const amount = z.string().regex(/^(0|[1-9]\d{0,29})(\.\d{1,12})?$/);
const quantity = z.string().regex(/^(0|[1-9]\d*)$/);
export const personalAccountSchema = z.strictObject({
  schemaVersion: z.literal("personal-account-v1"), portfolioId: z.string().min(1), ledgerWatermark: quantity,
  asOfDate: z.iso.date(), cash: amount, pendingDividends: amount, custodyFee: amount, withdrawable: amount,
  linkedBankAvailable: amount, buyingPower: amount, brokerReportedNav: amount,
  positions: z.array(z.strictObject({ ticker: z.string().regex(/^[A-Z][A-Z0-9]{1,9}$/), isin: z.string().regex(/^[A-Z]{2}[A-Z0-9]{9}\d$/), quantity, tradableQuantity: quantity, pendingQuantity: quantity, importedCost: amount })).min(1).max(100),
});
