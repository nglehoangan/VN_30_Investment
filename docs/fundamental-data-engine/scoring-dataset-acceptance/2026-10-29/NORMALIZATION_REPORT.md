# Chuẩn hóa và kiểm định dữ liệu hiện giữ — 29/10/2026

Kết quả: **đạt kiểm định kỹ thuật của bộ chuẩn hóa; chưa đủ điều kiện nghiệm thu dataset scoring Production**. Snapshot kiểm tra nằm ở `normalized-r1/manifest.json`, phân loại REVIEW_CANDIDATE, productionAdmissible=false và scoringAuthorized=false. Bản acceptance.draft.json trước đó và các seal lịch sử giữ nguyên.

## Đã thực hiện

- Đóng gói đủ 30 mã, 11.383 biến thể và 748.522 dòng trình bày: 610.563 giá trị chuỗi thập phân và 137.959 ô null. Đây là số dòng qua mọi biến thể, không phải số sự kiện kế toán duy nhất.
- Chuẩn hóa cấu trúc định danh thành securityId/ticker/report/period/variant cùng các chiều kỳ, phạm vi, đơn vị, tiền tệ và scale. ID dựa trên đường dẫn nguồn và JSON Pointer có vị trí occurrence. Giữ nguyên toàn bộ dòng gốc, thứ tự, zero/null, nhãn, evidence và các biến thể; không tự quy đổi đơn vị hoặc suy đoán phạm vi.
- Giữ riêng 1.793 canonical facts của 30 admission run đang có trong DB. Kiểm tra cả body hash và content hash; không gộp các kết quả ngày 19/10 với dữ liệu trình bày được tái thu thập sau đó, không tự nâng cấp chúng thành native observations.
- Các file dữ liệu theo mã là JSON gzip để giảm dung lượng. Manifest ghim hash của nguồn, output, implementation và DB tại thời điểm tạo. DB được mở read-only trong bước chuẩn hóa, hash DB trước/sau bằng nhau.
- Trình kiểm định Python riêng đối chiếu từng dòng đóng gói với JSON Pointer gốc, đủ số dòng/biến thể, hash mọi artifact và các admission/market row đã chốt trong DB. Kết quả ở `normalized-roundtrip-validation.json`. DB có thể tiếp tục nhận observation mới; verifier đối chiếu các row đã seal, không bắt file SQLite luôn giữ hash cũ.

## Giá thị trường đã cập nhật DB thật

Giá cũ là match price trong phiên, không còn phù hợp tại thời điểm kiểm định sau đóng cửa. Đã chạy market-only với token còn hạn qua `api/tcbs.mjs`, không lấy tài khoản hay yêu cầu OTP mới. Lần thử trong sandbox gặp lỗi mạng được lưu như capture thiếu; lần truy cập mạng thực tế sau đó nhận đủ **93 REST HTTP200**, cập nhật trực tiếp SQLite **30/30 giá close ngày 29/10**, không thiếu previous close hoặc exchange open. Không tạo capture/raw file API trung gian.

Run ID: `TCBS_CAPTURE_RUN:df999cba671c1217aba35166cc85828b2f34999ec22fd5eeb54257933c94fe7b`. Kết thúc 15:09:38.829 giờ Việt Nam. WebSocket một giây không nhận market frame; trạng thái toàn capture vẫn PARTIAL_CAPTURE, REST và giá close được ghi nhận riêng. Không dùng kết quả này làm bằng chứng đã nghiệm thu streaming.

Bộ đọc giá thực tế xác minh raw hash, pointer, giá, ticker, ngày và quy tắc phiên cho cả giá chính, close phiên trước và exchange open. Snapshot cuối đạt 30/30 giá phù hợp ngày/loại phiên tại thời điểm chốt. Ví dụ FPT close=52.700 VND ngày 29/10, openingReference=54.000 ngày 28/10, exchangeOpen=54.500 ngày 29/10. Adjustment vẫn PROVIDER_UNDECLARED; không tự cấp market capability hoặc quyền valuation/scoring Production.

## Kiểm định đã chạy

| Kiểm định | Kết quả |
| --- | --- |
| Retained corpus, direct API prices, scoring-readiness migration — 3 file Vitest | 37/37 đạt |
| API direct-data và display-session — Node tests | 21/21 đạt |
| ESLint script chuẩn hóa | Đạt, 0 warning |
| Authority hiện hành | Đạt: 37 artifact; 133 file lịch sử không đổi |
| DB integrity và foreign keys | Đạt |
| Source round-trip toàn bộ bộ chuẩn hóa | Xem normalized-roundtrip-validation.json |

## Những phần chưa thể thông qua tự động

Các số sau có thể chồng lặp; không cộng thành số giá trị sai:

| Nội dung | Kết quả thực tế / việc cần hoàn tất |
| --- | --- |
| Phạm vi báo cáo | 425.905 dòng trình bày chưa có phạm vi chuẩn xác nhận theo hợp đồng native; giữ nguyên unknown/nhãn nguồn để review |
| Đơn vị/scale | 428.069 dòng thiếu unit hoặc scale; cần đối chiếu phần khai báo trên nguồn, không đoán hệ số |
| Nội dung trích xuất | 748.522 dòng vẫn thuộc lớp trình bày chưa được cấp accounting admission; kiểm định kỹ thuật không xác nhận nội dung kế toán từng dòng |
| Point-in-time | 1.793 canonical facts cũ chưa có qualification lịch sử theo publishedAt/historicalPitEligible; không lấy ngày báo cáo làm ngày công bố hoặc nhận API làm timestamp công bố |
| Universe/sector | Catalog đủ 30 ID duy nhất; vẫn cần nguồn hiệu lực và sector reference được ghim theo asOf cho snapshot chính thức |
| MBB | Giữ trạng thái deferred từ partition; cần xử lý bằng chứng CAR theo hồ sơ đang giữ, không cấp điểm thay thế |
| Native snapshot | observation, availability assessment, derivation và snapshot run trong native pipeline đều 0; cần admission/mapping và assessment đủ bằng chứng trước khi seal FORMAL/AS_KNOWN |
| Policy/input | Cần native readiness-v2 requirements có sector routes được phê duyệt và input/bridge được review cho từng mã đề nghị scoring |
| Market Production | Còn qualification capability/session, adjustment và policy freshness theo mục đích sử dụng; close đúng ngày không tự đóng gate này |
| Nghiệm thu | DI14 independent review, phê duyệt dataset/hash cụ thể và trusted binding chưa có; acceptance và scoring binding trong DB vẫn 0 |

`normalized-r1/issues.json` chứa issue theo từng mã và số dòng liên quan. Mỗi dòng dữ liệu có sourcePointer để mở đúng nguồn. Không sửa bản nháp thành PASS hoặc điền approvalReference bằng phê duyệt executable trước đây.

## Chạy lại

```sh
node scripts/normalize-current-dataset.mjs docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/normalized-r2
python3 scripts/verify-normalized-dataset.py docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/normalized-r2
```

Dùng Node 22.23.2 của dự án. Script từ chối thư mục output đã có; mỗi lần chốt sau dùng revision mới. Hai script chỉ chuẩn hóa/kiểm tra, không ghi native observations, approval hoặc acceptance vào DB. Lệnh lấy API thị trường là bước ghi observation riêng, đã hoàn tất trước snapshot cuối.
