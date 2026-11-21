# ACB — Hồ sơ kế nhiệm F1, M1 và BANK binding

Phạm vi ACB/HOSE, 30/10/2026. F1 duy trì payload đã duyệt 8a906605cd344ea20f239b6888990f3de5e2c8a0145ecfb922840985080264b3. Tệp F1 approved và quyết định M1 cũ không phục hồi được đúng SHA-256. Các tệp RECOVERY là biên nhận kế nhiệm. Biên nhận F1 ghi lại nguyên văn lời duyệt và dòng chuẩn hóa cho verifier. F1 verifier đọc đủ các pin và đối chiếu blob đã lưu. M1 phục hồi giữ review CLOSED, riskOutcome PENDING, độ tin cậy 6/10 và NON-ACTIONABLE. Việc rà nguồn bù bổ sung được giữ cho BCTC FY2026 kiểm toán.

Đã gọi BANK consumer trên SQLite cô lập trước, sau đó trên SQLite đích, ngay trên dataset đã admission. Chỉ ghi lớp binding và data acceptance. Kiểm thử gọi lại hai lần, đối chiếu 14 fact, giá 21.000, 5.804.421.957 cổ phần, từ chối ticker khác, kiểm tra khóa ngoại và mở lại read-only. 53 bảng được bảo vệ khớp trước/sau. Readback và hash ở [BANK binding recovery](ACB_BANK_BINDING_RECOVERY_RESULT.json).

Đề xuất executable kế nhiệm ghim 34 tệp, gồm CLI/worker hiện hành cùng M1 và F1 phục hồi. Đã đối chiếu code hash, payload và baseline qua verifier. Hash trình CIO của **phiên bản executable** là `4bff708ac5218dab9ea1dac422d0f53d11d863a0aff052b93abb36bc3fc5c2a8`. Phê duyệt đã được xác minh và methodology đã đăng ký, đọc lại trong SQLite. [Biên nhận đăng ký](ACB_EXECUTABLE_RECOVERY_METHOD_REGISTRATION.json). [Đề xuất executable](ACB_EXECUTABLE_RECOVERY_PROPOSED.json)

Assessment vẫn cần các band và review chính thức gắn dataset scoring đã ràng buộc. Nghị quyết 4490 bổ sung căn cứ quy trình duyệt giao dịch ACB Insurance, còn thiếu đối chiếu điều kiện thị trường cho RG-GOV. S5 còn thiếu căn cứ cho vốn/RWA riêng lẻ, phân phối và giá thoát. VAL-RET dưới 8% là band nghiên cứu, IRR cơ sở 3,25%. Chưa có hash quyền score route.
