# FPT Hybrid Scoring Policy v1.0 migration

Economic cutoff 13/11/2026. `vn30-hybrid-scoring-policy-v1.0` successor candidate evaluation is executable and deterministic. The production route is not active. V8 is the immutable official predecessor.

| Verdict | Result |
|---|---|
| TECHNICAL | PASS_WITH_LIMITATIONS. Actual read-only Hybrid candidate migration and EBCS replay completed. The native scoring registry has not activated this version. |
| SCORING COVERAGE | 3/23, raw 5, evaluated weight 12/100. Covered Score 41.6667, full official score null. Confidence LOW. |
| RANKING READINESS | RANKING_BLOCKED. Owner minimum coverage policy absent; comparability not certified. |
| INVESTMENT DECISION | BUY_BLOCKED. Financial risk, valuation, historical PIT eligibility, approved active successor, portfolio rules and ordinary buy criteria are open. Defensive decisions remain governed separately. |
| PRODUCTION AUTHORIZATION | AWAITING_EXPLICIT_OWNER_APPROVAL. No official write or publication. |

## Migration and controlled assumptions

FY2025 research remains 18/23, 40/79. Hybrid replay verified all 23 rubric identities and weights against approved M3 and all accepted points against the same EBCS input and immutable Unified envelope. The retained points are BQ-MOAT 3/6 and IC-IND 2/4 VERIFIED, and RG-UNC 0/2 CONSERVATIVE. RG-UNC pins the dated filing's known-at and source locators for profit/CFO/capex, documents the 45–90% conversion sensitivity and checks the later Q3 counter-evidence. The band's supported 0 counts with its weight. Unrated items are null and excluded from the evaluated denominator. 0 denominator returns null. The 20 N/R rows carry their exact retained reasons and source references in the envelope.

[Hybrid input](FPT_HYBRID_INPUT_V1.json) canonical SHA-256 `49c036bbc2b37841819b52189fe90d3bce316f1b4cf73b55f7daa85edaa886e8`. [Hybrid candidate](unified-candidates/b294ae0b70121b4d1366eddedf1e07ead847eb06a2836bd36881a7e33192cf5e.json) canonical hash `b294ae0b70121b4d1366eddedf1e07ead847eb06a2836bd36881a7e33192cf5e`. [Pending exact activation proposal](FPT_HYBRID_ACTIVATION_PROPOSAL_V1.json) proposal hash `00f99e3d8a5b7c97f450dda3b7cb513e608ae470af08a610e880bc51eb9c1a20`. The proposal pins executable candidate tooling that was tested, not an approved native scoring executable. Successor preparation, challenge, executable, dataset/assessment acceptance and exact native preflight authorization remain required. Coverage thresholds and accepted confidence for ranking need their own explicit owner policy.

The five approved directions remain available in the versioned research contracts; the Hybrid adapter retains their exact method names and does not accept experimental rubric scores. Public disclosures and approved equivalents can support the methods. The retained v3.0 scores for FH-STRESS and CA-REINV use still-proposed calibration and are kept outside the Hybrid accepted denominator. This execution reused the source/SEGM pins and did not reopen evidence discovery. No broad SEGM cycle.

## Regression and integrity

- V8 Prepare/check replay confirms READY under the registered route. All 30 source bytes pinned by the V8 executable match. SQLite opened read-only showed exactly one official FPT artifact with body hash `4eed8f0bf117e332fb56855df7702f1026182120e04f2f91bacc3880fe446b20`, V8's limited points still 2/23, 5/10.
- VNM, ACB, TCB were checked one at a time against existing baseline pins and qualified sector mapping. VNM RETAIL; ACB and TCB BANK. Baseline artifact hashes matched. No Hybrid proposals were administered to those tickers and no industrial proxy was applied to banks. This is preservation/compatibility testing, not new scoring for them.
- Tests: 68 Python, 216 TypeScript, parity and git diff --check passed. The publication suite used temporary Node server-only alias. No artifact was published and no official rows were modified.

Code files `tools/scoring/hybrid_policy.py`, `tools/scoring/vn30_hybrid.py` and `tests/unit/test_hybrid_policy.py` added. FPT input, candidate result, pending activation proposal and this report are the artifacts. No commit.
