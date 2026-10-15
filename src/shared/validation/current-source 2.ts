import { z } from "zod";
const text = z.string().trim().min(1).max(500);
const time = z.iso.datetime();
const amount = z.string().regex(/^-?\d+(\.\d{1,12})?$/).max(80);
const evidence = z.strictObject({ id: text, source: text, asOf: time, receivedAt: time, validThrough: time, classification: z.enum(["FACT", "ESTIMATE", "ASSUMPTION"]), summary: text });
const section = z.strictObject({ area: text, securityId: text.nullable(), evidenceRefs: z.array(text).max(100), finding: z.enum(["UNCHANGED", "MATERIAL CHANGE", "MISSING", "NOT APPLICABLE"]), rationale: text });
const thesis = z.strictObject({ securityId: text, prior: z.enum(["INTACT", "IMPROVING", "WEAKENING", "BROKEN", "PENDING"]), current: z.enum(["INTACT", "IMPROVING", "WEAKENING", "BROKEN", "PENDING"]), evidenceRefs: z.array(text).max(100), rationale: text });
const trigger = z.strictObject({ id: text, category: z.enum(["COMPANY", "MARKET", "POSITION", "MANDATE / REFERENCE", "PORTFOLIO INTEGRITY"]), priority: z.enum(["HARD RISK / SOLVENCY / GOVERNANCE", "MANDATE / ELIGIBILITY", "PORTFOLIO INTEGRITY / RECONCILIATION", "THESIS-BREAK RISK", "CONCENTRATION / RISK BREACH", "MATERIAL FUNDAMENTAL DETERIORATION", "VALUATION / EXPECTED RETURN", "OPPORTUNITY REVIEW", "TECHNICAL EXECUTION"]), severity: z.enum(["T0", "T1", "T2", "T3", "T4"]), effectiveAt: time, evidenceRefs: z.array(text).min(1).max(100), verified: z.boolean(), decisionReady: z.boolean(), governingRule: text, affectedSecurityId: text.nullable(), requiredEvidence: text, rationale: text });
const reference = z.strictObject({ version: text, intervals: z.array(z.strictObject({ id: text, kind: z.enum(["IDENTIFIER", "MEMBERSHIP", "COVERAGE", "SECTOR"]), securityId: text.nullable(), from: z.iso.date(), to: z.iso.date().nullable(), value: text, taxonomy: text.nullable(), sourceReference: text })).max(5000) });
const price = z.strictObject({ id: text, securityId: text, price: amount, currency: z.literal("VND"), observedAt: time, receivedAt: time, validThrough: time.nullable(), sourceReference: text, provider: text, revision: text, quality: z.enum(["VALID", "CONFLICTING_DATA", "INVALID"]), policyReference: text.nullable(), adjustment: z.enum(["RAW", "ADJUSTED"]) });
export const currentSourceSchema = z.strictObject({
  version: text, portfolioId: text, scope: z.enum(["FORMAL", "SYNTHETIC_TEST"]), asOf: time, receivedAt: time,
  ledgerWatermark: z.string().regex(/^\d+$/), taxonomy: text, valuationMethodologyId: text,
  prices: z.array(price).max(5000), references: reference,
  referenceAsOf: time, referenceValidThrough: time.nullable(), referencePolicy: text.nullable(),
  reconciliation: z.strictObject({ id: text, portfolioId: text, asOf: time, receivedAt: time, sourceReference: text, cash: amount, positions: z.array(z.strictObject({ securityId: text, quantity: amount, openCost: amount.nullable() })).max(5000), receivables: amount.nullable(), payables: amount.nullable(), unresolvedDiscrepancy: z.boolean() }).nullable(),
  analyst: z.strictObject({ version: text, reviewer: text, asOf: time, receivedAt: time, validThrough: time, sourceReference: text, evidence: z.array(evidence).max(100), sections: z.array(section).max(100), theses: z.array(thesis).max(30), triggers: z.array(trigger).max(100), nextReview: text, governance: z.enum(["NO POLICY CHANGE", "OPERATIONAL IMPROVEMENTS ONLY", "MODEL/RULE VALIDATION REQUIRED", "POLICY REVIEW PROPOSAL REQUIRED"]).nullable() }).nullable(),
});
export type CurrentSource = z.infer<typeof currentSourceSchema>;
export const reviewIntentSchema = z.strictObject({ type: z.enum(["WEEKLY", "MONTHLY_DCA", "QUARTERLY", "ANNUAL", "EVENT_DRIVEN"]), requestedDate: z.iso.date(), contributionReference: text.nullable(), eventReference: text.nullable() });
export type ReviewIntent = z.infer<typeof reviewIntentSchema>;
