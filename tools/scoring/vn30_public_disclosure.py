#!/usr/bin/env python3
"""Run a versioned public-disclosure feasibility packet for one ticker."""
import argparse
from decimal import Decimal
import json
from pathlib import Path
import re
import sys
import subprocess

if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from tools.scoring.public_disclosure import VERSION, AMENDMENT, METHODS, DIMENSIONS, assess_amendment, evaluate, rubric_contract
from tools.scoring.structural_nr import artifact, day, digest, require, source
from tools.scoring.vn30_score import Once, ROOT, scope
from tools.scoring.public_disclosure_v2 import VERSION as V2, evaluate_proposed


def verified_fields(packet, cutoff):
    fields, lineage = {}, {}
    for key, entries in packet['fields'].items():
        outputs = []
        for entry in entries:
            values = entry['values']
            if entry['sourceType'] == 'REVIEWED_TEXT':
                observed = source(entry['source']).read_text().splitlines()[entry['line']-1]
            else:
                observed = artifact(entry['source'])
            if entry['sourceType'] == 'PAGE_TEXT_EXCERPT':
                require(observed['page'] == entry['page'] and len(values) == 1
                        and values[0] in observed['text'], 'PUBLIC_FIELD_NOT_IN_PAGE')
            elif entry['sourceType'] in {'PAGE_TEXT', 'REVIEWED_TEXT'}:
                if entry['sourceType'] == 'PAGE_TEXT':
                    require(observed['page'] == entry['page'], 'PUBLIC_FIELD_PAGE_MISMATCH')
                    observed = observed['text']
                text = re.sub(r'(?<=\d)[., ](?=\d)', '', observed)
                require(all(re.search(r'(?<!\d)' + re.escape(str(value)) + r'(?!\d)', text)
                            for value in values), 'PUBLIC_FIELD_NOT_IN_PAGE')
            else:
                require(entry['sourceType'] == 'SCALAR' and len(values) == 1
                        and str(observed) == str(values[0]), 'PUBLIC_FIELD_VALUE_MISMATCH')
            if entry.get('publishedDate'):
                require(day(entry['publishedDate']) <= cutoff, 'PUBLIC_FIELD_PUBLISHED_AFTER_CUTOFF')
            require(day(entry['periodEnd']) <= cutoff and entry['scope'] and entry['unit'],
                    'PUBLIC_FIELD_SCOPE_MISMATCH')
            outputs.extend(values)
        lineage[key] = entries
        fields[key] = outputs
    return fields, lineage


def reconcile_v2(packet, args, rubrics, proposed, version=V2):
    """Use the exact existing Unified envelope and the actual EBCS verifier."""
    config = packet['v2']
    baseline = artifact(config['unified'])
    require(digest(baseline) == Path(config['unified']['path']).stem
            and baseline['subject'] == packet['subject'], 'V2_UNIFIED_BASIS_MISMATCH')
    candidate = baseline['sourceCandidate']
    path = source(candidate)
    output = subprocess.run(['node', str(ROOT / 'tools/scoring/vn30_ebcs_preview.mjs'),
                              '--ticker', args.ticker, '--cutoff', args.cutoff, '--input', str(path)],
                             cwd=ROOT, check=True, capture_output=True, text=True)
    preview = json.loads(output.stdout)
    require(preview['packetSha256'] == candidate['sha256'] and preview['inputHash'] == baseline['inputHash']
            and preview['status'] == 'RESEARCH_ONLY', 'V2_EBCS_INPUT_MISMATCH')
    validated = {row['rubricId']: row['points'] for row in preview['rubrics']}
    states = {row['rubricId']: row['state'] for row in preview['rubrics']}
    require(len(baseline['rows']) == len(rubrics)
            and {row['rubricId'] for row in baseline['rows']} == validated.keys() == rubrics.keys(),
            'V2_RUBRIC_INVENTORY_MISMATCH')
    rows = []
    for old in baseline['rows']:
        rid = old['rubricId']
        require(old['acceptedScore'] == validated[rid], 'RESEARCH_EBCS_DIVERGENCE:' + rid)
        attempt = proposed.get(rid)
        for pin in old['sourceIdentifiers'] + old['segmEvidence']:
            source(pin)
        rows.append({
            'rubricId': rid, 'economicPrinciple': rubrics[rid]['principle'], 'methodologyVersion': version if attempt else old['methodologyVersion'],
            'sectorMethod': packet['subject']['sector'], 'pitCutoff': args.cutoff, 'financialScope': old['financialScope'],
            'approvedAnchors': rubrics[rid]['anchors'], 'inputFields': rubrics[rid]['topics'],
            'sourceLineage': old['sourceIdentifiers'] + old['segmEvidence'], 'counterEvidence': old['counterEvidence'],
            'researchScore': old['researchScore'], 'ebcsState': states[rid], 'ebcsAcceptedScore': validated[rid], 'officialScore': old['officialScore'],
            'proposedResearchScore': attempt['score'] if attempt else old['researchScore'],
            'failedCondition': attempt['reason'] if attempt else old['disposition'].get('reason'),
            'actualInputs': old['assessmentSources'] if not attempt else attempt.get('evidence', {}),
            'failureOwner': ('EVIDENCE_AND_PROPOSED_CALIBRATION' if attempt and attempt['score'] is None
                             else old['segmFeasibilityState']),
            'proposedCorrection': old['disposition'].get('detail'), 'proposal': attempt,
        })
    return {'methodologyVersion': version, 'rows': rows, 'approvedEbcsCoverage': baseline['coverage'],
            'historicalPitGranted': False, 'productionAuthority': 'NONE'}


def run(args):
    _, _, job, _ = scope(args)
    req = job['request']
    packet = json.loads(args.packet.read_text())
    require(packet['contract'] == VERSION
            and packet['subject'] == {k: req[k] for k in ('ticker', 'securityId', 'sector', 'referenceDate')},
            'PUBLIC_METHOD_SUBJECT_MISMATCH')
    require(packet['purpose'] == 'RETROSPECTIVE_RESEARCH', 'PUBLIC_METHOD_RESEARCH_ONLY')
    for pin in packet.get('reviewReferences', []):
        source(pin)
    fields, lineage = verified_fields(packet, args.cutoff)
    rubrics = rubric_contract(packet['rubrics'])
    rows = []
    proposals = {}
    for rid, needs in METHODS.items():
        evidence = {key: lineage.get(key, []) for key in needs}
        values = {}
        financial_scopes = {item['scope'] for key, items in evidence.items() if key != 'close'
                            for item in items}
        require(len(financial_scopes) <= 1, 'PUBLIC_METHOD_MIXED_FINANCIAL_SCOPE')
        for key, operands in evidence.items():
            if not operands:
                continue
            raw = fields[key]
            if key == 'minimum_fcf':
                require(all(cfo['periodEnd'] == capex['periodEnd'] and cfo['unit'] == capex['unit'] == 'VND'
                            and cfo['documentHash'] == capex['documentHash']
                            for cfo, capex in zip(operands[::2], operands[1::2], strict=True)),
                        'PUBLIC_FCF_CASH_FLOW_SCOPE_MISMATCH')
                values[key] = min(int(cfo)-int(capex) for cfo, capex in zip(raw[::2], raw[1::2], strict=True))
            elif all('year' in op for op in operands):
                require(len(raw) == len(operands), 'YEARLY_FIELD_REQUIRES_ONE_VALUE')
                values[key] = {str(op['year']): value for op, value in zip(operands, raw, strict=True)}
                require(len(values[key]) == len(operands), 'DUPLICATE_PUBLIC_METRIC_YEAR')
            elif len(raw) == 1:
                values[key] = int(raw[0]) * operands[0].get('scale', 1) if key != 'close' else (
                    str(Decimal(str(raw[0])) * operands[0].get('scale', 1)))
            else:
                raise ValueError('UNSUPPORTED_PUBLIC_METRIC_SHAPE')
        if rid == 'VAL-PRIMARY' and packet.get('valuationScenarios'):
            assumptions = packet['valuationScenarios']
            source(assumptions['source'])
            require(set(assumptions['cases']) == {'Bear', 'Base', 'Bull'}, 'INCOMPLETE_PUBLIC_VALUATION_SCENARIOS')
            values['scenarios'] = assumptions['cases']
            evidence['scenarios'] = assumptions
        row = evaluate(rid, values, req['sector'], evidence)
        amendment_evidence = {key: lineage[key] for keys in DIMENSIONS[rid].values() for key in keys if key in lineage}
        if packet.get('amendmentReviews', {}).get(rid) and row['state'] != 'METHODOLOGY_APPROVAL_REQUIRED':
            review = artifact(packet['amendmentReviews'][rid])
            require(review['subject'] == packet['subject'] and review['rubricId'] == rid
                    and review['evidenceHash'] == digest(amendment_evidence), 'AMENDMENT_REVIEW_BASIS_MISMATCH')
            for pin in review['counterEvidence']:
                source(pin)
        else:
            review = None
        row['amendment'] = assess_amendment(rid, amendment_evidence, rubrics[rid]['anchors'], review)
        row['amendmentEvidence'] = amendment_evidence
        if rid == 'FH-STRESS' and all(fields.get(k) for k in (
                'total_debt', 'equity_at_close', 'current_liabilities', 'current_assets',
                'prior_current_assets', 'prior_current_liabilities', 'interest_expense', 'ebit_at_close', 'cash')):
            def scalar(key):
                return Decimal(str(fields[key][0]))
            row['compositeDiagnostics'] = {
                'debtToEquity': str(scalar('total_debt') / scalar('equity_at_close')),
                'cashToCurrentLiabilities': str(scalar('cash') / scalar('current_liabilities')),
                'ebitToInterest': str(scalar('ebit_at_close') / scalar('interest_expense')),
                'workingCapitalChangeVnd': str(scalar('current_assets') - scalar('current_liabilities')
                                              - scalar('prior_current_assets') + scalar('prior_current_liabilities')),
            }
        if packet.get('v2'):
            proof_pin = packet['v2'].get('bandReviews', {}).get(rid)
            reviewed_values, reviewed_evidence = {}, {}
            if proof_pin:
                proof = artifact(proof_pin)
                require(proof['subject'] == packet['subject'] and proof['version'] == V2
                        and proof['rubricId'] == rid and proof['calculationHash'] == digest(row.get('metrics', {})),
                        'V2_BAND_REVIEW_SCOPE_MISMATCH')
                require(proof.get('counterEvidence') and proof.get('scopeBasis'), 'V2_COUNTER_EVIDENCE_REVIEW_REQUIRED')
                for pin in proof['counterEvidence']:
                    source(pin)
                    require(day(pin['publicationDate']) <= args.cutoff, 'V2_REVIEW_EVIDENCE_AFTER_CUTOFF')
                reviewed_values = proof['values']
                reviewed_evidence = proof['evidence']
                for pins in reviewed_evidence.values():
                    for pin in pins:
                        source(pin)
                        require(day(pin['publicationDate']) <= args.cutoff, 'V2_REVIEW_EVIDENCE_AFTER_CUTOFF')
            attempt = evaluate_proposed(rid, rubrics[rid]['anchors'], req['sector'], reviewed_values, reviewed_evidence)
            proposals[rid] = {**attempt, 'diagnosticReason': row['reason'],
                              'sensitivity': {'confidence': 'LOW' if attempt['score'] is None else attempt['confidence'],
                                              'researchOnly': True},
                              'evidence': amendment_evidence, 'metrics': row.get('metrics', {}),
                              'compositeDiagnostics': row.get('compositeDiagnostics', {}),
                              'verifiedBandSource': proof_pin,
                              'separateRiskWarnings': ['REFINANCING_AND_AVAILABLE_DEPOSIT_BOUNDS_UNCONFIRMED']
                              if rid == 'FH-STRESS' and not proof_pin else [],
                              'minimumSufficientEvidence': row['amendment']['mandatoryFieldsByDimension'],
                              'missingEconomicDimensions': row['amendment']['missingByDimension']}
        rows.append(row)
    result = {'contract': VERSION, 'subject': packet['subject'], 'inputHash': digest(packet),
            'rubrics': rubrics, 'proposed': rows, 'methodologyVersion': AMENDMENT, 'purpose': 'RESEARCH_ONLY',
            'scoringAuthority': 'NONE', 'historicalPitGranted': False}
    if packet.get('v2'):
        result['v2'] = reconcile_v2(packet, args, rubrics, proposals)
    return result


def main():
    parser = argparse.ArgumentParser(allow_abbrev=False)
    for name in ('ticker', 'cutoff', 'universe-version', 'packet'):
        parser.add_argument('--'+name, action=Once, required=True, type=Path if name=='packet' else str)
    try:
        print(json.dumps(run(parser.parse_args()), indent=2, ensure_ascii=False))
    except (ValueError, KeyError, OSError, TypeError, ArithmeticError, IndexError, subprocess.CalledProcessError) as error:
        print(json.dumps({'status': 'BLOCKED', 'reason': str(error)}))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
