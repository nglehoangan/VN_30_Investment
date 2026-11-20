# Bộ runtime F1 kế nhiệm cho ACB — đề xuất phê duyệt

**Đã kiểm thử trên SQLite cô lập. Chờ quyết định theo đúng hash phiên bản.** Phạm vi ACB, HOSE, cutoff 30/10/2026, purpose VALUATION.

Bộ bao runtime mới ghim 42 tệp nguồn và phụ thuộc, bốn pin triển khai/đăng ký và blob lịch sử của `scripts/cafef-standing.mjs`. Nó chỉ dùng byte của blob lịch sử để xác minh pin trong thư mục tạm. Blob được đối chiếu SHA-256, không được chạy. Checkout hoạt động không có lại script đã nghỉ dùng. Adapter, chính sách giá thô, scope thành viên và registry F1 đã duyệt giữ nguyên. Tuyến ACB có entrypoint tường minh qua `withRegisteredAcbF1Admission` để kiểm tra quyết định phiên bản trước khi chuẩn bị nguồn.

Kiểm thử sử dụng hai PDF ACB thật, capture CaféF thật và route BANK đã duyệt. Cổng F1 từ chối bản PROPOSED và quyết định sai hash. Quyết định F1 giả lập trong SQLite cô lập cho phép chạy luồng từ DB chưa có bản ghi giá ACB, tiếp nhận 14 fact, gắn giá 21.000 VND/cổ phần và cổ phần 5.804.421.957, ghi rồi đọc lại ở chế độ chỉ đọc. Chạy lặp không tạo bản sao. Sai mã bị từ chối. SQLite hoạt động giữ hash baseline. 26 kiểm thử CLI và rollout đạt. [Biên nhận kiểm thử](ISOLATED_VALIDATION.json)

Tại thời điểm lập hồ sơ chưa có quyết định cho hash cụ thể của phiên bản mới. Verifier cần câu sau từ chủ sở hữu, hoặc quyết định tương đương được lưu nguyên văn và chuẩn hóa riêng cho verifier.

> Approve exact ACB F1 pinned runtime 8a906605cd344ea20f239b6888990f3de5e2c8a0145ecfb922840985080264b3 for 2026-10-30

Phạm vi này chỉ mở bộ xác minh F1 cho ACB. `officialDatasetHash` vẫn null. Sau quyết định, bước tiếp theo là đăng ký pin được duyệt, chạy route admission trên SQLite đích và đối chiếu hash bằng đọc lại.

[Đề xuất version](F1_RUNTIME_PROPOSED.json)
