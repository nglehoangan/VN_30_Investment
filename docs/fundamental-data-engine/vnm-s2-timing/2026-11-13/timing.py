"""Dated evidence and accounting bridges; no financial admission or forecast default."""
from decimal import Decimal as D
from datetime import date

def bridge(opening,declared,paid,closing):
 result=D(opening)+D(declared)-D(paid)
 if result!=D(closing):raise ValueError('DIVIDEND_BRIDGE_CONFLICT')
 return str(result)

def observed_quarter(ytd,h1,scope_ytd,scope_h1):
 if scope_ytd!=scope_h1:raise ValueError('SCOPE_MISMATCH')
 return str(D(ytd)-D(h1))

def dated_cfo(amount,receipt_date,source_kind):
 # Historical realization is never a future committed receipt.
 if receipt_date is None or source_kind!='VERIFIED_FUTURE_COMMITTED_RECEIPT':return None
 date.fromisoformat(receipt_date)
 return str(D(amount))

def can_upgrade_deposit(*,identity_verified,maturity_verified,free_use_verified,debtor_access_verified):
 return all([identity_verified,maturity_verified,free_use_verified,debtor_access_verified])

def envelope(at,fixed_date,fixed_amount,current_debt,classification_end):
 at=date.fromisoformat(at);fixed=date.fromisoformat(fixed_date);end=date.fromisoformat(classification_end)
 due=D(fixed_amount) if at>=fixed else D(0)
 # Bounds reflect the accounting bucket only, never actual per-loan payment dates.
 return {'knownFixedDueVnd':str(due),'currentDebtDueLowerVnd':str(D(current_debt) if at>=end else D(0)),'currentDebtDueUpperVnd':str(D(current_debt)),'basis':'ACCOUNTING_CURRENT_BUCKET_ENVELOPE_NOT_VERIFIED_CONTRACTUAL_MATURITIES'}
