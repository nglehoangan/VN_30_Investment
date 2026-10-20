import type { Evidence, SessionPolicy } from './contracts';
import { requireBoundary } from './validation';
import { dateOnly,instant } from '@/shared/time';
/** Versioned2026 source calendar; outside its evidence range is UNKNOWN, never a weekday guess. */
export interface HoseCalendar {readonly version:'hose-calendar-2026-v1';readonly evidence:Evidence;readonly holidayDates:readonly string[];readonly validFrom:'2026-01-01';readonly validThrough:'2026-12-31'}
export const HOSE_HOLIDAYS_2026=['2026-01-01','2026-01-02','2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20','2026-04-27','2026-04-30','2026-05-01','2026-08-31','2026-09-01','2026-09-02'] as const;
export function isHoseSession(date:string,calendar:HoseCalendar){dateOnly(date);requireBoundary(calendar.version==='hose-calendar-2026-v1'&&date>=calendar.validFrom&&date<=calendar.validThrough,'CALENDAR_OUTSIDE_QUALIFIED_RANGE');const day=new Date(date+'T00:00:00.000Z').getUTCDay();return day!==0&&day!==6&&!calendar.holidayDates.includes(date);}
export function nextHoseSession(date:string,calendar:HoseCalendar){let d=new Date(date+'T00:00:00.000Z');for(let n=0;n<14;n++){d=new Date(d.getTime()+86400000);const next=d.toISOString().slice(0,10);if(isHoseSession(next,calendar))return next;}throw Error('MARKET_BOUNDARY:NEXT_SESSION_UNKNOWN');}
/** EOD valuations use last completed session, never authorize intraday capital/execution. No arbitrary day-age threshold. */
export function eodPolicy(date:string,calendar:HoseCalendar,identity:Evidence):SessionPolicy {
 requireBoundary(isHoseSession(date,calendar),'NO_SESSION_ON_DATE');const next=nextHoseSession(date,calendar);
 const from=date+'T08:00:00.000Z',through=next+'T07:59:59.999Z';instant(from);instant(through);
 return {...identity,timezone:'Asia/Ho_Chi_Minh',calendar:calendar.evidence,purposes:['VALUATION'],field:'CLOSE',adjustment:'RAW',windows:[{from,through,tradingDate:date,session:'HOSE_DAILY_COMPLETED',observationCutoff:from}]};
}
