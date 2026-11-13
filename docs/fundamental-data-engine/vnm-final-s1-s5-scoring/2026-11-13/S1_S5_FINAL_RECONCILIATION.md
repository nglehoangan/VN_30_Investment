# Final S1–S5 reconciliation — VNM

Baseline `39a116ed49c76ea32c89479b4fc1619e49053dac`; actual review knowledge `2026-11-13T04:58:27.000Z`. **Outcome B: definitive bounded blockers remain.** This is the final reconciliation, not another milestone or proposed remediation campaign.

Original S1–S5 definitions: `docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/VNM_OWNER_DECISIONS.md` and its evidence-products/rubric matrix. Subsequent 12 November RAW CLOSE, carry-forward, governance correction, unified source and standing-v4 decisions supersede the older price-adjustment and per-material/source-approval demands. The 13 November F2 assessment separates financial source availability from mappings, admission and consumers.

The 65 VNM canonical facts are loaded verbatim from `fundamental_admission_run/reviewed-vn30-20261019-VNM`, with existing qualification flags and body hash in VNM_SCORING_INPUTS.json. They are **not requalified**. Reported accounting facts do not by themselves establish normalized owner earnings, unrestricted cash, funded forecasts or an adopted rubric judgment. No new financial statement, PDF, source approval, per-material receipt or industry research is requested.

| Original issue | Disposition | Exact residual or closure |
| --- | --- | --- |
| S1 | BLOCKING | No accepted normalized NOPAT/common-return/economic-capital spread; project contribution/commissioning outcomes remain unverified. A specific cohort register is one evidence option, not a prescribed new file. |
| S2 | BLOCKING | RestrictionStatus and availableForStressVnd remain UNKNOWN/null for deposit instruments; exact dates/covenants/committed facilities do not establish a defensible coverage range. Neither survival nor distress is proven. |
| S3 | BLOCKING | Retained share/cost_position/distribution claims use incompatible definitions; no adopted, supported IC-POS band. Missing external peer percentiles alone is NON-BLOCKING; absolute/own-history evidence may substitute under §13.3, but no substitute is fabricated here. |
| S4-RAW | CLOSED | CaféF GiaDongCua 56.9 × 1000 = 56,900 VND/share at 2026-10-30; raw adjustment methodology excluded by owner. |
| S4-R1 | CLOSED | Coverage limitation preserved; no exhaustive negative search or independent zero-treasury claim. |
| S4-R4 | CLOSED | CLOSED_BY_SCOPE_EXCLUSION / EXCLUDED_BY_OWNER_POLICY; adjustment field retained only for audit. |
| S4-HISTORY | NON-BLOCKING | Historical completeness and PIT/total-return qualification are separate purposes, not prerequisites for a single current-use raw closing observation. |
| S4-ADMISSION | BLOCKING | 30Oct F1 still fails existing dated membership coverage (17–30Oct); F2 v4 native adapter only TOTAL_ASSETS, no full current-scoring bridge. VNM17 proposal remains pending and is not used as authorization. |
| S5 | BLOCKING | Accepted sustainable earnings, maintenance/growth/strategic-use overlap, funded volume/price/utilization/credit-stress effects, discount/terminal realization/distribution/dilution case and supported expected return are null/unadopted. Q3 report is known and must inform current trajectory; H1-only inputs are provisional. |

## Exact evidence and policy reconciliation

### S1 — Matched recurring return/economic capital and allocation outcomes

**BLOCKING**. Resolved: Retained annual statements, common-profit/fund/share chronology, deployments and capital diagnostics exist; they are not missing source statements.

Remaining: No accepted normalized NOPAT/common-return/economic-capital spread; project contribution/commissioning outcomes remain unverified. A specific cohort register is one evidence option, not a prescribed new file.

Approved requirement: METRIC_DEFINITIONS §§3.3,4.1,6.3,10,13.1; scorecard RUBRICS returns/cost_of_capital, incremental_return/denominator/unit_economics.

Evidence: `docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/evidence-products.json` `#/capitalCohorts`; `docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/evidence-products.json` `#/returnsSensitivity`; `docs/fundamental-data-engine/vnm-final-scoring-closure/2026-11-11/six-rubrics.json` `#/rows/1`; `docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-04/earnings-normalization-v4/issuers/VNM.json` `#/acceptedNormalizedCommonEarningsVnd`

New user-supplied information: NO to conclude this bounded assessment; an evidenced economic equivalent/return attribution is needed only to obtain a final score. No statement resubmission.

### S2 — Available legal-entity liquidity versus dated unavoidable commitments

**BLOCKING**. Resolved: Cash/deposits/borrowing/lease/capex amounts, declaration/payment bridge and stress break-even sensitivities retained.

Remaining: RestrictionStatus and availableForStressVnd remain UNKNOWN/null for deposit instruments; exact dates/covenants/committed facilities do not establish a defensible coverage range. Neither survival nor distress is proven.

Approved requirement: METRIC_DEFINITIONS §§5.2,5.3,10.1,13.1; RUBRICS obligations/liquidity/maturities/covenants and scenario/funding_response/capital_response.

Evidence: `docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/evidence-products.json` `#/liquidityLadder`; `docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/evidence-products.json` `#/stressCases`; `docs/fundamental-data-engine/vnm-final-scoring-closure/2026-11-11/six-rubrics.json` `#/rows/0`

New user-supplied information: NO new file required for this report. Instrument availability/commitment facts or a defensible bounded equivalent remain unavailable in the reviewed evidence; simple owner assertion that all deposits are free is insufficient.

### S3 — Evidence-supported competitive-position judgment

**BLOCKING**. Resolved: Issuer distribution/brand/reach claims, own-history economics and reported geographic sales retained; new industry research and a mandatory peer table are not required by M3.

Remaining: Retained share/cost_position/distribution claims use incompatible definitions; no adopted, supported IC-POS band. Missing external peer percentiles alone is NON-BLOCKING; absolute/own-history evidence may substitute under §13.3, but no substitute is fabricated here.

Approved requirement: RUBRICS IC-POS topics share/cost_position/distribution; METRIC_DEFINITIONS §§7.2,13.2–13.3; SECTOR_NORMALIZATION §§2,3,8.

Evidence: `docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/evidence-products.json` `#/positionDefinitions`; `docs/fundamental-data-engine/vnm-final-scoring-closure/2026-11-11/six-rubrics.json` `#/rows/2`

New user-supplied information: NO industry-research request or new mandatory user-supplied table. Current IC-POS judgment remains N/R; missing unsupported judgment is not neutral/zero.

### S4-RAW — Daily raw close at retained cutoff

**CLOSED**. Resolved: CaféF GiaDongCua 56.9 × 1000 = 56,900 VND/share at 2026-10-30; raw adjustment methodology excluded by owner.

Remaining: None in this bounded use.

Approved requirement: CAFEF_RAW_CLOSE_ONLY_POLICY; source policy admits RAW CLOSE only; no GiaDieuChinh fallback.

Evidence: `data/market-history/cafef/VNM.json` `#/prices/1196`; `docs/fundamental-data-engine/vnm-s4-skills/2026-11-11/CAFEF_UNIT_SOURCE.json`

New user-supplied information: NO

### S4-R1 — Outstanding-share selection at cutoff

**CLOSED**. Resolved: 2,089,955,445 shares carried from Q3 Note22/page59 under separately owner-approved rule; reviewed interval 2026-10-01 through 2026-10-30, no effective change found in reviewed documents.

Remaining: Coverage limitation preserved; no exhaustive negative search or independent zero-treasury claim.

Approved requirement: CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY; no new share-count certification.

Evidence: `docs/fundamental-data-engine/vnm-s4-share-carry-forward/2026-11-12/REVIEW.json`

New user-supplied information: NO

### S4-R4 — Adjusted-price methodology

**CLOSED**. Resolved: CLOSED_BY_SCOPE_EXCLUSION / EXCLUDED_BY_OWNER_POLICY; adjustment field retained only for audit.

Remaining: None in this bounded use.

Approved requirement: Owner RAW CLOSE ONLY policy.

Evidence: `docs/fundamental-data-engine/CAFEF_RAW_CLOSE_ONLY_POLICY.md`

New user-supplied information: NO

### S4-HISTORY — Three historical sessions and complete historical action/PIT chain

**NON-BLOCKING**. Resolved: Retained merged/Vietstock history is separate from immutable 1,197 CaféF rows; selected cutoff close unaffected.

Remaining: Historical completeness and PIT/total-return qualification are separate purposes, not prerequisites for a single current-use raw closing observation.

Approved requirement: Owner raw-close policy and purpose-separated standing authority; do not require full price history or adjustment methodology for raw close.

Evidence: `data/market-history/VNM.json`; `data/market-history/vietstock/VNM.json`

New user-supplied information: NO

### S4-ADMISSION — Formal current consumption of selected price/share/financial inputs

**BLOCKING**. Resolved: U1 CLOSED; approved F1/F2 sources valid. Real isolated F1 16Oct and F2 TOTAL_ASSETS admission/consumption passed with zero material receipts.

Remaining: 30Oct F1 still fails existing dated membership coverage (17–30Oct); F2 v4 native adapter only TOTAL_ASSETS, no full current-scoring bridge. VNM17 proposal remains pending and is not used as authorization.

Approved requirement: Standing-v4 observation controls; ScoringEngine.score FORMAL_SCORING_DATASET_REQUIRED; CurrentEvidenceTime accepted only with CURRENT_FORMAL_VALUATION purpose.

Evidence: `docs/fundamental-data-engine/standing-authority-version/2026-11-12/F1_F2_REAL_ADMISSION_VALIDATION.json`; `docs/fundamental-data-engine/unified-final-acceptance/2026-11-12/U2_MEMBERSHIP_COVERAGE.json`; `docs/fundamental-data-engine/standing-authority-version/2026-11-12/VERSIONED_SOURCE_REGISTRY.json` `#/authorities/1/validatedAdapterScope`; `docs/fundamental-data-engine/f2-full-coverage-assessment/2026-11-13/F2_ADMISSION_CAPABILITY_GAPS.md`

New user-supplied information: NO renewed source/material approval; this is a dated-evidence/consumer capability gap. Do not reopen source discovery or U2 research in this execution.

### S5 — Funded current recurring common-cash forecast and valuation inputs

**BLOCKING**. Resolved: Reported FY2022–25 financial/EPS/fund bridges and numerical scenarios are retained, not requalified or discarded.

Remaining: Accepted sustainable earnings, maintenance/growth/strategic-use overlap, funded volume/price/utilization/credit-stress effects, discount/terminal realization/distribution/dilution case and supported expected return are null/unadopted. Q3 report is known and must inform current trajectory; H1-only inputs are provisional.

Approved requirement: METRIC_DEFINITIONS §§3,6,8,13.4,14 and valuation rubric topics; explicit conservative estimates/ranges allowed, arbitrary assumptions or probabilities not allowed.

Evidence: `docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/evidence-products.json` `#/parentForecastOptions`; `docs/fundamental-data-engine/vnm-final-scoring-closure/2026-11-11/valuation-decision.json` `#/ownerDecisions`; `docs/fundamental-data-engine/vnm-final-scoring-closure/2026-11-11/valuation-decision.json` `#/acceptedExpectedFiveYearReturn`; `docs/fundamental-data-engine/f2-full-coverage-assessment/2026-11-13/F2_REQUIRED_METRIC_MATRIX.json` `#/summary/sourceInventoryByTicker/VNM`

New user-supplied information: NO new PDF/source approval required. An evidence-backed current forecast/valuation judgment is needed for an auditable score; approval alone cannot make unknown cash/return facts true.

## Scope rulings

- **S4 accepted facts stay accepted for their selected uses.** Raw close 56,900 VND and carried-forward shares 2,089,955,445 are not reopened. Adjusted series is EXCLUDED_BY_OWNER_POLICY; R1/R4 remain CLOSED. The 15 historical cash-dividend components remain reviewed historical evidence, not sustainable future DPS or portfolio cash receipts.
- **Three historical sessions are filled in the retained merged index.** `data/market-history/VNM.json` retains 1,197 CaféF plus three owner-XLS Vietstock observations (1,200 total). This preserves provider namespaces and does not alter CaféF raw responses. Historical replay/action completeness is NON-BLOCKING for the selected raw-close use; historical total return/PIT is not established.
- **U1 is CLOSED and F1/F2 standing approvals are VALID.** No new per-material or repeated source approval is required. The existing dated U2 market result and F2 bounded adapter/current-consumer limitations are reported, not restarted. Financial-statement and corporate-action adapters have different scope.
- **PIT is not newly imposed on current scoring.** The current Evidence validator accepts actual later operational knowledge with explicit CURRENT_FORMAL_VALUATION. The existing scorer calls its strict default and its dataset bridge is FORMAL/AS_KNOWN. That is a concrete consumer mismatch, not a request to obtain historical publication timestamps. Backdating or changing the consumer contract is outside this final assessment.
- **A new peer/industry table is not universally mandatory.** M3 §13.3 permits own-history/absolute economics. What remains unsupported is an adopted IC-POS judgment covering its actual evidence topics; it stays N/R rather than receiving a default midpoint.
- **A literal S1/S2/S5 schedule is not the only admissible format.** M3 §13.1 permits principle-equivalent evidence or a defensible range. Existing diagnostics have not established such decision-grade equivalents; missing values are not made true through approval.

No new user-supplied information is needed to complete outcome B. To produce a final score, the specific unresolved economic facts/judgments and existing scorer bindings identified in FINAL_BLOCKER_REGISTER.md must actually exist; no generic source search, resubmission, new milestone or approval loop is requested. VNM17 remains pending and unused as authority.
