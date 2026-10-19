# Phần vay dài hạn đến hạn trả đã bao gồm nhưng không tách số tiền

Chủ sở hữu chấp thuận ngày 19/10/2026. Chính sách bổ sung `current-portion-presentation-v1`; hiệu lực và thời điểm ghi nhận đều là `2026-10-19T03:04:54.000Z`. Không thay phiên bản/định nghĩa Debt Contract v2, Policy B, DI14/DI15, hoặc trạng thái ticker.

## Cách ghi nhận

Receipt vẫn có `currentPortion: null`, `shortIncludesCurrentPortion: true`, `longIncludesCurrentPortion: false` và `currentPortionVerified: true`. Thuộc tính mới `currentPortionPresentation` mang trạng thái `INCLUDED_IN_SHORT_NOT_SEPARATELY_DISCLOSED`, xác minh cách phân loại chứ không xác minh số tiền chưa công bố.

Tổng ban đầu = short + long không ngắn hạn. Không cộng hoặc trừ số current chưa biết. Các khoản tài trợ đã xác định riêng vẫn phải qua kiểm tra đủ bằng chứng và đếm một lần như trước.

Witness bắt buộc giữ:

- ticker, ngày cuối kỳ, scope hợp nhất, VND/CURRENCY;
- ID và giá trị đúng của hai fact vay đã được admission;
- xác nhận ngắn hạn có phần current và dài hạn là phần không ngắn hạn;
- đường dẫn/hash PDF có trong nguồn metadata và statement đã qualified, hash hồ sơ review, locator của hai số dư và cơ sở bao gồm/loại trừ;
- ngày review sau hiệu lực và không sau systemKnownAt, bodyHash đúng.

Validator từ chối null không có witness; source/review không được bind; sai ticker/kỳ/scope/đơn vị/operand; thiếu locator; short không bao gồm; long còn bao gồm current; số tiền vừa có số riêng vừa khai trạng thái không tách riêng. Chứng cứ không đủ không được tự đổi thành số 0. Receipt số học cũ không có witness vẫn theo logic cũ, bao gồm hiệu chỉnh khi current hiện diện trong cả hai caption.

Chế độ mới không áp vào analysisAt/systemKnownAt trước thời điểm phê duyệt. Không tự chứng nhận COMPREHENSIVE_FINANCIAL_DEBT hoặc tạo canonical fact.

## VNM

Có ba witness được xem xét từ BCTC hợp nhất và thuyết minh Vay mới tải lại:

| Ngày cuối kỳ | Số current riêng | Ngắn hạn có current | Dài hạn đã loại current | Tổng vay báo cáo VND |
|---|---|---|---|---:|
| 31/12/2024 | null — không tách riêng | Đã xác nhận cách trình bày | Đã xác nhận cách trình bày | 9.273.339.009.700 |
| 31/12/2025 | null — không tách riêng | Đã xác nhận cách trình bày | Đã xác nhận cách trình bày | 9.456.644.558.142 |
| 30/06/2026 | null — không tách riêng | Đã xác nhận cách trình bày | Đã xác nhận cách trình bày | 8.454.871.876.837 |

Mốc số dư được đối chiếu giữa BCTC và Note15(a)/(b). Các chuyển phân loại đối ứng được giữ là movement, không chuyển thành số dư current. FY2022/FY2023 tiếp tục có số current tách riêng; không sửa lại các receipt số học hoặc bằng chứng lịch sử.

**Điều kiện trình bày current portion: RESOLVED.** Full receipt vẫn cần đáp ứng survey, known financing items, metadata và các điều kiện admission độc lập. Không dùng thiếu chứng nhận comprehensive để tự đặt thêm blocker cho reported alternative; cũng không dùng witness trình bày để khẳng định mọi lớp tài trợ đã đầy đủ. Không có full receipt hoặc canonical update được tạo trong bước này.

## File và kiểm tra

- Chính sách: `src/domain/fundamentals/current-portion-presentation-v1.json`.
- Validator và kiểu dữ liệu: `src/domain/fundamentals/debt-contract.ts`.
- Witness và review VNM: `docs/fundamental-data-engine/evidence/2026-10-19-included-current-portion/`.
- Đầu ra readable cập nhật: `data/comparisons/VN30/VNM/notes-readable-v1/FINANCIAL_DEBT_REVIEW.json`.
- Sinh witness: `python3 scripts/review-vnm-current-portion-presentation.py`.
- Sau đó rebuild readable: `python3 scripts/build-vnm-readable-notes.py`, kiểm tra `python3 scripts/verify-vnm-readable-notes.py`.
- Test mới: `tests/unit/current-portion-presentation.test.ts`, gồm proof thực của ba kỳ VNM trong context kiểm tra có điều kiện; không admission vào dữ liệu thật.

Các bản review trước thay đổi được giữ nguyên trong hồ sơ lịch sử; xem quy tắc và review hiện tại khi đánh giá điều kiện trình bày gộp.
