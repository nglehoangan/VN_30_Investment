import { z } from 'zod';
import type { BrokerApiData } from '@/domain/portfolio/broker-api-data';
const envelope = z.object({ apiId: z.string(), receivedAt: z.iso.datetime(), httpStatus: z.number().int(), data: z.unknown() });
const profile = z.object({ bankSubAccounts: z.array(z.object({ accountType: z.string(), accountNo: z.string(), status: z.string() })) });
const market = z.object({ tradingDate: z.string(), data: z.array(z.object({ symbol: z.string().regex(/^[A-Z0-9]{1,20}$/), matchPrice: z.number().finite().nonnegative(), refPrice: z.number().finite().nonnegative(), changePercent: z.number().finite().nullish(), totalVol: z.number().int().nonnegative() })).max(100) });
const orders = z.object({ totalCount: z.number().int().nonnegative(), data: z.array(z.unknown()).nullable() });
export function parseBrokerApiData(values: readonly unknown[]): BrokerApiData {
  const rows = values.map(value => envelope.parse(value));
  const result: BrokerApiData = { sources: rows.map(({ apiId, receivedAt, httpStatus }) => ({ apiId, receivedAt, httpStatus })), accounts: [], quotes: [] };
  const data = (id: string) => rows.find(r => r.apiId === id && r.httpStatus === 200)?.data;
  const p = profile.safeParse(data('2.1'));
  if (p.success) result.accounts = p.data.bankSubAccounts.map(a => ({ type: a.accountType, number: `••••${a.accountNo.slice(-4)}`, active: a.status === '1' }));
  const m = market.safeParse(data('5.1'));
  if (m.success) {
    result.tradingDate = m.data.tradingDate;
    result.quotes = m.data.data.map(q => ({ symbol: q.symbol, price: q.matchPrice, reference: q.refPrice, changePercent: q.changePercent ?? null, volume: q.totalVol })).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }
  const o = orders.safeParse(data('4.4'));
  if (o.success && (o.data.data !== null || o.data.totalCount === 0)) result.orderCount = o.data.totalCount;
  return result;
}
