# Quy tắc chọn số liệu: PDF trước, CafeF tham chiếu sau

Thiết lập theo yêu cầu người dùng ngày 2026-10-18. Câu lặp "PDF" ở vế tham chiếu được hiểu theo ngữ cảnh hai nguồn là CafeF; cách hiểu đã được thông báo trong phiên làm việc.

Hợp đồng: `src/domain/fundamentals/report-display-source-priority-v2.json`.
Bộ chọn dùng lại: `scripts/lib/report_source_priority.py`.

| Tình huống | Giá trị chọn | Trạng thái |
|---|---|---|
| PDF có số đọc được, đúng chỉ tiêu/kỳ | PDF | Giữ nguồn PDF, kể cả PDF = 0 |
| PDF và CafeF khác số | PDF | Đưa chênh lệch vào danh sách kiểm tra |
| Không có dòng PDF trực tiếp, có tổng gộp rõ ràng từ đủ toán hạng PDF | Tổng từ PDF | Ghi công thức, kiểm tra phép gộp, không gắn nhãn số báo cáo trực tiếp |
| PDF không có số trong phạm vi đã kiểm tra, null, dấu gạch hoặc OCR chưa đọc được | CafeF tham chiếu nếu đúng chỉ tiêu/kỳ và không có chiều đã biết bị lệch | Cần người dùng kiểm tra; giữ đơn vị/phạm vi chưa xác định |
| PDF có nhiều giá trị mâu thuẫn cùng khóa | Chưa chọn | Không dùng CafeF để né xung đột PDF |
| Không nguồn nào có số phù hợp | null | Không tự điền 0 |

Không thay số PDF để khớp CafeF. Không tự lấy bản cuối cùng khi có nhiều phiên bản. Chọn bản theo đúng kỳ, phạm vi, định nghĩa và nguồn đã xác định. Khớp số không chứng minh khớp chỉ tiêu; theo yêu cầu mới, dòng CafeF tham chiếu khác 0 có cùng số ở nhãn PDF khác bị bỏ qua và lưu riêng để truy vết. Không dùng quy tắc này để loại số 0 hoặc các cặp cùng chỉ tiêu đã ghép đúng. CafeF = 0 ở dòng template không chứng minh doanh nghiệp xác nhận khoản đó bằng 0.

Phạm vi triển khai hiện tại là **bộ JSON trình bày/đối chiếu**, áp dụng cho mẫu VNM FY2025 đã có crosswalk cụ thể. Đây không phải sửa database hoặc tự duyệt accounting/scoring. Các gate nguồn chính thức tiếp tục giữ nguyên; tham chiếu CafeF có giá trị hiển thị nhưng `productionAdmissible: false` và `reviewDecision: PENDING`.

## Danh sách VNM để người dùng kiểm tra

Thư mục: `data/comparisons/VNM/FY2025/`.

- `selected-pdf-first.json`: toàn bộ giá trị được chọn, nguồn chọn, giá trị hai bên và lý do kiểm tra.
- `review-pdf-first.json`: danh sách cần kiểm tra, có ID `VNM-2025-001`... và trạng thái PENDING.
- `review-pdf-first.md`: bảng dễ đọc gồm danh sách đã loại và danh sách còn cần kiểm tra; giữ ID trước khi loại để tiện đối chiếu.

Kết quả sau khi bỏ qua dòng trùng theo yêu cầu: 191 dòng dữ liệu; 129 chọn trực tiếp PDF, 2 chọn tổng có công thức từ PDF, 60 tham chiếu CafeF bằng 0 (gồm 3 trường hợp PDF ghi dấu gạch). Loại 1 tiêu đề và 8 dòng CafeF khác 0 trùng số ở nhãn PDF khác. Có 88 dòng cần kiểm tra: 26 chênh lệch giữ PDF, 60 tham chiếu và 2 phép gộp.

`excluded-cafef-pdf-duplicates.json` lưu 8 dòng bị loại, giá trị CafeF, mã nguồn, nhãn/trang PDF có cùng số và lý do `USER_EXCLUDED_POSSIBLE_ROW_SHIFT_DUPLICATE`. Không xóa dữ liệu gốc hay sửa bộ đối chiếu. Đây là quy tắc bỏ qua theo yêu cầu người dùng; sự trùng số chưa tự chứng minh API lỗi lệch dòng.

**Giới hạn phạm vi:** chưa tìm thấy chỉ tiêu ở ba bảng chính của mẫu không chứng minh toàn bộ thuyết minh PDF không có chỉ tiêu đó. Trước khi duyệt tham chiếu CafeF còn lại, kiểm tra thuyết minh, đơn vị, phạm vi và kỳ.

Tái tạo:

```sh
python scripts/compare-vnm-readable.py
python scripts/select-vnm-pdf-first.py
python scripts/test-report-source-priority.py
```

Khi rebuild bộ đối chiếu, cần rebuild bộ chọn và danh sách kiểm tra tương ứng. Danh sách giữ hash input để phát hiện dữ liệu kiểm tra bị cũ; hash không làm khóa hiển thị.
