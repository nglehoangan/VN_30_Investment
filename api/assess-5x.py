"""Deterministic offline assessment; no network, credentials, promotion or DB writes."""
import argparse, hashlib, json
from decimal import Decimal
from pathlib import Path


def sha(b):
    return hashlib.sha256(b).hexdigest()


def source_path(file):
    try:
        return str(file.relative_to(Path.cwd()))
    except ValueError:
        return str(file)


def read_capture(folder):
    folder = Path(folder).resolve()
    manifest_bytes = (folder / 'manifest.json').read_bytes()
    manifest = json.loads(manifest_bytes)
    rows, data = [], {}
    for r in manifest['requests']:
        if not r.get('rawPath'):
            continue
        name = r['rawPath']
        f = (folder / name).resolve()
        assert f.parent == folder, 'RAW_PATH_ESCAPE'
        raw = f.read_bytes()
        assert sha(raw) == r['sha256'], 'RAW_HASH_MISMATCH:' + r['apiId']
        payload = raw.split(b'|', 2)[2] if r['apiId'] == '5.2' else raw
        if r['apiId'] == '5.2':
            assert raw.startswith(b's|38|')
        data[r['apiId']] = json.loads(payload, parse_float=Decimal, parse_int=Decimal)
        rows.append({'apiId': r['apiId'], 'path': source_path(f), 'sha256': sha(raw), 'bytes': len(raw), 'rehash': 'PASS', 'retrievedAt': r['retrievedAt'], 'httpStatus': r.get('httpStatus'), 'transport': r['method']})
    return {'manifest': source_path(folder / 'manifest.json'), 'manifestSHA256': sha(manifest_bytes), 'sources': rows}, data


def main(original, additional, output):
    original_manifest, base = read_capture(original)
    additional_manifest, extra = read_capture(additional)
    assert set(base) == {'5.1', '5.2', '5.5'}
    assert set(extra) == {'5.1', '5.3', '5.4', '5.6', '5.7', '5.8', '5.11', '5.12', '5.13'}
    release_path = Path('docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json')
    release_bytes = release_path.read_bytes()
    release = json.loads(release_bytes)
    certified = {m['ticker'] for m in release['partition']['members']}
    provider = {m['symbol'] for m in extra['5.3']['data']}
    assert len(provider) == 30 and provider == certified
    identity = extra['5.11']['content']
    assert len(identity) == 1 and identity[0]['symbol'] == 'TCB'
    identity = identity[0]
    assert identity['tradePlace'] == '001' and identity['secType'] == '001' and identity['halt'] == 'N'
    security = next(m['securityId'] for m in release['partition']['members'] if m['ticker'] == 'TCB')
    quote = extra['5.1']['data'][0]
    assert quote['symbol'] == 'TCB'
    prices = [quote['matchPrice'], Decimal(base['5.2']['data'][0]['matchPrice']), base['5.5']['data'][0]['p'], extra['5.13']['data'][-1]['close']]
    assert len(set(prices)) == 1
    day = extra['5.1']['tradingDate']
    assert day == extra['5.3']['tradingDate'] == base['5.2']['tradingDate'] == base['5.1']['tradingDate']
    entries = [
        ('5.1','market-symbol','GET','Price snapshot','Symbol, matched/bid/offer/reference prices, OHLC and tradingDate','CORE_CANDIDATE','Raw LAST/reference quote; full intraday timestamp not supplied on each row'),
        ('5.2','ws-price-board','WSS','Market board','Orderbook, raw matched price, one-shot snapshot/channel38','OPTIONAL_REALTIME','Keep pipe protocol and data-frame bytes; distinguish capture time from exchange event time'),
        ('5.3','foreign-room','GET','Basket snapshot/foreign room','VN30 prices, volumes, foreign flows and tradingDate','SUPPLEMENTAL','Provider basket matches retained30 in this sample; not an independent historical universe authority'),
        ('5.4','put-through','GET','Negotiated trades','Separate negotiated prices and volume','SUPPLEMENTAL','Not a replacement for normal matched/official close price'),
        ('5.5','price-history','GET','Intraday executions','Match price, volume, exchange receipt time; paginated','TRACE_CANDIDATE','Only intraday history; day/month lacks year; retain equal occurrences without inventing trade IDs'),
        ('5.6','supply-demand-intraday','GET','Intraday supply/demand','Buy/sell-active volumes and ratios with time fields','OPTIONAL_SEPARATE_ANALYSIS','Observed s is epoch-seconds, unlike the millisecond-sized documentation example; parser version needs explicit unit handling'),
        ('5.7','supply-demand-daily','GET','Daily supply/demand','Provider buy/sell-active series','OPTIONAL_SEPARATE_ANALYSIS','Actual sample is empty for20/10 before open; do not fill zero or substitute prior day'),
        ('5.8','supply-demand-monthly','GET','Monthly-window supply/demand','Historical active-buy/sell ratios','OPTIONAL_SEPARATE_ANALYSIS','Observed date labels DD/MM lack year; investor-size groups are provider classifications'),
        ('5.9','ws-order-matching','WSS','PRIVATE account order updates','STOCK_ORDER state updates for the authenticated account','EXCLUDE_FROM_MARKET_SOURCE','Detailed official page describes account orders, despite generic sidebar matching title; not called'),
        ('5.10','ws-history','WSS','Market minute stream','C001 price/timeSec, C002 supply/demand and flow','OPTIONAL_REALTIME','Documentation reviewed only; not live qualified; one-minute closePrice is not daily official close'),
        ('5.11','securities-info','GET','Security reference','codeId, issuerId, ISIN in live payload, tradePlace, type/status/halt and tradeLot','CORE_IDENTITY_CANDIDATE','Live issuerName is blank; txDate is2016, not observation date; tradeUnit1000 is not proof to multiply quote values'),
        ('5.12','bars','GET','Intraday OHLCV','Five sampled hourly candles, UTC tradingDate','OPTIONAL_SERIES_CANDIDATE','Unfinished bars and adjustment basis require purpose-specific validation'),
        ('5.13','bars-long-term','GET','Daily/weekly/monthly OHLCV','Five sampled daily candles with UTC date and close','CORE_EOD_CANDIDATE','Adjustment/revision policy not explicit in reviewed endpoint schema; latest close matching does not prove historical adjustment semantics'),
    ]
    matrix = []
    all_data = dict(base)
    all_data.update(extra)
    for id, slug, method, title, fields, role, caveat in entries:
        d = all_data.get(id)
        if d is None:
            count = None
        elif id == '5.11':
            count = len(d['content'])
        elif id == '5.4':
            count = len(d.get('match', []))
        else:
            count = len(d.get('data', []))
        matrix.append({'apiId': id, 'documentation': 'https://developers.tcbs.com.vn/docs/v1.0.0/stock/' + slug + '/', 'transport': method, 'purpose': title, 'fields': fields, 'role': role, 'liveStatus': 'CAPTURED_REHASH_PASS' if d is not None else 'NOT_CALLED_PRIVATE_ACCOUNT' if id == '5.9' else 'DOCUMENTATION_ONLY', 'sampleRows': count, 'caveat': caveat})
    daily_volume = extra['5.13']['data'][-1]['volume']
    snapshot_volume = quote['totalVol']
    facts = {
        'status':'SOURCE_SUFFICIENCY_REVIEW_NOT_ADMISSION','reviewDate':'2026-10-20','all13Documented':True,'liveUniqueEndpointCount':11,
        'sourceCaptures':[original_manifest,additional_manifest],
        'certifiedUniverse':{'path':str(release_path),'sha256':sha(release_bytes),'providerCount':30,'retainedCount':30,'match':'EXACT_SET_MATCH','providerCannotOverwriteUniverse':True},
        'identity':{'symbol':'TCB','localSecurityId':security,'codeId':identity['codeId'],'issuerId':identity['issuerId'],'isinCode':identity.get('isinCode'),'tradePlace':identity['tradePlace'],'venueByOfficialCode':'HOSE','secType':identity['secType'],'status':identity['status'],'halt':identity['halt'],'pointers':['/content/0/codeId','/content/0/isinCode','/content/0/tradePlace'],'qualification':'CURRENT_SAMPLE_MATCH; not a complete history of ticker/venue changes'},
        'price':{'providerDate':day,'matchPrice':str(prices[0]),'dailyClose':str(prices[-1]),'comparison':'MATCH across5.1/5.2/5.5/latest5.13 daily close','rawHistoricalSeriesAdjustment':'UNCONFIRMED','scope':'Raw board/execution quote semantics can be qualified separately from adjusted historical series'},
        'volume':{'snapshotTotal':str(snapshot_volume),'dailyCandleTotal':str(daily_volume),'difference':str(daily_volume-snapshot_volume),'status':'UNRESOLVED_SCOPE_OR_REVISION_DIFFERENCE','impact':'Volume/liquidity-dependent calculations need reconciliation; do not globally block a matching price-only use case','cause':'NOT_PROVEN; no assumption about odd lots/negotiated volume'},
        'unit':{'quoteScale':'Consistent between sampled endpoints; no automatic conversion','tradeUnit':str(identity['securitiesInfo']['tradeUnit']),'warning':'tradeUnit1000 must not be blindly multiplied into matchPrice; explicit source unit contract still needed'},
        'fundamentalIsolation':'5.11 pe/eps/divyeild and similar fields do not authorize overwriting approved PDF accounting facts',
        'freshness':{'providerTradingDateAvailable':True,'UTCBarTimestampAvailable':True,'sourceReceptionVsTradingTimeDistinct':True,'calendarAndPurposePolicy':'APPLICATION_RESPONSIBILITY_NOT_AN_API_DATA_FIELD','empty5_7':'data=[]; d20/10; not zero; other feeds retain19/10 data'},
        'verdict':{'currentPriceAndIdentity':'SUFFICIENT_SOURCE_FIELDS_CANDIDATE','endOfDayClose':'AVAILABLE_VIA5.13; qualify finalized daily bar and source basis','historicalAdjustedReturns':'NOT_YET_PROVEN','fullPITBacktest':'NOT_PROVEN; current endpoints do not establish historical publication/revision/corporate-action knowledge','realSourceMissing':'Earlier missing-sample condition is now satisfied for retained bounded corpus; historical blockers not rewritten','remainingForRuntime':'Versioned adapter/schema/unit contract, reference binding, approved calendar/session/freshness and independent review','minimumEndpointPlan':['5.1 current reported quote/date','5.11 security identity/venue','5.13 finalized daily bar if EOD close is required'],'optional':['5.2 realtime','5.5 execution trace','5.3 basket comparison'],'notRequiredForBasicPriceCapability':['5.4','5.6','5.7','5.8','5.9','5.10','5.12']},
        'readyForScoring':False,'decisionReady':False,'productionStateChanged':False,'runtimeSnapshotCreated':False,
    }
    output = Path(output)
    output.mkdir(parents=True,exist_ok=True)
    def save(name, obj):
        content = json.dumps(obj,ensure_ascii=False,indent=2)+'\n'
        f = output/name
        if f.exists():
            assert f.read_text()==content,'IMMUTABLE_REVIEW_CONTENT_DIFFERS:'+name
        else:
            f.write_text(content)
    save('API_MATRIX.json',matrix)
    save('SOURCE_SUFFICIENCY.json',facts)
    lines=['# TCBS5.x — source assessment,2026-10-20','', 'Documentation reviewed for13 endpoints;11 unique endpoints have retained real raw samples. 5.9 is private account orders and was not called;5.10 is documentation-only. No production readiness or accounting changed.','', '| API | Role | Live status | Rows | Caveat |','|---|---|---|---|---|']
    for row in matrix:
        lines.append(f"| [{row['apiId']}]({row['documentation']}) | {row['purpose']} | {row['liveStatus']} | {row['sampleRows']} | {row['caveat']} |")
    lines.extend(['','Current price and identity have enough source fields to build a narrowly scoped adapter candidate:5.1 plus5.11; use5.13 for a finalized daily-candle close. 5.2/5.5 are optional corroborating views of the same provider. Historical corporate-action factors are not a prerequisite for reading raw current quotes; do not claim adjusted historical return/backtest support from this sample.','',f"Actual TCB identity: ISIN {identity.get('isinCode')}, codeId {identity['codeId']}, venue001=HOSE, local securityId {security}. Provider VN30 set matches all30 retained identities in this capture, without replacing the certified universe.",'',f"Latest match/daily close: {prices[0]}, trading date {day}. Volume differs: snapshot {snapshot_volume} versus daily bar {daily_volume} (delta {daily_volume-snapshot_volume}); preserve both populations. Source cause remains unknown. 5.7 returned an empty current-day series; no zero fill.",'','Remaining work is primarily adapter/contract qualification and application policy, not a blanket absence of market data. Endpoint docs do not by themselves define executable freshness deadlines, exchange holidays or historical PIT publication knowledge. tradeUnit1000 is not a license to multiply a33250 quote. Blank issuer name, old txDate, placeholder-like fundamentals and unknown historical adjustment rules stay explicit.','', 'Raw data stays in the two private data/market-source capture directories. SHA256 paths and exact selected JSON pointers are in SOURCE_SUFFICIENCY.json. Historical source reviews and gates remain unchanged.'])
    text='\n'.join(lines)+'\n'; f=output/'README.md'
    if f.exists(): assert f.read_text()==text
    else: f.write_text(text)
    ledger={'algorithm':'SHA256','files':{f.name:sha(f.read_bytes()) for f in output.iterdir() if f.is_file() and f.name!='ARTIFACT_HASHES.json'},'rawSources':[s for capture in [original_manifest,additional_manifest] for s in capture['sources']]}
    save('ARTIFACT_HASHES.json',ledger)
    print(json.dumps({'status':'PASS_SOURCE_REVIEW','documented':13,'liveUnique':11,'identity':identity.get('isinCode'),'price':str(prices[0]),'volumeDifference':str(daily_volume-snapshot_volume),'readinessChanged':False}))


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('original_capture')
    parser.add_argument('additional_capture')
    parser.add_argument('output')
    a=parser.parse_args()
    main(a.original_capture,a.additional_capture,a.output)
