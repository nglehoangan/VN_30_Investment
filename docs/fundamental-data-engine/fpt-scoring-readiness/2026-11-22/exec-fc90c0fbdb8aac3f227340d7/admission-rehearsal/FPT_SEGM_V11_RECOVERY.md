# SEGM v1.1 · FPT tại 13/11/2026

Ngày chốt kinh tế 13/11/2026. Bộ dữ liệu V8 có known-at `2026-11-23T14:06:25.245Z`. Chỉ dùng dữ kiện giữ tại kho đã được rà và không suy khả năng dùng tại đúng ngày giao dịch. Lượt này dùng mục đích hiện hành hồi cứu, không xác lập Historical PIT.

## Kết quả phục hồi

**RG-UNC: CONSERVATIVE 0/2, band High uncertainty**, đề xuất nghiên cứu. Ba chủ đề được kiểm tra bằng dải chuyển đổi dòng tiền minh họa, độ nhạy theo kịch bản và các phụ thuộc chi phí vốn, chuyển đổi tiền, phạm vi FTEL và tài trợ. Một thay đổi đơn biến, giữ tăng trưởng 10%, chiết khấu 14%, cuối kỳ 3% và chuyển đổi từ 45% đến 90%, làm giá trị minh họa tăng gấp đôi vì công thức tuyến tính theo tỷ lệ chuyển đổi. Band 1 cần căn cứ cho một vùng giả định có thể quản lý được. Đối chiếu tiền mặt hiện tại và độ nhạy chưa hỗ trợ kết luận đó. Band 0 phản ánh độ nhạy đã đo, không phải điền điểm 0 cho dữ liệu trống. [Anchor RG-UNC](../../../../../../src/domain/scoring/methodology.ts) · [Phân tích bất định FY2025](../FPT_FY2025_HISTORICAL_ANCHORS_RG_CA.md)

20 rubric còn lại có chẩn đoán, nguồn và điều kiện mở lại ở [ma trận 21 rubric](FPT_SEGM_V11_DIAGNOSTIC.json). Năm điểm nghẽn có thể tiến triển với số liệu cùng cấu trúc ở kỳ **tương lai**: BQ-EQ, BQ-CASH, FH-BS, CA-DIST và CA-PSV. Các giá trị FY2025 vẫn giữ đúng kỳ. Cột `remainingClass` phân biệt mục có thể tiếp tục bằng ráp nối/mô hình trên dữ liệu hiện có, mục cần thay đổi phương pháp có phê duyệt và mục còn thiếu bằng chứng kinh tế. Không kỳ tương lai nào được đưa ngược vào mốc 13/11.

## Dữ kiện và phép tính kiểm chứng

| Chuỗi hợp nhất | FY2022 | FY2025 | CAGR 3 năm |
|---|---:|---:|---:|
| REVENUE | 44,009,527,680,911 | 70,112,825,100,710 | 16.79% |
| NET_INCOME_ATTRIBUTABLE_PARENT | 5,310,108,591,408 | 9,376,127,629,501 | 20.87% |
| CFO | 5,053,831,756,700 | 10,136,043,915,911 | 26.11% |
| TOTAL_EQUITY | 25,356,124,687,812 | 43,748,040,747,539 | 19.94% |

Số tính bằng VND. Nguồn SQLite chỉ đọc: `fundamental_admission_run/reviewed-vn30-20261019-FPT`, hash nội dung `6239266e4aff895eed72c9f38a9f5a182990e086d92b5f6d5c831d95b923a6b6`. Các ID đầu vào theo cặp FY2022→FY2025:

- REVENUE: `canonical:f27cb3b4bb4dc4635fcd12fbe7fcb4ab2ac39d3d0b62fad687e90a255bc70a1c`, `canonical:6f293e2b7c6a62c244efc17f9fb496ca61e1c2c05d127db69eb413971c6b3751`.
- NET_INCOME_ATTRIBUTABLE_PARENT: `canonical:bd65f4f116d2df91ac4c53162a4abbb08ef7675b7da7826f3a929c322b82c6c0`, `canonical:4945f27fefe77e355cd7a96a279dce3d0b1623a84d49d7c22e3e59678ec32298`.
- CFO: `canonical:87eb040c0a6338f5bf504e49fb56742275bdfc51a06a5be72ca993150b73f764`, `canonical:61604e58f4f596d74e990ac34df7e7fdbf1803cdae76e320e362cdd9b432399f`.
- TOTAL_EQUITY: `canonical:6f1972afc827ea920f5f21900fdae4e42a7ec7b47b0f739ebd8f558b5d278d82`, `canonical:6280793beba5bead99ff66d6f92ca4f599f67035c26cb3aaf7e22201dd48626c`.

Chuỗi tăng trưởng không được trình bày như đã loại M&A, pha loãng và thay đổi kế toán. EPS theo cặp điều chỉnh và lịch ESOP đã có trong [hồ sơ FY2025](../FPT_23_RUBRIC_FY2025_RESEARCH_SCORECARD.md) và [phân tích vốn trên mỗi cổ phiếu](../FPT_FY2025_HISTORICAL_ANCHORS_RG_CA.md). Không ghép thẳng EPS báo cáo với số lượng cổ phiếu cuối kỳ để suy tăng trưởng đã điều chỉnh.

## Phục hồi định giá và lợi suất

- **FACT**. Giá đóng cửa 50,100 VND, cổ phiếu 1,885,727,648 theo biên nhận V8. Vốn hóa tính ra 94,474,955,164,800 VND. FCF báo cáo bằng CFO trừ capex. Bán niên -2,482,149,243,519 VND và 9T -1,076,823,273,213 VND. 9T là đối chiếu nghiên cứu từ nguồn Q3 giữ lại, tách khỏi F2 của V8. [Biên nhận V8](FPT_PRIMARY_ADMISSION_RESULT.json) · [Bán niên](FPT_H1_REVIEWED_CELLS.json) · [9T](FPT_Q3_REVIEWED_CELLS.json)
- **ESTIMATE**. LNST cổ đông mẹ quy đổi năm chia cho số cổ phiếu cuối kỳ cho 5,361 VND/cp từ bán niên và 5,500 VND/cp từ 9T. P/E chỉ báo 9.34× và 9.11×. Hai mẫu số là run-rate cơ học, chưa loại mùa vụ, khoản tài chính hay thay đổi FTEL. FCF báo cáo âm cho thấy lý do cần kiểm tra lại khả năng chuyển đổi tiền trước khi dùng bội số.
- **ASSUMPTION**. Tái sử dụng tổ hợp kiểm tra của [mô hình FY2025](../FPT_FY2025_HISTORICAL_PE_CASHFLOW_CROSSCHECK.md). Dùng EPS quy đổi bán niên làm gốc và tỷ lệ chuyển đổi FCF/LNST lịch sử làm biến nhạy. Công thức minh họa lấy EPS × chuyển đổi × tăng trưởng từng năm và Gordon cuối năm 5, chiết khấu cả hai về ngày chốt. Tỷ lệ toàn nhóm chưa đủ làm dòng tiền vốn chủ sau FTEL. Không cộng thêm tiền gửi hoặc trừ nợ vào mô hình độ nhạy này.

| Kịch bản độ nhạy | Tăng trưởng 5 năm | Chiết khấu | Cuối kỳ | Chuyển đổi | Giá trị minh họa VND/cp | 1 − giá/giá trị |
|---|---:|---:|---:|---:|---:|---:|
| Bất lợi | 7% | 16% | 2% | 45% | 21,267 | -135.6% |
| Cơ sở minh họa | 10% | 14% | 3% | 60% | 39,662 | -26.3% |
| Thuận lợi | 14% | 12% | 4% | 90% | 93,981 | 46.7% |

Kiểm tra ngược lợi suất 5 năm tại ngưỡng 12%, với pha loãng 0,7%/năm và các giả định tăng trưởng/DPS từ phép thử FY2025, cho bội số thoát cần đạt 11.28× nếu tăng trưởng 7% và DPS 1.000 VND, hoặc 9.06× nếu tăng trưởng 10% và DPS 2.000 VND. Đây là điều kiện để đạt ngưỡng minh họa, chưa có căn cứ xác suất đạt. Giá trị, lợi suất kỳ vọng và MOS dùng cho quyết định vẫn ở N/R. Thử mô hình và reverse hurdle giúp tháo phần phép tính; phần cần xử lý là EPS/FCFE chuẩn hóa, tính bền vững của phân phối, cơ sở chi phí vốn và kiểm tra chéo theo phạm vi FTEL.

## Change Request và tái sử dụng

- **CR-IC-POS**. Chỉ mở nếu chủ phương pháp quyết định chấp nhận chỉ báo vị thế thay cho thị phần/chi phí tương đối. Đề xuất thử doanh thu trên nhóm khách hàng có cùng định nghĩa cạnh tranh và sai số, rồi kiểm tra trường hợp thị phần tăng do thay mẫu số. Độ phủ thương mại hiện có được dùng làm bằng chứng phân phối.
- **CR-CA**. Làm rõ cách xử lý chủ đề mua lại và thoái vốn khi chứng minh không có giao dịch trọng yếu. So sánh ba ca gồm không áp dụng đã xác minh, thiếu bằng chứng và có giao dịch. Dùng nguyên anchor và trọng số cho đến khi phê duyệt.
- **CR-GQ**. Giữ tách CAGR công bố, tăng trưởng hữu cơ và kết quả trên mỗi cổ phiếu. Chỉ đề xuất quy tắc cận cho M&A nếu kiểm chứng được phần đóng góp bằng cùng thước đo và cùng cơ sở. Không cần sửa mapping khi chưa tái lập được lỗi raw-to-canonical.
- Quy ước tái sử dụng cho lượt sau: lấy các cột lịch sử từ admission registry bằng `ticker × itemId × scope × period`; đối chiếu hash nội dung trước khi tính; chạy điều kiện ngược định giá với giá thô và số cổ phiếu đã hòa giải; lưu đúng vai trò FACT/ESTIMATE/ASSUMPTION trong hồ sơ ngành. Không bổ sung proxy hoặc sửa skill/anchor đã được hash duyệt.

## Phạm vi tác động

Baseline chính thức vẫn 5/10 trên trọng số đã chấm, 21 N/R, hard veto PENDING, không có tổng điểm đầy đủ. Đề xuất RG-UNC không cấp quyền xếp hạng hay giải ngân. Để áp dụng chính thức cần chốt phạm vi successor, cập nhật chính xác rubric N/R của phương pháp giới hạn nếu thay đổi, chấp nhận đánh giá và hai review theo đúng hash, phê duyệt executable nếu code/phương pháp đổi, rồi chạy prepare và lấy quyền score riêng. Quyền công bố vẫn tách riêng. Không tạo điểm hay công bố trong lượt này.

## Kết quả kiểm tra

- Structural N/R validator xác nhận đúng 21 rubric theo baseline và đúng band High uncertainty cho đề xuất 0/2. Tất cả quyền ghi điểm, lịch sử PIT, giao dịch và công bố từ lượt chẩn đoán đều false.
- 9 kiểm thử Structural N/R và 34 kiểm thử tích hợp scorer/consumer đạt. Kiểm tra parity với bộ tính đã duyệt đạt.
- Đọc SQLite chỉ đọc và kiểm tra SHA-256 của bản điểm FPT cùng bản tiếp nhận 88 dữ kiện lịch sử. Bản điểm và biên nhận baseline khớp, tổng điểm đầy đủ vẫn null. CLI check trả READY cho route chính thức đã có, không áp dụng cho đề xuất RG-UNC.
- Không tải nguồn mới, ghi điểm, phát hành hoặc mở quyền giải ngân. Chưa chứng minh Historical PIT. Không có lỗi mapping raw-to-canonical được tái lập để sửa trong lượt này.
