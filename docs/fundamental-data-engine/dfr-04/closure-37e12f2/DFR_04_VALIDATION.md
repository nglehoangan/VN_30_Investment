# DFR-04 closure validation — PASS in bounded scope

Baseline: `37e12f2cfbde5ebe66c4fc3b16882372cf6aa5a8`. Six pilots, 138 exact dispositions, 72 mapping/judgment cases processed. 11 new assessments; 25/138 completed; 113 deferred. Zero complete scorecards. Remaining classes: {"EXISTS_MAPPING_INCOMPLETE": 56, "GENUINELY_ABSENT": 22, "VALUATION_MARKET_DEPENDENCY": 30, "EXISTS_ANALYST_JUDGMENT": 5}.

- Closure contract/adversarial suite: 31/31 PASS. Covers exact bands/full topics, all evidence-ready cases, issuer/topic rejection, source conflicts, exact decimal reconciliations, six sectors, TCX small bond tranche and 1-VND conflict, owner decisions, no missing-as-zero, and immutable prior 14 assessments.
- Existing DFR02 suite: 25/25 PASS. Includes FY2022–25 comparability, VHM NCI, VIC closing columns, TCX date keys, unknown CaféF units and HPG zero-cashflow fixture.
- Existing DFR04 suite: 20/20 PASS. Existing sealed outputs, financial parity and prior preparation/challenge remain valid.
- Actual production entry points rejected all 54 probes: formal scoring, root/nested ranking, decisions, DCA, NAV, ledger builder, DI acceptance and AI provenance. No runtime source or production authority changed.
- Approved scoring authority: 37 artifacts / 133 historical files / 9 compatibilities PASS; content hash `8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1` unchanged.
- 10062 baseline tracked/protected/source/data files hash-identical, including active SQLite/sidecars if present and M1–M8. DFR02 financial arrays unchanged for all six issuers. No database writes, financial data correction, new acquisition, new cutoff or owner approval.

`validation-results.json` retains final closure/boundary process output and explicitly identifies earlier observed predecessor regressions from this execution. `inspection.json` records original hashes; `manifest.json` binds deliverables, JSON, evidence spec and implementation. Preparation and challenge are separate AI passes, not independent human review. Image-qualified pages are distinguished from retained-text-only context; PDF notes remain unpromoted research evidence.

Two legacy aggregate debt mapping exceptions are contained outside new assessment inputs (VIC/VHM); their dependent legacy reference branches remain unresolved. TCX arithmetic and EPS-note numerator agree but printed common row differs by 1 VND; the minor conflict remains. No silent issuer-wide downgrade or source replacement.

These are research-boundary validations, not whole-application release acceptance. All unresolved covenant, restriction, action, cohort, nonfinancial and valuation dependencies remain explicit. Owner acceptance is PENDING; no DFR05, issuer expansion or production activation.
