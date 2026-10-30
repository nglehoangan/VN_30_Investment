# TCBS — một lệnh cho tài khoản và thị trường

Dùng Node22.23.2, chạy từ project root:

```sh
node api/tcbs.mjs
```

Kiểm tra `node -v` trước khi chạy. Dự án hỗ trợ `>=22.23.2 <23` (phiên bản ghim trong `.nvmrc`). Nếu dùng nvm, chạy `nvm install && nvm use` tại project root. Node22.12.0 có thể báo `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`; entry point nay kiểm tra phiên bản trước khi nạp SQLite, gọi API hoặc ghi DB và báo `UNSUPPORTED_NODE_VERSION`. Không cần đổi database để sửa lỗi runtime này.

Lệnh mặc định lấy **cả tài khoản và dữ liệu thị trường VN30**, dùng chung JWT. Token còn hạn thì dùng lại; hết hạn thì hỏi Smart OTP ẩn một lần ở terminal, rồi chạy tiếp mọi API. Không cần chạy file account riêng. API key/custody nằm trong `api/.env.local` quyền0600; không đưa OTP/token vào mã nguồn/chat.

| Phần | API mặc định |
|---|---|
| Xác thực khi cần | 1.1 |
| Profile, tài sản, tiền, sao kê, lệnh/khớp, sức mua tham khảo, nợ nếu có MARGIN | 2.1; 4.4, 4.6, 4.7, 4.14, 4.15, 4.16, 4.17 |
| Giá/room, identity, EOD, lịch sử cổ phiếu và VN30 index | 5.1, 5.3, 5.11, 5.13 |
| WebSocket bảng giá, mặc định30 giây | 5.2 |

Full30 thường101 GET (93 market+8 account, khi đủ tiểu khoản và sao kê chỉ1trang), cộng1WSS và tối đa1POST xác thực. 5.3 có tên chính thức là room nước ngoài, kèm snapshot giá/rổ. 4.7 chỉ tham khảo/đối chiếu, không thay ngân sách settled cash của app.

```sh
node api/tcbs.mjs --from=2026-09-30 --to=2026-10-21
node api/tcbs.mjs --market-only
node api/tcbs.mjs --extended-market
node api/tcbs.mjs --symbols=FPT,VNM,HPG --seconds=30 --history-bars=252
node api/tcbs.mjs --cached-token-only
```

- Sao kê4.16 mặc định hôm nay theo giờ Việt Nam; `--from`/`--to` chọn khoảng ngày, lấy25dòng/trang, tối đa25trang. Thiếu dữ liệu/schema lạ/chạm giới hạn sẽ báo partial, không coi là đầy đủ. Cash statements không chứng minh lịch sử fills đầy đủ;4.17 vẫn chỉ1trang.
- `--market-only` bỏ phần tài khoản; `--accounts` giữ tương thích nhưng không cần nữa. Không dùng đồng thời hai cờ.
- `--extended-market` thêm5.4–5.8 và5.12, thêm151GET full30; các API này không bắt buộc cho core scoring.
- `--history-bars` từ2đến1000, mặc định252. Stock history/index tách variant khỏi2bar EOD hiện có. Raw benchmark chưa được qualify adjustment/total-return/identity.
- `--symbols` chỉ giới hạn cổ phiếu trong rổ giữ lại; benchmark VN30 vẫn riêng. `--seconds` từ1đến120.

Sau mỗi lượt API, dữ liệu được ghi **trực tiếp vào SQLite mà ứng dụng dùng** (`data/vn30.sqlite` mặc định; dùng cùng `DATABASE_URL` nếu cấu hình). Không tạo thư mục theo lượt, `capture.json`, manifest hay raw file trung gian. Database phải tồn tại với schema hiện hành; lệnh không tự migrate hoặc sửa sổ giao dịch.

- Mỗi phản hồi REST được lưu ngay trong `broker_observation`: raw text nguyên vẹn, hash, request/variant và thời gian nhận. Lỗi HTTP cũng được giữ riêng trong DB.
- Giá hiển thị được kiểm tra và cập nhật vào `TCBS_MARKET_PRICE`; dashboard/holdings đọc trực tiếp từ DB khi tải lại trang, không cần chạy import thủ công.
- Ưu tiên giá khớp API5.1 khi có giá dương chính xác. Nếu bảng giá trước phiên chưa có matchPrice, dùng bar ngày gần nhất đã qua mốc15:00giờ Việt Nam và ghi đúng ngày nguồn. Đây là giá tham khảo hiển thị, không tự cấp quyền NAV/scoring production.
- Giữ từng mã và nguồn; không lùi về phiên cũ hơn, không làm tròn giá không được hỗ trợ hoặc trộn giá khác ngày thành tổng định giá mới. Cổ tức, phí và giá vốn owner đã chốt giữ theo nguồn của chúng.
- `displayPrices` trong kết quả console cho biết UPDATED/PARTIAL và mã thiếu. Lỗi API tài khoản có thể khiến lượt tổng PARTIAL nhưng không bỏ các giá thị trường hợp lệ đã cập nhật.
- Session xác thực riêng vẫn dùng cache bảo mật trong `data/tcbs-session`; đây không phải nơi lưu dữ liệu API thị trường. Không đưa raw tài khoản/session vào Git hoặc console.

Các capture cũ là lịch sử đã lưu; luồng mới không tạo thêm bản sao dữ liệu API bên ngoài DB.

GET cách nhau ít nhất1giây;401/429 dừng, không retry/xin OTP lại. 429 lưu cooldown ít nhất60giây hoặc Retry-After dài hơn. WSS auth qua base64JWT, chờ success true, subscribe `d|s|tk|bp+bi+tm+mp+op+fe|...`, heartbeat `d|p|||` mỗi2giây. Giữ tối đa3000frame/16MB; thiếu mã được ghi rõ.

Chỉ ghi dữ liệu API và giá hiển thị vào database; không ghi ledger/scoring, đặt lệnh hoặc chuyển tiền. Raw/giá hiển thị không tự có accounting/benchmark/scoring admission.

Review đầy đủ52API và giới hạn: [TCBS_API_WEB_APP_REVIEW.md](../docs/fundamental-data-engine/TCBS_API_WEB_APP_REVIEW.md). Catalog machine-readable: `api/tcbs-api-catalog.json`.

```sh
node --test api/capture-market.test.mjs api/token-session.test.mjs api/sub-account.test.mjs api/tcbs-unified.test.mjs api/direct-data.test.mjs
```

Phiên market-only cũ ngày2026-10-21 đã lấy213REST200 và960frame WSS. Luồng mặc định account/history/benchmark dùng một phiên token chung; kết quả đối chiếu live mới nhất ở mục 4.16/4.17 phía dưới.

### Đối chiếu 4.16 / 4.17 ngày 29/10/2026

Hai API đã có trong lệnh mặc định `node api/tcbs.mjs`, dùng chung JWT/OTP với market. Không cần chạy file riêng. Terminal nay in kết quả từng API tài khoản (không in số tài khoản/token); cuối phiên tách `accountCapture`, market REST, WebSocket và kết quả cập nhật giá.

URL không đổi so với tài liệu, nhưng backend đang yêu cầu tên tham số khác:

| API | Tài liệu hiện ghi | Backend đã kiểm tra HTTP200 |
| --- | --- | --- |
| [4.16](https://developers.tcbs.com.vn/docs/v1.0.0/stock/cash-statement/) | `accountno` | `acctno`; giữ `fromDate`, `toDate`, `pageSize`, `pageIndex` |
| [4.17](https://developers.tcbs.com.vn/docs/v1.0.0/stock/debt-lookup/) | `toDate` | `todate`; giữ `acctno`, `custodycd`, `fromdate`, `page`, `size` |

Chỉ chọn tiểu khoản ACTIVE đúng NORMAL (4.16) / MARGIN (4.17) từ profile 2.1 đã kiểm tra custody. Không có MARGIN hoặc không xác định duy nhất thì ghi thiếu phạm vi, không đoán tài khoản và không coi nợ bằng 0. HTTP400 được giữ nguyên trong lỗi ACCOUNT và raw SQLite; không hủy giá market hợp lệ. Lỗi xác thực401 / giới hạn429 vẫn dừng phiên như trước.

Đã chạy live hai endpoint sau sửa: đều200; sao kê chọn từ01/10 được kiểm tra pagination qua entry point. Chạy full30 với lỗi tài khoản trước sửa vẫn cập nhật30giá. Phiên WSS3giây không có frame được ghi riêng là chưa đủ dữ liệu, không coi toàn phiên thành công. Chi tiết: `docs/fundamental-data-engine/evidence/2026-10-29-account-api-review/REPORT.md`.

### Quy tắc giá theo phiên — chủ tài khoản xác nhận29/10/2026

Bản ghi mới dùng `tcbs-display-price-v2` trong cùng bảng `broker_observation`, kind `TCBS_MARKET_PRICE`. Lệnh `node api/tcbs.mjs` vẫn lấy API rồi cập nhật thẳng SQLite. Không cần thêm migration SQL vì bảng hiện tại lưu payload JSON có version; dữ liệu giá v1 và raw responses vẫn là lịch sử bất biến.

- Trong các phiên khớp lệnh HOSE (09:00–11:30,13:00–14:45 theo Asia/Ho_Chi_Minh, trừ ngày nghỉ): chọn `matchPrice` của ngày hiện tại, với `open` đã có giá để tránh mang giá cũ trước giao dịch đầu tiên vào phiên mới. Chưa có khớp hợp lệ thì giữ giá đóng cửa đã hoàn tất dưới dạng fallback có trạng thái thiếu giá khớp.
- Ngoài các phiên đó, bao gồm nghỉ trưa/cuối tuần/ngày nghỉ: chọn `close` từ daily bar5.13 của phiên đã hoàn tất. Sau14:45 kỳ vọng close ngày hiện tại; trước mở cửa/nghỉ trưa kỳ vọng close phiên trước. Chỉ dùng bar đã được nhận sau cutoff của ngày đó. Chưa có bar cần lấy thì ghi `EXPECTED_CLOSE_NOT_AVAILABLE` cùng đúng ngày của giá cũ, không đổi nhãn matchPrice thành close.
- `openingReference` = close phiên giao dịch liền trước theo quy tắc app do chủ tài khoản xác nhận; không phải `refPrice` và không phải giá mở cửa của Sở. `exchangeOpen` giữ riêng trường `open` do TCBS trả về. Mỗi giá/mốc đều có ngày, thời điểm nhận, raw observation ID, JSON Pointer và SHA256.
- Ghi thêm `selectedAt`, ngày/trạng thái phiên, phiên bản calendar/policy, kỳ close mong đợi, selection status, timezone và `adjustment: PROVIDER_UNDECLARED`. Không suy đoán dữ liệu đã điều chỉnh hay không.
- Reader ưu tiên v2 rồi thời điểm chọn; chỉ dùng v1 khi mã đó chưa có v2. Vì thế nghỉ trưa có thể chủ động chuyển từ match ngày hiện tại sang close phiên trước. Chặn replay cũ ghi đè selection mới và chặn giá close quá cũ thay close mới hơn đã biết.
- Calendar chỉ hỗ trợ2026, dùng danh sách ngày nghỉ đã có của dự án. Ngoài phạm vi này báo rõ không hỗ trợ, không đoán ngày giao dịch. Quy tắc này dành cho display; không tự chấp thuận Production/scoring.

Kiểm tra thêm: `node --test api/display-session.test.mjs api/direct-data.test.mjs`. Nguồn giờ giao dịch: https://staticfile.hsx.vn/Uploads/UploadDocuments/2453338/HTGD_Quy%20dinh%20can%20biet%20khi%20GDCK%20tren%20HOSE_T2.2026.pdf . Calendar/source pins và kết quả live ở `docs/fundamental-data-engine/evidence/2026-10-29-owner-price-selection/REPORT.md`.
