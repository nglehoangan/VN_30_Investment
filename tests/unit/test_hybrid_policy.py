from argparse import Namespace
from pathlib import Path
from unittest import TestCase

from tools.scoring.hybrid_policy import VERSION, conservative_gap, coverage, eligibility
from tools.scoring.vn30_hybrid import run


class HybridPolicyTests(TestCase):
    def test_cutoff_approved_ebcs_replay_and_candidate_hash(self):
        args = Namespace(ticker='FPT',cutoff='2026-11-13',universe_version='vn30-20260803-reviewed-20261115',
                         packet=next(Path('docs').rglob('FPT_HYBRID_INPUT_V1.json')))
        first = run(args)
        self.assertEqual(first,run(args))
        self.assertEqual(first['coverage']['evaluated_weight'],12)
        self.assertEqual(first['coverage']['raw_scored_points'],5)
        self.assertEqual(first['coverage']['rubric_coverage'],{'evaluated':3,'total':23})
        self.assertEqual(len(first['coverage']['unrated_rubrics']),20)
        self.assertIsNone(first['coverage']['full_official_score'])
        self.assertEqual(first['gates']['ranking'],'RANKING_BLOCKED')
        self.assertEqual(first['gates']['buy'],'BUY_BLOCKED')
        self.assertFalse(first['publicationAuthorized'])

    def test_empty_denominator_and_no_zero_from_absent_data(self):
        registry = {str(i):{'maxPoints': 4 if i<22 else 12} for i in range(23)}
        rows = [{'rubricId':k,'state':'N/R','points':None} for k in registry]
        self.assertIsNone(coverage(rows,registry)['covered_score'])
        rows[0]['points'] = 0
        with self.assertRaisesRegex(ValueError,'UNRATED_POINTS_MUST_BE_NULL'):
            coverage(rows,registry)
        rows[0]['state']='VERIFIED'
        result=coverage(rows,registry)
        self.assertEqual(result['evaluated_weight'],4)
        self.assertEqual(result['covered_score'],'0')

    def test_assumption_floor_and_cross_band_hold(self):
        anchors=[{'label':'A','min':2,'max':3},{'label':'B','min':4,'max':4}]
        control=dict(factPins=['pin'],assumptions=[dict(name='x',low='0',high='1')],
                     rationale='r',sensitivity='s',counterEvidence=['counter'],
                     methodologyVersion=VERSION,caseBands=['A','A'])
        self.assertIsNone(conservative_gap({'points':2},anchors,control))
        self.assertEqual(conservative_gap({'points':3},anchors,control),'HYBRID_CONSERVATIVE_POINT_MUST_BE_BAND_FLOOR')
        control['caseBands']=['A','B']
        self.assertEqual(conservative_gap({'points':2},anchors,control),'HYBRID_CROSS_BAND_SELECTION_NOT_APPROVED')
        self.assertEqual(conservative_gap({'points':2},anchors,None),'HYBRID_CONTROLLED_ASSUMPTIONS_REQUIRED')

    def test_ranking_and_buy_are_independent_checks(self):
        result={'rubric_coverage':{'evaluated':15},'evaluated_weight':60}
        policy={'minimumRubrics':15,'minimumWeight':60,'acceptedConfidence':['HIGH']}
        args=dict(confidence='HIGH',same_sector_method=True,valuation_comparable=True,financial_risk_valid=True,
                  valuation_valid=True,pit_valid=True,methodology_approved=True,portfolio_risk_valid=True)
        self.assertEqual(eligibility(result,coverage_policy=policy,**args)['ranking'],'RANKING_ELIGIBLE')
        self.assertEqual(eligibility(result,**args)['ranking'],'RANKING_BLOCKED')
        self.assertEqual(eligibility(result,coverage_policy=policy,**args)['buy'],'BUY_BLOCKED')
        self.assertEqual(eligibility(result,coverage_policy=policy,ordinary_buy_valid=True,**args)['buy'],'BUY_ELIGIBLE')
