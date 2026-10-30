import { z } from "zod";
const source = z.strictObject({
  value:z.string().regex(/^[1-9]\d{0,15}$/),tradingDate:z.iso.date(),receivedAt:z.iso.datetime(),
  sourceObservationId:z.string().startsWith('TCBS_API_RESPONSE:'),sourcePointer:z.string().regex(/^\/data\/data\/\d+\/(close|matchPrice|open)$/),rawSourceSha256:z.string().regex(/^[a-f0-9]{64}$/),
});
const common=source.extend({ticker:z.string().regex(/^[A-Z][A-Z0-9]{0,19}$/),field:z.enum(['MATCH_PRICE','DAILY_BAR_CLOSE_REFERENCE']),unit:z.literal('VND_PER_SHARE')});
export const directMarketPriceSchema=z.discriminatedUnion('schemaVersion',[
 common.extend({schemaVersion:z.literal('tcbs-display-price-v1')}),
 common.extend({schemaVersion:z.literal('tcbs-display-price-v2'),policyVersion:z.literal('hose-owner-display-selection-v2'),selectedAt:z.iso.datetime(),sessionDate:z.iso.date(),sessionState:z.enum(['PRE_OPEN','OPENING_AUCTION','MORNING','LUNCH_BREAK','AFTERNOON','CLOSING_AUCTION','AFTER_CLOSE','NON_TRADING_DAY']),selectionMode:z.enum(['IN_SESSION','OUTSIDE_SESSION']),timezone:z.literal('Asia/Ho_Chi_Minh'),calendarVersion:z.literal('hose-display-calendar-2026-v1'),expectedCloseDate:z.iso.date(),selectionStatus:z.enum(['MATCH_PRICE_SELECTED','COMPLETED_CLOSE_SELECTED','MATCH_UNAVAILABLE_USING_COMPLETED_CLOSE','EXPECTED_CLOSE_NOT_AVAILABLE']),openingReferenceBasis:z.literal('PREVIOUS_SESSION_CLOSE_BY_OWNER_RULE'),openingReference:source.nullable(),exchangeOpen:source.nullable(),adjustment:z.literal('PROVIDER_UNDECLARED')}),
]);
