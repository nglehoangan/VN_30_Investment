# Bổ sung báo cáo kiểm toán FY2025 và quy tắc LPB/TCX

Đã tải trực tiếp từ danh sách Vietstock SSI/TCX năm2025 qua endpoint công khai `/data/getdocument` (code, year2025, type1, page1). URL archive lấy từ phản hồi thực tế; chỉ dùng finance.vietstock.vn/static2.vietstock.vn, không fallback website doanh nghiệp/sàn, không bỏ kiểm tra TLS. Raw listing được giữ trong hai file `*-listing-2025.json`; website LastUpdate không tự được coi là thời điểm công bố đầu tiên.

## Đã tải

| Mã | Tài liệu | Kết quả |
| --- | --- | --- |
| SSI | BCTC hợp nhất kiểm toán năm2025 | 1 ZIP, 2 PDF Việt/Anh, mỗi báo cáo102trang |
| TCX | BCTC kiểm toán năm2025 | 1 ZIP; 2 PDF báo cáo Việt/Anh, mỗi báo cáo73trang; 2 công văn công bố Việt/Anh, mỗi công văn1trang |

Nguồn/PDF/ZIP nằm trong `data/manual-download/<TICKER>/2026-10-29-fy2025/`. `download-manifest.json` ghi URL, HTTP200, raw listing/request parameters, archive hash, file size, thời điểm tải theo local download file mtime và quan hệ từng archive member. Các ZIP được kiểm tra CRC, traversal/symlink và header PDF trước khi giải nén. Cả6PDF đều mở được; xem `pdf-open-validation.json`.

Đã xem ảnh bản Việt: SSI physical pages1,6,9,11 (cover công bố, identity, ý kiến kiểm toán FY2025 và scope/unit của báo cáo); TCX pages1,6 (kỳ kết thúc31/12/2025 và báo cáo kiểm toán). Đây là kiểm tra identity/type/year, không phải đã trích xuất hoặc nghiệm thu mọi giá trị. Bản Anh được giữ riêng, không gộp/ghi đè bản Việt. PDF signatures không được xác minh mật mã trong bước này.

Download index bổ sung: `data/manual-download/supplemental-manifest-2026-10-29.json`. Inventory cũ, JSON tài chính đã trích xuất, DB và các seal cũ được giữ nguyên; vì vậy các manifest của snapshot cũ vẫn mô tả đúng tập nguồn tại thời điểm chốt trước đây. Lượt extraction/normalization tiếp theo cần đọc index bổ sung này để xử lý các tài liệu mới, không tự đưa chúng vào scoring.

## Quy tắc chủ dự án vừa xác nhận

**LPB/TCX: tài liệu ghi rõ năm và đã kiểm toán là đủ về điều kiện loại tài liệu; không yêu cầu thêm nhãn hợp nhất/riêng.** Ghi nhận tại `owner-annual-rule.json`; tài liệu được cập nhật điều kiện tại `document-acceptance-and-failures.json`.

Giữ scope gốc/as-presented và giá trị cũ; không tự đổi thành hợp nhất. Quy tắc không tự miễn kiểm tra đơn vị, đúng cột/kỳ, provenance, publication/knowledge hoặc input/bridge. Báo cáo interim/soát xét không tự trở thành annual audited. Các nhận xét LPB/TCX annual trong hồ sơ review trước đây được supersede về yêu cầu nhãn scope bởi quyết định này; seal cũ không sửa.

## 7 mục tải lỗi trong inventory ngày19/10

Tất cả có statusFAILED/HTTP404. Đây là kết quả của URL đã thử, không phải kết luận không tồn tại tài liệu và không phải lần thử lại hôm nay.

| Mã | Tài liệu/kỳ |
| --- | --- |
| CTG | Báo cáo tỷ lệ an toàn vốn6T2026 |
| HDB | Báo cáo tỷ lệ an toàn vốn6T2026 |
| MBB | Báo cáo tỷ lệ an toàn vốn2025 |
| MBB | Báo cáo tỷ lệ an toàn vốn6T2026 |
| SHB | Báo cáo tỷ lệ an toàn vốn6T2026 |
| VIB | Báo cáo tỷ lệ an toàn vốn6T2026 |
| VIC | BCTC hợp nhất soát xét6T2026, URL dùng tên `6T2026` |

VIC đã có bản hợp nhất cùng kỳ tải thành công ở URL/tên `6T_2026_Soatxet_Hopnhat.pdf`; lỗi URL kia không có nghĩa toàn bộ báo cáo VIC cùng kỳ đang thiếu. Tên file, URL gốc và thời điểm quan sát của cả7mục giữ trong `document-acceptance-and-failures.json`.
