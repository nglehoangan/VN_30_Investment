# Automated source-trust policy

Standing authority grants provider/version scope; it does not certify every input. Only `APPROVED_STANDING_SOURCE` may proceed, and all domain controls must still pass.

| Classification | Meaning | Admission behavior |
|---|---|---|
| APPROVED_STANDING_SOURCE | Active approved version; exact source capture hash/URL/receipt and supported source-role identity verified | Continue through observation/domain/replay checks |
| VERIFIED_NEW_SOURCE_PENDING_AUTHORITY | Trusted capture evidence exists but its origin is outside approved provider scope | Quarantine; escalate the new authority |
| UNVERIFIED_SOURCE | No matching trusted capture or provenance | Quarantine; verify evidence, without automatically granting authority |
| REJECTED_SOURCE | Invalid/spoofed URL, changed hash, malformed receipt/redirect or unsupported identity | Reject/quarantine with exact reason |

## Inputs and trust anchors

User URLs/files are evidence inputs. `classifyEvidence` accepts bytes with an optional URL/claimed hash; neither hostname text nor file name supplies authorization. File aliases with exactly the same verified content hash can reuse the existing captured document identity. Files outside the retained root must first be captured by the normal controlled collector into immutable evidence; request paths cannot escape the root or overwrite policy files.

Trusted server composition supplies the current version-registry FilePin and [TRUSTED_SOURCE_INPUTS.json](TRUSTED_SOURCE_INPUTS.json). Its catalog pins identify retained collector receipts, raw CaféF containers, extracted PDF provenance and qualified financial-semantic artifacts. They are host inputs, not accepted from request JSON. Controlled collectors/extractors can add immutable evidence/catalog snapshots under an unchanged supported version without per-document owner or independent material approval. Arbitrary user JSON cannot enroll a catalog or declare itself qualified.

Known capture identity includes the original response/content hash, exact HTTPS source URL and original receipt. Domain comparison uses parsed exact origins; credentials, unsupported schemes/ports, domain suffix spoofing and malformed URLs reject. Recorded redirect hops must stay within approved scope; no new assertion is made about missing historical redirect metadata. A retained trusted capture is reused rather than downloaded again. Receipt evidence proves capture identity, not original issuer publication.

## Provider/role boundaries

| Provider/source | Existing scope | Observation qualification in this version |
|---|---|---|
| CaféF `https://cafef.vn` | Exact PriceHistory API, `GiaDongCua` RAW CLOSE | Supported with original request/body hashes, API identity, declared units and all Market Boundary checks |
| Vietstock mirror `https://finance.vietstock.vn`, `https://static2.vietstock.vn` | Existing qualified issuer/PDF financial-source roles | Supported for retained qualified financial-statement/direct-PDF TOTAL_ASSETS with exact semantic/extraction linkage |
| CaféF financial API `https://apiweb.cafef.vn` | Existing structured financial-source eligibility | No blanket native observation qualification granted here; unsupported financial API facts quarantine |

A mirror URL does not prove original issuer publication. Financial semantics must match a qualified retained artifact for the same issuer, source hash, concept, period, scope, unit and value; original document/import/review/publication metadata cannot be changed by input flags. Native content must match the hash-linked extraction artifact, exact page/box and supported caption. Normalization reuses the existing decimal normalizer; no amount-equality concept inference, averaging or latest-wins resolution.

The old REVIEWED witness remains a data-check format. It is never independent authority: forged native values, dimensions or provenance cannot override the trusted raw/extraction/semantic lineage. The admitted financial plan retains the automated verification result, original capture receipt and exact catalog pointer. Corporate actions/VNM17 are not automatically admitted by this statement adapter.

## Time, failures and revocation

Per-observation source receipts cannot lie after the actual knowledge cutoff. Current admission stamps actual ingestion/knowledge with the trusted clock and preserves earlier source/review times separately. Canonical publication/PIT requirements remain unchanged; the current-only contract cannot enter historical backtests. Authority and record revocation are rechecked at consumption. Changed code/schema/raw hash, unknown source, conflict or unsupported mapping is quarantined; no mandatory independent material receipt is reintroduced as a workaround.

Initial-version scope limits are explicit. Qualifying another mapping or materially changed provider/adapter/policy requires controlled version requalification, not repeated approval of already approved source roles. Production activation remains NOT_AUTHORIZED.
