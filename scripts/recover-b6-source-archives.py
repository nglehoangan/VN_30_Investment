"""Reacquire historical Vietstock archives; preserve every acquisition attempt."""
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess
import sys
from urllib.parse import unquote, urlsplit
import zipfile
from lib.vietstock_source_policy import download_vietstock, require_vietstock_url

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1'


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def recover(spec):
    ticker, url = spec
    require_vietstock_url(url)
    folder = ROOT / 'data/manual-download' / ticker / '2026-10-30-source-recovery'
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / Path(unquote(urlsplit(url).path)).name
    assert not target.exists(), 'ARCHIVE_ALREADY_EXISTS'
    part = target.with_suffix(target.suffix + '.part')
    record = {'ticker': ticker, 'url': url, 'members': []}
    try:
        response = download_vietstock(url, part)
        record.update(httpStatus=int(response.stdout) if response.stdout.isdigit() else None,
                      retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
        if response.returncode:
            record.update(status='FAILED', error=response.stderr[:300])
            return record
        part.replace(target)
        record.update(status='DOWNLOADED', path=str(target.relative_to(ROOT)), sha256=sha(target))
        if target.read_bytes().startswith(b'%PDF-'):
            record['members'].append({'path': str(target.relative_to(ROOT)), 'sha256': sha(target), 'archiveEntry': None})
        elif zipfile.is_zipfile(target):
            with zipfile.ZipFile(target) as archive:
                assert archive.testzip() is None, 'ZIP_CRC_FAILURE'
                names = archive.namelist()
                for name in names:
                    path = PurePosixPath(name.replace('\\', '/'))
                    assert not path.is_absolute() and '..' not in path.parts, 'UNSAFE_ARCHIVE_PATH'
                    if not name.lower().endswith('.pdf'):
                        continue
                    info = archive.getinfo(name)
                    assert info.file_size < 100_000_000, 'MEMBER_TOO_LARGE'
                    payload = archive.read(name)
                    assert payload.startswith(b'%PDF-'), 'NOT_PDF'
                    member = folder / (hashlib.sha256(name.encode()).hexdigest()[:8] + '_' + path.name)
                    assert not member.exists()
                    member.write_bytes(payload)
                    record['members'].append({'path': str(member.relative_to(ROOT)), 'sha256': sha(member), 'archiveEntry': name})
        else:
            listing = subprocess.run(['bsdtar', '-tf', str(target)], check=True, capture_output=True, text=True).stdout.splitlines()
            for name in listing:
                path = PurePosixPath(name.replace('\\', '/'))
                assert not path.is_absolute() and '..' not in path.parts, 'UNSAFE_ARCHIVE_PATH'
                if not name.lower().endswith('.pdf'):
                    continue
                payload = subprocess.run(['bsdtar', '-xOf', str(target), name], check=True, capture_output=True).stdout
                assert len(payload) < 100_000_000 and payload.startswith(b'%PDF-'), 'NOT_PDF'
                member = folder / (hashlib.sha256(name.encode()).hexdigest()[:8] + '_' + path.name)
                assert not member.exists()
                member.write_bytes(payload)
                record['members'].append({'path': str(member.relative_to(ROOT)), 'sha256': sha(member), 'archiveEntry': name})
    except Exception as error:
        record['processingError'] = type(error).__name__ + ': ' + str(error)[:300]
        record.setdefault('status', 'FAILED')
    finally:
        part.unlink(missing_ok=True)
    return record


def main():
    suffix = '-last' if '--last-routes' in sys.argv else '-additional' if '--additional-routes' in sys.argv else '-candidates' if '--candidate-routes' in sys.argv else '-network' if '--retry-network' in sys.argv else ''
    receipt = OUT / ('archive-recovery' + suffix + '.json')
    assert not receipt.exists(), 'RECOVERY_RECEIPT_EXISTS'
    inventory = json.loads((OUT / 'source-investigation.json').read_text())
    specs = sorted({(g['ticker'], r['url']) for g in inventory.values() for r in g['references']})
    if '--candidate-routes' in sys.argv:
        # Filename-pattern probes are unverified routes until HTTP bytes and document identity are checked.
        specs = [('SSI', 'https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%202/SSI_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.zip'),
                 ('TCX', 'https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%202/TCX_Baocaotaichinh_6T_2026_Soatxet.zip'),
                 ('MCH', 'https://static2.vietstock.vn/data/UPCOM/2023/BCTC/VN/NAM/MCH_Baocaotaichinh_2023_Kiemtoan_Hopnhat.zip'),
                 ('HPG', 'https://static2.vietstock.vn/data/HOSE/2024/BCTC/VN/NAM/HPG_Baocaotaichinh_2024_Kiemtoan_Hopnhat.zip'),
                 ('VPL', 'https://static2.vietstock.vn/data/OTC/2022/BCTC/VN/NAM/VPL_Baocaotaichinh_2022_Kiemtoan_Hopnhat.zip')]
    if '--additional-routes' in sys.argv:
        specs = [('VCB', f'https://static2.vietstock.vn/data/HOSE/{year}/BCTLATV/VN/NAM/VCB_BaocaoTyleAnToanVon_{year}.pdf') for year in [2022, 2023, 2024, 2025]] + [
            ('VCB', 'https://static2.vietstock.vn/data/HOSE/2026/BCTLATV/VN/QUY%202/VCB_BaocaoTyleAnToanVon_6T_2026.pdf'),
            ('SHB', 'https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%202/SHB_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.zip'),
            ('TCX', 'https://static2.vietstock.vn/data/KHAC/2026/BCTC/VN/QUY%202/TCBS_Baocaotaichinh_6T_2026_Soatxet.zip'),
            ('TCX', 'https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%202/TCX_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.zip')]
    if '--last-routes' in sys.argv:
        specs = [('SHB', 'https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%202/SHB_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.pdf'),
                 ('TCX', 'https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%202/TCX_Baocaotaichinh_6T_2026_Soatxet.pdf'),
                 ('SSB', 'https://static2.vietstock.vn/data/HOSE/2023/BCTC/VN/NAM/SSB_Baocaotaichinh_2023_Kiemtoan_Hopnhat.zip'),
                 ('VPL', 'https://static2.vietstock.vn/data/OTC/2022/BCTC/VN/NAM/VPL_Baocaotaichinh_2022_Kiemtoan_Hopnhat.pdf')]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        records = list(pool.map(recover, specs))
    found = {m['sha256']: m for r in records for m in r['members']}
    result = {'contract': 'b6-vietstock-archive-recovery-v1', 'sourcePolicy': 'VIETSTOCK_ONLY_EACH_REDIRECT_VALIDATED',
              'records': records, 'exactRecoveredHashes': [h for h in inventory if h in found],
              'exactRecoveredObservations': sum(len(g['facts']) for h, g in inventory.items() if h in found),
              'historicalSealsModified': False, 'productionAdmission': False}
    receipt.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'archives': len(records), 'downloaded': sum(r['status'] == 'DOWNLOADED' for r in records),
                      'recoveredHashes': len(result['exactRecoveredHashes']), 'observations': result['exactRecoveredObservations']}))


if __name__ == '__main__':
    main()
