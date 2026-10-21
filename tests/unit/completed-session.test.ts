import { expect, it } from 'vitest';
import { latestCompletedHoseSession } from '@/domain/market-boundary/completed-session';
import { HOSE_HOLIDAYS_2026, type HoseCalendar } from '@/domain/market-boundary/hose-calendar';
const calendar: HoseCalendar = { version: 'hose-calendar-2026-v1', validFrom: '2026-01-01', validThrough: '2026-12-31', holidayDates: HOSE_HOLIDAYS_2026, evidence: { id: 'test', hash: 'test', knownAt: '2026-01-01T00:00:00.000Z', effectiveAt: '2026-01-01T00:00:00.000Z' } };
it.each([
  ['2026-10-21T07:59:59.999Z', '2026-10-20'],
  ['2026-10-21T08:00:00.000Z', '2026-10-21'],
  ['2026-10-21T10:00:00.000Z', '2026-10-21'],
  ['2026-10-24T09:00:00.000Z', '2026-10-23'],
  ['2026-10-26T00:00:00.000Z', '2026-10-23'],
  ['2026-09-02T09:00:00.000Z', '2026-08-28'],
])('selects completed session at %s', (at, expected) => expect(latestCompletedHoseSession(at, calendar)).toBe(expected));
it('blocks outside the qualified calendar and rejects ambiguous clocks', () => {
  expect(() => latestCompletedHoseSession('2027-01-04T09:00:00.000Z', calendar)).toThrow('CALENDAR_OUTSIDE_QUALIFIED_RANGE');
  expect(() => latestCompletedHoseSession('2026-10-21T15:00:00+07:00', calendar)).toThrow();
});
