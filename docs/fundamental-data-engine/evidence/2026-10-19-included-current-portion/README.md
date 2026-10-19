# Chấp thuận trình bày current portion gộp — 19/10/2026

Kết quả: quy tắc và validator cho phép `INCLUDED_IN_SHORT_NOT_SEPARATELY_DISCLOSED` với `currentPortion: null`, chứng cứ hash-bound đã duyệt và điều kiện không cộng trùng. Cách tính: short + noncurrent long; giữ nguyên các điều kiện tài trợ khác và chứng nhận comprehensive.

- OWNER_AUTHORIZATION.json: nguyên văn yêu cầu và hash.
- VNM_REVIEW_BEFORE.json: review trước sửa; giữ để đối chiếu, không dùng như trạng thái hiện tại.
- VNM_PRESENTATION_REVIEW.json: ba kỳ, số dư, raw locators, PDF hashes, cơ sở bao gồm/loại trừ và movement không thay số dư.
- VNM_CURRENT_PORTION_PRESENTATIONS.json: các witness đã seal; không phải full debt receipt hoặc admission.
- VALIDATION.json: kết quả kiểm tra.
- ARTIFACT_HASHES.json: pin chính sách, mã, hồ sơ và đầu ra review.

Điều kiện trình bày current portion của VNM FY2024/FY2025/6M2026 là RESOLVED; số current riêng vẫn không được công bố và được giữ null. Tổng vay không thay đổi. Không tạo SCORABLE, không sửa canonical, Policy B hoặc DI14/DI15; không scoring/ranking.
