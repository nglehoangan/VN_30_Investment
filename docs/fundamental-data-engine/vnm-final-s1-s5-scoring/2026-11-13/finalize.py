"""Render finite final outputs from the actual engine/predicate execution."""
from pathlib import Path
import json,hashlib
O=Path(__file__).resolve().parent;R=O.parents[3]
load=lambda n:json.loads((O/n).read_text())
def md(n,t):(O/n).write_text(t.strip()+'\n')
def table(h,rows):return '| '+' | '.join(h)+' |\n| '+' | '.join(['---']*len(h))+' |\n'+'\n'.join('| '+' | '.join(str(x).replace('|','/').replace('\n',' ') for x in row)+' |' for row in rows)
def refs(items):return '; '.join('`'+x['path']+'`'+(' `#'+x.get('jsonPointer','')+'`' if x.get('jsonPointer') else '') for x in items)
i=load('VNM_SCORING_INPUTS.json');e=load('VNM_SCORING_EXECUTION.json');issues=i['S1S5IssueRegister'];blockers=i['unresolvedCurrentBlockers']
assert e['totalScore'] is None and e['workflow']['artifactWrites']==0
md('S1_S5_FINAL_RECONCILIATION.md',f'''# Final S1–S5 reconciliation — VNM

Baseline `{i['baseline']}`; actual review knowledge `{i['reviewKnownAt']}`. **Outcome B: definitive bounded blockers remain.** This is the final reconciliation, not another milestone or proposed remediation campaign.

Original S1–S5 definitions: `docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/VNM_OWNER_DECISIONS.md` and its evidence-products/rubric matrix. Subsequent 12 November RAW CLOSE, carry-forward, governance correction, unified source and standing-v4 decisions supersede the older price-adjustment and per-material/source-approval demands. The 13 November F2 assessment separates financial source availability from mappings, admission and consumers.

The 65 VNM canonical facts are loaded verbatim from `fundamental_admission_run/reviewed-vn30-20261019-VNM`, with existing qualification flags and body hash in VNM_SCORING_INPUTS.json. They are **not requalified**. Reported accounting facts do not by themselves establish normalized owner earnings, unrestricted cash, funded forecasts or an adopted rubric judgment. No new financial statement, PDF, source approval, per-material receipt or industry research is requested.

{table(['Original issue','Disposition','Exact residual or closure'],[[r['id'],r['status'],r['remaining'] or r['resolved']] for r in issues])}

## Exact evidence and policy reconciliation

'''+ '\n\n'.join(f"### {r['id']} — {r['issue']}\n\n**{r['status']}**. Resolved: {r['resolved']}\n\nRemaining: {r['remaining'] or 'None in this bounded use.'}\n\nApproved requirement: {r['rule']}\n\nEvidence: {refs(r['evidence'])}\n\nNew user-supplied information: {r['newUserInformation']}" for r in issues)+'''

## Scope rulings

- **S4 accepted facts stay accepted for their selected uses.** Raw close 56,900 VND and carried-forward shares 2,089,955,445 are not reopened. Adjusted series is EXCLUDED_BY_OWNER_POLICY; R1/R4 remain CLOSED. The 15 historical cash-dividend components remain reviewed historical evidence, not sustainable future DPS or portfolio cash receipts.
- **Three historical sessions are filled in the retained merged index.** `data/market-history/VNM.json` retains 1,197 CaféF plus three owner-XLS Vietstock observations (1,200 total). This preserves provider namespaces and does not alter CaféF raw responses. Historical replay/action completeness is NON-BLOCKING for the selected raw-close use; historical total return/PIT is not established.
- **U1 is CLOSED and F1/F2 standing approvals are VALID.** No new per-material or repeated source approval is required. The existing dated U2 market result and F2 bounded adapter/current-consumer limitations are reported, not restarted. Financial-statement and corporate-action adapters have different scope.
- **PIT is not newly imposed on current scoring.** The current Evidence validator accepts actual later operational knowledge with explicit CURRENT_FORMAL_VALUATION. The existing scorer calls its strict default and its dataset bridge is FORMAL/AS_KNOWN. That is a concrete consumer mismatch, not a request to obtain historical publication timestamps. Backdating or changing the consumer contract is outside this final assessment.
- **A new peer/industry table is not universally mandatory.** M3 §13.3 permits own-history/absolute economics. What remains unsupported is an adopted IC-POS judgment covering its actual evidence topics; it stays N/R rather than receiving a default midpoint.
- **A literal S1/S2/S5 schedule is not the only admissible format.** M3 §13.1 permits principle-equivalent evidence or a defensible range. Existing diagnostics have not established such decision-grade equivalents; missing values are not made true through approval.

No new user-supplied information is needed to complete outcome B. To produce a final score, the specific unresolved economic facts/judgments and existing scorer bindings identified in FINAL_BLOCKER_REGISTER.md must actually exist; no generic source search, resubmission, new milestone or approval loop is requested. VNM17 remains pending and unused as authority.
''')
md('FINAL_BLOCKER_REGISTER.md',f'''# Final bounded blocker register

**VNM is NOT RELIABLY SCORABLE / NOT production-ready.** Only the following six pre-existing current-scoring blocker groups remain. Raw-price adjustment documentation, new share certification, broad historical coverage, new source approval, per-material receipts and unrelated portfolio/M4 work are not blockers.

'''+ '\n\n'.join(f"## {b['id']}\n\n**BLOCKING** — {b['exactMissing']}\n\nOrigin: {', '.join(b['originalIssues'])}.\n\nExact contract: {b['contract']}\n\nEvidence: {refs(b['evidence'])}\n\nResponsible boundary: {b['responsibility']}\n\nNew user information: {b['newUserInformationRequired']}" for b in blockers)+f'''

## Observed execution, not proposed work

Actual application gate: `{e['workflow']['attempt']['reason']}`. No selection was fabricated: active `data_initialization_acceptance` and `scoring_dataset_binding` counts are both zero. The domain calculator was not entered, because no complete authorized input exists. No score artifact was written.

Exact approved-executable verifier: `{e['executableAuthorityValidation']['reason']}`. Changed artifact bindings:

{table(['Path','Approved SHA-256','Current SHA-256'],[[r['path'],r['approvedSha256'],r['currentSha256']] for r in e['executableAuthorityValidation']['exactChangedArtifacts']])}

Current-use selected real F2 fact replay: PASS. Same evidence through implicit scorer/PIT purpose: `{e['implicitScoringEvidenceValidation']['reason']}`. Existing F1 requested cutoff: `{e['cutoffMarketValidation']['reason']}`. The certified-membership result covers an evidence interval; its review date is not a new reconstitution effective date.

No new owner source authorization is missing. Scoring code/runtime binding and complete economic/rubric/M1 inputs remain distinct from source standing authority. The implemented AI compatibility path has no trusted production review binding in the retained implementation receipt; it cannot be used to impersonate HUMAN or bypass the same economic gates.

**No new information is required to conclude this assessment.** Even if the authority/consumer binding were resolved, economic/valuation/rubric gates still prevent an auditable final score; no arbitrary date shift, zero/midpoint score, blanket confidence haircut or total from nine research proposals cures them. No follow-on phases or new approval requests are created.
''')
rows=[]
for r in i['researchRubricConclusions']:
 rows.append([r['rubricId'],'NOT ISSUED','Retained research proposal only' if r['researchProposedPoints'] is not None else 'N/R — evidence/judgment unresolved',i['currentRubricBlockerMap'][r['rubricId']]])
md('VNM_FINAL_SCORECARD.md',f'''# VNM final scoring assessment

**Final decision: NOT RELIABLY SCORABLE. Total score: NOT ISSUED. Production-ready: NO.**

No defensible completed-scoring as-of date exists in the retained input set. The latest bounded economic cutoff candidate is **2026-10-30**, with actual review knowledge **{i['reviewKnownAt']}**; it is a retrospective current-use assessment, not a 13 November market valuation or historical PIT claim. It is retained because the latest CaféF history ends on that session and the owner share-count review covers that date. The earlier 16 October real F1 admission does not make missing economic judgments complete.

Raw close: **56,900 VND/share** (`GiaDongCua=56.9`, scale1,000). Shares: **2,089,955,445** under the closed carry-forward rule. Sixty-five existing canonical facts, 15 reviewed historical cash components, sector RETAIL/dairy context and retained financial/valuation evidence were loaded. None of those facts was requalified or promoted through the pending VNM17 proposal. Known Q3 data must inform the current trajectory; H1-only inputs cannot be called fresh merely because the reporting-cycle grace permits H1 as an operational baseline.

## Actual workflow result

`ScoringEngine.score` was entered twice with the actual registered methodology and the retained VNM input preparation. Both attempts stopped at **{e['workflow']['attempt']['reason']}**, before domain point calculation. There is no formal dataset selection/acceptance, and the remaining input preparation contains null economic/topic/gate fields. No fake selection, HUMAN identity or synthetic financial score was constructed. Relevant domain predicates were separately exercised on retained real evidence.

{table(['Component','Approved maximum','Formal score'],[[k,v,'NOT ISSUED'] for k,v in [('BQ',25),('FH',15),('GQ',15),('IC',10),('VAL',20),('RG',10),('CA',5)]])}

{table(['Rubric','Formal points','Current disposition','Unresolved evidence/binding'],rows)}

The nine earlier research proposals are preserved in the input ledger only; they are not newly endorsed component scores and are not summed. Missing points remain null, never zero or midpoint. Accepted fair value and expected five-year return remain null. Conditional DCF/IRR cases are retained as sensitivities, not an accepted valuation or return forecast.

## Confidence and thesis

{table(['Dimension','Retained rating','Reason'],[[r['dimension'],r['rating'],r['reason']] for r in i['dataConfidence']])}

The earlier market/share-confidence wording was partly superseded by S4 RAW CLOSE/carry-forward closure; the underlying selected values are now research-qualified, but exact formal consumption/current-purpose compatibility still fails. Do not use the old adjustment-methodology concern to reopen R4. Confidence is LOW/provisional pending economic/forecast/consumer evidence; it is not a numerical score multiplier.

'''+ '\n\n'.join('**'+k+'**: '+v for k,v in i['thesis'].items())+'''

This retained thesis is a research input, not an adopted formal investment thesis or a BUY/SELL/portfolio action. No weights, thresholds, investment rules, holdings, transactions, NAV or production activation changed. The exact finite blockers are in FINAL_BLOCKER_REGISTER.md.
''')
md('FINAL_CIO_ACCEPTANCE.md',f'''# Final CIO acceptance disposition

**Acceptance outcome B delivered: a definitive bounded blocker report. Outcome A is not achieved.**

This file records the assessment outcome; it does **not** claim that CIO has accepted or authorized a score, source promotion or production. No new milestone, phased program or approval loop is proposed. Execution stops with these final outputs for CIO review, as requested.

- S1–S5 reconciled against original requirements and successor owner decisions; closed S4 raw-close/share/adjustment items remain closed.
- 65 existing VNM canonical facts reused unchanged. F1/F2 standing approvals valid; U1 CLOSED. No per-material receipt or new source approval requested.
- Latest retained economic cutoff candidate 2026-10-30, actual later knowledge preserved. No final scoreable as-of date established; no invented current quote or historical PIT claim.
- Existing scoring application entered and deterministically blocked at `{e['workflow']['attempt']['reason']}`; selected real F2 current-purpose replay passes, implicit strict-purpose consumption and dated F1 coverage fail with exact reasons.
- Component/total scores, accepted fair value and expected return are null. Fourteen research bands remain unselected; nine earlier proposals are not added into a partial /100.
- Final unresolved set is only the six existing bounded economic/valuation/review/consumer/executable blocker groups in FINAL_BLOCKER_REGISTER.md. No new PDFs, industry research or generic source-discovery phase demanded.
- New user-supplied information needed to finish this report: **NO**. A future auditable score would need the specific unresolved facts/judgments and actual permitted consumer/authority bindings; authorization cannot create an unknown fact.
- Historical PIT: **NOT_QUALIFIED** and purpose-separated. VNM17: **PENDING, NOT PROMOTED**. Production Activation: **NOT_AUTHORIZED**.

## Final outputs and validation

[S1–S5 reconciliation](S1_S5_FINAL_RECONCILIATION.md), [loaded inputs](VNM_SCORING_INPUTS.json), [actual execution](VNM_SCORING_EXECUTION.json), [final scorecard assessment](VNM_FINAL_SCORECARD.md), [finite blockers](FINAL_BLOCKER_REGISTER.md), and this disposition.

VALIDATION.json records relevant scoped tests, deterministic input/execution replay and protected-byte checks. SOURCE_PINS.json binds retained inputs; original source receipts/timestamps and conflicts are preserved. Test fixture passes validate contracts, not real VNM score qualification. The production dataset, holdings, ledger and NAV remain unchanged. No production score or activation was written.

**STOP — final outputs ready for CIO review.**
''')
print(json.dumps({'outputs':'six requested final outputs','outcome':'B','totalScore':None}))
