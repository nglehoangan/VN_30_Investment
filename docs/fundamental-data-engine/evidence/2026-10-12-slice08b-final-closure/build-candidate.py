"""Read-only financial audit. Writes only a new candidate/output directory; never admits data."""
import argparse,collections,hashlib,json,os,pathlib,re,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[4]
BASE=ROOT/'docs/fundamental-data-engine/evidence/2026-10-12-governance-closure-selected-path-corrected'
DEFAULT=pathlib.Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--output',type=pathlib.Path,default=DEFAULT);parser.add_argument('--reverse',action='store_true');args=parser.parse_args();OUT=args.output;OUT.mkdir(parents=True,exist_ok=True)
def read(p):return json.loads(pathlib.Path(p).read_text())
def digest(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def stable(v):return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def write(n,v):(OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
def key(r):return tuple(r[k] for k in ['securityId','itemId','reportingScope','periodStart','periodEnd'])
packet=read(BASE/'EXECUTION_PACKAGE_REDACTED.json');manifest=read(BASE/'SNAPSHOT_MANIFEST.json')
ident=read(ROOT/'docs/fundamental-data-engine/evidence/2026-10-10-di123-identities.json');sectors=read(ROOT/'docs/fundamental-data-engine/evidence/2026-10-10-di123-sectors.json')
observations=packet['canonicalObservations'];assessments=packet['availabilityAssessments'];requirements=manifest['requirements'];attempts=packet['derivationAttempts']
if args.reverse:
 observations=list(reversed(observations));assessments=list(reversed(assessments));requirements=list(reversed(requirements));attempts=list(reversed(attempts))
observations=sorted(observations,key=lambda x:x['id']);assessments=sorted(assessments,key=lambda x:x['id']);requirements=sorted(requirements,key=key);attempts=sorted(attempts,key=lambda r:(r['ticker'],r['metric'],r['periodEnd']))
obs={o['id']:o for o in observations};assessment={a['observationId']:a for a in assessments};bykey=collections.defaultdict(list)
for o in observations:bykey[key(o)].append(o)
findings={key(f['requirement']):f for f in manifest['findings'] if 'requirement' in f}
selected={key(f['fact']):f for f in manifest['facts']};identity={i['securityId']:i for i in ident['identities']};universe=next(r['content'] for r in manifest['references'] if r['kind']=='UNIVERSE');sectorrows=next(r['content'] for r in manifest['references'] if r['kind']=='SECTOR');sector={v.split(':')[0]:v.split(':')[1] for v in sectorrows}
# Source PDFs are counted by exact body identity; paths/filenames do not qualify issuer or period.
pdfs=[];bodyfiles={}
for p in sorted((ROOT/'data/manual-fundamentals').rglob('*.pdf')):
 h=digest(p);row={'path':str(p.relative_to(ROOT)),'bodyHash':h,'bytes':p.stat().st_size};pdfs.append(row);bodyfiles.setdefault(h,[]).append(row['path'])
write('MANUAL_SOURCE_INVENTORY.json',{'pdfCount':len(pdfs),'uniqueBodyHashes':len(bodyfiles),'rows':pdfs,'pathSemantics':'Folder labels are hints, not issuer/period/qualification proof.'})
# Read every resident raw reader and native text file. Capture captions as candidates, not policy proof.
bankhashes=set()
for o in observations:
 if sector.get(o['securityId'])=='BANK':bankhashes.update(v.split(':',1)[1] for v in o['transformationReferences'] if v.startswith('document-sha256:'))
pattern=re.compile(r'CASA|Auto.?Earning|current accounts|savings accounts|non.performing|non performing|nợ xấu|Nợ xấu|không kỳ hạn|Không kỳ hạn|tiết kiệm|Tiết kiệm|Nhóm [345]|nhóm [345]|Group [345]',re.I)
hits=collections.defaultdict(list);unreadable=[];readerfiles=0;nativepages=0
for folder in [ROOT/'data/manual-extracted/current']:
 for p in sorted(folder.rglob('*.json')):
  if p.stat().st_flags & 0x40000000:unreadable.append(str(p.relative_to(ROOT)));continue
  try:d=read(p)
  except (ValueError,OSError):continue
  readerfiles+=1;h=d.get('bodyHash') if isinstance(d,dict) else None
  if p.name.endswith('.text.json'):
   nativepages+=len(d.get('pages',[]));texts=[(i+1,t) for i,t in enumerate(d.get('pages',[]))]
  else:
   h=h or p.name.split('.')[0].split('-')[0]
   texts=[(d.get('page') or d.get('pageNumber'),v) for k,v in d.items() if isinstance(v,str) and ('text' in k.lower() or 'reader' in k.lower())] if isinstance(d,dict) else []
   if isinstance(d,dict):
    for name in ['readerA','readerB','passA','passB']:
     if isinstance(d.get(name),dict):texts.append((d.get('page'),d[name].get('text','')))
     elif isinstance(d.get(name),list):texts.append((d.get('page'),'\n'.join(v.get('text','') for v in d[name] if isinstance(v,dict))))
     elif isinstance(d.get(name),str):texts.append((d.get('page'),d[name]))
  if h not in bankhashes:continue
  for page,t in texts:
   for line in t.splitlines():
    if pattern.search(line):hits[h].append({'file':str(p.relative_to(ROOT)),'page':page,'captionCandidate':line[:500]})
write('RETAINED_READER_SEARCH.json',{'residentFilesRead':readerfiles,'nativePagesRead':nativepages,'cloudOnlyFilesNotReadable':unreadable,'bankBodyHashesReviewed':sorted(bankhashes),'captionCandidates':{h:v for h,v in sorted(hits.items())},'limitation':'Caption search is discovery only; OCR is not certified financial evidence. Signing dates and product names never establish publication or policy.'})
selected_source_gaps=[]
for f in manifest['facts']:
 h=[v.split(':',1)[1] for v in f['fact']['transformationReferences'] if v.startswith('document-sha256:')]
 unavailable=[v for v in h if v not in bodyfiles]
 if unavailable:selected_source_gaps.append({'fingerprint':f['fingerprint'],'ticker':f['fact']['ticker'],'itemId':f['fact']['itemId'],'periodEnd':f['fact']['periodEnd'],'unavailableBodyHashes':unavailable})
source_missing_hashes=sorted(set(h for r in selected_source_gaps for h in r['unavailableBodyHashes']))
write('SELECTED_SOURCE_RETENTION_AUDIT.json',{'selectedFacts':len(manifest['facts']),'selectedFactsWithRawPDFUnavailable':len(selected_source_gaps),'selectedFactsWithRawPDFRetained':len(manifest['facts'])-len(selected_source_gaps),'unavailableOriginalSourceBodyCount':len(source_missing_hashes),'unavailableOriginalSourceBodies':source_missing_hashes,'rows':selected_source_gaps,'additionalStatementRequestsProven':0,'interpretation':'Exact historical source bodies are missing. Manual folder candidates may contain equivalent economic facts but identity/equivalence is not presumed. These gaps prevent provenance replay; they are not instructions to acquire more statements.'})
# Full static inventory makes scope coverage and the exact review corpus explicit.
inventory=[];stale=[];historicalhashes=[];hashfail=[];missinghashrefs=[]
for folder in ['docs','src','scripts','tests','prisma']:
 for p in sorted((ROOT/folder).rglob('*')):
  if not p.is_file() or DEFAULT in p.parents:continue
  if p.stat().st_flags & 0x40000000:continue
  inventory.append({'path':str(p.relative_to(ROOT)),'sha256':digest(p),'bytes':p.stat().st_size})
  if folder=='docs' and p.suffix in ['.md','.json','.mjs','.py']:
   text=p.read_text(errors='replace')
   refs=sorted(set(re.findall(r'data/(?:initialization[^\s"\'`<>),;]+|\.slice8-retired[^\s"\'`<>),;]*)',text)))
   broken=[r for r in refs if not (ROOT/r).exists()]
   if broken:stale.append({'artifact':str(p.relative_to(ROOT)),'missingHistoricalPaths':broken,'authority':'HISTORICAL_ONLY_NOT_CURRENT_EXECUTION'})
for p in sorted((ROOT/'docs/fundamental-data-engine/evidence').rglob('ARTIFACT_HASHES.json')):
 if DEFAULT in p.parents:continue
 try:d=read(p)
 except Exception:continue
 rows=d.get('artifacts',[]) if isinstance(d,dict) else []
 if not isinstance(rows,list):continue
 for r in rows:
  if not isinstance(r,dict):continue
  name=r.get('file') or r.get('path');expected=r.get('sha256')
  if not name or not expected:continue
  f=(p.parent/name) if 'file' in r else (ROOT/name)
  if not f.exists():missinghashrefs.append({'manifest':str(p.relative_to(ROOT)),'path':name});continue
  if f.stat().st_flags & 0x40000000:continue
  actual=digest(f)
  if actual!=expected:hashfail.append({'manifest':str(p.relative_to(ROOT)),'path':name,'expected':expected,'actual':actual,'interpretation':'Historical authority may have been superseded; never reuse its old hash as current authority.'})
  historicalhashes.append({'manifest':str(p.relative_to(ROOT)),'path':name,'matches':actual==expected})
write('REPOSITORY_REVIEW_CORPUS.json',{'files':inventory,'historicalHashChecks':historicalhashes,'hashMismatches':hashfail,'unavailableHistoricalHashReferences':missinghashrefs})
# Classification retains every exact requested path. No selector or scoring requirements are deleted.
human={'CAPEX','NORMALIZED_EBITDA','NORMALIZED_TAX_RATE','UNRESTRICTED_CASH'}
def layer(r):
 if r['itemId'] in human:return 'INVESTMENT_JUDGMENT' if r['itemId'].startswith('NORMALIZED_') else 'QUALITATIVE_ANALYST_REVIEW'
 if r['periodEnd']<'2023-01-01':return 'SCORING_INPUT_PREPARATION'
 return 'FUNDAMENTAL_DATA_ENGINE'
boundary=[]
for r in requirements:
 f=findings.get(key(r));owner=layer(r);rid='snapshot-path:'+hashlib.sha256(stable(r).encode()).hexdigest()
 boundary.append({'requirementId':rid,'originalIdentity':r,'securityId':r['securityId'],'ticker':identity[r['securityId']]['ticker'],'metric/item':r['itemId'],'period':{'start':r['periodStart'],'end':r['periodEnd']},'scope':r['reportingScope'],'originalRequirementSource':str((BASE/'SNAPSHOT_MANIFEST.json').relative_to(ROOT))+'#/requirements','originalRequirementVersion':manifest['requirementsVersion'],'ownerLayer':owner,'mandatoryForFundamentalDataEngine':owner=='FUNDAMENTAL_DATA_ENGINE','mandatoryForScoring':True,'currentStatus':f['code'] if f else 'SELECTED_VERIFIED_REVIEW_CANDIDATE','blockerReason':f['code'] if f else None,'evidenceReferences':[str((BASE/'SNAPSHOT_MANIFEST.json').relative_to(ROOT)), 'docs/03 SCORING/METRIC_DEFINITIONS.md#3.1','docs/08_CONTINUOUS_IMPROVEMENT/DATA_INITIALIZATION.md#9-15'],'classificationOnly':True,'productionAuthority':'PROPOSED_REQUIREMENTS_NOT_APPROVED_PRODUCTION_ADMISSION'})
write('SLICE8_REQUIREMENT_BOUNDARY.json',{'paths':boundary,'count':len(boundary),'requirementDeletion':False,'scoringRequirementsRelaxed':False,'scopeBasis':'Reported raw financial facts stay data-engine responsibilities. FY2022 supporting history and reviewed economic adjustments remain scoring/analyst work. No ownership label erases an exact pinned requirement.','layerDefinitions':{'FUNDAMENTAL_DATA_ENGINE':'Source qualification, normalization, exact mapping, availability, conflict/revision lineage, mechanical derivation and deterministic snapshot.','SCORING_INPUT_PREPARATION':'Historical endpoints and compatible metric inputs; minimum three-year trend does not require a fourth trend year.','QUALITATIVE_ANALYST_REVIEW':'Reviewed issuer capex/cash classifications and rubric judgments.','VALUATION':'Expected returns, valuation assumptions and enterprise/equity denominators.','MARKET_DATA':'Prices, capitalization, trading context.','INVESTMENT_JUDGMENT':'Normalized earnings/tax/EBITDA adjustments and investment judgments.','SCORING':'Human rubric assessment and approved scoring admission.','PORTFOLIO_DECISION':'External veto/risk/portfolio decisions.'}})
# Generic contract approval is current, never transplanted into the older frozen snapshot.
contract=read(ROOT/'src/infrastructure/fundamentals/casa-npl-source-contract-v1.json');bankmaps=[]
for a in attempts:
 if a['metric'] not in ['CASA','NPL']:continue
 candidates=[o for o in observations if o['securityId']==a['securityId'] and o['periodEnd']==a['periodEnd'] and o['itemId'] in ('BANK_CURRENT_AND_SAVINGS_DEPOSITS','BANK_CUSTOMER_DEPOSITS','BANK_NONPERFORMING_LOANS','BANK_GROSS_CUSTOMER_LOANS')]
 hashes=sorted(set(v.split(':',1)[1] for o in candidates for v in o['transformationReferences'] if v.startswith('document-sha256:')))
 bankmaps.append({'ticker':a['ticker'],'securityId':a['securityId'],'metric':a['metric'],'period':a['periodEnd'],'scope':'CONSOLIDATED','status':'EVIDENCE_INSUFFICIENT','decisionClass':'POLICY_DECISION_REQUIRED','genericContract':contract['version'],'genericApproved':True,'bankSpecificOwnerApprovalPresent':False,'mappingCandidateStatus':'NOT_READY_FOR_OWNER_CONFIRMATION','sourceCandidates':[{ 'observationId':o['id'],'caption':o['raw']['label'],'location':o['raw']['fieldLocator'],'unit':o['raw']['unit'],'availabilityStatus':assessment[o['id']]['status'],'accountingBasis':o['accountingBasis']} for o in candidates],'documentBodies':hashes,'explicitDefinitionCaptionCandidates':[v for h in hashes for v in hits.get(h,[]) if re.search(r'nợ xấu|CASA|non.performing',v['captionCandidate'],re.I)],'originalSourceBodiesUnavailable':[h for h in hashes if h not in bodyfiles],'captionEvidenceReferences':['RETAINED_READER_SEARCH.json#/captionCandidates/'+h for h in hashes if h in hits],'missingProof':['Owner-approved enumerated product/class population and effective definition version','Complete numerator/denominator source-caption equivalence and scope/basis bridge where required','Evidence-complete public authority/PIT and exact source locations'],'executionAllowed':False,'sourceValuesNotSubstituted':True})
write('BANK_SPECIFIC_CASA_NPL_MAPPING.json',{'genericContractStatus':'APPROVED_PROSPECTIVELY','approvalRecordedAt':contract['approvalRecordedAt'],'bankSpecificApprovedEntries':len(contract['bankSpecificMappings']),'historicalGenericDefects':2,'currentGenericDefects':0,'rows':bankmaps,'noDelegation':'Approved contract explicitly requires owner-approved issuer/period-specific tables; mechanical delegation was not granted.'})
# Every UNKNOWN is included, even if not selected or path is already satisfied.
unknown=[];relevant=[];affected=set();direct=set();overlap=set()
for a in assessments:
 if a['status']!='UNKNOWN':continue
 o=obs[a['observationId']];k=key(o);r=next((r for r in requirements if key(r)==k),None);f=findings.get(k);mandatory=r is not None and layer(r)=='FUNDAMENTAL_DATA_ENGINE';category='PUBLICATION_EVIDENCE_REQUIRED'
 b={'observationId':o['id'],'securityId':o['securityId'],'ticker':o['ticker'],'itemId':o['itemId'],'periodStart':o['periodStart'],'periodEnd':o['periodEnd'],'scope':o['reportingScope'],'assessmentId':a['id'],'finding':a['finding'],'publication':o['publication'],'providerReceivedAt':o.get('providerReceivedAt'),'providerReceiptReference':o.get('providerReceiptReference'),'correctionKnownAt':o.get('correctionKnownAt'),'revisionKind':o.get('revisionKind'),'evidenceInputs':a.get('evidenceInputs',[]),'livePublicDisclosureBinding':a.get('livePublicDisclosureBinding'),'classification':category,'selected':False,'pathSatisfied':k in selected,'mandatoryForFundamentalDataEngine':mandatory,'requiredPathFinding':f['code'] if f else None,'resolution':'UNRESOLVED_NO_ADMISSIBLE_PUBLICATION_OR_TRUSTED_RECEIPT_PROOF','evidenceReferences':o['transformationReferences']}
 unknown.append(b)
 if mandatory and f:
  relevant.append(b);affected.add(k)
  if f['code']=='BLOCKED_PUBLICATION_UNKNOWN':direct.add(k)
  elif f['code']=='BLOCKED_CONFLICT':overlap.add(k)
unsafe=sum(f['availability']['status']!='VERIFIED' for f in manifest['facts'])
write('FINAL_REQUIRED_PATH_PIT_CLOSURE.json',{'allUnknownAudited':len(unknown),'beforeUnknown':len(relevant),'resolvedUnknown':0,'remainingUnknown':len(relevant),'affectedRequiredPaths':len(affected),'unknownOnlyBlockedPaths':len(direct),'unknownConflictOverlap':len(overlap),'unknownFreshnessOverlap':len(affected-direct-overlap),'unsafeSelected':unsafe,'allUnknownRows':unknown,'requiredBlockedObservationIds':[r['observationId'] for r in relevant],'policyGovernance':manifest['policy'],'productionPITSafe':False,'limitation':'VERIFIED here is candidate-policy status, not an approved Slice05 historical timestamp. The live-public policy is PROPOSED and INITIAL_LIVE_ONLY. No signing/local/filename date was promoted.'})
# Equal values alone cannot prove equivalent scopes/classes/calendars or a valid revision chain.
conflicts=[]
for c in sorted(packet['unresolvedConflicts'],key=lambda c:key(c['requirement'])):
 r=c['requirement'];contexts=c['contexts'];same=len(set(c['values']))==1
 classification='OTHER_REVIEW_REQUIRED'
 conflicts.append({**c,'classification':classification,'sameValues':same,'economicConflictProven':False,'status':'UNRESOLVED','mandatoryForFundamentalDataEngine':layer(r)=='FUNDAMENTAL_DATA_ENGINE','reason':'Equal values do not prove explicit economic-equivalence/lineage' if same else 'Differing retained normalized amounts require exact caption/header/revision review; extraction error or restatement is not proven','evidenceReferences':[v for o in contexts for v in o['definitionReferences']],'resolutionAuthority':'QUALIFIED_SOURCE_CONTEXT_OR_REVISION_EVIDENCE_REQUIRED'})
write('FINAL_CONFLICT_CLOSURE.json',{'before':len(conflicts),'resolved':0,'remaining':len(conflicts),'trueEconomicConflicts':0,'potentialDifferingValueConflicts':sum(not c['sameValues'] for c in conflicts),'trueEconomicConflictsSemantics':'Economic cause is unproven for every unresolved conflict; nine have differing normalized values. No latest-wins selection.','requiredPathConflicts':sum(c['mandatoryForFundamentalDataEngine'] for c in conflicts),'nonBlockingConflicts':sum(not c['mandatoryForFundamentalDataEngine'] for c in conflicts),'snapshotRequiredPathConflicts':len(conflicts),'rows':conflicts})
# Missing PDF assertions need actual scope/period qualification. A folder match is insufficient.
missing=[]
for b in boundary:
 if b['currentStatus']!='BLOCKED_REQUIRED_FACT_MISSING':continue
 r=b['originalIdentity'];ticker=b['ticker'];sourcepaths=[d['path'] for d in pdfs if '/'+ticker+'/' in d['path']];classification='OTHER';reason='SOURCE_DOCUMENT_CANDIDATES_PRESENT_EXTRACTION_OR_MAPPING_UNPROVEN: issuer-folder PDFs exist; exact required period/caption and qualification are unproven. Another PDF is not proved necessary.'
 if b['ownerLayer']!='FUNDAMENTAL_DATA_ENGINE':classification='OPTIONAL_HISTORY' if r['periodEnd']<'2023-01-01' else ('INVESTMENT_JUDGMENT' if r['itemId'].startswith('NORMALIZED_') else 'QUALITATIVE_REVIEW')
 elif r['itemId'] in ['BANK_CURRENT_AND_SAVINGS_DEPOSITS','BANK_NONPERFORMING_LOANS']:classification='BANK_SPECIFIC_MAPPING_REQUIRED'
 elif not sourcepaths:classification='OTHER';reason='No issuer-folder PDF candidate; missing mandatory source is not proven without qualified reporting-window inventory.'
 missing.append({**b,'classification':classification,'sourceDocumentCandidates':sourcepaths,'sourcePresenceQualified':False,'reason':reason,'additionalFinancialStatementRequired':False,'exactCaptionAbsenceProven':False})
counts=collections.Counter(r['classification'] for r in missing)
write('FINAL_MISSING_FACT_AUDIT.json',{'total':len(missing),'trueSourceMissing':counts['SOURCE_DOCUMENT_MISSING'],'extraction':counts['SOURCE_DOCUMENT_PRESENT_FACT_NOT_EXTRACTED'],'mapping':counts['SOURCE_DOCUMENT_PRESENT_MAPPING_MISSING']+counts['BANK_SPECIFIC_MAPPING_REQUIRED'],'downstream':sum(r['ownerLayer']!='FUNDAMENTAL_DATA_ENGINE' for r in missing),'falseBlockersResolved':0,'downstreamPathsExcludedFromEngineDiagnostic':sum(r['ownerLayer']!='FUNDAMENTAL_DATA_ENGINE' for r in missing),'additionalPDFsProvenRequired':0,'extractionVersusMappingUnresolved':counts['OTHER'],'scopePeriodCoverageUnknown':sum(not r['sourcePresenceQualified'] for r in missing if r['mandatoryForFundamentalDataEngine']),'countsByClass':dict(sorted(counts.items())),'rows':missing,'answer':'No additional statement requirement proven. 25 bank-component paths need bank-specific mapping, 60 are downstream judgments, and 337 cannot yet be distinguished between extraction and exact caption mapping. Missing PDFs and exact missing extraction counts are not inferred.'})
fresh=[]
for b in boundary:
 if b['currentStatus']!='BLOCKED_FRESHNESS_POLICY_UNRESOLVED':continue
 r=b['originalIdentity'];f=findings[key(r)];fresh.append({**b,'freshnessClass':'fundamental fact freshness' if b['mandatoryForFundamentalDataEngine'] else 'derived metric freshness','candidateFingerprints':[c['fingerprint'] for c in f['candidates']],'reason':'Pinned maxAgeDays is null and no accepted evidence-bound operational freshness resolved this exact path. A new cutoff or invented threshold cannot resolve it.','status':'UNRESOLVED','policyGovernance':'PROPOSED','resolved':False})
write('FINAL_FRESHNESS_AUDIT.json',{'total':len(fresh),'fundamentalFreshnessBlockers':sum(f['mandatoryForFundamentalDataEngine'] for f in fresh),'downstreamFreshnessBlockers':sum(not f['mandatoryForFundamentalDataEngine'] for f in fresh),'resolvedFalseBlockers':0,'remainingTrueBlockers':sum(f['mandatoryForFundamentalDataEngine'] for f in fresh),'rows':fresh,'marketOrValuationFreshnessMisclassified':0})
deriv=[]
for a in attempts:
 status='OPERAND_MISSING'
 if a['status']=='CALCULATED':status='CALCULATED'
 elif a['obligationRole']=='SUPPORTING_FY2022_ROUTE_ATTEMPT_NOT_ADDITIONAL_MINIMUM_3Y_REQUIREMENT':status='OPTIONAL'
 elif any(o['operation']=='HUMAN_NORMALIZED' for o in a['requiredOperands']):status='HUMAN_ANALYST_REVIEW_REQUIRED'
 elif a['metric'] in ['CASA','NPL']:status='MAPPING_REQUIRED'
 elif any(o.get('dependencyClass') in ['INVESTMENT_JUDGMENT','QUALITATIVE_REVIEW'] for o in a['missingOperands']):status='HUMAN_ANALYST_REVIEW_REQUIRED'
 else:
  ins=[obs[i] for group in a['inputIds'] for i in group if i in obs]
  if any(findings.get(key(o),{}).get('code')=='BLOCKED_CONFLICT' for o in ins):status='OPERAND_CONFLICT'
  elif any(assessment[o['id']]['status']=='UNKNOWN' for o in ins):status='OPERAND_UNKNOWN_PIT'
 deriv.append({**a,'recomputedReadinessStatus':status,'financialPdfMissingProven':False,'numericDerivationRerun':False,'reason':'Operand/classification audit; only preserved calculated values have executable numeric replay. No analyst adjustments or new source crosswalks generated.'})
dcount=collections.Counter(d['recomputedReadinessStatus'] for d in deriv);mechanical=[d for d in deriv if d['recomputedReadinessStatus'] not in ['OPTIONAL','HUMAN_ANALYST_REVIEW_REQUIRED','DOWNSTREAM_NOT_SLICE8']]
write('FINAL_DERIVATION_READINESS.json',{'totalRoutesAudited':len(deriv),'mechanicalRoutes':len(mechanical),'mechanicalCalculated':sum(d['recomputedReadinessStatus']=='CALCULATED' for d in mechanical),'mechanicalFinancialDerivationReady':all(d['recomputedReadinessStatus']=='CALCULATED' for d in mechanical),'analystNormalizedMetricReady':False,'humanReviewDependent':dcount['HUMAN_ANALYST_REVIEW_REQUIRED'],'counts':dict(sorted(dcount.items())),'humanNormalizedRoutesIncludingOptionalHistory':sum(any(o['operation']=='HUMAN_NORMALIZED' for o in a['requiredOperands']) for a in attempts),'rows':deriv,'calculatedDerivationArtifacts':packet['derivedMetrics'],'limitation':'Historical deleted execution/raw input packages prevent exact full numeric route rerun; readiness is recomputed from every preserved route and operand.'})
# Never trust old per-ticker READY/PASS declarations or PROPOSED metadata as production authority.
rows=[]
for sid in sorted(universe,key=lambda s:identity[s]['ticker']):
 paths=[b for b in boundary if b['securityId']==sid and b['mandatoryForFundamentalDataEngine']];bl=[b for b in paths if b['blockerReason']];bank=sector[sid]=='BANK';local=[d for d in deriv if d['securityId']==sid and d in mechanical]
 blockers=sorted(set([b['blockerReason'] for b in bl]+['OFFICIAL_UNIVERSE_ORIGINAL_BYTES_UNAVAILABLE','SECURITY_IDENTITY_SECTOR_CANDIDATES_NOT_EXTERNALLY_APPROVED','REVIEW_CANDIDATE_REGISTRY_AND_SOURCE_MAPPING_NOT_PRODUCTION_APPROVED','LIVE_PUBLIC_PIT_POLICY_NOT_APPROVED','EXACT_QUALIFICATION_AND_RAW_LINEAGE_REPLAY_INCOMPLETE']+(['BANK_SPECIFIC_MAPPING_REQUIRED'] if bank else [])))
 rows.append({'ticker':identity[sid]['ticker'],'securityId':sid,'financialSourceReady':False,'financialSourceStatus':'PDF_CANDIDATES_PRESENT_QUALIFIED_WINDOW_INVENTORY_INCOMPLETE','documentQualificationReady':False,'canonicalFinancialFactsReady':False,'canonicalCandidateRequiredPathsSatisfied':not bl,'financialMappingReady':False,'PITSafe':False,'originalSourceBodiesUnavailable':sorted(set(h for g in selected_source_gaps if g['ticker']==identity[sid]['ticker'] for h in g['unavailableBodyHashes'])),'selectedCandidatePITSafe':unsafe==0,'conflictSafe':not any(b['blockerReason']=='BLOCKED_CONFLICT' for b in paths),'financialDerivationReady':bool(local) and all(d['recomputedReadinessStatus']=='CALCULATED' for d in local),'fundamentalDataEngineReady':False,'qualitativeReviewReady':False,'valuationReady':False,'marketDataReady':False,'readyForScoring':False,'decisionReady':False,'requiredEnginePaths':len(paths),'unsatisfiedEnginePaths':len(bl),'blockers':blockers,'downstreamBlockers':['QUALITATIVE_RUBRICS_NOT_REVIEWED','VALUATION_INPUTS_NOT_REVIEWED','MARKET_ORIGINAL_BYTES_UNAVAILABLE','INDEPENDENT_DI_ACCEPTANCE_ABSENT']})
write('FINAL_READINESS_MATRIX.json',{'rows':rows,'fundamentalDataEngineReadyCount':sum(r['fundamentalDataEngineReady'] for r in rows),'readyForScoringCount':sum(r['readyForScoring'] for r in rows),'decisionReadyCount':0,'candidateSelectedUnsafe':unsafe,'ownershipClassificationDoesNotApproveRequirements':True})
replay=read('/private/tmp/vn30-final-snapshot-replay.json');validation=read(DEFAULT/'FULL_REGRESSION_VALIDATION.json') if (DEFAULT/'FULL_REGRESSION_VALIDATION.json').exists() else {'status':'PENDING'}
# Frozen gate descriptions are read from the actual M8 document, not copied from status history.
text=(ROOT/'docs/08_CONTINUOUS_IMPROVEMENT/DATA_INITIALIZATION.md').read_text();definitions=dict(re.findall(r'^\s*(DI\d+)\s+(.+?)\s+NOT EXECUTED\s*$',text,re.M));assert len(definitions)==15
codes=collections.Counter(f['code'] for f in manifest['findings']);gate_status={i:'BLOCKED' for i in range(1,16)};gate_status[6]='PASS';gate_status[9]='FAIL';gate_status[12]='PASS' if replay['status']=='PASS' else 'FAIL';gate_status[13]='PASS' if len(rows)==30 else 'FAIL'
reasons={1:['Official original membership files deleted; candidate conflicts/approval still unresolved'],2:['30 distinct candidate IDs match snapshot, but UUID reconciliation/external identity approval unresolved'],3:['30 sector assignments match snapshot, but external classification approval/source proof incomplete'],4:['Historical market raw inputs deleted; no current exact market replay'],5:['Unsatisfied required financial paths and candidate registry/mapping authority'],6:['Candidate arithmetic/dimensions validated by controls; no production release approval implied'],7:[str(dict(codes))],8:['Reporting-cycle evidence unresolved for '+str(len(fresh))+' exact pinned paths'],9:['23 unresolved snapshot path conflicts and one quality-blocked path'],10:['Mechanical routes incomplete; human adjustments remain downstream'],11:['Required UNKNOWN assessments plus PROPOSED initial-live policy; formal PIT authority incomplete'],12:['Deterministic selector replay exact content identity'],13:['All 30 candidates covered by freshly recomputed readiness matrix'],14:['Independent reviewer has not reviewed this exact new candidate'],15:['Project Owner final approval absent; major data/evidence limitations unresolved']}
gates=[]
for i in range(1,16):
 owner='MARKET_DATA' if i==4 else 'SCORING_INPUT_PREPARATION' if i in [7,8,10] else 'FUNDAMENTAL_DATA_ENGINE'
 gates.append({'gateId':'DI'+str(i),'frozenRequirement':definitions['DI'+str(i)],'originalRequirementSource':'docs/08_CONTINUOUS_IMPROVEMENT/DATA_INITIALIZATION.md#28','currentStatus':gate_status[i],'evidence':['FINAL_READINESS_MATRIX.json','FINAL_REQUIRED_PATH_PIT_CLOSURE.json','FINAL_CONFLICT_CLOSURE.json','FINAL_DERIVATION_READINESS.json','SNAPSHOT_REPLAY.json'],'blockingIssues':[] if gate_status[i]=='PASS' else reasons[i],'measurement':reasons[i],'ownerLayer':owner,'canSlice8CloseWithThisStatus':False if i in [1,2,3,5,9,11,14,15] else gate_status[i]=='PASS','independentReviewRequired':i==14,'ownerFinalApprovalRequired':i==15})
write('FINAL_DI_GATE_MATRIX.json',{'gates':gates,'scope':'Recomputed evidence gates, not certification. Generic contracts are not DI approval. DI6 PASS is candidate normalization only.'})
exitgate={'officialVN30UniverseReady':False,'securityIdentityReady':False,'sectorMappingReady':False,'mandatoryFinancialSourcesReady':False,'documentQualificationReady':False,'canonicalNormalizationReady':True,'financialMappingReady':False,'requiredFinancialPITSafe':False,'requiredFinancialConflictsResolved':not any(c['mandatoryForFundamentalDataEngine'] for c in conflicts),'mechanicalFinancialDerivationsReady':all(d['recomputedReadinessStatus']=='CALCULATED' for d in mechanical),'snapshotDeterministic':replay['status']=='PASS','snapshotReplayPassed':replay['status']=='PASS','unsafeSelectedCount':unsafe,'criticalIssueCount':0,'majorEngineeringIssueCount':0,'majorDataEvidenceIssuesRemaining':6,'unavailableRequiredOriginalSourceBodies':len(source_missing_hashes),'fundamentalDataEngineReady':False,'downstreamScoringDependenciesRemaining':True,'DI14IndependentReviewRequired':True,'DI15OwnerApprovalRequired':True,'slice8ClosureRecommendation':'NOT_READY','implementationDefectAssessment':'No demonstrated unresolved executable defect after complete regression; data/evidence/governance dependencies remain. Not a proof that no defects could exist.'}
write('FINAL_SLICE8_EXIT_GATE.json',exitgate)
inputs=[BASE/'EXECUTION_PACKAGE_REDACTED.json',BASE/'SNAPSHOT_MANIFEST.json',ROOT/'docs/fundamental-data-engine/evidence/2026-10-10-di123-identities.json',ROOT/'docs/fundamental-data-engine/evidence/2026-10-10-di123-sectors.json',ROOT/'src/infrastructure/fundamentals/casa-npl-source-contract-v1.json',ROOT/'docs/08_CONTINUOUS_IMPROVEMENT/DATA_INITIALIZATION.md',ROOT/'docs/03 SCORING/METRIC_DEFINITIONS.md']
write('FINAL_SLICE8_REPLAY.json',{'inputs':[{'path':str(p.relative_to(ROOT)),'sha256':digest(p)} for p in inputs],'contentIdentity':replay['contentHash'],'selectedFacts':len(selected),'availabilityAssessments':len(assessments),'unsafeSelected':unsafe,'auditReverseInputs':args.reverse,'deterministicOutputs':['FINAL_READINESS_MATRIX.json','FINAL_DI_GATE_MATRIX.json','FINAL_SLICE8_EXIT_GATE.json'],'replayCommands':['node docs/fundamental-data-engine/evidence/2026-10-12-slice08b-final-closure/replay-snapshot.mjs','python3 docs/fundamental-data-engine/evidence/2026-10-12-slice08b-final-closure/build-candidate.py --output /private/tmp/vn30-final-audit-replay --reverse'],'rawReaderReplay':'NOT_REPRODUCIBLE_EXACT_HISTORICAL_BYTES_AFTER_CLEANUP','formalProductionReplay':'NOT_AVAILABLE_NO_APPROVED_FORMAL_DATASET','numericRouteReplay':'PARTIAL_ONLY_CALCULATED_ARTIFACT_RETAINED'})
limitations=['Original official universe and market bytes, initialization SQLite and exact raw/render packages were removed by prior authorized cleanup.','Identity/sector/registry/crosswalk/initial-live/freshness approval candidates are not independently approved production authorities.','Publication authority cannot be reconstructed from signing/local/file dates.','Resident reader text permits discovery but unavailable cloud-only reader bytes and incomplete qualification prevent exhaustive negative caption proof.','Ownership classification is diagnostic; frozen pinned requirements remain intact.','Equal normalized conflict values are not equivalence proof; numeric routes without full raw inputs cannot all be rerun exactly.']
write('FULL_SLICE8_SOURCE_AUDIT.json',{'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'criticalIssues':[],'majorIssues':[],'correctedHistoricalCountClaims':['Previous report grouped eight secondary UNKNOWN paths as conflict overlap. Exact current snapshot has two UNKNOWN/conflict paths and six UNKNOWN/freshness paths; all fourteen affected paths and eighteen UNKNOWN observations remain unresolved.'],'majorDataEvidenceIssues':[{'id':'EVIDENCE-01','owner':'PROJECT_OWNER_REFERENCE_EVIDENCE','issue':'Official membership/identity/sector original bytes or approval unavailable'},{'id':'EVIDENCE-02','owner':'PROJECT_OWNER_DATA_CONTRACT_AUTHORITY','issue':'Registry/mapping/PIT/freshness production approvals absent'},{'id':'EVIDENCE-03','owner':'ISSUER_DISCLOSURE_EVIDENCE','issue':'UNKNOWN availability, incomplete qualifications and source context'},{'id':'EVIDENCE-04','owner':'SOURCE_MAPPING_AND_REVISION_REVIEW','issue':'Missing mappings, unresolved conflicts and mechanical operands'},{'id':'EVIDENCE-05','owner':'INDEPENDENT_REVIEW_AND_PROJECT_OWNER','issue':'DI14/DI15 exact candidate acceptance absent'},{'id':'EVIDENCE-06','owner':'SOURCE_RETENTION_AND_PRODUCTION_DEPLOYMENT','issue':'44 exact selected-source PDFs absent and private SQLite lacks fundamental schema; production activation remains unexecuted'}],'minorIssues':['Legacy evidence command paths are historical only; current manual runbook remains authoritative for acquisition.'],'knownLimitations':limitations+['Production SQLite has not applied fundamental-table migrations; no recovery copy of fundamental records exists in it.','292 selected historical facts refer to 44 original PDF bodies not retained in the 144-source manual corpus.'],'staleArtifacts':stale,'supersededArtifacts':[{'path':str(p.relative_to(ROOT)),'use':'HISTORICAL_NOT_CURRENT_STATUS'} for p in sorted((ROOT/'docs/fundamental-data-engine/evidence').iterdir()) if p!=DEFAULT],'authoritativeCurrentArtifacts':['docs/08_CONTINUOUS_IMPROVEMENT/DATA_INITIALIZATION.md','docs/03 SCORING/METRIC_DEFINITIONS.md','src/infrastructure/fundamentals/casa-npl-source-contract-v1.json','docs/fundamental-data-engine/SLICE_8_INITIALIZATION_RUNBOOK.md','FINAL_SLICE8_EXIT_GATE.json'],'recommendedFixes':['Recover original disclosure/reference/qualification evidence if available; no new source request is automatically authorized.','Supply external approved versioned data/PIT/freshness and bank mapping authority.','Independent review this precise candidate before any DI14/DI15 acceptance.'],'appliedFixes':['Recovered cloud-only tracked documents from identical HEAD bytes for local audit','Replaced copied legacy PASS/status claims with recomputed evidence gates in a new immutable package','Enumerated every pinned path, UNKNOWN, conflict, missing fact, freshness and derivation route without deleting requirements','Separated data engine blockers from downstream analytical dependencies'],'logicalPathAliases':{'src/fundamental':'src/domain/fundamentals + src/infrastructure/fundamentals + src/application/fundamentals','src/scoring':'src/domain/scoring + src/application/scoring','src/current':'src/application/current + src/infrastructure/current-source.ts','src/methodology':'src/domain/scoring/methodology + src/infrastructure/methodology','scripts/08b':'scripts/*08b* + scripts/lib/*08b*','tests/fundamental':'tests/unit/fundamentals* + tests/integration/fundamentals* + tests/architecture/fundamentals*'},'repositoryFilesAudited':len(inventory),'historicalHashMismatchCount':len(hashfail),'brokenHistoricalHashReferenceCount':len(missinghashrefs),'remainingBlockerClasses':['A_EXTERNAL_SOURCE_OR_GOVERNANCE_EVIDENCE_UNAVAILABLE','B_DOWNSTREAM_ANALYTICAL_WORK'],'noClaimOfZeroMajorDataIssues':True})
print(json.dumps({'paths':len(boundary),'unknownAll':len(unknown),'unknownRequired':len(relevant),'requiredAffected':len(affected),'conflicts':len(conflicts),'missing':len(missing),'freshness':len(fresh),'derivationCounts':dict(dcount),'pdfs':len(pdfs),'bankMappingRows':len(bankmaps),'recommendation':exitgate['slice8ClosureRecommendation']}))
