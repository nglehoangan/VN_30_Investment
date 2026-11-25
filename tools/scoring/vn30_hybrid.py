"""Run a pinned hybrid successor candidate without dispatching any official write."""
import argparse
import json
from pathlib import Path
import subprocess
import sys

if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from tools.scoring.hybrid_policy import VERSION, conservative_gap, coverage, eligibility
from tools.scoring.public_disclosure import rubric_contract
from tools.scoring.structural_nr import artifact, day, digest, require, source, timestamp
from tools.scoring.vn30_public_disclosure import reconcile_v2
from tools.scoring.vn30_score import Once, scope


def run(args):
    req = scope(args)[2]['request']
    config = json.loads(args.packet.read_bytes())
    require(config['contract'] == VERSION and config['subject'] ==
            {k: req[k] for k in ('ticker', 'securityId', 'sector', 'referenceDate')},
            'HYBRID_SUBJECT_MISMATCH')
    prior = artifact(config['sourceInput'])
    require(prior['subject'] == config['subject'], 'HYBRID_INPUT_SCOPE_MISMATCH')
    registry = rubric_contract(prior['rubrics'])
    replay = reconcile_v2(prior, args, registry, {}, version=VERSION)
    envelope = artifact(prior['v2']['unified'])
    original = {r['rubricId']: r for r in envelope['rows']}
    accepted_input = artifact(envelope['sourceCandidate'])['input']
    assessments = {a['subcategory']: a for a in accepted_input['assessments']}
    rows = []
    for old in replay['rows']:
        rid = old['rubricId']
        score = old['ebcsAcceptedScore']
        state = original[rid]['validationOutcome']
        reason = old['proposedCorrection'] or old['failedCondition']
        control = None
        if score is not None:
            require(state in ('VERIFIED', 'CONSERVATIVE'), 'HYBRID_APPROVED_REPLAY_STATE_MISMATCH')
            require(any(b['label'] == assessments[rid]['assessment'] and b['min'] <= score <= b['max']
                        for b in registry[rid]['anchors']), 'HYBRID_APPROVED_ANCHOR_MISMATCH')
            if state == 'CONSERVATIVE':
                control = config['conservativeControls'].get(rid)
                if control:
                    for pin in control.get('factPins', []) + control.get('counterEvidence', []):
                        source(pin)
                        require(day(pin['publicationDate']) <= args.cutoff, 'HYBRID_PUBLICATION_AFTER_CUTOFF')
                    for pin in control.get('factPins', []):
                        cell = artifact({**pin, 'pointer': pin['locator']})
                        require(cell['ticker'] == args.ticker and cell['scope'] == pin['scope']
                                and cell['period']['end'] == pin['periodEnd']
                                and day(pin['periodEnd']) <= args.cutoff
                                and timestamp(pin['knownAt']) <= timestamp(accepted_input['knownAt']),
                                'HYBRID_FACT_SCOPE_OR_CLOCK_MISMATCH')
                gap = conservative_gap({'points': score}, registry[rid]['anchors'], control)
                if gap:
                    state, score, reason = 'N/R', None, gap
                else:
                    require(set(control['caseBands']) == {assessments[rid]['assessment']},
                            'HYBRID_UNRECONCILED_CASE_BAND')
        else:
            state, reason = 'N/R', reason or 'NO_ACCEPTED_ASSESSMENT_FOR_EXACT_CUTOFF'
        rows.append({'rubricId':rid, 'state':state, 'points':score, 'reason':reason,
                     'sourceLineage': old['sourceLineage'], 'controlledAssumptions': control,
                     'legacyResearchPoints': old['researchScore'], 'officialPredecessorPoints': old['officialScore']})
    totals = coverage(rows, registry)
    confidence = accepted_input['confidence']['level']
    rated = {r['rubricId'] for r in rows if r['points'] is not None}
    gates = eligibility(totals, confidence=confidence, financial_risk_valid=False,
                        valuation_valid={'VAL-PRIMARY','VAL-RET','VAL-MOS'} <= rated)
    payload = {'contract':VERSION,'subject':config['subject'],'inputHash':digest(config),
               'rows':rows, 'coverage':{**totals,'confidence':confidence}, 'gates':gates,
               'authority':'AWAITING_EXPLICIT_OWNER_APPROVAL','historicalPitGranted':False,
               'officialPredecessorHash':envelope['baselineHash'],
               'fiveMethodDirections':config['fiveMethodDirections'],
               'productionScoring':False, 'publicationAuthorized':False}
    return {**payload, 'candidateHash':digest(payload)}


def main():
    parser = argparse.ArgumentParser(allow_abbrev=False)
    for key in ('ticker','cutoff','universe-version','packet'):
        parser.add_argument('--'+key, action=Once, required=True, type=Path if key=='packet' else str)
    try:
        print(json.dumps(run(parser.parse_args()),ensure_ascii=False,indent=2))
    except (ValueError, OSError, KeyError, TypeError, subprocess.CalledProcessError) as error:
        print(json.dumps({'status':'BLOCKED','reason':str(error)}))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
