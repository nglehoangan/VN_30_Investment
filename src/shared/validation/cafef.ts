import {z} from 'zod';
/** Observed CafeF public response schema. Numeric financial tokens remain lexical strings. */
const integer=z.union([z.string().regex(/^\d+$/),z.number().int()]).transform(Number).refine(Number.isSafeInteger);
const cell=z.object({code:z.string(),value:z.union([z.string(),z.number(),z.null()]),static:z.boolean().optional()}).passthrough();
const signedInteger=z.union([z.string().regex(/^-?\d+$/),z.number().int()]).transform(Number).refine(Number.isSafeInteger);
export const cafeFRecordSchema=z.object({symbol:z.string(),year:integer,quater:signedInteger,type:z.string(),content:z.string(),time:z.string(),data:z.array(cell)}).passthrough();
export const cafeFGroupSchema=z.object({code:z.string(),name:z.string(),number:integer.optional(),data:z.array(cafeFRecordSchema)}).passthrough();
const templateRow=z.object({code:z.string(),name:z.string(),lever:integer.optional(),number:integer.optional(),static:z.boolean().optional()}).passthrough();
const templateGroup=z.object({code:z.string(),name:z.string(),number:integer.optional(),data:z.array(templateRow)}).passthrough();
export const cafeFResponseSchema=z.object({isSuccess:z.literal(true),value:z.object({templace:z.array(z.union([templateGroup,templateRow])),count:integer,unit:z.unknown().optional(),type:z.string().nullable().optional(),timeType:z.string().optional(),data:z.union([z.array(cafeFRecordSchema),z.array(cafeFGroupSchema)])}).passthrough()}).passthrough();
export type CafeFTemplateRow=z.infer<typeof templateRow>;
