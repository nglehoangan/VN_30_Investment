# B1–B5 — tích hợp danh mục cá nhân

Dữ liệu `data/account-current/personal-account.json` được reader runtime đọc và xác thực, không còn chỉ lưu hồ sơ. Schema giới hạn chuỗi decimal lossless, ngày hợp lệ và định danh. Reader chỉ gắn đúng portfolioId, ledger watermark, số lượng và giá vốn từng vị thế; từ chối trùng mã/ISIN, mismatch, nguồn giá tương lai và dữ liệu owner ngày tương lai theo múi giờ Việt Nam. File không có thì giữ luồng hiện hữu; file hỏng thì báo lỗi riêng, không âm thầm hiển thị snapshot broker cũ thay dữ liệu owner.

Composition root `loadDashboard` tích hợp observer vào DashboardModel. Dashboard/holdings/imports/settings/risk/performance hiển thị panel ngày nguồn rõ ràng. Dashboard và holdings không còn hiển thị số ledger cũ dưới nhãn danh mục hiện tại khi panel owner có mặt. Sổ ledger vẫn là lịch sử bất biến; không tạo bút toán khớp số hoặc post lại giao dịch mua trong Excel. Đây là tích hợp read model cá nhân được chủ tài khoản yêu cầu, không phải cấp quyền scoring/capital action hoặc rewrite accounting.

- B1:11mã/ISIN, số lượng và giá vốn nhập được đối chiếu ledger.
- B2:tiền327420, phí lưu ký420, tiền rút327000, bank12152752, sức mua12479752. **Sửa số học trước đây:327420+12152752−420=12479752**. Không tự tính phí tăng hàng ngày khi chưa có đơn giá hoặc source mới.
- B3:FPT220sở hữu=200giao dịch+20thưởng chưa giao dịch, không cộng thêm20.
- B4:475000lưu riêng cổ tức chờ về; không ghi nhận tiền mặt/thu nhập đã nhận hoặc cộng thêm vào NAV broker.
- B5:lời/lỗ theo importedCost, không lấy acquisition cost Excel thay thế; giá và lời/lỗ ghi đúng mốc snapshot nguồn2026-10-11, không phải giá trực tiếp28/10. NAV91742252là số broker báo cáo28/10, không NAV tự tính từ giá khác ngày.

Tests12case mới kiểm tra số học, chia FPT, mismatch/revision/future date, UTC/Vietnam, giá thiếu và HTML. Kiểm tra composition root trên bản sao SQLite thật cùng browser1440/390và trang chi tiết FPT. Ảnh thật chỉ dùng QA tạm, không commit/publish. Chứng cứ DB trước/sau giữ hash; các log test/browser không dump tài khoản hoặc credentials.

Các quy tắc cũ “chưa tích hợp runtime” trong hồ sơ B1–B5 và B6 trước đó là trạng thái lịch sử, được gói này thay thế cho read model cá nhân. Những gate production độc lập vẫn giữ nguyên.
