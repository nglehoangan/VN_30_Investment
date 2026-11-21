# ACB — Kiểm tra giá trị trên mỗi cổ phần sau điều chỉnh chu kỳ

Ngày chốt 30/10/2026. BANK binding `current-bank-coverage:bff83724df834f2b29a7a4d0a3a3b573ab466aa2c2d4f72ab23f9b42b2825119`. Phạm vi đối chiếu tài chính FY2022–2025. [Chuỗi vốn và tử số EPS](ACB_HISTORICAL_ROE_SHARE_AND_CAPITAL_REVIEW.md)

## Cầu nối lợi nhuận

Dùng tử số EPS công bố trong BCTC kiểm toán. Thay chi phí dự phòng thực tế bằng 55/65/80 bp nhân dư nợ gộp bình quân hai đầu kỳ và loại tiền thu hồi nợ đã xử lý một lần khỏi thu nhập khác. Áp thuế biên giả định 20% lên khoản điều chỉnh. Chưa loại các khoản bất thường khác chưa đối chiếu nhất quán. Mốc 65 bp giữ cùng phép thử trước và dùng 55–80 bp để kiểm tra độ nhạy.

Đã đối chiếu dòng tiền và thuyết minh thu nhập khác trong JSON đã lưu. Thu hồi nợ đã xử lý FY2022–2025 lần lượt **786.804 / 880.179 / 740.938 / 1.084.336 triệu VND**. FY2022–2023 dùng cặp số BCTC FY2023 trang PDF 11 và 67, FY2024 dùng FY2024 trang 11 và 69 và đối chiếu FY2025 trang 11 và 69. [Notes ACB lưu giữ](../../../../../data/manual-extracted-pdf/notes/ACB.json) · [BCTC kiểm toán FY2025, thuyết minh 29](https://acb.com.vn/acbwebsite/files/ACB-FS2025-Consol-VN_searchable.pdf#page=69)

| Kỳ | BVPS, đồng | Lợi nhuận/cp sau chuẩn hóa 65 bp, đồng | ROE dùng vốn cuối kỳ | Giá trị P/B mô phỏng, đồng |
| --- | ---: | ---: | ---: | ---: |
| FY2022 | 10.068 | 1.886 | 18,74% | 13.202 |
| FY2023 | 12.224 | 2.462 | 20,14% | 17.461 |
| FY2024 | 14.379 | 2.464 | 17,14% | 16.942 |
| FY2025 | 16.284 | 2.417 | 14,84% | 16.071 |

Mẫu số so sánh giữ cố định 5.804.421.957 cổ phần. P/B mô phỏng = (ROE cuối kỳ − 3%)/(15% − 3%). Giữ cùng Ke/g để cô lập hiệu quả sinh lời và vốn qua các năm. Giá trị mô phỏng hiện tại theo cách này không phải giá thoát của VAL-RET. Lợi nhuận/cp 2023–2025 giảm **0,78% đến 3,50%** ở mọi mức dự phòng trong dải đã thử. Mốc FY2022 thấp hơn và tạo phản chứng về điểm xuất phát.

## Tách cổ tức và kiểm tra compounding

Cộng cổ tức tiền mặt theo quyền FY2023 và FY2024 thực hiện trong 2024–2025, bằng **1.439 đồng** quy đổi về một cổ phần trên cơ sở ngày chốt. Không cộng cổ tức FY2025 thực hiện trong 2026 vào cửa sổ kết thúc FY2025. Giữ cổ tức cổ phiếu trong mẫu số quyền. Đây là cầu nối gộp giá trị mô hình cuối kỳ và phân phối tiền, chưa phải tổng lợi suất giao dịch, chưa tính thuế, tái đầu tư hay chiết khấu ngày chi. [VSDC FY2023](https://vsdc.vn/vi/ad/171314) · [VSDC FY2024](https://vsdc.vn/vi/ad/182839)

| Dự phòng chuẩn | Lợi nhuận/cp FY2023 → FY2025 | Thay đổi giá trị mô hình cộng cổ tức |
| --- | ---: | ---: |
| 55 bp | −0,78% | +1,44% |
| 65 bp | −1,83% | +0,28% |
| 80 bp | −3,50% | −1,60% |

**CA-PSV: đề xuất band nghiên cứu 0 — Evidence does not demonstrate real compounding.** Căn cứ là mức sinh lời trên vốn giảm và lợi nhuận/cp suy yếu qua cả ba mức dự phòng từ FY2023. Cổ tức bù phần lớn giảm giá trị mô phỏng, nhưng kết luận giá trị cộng cổ tức đổi dấu theo giả định và kết quả dương từ mốc FY2022 phụ thuộc điểm xuất phát. Đây là kết luận về sức mạnh bằng chứng, không quy kết ban điều hành phá hủy giá trị. Điều kiện đổi band là chuỗi chuẩn hóa đầy đủ qua chu kỳ hoặc mô hình giá trị/cp sau quyền và cổ tức chứng minh mức tăng bền vững. Giữ phạm vi nghiên cứu và chưa ghim vào review chính thức.
