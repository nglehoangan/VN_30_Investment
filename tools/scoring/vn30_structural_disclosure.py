"""Execute the proposed structural contract in research and EBCS replay lanes."""
import argparse
import json
from pathlib import Path
import subprocess
import sys

if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from tools.scoring.public_disclosure import rubric_contract
from tools.scoring.hybrid_policy import coverage
from tools.scoring.public_disclosure_v3 import MANDATORY, VERSION, evaluate_structural
from tools.scoring.structural_nr import artifact, digest, require, source
from tools.scoring.vn30_public_disclosure import reconcile_v2, verified_fields
from tools.scoring.vn30_score import Once, database_inventory, scope
from tools.scoring import m3_public_successor as successor

RUBRICS = ('FH-STRESS', 'GQ-INC', 'VAL-PRIMARY', 'CA-REINV', 'CA-DIL')


def run(args):
    job = scope(args)[2]
    request = job['request']
    config = json.loads(args.packet.read_bytes())
    version = config['contract']
    require(version in (VERSION, successor.VERSION), 'STRUCTURAL_CONTRACT_REQUIRED')
    policy = None
    if version == successor.VERSION:
        require(config['rubricContract']['path'] == successor.PATH, 'EXACT_SUCCESSOR_REGISTRY_REQUIRED')
        policy = artifact(config['rubricContract'])
        require(policy['version'] == version and policy['authority'] == 'RESEARCH_ONLY'
                and policy['rubrics'].keys() == set(RUBRICS), 'INVALID_SUCCESSOR_REGISTRY')
    packet = artifact(config['priorInput'])
    subject = {k: request[k] for k in ('ticker', 'securityId', 'sector', 'referenceDate')}
    require(packet['subject'] == config['subject'] == subject, 'STRUCTURAL_SUBJECT_MISMATCH')
    for pin in packet['reviewReferences'] + config['reviewReferences']:
        source(pin)
    fields = {**packet['fields'], **config['additionalFields']}
    mandatory = {rid: rule['requiredPublicFields'] for rid, rule in policy['rubrics'].items()} if policy else MANDATORY
    required_keys = set().union(*mandatory.values())
    raw, lineage = verified_fields({'fields': {k: v for k, v in fields.items() if k in required_keys}}, args.cutoff)
    values = {}
    for key, items in lineage.items():
        require(len(items) == len(raw[key]) and all(item['scope'] == ('SECURITY' if key in {'cutoff_price', 'cutoff_shares'} else 'CONSOLIDATED') for item in items),
                'STRUCTURAL_OPERAND_SCOPE_MISMATCH')
        values[key] = ({str(item['year']): value for item, value in zip(items, raw[key], strict=True)}
                       if key in {'cfo', 'capex'} else raw[key][0])
    annual = lineage.get('cfo', [])
    annual_end = max((item['periodEnd'] for item in annual), default=None)
    stress_single = set(MANDATORY['FH-STRESS']) - {'latest_cfo', 'latest_capex', 'cfo', 'capex'}
    for key in stress_single | {'goodwill_increase', 'allocation_disclosure'}:
        if key in lineage:
            require(len(lineage[key]) == 1 and lineage[key][0]['periodEnd'] == annual_end,
                    'STRUCTURAL_BASELINE_PERIOD_MISMATCH')
    for key in ('cfo', 'capex'):
        require(all(item['periodEnd'] == str(item['year']) + '-12-31' for item in lineage.get(key, []))
                and len(values.get(key, {})) == len(lineage.get(key, [])), 'STRUCTURAL_ANNUAL_PERIOD_MISMATCH')
    for cfo, capex in zip(lineage.get('cfo', []), lineage.get('capex', []), strict=True):
        require(cfo['year'] == capex['year'] and cfo['documentHash'] == capex['documentHash'],
                'STRUCTURAL_CASH_SCOPE_MISMATCH')
    for key in ('latest_cfo', 'latest_capex'):
        require(all(item.get('knownAt') and item['knownAt'][:10] <= args.cutoff and item.get('publishedDate')
                    for item in lineage.get(key, [])), 'STRUCTURAL_INTERIM_PIT_REQUIRED')
    if 'latest_cfo' in lineage and 'latest_capex' in lineage:
        a, b = lineage['latest_cfo'][0], lineage['latest_capex'][0]
        require(all(a[k] == b[k] for k in ('documentHash', 'periodEnd', 'scope', 'unit')),
                'STRUCTURAL_INTERIM_SCOPE_MISMATCH')
    if policy:
        for key in required_keys - set().union(*MANDATORY.values()) - {'issued', 'outstanding_before', 'issue_price', 'proceeds'}:
            for item in lineage.get(key, []):
                require(item.get('publishedDate') and item.get('knownAt') and item['knownAt'][:10] <= args.cutoff,
                        'SUCCESSOR_PUBLIC_FIELD_CLOCK_REQUIRED:' + key)
                if key in {'cutoff_price', 'cutoff_shares'}:
                    require(item['periodEnd'] == args.cutoff, 'SUCCESSOR_MARKET_CUTOFF_MISMATCH:' + key)
    if policy and config.get('acceptedMarketReadback'):
        market = artifact(config['acceptedMarketReadback'])
        context = market['context']
        require(market['datasetReadback'] == 'PASS' and context['economicCutoff'] == args.cutoff
                and context['purpose'] == 'CURRENT_FORMAL_VALUATION'
                and all(context[k] == request[k] for k in ('ticker', 'securityId'))
                and any(row['id'] == market['datasetId'] for row in database_inventory(job)['current_financial_dataset']),
                'SUCCESSOR_ACCEPTED_MARKET_READBACK_MISMATCH')
        for key, field, date_key in (('cutoff_price', 'price', 'date'), ('cutoff_shares', 'shares', 'asOf')):
            claim = market[field]
            require(claim[date_key] == args.cutoff and all(claim[k] == request[k] for k in ('ticker', 'securityId')),
                    'SUCCESSOR_MARKET_CUTOFF_MISMATCH:' + key)
            values[key] = claim['value']
            lineage[key] = [config['acceptedMarketReadback']]
    anchors = rubric_contract(packet['rubrics'])
    proposed = {}
    for rubric in RUBRICS:
        if policy:
            rule = policy['rubrics'][rubric]
            require(rule['maxPoints'] == anchors[rubric]['maxPoints'], 'SUCCESSOR_WEIGHT_MISMATCH')
            result = successor.evaluate(rubric, rule, anchors[rubric]['anchors'], request['sector'], values, lineage)
        else:
            result = evaluate_structural(rubric, anchors[rubric]['anchors'], request['sector'], values, lineage)
        proposed[rubric] = {**result, 'evidence': {k: lineage[k] for k in mandatory.get(rubric, ()) if k in lineage}}
        if rubric in config['unresolved']:
            proposed[rubric]['counterEvidence'] = config['unresolved'][rubric]
    if args.lane == 'research':
        return {'contract': version, 'inputHash': digest(config), 'proposed': proposed, 'productionAuthority': 'NONE'}
    scored = reconcile_v2(packet, args, anchors, proposed, version=version)
    if policy:
        candidate_rows = []
        for row in scored['rows']:
            rid = row['rubricId']
            attempted = proposed.get(rid)
            points = attempted['score'] if attempted else row['ebcsAcceptedScore']
            row['successorPreviewPoints'] = points
            candidate_rows.append({'rubricId': rid, 'points': points,
                                   'state': 'N/R' if points is None else ('CONSERVATIVE' if attempted else row['ebcsState'])})
        scored['successorPreviewCoverage'] = coverage(candidate_rows, anchors)
    return {**scored, 'contract': version, 'inputHash': digest(config), 'proposed': proposed}


def main():
    parser = argparse.ArgumentParser(allow_abbrev=False)
    for key in ('ticker', 'cutoff', 'universe-version', 'packet', 'lane'):
        parser.add_argument('--' + key, action=Once, required=True, type=Path if key == 'packet' else str,
                            **({'choices': ('research', 'ebcs-replay')} if key == 'lane' else {}))
    try:
        print(json.dumps(run(parser.parse_args()), ensure_ascii=False, indent=2))
    except (ValueError, OSError, KeyError, TypeError, ArithmeticError, subprocess.CalledProcessError) as error:
        print(json.dumps({'status': 'BLOCKED', 'reason': str(error)}))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
