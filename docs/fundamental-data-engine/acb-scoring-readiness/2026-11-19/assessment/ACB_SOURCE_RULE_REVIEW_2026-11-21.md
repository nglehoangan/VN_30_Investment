# ACB — Rà soát theo quy tắc nguồn ngày 21/11/2026

Ngày chốt 30/10/2026. Dùng scope và BANK binding từ assessment V8. Áp dụng [quy tắc nguồn trong skill](../../../../../skills/equity-s1-s5-assessment/SKILL.md). Dùng lại số ACB đã lưu và chỉ rà công bố cho các trường còn thiếu.

## Kết quả bổ sung từ dữ liệu đang có

**GQ-FWD — đề xuất nghiên cứu 2/5, Limited/cyclical.** Nền lợi nhuận phổ thông chuẩn hóa 15.307 tỷ đồng và giả định tăng 6%/năm cho khoảng 19.326 tỷ năm 5. Mô hình giữ lại vốn theo dòng cổ tức đã lưu cho ROE năm 6 chỉ 11,70%, dưới Ke cơ sở 15%. Đây là kiểm tra tính nhất quán của đường tăng trưởng với tích lũy vốn. Phản chứng là tín dụng 9 tháng tăng 11,5% và NIM riêng Q3 cải thiện lên 3,08%. Giữ band nghiên cứu 2 vì tăng tín dụng và phục hồi NIM ngắn hạn đi cùng rủi ro chi phí vốn và dự phòng, trong khi EPS chuẩn hóa ở FY2023–2025 gần như đi ngang. Để nâng band, cần thấy biên lãi và chi phí tín dụng duy trì được khi vốn/RWA tăng, hoặc bằng chứng ROE cải thiện mà không phụ thuộc vào giả định payout thấp. Đường tăng 6% là giả định, cần mô hình tín dụng–NIM–chi phí tín dụng và vốn để trình band chính thức. [Mô hình vốn và IRR](ACB_CAPITAL_HEADROOM_AND_EXIT_TEST.md) · [Chuỗi lợi nhuận/cp](ACB_CA_PSV_NORMALIZED_VALUE_REVIEW.md) · [Công bố ACB 9M26](https://acb.com.vn/ve-chung-toi/kqkd-acb-9-thang-2026-tin-dung-tang-115-fitchratings-nang-xep-hang-tin-nhiem-len-bb-trien-vong-on-dinh)

**FH-LIQ và FH-STRESS.** Giữ công bố khoản hợp vốn 500 triệu USD làm bằng chứng về kênh huy động. Báo cáo của người tham dự buổi gặp 28/10 ghi kỳ hạn ba năm và dự kiến rút trong Q4. Dùng chi tiết này làm đầu mối tìm công bố gốc về ngày giá trị, số tiền thực rút và phần hạn mức còn khả dụng. Mô hình cơ sở giữ nguyên nguồn bù chưa xác minh, và mức cần bù khoảng 19.647 tỷ trong kịch bản 75%/75%/25%. M1 giữ review CLOSED và riskOutcome PENDING theo hồ sơ hiện có. [Hồ sơ nguồn và mô hình thanh khoản](ACB_FH_PUBLIC_EVIDENCE_REGISTER.md) · [Ghi nhận buổi gặp của Vietcap](https://www.vietcap.com.vn/en/research-center/acb-bridging-sme-business-banking-affluent-wealth-management-to-drive-long-term-transformation-analyst-meeting-note)

## Các trường còn thiếu để quyết định band

Trạng thái bên dưới có nghĩa là chưa có trường dùng được trong hồ sơ đang rà. Lần chạy sau kiểm tra tài liệu mới theo từng dòng và giữ kỳ công bố riêng nếu nằm sau cutoff.

| Rubric | Số hoặc căn cứ còn thiếu | Nguồn/lần rà tiếp |
| --- | --- | --- |
| FH-LIQ, FH-STRESS | Lượng vốn khả dụng 30 ngày, lịch rút khoản hợp vốn, tài sản bảo đảm đủ điều kiện sau haircut và khử trùng, chi phí trong stress | ACB IR, kết quả phát hành HNX/VSDC, thuyết minh thanh khoản và tài sản bảo đảm của BCTC kiểm toán FY2026. Chưa tìm thấy ngày giải ngân thực tế trong công bố đã rà ngày 21/11. |
| IC-IND, IC-CYCLE | Kinh tế ngành qua chu kỳ cùng cơ sở với nhóm so sánh, khả năng tái định giá khi funding và chi phí tín dụng thay đổi | Chuỗi NHNN và BCTC ngân hàng cùng nhóm qua nhiều kỳ. Tái sử dụng chuỗi chi phí vốn đã lưu ở vòng sau. |
| VAL-PRIMARY | Căn cứ chọn ROE/Ke và giá trị đại diện từ dải P/B đã có. Giá 21.000 cao hơn đầu trên 20.205 trong dải đang thử | Đối chiếu ROE và P/B lịch sử với cơ sở định giá, tài liệu vốn/RWA riêng lẻ và dự phóng phân phối. Giữ kết quả VAL-RET dưới 8% ở mức nghiên cứu. |
| RG-GOV, RG-RISK | Điều khoản hoặc giám sát giao dịch ACB Insurance để đánh giá hiệu lực kiểm soát. Phân loại phần rủi ro còn lại sau Financial Health | Nghị quyết 4490 và tài liệu quản trị đã đủ cho tuyến phê duyệt. Tìm phụ lục giao dịch hoặc báo cáo giám sát áp dụng cho giao dịch tháng 10. |
| CA-REINV | Lợi nhuận tăng thêm quy được cho vốn giữ lại hoặc vốn cấp cho công ty con | Thuyết minh đầu tư công ty con và báo cáo kết quả phân khúc. Dùng chỉ dấu lợi nhuận trên vốn tăng thêm đã tính, với giới hạn về quy kết. |

## Preflight chỉ đọc

- `prepare` với candidate đang lưu trả BLOCKED. Hai lỗi hiện tại là `CANDIDATE_PIN_REQUIRED` ở assessment và `CANDIDATE_REVIEW_BINDINGS_REQUIRED`. Inventory đọc được BANK admission và dataset ACB.
- `check` xác định ACB/HOSE, BANK, đúng universe và ngày chốt. Hai lỗi hiện tại là `NO_REGISTERED_TICKER_MAPPING_ADAPTER` và `NO_EXACT_TICKER_SCORING_AUTHORITY`.
- Dataset body hash `43f9ac0d2a6f67d7bd4e7d13180e7edc247147e096bb5a335ed75cb60cd911e5`. Inventory score rỗng. Chưa có formalAssessmentHash hoặc approvalHash cho route hoàn chỉnh.
