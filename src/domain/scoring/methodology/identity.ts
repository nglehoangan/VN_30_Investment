export const IMPLEMENTATION = "m64-clarification-1";
export const VERSION = "1.0.0";
export const CATEGORY_MAXIMA = { BQ: 25, FH: 15, GQ: 15, IC: 10, VAL: 20, RG: 10, CA: 5 } as const;
export type Category = keyof typeof CATEGORY_MAXIMA;
