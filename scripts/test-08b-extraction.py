"""Boundary regressions for independent cell reconciliation; no real facts admitted."""
import runpy,unittest
R=runpy.run_path('scripts/reconcile-08b-extraction.py')
class ExtractionBoundaryTests(unittest.TestCase):
 def test_vcb_current_bank_basis_requires_complete_positive_clause(self):
  check=R['affirmative_vas_preparation']
  heading='Cơ sở lập báo cáo tài chính. '
  clause='Báo cáo tài chính hợp nhất, trình bày bằng Đồng Việt Nam (VND), được làm tròn đến hàng triệu gần nhất, được lập theo các Chuẩn mực Kế toán Việt Nam, Chế độ Kế toán Việt Nam áp dụng cho các Tổ chức tín dụng'
  self.assertTrue(check(heading+clause))
  for variant in [clause.replace('hợp nhất, trình','hợp nhất, được trình'),clause.replace('hợp nhất, trình','hợp nhất giữa niên độ, được trình'),clause.replace('hợp nhất, trình','hợp nhất giữa niên độ, được trình').replace('Đồng Việt','Đồng, Việt')]:
   self.assertTrue(check(heading+variant))
   for old,new in [('được lập','không được lập'),('được lập','sẽ được lập'),('hợp nhất','riêng'),('Chuẩn mực Kế toán Việt Nam','IFRS')]:self.assertFalse(check(heading+variant.replace(old,new)))
  self.assertFalse(check(clause))
  for old,new in [('được lập','không được lập'),('được lập','sẽ được lập'),('hợp nhất','riêng'),('Chuẩn mực Kế toán Việt Nam','IFRS')]:
   self.assertFalse(check(heading+clause.replace(old,new)))

 def test_current_compliance_declarations_reject_negation_future_and_citations(self):
  check=R['affirmative_vas_preparation']
  samples=[
   ('Cơ sở lập báo cáo tài chính hợp nhất giữa niên độ. ','Báo cáo tài chính hợp nhất giữa niên độ kèm theo được trình bày bằng Đồng Việt Nam (VND), theo nguyên tắc giá gốc và phù hợp chuẩn mực kế toán, chế độ kế toán doanh nghiệp Việt Nam'),
   ('Tuyên bố về tuân thủ. ','Báo cáo tài chính quý hợp nhất được lập theo các Chuẩn mực Kế toán Việt Nam, Chế độ kế toán doanh nghiệp Việt Nam'),
   ('Tuyên bố về tuân thủ. ','Báo cáo tài chính hợp nhất giữa niên độ này được lập theo các Chuẩn mực Kế toán Việt Nam, Chế độ kế toán doanh nghiệp Việt Nam'),
   ('Cơ sở của việc lập báo cáo tài chính hợp nhất. ','Báo cáo tài chính hợp nhất đã được lập theo các Chuẩn mực Kế toán Việt Nam'),
   ('Tuyên bố về tuân thủ. ','Báo cáo tài chính hợp nhất này được lập theo các Chuẩn mực Kế toán Việt Nam, Chế độ Kế toán Doanh nghiệp Việt Nam'),
   ('Tuyên bố tuân thủ. ','Báo cáo tài chính hợp nhất giữa niên độ được lập theo các Chuẩn mực Kế toán Việt Nam, Chế độ Kế toán Việt Nam áp dụng cho các Tổ chức tín dụng'),
   ('Tuyên bố tuân thủ. ','Ban Tổng Giám đốc Ngân hàng khẳng định báo cáo tài chính hợp nhất đính kèm được lập phù hợp với các Chuẩn mực kế toán Việt Nam, Hệ thống kế toán các tổ chức tín dụng Việt Nam'),
   ('STATEMENT ON COMPLIANCE WITH VIETNAMESE ACCOUNTING STANDARDS AND SYSTEMS. ','Management confirms that the Company has complied with Vietnamese Accounting Standards and Vietnamese Enterprise Accounting Systems'),
  ]
  for heading,clause in samples:
   self.assertTrue(check(heading+clause))
   self.assertFalse(check(clause))
   for old,new in [('được lập','không được lập'),('được lập','sẽ được lập'),('được trình bày','không được trình bày'),('được trình bày','sẽ được trình bày'),('has complied','has not complied'),('has complied','will comply')]:
    if old in clause:self.assertFalse(check(heading+clause.replace(old,new)))
  self.assertFalse(check('Tuyên bố tuân thủ. Chuẩn mực Kế toán Việt Nam số 11.'))

 def test_december_document_cannot_label_literal_quarter_column_annual(self):
  period={'start':'2025-01-01','end':'2025-12-31','type':'ANNUAL','fiscalYear':2025,'fiscalQuarter':None}
  for month in ['4','7','10']:
   self.assertIsNone(R['flow_window'](f'Từ 1/{month}/2025 đến 31/12/2025 Từ 1/1/2025 đến 31/12/2025',period))
  self.assertEqual(R['flow_window']('Năm kết thúc ngày 31 tháng 12 năm 2025; 2025 VND 2024 VND',period),period)

 def test_corrupt_caption_cannot_alias_payables_code_to_liabilities(self):
  def row(code):return {'text':f'Nợ ngắn hạn {code} 21.183.376.049.432','words':[{'text':'Nợ ngắn hạn','x':.13},{'text':code,'x':.46},{'text':'21.183.376.049.432','x':.62}]}
  self.assertIsNone(R['identify'](row('311')))
  self.assertEqual(R['identify'](row('310'))[0],'CURRENT_LIABILITIES')

 def test_notes_require_a_positive_current_preparation_assertion(self):
  check=R['affirmative_vas_preparation']
  statement='Việc lập báo cáo tài chính giữa niên độ tuân thủ theo các chuẩn mực kế toán Việt Nam'
  self.assertTrue(check(statement))
  self.assertTrue(check('Cơ sở lập báo cáo tài chính. Báo cáo đã được lập theo các chuẩn mực kế toán Việt Nam'))
  self.assertFalse(check('Các chuẩn mực kế toán Việt Nam'))
  self.assertFalse(check(statement.replace('tuân thủ','không tuân thủ')))
  self.assertFalse(check(statement.replace('tuân thủ','sẽ tuân thủ')))
 def test_bank_interim_basis_requires_actual_preparation_and_exact_framework(self):
  check=R['affirmative_vas_preparation']
  heading='Cơ sở lập báo cáo tài chính hợp nhất giữa niên độ. '
  declaration='Báo cáo tài chính hợp nhất giữa niên độ kèm theo được trình bày bằng Đồng Việt Nam (VND), theo nguyên tắc giá gốc và phù hợp với chuẩn mực kế toán, chế độ kế toán áp dụng cho các tổ chức tín dụng tại Việt Nam'
  self.assertTrue(check(heading+declaration))
  self.assertFalse(check(declaration))
  self.assertFalse(check(heading+declaration.replace('phù hợp với','không phù hợp với')))
  self.assertFalse(check(heading+declaration.replace('được trình bày','sẽ được trình bày')))
  self.assertFalse(check(heading+declaration.replace('chuẩn mực kế toán, chế độ kế toán áp dụng cho các tổ chức tín dụng tại Việt Nam','IFRS')))

 def test_actual_consolidated_audit_declaration_requires_issuer_and_performed_audit(self):
  check=R['affirmative_consolidated_audit']
  declaration='Báo cáo kiểm toán. Chúng tôi đã kiểm toán báo cáo tài chính hợp nhất đính kèm của Công ty Cổ phần Tập đoàn Hòa Phát và các công ty con. Trách nhiệm của Ban Giám đốc. Trách nhiệm của kiểm toán viên. Chúng tôi tin rằng các bằng chứng kiểm toán mà chúng tôi thu được là đầy đủ và thích hợp.'
  self.assertTrue(check(declaration,['hoaphat']))
  self.assertFalse(check(declaration,['vietjet']))
  self.assertFalse(check(declaration,['hoa']))
  self.assertFalse(check(declaration.replace('đã kiểm toán','sẽ kiểm toán'),['hoaphat']))
  self.assertFalse(check(declaration.replace('đã kiểm toán','không kiểm toán'),['hoaphat']))
  self.assertFalse(check(declaration.replace('hợp nhất','riêng'),['hoaphat']))
  self.assertFalse(check('Báo cáo kiểm toán Hòa Phát',['hoaphat']))

 def test_enterprise_basis_requires_positive_actual_framework_declaration(self):
  check=R['affirmative_vas_preparation']
  for suffix in ['', ' giữa niên độ']:
   heading='Cơ sở lập báo cáo tài chính hợp nhất'+suffix+'. '
   declaration='Báo cáo tài chính hợp nhất'+suffix+' kèm theo được trình bày bằng Đồng Việt Nam (VND), theo nguyên tắc giá gốc và phù hợp với chuẩn mực kế toán, chế độ kế toán doanh nghiệp Việt Nam'
   self.assertTrue(check(heading+declaration))
   self.assertFalse(check(declaration))
   self.assertFalse(check(heading+declaration.replace('phù hợp với','không phù hợp với')))
   self.assertFalse(check(heading+declaration.replace('được trình bày','sẽ được trình bày')))
   self.assertFalse(check(heading+declaration.replace('chuẩn mực kế toán, chế độ kế toán doanh nghiệp Việt Nam','IFRS')))

 def test_enterprise_explicit_vietnamese_standards_declaration(self):
  check=R['affirmative_vas_preparation']
  heading='Cơ sở lập Báo cáo tài chính hợp nhất. '
  declaration='Báo cáo tài chính hợp nhất kèm theo được trình bày bằng Đồng Việt Nam (VND), theo nguyên tắc giá gốc và phù hợp với các Chuẩn mực kế toán Việt Nam, Chế độ kế toán doanh nghiệp Việt Nam hiện hành'
  self.assertTrue(check(heading+declaration))
  self.assertFalse(check(declaration))
  self.assertFalse(check(heading+declaration.replace('phù hợp với','không phù hợp với')))
  self.assertFalse(check(heading+declaration.replace('được trình bày','sẽ được trình bày')))
  self.assertFalse(check(heading+declaration.replace('các Chuẩn mực kế toán Việt Nam','IFRS')))

 def test_explicit_enterprise_compliance_requires_actual_preparation(self):
  check=R['affirmative_vas_preparation']
  heading='Tuyên bố về việc tuân thủ Chuẩn mực và Chế độ kế toán. '
  declaration='Tập đoàn đã áp dụng các Chuẩn mực kế toán Việt Nam. Các báo cáo tài chính được lập và trình bày theo đúng mọi quy định của từng chuẩn mực.'
  self.assertTrue(check(heading+declaration))
  self.assertFalse(check(declaration))
  self.assertFalse(check(heading+declaration.replace('đã áp dụng','sẽ áp dụng')))
  self.assertFalse(check(heading+declaration.replace('đã áp dụng','không áp dụng')))
  self.assertFalse(check(heading+declaration.replace('theo đúng','không theo đúng')))
  self.assertFalse(check(heading+declaration.replace('Chuẩn mực kế toán Việt Nam','IFRS')))

 def test_wrapped_pre_working_capital_subtotal_cannot_be_final_cfo(self):
  def group(y,caption,values=()):
   words=[{'text':caption,'x':.15,'y':y-.005,'height':.01,'width':.4,'confidence':1}]+[{'text':v,'x':.69+i*.16,'y':y-.005,'height':.01,'width':.1,'confidence':1} for i,v in enumerate(values)]
   return {'cy':y,'words':words,'text':' '.join(w['text'] for w in words)}
  for qualifier in ['trước những thay đổi về tài sản và vốn lưu động','trước những thay đổi về vốn lưu động']:
   rows=R['statement_rows']([group(.4,'Lưu chuyển tiền thuần từ hoạt động kinh doanh',['26.220.502','21.710.391']),group(.414,qualifier),group(.75,'Lưu chuyển tiền thuần từ hoạt động kinh doanh',['(23.292.141)','90.469.802'])])
   self.assertIsNone(R['identify'](rows[0]))
   self.assertEqual(R['identify'](rows[-1])[0],'CFO')
  rows=R['statement_rows']([group(.4,'Lưu chuyển tiền thuần từ hoạt động kinh doanh',['26.220.502']),group(.414,'Những thay đổi về tài sản hoạt động')])
  self.assertEqual(R['identify'](rows[0])[0],'CFO')

 def test_wrapped_cfo_qualifier_ignores_only_outside_caption_margin(self):
  def row(y,words):
   ws=[{'text':t,'x':x,'y':y-.005,'height':.01,'width':.1,'confidence':1} for t,x in words]
   return {'cy':y,'words':ws,'text':' '.join(w['text'] for w in ws)}
  subtotal=row(.4,[('Lưu chuyển tiền thuần từ hoạt động kinh doanh',.15),('26.220.502',.69)])
  qualifier=row(.414,[('trước những thay đổi về tài sản và vốn lưu động',.15),('VE',.972)])
  self.assertIsNone(R['identify'](R['statement_rows']([subtotal,qualifier])[0]))
  qualifier['words'][1]['x']=.45
  self.assertEqual(R['identify'](R['statement_rows']([subtotal,qualifier])[0])[0],'CFO')

 def test_activity_caption_cannot_override_currency_scale(self):
  self.assertIsNone(R['explicit_unit_text']('động'))
  self.assertIsNone(R['explicit_unit_text']('hoạt động'))
  self.assertEqual(R['explicit_unit_text']('đồng'),'CURRENCY')
  groups=[{'cy':.2,'text':'Triệu VND','words':[{'text':'Triệu','x':.7},{'text':'VND','x':.75}]},
          {'cy':.65,'text':'Những thay đổi về công nợ hoạt động','words':[{'text':'Những thay đổi về công nợ hoạt','x':.2},{'text':'động','x':.46}]}]
  self.assertEqual(R['declared_unit'](groups,.87)[1],'MILLION_CURRENCY')

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
 def test_note_reference_is_not_part_of_exact_equity_caption(self):
  words=[{'text':'TỔNG VÓN CHỦ SỞ HỮU','x':.186},
         {'text':'16(a)','x':.583}, {'text':'248.490.506','x':.673}]
  row={'text':' '.join(w['text'] for w in words),'words':words}
  self.assertEqual(R['identify'](row)[0],'TOTAL_EQUITY')
  self.assertEqual(row['words'],words)
  row['words']=[{**words[0],'text':'COMMON EQUITY'},*words[1:]]
  self.assertIsNone(R['identify'](row))
 def test_current_quarter_and_ytd_are_distinct(self):
  self.assertEqual(R['get_period']('Bao cao quy II tai ngay 30/06/2026')['start'],'2026-04-01')
  self.assertEqual(R['get_period']('Bao cao sau thang tai ngay 30/06/2026')['start'],'2026-01-01')
  self.assertIsNone(R['get_period']('Tai ngay 30/06/2026'))
  self.assertIsNone(R['get_period']('BCTC_q2_2026.pdf'))
 def test_newer_quarter_is_not_prior_annual_comparative(self):
  self.assertEqual(R['get_period']('Quy I ngay 31/03/2025; so sanh 31/12/2024')['end'],'2025-03-31')
  self.assertEqual(R['get_period']('Quy III ngay 30/09/2025; so sanh 31/12/2024')['end'],'2025-09-30')
 def test_page_window_not_inherited_from_ytd_cover(self):
  period=R['get_period']('Sau thang 30/06/2026')
  self.assertEqual(R['flow_window']('Quy II 2026',period)['start'],'2026-04-01')
  self.assertIsNone(R['flow_window']('Quy II 2026 va luy ke',period))
  self.assertEqual(R['flow_window']('Quy II 2026 va luy ke',period,True)['start'],'2026-01-01')
  self.assertIsNone(R['flow_window']('Nam 2026',period))
  self.assertEqual(R['flow_window']('Giai doan tu 1/1/2026 den 30/6/2026',period)['start'],'2026-01-01')
 def test_first_third_quarter_flow_windows_need_explicit_source_labels(self):
  first=R['get_period']('Quy I 31/03/2026')
  self.assertEqual(R['flow_window']('Quy I 2026',first)['start'],'2026-01-01')
  third=R['get_period']('Quy III 30/09/2025')
  self.assertEqual(R['flow_window']('Quy III 2025',third)['start'],'2025-07-01')
  self.assertEqual(R['flow_window']('Chin thang ket thuc ngay 30/09/2025',third)['type'],'YTD')
  self.assertIsNone(R['flow_window']('Quy III 2025 va luy ke',third))
  self.assertEqual(R['flow_window']('Quy III 2025 va luy ke',third,True)['start'],'2025-01-01')
  self.assertIsNone(R['flow_window']('Nam 2025',third))
 def test_explicit_unit_scale_not_numbers_inside_statement(self):
  self.assertEqual(R['explicit_unit_text']('Đơn vị tính: triệu đồng'),'MILLION_CURRENCY')
  self.assertEqual(R['explicit_unit_text']('Unit: VND billion'),'BILLION_CURRENCY')
  self.assertEqual(R['explicit_unit_text']('Đơn vị: 1.000 đồng'),'THOUSAND_CURRENCY')
  self.assertEqual(R['explicit_unit_text']('VND VND'),'CURRENCY')
  self.assertEqual(R['explicit_unit_text']('VND VND VND VND'),'CURRENCY')
  self.assertIsNone(R['explicit_unit_text']('VND VND USD VND'))
  self.assertIsNone(R['explicit_unit_text']('The bank earned VND 1000 million'))
  self.assertIsNone(R['explicit_unit_text']('Unit: VND million billion'))
  self.assertIsNone(R['explicit_unit_text']('Unit: USD / VND'))
 def test_stock_date_order_proves_column_not_a_narrative_date(self):
  def words(texts):return [{'text':t,'x':0.55+i*0.17,'y':0.2,'width':0.12,'height':0.02} for i,t in enumerate(texts)]
  header=R['lines'](words(['30/06/2026','31/12/2025']))
  self.assertEqual(R['stock_date_columns'](header,0.6,'2026-06-30')['dates'],['2026-06-30','2025-12-31'])
  self.assertIsNone(R['stock_date_columns'](R['lines'](words(['30/06/2026'])),0.6,'2026-06-30'))
  self.assertIsNone(R['stock_date_columns'](R['lines'](words(['Current 30/06/2026','previous 31/12/2025'])),0.6,'2026-06-30'))
 def test_closing_header_edge_punctuation_does_not_supply_date(self):
  ws=[{'text':'Tại ngày 30 tháng 6 năm 2026','x':.1,'y':.08,'width':.5,'height':.01},
      {'text':'Số cuối kỳ!','x':.66,'y':.15,'width':.09,'height':.01}]
  header=R['stock_date_columns'](R['lines'](ws),.7,'2026-06-30')
  self.assertAlmostEqual(header['positions'][0],.705)
  self.assertIsNone(R['stock_date_columns'](R['lines'](ws[1:]),.7,'2026-06-30'))
  self.assertIsNone(R['stock_date_columns'](R['lines'](ws),.7,'2025-12-31'))
 def test_wrapped_isolated_stock_dates_preserve_exact_column_geometry(self):
  words=[{'text':'30/06/2026','x':.56,'y':.16,'width':.12,'height':.01},
         {'text':'31/12/2025','x':.80,'y':.145,'width':.12,'height':.01},
         {'text':'OCR-note-label','x':.45,'y':.16,'width':.08,'height':.01}]
  result=R['stock_date_columns'](R['lines'](words),.6,'2026-06-30')
  self.assertEqual(result['dates'],['2026-06-30','2025-12-31'])
  self.assertAlmostEqual(result['positions'][0],.62)
  words[1]['y']=.25
  self.assertIsNone(R['stock_date_columns'](R['lines'](words),.6,'2026-06-30'))
  words[1]['y']=.145;words[1]['text']='31/42/2025'
  self.assertIsNone(R['stock_date_columns'](R['lines'](words),.6,'2026-06-30'))
 def test_shared_explicit_day_month_binds_two_year_columns(self):
  words=[{'text':'Tại ngày 31 tháng 12 năm','x':0.55,'y':0.1,'width':0.4,'height':0.02},{'text':'2024','x':0.55,'y':0.14,'width':0.08,'height':0.02},{'text':'2023','x':0.8,'y':0.14,'width':0.08,'height':0.02}]
  self.assertEqual(R['stock_date_columns'](R['lines'](words),0.6,'2024-12-31')['dates'],['2024-12-31','2023-12-31'])
  self.assertIsNone(R['stock_date_columns'](R['lines'](words[1:]),0.6,'2024-12-31'))
 def test_closing_balance_requires_explicit_source_page_date(self):
  words=[{'text':'Tại ngày 30 tháng 6 năm 2026','x':0.1,'y':0.1,'width':0.7,'height':0.02},{'text':'Số cuối kỳ','x':0.55,'y':0.14,'width':0.1,'height':0.02}]
  self.assertIsNone(R['stock_date_columns'](R['lines'](words[1:]),0.6,'2026-06-30'))
  self.assertEqual(R['stock_date_columns'](R['lines'](words),0.6,'2026-06-30')['dates'],['2026-06-30'])
  # Individual source words provide exact column geometry.
  labels=[{'text':t,'x':0.55+i*0.04,'y':0.14,'width':0.03,'height':0.02} for i,t in enumerate(['Số','cuối','kỳ'])]
  self.assertEqual(R['stock_date_columns'](R['lines'](words[:1]+labels),0.6,'2026-06-30')['dates'],['2026-06-30'])
 def test_split_header_labels_do_not_hide_exact_dates_or_units(self):
  def w(text,x,y,width=.1):return {'text':text,'x':x,'y':y,'width':width,'height':.02}
  groups=R['lines']([w('Mã',.45,.1,.04),w('Thuyết',.50,.1,.08),w('30/6/2026',.65,.1),w('1/1/2026',.82,.1),w('số',.45,.14,.04),w('minh',.50,.14,.08),w('Triệu VND',.65,.14),w('Triệu VND',.82,.14)])
  self.assertEqual(R['stock_date_columns'](groups,.6,'2026-06-30')['dates'],['2026-06-30','2026-01-01'])
  self.assertEqual(R['declared_unit'](groups,.6)[1],'MILLION_CURRENCY')
 def test_current_flow_label_needs_explicit_page_window_and_date(self):
  period=R['get_period']('Sau thang 30/06/2026')
  words=[{'text':'Cho kỳ hoạt động 6 tháng kết thúc ngày 30 tháng 6 năm 2026','x':.1,'y':.1,'width':.8,'height':.02},{'text':'Kỳ này','x':.65,'y':.2,'width':.1,'height':.02},{'text':'Kỳ trước','x':.82,'y':.2,'width':.1,'height':.02}]
  self.assertEqual(len(R['explicit_current_flow_columns'](R['lines'](words),.6,period)),1)
  self.assertEqual(R['explicit_current_flow_columns'](R['lines'](words[1:]),.6,period),[])
  self.assertEqual(R['explicit_current_flow_columns'](R['lines'](words),.6,{**period,'end':'2025-06-30'}),[])
 def test_eps_note_following_window_still_requires_exact_date_and_current_label(self):
  period=R['get_period']('Sau thang 30/06/2026')
  words=[{'text':'Kỳ này','x':.65,'y':.2,'width':.1,'height':.02},{'text':'Kỳ trước','x':.82,'y':.2,'width':.1,'height':.02},{'text':'Cho kỳ hoạt động 6 tháng kết thúc ngày 30 tháng 6 năm 2026','x':.1,'y':.8,'width':.8,'height':.02}]
  self.assertEqual(R['explicit_current_flow_columns'](R['lines'](words),.6,period),[])
  self.assertEqual(len(R['explicit_current_flow_columns'](R['lines'](words),.6,period,True)),1)
  self.assertEqual(R['explicit_current_flow_columns'](R['lines'](words[:2]),.6,period,True),[])
  self.assertEqual(R['explicit_current_flow_columns'](R['lines'](words),.6,{**period,'end':'2025-06-30'},True),[])
 def test_explicit_common_profit_is_distinct_from_eps_calculation_profit(self):
  def row(text):return {'text':text,'words':[{'text':text,'x':.1}]}
  self.assertEqual(R['identify'](row('Lợi nhuận thuần thuộc về cổ đông phổ thông'))[0],'NET_INCOME_ATTRIBUTABLE_COMMON')
  self.assertIsNone(R['identify'](row('Lợi nhuận để tính lãi cơ bản trên cổ phiếu (VND)')))
  self.assertIsNone(R['identify'](row('Lợi nhuận thuần phân bổ cho các cổ đông')))
 def test_generic_shareholder_note_needs_both_ordinary_shareholder_definitions(self):
  row={'text':'Lợi nhuận thuần phân bổ cho các cổ đông (Triệu VND)','words':[{'text':'Lợi nhuận thuần phân bổ cho các cổ đông (Triệu VND)','x':.1}]}
  note='thuyet minh bao cao tai chinh hop nhat; lai co ban tren co phieu; co dong so huu co phieu pho thong'
  self.assertEqual(R['identify_ordinary_profit_note'](row,[note,note])[0],'NET_INCOME_ATTRIBUTABLE_COMMON')
  self.assertIsNone(R['identify_ordinary_profit_note'](row,[note,'lai co ban tren co phieu']))
  self.assertIsNone(R['identify_ordinary_profit_note'](row,[note.replace('pho thong','uu dai')]*2))
 def test_aggregate_inventory_and_equity_do_not_admit_subrows(self):
  def row(code,caption):return {'text':code+' '+caption,'words':[{'text':code,'x':.2},{'text':caption,'x':.3}]}
  self.assertIsNone(R['identify'](row('141','Hàng tồn kho')))
  self.assertEqual(R['identify'](row('140','Hàng tồn kho'))[0],'INVENTORY')
  self.assertIsNone(R['identify'](row('410','Vốn chủ sở hữu')))
  self.assertEqual(R['identify'](row('400','Vốn chủ sở hữu'))[0],'TOTAL_EQUITY')
 def test_exact_scaled_unit_tokens_survive_split_prefix_without_scale_loss(self):
  def w(text,x):return {'text':text,'x':x,'y':.15,'width':.08,'height':.02}
  words=[w('Bon',.55),w('vi:',.64),w('Triệu',.74),w('VND',.84)]
  self.assertEqual(R['declared_unit'](R['lines'](words),.6)[1],'MILLION_CURRENCY')
  self.assertIsNone(R['declared_unit'](R['lines'](words+[w('USD',.94)]),.6))
 def test_annual_reporting_window_outranks_board_appointment_dates(self):
  text='Báo cáo tài chính hợp nhất cho năm tài chính kết thúc ngày 31 tháng 12 năm 2025; ban lãnh đạo từ ngày 30/06/2025; 6 tháng'
  self.assertEqual(R['get_period'](text)['end'],'2025-12-31')
 def test_notes_restatement_table_is_not_primary_income_statement(self):
  def w(text,x,y):return {'text':text,'x':x,'y':y,'width':.12,'height':.02,'confidence':1}
  rows=[w('BÁO CÁO KẾT QUẢ HOẠT ĐỘNG HỢP NHẤT',.1,.12)]
  for n in range(3):rows.extend([w('Thu nhập',.1,.3+n*.04),w('3.436.868',.55,.3+n*.04),w('2.712.427',.8,.3+n*.04)])
  self.assertIn('INCOME',R['primary_kinds']({'passA':rows},'passA'))
  notes=[w('THUYẾT MINH BÁO CÁO TÀI CHÍNH HỢP NHẤT',.1,.05)]+rows
  self.assertEqual(R['primary_kinds']({'passA':notes},'passA'),set())
 def test_wrapped_caption_preserves_numeric_row_and_rejects_neighboring_amounts(self):
  def w(text,x,y,width=.15):return {'text':text,'x':x,'y':y,'width':width,'height':.008,'confidence':1}
  words=[w('Lưu chuyển tiền thuần từ hoạt động',.1,.4,.35),w('kinh doanh',.1,.417),w('20',.5,.417,.03),w('1.234.567',.65,.417),w('2.345.678',.83,.417)]
  rows=R['statement_rows'](R['lines'](words));matches=[g for g in rows if R['identify'](g)]
  self.assertEqual(len(matches),1);self.assertEqual(R['identify'](matches[0])[0],'CFO')
  self.assertEqual([v['lexical'] for v in R['numbers'](matches[0])],['1.234.567','2.345.678'])
  self.assertFalse(any(R['identify'](g) for g in R['statement_rows'](R['lines'](words+[w('9.876.543',.65,.4)]))))
 def test_complete_subtotal_caption_cannot_attach_to_preceding_dividend(self):
  def w(text,x,y,width=.15):return {'text':text,'x':x,'y':y,'width':width,'height':.01,'confidence':1}
  words=[w('(8.961.846)',.70,.470),w('Lưu chuyển tiền thuần từ hoạt động tài chính',.14,.485,.34),w('(4.945.257)',.70,.491)]
  rows=R['statement_rows'](R['lines'](words))
  matches=[g for g in rows if R['identify'](g)]
  self.assertEqual(len(matches),1)
  self.assertEqual([v['lexical'] for v in R['numbers'](matches[0])],['(4.945.257)'])
 def test_ytd_column_requires_each_readers_explicit_independent_header(self):
  def w(text,x,width):return {'text':text,'x':x,'y':.2,'width':width,'height':.01,'confidence':1}
  values=[{'x':.48,'width':.08},{'x':.73,'width':.08}]
  groups=R['lines']([w('Quý II kết thúc ngày',.5,.13),w('Giai đoạn sáu tháng kết thúc ngày',.72,.20)])
  self.assertEqual(R['ytd_column_numbers'](groups,.6,values),[values[1]])
  self.assertEqual(R['ytd_column_numbers']([], .6,values),[])
  reversedHeader=R['lines']([w('Giai đoạn sáu tháng kết thúc ngày',.48,.12)])
  self.assertEqual(R['ytd_column_numbers'](reversedHeader,.6,values),[values[0]])
 def test_six_month_note_columns_preserve_current_and_comparative(self):
  def w(text,x):return {'text':text,'x':x,'y':.2,'width':.14,'height':.01,'confidence':1}
  values=[{'x':.60,'width':.12},{'x':.78,'width':.12}]
  groups=R['lines']([w('Kỳ 6 tháng kết thúc',.59),w('Kỳ 6 tháng kết thúc',.77)])
  self.assertEqual(R['ytd_column_numbers'](groups,.6,values),[])
  self.assertEqual(R['ytd_column_numbers'](groups,.6,values,True),values)
  self.assertEqual(R['ytd_column_numbers']([], .6,values,True),[])
 def test_explicit_primary_range_outranks_governance_dates(self):
  text='Cho giai đoạn từ ngày 1 tháng 1 năm 2025 đến ngày 30 tháng 9 năm 2025; bổ nhiệm ngày 30/06/2025'
  self.assertEqual(R['get_period'](text)['end'],'2025-09-30')
  text=text.replace('30 tháng 9','31 tháng 12')
  self.assertEqual(R['get_period'](text)['type'],'ANNUAL')
  self.assertEqual(R['get_period']('Cho giai đoạn từ ngày 1 tháng 1 năm 2025 đến ngày 31 tháng 3 năm 2025; so sánh 31/12/2024')['end'],'2025-03-31')
 def test_ordered_region_columns_require_literal_years_and_cumulative_order(self):
  def w(text,y):return {'text':text,'x':.5,'y':y,'width':.4,'height':.01}
  groups=R['lines']([w('Quý II Lũy kế từ đầu năm',.2),w('2026 2025 2026 2025',.23)])
  values=[{}, {}, {}, {}]
  verify=R['verify_ordered_flow_column']
  self.assertTrue(verify(groups,.6,values,2,2026,True))
  self.assertFalse(verify(groups,.6,values,0,2026,True))
  self.assertFalse(verify(groups,.6,values,2,2025,True))
  self.assertFalse(verify(groups[:1],.6,values,2,2026,True))
  reversedGroups=R['lines']([w('Lũy kế từ đầu năm Quý II',.2),w('2026 2025 2026 2025',.23)])
  self.assertFalse(verify(reversedGroups,.6,values,2,2026,True))
 def test_positive_dn_form_code_identifies_family_without_fuzzy_title(self):
  def w(text,x,y):return {'text':text,'x':x,'y':y,'width':.12,'height':.02,'confidence':1}
  words=[w('Mẫu B 02a — DN/HN',.1,.12)]
  for n in range(3):words.extend([w('Chỉ tiêu',.1,.3+n*.04),w('3.436.868',.55,.3+n*.04),w('2.712.427',.8,.3+n*.04)])
  self.assertEqual(R['primary_kinds']({'passA':words},'passA'),{'INCOME'})
  self.assertEqual(R['primary_kinds']({'passA':[{**words[0],'text':'Mẫu B 02a — TCTD/HN'}]+words[1:]},'passA'),{'BALANCE'})
  self.assertEqual(R['primary_kinds']({'passA':[{**words[0],'text':'Mẫu B 04a — TCTD'}]+words[1:]},'passA'),{'CASH_FLOW'})
  self.assertEqual(R['primary_kinds']({'passA':[{**words[0],'text':'Mẫu B 02a — CTCK'}]+words[1:]},'passA'),{'INCOME'})
  self.assertEqual(R['primary_kinds']({'passA':[w('Công ty X Thuyết minh báo cáo tài chính',.1,.04)]+words},'passA'),set())
 def test_split_arithmetic_caption_preserves_equation_before_removal(self):
  words=[{'text':text,'x':.05+i*.019,'y':.5,'width':.018,'height':.02,'confidence':1} for i,text in enumerate(['Lợi','nhuận','sau','thuế','TNDN','(60','=','50','-','51','-','52)','60'])]
  words.append({'text':'5.642.622.644.280','x':.72,'y':.5,'width':.1,'height':.02,'confidence':1})
  self.assertEqual(R['identify'](R['lines'](words)[0])[0],'NET_INCOME')
 def test_gvr_literal_source_title_override_is_body_page_and_range_bound(self):
  def w(text,x,y):return {'text':text,'x':x,'y':y,'width':.12,'height':.01,'confidence':1}
  words=[w('BÁO CÁO KẾT LƯU CHUYỂN TIỀN TỆ HỢP NHẤT',.15,.10),w('01/01/2023 31/12/2023 01/01/2022 31/12/2022',.55,.18)]
  for n in range(3):words.extend([w('Chỉ tiêu',.10,.3+n*.04),w('1.234.567',.6,.3+n*.04),w('2.345.678',.8,.3+n*.04)])
  page={'bodyHash':'707a36cbbc34429142fff4cb9d9c7622f9ad0af6526e73fec4232d678faf23f6','page':10,'passA':words}
  self.assertEqual(R['primary_kinds_uncached'](page,'passA'),{'CASH_FLOW'})
  self.assertEqual(R['primary_kinds_uncached']({**page,'bodyHash':'0'*64},'passA'),set())
  self.assertEqual(R['primary_kinds_uncached']({**page,'page':9},'passA'),set())
  self.assertEqual(R['primary_kinds_uncached']({'bodyHash':page['bodyHash'],'page':10,'passA':[words[0]]+words[2:]},'passA'),set())
 def test_annual_document_heading_keeps_literal_date_after_binding_punctuation(self):
  def w(text,x,y):return {'text':text,'x':x,'y':y,'width':.05,'height':.01,'confidence':1}
  words=[w('BÁO CÁO TÀI CHÍNH HỢP NHẤT',.1,.10),w('_',.5,.135),w('|',.6,.136)]
  words.extend(w(text,.10+i*.055,.14) for i,text in enumerate('CHO NĂM TÀI CHÍNH KẾT THÚC NGÀY 31 THÁNG 12 NĂM 2023'.split()))
  method=R['annual_document_heading_period']
  self.assertEqual(method({'passA':words},'passA')['end'],'2023-12-31')
  self.assertIsNone(method({'passA':words[:-1]},'passA'))
  self.assertIsNone(method({'passA':words[1:]},'passA'))
  self.assertIsNone(method({'passA':[{**x,'y':.4} for x in words]},'passA'))
 def test_wrapped_inventory_provision_cannot_match_inventory_aggregate(self):
  def w(text,x,y):return {'text':text,'x':x,'y':y,'width':.1,'height':.01,'confidence':1}
  words=[w('149',.1,.47),w('Dự phòng giảm giá',.2,.47),w('hàng tồn kho',.2,.482),w('(423.097.685.938)',.6,.482),w('(204.448.896.920)',.8,.482)]
  rows=R['statement_rows'](R['lines'](words))
  self.assertIsNone(R['identify'](rows[-1]))
  words=[w('140',.1,.44),w('IV. Hàng tồn kho',.2,.44),w('22.244.676.326.705',.6,.44),w('21.824.235.626.176',.8,.44)]
  self.assertEqual(R['identify'](R['statement_rows'](R['lines'](words))[0])[0],'INVENTORY')
 def test_annual_bank_basis_requires_affirmative_actual_preparation_declaration(self):
  declaration='Việc lập báo cáo tài chính hợp nhất tuân thủ theo các chuẩn mực kế toán, chế độ kế toán áp dụng cho các tổ chức tín dụng tại Việt Nam'
  heading='TÓM TẮT CÁC CHÍNH SÁCH KẾ TOÁN CHỦ YẾU '
  self.assertTrue(R['affirmative_vas_preparation'](heading+declaration))
  self.assertFalse(R['affirmative_vas_preparation'](declaration))
  self.assertFalse(R['affirmative_vas_preparation'](heading+'Chuẩn mực kế toán Việt Nam khác IFRS'))
  self.assertFalse(R['affirmative_vas_preparation'](heading+declaration.replace('tuân thủ theo','không tuân thủ theo')))
 def test_primary_interim_window_requires_two_matching_dated_statement_headers(self):
  check=R['agreed_primary_interim_window']
  balance='BÁO CÁO TÌNH HÌNH TÀI CHÍNH HỢP NHẤT ngày 31 tháng 03 năm 2026. Tại 31/03/2026. Tại 31/12/2025 trình bày lại.'
  flow='BÁO CÁO LƯU CHUYỂN TIỀN TỆ HỢP NHẤT Quý I năm 2026'
  expected=check(balance,balance,flow,flow)
  self.assertEqual(expected['end'],'2026-03-31')
  self.assertEqual(expected['type'],'QUARTER')
  self.assertIsNone(check(balance,balance,'',''))
  self.assertIsNone(check(balance,balance,flow,flow.replace('Quý I','Quý III')))
  self.assertIsNone(check(balance,balance.replace('31 tháng 03 năm 2026','30 tháng 09 năm 2026').replace('31/03/2026','30/09/2026'),flow,flow))
  self.assertIsNone(check(balance,balance,'BÁO CÁO LƯU CHUYỂN TIỀN TỆ HỢP NHẤT','BÁO CÁO LƯU CHUYỂN TIỀN TỆ HỢP NHẤT'))
if __name__=='__main__':unittest.main()
