# B6 — Chuẩn hóa và nghiệm thu kinh tế R4

**B6 chưa hoàn thành.** Kiểm tra kỹ thuật đạt; chuẩn hóa, định giá đủ 30 mã và nghiệm thu điểm tổng còn chưa đạt. Không có yêu cầu bổ sung từ chủ tài khoản ở lần rà soát này.

Đã tích hợp 39 số liệu dự phòng của 13 ngân hàng, thêm 20 khoản chi mua tài sản được đọc trên PDF và lập 58 cầu nối CFO–chi mua tài sản cho 15 mã phi tài chính. Các cầu nối này giữ phạm vi báo cáo gốc, chưa tự trở thành dòng tiền cho cổ đông thường. VPL chỉ dùng 2023–2025. Khoản hỗn hợp tài sản/đặt cọc VRE 2023 được giữ riêng, không điền 0.

VNM: đã loại riêng lãi thanh lý ròng 6.136.383.841 đồng, giữ khoản hỗ trợ nhà cung cấp lặp lại, mô hình hóa quỹ 10% và cấp vốn cho tăng trưởng. Không coi chuyển quỹ đầu tư phát triển sang lợi nhuận chưa phân phối là thu nhập mới.

ACB: dự phòng cho vay được khớp đúng số dư cho vay, gồm cho vay ký quỹ; tỷ lệ bình quân có trọng số ba năm khoảng 0,4167%. Giữ khoản hoàn nhập ngoài cho vay 694 triệu riêng. Lợi nhuận thường theo phép điều chỉnh này khoảng 16.080 tỷ đồng, chưa phải kết luận chuẩn hóa toàn diện. Vốn 6T2026 không được cộng thêm lần nữa khoản chuyển nội bộ để trả cổ phiếu thưởng.

SSB: loại lãi bán PTF 2.607,318 tỷ đồng với giả định thuế 20% cho kết quả lợi nhuận thường khoảng 3.258,4 tỷ nếu giữ quỹ đã ghi, hoặc 3.321,0 tỷ nếu ước tính lại quỹ 3%. Thuế giao dịch và quỹ cuối cùng chưa được chứng minh; không dùng doanh thu bán 4.300 tỷ thay cho khoản lãi. Khoản vay chuyển đổi chưa xác định số cổ phần được giữ là rủi ro pha loãng.

## Mô hình đã tính

Các số dưới đây là **giá trị mô hình trên số cổ phần tham chiếu**, chưa phải giá trị hợp lý được nghiệm thu, mục tiêu giá hay đề xuất đầu tư. Ba kịch bản là giả định của người phân tích.

| Mã | Phương pháp | Thận trọng | Cơ sở | Tích cực | Đơn vị |
|---|---|---:|---:|---:|---|
| VNM | DCF tiền cho chủ sở hữu | 17,418 | 26,794 | 37,591 | đồng/cp tham chiếu |
| ACB | Thu nhập thặng dư | 12,833 | 21,561 | 25,274 | đồng/cp tham chiếu |

Nguồn, phép tính và giả định nằm trong JSON mô hình tương ứng; hồ sơ từng mã nối tới PDF gốc và trang vật lý. Không cộng riêng tiền/tài sản công ty con vào DCF đã bao gồm thu nhập tài chính/cổ tức tương ứng.

## Điểm và tiêu chí nghiệm thu

Đã đánh giá RG-UNC (độ bất định dự báo) của VNM và ACB ở mức 0/2 vì biên độ mô hình và các phụ thuộc còn trọng yếu. Đây không phải điểm tổng 0. Còn 688/690 tiêu chí chưa đủ đánh giá; giữ N/R và nguyên trọng số. Không có điểm tổng nào được nghiệm thu. Không yêu cầu người nghiệm thu độc lập cho dự án cá nhân.

Để đạt: lợi nhuận và quyền lợi cổ đông phải có cầu nối; dòng tiền phải tài trợ được tăng trưởng; phương pháp định giá phải phù hợp hoạt động và có kiểm tra chéo; mẫu số cổ phần/giá phải cùng cơ sở; đủ bằng chứng theo từng chủ đề của 23 tiêu chí; rủi ro vốn/thanh khoản phải được đánh giá. Giả định bảo thủ có tài liệu được phép sử dụng, không đòi doanh nghiệp chứng minh trước dự báo tương lai.

## Việc còn lại theo từng mã

| Mã | Cầu nối tiền năm đã tính | Kịch bản định giá có điều kiện | Phần cần xử lý tiếp |
|---|---:|---:|---|
| ACB | 0 | 3 | Đã tách dự phòng cho vay; còn stress vốn/nguồn vốn và cầu nối sau 6T2026. |
| BID | 0 | 0 | Tách thu hồi nợ, dự phòng từng loại tài sản và lợi ích cổ đông thường. |
| BSR | 4 | 0 | Mâu thuẫn tử số EPS 21,135 tỷ; chuẩn hóa chu kỳ lọc dầu và đại tu. |
| CTG | 0 | 0 | Chuẩn hóa dự phòng, quỹ ngoài cổ đông và lợi nhuận bền vững. |
| FPT | 4 | 0 | Giữ cầu nối cùng phương pháp/phạm vi; tách NCI và tái đầu tư. |
| GAS | 4 | 0 | Chu kỳ giá/sản lượng khí, thay thế tài sản và chi đầu tư dự án. |
| GVR | 4 | 0 | Mâu thuẫn quỹ; tách chu kỳ cao su, đất và NCI. |
| HDB | 0 | 0 | Quỹ công ty mẹ chỉ là cầu nối một phần; cổ phần tạm tính khác niêm yết. |
| HPG | 4 | 0 | Chu kỳ chênh lệch giá thép, chạy thử công suất và nguồn tài trợ mở rộng. |
| LPB | 0 | 0 | Giữ phạm vi riêng; chốt quỹ ngoài cổ đông và yêu cầu giữ vốn. |
| MBB | 0 | 0 | Giữ CAR 6T2026 chưa cập nhật; quỹ, rủi ro tín dụng và phát hành cổ phần. |
| MCH | 4 | 0 | Lợi nhuận thường xuyên, quỹ và tiền thực chuyển được cho cổ đông. |
| MSN | 4 | 0 | Nợ truy đòi công ty mẹ, sở hữu công ty con và khả năng chuyển tiền lên. |
| MWG | 4 | 0 | Tái cấu trúc cửa hàng, công ty liên kết và dòng tiền tồn kho/phải trả. |
| SAB | 4 | 0 | Lợi ích thiểu số, quỹ và tiền có thể phân phối; tránh cộng tiền hai lần. |
| SHB | 0 | 0 | Tách thu hồi nợ và hoàn nhập đầu tư khỏi giả định lợi nhuận thường xuyên. |
| SSB | 0 | 0 | Đã mô hình hóa loại lãi bán PTF; thuế/quỹ và vay chuyển đổi chưa chốt. |
| SSI | 0 | 0 | Thu nhập giao dịch/định giá, quỹ toàn nhóm và cổ phiếu quỹ. |
| STB | 0 | 0 | Tái cơ cấu, VAMC, thu hồi nợ và thời điểm xử lý tài sản. |
| TCB | 0 | 0 | Cổ phần tạm tính khác niêm yết; cầu nối quyền và giá cần đối chiếu. |
| TCX | 0 | 0 | Giữ phạm vi riêng; hoạt động thường xuyên, tự doanh và vốn phát hành mới. |
| VCB | 0 | 0 | Tách dự phòng theo tài sản, lợi nhuận bền vững và giữ vốn. |
| VHM | 4 | 0 | Pháp lý, sở hữu, lịch giao dự án, chi phí/thuế còn lại và nợ. |
| VIB | 0 | 0 | Chất lượng tài sản, lợi nhuận lãi/phí, vốn và dự phòng qua chu kỳ. |
| VIC | 4 | 0 | SOTP theo hoạt động, nợ truy đòi, NCI và tài trợ chéo. |
| VJC | 4 | 0 | Bán–thuê lại máy bay, nghĩa vụ thuê/nợ và cam kết đội bay. |
| VNM | 4 | 3 | Đã có DCF tiền công ty mẹ; còn cầu nối hiện tại và giả định đầu tư duy trì. |
| VPB | 0 | 0 | Rủi ro tín dụng theo phân khúc, NCI và lợi nhuận/giữ vốn bền vững. |
| VPL | 3 | 0 | Chỉ từ 2023; dòng tiền khách sạn, công suất, cải tạo, nợ và NAV phù hợp. |
| VRE | 3 | 0 | Khoản đầu tư 2023 gồm đặt cọc; tách cho thuê, chuyển nhượng và cổ phiếu quỹ. |

Cổ phần đang lưu hành theo hồ sơ công khai được giữ kèm cảnh báo bao gồm quyền tạm tính. Với BID, HDB, MBB, MSN, MWG, SHB, SSI, TCB, VRE, số này khác số niêm yết; không thay thế hai khái niệm cho nhau. Một số khác khớp số lượng nhưng việc khớp đơn thuần chưa nghiệm thu toàn bộ cầu nối quyền.

## Kiểm tra

- 70 kiểm thử tập trung đạt; bộ chuẩn hóa 13 kiểm thử đạt sau chỉnh assertion theo cấu trúc lỗi.
- 127 kiểm thử scoring và 43 kiểm thử API đạt; lint và typecheck đạt.
- Authority đã duyệt không đổi; 133 tệp lịch sử không đổi. Các pin R1/R2/R3 đều được đối chiếu lại.
- Chưa chạy toàn bộ repository. Kiểm thử xanh không thay cho nghiệm thu dữ liệu/giả định kinh tế.
- Hồ sơ thất bại lúc thử đường dẫn profile ban đầu vẫn được giữ trong manifest riêng; lần lấy profile đúng đường dẫn có đủ 30 mã.
- Không phát hành điểm vào production, không sửa seal lịch sử và không ghi giao dịch vào DB.
