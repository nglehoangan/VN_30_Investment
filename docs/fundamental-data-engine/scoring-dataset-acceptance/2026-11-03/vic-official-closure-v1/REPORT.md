# VIC — kết quả bổ sung nguồn chính thức, 03/11/2026

Quyền nghiên cứu VinFast IR và SEC EDGAR đã được chủ sở hữu chấp thuận. Yêu cầu chờ quyền tại `../vic-tax-attribution-v1/` là lịch sử, được thay thế bởi `owner-source-authorization.json`. Không có quyền admission production, posting, NAV, giao dịch hoặc thay đổi rubric/trọng số.

## Những điểm đã xử lý

| Vấn đề | Kết quả | Nguồn/giới hạn |
|---|---|---|
| Thuế khoản tài trợ | SEC xác nhận tài trợ tiền chịu thuế tại Việt Nam; không được mặc định miễn thuế. Tác động trong bảng đối chiếu thuế không phải thuế thực tế của từng sự kiện. | [Note 19](https://www.sec.gov/Archives/edgar/data/1913510/000110465926052266/R27.htm), US GAAP, VND triệu; không thay bảng thuế VAS. |
| Novatech: chuẩn mực | US GAAP ghi chênh lệch giao dịch cùng kiểm soát vào vốn; VIC VAS ghi lãi. Không lấy biến động vốn NCI để chia lãi VAS. | [Note 3](https://www.sec.gov/Archives/edgar/data/1913510/000110465926052266/R11.htm). |
| Quyền ưu đãi | DPS2 là công cụ nợ đo theo giá trị hợp lý; các DPS khác có quyền cổ tức có điều kiện và điều khoản chuyển đổi thay đổi. Tỷ lệ cuối năm không chứng minh phân bổ lợi nhuận tại sự kiện. | [Note 22](https://www.sec.gov/Archives/edgar/data/1913510/000110465926052266/R30.htm). |
| Bản quyền | Phụ lục ký 20/11/2025 quy định phí cố định 25.198.912.075.650 đồng cho toàn thời hạn, áp dụng từ ngày hiệu lực 22/08/2025. Số chính xác hơn không tạo thêm chi phí 75.650 đồng. Không suy diễn phí hàng năm từ dự báo. | [Schedule 3](https://www.sec.gov/Archives/edgar/data/1913510/000110465926052266/vfs-20251231xex4d31.htm), Điều 2.1 và 3.1. |
| Thuế bản quyền | Điều khoản phân bổ thuế chồng lấn, một số điều kiện bị che. Không thể suy ra số thuế TNDN thực tế từ hợp đồng. | [Agreement](https://www.sec.gov/Archives/edgar/data/1913510/000110465926052266/vfs-20251231xex4d30.htm), Điều 5.3(b)–(d). |
| Kiểm tra nghiệm thu | Validator chỉ đọc, kiểm tra sự kiện/đơn vị/ngày/kỳ/chuẩn mực/phạm vi/giá trị và đồng nhất sau thuế = mẹ + NCI. Chặn bảng thuế tổng hợp, thuế trả tiền, DTA gộp, tỷ lệ sở hữu và biến động vốn khi gán làm P&L sự kiện. | `scripts/lib/vic_event_admission.py`; hai đề xuất thực tế đều bị chặn. Hoàn chỉnh chứng cứ sự kiện cũng không tự nghiệm thu toàn mô hình. |

## Những gì vẫn chưa thể khép

Cả tài trợ và lãi Novatech còn thiếu phân bổ **thuế hiện hành, thuế hoãn lại, lợi nhuận sau thuế thuộc mẹ và NCI theo VAS trong phạm vi hợp nhất VIC**. Các giá trị thiếu giữ `null`; không chọn 0%, 10%, 20% hay 50,60% làm dữ kiện đã kiểm chứng. Phí bản quyền, tiền thu bán cổ phần, lãi bán và biến động vốn là các phép đo khác nhau; không cộng/trừ thay thế nhau.

Cần báo cáo tài chính **VAS năm 2025 đã kiểm toán của CTCP Sản xuất và Kinh doanh VinFast**, gồm thuyết minh thuế, giao dịch Novatech/tài trợ và quyền cổ phần ưu đãi; nếu báo cáo không đủ chi tiết, cần bảng đối chiếu kiểm toán cho thuế và phân bổ mẹ/NCI đến VIC. Không cần gửi lại báo cáo công ty mẹ VIC đã có. Chưa chứng minh rằng tài liệu này không thể tìm ở mọi nguồn; trong các nguồn công khai đã kiểm tra chưa lấy được bản đủ dùng. [Thông báo chính thức](https://vinfastauto.com/vn_vi/thong-bao) nêu tiếp cận tài liệu cho người sở hữu trái phiếu tại TCBS; không thực hiện tiếp cận riêng tư.

Các yêu cầu cũ về quỹ, phân loại lãi chuyển nhượng còn lại, chu kỳ và mẫu số cổ phần vẫn mở. Chưa có mức lợi nhuận chuẩn hóa hoặc EPS được nghiệm thu cho VIC.

## Lineage và kiểm chứng

`official-findings.json` là các đọc hiểu dẫn xuất từ công cụ web, có URL và locator; không phải bản HTML gốc có hash nhà phát hành. Năm yêu cầu tải trực tiếp trả HTTP403, giữ nguyên trong `acquisition-manifest.json` và các tệp phản hồi bị từ chối dưới `data/manual-download/VIC/2026-11-03-official/`. Không dùng những tệp 403 làm báo cáo. Chưa lấy được bản gốc/hash tương ứng từ SEC qua CLI; không tuyên bố full-source replay. Snapshot văn bản tạm đã dọn, giữ kết quả và phản hồi nguồn.

Các lệnh kiểm tra và kết quả ở `validation.json`. Không tuyên bố full-suite/release PASS. DB SHA-256 trước/sau: `47d1dd391afb895e70d942f96f148e16d9982646998f9c59b5b36cc59ca2cb65`. Authority hiện hành và 133 tệp bằng chứng lịch sử không đổi. Không sửa ledger, dashboard, scoring, NAV hay tiêu chí tài chính.

**Quyết định: hoàn tất nghiên cứu bổ sung và các guard trong phạm vi này; nghiệm thu tài chính VIC vẫn BLOCKED.**
