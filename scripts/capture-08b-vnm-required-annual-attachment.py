"""Retain exact public issuer surfaces; no recursion, authentication or account state."""
import datetime, hashlib, json, pathlib, re, subprocess, urllib.parse

B = pathlib.Path('data/initialization-08b-remediation-work/targeted-indexes')
ROUTES = [
 ('VNM-required-twenty-four-secondary-attachment','https://www.phs.vn/tin-tuc/vnm-bctc-hop-nhat-nam-2024/6246484'),
 ('VNM-required-twenty-five-secondary-attachment','https://www.phs.vn/tin-tuc/vnm-bctc-hop-nhat-nam-2025/6372238'),
 ('VNM-required-twenty-five-issuer-index','https://www.vinamilk.com.vn/investor/reports/financial?year=2025'),
 ('VNM-required-twenty-three-bsc-index','https://www.bsc.com.vn/en/tin-tuc/tin-tuc-ma-co-phieu/1073811-vnm-information-on-the-audited-financial-statements-in-2023/'),
 ('VNM-required-twenty-three-bsc-attachment','https://www.bsc.com.vn/en/News/NewsAttachedFile/1073811'),
]

def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

for name, url in ROUTES:
    if not re.fullmatch(r'[A-Z]{3}-[a-z0-9-]+', name) or urllib.parse.urlsplit(url).scheme != 'https':
        raise ValueError('EXACT_PUBLIC_ROUTE_REQUIRED')
    receipt, body = B / (name + '.json'), B / (name + '.body')
    if receipt.exists():
        prior = json.loads(receipt.read_text())
        retained = body.read_bytes() if body.exists() else b''
        if not body.exists() and (prior['status'] != 'PUBLIC_INDEX_FETCH_EXCEPTION' or prior['bytes'] != 0):
            raise ValueError('RETAINED_PUBLIC_RESPONSE_MISSING')
        if prior['url'] != url or hashlib.sha256(retained).hexdigest() != prior['bodySha256']:
            raise ValueError('RETAINED_PUBLIC_SURFACE_CHANGED')
        continue
    started = now()
    result = subprocess.run(['curl', '--location', '--silent', '--show-error', '--max-time', '40',
                             '--max-filesize', '8000000', '--output', str(body), '--write-out', '%{http_code}', url],
                            capture_output=True, timeout=45)
    raw = body.read_bytes() if body.exists() else b''
    status = int(result.stdout.decode() or '0')
    packet = {'ticker': name[:3], 'url': url, 'startedAt': started, 'retrievedAt': now(),
              'httpStatus': status, 'curlExit': result.returncode,
              'bodySha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw),
              'status': 'TARGETED_PUBLIC_INDEX_CAPTURED' if result.returncode == 0 and 200 <= status < 300 else 'PUBLIC_INDEX_FETCH_EXCEPTION',
              'doesNotProveExhaustiveAvailability': True}
    with receipt.open('x') as out:
        out.write(json.dumps(packet, indent=2) + '\n')
    print(json.dumps({'surface': name, 'status': packet['status']}))
