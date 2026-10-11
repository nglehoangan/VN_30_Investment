"""Exact anonymous document-list requests observed in the public provider client.

No login, CAPTCHA, account session, export service or restricted financial API.
The cookie jar belongs only to this new anonymous HTTP client and is never saved.
"""
import datetime, hashlib, html.parser, http.cookiejar, json, pathlib, ssl, urllib.error, urllib.parse, urllib.request

B = pathlib.Path('data/initialization-08b-remediation-work/targeted-indexes')
class TokenParser(html.parser.HTMLParser):
    token = None
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == 'input' and values.get('name') == '__RequestVerificationToken':
            self.token = values.get('value')

def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

for ticker in ['LPB', 'TCX']:
    client = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ssl.create_default_context(cafile='/etc/ssl/cert.pem')), urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    page = 'https://finance.vietstock.vn/' + ticker.lower() + '/tai-tai-lieu.htm?doctype=1'
    start = now()
    denied = B / (ticker + '-provider-anonymous-access-exception.json')
    if denied.exists():
        continue
    try:
        with client.open(page, timeout=40) as response:
            raw = response.read(8000001)
            if len(raw) > 8000000:
                raise ValueError('PUBLIC_PAGE_LIMIT')
    except urllib.error.HTTPError as error:
        body = error.read(8000000)
        packet = {'ticker': ticker, 'url': page, 'startedAt': start, 'recordedAt': now(),
                  'httpStatus': error.code, 'status': 'PUBLIC_ANONYMOUS_ACCESS_EXCEPTION',
                  'responseSha256': hashlib.sha256(body).hexdigest(),
                  'action': 'STOP_NO_LOGIN_CHALLENGE_OR_ACCESS_CONTROL_BYPASS'}
        with denied.open('x') as out:
            out.write(json.dumps(packet, indent=2) + '\n')
        with (B / (ticker + '-provider-anonymous-access-exception.body')).open('xb') as out:
            out.write(body)
        print(json.dumps({'ticker': ticker, 'httpStatus': error.code, 'status': packet['status']}))
        continue
    parser = TokenParser(); parser.feed(raw.decode('utf8'))
    if not parser.token:
        raise ValueError('PUBLIC_CLIENT_TOKEN_UNAVAILABLE')
    for year in [2026, 2025]:
        name = ticker + '-provider-documents-' + str(year)
        if (B / (name + '.json')).exists():
            continue
        url = 'https://finance.vietstock.vn/data/getdocument'
        fields = {'code': ticker, 'page': 1, 'year': year, 'type': 1, '__RequestVerificationToken': parser.token}
        request = urllib.request.Request(url, urllib.parse.urlencode(fields).encode(),
            headers={'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest', 'Referer': page})
        requested_at = now()
        try:
            with client.open(request, timeout=40) as response:
                status = response.status; body = response.read(8000001)
        except urllib.error.HTTPError as error:
            status = error.code; body = error.read(8000001)
        if len(body) > 8000000:
            raise ValueError('PUBLIC_RESPONSE_LIMIT')
        body_file = B / (name + '.body')
        with body_file.open('xb') as out:
            out.write(body)
        receipt = {'ticker': ticker, 'url': url, 'method': 'POST_READ_ONLY_DOCUMENT_LIST',
            'anonymousEntryUrl': page, 'anonymousEntrySha256': hashlib.sha256(raw).hexdigest(),
            'clientContractFile': str(B / 'TCX-provider-document-client.body'),
            'clientContractSha256': hashlib.sha256((B / 'TCX-provider-document-client.body').read_bytes()).hexdigest(),
            'query': {'code': ticker, 'page': 1, 'year': year, 'type': 1},
            'startedAt': requested_at, 'retrievedAt': now(), 'httpStatus': status,
            'bodyFile': str(body_file), 'bodySha256': hashlib.sha256(body).hexdigest(),
            'bytes': len(body), 'scope': 'ANONYMOUS_PUBLIC_DOCUMENT_INDEX_ONLY'}
        with (B / (name + '.json')).open('x') as out:
            out.write(json.dumps(receipt, indent=2) + '\n')
        print(json.dumps({'ticker': ticker, 'year': year, 'httpStatus': status, 'bytes': len(body)}))
        if status in [401, 403]:
            break
