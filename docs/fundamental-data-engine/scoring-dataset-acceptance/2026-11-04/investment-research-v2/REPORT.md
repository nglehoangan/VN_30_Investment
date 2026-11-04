# Xử lý 19 mã còn lại — nghiên cứu FY2025 v2

**19/19 mã đã được rà nguồn vốn, NCI và mô hình tham chiếu.** Đã kiểm tra20 trang PDF đầy đủ, đối chiếu dữ liệu extracted và ô nguồn CafeF. Giữ 11 hồ sơ đã tính ở v1 nguyên trạng. Không cần hồ sơ mua bán cá nhân và không có yêu cầu cung cấp tài liệu bổ sung hàng loạt.

Kết quả mới là kịch bản có giả định từ lợi nhuận/vốn, không phải19 giá trị hợp lý đã nghiệm thu. Ngân hàng/chứng khoán dùng mô hình lợi nhuận thặng dư trên vốn; doanh nghiệp hoạt động dùng độ nhạy lợi nhuận/vốn; nhóm hỗn hợp giữ vai trò kiểm tra chéo kế toán, không mang tên RNAV/SOTP. VIC không có điểm cơ sở; kết quả âm giữ nguyên.

| Mã | Vốn tham chiếu sau cầu nối NCI | LN làm việc | Khoảng kịch bản | Cơ sở tham chiếu | Mô hình/vai trò |
|---|---:|---:|---|---:|---|
| [BID](issuers/BID.md) | 167.989 | 19.745 | 58.894–192.231 | 156.008 | FINANCIAL_COMMON_CAPITAL_EXCESS_RETURN |
| [BSR](issuers/BSR.md) | 60.481 | 2.046 | -6.069–56.431 | 45.044 | CYCLICAL_EQUITY_RETURN_SENSITIVITY |
| [CTG](issuers/CTG.md) | 178.449 | 24.138 | 83.908–241.114 | 172.672 | FINANCIAL_COMMON_CAPITAL_EXCESS_RETURN |
| [GVR](issuers/GVR.md) | 56.309 | 4.189 | 22.354–52.315 | 46.954 | CYCLICAL_EQUITY_RETURN_SENSITIVITY |
| [HDB](issuers/HDB.md) | 75.570 | 16.339 | 79.254–136.495 | 86.563 | FINANCIAL_COMMON_CAPITAL_EXCESS_RETURN |
| [LPB](issuers/LPB.md) | 47.192 | 9.758 | 47.583–85.737 | 53.079 | FINANCIAL_COMMON_CAPITAL_EXCESS_RETURN |
| [MCH](issuers/MCH.md) | 18.062 | 6.667 | 22.645–55.560 | 26.758 | CONSUMER_EQUITY_RETURN_SENSITIVITY |
| [MSN](issuers/MSN.md) | 35.348 | 3.996 | 21.635–35.109 | 32.478 | MIXED_GROUP_ACCOUNTING_RETURN_CROSSCHECK_NOT_RNAV_OR_SOTP |
| [SAB](issuers/SAB.md) | 21.153 | 4.137 | 21.656–34.474 | 23.271 | CONSUMER_EQUITY_RETURN_SENSITIVITY |
| [SHB](issuers/SHB.md) | 68.131 | 8.993 | 35.211–81.867 | 65.437 | FINANCIAL_COMMON_CAPITAL_EXCESS_RETURN |
| [SSB](issuers/SSB.md) | 40.373 | 2.390 | 10.965–36.294 | 32.319 | FINANCIAL_COMMON_CAPITAL_EXCESS_RETURN |
| [STB](issuers/STB.md) | 59.867 | 5.292 | 28.344–56.849 | 51.763 | FINANCIAL_COMMON_CAPITAL_EXCESS_RETURN |
| [TCX](issuers/TCX.md) | 44.100 | 5.185 | 26.058–47.334 | 40.958 | FINANCIAL_COMMON_CAPITAL_EXCESS_RETURN |
| [VHM](issuers/VHM.md) | 238.079 | 33.020 | 183.443–306.146 | 232.164 | MIXED_GROUP_ACCOUNTING_RETURN_CROSSCHECK_NOT_RNAV_OR_SOTP |
| [VIB](issuers/VIB.md) | 46.905 | 5.390 | 20.978–52.349 | 43.290 | FINANCIAL_COMMON_CAPITAL_EXCESS_RETURN |
| [VIC](issuers/VIC.md) | 147.566 | Không chọn | -404.408–135.897 | Không chọn | UNIDENTIFIED_INCIDENCE_PARENT_RETURN_DIAGNOSTIC |
| [VJC](issuers/VJC.md) | 24.765 | -2.859 | -23.829–15.076 | Không chọn | AIRLINE_SIGNED_RETURN_AND_RECAPITALIZATION_SENSITIVITY |
| [VPB](issuers/VPB.md) | 167.903 | 17.255 | 43.827–184.137 | 150.478 | FINANCIAL_COMMON_CAPITAL_EXCESS_RETURN |
| [VPL](issuers/VPL.md) | 36.595 | 1.102 | 6.120–31.129 | 26.955 | MIXED_GROUP_ACCOUNTING_RETURN_CROSSCHECK_NOT_RNAV_OR_SOTP |

Đơn vị bảng: nghìn tỷ VND; số nguồn giữ native unit/precision. Khoảng chỉ bao các trường hợp lợi nhuận và chính sách lợi nhuận/vốn đã thử; không bao mọi quỹ, thuế, NCI, nợ xấu, khả năng thu hồi vốn hoặc quyền ưu đãi chưa xác định. Không dùng mức thấp như đáy rủi ro, không coi cao nhất là upside được xác nhận.

## Đã giải quyết trong vòng này

- Không còn lý do “chưa có mô hình cũ” để bỏ trống nghiên cứu 19 mã. Đã lập lựa chọn mô hình, phép tính và phản chứng theo hồ sơ từng mã.
- Bổ sung binding cột cuối kỳ31/12/2025 cho các trang LPB/VHM/VIC đang mang nhãn UNRESOLVED-YEAR-C1; giữ cột so sánh tách biệt. Bổ sung đường đọc TCX với khóa ngày 2025-12-31 và trang ở từng dòng; không nhầm khác schema với thiếu tài liệu/dữ liệu. VHM có số extracted NCI sai độ lớn: dùng bản đọc PDF kiểm tra, không sửa âm thầm JSON gốc.
- Đọc vốn nguồn thay vì tự coi TOTAL_EQUITY là vốn phổ thông. Tách NCI, phạm vi riêng, thành phần vốn không in NCI, nguồn kinh phí GVR và subtotal xung đột BSR.
- CafeF được phát lại tới ô raw và hash; do thiếu đơn vị/phạm vi khai báo, giữ để so sánh tham chiếu, không chọn số dựa trên bằng nhau hoặc tự thay PDF.
- Lợi nhuận v4 giữ nguyên; không dựng quỹ0, nhân thuế20% thêm, dùng tỷ lệ lợi nhuận làm sở hữu hoặc cộng/trừ tiền/nợ thêm.
- MSN: đọc thêm trang điều khoản ưu đãi/chuyển đổi và cam kết bù thiếu; chưa định giá cam kết thì giữ unknown. VPL không mang quyền ưu đãi2026 về vốn FY2025.

## Phần chưa giải quyết bằng một phép tính

Khả năng thu hồi vốn kế toán, thời gian duy trì ROE, vốn thực sự phân phối, cash capex duy trì/mở rộng, giá trị cam kết/quyền ưu đãi và dữ liệu dự án nếu chọn RNAV vẫn cần phản biện. Những khoảng tham chiếu không thay thế kiểm chứng này. Tài liệu đang có cho phép tiến phân tích, không tự chứng minh giá trị kinh tế của mọi tài sản.

Giá vẫn là tham chiếu30/10/2026; cầu nối quyền/pha loãng và giá hiện tại chưa hoàn tất. Không xuất tín hiệu mua/giữ/bán hoặc giá/cổ phần mới cho 19 mã. Có thể hoàn thiện từng mã riêng; không cần chờ kỳ thuế 2026 hay cả 30 mã đồng thời.

## Phương pháp và nguồn

Mô hình tài chính tham khảo cấu trúc vốn cộng PV lợi nhuận thặng dư của [Damodaran — Valuing Financial Service Firms](https://pages.stern.nyu.edu/~adamodar/pdfiles/papers/finfirm09.pdf). Thời gian hội tụ3/5/10 năm là độ nhạy do nhà phân tích đặt; không phải dữ kiện doanh nghiệp hoặc kết quả được nguồn phương pháp xác nhận. Suất18/15/12% kế thừa bộ nghiên cứu cũ, không thay tiêu chí tài chính/trọng số.

Hồ sơ chi tiết19mã có PDF/trang, số native, NCI/thành phần, số liệu dòng tiền đã giữ, pointer extracted/API/raw và điều kiện mua/giữ/bán.11 mã trước giữ nguyên trong thư mục issuers. Snapshot mới chỉ bổ sung nghiên cứu, không thay receipt nghiệm thu số liệu hoặc authority.
