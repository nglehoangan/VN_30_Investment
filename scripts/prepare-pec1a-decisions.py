"""PEC-1A retained-evidence qualification and owner decision packet, no admission."""
import datetime
import hashlib
import html
import json
import re
import sqlite3
import subprocess
from pathlib import Path
from lib.pe4_evidence import sha, digest, replay_package, verify_seal

ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'docs/fundamental-data-engine/evidence'
P1=E/'2026-10-21-primary-publication-evidence-pe1'
P2=E/'2026-10-22-primary-publication-evidence-pe2'
P3=E/'2026-10-22-primary-publication-evidence-pe3'
P4=E/'2026-10-22-primary-publication-evidence-pe4'
PEC1=E/'2026-10-22-production-evidence-closure-pec1'
PEC2=E/'2026-10-23-production-evidence-closure-pec2'
REVIEW=E/'2026-10-23-pec2-final-implementation-review'
OUT=E/'2026-10-23-pec1a-authenticated-source-authority-decision'
BASE_COMMIT='a4c438fd44a7d00648cd2761384aa8f61d71f744'

def read(p):return json.loads(Path(p).read_text())
def write(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def ref(p,pointer='',node=None):
    p=Path(p);r={'path':str(p.relative_to(ROOT)),'sha256':sha(p),'pointer':pointer}
    if node is not None:r['nodeSha256']=digest(node)
    return r

def protected_snapshot():
    files=[]
    for folder in [ROOT/'data',ROOT/'src',E]:files.extend(folder.rglob('*'))
    files += [ROOT/'AGENTS.md',ROOT/'package.json',ROOT/'pnpm-lock.yaml',ROOT/'docs/fundamental-data-engine/issuer-sources.json',ROOT/'docs/fundamental-data-engine/issuer-document-routes.json',ROOT/'docs/fundamental-data-engine/VIETSTOCK_ONLY_SOURCE_POLICY.md',ROOT/'docs/fundamental-data-engine/ESCALATION_REGISTER.json']
    return {str(p.relative_to(ROOT)):sha(p) for p in files if p.is_file() and OUT not in p.parents and '__pycache__' not in p.parts}

def database_lookup():
    db=sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro',uri=True);db.row_factory=sqlite3.Row
    tables=[r[0] for r in db.execute("select name from sqlite_master where type='table' order by name")]
    methods=[dict(r) for r in db.execute('select * from methodology_record')]
    authority=[r for r in methods if r['configuration_reference'].startswith(('source-publication-authority-sha256:','d2-source-identity-sha256:'))]
    result={'databaseSha256':sha(ROOT/'data/vn30.sqlite'),'logicalDumpSha256':digest(list(db.iterdump())),
        'tableCounts':{t:db.execute('select count(*) from "'+t+'"').fetchone()[0] for t in tables},'methodologyRecords':methods,'exactSourceAuthorityRows':authority,
        'queries':["select * from methodology_record","select name from sqlite_master where type='table' order by name"],
        'candidateIngestionRows':[dict(r) for r in db.execute('select id,body_hash,created_at,analysis_at from fundamental_admission_run')],
        'meaning':'Candidate runs are not FORMAL PDF ingestion or source approval. All queries read-only.'}
    db.close();return result

def search_inventory(candidates):
    tokens=sorted({t for c in candidates for t in [c['candidateId'],c['sha256'],c['body']['source']['sourceSha256'],c['body']['source']['documentSha256']]})
    command=['rg','--files','--hidden','--no-ignore','docs','src','data','scripts','-g','*.json','-g','*.md','-g','*.txt','-g','*.ts','-g','*.mjs','-g','*.py']
    result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,check=True)
    paths=[p for p in result.stdout.splitlines() if not p.startswith(str(OUT.relative_to(ROOT))+'/')]
    matches=[]
    for relative in paths:
        p=ROOT/relative
        try:text=p.read_text()
        except (UnicodeError,OSError):continue
        found=[t for t in tokens if t in text]
        if found:matches.append({'path':relative,'sha256':sha(p),'matchingTokens':found,
            'classification':'SOURCE_OR_QUALIFICATION_OR_PROPOSAL_REFERENCE_NOT_AUTHENTICATION'})
    return {'scope':command,'filesSearched':len(paths),'exactTokens':tokens,'matches':matches,
        'limits':'Exact candidate/source/document hash search over retained text/JSON/code and a read-only authority/formal-table lookup. Matching a hash or APPROVED string is not authenticated approval. Binary PDFs are rehashed through exact source refs, not searched as text. Logs, remote governance systems and external identity providers are not claimed searched.',
        'approvalEvidenceConclusion':'No authenticated exact PEC-1 owner decisions found in the checked owner register, formal authority records, current trust configuration or scoped approval documents. This is a bounded repository finding, not a claim that no external owner records exist.'}

def recover_retained_leads(c):
    body=c['body'];ticker=body['ticker'];source_hash=body['source']['documentSha256'];leads=[]
    if ticker=='HPG':
        p=E/'2026-10-14-ticker-closure-HPG/HPG_ISSUER_CELL_EVIDENCE.json';key='observations'
    elif ticker=='VJC':
        p=E/'2026-10-16-ticker-closure-VJC/VJC_CANONICAL_FACTS.json';key='canonicalFacts'
    else:p=None
    if p:
        for j,node in enumerate(read(p)[key]):
            if node.get('sourceHash')==source_hash:
                leads.append({'kind':'HISTORICAL_MAPPING_CANDIDATE','reference':ref(p,f'/{key}/{j}',node),'retainedRecord':node,
                    'currentExactPdf':ref(ROOT/body['source']['documentPath']),
                    'legacySourcePathExists':(ROOT/node['sourcePath']).exists() if node.get('sourcePath') else None,
                    'qualification':'Same exact source hash, not newly accepted mapping. REVIEWED/qualified/current-analysis flags are not authenticated PEC-1A acceptance. Reuse only after intended metric, period, scope, definitions and exact source-cell review; no deleted legacy paths are restored.'})
    if ticker=='SSB':
        for name in ['SSB_NPL_RECONCILIATION.json','SSB_LLR_RECONCILIATION.json']:
            p=E/'2026-10-16-ticker-closure-SSB'/name
            for j,node in enumerate(read(p)['periods']):
                if node.get('sourceHash')==source_hash and node['end']==body['sourceContract']['economicPeriod']['end']:
                    leads.append({'kind':'RETAINED_UNCERTIFIED_POPULATION_BRIDGE','reference':ref(p,f'/periods/{j}',node),'retainedRecord':node,
                        'currentExactPdf':ref(ROOT/body['source']['documentPath']),
                        'qualification':'Exact source hash, closing period and consolidated scope match. AVAILABLE is a producer finding, not signed regulatory/perimeter acceptance. Compare populations, captions, stock basis and exclusions on physical pages 39/40 against PE4 obligations 45/46/47; no acceptance by matching amounts.'})
    return leads

def main():
    if (OUT/'CANDIDATE_DECISION_MATRIX.json').exists():raise SystemExit('Refuse overwrite: append a separately reviewed version.')
    assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()==BASE_COMMIT
    baseline=protected_snapshot();db=database_lookup()
    replay=replay_package(ROOT)
    packages=[P1,P2,P3,P4,PEC1,PEC2,REVIEW]
    seals=[verify_seal(ROOT,p) for p in packages]
    source=read(P3/'AUTHORITY_APPROVAL_CANDIDATES.json')['candidates']
    search=search_inventory(source)
    OUT.mkdir(parents=True,exist_ok=True)
    write('PROTECTED_INPUT_HASHES.json',baseline);write('DATABASE_LOOKUP.json',db);write('PE4_EVIDENCE_REPLAY.json',replay);write('PRIOR_SEAL_VERIFICATION.json',seals);write('REPOSITORY_SEARCH_INVENTORY.json',search)
    knowledge=read(P4/'KNOWLEDGE_CLOSURE.json')['records'];qualified=read(P4/'SOURCE_AUTHORITY_DECISIONS.json')['records']
    old=read(PEC1/'OWNER_DECISION_REGISTER.json')['records'];p2=read(P2/'SOURCE_BINDING_CANDIDATES.json')['candidates']
    cells=read(P4/'SOURCE_CELL_INDEPENDENT_REVIEW.json')['reviews'];assess=read(P4/'OBLIGATION_ACCEPTANCE_ASSESSMENT.json')['records']
    limits=read(P4/'ECONOMIC_PERIMETER_REVIEW.json');coverage=read(P4/'MINIMUM_DATASET_COVERAGE.json')
    disclosures=read(P1/'OFFICIAL_DISCLOSURE_DISCOVERY.json')['records'];http=read(P1/'HTTP_REQUEST_INVENTORY.json')
    cores=read(PEC2/'EVIDENCE_BUNDLES.json')['bundles'];now=datetime.datetime.now(datetime.timezone.utc).isoformat()
    related=[
       (ROOT/'src/domain/fundamentals/debt-contract-v2.json','Existing approved reported-borrowing semantic contract; not issuer-specific comprehensive-debt completeness, source authority, financial acceptance or admission.'),
       (E/'2026-10-12-casa-npl-owner-approved/OWNER_APPROVAL.json','Prospective source-contract governance only; bankSpecificMappings is empty and numeric mapping/promotion/historical reclassification are excluded. Does not close SSB population proof.'),
       (E/'2026-10-21-d2-date-only-policy-implementation/D2_OWNER_DECISION.md','D2 semantics/implementation only; explicitly excludes source identity, financial mapping, dataset approval and production activation.'),
       (E/'2026-10-20-production-authority-final-activation/OWNER_APPROVAL_RECEIPT.json','Static scoring executable approval only; does not approve these exact source/publication/identity candidates.'),
       (E/'2026-10-21-production-runtime-scoring-readiness/DATASET_ACCEPTANCE_REVIEW.json','BLOCKED_NOT_CREATED; zero independent acceptance. Runtime/dataset review is not a source approval.'),
       (E/'2026-10-21-production-scoring-blocker-resolution/SCORING_DATASET_ACCEPTANCE.json','BLOCKED_NOT_CREATED; candidate admission explicitly is not runtime acceptance.')]
    write('RELATED_APPROVALS_SCOPE_CHECK.json',{'records':[{'evidence':ref(p),'qualification':meaning,'closesExactSourceAuthorityGap':False} for p,meaning in related]})
    cases=[];gaps=[];recovered=[]
    for i,c in enumerate(source):
        leads=recover_retained_leads(c);recovered.append({'candidateId':c['candidateId'],'leads':leads})
        body=c['body'];d=body['disclosureId'];s=body['source'];period=body['sourceContract']['economicPeriod'];case=body['ticker']+'-'+period['end']
        qi=next(j for j,x in enumerate(qualified) if x['candidateId']==c['candidateId']);q=qualified[qi]
        ki=next(j for j,x in enumerate(knowledge) if x['disclosureId']==d);k=knowledge[ki]
        oi=next(j for j,x in enumerate(old) if x['candidateId']==c['candidateId']);o=old[oi]
        bi=next(j for j,x in enumerate(p2) if x['body']['disclosureId']==d);binding=p2[bi]['body']
        di=next(j for j,x in enumerate(disclosures) if x['disclosureId']==d);disc=disclosures[di]
        ci=next(j for j,x in enumerate(cores) if x['core']['pec1Candidate']['candidateId']==c['candidateId'])
        raw=(ROOT/s['sourcePath']).read_text();loc=binding['publicationLocator'];segment=raw[loc['start']:loc['endExclusive']]
        literal=datetime.date.fromisoformat(binding['publicationDate']).strftime('%d/%m/%Y')
        assert literal in segment and sha(ROOT/s['sourcePath'])==s['sourceSha256'] and sha(ROOT/s['documentPath'])==s['documentSha256']
        selected=[(j,r) for j,r in enumerate(cells) if r['body']['obligationIndex'] in o['mappedObligationIndices']]
        matched_http=[(j,h) for j,h in enumerate(http) if h.get('bodyPath')==s['sourcePath'] and h.get('bodySha256')==s['sourceSha256'] and h.get('retrievedAt')==k['boundaries']['sourceRetrievedAt']]
        assert matched_http
        mapping=[]
        for j,r in selected:
            m=r['body'];idx=m['obligationIndex'];ai=next(n for n,a in enumerate(assess) if a['obligationIndex']==idx)
            operands=[]
            for z,cell in enumerate(m['sourceCells']):
                operands.append({'cellId':cell['cellId'],'caption':cell['sourceCaption'],'rowCode':cell['rowCode'],'column':cell['column'],'reportedValue':cell['reportedValue'],'nativeUnit':cell['nativeUnit'],'statement':cell.get('statement'),
                    'pdfPath':cell['pdfPath'],'physicalPage':cell['physicalPage'],'href':cell['pdfPath']+'#page='+str(cell['physicalPage']),'box':cell['box'],
                    'reference':ref(P4/'SOURCE_CELL_INDEPENDENT_REVIEW.json',f'/reviews/{j}/body/sourceCells/{z}',cell)})
            mapping.append({'obligationIndex':idx,'metric':m['canonicalConcept'],'period':m['period'],'scope':m['scope'],'canonicalValue':m['canonicalValue'],'normalization':m['normalization'],
                'receiptId':r['reviewId'],'receiptHash':r['sha256'],'reference':ref(P4/'SOURCE_CELL_INDEPENDENT_REVIEW.json',f'/reviews/{j}/body',m),'sourceCells':operands,
                'acceptanceAssessment':ref(P4/'OBLIGATION_ACCEPTANCE_ASSESSMENT.json',f'/records/{ai}',assess[ai]),'acceptanceGateStates':assess[ai]['gates'],'humanAccepted':False})
        limitation_records=[(j,v) for j,v in enumerate(limits['records']) if v['obligationIndex'] in o['mappedObligationIndices']]
        restrictions=list(o['restrictions'])
        for _,v in limitation_records:
            for r in v['restrictions']:
                if r not in restrictions:restrictions.append(r)
        if body['ticker']=='GVR':restrictions.append(limits['additionalGVR105'])
        if not mapping:restrictions.append('Identity/publication evidence only in PE4 scope; no annual financial metrics are accepted or bridged to current interim requirements.')
        if not body['identityMethod']['retainedPDFs']:restrictions.append('No exact retained Vietstock PDF pair established for this archived source. No mirror-variant equivalence or current Vietstock coverage is implied.')
        subcomponents={name:{'reference':ref(P3/'AUTHORITY_APPROVAL_CANDIDATES.json',f'/candidates/{i}/body/{name}',body[name]),'proposalContentHash':digest(body[name]),'approvalState':'PENDING'} for name in ['sourceContract','publicationMethod','identityMethod']}
        gates={g:{'state':v['state'],'reason':v['reason']} for g,v in o['gates'].items()}
        missing=[x['field'] for x in k['missingEvidence']]
        case_refs={'candidate':ref(P3/'AUTHORITY_APPROVAL_CANDIDATES.json',f'/candidates/{i}',c),'qualification':ref(P4/'SOURCE_AUTHORITY_DECISIONS.json',f'/records/{qi}',q),
            'ownerRegister':ref(PEC1/'OWNER_DECISION_REGISTER.json',f'/records/{oi}',o),'knowledge':ref(P4/'KNOWLEDGE_CLOSURE.json',f'/records/{ki}',k),
            'binding':ref(P2/'SOURCE_BINDING_CANDIDATES.json',f'/candidates/{bi}',p2[bi]),'discovery':ref(P1/'OFFICIAL_DISCLOSURE_DISCOVERY.json',f'/records/{di}',disc),
            'pec2Core':ref(PEC2/'EVIDENCE_BUNDLES.json',f'/bundles/{ci}/core',cores[ci]['core']),
            'perimeter':[ref(P4/'ECONOMIC_PERIMETER_REVIEW.json',f'/records/{j}',v) for j,v in limitation_records]}
        requirement_actions=[
          {'id':'IDENTITY','decisionType':1,'role':'Data Evidence Reviewer','exists':'EXACT_RETAINED_PROOFS','minimumAction':'Independently sign off the pinned source HTML, exact PDF identity pages and document type/period/consolidation; preserve distinct identity class and no unproven mirror equivalence.','publicWebEvidenceRequired':False},
          {'id':'PUBLISHER','decisionType':2,'role':'Source/methodology governance owner + Data Evidence Reviewer','exists':'TECHNICAL_IDENTITY_AND_PROPOSED_CONTRACT_ONLY','minimumAction':'Qualify the exact issuer-to-archive publication route and endorse only the three pinned source/publication/identity components through authenticated, separately scoped governance decisions. No generic publisher reputation.','publicWebEvidenceRequired':False},
          {'id':'MAPPING','decisionType':3,'role':'Data Quality Owner / sector methodology owner','exists':'TECHNICAL_RECEIPTS_ONLY' if mapping else 'NO_MAPPING_IN_PE4_SCOPE','minimumAction':('Sign each of the '+str(len(mapping))+' exact fact scopes and normalization/perimeter receipts; preserve instant versus flow periods and any NCI, debt or regulatory population limitations.' if mapping else 'First define the intended annual dataset/metrics. Review the '+str(len(leads))+' pinned same-document historical mapping leads before commissioning missing mappings; do not treat historical flags as current acceptance or reuse interim metrics.'),'publicWebEvidenceRequired':False},
          {'id':'KNOWLEDGE','decisionType':4,'role':'Formal lineage custodian + dataset/analysis owner','exists':'PARTIAL_CLOCKS_ONLY','minimumAction':'Supply genuine immutable events for '+', '.join(missing)+' plus actual systemKnownAt/decisionAsOf. If historical events do not exist, propose an authorized prospective lineage workflow and a new actual dataset version; never substitute candidate created_at or producer review time.','publicWebEvidenceRequired':False,'externalHistoricalEventRecordsRequiredIfHistoricalClaim':True},
          {'id':'INDEPENDENT','decisionType':5,'role':'Independent Validator (different from producer)','exists':'TECHNICAL_REPLAY_ONLY','minimumAction':'Review the exact authority, financial/perimeter, knowledge and actual cutoff evidence; record authenticated candidate/hash/scope-bound acceptance only after all applicable PE4 A-I criteria close.','publicWebEvidenceRequired':False},
          {'id':'OWNER','decisionType':6,'role':'Investment System Owner','exists':'NO_AUTHENTICATED_DECISION','minimumAction':'Record DEFER or REJECT now through authenticated governance, or obtain the missing preceding sign-offs and then decide the exact full source authority scope. Bind original candidate hash, approved realized component/version hashes, true decision/effectivity/validity/knownAt evidence and restrictions. Codex cannot authenticate or approve on the owner’s behalf.','publicWebEvidenceRequired':False,'newAuthenticatedGovernanceEvidenceRequired':True},
          {'id':'ADMISSION','decisionType':7,'role':'Separately authorized admission owner / runtime composition owner','exists':'NOT_ADMITTED','minimumAction':'Only after source approval and all mandatory evidence: separate authenticated admission event, fresh history/revocation and exact dataset-scope checks. No such action is performed by this package.','publicWebEvidenceRequired':False}]
        current={'caseId':case,'candidateId':c['candidateId'],'candidateVersion':body['schemaVersion'],'candidateHash':c['sha256'],'ticker':body['ticker'],'reportingPeriod':period,
            'sourceIdentity':{'url':s['sourceURL'],'capture':ref(ROOT/s['sourcePath']),'historicalHttpRequests':[ref(P1/'HTTP_REQUEST_INVENTORY.json',f'/{j}',h) for j,h in matched_http]},
            'publisherIdentity':{'legalName':body['issuer'],'qualification':'TECHNICALLY_VERIFIED_ARCHIVED_ISSUER_ROUTE_NOT_APPROVED_AUTHORITY','identityPages':q['qualification']['exactIssuerIdentity']['physicalIdentityPages']},
            'documentIdentity':{'url':s['documentURL'],'capture':ref(ROOT/s['documentPath']),'class':body['identityMethod']['identityClass'],'retainedPairs':body['identityMethod']['retainedPDFs'],'documentType':body['sourceContract']['allowedDocumentTypes'][0]},
            'publicationEvidence':{'date':binding['publicationDate'],'precision':binding['publicationPrecision'],'publishedAt':None,'timezone':binding['timezone'],'conservativeBoundary':binding['publicationBoundary'],'locator':loc,
                'exactLocatorTextSha256':hashlib.sha256(segment.encode()).hexdigest(),'dateLiteral':literal,'retainedExcerpt':disc['publicationEvidence'].get('reviewedExcerpt'),'meaning':'Item-local date and exact PDF link in retained HTML. Boundary is derived D2 availability, never an actual publication timestamp.'},
            'evidenceHashes':{'originalPEC1EvidenceBundleHash':o['evidenceBundleHash'],'PEC2EvidenceCoreHash':digest(cores[ci]['core']),'candidateBodyHash':c['sha256'],'sourceHash':s['sourceSha256'],'documentHash':s['documentSha256']},
            'exactApprovalScope':{'issuer':body['issuer'],'ticker':body['ticker'],'sourceURL':s['sourceURL'],'sourceCaptureHash':s['sourceSha256'],'documentURL':s['documentURL'],'documentHash':s['documentSha256'],'allowedDocumentTypes':body['sourceContract']['allowedDocumentTypes'],'consolidation':body['sourceContract']['reportingScope'],'documentPeriod':period,
                'sourceComponents':subcomponents,'financialFactScopes':[{'obligationIndex':m['obligationIndex'],'metric':m['metric'],'period':m['period'],'scope':m['scope'],'statementCodes':list(dict.fromkeys(c['statement'] for c in m['sourceCells'])),'receiptHash':m['receiptHash']} for m in mapping],
                'exclusions':['No other issuer, report period/revision, source/doc bytes, request mode or metric.','No live issuer/exchange acquisition; Vietstock-only current acquisition policy unchanged.','No implicit Vietstock mirror equivalence or comprehensive debt/NPL/regulatory population claim.','No production admission, D2/runtime activation, scoring, ranking, Top 10 or investment decision.'],'approvedEffectiveFrom':None,'approvedEffectiveThrough':None,'approvedKnownAt':None},
            'financialMappingCoverage':{'mappedObligations':len(mapping),'sourceOperands':sum(len(m['sourceCells']) for m in mapping),'independentlyHumanAccepted':0,'facts':mapping},
            'recoveredRetainedEvidenceLeads':leads,
            'knowledgeEvidence':{'boundaries':k['boundaries'],'missingRequiredFields':missing,'actualCutoffs':k['actualDatasetCutoffs'],'candidateIngestionObservation':k['candidateIngestionObservation'],'candidateIngestionIsFormalPDFIngestion':False,'complete':False,'provenance':case_refs['knowledge']},
            'gateQualification':gates,'limitations':restrictions,'decisionTypes':requirement_actions,'references':case_refs,
            'independentAcceptance':{'currentlySatisfies':False,'technicalEvidenceReviewReady':bool(mapping),'missing':['Qualified source components and exact proposed authority scope; component decisions remain separate from final owner source authority','Accepted precise financial mappings/perimeters' if mapping else 'New annual source-cell mappings and intended fact scopes','Full formal lineage and actual dataset cutoffs','Authenticated independent reviewer acceptance'],'responsibleRole':'Independent Validator, with Data Evidence Reviewer, Data Quality Owner and lineage/dataset owners','minimumAction':'Use the exact PE4 acceptance assessment pointers in each fact; do not replace A/F/G/H/I failures with a general PASS.'},
            'recommendedDecision':'DEFER','recommendationReason':'Mandatory publisher-authority, mapping acceptance, formal knowledge/cutoff, independent acceptance and owner approval evidence remain absent; no mandatory gate may be waived.' if mapping else 'Archive identity/publication is qualified but PE4 contains no annual financial mappings or intended dataset acceptance for this report; source authority and knowledge evidence are also absent.',
            'authenticatedOwnerDecision':None,'ownerIdentity':None,'decisionTimestamp':None,'effectiveAuthorityStatus':'PENDING_REQUIRED_EVIDENCE','effectiveProductionAdmission':False,
            'consequencesOfApproval':'Only a later authenticated, exact-scope approval after mandatory evidence closes may qualify this immutable source/method version. It does not admit facts, complete coverage or activate runtime/scoring. Realized component hashes must be reviewed explicitly, never filled into the sealed proposal.',
            'consequencesOfRejection':'Keep evidence for audit; deny this authority and dependent source admissions. Any replacement requires separate explicit source/period/identity qualification under current Vietstock-only acquisition policy, not silent substitution.',
            'requiredOwnerAction':'Use the case-specific decision form and prerequisite receipts in OWNER_ACTION_REQUIRED.md. Current recommended source authority decision is DEFER; source identity sign-off and a prospective evidence-work authorization are separate decisions.',
            'priority':'CURRENT_45_MAPPING_PREREQUISITES' if mapping else 'PARK_ANNUAL_IDENTITY_ONLY_UNTIL_DATASET_DEFINED'}
        if body['ticker']=='SSB':
            action=next(a for a in requirement_actions if a['id']=='MAPPING')
            action['exists']='TECHNICAL_RECEIPTS_AND_RETAINED_UNCERTIFIED_BRIDGE_LEADS'
            action['minimumAction']+=' Two same-document NPL/LLR bridge candidates already exist at PDF pages 39/40. Sector owner and Independent Validator must verify caption/population/stock-basis/exclusion compatibility against PE4 obligations 45/46/47; acquire additional public evidence only if that review cannot establish the required definitions.'
        if not mapping and leads:
            current['independentAcceptance']['missing'][1]='Intended annual fact scopes and requalified historical source-cell mapping leads'
        cases.append(current)
        for a in requirement_actions:
            gaps.append({'caseId':case,'candidateId':c['candidateId'],'requirement':a['id'],'decisionType':a['decisionType'],'responsibleRole':a['role'],'retainedEvidenceStatus':a['exists'],'minimumAction':a['minimumAction'],'publicWebEvidenceRequired':a.get('publicWebEvidenceRequired',False),
                'newAuthenticatedGovernanceEvidenceRequired':a['id'] in ['PUBLISHER','MAPPING','KNOWLEDGE','INDEPENDENT','OWNER','ADMISSION'],'historicalExternalEventRecordsRequiredIfHistoricalClaim':a['id']=='KNOWLEDGE',
                'evidence':case_refs,'result':'TECHNICAL_EVIDENCE_LOCATED_APPROVAL_NOT_CREATED' if a['id']=='IDENTITY' else 'UNRESOLVED_EXTERNAL_GOVERNANCE_OR_EVENT_EVIDENCE_REQUIRED'})
    assert len(cases)==8 and sum(c['financialMappingCoverage']['mappedObligations'] for c in cases)==45
    write('RECOVERED_EVIDENCE_LEADS.json',{'records':recovered,'acceptedByThisWork':False,'meaning':'Historical mapping and bridge leads recovered by exact source hash, not approved source authority, mapping or knowledge.'})
    write('CANDIDATE_DECISION_MATRIX.json',{'schemaVersion':'pec1a-candidate-decision-matrix-v1','baseCommit':BASE_COMMIT,'preparedAt':now,'status':'PARTIALLY_READY','recommendationEnum':['APPROVE','APPROVE_WITH_RESTRICTIONS','DEFER','REJECT'],'recommendationsAreNotOwnerDecisions':True,'candidates':cases})
    outside=[r for r in coverage['rows'] if not r['PE4FinancialMappingTechnicallyVerified']]
    queue=[{'obligationIndex':r['obligationIndex'],'ticker':r['ticker'],'metric':r['concept'],'period':r['period'],'scope':r['scope'],'canonicalCandidateExists':r['canonicalCandidateExists'],'exactVietstockBytesAlreadyRetained':r['currentVietstockDocumentMatched'],'retainedMatches':r['currentVietstockMatches'],'coverageReference':ref(P4/'MINIMUM_DATASET_COVERAGE.json',f'/rows/{coverage["rows"].index(r)}',r),
        'nextAction':'Qualify the retained exact document/publication and financial source cells before requesting new downloads.' if r['currentVietstockDocumentMatched'] else 'Obtain or qualify exact bytes through Vietstock only, or request an explicit separately reviewed replacement/version; keep missing evidence blocking.'} for r in outside]
    write('EVIDENCE_GAP_RESOLUTION.json',{'schemaVersion':'pec1a-evidence-gaps-v1','records':gaps,'sourceEvidenceConclusion':'All eight archived HTML/PDF/publication identity packages already exist and rehash successfully; no new public web acquisition is needed merely to present these eight decisions. New authenticated governance/acceptance and genuine lineage/cutoff events do not exist in checked records.',
        'recoveredEvidenceLeads':'RECOVERED_EVIDENCE_LEADS.json','relatedApprovalScopeCheck':'RELATED_APPROVALS_SCOPE_CHECK.json','historicalVsProspective':'Supply genuine historical audit/event records if historical AS_KNOWN is claimed. Otherwise obtain explicit authorization for a separately reviewed prospective lineage workflow/new dataset; an authorization alone is not ingestedAt or source approval. No clocks are backfilled here.',
        'minimumCoverage':{'total':216,'PE4Mappings':45,'currentRetainedVietstockMatches':104,'reviewedAndRetainedOverlap':31,'outsidePE4':171,'outsideWithExactRetainedBytes':73,'outsideWithoutExactRetainedMatch':98,'reviewedArchiveOnlyNotExactRetainedMatch':14,'missingCanonicalCandidate':{'obligationIndex':185,'ticker':'VNM','metric':'COMPREHENSIVE_FINANCIAL_DEBT'},'setsNotAdditive':True},'outsideScopeWorkQueue':queue})
    write('EVIDENCE_LEDGER.json',{'schemaVersion':'pec1a-evidence-ledger-v1','cases':[{'caseId':c['caseId'],'hashes':c['evidenceHashes'],'references':c['references'],'source':c['sourceIdentity']['capture'],'document':c['documentIdentity']['capture']} for c in cases],
        'componentHashSemantics':'Canonical SHA-256 of each unmodified proposal sub-object. Approved realized versions must have separately authenticated exact hashes; modifying a pending/effectivity placeholder invalidates the original proposal hash.'})
    from lib.pec2_admission_v2 import evaluate
    prior=read(PEC2/'ADMISSION_CANDIDATES.json');current_results=[evaluate(r,b['core'],b['receipts'],prior['records'],now,trust={},root=ROOT) for r,b in zip(prior['records'],cores)]
    assert all(r['effectiveAdmissionState']=='DEFERRED' and not r['productionUseAuthorized'] for r in current_results)
    write('VALIDATION_RESULTS.json',{'status':'PASS_TARGETED_EVIDENCE_QUALIFICATION','checks':{'eightUniqueCandidates':len({c['candidateId'] for c in cases})==8,'candidateBodiesRehashed':8,'sourceHtmlAndPdfPairsRehashed':8,'publicationDatesPreserved':8,'sourceMappingReceipts':45,'sourceOperands':51,'priorSealsVerified':len(seals),'ownerApprovalFieldsRemainNull':True,'financialAmountsUnchanged':True,'currentEffectiveAdmissions':0,'databaseUnchanged':database_lookup()==db,'preexistingInputsUnchanged':protected_snapshot()==baseline},'PE4Replay':replay,'PEC2EvidenceOnlyEvaluations':current_results,'newExternalRequests':0,'productionScoringExecuted':False,'genericImplementationReviewRepeated':False,
        'validationScope':'Exact retained records, hashes/pointers, source-to-PDF dates, raw clocks, current read-only authority/formal-table lookup and existing evidence-only denial. No broad app build/test rerun and no new approval/admission implementation.'})
    # Human-readable decision package and concrete role-specific work orders.
    render_documents(cases,queue,coverage,now)
    write('FINAL_STATUS.json',{'status':'PARTIALLY_READY','reason':'Eight immutable, actionable DEFER recommendations prepared; missing authenticated decisions, formal lineage/cutoffs and independent acceptance remain blocking. Retained identity/publication evidence is ready for role-specific sign-off.','candidates':8,'recommendedDefer':8,'authenticatedOwnerDecisions':0,'effectiveAdmissions':0,'productionScoring':'BLOCKED_NOT_EXECUTED','PEC3Started':False})
    print('PEC-1A decision matrices and evidence gap work queue prepared.')


def render_documents(cases,queue,coverage,now):
    lines=['# PEC-1A — Source Authority Decision Package','', '**Status: PARTIALLY_READY.** Eight source candidates, seven issuers, eight DEFER recommendations; no authenticated owner decisions or effective admissions.','',
      'This packet qualifies retained decision evidence and assigns the exact missing receipts. It does not repeat the PEC-2 implementation review. Six interim candidates contain PE4’s 45 financial mappings/51 operands; HPG FY2025 and VJC FY2025 contain identity/publication evidence only within that review.','',
      '## Decisions remain separate','',
      '| Decision | Responsible role | What it can establish | What it cannot authorize |','|---|---|---|---|',
      '| 1 Source identity | Data Evidence Reviewer | Exact archived HTML/PDF, issuer/report dimensions and identity class | Publisher authority or accepted financial facts |',
      '| 2 Publisher authority qualification | Source/methodology governance owner + reviewer | Exact route and source/publication/identity contract components | Blanket publisher trust, full source authority or live issuer acquisition |',
      '| 3 Financial mapping acceptance | Data Quality Owner / sector owner | Exact source-cell, period, units, normalization and perimeter | Different metrics or broader debt/regulatory population |',
      '| 4 Knowledge/cutoff acceptance | Lineage custodian + dataset owner | Genuine immutable clocks and actual dataset cutoffs | Backdated events or timestamps inferred from publication/review time |',
      '| 5 Independent validation | Independent Validator, separate from producer | Evidence/scope-bound independent acceptance | Codex self-approval or final owner authority |',
      '| 6 Owner source authority approval | Investment System Owner | Exact source/method version after mandatory qualification | Automatic production admission or activation |',
      '| 7 Effective production admission | Separately authorized admission composition | Explicit admitted scope after all PEC-2 gates/history/revocation and owner event | Scoring, ranking, Top 10 or investment decisions |','',
      'All seven decisions are uncombined. Source identity and publication proofs exist. Exact authority approval, accepted mappings/perimeters, full formal knowledge/cutoffs and independent human acceptance do not. G1/G2/G4 are technically PASS; G3/G5/G6/G7/G8 remain PENDING. A technical PASS is not an authenticated reviewer signature.','',
      '## Evidence already located and evidence still needed','',
      '- All eight raw archived HTML/PDF pairs exist, rehash and bind item-local publication dates to exact document links. DATE_ONLY remains DATE_ONLY; publishedAt is null. No public web acquisition is needed merely to present these eight dossiers.',
      '- Six exact-byte retained-document identity matches exist; VJC H1-2026 and SSB H1-2026 instead have VERIFIED_DOCUMENT_IDENTITY and no exact retained mirror pair. Do not claim variant equivalence or current Vietstock coverage from their archive proof.',
      '- Existing D2 approval is policy/implementation only. CASA/NPL approval explicitly has no bank-specific mappings. The debt contract supports a narrow reported-borrowing definition, not issuer-specific comprehensive debt. Static scoring executable approval is unrelated. RELATED_APPROVALS_SCOPE_CHECK.json pins those actual records and exclusions.',
      '- Exact-hash search also recovers seven HPG FY2025 cell records, sixteen VJC FY2025 fact candidates, sixteen VJC interim fact candidates and SSB interim NPL/LLR bridge candidates. RECOVERED_EVIDENCE_LEADS.json pins every record and current PDF. These are reusable review leads, not accepted PE4 mappings. SSB pages 39/40 should be reviewed before requesting a new population-bridge document.',
      '- Missing governance/acceptance records are new external-to-repository owner/reviewer evidence, not necessarily new public documents. Missing historical clocks require genuine contemporaneous audit events if historical availability is claimed. Otherwise a separately authorized prospective lineage workflow and new actual dataset are needed. No such workflow is executed here.',
      '- An authenticated component decision/work authorization and final source authority approval are different records. Do not create a circular shortcut by calling a producer review, work authorization or candidate created_at a FORMAL ingestion event. The owner must authorize a reviewed prospective lineage path if existing genuine formal events cannot be supplied; every final authority gate still applies.',
      '- Scoped repository search and read-only database lookups are recorded. A matching SHA or an APPROVED string alone is not authentication; findings do not claim external governance systems were searched.','',
      '## Candidate summary','', '| Case | Publication date | Identity | Mapping receipts | Recommendation |','|---|---|---|---:|---|']
    for c in cases:lines.append('| '+c['caseId']+' | '+c['publicationEvidence']['date']+' | '+c['documentIdentity']['class']+' | '+str(c['financialMappingCoverage']['mappedObligations'])+' | DEFER |')
    lines += ['', 'Full original candidate, PEC-1 bundle, PEC-2 core, source and document hashes are in the JSON matrix and EVIDENCE_LEDGER.json. Component hashes identify proposal content only, never a future approved realized version.','']
    for c in cases:
        source=c['sourceIdentity'];doc=c['documentIdentity'];pub=c['publicationEvidence'];scope=c['exactApprovalScope'];facts=c['financialMappingCoverage']['facts']
        lines += ['## '+c['caseId'],'', '**Recommended source authority decision: DEFER.** '+c['recommendationReason'],'',
          '- Candidate ID: `'+c['candidateId']+'`','- Candidate body SHA-256: `'+c['candidateHash']+'`','- Publisher: '+c['publisherIdentity']['legalName'],
          '- Source identity: `'+source['url']+'`; raw capture `'+source['capture']['path']+'`; SHA-256 `'+source['capture']['sha256']+'`.',
          '- Exact document URL: `'+doc['url']+'`; raw PDF `'+doc['capture']['path']+'`; SHA-256 `'+doc['capture']['sha256']+'`.',
          '- Identity pages: '+', '.join(str(p) for p in c['publisherIdentity']['identityPages'])+'; identity class '+doc['class']+'. Open the pinned PDF at those physical pages; no live source request is required.',
          '- Publication: '+pub['date']+'; '+pub['precision']+'; timezone '+pub['timezone']+'; publishedAt=null. Derived next-local-day boundary: `'+pub['conservativeBoundary']+'` (not a publication timestamp).',
          '- Publication HTML locator: characters '+str(pub['locator']['start'])+'–'+str(pub['locator']['endExclusive'])+' (end exclusive), exact linked-anchor offset '+str(pub['locator']['linkedAnchorOffset'])+'. Date literal `'+pub['dateLiteral']+'` is in this retained range.',
          '- Exact source scope: '+c['ticker']+', '+c['reportingPeriod']['start']+' to '+c['reportingPeriod']['end']+', '+scope['consolidation']+', '+doc['documentType']+'. No other document bytes, revision, period or metric is included.',
          '- Financial mapping coverage: '+str(len(facts))+' obligation receipts / '+str(c['financialMappingCoverage']['sourceOperands'])+' source operands; authenticated human acceptance=0.','',
          '### Existing knowledge and missing events','', '| Boundary | Retained value | Meaning |','|---|---|---|']
        for field,value in c['knowledgeEvidence']['boundaries'].items():
            meaning='MISSING; actual event/list proof required' if value is None else 'Verified retained technical/policy boundary; do not substitute for another clock'
            lines.append('| '+field+' | '+('null' if value is None else str(value))+' | '+meaning+' |')
        lines += ['', 'Actual systemKnownAt: null. Actual decisionAsOf: null. Candidate ingestion `'+str(c['knowledgeEvidence']['candidateIngestionObservation']['id'])+'` is not FORMAL PDF ingestion.','', '### Financial fact scopes for reviewer sign-off','']
        if not facts:lines += ['No PE4 financial mappings for this annual document. Data Quality Owner must first name the intended annual metrics/dataset, review the recovered same-document historical leads below, and commission only missing mappings. This candidate does not solve current interim mapping gaps.','']
        else:
            lines += ['| Obligation | Metric | Exact fact period | Source statement/code, native amounts and PDF pages | Canonical value |','|---|---|---|---|---|']
            for m in facts:
                cells='; '.join(str(s['statement'])+'/'+s['rowCode']+' '+s['reportedValue']+' '+s['nativeUnit']+' (p'+str(s['physicalPage'])+')' for s in m['sourceCells'])
                lines.append('| '+str(m['obligationIndex'])+' | '+m['metric']+' | '+m['period']['start']+'–'+m['period']['end']+' | '+cells+' | '+m['canonicalValue']+' |')
            lines += ['', 'Native values and normalization formulas are copied from the exact pinned PE4 receipts, not newly inferred or converted. The JSON matrix preserves original captions, columns, cell IDs, boxes, raw values/units, exact per-cell pointers and assessment A–I gates. Stock and flow periods remain distinct.','']
        if c['recoveredRetainedEvidenceLeads']:
            lines += ['### Recovered retained evidence requiring scoped requalification','']
            for lead in c['recoveredRetainedEvidenceLeads']:
                r=lead['reference'];n=lead['retainedRecord']
                lines.append('- '+lead['kind']+': `'+r['path']+'#'+r['pointer']+'`; SHA-256 `'+r['sha256']+'`; node SHA-256 `'+r['nodeSha256']+'`. '+str(n.get('itemId',n.get('formula')))+'. '+lead['qualification'])
            lines += ['', 'No recovered record is newly accepted. Legacy source paths may have been intentionally deleted; exact current archived PDF bytes are pinned separately. Financial amounts, exclusions and missing publication clocks remain unchanged.','']
        lines += ['### Unresolved limitations','']+['- '+v for v in c['limitations']]
        lines += ['', 'Independent acceptance is **not currently satisfiable**. Minimum action: '+c['independentAcceptance']['minimumAction'],'',
          'Required owner action: '+c['requiredOwnerAction'],'', 'Consequences of later qualified approval: '+c['consequencesOfApproval'],'', 'Consequences of rejection: '+c['consequencesOfRejection'],'']
    lines += ['## Concrete coverage work outside these decisions','', 'The 216-obligation coverage has 45 PE4-reviewed mappings and 104 exact retained Vietstock matches with an overlap of 31. The sets cannot be added. Among the 171 outside PE4, 73 already have exact retained bytes and can enter an authorized evidence-qualification queue without new downloads; 98 lack an exact retained match and need acquisition/identity qualification or a separately reviewed replacement/version. Fourteen reviewed archive mappings (VJC/SSB interim) are not exact retained mirror matches. All coverage remains unaccepted for production.','', 'EVIDENCE_GAP_RESOLUTION.json contains the concrete 171-obligation work queue, retained file references and next action per metric/period. VNM obligation 185 has no comprehensive-debt canonical candidate; missing is not zero.','', 'No approval/admission, D2 activation, scoring, ranking, Top 10, source acquisition, frozen-policy modification or PEC-3 work is performed. Final status PARTIALLY_READY reflects a complete decision dossier with unresolved external governance/event prerequisites, not an approved source.']
    (OUT/'SOURCE_AUTHORITY_DECISION_PACKAGE.md').write_text('\n'.join(lines)+'\n')
    render_owner_actions(cases)
    render_blockers()


def render_owner_actions(cases):
    lines=['# PEC-1A — Owner action required','', '**Current recommendation for each full source authority: DEFER. No authenticated decision is recorded.**','',
      '## Actions that move the work forward','',
      '1. Assign named, authenticated Data Evidence Reviewer, Data Quality Owner/sector owner, lineage custodian, dataset owner and Independent Validator. Codex prepares evidence only. The validator must differ from the producer.',
      '2. Prioritize the six interim cases containing the current 45 receipts. Park HPG FY2025 and VJC FY2025 until an intended annual dataset/metric scope is explicitly defined; approving these identities does not close interim coverage.',
      '3. Have the evidence reviewer sign the pinned HTML/PDF identity/publication route for each case. Have source governance record separately scoped component decisions for the three immutable proposal sub-objects, with exact realized version hashes and actual approval/effectivity/knownAt evidence. None is full source authority or production admission.',
      '4. Have data quality accept/reject the exact financial receipts and perimeter choices. VRE/VJC/GAS borrowings can be considered only as the existing narrow reported carrying-value concept; GVR105 has the same comprehensive-debt restriction. SSB accounting populations cannot be reused as certified regulatory/NPL populations. First review the recovered same-hash NPL/LLR population bridge candidates at PDF pages 39/40 against obligations 45/46/47; their AVAILABLE flags do not certify acceptance. VNM total equity/net income captions must not silently become ordinary-share claims.',
      '5. Supply actual missing lineage/cutoff receipts. Existing candidate created_at, raw provider capture time, report date, PDF signature, Git time, current execution time or PE4 producer review time is not a substitute. If genuine historical events cannot be produced, decide whether to commission a separately reviewed prospective lineage/new-dataset workflow; that work authorization itself creates no formal clock and cannot bypass admission gates.',
      '6. Obtain authenticated independent acceptance against exact candidate/evidence/financial/knowledge scope after missing criteria close. Then record the final owner source authority decision. Source approval alone still does not perform PEC-2 admission, which requires its own event and current history/revocation.',
      '7. Separately authorize the 171-obligation coverage queue if desired: review 73 existing exact retained-document cases first, and obtain/qualify the other 98 through Vietstock only. Do not approve source replacements by amount equality or restore removed historical accounting artifacts.','',
      '## Required evidence of authentication','',
      'Use the established owner governance process: an authenticated subject/session/audit record or independently verified signed decision with authority to act as Investment System Owner. Retain its exact immutable reference and bytes/hash plus verification evidence. A locally filled JSON field, generic approve-all message, checksum, recommendation or Codex-written file is not authentication. No new authentication provider or approval-intake endpoint is installed by this package.','',
      'For an approval/restricted approval, the record must bind original candidate ID/hash, source/document hashes, reviewed component and realized version hashes, exact dataset/fact scopes, actual decision time, actual approval/knowledge events, prospective effective interval/evidence validity, restrictions and required reviewer acceptance references. Do not edit sealed proposals to fill their null fields or rubber-stamp an unknown future hash.','',
      'DEFER and REJECT can be recorded now if authentically issued; approval must wait for mandatory qualification. An owner may separately authorize evidence preparation/component review; record that as a distinct work/governance decision, not full source approval.','']
    for c in cases:
        lines += ['## Decision request — '+c['caseId'],'',
          '- Candidate ID: `'+c['candidateId']+'`','- Candidate body hash: `'+c['candidateHash']+'`','- Original PEC-1 evidence bundle hash: `'+c['evidenceHashes']['originalPEC1EvidenceBundleHash']+'`','- Current PEC-2 core hash: `'+c['evidenceHashes']['PEC2EvidenceCoreHash']+'`',
          '- Exact scope: '+c['ticker']+'; '+c['reportingPeriod']['start']+'–'+c['reportingPeriod']['end']+'; '+c['exactApprovalScope']['consolidation']+'; '+c['documentIdentity']['documentType']+'; exact HTML/PDF hashes and only the fact scopes in the matrix.','- Recommendation: **DEFER**.','- Blocking gates: G3 publisher authority, G5 mapping acceptance, G6 knowledge/cutoffs, G7 independent acceptance, G8 authenticated owner decision.','']
        for name,component in c['exactApprovalScope']['sourceComponents'].items():lines.append('- '+name+' proposal content hash: `'+component['proposalContentHash']+'` (not an approved realized contract).')
        lines += ['', 'Owner response fields (unfilled request, not a decision record):','',
          '- Decision: choose APPROVE / APPROVE_WITH_RESTRICTIONS / DEFER / REJECT.',
          '- Authenticated owner identity/authority and verification reference: **not supplied**.',
          '- Immutable owner decision source/audit reference and digest: **not supplied**.',
          '- Actual decision time / knownAt / effective interval / evidence validity: **not supplied**.',
          '- Exact approved realized component/version hashes and reviewer references: **not supplied**.',
          '- Explicit restrictions and any excluded fact scopes: **not supplied**.',
          '- Separate prospective evidence work authorization, if chosen: record independently; never count as ingestion, approval or admission.',
          '- Full approval is not executable until missing mandatory gates close; any later source decision still grants no automatic source admission or scoring.','']
    (OUT/'OWNER_ACTION_REQUIRED.md').write_text('\n'.join(lines)+'\n')


def render_blockers():
    rows=[
      ('PE3_EXACT_SOURCE_AUTHORITY','Technical identity/publication route already qualified for eight exact archived sources. Authenticated authority is not technically self-producible.','Investment System Owner and source/methodology governance owner.','Exact component/final owner receipts, authority verification, actual knownAt/effectivity/validity and realized version hashes. No new public web download needed for these eight dossiers.','Review and sign the exact component hashes without changing sealed proposals; close mapping/knowledge/independent prerequisites and then issue the final scope-bound authority decision. Keep every effective admission blocked.'),
      ('PE3_FORMAL_KNOWLEDGE','A legitimate prospective lineage workflow is technically possible, but no genuine historical formal events exist in the checked formal tables.','Lineage custodian; mapping, registry and methodology owners; owner authorization for any new workflow.','Genuine ingestedAt, mappingKnownAt, methodologyKnownAt, registryKnownAt, sourceContractKnownAt, identityMethodKnownAt, sourceMethodKnownAt and explicit other-boundary event/list proofs.','Supply actual existing event records if available outside this repository. Otherwise commission and review a prospective non-activated lineage/new-dataset path. Do not relabel candidate created_at or producer reviewedAt as formal knowledge; do not create circular source-approval/ingestion shortcuts.'),
      ('PE3_ACTUAL_DATASET_CUTOFFS','A real dataset version/cutoff receipt can be authored by the accountable dataset owner; no historical cutoff can be inferred.','Dataset/analysis owner.','Exact actual systemKnownAt and decisionAsOf with dataset/version identity and immutable audit reference.','Declare the intended analysis dataset and actual cutoffs only after authentic event inventory is known. Validate max(all required boundaries) <= systemKnownAt <= decisionAsOf. If past availability cannot be proved, keep historical admission unavailable and use a separately authorized new prospective dataset.'),
      ('PE3_ECONOMIC_PERIMETER_LIMITATIONS','Technical source cells/amounts for six limited mappings are resolved; the semantic/population acceptance is not. GVR105 is an additional comprehensive-debt limitation, not a seventh original limited mapping.','Data Quality Owner / sector accounting-methodology owner plus Independent Validator.','Authenticated narrow-perimeter decisions, or original issuer-specific debt-completeness/regulatory-population bridge evidence if broader metrics are required. Existing generic debt/CASA policy approvals are insufficient.','VRE145, VJC97 and GAS213: decide only narrow reported carrying borrowings/recognized financing leases under the existing debt contract, or obtain completeness evidence. GVR105 retains COMPREHENSIVE_UNVERIFIED. SSB45/46/47: review the retained same-document NPL/LLR bridges on pages39/40 first, verify populations/stock basis/exclusions, and sign or reject their exact compatibility. Request additional audited bridge evidence only if retained records cannot establish the required unchanged definitions. Do not change frozen definitions to fit amounts.'),
      ('PE3_INDEPENDENT_ACCEPTANCE_AND_D2_ACTIVATION','The 45 technical assessments are reviewable; authenticated independent acceptance is externally controlled. D2 activation remains a distinct unexecuted decision.','Independent Validator, then Investment System Owner; runtime owner only in separately authorized activation scope.','Authenticated independent acceptance bound to exact authority, mappings, perimeter, clocks and actual cutoffs; separate activation authorization is absent.','Close A/F/G/H/I for each relevant PE4 assessment; B/C/D/E technical PASS is already retained. The validator must not be the producer. Retain D2 policy approval as policy only and do not bundle acceptance with activation.'),
      ('MINIMUM_DATASET_OUTSIDE_PE4_REVIEW_SCOPE','73 of the 171 outside-scope obligations already have exact retained Vietstock bytes. Another 98 have no exact retained match. VNM185 lacks a canonical comprehensive-debt candidate.','Owner-authorized source-evidence workstream plus Data Quality Owner and Independent Validator.','For 73: document/publication and financial mapping qualification, not necessarily new PDFs. For 98: Vietstock-only exact acquisition/identity evidence or an explicitly reviewed replacement/version. All still require governance/lineage/acceptance.','Use the 171-item JSON queue. Start with 73 retained-byte cases, request external exact source evidence for 98, and resolve missing VNM185 from admissible source evidence without inventing zero. Do not silently replace sources or count overlapping 45/104 coverage sets additively.')]
    lines=['# PEC-1A — Escalated blocker resolution','',
      'This is a concrete evidence/work authorization plan, not another generic implementation review. All six blockers remain ESCALATED until their own acceptance conditions are met. The inherited root-cause review count of five is preserved; no new independent human review is fabricated. No existing escalation register/seal is modified.','']
    for id,technical,owner,missing,action in rows:
        lines += ['## '+id,'','- Technical resolution: '+technical,'- Accountable role / authorization: '+owner,'- Missing external-to-repository evidence: '+missing,'- Concrete next action: '+action,'- Current disposition: **ESCALATED — BLOCKING**. No evidence is marked accepted by this work.','']
    lines += ['## Ordering and stop conditions','',
      'Evidence reviewer source/publisher qualification, financial scope/perimeter acceptance, genuine lineage and actual cutoff decisions, independent validation and final owner source authority are separately recorded. Component governance/work authorization is not the final authority decision, and a work order is not a formal ingestion event. If the existing formal lineage prerequisites cannot be produced without a new authorized workflow, keep the candidate deferred and request that distinct workflow decision. Never synthesize old dates to make the chain appear closed.','',
      'No public external fetch is executed. All future financial PDF discovery/acquisition must use finance.vietstock.vn or static2.vietstock.vn with redirect validation, and must preserve source variants. Archived issuer captures remain read-only audit/qualification evidence, not authorization for new issuer collection or current Vietstock coverage.','',
      'Stop after PEC-1A. Source authority, production admission, D2/runtime activation and scoring remain separate and blocked. PEC-3 is not started.']
    (OUT/'ESCALATED_BLOCKER_RESOLUTION.md').write_text('\n'.join(lines)+'\n')

if __name__=='__main__':main()
