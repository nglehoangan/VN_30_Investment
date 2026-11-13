from pathlib import Path
import json, hashlib, sys
sys.dont_write_bytecode=True
from acceptance import decide
R=Path(__file__).resolve().parents[4]; O=Path(__file__).resolve().parent
A=R/'docs/fundamental-data-engine/vnm-s1-economic-returns/2026-11-13'
B=R/'docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13'
H=R/'docs/fundamental-data-engine/vnm-final-s1-s5-scoring/2026-11-13'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(n,v): (O/n).write_text(json.dumps(v,indent=2,sort_keys=True)+'\n')
def ref(p): return str(p.relative_to(R))
rows=[
 ('NORMALIZATION','METRIC_DEFINITIONS §§3.3,4.1; SCORING_MODEL §§13.2–13.3','PASS','Consolidated operating earnings exclude finance/associate income and charge group personnel fund once; tax and identified cost cases explicit, including adverse credit reversal treatment.',ref(A/'S1_RESOLUTION.md')),
 ('CAPITAL_SCOPE','METRIC_DEFINITIONS §§4.1,12.4','PASS','Matching group/NCI scope; opening/closing average operating assets less noninterest operating liabilities; financial asset/cash/residual ranges; leases consistently expensed.',ref(A/'S1_ECONOMIC_RETURNS.json')),
 ('RETURNS_PERSISTENCE_MARGINS','SCORING_MODEL §5.1; METRIC_DEFINITIONS §§3.1,4.1','PASS_WITH_LIMITS','Four annual observations exceed the three-year trend minimum. Gross margins about39.86–41.42%; no extrapolation of durability from ROIC alone; fifth year is preferred, not a new mandatory input.',ref(B/'WACC_ROIC_Q3_ASSESSMENT.json')),
 ('CAPITAL_COST','SCORING_MODEL §5.1; methodology.ts BQ-EQ topics cost_of_capital','PASS_WITH_LIMITS','Nominal-VND WACC estimate7.57–10.79%; source-vintage, country/beta/debt/NCI proxies disclosed. Minimum historical conservative spread12.70pp; positive spread is conditional on tested assumptions.',ref(B/'FINAL_REVIEW.md')),
 ('CURRENT_UPDATE','METRIC_DEFINITIONS §§3.1,4.1,14,13.1','PASS_WITH_LIMITS','Q3 incorporated. Current-state TTM operating earnings bridged; exact TTM ROIC N/R for absent same-basis Sep2025 capital. Matching 9M return23.70–35.09% versus9M WACC charge5.67–8.09% supplies bounded current comparison. No annualized9M substitution or stale H1-only conclusion.',ref(B/'WACC_Q3_INPUTS.json')),
 ('INCREMENTAL_COMPARABILITY','METRIC_DEFINITIONS §§6.3,13.1; methodology.ts GQ-INC','N_R_PERMITTED','Annual/multi-year deltas and reclassification quantified; small/distorted capital changes preclude reliable ratio. No project table mandated. GQ-INC score remains null/N/R; no attractive incremental-return conclusion or automatic points.',ref(B/'WACC_ROIC_Q3_ASSESSMENT.json')),
 ('CONFIDENCE_CONTRADICTIONS','SCORING_MODEL §§2.5,13.1,13.4; METRIC_DEFINITIONS §§13.1–13.2,15','PASS_WITH_LIMITS','Analytical confidence MEDIUM; future persistence, accounting classification, WACC proxies and incremental/TTM limits explicit. No unresolved material contradiction invalidates the bounded level-of-return/spread conclusion. These limits still constrain downstream rubric judgment.',ref(B/'FINAL_REVIEW.md')),
 ('REPRODUCIBILITY','Owner S1 acceptance; METRIC_DEFINITIONS §17','PASS','Native source references, hashes, original receipts,65 selected Q3 cells and deterministic annual/current replay preserved. Validation must pass before closure record is used.',ref(B/'VALIDATION.json')),
 ('DOUBLE_COUNT_BOUNDARY','METRIC_DEFINITIONS §§4.1,10.1,16; SCORING_MODEL §11','PASS','BQ-EQ return-level evidence does not grant GQ-INC or CA-REINV/CA-PSV points; common earnings/valuation and per-share outcomes remain distinct S5/rubric responsibilities.', 'src/domain/scoring/methodology.ts')]
assessment={'contract':'vnm-s1-acceptance-v1','ticker':'VNM','reviewDate':'2026-11-13','status':'CLOSED','scope':'S1 economic-returns evidence gap under owner resolution policy; not formal financial admission or completion of dependent rubric scores','basis':'Existing M3 evidence/missing-data rules and owner S1 resolution policy, applied to retained validated annual plus Q3 assessment','ownerRequest':{'text':'vậy đối chiếu và hoàn tất để S1 close','meaning':'Instruction to complete acceptance review; not approval of financial observations, scores, source authority or production','messageId':None},'requirements':[dict(zip(['id','rule','result','finding','evidence'],r)) for r in rows],'unresolvedMaterialS1Blockers':[],'newUserInformationRequired':False,'optionalUnresolved':[{'metric':'incremental ROIC','status':'N/R','scoringEffect':'GQ-INC remains unscored; do not give zero/midpoint or high-return credit'},{'metric':'exact TTM ROIC','status':'N/R','scoringEffect':'Use documented annual ranges and period-matched Q3 update for S1 only; no fabricated TTM denominator'}],'rubricScores':{'BQ-EQ':None,'GQ-INC':None,'CA-REINV':None,'CA-PSV':None},'S1CapitalCostGap':'CLOSED_WITH_SUPPORTED_ESTIMATE_RANGE','formalSourceAdmissionGranted':False,'VNM17Promoted':False,'fullVNMScoringReady':False,'productionActivation':'NOT_AUTHORIZED','supersedes':[ref(A/'S1_RESOLUTION.md'),ref(A/'S1_ECONOMIC_RETURNS.json'),ref(B/'S1_CURRENT_DISPOSITION.json'),ref(B/'FINAL_REVIEW.md'),ref(H/'S1_S5_FINAL_RECONCILIATION.md'),ref(H/'FINAL_BLOCKER_REGISTER.md')],'supersessionScope':'Only S1 BLOCKING/uncompleted acceptance findings. Historical calculations, receipts, hashes and other issue statuses remain unchanged.'}
assert decide(assessment['requirements'], validation_passed=all(json.loads((p/'VALIDATION.json').read_text())['result']=='PASS' for p in [A,B]))=='CLOSED'
write('S1_ACCEPTANCE.json',assessment)
md='''# VNM S1 acceptance — CLOSED

S1 economic-returns gap is **CLOSED** under the owner S1 resolution policy and existing M3 rules. No indispensable S1 input remains absent. No additional user data or renewed policy approval is required.

This is the current successor acceptance to the earlier S1 BLOCKING/uncompleted-review findings. Original reports, computations and evidence remain unchanged. Closing this issue does not admit financial facts, complete rubric scores or authorize production.

## Mandatory M3 reconciliation

| Requirement | Rule | Result and evidence |
| --- | --- | --- |
'''
for id,rule,status,finding,evidence in rows: md+=f'| {id} | {rule} | **{status}** — {finding} `{evidence}` |\n'
md+='''
## Missing-data and scoring rulings

METRIC_DEFINITIONS §3.1 defaults current state to TTM; §4.1 prefers five years plus TTM. This is addressed explicitly rather than silently waiving it: four annual periods meet the three-year trend minimum, TTM earnings are bridged, Q3 capital/earnings are checked on a matching nine-month basis, and the unavailable exact TTM capital ratio remains N/R under §13.1. A nine-month return is never presented as annual or TTM.

Incremental efficiency has been assessed, including the quantified presentation change. §6.3 says: “Do not calculate mechanically when denominator is very small or distorted by acquisitions/corporate actions.” The N/R result resolves the *analysis request* without asserting that growth creates value. GQ-INC remains unscored; if it prevents a reliable Growth category or total score, SCORING_MODEL §13.4 still applies. That downstream scoring limit is not an unresolved S1 source-data demand or grounds to reopen a project-level schedule requirement.

The evidence covers executable BQ-EQ topics returns, persistence, margins and cost_of_capital. It supports historical/current operating-return spreads in the tested ranges; it does not establish perpetual superior returns, maximum rubric points, fair value, common cash distributions or per-share investment outcomes. CA-REINV/CA-PSV and S5 require their own distinct evidence. Confidence remains MEDIUM for this analytical assessment, with documented proxy and comparability limits; no blanket score haircut, zero or midpoint is assigned.

## Validation and final disposition

S1_ACCEPTANCE.json is machine-readable; VALIDATION.json records actual reruns, source/policy pins, deterministic closure replay and protected database/account/scoring bytes. S1_S5_CURRENT_RECONCILIATION.md and CURRENT_BLOCKER_REGISTER.md carry forward the other issues and replace only the S1 finding. S2, S3, S4-ADMISSION, S5 and independent scoring/executable gates are unchanged. Full VNM scoring is not ready; no score, financial admission, VNM17 promotion, production activation or portfolio mutation is created.
'''
(O/'S1_CLOSURE.md').write_text(md)
text=(H/'S1_S5_FINAL_RECONCILIATION.md').read_text()
text=text.replace('| S1 | BLOCKING | No accepted normalized NOPAT/common-return/economic-capital spread; project contribution/commissioning outcomes remain unverified. A specific cohort register is one evidence option, not a prescribed new file. |','| S1 | CLOSED | Matched normalized group returns/capital, WACC range, historical spread and Q3 update verified; incremental and exact TTM ratios N/R under M3 missing-data rules. See S1_ACCEPTANCE.json. |')
a=text.index('### S1 —'); b=text.index('### S2 —',a)
text=text[:a]+'''### S1 — Economic returns

**CLOSED**. Normalized group NOPAT, compatible capital and WACC comparison are reproducible; four-year persistence and Q3 current update are verified. Incremental and exact TTM ratios remain N/R with scoring limits, not invented values. No outstanding indispensable S1 input or project-level requirement is identified under METRIC_DEFINITIONS §§3.1,4.1,6.3,13.1,14 and SCORING_MODEL §§5.1,13.4. Exact clause-to-evidence mapping: S1_ACCEPTANCE.json and S1_CLOSURE.md in this directory. No new user information required.

'''+text[b:]
(O/'S1_S5_CURRENT_RECONCILIATION.md').write_text('# Current successor reconciliation\n\nOnly S1 disposition is superseded by this review. The following retained baseline text supplies unchanged other issues; earlier baseline timestamps refer to that historical assessment, not this closure. Full scoring remains blocked.\n\n'+text)
text=(H/'FINAL_BLOCKER_REGISTER.md').read_text();a=text.index('## ECONOMICS');b=text.index('## LIQUIDITY',a);text=text[:a]+text[b:];text=text.replace('six pre-existing current-scoring blocker groups','five retained current-scoring blocker groups after S1 economic-return closure')
(O/'CURRENT_BLOCKER_REGISTER.md').write_text('# Current successor blocker register\n\nS1 ECONOMICS is removed by S1_ACCEPTANCE.json. This carries forward the other five groups without re-investigation or asserting newer runtime state. Original observations and hashes below retain their original review dates. GQ-INC remains N/R, and a complete reliable rubric set is still required under SCORER_INPUT_GATES. No S1 project/cohort data demand survives.\n\n'+text)
inputs=[A/'OWNER_POLICY.md',A/'S1_INPUTS.json',A/'S1_ECONOMIC_RETURNS.json',A/'S1_RESOLUTION.md',A/'VALIDATION.json',A/'SOURCE_PINS.json',B/'WACC_Q3_INPUTS.json',B/'WACC_ROIC_Q3_ASSESSMENT.json',B/'S1_CURRENT_DISPOSITION.json',B/'FINAL_REVIEW.md',B/'VALIDATION.json',B/'SOURCE_PINS.json',H/'S1_S5_FINAL_RECONCILIATION.md',H/'FINAL_BLOCKER_REGISTER.md',R/'docs/03 SCORING/METRIC_DEFINITIONS.md',R/'docs/01 SYSTEM/SCORING_MODEL_v1.0.md',R/'src/domain/scoring/methodology.ts']
protected=json.loads((B/'SOURCE_PINS.json').read_text()); guards=[protected['protectedDatabase'],*protected['protectedAccountFiles']]
code=list((R/'src/domain/scoring').rglob('*.ts'))+[R/'src/application/scoring/engine.ts']
write('SOURCE_PINS.json',{'inputs':[{'path':ref(p),'sha256':sha(p)} for p in inputs],'protected':guards+[{'path':ref(p),'sha256':sha(p)} for p in sorted(code)],'scripts':[{'path':ref(p),'sha256':sha(p)} for p in sorted(O.glob('*.py'))]})
print('Built S1 CLOSED acceptance and successor registers')
