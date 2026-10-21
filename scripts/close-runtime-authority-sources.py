"""Prepare exact authority/source closure review. Read-only production; no approval or activation."""
from pathlib import Path
import json,hashlib,sqlite3,datetime,collections,argparse,copy,sys,logging
R=Path.cwd();parser=argparse.ArgumentParser();parser.add_argument('--out',default='docs/fundamental-data-engine/evidence/2026-10-21-runtime-authority-source-closure');args=parser.parse_args();P=R/args.out
if (P/'ARTIFACT_HASHES.json').exists():raise SystemExit('SEALED_EVIDENCE: choose a new --out directory')
P.mkdir(parents=True,exist_ok=True);now=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')
def load(p):return json.loads((R/p).read_text())
def canonical(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def digest(b):return hashlib.sha256(b).hexdigest()
def h(x):return digest(canonical(x).encode())
def pin(p):return {'path':str(p),'sha256':digest((R/p).read_bytes())}
def save(n,x):
 p=P/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def ptrkey(k):return str(k).replace('~','~0').replace('/','~1')
DB=R/'data/vn30.sqlite';before=digest(DB.read_bytes());c=sqlite3.connect('file:'+str(DB)+'?mode=ro',uri=True)
active=json.loads(c.execute('select r.body from dependency_release r join market_boundary_dependency_head h on r.body_hash=h.body_hash').fetchone()[0]);partition=next(x for x in active['heads'] if x['type']=='LEVEL1_RELEASE')['content']['partition'];members={m['ticker']:m for m in partition['members']}
sectors={r['ticker']:r['sector'] for r in load('docs/fundamental-data-engine/evidence/2026-10-17-data-initialization-final-acceptance/ACCOUNTING_RECONSTRUCTION.json')['rows']}
facts=[]
for runid,body,bhash in c.execute('select id,body,body_hash from fundamental_admission_run order by id'):
 assert digest(body.encode())==bhash
 for i,f in enumerate(json.loads(body)['canonicalFacts']):
  if members[f['ticker']]['state']=='SCORABLE':facts.append({'fact':f,'canonical':{'runId':runid,'bodyHash':bhash,'pointer':'/canonicalFacts/'+str(i)}})
assert len(facts)==1754
basepath='src/infrastructure/fundamentals/canonical-items-v1.json';debtpath='src/infrastructure/fundamentals/debt-canonical-items-v2.json';crosspath='src/infrastructure/fundamentals/derivation-crosswalk-v1.json';casapath='src/infrastructure/fundamentals/casa-npl-source-contract-v1.json';reqpath='src/domain/fundamentals/manual-fundamental-evidence-requirements-v2.json'
base,debt,cross,casa,req=map(load,[basepath,debtpath,crosspath,casapath,reqpath]);baseids={x['itemId']:x for x in base['items']};debtids={x['itemId']:x for x in debt['items']}
# Source accounting contracts are explicitly referenced, never promoted into the broad runtime registry.
coverage=[]
for sector in sorted(set(sectors[t] for t in members if members[t]['state']=='SCORABLE')):
 tickers=sorted(t for t in members if members[t]['state']=='SCORABLE' and sectors[t]==sector);route=req['sectors'][sector];groups=[]
 for group in ['CORE','SECTOR_CORE']:
  for i,r in enumerate(route[group]):
   alternatives=[]
   for item in r['anyOf']:
    definition=baseids.get(item);scoped=debtids.get(item)
    alternatives.append({'itemId':item,'baseDefinitionAvailable':definition is not None,'baseSectorCompatible':bool(definition and sector in definition['sectorApplicability']),'separateScopedDebtDefinition':bool(scoped and sector in scoped['sectorApplicability']),'missingBroadDefinition':definition is None,'nativeDefinitionReference':basepath+'#/items/'+str(list(baseids).index(item)) if definition else debtpath+'#/items/'+str(list(debtids).index(item)) if scoped else 'SPECIFICATION_GAP','issuerFactCounts':{t:sum(f['fact']['ticker']==t and f['fact']['itemId']==item for f in facts) for t in tickers}})
   groups.append({'group':group,'requirementId':r['id'],'component':r['component'],'anyOf':copy.deepcopy(r['anyOf']),'preference':copy.deepcopy(r.get('preference',[])),'sourcePointer':'/sectors/'+sector+'/'+group+'/'+str(i),'alternatives':alternatives,'baseDefinitionCoverage':any(x['baseSectorCompatible'] for x in alternatives),'formalReadiness':False})
 observed=sorted({f['fact']['itemId'] for f in facts if f['fact']['ticker'] in tickers});scopes=sorted({f['fact']['scope'] for f in facts if f['fact']['ticker'] in tickers})
 gaps=[{'id':'BROAD_DEFINITION:'+item,'reason':'No broad registry item; no caption/total/common-equity/code/amount alias is inferred','scopedDefinitionAvailable':item in debtids} for item in observed if item not in baseids]
 if sector=='BANK':gaps.extend([{'id':'BANK_SPECIFIC_PERIMETER_MAPPING','reason':'Approved CASA/NPL source contract has zero bankSpecificMappings; formulas do not certify issuer products/regulatory classes'},{'id':'REGULATORY_VAS_SCOPE_BRIDGE','reason':'Source-specific capital/NPL regulatory population must match exact reporting scope/basis'}])
 if sector=='SECURITIES':gaps.append({'id':'SECURITIES_EXECUTABLE_DERIVATION_ROUTE','reason':'Existing generic crosswalk has no SECURITIES route; do not copy bank or industrial FCF/debt rules'})
 if 'STANDALONE' in scopes:gaps.append({'id':'CANONICAL_TO_FORMAL_SCOPE_ENUM','reason':'Canonical STANDALONE and formal SEPARATE_STANDALONE require an explicit versioned representation/source scope binding; no implicit bridge'})
 coverage.append({'sector':sector,'eligibleTickers':tickers,'eligibleCount':len(tickers),'sourceRequirements':pin(reqpath),'nativeFormalRequirementsNotEquivalent':True,'groups':groups,'supportingItems':route['SUPPORTING'],'optionalItems':route['OPTIONAL'],'requiredDerivationsInAdmissionContract':route['requiredDerivations'],'observedCanonicalItems':observed,'observedScopes':scopes,'specificationGaps':gaps,'productionScoringCoverage':'INCOMPLETE','all23HumanRubricsStillRequired':True,'uncoveredBaseGroups':sum(not g['baseDefinitionCoverage'] for g in groups)})
save('SECTOR_COVERAGE_REPORT.json',{'status':'INCOMPLETE','baseRegistryItemCount':len(baseids),'separateApprovedDebtItemCount':len(debtids),'baseSufficientFor29':False,'eligibleSectors':len(coverage),'eligibleIssuers':29,'formalScoringSectorsComplete':0,'scope':'Manual admission requirement groups preserved exactly as a source specification, not silently converted to runtime requiredItems. These groups do not exhaust qualitative/valuation/M1 requirements.','sectors':coverage,'unusedTaxonomySectors':sorted(set(req['sectors'])-set(x['sector'] for x in coverage))})
# Complete reusable candidate descriptions; unresolved native production semantics remain explicit.
original=load('docs/fundamental-data-engine/evidence/2026-10-21-production-runtime-scoring-readiness/RUNTIME_AUTHORITY_CANDIDATES.json')
avail=copy.deepcopy(next(x['payload'] for x in original['candidates'] if x['kind']=='availability'))
proposedcross=copy.deepcopy(cross);proposedcross.update(version='runtime-derivation-crosswalk-candidate-v2',recordedAt=now,governanceStatus='PROPOSED',approvalReference=None)
logical={'CASA':['BANK_CURRENT_AND_SAVINGS_DEPOSITS','BANK_CUSTOMER_DEPOSITS'],'NPL':['BANK_NONPERFORMING_LOANS','BANK_GROSS_CUSTOMER_LOANS']}
for route in proposedcross['routes']:
 if route['sector']=='BANK' and route['metric'] in logical:
  for o,item in zip(route['operands'],logical[route['metric']]):o['itemId']=item
proposedcross['authorityReferences']=list(dict.fromkeys(proposedcross['authorityReferences']+[casapath]))
spec={'version':'runtime-readiness-reusable-specification-v1','governanceStatus':'PROPOSED','approvalReference':None,'targetAlgorithm':'strict-canonical-m3-readiness-v2','targetNativeContract':'src/domain/fundamentals/scoring-readiness.ts:ScoringReadinessRequirements','sectorRequirementGroups':[{k:r[k] for k in ['sector','eligibleTickers','groups','supportingItems','optionalItems','requiredDerivationsInAdmissionContract','specificationGaps']} for r in coverage],'humanRubrics':23,'eligibleCount':29,'deferredTicker':'MBB','requiredMarketSelection':{'state':'REQUIRES_EXPLICIT_APPROVED_SECTOR_MODEL_SELECTION','allowedNativeFields':['price','market_cap','EV','shares'],'neverUsePortfolioCostBasis':True},'requiredValuationSelection':{'state':'REQUIRES_EXPLICIT_APPROVED_SECTOR_MODEL_SELECTION','source':'docs/03 SCORING/SECTOR_NORMALIZATION.md'},'nativeRepresentationGaps':['ScoringReadinessRequirements.requiredItems cannot express anyOf/preference groups; do not flatten alternatives into conjunction or select one without evidence/method authority','Required metrics and market/valuation observations must be frozen per supported sector/model; an empty metric list is not a completeness proof','Registry topic/operand mappings and source/period/scope definitions must cover each selected requirement','Missing FORMAL observations/publication and actual HUMAN/M1/independent review remain separate gates']}
di={'version':'runtime-independent-di-method-specification-v1','governanceStatus':'PROPOSED','approvalReference':None,'reusableMethod':{'nativeContract':'independent-di-acceptance-v2','algorithm':'strict-canonical-m3-readiness-v2','validator':'src/domain/fundamentals/scoring-readiness-policy-b.ts','repository':'src/infrastructure/repositories/scoring-datasets-policy-b.ts','requiredGates':['DI'+str(i) for i in range(1,16)],'partition':'30 represented;29 scorable;MBB quarantined with input=null/bridge=null','producerReviewerSeparation':True,'requiresExternallyConfiguredReviewBinding':True,'requiredExactBindings':['snapshot contentHash and manifestDigest','registry/source authorities','availability evidence','derivation/operand/formula hashes','29 dossiers','667 human assessments','current Stage0/hard-veto/residual-risk receipts','valuation and normalization context','reviewArtifactReference runtime-review-evidence-sha256 hash']},'datasetSpecificReceipt':{'state':'NOT_CREATED_NO_LEGITIMATE_DATASET','registrationRule':'di-acceptance-sha256 must bind the actual future receipt hash, not this reusable method specification hash','acceptedRowsCreated':0},'effectivity':{'state':'NOT_ACTIVATED','ownerSetsFinalVersionAndEffectiveInterval':True}}
payloads={'registry':base,'availability':avail,'derivation-crosswalk':proposedcross,'readiness-requirements':spec,'di-acceptance':di}
candidates=[]
for kind,payload in payloads.items():
 ph=h(payload);native=kind in ['registry','availability','derivation-crosswalk'];missing=[]
 if kind=='registry':missing=['Broad item definitions/topic/operand/sector coverage','No global approval, runtime method or trusted activation binding']
 elif kind=='availability':missing=['Exact source publication/receipt authorities not certified','No runtime method/approval/effective activation binding']
 elif kind=='derivation-crosswalk':missing=['Bank logical item definitions absent from broad registry','Bank-by-bank mapping and regulatory perimeter evidence missing','SECURITIES native route absent; other actual required derived metrics need explicit route approval']
 elif kind=='readiness-requirements':missing=spec['nativeRepresentationGaps']
 else:missing=['Independent acceptance is dataset-specific; no snapshot/reviewed input exists','Reusable method specification cannot replace a future exact review receipt']
 deps=[{'kind':k,'candidatePayloadHash':h(payloads[k]),'relation':'PROPOSED_COMPATIBILITY_DEPENDENCY_NOT_ACTIVE'} for k in ({'registry':[],'availability':['registry'],'derivation-crosswalk':['registry','availability'],'readiness-requirements':['registry','availability','derivation-crosswalk'],'di-acceptance':['registry','availability','derivation-crosswalk','readiness-requirements']}[kind])]
 path='authority/'+kind+'.json';save(path,payload)
 candidates.append({'id':'runtime-authority-closure-'+kind+'-'+ph[:24],'kind':kind,'version':payload.get('version',payload.get('registryVersion')),'contentHash':ph,'payloadPath':str((P/path).relative_to(R)),'governanceStatus':'PROPOSED','activationStatus':'NOT_AUTHORIZED','approvalProvenance':{'state':'NONE','architectureApprovalOnly':True},'effectiveInterval':{'state':'OWNER_MUST_SET_BEFORE_ACTIVATION','existingPayloadDeclaredEffectiveDate':payload.get('effectiveDate')},'dependencies':deps,'sectorApplicability':sorted(set(sectors[t] for t in members if members[t]['state']=='SCORABLE')),'configurationForm':'NATIVE_PROPOSED_PAYLOAD' if native else 'REUSABLE_METHOD_SPECIFICATION_NOT_A_RECEIPT','descriptionComplete':True,'productionCandidateComplete':False,'missing':missing,'selfApproval':False})
save('AUTHORITY_CANDIDATES_FINAL.json',{'status':'BLOCKED_CONFIGURATION_OR_SPECIFICATION_GAPS','conditionalApproval':'INFRASTRUCTURE_ONLY','newRuntimeAuthoritiesApproved':0,'newRuntimeAuthoritiesActive':0,'approvedLegacySourceContractsDoNotPromoteRuntime':{'scopedDebt':pin(debtpath),'casaNplSource':pin(casapath)},'candidates':candidates,'datasetReceiptCreated':False})
save('AUTHORITY_COMPATIBILITY_MATRIX.json',{'status':'INCOMPLETE_NOT_ACTIVATABLE','rows':[{'kind':a['kind'],'candidateId':a['id'],'hash':a['contentHash'],'immutablePayload':True,'fullProductionConfiguration':a['productionCandidateComplete'],'nativeOrSpecification':a['configurationForm'],'dependencyBindings':a['dependencies'],'methodologyCompatibility':{'weightsBandsChanged':False,'existingContractReferences':a['missing'],'sourceAuthority':'NO_NEW_RUNTIME_SOURCE_AUTHORITY_APPROVED'},'effectiveInterval':a['effectiveInterval'],'sectorCoverageComplete':False,'replayability':'Exact canonical JSON SHA256 and input file pins; native validators run separately','activation':'NOT_AUTHORIZED'} for a in candidates],'keyDistinction':'Readiness is reusable requirements authority; DI acceptance is a separately reviewed receipt for one immutable dataset. Neither architecture approval nor a reusable specification is a dataset acceptance.'})
# Search retained raw API/acquisition records and historical source evidence, excluding tests, validation reports and this package.
claims=[];scan=[];skips=[];jsonpaths=set(R.glob('data/manual-extracted-api/**/*.json'))|set(R.glob('data/manual-download/**/*.json'))|set(R.glob('docs/fundamental-data-engine/**/*.json'))
knownhashes={r['fact'].get('sourceHash') for r in facts}
def walk(v,pointer='',context=None):
 context={} if context is None else context
 if isinstance(v,dict):
  ctx=dict(context)
  if v.get('ticker') in members:ctx['ticker']=v['ticker']
  for key in ['sourceHash','documentHash']:
   if isinstance(v.get(key),str) and v[key] in knownhashes:ctx['documentHash']=v[key]
  if isinstance(v.get('source'),dict):
   for key in ['sha256','SHA256','hash','sourceHash']:
    if v['source'].get(key) in knownhashes:ctx['documentHash']=v['source'][key]
  for key in ['sourceDocumentId','documentId']:
   val=v.get(key)
   if isinstance(val,str) and val.split(':')[-1] in knownhashes:ctx['documentHash']=val.split(':')[-1]
  for ref in v.get('transformationReferences',[]) if isinstance(v.get('transformationReferences'),list) else []:
   if isinstance(ref,str) and ref.startswith('document-sha256:') and ref.split(':')[-1] in knownhashes:ctx['documentHash']=ref.split(':')[-1]
  p=v.get('publication')
  if isinstance(p,dict) and (p.get('publishedAt') or p.get('publicationDate')):claims.append({**ctx,'pointer':pointer+'/publication','publication':p,'assertionOnly':True})
  # Captured source manifest/review date fields remain candidate assertions, never inferred publication.
  for key in ['publishedAt','sourcePublishedAt','publicationDate','publishDate','disclosedAt']:
   if v.get(key) and not (key in ['publishedAt','publicationDate'] and 'publicationPrecision' in v):claims.append({**ctx,'pointer':pointer+'/'+ptrkey(key),'publication':{key:v[key]},'assertionOnly':True})
  for k,x in v.items():
   if isinstance(x,(dict,list)):walk(x,pointer+'/'+ptrkey(k),ctx)
 elif isinstance(v,list):
  for i,x in enumerate(v):walk(x,pointer+'/'+str(i),context)
for p in sorted(jsonpaths):
 rel=str(p.relative_to(R))
 if p.is_relative_to(P) or '/validation/' in rel or p.name in ['ARTIFACT_HASHES.json','full-results.json'] or 'dossiers/' in rel:continue
 if p.stat().st_size>128_000_000:skips.append({'path':rel,'reason':'SIZE_LIMIT_NOT_SILENTLY_TREATED_AS_SCANNED'});continue
 try:
  b=p.read_bytes();obj=json.loads(b);start=len(claims);walk(obj)
  for row in claims[start:]:row.update({'artifact':rel,'artifactSHA256':digest(b)})
  scan.append({'path':rel,'sha256':digest(b),'publicationAssertionsFound':len(claims)-start})
 except (ValueError,UnicodeDecodeError) as e:skips.append({'path':rel,'reason':type(e).__name__})
# PDF metadata only: DocInfo/XMP clocks are not public disclosure proof. No OCR or extraction work directories.
sys.path.insert(0,'/private/tmp/vn30-publication-pdf-deps');from pypdf import PdfReader
logging.getLogger('pypdf').setLevel(logging.ERROR);pdfs=[]
for p in sorted(R.glob('data/manual-download/**/*.pdf')):
 row={'path':str(p.relative_to(R)),'sha256':digest(p.read_bytes()),'proofStatus':'NOT_PUBLICATION_EVIDENCE'}
 try:
  reader=PdfReader(p,strict=False);row['metadata']={str(k):str(v) for k,v in (reader.metadata or {}).items()};row['pages']=len(reader.pages);row['encrypted']=reader.is_encrypted
  row['excludedClockFields']=[k for k in row['metadata'] if any(x in k.lower() for x in ['date','time'])]
  try:
   xmp=reader.xmp_metadata;xml=xmp.stream.get_data().decode('utf-8',errors='replace') if xmp else None;row['xmp']={'xml':xml,'sha256':digest(xml.encode()) if xml else None,'certifiedPublication':False}
  except Exception as e:row['xmp']={'error':type(e).__name__,'certifiedPublication':False}
 except Exception as e:row['metadataReadError']=type(e).__name__
 pdfs.append(row)
sourceRows=[];classcounts=collections.Counter();verifiedclaims=[x for x in claims if x.get('documentHash') and x['publication'].get('publicationStatus')=='VERIFIED']
for entry in facts:
 f=entry['fact'];matched=[x for x in verifiedclaims if x.get('documentHash')==f.get('sourceHash')];values={(x['publication'].get('publicationPrecision'),x['publication'].get('publishedAt'),x['publication'].get('publicationDate'),x['publication'].get('timezone')) for x in matched}
 # Old review assertions are leads, not primary publication artifacts or approved source capability.
 state='CONFLICTED' if len(values)>1 else 'PROVABLE_WITH_ADDITIONAL_SOURCE' if matched else 'UNPROVEN';classcounts[state]+=1
 reasons=['NO_REPLAYABLE_APPROVED_PRIMARY_PUBLICATION_CAPTURE','NO_ACTIVE_RUNTIME_AVAILABILITY_AUTHORITY']
 if matched:reasons.append('PRESERVED_PUBLICATION_ASSERTION_REQUIRES_ORIGINAL_RECORD_AND_SOURCE_SEMANTICS_PROOF')
 else:reasons.append('NO_EXACT_DOCUMENT_HASH_LINKED_VERIFIED_PUBLICATION_ASSERTION')
 sourceRows.append({'ticker':f['ticker'],'securityId':members[f['ticker']]['securityId'],'factId':f['id'],'metric':f['itemId'],'period':f['period'],'sourceHash':f.get('sourceHash'),'sourceDocumentId':f.get('sourceDocumentId'),'sourceReference':f.get('evidenceReference'),'canonical':entry['canonical'],'classification':state,'provenPublication':False,'publishedAt':f.get('publishedAt'),'matchedPreservedClaims':matched,'missingEvidence':reasons,'requiredAdditionalSource':'Issuer/exchange/publication-contract record identifying this exact document/hash or certified document URL/hash binding and real public timestamp/date; retain raw metadata and source authority proof','knownAt':None,'formalAdmissionGranted':False})
save('SOURCE_PUBLICATION_EVIDENCE.json',{'status':'NO_PRODUCTION_PROOF_ADMITTED','inspectedEligibleFacts':len(facts),'searchScope':'Retained financial API/acquisition metadata, historical JSON source evidence and original PDF DocInfo; source assertions are not certified by repetition','jsonFilesScanned':len(scan),'jsonInputs':scan,'skippedInputs':skips,'publicationAssertions':claims,'pdfMetadata':pdfs,'pdfReaderVersion':__import__('pypdf').__version__,'pdfMetadataPolicy':'CreationDate/ModDate/signature/report dates are never public disclosure dates. Metadata-only inspection is not visual/page/OCR verification.','existingSourceProvidersOnly':True,'newSourceAuthorityActivated':False})
save('AVAILABILITY_CLOSURE_REPORT.json',{'status':'BLOCKED_SOURCE_EVIDENCE_GAPS','inspectedEligibleFacts':len(facts),'classificationCounts':{k:classcounts[k] for k in ['PROVEN','PROVABLE_WITH_ADDITIONAL_SOURCE','UNPROVEN','CONFLICTED']},'facts':sourceRows,'adapter':'PinnedSourcePublication + assessSourcePublication; requires approved exact source contract/method and externally configured metadata→document hash mapping','productionAvailabilityRowsCreated':0})
save('FORMAL_DATASET_READINESS.json',{'status':'BLOCKED','chain':[{'stage':stage,'status':'MISSING_OR_NOT_FORMALLY_BOUND'} for stage in ['raw source/import/normalization→canonical exact binding','publication/availability→FORMAL observation','governed derivation→FORMAL AS_KNOWN snapshot','scoring bridge→reviewed input','independent dataset acceptance']],'eligibleFactsInspected':1754,'candidateFinancialAdmissionPreserved':True,'sourceAmountValuesCopiedOrRewritten':False,'factsWithProvenAvailability':0,'actualHumanApprovals':0,'runtimeAcceptances':c.execute('select count(*) from data_initialization_acceptance').fetchone()[0],'runtimeObservations':c.execute('select count(*) from fundamental_observation').fetchone()[0],'scoringArtifacts':c.execute('select count(*) from analytical_artifact').fetchone()[0],'sourceAndMethodPrerequisitesMissing':True,'syntheticIncompletePathTestsRequired':True})
assert digest(DB.read_bytes())==before;c.close();print(json.dumps({'candidates':len(candidates),'eligibleSectors':len(coverage),'facts':len(facts),'availability':dict(classcounts),'jsonFilesScanned':len(scan),'pdfs':len(pdfs),'productionUnchanged':True}))
