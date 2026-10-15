import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
// Never inherit a portfolio DB or current-source path, even from .env.local.
const directory = mkdtempSync(path.join(tmpdir(), 'vn30-m68-validation-'));
const evidence = path.resolve('docs/06_DASHBOARD/6.8 Integration & Validation/validation-evidence');
mkdirSync(evidence, { recursive: true });
const env = { ...process.env, DATABASE_URL: `file:${path.join(directory, 'test.sqlite')}`, VN30_CURRENT_SOURCE_FILE: path.join(directory, 'source.json'), VN30_VALIDATION_VISUAL_DIRECTORY: path.resolve('docs/06_DASHBOARD/6.8 Integration & Validation/visual-evidence'), LOG_LEVEL: 'info', NEXT_TELEMETRY_DISABLED: '1', NO_COLOR: '1' };
const results = [];
function run(command, args, name) {
  console.log(`Running ${name}`);
  const start = Date.now();
  const result = spawnSync(command, args, { env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const output = (result.stdout ?? '') + (result.stderr ?? '') + (result.error ? `\n${result.error.code}\n` : '');
  writeFileSync(path.join(evidence, `${String(results.length).padStart(2, '0')}-${name.replaceAll(/[^a-zA-Z0-9-]/g, '-')}.log`), output.replaceAll(/[ \t]+$/gm, '').trimEnd() + '\n');
  const clean = output.replaceAll(/\u001b\[[0-9;]*m/g, '');
  const vitest = [...clean.matchAll(/Tests\s+(\d+) passed/g)].at(-1);
  const browser = [...clean.matchAll(/(\d+) passed \(/g)].at(-1);
  const row = { command: name, exitCode: result.status ?? 1, status: result.status === 0 ? 'PASS' : 'FAIL', testCount: vitest ? Number(vitest[1]) : browser ? Number(browser[1]) : null, durationMilliseconds: Date.now() - start };
  results.push(row); writeFileSync(path.join(evidence, 'results.json'), JSON.stringify({ node: process.version, isolatedDatabase: true, baseline: 'f609a94d610705f3897e86b914fa4de5055833ce', results }, null, 2) + '\n');
  console.log(JSON.stringify(row));
  return row.exitCode;
}
try {
  if (run(process.execPath, ['scripts/database.mjs', 'migrate', '--no-env-file'], 'fresh-db-migrate') !== 0) process.exitCode = 1;
  else {
    for (const args of [['lint'], ['typecheck'], ['test'], ['test:portfolio'], ['test:integration'], ['prisma', 'validate'], ['prisma', 'migrate', 'status'], ['build'], ['test:e2e'], ['test:decision'], ['test:workflow'], ['test:dca'], ['test:ui'], ['test:current']]) run('pnpm', args, `pnpm ${args.join(' ')}`);
    run('git', ['diff', '--check'], 'git diff --check');
    run('pnpm', ['test:m68'], 'pnpm test:m68');
    run('pnpm', ['test:m68'], 'pnpm test:m68 repeat');
    run(process.execPath, ['scripts/database.mjs', 'status', '--no-env-file'], 'fresh-db-status-repeat');
    if (results.some(r => r.exitCode !== 0)) process.exitCode = 1;
  }
} finally { rmSync(directory, { recursive: true, force: true }); }
