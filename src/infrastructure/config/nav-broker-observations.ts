import { z } from "zod";

const text = z.string().min(1).max(512);
const field = z.strictObject({ id: text, field: text, kind: z.enum(["CASH", "RECEIVABLE", "LIABILITY", "SECURITY", "CORPORATE_ACTION"]), value: z.string().regex(/^-?(0|[1-9]\d{0,29})(\.\d{1,12})?$/).nullable(), unit: z.enum(["VND", "SHARES"]), securityId: text.nullable(), lifecycle: z.enum(["ORDINARY", "PENDING", "UNKNOWN"]).nullable(), reference: text, pointer: z.string().max(1024).startsWith("/") });
export const brokerObservationSchema = z.strictObject({ schema: z.literal("nav-broker-observations-v1"), documentId: text, provider: text, accountId: text, portfolioId: text, perimeterId: text, observedAt: text, retrievedAt: text, knownAt: text, publicationAt: text.nullable(), currency: z.literal("VND"), fields: z.array(field).max(1000), conflicts: z.array(text).max(100) });
