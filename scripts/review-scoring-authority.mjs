import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

const root = process.cwd();
const output = 'docs/fundamental-data-engine/evidence/2026-10-29-current-authority-review';
const baseline = 'docs/fundamental-data-engine/evidence/2026-10-20-production-authority-final-activation';
const manifestPath = `${output}/SCORING_EXECUTABLE_REVIEW_MANIFEST.json`;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => value === null || typeof value !== 'object' ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
const pin = path => { const bytes = readFileSync(path); return { path, sha256: sha(bytes), size: bytes.length }; };
const old = JSON.parse(readFileSync(`${baseline}/SCORING_EXECUTABLE_MANIFEST.json`, 'utf8'));
const roots = ['src/application/scoring/engine.ts', 'src/application/scoring/execution-context.ts', 'src/application/scoring/portfolio-context.ts', 'src/domain/ranking/rank.ts'];
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
if (config.error) throw Error('TSCONFIG_READ_FAILED');
const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
const visited = new Set(), edges = [], external = new Set();
function visit(path) {
  if (visited.has(path)) return;
  visited.add(path);
  if (path.endsWith('.json')) return;
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  function dependency(specifier) {
    if (!specifier.startsWith('.') && !specifier.startsWith('@/')) { external.add(specifier); return; }
    const result = ts.resolveModuleName(specifier, resolve(path), options, ts.sys).resolvedModule;
    if (!result) throw Error(`UNRESOLVED_LOCAL_IMPORT:${path}:${specifier}`);
    const target = relative(root, result.resolvedFileName);
    if (target.startsWith('..') || target.includes('node_modules/')) throw Error(`IMPORT_ESCAPES_SOURCE:${target}`);
    edges.push({ from: path, specifier, to: target }); visit(target);
  }
  function walk(node) {
    if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly && !(node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings) && !node.importClause.name && node.importClause.namedBindings.elements.length > 0 && node.importClause.namedBindings.elements.every(x => x.isTypeOnly))) dependency(node.moduleSpecifier.text);
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && !node.isTypeOnly && !(node.exportClause && ts.isNamedExports(node.exportClause) && node.exportClause.elements.length > 0 && node.exportClause.elements.every(x => x.isTypeOnly))) dependency(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      if (node.arguments.length !== 1 || !ts.isStringLiteral(node.arguments[0])) throw Error(`NONLITERAL_IMPORT_REQUIRES_REVIEW:${path}`);
      dependency(node.arguments[0].text);
    }
    ts.forEachChild(node, walk);
  }
  walk(source);
}
roots.forEach(visit);
// Preserve every baseline artifact even if it is not reachable under current imports.
const reachable = new Set(visited);
old.artifacts.forEach(a => visit(a.path));
const artifacts = [...visited].sort().map(path => {
  const current = pin(path), previous = old.artifacts.find(a => a.path === path);
  return { ...current, baselineSha256: previous?.sha256 ?? null, change: !previous ? 'ADDED_DEPENDENCY' : previous.sha256 === current.sha256 ? 'UNCHANGED' : 'CHANGED', reachableFromRoots: reachable.has(path) };
});
function inventory(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? inventory(`${dir}/${e.name}`) : [pin(`${dir}/${e.name}`)]); }
const historicalPins = [...inventory(baseline), ...inventory('docs/fundamental-data-engine/evidence/2026-10-20-production-authority-binding-activation'), pin('src/infrastructure/dependencies/active-authorities.json')].sort((a,b) => a.path.localeCompare(b.path));
const gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const existing = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
const body = {
  contract: 'scoring-executable-review-manifest-v1', id: 'scoring-executable-current-review-20261029-r1',
  status: 'TECHNICALLY_REVIEWED_NOT_PRODUCTION_APPROVED', implementationId: old.implementationId, methodologyVersion: old.version,
  buildRevision: '20261029-r1', recordedAt: existing?.recordedAt ?? new Date().toISOString(),
  reviewedTree: { gitHead, mode: 'EXACT_FILE_BYTES_IN_WORKTREE', cleanCommitClaimed: false },
  scope: 'SCORING_RUNTIME_CLOSURE_ONLY', roots,
  artifactResolution: 'TypeScript module resolution; runtime imports/re-exports/literal dynamic imports; excludes explicit type-only imports; retains all baseline artifacts; rejects unresolved local/nonliteral imports.',
  artifacts, importEdges: edges.sort((a,b) => canonical(a).localeCompare(canonical(b))), externalRuntimeImports: [...external].sort(),
  runtimeDependencyPins: ['package.json', 'pnpm-lock.yaml'].map(pin), categoryMaxima: old.categoryMaxima,
  baselineManifest: pin(`${baseline}/SCORING_EXECUTABLE_MANIFEST.json`), historicalPins,
  productionAuthorization: { inherited: false, activated: false, activeConfigurationChanged: false, reason: 'Historical owner approval explicitly excludes changed bytes and future versions. This manifest records technical review only.', requiredBeforeActivation: ['Owner approval binding this exact manifest contentHash', 'New versioned executable authority, compatibility proofs and bundle', 'Verifier and activation tests for the newly approved binding'] },
  builder: pin('scripts/review-scoring-authority.mjs'),
};
const manifest = { ...body, contentHash: sha(canonical(body)) };
if (process.argv.includes('--verify')) {
  if (!existing || canonical(existing) !== canonical(manifest)) throw Error('REVIEW_MANIFEST_DRIFT');
  console.log(JSON.stringify({ status: 'PASS', contentHash: manifest.contentHash, artifacts: artifacts.length, historicalFilesUnchanged: historicalPins.length }));
} else {
  if (existing) throw Error('REVIEW_ALREADY_EXISTS_USE_VERIFY_OR_NEW_VERSION');
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ path: manifestPath, contentHash: manifest.contentHash, changes: artifacts.filter(a => a.change !== 'UNCHANGED') }));
}
