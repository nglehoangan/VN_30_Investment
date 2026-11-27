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

Khi chẩn đoán N/R, trước hết dựng hoặc tái dùng sản phẩm phân tích theo từng topic và kiểm band thấp có thể bảo vệ. Ghi riêng căn cứ kinh tế và kết quả binding hiện hành (dataset, assessment, runtime, authority). Thiếu assessment hoặc binding không phải thiếu công bố. Dừng ở blocker đã chứng minh và ghi điều kiện mở lại.

Với BQ-EQ, áp dụng [Approved Baseline v1.0](../../docs/03%20SCORING/BQ_EQ_EVIDENCE_SUFFICIENCY_v1.0.json) theo thứ tự lợi suất trực tiếp, chỉ tiêu tương đương ngành, khoảng bảo thủ, bằng chứng kinh tế kết hợp rồi N/R. Kiểm lợi suất, độ bền và chi phí vốn phù hợp. Ghi rõ khi biên lợi nhuận trở thành điều kiện và xử lý phản chứng trọng yếu. Cổng validation FPT chỉ thực thi nghiên cứu cô lập.

Với cập nhật BQ-EQ, dùng [Approved Baseline v1.1](../../docs/03%20SCORING/BQ_EQ_INCREMENTAL_ASSESSMENT_v1.1.json). Giữ phương pháp nền qua các kỳ, rà bằng chứng mới và tác động trọng yếu. Khi thiếu phép tính hiện hành, chỉ ghi `CARRIED_FORWARD` nếu bằng chứng xác nhận band cũ còn áp dụng và chưa đến mốc bắt buộc đánh giá lại. Lưu ngày đánh giá gốc, kỳ dữ liệu, ngày rà, độ tin cậy và trigger riêng. Khi không thể kế thừa, thực thi các route D1–D8 trước khi ghi N/R. ROIC lịch sử giữ đúng kỳ của nó.

Với [BQ-EQ v1.2](../../docs/03%20SCORING/BQ_EQ_INCREMENTAL_ASSESSMENT_v1.2.json), giữ bản đánh giá lịch sử hợp lệ mới nhất kể cả khi điểm hiện hành chưa xác nhận. Dùng `UPDATE_PENDING` khi thiếu bằng chứng cập nhật và `MATERIAL_REVIEW_PENDING` khi tác động trọng yếu chưa xác định. Dùng `INVALIDATED` khi review xác nhận tác động kinh tế làm điểm cũ mất hiệu lực cho kỳ hiện hành. Báo riêng điểm lịch sử, điểm hiện hành và điều kiện xếp hạng hay hành động.

Theo [phụ lục Effective Score D19–D23](../../docs/03%20SCORING/BQ_EQ_EFFECTIVE_SCORE_ADDENDUM_v1.2.json), điểm BQ-EQ lịch sử còn đủ điều kiện có thể đóng góp tạm tính cho nhóm BQ, độ phủ và phân tích nghiên cứu trong khi rà soát đang chờ. Báo riêng điểm tái đánh giá hiện hành và nguồn kỳ gốc của Effective Score. Giữ nguyên trọng số và tổng điểm rỗng nếu thiếu rubric. Điểm tạm tính không cấp quyền xếp hạng chính thức hay ra quyết định đầu tư.

Với [BQ-MOAT v1.0](../../docs/03%20SCORING/BQ_MOAT_EVIDENCE_SUFFICIENCY_v1.0.json), liên kết cơ chế cạnh tranh với hành vi khách hàng hoặc kết quả vận hành quan sát được. Chọn band theo độ bền tương ứng và nêu giới hạn của chỉ báo công khai về giữ chân, chi phí chuyển đổi hoặc định giá hợp đồng. Rà FTEL theo tác động lên cơ chế cạnh tranh. Kế thừa và tổng hợp Effective Score theo cùng quy tắc nghiên cứu đã duyệt cho BQ-EQ.

Áp dụng [amendment BQ-CASH và BQ-RES](../../docs/03%20SCORING/BUSINESS_QUALITY_CASH_RES_AMENDMENTS_v1.0.json) khi hoàn tất Business Quality. BQ-CASH kiểm hiện thực hóa và ghi nhận lợi nhuận, mức trọng yếu của vốn lưu động và khoản bất thường, cùng phạm vi CFO/NPAT. Giữ tổng CAPEX nếu chưa đủ căn cứ tách. BQ-RES kiểm mức độ tập trung và tính chu kỳ, dùng bằng chứng giá và stress theo band. Giữ riêng Effective Score tạm tính, điểm hiện hành và quyền sử dụng chính thức.

## Governed category rollout

Category execution parameters use one ticker with `category`, `cutoff`, `methodologyVersion`, `priorAcceptedCategories` and `executionScope`. Resolve the cutoff and category from the approved candidate. Preserve prior accepted categories on identical inputs.

Apply the approved rubric classifications CORE, CONDITIONAL, SUPPORTING, BAND-DEPENDENT and MAXIMUM_ONLY. Select the actual defensible existing band before execution. For Financial Health qualify capital, asset quality, sector-equivalent leverage, timed obligations and accessible resources; use approved public proxies and reproducible analyst stress estimates with explicit funding and capital response. Incomplete supporting topics do not imply missing CORE evidence.

[Approved Financial Health baseline](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_AMENDMENT_v1.0.json)

### Approved Financial Health A/B routes

For FH-LIQ and FH-STRESS, apply the [approved v1.2 amendment](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_ANALYST_RISK_v1.2.json) to one ticker and the requested Financial Health periods. Method B retains the canonical direct bands and takes priority. For eligible detail gaps, Method A assesses a distinct public-data risk profile, capped at 3/4 for FH-LIQ and 4/5 for FH-STRESS. Reuse the qualified source-bound financial product and sector normalization, including bank and property conventions. Preserve observed facts, calculations, estimates and scenario assumptions separately. Avoid repeat discovery.

Record an explicit analyst band or N/R before validation, with evidence for the selected conclusion, adjacent-band rationale, counterevidence disposition and limitations. Review whether each unresolved dependency affects that band. Never infer points from a ratio or treat unverified resources or actions as certain. Record the five confidence dimensions independently of points, and enforce the existing freshness, invalidation and historical eligibility checks. Carry method and band semantics through research consumers with no formal gate credit or assumed cross-route cardinal equivalence. Keep genuine N/R distinct from outside scope.

[Historical v1.1 replay contract](../../docs/03%20SCORING/WP2_FINANCIAL_HEALTH_DUAL_ROUTE_v1.1.json)


### Approved Growth Quality research routes

For one ticker and an eligible cutoff, apply the [WP3 Growth Quality baseline](../../docs/03%20SCORING/WP3_GROWTH_QUALITY_AMENDMENT_v1.0.json). Use B first for History and Forward, and Direct → unchanged PX02 → Capital Productivity Profile for Incremental. Method A uses route-specific bands capped at 4/5, 4/5 and 3/5 respectively. Record proposals before validation and preserve sector normalization, confidence, counterevidence, method identity and research-only authority. Preserve the separate economic channels and mixed-route comparability limits.

Compare normalized history with a public growth profile. Chain EPS only within documented adjusted comparison pairs and assess M&A, dilution and base-effect materiality. Use a source-linked 3–5-year forward model or analyst outlook, with sector-equivalent measures and explicit funding, working capital and execution constraints. For incremental productivity, require aligned earnings and deployed-capital evidence across relevant windows.


### Approved Industry & Competitive Position research routes

Apply the [WP4 baseline](../../docs/03%20SCORING/WP4_INDUSTRY_COMPETITIVE_POSITION_AMENDMENT_v1.0.json) for one ticker, a pinned cutoff and sector. Use Direct before Public Industry Structure or Cycle Exposure. Competitive Position uses Direct → unchanged PX03 → Competitive Capability. Method A ceilings are 3/4, 3/4 and 1/2. Preserve canonical bands, sector normalization, source eligibility, counterevidence and confidence. Qualify evidence ownership against accepted BQ, FH and GQ. Keep shared observations distinct from independent corroboration and research separate from formal gates.

Define product, geographic, customer and segment scope before assessing. Industry structure needs external corroboration, capability needs actual wins and delivery, and cycle exposure needs distinct two-sided demand and vulnerability evidence.


### Approved Valuation & Forward Return research routes

For one ticker and the pinned cutoff, apply the [WP5 baseline](../../docs/03%20SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.0.json). Select the sector method, qualify the exact raw close and share basis, and distinguish reported or annualized earnings from supported normalized economics. Prefer detailed Method B, then bounded quantitative Method A with canonical ceilings 6/8, 6/8 and 3/4. Separate enterprise WACC, equity discount rate, shareholder IRR and investor hurdle rate.

Record assumption provenance, materiality, scope, downside, counterevidence and freshness before scoring. Preserve the scenario, no-rerating, reverse return and conservative impairment analyses. Sensitivities convey no scoring authority. A change in raw price requires fresh band assessment even when the financial model remains eligible. A material share or financial change requires model review. Retain genuine N/R and its dependency blockers. Bind predecessor Effective Scores through the serial cumulative workflow and retain reproducible research receipts. Preserve formal gates and publication restrictions.


### Valuation v1.1 external research and independent rubric eligibility

Use the [external research intake skill](../vn30-external-research-evidence/SKILL.md) for approved inputs only. Bind material dependencies, cross-check and adverse evidence per rubric/model/route/period. Keep publication eligibility, source-family revisions, investor corporate-action entitlement and terminal horizon traceable. Explicit zero dividend credit makes no payout prediction. Same-basis no-rerating may use the scale-free return when normalized economics, growth, dilution and contraction review qualify. Preserve independent conservative MOS, price-bound recalculation, sensitivity-only labels, exact replay and research authority.


### WP5 bounded shareholder IRR

For one ticker and cutoff, use the [scoped VAL-RET v1.2 amendment](../../docs/03%20SCORING/WP5_VALUATION_FORWARD_RETURN_AMENDMENT_v1.2.json). Distinguish qualified point, conservative case, single-band range, unexplained cross-band range and sensitivity only. Low or negative supported returns can score; zero points and N/R are distinct. Qualify the complete coherent uncertainty set, endpoints and material adverse cases. Review entitlement, terminal horizon, distribution credit and contraction. Use admitted analyst forecasts as evidence, and qualify material bounds independently. Exclude irrelevant model dependencies. Keep the existing cumulative workflow, price and share binding, counterevidence, model and band lineage, exact assessment record and research-only authority.

### WP5 v2.0 analyst-driven valuation

For one ticker and an eligible sector model, follow [RR01–RR20](../../docs/03%20SCORING/WP5_VALUE_INVESTING_ANALYSIS_AMENDMENT_v2.0.json). Pin a Data Freeze per period. Separate facts, reproducible calculations and analyst-generated estimates. Persist the model proposal and reasonableness challenge separately. External corroboration is optional. Classify material blockers RB01–RB05, allow a single revision, and bind the final economic disposition and limitations to the exact proposal. Preserve model-specific lineage, Method B priority, bounded return forms, five confidence dimensions, current-price Effective Score and existing research authority.

### WP6 Risk & Governance research

Use the [RG01–RG20 amendment](../../docs/03%20SCORING/WP6_RISK_GOVERNANCE_AMENDMENT_v1.0.json) for one ticker, eligible sector and frozen information window. Preserve factual audit, governance, sanctions and veto evidence separately from judgments. Review public governance and distinct residual loss channels. Record the prior rubric owner and distinguish planned controls, implementation and demonstrated effectiveness at the assessment date. Recompute thesis sensitivities using eligible retained scenarios and record shared dependencies separately from score levels. Use RV01–RV06, RB01–RB05 and at most one revision. Apply Effective Score freshness and material-event rules. Preserve formal Stage 0, Hard Veto and Risk Policy status independently from research classifications.

### WP7 Capital Allocation Quality research

Use the [CA01–CA24 research amendment](../../docs/03%20SCORING/WP7_CAPITAL_ALLOCATION_AMENDMENT_v1.0.json) for one eligible ticker and sector. Freeze factual decisions, deployed capital, commissioning and attributable outcomes. Reconcile parent cash retention, paid distributions and buyback applicability. Separate new issuance, treasury transfers and pro-rata entitlement changes. Calculate event-aligned transfer, ESOP break-even benefits and sequential per-share effects. Prioritize detailed, unchanged PX04/PX05 and then applicable bounded routes. Bind both comparative share basis and distinct cycle-adjusted support before awarding binary maxima. Preserve any N/R and provisional origins in the complete 23-rubric display. Aggregate complete research totals only when all Effective Scores qualify, with existing formal authority kept separate.

### WP7 v1.1 bounded economic closure

Apply [CA25–CA34](../../docs/03%20SCORING/WP7_CAPITAL_ALLOCATION_AMENDMENT_v1.1.json) for one eligible ticker and sector. Group capital decisions only where deployed resources and observed economic outcomes support attribution. Consider the latest eligible parent cash assessment with a dated subsequent-event review. Keep the original date and direct N/R visible when provisional research carry applies. Distinguish unresolved scope or materiality from proven invalidation. Use event-aligned analyst valuation and benefit materiality with dated facts, economic bounds and share-entitlement reconciliation. Unknown ESOP offsets remain unknown. PX04/PX05, canonical maxima and formal gates continue to apply. Finalize the bounded review with at most one analyst revision.
