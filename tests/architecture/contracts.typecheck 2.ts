import type { MethodologyId } from "@/shared/ids";
import type { DateOnly, Instant } from "@/shared/time";
import type { MethodologyRecord } from "@/domain/methodology/record";
function nominalContracts(id: MethodologyId, date: DateOnly, time: Instant, record: MethodologyRecord) {
  // @ts-expect-error A plain string cannot impersonate a validated identity.
  const invalidId: MethodologyId = "label";
  // @ts-expect-error A UTC instant cannot replace a date-only effective date.
  const invalidDate: DateOnly = time;
  // @ts-expect-error A date-only cannot replace an ingestion instant.
  const invalidTime: Instant = date;
  // @ts-expect-error Registry identity is immutable.
  record.methodologyId = id;
  return [invalidId, invalidDate, invalidTime];
}
void nominalContracts;
