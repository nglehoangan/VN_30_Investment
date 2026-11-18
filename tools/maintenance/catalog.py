#!/usr/bin/env python3
"""Index retained downloads for one ticker without rewriting original receipts."""
import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from tools.maintenance.common import atomic_json, digest_json, require_ticker, sha256_file


def build(root, ticker):
    ticker = require_ticker(ticker)
    root = Path(root).resolve()
    folder = root/ticker
    if not folder.is_dir() or folder.is_symlink():
        raise ValueError('EXISTING_TICKER_DIRECTORY_REQUIRED')
    sources = sorted(root.glob('*.json')) + sorted(folder.rglob('*.json'))
    sources = [p for p in sources if p.name not in ('document-catalog.json', 'document-inventory.json')]
    catalog_path = folder/'document-catalog.json'
    catalog = json.loads(catalog_path.read_text()) if catalog_path.exists() else {
        'contract': 'ticker-document-catalog-v1', 'ticker': ticker, 'observations': []}
    seen = {r['id'] for r in catalog['observations']}
    files = {str(p.relative_to(ROOT)): p for p in folder.rglob('*')
             if p.is_file() and not p.is_symlink() and p.suffix.lower() in ('.pdf', '.zip', '.rar', '.html')}

    def visit(value, source, pointer, source_hash):
        if isinstance(value, dict):
            path = value.get('path') or value.get('localPath') or value.get('pdfPath')
            if isinstance(path, str) and path in files:
                identity = {'source': str(source.relative_to(ROOT)), 'pointer': pointer,
                            'sourceSha256': source_hash, 'originalReceipt': value}
                row = {'id': digest_json(identity), 'ticker': ticker, 'path': path,
                       'sha256': value.get('sha256'), 'receipt': value,
                       'originalReceiptReference': {k: v for k, v in identity.items() if k != 'originalReceipt'},
                       'metadata': {'qualification': 'NOT_GRANTED_BY_STORAGE',
                                    'scope': 'UNKNOWN', 'period': 'UNKNOWN'},
                       'hashStatus': 'ORIGINAL_RECEIPT_CLAIM_VERIFY_BEFORE_REUSE'}
                if row['id'] not in seen:
                    catalog['observations'].append(row)
                    seen.add(row['id'])
            for key, child in value.items():
                visit(child, source, pointer+'/'+str(key).replace('~', '~0').replace('/', '~1'), source_hash)
        elif isinstance(value, list):
            for index, child in enumerate(value):
                visit(child, source, pointer+'/'+str(index), source_hash)

    for source in sources:
        visit(json.loads(source.read_text()), source, '', sha256_file(source))
    atomic_json(catalog_path, catalog)
    covered = {r['path'] for r in catalog['observations']}
    inventory = {'contract': 'ticker-document-inventory-v1', 'ticker': ticker,
                 'legacyPathsPreserved': True, 'files': [
                     {'path': path, 'bytes': p.stat().st_size,
                      'receiptIndexed': path in covered,
                      'metadataQualification': 'NOT_GRANTED_BY_FILENAME'}
                     for path, p in sorted(files.items())]}
    atomic_json(folder/'document-inventory.json', inventory)
    return {'ticker': ticker, 'files': len(files), 'receiptIndexed': len(covered),
            'observations': len(catalog['observations'])}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument('--ticker', action='append', required=True)
    args = parser.parse_args()
    if len(args.ticker) != 1:
        parser.error('EXACTLY_ONE_TICKER_REQUIRED')
    print(json.dumps(build(ROOT/'data/manual-download', args.ticker[0])))
