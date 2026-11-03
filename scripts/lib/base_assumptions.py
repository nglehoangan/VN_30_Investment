"""Analyst choices and finite, labelled sensitivities; no admission authority."""
from decimal import Decimal, localcontext


def number(value):
    if not isinstance(value, str):
        raise ValueError('LOSSLESS_DECIMAL_STRING_REQUIRED')
    result = Decimal(value)
    if not result.is_finite():
        raise ValueError('FINITE_VALUE_REQUIRED')
    return result


def text(value):
    return format(value, 'f')


def earnings(common, adjustments, *, tax, common_weight):
    t, w = number(tax), number(common_weight)
    if not 0 <= t <= 1 or not 0 <= w <= 1:
        raise ValueError('INCIDENCE_IN_ZERO_ONE_REQUIRED')
    if len({a['id'] for a in adjustments}) != len(adjustments):
        raise ValueError('DUPLICATE_ADJUSTMENT')
    if any(not 0 <= number(a.get('provenCommonWeight',common_weight)) <= 1 for a in adjustments):
        raise ValueError('INCIDENCE_IN_ZERO_ONE_REQUIRED')
    with localcontext() as ctx:
        ctx.prec = 60
        return number(common) + sum((number(a['pretaxVnd']) * (1-t) *
            number(a.get('provenCommonWeight', common_weight)) for a in adjustments), Decimal(0))


def independent_envelope(common, adjustments, *, max_tax, standalone):
    """Each known adjustment may have different incidence; no offsetting guess."""
    if len({a['id'] for a in adjustments}) != len(adjustments):
        raise ValueError('DUPLICATE_ADJUSTMENT')
    lo = hi = number(common)
    for a in adjustments:
        weights = [a['provenCommonWeight']] if 'provenCommonWeight' in a else ['1'] if standalone else ['0','1']
        values = [earnings('0', [a], tax=t, common_weight=w) for t in ['0',max_tax] for w in weights]
        lo += min(values)
        hi += max(values)
    return dict(minimumVnd=text(lo), maximumVnd=text(hi),
                coversOnlyNamedAdjustmentsAndAssumedIncidences=True,
                completeEconomicOrFundBound=False)


def choose_adjustments(profile):
    """Avoid unsupported positive addbacks and unreasoned 50% midpoints."""
    from copy import deepcopy
    base = next(s for s in profile['scenarios'] if s['name'] == 'BASE')
    bear = next(s for s in profile['scenarios'] if s['name'] == 'BEAR')
    result = deepcopy(base['adjustments'])
    ticker = profile['ticker']
    for a in result:
        original = a['pretaxVnd']
        # Prior envelopes describe prior amounts, not the newly chosen amount.
        a.pop('incidenceEnvelope', None)
        a['priorModelReason'] = a.pop('reason')
        if profile['sector'] == 'BANK' and (a['id'].endswith('total-credit-proxy') or a['id'].endswith('recoveries-mean')):
            a['pretaxVnd'] = text(min(Decimal(0), number(original)))
            a['selectionReason'] = 'Không cộng lợi nhuận từ giảm dự phòng/thu hồi giả định; giữ khoản giảm theo proxy như dự phòng thận trọng, chưa coi là dự báo khoản vay đã kiểm chứng.'
        elif ticker == 'MCH':
            a['pretaxVnd'] = '0'
            a['selectionReason'] = 'Giữ lãi bên liên quan đã báo cáo; nguồn hiện có chưa chứng minh mất 50%. Rủi ro thu hồi 0–100% được đo riêng, không coi lãi kế toán là tiền đã thu.'
        elif ticker in ['SAB','VJC','VIC']:
            a['pretaxVnd'] = next(x['pretaxVnd'] for x in bear['adjustments'] if x['id'] == a['id'])
            a['selectionReason'] = {'SAB':'Loại hết khoản hoàn nhập chưa chứng minh lặp lại; không chọn 50% chỉ vì ở giữa hai kịch bản.',
                'VJC':'Chọn nhánh hàng không cốt lõi: loại toàn bộ biên bán tàu bay/hỗ trợ/hoàn nhập, giữ chi phí và nghĩa vụ thuê. Nhánh tài trợ đội bay đo riêng.',
                'VIC':'Không cộng lại chi phí xóa sổ đã lặp lại; loại tài trợ trong phép thử bất lợi. Phần thuộc mẹ chưa xác định nên phép thử này không phải estimate cơ sở.'}[ticker]
        else:
            a['selectionReason'] = 'Giữ phép điều chỉnh có toán hạng nguồn; lựa chọn mức hoạt động được bảo vệ riêng ở hồ sơ mã, không dùng tỷ lệ lợi nhuận mẹ/nhóm làm sở hữu.'
        a['priorBasePretaxVnd'] = original
        a['selectedPretaxChangeVnd'] = text(number(a['pretaxVnd']) - number(original))
        # Never attach source certainty to a decision made in this review.
        a['selectionIsAnalystJudgment'] = True
        a['selectedAfterTaxCommonDeltaVnd'] = text(earnings('0',[a],tax='0',common_weight='1'))
        a['selectedDeltaIncidenceEnvelope'] = independent_envelope('0',[a],
            max_tax=text(max(map(number,profile['assumedMarginalTaxRates']))),
            standalone=profile['scope']=='STANDALONE')
    return result
