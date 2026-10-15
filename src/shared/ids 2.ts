declare const methodologyIdBrand: unique symbol;
export type MethodologyId = string & { readonly [methodologyIdBrand]: true };
/** Opaque immutable identity; never derive it from a ticker or methodology label. */
export function methodologyId(value: string): MethodologyId {
  if (!value || value.trim() !== value) throw new TypeError("Expected a nonempty opaque methodology ID without surrounding whitespace");
  return value as MethodologyId;
}
