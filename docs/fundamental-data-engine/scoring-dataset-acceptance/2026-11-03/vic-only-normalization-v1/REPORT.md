# VIC — phương án chỉ dùng báo cáo VIC

Chỉ đạo mới: chỉ bám báo cáo VIC; không tiếp tục yêu cầu báo cáo VinFast để chạy hướng nghiên cứu này. Đây là thay đổi phạm vi sau gói `vic-official-closure-v1`, không xóa hoặc phủ nhận lịch sử nghiên cứu SEC/IR. Các phát hiện SEC/IR không tham gia phép tính mới. Không cần thêm tài liệu từ chủ sở hữu cho bước chẩn đoán này. Không dựa vào nhận định về tình trạng niêm yết để quyết định chất lượng thông tin.

## Phương án đã thực hiện

Chọn **lợi nhuận hợp nhất trước thuế sau loại các khoản đã định danh** làm chỉ tiêu chẩn đoán chính, vì báo cáo VIC cho phép đối chiếu ở cấp này mà không đoán thuế và mẹ/NCI.

Đơn vị bảng: tỷ VND, theo độ chính xác công bố của từng khoản.

| Cầu nối FY2025 | Giá trị |
|---|---:|
| Lợi nhuận hợp nhất trước thuế báo cáo | 26.437,375 |
| Trừ thu nhập tài trợ | (23.054,157) |
| Trừ lãi chuyển nhượng Novatech | (34.395) |
| Chẩn đoán chính sau hai khoản loại | **−31.011,782** |
| Thử loại thêm lãi Movian 1.765 tỷ | **−32.776,782** |

Nguồn duy nhất của số liệu: `VIC_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf`, trang vật lý 13 (PBT), 86 (tài trợ), 43 (Novatech), 42 (Movian). Tái sử dụng các trang đã kiểm tra toàn ảnh trong `../vic-parent-bridge-v1/checked-evidence.json`; không tuyên bố kiểm tra ảnh mới. Hash PDF và evidence ID được pin ở `decision.json`. Số Novatech/Movian công bố theo tỷ đồng; phép tính danh nghĩa không tạo độ chính xác VND mới.

Không trừ thêm phí bản quyền, tiền bán cổ phần hoặc toàn bộ lãi chuyển nhượng tổng hợp. Giữ nguyên chi phí đã báo cáo; không cộng lại xóa sổ. Khoản lãi chuyển nhượng còn lại 3.563,679 tỷ chưa được chứng minh là lợi nhuận lặp lại. Chẩn đoán này chưa chuẩn hóa toàn bộ chu kỳ, quỹ hoặc hoạt động dự án; không được gọi là “lỗ cốt lõi” hoàn chỉnh.

## Cách sử dụng và phần chưa khép

Kết quả cho thấy PBT FY2025 phụ thuộc lớn vào các khoản thu nhập đã định danh. Đây là thông tin hữu ích cho phân tích chất lượng lợi nhuận, không chứng minh VIC mất cùng lượng tiền hoặc cổ đông VIC chịu toàn bộ khoản lỗ trên.

Giữ các phép thử lợi nhuận thuộc cổ đông mẹ dùng tỷ lệ cuối năm/thuế giả định để tham khảo độ nhạy; không chọn chúng làm mức cơ sở. Không biến thuế hoặc NCI thiếu thành 0, và không coi chỉ đạo bỏ qua nguồn VinFast là miễn tiêu chí tài chính.

Mức lợi nhuận chuẩn hóa thuộc cổ đông thường và EPS được nghiệm thu vẫn `null`. Nếu chỉ báo cáo VIC không đủ chi tiết thì chấp nhận giới hạn đó, tiếp tục phân tích tài sản/dòng tiền/nợ theo phân khúc do VIC công bố; RNAV/NAV chỉ được dùng khi có đủ đầu vào riêng. Không sử dụng P/E dựa trên phép chẩn đoán PBT này. Hướng tài sản là hướng nghiên cứu tiếp theo, chưa được triển khai hay nghiệm thu bởi gói này.

Các phần còn mở: phân loại lãi chuyển nhượng dự án lặp lại, chu kỳ, quỹ cấp công ty con, mẫu số cổ phần và — nếu cần chốt lợi nhuận thuộc mẹ — thuế/phân bổ từ bằng chứng VIC hoặc lượng hóa bất định đủ bảo vệ. Không tạo nghĩa vụ phải xin báo cáo VinFast.

## Kiểm tra

- `python3 scripts/test-vic-only-normalization.py`: 7/7.
- `python3 scripts/test-vic-parent-bridge.py`: 24/24.
- `node scripts/verify-approved-scoring-authority.mjs` với Node 22.23.2: PASS, 37 artifacts/133 historical files/9 compatibilities.
- DB SHA-256 giữ nguyên: `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65`.

Không chạy toàn bộ release suite; không thay tiêu chí, trọng số, ledger, production scoring, NAV hoặc quyền giao dịch. **Hoàn tất hướng chẩn đoán chỉ dùng VIC; chưa nghiệm thu mức lợi nhuận chuẩn hóa thuộc cổ đông.**
