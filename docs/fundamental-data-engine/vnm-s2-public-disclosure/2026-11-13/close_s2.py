"""Successor acceptance of bounded S2 research; no formal scoring/source authority."""
from pathlib import Path
from decimal import Decimal as D
import json,hashlib,sys
sys.dont_write_bytecode=True
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda n:json.loads((O/n).read_text());rel=lambda p:str(p.relative_to(R))
def out(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
def decide(core,*,sources_verified,contract_review_complete,material_contradiction=False,verified_minimum_cash=None):
 if not sources_verified or not contract_review_complete or material_contradiction or not core:return 'BLOCKING'
 if len(core)!=6 or {x['stress'] for x in core}!={'BASE','STRESS_15','STRESS_25'}:return 'BLOCKING'
 if any(x['asOfPurpose']!='2026_10_30_DECLARED_DIVIDEND_OVERLAY' or D(x['cashRetainedForOperationsVnd'])!=0 for x in core):return 'BLOCKING'
 for x in core:
  if D(x['surplusVnd'])<0:return 'BLOCKING'
  if verified_minimum_cash is not None and D(x['surplusVnd'])<D(verified_minimum_cash):return 'BLOCKING'
 return 'CLOSED'
def build():
 j=read('FINAL_S2_CALCULATIONS.json');m=read('S2_M3_CONTRACT_REVIEW.json');p=read('FINAL_SOURCE_PINS.json')
 # Keep every scenario. Core funds modeled operating cash needs from reported liquidity;
 # full-cash ring fence is a separately labeled sensitivity, not a disclosed minimum.
 current=[x for x in j['scenarios'] if x['asOfPurpose']=='2026_10_30_DECLARED_DIVIDEND_OVERLAY']
 core=[x for x in current if D(x['cashRetainedForOperationsVnd'])==0]
 extra=[x for x in current if D(x['cashRetainedForOperationsVnd'])>0]
 verified=all(sha(R/x['path'])==x['sha256'] for group in p.values() for x in group)
 status=decide(core,sources_verified=verified,contract_review_complete=len(m['rows'])==7)
 minimum=min(D(x['surplusVnd']) for x in core);worst_extra=min(D(x['surplusVnd']) for x in extra)
 revised=[]
 for row in m['rows']:
  x=dict(row);x['blocksS2Alone']=False
  if x['contract'].startswith('FH-STRESS'):
   x['supported']='Core public-disclosure12month scenario funds adverse operating cash needs, capex/extra lease allowance, debt, accrued/future interest and declared dividends; all core cases pass without positive future CFO credit or emergency capital actions. All-cash ring fence retained as additional vulnerability sensitivity, not a mandatory observed floor.'
   x['NR']='Exact intraperiod timing and actual minimum operating-cash requirement. No unconditional/max-survival score or guaranteed deposit access inferred.'
  revised.append(x)
 a={'contract':'vnm-s2-closure-acceptance-v1','ticker':'VNM','status':status,'cutoff':'2026-10-30','balanceDate':'2026-09-30','scope':'S2 bounded12month parent liquidity research/evidence gap under owner public-disclosure approach; not a formal financial admission or completed FH-LIQ/FH-STRESS/CA-DIST score','ownerInstruction':'Hãy giải quyết để đóng S2; perform evidence/policy acceptance, not blanket approval of source facts or a score','closureBasis':'METRIC_DEFINITIONS §§5.2,5.3,10.2,13.1 and SCORING_MODEL §13.4 permit evidence-based ranges/N/R; no clause requires preserving all reported cash untouched after funding modeled adverse operating cash needs.','coreScenarioDefinition':'All current-cutoff cases without an additional discretionary ring fence of the entire starting cash balance; zero ring fence is not a claim of zero actual operating-cash requirement. Operating outflows/working-capital stress already funded.','coreScenarios':core,'additionalSensitivities':extra,'coreMinimumSurplusVnd':str(minimum),'additionalSensitivityMinimumSurplusVnd':str(worst_extra),'verifiedMinimumOperatingCashVnd':None,'whyFormerBlockerClosed':'S2_POST_DECLARATION_CASH_BUFFER_DEPENDENCE was elevated from an analyst-only all-cash ring fence to a mandatory acceptance rule without a disclosed minimum or binding M3 clause. Retain sensitivity, remove unsupported mandatory gate.','closedFinding':'S2_POST_DECLARATION_CASH_BUFFER_DEPENDENCE','unresolvedMaterialS2Blockers':[],'newUserInformationRequired':False,'sourceAccessClassificationChanged':False,'conditionality':['Reported current term investments participate in12month research scenarios with observed-scale2.180tn runoff allowance; actual unrestricted access/bank contract terms are not certified.','Investment/lease allowance1.208tn is a traceable scenario budget, not proven current contractual upper bound.','All-cash ring fence scenario remains negative; this limits confidence and maximum-resilience conclusions, not an actual default finding.','No actual October balance rollforward or cash-by-day guarantee; later dividend overlay preserves its date.','Reassess on disclosed restrictions/material commitment/covenant or operating-cash evidence contradicting the researched assumptions. No per-contract private-data demand.'],'confidence':'MEDIUM_BOUNDED_PUBLIC_RESEARCH; intraperiod/funding detail and commitment estimates limited','rubricPoints':{'FH-LIQ':None,'FH-STRESS':None,'CA-DIST':None},'M3ContractReview':revised,'formalFactAdmission':False,'VNM17Promoted':False,'fullVNMScoringReady':False,'S1':'CLOSED_UNCHANGED','F1F2StandingApprovals':'UNCHANGED','S4ClosedIssues':'UNCHANGED','portfolioMutation':False,'productionActivation':'NOT_AUTHORIZED','supersedesOnly':['S2_FINAL_ACCEPTANCE.json BLOCKING','CURRENT_BLOCKER_REGISTER_FINAL.md LIQUIDITY blocker','FINAL_S2_REVIEW.md original-cutoff closure finding'],'originalEvidenceAndScenarioNumbers':'PRESERVED_UNCHANGED'}
 out('S2_CLOSURE_ACCEPTANCE.json',a)
 md=f'''# VNM S2 — CLOSED

**S2 CLOSED tại cutoff gốc30/10/2026**, trong phạm vi khoảng trống phân tích thanh khoản12tháng từ dữ liệu công khai công ty mẹ. Không đổi cutoff sang30/09, không bỏ cổ tức công bố28/10, không tạo source admission hay điểm scoring.

## Sửa đúng điều kiện acceptance

Kết luận BLOCKING cũ yêu cầu mô hình giữ nguyên toàn bộ2.286,77tỷ tiền báo cáo làm tiền không được chạm tới, ngoài nhu cầu vận hành đã stress. Không có bằng chứng công bố về mức dự trữ bắt buộc này, cũng không có điều khoản M3 biến nó thành tiêu chí bắt buộc. Đây là stress bổ sung; không được dùng thất bại của riêng nó để tự tạo data gap. Nhu cầu vận hành âm, khóa vốn lưu động và các khoản chi đã được tài trợ trong core scenario; không bỏ các dòng đó khi phân loại lại.

METRIC_DEFINITIONS §5.2 cho phép so nguồn thanh khoản với nghĩa vụ12tháng; §5.3 yêu cầu severe plausible stress, không yêu cầu đồng thời mọi lớp dự phòng tùy ý; §13.1 và SCORING_MODEL §13.4 cho phép khoảng/N/R theo materiality. CA-DIST §10.2 vẫn cần resilience, nhưng không tự cho1điểm từ tỷ lệ thanh khoản. Mọi nghi vấn thực tế về hạn chế tiền hay nghĩa vụ mới vẫn phải đánh giá lại nếu có bằng chứng; không suy ra tiền gửi chắc chắn tự do từ việc không có ghi chú.

## Bằng chứng và kết quả giữ nguyên

- BCTC riêng Q3: tiền2.286,770tỷ; đầu tư ngắn hạn17.939,270tỷ; vay ngắn hạn8.258,858tỷ. Không dùng cash hợp nhất/CFO hợp nhất.
- Core stress: doanh thu−15/−25%, giảm biên2/3điểm%, khóa thêm10/20% tồn kho, lãi+2điểm%; khoản đệm tiền gửi theo giảm ròng lịch sử tới2.180tỷ, đầu tư/thuê1.208,455tỷ.
- Cộng cổ tức mới5.224,889tỷ, cổ tức cũ8,402tỷ, borrowing accrual109,677tỷ và chi phí lãi tương lai riêng. Không cộng lại cổ tức đã trả, không trừ toàn bộ nợ vận hành lần nữa ngoài CFO.
- Không ghi nhận CFO tương lai dương là nguồn chắc chắn; CFO stress âm cộng vào nhu cầu. Không giả định bán tài sản, phát hành khẩn cấp hoặc nguồn vay mới.
- **Tất cả{len(core)} core cases tại cutoff30/10 đều đủ; dư thấp nhất{minimum/D(10**9):,.3f}tỷ.** Đây là cash headroom sau chi trong mô hình, không phải fair value hay tiền chắc chắn hiện có tháng11.
- **Giữ nguyên stress bổ sung giữ toàn bộ tiền báo cáo: trường hợp thấp nhất{worst_extra/D(10**9):,.3f}tỷ.** Không xóa kịch bản bất lợi. Nó hạn chế confidence/kết luận mức cao nhất, không chứng minh default hay một mức minimum cash chưa được công bố.

Các con số, nguồn và công thức FINAL_S2_CALCULATIONS.json không sửa. Không chọn tỷ lệ100% tiền gửi để đạt: trục runoff2.180tỷ vẫn được kiểm tra đầy đủ. Các thước lịch sử và allowance là giả định nghiên cứu có nguồn, không giả mạo thành điều khoản hợp đồng hoặc hard bounds.

## Đối chiếu M3 và N/R

S2_CLOSURE_ACCEPTANCE.json có đối chiếu đầy đủ7nhóm: FH-LIQ-01/02/03/04, FH-STRESS-01, CA-DIST-01 và missing-data/confidence. Nguồn/nghĩa vụ/bucket và core stress đủ cho kết luận S2 có giới hạn. Exact intra-period matching, covenant headroom, normalized parent interest score, phân bổ retention/buyback và điểm CA-DIST đầy đủ vẫn N/R/unscored. Chúng không thành blanket S2 source-data blocker; không tự gán điểm0/midpoint hoặc max score.

**Không còn blocker vật chất riêng S2 được xác định trong phạm vi này; không cần người dùng cung cấp thêm dữ liệu.** Đây là đóng issue phân tích, không chứng nhận thanh khoản chắc chắn mọi ngày/mọi tình huống, toàn bộ scoring hay production. S1 và các S4 đã đóng, F1/F2 approvals, VNM17 pending, M3/M4, holdings/NAV/source evidence không đổi. S2_CLOSED_ISSUE_REGISTER.md là register kế nhiệm; bản BLOCKING trước đây được giữ nguyên lịch sử.
'''
 (O/'S2_CLOSURE.md').write_text(md)
 reg=(O/'CURRENT_BLOCKER_REGISTER_FINAL.md').read_text();start=reg.index('## LIQUIDITY');end=reg.index('## POSITION_AND_VALUATION',start)
 reg=reg[:start]+'''## LIQUIDITY — CLOSED

S2 CLOSED at original2026-10-30 cutoff for bounded12month parent public-disclosure research. See S2_CLOSURE_ACCEPTANCE.json and S2_CLOSURE.md. Unsupported mandatory all-cash ring fence removed; core adverse operating outflows/working capital, dividends, debt/accrual/interest and investment contingency preserved. Additional negative ring-fence sensitivity retained as confidence limit, no private contract request. No formal scoring/source admission implied. This is a closed issue, not one of the unresolved groups below.

'''+reg[end:]
 reg=reg.replace('five retained current-scoring blocker groups after S1 economic-return closure','four retained current-scoring blocker groups after S1 and S2 analytical closure')
 (O/'S2_CLOSED_ISSUE_REGISTER.md').write_text('# Current S1/S2 successor disposition\n\nS1 and S2 analytical gaps CLOSED; four unrelated current-scoring groups remain unchanged below. Historical runtime observations retain original review dates.\n\n'+reg[reg.index('## LIQUIDITY'):])
 paths=[O/'FINAL_S2_CALCULATIONS.json',O/'S2_M3_CONTRACT_REVIEW.json',O/'S2_FINAL_ACCEPTANCE.json',O/'FINAL_S2_REVIEW.md',O/'CURRENT_BLOCKER_REGISTER_FINAL.md',O/'FINAL_SOURCE_PINS.json',R/'docs/03 SCORING/METRIC_DEFINITIONS.md',R/'docs/01 SYSTEM/SCORING_MODEL_v1.0.md',R/'src/domain/scoring/methodology.ts']
 out('S2_CLOSURE_SOURCE_PINS.json',{'inputs':[{'path':rel(x),'sha256':sha(x)} for x in paths],'scripts':[{'path':rel(x),'sha256':sha(x)} for x in [O/'close_s2.py',O/'validate_closure.py'] if x.exists()],'protected':p['protected']})
 print(json.dumps({'S2':status,'coreCases':len(core),'coreMinimumSurplusVnd':str(minimum),'negativeAdditionalSensitivityPreserved':True}))
if __name__=='__main__':build()
