# PE2 — Publication and document identity qualification

**PE2 COMPLETE — PENDING INDEPENDENT CIO REVIEW.** No production admission or activation. Eight archived PE1 disclosures were explicitly selected by the latest request; live acquisition remains Vietstock-only. The existing 104/216 Vietstock exact-document coverage remains unchanged.

## Eight disclosure results

| Disclosure | Period | Publication date | Identity | Current document links | Acceptance |
|---|---|---|---|---:|---|
| GVR (`disclosure-000608fc5a1e7a2b589e`) | 2026-06-30 | 2026-08-28 DATE_ONLY | EXACT_BYTE_MATCH | 8 | PENDING_REQUIRED_EVIDENCE |
| HPG (`disclosure-b78138ecc1ab8326ee99`) | 2025-12-31 | 2026-03-27 DATE_ONLY | EXACT_BYTE_MATCH | 0 | PENDING_REQUIRED_EVIDENCE |
| VRE (`disclosure-e67602b2e045efdd7006`) | 2026-06-30 | 2026-08-28 DATE_ONLY | EXACT_BYTE_MATCH | 8 | PENDING_REQUIRED_EVIDENCE |
| VNM (`disclosure-f4ae4647793972c25738`) | 2026-06-30 | 2026-07-30 DATE_ONLY | EXACT_BYTE_MATCH | 7 | PENDING_REQUIRED_EVIDENCE |
| VJC (`disclosure-a0396e3bfd1c7bd2a2fc`) | 2026-06-30 | 2026-08-28 DATE_ONLY | VERIFIED_DOCUMENT_IDENTITY | 8 | PENDING_REQUIRED_EVIDENCE |
| VJC (`disclosure-6594f3e5d1a68e7350f8`) | 2025-12-31 | 2026-03-30 DATE_ONLY | EXACT_BYTE_MATCH | 0 | PENDING_REQUIRED_EVIDENCE |
| SSB (`disclosure-6569ca5cc1f9ca33706f`) | 2026-06-30 | 2026-08-14 DATE_ONLY | VERIFIED_DOCUMENT_IDENTITY | 6 | PENDING_REQUIRED_EVIDENCE |
| GAS (`disclosure-470ec375069e004cabbe`) | 2026-06-30 | 2026-08-14 DATE_ONLY | EXACT_BYTE_MATCH | 8 | PENDING_REQUIRED_EVIDENCE |

## Measured qualification

- Publication qualified at the captured-evidence layer: **8**, all DATE_ONLY; exact timezone-qualified timestamps: **0**. Each date belongs to the exact linked item/container, not a filename, signature, HTTP clock or adjacent item. GAS/SSB unqualified source local clocks are preserved separately without assigning a timezone. publishedAt remains null.
- Identity qualified: **8**; exact official-to-retained byte pairs **6**. SSB and VJC 6T2026 remain VERIFIED_DOCUMENT_IDENTITY without retained physical PDF pairs. Producer visual review is pinned to actual source PDF pages; it is not an independent approval or financial-cell review.
- **8 immutable partial candidate envelopes**, with deterministic body hashes and exact source/PDF/locator references. **0 complete immutable receipts**: source contract/method approvals and required knowledge remain missing. Native source-publication/D2 identity method lookup returned no matching configured rows.
- **45 SOURCE_DOCUMENT_VERIFIED** obligation links have exact canonical source hash, ticker, period and scope matches. **0 newly verified normalization/obligation mappings**, **0 AS_KNOWN eligible**, **0 ready for complete independent acceptance**, **0 formally admitted**. Existing canonical verification flags are preserved but do not prove native-unit/source-cell normalization or new formal knowledge. HPG FY2025 and VJC FY2025 each contribute zero current-period obligations.

## Knowledge and D2

The verified D2 policy canonical hash is `1738c2b0f46dfb618fe51aceaa002bd2bc55db182837dc72ee0d6b1b346eafad`; implementation manifest hash is `7405b633a7cea0777e180588469a444de6a61c4382118c02d4b02e04ee827f97`. All pinned implementation artifacts match actual bytes.

Source/document retrieval times come from actual sealed HTTP receipts. Source/document verification and candidate identity creation use actual PE2 review time. Publication boundaries are next local calendar day 00:00 in Asia/Ho_Chi_Minh, expressed separately from the unknown publication timestamp. Formal ingestion, mapping/methodology/registry knowledge, source-contract/source-method/identity-method knowledge and other required boundaries are null. Actual systemKnownAt and decisionAsOf are not supplied. effectiveKnownAt is therefore null for every real candidate; cutoff/effectivity eligibility is blocked, never assumed. Native D2 requires approved exact authorities and FORMAL observations, so actual receipts fail preflight rather than receiving invented native inputs.

## Validation and regressions

Requested lint/typecheck/build/scoring/focused/full checks were run. Focused tests: **217 pass**. New corruption/cutoff replay tests: **25 pass**. Independent engineering replay is byte-identical across two runs; it is not an independent acceptance signature.

First full suite: 2163 passed / 21 failed. It revealed the 18 known historical failures, two schema-v2 preflight compatibility failures from the previous Vietstock-only correction, and a default-20s backup timeout. The metadata-only preflight now validates schema v2 without restoring any data/network/scoring capabilities; its fail-closed tests pass. No historical test was removed or suppressed.

Final full suite: **2166 passed / 19 failed**. All 18 historical failures remain explicitly listed in REGRESSION_COMPARISON.json. Remaining new default-budget timing failures: **1**. Backup diagnostics with CLI-only 60s budget passed unchanged assertions; the default full-suite result is preserved, not relabelled as green. No test/config timeout was edited. **New unexplained functional regressions: 0.**

Repository lint still fails only on the existing unused instantiateSectorRequirements binding in the sealed 2026-10-21 escalation helper. That historical helper and lint policy were not modified. Typecheck, build and scoring checks pass.

## Integrity and next scope

Production database byte hash, logical dump, all table counts and active dependency heads are unchanged. All protected data-file hashes and prior D2/PE1/Vietstock-correction evidence bytes are unchanged. Relevant historical seals were rehashed (37 D2, 106 PE1 and 18 correction artifacts); active authority replay passed 22 sealed JSON inputs and 30 canonical runs with zero accounting regressions. Only the authorized escalation issue changed; old register/source pins remain historical versions and are not rewritten.

**No HUMAN approvals, D2/runtime activations, MARKET CAS, source admission, production scores, rankings, transactions or orders. MBB remains DEFERRED.**

Exact proposed PE3 scope after CIO review: close authority/knowledge and source-cell/native-unit mapping dependencies for the **same eight archived disclosures** and their **45 document links**, then independently replay. Candidate creation time, file mtime or generic registry dates must never replace missing knowledge. No expansion to VHM/other disclosures and no live company/exchange fetching are authorized by this packet.

**STOP after PE2. PE3 has not run.**
