"""Owner-authorized reset and fresh acquisition from the saved public Vietstock inventory."""
import argparse
import concurrent.futures
import datetime
import hashlib
import json
import pathlib
import shutil
import sqlite3
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONTROL = ROOT / 'docs/fundamental-data-engine/rebuild-2026-10-19'
DATA = ROOT / 'data'
PREVIOUS = {}


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temp.replace(path)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def reset():
    db = DATA / 'vn30.sqlite'
    with sqlite3.connect(db) as client:
        client.execute('PRAGMA wal_checkpoint(TRUNCATE)')
        assert client.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
    before = digest(db)
    removed = []
    for path in DATA.iterdir():
        if path.name == 'vn30.sqlite':
            continue
        removed.append(path.name)
        if path.is_symlink() or path.is_file():
            path.unlink()
        else:
            shutil.rmtree(path)
    assert digest(db) == before
    write(CONTROL / 'reset-receipt.json', {
        'authorization': 'Explicit owner request 2026-10-19: delete all data except vn30.sqlite and rebuild four directories.',
        'databaseSha256Before': before, 'databaseSha256After': digest(db),
        'removed': removed, 'oldExtractedValuesReused': False,
    })
    for name in ['manual-download', 'manual-extracted-pdf', 'manual-extracted-api', 'combine']:
        (DATA / name).mkdir()


def fetch(item):
    target = ROOT / item['path']
    if target.exists():
        data = target.read_bytes()
        if data.startswith(b'%PDF-'):
            return {**PREVIOUS.get(item['url'], {}), **item, 'status': 'DOWNLOADED', 'sha256': digest(target), 'bytes': len(data), 'cachedWithinFreshRun': True}
    stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        temp = target.with_suffix('.part')
        response = subprocess.run(['curl', '--silent', '--show-error', '--location', '--fail',
            '--proto', '=https', '--proto-redir', '=https', '--max-time', '55', '--max-filesize', '100000000',
            '--output', str(temp), '--write-out', '%{http_code}', item['url']], capture_output=True, text=True, timeout=60)
        status = int(response.stdout[-3:]) if response.stdout[-3:].isdigit() else None
        if response.returncode:
            temp.unlink(missing_ok=True)
            return {**item, 'status': 'FAILED', 'retrievedAt': stamp, 'httpStatus': status,
                    'error': 'HTTP_' + str(status) if status else response.stderr[:250]}
        data = temp.read_bytes()
        if not data.startswith(b'%PDF-'):
            temp.unlink()
            raise ValueError('NOT_A_PDF')
        temp.replace(target)
        return {**item, 'status': 'DOWNLOADED', 'retrievedAt': stamp, 'httpStatus': status,
                'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
    except Exception as error:
        return {**item, 'status': 'FAILED', 'retrievedAt': stamp, 'httpStatus': None, 'error': str(error)[:250]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--reset', action='store_true')
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    plan = json.loads((CONTROL / 'source-plan.json').read_text())
    if args.reset:
        reset()
    global PREVIOUS
    previous_manifest = DATA / 'manual-download/manifest.json'
    if previous_manifest.exists():
        PREVIOUS = {r['url']: r for r in json.loads(previous_manifest.read_text())['requests']}
    jobs = []
    used = set()
    for source in plan['sources']:
        name = source['filename']
        path = pathlib.Path('data/manual-download') / source['ticker'] / name
        if str(path) in used:
            path = path.with_name(path.stem + '-source-' + hashlib.sha256(source['url'].encode()).hexdigest()[:10] + '.pdf')
        used.add(str(path))
        jobs.append({**source, 'path': str(path)})
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        for result in pool.map(fetch, jobs):
            results.append(result)
            manifest = {'schemaVersion': 'vn30-vietstock-download-v1', 'tickers': plan['tickers'],
                        'complete': len(results) == len(jobs), 'requests': results}
            write(DATA / 'manual-download/manifest.json', manifest)
            print(json.dumps({'done': len(results), 'total': len(jobs), 'ticker': result['ticker'], 'status': result['status']}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
