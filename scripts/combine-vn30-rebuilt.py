"""PDF-first presentation for the freshly rebuilt corpus; retain source/revision variants."""
import collections
import gzip
import hashlib
import json
import pathlib
import re
import sys
import unicodedata
from decimal import Decimal

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts/lib'))
from report_source_priority import POLICY, choose, numeric


def load(path):
    data = path.read_bytes()
    return json.loads(gzip.decompress(data) if path.suffix == '.gz' else data)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def caption(text):
    text = ''.join(c for c in unicodedata.normalize('NFD', (text or '').lower().replace('đ', 'd')) if unicodedata.category(c) != 'Mn')
    text = re.sub(r'^\s*(?:[a-z]|[ivxlcdm]+|\d+(?:\.\d+)*)[.)]\s*', '', text)
    text = re.sub(r'\([^)]*=+[^)]*\)', '', text)
    return re.sub(r'[^a-z0-9]+', ' ', text).strip()


def pointer(parts):
    return '/' + '/'.join(str(p).replace('~', '~0').replace('/', '~1') for p in parts)


def main():
    plan = load(ROOT / 'docs/fundamental-data-engine/rebuild-2026-10-19/source-plan.json')
    output = ROOT / 'data/combine'
    manifest = {'schemaVersion': 'vn30-combine-v1', 'policy': POLICY, 'productionAdmissible': False, 'complete': False,
                'inputManifests': ['data/manual-download/manifest.json', 'data/manual-extracted-pdf/display-manifest.json', 'data/manual-extracted-pdf/notes/manifest.json', 'data/manual-extracted-api/manifest.json'], 'files': []}
    for ticker in plan['tickers']:
        pdf_path = ROOT / f'data/manual-extracted-pdf/{ticker}.json'
        api_path = ROOT / f'data/manual-extracted-api/{ticker}.json'
        pdf, api = load(pdf_path), load(api_path)
        result = {'schemaVersion': 'vn30-combine-v1', 'ticker': ticker, 'policyVersion': POLICY['version'],
                  'status': 'UNREVIEWED_PRESENTATION', 'productionAdmissible': False, 'reports': {},
                  'notes': {'path': f'data/manual-extracted-pdf/notes/{ticker}.json', 'sha256': sha(ROOT / f'data/manual-extracted-pdf/notes/{ticker}.json'), 'status': 'UNREVIEWED_FULL_PAGE_TEXT'},
                  'sourceFiles': [{'path': str(p.relative_to(ROOT)), 'sha256': sha(p)} for p in [pdf_path, api_path]]}
        review, excluded = [], []
        pdf_amounts = collections.defaultdict(list)
        for rk, rr in pdf['reports'].items():
            for pk, pp0 in rr['periods'].items():
                for vi0, vv0 in enumerate(pp0['variants']):
                    for gi0, gg0 in enumerate(vv0['groups']):
                        for ri0, row0 in enumerate(gg0['rows']):
                            if row0['status'] in ['VALUE', 'ZERO'] and numeric(row0['value']):
                                pdf_amounts[(pk, Decimal(row0['value']))].append((row0, vv0, pointer(['reports', rk, 'periods', pk, 'variants', vi0, 'groups', gi0, 'rows', ri0])))
        selected_count = collections.Counter()
        for report_key in dict.fromkeys([*pdf['reports'], *api['reports']]):
            pr = pdf['reports'].get(report_key, {'periods': {}})
            ar = api['reports'].get(report_key, {'periods': {}})
            report = result['reports'][report_key] = {'key': report_key, 'label': pr.get('label', ar.get('label')), 'periods': {}}
            for period_key in dict.fromkeys([*pr['periods'], *ar['periods']]):
                pp = pr['periods'].get(period_key, {})
                ap = ar['periods'].get(period_key, {})
                period = report['periods'][period_key] = {k: pp.get(k, ap.get(k)) for k in ['year', 'quarter', 'periodType', 'asOf']}
                period['variants'] = []
                api_rows, pdf_rows = [], []
                for vi, variant in enumerate(ap.get('variants', [])):
                    for gi, group in enumerate(variant['groups']):
                        for ri, row in enumerate(group['rows']):
                            api_rows.append((vi, gi, ri, row, variant, pointer(['reports', report_key, 'periods', period_key, 'variants', vi, 'groups', gi, 'rows', ri])))
                api_by_caption = collections.defaultdict(list)
                for entry in api_rows:
                    if not entry[4].get('modeMismatch') and caption(entry[3]['label']):
                        api_by_caption[caption(entry[3]['label'])].append(entry)
                used_api = set()
                signatures = collections.defaultdict(set)
                for vi, variant in enumerate(pp.get('variants', [])):
                    counts = collections.Counter(caption(r['label']) for g in variant['groups'] for r in g['rows'])
                    selected_variant = {k: variant.get(k) for k in ['id', 'periodKey', 'year', 'quarter', 'periodType', 'asOf', 'label', 'status', 'reportingScope', 'scopeStatus', 'source']}
                    selected_variant.update(id='pdf:' + variant['id'], groups=[], productionAdmissible=False)
                    for gi, group in enumerate(variant['groups']):
                        selected_group = {k: group.get(k) for k in ['id', 'label', 'order', 'sourcePage', 'reportClassification', 'columnHeader', 'unitEvidence']}
                        selected_group['rows'] = []
                        selected_group['unmappedCells'] = group.get('unmappedCells', [])
                        for ri, row in enumerate(group['rows']):
                            ptr = pointer(['reports', report_key, 'periods', period_key, 'variants', vi, 'groups', gi, 'rows', ri])
                            norm = caption(row['label'])
                            concept = norm + ':' + str(row.get('code'))
                            unit = ':'.join(str(row.get(k)) for k in ['unit', 'currency', 'scale']) if row.get('unit') else None
                            context = {'concept': concept, 'period': period_key, 'scope': variant.get('reportingScope'), 'unit': unit}
                            p = {**context, 'value': row['value'], 'status': row['status']}
                            matches = api_by_caption.get(norm, []) if norm and counts[norm] == 1 else []
                            # One exact caption in each provider capture; never use value equality as mapping.
                            candidates = []
                            for entry in matches:
                                if sum(caption(e[3]['label']) == norm and e[0] == entry[0] for e in matches) == 1:
                                    candidates.append({**context, 'unit': None, 'scope': None, 'value': entry[3]['value'], 'status': entry[3]['status']})
                                    used_api.add(entry[5])
                            decision = choose([p], candidates, context)
                            selected_count[decision['source']] += 1
                            chosen = {'id': row['id'], 'code': row.get('code'), 'label': row['label'], 'order': row['order'],
                                      **decision,
                                      'status': ('ZERO' if Decimal(decision['value']) == 0 else 'VALUE') if numeric(decision['value']) else row['status'] if decision['source'] == 'MISSING' else 'UNRESOLVED',
                                      'lexicalValue': row.get('lexicalValue') if decision['source'] == 'PDF_REPORTED' else None,
                                      'pdfLexicalValue': row.get('lexicalValue'), 'pdfStatus': row['status'],
                                      'reportingScope': variant.get('reportingScope') if decision['source'] == 'PDF_REPORTED' else None,
                                      'currency': row.get('currency') if decision['source'] == 'PDF_REPORTED' else None,
                                      'unit': row.get('unit') if decision['source'] == 'PDF_REPORTED' else None,
                                      'pdfReportingScope': variant.get('reportingScope'),
                                      'scale': row.get('scale') if decision['source'] == 'PDF_REPORTED' else None,
                                      'pdfEvidence': {'path': str(pdf_path.relative_to(ROOT)), 'jsonPointer': ptr, 'sourcePage': group['sourcePage'],
                                                      **({'pdfPath': row['pdfEvidence']['path'], 'href': row['pdfEvidence']['href'], 'page': row['pdfEvidence']['page'], 'boxes': row.get('boxes', [])} if row.get('pdfEvidence') else {})},
                                      'cafefReferences': [{'path': str(api_path.relative_to(ROOT)), 'jsonPointer': e[5], 'label': e[3]['label'], 'code': e[3].get('code'), 'value': e[3]['value'], 'status': e[3]['status'], 'unit': e[4]['source'].get('providerUnit'), 'unitStatus': e[4]['source'].get('unitStatus')} for e in matches],
                                      'mappingBasis': 'UNIQUE_EXACT_NORMALIZED_CAPTION' if candidates else 'PDF_SOURCE_ROW',
                                      'needsReview': True, 'comparisonDimensionsVerified': False}
                            chosen['reviewReasons'] = list(dict.fromkeys(decision['reviewReasons'] + ['OCR_CAPTION_PERIOD_UNIT_SCOPE_REQUIRE_REVIEW'] + (['CAFEF_DIMENSIONS_UNVERIFIED'] if matches else [])))
                            selected_group['rows'].append(chosen)
                            pdf_rows.append((row, variant, ptr))
                            if numeric(row['value']) and row['status'] in ['VALUE', 'ZERO']:
                                signatures[(norm, row.get('code'), variant.get('reportingScope'), unit)].add(row['value'])
                            if decision['source'] != 'PDF_REPORTED' or 'PDF_CAFEF_VALUE_DIFFERENCE' in decision['reviewReasons']:
                                review.append({'report': report_key, 'period': period_key, 'pdfPointer': ptr, 'reasons': chosen['reviewReasons']})
                        selected_variant['groups'].append(selected_group)
                    period['variants'].append(selected_variant)
                period['conflicts'] = [{'caption': k[0], 'code': k[1], 'scope': k[2], 'unit': k[3], 'values': sorted(v), 'status': 'REVIEW_SOURCE_AND_REVISION_VARIANTS'} for k, v in signatures.items() if len(v) > 1]
                # Keep API captures/modes as separate variants, including mismatch rows in quarantine.
                for vi, variant in enumerate(ap.get('variants', [])):
                    av = {k: variant.get(k) for k in ['id', 'periodKey', 'year', 'quarter', 'periodType', 'label', 'providerType', 'providerContent', 'requestMode', 'modeMismatch', 'source']}
                    av.update(id='cafef-reference:' + variant['id'], groups=[], productionAdmissible=False, reportingScope=None)
                    for gi, group in enumerate(variant['groups']):
                        ag = {k: group.get(k) for k in ['id', 'label', 'order', 'providerOrder']}
                        ag['rows'], ag['unmappedCells'] = [], group.get('unmappedCells', [])
                        for entry in [e for e in api_rows if e[0] == vi and e[1] == gi]:
                            _, _, ri, row, _, ptr = entry
                            if ptr in used_api:
                                continue
                            norm = caption(row['label'])
                            same_caption = [p for p in pdf_rows if norm and caption(p[0]['label']) == norm]
                            amount_matches = []
                            if not same_caption and numeric(row['value']) and Decimal(row['value']) != 0:
                                amount_matches = [{'pdfPointer': p[2], 'label': p[0]['label'], 'value': p[0]['value'], 'unit': p[0].get('unit'), 'sourcePage': p[0]['sourcePage']} for p in pdf_amounts.get((period_key, Decimal(row['value'])), []) if caption(p[0]['label']) and caption(p[0]['label']) != norm]
                            if amount_matches and POLICY['excludeNonzeroCafeFFallbackMatchingOtherPdfCaption']:
                                excluded.append({'report': report_key, 'period': period_key, 'apiPointer': ptr, 'value': row['value'], 'label': row['label'], 'matches': amount_matches, 'reason': POLICY['duplicateExclusionReason'], 'provenProviderError': False, 'comparisonDimensionsVerified': False})
                                continue
                            blocked = bool(same_caption or variant.get('modeMismatch'))
                            reference_decision = choose([], [{'concept': norm, 'period': period_key, 'scope': None, 'unit': None, 'value': row['value'], 'status': row['status']}], {'concept': norm, 'period': period_key})
                            selected_count['UNRESOLVED_MAPPING' if blocked else reference_decision['source']] += 1
                            ag['rows'].append({**row, 'value': None if blocked else reference_decision['value'], 'referenceValue': row['value'], 'source': 'UNRESOLVED_MAPPING' if blocked else reference_decision['source'], 'unit': None, 'currency': None, 'scale': None, 'needsReview': True, 'productionAdmissible': False,
                                               'reviewReasons': ['AMBIGUOUS_PDF_CAPTION_OR_PROVIDER_MODE'] if blocked else list(dict.fromkeys(reference_decision['reviewReasons'] + ['NO_VERIFIED_PDF_MATCH_FOR_THIS_PERIOD'])),
                                               'apiEvidence': {'path': str(api_path.relative_to(ROOT)), 'jsonPointer': ptr}})
                            review.append({'report': report_key, 'period': period_key, 'apiPointer': ptr, 'reasons': ag['rows'][-1]['reviewReasons']})
                        av['groups'].append(ag)
                    period['variants'].append(av)
        path = output / f'{ticker}.json'
        write(path, result)
        write(output / 'review' / f'{ticker}.json', {'ticker': ticker, 'issues': review, 'excludedCafeFFallbacks': excluded})
        manifest['files'].append({'ticker': ticker, 'path': str(path.relative_to(ROOT)), 'sha256': sha(path), 'selections': dict(selected_count), 'reviewItems': len(review), 'excludedFallbacks': len(excluded)})
        write(output / 'manifest.json', manifest)
        print(json.dumps(manifest['files'][-1], ensure_ascii=False), flush=True)
    manifest['complete'] = len(manifest['files']) == len(plan['tickers'])
    write(output / 'manifest.json', manifest)


if __name__ == '__main__':
    main()
