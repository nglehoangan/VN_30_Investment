# VNM Valuation Model — owner review

Ngày nghiên cứu 11/11/2026; không có accepted fair value hoặc formal valuation points. Đây là mô hình VNM-specific giữ lại, được tính lại để review, không phải current forecast.

## Chuẩn hóa common earnings và cash

Hợp nhất FY25: 9.410.201.646.692 − 992.817.578.863 quỹ = 8.417.384.067.829 VND thuộc common sau quỹ; không dùng group NPAT 9.413.589.732.469 làm lợi nhuận common. NCI không được phân bổ bằng tỷ lệ đoán.

Công ty mẹ: NPAT 9.359.349.635.629 − quỹ đã trích 935.934.963.563 = 8.423.414.672.066. Loại net disposal 6.136.383.841 và credit other finance 47.683.067.251 → working common 8.369.595.220.974 VND. Giả định adverse tax incidence 0 và common incidence 1 cho adjustments; không phải thuế thực tế bằng 0. Không trích quỹ thêm 10% lần nữa. Giữ supplier support 87bn vì FY24 có 88bn; tính lặp lại còn cần kiểm tra. Alternative retain-finance 8.417tn; repeat FY24 finance expense 8.317tn. Unknown additional funds và exhaustive one-off review vẫn mở.

Parent CFO 7.690.701.645.261; WC cash use 1.414.952.025.062; actual cash capex 1.029.529.085.769; D&A 1.113.338.463.424; subsidiary investment 421.094.220.000. CFO không tự bằng common distributable cash. DCF dùng normalized earnings + D&A − maintenance − max(growth funding, standing reserve). Không cộng thêm deposits hoặc subsidiary value khi vẫn giữ earnings từ các tài sản đó. Net-debt adjustment 0 là giả định không có adjustment, không phải khẳng định net debt bằng 0.

## Bear / Base / Bull

| Case | Equity tn VND | Conditional VND/share | 5y IRR tại 56.900 | PV terminal/value |
|---|---:|---:|---:|---:|
| BEAR | 41.192 | 19,709 | -9.60% | 43.7% |
| BASE | 55.905 | 26,749 | -4.17% | 53.2% |
| BULL | 78.108 | 37,373 | 1.63% | 64.3% |

Các giá trị per-share dùng **conditional** denominator 2.089.955.445, không phải denominator đã qualified tại 30/10/2026. Source EPS-note FY25 và Q3/2026 p59 là anchors riêng, không chứng minh không có action giữa hai ngày. Giá TCBS 56.900 ngày 30/10/2026 nhận 10:43:28.963Z, `PROVIDER_UNDECLARED` adjustment; exact raw hash, observation và pointer ở scorecard `/valuation/marketReference`. Không dùng làm giá hiện tại 11/11/2026.

- BEAR: `{"maintenance": "1391673079280", "growth": ["0", "0", "0", "0", "0"], "incrementalReturn": "0.12", "discount": "0.18", "terminal": "0"}`.
- BASE: `{"maintenance": "1113338463424", "growth": ["0.02", "0.02", "0.015", "0.01", "0.01"], "incrementalReturn": "0.15", "discount": "0.15", "terminal": "0.01"}`.
- BULL: `{"maintenance": "1029529085769", "growth": ["0.04", "0.035", "0.03", "0.02", "0.02"], "incrementalReturn": "0.18", "discount": "0.12", "terminal": "0.02"}`.

Bear flat earnings/terminal và 18% discount phản ánh domestic demand yếu, pass-through hạn chế; maintenance 1.392tn = 1.25× FY25 D&A. Base growth 2%,2%,1.5%,1%,1% neo reported revenue CAGR 2.01%, domestic +0.32%, ngoại +15.46%; không giả định tăng trưởng ngoại áp lên cả group. Maintenance bằng D&A; incremental return 15%, discount 15%, terminal 1% là judgment phải duyệt, không phải observed project return/WACC. Bull 4%,3.5%,3%,2%,2% đòi hỏi premium/export/plant execution; maintenance 1.030tn neo actual parent capex, thấp hơn D&A nên có nguy cơ thiếu replacement. Incremental 18%, discount 12%, terminal 2% là optimistic conditional choices, 12% không tự cấp hurdle exception.

Standing reserve 676.743.665.122 VND năm gốc = FY25 parent subsidiary investment 421.094.220.000 + floor 255.649.445.122 giữ từ prior model. Floor 255.649.445.122 là độ lớn cash absorption bình quân WC FY24–25 trong prior parent cash bridge; giả định lấy bình quân hai năm làm recurring funding demand chưa được chứng minh. Mỗi năm scale earnings, D&A, maintenance và reserve theo growth; growthFunding = current-year earnings×growth/incrementalReturn; reinvestment = max(growthFunding,reserve), tránh cộng hai lần các uses chồng lấn. Cần owner xác nhận reserve/growth overlap; capex không tự là maintenance.

PV = Σ CF_t/(1+r)^t + [CF_5×(1+g_terminal)/(r−g_terminal)]/(1+r)^5. Terminal giữ cash conversion/reinvestment ratio cuối năm 5: một giả định riêng, không tự là steady-state kinh tế đã chứng minh. CF_t không phải declared dividends; conditional IRR giả định tất cả common cash được phân phối cuối mỗi năm và terminal realization cuối năm 5, không pha loãng thêm. Không dùng (terminal + dividends)/price CAGR thay cho cash-flow IRR.

Không có xác suất được chấp thuận nên expected/probability-weighted five-year return = null. Ba IRR có điều kiện là sản phẩm nghiên cứu; không được chấm VAL-RET=0 từ chúng khi price/action/common contract chưa hợp lệ.

## Crosscheck độc lập về phương pháp

Actual parent cash: CFO + cash interest/dividends nhận 1.571tn − cash capex − (quỹ accrued−used) − (current tax expense−tax paid) = 7,181,863,047,888 VND. Không đảo ngược WC outflow để làm đẹp. Capitalize zero growth tại 12%/15%/18% cho 28,636, 22,909, 19,091 VND/share có điều kiện. Base crosscheck thấp hơn DCF base, cho thấy accounting earnings chưa chuyển hết thành cash. Không dùng terminal multiple từ cùng DCF để giả làm independent method. Hai phương pháp vẫn dùng cùng disclosure nên không độc lập về source; không có peer valuation đã qualified. Cash-fund/tax overlap, current accrued taxes có thể gồm nghĩa vụ kỳ trước và maintenance split cần reconcile trước acceptance.

## Độ nhạy Base

| Discount | Terminal growth | VND/share conditional |
|---|---|---:|
| .12 | 0 | 32,243 |
| .12 | .01 | 34,152 |
| .12 | .02 | 36,443 |
| .15 | 0 | 25,670 |
| .15 | .01 | 26,749 |
| .15 | .02 | 27,995 |
| .18 | 0 | 21,297 |
| .18 | .01 | 21,965 |
| .18 | .02 | 22,717 |

Mỗi 100bn common earnings/fund adjustment ảnh hưởng cash và terminal; không được áp tax/NCI hợp nhất vào parent. Nếu maintenance tăng 100bn/năm không tăng trưởng, PV giảm 100bn/r (khi giữ cùng terminal zero-growth convention); base 15% tương đương 666.7bn equity, ~319 VND/share. Đây là local diagnostic, không phải full reforecast. Lower discount/terminal assumptions là rủi ro chung của BQ-EQ, GQ-FWD và valuation, không được tự tăng ba nhóm điểm.

## Dependency và owner choices

Owner cần chọn market cutoff (có thể giữ 30/10 như historical cutoff; không bắt buộc giá mới nếu giữ cutoff này), chấp thuận scope công ty mẹ và common adjustment alternatives, maintenance split, reserve, project returns, growth path, discount/terminal, cash-distribution/dilution/exit và probabilities nếu muốn expected return. Phê duyệt giả định không thay thế source proof. Cần engineering/research nối price adjustment và action/treasury/rights tại cutoff, publication eligibility và post-FY25 developments; không cần tải lại FY2022–FY2025. Intrinsic values/IRRs sẽ thay đổi khi normalization hoặc funding model bị bác.

Source bindings: scorecard `/valuation`, `/derivedMetrics`, prior normalization v4 và investment-research-v2 được pin bằng SHA-256.
