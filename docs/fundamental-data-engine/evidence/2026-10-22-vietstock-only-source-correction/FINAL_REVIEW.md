# Vietstock-only source correction — 2026-10-22

Owner-requested correction completed. Company/exchange acquisition routes are removed from active source configuration. No live external website requests were made in this correction.

## Changes

- Removed 316 non-Vietstock URL fields, including issuerDiscoveryUrl, officialDiscoveryUrl and issuerSourceVerification. Rebuilt current document routes from the retained Vietstock manifest: 344 attempts / 337 successful physical PDFs / 330 unique hashes.
- Current configuration has 34 discovery entries (30 retained universe + 4 pre-existing supplemental research entries). Coverage is restricted to 29 eligible issuers; MBB remains deferred.
- Both TypeScript and Python transports enforce exact Vietstock host selection before requests, seeds, linked documents and redirects. Curl automatic redirect following was removed. Historical URL parsers support old provenance replay only.
- Recorded owner source priority in AGENTS.md and linked the current source policy from older source guides. The old dynamic discovery script referenced by historical docs is absent; it is not represented as working.

## Recalculated coverage

| Measure | Count |
|---|---:|
| Current lower-bound core obligations | 216 |
| Exact canonical source document retained from Vietstock | 104 (48.15%) |
| Exact selected document not yet matched | 112 |
| Original-publication evidence qualified under permitted Vietstock-only inputs | 0 |
| Formal source admissions | 0 |
| Eligible fact candidates whose source hashes have retained Vietstock bytes | 1,388 / 1,754 |

**104/216 is retained-document coverage, not verified publication or scoring readiness.** The historical PE1 45/216 used a different source-evidence dimension and issuer/HOSE sources, so it is excluded rather than added, relabelled or compared as an improvement. User approval to acquire from Vietstock does not certify its listing dates as original publication dates or authorize D2 activation.

A PDF can already be present for an issuer/period yet differ from the canonical source hash. Such a variant is not automatically substituted: review the document identity/period/scope and source replacement lineage first. The 112 unmatched obligations do not imply 112 missing PDF files. The 216 obligations are a lower bound, not a complete scoring dataset.

| Issuer | Obligations | Exact retained document | Unmatched |
|---|---:|---:|---:|
| ACB | 7 | 1 | 6 |
| BID | 7 | 1 | 6 |
| BSR | 8 | 0 | 8 |
| CTG | 7 | 0 | 7 |
| FPT | 8 | 0 | 8 |
| GAS | 8 | 8 | 0 |
| GVR | 8 | 8 | 0 |
| HDB | 7 | 0 | 7 |
| HPG | 8 | 8 | 0 |
| LPB | 7 | 7 | 0 |
| MCH | 8 | 8 | 0 |
| MSN | 8 | 8 | 0 |
| MWG | 8 | 8 | 0 |
| SAB | 8 | 0 | 8 |
| SHB | 7 | 0 | 7 |
| SSB | 7 | 1 | 6 |
| SSI | 6 | 0 | 6 |
| STB | 7 | 1 | 6 |
| TCB | 7 | 1 | 6 |
| TCX | 6 | 0 | 6 |
| VCB | 7 | 6 | 1 |
| VHM | 8 | 0 | 8 |
| VIB | 7 | 0 | 7 |
| VIC | 8 | 8 | 0 |
| VJC | 8 | 0 | 8 |
| VNM | 8 | 7 | 1 |
| VPB | 7 | 7 | 0 |
| VPL | 8 | 8 | 0 |
| VRE | 8 | 8 | 0 |

Fully covered at the exact-document layer: 11 issuers. Partial: 7. No exact selected-document matches: 11. MBB is excluded.

## Validation and integrity

- 217 TypeScript tests passed, 0 failed; 3 Python transport policy tests passed. Typecheck, changed-file ESLint and diff whitespace check passed.
- Database byte/logical hashes and all table counts unchanged; SQLite integrity check is ok. Retained data and every previous PE1 artifact remain byte-identical.
- Historical source configuration hashes remain historical pins. The authorized current configuration/register hashes are recorded separately; no prior seals were rewritten. The persistent publication blocker now reports the corrected source scope and separates document availability from publication proof.
- No source admissions, HUMAN approvals, authority/D2 activations, MARKET CAS, scores, ranking publication, transactions or orders.

## Remaining work

Investigate the 112 exact-document gaps using Vietstock only. Qualify source replacement explicitly for different PDF versions. Original-publication/availability evidence, all AS_KNOWN knowledge boundaries, formal lineage and independent review remain required before production scoring. HTTP 403 on the old company websites is no longer an active acquisition dependency.
