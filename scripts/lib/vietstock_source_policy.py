"""Owner-selected public PDF acquisition boundary. No issuer/exchange fallback."""
from urllib.parse import urlsplit, urljoin
import subprocess

ALLOWED_HOSTS = frozenset({'finance.vietstock.vn', 'static2.vietstock.vn'})

def require_vietstock_url(url):
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or parsed.hostname not in ALLOWED_HOSTS or parsed.username or parsed.password or parsed.fragment or parsed.port not in (None, 443):
        raise ValueError('VIETSTOCK_ONLY_SOURCE_POLICY')
    return url

def download_vietstock(url, output):
    """Validate every redirect BEFORE transport; curl must not auto-follow."""
    for _ in range(3):
        require_vietstock_url(url)
        result = subprocess.run(['curl', '--silent', '--show-error', '--fail',
            '--proto', '=https', '--max-time', '55', '--max-filesize', '100000000',
            '--output', str(output), '--write-out', '%{http_code}\n%{redirect_url}', url],
            capture_output=True, text=True, timeout=60)
        status, _, redirect = result.stdout.partition('\n')
        if result.returncode or not status.startswith('3'):
            return subprocess.CompletedProcess(result.args, result.returncode, status, result.stderr)
        if not redirect:
            raise ValueError('REDIRECT_WITHOUT_LOCATION')
        url = require_vietstock_url(urljoin(url, redirect.strip()))
    raise ValueError('REDIRECT_LIMIT')
