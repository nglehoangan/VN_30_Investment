# Tổng hợp Historical NAV từ sao kê chứng khoán

Trạng thái: **PARTIAL_EVIDENCE — DAILY_NAV_BLOCKED**. Đây là tổng hợp evidence offline, không cập nhật database hay NAV production. Đã dùng toàn bộ ba ảnh theo xác nhận của chủ sở hữu, loại dòng trùng giữa ảnh 1/3 và giữ riêng ngày hạch toán chứng khoán với ngày mua/bán trong mô tả.

## Điểm Historical NAV xác định được

|Ngày|NAV VND|Nguồn / trạng thái|
|---|---:|---|
|07/10/2026|78.915.815|Sao kê broker đã kiểm tra số học; chưa được production acceptance|

78.183.500 giá trị cổ phiếu (bao gồm FPT_WFT) + 732.420 tiền/tương đương tiền − 105 vay = 78.915.815. Không tạo thêm điểm NAV số học cho các ngày thiếu dữ liệu. HISTORICAL_NAV.json biểu diễn rõ một điểm broker và các ngày UNAVAILABLE, không nội suy/carry-forward hoặc giả định cash bằng 0. Chưa tính lợi nhuận/TWR/MWR.

## Lịch sử số lượng đã tổng hợp

29 dòng chứng khoán sau loại trùng. Kỳ 01/05–26/10/2026 có đúng 16 dòng: tăng 800, giảm 255, ròng +545, khớp tổng trên ảnh. Ngày cột phải là ngày ghi sổ hiển thị; ngày mua/bán lấy riêng trong mô tả, không mặc định ngày cột phải là ngày khớp lệnh hay ngày hiệu lực pháp lý.

|Sự kiện WFT → thông thường|Ngày ghi sổ trên ảnh|Số lượng đối ứng|
|---|---|---:|
|TPB|27/11/2025|−5 / +5|
|HPG|15/07/2026|−10 / +10|
|VHM|09/09/2026|−100 / +100|
|SSI|01/10/2026|−40 / +40|

Các cặp chuyển bucket có net quantity 0, không tính thành mua mới hay dòng tiền. Đây là ngày ghi sổ của broker; không tự cấp quyền corporate-action/identity hoặc suy ngày pháp lý. Giá trị pending trước chuyển phải có chính sách riêng, không được đếm hai lần hoặc định giá 0.

Các sự kiện cộng dồn giải thích đủ số lượng của 11 dòng thường trong sao kê 07/10, kể cả FPT 200, SSI 240, VHM 200, HPG 110, GAS 200. TPB từng có 105 và đã bán hết 03–04/08/2026 nên lịch sử NAV phải gồm TPB dù không còn trong 11 holdings hiện tại.

**Chênh lệch chưa giải thích: FPT_WFT 20** có trong sao kê PDF nhưng không có dòng tạo/chuyển trong bộ ảnh được xác nhận đầy đủ. Không tự thêm sự kiện hoặc áp dụng ngày chuyển của SSI/VHM/HPG cho FPT. Owner xác nhận eventual conversion nhưng ngày vẫn UNKNOWN. Ledger FPT 220 là tổng exposure opening, không phải proof đã giao dịch đủ 220.

## Giới hạn dữ liệu

- Ảnh chỉ có số lượng, không có giá khớp/tiền, phí, thuế, tiền vào/ra hoặc lịch sử receivable/payable/debt. Không thể suy cash từ số lượng hoặc giá đóng cửa.
- Một số năm ở cột ngày bị cắt; năm được xác định theo mô tả/ngữ cảnh bộ ảnh/filter và đánh dấu rõ trong SECURITIES_EVENTS.json, chưa là original export được xác minh.
- Số dư đầu kỳ các mã thường bằng 0 chỉ là kết quả suy ngược có điều kiện từ anchor 07/10 và xác nhận full history, không phải independently verified inception. FPT_WFT trước 07/10 là UNKNOWN.
- Giá lịch sử TCBS giữ lại bắt đầu khoảng 22/10/2025, thiếu giai đoạn đầu 07/2025; TPB không có trong capture full30. Adjustment/total-return semantics chưa qualify, không được nhân âm thầm với holdings chưa điều chỉnh.
- Chênh lệch cash scope 70.000 và vay 105 giữa sao kê/ledger cũ còn chưa giải thích; không mang sang chuỗi NAV như balancing plug.

## Bổ sung tối thiểu để tính chuỗi NAV

Cần sao kê tiền đầy đủ cùng kỳ hoặc daily cash/receivable/payable/debt, số dư đầu kỳ đối chiếu được, trade confirmation có giá/tiền/phí/thuế, evidence FPT_WFT và giá lịch sử có adjustment/corporate-action semantics phù hợp cho cả mã đã bán TPB. Sau đó mới dựng chuỗi ngày có NAV và hiệu suất. Không cần yêu cầu thêm các giao dịch chứng khoán đã có, chỉ cần giải thích ngoại lệ FPT và bổ sung các thành phần tài chính còn thiếu.

Kết quả số lượng, WFT transfers và nguồn được lưu ở SECURITIES_EVENTS.json/HISTORICAL_HOLDINGS_TIMELINE.json; Historical NAV ở HISTORICAL_NAV.json. No source approval, accepted mapping, production import, scoring or NAV activation.
