# VNM S2 — đối chiếu BCTC và kỳ hạn

**Đã xử lý bốn yêu cầu bằng tài liệu đã có. S2 còn BLOCKING vì chưa chứng minh được khả năng trả đúng hạn; không kết luận VNM thiếu tài sản hoặc mất khả năng thanh toán.** Không yêu cầu tải lại báo cáo, không mở lại S1/F1/F2/S4.

## Số liệu gốc từ BCTC

BCTC hợp nhất Q3/2026, bảng cân đối tại30/09/2026: tiền/tương đương tiền **3,612 nghìn tỷ**; đầu tư tài chính ngắn hạn **22,926 nghìn tỷ**, gồm tiền gửi/đầu tư nắm giữ đến đáo hạn **22,9256 nghìn tỷ**; vay ngắn hạn **8,385 nghìn tỷ**; nợ ngắn hạn **19,305 nghìn tỷ**. Giá trị báo cáo được đối chiếu mã chỉ tiêu/cột/ngày, PDF/trang và hash; không thay bằng giả định mô hình.

Hệ số hiện hành tính từ BCTC **2.114x**; (tiền + đầu tư tài chính ngắn hạn)/nợ ngắn hạn **1.375x**. Đây là chỉ tiêu kế toán có bao gồm tiền gửi UNKNOWN về khả năng dùng đúng hạn, không phải tỷ lệ tiền stress chắc chắn. Thuyết minh IV.3/trang27 xác nhận tiền gồm tiền mặt/tiền gửi không kỳ hạn, tương đương tiền có tính thanh khoản cao phục vụ cam kết chi ngắn hạn. Không được mô tả chúng là tài sản không có tính thanh khoản chỉ vì chưa xác nhận quyền chuyển về công ty mẹ.

## 1. Tiền gửi UNKNOWN

Đã đọc các thuyết minh tiền/đầu tư/vay của FY2025 và H1/2026 riêng lẻ, hợp nhất; bổ sung chính sách Q3 từ PDF đã giữ, kết hợp Q3 notes1/3/4/15. Số dư tiền gửi có kỳ hạn được xác nhận là **số liệu BCTC**. Chính sách IV.4(b)/trang28 xác nhận từ2026 dùng giá trị phân bổ, gồm phân bổ lãi; số dư ghi sổ không đồng nghĩa toàn bộ là gốc có thể rút ngay. Chưa thấy ngày đáo hạn từng khoản, điều kiện rút trước hạn, xác nhận cầm cố và đơn vị sở hữu cho số dư Q3 trong phạm vi đã đọc. Vì vậy **không chuyển thêm khoản tiền gửi có kỳ hạn nào sang CONFIRMED_AVAILABLE**. Đây là UNKNOWN về khả năng dùng đúng hạn, không phải nghi ngờ số dư hoặc suy luận RESTRICTED.

Bảng mới tách `reportedAmountVerified`, bản chất thanh khoản theo chính sách kế toán, và xác minh truy cập theo công ty/ngày. Các khoản ký quỹ vẫn riêng. Số dư công ty mẹ H1 không được coi là số dư mẹ Q3; số hợp nhất không tự chứng minh có thể chuyển hết về mẹ. Báo cáo thường niên FY2025 có nhận định thanh khoản ổn định/hạn mức tín dụng nhưng không cho số hạn mức cam kết còn rút được tạiQ3, nên không cộng thành nguồn tiền.

## 2. Nợ và cổ tức theo kỳ hạn

- Cổ tức tạm ứng công bố28/10: **5.224.888.612.500 đồng**, ngày thanh toán **26/11/2026**, từ2.500đ/cp×share anchor đã chấp thuận. Retained VSDC notice xác nhận ngày; không suy ra từ ngày đăng ký cuối cùng12/11.
- Vay ngắn hạn8.385 nghìn tỷ thuộc bucket ngắn hạn tại30/09, **không có căn cứ gán toàn bộ đến hạn26/11**. Giữ ngày từng khoản N/R. Mốc30/09/2027 chỉ là biên theo phân loại kế toán trong phân tích, không phải ngày hợp đồng.
- Vay dài hạn97,388 tỷ: năm đáo hạn2030, không gán ngày cụ thể. Lãi phải trả111,393 tỷ và cổ tức cũ còn8,626 tỷ giữ riêng, ngày trả N/R.

Cầu nối cổ tức hợp nhất khớp **đúng đến đồng**: đầu năm8.382.960.340 + công bố3.901.449.812.250 − đã trả9tháng3.901.207.226.290 = còn8.625.546.300. CuốiH1 phải trả3.874.744.696.050; tiền trả trongQ3 **3,866,119,149,750 đồng** làm giảm về số dưQ3. Không cộng lại phần đã trả này vào nghĩa vụ tháng11. Nghị quyết28/10 là nghĩa vụ mới, không có trong số dư30/09.

`datedEnvelope` trình bày riêng nghĩa vụ ngày cố định và khoảng chưa biết của nợ, không giả lập một lịch trả nợ duy nhất. Không khẳng định số dư nợ/tiền tại30/09 còn nguyên vào30/10 hay26/11 khi thiếu giao dịch giữa kỳ.

## 3. Dòng tiền kinh doanh theo thời gian có bằng chứng

BCLCTT hợp nhất: H1/2026 **3,474 nghìn tỷ**,9tháng **7,746 nghìn tỷ**; quýIII suy ra cùng phạm vi **4.272 nghìn tỷ**. TTM9,406 nghìn tỷ là lịch sử/rate sensitivity. Không chia đềuTTM cho12tháng, không tự tạo dòng tiền57ngày hoặc coi toàn bộ là nguồn chắc chắn trước26/11. Nguồn CFO tương lai theo ngày **N/R**; việc không cấp tín dụng nguồn tiền chắc chắn không có nghĩa dự báo CFO bằng0.

Kịch bản annual stress cũ được giữ làm sensitivity, không biến chênh lệch600tỷ của phép cộng12tháng thành kết luận thiếu tiền thực tế vào26/11. Bằng chứng BCTC cho thấy nền tài sản thanh khoản đáng kể; điều chưa chứng minh là ghép đúng kỳ hạn/quyền sử dụng dưới stress.

## 4. Thuê và cam kết đã ký

Đã đối chiếu population cuốiFY2025 với thuyết minh H1 riêng lẻ/note22, H1 hợp nhất/note24 và Q3/note24. Interim notes đã đọc không cung cấp rollforward nghĩa vụ thuê/cam kết vốn còn lại. Tiền mua tài sản H1 **748,240 tỷ**,9tháng **1.311,507 tỷ**, quýIII **563,267 tỷ** là tiền đã chi; chưa có mapping đến từng hợp đồng đầu năm, hợp đồng ký mới/hủy/sửa. Vì vậy không lấy cam kếtFY2025 trừ toàn bộ tiền mua tài sản để gọi là số còn phải trả.

Số còn lại và kỳ hạn hiện tại **N/R**, không phải0, không giữ nguyênFY2025. Tiền thuê đã nằm trong CFO không bị trừ thêm lần nữa. Chi đầu tư tùy ý/cổ tức chưa công bố không tự đưa vào nghĩa vụ bắt buộc.

## Acceptance và giới hạn

METRIC_DEFINITIONS §§5.2–5.3,10.2,13.1 và SCORING_MODEL §13.4 giữ nguyên. S2 chưa có matched conservative pass; còn đúng hai dữ kiện thiết yếu: (a) khả năng dùng đúng hạn của **phần tiền gửi/nguồn tài trợ cần thiết**, (b) nghĩa vụ thuê/cam kết hiện tại hoặc upper bound có nguồn. Không đòi chứng nhận toàn bộ tiền gửi hay bảng dự án. Không tự chấm điểm, cấp authority, promotionVNM17, thay danh mục/NAV hoặc kích hoạt production. S1 giữ CLOSED.

S2_PRIMARY_STATEMENT_RECONCILIATION.json có số gốc/provenance, access review, cầu nối cổ tức, timeline, CFO split và review coverage; VALIDATION.json ghi kiểm chứng thực tế. Các báo cáo cũ được giữ nguyên cho audit, kết luận kỳ hạn ở đây là bản kế nhiệm.
