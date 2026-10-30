"""Retry owner-selected Vietstock URLs without modifying historical receipts."""
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit, unquote
from lib.vietstock_source_policy import download_vietstock, require_vietstock_url

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/document-retry-r1'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fetch(spec):
    require_vietstock_url(spec['url'])
    filename = Path(unquote(urlsplit(spec['url']).path)).name
    target = ROOT / 'data/manual-download' / spec['ticker'] / '2026-10-29-owner-retry' / filename
    assert not target.exists(), 'SOURCE_ALREADY_EXISTS'
    target.parent.mkdir(parents=True, exist_ok=True)
    partial = target.with_suffix(target.suffix + '.part')
    record = {**spec, 'startedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}
    try:
        response = download_vietstock(spec['url'], partial)
        status = int(response.stdout) if response.stdout.isdigit() else None
        record.update({'finishedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                       'httpStatus': status, 'retrievedAtSemantics': 'HTTP_CAPTURE_NOT_PUBLICATION'})
        if response.returncode:
            record.update({'status': 'FAILED', 'error': 'HTTP_' + str(status) if status else response.stderr[:250]})
        elif not partial.read_bytes().startswith(b'%PDF-'):
            record.update({'status': 'FAILED', 'error': 'NOT_PDF'})
        else:
            partial.replace(target)
            record.update({'status': 'DOWNLOADED', 'path': str(target.relative_to(ROOT)),
                           'sha256': sha(target), 'bytes': target.stat().st_size,
                           'productionAdmissible': False, 'scoringAuthorized': False})
    except Exception as error:
        record.update({'status': 'FAILED', 'error': type(error).__name__ + ': ' + str(error)[:250]})
    finally:
        partial.unlink(missing_ok=True)
    return record


def main():
    OUT.mkdir(parents=True, exist_ok=False)
    historic_path = ROOT / 'data/manual-download/manifest.json'
    historic_hash, db_hash = sha(historic_path), sha(ROOT / 'data/vn30.sqlite')
    historic = json.loads(historic_path.read_text())
    specs = []
    for ticker in ['CTG', 'HDB', 'MBB', 'SHB', 'VIB', 'VIC']:
        if ticker == 'MBB':
            url = 'https://static2.vietstock.vn/data/HOSE/2025/BCTLATV/VN/NAM/MBB_BaocaoTyleAnToanVon_2025.PDF'
            period = '2025'
        elif ticker == 'VIC':
            url = 'https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%202/VIC_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.pdf?ver=1194354f'
            period = '6T2026'
        else:
            url = next(r['url'] for r in historic['requests'] if r['ticker'] == ticker and r['status'] == 'FAILED')
            period = '6T2026'
        specs.append({'ticker': ticker, 'period': period, 'url': url})
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        records = list(pool.map(fetch, specs))
    old_pdfs = [r for r in historic['requests'] if r['status'] == 'DOWNLOADED']
    for r in records:
        if r['status'] == 'DOWNLOADED':
            r['sameHashPreviouslyRetainedPaths'] = [p['path'] for p in old_pdfs if p['sha256'] == r['sha256']]
    deferred = {'ticker': 'MBB', 'period': '6T2026', 'document': 'CAPITAL_ADEQUACY_DISCLOSURE',
                'status': 'DEFERRED_OWNER_REPORTED_NOT_YET_PUBLISHED', 'attempted': False,
                'ownerInstruction': 'MBB An toàn vốn 6T2026 chưa được công bố tạm thời không cập nhật',
                'publicationIndependentlyVerified': False, 'fillFromPriorPeriod': False,
                'scoringReadinessAutomaticallyGranted': False}
    assert sha(historic_path) == historic_hash and sha(ROOT / 'data/vn30.sqlite') == db_hash
    receipt = {'schemaVersion': 'owner-vietstock-document-retry-v1', 'records': records, 'deferred': [deferred],
               'sourcePolicy': 'VIETSTOCK_ONLY_EACH_REDIRECT_VALIDATED', 'historicalManifestUnchanged': True,
               'databaseUnchanged': True, 'databaseSha256': db_hash,
               'historicalManifest': {'path': str(historic_path.relative_to(ROOT)), 'sha256': historic_hash}}
    receipt_path = OUT / 'download-manifest.json'
    receipt_path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    index_path = ROOT / 'data/manual-download/supplemental-manifest-2026-10-29.json'
    index = json.loads(index_path.read_text())
    index['supplements'].append({'path': str(receipt_path.relative_to(ROOT)), 'sha256': sha(receipt_path),
                                'purpose': 'OWNER_SELECTED_RETRY_AND_MBB_INTERIM_DEFERRAL'})
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'records': records, 'deferred': deferred}, ensure_ascii=False))


if __name__ == '__main__':
    main()
