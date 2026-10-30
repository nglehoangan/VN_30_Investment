# Đối chiếu PDF và bộ nghiệm thu ChatGPT — dự án cá nhân

Đã lập bộ tiêu chí nghiệm thu ChatGPT, policy đề xuất và bảng chuẩn bị input/bridge cho đủ 30 mã. Quy trình mới không yêu cầu người nghiệm thu độc lập. Kết quả hiện tại **đạt kiểm định tính toàn vẹn hồ sơ và đối chiếu kỹ thuật; chưa nghiệm thu đủ đầu vào scoring FORMAL**.

## Kết quả có bằng chứng

- Inventory có 344 mục: **337 PDF đang giữ đã đối chiếu hash**, 7 mục tải thất bại vẫn được giữ trong audit. Tổng PDF giữ lại có 23.483 trang; việc quét notes không đồng nghĩa đã xem ảnh toàn bộ các trang này.
- Đã xem ảnh nguồn của **30 trang báo cáo chính**, một trang cho mỗi mã: đơn vị tiền tệ xác nhận trên 30 trang, phạm vi ghi rõ trên 28 trang. Chỉ xác nhận header của đúng trang/PDF, không xác nhận toàn bộ các số tiền hoặc tự lan đơn vị sang EPS và mọi trang còn lại.
- **LPB/TCX:** trang đã xem không ghi rõ nhãn hợp nhất/riêng; giữ scope chưa xác nhận. Canonical cũ ghi STANDALONE, không trộn vào CONSOLIDATED. Việc chuẩn hóa tên STANDALONE → SEPARATE_STANDALONE chỉ là chuyển từ vựng của contract, không tự chứng minh phạm vi nguồn.
- **SHB:** trang bán niên được chọn ghi rõ báo cáo riêng. **SSI/TCX:** trang đã xem là FY2024, không chứng minh đủ báo cáo mới nhất. Các khác biệt được giữ thành vấn đề cần giải quyết.
- Phát hiện ứng viên tuyên bố ngày công bố trong **93 tài liệu**. Đã xem ảnh hai cover letter FPT và VRE, ghi đúng ngày tự tuyên bố trong `visual-review.json`. Không gán ngày ký/kiểm toán/retrieval thành ngày công bố; không coi tuyên bố này là đã kiểm chứng thời điểm công bố đầu tiên bên ngoài PDF. Các nguồn hiện tại vẫn là PDF mirror Vietstock.
- Tạo **1.115 nhóm đầu vào theo mã/kỳ**, liên kết tới **1.793 canonical facts** đang có, các metric/operand cũ và 23 rubric/topic slots cho mỗi mã. Giữ nguyên giá trị và trạng thái N/R. Bảng đọc được: `INPUT_BRIDGE_TABLE.md`; chi tiết: `tickers/<TICKER>.json`.

## Đã phân loại lại các khoảng trống

| Kết quả tra cứu | Số nhóm | Việc tiếp theo |
| --- | ---: | --- |
| Có canonical ứng viên hợp nhất | 1.046 | Review scope/unit/period/source, publication và gắn native observation/assessment |
| Có canonical standalone của LPB/TCX | 65 | Xử lý scope/ngoại lệ và mapping; không yêu cầu nhập lại số liệu |
| VNM đã có thành phần vay ngắn/dài hạn | 3 | Review phạm vi tổng vay, current portion, khoản tài trợ khác và witness đầy đủ; không tự cộng để cấp qualification |
| MBB CAR/CET1 30/06/2026 chưa đủ bằng chứng | 1 | Cần disclosure đúng kỳ, scope và framework; giữ deferred |

**MBB:** nguồn đang giữ `20260806___mbb____part_1.pdf`, physical page62, Table13 có CAR10,73% dưới cột30/06/2026 nhưng footnote ghi dữ liệu tại31/03/2026. Đã xem ảnh và giữ ngày31/03, không đưa thành CAR tháng6. Mục tải `MBB_BaocaoTyleAnToanVon_6T_2026.pdf` trong inventory ghi FAILED/HTTP404. Toàn bộ notes MBB đang giữ được tra lại, các hit và bằng chứng loại trừ nằm trong `input-gap-reconciliation.json`.

Ngoài độ phủ chỉ tiêu, canonical facts của **23 mã** có trường hợp chưa ghép được exact source PDF hash với tập PDF hiện giữ. Điều này chưa chứng minh các số tiền không có trong báo cáo đang giữ: cần tra cột hiện tại/so sánh và rebind đúng nguồn; chỉ tải lại PDF từ Vietstock khi không còn nguồn tương ứng. Không khôi phục các artifact cũ đã xóa hoặc copy giá trị để làm replay đạt.

Hiện **chưa có yêu cầu chủ dự án gửi thêm tài liệu/nhập lại giá trị**. Thiếu số trong canonical, thiếu qualification kế toán, thiếu exact source hash và thiếu code/mapping được phân loại riêng. Chi tiết từng nhóm nằm trong `input-gap-reconciliation.json`.

## Bộ tiêu chí và policy

Hướng dẫn: `../PERSONAL_AI_ACCEPTANCE.md`. Bản máy đọc: `ai-acceptance-criteria.json`, 15 tiêu chí AI01–AI15: toàn vẹn, universe/ngành, phạm vi, đơn vị, kỳ, độ phủ, PIT, thị trường, metric, valuation, 23 rubric, input/bridge, phản biện, tái lập/lỗi và biên bản AI.

`readiness-policy.proposed.json` giữ các nhóm CORE/SECTOR_CORE, anyOf/preference, supporting/optional, trọng số và reporting-cycle freshness của policy cũ. Bổ sung quy tắc review AI, nguồn PDF-first, temporal semantics và checklist mô hình định giá theo ngành. Đây là bản đề xuất, không tự đăng ký làm native scoring authority.

ChatGPT thực hiện lượt lập hồ sơ và lượt kiểm tra lại; hồ sơ ghi **AI self-review**, không giả danh người hoặc reviewer độc lập. Ngưỡng nghiệm thu: các tiêu chí bắt buộc áp dụng phải PASS bằng evidence cụ thể, không còn Critical/Major ảnh hưởng mục đích được chấp thuận. Không điền điểm mặc định cho mã chưa đủ điều kiện.

## Giới hạn runtime còn cần triển khai

- Native observations/availability assessments/derivations/snapshot chưa được tạo chỉ bằng việc đóng gói hồ sơ này. Bảng fact candidates không được giả làm native observation IDs; `runtimeBridgePlan` và `scoreInput` giữ null.
- Cần hoàn tất definition/mapping, anyOf/sector bindings, source admission và publication qualification cho từng dữ kiện; review metric operands và giả định định giá, rồi mới tạo ScoreInput chạy được validator thật.
- Scorer hiện chỉ chấp nhận `Assessment.source=HUMAN`; acceptance v1 có trusted independent-review binding. Cần đường dẫn versioned cho provenance/nghiệm thu AI trước khi sử dụng FORMAL. Đây là phần code/governance cần làm, không phải yêu cầu tìm người review hay tài liệu bổ sung từ chủ dự án.
- Tiếp tục cần qualification market capability và mô hình valuation; giá close đúng phiên không tự chứng minh các gate này.

Không sửa contract/seal lịch sử để gọi hồ sơ AI mới là independent-di-acceptance-v1. Phương pháp chấm điểm được duyệt trước đó vẫn xác minh đạt; không đồng nghĩa dataset mới được duyệt.

## Kiểm định

- `verification.json`: source hashes, 30 mã, 15 tiêu chí, 1.115 nhóm, 1.793 fact values giữ nguyên, 23 rubric/mã, phân biệt65 nhóm khác scope, kiểm tra DB read-only và hash trước/sau.
- `retained-corpus-tests.json`: kiểm thử manifest/source PDF/API và reader lineage hiện giữ.
- 10 kiểm thử bộ lọc: hợp nhất/riêng/cover hỗn hợp, đơn vị/cột đơn vị, không nhầm narrative với unit declaration, không biến ngày ký thành công bố và không sửa ngày sai.
- ESLint script builder đạt. Authority37artifact và133file lịch sử không thay đổi.

Các ảnh preview chỉ là công cụ xem nguồn và được dọn sau khi kiểm tra. Ledger giữ direct PDF path/hash/page và phạm vi thực sự đã xem. DB, JSON/PDF/API gốc, seal cũ và quyền Production giữ nguyên trong lượt làm việc này.
