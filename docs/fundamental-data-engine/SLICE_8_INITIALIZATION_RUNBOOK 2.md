# Slice 8 — trích xuất từ manual

Luồng hiện hành chỉ đọc PDF do người dùng đặt trong `data/manual-fundamentals/<TICKER>/`.
Không tải dữ liệu từ web, không cần snapshot cũ hoặc database initialization.
Tên thư mục/mã cổ phiếu chỉ là gợi ý; việc xác nhận issuer, kỳ báo cáo, scope và số liệu vẫn cần review nội dung.

## Cài đặt và chạy

Từ repo root, tạo Python virtual environment và cài dependencies:

```sh
python3 -m venv .venv-manual
.venv-manual/bin/pip install -r scripts/requirements-manual.txt
.venv-manual/bin/python scripts/inspect-08b-manual-corpus.py
```

Output mặc định: `data/manual-extracted/current/`, gồm inventory, danh sách PDF, text theo từng trang và symlink về PDF gốc. Script từ chối ghi đè thư mục đã tồn tại. Để chạy lại, dùng `--output data/manual-extracted/run-02`. Có thể dùng `--inventory-only` mà không cần thư viện PDF.

```sh
VN30_EVIDENCE_WORK=data/manual-extracted/current VN30_NATIVE_VERIFY=1 \
  .venv-manual/bin/python scripts/extract-08b-pages.py --pages 12
VN30_EVIDENCE_WORK=data/manual-extracted/current \
  .venv-manual/bin/python scripts/reconcile-08b-extraction.py
```

Reader kiểm tra SHA-256 của PDF trước khi đọc. Với trang native, hai reader là PyMuPDF và pdfplumber. Với PDF scan cần Apple Vision helper, Tesseract và language data `vie+eng`; reader giữ exception khi OCR thất bại. Cấu hình mặc định legacy trên macOS: helper `/private/tmp/vn30-vision-ocr`, Tesseract `/opt/homebrew/bin/tesseract`, language data `/private/tmp/vn30-tessdata`. Biên dịch helper bằng:

```sh
clang -fobjc-arc -framework Foundation -framework Vision \
  scripts/lib/vision-ocr.m -o /private/tmp/vn30-vision-ocr
```

Đặt `vie.traineddata` trong `/private/tmp/vn30-tessdata/` và `eng.traineddata` từ bản cài Tesseract. `--pages` giới hạn số trang đầu (mặc định 12); chưa đọc hết PDF thì chưa thể kết luận không có số liệu. Reader không tự phê duyệt hoặc đưa số liệu vào database. Reconciler dùng identity/sector reference trong `docs/fundamental-data-engine/evidence/2026-10-10-di123-*.json`; đây là reference của project, không phải số liệu tài chính từ nguồn ngoài manual.

## Dữ liệu giữ lại

- `data/manual-fundamentals/`: PDF nguồn nguyên vẹn.
- `data/manual-extracted/current/`: kết quả của luồng hiện hành.
- `data/manual-extracted/current/ocr/`: một kết quả hai reader cho mỗi trang đã OCR; chỉ giữ output reader thô.
- `data/manual-extracted/current/page-text/`: text khảo sát trang hoặc reader cloud-only khi không có cặp reader đầy đủ.
- `data/manual-extracted/extraction-manifest.json`: nguồn của từng trang giữ lại và thống kê loại bản lặp.

Text native được đọc trực tiếp một lần từ 144 PDF. OCR thô được chọn từ các lần đọc cũ, không phải lần OCR mới cho toàn bộ corpus. Mỗi cặp body hash/trang chỉ giữ một file reader. File cloud-only được giữ để không mất kết quả duy nhất, chưa được kiểm chứng nội dung. Ảnh render, transcription đã qua reconciliation, kết quả qualification, snapshot và các bản reader lặp đã được xóa. PNG được tạo lại từ PDF khi cần review hình ảnh; hash render trong reader cũ là metadata, không phải bằng chứng hình ảnh đang được giữ.

Artifact lịch sử không tự trở thành dữ liệu canonical. Snapshot hỗn hợp, public downloads, captures, database initialization và execution package cũ được loại khỏi `data`. Các bản khôi phục dữ liệu/script cũ đã được xóa theo yêu cầu giải phóng dung lượng. Danh sách phần đã loại được ghi tại `SLICE_8_MANUAL_CLEANUP.json`. Tài liệu/evidence các lần chạy trước trong `docs` là lịch sử, các lệnh cũ trong đó không còn là runbook hiện hành.

Kiểm tra logic reconciliation: `python3 scripts/test-08b-extraction.py`.
Các script DB, backup, smoke, M6.8 và preflight dùng chung được giữ cho ứng dụng.
