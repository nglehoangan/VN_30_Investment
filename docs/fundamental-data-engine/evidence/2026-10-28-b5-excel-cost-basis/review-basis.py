from pathlib import Path
import zipfile,xml.etree.ElementTree as E,unicodedata,json,hashlib,datetime
from decimal import Decimal,localcontext,ROUND_HALF_EVEN
R=Path.cwd();P=Path(__file__).resolve().parent;ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
D=Decimal
fmt=lambda x:format(D(x),'f').rstrip('0').rstrip('.') if '.' in format(D(x),'f') else format(D(x),'f')
trades=[];actions=[];inventory=[]
for p in Path('/Users/nglehoangan/Downloads').glob('*.xlsx'):
 name=unicodedata.normalize('NFC',p.name)
 if 'cổ phiếu' not in name:continue
 kind='trades' if 'Lịch' in name else 'stock-actions'
 with zipfile.ZipFile(p) as z:
  ss=[''.join(t.itertext()) for t in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns)] if 'xl/sharedStrings.xml' in z.namelist() else []
  rows={}
  for r in E.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//s:sheetData/s:row',ns):
   vals=[]
   for c in r:
    v=c.find('s:v',ns);v=v.text if v is not None else ''.join(c.find('s:is',ns).itertext()) if c.find('s:is',ns) is not None else ''
    vals.append(ss[int(v)] if c.get('t')=='s' else v)
   rows[int(r.get('r'))]=vals
  period=' '.join(rows[9]).strip();year='2026' if '01/01/2026' in period.split('\n')[0] and '26/10/2026' in period else '2025';ref=kind+'-'+year
  sheet=E.fromstring(z.read('xl/workbook.xml')).find('s:sheets',ns)[0].get('name')
  inventory.append({'sourceRef':ref,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'sizeBytes':p.stat().st_size,'period':period,'sheet':sheet,'worksheetPart':'xl/worksheets/sheet1.xml'})
  for n,v in rows.items():
   if len(v)<5:continue
   try:date=datetime.datetime.strptime(v[1],'%d/%m/%Y').date().isoformat()
   except ValueError:continue
   if kind=='trades':
    q,g,fee,tax=map(D,[v[5],v[7],v[8],v[9]]);assert q*D(v[6])==g
    trades.append({'sourceRef':ref,'row':n,'ticker':v[0],'date':date,'side':v[2],'quantity':fmt(q),'matchedPrice':fmt(v[6]),'grossVnd':fmt(g),'feeVnd':fmt(fee),'taxVnd':fmt(tax),'brokerTradeCostColumn':fmt(v[10]),'cells':{'quantity':'F'+str(n),'matchedPrice':'G'+str(n),'gross':'H'+str(n),'fee':'I'+str(n),'tax':'J'+str(n),'brokerCost':'K'+str(n)}})
   else:actions.append({'sourceRef':ref,'row':n,'ticker':v[0],'date':date,'action':v[2],'quantityChange':fmt(v[3]),'description':v[4],'cells':'A'+str(n)+':E'+str(n)})
assert len(trades)==17 and len(actions)==29
cash=json.loads((R/'docs/fundamental-data-engine/evidence/2026-10-28-b2-cash-excel-screen-review/CASH_HISTORY.json').read_text())
cashRows=[dict(x,sourceRef=r['sourceRef']) for r in cash['reports'] for x in r['rows']]
# Purchases: cash export groups trade principal and purchase fee by trading date, not security.
checks=[]
for date in sorted({t['date'] for t in trades if t['side']=='Mua'}):
 ts=[t for t in trades if t['side']=='Mua' and t['date']==date]
 principal=sum((D(t['grossVnd']) for t in ts),D(0));fees=sum((D(t['feeVnd']) for t in ts),D(0))
 cs=[x for x in cashRows if x['date']==date and x['transactionType'] in ['Trả tiền mua','Trả phí lệnh mua']]
 paidPrincipal=-sum((D(x['amountVnd']) for x in cs if x['transactionType']=='Trả tiền mua'),D(0));paidFees=-sum((D(x['amountVnd']) for x in cs if x['transactionType']=='Trả phí lệnh mua'),D(0))
 assert principal==paidPrincipal and fees==paidFees
 checks.append({'date':date,'tradeGross':fmt(principal),'cashPrincipal':fmt(paidPrincipal),'tradeFees':fmt(fees),'cashFees':fmt(paidFees),'matched':True,'cashPointers':[{'sourceRef':x['sourceRef'],'cells':x['sourceCells']} for x in cs]})
linked=json.loads((R/'docs/fundamental-data-engine/evidence/2026-10-28-b1-public-opening-linkage/LINKAGE_REVIEW.json').read_text());out=[]
for h in linked['holdings']:
 t=h['ticker'];buys=[x for x in trades if x['ticker']==t and x['side']=='Mua'];sells=[x for x in trades if x['ticker']==t and x['side']=='Bán'];assert not sells
 gross=sum((D(x['grossVnd']) for x in buys),D(0));fees=sum((D(x['feeVnd']) for x in buys),D(0));tax=sum((D(x['taxVnd']) for x in buys),D(0));basis=gross+fees+tax;qty=D(h['statementQuantity'])
 broker=sum((D(x['quantity'])*D(x['unitCost']) for x in h['openingPositions']),D(0))
 acts=[a for a in actions if a['ticker'].split('_')[0]==t];movement=sum((D(a['quantityChange']) for a in acts),D(0));ownerBonus=D(20) if t=='FPT' else D(0)
 assert movement+ownerBonus==qty
 with localcontext() as ctx:
  ctx.prec=50;unit=(basis/qty).quantize(D('0.000000000001'),rounding=ROUND_HALF_EVEN)
 out.append({'ticker':t,'quantity':fmt(qty),'buyGrossVnd':fmt(gross),'buyFeesVnd':fmt(fees),'buyTaxesVnd':fmt(tax),'acquisitionBasisVnd':fmt(basis),'acquisitionUnitCostVnd':fmt(unit),'unitPrecision':'12 decimal places HALF_EVEN; exact total retained','brokerImportedDisplayBasisVnd':fmt(broker),'acquisitionMinusBrokerDisplayVnd':fmt(basis-broker),'acquisitionSources':buys,'stockStatementEvents':acts,'stockStatementNetQuantity':fmt(movement),'ownerConfirmedPendingBonusNotInStockExport':fmt(ownerBonus),'quantityReconciles':True,'basisRule':'Buy gross+buy fee+buy tax; stock dividends conserve total cost; cash dividends are separate cash income, no automatic basis reduction','qualification':'CALCULATED_FROM_SUPPLIED_EXCEL_NOT_LIFETIME_COMPLETENESS_CERTIFICATION'})
assert len(out)==11
(P/'EXCEL_INPUTS.json').write_text(json.dumps({'inventory':inventory,'trades':trades,'stockEvents':actions},ensure_ascii=False,indent=2)+'\n')
(P/'CASH_PURCHASE_CHECKS.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n')
result={'schemaVersion':'owner-excel-acquisition-basis-v1','reviewDate':'2026-10-28','sourcePeriodEnd':'2026-10-26','currency':'VND','rows':out,'cashDividendsReduceAcquisitionBasis':False,'custodyFeesCapitalizedIntoPurchases':False,'pendingBonusIncludedInOwnershipQuantity':True,'originalFilesCopied':False,'ledgerChanged':False,'runtimeIntegrated':False,'limitations':['Opening quantity inferred zero for stock-movement replay; no separate opening balance field in exports inspected','FPT20pending bonus supported by owner confirmation and separate retained observations, absent from stock action Excel','Broker current display basis kept separately, not replaced or force-reconciled','Trade cost column is a dated broker field, not necessarily execution price or present accounting cost']}
Pdata=R/'data/account-current';Pdata.mkdir(exist_ok=True);(Pdata/'acquisition-cost-basis.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
lines=['# B5 — giá vốn từ Excel','','Đã đọc lại bốn Excel gốc:17 giao dịch và29 biến động cổ phiếu; đối chiếu tiền mua/phí với hai sao kê tiền. Không cần gửi lại các file đã có.','','Giá vốn mua = giá trị khớp mua + phí mua + thuế mua. Không lấy giá đặt hoặc cột giá vốn broker làm giá khớp. Cổ phiếu thưởng tăng số lượng nhưng giữ tổng giá vốn mua; cổ tức tiền và phí lưu ký được giữ riêng. Các vị thế11mã đang giữ không có giao dịch bán trong tập Excel cung cấp. TPB đã bán hết được giữ trong nguồn kiểm tra, không đưa vào danh mục hiện tại.','','| Mã | SL | Giá vốn mua gồm phí | Bình quân/CP (VND) | Giá vốn hiển thị đã nhập | Chênh lệch |','|---|---:|---:|---:|---:|---:|']
for r in out:lines.append('| '+ ' | '.join(r[k] for k in ['ticker','quantity','acquisitionBasisVnd','acquisitionUnitCostVnd','brokerImportedDisplayBasisVnd','acquisitionMinusBrokerDisplayVnd'])+' |')
lines+=['','Đối chiếu nguồn: EXCEL_INPUTS.json giữ hash/ô nguồn và các giao dịch cần thiết, không giữ số tài khoản/số hiệu lệnh. CASH_PURCHASE_CHECKS.json đối chiếu theo ngày (khi broker gộp nhiều mã cùng ngày). Dữ liệu giá vốn riêng: `data/account-current/acquisition-cost-basis.json`.','','## Kết quả và giới hạn','','Tính xong giá vốn mua từ Excel cho11/11mã; số lượng đối chiếu được với sao kê cổ phiếu và20FPT thưởng do chủ tài khoản xác nhận. Không cần thêm dữ liệu để hoàn thành phép tính này. Chưa chứng minh đầy đủ số dư đầu trước kỳ export.','','Phần B5 còn mở chỉ là đối chiếu quy tắc giá vốn hiển thị TCBS với giá vốn mua: cần định nghĩa broker có điều chỉnh cổ tức tiền, ngày chốt, corporate action và làm tròn như thế nào nếu muốn tái tạo đúng con số TCBS. Không coi số chênh tương tự cổ tức là chứng minh quy tắc. Không bắt người dùng xin lại toàn bộ lịch sử hoặc PDF. Có thể tiếp tục sử dụng giá vốn mua từ Excel như chỉ tiêu riêng đã ghi rõ nguồn/quy tắc; chưa thay thế giá vốn ledger.','','Chưa chỉnh DB, MWAC, bút toán hoặc runtime. Các ảnh và mốc so sánh vẫn giữ nguyên ngày nguồn; không tuyên bố giá vốn đã được broker chấp thuận độc lập.']
(P/'REVIEW.md').write_text('\n'.join(lines)+'\n')
(P/'STATUS.json').write_text(json.dumps({'blocker':'B5','reviewDate':'2026-10-28','status':'EXCEL_ACQUISITION_BASIS_COMPLETE_BROKER_DISPLAY_RECONCILIATION_OPEN','holdingsCalculated':11,'tradeRowsRead':17,'stockRowsRead':29,'purchaseCashDatesMatched':len(checks),'missingExcelFiles':[],'remainingSpecificQuestion':'Which cost-basis definition should the personal app use: acquisition cash+fees, or TCBS display cost? Exact TCBS replication needs documented adjustments/rounding; no guessing.','databaseChanged':False},indent=2)+'\n')
print('Verified17trades,29stockevents,',len(checks),'purchase cash dates;11basis rows saved.')
