---
name: read-pdf-json-first
description: Đọc và tra cứu PDF trong dự án VN30 bằng JSON đã trích xuất trước; chỉ tải PDF thiếu và trích xuất nội dung chưa có theo quy trình hiện tại.
---

# Đọc PDF theo quy trình JSON trước

Đường dẫn dưới đây tính từ gốc repo. Đọc `AGENTS.md` và `docs/fundamental-data-engine/REBUILT_DATA_WORKFLOW.md` khi dùng skill. Đây là skill của dự án, được gọi qua AGENTS.md hoặc trực tiếp bằng đường dẫn này.

## 1. Tìm và dùng dữ liệu đã có

- Xác định tài liệu, ticker, loại báo cáo, kỳ, phạm vi hợp nhất/riêng lẻ và phiên bản được yêu cầu. Dùng `rg --files` rồi kiểm tra nội dung và manifest; không chỉ khớp tên file.
- Tìm trong `data/manual-extracted-pdf/<TICKER>.json`, `data/manual-extracted-pdf/notes/<TICKER>.json`, `data/manual-extracted-pdf/supplements/` và `data/combine/<TICKER>.json`. Combined có cả reference API: phân biệt PDF và CafeF.
- Kiểm tra document/source identity, kỳ, scope, revision và coverage của nội dung cần đọc. Đối chiếu hash đã lưu nếu PDF nguồn còn trên đĩa.
- Khi JSON phù hợp đã đủ: đọc JSON, không tải lại hoặc OCR lại. Bảng dùng `reports → periods → variants → groups → rows`; thuyết minh/nội dung trang dùng notes. Trích dẫn JSON và PDF/page khi có.
- JSON còn hợp lệ vẫn có thể dùng khi PDF lịch sử đã xóa; nêu giới hạn kiểm tra nguồn, không tự tải lại chỉ vì thiếu file nguồn. Chỉ đọc/trích xuất thêm khi JSON thiếu nội dung, lỗi, khác phiên bản hoặc yêu cầu cần kiểm tra hình ảnh. Không dùng kỳ/scope khác thay thế.

## 2. Chỉ bổ sung phần thiếu

- Nếu thiếu JSON phù hợp, tìm PDF có sẵn trong `data/manual-download/<TICKER>/`, inventory `data/manual-download/manifest.json`, hoặc đường dẫn người dùng cung cấp. Có đúng PDF thì trích xuất tại chỗ; không tạo bản tải trùng.
- Chỉ tải khi thiếu PDF cần thiết. Báo cáo tài chính VN30 chỉ được khám phá/tải qua `finance.vietstock.vn` và `static2.vietstock.vn`; kiểm tra từng redirect trước request kế tiếp. Đọc `docs/fundamental-data-engine/VIETSTOCK_ONLY_SOURCE_POLICY.md` và cấu hình nguồn hiện hành. Không fallback issuer/exchange. File người dùng cung cấp không cần tải.
- Lưu PDF theo layout hiện tại và cập nhật inventory theo schema hiện hữu: URL/tham số, receipt time, HTTP status, SHA-256, path. Giữ lỗi tải rõ ràng, không coi là dữ liệu 0. Không chạy reset hoặc tải lại toàn corpus/API để đọc một PDF.
- Ưu tiên PyMuPDF text/geometry; chỉ OCR trang scan hoặc không đọc đủ bằng Apple Vision helper hiện có. Lưu bảng và full-page notes cho phạm vi xử lý; ghi rõ trang/nội dung chưa xử lý.
- Tham khảo `scripts/lib/manual_display.py` và `scripts/process-b6-supplemental-pdfs.py` cho extraction trực tiếp PDF/page/boxes. Script supplemental có đợt xử lý và đường dẫn cố định: đọc code, giới hạn input/output cho tài liệu mới trước khi dùng; không chạy nguyên trạng cho tài liệu tùy ý.
- Workflow rebuild mô tả các script extract/map/notes/link hiện hữu. Chỉ chạy rebuild khi thực sự được yêu cầu; không tái tạo `documents/` hoặc `readers/` đã xóa trong lần đọc thường. Render/OCR trung gian dùng thư mục tạm và dọn sau xử lý; giữ PDF, JSON kết quả, notes và inventory.

## 3. Lưu đúng quy trình hiện tại

- Output chính: `data/manual-extracted-pdf/<TICKER>.json`, notes tương ứng; supplementary variants theo cấu trúc hiện hữu khi phù hợp. Chỉ cập nhật combined khi tác vụ cần. Không ghi đè variant khác hoặc chọn latest-wins.
- Giữ decimal strings theo đơn vị gốc; phân biệt 0, dash, null, missing và OCR mơ hồ. Không đoán EPS scaling, kỳ, scope hoặc ngày chưa biết.
- Giữ nhãn/mã/thứ tự và lineage. Evidence trỏ PDF path, `#page=N`, normalized cell/caption boxes; hash chỉ là metadata. Không tạo pointer tới OCR readers đã xóa.
- PDF numeric đọc được, kể cả 0, ưu tiên. Chỉ dùng CafeF đã có làm reference gắn nhãn khi thiếu số PDF phù hợp; tuân thủ source-priority v2 và giữ xung đột rõ ràng. Không map concept theo số tiền bằng nhau.
- Kết quả tự động là presentation candidate chưa review; không tự admission/scoring, sửa sealed evidence hay database kế toán.
- Kiểm tra JSON parse, document identity/hash, links/pages và variants cũ sau bổ sung. Khi thay corpus/combined, chạy `python3 scripts/verify-vn30-rebuilt.py`, xử lý lỗi liên quan và báo lỗi còn lại. Validator không chứng nhận OCR chính xác.
- Báo ngắn gọn đã tái sử dụng JSON hay tải/trích xuất mới, đường dẫn kết quả, nguồn/trang và nội dung còn thiếu. Khi chỉ tạo/chỉnh skill, không khởi động tải hay extraction.
