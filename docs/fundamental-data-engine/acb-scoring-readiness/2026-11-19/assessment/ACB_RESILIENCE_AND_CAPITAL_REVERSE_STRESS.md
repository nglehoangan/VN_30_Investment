# ACB — Sức bền nguồn vốn và kiểm tra ngược vốn

Phạm vi ACB/HOSE, ngày chốt 30/10/2026, BANK binding `current-bank-coverage:bff83724df834f2b29a7a4d0a3a3b573ab466aa2c2d4f72ab23f9b42b2825119`. [Reference](ACB_BANK_SCORING_REFERENCE.json)

## Neo bằng các kỳ lịch sử

| Mốc | Nợ nhóm 3–5 / dư nợ gộp | Dự phòng / lợi nhuận trước dự phòng | Proxy chi phí huy động | Tiền gửi khách hàng / nguồn đo | Giấy tờ có giá / nguồn đo |
| --- | ---: | ---: | ---: | ---: | ---: |
| FY2023 | 1,21% | 8,25% | 4,76% | 77,28% | 8,39% |
| FY2024 | 1,49% | 7,10% | 3,34% | 70,84% | 13,40% |
| FY2025 | 0,97% | 14,58% | 3,83% | 64,56% | 14,71% |
| 9T2026 / Q3 | 1,19% | 13,89% | 5,16% | 61,22% | 21,63% |

Mẫu số nợ gộp gồm cho vay ký quỹ theo bảng hợp nhất. Chi phí huy động = chi phí lãi và tương tự chia trung bình hai đầu kỳ của tiền gửi khách hàng, giấy tờ có giá, tiền gửi/vay TCTD khác và nợ Chính phủ/NHNN. Nhân 4/3 cho chi phí 9 tháng để quy năm. Do chỉ dùng số dư hai đầu kỳ, đây là proxy, không phải chi phí nguồn vốn bình quân ngày hoặc lãi suất hợp đồng. Các tỷ trọng nguồn dùng số dư cuối kỳ. FY2023–2025 lấy dòng bảng cân đối ở trang PDF 8, chi phí lãi/dự phòng ở trang 10 và nhóm nợ ở FY2023 trang 49, FY2024 trang 51, FY2025 trang 50 trong JSON lưu giữ. Q3 lấy trang PDF 3–6, 18 và 34. [JSON ACB lưu giữ](../../../../../data/manual-extracted-pdf/ACB.json) · [BCTC Q3](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/ACB_Baocaotaichinh_Q3_2026_Hopnhat.pdf)

FY2024 nợ xấu tăng trong khi proxy chi phí vốn giảm, nên lịch sử không hỗ trợ coi hai biến luôn tăng cùng nhau. FY2025 chi phí dự phòng tăng từ 1.606 lên 3.335 tỷ đồng, dù tỷ lệ nợ nhóm 3–5 cuối kỳ giảm. Q3/2026 nợ nhóm 3–5 tăng **2.423 tỷ đồng** so với FY2025, nhóm 2 tăng từ **2.493 lên 7.094 tỷ đồng**. Dự phòng cho vay tăng từ 7.625 lên 8.271 tỷ nhưng tỷ lệ bao phủ theo cùng danh mục giảm từ **114,29% xuống 90,94%**. Trong 9T2026, lợi nhuận trước dự phòng vẫn tăng khoảng 10,57% so với 9T2025 và đủ bù chi phí dự phòng đã ghi nhận. Q3 có khoảng chênh lệch kỳ hạn tháng đầu −183.105 tỷ. Số dư TCTD/vay và cơ cấu giấy tờ có giá cho thấy mức độ lệ thuộc vào nguồn ngoài tiền gửi khách hàng tăng trên mẫu số đo, nhưng không xác lập tỷ lệ tái tục, hành vi từng nhóm hay quan hệ nhân quả với nợ xấu. [BCTC Q3, trang 6, 18, 34](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/ACB_Baocaotaichinh_Q3_2026_Hopnhat.pdf#page=34)

## Kiểm tra ngược CAR, Tier 1 và CET1

Dùng vốn riêng lẻ H1: 86.774,234 tỷ vốn tự có, 83.425,178 tỷ Tier 1/CET1 và RWA 826.234,583 tỷ. Vốn hợp nhất H1 tương ứng 100.347,094 / 97.488,765 / 845.674,174 tỷ. Mốc tham chiếu có bộ đệm trong mô hình: CAR 9,25%, Tier 1 7,25%, CET1 5,75%. Tổn thất giả định đã qua thuế hoặc giảm trừ, làm giảm cả ba tử số cùng một lượng. Không cộng lợi nhuận Q3, không thêm cổ tức, giữ cấu phần vốn khác cố định. Dùng số dư H1 riêng theo từng phạm vi, không suy ra CAR pháp định Q3. [Báo cáo vốn H1](https://static2.vietstock.vn/data/HOSE/2026/BCTLATV/VN/QUY%202/ACB_BaocaoTyleAnToanVon_6T_2026.pdf?ver=4e1dacd3#page=6) · [Thông tư 14](https://vanban.chinhphu.vn/?docid=214640&pageid=27160)

Mức lỗ tới ngưỡng = vốn có thể dùng − RWA H1 × (1 + mức tăng RWA) × ngưỡng. Đơn vị tỷ đồng, làm tròn.

| RWA tăng | Riêng lẻ CAR / Tier 1 / CET1 | Hợp nhất CAR / Tier 1 / CET1 |
| --- | ---: | ---: |
| 0% | 10.348 / 23.523 / 35.917 | 22.122 / 36.177 / 48.862 |
| 3% | 8.055 / 21.726 / 34.491 | 19.775 / 34.338 / 47.404 |
| 6% | 5.762 / 19.929 / 33.066 | 17.429 / 32.499 / 45.945 |

CAR chạm trước trong cả hai phạm vi. Khi chưa có tổn thất, RWA riêng lẻ có thể tăng khoảng 13,54% trước ngưỡng CAR này, so với 28,28% ở hợp nhất. Lấy **2.423 tỷ** tăng nợ nhóm 3–5 ở Q3 làm mốc độ lớn và thử tổn thất vốn bằng hai lần số đó, **4.846 tỷ**, cùng RWA +6%. Kết quả còn khoảng **916 tỷ** dư địa CAR riêng lẻ và **12.583 tỷ** hợp nhất. Mức tăng nợ xấu là biến quan sát để chọn độ lớn của cú sốc, khoản lỗ vốn là giả định độc lập. Không cộng cả hai vào mô hình và không coi số dư nợ xấu là số lỗ đã phát sinh. Nếu cộng một điểm phần trăm đệm quản trị, riêng lẻ ở RWA +6% đã dưới mục tiêu giả định ngay trước cú sốc. Đây là độ nhạy quản trị.

## Band đề xuất

- **BQ-RES — 2/5, Material vulnerabilities.** Lợi nhuận trước dự phòng duy trì qua các kỳ và vốn có dư địa theo mốc H1. Sức bền bị giới hạn bởi tỷ trọng giấy tờ có giá tăng, gap kỳ hạn tháng đầu và dấu hiệu nhóm 2 tăng mạnh. Độ bền huy động hoặc nguồn bù khả dụng được xác minh có thể hỗ trợ band cao hơn. Lệ thuộc tái tục bất lợi hơn đáng kể có thể hạ đánh giá.
- **FH-BS — 3/6, Adequate (điểm thấp của band).** Vượt mức sốc nghiên cứu ở ngưỡng tham chiếu cùng mốc H1, nhưng bộ đệm riêng lẻ thu hẹp mạnh khi RWA tăng. Nợ xấu và mức bao phủ Q3 là phản chứng cho band Strong. Band có thể đổi khi có vốn/RWA riêng lẻ mới hoặc căn cứ về mức độ tập trung tổn thất. Cùng cơ cấu nguồn được dùng ở BQ-RES để đánh giá độ bền hoạt động, ở FH-BS để đánh giá bối cảnh đòn bẩy và sức chịu lỗ.
- Các mức trên là band nghiên cứu. FH-LIQ/FH-STRESS vẫn cần xác minh nguồn bù thực tế. M1 giữ CLOSED/PENDING. Chưa tạo assessment chính thức.
