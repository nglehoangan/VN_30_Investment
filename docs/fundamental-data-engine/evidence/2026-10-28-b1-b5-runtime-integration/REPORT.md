# B1–B5 — tích hợp và kiểm tra lại

Ngày28/10/2026. **Phần tích hợp B1–B5 cho danh mục cá nhân: PASS. Phát hành toàn hệ thống B6: chưa đạt/NO-GO.**

## Đã thực hiện

- Đưa dữ liệu cá nhân vào runtime qua reader/schema/model và composition root dashboard, không chỉ lưu tài liệu. Nguồn đang hoạt động: `data/account-current/personal-account.json`; các file trước đó giữ làm chứng cứ/đối chiếu, không cộng thêm số dư.
- Dashboard/holdings và các màn hình liên quan hiển thị đủ11mã, ISIN, số lượng và giá vốn đã nhập. FPT220=200giao dịch+20thưởng chờ; không cộng trùng.
- Tiền mặt327.420đ; cổ tức chờ475.000đ; phí lưu ký420đ; tiền rút327.000đ; ngân hàng liên kết12.152.752đ; sức mua12.479.752đ. **Sửa phép tính trước:tiền mặt+ngân hàng−phí=sức mua**.
- Cổ tức chờ không được coi là tiền đã nhận; phí chưa coi là đã thanh toán. Không cộng tiền ngân hàng/sức mua/cổ tức thêm vào NAV broker91.742.252đ.
- Lời/lỗ lấy giá vốn đã nhập. Giá nguồn đang có mốc11/10/2026, được ghi rõ ngay trên bảng; không gọi là giá/lời-lỗ hiện tại28/10 hoặc lấy giá cũ tính NAV mới.
- Bảo vệ portfolio/revision/date/quantity/cost và không fallback âm thầm khi file owner hỏng. Ngày nguồn owner dùng ngày Việt Nam. Bảng desktop không bẻ chữ mã/ISIN; mobile cuộn ngang trong bảng.

Sổ giao dịch gốc vẫn nguyên hash, không post hoặc migration, không tạo dòng tiền/fee khớp số. Dữ liệu tiền/claim/fee ngày28/10 là read model quan sát riêng, không phải đã đối soát và sửa toàn bộ lịch sử accounting. Quyền giao dịch/scoring/production không được tự bật.

## Kiểm tra

|Kiểm tra|Kết quả|
|---|---|
|12test mới trên code cuối|PASS12/12|
|Phần cá nhân + architecture|PASS113/113|
|Composition root với bản sao DB thật|PASS11mã và số tiền đúng|
|Browser dữ liệu thật|PASS1440px/390pxvà trangFPT|
|Browser hồi quy synthetic|PASS13/13|
|Build production + typecheck cuối|PASS|
|Lint code thay đổi + boundaries|PASS|
|Lint toàn dự án|FAIL16errors+4warnings,các lỗi cũ|
|Vitest tổng trong quá trình tích hợp|2445/2474đạt,29fail;1testtimezone mới đã chạy lại PASS trên code cuối,28lỗi còn lại trùngB6trước|
|Database thật trước/sau|Hash không đổi|

Không tuyên bố toàn bộ suite cuối đã PASS: giữ nguyên log run tổng và log recheck riêng. Chưa sửa các lỗi ngoài phạm vi B1–B5: baseline migration/schema assertions, mock opening-receivable, research isolation, hash authority và test còn trỏ artifact đã xóa. Không tự restore PDF/OCR cũ hoặc sửa seal để làm xanh test.

## Còn chặn phát hành B6

Cần xử lý28lỗi baseline và16lint errors/4warnings, xác minh nguồn giá hiện tại khi muốn NAV/lời-lỗ hiện tại, rồi hoàn tất gate nghiệm thu/phát hành độc lập. Không cần người dùng gửi lại Excel/PDF để giải quyết lỗi triển khai. B7triển khai/migration vẫn riêng.

`FINAL_STATUS.json`, `TEST_SUMMARY.json`, `ACTUAL_RUNTIME_RESULT.json`, `BROWSER_OWNER_RESULT.json`, logvalidationvà hashimplementation/buildghi kết quả. Ảnh màn hình thật đã xem trực quan, chỉ lưu tạm và xóa sau QA; không phát hành ảnh tài chính cá nhân. `IMPLEMENTATION.md` ghi rõ quy tắc/phạm vi.
