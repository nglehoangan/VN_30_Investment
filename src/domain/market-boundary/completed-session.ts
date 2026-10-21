import { instant, vietnamBusinessDate } from '@/shared/time';
import { isHoseSession, type HoseCalendar } from './hose-calendar';

/** 15:00 Vietnam cutoff; holidays/weekends select the preceding qualified session. */
export function latestCompletedHoseSession(at: string, calendar: HoseCalendar): string {
  let date: string = vietnamBusinessDate(instant(at));
  for (let n = 0; n < 14; n++) {
    if (isHoseSession(date, calendar) && at >= date + 'T08:00:00.000Z') return date;
    date = new Date(Date.parse(date + 'T00:00:00.000Z') - 86400000).toISOString().slice(0, 10);
  }
  throw Error('MARKET_BOUNDARY:COMPLETED_SESSION_UNKNOWN');
}
