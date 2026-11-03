# VIC — cầu nối RNAV/SOTP từ nguồn VIC

**Đã mở rộng từ cầu nối sổ sách sang đối chiếu từng tài sản, nghĩa vụ và quyền cổ đông. Chưa nghiệm thu RNAV/giá trị cổ phần VIC vì còn thiếu đầu vào kinh tế trọng yếu.** Không đặt giá trị chưa biết bằng giá sổ sách hoặc 0 để đạt PASS. Không dùng nguồn phân tích chứng khoán bên thứ ba hoặc yêu cầu báo cáo VinFast.

## Nguồn mới đã tự tìm và kiểm tra

Tra cứu Vietstock theo **năm tài liệu 2025**, thay vì chỉ năm 2026, thu được 37 mục trên hai trang. Tải thành công HTTP200:

- Báo cáo thường niên VIC FY2025, tài liệu 540899, 168 trang; SHA-256 `e329d905fcdc010393d90f2473cfcdfb8af44a92dfcf4b6f12281a79495e5eef`.
- Công bố điều chỉnh dự án Hạ Long Xanh, tài liệu 521784, 2 trang, ký 17/10/2025; SHA-256 `40f93cb3991a8b09b479e883f2cebb4a87d2ff8d4e79448075c6f5fd32fb1bfb`.

Giữ nguyên PDF, response listing JSON và receipt/hash/JSON Pointer trong `acquisition-manifest.json`. Listing lưu ở dạng JSON đã parse/định dạng lại bởi capture hiện hành; hash listing không được gọi là hash nguyên văn HTTP response. PDF giữ bytes tải về. Vietstock là bản mirror; không tự được source admission. Đã tìm text 168 trang thường niên để định vị; chỉ các trang được ghi review mới được tuyên bố kiểm tra toàn ảnh. Không tạo lại OCR readers đã xóa.

Các phép tính cố định ngày định giá **31/12/2025**, xem xét dưới góc nghiên cứu hiện tại AS_REVISED; không phải RNAV hiện tại tháng 11/2026 và không phải AS_KNOWN tại cuối 2025. Báo cáo quý 3/2026 đã giữ trong repo không bị trộn vào mô hình FY2025. Không dùng giá hiện tại với mẫu số cũ.

## 1. Giá trị kinh tế đã tìm được

**VRE là ngoại lệ có giá trị hợp lý công bố rõ**, không phải mọi khoản đầu tư đều thiếu fair value:

| Khoản đầu tư VRE do nhóm nắm giữ, trang vật lý 57 BCTC VIC | Triệu VND |
|---|---:|
| Giá trị ghi sổ | 9.094.520 |
| Giá trị hợp lý của khoản đầu tư | 14.392.613 |
| Chênh đánh giá lại gộp | **5.298.093** |

Giá trị này đã là giá trị khoản nắm giữ; không nhân tỷ lệ sở hữu lần thứ hai. Chênh này chưa phải phần tăng giá trị sau thuế thuộc cổ đông thường VIC. Khoản ưu đãi Novatech ở trang 44 có cả giá gốc và fair value công bố cùng 1.583.614 triệu: chênh gộp 0 được đọc từ nguồn, không mặc định mọi tài sản thiếu fair value có chênh 0. Giá trị fair được công bố không tự chứng minh giá thanh lý hoặc appraisal độc lập.

Cầu nối hợp nhất minh họa chỉ thêm chênh VRE vào vốn sổ sách: 151.488.935 + 5.298.093 = **156.787.028 triệu VND**, trước mọi điều chỉnh còn thiếu. Chỉ tiêu này **không phải RNAV được nghiệm thu**, không chia thành giá mục tiêu/cổ phần.

## 2. Tài sản và dự án: xác định rõ phần chưa thể định giá

- Trang 54: BĐS đầu tư ghi sổ **19.353.620 triệu**, VIC nêu chưa đủ thông tin xác định giá trị hợp lý.
- Trang 57: đầu tư liên kết/liên doanh **10.437.972 triệu**, trong đó VRE 9.094.520 triệu. Các khoản khác 1.343.452 triệu chưa có fair value theo chú thích.
- Trang 58–59: đầu tư khác giá gốc 30.521.035 trừ dự phòng 3.339.307 = **27.181.728 triệu**, các fair value tương ứng chưa xác định.
- Tổng ba nhóm sổ sách có fair value chưa đủ ở trên là **47.878.800 triệu**. Đây là quy mô tài sản chưa có đầu vào định giá, không phải khoảng sai số RNAV và không phải khoản phải trừ toàn bộ.
- Trang 55: CIP tổng **131.774.981 triệu**; ba nhóm lớn nêu tên: Khu đô thị Đại học Quốc tế 20.004.316, dự án xe điện 19.002.058, Vinhomes City Royal 15.369.349 triệu. Phần còn lại **77.399.258 triệu** chưa được tách đầy đủ theo dự án trong bảng chỉ liệt kê khoản trên 10%.
- Hạ Long Xanh: công bố VIC cho biết khoảng **4.119,23 ha**, tổng mức đầu tư **456.639 tỷ**. Đây là quy mô/ngân sách dự án, không phải giá trị kinh tế còn lại hoặc chi phí còn phải chi tại 31/12/2025.

Thường niên trang 77 bổ sung doanh số Vinhomes 205,3 nghìn tỷ và doanh số chưa bàn giao 186,4 nghìn tỷ. Số tổng này không chứa lịch thu tiền và toàn bộ chi phí/thuế còn lại theo dự án, nên chưa thể tính NPV. Không nhân một biên lợi nhuận tự chọn. Cùng số 183,1 nghìn tỷ xuất hiện với caption bán hàng ở trang 10 và doanh thu bao gồm BCC ở trang 77; giữ hai caption, không ép mapping vì bằng số.

Đã triển khai hàm preview NPV theo lịch thu/chi sau thuế dự án và giả định chiết khấu tường minh, kiểm tra kỳ tương lai, trùng kỳ và nguồn giả định. Tỷ lệ vốn hóa chi phí đi vay **11,46%** ở VIC không được tự biến thành WACC dự án. Hiện không dự án thực tế nào có đủ lịch dòng tiền để đưa qua NPV; các phép tính synthetic chỉ kiểm tra công thức, không được gán làm dự báo VIC.

## 3. Tiền, nợ và nghĩa vụ: đã tách để tránh trừ trùng

**Tiền/deposit**: 73.542.242 + 8.254.830 + 368.150 = **82.165.222 triệu VND**. Ba nhóm hạn chế/thế chấp được công bố riêng: tiền 1.316 tỷ, deposit ngắn 5.371 tỷ, deposit dài 349 tỷ. Trừ danh nghĩa cho số còn lại 75.129,222 tỷ, nhưng chưa phải qualified cash: kinh phí bảo trì phải trả cho ban quản trị chưa được định lượng và chưa rõ giao với nhóm hạn chế; các khoản hạn chế công bố theo tỷ làm tròn. Không gọi kết quả này là cận chính xác hoặc tiền sẵn sàng chia cổ đông.

**Nợ**: 114.000.484 vay/thuê ngắn + 221.419.341 vay/thuê dài + 3.081.207 trái phiếu hoán đổi dài = **338.501.032 triệu**, khớp số quản trị làm tròn 338.501 tỷ. Không cộng lại các trái phiếu đã nằm trong dòng vay/thuê.

**Dự phòng**: 10.297.056 ngắn + 20.377.278 dài = **30.674.334 triệu**, đã nằm trong tổng nợ 967.133.690 triệu. Không trừ thêm vào net assets. Thế chấp hàng tồn kho/CIP/BĐS đầu tư cũng không tự là một khoản nợ bổ sung.

**Cam kết tách riêng**: đặt cọc dự án 81.524 tỷ; hợp tác dự án 16.260 tỷ; mua cổ phần 5.050 tỷ; xây dựng/phát triển 145.116 tỷ; tiền đất thông báo sau cuối năm 21.197 tỷ; tiền thuê hoạt động tối thiểu 27.774.301 triệu chưa chiết khấu. Không cộng tất cả vào nợ hoặc trừ sau khi forecast đã gồm cùng chi phí. Bảo lãnh, hỗ trợ lãi vay khách hàng, cam kết lợi nhuận khách sạn và bồi thường nhà cung cấp còn phần không định lượng/final. Không gán 0.

Hàm `incremental_obligation` chặn khoản đã có trong nợ sổ sách hoặc dòng tiền dự án; chỉ nhận phần tăng thêm có bằng chứng, sau rà phạm vi/overlap.

## 4. Quyền cổ đông: sổ sách đã khép, quyền kinh tế còn thiếu

Trang 12: vốn hợp nhất 151.488.935 trừ NCI sổ sách 3.922.593 = **147.566.342 triệu vốn sổ sách thuộc mẹ**. Cổ phiếu ưu đãi mang giá trị sổ sách 274.609 triệu; cổ phiếu quỹ đã được trừ trong vốn. Không trừ quỹ lần nữa, không coi mệnh giá ưu đãi là giá mua lại/thanh lý thực tế. NCI sổ sách không đại diện phần NCI trong giá trị tăng của từng tài sản.

Preview book-to-common-RNAV yêu cầu sáu nhóm điều chỉnh: tài sản hoạt động, danh mục tài chính, tiền khả dụng, nghĩa vụ tăng thêm, thuế đánh giá lại và quyền ưu đãi/cổ đông thường. Thiếu một nhóm hoặc thiếu phạm vi bao phủ thì không ra số common RNAV. Dùng coverage keys để chặn vừa cộng giá trị công ty con vừa cộng dự án/tài sản đã nằm trong công ty đó. Một preview đầy đủ cũng không tự cấp financial/production acceptance.

## 5. Điểm dừng cần đầu vào VIC, không yêu cầu VinFast

Đã thực hiện các đối chiếu có đủ nguồn, tự tìm thêm tài liệu VIC và triển khai đường tính/validator. Để chốt RNAV, cần **phụ lục tài chính/định giá theo dự án hoặc RNAV/SOTP do VIC cung cấp/công bố**, gồm thu tiền, chi phí xây dựng/đất/bán hàng/thuế còn lại, thời điểm, quyền đối tác/NCI và nợ đã tính trong từng dự án; đồng thời khép tiền bảo trì và nghĩa vụ ngoài sổ/overlap. Appraisal có ngày/phạm vi/quyền/nợ/thuế rõ có thể thay dựng NPV cho tài sản tương ứng. Không bắt buộc thêm báo cáo VinFast hoặc nguồn định giá chứng khoán bên thứ ba.

Danh sách tối thiểu theo từng trường: `vic-input-request.json`. Đây là đầu vào kinh tế còn thiếu, không phải xin chủ sở hữu xác nhận lại các số báo cáo đã đọc. Nếu các báo cáo VIC hiện có không công bố các trường này thì không thể suy ra bằng số sổ sách, tổng mức đầu tư, backlog hay haircut tùy ý. Chưa chứng minh rằng mọi nguồn công khai đều không có; kết luận thiếu dữ liệu được giới hạn ở nguồn/định vị đã giữ trong manifest.

Quyết định vẫn **BLOCKED_MATERIAL_ECONOMIC_INPUTS**. Không có accepted RNAV/common equity value/value per share. Không đổi tiêu chí/trọng số. Không activation NAV/scoring/trading, sửa DB, WP2, push hoặc merge. Closure matrix 9 nhóm và snapshot có phiên bản ở `closure-matrix.json`/`decision.json`; chi tiết lệnh kiểm tra ở `validation.json`.
