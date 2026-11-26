# WP2 Financial Health Amendment v1.2 · FPT closure

**Research result.** Both FY2025 and cutoff assessments support **FH-LIQ 2/4** and **FH-STRESS 2/5** under the new Method A risk bands. The cutoff scores are `CONFIRMED_CURRENT` for the risk profiles. Together with the accepted FH-BS 3/6, they give **Financial Health 7/15**. Accepted Business Quality contributes **14/25 PROVISIONAL**. Combined research coverage is **21 points on 40/100 rated weight across 7/23 rubrics**. The full Investment Score is null.

The owner approved route-specific risk-profile semantics for FH-LIQ and FH-STRESS, with isolated FPT execution. Method B retains its direct bands and takes priority. The previous input had no analyst proposal and failed `BASIC_ECONOMIC_CONCLUSION_NOT_ESTABLISHED`. v1.2 records an explicit risk proposal, supporting findings and counterevidence before validation. The v1.1 direct-adequacy or survival conclusion remains unresolved on the old input. No external evidence was acquired. [Owner direction](OWNER_REQUEST.txt) · [Discrepancy review](../dual-route-v1.1/FH_AB_ANALYST_EXECUTABLE_DISCREPANCY_REVIEW.md) · [Amendment](../../../03%20SCORING/WP2_FINANCIAL_HEALTH_ANALYST_RISK_v1.2.json)

## Amendment controls

The AR numbering maps owner requirements to implementation. The chosen schema, findings keys, dimension mapping, pins and isolation controls are implementation decisions. FH-BS remains capped at 6, LIQ at 4 and STRESS at 5 for a Financial Health maximum of 15 and Investment Score maximum of 100. The formal registry, Risk Policy and the other 16 rubrics are outside this change.

| Control | Owner direction | Disposition |
| --- | --- | --- |
| AR01 | §1 · Owner scope and research-only authority | Implemented within FPT research scope |
| AR02 | §4 · Preserve weights and canonical B bands | Implemented within FPT research scope |
| AR03 | §4 · Version A risk bands | Implemented within FPT research scope |
| AR04 | §5 · Retain B-first and adverse evidence | Implemented within FPT research scope |
| AR05 | §6 · Reuse source-bound facts, calculations, estimates and assumptions | Implemented within FPT research scope |
| AR06 | §7 · Use liquidity risk profile findings | Implemented within FPT research scope |
| AR07 | §8 · Use scenario-based vulnerability findings | Implemented within FPT research scope |
| AR08 | §7 · Preserve ceilings of 3/4 and 4/5 | Implemented within FPT research scope |
| AR09 | §10 · Record proposal and adjacent-band rationale | Implemented within FPT research scope |
| AR10 | §9 · Validate band-specific supporting findings | Implemented within FPT research scope |
| AR11 | §11 · Review counterevidence and invalidation | Implemented within FPT research scope |
| AR12 | §12 · Reuse five confidence dimensions and keep score independent | Implemented within FPT research scope |
| AR13 | §13 · Retain freshness, maturity and historical eligibility | Implemented within FPT research scope |
| AR14 | §14 · Keep research qualification through consumers | Implemented within FPT research scope |
| AR15 | §14 · Preserve formal gates and mixed-route limitations | Implemented within FPT research scope |
| AR16 | §16 · Execute both FPT rubrics for both periods | Implemented within FPT research scope |
| AR17 | §17 · Amend six reusable skills | Implemented within FPT research scope |
| AR18 | §18 · Verify regressions and preserve v1.1 replay | Implemented within FPT research scope |

## Method A bands

The exact owner wording and the additional qualifiers are in [§7.3 and §8.3 of the owner direction](OWNER_REQUEST.txt).

| Points | FH-LIQ risk band | FH-STRESS risk band |
| --- | --- | --- |
| 0 | `CRITICAL_LIQUIDITY_DISTRESS` · Economically established critical distress, uncovered obligations or inability to meet material commitments without credible mitigation. | `CRITICAL_STRESS_FAILURE` · Strong evidence of inability to withstand severe plausible stress. |
| 1 | `WEAK_LIQUIDITY_RISK_PROFILE` · Weak liquidity resources, material weakness in generation or servicing and severe dependence on external financing. | `SEVERE_FINANCIAL_FRAGILITY` · Very weak stressed capacity and serious dependence on potentially adverse financial actions. |
| 2 | `MATERIAL_REFINANCING_RISK_WITH_FINANCIAL_CAPACITY` · Meaningful financial capacity alongside material refinancing or liquidity risk. | `MATERIAL_STRESS_VULNERABILITY` · Material financial pressure and vulnerability in a severe plausible scenario, supported by stress calculations and economic evidence. |
| 3 | `SOUND_LIQUIDITY_RISK_PROFILE` · Affirmative adequate buffers, cash generation and manageable refinancing dependence. | `ADEQUATE_STRESS_BUFFER_WITH_MATERIAL_CONSTRAINTS` · Meaningful buffer and manageable pressure, with material constraints remaining. |
| 4 | Ineligible for A. | `STRONG_STRESS_RESILIENCE` · Strong stressed capacity, substantial buffers, manageable funding pressure and meaningful robustness across plausible sensitivities. |
| 5 | Outside FH-LIQ. | Ineligible for A. |

Missing facts alone cannot establish any band. Validation checks usable references, a supported band-specific finding set, adjacent-band rationale, explicit counterevidence effects, qualified resource treatment, confidence, ceilings, and assessment eligibility. It validates the analyst's proposal without assigning points from ratios. [Risk evaluator](../../../../src/domain/current-scoring/fh-analyst-risk.ts)

## FPT analyst-to-executable trace

| Rubric | Period | Method B result | Method A analyst band | Executable validation | Executable score | Effective Score |
| --- | --- | --- | --- | --- | --- | --- |
| FH-LIQ | FY2025 | N/R. `MATCHED_TIMING_UNRESOLVED`, `COVENANT_DISPOSITION_UNRESOLVED` | Material refinancing risk with financial capacity | Accepted, zero A gaps | 2/4 CONSERVATIVE | Valid FY baseline, 2/4. Superseded by cutoff. |
| FH-LIQ | 13 Nov 2026 | Same B gaps | Material refinancing risk with financial capacity | Accepted, zero A gaps | 2/4 CONSERVATIVE | 2/4 CONFIRMED_CURRENT |
| FH-STRESS | FY2025 | N/R. `CAPITAL_CONCLUSION_UNRESOLVED` | Material stress vulnerability | Accepted, zero A gaps | 2/5 CONSERVATIVE | Valid FY baseline, 2/5. Superseded by cutoff. |
| FH-STRESS | 13 Nov 2026 | Same B gap | Material stress vulnerability | Accepted, zero A gaps | 2/5 CONSERVATIVE | 2/5 CONFIRMED_CURRENT |

- **LIQ FY2025.** Observed CFO was VND 10.136tn, direct EBIT/gross interest 13.57×, and historical draws and repayments VND 43.071tn and VND 36.891tn. Cash-only coverage was 0.55× and short debt 91.0% of debt. The 2.09× book cash-plus-deposit ratio conveys scale. Actual unrestricted balances, access and future funding remain unverified. Counterevidence is `UNRESOLVED_NON_INVALIDATING` for the 2-point profile. Band 3 lacks reliable buffers and manageable rollover, while the earnings, CFO and financing activity give stronger capacity than band 1. Confidence **8/10** (2/1/2/2/1), based on eligible dated FY sources.
- **LIQ cutoff.** 9.63× direct coverage and positive 9M CFO of VND 0.952tn support capacity. Cash-only coverage of 0.52× and short debt of 86.3% support material rollover exposure. Book cash and deposits at 1.97× short debt leave actual access unresolved. The FTEL bridge qualifies the current scope and duration. Counterevidence is `UNRESOLVED_NON_INVALIDATING`. Band 3 lacks qualified buffers and manageable rollover; band 1 overstates weakness given direct earnings service and positive CFO. Confidence **7/10** (2/1/2/1/1), based on the current cutoff review.
- **STRESS FY2025.** Retained severe scenario interest coverage is 3.65× and FCF is −VND 4.674tn. Residual cash moves from −VND 6.917tn to +VND 0.491tn as assumed deposit access moves from 25% to 50%. High short debt and material modeled FCF needs support band 2. Positive operating performance under stress and cash flexibility argue against band 1; band 3 lacks a demonstrably meaningful and manageable buffer. Counterevidence is `BOUNDED_LIMITATION`. Confidence **7/10** (2/1/2/1/1), based on the FY scenario and eligible source window.
- **STRESS cutoff.** The retained severe scenario has 3.05× interest coverage, VND 0.149tn operating cash and −VND 2.556tn FCF. Residual cash spans −VND 5.145tn to +VND 0.075tn across the same deposit assumptions. Positive interest cover argues against band 1; low residual headroom, significant maturities and negative FCF support band 2 and leave insufficient support for band 3. Counterevidence is `BOUNDED_LIMITATION`. Confidence **7/10** (2/1/2/1/1), based on the post-FTEL scenario and cutoff review.

Each stress assessment also checks a one-factor 50% reduction in the scenario working-capital outflow and a separate 50% CAPEX reduction. FCF remains negative in both one-factor checks. These are analyst sensitivities. Deposit access affects the residual buffer and does not change operating FCF. Exact refinancing, unrestricted cash, deposit accessibility, required CAPEX and future capital actions remain limitations. The five confidence dimensions are freshness, completeness, source reliability, estimate dependence and model/cycle uncertainty. Their 0–10 total stays independent of points and provides no exemption from the original Risk Policy. [Analyst proposals and sensitivity details](FPT_FH_ANALYST_RISK_ASSESSMENT.json) · [Executable evidence and lineage](FPT_FH_ANALYST_RISK_RESULT.json)

## Execution, downstream and authority


The serial FPT job completed under execution `exec-5532255d06ee7b93e497688e` and queue `queue-63bd8d0cc0f981c7119198d4`. Prepare bound the input and method qualifications. Adoption and Preflight pinned isolated research authority and exact bytes. Scoring replayed the evaluator and required Prepare equality before passing qualified rows into aggregation, research comparison/ranking, Decision input and the research scorecard. [Candidate](CANDIDATE.json) · [Workflow receipt](FPT_FH_ANALYST_RISK_WORKFLOW_RESULT.json)

The four accepted BQ rows and FH-BS matched replay. Four current rows cover 21/100 weight and three provisional BQ rows cover 19/100. Genuine in-scope N/R is 0; outside the rollout is 16 rubrics and 60/100. The single-name comparison has no rank ordinal. A and B share ordinal direction, with distinct semantics and no validated cross-route cardinal equivalence.

Stage 0 remains UNKNOWN, Hard Veto PENDING, residual risk NOT_RATED, and formal FH and valuation gates NOT_ASSESSED. All four A judgments are conservative research only. Current validity certifies current risk-profile eligibility. Historical carry requires an affirmative eligible review, is provisional, and is blocked by expiry, funding applicability or confirmed invalidation. Current funding risk, unknown resource access, and the FTEL scope transition remain explicit. Formal ranking, actionability and publication remain disabled.

The six existing skills now use v1.2 for FH-LIQ/FH-STRESS only, with versioned precedent links, separate proposal and validation, counterevidence, confidence, freshness and downstream restrictions. Ticker, period, normalization and category remain reusable.

## Exact working-tree identities

Base HEAD `302003c8dca99aa1dd1aadc6f6c1cb17a43d2fe1`. The v1.2 changes are working-tree artifacts. v1.1 artifacts remain available under their original pins.

| Artifact | SHA-256 |
| --- | --- |
| `WP2_FINANCIAL_HEALTH_ANALYST_RISK_v1.2.json` | `e6449f12c24109ec4997b5413b2998a2dd67052df423614a794c266cc093d79a` |
| `fh-analyst-risk.ts` | `f53c75a0357954fa0920ce949fa1ccc070c3c851c361bb13bdb609f9eb2eb253` |
| `validate_fpt_fh_analyst_risk.mjs` | `166d9767b864bff635a1cf9397998dccd9b0e61a30ef0e426fb108addf088a24` |
| `vn30_fh_analyst_risk.py` | `bb850dc9a5bb0089d7e2ba3a9dca3a9f220314d0284dae8c8ee94ca1b18d1f81` |
| `CANDIDATE.json` | `09d852d80c619d4e824a0e316cac58971ebf7f70c3b4110474c5aa28d8b110b9` |
| `FPT_FH_ANALYST_RISK_ASSESSMENT.json` | `695e03e2d8fbdec11fb1ee17cac227f2bc9d63c06674595ba24f769cea919fc9` |
| `FPT_FH_ANALYST_RISK_RESULT.json` | `2f89613a4ed9cd0211a1308ace0c0a2dc5eaa484cc125fdab57de358f8d7bfea` |
| `FPT_FH_ANALYST_RISK_WORKFLOW_RESULT.json` | `4103adf625a1705f7cef601869c9f1b670ed9da0a2fd1ca5b733364ec227b7f7` |
| `TEST_RESULTS.json` | `6c153f55d86b3239e93451a064e5721047cb5f080539ffb8a32901cbc0dbafe8` |

## Regression and acceptance

**285/285 focused TypeScript tests passed**, including 12 v1.2 cases and all 33 formal integration cases. The final run used Vitest's Node environment with `NODE_OPTIONS=--experimental-sqlite` on Node 22.12.0. **33/33 Python tests passed**, including exact v1.1 and v1.2 workflow replay, accepted-row binding and publication rejection. Formal parity returned `CURRENT_PARITY_PASS`. The isolated official V8 regression reproduced the original scorecard ID and exact-scope restriction, and the official controller still matched its approved pin. The repository-wide typecheck still reports five existing errors across the ACB Clock/Instant boundary and three tests importing retired scripts. None is in an amended file. [Test results](TEST_RESULTS.json)

**Recommendation.** Accept v1.2 for the isolated FPT research scope and retain the four Method A findings and their restrictions. The cutoff Effective Scores are suitable for the qualified analytical consumers recorded in the receipt. Formal adoption, production scoring, publication and WP3 are outside this closure.
