# Ràng buộc dataset BANK ACB — kết quả cô lập

**Đạt ghi và đọc lại trên SQLite cô lập. Dataset chính thức tiếp tục BLOCKED.**

Adapter BANK ghi vào bảng current financial dataset hiện hành và kiểm tra authority admission khi đọc lại. CAR/CET1 giữ kỳ 30/06/2026, scope `REGULATORY_CONSOLIDATED` và đơn vị `RATIO`. Số liệu hợp nhất Q3 và 9T giữ kỳ và vintage riêng. Giá S4 là 21.000 VND/cổ phần ngày 30/10. Mẫu số nghiên cứu S4 là 5.804.421.957 với phạm vi tài liệu kiểm tra giới hạn. Biên nhận giá, review cổ phần và hash hai nguồn được đưa vào lineage.

Diễn tập sử dụng hai PDF thật qua lớp admission BANK với quyết định phê duyệt giả lập chỉ có trong thư mục tạm. Cổng S4 trong test đọc receipt F1 cô lập đã ghim và review cổ phần đã ghim. Ghi và đọc lại 14 fact, tái chạy không tạo bản sao, từ chối scope CAR sai, mẫu số cổ phần sai cutoff và ticker khác. SQLite đọc lại ở chế độ query-only và nguồn bị thu hồi chặn đọc. Không chấm điểm.

Hash dataset cô lập `9ed34f0e6912885f071b4a58fbfd6688e4836d9cba0754f2d971cf6d0c12e781`. Không cấp official dataset hash từ kết quả này. Route BANK chính thức vẫn chưa được đăng ký. SQLite hoạt động vẫn là placeholder và không được ghi.

Để chạy trên đích chính thức cần quyết định phiên bản BANK đúng hash, composition ràng buộc và S4 được ghim và kết nối với nguồn đọc có quản trị, cùng SQLite đích có bytes cục bộ. Giữ hash kỹ thuật cô lập riêng trong khi nghiệm thu các bước đó.

[Biên nhận SQLite cô lập](BINDING_ISOLATED_RECEIPT.json) · [Hash mã và biên nhận](BINDING_REVIEW.json) · [Kết quả CLI](POST_BINDING_CHECK.json)
