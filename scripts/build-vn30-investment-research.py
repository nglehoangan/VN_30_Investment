"""Read-only, dated 30-issuer research; revalue supported models from earnings v4."""
import hashlib
import importlib.util
import json
import sqlite3
from decimal import Decimal, getcontext
from pathlib import Path
from lib.held_normalization import owner_cash, residual_income, present_value, number, text

getcontext().prec=50
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance'
V4=BASE/'2026-11-04/earnings-normalization-v4'
HELD=BASE/'2026-11-02/held-normalization-v1'
OLD=BASE/'2026-10-30/b6-underwriting-r4'
U2=BASE/'2026-11-02/vn30-underwriting-v2'
OUT=BASE/'2026-11-04/investment-research-v1'
D=Decimal
MODELED='ACB FPT GAS HPG MBB MWG SSI TCB VCB VNM VRE'.split()

def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def rel(p):return str(p.relative_to(ROOT))
def dump(p,x):
    p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def verify(path,h):
    if sha(ROOT/path)!=h:raise ValueError('SOURCE_CHANGED:'+path)


def capital_model(book,earnings,growths,discount,terminal):
    b,e,r,tg=map(number,(book,earnings,discount,terminal))
    if b<=0 or e<=0 or not 0<=tg<r or not growths:raise ValueError('INVALID_CAPITAL_MODEL')
    roe=e/b
    flows=[];residuals=[];years=[];initial=b
    for i,g in enumerate(map(number,growths)):
        if not 0<=g<roe:raise ValueError('UNFUNDED_CAPITAL_GROWTH')
        profit=b*roe;retained=b*g;div=profit-retained
        flows.append(div);residuals.append(profit-b*r)
        years.append(dict(year=i+1,openingCommonBook=text(b),earnings=text(profit),retained=text(retained),distributionCapacity=text(div)))
        b+=retained
    if tg>number(growths[-1]) or tg>=roe:raise ValueError('TERMINAL_CAPITAL_GROWTH')
    n=len(years);rim=initial+present_value(residuals,r)+b*(roe-r)/(r-tg)/(1+r)**n
    ddm=present_value(flows,r)+b*(roe-tg)/(r-tg)/(1+r)**n
    if abs(rim-ddm)>D('.000001'):raise ValueError('RIM_DDM_MISMATCH')
    return dict(model='CONDITIONAL_COMMON_CAPITAL_RIM',equityValue=text(rim),ddmCrosscheck=text(ddm),years=years,normalizedRoe=text(roe),capitalHeadroomProven=False,cashDebtAdjustment='0')


def vnm_model(earnings,values,settings,reserve):
    e=number(earnings);da=number(values['depreciationAmortization']);cap=number(settings['maintenance']);res=number(reserve)
    roi=number(settings['incrementalReturn']);r=number(settings['discount']);tg=number(settings['terminal'])
    years=[];flows=[]
    if not 0<=tg<r or number(settings['growth'][-1])!=tg:raise ValueError('INVALID_TERMINAL')
    for i,g in enumerate(map(number,settings['growth'])):
        if not 0<=g<roi:raise ValueError('UNFUNDED_GROWTH')
        e*=1+g;da*=1+g;cap*=1+g;res*=1+g
        growth=e*g/roi;investment=max(growth,res);cash=e+da-cap-investment
        years.append(dict(year=i+1,earnings=text(e),depreciation=text(da),maintenanceAssumption=text(cap),growthFunding=text(growth),standingReserve=text(res),reinvestment=text(investment),commonCash=text(cash)))
        flows.append(cash)
    terminal=flows[-1]*(1+tg)/(r-tg)
    return dict(model='CONDITIONAL_STANDALONE_OWNER_CASH_DCF',equityValue=text(present_value(flows,r)+terminal/(1+r)**len(flows)),years=years,cashDebtAdjustment='0',subsidiaryValuesAddedSeparately=False)


def market_reference(conn,ticker):
    row=conn.execute("SELECT id,body,body_hash FROM broker_observation WHERE kind='TCBS_MARKET_PRICE' AND api_id=? ORDER BY received_at DESC,id ASC LIMIT 1",(ticker,)).fetchone()
    if not row:return None
    id,body,h=row
    if hashlib.sha256(body.encode()).hexdigest()!=h:raise ValueError('MARKET_BODY_HASH')
    p=json.loads(body)
    if p['ticker']!=ticker or p['unit']!='VND_PER_SHARE' or number(p['value'])<=0 or p['tradingDate']>'2026-11-04':raise ValueError('MARKET_DIMENSION')
    rawrow=conn.execute('SELECT body,body_hash FROM broker_observation WHERE id=?',(p['sourceObservationId'],)).fetchone()
    if not rawrow or hashlib.sha256(rawrow[0].encode()).hexdigest()!=rawrow[1]:raise ValueError('RAW_LINEAGE')
    raw=json.loads(rawrow[0])
    if raw['httpStatus']!=200 or hashlib.sha256(raw['raw'].encode()).hexdigest()!=p['rawSourceSha256']:raise ValueError('RAW_RESPONSE')
    payload=json.loads(raw['raw'],parse_float=D);parts=p['sourcePointer'].split('/');cell=payload['data'][int(parts[3])];field=parts[4]
    if field not in ('close','matchPrice') or raw['apiId']!=('5.13' if field=='close' else '5.1'):raise ValueError('PRICE_API_FIELD')
    date=cell.get('tradingDate') if field=='close' else payload.get('tradingDate')
    if len(date)==10 and date[2]=='/':date=date[6:]+'-'+date[3:5]+'-'+date[:2]
    if number(str(cell[field]))!=number(p['value']) or date[:10]!=p['tradingDate'] or (payload.get('ticker')!=ticker if field=='close' else cell.get('symbol')!=ticker):raise ValueError('PRICE_CELL_BINDING')
    return dict(valueVnd=p['value'],tradingDate=p['tradingDate'],receivedAt=p['receivedAt'],field=p['field'],adjustment=p['adjustment'],observationId=id,bodyHash=h,sourceObservationId=p['sourceObservationId'],sourcePointer=p['sourcePointer'],rawSha256=p['rawSourceSha256'],use='DATED_RESEARCH_REFERENCE_NOT_CURRENT_QUOTE',productionAdmissible=False)


def build():
    pins={}
    def pin(p):pins[rel(p)]=sha(p);return dict(path=rel(p),sha256=sha(p))
    for folder in [V4,HELD]:
        m=load(folder/'manifest.json');sourcepins=m.get('inputPins',m.get('sourcePins',{}))
        for p,h in sourcepins.items():verify(p,h);pins[p]=h
        pin(folder/'manifest.json')
    for path,h in load(HELD/'manifest.json')['outputHashes'].items():verify(rel(HELD/path),h)
    u2m=load(U2/'manifest.json');pin(U2/'manifest.json')
    for entry in u2m['issuers']:verify(rel(U2/entry['issuerPath']),entry['sha256'])
    for entry in u2m['components']:verify(rel(U2/entry['path']),entry['sha256'])
    wm=load(V4/'manifest.json')
    for p,h in wm['outputs'].items():verify(rel(V4/p),h)
    pin(V4/'snapshot.json');profiles=load(V4/'snapshot.json')['issuers']
    vp=load(OLD/'vnm-parent-owner-cash-input.json');pin(OLD/'vnm-parent-owner-cash-input.json')
    dbhash=sha(ROOT/'data/vn30.sqlite');conn=sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro',uri=True)
    contexts_path=BASE/'2026-10-30/b6-comparability-r2/native-review-sources.json';pin(contexts_path)
    contexts={x['observationId']:x for x in load(contexts_path)['contexts']}
    results=[]
    for p in profiles:
        t=p['ticker'];old_path=OLD/'issuers'/f'{t}.json';old=load(old_path);pin(old_path)
        supplement_path=U2/'issuers'/f'{t}.json';supp=load(supplement_path);pin(supplement_path)
        anchor=supp['shareAnchor'];anchor_source=None
        if anchor and anchor.get('pdfPath'):
            verify(anchor['pdfPath'],anchor['pdfSha256']);pins[anchor['pdfPath']]=anchor['pdfSha256']
        market=market_reference(conn,t)
        legacy_path=HELD/'issuers'/f'{t}.json';legacy=load(legacy_path) if legacy_path.exists() else None
        if legacy:pin(legacy_path)
        shares=old['currentSharesReference'];pin(ROOT/shares['source'])
        scenarios=[]
        if t in MODELED:
            cv=old['conditionalValuation'] if t in ('ACB','VNM') else legacy
            for s in cv['scenarios']:
                name=s['name'];settings=s['assumptions'];e=p['prudentialWorkingCaseVnd']
                # Core bridge fixed across valuation assumptions; no reapplication of old cycle/fund haircuts.
                if t=='VNM':value=vnm_model(e,vp['valuesByYear']['2025'],settings,cv['workingCapital']['modelReinvestmentReserve'])
                elif t=='ACB':value=capital_model(cv['commonEquityH126'],e,settings['growth'],settings['cost'],settings['terminal'])
                elif legacy['commonBook'] is not None:value=residual_income(legacy['commonBook'],e,settings['growth'],settings['discount'],settings['terminalGrowth'])
                else:value=owner_cash(e,settings['cashConversion'],settings['growth'],settings['incrementalReturn'],settings['discount'],settings['terminalGrowth'])
                keys=('maintenance','growth','incrementalReturn','discount','terminal') if t=='VNM' else (('growth','cost','terminal') if t=='ACB' else ('growth','discount','terminalGrowth','cashConversion','incrementalReturn'))
                applied={k:settings[k] for k in keys if k in settings}
                scenarios.append(dict(name=name,earningsInputVnd=e,valuationAssumptions=applied,
                    legacyAssumptionsNotReapplied={k:v for k,v in settings.items() if k not in applied and k!='name'},oldTaxNciFundCycleSettingsNotReapplied=True,valuation=value,
                    equityValueVnd=value['equityValue'],assumptionBinding=pin(old_path if t in ('ACB','VNM') else legacy_path)))
        vals=[number(s['equityValueVnd']) for s in scenarios]
        eqrange=dict(minimumVnd=text(min(vals)),maximumVnd=text(max(vals)),baseVnd=next(s['equityValueVnd'] for s in scenarios if s['name']=='BASE'),classification='NAMED_SCENARIO_RANGE_NOT_CONFIDENCE_INTERVAL') if vals else None
        refs=[]
        for kind in ('listed','outstanding'):
            count=shares.get(kind,{}).get('value')
            if not count:continue
            refs.append(dict(kind=kind,shares=count,observedAt=shares['date'],source=shares['source'],includesProviderProvisionalRightsWarning=kind=='outstanding',
                perShareRangeVnd=dict(minimumVnd=text(min(vals)/number(count)),maximumVnd=text(max(vals)/number(count))) if vals else None,
                basePerShareVnd=text(number(eqrange['baseVnd'])/number(count)) if vals else None,denominatorQualified=False))
        for ref in refs:
            ref['datedPriceComparison']=dict(priceDate=market['tradingDate'],priceVnd=market['valueVnd'],
                baseScenarioToPriceRatio=text(number(ref['basePerShareVnd'])/number(market['valueVnd'])),
                isMarginOfSafetyAcceptance=False,isCurrentTradingSignal=False) if market and ref['basePerShareVnd'] else None
        native_path=BASE/'2026-10-30/b6-comparability-r2/native-inputs'/f'{t}.json';pin(native_path)
        selected_balance=[]
        for obs in load(native_path)['observations']:
            if obs['periodEnd'] not in ('2025-12-31','2026-06-30') or obs['itemId'] not in ('TOTAL_EQUITY','CASH_AND_EQUIVALENTS','REPORTED_BORROWINGS','BANK_GROSS_CUSTOMER_LOANS','BANK_LOAN_LOSS_RESERVES','BANK_REPORTED_CAR'):continue
            context=contexts[obs['id']]
            source_available=(ROOT/context['sourcePath']).is_file()
            if source_available:verify(context['sourcePath'],context['sourceHash']);pins[context['sourcePath']]=context['sourceHash']
            selected_balance.append(dict(item=obs['itemId'],date=obs['periodEnd'],scope=obs['reportingScope'],
                raw=obs['raw'],normalized=obs['normalized'],observationId=obs['id'],sourceContext=context,
                sourceReplayAvailable=source_available,qualification='RETAINED_REVIEW_INPUT_NOT_NEW_FINANCIAL_ADMISSION',
                totalEquityIsQualifiedCommonCapital=False))
        capital=legacy.get('commonBook') if legacy else (old['conditionalValuation']['commonEquityH126'] if t=='ACB' else None)
        history=old['annualReportedCashBridge']
        if t=='VNM':cash=dict(scope='STANDALONE',values=vp['valuesByYear'],source=vp['source'],reportedCfoIsFcfe=False)
        else:cash=dict(scope='CONSOLIDATED_AS_REPORTED',history=history,reportedCfoIsFcfe=False)
        specific=p['counterevidenceAndRemainingWork']
        blocking=['DATED_SHARE_ACTION_TREASURY_RIGHTS_BRIDGE','PRICE_ADJUSTMENT_BASIS','CURRENT_QUOTE_REFRESH','POST_FY2025_CHANGE_REVIEW','NAMED_ASSUMPTIONS_NOT_CONFIRMED']
        if not scenarios:blocking.append('QUALIFIED_SECTOR_VALUATION_INPUTS_MISSING')
        if p['fundBridgeIsConditionalPlan']:blocking.append('FUND_PLAN_NOT_FINAL')
        if t in ('HPG','VPL'):blocking.append('MAINTENANCE_EXPANSION_WC_DEBT_REPAYMENT_BRIDGE')
        if t in ('BSR','GVR','VIC','VHM','VPL'):blocking.append('ISSUER_SPECIFIC_ECONOMIC_BRIDGE_OPEN')
        if 'BANK' in p['sector'] or t in ('SSI','TCX'):blocking.append('ASSET_QUALITY_AND_DISTRIBUTABLE_CAPITAL')
        key_checks={
            'ACB':'Dân số khoản vay/dự phòng và vốn còn lại sau tăng trưởng.',
            'BID':'Thu hồi nợ, chi phí tín dụng và phân phối quỹ đúng phạm vi.',
            'BSR':'Biên lọc dầu so với kịch bản, subtotal EPS và quỹ cuối cùng thuộc mẹ.',
            'CTG':'Chi phí tín dụng/thu hồi và niên độ phân phối quỹ mẹ.',
            'FPT':'Duy trì biên dịch vụ, thu tiền, vốn tái đầu tư và quyền dòng tiền mẹ.',
            'GAS':'Khả năng thu hồi phải thu, giá/điều khoản khí và nhu cầu vốn dự án.',
            'GVR':'Chu kỳ cao su, thanh lý cây, bồi thường đất và phân phối cuối cùng.',
            'HDB':'Dân số tín dụng nhóm, quỹ mẹ/con và điều khoản trái phiếu chuyển đổi.',
            'HPG':'Biên thép/công suất, vốn duy trì/mở rộng, vốn lưu động và tiền gửi cầm cố.',
            'LPB':'Chất lượng tín dụng, vốn cần giữ và phạm vi báo cáo riêng.',
            'MBB':'Thu hồi nợ, dự phòng ngoài khoản vay, vốn và chênh mẫu số quyền.',
            'MCH':'Thu lãi bên liên quan, vốn lưu động và phân phối quỹ.',
            'MSN':'Phân bổ mảng/NCI, chi phí tái cấu trúc và quyền ưu đãi/chuyển đổi.',
            'MWG':'Biên và hiệu quả chuỗi, hàng tồn kho, thu tiền và chi phí mở rộng.',
            'SAB':'Tách lãi mua rẻ/hoàn nhập khỏi hoạt động, kiểm tra thuế và quỹ.',
            'SHB':'Dân số tín dụng, thu hồi tăng đột biến và phân phối quỹ.',
            'SSB':'Giao dịch PTF, thuế thương vụ và quỹ mẹ/con.',
            'SSI':'Chất lượng tài sản margin, vốn khả dụng, chứng quyền đủ hai chân và cổ phiếu quỹ.',
            'STB':'Chi phí tín dụng/tái cơ cấu, thu hồi và điều kiện phân phối vốn.',
            'TCB':'Đối chiếu khoản vay/phạm vi ứng trước, vốn và cầu nối mẫu số 7,086 so với 10,629 tỷ cổ phần tham chiếu.',
            'TCX':'Lãi giao dịch thực hiện/chưa thực hiện, khoản vay chuyển đổi và vốn khả dụng.',
            'VCB':'Dự phòng khoản vay/liên ngân hàng riêng, thu hồi và vốn giữ lại.',
            'VHM':'Bàn giao/chuyển nhượng, thuế/NCI và mô hình dự án có dữ liệu đủ nếu chọn RNAV.',
            'VIB':'Chi phí tín dụng, thu hồi, quỹ và chi phí phái sinh/FX giữ nguyên.',
            'VIC':'Tài trợ/Novatech/Movian, thuế và quyền phân bổ về mẹ; không giả định một mức thuộc mẹ.',
            'VJC':'Kinh tế bán/thuê lại tàu bay, nghĩa vụ thuê, thuế và tiền hoạt động; giữ nhánh âm.',
            'VNM':'Phạm vi công ty mẹ, chi phí tài chính khác, quỹ cố định và ngân sách tái đầu tư.',
            'VPB':'Ngân hàng/tài chính tiêu dùng, NCI, tín dụng và phân phối quỹ.',
            'VPL':'Tách khách sạn/bất động sản/pool tài chính, trái phiếu và quyền ưu đãi.',
            'VRE':'Thu tiền cho thuê, đầu tư duy trì, loại chuyển nhượng vốn và nghĩa vụ tài trợ.'}
        theses=dict(buy='Chỉ xem xét mua khi giá cùng ngày và mẫu số đã khớp, mô hình/nghĩa vụ đủ căn cứ, đáp ứng biên an toàn và suất sinh lợi theo tiêu chí hiện hành; chưa tự cấp tín hiệu từ bảng này.',
            hold='Chỉ xem xét giữ khi luận điểm kinh doanh còn đúng, quyền cổ đông và khả năng tài trợ không suy giảm; định giá và tỷ trọng vẫn phù hợp. Giữ không phải lựa chọn mặc định khi thiếu dữ liệu.',
            sell='Xem xét bán/giảm khi luận điểm bị bác, nghĩa vụ/quyền pha loãng làm mất giá trị hoặc giá vượt khoảng giá trị có cơ sở sau kiểm tra lại; không bán chỉ vì một mô hình có điều kiện cho kết quả thấp.',
            issuerFalsification=specific,issuerChecksBeforeAction=key_checks[t])
        result=dict(contract='issuer-investment-research-v1',ticker=t,period='FY2025',analysisDate='2026-11-04',scope=p['scope'],
            stage='ADVANCED_TO_REVALUED_SCENARIOS' if scenarios else 'EARNINGS_AND_CAPITAL_REVIEW_VALUATION_OPEN',
            earnings=dict(reportedCommonReferenceVnd=p['reportedCommonReferenceVnd'],reportedReferenceScope=p['referenceScope'],workingScope=p['scope'],workingCaseVnd=p['prudentialWorkingCaseVnd'],adjustments=p['selectedPretaxAdjustments'],binding=pin(V4/'issuers'/f'{t}.json')),
            cashOrCapital=cash,reportedBalanceReferences=selected_balance,commonBookReferenceVnd=capital,commonBookDate='2026-06-30' if capital else None,
            cashDebtDiagnostics=legacy.get('debtReview') if legacy else None,
            modelScenarios=scenarios,equityScenarioRange=eqrange,marketReference=market,
            shareAnchor=anchor,shareArithmetic=supp['shareArithmetic'],datedDenominator=supp['datedDenominator'],providerShareReferences=refs,
            actionBridgeComplete=False,financialSnapshotIsCurrentForecast=False,
            researchConditions=theses,blockingBeforeDatedTradeConclusion=blocking,
            currentSignal='UNDETERMINED_NOT_BUY_HOLD_OR_SELL',acceptedValuePerShare=None,
            financialRulesOrWeightsChanged=False,sourceAdmissionGranted=False,productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False)
        results.append(result);dump(OUT/'issuers'/f'{t}.json',result)
        fmt=lambda x:format(number(x)/D(10**12),'.3f') if x is not None else 'Chưa xác định'
        lines=[f'# {t} — hồ sơ nghiên cứu FY2025','',f"Trạng thái: **{result['stage']}**. Phạm vi lợi nhuận làm việc: **{p['scope']}**. Đây là nghiên cứu hiện tại trên kỳ FY2025, không tái dựng thông tin biết tại năm2025.",'',
            f"Lợi nhuận làm việc: **{fmt(p['prudentialWorkingCaseVnd'])} nghìn tỷ VND**. Lựa chọn: {p['baseChoice']}",'',
            '## Dòng tiền/vốn','',
            'Chi tiết số liệu, kỳ, phạm vi và nguồn ở JSON cạnh hồ sơ. CFO nhóm không tự là FCFE; số vốn không tự chứng minh khả năng phân phối. Tiền/nợ không được cộng/trừ lần nữa nếu lợi nhuận đã giữ thu nhập tài chính và lãi vay.','']
        if capital:lines += [f'Vốn phổ thông tham chiếu H1/2026: **{fmt(capital)} nghìn tỷ VND**; ROE đầu vào được tính từ lợi nhuận v4/vốn tham chiếu, không áp lại ROE mục tiêu cũ của ACB. Mức giữ lại/phân phối vốn vẫn có điều kiện.','']
        if t=='VNM':lines += ['Dùng dòng tiền công ty mẹ FY2025, quỹ đã trích cố định; dự toán duy trì và dự phòng tái đầu tư được tách rõ. Không cộng giá trị công ty con lần nữa.','']
        for row in history:
            if row.get('year')==2025:lines += [f"FY2025 CFO nhóm: {fmt(row.get('cfo'))}; chi mua tài sản: {fmt(row.get('cashAcquisitionSpending'))}; sau chi mua tài sản: {fmt(row.get('reportedPostAcquisitionCash'))} nghìn tỷ VND. Đây không phải dòng tiền có thể phân phối cho mẹ.",'']
        if selected_balance:
            lines += ['| Chỉ tiêu tham chiếu | Ngày | Phạm vi | Giá trị chuẩn hóa / đơn vị |','|---|---|---|---:|']
            for ref in selected_balance:
                lines.append(f"| {ref['item']} | {ref['date']} | {ref['scope']} | {ref['normalized']['value']} / {ref['normalized']['unit']} |")
            lines += ['', 'Tổng vốn chủ không tự là vốn phổ thông; tiền báo cáo không tự là tiền không hạn chế. Đây là đầu vào rà soát giữ nguyên trạng thái, không phải nghiệm thu mới.','']
        lines += ['## Khoảng định giá có điều kiện','']
        if eqrange:
            lines += ['Tính lại từ lợi nhuận v4; giữ các giả định tăng trưởng/chiết khấu/tái đầu tư cũ có nhãn, không áp lại hệ số chu kỳ hoặc haircut quỹ cũ. Khoảng dưới chỉ là các kịch bản đã đặt, không bao mọi rủi ro thuế/quỹ/NCI.','', '| Kịch bản | Giá trị vốn chủ (nghìn tỷ VND) |','|---|---:|']
            lines += [f"| {s['name']} | {fmt(s['equityValueVnd'])} |" for s in scenarios]
            lines += ['',f"Khoảng: **{fmt(eqrange['minimumVnd'])}–{fmt(eqrange['maximumVnd'])} nghìn tỷ VND**. Chưa nghiệm thu giá trị hợp lý.",'']
        else:lines += ['Chưa xuất khoảng định giá: cấu trúc/dòng tiền/quyền vốn chưa đủ cho mô hình phù hợp. Không thay bằng P/E tùy ý hoặc giá trị sổ sách mang tên RNAV.','']
        lines += ['## Cổ phần và ngày giá','']
        if market:lines += [f"Giá tham chiếu DB: **{market['valueVnd']} VND**, phiên **{market['tradingDate']}**; không phải giá hiện tại ngày04/11. Điều chỉnh giá: `{market['adjustment']}`.",'']
        lines += [f"Mốc cổ phần nguồn: {anchor.get('asOf','chưa xác định') if anchor else 'chưa xác định'}. Cầu nối tới ngày giá: **chưa hoàn tất**.",'','| Mẫu số tham chiếu nhà cung cấp | Số cổ phần | Giá trị/cổ phần cơ sở có điều kiện (VND) |','|---|---:|---:|']
        lines += [f"| {r['kind']} | {r['shares']} | {r['basePerShareVnd'] or 'Chưa tính'} |" for r in refs]
        for ref in refs:
            if ref['datedPriceComparison']:
                lines += ['',f"Tỷ lệ giá trị/cổ phần BASE trên giá ngày {market['tradingDate']} với mẫu số {ref['kind']}: **{ref['datedPriceComparison']['baseScenarioToPriceRatio']} lần**. Đây là phép so sánh có điều kiện, không phải biên an toàn đã nghiệm thu."]
        lines += ['', 'Các mẫu số tham chiếu không thay thế quyền phổ thông đã đối chiếu. Không tự coi hai mẫu số khác nhau là khoảng pha loãng đầy đủ.','', '## Điều kiện mua / giữ / bán','']
        lines += [f"- **{label}:** {theses[key]}" for label,key in [('Mua','buy'),('Giữ','hold'),('Bán/giảm','sell')]]
        lines += ['',f"**Điều kiện riêng trước hành động:** {key_checks[t]}",'',f'**Điểm cần kiểm chứng riêng:** {specific}','','**Tín hiệu hiện tại: chưa xác định.** Các điều kiện trên là khung nghiên cứu, không phải lệnh hoặc nhãn HOLD mặc định. Không cần đợi đủ cả30 mã; hồ sơ này có thể tiến riêng khi các ràng buộc của chính mã được khép.','']
        (OUT/'issuers'/f'{t}.md').write_text('\n'.join(lines))
    conn.close()
    if sha(ROOT/'data/vn30.sqlite')!=dbhash:raise ValueError('DATABASE_CHANGED')
    dump(OUT/'snapshot.json',dict(contract='vn30-investment-research-v1',issuerCount=30,revaluedIssuerCount=sum(bool(x['modelScenarios']) for x in results),issuers=results,productionAuthorized=False))
    lines=['# Nghiên cứu từng mã: lợi nhuận → tiền/vốn → định giá → cổ phần/ngày giá → điều kiện giao dịch','',
        '30 hồ sơ được lập riêng; 11 mã đã tính lại kịch bản định giá từ lợi nhuận v4, 19 mã giữ khoảng định giá trống khi chưa có cấu trúc đủ căn cứ. Không cần đợi cả30 mã để tiến từng hồ sơ. Không xuất tín hiệu giao dịch hiện tại vì mẫu số/quyền, giá cập nhật và khả năng phân phối còn cần kiểm tra.','',
        'Đơn vị giá trị vốn chủ: nghìn tỷ VND. Đây là khoảng kịch bản, không phải khoảng tin cậy hoặc giá trị đã nghiệm thu. Nguồn giá DB có ngày, không được gọi là live. Không tái dùng giá trị định giá cũ; không thay tiêu chí, trọng số, source authority hoặc NAV.','',
        '| Mã | LN làm việc | Khoảng vốn chủ | Giá cơ sở/ngày tham chiếu | Giai đoạn |','|---|---:|---|---|---|']
    for x in results:
        e=x['equityScenarioRange'];m=x['marketReference'];f=lambda s:format(number(s)/D(10**12),'.3f') if s is not None else '—'
        lines.append(f"| [{x['ticker']}](issuers/{x['ticker']}.md) | {f(x['earnings']['workingCaseVnd'])} | {f(e['minimumVnd'])+'–'+f(e['maximumVnd']) if e else 'Chưa đủ cấu trúc'} | {m['valueVnd']+' / '+m['tradingDate'] if m else 'Thiếu'} | {x['stage']} |")
    lines += ['', '## Mã có thể tiến trước','',
        '- FPT/GAS/MWG/VNM: có thể rà dòng tiền và dự toán tái đầu tư riêng để phản biện DCF đã tính lại; VNM dùng phạm vi công ty mẹ.',
        '- ACB/MBB/TCB/VCB/SSI: đã tính lại định giá theo vốn/lợi nhuận, bước kế là chất lượng tài sản và khả năng giữ/phân phối vốn. TCB và SSI cần xử lý đặc biệt xung đột mẫu số.',
        '- HPG/VRE: có kịch bản tính lại nhưng cần kiểm tra chu kỳ, duy trì tài sản và dòng tiền; HPG chưa tách xong duy trì/mở rộng.',
        '- 19 mã còn lại đã có hồ sơ nguồn, tiền/vốn, cổ phần/ngày giá và điều kiện phản biện; chưa gắn mô hình có sẵn của mã khác hoặc bịa khoảng giá trị.', '',
        '## Việc quyết định thứ tự hoàn tất','',
        'Ưu tiên theo khả năng khép dữ liệu của từng mã, không phải xếp hạng lợi suất. 11 mô hình dùng các giả định tài chính đã đặt trước đây để đo tác động đầu vào mới; chưa được xác nhận là dự báo đúng. Kiểm tra thay đổi kinh doanh sau FY2025 trước khi dùng giá2026. Không cần đợi quyết toán thuế2026 để phân tích FY2025.', '',
        'Sổ nguồn và từng phép tính ở snapshot/manifest. Các bản đọc nguồn giữ trạng thái cũ; nghiên cứu này không tự nhận nghiệm thu ba báo cáo đầy đủ hoặc scoring/DI. Tỷ suất chuyển đổi tiền, tăng trưởng và chiết khấu là giả định, không được dùng để suy ra khuyến nghị chỉ từ một giá trị/cổ phần.']
    (OUT/'REPORT.md').write_text('\n'.join(lines)+'\n')
    pin(Path(__file__).resolve());pin(ROOT/'scripts/lib/held_normalization.py');pin(ROOT/'scripts/test-vn30-investment-research.py')
    dump(OUT/'manifest.json',dict(contract='investment-research-manifest-v1',inputPins=pins,databaseReadOnlyHash=dbhash,outputs={rel(p):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name not in ('manifest.json','VALIDATION.md')}))
    print(json.dumps(dict(issuers=len(results),revalued=sum(bool(x['modelScenarios']) for x in results),databaseUnchanged=True)))

if __name__=='__main__':build()
