/** Rebuild website-shaped JSON from immutable local captures. No network or DB writes. */
import './lib/ts-runtime.mjs';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, relative, join} from 'node:path';
const {mapCafeFDisplay, CAFEF_DISPLAY_REPORTS} = await import('../src/infrastructure/fundamentals/cafef-display.ts');
const {payloadHash} = await import('../src/infrastructure/fundamentals/cafef.ts');

const root = resolve(import.meta.dirname, '..');
const source = 'data/providers/cafef/poc-2026-10-13/requests.json';
const output = join(root, 'data/providers/cafef/display-v1');
const requests = JSON.parse(readFileSync(join(root, source), 'utf8'));
const symbols = [...new Set(requests.map(r => r.symbol))].sort();
mkdirSync(output, {recursive:true});
const manifest = {schemaVersion:'cafef-display-v1', source, files:[], failures:[]};
for (const ticker of symbols) {
  const result = {schemaVersion:'cafef-display-v1', ticker, sourceInventory:source,
    status:'PROVIDER_DISPLAY_ONLY', productionAdmissible:false,
    reports:Object.fromEntries(Object.values(CAFEF_DISPLAY_REPORTS).map(r => [r.key, {...r, periods:{}}]))};
  const seen = new Set();
  for (const request of requests.filter(r => r.symbol === ticker)) {
    const identity = JSON.stringify([request.endpoint, request.TypeTime, request.payloadHash]);
    if (seen.has(identity)) continue;
    seen.add(identity);
    try {
      if (request.httpStatus !== 200 || request.error) throw Error('REQUEST_FAILED');
      const path = resolve(root, request.rawPayloadLocation);
      if (!relative(root, path).startsWith('data/providers/cafef/')) throw Error('INVALID_RAW_PATH');
      const body = readFileSync(path, 'utf8');
      if (payloadHash(body) !== request.payloadHash) throw Error('RAW_HASH_MISMATCH');
      const mapped = mapCafeFDisplay(body, request.endpoint, ticker, request.TypeTime);
      if (mapped.rejectedRecordCount) manifest.failures.push({ticker, endpoint:request.endpoint,
        payloadHash:request.payloadHash, error:'REJECTED_PERIOD_RECORDS', count:mapped.rejectedRecordCount});
      const report = result.reports[mapped.report.key];
      for (const column of mapped.columns) {
        const period = report.periods[column.periodKey] ??= {
          year:column.year, quarter:column.quarter, periodType:column.periodType, variants:[],
        };
        period.variants.push({...column, source:{endpoint:request.endpoint, payloadHash:mapped.sourceHash,
          rawPayloadLocation:relative(root, path), retrievedAt:request.retrievedAt,
          pageIndex:request.pageIndex, providerUnit:mapped.providerUnit, unitStatus:mapped.unitStatus}});
      }
    } catch (error) {
      manifest.failures.push({ticker, endpoint:request.endpoint, payloadHash:request.payloadHash, error:error.message});
    }
  }
  const file = `${ticker}.json`;
  writeFileSync(join(output, file), JSON.stringify(result, null, 2)+'\n');
  manifest.files.push({ticker, file, reports:Object.values(result.reports).map(r => ({key:r.key, periods:Object.keys(r.periods).length}))});
}
writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2)+'\n');
console.log(JSON.stringify({symbols:symbols.length, failures:manifest.failures.length, output:relative(root, output)}));
if (manifest.failures.some(f => f.error !== 'REJECTED_PERIOD_RECORDS')) process.exitCode = 1;
