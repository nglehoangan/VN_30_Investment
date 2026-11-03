"""Build the 17-issuer acceptance decision from retained evidence; read-only DB."""
import hashlib
import json
from pathlib import Path
from lib.fund_appropriation import fund_plan_preview, rebase_scenario, amount, decimal_text

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-03/normalization-acceptance-v1'
PRIOR = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/earnings-normalization-v3'
COMMON = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-economics-r3/checked-common-earnings.json'
TICKERS = 'BID BSR CTG GVR HDB LPB MCH MSN SAB SHB SSB STB TCX VIB VIC VJC VPB'.split()


def read(p):
    return json.loads(p.read_text())


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def source_pin(p):
    return dict(path=str(p.relative_to(ROOT)), sha256=sha(p))


def validate_reading(row, acquisition):
    source = row['source']
    if row['economicPeriod'] != 'FY2025' or row['documentYear'] != 2026:
        raise ValueError('PERIOD_BINDING_MISMATCH')
    multipliers = {'VND': '1', 'MILLION_VND': '1000000', 'BILLION_VND': '1000000000'}
    if multipliers[row['declaredUnit']] != row['currencyMultiplier']:
        raise ValueError('UNIT_BINDING_MISMATCH')
    p = ROOT / source['pdfPath']
    if sha(p) != source['sha256']:
        raise ValueError('SOURCE_BYTES_MISMATCH')
    valid = []
    for r in acquisition['rows']:
        if r['ticker'] == row['ticker'] and r['documentId'] == source['documentId']:
            valid.append((r['pdfPath'], r['sha256']))
            valid.extend((c['pdfPath'], c['sha256']) for c in r.get('extractedPdfs', []))
            if source['retrievedAt'] != r['retrievedAt']:
                raise ValueError('RECEIPT_TIME_BINDING_MISMATCH')
    if (source['pdfPath'], source['sha256']) not in valid:
        raise ValueError('SOURCE_IDENTITY_MISMATCH')
    if not row['review']['fullPageImagesInspected']:
        raise ValueError('UNREVIEWED_PAGE')
    if not source['physicalPages'] or any(type(p) is not int or p < 1 for p in source['physicalPages']):
        raise ValueError('PHYSICAL_PAGE_REQUIRED')
    if row['financialNormalizationAccepted'] or row['productionAdmissible']:
        raise ValueError('READING_CANNOT_GRANT_FINANCIAL_OR_PRODUCTION_AUTHORITY')
    for value in row['values'].values():
        amount(value)


# Each item identifies an unresolved financial question, not a request for
# personal-account owner confirmation. Existing source-routing resolutions stand.
DEPENDENCIES = {'BID': 'Đối chiếu quỹ mẹ 3369374 triệu (cơ sở có điều chỉnh lợi nhuận năm trước) với 3446462 triệu đã trừ '
        'trong EPS hợp nhất; cần phân phối cuối cùng được cơ quan có thẩm quyền chấp thuận và cầu nối công '
        'ty con.',
 'BSR': 'Giữ tử số dẫn xuất 4835448024664 VND và chênh 1-VND H1/Q3; cần đủ căn cứ nghiệm thu tử số này dù '
        'subtotal in sai, hoàn tất phân phối mẹ/con và chứng cứ chu kỳ lọc dầu.',
 'CTG': 'Quỹ mẹ dự kiến 3050316 triệu còn điều kiện phê duyệt nhà nước và dùng cơ sở có điều chỉnh năm '
        'trước; chưa có phân phối cuối cùng đầy đủ thuộc cổ đông mẹ ở phạm vi hợp nhất.',
 'GVR': 'Đối chiếu phân phối công ty con thuộc mẹ 606620346513 VND với biến động sổ; cần số quỹ mẹ chính xác '
        'phía sau phương án làm tròn 30,13 tỷ. Không gán toàn bộ biến động các kỳ trước cho FY2025.',
 'HDB': 'Đối chiếu thêm quỹ HĐQT/BKS 30 tỷ với P&L/sổ và 25 tỷ đã trừ; phân loại 104354 triệu quỹ công ty '
        'con và phần thuộc mẹ/NCI. Tổng dòng con lệch tổng in 1 triệu, giữ nguyên thay vì tạo khoản bù.',
 'LPB': 'Khép phê duyệt tờ trình 771/điều kiện cơ quan có thẩm quyền và phạm vi quỹ nhân viên; giữ riêng số '
        'VND chính xác với EPS đơn vị triệu làm tròn; kiểm chứng chu kỳ tín dụng/thu hồi nợ.',
 'MCH': 'Cần phân phối FY2025 cuối cùng và phần thuộc mẹ/con; số dư quỹ trên bảng cân đối không phải mức '
        'trích trong năm. Kiểm chứng khả năng thu lãi bên liên quan và thuế của điều chỉnh.',
 'MSN': 'Cổ tức bằng 0 không xác nhận quỹ bằng 0; cần phạm vi quỹ thuộc cổ đông mẹ, xóa sổ lặp lại theo '
        'mảng, thuế và NCI của từng điều chỉnh.',
 'SAB': 'Đối chiếu số FY2025 làm tròn: thưởng/phúc lợi 129 tỷ và xã hội 23 tỷ với khoản EPS hợp nhất ước '
        'tính đã trừ 131028135557 VND; phân loại quỹ xã hội, phạm vi và phần đã vào P&L; kiểm chứng thuế/NCI '
        'của lãi mua rẻ/hoàn nhập.',
 'SHB': 'Cần bảng số tờ trình 02/2026/TTr-HĐQT đã được Điều 5 thông qua; khép quỹ thuộc cổ đông mẹ, tính lặp '
        'lại của thu hồi nợ và dân số khoản vay tương ứng.',
 'SSB': 'Thay quỹ ước tính 165286 triệu bằng phần mẹ 275000 triệu trong preview; còn phần công ty con 66 '
        'triệu chưa xác nhận thuộc mẹ/NCI, phân loại bù chi phí 2162 triệu, đối chiếu sổ và thuế thương vụ '
        'PTF.',
 'STB': 'Cần bảng số tờ trình 31/2026/TTr-HĐQT; tránh trừ lại thù lao đã hạch toán. ĐHĐCĐ cảnh báo dự phòng '
        'còn cao; bình quân chi phí tín dụng tổng/tài sản chưa phải dự phòng khoản vay bền vững được nghiệm '
        'thu.',
 'TCX': 'Cần bảng số tờ trình 020304/26 (phân phối) và 040304/26 (thưởng hiệu quả); giữ chênh 1-VND thu '
        'nhập, kiểm chứng chu kỳ giao dịch ròng và thuế điều chỉnh.',
 'VIB': 'Đối chiếu quỹ thưởng mẹ/nhóm được duyệt 150000 triệu với biến động sổ và đầy đủ FY2025; kiểm chứng '
        'dân số tín dụng, thu hồi nợ/phái sinh và thuế biên.',
 'VIC': 'Khép phương án sử dụng lợi nhuận lũy kế với quỹ cuối cùng mẹ/con; phân bổ theo từng mảng/giao dịch, '
        'không dùng tỷ lệ lợi nhuận mẹ/nhóm lớn hơn 1; tách thu nhập tái đầu tư bị hạn chế và tài trợ lặp '
        'lại.',
 'VJC': 'Khép phân phối FY2025 ngoài cổ đông; ngân sách HĐQT FY2026 không phải quỹ FY2025. Kiểm chứng tính '
        'lặp lại bán tàu bay, hỗ trợ nhà cung cấp, nghĩa vụ thuê và thuế từng pháp nhân nước ngoài.',
 'VPB': 'Đối chiếu quỹ thưởng/phúc lợi thuộc cổ đông mẹ 200000 triệu với thực hiện và phạm vi đầy đủ công ty '
        'con; kiểm chứng dân số tín dụng ngân hàng/tài chính tiêu dùng, thu hồi nợ và thuế/NCI điều chỉnh.'}

def build():
    acquisition = read(OUT / 'acquisition-manifest.json')
    readings = read(OUT / 'checked-appropriations.json')
    seen = set()
    for row in readings['rows']:
        if row['id'] in seen:
            raise ValueError('DUPLICATE_READING')
        seen.add(row['id'])
        validate_reading(row, acquisition)
    by_ticker = {r['ticker']: r for r in readings['rows']}
    common = {r['ticker']: r for r in read(COMMON)['facts']}
    pins = [source_pin(p) for p in [COMMON, OUT / 'checked-appropriations.json', OUT / 'acquisition-manifest.json',
                                  Path(__file__).resolve(), ROOT / 'scripts/lib/fund_appropriation.py',
                                  ROOT / 'scripts/test-normalization-acceptance-review.py',
                                  ROOT / 'scripts/acquire-normalization-acceptance-documents.py']]
    decisions = []
    for ticker in TICKERS:
        path = PRIOR / 'issuers' / (ticker + '.json')
        prior = read(path)
        pins.append(source_pin(path))
        evidence = [r['id'] for r in readings['rows'] if r['ticker'] == ticker]
        base = prior['sourceCommonBridgeVnd']
        preview = None
        if ticker in ['VPB', 'VIB', 'HDB', 'SSB']:
            r = by_ticker[ticker]
            def v(key):
                return decimal_text(amount(r['values'][key]) * amount(r['currencyMultiplier']))
            def component(id_, value, ev, treatment, key):
                return dict(id=id_, amountVnd=value, evidenceId=ev, componentKey=key,
                            economicPeriod='FY2025', classification='COMMON_NON_OWNER_FUND',
                            attribution='IDENTIFIED_PARENT_OR_COMMON', existingTreatment=treatment)
            restore = []
            if ticker == 'VPB':
                value = v('rewardWelfare')
            elif ticker == 'VIB':
                value = v('standaloneReward')
            elif ticker == 'HDB':
                value = v('parentBoardSupervisoryFund')
                # 25bn welfare remains in input. Never deduct the whole 55bn again.
                if prior['additionalKnownFundDeductions'][0]['value'] != v('parentWelfare'):
                    raise ValueError('HDB_EXISTING_WELFARE_BINDING_MISMATCH')
            else:
                value = decimal_text(amount(v('standaloneBonus')) + amount(v('standaloneWelfare')))
                fact = common[ticker]
                if fact['fundStatus'] != 'ISSUER_ESTIMATED_DEDUCTION' or len(fact['signedExplicitDeductions']) != 1:
                    raise ValueError('SSB_EXPLICIT_ESTIMATED_DEDUCTION_REQUIRED')
                restored = -amount(fact['signedExplicitDeductions'][0]) * amount(fact['currencyMultiplier'])
                restore = [component('SSB-replace-existing-estimate', decimal_text(restored), fact['id'], 'DEDUCTED_ESTIMATE_REPLACED_IN_FULL', '/signedExplicitDeductions/0')]
                evidence.append(fact['id'])
            key = {'VPB':'/values/rewardWelfare','VIB':'/values/standaloneReward',
                   'HDB':'/values/parentBoardSupervisoryFund',
                   'SSB':'/values/standaloneBonus+/values/standaloneWelfare'}[ticker]
            deduction = component(ticker + '-identified-plan-fund', value, r['id'], 'NOT_DEDUCTED_IN_INPUT', key)
            preview = fund_plan_preview(base, restore=restore, deductions=[deduction], evidence_ids=evidence)
            preview.update(restore=restore, deductions=[deduction],
                           stage='AGM_PLAN_SENSITIVITY_NOT_FINAL_BOOK_OR_SUSTAINABLE_EARNINGS',
                           conditions=['No prior P&L or other duplicate deduction', 'Same FY2025 common-owner component',
                                       'All other unresolved funds remain unknown; this is not a complete range'])
            preview['rebasedScenarios'] = [rebase_scenario(s, preview['changeFromInputVnd']) for s in prior['scenarios']]
        blockers = ['FINAL_COMMON_FUND_COMPLETENESS_OPEN', 'TRANSACTION_TAX_INCIDENCE_OPEN',
                    'SUSTAINABLE_CYCLE_AND_ONE_OFF_COVERAGE_OPEN', 'NO_QUALIFIED_SELECTED_ESTIMATE']
        if prior['scope'] != 'STANDALONE':
            blockers.append('TRANSACTION_COMMON_NCI_INCIDENCE_OPEN')
        if prior.get('creditNormalization'):
            blockers.append('TOTAL_CREDIT_ASSET_PROXY_NOT_MATCHED_LOAN_NORMALIZATION')
        if ticker in ['BSR', 'GVR', 'TCX']:
            blockers.append('SOURCE_VARIANT_OR_FINAL_DISTRIBUTION_DISPOSITION_OPEN')
        arithmetic_checks = []
        if ticker == 'HDB':
            r = by_ticker[ticker]
            values = r['values']
            components = ['charterReserve','financialReserve','subsidiaryFundsUnclassified','parentWelfare','parentBoardSupervisoryFund']
            summed = sum((amount(values[k]) for k in components), amount('0'))
            arithmetic_checks.append(dict(evidenceId=r['id'], componentKeys=components,
                componentSumSourceUnits=decimal_text(summed), printedTotalSourceUnits=values['totalFunds'],
                printedMinusComponentSumVnd=decimal_text((amount(values['totalFunds'])-summed)*amount(r['currencyMultiplier'])),
                disposition='PRESENTATION_DIFFERENCE_UNRESOLVED_NO_BALANCING_ADJUSTMENT'))
            blockers.append('PRINTED_FUND_TOTAL_COMPONENT_SUM_DIFFERENCE')
        decision = dict(contract='issuer-normalization-acceptance-decision-v1', ticker=ticker,
                        period='FY2025', analysisMode='AS_REVISED_CURRENT_RESEARCH', scope=prior['scope'],
                        priorProfile=source_pin(path), priorCommonBridgeVnd=base,
                        checkedAppropriationEvidenceIds=evidence, fundPlanPreview=preview,
                        sourceArithmeticChecks=arithmetic_checks,
                        financialAcceptanceDecision='BLOCKED_MATERIAL_FINANCIAL_EVIDENCE', blockers=blockers,
                        exactRemainingWork=DEPENDENCIES[ticker], requiresNewPersonalOwnerEvidence=False,
                        acceptedNormalizedCommonEarningsVnd=None, acceptedEps=None,
                        sourceAdmissionGranted=False, productionScoringAuthorized=False,
                        navAuthorized=False, tradingAuthorized=False)
        decisions.append(decision)
    (OUT / 'issuers').mkdir(exist_ok=True)
    for decision in decisions:
        (OUT / 'issuers' / (decision['ticker'] + '.json')).write_text(json.dumps(decision, ensure_ascii=False, indent=2) + '\n')
    snapshot = dict(contract='normalization-acceptance-snapshot-v1', asOfReviewDate='2026-11-03',
                    issuers=decisions, acceptedNormalizedIssuerCount=0, checkedAppropriationRecordCount=len(seen),
                    fundPlanPreviewCount=sum(d['fundPlanPreview'] is not None for d in decisions),
                    criteriaOrWeightsChanged=False, productionAuthorityChanged=False)
    (OUT / 'snapshot.json').write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n')
    pins.extend(source_pin(ROOT / r['source']['pdfPath']) for r in readings['rows'])
    (OUT / 'manifest.json').write_text(json.dumps(dict(contract='normalization-acceptance-integrity-v1',
        inputPins=list({r['path']: r for r in pins}.values()), snapshotSha256=sha(OUT / 'snapshot.json'),
        originalPublicationTimeUnknownIsNull=True, historicalV3Changed=False), indent=2) + '\n')
    lines = ['# Quyết định nghiệm thu lợi nhuận chuẩn hóa — 17 mã, 2026-11-03', '',
      '**Kết quả: chưa đủ bằng chứng để nghiệm thu mức lợi nhuận bền vững cho 17 mã (0/17).**', '',
      'Đã bổ sung nguồn ĐHĐCĐ từ Vietstock cho cả 17 mã, đọc trực tiếp 14 hồ sơ trang liên quan và tính lại 4 nhánh quỹ. Đây là các sửa đổi có số liệu và quyết định theo từng mã; không đổi tiêu chí, trọng số hay bằng chứng cũ. Tải được tài liệu không có nghĩa mọi trang hoặc mọi khoản đã được kiểm tra.', '',
      '## Bốn cầu nối quỹ mới', '',
      '| Mã | Cầu nối trước (VND) | Nhánh kế hoạch sau đối chiếu (VND) | Thay đổi (VND) |',
      '|---|---:|---:|---:|']
    for d in decisions:
        if d['fundPlanPreview']:
            p = d['fundPlanPreview']
            lines.append(f"| {d['ticker']} | {d['priorCommonBridgeVnd']} | {p['commonBridgePreviewVnd']} | {p['changeFromInputVnd']} |")
    lines += ['', 'Các số trên là tử số sau phần quỹ đã xác định theo phương án, **chưa phải lợi nhuận chuẩn hóa được nghiệm thu**, chưa chứng minh đã hạch toán/chi trả hay đầy đủ cả nhóm. Các kịch bản v3 đã được tính lại cùng mức thay đổi này trong từng hồ sơ; giữ nguyên điều chỉnh kinh tế/thuế/NCI, không chiết khấu thuế lên quỹ sau thuế.', '',
      '- SSB: hoàn lại khoản ước tính đã trừ 165286 triệu, thay bằng phần thưởng/phúc lợi mẹ 275000 triệu. Phần công ty con 66 triệu vẫn chưa phân bổ common/NCI; khoản bù chi phí không được trừ 2162 triệu chưa tự trừ thêm.',
      '- HDB: giữ 25 tỷ đã trừ; chỉ thêm nhánh 30 tỷ quỹ HĐQT/BKS với điều kiện không nằm trong P&L. Khoản quỹ công ty con 104354 triệu chưa được gán hết thành mất mát cổ đông.',
      '- VPB: bảng bắt đầu từ lợi nhuận thuộc cổ đông VPBank sau NCI, xác định quỹ thưởng/phúc lợi 200 tỷ. Không trừ thêm dự trữ vốn hay cổ tức.',
      '- VIB: nghị quyết mục 1.3 nối trực tiếp đến phương án trích thưởng 150 tỷ; vẫn cần đối chiếu thực hiện và phần còn lại.', '',
      'BID/CTG có điều kiện phê duyệt của cơ quan có thẩm quyền và cơ sở phân phối gồm điều chỉnh lợi nhuận năm trước. SAB chỉ trình bày tỷ đồng làm tròn và còn khác phạm vi; không thay số quỹ hợp nhất chính xác bằng 129/23 tỷ. LPB không có dòng quỹ nhân viên trên một bảng không đủ để suy ra bằng 0. STB có phản chứng về dự phòng tiếp tục cao. Không dùng số dư quỹ MCH hay tỷ lệ cổ tức MSN bằng 0 để kết luận không có khoản phân phối.', '',
      '## Phần cần khép theo từng mã', '', '| Mã | Công việc còn thiếu bằng chứng |', '|---|---|']
    lines += [f"| {d['ticker']} | {d['exactRemainingWork']} |" for d in decisions]
    lines += ['', 'BSR/GVR giữ cách mapping/toán học đã chốt ở v3, đồng thời giữ các điểm chưa đủ nghiệm thu. Không xóa xung đột nguồn hoặc tạo số chính xác giả để đóng issue.', '',
      '## Giới hạn và bước nghiệm thu', '',
      'Nghiệm thu lợi nhuận bền vững cần hoàn tất cầu nối quỹ cùng phạm vi/niên độ, thuế và phần thuộc cổ đông mẹ của các điều chỉnh trọng yếu, bằng chứng chu kỳ/dân số tín dụng phù hợp và một estimate được chọn có lý do. Các khoảng thuế/NCI và proxy hiện có chưa đáp ứng các điều kiện đó; việc đổi cờ trạng thái không giải quyết được chúng.', '',
      'Không cần chủ tài khoản xác nhận lại dữ kiện danh mục cá nhân. Cần tiếp tục khai thác nguồn doanh nghiệp/phụ lục, đối chiếu và phản biện mô hình. Source admission, DI/provenance, scoring production, NAV, WP1 posting và giao dịch vẫn giữ nguyên trạng thái; gói này không cấp bất kỳ quyền nào.', '',
      'Nguồn từng trang/đơn vị/thời điểm thu nhận nằm trong `checked-appropriations.json`; số gốc và nhánh tính trong `issuers/*.json`; snapshot và manifest ghim phiên bản. Publication time chưa chứng minh vẫn null. Kiểm tra kỹ thuật riêng trong `VALIDATION.json`, không thay nghiệm thu tài chính.']
    (OUT / 'REPORT.md').write_text('\n'.join(lines) + '\n')
    print(json.dumps(dict(issuers=len(decisions), checkedReadings=len(seen), previews=4, accepted=0)))


if __name__ == '__main__':
    build()
