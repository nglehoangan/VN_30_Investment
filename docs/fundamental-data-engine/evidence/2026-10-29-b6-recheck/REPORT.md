# B6 — kiểm tra lại sau lần chạy data ngày29/10/2026

**Chưa hết lỗi. B6 vẫn NO-GO.** Đây là kiểm tra và danh sách issue, chưa triển khai fix. Không có thay đổi source code, dữ liệu đầu tư, posting/migration hay release.

## Kết quả chạy mới

- Vitest2474tests:2445đạt,29thất bại,0pending. 28failures trùng baseline B6trước. Lỗi mới là timeout20s ở test backup/restore; chạy riêng toàn file backup lần nữa đạt3/3. Không gán lượt tổng thành PASS hoặc sửa số29trong log.
- Cả12test B1–B5đạt; lỗi testcase ngày Việt Nam trong lượt tích hợp trước không còn xuất hiện. Composition root với bản sao SQLite thật vẫn tải đúng11mã và các số tiền đã chốt.
- Typecheck, build production, boundaries đạt.
- Lint:16errors+4warnings, vẫn chưa đạt.
- Database thật integrity_check=ok,0vi phạm FK; hash trước/sau không đổi.
- Hai test mô phỏng api/tcbs-unified.test.mjs đạt2/2, nhưng không thay thế kết quả API tài khoản thật.

## Lần chạy data đã tạo gì, ứng dụng đã dùng chưa?

Có capture mới `data/market-source/tcbs/2026-10-29T01-48-59.704Z-unified/`: bắt đầu08:48:59và kết thúc08:50:57giờ Việt Nam.61requests thị trường trong manifest có HTTP200và raw hash khớp; cả11mã đang giữ có daily bar mới nhất mang tradingDate28/10/2026. Đây là chứng cứ thu thập raw, chưa phải tự động qualified/published.

Capture tổng vẫn PARTIAL_CAPTURE vì API4.16(cash statements)và4.17(margin-info)trảHTTP400. Không đổi lỗi này thành số0hay mở lại các yêu cầu PDF/Excel của B1–B5. WebSocket NO_MARKET_FRAMES được giữ là quan sát, không tự coi là lỗi vì capture lúc08:49.

Dashboard thực tế vẫn đọc broker snapshot received11/10, bảng quote tradingDate09/10. Panel owner đúng mốc28/10và giá vốn nhập, nhưng chưa nhận giá đóng cửa28/10vừa tải. Current actionability vẫn BLOCKED/SOURCE_UNAVAILABLE. Nguồn raw mới đã có, còn thiếu nối/chuẩn hóa/kiểm định dữ liệu vào read model. Thời gian sửa file không được coi là tradingDatehoặcknowledgeAt.

## Issue cần fix theo ưu tiên

|ID|Ưu tiên|Việc cần làm|
|---|---|---|
|B6-01|P1|Nối capture giá mới vào read model; kiểm tra mã/đơn vị/ngày nguồn/provenance cho11mã, lời/lỗ theo imported basis và không fallback cũ âm thầm.|
|B6-03|P1|Xử lý authority/hash source lệch phiên bản(transaction.ts,TCXdebt-contract). Review tương thích và tạo manifest/approval phiên bản mới; không sửa seal cũ để làm xanh test.|
|B6-04|P1|Rà5migration assertions và1registry inventory: xác minh data/replay/trigger bất biến cùng schema evolution được phép; cập nhật kỳ vọng chính xác.|
|B6-02|P2|Chẩn đoán HTTP400API4.16/4.17 theo hợp đồng request/phạm vi tài khoản; tách trạng thái market/account và not-applicable có căn cứ, không coi lỗi là nợ0.|
|B6-05|P2|Sửa mock Prisma opening-receivable thiếu raw-query seam; research-isolation phải mock retained-research đang được dùng, không mock đường cũ.|
|B6-06|P2|Phân loại16replay failures trỏ artifact đã xóa, tạo kiểm tra retained-data đúng phiên bản; điều tra thêm GVRfalseassertion. Không restore thư mục cũ hoặc ghi unavailable thành PASS.|
|B6-07|P2|Sửa16lint errors(any)và4warnings(unused); xử lý verifier lịch sử dưới quy tắc tooling rõ ràng, không sửa seal hoặc tắt lint hàng loạt.|
|B6-09|P2|Ổn định test backup/restore timeout trong suite tổng: đo subprocess/timing, giữ nguyên assertions chống ghi đè/symlink/checksum; không chỉ nâng timeout để che treo.|
|B6-08|Release gate|Sau fix kỹ thuật, hoàn tất expected-vs-actual độc lập và quyết định phát hành đúng build/config/schema. B7deploy vẫn riêng.|

Chi tiết source files, yêu cầu fix và tiêu chí đạt nằm trong ISSUE_REGISTER.json. Test names và lỗi đầy đủ nằm ở TEST_SUMMARY.json/rawvalidation/vitest.json. Không cần chủ tài khoản gửi lại sao kê để xử lý các issue kỹ thuật này. Ưu tiên B6-01→B6-03→B6-04; sau đó sửa test/lint và kiểm tra lại trước release.
