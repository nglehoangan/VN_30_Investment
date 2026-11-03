"""Versioned, limited VIC reported-data acceptance; no production/scoring authority."""
import csv,hashlib,json
from collections import Counter,defaultdict
from pathlib import Path
from decimal import Decimal
from lib.vic_owner_report import replay_eps,closing_common,segment_bridge
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance'
OUT=BASE/'2026-11-03/vic-reported-data-acceptance-v1'
GOV=ROOT/'docs/fundamental-data-engine/governance'
ACCEPTANCE_ID='VIC-REPORTED-DATA-ACCEPTANCE-2026-11-03-v1'
SOURCES=[('2026-11-02/earnings-normalization-v3/checked-readings.json','readings'),
 ('2026-11-03/vic-parent-bridge-v1/checked-evidence.json','rows'),
 ('2026-11-03/vic-tax-attribution-v1/checked-tax-readings.json','rows'),
 ('2026-11-03/vic-owner-report-closure-v1/checked-evidence.json','rows'),
 ('2026-11-03/vic-rnav-v1/checked-evidence.json','rows')]
ACCEPTED={'ACCEPTED_REPORTED_READING','ACCEPTED_MANAGEMENT_DISCLOSURE_READING'}
PURPOSES={'READ_REPORTED_FINANCIAL_DATA','ANALYZE_REPORTED_FINANCIALS','RECONCILE_REPORTED_ACCOUNTING'}


def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def dump(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def rel(p):return str(p.relative_to(ROOT))

def verify_retained_reading_pin(path):
    manifest=load(path.parent/'manifest.json')
    expected=manifest.get('pins',manifest.get('inputPins',{})).get(rel(path))
    if path.name=='checked-readings.json':expected=manifest.get('checkedReadingsSha256')
    if not expected or sha(path)!=expected:raise ValueError('RETAINED_CHECKED_EVIDENCE_PIN_REQUIRED')

def normalize(row,path,array,index):
    s=row.get('source') or dict(pdfPath=row['pdfPath'],sha256=row['pdfSha256'],physicalPage=row['physicalPage'],href=row.get('href'))
    review=row.get('review') or dict(fullPageImageInspected=row.get('fullPageImageInspected'),mode='RETAINED_OWNER_AUTHORIZED_AI_SELF_REVIEW')
    pdf=s['pdfPath']
    if '/VIC/' not in pdf or 'owner-vinfast' in pdf or not pdf.endswith('.pdf'):
        raise ValueError('ONLY_VIC_ISSUED_PDF_READING_ALLOWED')
    if sha(ROOT/pdf)!=s['sha256']:raise ValueError('SOURCE_BYTES_CHANGED')
    if not review.get('fullPageImageInspected') or not isinstance(s['physicalPage'],int) or s['physicalPage']<1:
        raise ValueError('CHECKED_PHYSICAL_PAGE_REQUIRED')
    period=row.get('economicPeriod',row.get('period',row.get('reportPeriod')))
    if not period:raise ValueError('EXPLICIT_PERIOD_REQUIRED')
    if row.get('productionAdmissible') is not False:raise ValueError('NO_IMPLICIT_PRODUCTION_PROMOTION')
    values=row['values'] if 'values' in row else {row['key']:row['lexicalValue']}
    unit=row.get('declaredUnit',row.get('unit'))
    if not unit:raise ValueError('DECLARED_UNIT_REQUIRED')
    scope=row.get('sourceScope',row.get('scope'))
    if scope is None:scope='MANAGEMENT_SUBSCOPE_AS_CAPTIONED' if row['id'].startswith('VIC-RNAV-AR-') else 'PROJECT_DISCLOSURE' if row['id']=='VIC-RNAV-HALONG' else 'VIC_CONSOLIDATED'
    management=('/2026-11-03-rnav/' in pdf or '/2026-11-03-normalization/' in pdf)
    status='ACCEPTED_MANAGEMENT_DISCLOSURE_READING' if management else 'ACCEPTED_REPORTED_READING'
    if row['id']=='VIC-RNAV-AR-CAPTION':status='PENDING_CAPTION_RECONCILIATION'
    role='FY2025_CONSOLIDATED_PRIMARY'
    if management:role='DATED_MANAGEMENT_OR_CORPORATE_DISCLOSURE_REFERENCE'
    elif 'Congtyme' in pdf:role='STANDALONE_PARENT_REFERENCE'
    elif period!='FY2025':role='DATED_COMPARATIVE_OR_INTERIM_REFERENCE'
    numeric={};unknown=[];narrative=[]
    for key,value in values.items():
        if value is None:unknown.append(key);continue
        if isinstance(value,str):
            try:
                n=Decimal(value)
                if not n.is_finite():raise ValueError('NONFINITE_REPORTED_VALUE')
                numeric[key]=value;continue
            except ArithmeticError:pass
        narrative.append(key)
    return dict(id=row['id'],status=status,scopeRole=role,economicPeriod=period,sourceScope=scope,
      declaredUnit=unit,values=values,numericStringsPreserved=numeric,unknownValueFields=unknown,
      narrativeOrReviewMetadataFields=narrative,unknownValuesConvertedToZero=False,
      source=s,review=review,evidenceArtifact=rel(path),evidenceArtifactSha256=sha(path),
      evidenceJsonPointer='/'+array+'/'+str(index),
      interpretation=row.get('interpretation',row.get('note',row.get('caption'))),
      permittedUse=sorted(PURPOSES) if status in ACCEPTED else [],
      qualifiesNormalizedCommonEarnings=False,qualifiesIntrinsicValue=False,productionAdmissible=False)


def collect():
    rows=[]
    for name,array in SOURCES:
        p=BASE/name
        verify_retained_reading_pin(p)
        for i,r in enumerate(load(p)[array]):
            if not r['id'].startswith('VIC-') and not r['id'].startswith(('VIC24-','VIC25-','VIC26-')):continue
            rows.append(normalize(r,p,array,i))
    if len({r['id'] for r in rows})!=len(rows):raise ValueError('DUPLICATE_EVIDENCE_RECORD_ID')
    return rows


def require_use(snapshot,record_id,purpose,*,period,scope):
    if snapshot['acceptanceId']!=ACCEPTANCE_ID or snapshot['decision']!='ACCEPTED_FOR_SCOPED_REPORTED_FINANCIAL_ANALYSIS':
        raise ValueError('ACTIVE_SCOPED_REPORTED_ACCEPTANCE_REQUIRED')
    row=next((r for r in snapshot['records'] if r['id']==record_id),None)
    if not row or row['status'] not in ACCEPTED or purpose not in PURPOSES:
        raise ValueError('REPORTED_ANALYSIS_ONLY_NO_VALUATION_OR_SCORING_AUTHORITY')
    if period!=row['economicPeriod'] or scope!=row['sourceScope']:raise ValueError('EXACT_PERIOD_SCOPE_BINDING_REQUIRED')
    s=row['source']
    if sha(ROOT/s['pdfPath'])!=s['sha256'] or sha(ROOT/row['evidenceArtifact'])!=row['evidenceArtifactSha256']:
        raise ValueError('ACCEPTED_EVIDENCE_DRIFT')
    return row


def bridges(rows):
    r={x['id']:x['values'] for x in rows};p=r['VIC-G25-PNL'];eps=r['VIC25-EPS'];debt=r['VIC-RNAV-DEBT'];equity=r['VIC-RNAV-EQUITY'];vre=r['VIC-RNAV-ASSOCIATES']
    if Decimal(p['pbt'])-Decimal(p['currentTax'])-Decimal(p['deferredTaxExpense'])!=Decimal(p['groupNpat']):raise ValueError('REPORTED_TAX_PNL_IDENTITY_REQUIRED')
    if Decimal(p['commonParentNpat'])+Decimal(p['nciResult'])!=Decimal(p['groupNpat']):raise ValueError('REPORTED_PARENT_NCI_IDENTITY_REQUIRED')
    return dict(reportedPnlTaxAndParentNciIdentity='PASS',reportedEpsReplay=replay_eps(eps),
      closingExternalCommonShares=closing_common(r['VIC25-SHARES']),segmentReplay=segment_bridge(r['VIC25-SEGMENTS']),
      reportedBorrowingsMillionVnd=str(sum(Decimal(debt[k]) for k in ['shortLoansLeases','longLoansLeases','longExchangeBonds'])),
      parentBookEquityMillionVnd=str(Decimal(equity['groupEquity'])-Decimal(equity['nciBook'])),
      vreReportedGrossRevaluationMillionVnd=str(Decimal(vre['vreHeldStakeFair'])-Decimal(vre['vreBook'])),
      allBridgesAreReportedArithmeticNotIntrinsicValuation=True)


def inventory(rows):
    pages=defaultdict(set)
    for r in rows:
        if r['status'] in ACCEPTED:pages[r['source']['pdfPath']].add(r['source']['physicalPage'])
    metadata={}
    for d in load(ROOT/'data/manual-extracted-pdf/notes/VIC.json')['documents']:
        for p in d['pdfPaths']:metadata[p]=(d['sourceHash'],d['pageCount'])
    result=[]
    for p in sorted((ROOT/'data/manual-download/VIC').rglob('*.pdf')):
        path=rel(p);h=sha(p);count=None
        if path in metadata and metadata[path][0]==h:count=metadata[path][1]
        if path.endswith('/540899.pdf'):count=168
        if path.endswith('/521784.pdf'):count=2
        result.append(dict(pdfPath=path,sha256=h,pageCountFromRetainedInventory=count,
          acceptedReadingPages=sorted(pages[path]),
          pagesWithoutAcceptedReadingRegistration=sorted(set(range(1,count+1))-pages[path]) if count else None,
          documentStatus='OUT_OF_SCOPE_NON_VIC_ISSUER' if 'owner-vinfast' in path else 'PARTIAL_REGISTERED_READINGS_ONLY' if pages[path] else 'NO_READINGS_ACCEPTED_IN_THIS_DECISION',
          completeReportAccepted=False,
          coverageMeaning='A registered page covers only listed values/captions, not every cell. Pages without a registration are not asserted never visually inspected.'))
    return result


def build():
    OUT.mkdir(exist_ok=True)
    rows=collect();b=bridges(rows);counts=Counter(r['status'] for r in rows)
    d=dict(contract='vic-reported-financial-analysis-acceptance-v1',acceptanceId=ACCEPTANCE_ID,
      decisionDate='2026-11-03',exactDecisionTime=None,ticker='VIC',
      decision='ACCEPTED_FOR_SCOPED_REPORTED_FINANCIAL_ANALYSIS',
      decisionVietnamese='NGHIỆM THU CÓ GIỚI HẠN: CÁC BẢN ĐỌC SỐ LIỆU ĐÃ ĐĂNG KÝ ĐỂ PHÂN TÍCH BÁO CÁO VIC',
      authorityBasis='Explicit owner instruction to finalize reported-data scope and unified acceptance decision',
      reviewMode='OWNER_AUTHORIZED_AI_SELF_REVIEW_NOT_INDEPENDENT_PRODUCTION_ACCEPTANCE',
      mainFinancialPeriod='FY2025',analysisMode='AS_REVISED_CURRENT_RESEARCH',
      counts=dict(counts),recordCountIncludesRepeatedSourceReadings=True,
      acceptanceGranularity='EXACT_RECORD_VALUES_CAPTION_PERIOD_SCOPE_UNIT_AND_SOURCE_PAGE',
      records=rows,reportedArithmeticBridges=b,
      unreviewedScope=['Every metric/cell not explicitly registered as accepted, including unregistered cells on listed pages',
        'Complete financial-report packages FY2022–FY2024, H1/Q3_2026 and a full historical cash-flow reconstruction are not accepted by this decision',
        'Current-date market price/capital events, all subsidiary/project fund completeness and guarantee exposure are not certified',
        'Management caption 183.1t remains pending reconciliation; management metrics are not substituted for audited VIC group revenue'],
      excludedPurposes=['ACCEPT_NORMALIZED_COMMON_EARNINGS','ACCEPT_NORMALIZED_EPS','ACCEPT_RNAV_SOTP_OR_FAIR_VALUE','APPROVE_PRICE_TARGET_OR_BUY_SELL','PRODUCTION_SCORING','SOURCE_AUTHORITY_PROMOTION','PORTFOLIO_POSTING_OR_NAV_ACTIVATION'],
      normalizedCommonEarningsAccepted=False,valuationAccepted=False,sourceAuthorityPromoted=False,
      criteriaOrWeightsChanged=False,productionAuthority=False,navAuthority=False,tradingAuthority=False,
      externalVinFastReportRequiredForThisScope=False,fullVicDatasetAccepted=False,
      historicalDecisionsPreserved=True,
      predecessorDisposition='Earlier BLOCKED decisions remain valid for normalized earnings and valuation; they do not block this narrower reported-analysis acceptance.')
    dump(OUT/'decision.json',d);dump(OUT/'document-coverage.json',dict(contract='vic-document-coverage-v1',documents=inventory(rows)))
    with (OUT/'record-register.csv').open('w',newline='') as f:
        w=csv.writer(f,lineterminator='\n');w.writerow(['id','status','scopeRole','period','scope','unit','valueKeys','unknownFields','pdf','page','evidencePointer'])
        for r in rows:w.writerow([r['id'],r['status'],r['scopeRole'],r['economicPeriod'],r['sourceScope'],r['declaredUnit'],';'.join(r['values']),';'.join(r['unknownValueFields']),r['source']['pdfPath'],r['source']['physicalPage'],r['evidenceArtifact']+'#'+r['evidenceJsonPointer']])
    with (OUT/'RECORD_REGISTER.md').open('w') as f:
        f.write('# Danh mục bản đọc VIC\n\nMỗi dòng chỉ nghiệm thu các trường đã đăng ký, đúng kỳ/phạm vi/đơn vị; không bao phủ cả trang hoặc cả báo cáo. Bản đọc trùng nguồn ở các gói khác nhau không phải các giao dịch độc lập.\n\n| ID | Trạng thái | Kỳ / phạm vi | Trường đã đọc | Nguồn |\n|---|---|---|---|---|\n')
        for r in rows:f.write('| '+r['id']+' | '+r['status']+' | '+r['economicPeriod']+' / '+r['sourceScope']+' | '+', '.join(r['values'])+' | ['+Path(r['source']['pdfPath']).name+' p'+str(r['source']['physicalPage'])+'](/'+str(ROOT/r['source']['pdfPath']).lstrip('/')+'#page='+str(r['source']['physicalPage'])+') |\n')
    anchor=dict(contract=d['contract'],acceptanceId=ACCEPTANCE_ID,decision=d['decision'],decisionDate=d['decisionDate'],
      scope=d['decisionVietnamese'],counts=dict(counts),snapshotPath=rel(OUT/'decision.json'),snapshotSha256=sha(OUT/'decision.json'),
      registryPath=rel(OUT/'record-register.csv'),coveragePath=rel(OUT/'document-coverage.json'),
      permittedUse=sorted(PURPOSES),fullVicDatasetAccepted=False,normalizedCommonEarningsAccepted=False,
      valuationAccepted=False,productionAuthority=False,navAuthority=False,tradingAuthority=False,
      currentCanonicalReview='docs/fundamental-data-engine/governance/VIC_FINANCIAL_ANALYSIS_ACCEPTANCE.md')
    dump(GOV/'VIC_FINANCIAL_ANALYSIS_ACCEPTANCE.json',anchor)
    paths=[BASE/name for name,_ in SOURCES]+[(BASE/name).parent/'manifest.json' for name,_ in SOURCES]+[OUT/n for n in ['decision.json','document-coverage.json','record-register.csv','RECORD_REGISTER.md','validation.json'] if (OUT/n).exists()]+[GOV/'VIC_FINANCIAL_ANALYSIS_ACCEPTANCE.json',Path(__file__).resolve()]
    if (GOV/'VIC_FINANCIAL_ANALYSIS_ACCEPTANCE.md').exists():paths.append(GOV/'VIC_FINANCIAL_ANALYSIS_ACCEPTANCE.md')
    dump(OUT/'manifest.json',dict(contract='vic-reported-data-acceptance-manifest-v1',pins={rel(p):sha(p) for p in paths},sourcePins={r['source']['pdfPath']:r['source']['sha256'] for r in rows}))
    return d
if __name__=='__main__':
    d=build();print(json.dumps(dict(decision=d['decision'],counts=d['counts'],productionAuthority=False)))
