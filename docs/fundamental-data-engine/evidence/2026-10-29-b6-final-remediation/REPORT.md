# B6 — Kết quả sửa kiểm thử và rà soát blocker, 29/10/2026

Ba nhóm được yêu cầu đã được xử lý. Kiểm tra kỹ thuật hiện tại đạt **2.509 assertion**, không còn lỗi chưa xử lý trong phạm vi kiểm thử đã chạy; **18 kiểm tra lịch sử không thực thi và không được tính PASS**. B6 tổng thể vẫn chưa đủ điều kiện phát hành Production.

## Phạm vi và cách xác minh

Đã chạy toàn bộ 165 file Vitest. Lượt full-suite ghi nhận một timeout M6.8 và một beforeAll của TCBS còn ghim fingerprint DB20/10; sau khi sửa đã chạy lại toàn bộ từng file bị ảnh hưởng. Các file có assertion lịch sử/nghiệp vụ được tách thêm cũng được chạy lại đầy đủ. `CONSOLIDATED_TEST_RESULT.json` hợp nhất kết quả theo file, ghi rõ thứ tự thay thế; đây là **full-suite cộng rerun file bị ảnh hưởng**, không phải tuyên bố raw full-suite log ban đầu hoàn toàn xanh.

Kết quả cuối: 165 file, 2.509 PASS, 0 lỗi chưa xử lý, 18 ARCHIVAL_NOT_EXECUTED. Ngoài ra: 25/25 API Node tests; 34/34 kiểm tra corpus hiện giữ; runtime thực tế trên SQLite snapshot đạt; build, typecheck và lint toàn repo đạt. Chi tiết nằm trong các JSON/log cùng thư mục.

## Các sửa đổi

**Mock adapter/research.** Adapter seam có kiểu dữ liệu rõ ràng, hỗ trợ raw-query đúng contract hiện tại: bảng forward-intake tồn tại nhưng chưa có enrollment. Query ngoài contract bị từ chối; test bổ sung chứng minh audit intake bị giả mạo vẫn bị chặn. Các fixture hỏng tiếp tục lỗi vì divergence thật, không phải thiếu mock method. Research isolation mock `readRetainedResearch` đang được dashboard sử dụng; optional research lỗi không che snapshot dữ liệu độc lập.

**GVR và các assertion hỗn hợp.** GVR thất bại ở `existsSync` của PDF đã xóa, không phải phép tính tồn kho. Tách kiểm tra PDF lịch sử khỏi phép tính gross + provision = net. Tương tự, vẫn chạy riêng qualification transcript VJC và denominator coverage TCX còn đủ JSON đầu vào; không bỏ các kiểm tra nghiệp vụ này chỉ vì phần hash/PDF lịch sử không còn thực hiện được.

**Replay lịch sử.** Inventory có version tại `tests/fixtures/historical-replay-inventory.json`: 16 lỗi ENOENT ban đầu, một kiểm tra GVR thiếu PDF, một pin code TCX đã được phiên bản phê duyệt mới thay thế. Tổng 18: 17 ca nguồn/môi trường lịch sử không còn, một ca pin code lịch sử cũ. Chỉ những case được liệt kê rõ mới dùng wrapper archival; lỗi mới không tự được bỏ qua. Các assertion nguyên gốc vẫn chạy khi đặt `VN30_REQUIRE_ARCHIVAL_REPLAY=1`. Probe riêng cho PDF VNM đã chạy ở chế độ strict và thất bại ENOENT như dự kiến (`strict-archive-probe.log`), chứng minh đây không phải nguồn đã được phục hồi hay replay thành công.

Không khôi phục `data/manual-fundamentals`, `data/providers` hay OCR cũ. Các test mới xác minh manifest/version và hash của JSON, PDF/API raw đang giữ trong bốn thư mục rebuild; reader lineage được kiểm tra cho 30 mã. Kết quả chỉ chứng minh integrity/presentation lineage, không phải semantic accounting admission hay AS_KNOWN qualification.

**Lint.** Bỏ import thừa, thay explicit any bằng fixture types và mutable typed clone; dữ liệu cố tình sai được tạo rõ qua Object.assign/unknown tại ranh giới validation. Chỉ loại khỏi lint đúng một verifier đã seal ngày21/10, với chú thích cụ thể trong eslint.config.mjs; không sửa bytes của verifier, không ignore cả thư mục evidence hay tắt rule toàn cục. `PROTECTED_FILES_BEFORE.json` và `LIVE_DATA_AND_SEAL_CHECK.json` xác minh các file được bảo vệ không đổi.

**Timeout.** Chẩn đoán cho thấy subprocess backup kết thúc nhanh; `toEqual` trên Buffer SQLite gây so sánh sâu mất hơn100giây. Chuyển sang `Buffer.equals` vẫn so sánh byte chính xác. Các tình huống an toàn được tách riêng; mỗi subprocess có deadline5giây và diagnostics thời gian, không tăng timeout test20giây. Các lượt cuối ghi nhận 40 subprocess, tối đa1.109ms, không timeout (`BACKUP_PROCESS_TIMINGS.json`). Giữ overwrite/path/public/symlink/checksum/tampered-body/replay guards. Một test M6.8 dài khác được chia thành ba phase cùng fixture cách ly, giữ đủ issuance cutoff, retry, supersession, history và accounting assertions; cả file sau sửa đạt.

**TCBS DB fingerprint.** Giữ nguyên và tiếp tục kiểm tra seal/audit chuyển trạng thái ngày20/10. DB hiện tại được đối chiếu với accounting fingerprints và CAS head của lần kích hoạt được chủ tài khoản phê duyệt ngày29/10, thay vì đòi toàn bộ file SQLite luôn giống20/10. Vẫn kiểm tra DB không đổi trong suốt file test. Cả bảy test pipeline thực thi và đạt; không bị bỏ qua vì hook lỗi nữa.

**Backup theo contract lưu trữ.** Ngoài vấn đề tốc độ, kiểm tra phát hiện inspector cũ áp dụng một byte-hash/body-id convention cho mọi bảng. Đã phân biệt raw broker observations, admission snapshotId và canonical sealed-envelope contentHash. Giữ nguyên hash, identity và review binding cho các bảng khác; không thêm fallback chấp nhận cả hai kiểu hash. Test positive có raw observation không chứa id và sealed capability; test negative từ chối dùng hash raw text thay cho sealed contentHash. `BACKUP_STORAGE_CONTRACTS.json` mô tả chính xác từng quy tắc. `badHash` trong chẩn đoán cũ chỉ là mismatch theo giả định byte-hash cũ, không phải kết luận dữ liệu sealed bị hỏng.

## Database thật và blocker còn lại

**1. P1 — DB thật còn 19/21 migration.** Thiếu `202610270001_dividend_settlement` và `202610270002_forward_intake`. Chính sách backup yêu cầu inventory migration hiện tại vẫn được giữ nghiêm ngặt, nên backup đã kiểm định cho DB thật còn bị chặn ở bước này. Không sửa checksum hoặc bỏ qua schema check để làm xanh.

Đã rehearsal trên bản sao dữ liệu thật: áp dụng hai migration, giữ nguyên mọi hàng trong các bảng cũ, thêm ba bảng mới, integrity/FK đạt; tiếp tục backup và restore đạt với 42 bảng/790 hàng, mọi logical row/schema bằng nhau. Xem `ACTUAL_MIGRATION_REHEARSAL.json` và `ACTUAL_BACKUP_INSPECTION_AFTER.json`. **Không migrate DB thật**: hai migration được ghi là prepared-only; lượt này thực hiện kiểm định và rehearsal, không tự mở rộng thành triển khai schema Production. Bước tiếp theo là áp dụng quy trình triển khai schema đã rehearsal, với nguồn backup phù hợp baseline và các điều kiện quiesce/restore của migration.

**2. RELEASE_GATE — Market snapshot/session chưa được chấp nhận cho Production.** Preflight FUNDAMENTAL_DESCRIPTION đạt; VALUATION còn `UNKNOWN_OR_AMBIGUOUS_SESSION,CURRENT_MARKET_SNAPSHOT_NOT_AVAILABLE`. Dashboard đã có đủ giá ngày29/10 cho11vị thế và30quote, nhưng đó là display data. `current.actionability=BLOCKED / SOURCE_UNAVAILABLE` đến từ market-boundary guard; không phải mất B1–B5 hay mất giá.

**3. RELEASE_GATE — Chưa có formal scoring dataset acceptance.** Preflight còn `FORMAL_SCORING_DATASET_ACCEPTANCE_MISSING`. Việc JSON/PDF/API raw hash-valid và receipt manifest được duyệt không tự cấp accounting/scoring admission.

**4. RELEASE_GATE — Chưa đóng nghiệm thu độc lập.** Các nghĩa vụ E3/M7, historical validation và quyết định phát hành vẫn pending theo tài liệu hiện hành. 18 archival cases vẫn NOT_EXECUTED; không được dùng kết quả engineering để tuyên bố các case này PASS hoặc cấp GO cho quyết định tiền thật.

B1–B5 read model đạt trên snapshot thực tế:11vị thế, cash327420, pending dividends475000, FPT220 gồm200tradable/20pending; P/L vẫn theo imported basis. Database thật, migration SQL, Prisma schema, active authority và các seal được bảo vệ giữ nguyên trong lượt này. Bản sao/rehearsal/backup tạm được dọn sau kiểm định; chỉ giữ manifests/kết quả/hash receipt, không để bản sao DB thật trong repo.
