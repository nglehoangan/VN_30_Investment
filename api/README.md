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

## Mẫu nguồn market cho capability

`node api/capture-market.mjs` chỉ dùng JWT cache còn hạn. Khi cần xác thực, chạy **trong terminal riêng trên máy** bằng Node22.23.2:

```sh
node api/capture-market.mjs --authenticate --ticker=TCB
```

Smart OTP được nhập ẩn tại terminal; không lưu OTP hoặc đưa token vào log/raw. Sau xác thực, quy trình lấy mẫu giới hạn:5.1 cho ngày giao dịch đầy đủ,5.5 trang0/tối đa20 bản ghi,5.2 request snapshot một lần cho một mã. Không truy vấn tài sản tài khoản, đặt lệnh, nhập database hay chạy scoring. Dừng khi401/429, không tự retry.

Kết quả riêng tư tại `data/market-source/tcbs/<capture-time>/`: raw response market, raw data frame5.2 (loại auth/control), manifest gồm request/time/status/SHA256. Lỗi HTTP chỉ giữ status, không lưu response lỗi có thể chứa thông tin xác thực. Capture thực vẫn là `NOT_QUALIFIED` cho đến khi kiểm tra schema, đơn vị, ngày/phiên, identity, adjustment và replay. Không tự đổi blocker hoặc readiness.

Sau khi tải mẫu, kiểm tra offline bằng `python3 api/replay-market.py data/market-source/tcbs/<capture-time>`. Script rehash toàn bộ raw, giữ lossless decimal strings và JSON pointers, đối chiếu giá/identity/ngày giữa5.1/5.2/5.5, rồi ghi riêng `review-v1/extracted-review.json`. Không sửa raw/manifest, không suy đoán đơn vị/adjustment, không deduplicate lịch sử theo giá/thời gian, không tự chứng nhận capability hoặc tạo runtime snapshot.

## Pipeline TCBS VN30 hoàn chỉnh (ứng viên EOD)

Node 22.23.2, chạy từ project root; JWT cache còn hạn:

```sh
node api/tcbs-market-pipeline.mjs --refresh
```

Lệnh lấy bảng giá 5.3 và metadata 5.11/nến ngày 5.13 cho đúng 30 mã (61 GET), lưu raw bất biến và request inventory riêng TCBS, chuẩn hóa lossless decimal strings, đối chiếu giá đóng cửa, replay hai lần rồi ghi ứng viên và binding nguyên tử. Không tự xác thực lại. 401/429 hoặc nguồn không đủ thì dừng, giữ raw và ứng viên trước đó.

Trước giờ mở cửa, bảng 5.3 có thể chuyển sang ngày mới nhưng chưa có `matchPrice`. Không lấy `refPrice`, không gán zero, không giả lập giá khớp. Có thể chỉ định bản chụp bảng giá của phiên hoàn tất để đối chiếu với nến ngày mới tải:

```sh
node api/tcbs-market-pipeline.mjs --refresh --board=<explicit-completed-board-folder>
node api/tcbs-market-pipeline.mjs --capture=<explicit-capture-folder> --board=<explicit-completed-board-folder>
node scripts/build-tcbs-pipeline.mjs --replay=<candidate.json>
```

Không tự chọn file mới nhất. Bản chụp bảng giá được chỉ định phải đủ 30 mã và cùng ngày/giá với nến được chuẩn hóa. Nếu nến của ngày được chỉ định không còn trong cửa sổ hai ngày, tải bản chụp phù hợp; không nới điều kiện.

Đầu ra: `data/market-source/tcbs/<capture>/` giữ raw/inventory; `data/market-boundary/candidates/<hash>/candidate.json` giữ capability, initialization, market snapshot, chính sách phiên và toàn bộ source pins; `data/market-boundary/active-candidate.json` chỉ bind ứng viên kỹ thuật. Web `/api/readiness` replay ứng viên để hiển thị trạng thái. `VN30_MARKET_CANDIDATE_ENABLED=0` tắt nguồn ứng viên cho môi trường kiểm thử cách ly. Cleanup giữ cả hai namespace này.

Phạm vi phiên bản `tcbs-vn30-eod-pipeline-v1`: giá đóng cửa phiên HOSE hoàn tất, VND/cổ phiếu, multiplier 1, đối chiếu bảng cùng ngày, dùng cho EOD valuation. `tradeUnit` không phải hệ số giá. Giữ thời gian lấy và ngày nến; HTTP Date chỉ là đồng hồ HTTP server, không phải thời điểm sàn xác nhận giá. Mốc 15:00 là ranh giới phiên bảo thủ, được khai báo là thời gian suy ra. Lịch 2026 có ngày nghỉ rõ ràng; ngoài năm đã xác thực thì chặn. Không bao gồm giá intraday/execution hoặc lịch sử điều chỉnh/total return. Volume khác nguồn vẫn được giữ trong raw, không được trộn vào hợp đồng price-only.

Capability và initialization có thể `PASS_CANDIDATE` trong khi `initialized`, `marketCurrent`, `analysisReady`, `decisionReady`, `readyForScoring` vẫn false. DI14/DI15 cần independent acceptance theo governance hiện hành. Composition ở `app/server/tcbs-boundary-services.ts` chỉ mở sau khi có hash phê duyệt được cấp bởi trusted caller; request/browser không có nút tự phê duyệt. Không thay đổi dữ liệu tài chính, ngoại lệ TCX hoặc trạng thái deferred MBB.
