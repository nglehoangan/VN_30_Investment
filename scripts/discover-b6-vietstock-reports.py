"""Capture public Vietstock listing requests; never persist session credentials."""
import concurrent.futures
import json
from pathlib import Path
import re
import subprocess
import tempfile
from urllib.parse import urlencode
from lib.vietstock_source_policy import require_vietstock_url

OUT = Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1')


def fetch(spec):
    ticker, year = spec
    page_url = require_vietstock_url(f'https://finance.vietstock.vn/{ticker.lower()}/tai-tai-lieu.htm?doctype=1')
    endpoint = require_vietstock_url('https://finance.vietstock.vn/data/getdocument')
    with tempfile.TemporaryDirectory(prefix='vn30-public-listing-') as folder:
        jar = str(Path(folder) / 'session')
        base = ['curl', '--silent', '--show-error', '--fail', '--max-time', '45', '--proto', '=https', '-A', 'Mozilla/5.0']
        html = subprocess.run(base + ['-c', jar, page_url], check=True, capture_output=True, text=True).stdout
        token = re.search(r'name="__RequestVerificationToken"[^>]*value="([^"]+)"', html)
        params = {'code': ticker, 'year': year, 'type': 1, 'page': 1}
        if token:
            params['__RequestVerificationToken'] = token.group(1)
        raw = subprocess.run(base + ['-b', jar, '-H', 'X-Requested-With: XMLHttpRequest', '-e', page_url,
                                     '--data', urlencode(params), endpoint], check=True, capture_output=True, text=True).stdout
        path = OUT / f'{ticker}-listing-{year}.json'
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return {'ticker': ticker, 'year': year, 'status': 'FAILED_NOT_JSON', 'tokenPresent': bool(token)}
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        return {'ticker': ticker, 'year': year, 'status': 'CAPTURED', 'path': str(path),
                'parameters': {k: v for k, v in params.items() if k != '__RequestVerificationToken'}}


def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        result = list(pool.map(fetch, [('SSI', 2026), ('TCX', 2026), ('MCH', 2023), ('HPG', 2024), ('VPL', 2022)]))
    (OUT / 'listing-discovery.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
