# VNM Valuation Decision Package

Ngày nghiên cứu 11/11/2026; baseline `40a3401e6195f350b34b1d120c3345ebd520ff64`. **REVISE — prior Bear/Base/Bull chưa được chấp nhận.** Tái sử dụng retained JSON/notes theo `read-pdf-json-first`; không tải lại tài liệu. Các lựa chọn dưới đây là AI research, không HUMAN adoption, không current quote hoặc BUY/SELL.

## 1. Challenge mô hình trước

| Hạng mục | Quyết định nghiên cứu | Căn cứ / tác động |
|---|---|---|
| Common-owner earnings | REVISE, giữ bridge kế toán nhưng chưa gọi sustainable | Parent FY25 NPAT9.359349635629tn − quỹ0.935934963563tn =8.423414672066tn; loại net disposal0.006136383841tn và finance credit0.047683067251tn →8.369595220974tn. Consolidated common8.417384067829tn là reference riêng, không dùng NCI hợp nhất để chỉnh parent. |
| Scope growth | REVISE | Mô hình parent cần parent drivers. Parent FY25 revenue+4.57%, domestic+1.94%, foreign+25.45%, GP+2.36% (parent p54/p10), khác group domestic+0.32%/foreign+15.46%. Không dùng group growth làm matched parent forecast. |
| Maintenance | REVISE | Actual asset cash acquisition1.029529085769tn dưới D&A1.113338463424tn không chứng minh replacement thấp. Bull mới giữ D&A; Bear1.25×D&A; tất cả là proxy phải xét asset/project schedule. |
| Reserve/growth funding | REJECT lời khẳng định đã tránh double count | Prior `max(growthFunding, standingReserve)` chỉ đúng nếu hai use hoàn toàn chồng lấn. Reserve0.676743665122tn gồm WC absorption bình quân0.255649445122tn và subsidiary cash investment0.421094220000tn. Chưa có project-to-funding mapping chứng minh overlap. Dùng additive làm prudential option và max làm upper sensitivity, không coi bên nào proven. |
| Growth capital arithmetic | REVISE | Dùng Δearnings / incremental return thay vì current earnings×growth / return; cả hai chưa phải observed project ROIC, nhưng Δ phù hợp định nghĩa incremental earnings. |
| Terminal | REVISE | Không giữ CF5 conversion khi terminal growth/return khác explicit forecast. Tính lại earnings6, terminal growth funding, maintenance và reserve trước Gordon. |
| Distribution/return | REVISE | Common cash không phải declared dividends. Parent FY25 cash dividends11.181tn khác declared10.136tn (parent pp12/42). IRR giả định available cash trả mỗi cuối năm và exit5, không tự là expected return cho cổ đông. |
| Price/share | BLOCKED | TCBS close56.900 ngày30/10/2026 có source/raw hash nhưng adjustment `PROVIDER_UNDECLARED`; Q3 share anchor30/09 chưa nối toàn bộ rights/treasury/action tới30/10. Không tự dùng như current quote11/11. |
| Independent crosscheck | REVISE | Cash-capitalization là phương pháp khác, cùng source; phải trừ actual subsidiary investment hoặc nói rõ chưa trừ. Không áp fund/tax reserve như fact nếu mapping dòng tiền chưa rõ. |

Nguồn exact: `valuation-decision.json#/sourceBindings`, parent notes `data/manual-extracted-pdf/notes/VNM.json#/documents/1/pages/{9,10,11,25,40,42,46,48,49,53}` (physical page = index+1); normalization v4 và prior investment research được pin SHA-256 trong JSON. Các số mới từ retained page text vẫn là research observations, không financial admission hay tuyên bố mới xem source image.

## 2. Chuẩn hóa và recurrence decisions

- Quỹ common đã trừ đúng một lần. Không trích thêm10% trên earnings dự báo. Parent development fund đã ngừng trích từ2025 và chuyển quỹ về retained earnings theo AGM25/04/2025 (parent p26); đó là equity reclassification, không tiền mới.
- `RETAIN_FINANCE_CREDIT`:8.417278288225tn; `ZERO_OTHER_FINANCE_CREDIT`:8.369595220974tn; `REPEAT_2024_FINANCE_EXPENSE`:8.316911970974tn. Các adverse adjustments dùng tax incidence0/common incidence1; đây không phải thuế thực tế bằng0. Source tax rates15–20% phụ thuộc hoạt động (parent p50) không đủ tự gán marginal incidence cho từng khoản.
- Supplier support87bn FY25/88bn FY24 (p49) ủng hộ tính lặp lại nhưng không chứng minh hợp đồng vĩnh viễn. Base giữ, Bear loại87bn theo adverse no-tax-relief assumption. Bull giữ finance credit chỉ là upside choice cần chứng minh recurrence.
- D&A và capex/finance ở parent, không cộng cash hợp nhất hoặc subsidiary asset value để tránh scope duplication. Deposit interest/profit-sharing vẫn nằm trong earnings; không cộng toàn bộ deposits hay công ty con lần nữa. `cashDebtAdjustment=0` là không thêm adjustment, không phải net debt bằng0.

## 3. Lựa chọn Bear/Base/Bull được đề xuất để review

Các rate là **owner-required-return assumptions**, không sourced market WACC. Không có tài liệu chứng minh incremental project return12/15/18%; giá trị là sensitivity axes phải phê duyệt sau funding bridge. Parent history hỗ trợ mức growth vừa phải; named plant expansion/premium/export là drivers, chưa đủ riêng lẻ để chấp nhận forecast.

| Case | Earnings gốc tn | Growth năm1→5 | Maintenance gốc tn | RI / discount / terminal |
|---|---:|---|---:|---|
| BEAR | 8.229912 | 0%, 0%, 0%, 0%, 0% | 1.391673 | 12.00% / 18.00% / 0% |
| BASE | 8.369595 | 2.00%, 2.00%, 1.500%, 1.00%, 1.00% | 1.113338 | 15.00% / 15.00% / 1.00% |
| BULL | 8.417278 | 4.00%, 3.500%, 3.00%, 2.00%, 2.00% | 1.113338 | 18.00% / 12.00% / 2.00% |

Base2% taper1% không phải extrapolate parent FY25+4.57%; nó phản ánh margin compression, đầu tư và visibility còn hạn chế. Bear zero growth là stress assumption, không dự báo suy giảm đã chứng minh. Bull4% taper2% yêu cầu premium/export/plant execution; không cho maintenance dưới D&A nhằm tạo upside. Không dùng scenario nào làm accepted central case mặc định.

DCF: earnings_t=earnings_(t−1)×(1+g_t); growthFunding_t=(earnings_t−earnings_(t−1))/RI. D&A, maintenance và standingReserve scale theo earnings/earnings0. `CF_t = earnings_t + DA_t − maintenance_t − growthFunding_t − standingReserve_t` trong additive option. Complete-overlap bound thay hai funding uses bằng max. Terminal dùng cùng rule với g_terminal, không tái sử dụng CF5 nguyên trạng. PV=ΣCF_t/(1+r)^t + [CF6/(r−g_terminal)]/(1+r)^5. Chưa chứng minh reserve cần vĩnh viễn hoặc earnings scale D&A; sensitivity chính là lý do chưa chấp nhận model.

| Case | Additive VND/share | Complete-overlap bound | Conditional5y IRR additive | PV terminal/value |
|---|---:|---:|---:|---:|
| BEAR | 19,338 | 19,338 | -10.00% | 43.7% |
| BASE | 24,680 | 26,771 | -5.89% | 53.5% |
| BULL | 33,858 | 37,298 | -0.61% | 64.4% |

Per-share dùng conditional2.089.955.445; IRR dùng dated56.900, toàn bộ common cash cuối mỗi năm và terminal realization năm5, không dilution. **Không phải accepted fair value, margin of safety hoặc expected return**; không có xác suất/central expected case được duyệt. Nếu giữ cash thay phân phối phải model tài sản giữ lại/lợi nhuận tái đầu tư nhất quán; không được trả CF rồi cộng cùng cash vào exit. Market price/action chưa qualified nên VAL-PRIMARY/VAL-RET/VAL-MOS đều null, không gán0 từ IRR âm.

## 4. Sensitivity Base — additive funding

| Discount | Terminal growth | Conditional VND/share |
|---|---|---:|
| 12.00% | 0% | 31,118 |
| 12.00% | 1.00% | 31,543 |
| 12.00% | 2.00% | 32,054 |
| 15.00% | 0% | 24,622 |
| 15.00% | 1.00% | 24,680 |
| 15.00% | 2.00% | 24,747 |
| 18.00% | 0% | 20,318 |
| 18.00% | 1.00% | 20,247 |
| 18.00% | 2.00% | 20,167 |

Overlap alone lifts Base from24.680 to26.771 VND/share (~8.5%), before changing earnings/rates. This is economic model uncertainty, not a rounding issue. Maintenance+100bn/year at a zero-growth15% perpetuity convention reduces equity666.7bn (~319 VND/share); finite forecast/terminal with growth requires rerunning full model. Discount-rate/terminal sensitivity is shared with quality/growth judgments; do not award the same optimistic assumption repeatedly.

## 5. Independent method crosscheck

Observed FY25 parent capacity = CFO7.690701645261tn + actual interest/dividends received1.571241822856tn − asset cash acquisition1.029529085769tn − actual subsidiary investment0.421094220000tn = **7.811320162348tn**. Không đảo WC outflow để tăng cash. Zero-growth capitalization at12/15/18% = **31.146 /24.917 /20.764 VND/share conditional**. Đây là historical cash diagnostic, không chứng minh capex/subsidiary uses sẽ lặp hằng năm, và không suy ra sustainable FCFE.

Adverse reserve thêm `(currentTaxExpense−cashTaxPaid)=775.375113368bn` và `(fundAccrued−fundUsed)=275.176221092bn` cho cash6.760768827888tn, capitalization15%=21.566 VND/share. Không trừ các khoản này như proven recurring outflows: CFO row17 includes675.543695238bn other operating payments, fund use660.758742471bn; amount proximity không đủ mapping, và accrued-current tax có thể liên quan kỳ trước. Phải reconcile trước acceptance. Cùng issuer source, phương pháp khác; không gọi independent external/peer valuation. Kết quả cash crosscheck khác DCF cho thấy sensitivity cash conversion, không tự xác nhận DCF đúng.

## 6. Owner approval sheet inputs — chưa phê duyệt

- **VD1 — Historical 30/10/2026 market cutoff versus a later cutoff**: Keep historical 30/10 only for review; qualify actual/adjusted close and action chronology first. Approval: null.
- **VD2 — Parent common earnings normalization**: Base remove net disposal/other-finance credit; supplier support retained subject to contract recurrence; adverse incidence assumption is not a fact. Approval: null.
- **VD3 — Maintenance/reinvestment reserve overlap**: Use additive funding as prudential working option and complete-overlap result as upper sensitivity; prove disjoint/overlapping uses before adoption. Maintenance D&A proxy, bear1.25x. Approval: null.
- **VD4 — Growth/incremental return/discount/terminal**: Review all three named options; rates are required-return judgments, not sourced WACC or measured project returns. Terminal explicitly funds terminal growth. Approval: null.
- **VD5 — Distribution/exit/dilution and expected return**: No accepted IRR until common-cash distribution vs retention, year5 realization and dilution are qualified. Probabilities remain null; choose central case or defensible probabilities before accepted expected return. Approval: null.

## 7. Exact unresolved valuation products

- **V1 — Common-owner recurring cash and economic funding bridge**. Maintenance vs growth capex not reported as an economic split; capital budget/standing WC/subsidiary uses not mapped to growth funding. Fund-use/CFO and tax-timing recurrence need explicit nonoverlap reconciliation. Hành động ngắn nhất: One parent forecast bridge classifying maintenance, growth, subsidiary/WC uses and fund/tax cash effects, with project/contract evidence for recurrence.
- **V2 — Dated common share/action and price-adjustment bridge**. 56900 dated close exists; provider adjustment undeclared and 30Sep share anchor does not itself cover rights/treasury/issuance through30Oct. No current-price claim. Hành động ngắn nhất: Bind selected30Oct price raw adjustment status to a dated issuer action/treasury/rights register through cutoff; refresh only if owner chooses newer cutoff.
- **V3 — Owner-approved model assumptions plus source/time admission**. Owner choices and authority are null; historical inputs not certified current forecasts or AS_KNOWN availability. Approval cannot cure missing source products V1/V2. Hành động ngắn nhất: Owner decide VD1–VD5 after evidence bridge; then named analyst adoption and eligible publication/availability bindings. No formal valuation point before that.

Không yêu cầu lại FY2022–FY2025 statements. Mọi source đã kiểm tra được pin path/hash/pointer trong `valuation-decision.json`; publication/availability admission chưa tự suy từ PDF signature hoặc filename. Script `valuation-model.py` tái tạo numerical options, không ghi DB. STOP cho owner review.
