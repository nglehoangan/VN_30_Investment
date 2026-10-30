"""Publish a review checkpoint, never an acceptance of unfinished issuer valuations."""
import datetime, hashlib, json
from pathlib import Path

BASE=Path('docs/fundamental-data-engine/scoring-dataset-acceptance')
ROOT=BASE/'2026-10-30/b6-underwriting-r4'
def read(p):return json.loads(Path(p).read_text())
def save(p,x):Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def pin(p):
 p=Path(p);return dict(path=str(p),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),size=p.stat().st_size)
index=read(ROOT/'review-index.json');at=datetime.datetime.now(datetime.timezone.utc).isoformat()
prior=BASE/'2026-10-30/b6-economics-r3/artifact-manifest.json'
historical=[]
for name in ['b6-close-inputs-r1','b6-comparability-r2','b6-economics-r3']:
 p=BASE/'2026-10-30'/name/'artifact-manifest.json';m=read(p)
 for item in m['artifactPins']+m['builderPins']:
  assert pin(item['path'])['sha256']==item['sha256'],('HISTORICAL_PIN_CHANGED',item['path'])
 historical.append(dict(manifest=pin(p),artifactPins=len(m['artifactPins']),builderPins=len(m['builderPins']),state='PASS'))
tests=read('/private/tmp/b6-r4-tests.json');unit=read('/private/tmp/b6-r4-normalization-tests.json')
assert tests['success'] and tests['numPassedTests']==70
assert unit['success'] and unit['numPassedTests']==13
save(ROOT/'verification.json',dict(checkedAt=at,state='PASS_IMPLEMENTATION_CHECKS_NOT_ECONOMIC_ACCEPTANCE',focusedTests=dict(total=70,passed=70,files=[r['name'] for r in tests['testResults']]),normalizationUnitAfterAssertionCorrection=dict(total=13,passed=13),scoringRegression=dict(total=127,passed=127,command='pnpm test:scoring'),apiRegression=dict(total=43,passed=43),lint='PASS',typecheck='PASS',productionAuthority=dict(state='PASS',manifestContentHash='8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1',historicalFilesUnchanged=133),historicalReviewPins=historical,fullRepositorySuiteRun=False,productionScoringAuthorized=False))
save(ROOT/'review-policy.json',dict(contract='b6-underwriting-analyst-estimate-policy-v1',reviewer='CHATGPT',independentHumanRequired=False,sourcePriority='PDF_FIRST',scope='REVIEW_CANDIDATE',ownerAuthorization='OWNER_REQUEST_NORMALIZATION_PER_ISSUER_VALUATION_AND_AI_SCORE_ACCEPTANCE',analystForecastsAllowed=True,policyReferences=['docs/03 SCORING/SCORING_ENGINE.md','docs/01 SYSTEM/INVESTMENT_POLICY.md'],rules=['Documented conservative estimates and sensitivities are allowed; future forecasts need not be issuer-proven facts','Keep reported source values, economic adjustments and forecasts separate','Qualification inside arithmetic functions certifies explicit scenario inputs, not formal source or score admission','Do not mix standalone/group scopes or allocate groupcash/NCI by an invented percentage','No bankCFO-minus-capex valuation and no genericdeveloperRNAV for a hotel merely because sector metadata says realestate','Current provisionalpublicshares are reference evidence; retain issue, treasury and conversion uncertainties','No unweighted renormalization of incomplete scores; RG-UNCzero is an assessed high-uncertainty band, not a missing-data substitution','LOWconfidence does not authorize newcapital; no review candidate grants production authority'],productionScoringAuthorized=False))
save(ROOT/'acceptance-review.json',dict(contract='owner-authorized-ai-underwriting-acceptance-v1',reviewedAt=at,reviewer='CHATGPT',independentHumanRequired=False,state='NOT_COMPLETE',technicalVerification='PASS',economicNormalization='PARTIAL',perIssuerValuation='PARTIAL_2_OF_30_HAVE_CONDITIONAL_MODELS',scoreReview='PARTIAL_2_OF_690_RUBRICS_ASSESSED',acceptedPrimaryValuations=0,acceptedTotalScores=0,ownerRequests=[],blockers=[dict(id='ECONOMIC_NORMALIZATION',reason='Complete recurring profit, funds/commonclaims and reinvestment review issuer by issuer; reported cash bridges are not normalizedFCFE'),dict(id='PRIMARY_VALUATION',reason='28issuers still require sectorappropriate primary forecasts;2conditional models need economic admission/crosschecks'),dict(id='SHARE_BRIDGES',reason='Current/common, treasury, provisionalrights and conversion claims must be reconciled before pershare acceptance'),dict(id='RUBRIC_EVIDENCE',reason='688rubrics remainN/R; no total, no redistribution of100point weights'),dict(id='SOURCE_CONFLICT',tickers=['BSR','GVR'],reason='RetainBSRcommonprofit arithmetic conflict andGVRfund table/footnote mismatch')],productionScoringAuthorized=False))
short={
 'ACB':'Đã tách dự phòng cho vay; còn stress vốn/nguồn vốn và cầu nối sau 6T2026.',
 'BID':'Tách thu hồi nợ, dự phòng từng loại tài sản và lợi ích cổ đông thường.',
 'BSR':'Mâu thuẫn tử số EPS 21,135 tỷ; chuẩn hóa chu kỳ lọc dầu và đại tu.',
 'CTG':'Chuẩn hóa dự phòng, quỹ ngoài cổ đông và lợi nhuận bền vững.',
 'FPT':'Giữ cầu nối cùng phương pháp/phạm vi; tách NCI và tái đầu tư.',
 'GAS':'Chu kỳ giá/sản lượng khí, thay thế tài sản và chi đầu tư dự án.',
 'GVR':'Mâu thuẫn quỹ; tách chu kỳ cao su, đất và NCI.',
 'HDB':'Quỹ công ty mẹ chỉ là cầu nối một phần; cổ phần tạm tính khác niêm yết.',
 'HPG':'Chu kỳ chênh lệch giá thép, chạy thử công suất và nguồn tài trợ mở rộng.',
 'LPB':'Giữ phạm vi riêng; chốt quỹ ngoài cổ đông và yêu cầu giữ vốn.',
 'MBB':'Giữ CAR 6T2026 chưa cập nhật; quỹ, rủi ro tín dụng và phát hành cổ phần.',
 'MCH':'Lợi nhuận thường xuyên, quỹ và tiền thực chuyển được cho cổ đông.',
 'MSN':'Nợ truy đòi công ty mẹ, sở hữu công ty con và khả năng chuyển tiền lên.',
 'MWG':'Tái cấu trúc cửa hàng, công ty liên kết và dòng tiền tồn kho/phải trả.',
 'SAB':'Lợi ích thiểu số, quỹ và tiền có thể phân phối; tránh cộng tiền hai lần.',
 'SHB':'Tách thu hồi nợ và hoàn nhập đầu tư khỏi giả định lợi nhuận thường xuyên.',
 'SSB':'Đã mô hình hóa loại lãi bán PTF; thuế/quỹ và vay chuyển đổi chưa chốt.',
 'SSI':'Thu nhập giao dịch/định giá, quỹ toàn nhóm và cổ phiếu quỹ.',
 'STB':'Tái cơ cấu, VAMC, thu hồi nợ và thời điểm xử lý tài sản.',
 'TCB':'Cổ phần tạm tính khác niêm yết; cầu nối quyền và giá cần đối chiếu.',
 'TCX':'Giữ phạm vi riêng; hoạt động thường xuyên, tự doanh và vốn phát hành mới.',
 'VCB':'Tách dự phòng theo tài sản, lợi nhuận bền vững và giữ vốn.',
 'VHM':'Pháp lý, sở hữu, lịch giao dự án, chi phí/thuế còn lại và nợ.',
 'VIB':'Chất lượng tài sản, lợi nhuận lãi/phí, vốn và dự phòng qua chu kỳ.',
 'VIC':'SOTP theo hoạt động, nợ truy đòi, NCI và tài trợ chéo.',
 'VJC':'Bán–thuê lại máy bay, nghĩa vụ thuê/nợ và cam kết đội bay.',
 'VNM':'Đã có DCF tiền công ty mẹ; còn cầu nối hiện tại và giả định đầu tư duy trì.',
 'VPB':'Rủi ro tín dụng theo phân khúc, NCI và lợi nhuận/giữ vốn bền vững.',
 'VPL':'Chỉ từ 2023; dòng tiền khách sạn, công suất, cải tạo, nợ và NAV phù hợp.',
 'VRE':'Khoản đầu tư 2023 gồm đặt cọc; tách cho thuê, chuyển nhượng và cổ phiếu quỹ.'}
lines=['# B6 — Chuẩn hóa và nghiệm thu kinh tế R4','',
 '**B6 chưa hoàn thành.** Kiểm tra kỹ thuật đạt; chuẩn hóa, định giá đủ 30 mã và nghiệm thu điểm tổng còn chưa đạt. Không có yêu cầu bổ sung từ chủ tài khoản ở lần rà soát này.','',
 'Đã tích hợp 39 số liệu dự phòng của 13 ngân hàng, thêm 20 khoản chi mua tài sản được đọc trên PDF và lập 58 cầu nối CFO–chi mua tài sản cho 15 mã phi tài chính. Các cầu nối này giữ phạm vi báo cáo gốc, chưa tự trở thành dòng tiền cho cổ đông thường. VPL chỉ dùng 2023–2025. Khoản hỗn hợp tài sản/đặt cọc VRE 2023 được giữ riêng, không điền 0.','',
 'VNM: đã loại riêng lãi thanh lý ròng 6.136.383.841 đồng, giữ khoản hỗ trợ nhà cung cấp lặp lại, mô hình hóa quỹ 10% và cấp vốn cho tăng trưởng. Không coi chuyển quỹ đầu tư phát triển sang lợi nhuận chưa phân phối là thu nhập mới.','',
 'ACB: dự phòng cho vay được khớp đúng số dư cho vay, gồm cho vay ký quỹ; tỷ lệ bình quân có trọng số ba năm khoảng 0,4167%. Giữ khoản hoàn nhập ngoài cho vay 694 triệu riêng. Lợi nhuận thường theo phép điều chỉnh này khoảng 16.080 tỷ đồng, chưa phải kết luận chuẩn hóa toàn diện. Vốn 6T2026 không được cộng thêm lần nữa khoản chuyển nội bộ để trả cổ phiếu thưởng.','',
 'SSB: loại lãi bán PTF 2.607,318 tỷ đồng với giả định thuế 20% cho kết quả lợi nhuận thường khoảng 3.258,4 tỷ nếu giữ quỹ đã ghi, hoặc 3.321,0 tỷ nếu ước tính lại quỹ 3%. Thuế giao dịch và quỹ cuối cùng chưa được chứng minh; không dùng doanh thu bán 4.300 tỷ thay cho khoản lãi. Khoản vay chuyển đổi chưa xác định số cổ phần được giữ là rủi ro pha loãng.','',
 '## Mô hình đã tính','',
 'Các số dưới đây là **giá trị mô hình trên số cổ phần tham chiếu**, chưa phải giá trị hợp lý được nghiệm thu, mục tiêu giá hay đề xuất đầu tư. Ba kịch bản là giả định của người phân tích.','',
 '| Mã | Phương pháp | Thận trọng | Cơ sở | Tích cực | Đơn vị |','|---|---|---:|---:|---:|---|']
for t,name,file in [('VNM','DCF tiền cho chủ sở hữu','VNM-conditional-owner-valuation.json'),('ACB','Thu nhập thặng dư','ACB-conditional-residual-income.json')]:
 m=read(ROOT/file);values=[s.get('equityValuePerReferenceShare') or s['valuation']['equityValuePerReferenceShare'] for s in m['scenarios']]
 lines.append('| '+t+' | '+name+' | '+' | '.join(f'{float(v):,.0f}' for v in values)+' | đồng/cp tham chiếu |')
lines+=['','Nguồn, phép tính và giả định nằm trong JSON mô hình tương ứng; hồ sơ từng mã nối tới PDF gốc và trang vật lý. Không cộng riêng tiền/tài sản công ty con vào DCF đã bao gồm thu nhập tài chính/cổ tức tương ứng.','',
 '## Điểm và tiêu chí nghiệm thu','',
 'Đã đánh giá RG-UNC (độ bất định dự báo) của VNM và ACB ở mức 0/2 vì biên độ mô hình và các phụ thuộc còn trọng yếu. Đây không phải điểm tổng 0. Còn 688/690 tiêu chí chưa đủ đánh giá; giữ N/R và nguyên trọng số. Không có điểm tổng nào được nghiệm thu. Không yêu cầu người nghiệm thu độc lập cho dự án cá nhân.','',
 'Để đạt: lợi nhuận và quyền lợi cổ đông phải có cầu nối; dòng tiền phải tài trợ được tăng trưởng; phương pháp định giá phải phù hợp hoạt động và có kiểm tra chéo; mẫu số cổ phần/giá phải cùng cơ sở; đủ bằng chứng theo từng chủ đề của 23 tiêu chí; rủi ro vốn/thanh khoản phải được đánh giá. Giả định bảo thủ có tài liệu được phép sử dụng, không đòi doanh nghiệp chứng minh trước dự báo tương lai.','',
 '## Việc còn lại theo từng mã','',
 '| Mã | Cầu nối tiền năm đã tính | Kịch bản định giá có điều kiện | Phần cần xử lý tiếp |','|---|---:|---:|---|']
for r in index['rows']:lines.append(f"| {r['ticker']} | {r['annualCashBridges']} | {r['conditionalValuationScenarios']} | {short[r['ticker']]} |")
lines+=['','Cổ phần đang lưu hành theo hồ sơ công khai được giữ kèm cảnh báo bao gồm quyền tạm tính. Với BID, HDB, MBB, MSN, MWG, SHB, SSI, TCB, VRE, số này khác số niêm yết; không thay thế hai khái niệm cho nhau. Một số khác khớp số lượng nhưng việc khớp đơn thuần chưa nghiệm thu toàn bộ cầu nối quyền.','',
 '## Kiểm tra','',
 '- 70 kiểm thử tập trung đạt; bộ chuẩn hóa 13 kiểm thử đạt sau chỉnh assertion theo cấu trúc lỗi.',
 '- 127 kiểm thử scoring và 43 kiểm thử API đạt; lint và typecheck đạt.',
 '- Authority đã duyệt không đổi; 133 tệp lịch sử không đổi. Các pin R1/R2/R3 đều được đối chiếu lại.',
 '- Chưa chạy toàn bộ repository. Kiểm thử xanh không thay cho nghiệm thu dữ liệu/giả định kinh tế.',
 '- Hồ sơ thất bại lúc thử đường dẫn profile ban đầu vẫn được giữ trong manifest riêng; lần lấy profile đúng đường dẫn có đủ 30 mã.',
 '- Không phát hành điểm vào production, không sửa seal lịch sử và không ghi giao dịch vào DB.','']
(ROOT/'RESULT.md').write_text('\n'.join(lines))
artifacts=[pin(p) for p in sorted(ROOT.rglob('*')) if p.is_file() and p.name!='artifact-manifest.json']
builders=['scripts/capture-b6-vietstock-profiles.py','scripts/record-b6-bank-risk-expense.py','scripts/record-b6-extra-cashflow.py','scripts/record-b6-normalization-details.py','scripts/build-b6-owner-cash-pilot.mjs','scripts/build-b6-bank-normalization.mjs','scripts/build-b6-underwriting-review.mjs','scripts/report-b6-underwriting.py','src/domain/scoring/economic-normalization.ts','tests/unit/economic-normalization.test.ts','tests/integration/b6-underwriting.test.mjs']
raw=[]
for directory in ['20261030T121123Z','20261030T121210Z']:
 raw += [pin(p) for p in sorted((Path('data/manual-extracted-api/vietstock-profile-v1')/directory).rglob('*')) if p.is_file()]
manifest=dict(contract='b6-underwriting-review-manifest-v1',asOf=at,scope='REVIEW_CANDIDATE_NOT_PRODUCTION',artifactPins=artifacts,builderPins=[pin(p) for p in builders],profileCapturePins=raw,priorReviewManifest=pin(prior),productionScoringAuthorized=False)
save(ROOT/'artifact-manifest.json',manifest)
save(BASE/'current-review.json',dict(scope='REVIEW_CANDIDATE_NOT_PRODUCTION',asOf=at,root=str(ROOT),reportPath=str(ROOT/'RESULT.md'),manifestPath=str(ROOT/'artifact-manifest.json'),manifestSha256=pin(ROOT/'artifact-manifest.json')['sha256'],priorReviewManifest=pin(prior),ownerSourceRequests=[],marketSession='2026-10-30',b6Acceptance='NOT_COMPLETE',productionScoringAuthorized=False))
print(json.dumps(dict(artifacts=len(artifacts),builders=len(builders),profileCapturePins=len(raw),historicalPinChecks='PASS',b6Acceptance='NOT_COMPLETE')))
