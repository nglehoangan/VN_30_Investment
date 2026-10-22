# Vietstock-only financial document acquisition

Owner reconfirmed on 2026-10-22: financial PDF/document discovery and collection use only `finance.vietstock.vn` and `static2.vietstock.vn`. Do not use issuer or exchange websites, fallback URLs or external redirect destinations. `issuer-sources.json` and `issuer-document-routes.json` are the current configuration. The old `issuerDiscoveryUrl`, `officialDiscoveryUrl` and issuer verification records have been removed from these configurations.

The TypeScript collector validates configuration, seeds, discovered links and each redirect before requesting them. The Python rebuild downloader also validates every redirect and does not let curl auto-follow. Historical resource parsing remains available solely to replay preserved provenance; parsing a URL does not authorize fetching it. Do not execute old evidence acquisition scripts as a current collection workflow.

Use `python3 scripts/rebuild-vn30-downloads.py` to resume saved Vietstock PDF downloads. Do not use `--reset` unless the owner requests another data reset. Existing immutable PDFs and raw responses are preserved. The previously documented `scripts/discover-vietstock-documents.py` is absent; no functioning dynamic-index collector is claimed.

Recompute current exact-document coverage with `python3 scripts/recalculate-vietstock-coverage.py --output <new-output-directory>`. The command is read-only for source data and the database. It counts only actual retained PDF bytes matching their Vietstock download receipts and the canonical obligation source hash. A same-title or same-period variant does not count as an exact match.

Coverage distinguishes retained-document coverage, original-publication evidence and formal admission. Vietstock is a third-party mirror. Its listing dates are not automatically issuer publication dates, and the user's acquisition-source choice does not activate D2 or relax AS_KNOWN/approval contracts. Current reports must not add prior issuer/HOSE evidence into Vietstock-only coverage. The 2026-10-21 PE1 package is preserved history and is superseded for current source-policy coverage by `evidence/2026-10-22-vietstock-only-source-correction/`.

Previously captured CafeF reference data and TCBS market/account APIs are separately governed and are not used as PDF collection fallbacks or counted in this coverage.
