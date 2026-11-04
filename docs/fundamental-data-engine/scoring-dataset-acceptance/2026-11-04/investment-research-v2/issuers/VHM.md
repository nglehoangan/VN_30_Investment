# VHM — xử lý nguồn và mô hình tham chiếu FY2025

**Đã xử lý nguồn đang có:** đọc trực tiếp trang vốn PDF, đối chiếu extracted JSON và kiểm tra ô nguồn CafeF. Đầu vào CafeF chưa khai báo đủ đơn vị/phạm vi nên giữ tham chiếu, không thay số PDF.

| Mục | Kết quả |
|---|---|
| Mô hình | MIXED_GROUP_ACCOUNTING_RETURN_CROSSCHECK_NOT_RNAV_OR_SOTP |
| Phạm vi lợi nhuận | CONSOLIDATED |
| LN làm việc FY2025 | 33.020 nghìn tỷ VND |
| Vốn mẹ/tham chiếu thành phần tại31/12/2025 | 238.079 nghìn tỷ VND; SELECTED_EQUITY_SUBTOTAL_MINUS_PRINTED_NCI |
| Khoảng kịch bản lợi nhuận trên vốn | 183.443–306.146 nghìn tỷ VND |
| Trường hợp tham chiếu cơ sở | 232.164 nghìn tỷ VND |

## Chọn và phản biện mô hình

Vốn không tăng trong mô hình; lợi nhuận được thử giữ nguyên ROE hoặc hội tụ dần về chi phí vốn giả định trong3/5/10 năm. Suất sinh lợi yêu cầu18/15/12% kế thừa bộ độ nhạy nghiên cứu cũ, không phải WACC quan sát hoặc thay ngưỡng BUY. Trường hợp tham chiếu dùng lợi nhuận đã chọn,15%, hội tụ5năm; đây là lựa chọn phân tích, không phải kết luận doanh nghiệp sẽ phục hồi hay suy giảm đúng như vậy. Nhánh giữ nguyên lợi nhuận được giữ để phản biện giả định hội tụ.

Giá trị là vốn kế toán cộng PV lợi nhuận thặng dư; đối chiếu phân phối ròng dùng cùng giả định nên chỉ là kiểm tra đại số. Vốn cuối kỳ thu hồi được, phân phối vốn, nợ xấu/goodwill và nghĩa vụ chưa định giá vẫn cần kiểm tra. Mô hình không cộng tiền hoặc trừ nợ/NCI lần hai. Không gọi vốn sổ sách là RNAV.

**Dòng tiền/vốn thực tế:** các lịch sử CFO, chi mua tài sản, vay/trả gốc và nguồn đã giữ được chuyển nguyên vào JSON cạnh hồ sơ. Không biến CFO hợp nhất thành FCFE mẹ, không tự phân bổ capex bằng tỷ lệ lợi nhuận.

Binding kỳ extracted: giữ nhãn gốc ['UNRESOLVED-YEAR-C1'], bổ sung niên độ31/12/2025 chỉ cho cột cuối kỳ trên trang đã kiểm tra; không đổi toàn bộ corpus hoặc lấy cột so sánh.

Có số extracted NCI không khớp bản đọc PDF. Giữ bản extracted gốc trong sổ, dùng số PDF đã kiểm tra cho mô hình và không tự đưa lỗi OCR vào phép tính.

Đối chiếu CafeF: 4 bản ghi ứng viên, 0 chênh lệch độ lớn số trong 3 phép so sánh tham chiếu. Đơn vị/phạm vi API vẫn chưa được xác nhận nên không kết luận số giống nhau là đã khớp hoặc số khác là lỗi nhà cung cấp.

FY2025 CFO hợp nhất: 41.189; chi mua tài sản: 15.431; sau chi mua tài sản: 25.758 nghìn tỷ VND. Chỉ là đối chiếu dòng tiền báo cáo.

Đây là kiểm tra chéo lợi nhuận/vốn của nhóm hỗn hợp, **không phải RNAV/SOTP đã đủ dữ liệu**. Không cộng giá trị công ty con/dự án vào cùng kết quả và không suy ra giá trị kinh tế từng tài sản từ giá sổ sách.

## Cổ phần / ngày giá / hành động

Giá lưu trong DB: 63000 VND, phiên 2026-10-30; không phải báo giá hiện tại. Quyền/cổ phần theo ngày giá và nghĩa vụ đặc biệt chưa được cấp nghiệm thu. Không xuất giá mua/bán mới từ mẫu số nhà cung cấp.

**Mua:** Chỉ xem xét mua khi giá cùng ngày và mẫu số đã khớp, mô hình/nghĩa vụ đủ căn cứ, đáp ứng biên an toàn và suất sinh lợi theo tiêu chí hiện hành; chưa tự cấp tín hiệu từ bảng này.

**Giữ:** Chỉ xem xét giữ khi luận điểm kinh doanh còn đúng, quyền cổ đông và khả năng tài trợ không suy giảm; định giá và tỷ trọng vẫn phù hợp. Giữ không phải lựa chọn mặc định khi thiếu dữ liệu.

**Bán/giảm:** Xem xét bán/giảm khi luận điểm bị bác, nghĩa vụ/quyền pha loãng làm mất giá trị hoặc giá vượt khoảng giá trị có cơ sở sau kiểm tra lại; không bán chỉ vì một mô hình có điều kiện cho kết quả thấp.

**Kiểm chứng riêng:** Bàn giao/chuyển nhượng, thuế/NCI và mô hình dự án có dữ liệu đủ nếu chọn RNAV.

**Phản chứng còn mở:** Chuyển nhượng có thể lặp lại trong phát triển dự án; bàn giao và thuế/NCI chưa ổn định. RNAV không phải điều kiện tính cầu nối lợi nhuận này.

Tín hiệu hiện tại vẫn chưa xác định; không coi thiếu dữ liệu là HOLD mặc định. Thiếu giả định dự báo khác với thiếu tài liệu: vòng này đã khai thác nguồn vốn để tính tham chiếu, chưa khẳng định mọi vấn đề kinh tế đã khép.

PDF kiểm tra: [VHM trang17](../../../../../../data/manual-download/VHM/VHM_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf#page=17). Dữ liệu extracted/API, raw pointer và hash: [sổ đối chiếu](../source-comparisons/VHM.json).
