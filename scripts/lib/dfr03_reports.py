"""Owner-facing partial research reports. No category or overall score summation."""
from collections import Counter
import json

def reports(out,rows,summary):
 def write(name,text):(out/name).write_text(text.rstrip()+'\n')
 intro='RESEARCH PROVISIONAL · Review 2026-11-05 · Financial values/periods/cutoff unchanged from DFR-02. No total score, ranking or production acceptance.\n\n'
 defs='''READY_FOR_ASSESSMENT means all topic evidence is sufficient for the bounded research judgment; completed rows remain in that eligibility class with a separate completion status. DATA_MISSING means required *qualified topic evidence* is absent from the bound layer, not that a physical PDF is absent. Inspect retained notes before seeking new evidence or asking the owner for files. ANALYST_REVIEW_PENDING means related economic material exists but topic sufficiency/band/challenge work is unfinished. MATERIAL_CONFLICT requires an actual material contradictory dependency; a 1-VND EPS discrepancy does not automatically qualify. NOT_APPLICABLE requires explicit approved-methodology permission; no instance is declared N/A and no weight is redistributed.

The four existing judgments remain provisional and are revalidated, not relabelled as owner-approved or formally accepted. Preparation/challenge are separate actual invocations and distinct self-review passes by the same assistant. Independent human or authenticated model/session attestation is not claimed.
'''
 table=['| Issuer | Rubric | Eligibility | Completion | Points | Exact remaining reason |','|---|---|---|---|---:|---|']
 for r in rows:table.append(f'| {r["ticker"]} | {r["rubric"]} | {r["eligibility"]} | {r["status"]} | {r["points"] if r["points"] is not None else "null"} | {r["reason"]} |')
 write('DFR_03_RUBRIC_ELIGIBILITY.md','# DFR-03 rubric eligibility\n\n'+intro+defs+'\n\n'+ '\n'.join(table)+'\n\nExact per-topic blockers and candidate IDs: [eligibility.json](eligibility.json). New eligible judgments are selected by topics/economics, not metric count or a desired completion quota.')
 parts=[]
 for r in rows:
  if r['status']!='COMPLETED_RESEARCH':continue
  a=r['assessment'];s=f'## {r["id"]}\n\n**{r["band"]}: {r["points"]}/{r["maxPoints"]} · '+('new' if r['newCompleted'] else 'retained DFR-02')+' · provisional**\n\n'+a['rationale']+'\n\n'
  s+='\n'.join('- **'+e['topic']+'**: '+e['rationale']+' Refs: '+', '.join(e['refs']) for e in a['evidence'])
  s+='\n\nCounterevidence:\n\n'+'\n'.join('- '+e['rationale']+' Refs: '+', '.join(e['refs']) for e in a.get('counterevidence',[]))
  if not a.get('counterevidence'):s+='\n'+'\n'.join('- '+x for x in a['disconfirmingEvidence'])
  s+='\n\nAssumptions: '+'; '.join(a['assumptions'])+'\n\nConfidence: **'+a['confidence']+'** (judgment, not numerical probability).\n\nInvalidation: '+'; '.join(a['invalidationConditions'])
  if a.get('challengeDisposition'):s+='\n\nChallenge: '+a['challengeDisposition']['rationale']
  else:s+='\n\nExact DFR-02 predecessor preparation/challenge retained under revalidated hashes; not a newly authenticated formal execution.'
  parts.append(s)
 write('DFR_03_ASSESSMENT_RESULTS.md','# DFR-03 assessment results\n\n'+intro+defs+'\n\n'+'\n\n'.join(parts))
 ready=['| Issuer | DFR-02 completed | DFR-03 completed | New | Unscored | Formal issuer acceptance |','|---|---:|---:|---:|---:|---|']
 for t in ['FPT','VNM','BID','TCX','VIC','VHM']:
  own=[r for r in rows if r['ticker']==t];done=sum(r['status']=='COMPLETED_RESEARCH' for r in own)
  ready.append(f'| {t} | {sum(r["baselineCompleted"] for r in own)} | {done} | {sum(r["newCompleted"] for r in own)} | {23-done} | BLOCKED / not requested |')
 write('DFR_03_ISSUER_SCORECARD_READINESS.md','# DFR-03 issuer scorecard readiness\n\n'+intro+'\n'.join(ready)+'''

No issuer has all 23 assessments. No category points, total score, ranking, BUY/SELL, DCA or NAV artifact is emitted. Zero in an accepted High uncertainty band describes the supported economic judgment, not missing information. All incomplete rubric points stay null.

Business Quality, Financial Health, Growth, Industry and Risk were prioritized in the eligibility review. Reported group ROE is not normalized common-owner return; CAR alone is not an asset-quality/funding review; historical growth is not organic/action-adjusted growth; issuer scale is not market share/moat. Specific source-backed preparation is required before those remaining bands can be selected. Universal approved weights and rubric applicability are unchanged.
''')
 reduction=f'''# DFR-03 blocker reduction

{intro}
| Measure | DFR-02 | DFR-03 |
|---|---:|---:|
| Completed research rubrics | 4 | {summary['completed']} |
| New completed in this phase | — | {summary['newCompleted']} |
| Remaining unscored | 134 | {summary['remainingUnscored']} |
| Financial metric modifications | — | 0 |
| Full issuer acceptance | 0 | 0 |

Remaining classes: {json.dumps(summary['remainingClasses'])}. Complete classifications: {json.dumps(summary['eligibilityCounts'])}. The increase is completed evidence-supported judgments, not newly extracted metrics or new source inventory rows.

## B1 — FPT BQ-CASH

Six original PDF pages (physical 12, 13, 29–32) were visually reviewed only for the material recognition/WC exception. Actual cash adjustments distinguish receivable/inventory/prepaid use, payable funding, tax/interest payments and investment income. Deferred revenue and completion/time-based recognition identify accounting timing risk. The existing Note39 receivables bridge remains separately bound; no ready metric is silently promoted, no FY2025/2026 cash/scope TTM series is manufactured. Challenge lowers the proposed 4/6 to qualified 3/6. A small other-profit subtotal does not prove all finance income recurs; no exhaustive one-off review is claimed.

The page13 retained OCR interleaves the depreciation columns; the observed FY2025 amount is 2,914,178,360,732 VND, versus FY2024 2,535,298,475,665. This is an exception observation only; DFR-02's metric array and every old source byte remain unchanged. No new scoring metric is created from that observation.

## B2 — TCX RG-UNC and VNM RG-UNC

TCX's printed common EPS numerator remains a 1-VND exact source conflict. This run does not erase it, correct financial history, call it material by default, or use inherited conflicted common-value estimates. The new uncertainty judgment uses separately supported total standalone NPAT, realized trading net, paired revaluation and margin/funding balances. Challenge rejects the prior proposed manageable band: actual trading dependence and rapidly expanding funded exposures support High uncertainty (0/2). Larger equity and small paired unrealized marks are retained as counterevidence; no stress failure or probability bound is invented.

VNM's positive reported-profit/cash anchor and reviewed parent cash/finance alternatives support Material manageable uncertainty (1/2). The distinct channel is precision of future common value, not a second cash-conversion score. Parent distributions, maintenance/reinvestment, working capital and finance recurrence prevent 2/2 or any accepted price target. A sensitivity grid is not a confidence interval.

## Remaining exact work / owner decision

Financial Health needs qualified full debt/covenant/maturity/funding and sector asset-quality/downside response evidence. Growth needs acquisition/perimeter/corporate-action/per-share and sustainable incremental-return evidence. Industry/competitive position needs actual sourced barriers, competition, demand, market share or distribution evidence; none is invented. Governance needs distinct related-party/minority/auditor review. Valuation requires qualified common economics and compatible share/action/price plus sector model prerequisites.

Owner should review the three proposed completed judgments and choose the next *bounded evidence-review* batch from retained statements/notes. No request to resend known source files is made. If the missing qualified topic evidence is not retained, a later separately authorized source-research phase is needed. Missing qualitative topics do not justify an automatic zero or N/A, or partial-weight redistribution.
'''
 write('DFR_03_BLOCKER_REDUCTION.md',reduction)
