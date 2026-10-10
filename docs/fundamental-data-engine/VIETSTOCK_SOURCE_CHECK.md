# Vietstock public mirror source check — 2026-10-10

Subsequent owner-authorized imports and period checks are recorded in [the raw coverage report](VIETSTOCK_RAW_COVERAGE_REPORT.md). The no-import statement below describes this earlier source-check stage.

The owner supplied five Vietstock document listings as alternatives for MCH, MSN, VCB, VHM and VIB. All five listings rendered anonymously, and one consolidated Q2/2026 PDF per ticker was downloaded with TLS verification enabled, hashed and opened by pypdf. No login or existing browser session was used.

| Ticker | Listing links in the requested years | Verified sample pages |
| --- | ---: | ---: |
| MCH | 10 | 57 |
| MSN | 18 | 71 |
| VCB | 18 | 55 |
| VHM | 18 | 143 |
| VIB | 20 | 71 |

`issuer-sources.json` now uses the supplied Vietstock listing for these five tickers and retains the previous issuer site in `officialDiscoveryUrl`. `issuer-document-routes.json` saves the exact visible PDF routes. Each route distinguishes a downloaded sample from a browser-only link; a visible link is not proof of successful download. Queries `doctype=1` and the observed eight-digit hexadecimal PDF `ver` parameter are preserved under a narrow endpoint allowlist. The raw collector uses the system TLS trust transport for these sites and identifies Vietstock as a third-party mirror in source provenance.

This check did not append to `data/initialization-08b.sqlite`: its existing 25-issuer raw collection and historical evidence remain unchanged. It verifies that the five alternative sources are usable, without certifying full 2025–Q2/2026 coverage, original issuer publication dates, retention entitlement, financial contents, or DI acceptance. Some first-page lists stop in Q4/2025 and require further public pagination for earlier quarters.

Evidence: [sample HTTP, hashes, page counts and candidate routes](evidence/2026-10-10-vietstock-source-check.json).

The existing explicit-target collector will reuse the saved routes for these five tickers:

```sh
node scripts/update-vn30-raw.mjs \
  --database "$PWD/data/initialization-08b.sqlite" \
  --output "$PWD/data/initialization-08b-captures/vietstock-next-run" \
  --tickers MCH,MSN,VCB,VHM,VIB
```

The output directory must be new. Raw collection and financial admission remain separate.
