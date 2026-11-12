#!/usr/bin/env python3
"""Vietstock event calendar + retained PDF evidence, not an exhaustive capital register."""
import argparse
import datetime as dt
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import urllib.parse as urlparse
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[3]
HOSTS = {'finance.vietstock.vn', 'static2.vietstock.vn'}
API = 'https://finance.vietstock.vn/data/eventstypedata'


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def safe_url(url):
    p = urlparse.urlsplit(url)
    if p.hostname not in HOSTS or p.username or p.password or p.port not in (None, 80, 443):
        raise ValueError('BLOCKED_SOURCE_POLICY: ' + url)
    return urlparse.urlunsplit(('https', p.hostname, urlparse.quote(urlparse.unquote(p.path), safe='/'), p.query, ''))


class TokenParser(HTMLParser):
    token = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'input' and a.get('name') == '__RequestVerificationToken':
            self.token = a.get('value')


def request(url, temp, form=None):
    original = url
    for _ in range(6):
        url = safe_url(url)
        cmd = ['curl', '--silent', '--show-error', '--max-time', '45', '--retry', '2', '--retry-delay', '1',
               '--retry-max-time', '100', '-b', str(temp / 'cookies'), '-c', str(temp / 'cookies'),
               '-H', 'Referer: https://finance.vietstock.vn/lich-su-kien.htm',
               '-H', 'X-Requested-With: XMLHttpRequest', '-D', str(temp / 'headers'),
               '-o', str(temp / 'body'), '-w', '%{http_code}', url]
        if form is not None:
            # Pass token on stdin, not process command line or persisted evidence.
            cmd.extend(['--data-binary', '@-'])
        r = subprocess.run(cmd, input=urlparse.urlencode(form).encode() if form is not None else None,
                           capture_output=True, timeout=150)
        if r.returncode:
            raise RuntimeError(r.stderr.decode(errors='replace'))
        status = int(r.stdout)
        if status in (301,302,303,307,308):
            locations = [line.split(':',1)[1].strip() for line in (temp / 'headers').read_text().splitlines()
                         if line.lower().startswith('location:')]
            if not locations:
                raise ValueError('Redirect without Location')
            url = urlparse.urljoin(url, locations[-1])
            if status == 303:
                form = None
            continue
        if status != 200:
            raise ValueError('HTTP ' + str(status))
        body = (temp / 'body').read_bytes()
        return body, {'url': original, 'finalUrl': url, 'receivedAt': now(), 'httpStatus': status,
                      'sha256': hashlib.sha256(body).hexdigest()}
    raise ValueError('Too many redirects')


def event_date(value):
    if value is None:
        return None
    match = re.fullmatch(r'/Date\((-?\d+)(?:[+-]\d{4})?\)/', value)
    if not match:
        raise ValueError('Unknown date format: ' + str(value))
    return dt.datetime.fromtimestamp(int(match[1]) / 1000, dt.timezone.utc).astimezone(ZoneInfo('Asia/Ho_Chi_Minh')).date().isoformat()


def normalize(event):
    name = (event.get('Name') or '').strip().casefold()
    kind = {'trả cổ tức bằng tiền mặt':'CASH_DIVIDEND', 'trả cổ tức bằng cổ phiếu':'STOCK_DIVIDEND',
            'thưởng cổ phiếu':'BONUS_SHARES', 'phát hành thêm':'ADDITIONAL_ISSUE'}.get(name, 'OTHER_UNCLASSIFIED')
    amount = re.search(r'([\d,]+)\s*đồng\s*/\s*CP', event.get('Note') or '', re.I)
    return {'eventId':event['EventID'], 'symbol':event['Code'], 'eventType':kind,
            'announcementDate':None, 'exRightsDate':event_date(event.get('GDKHQDate')),
            'recordDate':event_date(event.get('NDKCCDate')), 'paymentOrEffectiveDate':event_date(event.get('Time')),
            'cashDividendVndPerShare':str(int(amount[1].replace(',',''))) if kind == 'CASH_DIVIDEND' and amount else None,
            'stockDividendRatio':None, 'bonusRatio':None, 'rightsRatio':None, 'subscriptionPriceVnd':None,
            'splitFactor':None, 'sharesIssued':None, 'sharesCancelled':None, 'sharesRepurchased':None,
            'fiscalPeriodLabel':event.get('Note'), 'sourceUrl':event.get('FileUrl'),
            'status':'PROVIDER_CANDIDATE_UNVERIFIED'}


def _collect(symbol, start, end, page_size, result):
    if start > end or page_size not in (10,20,50):
        raise ValueError('Invalid dates/page size')
    folder = ROOT / 'data/manual-download' / symbol / f'events-{start}_{end}'
    source = 'https://finance.vietstock.vn/lich-su-kien.htm?' + urlparse.urlencode(
        {'page':1,'from':str(start),'to':str(end),'code':symbol,'tab':1})
    result.update({'schemaVersion':1, 'provider':'VIETSTOCK', 'symbol':symbol, 'sourcePage':source,
              'from':str(start), 'to':str(end), 'filterBasis':'PROVIDER_EVENT_DATE_NOT_ANNOUNCEMENT_DATE',
              'coverage':'TAB1_ONLY_NOT_EXHAUSTIVE_CAPITAL_REGISTER', 'receivedAt':now(),
              'requests':[], 'events':[], 'normalizedEvents':[], 'files':[]})
    with tempfile.TemporaryDirectory(prefix='vietstock-events-') as work:
        temp = Path(work)
        body, receipt = request(source, temp)
        parser = TokenParser(); parser.feed(body.decode('utf-8-sig'))
        if not parser.token:
            raise ValueError('No verification token; login/block/schema change')
        # Do not retain the landing HTML/session token.
        result['landingReceipt'] = receipt
        page, total, seen = 1, None, set()
        while True:
            params = dict(eventTypeID=1,channelID=0,code=symbol,catID='',fDate=str(start),tDate=str(end),
                          page=page,pageSize=page_size,orderBy='Date1',orderDir='DESC')
            body, receipt = request(API, temp, {**params, '__RequestVerificationToken':parser.token})
            result['requests'].append({**receipt,'parameters':params,'rawResponse':body.decode('utf-8')})
            payload = json.loads(body.decode('utf-8-sig'))
            if not isinstance(payload,list) or len(payload)!=2 or not isinstance(payload[0],list):
                raise ValueError('Invalid API schema')
            count = payload[1][0]
            if isinstance(count,bool) or not isinstance(count,int) or count<0:
                raise ValueError('Invalid event total')
            if total is None:
                total = count
            if count != total or len(payload[0]) != min(page_size,max(0,total-(page-1)*page_size)):
                raise ValueError('Event pagination incomplete/changed')
            for event in payload[0]:
                if event['Code'] != symbol or event['EventID'] in seen:
                    raise ValueError('Wrong symbol or duplicate EventID')
                normalized = normalize(event)
                if normalized['exRightsDate'] is not None and not str(start) <= normalized['exRightsDate'] <= str(end):
                    raise ValueError('Ex-rights date outside requested range')
                seen.add(event['EventID'])
                result['events'].append(event);result['normalizedEvents'].append(normalized)
            if page*page_size>=total:
                break
            page+=1
        if len(seen)!=total:
            raise ValueError('Total event count mismatch')
        result['totalCount']=total
        # Reuse retained documents by their exact URL and hash-bound manifest receipt.
        retained = {}
        for manifest in (ROOT/'data/manual-download'/symbol).rglob('*.json'):
            try:
                for f in json.loads(manifest.read_text()).get('files',[]):
                    if f.get('url') and f.get('path') and f.get('sha256'):
                        retained[safe_url(f['url'])] = f
            except (ValueError,TypeError,KeyError):
                continue
        urls = sorted({e['FileUrl'] for e in result['events'] if e.get('FileUrl')})
        folder.mkdir(parents=True,exist_ok=True)
        for url in urls:
            f={'url':url,'eventIds':[e['EventID'] for e in result['events'] if e.get('FileUrl')==url]}
            try:
                safe = safe_url(url); old = retained.get(safe)
                if old and (ROOT/old['path']).exists() and hashlib.sha256((ROOT/old['path']).read_bytes()).hexdigest()==old['sha256']:
                    body=(ROOT/old['path']).read_bytes();f.update(path=old['path'],sha256=old['sha256'],bytes=len(body),
                        status='REUSED',originalReceipt=old,reuseVerifiedAt=now())
                else:
                    body, receipt=request(url,temp)
                    if not body.startswith(b'%PDF-'):
                        raise ValueError('Response is not PDF')
                    name=Path(urlparse.unquote(urlparse.urlsplit(safe).path)).name
                    if not name.lower().endswith('.pdf'):
                        name=receipt['sha256'][:16]+'.pdf'
                    dest=folder/name
                    if dest.exists() and dest.read_bytes()!=body:
                        dest=folder/(dest.stem+'-'+receipt['sha256'][:16]+'.pdf')
                    if not dest.exists(): dest.write_bytes(body)
                    f.update(receipt,path=str(dest.relative_to(ROOT)),bytes=len(body),status='DOWNLOADED')
            except Exception as error:
                f.update(status='BLOCKED_SOURCE_POLICY' if 'BLOCKED_SOURCE_POLICY' in str(error) else 'FAILED',error=str(error))
            result['files'].append(f)
        result['noAttachmentEventIds']=[e['EventID'] for e in result['events'] if not e.get('FileUrl')]
    manifest=folder/('manifest-'+dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')+'.json')
    manifest.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    return result,manifest


def collect(symbol, start, end, page_size=20):
    partial = {}
    try:
        return _collect(symbol, start, end, page_size, partial)
    except Exception as error:
        if partial:
            folder = ROOT / 'data/manual-download' / symbol / f'events-{start}_{end}'
            folder.mkdir(parents=True, exist_ok=True)
            path = folder / ('manifest-failed-' + dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '.json')
            partial.update(status='FAILED', errorType=type(error).__name__, error=str(error), coverageComplete=False)
            path.write_text(json.dumps(partial, ensure_ascii=False, indent=2) + '\n')
            raise ValueError(str(error) + '; failure evidence: ' + str(path)) from error
        raise


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--symbol',required=True);p.add_argument('--start',type=dt.date.fromisoformat,required=True)
    p.add_argument('--end',type=dt.date.fromisoformat,required=True)
    p.add_argument('--page-size',type=int,choices=[10,20,50],default=20)
    a=p.parse_args();symbol=a.symbol.upper()
    if not re.fullmatch(r'[A-Z0-9]{1,20}',symbol):p.error('Invalid symbol')
    try:
        result,path=collect(symbol,a.start,a.end,a.page_size)
        failures=[f for f in result['files'] if f['status'] in ('FAILED','BLOCKED_SOURCE_POLICY')]
        print(json.dumps({'status':'PARTIAL' if failures else 'SUCCESS','events':result['totalCount'],
                          'pages':len(result['requests']),'files':len(result['files']),'failedFiles':len(failures),'manifest':str(path)}))
        if failures:sys.exit(2)
    except Exception as error:
        print(json.dumps({'status':'FAILED','errorType':type(error).__name__,'error':str(error)}),file=sys.stderr)
        sys.exit(1)


if __name__=='__main__':main()
