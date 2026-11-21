# ACB — ROE lịch sử, số liệu mỗi cổ phần và giới hạn phân phối

ACB/HOSE, ngày chốt 30/10/2026. Gắn với BANK binding `current-bank-coverage:bff83724df834f2b29a7a4d0a3a3b573ab466aa2c2d4f72ab23f9b42b2825119`. Kết quả nghiên cứu từ dữ liệu đã lưu. [Reference](ACB_BANK_SCORING_REFERENCE.json)

## ROE và cầu nối số liệu mỗi cổ phần

Tái sử dụng [JSON ACB](../../../../../data/manual-extracted-pdf/ACB.json) (SHA-256 `c4cbe676387f2750f57a5b3e4a2b54e38168192c4b769f1a9fd0b01c5d90434b`). Đọc vốn chủ hợp nhất trang PDF 8 ở các cột năm hiện tại và đối chiếu cột so sánh năm kế tiếp khi có. Cột PDF đã nhận diện theo vị trí năm hiện hành/năm trước và số đối chiếu, dù một số key OCR giữ nhãn UNRESOLVED. Vốn đầu 2022 là 44.900.909 triệu VND từ FY2022 cột so sánh. Tử số EPS lấy sau trích quỹ theo thuyết minh ở trang 70 (FY2022–2023) hoặc 72 (FY2024–2025). Cổ phần cuối năm lấy từ dòng cuối cầu nối vốn cổ phần (trang 64 hoặc 66). EPS công bố lấy theo bản năm tương ứng. [BCTC kiểm toán FY2025](https://acb.com.vn/acbwebsite/files/ACB-FS2025-Consol-VN_searchable.pdf) · [Kho BCTC ACB](https://acb.com.vn/nha-dau-tu/bao-cao-tai-chinh)

| Kỳ | Vốn chủ cuối kỳ (tỷ đồng) | Lợi nhuận tính EPS (tỷ đồng) | ROE trên vốn bình quân | Cổ phần cuối kỳ | EPS công bố | BVPS theo cổ phần cuối kỳ | Lợi nhuận/cp trên mẫu số 30/10/2026 | BVPS trên mẫu số 30/10/2026 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| FY2022 | 58.439 | 13.538 | 26,20% | 3.377.435.094 | 4.008 | 17.303 | 2.332 | 10.068 |
| FY2023 | 70.956 | 15.895 | 24,57% | 3.884.050.358 | 4.092 | 18.269 | 2.738 | 12.224 |
| FY2024 | 83.462 | 16.390 | 21,23% | 4.466.657.912 | 3.669 | 18.685 | 2.824 | 14.379 |
| FY2025 | 94.520 | 15.525 | 17,45% | 5.136.656.599 | 3.022 | 18.401 | 2.675 | 16.284 |

ROE = lợi nhuận tính EPS / vốn chủ bình quân hai đầu kỳ. Vốn chủ hợp nhất là đại diện vốn phổ thông nhất quán cho phép đối chiếu. Hai cột mẫu số 30/10 dùng cố định 5.804.421.957 cổ phần để tách biến động tử số và vốn chủ. Chúng là chỉ tiêu so sánh theo cùng mẫu số, không dùng thay EPS hồi tố theo chuẩn kế toán hoặc tổng lợi suất. Trong FY2022–2025, lợi nhuận tính EPS tăng bình quân khoảng 4,67%/năm, trong khi vốn chủ cuối kỳ tăng 17,38%/năm. Lợi nhuận/cp quy về mẫu số cố định giảm khoảng 5,28% năm 2025 so với FY2024. Đối chiếu này hỗ trợ GQ-HIST và CA-PSV, chưa bao gồm tiền cổ tức nhận được hoặc bằng chứng hiệu quả tái đầu tư.

## P/B theo ngày và giá thoát

Ngày 30/10/2026, giá đóng cửa gốc 21.000 đồng/cp, vốn chủ hợp nhất Q3 104.013,132 tỷ đồng và 5.804.421.957 cổ phần cho BVPS 17.920 đồng và P/B **1,172 lần**. File CaféF hiện giữ đúng một ngày 30/10. File TCBS lịch sử có bar 31/12/2025 nhưng chưa xác minh đó là giá đóng cửa chưa điều chỉnh. Do đó P/B thị trường FY2022–FY2025 giữ N/R. Cần ghép từng giá đóng cửa gốc của phiên cuối kỳ với vốn và cổ phần có cùng cơ sở. Nếu dùng báo cáo xuất bản sau thời điểm thị giá, chỉ được ghi so sánh hồi cứu. [Giá CaféF lưu cục bộ](../../../../../data/market-history/cafef/ACB.json) · [Phép thử giá thoát](ACB_CAPITAL_HEADROOM_AND_EXIT_TEST.md)

ROE 14,10% cần để đạt IRR 8% ở Ke 15%, g 3% nằm dưới ROE FY2025 là 17,45%. Chuỗi lịch sử cho thấy kịch bản tích cực có tiền lệ sinh lời, đồng thời cho thấy ROE giảm liên tục khi vốn tăng. Với dự phóng giữ vốn/cổ tức hiện tại, ROE cuối kỳ cơ sở 11,70% và P/B thoát 0,725 lần cho IRR 3,25%. P/B thị trường 1,172 lần hiện tại không tự xác nhận P/B thoát 0,925 lần năm 5. Giữ band dưới 8% ở mức nghiên cứu. Việc chọn ROE cuối kỳ cao hơn cần một cầu nối về lợi nhuận, dự phòng, RWA và vốn giữ lại.

## Mô hình vốn kiểm đồng thời ba tỷ lệ

Dùng vốn riêng lẻ H1, tỷ đồng: vốn tự có 86.774,234, Tier 1/CET1 83.425,178, RWA 826.234,583. Cho 0/50/100% của 4.490,823 tỷ đồng LNST riêng Q3 làm mức tăng vốn giả định, giữ giảm trừ và Tier 2 không đổi. Trần chi theo vốn = số nhỏ nhất của (vốn CAR − RWA × 9,25%), (Tier 1 − RWA × 7,25%), (CET1 − RWA × 5,75%). Độ nhạy đệm quản trị cộng 1 điểm phần trăm cho từng mức. CAR là giới hạn chặt nhất ở cả 18 tổ hợp. [Báo cáo vốn H1](https://static2.vietstock.vn/data/HOSE/2026/BCTLATV/VN/QUY%202/ACB_BaocaoTyleAnToanVon_6T_2026.pdf?ver=4e1dacd3#page=6) · [BCTC riêng Q3](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/ACB_Baocaotaichinh_Q3_2026_Congtyme.pdf?ver=4c774fd0#page=6) · [Thông tư 14](https://vanban.chinhphu.vn/?docid=214640&pageid=27160)

- **RWA +3%, 50% lợi nhuận được công nhận:** trần theo vốn khoảng 10.300 tỷ ở ngưỡng tham chiếu, chỉ 1.790 tỷ khi thêm đệm quản trị. So với giả định chi 5.804 tỷ, tương ứng dư 4.496 tỷ hoặc thiếu 4.014 tỷ.
- **RWA +6%, chưa công nhận thêm lợi nhuận:** thiếu 42 tỷ sau chi ở ngưỡng tham chiếu, thiếu khoảng 8.801 tỷ nếu thêm đệm. Đây là độ nhạy, chưa xác minh sức chi thực tế tại Q3. Còn cần kiểm tra giới hạn hợp nhất và các điều kiện phân phối ngoài ba tỷ lệ vốn.

## Báo cáo cần mở cho hai khoảng trống còn lại

- **Thực thi quản trị:** công bố kèm Nghị quyết 4490, biên bản hoặc trích lục họp HĐQT 05/10/2026 nếu công khai. Có thể dùng báo cáo giám sát của Ban Kiểm soát hoặc báo cáo quản trị kỳ sau, Mục VII và phụ lục giao dịch bên liên quan, nếu dẫn đúng giao dịch hoặc có bằng chứng tương đương về khai báo, biểu quyết và giám sát. Công bố đã tìm liệt kê tệp Nghị quyết 4490. Báo cáo bán niên có phạm vi trước giao dịch tháng 10. Nếu tài liệu phát hành sau 30/10, ghi ngày công bố và xử lý riêng giới hạn point-in-time. [Công bố HOSE về Nghị quyết 4490](https://cafef.vn/du-lieu/acb-2993772/acb-nghi-quyet-hdqt-ve-cac-hop-dong-giao-dich-giua-acb-va-acbi.chn) · [Báo cáo quản trị ACB](https://acb.com.vn/nha-dau-tu/bao-cao-quan-tri-acb)
- **Nguồn bù thanh khoản:** mở BCTC hợp nhất bán niên soát xét 2026, thuyết minh 10.1 (PDF 51), 15 (59–60), và đặc biệt **34.2 (PDF 71)** về tài sản ACB **đưa đi** cầm cố. Thuyết minh 34.1 liệt kê tài sản ACB nhận bảo đảm, phạm vi riêng. Đối chiếu khung và bảng kỳ hạn H1 (PDF 86–88) với Q3 (PDF 34). Báo cáo thường niên và BCTC kiểm toán FY2026 có thể cập nhật danh mục ràng buộc, hạn mức và phương án thanh khoản khi công bố, theo phạm vi từng báo cáo. Kiểm tra quyền bán/repo, haircut và hạn mức cam kết thực sự rút được, rồi loại phần đã vào bảng dòng tiền 30 ngày. Số H1 dùng làm kiểm tra độ nhạy, chưa xác nhận nguồn bù Q3. [BCTC bán niên đã lưu](../../../../../data/manual-download/ACB/ACB_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.pdf#page=71) · [Bảng kỳ hạn Q3](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/ACB_Baocaotaichinh_Q3_2026_Hopnhat.pdf#page=34)

Chưa tạo assessment hoặc review bindings chính thức. Không chạy score.
