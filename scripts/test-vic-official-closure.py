"""VIC actual blocked proposals and event-specific research boundary tests."""
import copy
import json
import unittest
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace
from lib.vic_event_admission import TARGET, validate_event
from lib.vic_official_source_policy import require_official_vic_url, download
OUT=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-03/vic-official-closure-v1')

class Admission(unittest.TestCase):
    def fixture(self):
        # Synthetic complete evidence, not an actual financial posting proposal.
        r=dict(TARGET,eventId='VIC-SPONSOR-FY2025',legalEntity='SYNTHETIC_ENTITY',economicDate='2025-09-15',pretaxVnd='100',currentTaxExpenseVnd='10',deferredTaxExpenseVnd='5',afterTaxParentVnd='40',afterTaxNciVnd='45',bindings={})
        evidence={}
        for role in ('pretax','currentTax','deferredTax','parentNci'):
            r['bindings'][role]=role
            evidence[role]=dict(r,role=role,measurement='EVENT_PNL',integrity='VERIFIED_ORIGINAL',locator='synthetic/page/1')
        return r,evidence

    def test_synthetic_complete_is_research_only(self):
        r,e=self.fixture();v=validate_event(r,e)
        self.assertTrue(v['eventEvidenceComplete'])
        for k in ('financialAcceptanceGranted','productionAuthorityGranted','navAuthorityGranted','tradingAuthorityGranted'):self.assertFalse(v[k])

    def test_each_missing_tax_or_allocation_blocks(self):
        for key in ('currentTaxExpenseVnd','deferredTaxExpenseVnd','afterTaxParentVnd','afterTaxNciVnd'):
            with self.subTest(key=key):
                r,e=self.fixture();r[key]=None
                self.assertFalse(validate_event(r,e)['eventEvidenceComplete'])

    def test_tax_recon_cash_and_equity_cannot_be_event_pnl(self):
        for measure in ('TAX_RECONCILIATION','CASH_PAID','NCI_EQUITY_MOVEMENT','GROSS_DTA','CLOSING_OWNERSHIP'):
            r,e=self.fixture();e['currentTax']['measurement']=measure
            self.assertFalse(validate_event(r,e)['eventEvidenceComplete'])

    def test_all_binding_dimensions_checked(self):
        for key in (*TARGET,'eventId','legalEntity','economicDate','role','locator','integrity','currentTaxExpenseVnd'):
            r,e=self.fixture();e['currentTax'][key]='WRONG'
            if key=='locator':e['currentTax'][key]=None
            self.assertFalse(validate_event(r,e)['eventEvidenceComplete'],key)

    def test_wrong_framework_period_scope_currency_blocks(self):
        for key in TARGET:
            r,e=self.fixture();r[key]='WRONG'
            self.assertFalse(validate_event(r,e)['eventEvidenceComplete'])

    def test_no_original_claim_for_web_reading(self):
        r,e=self.fixture();e['currentTax']['integrity']='WEB_TOOL_DERIVED_FACT_READING'
        self.assertFalse(validate_event(r,e)['eventEvidenceComplete'])

    def test_unsupported_dates_block_even_with_matching_source(self):
        for day in ('2026-01-01','2025-02-30','20250915',None):
            r,e=self.fixture();r['economicDate']=day
            for source in e.values():source['economicDate']=day
            self.assertFalse(validate_event(r,e)['eventEvidenceComplete'])

    def test_identity_and_nonfinite_guard(self):
        for value in ('46','NaN','Infinity'):
            r,e=self.fixture();r['afterTaxNciVnd']=value;e['parentNci']['afterTaxNciVnd']=value
            self.assertFalse(validate_event(r,e)['eventEvidenceComplete'])

    def test_actual_proposals_remain_blocked(self):
        d=json.loads((OUT/'decision.json').read_text())
        self.assertEqual(len(d['events']),2)
        for x in d['events']:
            self.assertEqual(validate_event(x['proposal'],{}),x['validation'])
            self.assertFalse(x['validation']['eventEvidenceComplete'])
        self.assertIsNone(d['selectedAcceptedNormalizedCommonEarningsVnd'])
        self.assertIsNone(d['selectedAcceptedEps'])

    def test_actual_amount_precision_and_tax_identity(self):
        a=json.loads((OUT/'arithmetic-checks.json').read_text())
        self.assertTrue(a['taxIdentityPass']);self.assertEqual(a['feeMinusRoundedDisplayVnd'],'75650')
        self.assertFalse(a['differenceIsAdditionalExpense'])

    def test_research_authorization_not_production(self):
        a=json.loads((OUT/'owner-source-authorization.json').read_text())
        self.assertEqual(a['ownerAnswer'],'Cho phép thêm VinFast IR và SEC EDGAR')
        self.assertFalse(a['productionSourceAuthorityGranted'])

class Policy(unittest.TestCase):
    def test_allowed(self):
        for u in ('https://www.sec.gov/Archives/edgar/data/1913510/file.htm','https://vinfastauto.us/investor-relations'):
            self.assertEqual(require_official_vic_url(u),u)

    def test_other_issuer_credentials_hosts_and_traversal_block(self):
        for u in ('http://www.sec.gov/Archives/edgar/data/1913510/x','https://www.sec.gov/Archives/edgar/data/1/x','https://sec.gov/Archives/edgar/data/1913510/../1/x','https://sec.gov/Archives/edgar/data/1913510/%2e%2e/1/x','https://www.sec.gov.evil.test/Archives/edgar/data/1913510/x','https://user:pw@vinfastauto.com/x','https://vinfastauto.com:444/x','https://vinfastauto.com/x#fragment'):
            with self.subTest(u=u),self.assertRaises(ValueError):require_official_vic_url(u)

    def test_redirect_rejected_before_request(self):
        with patch('lib.vic_official_source_policy.subprocess.run',return_value=SimpleNamespace(stdout='302\nhttps://evil.test/x',stderr='',returncode=0)) as run:
            with self.assertRaises(ValueError):download('https://vinfastauto.com/x','/tmp/not-written')
            self.assertEqual(run.call_count,1)

    def test_403_is_failure_not_source(self):
        m=json.loads((OUT/'acquisition-manifest.json').read_text())
        self.assertEqual(len(m['rows']),5)
        self.assertTrue(all(r['httpStatus']=='403' and not r['sourceAcceptedForProduction'] for r in m['rows']))

if __name__=='__main__':unittest.main()
