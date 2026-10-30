# B6 — Kết quả thực hiện mục1 và2, ngày30/10/2026

**Kết luận: đã bổ sung dữ liệu và bộ đầu vào review; chưa đủ điều kiện đóng toàn bộ mục1–2 hoặc phát hành điểm đầu tư.**

## Đã thực hiện

- Tải thêm30 PDF duy nhất từ Vietstock; trích xuất1462 trang, thêm32950 dòng vào12 mã. Bản gốc/raw và các lần tải thất bại đều có inventory.
- Nối lại nguồn **330/347** quan sát; còn17 quan sát cần nguồn/cầu nối kỳ. Snapshot review có1776/1793 quan sát được chọn.
- Đối chiếu và kiểm định bằng domain8 nhóm dư nợ: VNM FY2024/FY2025/6T2026 và BSR/FPT/SAB/VHM/VJC6T2026. Phần đến hạn được tính đúng một lần. Đây là dư nợ báo cáo; nghĩa vụ tài trợ toàn diện và net debt chưa được chứng minh.
- Lập đầu vào30 mã: **388 tỷ lệ báo cáo**, **49 phép tính CFO trừ chi mua sắm tài sản**,690 dòng đánh giá theo23 rubric, mô hình định giá theo ngành và3 khung kịch bản/mã. Chưa điền điểm/giá trị nội tại khi giả định chưa đủ chứng cứ.
- Bổ sung ngân hàng bằng tỷ lệ cho vay khách hàng/tiền gửi khách hàng và dự phòng/cho vay; không gọi đó là regulatory LDR hay tỷ lệ bao phủ nợ xấu. Không dùng current ratio/CFO của công nghiệp cho ngân hàng.
- Giữ3 chênh lệch PDF/CafeF của HPG FY2022 trong ledger, chọn PDF cho review theo policy; không kết luận provider sai.

## Còn thiếu gì và ai xử lý

| Phạm vi | Nguyên nhân cụ thể | Cách khắc phục |
|---|---|---|
| VPL FY2022:10 quan sát số dư/dư nợ | Hai URL thử trả404; tài liệu FY2023 chỉ có cột đầu01/01/2023, chưa đủ chứng cứ để gán lại thành cuối2022 | Bạn có thể bổ sung link Vietstock/PDF hợp nhấtFY2022 gồm bảng cân đối và thuyết minh vay, hoặc bằng chứng cầu nối hai kỳ. Không cần nhập lại10 số. |
| BSR FY2025:2 quan sát; VHM FY2025:5 quan sát | Cột đầu kỳ6T2026 đã phân loại/trình bày lại khác số cuốiFY2025 bản gốc; cả hai PDF đang giữ | AI cần đối chiếu bút toán/caption trong notes và lập cầu nối vintage; bạn không cần gửi lại tài liệu đã có. Xem chi tiết số và trang trong remaining-issues.json. |
| FPT | FTEL thay đổi phạm vi hợp nhất từ01/01/2026; phải thu FY2025 bản gốc và cột so sánh6T2026 khác phân loại | Giữ hai vintage; hoàn tất cầu nối phạm vi trước organic/TTM hoặc tăng trưởng. Không xem là lỗi số học. |
| Đầu vào chấm điểm30 mã | Chưa hoàn tất lợi nhuận/vốn phổ thông chuẩn hóa, cổ phiếu thực lưu hành/sự kiện vốn, capex duy trì, nghĩa vụ chưa phân loại và nghiên cứu định tính23 rubric | Đây là công việc nghiên cứu/chuẩn hóa còn lại của AI. Đã chỉ ra trang notes và bằng chứng liên quan từng mã; không yêu cầu bạn gõ lại dữ liệu đang giữ. |
| Định giá30 mã | Đã chọn phương pháp phù hợp ngành nhưng chưa có dự báo, discount rate và terminal value đủ căn cứ cho3 kịch bản | Cần chứng cứ/giả định kinh doanh có ngày tham chiếu và sensitivity; không tự điền một tỷ lệ chung để tạo giá mục tiêu. Listed shares không thay outstanding common shares. |
| Historical validation | Nguồn tải hôm nay chỉ chứng minh biết từ hôm nay; không chứng minh ngày công bố lịch sử | Tiếp tục INITIAL_LIVE_ONLY. Nếu cần backtest AS_KNOWN, cần chứng cứ công bố có dấu thời gian. Không phải yêu cầu bạn tự xác nhận ngày bằng trí nhớ. |

MBB CAR6T2026 tiếp tục tạm hoãn theo yêu cầu trước đó; không tải lại, không dùng số kỳ cũ thay. LPB/TCX giữ xác nhận năm+kiểm toán của chủ tài khoản cho loại tài liệu, không yêu cầu xác nhận lại.

## Kiểm định

- **68/68 tests đạt**:34 kiểm tra bộ review mới và34 kiểm tra corpus/reader đang giữ. Snapshot replay, receipt dư nợ, lỗi binding/khác kỳ, phép tính và chặn REVIEW→FORMAL đều được kiểm tra.
- Lint các script JavaScript/test thay đổi đạt; Python compile đạt.
- Kiểm tra hash379 PDF vật lý/371 PDF duy nhất, 25031 trang notes; bảo toàn7660 biến thể và7252 trang notes cũ.
- Manifest authority đã duyệt và133 tệp lịch sử giữ nguyên. DB thật không bị thay đổi bởi đợt review này; integrity/foreign keys đạt.

## Tệp và cách chạy lại

- `source-resolution.json`:347 quan sát gốc và cách xử lý, gồm giá trị cũ/mới.
- `current-qualified-borrowings.json`, `vnm-qualified-borrowings.json`:receipt domain và các bất định còn giữ.
- `decision-input-review-index.json`, `native-inputs/<TICKER>.json`:đầu vào, công thức,23 rubric, mô hình, nguồn notes và lý do chưa sẵn sàng.
- `remaining-issues.json`:từng quan sát chưa chốt, số đối chiếu, nguồn/trang và trách nhiệm xử lý.
- `data/manual-download/supplemental-manifest-2026-10-30.json`:toàn bộ request kể cả404 và URL thay thế thành công.

Sau khi sửa ledger nguồn: chạy `node scripts/close-b6-review-inputs.mjs`, tiếp theo `node scripts/assemble-b6-decision-review.mjs`, rồi test/verify. Dùng Node22.23.2 của dự án. Các output này luôn REVIEW_CANDIDATE; không tự kích hoạt Production.

## Tổng hợp từng mã

| Mã | Ngành | Quan sát được chọn | Nguồn/kỳ chưa chốt | Tỷ lệ báo cáo | FCF review |
|---|---|---:|---:|---:|---:|
| ACB | BANK | 42 | 0 | 10 | 0 |
| BID | BANK | 40 | 0 | 10 | 0 |
| BSR | ENERGY | 76 | 2 | 20 | 5 |
| CTG | BANK | 40 | 0 | 10 | 0 |
| FPT | TECHNOLOGY | 88 | 0 | 17 | 5 |
| GAS | UTILITIES | 70 | 0 | 17 | 5 |
| GVR | MATERIALS | 77 | 0 | 21 | 5 |
| HDB | BANK | 39 | 0 | 10 | 0 |
| HPG | MATERIALS | 84 | 0 | 20 | 5 |
| LPB | BANK | 40 | 0 | 10 | 0 |
| MBB | BANK | 39 | 0 | 10 | 0 |
| MCH | RETAIL | 68 | 0 | 16 | 0 |
| MSN | RETAIL | 73 | 0 | 18 | 0 |
| MWG | RETAIL | 67 | 0 | 15 | 0 |
| SAB | RETAIL | 72 | 0 | 17 | 0 |
| SHB | BANK | 40 | 0 | 10 | 0 |
| SSB | BANK | 40 | 0 | 10 | 0 |
| SSI | SECURITIES | 35 | 0 | 0 | 0 |
| STB | BANK | 40 | 0 | 10 | 0 |
| TCB | BANK | 40 | 0 | 10 | 0 |
| TCX | SECURITIES | 45 | 0 | 0 | 0 |
| VCB | BANK | 63 | 0 | 11 | 0 |
| VHM | REAL_ESTATE | 83 | 5 | 17 | 5 |
| VIB | BANK | 43 | 0 | 10 | 0 |
| VIC | REAL_ESTATE | 79 | 0 | 15 | 5 |
| VJC | INDUSTRIAL | 80 | 0 | 14 | 5 |
| VNM | RETAIL | 68 | 0 | 15 | 0 |
| VPB | BANK | 40 | 0 | 10 | 0 |
| VPL | REAL_ESTATE | 74 | 10 | 14 | 5 |
| VRE | REAL_ESTATE | 91 | 0 | 21 | 4 |
