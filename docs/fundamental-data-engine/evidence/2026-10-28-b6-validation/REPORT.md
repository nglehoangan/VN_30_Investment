# B6 — kết quả kiểm định và phát hành

Ngày28/10/2026. **Đã thực hiện kiểm định; kết luận phát hành: NO-GO.** Đây là kiểm tra kỹ thuật của Codex trên working tree đã pin hash, không phải nghiệm thu độc lập M7 hoặc phê duyệt triển khai B7.

|Kiểm tra|Kết quả|
|---|---|
|Node được dùng|22.23.2, đúng phạm vi package; Node mặc định22.12.0 không dùng cho kiểm định|
|Prisma client generation|PASS|
|Typecheck|PASS|
|Module boundaries|PASS|
|Build production|PASS; build ID và211server output files được pin hash|
|Vitest tổng|2434/2462đạt;28thất bại;0pending|
|Lint|FAIL:16errors,4warnings|
|Browser E2E Chromium|13/13đạt, dữ liệu synthetic cô lập, desktop1440/mobile390|
|Cấu hình lỗi|PASS:chặn startup/readiness, không lộ canary|
|Database thật|integrity_check=ok;0foreign-key violations|
|Dữ liệu owner28/10 trong runtime|FAIL:chưa tích hợp vào luồng hiện tại|
|Nghiệm thu độc lập M7|Chưa có chứng cứ đóng gate|

## Những việc chặn phát hành

1. Tích hợp dữ liệu/quy tắc đã chốt B1–B5 vào ứng dụng. Ledger thật vẫn có tiền232420/phải thu570000/phải trả0, khác trạng thái28/10 tiền327420/cổ tức chờ475000/phí lưu ký420. Dữ liệu mới được lưu riêng; không có reader runtime cho data/account-current. Không sửa ledger để ép số khớp.
2. Sửa hoặc phân loại đúng28test lỗi: kiểm tra migration/schema, mock adapter opening-receivable, research isolation, pin hash của authority và các bài replay còn phụ thuộc artifact đã bị xóa. Không khôi phục thư mục PDF/OCR cũ hay sửa seal lịch sử để làm test xanh.
3. Xử lý16lint errors và4warnings; không tắt cả bộ lint hoặc sửa bytes hồ sơ lịch sử đã seal.
4. Sau khắc phục, kiểm tra lại đường đi danh mục thật: FPT200+20, cổ tức chờ riêng, nhận tiền không trùng, phí420, P/L theo giá vốn đã nhập và giá đúng ngày; hoàn thiện chứng cứ độc lập/phê duyệt phát hành đúng bản.

Không cần chủ tài khoản gửi lại Excel/PDF. B1/B2/B4/B5 đã chốt trong phạm vi danh mục cá nhân không bị mở lại thành yêu cầu chứng từ. Những phần thiếu ở đây là triển khai/kiểm định. Build/E2E đạt không chứng minh danh mục thật đã cập nhật hay đủ điều kiện hỗ trợ quyết định tiền thật. Không triển khai, migration, posting hoặc cập nhật authority.

## Hồ sơ

CHECK_RESULTS.json ghi lệnh/kết quả; TEST_SUMMARY.json ghi28lỗi; ACTUAL_DATA_AUDIT.json đối chiếu DB read-only; BUILD_IDENTITY.json và COMPILED_SERVER_HASHES.json pin bản build/config/schema bằng hash, không lộ giá trị cấu hình; INPUT_PINS.json và PROTECTED_INPUT_CHECK.json chứng minh dữ liệu/source được giữ nguyên. FINDINGS.md ghi việc cần sửa. Ảnh visual-evidence là synthetic và đã xem desktop/mobile; không phải ảnh danh mục cá nhân.
