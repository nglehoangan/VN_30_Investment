"""Independent PE4 technical verifier. Standard library, read-only, no PE2/PE3 verifier imports."""
import json,hashlib,datetime,html,re,sqlite3
from pathlib import Path
from decimal import Decimal
from zoneinfo import ZoneInfo
from urllib.parse import urljoin,unquote
from html.parser import HTMLParser

def read(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def digest(x):return hashlib.sha256(json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode()).hexdigest()
def require(ok,reason):
 if not ok:raise ValueError(reason)
def next_day(date):
 d=datetime.date.fromisoformat(date)+datetime.timedelta(days=1)
 return datetime.datetime.combine(d,datetime.time(),ZoneInfo('Asia/Ho_Chi_Minh')).astimezone(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')
def time(s):
 if not s:raise ValueError('MISSING_CLOCK')
 t=datetime.datetime.fromisoformat(s.replace('Z','+00:00'));require(t.tzinfo is not None,'UNQUALIFIED_CLOCK');return t
CLOCKS=('publicationBoundary','sourceRetrievedAt','documentRetrievedAt','sourceVerifiedAt','documentVerifiedAt','ingestedAt','mappingKnownAt','methodologyKnownAt','registryKnownAt','sourceContractKnownAt','sourceMethodKnownAt','identityMethodKnownAt','identityBindingKnownAt','policyKnownAt','otherRequiredContractBoundaries')
def availability(k,system,decision,approved):
 missing=[f for f in CLOCKS if k.get(f) is None]
 if missing:return {'eligible':False,'effectiveKnownAt':None,'missing':missing,'reason':'MISSING_REQUIRED_KNOWLEDGE'}
 others=k['otherRequiredContractBoundaries'];require(isinstance(others,list),'OTHER_BOUNDARY_SCHEMA')
 latest=max([time(k[f]) for f in CLOCKS if f!='otherRequiredContractBoundaries']+[time(x['at']) for x in others])
 if not system or not decision:return {'eligible':False,'effectiveKnownAt':latest.isoformat(),'reason':'ACTUAL_CUTOFF_MISSING'}
 return {'eligible':approved and latest<=time(system)<=time(decision),'effectiveKnownAt':latest.isoformat(),'reason':'CHECK_ACTUAL_AUTHORITY_EFFECTIVITY_AND_ECONOMIC_PERIOD_SEPARATELY'}
class Anchors(HTMLParser):
 def __init__(self,text):
  super().__init__(convert_charrefs=True);self.offsets=[0];self.anchors=[]
  for i,c in enumerate(text):
   if c=='\n':self.offsets.append(i+1)
  self.feed(text)
 def handle_starttag(self,tag,attrs):
  if tag=='a':self.anchors.append((self.offsets[self.getpos()[0]-1]+self.getpos()[1],dict(attrs)))
def verify_seal(root,p):
 seal=read(p/'EVIDENCE_SEAL.json');require(sha(p/'ARTIFACT_HASHES.json')==seal['artifactHashesSha256'],'SEAL_INVENTORY_HASH:'+str(p));inventory=read(p/'ARTIFACT_HASHES.json')
 for f,h in inventory['files'].items():require(sha(p/f)==h,'SEALED_FILE_CHANGED:'+str(p/f))
 for key in ['codePins','implementationPins']:
  for f,h in inventory.get(key,{}).items():require(sha(root/f)==h,'PINNED_IMPLEMENTATION_CHANGED:'+f)
 return {'package':str(p.relative_to(root)),'sealedFilesRehashed':len(inventory['files']),'sealSha256':sha(p/'EVIDENCE_SEAL.json'),'inventorySha256':sha(p/'ARTIFACT_HASHES.json'),'status':'BYTES_VERIFIED_NOT_OWNER_APPROVAL'}
def normalized(cells,factor,sign):
 require(bool(cells),'NO_SOURCE_CELLS');require(len({c['cellId'] for c in cells})==len(cells),'DUPLICATE_SOURCE_CELL')
 values=[Decimal(c['reportedValue']) for c in cells]
 require(sign in ['PRESERVE','NEGATE_NONPOSITIVE'],'UNAPPROVED_SIGN_RULE')
 if sign=='NEGATE_NONPOSITIVE':require(all(v<=0 for v in values),'CAPEX_SIGN_CONFLICT')
 return str(sum(values)*Decimal(factor)*(-1 if sign=='NEGATE_NONPOSITIVE' else 1))
def replay(root):
 root=Path(root);E=root/'docs/fundamental-data-engine/evidence';p1=E/'2026-10-21-primary-publication-evidence-pe1';p2=E/'2026-10-22-primary-publication-evidence-pe2';p3=E/'2026-10-22-primary-publication-evidence-pe3'
 seals=[verify_seal(root,p) for p in [p1,p2,p3]]
 discovered={x['disclosureId']:x for x in read(p1/'OFFICIAL_DISCLOSURE_DISCOVERY.json')['records']};http=read(p1/'HTTP_REQUEST_INVENTORY.json');bindings=read(p2/'SOURCE_BINDING_CANDIDATES.json')['candidates'];auth=read(p3/'AUTHORITY_APPROVAL_CANDIDATES.json')['candidates'];M=read(p3/'SOURCE_CELL_MAPPING_REVIEW.json')['mappings'];receipts=read(p3/'IMMUTABLE_MAPPING_RECEIPTS.json')['receipts'];K=read(p3/'KNOWLEDGE_EVIDENCE_RECONSTRUCTION.json')['records'];plan=read(E/'2026-10-21-escalated-blocker-resolution/SOURCE_MINIMUM_DATASET_PLAN.json')['facts'];require(len(plan)==216,'DENOMINATOR_CHANGED')
 conn=sqlite3.connect('file:'+str(root/'data/vn30.sqlite')+'?mode=ro',uri=True);runs={i:json.loads(b) for i,b in conn.execute('select id,body from fundamental_admission_run')};sources=[];canonical=[]
 # Every minimum obligation is rebound to its actual current database candidate, not a summary assertion.
 for i,f in enumerate(plan):
  if not f['rawCanonicalPointer']:
   canonical.append({'obligationIndex':i,'canonicalPointer':None,'canonicalFactHash':None,'value':None,'ticker':f['ticker'],'concept':f['metric'],'sourceHash':f['sourceHash'],'period':f['period'],'scope':f['scope'],'status':'MISSING_CANONICAL_CANDIDATE'})
   continue
  run,pointer=f['rawCanonicalPointer'].split('#');raw=runs[run]['canonicalFacts'][int(pointer.split('/')[-1])]
  require((raw['ticker'],raw['itemId'],raw['sourceHash'],raw['period'],raw['scope'])==(f['ticker'],f['metric'],f['sourceHash'],f['period'],f['scope']),'MINIMUM_CANONICAL_IDENTITY:'+str(i))
  canonical.append({'obligationIndex':i,'canonicalPointer':f['rawCanonicalPointer'],'canonicalFactHash':digest(raw),'value':raw['value'],'ticker':raw['ticker'],'concept':raw['itemId'],'sourceHash':raw['sourceHash'],'period':raw['period'],'scope':raw['scope']})
 for r in bindings:
  b=r['body'];d=discovered[b['disclosureId']];require(digest(b)==r['contentHash'] and r['receiptId']=='pe2-source-binding-sha256:'+digest(b),'PE2_ENVELOPE')
  require(b['documentSha256']==sha(root/b['documentPath'])==d['documentSha256'],'ORIGINAL_PDF_BYTES');require(b['sourceSha256']==sha(root/b['sourcePath']),'ORIGINAL_METADATA_BYTES')
  require((b['ticker'],b['scope'],b['period']['end'])==(d['ticker'],d['reportingScope'],d['reportingPeriodEnd']),'DISCLOSURE_DIMENSIONS')
  text=(root/b['sourcePath']).read_text();loc=b['publicationLocator'];snippet=text[loc['start']:loc['endExclusive']];anchor=next((attrs for offset,attrs in Anchors(text).anchors if offset==loc['linkedAnchorOffset']),None)
  require(anchor is not None and unquote(html.unescape(urljoin(b['sourceURL'],anchor.get('href',''))))==unquote(b['documentURL']),'EXACT_LINK_BINDING')
  require(loc['start']<=loc['linkedAnchorOffset']<loc['endExclusive'],'PUBLICATION_LOCATOR_CONFLICT');require(datetime.date.fromisoformat(b['publicationDate']).strftime('%d/%m/%Y') in snippet,'PUBLICATION_ITEM_DATE')
  require(b['publishedAt'] is None and b['publicationPrecision']=='DATE_ONLY' and b['publicationBoundary']==next_day(b['publicationDate']),'D2_BOUNDARY')
  sr=next(x for x in http if x.get('bodyPath')==b['sourcePath']);require(b['knowledge']['sourceRetrievedAt']==sr['retrievedAt'] and b['knowledge']['documentRetrievedAt']==d['retrievedAt'],'RETRIEVAL_CLOCK_CONFLICT')
  for retained in b['retainedPDFs']:require((root/retained['path']).read_bytes()==(root/b['documentPath']).read_bytes(),'RETAINED_PAIR_CONFLICT')
  a=next(x for x in auth if x['body']['disclosureId']==b['disclosureId']);require(digest(a['body'])==a['sha256'] and a['candidateId']=='pe3-authority-sha256:'+a['sha256'],'AUTHORITY_CANDIDATE_HASH')
  require(a['body']['source']['documentSha256']==b['documentSha256'] and a['body']['source']['sourceSha256']==b['sourceSha256'] and a['body']['issuer']==b['issuerLegalName'] and a['body']['sourceContract']['economicPeriod']==b['period'] and a['body']['sourceContract']['reportingScope']==b['scope'],'AUTHORITY_SOURCE_DIMENSION_CONFLICT')
  require(a['body']['publicationMethod']['locator']==loc and a['body']['publicationMethod']['expectedDate']==b['publicationDate'] and a['body']['identityMethod']['identityClass']==b['identityClass'],'AUTHORITY_METHOD_CONFLICT')
  require(a['body']['approvalReference'] is None and a['body']['knownAt'] is None and a['body']['sourceContract']['effectiveFrom'] is None,'UNSUPPORTED_AUTHORITY_APPROVAL_OR_KNOWLEDGE')
  k=next(x for x in K if x['disclosureId']==b['disclosureId']);require(k['boundaries']==b['knowledge'],'PE3_KNOWLEDGE_SUBSTITUTION')
  sources.append({'disclosureId':b['disclosureId'],'ticker':b['ticker'],'sourceHash':b['sourceSha256'],'pdfSha256':b['documentSha256'],'sourceEvidenceIdentity':'TECHNICALLY_VERIFIED','publicationDate':b['publicationDate'],'publicationBoundary':next_day(b['publicationDate']),'identityClass':b['identityClass'],'retainedPairs':len(b['retainedPDFs']),'authorityCandidateSha256':a['sha256'],'authorityApproval':'PENDING_OWNER_APPROVAL','availability':availability(k['boundaries'],k['systemKnownAt'],k['decisionAsOf'],False)})
 for m in M:
  f=canonical[m['obligationIndex']];b=next(x['body'] for x in bindings if x['body']['disclosureId']==m['disclosureId']);r=next(x for x in receipts if x['body']['obligationIndex']==m['obligationIndex']);a=next(x for x in auth if x['body']['disclosureId']==m['disclosureId']);k=next(x for x in K if x['disclosureId']==m['disclosureId'])
  require(m['canonicalFactHash']==f['canonicalFactHash'] and m['canonicalValuePreserved']==f['value'] and m['period']==f['period'] and m['scope']==f['scope'],'CANONICAL_MAPPING_SUBSTITUTION')
  factor='1000000' if f['ticker'] in ['SSB','VRE'] else '1';sign='NEGATE_NONPOSITIVE' if f['concept']=='CASH_CAPEX_REPORTED' else 'PRESERVE'
  require(m['normalization']['factor']==factor and m['normalization']['signConvention']==sign,'UNIT_SIGN_CONTRACT')
  require(normalized(m['sourceCells'],factor,sign)==f['value'],'NORMALIZATION_MISMATCH')
  for c in m['sourceCells']:require(c['documentSha256']==b['documentSha256'] and c['scope']==f['scope'] and c['nativeUnit']==('MILLION_VND' if factor=='1000000' else 'VND'),'CELL_SOURCE_UNIT_SCOPE')
  rb=r['body'];require(digest(rb)==r['sha256'] and r['receiptId']=='pe3-mapping-sha256:'+r['sha256'],'PE3_RECEIPT_ENVELOPE')
  expected={'sourceCellMappingSha256':digest(m),'normalizationSha256':digest(m['normalization']),'canonicalFactSha256':f['canonicalFactHash'],'knowledgeSha256':digest(k),'authorityCandidateSha256':a['sha256'],'documentSha256':b['documentSha256'],'sourcePublicationReceiptHash':next(x['contentHash'] for x in bindings if x['body']['disclosureId']==m['disclosureId']),'D2PolicyHash':b['policyHash'],'D2ImplementationHash':b['implementationHash']}
  for field,value in expected.items():require(rb[field]==value,'RECEIPT_BINDING:'+field)
  require(not rb['independentlyAccepted'] and not rb['formallyAdmitted'],'FALSE_HUMAN_ACCEPTANCE')
 # Independently verify D2 executable manifest pins and canonical policy, without calling producer PASS helpers.
 policy=read(root/'src/domain/fundamentals/d2-policy-candidate-v1.json');require(digest(policy)==bindings[0]['body']['policyHash'],'D2_POLICY_REPLACEMENT');manifest=read(E/'2026-10-21-d2-date-only-policy-implementation/D2_IMPLEMENTATION_MANIFEST.json');require(digest({k:v for k,v in manifest.items() if k!='contentHash'})==manifest['contentHash']==bindings[0]['body']['implementationHash'],'D2_IMPLEMENTATION_REPLACEMENT')
 for pin in manifest['artifacts']:require(sha(root/pin['path'])==pin['sha256'],'D2_CODE_REPLACEMENT')
 approvalRows=conn.execute("select * from methodology_record where configuration_reference like 'source-publication-authority-sha256:%' or configuration_reference like 'd2-source-identity-sha256:%'").fetchall();require(not approvalRows,'NEW_AUTHORITY_REQUIRES_SEPARATE_REVIEW')
 conn.close()
 return {'status':'INDEPENDENT_TECHNICAL_RECOMPUTATION_PASS_NOT_HUMAN_APPROVAL','producerVerifierImported':False,'producerFinalStatusUsedAsProof':False,'seals':seals,'sourceDisclosures':sources,'canonicalMinimumObligations':canonical,'replayedMappingReceipts':len(receipts),'normalizationMatches':len(M),'approvedExactAuthorityRows':len(approvalRows),'mismatches':[]}

def validate_acceptance(record):
    require(set(record['gates'])==set('ABCDEFGHI'),'ACCEPTANCE_GATES_MISSING')
    passed=all(v['satisfied'] for v in record['gates'].values())
    require(record['acceptanceState']!='FORMALLY_ACCEPTED' or (passed and record.get('authenticatedPreExistingOwnerApprovalVerified') is True),'FABRICATED_FORMAL_ACCEPTANCE')
    require(all(record['gates'][g]['satisfied'] for g in ['B','C','D','E']),'TECHNICAL_GATES_NOT_SATISFIED')
    require(not record['formallyAccepted'] and not record['formallyAdmitted'] and not record['independentlyHumanAccepted'],'NO_AUTHENTICATED_OWNER_ACCEPTANCE_PROVEN')
    require(record['acceptanceState']=='PENDING_REQUIRED_EVIDENCE','ACTUAL_REQUIRED_EVIDENCE_NOT_CLOSED')
    for g in ['A','F','G','H','I']:require(record['gates'][g]['satisfied'] is False,'UNPROVEN_GOVERNANCE_OR_KNOWLEDGE')
    return True

def validate_cell_review(root,review,canonical,original):
    b=review['body'];require(digest(b)==review['sha256'] and review['reviewId']=='pe4-cell-review-sha256:'+review['sha256'],'PE4_CELL_RECEIPT_HASH')
    require(b['PE3MappingSha256']==digest(original),'ORIGINAL_MAPPING_SUBSTITUTED')
    require((b['obligationIndex'],b['canonicalFactSha256'],b['canonicalValue'],b['period'],b['scope'],b['canonicalConcept'])==(canonical['obligationIndex'],canonical['canonicalFactHash'],canonical['value'],canonical['period'],canonical['scope'],canonical['concept']),'PE4_CANONICAL_IDENTITY')
    factor='1000000' if canonical['ticker'] in ['VRE','SSB'] else '1';sign='NEGATE_NONPOSITIVE' if canonical['concept']=='CASH_CAPEX_REPORTED' else 'PRESERVE';n=b['normalization']
    require(n['factor']==factor and n['signConvention']==sign,'PE4_FACTOR_SIGN_CONFLICT');require(normalized(b['sourceCells'],factor,sign)==canonical['value']==n['result'],'PE4_NORMALIZATION')
    require(n['methodContract']==original['normalization']['semanticContract'] and n['formula']==original['normalization']['formula'],'NORMALIZATION_METHOD_SUBSTITUTION')
    require(sha(Path(root)/n['methodContract'])==n['methodContractSha256'],'NORMALIZATION_CONTRACT_REPLACEMENT')
    require(len(b['sourceCells'])==len(original['sourceCells']),'OPERAND_OMISSION_OR_ADDITION')
    for c,old in zip(b['sourceCells'],original['sourceCells']):
        require(c['cellId']==old['cellId'] and c['physicalPage']==old['physicalPage'] and c['pdfPath']==old['pdfPath'] and c['columnOccurrence']==old['columnOccurrence'] and c['scope']==old['scope'],'CELL_ROW_PAGE_OCCURRENCE')
        if b['obligationIndex']==47:
            require(c['rowCode']=='NOTE_7.6_CLOSING_30JUN2026' and c['column']=='Tổng cộng — Triệu đồng' and c['physicalPage']==40,'SSB_CLOSING_ROW_TOTAL_COLUMN')
        else:require(c['rowCode']==old['rowCode'] and c['column']==old['column'] and c['sourceCaption']==old['sourceCaption'],'CELL_CAPTION_OR_COLUMN')
        require(c['documentSha256']==canonical['sourceHash']==sha(Path(root)/c['pdfPath']),'PE4_SOURCE_BYTES')
        require(c['nativeUnit']==('MILLION_VND' if factor=='1000000' else 'VND'),'SOURCE_UNIT')
        require(c['reportedValue']==old['reportedValue'],'VALUE_CORRECTION_REQUIRES_SEPARATE_CANDIDATE')
        box=c['box'];require(box and len(box)==4 and all(0<=x<=1 for x in box) and box[0]+box[2]<=1 and box[1]+box[3]<=1,'MISSING_OR_INVALID_SOURCE_BOX')
        require(c['PE4Evidence']['sourcePDFBytesRehashed'] and not c['ownerAccepted'],'SOURCE_EVIDENCE_OR_FALSE_ACCEPTANCE')
    require(not b['ownerAccepted'] and not b['formallyAdmitted'] and not b['economicPerimeterAccepted'],'FALSE_SOURCE_ADMISSION')
    return True

def replay_package(root):
    root=Path(root);p=root/'docs/fundamental-data-engine/evidence/2026-10-22-primary-publication-evidence-pe4';underlying=replay(root)
    if (p/'EVIDENCE_SEAL.json').exists():verify_seal(root,p)
    saved=read(p/'PE1_PE2_PE3_REPLAY.json');require(saved==underlying,'UNDERLYING_REPLAY_CHANGED')
    originals=read(p.parent/'2026-10-22-primary-publication-evidence-pe3/SOURCE_CELL_MAPPING_REVIEW.json')['mappings'];cells=read(p/'SOURCE_CELL_INDEPENDENT_REVIEW.json')['reviews'];require(len(cells)==45 and len({x['body']['obligationIndex'] for x in cells})==45,'45_EXACT_MAPPING_IDS_REQUIRED')
    for r in cells:
        i=r['body']['obligationIndex'];validate_cell_review(root,r,underlying['canonicalMinimumObligations'][i],next(m for m in originals if m['obligationIndex']==i))
    assessments=read(p/'OBLIGATION_ACCEPTANCE_ASSESSMENT.json')['records'];require(len(assessments)==45 and {x['obligationIndex'] for x in assessments}=={r['body']['obligationIndex'] for r in cells},'ASSESSMENT_SCOPE')
    for a in assessments:
        validate_acceptance(a);r=next(x for x in cells if x['body']['obligationIndex']==a['obligationIndex']);require(a['PE4TechnicalReceiptSha256']==r['sha256'],'ASSESSMENT_RECEIPT_BINDING')
    authority=read(p/'SOURCE_AUTHORITY_DECISIONS.json')['records'];require(len(authority)==8 and all(not a['ownerApproved'] and a['authorityDecision']=='PENDING_OWNER_APPROVAL' for a in authority),'FALSE_AUTHORITY_APPROVAL')
    knowledge=read(p/'KNOWLEDGE_CLOSURE.json')['records']
    for k in knowledge:
        av=availability(k['boundaries'],k['actualDatasetCutoffs']['systemKnownAt'],k['actualDatasetCutoffs']['decisionAsOf'],False)
        require(not av['eligible'] and av['effectiveKnownAt'] is None and not k['complete'] and not k['AS_KNOWNEligible'],'REAL_KNOWLEDGE_LOOKAHEAD')
    coverage=read(p/'MINIMUM_DATASET_COVERAGE.json');rows=coverage['rows'];require(len(rows)==216 and len({x['obligationIndex'] for x in rows})==216 and len({x['obligationIdentitySha256'] for x in rows})==216,'COVERAGE_DUPLICATE')
    verified={r['body']['obligationIndex'] for r in cells};known=underlying['canonicalMinimumObligations']
    for row in rows:
        i=row['obligationIndex'];f=known[i];require(row['canonicalFactSha256']==f['canonicalFactHash'] and row['canonicalPointer']==f['canonicalPointer'] and row['PE4FinancialMappingTechnicallyVerified']==(i in verified),'COVERAGE_CANONICAL_LINK')
        require(row['archivedPE1SourceEvidenceCovered']==(i in verified) and row['PE3MappingReviewed']==(i in verified),'ARCHIVED_COVERAGE_SCOPE')
        require(not any(row[k] for k in ['sourceAuthorityApproved','knowledgeComplete','AS_KNOWNEligible','independentlyHumanAccepted','formallyAccepted','formallyAdmitted']),'COVERAGE_FALSE_ADMISSION')
        for match in row['currentVietstockMatches']:require(sha(root/match['path'])==match['sha256']==f['sourceHash'],'VIETSTOCK_COVERAGE_HASH')
    require(sum(r['currentVietstockDocumentMatched'] for r in rows)==104 and coverage['summary']['remainingUnresolved']==216,'COVERAGE_COUNTS')
    return {'status':'PASS_INDEPENDENT_TECHNICAL_REPLAY_ONLY','priorPackageSealsVerified':3,'priorSealedFilesRehashed':sum(x['sealedFilesRehashed'] for x in underlying['seals']),'sourceDisclosuresVerified':8,'authorityCandidateHashBindingsVerified':8,'authorityOwnerApproved':0,'sourceCellMappingsIndependentlyTechnicallyVerified':45,'sourceOperandsVerified':sum(len(x['body']['sourceCells']) for x in cells),'normalizationMatches':45,'pendingSourceDigitsTechnicallyResolved':7,'completeKnowledgeChains':0,'AS_KNOWNEligible':0,'formallyAccepted':0,'formallyAdmitted':0,'minimumDatasetObligations':216,'currentVietstockDocumentMatches':104,'producerVerifierImported':False,'independentHumanApprovalClaimed':False}
