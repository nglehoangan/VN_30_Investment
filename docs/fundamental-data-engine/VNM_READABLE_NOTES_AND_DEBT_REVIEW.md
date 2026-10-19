# VNM: giá trị dễ đọc và kiểm tra Financial Debt

Ngày kiểm tra: 19/10/2026. Cập nhật theo chấp thuận của chủ sở hữu: cho phép ghi nhận phần đến hạn trả đã nằm trong vay ngắn hạn nhưng không công bố số tiền riêng. Không cập nhật canonical, blocker, Policy B hoặc scoreability.

Quy tắc: `src/domain/fundamentals/current-portion-presentation-v1.json`. Bằng chứng và kết quả trước thay đổi: `docs/fundamental-data-engine/evidence/2026-10-19-included-current-portion/`.

## Dữ liệu dễ đọc

- JSON tổng hợp: `data/comparisons/VN30/VNM/notes-readable-v1/VNM.json`.
- JSON riêng: `FY2022.json`, `FY2023.json`, `FY2024.json`, `FY2025.json`, `6M2026.json` trong cùng thư mục.
- Bảng vay đã kiểm tra ảnh: thuộc tính `reviewedBorrowingTables`. Các bảng khác: `reports → thuyet-minh → periods → variants → groups → rows → cells`.
- `README.md`: bảng tổng hợp dễ đọc; `FINANCIAL_DEBT_REVIEW.json`: kết luận chi tiết; `FINANCING_SOURCE_SURVEY.json`: tìm kiếm trên toàn bộ 326 trang nguồn; `OCR_CORRECTIONS.json`: hai sửa OCR có xem ảnh; `provenance.json`: hash nguồn; `ARTIFACT_HASHES.json`: hash đầu ra.

Các dòng có `value` là chữ khi là đoạn văn, số nguyên khi nhận dạng được, hoặc danh sách giá trị khi dòng có nhiều cột. Từng cell có nhãn `valueType`, giá trị hiển thị và `source` giữ nguyên tọa độ OCR, đường dẫn và JSON Pointer. Một OCR chunk có thể chứa nhiều token; khi tách token vẫn giữ tọa độ chunk và character span, không tạo tọa độ chính xác giả cho từng chữ số.

Số nguyên trong phạm vi an toàn JavaScript được lưu thành JSON number; vẫn giữ `valueExact` chuỗi gốc chuẩn hóa để đối chiếu. Số quá lớn và số thập phân giữ chuỗi chính xác, không làm tròn qua float. Dấu gạch vẫn null, số 0 là số 0, số mơ hồ vẫn là chữ gốc. Ngày, tham chiếu thuyết minh và số nằm trong văn bản không tự biến thành số tiền. Các cột/kỳ/đơn vị chưa kiểm tra giữ chưa gán; bảng vay có nhãn/kỳ/đơn vị cụ thể từ ảnh PDF.

8.820 dòng và toàn bộ quan sát nguồn trong phần thuyết minh được giữ. Có 5.000 scalar number. Phần còn lại gồm chữ, dấu gạch, chuỗi decimal chính xác và token mơ hồ. Chưa duyệt toàn bộ số OCR trong mọi thuyết minh.

## Kết luận nợ vay

| Ngày cuối kỳ | Tổng vay ngắn hạn + vay dài hạn trên BCTC (VND) | Phần dài hạn đến hạn trả cuối kỳ tách riêng |
|---|---:|---:|
| 31/12/2022 | 4.933.158.564.103 | 18.865.350.000 |
| 31/12/2023 | 8.456.233.246.367 | 159.660.768.300 |
| 31/12/2024 | 9.273.339.009.700 | Chưa tách riêng trong bảng đã kiểm tra |
| 31/12/2025 | 9.456.644.558.142 | Chưa tách riêng trong bảng đã kiểm tra |
| 30/06/2026 | 8.454.871.876.837 | Chưa tách riêng trong bảng đã kiểm tra |

**FINANCIAL_DEBT: PARTIALLY_RESOLVED.**

Đã giải quyết bằng chứng số dư vay báo cáo tại đúng ngày, scope hợp nhất, đơn vị VND cho cả 5 kỳ. Tổng trên là số tính từ hai khoản vay báo cáo; không được tự alias thành FINANCIAL_DEBT hoặc COMPREHENSIVE_FINANCIAL_DEBT.

- FY2022/FY2023: có thành phần current portion cuối kỳ. Đối chiếu được short ex-current + current = short trình bày; long gross − current = long không ngắn hạn. Không cộng current lần thứ hai.
- FY2024/FY2025/6M2026: chuyển phân loại đối ứng lần lượt là 183.157.263.872 / 20.750.493.750 / 10.401.978.750 VND. Đây là biến động trong kỳ, không phải số dư current portion cuối kỳ. Bảng trình bày gộp không công bố số riêng; `currentPortion` giữ null. Quy tắc mới cho phép xác nhận điều kiện trình bày khi có witness hash-bound đã duyệt chứng minh nằm trong ngắn hạn và loại khỏi dài hạn không ngắn hạn. Ba kỳ đã có witness và điều kiện này là RESOLVED. Không dùng zero hoặc số chuyển phân loại để lấp giá trị chưa biết.
- Đã xem các trang nợ phải trả, V.17 chi phí phải trả, V.18 phải trả khác và cam kết thuê liên quan tại các kỳ trọng tâm. Cam kết thuê hoạt động công bố không tự thành nợ thuê tài chính. Khoản phải trả/chi phí khác không tự được gán là tài trợ hoặc số 0. Tìm kiếm không có một nhãn không chứng minh lớp tài trợ đó không tồn tại.
- Đối với **comprehensive/legacy strict**: còn thiếu bằng chứng hiện diện/vắng mặt đã xác minh cho từng lớp trái phiếu, thuê tài chính, tài trợ khác và tài trợ thuê theo ngành nếu áp dụng. Không tính QUALIFIED_FINANCIAL_DEBT khi các lớp còn UNKNOWN.

**Ranh giới Level1:** hợp đồng `nonfinancial-debt-contract-v2` đã duyệt cho phép `REPORTED_BORROWINGS` hoặc `COMPREHENSIVE_FINANCIAL_DEBT`. Không đặt điều kiện comprehensive lên reported alternative. Việc chưa chứng minh mọi khoản phải trả khác hoàn toàn không có tài trợ không tự thành blocker mới của reported borrowing. Ba kỳ trình bày gộp không còn bị chặn chỉ vì thiếu số current portion riêng; đây không phải yêu cầu doanh nghiệp bổ sung dòng công bố. FY2022/FY2023 vẫn dùng số tiền tách riêng. Lần cập nhật này chỉ tạo presentation witness, không tạo full receipt/admission và không suy ra comprehensive đã được xác nhận.

## Sửa OCR có kiểm tra ảnh

FY2025, trang PDF 50 (trang in 49):

| Nhãn | OCR gốc | Đọc trực tiếp từ ảnh (VND) |
|---|---|---:|
| Chi phí lãi vay | `58.472.984.36` | 68.472.984.360 |
| Chi phí thuê kệ trưng bày | `2.063.370.80` | 52.063.370.805 |

Hai sửa này chỉ nằm ở lớp readable và ledger, giữ nguyên raw và tọa độ. Chúng không tự được cộng vào tổng vay báo cáo hoặc dùng làm chứng cứ đủ phạm vi nợ vay.

## Kiểm tra lại

```sh
python3 scripts/build-vnm-readable-notes.py
python3 scripts/verify-vnm-readable-notes.py
python3 scripts/verify-vnm-notes.py
```

Các kiểm tra xác nhận tổng hợp/từng kỳ khớp nhau; số dòng, OCR chunk và tọa độ không mất; không đổi raw nguồn; số lớn và decimal không mất chính xác; dấu gạch không thành zero; không cộng trùng current portion; số phân loại trong kỳ không thành closing current portion; các hash khớp. Không có kiểm tra nào tự tạo trạng thái SCORABLE.
