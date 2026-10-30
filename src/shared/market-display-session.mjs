import calendar from './hose-display-calendar-2026.json' with {type:'json'};
export const DISPLAY_PRICE_POLICY='hose-owner-display-selection-v2';
export function localSession(at){
 if(!Number.isFinite(Date.parse(at)))throw Error('INVALID_SELECTION_TIME');
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:calendar.timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(at)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 const date=`${parts.year}-${parts.month}-${parts.day}`,seconds=Number(parts.hour)*3600+Number(parts.minute)*60+Number(parts.second);
 const trading=isTradingDay(date);let state;
 if(!trading)state='NON_TRADING_DAY';else if(seconds<9*3600)state='PRE_OPEN';else if(seconds<9*3600+15*60)state='OPENING_AUCTION';else if(seconds<11*3600+30*60)state='MORNING';else if(seconds<13*3600)state='LUNCH_BREAK';else if(seconds<14*3600+30*60)state='AFTERNOON';else if(seconds<14*3600+45*60)state='CLOSING_AUCTION';else state='AFTER_CLOSE';
 return {date,state,inSession:['OPENING_AUCTION','MORNING','AFTERNOON','CLOSING_AUCTION'].includes(state),previousSession:previousSession(date),expectedCloseDate:trading&&state==='AFTER_CLOSE'?date:previousSession(date),calendarVersion:calendar.version};
}
export function isTradingDay(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('INVALID_SESSION_DATE');
 if(date<calendar.validFrom||date>calendar.validThrough)throw Error('DISPLAY_CALENDAR_OUTSIDE_SUPPORTED_RANGE');
 const weekday=new Date(date+'T00:00:00.000Z').getUTCDay();if(!Number.isFinite(weekday))throw Error('INVALID_SESSION_DATE');
 return weekday!==0&&weekday!==6&&!calendar.holidays.includes(date);
}
export function previousSession(date){let d=new Date(date+'T00:00:00.000Z');for(let n=0;n<20;n++){d=new Date(d.getTime()-86400000);const s=d.toISOString().slice(0,10);if(isTradingDay(s))return s;}throw Error('PREVIOUS_SESSION_UNKNOWN');}
export const closeInstant=date=>date+'T07:45:00.000Z';
const hashPattern=/^[a-f0-9]{64}$/;
/** Shared policy validation at publication and read time; source pointers are independently checked by the reader. */
export function verifyDisplaySelection(p){
 if(p.schemaVersion!=='tcbs-display-price-v2'||p.policyVersion!==DISPLAY_PRICE_POLICY)throw Error('DISPLAY_POLICY_VERSION');
 const s=localSession(p.selectedAt);
 if(p.sessionDate!==s.date||p.sessionState!==s.state||p.calendarVersion!==s.calendarVersion||p.expectedCloseDate!==s.expectedCloseDate||p.selectionMode!==(s.inSession?'IN_SESSION':'OUTSIDE_SESSION')||p.timezone!==calendar.timezone||p.openingReferenceBasis!=='PREVIOUS_SESSION_CLOSE_BY_OWNER_RULE')throw Error('DISPLAY_SESSION_BINDING');
 if(Date.parse(p.receivedAt)>Date.parse(p.selectedAt))throw Error('FUTURE_PRICE_CAPTURE');
 if(p.openingReference&&(p.openingReference.tradingDate!==s.previousSession||Date.parse(p.openingReference.receivedAt)>Date.parse(p.selectedAt)||!hashPattern.test(p.openingReference.rawSourceSha256)||Date.parse(closeInstant(p.openingReference.tradingDate))>Date.parse(p.openingReference.receivedAt)))throw Error('OPENING_REFERENCE_SESSION_BINDING');
 if(p.exchangeOpen&&(!isTradingDay(s.date)||p.exchangeOpen.tradingDate!==s.date||Date.parse(p.exchangeOpen.receivedAt)>Date.parse(p.selectedAt)||localSession(p.exchangeOpen.receivedAt).date!==s.date))throw Error('EXCHANGE_OPEN_SESSION_BINDING');
 if(p.field==='MATCH_PRICE'){
  if(!p.exchangeOpen||p.exchangeOpen.sourceObservationId!==p.sourceObservationId||p.exchangeOpen.sourcePointer!==p.sourcePointer.replace(/matchPrice$/,'open')||!s.inSession||p.tradingDate!==s.date||!localSession(p.receivedAt).inSession||localSession(p.receivedAt).date!==s.date||p.selectionStatus!=='MATCH_PRICE_SELECTED')throw Error('INTRADAY_QUOTE_SESSION_BINDING');
 }else if(p.field==='DAILY_BAR_CLOSE_REFERENCE'){
  if(!isTradingDay(p.tradingDate)||p.tradingDate>s.expectedCloseDate||Date.parse(closeInstant(p.tradingDate))>Date.parse(p.receivedAt)||p.selectionStatus!==(p.tradingDate!==s.expectedCloseDate?'EXPECTED_CLOSE_NOT_AVAILABLE':s.inSession?'MATCH_UNAVAILABLE_USING_COMPLETED_CLOSE':'COMPLETED_CLOSE_SELECTED'))throw Error('COMPLETED_CLOSE_SESSION_BINDING');
 }else throw Error('DISPLAY_PRICE_FIELD');
 return s;
}
