> Subsequent Vietstock imports for the five missing candidates are recorded in [the raw coverage report](VIETSTOCK_RAW_COVERAGE_REPORT.md). This report preserves the earlier 25/30 collection result.

# Slice 08B — update across all 30 source-register candidates

The authorized collection target is `data/initialization-08b.sqlite`, with requested reporting coverage from 2025 through Q2/2026. **All 30 source-register candidates were attempted; 25 have raw PDF candidates. Full financial-data initialization remains incomplete.** The source register is a research basket, not a certified official VN30 membership release.

## Actual result

Five bulk/recovery runs appended public HTTP evidence after the two earlier FPT runs. There are **245 distinct URL/body-hash pairs, 309 PDF retrieval instances, 69 source versions, 70 import batches and 2,882 captures**. The explicit database was checked read-only after collection: **canonical observations 0, snapshots 0, DI acceptances 0, portfolios 0**. Retrieval clocks establish current local knowledge; they do not establish knowledge in 2025 or June 2026.

The PDF counts include candidate disclosures, explanations, translations and report vintages. They are not counts of qualified financial statements. No issuer's requested period coverage is certified. A URL that changes bytes remains a separate URL/body pair; repeated downloads retain separate immutable source/batch/capture lineage. Failed and incomplete transfers are preserved rather than converted into successful reports. Source discovery/collection completion never grants document or financial admission.

| Ticker | Distinct URL/body pairs | PDF retrievals | Status |
| --- | ---: | ---: | --- |
| ACB | 6 | 8 | Raw PDF, unqualified |
| BID | 7 | 7 | Raw PDF, unqualified |
| BSR | 22 | 22 | Raw PDF, unqualified |
| CTG | 15 | 15 | Raw PDF, unqualified |
| FPT | 9 | 11 | Raw PDF, unqualified |
| GAS | 7 | 7 | Raw PDF, unqualified |
| GVR | 20 | 20 | Raw PDF, unqualified |
| HDB | 1 | 1 | Raw PDF, unqualified |
| HPG | 12 | 12 | Raw PDF, unqualified |
| LPB | 1 | 1 | Raw PDF, unqualified |
| MBB | 13 | 18 | Raw PDF, unqualified |
| MCH | 0 | 0 | Blocked: no complete PDF |
| MSN | 0 | 0 | Blocked: no complete PDF |
| MWG | 6 | 6 | Raw PDF, unqualified |
| SAB | 18 | 32 | Raw PDF, unqualified |
| SHB | 1 | 2 | Raw PDF, unqualified |
| SSB | 1 | 2 | Raw PDF, unqualified |
| SSI | 18 | 36 | Raw PDF, unqualified |
| STB | 6 | 6 | Raw PDF, unqualified |
| TCB | 16 | 16 | Raw PDF, unqualified |
| TCX | 1 | 2 | Raw PDF, unqualified |
| VCB | 0 | 0 | Blocked: no complete PDF |
| VHM | 0 | 0 | Blocked: no complete PDF |
| VIB | 0 | 0 | Blocked: no complete PDF |
| VIC | 9 | 9 | Raw PDF, unqualified |
| VJC | 16 | 16 | Raw PDF, unqualified |
| VNM | 8 | 16 | Raw PDF, unqualified |
| VPB | 20 | 26 | Raw PDF, unqualified |
| VPL | 1 | 2 | Raw PDF, unqualified |
| VRE | 11 | 16 | Raw PDF, unqualified |

MCH, MSN, VHM and VIB returned HTTP 403 or a public browser challenge, with no complete PDF retrieved. VCB's captured listing yielded no complete PDF; browser discovery also failed. These are collection blockers, not assertions that the companies did not publish reports. Public search results and rendered browser content are discovery evidence, not substitutes for original PDF bytes.

## Implementation and replay

`update-vn30-raw.mjs` requires an explicit absolute database and a new output directory. It verifies the existing RAW_COLLECTION_ONLY marker and zero canonical/snapshot/DI/portfolio records before network access. It reads all 30 research candidates, reuses the public candidate URLs saved in `issuer-document-routes.json`, optionally merges a private `--seeds` map, and supports a `--tickers` subset for recovery. It saves private per-issuer manifests/checksums before immutable raw ingest, reconstructs complete PDF chunks from the repository, serializes database writes and records progress and a run summary. Failed issuers do not suppress other results. Repeated responses for the same URL remain separate response/chunk groups, even when clocks and bytes match. Saved links are unqualified discovery routes, not an approved source or extraction contract.

Collection uses four concurrent issuer workers and sequential requests per issuer, one-second spacing, three redirect attempts, a 45-second request bound, a 32 MB response limit, a 1 GiB aggregate response-byte cap, up to 20 selected document URLs and three financial child pages. HTML discovery is bounded at 4 MB and truncation/selection limits remain explicit partial states. Redirect destinations, private DNS, credentials, fragments and unapproved query parameters are rejected. Rejected seed counts are recorded. Final run plans bind implementation file hashes; earlier discovery trials remain unqualified raw evidence.

The additive `raw-document-envelope-v2` retains exact public document-routing queries in the envelope and request fingerprint. Query-bearing resource references use a SHA-256 locator, preserving the original URL in the immutable envelope. Routing parameters are allowlisted only for observed BIDV WCM, BSR document-library, GVR cache, VietinBank download and PV GAS document endpoints. Parameters are never stripped to fabricate an alternate URL. The v1 reader retains its original query-free/PDF-MIME requirements. V2 additionally accepts actual `application/octet-stream` HTTP type only when complete PDF bytes pass signature, SHA-256, chunk, source and batch lineage checks; the HTTP MIME is not rewritten. This byte-format verification is not issuer/period/audit/publication qualification.

BSR failed Node's TLS-chain verification but system HTTPS validation succeeded. Its requests use system curl with certificate validation enabled, no cookies or credentials, no automatic redirects, no shell interpolation, and bounded temporary output. Response cookies are discarded. TLS validation was never disabled.

`discover-vn30-public-links.mjs` opens fresh anonymous public browser contexts, reads visible link contexts, tries year controls for ACB/MBB/VPB and records actual download URLs. Browser discovery artifacts explicitly grant neither raw HTTP integrity nor financial qualification. Selected-year labels are requested UI states, not certified report periods. The command writes private candidate seeds for a subsequent actual HTTP collection; it never reads existing browser profiles or signs in. It was exercised on ACB/MBB/VPB (10/16/28 candidate links). Further site-specific pagination/coverage and challenge handling remain partial; no CAPTCHA bypass or authentication workaround was performed. LPBank's actual public file endpoint was discovered by opening the report's “tại đây” link and is saved for replay.

For a new update, from the repository root, choose a fresh private output path:

```sh
node scripts/update-vn30-raw.mjs \
  --database /Users/nglehoangan/Documents/Working/VN_30_Investment/data/initialization-08b.sqlite \
  --output /Users/nglehoangan/Documents/Working/VN_30_Investment/data/initialization-08b-captures/vn30-next-run
```

For dynamic discovery before a recovery run:

```sh
node scripts/discover-vn30-public-links.mjs \
  --output /Users/nglehoangan/Documents/Working/VN_30_Investment/data/initialization-08b-captures/public-ui-next-run \
  --tickers ACB,MBB,VPB
# Pass its absolute seeds.json path with --seeds to the raw update command.
```

Existing run directories are immutable; never overwrite them. Raw payloads, DB, receipts and browser artifacts remain ignored under private `data/`, with owner-only permissions. Public redacted evidence is `evidence/2026-10-10-vn30-raw-update.json`; its packet hash semantics are explicit. The earlier FPT report/evidence remains a historical record, not the current aggregate.

## Remaining admission gates

Official membership/effective-date, sector and market inputs, independent document/period/consolidation/audit/revision/publication evidence, normalization, registry/mapping/crosswalk/policy/requirements review and independent DI acceptance are still missing. The five collection blockers and per-issuer incomplete-history/size/timeout limits also remain visible. No FORMAL observation, scoring, rank, Top 10, trade, Slice 9 or DI PASS was manufactured. Approving source links and a database target does not provide these exact dataset/reviewer bindings.

A sample FPT Q2/2026 PDF was reconstructed with SHA-256 verification, opened (47 pages) and visually inspected on page 1 using the PDF skill. It is scanned on that page and a text-only first-page extraction returned no text. This illustrates why file/URL discovery alone is insufficient; this inspection is advisory and not independent document approval.

## Validation

The final handoff requires the following actual results, with logs retained under `/private/tmp/vn30-*`:

| Check | Required final result |
| --- | --- |
| Complete unit/integration/architecture suite | 77 files / 966 tests passed |
| New issuer collector tests | 2 files / 11 tests passed, included in the complete suite |
| Existing FPT collector and isolated raw initializer regressions | Passed, included in the complete suite |
| TypeScript / ESLint | Passed / zero warnings |
| Architecture boundaries | Passed, 141 source modules |
| Prisma validate/generate | Explicit harmless temporary URL, `--no-env-file`; passed |
| Diff and new-file whitespace | Passed |
| Source/test/config/report inventory before and after the complete suite | Identical SHA-256 |

Earlier concurrent full/regression attempts suffered existing integration-test timeouts during large live collection; their failures are not represented as passes. The required final suite runs after network collection stops. No Next/UI, Prisma schema, portfolio/account data or investment calculation was changed. No commit or push.
