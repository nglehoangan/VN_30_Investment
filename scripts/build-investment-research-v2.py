"""Complete the remaining 19 dossiers using retained PDF, extraction and CafeF sources."""
import hashlib
import json
import unicodedata
from decimal import Decimal, getcontext
from pathlib import Path
from lib.held_normalization import number,text
from lib.research19 import capital_bridge,signed_return_value

getcontext().prec=60
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance'
PRIOR=BASE/'2026-11-04/investment-research-v1'
V4=BASE/'2026-11-04/earnings-normalization-v4'
OUT=BASE/'2026-11-04/investment-research-v2'
TARGET='BID BSR CTG GVR HDB LPB MCH MSN SAB SHB SSB STB TCX VHM VIB VIC VJC VPB VPL'.split()
FINANCIAL='BID CTG HDB LPB SHB SSB STB TCX VIB VPB'.split()
COSTS=('0.18','0.15','0.12')
HORIZONS=(3,5,10)


def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def rel(p):return str(p.relative_to(ROOT))
def dump(p,x):
    p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def norm(s):return ' '.join(unicodedata.normalize('NFD',(s or '').lower().replace('đ','d')).encode('ascii','ignore').decode().split())
def resolve(obj,pointer):
    for key in pointer.strip('/').split('/'):
        key=key.replace('~1','/').replace('~0','~')
        obj=obj[int(key)] if isinstance(obj,list) else obj[key]
    return obj


def build():
    pins={}
    def pin(p,expected=None):
        h=sha(p)
        if expected is not None and h!=expected:raise ValueError('SOURCE_PIN_MISMATCH:'+rel(p))
        pins[rel(p)]=h;return dict(path=rel(p),sha256=h)
    for root in (PRIOR,V4):
        m=load(root/'manifest.json')
        for path,h in m['inputPins'].items():pin(ROOT/path,h)
        for path,h in m['outputs'].items():pin(ROOT/path,h) if path.startswith('docs/') else pin(root/path,h)
        pin(root/'manifest.json')
    cap_path=OUT/'checked-capital-readings.json';caps={x['ticker']:x for x in load(cap_path)['readings']};pin(cap_path)
    if set(caps)!=set(TARGET):raise ValueError('EXACT_19_CAPITAL_SCOPE')
    prior=load(PRIOR/'snapshot.json')['issuers'];v4={x['ticker']:x for x in load(V4/'snapshot.json')['issuers']}
    results=[];comparisons=[];discount_basis=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/held-normalization-v1/checked-inputs.json';pin(discount_basis)
    for old in prior:
        t=old['ticker']
        if t not in TARGET:
            results.append(old)
            for suffix in ('json','md'):
                src=PRIOR/'issuers'/f'{t}.{suffix}';pin(src)
                dest=OUT/'issuers'/f'{t}.{suffix}';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(src.read_bytes())
            continue
        p=v4[t];c=caps[t]
        if f'/{t}/' not in c['source']['pdfPath'] or c['sourceScope']!=p['scope']:raise ValueError('CAPITAL_ISSUER_OR_SCOPE_BINDING')
        pin(ROOT/c['source']['pdfPath'],c['source']['sha256'])
        bridge=capital_bridge(c)
        # Read exact PDF/source/year variants. OCR is context, never a new financial fact.
        pdf_path=ROOT/'data/manual-extracted-pdf'/f'{t}.json';api_path=ROOT/'data/manual-extracted-api'/f'{t}.json';combine_path=ROOT/'data/combine'/f'{t}.json'
        for path in (pdf_path,api_path,combine_path):pin(path)
        pdf=load(pdf_path);api=load(api_path);pdf_candidates=[];api_candidates=[]
        pdf_periods=pdf['reports'].get('can-doi-ke-toan',{}).get('periods',{})
        pdf_document_present=False
        for period_key,per in pdf_periods.items():
            for vi,v in enumerate(per.get('variants',[])):
                if v['source'].get('payloadHash')!=c['source']['sha256']:continue
                pdf_document_present=True
                # Only this visually checked page's closing column is resolved here.
                if period_key not in ('2025','2025-12-31','UNRESOLVED-YEAR-C1'):continue
                for gi,g in enumerate(v['groups']):
                    for ri,row in enumerate(g['rows']):
                        row_page=g.get('sourcePage') or row.get('pdfEvidence',{}).get('page')
                        if row_page!=c['source']['physicalPage']:continue
                        n=norm(row['label'])
                        if 'von chu so huu' not in n and 'kiem soat' not in n:continue
                        item=dict(label=row['label'],nativeValue=row.get('value'),lexicalValue=row.get('lexicalValue'),status=row['status'],unitEvidence=g.get('unitEvidence'),
                            extractionPointer=f'/reports/can-doi-ke-toan/periods/{period_key}/variants/{vi}/groups/{gi}/rows/{ri}',sourcePage=row_page,sourcePageBindingLevel='GROUP' if g.get('sourcePage') else 'ROW_PDF_EVIDENCE',
                            originalPeriodKey=period_key,reviewedPeriodEnd='2025-12-31',
                            periodBindingAuthority='THIS_EXACT_PAGE_CLOSING_COLUMN_IMAGE_REVIEW_ONLY',
                            fullPageManualReadingTakesPriority=True,automaticSemanticMapping=False)
                        if 'kiem soat' in n and c['nciNative'] is not None and row.get('value') is not None:
                            item['manualNciNative']=c['nciNative']
                            item['numericExtractionMatchesManual']=number(row['value'])==number(c['nciNative'])
                            item['disposition']='USE_CHECKED_PDF_READING_KEEP_ORIGINAL_EXTRACTION' if not item['numericExtractionMatchesManual'] else 'NUMERIC_CHECK_ONLY_NOT_GENERAL_MAPPING'
                        pdf_candidates.append(item)
        per=api['reports'].get('can-doi-ke-toan',{}).get('periods',{}).get('2025',{})
        raw_cache={}
        for vi,v in enumerate(per.get('variants',[])):
            if v['periodType']!='ANNUAL' or v['year']!=2025 or v.get('modeMismatch') is True:continue
            source=v['source']
            if source['requestParameters'].get('symbol')!=t:raise ValueError('CAFEF_ISSUER_BINDING')
            rawpath=ROOT/source['rawPayloadLocation'];pin(rawpath,source['payloadHash'])
            if str(rawpath) not in raw_cache:raw_cache[str(rawpath)]=json.loads(rawpath.read_text(),parse_float=Decimal)
            for gi,g in enumerate(v['groups']):
                for ri,row in enumerate(g['rows']):
                    n=norm(row['label'])
                    if not (('von chu so huu' in n and 'no phai tra' not in n) or ('loi ich' in n and ('kiem soat' in n or 'thieu so' in n))):continue
                    rawvalue=resolve(raw_cache[str(rawpath)],row['rawLocator'])
                    if row.get('value') is not None and rawvalue is not None and number(str(rawvalue))!=number(row['value']):raise ValueError('CAFEF_CELL_REPLAY')
                    api_candidates.append(dict(label=row['label'],code=row['code'],occurrenceId=row['id'],value=row.get('value'),status=row['status'],
                        displayPointer=f'/reports/can-doi-ke-toan/periods/2025/variants/{vi}/groups/{gi}/rows/{ri}',rawPointer=row['rawLocator'],source=source,
                        providerUnit=source.get('providerUnit'),providerScope=None,
                        comparisonStatus='REFERENCE_ONLY_UNIT_SCOPE_UNDECLARED',pdfOverwritten=False,
                        semanticAgreementNotInferredFromEqualNumbers=True))
        numeric_diagnostics=[]
        for candidate in api_candidates:
            caption=norm(candidate['label']);expected=None;concept=None
            if 'loi ich' in caption and ('kiem soat' in caption or 'thieu so' in caption):
                expected=c['nciNative'];concept='PRINTED_NCI'
            elif 'von chu so huu' in caption and candidate['code'] in ('400','410','500'):
                concept='PRINTED_EQUITY_SUBTOTAL'
                expected=c.get('printed400IncludingFundingNative',c['selectedEquitySubtotalNative']) if candidate['code']=='400' else c['selectedEquitySubtotalNative']
                if t=='BSR' and candidate['code']=='410':expected=c['sourceConflict']['printed410Native']
            if expected is not None and candidate['value'] is not None:
                pdf_vnd=number(expected)*number(c['multiplier']);api_number=number(candidate['value'])
                numeric_diagnostics.append(dict(concept=concept,apiDisplayPointer=candidate['displayPointer'],
                    apiCode=candidate['code'],pdfNativeValue=expected,pdfMultiplier=c['multiplier'],pdfValueVnd=text(pdf_vnd),
                    apiRawNumber=candidate['value'],rawNumericDifferenceNotUnitQualified=text(api_number-pdf_vnd),
                    relation='SAME_NUMERIC_MAGNITUDE_UNQUALIFIED' if api_number==pdf_vnd else 'DIFFERENT_NUMERIC_MAGNITUDE_UNQUALIFIED',
                    providerUnitAndScopeStillUnknown=True,doesNotProveProviderErrorOrAdmission=True))
        comparison=dict(ticker=t,pdfDisplayDocumentPresent=pdf_document_present,missingDisplayDocumentHandledByRetainedPdf=not pdf_document_present,pdfSource=c['source'],checkedCapital=c,pdfExtractedCandidates=pdf_candidates,cafefCandidates=api_candidates,numericDiagnostics=numeric_diagnostics,
            pdfFirst=True,providerUnitOrScopeNotGuessed=True,combinedPresentationUsedAsAcceptedFacts=False)
        comparisons.append(comparison)
        capital=bridge['parentCapitalReferenceVnd']
        if t in FINANCIAL:family='FINANCIAL_COMMON_CAPITAL_EXCESS_RETURN'
        elif t in ('MCH','SAB'):family='CONSUMER_EQUITY_RETURN_SENSITIVITY'
        elif t in ('BSR','GVR'):family='CYCLICAL_EQUITY_RETURN_SENSITIVITY'
        elif t in ('MSN','VHM','VPL'):family='MIXED_GROUP_ACCOUNTING_RETURN_CROSSCHECK_NOT_RNAV_OR_SOTP'
        elif t=='VJC':family='AIRLINE_SIGNED_RETURN_AND_RECAPITALIZATION_SENSITIVITY'
        else:family='UNIDENTIFIED_INCIDENCE_PARENT_RETURN_DIAGNOSTIC'
        income_cases=[]
        if p['prudentialWorkingCaseVnd'] is not None:
            income_cases.append(dict(name='SELECTED_FY2025',valueVnd=p['prudentialWorkingCaseVnd'],sourcePointer='/prudentialWorkingCaseVnd'))
            alternatives=[(x['valueAtAdverseIncidenceVnd'],i) for i,x in enumerate(p['operatingAlternatives']) if x.get('valueAtAdverseIncidenceVnd') is not None]
            if alternatives:
                for label,selector in [('OPERATING_DOWNSIDE',min),('OPERATING_UPSIDE',max)]:
                    value,i=selector(alternatives,key=lambda x:number(x[0]));income_cases.append(dict(name=label,valueVnd=value,sourcePointer=f'/operatingAlternatives/{i}/valueAtAdverseIncidenceVnd'))
        else:
            for label,key in [('NAMED_INCIDENCE_LOW','minimumVnd'),('NAMED_INCIDENCE_HIGH','maximumVnd')]:
                income_cases.append(dict(name=label,valueVnd=p['namedAdjustmentIncidenceEnvelope'][key],sourcePointer='/namedAdjustmentIncidenceEnvelope/'+key))
        scenarios=[]
        for ecase in income_cases:
            for cost in COSTS:
                for horizon,policy in [(h,'FADE_TO_COST') for h in HORIZONS]+[(5,'PERSIST_CURRENT_RETURN')]:
                    model=signed_return_value(capital,ecase['valueVnd'],cost,horizon,policy)
                    scenarios.append(dict(id=f"{ecase['name']}:r{cost}:H{horizon}:{policy}",incomeCase=ecase['name'],earningsInputVnd=ecase['valueVnd'],
                        earningsSourcePointer=ecase['sourcePointer'],equityValueVnd=model['equityValueVnd'],model=model,
                        horizonAndReturnPolicyAreAnalystAssumptions=True,costIsExistingResearchSensitivityNotObservedWacc=True,
                        unknownFundTaxNciOrPreferenceClaimsSetToZero=False))
        values=[number(x['equityValueVnd']) for x in scenarios]
        selected=next((x for x in scenarios if x['incomeCase']=='SELECTED_FY2025' and x['model']['costOfEquityAssumption']=='0.15' and x['model']['horizonYears']==5 and x['model']['returnPolicy']=='FADE_TO_COST'),None)
        illustrative_reference=selected
        if t=='VJC':selected=None
        range_=dict(minimumVnd=text(min(values)),maximumVnd=text(max(values)),baseVnd=selected['equityValueVnd'] if selected else None,
            classification='NAMED_RETURN_SCENARIO_REFERENCE_BEFORE_UNMODELED_CLAIMS_NOT_INTRINSIC_VALUE_INTERVAL',
            completeEconomicBound=False,selectedBaseIsAnalystChoiceNotIssuerForecast=selected is not None)
        result=json.loads(json.dumps(old))
        result.update(contract='issuer-investment-research-v2',stage='ADDITIONAL_19_SOURCE_REVIEW_AND_RETURN_SCENARIOS',
            researchModelFamily=family,capitalReading=c,capitalBridge=bridge,commonBookReferenceVnd=capital,commonBookDate='2025-12-31',
            modelScenarios=scenarios,incomeCases=income_cases,equityScenarioRange=range_,sourceComparisonPath=rel(OUT/'source-comparisons'/f'{t}.json'),
            modelChoice='Use reviewed attributable accounting capital and FY2025 earnings to test excess returns; no arbitrary P/E, group CFO-to-parent ratio, project RNAV or unproved capex allocation.',
            recoverableCapitalAndDistributionsProven=False,primaryValuationAccepted=False,
            valuationAvailableAsConditionalResearchReference=True,selectedCommonEarningsPointIdentified=t!='VIC',
            illustrativeFiveYear15PercentReferenceVnd=illustrative_reference['equityValueVnd'] if illustrative_reference else None,
            selectedValuationBaseIdentified=selected is not None,
            capitalIncludesUnallocatedPreferenceClaims=t in ('MSN','VIC'),
            unknownClaimValueVnd=None,criterionOrWeightChange=False,previousIssuerBinding=dict(path=rel(PRIOR/'issuers'/f'{t}.json'),sha256=sha(PRIOR/'issuers'/f'{t}.json')))
        result['blockingBeforeDatedTradeConclusion']=[x for x in result['blockingBeforeDatedTradeConclusion'] if x!='QUALIFIED_SECTOR_VALUATION_INPUTS_MISSING']
        result['blockingBeforeDatedTradeConclusion']+=['ACCOUNTING_CAPITAL_RECOVERABILITY_AND_RETURN_PERSISTENCE','UNMODELED_CLAIM_AND_DISTRIBUTION_REVIEW']
        if t in ('MSN','VIC'):result['blockingBeforeDatedTradeConclusion'].append('PREFERENCE_OR_MAKE_WHOLE_ECONOMIC_CLAIM')
        # Keep source/cash/rights/current-signal boundaries from v1. Do not turn parent-return references into ordinary-share targets.
        for ref in result['providerShareReferences']:
            ref['perShareRangeVnd']=None;ref['basePerShareVnd']=None;ref['datedPriceComparison']=None
            ref['whyNoNewPriceTarget']='New model is before unresolved claims and dated action admission; provider denominator is not qualified.'
        dump(OUT/'source-comparisons'/f'{t}.json',comparison);dump(OUT/'issuers'/f'{t}.json',result);results.append(result)
        f=lambda x:format(number(x)/Decimal(10**12),'.3f') if x is not None else 'Không chọn điểm'
        rows=['# '+t+' — xử lý nguồn và mô hình tham chiếu FY2025','',
            '**Đã xử lý nguồn đang có:** đọc trực tiếp trang vốn PDF, đối chiếu extracted JSON và kiểm tra ô nguồn CafeF. Đầu vào CafeF chưa khai báo đủ đơn vị/phạm vi nên giữ tham chiếu, không thay số PDF.','',
            '| Mục | Kết quả |','|---|---|',
            f"| Mô hình | {family} |",f"| Phạm vi lợi nhuận | {p['scope']} |",f"| LN làm việc FY2025 | {f(p['prudentialWorkingCaseVnd'])} nghìn tỷ VND |",
            f"| Vốn mẹ/tham chiếu thành phần tại31/12/2025 | {f(capital)} nghìn tỷ VND; {bridge['basis']} |",
            f"| Khoảng kịch bản lợi nhuận trên vốn | {f(range_['minimumVnd'])}–{f(range_['maximumVnd'])} nghìn tỷ VND |",
            f"| Trường hợp tham chiếu cơ sở | {f(range_['baseVnd'])} nghìn tỷ VND |",'',
            '## Chọn và phản biện mô hình','',
            'Vốn không tăng trong mô hình; lợi nhuận được thử giữ nguyên ROE hoặc hội tụ dần về chi phí vốn giả định trong3/5/10 năm. Suất sinh lợi yêu cầu18/15/12% kế thừa bộ độ nhạy nghiên cứu cũ, không phải WACC quan sát hoặc thay ngưỡng BUY. Trường hợp tham chiếu dùng lợi nhuận đã chọn,15%, hội tụ5năm; đây là lựa chọn phân tích, không phải kết luận doanh nghiệp sẽ phục hồi hay suy giảm đúng như vậy. Nhánh giữ nguyên lợi nhuận được giữ để phản biện giả định hội tụ.','',
            'Giá trị là vốn kế toán cộng PV lợi nhuận thặng dư; đối chiếu phân phối ròng dùng cùng giả định nên chỉ là kiểm tra đại số. Vốn cuối kỳ thu hồi được, phân phối vốn, nợ xấu/goodwill và nghĩa vụ chưa định giá vẫn cần kiểm tra. Mô hình không cộng tiền hoặc trừ nợ/NCI lần hai. Không gọi vốn sổ sách là RNAV.','',
            '**Dòng tiền/vốn thực tế:** các lịch sử CFO, chi mua tài sản, vay/trả gốc và nguồn đã giữ được chuyển nguyên vào JSON cạnh hồ sơ. Không biến CFO hợp nhất thành FCFE mẹ, không tự phân bổ capex bằng tỷ lệ lợi nhuận.','']
        resolved_periods=sorted({x['originalPeriodKey'] for x in pdf_candidates if x['originalPeriodKey'].startswith('UNRESOLVED')})
        if resolved_periods:rows += [f"Binding kỳ extracted: giữ nhãn gốc {resolved_periods}, bổ sung niên độ31/12/2025 chỉ cho cột cuối kỳ trên trang đã kiểm tra; không đổi toàn bộ corpus hoặc lấy cột so sánh.",'']
        if any(x['sourcePageBindingLevel']=='ROW_PDF_EVIDENCE' for x in pdf_candidates):rows += ['Đã đọc schema trang ở row.pdfEvidence và khóa ngày 2025-12-31; tài liệu/số extracted có sẵn, không coi khác schema là thiếu dữ liệu.','']
        if not pdf_document_present:rows += ['PDF kiểm tra đang giữ chưa có biến thể tài liệu tương ứng trong display JSON. Bản đọc kiểm tra mới bổ sung đầu vào cho nghiên cứu, không coi thiếu variant là thiếu tài liệu gốc.','']
        if any(x.get('numericExtractionMatchesManual') is False for x in pdf_candidates):rows += ['Có số extracted NCI không khớp bản đọc PDF. Giữ bản extracted gốc trong sổ, dùng số PDF đã kiểm tra cho mô hình và không tự đưa lỗi OCR vào phép tính.','']
        differences=[x for x in numeric_diagnostics if x['relation']=='DIFFERENT_NUMERIC_MAGNITUDE_UNQUALIFIED']
        rows += [f"Đối chiếu CafeF: {len(api_candidates)} bản ghi ứng viên, {len(differences)} chênh lệch độ lớn số trong {len(numeric_diagnostics)} phép so sánh tham chiếu. Đơn vị/phạm vi API vẫn chưa được xác nhận nên không kết luận số giống nhau là đã khớp hoặc số khác là lỗi nhà cung cấp.",'']
        hist=result['cashOrCapital'].get('history',[])
        for h in hist:
            if h.get('year')==2025:
                rows += [f"FY2025 CFO hợp nhất: {f(h.get('cfo'))}; chi mua tài sản: {f(h.get('cashAcquisitionSpending'))}; sau chi mua tài sản: {f(h.get('reportedPostAcquisitionCash'))} nghìn tỷ VND. Chỉ là đối chiếu dòng tiền báo cáo.",'']
        if t in FINANCIAL:rows+=['Với ngân hàng/chứng khoán, nợ huy động/tài trợ là bộ phận hoạt động: dùng lợi nhuận trên vốn và kiểm tra khả năng phân phối thay vì DCF doanh nghiệp trừ tổng nợ. NPL/CAR/vốn khả dụng vẫn là điều kiện riêng; không suy ra100% lợi nhuận có thể trả cổ tức.','']
        if t in ('MSN','VHM','VPL'):rows+=['Đây là kiểm tra chéo lợi nhuận/vốn của nhóm hỗn hợp, **không phải RNAV/SOTP đã đủ dữ liệu**. Không cộng giá trị công ty con/dự án vào cùng kết quả và không suy ra giá trị kinh tế từng tài sản từ giá sổ sách.','']
        if t=='MSN':rows+=['MSN có cổ phiếu ưu đãi chuyển đổi1:1 và cam kết bù thiếu tiền theo điều kiện hợp đồng. Giữ kết quả trước phân bổ quyền ưu đãi/make-whole; giá trị cam kết chưa xác định, không coi bằng0. Kịch bản chuyển đổi không tự xóa cam kết.','']
        if t=='VIC':rows+=['VIC chưa có một mức lợi nhuận thuộc mẹ được xác định: chỉ thử hai đầu nhạy cảm của các khoản đã định danh, **không chọn trung điểm/cơ sở**. Vốn tham chiếu còn gồm quyền ưu đãi chưa định giá. Khoảng này không là giới hạn toàn bộ rủi ro hoặc giá trị cổ phiếu VIC.','']
        if t=='VJC':rows+=['Không chọn điểm định giá cơ sở cho VJC khi nhánh cốt lõi âm: hội tụ về ROE dương chỉ là thử phục hồi, không phải dự báo đã được bảo vệ. Nhánh hàng không cốt lõi âm được giữ nguyên. Giá trị âm trong phép thử là cảnh báo nhu cầu vốn/tính không phù hợp của giả định kéo dài, không phải giá cổ phiếu âm; không ép kết quả về0 hoặc mặc định phục hồi.','']
        if t=='BSR':rows+=['BSR: giữ riêng subtotal400/410 không khớp. Nhánh vốn dùng400 khớp tổng thành phần và tài sản trừ nợ, sau đó trừ NCI; không tuyên bố doanh nghiệp đã sửa subtotal/EPS. Phân phối quỹ cuối cùng vẫn chưa khép.','']
        if t=='GVR':rows+=['GVR: dùng vốn nhóm410 trừ NCI; nguồn kinh phí/quỹ khác430 được tách khỏi cơ sở vốn này. Phân phối cuối cùng và niên độ biến động quỹ giữ ngoại lệ riêng.','']
        if 'PROXY' in bridge['basis']:rows+=['Trang vốn không in riêng dòng NCI; tổng các thành phần đã đọc khớp subtotal. Dùng như proxy có điều kiện, không ghi NCI bằng0 hoặc xác nhận đầy đủ mọi quyền.','']
        market=result['marketReference']
        rows+=['## Cổ phần / ngày giá / hành động','',f"Giá lưu trong DB: {market['valueVnd']} VND, phiên {market['tradingDate']}; không phải báo giá hiện tại. Quyền/cổ phần theo ngày giá và nghĩa vụ đặc biệt chưa được cấp nghiệm thu. Không xuất giá mua/bán mới từ mẫu số nhà cung cấp.",'',
            '**Mua:** '+result['researchConditions']['buy'],'','**Giữ:** '+result['researchConditions']['hold'],'','**Bán/giảm:** '+result['researchConditions']['sell'],'',
            '**Kiểm chứng riêng:** '+result['researchConditions']['issuerChecksBeforeAction'],'','**Phản chứng còn mở:** '+p['counterevidenceAndRemainingWork'],'',
            'Tín hiệu hiện tại vẫn chưa xác định; không coi thiếu dữ liệu là HOLD mặc định. Thiếu giả định dự báo khác với thiếu tài liệu: vòng này đã khai thác nguồn vốn để tính tham chiếu, chưa khẳng định mọi vấn đề kinh tế đã khép.','',
            f"PDF kiểm tra: [{t} trang{c['source']['physicalPage']}](../../../../../../{c['source']['href']}). Dữ liệu extracted/API, raw pointer và hash: [sổ đối chiếu](../source-comparisons/{t}.json)."]
        (OUT/'issuers'/f'{t}.md').write_text('\n'.join(rows)+'\n')
    dump(OUT/'snapshot.json',dict(contract='vn30-investment-research-v2',issuerCount=30,newlyProcessedIssuers=19,previous11Unchanged=True,issuers=results,
        numericResearchRangeIsNotAcceptedFairValue=True,financialRulesOrWeightsChanged=False,productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False))
    dump(OUT/'source-review-summary.json',dict(contract='research19-source-review-summary-v2',issuerCount=19,sourcePagesVisuallyInspected=20,
        issuers=[dict(ticker=x['ticker'],pdfCandidateCount=len(x['pdfExtractedCandidates']),resolvedClosingPeriodBindings=sum(r['originalPeriodKey'].startswith('UNRESOLVED') for r in x['pdfExtractedCandidates']),rowLevelPageBindings=sum(r['sourcePageBindingLevel']=='ROW_PDF_EVIDENCE' for r in x['pdfExtractedCandidates']),extractionNumericExceptions=sum(r.get('numericExtractionMatchesManual') is False for r in x['pdfExtractedCandidates']),missingDisplayDocumentHandledByRetainedPdf=x['missingDisplayDocumentHandledByRetainedPdf'],cafefCandidateCount=len(x['cafefCandidates']),numericDifferences=sum(d['relation']=='DIFFERENT_NUMERIC_MAGNITUDE_UNQUALIFIED' for d in x['numericDiagnostics']),pdfOverwritten=False,comparisonIsFormalUnitScopeAdmission=False) for x in comparisons]))
    lines=['# Xử lý 19 mã còn lại — nghiên cứu FY2025 v2','',
        '**19/19 mã đã được rà nguồn vốn, NCI và mô hình tham chiếu.** Đã kiểm tra20 trang PDF đầy đủ, đối chiếu dữ liệu extracted và ô nguồn CafeF. Giữ 11 hồ sơ đã tính ở v1 nguyên trạng. Không cần hồ sơ mua bán cá nhân và không có yêu cầu cung cấp tài liệu bổ sung hàng loạt.','',
        'Kết quả mới là kịch bản có giả định từ lợi nhuận/vốn, không phải19 giá trị hợp lý đã nghiệm thu. Ngân hàng/chứng khoán dùng mô hình lợi nhuận thặng dư trên vốn; doanh nghiệp hoạt động dùng độ nhạy lợi nhuận/vốn; nhóm hỗn hợp giữ vai trò kiểm tra chéo kế toán, không mang tên RNAV/SOTP. VIC không có điểm cơ sở; kết quả âm giữ nguyên.','',
        '| Mã | Vốn tham chiếu sau cầu nối NCI | LN làm việc | Khoảng kịch bản | Cơ sở tham chiếu | Mô hình/vai trò |','|---|---:|---:|---|---:|---|']
    f=lambda x:format(number(x)/Decimal(10**12),'.3f') if x is not None else 'Không chọn'
    for x in results:
        if x['ticker'] not in TARGET:continue
        e=x['equityScenarioRange'];lines.append(f"| [{x['ticker']}](issuers/{x['ticker']}.md) | {f(x['commonBookReferenceVnd'])} | {f(x['earnings']['workingCaseVnd'])} | {f(e['minimumVnd'])}–{f(e['maximumVnd'])} | {f(e['baseVnd'])} | {x['researchModelFamily']} |")
    lines+=['','Đơn vị bảng: nghìn tỷ VND; số nguồn giữ native unit/precision. Khoảng chỉ bao các trường hợp lợi nhuận và chính sách lợi nhuận/vốn đã thử; không bao mọi quỹ, thuế, NCI, nợ xấu, khả năng thu hồi vốn hoặc quyền ưu đãi chưa xác định. Không dùng mức thấp như đáy rủi ro, không coi cao nhất là upside được xác nhận.','',
        '## Đã giải quyết trong vòng này','',
        '- Không còn lý do “chưa có mô hình cũ” để bỏ trống nghiên cứu 19 mã. Đã lập lựa chọn mô hình, phép tính và phản chứng theo hồ sơ từng mã.',
        '- Bổ sung binding cột cuối kỳ31/12/2025 cho các trang LPB/VHM/VIC đang mang nhãn UNRESOLVED-YEAR-C1; giữ cột so sánh tách biệt. Bổ sung đường đọc TCX với khóa ngày 2025-12-31 và trang ở từng dòng; không nhầm khác schema với thiếu tài liệu/dữ liệu. VHM có số extracted NCI sai độ lớn: dùng bản đọc PDF kiểm tra, không sửa âm thầm JSON gốc.',
        '- Đọc vốn nguồn thay vì tự coi TOTAL_EQUITY là vốn phổ thông. Tách NCI, phạm vi riêng, thành phần vốn không in NCI, nguồn kinh phí GVR và subtotal xung đột BSR.',
        '- CafeF được phát lại tới ô raw và hash; do thiếu đơn vị/phạm vi khai báo, giữ để so sánh tham chiếu, không chọn số dựa trên bằng nhau hoặc tự thay PDF.',
        '- Lợi nhuận v4 giữ nguyên; không dựng quỹ0, nhân thuế20% thêm, dùng tỷ lệ lợi nhuận làm sở hữu hoặc cộng/trừ tiền/nợ thêm.',
        '- MSN: đọc thêm trang điều khoản ưu đãi/chuyển đổi và cam kết bù thiếu; chưa định giá cam kết thì giữ unknown. VPL không mang quyền ưu đãi2026 về vốn FY2025.','',
        '## Phần chưa giải quyết bằng một phép tính','',
        'Khả năng thu hồi vốn kế toán, thời gian duy trì ROE, vốn thực sự phân phối, cash capex duy trì/mở rộng, giá trị cam kết/quyền ưu đãi và dữ liệu dự án nếu chọn RNAV vẫn cần phản biện. Những khoảng tham chiếu không thay thế kiểm chứng này. Tài liệu đang có cho phép tiến phân tích, không tự chứng minh giá trị kinh tế của mọi tài sản.','',
        'Giá vẫn là tham chiếu30/10/2026; cầu nối quyền/pha loãng và giá hiện tại chưa hoàn tất. Không xuất tín hiệu mua/giữ/bán hoặc giá/cổ phần mới cho 19 mã. Có thể hoàn thiện từng mã riêng; không cần chờ kỳ thuế 2026 hay cả 30 mã đồng thời.','',
        '## Phương pháp và nguồn','',
        'Mô hình tài chính tham khảo cấu trúc vốn cộng PV lợi nhuận thặng dư của [Damodaran — Valuing Financial Service Firms](https://pages.stern.nyu.edu/~adamodar/pdfiles/papers/finfirm09.pdf). Thời gian hội tụ3/5/10 năm là độ nhạy do nhà phân tích đặt; không phải dữ kiện doanh nghiệp hoặc kết quả được nguồn phương pháp xác nhận. Suất18/15/12% kế thừa bộ nghiên cứu cũ, không thay tiêu chí tài chính/trọng số.','',
        'Hồ sơ chi tiết19mã có PDF/trang, số native, NCI/thành phần, số liệu dòng tiền đã giữ, pointer extracted/API/raw và điều kiện mua/giữ/bán.11 mã trước giữ nguyên trong thư mục issuers. Snapshot mới chỉ bổ sung nghiên cứu, không thay receipt nghiệm thu số liệu hoặc authority.']
    (OUT/'REPORT.md').write_text('\n'.join(lines)+'\n')
    index=ROOT/'docs/fundamental-data-engine/governance/VN30_INVESTMENT_RESEARCH_INDEX.json'
    dump(index,dict(contract='vn30-investment-research-index-v1',currentVersion='investment-research-v2',
        snapshot=dict(path=rel(OUT/'snapshot.json'),sha256=sha(OUT/'snapshot.json')),
        reportPath=rel(OUT/'REPORT.md'),scope='DATED_CONDITIONAL_RESEARCH_NOT_PRODUCTION_ACCEPTANCE',
        issuerCount=30,new19Processed=True,prior11Preserved=True,acceptedFairValues=False,
        sourcePromotion=False,productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False))
    for path in [Path(__file__).resolve(),ROOT/'scripts/lib/research19.py',ROOT/'scripts/test-investment-research-v2.py']:pin(path)
    dump(OUT/'manifest.json',dict(contract='investment-research-v2-manifest',inputPins=pins,outputs={rel(p):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name not in ('manifest.json','VALIDATION.md','checked-capital-readings.json')},
        previousDatabaseHash=load(PRIOR/'manifest.json')['databaseReadOnlyHash'],currentResearchIndex=dict(path=rel(index),sha256=sha(index)),productionChanged=False))
    print(json.dumps(dict(issuers=30,new19=19,newScenarios=sum(len(x['modelScenarios']) for x in results if x['ticker'] in TARGET),prior11Preserved=True)))

if __name__=='__main__':build()
