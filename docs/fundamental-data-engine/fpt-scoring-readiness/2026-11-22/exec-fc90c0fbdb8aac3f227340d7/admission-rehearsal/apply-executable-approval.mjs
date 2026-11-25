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
const { default: assert } = await import('node:assert/strict');
const { writeFileSync, existsSync } = await import('node:fs');
const { sha } = await load('src/infrastructure/source-admission/registry.ts');
const { snapshotHash } = await load('src/infrastructure/fundamentals/snapshot-hash.ts');
const { applyCurrentAuthorityProposal, PinnedCurrentExecutableAuthority } =
  await load('src/infrastructure/source-admission/current-scoring-authority.ts');
const local = name => relative(root, resolve(import.meta.dirname, name));
const read = path => JSON.parse(readFileSync(path));
const pin = path => ({ path, sha256: sha(readFileSync(path)) });
const write = (path, body) => writeFileSync(path, JSON.stringify(body, null, 2) + '\n');
const proposalPath = local('FPT_EXECUTABLE_APPROVAL_PROPOSAL.json');
const { proposal, method: draft, requestedOwnerStatement: statement } = read(proposalPath);
const source = pin(local('FPT_EXECUTABLE_OWNER_SOURCE.txt'));
assert.equal(readFileSync(source.path, 'utf8').trim(), statement);
const receiptPath = local('FPT_EXECUTABLE_OWNER_APPROVAL.json');
const now = new Date().toISOString();
const expected = { contract: 'current-scoring-owner-approval-v1', ownerAuthority: 'PROJECT_OWNER',
  statement, scope: 'CURRENT_SCORING_EXECUTABLE_VERSION', source, reviewProposal: pin(proposalPath),
  ownerMessageTimestamp: null, productionActivated: false };
if (!existsSync(receiptPath)) write(receiptPath, { ...expected, recordedAt: now });
const { recordedAt, ...receipt } = read(receiptPath);
assert.deepEqual(receipt, expected);
const { method, authority } = applyCurrentAuthorityProposal(proposal, draft, pin(receiptPath), recordedAt);
const authorityPath = local('FPT_EXECUTABLE_APPROVED.json');
write(authorityPath, authority);
await new PinnedCurrentExecutableAuthority(root, pin(authorityPath), { now: () => now }).verify(method);
write(local('FPT_METHODOLOGY_APPROVED.json'), method);
const { PrismaClient } = await load('src/infrastructure/db/generated/client');
const { PrismaMethodologyRegistry } = await load('src/infrastructure/repositories/methodology-registry.ts');
const require = createRequire(resolve(root, 'package.json'));
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: realpathSync('data/vn30.sqlite'), fileMustExist: true }) });
try {
  const registry = new PrismaMethodologyRegistry(db);
  const existing = await registry.findById(method.methodologyId);
  if (!existing) await registry.append(method);
  assert.equal(snapshotHash(await registry.findById(method.methodologyId)), authority.methodologyHash);
  console.log(JSON.stringify({ status: 'APPROVED_AND_REGISTERED', executable: pin(authorityPath),
    methodologyId: method.methodologyId, methodologyHash: authority.methodologyHash, duplicate: !!existing,
    scoringAuthorized: false }, null, 2));
} finally {
  await db.$disconnect();
}
