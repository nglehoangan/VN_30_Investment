# Vietstock event API — đã kiểm tra 2026-11-11

Trang HTML không chứa bảng sự kiện: dữ liệu được tải bằng JavaScript. Có thể dùng trình duyệt hoặc HTTP client có cookie jar tạm.

1. GET trang `lich-su-kien.htm` theo link mẫu, giữ cookie phiên. Đọc hidden input `__RequestVerificationToken` bằng HTML parser (không log token).
2. POST cùng phiên tới `https://finance.vietstock.vn/data/eventstypedata`, form URL-encoded, với Referer trang nguồn và `X-Requested-With: XMLHttpRequest`.

| Tham số | Giá trị |
| --- | --- |
| `eventTypeID` | `1` |
| `channelID` | `0` — mọi loại trong tab |
| `code` | Mã người dùng yêu cầu |
| `catID` | Chuỗi rỗng khi lọc theo mã |
| `fDate`, `tDate` | `YYYY-MM-DD` từ bộ lọc |
| `page` | Bắt đầu `1`, tăng từng trang |
| `pageSize` | `20` đã kiểm tra |
| `orderBy`, `orderDir` | `Date1`, `DESC` |
| `__RequestVerificationToken` | Token của phiên hiện tại |

Phản hồi đã quan sát: `[ [event, ...], [totalCount] ]`. Số trang là `ceil(totalCount/pageSize)`; đọc và xác minh schema thực tế trước khi dùng. Mỗi event có `EventID`, `EventTypeID`, `ChannelID`, `Code`, `Name`, `Note`, `Title`, `Content`, `GDKHQDate`, `NDKCCDate`, `Time`, `FileUrl`, `Row`. Giữ chuỗi ngày gốc `/Date(milliseconds)/`; khi hiển thị chuyển sang `Asia/Ho_Chi_Minh`, không mặc định UTC là ngày sự kiện Việt Nam.

Bundle triển khai được tham chiếu từ HTML bằng `/bundles/eventcalendar/jsx?...`; khi schema hoặc tham số đổi, đọc bundle hiện tại của Vietstock để kiểm tra thay vì cố định token/query bundle cũ. Không dùng API giá CafeF thay cho dữ liệu sự kiện.

## Lần thu thập VNM đầu tiên

- Link nguồn: https://finance.vietstock.vn/lich-su-kien.htm?page=1&from=2016-02-01&to=2026-12-11&code=VNM&tab=1
- Manifest: `data/manual-download/VNM/events-2016-02-01_2026-12-11/manifest.json`.
- 35 sự kiện, 2 trang, 28 URL đính kèm riêng biệt; 27 PDF đã tải và kiểm tra SHA-256. Một URL HOSE của EventID `85664` nằm ngoài nguồn cho phép nên chưa tải. Đây là kết quả lần thu thập đó, không phải số lượng cố định cho lần chạy sau.
- Một số URL cũ có khoảng trắng và HTTP; cần HTTPS và percent encoding. Nhiều sự kiện có chung `FileUrl`, ví dụ hai kỳ cổ tức trong một thông báo; không xóa mất một sự kiện khi khử trùng tệp.
