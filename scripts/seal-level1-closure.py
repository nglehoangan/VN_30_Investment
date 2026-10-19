"""Compact closure report and seal; never mutates production or runs scoring."""
import json,hashlib,re,datetime
from pathlib import Path
P=Path('docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure');logs=P/'validation-logs'
def read(n):return json.loads((P/n).read_text())
def save(n,d):(P/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
partition=read('NEW_PARTITION.json');closed=[m['ticker'] for m in partition['members'] if m['state']=='SCORABLE'];deferred=[m['ticker'] for m in partition['members'] if m['state']=='DEFERRED'];assert len(closed)==29 and deferred==['MBB']
checks=[{'check':'promotion_policy_quarantine_structured_certification_and_admission','status':'PASS','files':7,'tests':156,'log':'validation-logs/promotion-policy-certification.log'},{'check':'additive_migrations_and_registry','status':'PASS','files':6,'tests':15,'log':'validation-logs/additive-migration-retest.log'},{'check':'architecture_and_initialization_boundaries','status':'PASS','files':8,'tests':98,'log':'validation-logs/architecture.log'},{'check':'lint','status':'PASS','log':'validation-logs/lint.log'},{'check':'typecheck','status':'PASS','log':'validation-logs/typecheck.log'},{'check':'database_schema_validation','status':'PASS','log':'validation-logs/db-validation.log'},{'check':'production_build','status':'PASS','log':'validation-logs/production-build.log'},{'check':'browser_e2e','status':'PASS','tests':12,'log':'validation-logs/browser-e2e.log'},{'check':'all30_protected_accounting_replay','status':read('PROTECTED_ACCOUNTING_REPLAY.json')['status'],'artifact':'PROTECTED_ACCOUNTING_REPLAY.json'},{'check':'production_pinned_context_and_exception_guards','status':read('PRODUCTION_CONTEXT_REPLAY.json')['status'],'artifact':'PRODUCTION_CONTEXT_REPLAY.json'},{'check':'full_application_suite_initial','status':'FAIL','files':130,'tests':1950,'passed':1926,'failed':24,'log':'validation-logs/full-application-suite.log','analysis':'6 new additive-table expectations fixed and15 tests retested PASS;18 other failures reproduced on startingHEAD. No clean full-suite result claimed.'},{'check':'startingHEAD_historical_failure_reproduction','status':'CONFIRMED_PRE_EXISTING','tests':335,'passed':317,'failed':18,'log':'validation-logs/baseline-historical-source-regressions.log'}]
# Verify summaries from actual log bytes; never label a failed command PASS.
for name,needle in [('promotion-policy-certification.log','156 passed'),('additive-migration-retest.log','15 passed'),('architecture.log','98 passed'),('lint.log','PASS boundaries'),('typecheck.log','Types generated successfully'),('db-validation.log','valid'),('production-build.log','Finalizing page optimization'),('browser-e2e.log','12 passed')]:assert needle.lower() in (logs/name).read_text().lower(),name
save('TEST_RESULTS.json',{'LEVEL1_PROMOTION_CLOSURE':'PASS','fullSuiteClean':False,'newAccountingRegressions':0,'remainingKnownBaselineTestFailures':18,'checks':checks,'productionScoringExecuted':False,'marketDataRefreshed':False,'limits':'Baseline failures are disclosed, not skipped or rewritten. No market/DI blocker waived.'})
review=read('PARTITION_REPLAY.json');globalIssues=[i for i in partition['issues'] if i['status']=='OPEN' and i['kind']=='GLOBAL_SYSTEM_BLOCKER']
md=f'''LEVEL1_PROMOTION_CLOSURE: **PASS**

FULL_UNIVERSE: **30**

SCORABLE_UNIVERSE: **29** — {', '.join(closed)}.

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

GLOBAL_SYSTEM_BLOCKERS: **{len(globalIssues)} OPEN** — RELEASE-MARKET-SOURCE-REPLAY-UNAVAILABLE. Nguồn market của toàn bộ30 mã chưa replay được, chưa có snapshot release đầy đủ được chấp nhận; DI4, DI8, DI12 vẫn FAIL. Đây là blocker toàn hệ thống được giữ nguyên, không giải quyết bởi việc đóng Level1.

DI14: **PENDING** — chưa có phê duyệt độc lập DI14 hợp lệ cho release này.

DI15: **{review['DI15']}** — giữ nguyên global blocker và prerequisite không PASS.

readyForScoring: **false**.

decisionReady: **false**.

Kiểm thử: nhóm promotion/PolicyB/certification/admission156 PASS; migration/registry15 PASS; architecture98 PASS; browser/E2E12 PASS; lint, typecheck, DB validation, production build, protected accounting replay và live pinned-context replay PASS. Toàn bộ application suite đã chạy: ban đầu1926 PASS/24 FAIL. Sáu lỗi danh sách bảng kỳ vọng được sửa để bao gồm bảng governance bổ sung và đã retest;18 lỗi lịch sử còn lại tái hiện trên startingHEAD4094ac7. Chúng liên quan nguồn/đường dẫn đã dọn, tham chiếu file cũ và hash debt-contract đã lệch từ trước. **Không tuyên bố full suite xanh.** Xem REGRESSION_RESULTS.json và log baseline để kiểm tra độc lập; không khôi phục scratch hay viết lại sealed history để che lỗi.

PolicyB semantics và lịch sử25/5 không đổi. Production dùng bảng `fundamental_disposition_release`, binding được pin ở `src/infrastructure/fundamentals/active-level1-release.json`; server composition cung cấp context ngoại lệ cùng các guarded ports. Đây không phải bản formal DI acceptance, không thay đổi các reader lịch sử đang pin release cũ. Không chạy scoring production, market-data refresh, ranking, Top10, valuation hay quyết định cấp vốn.

Dừng tại closure này. Chờ **Review Level-1 Promotion & Partition Closure**.
'''
(P/'FINAL_REVIEW.md').write_text(md)
(P/'README.md').write_text('''Level1 Promotion & PolicyB Partition Closure — đọc FINAL_REVIEW.md trước.

Release disposition29/1 đã ghi production theo OWNER_REQUEST.txt. Đây là trạng thái fundamental Level1, không phải quyền chạy scoring hoặc phê duyệt DI14/DI15. TCX giữ ngoại lệ ACTIVE; MBB tiếp tục bị quarantine. Lịch sử và kế toán không đổi.

Nguồn approval là quyết định independent review được Owner xác nhận trong yêu cầu mới; APPROVAL_AUTHORITY.json giữ hash yêu cầu và seal của gói revalidation. Không tự tạo approval DI14. NEW_PARTITION.json được tái dựng từ các mandatory observations đã duyệt và issue register có lịch sử giải quyết.

Runtime: PrismaLevel1Disposition + app/server/level1-disposition.ts đọc release đã pin và cung cấp context/guarded ports. Migration bổ sung bảng append-only, không cập nhật các bảng kế toán. tests/unit/level1-promotion.test.ts và tests/integration/level1-disposition.test.ts bảo vệ ngoại lệ, provenance và quarantine.

Replay read-only: node scripts/verify-level1-disposition.mjs và python3 scripts/replay-level1-partition.py. Chỉ chạy scripts/close-level1-partition.mjs --persist khi thực hiện lại đúng approval; không dùng script lịch sử build-di15-policy-b.mjs để ghi đè25/5. Seal lại bằng python3 scripts/seal-level1-closure.py sau mọi thay đổi bằng chứng. Dùng Node22.23.2 theo engines của project.

Kiểm thử không hoàn toàn xanh:18 lỗi lịch sử tái hiện trên startingHEAD;6 lỗi expectation do migration mới đã được sửa và retest. Các log còn nguyên, không ẩn/sửa test lịch sử để qua. Không yêu cầu phục hồi artifacts tạm đã được Owner cho dọn. Không có dữ liệu tài chính lớn hoặc backup disposable được sao chép vào gói này.

Chờ Review Level-1 Promotion & Partition Closure.
''')
required=['README.md','APPROVAL_AUTHORITY.json','PREVIOUS_PARTITION.json','NEW_PARTITION.json','VNM_PROMOTION.json','TCX_PROMOTION_WITH_EXCEPTION.json','VIB_PROMOTION.json','VIC_PROMOTION.json','MBB_DEFERRED.json','EXCEPTION_REGISTER.json','DISPOSITION_CHANGELOG.json','PROTECTED_ACCOUNTING_REPLAY.json','PARTITION_REPLAY.json','QUARANTINE_TEST_RESULTS.json','REGRESSION_RESULTS.json','TEST_RESULTS.json','OPEN_ISSUES.json','FINAL_REVIEW.md']
assert all((P/n).is_file() for n in required)
files=[{'path':str(p.relative_to(P)),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(P.rglob('*')) if p.is_file() and p.name!='ARTIFACT_HASHES.json']
code=['prisma/schema.prisma','prisma/migrations/202610190001_level1_disposition/migration.sql','src/domain/fundamentals/level1-disposition.ts','src/infrastructure/repositories/level1-disposition.ts','src/infrastructure/fundamentals/active-level1-release.json','app/server/level1-disposition.ts','scripts/close-level1-partition.mjs','scripts/replay-level1-partition.py','scripts/verify-level1-disposition.mjs','scripts/seal-level1-closure.py','tests/unit/level1-promotion.test.ts','tests/integration/level1-disposition.test.ts','tests/integration/fundamentals-derivation-migration.test.ts','tests/integration/fundamentals-migration.test.ts','tests/integration/fundamentals-normalization-migration.test.ts','tests/integration/fundamentals-snapshot-migration.test.ts','tests/integration/scoring-readiness-migration.test.ts','tests/integration/registry.test.ts']
save('ARTIFACT_HASHES.json',{'version':'sha256-seal-v1','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'selfExcluded':True,'files':files,'codeBindings':[{'path':f,'sha256':sha(Path(f))} for f in code],'closureStatus':'PASS','fullSuiteClean':False})
print(json.dumps({'closure':'PASS','partition':[30,29,1],'accountingRegressions':0,'fullSuiteClean':False,'knownBaselineTestFailures':18,'sealedArtifacts':len(files)}))
