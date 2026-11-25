from argparse import Namespace
from pathlib import Path
from unittest import TestCase

from tools.scoring.public_disclosure_v3 import evaluate_structural, resilience
from tools.scoring.vn30_structural_disclosure import run


class StructuralDisclosureTests(TestCase):
    def test_real_fpt_matches_in_both_lanes_without_promotion(self):
        args = Namespace(ticker='FPT', cutoff='2026-11-13', universe_version='vn30-20260803-reviewed-20261115',
                         lane='research', packet=next(Path('docs').rglob('FPT_PUBLIC_DISCLOSURE_V3_INPUT.json')))
        research = run(args)
        args.lane = 'ebcs-replay'
        ebcs = run(args)
        self.assertEqual(research['proposed'], ebcs['proposed'])
        self.assertEqual(research['inputHash'], ebcs['inputHash'])
        self.assertEqual(ebcs['approvedEbcsCoverage']['ratedRubricCount'], 3)
        self.assertEqual(len(ebcs['rows']), 23)
        self.assertEqual(research['proposed']['FH-STRESS']['score'], 2)
        self.assertIn('REFINANCING_CAPACITY_UNVERIFIED', research['proposed']['FH-STRESS']['separateRiskWarnings'])
        self.assertEqual(research['proposed']['CA-REINV']['score'], 1)
        self.assertTrue(all(research['proposed'][rid]['score'] is None
                            for rid in ('GQ-INC', 'VAL-PRIMARY', 'CA-DIL')))
        self.assertEqual(ebcs['productionAuthority'], 'NONE')

    def test_stress_negative_counterevidence_and_cash_only_bounds(self):
        values = dict(cash=1, debt=3, total_debt=4, equity_at_close=8, current_assets=5, current_liabilities=4,
                      ebit_at_close=2, interest_expense=1, cfo={str(y):3 for y in range(2023,2026)},
                      capex={str(y):1 for y in range(2023,2026)}, latest_cfo=1, latest_capex=1)
        self.assertEqual(resilience(values)[0], 3)
        self.assertEqual(resilience(dict(values,latest_capex=2))[0], 2)
        self.assertEqual(resilience(dict(values,latest_cfo=-1))[0], 1)
        self.assertEqual(resilience(dict(values,latest_cfo=-1,equity_at_close=-1,ebit_at_close=0))[0], 0)
        self.assertEqual(resilience(dict(values,cash=100))[0], 4)

    def test_missing_and_bank_sector_are_explicit(self):
        self.assertEqual(evaluate_structural('FH-STRESS', [], 'RETAIL', {}, {})['reason'],
                         'PUBLIC_COMPOSITE_INPUT_MISSING')
        self.assertEqual(evaluate_structural('FH-STRESS', [], 'BANK', {}, {})['reason'],
                         'PUBLIC_FINANCIAL_SECTOR_EQUIVALENT_NOT_APPROVED')
