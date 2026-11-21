# ACB — Bổ sung dữ liệu chủ sở hữu vào assessment V11

Ngày chốt 30/10/2026. Cùng dataset và BANK binding với [V10](ACB_ASSESSMENT_REVIEW_DRAFT_V10.json). Số liệu do chủ sở hữu cung cấp được sử dụng theo kỳ và phạm vi nêu dưới đây.

## FH-LIQ và FH-STRESS

Giữ khoản hợp vốn 500 triệu USD là một kênh huy động. Nếu giải ngân trước 30/09, luồng tiền và nghĩa vụ có thể đã phản ánh trong số đầu kỳ của phép thử; nếu sau 30/09, vẫn cần ngày giá trị, số thực rút, điều kiện và phần khả dụng ròng để tính bổ sung. Cả hai trường hợp hiện chưa đủ cơ sở cộng vào cầu nối. [Công bố ACB](https://acb.com.vn/ve-chung-toi/kqkd-acb-9-thang-2026-tin-dung-tang-115-fitchratings-nang-xep-hang-tin-nhiem-len-bb-trien-vong-on-dinh)

Đọc cùng [cầu nối 30 ngày](ACB_FH_30_DAY_LIQUIDITY_BRIDGE.md). Điều kiện tính tài sản bán/repo là đủ điều kiện theo kênh sử dụng, có giá trị sau haircut phù hợp, chưa bị ràng buộc và chưa nằm trong dòng tiền đến hạn. Loại theo từng tài sản hoặc lô để tránh trừ lặp giao giữa tài sản cầm cố và dòng đáo hạn. Mức haircut H1 trong hồ sơ là độ nhạy. Chưa có danh mục Q3 đủ chi tiết để áp mức quy định theo loại và kỳ hạn còn lại; số dư H1 không chuyển sang Q3.

Dùng [Basel LCR40](https://www.bis.org/committees/bcbs/basel-framework/standard/lcr/40/inforce/2019-12-15/published/2019-12-15) làm mốc hệ số cho phép thử biên. Giả định 0% tái tục trên hai bucket gộp TCTD và GTCG để thử trường hợp tài trợ bán buôn không bảo đảm không tái tục, với giả định giữ nguyên tài sản vào hạn hợp đồng. Bucket gộp thực tế có thể gồm tài trợ bảo đảm hoặc giấy tờ bán lẻ, nên đây là kịch bản áp giả định lên cả nhóm, không phải phân loại Basel đã xác minh. Với tiền gửi khách hàng, dùng các mốc duy trì 60%, 90% và 95% tương ứng với run-off 40%, 10% và 5% của các nhóm minh họa theo Basel. Phải tách đối tác, tính ổn định, bảo hiểm, kỳ hạn, bảo đảm và đủ điều kiện HQLA trước khi tính LCR thực tế. Tỷ lệ CASA 22% không xác định các nhóm đó.

| Duy trì KH trong bucket tháng đầu | Gap ở 0% / 0%, tỷ đồng |
| ---: | ---: |
| 60% | +47.764,545 |
| 90% | −19.905,788 |
| 95% | −31.184,176 |

Ngưỡng hòa vốn là 81,18%. Khoảng kết quả tiếp tục đổi dấu. Phép thử minh họa độ nhạy của cầu nối, chưa tính các điều chỉnh phía tài sản, giới hạn inflow hoặc các dòng ngoại bảng của LCR và chưa xác định tỷ lệ khả năng chi trả pháp định. FH-LIQ và FH-STRESS giữ mở. M1 giữ review CLOSED, riskOutcome PENDING.

## RG-GOV và RG-RISK

Lưu cờ nghiên cứu về việc chưa thấy điều khoản và bằng chứng thực thi kiểm soát giao dịch 4490. Cờ này yêu cầu chủ động theo dõi; không phát hiện giao dịch sai phạm. Giữ phân tích thanh khoản, tín dụng và vốn ở Financial Health; ghi riêng rủi ro chuyển lợi ích liên quan, không tự trừ điểm tổng hoặc khấu trừ trên cùng một rủi ro. Kịch bản loại trừ tài sản/phải thu chỉ thực hiện khi xác định được khoản mục, số dư, phạm vi, giao dịch và tác động vốn thực tế hoặc tham số độ nhạy rõ ràng. Chưa có số dư định danh, nên giữ hai rubric mở. [Hồ sơ Nghị quyết 4490](ACB_USER_PDF_REVIEW.md)

## CA-REINV

Đề xuất **1/2 Mixed / acceptable** ở mức nghiên cứu. ACBS tăng vốn 3.000 tỷ tháng 02 và 1.000 tỷ tháng 04/2025. Theo số liệu đã cung cấp, LNTT FY2025 khoảng 1.254 tỷ, tăng 48%. Suy ra LNTT FY2024 khoảng 847 tỷ và chênh lệch khoảng 407 tỷ. Vốn góp tăng bình quân theo thời gian khoảng 3.167–3.500 tỷ nếu giả định góp cuối hoặc đầu tháng. Chênh lợi nhuận chia số vốn tăng bình quân khoảng 11,6–12,8% trước thuế, chỉ là phép thử tổng hợp; còn chịu tác động của margin, tài trợ và chu kỳ giao dịch. LNST hợp nhất FY2025 khoảng 1.018 tỷ là số cả năm; so sánh cùng kỳ 9T được trình bày riêng.

LNTT ACBS 9T2026 khoảng 793 tỷ, Q3 khoảng 212 tỷ, suy ra H1 khoảng 581 tỷ theo số làm tròn do chủ sở hữu cung cấp. Nguồn ACBS tháng 11 ghi LNST hợp nhất 9T2026 khoảng 634 tỷ, giảm 13,8% YoY và cho vay tăng 30,5% từ đầu năm. Dùng công bố tháng 11 làm bằng chứng hồi cứu, lưu riêng ngày công bố; kỳ tài chính đã có BCTC ACBS Q3 công bố ngày 20/10. Tăng dư nợ đi cùng giảm lợi nhuận cùng kỳ là phản chứng cho band cao. Quyết định tăng vốn ACBS lên 13.000 tỷ có điều kiện, chưa dùng làm vốn thực góp. Phần khoảng 307 tỷ của nhóm ngoài ACBS là số dư suy từ tổng làm tròn, chưa quy riêng cho AMC. Vốn AMC tăng 500 tỷ FY2025 và 2.000 tỷ H1/2026 theo sổ riêng ACB. Hiệu quả riêng của AMC và thời gian vốn thực hoạt động còn thiếu. [Báo cáo thường niên ACBS FY2025](https://acbs.com.vn/acbsmedia/2026/03/CBTT-Bao-cao-thuong-nien-nam-2025-_-En.pdf) · [Kho BCTC ACBS](https://acbs.com.vn/cong-bo-thong-tin/bao-cao-tai-chinh) · [Bản cáo bạch công bố sau cutoff](https://acbs.com.vn/acbsmedia/2026/11/20261117-VNM.ACBS_.9M.136-CBTT-Thong-bao-phat-hanh-BCB.pdf) · [Cầu nối vốn ACB](ACB_OPEN_RUBRIC_REVIEW_V10.md)

Mức 1 phản ánh kết quả phân bổ quan sát được tại ACBS theo hai kỳ và đồng thời giữ giới hạn AMC. Giữ hiệu quả tăng thêm cấp ngân hàng tại GQ-INC, tránh chấm lặp. Để quyết định band chính thức, ưu tiên LNST hợp nhất cùng kỳ theo công ty con, dùng LNTT bổ sung để phân tích vận hành, và ghép vốn thực góp/vốn thực triển khai theo thời gian. Quý và bán niên dùng thử độ trễ, FY dùng đối chiếu hiệu quả qua chu kỳ. Điều kiện mở lại là dữ liệu AMC, ngày vốn triển khai hoặc kết quả cùng kỳ cho thấy hiệu quả tăng bền vững hay suy giảm lặp lại.
