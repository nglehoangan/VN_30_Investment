// Offline import: never authenticates or issues a broker request.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';
import { loadDatabaseConfig } from '../src/infrastructure/config/database.ts';
import { prepareDatabaseFile } from '../src/infrastructure/db/files.ts';
export const hash = body => createHash('sha256').update(body).digest('hex');
const integer = value => {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid broker integer');
  return BigInt(value);
};
export function normalizeCapture(capture, trackingStartDate) {
  const get = id => {
    const rows = capture.filter(r => r.apiId === id && r.httpStatus === 200);
    if (rows.length !== 1 || !Number.isFinite(Date.parse(rows[0].receivedAt))) throw new Error('Missing or ambiguous capture');
    return rows[0];
  };
  const profile = get('2.1'), assets = get('4.14'), cash = get('4.15');
  const accounts = profile.data.bankSubAccounts.filter(a => a.accountType === 'NORMAL' && a.status === '1');
  if (accounts.length !== 1 || assets.data.accountNo !== accounts[0].accountNo || assets.data.custodyID !== profile.data.basicInfo.code105C) throw new Error('Account mismatch');
  if (cash.data.data.length !== 1 || cash.data.data[0].accountNo !== assets.data.accountNo || cash.data.data[0].custodyID !== assets.data.custodyID) throw new Error('Cash account mismatch');
  const positions = assets.data.stock.flatMap(s => {
    if (!/^[A-Z0-9]{1,20}$/.test(s.symbol)) throw new Error('Invalid symbol');
    const total = integer(s.totalQtty), available = integer(s.availableTrading);
    if (available > total) throw new Error('Invalid available shares');
    return [[s.symbol, available, 'Giao dịch'], [s.symbol + '_UNAVAILABLE', total - available, 'Chưa khả dụng']]
      .filter(([, quantity]) => quantity > 0n).map(([symbol, quantity, status]) => ({
        symbol, status, quantity: String(quantity), unitCost: String(integer(s.costPrice)), price: String(integer(s.currentPrice)),
        openCost: String(quantity * integer(s.costPrice)), marketValue: String(quantity * integer(s.currentPrice)),
      }));
  });
  if (!positions.length || new Set(positions.map(p => p.symbol)).size !== positions.length) throw new Error('Invalid holdings');
  const c = cash.data.data[0], balance = integer(c.cashBalance), pending = integer(c.cashDevident), withdrawable = integer(c.avlWithdraw);
  if (withdrawable > balance || assets.data.stock.reduce((sum, s) => sum + integer(s.cashDividend), 0n) !== pending) throw new Error('Cash reconciliation failed');
  const sum = (field, available = false) => String(positions.filter(p => !available || p.status === 'Giao dịch').reduce((sum, p) => sum + BigInt(p[field]), 0n));
  return { format: 'vvios-broker-snapshot-v1', broker: 'TCBS', currency: 'VND', timeBasis: 'RETRIEVED_AT',
    holdingsAsOf: assets.receivedAt, cashAsOf: cash.receivedAt, trackingStartDate, positions,
    cash: { balance: String(balance), pendingDividends: String(pending), total: String(balance + pending), withdrawable: String(withdrawable) },
    totals: { quantity: sum('quantity'), tradeableQuantity: sum('quantity', true), marketValue: sum('marketValue'), openCost: sum('openCost') },
    sources: [{ kind: 'HOLDINGS', file: 'api-4-14.json', sha256: hash(JSON.stringify(assets)) }, { kind: 'CASH', file: 'api-4-15.json', sha256: hash(JSON.stringify(cash)) }],
  };
}
export function storeObservations(db, capture, snapshot, historical) {
  const rows = [...capture.map(r => ({ kind: 'TCBS_API_RESPONSE', apiId: r.apiId, receivedAt: r.receivedAt, value: r })),
    { kind: 'BROKER_SNAPSHOT', apiId: null, receivedAt: historical.cashAsOf, value: historical },
    { kind: 'BROKER_SNAPSHOT', apiId: null, receivedAt: snapshot.cashAsOf, value: snapshot }];
  let inserted = 0;
  db.exec('BEGIN IMMEDIATE');
  try {
    const insert = db.prepare('INSERT INTO broker_observation(id,kind,api_id,received_at,body,body_hash) VALUES(?,?,?,?,?,?)');
    const find = db.prepare('SELECT body,body_hash FROM broker_observation WHERE id=?');
    for (const row of rows) {
      const body = JSON.stringify(row.value), bodyHash = hash(body), id = `${row.kind}:${bodyHash}`;
      const prior = find.get(id);
      if (prior) { if (prior.body !== body || prior.body_hash !== bodyHash) throw new Error('Stored evidence mismatch'); }
      else { insert.run(id, row.kind, row.apiId, row.receivedAt, body, bodyHash); inserted++; }
    }
    db.exec('COMMIT');
    return inserted;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.umask(0o077);
  if (existsSync('.env.local')) process.loadEnvFile('.env.local');
  const capture = JSON.parse(readFileSync('data/api-import/capture.json', 'utf8'));
  const historical = JSON.parse(readFileSync('data/onboarding/tcbs-2026-09-30/active-snapshot.json', 'utf8'));
  const snapshot = normalizeCapture(capture, historical.trackingStartDate);
  const config = loadDatabaseConfig(process.env, process.cwd());
  prepareDatabaseFile(config);
  const db = new DatabaseSync(config.filePath);
  try {
    db.exec('PRAGMA busy_timeout=5000');
    const inserted = storeObservations(db, capture, snapshot, historical);
    console.log(JSON.stringify({ inserted, cash: snapshot.cash, totals: snapshot.totals, positions: snapshot.positions.length }));
  } finally { db.close(); }
}
