# TCBS — một lệnh cho tài khoản và thị trường

Dùng Node22.23.2, chạy từ project root:

```sh
node api/tcbs.mjs
```

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

Mỗi lượt có thư mục private `data/market-source/tcbs/<thời gian>-unified/`. Mở **`capture.json`** để xem tất cả kết quả/account+market, raw text lossless, frame WSS, variants, issue và trạng thái từng request. Giữ rawfiles riêng và `manifest.json` EOD61request để replay. Schema combined v2; account numbers có thể xuất hiện trong raw/inventory private, không nằm trong cấu hình hoặc console. Không commit capture/session.

GET cách nhau ít nhất1giây;401/429 dừng, không retry/xin OTP lại. 429 lưu cooldown ít nhất60giây hoặc Retry-After dài hơn. WSS auth qua base64JWT, chờ success true, subscribe `d|s|tk|bp+bi+tm+mp+op+fe|...`, heartbeat `d|p|||` mỗi2giây. Giữ tối đa3000frame/16MB; thiếu mã được ghi rõ.

Không tự ghi database/ledger/scoring hoặc đặt lệnh/chuyển tiền. Dữ liệu capture chưa được accounting/benchmark/scoring admission. Công cụ import/replay/assess offline vẫn riêng vì không gọi mạng.

Review đầy đủ52API và giới hạn: [TCBS_API_WEB_APP_REVIEW.md](../docs/fundamental-data-engine/TCBS_API_WEB_APP_REVIEW.md). Catalog machine-readable: `api/tcbs-api-catalog.json`.

```sh
node --test api/capture-market.test.mjs api/token-session.test.mjs api/sub-account.test.mjs api/tcbs-unified.test.mjs
```

Phiên market-only cũ ngày2026-10-21 đã lấy213REST200 và960frame WSS. Luồng mặc định mới account/history/benchmark đã test mô phỏng một OTP chung; chưa chạy live tài khoản trong lượt review này.
