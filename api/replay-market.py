"""Offline review of bounded TCBS captures. No API, credentials, DB writes or admission."""
import argparse, hashlib, json, re
from decimal import Decimal
from pathlib import Path
from datetime import datetime


def sha(b):
    return hashlib.sha256(b).hexdigest()


def parse(b):
    return json.loads(b, parse_float=Decimal, parse_int=Decimal)


def readable(v):
    if isinstance(v, Decimal):
        if not v.is_finite():
            raise ValueError('NONFINITE_NUMBER')
        return format(v, 'f')
    if isinstance(v, dict):
        return {k: readable(x) for k, x in v.items()}
    if isinstance(v, list):
        return [readable(x) for x in v]
    return v


def check(ok, reason):
    if not ok:
        raise ValueError(reason)


def replay(folder):
    folder = Path(folder).resolve()
    manifest_bytes = (folder / 'manifest.json').read_bytes()
    manifest = json.loads(manifest_bytes)
    check(manifest.get('version') == 'tcbs-market-capture-v1', 'UNKNOWN_CAPTURE_VERSION')
    check(manifest.get('state') == 'CAPTURED_NOT_QUALIFIED', 'INCOMPLETE_CAPTURE')
    ticker = manifest['ticker']
    check(re.fullmatch('[A-Z]{3}', ticker), 'INVALID_TICKER')
    sources, payloads = [], {}
    requests = manifest['requests']
    check(len(requests) == 3 and {r['apiId'] for r in requests} == {'5.1', '5.2', '5.5'}, 'EXACT_SOURCE_SET_REQUIRED')
    for row in requests:
        api = row['apiId']
        expected = {'5.1': '5.1.raw.json', '5.2': '5.2.raw.txt', '5.5': '5.5.raw.json'}[api]
        check(row['rawPath'] == expected, 'UNEXPECTED_RAW_PATH')
        file = (folder / expected).resolve()
        check(file.parent == folder, 'RAW_PATH_ESCAPE')
        raw = file.read_bytes()
        check(sha(raw) == row['sha256'], 'RAW_HASH_MISMATCH:' + api)
        if api == '5.2':
            check(row['method'] == 'WSS_ONE_SHOT' and row['request'] == 'd|r|tk||' + ticker and row['url'] == 'wss://openapi.tcbs.com.vn/ws/thesis/v1/stream/normal', 'UNEXPECTED_WSS_REQUEST')
            check(raw.startswith(b's|38|'), 'EXPECTED_MARKET_SNAPSHOT_CHANNEL_38')
            payloads[api] = parse(raw.split(b'|', 2)[2])
        else:
            expected_url = {'5.1': 'https://openapi.tcbs.com.vn/tartarus/v1/tickerCommons', '5.5': f'https://openapi.tcbs.com.vn/nyx/v1/intraday/{ticker}/his/paging'}[api]
            check(row['httpStatus'] == 200 and row['method'] == 'GET' and row['url'] == expected_url, 'UNEXPECTED_REST_RESPONSE')
            check(row['parameters'] == ({'tickers': ticker} if api == '5.1' else {'page': '0', 'size': '20'}), 'UNEXPECTED_REQUEST_PARAMETERS')
            payloads[api] = parse(raw)
        started = datetime.fromisoformat(row['startedAt'].replace('Z', '+00:00'))
        received = datetime.fromisoformat(row['retrievedAt'].replace('Z', '+00:00'))
        check(started <= received, 'INVALID_CAPTURE_TIME')
        sources.append({'apiId': api, 'rawPath': expected, 'sha256': row['sha256'], 'retrievedAt': row['retrievedAt'], 'providerHttpDate': row.get('providerDate'), 'rehash': 'PASS'})
    dates = [payloads[api].get('tradingDate') for api in ['5.1', '5.2']]
    check(dates[0] == dates[1] and isinstance(dates[0], str), 'TRADING_DATE_CONFLICT')
    date = datetime.strptime(dates[0], '%d/%m/%Y').date()
    history = payloads['5.5']
    check(history['ticker'] == ticker and history['d'] == date.strftime('%d/%m'), 'HISTORY_DAY_OR_TICKER_CONFLICT')
    check(len(history['data']) == history['numberOfItems'] and len(history['data']) <= 20, 'HISTORY_COUNT_CONFLICT')
    rows, prices = [], []
    for api in ['5.1', '5.2']:
        data = payloads[api]['data']
        check(len(data) == 1 and data[0]['symbol'] == ticker, 'SECURITY_IDENTITY_AMBIGUOUS')
        price = Decimal(str(data[0]['matchPrice']))
        check(price.is_finite() and price > 0, 'INVALID_MATCH_PRICE')
        prices.append(price)
        rows.append({'apiId': api, 'ticker': ticker, 'providerTradingDate': date.isoformat(), 'pointer': '/data/0/matchPrice', 'pointerRoot': 'JSON payload after s|38| prefix' if api == '5.2' else 'raw JSON', 'value': format(price, 'f'), 'meaning': 'MATCH_PRICE', 'currency': 'UNCONFIRMED', 'unit': 'UNCONFIRMED', 'adjustment': 'UNCONFIRMED', 'fields': readable(data[0])})
    ticks = []
    for i, tick in enumerate(history['data']):
        price = Decimal(str(tick['p']))
        check(price.is_finite() and price > 0, 'INVALID_HISTORY_PRICE')
        datetime.strptime(tick['t'], '%H:%M:%S')
        ticks.append({'occurrenceId': f'5.5:data:{i}', 'pointer': f'/data/{i}', 'providerReceiptTime': tick['t'], 'providerDayMonth': history['d'], 'candidateTradingDate': date.isoformat(), 'dateBasis': 'Cross-response date binding to independently date-bearing5.1 and5.2 in this capture;5.5 has no year', 'fields': readable(tick)})
    check(ticks, 'EMPTY_HISTORY')
    prices.append(Decimal(str(history['data'][0]['p'])))
    check(len(set(prices)) == 1, 'CROSS_ENDPOINT_PRICE_CONFLICT')
    duplicate_count = len(ticks) - len({json.dumps(readable(t), sort_keys=True) for t in history['data']})
    result = {'version': 'tcbs-market-offline-review-v1', 'status': 'RAW_REHASH_AND_EXTRACTION_REPLAY_PASS', 'manifestSHA256': sha(manifest_bytes), 'ticker': ticker, 'sources': sources, 'providerTradingDate': date.isoformat(), 'sameProviderCrossEndpointPrice': format(prices[0], 'f'), 'comparison': 'MATCH for5.1 matchPrice,5.2 matchPrice and first5.5 p; not independent provider corroboration or proof of official closing price', 'quotes': rows, 'history': {'totalReported': readable(history['total']), 'capturedRows': len(ticks), 'capturedPage': readable(history['page']), 'headIndex': readable(history['headIndex']), 'identicalContentOccurrencesBeyondFirst': duplicate_count, 'deduplication': 'NONE; no unique trade ID, equal rows may be distinct executions; no volume aggregation certified', 'rows': ticks}, 'capability': 'NOT_QUALIFIED', 'marketCurrent': 'NOT_EVALUATED', 'analysisReady': False, 'decisionReady': False, 'remaining': ['Approve source/schema/parser and scope from real corpus', 'Verify currency and quote units explicitly; no inferred scaling', 'Verify raw/unadjusted semantics and corporate-action handling', 'Bind durable security/venue identity from approved reference', 'Approve calendar/session/freshness policy; retrieval date is not trading date', 'Run qualified adapter positive/negative replay and independent review'], 'databaseWritten': False, 'runtimeSnapshotsCreated': False}
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture_folder')
    args = parser.parse_args()
    try:
        result = replay(args.capture_folder)
        # Separate derived output; never edit source manifest/raw.
        content = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
        check(content == json.dumps(replay(args.capture_folder), ensure_ascii=False, indent=2) + '\n', 'NONDETERMINISTIC_REPLAY')
        output = Path(args.capture_folder) / 'review-v1'
        output.mkdir(mode=0o700, exist_ok=True)
        dest = output / 'extracted-review.json'
        if dest.exists():
            check(dest.read_text() == content, 'REVIEW_ALREADY_EXISTS_WITH_DIFFERENT_CONTENT')
        else:
            with dest.open('x') as f:
                dest.chmod(0o600)
                f.write(content)
        print(json.dumps({'status': result['status'], 'ticker': result['ticker'], 'tradingDate': result['providerTradingDate'], 'priceRawUnits': result['sameProviderCrossEndpointPrice'], 'historyRows': result['history']['capturedRows'], 'capability': result['capability'], 'output': str(dest)}, ensure_ascii=False))
    except (ValueError, KeyError, TypeError, OSError) as error:
        raise SystemExit('BLOCKED: ' + str(error))
