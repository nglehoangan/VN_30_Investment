# Historical NAV — tích hợp giao dịch và sao kê tiền

Kết quả: **đã tái dựng tiền theo ngày và đối chiếu toàn bộ giao dịch; NAV theo ngày còn thiếu giá lịch sử/nghĩa vụ phù hợp**. File Excel `outputs/m8-historical-nav-20261026/Historical_NAV_tong_hop.xlsx` có 5 sheet Summary, Daily, Cash, Trades, Securities. Không cập nhật portfolio SQLite hay ledger.

## Dữ liệu mới đã xác minh

Bốn file gốc: hai kỳ 2025/2026 cho giao dịch cổ phiếu và tiền. Tên riêng/tài khoản không được chép vào artifacts; dùng alias TRADES_A/B và CASH_A/B cùng SHA-256, sheet thật **Sheet 1**, dòng nguồn. Không có dòng dữ liệu trùng giữa hai kỳ, kể cả biên 01/01/2026. Giữ nguyên các dòng giống nhau có thể hợp lệ, không dedup theo số tiền/ngày một cách mù quáng.

17 lệnh (15 mua, 2 bán), 93 dòng tiền. Từng bước số dư nguồn khớp phép cộng, chênh lệch 0. Số dư đầu trước dòng nạp 30/06/2025 suy từ nguồn là 0; cuối 2025 = đầu kỳ tiền 2026 = 94.696. Đối chiếu tổng và từng nhóm ngày/chiều: tiền mua, bán, phí, thuế khớp hoàn toàn giữa hai loại file. 17 lệnh đều khớp ngày mua/bán và số lượng ở bộ ảnh trước; ngày ghi sổ chứng khoán và ngày tiền có thể khác.

|Chỉ tiêu|VND|
|---|---:|
|Vốn nạp/auto-funding từ ngân hàng|82.848.881|
|Giá trị mua|85.455.000|
|Giá trị bán|1.532.000|
|Phí mua + bán|26.095|
|Thuế bán ghi nhận|4.032|
|Cổ tức tiền mặt đã nhận, net|1.434.500|
|Lãi tiền gửi|987|
|Phí lưu ký|3.821|
|Tiền cuối 26/10/2026|**327.420**|

82.848.881 + 1.532.000 − 85.455.000 − 26.095 − 4.032 + 1.434.500 + 987 − 3.821 = **327.420**. Auto-funding là dòng tiền ngoài phạm vi tiểu khoản chứng khoán, không phải lợi nhuận. Không gồm số dư tài khoản ngân hàng chưa chuyển vào tiểu khoản. Cổ tức đã là net; không trừ thêm thuế cổ tức giả định. Thuế TPB bán 100 được sao kê tách 1.460 + 2.500 = 3.960, giữ đủ và không phân loại lại khi chưa có căn cứ.

## Historical NAV hiện có

**07/10/2026: NAV broker 78.915.815 VND**; tiền đóng ngày từ cash workbook **232.420**, khớp PDF. Đây là một điểm broker đã kiểm tra số học, không phải NAV tự dựng/production-admitted.

484 ngày lịch 30/06/2025–26/10/2026 đã có tiền đóng ngày và dòng nạp/cổ tức tích lũy. Ngày không có posting được carry số dư tiền trong phạm vi sao kê; không tạo phiên/giá thị trường giả. Giá trị chứng khoán, phải thu và nghĩa vụ chưa được tự điền; NAV tính lại giữ **n.a.**. Chưa tính TWR/XIRR/return từ cash balance.

Giá khớp mua/bán không phải giá đóng cửa của toàn bộ holdings. Historical 252-bar TCBS giữ lại thiếu giai đoạn đầu từ 07/2025, thiếu TPB đã từng nắm và chưa qualify adjusted/raw semantics. Không nhân chuỗi adjusted tùy ý với số lượng chưa điều chỉnh sau cổ tức/chia tách. Cần giá lịch sử đúng semantics, event/obligation coverage để điền chuỗi NAV từng ngày; không còn thiếu sao kê tiền cho phạm vi file đã cung cấp.

## Subtotal tham chiếu 23/10 — không phải NAV

Dùng close 23/10 được normalizer kỹ thuật kiểm tra, và giả thiết số lượng thường của sao kê 07/10 chưa thay đổi theo full-history:

- Giá trị 11 dòng thường, **FPT 200**: 76.742.500.
- Cộng tiền đã xác minh 327.420: **77.069.920**.
- Nếu 20 FPT_WFT được định giá bằng FPT close 57.000, cộng 1.140.000 → **78.209.920**. Đây là **scenario subtotal**, chưa gồm receivable/debt và chưa có accepted pending-share valuation/identity; không gọi là NAV.

Nguồn thị trường được lấy ngày 25/10 cho phiên 23/10, nên đây là retrospective current-knowledge analysis, không AS_KNOWN tại ngày 23/10. Không dùng giá 07/10 cho ngày 23/10, không phát sinh API hay activated market candidate.

## Evidence mới về khoản cổ tức / FPT

Raw tài khoản cũ tổng cashDividend 570.000 gồm **GAS 475.000 + MWG 95.000**. Không được nối với dòng tiền **VHM 570.000 ngày 22/07** chỉ vì cùng số tiền. Cash mới ghi **MWG 95.000 ngày 16/10**, mô tả record date 08/10; không còn được giữ khoản này như chưa nhận sau ngày trả nếu event được đối chiếu đầy đủ. Không post receipt vào ledger production.

GAS chưa có dòng nhận cổ tức tương ứng trong cash files đến 26/10. Chênh lệch 500.000 cash-equivalent ở PDF 07/10 có thể liên quan gross/net/timing nhưng **chưa có exact source breakdown** để kết luận. Khoản vay 105 ở PDF cũng không được tự xóa hay carry vĩnh viễn từ một snapshot.

FPT có 200 cổ phiếu mua từ hai lệnh và 20 FPT_WFT trên PDF; bộ securities screenshots vẫn thiếu event tạo/chuyển 20. Owner eventual conversion không cho ngày cụ thể. Không tự thêm 20 vào ledger đã tổng hợp 220. Source Cost/PL trong trade workbook là trường broker, có thể có rounding/adjustments; không dùng làm cash amount hay tự thay đổi basis policy.

## An toàn và bước còn lại

Dữ liệu gốc, SQLite, ledger, raw market, active candidate, source/policy code giữ nguyên. Chỉ tạo evidence/Excel offline riêng, không authority/admission/scoring. Cần bổ sung **giá đóng cửa lịch sử cho tất cả mã từng giữ**, corporate-action/receivable/debt và chứng từ FPT pending để hoàn thiện NAV. Không cần gửi lại các giao dịch/tiền đã đối chiếu đủ trong bốn file.
