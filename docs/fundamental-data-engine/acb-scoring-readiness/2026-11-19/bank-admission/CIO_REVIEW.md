# ACB BANK — hồ sơ trình CIO ngày 19/11/2026

**BLOCKED cho chấm điểm chính thức.** Ngày chốt 30/10/2026, ACB/HOSE, sector BANK. Đề nghị CIO rà soát đúng phiên bản admission BANK đã diễn tập và các đầu vào nghiên cứu. Quyết định về chấm điểm chưa đủ điều kiện trình vì bộ dữ liệu và assessment chính thức chưa có hash.

## Admission BANK từ nguồn thật

Bộ replay mới sử dụng hai PDF ACB thật, hai biên nhận Vietstock đã ghim và schema SQLite hiện hành. PDF Q3 mang vai trò báo cáo hợp nhất giữa niên độ. PDF H1 là công bố tỷ lệ an toàn vốn theo Thông tư 14, có phạm vi hợp nhất quy định riêng. Giữ nguyên các ngày biết dữ liệu và ngày kinh tế của từng nguồn.

- **CAR 11,8% và CET1 11,5% tại 30/06/2026** đọc trực quan ở bảng 1, trang vật lý 4. Hai trường lưu dưới dạng tỷ lệ 0,118 và 0,115. CET1 lấy từ hàng vốn lõi cấp 1. Hàng vốn cấp 1 được đọc riêng. CAR Q3 do ACB công bố ở mức khoảng 12% chỉ dùng làm đối chiếu. [Công bố ACB Q3](https://acb.com.vn/ve-chung-toi/kqkd-acb-9-thang-2026-tin-dung-tang-115-fitchratings-nang-xep-hang-tin-nhiem-len-bb-trien-vong-on-dinh)
- **Dự phòng cho vay khách hàng 8.153.076 triệu VND tại 30/09/2026** lấy dự phòng chung cộng dự phòng cụ thể từ trang vật lý 19. Dự phòng cho vay ký quỹ 117.476 triệu VND là fact riêng và nằm ngoài phép tính. Khoản dẫn xuất giữ ID hai toán hạng. [BCTC hợp nhất Q3](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/ACB_Baocaotaichinh_Q3_2026_Hopnhat.pdf)
- Ghi và đọc lại **14 fact** trong SQLite tạm. Kiểm tra hash của PDF và từng fact, chạy lặp không tạo bản sao, từ chối mã và ngày chốt khác. Kiểm tra PDF sai bytes và thời điểm biết dữ liệu trước khi nhận nguồn cũng bị từ chối. Replay này chưa tạo binding hoặc admission chính thức cho scorer. [Catalog đã kiểm tra](ACB_SOURCE_CATALOG.json) · [Receipt SQLite cô lập](ISOLATED_REPLAY.json)

## S4 và S1–S5

- **S4 — chốt đầu vào nghiên cứu có giới hạn.** Giá đóng cửa thô 30/10 là 21.000 VND/cổ phần. Dùng 5.804.421.957 cổ phần theo quy tắc carry-forward có giới hạn phạm vi, từ BCTC 30/09 trang vật lý 24. Rà soát ba trang inventory Vietstock với 40 bản ghi và chín mục có dấu cập nhật trong tháng 10. Đã đọc nghị quyết hợp đồng vận hành ACB Insurance và công bố phát hành trái phiếu không chuyển đổi, không kèm chứng quyền. Hai tài liệu này không làm thay đổi mẫu số. Đối chiếu thêm VSDC và danh mục chỉ số HOSE. Độ phủ công bố bên ngoài chưa đầy đủ, nên kết luận giới hạn ở tài liệu đã kiểm tra. F1 và historical PIT vẫn mở. [Hồ sơ S4](S4_ACB.json)
- **S1 — lợi nhuận và tín dụng.** Dùng tiếp cầu nối FY2025 trong phạm vi đã chấp nhận. Q3 xác nhận thu nhập lãi thuần 9T tăng từ 19.812.423 lên 22.969.204 triệu VND, trong khi chi phí dự phòng tín dụng báo cáo tăng từ 1.378.103 lên 2.680.026 triệu VND. Hai chiều này cần được giữ trong giả định lợi nhuận bền vững. Lợi nhuận phổ thông chuẩn hóa qua chu kỳ vẫn mở. [BCTC hợp nhất Q3](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/ACB_Baocaotaichinh_Q3_2026_Hopnhat.pdf#page=6)
- **S2 — nguồn vốn và thanh khoản.** Vốn theo quy định H1 đã có số chính xác. Q3 bổ sung tiền gửi khách hàng và cơ cấu tài trợ. Còn thiếu bộ đầu vào được nghiệm thu cho chênh lệch kỳ hạn và kịch bản căng thẳng. Tỷ lệ dư nợ chia tiền gửi báo cáo cần giữ riêng với LDR pháp lý.
- **S3 — vị thế cạnh tranh.** Công bố ACB có luận điểm về nền tảng khách hàng cá nhân và SME. Cần đối chiếu độc lập độ bền của lợi thế, chi phí vốn và phản chứng chất lượng tài sản trước khi chọn band. [Công bố ACB Q3](https://acb.com.vn/ve-chung-toi/kqkd-acb-9-thang-2026-tin-dung-tang-115-fitchratings-nang-xep-hang-tin-nhiem-len-bb-trien-vong-on-dinh)
- **S5 — định giá.** Mẫu số nghiên cứu có thể dùng cho phép đối chiếu giá trên vốn chủ hợp nhất báo cáo. Phương pháp thu nhập thặng dư vẫn cần vốn phổ thông có thể quy thuộc, lợi nhuận bền vững, chi phí vốn chủ và vốn có thể phân phối. Chưa chốt giá trị hợp lý, band hoặc điểm.

## Quyết định cần xem xét và bước tiếp theo

1. Rà soát phiên bản BANK và hash của code, catalog, hai PDF, kết quả replay và S4. Khi phiên bản được chấp thuận, gắn nó với registry chính thức theo hợp đồng nguồn hiện hành và dùng consumer BANK qua preflight. Hồ sơ không yêu cầu xác nhận lại nguồn theo từng PDF.
2. Hoàn tất dataset binding, F1, 23 rubric S1–S5 được giữ trong hồ sơ, cùng M1/rủi ro và confidence. Ghim hash của dataset, assessment và executable kế nhiệm trước khi lập yêu cầu duyệt chấm điểm ACB.
3. Chạy lại `check` chỉ đọc. Lần này trả `SCORING_DATABASE_BYTES_NOT_LOCAL`, `NO_REGISTERED_TICKER_MAPPING_ADAPTER`, `NO_EXACT_TICKER_SCORING_AUTHORITY`. [Kết quả CLI](CLI_CHECK.json) · [Hồ sơ CIO có hash](CIO_REVIEW.json)

SQLite hoạt động chưa được truy cập vì file đang là placeholder. Không chấm điểm và không ghi vào DB hoạt động.
