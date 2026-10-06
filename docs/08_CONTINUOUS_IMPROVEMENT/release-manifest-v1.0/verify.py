"""Verify the detached release evidence against Git objects, without checkout."""
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tarfile


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(',', ':')).encode()).hexdigest()


def require(condition, message):
    if not condition:
        raise SystemExit('FAIL: ' + message)


folder = Path(__file__).resolve().parent
raw = (folder / 'manifest.json').read_bytes()
require(hashlib.sha256(raw).hexdigest() ==
        (folder / 'manifest.sha256').read_text().split()[0], 'manifest checksum')
manifest = json.loads(raw)
repo = subprocess.check_output(['git', '-C', str(folder), 'rev-parse', '--show-toplevel'], text=True).strip()
commit = manifest['git']['commit']
require(subprocess.check_output(['git', '-C', repo, 'rev-parse', commit + '^{commit}'], text=True).strip() == commit, 'exact commit')
require(subprocess.check_output(['git', '-C', repo, 'rev-parse', commit + '^{tree}'], text=True).strip() == manifest['git']['tree'], 'tree identity')
expected = manifest['inventory']['artifacts']
require(len(expected) == manifest['inventory']['count'], 'inventory count')
require(len({x['path'] for x in expected}) == len(expected), 'duplicate paths')
require(digest(expected) == manifest['inventory']['sha256'], 'inventory digest')
actual = {}
with tarfile.open(fileobj=io.BytesIO(subprocess.check_output(['git', '-C', repo, 'archive', commit]))) as archive:
    for member in archive:
        require(member.isdir() or member.isfile(), 'unsupported archive member: ' + member.name)
        if member.isfile():
            data = archive.extractfile(member).read()
            actual[member.name] = (len(data), hashlib.sha256(data).hexdigest())
require(set(actual) == {x['path'] for x in expected}, 'complete inventory coverage')
for item in expected:
    require(actual[item['path']] == (item['bytes'], item['sha256']), 'artifact: ' + item['path'])
schema = [x for x in expected if x['path'].startswith('prisma/')]
require(schema == manifest['schema_identity']['artifacts'], 'schema inventory')
require(digest(schema) == manifest['schema_identity']['inventory_sha256'], 'schema digest')
pkg = json.loads(subprocess.check_output(['git', '-C', repo, 'show', commit + ':package.json']))
build = manifest['build_identity']
for field, value in {'source_identity': 'git:' + commit, 'package_name': pkg['name'],
                     'package_version': pkg['version'], 'package_manager': pkg['packageManager'],
                     'node_requirement': pkg['engines']['node'], 'dependencies': pkg['dependencies'],
                     'dev_dependencies': pkg['devDependencies'], 'command': pkg['scripts']['build']}.items():
    require(build[field] == value, 'build source field: ' + field)
report = {'result': 'PASS', 'commit': commit, 'artifacts_verified': len(actual),
          'schema_artifacts_verified': len(schema), 'build_source_identity_verified': True,
          'compiled_build_verified': False, 'production_freeze_verified': False,
          'scope': 'Git artifact bytes and manifest integrity; does not certify build, runtime, approvals or production acceptance'}
print(json.dumps(report, ensure_ascii=False, indent=2))
