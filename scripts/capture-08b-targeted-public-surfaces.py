"""Retain exact public issuer surfaces; no recursion, authentication or account state."""
import datetime, hashlib, json, pathlib, re, subprocess, urllib.parse

B = pathlib.Path('data/initialization-08b-remediation-work/targeted-indexes')
ROUTES = [
    ('VHM-current-exchange-reviewed', 'https://nmquan.vn/data/ma/VHM/cong-bo/50700726-bao-cao-tai-chinh-hop-nhat-soat-xet-q2-nam-2026-va-giai-trinh-chenh-lech'),
    ('VHM-current-exchange-corrected', 'https://nmquan.vn/data/ma/VHM/cong-bo/60957657-dinh-chinh-bao-cao-tai-chinh-hop-nhat-soat-xet-q2-nam-2026-va-giai-trinh'),
    ('VHM-current-exchange-list', 'https://nmquan.vn/data/ma/VHM/cong-bo'),
    ('VIC-current-correction-reference', 'https://nmquan.vn/data/ma/VIC/cong-bo/53304219-cong-bo-dinh-chinh-thong-tin-tren-bctc-hop-nhat-soat-xet-giua-nien-do'),
    ('VHM-current-exchange-neighbor', 'https://nmquan.vn/data/ma/VHM/cong-bo/50700727-bao-cao-tai-chinh-rieng-soat-xet-q2-nam-2026-va-giai-trinh-chenh-lech'),
    ('MSN-current-exchange-reference', 'https://nmquan.vn/data/ma/MSN/cong-bo/28076918-bao-cao-tai-chinh-hop-nhat-soat-xet-ban-nien-2026-signed'),
    ('MCH-current-exchange-reference', 'https://nmquan.vn/data/ma/MCH/cong-bo/28076004-bctc-ban-nien-2026-hop-nhat-duoc-soat-xet-signed'),
    ('VIC-current-corrections', 'https://vingroup.net/vi/quan-he-co-dong/cong-bo-thong-tin/information-disclosure'),
    ('CTG-current-financial-report-table', 'https://investor.vietinbank.vn/vi/financialreports.aspx'),
    ('FPT-current-public-disclosures', 'https://fpt.com/vi/nha-dau-tu/thong-tin-cong-bo'),
    ('ACB-annual-twenty-four-detail', 'https://acb.com.vn/nha-dau-tu/bao-cao-tai-chinh-hop-nhat-kiem-toan-nam-2024'),
    ('VIB-current-quarter-two-pdf', 'https://www.vib.com.vn/wps/wcm/connect/e7f51a9d-045b-4fac-9dba-14aa5b53a479/20260727+-+VIB+-+BCTC+hop+nhat+Quy+2+2026.pdf?MOD=AJPERES&CONVERT_TO=url&CACHEID=ROOTWORKSPACE-e7f51a9d-045b-4fac-9dba-14aa5b53a479-p-yt1KJ'),
    ('VIB-current-quarter-two', 'https://www.vib.com.vn/wps/wcm/connect/vib-vevib-vn/sa-homepage/shareholder/thong-tin-tai-chinh/2026/bao-cao-quy-2?source=library&srv=cmpnt&cmpntid=242afeb3-0b0e-4413-a11a-86ab453adc26'),
    # Public component route printed by the retained issuer investor page.
    ('VIB-current-financial-component', 'https://www.vib.com.vn/wps/wcm/connect/vib-vevib-vn/sa-homepage/shareholder/thong-tin-tai-chinh/2026?source=library&srv=cmpnt&cmpntid=67db38fc-4d2d-4bfa-893f-92f8962ae871'),
    ('VIC-current-reports', 'https://vingroup.net/quan-he-co-dong/bao-cao-tai-chinh'),
    ('FPT-current-reports', 'https://fpt.com/vi/nha-dau-tu/bao-cao-thuong-nien'),
    ('TCB-current-vas', 'https://techcombank.com/en/investors/financial-information/financial-statements-vas'),
    ('LPB-current-investor', 'https://lpbank.com.vn/nha-dau-tu'),
    ('ACB-current-reviewed', 'https://acb.com.vn/nha-dau-tu/bao-cao-tai-chinh-hop-nhat-ban-nien-2026-da-soat-xet-ban-tra-cuu'),
    ('SSB-current-reviewed', 'https://www.seabank.com.vn/tin-tuc/nha-dau-tu/bao-cao-tai-chinh/bao-cao-tai-chinh-hop-nhat-soat-xet-ban-nien-2026'),
    ('BID-current-reports', 'https://bidv.com.vn/vn/quan-he-nha-dau-tu/bao-cao-va-tai-lieu/'),
    ('VPB-current-investor', 'https://www.vpbank.com.vn/quan-he-nh'),
    ('TCX-current-reviewed', 'https://www.tcbs.com.vn/tin-tuc/thong-bao-tu-tcbs/cong-bo-thong-tin-dinh-ky-6-thang-dau-nam-2026-cho-cac-trai-phieu-rieng-le-do-cong-ty-co-phan-chung-khoan-ky-thuong-phat-hanh/'),
    ('TCX-provider-documents', 'https://finance.vietstock.vn/tcx/tai-tai-lieu.htm?doctype=1'),
    ('LPB-provider-documents', 'https://finance.vietstock.vn/lpb/tai-tai-lieu.htm?doctype=1'),
    ('ACB-current-2026', 'https://acb.com.vn/nha-dau-tu/bao-cao-tai-chinh-2026'),
    ('TCX-current-investor', 'https://www.tcbs.com.vn/nha-dau-tu/quan-he-co-dong/'),
    ('SAB-current-2026', 'https://sabeco.com.vn/2026-2'),
    ('GAS-current-reviewed', 'https://www.pvgas.com.vn/bai-viet/bao-cao-tai-chinh-hop-nhat-da-soat-xet-cho-6-thang-dau-nam-2026'),
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
