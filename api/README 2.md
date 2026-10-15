# TCBS API

Danh sách 10 API đã được người dùng duyệt ngày 2026-10-08 được lưu trong `tcbs-api-catalog.json`, gồm method, endpoint, mục đích và link tài liệu TCBS v1.0.0. Đây là danh mục để tích hợp sau; chưa có API client hoặc request tài khoản được chạy.

## API Key local

Điền API Key trực tiếp vào `api/.env.local`:

```dotenv
TCBS_API_KEY=your_api_key
TCBS_CUSTODY_CODE=your_custody_code
```

File có quyền `0600`, được Git ignore và loại khỏi Next.js output tracing. `api/.env.example` là template trống có thể version-control. Không đưa mật khẩu, OTP hoặc JWT vào file cấu hình này. Nếu key có ký tự đặc biệt, dùng cú pháp giá trị có dấu ngoặc kép phù hợp dotenv.

Next.js chỉ tự đọc `.env.local` ở project root; `api/.env.local` là file lưu riêng, **chưa được app tự nạp**. API client tương lai phải đọc file này phía server, không đưa key vào `NEXT_PUBLIC_*` hoặc browser. Việc xác thực cần API Key + Smart OTP theo [TCBS](https://developers.tcbs.com.vn/docs/v1.0.0/auth/token/); OTP sẽ nhập khi xác thực, không lưu lâu dài.

Việc lưu danh mục và tạo file khóa chưa cấp quyền gọi API tài khoản. Tiếp tục cần xác nhận trước khi kết nối chạy thật. Phạm vi danh mục gồm xác thực và đọc dữ liệu; không gồm đặt/sửa/hủy lệnh hoặc chuyển tiền.

Các giới hạn dữ liệu được ghi trong catalog: cổ tức chờ về, trạng thái WFT, phạm vi lịch sử khớp lệnh và nguồn fundamentals còn cần kiểm chứng.

## Test 10 API đã duyệt

Chạy từ project root bằng Node 22.23.2:

```sh
node api/test-tcbs.mjs
```

Script đọc API Key và custody code từ file private, yêu cầu Smart OTP qua hidden terminal prompt, lấy JWT một lần, cache private rồi thử 9 GET endpoints. Không đặt lệnh, chuyển tiền hoặc ghi financial ledger. API 2.1 được gọi một lần trong phiên test, response chỉ cache trong bộ nhớ để chọn đúng tiểu khoản cho từng API; không lưu accountNo trong config. Có timeout, không follow redirect mang credentials. Kết quả chỉ chứa API ID, trạng thái, HTTP code và số dòng; được lưu vào `data/api-tests/latest-smoke.json`, được Git ignore. Không ghi raw response, API Key, OTP hoặc JWT vào log/report; JWT được lưu riêng trong session private để tái sử dụng.

PASS chỉ là HTTP/response-shape smoke check, không xác nhận đủ lịch sử hoặc correctness tài chính. Schema chưa khớp sẽ được ghi RESPONSE_SCHEMA_UNCONFIRMED, cần đối chiếu response thực tế qua quy trình riêng.

## Chọn tiểu khoản động

Chỉ cấu hình `TCBS_API_KEY` và `TCBS_CUSTODY_CODE`. `sub-account.mjs` lấy thông tin qua API 2.1 với `fields=basicInfo,bankSubAccounts` khi cần số tiểu khoản. Kiểm tra mã lưu ký trả về qua `basicInfo.code105C` (response thực tế) hoặc `custodyCode` (tài liệu).

- 4.14, 4.15, 4.16, 4.6, 4.4: chọn tiểu khoản `NORMAL` có `status=1`.
- 4.17 tra cứu nợ margin: chọn tiểu khoản `MARGIN` có `status=1`; đây chỉ là đọc/đối soát nợ.
- 1.1, 5.1, 5.11: không cần số tiểu khoản.

Thiếu tiểu khoản, nhiều tiểu khoản cùng loại, lỗi profile hoặc sai mã lưu ký: dừng request đó. Không tự chọn dòng đầu tiên hoặc fallback sang loại khác. AccountNo chỉ tồn tại trong bộ nhớ cho request hiện tại; không ghi config, log hoặc report.

## JWT session reuse

`token-session.mjs` lưu JWT trong `data/tcbs-session/session.json` (thư mục 0700, file 0600, Git ignore và loại khỏi build tracing). Session gắn với API Key hash và custody code. OTP không được lưu; chỉ lưu HMAC để chặn thử lại cùng mã. File khóa ngăn các process đồng thời đổi token.

Token còn hạn: dùng lại, không hỏi OTP và không gọi API 1.1. Token gần hết hạn (60 giây): chờ OTP mới, không tự refresh. Token bị API trả 401: xóa khỏi session và dừng các request còn lại. API trả 429: dừng phiên; xác thực có cooldown ít nhất 60 giây hoặc Retry-After dài hơn. Không tự retry. `node api/test-tcbs.mjs` vẫn là lệnh chạy; chỉ hỏi OTP khi cần.

Custody code local đã được sửa thành tài khoản được xác minh từ token/profile trước đó. AccountNo tiếp tục chỉ lấy từ API 2.1, không lưu trong config.

Để test chỉ bằng token cache và tuyệt đối không gọi 1.1: `node api/test-tcbs.mjs --cached-token-only`. Nếu không có token còn hạn, script dừng; không hỏi OTP hoặc gửi request xác thực.

### Lưu dữ liệu đã lấy vào database local

`node api/import-captured.mjs` nhập offline từ `data/api-import/capture.json` vào database cấu hình bởi `DATABASE_URL` (mặc định `data/vn30.sqlite`), sau `pnpm db:migrate`. Lệnh không gọi API hoặc xin token. Account của response được đối chiếu với tiểu khoản NORMAL đang hoạt động trong response 2.1; không cần account number trong config.

Bảng `broker_observation` giữ response gốc và snapshot chuẩn hóa với SHA-256, chỉ thêm bản ghi, import lại không trùng. Dashboard ưu tiên snapshot mới nhất trong database. Thời gian API là lúc nhận response, không phải thời điểm sàn xác nhận giá. Cổ tức chờ về và cổ phiếu chưa khả dụng được giữ riêng; snapshot không tự tạo giao dịch kế toán hay hiệu suất lịch sử. Database, response cá nhân, API key và token đều thuộc đường dẫn Git ignore.
