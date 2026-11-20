# ACB — F1 và ràng buộc dataset

**Kết luận: F1 giá đóng cửa đạt trong SQLite cô lập. Dataset chính thức vẫn BLOCKED.** ACB/HOSE, security ID 658fafbe-65b3-4176-999f-d4d32e1bd838, sector BANK, ngày chốt 30/10/2026, universe vn30-20260803-reviewed-20261115.

Bộ thu thập CaféF đã ghim lấy đúng một dòng giao dịch ACB và giữ biên nhận gốc trong `data/market-history/cafef/ACB.json`. Dùng `VersionStandingAuthority`, `PrismaBoundaryStore`, `ingestCafef` và `consumeCafefValuation` với SQLite tạm, registry nguồn hiện có và handoff đúng hash của capture ACB. Kết quả chuẩn hóa **21.000 VND/cổ phần** từ trường `GiaDongCua`. Đạt kiểm tra đọc lại, chạy lặp, từ chối capture ngoài danh mục và chặn đọc sau thu hồi. Tại thời điểm thu thập thực tế mới có receipt này, nên kết quả giữ phạm vi current formal/retrospective valuation. [Biên nhận F1](F1_ISOLATED_RECEIPT.json)

Kiểm thử dựng bộ nguồn đã ghim trong thư mục tạm. Tệp kiểm tra lịch sử `scripts/cafef-standing.mjs` lấy đúng blob đã ghim từ Git chỉ để replay. Nó vẫn vắng mặt ở đường dẫn lịch sử trong checkout hoạt động. Không dùng dữ liệu giá hoặc quyền chấm điểm VNM.

Đề xuất binding kiểm tra đúng mã, security ID, cutoff và giá trên các đầu vào. Kế thừa 14 fact đã diễn tập với từng kỳ, scope, đơn vị và hash nguồn. Có CAR/CET1 ngày 30/06 theo scope hợp nhất quy định, và các số Q3/9T có kỳ riêng. Số cổ phần dùng cho nghiên cứu là 5.804.421.957 theo hồ sơ carry-forward đã giới hạn phạm vi. [Đề xuất binding](BINDING_CANDIDATE.json)

Hash ứng viên là `529fe80c55838d712b9e87983ccb67234ca3852097e46f3d0908b7799ce18dbe`. `officialDatasetHash` và `officialDatasetBindingId` vẫn null.

## Việc còn cần để phát hành dataset chính thức

1. Phê duyệt và đăng ký phiên bản BANK đúng hash `e71155fd18a067ee5e605f0283a30f7572f4f385ab41cc6231dba60673f2e36d`. Không dùng quyết định giả lập trong kiểm thử làm quyền admission.
2. Hoàn thiện composition của dataset BANK. Consumer hiện có nhận lớp admission cũ và bộ yêu cầu chỉ hỗ trợ scope kế toán. Cần nối BANK admission với bộ yêu cầu có cả `REGULATORY_CONSOLIDATED` và nguồn S4 đã kiểm tra, rồi bind và đọc lại bằng đúng phiên bản.
3. Kiểm tra môi trường đích. SQLite hoạt động còn là placeholder. Bộ pin F1 lịch sử cũng còn tham chiếu tệp đã nghỉ dùng. Receipts của SQLite tạm là bằng chứng kiểm thử, còn dữ liệu hoạt động cần route và bộ pin chính thức trước khi materialize.

[CLI check](CLI_CHECK.json) trả BLOCKED. Không ghi SQLite hoạt động và không chấm điểm.
