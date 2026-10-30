# B6 — Review sau lượt API ngày 30/10/2026

**Giá đóng cửa đã cập nhật đủ 30/30 mã; B6 chưa hoàn tất nghiệm thu định giá và điểm.**

## Phần đã kiểm tra

- Lượt SQLite `TCBS_CAPTURE_RUN:fff83bb467d2f9b69edac4d0a626219eff306a04303b462a95ecce66177248f1`: 93 REST thành công; 30 giá đóng cửa 30/10 và 30 mốc đóng cửa 29/10 có lineage/hash/JSON Pointer khớp.
- Bộ đọc giá của ứng dụng trả đủ 30 giá mới qua cổng SQL chỉ đọc; chưa kiểm tra giao diện bằng trình duyệt.
- WebSocket không có frame sau phiên. Điều này không làm thiếu nguồn daily close REST; vẫn giữ nguyên PARTIAL_CAPTURE của lượt gốc.
- 42 bảng DB đối chiếu với backup: 913 bản ghi broker cũ được giữ nguyên, chỉ thêm 125 broker observations; ledger, scoring và schema không đổi.
- Đọc trực quan 38 trang nguồn: 30 ghi nhận common EPS FY2025, 3 trang bổ sung ban đầu, 4 trang phân phối quỹ HDB/SSI và 1 trang kết quả kinh doanh BSR. 29/30 tử số kế toán kiểm tra được số học; chưa gọi là lợi nhuận bền vững.
- HDB: xác nhận 25 tỷ đồng trích quỹ từ lợi nhuận 2025; tử số sau riêng khoản đã xác nhận còn 16.499.388.000.000đ.
- SSI: xác nhận 244.818.160.367đ trích quỹ theo phân phối 2025; tử số sau riêng khoản đã xác nhận còn 3.861.272.256.382đ. Hai phép nối này là phân tích một phần, không phải EPS cả năm do doanh nghiệp công bố lại.
- LPB/TCX giữ rõ phạm vi riêng lẻ; GVR giữ cả số trích trong bảng và chú thích chưa ước tính.
- Có bộ tính DCF chủ sở hữu, residual income và RNAV theo ngành; có kiểm định từ chối đầu vào/mẫu số chưa đủ. 87 kịch bản vốn hóa lợi nhuận báo cáo chỉ là độ nhạy tham khảo, không phải 87 định giá hoàn chỉnh.
- Luồng AI tự nghiệm thu dùng 23 rubric và trọng số 100 điểm hiện hành, ghi đúng người đánh giá là ChatGPT; không giả danh người nghiệm thu độc lập.

## BSR — nguyên nhân cụ thể

PDF FY2025 trang 11 và 41 đều ghi lợi nhuận công ty mẹ 5.213.612.063.223đ. Trang 41 ghi trừ quỹ 4.061.012.360đ, nên phép trừ cho 5.209.551.050.863đ; dòng tổng in trong PDF lại là 5.230.686.242.758đ, lệch 21.135.191.895đ. EPS tính từ phép trừ khoảng 1.040,3913đ phù hợp số nguyên 1.040đ được in. Đây là đối chiếu phân tích, chưa có xác nhận sửa từ doanh nghiệp; giữ nguyên tất cả số gốc và chưa cấp quyền scoring.

## Tiêu chí nghiệm thu hiện tại

|Tiêu chí|Kết quả|
|---|---|
|30completed close prices with direct raw lineage and prior-close reference|PASS|
|No changes to prior DB rows, schema, portfolio ledger or score tables|PASS|
|PDF identity/scope/unit and common-earnings arithmetic|PARTIAL_29_OF_30_ARITHMETIC_READINGS|
|Economic normalization and comprehensive common-owner claim bridge|NOT_COMPLETE|
|Qualified sector primary valuation, scenarios and current per-share denominator|NOT_COMPLETE|
|23supported rubrics, counterevidence, unchanged100point weights, all valuation/return gates|NOT_COMPLETE|
|Focused code, arithmetic, lineage and historical authority verification|PASS|

## Việc còn lại

|Issue|Phạm vi|Nội dung|
|---|---|---|
|B6-ECO-BSR-01|BSR|FY2025 PDF EPS subtotal differs from parent profit less printed fund by21135191895VND. Statement page11 confirms parent profit; page41 shows the conflicting subtotal. Preserve original and derived arithmetic separately.|
|B6-ECO-FUND-02|BSR,CTG,HDB,LPB,MBB,SSI,STB|Issuer did not estimate all FY2025 non-shareholder funds in original EPS note. Later HDB and SSI parent allocations are now source-checked partial bridges; comprehensive group leakage/cycle review is not complete.|
|B6-ECO-GVR-03|GVR|FY2025 EPS table deducts a fund amount while accompanying footnote says funds unestimated; retain both statements.|
|B6-ECO-SCOPE-04|LPB,TCX|Reviewed EPS-note PDFs are standalone. Current economics dossiers preserve STANDALONE; older consolidated-labelled candidates are not silently joined. Equivalence or appropriate group perimeter still needs review.|
|B6-ECO-FORECAST-05|30 mã|Reported common earnings are not normalized sustainable FCFE/ROE/project cashflows. Complete issuer-specific one-off/cycle review, sector forecasts, reinvestment, tax, terminal and common-claim bridges. Existing87 capitalizations are diagnostic assumptions only.|
|B6-ECO-SHARES-06|30 mã|Current outstanding common shares and post-report actions need dated reconciliation. FY2025 weighted-average shares and API5.11 listingQtty are not interchangeable with that denominator.|
|B6-ECO-SCORE-07|30 mã|23rubric topic-specific assessments, counterevidence, valuation/return gates and final AI self-review remain incomplete. No rubric points or total score are fabricated from source presence alone.|

Các mục nghiên cứu trên là phần phân tích chưa làm xong, không phải mặc định dữ liệu không tồn tại hay yêu cầu bạn cung cấp lại. Hiện không có yêu cầu bổ sung từ chủ tài khoản và không còn chờ đăng nhập TCBS cho lượt review này. VPL vẫn chỉ phân tích từ 2023; MBB an toàn vốn 6T2026 tiếp tục hoãn theo yêu cầu.

Kiểm thử liên quan: **164/164 scoring + 43/43 API đạt**, targeted ESLint và tsc --noEmit đạt; 37 artifact authority và 133 file lịch sử giữ nguyên. Chưa chạy lại toàn bộ repository/release acceptance. Test lịch sử đối chiếu byte hash DB cũ là kiểm tra tại thời điểm chụp; không dùng nó để đòi DB sống bất biến sau cập nhật API hợp lệ.

Dữ liệu đang giữ: 30 hồ sơ trong `issuers/`, `market-review.json`, `checked-common-earnings.json`, `later-fund-bridges.json`, `bsr-source-reconciliation.json`, `acceptance-review.json`, `verification.json`. Không có điểm 0 thay N/R; số điểm tổng được chấp nhận hiện là 0/30 và mọi totalScore vẫn null.
