declare const dateOnlyBrand: unique symbol;
declare const instantBrand: unique symbol;
export type DateOnly = string & { readonly [dateOnlyBrand]: true };
export type Instant = string & { readonly [instantBrand]: true };
/** Canonical calendar date; no timezone conversion. */
export function dateOnly(value: string): DateOnly {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
    throw new TypeError("Expected a valid YYYY-MM-DD calendar date");
  }
  return value as DateOnly;
}
/** Explicit UTC instant, millisecond precision; no implicit timezone or truncation. */
export function instant(value: string): Instant {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new TypeError("Expected a valid UTC timestamp YYYY-MM-DDTHH:mm:ss.sssZ");
  }
  return value as Instant;
}
