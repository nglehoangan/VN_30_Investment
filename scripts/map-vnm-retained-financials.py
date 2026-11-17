#!/usr/bin/env python3
"""Map reviewed VNM cells without changing their source or standing-authority v4."""
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'lib'))
from retained_financial_mapping import digest, evaluate
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/fundamental-data-engine/vnm-f2-mapping/2026-11-16'
BASE = 'docs/fundamental-data-engine/'
CONCEPTS = {
 'assets':'TOTAL_ASSETS','totalLiabilities':'TOTAL_LIABILITIES','totalEquity':'TOTAL_EQUITY',
 'cash':'CASH_AND_EQUIVALENTS','shortFinancialAssets':'SHORT_TERM_FINANCIAL_ASSETS',
 'longFinancialAssets':'LONG_TERM_FINANCIAL_ASSETS','shortDebt':'SHORT_TERM_FINANCIAL_BORROWINGS',
 'longDebt':'LONG_TERM_FINANCIAL_BORROWINGS','tradePayables':'TRADE_PAYABLES',
 'customerAdvances':'CUSTOMER_ADVANCES','payrollPayables':'PAYROLL_PAYABLES',
 'revenue':'REVENUE','costOfSales':'COST_OF_SALES','grossProfit':'GROSS_PROFIT',
 'selling':'SELLING_EXPENSE','admin':'ADMIN_EXPENSE','financeExpense':'FINANCE_EXPENSE',
 'financeIncome':'FINANCE_INCOME','interestExpense':'INTEREST_EXPENSE','netProfit':'NET_PROFIT_GROUP',
 'pretaxProfit':'PRETAX_PROFIT','otherExpense':'OTHER_EXPENSE','otherIncome':'OTHER_INCOME',
 'associateResult':'ASSOCIATE_RESULT','fundAppropriation':'EMPLOYEE_FUND_APPROPRIATION',
 'currentTax':'CURRENT_TAX_EXPENSE','deferredTax':'DEFERRED_TAX_EXPENSE'}
STOCK = {'assets','totalLiabilities','totalEquity','cash','shortFinancialAssets',
 'longFinancialAssets','shortDebt','longDebt','tradePayables','customerAdvances','payrollPayables'}
# Explicit source semantic keys: no amount matching, fuzzy captions or provider-code inference.
PARENT = {
 'Cash':('CASH_AND_EQUIVALENTS','STOCK'), 'ShortDeposits':('SHORT_TERM_DEPOSITS','STOCK'),
 'LongDeposits':('LONG_TERM_DEPOSITS','STOCK'),'Equity':('TOTAL_EQUITY','STOCK'),
 'Debt':('REPORTED_BORROWINGS','STOCK'),'Liabilities':('TOTAL_LIABILITIES','STOCK'),
 'Revenue':('REVENUE','FLOW'),'GrossProfit':('GROSS_PROFIT','FLOW'),
 'Selling':('SELLING_EXPENSE','FLOW'),'Admin':('ADMIN_EXPENSE','FLOW'),
 'TradeReceivable':('TRADE_RECEIVABLES','STOCK'),'Inventory':('INVENTORY','STOCK'),
 'TradePayable':('TRADE_PAYABLES','STOCK'),'CustomerAdvance':('CUSTOMER_ADVANCES','STOCK'),
 'Cfo':('CFO','FLOW'),'Da':('DEPRECIATION_AMORTIZATION','FLOW'),
 'CapexCash':('ASSET_PURCHASE_CASH_OUTFLOW','FLOW'),'ReceivedFinanceCash':('RECEIVED_FINANCE_CASH','FLOW'),
 'CashDividends':('DIVIDENDS_PAID','FLOW'),'NewDebtCash':('BORROWING_PROCEEDS','FLOW'),
 'RepaidDebtCash':('BORROWING_REPAYMENTS','FLOW'),'FundAccrual':('EMPLOYEE_FUND_ACCRUAL','FLOW'),
 'FundUse':('EMPLOYEE_FUND_USE','FLOW'),'Npat':('NET_PROFIT_STANDALONE','FLOW'),
 'CashTax':('CASH_TAX_PAID','FLOW'),'CurrentTaxExpense':('CURRENT_TAX_EXPENSE','FLOW'),
 'CurrentTaxPayable':('CURRENT_TAX_PAYABLE','STOCK'),'SignedCapex':('SIGNED_CAPEX_COMMITMENT','STOCK')}

def build():
 bindings=[]; hashes={}
 previous=OUT/'MAPPING_CONTRACT_PRE_ADMISSION_FIX.json'
 old=json.loads(previous.read_text())['bindings'] if previous.exists() else []
 identities={(m['path'],m['pointer']):m['id'] for m in old}
 next_id=len(old)
 def add(path, ptr, cell, concept, scope, start, end, vintage, checks, category):
  nonlocal next_id
  identity=identities.get((path,ptr))
  if identity is None: identity=f'VNM:{next_id:04d}';next_id+=1
  bindings.append(dict(id=identity,ticker='VNM',concept=concept,
   scope=scope,start=start,end=end,vintage=vintage,unit='VND',category=category,
   path=path,sha256=hashes.setdefault(path,digest(ROOT/path)),pointer=ptr,checks=checks))
 path=BASE+'vnm-s1-economic-returns/2026-11-13/S1_INPUTS.json'
 d=json.loads((ROOT/path).read_text())
 for i,c in enumerate(d['nativeTextChecks']):
  key=c['caption']
  if key not in CONCEPTS: continue
  # Reviewed column and exact document jointly determine period; values never choose the mapping.
  pdf=c['source']['pdfPath']
  year=next((y for y in range(2022,2026) if f'_{y}_' in pdf),None)
  if year is None: continue
  if c['column']=='PRIOR_COMPARATIVE_2021_12_31': year=2021
  end=f'{year}-12-31'; start=end if key in STOCK else f'{year}-01-01'
  add(path,f'/nativeTextChecks/{i}',c,CONCEPTS[key],'CONSOLIDATED',start,end,'ANNUAL_ORIGINAL',
      {'caption':key,'column':c['column']},'BALANCE_SHEET' if key in STOCK else 'INCOME_OR_NOTE')
 path=BASE+'vnm-s1-wacc-q3/2026-11-13/WACC_Q3_INPUTS.json';d=json.loads((ROOT/path).read_text())
 for i,c in enumerate(d['selectedFields']):
  key=c['caption']; col=c['column']
  if key not in CONCEPTS: continue
  if key in STOCK:
   end='2026-09-30' if col=='2026_09_30' else '2025-12-31' if col=='2026_01_01_RECLASSIFIED' else None
   start=end
  else:
   year=2026 if col in ('YTD_2026','NINE_MONTHS_2026') else 2025 if col in ('YTD_2025','NINE_MONTHS_2025') else None
   end=f'{year}-09-30' if year else None;start=f'{year}-01-01' if year else None
  if end:
   add(path,f'/selectedFields/{i}',c,CONCEPTS[key],'CONSOLIDATED',start,end,'Q3_2026_PRESENTATION',
       {'caption':key,'column':col},'BALANCE_SHEET' if key in STOCK else 'INCOME_OR_NOTE')
 path=BASE+'vnm-shared-evidence-products/2026-11-11/evidence-products.json';d=json.loads((ROOT/path).read_text())
 for prefix,scope in [('parent','STANDALONE'),('group','CONSOLIDATED')]:
  for stem,(concept,kind) in PARENT.items():
   for suffix,year in [('24',2024),('25',2025)]:
    key=prefix+stem+suffix
    if key not in d['facts']:continue
    c=d['facts'][key];end=f'{year}-12-31'
    add(path,'/facts/'+key,c,concept,scope,end if kind=='STOCK' else f'{year}-01-01',end,
        'ANNUAL_ORIGINAL',{'meaning':c['meaning'],'scope':scope},'CASH_FLOW' if stem in ['Cfo','Da','CapexCash','CashTax','ReceivedFinanceCash','CashDividends','NewDebtCash','RepaidDebtCash'] else 'REPORTED_SUPPORT')
 for prefix,scope in [('parent','STANDALONE'),('group','CONSOLIDATED')]:
  for suffix in ['Lease1y','Lease2to5y','LeaseOver5y']:
   key=prefix+suffix;c=d['facts'][key]
   add(path,'/facts/'+key,c,suffix.upper(),scope,'2025-12-31','2025-12-31','ANNUAL_ORIGINAL',
       {'meaning':c['meaning'],'scope':scope},'NOTE_MATURITY_BUCKET_NOT_CURRENT_OBLIGATION')
 path='data/manual-extracted-pdf/supplements/VNM-parent-Q3-2026-cash.json';d=json.loads((ROOT/path).read_text())
 codes={'110':'CASH_AND_EQUIVALENTS','111':'CASH','112':'CASH_EQUIVALENTS','120':'SHORT_TERM_FINANCIAL_ASSETS','123':'HELD_TO_MATURITY_CURRENT'}
 for i,c in enumerate(d['fields']):
  if c['code'] in codes:
   add(path,f'/fields/{i}',c,codes[c['code']],'STANDALONE','2026-09-30','2026-09-30','Q3_2026_PRESENTATION',
       {k:c[k] for k in ['code','caption','scope','periodEnd','currency','scale','column']},'BALANCE_SHEET')
 path=BASE+'vnm-final-s1-s5-scoring/2026-11-13/VNM_SCORING_INPUTS.json';d=json.loads((ROOT/path).read_text())
 for i,c in enumerate(d['qualifiedFinancialFacts']['canonicalFacts']):
  if c.get('qualified') is not True: continue
  add(path,f'/qualifiedFinancialFacts/canonicalFacts/{i}',c,c['itemId'],c['scope'],
      c['period']['start'],c['period']['end'],'RETAINED_CANONICAL',
      {k:c[k] for k in ['itemId','ticker','scope','period','unit','sourceHash','qualified']},
      'REUSED_CANONICAL_'+c.get('classification','REPORTED'))
 path=BASE+'vnm-s5-closure/2026-11-13/S5_VALUATION_INPUTS.json';d=json.loads((ROOT/path).read_text())
 selected={'debt':'REPORTED_BORROWINGS','oldDividendPayable':'DIVIDEND_PAYABLE',
 'openingEmployeeFundLiability':'EMPLOYEE_FUND_LIABILITY','longTermInvestments':'LONG_TERM_INVESTMENTS',
 'openingIncomeTaxPayable':'CURRENT_TAX_PAYABLE','fundAppropriation9m':'EMPLOYEE_FUND_APPROPRIATION',
 'fundUse9m':'EMPLOYEE_FUND_USE','depreciation9m':'DEPRECIATION_AMORTIZATION','cashCapex9m':'ASSET_PURCHASE_CASH_OUTFLOW'}
 for i,c in enumerate(d['selectedReportedCellEvidence']):
  if c['field'] not in selected: continue
  end=c['periodEnd'];flow=c['field'] in ['fundAppropriation9m','fundUse9m','depreciation9m','cashCapex9m']
  add(path,f'/selectedReportedCellEvidence/{i}',c,selected[c['field']],c['scope'],
      end[:4]+'-01-01' if flow else end,end,'Q3_2026_PRESENTATION',
      {k:c[k] for k in ['field','caption','scope','periodEnd','classification']},'REPORTED_NOTE')
  bindings[-1]['valueKey']='valueVnd'
 path=BASE+'vnm-s2-public-disclosure/2026-11-13/S2_PUBLIC_DISCLOSURE_CALCULATIONS.json';d=json.loads((ROOT/path).read_text())
 reviewed={
 'cashInterest9m':('CASH_INTEREST_PAID','2026-01-01','2026-09-30'),
 'cashInterestPrior9m':('CASH_INTEREST_PAID','2025-01-01','2025-09-30'),
 'cfo9m':('CFO','2026-01-01','2026-09-30'),
 'cfoPrior9m':('CFO','2025-01-01','2025-09-30'),
 'interestExpense9m':('INTEREST_EXPENSE','2026-01-01','2026-09-30'),
 'interestExpensePrior9m':('INTEREST_EXPENSE','2025-01-01','2025-09-30'),
 'revenue9m':('REVENUE','2026-01-01','2026-09-30'),
 'grossProfit9m':('GROSS_PROFIT','2026-01-01','2026-09-30'),
 'currentAssets':('CURRENT_ASSETS','2026-09-30','2026-09-30'),
 'currentLiabilities':('CURRENT_LIABILITIES','2026-09-30','2026-09-30'),
 'inventoryGross':('INVENTORY_GROSS','2026-09-30','2026-09-30'),
 'shortDebt':('SHORT_TERM_FINANCIAL_BORROWINGS','2026-09-30','2026-09-30')}
 for key,(concept,start,end) in reviewed.items():
  add(path,'/reportedInputsVnd/'+key,{},concept,'STANDALONE',start,end,'Q3_2026_PRESENTATION',{},'REUSED_S2_REPORTED_INPUT')
  bindings[-1]['scalarReviewedCell']=True
  bindings[-1]['evidenceReference']=('docs/fundamental-data-engine/vnm-s2-public-disclosure/2026-11-13/PARENT_Q3_SELECTED_FLOWS.json' if start != end else 'data/manual-extracted-pdf/supplements/VNM-parent-Q3-2026-cash.json')
  bindings[-1]['evidenceSha256']=digest(ROOT/bindings[-1]['evidenceReference'])
 return bindings

if __name__=='__main__':
 OUT.mkdir(parents=True,exist_ok=True)
 bindings=build();result=evaluate(ROOT,bindings)
 coverage={}
 for row in result['rows']:
  coverage.setdefault(row['concept'],set()).add(tuple(row[k] for k in ['scope','start','end','vintage']))
 coverage={k:[list(x) for x in sorted(v)] for k,v in sorted(coverage.items())}
 for name,data in [('COVERAGE.json',coverage),('MAPPING_CONTRACT.json',{'contract':'retained-financial-mapping-v1','version':'vnm-reviewed-cells-v2','bindings':bindings}),('MAPPED_FINANCIAL_FACTS.json',result)]:
  (OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
 print(json.dumps({'mapped':len(result['rows']),'quarantined':len(result['quarantined']),'conflicts':len(result['conflicts'])}))
