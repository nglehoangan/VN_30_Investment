# VN30 Value Investing OS — Controlled amendment DFR-01

**Dự thảo v0.1 · 04/11/2026 · Chờ owner review**  
**Baseline repo** `nglehoangan/VN_30_Investment` @ `2c9f12828129e2a8d1df6c73eaa43bad754993fd`

## Quyết định trình owner

Phê duyệt một luồng **Research Provisional** chỉ đọc để dùng các JSON đã lưu cho phân tích từng mã, từng metric và từng rubric. Kết quả research mang provenance, độ đầy đủ và lý do defer theo từng kết luận. Formal production acceptance tiếp tục đi qua các contract và thẩm quyền đã duyệt. Bản này là tài liệu successor đề xuất, tách khỏi các baseline và evidence seal M1–M8. Research ưu tiên FY2025, dùng FY2022–FY2024 để so sánh khi cùng cơ sở và giữ số liệu interim ở tập riêng.

## 1. Kiểm kê trực tiếp tại checkout local

Đã parse 30 JSON mỗi lớp PDF, notes, CaféF và combine. Cả 90 shard PDF display, CaféF display và combine đều khớp SHA-256 trong manifest tương ứng. Raw API được kiểm kê và đọc mẫu. Cùng universe dự án gồm ACB, BID, BSR, CTG, FPT, GAS, GVR, HDB, HPG, LPB, MBB, MCH, MSN, MWG, SAB, SHB, SSB, SSI, STB, TCB, TCX, VCB, VHM, VIB, VIC, VJC, VNM, VPB, VPL, VRE. Đây là universe lưu trong dự án tại baseline.

| Nguồn đang dùng | Schema và cách đọc |
|---|---|
| `data/manual-extracted-pdf/<TICKER>.json` | `manual-display-v1`, `PDF_EXTRACTION_CANDIDATE`. `reports → periods → variants → groups → rows`. Variant giữ scope, source, hash PDF. Group giữ column header và unit evidence. Row giữ decimal string native, lexical value, currency/scale, trạng thái OCR, physical page và boxes. `documents` giữ kiểm kê PDF. |
| `data/manual-extracted-pdf/notes/<TICKER>.json` | 30 hồ sơ toàn văn theo tài liệu/trang, kể cả thuyết minh và trang chưa phân loại. Dùng cho ngữ cảnh, counterevidence và định vị PDF trong `data/manual-download/`. |
| `data/manual-extracted-api/<TICKER>.json` | `cafef-display-v1`, `PROVIDER_DISPLAY_ONLY`. Cùng hierarchy nhưng variant giữ `providerType`, `providerContent`, `requestMode`, `modeMismatch`, endpoint và request params. Row giữ code, raw code, order, value, status, raw locator. |
| `data/manual-extracted-api/raw/cafef/` | 248 JSON vật lý, 248 bản ghi trong `requests.json`. Raw dùng `isSuccess`, `value.templace` cho template và `value.data[]` cho kỳ, bên trong có các cặp code/value. Template có dạng phẳng hoặc nhóm lồng. `quater` là tên trường nguồn. Manifest rebuild ghi nhận 8 lỗi schema giữ lại để quarantine. |
| `data/combine/<TICKER>.json` | `vn30-combine-v1`, policy `report-display-source-priority-v2`, `UNREVIEWED_PRESENTATION`. Bắt đầu từ view này để tìm dòng, sau đó lần về PDF/API JSON. Giữ `conflicts`, `needsReview`, `reviewReasons`, `cafefReferences`, `mappingBasis`, `comparisonDimensionsVerified` và review sidecar. |

Số mã có ít nhất một variant dưới **khóa năm đúng dạng YYYY** trong từng báo cáo. Đếm sự hiện diện, chưa kiểm tra đủ operand, scope, audit hay khả năng so sánh. Khóa ngày như `2025-12-31` và `UNRESOLVED-*` nằm ngoài phép đếm này.

| Lớp / báo cáo | FY22 | FY23 | FY24 | FY25 |
|---|---:|---:|---:|---:|
| PDF / CĐKT | 23 | 25 | 24 | 25 |
| PDF / KQKD | 24 | 25 | 27 | 27 |
| PDF / LCTT | 25 | 25 | 28 | 28 |
| PDF / Thuyết minh | 23 | 24 | 22 | 20 |
| CaféF / mỗi bảng trong ba bảng chính | 29 | 30 | 30 | 30 |
| Combine / CĐKT | 29 | 30 | 30 | 30 |
| Combine / KQKD và LCTT, mỗi bảng | 30 | 30 | 30 | 30 |

VPL thiếu FY2022 trong CaféF display. Hồ sơ v2 đã ghi nhận những tình huống vượt khỏi phép đếm đơn giản: TCX dùng khóa ngày, LPB/VHM/VIC cần xác minh binding cột cuối kỳ và VHM có NCI sai độ lớn trong extraction. HPG có fixture CaféF LCTT toàn số 0, cần kiểm tra lỗi nguồn trước khi dùng làm dòng tiền. Các trường hợp này là mẫu kiểm thử, từng kết luận vẫn phải dựa trên dòng và variant được chọn.

Manifest SHA-256 tại lần đọc:

| Manifest | SHA-256 |
|---|---|
| combine | `2466e3074f18ed211dc1ca5e1853a9a9ed3d1f99eb34b69923f3eca5b83ba97b` |
| PDF display | `9a1c6d72e08664b707da91e780b5ef3e4ca8a355e69edb1462917d5ca1e2308b` |
| CaféF display | `1fc2dfa29ee46f7018f9c40c4e7fcd3a6907685fd5ee85f82923739a7500ea35` |
| CaféF requests | `7395be743d963202503502e4e6be7b71dcb6a96bffda2286adccdd499e6c8032` |

Các kiểm tra trong amendment tập trung vào cấu trúc và inventory. Chất lượng kế toán, nguồn phát hành, thời điểm công bố và khả năng tái lập từng ô cần đánh giá riêng. Các đường dẫn lịch sử trước đợt rebuild 19/10/2026 thuộc layout cũ. Xem [REBUILT_DATA_WORKFLOW](https://github.com/nglehoangan/VN_30_Investment/blob/2c9f12828129e2a8d1df6c73eaa43bad754993fd/docs/fundamental-data-engine/REBUILT_DATA_WORKFLOW.md).

## 2. Data-First Research Workflow đề xuất

1. **Pin đầu vào.** Chọn mã, kỳ, cutoff và mode. Research FY2025 mặc định `AS_REVISED`, ghi ngày tạo và thời điểm retrieval riêng. Chỉ hỗ trợ kết luận `AS_KNOWN` khi có bằng chứng thông tin đã công bố và khả dụng tại cutoff theo contract hiện hành. Hash nhận diện bytes. Dữ liệu đến sau cutoff chỉ đi vào snapshot research khác.
2. **Lập bản đồ chỉ tiêu một lần theo mẫu.** Tái sử dụng retained-research loader hiện có để đọc combine và lần về PDF/API. Version hóa mapping theo ngành, loại báo cáo, caption/code/occurrence và template. So khớp ticker, kỳ, số tháng, ngày đóng kỳ, scope, audit/restatement, currency, scale và dấu trước khi so số. Tách riêng annual, quarter, YTD, instant và unresolved. Giữ số native và chuyển đổi bằng decimal có công thức. Mã dòng nguồn chỉ có nghĩa trong mẫu tương ứng.
3. **Chọn evidence theo từng dòng.** Ưu tiên số PDF được khai báo rõ trong JSON, tiếp theo aggregate PDF có thành phần và công thức truy vết được, sau đó CaféF như tham chiếu khi PDF thiếu. CaféF chỉ có thể hỗ trợ phép tính provisional khi mapping, unit, kỳ, scope và quality được chứng minh đủ cho phép tính. Với `providerUnit: null`, `modeMismatch`, hoặc số 0 theo cụm bất thường, giữ tham chiếu và trạng thái cần kiểm tra. Giữ số 0 được báo cáo rõ. Ô trống, dấu gạch chưa rõ nghĩa, dòng không map và dữ liệu thiếu giữ trạng thái riêng. Bảo toàn cả hai giá trị và căn cứ khi có conflict.
4. **Mở PDF theo ngoại lệ.** Kiểm tra đúng trang/cột khi OCR hoặc đơn vị mơ hồ, xung đột ảnh hưởng kết luận, thiếu operand quan trọng, có dấu hiệu restatement, hoặc cần thuyết minh về quyền ưu tiên, NCI, nợ và hạn chế tiền mặt. Ghi overlay có hash, page, locator, lý do, người/lượt kiểm tra và liên kết predecessor. Giữ nguyên JSON gốc. Nếu PDF hoặc chứng cứ chưa đủ, defer metric và mọi kết luận phụ thuộc. Các nhánh độc lập tiếp tục. Việc tìm nguồn mới tuân thủ chính sách Vietstock hiện hành.
5. **Phân tích và phản biện.** Tái sử dụng hồ sơ `investment-research-v2`, item decisions và kết quả R4 nếu input hash và tiêu chí còn khớp. AI chuẩn bị và challenge riêng, ghi evidence hỗ trợ, phản chứng, giả định và độ nhạy. Mỗi rubric dùng đúng band đã duyệt khi có đủ bằng chứng và phản chứng cho topic, gắn nhãn provisional. Khi thiếu, ghi `NOT_RATED` kèm lý do. Không quy đổi sang 0, không tái phân bổ trọng số, không phát điểm tổng hoặc ranking trên rubric chưa đủ. Pilot đề xuất chỉ xuất đánh giá theo rubric.
6. **Xuất dossier read-only.** Mỗi mục ghi ticker, metric/topic, kỳ và scope, giá trị hoặc null, unit/scale, JSON Pointer và hash, nguồn gốc PDF trang hoặc API request/raw locator, mapping version, dependency IDs và trạng thái. Dùng trạng thái research đề xuất `SUPPORTED`, `REFERENCE_ONLY`, `CONFLICT`, `MISSING` hoặc `NOT_RATED` theo loại mục. Tách facts, estimates và judgments. Mỗi scenario valuation ghi model, giả định, các cầu nối và điều kiện vô hiệu. Chỉ tính per-share/MoS khi có đủ share basis, corporate actions và giá tương thích cùng cutoff. Dữ liệu incomplete vẫn có thể hỗ trợ phân tích định tính hoặc độ nhạy có giới hạn.

### Hai luồng và điểm bàn giao

| | Research Provisional | Formal production acceptance |
|---|---|---|
| Đơn vị xử lý | Từng metric, rubric hoặc scenario, có thể partial | Dataset seal và issuer readiness theo route đã đăng ký |
| Đầu ra | Dossier có provenance, coverage, exceptions và nhãn provisional | Binding/artifact theo contract, sau khi đủ gate và sign-off có thẩm quyền |
| Bàn giao | Chuyển evidence locator và review rationale để xem xét | Revalidate độc lập theo route, seal đúng cutoff/snapshot, kiểm DI1–DI15, strict-v2 và market/share/valuation prerequisites tương ứng. Không copy trạng thái PASS hoặc nhãn acceptance từ research. |

Personal AI route giữ 30 mã, exact registration/binding và preparation/challenge thực sự được xác thực theo contract. HUMAN và Policy B 29 mã giữ semantics riêng. Research tách khỏi canonical tables, registry, scoring/ranking, Buy/Sell, DCA, ledger và NAV. R4 ghi **4/690** rubric research hoàn tất, **686/690** hiện `NOT_RATED`, **0/30** issuer được chấp nhận hoàn chỉnh. Đây là số liệu trong receipt R4, không phải một lần chạy scoring mới. [R4 final assessment](https://github.com/nglehoangan/VN_30_Investment/blob/2c9f12828129e2a8d1df6c73eaa43bad754993fd/docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-04/m8-r4-evidence-rubric-completion-v1/R4_FINAL_ACCEPTANCE_ASSESSMENT.md) · [Personal AI contract](https://github.com/nglehoangan/VN_30_Investment/blob/2c9f12828129e2a8d1df6c73eaa43bad754993fd/docs/fundamental-data-engine/PERSONAL_AI_SCORING_CONTRACT_V1.md)

## 3. Impact analysis M1–M8

| Milestone và tài liệu liên quan | Delta đề xuất sau approval | Bằng chứng review |
|---|---|---|
| M1 · Investment Policy, Scoring Model, Risk Policy | Ghi phạm vi research trong tài liệu successor. Baseline vẫn điều chỉnh investment criteria, weights và veto. | Trace mỗi assessment tới version band; không có thay đổi nội dung hoặc đăng ký methodology. |
| M2 · Data Model, Data Rules, VN30 Master | Mô tả research evidence record và mapping theo layout thực tế. Tách raw/extracted/selected/derived, scope, unit và thời gian. | Manifest đối chiếu đúng 30 mã; replay lineage một mẫu bank, securities, corporate và real estate; kiểm quarter/YTD, missing và restatement. |
| M3 · Scoring Engine, Metric Definitions, Sector Normalization | Thêm hướng dẫn research theo metric/rubric, tận dụng operand đạt mức research; dùng đúng định nghĩa và band. | Kiểm propagation, null/zero, peer comparability, debt contract; formal ranking không đọc research. |
| M4 · Decision Engine, Buy/Sell, Position Sizing | Gắn dossier như tài liệu tham khảo trong quy trình đọc. Giữ ranh giới với input decision. | Chứng minh dossier provisional không tạo decision artifact, không thay action hoặc sizing. |
| M5 · Operating Model, Review Templates, DCA | Cho phép review định kỳ ghi thesis, phản chứng và exception queue trong phần research riêng. | Review liên kết evidence, lưu lịch sử theo phiên; DCA, cash và ledger không đổi qua replay. |
| M6 · Scoring/Ranking, Dashboard, Integration | Nếu được duyệt triển khai, tái sử dụng loader/DTO retained research và bề mặt read-only riêng. Cô lập persistence và export với production. | Test route/DTO, cảnh báo provisional, fixture malformed/missing, thử đưa research object vào formal scorer và xác nhận bị từ chối. |
| M7 · Data/Scoring Validation, Traceability Matrix | Thêm ma trận kiểm chứng research và replay theo hash. Lưu expected vs actual cho các ngoại lệ quan trọng. | Test cases và golden references có kiểm tra độc lập; không dùng pilot để đóng historical, paper/forward hay release gates. |
| M8 · Production Acceptance, Runbook, R4 | Thêm quy trình nghiên cứu và handoff evidence theo item. Giữ R4 baseline và trạng thái formal; tạo successor receipt khi có ứng viên mới. | Danh sách blockers theo dependency, evidence đủ/thiếu, exact seal và sign-off riêng qua contract hiện hành. |

## 4. Phạm vi approval và tiêu chí dừng

- **Quyết định đề nghị.** Duyệt thiết kế hai luồng và cho phép pilot chỉ đọc sau approval. Phạm vi pilot đề xuất là FPT, VNM, BID, TCX, VIC và VHM để bao phủ mẫu corporate, bank, securities, nhóm phức hợp và lỗi scope/kỳ/OCR đã biết. Pilot xuất dossier theo rubric, coverage 30 mã ở mức inventory, exception queue và evidence replay mẫu.
- **Tiêu chí pilot.** Replay từ cùng input hashes cho cùng lựa chọn, phép tính và trạng thái. Mỗi kết luận định lượng có đủ operands và lineage. Kiểm các ca OCR VHM, ngày TCX, CaféF thiếu unit, LCTT toàn 0 HPG bằng fixture bổ sung, và conflict chỉ lan theo dependency. So sánh baseline trước/sau để chứng minh research không đổi scoring weights, registries, DI gates, canonical state hay kết quả decision/DCA. Từng issuer chưa đủ được ghi rõ blocker.
- **Sau pilot.** Owner review dossier, validation và phạm vi mở rộng 30 mã. Formal acceptance và activation là các quyết định riêng theo M8. Khi pilot sai lineage hoặc vi phạm ranh giới, dừng xuất và loại bỏ đầu ra provisional của lần chạy. Tái lập từ snapshot đã pin sau khi sửa, giữ audit lịch sử.
- **Disposition hiện tại.** `DRAFT — PENDING OWNER REVIEW`. Chưa sửa code, config, weights, gate, dữ liệu hoặc tài liệu approved. Bản dự thảo đặt trong workspace review, chưa commit/push vào repo.
