---
name: fetch-cafef-price-history
description: Lấy lịch sử giá CafeF theo mã và số năm lùi từ hiện tại, chia mỗi truy vấn tối đa một năm, quét mọi trang và gộp không trùng vào một JSON mỗi mã.
---

# Lịch sử giá CafeF theo mã

For ticker-scoped S4 price/action/share acceptance using retained sources, use `skills/vn30-market-price-corporate-actions/SKILL.md`. This fetching skill keeps its existing acquisition/storage scope and grants no admission authority.

**Owner policy 2026-11-12 — RAW CLOSE ONLY:** chỉ `GiaDongCua` được dùng cho investment/valuation/scoring/portfolio/return/backtest. `GiaDieuChinh` giữ nguyên trong raw để audit; không chọn nó hoặc fallback sang nó khi raw close thiếu/không hợp lệ. Không yêu cầu tài liệu phương pháp điều chỉnh CafeF: `ADJUSTED_PRICE_SERIES=EXCLUDED_BY_OWNER_POLICY`, `S4-R4=CLOSED_BY_SCOPE_EXCLUSION`.

Chuẩn hóa cho phép tính dùng `src/domain/market-boundary/cafef-raw-close.ts` và policy JSON cùng thư mục: giá nghìn VND ×1000 khi có evidence đơn vị; thiếu raw close hoặc bằng chứng đơn vị thì không đủ điều kiện. Đọc `docs/fundamental-data-engine/CAFEF_RAW_CLOSE_ONLY_POLICY.md`. Thu thập raw không tự cấp quyền nguồn/production. Historical return/backtest cần raw close cùng register cổ tức/corporate-action đã kiểm chứng riêng; thiếu register/coverage/PIT phù hợp thì trả `NOT_QUALIFIED`, không suy cổ tức từ giá điều chỉnh.

Link mẫu chủ sở hữu cung cấp:
https://cafef.vn/du-lieu/Ajax/PageNew/DataHistory/PriceHistory.ashx?ExchangeType=HOSE&Symbol=VNM&StartDate=11/11/2025&EndDate=11/11/2026&PageIndex=1&PageSize=30

Dùng script từ gốc dự án:

```sh
python3 skills/fetch-cafef-price-history/scripts/fetch.py --symbol VNM --years 5 --exchange HOSE
# Phạm vi chính xác và giữ cả receipt trang rỗng/không có ngày mới:
python3 skills/fetch-cafef-price-history/scripts/fetch.py --symbol VNM --start 2022-01-01 --end 2026-10-30 --retain-request-evidence
```

- `--years N`: N năm lùi từ ngày hiện tại theo `Asia/Ho_Chi_Minh`; mặc định 1 năm. `--as-of YYYY-MM-DD` chỉ dùng khi người dùng yêu cầu mốc kết thúc khác hoặc kiểm tra tái lập. `--exchange` mặc định HOSE; chọn sàn đúng cho mã, không mặc định mọi mã thuộc HOSE.
- `--start/--end YYYY-MM-DD` cho phạm vi chính xác; `--start` thay điểm đầu suy từ số năm, `--end` thay `--as-of`. API nhận `StartDate/EndDate` theo **MM/DD/YYYY**, nhưng trường trả về `Ngay` là **DD/MM/YYYY**. Đã kiểm chứng bằng ngày 30/10/2026: gửi `30/10/2026` hoặc ISO có thể bị bỏ qua và trả dữ liệu mới nhất! Link mẫu 11/11 không phân biệt được hai định dạng. Luôn kiểm tra ngày trả về nằm trong từng cửa sổ.
- Script chia khoảng thành cửa sổ tối đa một năm lịch, xử lý 29/2 về 28/2 khi năm đích không nhuận. Hai cửa sổ có thể chung ngày biên; khử trùng theo mã + ngày giao dịch. Đọc toàn bộ trang qua `TotalCount`, không chỉ lấy trang đầu.
- Output duy nhất cho từng mã: `data/market-history/cafef/<TICKER>.json`. Tái sử dụng file hiện có, giữ nguyên bản ghi cùng ngày đã lưu, chỉ thêm ngày chưa có. Nếu cùng ngày khác nội dung, bỏ qua thay thế và lưu cảnh báo xung đột trong cùng JSON. Không tự cập nhật lại chuỗi giá điều chỉnh lịch sử dù CafeF thay đổi; báo rõ giới hạn này khi có xung đột.
- Mỗi dòng giữ nguyên mọi trường API, kèm ngày ISO chuẩn hóa và nguồn request/thời gian nhận. Request inventory và phản hồi REST nguyên văn cùng SHA-256 nằm trong chính JSON này; request trả toàn dòng trùng và không phát hiện xung đột thì không lưu thêm capture trùng. Không tạo thư mục capture hoặc file riêng mỗi lần chạy. Quy định này dành riêng lịch sử CafeF, không thay đổi luồng TCBS trực tiếp SQLite.
- `--retain-request-evidence` giữ thêm receipt của trang rỗng/không đổi (khử trùng URL+SHA), phục vụ kiểm chứng coverage; không thay dữ liệu đã lưu. curl dùng TLS trust store hệ thống, timeout 45 giây và retry tối đa 2 lần cho lỗi tạm thời; không tắt kiểm chứng chứng chỉ. Lỗi cuối trả JSON trên stderr và exit 1. Kiểm tra thứ tự giảm dần, số đếm, biên OHLC và số hữu hạn không âm; trường không có vẫn là không có, không tự điền giá.
- Lỗi HTTP/schema/phân trang khiến lần chạy dừng và không thay file cũ; không ghi rỗng thay cho dữ liệu lỗi. Ghi file nguyên tử sau khi hoàn tất. Chạy tuần tự cùng một mã để tránh tranh chấp ghi file.
- Dữ liệu là lịch sử giá do CafeF cung cấp; giữ riêng `GiaDongCua` và `GiaDieuChinh`, chuỗi `ThayDoi`, các trường khối lượng/giá trị và mọi trường bổ sung. JSON không khai báo đơn vị thì để `units: null`, không tự nhân đơn vị hoặc biến giá thiếu thành 0. Không coi dòng ngày hiện tại là phiên đã chốt hay quote trực tiếp.
- Không ghi vào SQLite, ledger, bảng giá dashboard hoặc scoring. Báo phạm vi ngày, số request, số phiên mới/trùng/xung đột và file kết quả. Chỉ tạo/chỉnh skill không tự chạy tải nhiều năm hoặc toàn VN30.

## Governed ingestion handoff

For explicitly authorized governed normalization/persistence, hand this collector’s exact container/hash and original request receipts to the standing ingestion route in `skills/vn30-market-price-corporate-actions/references/standing-ingest.md`. The collector itself remains raw-only and does not activate SQLite prices/dashboard. Standing source principle approval is not code acceptance; the trusted host must verify independent material and capture provenance before automatic capability/market acceptance. Do not add a second fetcher or normalizer here.
