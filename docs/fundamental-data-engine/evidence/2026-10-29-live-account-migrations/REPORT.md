# Cập nhật DB thật — 29/10/2026

**Đã hoàn tất: 21/21 migration. Blocker B6 về schema DB thật đã đóng.**

Chủ tài khoản cho phép trực tiếp: “vậy cập nhật db đi”. Đã áp dụng đúng hai migration đã rehearsal: `202610270001_dividend_settlement` và `202610270002_forward_intake`, bằng lệnh Prisma migrate deploy chuẩn của dự án. Không sửa SQL, checksum hay seal lịch sử.

Trước triển khai, xác nhận không có open handle trên DB, kiểm tra19migration đã áp dụng có checksum đúng, integrity/FK đạt. Tạo bản sao nhất quán bằng SQLite backup, phục hồi thử và đối chiếu toàn bộ schema/hàng dữ liệu trước khi cho phép migrate. Backup baseline19 được kiểm định theo đúng baseline19; không giả mạo nó là backup schema21.

Sau triển khai:

- Mọi hàng dữ liệu ứng dụng cũ được bảo toàn chính xác, kể cả ledger, vị thế, projection, API observations, financial runs và authority releases. Chỉ bookkeeping migration và ba bảng mới được thêm.
- Giữ nguyên các schema objects cũ ngoại trừ phần mở rộng CHECK đã review của ledger_transaction; đủ sáu trigger audit mới. Thử no-op update trên posted header/leg bị trigger chặn; transaction probe đã rollback, hash DB không đổi.
- `integrity_check=ok`, không lỗi khóa ngoại, Prisma status báo schema up to date.
- Backup theo code hiện tại và phục hồi cách ly thành công:42bảng/790hàng; toàn bộ logical rows/schema bằng nhau.
- Dashboard đọc trực tiếp DB đã nâng cấp đạt:11vị thế, observation tiền/cổ tức chờ về và giá vốn nhập giữ nguyên. DB không đổi trong các kiểm tra sau migration.
- Authority manifest và historical pins vẫn xác minh đạt.

Giữ lại hai backup owner-only trong thư mục đã gitignore:

- `backups/2026-10-29-pre-account-migrations/baseline-19.sqlite`: baseline trước triển khai; inventory/hash và kiểm tra restore ở BASELINE_BACKUP.json.
- `backups/2026-10-29-pre-account-migrations/current-21.sqlite` cùng sidecar manifest: backup đã kiểm định sau triển khai, tương thích backup/restore hiện tại.

Các bản restore thử đã được xóa sau kiểm định. Không tự rollback, không tạo giao dịch tài chính mới hay thay đổi accounting rows. `DEPLOYMENT.json`, `TRIGGER_AND_SCHEMA_CHECK.json`, `BACKUP_RESTORE.json` và `RUNTIME_RESULT.json` là receipts chi tiết. deploy.py là one-shot, từ chối chạy lại khi đã có thư mục backup/receipt.

B6 còn các gate độc lập: qualified Production market snapshot/session, formal scoring dataset acceptance và nghiệm thu E3/M7/historical/release. Việc cập nhật schema này không cấp các quyền đó; preflight FUNDAMENTAL_DESCRIPTION đạt, VALUATION và scoring admission vẫn bị chặn như trước.
