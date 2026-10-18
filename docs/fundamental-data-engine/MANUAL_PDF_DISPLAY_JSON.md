# Manual PDF → display JSON v1

Quy ước được triển khai theo yêu cầu ngày 2026-10-18: trích xuất PDF trong `data/manual-fundamentals` và sắp xếp theo cùng cấu trúc trình bày đã dùng cho API CafeF. Đây là dữ liệu dùng để xây giao diện và rà soát kết quả trích xuất; không tự thay thế bằng chứng kế toán đã được duyệt.

## Đầu ra

```text
data/manual-extracted/display-v1/
  manifest.json                 # Kiểm kê đọc PDF; complete phải true
  documents/<SHA256>.json.gz    # Toàn bộ trang: native text hoặc tham chiếu OCR
  readers/<SHA256>-p<N>.json.gz # OCR bổ sung cho trang scan chưa có bộ đọc phù hợp
  <TICKER>.json                # JSON cho giao diện, một tệp mỗi mã
  display-manifest.json         # Thống kê mapping và các báo cáo nhận diện được
  verification.json             # Kết quả kiểm tra hash, coverage và lineage giá trị
```

Raw JSON lớn được gzip; dùng `gzip.open(path, 'rt')` hoặc giải nén để đọc. SHA-256 của tệp `.json.gz` tính trên bytes nén, JSON Pointer áp dụng trên nội dung sau giải nén. JSON theo mã cổ phiếu không nén.

## Cấu trúc dùng chung với CafeF

```text
reports
  can-doi-ke-toan / ket-qua-kinh-doanh / luu-chuyen-tien-te
  thuyet-minh / bao-cao-bo-sung
    key, label
    periods
      2025 / 2026-Q1 / 2026-YTD2 / 2025-01-01 / UNRESOLVED-...
        year, quarter, periodType
        variants[]
          id, periodKey, reportingScope, scopeStatus, source, groups[]
            id, label, order, sourcePage, reportClassification
            columnHeader, unitEvidence, rows[], unmappedCells[]
              id, code, label, order, value, lexicalValue, status
              sourcePage, rawLocator, cellEvidence
              boxes, captionBoxes, readerWordIndices
              unit, currency, scale, reviewStatus
```

`documents[]` ở cấp mã cổ phiếu giữ kiểm kê toàn bộ PDF và từng trang, kể cả trang không có bảng hoặc chưa nhận diện được báo cáo. `reviewedFacts` là bản sao có truy vết của facts đã có trong snapshot hiện hành, tách biệt với các dòng vừa trích tự động. Không dùng chúng để tự gắn nhãn REVIEWED cho bảng mới.

Không tự tạo BCTC tóm tắt nếu PDF không có bảng tương ứng. Nhóm bảng dùng trang nguồn để giữ thứ tự và tránh suy diễn cây kế toán từ khoảng thụt lề. `code` chỉ là mã đọc theo vị trí trong PDF; không mặc định bằng mã chỉ tiêu CafeF.

## Quy tắc giữ dữ liệu

1. Kiểm kê lại toàn bộ PDF vật lý và kiểm tra SHA-256; không dựa riêng vào danh sách 133/144 tài liệu cũ. Giữ nguyên PDF nguồn, bằng chứng cũ, database và dữ liệu CafeF.
2. Đọc native text với tọa độ nếu trang có đủ text và không bị ảnh scan lớn che phủ. Với scan, tái sử dụng resident reader khớp hash + trang; nếu chưa có thì tạo reader Apple Vision mới, đánh dấu chưa kiểm tra.
3. Nhận diện ba bảng chính từ tiêu đề; trang nối tiếp được đánh dấu `TABLE_CONTINUATION_CANDIDATE`. Thuyết minh và bảng bổ sung nằm ở report riêng. Trang không có bảng vẫn có raw text/reader trong kiểm kê.
4. Nhận diện cột theo tọa độ và đọc kỳ từ đầu cột. Kỳ chưa rõ giữ `UNRESOLVED-*`; năm trong tên file chỉ là hint, không phải bằng chứng để gán kỳ. Số dư đầu kỳ 01/01/2025 giữ khóa `2025-01-01`, không ghép với cuối năm 2025. Các bảng quý/lũy kế cần đọc đúng header, không suy ra dòng tiền quý riêng từ số lũy kế.
5. Mỗi PDF/cột/phạm vi báo cáo là variant riêng. Giữ các bản so sánh, điều chỉnh và PDF khác nhau; không tự chọn bản mới nhất. Hợp nhất và riêng lẻ trong một PDF được tách variant theo tiêu đề trang.
6. `value` là chuỗi decimal theo **đơn vị in trên trang**, không đổi đơn vị hoặc dùng số thực binary. `lexicalValue` giữ nguyên token OCR. Dấu ngoặc thể hiện số âm. `ZERO`, `DASH`, `MISSING_CELL`, `AMBIGUOUS_CELL`, `AMBIGUOUS_NUMERIC_FORMAT` khác nhau. Dấu gạch không tự đổi thành 0.
7. Giữ bằng chứng đơn vị từ header; không rõ thì null/UNDECLARED. Dòng EPS không kế thừa hệ số triệu/tỷ đồng của bảng; để đơn vị trên cổ phiếu chưa xác định khi chưa có bằng chứng riêng. Không cộng, quy đổi ngoại tệ hoặc chuẩn hóa tài khoản tự động.
8. `cellEvidence` chỉ đến tệp raw/reader, hash và JSON Pointer của token gốc. Vision có thể ghép hai số trong một box; `APPROXIMATE_SPLIT_BOX` đánh dấu tọa độ chia xấp xỉ. Nhãn xuống dòng và mã dòng đều là ứng viên theo hình học, cần kiểm tra khi dùng chính thức. Khi reader đầu thiếu nhãn, reader thứ hai chỉ được bổ sung nếu cùng trang, cùng giá trị và cùng vị trí dòng; nguồn nhãn được giữ riêng trong `captionEvidence`, trạng thái `INDEPENDENT_READER_CANDIDATE`.
9. Kết quả tự động giữ `PDF_EXTRACTION_CANDIDATE`, `UNREVIEWED`, `productionAdmissible: false`. Kiểm tra lineage thành công chứng minh nguồn và phép đổi chuỗi số, không chứng minh đã đọc đúng mọi nhãn/cột/kỳ. Kiểm tra và admission kế toán tiếp tục dùng quy trình riêng.

## Tái tạo

Python với dependencies trong `scripts/requirements-manual.txt`. Apple Vision dùng executable biên dịch từ `scripts/lib/vision-ocr.m` trên macOS:

```sh
python scripts/extract-manual-display.py --vision /path/to/vision-ocr --workers 4
python scripts/map-manual-display.py
python scripts/verify-manual-display.py
python scripts/test-manual-display.py
```

Executable Vision có thể cần quyền truy cập hệ thống ngoài sandbox. Việc đọc không gọi dịch vụ OCR cloud. Các reader mới được cache để chạy lại không OCR lại toàn bộ. `--ticker VNM` dùng để đọc một mã, lưu manifest riêng; full manifest chỉ do lần chạy toàn kho tạo ra. `--preview` của bước mapping chỉ tạo dữ liệu kiểm tra tạm trong thư mục `preview`, không được coi là đầu ra đủ toàn kho.

## Gắn lên website sau này

Tab lấy từ `reports`, kỳ lấy từ `periods`, phiên bản và scope chọn từ `variants`. Render `groups`/`rows` theo thứ tự mảng. Dùng `id` cho React key, không dùng nhãn làm khóa. Không ghép mã PDF và CafeF khi chưa có bảng mapping riêng. Mở PDF tại `source.retainedPath` và trang `sourcePage` để rà soát; hiển thị trạng thái thiếu/không chắc chắn thay vì 0.
