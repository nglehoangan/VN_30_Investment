import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const vitest = createRequire(realpathSync('node_modules/vitest/package.json'));
const vite = createRequire(vitest.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(vite.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const { sha } = await load('src/infrastructure/source-admission/registry.ts');
const { snapshotHash: hash } = await load('src/infrastructure/fundamentals/snapshot-hash.ts');
const { FPT_OFFICIAL_LIMITED_RUNTIME, currentAuthorityApprovalPayload } =
  await load('src/infrastructure/source-admission/current-scoring-authority.ts');
const { verifyProductionAuthorityBundle } = await load('src/infrastructure/dependencies/production-authority.ts');
const pin = path => ({ path, sha256: sha(readFileSync(path)) });
const baseAuthority = pin('docs/fundamental-data-engine/vnm-step3-authority-closure/2026-11-17/PRODUCTION_AUTHORITY_BUNDLE.json');
const base = verifyProductionAuthorityBundle(root, baseAuthority);
const baselineManifestHash = base.manifest.contentHash;
const code = FPT_OFFICIAL_LIMITED_RUNTIME.map(pin);
const codeHash = hash(code);
const method = {
  methodologyId: 'current-scoring-fpt-official-limited-v1', family: 'SCORING', semanticVersion: '1.0.0',
  intendedUse: 'PRODUCTION', governanceStatus: 'PROPOSED', approvalReference: '',
  implementationIdentity: 'm64-clarification-1-ai-origin-v1',
  configurationReference: 'current-scoring-executable-code-sha256:' + codeHash,
  governingDocumentReference: relative(root, resolve(import.meta.dirname, 'FPT_LIMITED_EXACT_SCOPE.md')),
  effectiveDate: new Date().toISOString().slice(0, 10), recordedAt: new Date().toISOString(),
};
const approvalPayloadHash = hash(currentAuthorityApprovalPayload(method, codeHash, baselineManifestHash));
const body = { contract: 'current-scoring-executable-authority-v2', status: 'PROPOSED',
  purpose: 'CURRENT_FORMAL_VALUATION', runtimeProfile: 'FPT_OFFICIAL_LIMITED_V1',
  baseAuthority, baselineManifestHash, code, codeHash, approvalPayloadHash };
console.log(JSON.stringify({ method, proposal: { ...body, contentHash: hash(body) },
  requestedOwnerStatement: 'Approve exact current-purpose scoring authority ' + approvalPayloadHash + ' for CURRENT_FORMAL_VALUATION' }, null, 2));
