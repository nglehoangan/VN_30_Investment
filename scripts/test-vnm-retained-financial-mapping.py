#!/usr/bin/env python3
import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('builder',Path(__file__).with_name('map-vnm-retained-financials.py'))
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
from retained_financial_mapping import evaluate,digest

class MappingTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.bindings=b.build();cls.result=evaluate(b.ROOT,cls.bindings)
 def test_retained_real_cells(self):
  self.assertGreater(len(self.result['rows']),270);self.assertEqual(self.result['quarantined'],[]);self.assertEqual(self.result['conflicts'],[])
 def test_deterministic_replay(self):
  self.assertEqual(self.result,evaluate(b.ROOT,self.bindings))
 def test_requested_groups(self):
  concepts={r['concept'] for r in self.result['rows']}
  self.assertTrue({'TOTAL_EQUITY','TRADE_RECEIVABLES','INVENTORY','TRADE_PAYABLES','REVENUE','GROSS_PROFIT','SELLING_EXPENSE','ADMIN_EXPENSE','INTEREST_EXPENSE','NET_INCOME_ATTRIBUTABLE_PARENT','CFO','DEPRECIATION_AMORTIZATION','ASSET_PURCHASE_CASH_OUTFLOW','CASH_TAX_PAID','EMPLOYEE_FUND_USE','DIVIDEND_PAYABLE'} <= concepts)
 def test_no_fact_assumptions(self):
  self.assertFalse({'MAINTENANCE_CAPEX','DEPOSIT_AVAILABILITY','WACC','NORMALIZED_NOPAT'} & {r['concept'] for r in self.result['rows']})
 def test_scope_and_vintage_separate(self):
  rows=[r for r in self.result['rows'] if r['concept']=='CASH_AND_EQUIVALENTS']
  self.assertEqual({r['scope'] for r in rows},{'STANDALONE','CONSOLIDATED'})
  self.assertGreater(len({r['vintage'] for r in rows}),1)
 def test_finance_cash_correct_year(self):
  rows=[r for r in self.result['rows'] if r['concept']=='RECEIVED_FINANCE_CASH' and r['end']=='2025-12-31']
  self.assertEqual([r['value'] for r in rows],['1571241822856'])
 def test_no_authority_promotion(self):
  self.assertTrue(all(not r['formalAdmission'] and not r['historicalPitEligible'] for r in self.result['rows']))
 def test_negative_dimensions(self):
  for key in ['caption','column']:
   with self.subTest(key=key):
    x=copy.deepcopy(self.bindings[0]);x['checks'][key]='WRONG';self.assertEqual(len(evaluate(b.ROOT,[x])['quarantined']),1)
  for key,value in [('sha256','bad'),('ticker','FPT'),('unit','THOUSAND_VND')]:
   with self.subTest(key=key):
    x=copy.deepcopy(self.bindings[0]);x[key]=value;self.assertEqual(len(evaluate(b.ROOT,[x])['quarantined']),1)
 def test_period_scope_and_source_rejection(self):
  row=next(x for x in self.bindings if 'period' in x['checks'])
  for key,value in [('period',{'start':'1900-01-01','end':'1900-01-01'}),('scope','STANDALONE'),('sourceHash','bad'),('ticker','FPT'),('unit','MILLION_CURRENCY')]:
   with self.subTest(key=key):
    x=copy.deepcopy(row);x['checks'][key]=value;self.assertEqual(len(evaluate(b.ROOT,[x])['quarantined']),1)
 def test_missing_cell(self):
  x=copy.deepcopy(self.bindings[0]);x['pointer']='/absent';self.assertEqual(len(evaluate(b.ROOT,[x])['quarantined']),1)
 def test_null_dash_conflict(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'cells.json';p.write_text(json.dumps([{'value':'0'},{'value':'1'},{'value':None},{'value':'-'}]))
   rows=[]
   for i in range(4):
    x=copy.deepcopy(self.bindings[0]);x.update(id=str(i),path='cells.json',sha256=digest(p),pointer='/'+str(i),checks={});rows.append(x)
   r=evaluate(tmp,rows);self.assertEqual(len(r['quarantined']),2);self.assertEqual(len(r['conflicts']),1)
   self.assertEqual(r['rows'][0]['value'],'0');self.assertEqual(r['rows'][0]['status'],'CONFLICT_NOT_QUALIFIED')

if __name__=='__main__':unittest.main()
