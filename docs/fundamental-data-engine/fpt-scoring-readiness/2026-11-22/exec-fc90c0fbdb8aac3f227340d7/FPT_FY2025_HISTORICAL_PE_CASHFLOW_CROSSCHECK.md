# FPT — P/E lịch sử và kiểm tra chéo dòng tiền tại 31/12/2025

FPT/HOSE/TECHNOLOGY. Nghiên cứu hồi cứu theo mốc 31/12/2025 cho giá và quyền cổ phiếu, dùng BCTC kiểm toán phát hành sau khi kết sổ. Không xác lập bộ thông tin mà nhà đầu tư có tại từng phiên. Giữ phạm vi FY2022–FY2025 đã hợp nhất toàn bộ FTEL. Request FPT đã qua guard `exec-fa1eef5ff146e009c4f43368`, truy xuất 23/11/2026. Chọn quan sát cuối năm từ mỗi cửa sổ 26–31/12, chỉ dùng raw `GiaDongCua`. Bốn phản hồi và SHA-256 lưu trong [CaféF raw](../../../../../data/market-history/cafef/FPT.json). Raw không tự khai báo đơn vị. Hệ số 1.000 dựa trên kiểm chứng giá 95.800 VND cùng trường/date/volume của FY2025 trong [rà soát trước](FPT_FY2025_FINAL_TEN_RUBRIC_REVIEW.md), cùng nguồn/schema và khớp quy mô với giá trị khớp lệnh tính tỷ VND chia khối lượng. Trung bình giá giao dịch kiểm tra đơn vị không dùng làm giá đóng cửa.

Tử số vốn hóa = giá gốc × số cổ phiếu phổ thông lưu hành tại cuối kỳ; mẫu số = LNST báo cáo thuộc cổ đông công ty mẹ, nhất quán bốn năm. Dữ liệu cổ phiếu cuối năm từ bảng vốn góp trong thuyết minh BCTC kiểm toán từng năm. Báo cáo FY2023 xác nhận đồng thời FY2022 và FY2023. Không dùng số cổ phiếu bình quân hoặc EPS đã điều chỉnh cổ phiếu các năm sau để ghép giá gốc. [Trích xuất BCTC](../../../../../data/manual-extracted-pdf/notes/FPT.json) · [Dữ kiện chuẩn](../../../evidence/2026-10-15-ticker-closure-FPT/FPT_CANONICAL_FACTS.json)

| FY, phiên | Raw close, VND/cp | Cổ phiếu | LNST mẹ, VND | P/E cùng cơ sở | FCF tập đoàn / LNST tập đoàn |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2022, 30/12 | 76.900 | 1.097.026.572 | 5.310.108.591.408 | 15,89× | 28,32% |
| 2023, 29/12 | 96.100 | 1.269.968.875 | 6.465.190.432.622 | 18,88× | 71,12% |
| 2024, 31/12 | 152.500 | 1.471.069.183 | 7.856.767.812.178 | 28,55× | 89,40% |
| 2025, 31/12 | 95.800 | 1.703.507.121 | 9.376.127.629.501 | 17,41× | 44,85% |

P/E FY2025 trên cơ sở lợi nhuận sau quỹ 8.865.959.921.832 VND là 18,41×; cơ sở này chưa dựng lại cho tất cả các năm. So sánh trực tiếp dùng cột P/E báo cáo 17,41×. FY2025 có doanh thu +11,56%, LNST mẹ +19,34% và FCF giảm từ 8,428 xuống 5,038 nghìn tỷ so FY2024. FY2023 có doanh thu +19,56%, LNST mẹ +21,75% và FCF tăng từ 1,839 lên 5,539 nghìn tỷ. FY2025 thấp hơn P/E FY2023–24 nhưng chất lượng chuyển đổi tiền mặt cũng yếu hơn, trong khi cao hơn FY2022. Ba mốc lịch sử không đủ dựng dải P/E dài hạn.

## Kiểm tra chéo dòng tiền chủ sở hữu có điều kiện

Dùng lợi nhuận phổ thông làm việc sau quỹ 8,866 nghìn tỷ làm gốc. Proxy dòng tiền cổ đông là E0 × (1+g)^n × c, trong đó c là tỷ lệ chuyển đổi sau tổng capex. Dùng tỷ lệ FCF/LNST cùng phạm vi tập đoàn làm mốc cho c, không gọi FCF hợp nhất là FCFE công ty mẹ. Chọn 45% theo FY2025, 60% xấp xỉ trung vị bốn năm 57,99%, 90% xấp xỉ năm cao nhất FY2024. Chuyển c sang lợi nhuận thuộc cổ đông mẹ là giả định chưa kiểm chứng. Không trừ thêm capex hoặc vốn tăng trưởng sau khi đã áp c, không cộng tiền gửi hay trừ nợ lần nữa khi lợi nhuận gốc vẫn gồm lãi tiền gửi và lãi vay. Mô hình giữ giả định tái cấp vốn gốc, liên hệ FH-LIQ 2/4; không dùng đệm tiền ghi sổ như tiền tự do.

Chiết khấu 5 dòng tiền năm và giá trị Gordon cuối kỳ, với g 5 năm, k mức sinh lời yêu cầu cổ đông giả định để kiểm tra độ nhạy và t tăng trưởng dài hạn. Giá cuối năm 5 = dòng tiền năm 5 × (1+t)/(k−t). Chia giá trị vốn chủ cho 1.703.507.121 cp. Các mức k là giả định nghiên cứu, không nhận là WACC hoặc cost of equity đã xác minh. Kịch bản thuận lợi đã giả định bỏ qua pha loãng. Đây là phép đối chiếu cùng bộ đầu vào, không phải định giá độc lập đã nghiệm thu.

| Kịch bản | g / k / t | Chuyển đổi | VND/cp |
| --- | --- | ---: | ---: |
| Bất lợi | 7% / 16% / 2% | 45% | 20.645 |
| Cơ sở | 10% / 14% / 3% | 60% | 38.503 |
| Thuận lợi | 14% / 12% / 4% | 90% | 91.233 |
| Thuận lợi và thử chuyển đổi cao hơn FY2022–25 | 14% / 12% / 4% | 100% | 101.370 |

Ngay tại bộ giả định thuận lợi, ngưỡng chuyển đổi cần để khớp giá thị trường là 94,51%, cao hơn mức quan sát của nhóm trong chuỗi. Tín hiệu rủi ro nếu chất lượng tiền mặt yếu kéo dài có căn cứ ngay cả khi P/E báo cáo thấp hơn FY2023–24. Chưa chứng minh giá trị trung tâm đủ chắc vì hai góc nhìn khác nhau và chưa có FCFE chuẩn hóa theo quyền công ty mẹ.

**VAL-PRIMARY FY2025: N/R.** Đã tháo được giá, cổ phiếu và đối chiếu cùng định nghĩa. P/E báo cáo nằm trong mẫu lịch sử, còn phép thử dòng tiền nhạy theo tỷ lệ chuyển đổi, khả năng đảo nợ, tăng trưởng và suất chiết khấu. Chưa đủ chọn một band hợp lý/đắt/rẻ.

**VAL-MOS FY2025: 1/4, CONSERVATIVE, meaningful downside.** Đây là điểm cho rủi ro giảm giá trị trong kịch bản bất lợi, không suy ra chiết khấu nội tại chuẩn xác từ một giá trị điểm. Dùng khoảng P/E lịch sử làm kiểm tra chéo và phép thử dòng tiền có tỷ lệ chuyển đổi neo vào quan sát 2022–25. Trong model thuận lợi nhất có c 100%, giá trị chỉ cao hơn giá khoảng 5,81%, tương ứng chiết khấu 5,50% trên giá trị. Cơ sở và bất lợi đều thấp hơn rõ rệt; tài trợ vốn chịu rủi ro thời điểm theo FH-LIQ. Chọn band 1 vì rủi ro giảm giá trị có ý nghĩa và mức đệm nhỏ ngay ở phép thử hào phóng; dữ liệu không đủ chọn 0 hoặc kết luận giá trị chính xác. Điểm VAL-RET 2/8 lịch sử giữ nguyên. Điểm FY2025 mới 40 trên 77 trọng số có điểm, 17/23 rubric có điểm. Không cập nhật điểm quý hoặc chính thức.
