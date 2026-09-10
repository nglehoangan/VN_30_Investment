import { expect, it } from "vitest";
import { validateMethodology } from "@/infrastructure/repositories/methodology-schema";
import { methodologyFixture } from "../fixtures/methodology";
import { ValidationError } from "@/shared/errors";
it.each(["1.0.0", "0.0.0", "1.0.0-alpha.1", "2.3.4+build.001", "1.2.3-rc.1+build.3"])("accepts semantic version %s", value => {
  expect(validateMethodology({ ...methodologyFixture(), semanticVersion: value }).semanticVersion).toBe(value);
});
it.each(["1", "01.0.0", "1.0.0-01", "1.0.0-", "1.0.0+", "1.0.0+a+b"])("rejects invalid semantic version %s", value => {
  expect(() => validateMethodology({ ...methodologyFixture(), semanticVersion: value })).toThrow(ValidationError);
});
it("rejects invalid date/instant and blank lineage with structured issues", () => {
  for (const patch of [{ effectiveDate: "2023-02-29" }, { recordedAt: "2024-01-01" }, { configurationReference: " " }, { approvalReference: "" }]) {
    expect(() => validateMethodology({ ...methodologyFixture(), ...patch })).toThrow(ValidationError);
  }
});
