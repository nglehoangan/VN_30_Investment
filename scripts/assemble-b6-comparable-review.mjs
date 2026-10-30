/** Explicit research inputs; never substitutes descriptive arithmetic for scoring admission. */
import './lib/ts-runtime.mjs';
import assert from 'node:assert/strict';
import {validateSameMethodComparison} from './lib/b6-comparability-validation.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
const {RUBRICS}=await import('../src/domain/scoring/methodology.ts');
const {decimal}=await import('../src/domain/portfolio/values.ts');
const root='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-comparability-r2';
const read=p=>JSON.parse(readFileSync(p,'utf8')),save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const sources=read(root+'/native-review-sources.json'),snapshot=read(root+'/native-review-snapshot.json'),selected=new Set(snapshot.members.map(m=>m.observationId));
const definitions={
 'BQ-EQ':[['NET_INCOME','TOTAL_EQUITY','REVENUE','GROSS_PROFIT'],'Cần ROIC/ROE đúng vốn phổ thông, chuẩn hóa lợi nhuận và chi phí vốn; tỷ suất báo cáo chỉ là tham chiếu.'],
 'BQ-MOAT':[['REVENUE','GROSS_PROFIT'],'Cần bằng chứng lợi thế cạnh tranh, thị phần, quyền định giá và độ bền; BCTC không tự chứng minh moat.'],
 'BQ-CASH':[['CFO','NET_INCOME','RECEIVABLES','CASH_CAPEX_REPORTED'],'Đối chiếu tiền thực thu, vốn lưu động, giao dịch một lần và capex duy trì/tăng trưởng.'],
 'BQ-RES':[['REVENUE','NET_INCOME'],'Cần phân tích tập trung khách hàng, chu kỳ và sức chịu đựng theo phân khúc.'],
 'FH-BS':[['REPORTED_BORROWINGS','TOTAL_ASSETS','TOTAL_EQUITY','BANK_REPORTED_CAR'],'Dư nợ báo cáo không chứng minh toàn bộ nghĩa vụ; đánh giá khoản chưa rõ bản chất tài trợ.'],
 'FH-LIQ':[['CURRENT_ASSETS','CURRENT_LIABILITIES','CASH_AND_EQUIVALENTS','BANK_REPORTED_NPL'],'Tiền báo cáo chưa chứng minh tiền tự do sử dụng; cần kỳ hạn nghĩa vụ và điều kiện thanh khoản.'],
 'FH-STRESS':[['REPORTED_BORROWINGS','NET_INCOME','BANK_REPORTED_CAR','BANK_REPORTED_NPL'],'Cần stress lợi nhuận, lãi suất, đáo hạn/tái cấp vốn hoặc chất lượng tài sản ngân hàng.'],
 'GQ-HIST':[['REVENUE','NET_INCOME_ATTRIBUTABLE_PARENT','BASIC_EPS'],'Cần cầu nối thay đổi phạm vi hợp nhất, chuẩn kế toán và pha loãng trước so sánh tăng trưởng.'],
 'GQ-FWD':[['REVENUE','CASH_CAPEX_REPORTED'],'Cần dự báo theo động lực sản lượng, giá, công suất và xác suất; chưa có dự báo đủ căn cứ.'],
 'GQ-INC':[['CASH_CAPEX_REPORTED','CFO','TOTAL_EQUITY'],'Cần lợi nhuận gia tăng trên vốn tái đầu tư; capex tổng không tách được duy trì/tăng trưởng.'],
 'IC-IND':[['REVENUE'],'Cần dữ liệu ngành/cạnh tranh độc lập với riêng doanh nghiệp, không suy ra từ tăng doanh thu.'],
 'IC-POS':[['REVENUE','GROSS_PROFIT'],'Cần thị phần và so sánh đối thủ cùng định nghĩa/phân khúc.'],
 'IC-CYCLE':[['REVENUE','CFO','INVENTORY'],'Cần vị trí chu kỳ và chuẩn hóa biên/lợi nhuận qua chu kỳ.'],
 'VAL-PRIMARY':[['BASIC_EPS','TOTAL_EQUITY','NET_INCOME_ATTRIBUTABLE_PARENT'],'Cần mô hình đúng ngành, đầu vào vốn/lợi nhuận phổ thông và kịch bản có căn cứ.'],
 'VAL-RET':[['BASIC_EPS','NET_INCOME_ATTRIBUTABLE_PARENT'],'Cần giá trị cuối kỳ, cổ tức và pha loãng theo kịch bản để tính suất sinh lời.'],
 'VAL-MOS':[['BASIC_EPS'],'Cần khoảng giá trị nội tại đã kiểm định; giá thị trường riêng lẻ chưa tạo biên an toàn.'],
 'RG-GOV':[['TOTAL_EQUITY'],'Cần xem ý kiến kiểm toán, sở hữu, bên liên quan và phân bổ quyền lợi cổ đông; chưa chấm từ số tổng.'],
 'RG-RISK':[['REPORTED_BORROWINGS','BANK_REPORTED_NPL'],'Cần ma trận rủi ro, xác suất/tác động và bằng chứng giảm thiểu.'],
 'RG-UNC':[['NET_INCOME','TOTAL_ASSETS'],'Cần lượng hóa mức chưa chắc chắn; thiếu bằng chứng không đồng nghĩa rủi ro thấp.'],
 'CA-REINV':[['CASH_CAPEX_REPORTED','CFO'],'Cần hiệu quả dự án tái đầu tư và phân tách capex.'],
 'CA-DIST':[['CFO','NET_INCOME_ATTRIBUTABLE_PARENT'],'Cần lịch sử cổ tức/mua lại và khả năng chi trả; cổ tức danh mục chờ về không thay dữ liệu doanh nghiệp.'],
 'CA-DIL':[['BASIC_EPS','TOTAL_EQUITY'],'Cần cổ phiếu thực lưu hành, ESOP/quyền chuyển đổi và cầu nối sự kiện vốn; niêm yết không bằng lưu hành.'],
 'CA-PSV':[['BASIC_EPS','NET_INCOME_ATTRIBUTABLE_PARENT'],'Cần giá trị trên mỗi cổ phiếu theo chuỗi đã điều chỉnh sự kiện vốn.'],
};
const sectors={MATERIALS:['MID_CYCLE_EARNINGS_AND_NORMALIZED_FCF','biên chu kỳ5–10 năm, spread/công suất/cost curve, capex duy trì và stress đáy chu kỳ; không dùng lợi nhuận spot làm mẫu số duy nhất'],ENERGY:['NORMALIZED_CASHFLOW_DCF','tách crack spread/biên phân phối, lãi lỗ tồn kho và giá hàng hóa, capex duy trì và stress chu kỳ'],UTILITIES:['CONTRACTED_CASHFLOW_DCF','biểu giá/hợp đồng, thời hạn quyền khai thác, DSCR, capex và rủi ro tái tài trợ'],TECHNOLOGY:['OWNER_EARNINGS_DCF','dòng tiền/capex duy trì, doanh thu hữu cơ, M&A và thay đổi phạm vi hợp nhất, chi phí vốn và tăng trưởng cuối kỳ'],INDUSTRIAL:['MID_CYCLE_OWNER_EARNINGS_DCF','lợi nhuận chu kỳ, capex duy trì, nghĩa vụ thuê/tài trợ, vốn lưu động và backlog'],RETAIL:['NORMALIZED_EARNINGS_AND_DCF','doanh thu/cửa hàng trưởng thành hoặc kênh phân phối, biên bền vững, capex và thuê nhất quán, hàng tồn kho'],BANK:['RESIDUAL_INCOME_AND_DIVIDEND','vốn phổ thông, NPL/dự phòng, CAR, tăng trưởng tín dụng, ROE bền vững và payout'],SECURITIES:['NORMALIZED_EARNINGS_AND_BOOK_VALUE','tách tự doanh/môi giới/margin, lãi lỗ chưa thực hiện, vốn phổ thông và rủi ro thị trường'],REAL_ESTATE:['PROJECT_NAV_AND_SOTP','pháp lý, tiến độ, tỷ lệ sở hữu, doanh thu/chi phí/thuế theo dự án, dòng tiền BCC và nghĩa vụ liên quan'],INSURANCE:['EMBEDDED_VALUE_AND_NORMALIZED_EARNINGS','dự phòng, vốn khả dụng, lợi nhuận khai thác và đầu tư']};
const index=[];
for(const ticker of [...new Set(sources.observations.map(o=>o.ticker))].sort()){
 const path=root+'/native-inputs/'+ticker+'.json',x=read(path),obs=x.observations.filter(o=>selected.has(o.id));
 const facts=(items)=>obs.filter(o=>items.includes(o.itemId));
 const metrics=[];
 for(const [metric,a,b,instantOnly] of [['REPORTED_CFO_TO_TOTAL_NET_INCOME','CFO','NET_INCOME',false],['REPORTED_GROSS_MARGIN','GROSS_PROFIT','REVENUE',false],['REPORTED_TOTAL_NET_MARGIN','NET_INCOME','REVENUE',false],['REPORTED_CURRENT_RATIO','CURRENT_ASSETS','CURRENT_LIABILITIES',true],['GROSS_CUSTOMER_LOANS_TO_CUSTOMER_DEPOSITS','BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS',true],['REPORTED_LOAN_RESERVES_TO_GROSS_LOANS','BANK_LOAN_LOSS_RESERVES','BANK_GROSS_CUSTOMER_LOANS',true]]){
  if(x.sector==='BANK'?!a.startsWith('BANK_'):a.startsWith('BANK_')||['SECURITIES','INSURANCE'].includes(x.sector))continue;
  for(const n of facts([a])){
   const ds=facts([b]).filter(d=>d.periodStart===n.periodStart&&d.periodEnd===n.periodEnd&&d.reportingScope===n.reportingScope&&d.normalized.currency===n.normalized.currency&&d.normalized.unit===n.normalized.unit);
   if(ds.length!==1||!decimal(ds[0].normalized.value).positive||instantOnly&&n.periodStart!==n.periodEnd)continue;
   metrics.push({metric,value:decimal(n.normalized.value).div(decimal(ds[0].normalized.value)).toString(),unit:'RATIO',periodStart:n.periodStart,periodEnd:n.periodEnd,scope:n.reportingScope,operandObservationIds:[n.id,ds[0].id],status:'DESCRIPTIVE_REVIEW_ONLY',limitations:a.startsWith('BANK_')?'Reported customer-loan/deposit or reserve/loan populations only; not regulatory LDR, NPL coverage or normalized credit cost.':'As-reported total population; not common-owner normalized return. No historical growth/comparability or valuation admission.'});
  }
 }
 // Retained note search is discovery only: snippets are not reviewed accounting facts.
 const notes=read('data/manual-extracted-pdf/notes/'+ticker+'.json'),topics={governance:/bên liên quan|kiểm toán|soát xét/i,capital:/cổ phiếu|cổ phần|vốn điều lệ/i,debt:/vay và nợ|thanh khoản|đáo hạn/i,segments:/bộ phận|phân khúc|hoạt động kinh doanh/i};
 const noteCandidates=Object.entries(topics).map(([topic,pattern])=>({topic,status:'RETAINED_SOURCE_PRESENT_REQUIRES_TARGETED_REVIEW',references:notes.documents.flatMap(d=>d.pages.filter(p=>pattern.test(p.text??'')).slice(0,2).map(p=>({pdfPath:d.pdfPaths[0],page:p.page,href:d.pdfPaths[0]+'#page='+p.page,sourceHash:d.sourceHash}))).slice(-4)}));
 const specific=[];
 const issuerBridges=read(root+'/issuer-comparability-bridges.json').bridges.filter(b=>b.ticker===ticker);
 const comparableFacts=ticker==='FPT'?read(root+'/fpt-same-method-comparatives.json').facts:[];
 for(const f of comparableFacts){
  const current=obs.find(o=>o.itemId===f.itemId&&o.periodStart==='2026-01-01'&&o.periodEnd==='2026-06-30');
  const base=obs.find(o=>o.itemId===f.itemId&&o.periodStart===f.period.start&&o.periodEnd===f.period.end);
  assert(current&&base);validateSameMethodComparison(f,current,base);
  metrics.push({metric:'ISSUER_SAME_METHOD_YOY_GROWTH',itemId:f.itemId,value:decimal(current.normalized.value).div(decimal(base.normalized.value)).sub(decimal('1')).toString(),unit:'RATIO',periodStart:current.periodStart,periodEnd:current.periodEnd,basePeriodStart:base.periodStart,basePeriodEnd:base.periodEnd,scope:current.reportingScope,operandObservationIds:[current.id,base.id],formula:'CURRENT_DIVIDED_BY_ISSUER_COMPARABLE_BASE_MINUS_ONE',scopeBasis:f.scopeBasis,status:'DESCRIPTIVE_REVIEW_ONLY',organicGrowthAsserted:false,limitations:'Issuer same-accounting-methodH1 comparison only; not organic growth, annual normalization or TTM evidence',sourceReference:root+'/fpt-same-method-comparatives.json'});
 }
 x.comparability={status:issuerBridges.length||comparableFacts.length?'CHECKED_ISSUER_BRIDGES_REVIEW_ONLY':'NOT_REASSESSED_IN_THIS_CHANGE',issuerBridges,comparablePeriodFacts:comparableFacts,fullYearOrCashflowScopeBridgeProven:false};
 if(ticker==='FPT')specific.push('Đã nối Note39 phải thuFY2025 và dùng Note1 trang18: bốn chỉ tiêu6T2025 được doanh nghiệp trình bày cùng phương pháp vốn chủ đối với FTEL như6T2026. Tăng trưởng6T cùng phương pháp tính được; không gọi là organic. Chưa có cầu nối cả nămFY2025 hoặc dòng tiền cùng phạm vi nên không ghép TTM.');
 if(ticker==='VPL')specific.push('Phạm vi theo chủ tài khoản:FY2023 trở đi. FY2022 và mọi yêu cầu/metric có toán hạng trước2023 đã loại khỏi phân tích hiện tại, giữ nguồn cũ trong audit. Có3 nămFY2023–2025; không giả lập lịch sử5 năm.');
 if(ticker==='MBB')specific.push('CAR6T2026 tạm hoãn theo chủ tài khoản; không dùng CAR cũ thay thế, không gọi là lỗi tải hiện tại.');
 if(['BSR','VHM'].includes(ticker))specific.push('Đã kiểm tra cầu nối issuer từ số cuốiFY2025 gốc sang cột đầu kỳ6T2026 sau phân loại: giữ cả hai vintage và từng điều chỉnh, không ghi đè bản gốc hay tự đổi nhãn cột đầu kỳ.');
 if(ticker==='VIB')specific.push('NPL2,10% dùng tổng tài sản rủi ro tín dụng được phân loại theo báo cáo; không thay mẫu số bằng riêng cho vay khách hàng.');
 if(ticker==='HPG')specific.push('Ba chênh lệch FY2022 PDF/CafeF giữ nguyên trong ledger; chọn PDF cho review, không kết luận provider sai và không trộn thành chuỗi tăng trưởng.');
 if(['LPB','TCX'].includes(ticker))specific.push('Tài liệu năm có nhãn kiểm toán đáp ứng xác nhận loại tài liệu của chủ tài khoản; vẫn tách quy mô hợp nhất/riêng lẻ và thời điểm biết.');
 const [model,needs]=sectors[x.sector]??['NORMALIZED_CASHFLOW_DCF','lợi nhuận/dòng tiền chuẩn hóa, capex duy trì, vốn lưu động và lợi nhuận tái đầu tư'];
 const valuation={status:'MODEL_SELECTED_INPUTS_INCOMPLETE_REVIEW',model,sectorBasis:needs,marketReference:x.marketPrice,marketPurpose:x.marketPurpose,
  commonCapitalEvidence: facts(['NET_INCOME_ATTRIBUTABLE_COMMON','COMMON_EQUITY','NET_INCOME_ATTRIBUTABLE_PARENT','BASIC_EPS']).map(o=>({observationId:o.id,itemId:o.itemId,periodEnd:o.periodEnd,value:o.normalized.value,status:o.itemId==='NET_INCOME_ATTRIBUTABLE_PARENT'?'PARENT_NOT_AUTOMATICALLY_COMMON':'REPORTED_REQUIRES_SHARE_AND_NORMALIZATION_BRIDGE'})),
  outstandingCommonShares:null,listingQuantitySubstitutionAllowed:false,
  scenarios:['BEAR','BASE','BULL'].map(name=>({name,forecast:null,discountRate:null,terminalAssumption:null,fairValuePerShare:null,status:'NOT_ESTIMATED_WITHOUT_SUPPORT',required:needs+'; lãi suất chiết khấu/giá trị cuối kỳ phải có ngày tham chiếu, phương pháp và sensitivity'})),
  ownerNumericalInputRequired:false,completionResponsibility:'AI_RESEARCH_FROM_RETAINED_NOTES_AND_VIETSTOCK_SOURCES; owner supplies only genuinely unavailable source or business assumption if privately known'};
 const rubricInputs=RUBRICS.map(r=>{
  const [items,baseReason]=definitions[r.id];const fs=facts(items);const reason=x.sector==='BANK'&&['BQ-CASH','FH-LIQ','FH-STRESS'].includes(r.id)?'Ngân hàng: dùng chất lượng tài sản, dự phòng, vốn/CAR, kỳ hạn nguồn vốn và thanh khoản; không dùng CFO/NPAT hoặc current ratio của doanh nghiệp công nghiệp. '+baseReason:baseReason;
  return {subcategory:r.id,category:r.category,source:'AI_REVIEW_CANDIDATE',selectedPoints:null,assessment:fs.length?'PARTIAL_EVIDENCE_NOT_POINT_READY':'N_R',
   evidenceTopics:r.topics.map(topic=>({topic,observationIds:fs.map(o=>o.id),topicSupport:'RELATED_FINANCIAL_CONTEXT_ONLY_NOT_PROOF_OF_EVERY_TOPIC'})),rationale:reason,maximumPrerequisite:r.maximumPrerequisite,
   counterEvidence:[...specific,...x.sourceGaps.map(g=>g.itemId+' '+g.periodEnd+': '+g.remainingReason)],sourceCandidates:noteCandidates,
   completionOwner:'AI_REVIEW_REMAINING; do not request owner to re-enter retained values',scoreAuthorized:false};
 });
 assert.equal(rubricInputs.length,23);assert(rubricInputs.every(r=>r.selectedPoints===null));
 const checks=[{id:'source-period-unit',status:x.sourceGaps.length?'INCOMPLETE':'PASS_REVIEW',reason:x.sourceGaps.length?`${x.sourceGaps.length} quan sát nguồn/kỳ chưa nối được`:'Nguồn các quan sát được giữ; chưa phải formal admission'},
 {id:'business-understanding',status:'REVIEW_REQUIRED',reason:needs},
 {id:'auditor-governance',status:'REVIEW_REQUIRED',reason:'Đã chỉ ra trang nguồn, chưa hoàn tất đánh giá ý kiến kiểm toán/bên liên quan'},
 {id:'valuation-and-mos',status:'INCOMPLETE',reason:'Mô hình đã chọn, còn chuẩn hóa/cổ phiếu lưu hành và ba kịch bản có căn cứ'},
 {id:'point-in-time',status:'INITIAL_LIVE_ONLY',reason:'Nguồn tải hiện tại không chứng minh đã công bố tại các ngày lịch sử'}];
 x.legacyMetricCandidates=x.legacyMetricCandidates??x.metricCandidates;x.metricCandidates=metrics;x.financialNarrative={status:'REVIEW_NOT_RECOMMENDATION',specificFindings:specific,descriptiveMetrics:metrics.length,nativeFcfCount:x.nativeDerivations.length,sourceQualificationIncomplete:x.sourceGaps.length,normalizationComplete:false};
 x.rubricInputs=rubricInputs;x.valuationAssumptions=valuation;x.noteEvidenceCandidates=noteCandidates;
 x.stage0Assessment={status:'INCOMPLETE',checks};x.hardVetoAssessment={status:'UNDETERMINED',vetoTriggered:null,reason:'Chưa đủ kiểm tra để kết luận có/không có veto; không mặc định PASS'};
 x.residualRiskAssessment={status:'UNASSESSED',level:null,reason:'Chưa đóng stress/nghĩa vụ chưa phân loại và kiểm định giả định định giá',specificFindings:specific};
 x.remainingInputs=[...checks.filter(c=>c.status!=='PASS_REVIEW'),{id:'23-rubrics',status:'PARTIAL_EVIDENCE_NOT_POINT_READY',reason:'690 mục cho30 mã đã gắn nguồn/bằng chứng liên quan và lý do thiếu; cần nghiên cứu để chọn điểm có căn cứ, không gán điểm trung tính'}, {id:'formal-authority',status:'OUTSIDE_REQUESTED_ITEMS_1_2',reason:'Giữ nguyên seal; bộ này REVIEW_CANDIDATE'}];
 save(path,x);index.push({ticker,sector:x.sector,selectedObservations:obs.length,sourceGaps:x.sourceGaps.length,descriptiveMetrics:metrics.length,nativeFcfCount:x.nativeDerivations.length,rubricRows:23,model,specificFindings:specific,stage0:'INCOMPLETE',readyForScoring:false,ownerNeeds:[],aiWorkRemaining:['Chuẩn hóa lợi nhuận/vốn phổ thông, cổ phiếu lưu hành và sự kiện vốn','Đánh giá notes/rubric và nghĩa vụ chưa phân loại','Kịch bản định giá và stress có căn cứ'],path});
}
save(root+'/decision-input-review-index.json',{status:'PARTIAL_INPUTS_WITH_EXPLICIT_REASONS_NOT_COMPLETE_SCORING',tickers:index.length,rubricRows:index.length*23,descriptiveMetrics:index.reduce((n,r)=>n+r.descriptiveMetrics,0),nativeFcfDerivations:sources.derived.length,rows:index});
console.log(JSON.stringify({tickers:index.length,rubricRows:index.length*23,descriptiveMetrics:index.reduce((n,r)=>n+r.descriptiveMetrics,0),readyForScoring:0}));
