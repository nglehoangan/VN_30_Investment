# FPT BQ-EQ — cầu nối vốn đầu tư khi đổi phạm vi FTEL

Rà soát hồi cứu FPT/HOSE/TECHNOLOGY. Mốc tham chiếu 15/11/2026, kỳ BCTC 01/01–30/09/2026, execution `exec-e6e52719197b285f738d58ba`. Nguồn là BCTC hợp nhất Q3/2026 đã lưu, document 564974, SHA-256 `e32a7edba4e40fd08af58587abaf8b95c9c7b70cd120c14e5f33b6153b1c9e14`. Số trang bên dưới là trang vật lý. [PDF Vietstock](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/FPT_Baocaotaichinh_Q3_2026_Hopnhat.pdf)

## Cầu nối một phần

Đơn vị VND. Dấu âm biểu thị khoản nợ vận hành hoặc khoản làm giảm vốn đầu tư. Hai dòng TSCĐ tính giá trị còn lại bằng nguyên giá trừ khấu hao lũy kế. Dùng phạm vi hoạt động trực tiếp của FPT, loại khoản đầu tư liên kết và phần lãi liên doanh, liên kết khỏi mẫu số và tử số tương ứng.

| Dòng | 31/12/2025 báo cáo | Điều chỉnh nhận diện | Đầu kỳ sau phần đã nhận diện | 30/09/2026 | Trang |
| --- | ---: | ---: | ---: | ---: | --- |
| TSCĐ hữu hình | 15.359.168.484.059 | −5.323.298.192.799 | 10.035.870.291.260 | 10.766.116.372.967 | 4, 35 |
| TSCĐ vô hình | 1.928.096.152.196 | −462.677.503.839 | 1.465.418.648.357 | 1.348.036.045.727 | 4, 36 |
| XDCB dở dang | 1.605.078.004.898 | −693.632.131.812 | 911.445.873.086 | 1.130.986.988.296 | 37 |
| Chi phí chờ phân bổ dài hạn | 4.200.230.383.066 | −2.055.454.565.292 | 2.144.775.817.774 | 1.758.483.230.080 | 37 |
| Doanh thu chờ phân bổ ngắn hạn | −4.233.698.718.701 | +1.878.168.997.510 | −2.355.529.721.191 | −2.164.614.328.538 | 39 |
| Doanh thu chờ phân bổ dài hạn | −152.241.175.129 | +5.234.542.019 | −147.006.633.110 | −273.478.506.120 | 39 |
| **Cộng nhóm dòng trên** | **18.706.633.130.389** | **−6.651.658.854.213** | **12.054.974.276.176** | **12.565.529.802.412** | |

Điều chỉnh hữu hình và vô hình là biến động do thay đổi hợp nhất ghi trong thuyết minh. XDCB gồm ba dự án nêu đích danh FTEL tại 31/12. Chi phí triển khai thuê bao và doanh thu nhận trước viễn thông được tách theo nhãn thuyết minh, với giả định nghiên cứu quy các dòng viễn thông đó về FTEL. Phần FTEL có thể nằm trong các dòng gộp vẫn chưa lượng hóa.

Khoản đầu tư liên kết phát sinh 5.157.899.799.701 VND (trang 33) và phần vay, thuê tài chính được loại 7.510.806.811.800 VND (trang 40) được đối chiếu riêng. Chúng không điều chỉnh lần nữa bảng tài sản vận hành trừ nợ vận hành không lãi. Thuế phải nộp ròng giảm 384.416.648.204 VND do FTEL (trang 38), gồm nhiều sắc thuế. Bảng thử bên dưới loại nhóm thuế ở cả hai đầu kỳ để tránh gộp thuế thu nhập với thuế vận hành.

## Phần chưa tách được và độ nhạy

Bổ sung các nhóm vốn lưu động sau vào phép thử. Số dưới đây là **tổng số dư đầu kỳ FPT**, dùng để chỉ quy mô dòng cần tách, không phải số dư FTEL. Trang 3 ghi phải thu ngắn hạn 14.008.456.702.890, tồn kho 2.193.769.802.339 và chi phí chờ phân bổ ngắn hạn 641.974.035.769. Trang 5 và 39 ghi phải trả người bán 3.837.081.314.767, người mua trả trước 734.726.007.595, phải trả người lao động 5.724.811.126.353, chi phí phải trả ngoài lãi vay 1.679.524.420.464 và phải trả theo tiến độ hợp đồng 85.650.109.236 VND. Cần phần FTEL và phần số dư nội bộ được khôi phục sau khi đổi phương pháp cho các nhóm này. Số điều chỉnh ròng chưa xác định được, có thể mang cả hai dấu.

Vốn lưu động theo các dòng chọn là 4.782.407.562.583 VND đầu kỳ trước phần chưa tách và 8.851.571.858.505 VND cuối kỳ. Chi phí phải trả cuối kỳ ngoài lãi vay là 969.039.203.819 − 84.069.813.895 VND. Các dòng cuối kỳ còn lại lấy theo mã 130, 140, 161, 311, 312, 315, 318. Vốn thử nghiệm là **16.837.381.838.759 + Δ** đầu kỳ và **21.417.101.660.917 VND** cuối kỳ. Δ là phần điều chỉnh ròng đầu kỳ còn chưa định lượng trong phạm vi các dòng đã chọn. Phép thử cũng để ngoài tiền, đầu tư tài chính, lợi thế thương mại, TSCĐ thuê tài chính, thuế, và các tài sản/nợ vận hành khác chưa phân loại. Một cầu nối toàn bộ cần kiểm tra các dòng đó ở cả hai mốc.

Trang 7 cho lợi nhuận gộp trừ chi phí bán hàng và quản lý **5.899.834.667.747 VND**. Thuế suất báo cáo hợp nhất 9T = (1.083.828.799.171 − 90.110.530.089) / 8.770.160.739.433 = **11,33%**, dùng làm giả định minh họa chứ chưa phải thuế hoạt động chuẩn hóa. Lợi nhuận hoạt động sau thuế minh họa khoảng 5.231.343.671.049 VND. Phép thử 9T chia số này cho (19.127.241.749.838 + Δ/2). Với Δ lần lượt −2, 0 và +2 nghìn tỷ VND, kết quả lần lượt **28,86%, 27,35% và 25,99%**. Đây là ba kịch bản minh họa, chưa có căn cứ dùng ±2 nghìn tỷ làm cận. Chưa đủ dữ liệu để công bố một khoảng ROIC hoặc điểm BQ-EQ. Không so trực tiếp tỷ suất 9T với WACC năm.

Bằng chứng còn thiếu cụ thể là bảng số dư mở 01/01/2026 sau đổi phương pháp hoặc bảng điều chỉnh từng dòng vốn lưu động và loại trừ nội bộ. BCTC FTEL FY2025 có thể đối chiếu số dư tại FTEL, còn điều chỉnh trên sổ hợp nhất FPT cần xác minh riêng.

## Đối chiếu bổ sung với BCTC kiểm toán FTEL FY2025

Nguồn bổ trợ cho hồ sơ FPT là BCTC **hợp nhất** kiểm toán của Công ty Cổ phần Viễn thông FPT tại 31/12/2025, trang in 5–6 và Thuyết minh 6, 34(b) trang in 24, 46–47. Cột chênh trước đối chiếu chỉ lấy số FPT trừ số FTEL theo nhãn và phạm vi báo cáo. [BCTC FTEL FY2025](https://static2.vietstock.vn/vietstock/2026/3/26/2_fox_2026_3_26_32b08f5_vi_baocaotaichinh_kiemtoan_2025.pdf)

| Dòng, VND | FPT trước đổi phạm vi | FTEL hợp nhất | Chênh trước đối chiếu nội bộ |
| --- | ---: | ---: | ---: |
| Phải thu ngắn hạn, mã 130 | 14.008.456.702.890 | 2.152.609.986.778 | 11.855.846.716.112 |
| Tồn kho ròng, mã 140 | 2.193.769.802.339 | 1.426.949.537.850 | 766.820.264.489 |
| Phải trả người bán ngắn hạn, mã 311 | 3.837.081.314.767 | 1.874.610.162.906 | 1.962.471.151.861 |
| Phải trả người lao động, FPT mã 315 / FTEL mã 314 | 5.724.811.126.353 | 1.783.804.117.734 | 3.941.007.008.619 |

Đối chiếu chéo cho thấy TSCĐ hữu hình và vô hình ròng của FTEL lần lượt 5.323.298.192.799 và 462.677.503.839 VND, khớp đúng hai điều chỉnh FTEL FPT công bố. Phép trừ thô bốn dòng làm tăng vốn đầu kỳ 78.854.756.012 VND theo dấu tài sản trừ nợ. Áp dụng riêng phép thử đó cho nền 16.837.381.838.759 cho 16.916.236.594.771 VND trước đối chiếu. Đây là kết quả số học cho bốn dòng, còn lẫn phân loại và loại trừ nội bộ. Riêng mã 130 của FTEL chứa 163.384.090.627 VND lãi tiền gửi, cần kiểm tra cách phân loại ở FPT trước khi dùng cho vốn vận hành.

Thuyết minh 34(b) liệt kê 56.686.231.851 VND phải thu khách hàng, 107.574.696.204 VND phải trả người bán, 29.313.121.176 VND trả trước người bán và 23.760.102.723 VND người mua trả trước với **toàn bộ bên liên quan được liệt kê**. Trong đó riêng đối tác Công ty Cổ phần FPT có 432.684.562 VND phải thu của FTEL và 40.421.236.948 VND phải trả của FTEL. Nếu các số dư thương mại đối ứng này đã được loại toàn bộ ở FPT trước đổi phương pháp, phần FPT còn lại sẽ ghi nhận lại lần lượt nợ phải trả và phải thu tương ứng. Chênh có dấu riêng hai khoản là +39.988.552.386 VND trên vốn vận hành. Đây là đối chiếu theo số dư phía FTEL, chưa phải bút toán xác nhận ở phía FPT. Các công ty liên kết như FPT Retail và Synnex FPT xuất hiện trong danh sách bên liên quan, vì vậy không được dùng tổng bên liên quan làm tổng số dư bị loại.

Chưa tìm được bảng số dư mở hợp nhất ngày 01/01/2026 sau đổi phạm vi hoặc bảng bút toán đối ứng theo dòng ở FPT. Các số FTEL đã giúp lượng hóa bốn số dư nguồn. Phần điều chỉnh thực tế trên báo cáo hợp nhất FPT, gồm các khoản đối ứng, phân loại lại và lãi nội bộ trong hàng tồn kho nếu có, vẫn chưa xác định. Mẫu số vốn đầu kỳ và khoảng ROIC BQ-EQ tiếp tục để mở.

## Kiểm tra cột so sánh trong Q1, bán niên và Q3/2026

- BCTC hợp nhất Q1/2026, bảng tình hình tài chính trang in 2–5, ghi cột so sánh 31/12/2025. Tổng tài sản 88.141.991.634.625 VND, phải thu ngắn hạn 14.008.456.702.890 VND, tồn kho 2.193.769.802.339 VND và NCI 7.265.096.802.767 VND. Báo cáo bộ phận tại 31/12/2025 vẫn trình bày bộ phận viễn thông, với tài sản 26.251.582 triệu VND trước loại trừ của tập đoàn. Phần giải trình Q1 lập số so sánh doanh thu/lợi nhuận kỳ trước theo phương pháp mới. [BCTC Q1](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%201/FPT_Baocaotaichinh_Q1_2026_Hopnhat.pdf)
- Bản trích xuất lưu của BCTC hợp nhất bán niên soát xét, hash nguồn 45636554f28c7e6c2f38458b9a22410ed1f67e80627d672b827019a67f299df8, trang PDF 9 và 11, vẫn ghi tổng tài sản cột 31/12/2025 là 88.141.991.634.625 VND. Trang PDF 60 giải thích việc trình bày lại số liệu so sánh do áp dụng chế độ kế toán mới. [Trích xuất bán niên](../../../../../data/manual-extracted-pdf/notes/FPT.json)
- BCTC hợp nhất Q3/2026, trang PDF 3–6, cũng ghi cột 31/12/2025 với cùng tổng tài sản, phải thu, tồn kho và NCI. Thuyết minh 31, trang PDF 49, cho thấy phải thu ngắn hạn giảm 393.560.747.215 VND trong số so sánh, đúng bằng mức tăng của đầu tư tài chính ngắn hạn do **phân loại lại theo chế độ kế toán mới**. Trang PDF 8 điều chỉnh số so sánh doanh thu/lợi nhuận 2025 theo phạm vi FTEL mới. Trang 35–40 và 43 cho thấy các biến động FTEL được thuyết minh theo từng nhóm, gồm cả tái phân loại 3.103.265.803.626 VND vào lợi nhuận chưa phân phối với tổng tác động bằng 0 trong dòng vốn chủ sở hữu công ty mẹ đó. [BCTC Q3](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/FPT_Baocaotaichinh_Q3_2026_Hopnhat.pdf)

Cột 31/12/2025 trong ba báo cáo không cung cấp bảng số dư mở 01/01/2026 sau khi ngừng hợp nhất toàn bộ FTEL. Không dùng chênh lệch so với FY2025 làm điều chỉnh FTEL. Giữ cầu nối từng dòng đã định lượng ở trên và để mở phần vốn lưu động chưa có đối ứng xác nhận.

## Tỷ suất vốn vận hành 6T từ hai mốc sau chuyển đổi

Kỳ 01/04–30/09/2026 dùng vốn ngày 31/03 và 30/09. Cả hai mốc ghi FTEL theo phương pháp vốn chủ sở hữu. Dùng cùng nhóm dòng như phép thử 9T, gồm mã 220 trừ 224, cộng 250, 271, 130, 140 và 161, trừ 311, 312, 315, 316 ngoài lãi vay, 318, 319 và 337. Vốn 31/03 là 20.573.272.324.563 VND. Vốn 30/09 là 21.417.101.660.917 VND. Bình quân là 20.995.186.992.740 VND. BCTC Q1 ghi lãi vay phải trả 61.078.310.226 VND tại thuyết minh 20. [BCTC Q1](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%201/FPT_Baocaotaichinh_Q1_2026_Hopnhat.pdf)

Lợi nhuận hoạt động trực tiếp Q1 bằng 4.244.889.890.688 − 1.002.337.155.317 − 1.210.282.662.926 = 2.032.270.072.445 VND. Trừ khỏi số lũy kế 9T 5.899.834.667.747 VND cho lợi nhuận hoạt động 6T là 3.867.564.595.302 VND. Tỷ suất trước thuế là 18,42% cho sáu tháng. Với giả định thuế 20%, tỷ suất sau thuế là 14,74%. Với thuế suất hợp nhất báo cáo 9T 11,33%, dùng làm kịch bản thay thế, tỷ suất là 16,33%. Hai kết quả đo độ nhạy theo thuế trên cùng mẫu số đã chọn. Toàn bộ vốn vận hành, thuế chuẩn hóa, khả năng duy trì qua nhiều kỳ và WACC vẫn cần xác định trước khi chấm BQ-EQ.

## Tạm dừng BQ-EQ theo yêu cầu chủ sở hữu

**BQ-EQ = N/R, điểm null, tối đa 8.** Dừng rà rubric này đến khi có bằng chứng có thể thay đổi kết luận. Giữ 14,74% cho sáu tháng 04–09/2026 theo mẫu số đã chọn và giả định thuế 20% làm kết quả nghiên cứu. Phép thử chưa xác lập ROIC chuẩn hóa, độ bền nhiều kỳ hoặc chênh lệch so với chi phí vốn. Giữ riêng bốn chủ đề của rubric: suất sinh lời, độ bền, biên và chi phí vốn.

**Mốc rà lại:** BCTC hợp nhất kiểm toán FY2026 của FPT và thuyết minh kèm theo khi công bố. Kiểm tra xem có (1) số dư mở 01/01/2026 sau đổi phương pháp FTEL hoặc cầu nối vốn vận hành theo dòng; (2) số dư cuối 31/12/2026 và EBIT cả năm cùng phạm vi; (3) thuyết minh thuế và khoản bất thường đủ để dựng NOPAT. Dùng dữ liệu thị trường cùng mốc để ước tính chi phí vốn và bằng chứng nhiều kỳ để xét độ bền. Nếu BCTC năm vẫn dùng cột so sánh trước chuyển đổi và thiếu cầu nối, giữ N/R cho đến khi có dữ liệu hoặc một phép thay thế được methodology cho phép, đủ chắc để xác định band. Không mở lại việc tải Q3 hoặc đối chiếu FTEL FY2025 đã hoàn tất nếu các nguồn không thay đổi.
