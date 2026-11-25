import copy
from decimal import Decimal
import json
from pathlib import Path
from argparse import Namespace
from unittest import TestCase

from tools.scoring.public_disclosure import evaluate, incremental, stable_band
from tools.scoring.vn30_public_disclosure import run, verified_fields

PACKET = next(Path('docs').rglob('FPT_PUBLIC_DISCLOSURE_INPUT_V1.json'))
ARGS = Namespace(ticker='FPT', cutoff='2026-11-13', universe_version='vn30-20260803-reviewed-20261115',
                 packet=PACKET)


class PublicDisclosureTests(TestCase):
    def test_real_fpt_field_locators_and_formula_outputs(self):
        report = run(ARGS)
        self.assertEqual(report, run(ARGS))
        self.assertEqual(len(report['rubrics']), 23)
        self.assertEqual(sum(r['maxPoints'] for r in report['rubrics'].values()), 100)
        self.assertEqual(report['scoringAuthority'], 'NONE')
        self.assertFalse(report['historicalPitGranted'])
        rows = {r['rubricId']: r for r in report['proposed']}
        self.assertTrue(all(r['acceptedScore'] is None for r in rows.values()))
        self.assertEqual(rows['VAL-PRIMARY']['metrics']['reportedFcfVnd'], '5038124566055')
        self.assertEqual(round(Decimal(rows['VAL-PRIMARY']['metrics']['historicalPe']),2), Decimal('18.41'))
        self.assertEqual(round(100*Decimal(rows['CA-DIL']['metrics']['newSharesFraction']),4), Decimal('.6927'))
        self.assertEqual(rows['FH-STRESS']['metrics']['coverageGapsVnd'][2]['gap'], '-1239845083603.00')

    def test_reject_unmapped_value_and_late_publication(self):
        source = json.loads(PACKET.read_bytes())
        missing = copy.deepcopy(source)
        missing['fields']['cash'][0]['values'] = [983475283472]
        with self.assertRaisesRegex(ValueError, 'PUBLIC_FIELD_NOT_IN_PAGE'):
            verified_fields(missing, ARGS.cutoff)
        source['fields']['cash'][0]['publishedDate'] = '2026-11-14'
        with self.assertRaisesRegex(ValueError, 'PUBLIC_FIELD_PUBLISHED_AFTER_CUTOFF'):
            verified_fields(source, ARGS.cutoff)

    def test_missing_field_preserves_null_and_bank_uses_own_basis(self):
        self.assertIsNone(evaluate('CA-DIL', {}, 'BANK', {})['acceptedScore'])
        self.assertEqual(evaluate('VAL-PRIMARY', {}, 'BANK', {})['state'], 'METHODOLOGY_APPROVAL_REQUIRED')

    def test_unstable_denominator(self):
        metric, reason = incremental({
            'ebit': {2022: 1, 2023: 2, 2024: 3}, 'equity': {2022: 100, 2023: 102, 2024: 101},
            'borrowings': {2022: 0, 2023: 0, 2024: 0}, 'short_investments': {2022: 0, 2023: 0, 2024: 0},
        })
        self.assertEqual(reason, 'UNSTABLE_INCREMENTAL_CAPITAL_DENOMINATOR')
        self.assertTrue(all(row['return'] is None for row in metric['cases']))

    def test_band_requires_counterevidence_and_case_agreement(self):
        bands = [{'label':'Supported','min':2,'max':3}, {'label':'Adverse','min':0,'max':0}]
        self.assertEqual(stable_band(bands, ['Supported']*2, counter_reviewed=True, conservative=True), 2)
        self.assertIsNone(stable_band(bands, ['Supported','Adverse'], counter_reviewed=True, conservative=True))
        self.assertIsNone(stable_band(bands, ['Adverse'], counter_reviewed=False))
        self.assertEqual(stable_band(bands, ['Adverse'], counter_reviewed=True), 0)

    def test_amendment_requires_complete_dimensions_and_reviewed_stability(self):
        from tools.scoring.public_disclosure import AMENDMENT, DIMENSIONS, assess_amendment
        anchors = run(ARGS)['rubrics']['CA-DIL']['anchors']
        support = {field: ['verified'] for fields in DIMENSIONS['CA-DIL'].values() for field in fields}
        review = {'methodologyVersion': AMENDMENT, 'counterEvidence': ['counter'],
                  'conservative': True, 'scenarioBands': {'base': anchors[0]['label'], 'adverse': anchors[0]['label']}}
        self.assertEqual(assess_amendment('CA-DIL', support, anchors, review)['proposedPoints'], 0)
        review['scenarioBands']['base'] = anchors[1]['label']
        self.assertIsNone(assess_amendment('CA-DIL', support, anchors, review)['proposedPoints'])
        review['scenarioBands']['adverse'] = anchors[1]['label']
        self.assertEqual(assess_amendment('CA-DIL', support, anchors, review)['bandStability'],
                         'MAXIMUM_PREREQUISITES_UNVERIFIED')
        review['maximumPrerequisitesMet'] = True
        self.assertEqual(assess_amendment('CA-DIL', support, anchors, review)['proposedPoints'], 1)
        del support['event_date_comparable_close']
        self.assertIsNone(assess_amendment('CA-DIL', support, anchors, review)['proposedPoints'])

    def test_real_stress_dimensions_distinguish_metrics_from_funding_response(self):
        stress = next(r for r in run(ARGS)['proposed'] if r['rubricId'] == 'FH-STRESS')
        self.assertEqual(round(Decimal(stress['compositeDiagnostics']['ebitToInterest']), 2), Decimal('13.57'))
        self.assertEqual(stress['amendment']['missingByDimension']['interest_service'], [])
        self.assertIn('public_funding_response', stress['amendment']['missingByDimension']['financial_flexibility'])
        self.assertIsNone(stress['amendment']['proposedPoints'])
