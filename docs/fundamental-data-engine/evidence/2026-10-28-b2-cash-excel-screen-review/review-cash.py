from pathlib import Path
import zipfile,xml.etree.ElementTree as E,unicodedata,json,hashlib,datetime
from decimal import Decimal
P=Path(__file__).resolve().parent;ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
reports=[]
for p in Path('/Users/nglehoangan/Downloads').glob('*.xlsx'):
 if 'Sao kê tiền' not in unicodedata.normalize('NFC',p.name):continue
 with zipfile.ZipFile(p) as z:
  ss=[''.join(t.itertext()) for t in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns)] if 'xl/sharedStrings.xml' in z.namelist() else []
  rows={}
  for row in E.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//s:sheetData/s:row',ns):
   cells={}
   for c in row:
    v=c.find('s:v',ns);v=v.text if v is not None else ''.join(c.find('s:is',ns).itertext()) if c.find('s:is',ns) is not None else ''
    cells[c.get('r')]=ss[int(v)] if c.get('t')=='s' else v
   rows[int(row.get('r'))]=cells
  period=' '.join(rows[9].values()).strip();year='2026' if '01/01/2026 đến' in period else '2025';events=[]
  for n,c in rows.items():
   vals=list(c.values())
   if len(vals)<5:continue
   try:date=datetime.datetime.strptime(vals[0],'%d/%m/%Y').date()
   except ValueError:continue
   amount=Decimal(vals[2]);balance=Decimal(vals[3]);description=vals[4] if 'cổ tức' in vals[1].lower() else None
   events.append({'date':date.isoformat(),'transactionType':vals[1],'amountVnd':format(amount,'f').split('.')[0],'endBalanceVnd':format(balance,'f').split('.')[0],'dividendDescription':description,'sourceCells':{'date':'A'+str(n),'type':'B'+str(n),'amount':'C'+str(n),'balance':'D'+str(n),'description':'E'+str(n)}})
  start=Decimal(events[0]['endBalanceVnd'])-Decimal(events[0]['amountVnd']);running=start;errors=[]
  for e in events:
   running+=Decimal(e['amountVnd'])
   if running!=Decimal(e['endBalanceVnd']):errors.append(e['sourceCells']['balance'])
  reports.append({'sourceRef':'owner-cash-excel-'+year,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'sizeBytes':p.stat().st_size,'periodAsPrinted':period,'worksheetPart':'xl/worksheets/sheet1.xml','sheetName':E.fromstring(z.read('xl/workbook.xml')).find('s:sheets',ns)[0].get('name'),'periodCell':'A9','openingBalanceDerivedVnd':str(start),'closingBalanceVnd':str(running),'rowCount':len(events),'balanceErrors':errors,'rows':events})
reports.sort(key=lambda r:r['sourceRef']);assert len(reports)==2
assert all(not r['balanceErrors'] for r in reports)
assert reports[0]['closingBalanceVnd']==reports[1]['openingBalanceDerivedVnd']
assert reports[1]['closingBalanceVnd']=='327420'
(P/'CASH_HISTORY.json').write_text(json.dumps({'schemaVersion':'owner-cash-excel-history-v1','reviewDate':'2026-10-28','currency':'VND','method':'read-only XLSX XML; exact Decimal arithmetic; sensitive funding descriptions omitted','reports':reports,'continuousYearBoundaryBalance':True,'rowCount':sum(r['rowCount'] for r in reports)},ensure_ascii=False,indent=2)+'\n')
screen={'schemaVersion':'owner-cash-screen-observation-v1','receivedDate':'2026-10-28','capturedAt':None,'source':'Owner attached image in current conversation; no local image path or original-byte checksum available','reviewMethod':'Visual reading of attached image','subaccountLabel':'Thường','currency':'VND','observations':{'cashAtTcbs':'327420','totalMoney':'802420','pendingDividends':'475000','stockPendingBuys':'0','advanceableMoney':'0','bondMoney':'0','fundMoney':'0','blockedMoney':'0','buyingPower':'12479752','withdrawableMoney':'327000','linkedBankAvailable':'12152752','linkedBankBlocked':'0','debt':'420','grossAssets':'91742672','netAssets':'91742252'},'screenNote':'Tiền cổ tức đã trừ 5% thuế thu nhập cá nhân (nếu có).','checks':{'money':'327420 + 475000 = 802420','buyingPower':'327420 + 12152752 - 420 = 12479752','netAssets':'91742672 - 420 = 91742252','withdrawableDifference':'327420 - 327000 = 420'},'interpretations':{'buyingPower':'Separate broker UI capacity including linked bank; not additional TCBS cash or proof of loan availability','pendingDividends':'Net as displayed; not settled cash; issuer/action not shown','debt':'420 as displayed; nature and accrual/payment timeline unknown','withdrawableDifference':'Matches displayed debt numerically; causal linkage not independently evidenced'},'historicalLimits':['Not backdated to October 7/8 or October 26','Does not classify the prior 500000 cash-equivalent component','Does not explain historical debt105 or intermediate390','Does not allocate pending475000 to GAS without issuer/action evidence']}
(P/'SCREEN_OBSERVATION.json').write_text(json.dumps(screen,ensure_ascii=False,indent=2)+'\n')
(P/'STATUS.json').write_text(json.dumps({'reviewDate':'2026-10-28','blocker':'B2','status':'PARTIALLY_RESOLVED','resolved':['Supplied 2025/2026 cash histories arithmetically reconcile to327420','October16 MWG95000 receipt identified from explicit caption and record date','Image classifies cash327420 and pending dividends475000 separately','Image buying power includes linked bank availability; no double count'],'remaining':['Image capture date unknown','Debt420 nature/accrual/payment unknown; prior105/390 transition not established','Historical500000 cash-equivalent category not established'],'databaseChanged':False,'productionAccepted':False},ensure_ascii=False,indent=2)+'\n')
print('Verified',sum(r['rowCount'] for r in reports),'cash rows, closing327420; no balance errors.')
