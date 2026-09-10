import { methodologyId } from "@/shared/ids";
import { dateOnly, instant } from "@/shared/time";
import type { MethodologyRecord } from "@/domain/methodology/record";
export function methodologyFixture(id = "test-only-methodology-1"): MethodologyRecord {
  return Object.freeze({ methodologyId: methodologyId(id), family: "TEST_ONLY", semanticVersion: "1.0.0",
    approvalReference: "test-only-not-production-approval", effectiveDate: dateOnly("2024-02-29"),
    configurationReference: "test-only-immutable-config", implementationIdentity: "test-only-build",
    governingDocumentReference: "test-fixture", recordedAt: instant("2024-02-29T00:00:00.000Z") });
}
