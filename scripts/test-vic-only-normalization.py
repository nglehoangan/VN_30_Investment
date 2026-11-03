import copy
import importlib.util
import unittest
from pathlib import Path
s=importlib.util.spec_from_file_location('builder',Path(__file__).with_name('build-vic-only-normalization.py'))
b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
class VicOnly(unittest.TestCase):
    def setUp(self):
        self.d=b.load(b.PRIOR/'decision.json');self.r=b.load(b.PRIOR/'checked-evidence.json')
    def test_actual_pretax_no_tax_or_nci_guess(self):
        x=b.calculate(self.d,self.r)
        self.assertEqual(x['primaryDiagnostic']['valueVnd'],'-31011782000000')
        self.assertEqual(x['additionalMovianExclusionDiagnosticVnd'],'-32776782000000')
        self.assertIsNone(x['selectedAcceptedNormalizedCommonEarningsVnd'])
        self.assertIsNone(x['selectedAcceptedEps'])
    def test_owner_scope_and_authority(self):
        x=b.calculate(self.d,self.r)
        for k in ['ownerEvidenceRequestPending','requiresNewVinFastReportToRunThisRoute','externalFindingsUsedInCalculation','productionScoringAuthorized','navAuthorized','tradingAuthorized','ledgerPostingExecuted','criteriaOrWeightsChanged']:
            self.assertFalse(x[k],k)
        self.assertFalse(x['primaryDiagnostic']['completeRecurringProfit'])
    def test_cash_proceeds_not_gain(self):
        self.d['components'][1]['amountVnd']='39828000000000'
        with self.assertRaisesRegex(ValueError,'SOURCE_VALUE'):b.calculate(self.d,self.r)
    def test_no_missing_or_duplicate_components(self):
        for cs in [self.d['components'][:1],self.d['components']+[self.d['components'][0]]]:
            d=copy.deepcopy(self.d);d['components']=cs
            with self.assertRaises(ValueError):b.calculate(d,self.r)
    def test_wrong_period_scope_and_source_block(self):
        for k,v in [('economicPeriod','H1_2025'),('sourceScope','STANDALONE'),('ticker','VFS')]:
            r=copy.deepcopy(self.r);r['rows'][0][k]=v
            with self.assertRaises(ValueError):b.calculate(self.d,r)
    def test_wrong_hash_blocks(self):
        self.r['rows'][0]['source']['sha256']='0'*64
        with self.assertRaises(ValueError):b.calculate(self.d,self.r)
    def test_sensitivity_not_base_or_acceptance(self):
        x=b.calculate(self.d,self.r)
        self.assertFalse(x['parentCommonSensitivityIsBaseEstimate'])
        self.assertTrue(all(not a['financiallyAccepted'] for a in x['parentCommonSensitivity']))
        self.assertFalse(x['remainingDisposalGainIsProvenRecurring'])
if __name__=='__main__':unittest.main()
