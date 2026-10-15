import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync, linkSync, unlinkSync, rmSync, openSync, fsyncSync, closeSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDatabaseConfig } from '../src/infrastructure/config/database.ts';
import { prepareDatabaseFile } from '../src/infrastructure/db/files.ts';
import { toPublicError, DataIntegrityError } from '../src/shared/errors/index.ts';
const hash = value => createHash('sha256').update(value).digest('hex');
const applicationVersion = JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
const canonical = value => JSON.stringify(value, (_key, v) => typeof v === 'bigint' ? { sqliteInteger: v.toString() } : v);
const fail = () => { throw new DataIntegrityError(); };
function syncFile(file) { const fd = openSync(file, 'r'); try { fsyncSync(fd); } finally { closeSync(fd); } }
function readRows(db, sql) { const statement = db.prepare(sql); statement.setReadBigInts(true); return statement.all(); }
/** Exact logical rows, schema and artifact checksums; no accounting calculation is introduced here. */
export function inspectBackup(file) {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    db.exec('PRAGMA trusted_schema = OFF');
    const integrity = db.prepare('PRAGMA integrity_check').all();
    if (integrity.length !== 1 || Object.values(integrity[0])[0] !== 'ok' || db.prepare('PRAGMA foreign_key_check').all().length) fail();
    const schema = readRows(db, "SELECT type, name, tbl_name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type, name");
    const names = schema.filter(row => row.type === 'table').map(row => row.name);
    for (const required of ['portfolio', 'ledger_transaction', 'ledger_leg', 'analytical_artifact', 'decision_artifact', 'workflow_review', 'marginal_allocation', '_prisma_migrations']) if (!names.includes(required)) fail();
    const migrationRoot = new URL('../prisma/migrations/',import.meta.url);
    const approvedMigrations = readdirSync(migrationRoot,{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>({name:entry.name,sha256:hash(readFileSync(new URL(`${entry.name}/migration.sql`,migrationRoot)))})).sort((a,b)=>a.name.localeCompare(b.name));
    const recordedMigrations = readRows(db,'SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations');
    if (recordedMigrations.some(row=>row.finished_at===null||row.rolled_back_at!==null)) fail();
    const appliedMigrations = recordedMigrations.map(row=>({name:row.migration_name,sha256:row.checksum})).sort((a,b)=>a.name.localeCompare(b.name));
    if (canonical(approvedMigrations)!==canonical(appliedMigrations)) fail();
    const ledgerWatermarks = readRows(db,'SELECT id, revision FROM portfolio ORDER BY id').map(row=>({portfolioId:row.id,watermark:row.revision}));
    const tables = names.map(name => {
      // Schema names are quoted as identifiers, never concatenated as SQL expressions.
      const rows = readRows(db, `SELECT * FROM "${name.replaceAll('"', '""')}"`);
      for (const row of rows) if (typeof row.body === 'string' && typeof row.body_hash === 'string') {
        if (hash(row.body) !== row.body_hash) fail();
        const artifact = JSON.parse(row.body);
        if ((artifact.id ?? artifact.command?.id) !== row.id) fail();
        if (row.review_id && (artifact.reviewId ?? artifact.command?.reviewId) !== row.review_id) fail();
      }
      if (name === 'ledger_transaction' && rows.some(row => row.status !== 'POSTED')) fail();
      const serialized = rows.map(row => canonical(Object.fromEntries(Object.entries(row).sort(([a],[b]) => a.localeCompare(b))))).sort();
      return { name, count: rows.length, sha256: hash(serialized.join('\n')) };
    }).sort((a,b) => a.name.localeCompare(b.name));
    return { format: 'vn30-sqlite-snapshot-v1', applicationVersion, migrations: appliedMigrations, ledgerWatermarks, schemaSha256: hash(canonical(schema)), tables, totalRows: tables.reduce((n,t) => n+t.count,0) };
  } finally { db.close(); }
}
/** SQLite's supported consistent snapshot mechanism; source is opened read-only. No raw live-file copy. */
export function snapshotDatabase(sourceFile, targetFile, { restore = false, projectDirectory = process.cwd() } = {}) {
  const source = loadDatabaseConfig({ DATABASE_URL: `file:${sourceFile}` }, projectDirectory);
  const target = loadDatabaseConfig({ DATABASE_URL: `file:${targetFile}` }, projectDirectory);
  if (!existsSync(source.filePath) || source.filePath === target.filePath) fail();
  prepareDatabaseFile(source); // Checks private location, owner-only mode, symlinks and hardlinks.
  const sidecar = `${target.filePath}.manifest.json`;
  if (existsSync(target.filePath) || existsSync(sidecar)) fail();
  let expected;
  if (restore) {
    const sourceManifest = `${source.filePath}.manifest.json`;
    const stat = lstatSync(sourceManifest);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || (stat.mode & 0o077)) fail();
    expected = JSON.parse(readFileSync(sourceManifest,'utf8'));
    if (expected.format !== 'vn30-sqlite-snapshot-v1' || hash(readFileSync(source.filePath)) !== expected.databaseSha256) fail();
    const actual = inspectBackup(source.filePath);
    const { databaseSha256: _hash, ...logical } = expected; void _hash;
    if (canonical(actual) !== canonical(logical)) fail();
  }
  const parent = path.dirname(target.filePath); mkdirSync(parent, { recursive: true, mode: 0o700 });
  if (lstatSync(parent).mode & 0o077) fail();
  const staging = mkdtempSync(path.join(parent, '.vn30-snapshot-'));
  let publishedDatabase = false, publishedManifest = false;
  try {
    const stageFile = path.join(staging, 'snapshot.sqlite'), stageManifest = path.join(staging, 'manifest.json');
    prepareDatabaseFile(loadDatabaseConfig({DATABASE_URL:`file:${stageFile}`}, projectDirectory));
    // Validate the physical destination against public/build symlink aliases before publication.
    const sourceDb = new DatabaseSync(source.filePath, { readOnly: true });
    try { sourceDb.exec('PRAGMA trusted_schema = OFF'); sourceDb.prepare('VACUUM INTO ?').run(stageFile); } finally { sourceDb.close(); }
    const logical = inspectBackup(stageFile);
    if (expected) { const {databaseSha256:_hash,...prior}=expected;void _hash;if(canonical(logical)!==canonical(prior))fail(); }
    const manifest = {...logical,databaseSha256:hash(readFileSync(stageFile))};
    writeFileSync(stageManifest, JSON.stringify(manifest,null,2)+'\n', { flag:'wx',mode:0o600 });
    syncFile(stageFile);syncFile(stageManifest);
    // Hard-link publication is atomic and refuses overwrite, including a concurrent target creation.
    linkSync(stageFile,target.filePath);publishedDatabase=true;
    linkSync(stageManifest,sidecar);publishedManifest=true;
    unlinkSync(stageFile);unlinkSync(stageManifest);syncFile(parent);
    return manifest;
  } catch (error) {
    if (publishedManifest) unlinkSync(sidecar);
    if (publishedDatabase) unlinkSync(target.filePath);
    throw error;
  } finally { rmSync(staging,{recursive:true,force:true}); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [mode, ...args] = process.argv.slice(2);
    if (mode !== 'backup' && mode !== 'restore') fail();
    if (mode === 'backup' && args.length === 1) {
      if (existsSync('.env.local')) process.loadEnvFile('.env.local');
      const source = loadDatabaseConfig(process.env,process.cwd());
      const manifest = snapshotDatabase(source.filePath,args[0]);
      console.log(JSON.stringify({status:'BACKUP_VALIDATED',rows:manifest.totalRows,schemaSha256:manifest.schemaSha256}));
    } else if (mode === 'restore' && args.length === 2) {
      const manifest = snapshotDatabase(args[0],args[1],{restore:true});
      console.log(JSON.stringify({status:'RESTORE_CANDIDATE_VALIDATED',rows:manifest.totalRows,activation:'Explicit DATABASE_URL configuration and current-source/reconciliation verification required'}));
    } else fail();
  } catch (error) { console.error(JSON.stringify(toPublicError(error)));process.exitCode=1; }
}
