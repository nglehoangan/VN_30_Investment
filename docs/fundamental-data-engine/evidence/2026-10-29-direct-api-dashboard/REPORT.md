# Giá API ghi thẳng SQLite và dashboard

Ngày29/10/2026. **P1giá mới chưa vào dashboard đã được xử lý trong phạm vi hiển thị.**

## Luồng mới

Chạy lệnh cũ `node api/tcbs.mjs` bằng Node22.23.2. Mỗi phản hồi API đi thẳng vào database ứng dụng (`DATABASE_URL` hoặc `data/vn30.sqlite`), không tạo capture folder, capture.json, manifest hoặc rawfile dữ liệu trung gian. Phiên xác thực tiếp tục dùng cơ chế cache riêng bảo mật hiện có. Database/schema phải tồn tại; lệnh không tự migrate hoặc ghi ledger.

Phản hồi HTTPthất bại cũng lưu nguyên raw text và metadata trong SQLite. Sau lấy dữ liệu, các giá hợp lệ được cập nhật trong transaction; lỗi API tài khoản không làm mất market prices hợp lệ. Console ghi rõ tổng trạng thái và displayPricesUPDATED/PARTIAL. Các response, variants và run giữ riêng trong DB, không overwritesource cũ.

Ưu tiên matchPriceAPI5.1khi thực sự có số dương chính xác. Trước phiên,5.1có thể chỉ trả refPrice; lúc đó không dựng giá khớp giả mà dùng dailybar gần nhất đã qua mốc15hViệt Nam, lưu đúng ngày và fieldDAILY_BAR_CLOSE_REFERENCE. Chỉ giá nguyên dương safe-integer VND được nhận ở adapter hiện tại; schema khác giữ raw/rejected, không làm tròn. Chọn sessionmới nhất trước rồi thời gian nhận, không lùi giá vì lượt lấy sau trả bar cũ.

Reader kiểm tra hash/value/ticker/day/field/unit và pointer tới nguyên raw trong DB. Dashboard và bảngVN30đọc trực tiếp DB trên mỗi lần tải trang. Holdings tính lời/lỗ theo importedCost; từng mã ghi ngày giá. Khi thiếu mã/khác ngày, không dựng tổng định giá đồng nhất. Cổ tức chờ, phí, tiền và ledger giữ nguồn/quy tắc riêng. Chưa cấp quyền formalNAV/scoring/production.

## Áp dụng và kiểm tra

Đã verify31response thị trường có sẵn của lượt29/10và ghi trực tiếp30market prices vào DB, không gọi lại API hoặc cần OTP. Ngày giá thực tế là28/10/2026. Lấy số mới qua composition root và trình duyệt desktop/mobile/board đã PASS: FPT54000,220cổ phiếu,giá vốn16065060,lời/lỗ−4185060; cash327420,pending475000giữ nguyên. Fingerprint portfolio/ledger_transaction/ledger_leg/portfolio_projection trước và sau khớp.

-24APItestsđạt:CLI/session/stream/subaccount/direct persistence, no capture data folder, raw precision, idempotence, rollback-date protection, future/schema rejection và pre-open metadata fallback.
-47targeted testsđạt:SQLite→reader→imported-basisP/L, owner data, broker snapshot và dashboard regression.
-Actual composition root và browser1440/390/dashboardboardđạt. Không tạo screenshot hoặc data copy trong browserQA.
-Build/typecheck/lint code thay đổi/boundariesđạt. Không chạy lại toàn bộ legacy suite trong bản fix hẹp này; các issueB6khác theo reportrecheck29/10vẫn riêng.

Không xóa capture lịch sử đã có. Những lần API tới không ghi thêm bản sao dữ liệu ngoài SQLite. Chứng cứ dữ liệu thật, accounting fingerprint, testcase/logvà hash source ở gói này.
