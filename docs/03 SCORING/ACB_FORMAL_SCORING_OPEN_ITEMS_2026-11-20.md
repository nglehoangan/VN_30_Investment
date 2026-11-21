# ACB — Điều kiện hoàn tất assessment ngày chốt 30/10/2026

**BLOCKED.** SQLite đọc ở chế độ chỉ đọc, xác nhận admission và dataset của ACB/HOSE, security ID `658fafbe-65b3-4176-999f-d4d32e1bd838`. Dataset `012ddaa99a1d0edd6a208e969a9d2811f01b848b44bf76d745e0dc8083056e8b` có body hash `43f9ac0d2a6f67d7bd4e7d13180e7edc247147e096bb5a335ed75cb60cd911e5`. SQLite SHA-256 `1ab68ec733adcbdb6eeb8320619174cfe3b9bbfc1fc9e4d3012235b40322a93f` khớp lần đọc trước.

## Bằng chứng và band cần chốt

| Hạng mục | Trạng thái và điều kiện để dùng trong assessment |
| --- | --- |
| S1 | Band nghiên cứu BQ-EQ 3–4 và BQ-CASH 3–4. Lợi nhuận chuẩn hóa cơ sở khoảng 15.307 tỷ đồng, dùng dự phòng 65 điểm cơ bản và loại thu hồi nợ một lần. Cần lấy lại cầu nối và bằng chứng theo từng rubric, gồm giới hạn của ROE và đối chiếu thực thu. Giữ tử số EPS 9 tháng là ước tính, tiếp tục dùng EPS công bố cùng kỳ. |
| S3 | Band nghiên cứu IC-POS 2 và BQ-MOAT 3. RG-GOV còn N/R. Cần bằng chứng điều khoản giao dịch bên liên quan hoặc căn cứ tương đương về giá thị trường, bảo đảm và quy trình phê duyệt. |
| S5 | VAL-RET dưới 8% ở mức nghiên cứu, IRR cơ sở 3,25%. VAL-PRIMARY, VAL-MOS và CA-DIST chưa chốt. Cần nền vốn/RWA riêng lẻ cùng phạm vi, hoặc căn cứ định lượng đủ mạnh để giới hạn tác động của việc dùng mốc H1, cùng cầu nối sang lượng tiền có thể trả và giá thoát. |
| M1 | Quyết định trước ghi `review=CLOSED`, `riskOutcome=PENDING`. Khôi phục hồ sơ quyết định và kiểm chứng lại cùng bản executable kế nhiệm trước khi áp dụng quy tắc NON-ACTIONABLE. |

## Điều kiện kỹ thuật

- Lệnh `check` cho universe `vn30-20260803-reviewed-20261115` hiện dừng với exit 2 và `SOURCE_PATH_ESCAPE_OR_MISSING`. Hồ sơ `MARKET_PROFILE.json` theo đường dẫn đã ghim hiện vắng mặt cùng thư mục bằng chứng. Lần thử đọc blob Git cho bản cô lập hết thời gian. Cần truy cập bản gốc có hash khớp và kiểm chứng đường dẫn tham chiếu sau khi khôi phục hoặc di chuyển.
- Registry `tools/scoring/vn30-score-routes.json` có `routes: []`. Mã adapter BANK hiện diện. Cần khôi phục hồ sơ assessment và bộ pin đã được duyệt để có thể xác minh binding đủ trường trước khi điền route.
- Hồ sơ tạm của lần rà soát trước ghi hash phê duyệt executable `0332f10e94540e20ca5f8df136c0811982482eb5623201c99768a2e09a364591`. Các tệp approval và receipt mà biên nhận tham chiếu hiện vắng mặt. Cần xác minh lại đúng bytes của các tệp đó. Quyền score cần binding riêng gắn với route ACB hoàn chỉnh.
- Chưa tạo `formalAssessmentHash`. Trình tự tiếp theo là lấy lại bộ bằng chứng đã ghim, rà đủ rubric bắt buộc, xác minh và đăng ký adapter cùng binding, xác minh quyền theo hash route, rồi chạy `check` chỉ đọc để CIO xem xét.

## Đường chuẩn bị trước phê duyệt

```sh
python3 -B tools/scoring/vn30_score.py --ticker ACB --mode prepare \
  --universe-version vn30-20260803-reviewed-20261115 --cutoff 2026-10-30
```

Truyền `--candidate <json>` cho hồ sơ ứng viên đầy đủ. Dùng cùng schema route với các trường `subject`, `database`, `assessment`, `reference`, `adapter`, `executable` và `reviewBindings`. Tệp ứng viên chưa có `authorization` hay `preflightHash`. Sau preflight chỉ đọc, kết quả `READY_FOR_CIO` trả `proposedRoute`, `approvalHash`, `preflightHash`, hash dataset được engine giải quyết và `formalAssessmentHash` theo hash đầu vào chính thức của engine. Có thể dùng `--previous-proposal <json>` để thấy các trường route đã đổi so với báo cáo duyệt trước. Quyền ghi điểm vẫn cần phê duyệt đúng `approvalHash` và route đã đăng ký.

Tại ACB, báo cáo chuẩn bị hiện chạy được và vẫn dừng vì thiếu profile, tham chiếu sector và các binding ứng viên đã ghim. Các quyết định RG-GOV, định giá S5 và VAL-RET trong bảng trên vẫn chờ hồ sơ có bằng chứng. Không có hash route để trình duyệt tại trạng thái này.
