# ACB — Rà assessment chính thức ngày 22/11/2026

Ngày chốt 30/10/2026. Dùng đúng ACB/HOSE, sector BANK và phương pháp current-scoring-acb-official-limited-v1. Giữ bốn quyết định N/R đã duyệt cho FH-LIQ, FH-STRESS, RG-GOV và RG-RISK.

## Điểm chặn ở BANK binding

Adapter chính thức với SQLite chỉ đọc đọc lại 14 fact, khớp BANK binding, data acceptance và consumer dataset hash đã lưu khi dùng mốc gốc **19/11/2026 13:22:42.211 UTC**. Bộ thực thi đã đăng ký có hiệu lực từ **22/11/2026 04:36:38.806 UTC**. Trình xác minh từ chối chạy bộ thực thi mới ở mốc dữ liệu gốc với `CURRENT_EXECUTABLE_APPROVAL_TIME`. Khi dùng đúng mốc bộ thực thi mới, BANK consumer trả `BANK_DATA_ACCEPTANCE_REQUIRED`.

Hash của BANK acceptance bao gồm toàn bộ ngữ cảnh tiếp nhận, trong đó có knownAt. Scoring hiện dùng knownAt của assessment để đọc dataset và kiểm tra hiệu lực executable. Luồng limited đồng thời yêu cầu đúng acceptance ID gốc. Nếu chỉ tạo acceptance cho knownAt mới, ID sẽ đổi và điều kiện exact-ID vẫn chặn.

Đề xuất sửa hẹp nhất cho tuyến ACB limited. Tách mốc tiếp nhận dataset của reference đã ghim khỏi mốc lập assessment và hiệu lực executable. Đọc lại dataset đã duyệt tại mốc gốc, tiếp tục xác minh binding, dataset, acceptance, thu hồi và bằng chứng assessment tại các cổng hiện hành. Ghim cả hai thời điểm và exact dataset hash. Thử để từ chối hash, binding và cutoff khác hoặc bị thu hồi. Do thay đổi logic nằm trong bộ thực thi đã ghim, trình duyệt phiên bản kế nhiệm theo hash mới trước khi đăng ký. Giữ bản tiếp nhận và lịch sử bằng chứng hiện tại.

## Rà 19 band đề xuất và bốn N/R

Biên nhận PREPARATION chẩn đoán ghi band nghiên cứu, topic bắt buộc và pin nguồn riêng cho từng rubric. Hai dòng BQ-MOAT và IC-POS được bắt đầu bằng nguồn nghiên cứu trong danh mục V12 vì dòng rubric chưa ghim trực tiếp tệp riêng. Ghim theo topic trong assessment packet còn phải chọn đoạn bằng chứng, cách diễn giải, phạm vi và phản chứng. Tài liệu ở mức nhóm chưa đủ để đánh dấu mọi topic đạt.

CHALLENGE kiểm tra các giả định có thể đảo band. VAL-RET IRR cơ sở 3,25% nhưng mức giá thoát 28.405 đồng với cùng dòng tiền cho 8,37%. Giữ nguyên candidate dưới 8% ở mức nghiên cứu cho đến khi có lựa chọn giá thoát có căn cứ theo ROE/Ke và vốn giữ lại. VAL-PRIMARY và VAL-MOS có định giá BANK được phép, nhưng mẫu số ROE và Ke còn là giả định. CA-DIST có phân phối lịch sử, vẫn cần kết luận sức chịu vốn theo phạm vi và dải vốn đã có. CA-REINV giữ 1/2 nghiên cứu. Phần 634 tỷ và −13,8% của ACBS trong V12 có đối chiếu hồi cứu tháng 11. Đã định vị được công bố ACBS ngày 20/10 trước cutoff, nhưng lượt này chưa đọc được các trang bảng số liệu để ghim số cùng kỳ. LNST ACBA và thời điểm triển khai vốn vẫn chưa xác định. Không cộng hoặc nội suy LNST từ LNTT để chấm. [BCTC ACBS Q3 công bố ngày 20/10](https://acbs.com.vn/acbsmedia/2026/10/20261020-CBTT-BCTC-hop-nhat-Quy-3.2026-va-giai-trinh-LNST.pdf) · [Hồ sơ vốn và giá thoát](ACB_CAPITAL_HEADROOM_AND_EXIT_TEST.md) · [CA-REINV](ACB_CA_REINV_FOLLOWUP_2026-11-21.md)

Hai lượt chẩn đoán được ghim bằng SHA-256 và mang trạng thái BLOCKED. Còn thiếu 19 assessment rows với đủ topic/evidence đã định danh, metric dispositions và hai pass artifacts trên chính adoption packet. Chưa tạo reviewBindings chính thức. M1 tiếp tục review CLOSED, riskOutcome PENDING.

## Kết quả CLI

prepare chỉ đọc dừng exit 1 với CANDIDATE_PIN_REQUIRED và CANDIDATE_REVIEW_BINDINGS_REQUIRED. Đây là các lỗi CLI gặp trước bước gọi worker. Lỗi thời điểm BANK đã tái hiện riêng bằng adapter và verifier thực tế. Chưa có formalAssessmentHash, preflightHash hoặc approvalHash. Chưa chạy score.
