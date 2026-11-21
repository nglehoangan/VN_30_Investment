# ACB — Hai lượt rà soát assessment ngày 21/11/2026

Ngày chốt 30/10/2026. Hai lượt dùng cùng [assessment V9](ACB_ASSESSMENT_REVIEW_DRAFT_V9.json) và BANK binding ghi trong bản V9. Kết quả dùng cho rà soát nghiên cứu.

## PREPARATION

Kiểm tra SHA-256 các tệp nguồn và bằng chứng rubric được ghim trực tiếp trong V9. Số rubric là 23, gồm 13 đề xuất mức đơn, hai đề xuất khoảng và tám chưa chọn band. Dataset body hash đọc lại từ inventory là `43f9ac0d2a6f67d7bd4e7d13180e7edc247147e096bb5a335ed75cb60cd911e5`.

Điểm mới cho thanh khoản là thông báo VSDC ngày **28/10/2026** về đăng ký **130 tỷ đồng** trái phiếu cấp 2 ACBL12605. Thông báo xác định tổ chức phát hành, mệnh giá và giá trị đăng ký. Chưa có căn cứ từ tài liệu này về tiền thực nhận trong cửa sổ, phần đã phản ánh tại Q3, hoặc quan hệ thay thế ACB12412. Giữ khoản này ngoài nguồn bù tăng thêm. [VSDC](https://vsdc.vn/vi/ad1/201903)

| Rubric còn mở | Kết quả rà đúng dữ liệu thiếu và tài liệu cần theo dõi |
| --- | --- |
| FH-LIQ, FH-STRESS | VSDC có thông báo đăng ký hoặc lịch đáo hạn theo mã. Kết quả tìm công bố ACB và HNX chưa cung cấp đủ lịch giải ngân thực tế, số tiền còn có thể rút và điều kiện sử dụng khoản hợp vốn trong stress. Rà tiếp công bố giải ngân và thuyết minh tài sản bảo đảm/thanh khoản FY2026. Tách kỳ 31/12 nếu tài liệu thiếu cầu nối Q3. |
| IC-IND, IC-CYCLE | Dùng lại chi phí huy động nhóm so sánh, NIM và dự phòng ACB đã lưu. Chưa có chuỗi ghép kỳ và cùng định nghĩa để tách tái định giá khỏi thay đổi cơ cấu và chu kỳ tín dụng. Rà bảng lãi suất và tín dụng định kỳ NHNN cùng các chỉ tiêu cùng kỳ trong BCTC của nhóm so sánh. |
| VAL-PRIMARY | Giá 21.000 lớn hơn đầu trên 20.205 đồng của dải P/B hiện có khoảng 3,93%. Kết luận hướng định giá trong dải đã rõ, còn thiếu căn cứ chọn một band và giá trị đại diện khi thay đổi ROE/Ke. Rà lại chuỗi ROE–P/B và căn cứ cho phần bù rủi ro. |
| RG-GOV, RG-RISK | Nghị quyết 4490 cho thấy tuyến phê duyệt giao dịch. Tìm trong công bố ACB chưa thấy điều khoản giá hoặc ghi nhận giám sát giao dịch đủ để xử lý phần còn thiếu. Rà báo cáo quản trị năm và phụ lục bên liên quan. RG-RISK chỉ lấy rủi ro còn lại sau Financial Health. |
| CA-REINV | Chỉ dấu lợi nhuận tăng thêm trên vốn tăng thêm đổi dấu giữa cửa sổ FY2023–25 và FY2022–25. Band còn phụ thuộc vào độ trễ và quy kết. Rà thuyết minh đầu tư công ty con và kết quả phân khúc để nối từng phần vốn với kết quả. |

## CHALLENGE

- Giữ các đề xuất mức đơn làm kết quả nghiên cứu của V9 gồm BQ-MOAT, BQ-RES, FH-BS, GQ-HIST, GQ-FWD, GQ-INC, IC-POS, VAL-RET, VAL-MOS, RG-UNC, CA-DIST, CA-DIL và CA-PSV. Giữ các điều kiện mở lại đã ghi trong V9.
- BQ-EQ và BQ-CASH tiếp tục giữ khoảng 3–4. ROE chuẩn hóa 14,72% gần Ke giả định 15%, còn chất lượng thực thu phụ thuộc phần lãi dồn tích và khoản bất thường. Hai khoảng cần quyết định mức đơn trước khi dùng chính thức.
- GQ-FWD 2/5 giữ ở mức nghiên cứu. Tăng trưởng tín dụng và NIM Q3 tốt hơn là phản chứng. Mô hình tích lũy vốn có lợi nhuận tăng nhưng ROE cuối kỳ dưới Ke, nên chưa đủ để nâng band dựa trên tăng trưởng tín dụng.
- VAL-RET dưới 8% giữ ở mức nghiên cứu. Giữ kết quả cơ sở 3,25% và lưu kịch bản giá thoát cao làm phản chứng vì có thể đổi band. VAL-MOS 0 giữ trong dải đã thử.
- Với FH, ngay phép thử giả định toàn bộ 130 tỷ bổ sung chỉ giảm mức cần bù 19.646,65 tỷ xuống 19.516,65 tỷ, tức khoảng 0,66%. Giả định này chỉ đo độ lớn, scorecard chưa ghi nhận khoản bù. M1 vẫn review CLOSED và riskOutcome PENDING.

Hai lượt đã rà nhưng chưa đạt điều kiện tạo review bindings chính thức. Lệnh prepare chỉ đọc trả hai lỗi thiếu assessment pin và review bindings. Inventory chưa có score ACB. SHA-256 SQLite trước/sau bằng nhau.
