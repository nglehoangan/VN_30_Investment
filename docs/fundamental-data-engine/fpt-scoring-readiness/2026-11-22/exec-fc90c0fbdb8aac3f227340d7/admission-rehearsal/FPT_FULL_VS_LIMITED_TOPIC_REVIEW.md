# FPT TECHNOLOGY · rà khoảng trống cho hồ sơ ngày 13/11/2026

Dùng bộ dữ liệu đã đọc lại qua [CurrentPurposeScoringConsumer](FPT_SCORING_CONSUMER_READBACK.json), [hồ sơ 83 chủ đề](FPT_PREPARE_WORKPACK.json) và [quy tắc ngành §7, §17–18](../../../../03%20SCORING/SECTOR_NORMALIZATION.md). Phạm vi là nghiên cứu cho đúng FPT, execution `exec-8e2bd503394673db9396b722`. Đánh dấu riêng phần tính được, phần cần đánh giá áp dụng và phần cần chứng cứ bổ sung.

| Chủ đề | Kết quả rà và cách xử lý |
|---|---|
| BQ-RES · pricing_power | Biên PBT IT quốc tế 15,4–15,6% FY2023–25 và hợp đồng nhiều năm hỗ trợ độ bền của biên. Dùng làm bằng chứng hành vi kinh tế theo lịch sử. Cần đánh giá rủi ro phối hợp doanh thu, lương và cơ cấu dịch vụ trước khi kết luận khả năng giữ giá. |
| FH-LIQ · covenants | Dùng bảng nguồn/nghĩa vụ và ngưỡng tiền gửi để đánh giá thanh khoản. Chủ đề điều kiện vay vẫn mở nếu chưa có rà soát các hợp đồng hoặc công bố khoản vay trọng yếu. |
| FH-STRESS · funding_response | Kịch bản dùng 25% tiền gửi cho thiếu hụt tĩnh 2,59 nghìn tỷ VND ở Q3, dùng 50% cho thặng dư 2,63 nghìn tỷ. Có thể dùng trường hợp không tái cấp vốn như giả định bất lợi. Cần nguồn thay thế đã xác minh hoặc mô hình huy động có căn cứ để kết luận phản ứng tài trợ. |
| FH-STRESS · capital_response | Lấy thiếu hụt sau cú sốc tăng trưởng, biên và khách hàng làm nhu cầu vốn trước phản ứng. Cần lượng hóa capex có thể hoãn, tài sản có thể huy động và nguồn vốn còn lại trước khi kết luận có phải bán tài sản hoặc pha loãng. |
| GQ-INC · unit_economics | §7.3 cho phép xem biên tăng thêm và ROIC tăng thêm. Dùng cầu nối FY2022–FY2025 đã có để soi xu hướng. Dải 12,39–31,96% và dải FY2024–FY2025 2,72–6,10% phụ thuộc cách xử lý tiền gửi. Chưa chốt band do vốn, NOPAT và M&A chưa nối đồng nhất. |
| IC-POS · share | Dùng quy mô doanh thu IT nước ngoài, phân bố thị trường và số khách hàng từ 1 triệu USD làm bằng chứng độ phủ thương mại. Chưa có mẫu số thị trường cùng phạm vi để xác định thị phần. |
| IC-POS · cost_position | Biên mảng là bằng chứng về hiệu quả tuyệt đối. Cần so với đồng cấp có phạm vi tương đương hoặc có năng suất giao hàng đủ căn cứ để đánh giá vị thế chi phí. |
| VAL-PRIMARY · primary_model | Đã dựng mức tham chiếu P/E hiện tại và kiểm tra chéo tiền mặt ở phần dưới. Cần mẫu số lợi nhuận chuẩn hóa sau FTEL và chuẩn bội số có thể so sánh trước khi chọn giá trị trung tâm. |
| VAL-MOS · conservative_value | Kịch bản dòng tiền nền FY2025 giúp xác định các biến nhạy. Cần dựng lại giá trị bảo thủ cho phạm vi 2026 với chuyển đổi tiền, chi phí vốn và giả định tài trợ có căn cứ. |
| CA-REINV · divestments | Rà phạm vi áp dụng qua thuyết minh biến động đầu tư, thanh lý và mất quyền kiểm soát. Thay đổi phương pháp hợp nhất FTEL cần được xem theo bản chất. Nếu có thoái vốn trọng yếu, cần giá thu hồi và kết quả phân bổ. |
| CA-DIST · buyback_valuation | Hồ sơ FY2025 chưa ghi nhận mua lại trọng yếu trong phạm vi đã rà. Có thể trình đánh giá chủ đề theo tính áp dụng sau khi đối chiếu cổ phiếu quỹ và dòng tiền tới ngày chốt. Rubric còn cần căn cứ về sức bền phân phối của công ty mẹ sau FTEL. |

### Kiểm tra định giá từ dữ liệu hiện có

Vốn hóa tại 13/11 là 50.100 × 1.885.727.648 = **94.474.955.164.800 VND**. LNST mẹ bán niên đã tiếp nhận là 5.054.958.601.533 VND. Nhân đôi cơ học cho **P/E 9,34×**. Đối chiếu nghiên cứu 9T với LNST mẹ 7.778.081.180.761 VND, nhân 4/3 cho **9,11×**. Cả hai phép tính phụ thuộc nhịp ghi nhận lợi nhuận trong năm. Bán niên có FCF báo cáo **−2,482 nghìn tỷ VND**. Mốc 9T có FCF báo cáo **−1,077 nghìn tỷ VND**. Các phép thử giúp phân biệt bội số lợi nhuận và khả năng tạo tiền, chưa xác lập giá trị trung tâm hay biên an toàn. [Bán niên](FPT_H1_REVIEWED_CELLS.json) · [9T](FPT_Q3_REVIEWED_CELLS.json) · [P/E và dòng tiền lịch sử](../FPT_FY2025_HISTORICAL_PE_CASHFLOW_CROSSCHECK.md)

### Phạm vi chấm giới hạn để xem xét

Nếu lấy đúng cột cập nhật 9T2026 của hồ sơ làm điểm xuất phát, danh sách đề xuất giữ chưa chấm gồm **15 rubric**: BQ-EQ, BQ-CASH, BQ-RES, FH-LIQ, FH-STRESS, GQ-INC, IC-CYCLE, VAL-PRIMARY, VAL-RET, VAL-MOS, RG-RISK, RG-UNC, CA-REINV, CA-DIST và CA-DIL. Danh sách này giữ nguyên các trạng thái nghiên cứu hiện có để tránh suy rộng điểm FY2025 sang 2026. Mỗi rubric có thể rút khỏi đề xuất khi đánh giá tại 13/11 chứng minh đủ chủ đề. Tám rubric còn lại cũng cần đánh giá chính thức. Năm N/R nền FY2025 giữ đúng kỳ và không được dùng trực tiếp để xác định phạm vi hiện hành. [Hồ sơ rubric](FPT_CUTOFF_RUBRIC_HANDOFF.json)

Chấm đầy đủ còn phải giải quyết các đánh giá đang mở trong bộ 83 chủ đề, kể cả sau khi xử lý 11 khoảng trống trên. Chấm giới hạn cần phương pháp FPT, tập N/R chính xác và phê duyệt. Hồ sơ này là đầu vào cho quyết định đó. Chưa chạy `prepare` với một phạm vi chưa được duyệt.
