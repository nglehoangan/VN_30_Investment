import type { Clock, IdGenerator } from "@/ports/runtime";
import type { Instant } from "@/shared/time";
export function fixedClock(value: Instant): Clock { return { now: () => value }; }
export function sequenceIds(values: readonly string[]): IdGenerator {
  let index = 0;
  return { next() {
    const value = values[index++];
    if (value === undefined) throw new Error("Test ID sequence exhausted");
    return value;
  } };
}
