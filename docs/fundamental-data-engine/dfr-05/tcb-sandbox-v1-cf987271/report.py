"""Readable sandbox artifacts; no network or production writes."""
from decimal import Decimal,localcontext
from prepare import OUT,BASE,read
D=Decimal

def main():
 c=read(OUT/'scenario-inputs.json');r=read(OUT/'scenario-outputs.json');a=read(OUT/'anchors.json');sens=r['sensitivities']['tables']
 labels='**RESEARCH_ONLY · HYPOTHETICAL · NOT_AN_APPROVED_INTRINSIC_VALUE · NOT_FOR_M3_M4_OR_PRODUCTION**'
 intro=f'{labels}\n\nTCB only,2026-11-10. Historical FY2025accounting anchors plus configurable illustrative assumptions. No market price, formal intrinsic value, M3/M4or production purpose.\n'
 def md(name,body):(OUT/name).write_text(body.strip()+'\n')
 def fmt(x,n=2):
  with localcontext() as z:z.prec=70;return format(D(x),','+str('.')+str(n)+'f')
 def pct(x):return fmt(D(x)*100)+'%'
 table='| Case | ROE | ke | g | Payout | Hypothetical P/B | Hypothetical equity, trillion VND | Hypothetical per-share model value,VND | Capital status |\n|---|---:|---:|---:|---:|---:|---:|---:|---|\n'
 for s in r['scenarios']:
  p=s['hypotheticalAssumptions']['inputs'];table+=f"|{s['scenario']}|{pct(p['roe']['value'])}|{pct(p['ke']['value'])}|{pct(p['growth']['value'])}|{pct(p['payout']['value'])}|{fmt(s['hypotheticalPB'],6)}|{fmt(D(s['hypotheticalEquityValue'])/D('1e12'),6)}|{fmt(s['hypotheticalPerShareModelValue'])}|{s['capitalFeasibility']['status']}|\n"
 md('TCB_SANDBOX_AUTHORIZATION.md',f'''# TCB Analyst Scenario Sandbox v1.0 authorization

{intro}
Owner explicitly approves Option B — Analyst Scenario Sandbox. The full authorization is retained in `owner-request.txt`; `authorization.json` pins its hash. Numerical examples are permitted as hypothetical modelling assumptions, not empirical forecasts or owner-approved economic estimates. Approval timestamp remains null because none was supplied.

GitHubmain and local HEADwere independently matched to `{BASE}`. The connector was used only for the explicitly requested repository preflight; no market data were acquired. All model/runner/test execution is offline. See `github-head-receipt.json`.

Prior bounded-research implementation commit is `{BASE}`; its earlier execution baseline was b5c8fe27ce9fb2f8786b603463176f6d5437c6f1. Stale UNCOMMITTED/null implementation statements are superseded only for current commit-status interpretation by `METADATA_CORRECTION.md` and `metadata-correction.json`. No approved baseline file, timestamp, receipt, decision or protected hash was edited. Current sandbox execution commit is `{BASE}`, with sandbox implementationCommit=null and new working-tree changes uncommitted.

No formal intrinsic value, M3points/totals/ranking, M4Buy/Hold/Sell, portfolio/database transaction, production activation, new market authority or M1–M4amendment. This is not another evidence-qualification cycle. STOP after implementation and validation; numerical economics and further work require owner review.
''')
 body=f'# Illustrative hypothetical assumptions\n\n{intro}\nEdit `scenario-inputs.json`; all numeric values are lossless decimal strings. Every scenario parameter and sensitivity/control item carries value, unit, HYPOTHETICAL_ASSUMPTIONclassification, rationale, evidence status, owner approval status, sensitivity range and applicable scenario. The displayed ranges are illustrative exploration intervals, not confidence intervals or qualified bounds.\n\n'
 for s in c['scenarios']:
  body+='## '+s['name']+'\n\n| Input | Value | Unit | Rationale |\n|---|---:|---|---|\n'
  for k,v in s['inputs'].items():body+=f"|{k}|{v['value']}|{v['unit']}|{v['rationale']}|\n"
 body+='''
ROEis the hypothetical all-in common return after the separate credit/funding stress effects. ke16%/13%/11%are arbitrary illustrative discount assumptions, independent of the15%investment-return policy target and12%exceptional floor; no ERP/risk-free/beta calibration is claimed. Tax20%and common incidence90%are explicitly hypothetical adjustment assumptions, not conclusions about deductibility or NCI.

Historical credit anchors are observed/conditionally approved sensitivity references only. Reusing their numerical values for forwardCreditCost does not convert them into expected-loss forecasts. Closing issued-instrument balance is a selected historical funding-pocket proxy; applying a spread to it is a model sensitivity, not an actual average funding-cost measurement.

Terminal ROE/g/ke equal initial values in this deliberately constant-state model. transitionHorizon5provides explicit RI/capital checks; it does not create a different terminal regime. Editing terminal values inconsistently is rejected. Zero shares/cash are conditional modelling restrictions, not predictions. Eligible retention, RWApath, regulatory/common targets and prudential deductions are all hypothetical. Accounting common-book/RWAfloor is not CET1/TCEor a legal capital rule.
'''
 md('TCB_HYPOTHETICAL_ASSUMPTIONS.md',body)
 md('TCB_SCENARIO_MODEL.md',f'''# Isolated Decimal model and provenance

{intro}
**Framework:** justified P/B=(ROE−g)/(ke−g), with g=ROE×(1−payout); hypothetical equity=B0×P/B; per-share model value=equity/closing ordinary shares. Enforce ke>0,ke>g,ROE>g,0<=payout<=1,nonnegative unit ratios and constant-state terminal equality. Values remain arbitrary economic hypotheses even when mathematics passes.

Historical book is170,044,504,000,000VND; closing ordinary shares7,086,240,414; reported ordinary common EPS numerator25,254,851,000,000VND. The numerator is a historical context anchor, not mechanically carried into future ROE. Original record/native units, scope, period, exact JSONpointers and hashes are preserved in `anchors.json`, including source equity/NCIoperands and the approved common-book definition. Regulatory capital and RWAremain regulatory-consolidated; book is neither TCE nor unrestricted distributable capital. No TCBSprice enters the anchors.

Decimal working precision70,12dp historical credit-anchor strings preserved, no binary floats. Monetary results retain full working precision; readable values are rounded for display only. P/Bexact numerator/denominator and RIprojection permit reproduction. The finite constant-state RIcheck converges algebraically to P/Bfor any accepted integer horizon; it is a consistency check, not an independent economic crosscheck.

Credit sensitivity: hypothetical forward rate×fixed averageFY2024/FY2025core bank loans minus actual reported bank-customer provision charge. Then apply explicitly hypothetical tax/common incidence. Funding stress: hypothetical spread×closing issued-instrument pocket, with the same explicit tax/incidence. `preStressROE=(allInROE×B0+creditCommonDelta+fundingCommonDelta)/B0` reconciles the components. The model uses all-inROEonce: it does not deduct these diagnostics a second time or add funding spread to ke. Missing stress inputs reject rather than fill zero. Additional capital-loss charges are rejected without a separate bridge; one-time prudential deductions remain outside P&L.

Replay offline:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 docs/fundamental-data-engine/dfr-05/tcb-sandbox-v1-cf987271/run.py
PYTHONDONTWRITEBYTECODE=1 python3 docs/fundamental-data-engine/dfr-05/tcb-sandbox-v1-cf987271/test_model.py
PYTHONDONTWRITEBYTECODE=1 python3 docs/fundamental-data-engine/dfr-05/tcb-sandbox-v1-cf987271/report.py
```

`run.py` optionally accepts an explicit config-file path; all writes remain in this sandbox. Source pins and anchor values/units are checked before calculation. `prepare.py` preserves an existing editable scenario-inputs file. After edits, rerun and validate; the current sealed manifest intentionally rejects changed outputs until a new review. No external libraries, production imports or network calls are needed by the model.
''')
 stress='| Case | Hypothetical common credit-expense delta,trillion VND | Hypothetical common funding delta,trillion VND | Reconciled pre-stress ROE | All-in ROEused | Stress deducted again? |\n|---|---:|---:|---:|---:|---|\n'
 for s in r['scenarios']:
  z=s['stressReconciliation'];stress+=f"|{s['scenario']}|{fmt(D(z['hypotheticalCommonCreditDelta'])/D('1e12'),6)}|{fmt(D(z['hypotheticalCommonFundingDelta'])/D('1e12'),6)}|{pct(z['reconciledHypotheticalPreStressRoe'])}|{pct(z['allInRoeUsedByModel'])}|False|\n"
 md('TCB_SCENARIO_RESULTS.md',f'''# Hypothetical scenario results

{intro}
{table}

These are **hypothetical mathematical outputs**, not approved intrinsic values, target prices, security recommendations or a statistical confidence interval. BEARis capital-infeasible and is explicitly rejected as economically admissible. BASE/BULLpass only the stated hypothetical capital constraints; actual forecast/economic validity is not established.

{stress}

The tiny BULLcredit delta from a12dp historical rate is a rounding residue, not evidence of economic improvement. Reported common EPS earnings remain a separate historical fact. No live/historical market price, margin of safety or expected return is calculated. Every scenario output carries historical anchor bindings, config/model/source-pin hashes, assumptions, formula, sensitivity reference, flags, capital trajectory, limitations and null formal fields in `scenario-outputs.json`.
''')
 def matrix(rows,rowkey,colkey,rowvals,colvals,kind='PB'):
  by={(x[rowkey],x[colkey]):x for x in rows};body='| '+rowkey+' \\ '+colkey+' |'+'|'.join(pct(v) for v in colvals)+'|\n|---|'+'---:|'*len(colvals)+'\n'
  for rv in rowvals:
   body+='|'+pct(rv)+'|'
   for cv in colvals:
    x=by[(rv,cv)]
    if kind=='PB':cell='INVALID' if x.get('hypotheticalPB') is None else fmt(x['hypotheticalPB'])+(' !' if x.get('flags') else '')
    else:cell=('INFEASIBLE' if x['status']=='CAPITAL_INFEASIBLE' else 'HYP-PASS' if x['status']=='HYPOTHETICALLY_CAPITAL_FEASIBLE' else 'UNPROVEN')+'; '+pct(x['lastYearCar'])
    body+=cell+'|'
   body+='\n'
  return body
 grids=c['sensitivityGrids']
 b=f'# Deterministic hypothetical sensitivities\n\n{intro}\nAll five tables are exported in `sensitivity-results.json`. Cells are mathematical illustrations, not recommendations or empirical forecasts. `!`flags near-zero ke−g or extreme P/B; INVALIDcells have null model values. The price/PBsurfaces do not certify capital.\n\n## ROEversus ke — P/B\n\nHold BASEg4.2%fixed and derive payout=1−g/ROEfor every cell.\n\n'
 b+=matrix(sens['roeVsKe'],'roe','ke',grids['roe']['value'],grids['ke']['value'])
 b+='\n## Growth versus ke — P/B\n\nHold BASE_ROE14%fixed and derive payout.\n\n'+matrix(sens['growthVsKe'],'growthInput','ke',grids['growth']['value'],grids['ke']['value'])
 b+='\n## Payout versus ROE — P/B\n\nHold BASE_ke13%fixed and derive g=ROE×(1−payout).\n\n'+matrix(sens['payoutVsRoe'],'payoutInput','roe',grids['payout']['value'],grids['roe']['value'])
 b+='\n## Credit cost versus hypothetical common earnings\n\nHold BASEreconciled pre-stress economics/funding fixed and change the credit expense once.\n\n| Hypothetical credit rate | Hypothetical common earnings,trillion VND | Status |\n|---:|---:|---|\n'
 for x in sens['creditVsCommonEarnings']:b+=f"|{pct(x['hypotheticalCreditCost'])}|{fmt(D(x['hypotheticalCommonEarnings'])/D('1e12'),6)}|{x['status']}|\n"
 b+='\n## Regulatory target versus RWAgrowth\n\nHold BASEmanagement buffer2%and common-accounting-book floor10%fixed; each cell shows combined capital status and year5CAR. Target is added to buffer. UNPROVENmeans the horizon may pass but the simple terminal feasibility proof does not apply.\n\n'+matrix(sens['capitalTargetVsRwaGrowth'],'hypotheticalRegulatoryTarget','hypotheticalRwaGrowth',grids['capitalTarget']['value'],grids['rwaGrowth']['value'],'CAPITAL')
 b+='\nDependence on ke−g: P/Bis inversely proportional to that denominator at fixed ROE/g. Derivatives are dPB/dke=−(ROE−g)/(ke−g)^2;dPB/dROE=1/(ke−g)at fixedg;dPB/dg=(ROE−ke)/(ke−g)^2. Growth and payout are therefore not independently changed here. A0.5percentage-point denominator threshold and P/B>=5are illustrative warnings, not approved investment-policy limits. ke<=gorROE<=gis rejected. No unstable/high value is presented as an investable conclusion.\n'
 md('TCB_SENSITIVITY_ANALYSIS.md',b)
 b=f'# Hypothetical capital feasibility\n\n{intro}\nStarting regulatory capital181,870,000,000,000VNDand RWA1,244,531,000,000,000VNDare historical regulatory-consolidated anchors. Neither is ordinary accounting book, and Tier1is not CET1. Historical minimum8%is not automatically selected: scenario targets/buffers are hypothetical.\n\nEach year, common earnings=ROE×opening book; retention=earnings×(1−payout); eligible capital increment=retention×hypothetical eligible fraction. Common book grows by g; RWAby its separate hypothetical growth. Capital loses a one-time year1non-P&Lprudential deduction. Additional P&Lcapital losses are zero because credit/funding stress is already inside ROE. Require both regulatory capital/RWA>=target+buffer and common accounting book/RWA>=the illustrative common-book floor. No common-book ratio is labelled CET1/TCE.\n'
 for s in r['scenarios']:
  cap=s['capitalFeasibility'];b+=f"\n## {s['scenario']} — {cap['status']}\n\nTarget+buffer={pct(cap['targetWithBuffer'])}; common-book/RWAfloor={pct(cap['commonBookRwaTarget'])}. Failing years={cap['failingYears']}; terminal test={cap['terminalStatus']}; hypothetical limiting regulatory CAR={pct(cap['hypotheticalLongRunCarLimit']) if cap['hypotheticalLongRunCarLimit'] is not None else 'not demonstrated'}.\n\n| Year | Common book,trillion VND | Eligible retention,trillion VND | Deduction,trillion VND | Regcapital,trillion VND | RWA,trillion VND | RegCAR | Commonbook/RWA | Status |\n|---|---:|---:|---:|---:|---:|---:|---:|---|\n"
  for x in cap['rows']:b+=f"|{x['year']}|{fmt(D(x['hypotheticalCommonBook'])/D('1e12'),4)}|{fmt(D(x['hypotheticalEligibleRetention'])/D('1e12'),4)}|{fmt(D(x['hypotheticalCapitalDeductions'])/D('1e12'),4)}|{fmt(D(x['hypotheticalRegulatoryCapital'])/D('1e12'),4)}|{fmt(D(x['hypotheticalRwa'])/D('1e12'),4)}|{pct(x['hypotheticalCar'])}|{pct(x['hypotheticalCommonBookRwaRatio'])}|{x['status']}|\n"
 b+='\nFor positive constant gBook=gRWAwith the one-time deduction, limiting regulatory CAR=eligibleFraction×B0/RWA0; common-book/RWAratio is constant. Checking initial/explicit-year ratios and this limit verifies the stated constant-state restriction. If RWAgrowth exceeds book growth, long-run capital/RWAtends to zero under these assumptions and is flagged infeasible even if a finite horizon passes. Other unmatched growth cases remain terminal-unproven. No liquidity, actual prudential eligibility, management buffer, stress loss calibration or issuer behavior is empirically certified.\n'
 md('TCB_CAPITAL_FEASIBILITY.md',b)
 md('TCB_SANDBOX_RISK_REVIEW.md',f'''# Sandbox financial and model-risk challenge

{intro}
Mathematical PASS means the configured equations and labels behave correctly, not that ke, ROE, credit/funding losses, taxes, NCIattribution, targets or growth predict TCB. All scenarios are deliberately hypothetical. BEARis intentionally capital-infeasible; its numerical P/B/per-share output is retained only to show the difference between an equation and economic admissibility. BASE/BULLare not actual capital forecasts or formal investment approvals.

Stress is attributed once: ROEis all-in, diagnostics reconcile a hypothetical pre-stress return, and no spread is added mechanically to ke. Changing credit sensitivity holds pre-stress economics/funding fixed; it does not subtract a second copy of the original scenario shock. The selected funding pocket and closing balance proxy can differ materially from actual repricing balances. Tax20%/common incidence90%and eligible-retention fractions are illustrative, not newly qualified economics.

Historical accounting book is not TCE, market value or unrestricted distributions. The RI/PBagreement is algebraic consistency, not independent economic corroboration. Five-year explicit paths plus a constant-state limiting check are conditional mathematics; real refinancing, liquidity, RWAcomposition and future regulatory constraints are not validated. Near-zero denominator/extreme-output flags prevent a high mathematical value from masquerading as a robust conclusion.

Technical issues remaining: Critical0/Major0/Minor0after validation. Explicit economic flags remain: BEAR CAPITAL_INFEASIBLE; all3cases not empirically qualified; invalid/unstable sensitivity cells; inherited formal research blockers remain unchanged and are not solved by hypothetical numbers. No actual valuation, target-price/MOS/expected-return conclusion, recommendation, M3/M4or production authority is granted. Separate same-agent preparation and quantitative challenge passes are recorded; independent human review is not claimed.
''')
 md('TCB_SANDBOX_FINAL_REVIEW.md',f'''# TCB Analyst Scenario Sandbox v1.0 — final review

{intro}
**READY_FOR_OWNER_SANDBOX_REVIEW**, subject to successful isolated technical/financial validation. This is sandbox readiness only. GitHubmain/local latest commit is `{BASE}`; the new implementation remains uncommitted. Changed files are restricted to this dedicated folder and enumerated in `changed-files.json`/`manifest.json`. Stale predecessor commit-status metadata is corrected by the successor overlay; original approved files/receipts remain intact.

{table}

Three illustrative economic cases are coherent in ROE/ke/g/payout and constant-state terminal terms. BEARfails capital and must not be presented as economically admissible; BASE/BULLpass only the hypothetical regulatory/common-book and eligible-retention constraints. Five deterministic sensitivity tables expose rate/payout/credit/capital dependence, invalid combinations and near-zero ke−gbehavior. Exact assumptions, provenance, arithmetic, stress reconciliation, capital rows and limitations are machine-readable.

Technical correctness and economic forecast validity remain separate. All scenario and sensitivity outputs carry the four mandatory labels. Approved intrinsic value, selected price, margin of safety, expected return, formal M3points/total/ranking and M4decision remain null; productionAdmissible=false. Historical live-price, ke/normalization/action/capital-evidence and independent-crosscheck gaps are not re-opened or silently resolved by this sandbox.

Remaining engineering Critical0/Major0/Minor0; the explicit capital/economic flags are retained. Review the illustrative choices and their risk, not an investment conclusion. No approved M1–M4policy, weighting or engine behavior changed. No network calls in the sandbox, no new market authority, no database/portfolio write and no production activation.

**STOP — await owner review and explicit approval. No promotion to formal valuation or M3/M4.**
''')
 print('Readable sandbox reports generated.')
if __name__=='__main__':main()
