# Kết quả dựng lại dữ liệu VN30 — 19/10/2026

Đã xóa dữ liệu cũ theo yêu cầu, giữ nguyên `data/vn30.sqlite`. Hash database trước/sau được ghi trong `reset-receipt.json`; kiểm tra cuối xác nhận không đổi. Không tái sử dụng các giá trị tài chính đã extract cũ.

- `data/manual-download/`: 337 PDF cho đủ 30 mã; 330 nội dung PDF khác nhau, 23,004 trang. Tất cả 344 link Vietstock đã lưu đều được thử tải.
- `data/manual-extracted-pdf/`: 30 JSON bảng, 523,094 ô; 30 JSON toàn văn tại `notes/`, gồm mọi trang thuyết minh và các trang chưa phân loại. Giữ PDF, toàn văn thuyết minh và tọa độ ô; liên kết trực tiếp tới tên file PDF và trang. `documents/` và `readers/` đã được xóa theo yêu cầu tiếp theo.
- `data/manual-extracted-api/`: 30 JSON CafeF, 248 request và 234,323 ô đã kiểm tra nguồn. Giữ nguyên raw responses và từng capture/request mode.
- `data/combine/`: 30 JSON theo quy tắc PDF-first, 748,522 dòng/ô trên các phiên bản. Không cộng gộp các phiên bản thành số liệu duy nhất.
- Đã kiểm tra 3,428 dòng CafeF-only bị loại theo quy tắc trùng số của người dùng; giữ đầy đủ bằng chứng trong `combine/review/`. Trùng số không chứng minh lỗi nhà cung cấp hoặc cùng khái niệm.

Kết quả kiểm tra: `PASS_REBUILT_CORPUS_AND_SOURCE_PRIORITY`. Báo cáo: `data/combine/verification.json`; bản lưu kiểm tra trong thư mục này là `verification.json`. Các trường hợp PDF khác số CafeF được đưa vào danh sách kiểm tra và vẫn giữ số PDF.

## Các giới hạn được giữ rõ

- Tất cả OCR, caption, đơn vị, kỳ và scope đọc tự động vẫn là dữ liệu trình bày chưa duyệt; không tự cập nhật accounting admission, blocker hay scoring.
- Có 30 trang reader trống, vẫn được ghi trong inventory; chưa khẳng định đó đều là trang trắng. Có 57,340 ô thiếu caption và 26,533 cột bảng chưa xác định kỳ. Toàn văn và PDF gốc được giữ để trích xuất/duyệt tiếp; raw OCR đã xóa theo yêu cầu.
- CafeF không khai báo đơn vị. Giá trị giữ dạng chuỗi số thập phân không mất độ chính xác; không suy đoán hệ số quy đổi.
- Tám payload annual lịch sử dài của CTG/VCB không khớp schema được giữ raw và ghi lỗi. Tám request bổ sung đã lấy được FY2022–FY2025 cho hai mã này. VPL không có FY2022 trong phản hồi API hiện tại; không tạo số 0 thay thế.
- Danh sách link đã lưu không bảo đảm đủ mọi năm hoặc loại báo cáo của từng mã. Không tự thay các link lỗi bằng nguồn khác.

## Link không tải được

- CTG: `CTG_BaocaoTyleAnToanVon_6T_2026.pdf` — HTTP 404
- HDB: `HDB_BaocaoTyleAnToanVon_6T_2026.pdf` — HTTP 404
- MBB: `MBB_BaocaoTyleAnToanVon_2025.pdf` — HTTP 404
- MBB: `MBB_BaocaoTyleAnToanVon_6T_2026.pdf` — HTTP 404
- SHB: `SHB_BaocaoTyleAnToanVon_6T_2026.pdf` — HTTP 404
- VIB: `VIB_BaocaoTyleAnToanVon_6T_2026.pdf` — HTTP 404
- VIC: `VIC_Baocaotaichinh_6T2026_Soatxet_Hopnhat.pdf` — HTTP 404

Quy trình chạy lại: [REBUILT_DATA_WORKFLOW.md](../REBUILT_DATA_WORKFLOW.md). Không chạy lại `--reset` nếu không có chủ đích xóa và dựng lại toàn bộ dữ liệu.
