/** Shared strict typecheck. Config remains at its original path; outputs are explicit. */
import {createRequire} from 'node:module';
import {resolve, join} from 'node:path';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('node tools/maintenance/typecheck.mjs --config <tsconfig.json> --out <report.json> [--dependencies <directory>]');
  process.exit(0);
}
const options = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i];
  if (!['--config', '--out', '--dependencies'].includes(key) || !args[i + 1] || options[key]) throw Error('INVALID_OR_DUPLICATE_OPTION');
  options[key] = args[i + 1];
}
if (!options['--config'] || !options['--out']) throw Error('EXPLICIT_CONFIG_AND_OUTPUT_REQUIRED');
const root = process.cwd(), dependencies = resolve(options['--dependencies'] ?? root);
const require = createRequire(join(dependencies, 'package.json')), ts = require('typescript');
if (ts.version !== '6.0.3') throw Error('EXACT_LOCKED_TYPESCRIPT_VERSION_REQUIRED');
const modules = join(dependencies, 'node_modules'), prefix = join(root, 'node_modules');
const reroute = p => p === prefix || p.startsWith(prefix + '/') ? modules + p.slice(prefix.length) : p;
for (const name of ['readFile', 'fileExists', 'directoryExists', 'getDirectories', 'readDirectory', 'realpath']) {
  const fn = ts.sys[name];
  if (fn) ts.sys[name] = (p, ...rest) => fn(reroute(p), ...rest);
}
const config = ts.getParsedCommandLineOfConfigFile(resolve(options['--config']), {
  typeRoots: [join(modules, '@types')], types: ['node', 'react', 'react-dom'], noEmit: true,
}, {...ts.sys, onUnRecoverableConfigFileDiagnostic: d => {throw Error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));}});
const program = ts.createProgram(config.fileNames, config.options);
const diagnostics = [...config.errors, ...ts.getPreEmitDiagnostics(program)];
const sourceFiles = program.getSourceFiles().filter(f => f.fileName.startsWith(root) && !f.fileName.includes('/node_modules/'))
  .map(f => ({path: f.fileName.slice(root.length + 1), sha256: createHash('sha256').update(f.text).digest('hex')}))
  .sort((a, b) => a.path.localeCompare(b.path));
const report = {status: diagnostics.length ? 'FAIL' : 'PASS', compilerVersion: ts.version,
  config: resolve(options['--config']), projectSourceSubstitution: false, strict: config.options.strict,
  noEmit: true, sourceFilesChecked: sourceFiles.length,
  sourceSetHash: createHash('sha256').update(JSON.stringify(sourceFiles)).digest('hex'),
  diagnostics: diagnostics.map(d => ({code: d.code, file: d.file?.fileName ?? null,
    message: ts.flattenDiagnosticMessageText(d.messageText, '\n')}))};
writeFileSync(resolve(options['--out']), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({status: report.status, sourceFilesChecked: sourceFiles.length, diagnostics: diagnostics.length}));
process.exitCode = diagnostics.length ? 1 : 0;
