# Quy tắc lấy/lưu giá theo phiên — 29/10/2026

Đã triển khai quy tắc được chủ tài khoản xác nhận và cập nhật DB thật cho đủ30mã. Bản ghi mới dùng `tcbs-display-price-v2`; không cần thay cấu trúc SQL vì giá đang được lưu trong payload JSON có version của broker_observation. Giữ nguyên61bản ghi v1 và các raw responses cũ; thêm30bản ghi v2 từ một phiên lấy API thực tế.

## Quy tắc đã xác nhận

Trong giờ khớp lệnh, dùng giá khớp hiện tại. “Mở cửa” theo quy ước app lấy từ close của phiên giao dịch liền trước, không phải ngày dương lịch trừ1. Giá open do TCBS trả về được giữ riêng. Chủ tài khoản đã trả lời: “Đúng, dùng cách hiểu này”.

| Thời điểm (Asia/Ho_Chi_Minh) | Giá dùng | Mốc mở cửa riêng của app |
| --- | --- | --- |
| Trong phiên09:00–11:30 và13:00–14:45, ngày giao dịch | matchPrice đúng ngày, với open có giá làm điều kiện tránh lấy snapshot trước giao dịch đầu tiên | close phiên giao dịch trước |
| Trước mở cửa, nghỉ trưa, ngày nghỉ/cuối tuần | close phiên đã hoàn tất gần nhất có dữ liệu | vẫn ghi reference/source date riêng, không coi là open của Sở |
| Từ14:45 ngày giao dịch | close daily bar của phiên vừa hoàn tất nếu provider đã cung cấp sau cutoff | close phiên giao dịch trước |
| Chưa có close đúng phiên cần lấy | close cũ có ngày thật và EXPECTED_CLOSE_NOT_AVAILABLE; báo PARTIAL | không thay bằng refPrice hay đổi nhãn matchPrice thành close |

Nguồn giờ giao dịch: quy định HOSE tháng02/2026, https://staticfile.hsx.vn/Uploads/UploadDocuments/2453338/HTGD_Quy%20dinh%20can%20biet%20khi%20GDCK%20tren%20HOSE_T2.2026.pdf . Danh sách ngày nghỉ lấy từ calendar2026 đã có của dự án, sao lưu có source-module hash trong `src/shared/hose-display-calendar-2026.json`. Calendar ngoài phạm vi hỗ trợ bị từ chối; đây là display calendar, không phải independent Production acceptance.

Khi chưa có giá khớp hợp lệ trong phiên, fallback giữ close đã hoàn tất với trạng thái rõ ràng, báo thiếu match thay vì giả vờ đó là giá khớp mới. Nếu thiếu mốc close phiên trước, giá khớp có thể vẫn được ghi nhưng reference=null và phiên cập nhật báo PARTIAL. Phiên thực tế này không thiếu giá hay reference nào.

## Cách ghi và đọc

- Common policy được chia sẻ giữa writer và reader tại `src/shared/market-display-session.mjs`. API vẫn ghi thẳng SQLite, không tạo capture/temp data directory.
- `value`, `field`, `tradingDate`, `receivedAt` mô tả giá thực sự được chọn. `selectedAt`, `sessionDate`, `sessionState`, `selectionMode`, `expectedCloseDate`, `selectionStatus`, timezone/calendar/policy version mô tả quyết định chọn giá.
- `openingReference` mang close phiên trước; `openingReferenceBasis=PREVIOUS_SESSION_CLOSE_BY_OWNER_RULE`. `exchangeOpen` mang open của provider, để riêng. Mỗi nguồn có ID raw observation, JSON Pointer, SHA256, ngày và thời điểm nhận riêng.
- `adjustment=PROVIDER_UNDECLARED`: không đoán dữ liệu đã điều chỉnh hay chưa. Thời điểm nhận API không được gọi là thời điểm khớp riêng của từng mã.
- Reader kiểm tra schema, hash và raw source/pointer/value/ticker/date của cả giá chính, previous close và exchange open; kiểm tra lại session policy độc lập. Không chỉ tin JSON chuẩn hóa.
- Ưu tiên v2 theo selectedAt; v1 chỉ fallback khi mã chưa có v2. Vì vậy chuyển sang close phiên trước lúc nghỉ trưa không bị match cùng ngày cũ che mất. Chặn replay selection cũ và chặn close cũ hơn thay close mới hơn đã biết.

## Kết quả DB thật

Một phiên market-only dùng lại token hiện có,93REST requests,84WSS data frames, cập nhật30/30mã; không thiếu previous close hoặc actual open. Xem DATABASE_UPDATE.json và ACTUAL_READER.json.

Ví dụ FPT lúc lấy dữ liệu29/10:

- Giá được chọn:52.500VND, MATCH_PRICE.
- Mốc mở cửa app:54.000VND = close phiên28/10.
- Open do TCBS trả về:54.500VND, lưu riêng.
- Snapshot nhận lúc14:14:52 và selection lúc14:15:23 giờ Việt Nam, state AFTERNOON / IN_SESSION. Đây không phải timestamp khớp riêng của FPT.

Tất cả accounting fingerprints trước/sau đều bằng nhau: ledger, portfolio, projection, giá vốn, scoring bindings, analytical artifacts, publications và dependency releases. Chỉ API observations, price records và run receipt được thêm. Backup hợp lệ trước/sau được giữ tại `backups/2026-10-29-price-policy-v2/`; đã restore thử và đối chiếu đầy đủ logical rows/schema, rồi xóa restore probe.

## Kiểm định

-40/40 Node API/session tests: các biên giờ, nghỉ trưa, sau đóng cửa, cuối tuần/ngày nghỉ, previous trading day, stale/future bars, source mismatch, account400 isolation và một token chung.
-14/14 Vitest: SQLite writer→reader→P/L, tham chiếu previous close/actual open, từ chối reference giả mạo dù rehash JSON chuẩn hóa, và B1–B5 personal view.
-Runtime dashboard trên DB thật đạt,11vị thế/30quotes; source reference là raw observation mới, FPT P/L vẫn theo imported basis.
-Typecheck, lint toàn repo và boundary checks đạt. Build đạt; có4cảnh báo filesystem tracing ở db/files.ts đã có trước thay đổi này. Ba file declaration duplicate trong .next/types đã được đối chiếu byte-identical và xóa bản copy sinh tự động; giữ nguyên declaration gốc, typecheck chuẩn chạy lại đạt.
-Authority37file vẫn xác minh đạt; không sửa seal lịch sử, SQL migrations, ledger hoặc source PDFs.

Quy tắc mới áp dụng cho dữ liệu hiển thị. Các gate chấp nhận market snapshot/session cho Production, formal dataset scoring và E3/M7 không được tự cấp quyền bởi lần cập nhật này.
