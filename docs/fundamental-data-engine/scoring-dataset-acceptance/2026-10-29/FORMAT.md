# Format hồ sơ nghiệm thu dataset scoring

Dự án đã có quy định nội bộ. Contract đang được code thực thi là **`independent-di-acceptance-v1`**. Tạo mới acceptance chính thức phải dùng readiness algorithm **`strict-canonical-m3-readiness-v2`**.

Nguồn quy định:

- `docs/08_CONTINUOUS_IMPROVEMENT/DATA_INITIALIZATION.md`, mục28: DI1–DI15, cùng mục35/36 về giới hạn phê duyệt và amendment manual-first.
- `src/domain/fundamentals/scoring-readiness.ts`: interface DataInitializationAcceptance; validateDIAcceptance, bindDIAcceptance, evaluateScoringReadiness.
- `src/infrastructure/repositories/scoring-datasets.ts`: kiểm tra independent review binding, đăng ký methodology, snapshot và quyền scoring theo từng mã.

## File đã tạo

**`acceptance.draft.json`** là phiếu chuẩn bị nghiệm thu có trạng thái `DRAFT_NOT_APPROVED`. Đã điền catalog30mã từ universe đang giữ, phương pháp scoring hiện được phê duyệt và đủ15dòng gate. Các dữ kiện chưa có giữ null/NOT_EXECUTED; các Major chuẩn bị hồ sơ vẫn OPEN.

File có phần `formalPayload` với đúng18tên trường của contract thật. Wrapper, gateReview, requirements draft và ticker catalog giúp đọc/điền hồ sơ; chúng không thuộc payload runtime. `validation.json` xác minh tên trường với AST của interface hiện tại, số mã/gate và việc runtime từ chối bản nháp thiếu dữ kiện. DB không thay đổi.

## Các trường cần hoàn thành trong formalPayload

| Trường | Nội dung/quy tắc |
| --- | --- |
| contract | Giữ `independent-di-acceptance-v1` |
| id | ID duy nhất của hồ sơ nghiệm thu cuối cùng |
| snapshotRunId | ID snapshot thật đã seal, scope FORMAL, mode AS_KNOWN; revisionCutoff=null |
| contentHash | Hash nội dung của **snapshot**, khớp snapshotRunId |
| manifestDigest | SHA256 của đúng chuỗi manifest mà snapshot sử dụng; không hash lại bản JSON đã đổi định dạng |
| requirements | Policy readiness native đã được phê duyệt, đủ sector routes và input requirements |
| requirementsHash | Hash canonical của requirements ở trên |
| scoringMethodologyHash | Hash canonical của methodology thực tế trong ScoreInput; bản nháp đã pin model hiện hành |
| universeHash | Hash universe reference trong snapshot request; không tự thay bằng hash danh sách ticker |
| acceptedAt | Timestamp nghiệm thu thật, không điền trước thời điểm review/phê duyệt |
| producerReference | Người/đơn vị tạo dataset và bằng chứng nhận diện |
| reviewerReference | Reviewer độc lập; phải khác producer và có hồ sơ review kiểm chứng được |
| reviewArtifactReference | Hồ sơ review expected/actual cùng evidence |
| approvalReference | Quyết định chấp thuận **dataset này**, gắn đúng hash/phạm vi |
| methodologyId | ID policy/methodology cho nghiệm thu DI được đăng ký; khác vai trò methodology scoring |
| gates | Chính xác15gate DI1–DI15, mỗi gate có status=PASS và evidenceReference sau kiểm định |
| issues | Issue register thực tế; Critical/Major cần resolutionReference có bằng chứng |
| tickers | Đúng30securityId, không trùng. Mã được đề nghị scoring phải có ScoreInput và bridge đã review |

### Requirements và input theo mã

Policy requirements native có các trường: `version`, `algorithm`, `governanceStatus`, `approvalReference`, `methodologyId`, `recordedAt`, `effectiveDate`, `authorityReferences`, `flowTechnical`, `sectors`.

Mỗi sector route phải nêu `sector`, `requiredItems`, `requiredMetrics`, `requiredMarketObservations`, `requiredValuationObservations`; phải hợp lệ với canonical registry và bộ metric được code hỗ trợ. Quy tắc ngân hàng được kiểm tra riêng. Draft có khung để chuẩn bị, chưa tự xác định hay phê duyệt yêu cầu ngành.

`manual-fundamental-evidence-requirements-v2.json` là contract khác với native readiness requirements; không copy trực tiếp để thế vào requirements.

Mỗi ticker có cặp `input`/`bridge`: cùng null hoặc cùng có dữ liệu. Null biểu thị chưa đủ hồ sơ/không được cấp scoring; không phải số0. Giữ cả mã deferred trong universe. Catalog SCORABLE29/DEFERRED1 được dùng làm điểm bắt đầu đối chiếu, không chứng minh29mã đã readyForScoring.

## Checklist15gate

| Gate | Kiểm tra |
| --- | --- |
| DI1 | Nguồn VN30 master và ngày hiệu lực |
| DI2 | Universe đầy đủ, không trùng |
| DI3 | Sector mapping |
| DI4 | Market data bắt buộc |
| DI5 | Fundamentals bắt buộc |
| DI6 | Kỳ báo cáo/đơn vị/chuẩn hóa |
| DI7 | Missing-data checks |
| DI8 | Freshness |
| DI9 | Conflict/impossible values |
| DI10 | Lineage metric dẫn xuất |
| DI11 | Point-in-time controls |
| DI12 | Snapshot identity tái lập |
| DI13 | Readiness từng mã được xác định |
| DI14 | Review chất lượng dữ liệu độc lập |
| DI15 | Không còn Critical/Major chưa giải quyết |

Với mỗi gate, ghi expected, actual, artifact và reviewer trong gateReview. Chỉ chuyển status trong formalPayload thành PASS khi có bằng chứng tương ứng. Ví dụ test hash/lineage của corpus đang giữ không tự chứng minh đúng nội dung kế toán hoặc DI11/DI14 đã đạt.

## Trình tự hoàn thành và ghi nhận

1. Xây snapshot FORMAL/AS_KNOWN đủ điều kiện, ghi đúng run/content/manifest/universe bindings.
2. Hoàn thiện native readiness-v2 policy và đăng ký governance policy tương ứng; đối chiếu methodology scoring hiện dùng.
3. Review input/bridge từng mã đề nghị scoring. Ghi rõ mã blocked/deferred và giải quyết các preparation/data issues.
4. Thực hiện DI1–DI15, lập review độc lập và quyết định approval thật. Producer và reviewer khác reference là điều kiện tối thiểu của code; hai chuỗi khác nhau không tự chứng minh tính độc lập.
5. Xuất riêng formalPayload hoàn chỉnh với đúng các trường contract; không mang wrapper/draft-only fields vào runtime. Tính `acceptanceHash = snapshotHash(toàn bộ acceptance cuối cùng)`, bao gồm trường contentHash của snapshot. Đây là hash riêng, khác snapshot.contentHash.
6. Cấu hình trusted `IndependentDIReviewBinding = {acceptanceHash, reviewerReference, approvalReference}`; đăng ký methodology nghiệm thu với configurationReference `di-acceptance-sha256:<acceptanceHash>` và policy requirements với `readiness-requirements-sha256:<requirementsHash>` theo quy tắc repository.
7. Dùng luồng appendAcceptance được kiểm định. Mỗi lần scoring tiếp tục kiểm tra dataset binding và readyForScoring của mã đó.

## Những gì đang thiếu tại thời điểm tạo bản nháp

DB hiện có0formal snapshot run,0acceptance,0scoring binding. Cần hoàn thành snapshot, policy readiness native, input/bridge từng mã, evidence15gate và hồ sơ producer/reviewer/approval/binding. Phê duyệt executable scoring đang có không được sao chép thành phê duyệt dataset.

Tạo file này không làm thay đổi quyền Production, ghi acceptance vào DB hoặc đóng các blocker thị trường/nghiệm thu. Script tạo draft: `scripts/create-scoring-acceptance-draft.mjs`; script từ chối ghi đè draft hiện có để những lần làm tiếp dùng revision rõ ràng.
