---
name: fetch-vietstock-dividend-pdfs
description: Tìm và tải PDF cổ tức/phát hành trên Vietstock cho đúng một mã VN30 mỗi invocation và khoảng ngày; cần universe version/ngày tham chiếu, không nhận batch.
---

# PDF cổ tức và phát hành thêm theo mã

## Single-ticker execution — owner amendment

Bắt buộc đúng **một `ticker`** cho mỗi lần gọi; từ chối ALL, wildcard, danh sách, nhiều mã ghép chuỗi hoặc lặp tham số ticker. Chọn `universeVersion` đã pin và `referenceDate` liên quan; kiểm tra membership/security identity trước xử lý bằng [contract dùng chung](../vn30-rollout-orchestrator/references/single-ticker-contract.md).

```sh
python3 -B skills/vn30-rollout-orchestrator/scripts/runtime.py prepare \
  --skill fetch-vietstock-dividend-pdfs --ticker VNM --reference-date 2026-10-30 \
  --purpose RETROSPECTIVE_RESEARCH --universe-version vn30-20260803-reviewed-20261115
```

Lệnh này chỉ tạo context, không chạy worker. Dùng ticker/context đã kiểm tra khi thực hiện các bước dưới đây; worker/script cũ không phải lối bỏ qua guard. Output/evidence/checkpoint/blocker phải gắn executionId và đúng ticker. Không tái dùng authority, assessment, deployment hoặc publication permission của mã khác. Chỉ kiểm kê/readiness toàn universe mới được read-only nhiều mã; xử lý nhiều mã phải qua [orchestrator tuần tự](../vn30-rollout-orchestrator/SKILL.md), concurrency=1. Không tự cấp approval hoặc kích hoạt production.


For ticker-scoped S4 price/action/share acceptance using retained sources, use `skills/vn30-market-price-corporate-actions/SKILL.md`. This fetching skill keeps its existing acquisition/storage scope and grants no admission authority.

Worker dưới đây được giữ nguyên cho replay/compatibility của receipt cũ; không dùng làm đường tải mới sau quy ước lưu 2026-11-18. Với acquisition mới: dùng API phân trang ở reference để discovery, tái sử dụng `request`, `TokenParser`, `normalize` của worker khi viết host, rồi tải từng URL qua `tools/maintenance/download.py` ở cuối Skill:

```sh
python3 skills/fetch-vietstock-dividend-pdfs/scripts/fetch.py --symbol VNM --start 2022-01-01 --end 2026-10-30
```

`--page-size 10|20|50` (mặc định 20) là giao diện legacy. Script lưu manifest có timestamp, raw API/receipt từng trang, sự kiện gốc và normalized candidate, tái sử dụng PDF theo URL và hash; lỗi tải từng tệp được giữ và exit 2 (partial), lỗi API/schema exit 1. Không có script cũ nào bị thay thế.

Quan trọng: bộ lọc ngày lịch không phải lịch công bố. Cần kiểm tra công bố trước cutoff nhưng ngày quyền/thanh toán sau cutoff bằng tài liệu nguồn hoặc truy vấn bổ sung có giới hạn; không đưa sự kiện tương lai vào giá/quyền đã thực hiện. Tab1 không chứng nhận đầy đủ splits, reverse splits, treasury changes, ESOP hay mọi capital event. Announcement date và tỷ lệ không rõ giữ null. Cash amount từ Note chỉ là provider candidate, có thể mâu thuẫn chính PDF đính kèm (VNM tháng 7/2026: API 1.800, nguồn VSDC 1.850); không sửa raw hoặc coi dữ liệu API là đã xác nhận.

Đường dẫn tính từ gốc dự án. Dùng skill này khi cần tài liệu nguồn cho các sự kiện trên, thay vì API lịch sử giá CafeF. Chỉ xử lý mã và khoảng ngày đang được yêu cầu; không tự chạy toàn bộ VN30.

## Link đã lưu

- Link chủ sở hữu cung cấp: https://finance.vietstock.vn/lich-su-kien.htm?page=1&from=2016-02-01&to=2026-12-11&code=VNM&tab=1
- Mẫu: `https://finance.vietstock.vn/lich-su-kien.htm?page=1&from=<YYYY-MM-DD>&to=<YYYY-MM-DD>&code=<TICKER>&tab=1`.
- Thay `code` bằng mã cần lấy. `tab=1` là cổ tức và phát hành thêm. Khoảng ngày mẫu là phạm vi yêu cầu VNM ban đầu, không phải mặc định cố định cho mọi mã.

## Thu thập khi cần

1. Đọc `AGENTS.md` và `docs/fundamental-data-engine/VIETSTOCK_ONLY_SOURCE_POLICY.md`. Kiểm tra manifest/PDF đã có trong `data/manual-download/<TICKER>/` trước; tái sử dụng đúng tài liệu còn hợp lệ. Nếu cần đọc nội dung, dùng `skills/read-pdf-json-first/SKILL.md` trước khi trích xuất.
2. Dùng mã/khoảng ngày người dùng nêu. Nếu chỉ nêu mã, dùng khoảng mẫu bắt đầu `2016-02-01` đến ngày hiện tại theo múi giờ người dùng, thông báo rõ phạm vi; không coi đó là lịch sử trọn đời của mã. Nếu người dùng đưa link, giữ các bộ lọc của link.
3. Mở trang để lấy danh sách động. Xem [references/event-api.md](references/event-api.md) để dùng API phân trang đã kiểm tra. Đọc tổng số bản ghi và quét mọi trang, không chỉ tải HTML hoặc suy ra từ số link ở trang đầu. Kiểm tra mã của từng sự kiện và giữ nguyên các loại sự kiện nhà cung cấp trả về; lọc loại theo nhãn/nội dung khi yêu cầu hẹp hơn.
4. Giữ từng sự kiện với `EventID`, nhãn, tiêu đề, nội dung, các ngày nguyên gốc và `FileUrl`. Các sự kiện khác nhau có thể dùng chung một PDF; tải một lần nhưng giữ mọi liên kết sự kiện–tài liệu. Sự kiện không có tệp vẫn nằm trong inventory.
5. Chỉ tải từ `finance.vietstock.vn` và `static2.vietstock.vn`; kiểm tra host trước từng request và từng redirect, không dùng tự động follow redirect. Nâng link HTTP Vietstock cũ lên HTTPS và mã hóa khoảng trắng trong URL. Link ngoài hai host này phải được ghi `BLOCKED_SOURCE_POLICY`, không tự chuyển sang nguồn issuer/HOSE.
6. Lưu PDF mới qua kho dùng chung bên dưới vào `data/manual-download/<TICKER>/`, tên `TICKER__TYPE__PERIOD__SCOPE__sha12.pdf`. Giữ event/page receipts riêng. Các đường dẫn legacy đã pin không đổi; các hàm request/TokenParser/normalize cũ hỗ trợ discovery, CLI cũ chỉ dùng replay đã duyệt, không tạo thêm quy ước lưu mới. Dùng thư mục tạm cho cookie/token và dữ liệu trung gian; không đưa thông tin phiên vào manifest hay git.
7. Lưu manifest theo mỗi lần thu thập, giữ lịch sử lần trước khi chạy lại. Ghi URL trang, tham số không chứa token, thời gian nhận UTC, trang/tổng số/bản ghi, URL tệp gốc/cuối, HTTP status thực tế, đường dẫn, số byte, SHA-256 và trạng thái `DOWNLOADED`, `REUSED`, `FAILED`, `BLOCKED_SOURCE_POLICY` hoặc `NO_ATTACHMENT`. Khi tái sử dụng, giữ receipt tải gốc; không tự gán HTTP 200 hay thời gian tải mới. Giữ URL/phiên bản khác nhau và phát hiện nội dung thay đổi, không latest-wins.
8. Kiểm tra đủ trang, tổng bản ghi và EventID duy nhất; so sánh total giữa các trang để phát hiện danh sách thay đổi. Xác nhận byte PDF và hash từng file. Retry hữu hạn cho lỗi mạng; nếu bị đăng nhập/chặn truy cập hoặc schema đổi thì báo phần thiếu, không coi danh sách rỗng là hoàn tất. Dọn file tạm sau xử lý, giữ PDF và manifest.

## Khi lấy thông tin cổ tức từ PDF

Giữ riêng cổ tức tiền mặt, cổ tức cổ phiếu, cổ phiếu thưởng và quyền mua/phát hành thêm. Trích tỷ lệ, số tiền/cổ phiếu, giá phát hành, ngày giao dịch không hưởng quyền, ngày đăng ký cuối cùng, ngày thanh toán và kỳ cổ tức đúng theo PDF, kèm đường dẫn PDF và trang. Không có thông tin thì để null; không suy ngày giao dịch/chuyển đổi từ ngày thanh toán. Không coi lịch sự kiện là bằng chứng tiền hoặc cổ phiếu đã thực nhận.

Không tự đăng bút toán, cập nhật số dư/quyền sở hữu, điều chỉnh giá vốn, kích hoạt nguồn hay sửa lịch sử kế toán. Kết quả thu thập là tài liệu tham khảo cần đối chiếu. Báo số trang/sự kiện/PDF duy nhất, tệp tái sử dụng, phần thiếu và đường dẫn kết quả.

## Kho file dùng chung — 2026-11-18

Dùng `tools/maintenance/download.py` cho URL PDF đã xác định từ discovery. Công cụ dùng lại transport Vietstock hiện có, kiểm tra từng redirect và guard một ticker/version/date; không tải toàn universe.

```sh
python3 -B tools/maintenance/download.py --ticker VNM \
  --universe-version vn30-20260803-reviewed-20261115 --reference-date 2026-10-30 \
  --url 'https://static2.vietstock.vn/<exact-source-path>.pdf' \
  --document-type FINANCIAL --period 2026Q3 --scope CONSOLIDATED
```

Thay URL bằng link thật đã xác định; ví dụ không phải URL để chạy. TYPE/PERIOD/SCOPE dùng token uppercase an toàn; chưa biết dùng UNKNOWN, không suy scope/kỳ từ số tiền hay tên file. PDF mới dùng `TICKER__TYPE__PERIOD__SCOPE__<SHA256 đầu 12 ký tự>.pdf`; SHA đầy đủ nằm trong catalog. Khác bytes là revision riêng, không ghi đè. Một URL có nhiều revision đã giữ thì cache báo conflict, không tự chọn bản đầu/cuối; cần lựa chọn revision rõ ràng hoặc yêu cầu refresh. Cùng bytes trong một ticker chỉ lưu một bản nhưng giữ riêng từng URL/event/receipt và metadata có thể mâu thuẫn. Không dedup giữa issuer.

Đọc `document-catalog.json` và `document-inventory.json` trong thư mục mã trước khi tải. Cache theo URL chỉ được dùng sau khi hash bytes còn khớp; giữ thời gian/HTTP receipt gốc. `--refresh` kiểm tra nguồn khi có lý do cần revision mới; không mặc định tải lại. Tên nguồn và receipt gốc được lưu nguyên trong catalog, không biến receipt cũ thành một lần tải mới.

Tài liệu cũ đang có source pin giữ đường dẫn nguyên trạng. Cleanup có thể thay bản sao trùng bằng hardlink alias, không sửa nội dung tại alias; mọi cập nhật phải tạo revision mới. Không xóa alias đang được receipt/canonical fact/approval tham chiếu. Tên giống nhau không chứng minh trùng; chỉ dedup khi SHA-256 bytes khớp. Cùng bytes nhưng nhãn hợp nhất/riêng khác nhau phải giữ conflict để review, không tự kết luận scope.

Tạo lại index cho đúng một mã: `python3 -B tools/maintenance/catalog.py --ticker VNM`. Đây là index từ receipt đã giữ, không phải admission hay xác nhận nội dung. Thiếu receipt/hash/kỳ/scope giữ rõ UNKNOWN. Xem [hướng dẫn maintenance](../../tools/maintenance/README.md).
