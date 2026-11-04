# Validation — source processing and research models for the remaining 19 issuers

Date: 2026-11-04. Research scope only. This is not primary fair-value, current-price, scoring or trade acceptance.

| Exact command | Result |
|---|---:|
| `python3 scripts/build-investment-research-v2.py` | 30 combined dossiers; 19 newly processed; 672 named sensitivity cases; previous 11 byte-identical |
| `python3 scripts/test-investment-research-v2.py` | 18/18 PASS |
| `python3 scripts/test-vn30-investment-research.py` | 13/13 PASS |
| `python3 scripts/test-earnings-normalization-v4.py` | 16/16 PASS |
| `python3 scripts/test-vn30-fy2025-analysis-acceptance.py` | 14/14 PASS |
| `python3 scripts/test-held-normalization.py` | 31/31 PASS |
| `python3 scripts/test-underwriting-remediation.py` | 28/28 PASS |
| `PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH pnpm exec vitest run tests/unit/economic-normalization.test.ts tests/unit/review-lineage.test.ts tests/integration/review-lineage.test.ts tests/unit/personal-ai-scoring.test.ts tests/unit/personal-ai-provenance.test.ts tests/integration/personal-ai-scoring.test.ts` | 6 files / 102 tests PASS |
| `PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH node scripts/verify-approved-scoring-authority.mjs` | PASS: 37 artifacts, 133 historical files unchanged, 9 compatibilities |
| `git diff --check` | PASS |

**222 tests passed.** No full-release PASS claim.

New validation covers exact 19/30 coverage; byte preservation of prior 11 dossiers; all inputs/output/index pins; actual parent/NCI capital bridges; BSR's printed subtotal conflict without rewriting issuer bytes; GVR's non-equity funding exclusion; absent NCI remaining unknown rather than zero; standalone NCI being inapplicable; period/unit/review/component mismatch rejection; replay of all 672 signed scenarios and the clean-surplus identity; VJC losses and recapitalization needs without zero-floor or a selected recovery base; VIC without a midpoint/common base; MSN preference/make-whole unknown; mixed-group crosschecks not RNAV/SOTP; absent price targets/signals/authority; raw CafeF cell replay with no unit guess; exact-page period overlays for LPB/VHM/VIC; VHM's extracted NCI magnitude exception; TCX date-key/row-page schema support; and numeric provider differences not overwriting PDF.

20 full PDF pages were rendered and visually inspected: one FY2025 closing-equity page for each of the 19 issuers, plus MSN preference terms on physical page74. Source files/hashes, physical pages, native values/units, period bindings and review limitations are recorded in checked-capital-readings.json. No whole-statement financial review is asserted. Temporary renders and the temporary PyMuPDF environment are removed after review; source PDFs and all original extracted/API JSON remain intact.

Source-reading corrections during implementation: the first selector looked only for annual key2025/group-level pages. The expanded check showed that LPB/VHM/VIC use unresolved closing-column keys, and TCX already has extracted data under key2025-12-31 with page evidence at row level. The final adapter supports those exact layouts without claiming a missing TCX report. A first test expected document absence; it was corrected to assert the observed schema and actual existing row evidence. VHM's extracted NCI value is preserved as a candidate exception; the checked PDF value is used in the capital bridge. No original JSON is silently corrected.

Model limitations: all horizons/return persistence are analyst scenarios, not issuer forecasts. Cost sensitivities18/15/12% are inherited from prior research and do not modify BUY criteria. Signed residual-income arithmetic does not prove recoverable book value, distributable regulatory capital, cash capex, debt service, future ROE or preferred-claim value. Negative diagnostic equity is not a negative quoted share price. VHM/VPL/MSN retain accounting-return crosscheck status; VIC/VJC have no selected valuation base. Numeric results remain before unmodeled economic claims; unknown claims are not recorded as zero. Market references remain October30 and no new per-share targets or current buy/hold/sell signals are issued for the 19.

Approved scoring authority remains `8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1`.

Database SHA-256 before/after: `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65`.

No production DB posting, source promotion, criterion/weight change, NAV/scoring/trading activation, deployment, push or merge. The new governance index points only to the current research snapshot; it is not a production acceptance receipt.
