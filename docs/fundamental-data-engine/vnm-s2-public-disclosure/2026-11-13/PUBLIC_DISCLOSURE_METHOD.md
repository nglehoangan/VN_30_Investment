# VNM S2 — đánh giá theo dữ liệu công bố

Đã thay yêu cầu hợp đồng nội bộ bằng đánh giá12tháng theo BCTC công khai. Không bắt buộc ngày đáo hạn từng sổ, điều khoản xử lý rút tiền hoặc lịch chi theo tháng để hoàn thành nghiên cứu thanh khoản. Dùng thuyết minh năm/bán niên khi có; không mặc định mọi báo cáo đều có bảng kỳ hạn hay mọi thông tin hợp đồng không bao giờ được công bố.

## Cách áp dụng

1. Lấy số dư quý mới nhất, cùng phạm vi công ty mẹ. Tiền2.286,770 tỷ; đầu tư ngắn hạn17.939,270 tỷ; vay ngắn hạn8.258,858 tỷ. Số dư là quan sát BCTC, không phải giả định mô hình.
2. Thông tin hạn chế sử dụng đã công bố được trừ khi có. Nếu chưa công bố, giữ trường thực tế UNKNOWN nhưng chạy dải khả năng tiếp cận100/75/50/0% của tiền gửi trong12tháng. Đây là kịch bản, không nâng thành CONFIRMED_AVAILABLE và không mặc định bị phong tỏa. Tỷ lệ100% theo phân loại ngắn hạn không chứng minh mọi khoản đến hạn trước26/11.
3. Dùng bucket nợ ngắn hạn12tháng; ngày26/11 chỉ áp dụng cổ tức mới5.224,889 tỷ. Cổ tức cũ8,402 tỷ và lãi tài trợ xét riêng. Đối chiếu30/09 tách với overlay nghị quyết28/10; không gọi dòng tiền30/09 là tiền đang có trong tháng11.
4. CFO TTM công ty mẹ là lịch sử/rate sensitivity, không phải số dư tiền hay nguồn đảm bảo. Stress doanh thu−15/−25%, giảm biên2/3điểm%, khóa thêm10/20% tồn kho, lãi suất+2điểm%; không cấp lợi ích giảm thuế hoặc cắt chi phí. Quy mô hoạt động9tháng×4/3 chỉ là trục annual stress, không dự báo tăng trưởng.
5. Cam kết thuê1năm và vốn đã ký cuối2025 tổng531,611 tỷ làm thước quy mô; thử khoản đệm0/1/2lần. Không gọi khoản đệm này là số còn phải trả hiện tại hoặc giới hạn trên đã được chứng minh. Thông tin bán niên/quý mới được kiểm tra để cập nhật khi có; không mặc định số cũ không đổi hoặc bằng0.
6. Chấm mức chắc chắn/giới hạn theo METRIC_DEFINITIONS §§5.2–5.3,13.1 và SCORING_MODEL §13.4; giữ N/R cho kiểm tra trong từng tháng hoặc covenant chưa có. Không tạo điểm0/midpoint, không tự cấp điểm cao chỉ từ một tỷ lệ.

## Kết quả tham chiếu

Kịch bản stress−25%, khoản đệm2lần531,611tỷ, cùng dòng tiền/vay/cổ tức công ty mẹ:

| Phần tiền gửi tham gia nguồn12tháng — giả định | Dư/(thiếu), tỷ đồng |
| --- | ---: |
| 100% | 4,340.110 |
| 75% | -144.707 |
| 50% | -4,629.525 |
| 0% | -13,599.160 |

Điểm hòa vốn **75.81%** trong bộ giả định này. Đây là ngưỡng độ nhạy, không phải tỷ lệ tiền thực tế đã xác nhận. Full-access case dư khoảng4.340tỷ;75% access thiếu khoảng145tỷ. Vì vậy không chọn full-access case để tự chứng nhận stress hoàn toàn vững chắc. Không có kết luận doanh nghiệp mất khả năng chi trả.

## Disposition

**Nghiên cứu theo dữ liệu công bố đã hoàn thành có giới hạn.** Bỏ yêu cầu bắt buộc các tài liệu nội bộ; không yêu cầu người dùng cung cấp lại báo cáo hoặc xác nhận điều khoản hợp đồng. Các UNKNOWN thực tế được giữ, tác động đi vào độ nhạy và confidence. Quyền truy cập tiền gửi/quy mô cam kết không bị biến thành sự thật qua giả định.

Chưa tuyên bố formalS2CLOSED hay cấp điểm FH-LIQ/FH-STRESS/CA-DIST từ mô hình này: kết quả còn nhạy với tỷ lệ tiếp cận tiền gửi và khoản đệm cam kết. Đây là giới hạn của kết luận, không phải yêu cầu tái mở source approval hoặc lấy hợp đồng riêng tư. Khi có công bố năm/bán niên mới, cập nhật đúng các trường công bố đó rồi chạy lại; không đòi bảng kỳ hạn không tồn tại. S1 và các S4 đã đóng giữ nguyên. Không portfolio/NAV, M3 weights, source authority hoặc production activation.
