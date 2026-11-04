"""Item-level owner-authorized FY2025 reported-data and analysis acceptance.
Accept checked readings and conditional research separately; never grant scoring.
"""
import csv
import hashlib
import importlib.util
import json
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance'
WORK=BASE/'2026-11-04/earnings-normalization-v4'
OUT=BASE/'2026-11-04/fy2025-item-acceptance-v1'
GOV=ROOT/'docs/fundamental-data-engine/governance'
spec=importlib.util.spec_from_file_location('earnings_v4',ROOT/'scripts/build-earnings-normalization-v4.py')
v4=importlib.util.module_from_spec(spec);spec.loader.exec_module(v4)
AUTH='OWNER_REQUEST_FY2025_ITEM_LEVEL_DATA_AND_ANALYSIS_ACCEPTANCE_ALL_30'


def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def rel(p):return str(p.relative_to(ROOT))
def dump(p,x):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')


def binding(p,pointer=''):
    return dict(path=rel(p),sha256=sha(p),jsonPointer=pointer)


def assess_record(ticker,period,scope,unit,value,multiplier,source,checked,conflict=False):
    """Fail closed on identity, source and dimensions; conflict is record-local."""
    if ticker not in v4.TICKERS:raise ValueError('UNKNOWN_ISSUER')
    if f'/{ticker}/' not in source['pdfPath']:raise ValueError('CROSS_ISSUER_SOURCE')
    v4.verify(source['pdfPath'],source['sha256'])
    if not isinstance(source['physicalPage'],int) or source['physicalPage']<1:
        raise ValueError('INVALID_SOURCE_PAGE')
    if scope not in ('CONSOLIDATED','STANDALONE','STANDALONE_PARENT'):
        return 'PENDING_DIMENSION_REVIEW'
    declared={'VND':'1','CURRENCY':'1','MILLION_CURRENCY':'1000000','MILLION_VND':'1000000','BILLION_VND':'1000000000','PERCENT':'0.01'}
    if unit not in declared or period not in ('FY2023','FY2024','FY2025'):
        return 'PENDING_DIMENSION_REVIEW'
    if multiplier is None or value is None:
        return 'PENDING_MISSING_VALUE_OR_UNIT'
    if multiplier is not None and value is not None:
        v4.number(value);v4.number(multiplier)
        if unit in declared and v4.number(multiplier)!=v4.number(declared[unit]):
            raise ValueError('DECLARED_UNIT_MULTIPLIER_MISMATCH')
    if not checked:return 'PENDING_VISUAL_REVIEW'
    if conflict:return 'ACCEPTED_AS_PRINTED_WITH_RECONCILIATION_EXCEPTION'
    return 'ACCEPTED_REPORTED_READING'


def build():
    wm=load(WORK/'manifest.json')
    for p,h in wm['inputPins'].items():v4.verify(p,h)
    for p,h in wm['outputs'].items():v4.verify(rel(WORK/p),h)
    pins=dict(wm['inputPins'])
    def pin(p):pins[rel(p)]=sha(p);return binding(p)
    pin(WORK/'manifest.json');snapshot_path=WORK/'snapshot.json';pin(snapshot_path)
    work=load(snapshot_path)['issuers']
    registry=[]
    def add(ticker,id,period,scope,unit,value,multiplier,source,checked,evidence,conflict=False):
        status=assess_record(ticker,period,scope,unit,value,multiplier,source,checked,conflict)
        pins[source['pdfPath']]=source['sha256']
        registry.append(dict(id=id,ticker=ticker,status=status,economicPeriod=period,
            scope=scope,unit=unit,nativeValue=value,multiplier=multiplier,
            valueVnd=v4.txt(v4.number(value)*v4.number(multiplier)) if value is not None and multiplier is not None and unit in ('VND','CURRENCY','MILLION_CURRENCY','MILLION_VND','BILLION_VND') else None,
            normalizedFraction=v4.txt(v4.number(value)*v4.number(multiplier)) if unit=='PERCENT' and value is not None else None,
            source=source,evidence=evidence,sourcePublicationAt=None,sourceRetrievedAt=None,
            historicalAsKnownAdmitted=False,permittedUse=['FY2025_REPORTED_FINANCIAL_ANALYSIS','RECONCILE_REPORTED_DATA'],
            factualRecurrenceProven=False,productionAdmissible=False))
    cp=BASE/'2026-10-30/b6-economics-r3/checked-common-earnings.json';pin(cp)
    for i,r in enumerate(load(cp)['facts']):
        source=dict(pdfPath=r['source']['pdfPath'],sha256=r['source']['sha256'],physicalPage=r['source']['page'],href=r['source']['href'])
        add(r['ticker'],r['id'], 'FY2025',r['sourceScope'],r['declaredCurrencyUnit'],r['reportedCommonProfit'],r['currencyMultiplier'],source,
            r['review']['fullPageImageInspected'],binding(cp,f'/facts/{i}'),r['reconciliationDifferenceVnd'] is not None and v4.number(r['reconciliationDifferenceVnd'])!=0)
    rp=BASE/'2026-11-02/earnings-normalization-v3/checked-readings.json';pin(rp)
    for i,r in enumerate(load(rp)['readings']):
        source=dict(pdfPath=r['pdfPath'],sha256=r['pdfSha256'],physicalPage=r['physicalPage'],href=r['href'])
        add(r['ticker'],r['id'],r['period'],r['scope'],r['unit'],r['lexicalValue'],r['multiplier'],source,
            r['fullPageImageInspected'],binding(rp,f'/readings/{i}'))
    hp=BASE/'2026-11-02/held-normalization-v1/checked-inputs.json';pin(hp)
    for i,r in enumerate(load(hp)['readings']):
        v4.validate_reading(r,r['ticker'])
        source=dict(pdfPath=r['sourcePdf'],sha256=r['sourceHash'],physicalPage=r['physicalPage'],href=r['sourcePdf']+'#page='+str(r['physicalPage']))
        add(r['ticker'],r['id'],f"FY{r['fiscalYear']}",'CONSOLIDATED',r['sourceLexicalUnit'],r['sourceLexicalValue'],r['currencyMultiplier'],source,True,binding(hp,f'/readings/{i}'))
    # VNM's active model is standalone, not the consolidated common reference.
    for filename,key in [('vnm-parent-owner-cash-input.json','valuesByYear'),('vnm-specific-adjustment-input.json',None)]:
        path=BASE/'2026-10-30/b6-underwriting-r4'/filename;r=load(path);pin(path)
        s=r['source'];v4.verify(s['pdfPath'],s['sha256']);pins[s['pdfPath']]=s['sha256']
        registry.append(dict(id='VNM:'+filename,ticker='VNM',status='ACCEPTED_REPORTED_INPUT_PACKAGE',
            economicPeriod='FY2025_WITH_FY2024_COMPARATIVES',scope='STANDALONE',unit='VND',
            nativeValue=None,multiplier='1',valueVnd=None,source=s,evidence=binding(path),
            precision='SOURCE_DECIMAL_STRINGS_NO_MODEL_VALUES_PROMOTED',
            factualRecurrenceProven=False,productionAdmissible=False))
    # Preserve VIC's more detailed canonical record decisions, including one pending caption.
    vicp=BASE/'2026-11-03/vic-reported-data-acceptance-v1/decision.json';vic=load(vicp);pin(vicp)
    for i,r in enumerate(vic['records']):
        s=r['source'];v4.verify(s['pdfPath'],s['sha256']);pins[s['pdfPath']]=s['sha256']
        registry.append(dict(id='VIC-CANONICAL:'+r['id'],ticker='VIC',status=r['status'],
            economicPeriod=r['economicPeriod'],scope=r['sourceScope'],unit=r['declaredUnit'],
            nativeValue=None,valueVnd=None,values=r.get('values'),source=s,evidence=binding(vicp,f'/records/{i}'),
            factualRecurrenceProven=False,productionAdmissible=False))
    items=[];issuers=[]
    for p in work:
        t=p['ticker'];path=WORK/'issuers'/f'{t}.json';pin(path)
        records=[r for r in registry if r['ticker']==t]
        def item(key,status,conclusion,accepted_value=None,remaining=None):
            x=dict(id=f'{t}:{key}',ticker=t,item=key,status=status,conclusion=conclusion,
                acceptedForUse=None if status.startswith('NOT_ACCEPTED') else 'FY2025_SCOPED_REPORTED_ANALYSIS',acceptedValueVnd=accepted_value,
                evidence=binding(path),issuerContextRecordIds=[r['id'] for r in records],remaining=remaining,
                evidenceRole='ISSUER_RESEARCH_CONTEXT_NOT_PROOF_OF_ALL_ITEM_METRICS',
                sustainableProfitProofRequired=False,fy2026TaxReturnRequired=False,
                countsAsConfirmedCompanyFact=key in ('reported_readings','reported_numerator') and status=='ACCEPTED_REPORTED_DATA',
                productionScoringAuthorized=False)
            items.append(x);return x
        item('reported_readings','ACCEPTED_REGISTERED_READINGS_ONLY',
            'Nghiệm thu các bản đọc có trạng thái accepted trong sổ đăng ký; ngoại lệ chỉ áp vào bản đọc đó. Không nghiệm thu toàn bộ báo cáo/OCR chưa kiểm tra.')
        item('reported_income_statement','ACCEPTED_REGISTERED_COMPONENTS_FULL_STATEMENT_UNREVIEWED',
            'Các khoản doanh thu, chi phí và lợi nhuận có bản đọc accepted được dùng theo nguồn; chưa nghiệm thu toàn bộ báo cáo kết quả kinh doanh.',None,
            'Các dòng ngoài sổ đăng ký và đối chiếu tổng thể ba báo cáo chưa thuộc vòng kiểm tra này.')
        item('reported_balance_sheet','ACCEPTED_REGISTERED_COMPONENTS_FULL_STATEMENT_UNREVIEWED',
            'Chỉ dùng các bản đọc tài sản/nợ/vốn đã đăng ký; không tự coi tổng nợ phải trả là nợ vay hoặc lợi ích NCI là quyền của cổ đông mẹ.',None,
            'Đối chiếu đầy đủ bảng cân đối, phạm vi nợ vay/thuê, tiền bị hạn chế và quyền ưu tiên chưa nghiệm thu toàn bộ trong vòng này.')
        item('reported_cashflow','ACCEPTED_REGISTERED_COMPONENTS_FULL_STATEMENT_UNREVIEWED',
            'Bản đọc lưu chuyển tiền được đăng ký giữ phạm vi riêng; lợi nhuận không tự thay thế CFO hoặc tiền có thể phân phối.',None,
            'Chưa nghiệm thu toàn bộ lưu chuyển tiền, tách capex duy trì/mở rộng và trả gốc nợ cho cả 30 mã. Các hồ sơ đã kiểm tra trước đây vẫn được giữ nguyên.')
        common=p['reportedNumeratorEvidence']
        mismatch=common['reconciliationDifferenceVnd'] is not None and v4.number(common['reconciliationDifferenceVnd'])!=0
        if t=='VNM':
            item('reported_numerator','ACCEPTED_REPORTED_DATA','Dùng tử số công ty mẹ sau quỹ đã trích; số hợp nhất là tham chiếu riêng.',p['sourceCommonBridgeVnd'])
        elif mismatch:
            item('reported_numerator','ACCEPTED_PRINTED_VALUE_ARITHMETIC_EXCEPTION','Giữ số in trên báo cáo; không dùng nó làm tử số đã khớp. Nhánh phân tích dẫn xuất được ghi riêng.',None,'Đối chiếu subtotal/tử số nguồn; không sửa số công ty công bố bằng khoản bù.')
        elif common['reconciliationDifferenceVnd'] is None:
            item('reported_numerator','ACCEPTED_REPORTED_VALUE_DEDUCTION_BRIDGE_UNVERIFIED','Nghiệm thu giá trị tử số đọc từ nguồn; chưa có phép kiểm đầy đủ cầu nối khấu trừ, không suy ra khoản quỹ bằng 0.',common['reportedCommonProfitVnd'],'Cầu nối khấu trừ đầy đủ còn chưa kiểm tra.')
        else:
            item('reported_numerator','ACCEPTED_REPORTED_DATA','Nghiệm thu tử số đã đọc và kiểm tra phép cộng trừ trong phạm vi, niên độ và đơn vị của nguồn.',common['reportedCommonProfitVnd'])
        item('fund_bridge','ACCEPTED_BOUNDED_BRIDGE_NOT_COMPLETE_DISTRIBUTION',
            'Dùng cầu nối quỹ đã định danh đúng một lần. Nhánh kế hoạch, số làm tròn và khoản chưa xác định vẫn được giữ riêng.',p['sourceCommonBridgeVnd'],
            'Chưa xác nhận đầy đủ mọi phân phối cuối cùng; không biến unknown thành 0. '+('Nhánh quỹ còn điều kiện kế hoạch.' if p['fundBridgeIsConditionalPlan'] else ''))
        if t=='VIC':
            item('adjusted_earnings','ACCEPTED_COMPONENT_ANALYSIS_NO_COMMON_POINT',
                'Nghiệm thu phân tích theo khoản tài trợ, Novatech, Movian và khoảng nhạy cảm; không chọn điểm thuộc mẹ khi phân bổ chưa xác định.',None,
                'Thuế và quyền/phân bổ tại giao dịch; không cần chờ kỳ thuế 2026.')
        else:
            calculated=v4.txt(v4.calculate(p['sourceCommonBridgeVnd'],p['selectedPretaxAdjustments']))
            if calculated!=p['prudentialWorkingCaseVnd']:raise ValueError('ARITHMETIC_MISMATCH:'+t)
            item('adjusted_earnings','ACCEPTED_CONDITIONAL_FY2025_ANALYSIS',
                p['baseChoice'],calculated,'Đây là kịch bản phân tích FY2025, không phải lợi nhuận điều chỉnh được doanh nghiệp công bố. '+p['counterevidenceAndRemainingWork'])
        item('tax_and_nci','ACCEPTED_EXPLICIT_ASSUMPTION_SENSITIVITY',
            'Nghiệm thu phép thử thuế/NCI được công bố rõ là giả định. Không dùng ETR toàn nhóm hoặc tỷ lệ lợi nhuận làm thuế giao dịch/sở hữu đã chứng minh.',None,
            'Thuế thực tế của từng điều chỉnh và phần mẹ tại giao dịch còn chưa xác nhận; không chặn đọc số liệu hoặc dùng kịch bản.')
        item('analysis_conclusion','ACCEPTED_SCOPED_INTERPRETATION',p['baseChoice'],None,
            p['counterevidenceAndRemainingWork'])
        item('valuation_eps_cashflow','NOT_ACCEPTED_BY_THIS_REVIEW',
            'Không suy ra EPS theo ngày giá, dòng tiền chủ sở hữu, RNAV, giá trị/cổ phần hoặc quyết định mua/bán chỉ từ cầu nối lợi nhuận.',None,
            'Đánh giá bằng hồ sơ riêng; mục chưa kiểm tra không chặn các mục số liệu FY2025 đã nghiệm thu.')
        issuers.append(dict(ticker=t,decision='ACCEPTED_FOR_ITEM_LEVEL_FY2025_ANALYSIS',
            scope=p['scope'],registeredRecordCount=len(records),recordStatusCounts=dict(Counter(r['status'] for r in records)),
            itemIds=[x['id'] for x in items if x['ticker']==t],conditionalAnalysisValueVnd=p['prudentialWorkingCaseVnd'],
            allReportedStatementsAccepted=False,allFinancialConclusionsAccepted=False,
            currentRubricScoresChanged=False,productionAuthority=False))
    # Every existing rubric/topic remains visible. Research acceptance is not scoring readiness.
    topic_path=BASE/'2026-11-02/acceptance-remediation-v1/topic-review-worklist.json';pin(topic_path)
    topics=load(topic_path)
    rubric_register=[]
    for r in topics['rubrics']:
        rubric_register.append(dict(**r,fy2025AcceptanceScope='ITEM_LEVEL_REGISTERED_DATA_ONLY',
            relatedAnalysisItemIds=[x['id'] for x in items if x['ticker']==r['ticker']],
            topicEvidenceAutomaticallyAdmitted=False,financialCriteriaChanged=False,
            productionScoringAuthorized=False))
    topic_register=[dict(id=r['id'],ticker=r['ticker'],rubricId=r['rubricId'],topic=r['topic'],
        priorStatusBinding=binding(topic_path,f'/topics/{i}'),
        readyForScoring=r['readyForScoring'],topicSpecificSufficiencyProven=r['topicSpecificSufficiencyProven'],
        expiredObservationBindingCount=len(r['expiredObservationBindings']),
        reportedDataAcceptanceDoesNotRenewBindings=True,
        analysisUseStatus='RETAINED_TOPIC_REVIEW_STATUS_NOT_AUTO_ACCEPTED') for i,r in enumerate(topics['topics'])]
    dump(OUT/'record-register.json',dict(contract='fy2025-registered-data-acceptance-v1',records=registry,
        duplicateSourceReadingsMayAppear=True,allCorpusCellsAccepted=False))
    dump(OUT/'item-decisions.json',dict(contract='fy2025-analysis-item-decisions-v1',items=items))
    dump(OUT/'rubric-topic-disposition.json',dict(contract='fy2025-rubric-boundary-disposition-v1',
        rubrics=rubric_register,topics=topic_register,automaticAcceptanceOrScoring=False))
    labels={'reported_income_statement':'Kết quả kinh doanh — độ phủ','reported_balance_sheet':'Tài sản, nợ, vốn — độ phủ','reported_cashflow':'Lưu chuyển tiền — độ phủ','reported_readings':'Bản đọc nguồn','reported_numerator':'Tử số lợi nhuận báo cáo','fund_bridge':'Cầu nối quỹ','adjusted_earnings':'Lợi nhuận FY2025 điều chỉnh','tax_and_nci':'Thuế và NCI','analysis_conclusion':'Kết luận phân tích','valuation_eps_cashflow':'EPS, dòng tiền, định giá'}
    for r in issuers:
        selected=[x for x in items if x['ticker']==r['ticker']]
        dump(OUT/'issuers'/f"{r['ticker']}.json",dict(**r,items=selected))
        detail=[f"# {r['ticker']} — nghiệm thu theo mục FY2025",'',
            f"Phạm vi mô hình: {r['scope']}. Quyết định: sử dụng số liệu đã đăng ký và phân tích có điều kiện; không đồng nghĩa toàn bộ báo cáo hoặc mọi kết luận đã nghiệm thu.",'',
            '| Mục | Quyết định | Kết luận được dùng | Giới hạn/công việc còn mở |',
            '|---|---|---|---|']
        for i in selected:
            value=(' Giá trị được dùng: '+i['acceptedValueVnd']+' VND.') if i['acceptedValueVnd'] is not None else ''
            detail.append(f"| {labels[i['item']]} | {i['status']} | {i['conclusion']}{value} | {i['remaining'] or 'Không có ngoại lệ bổ sung ngoài phạm vi đã nêu.'} |")
        detail += ['', 'Bằng chứng chính: ['+r['ticker']+' — cầu nối FY2025](../../earnings-normalization-v4/issuers/'+r['ticker']+'.json). Bản đọc cụ thể nằm trong [sổ đăng ký](../record-register.csv); JSON cạnh tài liệu này ghim nguồn và hash. Các năm so sánh và nguồn hỗ trợ không tự trở thành số FY2025.', '',
            'Không yêu cầu lợi nhuận bền vững hoặc kỳ thuế 2026 để nghiệm thu các mục này. Không cấp điểm rubric, đổi trọng số hoặc cấp quyền production/NAV/giao dịch.']
        (OUT/'issuers'/f"{r['ticker']}.md").write_text('\n'.join(detail)+'\n')
    decision=dict(contract='vn30-fy2025-item-acceptance-v1',acceptanceId='VN30-FY2025-ITEM-ACCEPTANCE-2026-11-04-v1',
        decisionDate='2026-11-04',exactDecisionTime=None,authorityBasis=AUTH,
        reviewMode='OWNER_AUTHORIZED_AI_SELF_REVIEW_NOT_INDEPENDENT_PRODUCTION_ACCEPTANCE',
        decision='ACCEPTED_FOR_ITEM_LEVEL_FY2025_REPORTED_DATA_AND_ANALYSIS',
        analysisMode='AS_REVISED_CURRENT_RESEARCH_NOT_HISTORICAL_AS_KNOWN',
        issuerCount=len(issuers),itemCount=len(items),recordCount=len(registry),
        recordStatusCounts=dict(Counter(r['status'] for r in registry)),
        itemStatusCounts=dict(Counter(r['status'] for r in items)),issuers=issuers,
        sustainabilityIsMandatoryGate=False,fy2026TaxReturnIsMandatoryGate=False,
        noFinancialCriteriaOrWeightsChanged=True,all30NumericAdjustedProfitPointsAccepted=False,
        allCorpusFinancialCellsAccepted=False,allRubricTopicsAccepted=False,
        existingRubricReadinessPreserved=True,productionScoringAuthorized=False,sourceAdmissionGranted=False,
        navAuthorized=False,tradingAuthorized=False,requiresNewPersonalOwnerEvidence=False,
        predecessorVicCanonicalPreserved=True)
    dump(OUT/'decision.json',decision)
    with (OUT/'record-register.csv').open('w',newline='') as f:
        fields=['ticker','id','status','economicPeriod','scope','unit','nativeValue','valueVnd','pdfPath','physicalPage','evidencePointer']
        writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
        for r in registry:
            writer.writerow({**{k:r.get(k) for k in fields[:8]},'pdfPath':r['source']['pdfPath'],
                'physicalPage':r['source'].get('physicalPage',r['source'].get('pages')),
                'evidencePointer':r['evidence']['path']+'#'+r['evidence']['jsonPointer']})
    lines=['# Nghiệm thu số liệu và phân tích FY2025 — 30 mã','',
        'Quyết định: **nghiệm thu có phạm vi theo từng mục cho cả 30 mã** để phân tích báo cáo FY2025. Không yêu cầu chứng minh lợi nhuận bền vững và không cần chờ kỳ thuế 2026. Không thay đổi tiêu chí tài chính, trọng số hay bằng chứng lịch sử. Đây là AI tự rà soát theo ủy quyền của chủ sở hữu, không phải nghiệm thu production độc lập.','',
        f"Sổ đăng ký có {len(registry)} bản đọc/gói đầu vào (có bản đọc nguồn lặp lại), {len(items)} quyết định mục, 690 rubric và 2490 topic được giữ trạng thái riêng. Phạm vi chỉ gồm bản đọc/gói đã kiểm tra và được đăng ký; không bao toàn bộ ô trong ba báo cáo/thuyết minh hay mọi số liệu OCR.",'',
        '## Kết quả từng mã','',
        '| Mã | Phạm vi mô hình | Bản đọc đã đăng ký | Tử số báo cáo | Cầu nối quỹ | Phân tích FY2025 | Mức kịch bản (tỷ VND) |',
        '|---|---|---:|---|---|---|---:|']
    for p in work:
        t=p['ticker'];r=next(x for x in issuers if x['ticker']==t)
        numerator='Riêng, sau quỹ' if t=='VNM' else ('Giữ số in, subtotal chưa khớp' if any(x['ticker']==t and x['item']=='reported_numerator' and 'EXCEPTION' in x['status'] for x in items) else ('Đã đọc; cầu nối khấu trừ chưa kiểm tra đủ' if p['reportedNumeratorEvidence']['reconciliationDifferenceVnd'] is None else 'Đã đối chiếu trong phạm vi nguồn'))
        value=format(v4.number(p['prudentialWorkingCaseVnd'])/v4.D('1000000000'),'.3f') if p['prudentialWorkingCaseVnd'] is not None else 'Không chọn điểm'
        lines.append(f"| [{t}](issuers/{t}.md) | {p['scope']} | {r['registeredRecordCount']} | {numerator} | Đã định danh; chưa chứng minh đầy đủ cuối cùng | {'Theo khoản, chưa chốt mức thuộc mẹ' if t=='VIC' else 'Nghiệm thu kịch bản có giả định'} | {value} |")
    lines += ['', '## Quyết định theo loại mục','',
        '- **Bản đọc:** nghiệm thu nguồn, niên độ, phạm vi, đơn vị và giá trị đã đăng ký. Ngoại lệ subtotal/nhãn chỉ giữ ở bản đọc liên quan. Các năm so sánh, nguồn 2026 hỗ trợ, báo cáo quản trị và báo cáo riêng vẫn ghi đúng vai trò, không đổi thành số hợp nhất FY2025.',
        '- **Tử số và quỹ:** nghiệm thu số báo cáo đã đối chiếu, cùng cầu nối đã định danh. Không đồng nghĩa mọi phân phối cuối cùng đã đầy đủ. Quỹ kế hoạch và số làm tròn còn điều kiện, không coi unknown là 0.',
        '- **Điều chỉnh và phân tích:** nghiệm thu phép tính/kịch bản và lập luận có giả định công khai để dùng trong phân tích FY2025. Không đổi chúng thành số doanh nghiệp công bố hoặc kết quả kinh tế chắc chắn. Giữ dấu âm nếu có.',
        '- **Thuế/NCI:** nghiệm thu việc phân tích độ nhạy, chưa xác nhận thuế/sở hữu thực tế tại mọi giao dịch. Đây là giới hạn của kết luận điều chỉnh, không chặn dùng số liệu báo cáo.',
        '- **Rubric/topic:** giữ nguyên đủ 690 rubric và 2490 topic, điểm/trọng số và độ sẵn sàng cũ. Số liệu được nghiệm thu không tự chứng minh lợi thế cạnh tranh, quản trị, tính lặp lại, định giá hay làm mới binding đã hết hạn.',
        '- **Chưa nghiệm thu trong vòng này:** toàn bộ corpus, các ô chưa kiểm tra, lợi nhuận tương lai, EPS theo ngày giá/quyền pha loãng, dòng tiền chủ sở hữu và định giá/mua bán. RNAV không phải điều kiện nghiệm thu số liệu và kịch bản lợi nhuận.','',
        '## Ngoại lệ cần giữ đúng','',
        '- **BSR:** số in EPS có chênh phép cộng trừ; không nâng subtotal đó thành tử số đã khớp. Nhánh dẫn xuất theo nguồn Q3 và chênh nhánh 1 VND được dùng có điều kiện; chưa có sửa lỗi từ doanh nghiệp và chưa chứng minh đủ phân phối cuối cùng.',
        '- **GVR:** dùng phân phối công ty con thuộc mẹ đã công bố và phương án mẹ làm tròn; không tự gán biến động quỹ kỳ trước vào FY2025 hoặc tạo bút toán để khớp.',
        '- **VNM:** mô hình dùng báo cáo riêng, quỹ đã trích một lần; tử số hợp nhất không thay thế tử số riêng.',
        '- **VIC:** giữ quyết định nghiệm thu bản đọc chi tiết trước đây, gồm ngoại lệ nhãn; chấp nhận phân tích theo khoản và khoảng nhạy cảm mà không bịa điểm lợi nhuận thuộc mẹ.','',
        'Chi tiết từng mục và việc còn mở: `issuers/<MÃ>.json`, `item-decisions.json`. Đối chiếu nguồn: `record-register.csv/json`. Quyết định rubric/topic: `rubric-topic-disposition.json`. Không ghi DB, posting, đổi source authority, kích hoạt NAV/scoring hoặc cấp quyền giao dịch.']
    (OUT/'REPORT.md').write_text('\n'.join(lines)+'\n')
    # Canonical universe-level receipt; prior VIC receipt remains byte-for-byte intact.
    governance=dict(contract=decision['contract'],decision=decision['decision'],decisionDate=decision['decisionDate'],
        acceptanceId=decision['acceptanceId'],issuerCount=30,itemCount=len(items),
        snapshot=binding(OUT/'decision.json'),reportPath=rel(OUT/'REPORT.md'),
        recordRegisterPath=rel(OUT/'record-register.json'),rubricTopicDispositionPath=rel(OUT/'rubric-topic-disposition.json'),
        sustainabilityIsMandatoryGate=False,fy2026TaxReturnIsMandatoryGate=False,
        wholeDatasetAccepted=False,productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False)
    dump(GOV/'VN30_FY2025_FINANCIAL_ANALYSIS_ACCEPTANCE.json',governance)
    (GOV/'VN30_FY2025_FINANCIAL_ANALYSIS_ACCEPTANCE.md').write_text('# Quyết định nghiệm thu phân tích FY2025 — 30 mã\n\nNghiệm thu theo từng mục, theo ủy quyền chủ sở hữu ngày 2026-11-04. Số liệu đã kiểm tra và kịch bản có giả định được sử dụng để phân tích FY2025; không yêu cầu lợi nhuận bền vững hoặc chờ thuế 2026.\n\nBảng từng mã và giới hạn: [báo cáo quyết định](../scoring-dataset-acceptance/2026-11-04/fy2025-item-acceptance-v1/REPORT.md). JSON cạnh tài liệu này ghim snapshot chính xác.\n\nPhạm vi không bao mọi ô báo cáo, mọi rubric hoặc quyết định mua/bán. Giữ nguyên tiêu chí, trọng số, bằng chứng và các ngoại lệ. Hồ sơ VIC trước đây được giữ nguyên; receipt toàn bộ 30 mã này bổ sung phạm vi nghiệm thu phân tích theo mục. Không cấp production/source/NAV/trading authority.\n')
    pin(Path(__file__).resolve());pin(ROOT/'scripts/test-vn30-fy2025-analysis-acceptance.py')
    outputs={rel(p):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name not in ('manifest.json','VALIDATION.md')}
    for p in [GOV/'VN30_FY2025_FINANCIAL_ANALYSIS_ACCEPTANCE.json',GOV/'VN30_FY2025_FINANCIAL_ANALYSIS_ACCEPTANCE.md']:outputs[rel(p)]=sha(p)
    dump(OUT/'manifest.json',dict(contract='fy2025-item-acceptance-manifest-v1',inputPins=pins,outputs=outputs))
    print(json.dumps(dict(issuers=len(issuers),items=len(items),records=len(registry),recordStatuses=decision['recordStatusCounts']),ensure_ascii=False))

if __name__=='__main__':build()
