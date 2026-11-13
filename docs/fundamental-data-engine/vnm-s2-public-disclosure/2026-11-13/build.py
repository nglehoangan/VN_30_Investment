from pathlib import Path
from decimal import Decimal as D,getcontext
import hashlib,json,sys
sys.dont_write_bytecode=True
getcontext().prec=45
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();rel=lambda p:str(p.relative_to(R))
def out(n,x):(O/n).write_text(json.dumps(x,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
cashfile=R/'data/manual-extracted-pdf/supplements/VNM-parent-Q3-2026-cash.json';notefile=R/'data/manual-extracted-pdf/supplements/VNM-parent-Q3-2026-liquidity-notes.json';ef=R/'docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/evidence-products.json';e=read(ef);flow=read(O/'PARENT_Q3_SELECTED_FLOWS.json');cashsrc=read(cashfile);notes=read(notefile)
# Numeric observations are pinned separately from availability and reserve assumptions.
facts={'cash':'2286769972647','currentTermInvestments':'17939270301369','shortDebt':'8258858000000','oldDividendPayable':'8402140170','futureDeclaredDividend':'5224888612500','inventoryGross':'5625070644752','currentLiabilities':'17710749819998','currentAssets':'31425974433231','revenue9m':'44844360570214','grossProfit9m':'20203738991375','cfo9m':'6403516361118','cfoPrior9m':'6008806696051','cashInterest9m':'270654202830','cashInterestPrior9m':'191546960274','interestExpense9m':'315977514114','interestExpensePrior9m':'206380850688'}
locators=[]
for k,page in [('revenue9m',10),('grossProfit9m',10),('cfo9m',12),('cfoPrior9m',12),('cashInterest9m',12),('cashInterestPrior9m',12),('interestExpense9m',12),('interestExpensePrior9m',12)]:
 pg=next(x for x in flow['pages'] if x['physicalPage']==page);token=f'{int(facts[k]):,}'.replace(',','.');matches=[{'lineIndex':i,'text':x['text'],'box':[x['x'],x['y'],x['width'],x['height']]} for i,x in enumerate(pg['lines']) if token in x['text']];assert matches,k
 locators.append({'field':k,'valueVnd':facts[k],'pdfPath':flow['pdfPath'],'pdfSha256':flow['pdfSha256'],'physicalPage':page,'matches':matches,'column':'9M2026' if 'Prior' not in k else '9M2025'})
F={k:D(v) for k,v in facts.items()};hist=e['facts'];cfo=D(hist['parentCfo25']['value'])+F['cfo9m']-F['cfoPrior9m'];cashint=D('274593598630')+F['cashInterest9m']-F['cashInterestPrior9m'];intexp=D('289972001368')+F['interestExpense9m']-F['interestExpensePrior9m'];reserve=D(hist['parentLease1y']['value'])+D(hist['parentSignedCapex25']['value']);scenarios=[]
for label,drop,margin,wclock in [('BASE','0','0','0'),('STRESS_15','.15','.02','.10'),('STRESS_25','.25','.03','.20')]:
 d,m,w=map(D,[drop,margin,wclock]);rev=F['revenue9m']*D(4)/3;gp=F['grossProfit9m']*D(4)/3
 op=cfo+cashint-gp*d-rev*(1-d)*m-F['inventoryGross']*w;interest=intexp+F['shortDebt']*(D('.02') if d else D(0))
 for rm in [D(0),D(1),D(2)]:
  # Reserve is an explicit analytical allowance, not an actual remaining contractual balance.
  need=F['shortDebt']+F['oldDividendPayable']+F['futureDeclaredDividend']+interest+reserve*rm
  break_even=max(D(0),(need-F['cash']-op)/F['currentTermInvestments'])
  for access in [D(1),D('.75'),D('.5'),D(0)]:
   resources=F['cash']+F['currentTermInvestments']*access+op
   scenarios.append({'case':label,'termInvestmentAccessFractionAssumed':str(access),'assumedAllowanceMultiple':str(rm),'allowanceVnd':str(reserve*rm),'stressedOperatingCashBeforeFutureInterestVnd':str(op),'futureInterestVnd':str(interest),'obligationsPlusAllowanceVnd':str(need),'resourcesNetOperatingOutflowVnd':str(resources),'surplusVnd':str(resources-need),'coverage':str(max(D(0),resources)/(need+max(D(0),-resources))),'breakEvenAccessFraction':str(break_even),'coversUnderAssumptions':resources>=need,'actualDepositAccessVerified':False,'actualCommitmentRemainingVerified':False,'noCfoTimingGuarantee':True})
key=[x for x in scenarios if x['case']=='STRESS_25' and x['assumedAllowanceMultiple']=='2']
result={'contract':'vnm-s2-public-disclosure-assessment-v1','ticker':'VNM','scope':'STANDALONE','balanceDate':'2026-09-30','separateDividendOverlay':{'declaredDate':'2026-10-28','paymentDate':'2026-11-26','amountVnd':facts['futureDeclaredDividend'],'includedInSep30Liabilities':False},'ownerInstruction':'Use accessible public reporting; exact per-deposit contract details are not universally mandatory; use annual/half-year detail when actually disclosed. Not authorization to invent unrestricted balances.','reportedInputsVnd':facts,'newFlowNativeLocators':locators,'historicalCfoTTMVnd':str(cfo),'historicalCashInterestTTMVnd':str(cashint),'baseInterestExpenseTTMVnd':str(intexp),'referenceAllowance':{'annualDate':'2025-12-31','leaseWithin1yVnd':hist['parentLease1y']['value'],'signedCapexVnd':hist['parentSignedCapex25']['value'],'totalVnd':str(reserve),'multiplesTested':['0','1','2'],'meaning':'Historical-scale analyst reserve sensitivity. 0 is a diagnostic, not proof of no obligation; 1/2 are not verified current balances or proven upper bounds. Retain actual current amount null.','actualRemainingCurrentVnd':None},'staticReportedIndicators':{'cashAndCurrentInvestmentsVnd':str(F['cash']+F['currentTermInvestments']),'overReportedShortBorrowings':str((F['cash']+F['currentTermInvestments'])/F['shortDebt']),'overAllCurrentLiabilities':str((F['cash']+F['currentTermInvestments'])/F['currentLiabilities']),'currentRatio':str(F['currentAssets']/F['currentLiabilities']),'unrestrictedCoverageCertified':False},'scenarios':scenarios,'headlineStressWithAllowance2x':key,'methodControls':['Exact deposit maturity/withdrawal-processing clauses not mandatory inputs for a12month public-data assessment.','Current term-investment balance is eligible only conditionally in scenarios; no CONFIRMED_AVAILABLE upgrade from absence of a pledge note.','Use disclosed restriction amount when available; missing disclosure is not a certified zero. Do not carry annual zero/amount toQ3 as verified unchanged.','Annual/half-year liquidity tables used only if found, not presumed to exist; source date/freshness always explicit.','12month current loan bucket, no equal monthly amortization or assignment of all debt to26Nov.','CFO repeats only as sensitivity; add back historic cash interest then substitute future expense once.','Operating working capital and lease cash embedded in CFO; extra annual-scale allowance is a deliberate adverse buffer, not a second claim about actual unpaid rent.','No full current liability balance added on top of CFO operating-payment flows. Separate stock-only ratios carry all current liabilities.','No company-mother/group mixing, future undeclared dividend, exact project schedule, forced sale or assumed refinancing.','Intraperiod cash adequacy and covenant headroom may remain N/R without blocking completion of public research. Actual scores require M3 reliable evidence and confidence.'],'status':'PUBLIC_DISCLOSURE_ASSESSMENT_COMPLETED_WITH_LIMITATIONS','formalS2ClosureGranted':False,'whyNoFormalClosure':'Not a private-document demand: scenario results depend on unverified access fractions/current commitment scale. Report conditional evidence and N/R confidence limits; do not turn analyst reserve2x into proof of no material uncertainty.','privateContractDataMandatory':False,'newSourceApprovalRequired':False,'S1':'CLOSED_UNCHANGED','fullScore':None,'VNM17Promoted':False,'productionActivation':'NOT_AUTHORIZED'}
out('S2_PUBLIC_DISCLOSURE_CALCULATIONS.json',result)
out('S2_ACCEPTANCE_SUCCESSOR.json',{'status':result['status'],'formalS2ClosureGranted':False,'supersedes':'Prior requirement for exact deposit schedules/private withdrawal clauses as mandatory S2 data inputs. Prior reported source observations and original sealed evidence preserved.','mandatoryPrivateDataRequests':[],'publicResearchCompleted':True,'actualUnknownsPreserved':['Instrument restriction/access facts','Exact within-year due dates','Current remaining signed/lease obligations'],'handling':'Disclosure-aware12month sensitivity; update using actual annual/half-year disclosures when available. N/R exact timing not a universal current-research blocker.','materialLimitation':'STRESS25 with allowance2x passes at100% access, marginally fails at75%; economic robustness cannot be certified by choosing100% alone. No additional owner approval/source request created.','scope':'Company-parent liquidity research; no formal financial/scoring admission','S1':'CLOSED_UNCHANGED','productionActivation':'NOT_AUTHORIZED'})
md='''# VNM S2 — đánh giá theo dữ liệu công bố

Đã thay yêu cầu hợp đồng nội bộ bằng đánh giá12tháng theo BCTC công khai. Không bắt buộc ngày đáo hạn từng sổ, điều khoản xử lý rút tiền hoặc lịch chi theo tháng để hoàn thành nghiên cứu thanh khoản. Dùng thuyết minh năm/bán niên khi có; không mặc định mọi báo cáo đều có bảng kỳ hạn hay mọi thông tin hợp đồng không bao giờ được công bố.

## Cách áp dụng

1. Lấy số dư quý mới nhất, cùng phạm vi công ty mẹ. Tiền2.286,770 tỷ; đầu tư ngắn hạn17.939,270 tỷ; vay ngắn hạn8.258,858 tỷ. Số dư là quan sát BCTC, không phải giả định mô hình.
2. Thông tin hạn chế sử dụng đã công bố được trừ khi có. Nếu chưa công bố, giữ trường thực tế UNKNOWN nhưng chạy dải khả năng tiếp cận100/75/50/0% của tiền gửi trong12tháng. Đây là kịch bản, không nâng thành CONFIRMED_AVAILABLE và không mặc định bị phong tỏa. Tỷ lệ100% theo phân loại ngắn hạn không chứng minh mọi khoản đến hạn trước26/11.
3. Dùng bucket nợ ngắn hạn12tháng; ngày26/11 chỉ áp dụng cổ tức mới5.224,889 tỷ. Cổ tức cũ8,402 tỷ và lãi tài trợ xét riêng. Đối chiếu30/09 tách với overlay nghị quyết28/10; không gọi dòng tiền30/09 là tiền đang có trong tháng11.
4. CFO TTM công ty mẹ là lịch sử/rate sensitivity, không phải số dư tiền hay nguồn đảm bảo. Stress doanh thu−15/−25%, giảm biên2/3điểm%, khóa thêm10/20% tồn kho, lãi suất+2điểm%; không cấp lợi ích giảm thuế hoặc cắt chi phí. Quy mô hoạt động9tháng×4/3 chỉ là trục annual stress, không dự báo tăng trưởng.
5. Cam kết thuê1năm và vốn đã ký cuối2025 tổng531,611 tỷ làm thước quy mô; thử khoản đệm0/1/2lần. Không gọi khoản đệm này là số còn phải trả hiện tại hoặc giới hạn trên đã được chứng minh. Thông tin bán niên/quý mới được kiểm tra để cập nhật khi có; không mặc định số cũ không đổi hoặc bằng0.
6. Chấm mức chắc chắn/giới hạn theo METRIC_DEFINITIONS §§5.2–5.3,13.1 và SCORING_MODEL §13.4; giữ N/R cho kiểm tra trong từng tháng hoặc covenant chưa có. Không tạo điểm0/midpoint, không tự cấp điểm cao chỉ từ một tỷ lệ.

## Kết quả tham chiếu

Kịch bản stress−25%, khoản đệm2lần531,611tỷ, cùng dòng tiền/vay/cổ tức công ty mẹ:

| Phần tiền gửi tham gia nguồn12tháng — giả định | Dư/(thiếu), tỷ đồng |
| --- | ---: |
'''
for x in key:md+=f"| {D(x['termInvestmentAccessFractionAssumed'])*100:.0f}% | {D(x['surplusVnd'])/D(10**9):,.3f} |\n"
md+=f'''
Điểm hòa vốn **{D(key[0]['breakEvenAccessFraction'])*100:.2f}%** trong bộ giả định này. Đây là ngưỡng độ nhạy, không phải tỷ lệ tiền thực tế đã xác nhận. Full-access case dư khoảng4.340tỷ;75% access thiếu khoảng145tỷ. Vì vậy không chọn full-access case để tự chứng nhận stress hoàn toàn vững chắc. Không có kết luận doanh nghiệp mất khả năng chi trả.

## Disposition

**Nghiên cứu theo dữ liệu công bố đã hoàn thành có giới hạn.** Bỏ yêu cầu bắt buộc các tài liệu nội bộ; không yêu cầu người dùng cung cấp lại báo cáo hoặc xác nhận điều khoản hợp đồng. Các UNKNOWN thực tế được giữ, tác động đi vào độ nhạy và confidence. Quyền truy cập tiền gửi/quy mô cam kết không bị biến thành sự thật qua giả định.

Chưa tuyên bố formalS2CLOSED hay cấp điểm FH-LIQ/FH-STRESS/CA-DIST từ mô hình này: kết quả còn nhạy với tỷ lệ tiếp cận tiền gửi và khoản đệm cam kết. Đây là giới hạn của kết luận, không phải yêu cầu tái mở source approval hoặc lấy hợp đồng riêng tư. Khi có công bố năm/bán niên mới, cập nhật đúng các trường công bố đó rồi chạy lại; không đòi bảng kỳ hạn không tồn tại. S1 và các S4 đã đóng giữ nguyên. Không portfolio/NAV, M3 weights, source authority hoặc production activation.
'''
(O/'PUBLIC_DISCLOSURE_METHOD.md').write_text(md)
register=(R/'docs/fundamental-data-engine/vnm-s2-timing/2026-11-13/CURRENT_BLOCKER_REGISTER.md').read_text();a=register.index('## LIQUIDITY');b=register.index('## POSITION_AND_VALUATION',a)
register=register[:a]+'''## LIQUIDITY — PUBLIC DISCLOSURE METHOD

Public-data research completed with limitations; see S2_ACCEPTANCE_SUCCESSOR.json and PUBLIC_DISCLOSURE_METHOD.md. Supersedes mandatory private deposit maturity/withdrawal/pledge-contract requests. Latest parent balances and12month debt bucket plus separately declared dividend; annual/half-year details used when actually available. Unknown accessibility and current commitments stay explicit; scenario access and historical-scale reserve are assumptions, never verified facts or hard bounds. Full-access stress passes; reduced-access stress may fail. Formal closure/maximal reliable stress conclusion is not certified solely by choosing a favorable assumption. Intra-month precision is N/R, not a universal current-research source blocker. No new user document/source approval request. S1 remains CLOSED and other groups below retain their original review dates.

'''+register[b:]
(O/'CURRENT_BLOCKER_REGISTER.md').write_text('# S2 disclosure-aware successor register\n\nOnly S2 method/detail requirements superseded; other gates preserved.\n\n'+register)

inputs=[cashfile,notefile,ef,O/'PARENT_Q3_SELECTED_FLOWS.json',R/flow['pdfPath'],R/flow['sourceReceiptPath'],R/'docs/03 SCORING/METRIC_DEFINITIONS.md',R/'docs/01 SYSTEM/SCORING_MODEL_v1.0.md',R/'data/manual-extracted-pdf/notes/VNM.json',R/'docs/fundamental-data-engine/vnm-s2-timing/2026-11-13/S2_ACCEPTANCE.json']
oldpins=read(R/'docs/fundamental-data-engine/vnm-s2-timing/2026-11-13/SOURCE_PINS.json');protected=oldpins['protected'];assert all(sha(R/x['path'])==x['sha256'] for x in protected)
out('SOURCE_PINS.json',{'inputs':[{'path':rel(p),'sha256':sha(p)} for p in inputs],'scripts':[{'path':rel(p),'sha256':sha(p)} for p in sorted(O.glob('*.py'))],'protected':protected})
print('Built disclosure-aware research method; no mandatory private-contract request; no formal closure invented.')
