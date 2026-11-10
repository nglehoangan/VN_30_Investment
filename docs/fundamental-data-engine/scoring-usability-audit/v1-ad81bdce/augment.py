from pathlib import Path
import json,hashlib
R=Path('/Users/nglehoangan/Documents/Working/VN_30_Investment');O=R/'docs/fundamental-data-engine/scoring-usability-audit/v1-ad81bdce'
def load(p):return json.loads(p.read_text())
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
pins=load(O/'SOURCE_PINS.json');m=load(O/'VN30_ISSUER_RUBRIC_MATRIX.json');pre=(O/'PRELIMINARY_ASSESSMENT.md').read_text();ctx=load(O/'ISSUER_CONTEXT.json')
for t in ctx:
 exact=[x.get('reason')for x in ctx[t].get('remainingInputs',[])if x.get('id')=='business-understanding']
 if exact:
  needle=f"## {t} — "
  start=pre.index(needle);at=pre.index('\n\n',start)+2;pre=pre[:at]+'Retained issuer-specific research dependency: '+str(exact[0])+'.\n\n'+pre[at:]
(O/'PRELIMINARY_ASSESSMENT.md').write_text(pre)
p='docs/fundamental-data-engine/dfr-05/p2-6-tcb-78d7069d/rubric-underwriting.json';tc=load(R/p);pins[p]=sha(R/p)
review_paths=['docs/fundamental-data-engine/dfr-05/p2-5-b1-readiness-74510523/proof.py','docs/fundamental-data-engine/dfr-05/p2-5-b1-readiness-74510523/readiness-matrix.json','docs/fundamental-data-engine/dfr-05/p2-6-tcb-78d7069d/decision-readiness.json','docs/fundamental-data-engine/dfr-05/tcb-sandbox-v1-cf987271/scenario-outputs.json','docs/fundamental-data-engine/dfr-05/tcb-sandbox-v1-cf987271/TCB_SANDBOX_FINAL_REVIEW.md','docs/fundamental-data-engine/dfr-05/tcb-sandbox-v1-cf987271/metadata-correction.json']
review=[]
for f in review_paths:
 pins[f]=sha(R/f);d=load(R/f)if f.endswith('.json')else (R/f).read_text();review.append({'path':f,'sha256':pins[f],'inspection':'READ_EXISTING_APPROVED_RESEARCH_CONTEXT_NO_PROMOTION'})
for r in m['rows']:
 r['issuerSpecificResearchDependency']=[x.get('reason')for x in ctx[r['ticker']].get('remainingInputs',[])if x.get('id')=='business-understanding']
 r['uninspectedFullTopics']=[x['topic']for x in r['topics']if x['status']=='NOT_INSPECTED_FOR_FULL_TOPIC']
 if r['uninspectedFullTopics']:r['secondaryBlockers'].append('FULL_TOPIC_REVIEW_NOT_INSPECTED')
 r['formalGateReferences']=[{'path':'src/domain/scoring/scorecard.ts','lines':[80,90,118,119,135,136]},{'path':'docs/03 SCORING/SCORING_ENGINE.md','lines':[377,385,640,679,1030]}]
 if r['ticker']=='TCB':
  i=next(i for i,x in enumerate(tc)if x['rubric']==r['rubric']);x=tc[i]
  r['latestP26Underwriting']={'path':p,'sha256':pins[p],'jsonPointer':'/'+str(i)}
  r['latestP26Status']=x['status'];r['latestP26MandatoryTopicsQualified']=x['allMandatoryTopicsQualified'];r['latestP26Scope']=x.get('qualificationScope');r['latestP26AssessmentReasoning']=x.get('analystReasoning');r['latestP26FormalPoints']=None
  if x['allMandatoryTopicsQualified']:
   r['secondaryBlockers'].append('P26_HISTORICAL_DRAFT_QUALIFIED_NOT_FORMALLY_ADOPTED');r['topicsHistoricalP26QualificationReference']=r['latestP26Underwriting']
write(O/'VN30_ISSUER_RUBRIC_MATRIX.json',m);write(O/'SOURCE_PINS.json',pins);write(O/'APPROVED_RESEARCH_REVIEW.json',review)
with (O/'VN30_SCORING_USABILITY_AUDIT.md').open('a')as f:f.write('\nTCB successor review: P2.6 contains one historical draft-qualified FH-BS rubric, distinct from the 25 challenged DFR-04 provisional assessments and still without formal points. Its exact per-rubric underwriting is bound in the matrix. P2.5 reports 54 partially ready/84 blocked instances across six B1 issuers; none is automatically promoted. The sandbox remains hypothetical; its historical preparation-time commit metadata is not a current HEAD claim.\n')
issues=[{'id':'G2','severity':'Major','issue':'Corporate-action flag suppresses unrelated rubrics','status':'PROPOSAL_ONLY'}, {'id':'G3','severity':'Major','issue':'Same-period guard rejects valid cross-year CAGR before arithmetic','status':'STATIC_WITNESS_PENDING_REGRESSION'}, {'id':'G4','severity':'Major','issue':'Any requested failed metric treated as critical; optionality not represented','status':'DEPENDENCY_DESIGN_REVIEW'}, {'id':'A1','severity':'Major','issue':'Uninspected full qualitative topics prevent an exhaustive score-readiness conclusion','status':'EXPLICIT_NOT_INSPECTED_NO_MISSING_CLAIM'}, {'id':'G1','severity':'Minor','issue':'Complete assessment-array contract couples partial research display to full scorecard','status':'SEPARATE_PRESENTATION_PROPOSAL'}, {'id':'G5','severity':'Minor','issue':'Blanket cyclical normalization may suppress reported diagnostics','status':'POLICY_INTERPRETATION_REVIEW'}, {'id':'G7','severity':'Minor','issue':'Unrelated unavailable references can lower global confidence','status':'DEPENDENCY_DESIGN_REVIEW'}]
write(O/'ISSUE_REGISTER.json',issues)
counts=load(O/'AUDIT_COUNTS.json');top=counts['topFive']
(O/'FINAL_REVIEW.md').write_text(f'''# Final review — bounded audit v1.0
Baseline `{m['baselineCommit']}`; 2026-11-10. Review perspectives are this audit's synthesis, not external independent human acceptance.

**PASS WITH CONDITIONS for the bounded structural audit; full semantic scoring-readiness review is incomplete.** All 690 instances are dispositioned; NOT_INSPECTED topics remain visible. No new formal points, scorecards, rankings or trades. The validation receipt is authoritative for mechanical checks; code/policy findings are static inspection, not an executed scorer regression.

- CIO: reported financial availability has research value; normalization, qualitative topics and valuation cannot be replaced by ratio volume. Readiness shortlist: {', '.join(top)}, based on challenged provisional-rubric coverage with alphabetical ties, not expected returns.
- Equity Research: preserve 25 challenged provisional assessments plus TCB's separate historical draft FH-BS context. The matrix records exact required topics, partial mappings, source pointers and unresolved products. No complete qualitative review is claimed.
- Risk: all formal points/total/M4 remain null; missing is never zero; sandbox scenarios and conditional normalization are not qualified valuation. No portfolio or account state is needed merely to calculate fundamental quality points; actionability remains separate.
- Engineering: scoped G2/G3 corrections are candidates for a separately approved patch with parity/negative tests. G4/G5/G7 need dependency/criticality interpretation, not broad bypasses. Current code and source datasets remain untouched, subject to the byte-integrity receipt.

Issue register: Critical **0**, Major **4**, Minor **3**. These include an explicit audit-coverage limitation, not seven proven production defects. No newly proven genuinely absent financial input; zero GENUINELY_MISSING means absence not established. No definitive first complete-score date can be promised from this evidence.

Owner decision: review this audit, authorize only specific remediation/analyst adoption work, and explicitly choose pending valuation and any genuinely new source authority. No implementation approval inferred. **STOP — no remediation, M3/M4 change, production activation or investment decision.**
''')
(O/'VALIDATION.md').write_text('''# Validation

Run `python3 validate.py` in this versioned folder. It validates 690 unique rows/30×23, exact classifications, evidence pointers and source hashes, preserved research bindings, Decimal arithmetic, configured Master parity, required deliverables and all captured preexisting tracked/data byte fingerprints. See `validation-results.json` for exact executed counts/results and `manifest.json` for canonical matrix/file hashes.

Reproduction: run `python3 build.py`, then `python3 augment.py`, then `python3 validate.py` on the pinned baseline and unchanged retained sources. Build/augment write this audit folder only; validate reads repository sources/SQLite receipt, never production engines or providers. BASELINE_FINGERPRINTS.json records paths enumerated before this folder was created. No earlier source receipt was edited. Source pins protect approved P2.5/P2.6/sandbox and methods; original historical metadata stays historical.

Limits: source JSON/schema inspection and note term searches do not validate every OCR caption or certify full topic evidence. No PDF re-extraction, acquisition, full application suite, engine regression, live decision, accounting admission or formal independent analyst approval was executed. The static CAGR/action predicate witnesses prove inspected guard behavior, not end-to-end model acceptance. Existing legacy release/test failures are outside this docs-only audit; no whole-production PASS is claimed.
''')
print('Augmented',len(m['rows']),'issues',len(issues),flush=True)
