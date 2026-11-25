import json
from argparse import Namespace
from pathlib import Path
import subprocess
from unittest import TestCase

from tools.scoring import m3_public_successor as m3
from tools.scoring.vn30_structural_disclosure import run

VERSION = 'vn30-20260803-reviewed-20261115'
PACKET = next(Path('docs').rglob('FPT_M3_PUBLIC_SUCCESSOR_INPUT_V1.json'))


class M3PublicSuccessorTests(TestCase):
    def test_real_successor_research_and_actual_ebcs_entrypoint_agree(self):
        research = run(Namespace(ticker='FPT', cutoff='2026-11-13', universe_version=VERSION,
                                 packet=PACKET, lane='research'))
        ebcs = json.loads(subprocess.check_output([
            'node', 'tools/scoring/vn30_ebcs_preview.mjs', '--ticker', 'FPT',
            '--cutoff', '2026-11-13', '--universe-version', VERSION, '--input', str(PACKET)]))
        self.assertEqual(research['proposed'], ebcs['proposed'])
        self.assertEqual(research['inputHash'], ebcs['inputHash'])
        self.assertEqual(len(ebcs['rows']), 23)
        self.assertEqual(ebcs['approvedEbcsCoverage']['ratedRubricCount'], 3)
        self.assertEqual(ebcs['productionAuthority'], 'NONE')
        self.assertEqual(ebcs['successorPreviewCoverage']['raw_scored_points'], 8)
        self.assertEqual(ebcs['successorPreviewCoverage']['evaluated_weight'], 19)
        self.assertIsNone(ebcs['successorPreviewCoverage']['full_official_score'])
        self.assertEqual(ebcs['proposed']['FH-STRESS']['score'], 2)
        self.assertEqual(ebcs['proposed']['CA-REINV']['score'], 1)
        self.assertNotIn('cutoff_price', ebcs['proposed']['VAL-PRIMARY']['missingFields'])
        self.assertIn('normalized_earning_power', ebcs['proposed']['VAL-PRIMARY']['missingFields'])

    def test_exact_binding_gap_is_distinct_from_economic_disposition(self):
        args = Namespace(ticker='FPT', cutoff='2026-11-13', universe_version=VERSION,
                         packet=PACKET, lane='ebcs-replay')
        report = run(args)
        gaps = [r for r in report['rows'] if r['researchScore'] is not None and r['ebcsAcceptedScore'] is None]
        self.assertEqual(len(gaps), 15)
        self.assertTrue(all(r['approvedEbcsBindingFailure'] == 'NO_ASSESSMENT_BOUND_TO_EXACT_EBCS_INPUT'
                            and r['proposedCorrection'] for r in gaps))
        self.assertTrue(all(r['approvedEbcsBindingFailure'] is None for r in report['rows']
                            if r['ebcsAcceptedScore'] is not None))

    def test_removed_fields_are_not_successor_mandatory(self):
        specs = json.loads(Path(m3.PATH).read_text())['rubrics']
        for key, spec in specs.items():
            self.assertFalse(set(spec['removed']) & set(spec['requiredPublicFields']))
            actual = m3.evaluate(key, spec, [], 'TECHNOLOGY', {}, {})
            self.assertEqual(actual['missingFields'], spec['requiredPublicFields'])
        self.assertEqual(m3.evaluate('GQ-INC', specs['GQ-INC'], [], 'BANK', {}, {})['reason'],
                         'SUCCESSOR_SECTOR_EQUIVALENT_REQUIRED')

    def test_observable_esop_economics_select_band_without_private_offsets(self):
        spec = json.loads(Path(m3.PATH).read_text())['rubrics']['CA-DIL']
        values = dict(issued=10, outstanding_before=100, issue_price=10, proceeds=100,
                      esop_event_economics=[{'id':'event','perShareEffect':'-.015'}],
                      material_event_review='SUPPORTED', shareholder_protection_review='SUPPORTED')
        anchors = [{'min':0, 'max':0, 'label':'Value destruction'}, {'min':1, 'max':1, 'label':'Disciplined'}]
        lineage = {k:['test'] for k in values}
        self.assertEqual(m3.evaluate('CA-DIL',spec,anchors,'TECHNOLOGY',values,lineage)['score'],0)
        values['esop_event_economics'][0]['perShareEffect']='-.005'
        self.assertIsNone(m3.evaluate('CA-DIL',spec,anchors,'TECHNOLOGY',values,lineage)['score'])
