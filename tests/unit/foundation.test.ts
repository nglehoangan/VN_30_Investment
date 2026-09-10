import { describe, expect, it, vi, afterEach } from "vitest";
import { dateOnly, instant } from "@/shared/time";
import { methodologyId } from "@/shared/ids";
import { systemClock, uuidGenerator } from "@/infrastructure/runtime";
import { findMethodology } from "@/application/methodology/find-methodology";
import { fixedClock, sequenceIds } from "../fixtures/runtime";
import type { MethodologyRecord } from "@/domain/methodology/record";
vi.mock("node:crypto", () => {
  const randomUUID = () => "00000000-0000-4000-8000-000000000001";
  return { randomUUID, default: { randomUUID } };
});
afterEach(() => vi.useRealTimers());
describe("foundation primitives", () => {
  it("preserves calendar dates and UTC instants through JSON", () => {
    const value = { date: dateOnly("2024-02-29"), time: instant("2024-02-29T00:00:00.000Z") };
    expect(JSON.parse(JSON.stringify(value))).toEqual(value);
  });
  it.each(["2023-02-29", "2024-02-30", "2024-13-01", "2024-01-01T00:00:00Z", ""])("rejects invalid date %s", value => {
    expect(() => dateOnly(value)).toThrow(TypeError);
  });
  it.each(["2024-02-30T00:00:00.000Z", "2024-01-01", "2024-01-01T00:00:00+07:00", "2024-01-01T00:00:00.0001Z"])("rejects noncanonical instant %s", value => {
    expect(() => instant(value)).toThrow(TypeError);
  });
  it("rejects empty/whitespace IDs without coercion", () => {
    for (const value of ["", " ", " id"]) expect(() => methodologyId(value)).toThrow(TypeError);
    expect(methodologyId("test-methodology-1")).toBe("test-methodology-1");
  });
});
describe("controlled runtime", () => {
  it("uses injected clock and per-test sequence, fails instead of random fallback", () => {
    const timestamp = instant("2024-01-01T00:00:00.000Z");
    expect(fixedClock(timestamp).now()).toBe(timestamp);
    const ids = sequenceIds(["first", "second"]);
    expect([ids.next(), ids.next()]).toEqual(["first", "second"]);
    expect(() => ids.next()).toThrow("exhausted");
    expect(sequenceIds(["first"]).next()).toBe("first");
  });
  it("system clock returns the controlled UTC time", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    expect(systemClock.now()).toBe("2024-01-01T00:00:00.000Z");
  });
  it("UUID adapter delegates to the controlled native ID boundary", () => {
    expect(uuidGenerator.next()).toBe("00000000-0000-4000-8000-000000000001");
  });
});
it("queries exactly the pinned methodology ID and preserves missing result", async () => {
  const id = methodologyId("test-only-methodology");
  const record: MethodologyRecord = Object.freeze({ methodologyId: id, family: "TEST_ONLY", semanticVersion: "0.0.0", approvalReference: "fixture-not-production-approval", effectiveDate: dateOnly("2024-01-01"), configurationReference: "fixture-immutable-config", implementationIdentity: "fixture-build", governingDocumentReference: "test-fixture", recordedAt: instant("2024-01-01T00:00:00.000Z") });
  const lookup = vi.fn(async (key) => key === id ? record : null);
  expect(await findMethodology({ findById: lookup }, id)).toBe(record);
  expect(lookup).toHaveBeenCalledWith(id);
  expect(await findMethodology({ findById: lookup }, methodologyId("missing"))).toBeNull();
});
