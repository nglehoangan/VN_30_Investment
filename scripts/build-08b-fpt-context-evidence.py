"""Source-bound FPT rubric evidence and labeled valuation assumptions, without scores."""
import base64, datetime, hashlib, json, pathlib, runpy

B = pathlib.Path('data/initialization-08b-remediation-work')
R = runpy.run_path('scripts/reconcile-08b-extraction.py')
annual = '5d9260dace57a7a3e5928e9d247c878d7667786fffeb2d7ace87aa7a9bca082f'
current = '45636554f28c7e6c2f38458b9a22410ed1f67e80627d672b827019a67f299df8'
packet = json.loads((B / 'execution-preview.json').read_text())
matrix = packet['requirementsMatrix']
identity = next(r for r in packet['readiness'] if r['ticker'] == 'FPT')
reviewed = datetime.datetime.now(datetime.timezone.utc).isoformat()

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def proof(body, page, anchors):
    file = B / 'ocr' / f'{body}-p{page}.json'
    render = file.with_suffix('.png')
    p = json.loads(file.read_text())
    assert p['bodyHash'] == body and p['page'] == page
    assert p['engineA'] != p['engineB'] and p['renderSha256'] == sha(render)
    assert sha(B / (body + '.pdf')) == body
    texts = [R['compact'](R['full_text'](p, key)) for key in ['passA', 'passB']]
    assert all(all(R['compact'](a) in text for a in anchors) for text in texts), (page, anchors)
    document = next(q for q in packet['documentQualificationCandidates'] if q['bodyHash'] == body)
    binding = next((x for x in packet['livePublicDisclosureBindings'] if x['bodyHash'] == body), None)
    rawProof = {}
    if binding is None:
        # Annual-report rubric evidence does not require accounting-cell admission.
        # Establish its own complete actual public response; never invent a fact.
        receiptFile = B / 'fpt-annual2025-recovery.json'
        receipt = json.loads(receiptFile.read_text())
        source = next(d for d in receipt['documents'] if d['bodyHash']==body)
        envelopes = [json.loads(next(c for c in receipt['captures'] if c['id']==cid)['payload']) for cid in source['captureIds']]
        assert all(e['url']==source['originalPublicUrl'] and 200<=e['httpStatus']<300 and e['error'] is None and e['bodyComplete'] and e['bodySha256']==body for e in envelopes)
        envelopes.sort(key=lambda e:e['chunkIndex'])
        assert [e['chunkIndex'] for e in envelopes]==list(range(len(envelopes)))
        assert all(e['chunkCount']==len(envelopes) for e in envelopes)
        assert hashlib.sha256(b''.join(base64.b64decode(e['bytes'],validate=True) for e in envelopes)).hexdigest()==body
        binding={'documentUrl':source['originalPublicUrl'],'retrievedAt':source['retrievedAt']}
        rawProof={'sourceReceiptFile':str(receiptFile),'sourceReceiptSha256':sha(receiptFile),'accountingQualificationRequiredForRubric':False}
    return {
        'documentId': document['documentId'], 'bodyHash': body, 'page': page, **rawProof,
        'url': binding['documentUrl'], 'actualRetrievedAt': binding['retrievedAt'],
        'sourcePageFile': str(file), 'sourcePageSha256': sha(file),
        'renderSha256': sha(render), 'exactAnchorsInBothReaders': anchors,
        'extractionMethod': p['engineA'], 'verificationMethod': p['engineB'],
        'initialLiveKnownAt': reviewed, 'historicalAvailabilityAsserted': False,
    }

definitions = [
    ('BQ-MOAT-01', [
        (53, ['lợi thế kết nối hệ sinh thái công nghệ toàn cầu']),
        (61, ['Top 40', '1.100+', '130+', 'nâng cao năng suất lao động 8,2%']),
        (48, ['AI', 'AgentOps']),
    ], 'The issuer describes global delivery reach, enterprise customers and reusable AI tooling. These are concrete scale/know-how observations. They are issuer claims; durable switching costs, pricing power and through-cycle excess returns remain to be corroborated. AI disruption is retained as counter-evidence, rather than treating AI narrative as a moat score.',
     ['THROUGH_CYCLE_RETURN_CORROBORATION', 'CUSTOMER_RETENTION_AND_SWITCHING_COST_EVIDENCE']),
    ('RG-GOV-01', [
        (89, ['ba thành viên độc lập']),
        (91, ['không có bất cứ vi phạm nào']),
        (92, ['Quyền của cổ đông']),
        (94, ['Hợp đồng hoặc giao dịch với cổ đông nội bộ']),
        (164, ['Vấn đề cần nhấn mạnh', 'Viễn thông FPT']),
    ], 'The annual report discloses independent directors, shareholder rights, related-party contracts and an issuer assertion about disclosure compliance. The auditor emphasis concerning FTEL is material governance/reporting context. The compliance assertion is not independently established absence of sanctions. Related-party approval wording does not establish arm\'s-length pricing or fair minority treatment.',
     ['INDEPENDENT_REGULATORY_SANCTION_CONTEXT', 'RELATED_PARTY_TERMS_AND_MINORITY_TREATMENT_REVIEW']),
    ('RG-GOV-02', [
        (163, ['BÁO CÁO KIỂM TOÁN ĐỘC LẬP']),
        (164, ['Vấn đề cần nhấn mạnh', 'Viễn thông FPT', 'phản ánh trung thực']),
        (55, ['phương pháp vốn chủ sở hữu']),
    ], 'The full audit opinion and emphasis are available as source evidence. FTEL is consolidated through 2025 but equity-accounted from 2026. Reported annual 2025 and interim 2026 totals cannot be joined mechanically for TTM or trend underwriting. Audit availability does not by itself establish complete accounting reliability or resolve the comparable-basis operands.',
     ['CURRENT_INTERIM_REVIEW_CONCLUSION', 'COMPARABLE_BASIS_TTM_AND_MULTIYEAR_RECONCILIATION']),
]
packages = []
for metric, pages, rationale, missing in definitions:
    authority = next(m['authority'] for m in matrix['metrics'] if m['metricId'] == metric)
    packages.append({
        'id': 'slice08b-FPT-' + metric + '-annual2025',
        'ticker': 'FPT', 'securityId': identity['securityId'], 'metricId': metric,
        'evidenceKind': 'QUALITATIVE_EVIDENCE', 'sourceAsOf': '2025-12-31',
        'reviewedAt': reviewed, 'reviewer': 'CODEX_DATA_PRODUCER_MACHINE_REVIEW',
        'rubricAuthority': authority, 'evidence': [proof(annual, p, a) for p, a in pages],
        'reviewerRationale': rationale, 'confidence': 'MEDIUM',
        'confidenceMeaning': 'SOURCE_IDENTIFICATION_AND_RUBRIC_RELEVANCE; NOT_INVESTMENT_CONFIDENCE',
        'coverageStatus': 'PARTIAL_RUBRIC_EVIDENCE', 'remainingRequiredContext': missing,
        'score': None, 'governanceStatus': 'REVIEW_CANDIDATE', 'approvalReference': None,
    })

comparability = {
    'ticker': 'FPT', 'securityId': identity['securityId'], 'status': 'SOURCE_SUPPORTED_COMPARABILITY_BREAK',
    'knownAt': reviewed, 'effectiveFrom': '2026-01-01',
    'evidence': [proof(annual, 55, ['phương pháp vốn chủ sở hữu']),
                 proof(current, 17, ['phương pháp vốn chủ sở hữu', 'FTEL', '01 tháng 01 năm 2026']),
                 proof(current, 18, ['Số liệu không hợp nhất', 'FTEL', '01/01/2025', '30/06/2025'])],
    'rule': 'NO_TTM_OR_GROWTH_COMBINATION_ACROSS_FTEL_CONSOLIDATED_AND_EQUITY_ACCOUNTED_BASES_WITHOUT_EXPLICIT_COMPARABLE_OPERAND_EVIDENCE',
    'originalFactsRetained': True, 'genericRestatementWinnerAsserted': False,
    'governanceStatus': 'REVIEW_CANDIDATE', 'approvalReference': None,
}

webfile = B / 'input-sources/FPT-vietcap-june-web-receipt.json'
web = json.loads(webfile.read_text())
assert web['sourceAuthority'] == 'ESTABLISHED_ANALYST_PUBLIC_SUMMARY'
assert web['rawHttpResponseRetained'] is False
text = web['result']
assert isinstance(text, str)
assumptions = [
    ('ANALYST_TARGET_VALUE_PER_SHARE', '90300', 'VND_PER_SHARE', 'VND90,300/share', 'MID_2027'),
    ('ANALYST_NPAT_MI_CAGR', '0.17', 'RATIO', '17% NPAT-MI CAGR', '2025_TO_2028_FORECAST'),
    ('GLOBAL_IT_TARGET_PE', '17', 'MULTIPLE', '17.0x', 'MID_2027_SEGMENT_VALUATION'),
    ('DOMESTIC_IT_TARGET_PE', '13.6', 'MULTIPLE', '13.6x', 'MID_2027_SEGMENT_VALUATION'),
    ('EDUCATION_TARGET_PE', '11.4', 'MULTIPLE', '11.4x', 'MID_2027_SEGMENT_VALUATION'),
]
valuation = []
for item, value, unit, anchor, horizon in assumptions:
    assert anchor in text, anchor
    valuation.append({
        'ticker': 'FPT', 'securityId': identity['securityId'], 'inputId': item,
        'inputKind': 'ESTIMATE', 'reportedAccountingFact': False, 'value': value,
        'unit': unit, 'estimateDate': '2026-06-05', 'horizon': horizon,
        'sourceUrl': web['url'], 'sourceReceiptFile': str(webfile), 'sourceReceiptSha256': sha(webfile),
        'sourceMethod': web['method'], 'sourceAnchor': anchor, 'reviewedAt': reviewed,
        'reviewer': 'CODEX_DATA_PRODUCER_MACHINE_REVIEW', 'confidence': 'MEDIUM',
        'freshnessStatus': 'UNKNOWN', 'workflowValidUntil': None,
        'latestEstimateVersionVerified': False, 'governanceStatus': 'REVIEW_CANDIDATE',
        'approvalReference': None, 'investmentDecisionExecuted': False,
    })

for name, data in [('fpt-qualitative-evidence.json', packages),
                   ('fpt-comparability-evidence.json', comparability),
                   ('fpt-valuation-inputs.json', valuation)]:
    (B / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'qualitativePackages': len(packages), 'valuationEstimates': len(valuation),
                  'sourceSupportedComparabilityBreaks': 1, 'scoresExecuted': 0}))
