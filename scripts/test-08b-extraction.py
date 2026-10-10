"""Boundary regressions for independent cell reconciliation; no real facts admitted."""
import runpy,unittest
R=runpy.run_path('scripts/reconcile-08b-extraction.py')
class ExtractionBoundaryTests(unittest.TestCase):
 def test_grouped_integer_requires_one_separator_and_exact_digits(self):
  self.assertEqual(R['numeric_value']('9.007.199.254.740.993'),'9007199254740993')
  self.assertEqual(R['numeric_value']('(1,234,567)'),'-1234567')
  self.assertEqual(R['numeric_value']('0'),'0')
  for value in ['5.047,128.933.102','1e6','1.23.456','-','NaN','1.5']:
   self.assertIsNone(R['numeric_value'](value))
 def test_exact_caption_no_fuzzy_or_parent_common_substitution(self):
  def row(s):return {'text':s,'words':[{'text':s,'x':0.1}]}
  self.assertEqual(R['identify'](row('TOTAL EQUITY'))[0],'TOTAL_EQUITY')
  self.assertEqual(R['identify'](row('Profit attributable to owners of the parent'))[0],'NET_INCOME_ATTRIBUTABLE_PARENT')
  self.assertIsNone(R['identify'](row('COMMON EQUITY')))
  self.assertIsNone(R['identify'](row('estimated net revenue')))
  self.assertIsNone(R['identify'](row('net revenue forecast')))
 def test_gross_bank_loans_not_net_aggregate(self):
  def row(s):return {'text':s,'words':[{'text':s,'x':0.1}]}
  self.assertIsNone(R['identify'](row('Cho vay khach hang')))
  self.assertEqual(R['identify'](row('1 Cho vay khach hang'))[0],'BANK_GROSS_CUSTOMER_LOANS')
 def test_current_quarter_and_ytd_are_distinct(self):
  self.assertEqual(R['get_period']('Bao cao quy II tai ngay 30/06/2026')['start'],'2026-04-01')
  self.assertEqual(R['get_period']('Bao cao sau thang tai ngay 30/06/2026')['start'],'2026-01-01')
  self.assertIsNone(R['get_period']('Tai ngay 30/06/2026'))
  self.assertIsNone(R['get_period']('BCTC_q2_2026.pdf'))
 def test_page_window_not_inherited_from_ytd_cover(self):
  period=R['get_period']('Sau thang 30/06/2026')
  self.assertEqual(R['flow_window']('Quy II 2026',period)['start'],'2026-04-01')
  self.assertIsNone(R['flow_window']('Quy II 2026 va luy ke',period))
  self.assertEqual(R['flow_window']('Quy II 2026 va luy ke',period,True)['start'],'2026-01-01')
  self.assertIsNone(R['flow_window']('Nam 2026',period))
 def test_explicit_unit_scale_not_numbers_inside_statement(self):
  self.assertEqual(R['explicit_unit_text']('Đơn vị tính: triệu đồng'),'MILLION_CURRENCY')
  self.assertEqual(R['explicit_unit_text']('Unit: VND billion'),'BILLION_CURRENCY')
  self.assertEqual(R['explicit_unit_text']('Đơn vị: 1.000 đồng'),'THOUSAND_CURRENCY')
  self.assertEqual(R['explicit_unit_text']('VND VND'),'CURRENCY')
  self.assertIsNone(R['explicit_unit_text']('The bank earned VND 1000 million'))
  self.assertIsNone(R['explicit_unit_text']('Unit: VND million billion'))
  self.assertIsNone(R['explicit_unit_text']('Unit: USD / VND'))
 def test_stock_date_order_proves_column_not_a_narrative_date(self):
  def words(texts):return [{'text':t,'x':0.55+i*0.17,'y':0.2,'width':0.12,'height':0.02} for i,t in enumerate(texts)]
  header=R['lines'](words(['30/06/2026','31/12/2025']))
  self.assertEqual(R['stock_date_columns'](header,0.6,'2026-06-30')['dates'],['2026-06-30','2025-12-31'])
  self.assertIsNone(R['stock_date_columns'](R['lines'](words(['30/06/2026'])),0.6,'2026-06-30'))
  self.assertIsNone(R['stock_date_columns'](R['lines'](words(['Current 30/06/2026','previous 31/12/2025'])),0.6,'2026-06-30'))
if __name__=='__main__':unittest.main()
