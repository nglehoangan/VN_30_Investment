from argparse import Namespace
from pathlib import Path
from unittest import TestCase

from tools.scoring.public_disclosure_v2 import allocation, dilution, productivity, stress, valuation
from tools.scoring.vn30_public_disclosure import run


class PublicDisclosureV2Tests(TestCase):
    def test_stress_band_boundaries_and_funding_response(self):
        for response, gaps, expected in [
            ('FAILED', (1, -1, -2), 0), ('DISTRESSED', (1, -1, -2), 1),
            ('MANAGEABLE', (1, -1, -2), 2), ('MANAGEABLE', (1, 0, -2), 3),
            ('MANAGEABLE', (1, 0, 0), 4), ('NO_EMERGENCY', (1, 0, 0), 5),
        ]:
            self.assertEqual(stress(dict(zip(('base_gap', 'downside_gap', 'severe_gap', 'funding_response'),
                                             (*gaps, response))))[0], expected)
        self.assertIsNone(stress({'base_gap':1,'downside_gap':0,'severe_gap':0,'funding_response':'FAILED'})[0])

    def test_productivity_cost_boundaries_and_scope(self):
        def attempt(a,b,scope=True,persistent=True):
            return productivity(dict(return_low=a,return_high=b,capital_cost=100,
                                     scope_reconciled=scope,persistent_productivity=persistent))[0]
        for value, point in [(-1,0),(0,1),(50,2),(100,3),(125,4),(150,5)]:
            self.assertEqual(attempt(value,value), point)
        self.assertIsNone(attempt(99,100))
        self.assertIsNone(attempt(150,160,scope=False))
        self.assertIsNone(attempt(150,160,persistent=False))

    def test_valuation_uses_base_with_dispersion_and_independent_check(self):
        common = dict(price=100,bear=50,base=140,bull=210,conservative_value=120,
                      cross_check=140,normalized_same_scope=True)
        self.assertEqual(valuation(common)[0], 7)
        self.assertIsNone(valuation(dict(common,cross_check=90))[0])
        self.assertIsNone(valuation(dict(common,normalized_same_scope=False))[0])
        self.assertEqual(valuation(dict(common,base=95,cross_check=95,conservative_value=85))[0],4)

    def test_allocation_and_esop_boundaries(self):
        base = dict(reviewed_decisions=3,follow_up=True)
        self.assertEqual(allocation(dict(base,accretive_outcomes=1,destructive_outcomes=2))[0],0)
        self.assertEqual(allocation(dict(base,accretive_outcomes=1,destructive_outcomes=1))[0],1)
        self.assertEqual(allocation(dict(base,accretive_outcomes=3,destructive_outcomes=0))[0],2)
        e = dict(all_material_events_reviewed=True,minority_protection=True)
        self.assertEqual(dilution(dict(e,event_effects=[{'id':'a','perShareEffect':'-.01'}]))[0],0)
        self.assertIsNone(dilution(dict(e,event_effects=[{'id':'a','perShareEffect':'-.009'}]))[0])
        self.assertEqual(dilution(dict(e,event_effects=[{'id':'a','perShareEffect':'0'}]))[0],1)
        with self.assertRaisesRegex(ValueError,'DUPLICATE_OR_UNNAMED_ESOP_EVENT'):
            dilution(dict(e,event_effects=[{'id':'a','perShareEffect':'0'}]*2))

    def test_real_23_rubric_reconciliation_executes_ebcs_without_promotion(self):
        args = Namespace(ticker='FPT',cutoff='2026-11-13',universe_version='vn30-20260803-reviewed-20261115',
                         packet=next(Path('docs').rglob('FPT_PUBLIC_DISCLOSURE_V2_INPUT.json')))
        first = run(args)
        self.assertEqual(first, run(args))
        self.assertEqual(len(first['v2']['rows']),23)
        self.assertEqual(sum(r['researchScore'] is not None for r in first['v2']['rows']),18)
        self.assertEqual(first['v2']['approvedEbcsCoverage']['ratedRubricCount'],3)
        self.assertEqual(sum(r['officialScore'] is not None for r in first['v2']['rows']),2)
        self.assertEqual(first['v2']['productionAuthority'],'NONE')
        for r in first['v2']['rows']:
            if r['proposal']:
                self.assertIsNone(r['proposedResearchScore'])
                self.assertTrue(r['proposal']['diagnosticReason'])
