# VIB — xử lý nguồn và mô hình tham chiếu FY2025

**Đã xử lý nguồn đang có:** đọc trực tiếp trang vốn PDF, đối chiếu extracted JSON và kiểm tra ô nguồn CafeF. Đầu vào CafeF chưa khai báo đủ đơn vị/phạm vi nên giữ tham chiếu, không thay số PDF.

| Mục | Kết quả |
|---|---|
| Mô hình | FINANCIAL_COMMON_CAPITAL_EXCESS_RETURN |
| Phạm vi lợi nhuận | CONSOLIDATED |
| LN làm việc FY2025 | 5.390 nghìn tỷ VND |
| Vốn mẹ/tham chiếu thành phần tại31/12/2025 | 46.905 nghìn tỷ VND; COMPONENT_SUM_PROXY_NCI_NOT_SEPARATELY_PRINTED |
| Khoảng kịch bản lợi nhuận trên vốn | 20.978–52.349 nghìn tỷ VND |
| Trường hợp tham chiếu cơ sở | 43.290 nghìn tỷ VND |

## Chọn và phản biện mô hình

Vốn không tăng trong mô hình; lợi nhuận được thử giữ nguyên ROE hoặc hội tụ dần về chi phí vốn giả định trong3/5/10 năm. Suất sinh lợi yêu cầu18/15/12% kế thừa bộ độ nhạy nghiên cứu cũ, không phải WACC quan sát hoặc thay ngưỡng BUY. Trường hợp tham chiếu dùng lợi nhuận đã chọn,15%, hội tụ5năm; đây là lựa chọn phân tích, không phải kết luận doanh nghiệp sẽ phục hồi hay suy giảm đúng như vậy. Nhánh giữ nguyên lợi nhuận được giữ để phản biện giả định hội tụ.

Giá trị là vốn kế toán cộng PV lợi nhuận thặng dư; đối chiếu phân phối ròng dùng cùng giả định nên chỉ là kiểm tra đại số. Vốn cuối kỳ thu hồi được, phân phối vốn, nợ xấu/goodwill và nghĩa vụ chưa định giá vẫn cần kiểm tra. Mô hình không cộng tiền hoặc trừ nợ/NCI lần hai. Không gọi vốn sổ sách là RNAV.

**Dòng tiền/vốn thực tế:** các lịch sử CFO, chi mua tài sản, vay/trả gốc và nguồn đã giữ được chuyển nguyên vào JSON cạnh hồ sơ. Không biến CFO hợp nhất thành FCFE mẹ, không tự phân bổ capex bằng tỷ lệ lợi nhuận.

Đối chiếu CafeF: 2 bản ghi ứng viên, 0 chênh lệch độ lớn số trong 1 phép so sánh tham chiếu. Đơn vị/phạm vi API vẫn chưa được xác nhận nên không kết luận số giống nhau là đã khớp hoặc số khác là lỗi nhà cung cấp.

Với ngân hàng/chứng khoán, nợ huy động/tài trợ là bộ phận hoạt động: dùng lợi nhuận trên vốn và kiểm tra khả năng phân phối thay vì DCF doanh nghiệp trừ tổng nợ. NPL/CAR/vốn khả dụng vẫn là điều kiện riêng; không suy ra100% lợi nhuận có thể trả cổ tức.

Trang vốn không in riêng dòng NCI; tổng các thành phần đã đọc khớp subtotal. Dùng như proxy có điều kiện, không ghi NCI bằng0 hoặc xác nhận đầy đủ mọi quyền.

## Cổ phần / ngày giá / hành động

Giá lưu trong DB: 13800 VND, phiên 2026-10-30; không phải báo giá hiện tại. Quyền/cổ phần theo ngày giá và nghĩa vụ đặc biệt chưa được cấp nghiệm thu. Không xuất giá mua/bán mới từ mẫu số nhà cung cấp.

**Mua:** Chỉ xem xét mua khi giá cùng ngày và mẫu số đã khớp, mô hình/nghĩa vụ đủ căn cứ, đáp ứng biên an toàn và suất sinh lợi theo tiêu chí hiện hành; chưa tự cấp tín hiệu từ bảng này.

**Giữ:** Chỉ xem xét giữ khi luận điểm kinh doanh còn đúng, quyền cổ đông và khả năng tài trợ không suy giảm; định giá và tỷ trọng vẫn phù hợp. Giữ không phải lựa chọn mặc định khi thiếu dữ liệu.

**Bán/giảm:** Xem xét bán/giảm khi luận điểm bị bác, nghĩa vụ/quyền pha loãng làm mất giá trị hoặc giá vượt khoảng giá trị có cơ sở sau kiểm tra lại; không bán chỉ vì một mô hình có điều kiện cho kết quả thấp.

**Kiểm chứng riêng:** Chi phí tín dụng, thu hồi, quỹ và chi phí phái sinh/FX giữ nguyên.

**Phản chứng còn mở:** Chưa có dân số khoản vay/độ trễ tổn thất phù hợp; quỹ đã được duyệt chưa chứng minh toàn bộ phạm vi đã phản ánh đúng một lần.

Tín hiệu hiện tại vẫn chưa xác định; không coi thiếu dữ liệu là HOLD mặc định. Thiếu giả định dự báo khác với thiếu tài liệu: vòng này đã khai thác nguồn vốn để tính tham chiếu, chưa khẳng định mọi vấn đề kinh tế đã khép.

PDF kiểm tra: [VIB trang9](../../../../../../data/manual-download/VIB/VIB_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf#page=9). Dữ liệu extracted/API, raw pointer và hash: [sổ đối chiếu](../source-comparisons/VIB.json).
