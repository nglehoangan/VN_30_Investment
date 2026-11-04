# ACB — hồ sơ nghiên cứu FY2025

Trạng thái: **ADVANCED_TO_REVALUED_SCENARIOS**. Phạm vi lợi nhuận làm việc: **CONSOLIDATED**. Đây là nghiên cứu hiện tại trên kỳ FY2025, không tái dựng thông tin biết tại năm2025.

Lợi nhuận làm việc: **15.525 nghìn tỷ VND**. Lựa chọn: Giữ chi phí tín dụng thực tế, bác addback dự phòng dương; quỹ 100 tỷ đã ở tử số nguồn, không trừ lại.

## Dòng tiền/vốn

Chi tiết số liệu, kỳ, phạm vi và nguồn ở JSON cạnh hồ sơ. CFO nhóm không tự là FCFE; số vốn không tự chứng minh khả năng phân phối. Tiền/nợ không được cộng/trừ lần nữa nếu lợi nhuận đã giữ thu nhập tài chính và lãi vay.

Vốn phổ thông tham chiếu H1/2026: **99.315 nghìn tỷ VND**; ROE đầu vào được tính từ lợi nhuận v4/vốn tham chiếu, không áp lại ROE mục tiêu cũ của ACB. Mức giữ lại/phân phối vốn vẫn có điều kiện.

| Chỉ tiêu tham chiếu | Ngày | Phạm vi | Giá trị chuẩn hóa / đơn vị |
|---|---|---|---:|
| BANK_GROSS_CUSTOMER_LOANS | 2025-12-31 | CONSOLIDATED | 686777352000000 / CURRENCY |
| TOTAL_EQUITY | 2025-12-31 | CONSOLIDATED | 94519719000000 / CURRENCY |
| BANK_REPORTED_CAR | 2026-06-30 | CONSOLIDATED | 0.118 / RATIO |
| BANK_REPORTED_CAR | 2025-12-31 | CONSOLIDATED | 0.1245 / RATIO |
| BANK_GROSS_CUSTOMER_LOANS | 2026-06-30 | CONSOLIDATED | 745759303000000 / CURRENCY |
| BANK_LOAN_LOSS_RESERVES | 2025-12-31 | CONSOLIDATED | 7507253000000 / CURRENCY |
| TOTAL_EQUITY | 2026-06-30 | CONSOLIDATED | 99314518000000 / CURRENCY |
| BANK_LOAN_LOSS_RESERVES | 2026-06-30 | CONSOLIDATED | 7947868000000 / CURRENCY |

Tổng vốn chủ không tự là vốn phổ thông; tiền báo cáo không tự là tiền không hạn chế. Đây là đầu vào rà soát giữ nguyên trạng thái, không phải nghiệm thu mới.

## Khoảng định giá có điều kiện

Tính lại từ lợi nhuận v4; giữ các giả định tăng trưởng/chiết khấu/tái đầu tư cũ có nhãn, không áp lại hệ số chu kỳ hoặc haircut quỹ cũ. Khoảng dưới chỉ là các kịch bản đã đặt, không bao mọi rủi ro thuế/quỹ/NCI.

| Kịch bản | Giá trị vốn chủ (nghìn tỷ VND) |
|---|---:|
| BEAR | 84.615 |
| BASE | 104.756 |
| BULL | 105.303 |

Khoảng: **84.615–105.303 nghìn tỷ VND**. Chưa nghiệm thu giá trị hợp lý.

## Cổ phần và ngày giá

Giá tham chiếu DB: **21000 VND**, phiên **2026-10-30**; không phải giá hiện tại ngày04/11. Điều chỉnh giá: `PROVIDER_UNDECLARED`.

Mốc cổ phần nguồn: 2026-09-30. Cầu nối tới ngày giá: **chưa hoàn tất**.

| Mẫu số tham chiếu nhà cung cấp | Số cổ phần | Giá trị/cổ phần cơ sở có điều kiện (VND) |
|---|---:|---:|
| listed | 5804421957 | 18047.577007 |
| outstanding | 5804421957 | 18047.577007 |

Tỷ lệ giá trị/cổ phần BASE trên giá ngày 2026-10-30 với mẫu số listed: **0.859408 lần**. Đây là phép so sánh có điều kiện, không phải biên an toàn đã nghiệm thu.

Tỷ lệ giá trị/cổ phần BASE trên giá ngày 2026-10-30 với mẫu số outstanding: **0.859408 lần**. Đây là phép so sánh có điều kiện, không phải biên an toàn đã nghiệm thu.

Các mẫu số tham chiếu không thay thế quyền phổ thông đã đối chiếu. Không tự coi hai mẫu số khác nhau là khoảng pha loãng đầy đủ.

## Điều kiện mua / giữ / bán

- **Mua:** Chỉ xem xét mua khi giá cùng ngày và mẫu số đã khớp, mô hình/nghĩa vụ đủ căn cứ, đáp ứng biên an toàn và suất sinh lợi theo tiêu chí hiện hành; chưa tự cấp tín hiệu từ bảng này.
- **Giữ:** Chỉ xem xét giữ khi luận điểm kinh doanh còn đúng, quyền cổ đông và khả năng tài trợ không suy giảm; định giá và tỷ trọng vẫn phù hợp. Giữ không phải lựa chọn mặc định khi thiếu dữ liệu.
- **Bán/giảm:** Xem xét bán/giảm khi luận điểm bị bác, nghĩa vụ/quyền pha loãng làm mất giá trị hoặc giá vượt khoảng giá trị có cơ sở sau kiểm tra lại; không bán chỉ vì một mô hình có điều kiện cho kết quả thấp.

**Điều kiện riêng trước hành động:** Dân số khoản vay/dự phòng và vốn còn lại sau tăng trưởng.

**Điểm cần kiểm chứng riêng:** Chu kỳ tín dụng và tổn thất theo dân số khoản vay chưa được xác nhận đầy đủ.

**Tín hiệu hiện tại: chưa xác định.** Các điều kiện trên là khung nghiên cứu, không phải lệnh hoặc nhãn HOLD mặc định. Không cần đợi đủ cả30 mã; hồ sơ này có thể tiến riêng khi các ràng buộc của chính mã được khép.
