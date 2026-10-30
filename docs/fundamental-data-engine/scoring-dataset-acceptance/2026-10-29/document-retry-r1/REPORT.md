# Thử lại tài liệu Vietstock — 29/10/2026

**6/6 mục được thử lại trả HTTP200 và đã lưu PDF.** MBB an toàn vốn6T2026 không gửi request, ghi tạm hoãn theo xác nhận chủ dự án rằng chưa được công bố. Thông tin chưa công bố này được gắn nguồn OWNER_REPORTED, không giả làm xác minh publication độc lập.

| Mã | Tài liệu | HTTP | Trang | Kết quả |
| --- | --- | ---: | ---: | --- |
| CTG | An toàn vốn6T2026 | 200 | 16 | Đã lưu |
| HDB | An toàn vốn6T2026 | 200 | 10 | Đã lưu |
| MBB | An toàn vốn2025 — dùng đúng đuôi `.PDF` chủ dự án gửi | 200 | 21 | Đã lưu |
| SHB | An toàn vốn6T2026 | 200 | 14 | Đã lưu |
| VIB | An toàn vốn6T2026 | 200 | 20 | Đã lưu |
| VIC | BCTC hợp nhất soát xét6T2026 — dùng đúng `QUY%202`, tên file và query `ver=1194354f` | 200 | 132 | Đã lưu; hash trùng bản VIC cùng kỳ đã giữ |
| MBB | An toàn vốn6T2026 | — | — | Tạm hoãn; không tải lại, không điền dữ liệu kỳ trước |

Các URL chính xác, thời điểm bắt đầu/kết thúc, HTTP, SHA256, file size, đường dẫn PDF và matched prior hashes được lưu trong `download-manifest.json`. Sáu PDF ở `data/manual-download/<TICKER>/2026-10-29-owner-retry/`. Bộ chỉ mục bổ sung: `data/manual-download/supplemental-manifest-2026-10-29.json`.

Đã kiểm tra hash, mở đủ6PDF và xem ảnh trang đầu. `pdf-open-validation.json` ghi số trang. Đây là xác minh tải/identity cơ bản, chưa trích xuất/duyệt giá trị CAR/CET1, framework, đơn vị, phạm vi hay publication. Không tự đưa vào scoring.

Receipt404 ngày19/10 trong inventory cũ được giữ nguyên như lịch sử. Kết quả mới supersede lỗi cũ cho trạng thái lần tải hiện tại; không diễn giải404 cũ là tình trạng hiện tại. Trạng thái MBB6T2026 không còn là mục cần tự động retry trong lượt này, nhưng việc hoãn không tự cấp readiness.

DB và manifest lịch sử không thay đổi. Dùng `scripts/retry-owner-vietstock-documents.py` cho lượt này; script từ chối output/source đã tồn tại. Transport chỉ đến finance.vietstock.vn/static2.vietstock.vn, kiểm tra redirect từng hop và giữ TLS verification.
