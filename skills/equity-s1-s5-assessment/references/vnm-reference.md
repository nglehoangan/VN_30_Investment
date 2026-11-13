# VNM — ví dụ đã thực hiện, không phải defaults

Reference cutoff 2026-10-30, review 2026-11-13. S5 baseline commit `8eb567db0b92f94975819531c2131f4845786be0`. Các path dưới đây từ gốc repo. Đọc JSON/VALIDATION thực tế khi cần reuse; không chỉ dựa vào bảng này.

| Stage | Cách giải quyết có thể tái sử dụng | Reference |
| --- | --- | --- |
| S1 | Chuẩn hóa NOPAT/capital cùng scope, cost range có nguồn, annual plus period-matched current update; giữ incremental/exact TTM ROIC N/R theo comparability thay vì đòi project detail | `docs/fundamental-data-engine/vnm-s1-closure/2026-11-13/S1_CLOSURE.md`, `S1_ACCEPTANCE.json`, `VALIDATION.json`; risk/current inputs: `docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/WACC_ROIC_Q3_ASSESSMENT.json` |
| S2 | Public disclosure stress, nguồn/nghĩa vụ cùng parent perimeter, dividend và debt theo timing, giữ adverse sensitivity; loại yêu cầu tùy ý giữ toàn cash khi đã budget operating stress | `docs/fundamental-data-engine/vnm-s2-public-disclosure/2026-11-13/S2_CLOSURE.md`, `S2_CLOSURE_ACCEPTANCE.json`, `S2_CLOSURE_VALIDATION.json`, `FINAL_S2_CALCULATIONS.json` |
| S3 | Definition firewall, issuer attribution, own-history/absolute economics và counterevidence; không biến household reach/brand rank thành share hoặc lowest cost | `docs/fundamental-data-engine/vnm-s3-closure/2026-11-13/S3_COMPETITIVE_POSITION_RESOLUTION.md`, `S3_EVIDENCE_MATRIX.json`, `S3_IC_POS_ASSESSMENT.json`, `S3_ACCEPTANCE.json`, `VALIDATION.json` |
| S4 | Raw-only price, verified corporate actions, owner-approved share carry-forward, research/formal/PIT tách biệt | `skills/vn30-market-price-corporate-actions/SKILL.md`; `docs/fundamental-data-engine/CAFEF_RAW_CLOSE_ONLY_POLICY.md`; `docs/fundamental-data-engine/vnm-s4-share-carry-forward/2026-11-12/REVIEW.json` |
| S5 | Parent operating FCFF + financial runoff + shareholder distribution ledger; financial income excluded khi assets được valued riêng; year6 growth funding và no-point-MOS khi range rộng | `docs/fundamental-data-engine/vnm-s5-closure/2026-11-13/S5_VALUATION_RESOLUTION.md`, `S5_VALUATION_INPUTS.json`, `S5_SCENARIOS.json`, `S5_EXPECTED_RETURN.json`, `S5_ACCEPTANCE.json`, `VALIDATION.json` |

## Những điều không được generalize

- VNM shares, giá, cash/deposits, dividend amounts/dates, earnings và resulting values chỉ thuộc VNM đúng cutoff. Không dùng cho ticker khác hoặc “giá hiện tại”.
- S1 group ROIC là prudential growth-return reference cho VNM model, không measured parent/project incremental ROIC; kết luận high historical returns không tự chứng minh mọi future reinvestment tốt.
- Parent model S5 đã chọn perimeter riêng để reconcile shareholder cash. Không default parent liquidity/valuation cho doanh nghiệp có cash flow/obligations chủ yếu ở subsidiaries.
- Tax20%, employee-fund10%, maintenance1–1.5×D&A, financial-runoff assumptions, strategic budget, historical payout cap và growth/Ku/terminal values là VNM research estimates. Không dùng làm default hoặc standing policy.
- S2 không chứng nhận mọi unknown deposit freely available; stress public assumptions/coverage và confidence limits vẫn giữ. Không xóa adverse cases để đạt CLOSED.
- S5 model.py/build.py là issuer-specific reference, không generic evaluator. Không đổi ticker string rồi chạy cho ngân hàng hoặc mã khác; loại bỏ source-specific constants và thiết kế bindings/method phù hợp trước khi reuse code.
- Năm 2025 finance cash receipt phải lấy đúng column; chỉ cùng số hoặc cùng row code không đủ xác định kỳ/scope. Đây là lỗi mà source caption/column provenance phải phòng tránh, không phải một special-case adjustment để nhân rộng.
- S1–S5 research closure không cấp điểm /100, full scoring readiness, VNM17 admission, nguồn mới hoặc production. Successor blocker register S5 giữ riêng scorer/dataset/executable gates; không sao chép các blocker kỹ thuật VNM sang issuer khác nếu chưa kiểm tra.

## Kiểm tra khả năng áp dụng trước khi dùng

| Tình huống | Hành vi cần có |
| --- | --- |
| Ngân hàng với industrial CFO thiếu | Route bank metrics/valuation; không tạo CFO data gap hoặc trừ deposit funding như industrial debt |
| Doanh nghiệp không có project-level incremental data | Kiểm same-basis historical comparability; nếu policy cho phép thì N/R với effect, không tự tạo request từng nhà máy |
| Quarterly deposit terms rút gọn | Reuse năm/bán niên có ngày, kiểm current change, public bucket và supported stress; không claim unrestricted hoặc bắt buộc từng sổ |
| Market position chỉ có household reach | Giữ reach/issuer reporting; exact share N/R, assess mandatory topics qua nguồn phù hợp |
| Raw close thiếu nhưng adjusted có | S4 NOT_QUALIFIED; không fallback |
| Prior stage CLOSED, có evidence mới mâu thuẫn | Reopen đúng defect/phạm vi, không đánh giá lại toàn bộ accepted corpus |
| Evidence retrieved sau cutoff | Retrospective/current purpose có thể đánh giá theo contract; PIT không được suy từ research acceptance |
| Các primary cases tính ra giá thấp | Giữ kết quả; không sửa assumptions để đạt target hoặc gán formal scoring0 |
| Không biết indispensable capital/claim có thể đảo kết luận | BLOCKING với dependency/sensitivity chính xác; không dùng test xanh hoặc generic “cần báo cáo mới” |

Đây là review cases cho instruction design, không phải tuyên bố đã chạy real-data multi-sector admission hoặc validated mọi mô hình ngành. Mỗi lần đánh giá mã mới phải có evidence/validation riêng.
