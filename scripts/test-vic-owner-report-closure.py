"""Actual owner PDF/VIC native-source reconciliation and adversarial research tests."""
import copy
import hashlib
import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch
from lib.vic_owner_report import license_claims,donor_bridge,tax_gap,closing_common,replay_eps,segment_bridge,require_price_date
s=importlib.util.spec_from_file_location('owner_builder',Path(__file__).with_name('build-vic-owner-report-closure.py'))
b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
class OwnerCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.r=b.checked();cls.d=b.load(b.OUT/'decision.json')
    def v(self,id):return copy.deepcopy(self.r[id]['values'])
    def test_owner_source_identity_and_unknown_metadata(self):
        r=b.load(b.OUT/'source-receipt.json')
        self.assertEqual(r['sha256'],'647cc27b18f5ecba93159b290b5d85e6a57d76eece6209b11215ede202a33918')
        self.assertIsNone(r['originalPublisherPublicationAt']);self.assertIsNone(r['exactOwnerReceiptTimestamp'])
        self.assertEqual(r['pageCount'],71);self.assertFalse(r['productionAdmission'])
    def test_all_checked_sources_replay_immutable_bytes(self):
        self.assertEqual(len(self.r),20)
        for r in self.r.values():
            self.assertEqual(b.sha(b.ROOT/r['source']['pdfPath']),r['source']['sha256'])
            self.assertTrue(r['review']['fullPageImageInspected'])
    def test_claims_offset_and_cash_both_reconcile(self):
        x=license_claims(self.v('VF25-SETTLEMENT'))
        self.assertEqual(x['netCashReceiptMillionVnd'],'701402')
        for key in ['offsetIsCash','licenseIsFullCurrentPnlExpense','receivableIsDisposalGain','closingPayableInferredZero']:self.assertFalse(x[key])
    def test_duplicate_cash_offset_blocks(self):
        for key in ['licenseCashPayment','demergerCashReceipt']:
            v=self.v('VF25-SETTLEMENT');v[key]=str(int(v[key])+int(v['offset']))
            with self.assertRaises(ValueError):license_claims(v)
    def test_full_fee_cannot_replace_cash_payment(self):
        v=self.v('VF25-SETTLEMENT');v['licenseCashPayment']=v['licensePayable']
        with self.assertRaises(ValueError):license_claims(v)
    def test_grant_subcomponents_and_unallocated_residual(self):
        x=donor_bridge('23000173','23000000','173','23054157')
        self.assertEqual(x['groupCaptionLessJscMillionVnd'],'53984')
        self.assertEqual(x['groupCaptionLessChairmanMillionVnd'],'54157')
        self.assertFalse(x['residualRecipientProven']);self.assertFalse(x['otherRelatedPartyAutomaticallyEliminated'])
    def test_amount_equality_does_not_change_recipient(self):
        with self.assertRaises(ValueError):donor_bridge('23054157','23000000','173','23054157')
    def test_tax_dash_not_tax_exemption_or_marginal_credit(self):
        x=tax_gap('-53721704','-53721704','DASH')
        self.assertEqual(x['reportedPbtMinusNpatMillionVnd'],'0')
        for key in ['currentTaxNumeric','eventCurrentTaxVnd','eventDeferredTaxVnd']:self.assertIsNone(x[key])
        self.assertFalse(x['donationTaxExemptionProven']);self.assertFalse(x['marginalTaxCreditProven'])
    def test_tax_raw_not_automatically_zero(self):
        with self.assertRaises(ValueError):tax_gap('-53721704','-53721704','0')
    def test_jsc_shares_and_vic_shares_are_distinct(self):
        v=self.v('VF25-SHARES')
        self.assertEqual(int(v['ordinary'])+int(v['preferred']),int(v['total']))
        self.assertNotEqual(v['ordinary'],self.d['shareAndEps']['externalCommonShares'])
    def test_external_vic_shares_exclude_subsidiary_holdings(self):
        self.assertEqual(closing_common(self.v('VIC25-SHARES')),'7498740060')
    def test_share_sum_and_negative_treasury_guard(self):
        for key,value in [('preferred','0'),('commonHeldBySubsidiaries','-1'),('allIssued','7733491896.1')]:
            v=self.v('VIC25-SHARES');v[key]=value
            with self.assertRaises(ValueError):closing_common(v)
    def test_historical_eps_replay(self):
        x=replay_eps(self.v('VIC25-EPS'))
        self.assertEqual(x['replayedBasicEpsVnd'],'1432');self.assertEqual(x['replayedDilutedEpsVnd'],'1421')
        self.assertFalse(x['normalizedEpsAccepted']);self.assertFalse(x['historicalDilutionAutomaticallyValidForNormalizedLoss'])
    def test_closing_shares_cannot_replace_weighted_eps_denominator(self):
        v=self.v('VIC25-EPS');v['basicWeightedShares']='7498740060'
        with self.assertRaises(ValueError):replay_eps(v)
    def test_restricted_profit_not_deducted_twice(self):
        v=self.v('VIC25-EPS');v['basicNumeratorMillion']=str(int(v['basicNumeratorMillion'])-int(v['restrictedIncomeMillion']))
        with self.assertRaises(ValueError):replay_eps(v)
    def test_date_bound_share_anchor(self):
        self.assertTrue(require_price_date('2025-12-31','2025-12-31'))
        for price in ['2026-10-29','2025-12-30',None,'20251231']:
            with self.assertRaises((ValueError,TypeError)):require_price_date('2025-12-31',price)
    def test_segment_sum_and_central_income(self):
        x=segment_bridge(self.v('VIC25-SEGMENTS'))
        self.assertEqual(x['groupPbtMillionVnd'],'26437375')
        self.assertFalse(x['jscLossAdditionalDeductionPermitted']);self.assertFalse(x['capexMaintenanceSplitProven'])
    def test_jsc_loss_not_additional_segment_charge(self):
        v=self.v('VIC25-SEGMENTS');v['manufacturingPbt']=str(int(v['manufacturingPbt'])-53721704)
        with self.assertRaises(ValueError):segment_bridge(v)
    def test_h126_claims_differ_from_annual(self):
        self.assertEqual(self.d['h126CommonClaims']['basicNumeratorMillionVnd'],'14790390')
        self.assertFalse(self.d['h126CommonClaims']['annualizedOrBackdated'])
        self.assertFalse(self.d['h126CommonClaims']['claimsAssignedToVinFast'])
    def test_actual_events_still_blocked_without_vas_tax_and_attribution(self):
        for x in self.d['actualEventProposals']:
            self.assertFalse(x['validation']['eventEvidenceComplete'])
        n=next(x for x in self.d['actualEventProposals'] if 'NOVATECH' in x['proposal']['eventId'])
        self.assertEqual(n['proposal']['legalEntity'],'VINFAST_AUTO_LTD_SINGAPORE')
        self.assertIsNone(n['proposal']['economicDate'])
        self.assertIsNone(n['proposal']['afterTaxParentVnd'])
    def test_new_pdf_not_automatic_financial_acceptance(self):
        for key in ['selectedAcceptedNormalizedCommonEarningsVnd','selectedAcceptedEps']:self.assertIsNone(self.d[key])
        for key in ['productionAuthorized','navAuthorized','tradingAuthorized','criteriaOrWeightsChanged','ledgerPostingExecuted']:self.assertFalse(self.d[key])
        self.assertTrue(self.d['ownerDocumentRequestPending'])
    def test_legal_entity_scope_and_period_binding(self):
        original=b.load
        for key,value in [('scope','VIC_CONSOLIDATED'),('period','H1_2025')]:
            def fake(path):
                x=original(path)
                if path.name=='checked-evidence.json':x['rows'][0][key]=value
                return x
            with patch.object(b,'load',side_effect=fake),self.assertRaises(ValueError):b.checked()
    def test_bad_source_hash_blocks(self):
        original=b.load
        def fake(path):
            x=original(path)
            if path.name=='checked-evidence.json':x['rows'][0]['source']['sha256']='0'*64
            return x
        with patch.object(b,'load',side_effect=fake),self.assertRaises(ValueError):b.checked()
    def test_source_unit_mismatch_blocks(self):
        original=b.load
        def fake(path):
            x=original(path)
            if path.name=='checked-evidence.json':
                next(r for r in x['rows'] if r['id']=='VF25-PNL')['unit']='BILLION_VND'
            return x
        with patch.object(b,'load',side_effect=fake),self.assertRaisesRegex(ValueError,'UNIT'):b.checked()
    def test_old_single_weight_not_admitted_as_base(self):
        self.assertEqual(self.d['priorSharedJscWeightScenariosStatus'],'HISTORICAL_STRESS_ONLY_NOT_VALID_ENTITY_MATCHED_BASE')
        self.assertFalse(self.d['sensitivityIsCompleteFinancialBound'])
if __name__=='__main__':unittest.main()
