"""Read-only, event-specific VIC research evidence checks; never grants production authority."""
from lib.vic_claim_bridge import number
from datetime import date

TARGET = {'issuer': 'VIC', 'period': 'FY2025', 'framework': 'VAS',
          'scope': 'VIC_CONSOLIDATED', 'currency': 'VND'}
FIELDS = ('pretaxVnd', 'currentTaxExpenseVnd', 'deferredTaxExpenseVnd',
          'afterTaxParentVnd', 'afterTaxNciVnd')


def validate_event(row, evidence):
    errors = []
    if row.get('eventId') not in ('VIC-SPONSOR-FY2025', 'VIC-NOVATECH-GAIN-FY2025'):
        errors.append('UNSUPPORTED_EVENT')
    if any(row.get(k) != v for k, v in TARGET.items()):
        errors.append('FRAMEWORK_PERIOD_PERIMETER_BINDING_REQUIRED')
    if not row.get('legalEntity') or not row.get('economicDate'):
        errors.append('EVENT_ENTITY_AND_DATE_REQUIRED')
    try:
        day = date.fromisoformat(row.get('economicDate'))
        if day.year != 2025 or day.isoformat() != row.get('economicDate'):
            raise ValueError()
    except (TypeError, ValueError):
        errors.append('SUPPORTED_FY2025_ISO_DATE_REQUIRED')
    parsed = {}
    for key in FIELDS:
        try:
            parsed[key] = number(row.get(key))
        except (ValueError, TypeError, ArithmeticError):
            errors.append('MISSING_OR_INVALID_' + key)
    for role in ('pretax', 'currentTax', 'deferredTax', 'parentNci'):
        pin = row.get('bindings', {}).get(role)
        source = evidence.get(pin) if isinstance(pin, str) else None
        if not source or any(source.get(k) != row.get(k) for k in
                (*TARGET, 'eventId', 'legalEntity', 'economicDate')):
            errors.append('EXACT_SOURCE_BINDING_REQUIRED_' + role)
            continue
        if source.get('role') != role or source.get('measurement') != 'EVENT_PNL':
            errors.append('EVENT_PNL_EVIDENCE_REQUIRED_' + role)
        # A web extract or a group tax reconciliation cannot satisfy native VAS admission.
        if source.get('integrity') != 'VERIFIED_ORIGINAL' or not source.get('locator'):
            errors.append('ORIGINAL_AND_LOCATOR_REQUIRED_' + role)
        keys = {'pretax': ('pretaxVnd',), 'currentTax': ('currentTaxExpenseVnd',),
                'deferredTax': ('deferredTaxExpenseVnd',),
                'parentNci': ('afterTaxParentVnd', 'afterTaxNciVnd')}[role]
        if any(source.get(k) != row.get(k) for k in keys):
            errors.append('SOURCE_VALUE_MISMATCH_' + role)
    if len(parsed) == len(FIELDS) and (parsed['pretaxVnd'] - parsed['currentTaxExpenseVnd']
            - parsed['deferredTaxExpenseVnd'] != parsed['afterTaxParentVnd'] + parsed['afterTaxNciVnd']):
        errors.append('AFTER_TAX_PARENT_NCI_IDENTITY_REQUIRED')
    return {'contract': 'vic-event-research-admission-v1', 'errors': errors,
            'eventEvidenceComplete': not errors, 'financialAcceptanceGranted': False,
            'productionAuthorityGranted': False, 'navAuthorityGranted': False,
            'tradingAuthorityGranted': False}
