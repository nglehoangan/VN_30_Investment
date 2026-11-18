import json
from copy import deepcopy
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'skills/vn30-rollout-orchestrator/scripts'))
from control import Universe, Rollout, Worker, prepare, ticker, read, atomic, require_input_identity, digest

VERSION = 'vn30-20260803-reviewed-20261115'
SKILL = 'equity-s1-s5-assessment'


def request(symbol='VNM', sector='INDUSTRIAL'):
    return dict(ticker=symbol, skill=SKILL, referenceDate='2026-10-30',
                purpose='RETROSPECTIVE_RESEARCH', sector=sector)


def response(job, status='COMPLETED'):
    return dict(ticker=job['request']['ticker'], executionId=job['executionId'], status=status,
                evidence=[{'subjectTicker': job['request']['ticker'], 'kind': 'SYNTHETIC_TEST_ONLY'}])


class RolloutTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.universe = Universe(VERSION)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.rollout = Rollout(self.temp.name, self.universe)

    def tearDown(self): self.temp.cleanup()

    def test_all_execution_skill_contexts_require_one_ticker(self):
        for skill in ('equity-s1-s5-assessment', 'vn30-market-price-corporate-actions', 'fetch-cafef-price-history', 'fetch-vietstock-dividend-pdfs', 'read-pdf-json-first'):
            raw = {**request(), 'skill': skill}
            prepared = prepare(raw, self.universe)
            self.assertEqual(prepared['request']['ticker'], 'VNM')
            self.assertFalse(any(prepared['permissions'].values()))
            for value in (None, '', [], ['VNM'], ['VNM', 'FPT'], 'ALL', 'all', 'VN30', '*', 'V*', '?', '%', 'VNM,FPT', 'VNM FPT', 'VNM/FPT', '../VNM', 'ＶＮＭ'):
                with self.subTest(skill=skill, value=value), self.assertRaises(ValueError):
                    prepare({**raw, 'ticker': value}, self.universe)

    def test_missing_plural_or_hidden_batch_scope_rejected(self):
        for raw in ({k:v for k,v in request().items() if k!='ticker'}, {**request(), 'tickers':['FPT']}, {**request(), 'parameters':{'symbols':['VNM','FPT']}}):
            with self.assertRaises(ValueError): prepare(raw, self.universe)

    def test_version_dates_security_and_exchange_checked(self):
        self.assertEqual(prepare({**request(), 'ticker':'vnm'}, self.universe)['request']['ticker'], 'VNM')
        for raw in ({**request(), 'ticker':'ZZZ'}, {**request(), 'referenceDate':'2026-08-02'}, {**request(), 'referenceDate':'2026-11-18'}, {**request(), 'exchange':'HNX'}):
            with self.assertRaises(ValueError): prepare(raw, self.universe)
        with self.assertRaises(ValueError): Universe('invented-version')
        synthetic=deepcopy(self.universe);synthetic.intervals['VNM']['effectiveTo']='2026-10-30'
        self.assertEqual(synthetic.eligible('VNM','2026-10-29')['ticker'],'VNM')
        with self.assertRaisesRegex(ValueError,'EFFECTIVE_INTERVAL'):synthetic.eligible('VNM','2026-10-30')

    def test_universe_inventory_is_read_only_not_execution_readiness(self):
        report = self.universe.inventory('2026-10-30')
        self.assertEqual(len(report['rows']),30)
        self.assertTrue(all(r['status']=='REFERENCE_DATE_ELIGIBLE' for r in report['rows']))
        self.assertFalse(list(Path(self.temp.name).iterdir()))
        self.assertEqual(report['executionReadiness'],'NOT_INFERRED_FROM_MEMBERSHIP')
        self.assertTrue(all(r['status']=='UNVERIFIED' for r in self.universe.inventory('2026-11-18')['rows']))

    def test_sector_not_defaulted_or_transferred_from_vnm(self):
        for symbol, sector in [('ACB','BANK'),('FPT','TECHNOLOGY'),('VNM','INDUSTRIAL')]:
            self.assertEqual(prepare(request(symbol,sector),self.universe)['request']['sector'],sector)
        for sector in (None,'BANKING','UNKNOWN'):
            with self.assertRaises(ValueError):prepare(request('ACB',sector),self.universe)

    def test_other_ticker_authority_or_input_cannot_be_reused(self):
        for kind in ('SOURCE','ASSESSMENT','DEPLOYMENT','PUBLICATION'):
            raw={**request('FPT','TECHNOLOGY'),'bindings':[dict(kind=kind,subjectTicker='VNM',reference='VNM receipt',sha256='a'*64)]}
            with self.assertRaisesRegex(ValueError,'CROSS_TICKER'):prepare(raw,self.universe)
        context=prepare(request('FPT','TECHNOLOGY'),self.universe)
        with self.assertRaisesRegex(ValueError,'CROSS_TICKER_INPUT'):require_input_identity(context,{'ticker':'VNM'})
        with self.assertRaises(ValueError):require_input_identity(context,{'ticker':'FPT','cutoff':'2026-11-01'})

    def test_queue_invokes_only_one_ticker_per_call_in_order(self):
        queue=self.rollout.plan([request(),request('FPT','TECHNOLOGY'),request('ACB','BANK')]);calls=[]
        def work(job,checkpoint):
            self.assertIsInstance(job['request']['ticker'],str)
            calls.append(job['request']['ticker']);checkpoint('fixture-step',{'source':'SYNTHETIC_TEST_ONLY'})
            return response(job)
        worker=Worker(SKILL,work,'IDEMPOTENT')
        for expected in (['VNM'],['VNM','FPT'],['VNM','FPT','ACB']):
            self.rollout.run_next(queue,worker);self.assertEqual(calls,expected)
        self.assertIsNone(self.rollout.run_next(queue,worker))
        jobs=self.rollout.status(queue)['jobs'];self.assertEqual(len({j['executionId'] for j in jobs}),3)
        for job in self.rollout.jobs(queue):
            self.assertTrue((self.rollout.home(job)/'attempt-0001/checkpoint-0001.json').exists())

    def test_non_unit_concurrency_and_overlapping_dispatch_rejected(self):
        for value in (0,2,True,'1',None):
            with self.assertRaises(ValueError):Rollout(self.temp.name,self.universe,value)
        q=self.rollout.plan([request()]);called=[]
        with self.rollout.lock(),self.assertRaisesRegex(ValueError,'ROLLOUT_BUSY'):
            self.rollout.run_next(q,Worker(SKILL,lambda j,c:called.append(j)))
        self.assertEqual(called,[])

    def test_failure_does_not_modify_completed_ticker_and_remaining_queue_continues(self):
        q=self.rollout.plan([request(),request('FPT','TECHNOLOGY'),request('ACB','BANK')]);calls=[]
        def work(job,checkpoint):
            calls.append(job['request']['ticker'])
            if job['request']['ticker']=='FPT':raise RuntimeError('synthetic failure')
            return response(job)
        worker=Worker(SKILL,work,'IDEMPOTENT');first=self.rollout.run_next(q,worker)
        home=self.rollout.home(self.rollout.jobs(q)[0]);saved={str(p):p.read_bytes() for p in home.rglob('*') if p.is_file()}
        self.assertEqual(self.rollout.run_next(q,worker)['status'],'FAILED')
        self.assertEqual(self.rollout.run_next(q,worker)['ticker'],'ACB')
        self.assertEqual(saved,{str(p):p.read_bytes() for p in home.rglob('*') if p.is_file()})
        self.assertEqual(self.rollout.run_next(q,worker,retry_ticker='VNM'),first)
        self.assertEqual(calls,['VNM','FPT','ACB'])

    def test_explicit_safe_retry_uses_same_operation_key_and_preserves_attempts(self):
        q=self.rollout.plan([request()]);effects=set();keys=[]
        def work(job,checkpoint):
            keys.append(job['operationKey']);effects.add(job['operationKey'])
            if len(keys)==1:raise ValueError('SYNTHETIC_RETRY')
            return response(job)
        worker=Worker(SKILL,work,'IDEMPOTENT');self.rollout.run_next(q,worker)
        result=self.rollout.run_next(q,worker,retry_ticker='VNM')
        self.assertEqual(result['status'],'COMPLETED');self.assertEqual(len(effects),1);self.assertEqual(keys[0],keys[1])
        self.assertEqual(self.rollout.status(q)['jobs'][0]['attempt'],2)
        home=self.rollout.home(self.rollout.jobs(q)[0]);self.assertTrue((home/'attempt-0001/RESULT.json').exists())

    def test_interrupted_worker_checkpoint_resume_and_ambiguous_effect_gate(self):
        q=self.rollout.plan([request()])
        def interrupted(job,checkpoint):checkpoint('saved-before-interruption',{'fixture':True});raise KeyboardInterrupt()
        with self.assertRaises(KeyboardInterrupt):self.rollout.run_next(q,Worker(SKILL,interrupted))
        blocked=self.rollout.run_next(q,Worker(SKILL,lambda j,c:response(j)))
        self.assertEqual(blocked['status'],'BLOCKED');self.assertIn('RECONCILE_EXTERNAL_EFFECTS',blocked['blockers'][0])
        resumes=[]
        def resume(job,checkpoint):resumes.append(job['resume']);return response(job)
        self.assertEqual(self.rollout.run_next(q,Worker(SKILL,resume,'IDEMPOTENT'))['status'],'COMPLETED')
        self.assertEqual(resumes[0]['step'],'saved-before-interruption')

    def test_result_scope_permission_escalation_and_duplicate_job_rejected(self):
        for bad in ({'ticker':'FPT'}, {'assessmentApproved':True}, {'evidence':[{'subjectTicker':'FPT'}]}):
            with tempfile.TemporaryDirectory() as folder:
                r=Rollout(folder,self.universe);q=r.plan([request()])
                result=r.run_next(q,Worker(SKILL,lambda j,c:{**response(j),**bad},'IDEMPOTENT'))
                self.assertEqual(result['status'],'FAILED');self.assertFalse(any(result['permissions'].values()))
        with self.assertRaises(ValueError):self.rollout.plan([request(),request()])

    def test_corrupt_one_ticker_result_is_local_and_does_not_rerun_completed_other(self):
        q=self.rollout.plan([request(),request('FPT','TECHNOLOGY')]);calls=[]
        worker=Worker(SKILL,lambda j,c:(calls.append(j['request']['ticker']) or response(j)),'IDEMPOTENT')
        self.rollout.run_next(q,worker);self.rollout.run_next(q,worker)
        first=self.rollout.jobs(q)[0];state=read(self.rollout.home(first)/'STATE.json');(self.rollout.home(first)/state['resultFile']).write_text('{}')
        report=self.rollout.status(q);self.assertEqual(report['jobs'][0]['status'],'INTEGRITY_BLOCKED');self.assertEqual(report['jobs'][1]['status'],'COMPLETED')
        self.assertIsNone(self.rollout.run_next(q,worker));self.assertEqual(calls,['VNM','FPT'])

    def test_replanning_is_idempotent_and_new_date_changes_execution_identity(self):
        q=self.rollout.plan([request()]);self.assertEqual(q,self.rollout.plan([request()]))
        newer={**request(),'referenceDate':'2026-10-29'}
        self.assertNotEqual(prepare(request(),self.universe)['executionId'],prepare(newer,self.universe)['executionId'])
        with self.assertRaises(ValueError):self.rollout.plan([request(),{**request('FPT','TECHNOLOGY'),'skill':'read-pdf-json-first'}])

    def test_rehashed_cached_receipt_cannot_escalate_permissions_or_other_skill(self):
        q=self.rollout.plan([request()]);worker=Worker(SKILL,lambda j,c:response(j),'IDEMPOTENT')
        self.rollout.run_next(q,worker)
        with self.assertRaisesRegex(ValueError,'SKILL_MISMATCH'):
            self.rollout.run_next(q,Worker('read-pdf-json-first',lambda j,c:response(j),'IDEMPOTENT'),retry_ticker='VNM')
        job=self.rollout.jobs(q)[0];home=self.rollout.home(job);state=read(home/'STATE.json');result=read(home/state['resultFile'])
        result['permissions']['publicationAuthorized']=True;atomic(home/state['resultFile'],result);state['resultHash']=digest(result);atomic(home/'STATE.json',state)
        self.assertEqual(self.rollout.status(q)['jobs'][0]['status'],'INTEGRITY_BLOCKED')
        self.assertIsNone(self.rollout.run_next(q,worker,retry_ticker='VNM'))

    def test_changed_universe_source_cannot_be_admitted_by_a_matching_ticker(self):
        import shutil
        registry=ROOT/'skills/vn30-rollout-orchestrator/references/universe-registry.json'
        entry=json.loads(registry.read_text())['versions'][0]
        profile=json.loads((ROOT/entry['profile']['path']).read_text())
        paths=[registry.relative_to(ROOT),Path(entry['profile']['path']),Path(entry['sectorRegistry']['path']),Path(profile['membership']['path']),Path(profile['membership']['identitySource']['path'])]
        for path in paths:
            target=Path(self.temp.name)/path;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/path,target)
        (Path(self.temp.name)/entry['profile']['path']).write_text('{}')
        with self.assertRaisesRegex(ValueError,'HASH_MISMATCH'):Universe(VERSION,Path(self.temp.name))

    def test_failed_checkpoint_is_retained_for_explicit_retry(self):
        q=self.rollout.plan([request()]);resumes=[]
        def work(job,checkpoint):
            resumes.append(job['resume'])
            if len(resumes)==1:checkpoint('recoverable-step',{'fixture':True});raise ValueError('SYNTHETIC_FAILURE')
            return response(job)
        worker=Worker(SKILL,work,'IDEMPOTENT');self.rollout.run_next(q,worker)
        self.rollout.run_next(q,worker,retry_ticker='VNM');self.assertEqual(resumes[1]['step'],'recoverable-step')

    def test_cli_requires_one_ticker_and_has_no_live_execution_command(self):
        cli=ROOT/'skills/vn30-rollout-orchestrator/scripts/runtime.py'
        base=[sys.executable,'-B',str(cli),'prepare','--skill',SKILL,'--sector','INDUSTRIAL','--purpose','RETROSPECTIVE_RESEARCH','--reference-date','2026-10-30','--universe-version',VERSION]
        for args in ([],['--ticker','ALL'],['--ticker','VNM,FPT'],['--ticker','VNM','--ticker','FPT'],['--ticker','VNM','--ticker','VNM'],['--ticker','VNM','--run']):
            r=subprocess.run(base+args,capture_output=True,text=True);self.assertNotEqual(r.returncode,0)
        r=subprocess.run(base+['--ticker','VNM'],capture_output=True,text=True);self.assertEqual(r.returncode,0,r.stderr)
        self.assertEqual(json.loads(r.stdout)['request']['ticker'],'VNM')


if __name__=='__main__': unittest.main()
