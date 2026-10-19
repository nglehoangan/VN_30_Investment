# Báo cáo tài chính tải thủ công

Từ yêu cầu ngày 19/10/2026, thư mục chuẩn là `data/manual-download/` thay cho `data/reacquired-fundamentals/`.

- `VNM/2026-10-19/`: giữ 5 BCTC đã tải (FY2022–FY2025 và 6M2026), nội dung và SHA-256 không đổi.
- `TCX/2026-10-19/TCX_FY2022_Audited_Standalone.pdf`: BCTC kiểm toán riêng năm 2022 của TCBS/TCX, 64 trang, 4.824.102 byte; SHA-256 `f904f2010cc64c286b57e592d12418f0cb5bc78ab5e60d45ac6f35c441f0daec`, khớp nguồn gốc đã đối chiếu.
- `TCX/2026-10-19/manifest.json`: URL, kỳ, scope, trạng thái tải, hash và các vị trí cần xem.
- `DIRECTORY_MIGRATION.json`: ghi nhận việc chuyển thư mục và hash 5 PDF VNM.

Giữ đường dẫn cũ bằng symlink `data/reacquired-fundamentals -> manual-download` để bằng chứng lịch sử, manifest và JSON Pointer trước đây vẫn mở được. Không viết lại nguồn/PDF/OCR hoặc các witness đã seal chỉ để thay tên thư mục. Các tài liệu trước đây ghi thư mục cũ là đường dẫn lịch sử còn tương thích; vị trí vật lý mới nằm trong manual-download. Script trích xuất VNM hiện dùng đường dẫn chuẩn mới.

Vị trí TCX cần xem trong PDF: Thuyết minh 18 trang 43; Thuyết minh 28 trang 52; Thuyết minh 30 trang 53; Thuyết minh 36.4 trang 63. Trang 43 đã kiểm tra ảnh, có khoản phải trả nhà đầu tư Két Vàng 5.284.485.167.173 VND. Chỉ tải lại tài liệu không tự giải quyết phân loại nợ tài chính; không sửa canonical, blocker hoặc scoreability.
