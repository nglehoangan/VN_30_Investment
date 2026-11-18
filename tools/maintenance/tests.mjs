/** Shared frozen-dependency test runner; preserves the selected config's test rules. */
import {createRequire} from 'node:module';
import {readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';

const args = process.argv.slice(2), options = {}, filters = [];
if (args.includes('--help')) {
  console.log('node tools/maintenance/tests.mjs --config <config.mjs> --dependencies <frozen-root> --out-dir <new-report-directory> [--diagnostic-timeout-ms <milliseconds>] [-- <test files>]');
  process.exit(0);
}
for (let i = 0; i < args.length; i += 2) {
  if (args[i] === '--') {filters.push(...args.slice(i + 1)); break;}
  if (!['--config', '--dependencies', '--out-dir', '--diagnostic-timeout-ms'].includes(args[i]) || !args[i + 1] || options[args[i]]) throw Error('INVALID_OR_DUPLICATE_OPTION');
  options[args[i]] = args[i + 1];
}
for (const key of ['--config', '--dependencies', '--out-dir']) if (!options[key]) throw Error('EXPLICIT_CONFIG_DEPENDENCIES_OUTPUT_REQUIRED');
const diagnosticTimeout = options['--diagnostic-timeout-ms'] ? Number(options['--diagnostic-timeout-ms']) : null;
if (diagnosticTimeout !== null && (!Number.isSafeInteger(diagnosticTimeout) || diagnosticTimeout <= 0 || diagnosticTimeout > 600000)) throw Error('INVALID_DIAGNOSTIC_TIMEOUT');
const root = process.cwd(), out = resolve(options['--out-dir']), dep = resolve(options['--dependencies']);
const configPath = resolve(options['--config']), original = readFileSync(configPath, 'utf8');
const marker = "import {defineConfig} from 'vitest/config';";
if (!original.includes(marker) || !original.includes('export default defineConfig(')) throw Error('UNSUPPORTED_CONFIG_SHAPE');
const require = createRequire(join(dep, 'package.json'));
const aliases = Object.fromEntries(['@prisma/adapter-better-sqlite3', '@prisma/client/runtime/client', 'zod', 'react/jsx-dev-runtime', 'react/jsx-runtime', 'react', 'react-dom/server', 'next/link'].map(name => [name, require.resolve(name)]));
let config = original.replace(marker, '').replace('export default defineConfig(', 'export default (')
  .replaceAll('import.meta.url', JSON.stringify(pathToFileURL(configPath).href));
if (!config.includes('alias:{')) throw Error('EXPLICIT_ALIAS_BLOCK_REQUIRED');
config = config.replace('alias:{', 'alias:{' + Object.entries(aliases).map(([k, v]) => JSON.stringify(k) + ':' + JSON.stringify(v)).join(',') + ',');
// A fresh directory prevents accidental overwrites of historical validation receipts.
mkdirSync(out, {recursive: false});
const temp = mkdtempSync(join(tmpdir(), 'vn30-validation-'));
try {
  writeFileSync(join(temp, 'config.mjs'), config);
  writeFileSync(join(out, 'DEPENDENCY_BINDING.json'), JSON.stringify({
    config: configPath, configSha256: createHash('sha256').update(original).digest('hex'),
    dependencyAliases: aliases, explicitCliFilters: filters,
    testConfigUnchanged: true, sourceAssertionsAndIntegrityControlsUnchanged: true,
    diagnosticOnly: diagnosticTimeout !== null, diagnosticTimeoutMs: diagnosticTimeout, projectSourceSubstitution: false,
  }, null, 2) + '\n');
  const child = spawn(process.execPath, [join(dep, 'node_modules/vitest/vitest.mjs'), 'run', ...filters,
    ...(diagnosticTimeout === null ? [] : ['--testTimeout=' + diagnosticTimeout]),
    '--config', join(temp, 'config.mjs'), '--reporter=json', '--outputFile=' + join(out, 'TEST_RESULTS.json')],
  {cwd: root, env: {...process.env, VN30_TEST_MIGRATIONS_DIR: undefined}, stdio: 'inherit'});
  const code = await new Promise((res, rej) => {child.on('error', rej); child.on('exit', res);});
  process.exitCode = code ?? 1;
} finally {
  rmSync(temp, {recursive: true, force: true});
}
