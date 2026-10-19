# VNM — JSON thuyết minh BCTC hợp nhất

Yêu cầu ngày 19/10/2026: tải lại PDF và trích xuất đầy đủ phần thuyết minh cho các kỳ VNM đang đối chiếu: FY2022, FY2023, FY2024, FY2025 và 6M2026. Đây là dữ liệu trình bày ứng viên, không phải thay đổi canonical hoặc kết luận đóng blocker.

## Nơi lưu

- PDF tải lại: `data/reacquired-fundamentals/VNM/2026-10-19/`. Tách khỏi thư mục lịch sử đã dọn; không khôi phục giả các đường dẫn PDF/OCR cũ.
- JSON tổng hợp: `data/manual-extracted/notes-v1/VNM/2026-10-19/VNM.json`.
- JSON từng báo cáo: cùng thư mục, `FY2022.json` … `FY2025.json`, `6M2026.json`.
- Mục lục từ comparisons: `data/comparisons/VN30/VNM/notes-index.json`; đường dẫn + JSON Pointer đến từng nhóm và danh sách trang.
- `raw/<kỳ>/pNNNN.json`: OCR từng trang, chữ gốc, confidence, tọa độ, hash ảnh render và hash PDF. Lưu cả trang ngoài phần thuyết minh để kiểm kê toàn bộ nguồn.
- `inventory/<kỳ>.json`: danh sách tất cả trang, nhận dạng thuyết minh, trạng thái đọc.
- `manifest.json`, `ARTIFACT_HASHES.json`, `VERIFICATION.json`: thông tin nguồn, URL, kỳ, hash, kiểm tra cấu trúc.

## Phạm vi đã trích xuất

| Kỳ | Tổng trang PDF | Trang thuyết minh | Mục Vay bắt đầu tại trang vật lý |
|---|---:|---:|---:|
| FY2022 | 64 | 50 (15–64) | 47 |
| FY2023 | 64 | 50 (15–64) | 46 |
| FY2024 | 63 | 49 (15–63) | 47 |
| FY2025 | 63 | 49 (15–63) | 47 |
| 6M2026 | 72 | 57 (16–72) | 52 |

Tổng 326 trang PDF, 255 trang thuyết minh, 8.820 dòng OCR được nhóm theo hình học. Không có trang lỗi đọc. Đây là số dòng trình bày, không phải số khoản mục kế toán đã kiểm chứng.

Cả 5 PDF tải lại khớp SHA-256 nguồn đã giữ trong `data/manual-extracted/display-v1/VNM.json`. URL CloudFront 6M2026 trả 403; dùng bản sao công khai Vietstock được trang công bố PHS liên kết, khớp đúng hash cũ. Ngày tải lại được ghi; không tạo timestamp HTTP chính xác khi lần tải bằng curl chưa ghi thời điểm đó.

## Schema và cách đọc

`reports → thuyet-minh → periods → 2022/2023/2024/2025/2026-YTD2 → variants[] → groups[] → rows[] → cells[]`.

- Mỗi variant là một báo cáo riêng, có kỳ kết thúc và scope hợp nhất. Năm và YTD không gộp. Kỳ của tài liệu không tự áp cho mọi cột số liệu so sánh trong thuyết minh.
- Nhóm giữ tiêu đề gốc, số thuyết minh, phần La Mã nếu OCR đọc được, thứ tự và ID có occurrence. Số mục lặp lại ở phần khác không bị ghi đè. Khi mất chữ số La Mã thì giữ section chưa xác định, không kế thừa sai phần trước.
- Mỗi dòng giữ chữ gốc và từng OCR cell/chunk. `rawPath + rawLocator` trỏ chính xác tới quan sát OCR; từng token số có `characterSpan` trong chữ gốc, `lexicalValue` và giá trị decimal string nếu định dạng nhận dạng được.
- Một OCR cell có thể chứa nhiều số ở các cột liền nhau. `numericCandidates[]` giữ riêng các token nhưng **chưa tự gán tên cột, kỳ hoặc metric canonical**. `value: null` ở dòng nghĩa là dòng nhiều ô/nội dung chữ; không phải tất cả các số đều thiếu.
- Dấu gạch được giữ null với `EXPLICIT_DASH_NOT_ZERO`; số 0 vẫn là chuỗi `"0"`. Số trong ngoặc giữ dấu âm. Định dạng mơ hồ, ví dụ `58.472.984.36`, giữ lexical gốc và giá trị null.
- `pageUnitEvidence` giữ nguyên nhãn VND/USD và locator. Không mặc định mọi con số trên trang đều là tiền VND: còn tỷ lệ, cổ phiếu, số năm và nguyên tệ khoản vay. Các đơn vị/cột chưa gán giữ `UNASSIGNED`.

## Kiểm tra và giới hạn

Đã kiểm tra hash PDF, tất cả trang, không rơi/trùng OCR observation trên các trang thuyết minh, JSON Pointer, khớp bản tổng hợp/từng kỳ, ID không trùng, tách annual/YTD và dấu gạch/0/số âm/định dạng mơ hồ. Đã xem ảnh mẫu thuyết minh Vay của 5 kỳ và phần vay dài hạn 6M2026; **chưa duyệt hình ảnh toàn bộ 255 trang**.

Ranh giới mục, tiêu đề, ghép dòng và số OCR vẫn là ứng viên `UNREVIEWED_OCR`, `productionAdmissible: false`. Có thể có tiêu đề bị OCR bỏ số hoặc đọc sai. Không mô tả dữ liệu này là bảng kế toán đã đối chiếu đầy đủ. Nội dung toàn trang vẫn còn trong raw để sửa mapping mà không tải lại PDF.

Không sửa JSON comparisons annual trước đây, không chọn nguồn lại, không cập nhật canonical, Policy B, blocker hoặc scoreability. File mới trong comparisons chỉ là mục lục đến thuyết minh.

## Chạy lại

```sh
# Python có PyMuPDF; Apple Vision reader biên dịch từ scripts/lib/vision-ocr.m
/path/to/python scripts/extract-vnm-notes.py --vision /path/to/vision-reader --workers 4
python3 scripts/verify-vnm-notes.py
```

Script chỉ chấp nhận đúng hash 5 nguồn đã pin, dùng lại raw OCR khớp hash nếu đã có. Nguồn mới khác hash phải được xem như variant riêng; không tự thay thế dữ liệu hiện tại.
