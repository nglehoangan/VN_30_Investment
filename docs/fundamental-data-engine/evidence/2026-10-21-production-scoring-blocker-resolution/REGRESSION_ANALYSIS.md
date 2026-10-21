# Regression analysis

Starting failure population:19. Current failure population:18. Exact historical18-case set restored; unexplained new regressions=0. Full suite is not green.

## Newly observed stale database expectation

The old TCBS test compared current SQLite bytes with the pre-activation19October fingerprint. The Owner-approved20October activation audit records the exact transition from559ba... to45fa...,18 additive inserts,0 updates/deletes and0 accounting/portfolio/scoring/rank/decision changes. The database already matched the approved45fa... before this task; a test failure was not evidence that this task or the pipeline mutated it.

The minimal repair verifies the activation audit against its sealed hash ledger, proves its before hash equals the original protected baseline, checks the approved insertion/no-change semantics and current starting bytes equal its after hash. The existing named fingerprint test now checks unchanged run-start bytes; an afterAll guard covers the entire test file. This retains fixed approved-state corruption detection and expands write protection to the preopen case that formerly followed the fingerprint assertion. No fresh arbitrary fingerprint, latest-wins selector, skip or historical allowlist edit was introduced. A future legitimate DB authority transition needs its own accepted checkpoint evidence; this test does not auto-approve it.

Focused124/124 pass; full2056pass/18fail. The previously failing exact case identity now passes. The following18 historical cases remain visible, with specific root evidence in QUALITY_GATE_RECONCILIATION.json.

| Case | Primary classification | Root cause | Current |
|---|---|---|---|
| integration/tcbs-pipeline.test.ts::protected production database bytes retain starting fingerprint | stale expectation | stale expectation | passed |
| unit/consumer-retail-ticker-closure.test.ts::33 all seven protected source and evidence hashes remain unchanged | historical known baseline | environment-dependent | failed |
| unit/consumer-targeted-fix.test.ts::All protected evidence and approved contracts retain their original hashes | historical known baseline | environment-dependent | failed |
| unit/consumer-targeted-fix.test.ts::VNM original PDF is bound to exact retained bytes | historical known baseline | environment-dependent | failed |
| unit/di-governance-closure.test.ts::6 retained original HPG PDF hashes still match physical bytes | historical known baseline | environment-dependent | failed |
| unit/di-governance-closure.test.ts::7 VJC independent producer replay is deterministic with explicit ticker | historical known baseline | environment-dependent | failed |
| unit/di-governance-closure.test.ts::8 GVR independent producer replay is deterministic with explicit ticker | historical known baseline | environment-dependent | failed |
| unit/energy-ticker-closure.test.ts::29 all approved closures and production contracts unchanged | historical known baseline | environment-dependent | failed |
| unit/fpt-ticker-closure.test.ts::deterministic replay requires no temporary extraction files | historical known baseline | environment-dependent | failed |
| unit/gvr-ticker-closure.test.ts::33 all 13 approved closures, sources, contracts and prior tests remain unchanged | historical known baseline | environment-dependent | failed |
| unit/gvr-ticker-closure.test.ts::retained originals exist and current inventory components reconcile including provision | historical known baseline | environment-dependent | failed |
| unit/real-estate-ticker-closure.test.ts::23 offline replay binds originals and raw bytes without disposable extraction | historical known baseline | environment-dependent | failed |
| unit/tcx-ket-vang-targeted.test.ts::TCX final targeted FY2022 Két Vàng forensic boundary 19 SSI closure unchanged | historical known baseline | environment-dependent | failed |
| unit/tcx-ket-vang-targeted.test.ts::TCX final targeted FY2022 Két Vàng forensic boundary 20 all 15 approved closures and primary TCX evidence unchanged | historical known baseline | environment-dependent | failed |
| unit/tcx-ket-vang-targeted.test.ts::TCX final targeted FY2022 Két Vàng forensic boundary 22 no denominator or contract modifications | historical known baseline | stale expectation | failed |
| unit/tcx-ticker-closure.test.ts::TCX Level-1 canonical accounting isolation and semantics 32 SSI protected evidence unchanged | historical known baseline | environment-dependent | failed |
| unit/tcx-ticker-closure.test.ts::TCX Level-1 canonical accounting isolation and semantics 33 all 15 approved closure artifacts and bound sources unchanged | historical known baseline | environment-dependent | failed |
| unit/vjc-ticker-closure.test.ts::40 all 14 approved closures and existing contracts unchanged | historical known baseline | test defect | failed |
| unit/vjc-ticker-closure.test.ts::all retained transcriptions qualify and all five source PDFs are hash-bound | historical known baseline | environment-dependent | failed |

## Why historical files were not restored or assertions loosened

Owner-directed reset/cleanup deliberately removed old-layout source files and OCR readers. Retained current results and canonical admission are separate evidence from a fresh historical source replay. Recreating old paths as symlinks, copying historic amounts or silently marking a replay PASS would violate current instructions. The old missing-source tests remain failures. The pre-existing debt-contract pin mismatch and absent duplicate .gitattributes artifact are also retained with their history.

These are explicitly pre-existing known baseline failures, not newly introduced implementation defects. They do not show a new arithmetic or authority regression from the one test repair. They also do not certify current runtime readiness: WorkstreamC still requires independently reproducible source/availability/bridge proof and remains blocked. No production scoring is authorized while that proof is missing.
