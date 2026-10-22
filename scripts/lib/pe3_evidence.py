"""Read-only deterministic PE3 evidence validation; no admission or transport API."""
from decimal import Decimal
from pathlib import Path
from lib.pe2_evidence import load,content_hash,file_hash,boundary,verify_receipt,knowledge_assessment

def validate_mapping(m,f,cells,b):
    if m['canonicalFactHash']!=content_hash(f['raw']) or m['canonicalValuePreserved']!=f['value'] or m['canonicalConcept']!=f['concept'] or m['canonicalPointer']!=f['canonicalPointer']:raise ValueError('CANONICAL_SUBSTITUTION')
    if m['period']!=f['raw']['period'] or m['scope']!='CONSOLIDATED':raise ValueError('PERIOD_SCOPE')
    if m['sourceCells']!=cells:raise ValueError('SOURCE_CELL_SUBSTITUTION')
    if m['disclosureId']!=b['disclosureId'] or any(c['documentSha256']!=f['sourceHash'] or c['pdfPath']!=b['documentPath'] or c['scope']!='CONSOLIDATED' for c in cells):raise ValueError('DOCUMENT_IDENTITY')
    ids=[c['cellId'] for c in cells]
    if len(set(ids))!=len(ids):raise ValueError('DUPLICATE_CELL_ID')
    factor='1000000' if f['ticker'] in ['VRE','SSB'] else '1';unit='MILLION_VND' if factor=='1000000' else 'VND'
    if m['normalization']['factor']!=factor or any(c['nativeUnit']!=unit for c in cells):raise ValueError('UNIT_FACTOR')
    sign='NEGATE_NONPOSITIVE' if f['concept']=='CASH_CAPEX_REPORTED' else 'PRESERVE'
    n=m['normalization'];values=[Decimal(c['reportedValue']) for c in cells]
    if n['signConvention']!=sign or (sign=='NEGATE_NONPOSITIVE' and any(v>0 for v in values)):raise ValueError('SIGN')
    actual=sum(values)*Decimal(factor)*(-1 if sign=='NEGATE_NONPOSITIVE' else 1)
    if str(actual)!=f['value'] or n['calculatedValue']!=str(actual) or n['matchesCanonical'] is not True:raise ValueError('NORMALIZATION')
    if m['classification']=='VERIFIED' and (m['limitations'] or not all(c['box'] and c['exactDigitOCRMatch'] for c in cells)):raise ValueError('UNREPRODUCIBLE_VERIFICATION')
    if m['obligationIndex']==105 and m['classification']!='PENDING_EVIDENCE':raise ValueError('UNRESOLVED_DIGIT_CONFLICT')
    return True

def replay(root,package):
    root=Path(root);p=Path(package)
    if (p/'EVIDENCE_SEAL.json').exists():
        seal=load(p/'EVIDENCE_SEAL.json');assert file_hash(p/'ARTIFACT_HASHES.json')==seal['artifactHashesSha256'],'PE3 inventory replacement'
        inventory=load(p/'ARTIFACT_HASHES.json')
        for path,h in inventory['files'].items():assert file_hash(p/path)==h,'PE3 file replacement: '+path
        for path,h in inventory['codePins'].items():assert file_hash(root/path)==h,'PE3 script replacement: '+path
    pe2=p.parent/'2026-10-22-primary-publication-evidence-pe2';seal=load(pe2/'EVIDENCE_SEAL.json');assert file_hash(pe2/'ARTIFACT_HASHES.json')==seal['artifactHashesSha256'];files=load(pe2/'ARTIFACT_HASHES.json')['files']
    for path,h in files.items():assert file_hash(pe2/path)==h,path
    bindings=load(pe2/'SOURCE_BINDING_CANDIDATES.json')['candidates'];expected=load(pe2/'EXPECTED_BINDINGS.json')
    # The PE2 expected file schema is a keyed disclosure set.
    if isinstance(expected,dict):expected=expected.get('bindings',expected.get('disclosures',expected))
    pe2results=[]
    for r in bindings:
        e=expected[r['body']['disclosureId']] if isinstance(expected,dict) else next(x for x in expected if x['disclosureId']==r['body']['disclosureId'])
        pe2results.append(verify_receipt(root,r,e))
    inputs=load(p/'CANONICAL_OBLIGATION_INPUTS.json');mapping=load(p/'SOURCE_CELL_MAPPING_REVIEW.json')['mappings'];ledger=load(p/'SOURCE_CELL_TRANSCRIPTION.json')['obligationCells'];auth=load(p/'AUTHORITY_APPROVAL_CANDIDATES.json')['candidates'];knowledge=load(p/'KNOWLEDGE_EVIDENCE_RECONSTRUCTION.json')['records'];receipts=load(p/'IMMUTABLE_MAPPING_RECEIPTS.json')['receipts']
    assert len(inputs)==len(mapping)==len(receipts)==45 and len(auth)==len(knowledge)==8
    assert len({m['obligationIndex'] for m in mapping})==45
    for a in auth:
        assert content_hash(a['body'])==a['sha256'] and a['candidateId']=='pe3-authority-sha256:'+a['sha256']
        assert a['body']['approvalReference'] is None and a['body']['knownAt'] is None
    for m in mapping:
        f=next(x for x in inputs if x['obligationIndex']==m['obligationIndex']);b=next(x['body'] for x in bindings if x['body']['disclosureId']==m['disclosureId']);cells=[c for c in ledger if c['obligationIndex']==m['obligationIndex']]
        validate_mapping(m,f,cells,b)
        for c in cells:assert file_hash(root/c['pdfPath'])==c['documentSha256']
        receipt=next(x for x in receipts if x['body']['obligationIndex']==m['obligationIndex']);r=receipt['body'];assert content_hash(r)==receipt['sha256'] and receipt['receiptId']=='pe3-mapping-sha256:'+receipt['sha256']
        a=next(x for x in auth if x['body']['disclosureId']==m['disclosureId']);k=next(x for x in knowledge if x['disclosureId']==m['disclosureId']);pe2r=next(x for x in bindings if x['body']['disclosureId']==m['disclosureId'])
        assert r['authorityCandidateSha256']==a['sha256'] and r['knowledgeSha256']==content_hash(k) and r['sourceCellMappingSha256']==content_hash(m) and r['normalizationSha256']==content_hash(m['normalization']) and r['canonicalFactSha256']==content_hash(f['raw']) and r['sourcePublicationReceiptHash']==pe2r['contentHash']
        assert r['documentSha256']==b['documentSha256'] and r['D2PolicyHash']==b['policyHash'] and r['D2ImplementationHash']==b['implementationHash']
        assert not r['independentlyAccepted'] and not r['formallyAdmitted']
        assert k['boundaries']==b['knowledge'] and k['effectiveKnownAt'] is None and k['systemKnownAt'] is None and k['decisionAsOf'] is None
        assert not knowledge_assessment(k['boundaries'],b['cutoff'],b['period']['end'],b['authorities'])['asKnownEligible']
        assert b['publicationBoundary']==boundary(b['publicationDate'])
    for c in load(p/'FINANCIAL_RECONCILIATION.json')['checks']:
        assert str(sum(Decimal(v) for v in c['nativeOperands']))==c['calculated'] and Decimal(c['calculated'])==Decimal(c['expected'])
    return {'status':'PASS_PRODUCER_ENGINEERING_REPLAY_ONLY','PE2SealedFiles':len(files),'PE2BindingsVerified':len(pe2results),'authorityCandidateBundles':len(auth),'mappingReceipts':len(receipts),'classifications':{c:sum(m['classification']==c for m in mapping) for c in ['VERIFIED','VERIFIED_WITH_LIMITATIONS','PENDING_EVIDENCE']},'completeKnowledgeChains':0,'AS_KNOWNEligible':0,'independentlyAccepted':0,'formallyAdmitted':0}
