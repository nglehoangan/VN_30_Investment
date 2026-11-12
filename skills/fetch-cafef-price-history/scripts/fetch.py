#!/usr/bin/env python3
"""Incremental CafeF daily history; one atomic JSON per ticker (stdlib only)."""
import argparse
import calendar
import datetime as dt
import hashlib
import json
import math
import os
from pathlib import Path
import re
import tempfile
import urllib.parse
import subprocess
import sys
from zoneinfo import ZoneInfo

ENDPOINT = 'https://cafef.vn/du-lieu/Ajax/PageNew/DataHistory/PriceHistory.ashx'
ROOT = Path(__file__).resolve().parents[3]


def years_before(day, years):
    year = day.year - years
    return day.replace(year=year, day=min(day.day, calendar.monthrange(year, day.month)[1]))


def windows(end, years):
    for n in range(years):
        yield years_before(end, n + 1), years_before(end, n)


def fetch(params):
    url = ENDPOINT + '?' + urllib.parse.urlencode(params)
    # System curl uses the platform trust store; never bypass TLS verification.
    result = subprocess.run(['curl', '--silent', '--show-error', '--max-time', '45',
                             '--retry', '2', '--retry-delay', '1', '--retry-max-time', '100',
                             '--user-agent', 'Mozilla/5.0', '--write-out', '\n%{http_code}', url],
                            capture_output=True, timeout=150)
    if result.returncode:
        raise RuntimeError(result.stderr.decode('utf-8', errors='replace'))
    raw_bytes, status_bytes = result.stdout.rsplit(b'\n', 1)
    status = int(status_bytes)
    if status != 200:
        raise ValueError('HTTP ' + str(status))
    raw = raw_bytes.decode('utf-8')
    result = json.loads(raw.lstrip('\ufeff'))
    if result.get('Success') is not True:
        raise ValueError('CafeF did not return Success=true')
    data = result['Data']
    if not isinstance(data.get('Data'), list):
        raise ValueError('Invalid row list')
    total = data['TotalCount']
    if isinstance(total, bool) or not isinstance(total, int) or total < 0:
        raise ValueError('Invalid TotalCount')
    receipt = {'url': url, 'parameters': params.copy(), 'receivedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
               'httpStatus': status, 'sha256': hashlib.sha256(raw_bytes).hexdigest(), 'rawResponse': raw}
    return data['Data'], total, receipt


def update(symbol, exchange, years, end, path, start=None, retain_requests=False):
    if start is not None and start > end:
        raise ValueError('start must not exceed end')
    if path.exists():
        document = json.loads(path.read_text())
        if (document['schemaVersion'], document['provider'], document['symbol'], document['exchange']) != (1, 'CAFEF', symbol, exchange):
            raise ValueError('Existing file identity mismatch')
    else:
        document = {'schemaVersion': 1, 'provider': 'CAFEF', 'symbol': symbol, 'exchange': exchange,
                    'units': None, 'prices': [], 'requests': [], 'conflicts': []}
    prices = {r['date']: r for r in document['prices']}
    if len(prices) != len(document['prices']):
        raise ValueError('Existing file contains duplicate dates')
    request_keys = {r['url'] + r['sha256'] for r in document['requests']}
    conflict_keys = {(c['date'], c['incomingSha256']) for c in document['conflicts']}
    stats = {'requests': 0, 'added': 0, 'duplicates': 0, 'conflicts': 0}
    requested_start = start or years_before(end, years)
    periods = list(windows(end, end.year - requested_start.year + 1))
    for lower, finish in periods:
        if finish <= requested_start and finish != end:
            continue
        lower = max(lower, requested_start)
        page, expected, seen, previous = 1, None, set(), None
        while True:
            # Request dates are US month/day; response Ngay is Vietnamese day/month.
            params = {'ExchangeType': exchange, 'Symbol': symbol, 'StartDate': lower.strftime('%m/%d/%Y'),
                      'EndDate': finish.strftime('%m/%d/%Y'), 'PageIndex': page, 'PageSize': 30}
            rows, total, receipt = fetch(params)
            stats['requests'] += 1
            if expected is None:
                expected = total
            if total != expected or len(rows) != min(30, max(0, total - (page - 1) * 30)):
                raise ValueError('Pagination count changed or page incomplete; retry later')
            retain = retain_requests
            for row in rows:
                day = dt.datetime.strptime(row['Ngay'], '%d/%m/%Y').date()
                if row['Symbol'].upper() != symbol or not lower <= day <= finish or day in seen:
                    raise ValueError('Wrong ticker/date or duplicate row inside a window')
                if previous is not None and day >= previous:
                    raise ValueError('Provider rows are not strictly descending')
                previous = day
                for field in ('GiaMoCua', 'GiaCaoNhat', 'GiaThapNhat', 'GiaDongCua', 'GiaDieuChinh',
                              'KhoiLuongKhopLenh', 'GiaTriKhopLenh', 'KLThoaThuan', 'GtThoaThuan'):
                    value = row.get(field)
                    if value is not None and (isinstance(value, bool) or not isinstance(value, (int, float))
                                              or not math.isfinite(value) or value < 0):
                        raise ValueError('Invalid numeric field ' + field)
                o, h, l, c = (row.get(f) for f in ('GiaMoCua','GiaCaoNhat','GiaThapNhat','GiaDongCua'))
                if all(v is not None for v in (o,h,l,c)) and not (l <= min(o,c) <= max(o,c) <= h):
                    raise ValueError('Invalid OHLC bounds')
                seen.add(day)
                key = day.isoformat()
                if key not in prices:
                    prices[key] = {'date': key, 'raw': row, 'sourceUrl': receipt['url'],
                                   'receivedAt': receipt['receivedAt'], 'responseSha256': receipt['sha256']}
                    stats['added'] += 1
                    retain = True
                else:
                    stats['duplicates'] += 1
                    if prices[key]['raw'] != row:
                        stats['conflicts'] += 1
                        digest = hashlib.sha256(json.dumps(row, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
                        if (key, digest) not in conflict_keys:
                            document['conflicts'].append({'date': key, 'incoming': row, 'incomingSha256': digest,
                                                          'sourceUrl': receipt['url'], 'responseSha256': receipt['sha256'],
                                                          'receivedAt': receipt['receivedAt'], 'resolution': 'KEEP_EXISTING'})
                            conflict_keys.add((key, digest))
                            retain = True
            capture_key = receipt['url'] + receipt['sha256']
            if retain and capture_key not in request_keys:
                document['requests'].append(receipt)
                request_keys.add(capture_key)
            if page * 30 >= total:
                if len(seen) != total:
                    raise ValueError('Unique row count does not match TotalCount')
                break
            page += 1
    document['prices'] = sorted(prices.values(), key=lambda r: r['date'])
    # Comparing bytes avoids rewriting an unchanged file on duplicate-only reruns.
    payload = json.dumps(document, ensure_ascii=False, indent=2) + '\n'
    if not path.exists() or path.read_text() != payload:
        path.parent.mkdir(parents=True, exist_ok=True)
        temp = None
        try:
            with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent, delete=False) as handle:
                temp = handle.name
                handle.write(payload)
            os.replace(temp, path)
        finally:
            if temp and os.path.exists(temp):
                os.unlink(temp)
    return {**stats, 'totalStored': len(prices), 'from': requested_start.isoformat(),
            'to': end.isoformat(), 'path': str(path)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--symbol', required=True)
    parser.add_argument('--years', type=int, default=1)
    parser.add_argument('--exchange', choices=['HOSE', 'HNX', 'UPCOM'], default='HOSE')
    parser.add_argument('--as-of', type=dt.date.fromisoformat, default=dt.datetime.now(ZoneInfo('Asia/Ho_Chi_Minh')).date())
    parser.add_argument('--start', type=dt.date.fromisoformat)
    parser.add_argument('--end', type=dt.date.fromisoformat, help='Explicit end; overrides as-of')
    parser.add_argument('--retain-request-evidence', action='store_true', help='Retain empty/no-change page receipts too')
    args = parser.parse_args()
    symbol = args.symbol.upper()
    end = args.end or args.as_of
    if not re.fullmatch(r'[A-Z0-9]{1,20}', symbol) or not 1 <= args.years < end.year:
        parser.error('Invalid symbol or years')
    path = ROOT / 'data/market-history/cafef' / (symbol + '.json')
    try:
        print(json.dumps(update(symbol, args.exchange, args.years, end, path, args.start,
                                args.retain_request_evidence), ensure_ascii=False))
    except Exception as error:
        print(json.dumps({'status': 'FAILED', 'symbol': symbol, 'errorType': type(error).__name__,
                          'error': str(error), 'outputUnchanged': True}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
