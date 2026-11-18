"""Read-only production preflight. Schema probes run solely in memory."""
import hashlib
import json
import re
import sqlite3
import subprocess
from pathlib import Path

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[3]
BASE = ROOT / 'docs/fundamental-data-engine/vnm-publication-blocker-closure/2026-11-18'
EXPECTED_HEAD = '6e4bb7bb81e323feaa805699cbc5e009c95921bc'
EXPECTED_DB = '47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65'
MISSING = 'prisma/migrations/202611120001_market_ingest/migration.sql'

def digest(b):
    return hashlib.sha256(b).hexdigest()

def hashed(v):
    return digest(json.dumps(v, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode())

def write(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

manifest = json.loads((BASE / 'GOVERNED_DEPLOYMENT_REVIEW_MANIFEST.json').read_text())
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
checks = []
def check(name, actual, expected):
    checks.append({'check': name, 'actual': actual, 'expected': expected, 'pass': actual == expected})

# HEAD records the original preflight. Subsequent evidence commits are not authority updates.
check('implementationBaseline', head, EXPECTED_HEAD)
check('manifestContentHash', hashed({k:v for k,v in manifest.items() if k != 'contentHash'}), '3ced03910ea4c38cd7fbc72aaff36c2e1a0710de72ab8c2160e5e687cd29e3e5')
check('requestHash', hashed(manifest['request']), '0f3bfd8b815646829676b7ab79004335fc53fb937234665df354daa1f64dd7da')
for pin in manifest['request']['sourcePins'] + manifest['schemaPrerequisites']:
    check(pin['path'], digest((ROOT / pin['path']).read_bytes()), pin['sha256'])

db = ROOT / 'data/vn30.sqlite'
before = digest(db.read_bytes())
check('protectedDatabaseBaseline', before, EXPECTED_DB)
source = sqlite3.connect(db.resolve().as_uri() + '?mode=ro', uri=True)
check('databaseIntegrity', source.execute('pragma quick_check').fetchone()[0], 'ok')
history = []
for name, checksum, finished, rolled in source.execute('SELECT migration_name,checksum,finished_at,rolled_back_at FROM _prisma_migrations ORDER BY migration_name'):
    actual = digest((ROOT / 'prisma/migrations' / name / 'migration.sql').read_bytes())
    check('migration:' + name, actual, checksum)
    check('completed:' + name, finished is not None and rolled is None, True)
    history.append({'name': name, 'checksum': checksum, 'finishedAt': finished, 'rolledBackAt': rolled})

def fingerprint(c):
    result = {}
    for (table,) in c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
        values = c.execute('SELECT * FROM "' + table.replace('"','""') + '"').fetchall()
        rows = sorted(json.dumps(v,ensure_ascii=False,default=lambda b:{'hex':b.hex()},separators=(',',':')) for v in values)
        result[table] = {'count': len(values), 'sha256': digest('\n'.join(rows).encode())}
    return result

original_tables = fingerprint(source)
required = re.findall(r'CREATE TABLE (market_boundary_ingest_\w+)', (ROOT / MISSING).read_text())
missing_tables = [t for t in required if not source.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (t,)).fetchone()]
approved_contains = MISSING in [p['path'] for p in manifest['schemaPrerequisites']]
check('requiredF1MigrationIncludedOrAlreadyApplied', approved_contains or not missing_tables, True)

# The exact approved schema list cannot satisfy actual F1 repository queries.
probe = sqlite3.connect(':memory:')
source.backup(probe)
for pin in manifest['schemaPrerequisites']:
    probe.executescript((ROOT / pin['path']).read_text())
try:
    probe.execute('SELECT raw_hash FROM market_boundary_ingest_raw LIMIT 0')
    failure = None
except sqlite3.OperationalError as e:
    failure = str(e)
assert failure == 'no such table: market_boundary_ingest_raw'
# This is only a schema sufficiency control, never a production authorization.
probe.executescript((ROOT / MISSING).read_text())
for table in required:
    probe.execute('SELECT * FROM ' + table + ' LIMIT 0')
probe.close()
after_tables = fingerprint(source)
source.close()
after = digest(db.read_bytes())
assert before == after and original_tables == after_tables
write('PROTECTED_BEFORE.json', {'fileSha256': before, 'tables': original_tables})
write('PROTECTED_AFTER.json', {'fileSha256': after, 'tables': after_tables})
write('PREFLIGHT_VALIDATION.json', {
    'status': 'BLOCKED_PREWRITE', 'baselineCommit': head,
    'productionTarget': str(db.resolve()), 'databaseOpenedReadOnly': True,
    'checks': checks, 'migrationHistory': history,
    'blocker': {'id': 'MANIFEST_MISSING_REQUIRED_F1_SCHEMA', 'path': MISSING,
                'sha256': digest((ROOT / MISSING).read_bytes()), 'absentTables': missing_tables,
                'approvedManifestIncludesMigration': approved_contains},
    'schemaProbe': {'target': ':memory:', 'exactApprovedSchemaResult': failure,
                    'withAdditionalMigrationTablesResolvable': True, 'productionWrites': 0},
    'remainingPreflight': 'NOT_EXECUTED_AFTER_MANDATORY_SCHEMA_FAILURE: runtime authority, exact adoption, full source lineage, recoverability drill and deployment rehearsal must pass before future production writes.'
})
proposal = {**manifest, 'status': 'PROPOSED_SUPERSESSION_REQUIRES_OWNER_AUTHORIZATION',
            'supersedesContentHash': manifest['contentHash'],
            'schemaPrerequisites': [{'path': MISSING, 'sha256': digest((ROOT / MISSING).read_bytes())}] + manifest['schemaPrerequisites'],
            'target': str(db.resolve()), 'ownerApprovalReference': None}
proposal.pop('contentHash')
proposal['contentHash'] = hashed(proposal)
write('PROPOSED_DEPLOYMENT_MANIFEST.json', proposal)
print(json.dumps({'status':'BLOCKED_PREWRITE','failedChecks':[c['check'] for c in checks if not c['pass']], 'proposalContentHash': proposal['contentHash'], 'databaseUnchanged':before==after}))
