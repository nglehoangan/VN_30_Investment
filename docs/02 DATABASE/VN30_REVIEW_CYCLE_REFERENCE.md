# VN30 — lịch tái cơ cấu và cách xác định membership

Ghi nhận yêu cầu chủ sở hữu ngày **15/11/2026**: lưu lịch tái cơ cấu để tái sử dụng khi xác định danh sách VN30 theo thời điểm. Đây là kiến thức tham chiếu/quy trình tra cứu, không phải sửa policy hoặc receipt chứng nhận membership mới.

## Lịch định kỳ

- Xem xét thành phần định kỳ **hai lần mỗi năm**, kỳ tháng **1** và **7**; ngày hiệu lực thường thuộc tháng **2** và **8**.
- Dùng **ngày hiệu lực trong thông báo thực tế**, không ngày công bố hay ngày analyst đọc tài liệu.
- **15/07 là ví dụ của năm2026, không phải ngày công bố cố định mọi năm.** Không tự suy ngày hiệu lực tương lai hoặc cộng cơ học sáu tháng.
- Phân biệt thay đổi **thành phần** với cập nhật khối lượng/free-float/tỷ trọng; cập nhật tỷ trọng không tự chứng minh thay đổi constituent identity.

## Cách tái sử dụng danh sách

1. Chọn thông báo/danh sách chính thức gần nhất có effective date không muộn hơn cutoff.
2. Dùng danh sách đó làm anchor cho khoảng sau ngày hiệu lực. Không yêu cầu danh sách riêng từng ngày hoặc kỳ tái cơ cấu mới chỉ vì cutoff cách ngày review một vài tuần.
3. Cập nhật những thông báo thay thế, loại bỏ, sửa đổi hoặc sự kiện ngoài kỳ có hiệu lực trước/đúng cutoff; không áp dụng sớm thông báo chưa hiệu lực.
4. Khi có exit/replacement xác nhận, dùng interval [effective_from, effective_to); endpoint là ngày hiệu lực thực tế, không ngày chứng nhận/đọc nguồn.
5. Lịch định kỳ hỗ trợ giả định làm việc về tính liên tục, **không tự chứng nhận không có ngoại lệ**. Ghi riêng membership anchor, known events, phạm vi theo dõi sự kiện, verified coverage và analyst assumption nếu cần. Thiếu coverage không phải bằng chứng mã đã bị loại.

AAS cũng nêu trường hợp cơ cấu bất thường/điều chỉnh đặc biệt. Vì vậy không lưu phát biểu “chỉ có thể thay đổi hai lần/năm, tuyệt đối cố định giữa kỳ” thành một quy tắc sự thật hay tự cấp formal eligibility. Không bắt owner xác nhận lại lịch; chỉ xác minh event/evidence thực sự còn thiếu khi formal contract yêu cầu.

## Các mốc2026 giữ lại

| Kỳ | Công bố | Hiệu lực | Mức chứng cứ |
| --- | --- | --- | --- |
| Đầu năm2026 | Tháng1; không suy ngày cụ thể từ ngày bài báo | 02/02/2026 | Vietstock theo link owner, bài22/01/2026; reference thứ cấp, không tự source admission |
| Giữa năm2026 | 15/07/2026 | 03/08/2026 | Official retained review và thông báo HOSE đã giữ; anchor hiện có |

Đối với VNM cutoff30/10/2026: anchor03/08 vẫn là anchor thích hợp; **16/10 là giới hạn coverage đã chứng nhận, không phải ngày danh sách hết hiệu lực**. Tài liệu này không tự mở rộng receipt coverage, sửa registry/profile, đổi Step2 BLOCKING hoặc tuyên bố F1 admitted. Dùng nó để thu hẹp kiểm tra còn lại vào thông báo ngoài kỳ/correction liên quan thay vì tìm một rổ VN30 mới cho mỗi ngày.

## Nguồn và phạm vi kiểm tra

- Owner cung cấp: https://aas.com.vn/ma-co-phieu-vn30/ — kiểm tra15/11/2026; phần lịch nêu tháng1/tháng7, đồng thời có điều chỉnh đặc biệt. Không dùng bảng constituents trong bài thay danh sách chính thức của kỳ khác.
- Owner cung cấp: https://vietstock.vn/2026/01/dao-danh-muc-vn30-ky-thang-12026-vpl-gia-nhap-bcm-bi-loai-ra-3358-1393781.htm — kiểm tra15/11/2026; effective02/02/2026. Ngày bài22/01 không tự là official announcement timestamp.
- Retained official review: `docs/fundamental-data-engine/evidence/2026-10-16-di-governance-closure/OFFICIAL_VN30_UNIVERSE_REVIEW.json`; announcement/effective dates checked against retained JSON.
- Existing governing contract: `docs/02 DATABASE/VN30_MASTER.md` §§5.4,7–8,11–12; effective-dated identity/event/coverage vẫn giữ nguyên. Tham chiếu này không được dùng để vượt approved evidence hoặc consumer gates.

## Current-list check15/11/2026

`docs/fundamental-data-engine/vn30-current-membership-reference/2026-11-15/CURRENT_MEMBERSHIP_CHECK.json`: CaféF current VN30 group includesVNM;30ticker set matches retained July composition. VnEconomy10Nov reports unchanged30constituents with weight changes. Use as current secondary/research corroboration, not automatically certified event coverage or source admission.

## Qualified F1 successor15/11/2026

Membership F1 tại cutoff30/10 đã CLOSED bằng lịch công bố chính thức HOSE mới (4081records/5pages,13notices đều effective16Nov), nối prior certified history. Profile kế nhiệm coverage03/08–15/11 và actual RAW_CLOSE admission/consumption được kiểm chứng trong `docs/fundamental-data-engine/vnm-f1-membership-closure/2026-11-15/`. Xem F1_MEMBERSHIP_ACCEPTANCE.json và VALIDATION.json (47regressions,6negative runtime checks). Không tiếp tục coi gap17–30Oct là blocker hiện hành; F2/consumer/scoring gates và production vẫn riêng.
