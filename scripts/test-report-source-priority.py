import importlib.util
import pathlib
import sys
import unittest
import json

sys.path.insert(0,str(pathlib.Path(__file__).parent/'lib'))
from report_source_priority import choose


class SourcePriorityTests(unittest.TestCase):
    context={'concept':'cash','period':'2025','scope':'CONSOLIDATED','unit':'VND'}

    def row(self,value,status='VALUE',**extra):
        return {**self.context,'value':value,'status':status,**extra}

    def test_pdf_zero_is_available_and_wins_over_provider(self):
        r=choose([self.row('0','ZERO')],[self.row('99')],self.context)
        self.assertEqual((r['source'],r['value']),('PDF_REPORTED','0'))
        self.assertIn('PDF_CAFEF_VALUE_DIFFERENCE',r['reviewReasons'])

    def test_pdf_missing_dash_and_invalid_ocr_allow_reference_only(self):
        for value,status in [(None,'MISSING_CELL'),(None,'DASH'),('12?34','VALUE')]:
            r=choose([self.row(value,status)],[self.row('0','ZERO',unit=None,scope=None)],self.context)
            self.assertEqual((r['source'],r['value']),('CAFEF_REFERENCE','0'))
            self.assertTrue(r['needsReview'])
            self.assertFalse(r['productionAdmissible'])

    def test_same_concept_period_and_known_dimensions_required(self):
        for dimension,value in [('concept','assets'),('period','2024'),('scope','STANDALONE'),('unit','USD')]:
            r=choose([],[self.row('1',**{dimension:value})],self.context)
            self.assertEqual(r['source'],'MISSING')
        r=choose([],[self.row('1',period=None)],self.context)
        self.assertEqual(r['source'],'MISSING')

    def test_conflicting_pdf_is_not_resolved_using_provider(self):
        r=choose([self.row('1'),self.row('2')],[self.row('2')],self.context)
        self.assertEqual(r['source'],'UNRESOLVED_PDF_CONFLICT')
        self.assertIsNone(r['value'])

    def test_reported_pdf_precedes_aggregate_and_formula_must_match(self):
        aggregate=self.row('3',kind='EXPLICIT_DISPLAY_AGGREGATE',formula='a+b',operands=[self.row('1'),self.row('2')])
        r=choose([aggregate,self.row('3')],[],self.context)
        self.assertEqual(r['source'],'PDF_REPORTED')
        r=choose([aggregate],[],self.context)
        self.assertEqual(r['source'],'PDF_EXPLICIT_AGGREGATE')
        aggregate['operands'][0]['period']='2024'
        r=choose([aggregate],[self.row('3')],self.context)
        self.assertEqual(r['source'],'CAFEF_REFERENCE')
        aggregate['operands'][0]['period']='2025'
        aggregate['value']='4'
        r=choose([aggregate],[self.row('3')],self.context)
        self.assertEqual(r['source'],'CAFEF_REFERENCE')

    def test_unavailable_sources_remain_missing_not_zero(self):
        r=choose([self.row(None,'NULL')],[self.row(None,'NULL')],self.context)
        self.assertEqual(r['source'],'MISSING')
        self.assertIsNone(r['value'])

    def test_provider_reference_conflict_not_latest_wins(self):
        r=choose([],[self.row('1'),self.row('2')],self.context)
        self.assertEqual(r['source'],'UNRESOLVED_CAFEF_REFERENCE_CONFLICT')
        self.assertIsNone(r['value'])

    def test_actual_vnm_selection_and_review_queue(self):
        root=pathlib.Path(__file__).resolve().parents[1]
        base=root/'data/comparisons/VNM/FY2025'
        selected=json.loads((base/'selected-pdf-first.json').read_text())
        review=json.loads((base/'review-pdf-first.json').read_text())
        rows=[r for report in selected['reports'].values() for r in report['2025'].values()]
        self.assertEqual(len(rows),191)
        refs=[r for r in rows if r['source']=='CAFEF_REFERENCE']
        self.assertEqual(len(refs),60)
        self.assertEqual(sum(r['value'] not in [None,'0'] for r in refs),0)
        self.assertTrue(all(r['needsReview'] and r['reviewDecision']=='PENDING' for r in refs))
        conflicts=[r for r in rows if 'PDF_CAFEF_VALUE_DIFFERENCE' in r['reviewReasons']]
        self.assertEqual(len(conflicts),26)
        self.assertTrue(all(r['source']=='PDF_REPORTED' and r['value']==r['pdfValue'] for r in conflicts))
        self.assertEqual(len(review['items']),88)
        self.assertEqual(len({r['reviewId'] for r in review['items']}),88)
        excluded=[r for r in review['excluded'] if r['reason']=='USER_EXCLUDED_POSSIBLE_ROW_SHIFT_DUPLICATE']
        self.assertEqual(len(excluded),8)
        self.assertTrue(all(r['matchingPdfRows'] and r['cafefValue']!='0' for r in excluded))
        active={(r['report'],r['key']) for r in rows}
        self.assertTrue(all((r['report'],r['key']) not in active for r in excluded))
        self.assertEqual(sum(r['source']=='PDF_REPORTED' for r in rows),129)


if __name__=='__main__':
    unittest.main()
