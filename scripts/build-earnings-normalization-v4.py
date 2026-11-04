"""Reproducible FY2025 working earnings bridges for the retained 30 issuers.
No valuation, source admission or financial acceptance is granted by this builder.
"""
import hashlib
import json
from decimal import Decimal, getcontext
from pathlib import Path

getcontext().prec = 60
ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance'
PRIOR = BASE / '2026-11-02/earnings-normalization-v3'
DECISIONS = BASE / '2026-11-03/base-assumptions-v1'
OUT = BASE / '2026-11-04/earnings-normalization-v4'
TICKERS = 'ACB BID BSR CTG FPT GAS GVR HDB HPG LPB MBB MCH MSN MWG SAB SHB SSB SSI STB TCB TCX VCB VHM VIB VIC VJC VNM VPB VPL VRE'.split()
D = Decimal


def load(p):
    return json.loads(p.read_text())


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def number(s):
    if not isinstance(s, str):
        raise ValueError('DECIMAL_STRING_REQUIRED')
    n = D(s)
    if not n.is_finite():
        raise ValueError('FINITE_REQUIRED')
    return n


def txt(n):
    return format(n, 'f')


def verify(path, expected):
    if sha(ROOT/path) != expected:
        raise ValueError('SOURCE_PIN_MISMATCH:' + path)


def validate_reading(r, ticker):
    if r['ticker'] != ticker:
        raise ValueError('CROSS_ISSUER_BINDING')
    if r['fiscalYear'] not in (2023, 2024, 2025):
        raise ValueError('UNSUPPORTED_PERIOD_BINDING')
    if r['columnBinding'] != f"FY{r['fiscalYear']}_CURRENT":
        # A checked comparative is valid only with an explicit matching year.
        if str(r['fiscalYear']) not in r['columnBinding']:
            raise ValueError('AMBIGUOUS_COLUMN_BINDING')
    if number(r['sourceLexicalValue'])*number(r['currencyMultiplier']) != number(r['valueVnd']):
        raise ValueError('SOURCE_UNIT_OR_VALUE_MISMATCH')
    if r['review'] != 'FULL_PAGE_IMAGE_INSPECTED_BY_CHATGPT':
        raise ValueError('UNCHECKED_READING')
    verify(r['sourcePdf'], r['sourceHash'])


def calculate(common, adjustments, tax='0', weight='1'):
    t, w = number(tax), number(weight)
    if not (0 <= t <= 1 and 0 <= w <= 1):
        raise ValueError('INVALID_INCIDENCE')
    ids = [a['id'] for a in adjustments]
    if len(ids) != len(set(ids)):
        raise ValueError('DUPLICATE_ADJUSTMENT')
    return number(common) + sum((number(a['pretaxVnd'])*(1-t)*w for a in adjustments), D(0))


def envelope(common, adjustments, standalone):
    # Independent incidence for EACH named component; no offsetting common ratio.
    lo = hi = number(common)
    for a in adjustments:
        delta = number(a['pretaxVnd'])
        ends = [delta*(1-t)*w for t in (D(0), D('.2'))
                for w in ((D(1),) if standalone else (D(0), D(1)))]
        lo += min(ends)
        hi += max(ends)
    return dict(minimumVnd=txt(lo), maximumVnd=txt(hi), completeEconomicBound=False,
                taxEndpointsAreAssumptions=True, unknownFundsIncluded=False,
                independentCommonIncidencePerComponent=True)


POLICIES = {
 'ACB': ('Giữ chi phí tín dụng thực tế, bác addback dự phòng dương; quỹ 100 tỷ đã ở tử số nguồn, không trừ lại.', 'Chu kỳ tín dụng và tổn thất theo dân số khoản vay chưa được xác nhận đầy đủ.'),
 'FPT': ('Giữ lợi nhuận báo cáo sau quỹ đã biết; chưa có khoản loại trừ được xác định trong tập bằng chứng này. Giữ FX và chi phí vốn.', 'Chưa chứng minh rà soát bất thường đầy đủ; tăng trưởng dịch vụ không tự chứng minh lợi nhuận bền vững.'),
 'GAS': ('Loại hoàn nhập phải thu; giữ thu nhập tiền gửi, FX và chi phí tài chính.', 'Thuế/NCI của hoàn nhập và chu kỳ giá khí còn mở.'),
 'HPG': ('Loại lãi thanh lý ròng; bỏ hệ số 0,85 chưa được kiểm chứng. Giữ chi phí vốn, không trừ capex vào P&L.', 'Biên thép, công suất mới và chi phí vốn hóa chưa đủ để chốt lợi nhuận giữa chu kỳ; đây là FY2025 điều chỉnh, không phải mức giữa chu kỳ.'),
 'MBB': ('Không cộng lại dự phòng từ proxy; giảm thu hồi về bình quân hai năm; loại lãi thanh lý và hoàn nhập chi phí khác. Bỏ haircut quỹ 3% giả định.', 'Dân số khoản vay, quỹ cuối cùng, thuế/NCI và chu kỳ thu hồi còn mở.'),
 'MWG': ('Giữ lợi nhuận FY2025 với chi phí hoạt động thực tế; chưa có khoản loại trừ được xác định. Không ngoại suy phục hồi thành tăng trưởng vĩnh viễn.', 'Biên bán lẻ, đóng/mở chuỗi, phân bổ chi phí và chu kỳ chưa được kiểm chứng đầy đủ.'),
 'SSI': ('Ghép tài sản/chứng quyền đủ hai chân; loại kết quả chuyển nhượng ròng; trừ quỹ 244818160367 VND đúng một lần. Bỏ hệ số 0,85.', 'Chu kỳ giao dịch và biên cho vay ký quỹ còn mở; không coi lãi chưa thực hiện là tiền.'),
 'TCB': ('Floor chi phí khoản vay theo proxy ba năm, giữ dự phòng ngoài khoản vay; thu hồi dùng bình quân hai năm.', 'Proxy lịch sử không thay thế kiểm tra vintage/tài sản bảo đảm; thuế/NCI chưa xác định.'),
 'VCB': ('Floor khoản vay; thu hồi bình quân; loại hoàn nhập liên ngân hàng riêng, giữ chi phí trái phiếu doanh nghiệp.', 'Không bù rủi ro giữa dân số tài sản; floor ba năm chưa phải chu kỳ tín dụng hoàn chỉnh.'),
 'VHM': ('Loại thu nhập chấm dứt hợp đồng và toàn bộ chuyển nhượng đầu tư trong nhánh cốt lõi; nhánh giữ chuyển nhượng là phản biện riêng.', 'Chuyển nhượng có thể lặp lại trong phát triển dự án; bàn giao và thuế/NCI chưa ổn định. RNAV không phải điều kiện tính cầu nối lợi nhuận này.'),
 'VNM': ('Dùng báo cáo riêng: giữ quỹ đã trích, loại lãi thanh lý ròng và đưa khoản ghi có chi phí tài chính khác về 0. Giữ hỗ trợ nhà cung cấp lặp lại.', 'Không dùng thuế hợp nhất/NCI cho báo cáo riêng; không tái tính quỹ 10% trên lợi nhuận mô hình. Tính bền vững của khoản tài chính khác còn mở.'),
 'VPL': ('Giữ chi phí mua lại trái phiếu, không addback 50%; bỏ hệ số 0,85. Giữ lợi ích thuế báo cáo, đo loại lợi ích thuế như stress sau thuế riêng.', 'Hoạt động khách sạn/bất động sản/tài chính trộn lẫn; chưa chứng minh lợi ích thuế lặp lại hoặc chi phí mua lại không lặp lại.'),
 'VRE': ('Loại thu nhập chuyển nhượng vốn; giữ thuê trung tâm thương mại và thu nhập tài chính thông thường.', 'Thuế chuyển nhượng, phân bổ NCI và chu kỳ thuê chưa khép; không trừ tiền/nợ lần nữa trong lợi nhuận.'),
}


def build():
    pins = {}
    def pin(p):
        rel = str(p.relative_to(ROOT)); pins[rel] = sha(p)
        return dict(path=rel, sha256=pins[rel])
    # Verify immutable predecessor source pins before calculating any new result.
    pm = load(PRIOR/'manifest.json')
    for path, expected in pm['sourcePins'].items():
        verify(path, expected); pins[path] = expected
    verify(str((PRIOR/'checked-readings.json').relative_to(ROOT)), pm['checkedReadingsSha256'])
    for m in pm['members']:
        verify(str((PRIOR/m['path']).relative_to(ROOT)), m['sha256'])
    for output in load(DECISIONS/'manifest.json')['outputs']:
        verify(str((DECISIONS/output['path']).relative_to(ROOT)), output['sha256'])
    for path, expected in load(DECISIONS/'manifest.json')['inputPins'].items():
        verify(path, expected); pins[path] = expected
    held = BASE/'2026-11-02/held-normalization-v1/checked-inputs.json'
    readings = {r['id']:r for r in load(held)['readings']}
    pin(held); pin(PRIOR/'manifest.json'); pin(DECISIONS/'manifest.json')
    common_path = BASE/'2026-10-30/b6-economics-r3/checked-common-earnings.json'
    common_facts = {r['ticker']:r for r in load(common_path)['facts']}
    pin(common_path)
    vnm_parent_path = BASE/'2026-10-30/b6-underwriting-r4/vnm-parent-owner-cash-input.json'
    vnm_adjust_path = BASE/'2026-10-30/b6-underwriting-r4/vnm-specific-adjustment-input.json'
    vp, va = load(vnm_parent_path), load(vnm_adjust_path)
    for x in (vp,va):
        verify(x['source']['pdfPath'], x['source']['sha256'])
        pins[x['source']['pdfPath']] = x['source']['sha256']
    pin(vnm_parent_path); pin(vnm_adjust_path)
    vic_path = BASE/'2026-11-03/vic-parent-bridge-v1/decision.json'
    vic = load(vic_path); pin(vic_path)
    pin(BASE/'2026-11-03/vic-parent-bridge-v1/checked-evidence.json')
    for r in readings.values():
        verify(r['sourcePdf'], r['sourceHash']); pins[r['sourcePdf']] = r['sourceHash']
    profiles = []
    for ticker in TICKERS:
        source_path = PRIOR/'issuers'/f'{ticker}.json'
        p = load(source_path); binding = pin(source_path)
        common, scope = p['sourceCommonBridgeVnd'], p['scope']
        adjustments, alternatives, refs = [], [], []
        decision_path = DECISIONS/'issuers'/f'{ticker}.json'
        if decision_path.exists() and ticker != 'VIC':
            old = load(decision_path); pin(decision_path)
            common = old['sourceCommonBridgeVnd']
            adjustments = old['selectedAdjustments']
            choice, limitation = old['defense']['choice'], old['defense']['counterevidence']
            alternatives = old['operatingStressesWithinSelectedPolicy']
            refs = old['sourceReadingRefs']
            conditional_fund = old['fundBridgeIsConditionalPlan']
            fund_sensitivity = old['missingFundImpact']
        else:
            conditional_fund = False
            fund_sensitivity = dict(additionalUnidentifiedFundVnd=None,
                commonEarningsDeltaPerAdditionalUndeductedCommonFundVnd='-1')
            choice, limitation = POLICIES.get(ticker, ('VIC: không chọn điểm lợi nhuận thuộc mẹ khi phân bổ giao dịch chưa xác định.', 'Thuế, quyền cổ đông và phân bổ các khoản tài trợ/chuyển nhượng chưa khép.'))
            for case in p.get('modelChallenges', []):
                current = []
                for i,a in enumerate(case['pretaxAdjustmentIncidence']):
                    delta = number(a['pretaxVnd'])
                    if ticker in ('MBB','TCB','VCB') and delta > 0:
                        delta = D(0)
                    if ticker == 'VPL': delta = D(0)
                    if ticker == 'VHM' and 'VHM-2025-investmentTransferIncome' in a['sourceReadingIds']:
                        # Source amount, not twice a rounded model adjustment.
                        delta = -number(readings['VHM-2025-investmentTransferIncome']['valueVnd']) if case['name']=='BASE' else delta
                    current.append(dict(id=f'{ticker}-{i}', pretaxVnd=txt(delta),
                        reason=a['reason'], readingIds=a['sourceReadingIds']))
                alternatives.append(dict(name=case['name'], adjustments=current,
                    oldUnqualifiedCycleFactorNotApplied=True, fullCycleQualified=False))
                if case['name']=='BASE': adjustments = current
            ids = {r for a in adjustments for r in a['readingIds']}
            refs = [readings[r] for r in sorted(ids)]
            for r in refs: validate_reading(r,ticker)
        if ticker == 'VNM':
            scope = 'STANDALONE'
            values = vp['valuesByYear']['2025']
            common = txt(number(values['npat'])-number(values['fundAccrued']))
            disposal = number(va['disposalIncomeFY2025'])-number(va['disposedAssetCarryingFY2025'])
            finance_credit = number(va['signedOtherFinanceCostByYear']['2025'])
            adjustments = [dict(id='VNM-net-disposal',pretaxVnd=txt(-disposal),
                operandBinding=dict(**pin(vnm_adjust_path),jsonPointer='/disposalIncomeFY2025'),
                subtractOperandPointer='/disposedAssetCarryingFY2025'),
                dict(id='VNM-other-finance-credit-to-zero',pretaxVnd=txt(finance_credit),
                operandBinding=dict(**pin(vnm_adjust_path),jsonPointer='/signedOtherFinanceCostByYear/2025'))]
            refs = [dict(source=vp['source'], binding=pin(vnm_parent_path)),dict(source=va['source'],binding=pin(vnm_adjust_path))]
            alternatives = [dict(name='RETAIN_FINANCE_CREDIT',adjustments=adjustments[:1]),
                dict(name='REPEAT_2024_FINANCE_EXPENSE',adjustments=[adjustments[0],
                dict(id='VNM-other-finance',pretaxVnd=txt(finance_credit-number(va['signedOtherFinanceCostByYear']['2024'])))])]
        working = txt(calculate(common,adjustments)) if ticker!='VIC' else None
        env = envelope(common,adjustments,scope=='STANDALONE') if ticker!='VIC' else vic['unconditionalNamedComponentsEnvelope']
        for case in alternatives:
            if 'adjustments' in case:
                case['valueAtAdverseIncidenceVnd'] = txt(calculate(common,case['adjustments']))
                case['incidenceEnvelope'] = envelope(common,case['adjustments'],scope=='STANDALONE')
        result = dict(contract='vn30-working-earnings-bridge-v4', ticker=ticker, period='FY2025',
            analysisMode='AS_REVISED_CURRENT_RESEARCH', scope=scope, sector=p['sector'],
            classification='CONDITIONAL_ADJUSTED_FY2025_NOT_ACCEPTED_SUSTAINABLE_EARNINGS',
            reportedCommonReferenceVnd=p['originalReportedCommonVnd'],
            referenceScope=p['scope'], sourceCommonBridgeVnd=common,
            sourceFundStatus=p['sourceFundStatus'], priorAdditionalKnownFundDeductions=p['additionalKnownFundDeductions'],
            fundBridgeApplication='ALREADY_IN_SOURCE_COMMON_BRIDGE_DO_NOT_SUBTRACT_AGAIN',
            changeFromV3SourceCommonBridgeVnd=txt(number(common)-number(p['sourceCommonBridgeVnd'])),
            fundBridgeIsConditionalPlan=conditional_fund, unknownAdditionalFundVnd=None,
            fundCompletenessProven=False, fundSensitivity=fund_sensitivity,
            selectedPretaxAdjustments=adjustments, prudentialWorkingCaseVnd=working,
            taxAssumption='0', commonIncidenceAssumption='1',
            incidenceConvention='ADVERSE_NAMED_ADJUSTMENTS_ONLY_NOT_PROVEN_TAX_OR_OWNERSHIP',
            namedAdjustmentIncidenceEnvelope=env, operatingAlternatives=alternatives,
            baseChoice=choice, counterevidenceAndRemainingWork=limitation,
            completeCycleQualified=False, exhaustiveOneOffCoverageProven=False,
            sourceProfile=binding, sourceReadings=refs,
            reportedNumeratorEvidence=common_facts[ticker],
            accountingConflictDisposition=p.get('accountingConflictDisposition'),
            cycleReview=p['cycleReview'],
            acceptedNormalizedCommonEarningsVnd=None, acceptedEps=None,
            acceptanceDecision='DEFER_SUSTAINABLE_EARNINGS_ACCEPTANCE',
            valuationOrRnavRequiredForThisBridge=False,
            financialCriteriaOrWeightsChanged=False, sourceAdmissionGranted=False,
            productionScoringAuthorized=False, navAuthorized=False, tradingAuthorized=False)
        if decision_path.exists() and ticker!='VIC':
            result['selectedFundReviewBinding'] = old['fundReviewProfile']
        if ticker=='VNM':
            result['standaloneFundAccruedDeductedOnceVnd']=vp['valuesByYear']['2025']['fundAccrued']
            result['consolidatedReferenceIsNotModelInput']=True
        if ticker=='VPL':
            result['separatePostTaxStress'] = dict(name='REMOVE_REPORTED_GROUP_TAX_BENEFIT_ALL_COMMON_HYPOTHESIS',
                deltaVnd='-84861000000', resultVnd=txt(number(common)-D('84861000000')),
                recurrenceOrAttributionProven=False, applySecondTaxDiscount=False)
        if ticker=='VIC':
            result['sourceCommonBridgeVnd']=vic['claims']['distributableNumeratorVnd']
            result['namedComponents']=vic['components']
            result['groupPretaxDiagnosticVnd']=vic['partialGroupPbtAfterAlsoMovianVnd']
            result['laterVicEvidenceBinding']=pin(vic_path)
            result['acceptanceDecision']='NO_IDENTIFIABLE_COMMON_EARNINGS_POINT'
            result['licenseSettlementIsNotAdditionalFullPnlDeduction']=True
        profiles.append(result)
    def dump(path,obj):
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
    for p in profiles: dump(OUT/'issuers'/f"{p['ticker']}.json",p)
    snapshot = dict(contract='vn30-working-earnings-snapshot-v4',period='FY2025',
        issuerCount=len(profiles),conditionalWorkingPoints=sum(p['prudentialWorkingCaseVnd'] is not None for p in profiles),acceptedSustainablePoints=0,
        noUniverseProfitTotalBecauseScopesAndCrossOwnershipOverlap=True, issuers=profiles)
    dump(OUT/'snapshot.json',snapshot)
    lines=['# Chuẩn hóa lợi nhuận FY2025 — 30 mã giữ lại', '',
        'Mức làm việc dưới đây là lợi nhuận FY2025 đã điều chỉnh theo các khoản được định danh, chưa phải dự báo lợi nhuận bền vững được nghiệm thu. Có 29 điểm tính có điều kiện; VIC giữ khoảng nhạy cảm. Không cộng tổng vì phạm vi và sở hữu chéo chồng lấn.', '',
        'Đơn vị bảng: tỷ VND, làm tròn 3 chữ số; JSON giữ số thập phân chính xác. Mức thận trọng không ghi nhận lợi ích thuế khi loại thu nhập và giả định tác động toàn bộ vào cổ đông mẹ. Đây là quy ước thử rủi ro, không phải thuế/sở hữu đã chứng minh. Khoảng nhạy cảm chỉ bao các khoản đã định danh, không bao quỹ còn thiếu hay toàn bộ chu kỳ.', '',
        '| Mã | Phạm vi | Tử số nguồn sau cầu nối quỹ | FY2025 điều chỉnh có điều kiện | Quyết định cơ sở | Còn phải kiểm chứng |',
        '|---|---|---:|---:|---|---|']
    for p in profiles:
        f=lambda s: format(number(s)/D(10**9),'.3f') if s is not None else 'Không chọn điểm'
        lines.append(f"| {p['ticker']} | {p['scope']} | {f(p['sourceCommonBridgeVnd'])} | {f(p['prudentialWorkingCaseVnd'])} | {p['baseChoice']} | {p['counterevidenceAndRemainingWork']} |")
    lines += ['', '## Những thay đổi trong vòng này', '',
        '- Hoàn thiện quyết định cơ sở cho 13 mô hình cũ và nối 17 quyết định đã có vào cùng snapshot 30 mã. Bỏ addback dự phòng dương, haircut quỹ suy đoán và hệ số chu kỳ chung không được kiểm chứng ở 13 mô hình cũ; giữ các khoản nguồn/chi phí thực tế và phản biện riêng.',
        '- VNM dùng báo cáo riêng, giữ quỹ đã trích đúng một lần; số hợp nhất chỉ là tham chiếu. SSI giữ cầu nối quỹ đã biết; VHM dùng nhánh cốt lõi loại toàn bộ chuyển nhượng và giữ nhánh phản biện.',
        '- VIC dùng cầu nối mới gồm tài trợ, Novatech và Movian từ hồ sơ VIC; không dùng lại mô hình chỉ loại tài trợ, không áp tỷ lệ lợi nhuận làm sở hữu, không trừ tổng phí giấy phép lần hai.',
        '- BSR/GVR: giữ nguyên chênh lệch nguồn và quyết định phân loại trong hồ sơ v3/quỹ; phép tính cơ sở không đồng nghĩa đã khép quỹ cuối cùng. Xem accountingConflictDisposition ở nguồn được ghim.', '',
        '## Phạm vi nghiệm thu', '',
        'Hoàn tất bảng tính và quyết định làm việc có nguồn cho 30/30 mã. Chưa nâng bất kỳ mức nào thành lợi nhuận bền vững được nghiệm thu. Cần kiểm chứng riêng chu kỳ, độ đầy đủ khoản bất thường, thuế giao dịch, NCI và quỹ theo từng hồ sơ. HPG/MWG vẫn thiếu mô hình biên giữa chu kỳ; bỏ hệ số tùy ý không giải quyết khoảng thiếu này. Không yêu cầu RNAV/SOTP để tính cầu nối lợi nhuận, nhưng bảng này cũng không nghiệm thu RNAV, EPS, giá trị/cổ phần hay lệnh mua/bán.', '',
        'Không thay đổi tiêu chí, trọng số, hồ sơ nguồn cũ, DB, source admission, NAV hoặc quyền giao dịch. Các kịch bản không phải bút toán hay số tài chính được công ty công bố.']
    (OUT/'REPORT.md').write_text('\n'.join(lines)+'\n')
    pin(Path(__file__).resolve())
    pin(ROOT/'scripts/test-earnings-normalization-v4.py')
    outputs={str(p.relative_to(OUT)):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name!='manifest.json' and p.name!='VALIDATION.md'}
    dump(OUT/'manifest.json',dict(contract='vn30-working-earnings-manifest-v4',inputPins=pins,outputs=outputs))


if __name__=='__main__':
    build()
