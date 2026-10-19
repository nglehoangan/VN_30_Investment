LEVEL1_PROMOTION_CLOSURE: **PASS**

FULL_UNIVERSE: **30**

SCORABLE_UNIVERSE: **29** — ACB, BID, BSR, CTG, FPT, GAS, GVR, HDB, HPG, LPB, MCH, MSN, MWG, SAB, SHB, SSB, SSI, STB, TCB, TCX, VCB, VHM, VIB, VIC, VJC, VNM, VPB, VPL, VRE.

DEFERRED_UNIVERSE: **1 — MBB**.

| Ticker | Production disposition | Phạm vi được giữ |
| --- | --- | --- |
| VNM | CLOSED | REPORTED_BORROWINGS; chưa chứng minh comprehensive debt; bất định khoản phải trả khác vẫn được giữ. |
| TCX | CLOSED_WITH_EXCEPTION | Ngoại lệ phân loại của Owner ACTIVE; Két Vàng vẫn là MANAGED_INVESTOR_PAYABLE theo nguồn, không phải SOURCE_PROVEN_FINANCIAL_DEBT. |
| VIB | CLOSED | CAR hợp nhất 11,8% tại 30/06/2026, Circular14/2025/TT-NHNN, hash nguồn được giữ; công thức NPL issuer NOT_PROVEN và chỉ là SUPPORTING. |
| VIC | CLOSED | BCTC hợp nhất 6M2026 được EY soát xét, kết luận không điều chỉnh; bản gốc/hash/provenance đủ, không yêu cầu OCR tạm. |
| MBB | DEFERRED / INSUFFICIENT / NOT_SCORABLE | Thiếu CAR hoặc CET1 đủ điều kiện từ nguồn có thẩm quyền, scope hợp nhất, áp dụng rõ tại 30/06/2026. Không tìm thêm nguồn trong task này. |

ACCOUNTING_REGRESSIONS: **0**. Cả 30 body admission kế toán, mọi bảng nghiệp vụ cũ và 744 file nguồn/PDF/JSON được bảo toàn; thay đổi DB chỉ gồm migration bổ sung và một release disposition append-only. Không sinh lại giá trị tài chính, không thêm giá trị MBB. Những run kế toán cũ giữ nguyên để replay; release governance mới tham chiếu chúng cùng qualification đã được phê duyệt.

TCX: bank short debt6.871.600.000.000 + bond carrying1.708.634.544.957 + Két Vàng5.284.485.167.173 đúng một lần =13.864.719.712.130VND. Bảo đảm hoàn trả gốc và nghĩa vụ lãi cố định NOT_INDEPENDENTLY_PROVEN; tiền thuộc TCX về kinh tế NOT_PROVEN. Ngoại lệ hiện diện trong disposition, register, audit và analytical context. Release không hợp lệ nếu mất ngoại lệ hoặc bị đổi thành source-proven.

VNM: chỉ đóng blocker Level1 đã lỗi thời dựa trên phạm vi vay được báo cáo. Không đổi số dư được duyệt thành một dân số comprehensive debt. VIB: không yêu cầu CAR+CET1; không biến phép chia nhóm3+4+5/classified credit-risk exposure thành công thức issuer. VIC: giữ xử lý reported borrowings/LC đã duyệt. Các giới hạn này nằm trong runtime release, không chỉ trong ghi chú báo cáo.

MBB vẫn thuộc FULL_UNIVERSE và có score=null. Mọi action SCORING/RANKING/TOP10/STRONG BUY/BUY/ACCUMULATE/NEW_CAPITAL/DCA đều bị chặn. Test cũng cô lập guard MBB trong fixture giả định các global gate khác đã PASS. Cached decision, score, marginal plan, DCA và execution không đi vòng qua quarantine. Không phân bổ lại trọng số hoặc vốn; không thay đổi mẫu số/chính sách tính điểm.

GLOBAL_SYSTEM_BLOCKERS: **1 OPEN** — RELEASE-MARKET-SOURCE-REPLAY-UNAVAILABLE. Nguồn market của toàn bộ30 mã chưa replay được, chưa có snapshot release đầy đủ được chấp nhận; DI4, DI8, DI12 vẫn FAIL. Đây là blocker toàn hệ thống được giữ nguyên, không giải quyết bởi việc đóng Level1.

DI14: **PENDING** — chưa có phê duyệt độc lập DI14 hợp lệ cho release này.

DI15: **FAIL** — giữ nguyên global blocker và prerequisite không PASS.

readyForScoring: **false**.

decisionReady: **false**.

Kiểm thử: nhóm promotion/PolicyB/certification/admission156 PASS; migration/registry15 PASS; architecture98 PASS; browser/E2E12 PASS; lint, typecheck, DB validation, production build, protected accounting replay và live pinned-context replay PASS. Toàn bộ application suite đã chạy: ban đầu1926 PASS/24 FAIL. Sáu lỗi danh sách bảng kỳ vọng được sửa để bao gồm bảng governance bổ sung và đã retest;18 lỗi lịch sử còn lại tái hiện trên startingHEAD4094ac7. Chúng liên quan nguồn/đường dẫn đã dọn, tham chiếu file cũ và hash debt-contract đã lệch từ trước. **Không tuyên bố full suite xanh.** Xem REGRESSION_RESULTS.json và log baseline để kiểm tra độc lập; không khôi phục scratch hay viết lại sealed history để che lỗi.

PolicyB semantics và lịch sử25/5 không đổi. Production dùng bảng `fundamental_disposition_release`, binding được pin ở `src/infrastructure/fundamentals/active-level1-release.json`; server composition cung cấp context ngoại lệ cùng các guarded ports. Đây không phải bản formal DI acceptance, không thay đổi các reader lịch sử đang pin release cũ. Không chạy scoring production, market-data refresh, ranking, Top10, valuation hay quyết định cấp vốn.

Dừng tại closure này. Chờ **Review Level-1 Promotion & Partition Closure**.
