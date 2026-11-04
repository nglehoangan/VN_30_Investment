import importlib.util
import unittest
from copy import deepcopy
from pathlib import Path

spec=importlib.util.spec_from_file_location('a',Path(__file__).with_name('build-vn30-fy2025-analysis-acceptance.py'))
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)

class AcceptanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d=a.load(a.OUT/'decision.json')
        cls.items=a.load(a.OUT/'item-decisions.json')['items']
        cls.records=a.load(a.OUT/'record-register.json')['records']
    def test_all_30_issuers_ten_items(self):
        self.assertEqual({p['ticker'] for p in self.d['issuers']},set(a.v4.TICKERS))
        self.assertEqual(len(self.items),300)
        self.assertEqual(len({r['id'] for r in self.items}),300)
        for t in a.v4.TICKERS:self.assertEqual(sum(i['ticker']==t for i in self.items),10)
    def test_no_sustainable_or_2026_tax_gate(self):
        self.assertFalse(self.d['sustainabilityIsMandatoryGate'])
        self.assertFalse(self.d['fy2026TaxReturnIsMandatoryGate'])
        for i in self.items:
            self.assertFalse(i['sustainableProfitProofRequired']);self.assertFalse(i['fy2026TaxReturnRequired'])
    def test_scope_does_not_accept_unchecked_corpus_or_authority(self):
        for k in ['allCorpusFinancialCellsAccepted','allRubricTopicsAccepted','all30NumericAdjustedProfitPointsAccepted','sourceAdmissionGranted','productionScoringAuthorized','navAuthorized','tradingAuthorized']:
            self.assertFalse(self.d[k],k)
        for i in self.items:self.assertFalse(i['productionScoringAuthorized'])
    def test_all_pins_and_artifacts(self):
        m=a.load(a.OUT/'manifest.json')
        for p,h in {**m['inputPins'],**m['outputs']}.items():
            with self.subTest(path=p):a.v4.verify(p,h)
    def test_actual_29_points_are_analysis_not_company_facts(self):
        working={p['ticker']:p for p in a.load(a.WORK/'snapshot.json')['issuers']}
        values=[i for i in self.items if i['item']=='adjusted_earnings' and i['ticker']!='VIC']
        self.assertEqual(len(values),29)
        for i in values:
            self.assertEqual(i['acceptedValueVnd'],working[i['ticker']]['prudentialWorkingCaseVnd'])
            self.assertEqual(i['status'],'ACCEPTED_CONDITIONAL_FY2025_ANALYSIS')
            self.assertFalse(i['countsAsConfirmedCompanyFact'])
    def test_bsr_exception_does_not_block_other_items(self):
        bs={i['item']:i for i in self.items if i['ticker']=='BSR'}
        self.assertEqual(bs['reported_numerator']['status'],'ACCEPTED_PRINTED_VALUE_ARITHMETIC_EXCEPTION')
        self.assertIsNone(bs['reported_numerator']['acceptedValueVnd'])
        self.assertEqual(bs['adjusted_earnings']['status'],'ACCEPTED_CONDITIONAL_FY2025_ANALYSIS')
        self.assertTrue(any(r['ticker']=='BSR' and r['status']=='ACCEPTED_AS_PRINTED_WITH_RECONCILIATION_EXCEPTION' for r in self.records))
    def test_gvr_fund_completeness_not_promoted(self):
        g=next(i for i in self.items if i['ticker']=='GVR' and i['item']=='fund_bridge')
        self.assertIn('NOT_COMPLETE',g['status']);self.assertIsNotNone(g['remaining'])
    def test_vic_retained_decisions_and_no_invented_point(self):
        v=next(i for i in self.items if i['ticker']=='VIC' and i['item']=='adjusted_earnings')
        self.assertIsNone(v['acceptedValueVnd']);self.assertIn('NO_COMMON_POINT',v['status'])
        old=a.load(a.BASE/'2026-11-03/vic-reported-data-acceptance-v1/decision.json')['records']
        for r in old:
            found=next(x for x in self.records if x['id']=='VIC-CANONICAL:'+r['id'])
            self.assertEqual(found['status'],r['status'])
    def test_vnm_model_scope_is_standalone(self):
        v=next(i for i in self.items if i['ticker']=='VNM' and i['item']=='reported_numerator')
        self.assertEqual(v['acceptedValueVnd'],'8423414672066')
        packages=[r for r in self.records if r['ticker']=='VNM' and r['status']=='ACCEPTED_REPORTED_INPUT_PACKAGE']
        self.assertEqual(len(packages),2);self.assertTrue(all(r['scope']=='STANDALONE' for r in packages))
    def test_rubrics_topics_weights_points_and_expiry_preserved(self):
        old=a.load(a.BASE/'2026-11-02/acceptance-remediation-v1/topic-review-worklist.json')
        new=a.load(a.OUT/'rubric-topic-disposition.json')
        self.assertEqual(len(new['rubrics']),690);self.assertEqual(len(new['topics']),2490)
        for x,y in zip(old['rubrics'],new['rubrics']):
            for k,v in x.items():self.assertEqual(y[k],v)
        for index,(x,y) in enumerate(zip(old['topics'],new['topics'])):
            for k in ['id','ticker','rubricId','topic','readyForScoring','topicSpecificSufficiencyProven']:self.assertEqual(y[k],x[k])
            self.assertEqual(y['expiredObservationBindingCount'],len(x['expiredObservationBindings']))
            self.assertEqual(y['priorStatusBinding']['jsonPointer'],f'/topics/{index}')
        self.assertFalse(new['automaticAcceptanceOrScoring'])
    def test_source_identity_hash_page_guards(self):
        r=next(x for x in self.records if x['status']=='ACCEPTED_REPORTED_READING')
        args=dict(ticker=r['ticker'],period=r['economicPeriod'],scope=r['scope'],unit=r['unit'],value=r['nativeValue'],multiplier=r['multiplier'],source=r['source'],checked=True)
        for key,value,error in [('ticker','OTHER','ISSUER'),('source',{**r['source'],'sha256':'0'*64},'PIN'),('source',{**r['source'],'physicalPage':0},'PAGE')]:
            with self.subTest(key=key):
                with self.assertRaisesRegex(ValueError,error):a.assess_record(**{**args,key:value})
        with self.assertRaisesRegex(ValueError,'CROSS_ISSUER'):
            a.assess_record(**{**args,'ticker':'VNM' if r['ticker']!='VNM' else 'FPT'})
    def test_unknown_or_unreviewed_not_accepted(self):
        r=next(x for x in self.records if x['status']=='ACCEPTED_REPORTED_READING')
        args=dict(ticker=r['ticker'],period=r['economicPeriod'],scope=r['scope'],unit=r['unit'],value=r['nativeValue'],multiplier=r['multiplier'],source=r['source'],checked=True)
        self.assertEqual(a.assess_record(**{**args,'unit':'UNKNOWN'}),'PENDING_DIMENSION_REVIEW')
        self.assertEqual(a.assess_record(**{**args,'checked':False}),'PENDING_VISUAL_REVIEW')
        self.assertEqual(a.assess_record(**{**args,'period':'FY2026'}),'PENDING_DIMENSION_REVIEW')
        self.assertEqual(a.assess_record(**{**args,'unit':'USD'}),'PENDING_DIMENSION_REVIEW')
        self.assertEqual(a.assess_record(**{**args,'value':None}),'PENDING_MISSING_VALUE_OR_UNIT')
        with self.assertRaisesRegex(ValueError,'MULTIPLIER'):
            a.assess_record(**{**args,'unit':'VND','multiplier':'1000000'})
    def test_percentage_never_becomes_money(self):
        r=next(r for r in self.records if r['id']=='VJC-FY2025-reportedForeignRateSingapore')
        self.assertEqual(r['status'],'ACCEPTED_REPORTED_READING')
        self.assertIsNone(r['valueVnd']);self.assertEqual(r['normalizedFraction'],'0.17')
    def test_governance_receipt_exact_snapshot(self):
        g=a.load(a.GOV/'VN30_FY2025_FINANCIAL_ANALYSIS_ACCEPTANCE.json')
        a.v4.verify(g['snapshot']['path'],g['snapshot']['sha256'])
        self.assertFalse(g['wholeDatasetAccepted'])

if __name__=='__main__':unittest.main()
