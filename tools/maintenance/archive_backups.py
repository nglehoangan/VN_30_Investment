#!/usr/bin/env python3
"""Lossless cold presentation-snapshot archiving. Never archives live data or SQLite."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import stat
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from tools.maintenance.common import atomic_json, sha256_file


def original_path(root, name):
    root = Path(root).resolve()
    relative = Path(name)
    path = root/relative
    if (relative.is_absolute() or '..' in relative.parts or not relative.parts
            or relative.parts[0] != 'backups' or 'presentation-before' not in relative.parts
            or relative.suffix != '.json' or path.resolve() != path):
        raise ValueError('COLD_PRESENTATION_JSON_ONLY')
    return path


def stream_hash(source, output=None):
    digest, size = hashlib.sha256(), 0
    for chunk in iter(lambda: source.read(1024*1024), b''):
        digest.update(chunk)
        size += len(chunk)
        if output is not None:
            output.write(chunk)
    return digest.hexdigest(), size


def verify(archive, receipt):
    if sha256_file(archive) != receipt['archiveSha256']:
        raise ValueError('ARCHIVE_HASH_MISMATCH')
    with zipfile.ZipFile(archive) as bundle:
        names = bundle.namelist()
        if len(names) != len(set(names)) or set(names) != {r['path'] for r in receipt['files']}:
            raise ValueError('ARCHIVE_INVENTORY_MISMATCH')
        for row in receipt['files']:
            with bundle.open(row['path']) as source:
                digest, size = stream_hash(source)
            if digest != row['sha256'] or size != row['bytes']:
                raise ValueError('ARCHIVE_ROUNDTRIP_MISMATCH')


def archive_cold_json(root, names, archive):
    root, archive = Path(root).resolve(), Path(archive).absolute()
    if (not archive.is_relative_to(root/'backups') or archive.resolve() != archive
            or archive.suffix != '.zip'):
        raise ValueError('BACKUP_ARCHIVE_PATH_REQUIRED')
    manifest = archive.with_suffix('.manifest.json')
    names = sorted(set(names))
    sources = [original_path(root, name) for name in names]
    if archive.exists():
        if not manifest.is_file():
            raise ValueError('EXISTING_ARCHIVE_REQUIRES_RECEIPT')
        receipt = json.loads(manifest.read_text())
        if not set(names).issubset({r['path'] for r in receipt['files']}):
            raise ValueError('NEW_SOURCES_REQUIRE_NEW_ARCHIVE')
    else:
        if not names or manifest.exists():
            raise ValueError('NONEMPTY_NEW_ARCHIVE_REQUIRED')
        for path in sources:
            if not path.is_file():
                raise ValueError('SOURCE_MISSING')
        archive.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(prefix='.cold-json-', suffix='.zip', dir=archive.parent)
        os.close(fd)
        rows = []
        try:
            with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as bundle:
                for name, path in zip(names, sources):
                    before = path.stat()
                    info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
                    info.compress_type = zipfile.ZIP_DEFLATED
                    with path.open('rb') as source, bundle.open(info, 'w', force_zip64=True) as output:
                        digest, size = stream_hash(source, output)
                    after = path.stat()
                    if size != after.st_size:
                        raise ValueError('SOURCE_SIZE_CHANGED_DURING_ARCHIVING:' + name)
                    rows.append({'path': name, 'sha256': digest, 'bytes': size,
                                 'mtimeNs': before.st_mtime_ns, 'afterReadMtimeNs': after.st_mtime_ns, 'mode': stat.S_IMODE(before.st_mode)})
                    print(json.dumps({'archived': name, 'bytes': size}), flush=True)
            receipt = {'contract': 'cold-presentation-archive-v1', 'files': rows,
                       'archive': str(archive.relative_to(root)), 'archiveSha256': sha256_file(temporary),
                       'originalBytes': sum(r['bytes'] for r in rows), 'archiveBytes': Path(temporary).stat().st_size,
                       'preservesOriginalBytes': True, 'sqliteBackupsArchived': False}
            verify(temporary, receipt)
            with open(temporary, 'rb') as durable:
                os.fsync(durable.fileno())
            os.replace(temporary, archive)
            # A durable receipt precedes all original removals, allowing safe retry/recovery.
            atomic_json(manifest, receipt, immutable=True)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)
    verify(archive, receipt)
    directory = os.open(archive.parent, os.O_RDONLY)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)
    # Preflight every remaining original before removing any of them.
    for row in receipt['files']:
        path = original_path(root, row['path'])
        if path.exists() and sha256_file(path) != row['sha256']:
            raise ValueError('ORIGINAL_CHANGED_KEEP_BOTH_VERSIONS')
    for row in receipt['files']:
        original_path(root, row['path']).unlink(missing_ok=True)
    return receipt


def restore(root, archive, selected=None):
    root, archive = Path(root).resolve(), Path(archive)
    receipt = json.loads(archive.with_suffix('.manifest.json').read_text())
    verify(archive, receipt)
    rows = [r for r in receipt['files'] if selected is None or r['path'] in selected]
    if selected is not None and set(selected) != {r['path'] for r in rows}:
        raise ValueError('UNKNOWN_ARCHIVED_PATH')
    for row in rows:
        path = original_path(root, row['path'])
        if path.exists() and sha256_file(path) != row['sha256']:
            raise ValueError('RESTORE_REFUSES_OVERWRITE')
    with zipfile.ZipFile(archive) as bundle:
        for row in rows:
            path = original_path(root, row['path'])
            if path.exists():
                continue
            path.parent.mkdir(parents=True, exist_ok=True)
            fd, temporary = tempfile.mkstemp(prefix='.restore-', dir=path.parent)
            try:
                with os.fdopen(fd, 'wb') as output, bundle.open(row['path']) as source:
                    digest, size = stream_hash(source, output)
                    output.flush()
                    os.fsync(output.fileno())
                if digest != row['sha256'] or size != row['bytes']:
                    raise ValueError('RESTORE_HASH_MISMATCH')
                os.chmod(temporary, row['mode'])
                os.utime(temporary, ns=(row['mtimeNs'], row['mtimeNs']))
                os.replace(temporary, path)
            finally:
                if os.path.exists(temporary):
                    os.unlink(temporary)
    return len(rows)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument('--archive', required=True)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--restore', action='store_true')
    parser.add_argument('--path', action='append', help='Restore only these exact receipt paths')
    parser.add_argument('--plan', help='Reviewed archive plan; required for removal of original cold copies')
    args = parser.parse_args()
    if args.restore:
        if not args.apply:
            parser.error('RESTORE_REQUIRES_EXPLICIT_APPLY')
        print(json.dumps({'restored': restore(ROOT, ROOT/args.archive, args.path)}))
    else:
        names = sorted(str(p.relative_to(ROOT)) for p in (ROOT/'backups').rglob('*.json')
                       if 'presentation-before' in p.parts and p.stat().st_size > 1_000_000)
        if args.apply:
            if not args.plan:
                parser.error('ARCHIVING_REQUIRES_PREFLIGHT_PLAN')
            plan = json.loads((ROOT/args.plan).read_text())
            if not all(plan.get('checks', {}).get(key) is True for key in (
                    'noActiveSourceReferences', 'noPinnedPaths', 'noTargetPathsInLiveDatabase', 'sqliteBackupsExcluded')):
                parser.error('ARCHIVE_PREFLIGHT_FAILED')
            if sha256_file(ROOT/'data/vn30.sqlite') != plan['databaseSha256']:
                parser.error('PROTECTED_DATABASE_BASELINE_CHANGED')
            if not set(names).issubset(set(plan['paths'])):
                parser.error('NEW_FILES_REQUIRE_UPDATED_PREFLIGHT')
            names = [name for name in plan['paths'] if (ROOT/name).exists()]
            receipt = archive_cold_json(ROOT, names, ROOT/args.archive)
            print(json.dumps({key: value for key, value in receipt.items() if key != 'files'} | {'files': len(receipt['files'])}))
        else:
            print(json.dumps({'dryRun': True, 'files': names, 'bytes': sum((ROOT/p).stat().st_size for p in names)}, indent=2))
