#!/usr/bin/env python3
"""Single-ticker current-purpose scoring control plane."""
import argparse
from contextlib import closing
import json
from pathlib import Path
import sqlite3
import stat
import subprocess
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'skills/vn30-rollout-orchestrator/scripts'))
from control import (PERMISSIONS, Rollout, Universe, Worker, digest, pinned,  # noqa: E402
                     prepare, read, require_input_identity, ticker, day)

STORE = ROOT / 'outputs/vn30-rollout'
DB = ROOT / 'data/vn30.sqlite'
REGISTRY = Path(__file__).with_name('vn30-score-routes.json')
SECTORS = {
    'path': 'docs/fundamental-data-engine/vnm-step3-authority-closure/2026-11-17/RETAINED_HEAD_REFERENCE_DATA.json',
    'sha256': '52b9394b7b83d378fb88254c658443adb5f8af0ec8dfa51f6a443675e6b2987a',
}
LEVEL1 = {
    'path': 'docs/fundamental-data-engine/evidence/2026-10-19-consolidated-financial-final-revalidation/ALL30_LEVEL1_REVALIDATION.json',
    'sha256': 'b65533e3bfb86d483664546400fb5611890380bcb847f27a2a52992f25bedb79',
}


class Once(argparse.Action):
    def __call__(self, parser, namespace, value, option_string=None):
        if getattr(namespace, self.dest, None) is not None:
            parser.error(f'{option_string} must occur exactly once')
        setattr(namespace, self.dest, value)


def scope(args):
    universe = Universe(args.universe_version)
    member = universe.eligible(args.ticker, args.cutoff)
    symbol = member['ticker']
    head = json.loads(pinned(ROOT, SECTORS))
    sectors = [row['sector'] for row in head['content']['sectors']
               if row['ticker'] == symbol and row['securityId'] == member['securityId']]
    if head['status'] != 'ACCEPTED' or len(sectors) != 1:
        raise ValueError('QUALIFIED_SECTOR_MAPPING_MISSING')
    catalog = read(REGISTRY)
    if catalog['contract'] != 'vn30-current-scoring-routes-v1':
        raise ValueError('SCORING_ROUTE_REGISTRY_CONTRACT')
    subject = dict(ticker=symbol, securityId=member['securityId'], exchange=member['exchange'],
                   sector=sectors[0], universeVersion=args.universe_version,
                   universeHash=universe.pin['registryEntryHash'],
                   cutoff=args.cutoff, purpose='CURRENT_FORMAL_VALUATION')
    routes = [row for row in catalog['routes'] if row['subject'] == subject]
    if len(routes) > 1:
        raise ValueError('AMBIGUOUS_SCORING_ROUTE')
    route = routes[0] if routes else None
    request = dict(ticker=symbol, skill='equity-s1-s5-assessment', sector=sectors[0],
                   exchange=member['exchange'], purpose='CURRENT_FORMAL_VALUATION',
                   referenceDate=args.cutoff, parameters={'sectorReferenceHash': SECTORS['sha256'],
                                                         'routeHash': digest(route)})
    return universe, request, prepare(request, universe), route


def is_placeholder(path):
    return bool(getattr(path.stat(), 'st_flags', 0) & getattr(stat, 'SF_DATALESS', 0))


def database_inventory(job):
    req = job['request']
    scope = (req['ticker'], req['securityId'], req['referenceDate'])
    if not DB.is_file():
        return {'available': False, 'reason': 'SCORING_DATABASE_MISSING'}
    if is_placeholder(DB):
        return {'available': False, 'reason': 'SCORING_DATABASE_BYTES_NOT_LOCAL'}
    # Immutable mode avoids SQLite sidecar writes. Refuse a database with outstanding journals.
    if any(Path(str(DB) + suffix).exists() for suffix in ('-wal', '-shm', '-journal')):
        raise ValueError('DATABASE_SNAPSHOT_REQUIRES_QUIESCENT_SQLITE')
    with closing(sqlite3.connect(DB.as_uri() + '?mode=ro&immutable=1', uri=True)) as db:
        tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        rows = {}
        for table in ('current_financial_admission', 'current_financial_dataset'):
            rows[table] = ([dict(id=row[0], sha256=row[1]) for row in db.execute(
                f'SELECT id,body_hash FROM {table} '
                'WHERE ticker=? AND security_id=? AND economic_cutoff=? ORDER BY id', scope)]
                if table in tables else [])
        rows['current_score_artifact'] = []
        if 'current_score_artifact' in tables:
            rows['current_score_artifact'] = [
                dict(id=row[0], sha256=row[1]) for row in db.execute(
                    """SELECT id,body_hash FROM current_score_artifact
                       WHERE json_extract(body,'$.card.ticker')=?
                         AND json_extract(body,'$.card.input.securityId')=?
                         AND json_extract(body,'$.authorization.economicCutoff')=? ORDER BY id""", scope)]
    return {'available': True, **rows}


def invoke_adapter(job, action, *, lock_fd=None):
    command = ['node', str(Path(__file__).with_name('vn30_score_worker.mjs')), action]
    if lock_fd is not None:
        command.append(str(lock_fd))
    result = subprocess.run(command, input=json.dumps(job), text=True, capture_output=True,
                            cwd=ROOT, pass_fds=() if lock_fd is None else (lock_fd,))
    try:
        if result.returncode == 0:
            response = json.loads(result.stdout)
            if isinstance(response, dict) and isinstance(response.get('blockers'), list):
                return response
    except json.JSONDecodeError:
        pass
    return {'blockers': ['GOVERNED_WORKER_RUNTIME_FAILED']}


def check(job, route):
    req = job['request']
    symbol = req['ticker']
    inv = database_inventory(job)
    baseline = None
    level1_path = ROOT / LEVEL1['path']
    if level1_path.is_file() and not is_placeholder(level1_path):
        level1 = json.loads(pinned(ROOT, LEVEL1))
        baseline = next((row['candidateStatus'] for row in level1['tickers']
                         if row['ticker'] == symbol and row['sector'] == req['sector']), None)
    paths = [ROOT / 'data' / folder / (symbol + '.json')
             for folder in ('combine', 'manual-extracted-api')]
    retained = [{'path': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size}
                for path in paths if path.is_file()]
    blockers = []
    if not retained and not inv.get('current_financial_admission'):
        blockers.append('NO_RETAINED_FINANCIAL_INPUT_FOUND')
    if not inv['available']:
        blockers.append(inv['reason'])
    elif not inv['current_financial_dataset']:
        blockers.append('NO_ADMITTED_CURRENT_DATASET_AT_CUTOFF')
    if route is None or not route.get('adapter'):
        blockers.append('NO_REGISTERED_TICKER_MAPPING_ADAPTER')
    if route is None or not route.get('authorization'):
        blockers.append('NO_EXACT_TICKER_SCORING_AUTHORITY')
    if not blockers:
        blockers.extend(invoke_adapter(job, 'preflight')['blockers'])
    return {'blockers': blockers, 'inventory': inv, 'retainedInputs': retained,
            'level1Candidate': baseline, 'sectorReference': SECTORS, 'level1Reference': LEVEL1}


def prepare_route(args):
    symbol, cutoff = ticker(args.ticker), day(args.cutoff)
    blockers = []

    def inspect_pin(pin, role):
        try:
            path = ROOT / pin['path']
            if path.is_file() and is_placeholder(path):
                raise ValueError('SOURCE_BYTES_NOT_LOCAL')
            return pinned(ROOT, pin)
        except (ValueError, OSError, KeyError, TypeError) as error:
            blockers.append({'role': role, 'path': pin.get('path') if isinstance(pin, dict) else None,
                             'reason': str(error)})
            return None

    versions = read(ROOT / 'skills/vn30-rollout-orchestrator/references/universe-registry.json')['versions']
    version = next((row for row in versions if row['id'] == args.universe_version), None)
    if version is None:
        raise ValueError('UNKNOWN_OR_AMBIGUOUS_UNIVERSE_VERSION')
    if not version['coverageFrom'] <= cutoff <= version['coverageThrough']:
        raise ValueError('REFERENCE_DATE_COVERAGE_UNVERIFIED_NOT_MEMBERSHIP_EXIT')
    profile = inspect_pin(version['profile'], 'universeProfile')
    inspect_pin(version['sectorRegistry'], 'sectorRegistry')
    inspect_pin(SECTORS, 'securitySectorReference')
    if profile is not None:
        membership = json.loads(profile)['membership']
        inspect_pin(membership, 'membership')
        inspect_pin(membership['identitySource'], 'securityIdentity')

    candidate = read(args.candidate) if args.candidate else {}
    if not isinstance(candidate, dict):
        raise ValueError('CANDIDATE_ROUTE_OBJECT_REQUIRED')
    for role in ('adapter', 'assessment', 'reference', 'executable'):
        value = candidate.get(role)
        if value is None:
            blockers.append({'role': role, 'reason': 'CANDIDATE_PIN_REQUIRED'})
        else:
            inspect_pin(value, role)
    if not isinstance(candidate.get('reviewBindings'), list) or not candidate['reviewBindings']:
        blockers.append({'role': 'reviewBindings', 'reason': 'CANDIDATE_REVIEW_BINDINGS_REQUIRED'})

    inventory = None
    if not any(row['role'] in ('universeProfile', 'sectorRegistry', 'securitySectorReference',
                               'membership', 'securityIdentity') for row in blockers):
        try:
            _, _, job, _ = scope(args)
            inventory = database_inventory(job)
            if not inventory['available'] or not inventory.get('current_financial_dataset'):
                blockers.append({'role': 'dataset', 'reason': inventory.get('reason',
                                 'NO_ADMITTED_CURRENT_DATASET_AT_CUTOFF')})
        except (ValueError, OSError, KeyError, sqlite3.Error) as error:
            blockers.append({'role': 'scope', 'reason': str(error)})

    report = dict(ticker=symbol, cutoff=cutoff, universeVersion=args.universe_version,
                  inventory=inventory, scoringAuthorized=False)
    if blockers:
        return {**report, 'status': 'BLOCKED', 'blockers': blockers}
    result = invoke_adapter({'job': job, 'candidate': candidate}, 'prepare')
    if args.previous_proposal and not result['blockers']:
        previous = read(args.previous_proposal)
        old_route = previous['proposedRoute']
        new_route = result['proposedRoute']
        result['changedRouteFields'] = [
            key for key in sorted(old_route.keys() | new_route.keys())
            if old_route.get(key) != new_route.get(key)
        ]
        result['priorApprovalHash'] = previous['approvalHash']
        result['approvalHashChanged'] = previous['approvalHash'] != result['approvalHash']
    return {**report, **result, 'status': 'BLOCKED' if result['blockers'] else 'READY_FOR_CIO'}



def execute(args, store=STORE):
    if args.mode == 'prepare':
        return prepare_route(args)
    universe, request, job, route = scope(args)
    rollout = Rollout(store, universe)
    # Same immutable one-job plan identity as Rollout.plan, with no persistence for reads.
    plan = {'contract': 'sequential-vn30-rollout-v1', 'universe': universe.pin,
            'concurrency': 1, 'jobs': [job]}
    queue_id = 'queue-' + digest(plan)[:24]
    symbol = request['ticker']
    base = dict(ticker=symbol, executionId=job['executionId'], queueId=queue_id,
                request=job['request'], permissions=PERMISSIONS.copy())
    if args.mode == 'check':
        report = check(job, route)
        return {**base, **report, 'status': 'BLOCKED' if report['blockers'] else 'READY'}

    planned = (rollout.store / queue_id / 'PLAN.json').is_file()
    if planned:
        state = rollout.status(queue_id)['jobs'][0]
        if state.get('resultFile'):
            state['result'] = read(rollout.home(job) / state['resultFile'])
    else:
        state = {'status': 'NOT_STARTED'}

    if args.mode == 'status' or state['status'] in ('COMPLETED', 'INTEGRITY_BLOCKED'):
        return {**base, **state}
    if args.mode == 'resume' and not planned:
        return {**base, **state, 'blockers': ['NO_EXECUTION_TO_RESUME']}
    if args.mode == 'score' and state['status'] in ('BLOCKED', 'FAILED', 'RUNNING'):
        return {**base, **state, 'blockers': ['USE_EXPLICIT_RESUME']}

    def work(context, checkpoint):
        require_input_identity(context, {'ticker': symbol, 'cutoff': args.cutoff})
        report = check(context, route)
        checkpoint('PREREQUISITES', report)
        evidence = [{'subjectTicker': symbol, 'kind': 'PREREQUISITES', 'sha256': digest(report)}]
        result = {'ticker': symbol, 'executionId': context['executionId'], 'evidence': evidence}
        if report['blockers']:
            return {**result, 'status': 'BLOCKED', 'blockers': report['blockers']}
        scored = invoke_adapter(context, 'score', lock_fd=rollout.lock_fd)
        if scored['blockers']:
            return {**result, 'status': 'BLOCKED', 'blockers': scored['blockers']}
        evidence.append({'subjectTicker': symbol, 'kind': 'GOVERNED_SCORE', **scored['artifact']})
        return {**result, 'status': 'COMPLETED', 'blockers': []}

    if not planned:
        if rollout.plan([request]) != queue_id:
            raise ValueError('SCORING_QUEUE_IDENTITY_CHANGED')
    retry_mode = 'IDEMPOTENT' if args.mode == 'resume' else 'RECONCILE_REQUIRED'
    worker = Worker(request['skill'], work, retry_mode)
    result = rollout.run_next(queue_id, worker, retry_ticker=symbol if args.mode == 'resume' else None)
    if result is None:
        return {**base, **rollout.status(queue_id)['jobs'][0]}
    return {**base, **result}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument('--ticker', action=Once, required=True)
    parser.add_argument('--mode', action=Once, required=True, choices=('check', 'score', 'status', 'resume', 'prepare'))
    parser.add_argument('--universe-version', action=Once, required=True)
    parser.add_argument('--cutoff', '--reference-date', action=Once, required=True)
    parser.add_argument('--candidate', action=Once, type=Path)
    parser.add_argument('--previous-proposal', action=Once, type=Path)
    args = parser.parse_args(argv)
    if (args.candidate or args.previous_proposal) and args.mode != 'prepare':
        parser.error('--candidate and --previous-proposal require --mode prepare')
    try:
        result = execute(args)
    except (ValueError, OSError, KeyError, sqlite3.Error) as error:
        print(json.dumps({'status': 'ERROR', 'reason': str(error)}))
        return 2
    print(json.dumps(result, indent=2))
    if result['status'] in ('READY', 'READY_FOR_CIO', 'COMPLETED') or (
            args.mode == 'status' and result['status'] != 'INTEGRITY_BLOCKED'):
        return 0
    return 1


if __name__ == '__main__':
    sys.exit(main())
