Ticker | Previous status | New status | Remaining blocker
--- | --- | --- | ---
VNM | DEFERRED (Oct17); partial debt (Oct19) | LEVEL1_PROMOTION_CANDIDATE | Không còn blocker Level-1 theo REPORTED_BORROWINGS; chưa tuyên bố chứng minh comprehensive debt.
TCX | DEFERRED (Oct17); sufficient (Oct19) | LEVEL1_PROMOTION_CANDIDATE | Không còn theo ngoại lệ phân loại Két Vàng đã được chủ dự án phê duyệt; hợp đồng pháp lý không được chứng minh mới.
MBB | DEFERRED | DEFERRED_CANDIDATE | Thiếu CAR hoặc CET1 hợp nhất, có framework và nguồn chính thức, áp dụng rõ tại 30/06/2026.
VIB | DEFERRED (Oct17); sufficient (Oct19) | LEVEL1_PROMOTION_CANDIDATE | Không còn blocker bắt buộc. Công thức issuer của NPL 2,10% vẫn chưa được chứng minh; đây là SUPPORTING.
VIC | DEFERRED (Oct17); sufficient (Oct19) | LEVEL1_PROMOTION_CANDIDATE | Không còn; bản gốc hợp nhất soát xét và provenance bền vững đủ. LC giữ ghi chú ngoài reported borrowings.

PREVIOUSLY_CLOSED_TICKERS: **25/25 remain Level-1 valid**.

NEW_CRITICAL_GAPS: **0**. NEW_MAJOR_GAPS: **0**.

LEVEL1_PROMOTION_CANDIDATES: **VNM, TCX, VIB, VIC** (so với mốc 25/5; chưa cập nhật production).

STILL_DEFERRED: **MBB**.

CANDIDATE_PARTITION: **30 = 29 CLOSED + 1 DEFERRED**.

Bộ được kiểm tra là `data/combine/manifest.json` và 30 shard `vn30-combine-v1`, hash cụ thể trong DATASET_IDENTITY.json. Manifest không ghi generation timestamp; chỉ có thời điểm sửa file, được ghi riêng và không giả làm thời điểm sinh dữ liệu. Đây là presentation chưa được duyệt, không phải tập canonical mới tự động thay thế dữ liệu đã xác thực. Annual FY2022–25 và YTD 01/01–30/06/2026 tạo 150 mục tiêu kỳ theo hợp đồng hiện hành.

Toàn bộ nhóm bắt buộc được đánh giá trong ALL30_LEVEL1_REVALIDATION.json. Đối chiếu canonical cũ/current cho 25 mã không phát hiện thay đổi giá trị, kỳ, scope, đơn vị, dấu hoặc nguồn. HPG giữ con đường chứng nhận structured đã được hợp đồng cho phép và các observation validation được chấp thuận; không áp đặt lại cờ qualified thủ công lên schema đó. Source PDF mới không được tải lại cho mọi fact lịch sử; các nhóm dựa vào qualification bền vững được đếm riêng trong PROVENANCE_REVIEW.json. Việc chưa tái kiểm ảnh toàn bộ không được mô tả thành kiểm chứng ảnh toàn bộ.

VNM: bảng cân đối và thuyết minh 15/17/18, chính sách thuê và cam kết đã được kiểm tra. Tổng short+noncurrent lần lượt 9.273.339.009.700;9.456.644.558.142;8.454.871.876.837VND. Sáu rollforward và ba đẳng thức bảng cân đối khớp chính xác. Không lấy dòng phân loại lại làm số dư đến hạn cuối kỳ. Khoản đến hạn đã nằm trong short, số tiền tách riêng vẫn null. Đây là chứng minh phạm vi **reported borrowing** theo lựa chọn Level-1 được duyệt. Chưa chứng minh comprehensive debt: tính chất tài trợ có lãi của phần phải trả khác 82.293.267.804;81.170.549.316;76.949.919.753VND chưa được thuyết minh rõ; không tự nhận chúng bằng 0 hay tự cộng vào vay. Không có khoản tài trợ được nhận diện rõ đang bị bỏ khỏi reported survey. Vì hợp đồng cho phép REPORTED_BORROWINGS, bất định comprehensive này không được nâng thành yêu cầu Level-1.

TCX: thuyết minh18 xác nhận 5.284.485.167.173VND là khoản phải trả nhà đầu tư nhận quản lý theo Két Vàng. Bản thân nguồn chưa chứng minh quyền sở hữu kinh tế, hoàn trả gốc được bảo đảm hay nghĩa vụ lãi cố định. Kết luận INCLUDE dựa trên quyết định cụ thể ngày 19/10 của chủ dự án, giữ nguyên phạm vi miễn chứng minh thêm; không biến quyết định đó thành dữ kiện hợp đồng mới. Tổng được chấp nhận là 13.864.719.712.130VND; Két Vàng cộng đúng một lần.

MBB: prospectus trang vật lý 62/101 đặt CAR 10,73% trong cột 30/06 nhưng chú thích rõ dữ liệu 31/03/2026. Trang 102 có CAR riêng lẻ 10,85% cũng 31/03. Chúng không đủ điều kiện. Cần đúng **CAR hoặc CET1 hợp nhất tại 30/06/2026**; không bắt buộc cả hai. Giữ cửa sổ kiểm tra tháng 11–12 theo yêu cầu chủ dự án; chưa khẳng định lịch này là thời hạn công bố pháp định hay rằng không có nguồn ở mọi nơi.

VIB: tải lại PDF công bố chính thức vào `sources/` của gói review, hash trùng nguồn đã kiểm trước. Trang 1/4/5 xác nhận ngày 30/06/2026, scope VIB + VIB AMC và CAR hợp nhất 11,8%; riêng lẻ 11,6%. NPL nhóm 3 + 4 + 5 = 11.616.907 triệu VND; chia gross customer loans 397.083.447 ra 2,925558%, chia tổng classified credit-risk exposure 553.320.031 ra 2,099491% (làm tròn 2,10%). Đây là hai phép tính có quần thể khác nhau; không có dòng xác định công thức headline của issuer. Không dùng tổng tài sản bảng cân đối làm mẫu số. Giữ quyết định phân tích của chủ dự án và chưa nối hai khái niệm thành một chuỗi. NPL là SUPPORTING nên bất định này không chặn Level-1.

VIC: bản gốc 132 trang, hash 0114befc…, trang 7–8 xác nhận EY soát xét hợp nhất 6M2026, kết luận không điều chỉnh ngày 29/08/2026. Các identity và subtotal vay khớp. LC 57.110 triệu VND ở thuyết minh 25 giữ ngoài reported borrowings theo quyết định đã duyệt. Không đòi thư mục OCR/readers tạm.

Hash kiểm tra toàn bộ data trước/sau không đổi; không sửa canonical, blocker, disposition, Policy B, DI14/DI15 hay scoring eligibility. Không chạy scoring/market data/xếp hạng/định giá. Các khác biệt OCR/API chưa xác thực vẫn trong review queue, phân loại UNKNOWN khi thiếu chiều so sánh; không gọi chúng là restatement hay provider error chỉ vì khớp/khác số tiền.

Dừng tại gói đề xuất. Chờ **Review Consolidated Financial Final Revalidation**.
