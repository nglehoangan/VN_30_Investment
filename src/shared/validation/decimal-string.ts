import { z } from "zod";
/** Syntax only: exact signed decimal text; no scale/rounding/currency policy or conversion. */
export const decimalString = z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/);
