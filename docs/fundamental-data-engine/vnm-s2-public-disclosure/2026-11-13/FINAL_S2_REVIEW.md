# S2 — chốt kịch bản, hợp đồng M3 và acceptance

**S2 tại cutoff gốc30/10/2026: BLOCKING.** Không còn yêu cầu bắt buộc ngày đáo hạn từng sổ hay hợp đồng nội bộ. Chưa đóng vì kết luận sau nghị quyết cổ tức còn phụ thuộc mức tiền mặt giữ cho vận hành trong dải stress, không phải vì thiếu chi tiết công bố.

## 1. Dải bảo thủ được chọn và lý do

- Số dư/luồng tiền cùng phạm vi công ty mẹ, BCTC riêng Q3. Không chọn tỷ lệ100% để đạt.
- Khoản đệm tiền gửi từ0 đến**2,180.000 tỷ**: mức giảm ròng16.380 so với18.560tỷ của cặp so sánhFY2025/FY2024 cùng vintage. Đây là thước stress từ lịch sử, không phải bằng chứng bị phong tỏa, hạn chế tối đa hay phần chắc chắn khả dụng.
- Khoản tiền giữ cho vận hành từ0 đến toàn bộ tiền báo cáo**2,286.770 tỷ**. Đầu mút giữ toàn bộ là tình huống dự phòng nghiêm khắc; không khẳng định doanh nghiệp bắt buộc phải giữ từng ấy. Không dùng số dư H1 cao trước đợt cổ tức làm “cash minimum” được xác nhận.
- Ngân sách đầu tư**1,072.648 tỷ** = max(chi tiền mua tài sảnFY2025;9tháng2026×4/3), thay nhân tùy ý cam kết cũ2lần. Cộng contingency thuê tăng thêm**135.807 tỷ**, không trừ thuê thông thường đã nằm trong CFO lần nữa. Tổng allowance**1,208.455 tỷ** là giả định chi trong năm, không phải số hợp đồng còn lại hay upper bound đã xác minh.
- Giữ stress M3 doanh thu−15/−25%, giảm biên2/3điểm%, khóa thêm10/20% tồn kho, lãi+2điểm%. **Không ghi nhận CFO tương lai dương là nguồn chắc chắn**; nếu CFO stress âm, cộng vào nhu cầu tiền. Lãi đi vay đã dồn tích109,677tỷ tại30/09 (BCTC riêng trang41) cộng riêng với chi phí tài trợ tương lai; không cộng toàn bộ chi phí phải trả vào CFO lần nữa. Không giả định phát hành khẩn cấp, bán tài sản hay tái cấp vốn để đạt.

Chọn các trục từ nguồn/quy tắc trên trước khi lấy min kết quả trên toàn bộ24 tổ hợp. Không bỏ đầu mút bất lợi. Các thước lịch sử không được giả vờ là giới hạn có xác suất hoặc đầy đủ mọi trạng thái tương lai.

## 2. Kết quả theo ngày và phạm vi

| Phạm vi | Dư/(thiếu) thấp nhất trong dải, tỷ | Kết luận |
| --- | ---: | --- |
|30/09/Q3, chưa có cổ tức mới28/10|4,843.320|Đủ trong dải phân tích12tháng; không chứng nhận thanh toán từng ngày|
|Cutoff gốc30/10, đã có cổ tức mới5.224,889tỷ|-381.569|Không đứng vững trên toàn dải; S2 gốc chưa CLOSED|

Trong stress−25%, đã dự phòng giảm tiền gửi2.180tỷ và allowance1.208,455tỷ, nếu dùng tiền báo cáo cho thanh toán thì còn dư**1,905.201 tỷ**; nếu giữ toàn bộ tiền đó cho vận hành thì thiếu**381.569 tỷ**. Giải phóng khoảng**16.69%** số tiền báo cáo, hoặc đáp ứng bằng điều chỉnh funding/cash need có căn cứ, sẽ đổi dấu trường hợp biên. Đây là phụ thuộc kinh tế cần đánh giá; không kết luận doanh nghiệp thực tế thiếu tiền hay cần distressed financing.

Không dịch cutoff sang30/09 để tuyên bố đóng vấn đề30/10. Số dư30/09 và cổ tức mới giữ ngày riêng; không tự giả lập actual cash rollforward tháng10.

## 3. Đối chiếu đầy đủ M3

S2_M3_CONTRACT_REVIEW.json đối chiếu FH-LIQ-01/02/03/04 và topics obligations/liquidity/maturities/covenants; FH-STRESS scenario/funding_response/capital_response; CA-DIST retention/distribution/buyback_valuation/resilience; missing-data/confidence. FH-LIQ có các quan sát/bucket nguồn công khai; covenant/sub-year và normalized parent interest metric còn N/R. Không chuyển reported EBIT coverage thành normalized score. FH-STRESS đã tính kịch bản nhưng funding response sau cổ tức nhạy; không đủ khẳng định robust survival/max score. CA-DIST chỉ có phần thanh khoản của nghĩa vụ cổ tức được kiểm tra; hiệu quả giữ/chia vốn và buyback valuation không được suy ra, còn unscored/N/R ở rubric riêng. Không tự gán điểm0/midpoint hoặc đổi weights.

## Acceptance cuối

S2_FINAL_ACCEPTANCE.json giữ đúng một blocker kinh tế: **S2_POST_DECLARATION_CASH_BUFFER_DEPENDENCE**. Không phải yêu cầu ngày đáo hạn từng sổ, xác nhận lại số dư hay chuyển UNKNOWN thành RESTRICTED. Không yêu cầu tài liệu mới từ người dùng hoặc xin phê duyệt lại chính sách. Chấp thuận mô hình không tự tạo khả năng thanh toán; nếu chưa có funding response/operating cash buffer được hỗ trợ để vượt trường hợp biên, giữ kết luận stress có giới hạn/N/R. S1/F1/F2/S4, danh mục/NAV, source authority và production không đổi.
