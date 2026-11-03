# VIC — bằng chứng thuế và phạm vi nguồn cần bổ sung

Đã đọc trực tiếp thêm sáu trang nguồn, lưu bảy record có ghim PDF/hash/trang, và kiểm tra tám đẳng thức thuế. Không thay bằng chứng cũ hoặc trạng thái nghiệm thu.

## Đã xử lý trong phạm vi được phép

- Tách thuế suất tham chiếu chung khỏi ưu đãi sản xuất VinFast. Các mức 0/5/10/20% chỉ là nhánh giả định có điều kiện, không chứng minh thuế của tài trợ hoặc Novatech.
- Tách thuế hiện hành, thuế hoãn lại và khoản lỗ chưa ghi nhận tài sản thuế. Không bù lỗ giữa các pháp nhân hay dùng nhóm lỗ hợp nhất để nhận lợi ích thuế cho từng giao dịch.
- Kiểm tra đúng cột bảng thuế hoãn lại mẹ: 162656 triệu là số đầu năm của DTA tạm nộp thuế trên tiền ứng trước, 310681 triệu là thu nhập thuế hoãn lại trong năm. Thứ tự OCR thô không đủ để chọn cột.
- Đối chiếu bảng thuế mẹ và hợp nhất riêng biệt, không dùng thuế suất hiệu dụng của mẹ hoặc nhóm thay thuế giao dịch tại VinFast.
- Chuẩn bị hai gói dữ liệu cần có cho tài trợ và Novatech: thuế hiện hành/hoãn lại và phần sau thuế thuộc mẹ/NCI. Những giá trị chưa chứng minh vẫn null.

## Thông tin còn thiếu

Cần công bố kiểm toán và thuyết minh của VinFast JSC/VinFast Auto FY2025, điều khoản CPƯĐ và thay đổi quyền lợi khi tách/bán Novatech. Nguồn phải xác định được pháp nhân, sự kiện, kỳ, thuế và phân bổ; báo cáo USD/US-GAAP phải có cầu nối về phạm vi và cơ sở kế toán VIC trước sử dụng. Không cần chủ tài khoản gửi lại báo cáo công ty mẹ VIC.

Các truy vấn bổ sung bị giới hạn vào finance.vietstock.vn/static2.vietstock.vn chưa xác định được bảng thuế và phân bổ theo sự kiện cần thiết; không kết luận chúng không tồn tại. Không thu thập hồ sơ bên ngoài phạm vi đã duyệt.

## Một quyết định phạm vi nguồn đang chờ

AGENTS.md dòng 148 quy định: “Discover and acquire financial PDFs only through finance.vietstock.vn and static2.vietstock.vn. No issuer/company or exchange website fallback”.

Đề nghị chủ tài khoản cho phép đọc thêm công bố chính thức của VinFast (IR) và SEC EDGAR cho nghiên cứu VIC. Sau khi được phép, tự tìm và lưu bằng chứng gốc, đối chiếu chuẩn mực/tiền tệ/phạm vi, rồi tiếp tục xử lý các vấn đề phát sinh. Đây là ngoại lệ thu thập nguồn nghiên cứu có giới hạn; không sửa seal cũ, không promote source authority hoặc cấp quyền production. Sự đồng ý không đảm bảo báo cáo công khai sẽ đủ mọi bảng giao dịch; nếu vẫn cần thông tin không thể tự lấy thì sẽ nêu chính xác phần thiếu.

Câu hỏi phạm vi nguồn đã được gửi; chưa có câu trả lời đồng ý tại thời điểm lập gói này. Chưa truy cập nguồn IR/SEC để thu thập tài liệu tài chính.

## Tệp đối chiếu

- `checked-tax-readings.json`: các số đọc và ràng buộc trang/cột/phạm vi/đơn vị.
- `transaction-requirements.json`: trường dữ liệu còn thiếu và tám nhánh thuế độc lập theo hai khoản.
- `verification.json`: tám kiểm tra số học, không phải nghiệm thu tài chính.
- `manifest.json`: ghim input/source và kết quả; DB và quyền production không thay đổi.
