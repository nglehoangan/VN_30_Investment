# B1 — quy ước nguồn Excel theo chỉ đạo chủ tài khoản

Ngày 28/10/2026. Chỉ đạo mới của chủ tài khoản thay thế yêu cầu lịch sử/PDF trong phạm vi B1 danh mục cá nhân.

- Dùng sao kê cổ phiếu và lịch sử giao dịch Excel do chủ tài khoản cung cấp. PDF là nguồn bổ sung tùy có, không bắt buộc.
- Bỏ yêu cầu phải nối danh mục hiện tại với snapshot 08/10 hoặc cung cấp chuỗi PDF lịch sử mới được nhận diện chứng khoán.
- B1 nhận diện 11 mã cho danh mục cá nhân: **RESOLVED** dựa trên nguồn chủ tài khoản và kết quả đối chiếu VSDC. Không cần xin thêm ISIN/mã nội bộ hoặc PDF để đóng phần này.
- FPT sở hữu tổng 220: 200 giao dịch, 20 cổ phiếu thưởng FPT_WFT chưa giao dịch. Không suy ngày chuyển và không cộng thêm 20.

Đã tìm và đọc XML của bốn Excel gốc ở nơi lưu trữ riêng: hai báo cáo giao dịch, hai sao kê cổ phiếu; phân biệt đúng kỳ 2025 và 2026 bằng tiêu đề trong workbook, không chọn theo hậu tố filename. Inventory giữ hash, kỳ và tọa độ dòng; không chép dữ liệu cá nhân hoặc số hiệu lệnh. Báo cáo 2026 có phạm vi 01/01–26/10/2026; không có dòng giao dịch/biến động chứng khoán mang ngày 08–23/10 trong các báo cáo này. Đây là quan sát trong phạm vi export, không chứng nhận độc lập tính đầy đủ mọi nghĩa vụ tài khoản.

“Xóa lịch sử” được thực hiện bằng cách loại yêu cầu lịch sử khỏi phạm vi B1 hiện tại. Không xóa sổ giao dịch, file nguồn hoặc evidence đã niêm phong. Các nhận định B1 còn mở trong gói 3.5/3.6 và báo cáo PDF/linkage trước đó là trạng thái trước quyết định này, không được dùng để yêu cầu lại chuỗi PDF cho danh mục cá nhân.

Quyết định này không bật adapter/runtime, sửa DB, nghiệm thu production độc lập, phê duyệt NAV lịch sử hoặc đóng B2–B7. CURRENT_POLICY.json là quyết định phạm vi/workflow, không phải runtime approval record.
