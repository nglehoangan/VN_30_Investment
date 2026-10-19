ARCHITECTURE_RECOMMENDATION: **ACCEPT_WITH_CHANGES**

| Item | Recommendation |
| --- | --- |
| DI4 | **SPLIT** — source/ingestion/retention/replay capability at initialization; actual request coverage and market snapshot at analysis time. |
| DI8 | **SPLIT** — class-specific policy/evaluator and durable reporting/reference checks at initialization; actual market eligibility at analysis and decision consumption time. |
| DI12 | **SPLIT** — reproducible durable initialization manifest, complete analysis snapshot, and decision envelope are separate typed contracts. |
| GLOBAL MARKET BLOCKER | **C: split into initialization capability/replay qualification and market-analysis readiness findings**, subject to approved new contracts. Parent remains OPEN now. |
| M1 CHANGE REQUIRED | **yes** — explicit lifecycle/governance boundary; investment/risk rules unchanged. |
| M2 CHANGE REQUIRED | **yes** — versioned data/provenance/retention contracts and additive storage/bindings. |
| M3 CHANGE REQUIRED | **yes** — acceptance/analysis gate/provenance plumbing; weights/rubrics/metric math and flow/technical exclusion unchanged. |
| M4 CHANGE REQUIRED | **yes** — atomic multi-snapshot decision binding and final eligibility checks. |
| M5 CHANGE REQUIRED | **yes** — current-context checks for review, cached DCA/capital plans and handoff. |
| M6 CHANGE REQUIRED | **yes** — separate initialized, market-capable, market-current, analysis-ready and decision-ready displays. |
| M7 CHANGE REQUIRED | **yes** — lifecycle, negative, replay, cache-expiry and PIT regression contracts. |
| M8 CHANGE REQUIRED | **yes** — approved prospective DI4/8/12 and independent acceptance versions; existing gates/history remain unchanged. |

**Data Initialization → Market Data Refresh → Analysis → Portfolio Snapshot → Decision → Decision Snapshot.**

Đề xuất hợp lý vì giá thị trường có vòng đời ngắn, còn universe/master, lịch sử kế toán, provenance và disposition là dữ liệu bền vững có version. Một lần khởi tạo đã được phê duyệt không nên bị viết lại thành FAIL chỉ vì snapshot giá cũ tự nhiên hết hạn. Điều hết hạn là quyền dùng snapshot đó cho yêu cầu phân tích/ra quyết định mới. Tài liệu gốc §22 đã gắn dataset identity với từng lần scoring/khuyến nghị; §14 phân biệt freshness theo lớp; §35 đóng băng hợp đồng chứ không đóng băng dữ liệu sống. Code cũng đã kiểm tra một phần freshness theo run-as-of và current clock. Không nên mô tả sai rằng code hiện tại tự hủy mọi initialization certificate khi đồng hồ tiến lên.

Tuy nhiên, hợp đồng hiện hành §25/§28 vẫn yêu cầu load market trong initialization. SnapshotRequest yêu cầu MARKET reference không rỗng; bindDIAcceptance yêu cầu đúng FORMAL/AS_KNOWN runtime snapshot và tất cả DI PASS. Vì vậy, không thể chỉ đổi cách diễn giải để coi DI4/8/12 đã đạt. Cần hợp đồng/version mới cho InitializationManifest, AnalysisSnapshot và DecisionSnapshot, giữ reader/replay cũ nguyên vẹn. Header tài liệu M8 còn mang nhãn Approval Candidate; review này phân biệt nhãn đó với các runtime contract/amendment và quyết định nghiệm thu đã áp dụng, không tự tạo thêm authority.

ACCEPT_WITH_CHANGES có ba điều kiện: (1) capability phải được chứng minh bằng nguồn thực có thể replay cùng test, không chỉ có adapter/mocks; (2) AnalysisReady còn cần các gate tài chính/qualitative/valuation/confidence đang áp dụng; (3) DecisionReady phải thêm portfolio hiện hành, các gate M1/M4/M5 và seal đầy đủ trước khi công bố kết quả actionable. Với trình tự yêu cầu ở trên, Decision là candidate cho tới khi Decision Snapshot được seal atomically; không có cửa sổ công bố quyết định chưa gắn bằng chứng.

DI4-vNext kiểm chứng source approval, security identity, field/adjustment/unit/time semantics, lưu raw, normalized lineage, schema/version, capability snapshot/replay và negative cases. Mẫu thật có thể là dữ liệu lịch sử còn nguyên byte; không cần là giá hôm nay. Khi có yêu cầu thực, MARKET_DATA_FRESHNESS_GATE bắt buộc chốt đúng phạm vi và snapshot đủ mới theo calendar/session/purpose đã được duyệt. Không tự đặt ngưỡng N ngày, không lấy retrievedAt làm trading date, không thay giá cũ bằng0, không lấy cache stale hoặc quote cũ để vượt qua quote mới invalid. M3 flow/technical vẫn NOT_APPLICABLE_PERMANENT_M3; gate technical/money-flow chỉ áp dụng cho workflow riêng nếu được phê duyệt.

DI8-vNext không cho phép market CURRENT vĩnh viễn. Trong ví dụ19/10→25/10, giả sử snapshot19/10 đã stale theo chính sách phiên giao dịch, initialization cũ vẫn là bằng chứng lịch sử đúng tại cutoff, còn yêu cầu mới bị BLOCKED cho tới khi có snapshot eligible. Ngày/phiên yêu cầu phụ thuộc calendar đã duyệt; không buộc có giao dịch đúng mọi ngày lịch. Fundamentals/master vẫn được kiểm tra theo kỳ/version khi phân tích, và có thể cần initialization increment mới khi thay đổi; không coi dữ liệu bền vững là không bao giờ lỗi thời.

DI12-vNext InitializationManifest phải bind đủ universe/sector/master, canonical facts/history/qualifications, disposition29/1, TCX exception ACTIVE, provenance và policy/software/capability hashes. AnalysisSnapshot bind dữ liệu thật theo cutoff của request. DecisionSnapshot bind thêm portfolio/ledger watermark, market/fundamental/universe IDs, score/decision model versions, actual source hashes và freshness proof. Không dùng review-bundle hash làm thay runtime snapshot; hash không thay cho bytes/replay dependencies.

Blocker RELEASE-MARKET-SOURCE-REPLAY-UNAVAILABLE không chỉ là giá09/10 đã cũ. Còn thiếu raw nguồn để chứng minh replay. Do đó đề xuất C: một phần vẫn thuộc initialization capability cho đến khi được kiểm chứng; phần cần snapshot giá đủ mới thuộc analysis/decision readiness. Mẫu mới không khôi phục được raw lịch sử09/10 đã mất. Không hạ severity, đóng issue hoặc chuyển gate hiện tại sang PASS trong review này.

Historical/backtest bắt buộc dùng effective universe, fundamentals/market/corporate-action versions và known-at thực tại thời điểm giả lập. Không dùng refresh hôm nay, restatement công bố sau hoặc ngoại lệ Owner được phê duyệt sau để tạo thông tin đã biết trong quá khứ. Replay quyết định cũ dùng các policy và freshness proof lúc đó; dùng nó để cấp vốn mới phải kiểm tra hiện tại lại.

Production giữ nguyên: **FULL30 / SCORABLE_BY_FUNDAMENTALS29 / DEFERRED MBB**, TCX exception ACTIVE. DI4/DI8/DI12 vẫn **FAIL**, DI14 **PENDING**, DI15 **FAIL**; readyForScoring=false, decisionReady=false. Không mở lại kế toán, không tìm CAR MBB, không tải market, không tạo snapshot hoặc chạy scoring/ranking/Top10. Các lỗi replay/test lịch sử có sẵn không được khắc phục bằng việc viết lại sealed evidence.

Ngoài ranh giới market, route ranking legacy còn yêu cầu30 scorecard. Vì vậy, refresh giá không tự làm route đó tương thích với PolicyB29/1: triển khai tương lai cần envelope PolicyB có đủ30 danh tính,29 eligible và MBB bị loại rõ ràng; không tạo score0 cho MBB hoặc âm thầm đổi mẫu số/trọng số. Đây là tác động tích hợp được ghi nhận, không phải thay đổi hay chạy ranking trong review.

Các tác động theo file, test và evidence generator được liệt kê trong IMPACT_ANALYSIS.json / ENFORCEMENT_INVENTORY.json; CURRENT_DI_CONTRACT_TRACE.json giữ định nghĩa gốc, Git history, source hashes và phân biệt đường dẫn runbook lịch sử đã thay nội dung. Các đề xuất chi tiết nằm trong bốn tài liệu lifecycle/readiness/gate/decision của gói này.

Dừng sau review kiến trúc. Chờ **Review DI Market-Data Boundary**.
