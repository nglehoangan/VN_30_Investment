"""Read-only canonical/source inventory; writes a new review package, never production rows."""
import pathlib,json,sqlite3,hashlib,collections,datetime,subprocess,argparse
R=pathlib.Path.cwd()
parser=argparse.ArgumentParser();parser.add_argument('--out',default='docs/fundamental-data-engine/evidence/2026-10-21-production-runtime-scoring-readiness');args=parser.parse_args();P=R/args.out
if (P/'ARTIFACT_HASHES.json').exists():raise SystemExit('SEALED_EVIDENCE: use --out with a new directory; existing evidence will not be rewritten')
P.mkdir(parents=True,exist_ok=True)
def canonical(v):return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def sha(b):return hashlib.sha256(b).hexdigest()
def save(n,v):
 p=P/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def load(p):return json.loads(pathlib.Path(p).read_text())
before=sha((R/'data/vn30.sqlite').read_bytes());c=sqlite3.connect('file:'+str(R/'data/vn30.sqlite')+'?mode=ro',uri=True)
tables=[r[0] for r in c.execute("select name from sqlite_master where type='table' order by name")]
logical={t:{'count':c.execute('select count(*) from "'+t+'"').fetchone()[0],'hash':sha(canonical(sorted([list(r) for r in c.execute('select * from "'+t+'"')],key=canonical)).encode())} for t in tables}
release=load('src/infrastructure/fundamentals/active-level1-release.json')
active=json.loads(c.execute('select r.body from dependency_release r join market_boundary_dependency_head h on r.body_hash=h.body_hash').fetchone()[0]);partition=next(h for h in active['heads'] if h['type']=='LEVEL1_RELEASE')['content']['partition'];members={m['ticker']:m for m in partition['members']}
save('BASELINE_IDENTITY.json',{'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'databaseSHA256':before,'tables':logical,'activeReleaseId':active['id'],'activeReleaseHash':active['contentHash'],'level1Release':release,'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()})
methods=[dict(zip(['id','status','use','configurationReference'],r)) for r in c.execute('select methodology_id,governance_status,intended_use,configuration_reference from methodology_record order by methodology_id')]
# Retained download/request inventories are the present-day acquisition metadata, not publication evidence.
byhash=collections.defaultdict(list);metadata=[]
for request in load('data/manual-download/manifest.json')['requests']:
 path=request.get('path');h=request.get('sha256')
 if path and h and (R/path).is_file():
  ok=sha((R/path).read_bytes())==h;row={'path':path,'sha256':h,'hashVerified':ok,'sourceRetrievedAt':request.get('retrievedAt'),'sourcePublishedAt':request.get('publishedAt'),'httpStatus':request.get('httpStatus'),'kind':'PDF_DOWNLOAD'};byhash[h].append(row);metadata.append(row)
publicationkeys=[]
def inspect(v,pointer=''):
 if isinstance(v,dict):
  for k,x in v.items():
   p=pointer+'/'+k.replace('~','~0').replace('/','~1')
   if k.lower() in ['publishedat','sourcepublishedat','publicationdate','publishdate','publishedtime','disclosedat']:publicationkeys.append({'pointer':p,'value':x})
   if isinstance(x,(dict,list)):inspect(x,p)
 elif isinstance(v,list):
  for i,x in enumerate(v):inspect(x,pointer+'/'+str(i))
for request in load('data/manual-extracted-api/requests.json'):
 path=request.get('rawPayloadLocation');h=request.get('payloadHash')
 if path and h and (R/path).is_file():
  payload=(R/path).read_bytes();ok=sha(payload)==h;row={'path':path,'sha256':h,'hashVerified':ok,'sourceRetrievedAt':request.get('retrievedAt'),'sourcePublishedAt':None,'httpStatus':request.get('httpStatus'),'kind':'CAFEF_RAW'};byhash[h].append(row);metadata.append(row)
  if ok:
   start=len(publicationkeys)
   try:inspect(json.loads(payload))
   except (ValueError,UnicodeDecodeError):pass
   for x in publicationkeys[start:]:x.update({'rawPath':path,'rawHash':h,'authorityState':'NOT_YET_CERTIFIED_PUBLICATION_EVIDENCE'})
rows=[];candidates=collections.defaultdict(list);items=set()
for runid,body,bodyhash in c.execute('select id,body,body_hash from fundamental_admission_run order by id'):
 assert sha(body.encode())==bodyhash
 run=json.loads(body)
 for i,f in enumerate(run['canonicalFacts']):
  m=members[f['ticker']];items.add(f['itemId']);paths=byhash.get(f.get('sourceHash'),[])
  # A historical provenance receipt cannot stand in for current proof of publication or import.
  reasons=['NO_CERTIFIED_PUBLICATION_EVIDENCE','CANONICAL_CURRENT_ANALYSIS_NOT_FORMAL','BROAD_RUNTIME_REGISTRY_NOT_APPROVED','NO_RUNTIME_IMPORT_NORMALIZATION_BINDING']
  if not paths:reasons.append('CANONICAL_SOURCE_HASH_NOT_IN_CURRENT_RETAINED_INVENTORY')
  if f.get('historicalAvailability')=='CONFLICTED':state='CONFLICTED'
  else:state='UNPROVEN'
  row={'ticker':f['ticker'],'securityId':m['securityId'],'admissionState':m['state'],'factId':f['id'],'metric':f['itemId'],'period':f['period'],'source':{'authorityClass':f.get('authority'),'documentId':f.get('sourceDocumentId'),'hash':f.get('sourceHash'),'evidenceReference':f.get('evidenceReference'),'retainedMatches':paths,'provenance':f.get('provenance',[])},'sourceAuthority':'NOT_REGISTERED_FOR_FORMAL_RUNTIME','availabilityEvidenceState':state,'missingEvidenceReasons':reasons,'temporal':{'periodStart':f['period']['start'],'periodEnd':f['period']['end'],'reportAsOf':f.get('reportDate'),'sourcePublishedAt':f.get('publishedAt'),'sourceRetrievedAt':[r.get('retrievedAt') for r in f.get('provenance',[]) if r.get('retrievedAt')],'systemIngestedAt':None,'correctedAt':None,'knownAt':None,'validFrom':None,'validThrough':None},'canonical':{'runId':runid,'bodyHash':bodyhash,'pointer':'/canonicalFacts/'+str(i)},'formalAdmission':'BLOCKED_AVAILABILITY_UNPROVEN'}
  rows.append(row);candidates[f['ticker']].append({'factId':f['id'],'itemId':f['itemId'],'period':f['period'],'value':f.get('value'),'unit':f.get('unit'),'currency':f.get('currency'),'scope':f.get('scope'),'canonical':row['canonical'],'source':row['source'],'status':'CURRENT_ANALYSIS_CANDIDATE_NOT_FORMAL'})
eligible=[r for r in rows if r['admissionState']=='SCORABLE'];counts=collections.Counter(r['availabilityEvidenceState'] for r in eligible)
save('AVAILABILITY_INVENTORY.json',{'contract':'runtime-availability-inventory-v1','status':'BLOCKED_AVAILABILITY_UNPROVEN','totalCanonicalFacts':len(rows),'eligibleCanonicalFacts':len(eligible),'deferredFacts':len(rows)-len(eligible),'classificationCounts':{k:counts[k] for k in ['PROVEN','DERIVABLE_FROM_APPROVED_EVIDENCE','UNPROVEN','CONFLICTED']},'publicationMetadataCandidates':publicationkeys,'retainedAcquisitionMetadata':metadata,'groups':[{'ticker':t,'metrics':sorted(set(r['metric'] for r in rows if r['ticker']==t)),'facts':[r for r in rows if r['ticker']==t]} for t in sorted(members)],'factsAdmitted':0})
registry=load('src/infrastructure/fundamentals/canonical-items-v1.json');definitions=load('docs/fundamental-data-engine/evidence/2026-10-21-production-scoring-blocker-resolution/HUMAN_INPUT_INVENTORY.json')['rubricDefinitions'];registryitems={i['itemId']:i for i in registry['items']}
for t,m in sorted(members.items()):
 if m['state']!='SCORABLE':continue
 rubrics=[]
 for r in definitions:
  candidateItems=[k for k,v in registryitems.items() if any(x['rubricId']==r['rubricId'] for x in v['evidenceTopicMappings'])]
  rubrics.append({'rubricId':r['rubricId'],'classification':r['classification'],'requiredTopics':r['requiredEvidenceTopics'],'formalAssessment':None,'candidateEvidence':[f for f in candidates[t] if f['itemId'] in candidateItems],'mappingAuthority':'PROPOSED_REGISTRY_REFERENCE_ONLY','counterevidence':[],'unresolvedQuestions':['Publication and exact current source/canonical lineage must be proved','Analyst must evaluate counterevidence and explicitly select/attest outcomes'],'status':'BLOCKED_NO_FORMAL_SNAPSHOT'})
 save('dossiers/'+t+'.json',{'contract':'production-candidate-dossier-v1','ticker':t,'securityId':m['securityId'],'status':'BLOCKED_NO_FORMAL_SNAPSHOT','snapshot':None,'narrativeStatus':'NO_AI_NARRATIVE_GENERATED','rubrics':rubrics,'unmappedCanonicalCandidates':[f for f in candidates[t] if f['itemId'] not in registryitems],'sourcePriority':'Existing accounting admission preserved; no display-only values admitted','readyForScoring':False})
# Exact PROPOSED payloads; approval will need its own hash-pinned release and method registration.
payloads=[('registry',registry),('availability',{'version':'production-runtime-availability-candidate-v1','algorithm':'operational-evidence-v2','governanceStatus':'PROPOSED','approvalReference':None,'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),'dateOnlyZones':[],'dateOnlyEvidenceClasses':[]}),('derivation-crosswalk',load('src/infrastructure/fundamentals/derivation-crosswalk-v1.json')),('readiness-requirements',{'version':'production-runtime-readiness-candidate-v1','status':'INCOMPLETE_SECTOR_ROUTE_REVIEW_REQUIRED','targetAlgorithm':'strict-canonical-m3-readiness-v2','requiredContract':'ScoringReadinessRequirements','canonicalItemIdsObserved':sorted(items),'unresolvedItems':sorted(items-set(registryitems)),'routeValues':None}),('di-acceptance',{'version':'production-runtime-di-candidate-v1','status':'WAITING_EXACT_RUNTIME_DATASET_AND_INDEPENDENT_REVIEW','targetContract':'independent-di-acceptance-v2','exactAcceptance':None})]
authorities=[]
for kind,payload in payloads:
 h=sha(canonical(payload).encode());authorities.append({'id':'runtime-authority-candidate-'+kind+'-'+h[:24],'version':'1.0.0','kind':kind,'contentHash':h,'payload':payload,'governanceStatus':'PROPOSED','activationStatus':'PENDING_OWNER_APPROVAL','approvalProvenance':None,'effectiveInterval':{'from':None,'through':None},'intendedMethodConfigurationReference':kind+'-sha256:'+h,'dependencies':['existing approved scoring executable','exact broad registry','exact public availability/source evidence','exact reviewed 29/1 runtime dataset'],'compatibility':'Existing canonical/availability/derivation/Policy-B contracts; incomplete candidate specifications are NOT registrable authority payloads','replay':'Canonical JSON SHA256; source modules pinned in package seal','productionRowsCreated':0})
save('RUNTIME_AUTHORITY_CANDIDATES.json',{'status':'PENDING_OWNER_APPROVAL','existingMethodRegistrations':methods,'candidates':authorities,'warning':'Architecture approval is not approval of these exact payloads. Proposed payload hashes change when governance metadata or source/sector routes change; the final approved hash must be reviewed and bound explicitly.'})
save('FORMAL_OBSERVATION_REVIEW.json',{'status':'BLOCKED_NOT_ADMITTED','eligibleCandidates':len(eligible),'formalObservationsCreated':0,'requires':'Trusted exact raw/canonical/import/normalization/publication receipt plus approved registry and availability method pins','currentVerifierScope':'Lossless JSON cells or direct PDF bytes with externally reviewed/pinned page-box cell qualification, exact canonical/normalization replay and timestamp publication proof. No OCR/source extraction or date-only publication inference is performed.'})
save('DERIVATION_REVIEW.json',{'status':'INFRASTRUCTURE_IMPLEMENTED_PRODUCTION_BLOCKED','arithmetic':'Delegates to existing deriveFundamentals; supported ROE/FCF/CASA/NPL and existing crosswalk constraints only','newFormulaDefinitions':0,'additionalUnsupportedRoutes':'Must be governed separately, never hard-coded into dossier preparation','productionDerivationsCreated':0})
save('SNAPSHOT_REVIEW.json',{'status':'BLOCKED_NO_FORMAL_OBSERVATIONS_OR_APPROVED_RUNTIME_AUTHORITIES','mode':'FORMAL_AS_KNOWN','candidateDossiersPrepared':29,'runtimeSnapshotsCreated':0,'candidateDossiersAreFormalSnapshots':False})
save('DATASET_ACCEPTANCE_REVIEW.json',{'status':'BLOCKED_NOT_CREATED','contract':'Existing independent-di-acceptance-v2 + exact runtime independent evidence packet','humanRubricSlots':667,'actualHumanApprovals':0,'independentAcceptancesCreated':0,'scorecardsCreated':0,'rankingsCreated':0,'persistence':'Uses existing PrismaPolicyBScoringDatasets appendAcceptance and independent bindings; new evidence hash is bound through reviewArtifactReference without a self-hash cycle'})
save('MBB_DEFERRED_REPLAY.json',{'status':'PASS','total':len(members),'eligible':sum(m['state']=='SCORABLE' for m in members.values()),'MBB':{**members['MBB'],'score':None,'rank':None},'MbbDossierCreated':False})
assert sha((R/'data/vn30.sqlite').read_bytes())==before
c.close();print(json.dumps({'eligibleFacts':len(eligible),'availability':dict(counts),'candidateDossiers':29,'authorityCandidates':len(authorities),'productionDBUnchanged':True}))
