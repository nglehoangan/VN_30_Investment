# B5 — giá vốn từ Excel

Đã đọc lại bốn Excel gốc:17 giao dịch và29 biến động cổ phiếu; đối chiếu tiền mua/phí với hai sao kê tiền. Không cần gửi lại các file đã có.

Giá vốn mua = giá trị khớp mua + phí mua + thuế mua. Không lấy giá đặt hoặc cột giá vốn broker làm giá khớp. Cổ phiếu thưởng tăng số lượng nhưng giữ tổng giá vốn mua; cổ tức tiền và phí lưu ký được giữ riêng. Các vị thế11mã đang giữ không có giao dịch bán trong tập Excel cung cấp. TPB đã bán hết được giữ trong nguồn kiểm tra, không đưa vào danh mục hiện tại.

| Mã | SL | Giá vốn mua gồm phí | Bình quân/CP (VND) | Giá vốn hiển thị đã nhập | Chênh lệch |
|---|---:|---:|---:|---:|---:|
| FPT | 220 | 16264878 | 73931.263636363636 | 16065060 | 199818 |
| GAS | 200 | 19035709 | 95178.545 | 18535800 | 499909 |
| HPG | 110 | 2635790 | 23961.727272727273 | 2585770 | 50020 |
| MBB | 100 | 2010603 | 20106.03 | 2010600 | 3 |
| MWG | 100 | 8532559 | 85325.59 | 8332600 | 199959 |
| SSI | 240 | 5941782 | 24757.425 | 5742000 | 199782 |
| TCB | 100 | 3591077 | 35910.77 | 3521100 | 69977 |
| VCB | 100 | 5851755 | 58517.55 | 5761800 | 89955 |
| VHM | 200 | 9382814 | 46914.07 | 8782800 | 600014 |
| VPL | 100 | 8232469 | 82324.69 | 8232500 | -31 |
| VRE | 100 | 2510753 | 25107.53 | 2410800 | 99953 |

Đối chiếu nguồn: EXCEL_INPUTS.json giữ hash/ô nguồn và các giao dịch cần thiết, không giữ số tài khoản/số hiệu lệnh. CASH_PURCHASE_CHECKS.json đối chiếu theo ngày (khi broker gộp nhiều mã cùng ngày). Dữ liệu giá vốn riêng: `data/account-current/acquisition-cost-basis.json`.

## Kết quả và giới hạn

Tính xong giá vốn mua từ Excel cho11/11mã; số lượng đối chiếu được với sao kê cổ phiếu và20FPT thưởng do chủ tài khoản xác nhận. Không cần thêm dữ liệu để hoàn thành phép tính này. Chưa chứng minh đầy đủ số dư đầu trước kỳ export.

Phần B5 còn mở chỉ là đối chiếu quy tắc giá vốn hiển thị TCBS với giá vốn mua: cần định nghĩa broker có điều chỉnh cổ tức tiền, ngày chốt, corporate action và làm tròn như thế nào nếu muốn tái tạo đúng con số TCBS. Không coi số chênh tương tự cổ tức là chứng minh quy tắc. Không bắt người dùng xin lại toàn bộ lịch sử hoặc PDF. Có thể tiếp tục sử dụng giá vốn mua từ Excel như chỉ tiêu riêng đã ghi rõ nguồn/quy tắc; chưa thay thế giá vốn ledger.

Chưa chỉnh DB, MWAC, bút toán hoặc runtime. Các ảnh và mốc so sánh vẫn giữ nguyên ngày nguồn; không tuyên bố giá vốn đã được broker chấp thuận độc lập.

## Quyết định chủ tài khoản — giá vốn tính lời/lỗ

Ngày28/10/2026: dùng **giá vốn đã nhập** để xác định lời/lỗ. Quyết định này thay thế câu hỏi lựa chọn giá vốn ở trên. B5 hoàn thành cho phạm vi lời/lỗ danh mục cá nhân; không cần tái tạo quy tắc giá vốn TCBS để dùng số đã nhập. Đã đọc SQLite read-only và xác nhận11/11giá vốn lựa chọn khớp bút toán mở đầu. Giá vốn mua từ Excel giữ riêng để đối chiếu.

Lời/lỗ tạm tính = giá trị thị trường tại ngày định giá − giá vốn đã nhập. Tỷ lệ = lời/lỗ ÷ giá vốn đã nhập ×100%. Không tự trừ cổ tức thêm khỏi giá vốn, không coi cổ tức chờ về là tiền đã nhận. Đây là lời/lỗ theo cơ sở đã nhập, không mặc định là tổng lợi nhuận kinh tế đã tái dựng độc lập. Chưa có giá mới được lấy trong bước này nên không xuất số lời/lỗ “hiện tại”.

`data/account-current/selected-pnl-basis.json` lưu lựa chọn và từng giá vốn. Logic valuation hiện có đã lấy marketValue trừ openCost của ledger; không cần sửa công thức, ghi đè ledger hay bật production.
