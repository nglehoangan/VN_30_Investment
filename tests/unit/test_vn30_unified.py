import copy
import json
from pathlib import Path
import subprocess
import tempfile
from unittest import TestCase

from tools.scoring.vn30_unified import authorization_eligibility, classify, persist
from tools.scoring.structural_nr import digest

ROOT = Path(__file__).resolve().parents[2]
INPUT = next((ROOT / 'docs').rglob('FPT_UNIFIED_INPUT_V1.json'))


class UnifiedTests(TestCase):
    def test_actual_retained_inputs_reconcile_and_persist_deterministically(self):
        original = INPUT.read_bytes()
        config = json.loads(original)
        handoff_path = ROOT / config['handoff']['path']
        research_bytes = handoff_path.read_bytes()
        with tempfile.TemporaryDirectory() as directory:
            command = ['python3', '-B', 'tools/scoring/vn30_unified.py', '--ticker', 'FPT',
                       '--cutoff', '2026-11-13', '--universe-version', 'vn30-20260803-reviewed-20261115',
                       '--packet', str(INPUT), '--store', directory]
            first, second = [json.loads(subprocess.check_output(command, cwd=ROOT)) for _ in range(2)]
            self.assertEqual(first, second)
            records = list(Path(directory).glob('*.json'))
            self.assertEqual(len(records), 1)
            payload = json.loads(records[0].read_bytes())
            self.assertEqual(digest(payload), first['candidateHash'])
            self.assertEqual(payload['segmReuse']['discoveryCalls'], 0)
            self.assertEqual(len(payload['rows']), 23)
            baseline = {x['rubricId']: x for x in json.loads(research_bytes)['rubrics']}
            rated = [row for row in payload['rows'] if row['researchScore'] is not None]
            self.assertEqual(len(rated), 18)
            for row in payload['rows']:
                research = baseline[row['rubricId']]
                self.assertEqual(row['researchScore'], research['researchFY2025']['points'])
                self.assertEqual(row['sourceIdentifiers'], research['researchEvidence'])
            self.assertEqual({r['segmFeasibilityState'] for r in rated},
                             {'VALIDATED_CANDIDATE', 'REJECTED_WITH_SPECIFIC_REASON', 'METHODOLOGY_APPROVAL_REQUIRED'})
            self.assertEqual(first['officialEligibility'], 'EXACT_CANDIDATE_AUTHORITY_REQUIRED')
            blocked = subprocess.run(command+['--execute-official'], cwd=ROOT, capture_output=True)
            self.assertNotEqual(blocked.returncode, 0)
            self.assertIn('EXACT_CANDIDATE_AUTHORITY_REQUIRED', blocked.stdout.decode())
            self.assertEqual(list(Path(directory).glob('*.json')), records)
        self.assertEqual(INPUT.read_bytes(), original)
        self.assertEqual(handoff_path.read_bytes(), research_bytes)

    def test_v8_controller_matches_approved_executable_pin(self):
        import hashlib

        executable = json.loads(INPUT.with_name('FPT_EXECUTABLE_APPROVED.json').read_text())
        pin = next(x for x in executable['code'] if x['path'] == 'tools/scoring/vn30_score.py')
        self.assertEqual(hashlib.sha256((ROOT / pin['path']).read_bytes()).hexdigest(), pin['sha256'])

    def test_hash_store_refuses_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            data = {'evidence': 1}
            path, _ = persist(Path(directory), data)
            path.write_text('tampered')
            with self.assertRaisesRegex(ValueError, 'CANDIDATE_STORE_INTEGRITY_FAILURE'):
                persist(Path(directory), data)

    def test_points_cannot_change_without_reconciliation(self):
        with self.assertRaisesRegex(ValueError, 'REJECT_UNRECONCILED_RESEARCH_SCORE_CHANGE'):
            classify(3, {'points': 2}, 2, None, {})
        with self.assertRaisesRegex(ValueError, 'SPECIFIC_REJECTION_REQUIRED'):
            classify(3, None, None, None, {})

    def test_approved_reopening_requires_supported_candidate(self):
        missing = {'reason': 'INSUFFICIENT_ESSENTIAL_EVIDENCE', 'detail': 'Timing of available cash absent'}
        self.assertEqual(classify(2, None, None, None, missing), 'REJECTED_WITH_SPECIFIC_REASON')
        with self.assertRaisesRegex(ValueError, 'EBCS_SCORE_WITHOUT_MATCHING_REVIEW'):
            classify(2, None, 2, None, missing)
        self.assertEqual(classify(2, {'points': 2}, 2, None, missing), 'VALIDATED_CANDIDATE')

    def test_exact_candidate_authority_precheck(self):
        route = next(r for r in json.loads((ROOT/'tools/scoring/vn30-score-routes.json').read_text())['routes']
                     if r['subject']['ticker'] == 'FPT')
        fixture = json.loads((ROOT/route['assessment']['path']).read_text())
        self.assertEqual(authorization_eligibility(None, fixture), 'EXACT_CANDIDATE_AUTHORITY_REQUIRED')
        self.assertEqual(authorization_eligibility(route, fixture), 'NATIVE_PREFLIGHT_REQUIRED')
        changed = copy.deepcopy(fixture)
        changed['input']['id'] = 'different'
        self.assertEqual(authorization_eligibility(route, changed), 'EXACT_CANDIDATE_AUTHORITY_REQUIRED')

    def test_changed_fpt_cash_observation_revises_only_dependent_rows(self):
        import hashlib

        config = json.loads(INPUT.read_bytes())
        with tempfile.TemporaryDirectory(dir=ROOT) as scratch, tempfile.TemporaryDirectory() as store:
            scratch = Path(scratch)
            def write(name, obj):
                file = scratch / name
                file.write_text(json.dumps(obj, ensure_ascii=False))
                return {'path': str(file.relative_to(ROOT)), 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()}

            def load(pin):
                return json.loads((ROOT / pin['path']).read_bytes())

            command = ['python3', '-B', 'tools/scoring/vn30_unified.py', '--ticker', 'FPT', '--cutoff', '2026-11-13',
                       '--universe-version', 'vn30-20260803-reviewed-20261115', '--store', store, '--packet']
            first = json.loads(subprocess.check_output(command+[str(INPUT)], cwd=ROOT))
            first_file = Path(first['path'])
            unchanged = first_file.read_bytes()
            baseline = json.loads(unchanged)
            cfg = copy.deepcopy(config)
            cfg['incrementalFrom'] = {'candidateHash': first['candidateHash'],
                                      'input': {'path': str(INPUT.relative_to(ROOT)),
                                                'sha256': hashlib.sha256(INPUT.read_bytes()).hexdigest()}}
            annual = load(cfg['annual'])
            snapshot = load(annual['current'])
            cash = next(r for r in snapshot['observations'] if r['id'] == annual['reportedFcf']['CFO']['observationId'])
            cells = load(cash['source'])
            cash['value'] = '250000000000'
            cash['publishedAt'] = '2026-08-21T10:00:00+07:00'
            cells['cells'][7]['value'] = cash['value']
            cash['source'] = write('isolated-reviewed-cfo.json', cells)
            cash['admission'] = write('isolated-admission.json', {'testOnly': True, 'observation': cash['id'],
                                                                 'sha256': cash['source']['sha256']})
            annual['current'] = write('isolated-snapshot.json', snapshot)
            cfg['annual'] = write('isolated-annual.json', annual)
            cfg['dispositions']['RG-UNC'] = {'reason': 'MATERIAL_COUNTER_EVIDENCE',
                                             'detail': 'Isolated CFO revision invalidated the old scenario review.'}
            stale = write('stale-candidate.json', cfg)
            failed = subprocess.run(command+[stale['path']], cwd=ROOT, capture_output=True, text=True)
            self.assertIn('AFFECTED_RUBRIC_REVIEW_REQUIRED:RG-UNC', failed.stdout)
            old_preview = load(cfg['candidate'])
            inp = old_preview['input']
            inp['assessments'] = [a for a in inp['assessments'] if a['subcategory'] != 'RG-UNC']
            inp['id'] += '-TEST-REASSESSMENT'
            inp['evidence'] = [e for e in inp['evidence'] if not e['id'].startswith('FPT-WA1-RG-UNC')]
            inp['review']['assessmentHashes'] = [a for a in inp['review']['assessmentHashes'] if a['rubricId'] != 'RG-UNC']
            inp['review']['evidenceHash'] = digest(inp['evidence'])
            inp['review']['inputHash'] = digest({k:v for k,v in inp.items() if k not in {'id','calculatedAt','review'}})
            old_preview['conservativeAssessments'] = []
            cfg['candidate'] = write('isolated-preview.json', old_preview)
            revised = write('revised.json', cfg)
            second = json.loads(subprocess.check_output(command+[revised['path']], cwd=ROOT))
            self.assertNotEqual(first['candidateHash'], second['candidateHash'])
            self.assertEqual(second, json.loads(subprocess.check_output(command+[revised['path']], cwd=ROOT)))
            new = json.loads(Path(second['path']).read_bytes())
            self.assertEqual(new['incremental']['changedDependencies'], ['cash_flow'])
            self.assertEqual(new['incremental']['affectedMetrics'], ['reportedFcf'])
            self.assertIn('RG-UNC', new['incremental']['affectedRubrics'])
            for old, current in zip(baseline['rows'], new['rows'], strict=True):
                if current['rubricId'] not in new['incremental']['affectedRubrics']:
                    self.assertEqual(old,current)
                if current['rubricId'] == 'RG-UNC':
                    self.assertEqual(old['acceptedScore'], 0)
                    self.assertIsNone(current['acceptedScore'])
            self.assertEqual(first_file.read_bytes(), unchanged)
            self.assertNotEqual(new['incremental']['observationChanges']['cash_flow']['previousHash'],
                                new['incremental']['observationChanges']['cash_flow']['currentHash'])
            cash['publishedAt'] = '2026-11-14T10:00:00+07:00'
            # A pre-cutoff period published after cutoff cannot enter the active index.
            future = write('future-snapshot.json', snapshot)
            from tools.scoring.annual_reassessment import _snapshot
            future_index = _snapshot(future, annual['subject'], annual['methodology'], annual['purpose'],
                                     annual['currentPublicationProof'])[2]
            self.assertNotIn(cash['id'], future_index['cash_flow'])
