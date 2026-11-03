# VIC — phương án chỉ dùng báo cáo VIC, thay phương pháp định giá

Chỉ đạo mới nhất của chủ sở hữu: không tiếp tục yêu cầu thông tin VinFast; chỉ bám báo cáo VIC và tìm hướng thay thế. Gói này thay yêu cầu tài liệu đang chờ trong `vic-owner-report-closure-v1` cho phạm vi công việc hiện tại. Không xóa lịch sử nghiên cứu hoặc nguồn đã nhận, không dùng dữ kiện VinFast/SEC trong phép tính mới.

**Kết quả: đối chiếu dữ liệu báo cáo VIC đạt trong phạm vi số đã công bố; loại phương pháp định giá dựa trên P/E/EPS hiện tại. Chưa nghiệm thu lợi nhuận chuẩn hóa thuộc cổ đông hoặc giá trị đầu tư VIC.** Không đổi tiêu chí/trọng số để biến việc thiếu dữ liệu thành đạt tài chính. Review bởi AI theo ủy quyền chủ sở hữu, không phải independent/production acceptance.

## Phương án thay thế đã thực hiện

VIC được phân tích qua báo cáo hợp nhất và bộ phận kinh doanh. Lợi nhuận công bố dùng để đánh giá chất lượng thu nhập; không chọn làm lợi nhuận bền vững để nhân P/E. Thuế/NCI chưa xác định giữ `null`, không dùng làm toán hạng định giá. Không đặt lợi nhuận bằng 0 hoặc âm bằng cách gán toàn bộ điều chỉnh hợp nhất cho cổ đông VIC.

Chỉ dùng báo cáo hợp nhất VIC FY2025 đã kiểm toán, pin PDF `5ed3c75eb96aa1292f9b15a34419d658de13cc93300fcd878edaeb93bd347217`. Tái sử dụng các trang đã kiểm tra ảnh trong các gói VIC trước; chép bổ sung các cột tài sản/nợ từ cùng ảnh đầy đủ trang 106. Không tuyên bố kiểm tra ảnh mới trong lần này. `inputs.json` giữ đầy đủ source/page/hash/review. Báo cáo riêng VinFast không tham gia kết quả dù được giữ làm lịch sử.

| Phần phân tích | Kết luận trong phạm vi này |
|---|---|
| Số báo cáo VIC, đối chiếu nguồn | PASS_RECONCILED_AS_REPORTED_ONLY |
| Phương pháp P/E/EPS | EXCLUDE_PE_AND_EPS_BASED_VALUATION |
| Tài sản/nợ theo bộ phận | Đã đối chiếu ở giá trị sổ sách |
| RNAV/SOTP theo giá trị kinh tế | Chưa đủ đầu vào để nghiệm thu |
| Lợi nhuận chuẩn hóa thuộc cổ đông VIC | Chưa nghiệm thu, giữ null |
| Giá trị/cổ phần, scoring/NAV/giao dịch | Không cấp quyền |

## Cầu nối tài sản, không phải định giá

Đơn vị bảng: tỷ VND, số sổ sách tại 31/12/2025 theo thuyết minh VIC trang vật lý 106.

| Toán hạng | Giá trị |
|---|---:|
| Tài sản bộ phận sau loại trừ nội bộ | 1.037.204,451 |
| Tài sản không phân bổ | 81.418,174 |
| Tổng tài sản | 1.118.622,625 |
| Nợ phải trả bộ phận sau loại trừ nội bộ | 589.262,234 |
| Nợ phải trả không phân bổ | 377.871,456 |
| Tổng nợ phải trả | 967.133,690 |
| Tài sản trừ nợ phải trả hợp nhất | **151.488,935** |

Sáu bộ phận và các bút toán loại trừ đã cộng đúng; phần ròng trung tâm là −296.453,282 tỷ. Khoản 151.488,935 tỷ gồm quyền của NCI và cổ phần ưu đãi, chưa tách giá trị dành cho cổ đông phổ thông. Không lấy chia cổ phần làm RNAV; không cộng thêm giá trị sở hữu VHM/VPL/VinFast vào tài sản hợp nhất đã chứa các đơn vị này; không áp haircut tùy chọn hoặc coi giá sổ sách là giá thị trường.

Vì thế phương án tài sản loại được nhu cầu ước đoán thuế trên lợi nhuận Novatech để nhân P/E, nhưng vẫn cần các đầu vào kinh tế riêng: giá trị tài sản/dự án được VIC thuyết minh đủ cơ sở, tiền khả dụng/nợ/cam kết/loại trừ phù hợp và quyền cổ đông tại ngày định giá. Các đầu vào này chưa được chứng minh đủ trong gói hiện tại. Không lấp bằng một hệ số tự chọn.

Phép chẩn đoán lợi nhuận trước thuế sau loại tài trợ và lãi Novatech vẫn là −31.011,782 tỷ, không phải normalized common earnings. Giữ nguyên chi phí và không loại thêm lần nữa phí bản quyền. Kiểm tra lợi nhuận này là lý do loại P/E hiện tại, không tự suy ra định giá âm hoặc lệnh bán.

## Quyết định thực tế

Không còn yêu cầu chủ sở hữu cung cấp thêm báo cáo VinFast cho hướng này. Đã khép việc lựa chọn phương pháp: **dùng VIC-only để đối chiếu và đánh giá rủi ro; loại P/E/EPS khỏi định giá hiện tại**. Chưa có cơ sở ghi “VIC đã nghiệm thu tài chính đầy đủ”. Bỏ một phương pháp không tạo đủ đầu vào cho phương pháp khác. Giá trị RNAV, giá trị cổ đông phổ thông và giá trị/cổ phần tiếp tục null.

`decision.json` và manifest lưu snapshot kết quả có phiên bản. Không sửa runtime, bảng giá, dashboard, rubric, trọng số hoặc source authority. Không posting, kích hoạt NAV/scoring/trading, push hay merge.

## Kiểm chứng

- `python3 scripts/test-vic-reported-only-v2.py`: 8/8.
- `python3 scripts/test-vic-only-normalization.py`: 7/7.
- `python3 scripts/test-vic-owner-report-closure.py`: 25/25.
- `node scripts/verify-approved-scoring-authority.mjs` với Node 22.23.2: PASS, 37 artifacts/133 historical files/9 compatibilities.
- DB SHA-256: `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65`, không đổi.

Không chạy full release suite; 40 kiểm tra trên không thay quyết định tài chính.
