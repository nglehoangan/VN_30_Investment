# B4 — cổ tức chờ về

Quyết định chủ tài khoản ngày 28/10/2026: lưu riêng 475.000 VND là **Cổ tức chờ về**, chưa nhận; chỉ tính vào tiền mặt/tiền có thể dùng khi có xác nhận đã ghi có.

Bản ghi riêng: `data/account-current/pending-dividends.json`, nguồn ảnh ngày 28/10 trong SCREEN_OBSERVATION.json của B2. Mã cổ phiếu, sự kiện và ngày thanh toán chưa có nên giữ null; không tự gán GAS.

Khi nhận tiền: đối chiếu sao kê, giảm phần chờ tương ứng, ghi tăng tiền mặt một lần; nếu nhận một phần thì phần còn lại vẫn chờ. Không tạo thêm dòng tiền khi khoản nhận đã có trong sao kê. Không coi 95.000 MWG đã nhận ngày16/10 là khoản mới để trừ tiếp khỏi475.000.

B4 đã giải quyết trong phạm vi chủ tài khoản yêu cầu: lưu/hiển thị riêng khoản chờ và tính tiền mặt khi nhận. Không yêu cầu phân bổ theo mã để hiển thị tổng chờ; không khẳng định đã hoàn tất đối chiếu claim lịch sử. Bản ghi là dữ liệu riêng được lưu, chưa tích hợp runtime hoặc sửa ledger. NAV broker giữ nhãn/phạm vi nguồn và không cộng475.000 thêm lần nữa.
