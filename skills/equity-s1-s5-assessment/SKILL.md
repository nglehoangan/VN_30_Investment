---
name: equity-s1-s5-assessment
description: Đánh giá nghiên cứu cổ phiếu theo S1 lợi nhuận kinh tế, S2 thanh khoản, S3 vị thế cạnh tranh, S4 giá/corporate actions và S5 định giá; tái sử dụng bằng chứng hiện có, áp dụng hợp đồng M3/M4 theo ngành và xác định chính xác điều kiện đóng issue. Dùng cho đúng một mã mỗi lần gọi, không tự cấp điểm chính thức hay kích hoạt production.
---

# Đánh giá cổ phiếu S1–S5

## Single-ticker execution — owner amendment

Bắt buộc đúng **một `ticker`** cho mỗi lần gọi; từ chối ALL, wildcard, danh sách, nhiều mã ghép chuỗi hoặc lặp tham số ticker. Chọn `universeVersion` đã pin và `referenceDate` liên quan; kiểm tra membership/security identity trước xử lý bằng [contract dùng chung](../vn30-rollout-orchestrator/references/single-ticker-contract.md).

```sh
python3 -B skills/vn30-rollout-orchestrator/scripts/runtime.py prepare \
  --skill equity-s1-s5-assessment --ticker VNM --reference-date 2026-10-30 \
  --purpose RETROSPECTIVE_RESEARCH --universe-version vn30-20260803-reviewed-20261115 --sector INDUSTRIAL
```

Lệnh này chỉ tạo context, không chạy worker. Dùng ticker/context đã kiểm tra khi thực hiện các bước dưới đây; worker/script cũ không phải lối bỏ qua guard. Output/evidence/checkpoint/blocker phải gắn executionId và đúng ticker. Không tái dùng authority, assessment, deployment hoặc publication permission của mã khác. Chỉ kiểm kê/readiness toàn universe mới được read-only nhiều mã; xử lý nhiều mã phải qua [orchestrator tuần tự](../vn30-rollout-orchestrator/SKILL.md), concurrency=1. Không tự cấp approval hoặc kích hoạt production.


Dùng trong repository VN_30_Investment. Các đường dẫn `docs/`, `src/`, `data/`, `skills/` dưới đây tính từ gốc repo. Skill là quy trình nghiên cứu và đối chiếu acceptance, không phải pipeline tự động bảo đảm đóng S1–S5 hoặc công cụ phát lệnh giao dịch.

## Đầu vào và hợp đồng

Nhận mã, sàn, cutoff, ngành, mục đích, phạm vi S1–S5 và vị trí bằng chứng đã có. Nếu chưa có ngành, xác định từ hoạt động kinh doanh và hợp đồng ngành trước khi chọn mô hình. Dùng cutoff được yêu cầu; không đổi ngày để bỏ nghĩa vụ hoặc tận dụng thông tin tương lai. Xem [hợp đồng đầu vào/đầu ra](references/contract.md) khi tạo hồ sơ.

- Đọc `AGENTS.md` và phiên bản áp dụng của `docs/01 SYSTEM/SCORING_MODEL_v1.0.md`, `docs/03 SCORING/METRIC_DEFINITIONS.md`, `docs/03 SCORING/SECTOR_NORMALIZATION.md`, `src/domain/scoring/methodology.ts` (RUBRICS), `src/domain/scoring/methodology/sectors.ts`. Đối với S5, đọc thêm `docs/04_DECISION_ENGINE/DECISION_ENGINE.md`, `DECISION_TEMPLATE.md`, `BUY_RULES.md` trong cùng thư mục. Ghi đường dẫn, section và hash thực tế; skill không thay thế policy.
- Đọc acceptance kế nhiệm mới nhất của đúng mã/ngày/phạm vi. Giữ phần đã đóng, chỉ xem lại khi có defect hoặc bằng chứng mâu thuẫn cụ thể. Không suy ra mọi acceptance có chữ CLOSED đều tương đương.
- Chọn phương pháp theo [hướng dẫn S1–S5 và ngành](references/methods.md). Đọc [bài học VNM](references/vnm-reference.md) khi cần ví dụ về xử lý giới hạn dữ liệu; các số liệu, haircut, thuế, payout, terminal growth và kết luận VNM không phải mặc định cho mã khác.

## Bằng chứng trước, bổ sung đúng phần thiếu

1. **Dùng nguồn đã có trước.** File, JSON và observation API do chủ sở hữu cung cấp hoặc đã xác nhận là nguồn chính thống cho đánh giá trong phạm vi được cung cấp. Tái sử dụng canonical facts, nguồn đã giữ, receipts và quyết định có sẵn. Khi nguồn đã có đúng số liệu cần dùng, dừng tìm nguồn cho số đó. Bỏ qua xác minh lại xuất xứ, tải lại, xin xác nhận lại và đối chiếu chéo cùng số liệu với nguồn khác.
2. **Kiểm tra việc sử dụng số liệu.** Gắn đúng mã, kỳ, cutoff, phạm vi, phiên bản, đơn vị, trường và công thức. Lưu đường dẫn, trang hoặc JSON Pointer và hash đã có. Quy tắc này áp dụng cho việc chọn đúng số liệu và tránh tính trùng. Nếu hai bản đã lưu mâu thuẫn hoặc file có lỗi cụ thể, ghi rõ xung đột trước khi dùng trường bị ảnh hưởng. Với PDF, dùng JSON đúng document/period/scope/revision trước theo [skill đọc PDF](../read-pdf-json-first/SKILL.md).
3. **Chỉ tìm bên ngoài khi thiếu đúng số liệu.** Tìm trên website của đơn vị công bố hoặc kênh chính thức được phép cho loại tài liệu. Áp dụng Vietstock-only hiện hành khi tìm/tải BCTC VN30. Lưu và dùng trực tiếp công bố phù hợp với kỳ, phạm vi và chỉ tiêu, kể cả tài liệu chủ sở hữu bổ sung. Một nguồn chính thống phù hợp đủ cho số liệu đó, không cần tìm nguồn thứ hai để xác nhận. Nếu vẫn thiếu, nêu cho chủ sở hữu tên hoặc loại báo cáo, kỳ, phạm vi và mục/bảng hoặc trường cụ thể có thể cung cấp. Tiếp tục các phần đánh giá đã có dữ liệu.
4. **Lưu phần thiếu để lần chạy sau tìm lại.** Nếu chưa thấy trên các kênh đã tìm và chủ sở hữu chưa cung cấp được, ghi “chưa tìm thấy công bố”, kèm ticker, cutoff, rubric, trường cần bổ sung, nguồn đã rà, ngày rà và lần công bố hoặc tài liệu cần kiểm tra tiếp. Lưu cùng hồ sơ assessment hoặc blocker/checkpoint hiện có. Khi chạy lại, đọc hồ sơ này trước và kiểm tra công bố mới phù hợp với cutoff hoặc bằng chứng hồi cứu được phép.
5. **Giải quyết rubric bằng dữ liệu hiện có.** Chốt phần đủ căn cứ. Dùng phép thay thế được methodology cho phép, khoảng bảo thủ hoặc độ nhạy khi phù hợp, ghi confidence và điều kiện đổi band. Giữ N/R hoặc OPEN nếu phần thiếu có thể đổi band và chưa có cách thay thế được phép. Phân loại FACT, ESTIMATE, ASSUMPTION và ANALYST_JUDGMENT. Phát biểu của issuer được ghi theo đúng nội dung công bố. Giữ dữ liệu thiếu, null, dash và số 0 riêng biệt.

## Thực hiện trong phạm vi yêu cầu

| Issue | Kết quả cần đạt | Tài nguyên tái sử dụng |
| --- | --- | --- |
| S1 | Lợi nhuận chuẩn hóa, vốn nhất quán, mức sinh lời so chi phí vốn, độ bền và comparability | Financial facts/S1 đã đủ điều kiện; dùng phép thay thế ngành hiện hành |
| S2 | Nguồn thanh khoản/nghĩa vụ theo bucket, base/stress có căn cứ, distribution resilience | Financial notes, liquidityLadder, fundingSensitivity; không yêu cầu chi tiết hợp đồng không bắt buộc |
| S3 | Các topic IC-POS có evidence/counterevidence, định nghĩa thị phần nhất quán, confidence/invalidation | `RUBRICS`, issuer disclosures và own-history/absolute economics nếu policy cho phép |
| S4 | Raw close, cổ tức/capital actions, số cổ phiếu đúng cutoff và giới hạn purpose/time | `skills/vn30-market-price-corporate-actions/SKILL.md`; không nhân bản fetching/admission logic |
| S5 | Mô hình vốn chủ nhất quán, Bear/Base/Bull, sensitivity, MOS/5Y return hoặc N/R có lý do | Kết luận S1–S4 và hợp đồng M3/M4; chọn mô hình đúng ngành |

S4 là đầu vào cho S5 khi cần giá/cổ phiếu/cổ tức; không buộc phải chạy lại theo số thứ tự. Mỗi lần gọi chỉ nhận đúng một ticker đủ điều kiện theo phiên bản VN30/ngày tham chiếu. Yêu cầu nhiều mã phải được chuyển sang queue tuần tự của orchestrator, không truyền danh sách vào Skill. Nghiên cứu ngoài VN30 cần workflow/phạm vi khác được cho phép, không vượt guard của Skill này.

## Quy tắc đóng issue

- Đối chiếu từng yêu cầu bắt buộc với rule chính xác, bằng chứng, phép tính, giới hạn và materiality. Không thêm project-level attribution, lịch đáo hạn từng sổ, peer percentile hay chứng nhận mới nếu hợp đồng không yêu cầu.
- Ưu tiên principle-equivalent metric, khoảng bảo thủ có căn cứ, rồi N/R theo missing-data policy. Không tự cho 0, midpoint hoặc điểm tối đa. N/R được phép không tự biến thành CLOSED: kiểm tra liệu phần không biết có thể đảo ngược kết luận bắt buộc hay khiến category không thể chấm tin cậy.
- CLOSED chỉ khi kết luận nghiên cứu đủ bằng chứng, tái lập, không còn mâu thuẫn kinh tế vật chất và đáp ứng yêu cầu áp dụng. Test PASS là điều kiện kiểm tra, không phải bằng chứng kinh tế độc lập. BLOCKING phải nêu đúng missing input/decision, rule, ảnh hưởng, authority và hành động nhỏ nhất. NON_BLOCKING chỉ là disposition của thiếu hụt, không tự là một acceptance toàn stage.
- Khi phân loại lại stress/chi tiết tùy chọn, giữ kết quả bất lợi và lý do policy; không xóa nghĩa vụ, đổi cutoff hoặc chọn giả định để đạt CLOSED. Không tạo thêm milestone hay approval loop chung chung.

## Kiểm chứng và bàn giao

Lưu outputs theo [contract](references/contract.md). Replay cùng input/policy/model bytes phải cho cùng economic/acceptance outputs; không đưa thời gian chạy biến động vào payload deterministic. Kiểm thử công thức/phạm vi/units, double counting, thiếu/xung đột bằng chứng và case adverse liên quan. Chạy suite miền đã bị tác động; không chạy live ingestion để kiểm tra tài liệu. Hash-check dữ liệu và policy được bảo vệ trước/sau. Không tuyên bố test/corpus replay chưa thực hiện.

Bàn giao bảng S1–S5 và blocker hiện tại, giả định làm đổi kết quả, confidence, dữ liệu người dùng thật sự cần bổ sung (nếu có), cùng đường dẫn output. Đóng research không hoàn thành toàn bộ scoring, nguồn, executable trust, PIT hay M1/decision gates.

Standing Authority per Version hiện hành không cần xin lại từng fact/PDF; dùng route hiện có trong skill S4 khi admission được yêu cầu. Quy tắc nguồn chính thống ở trên áp dụng cho bằng chứng assessment. Admission, purpose/PIT, quyền scoring và các cổng quyết định vẫn theo hợp đồng có quản trị hiện hành. Không tự cấp approval, sửa manifests cho khớp, promote VNM17 pending, cho điểm chính thức, đổi M3/M4, portfolio/NAV hoặc production. Chỉ commit/push/triển khai khi có chỉ thị tương ứng; dừng ở phạm vi đánh giá được giao.

## Độ tin cậy 0–10 cho scoring nghiên cứu

Khi dữ liệu chưa đầy đủ, đọc [thang độ tin cậy bằng chứng](references/evidence-confidence.md). Tiếp tục đánh giá rubric có căn cứ theo mốc hiện hành, báo riêng điểm, độ tin cậy và độ phủ. Giữ N/R khi chưa đủ căn cứ áp dụng band. Ghi rõ dữ liệu cần rà lại ở kỳ công bố sau. Giữ nguyên các cổng M1 và quyền chấm điểm chính thức.

Khi rà soát readiness S5 hoặc bàn giao sang M6.5, dùng [hợp đồng Structural Evaluation Gaps](../../docs/03%20SCORING/STRUCTURAL_EVALUATION_GAPS_v1.0.md). Ghi riêng tình trạng mapping, đủ điều kiện PIT, assumptions và sensitivity. Dùng lại bằng chứng và review đã giữ, và lấy vị thế, NAV, cash thực thi từ projection M6.3 có thẩm quyền.

Khi FY là nền đánh giá hoặc có báo cáo kỳ mới, dùng phụ lục [SEGM v1.2](../../docs/fundamental-data-engine/structural-evaluation-gaps/2026-11-23/SEGM_V12_ANNUAL_REASSESSMENT.md) của Prepare. Giữ báo cáo FY cuối cùng đủ điều kiện và phân kỳ số liệu interim. Chuyển các nhánh định giá và quyết định bị ảnh hưởng sang bộ tính và người rà soát hiện có.

## Public-data assessment routes

Dùng route đúng ngành cho từng rubric. Tái sử dụng evidence đã admit, dựng đầu ra mô hình từ dữ liệu công khai và dừng truy tìm chỉ số gốc khi proxy hợp lệ đã đủ. Follow the [Approved Baseline v1.0 and stopping rules](../../docs/03%20SCORING/PUBLIC_DATA_PROXY_SPECIFICATION_23_RUBRICS.md#evidence-discovery-workflow-and-stopping-rule).

Với BQ-EQ, áp dụng [Approved Baseline v1.0](../../docs/03%20SCORING/BQ_EQ_EVIDENCE_SUFFICIENCY_v1.0.json) theo thứ tự lợi suất trực tiếp, chỉ tiêu tương đương ngành, khoảng bảo thủ, bằng chứng kinh tế kết hợp rồi N/R. Kiểm lợi suất, độ bền và chi phí vốn phù hợp. Ghi rõ khi biên lợi nhuận trở thành điều kiện và xử lý phản chứng trọng yếu. Cổng validation FPT chỉ thực thi nghiên cứu cô lập.
