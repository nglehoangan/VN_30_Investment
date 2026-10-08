// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
// Offline importer is also used by the private one-shot import command.
// @ts-expect-error JavaScript CLI exports have no declaration file.
import { normalizeCapture, storeObservations } from '../../api/import-captured.mjs';
import { parseBrokerSnapshot } from '../../src/infrastructure/config/broker-snapshot';
const at = '2026-10-08T05:00:00.000Z';
const capture = [
  { apiId: '2.1', httpStatus: 200, receivedAt: at, data: { basicInfo: { code105C: 'TEST' }, bankSubAccounts: [{ accountNo: 'SUB', accountType: 'NORMAL', status: '1' }] } },
  { apiId: '4.14', httpStatus: 200, receivedAt: at, data: { accountNo: 'SUB', custodyID: 'TEST', stock: [{ symbol: 'ABC', totalQtty: 12, availableTrading: 10, costPrice: 100, currentPrice: 120, cashDividend: 50 }] } },
  { apiId: '4.15', httpStatus: 200, receivedAt: at, data: { data: [{ accountNo: 'SUB', custodyID: 'TEST', cashBalance: 200, cashDevident: 50, avlWithdraw: 195 }] } },
];
describe('broker observations', () => {
  it('reconciles exact cash and unavailable shares; rejects cross-account evidence', () => {
    const snapshot = parseBrokerSnapshot(normalizeCapture(capture, '2026-09-30'));
    expect(snapshot.cash.total).toBe('250');
    expect(snapshot.totals).toEqual({ quantity: '12', tradeableQuantity: '10', marketValue: '1440', openCost: '1200' });
    expect(snapshot.positions[1].status).toBe('Chưa khả dụng');
    const wrong = structuredClone(capture);
    wrong[1].data.accountNo = 'OTHER';
    expect(() => normalizeCapture(wrong, '2026-09-30')).toThrow('Account mismatch');
    const mismatch = structuredClone(capture);
    mismatch[2].data.data![0].cashDevident = 51;
    expect(() => normalizeCapture(mismatch, '2026-09-30')).toThrow('Cash reconciliation failed');
  });
  it('imports atomically, is idempotent and preserves immutable evidence', () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec(readFileSync('prisma/migrations/202610080001_broker_observations/migration.sql', 'utf8'));
      const snapshot = normalizeCapture(capture, '2026-09-30');
      expect(storeObservations(db, capture, snapshot, snapshot)).toBe(4);
      expect(storeObservations(db, capture, snapshot, snapshot)).toBe(0);
      expect(() => db.exec("UPDATE broker_observation SET body='changed'")).toThrow('immutable');
      expect(() => db.exec('DELETE FROM broker_observation')).toThrow('immutable');
      expect(db.prepare('SELECT COUNT(*) AS count FROM broker_observation').get()?.count).toBe(4);
    } finally { db.close(); }
  });
});
