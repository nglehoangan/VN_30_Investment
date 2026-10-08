import { describe, expect, it } from 'vitest';
import { parseBrokerApiData } from '@/infrastructure/config/broker-api-data';
const row = (apiId: string, data: unknown) => ({ apiId, receivedAt: '2026-10-08T05:00:00.000Z', httpStatus: 200, data });
describe('API display data', () => {
  it('exposes selected fields and masks sub-account numbers', () => {
    const result = parseBrokerApiData([
      row('2.1', { privateField: 'private', bankSubAccounts: [{ accountType: 'NORMAL', accountNo: 'TEST12345678', status: '1' }] }),
      row('5.1', { tradingDate: '08/10/2026', data: [{ symbol: 'AAA', matchPrice: 12000, refPrice: 11000, changePercent: null, totalVol: 100 }] }),
      row('4.4', { totalCount: 0, data: null }),
    ]);
    expect(result.accounts[0].number).toBe('••••5678');
    expect(JSON.stringify(result)).not.toContain('TEST12345678');
    expect(JSON.stringify(result)).not.toContain('privateField');
    expect(result.quotes[0].price).toBe(12000);
    expect(result.quotes[0].changePercent).toBeNull();
    expect(result.orderCount).toBe(0);
  });
  it('keeps unsupported or contradictory response shapes unavailable', () => {
    const result = parseBrokerApiData([row('4.4', { totalCount: 2, data: null }), row('5.1', { data: null })]);
    expect(result.orderCount).toBeUndefined();
    expect(result.quotes).toEqual([]);
  });
});
