import './lib/ts-runtime.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const { snapshotHash } = await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const { buildWp1CommandPackage, verifyWp1CommandPackage } = await import('../src/domain/portfolio/accounting-command-package.ts');
const path = 'docs/fundamental-data-engine/evidence/2026-11-01-m8-wp1/final-remediation/actual-case-preview.json';
const bytes = readFileSync(path), retained = JSON.parse(bytes);
const package_ = buildWp1CommandPackage(retained.plan, new Date().toISOString(), snapshotHash);
const verification = verifyWp1CommandPackage(package_, retained.plan, snapshotHash);
writeFileSync('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/acceptance-remediation-v1/wp1-command-package.json',JSON.stringify({
  sourcePath:path,sourceSha256:createHash('sha256').update(bytes).digest('hex'),
  ledgerFreshness:'HISTORICAL_RETAINED_PREVIEW_ONLY_FRESH_RUNTIME_RECHECK_REQUIRED',
  commandPackage:package_,verification
},null,2)+'\n');
console.log(JSON.stringify({commands:package_.commands.length,packageHash:package_.packageHash,...verification},null,2));
