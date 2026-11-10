# TCB Analyst Scenario Sandbox v1.0 — final review

**RESEARCH_ONLY · HYPOTHETICAL · NOT_AN_APPROVED_INTRINSIC_VALUE · NOT_FOR_M3_M4_OR_PRODUCTION**

TCB only,2026-11-10. Historical FY2025accounting anchors plus configurable illustrative assumptions. No market price, formal intrinsic value, M3/M4or production purpose.

**READY_FOR_OWNER_SANDBOX_REVIEW**, subject to successful isolated technical/financial validation. This is sandbox readiness only. GitHubmain/local latest commit is `cf9872710d5a1135c856566077c44ad5768f595b`; the new implementation remains uncommitted. Changed files are restricted to this dedicated folder and enumerated in `changed-files.json`/`manifest.json`. Stale predecessor commit-status metadata is corrected by the successor overlay; original approved files/receipts remain intact.

| Case | ROE | ke | g | Payout | Hypothetical P/B | Hypothetical equity, trillion VND | Hypothetical per-share model value,VND | Capital status |
|---|---:|---:|---:|---:|---:|---:|---:|---|
|BEAR|8.00%|16.00%|2.00%|75.00%|0.428571|72.876216|10,284.19|CAPITAL_INFEASIBLE|
|BASE|14.00%|13.00%|4.20%|70.00%|1.113636|189.367743|26,723.30|HYPOTHETICALLY_CAPITAL_FEASIBLE|
|BULL|20.00%|11.00%|6.00%|70.00%|2.800000|476.124611|67,190.02|HYPOTHETICALLY_CAPITAL_FEASIBLE|


Three illustrative economic cases are coherent in ROE/ke/g/payout and constant-state terminal terms. BEARfails capital and must not be presented as economically admissible; BASE/BULLpass only the hypothetical regulatory/common-book and eligible-retention constraints. Five deterministic sensitivity tables expose rate/payout/credit/capital dependence, invalid combinations and near-zero ke−gbehavior. Exact assumptions, provenance, arithmetic, stress reconciliation, capital rows and limitations are machine-readable.

Technical correctness and economic forecast validity remain separate. All scenario and sensitivity outputs carry the four mandatory labels. Approved intrinsic value, selected price, margin of safety, expected return, formal M3points/total/ranking and M4decision remain null; productionAdmissible=false. Historical live-price, ke/normalization/action/capital-evidence and independent-crosscheck gaps are not re-opened or silently resolved by this sandbox.

Remaining engineering Critical0/Major0/Minor0; the explicit capital/economic flags are retained. Review the illustrative choices and their risk, not an investment conclusion. No approved M1–M4policy, weighting or engine behavior changed. No network calls in the sandbox, no new market authority, no database/portfolio write and no production activation.

**STOP — await owner review and explicit approval. No promotion to formal valuation or M3/M4.**

Validation complete: **46/46 model tests, 21 technical checks and 17 financial challenge checks PASS**. 10403 protected files unchanged; 109 sensitivity cells exported. See [validation](VALIDATION.md).
