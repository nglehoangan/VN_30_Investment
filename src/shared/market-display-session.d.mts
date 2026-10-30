export const DISPLAY_PRICE_POLICY: string;
export interface DisplaySession {date:string;state:string;inSession:boolean;previousSession:string;expectedCloseDate:string;calendarVersion:string}
export function localSession(at:string):DisplaySession;
export function isTradingDay(date:string):boolean;
export function previousSession(date:string):string;
export function closeInstant(date:string):string;
export function verifyDisplaySelection(price:Record<string,unknown>):DisplaySession;
