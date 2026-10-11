"""Finite public input evidence; analyst assumptions remain ESTIMATE, never FACT."""
import concurrent.futures, datetime, hashlib, json, pathlib, subprocess

B = pathlib.Path('data/initialization-08b-remediation-work/input-sources')
B.mkdir(exist_ok=True)
ROUTES = [
    ('ACB-issuer-ir-documents-current-year', 'ISSUER_PUBLIC_DISCLOSURE',
     'https://acb.com.vn/en/investors/2026-ir-documents'),
    ('ACB-issuer-investor-meetings', 'ISSUER_PUBLIC_DISCLOSURE',
     'https://acb.com.vn/en/investors'),
    ('FPT-vietcap-june-update', 'ESTABLISHED_ANALYST_PUBLIC_SUMMARY',
     'https://www.vietcap.com.vn/en/research-center/fpt-buy-23-5-compelling-valuation-ai-concerns-largely-priced-in-update'),
    ('FPT-vietcap-august-meeting', 'ESTABLISHED_ANALYST_PUBLIC_SUMMARY',
     'https://www.vietcap.com.vn/trung-tam-phan-tich/fpt-nhat-ban-chau-au-dan-dat-da-phuc-hoi-cua-doanh-thu-ky-moi-mang-cntt-nuoc-ngoai-tiem-nang-thiet-lap-quan-he-hop-tac-cong-nghe-moi-nham-cung-co-nang-luc-ai-bao-cao-gap-go-ndt'),
    ('ACB-issuer-half-year-results', 'ISSUER_PUBLIC_DISCLOSURE',
     'https://acb.com.vn/ve-chung-toi/kqkd-6-thang-2026-acb-dat-loi-nhuan-hon-10700-ty-dong-ban-le-va-sme-hoi-phuc-tich-cuc'),
    ('VIB-issuer-half-year-results', 'ISSUER_PUBLIC_DISCLOSURE',
     'https://www.vib.com.vn/en/goc-bao-chi/pit-reaches-over-vnd-5180-billion-total-assets-surpass-vnd-580-trillion-in-h1-2026'),
]

def capture(route):
    name, authority, url = route
    receipt, body = B / (name + '.json'), B / (name + '.html')
    if receipt.exists():
        prior = json.loads(receipt.read_text())
        if prior['url'] != url or hashlib.sha256(body.read_bytes()).hexdigest() != prior['bodySha256']:
            raise ValueError('RETAINED_INPUT_SOURCE_CHANGED')
        return {'source': name, 'status': prior['status'], 'reused': True}
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    result = subprocess.run([
        'curl', '--location', '--silent', '--show-error', '--max-time', '40',
        '--max-filesize', '8000000', '--output', str(body), '--write-out', '%{http_code}', url,
    ], capture_output=True, timeout=45)
    raw = body.read_bytes() if body.exists() else b''
    status = int(result.stdout.decode() or '0')
    packet = {
        'ticker': name[:3], 'url': url, 'sourceAuthority': authority,
        'startedAt': started, 'retrievedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'httpStatus': status, 'curlExit': result.returncode,
        'bodySha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw),
        'status': 'RETAINED_PUBLIC_INPUT_SOURCE' if result.returncode == 0 and 200 <= status < 300 else 'PUBLIC_INPUT_SOURCE_EXCEPTION',
        'historicalKnowledgeBoundaryAsserted': False,
        'completeModelOrEntitlementAsserted': False,
    }
    with receipt.open('x') as out:
        out.write(json.dumps(packet, indent=2) + '\n')
    return {'source': name, 'status': packet['status']}

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(capture, ROUTES):
            print(json.dumps(result), flush=True)
