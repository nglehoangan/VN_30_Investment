# Xử lý hai file sao kê cổ phiếu mới

Chỉ xử lý hai file mới theo yêu cầu; bỏ qua hai attachment sao kê tiền ở tin nhắn liền trước. Không thay đổi hồ sơ tiền/giao dịch hoặc workbook tổng hợp đã tạo trước đó.

|Nguồn alias|Kỳ thực tế trong file|Số dòng dữ liệu|
|---|---|---:|
|SEC_A|01/01/2026–26/10/2026|19|
|SEC_B|01/01/2025–01/01/2026|10|

29 dòng, không trùng. Toàn bộ ngày/ticker/số lượng/loại sự kiện khớp 29 dòng đã đọc từ ảnh. Nguồn Excel bổ sung SHA-256 thực, sheet/dòng và ngày đầy đủ, thay thế giới hạn ảnh bị cắt năm cho các dòng tương ứng; không sửa seal lịch sử. Kỳ 01/05–26/10 có 16 dòng, tăng 800, giảm 255, ròng +545, khớp control trên ảnh.

|Chuyển pending → mã thường|Ngày ghi sổ broker|Số lượng đối ứng|
|---|---|---:|
|TPB|27/11/2025|−5 / +5|
|HPG|15/07/2026|−10 / +10|
|VHM|09/09/2026|−100 / +100|
|SSI|01/10/2026|−40 / +40|

Các ngày này là ngày ghi sổ từ export, không tự khẳng định ngày hiệu lực pháp lý. Giữ riêng ngày mua/bán trong mô tả, ngày chốt quyền và tỷ lệ được ghi; không suy tỷ lệ pending→ordinary từ entitlement ratio. Chuyển bucket không tăng thêm tổng exposure lần nữa, không tạo cash flow.

Luồng cộng dồn giải thích số lượng 11 mã thường ở sao kê PDF 07/10, trong đó FPT 200, GAS/VHM 200, SSI 240, HPG 110; TPB đã bán hết 105 trong 03–04/08/2026. Đây là đối chiếu flow với snapshot dưới xác nhận full history, không một chứng từ riêng xác lập mọi opening balance.

**Không có bất kỳ dòng FPT_WFT** ghi tăng 20 hoặc chuyển −20/+20 trong cả hai file. Vì vậy FPT_WFT 20 trên PDF vẫn chưa giải thích, conversionDate UNKNOWN. Không được thêm 20 vào ledger FPT 220; không dùng ngày chuyển SSI/HPG/VHM cho FPT.

Nguồn mới cải thiện provenance và ngày chính xác của lịch sử số lượng; chưa thêm giá cuối ngày hoặc nghĩa vụ tài chính nên chưa làm NAV từng ngày trở thành đầy đủ. Không sử dụng lại hai cash attachment bị bỏ qua cho phép tính mới, không tạo NAV từ giá khớp.

Các dữ liệu sạch nằm trong SECURITIES_STATEMENT_EVENTS.json; đối chiếu trong HOLDINGS_RECONCILIATION.json; hash/nguồn trong SOURCE_INVENTORY.json. File gốc riêng tư không được copy lên repository. Không source approval, accepted mapping, database/ledger write, candidate binding hay NAV/scoring activation.
