#!/usr/bin/env python3
"""Build an additive 11-holding AI research candidate, with immutable source pins."""
import argparse
import hashlib
import json
from decimal import Decimal, getcontext
from pathlib import Path
from lib.held_normalization import number, text, owner_cash, residual_income, loan_charge

getcontext().prec = 50
ROOT = Path(__file__).resolve().parents[1]
BASE = Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30')
OUT = Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/held-normalization-v1')
D = Decimal


def digest(path):
    return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()


def build():
    pins = {}
    def pin(path, expected=None):
        actual = digest(Path(path))
        if expected is not None and actual != expected:
            raise ValueError(f'SOURCE_HASH_MISMATCH: {path}')
        pins[str(path)] = actual
    def read(path):
        pin(path)
        return json.loads((ROOT/path).read_text())
    cfg = read(OUT/'checked-inputs.json')
    facts = {x['ticker']: x for x in read(BASE/'b6-economics-r3/checked-common-earnings.json')['facts']}
    contexts = {x['observationId']: x for x in read(BASE/'b6-comparability-r2/native-review-sources.json')['contexts']}
    bank_risk = {x['ticker']: x for x in read(BASE/'b6-underwriting-r4/checked-bank-risk-expense.json')['rows']}
    market = read(BASE/'b6-economics-r3/market-review.json')
    if len({r['id'] for r in cfg['readings']}) != len(cfg['readings']):
        raise ValueError('UNIQUE_READING_IDS_REQUIRED')
    for reading in cfg['readings']:
        if reading['ticker'] not in cfg['scope'] or reading['fiscalYear'] not in [2023,2024,2025]:
            raise ValueError('SUPPORTED_ISSUER_AND_PERIOD_REQUIRED')
        expected_source = facts[reading['ticker']]['source']['pdfPath'] if reading['fiscalYear']!=2023 else f"data/manual-download/{reading['ticker']}/{reading['ticker']}_Baocaotaichinh_2023_Kiemtoan_Hopnhat.pdf"
        if reading['sourcePdf'] != expected_source:
            raise ValueError('EXACT_READING_ISSUER_SOURCE_BINDING_REQUIRED')
        if number(reading['sourceLexicalValue'])*number(reading['currencyMultiplier']) != number(reading['valueVnd']):
            raise ValueError('READING_UNIT_REPLAY_MISMATCH')
        if reading['reviewedOn'] != cfg['analysisDate']:
            raise ValueError('EXPLICIT_REVIEW_DATE_BINDING_REQUIRED')
        pin(reading['sourcePdf'], reading['sourceHash'])
        if reading['physicalPage'] <= 0 or reading['review'] != 'FULL_PAGE_IMAGE_INSPECTED_BY_CHATGPT':
            raise ValueError('CHECKED_PHYSICAL_PAGE_REQUIRED')
    outputs, summaries = {}, []
    for ticker in cfg['scope']:
        f = facts[ticker]
        pin(f['source']['pdfPath'], f['source']['sha256'])
        old = read(BASE/f'b6-underwriting-r4/issuers/{ticker}.json')
        native = read(BASE/f'b6-comparability-r2/native-inputs/{ticker}.json')
        settings = cfg['scenarioSettings'][ticker]
        readings = [x for x in cfg['readings'] if x['ticker'] == ticker]
        def reading(key, year=2025):
            xs = [x for x in readings if x['key'] == key and x['fiscalYear'] == year]
            if len(xs) != 1:
                raise ValueError(f'UNIQUE_SOURCE_READING_REQUIRED:{ticker}/{key}/{year}')
            return number(xs[0]['valueVnd'])
        def obs(item, end, same_source=False):
            xs = [o for o in native['observations'] if o['itemId'] == item and o['periodEnd'] == end and (not same_source or contexts[o['id']]['sourceHash'] == f['source']['sha256'])]
            if len(xs) != 1:
                raise ValueError(f'UNIQUE_SOURCE_PERIOD_REQUIRED:{ticker}/{item}/{end}')
            return xs[0]
        def value(item, end, same_source=False):
            return number(obs(item, end, same_source)['normalized']['value'])
        relevant = [o for o in native['observations'] if o['periodEnd'] in ['2025-12-31','2026-06-30']]
        lineage = []
        for o in relevant:
            c = contexts[o['id']]
            pin(c['sourcePath'], c['sourceHash'])
            lineage.append(dict(observation=o, sourceContext=c))
        for bridge in old['annualReportedCashBridge']:
            for c in bridge['sourceContexts']:
                pin(c['sourcePath'], c['sourceHash'])
            if bridge.get('extraSource'):
                # Exact extra-reading provenance is retained in the referenced R4 file.
                pass
        shares = old['currentSharesReference']
        pin(shares['source'])
        common = number(f['reportedCommonProfitVnd'])
        group = value('NET_INCOME', '2025-12-31', True)
        parent = number(f['sourcePreDeductionProfit'])*number(f['currencyMultiplier']) if f['sourcePreDeductionProfit'] is not None else common
        allocation = parent/group
        if not 0 < allocation <= 1:
            raise ValueError('PARENT_GROUP_PROFIT_BRIDGE_REQUIRED')
        book = None
        if settings['model'] in ['BANK_RIM','SECURITIES_RIM','PROJECT_RNAV_PENDING']:
            book = reading('commonBookTotal') - reading('nciBook')
            if book <= 0:
                raise ValueError('POSITIVE_COMMON_BOOK_REQUIRED')
        credit = None
        if settings['model'] == 'BANK_RIM':
            rows = []
            for year in [2023,2024,2025]:
                # All 2022-25 loan observations retain exact original contexts below.
                opening = obs('BANK_GROSS_CUSTOMER_LOANS', f'{year-1}-12-31')
                closing = obs('BANK_GROSS_CUSTOMER_LOANS', f'{year}-12-31')
                for o in [opening,closing]:
                    c = contexts[o['id']];pin(c['sourcePath'], c['sourceHash'])
                    if not any(x['observation']['id'] == o['id'] for x in lineage):
                        lineage.append(dict(observation=o,sourceContext=c))
                rows.append(dict(year=year, opening=opening['normalized']['value'],closing=closing['normalized']['value'],charge=text(reading('customerLoanCharge',year))))
            avg = (number(rows[-1]['opening'])+number(rows[-1]['closing']))/2
            rate, target = loan_charge(rows, avg, '1')
            total_risk = number(bank_risk[ticker]['riskExpenseByYear']['2025'])*number(bank_risk[ticker]['currencyMultiplier'])
            credit = dict(history=rows, weightedThreeYearLoanChargeRate=text(rate),targetFY2025AverageLoans=text(avg),baseLoanCharge=text(target),reportedTotalCreditExpense=text(total_risk),reportedCustomerLoanExpense=text(reading('customerLoanCharge')),retainedOtherCreditExpense=text(total_risk-reading('customerLoanCharge')),populationQualified=False,populationLimitation='Contiguous observed balances, not a formal loan-population admission. TCB margin/advance provisions excluded from numerator and retained in residual; gross denominator population needs exact bridge. Three years are not a full credit cycle.')
        scenarios = []
        for index, name in enumerate(['BEAR','BASE','BULL']):
            cycle = number(settings['cycleFactors'][index])
            deltas = []
            def adjust(label, pretax, refs):
                deltas.append(dict(reason=label,pretaxVnd=text(pretax),afterTaxCommonVnd=text(pretax*(1-number(cfg['assumptions']['taxRate']))*allocation),sourceReadingIds=refs,taxTreatment='ASSUMED_20_PERCENT_NOT_PROVEN_TRANSACTION_TAX',attribution='ASSUMED_PARENT_GROUP_PROFIT_RATIO'))
            if ticker == 'GAS':
                adjust('Remove reported receivable-reversal benefit; future normal bad-debt expense still uncertain', -reading('doubtfulReceivableReversal'), ['GAS-2025-doubtfulReceivableReversal'])
            elif ticker == 'HPG':
                adjust('Remove net disposal gain; retain FX and interest costs', -(reading('disposalGain')-reading('disposalLoss')), ['HPG-2025-disposalGain','HPG-2025-disposalLoss'])
            elif ticker == 'SSI':
                reval = reading('fvtplRevaluationGain')-reading('fvtplRevaluationLoss')+reading('warrantRevaluationGain')-reading('warrantRevaluationLoss')
                adjust('Remove paired asset/warrant revaluation net; no gross-leg addback', -reval, [f'SSI-2025-{k}' for k in ['fvtplRevaluationGain','fvtplRevaluationLoss','warrantRevaluationGain','warrantRevaluationLoss']])
                adjust('Remove net investment-disposal gain', -(reading('investmentDisposalGain')-reading('investmentDisposalLoss')), ['SSI-2025-investmentDisposalGain','SSI-2025-investmentDisposalLoss'])
            elif ticker == 'VRE':
                adjust('Exclude capital-transfer gain; retain rental and other financial/fee income', -reading('investmentTransferIncome'), ['VRE-2025-investmentTransferIncome'])
            elif ticker == 'VPL':
                adjust('Bond repurchase expense addback sensitivity: 0/50/100%; repeat refinancing cost uncertain', reading('bondRepurchaseExpense')*number(['0','.5','1'][index]), ['VPL-2025-bondRepurchaseExpense'])
            elif ticker == 'VHM':
                adjust('Exclude transaction-specific termination income', -reading('terminationIncome'), ['VHM-2025-terminationIncome'])
                adjust('Investment transfer may recur in developer business: exclude 100/50/0%', -reading('investmentTransferIncome')*number(['1','.5','0'][index]), ['VHM-2025-investmentTransferIncome'])
            if credit:
                target = number(credit['baseLoanCharge'])*number(cfg['assumptions']['loanChargeMultipliers'][index])
                adjust('Replace loan charge only; preserve non-loan residual', reading('customerLoanCharge')-target, [f'{ticker}-{y}-customerLoanCharge' for y in [2023,2024,2025]])
                recovery_target=(reading('badDebtRecoveries',2024)+reading('badDebtRecoveries',2025))/2*number(cfg['assumptions']['badDebtRecoveryMultipliers'][index])
                adjust('Replace bad-debt recoveries with two-year mean sensitivity; retain collection expenses',recovery_target-reading('badDebtRecoveries'),[f'{ticker}-{y}-badDebtRecoveries' for y in [2024,2025]])
                if ticker=='MBB':
                    adjust('Remove disposal gain and separate operating-provision reversal, not loan provisions',-reading('equityDisposalGain')-reading('otherOpexProvisionReversal'),['MBB-2025-equityDisposalGain','MBB-2025-otherOpexProvisionReversal'])
                if ticker == 'VCB':
                    adjust('Remove interbank reversal benefit separately, retain corporate-bond risk expense', -reading('interbankReversal'), ['VCB-2025-interbankReversal'])
            subtotal = common + sum((number(x['afterTaxCommonVnd']) for x in deltas), D(0))
            unestimated_fund = subtotal*number(cfg['assumptions']['unestimatedFundHaircuts'][index]) if ticker in ['MBB','SSI'] else D(0)
            candidate = (subtotal-unestimated_fund)*cycle
            if index==1:
                base_candidate=candidate
            r = cfg['assumptions']['discountRates'][index]
            normalization = dict(reportedCommonProfit=text(common),adjustments=deltas,afterAdjustments=text(subtotal),additionalUnestimatedFundAssumption=text(unestimated_fund),cycleFactor=text(cycle),scenarioCommonProfit=text(candidate),status='ASSUMPTION_DEPENDENT_NOT_ADMITTED',exhaustiveOneOffReviewComplete=False)
            assumptions = dict(discount=r,terminalGrowth=None,growth=None,cycleFactor=text(cycle),taxRate=cfg['assumptions']['taxRate'],commonAttributionProxy=text(allocation))
            if settings['model'] == 'PROJECT_RNAV_PENDING':
                model = dict(model='PROJECT_RNAV',equityValue=None,missing=['Project-level after-tax realizable cashflows','Remaining development costs and committed funding','Ownership/NCI, legal status, timing and corporate/project debt reconciliation'])
                cross = dict(model='COMMON_BOOK_RECOVERY_SENSITIVITY_NOT_PROJECT_RNAV',commonBook=text(book),recoveryMultiple=cfg['assumptions']['bookRecoveryMultiples'][index],equityValue=text(book*number(cfg['assumptions']['bookRecoveryMultiples'][index])),debtSubtractedAgain=False)
            else:
                growth = settings['growth'][index]
                tg = text(min(number(cfg['assumptions']['terminalGrowth'][index]), number(growth)))
                assumptions.update(growth=growth,terminalGrowth=tg)
                if book is not None:
                    model = residual_income(book,candidate,growth,r,tg)
                    cross = dict(model='CLEAN_SURPLUS_DDM',equityValue=model['ddmCrosscheck'],difference=model['crosscheckDifference'],independentBusinessModel=False)
                else:
                    assumptions.update(cashConversion=settings['cashConversion'][index],incrementalReturn=settings['incrementalReturn'])
                    model = owner_cash(candidate,assumptions['cashConversion'],growth,settings['incrementalReturn'],r,tg)
                    cross = dict(model='NO_GROWTH_EARNINGS_YIELD_REFERENCE',equityValue=text(candidate/number(r)),qualifiedPrimaryValuation=False,reason='Different reinvestment and duration assumptions; not independent proof of intrinsic value')
            references = []
            for kind in ['listed','outstanding']:
                denominator = shares.get(kind)
                if denominator and denominator.get('value'):
                    if number(denominator['value']) <= 0 or number(denominator['value']) != number(denominator['value']).to_integral_value():
                        raise ValueError('POSITIVE_INTEGER_REFERENCE_SHARES_REQUIRED')
                    value_ref = model['equityValue'] if model['equityValue'] is not None else cross['equityValue']
                    references.append(dict(kind=kind,shares=denominator['value'],conditionalVndPerShare=text(number(value_ref)/number(denominator['value'])),classification='UNQUALIFIED_REFERENCE_DENOMINATOR',actionBridgeVerified=False))
            scenarios.append(dict(name=name,normalization=normalization,assumptions=assumptions,valuation=model,crosscheck=cross,shareReferences=references,acceptedFairValuePerShare=None,buySellAuthority=False))
        base_scenario=scenarios[1]
        sensitivity=[]
        if ticker!='VHM':
            for discount in cfg['assumptions']['discountRates']:
                for factor in ['.9','1','1.1']:
                    a=base_scenario['assumptions']
                    earnings=base_candidate*number(factor)
                    if book is not None:
                        test_model=residual_income(book,earnings,a['growth'],discount,a['terminalGrowth'])
                    else:
                        test_model=owner_cash(earnings,a['cashConversion'],a['growth'],a['incrementalReturn'],discount,a['terminalGrowth'])
                    sensitivity.append(dict(discount=discount,baseEarningsMultiplier=factor,equityValue=test_model['equityValue'],otherAssumptions='BASE_HELD_CONSTANT'))
        financial = settings['model'] in ['BANK_RIM','SECURITIES_RIM']
        balances = []
        for end in ['2025-12-31','2026-06-30']:
            for o in relevant:
                if o['periodEnd'] == end and o['itemId'] in ['CASH_AND_EQUIVALENTS','REPORTED_BORROWINGS','FINANCIAL_DEBT','TOTAL_EQUITY','TOTAL_ASSETS','BANK_REPORTED_CAR','BANK_REPORTED_CET1','BANK_CUSTOMER_DEPOSITS','SECURITIES_MARGIN_LOANS','INVENTORY','RECEIVABLES']:
                    balances.append(dict(item=o['itemId'],date=end,value=o['normalized']['value'],observationId=o['id'],sourceHash=contexts[o['id']]['sourceHash'],sourceVintage=contexts[o['id']],qualification='OBSERVED_NOT_UNRESTRICTED_DISTRIBUTABLE_CAPITAL'))
        debt_review = dict(classification='OPERATING_FINANCIAL_FUNDING' if financial else 'REPORTED_FINANCING_POPULATION_NOT_QUALIFIED_NET_DEBT',qualifiedNetDebt=None,unrestrictedCash=None,leaseAndCurrentPortionReconciliation='Not added to reported totals without an exact non-overlap bridge',principalRefinancingAssumption='Primary equity scenarios assume existing principal can be rolled; no proven refinancing commitment',observedSnapshots=[],repaymentSensitivity=[])
        if not financial:
            for end in ['2025-12-31','2026-06-30']:
                debts = [o for o in relevant if o['periodEnd']==end and o['itemId'] in ['REPORTED_BORROWINGS','FINANCIAL_DEBT']]
                preferred = [o for o in debts if o['itemId']=='REPORTED_BORROWINGS'] or debts
                cash_rows = [o for o in relevant if o['periodEnd']==end and o['itemId']=='CASH_AND_EQUIVALENTS']
                if len(preferred)==1 and len(cash_rows)==1:
                    debt_o,cash_o=preferred[0],cash_rows[0]
                    same=contexts[debt_o['id']]['sourceHash']==contexts[cash_o['id']]['sourceHash']
                    debt,cash=number(debt_o['normalized']['value']),number(cash_o['normalized']['value'])
                    debt_review['observedSnapshots'].append(dict(date=end,reportedBorrowings=text(debt),reportedCash=text(cash),debtObservationId=debt_o['id'],cashObservationId=cash_o['id'],sameSourceVintage=same,diagnosticBorrowingsMinusReportedCash=text(debt-cash) if same else None,diagnosticIsQualifiedNetDebt=False))
                    if end=='2026-06-30':
                        for fraction in ['0','.1','.2']:
                            repayment=debt*number(fraction)
                            debt_review['repaymentSensitivity'].append(dict(snapshotDate=end,assumedPrincipalRepaymentFraction=fraction,assumedRepayment=text(repayment),reportedCashCoverageUpperBound=text(cash-repayment) if same else None,unrestrictedCashCoverage=None,actualMaturityEvidence=False,meaning='Separate liquidity stress, not an extra debt subtraction from the primary valuation'))
        deficiencies = [settings['limitation'],'Current common-share/action bridge unqualified; listed, weighted and provider outstanding are distinct.','Scenario cash/tax/NCI allocation assumptions require underwriting review; no formal scoring admission.']
        if ticker in ['MBB','SSI']:
            deficiencies.append('Employee fund is unestimated in EPS note; scenario haircut is not a sourced final obligation.')
        if ticker == 'GAS':
            deficiencies.append('Removing a reversal does not establish a sustainable future receivable-loss charge.')
        if credit:
            deficiencies.append(credit['populationLimitation'])
        result = dict(contract='held-sector-normalization-review-v1',ticker=ticker,sector=f['sector'],analysisDate=cfg['analysisDate'],financialCutoffs=['2025-12-31','2026-06-30'],sourceKnownAt=f['review']['reviewedAt'],historicalAsKnownReconstruction=False,scope='OWNER_AUTHORIZED_AI_RESEARCH_CANDIDATE',reportedCommonEarnings=f,checkedNoteReadings=readings,groupToCommonBridge=dict(groupProfit=text(group),parentProfitBeforePrintedFunds=text(parent),reportedCommonProfit=text(common),printedFundStatus=f['fundStatus'],adjustmentAttributionProxy=text(allocation),proxyIsOwnershipProof=False),commonBook=None if book is None else text(book),cashHistory=old['annualReportedCashBridge'],cashHistoryIsCommonFcfe=False,debtReview=debt_review,reportedBalances=balances,bankCreditNormalization=credit,currentShareReferences=shares,weightedHistoricalShares=f['weightedAverageShares'],weightedSharesAreCurrentOutstanding=False,sectorModel=settings['model'],scenarios=scenarios,independentInputSensitivity=sensitivity,remaining=deficiencies,lineage=lineage,marketReference=next(x for x in market['rows'] if x['ticker']==ticker),marketReferenceIsCurrentExecutableQuote=False,acceptance=dict(normalizationQualified=False,valuationQualified=False,currentSharesQualified=False,readyForScoring=False,productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False),debtPolicy='Funding/deposits are operating financing; no generic enterprise net-debt subtraction' if financial else 'Interest and financial income remain in equity earnings. No additional cash/debt adjustment; cash restriction, maturities and liabilities remain separate underwriting checks.')
        outputs[f'issuers/{ticker}.json'] = result
        summaries.append(dict(ticker=ticker,sectorModel=settings['model'],commonProfit= text(common),scenarioCommonProfits=[s['normalization']['scenarioCommonProfit'] for s in scenarios],conditionalEquityValues=[s['valuation']['equityValue'] for s in scenarios],bookRecoveryCrosschecks=[s['crosscheck']['equityValue'] for s in scenarios] if ticker=='VHM' else None,remaining=deficiencies))
    summary = dict(contract='held-sector-normalization-review-v1',analysisDate=cfg['analysisDate'],scope=cfg['scope'],scenarioOrder=['BEAR','BASE','BULL'],currency='VND',rows=summaries,assumptions=cfg['assumptions'],completedConditionalModels=10,projectRnavPending=['VHM'],formalAcceptedValuations=0,productionScoringAuthorized=False,financialCriteriaOrWeightsChanged=False,fullThirtyIssuerCurrentPointerChanged=False,methods=[dict(title='CFA residual-income valuation',url='https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/residual-income-valuation'),dict(title='Damodaran financial-service valuation',url='https://pages.stern.nyu.edu/~adamodar/New_Home_Page/littlebook/financialsvccompanies.htm')])
    outputs['summary.json'] = summary
    report = ['# Chuẩn hóa và mô hình ngành — 11 cổ phiếu đang nắm giữ', '', 'Ngày phân tích: 2026-11-02. Đơn vị bảng: nghìn tỷ VND. Đây là kịch bản AI có điều kiện, chưa phải giá trị được nghiệm thu hay lệnh mua/bán. Giữ nguyên tiêu chí tài chính, trọng số và bằng chứng trước đó. Số học dùng Decimal 50 chữ số; giá trị tính toán xuất tối đa 6 chữ số thập phân VND, dữ kiện nguồn giữ nguyên.', '', 'Dữ kiện FY2025, bảng cân đối/H1 2026 và tham chiếu cổ phần 30-10 được giữ riêng theo nguồn. Không nhân đôi H1, không dựng TTM hoặc báo giá hiện tại. Chưa có cầu nối sự kiện quyền được nghiệm thu cho mẫu số cổ phần hiện tại.', '', '| Mã | Lợi nhuận cổ đông FY25 | LN kịch bản xấu/cơ sở/tốt | Giá trị vốn chủ có điều kiện xấu/cơ sở/tốt |', '|---|---:|---|---|']
    def trillions(x):
        return 'chưa xác định' if x is None else f'{number(x)/D(10)**12:.2f}'
    for row in summaries:
        report.append(f"| {row['ticker']} | {trillions(row['commonProfit'])} | {' / '.join(map(trillions,row['scenarioCommonProfits']))} | {' / '.join(map(trillions,row['conditionalEquityValues']))} |")
    report += ['', '## Cách đọc và kiểm tra chéo', '', '- Lợi nhuận bắt đầu từ phần thuộc cổ đông sau khoản quỹ đã in trong báo cáo EPS; không dùng tổng lợi nhuận hợp nhất thay thế. MBB/SSI còn quỹ chưa ước tính: khấu trừ giả định 5/3/2% riêng, không ghi thành nghĩa vụ đã xác nhận.', '- Điều chỉnh trước thuế dùng thuế giả định 20% và tỷ lệ lợi nhuận công ty mẹ/tập đoàn để phân bổ. Đây là ước tính, không chứng minh thuế hay phần sở hữu của từng giao dịch. Từng dòng có ID, PDF, SHA-256, trang vật lý và kỳ/cột.', '- Ngân hàng: dự phòng cho vay chuẩn hóa theo tổng chi phí 2023–25 / tổng dư nợ bình quân rồi áp vào dư nợ FY25; giữ dự phòng tài sản khác. VCB loại riêng lợi ích hoàn nhập liên ngân hàng. Cầu nối tập hợp khoản vay vẫn chưa nghiệm thu, đặc biệt khoản giao dịch ký quỹ/ứng trước TCB. Ba năm không đại diện đầy đủ chu kỳ tín dụng.', '- Ngân hàng/SSI: mô hình thu nhập thặng dư trên vốn thuộc cổ đông, giữ lại vốn để tăng trưởng. DDM cùng dự báo phải khớp tuyệt đối theo clean surplus; đây là kiểm tra đại số, chưa phải thẩm định độc lập CAR/CET1 hay chất lượng tài sản.', '- Phi tài chính: dòng tiền cổ đông = lợi nhuận kịch bản × tỷ lệ chuyển đổi tiền − lợi nhuận × tăng trưởng / suất sinh lợi vốn tăng thêm. Tỷ lệ chuyển đổi đã bao gồm bảo trì và vốn lưu động bình thường, chưa gồm vốn mở rộng; phần mở rộng chỉ trừ một lần. Tất cả là giả định tách khỏi CFO/capex thực tế. Lãi vay và thu nhập tài chính vẫn nằm trong lợi nhuận nên không cộng tiền hoặc trừ nợ thêm.', '- CFO trừ tổng chi mua tài sản trong lịch sử là cầu nối tiền hợp nhất, không phải FCFE của cổ đông hoặc capex bảo trì. Số thiếu giữ null. CFO âm của VPL/VRE và capex HPG lớn vẫn hiện trong từng hồ sơ.', '- FPT/GAS/HPG/MWG có mô hình tiền theo đặc điểm ngành; VRE là dòng tiền vốn chủ hỗn hợp thiên về cho thuê, VPL là khách sạn + hoạt động khác, không giả là DCF khách sạn thuần. Chưa có kiểm định vốn bảo trì và phân bổ dòng tiền nhóm cho cổ đông.', '- VHM: RNAV dự án giữ null. Kiểm tra thu hồi vốn sổ sách thuộc cổ đông chỉ là độ nhạy 0,6/0,85/1 lần; không phải RNAV, không trừ nợ lần thứ hai.', '- Mẫu số: giữ riêng bình quân EPS FY25, niêm yết và lưu hành nhà cung cấp (có quyền tạm tính). Giá trị trên mỗi mẫu số chỉ là tham chiếu có điều kiện; acceptedFairValuePerShare giữ null. Cổ phần chờ về trong tài khoản cá nhân không được dùng thay mẫu số doanh nghiệp.', '- Suất chiết khấu 18/15/12% là giả định độ nhạy; không phải WACC được quan sát. Nhánh 12% không cấp ngoại lệ ngưỡng BUY. Tăng trưởng dài hạn 1/2/2,5% được chặn không vượt tăng trưởng năm cuối và phải nhỏ hơn chiết khấu.', '']
    for row in summaries:
        report += [f"## {row['ticker']} — {row['sectorModel']}", '', f"[Hồ sơ số liệu, giả định và lineage](issuers/{row['ticker']}.json)", '']
        issuer=outputs[f"issuers/{row['ticker']}.json"]
        common_source=issuer['reportedCommonEarnings']['source']
        report.append(f"[PDF nguồn — ghi chú lợi nhuận thuộc cổ đông, trang {common_source['page']}](../../../../../{common_source['pdfPath']}#page={common_source['page']})")
        report.append('')
        if issuer['checkedNoteReadings']:
            report.append('Các khoản đã đọc ảnh trang nguồn (giá trị ở đơn vị nghìn tỷ VND):')
            report.append('')
            for reading_row in issuer['checkedNoteReadings']:
                report.append(f"- FY{reading_row['fiscalYear']}: {reading_row['caption']} = {trillions(reading_row['valueVnd'])}; [trang {reading_row['physicalPage']}](../../../../../{reading_row['sourcePdf']}#page={reading_row['physicalPage']}).")
            report.append('')
        cashrows=issuer['cashHistory']
        report += ['| Năm | CFO hợp nhất | Chi mua tài sản | CFO − chi mua tài sản |', '|---|---:|---:|---:|']
        for c in cashrows:
            report.append(f"| {c['year']} | {trillions(c['cfo'])} | {trillions(c['cashAcquisitionSpending'])} | {trillions(c['reportedPostAcquisitionCash'])} |")
        report.append('')
        if issuer['independentInputSensitivity']:
            report += ['Độ nhạy riêng, giữ giả định cơ sở khác không đổi (nghìn tỷ VND):', '', '| Chiết khấu | LN cơ sở × 0,9 | LN cơ sở × 1 | LN cơ sở × 1,1 |', '|---|---:|---:|---:|']
            grid=issuer['independentInputSensitivity']
            for idx in range(0,9,3):
                report.append(f"| {number(grid[idx]['discount'])*100}% | {' | '.join(trillions(x['equityValue']) for x in grid[idx:idx+3])} |")
            report.append('')
        for snap in issuer['debtReview']['observedSnapshots']:
            report.append(f"- Nợ vay ghi nhận {snap['date']}: {trillions(snap['reportedBorrowings'])}; tiền ghi nhận: {trillions(snap['reportedCash'])} nghìn tỷ VND. Cùng phiên bản nguồn: {snap['sameSourceVintage']}. Nợ ròng đủ điều kiện: chưa xác định.")
        if issuer['debtReview']['repaymentSensitivity']:
            stress=issuer['debtReview']['repaymentSensitivity'][-1]
            report.append(f"- Stress riêng: nếu phải trả 20% số nợ H1, tiền ghi nhận còn lại tối đa {trillions(stress['reportedCashCoverageUpperBound'])} nghìn tỷ VND; chưa chứng minh tiền tự do sử dụng hoặc lịch đáo hạn. Mô hình chính đang giả định tái tài trợ gốc nợ.")
        for delta in issuer['scenarios'][1]['normalization']['adjustments']:
            report.append(f"- Cơ sở: {delta['reason']}; điều chỉnh sau thuế thuộc cổ đông giả định {trillions(delta['afterTaxCommonVnd'])} nghìn tỷ VND.")
        report += [f'- Còn cần: {m}' for m in row['remaining']]
        report.append('')
    report += ['## Tái lập và ranh giới nghiệm thu', '', '`python3 scripts/build-held-normalization.py --check` kiểm tra byte đầu ra và toàn bộ hash nguồn đã dùng. `python3 scripts/test-held-normalization.py` kiểm tra số học, nguồn, kịch bản và các trường hợp bị chặn.', '', 'Gói này bổ sung research candidate cho 11 mã; không thay current-review của 30 mã, không sửa bằng chứng R1–R4, contract HUMAN/FORMAL, trọng số, ledger, DB hay dashboard. Chưa cấp điểm VAL, NAV hoặc giao dịch. Các giả định có thể được sửa trong phiên bản kế tiếp sau phản biện; dữ kiện nguồn không bị sửa theo mô hình.', '', 'Phương pháp: [CFA — Residual income valuation](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/residual-income-valuation), [Damodaran — Financial service companies](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/littlebook/financialsvccompanies.htm). Các nguồn này hỗ trợ cấu trúc mô hình, không xác nhận giả định hay định giá từng mã.', '']
    encoded = {k:json.dumps(v,ensure_ascii=False,indent=2)+'\n' for k,v in outputs.items()}
    encoded['REPORT.md'] = '\n'.join(report)
    for path in ['scripts/build-held-normalization.py','scripts/lib/held_normalization.py','scripts/test-held-normalization.py','docs/fundamental-data-engine/scoring-dataset-acceptance/current-review.json','src/infrastructure/dependencies/active-authorities.json']:
        pin(path)
    encoded['manifest.json'] = json.dumps(dict(contract='held-normalization-manifest-v1',sourcePins=pins,outputHashes={k:hashlib.sha256(v.encode()).hexdigest() for k,v in encoded.items()},inputQualification='RESEARCH_ONLY_NO_SOURCE_PROMOTION'),ensure_ascii=False,indent=2)+'\n'
    return encoded


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    outputs=build()
    for name,content in outputs.items():
        path=ROOT/OUT/name
        if args.check:
            if not path.is_file() or path.read_text()!=content:
                raise ValueError(f'NONREPRODUCIBLE_OUTPUT:{name}')
        else:
            path.parent.mkdir(parents=True,exist_ok=True);path.write_text(content)
    print(f"{'CHECKED' if args.check else 'BUILT'}: {len(outputs)} outputs; 11 issuers; 30 conditional valuations + 3 VHM book crosschecks; no production authority")

if __name__=='__main__':main()
