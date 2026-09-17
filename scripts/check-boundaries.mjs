import ts from 'typescript';
import { readdirSync, readFileSync, existsSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const allowed = {
  shared: ['shared'], domain: ['domain', 'shared'], ports: ['ports', 'domain', 'shared'],
  application: ['application', 'ports', 'domain', 'shared'],
  infrastructure: ['infrastructure', 'ports', 'domain', 'shared'],
  ui: ['ui', 'application', 'domain', 'shared'],
  app: ['app', 'server', 'ui', 'application', 'domain', 'shared'],
  server: ['server', 'application', 'infrastructure', 'ports', 'domain', 'shared'],
};
function layer(name) {
  if (name === 'instrumentation.ts') return 'server';
  if (name.startsWith('app/server/')) return 'server';
  if (name.startsWith('app/')) return 'app';
  return name.startsWith('src/') ? name.split('/')[1] : undefined;
}
function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(dir, entry.name);
    // Generated Prisma output is vendor code. Imports INTO it still obey infrastructure boundaries.
    if (name.split(path.sep).join('/').endsWith('/src/infrastructure/db/generated')) return [];
    if (entry.isSymbolicLink()) throw new Error(`Source symlinks are not supported: ${name}`);
    return entry.isDirectory() ? walk(name) : /\.[cm]?[jt]sx?$/.test(name) ? [name] : [];
  });
}
/** Uses TS module resolution, not regex matching import text; exports and type edges count. */
export function checkBoundaries(root) {
  root = realpathSync(root);
  const configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json');
  if (!configPath) throw new Error('tsconfig.json is required');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const files = [...walk(path.join(root, 'src')), ...walk(path.join(root, 'app')), ...(existsSync(path.join(root, 'instrumentation.ts')) ? [path.join(root, 'instrumentation.ts')] : [])];
  const graph = new Map(); const clients = []; const serverModules = new Set(); const errors = [];
  const relative = file => path.relative(root, file).split(path.sep).join('/');
  for (const file of files) {
    const name = relative(file), from = layer(name);
    graph.set(name, []);
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const report = (node, message) => errors.push(`${name}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: ${message}`);
    if (!allowed[from]) { report(source, 'Unclassified source layer'); continue; }
    const directives = source.statements.filter(ts.isExpressionStatement).filter(s => ts.isStringLiteral(s.expression)).map(s => s.expression.text);
    if (directives.includes('use client')) clients.push(name);
    if (from === 'server' && !source.statements.some(s => ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier) && s.moduleSpecifier.text === 'server-only')) report(source, 'Composition root requires server-only marker');
    const edge = (node, specifier) => {
      if (!specifier || !ts.isStringLiteralLike(specifier)) { report(node, 'Computed module specifiers are forbidden'); return; }
      const spec = specifier.text;
      if (["server-only", "next/headers", "next/server", "next/cache"].includes(spec) || spec.startsWith("node:")) serverModules.add(name);
      const resolved = ts.resolveModuleName(spec, file, parsed.options, ts.sys).resolvedModule;
      if (resolved && !resolved.isExternalLibraryImport) {
        const target = relative(realpathSync(resolved.resolvedFileName));
        const to = layer(target);
        if (!allowed[from].includes(to)) report(node, `Forbidden dependency ${from} -> ${to ?? 'outside source'} (${spec})`);
        graph.get(name).push(target);
        return;
      }
      if (spec.startsWith('.') && spec.endsWith('.css') && ['app', 'ui'].includes(from) && existsSync(path.resolve(path.dirname(file), spec))) return;
      const react = /^(react|react-dom)(\/|$)/.test(spec);
      const next = /^next(\/|$)/.test(spec);
      const safe = (['app', 'ui'].includes(from) && (react || next)) ||
        (from === 'server' && (spec === 'server-only' || next)) ||
        (from === 'infrastructure' && (spec.startsWith('node:') || spec === 'server-only')) ||
        (spec === 'zod' && (name.startsWith('src/shared/validation/') || name.startsWith('src/infrastructure/config/') || ['src/infrastructure/repositories/methodology-schema.ts', 'src/infrastructure/repositories/portfolio-command-schema.ts'].includes(name))) ||
        (name === 'src/infrastructure/db/client.ts' && spec === '@prisma/adapter-better-sqlite3');
      if (!safe) report(node, `Forbidden or unresolved external dependency: ${spec}`);
    };
    const visit = node => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier) edge(node, node.moduleSpecifier);
      } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) edge(node, node.moduleReference.expression);
      else if (ts.isImportTypeNode(node)) edge(node, ts.isLiteralTypeNode(node.argument) ? node.argument.literal : undefined);
      else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) edge(node, node.arguments[0]);
      if (ts.isIdentifier(node) && node.text === 'require' && !(ts.isCallExpression(node.parent) && node.parent.expression === node)) report(node, 'Aliased module loaders are forbidden');
      if (['shared', 'domain', 'ports', 'application'].includes(from)) {
        if (ts.isIdentifier(node) && ['process', 'fetch', 'window', 'document', 'XMLHttpRequest', 'WebSocket', 'globalThis', 'eval'].includes(node.text)) report(node, `Ambient IO/global escape forbidden: ${node.text}`);
        if (ts.isPropertyAccessExpression(node) && ['Date.now', 'Math.random'].includes(node.getText(source))) report(node, 'Use controlled clock/ID ports');
        if (ts.isNewExpression(node) && node.expression.getText(source) === 'Date' && !node.arguments?.length) report(node, 'Uncontrolled current time');
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  for (const start of graph.keys()) {
    if (!['domain', 'ports', 'application', 'shared'].includes(layer(start)) || start.startsWith('src/shared/validation/')) continue;
    const seen = new Set();
    const visit = name => {
      if (seen.has(name)) return; seen.add(name);
      if (name.startsWith('src/shared/validation/')) errors.push(`${start}: Pure core cannot reach trust-boundary validation through ${name}`);
      for (const target of graph.get(name) ?? []) visit(target);
    };
    visit(start);
  }
  for (const client of clients) {
    const seen = new Set();
    const visit = name => {
      if (seen.has(name)) return; seen.add(name);
      if (['server', 'infrastructure'].includes(layer(name)) || serverModules.has(name)) errors.push(`${client}: Client graph reaches server-only layer through ${name}`);
      for (const target of graph.get(name) ?? []) visit(target);
    };
    visit(client);
  }
  return { files: files.length, errors };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = checkBoundaries(process.cwd());
  if (!result.files) throw new Error('No source files checked');
  if (result.errors.length) { console.error(result.errors.join('\n')); process.exitCode = 1; }
  else console.log(`PASS boundaries: ${result.files} source modules`);
}
