"""Read the exact anonymous financial-list request printed in LPBank's public client."""
import datetime, hashlib, json, pathlib, subprocess

B = pathlib.Path('data/initialization-08b-remediation-work/targeted-indexes')
url = 'https://lpbank.com.vn/api/content-service/public/findAllInvestor'
request = B / 'LPB-current-request.json'
body = B / 'LPB-current-reports.json'
receipt = B / 'LPB-current-reports-receipt.json'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
clients = [B / ('LPB-public-' + name + '.js') for name in ['main', 'runtime', 'investor']]
assert '/public/findAllInvestor' in clients[-1].read_text()
assert 'getListBaoCaoTaiChinh(i)' in clients[-1].read_text()
assert json.loads(request.read_text())['size'] == 4
started = now()
r = subprocess.run(['curl', '--silent', '--show-error', '--cacert', '/etc/ssl/cert.pem',
                    '--max-time', '40', '-H', 'Content-Type: application/json',
                    '--data-binary', '@' + str(request), url, '-o', str(body),
                    '-w', '%{http_code}'], capture_output=True, text=True)
record = {'url': url, 'method': 'POST_PUBLIC_READ_ONLY_LIST', 'startedAt': started,
          'retrievedAt': now(), 'httpStatus': int(r.stdout or '0'), 'curlExit': r.returncode,
          'bodyFile': str(body), 'bodySha256': sha(body), 'bytes': body.stat().st_size,
          'requestFile': str(request), 'requestSha256': sha(request),
          'clientEvidence': [{'file': str(p), 'sha256': sha(p)} for p in clients],
          'historicalPublicationAuthority': False,
          'scope': 'EXACT_2026_FINANCIAL_REPORT_LIST_FOUR_CURRENT_ENTRIES'}
receipt.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
assert r.returncode == 0 and record['httpStatus'] == 200
x = json.loads(body.read_text())
assert x['status'] == '200'
assert any(v['title'] == 'Báo cáo tài chính bán niên 2026 đã được soát xét'
           and v['isActive'] and v['status'] == 'ACTIVE' for v in x['data']['content'])
print(json.dumps({'status': 'CURRENT_PUBLIC_ATTACHMENT_INVENTORY_CAPTURED',
                  'bodySha256': record['bodySha256']}))
