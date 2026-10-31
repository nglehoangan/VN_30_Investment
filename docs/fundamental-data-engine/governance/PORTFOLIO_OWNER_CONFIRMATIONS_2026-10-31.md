# Xác nhận đã lưu — đối soát danh mục cá nhân

Mã hồ sơ: `PORTFOLIO-OWNER-CONFIRMATIONS-2026-10-31-R1`. Ngày lưu: 31/10/2026. Thẩm quyền: yêu cầu trực tiếp của chủ tài khoản trong hội thoại, không phải chữ ký số hoặc nghiệm thu production.

**Năm mục dưới đây đã đủ căn cứ để lưu kết luận trong phạm vi đối soát cá nhân. Không yêu cầu chủ tài khoản xác nhận lại.** Bản ghi có cấu trúc và nguồn/hash/JSON Pointer: [PORTFOLIO_OWNER_CONFIRMATIONS_2026-10-31.json](PORTFOLIO_OWNER_CONFIRMATIONS_2026-10-31.json).

| Mục | Kết luận đã lưu | Cách xử lý |
| --- | --- | --- |
| TCB | API tài khoản nhận ngày 29/10: tổng 150 = 100 giao dịch được + 50 `stockDividend` pending. | 50 là quyền/cổ phiếu thưởng chờ, không phải mua mới và không phải 150 đã giao dịch được. Ledger/read model cũ chưa phản ánh phần pending này. |
| Cash 95.000đ | Sao kê tiền ghi nhận cổ tức MWG ròng 95.000đ ngày 16/10, ngày chốt 08/10. | 232.420 + 95.000 = 327.420đ. Đây là khoản đã nhận, không phải tiền thiếu hoặc cần tạo bút toán điều chỉnh để khớp. |
| Phải thu → tiền | Khoản MWG 95.000đ đã chuyển từ chờ nhận sang tiền; tổng chờ còn 475.000đ. | 570.000 − 95.000 = 475.000đ. Không cộng thêm 95.000 vào tiền hiện đã gồm khoản này; không trừ thêm 95.000 khỏi 475.000. |
| Phí lưu ký 420đ | Chủ tài khoản đã xác nhận đây là phí phải trả tại 28/10, tích lũy hằng ngày và trừ cuối tháng. | Không coi đã thanh toán; không suy mức phí/ngày, số cuối tháng hoặc ngày trừ thực tế. NAV broker đã trừ phí này nên không trừ lần nữa. |
| FPT | 220 sở hữu = 200 giao dịch được + 20 pending `FPT_WFT`. | Ghi nhận phần sở hữu chờ; chỉ đổi khả năng giao dịch khi có chứng cứ chuyển trạng thái, không cộng thêm 20 lần nữa. |

## Căn cứ đã kiểm tra lại

- [Đối soát tiền và xác nhận phí của chủ tài khoản](../evidence/2026-10-28-b2-cash-excel-screen-review/REVIEW.md) đã ghi rõ tiền, cổ tức chờ, phí, ngày ảnh và cơ chế trừ cuối tháng. Không hỏi lại bản chất 420đ.
- [Dữ liệu sao kê tiền đã kiểm tra](../evidence/2026-10-28-b2-cash-excel-screen-review/CASH_HISTORY.json), pointer `/reports/1/rows/57`: workbook tiền 2026, dòng 71, các ô A71–E71, mô tả nêu rõ MWG và ngày chốt. Số dư sau nhận là 327.420đ. Không chỉ nối bằng số tiền trùng nhau.
- API 4.14 tại mốc mở đầu 08/10 có `MWG.cashDividend=95000` và `GAS.cashDividend=475000`. API 4.14 nhận 29/10 có MWG pending cash bằng 0; TCB có 100 available + 50 stockDividend; FPT có 200 available + 20 stockDividend. Hai body được kiểm tra hash trực tiếp từ SQLite ở chế độ chỉ đọc; bản JSON mới giữ ID, hash, thời điểm nhận và pointer, không sao chép thông tin tài khoản riêng.
- [Quyết định nguồn/nhận diện FPT đã có](../evidence/2026-10-28-b1-excel-source-policy/CURRENT_POLICY.json) và [quy tắc cổ tức chờ đã có](../evidence/2026-10-28-b4-pending-dividend-policy/README.md) tiếp tục áp dụng. Không yêu cầu gửi lại Excel, ISIN hoặc chuỗi PDF để xác nhận lại các dữ kiện này.

TCB 50 pending được xác minh bằng API đã giữ và được chủ tài khoản yêu cầu lưu trong lượt 31/10. Không gán ngược thành một xác nhận cụ thể về TCB đã có ngày 28/10. Các quan sát 28/10 và API 29/10 giữ ngày riêng; hồ sơ này không giả làm snapshot tài khoản mới của ngày 31/10.

Nguồn ảnh 28/10 không xác định mã của tổng pending475.000; giữ nguyên giới hạn đó. API 29/10 có nhãn GAS riêng là quan sát bổ sung có ngày, không sửa hồi tố nhãn nguồn ảnh. Không cần phân bổ theo mã chỉ để lưu/hiển thị tổng chờ đã được xác nhận.

## Phân loại lại phần còn làm sau Phase A1

- `PA1-C01`: dữ kiện TCB và phân loại pending đã xác minh; việc áp dụng vào ledger/read model chưa thực hiện. Không còn là câu hỏi chờ chủ tài khoản xác nhận 50 cổ phiếu.
- `PA1-M02`: đã xác định chênh 95.000đ, cổ tức đã nhận và bản chất 420đ. Cầu nối kinh tế được lưu; việc ghi nhận kế toán/admission kỹ thuật không được mô tả lại thành thiếu xác nhận của chủ tài khoản.
- `PA1-M05`: đã có xác nhận sở hữu pending FPT/TCB và quy tắc chuyển trạng thái. Ngày chuyển thực tế chưa biết thì giữ null; không cần hỏi lại quy tắc hoặc tự dựng một ngày để hoàn tất hồ sơ.

Hồ sơ [assessment Phase A1](PORTFOLIO_PRODUCTION_ACCEPTANCE_ASSESSMENT.md) được giữ nguyên như đánh giá tại thời điểm lập. Bản này là **bổ sung kết luận và chỉ dẫn không hỏi lặp lại**, không sửa seal hoặc giả rằng các bút toán đã được post. Câu hỏi cho chủ tài khoản trong phạm vi năm mục hiện tại: **không có**.

## Quy tắc cho các lần xử lý tiếp theo

1. Đọc hồ sơ này trước khi phát sinh yêu cầu bổ sung liên quan năm mục.
2. Tái sử dụng nguồn, xác nhận và pointer đã lưu. Việc ledger chưa cập nhật hoặc thiếu binding phần mềm là công việc triển khai/kiểm định, không phải lý do hỏi lại dữ kiện đã rõ.
3. Không tạo thêm tiền, cổ phiếu, giao dịch mua hoặc thu nhập để khớp số. Cổ phiếu thưởng bảo toàn tổng giá vốn; nhận tiền cổ tức không được ghi nhận kép thu nhập/phải thu.
4. Nếu có sự kiện mới hoặc nguồn mới mâu thuẫn, chỉ nêu đúng phần mới cần giải quyết; không mở lại toàn bộ xác nhận cũ. Ưu tiên đọc chứng cứ sẵn có, giữ unknown cho metadata chưa có.
5. Xác nhận dữ kiện không tự cấp quyền production NAV/scoring, source promotion, ledger posting hoặc sửa opening balance. Bản ghi này không đổi runtime hay DB. Các gate production khác vẫn độc lập.

Đã thêm chỉ dẫn vào [AGENTS.md](../../../AGENTS.md) để các lượt xử lý sau tìm được hồ sơ này. Chỉ lưu hồ sơ xác nhận; không sửa code, không hạch toán, không migrate hay bật production.
