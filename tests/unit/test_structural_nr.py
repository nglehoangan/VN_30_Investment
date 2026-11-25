import json
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest

from tools.scoring import structural_nr as nr
from control import Rollout, Worker

AUDIT = nr.ROOT / 'docs/fundamental-data-engine/structural-nr-remediation/2026-11-23'
VERSION = 'vn30-20260803-reviewed-20261115'


def packet(ticker):
    return json.loads((AUDIT / f'{ticker}_DIAGNOSTIC.json').read_text())


def run(value, ticker=None):
    context = nr.prepare({
        'skill': nr.SKILL, 'ticker': ticker or value['ticker'], 'sector': value['sector'],
        'referenceDate': value['cutoff'], 'purpose': 'RETROSPECTIVE_RESEARCH',
        'parameters': {'packetDigest': nr.digest(value)},
    }, nr.Universe(VERSION))
    return nr.diagnose(context, value)


class StructuralNrTests(unittest.TestCase):
    def test_existing_cases_run_as_separate_sequential_jobs(self):
        packets = {ticker: packet(ticker) for ticker in ('VNM', 'ACB', 'TCB')}
        requests = [
            {'skill': nr.SKILL, 'ticker': ticker, 'sector': value['sector'],
             'referenceDate': value['cutoff'], 'purpose': 'RETROSPECTIVE_RESEARCH',
             'parameters': {'packetDigest': nr.digest(value)}}
            for ticker, value in packets.items()
        ]
        visited = []

        def validate(context, checkpoint):
            ticker = context['request']['ticker']
            result = nr.diagnose(context, packets[ticker])
            visited.append((ticker, result['baselineNrCount']))
            return {'ticker': ticker, 'executionId': result['executionId'], 'status': 'COMPLETED',
                    'evidence': [{'subjectTicker': ticker}],
                    'blockers': [row['blocker'] for row in result['rows']]}

        with TemporaryDirectory() as scratch:
            queue = Rollout(scratch, nr.Universe(VERSION))
            queue_id = queue.plan(requests)
            worker = Worker(nr.SKILL, validate)
            for _ in requests:
                result = queue.run_next(queue_id, worker)
                self.assertEqual(result['status'], 'COMPLETED', result)
                self.assertFalse(any(result['permissions'].values()))
            self.assertIsNone(queue.run_next(queue_id, worker))
        self.assertEqual(visited, [('VNM', 0), ('ACB', 9), ('TCB', 3)])

    def test_retained_baselines_and_null_dispositions(self):
        for ticker, count in [('VNM', 0), ('ACB', 9), ('TCB', 3)]:
            value = run(packet(ticker))
            self.assertEqual(value['baselineNrCount'], count)
            self.assertFalse(any(value['permissions'].values()))
            self.assertEqual({tuple(row['disposition'].values()) for row in value['rows']},
                             {('N/R', None)} if count else set())
            self.assertEqual(value, run(packet(ticker)))

    def test_missing_rubric_repeated_pass_or_zero_is_rejected(self):
        value = packet('TCB')
        value['reviewCounts']['evidenceImprovement'] = 2
        with self.assertRaisesRegex(ValueError, 'UNBOUNDED'):
            run(value)
        value = packet('TCB')
        value['rows'][0]['disposition']['points'] = 0
        with self.assertRaisesRegex(ValueError, 'NR_MUST_BE_NULL'):
            run(value)
        value['rows'].pop(0)
        with self.assertRaisesRegex(ValueError, 'INCOMPLETE_NR'):
            run(value)

    def test_repeated_cli_ticker_is_rejected(self):
        result = subprocess.run([sys.executable, '-B', str(nr.ROOT / 'tools/scoring/structural_nr.py'),
                                 '--ticker', 'TCB', '--ticker', 'TCB', '--universe-version', VERSION,
                                 '--packet', str(AUDIT / 'TCB_DIAGNOSTIC.json')],
                                capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('EXACTLY_ONE_TICKER_REQUIRED', result.stderr)

    def test_provenance_and_single_ticker_binding(self):
        value = packet('TCB')
        with self.assertRaisesRegex(ValueError, 'PACKET_BINDING_MISMATCH'):
            run(value, 'ACB')
        value['rows'][0]['evidence'][0]['subjectTicker'] = 'ACB'
        with self.assertRaisesRegex(ValueError, 'DIAGNOSTIC_EVIDENCE_SCOPE'):
            run(value)
        value['rows'][0]['evidence'][0].update(subjectTicker='TCB', sha256='0' * 64)
        with self.assertRaisesRegex(ValueError, 'RETAINED_SOURCE_HASH'):
            run(value)

    def test_no_future_data_and_design_changes_fail_closed(self):
        value = packet('TCB')
        row = value['rows'][0]
        row['action'] = 'RETAIN_NR'
        with self.assertRaisesRegex(ValueError, 'NO_REQUIRES_STRUCTURAL'):
            run(value)
        row['action'] = 'STRUCTURAL_ESCALATION'
        row['causes'].append('RUBRIC_DESIGN_GAP')
        with self.assertRaisesRegex(ValueError, 'DESIGN_CHANGE_PROPOSAL_ONLY'):
            run(value)

    def research_candidate(self):
        value = packet('TCB')
        row = value['rows'][0]
        row.update(action='APPLY_APPROVED_ANCHORS', status='RESOLVED', blocker='', approvalRequired=True)
        row['futureDataTest']['result'] = 'YES'
        pin = row['evidence'][0]
        row['disposition'] = {
            'state': 'CONSERVATIVE', 'points': 2,
            'supportedBands': ['Severe stress vulnerability', 'Survives with material constraints'],
            'bandRationale': 'Synthetic band evidence for validator branch coverage.',
            'review': pin,
            'scoreEvidence': [{**pin, 'ticker': 'TCB', 'periodEnd': '2026-09-30', 'scope': 'BANK consolidated',
                               'unit': 'VND', 'publicationDate': '2026-10-31',
                               'knownAt': '2026-11-01T00:00:00Z', 'eligibility': 'CURRENT_ONLY'}],
        }
        return value, row

    def test_lowest_supported_band_and_verified_band(self):
        value, row = self.research_candidate()
        self.assertEqual(run(value)['rows'][0]['disposition']['points'], 2)
        row['disposition']['points'] = 3
        with self.assertRaisesRegex(ValueError, 'CONSERVATIVE_MUST_USE_LOWEST'):
            run(value)
        row['disposition'].update(state='VERIFIED', supportedBands=['Survives with material constraints'])
        self.assertEqual(run(value)['rows'][0]['disposition']['points'], 3)
        row['approvalRequired'] = False
        with self.assertRaisesRegex(ValueError, 'BASELINE_CHANGE_REQUIRES_APPROVAL'):
            run(value)

    def test_pit_and_provisional_evidence(self):
        value, row = self.research_candidate()
        fact = row['disposition']['scoreEvidence'][0]
        fact['eligibility'] = 'PROVISIONAL'
        with self.assertRaisesRegex(ValueError, 'PROVISIONAL_EVIDENCE'):
            run(value)
        value.update(evidencePurpose='HISTORICAL_PIT', knowledgeCutoff='2026-10-30T23:59:00+07:00')
        fact.update(publicationDate='2026-10-30', knownAt='2026-10-30T14:00:00Z', eligibility='CURRENT_ONLY')
        with self.assertRaisesRegex(ValueError, 'HISTORICAL_PIT_EVIDENCE_REQUIRED'):
            run(value)
        fact['eligibility'] = 'HISTORICAL_PIT'
        run(value)
        fact['knownAt'] = '2026-10-30T17:00:00Z'
        with self.assertRaisesRegex(ValueError, 'EVIDENCE_IDENTITY_OR_TIME'):
            run(value)

    def test_mapping_requires_exact_raw_value_replay(self):
        value, row = self.research_candidate()
        row['causes'].append('DATA_MAPPING_GAP')
        row['action'] = 'REPAIR_MAPPING'
        with self.assertRaisesRegex(ValueError, 'RAW_MAPPING_CHECK_REQUIRED'):
            run(value)
        checks = [{'raw': {**value['baseline'], 'pointer': '/card/limitedCoverage/unratedRubrics/0'},
                   'mapped': {**value['baseline'], 'pointer': '/card/subcategories/6/id'},
                   'identityAndTransformReview': 'Synthetic exact field comparison.'}]
        row['disposition']['scoreEvidence'].append({
            **row['disposition']['scoreEvidence'][0], **value['baseline'],
            'locator': '/card/limitedCoverage/unratedRubrics/0',
        })
        row['disposition']['mappingChecks'] = checks
        run(value)
        checks[0]['mapped']['pointer'] = '/card/subcategories/0/id'
        with self.assertRaisesRegex(ValueError, 'RAW_MAPPING_VALUE_OR_LINEAGE'):
            run(value)


if __name__ == '__main__':
    unittest.main()
