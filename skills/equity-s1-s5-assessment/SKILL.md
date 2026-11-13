---
name: equity-s1-s5-assessment
description: Đánh giá nghiên cứu cổ phiếu theo S1 lợi nhuận kinh tế, S2 thanh khoản, S3 vị thế cạnh tranh, S4 giá/corporate actions và S5 định giá; tái sử dụng bằng chứng hiện có, áp dụng hợp đồng M3/M4 theo ngành và xác định chính xác điều kiện đóng issue. Dùng cho một mã hoặc danh sách mã được yêu cầu, không tự cấp điểm chính thức hay kích hoạt production.
---

# Đánh giá cổ phiếu S1–S5

Dùng trong repository VN_30_Investment. Các đường dẫn `docs/`, `src/`, `data/`, `skills/` dưới đây tính từ gốc repo. Skill là quy trình nghiên cứu và đối chiếu acceptance, không phải pipeline tự động bảo đảm đóng S1–S5 hoặc công cụ phát lệnh giao dịch.

## Đầu vào và hợp đồng

Nhận mã, sàn, cutoff, ngành, mục đích, phạm vi S1–S5 và vị trí bằng chứng đã có. Nếu chưa có ngành, xác định từ hoạt động kinh doanh và hợp đồng ngành trước khi chọn mô hình. Dùng cutoff được yêu cầu; không đổi ngày để bỏ nghĩa vụ hoặc tận dụng thông tin tương lai. Xem [hợp đồng đầu vào/đầu ra](references/contract.md) khi tạo hồ sơ.

- Đọc `AGENTS.md` và phiên bản áp dụng của `docs/01 SYSTEM/SCORING_MODEL_v1.0.md`, `docs/03 SCORING/METRIC_DEFINITIONS.md`, `docs/03 SCORING/SECTOR_NORMALIZATION.md`, `src/domain/scoring/methodology.ts` (RUBRICS), `src/domain/scoring/methodology/sectors.ts`. Đối với S5, đọc thêm `docs/04_DECISION_ENGINE/DECISION_ENGINE.md`, `DECISION_TEMPLATE.md`, `BUY_RULES.md` trong cùng thư mục. Ghi đường dẫn, section và hash thực tế; skill không thay thế policy.
- Đọc acceptance kế nhiệm mới nhất của đúng mã/ngày/phạm vi. Giữ phần đã đóng, chỉ xem lại khi có defect hoặc bằng chứng mâu thuẫn cụ thể. Không suy ra mọi acceptance có chữ CLOSED đều tương đương.
- Chọn phương pháp theo [hướng dẫn S1–S5 và ngành](references/methods.md). Đọc [bài học VNM](references/vnm-reference.md) khi cần ví dụ về xử lý giới hạn dữ liệu; các số liệu, haircut, thuế, payout, terminal growth và kết luận VNM không phải mặc định cho mã khác.

## Bằng chứng trước, bổ sung đúng phần thiếu

1. Tìm retained canonical facts, qualified selections, JSON/PDF, notes, price/action inventory, receipts và quyết định chủ sở hữu. Phân biệt dữ liệu có sẵn, extraction chưa kiểm chứng, canonical validation, governed admission và consumer readiness. Chưa admission không đồng nghĩa thiếu dữ liệu.
2. Đọc PDF qua `skills/read-pdf-json-first/SKILL.md`: dùng JSON đúng document/period/scope/revision trước, chỉ trích thêm trang thiếu từ PDF giữ lại. Không tải lại corpus; acquisition tài chính tuân thủ Vietstock-only hiện hành. Chỉ bổ sung nguồn thật sự cần, trong phạm vi người dùng cho phép.
3. Lập source pins và evidence ledger dùng chung cho mã, gồm hash, source identity, unit, cell/JSON Pointer hoặc PDF/page/box, receipt gốc, các mốc thời gian và xung đột. Không ghi đè nguồn hoặc chọn latest-wins. Không trộn hợp nhất/riêng, group/common, kỳ năm/quý/YTD/TTM hay dash/null với số 0.
4. Nhãn kết luận: FACT, ESTIMATE, ASSUMPTION, ANALYST_JUDGMENT. FACT của issuer reporting không tự chứng minh phát biểu của issuer là sự thật thị trường độc lập. Mỗi giả định phải có lý do, ảnh hưởng và sensitivity; unsupported precision giữ N/R.

## Thực hiện trong phạm vi yêu cầu

| Issue | Kết quả cần đạt | Tài nguyên tái sử dụng |
| --- | --- | --- |
| S1 | Lợi nhuận chuẩn hóa, vốn nhất quán, mức sinh lời so chi phí vốn, độ bền và comparability | Financial facts/S1 đã đủ điều kiện; dùng phép thay thế ngành hiện hành |
| S2 | Nguồn thanh khoản/nghĩa vụ theo bucket, base/stress có căn cứ, distribution resilience | Financial notes, liquidityLadder, fundingSensitivity; không yêu cầu chi tiết hợp đồng không bắt buộc |
| S3 | Các topic IC-POS có evidence/counterevidence, định nghĩa thị phần nhất quán, confidence/invalidation | `RUBRICS`, issuer disclosures và own-history/absolute economics nếu policy cho phép |
| S4 | Raw close, cổ tức/capital actions, số cổ phiếu đúng cutoff và giới hạn purpose/time | `skills/vn30-market-price-corporate-actions/SKILL.md`; không nhân bản fetching/admission logic |
| S5 | Mô hình vốn chủ nhất quán, Bear/Base/Bull, sensitivity, MOS/5Y return hoặc N/R có lý do | Kết luận S1–S4 và hợp đồng M3/M4; chọn mô hình đúng ngành |

S4 là đầu vào cho S5 khi cần giá/cổ phiếu/cổ tức; không buộc phải chạy lại theo số thứ tự. Chạy một mã độc lập; danh sách mã được xử lý với evidence/outputs tách biệt, không mở rộng thành toàn VN30 khi chưa được yêu cầu. Ngoài VN30 vẫn có thể nghiên cứu, nhưng standing authority/membership chỉ có hiệu lực trong phạm vi đã được duyệt; không tự mở rộng quyền admission.

## Quy tắc đóng issue

- Đối chiếu từng yêu cầu bắt buộc với rule chính xác, bằng chứng, phép tính, giới hạn và materiality. Không thêm project-level attribution, lịch đáo hạn từng sổ, peer percentile hay chứng nhận mới nếu hợp đồng không yêu cầu.
- Ưu tiên principle-equivalent metric, khoảng bảo thủ có căn cứ, rồi N/R theo missing-data policy. Không tự cho 0, midpoint hoặc điểm tối đa. N/R được phép không tự biến thành CLOSED: kiểm tra liệu phần không biết có thể đảo ngược kết luận bắt buộc hay khiến category không thể chấm tin cậy.
- CLOSED chỉ khi kết luận nghiên cứu đủ bằng chứng, tái lập, không còn mâu thuẫn kinh tế vật chất và đáp ứng yêu cầu áp dụng. Test PASS là điều kiện kiểm tra, không phải bằng chứng kinh tế độc lập. BLOCKING phải nêu đúng missing input/decision, rule, ảnh hưởng, authority và hành động nhỏ nhất. NON_BLOCKING chỉ là disposition của thiếu hụt, không tự là một acceptance toàn stage.
- Khi phân loại lại stress/chi tiết tùy chọn, giữ kết quả bất lợi và lý do policy; không xóa nghĩa vụ, đổi cutoff hoặc chọn giả định để đạt CLOSED. Không tạo thêm milestone hay approval loop chung chung.

## Kiểm chứng và bàn giao

Lưu outputs theo [contract](references/contract.md). Replay cùng input/policy/model bytes phải cho cùng economic/acceptance outputs; không đưa thời gian chạy biến động vào payload deterministic. Kiểm thử công thức/phạm vi/units, double counting, thiếu/xung đột bằng chứng và case adverse liên quan. Chạy suite miền đã bị tác động; không chạy live ingestion để kiểm tra tài liệu. Hash-check dữ liệu và policy được bảo vệ trước/sau. Không tuyên bố test/corpus replay chưa thực hiện.

Bàn giao bảng S1–S5 và blocker hiện tại, giả định làm đổi kết quả, confidence, dữ liệu người dùng thật sự cần bổ sung (nếu có), cùng đường dẫn output. Đóng research không hoàn thành toàn bộ scoring, nguồn, executable trust, PIT hay M1/decision gates.

Standing Authority per Version hiện hành không cần xin lại từng fact/PDF; dùng route hiện có trong skill S4 khi admission được yêu cầu. URL/file người dùng cung cấp vẫn phải được xác minh. Không tự cấp approval, sửa manifests cho khớp, promote VNM17 pending, cho điểm chính thức, đổi M3/M4, portfolio/NAV hoặc production. Chỉ commit/push/triển khai khi có chỉ thị tương ứng; dừng ở phạm vi đánh giá được giao.
