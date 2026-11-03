"""Select/defend FY2025 cases for 17 issuers without changing acceptance rules."""
import hashlib
import json
from copy import deepcopy
from decimal import Decimal, getcontext
from pathlib import Path
from lib.base_assumptions import number, text, earnings, independent_envelope, choose_adjustments

getcontext().prec = 60
ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance'
PRIOR = BASE / '2026-11-02/earnings-normalization-v3'
FUND = BASE / '2026-11-03/normalization-acceptance-v1'
OUT = BASE / '2026-11-03/base-assumptions-v1'
TICKERS = 'BID BSR CTG GVR HDB LPB MCH MSN SAB SHB SSB STB TCX VIB VIC VJC VPB'.split()


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path):
    return json.loads(path.read_text())


def verify_pin(path, expected):
    if sha(path) != expected:
        raise ValueError('PINNED_INPUT_OR_SOURCE_CHANGED:' + str(path))


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


DEFENSE = {
 'BID': ('Dùng chi phí tín dụng tổng cao hơn giữa FY2025 và proxy lịch sử theo tài sản; hạ thu hồi nợ về bình quân hai năm; loại hoàn nhập đầu tư.',
         'Thu hồi FY2025 tăng mạnh nên không ngoại suy nguyên trạng. Phép floor không tạo lợi nhuận do giảm dự phòng.',
         'Cơ cấu tài sản không thay thế dân số khoản vay; quỹ EPS đã trừ khác phương án mẹ. Không thể chốt dự phòng bền vững từ floor này.'),
 'CTG': ('Giữ floor tín dụng, bình quân thu hồi hai năm; tách hoàn nhập đầu tư và kết quả thanh lý ròng đã có dòng nguồn.',
         'Không giữ toàn bộ thu hồi nợ cao ở FY2025 và không loại chi phí thu hồi đang nằm trong P&L.',
         'Floor lịch sử tạo điều chỉnh lớn; phương án quỹ mẹ có lợi nhuận năm trước và còn điều kiện phê duyệt, chưa đại diện quỹ cả nhóm.'),
 'HDB': ('Giữ nguyên dự phòng FY2025, không nhận addback dương từ proxy; giảm thu hồi nợ theo bình quân hai năm; dùng nhánh quỹ mẹ 55 tỷ.',
         'Tín dụng/thành phần công ty con thay đổi nên giảm dự phòng từ tỷ lệ tài sản có thể tạo lợi nhuận không đủ căn cứ.',
         '30 tỷ HĐQT/BKS chưa khớp P&L/sổ; 104354 triệu quỹ con chưa phân loại; tổng bảng còn lệch 1 triệu.'),
 'LPB': ('Báo cáo riêng: floor tín dụng và bình quân thu hồi nợ; không gán thêm NCI hay trừ quỹ dự trữ vốn/cổ tức.',
         'Giữ phạm vi pháp nhân nhất quán; tách kỳ và độ chính xác của phương án phân phối khỏi EPS triệu đồng.',
         'Không có dòng quỹ nhân viên trên một bảng không chứng minh quỹ bằng 0; floor chưa qua kiểm chứng dân số tín dụng.'),
 'SHB': ('Floor tín dụng, giảm thu hồi nợ về bình quân hai năm và loại hoàn nhập chứng khoán.',
         'Thu hồi nợ FY2025 đột biến không được coi là tốc độ sinh lời lâu dài; không thêm một hệ số chu kỳ chung nữa.',
         'Bình quân hai năm không bao trọn chu kỳ; tờ trình phân phối được duyệt nhưng chưa ghép bảng số đầy đủ.'),
 'SSB': ('Giữ dự phòng và thu hồi FY2025, không nhận hai addback từ bình quân; loại lãi PTF và hoàn nhập; thay quỹ ước tính bằng phần mẹ 275 tỷ.',
         'PTF là giao dịch cụ thể cần tách khỏi hoạt động lặp lại; không nhân khoản PTF với tỷ lệ lợi nhuận mẹ/nhóm.',
         'Thuế thương vụ PTF có ảnh hưởng lớn; phần quỹ con 66 triệu và bù chi phí 2162 triệu chưa phân loại xong.'),
 'STB': ('Giữ nguyên dự phòng FY2025; không cộng lại 4864 tỷ từ proxy. Giảm thu hồi về bình quân hai năm.',
         'Q&A ĐHĐCĐ cảnh báo dự phòng có thể tiếp tục cao, là phản chứng trực tiếp với addback dự phòng.',
         'Chưa có cơ sở dự báo mức chi phí tín dụng sau tái cơ cấu hay khả năng phân phối vốn; bảng quỹ cuối cùng chưa ghép.'),
 'VIB': ('Floor tín dụng và thu hồi nợ hai năm, giữ chi phí phái sinh/FX; trừ quỹ thưởng mẹ 150 tỷ trong nhánh kế hoạch.',
         'Không xóa lỗ phái sinh để tăng lợi nhuận và không coi toàn bộ thu hồi nợ là lặp lại.',
         'Chưa có dân số khoản vay/độ trễ tổn thất phù hợp; quỹ đã được duyệt chưa chứng minh toàn bộ phạm vi đã phản ánh đúng một lần.'),
 'VPB': ('Floor tín dụng toàn nhóm, giảm thu hồi hai năm, loại hoàn nhập và kết quả thanh lý ròng; trừ quỹ thưởng/phúc lợi 200 tỷ.',
         'Giữ chi phí tín dụng cao hơn giữa hiện tại và tham chiếu; tránh dùng lợi nhuận mẹ/nhóm làm tỷ lệ sở hữu tài chính tiêu dùng.',
         'Cơ cấu ngân hàng/tài chính tiêu dùng thay đổi; floor theo tài sản tổng vẫn là giả định trọng yếu chưa được kiểm chứng.'),
 'BSR': ('Dùng trung bình hai biên gộp FY2024–2025 áp lên doanh thu FY2025; loại bồi thường hợp đồng. Giữ nhánh quỹ Q3 có ghi rõ FY2025.',
         'Hai năm thể hiện chênh lệch biên rất lớn; chọn trung bình giảm phụ thuộc riêng năm thuận lợi, không gọi là trung bình toàn chu kỳ.',
         '2022–2023 có biên lợi nhuận ròng cao hơn, nhưng không đồng nhất với biên gộp. Tử số dẫn xuất/quỹ cuối cùng vẫn cần đủ điều kiện nghiệm thu.'),
 'GVR': ('Giữ thu nhập thanh lý cây như hoạt động luân canh; chọn trung bình hai năm phần thu, giữ chi phí; loại phần bồi thường chưa ghép giao dịch.',
         'Không xóa hết thanh lý cây như bất thường và không cộng lại chi phí khoa học đã hạch toán.',
         'Bình quân tổng thu không phải dòng tiền ròng; bồi thường có thể gắn chi phí/đất khác kỳ; quỹ mẹ mới có số làm tròn.'),
 'MCH': ('Giữ 100% lãi bên liên quan đã báo cáo trong mức cơ sở, giữ toàn bộ chi phí vốn/dự phòng; bỏ haircut 50% không có bằng chứng.',
         'Chưa thấy bằng chứng định lượng để coi đúng một nửa lãi không thu được. Rủi ro 0–100% được đo riêng, không suy ra lãi đã thu tiền.',
         'Chưa khép khả năng thu hồi, điều kiện khoản vay và quỹ cuối cùng; số dư quỹ không phải khoản trích trong năm.'),
 'MSN': ('Loại lãi thanh lý cụ thể; dùng trung bình hai mức chi phí xóa sổ đã báo cáo, không cộng lại toàn bộ như chi phí một lần.',
         'Xóa sổ xuất hiện ở hai năm, nên không thể mặc định biến mất trong năm bình thường.',
         'Hai năm không đủ mô hình từng mảng; NCI/thuế công ty liên kết và phân phối quỹ chưa khép.'),
 'SAB': ('Loại lãi mua rẻ và 100% hoàn nhập dự phòng đầu tư; giữ lãi tiền gửi và chi phí đầu tư.',
         'Lãi mua rẻ gắn thương vụ; chưa có chứng cứ hoàn nhập tạo lợi nhuận lặp lại để giữ 50%.',
         'Thuế/NCI thương vụ chưa xác định. Phương án quỹ mẹ làm tròn và quỹ xã hội chưa đối chiếu với EPS hợp nhất chính xác.'),
 'TCX': ('Ghép đủ đánh giá lại tài sản và chứng quyền; chọn trung bình hai năm lợi nhuận giao dịch đã thực hiện ròng; giữ chi phí margin và dự phòng.',
         'Không dùng doanh thu bán chứng khoán thay lãi ròng hoặc loại một chân của chứng quyền.',
         'Hai năm thị trường không chứng minh chu kỳ đầy đủ; quỹ/thưởng hiệu quả và chênh 1 VND vẫn cần xử lý theo nguồn.'),
 'VIC': ('Bác việc chọn một mức lợi nhuận cơ sở thuộc mẹ. Chỉ tính phép thử loại toàn bộ tài trợ, giữ chi phí xóa sổ FY2025.',
         'Tài trợ chủ yếu ở VinFast; tỷ lệ lợi nhuận mẹ/nhóm >1 không dùng được để phân bổ. Không có cơ sở chọn giữa 0% và 100% cho cổ đông mẹ.',
         'Chỉ riêng phân bổ tài trợ làm kết quả đổi dấu; thiếu SOTP/giao dịch và quỹ không thể khắc phục bằng chọn trung điểm.'),
 'VJC': ('Chọn nhánh hàng không cốt lõi, giữ 0% biên bán tàu bay và loại hỗ trợ/hoàn nhập; giữ chi phí và nghĩa vụ thuê.',
         'Không có cơ sở chọn giữ đúng 50% biên bán tàu bay. Mô hình tài trợ đội bay lặp lại là nhánh phản biện riêng, không bị xóa khỏi hồ sơ.',
         'Nhánh cốt lõi âm, nhánh giữ biên có thể dương; thuế pháp nhân nước ngoài và tính kinh tế bán/thuê lại chưa khép. Không ép lợi nhuận về 0.'),
}


def impact_funds(ticker, prior_fund, checked, case):
    """Named-category counterfactuals only, never an invented full fund bound."""
    result = dict(additionalUnidentifiedFundVnd=None, unboundedMissingFund=True,
                  commonEarningsDeltaPerAdditionalUndeductedCommonFundVnd='-1',
                  additionalCommonFundToErasePositiveCaseVnd=text(case) if case > 0 else None,
                  namedCounterfactuals=[], notFinancialEventsOrApprovedCorrections=True)
    def add(name, delta, why):
        result['namedCounterfactuals'].append(dict(name=name, changeFromSelectedCaseVnd=text(delta),
            resultingCaseVnd=text(case+delta), caveat=why))
    if ticker == 'SSB':
        add('KNOWN_SUBSIDIARY_WELFARE_ALL_COMMON', Decimal('-66000000'), 'Giả định tối đa phần 66 triệu đã biết thuộc mẹ; chưa chứng minh sở hữu, không bao toàn bộ quỹ còn thiếu.')
        add('EXPENSE_OFFSET_IF_NOT_ALREADY_PNL', Decimal('-2162000000'), 'Chỉ nếu khoản bù chi phí là mất mát bổ sung chưa hạch toán; không mặc định trừ lại chi phí.')
    elif ticker == 'HDB':
        add('KNOWN_SUBSIDIARY_CATEGORY_ALL_NONOWNER_COMMON', Decimal('-104354000000'), 'Trường hợp toàn bộ dòng quỹ con đã biết là khoản ngoài cổ đông thuộc mẹ; không phải phân loại đã chứng minh.')
        add('BOARD_FUND_ALREADY_PNL', Decimal('30000000000'), 'Nếu 30 tỷ đã hạch toán P&L thì phải bỏ phép trừ mới, không cộng vào thu nhập báo cáo như lợi ích mới.')
        result['sourcePresentationDifferenceVnd'] = '1000000'
    elif ticker == 'CTG':
        add('PARENT_PLAN_IF_ALL_ADDITIONAL_COMMON_FY2025', -Decimal(checked[ticker]['values']['rewardWelfare'])*1000000,
            'Giả định cầu nối đúng niên độ và được duyệt; kế hoạch mẹ có điều chỉnh năm trước, không phải số quỹ hợp nhất đầy đủ.')
    elif ticker == 'BID':
        # Do not treat the numerical parent/group difference as a correction.
        result['nonComparableParentVsExistingGroupDeductionDifferenceVnd'] = text(Decimal('3446462000000')-Decimal(checked[ticker]['values']['rewardWelfare'])*1000000)
        result['differenceIsCorrection'] = False
    elif ticker == 'SAB':
        # A nominal exercise, not a rounding interval or matched group bridge.
        nominal = Decimal('131028135557')-Decimal(checked[ticker]['values']['actual2025RewardWelfare'])*1000000000
        add('NOMINAL_PARENT_WELFARE_REPLACES_GROUP_ESTIMATE', nominal, 'Sai khác phạm vi/độ chính xác chưa khép; số danh nghĩa này không phải correction hoặc biên sai số làm tròn.')
        add('PLUS_SOCIAL_FUND_IF_ADDITIONAL_COMMON', nominal-Decimal(checked[ticker]['values']['actual2025SocialFund'])*1000000000,
            'Chỉ nếu quỹ xã hội là mất mát bổ sung chưa nằm trong P&L/quỹ EPS và thuộc mẹ.')
    elif ticker == 'BSR':
        add('ALTERNATIVE_H1_SPLIT', Decimal('1'), 'Chênh 1 VND được giữ theo hai nhánh nguồn; không là khoản bù.')
    elif ticker == 'GVR':
        result['parentPlanNominalVnd'] = '30130000000'
        result['displayResolutionVndNotRoundingErrorBound'] = '10000000'
    return result


def build():
    # Preserve and verify predecessor outputs and their retained original sources.
    pm, fm = load(PRIOR/'manifest.json'), load(FUND/'manifest.json')
    pins = dict(pm['sourcePins'])
    for pin in fm['inputPins']:
        if pin['path'] in pins and pins[pin['path']] != pin['sha256']:
            raise ValueError('CONFLICTING_PREDECESSOR_PIN')
        pins[pin['path']] = pin['sha256']
    for path, expected in pins.items():
        verify_pin(ROOT/path, expected)
    verify_pin(PRIOR/'checked-readings.json', pm['checkedReadingsSha256'])
    verify_pin(FUND/'snapshot.json', fm['snapshotSha256'])
    for member in pm['members']:
        verify_pin(PRIOR/member['path'], member['sha256'])
    for path in [PRIOR/'manifest.json', PRIOR/'checked-readings.json', FUND/'manifest.json', FUND/'snapshot.json',
                 Path(__file__).resolve(), ROOT/'scripts/lib/base_assumptions.py', ROOT/'scripts/test-base-assumption-decisions.py']:
        pins[str(path.relative_to(ROOT))] = sha(path)
    readings = {r['id']: r for r in load(PRIOR/'checked-readings.json')['readings']}
    checked = {r['ticker']:r for r in load(FUND/'checked-appropriations.json')['rows']}
    fund = {r['ticker']:r for r in load(FUND/'snapshot.json')['issuers']}
    for ticker in TICKERS:
        if fund[ticker] != load(FUND/'issuers'/f'{ticker}.json'):
            raise ValueError('FUND_PROFILE_SNAPSHOT_DIVERGENCE')
    profiles = []
    for ticker in TICKERS:
        pp = PRIOR/'issuers'/f'{ticker}.json'
        p = load(pp)
        pins[str(pp.relative_to(ROOT))] = sha(pp)
        selected = choose_adjustments(p)
        evidence_refs = []
        for a in selected:
            refs = a['readingIds']
            for ref in refs:
                r = readings[ref]
                if r['ticker'] != ticker:
                    raise ValueError('CROSS_ISSUER_SOURCE_BINDING')
                evidence_refs.append(dict(id=ref, pdfPath=r['pdfPath'], sha256=r['pdfSha256'],
                    href=r['href'], physicalPage=r['physicalPage'], economicPeriod=r['period'],
                    sourceUnit=r['unit'], nativeValue=r['lexicalValue'], multiplier=r['multiplier']))
            a['derivationBinding'] = dict(path=str(pp.relative_to(ROOT)), sha256=sha(pp),
                jsonPointer='/creditNormalization' if a['id'].endswith('total-credit-proxy') else '/scenarios')
            # Synthetic axes in v3 still have direct operands; attach those here.
            keys = {'BSR-reported-refining-margin-stress':['grossProfit2025','grossProfit2024','revenue2025','revenue2024'],
                'GVR-routine-rubber-tree-income-cycle':['rubberTreeDisposalIncome','rubberTreeDisposalIncome2024'],
                'MCH-related-party-interest-collection-stress':['relatedPartyLoanInterest'],
                'MSN-recurring-restructuring-cost-stress':['assetDisposalWriteoffLoss','assetDisposalWriteoffLoss2024'],
                'VIC-recurring-restructuring-cost-stress':['assetDisposalWriteoffLoss','assetDisposalWriteoffLoss2024']}.get(a['id'],[])
            a['additionalOperandReadingIds'] = [ticker+'-FY2025-'+k for k in keys]
            for ref in a['additionalOperandReadingIds']:
                r = readings[ref]
                evidence_refs.append(dict(id=ref, pdfPath=r['pdfPath'], sha256=r['pdfSha256'], href=r['href'],
                    physicalPage=r['physicalPage'], economicPeriod=r['period'], sourceUnit=r['unit'],
                    nativeValue=r['lexicalValue'], multiplier=r['multiplier']))
        preview = fund[ticker]['fundPlanPreview']
        common = preview['commonBridgePreviewVnd'] if preview else p['sourceCommonBridgeVnd']
        # An adverse incidence convention, not a claim about legal tax or ownership.
        tax, weight = '0','1'
        max_tax = text(max(map(number,p['assumedMarginalTaxRates'])))
        case = earnings(common, selected, tax=tax, common_weight=weight)
        prior_base = next(s for s in p['scenarios'] if s['name']=='BASE')
        prior_same_incidence = earnings(common,prior_base['adjustments'],tax=tax,common_weight=weight)
        incidence = independent_envelope(common,selected,max_tax=max_tax,standalone=p['scope']=='STANDALONE')
        taxes = [earnings(common,selected,tax=t,common_weight=weight) for t in ['0',max_tax]]
        tax_only = dict(minimumVnd=text(min(taxes)),maximumVnd=text(max(taxes)),
            impactWidthVnd=text(max(taxes)-min(taxes)), selectedTax='0',alternativeTax=max_tax,
            taxRatesAreAssumptionsNotTransactionFacts=True)
        attr = independent_envelope(common,selected,max_tax='0',standalone=p['scope']=='STANDALONE')
        attr['impactWidthVnd'] = text(number(attr['maximumVnd'])-number(attr['minimumVnd']))
        # Kept as disputed alternatives, including proxy addbacks rejected above.
        alternatives = []
        policy_stresses = []
        for scenario in p['scenarios']:
            value = earnings(common,scenario['adjustments'],tax=tax,common_weight=weight)
            envelope = independent_envelope(common,scenario['adjustments'],max_tax=max_tax,standalone=p['scope']=='STANDALONE')
            alternatives.append(dict(name=scenario['name'], valueAtSelectedIncidenceVnd=text(value),
                changeFromSelectedCaseVnd=text(value-case), assumedCycleAxes=scenario['assumedCycleAxes'],
                knownAxesEnvelope=envelope, selectionQualified=False))
            aa = deepcopy(scenario['adjustments'])
            for a in aa:
                if p['sector']=='BANK' and (a['id'].endswith('total-credit-proxy') or a['id'].endswith('recoveries-mean')):
                    a['pretaxVnd'] = text(min(Decimal(0),number(a['pretaxVnd'])))
                if ticker in ['SAB','VJC','VIC']:
                    a['pretaxVnd'] = next(x['pretaxVnd'] for x in selected if x['id']==a['id'])
            envelope = independent_envelope(common,aa,max_tax=max_tax,standalone=p['scope']=='STANDALONE')
            policy_stresses.append(dict(name=scenario['name'],knownAxesEnvelope=envelope,
                adjustments=[dict(id=a['id'],pretaxVnd=a['pretaxVnd']) for a in aa],
                selectedPolicyApplied=True,fullCycleQualified=False))
        minima = [number(a['knownAxesEnvelope']['minimumVnd']) for a in policy_stresses]+[number(incidence['minimumVnd'])]
        maxima = [number(a['knownAxesEnvelope']['maximumVnd']) for a in policy_stresses]+[number(incidence['maximumVnd'])]
        lo,hi = min(minima),max(maxima)
        total = dict(minimumVnd=text(lo),maximumVnd=text(hi),widthVnd=text(hi-lo),
            signChangesAcrossKnownCases=lo < 0 < hi, coversUnknownFundsOrAllFutureCycles=False)
        claim, support, counter = DEFENSE[ticker]
        selected_point = None if ticker=='VIC' else text(case)
        # No new materiality threshold; unbounded gaps are not made immaterial by assumption.
        decision = 'REJECT_UNIDENTIFIED_COMMON_POINT' if ticker=='VIC' else 'DEFER_FINAL_FINANCIAL_ACCEPTANCE'
        blockers = [x for x in fund[ticker]['blockers'] if x!='NO_QUALIFIED_SELECTED_ESTIMATE']
        blockers.append('SELECTED_PRUDENTIAL_CASE_NOT_YET_QUALIFIED_AS_SUSTAINABLE_ESTIMATE')
        if ticker=='VIC':
            blockers.append('MATERIAL_COMMON_ATTRIBUTION_CHANGES_SIGN')
        if ticker=='VJC':
            blockers.append('CORE_VS_FLEET_FINANCE_MODEL_CHANGES_SIGN')
        fd = impact_funds(ticker,fund[ticker],checked,case)
        known_taxes_and_attr_width = number(incidence['maximumVnd'])-number(incidence['minimumVnd'])
        profile = dict(contract='issuer-base-assumption-decision-v1',ticker=ticker,period='FY2025',scope=p['scope'],
            analysisMode='AS_REVISED_CURRENT_RESEARCH_NOT_AS_KNOWN_2025', actor='CHATGPT',
            reviewMode='OWNER_AUTHORIZED_AI_SELF_REVIEW_NOT_INDEPENDENT_ACCEPTANCE',
            hypothesisChoiceDocumented=True,baseCaseMeaning='PRUDENTIAL_WORKING_CASE_NOT_EXPECTED_VALUE_OR_COMPLETE_LOWER_BOUND',
            sourceCommonBridgeVnd=common,fundBridgeIsConditionalPlan=bool(preview),
            selectedAnalystBaseVnd=selected_point, workingCaseCalculationVnd=text(case),
            basePointEconomicallyIdentified=False if ticker=='VIC' else None,
            selectedTaxAssumption=tax,selectedCommonIncidenceAssumption=weight,
            incidenceConvention='No tax benefit credited to removed income; adverse 100% common attribution, not profit ratio or proven ownership.',
            selectedAdjustments=selected,priorBaseAtSameIncidenceVnd=text(prior_same_incidence),
            changeFromPriorBaseAtSameIncidenceVnd=text(case-prior_same_incidence),
            defense=dict(choice=claim,support=support,counterevidence=counter,
                falsificationAndRemainingWork=fund[ticker]['exactRemainingWork']),
            taxOnlySensitivity=tax_only,commonAttributionOnlySensitivity=attr,
            selectedOperatingCaseIncidenceEnvelope=incidence,
            knownTaxAndAttributionWidthAsFractionOfAbsoluteCase=None if case==0 else text(known_taxes_and_attr_width/abs(case)),
            disputedOperatingAlternatives=alternatives,operatingStressesWithinSelectedPolicy=policy_stresses,
            combinedNamedAxesSensitivity=total,
            missingFundImpact=fd,sourceReadingRefs=list({r['id']:r for r in evidence_refs}.values()),
            sourceProfile=dict(path=str(pp.relative_to(ROOT)),sha256=sha(pp)),
            fundReviewProfile=dict(path=str((FUND/'issuers'/f'{ticker}.json').relative_to(ROOT)),sha256=sha(FUND/'issuers'/f'{ticker}.json')),
            financialAcceptanceDecision=decision, blockers=blockers,
            acceptedNormalizedCommonEarningsVnd=None,acceptedEps=None,
            financialCriteriaOrWeightsChanged=False,newMaterialityToleranceIntroduced=False,
            sourceAdmissionGranted=False,productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False,
            requiresNewPersonalOwnerEvidence=False)
        profiles.append(profile)
        dump(OUT/'issuers'/f'{ticker}.json',profile)
    summary = dict(contract='base-assumption-decisions-summary-v1',reviewDate='2026-11-03',
        issuerCount=len(profiles),documentedChoices=len(profiles),selectedPrudentialPointCount=sum(p['selectedAnalystBaseVnd'] is not None for p in profiles),
        rejectedUnidentifiedPointCount=sum(p['selectedAnalystBaseVnd'] is None for p in profiles),
        acceptedFinancialNormalizationCount=sum(p['acceptedNormalizedCommonEarningsVnd'] is not None for p in profiles),
        financialCriteriaOrWeightsChanged=False, productionAuthorityChanged=False,
        issuers=[dict(ticker=p['ticker'],selectedAnalystBaseVnd=p['selectedAnalystBaseVnd'],workingCaseCalculationVnd=p['workingCaseCalculationVnd'],
            namedAxesSensitivity=p['combinedNamedAxesSensitivity'],financialAcceptanceDecision=p['financialAcceptanceDecision']) for p in profiles])
    dump(OUT/'summary.json',summary)
    report(profiles)
    dump(OUT/'manifest.json',dict(contract='base-assumption-decisions-integrity-v1',inputPins=pins,
        outputs=[dict(path=str(p.relative_to(OUT)),sha256=sha(p)) for p in sorted((OUT/'issuers').glob('*.json'))]+[
            dict(path='summary.json',sha256=sha(OUT/'summary.json')),dict(path='REPORT.md',sha256=sha(OUT/'REPORT.md'))]))
    print(json.dumps({k:summary[k] for k in ['issuerCount','documentedChoices','selectedPrudentialPointCount','rejectedUnidentifiedPointCount','acceptedFinancialNormalizationCount']}))


def report(profiles):
    def bn(value):
        return 'Không chọn' if value is None else format(number(value)/1000000000,',.3f')
    lines = ['# Chọn giả định cơ sở và quyết định từng mã — FY2025', '',
      'Đã quyết định riêng cho 17 mã: chọn 16 mức làm việc thận trọng; VIC bác việc chọn một điểm thuộc cổ đông mẹ vì chưa xác định được phân bổ. Đây không phải 16 mức lợi nhuận bền vững được nghiệm thu. Quyết định tài chính cuối cùng: 16 hoãn, VIC bác một điểm hiện tại. Không đổi tiêu chí, trọng số, dung sai hay quyền production.', '',
      '## Số được chọn và phần chưa chắc chắn', '',
      'Đơn vị bảng: **tỷ VND**, chỉ làm tròn trình bày. Số chính xác trong JSON. Thuế của điều chỉnh chọn 0 và phần thuộc mẹ chọn 100% là quy ước bất lợi để không nhận lợi ích thuế/phân bổ chưa chứng minh; không phải kết luận pháp lý hay tỷ lệ sở hữu. Vì vậy các điểm là cơ sở thận trọng để phản biện, không phải giá trị kỳ vọng thống kê hay cận dưới đầy đủ. MCH giữ lãi đã báo cáo khi chưa có bằng chứng mất 50%; rủi ro thu hồi đo riêng.', '',
      '| Mã | Mức làm việc được chọn | Khoảng các trục đã biết | Quỹ còn thiếu | Quyết định tài chính |', '|---|---:|---:|---|---|']
    for p in profiles:
        e=p['combinedNamedAxesSensitivity']
        lines.append(f"| {p['ticker']} | {bn(p['selectedAnalystBaseVnd'])} | {bn(e['minimumVnd'])} … {bn(e['maximumVnd'])} | Chưa có cận đầy đủ | {'Bác một điểm' if p['ticker']=='VIC' else 'Hoãn nghiệm thu cuối cùng'} |")
    lines += ['', 'Khoảng trên chỉ phủ các điều chỉnh, kịch bản và incidence đã nêu; **không phủ quỹ chưa biết, giao dịch chưa rà hết hoặc toàn bộ chu kỳ tương lai**. BEAR/BASE/BULL cũ là phương án phản biện, không tự biến thành dự báo đã đạt. Không áp hệ số chu kỳ chung lần nữa lên khoản tín dụng đã điều chỉnh.', '',
      '## Lựa chọn, bằng chứng và phản chứng từng mã']
    for p in profiles:
        lines += ['', '### '+p['ticker'], '', '**Chọn:** '+p['defense']['choice'], '',
          '**Bảo vệ:** '+p['defense']['support'], '', '**Phản chứng:** '+p['defense']['counterevidence'], '',
          f"**Lượng hóa:** thay đổi so với BASE cũ ở cùng quy ước thuế/phần mẹ: {bn(p['changeFromPriorBaseAtSameIncidenceVnd'])} tỷ. Độ rộng riêng thuế: {bn(p['taxOnlySensitivity']['impactWidthVnd'])} tỷ; riêng phân bổ mẹ/NCI: {bn(p['commonAttributionOnlySensitivity']['impactWidthVnd'])} tỷ. Hai độ rộng không được cộng cơ học; khoảng kết hợp được tính độc lập theo từng khoản."]
        for x in p['missingFundImpact']['namedCounterfactuals']:
            lines.append(f"- Phép thử `{x['name']}`: thay đổi {bn(x['changeFromSelectedCaseVnd'])} tỷ; {x['caveat']}")
        lines += ['', '**Cần khép để đổi quyết định:** '+p['defense']['falsificationAndRemainingWork']]
    lines += ['', '## Quyết định và giới hạn', '',
      'Đã khép bước lựa chọn và phản biện giả định; không còn dừng ở việc tạo một bộ kịch bản không có lựa chọn. Nhưng lựa chọn có lý do chưa khép được các khoảng trống trọng yếu: quỹ chưa có cận, dân số tín dụng/chu kỳ và thuế/NCI điều chỉnh. Không tự đặt ngưỡng 5%/10% để gọi chúng là không trọng yếu. Mỗi VND quỹ ngoài cổ đông thuộc mẹ chưa phản ánh làm giảm lợi nhuận một VND; JSON ghi cả mức quỹ giả định đủ xóa lợi nhuận dương, không tuyên bố khoản đó tồn tại.', '',
      'VIC: phép thử bất lợi được ghi riêng, không chọn trung điểm của khoảng đổi dấu làm estimate. VJC: giữ kết quả âm của nhánh hàng không cốt lõi; không dùng P/E dương hoặc ép kết quả về 0. Chưa khép tính kinh tế bán/thuê lại nên không tuyên bố mọi biên bán tàu bay đều bất thường.', '',
      'Nguồn trực tiếp từng điều chỉnh nằm trong `sourceReadingRefs`; toán hạng tổng hợp được ghim vào profile/manifest nguồn cũ. Không có số nguồn mới hoặc xác nhận độc lập được bịa ra. Dữ liệu là FY2025 với thông tin sửa đổi biết sau kỳ, không phải dự báo cập nhật toàn bộ tại ngày giao dịch. Không tính EPS hiện tại, giá trị/cổ phần hay lệnh mua/bán. Không cần chủ tài khoản xác nhận lại dữ kiện cá nhân; không posting, promote source, bật NAV/scoring hoặc bắt đầu WP2.']
    (OUT/'REPORT.md').write_text('\n'.join(lines)+'\n')


if __name__=='__main__':
    build()
