# M6.3 — Verification audit 2026-09-17

> **Closure update:** Đây là kết quả trước khi sửa. C01/M01/M02/M03 đã được xử lý và kiểm chứng trong [completion report](COMPLETION_REPORT_2026-09-17.md). Giữ nguyên findings và kết quả fail bên dưới để bảo toàn audit trail.

**Kết luận: CHƯA HOÀN TẤT. Có 1 Critical và 3 Major chưa xử lý.** Theo §43 và DoD 27–28, không được chốt M6.3 hoặc chuyển milestone dựa trên kết luận hoàn tất cũ.

Phạm vi: đối chiếu toàn bộ 46 mục brief và 30 điều kiện DoD với source, approved M2 contracts, migration, tests, ADR và implementation report. PASS nghĩa là có evidence trong phạm vi kiểm tra, không phải chứng minh tuyệt đối mọi input. PARTIAL nghĩa là có implementation nhưng thiếu coverage, contract hoặc evidence; HISTORICAL PASS không phải lần chạy mới. Không quy đổi các dòng thành phần trăm hoàn tất vì các blocker liên quan nhau.

## Findings

### AUDIT-C01 — Critical: duplicate corporate action được ghi vào ledger

- Vị trí: `src/application/portfolio/engine.ts:23`. Duplicate check coi action cũ đã vô hiệu nếu tìm thấy bất kỳ reversal nào, không so effective time của reversal với action mới.
- Tái hiện bằng real SQLite: deposit 10,000 ngày 1; BUY 100 @10 ngày 2; split 2:1 cùng issuer-action ngày 3 (+100); reversal ngày 5; sau đó post lại chính stage/action đó với effective date ngày 4 (+200).
- Expected: reject vì ngày 4 action gốc vẫn active. Actual: `POSTED`, watermark 5, projection `VALID`; cuối chuỗi quantity **300**, open cost 1,000, average cost 3.333333333333. Duplicate economic event đã commit thật vào DB fixture.
- Vi phạm §§10/15/16/18/35, DoD 3 và tính đúng của holdings. Severity Critical theo §43 (duplicate event/wrong holdings).
- Cần sửa: validate active corporate-action stage trong temporal replay, áp dụng reversal đúng effective time, kiểm tra toàn bộ correction chain. Tạm thời phải reject trường hợp backdated replacement này; không sửa/xóa posted ledger để che lỗi. Audit chưa triển khai mitigation.

### AUDIT-M01 — Major: reference lookup lệch ngày Việt Nam

- Vị trí: `src/application/portfolio/engine.ts:51`, `asOf.slice(0, 10)` lấy ngày UTC; accounting trade/settlement áp dụng UTC+7.
- Snapshot `2026-01-02T18:00:00Z` là 01:00 ngày 3 tại Việt Nam. Sector OLD có interval [Jan1, Jan3); NEW có [Jan3, ∞).
- Expected NEW; actual OLD. Cùng cách lấy ngày có thể ảnh hưởng membership/identifier reference.
- Vi phạm §26, DoD18 và half-open date intervals của M2 sector master. Cần một hàm business-date Việt Nam dùng nhất quán và test quanh 17:00 UTC/local midnight. Chưa sửa.

### AUDIT-M02 — Major: lịch sử trước supported inception được coi là hợp lệ

- Vị trí: `src/application/portfolio/engine.ts:43–57`; `src/ports/portfolio.ts` không đưa inception metadata vào LedgerRead. Guard inception khi ghi không bảo vệ đường đọc.
- Portfolio inception Jan1 2026; yêu cầu snapshot Dec1 2025 cùng external evidence toàn số 0.
- Expected: reject hoặc trạng thái unsupported/blocked. Actual: `VALID`, `actionabilityBlocked: false`, tạo ấn tượng có lịch sử zero-state được hỗ trợ trước inception.
- Vi phạm §§18/25 và DoD11. Cần mang supported-inception boundary qua read port và enforce trên reconstruct/snapshot. Không suy zero history từ một event set rỗng. Chưa sửa.

### AUDIT-M03 — Major: thiếu imported-inception NAV baseline theo approved M2

- Evidence tĩnh: `docs/02 DATABASE/PORTFOLIO.md:145,610` yêu cầu create/reproduce `supported_inception_nav_vnd` từ opening ledger và valid inception market/reference inputs.
- `src/domain/portfolio/valuation.ts:30–31` luôn trả economicPnl null cho IMPORTED. State chỉ có loại inception; không có baseline NAV hoặc luồng reconstruct priced inception baseline.
- Null an toàn hơn số giả, nhưng không đáp ứng contract đã phê duyệt. Đây là thiếu chức năng M6.3, không phải yêu cầu làm TWR/M6.4. Severity Major do thiếu baseline định giá/reconciliation bắt buộc.
- Cần bổ sung derived baseline và input lineage/reproduction; khi thiếu inception price/reference thì block rõ ràng. Finding này dựa trên code/contract, không nằm trong 3 runtime tests fail.

## Evidence và cách chạy

Validation checkout riêng: `/private/tmp/vn30-m63-validation`, Node 22.23.2, pnpm 10.34.5, dependencies theo lockfile. Đã so 67 source/test/schema/script files không generated với workspace: giống nhau trước khi thêm audit probes. Root dependency reads bị stall nên dùng checkout riêng. Mỗi integration test dùng SQLite fixture riêng; không mở/reset/migrate DB người dùng.

| Lệnh | Lần audit này | Kết quả |
|---|---|---|
| `pnpm test:portfolio` | Rerun | exit 0, 88 pass |
| `pnpm test --reporter=default --reporter=json --outputFile=/private/tmp/m63-verification-full-results.json` | Rerun với 3 audit probes | exit 1, **240 total / 237 pass / 3 fail** |
| `pnpm typecheck` | Rerun | exit 0 |
| `pnpm lint` | Rerun tuần tự | exit 0; boundary 37 modules |
| `git diff --check` | Workspace audit | exit 0 |
| build/e2e/schema checks | Không rerun | Evidence pass ngày 2026-09-16 trong report cũ; không coi là verification mới |

Một lần lint chạy đồng thời với test/Prisma generate thất bại vì output generation cùng thư mục; rerun tuần tự pass. Đây là race của cách chạy verification, không gộp thành product finding.

[Regression probes và hướng dẫn](verification-evidence/README.md), [kết quả tóm tắt](verification-evidence/results.json). Suite cũ 237 pass không bao gồm ba acceptance cases mới; do đó không mâu thuẫn với 3 lỗi đã tái hiện. Audit probes giữ trong docs, không tự động được root test glob chạy.

## Đối chiếu đủ 46 mục yêu cầu

| § | Yêu cầu | Kết quả | Evidence / giới hạn |
|---|---|---|---|
| 1 | Repository audit | PARTIAL | Đã đối chiếu repo/brief/M2/ADR/report; không thể chứng nhận hồi tố thứ tự đọc tài liệu trước implementation. |
| 2 | Source of truth | PASS | Ledger là authoritative; position/cash/NAV là derived. |
| 3 | Architecture boundary | PASS | Lint boundary: 37 source modules; suite kiến trúc pass. |
| 4 | Objective | PARTIAL | C01/M01/M02/M03 chặn hoàn tất. |
| 5 | Non-goals | PASS | Không thấy triển khai M6.4+. |
| 6 | Implementation sequence | PARTIAL | Có các lớp value→ledger→replay→valuation→snapshot; không chứng nhận thứ tự lịch sử. |
| 7 | Transaction aggregate | PASS | Facts/legs/lineage và immutable finalized transactions. |
| 8 | Transaction types | PARTIAL | Các loại hỗ trợ có implementation/test; ngoại lệ policy bị block qua CR. |
| 9 | Lifecycle | PASS | Posting/finalization và immutable history. |
| 10 | Idempotency/duplicates | FAIL | C01: cùng economic stage được post lại trước reversal. |
| 11 | BUY | PASS | Gross/fees/basis và settlement: test hiện có pass. |
| 12 | SELL | PASS | MWAC/released cost/realized/oversell: test hiện có pass. |
| 13 | Cash | PASS | Cash derived; không ghi đè số dư. |
| 14 | Dividend | PASS | Các trường hợp hỗ trợ có gross/tax/net availability. |
| 15 | Corporate actions | FAIL | C01; các policy chưa đủ khác có CR và fail-closed. |
| 16 | Reversal/correction | PARTIAL | Immutable links/atomic correction có; temporal stage protection sai C01. |
| 17 | Deterministic replay | PARTIAL | Thứ tự replay ổn định; supported-history boundary thiếu M02. |
| 18 | Historical asOf | FAIL | M02 và ảnh hưởng lịch sử của C01. |
| 19 | Watermark | PASS | Revision/cutoff có coverage. |
| 20 | Projection failure | PASS | Không rollback authoritative commit khi projection lỗi. |
| 21 | Market valuation boundary | PASS | Normalized inputs, không provider call trong domain. |
| 22 | NAV | PARTIAL | NAV hiện tại có; thiếu imported-inception baseline M03. |
| 23 | Reconciliation | PASS | So sánh evidence, không auto-fix ledger. |
| 24 | Reconciliation status | PASS | Các trạng thái và blocking có coverage. |
| 25 | Snapshot | FAIL | M02: pre-inception vẫn VALID/actionable. |
| 26 | Effective reference | FAIL | M01: UTC date thay vì ngày Việt Nam. |
| 27 | Persistence constraints | PASS | SQLite constraints/immutability/lineage có integration coverage. |
| 28 | Atomicity | PASS | Failure rollback và atomic grouped writes có tests. |
| 29 | Numeric precision | PASS | Exact decimals; rounding/residual coverage pass. |
| 30 | Required domain tests | PARTIAL | Suite cũ pass nhưng thiếu 3 acceptance cases nay fail. |
| 31 | Golden cases | PASS | Các named golden cases hiện có pass; không chứng minh mọi edge case. |
| 32 | Integration tests | PARTIAL | Có real SQLite tests; 3 case bổ sung fail. |
| 33 | Migration tests | PASS | Upgrade populated M6.2 nằm trong full suite pass. |
| 34 | Property/invariant tests | PARTIAL | Có invariant tests nhưng temporal duplicate invariant bị lọt C01. |
| 35 | Commands/use cases | PARTIAL | Validation/atomicity có; invariant C01 chưa được enforce. |
| 36 | Concurrency | PASS | Expected watermark/stale command rejection có tests. |
| 37 | Security | PASS | Không thấy endpoint mới bỏ auth, raw secret leak hoặc live-provider dependency trong phạm vi kiểm tra. |
| 38 | Minimal UI/API boundary | PASS | Server composition và validated command boundary; không thêm production UI. |
| 39 | Documentation | PARTIAL | Báo cáo cũ có kết luận quá mức; audit này đính chính, chờ đóng findings. |
| 40 | Validation commands | FAIL | Full suite mở rộng exit 1; lint/typecheck pass. |
| 41 | Validation evidence | PARTIAL | Số test cũ đúng nhưng không đủ cho completeness; bổ sung evidence tái hiện. |
| 42 | Final response | PARTIAL | Report cũ có cấu trúc/evidence nhưng kết luận hoàn tất phải rút lại. |
| 43 | Severity rules | FAIL | Còn 1 Critical và 3 Major. |
| 44 | Stop conditions | PARTIAL | CR xử lý policy thiếu an toàn; M03 là approved baseline còn thiếu, không được tự defer. |
| 45 | Definition of Done | FAIL | Xem đủ 30 mục bên dưới. |
| 46 | Final instruction | PASS | Audit dừng trong M6.3; không mở M6.4. |

## Đối chiếu đủ 30 điều kiện Definition of Done

| # | Điều kiện | Kết quả | Evidence / giới hạn |
|---|---|---|---|
| 1 | Immutable ledger | PASS | Constraints và immutable records. |
| 2 | Atomic persistence | PASS | SQLite transaction/rollback tests. |
| 3 | Prevent duplicate economic events | FAIL | C01. |
| 4 | Reject oversell | PASS | Ordinary/backdated validation tests pass. |
| 5 | Derived cash | PASS | Replay-derived. |
| 6 | Derived holdings | PARTIAL | Derived nhưng event sai C01 tạo holdings sai. |
| 7 | Deterministic MWAC/open cost | PASS | Arithmetic/replay tests; không xóa blocker C01. |
| 8 | Deterministic realized P&L | PASS | Existing tests pass. |
| 9 | Dividend accounting | PASS | Supported scenarios pass. |
| 10 | History-preserving reversals | PARTIAL | Immutable history có; temporal duplicate C01. |
| 11 | Historical asOf | FAIL | M02. |
| 12 | Ledger watermark | PASS | Existing tests pass. |
| 13 | Detect stale snapshots | PASS | Version/watermark checks. |
| 14 | Projection failure safety | PASS | Authoritative commit preserved. |
| 15 | Missing/stale prices | PASS | Blocked valuation tests. |
| 16 | NAV/weights for supported inputs | PARTIAL | M03 thiếu inception baseline; C01 có thể truyền holdings sai xuống NAV. |
| 17 | Reconciliation without auto-fix | PASS | Existing tests pass. |
| 18 | Historical effective references | FAIL | M01. |
| 19 | SQLite migrations | PASS | Rerun full suite includes migration tests. |
| 20 | Numeric precision tests | PASS | Rerun pass. |
| 21 | M2/M6 golden cases | PASS | Existing named cases pass. |
| 22 | Lint | PASS | Rerun sequentially exit 0. |
| 23 | Typecheck | PASS | Rerun exit 0. |
| 24 | Tests | FAIL | 240 total, 237 pass, 3 fail. |
| 25 | Build | HISTORICAL PASS | Evidence 2026-09-16; không rerun hôm nay, production source unchanged. |
| 26 | git diff --check | PASS | Audit check exit 0. |
| 27 | Critical unresolved = 0 | FAIL | 1: C01. |
| 28 | Major unresolved = 0 | FAIL | 3: M01/M02/M03. |
| 29 | Documentation updated | PARTIAL | Audit/erratum đã thêm; chưa có closure sau sửa. |
| 30 | No M6.4+ | PASS | Không triển khai M6.4+. |

## CR, giới hạn và điều kiện đóng audit

CR-M63-01 (bonus/stock dividend basis), CR-M63-02 (fractional/cash-in-lieu/tax policy), CR-M63-03 (partial categorized split settlements) được ghi riêng trong CHANGE_REQUESTS.md. Những case chưa có approved accounting và bị reject an toàn không tự động trở thành defect; cũng không làm C01/M01/M02 hoặc approved baseline M03 được miễn trừ.

Coverage hiện tại không phải chứng nhận mọi permutation (ví dụ changed-method reversal, sell split settlement, spinoff). Audit không khẳng định các case chưa tái hiện là lỗi. Không thêm finding từ suy đoán.

Để đóng M6.3: sửa C01 trước; sửa M01/M02; hoàn thiện M03 theo contract; đưa regression cases vào suite chuẩn, bổ sung baseline tests; chạy lại required validation commands và cập nhật closure evidence. Trước đó giữ trạng thái **M6.3 chưa hoàn tất**, không sang M6.4.

Audit chỉ thêm tài liệu/evidence và erratum; không sửa business code, migration hoặc dữ liệu người dùng. Các thay đổi implementation đang có trong working tree được giữ nguyên.
