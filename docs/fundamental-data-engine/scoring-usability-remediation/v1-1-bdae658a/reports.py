from pathlib import Path
import json,hashlib,difflib,subprocess,shutil
R=Path.cwd();O=R/'docs/fundamental-data-engine/scoring-usability-remediation/v1-1-bdae658a';V=R/'docs/fundamental-data-engine/scoring-usability-audit/v1-ad81bdce';BASE='bdae658ab3ab6588a0703df9c132f29a08aea84f'
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(n,d):(O/n).write_text(json.dumps(d,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
def md(n,t):(O/n).write_text(t.strip()+'\n')
def table(head,rows):return '| '+' | '.join(head)+' |\n| '+' | '.join(['---']*len(head))+' |\n'+'\n'.join('| '+' | '.join(map(str,r))+' |'for r in rows)
# Generate an unapplied production-source diff. Only harness path rebasing and the FORMAL guard are removed.
parts=[];art=[]
for name in ['metrics.ts','scorecard.ts','action-dependencies.ts']:
 p='src/domain/scoring/'+name;old=(R/p).read_text()if(R/p).exists()else '';s=(O/'candidate'/name).read_text()
 for dep in ['validation','evidence','methodology','eligibility']:s=s.replace('"@/domain/scoring/'+dep+'"','"./'+dep+'"')
 s=s.replace('  // Review harness only; deliberately excluded from the proposed production source diff.\n  check(raw.artifactScope==="SYNTHETIC_TEST","UNAPPROVED_PATCH_CANNOT_SCORE_FORMAL");\n','')
 parts.append(''.join(difflib.unified_diff(old.splitlines(True),s.splitlines(True),fromfile='a/'+p if old else'/dev/null',tofile='b/'+p)))
 art.append({'path':p,'baselineSha256':hashlib.sha256(old.encode()).hexdigest()if old else None,'proposedSha256':hashlib.sha256(s.encode()).hexdigest(),'reviewHarness':str((O/'candidate'/name).relative_to(R)),'reviewHarnessSha256':sha(O/'candidate'/name)})
(O/'scoring-g2-g3.proposed.patch').write_text(''.join(parts))
receiptpath='docs/fundamental-data-engine/evidence/2026-10-29-approved-authority-activation/OWNER_APPROVAL_RECEIPT.json';approval=read(R/receiptpath)
proposal={'contract':'scoring-g2-g3-unactivated-patch-proposal-v1.1','baselineCommit':BASE,'status':'PATCH_TESTED_OWNER_APPROVAL_REQUIRED','approvalStatus':'PENDING','activated':False,'productionAdmissible':False,'policyOrWeightsChanged':False,'scope':['G2 metric/rubric-local corporate-action dependency','G3 explicit annual growth operand context'],'acceptedManifest':approval['manifest'],'priorApprovalExcluded':approval['excluded'],'ownerApprovalReceipt':{'path':receiptpath,'sha256':sha(R/receiptpath)},'patch':{'path':'scoring-g2-g3.proposed.patch','sha256':sha(O/'scoring-g2-g3.proposed.patch')},'artifacts':art,'contractCaveat':'growthOperands is a new compatibility assertion from a qualified source adapter, not source qualification by itself. Production adapter binding and exact new executable/compatibility approval are required before use. No data admission or economic assumption approved.','harnessOnlyDifference':'Alias imports target unchanged repository helpers; the candidate refuses FORMAL. The proposed source diff omits that review-harness guard and therefore is NOT authorized for activation.','requiredBeforeProduction':['Review/approve exact new manifest and growth-input contract','Bind qualified source dimensions in accepted adapter; no guessing','New executable identity/version/bundle and compatibility/admission verification','Explicit owner activation approval; no authority receipt inherited']};proposal['contentHash']=hashlib.sha256(json.dumps(proposal,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest();write('PATCH_PROPOSAL_MANIFEST.json',proposal)
counts=read(O/'BEFORE_AFTER_COUNTS.json');sem=read(O/'SEMANTIC_COVERAGE_CLOSURE.json');tests={name:read(O/name)for name in ['g2-g3-red.json','gate-regression-green.json','baseline-regression.json']}
ct=table(['Classification','Before','After'],[(k,counts['before'][k],counts['after'][k])for k in counts['before']])
md('VN30_USABILITY_BEFORE_AFTER.md',f'''# Before / after — bounded remediation v1.1
Baseline `{BASE}`; predecessor audit preserved byte-for-byte.

{ct}

250 target rows were inspected and reclassified: 175 partial mapping gaps and 75 analyst-judgment gaps. All rows retain exact required topics and incomplete full-topic qualification; this is not 250 new ratings. New full-topic research assessments: **0**; existing challenged assessments: **25**; separate TCB historical FH-BS draft: **1**. These 26 existing research/draft cases are separate from 75 additional partial semantic interpretation cases. Formal scoreable now: **0/690**, no synthetic score or reweighted total.

Financial values, all 55 prior exact-Decimal historical diagnostics, approved M3 bands/weights and production data remain unchanged. New semantic ledger entries are TEXT context, not admitted financial facts. G2/G3 are corrected only in an isolated review candidate; the accepted executable is unchanged pending explicit approval.

Net reduction of uninspected cases: **250**. Net reduction of full-topic/approval blockers or new complete scorecards: **0**. Mapping/analyst counts rise because the prior unknown cases now have source-specific context and exact unresolved products. No genuinely-missing claim is inferred from a search non-hit.
''')
md('SCORING_GATE_REGRESSION_RESULTS.md',f'''# Scoring gate regression results
Supported Node: `/tmp/node-v22.23.2-darwin-arm64/bin/node` (v22.23.2); Vitest project dependency. No package installation, provider calls or production database runner.

- Focused pre-patch regression: **{tests['g2-g3-red.json']['numFailedTests']} expected failures**, {tests['g2-g3-red.json']['numPendingTests']} skipped. G2 independent rubric survival and G3 cross-year acceptance fail on the baseline copies. `g2-g3-red.json` is the intentional RED receipt.
- Final isolated regression/contract tests: **{tests['gate-regression-green.json']['numPassedTests']}/{tests['gate-regression-green.json']['numTotalTests']} PASS**. Positive/negative growth contexts, unit/scope/revision/horizon/annual-window checks, EPS action evidence, missing/stale/conflicting evidence, unchanged non-CAGR guards, all-sector baseline parity and formal-candidate rejection are included.
- Selected unchanged baseline suite: **{tests['baseline-regression.json']['numPassedTests']}/{tests['baseline-regression.json']['numTotalTests']} PASS** (`scoring`, golden cases, methodology validation, evidence time). No whole-application/release PASS is claimed.
- Candidate/test TypeScript: final `tsc --noEmit --project .../tsconfig.json` receipt must be PASS in execution-receipts.json.

G4/G5/G7 prototype tests demonstrate required failure blocks only its dependent rubric (and complete total), context failure does not block or downgrade confidence by itself, and supporting failure requests review. Every mandatory topic stays REQUIRED; weaker duplicate roles cannot downgrade it. Cyclical normalization and genuine confidence guards are unchanged. The role prototype is **not wired into the accepted or candidate scorer**; it is a reviewed contract proposal rather than an unapproved production guard change.

The initial full test-harness attempt is preserved as test-harness-initial.json. Some assertions incorrectly matched the public ValidationError message instead of its structured reason; they were corrected before the focused two-case RED receipt. No production source was edited to make tests pass. Tests reuse existing TEST_ONLY fixtures solely for regression; no issuer synthetic Fundamental Score is produced or published.

## Correction to v1.0 G1
`validation.ts list(values,max)` enforces an upper bound. `list(assessments,23)` allows partial arrays; the executable already returns N/R for unassessed rubrics. No G1 code change is proposed. The complete-total/null rule and no-reweighting control remain.
''')
md('TARGETED_REMEDIATION_REVIEW.md',f'''# Targeted remediation v1.1
Baseline `{BASE}`. Research/proposal scope only. **READY FOR OWNER PATCH/CONTRACT REVIEW**, not production activation.

## A — G2/G3
An unapplied unified patch and an executable review candidate correct the proven regressions. G2 gates GQ-HIST, valuation and capital-allocation rubrics conservatively, plus actual per-share/SHARES or action-sensitive operand consumption. Independent industry/governance survive an unrelated action failure. Action-dependent metrics also remain N/R when comparability/evidence fails. Unrelated bad action context can still affect confidence under the unchanged G7 guard; no bypass is hidden.

G3 requires two source-bound annual operand declarations with same qualified scope, unit and revision policy, full annual windows and a matching 3/5-year horizon. SourceReference and operand identity/date bindings are mandatory. EPS CAGR additionally needs ACTION_ADJUSTED provenance; missing/stale/conflicting action inputs remain blocked. Unknown dimensions never receive a default. Decimal/BigInt arithmetic is unchanged.

Accepted executable files remain unchanged. The existing [owner receipt](../../evidence/2026-10-29-approved-authority-activation/OWNER_APPROVAL_RECEIPT.json) excludes **"future changed bytes"**; production-authority.ts:52–71 verifies exact bytes/manifests. This task authorizes preparation/testing, not inheritance of that approval. `PATCH_PROPOSAL_MANIFEST.json` binds the exact proposed patch and harness. No new approved methodology, authority bundle, production import or activation is created.

## B — G4/G5/G7
`RUBRIC_DEPENDENCY_MATRIX.json` contains all 690 instances, REQUIRED M3 topics, SUPPORTING financial/disclosure context, context-only references and selected-model required operands. `candidate/dependency-contract.ts` is a test-only proposal, not a policy or live scorer change. Required-topic evidence cannot be made optional; a contextual ratio cannot qualify a mandatory topic. Supporting uncertainty must receive an explicit confidence/evidence review, never an automatic HIGH grade.

## C — Semantic closure
All 250 prior NOT_INSPECTED rows have source-bound review records. Full retained note text was searched, relevant passages and financial/research records reviewed, and specific unsupported inferences rejected. Recovered paths include investment/financing cashflow, issuer capital/EPS/actions, regulatory/financial-risk disclosures, auditor/related-party sections and retained business/market narratives. The workflow distinguishes these contexts from full rubric proof. It does not certify every OCR character, original publication date or economic claim.

13 candidate passages were rejected as false friends/context errors; market-share accent folding no longer mistakes **"thì phần"** for **"thị phần"**. Repo repurchases are not M&A, cash-equivalent value stability is not an industry cycle, collateral haircuts are not funding responses, and instrument counterparties are not related-party governance. Examples: STB/TCX explicitly do not present interest sensitivity under their stated rationale; HPG's retained June-2026 share claim is not FY2025; VPB's subsidiary IPO is not a parent-bank issue; VNM's 2021 subsidiary event is not a 2025 parent issue. These limitations are source-bound in closure/challenge files.

75 rows now require analyst interpretation of partial retained disclosure; 175 have specific mapping gaps. No new full-topic band assessment, human approval or formal point is fabricated. The 25 challenged assessments and TCB FH-BS historical draft remain exactly bound. Market peer denominators/cost comparisons, quantified sector stress outcomes, calibrated forecast ranges and realized common-owner allocation outcomes remain exact dependencies where the retained evidence does not establish them.

## D — Revalidation / stop
Final mechanical validation reruns original audit obligations against the final 690-row state, source pointers, all original numeric facts/55 diagnostics and protected/authority/database hashes. Test receipts and patch application-check receipts are retained; validation-results.json governs the executed outcome. No full release or independent human acceptance is claimed.

**STOP.** Owner review is required for the exact patch/growth contract and separate G4/G5/G7 dependency interpretation. A named analyst must adopt/challenge qualified research and resolve the listed evidence products. Pending valuation choices remain pending; no generic new readiness phase, source acquisition, score total, ranking, BUY/SELL, DCA, NAV or ledger activation follows automatically.
''')
md('VALIDATION.md','''# Validation — final state

Run `python3 validate.py` from this folder after tests. It freshly reruns the v1.0 audit categories: 690 unique issuer/rubric instances; exact M3 topics/taxonomy; mapping pointers and code/policy references; preserved 25 challenged assessments; null formal scores/decisions; all evidence source pointers/hashes; all 55 Decimal arithmetic and operand-dimension checks; configured Master/security/sector parity; protected code/policy/financial and approved authority/database hashes; and required deliverables. New checks cover exactly the 250 prior targets, truthful before/after transitions, no mandatory-topic role downgrade, no numerical-financial mutations, test receipts and unactivated patch applicability.

Source bytes are validated against protected-before.json and both old/new source pins. Current v1.0 folder and accepted authority files are protected inputs. The exact configured SQLite file is hashed before/after and compared with its prior protected receipt. SQLite reads use mode=ro&immutable=1; no migration/provider/live workflow is invoked. No old receipt is rewritten to fix a test.

Exact commands/exits and current candidate/typecheck artifacts are in execution-receipts.json. Node22.23.2 is used explicitly because the default22.12.0 is below package engines. No environment/package activation is performed. Test-only fixture scores are never published as issuer scores.

Exceptions/limits: raw OCR/narrative candidates remain unqualified context; a matched phrase or negative search is not a full semantic/absence proof. Some later-year/subsidiary events are preserved as such, not bridged into FY2025. New full-topic assessments and formal scoreable instances remain zero. The historical initial harness receipt is retained and explained in the regression report. Tests/validation are this agent's engineering and research review, not independent human acceptance or whole-production release.
''')
md('FINAL_REVIEW.md',f'''# Final review
Baseline `{BASE}`. **PASS WITH CONDITIONS / OWNER REVIEW REQUIRED**, subject to final validation receipts.

- Engineering: tested G2/G3 patch candidate; accepted source and authority remain unchanged. New CAGR compatibility contract and exact executable bytes require approval before activation. G4/G5/G7 remain a concrete, tested contract proposal; no hidden relaxation of normalization/confidence.
- Research: all 250 prior uninspected cases now have topic/source-specific review, counterevidence/limits and exact resolution products. 25 challenged research assessments and the separate TCB historical FH-BS draft are preserved. **0** new completed full-topic assessments and **0/690** formal scoreable now; 75 new analyst-judgment cases are partial, not 75 rating-ready cases.
- Risk: no missing-as-zero, incomplete /100 normalization, human provenance substitution, synthetic issuer score, valuation input invention or BUY/SELL. Group/parent/NCI, action-date, original/restated and source-year boundaries remain explicit.
- QA: see fresh validation-results.json, exact JSON test receipts and protected-integrity results. Full application/release and independent human acceptance are outside this proposal.

{ct}

Issue register: Critical0; Major4 (exact executable/growth contract approval; G4/G5/G7 production contract decision; incomplete full-topic economic/nonfinancial evidence; qualified valuation/time/action assumptions). Minor2 total: one open source-qualification issue and one resolved G1 inference correction; historical report preserved. Candidate implementation/test issues must be zero at the final receipt; these counts are readiness/approval issues, not six proven runtime defects.

Owner decisions: review the exact unapplied patch and growth-input contract; separately approve the dependency/criticality interpretation before any G4/G5/G7 wiring; assign named analyst adoption and only the exact evidence/valuation products still needed. Do not re-request retained financial files or known personal-account confirmations. No approval of economic assumptions or production is inferred from this remediation request.

**STOP — no production activation, portfolio mutation, trading, automatic next phase or generic readiness cycle.**
''')
write('ISSUE_REGISTER.json',[{'id':'AUTHORITY','severity':'Major','dependency':'Exact new patch/growth-context contract approval','owner':'OWNER','resolution':'Review PATCH_PROPOSAL_MANIFEST; do not activate before new manifest/bundle compatibility acceptance','stop':'No exact approval'}, {'id':'ROLE-CONTRACT','severity':'Major','dependency':'G4/G5/G7 role/criticality and confidence interpretation','owner':'OWNER_METHOD_REVIEW','resolution':'Approve/reject tested REQUIRED/SUPPORTING/CONTEXT_ONLY rules; keep live guards unchanged','stop':'Unresolved required-topic or normalization semantics'}, {'id':'FULL-TOPICS','severity':'Major','dependency':'Per-row exact missing economic/nonfinancial products','owner':'NAMED_RESEARCH_ANALYST','resolution':'Use SEMANTIC_COVERAGE_CLOSURE topic records; do not infer full bands from partial disclosures','stop':'Required topic cannot be bounded'}, {'id':'VALUATION','severity':'Major','dependency':'Qualified normalized owner economics, price/share/actions, cutoff and assumptions','owner':'OWNER_AND_ANALYST','resolution':'Decide only genuinely pending choices with source-bound ranges; no sandbox promotion','stop':'Missing compatible value/price/action/time evidence'}, {'id':'SOURCE-QUALIFICATION','severity':'Minor','dependency':'OCR/source date/scope/publication qualifications','owner':'RESEARCH_QA','resolution':'Qualify named retained passage when it is material to a selected rubric; no blanket corpus reacquisition','stop':'Material unresolved transcription or identity'}, {'id':'G1-CORRECTION','severity':'Minor','dependency':'Historical v1.0 max/min inference','owner':'ENGINEERING_QA','resolution':'Successor regression proves partial input supported; historical audit left unchanged','stop':'Do not implement an unnecessary G1 API rewrite'}])
issues=read(O/'ISSUE_REGISTER.json')
for issue in issues:issue['status']='RESOLVED_IN_SUCCESSOR_REPORT'if issue['id']=='G1-CORRECTION'else'OWNER_REVIEW_OR_EXACT_PRODUCT_PENDING'
write('ISSUE_REGISTER.json',issues)
print('Reports and unapplied patch generated',flush=True)
