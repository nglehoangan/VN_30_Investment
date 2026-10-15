import { dateOnly, instant, type DateOnly, type Instant } from "@/shared/time";
import { ValidationError } from "@/shared/errors";

export function requireRule(condition: unknown, rule: string): asserts condition {
  if (!condition) throw new ValidationError([{ field: "transaction", reason: rule, expected: "Approved M2 accounting contract" }]);
}
/** M6.3 numeric-v1: exact input, 12 decimal accounting units, half-even only at division boundaries. */
const SCALE = 1_000_000_000_000n;
export class Decimal {
  private constructor(readonly units: bigint) { Object.freeze(this); }
  static parse(value: string): Decimal {
    requireRule(typeof value === "string" && /^-?(0|[1-9]\d{0,29})(\.\d{1,12})?$/.test(value), "EXACT_DECIMAL_REQUIRED");
    const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
    return new Decimal((BigInt(whole) * SCALE + BigInt(fraction.padEnd(12, "0"))) * (value.startsWith("-") ? -1n : 1n));
  }
  static readonly zero = new Decimal(0n);
  add(other: Decimal) { return new Decimal(this.units + other.units); }
  sub(other: Decimal) { return new Decimal(this.units - other.units); }
  neg() { return new Decimal(-this.units); }
  mul(other: Decimal) {
    const n = this.units * other.units;
    requireRule(n % SCALE === 0n, "PRODUCT_EXCEEDS_ACCOUNTING_SCALE");
    return new Decimal(n / SCALE);
  }
  /** One rounding boundary: released basis = open basis × sold quantity / prior quantity. */
  proportional(numerator: Decimal, denominator: Decimal) {
    return new Decimal(roundEven(this.units * numerator.units, denominator.units));
  }
  div(other: Decimal) { return new Decimal(roundEven(this.units * SCALE, other.units)); }
  eq(other: Decimal) { return this.units === other.units; }
  get positive() { return this.units > 0n; }
  get negative() { return this.units < 0n; }
  get isZero() { return this.units === 0n; }
  get integer() { return this.units % SCALE === 0n; }
  toString() {
    const abs = this.units < 0n ? -this.units : this.units;
    const fraction = (abs % SCALE).toString().padStart(12, "0").replace(/0+$/, "");
    return `${this.negative ? "-" : ""}${abs / SCALE}${fraction ? `.${fraction}` : ""}`;
  }
  toJSON() { return this.toString(); }
}
function roundEven(n: bigint, d: bigint): bigint {
  requireRule(d !== 0n, "ZERO_DENOMINATOR");
  const sign = (n < 0n) !== (d < 0n) ? -1n : 1n;
  n = n < 0n ? -n : n; d = d < 0n ? -d : d;
  const q = n / d, r = n % d;
  return sign * (q + (r * 2n > d || (r * 2n === d && q % 2n !== 0n) ? 1n : 0n));
}
export const decimal = (v: string) => Decimal.parse(v);
export type Currency = "VND";
export function currency(v: string): Currency { requireRule(v === "VND", "VND_ONLY"); return v; }
export interface Money { readonly amount: Decimal; readonly currency: Currency }
export const money = (amount: string, unit = "VND"): Money => Object.freeze({ amount: decimal(amount), currency: currency(unit) });
declare const numericUnit: unique symbol;
export type ShareQuantity = Decimal & { readonly [numericUnit]: "ShareQuantity" };
export type Price = Decimal & { readonly [numericUnit]: "Price" };
export type Rate = Decimal & { readonly [numericUnit]: "Rate" };
export type Percentage = Rate;
export const shareQuantity = (v: string) => { const q = decimal(v); requireRule(!q.negative && q.integer, "WHOLE_NONNEGATIVE_SHARES_REQUIRED"); return q as ShareQuantity; };
export const price = (v: string) => { const p = decimal(v); requireRule(p.positive, "POSITIVE_PRICE_REQUIRED"); return p as Price; };
export const rate = (v: string) => { const r = decimal(v); requireRule(!r.negative, "NONNEGATIVE_RATE_REQUIRED"); return r as Rate; };
export type TradeDate = DateOnly;
export type SettlementDate = DateOnly;
export type AsOf = Instant;
export const tradeDate = dateOnly, settlementDate = dateOnly, asOf = instant;
declare const idBrand: unique symbol;
type Id<T extends string> = string & { readonly [idBrand]: T };
function id<T extends string>(v: string): Id<T> {
  requireRule(typeof v === "string" && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(v), "OPAQUE_ID_REQUIRED");
  return v as Id<T>;
}
export type PortfolioId = Id<"Portfolio">;
export type SecurityId = Id<"Security">;
export type TransactionId = Id<"Transaction">;
export type LedgerWatermark = Id<"Watermark">;
export const portfolioId = (v: string) => id<"Portfolio">(v);
export const securityId = (v: string) => id<"Security">(v);
export const transactionId = (v: string) => id<"Transaction">(v);
export function watermark(v: string): LedgerWatermark { requireRule(/^(0|[1-9]\d{0,29})$/.test(v), "INVALID_WATERMARK"); return id<"Watermark">(v); }
export interface SourceReference { readonly source: string; readonly reference: string }
export function sourceReference(source: string, reference: string): SourceReference {
  requireRule(typeof source === "string" && source.trim().length > 0 && source.length <= 128 && typeof reference === "string" && reference.trim().length > 0 && reference.length <= 256, "SOURCE_EVIDENCE_REQUIRED");
  return Object.freeze({ source, reference });
}
export const ACCOUNTING_METHOD = "m63-mwac-decimal12-half-even-v1";
