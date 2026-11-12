# VNM — bổ sung ba ngày giá từ Excel chủ sở hữu

Yêu cầu tiếp nối: dùng `VietstockFinance_thong-ke-gia_VNM_20261112-135143.xls` do chủ sở hữu cung cấp để bổ sung ngày thiếu. Chỉ cập nhật dữ liệu giá nghiên cứu; không tự thay quyết định nguồn/S4 trước đó.

## Kết quả

| Ngày | Mở cửa | Cao nhất | Thấp nhất | Đóng cửa | KL khớp lệnh | Ô đóng cửa |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 14/08/2025 | 61300 | 62200 | 61000 | 61700 | 6534600 | Sheet1!G127 |
| 29/01/2026 | 68500 | 71100 | 67900 | 71100 | 10036800 | Sheet1!G11 |
| 30/01/2026 | 71500 | 72500 | 70500 | 70600 | 7844800 | Sheet1!G10 |

Giữ nguyên giá trị số theo các ô nguồn. File không khai báo rõ đơn vị tiền/giá hoặc chính sách điều chỉnh; các metadata đó để null, không tạo adjusted close. Kiểm tra 124 ngày chồng lấp cho thấy cả496 trường OHLC trong file bằng giá trị CafeF gốc nhân1000. Đây là quan hệ tỷ lệ quan sát để đối chiếu, không được dùng thay một khai báo đơn vị/chính sách điều chỉnh của nhà cung cấp. Không đổi hệ số cho dữ liệu được nhập.

## Lưu trữ và liên kết

- Chỉ mục chung: `data/market-history/VNM.json`, **1.200 ngày duy nhất**, từ04/01/2022 đến30/10/2026. Mỗi ngày trỏ tới JSON Pointer trong nguồn riêng; không sao chép lại toàn bộ raw CafeF hoặc trộn các giá trị khác đơn vị vào một mảng số chung.
- Nguồn CafeF: `data/market-history/cafef/VNM.json`, giữ nguyên1.197 dòng và toàn bộ raw/receipt. SHA-256 không đổi: `d8a40adcbec57691eeeef89164f842a89b077de1a96edbea98cc9fa96f353887`.
- Bổ sung Vietstock: `data/market-history/vietstock/VNM.json`, chỉ3 dòng mới, nhãn `VIETSTOCK_OWNER_XLS`, ngày/ô/giá trị gốc và các trường giao dịch được giữ. Không ghi chúng thành phản hồi CafeF.
- Lưu đúng một bản nguồn trong dự án: `data/market-history/vietstock/sources/VietstockFinance_thong-ke-gia_VNM_20261112-135143.xls`. File gốc ở Downloads không bị sửa. SHA-256: `fd8715b89915b68c2faebb52bbd84d9182a155f27efd3f0990d98c33ad8976fe`.
- Workbook có127 dòng VNM từ01/08/2025 đến30/01/2026. Bỏ qua124 ngày đã có, không thay giá hay volume của chúng. Ngày nhận được lưu trong source receipt; không lấy ngày template2013 trong metadata Excel hoặc tên file làm ngày công bố lịch sử đã xác thực.

## Kiểm tra và phạm vi

Đã kiểm tra mã VNM, ngày duy nhất, biên OHLC, tổng khối lượng/giá trị khớp lệnh+thỏa thuận,496 giá trị OHLC chồng lấp và hash nguồn. Chạy lại nhập cùng file không đổi hai JSON mới, không thêm dòng trùng. Giải JSON Pointer cho toàn bộ1.200 ngày và hash từng nguồn đều khớp.24 kiểm tra S4 đã có tiếp tục đạt.

SQLite giữ nguyên SHA-256 `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65`; không thay ledger, dashboard, scoring hoặc hai skill. Chỉ mục chung là dữ liệu bổ sung, chưa tích hợp tự động vào ứng dụng.

Ba khoảng trống **đã được bổ sung trong lịch sử kết hợp bằng file Vietstock chủ sở hữu cung cấp**; chúng vẫn thiếu trong riêng nguồn CafeF. Đây không phải công bố official HOSE daily data, chứng nhận PIT, total-return methodology hay source admission. Báo cáo cũ được giữ như quan sát tại thời điểm của chúng; phần cập nhật này chỉ thay trạng thái có dữ liệu bổ sung cho ba ngày, không tự đóng các thiếu sót vốn cổ phần/nguồn ở S4.
