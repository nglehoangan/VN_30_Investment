# ACB — Cầu nối thanh khoản 30 ngày cho FH-LIQ và FH-STRESS

ACB/HOSE, ngày chốt 30/10/2026. Số dư thanh khoản hợp nhất ở 30/09/2026. BANK binding `current-bank-coverage:bff83724df834f2b29a7a4d0a3a3b573ab466aa2c2d4f72ab23f9b42b2825119`. [Reference](ACB_BANK_SCORING_REFERENCE.json)

## Cầu nối từ kỳ hạn hợp đồng

Bảng Q3 trang PDF 34 ghi 201.427,863 tỷ đồng tài sản và 384.533,072 tỷ đồng nợ ở cột đến một tháng, chênh lệch **−183.105,209 tỷ**. Trong số nợ đã tính có 130.358,815 tỷ tiền gửi và vay TCTD khác, 12.396,673 tỷ giấy tờ có giá và 225.567,774 tỷ tiền gửi khách hàng. Nhóm TCTD là dòng gộp tiền gửi và khoản vay. Rollover áp vào toàn dòng chỉ là giả định vì bảng này không tách kỳ hạn từng loại.

`Gap còn lại = 183.105,209 − 130.358,815 × r_TCTD − 12.396,673 × r_GTCG − 225.567,774 × r_KH − S`.

Các tỷ lệ áp riêng lên nhóm đến hạn trong tháng đầu. `r_KH` là phần giả định duy trì hoặc tái tục qua ngày 30, bao gồm hành vi tiền gửi ngắn hạn trong bucket, không dùng cho phần ngoài bucket. `S` là nguồn bù mới đã xác minh sau haircut và khử trùng. Gap dương là thiếu, âm là dư trên giả định của dòng đó. Không trừ các khoản đến hạn lần nữa. [BCTC Q3 trang PDF 34](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/ACB_Baocaotaichinh_Q3_2026_Hopnhat.pdf#page=34). PDF Q3 lưu giữ SHA-256 `1c0453b0ee4725946bd18bf5204177f2a705edcbfc29e746c403d340d5498315`.

## Nguồn bù và kiểm soát trùng

Thuyết minh H1 10.1 và 34.2 khớp chứng khoán đầu tư đã bảo đảm **44.956,364 tỷ**, gồm **43.953,584 tỷ** chứng khoán Chính phủ và **1.002,780 tỷ** giấy nợ TCTD. Trong phần Chính phủ, khoản bảo đảm vay NHNN **17.878,867 tỷ** và repo KBNN **6.496,394 tỷ** ở thuyết minh 15 đã nằm trong tổng, nên không cộng hoặc trừ thêm. Từ tổng 51.033,158 tỷ chứng khoán Chính phủ H1 còn **7.079,574 tỷ ngoài danh sách bảo đảm công bố**. Haircut độ nhạy 10–20% cho **5.663,659–6.371,617 tỷ**, mốc 15% là **6.017,638 tỷ**. Đây là phép thử H1, chưa xác minh khả dụng Q3, quyền repo, giá trị thị trường hoặc trùng dòng tiền. [Notes H1 lưu giữ, trang PDF 51, 59–60 và 71](../../../../../data/manual-extracted-pdf/notes/ACB.json)

Cầu nối Q3 chưa cộng thêm nguồn bù chưa xác minh. Đặc biệt, bảng kỳ hạn đã tính **2.710,410 tỷ chứng khoán đầu tư**, **6.709,432 tỷ chứng khoán kinh doanh** và **86.854,942 tỷ tiền gửi/cho vay TCTD khác** trong dòng tài sản tháng đầu. Chỉ cộng khoản có bằng chứng khả dụng thêm, hoặc loại dòng đáo hạn tương ứng trước nếu mô phỏng bán/repo sớm. Hạn mức cần bằng chứng cam kết còn rút được và tài sản bảo đảm phù hợp. Tránh ghi cả tiền bán và tiền repo cho cùng tài sản. Giá trị chưa xác minh trong mô hình để trống và kịch bản cơ sở không cấp tín dụng cho nguồn đó.

## Mức tái tục hòa vốn

Đơn vị tỷ đồng, làm tròn. Cột H1 áp độ nhạy giả định **6.018 tỷ** khả dụng bổ sung, chưa xác minh và không được dùng làm nguồn Q3 trong kết luận.

| Tái tục TCTD/GTCG | Khách hàng duy trì | Gap Q3 trước nguồn bù mới | Gap nếu cộng độ nhạy H1 | Khách hàng cần duy trì để hòa vốn trước nguồn bù |
| --- | ---: | ---: | ---: | ---: |
| 50% / 50% | 0% | +111.727 | +105.710 | 49,53% |
| 75% / 75% | 0% | +76.039 | +70.021 | 33,71% |
| 100% / 100% | 0% | +40.350 | +34.332 | 17,89% |
| 75% / 75% | 25% | +19.647 | +13.629 | 33,71% |
| 100% / 100% | 20% | −4.764 | −10.781 | 17,89% |
| 50% / 50% | 50% | −1.056 | −7.074 | 49,53% |

Nếu áp cùng một tỷ lệ cho cả ba nhóm, hòa vốn ở **49,71%** trước nguồn bù. Nếu khách hàng không duy trì tiền gửi và chỉ trông vào TCTD/GTCG, cần **128,26%**, vượt 100%. Ngay ở kịch bản tái tục hai nhóm 100% và giả định cộng độ nhạy H1 15%, khách hàng vẫn phải duy trì **15,22%**. Không gán xác suất cho các kịch bản vì số dư cuối kỳ không quan sát được vòng quay và tái tục thực tế.

## Kết luận và bước cập nhật

- **FH-LIQ:** khoảng thiếu có thể bù bằng một số tổ hợp tái tục/giữ chân quan sát được về mặt số học. Chưa đủ chứng cứ để chọn tổ hợp đại diện và chứng minh nguồn bù ngoài dòng tiền. Giữ band mở.
- **FH-STRESS:** kịch bản TCTD/GTCG tái tục 75%, khách hàng duy trì 25% còn thiếu 19.647 tỷ trước nguồn bù. Kịch bản 50% cho hai nhóm và 0% khách hàng thiếu 111.727 tỷ. Cần chứng cứ về độ khả thi của nguồn bù và chi phí/tổn thất huy động để nối vào mô hình vốn. Không cộng gap thanh khoản vào lỗ vốn. [Kiểm tra ngược vốn](ACB_RESILIENCE_AND_CAPITAL_REVERSE_STRESS.md)
- Khi có BCTC kiểm toán FY2026, đối chiếu mục chứng khoán đầu tư, vay NHNN/repo, tài sản đưa đi cầm cố và bảng kỳ hạn. Tìm danh mục có thể bán/repo, hạn mức còn rút và phần đáo hạn trong cột 30 ngày. Số tại 31/12 được giữ theo kỳ công bố riêng, chưa thay được bằng chứng Q3. Nếu có bảng tái lập Q3 hoặc dữ liệu ở cấp tài sản, dùng đúng kỳ và phạm vi rồi chạy lại cầu nối.
- M1 giữ review CLOSED, riskOutcome PENDING. Chưa đủ căn cứ ghim review chính thức cho hai rubric này.
