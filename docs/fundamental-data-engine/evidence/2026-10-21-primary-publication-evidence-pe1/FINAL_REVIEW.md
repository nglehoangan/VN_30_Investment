# PE1 — Source discovery and evidence inventory

Status: **PE1 COMPLETE — PENDING INDEPENDENT CIO REVIEW**. PRIMARY_PUBLICATION_EVIDENCE remains escalated; no production admission or scoring occurred.

## Measured results

- Actual newly captured authoritative document records: **30 distinct PDF byte identities**, from 34 successful official document captures. This includes cover letters/explanations; it is not a count of verified financial reports. Eight exact document-linked primary publication dates were independently verified.
- Independently verified report identities: **9**.
- Exact official-to-retained PDF byte matches: **7** (GVR 6T2026, HPG FY2025, VRE 6T2026, VNM Q2/6T2026, VJC FY2025, GAS 6T2026, VHM FY2025).
- SSB 6T2026 and VJC 6T2026: verified official issuer attachment plus visual physical-page-2 identity and canonical source hash; no baseline retained physical PDF exists for these hashes. They are not counted as retained-byte pairs.
- Dated verified documents eligible for formal review: **8**, all conservatively DATE_ONLY; exact timezone-qualified publication timestamps: **0**. GAS/SSB raw local clocks are retained but their offsets are unknown.
- Minimum core source-evidence coverage: **45/216** across GVR 8, GAS 8, VRE 8, VNM 7, SSB 6, VJC 8. **171** remain unresolved. Potential coverage: **54**, including unqualified/nonexact variants, not admissions. The 216 are a lower bound, not a complete scoring dataset.
- Inventory: 337 baseline physical PDFs / 330 unique hashes; 353 unique documents after adding actual new official hashes. Every physical alias remains listed. Unknown metadata stays null.

## VHM

All **16** existing FY2025 leads now have an exact-byte match to a PDF actually retrieved from official HOSE staticfile infrastructure. Original Vinhomes page returned HTTP 403, respected without bypass. Secondary nmquan page supplied only the official attachment URL. Visual physical-page-1/2 inspection establishes issuer/period/consolidated identity; page 2 leaves the publication-date field blank. Signature date/time and filename do not prove publication. Therefore historical publication date verified: **0/16**, formally admitted: **0**. Current retrieval is preserved without historical backdating. VHM contributes zero of the current 216 obligations, which reference its 2026 report.

## Remaining source dependencies

HTTP 403 affected MCH, MSN, SHB, TCX, VHM, VIC, VPL. Other captured archives may be dynamic shells, incomplete routes or unreviewed variants; HTTP 200 alone is not proof. HPG current report has different bytes despite equal page counts; no equivalence asserted. CTG capital report matches a canonical hash, but regulatory scope is unresolved. Source inventory/discovery artifacts preserve exact limits per record.

## Validation and production integrity

Relevant provenance/identity/D2/AS_KNOWN/compatibility tests: **201 passed, 0 failed**. Read-only authority replay is captured separately. SQLite integrity check: ok; byte hash, logical dump, all table counts and all 744 protected data-file hashes unchanged. No prior evidence seals rewritten; only the authorized PRIMARY_PUBLICATION_EVIDENCE register issue changed, with explicit before/after hashes. Existing full-suite historical failures were not suppressed; full suite was not rerun for this evidence-only change.

D2 v1.0.0 remains inactive. DATE_ONLY candidates retain publishedAt=null, Asia/Ho_Chi_Minh next-day boundary, actual retrieval/review times, and null effectiveKnownAt while formal ingestion/mapping/methodology/other required evidence is missing. Policy approval is not source approval. No HUMAN approval, runtime activation, MARKET CAS, source admission, scores, rankings, transactions or orders. MBB remains DEFERRED.

## Exact proposed PE2 scope — not executed

After independent CIO review only: qualify exact immutable source/document/date bindings for **GVR 6T2026, GAS 6T2026, VRE 6T2026, VNM Q2/6T2026, SSB 6T2026, VJC 6T2026, HPG FY2025, VJC FY2025**. Evaluate the 45 current obligation links individually against concept/scope/unit contracts; obtain formal identity approvals and every required knowledge timestamp, enforce max-boundary AS_KNOWN, and independently replay. This proposal does not authorize production admission or D2 activation. VHM requires an original dated primary record; HPG nonexact variants and CTG regulatory scope require separate qualification. Continue acquisition for the 171 unresolved obligations.

**STOP at PE1. PE2/PE3/PE4 have not run.**
