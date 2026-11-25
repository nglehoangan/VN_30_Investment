# FPT Workstream A — successor candidate v1

**PASS_WITH_LIMITATIONS** · FPT / TECHNOLOGY · economic cutoff 13/11/2026. Workstream A candidate authorization only. The latest SEGM v1.3 findings and retained issuer files were reconciled against the V8 current-purpose dataset and M3 1.0.0. The candidate uses current-purpose evidence and makes no Historical PIT claim. FY2025 remains the annual base. The 9T publication, available before cutoff, is considered for impact. Its reviewed financial cells are corroborating research outside the V8 dataset.

| Scope | Verified | Conservative | N/R | Rated points / weight |
|---|---:|---:|---:|---:|
| Official V8 | 2 | 0 | 21 | 5/10 |
| Workstream A candidate, EBCS structural validation | 2 | 1 | 20 | 5/12 |

EBCS returned `RESEARCH_ONLY`. Candidate confidence is LOW, full official score is null, ranking and allocation are false. Only `RG-UNC` obtains a new candidate assessment. All three topics and the strongest available counterargument were bound to the scored assessment; the conservative band is High uncertainty. This zero is a scored anchor. 15 FY2025-rated rubrics were not promoted. In addition, five rubrics already lacked FY2025 research points. The two exact V8 assessments were carried forward.

- [Single successor input](FPT_WORKSTREAM_A_SUCCESSOR_V1.json), SHA-256 `e701a36a3f505c122e95cbc972d1934b55ae8de9a6bf6b5813241c148d63180d`. Engine input hash `d751cbe14b67b060c6dc9c154edbf7384a0c66c5bc01216fe47d886b9142cfe7`.
- [FY2025 research](../FPT_23_RUBRIC_FY2025_RESEARCH_SCORECARD.md), [23-row handoff](FPT_CUTOFF_RUBRIC_HANDOFF.json), [SEGM v1.3](FPT_SEGM_V13_RECONCILIATION.md), [retained topic evidence](FPT_PREPARE_WORKPACK.json), [V8 readback](FPT_V8_SCORE_READBACK.json), [normalization review](../FPT_BQ_EQ_INVESTED_CAPITAL_BRIDGE_2026-11-23.md).
- Verified all 23 research references against the handoff pins. Read-only SQLite verified stored historical admission hash `6239266e4aff895eed72c9f38a9f5a182990e086d92b5f6d5c831d95b923a6b6` and the exact V8 body hash `4eed8f0bf117e332fb56855df7702f1026182120e04f2f91bacc3880fe446b20`. No successor score is in SQLite. The authority and publication routes were not edited.
- GQ-HIST and CA-PSV were checked against M3 corporate-action requirements. The retained FY comparisons adjust past stock actions but do not close comparable post-FTEL per-share economics. The V8 action-comparability flag stays false. The gap is scoped evidence, not an engine defect.
- M1 is PENDING. Valuation is blocked by normalized earnings/cash flow after FTEL. Decision is blocked. Official scoring of the candidate needs governed source/topic binding, accepted preparation and challenge at the exact successor hashes, and exact successor scoring authority under the limited-scope policy. Publication requires separate explicit authority. Workstream B was not started.

## Reconciliation matrix

The outcome column compares FY research with 9T/current research. N/R rows in the candidate retain null points. The source link on each row points to a pinned workpack or an assessment with exact locators.

| Rubric | FY2025 | 9T research | V8 | Validated candidate | Incremental outcome | Specific blocker or applied fix |
|---|---:|---:|---:|---:|---|---|
| BQ-EQ | 5 | N/R | N/R | N/R | RATED_TO_N/R | Kỳ tương lai có thêm số dư vốn đầu/cuối kỳ cùng phạm vi; cần đối chiếu với NOPAT chuẩn hóa và chi phí vốn có căn cứ. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| BQ-MOAT | 3 | 3 | 3 | 3 | KEEP | Retained exact V8 assessment. [V8](FPT_V8_FORMAL_ASSESSMENT.json) |
| BQ-CASH | 3 | N/R | N/R | N/R | RATED_TO_N/R | Kỳ tương lai có cả năm CFO và capex cùng phạm vi, cầu nối vốn lưu động và khoản một lần để xác nhận dòng tiền qua chu kỳ. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| BQ-RES | 3 | N/R | N/R | N/R | RATED_TO_N/R | Dữ liệu tập trung doanh thu hoặc kết quả các mảng qua cú sốc, đủ để phân biệt sức giữ giá và sức chống chịu. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| FH-BS | 3 | 3 | N/R | N/R | REVIEW_REQUIRED | Reported debt is bound. Join same-period equity, receivable provision/recovery and funding quality as admitted inputs. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| FH-LIQ | 2 | N/R | N/R | N/R | RATED_TO_N/R | Kỳ hạn tiền khả dụng đủ chi tiết hoặc xác nhận hạn mức cam kết có thể rút đúng mốc, ghép với nghĩa vụ lũy kế. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| FH-STRESS | N/R | N/R | N/R | N/R | KEEP · N/R | Nguồn vốn, khoản chi trì hoãn và thời điểm thu chi đã kiểm chứng để lập kịch bản phối hợp. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| GQ-HIST | 3 | 3 | N/R | N/R | REVIEW_REQUIRED | Action comparability remains open. Reconcile adjusted EPS and M&A in a comparable post-FTEL series. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| GQ-FWD | 3 | 3 | N/R | N/R | REVIEW_REQUIRED | Signed contracts show demand. Bind conversion and the funding capacity for deployment before supporting Moderate visibility. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| GQ-INC | N/R | N/R | N/R | N/R | KEEP · N/R | Cầu nối NOPAT và vốn tăng thêm loại M&A, hoặc chỉ tiêu kinh tế đơn vị tương đương có căn cứ. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| IC-IND | 2 | 2 | 2 | 2 | KEEP | Retained exact V8 assessment. [V8](FPT_V8_FORMAL_ASSESSMENT.json) |
| IC-POS | 2 | 2 | N/R | N/R | REVIEW_REQUIRED | Commercial footprint is evidenced. Bind a same-scope market denominator and cost position against peers. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| IC-CYCLE | 1 | N/R | N/R | N/R | RATED_TO_N/R | Quan sát đơn hàng hoãn/hủy, công suất nhân sự và kịch bản tài trợ/chịu đựng phù hợp. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| VAL-PRIMARY | N/R | N/R | N/R | N/R | KEEP · N/R | Chuẩn hóa lợi nhuận sau FTEL, dựng mô hình ngành và đối chiếu độc lập trên đúng cơ sở cổ phiếu. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| VAL-RET | 2 | N/R | N/R | N/R | RATED_TO_N/R | Mô hình gắn giá 13/11, EPS hoặc dòng tiền chuẩn hóa, phân phối, pha loãng và giá trị thoát. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| VAL-MOS | 1 | N/R | N/R | N/R | RATED_TO_N/R | Khoảng giá trị bảo thủ đã phản biện, kiểm tra biến động chuyển đổi tiền, đòn bẩy và tài trợ. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| RG-GOV | 3 | 3 | N/R | N/R | REVIEW_REQUIRED | Issuer disclosures and audit evidence exist. Bind actual related-party oversight, voting and minority impact to the required governance topics. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| RG-RISK | 2 | N/R | N/R | N/R | RATED_TO_N/R | Biện pháp giảm thiểu có bằng chứng hiệu lực và kết quả kịch bản hiện hành. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| RG-UNC | 0 | N/R | N/R | 0 | KEEP · independent interim review | Bound forecast range, sensitivity and dependencies plus counterevidence. EBCS validated conservative 0. [Candidate input](FPT_WORKSTREAM_A_SUCCESSOR_V1.json) |
| CA-REINV | N/R | N/R | N/R | N/R | KEEP · N/R | Dòng tiền/lợi nhuận sau các quyết định trọng yếu và đối chiếu khoản thoái vốn hoặc xác nhận không áp dụng. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| CA-DIST | 1 | N/R | N/R | N/R | RATED_TO_N/R | BCTC riêng kỳ tương lai cùng phạm vi và chứng cứ áp dụng về mua lại, đủ lượng hóa sức bền phân phối. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| CA-DIL | N/R | N/R | N/R | N/R | KEEP · N/R | Điều khoản từng đợt trọng yếu, tiền thu và đối chiếu tác động kinh tế tích lũy trên mỗi cổ phiếu. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |
| CA-PSV | 1 | 1 | N/R | N/R | REVIEW_REQUIRED | Maximum anchor requires cycle- and action-adjusted per-share compounding. Bind adjusted share basis and comparable cash/earnings across FTEL. [Topic and source evidence](FPT_SEGM_V11_DIAGNOSTIC.json) |

## Regression

50 Python tests and 214 TypeScript tests passed. The publication suite needed a temporary Node-test alias for the missing `server-only` marker after it failed to import in the default configuration. The isolated rerun passed all five publication tests. Current parity and `git diff --check` passed. The new packet and matrix are the only repository deliverables from this run.
