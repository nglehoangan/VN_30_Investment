from pathlib import Path
from decimal import Decimal as D,getcontext
import json,hashlib,sys
sys.dont_write_bytecode=True
from timing import bridge,observed_quarter,dated_cfo,can_upgrade_deposit,envelope
getcontext().prec=45
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
P=R/'docs/fundamental-data-engine/vnm-s2-liquidity/2026-11-13';Q=R/'docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text());rel=lambda p:str(p.relative_to(R))
def out(n,x):(O/n).write_text(json.dumps(x,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
old=read(P/'S2_LIQUIDITY_CALCULATIONS.json');npath=R/'data/manual-extracted-pdf/notes/VNM.json';n=read(npath);q=read(Q/'Q3_SELECTED_PAGES.json');policy=read(O/'Q3_POLICY_SELECTED_PAGE.json');basepins=read(P/'SOURCE_PINS.json')
def nsrc(di,page):
 doc=n['documents'][di];return {'path':rel(npath),'jsonPointer':f'/documents/{di}/pages/{page-1}','pdfPath':doc['pdfPath'],'pdfSha256':sha(R/doc['pdfPath']),'physicalPage':page}
def qsrc(page):return next(x['source'] for x in old['selectedFieldBindings'] if x['source']['physicalPage']==page) if page in [10,13,14,37,38,39,52,53,55] else {'path':rel(Q/'Q3_SELECTED_PAGES.json'),'jsonPointer':'/pages/'+str(next(i for i,x in enumerate(q['pages']) if x['page']==page)),'pdfPath':policy['pdfPath'],'pdfSha256':policy['pdfSha256'],'physicalPage':page}
# Primary numeric values remain financial-statement observations, not aliases of model assumptions.
values=[('cash_and_equivalents','3611993886527',7,'110'),('current_financial_assets','22926037976040',7,'120'),('current_term_investments','22925576515110',7,'123'),('current_assets','40802549102444',7,'100'),('inventory_net','7468559705359',7,'140'),('current_biological_assets','327810079381',7,'150'),('short_borrowings','8384686375137',10,'321'),('current_liabilities','19305205929224',10,'310'),('long_borrowings','97387500260',10,'339'),('dividend_payable','8625546300',10,'313')]
reported=[]
for id,val,page,code in values:
 pg=next(x for x in q['pages'] if x['page']==page);token=f'{int(val):,}'.replace(',','.')
 matches=[{'lineIndex':i,'text':x['text'],'box':[x['x'],x['y'],x['width'],x['height']]} for i,x in enumerate(pg['lines']) if token in x['text']]
 assert matches,(id,token)
 reported.append({'id':id,'valueVnd':val,'asOf':'2026-09-30','scope':'CONSOLIDATED','code':code,'source':qsrc(page) if page==10 else {'path':rel(Q/'Q3_SELECTED_PAGES.json'),'jsonPointer':f'/pages/{q["pages"].index(pg)}','pdfPath':policy['pdfPath'],'pdfSha256':policy['pdfSha256'],'physicalPage':page},'nativeMatches':matches,'meaning':'ISSUER_REPORTED_STATEMENT_VALUE; not a new formal admission or a stress accessibility certificate'})
val={x['id']:D(x['valueVnd']) for x in reported}
assets=[]
for x in old['assets']:
 if x['asOf']!='2026-09-30':continue
 z=dict(x);z.update({'reportedAmountVerified':True,'reportedOwnerScope':'CONSOLIDATED_GROUP','legalEntityAllocation':'NOT_ESTABLISHED','exactMaturityDate':None,'earlyWithdrawalTerms':None,'pledgeVerification':'NOT_ESTABLISHED_EXCEPT_POSTED_SECURITY_DEPOSIT_CAPTION','classificationDecision':'RETAIN_PRIOR_CLASSIFICATION; no newly found instrument access terms'})
 if 'term_deposits' in z['id']:
  z['valuationPolicySource']={'path':rel(O/'Q3_POLICY_SELECTED_PAGE.json'),'physicalPage':28,'finding':'2026 HTM uses amortized cost including allocated interest; book carrying amount is not proof of principal cash withdrawable immediately.'}
  z['currentOrNoncurrentBucket']='CURRENT' if z['id'].endswith('_current') else 'NONCURRENT'
  z['verification']={'identity_verified':True,'maturity_verified':False,'free_use_verified':False,'debtor_access_verified':False};assert not can_upgrade_deposit(**z['verification'])
 if z['id'] in ['GROUP_Q3_bank_cash','GROUP_Q3_cash_equivalents']:
  z['issuerCashPolicy']={'path':rel(O/'Q3_POLICY_SELECTED_PAGE.json'),'physicalPage':27,'finding':'Cash is cash on hand/demand deposits; equivalents readily convertible for short-term cash commitments. Confirms accounting liquidity character, not unrestricted transfer to the parent or exact bank contract access.'}
 assets.append(z)
# Positive accounting-level liquidity indicators, never confused with stress cash.
ratios={'currentRatio':str(val['current_assets']/val['current_liabilities']),'quickProxyExInventoryAndBiological':str((val['current_assets']-val['inventory_net']-val['current_biological_assets'])/val['current_liabilities']),'cashPlusCurrentFinancialAssetsOverCurrentLiabilities':str((val['cash_and_equivalents']+val['current_financial_assets'])/val['current_liabilities']),'scope':'Reported consolidated accounting ratios; term assets included even when stress availability UNKNOWN. Not proof of maturity-matched payment capacity.'}
# Exact declared/paid/remaining lifecycle. PaidJuly cash is not a freshNovember obligation.
opening='8382960340';declared_parent='3866417573250';declared_nci='35032239000';declared=str(D(declared_parent)+D(declared_nci));paid_h1='35088076540';paid9m='3901207226290';junclose='3874744696050';sepclose='8625546300'
bridge(opening,declared,paid9m,sepclose);assert D(opening)+D(declared)-D(paid_h1)==D(junclose)
q3paid=str(D(paid9m)-D(paid_h1));assert D(junclose)-D(q3paid)==D(sepclose)
newdiv=next(x for x in old['obligationSchedule'] if x['id']=='GROUP_oct28_declared_2026_interim')
divbridge={'scope':'GROUP','opening2026_01_01Vnd':opening,'declaredParent9mVnd':declared_parent,'declaredNci9mVnd':declared_nci,'declaredGroup9mVnd':declared,'cashPaidH1Vnd':paid_h1,'payableJune30Vnd':junclose,'cashPaidQ3Vnd':q3paid,'cashPaid9mVnd':paid9m,'payableSep30Vnd':sepclose,'reconciliation':'EXACT; opening+declarations−cash paid=closing; balance and cashflow reconcile with no residual','sources':{'openingAndClosing':qsrc(10),'groupEquityDeclarations':qsrc(58),'h1EquityDeclarations':nsrc(4,58),'h1Payable':nsrc(4,10),'h1CashPaid':nsrc(4,14),'cashPaid9m':qsrc(14)},'oct28Declaration':newdiv,'historicalPaidDividendsAddedToNovember':False,'newDeclarationInSep30Balance':False}
obligations=[{'id':'INTERIM_2026_1','amountVnd':newdiv['amountVnd'],'paymentDate':'2026-11-26','dateCertainty':'EXACT_RETAINED_VSDC_TERMS','source':newdiv['source']},{'id':'SEP30_RESIDUAL_DIVIDEND','amountVnd':sepclose,'paymentDate':None,'dateCertainty':'N/R_UNPAID_RESIDUAL_PAYMENT_DATE','source':qsrc(10)},{'id':'CURRENT_BORROWINGS','amountVnd':str(val['short_borrowings']),'paymentDate':None,'accountingBucket':'CURRENT_AT_2026_09_30','contractDates':'N/R_NO_PER_LOAN_DUE_DATES_IN_REVIEWED_NOTES','classificationEnvelopeEnd':'2027-09-30','classificationEndIsContractDate':False,'source':qsrc(52)},{'id':'LONG_BORROWING','amountVnd':str(val['long_borrowings']),'paymentDate':None,'maturityYear':2030,'dateCertainty':'YEAR_ONLY','source':qsrc(53)},{'id':'ACCRUED_BORROWING_COST','amountVnd':'111393095788','paymentDate':None,'source':qsrc(55)}]
timeline=[{'date':d,**envelope(d,'2026-11-26',newdiv['amountVnd'],str(val['short_borrowings']),'2027-09-30'),'additionalCurrentLeaseCommitmentInterestAndResidualDividend':'N/R_NOT_ZERO','committedFutureCfoVnd':None,'actualCashCoverage':None} for d in ['2026-11-12','2026-11-26','2026-12-31','2027-03-31','2027-06-30','2027-09-30']]
# Supported historical time split only. Do not spreadTTM/12 or assume a57-day receipt.
h1='3473788102329';nine='7745821607312';quarter=observed_quarter(nine,h1,'GROUP','GROUP')
flows={'scope':'GROUP','H1_2026':{'amountVnd':h1,'start':'2026-01-01','end':'2026-06-30','source':nsrc(4,13)},'Q3_2026':{'amountVnd':quarter,'start':'2026-07-01','end':'2026-09-30','derivation':'9M2026−H1_2026; same consolidated scope','operands':[qsrc(13),nsrc(4,13)]},'YTD9M2026':{'amountVnd':nine,'source':qsrc(13)},'TTM_2026_09':{'amountVnd':old['flows']['GROUP_TTM_2026_09']['cfo'],'role':'HISTORICAL_RUN_RATE_SENSITIVITY_ONLY','source':rel(P/'S2_LIQUIDITY_CALCULATIONS.json')},'futureByDate':{'2026-11-26':dated_cfo(old['flows']['GROUP_TTM_2026_09']['cfo'],None,'HISTORICAL_CFO'),'status':'N/R_NO_SUPPORTED_FUTURE_RECEIPT_ALLOCATION; not a forecast of zero CFO','equalMonthlyAllocationApplied':False,'guaranteedReceiptCreditVnd':'0'}}
# Annual population changes cannot be inferred from investing cashflow arithmetic.
commitments={'openingFY2025':{'parentLeaseWithin1yVnd':'135806785351','groupLeaseWithin1yVnd':'197157511157','parentSignedCapexVnd':'395804646115','groupSignedCapexVnd':'2828987961933','source':rel(P/'S2_LIQUIDITY_CALCULATIONS.json')},'reviewedInterimNotes':[{'source':nsrc(0,46),'finding':'H1 parent note22 lists foreigncurrency; no current lease/signed-capex rollforward.'},{'source':nsrc(4,60),'finding':'H1 group note24 lists foreigncurrency; no current lease/signed-capex rollforward.'},{'source':newdiv['source']['issuerDeclarationSource'],'finding':'Q3 group note24 lists foreigncurrency; no current lease/signed-capex rollforward.'}],'cashAssetPurchases':{'H1_2026Vnd':'748239561302','YTD9M2026Vnd':'1311506945115','Q3_2026Vnd':str(D('1311506945115')-D('748239561302')),'sources':[nsrc(4,14),qsrc(14)],'meaning':'Cash paid for fixed/long-lived assets; not identification of payments against the old signed commitment population.'},'rollforward':{'openingCommitments':'KNOWN_AT_2025_12_31','newSignedCommitments':None,'paymentsAgainstOpeningContracts':None,'cancellationsOrAmendments':None,'currentRemaining':None,'remainingLeaseSchedule':None,'status':'N/R_NOT_ZERO_NOT_UNCHANGED_ANNUAL'},'subtractAllCashCapexFromOldCommitments':False,'rentExpenseOrPrepaymentEqualsRemainingLease':False,'doubleDeductLeaseFromCfo':False}
# Bounded scope review, not complete negative search of all contracts or bank documents.
review=[]
for di,pages in [(0,[7,8,9,12,13,18,19,29,30,42,46]),(1,[27,28,40,44,45]),(4,[7,10,13,14,26,27,36,37,39,52,53,58,60]),(6,[25,26,34,35,36,47,48,54]),(7,[48,49,80])]:
 for page in pages:review.append({'source':nsrc(di,page),'coverage':'RETAINED_JSON_TEXT_REVIEW; not a new visual or full contract certification'})
checks={'depositNewlyConfirmedAvailableCount':0,'depositStatus':'UNKNOWN_ACCESS_TERMS; numeric balance remains issuer-reported','debtDividendMaturity':'EXACT_DIVIDEND_DATE_AND_SEPARATE_DEBT_BUCKET; no assignment of8.385tn to26November','cfoTiming':'OBSERVED_H1_Q3_SPLIT; future dated funding N/R','leaseCommitmentRemaining':'N/R; rolled annual amount or zero both prohibited'}
report={'contract':'vnm-s2-primary-statement-timing-v1','ticker':'VNM','analysisCutoff':'2026-10-30','latestBalanceDate':'2026-09-30','reviewedAt':'2026-11-13T09:27:10Z','knowledgePurpose':'RETROSPECTIVE_RESEARCH_NOT_HISTORICAL_PIT','primarySourceRule':'Retained issuer PDFs and balance sheet/cash flow/notes are the reported numeric authority; estimates, arithmetic and availability qualifications separate. No source authority or formal fact admission changed.','reportedValues':reported,'reportedRatios':ratios,'assetAccessReview':assets,'dividendLifecycleBridge':divbridge,'obligations':obligations,'datedEnvelope':timeline,'operatingCashTimeSplit':flows,'leaseAndCommitmentReview':commitments,'reviewCoverage':review,'fourRequestedResults':checks,'aggregateScenarioReferences':{'path':rel(P/'S2_LIQUIDITY_CALCULATIONS.json'),'status':'Retained annual stress sensitivities only; not evidence of actual26Nov shortfall or payment default','allCashPlusTtmGap':old['generousDiagnostic']['calculation'],'mustNotInferDefault':True},'S2':'BLOCKING','reason':'Maturity-matched conservative pass cannot be established from reviewed evidence; sufficient unrestricted funding before dates and current mandatory tail remain unverified. This is evidence insufficiency, not proof of failure to pay.','remainingFacts':['Dated access to the needed subset of existing term deposits/funding, including debtor entity and maturity/break/pledge terms.','Residual current noncancellable lease/signed-contract payments or supported upper bounds, with due buckets.'],'S1':'CLOSED_UNCHANGED','newFinancialFactsAdmitted':0,'scoresWritten':False,'VNM17Promoted':False,'databaseMutation':False,'productionActivation':'NOT_AUTHORIZED'}
out('S2_PRIMARY_STATEMENT_RECONCILIATION.json',report)
out('S2_ACCEPTANCE.json',{'status':'BLOCKING','ticker':'VNM','scope':'S2 only','fourRequestedActions':checks,'closureTest':'NOT_ESTABLISHED; cannot infer matched pass or actual funding shortfall from aggregate12month arithmetic','remainingIndispensableFacts':report['remainingFacts'],'sourcePolicy':'Financial statement numeric facts preserved; unknown access/timing not fabricated','S1':'CLOSED_UNCHANGED','newUserReportRequested':False,'newSourceApprovalRequired':False,'productionActivation':'NOT_AUTHORIZED','scores':None})
md=f'''# VNM S2 — đối chiếu BCTC và kỳ hạn

**Đã xử lý bốn yêu cầu bằng tài liệu đã có. S2 còn BLOCKING vì chưa chứng minh được khả năng trả đúng hạn; không kết luận VNM thiếu tài sản hoặc mất khả năng thanh toán.** Không yêu cầu tải lại báo cáo, không mở lại S1/F1/F2/S4.

## Số liệu gốc từ BCTC

BCTC hợp nhất Q3/2026, bảng cân đối tại30/09/2026: tiền/tương đương tiền **3,612 nghìn tỷ**; đầu tư tài chính ngắn hạn **22,926 nghìn tỷ**, gồm tiền gửi/đầu tư nắm giữ đến đáo hạn **22,9256 nghìn tỷ**; vay ngắn hạn **8,385 nghìn tỷ**; nợ ngắn hạn **19,305 nghìn tỷ**. Giá trị báo cáo được đối chiếu mã chỉ tiêu/cột/ngày, PDF/trang và hash; không thay bằng giả định mô hình.

Hệ số hiện hành tính từ BCTC **{D(ratios['currentRatio']):.3f}x**; (tiền + đầu tư tài chính ngắn hạn)/nợ ngắn hạn **{D(ratios['cashPlusCurrentFinancialAssetsOverCurrentLiabilities']):.3f}x**. Đây là chỉ tiêu kế toán có bao gồm tiền gửi UNKNOWN về khả năng dùng đúng hạn, không phải tỷ lệ tiền stress chắc chắn. Thuyết minh IV.3/trang27 xác nhận tiền gồm tiền mặt/tiền gửi không kỳ hạn, tương đương tiền có tính thanh khoản cao phục vụ cam kết chi ngắn hạn. Không được mô tả chúng là tài sản không có tính thanh khoản chỉ vì chưa xác nhận quyền chuyển về công ty mẹ.

## 1. Tiền gửi UNKNOWN

Đã đọc các thuyết minh tiền/đầu tư/vay của FY2025 và H1/2026 riêng lẻ, hợp nhất; bổ sung chính sách Q3 từ PDF đã giữ, kết hợp Q3 notes1/3/4/15. Số dư tiền gửi có kỳ hạn được xác nhận là **số liệu BCTC**. Chính sách IV.4(b)/trang28 xác nhận từ2026 dùng giá trị phân bổ, gồm phân bổ lãi; số dư ghi sổ không đồng nghĩa toàn bộ là gốc có thể rút ngay. Chưa thấy ngày đáo hạn từng khoản, điều kiện rút trước hạn, xác nhận cầm cố và đơn vị sở hữu cho số dư Q3 trong phạm vi đã đọc. Vì vậy **không chuyển thêm khoản tiền gửi có kỳ hạn nào sang CONFIRMED_AVAILABLE**. Đây là UNKNOWN về khả năng dùng đúng hạn, không phải nghi ngờ số dư hoặc suy luận RESTRICTED.

Bảng mới tách `reportedAmountVerified`, bản chất thanh khoản theo chính sách kế toán, và xác minh truy cập theo công ty/ngày. Các khoản ký quỹ vẫn riêng. Số dư công ty mẹ H1 không được coi là số dư mẹ Q3; số hợp nhất không tự chứng minh có thể chuyển hết về mẹ. Báo cáo thường niên FY2025 có nhận định thanh khoản ổn định/hạn mức tín dụng nhưng không cho số hạn mức cam kết còn rút được tạiQ3, nên không cộng thành nguồn tiền.

## 2. Nợ và cổ tức theo kỳ hạn

- Cổ tức tạm ứng công bố28/10: **5.224.888.612.500 đồng**, ngày thanh toán **26/11/2026**, từ2.500đ/cp×share anchor đã chấp thuận. Retained VSDC notice xác nhận ngày; không suy ra từ ngày đăng ký cuối cùng12/11.
- Vay ngắn hạn8.385 nghìn tỷ thuộc bucket ngắn hạn tại30/09, **không có căn cứ gán toàn bộ đến hạn26/11**. Giữ ngày từng khoản N/R. Mốc30/09/2027 chỉ là biên theo phân loại kế toán trong phân tích, không phải ngày hợp đồng.
- Vay dài hạn97,388 tỷ: năm đáo hạn2030, không gán ngày cụ thể. Lãi phải trả111,393 tỷ và cổ tức cũ còn8,626 tỷ giữ riêng, ngày trả N/R.

Cầu nối cổ tức hợp nhất khớp **đúng đến đồng**: đầu năm8.382.960.340 + công bố3.901.449.812.250 − đã trả9tháng3.901.207.226.290 = còn8.625.546.300. CuốiH1 phải trả3.874.744.696.050; tiền trả trongQ3 **{D(q3paid):,.0f} đồng** làm giảm về số dưQ3. Không cộng lại phần đã trả này vào nghĩa vụ tháng11. Nghị quyết28/10 là nghĩa vụ mới, không có trong số dư30/09.

`datedEnvelope` trình bày riêng nghĩa vụ ngày cố định và khoảng chưa biết của nợ, không giả lập một lịch trả nợ duy nhất. Không khẳng định số dư nợ/tiền tại30/09 còn nguyên vào30/10 hay26/11 khi thiếu giao dịch giữa kỳ.

## 3. Dòng tiền kinh doanh theo thời gian có bằng chứng

BCLCTT hợp nhất: H1/2026 **3,474 nghìn tỷ**,9tháng **7,746 nghìn tỷ**; quýIII suy ra cùng phạm vi **{D(quarter)/D(10**12):.3f} nghìn tỷ**. TTM9,406 nghìn tỷ là lịch sử/rate sensitivity. Không chia đềuTTM cho12tháng, không tự tạo dòng tiền57ngày hoặc coi toàn bộ là nguồn chắc chắn trước26/11. Nguồn CFO tương lai theo ngày **N/R**; việc không cấp tín dụng nguồn tiền chắc chắn không có nghĩa dự báo CFO bằng0.

Kịch bản annual stress cũ được giữ làm sensitivity, không biến chênh lệch600tỷ của phép cộng12tháng thành kết luận thiếu tiền thực tế vào26/11. Bằng chứng BCTC cho thấy nền tài sản thanh khoản đáng kể; điều chưa chứng minh là ghép đúng kỳ hạn/quyền sử dụng dưới stress.

## 4. Thuê và cam kết đã ký

Đã đối chiếu population cuốiFY2025 với thuyết minh H1 riêng lẻ/note22, H1 hợp nhất/note24 và Q3/note24. Interim notes đã đọc không cung cấp rollforward nghĩa vụ thuê/cam kết vốn còn lại. Tiền mua tài sản H1 **748,240 tỷ**,9tháng **1.311,507 tỷ**, quýIII **563,267 tỷ** là tiền đã chi; chưa có mapping đến từng hợp đồng đầu năm, hợp đồng ký mới/hủy/sửa. Vì vậy không lấy cam kếtFY2025 trừ toàn bộ tiền mua tài sản để gọi là số còn phải trả.

Số còn lại và kỳ hạn hiện tại **N/R**, không phải0, không giữ nguyênFY2025. Tiền thuê đã nằm trong CFO không bị trừ thêm lần nữa. Chi đầu tư tùy ý/cổ tức chưa công bố không tự đưa vào nghĩa vụ bắt buộc.

## Acceptance và giới hạn

METRIC_DEFINITIONS §§5.2–5.3,10.2,13.1 và SCORING_MODEL §13.4 giữ nguyên. S2 chưa có matched conservative pass; còn đúng hai dữ kiện thiết yếu: (a) khả năng dùng đúng hạn của **phần tiền gửi/nguồn tài trợ cần thiết**, (b) nghĩa vụ thuê/cam kết hiện tại hoặc upper bound có nguồn. Không đòi chứng nhận toàn bộ tiền gửi hay bảng dự án. Không tự chấm điểm, cấp authority, promotionVNM17, thay danh mục/NAV hoặc kích hoạt production. S1 giữ CLOSED.

S2_PRIMARY_STATEMENT_RECONCILIATION.json có số gốc/provenance, access review, cầu nối cổ tức, timeline, CFO split và review coverage; VALIDATION.json ghi kiểm chứng thực tế. Các báo cáo cũ được giữ nguyên cho audit, kết luận kỳ hạn ở đây là bản kế nhiệm.
'''
(O/'S2_TIMING_RECONCILIATION.md').write_text(md)
register=(P/'CURRENT_BLOCKER_REGISTER.md').read_text();a=register.index('## LIQUIDITY');b=register.index('## POSITION_AND_VALUATION',a)
register=register[:a]+'''## LIQUIDITY

**BLOCKING — matched conservative payment capacity NOT ESTABLISHED.** Use S2_ACCEPTANCE.json and S2_PRIMARY_STATEMENT_RECONCILIATION.json here. Reported financial-statement balances are verified; do not describe UNKNOWN access as missing balances or restricted money. Fixed26Nov dividend is separate from current-loan bucket. Historical12month600bn diagnostic is not an actual26Nov funding shortfall. Only needed subset of dated unrestricted funding and current lease/signed-commitment tail or supported upper bound remain indispensable. Exact dividend lifecycle and H1/Q3 operating cash split reconcile; no equal future allocation. Contracts METRIC_DEFINITIONS §§5.2–5.3,10.2,13.1. S1 CLOSED and other statuses unchanged.

'''+register[b:]
(O/'CURRENT_BLOCKER_REGISTER.md').write_text('# S2 primary-statement/timing successor\n\nOnly S2 interpretation updated; inherited other gates retain their original evidence/review dates.\n\n'+register)
paths=[npath,P/'S2_LIQUIDITY_CALCULATIONS.json',P/'CURRENT_BLOCKER_REGISTER.md',P/'SOURCE_PINS.json',Q/'Q3_SELECTED_PAGES.json',Q/'WACC_Q3_INPUTS.json',O/'Q3_POLICY_SELECTED_PAGE.json',R/policy['pdfPath'],R/'docs/03 SCORING/METRIC_DEFINITIONS.md',R/'docs/01 SYSTEM/SCORING_MODEL_v1.0.md',R/'docs/fundamental-data-engine/vnm-s4-skills/2026-11-11/OFFICIAL_HTML_TEXT.json',R/'docs/fundamental-data-engine/vnm-s4-skills/2026-11-11/official/201961.html']
paths.extend(R/n['documents'][i]['pdfPath'] for i in [0,1,4,6,7])
protected=basepins['protected'];assert all(sha(R/x['path'])==x['sha256'] for x in protected)
out('SOURCE_PINS.json',{'inputs':[{'path':rel(p),'sha256':sha(p)} for p in paths],'scripts':[{'path':rel(p),'sha256':sha(p)} for p in sorted(O.glob('*.py'))],'protected':protected,'reacquisitions':0,'note':'Only local extraction of absent Q3 cash policy. Original statements/receipts and previous reports remain unchanged.'})
print('Built primary-statement/timing successor; S2 BLOCKING, S1 unchanged.')
