# Phiên bản admission BANK ACB — đề xuất sau kiểm thử

**Kết luận:** Tuyến admission có quản trị đạt kiểm thử SQLite cô lập trên hai PDF thật. Route admission ACB đang chờ phê duyệt phiên bản theo hash. Scope ACB/HOSE, BANK, cutoff 30/10/2026 và current formal valuation.

`GovernedBankAdmissions` dùng bảng raw, admission và fact hiện hành, cùng kiểm tra evidence, clock, quy tắc CAR/CET1, JSON Pointer, SHA-256 và revocation có sẵn. Registry phải do máy chủ cung cấp và ghim đúng hồ sơ phiên bản. Phiên bản chốt scope, catalog, hồ sơ standing policy và 86 pin mã/schema nội bộ. Version status, nguồn phê duyệt và thời điểm có hiệu lực được xác minh trước khi ghi. Việc duyệt phiên bản có scope chính xác cho ACB và giữ giới hạn quyền của standing policy.

Q3 vào vai trò báo cáo hợp nhất giữa niên độ. CAR và CET1 dùng số liệu báo cáo tại H1 với scope hợp nhất theo quy định và framework TT14. Dự phòng được dẫn xuất từ đúng hai fact chung và cụ thể, giữ riêng phần cho vay ký quỹ. 14 fact được ghi và đọc lại với kiểm tra hash. Phiên bản VNM giữ nguyên các pin lịch sử.

## Kết quả xác minh

- SQLite tạm chứa hai PDF thật đã ghim, 14 fact và một admission. Hồ sơ chủ sở hữu dùng riêng trong bài kiểm thử là fixture tạm.
- Từ chối bản PROPOSED, nguồn quyết định sai, mã sai, security ID sai, cutoff sai và byte mã bị đổi. Chạy lại với đồng hồ muộn hơn giữ original binding clock. Đọc lại thành công với SQLite query-only. Thu hồi ID phiên bản, hash phê duyệt, ID admission hoặc ID fact đều chặn ghi và đọc lại.
- CLI hiện hành báo thiếu route ACB và quyền chấm điểm, đồng thời SQLite hoạt động là placeholder. Không ghi SQLite hoạt động và không chấm điểm.
- Kiểm thử native Node chạy với nguồn repo và Zod đã khóa. Với dependency nội bộ đang là placeholder, bài chạy nạp đúng blob Git của HEAD cho các module giữ nguyên. Chưa xác nhận typecheck toàn repo.

## Phê duyệt cần thiết để bật route

Gói version đang ở trạng thái PROPOSED. Hash cần duyệt là `e71155fd18a067ee5e605f0283a30f7572f4f385ab41cc6231dba60673f2e36d`. Sau khi có quyết định chính xác cho phiên bản, ghim nguồn phê duyệt thật và thời điểm hiệu lực, rồi đăng ký route admission ACB vào composition có quản trị. Route chấm điểm là bước sau dataset binding, F1, assessment và quyền riêng của scorer. Đầu vào vốn theo quy định vẫn cần được đưa qua hợp đồng dataset BANK khi thực hiện bước binding.

[Version và 86 pin](BANK_VERSION_PROPOSED.json) · [Kết quả kiểm thử tích hợp](GOVERNED_INTEGRATION_TEST.json) · [Đề xuất route ACB](ACB_ADMISSION_ROUTE_PROPOSED.json)
