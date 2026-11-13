# Phương pháp xử lý S1–S5

Các section policy dưới đây là điểm tìm đọc trong baseline hiện tại, không phải bản sao hợp đồng. Nếu policy thay đổi, đối chiếu phiên bản thực tế và lưu binding. Không dùng giá trị VNM làm default.

## Chọn nhánh ngành trước

Đọc sector registry và SECTOR_NORMALIZATION cùng METRIC_DEFINITIONS §11. Các nhánh có thể bao phủ nhiều ngành, nhưng không ép một mô hình chung:

| Kinh tế chính | S1/S2 | S5 và giới hạn |
| --- | --- | --- |
| BANK | Sustainable ROE/ROTE, asset-quality/credit costs, capital adequacy, funding/LDR/liquidity; so return-on-equity với cost-of-equity | Residual income/justified P/B, normalized P/E đối chiếu. Không dùng industrial debt/equity hay CFO conversion; không xem deposits là nợ cần trừ theo bridge công nghiệp |
| REAL_ESTATE | Lợi nhuận theo bàn giao/chu kỳ, vốn dự án, pháp lý, presales/collections, debt maturity và restricted cash | RNAV/SOTP hoặc cash-flow dự án theo contract; không dùng book land bank như fair value, không tự gán realization probability |
| RETAIL / consumer | Unit/store economics khi có, brand/distribution, WC/inventory, ROIC và operating cash | DCF/owner earnings, normalized earnings; không đồng nhất tăng số cửa hàng với tăng năng suất |
| TECHNOLOGY | Recurring revenue, customer/talent concentration, reinvestment/intangibles, acquisitions, ROIC/cash conversion | DCF/owner earnings/normalized earnings; không phạt low tangible book tự động |
| INDUSTRIAL / MATERIALS | Mid/through-cycle ROIC/margins, replacement CAPEX, utilization, cost/input cycle và trough leverage | Mid-cycle FCFF/earnings; không vốn hóa peak earnings vô hạn |
| UTILITIES / ENERGY | Contract/regulatory economics, concessions, CAPEX/asset life, commodity/counterparty and funding exposure theo nhánh policy thực tế | DCF/SOTP phù hợp thời hạn tài sản/quyền; terminal không vượt thời hạn hữu hạn nếu không có renewal support |
| SECURITIES / INSURANCE | Theo SECTOR_NORMALIZATION §13: chất lượng/chu kỳ earnings, customer/regulated assets và capital/solvency; không coi tài sản khách hàng/insurance float là free corporate cash | Chọn equity earnings/residual-income/SOTP theo contract và economics; không tái dùng bridge nợ/tiền gửi VNM |
| CONGLOMERATE | Phân đoạn, look-through ownership/NCI, holding obligations và quyền chuyển tiền | SOTP; tránh cộng investment book value cùng subsidiary cash flows, trừ holding debt/leakage đúng một lần |

Nếu chưa có sector adapter đủ điều kiện, ghi limitation của execution/admission riêng; nghiên cứu vẫn có thể lập phương pháp và evidence phù hợp. Không tự tạo ngành hoặc sửa ngưỡng scoring để được thông qua.

## S1 — Lợi nhuận kinh tế

Điểm đọc: METRIC_DEFINITIONS §§3.1,3.3,4.1,6.3,12.4,13.1–13.4,14; BQ-EQ và GQ-INC trong RUBRICS.

- Chuẩn hóa operating earnings bằng adjustments có chứng cứ. Đối chiếu earnings scope với invested capital: group/NCI, leases, operating cash, tài sản tài chính/nonoperating và liabilities không lãi. Không tự dùng một tỷ lệ thuế chung cho mọi issuer.
- NOPAT/average invested capital chỉ dùng khi denominator cùng phạm vi/kỳ. TTM flow = FY trước + current YTD − comparable prior YTD; thiếu same-basis capital đầu kỳ không bịa exact TTM ROIC. Dùng annual ranges hoặc interim return/charge matching kỳ nếu policy cho phép; không so 9M return trực tiếp với annual WACC.
- Lập cost-of-capital range đúng đồng tiền, nominal/real, time horizon và debt/equity basis. Đọc nguồn đã giữ trước; ghi vintage, risk-free/risk premium/beta hoặc phương pháp tương đương, cost of debt/weights/thuế. Equity return so Ke, operating unlevered return so chi phí vốn tương ứng. Các extra stresses không phải market-observed WACC.
- Kiểm tra persistence/margins và current interim update, không chỉ năm đẹp nhất. Xử lý restatement, acquisitions, reclassification và thay đổi consolidation trước incremental return. Delta capital nhỏ/distorted → incremental N/R theo §6.3; không đòi factory/project table nếu không bắt buộc.
- Đóng khi normalization/capital/cost/current comparability đủ cho kết luận bounded; incremental N/R vẫn hạn chế GQ-INC và full scoring, không tự cấp điểm tăng trưởng.

## S2 — Thanh khoản bảo thủ từ dữ liệu công khai

Điểm đọc: §§5.2–5.3,10.2,13.1; FH-LIQ, FH-STRESS, CA-DIST và nhánh financial institution khi áp dụng.

- Chọn liquidity perimeter có bằng chứng quyền sử dụng/chuyển tiền. Parent liquidity không tự đại diện mọi nghĩa vụ group; group cash không tự sẵn ở parent. Cùng owner/currency/maturity basis cho sources/uses.
- Phân loại CONFIRMED_AVAILABLE, RESTRICTED, UNKNOWN với thời điểm và lý do. UNKNOWN không phải restricted, cũng không mặc định tự do sử dụng. Carry-forward note năm/bán niên chỉ với phạm vi/vintage và kiểm tra interim thay đổi; vắng ghi chú không chứng minh unrestricted.
- Dùng public maturity buckets và historical balances/flows để lập runoff/haircut/range có căn cứ, không yêu cầu ngày từng sổ/rút trước hạn khi không có. Tách unknown khỏi confirmed; nếu dùng phần unknown như giả định realizability thì giữ nhãn ASSUMPTION, không reclassify thành FACT. Chạy case loại unknown hoặc downside có căn cứ và chỉ đóng nếu uncertainty còn lại không vật chất với kết luận.
- Nghĩa vụ: principal, accrued/future interest, leases, enforceable commitments, declared unpaid dividends theo kỳ hạn. Giữ unknown obligations hoặc evidence-supported upper allowance; không dùng nguyên số year-end cũ, không mặc định zero. Không coi toàn bộ current debt tới hạn cùng ngày dividend.
- CFO TTM là flow tính toán, không phải cash hiện có. Future CFO chỉ là scenario, không nguồn chắc chắn; chỉ phân bổ intra-period khi có căn cứ. Đã stress operating costs/WC trong CFO thì không trừ lại toàn bộ operating liabilities. Discretionary CAPEX/future undeclared dividends tách khỏi mandatory claims.
- Base/stress/sensitivity: severe plausible stresses có nguồn và operating reserve hợp lý; không xếp mọi reserve tùy ý thành mandatory gate. Giữ extra adverse cases, điểm thiếu intraperiod/covenant N/R nếu permitted; annual12M surplus không chứng minh đủ tiền mọi ngày. Reconcile FH-LIQ/FH-STRESS/CA-DIST từng yêu cầu, không tự cấp CA-DIST points từ headroom.
- Nếu thiếu dữ kiện thực sự có thể đảo kết luận, BLOCKING ghi economic dependency (ví dụ mức deposit availability cần để vượt obligation bucket), không yêu cầu chung một BCTC mới.

## S3 — Vị thế cạnh tranh

Điểm đọc: §7.2, §13.3; SCORING_MODEL §8.2; IC-POS topics trong RUBRICS; SECTOR_NORMALIZATION về own-history/absolute anchors.

- Matrix: market/category/geography/channel/denominator/time; brand/pricing; distribution/cost/quality/scale; durability/threats; historical consistency. Lấy mandatory topics từ phiên bản executable thực tế, không tự thêm dataset bắt buộc.
- Household reach, brand award, issuer-attributed rank và market share là các đại lượng khác nhau. Không đổi reach thành % share; không so group accounting sales với retail market để suy share gain. Giữ issuer attribution và phương pháp survey nếu có.
- Dùng absolute/own-history economics nếu policy cho phép thiếu peers. Gross margin không tự chứng minh lowest cost/pricing power; kiểm selling/service cost, mix, input-price, channel disruption và counterevidence. Không bịa percentile/rank.
- Mỗi mandatory topic có positive/counterevidence, confidence, limitations và invalidation. Đủ descriptive conclusion có thể đóng nghiên cứu; không vì vậy chọn maximum band hay cấp BQ-MOAT/IC-POS points trùng.

## S4 — Giá, cổ tức và cổ phiếu

Gọi skill hiện có `skills/vn30-market-price-corporate-actions/SKILL.md` và references cần thiết. Không fork script hoặc tạo pipeline thứ hai.

- CaféF chỉ `GiaDongCua`; đơn vị nghìn VND chỉ nhân1000 khi verified. Thiếu raw close → NOT_QUALIFIED, không fallback `GiaDieuChinh`. Giữ adjusted raw làm audit; không mở lại phương pháp adjustment đã bị loại khỏi scope.
- Corporate actions giữ event identity, period, announcement/publication, ex/record/effective/payment dates khác nhau. Returns dùng raw prices + verified actions/dividends; incomplete action evidence → historical return NOT_QUALIFIED.
- Latest eligible outstanding shares carry-forward dưới owner rule khi reviewed inventory không có effective change. Unread relevant event, conflict hoặc unresolved effective date ngăn auto-carry. Ghi reviewed interval, coverage và timestamp; không tuyên bố complete negative search khi coverage thiếu.
- Phân biệt retrospective research, current formal consumption, historical PIT. Standing provider authority không tự tạo dated membership, supported financial concept adapter hay publication evidence. Không mở lại nguồn đã approved, không bypass phạm vi authority.

## S5 — Định giá và lợi suất cổ đông

Điểm đọc: §§8.1–8.4,12.17,13.1/13.4,14; M3 §9 và M4 contracts.

- Chọn primary model đúng ngành/perimeter; reconcile normalized earnings, CFO, WC, maintenance/growth CAPEX, cash/debt, employee claims, dividends và common shares. Dùng S1 để kiểm growth/reinvestment, S2 để kiểm funded distributions, S3 để giới hạn durability. Không bịa precision cho maintenance split: proxy/range có nguồn và sensitivity hoặc N/R.
- FCFF dùng operating tax/earnings, loại debt interest, discount cost-of-capital tương ứng rồi bridge equity. FCFE đã sau financing dùng Ke, không trừ nợ lần nữa. Financial institutions dùng sector equity model, không ép industrial FCFF.
- Cash/financial assets chỉ cộng riêng nếu earnings loại thu nhập liên quan; assets operational giữ trong capital không cộng lại. Dividend là phân phối FCFE, không operating expense; stock dividend không tự tạo wealth. Tách old unpaid claims và future modeled distributions; debt interest/accrual, employee fund, taxes, NCI và dilution đúng kỳ, đúng một lần. Nếu retirement/recovery giả định, ghi rõ timing/cash sufficiency và sensitivities.
- Bear/Base/Bull có source anchors cho growth/margins/reinvestment/cash conversion/discount/terminal; biện minh điều chỉnh, không mặc định3pp/10%/15% hay tái dùng payout VNM. Bất lợi không phải lý do đổi assumption. Chứng minh financing/distribution ledger và terminal reinvestment consistency; không dùng g vĩnh viễn mà quên vốn cần tài trợ.
- Phân biệt intrinsic value hôm nay, year5 exit và shareholder distributions. Retained cash chỉ cộng một lần, có earnings/return assumption rõ; không cộng lại dividend đã trả. 5Y IRR/timing hoặc phương pháp equivalent phù hợp cần giá, growth, exit, dividends, dilution và dates. Forecast dividends không phải declared cash. Xác minh historical pending dividend belongs to holder xét ex-date, không chỉ payment date.
- Không tự gán probabilities. §8.2 cho explicit conservative Base; nếu xác suất/RNAV realization thực sự decision-critical mà không support thì N/R/block exact dependency, không ngầm100%. Scenario range không phải confidence interval.
- Multiple cross-checks giữ dependence: FCF-yield capitalization/normalized multiples không độc lập nếu cùng assumptions/source. Không cộng valuations của cùng earnings.
- MOS=(conservative value−price)/conservative value; nếu range quá rộng, §12.17 yêu cầu không tính point MOS → N/R. Price downside dùng denominator price, không thay MOS. Missing mandatory economic premise khiến S5 BLOCKING; N/R được policy cho phép không tự buộc score0 hoặc guaranteed floor.
- Đóng bounded research valuation chỉ khi reproducible/consistent/supported và mọi mandatory requirement đã xử lý. Formal fair-value adoption, score/action và production authority là gate khác; không tự chuyển research status thành approval.
