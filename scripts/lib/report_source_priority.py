"""PDF-first display selection. Provider fallback is a labelled review reference."""
import json
import pathlib
import re
from decimal import Decimal

POLICY_PATH = pathlib.Path(__file__).resolve().parents[2] / 'src/domain/fundamentals/report-display-source-priority-v2.json'
POLICY = json.loads(POLICY_PATH.read_text())


def numeric(value):
    return isinstance(value,str) and re.fullmatch(r'-?\d+(?:\.\d+)?',value) is not None


def compatible(row, context):
    if any(context.get(key) is not None and row.get(key) != context[key] for key in ['concept','period']):
        return False
    return all(row.get(key) is None or context.get(key) is None or row[key] == context[key]
               for key in ['concept','period','scope','unit'])


def valid_pdf(row):
    if not numeric(row.get('value')) or row.get('status') not in ['VALUE','ZERO']:
        return False
    if row.get('kind') == 'EXPLICIT_DISPLAY_AGGREGATE':
        operands = row.get('operands',[])
        return bool(operands and row.get('formula') and all(row.get(k) is not None for k in ['unit','period','scope'])
                    and all(valid_pdf(o) and all(o.get(k) == row.get(k) for k in ['unit','period','scope']) for o in operands)
                    and sum((Decimal(o['value']) for o in operands),Decimal(0)) == Decimal(row['value']))
    return True


def choose(pdf_candidates, cafef_candidates, context):
    pdf = [r for r in pdf_candidates if compatible(r,context) and valid_pdf(r)]
    reported = [r for r in pdf if r.get('kind') != 'EXPLICIT_DISPLAY_AGGREGATE']
    pdf = reported or pdf
    cf = [r for r in cafef_candidates if compatible(r,context) and numeric(r.get('value')) and r.get('status') in ['VALUE','ZERO']]
    result = {'policyVersion':POLICY['version'],'value':None,'unit':None,'source':None,
              'needsReview':False,'reviewReasons':[],'productionAdmissible':False}
    if pdf:
        signatures = {(Decimal(r['value']),r.get('unit'),r.get('scope'),r.get('period')) for r in pdf}
        if len(signatures) != 1:
            return {**result,'source':'UNRESOLVED_PDF_CONFLICT','needsReview':True,
                    'reviewReasons':['CONFLICTING_PDF_VALUES_OR_DIMENSIONS'],'pdfCandidates':pdf,'cafefReferences':cf}
        primary = pdf[0]
        result.update(value=primary['value'],unit=primary.get('unit'),source='PDF_EXPLICIT_AGGREGATE' if primary.get('kind')=='EXPLICIT_DISPLAY_AGGREGATE' else 'PDF_REPORTED')
        if result['source']=='PDF_EXPLICIT_AGGREGATE':
            result['reviewReasons'].append('VERIFY_EXPLICIT_PDF_AGGREGATE')
        if cf and any(Decimal(r['value']) != Decimal(primary['value']) for r in cf):
            result['reviewReasons'].append('PDF_CAFEF_VALUE_DIFFERENCE')
        if primary.get('unit') is None or primary.get('scope') is None:
            result['reviewReasons'].append('PDF_DIMENSION_REVIEW_REQUIRED')
        result['needsReview'] = bool(result['reviewReasons'])
        return result
    if cf:
        signatures = {(Decimal(r['value']),r.get('unit'),r.get('scope'),r.get('period')) for r in cf}
        if len(signatures) != 1:
            return {**result,'source':'UNRESOLVED_CAFEF_REFERENCE_CONFLICT','needsReview':True,
                    'reviewReasons':['CONFLICTING_CAFEF_REFERENCES'],'cafefReferences':cf}
        reference = cf[0]
        reasons = ['CAFEF_REFERENCE_REQUIRES_USER_REVIEW','PDF_VALUE_NOT_AVAILABLE_IN_PILOT_SCOPE']
        if any(r.get('status')=='DASH' for r in pdf_candidates):
            reasons.append('PDF_DASH_IS_NOT_CONFIRMED_ZERO')
        if reference.get('unit') is None or reference.get('scope') is None:
            reasons.append('CAFEF_UNIT_OR_SCOPE_UNVERIFIED')
        if Decimal(reference['value']) == 0:
            reasons.append('PROVIDER_ZERO_IS_NOT_VERIFIED_PDF_ABSENCE')
        return {**result,'value':reference['value'],'unit':reference.get('unit'),'source':'CAFEF_REFERENCE',
                'needsReview':True,'reviewReasons':reasons}
    return {**result,'source':'MISSING','needsReview':True,'reviewReasons':['NO_COMPATIBLE_NUMERIC_SOURCE']}
