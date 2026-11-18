"""Single-ticker contract and sequential, filesystem-only rollout foundation.

No live worker is registered here. Trusted hosts must supply an explicitly scoped
worker; the CLI exposes only planning, validation and read-only inventory/status.
"""
from contextlib import contextmanager
from copy import deepcopy
from dataclasses import dataclass
from datetime import date
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile

ROOT = Path(__file__).resolve().parents[3]
REGISTRY = 'skills/vn30-rollout-orchestrator/references/universe-registry.json'
SKILLS = ('equity-s1-s5-assessment', 'vn30-market-price-corporate-actions',
          'fetch-cafef-price-history', 'fetch-vietstock-dividend-pdfs', 'read-pdf-json-first')
PURPOSES = ('RETROSPECTIVE_RESEARCH', 'CURRENT_FORMAL_VALUATION', 'HISTORICAL_PIT')
PERMISSIONS = dict(assessmentApproved=False, formalAdmissionGranted=False,
                   scoringAuthorized=False, deploymentAuthorized=False,
                   publicationAuthorized=False, tradingAuthorized=False, historicalPitQualified=False)


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':'), allow_nan=False)


def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def ticker(value):
    if not isinstance(value, str):
        raise ValueError('EXACTLY_ONE_TICKER_REQUIRED')
    value = value.strip().upper()
    if value in ('ALL', 'VN30') or not re.fullmatch(r'[A-Z0-9]{3}', value):
        raise ValueError('BATCH_OR_INVALID_TICKER_REJECTED')
    return value


def day(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        raise ValueError('ISO_REFERENCE_DATE_REQUIRED')
    date.fromisoformat(value)
    return value


def read(path):
    return json.loads(Path(path).read_text())


def pinned(root, pin):
    base = Path(root).resolve()
    path = (base / pin['path']).resolve()
    if not path.is_relative_to(base) or not path.is_file():
        raise ValueError('SOURCE_PATH_ESCAPE_OR_MISSING')
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != pin['sha256']:
        raise ValueError('UNIVERSE_SOURCE_HASH_MISMATCH')
    return raw


class Universe:
    def __init__(self, version, root=ROOT):
        registry = read(Path(root) / REGISTRY)
        if registry['contract'] != 'vn30-skill-universe-registry-v1':
            raise ValueError('UNIVERSE_REGISTRY_CONTRACT')
        matches = [v for v in registry['versions'] if v['id'] == version]
        if len(matches) != 1:
            raise ValueError('UNKNOWN_OR_AMBIGUOUS_UNIVERSE_VERSION')
        self.version = deepcopy(matches[0])
        profile = json.loads(pinned(root, self.version['profile']))
        membership = profile['membership']
        official = json.loads(pinned(root, {'path': membership['path'], 'sha256': membership['sha256']}))
        identities = json.loads(pinned(root, membership['identitySource']))
        if official['status'] != 'CERTIFIED' or official['historyComplete'] is not True:
            raise ValueError('UNQUALIFIED_MEMBERSHIP_REFERENCE')
        if (membership['from'], membership['through']) != (self.version['coverageFrom'], self.version['coverageThrough']):
            raise ValueError('UNIVERSE_COVERAGE_BINDING')
        self.members = {m['ticker']: deepcopy(m) for m in membership['members']}
        if len(self.members) != 30 or len(membership['members']) != 30 or set(self.members) != set(official['composition']):
            raise ValueError('UNIVERSE_COMPOSITION_MISMATCH')
        self.intervals = {m['ticker']: m for m in identities['effectiveMembers']}
        if set(self.intervals) != set(self.members):
            raise ValueError('UNIVERSE_IDENTITY_MISMATCH')
        for symbol, member in self.members.items():
            interval = self.intervals[symbol]
            if member['securityId'] != interval['securityId'] or member['exchange'] != interval['exchange']:
                raise ValueError('UNIVERSE_SECURITY_IDENTITY_MISMATCH')
        sector_text = pinned(root, self.version['sectorRegistry']).decode()
        match = re.search(r'export const SECTORS\s*=\s*(\[[^\]]+\])\s*as const', sector_text)
        if not match:
            raise ValueError('SECTOR_REGISTRY_SCHEMA_CHANGED')
        self.sectors = json.loads(match[1])
        self.pin = {'version': version, 'registryEntryHash': digest(self.version), 'profile': self.version['profile']}

    def eligible(self, value, reference_date, exchange=None):
        symbol, at = ticker(value), day(reference_date)
        if not self.version['coverageFrom'] <= at <= self.version['coverageThrough']:
            # Coverage is not the constituent's expiry/exit date.
            raise ValueError('REFERENCE_DATE_COVERAGE_UNVERIFIED_NOT_MEMBERSHIP_EXIT')
        if symbol not in self.members:
            raise ValueError('TICKER_NOT_IN_VERSIONED_VN30')
        member, interval = self.members[symbol], self.intervals[symbol]
        if not interval['effectiveFrom'] <= at or (interval.get('effectiveTo') and at >= interval['effectiveTo']):
            raise ValueError('TICKER_OUTSIDE_EFFECTIVE_INTERVAL')
        if exchange is not None and exchange != member['exchange']:
            raise ValueError('EXCHANGE_IDENTITY_MISMATCH')
        return deepcopy(member)

    def inventory(self, reference_date):
        """All-universe read-only eligibility report; no worker/capture/admission."""
        at = day(reference_date)
        rows = []
        for symbol in sorted(self.members):
            try:
                rows.append({**self.eligible(symbol, at), 'status': 'REFERENCE_DATE_ELIGIBLE'})
            except ValueError as error:
                rows.append({'ticker': symbol, 'status': 'UNVERIFIED', 'reason': str(error)})
        return {'universe': self.pin, 'referenceDate': at, 'rows': rows,
                'readOnly': True, 'executionReadiness': 'NOT_INFERRED_FROM_MEMBERSHIP', 'permissions': PERMISSIONS.copy()}


def prepare(raw, universe):
    allowed = {'ticker', 'skill', 'referenceDate', 'exchange', 'purpose', 'sector', 'parameters', 'bindings'}
    if not isinstance(raw, dict) or set(raw) - allowed:
        raise ValueError('SINGLE_TICKER_REQUEST_FIELDS_REQUIRED')
    symbol = ticker(raw.get('ticker'))
    member = universe.eligible(symbol, raw.get('referenceDate'), raw.get('exchange'))
    if raw.get('skill') not in SKILLS or raw.get('purpose') not in PURPOSES:
        raise ValueError('UNSUPPORTED_SKILL_OR_PURPOSE')
    sector = raw.get('sector')
    if (raw['skill'] == 'equity-s1-s5-assessment' and sector not in universe.sectors) or (sector is not None and sector not in universe.sectors):
        raise ValueError('APPROVED_SECTOR_REQUIRED_NO_VNM_DEFAULT')
    bindings = raw.get('bindings', [])
    if not isinstance(bindings, list):
        raise ValueError('SCOPED_BINDINGS_REQUIRED')
    for binding in bindings:
        if not isinstance(binding, dict) or set(binding) != {'kind', 'subjectTicker', 'reference', 'sha256'} or binding['subjectTicker'] != symbol or binding['kind'] not in ('SOURCE', 'ASSESSMENT', 'DEPLOYMENT', 'PUBLICATION') or not isinstance(binding['sha256'], str) or not re.fullmatch(r'[a-f0-9]{64}', binding['sha256']) or not isinstance(binding['reference'], str) or not binding['reference'].strip():
            raise ValueError('CROSS_TICKER_OR_INVALID_BINDING')
    request = {**deepcopy(raw), 'ticker': symbol, 'exchange': member['exchange'], 'securityId': member['securityId'], 'universe': deepcopy(universe.pin), 'bindings': deepcopy(bindings)}
    # Reject hidden plural scope at the operation parameter boundary, not peer evidence.
    params = raw.get('parameters', {})
    if not isinstance(params, dict) or any(k.lower() in ('ticker', 'tickers', 'symbol', 'symbols', 'all', 'wildcard', 'concurrency') for k in params):
        raise ValueError('BATCH_PARAMETER_OVERRIDE_REJECTED')
    key = digest(request)
    return {'contract': 'single-ticker-execution-v1', 'executionId': 'exec-' + key[:24],
            'operationKey': key, 'request': request, 'permissions': PERMISSIONS.copy()}


def require_input_identity(context, packet):
    """Adapter preflight for ticker JSON inputs; original economic validators still apply."""
    if not isinstance(packet, dict) or ticker(packet.get('ticker')) != context['request']['ticker']:
        raise ValueError('CROSS_TICKER_INPUT')
    if packet.get('cutoff', context['request']['referenceDate']) != context['request']['referenceDate']:
        raise ValueError('INPUT_REFERENCE_DATE_MISMATCH')
    return packet


def atomic(path, value, immutable=False):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    text = canonical(value) + '\n'
    if path.exists() and immutable:
        if path.read_text() != text:
            raise ValueError('IMMUTABLE_EXECUTION_OUTPUT_CONFLICT')
        return
    fd, temp = tempfile.mkstemp(dir=path.parent, prefix='.checkpoint-')
    try:
        with os.fdopen(fd, 'w') as handle:
            handle.write(text); handle.flush(); os.fsync(handle.fileno())
        os.replace(temp, path)
    finally:
        if os.path.exists(temp): os.unlink(temp)


@dataclass(frozen=True)
class Worker:
    skill: str
    call: object
    retry_mode: str = 'RECONCILE_REQUIRED'


class Rollout:
    def __init__(self, store, universe, concurrency=1):
        if type(concurrency) is not int or concurrency != 1:
            raise ValueError('SEQUENTIAL_CONCURRENCY_ONE_REQUIRED')
        self.store, self.universe = Path(store).resolve(), universe
        if self.store.is_relative_to(ROOT / 'data') or self.store.is_relative_to(ROOT / '.git'):
            raise ValueError('PROTECTED_OUTPUT_ROOT')

    @contextmanager
    def lock(self):
        self.store.mkdir(parents=True, exist_ok=True)
        with (self.store / '.rollout.lock').open('a') as handle:
            try: fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError: raise ValueError('ROLLOUT_BUSY_NO_PARALLEL_WORKER')
            try: yield
            finally: fcntl.flock(handle, fcntl.LOCK_UN)

    def plan(self, requests):
        if not isinstance(requests, list) or not requests:
            raise ValueError('EXPLICIT_NONEMPTY_JOB_QUEUE_REQUIRED')
        jobs = [prepare(raw, self.universe) for raw in requests]
        if len({j['request']['skill'] for j in jobs}) != 1:
            raise ValueError('ONE_SKILL_STAGE_PER_QUEUE_REQUIRED')
        if len({j['request']['ticker'] for j in jobs}) != len(jobs):
            raise ValueError('DUPLICATE_TICKER_JOB_USE_IDEMPOTENT_RETRY')
        plan = {'contract': 'sequential-vn30-rollout-v1', 'universe': self.universe.pin, 'concurrency': 1, 'jobs': jobs}
        queue_id = 'queue-' + digest(plan)[:24]
        with self.lock():
            atomic(self.store / queue_id / 'PLAN.json', plan, True)
            for job in jobs:
                home = self.home(job)
                atomic(home / 'REQUEST.json', job, True)
                if not (home / 'STATE.json').exists():
                    atomic(home / 'STATE.json', {'status': 'PENDING', 'attempt': 0})
        return queue_id

    def home(self, job):
        # All path components are canonical ticker/skill/hash, never a worker path.
        path = self.store / 'executions' / job['request']['ticker'] / job['executionId']
        if path.resolve() != path:
            raise ValueError('EXECUTION_PATH_ALIAS_REJECTED')
        return path

    def jobs(self, queue_id):
        if not re.fullmatch(r'queue-[a-f0-9]{24}', queue_id):
            raise ValueError('INVALID_QUEUE_ID')
        plan = read(self.store / queue_id / 'PLAN.json')
        if 'queue-' + digest(plan)[:24] != queue_id or plan['universe'] != self.universe.pin or plan['concurrency'] != 1:
            raise ValueError('QUEUE_IDENTITY_CHANGED')
        for job in plan['jobs']:
            raw = {k: v for k, v in job['request'].items() if k not in ('securityId', 'universe')}
            if prepare(raw, self.universe) != job:
                raise ValueError('EXECUTION_IDENTITY_CHANGED')
        return plan['jobs']

    def state(self, job):
        if read(self.home(job) / 'REQUEST.json') != job:
            raise ValueError('EXECUTION_REQUEST_CHANGED')
        state = read(self.home(job) / 'STATE.json')
        if not isinstance(state, dict):
            raise ValueError('EXECUTION_STATE_SCHEMA')
        if state['status'] not in ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'BLOCKED') or type(state['attempt']) is not int or state['attempt'] < 0:
            raise ValueError('EXECUTION_STATE_SCHEMA')
        if 'resultFile' in state:
            if not isinstance(state['resultFile'], str) or not re.fullmatch(r'attempt-\d{4,}/RESULT.json', state['resultFile']):
                raise ValueError('EXECUTION_RESULT_PATH')
            receipt = read(self.home(job) / state['resultFile'])
            if not isinstance(receipt, dict):
                raise ValueError('EXECUTION_RESULT_SCHEMA')
            if digest(receipt) != state['resultHash'] or receipt['executionId'] != job['executionId'] or receipt['ticker'] != job['request']['ticker']:
                raise ValueError('EXECUTION_RESULT_INTEGRITY')
            if set(receipt) - {'ticker', 'executionId', 'status', 'evidence', 'blockers', 'operationKey', 'permissions'} or receipt.get('permissions') != PERMISSIONS or receipt.get('operationKey') != job['operationKey'] or receipt['status'] != state['status']:
                raise ValueError('CACHED_RESULT_SCOPE_OR_PERMISSION')
            evidence = receipt.get('evidence', [])
            if not isinstance(evidence, list) or any(not isinstance(e, dict) or e.get('subjectTicker') != job['request']['ticker'] for e in evidence):
                raise ValueError('CACHED_RESULT_TICKER')
        elif state['status'] in ('COMPLETED', 'FAILED'):
            raise ValueError('EXECUTION_RESULT_MISSING')
        if 'checkpointFile' in state:
            if not isinstance(state['checkpointFile'], str) or not re.fullmatch(r'attempt-\d{4,}/checkpoint-\d{4,}.json', state['checkpointFile']):
                raise ValueError('CHECKPOINT_PATH')
            checkpoint = read(self.home(job) / state['checkpointFile'])
            if not isinstance(checkpoint, dict) or digest(checkpoint) != state['checkpointHash'] or checkpoint['ticker'] != job['request']['ticker'] or checkpoint['executionId'] != job['executionId']:
                raise ValueError('CHECKPOINT_INTEGRITY')
        return state

    def status(self, queue_id):
        statuses = []
        for job in self.jobs(queue_id):
            try: state = self.state(job)
            except (ValueError, OSError, KeyError): state = {'status': 'INTEGRITY_BLOCKED', 'blockers': ['EXECUTION_RESULT_OR_CHECKPOINT_INTEGRITY']}
            statuses.append({'ticker': job['request']['ticker'], 'executionId': job['executionId'], **state})
        return {'queueId': queue_id, 'concurrency': 1, 'jobs': statuses, 'permissions': PERMISSIONS.copy()}

    def run_next(self, queue_id, worker, retry_ticker=None):
        """One host-supplied worker only. No CLI live executor or implicit approval."""
        if worker.skill not in SKILLS or worker.retry_mode not in ('IDEMPOTENT', 'RECONCILE_REQUIRED'):
            raise ValueError('TRUSTED_WORKER_CONTRACT_REQUIRED')
        if retry_ticker is not None: retry_ticker = ticker(retry_ticker)
        with self.lock():
            jobs = self.jobs(queue_id)
            if retry_ticker is not None and retry_ticker not in [j['request']['ticker'] for j in jobs]:
                raise ValueError('RETRY_TICKER_NOT_IN_QUEUE')
            for job in jobs:
                if retry_ticker is not None and job['request']['ticker'] != retry_ticker: continue
                if job['request']['skill'] != worker.skill:
                    raise ValueError('WORKER_SKILL_MISMATCH')
                try: state = self.state(job)
                except (ValueError, OSError, KeyError): continue  # quarantined locally; other completed work survives
                if state['status'] == 'COMPLETED':
                    if retry_ticker: return read(self.home(job) / state['resultFile'])
                    continue
                if state['status'] in ('FAILED', 'BLOCKED') and retry_ticker is None: continue
                if state['status'] in ('RUNNING', 'FAILED', 'BLOCKED') and worker.retry_mode != 'IDEMPOTENT':
                    return {'ticker': job['request']['ticker'], 'executionId': job['executionId'], 'status': 'BLOCKED', 'blockers': ['RECONCILE_EXTERNAL_EFFECTS_BEFORE_RETRY'], 'permissions': PERMISSIONS.copy()}
                home, attempt = self.home(job), state['attempt'] + 1
                atomic(home / 'STATE.json', {'status': 'RUNNING', 'attempt': attempt})
                atomic(home / f'attempt-{attempt:04d}/START.json', {'executionId': job['executionId'], 'ticker': job['request']['ticker'], 'operationKey': job['operationKey']}, True)
                sequence = 0
                def checkpoint(step, payload):
                    nonlocal sequence
                    if not isinstance(step, str) or not step: raise ValueError('CHECKPOINT_STEP_REQUIRED')
                    sequence += 1
                    record = {'ticker': job['request']['ticker'], 'executionId': job['executionId'], 'step': step, 'payload': deepcopy(payload)}
                    relative = f'attempt-{attempt:04d}/checkpoint-{sequence:04d}.json'
                    atomic(home / relative, record, True)
                    atomic(home / 'STATE.json', {'status': 'RUNNING', 'attempt': attempt, 'checkpointFile': relative, 'checkpointHash': digest(record)})
                try:
                    # A detached copy cannot mutate another job or the immutable request.
                    context = {**deepcopy(job), 'resume': read(home / state['checkpointFile']) if state.get('checkpointFile') else None}
                    response = worker.call(context, checkpoint)
                    if not isinstance(response, dict) or set(response) - {'ticker', 'executionId', 'status', 'evidence', 'blockers'}:
                        raise ValueError('WORKER_RESULT_SCHEMA')
                    if response.get('ticker') != job['request']['ticker'] or response.get('executionId') != job['executionId']:
                        raise ValueError('CROSS_TICKER_RESULT')
                    if response.get('status') not in ('COMPLETED', 'BLOCKED'):
                        raise ValueError('WORKER_STATUS_REQUIRED')
                    evidence = response.get('evidence', [])
                    if not isinstance(evidence, list) or any(e.get('subjectTicker') != job['request']['ticker'] for e in evidence):
                        raise ValueError('CROSS_TICKER_EVIDENCE')
                    result = {**deepcopy(response), 'operationKey': job['operationKey'], 'permissions': PERMISSIONS.copy()}
                except Exception as error:
                    reason = str(error) if isinstance(error, ValueError) and re.fullmatch(r'[A-Z_]+', str(error)) else 'WORKER_FAILED_' + type(error).__name__
                    result = {'ticker': job['request']['ticker'], 'executionId': job['executionId'], 'operationKey': job['operationKey'], 'status': 'FAILED', 'blockers': [reason], 'permissions': PERMISSIONS.copy()}
                relative = f'attempt-{attempt:04d}/RESULT.json'
                atomic(home / relative, result, True)
                progress = read(home / 'STATE.json')
                atomic(home / 'STATE.json', {**progress, 'status': result['status'], 'attempt': attempt, 'resultFile': relative, 'resultHash': digest(result)})
                return result
        return None
