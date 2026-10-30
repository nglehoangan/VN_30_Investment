# Cập nhật VPL và cầu nối BSR / VHM / FPT

Đã xử lý các vấn đề nguồn/kỳ được nêu ở đợt trước trong phạm vi phân tích mới. Chưa phải nghiệm thu toàn bộ B6 hoặc phát hành điểm đầu tư.

## VPL: phân tích từ FY2023

- Áp dụng theo yêu cầu chủ tài khoản, không dựa vào khẳng định về ngày niêm yết.
- Đã bỏ FY2022 khỏi quan sát, yêu cầu dữ liệu, chỉ tiêu và FCF đang phân tích. Giữ 17 quan sát cũ trong bộ trước để kiểm toán; không xóa PDF/giá trị lịch sử.
- Có ba năm FY2023–FY2025 và kỳ 6T2026. Không giả lập lịch sử 5 năm, không tiếp tục yêu cầu PDF FY2022.

## BSR / VHM: đã khớp 7 khoản

Đã xem trực tiếp trang PDF gốc và cột sau điều chỉnh, kiểm tra từng toán hạng trong thuyết minh. Số cuối năm gốc, số đầu kỳ sau phân loại và bảng cầu nối vẫn là các biến thể riêng. Chỉ liên kết sau khi xác định được kỳ tài chính, caption, phạm vi và đơn vị; không ghép vì số tiền giống nhau.

| Mã | Khoản | Đơn vị gốc | Số cuối FY2025 gốc | Điều chỉnh | Số sau điều chỉnh |
|---|---|---|---:|---:|---:|
| BSR | Tiền và tương đương tiền | VND | 7.625.822.768.599 | 37.186.004.645 | 7.663.008.773.244 |
| BSR | Phải thu ngắn hạn | VND | 13.539.339.764.397 | -269.297.007.277 | 13.270.042.757.120 |
| VHM | Tiền và tương đương tiền | Triệu VND | 49.961.891 | -876.464 | 49.085.427 |
| VHM | Phải thu ngắn hạn | Triệu VND | 219.949.950 | -14.292.919 | 205.657.031 |
| VHM | Tài sản ngắn hạn | Triệu VND | 496.890.087 | 1.797.395 | 498.687.482 |
| VHM | Tổng tài sản | Triệu VND | 787.857.267 | 6.847.044 | 794.704.311 |
| VHM | Nợ ngắn hạn | Triệu VND | 343.090.159 | 2.830.528 | 345.920.687 |
| FPT | Phải thu ngắn hạn | VND | 14.402.017.450.105 | -393.560.747.215 | 14.008.456.702.890 |

BSR: thuyết minh trang vật lý 15–16, bảng tài sản trang 9. VHM: kỳ/đơn vị và thay đổi kế toán trang 24/26, bảng cầu nối trang 112, bảng tài sản/nguồn vốn trang 14–16. FPT phải thu: Note39 trang 60. Mỗi ledger có đường PDF, hash và trang.

VHM giữ đúng chênh lệch làm tròn theo triệu đồng: chuyển khoản phải trả người lao động +639.646 và chi phí phải trả −639.647; không tự triệt tiêu phần lệch 1 triệu. Tổng tài sản chỉ cộng các điều chỉnh ròng không trùng nhau, không cộng lại nguyên giá/khấu hao.

## FPT: có so sánh 6 tháng cùng phương pháp

Bảng do doanh nghiệp cung cấp tại trang vật lý 18 đã trình bày lại 6T2025 theo cùng phương pháp kế toán FTEL như 6T2026. Đã bổ sung bốn quan sát so sánh và bốn phép tính tăng trưởng, không tự ước tính số loại FTEL.

| Chỉ tiêu | Tăng trưởng 6T2026 / 6T2025 cùng phương pháp |
|---|---:|
| Doanh thu thuần | 12.62% |
| LNST toàn bộ | 14.00% |
| LNST cổ đông công ty mẹ | 14.06% |
| EPS cơ bản | 13.55% |

Đây là tăng trưởng theo cùng phương pháp kế toán, chưa phải tăng trưởng hữu cơ. Không dùng cột 6T2025 hợp nhất FTEL toàn bộ làm mẫu số. Chưa có bằng chứng đầy đủ cho FY2025 và dòng tiền theo cùng phạm vi, nên các phép tính TTM/cả năm bị ảnh hưởng vẫn N/R. Hạn chế này không cản phép so sánh 6 tháng đã kiểm tra.

## Kết quả kiểm định

- 112/112 tests đạt; gồm bộ mới, bộ review trước và corpus/reader hiện tại.
- Có kiểm tra âm: đảo dấu, sai đơn vị, thiếu chứng cứ kỳ, cộng trùng, dùng sai cột FPT hoặc sai thời hạn phải bị từ chối.
- 1780/1780 quan sát hiện tại được chọn trong snapshot review; 30 mã không còn source gap trong phạm vi này.
- Trong 347 khoảng trống nguồn ban đầu: 331 đã nối, 16 nằm ngoài phạm vi VPL mới, 0 còn chưa xử lý. Riêng 17 vấn đề tồn ở cuối đợt trước: 7 đã nối và 10 loại khỏi yêu cầu theo phạm vi mới.
- Bộ review hiện có 392 tỷ lệ/phép tính mô tả và 48 FCF. FCF giảm từ 49 do bỏ FY2022 của VPL, không phải mất dữ liệu.
- DB thật, toàn bộ artifact/builder của bộ review trước và 133 seal lịch sử giữ nguyên. Authority manifest đang duyệt kiểm tra đạt.

## Cần chủ tài khoản cung cấp thêm gì?

**Không cần bổ sung tài liệu cho các vấn đề VPL FY2022, BSR/VHM và phần so sánh 6 tháng FPT vừa xử lý.** MBB CAR6T2026 tiếp tục tạm hoãn theo chỉ đạo trước.

B6 tổng thể vẫn còn phần chuẩn hóa lợi nhuận/vốn phổ thông, sự kiện vốn, đánh giá định tính/rủi ro, định giá và formal admission. Không tự coi việc nối nguồn thành công là đủ điều kiện phát hành điểm.

## Tệp hiện tại

- `analysis-scope-policy.json`: phạm vi VPL đã được chủ tài khoản chỉ định.
- `issuer-comparability-bridges.json`: 8 cầu nối có từng điều chỉnh và provenance.
- `fpt-same-method-comparatives.json`: bốn số so sánh do doanh nghiệp công bố.
- `native-review-sources.json`, `native-review-snapshot.json`, `native-inputs/<TICKER>.json`: bộ review cập nhật.
- `source-resolution.json`, `remaining-issues.json`, `verification.json`: phân loại vấn đề và kiểm định.

Chạy lại theo thứ tự: `python3 scripts/record-b6-comparability.py`; `node scripts/close-b6-comparable-inputs.mjs`; `node scripts/assemble-b6-comparable-review.mjs`; sau đó kiểm thử. Node22.23.2. Các script không ghi DB và không thay authority Production.
