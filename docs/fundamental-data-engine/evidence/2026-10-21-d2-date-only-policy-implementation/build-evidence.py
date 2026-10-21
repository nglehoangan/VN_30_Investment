from pathlib import Path
import json,hashlib,subprocess,datetime
P=Path(__file__).resolve().parent;R=Path.cwd();assert not (P/'ARTIFACT_HASHES.json').exists()
def load(p):return json.loads(Path(p).read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def canon(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
def save(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
policyPath=Path('src/domain/fundamentals/d2-policy-candidate-v1.json');policy=load(policyPath);policyHash=sha(canon(policy));(P/'D2_POLICY_CANDIDATE.json').write_bytes(policyPath.read_bytes())
paths=['src/domain/fundamentals/d2-policy-candidate-v1.json','src/domain/fundamentals/d2-availability.ts','src/infrastructure/fundamentals/d2-source-evidence.ts','tests/fixtures/d2-availability.ts','tests/unit/d2-availability.test.ts','tests/integration/d2-source-evidence.test.ts']
body={'id':'d2-conservative-date-only-implementation-v1','version':'1.0.0','policyId':policy['id'],'policyHash':policyHash,'artifacts':[{'path':p,'sha256':sha(Path(p).read_bytes())} for p in paths],'productionActivationApproved':False};manifest={**body,'contentHash':sha(canon(body))};save('D2_IMPLEMENTATION_MANIFEST.json',manifest)
(P/'D2_OWNER_DECISION.md').write_text(f'''# D2 Owner decision — policy semantics and implementation only

Source: explicit Owner session instruction dated2026-10-21, “D2 Conservative DATE_ONLY Availability: APPROVED.”

Approval scope: **policy semantics and implementation only**. **Production activation NOT APPROVED.** This records the Owner's instruction in review evidence; it does not register or activate a production methodology/authority or approve source facts.

Owner-approved semantics:

1. DATE_ONLY requires verified authoritative issuer/exchange public disclosure, exact source-to-document identity and immutable evidence binding.
2. Preserve original precision; publishedAt remains null if exact time is unknown. DATE_ONLY is never interpreted as an actual publication timestamp.
3. Timezone Asia/Ho_Chi_Minh. Conservative boundary is00:00 at the beginning of the next local calendar day, represented as17:00Z on the original date (UTC+7).
4. effectiveKnownAt is the maximum of publication boundary, retrieval, ingestion, verification, mapping knowledge, methodology knowledge and every other applicable required contract boundary. Missing required knowledge evidence blocks; never backdate availability or use future information at an earlier AS_KNOWN cutoff.
5. Preserve verified exact timestamp behavior. Never admit unverified VHM publication leads.
6. Do not activate D2/runtime authorities, execute MARKET CAS, create scorecards/rankings, transactions or orders.

Policy candidate identity: `{policy['id']}`; version `{policy['version']}`.
Canonical JSON SHA256: `{policyHash}`.
Exact policy file SHA256: `{sha(policyPath.read_bytes())}` (source and evidence copy are byte-identical).

Implementation candidate identity: `{manifest['id']}`; version `{manifest['version']}`.
Implementation manifest canonical content SHA256: `{manifest['contentHash']}` (hash excludes its own contentHash field).
Exact source/test file hashes are bound by D2_IMPLEMENTATION_MANIFEST.json. These hashes describe reviewed implementation artifacts, not activation approval or source admission.

Policy approval does not approve a metadata source, identity relationship, financial mapping, accounting fact, normalization or dataset. PinnedD2Availability requires separately approved exact source-publication and source-identity bindings, reads/re-hashes actual configured document/metadata/observation/knowledge bytes, and emits candidate evidence only. No caller-supplied identity or approval flag creates trust. No approved production binding or admission receipt is generated.

Independent CIO review must assess these exact artifacts and tests. Any subsequent active runtime integration/authority version/effectivity and actual source qualification need their own concrete review; no blank future hash is approved here.
''')
# Replay the production baseline without modifying historical output paths.
outputs={};source=Path('docs/fundamental-data-engine/evidence/2026-10-20-production-authority-final-activation/replay-authorities.py').read_text().replace("def save(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\\n')","def save(n,x): outputs[n]=x");exec(compile(source,'readonly-D2-authority-replay','exec'),{'outputs':outputs});save('AUTHORITY_REPLAY.json',outputs['INDEPENDENT_AUTHORITY_REPLAY.json'])
protected=['src/domain/fundamentals/source-publication.ts','src/infrastructure/fundamentals/source-publication.ts','src/domain/fundamentals/availability.ts','src/domain/fundamentals/availability-evidence.ts','src/domain/fundamentals/live-public-disclosure.ts','src/domain/fundamentals/runtime-provenance.ts','src/domain/fundamentals/scoring-bridge.ts','src/infrastructure/dependencies/active-authorities.json']
pins=[]
for p in protected:
 current=Path(p).read_bytes();head=subprocess.check_output(['git','show','HEAD:'+p]);assert current==head,p;pins.append({'path':p,'sha256':sha(current),'equalsBaselineHEAD':True})
save('COMPATIBILITY_REVIEW.json',{'status':'ADDITIVE_CANDIDATE_EXISTING_AUTHORITIES_UNCHANGED','baselineHead':load(P/'BASELINE_IDENTITY.json')['head'],'protectedImplementations':pins,'existingTimestampBehavior':'Existing assessAvailability/source-publication code unmodified; regression tested exact TIMESTAMP publicBoundary and unchanged old assessment. D2 timestamp candidate retains exact timestamp; required extra knowledge can delay its candidate availability, never rewrite publication.','dateOnlyBehavior':'New D2 evidence evaluator uses fixed Vietnam next-local-day boundary and all required clocks; no trusted-provider-receipt advance is permitted','nativeContractCompatibility':'D2_POLICY_CANDIDATE is a versioned additive candidate contract, not silently passed off as an existing AvailabilityPolicy or APPROVED runtime method. Existing timestamp-only FormalPreparation remains unchanged and will reject DATE_ONLY until a separately reviewed versioned production integration is explicitly authorized.','sourceIdentityTrust':'Both exact source-publication contract/method and exact document/metadata identity binding/method must independently be approved; D2 approval grants neither','activatedAuthorities':0,'newProductionAdmissionReceipts':0,'methodologyOrScoringChanged':False,'fiveRuntimeAuthorityCandidatesModified':False,'MBB':'DEFERRED'})
helper='docs/fundamental-data-engine/evidence/2026-10-21-escalated-blocker-resolution/verify-engineering.mjs';b=Path(helper).read_bytes();assert b==subprocess.check_output(['git','show','HEAD:'+helper]);seal=load('docs/fundamental-data-engine/evidence/2026-10-21-escalated-blocker-resolution/ARTIFACT_HASHES.json');assert seal['files'][helper]==sha(b)
save('LINT_BASELINE_COMPARISON.json',{'finding':'Unused instantiateSectorRequirements binding in sealed previous evidence helper','path':helper,'sha256':sha(b),'sameBytesInBaselineHEAD':True,'matchesPriorImmutableSeal':True,'introducedByD2':False,'warning':'@typescript-eslint/no-unused-vars','existingLintRuleModified':False,'existingSealedHelperModified':False,'resolution':'Keep baseline issue visible; targeted D2 lint and architectural boundary checks separately. Repair requires a separately tracked evidence-preserving erratum/migration, not rewriting the old seal or suppressing the lint rule.'})
save('ISSUES.json',{'critical':[],'major':[{'id':'REAL_SOURCE_DISCLOSURE_PROOF_MISSING','scope':'SOURCE_ADMISSION_DEPENDENCY_NOT_D2_CODE_DEFECT','detail':'No authoritative source/document identity captures were approved or facts admitted. Existing VHM leads remain unverified; policy semantics approval cannot certify them.','owner':'Issuer/exchange source verification analyst and independent source-authority reviewer','exitCriteria':'Exact original public disclosure/source-to-document bytes and approved source/identity/mapping/knowledge bindings independently verified'}],'minor':[{'id':'PREEXISTING_SEALED_HELPER_LINT_WARNING','scope':'BASELINE_TECHNICAL_DEBT','detail':'Full pnpm lint fails on an unused import binding already present in baseline HEAD and its immutable evidence seal. D2 does not suppress the rule or modify old evidence.','owner':'Evidence tooling maintainer','exitCriteria':'Explicit evidence-preserving correction workflow approved and lint baseline restored'}],'approvalDependencies':['Independent CIO review of exact D2 policy/implementation hashes','Separately approved exact source-publication and source-identity evidence bindings and required clock evidence','Explicit separately authorized production integration/activation; not granted here'],'sourceFactsAutomaticallyApproved':0})
print(json.dumps({'policyId':policy['id'],'version':policy['version'],'canonicalPolicyHash':policyHash,'implementationHash':manifest['contentHash'],'protectedSourceFiles':len(pins),'productionActivated':False}))
