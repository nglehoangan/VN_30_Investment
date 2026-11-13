# VNM S2 — CLOSED

**S2 CLOSED tại cutoff gốc30/10/2026**, trong phạm vi khoảng trống phân tích thanh khoản12tháng từ dữ liệu công khai công ty mẹ. Không đổi cutoff sang30/09, không bỏ cổ tức công bố28/10, không tạo source admission hay điểm scoring.

## Sửa đúng điều kiện acceptance

Kết luận BLOCKING cũ yêu cầu mô hình giữ nguyên toàn bộ2.286,77tỷ tiền báo cáo làm tiền không được chạm tới, ngoài nhu cầu vận hành đã stress. Không có bằng chứng công bố về mức dự trữ bắt buộc này, cũng không có điều khoản M3 biến nó thành tiêu chí bắt buộc. Đây là stress bổ sung; không được dùng thất bại của riêng nó để tự tạo data gap. Nhu cầu vận hành âm, khóa vốn lưu động và các khoản chi đã được tài trợ trong core scenario; không bỏ các dòng đó khi phân loại lại.

METRIC_DEFINITIONS §5.2 cho phép so nguồn thanh khoản với nghĩa vụ12tháng; §5.3 yêu cầu severe plausible stress, không yêu cầu đồng thời mọi lớp dự phòng tùy ý; §13.1 và SCORING_MODEL §13.4 cho phép khoảng/N/R theo materiality. CA-DIST §10.2 vẫn cần resilience, nhưng không tự cho1điểm từ tỷ lệ thanh khoản. Mọi nghi vấn thực tế về hạn chế tiền hay nghĩa vụ mới vẫn phải đánh giá lại nếu có bằng chứng; không suy ra tiền gửi chắc chắn tự do từ việc không có ghi chú.

## Bằng chứng và kết quả giữ nguyên

- BCTC riêng Q3: tiền2.286,770tỷ; đầu tư ngắn hạn17.939,270tỷ; vay ngắn hạn8.258,858tỷ. Không dùng cash hợp nhất/CFO hợp nhất.
- Core stress: doanh thu−15/−25%, giảm biên2/3điểm%, khóa thêm10/20% tồn kho, lãi+2điểm%; khoản đệm tiền gửi theo giảm ròng lịch sử tới2.180tỷ, đầu tư/thuê1.208,455tỷ.
- Cộng cổ tức mới5.224,889tỷ, cổ tức cũ8,402tỷ, borrowing accrual109,677tỷ và chi phí lãi tương lai riêng. Không cộng lại cổ tức đã trả, không trừ toàn bộ nợ vận hành lần nữa ngoài CFO.
- Không ghi nhận CFO tương lai dương là nguồn chắc chắn; CFO stress âm cộng vào nhu cầu. Không giả định bán tài sản, phát hành khẩn cấp hoặc nguồn vay mới.
- **Tất cả6 core cases tại cutoff30/10 đều đủ; dư thấp nhất1,905.201tỷ.** Đây là cash headroom sau chi trong mô hình, không phải fair value hay tiền chắc chắn hiện có tháng11.
- **Giữ nguyên stress bổ sung giữ toàn bộ tiền báo cáo: trường hợp thấp nhất-381.569tỷ.** Không xóa kịch bản bất lợi. Nó hạn chế confidence/kết luận mức cao nhất, không chứng minh default hay một mức minimum cash chưa được công bố.

Các con số, nguồn và công thức FINAL_S2_CALCULATIONS.json không sửa. Không chọn tỷ lệ100% tiền gửi để đạt: trục runoff2.180tỷ vẫn được kiểm tra đầy đủ. Các thước lịch sử và allowance là giả định nghiên cứu có nguồn, không giả mạo thành điều khoản hợp đồng hoặc hard bounds.

## Đối chiếu M3 và N/R

S2_CLOSURE_ACCEPTANCE.json có đối chiếu đầy đủ7nhóm: FH-LIQ-01/02/03/04, FH-STRESS-01, CA-DIST-01 và missing-data/confidence. Nguồn/nghĩa vụ/bucket và core stress đủ cho kết luận S2 có giới hạn. Exact intra-period matching, covenant headroom, normalized parent interest score, phân bổ retention/buyback và điểm CA-DIST đầy đủ vẫn N/R/unscored. Chúng không thành blanket S2 source-data blocker; không tự gán điểm0/midpoint hoặc max score.

**Không còn blocker vật chất riêng S2 được xác định trong phạm vi này; không cần người dùng cung cấp thêm dữ liệu.** Đây là đóng issue phân tích, không chứng nhận thanh khoản chắc chắn mọi ngày/mọi tình huống, toàn bộ scoring hay production. S1 và các S4 đã đóng, F1/F2 approvals, VNM17 pending, M3/M4, holdings/NAV/source evidence không đổi. S2_CLOSED_ISSUE_REGISTER.md là register kế nhiệm; bản BLOCKING trước đây được giữ nguyên lịch sử.
