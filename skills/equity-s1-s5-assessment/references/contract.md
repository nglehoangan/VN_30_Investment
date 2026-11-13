# Input / output contract

## Invocation

Ví dụ yêu cầu:

> Dùng $equity-s1-s5-assessment đánh giá FPT tại 2026-10-30, sàn HOSE, ngành TECHNOLOGY, mục đích retrospective research; dùng dữ liệu đã giữ, đánh giá S1–S5, không production.

Input có thể là prose hoặc JSON; không cần tạo file cấu hình nếu chưa có nhu cầu chạy lặp:

```json
{
  "ticker": "FPT",
  "exchange": "HOSE",
  "cutoff": "2026-10-30",
  "sector": "TECHNOLOGY",
  "purpose": "RETROSPECTIVE_RESEARCH",
  "stages": ["S1", "S2", "S3", "S4", "S5"],
  "retainedLocations": ["data/manual-extracted-pdf/FPT.json", "data/combine/FPT.json"],
  "existingAcceptanceLocations": [],
  "outputRoot": "docs/fundamental-data-engine/equity-assessments/FPT/2026-10-30",
  "acquisitionScope": "RETAINED_ONLY"
}
```

Example paths là vị trí để kiểm tra, không khẳng định nguồn FPT đã đủ điều kiện. `sector` phải resolve về registry hiện hành; nhãn business consumer không tự là một enum mới. `purpose`: RETROSPECTIVE_RESEARCH, CURRENT_FORMAL_VALUATION hoặc HISTORICAL_PIT. Mục đích formal/PIT không cấp authority; kiểm hợp đồng tương ứng trước khi consumer dùng. Ngành/cutoff chưa xác định chỉ hỏi phần thực sự không suy ra được từ nguồn hiện có; không hỏi lại owner decisions đã lưu.

Output root tách ticker/cutoff và run hoặc successor khi đã có output: không overwrite sealed acceptance. Ghi `reviewedAt` thật khi đánh giá; replay giữ timestamp review gốc, runtime timestamp để riêng. Scope nhiều mã là danh sách yêu cầu rõ, không ghép evidence của mã này vào mã khác.

## Artifacts

Chỉ tạo artifacts cho stages được yêu cầu; phần không chạy đánh dấu NOT_ASSESSED, không giả PASS. Dùng một provenance ledger chung để tránh lặp inventory:

| Artifact | Nội dung |
| --- | --- |
| `ASSESSMENT_CONTEXT.json` | Ticker/exchange/cutoff/sector/purpose, review time, policy/source/model bindings, accepted predecessors, covered scopes/periods |
| `EVIDENCE_LEDGER.json` và `SOURCE_PINS.json` | Source identity/hash/receipt, selected cells/claims và conflicts; không cần liệt kê lại toàn corpus |
| `S1_ECONOMIC_RETURNS.json` | Normalization/capital/returns/cost/current-update/comparability và limitations |
| `S2_LIQUIDITY_CALCULATIONS.json` | Availability classes, maturity buckets, obligation bridges, funded stress và adverse sensitivities |
| `S3_EVIDENCE_MATRIX.json` | Definitions, evidence/counterevidence và mandatory topic assessments |
| `S4_ACCEPTANCE.json` | Kết quả/path tới output skill S4 hiện có; không tạo bản copy raw history |
| `S5_VALUATION_INPUTS.json`, `S5_SCENARIOS.json`, `S5_EXPECTED_RETURN.json` | Model/perimeter, source/assumption bridges, Bear/Base/Bull, sensitivity, value/return/MOS hoặc N/R |
| `S1_S5_ACCEPTANCE.json` | Stage-by-stage research disposition với exact applicable rules và validation evidence |
| `ASSESSMENT.md`, `CURRENT_BLOCKER_REGISTER.md` | Kết luận dễ đọc, assumption drivers, limitations và chỉ các blocker còn hiệu lực |
| `VALIDATION.json` | Lệnh/phiên bản thực chạy, kết quả, replay hashes và protected-state integrity; unrun checks NOT_RUN |

Tên/calculation structure có thể dùng existing engine outputs để tránh duplicate. Input/output JSON dùng decimal strings + currency/unit; ratio dạng fraction có nhãn, không lẫn percentage points. N/R dùng null kèm reason và scoring effect, không string “0”. Missing/dash/null/explicit zero giữ khác nhau trong lineage.

## Evidence row tối thiểu

- Ticker, security/issuer/document/report identity, scope, period/as-of, revision và source role.
- Native value/claim, unit/currency, exact source caption/definition, transformation/formula và selected evidence path/JSON Pointer hoặc PDF/page/box.
- Hash raw/extracted bytes phù hợp, source URL/path, original receipt. Không dùng review time thay original receipt.
- Economic/effective date, publication evidence/date, retrievedAt và reviewedAt là các trường riêng; unknown giữ null kèm limitation. Không đổi announcement thành effective/payment date.
- FACT/ESTIMATE/ASSUMPTION/ANALYST_JUDGMENT; conflicts/alternatives retained, qualification purpose và verified vs candidate status.

Một row có thể refer tới ledger chung thay vì lặp source text. Extracted JSON pointer với PDF trực tiếp phải còn resolve; pointer lịch sử tới file đã xóa không được trình bày là extant replay.

## Acceptance row tối thiểu

`stage`, `researchStatus` (CLOSED / BLOCKING / NOT_ASSESSED), `scope`, `cutoff`, `purpose`, `mandatoryRequirements[]`, `confidence`, `limitations[]`, `validationRef`, `supersedesResearchOnly`.

Mỗi mandatory requirement ghi rule path/section/version hash, evidence references, result PASS / PASS_WITH_LIMITS / N_R_PERMITTED / FAIL và rationale. N_R_PERMITTED phải viện dẫn missing-data rule và giải thích ảnh hưởng; không nhầm source availability với formal admission.

Issue residual ghi `disposition` BLOCKING hoặc NON_BLOCKING, exact dependency, materiality/decision sensitivity, exact rule, responsible boundary, smallest action, và `newUserInformationRequired` với lý do. Không dùng % hoàn thành thay acceptance.

Giữ các gate riêng, không tự suy theo researchStatus:

- source availability / canonical validation / formal admission / consumer readiness;
- historical PIT qualification;
- formal scoring authorization / M1-M4 decision gates;
- production activation.

Mặc định skill không cấp formal approval/points/action. Nếu một gate thực sự đã được duyệt, giữ nguyên reference chủ sở hữu/trusted authority và đúng phạm vi thay vì tự tạo authorization mới. Thiếu authority không phải thiếu financial data. VNM17 pending không được “thừa kế” approval từ skill.

## Validation phù hợp

- Verify policy/source hashes, ticker/scope/unit/period identity và actual extraction khi có selected new cells. Missing raw close/conflicting financial values phải giữ NOT_QUALIFIED/quarantine theo existing contract.
- Model checks theo nhánh thực dùng: FCFF/FCFE/equity consistency, growth/terminal funding, debt/cash/interest/dividend/NCI nonduplication, IRR/PV, maturity and liquidity perimeter. Không áp industrial formula vào bank để test dễ PASS.
- Negative cases liên quan: absent indispensable input, incomplete coverage, changed hash, cross-ticker input, post-cutoff publication trong PIT, và assumptions ngoài supported envelope. Không cấp closure từ thiếu evidence hoặc test xanh.
- Replay deterministic economic và acceptance outputs; kiểm source/DB/portfolio/scoring-policy bytes trước/sau. Chỉ research script/docs thay đổi thì chạy focused checks và suites bị tác động; không giả cần test toàn hệ thống hoặc live ingestion.

Không có generic calculator auto-close trong skill này. Agent dùng engine/adapters đủ điều kiện hiện có hoặc xây bounded research model theo contract khi được yêu cầu; mọi triển khai mới phải kiểm riêng. Như vậy hỗ trợ nhiều ngành không bị đánh đồng với việc đã có validated adapter cho mọi ngành/mọi metric.
