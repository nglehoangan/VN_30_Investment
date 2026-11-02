"""Decimal-only research scenarios; never accounting or scoring admission."""
from decimal import Decimal, localcontext

D = Decimal
ONE = D(1)


def number(value):
    if value is None or isinstance(value, (float, bool)):
        raise ValueError('EXPLICIT_LOSSLESS_DECIMAL_REQUIRED')
    result = D(value)
    if not result.is_finite():
        raise ValueError('FINITE_DECIMAL_REQUIRED')
    return result


def text(value):
    with localcontext() as ctx:
        ctx.prec = 50
        rounded = number(value).quantize(D('0.000001'))
        return '0' if rounded == 0 else format(rounded, 'f').rstrip('0').rstrip('.')


def present_value(flows, rate):
    r = number(rate)
    if not flows or r <= 0:
        raise ValueError('CASHFLOWS_AND_POSITIVE_DISCOUNT_REQUIRED')
    return sum((number(c) / (ONE + r) ** (i + 1) for i, c in enumerate(flows)), D(0))


def owner_cash(earnings, conversion, growth, incremental_return, discount, terminal_growth):
    e, c, g, roi, r, tg = map(number, (earnings, conversion, growth, incremental_return, discount, terminal_growth))
    if e <= 0 or not 0 < c <= 1 or not 0 <= tg < r or not 0 <= tg <= g < roi:
        raise ValueError('INVALID_OWNER_CASH_ASSUMPTIONS')
    # Conversion covers maintenance/working capital, EXCLUDING expansion funding.
    # Expansion funding is deducted once. No cash/debt adjustment: earnings retain interest.
    flows, years = [], []
    for year in range(1, 6):
        e *= ONE + g
        retention = e * g / roi
        cash = e * c - retention
        flows.append(cash)
        years.append(dict(year=year, earnings=text(e), maintenanceAndWorkingCapitalDrag=text(e*(ONE-c)), growthFunding=text(retention), commonCash=text(cash)))
    terminal_cash = e * (ONE + tg) * (c - tg / roi)
    if terminal_cash <= 0:
        raise ValueError('NONPOSITIVE_SUSTAINABLE_TERMINAL_CASH')
    terminal_pv = terminal_cash / (r-tg) / (ONE+r)**5
    value = present_value(flows, r) + terminal_pv
    # Independent accounting identity, not a second valuation model.
    assert all(number(y['commonCash']) <= number(y['earnings']) for y in years)
    return dict(model='CONDITIONAL_COMMON_CASH_DCF', equityValue=text(value), years=years,
                terminalCash=text(terminal_cash), terminalPresentValue=text(terminal_pv),
                terminalValueShare=text(terminal_pv/value), cashDebtAdjustment='0',
                financialIncomeAndExpenseRetained=True)


def residual_income(book, earnings, growth, discount, terminal_growth):
    b, e, g, r, tg = map(number, (book, earnings, growth, discount, terminal_growth))
    if b <= 0 or e <= 0 or not 0 <= tg <= g < e/b or not r > tg >= 0:
        raise ValueError('INVALID_CLEAN_SURPLUS_CAPITAL_ASSUMPTIONS')
    initial, roe, years, residuals, dividends = b, e/b, [], [], []
    for year in range(1, 6):
        profit, retained = b*roe, b*g
        residual, dividend = profit-b*r, profit-retained
        years.append(dict(year=year, openingCommonBook=text(b), earnings=text(profit), retained=text(retained), dividends=text(dividend), residual=text(residual)))
        residuals.append(residual); dividends.append(dividend); b += retained
    # Exact terminal clean surplus with constant ROE and terminal book growth.
    terminal_residual = b * (roe-r) / (r-tg)
    terminal_equity = b * (roe-tg) / (r-tg)
    rim = initial + present_value(residuals, r) + terminal_residual/(ONE+r)**5
    ddm = present_value(dividends, r) + terminal_equity/(ONE+r)**5
    if abs(rim-ddm) > D('0.000001'):
        raise ValueError('CLEAN_SURPLUS_RIM_DDM_MISMATCH')
    return dict(model='CONDITIONAL_RESIDUAL_INCOME', equityValue=text(rim), ddmCrosscheck=text(ddm),
                crosscheckDifference=text(rim-ddm), normalizedRoe=text(roe), years=years,
                terminalCommonBook=text(b), fundingDebtAdjustment='0')


def loan_charge(rows, target_average_loans, multiplier):
    if number(target_average_loans) <= 0 or number(multiplier) <= 0:
        raise ValueError('POSITIVE_TARGET_LOANS_AND_CREDIT_MULTIPLIER_REQUIRED')
    if len(rows) != 3 or [x['year'] for x in rows] != list(range(rows[0]['year'], rows[0]['year']+3)):
        raise ValueError('THREE_CONTIGUOUS_LOAN_YEARS_REQUIRED')
    for i, row in enumerate(rows):
        if number(row['opening']) <= 0 or number(row['closing']) <= 0 or number(row['charge']) < 0:
            raise ValueError('POSITIVE_GROSS_LOANS_AND_NONNEGATIVE_CHARGE_REQUIRED')
        if i and number(row['opening']) != number(rows[i-1]['closing']):
            raise ValueError('LOAN_DENOMINATOR_CONTINUITY_REQUIRED')
    rate = sum((number(x['charge']) for x in rows), D(0)) / sum(((number(x['opening'])+number(x['closing']))/2 for x in rows), D(0))
    return rate, rate*number(target_average_loans)*number(multiplier)
