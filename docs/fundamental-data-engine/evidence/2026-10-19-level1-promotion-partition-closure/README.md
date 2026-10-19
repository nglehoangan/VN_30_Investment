Level1 Promotion & PolicyB Partition Closure — đọc FINAL_REVIEW.md trước.

Release disposition29/1 đã ghi production theo OWNER_REQUEST.txt. Đây là trạng thái fundamental Level1, không phải quyền chạy scoring hoặc phê duyệt DI14/DI15. TCX giữ ngoại lệ ACTIVE; MBB tiếp tục bị quarantine. Lịch sử và kế toán không đổi.

Nguồn approval là quyết định independent review được Owner xác nhận trong yêu cầu mới; APPROVAL_AUTHORITY.json giữ hash yêu cầu và seal của gói revalidation. Không tự tạo approval DI14. NEW_PARTITION.json được tái dựng từ các mandatory observations đã duyệt và issue register có lịch sử giải quyết.

Runtime: PrismaLevel1Disposition + app/server/level1-disposition.ts đọc release đã pin và cung cấp context/guarded ports. Migration bổ sung bảng append-only, không cập nhật các bảng kế toán. tests/unit/level1-promotion.test.ts và tests/integration/level1-disposition.test.ts bảo vệ ngoại lệ, provenance và quarantine.

Replay read-only: node scripts/verify-level1-disposition.mjs và python3 scripts/replay-level1-partition.py. Chỉ chạy scripts/close-level1-partition.mjs --persist khi thực hiện lại đúng approval; không dùng script lịch sử build-di15-policy-b.mjs để ghi đè25/5. Seal lại bằng python3 scripts/seal-level1-closure.py sau mọi thay đổi bằng chứng. Dùng Node22.23.2 theo engines của project.

Kiểm thử không hoàn toàn xanh:18 lỗi lịch sử tái hiện trên startingHEAD;6 lỗi expectation do migration mới đã được sửa và retest. Các log còn nguyên, không ẩn/sửa test lịch sử để qua. Không yêu cầu phục hồi artifacts tạm đã được Owner cho dọn. Không có dữ liệu tài chính lớn hoặc backup disposable được sao chép vào gói này.

Chờ Review Level-1 Promotion & Partition Closure.
