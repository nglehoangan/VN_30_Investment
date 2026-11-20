# ACB BANK — kiểm thử, định giá và dự thảo trình CIO

**Trạng thái tại 30/10/2026: BLOCKED.** Hồ sơ này phục vụ CIO rà soát phần đã hoàn thành và các điều kiện còn thiếu. [Dữ liệu và hash của dự thảo](CIO_DRAFT.json).

## 1. Adapter BANK và SQLite cô lập

Đã triển khai `CurrentBankScoringConsumer` và nối CLI theo sector. Tuyến BANK dùng `CurrentFinancialDatasets` để phát lại bộ yêu cầu và số liệu theo mã, security ID, ngày chốt, kỳ, scope và vintage. Nó dùng lại bảng enrichment và data acceptance bất biến, xác minh hash khi đọc lại và kiểm tra revocation. Cổng CLI cần một data-acceptance receipt đã được chuẩn bị trước. Replay VNM tiếp tục dùng consumer hiện có.

Kiểm thử trên SQLite tạm đạt binding, tạo receipt trong SQLite cô lập, đọc lại, idempotency, từ chối sai mã/security ID/cutoff, revocation và bảo vệ NAV. Kiểm thử dùng số liệu ứng viên ACB và fixture cho upstream admission, F1 và cổ phần. Không tạo receipt ACB thật. Bài kiểm thử `tests/integration/acb-bank-sqlite-rehearsal.mjs` chạy bằng Node đã pin với `--experimental-transform-types`. Lần này dùng Zod 4.6.1 trong thư mục tạm và trình nạp tạm cho các dependency nội bộ chỉ giữ chỗ.

Điểm nghẽn cụ thể ở bước admission nguồn. Phiên bản `CurrentFinancialAdmissions` đang dùng ràng buộc catalog theo phiên bản, chỉ nhận vai trò báo cáo đã soát xét cho tuyến đó, chỉ tạo fact tiền tệ đã báo cáo, và đưa phép cộng dự phòng vào diện cần công thức được kiểm soát. Bản Q3 ACB đã xem là báo cáo hợp nhất giữa niên độ, chưa xác lập ý kiến soát xét. CAR/CET1 cần kiểu tỷ lệ và scope quy định. Để chạy admission thật, cần phiên bản BANK của chính sách vai trò tài liệu, catalog ACB và công thức dự phòng, với replay dương tính và âm tính trên nguồn thật ở SQLite cô lập. Registry ACB vẫn chưa có route được bật.

## 2. PDF Q3, S4 và đầu vào định giá

- Bản PDF từ chính URL Vietstock đã lưu khớp SHA-256 `1c0453b0ee4725946bd18bf5204177f2a705edcbfc29e746c403d340d5498315`. Đã đối chiếu trực quan các trang vật lý 3, 4, 6, 17, 19 và 24. Trang 17 là thuyết minh V.4 về cho vay, trang 19 là V.5 về dự phòng. [BCTC hợp nhất Q3 ACB](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/ACB_Baocaotaichinh_Q3_2026_Hopnhat.pdf)
- Giá thô ngày 30/10 là **21.000 VND/cổ phần** theo quan sát CaféF đã ghim. BCTC xác nhận **5.804.421.957** cổ phần phổ thông lưu hành ngày 30/09. Đối chiếu VSDC, cổng ACB và Vietstock trong phạm vi tra cứu 01–30/10 chưa thấy thay đổi cổ phần ACB có hiệu lực. Hồ sơ VSDC cho thấy thay đổi số đăng ký gần nhất vào 29/06. Các mục trái phiếu và chứng quyền thuộc chứng khoán khác. Danh mục được duyệt theo ngày hiệu lực và bộ tài liệu đầy đủ cho tháng 10 vẫn chưa có, nên mẫu số cutoff giữ trạng thái ứng viên. [VSDC](https://vsdc.vn/vi/s-detail/9) · [ACB](https://acb.com.vn/nha-dau-tu) · [Vietstock](https://finance.vietstock.vn/ACB-ngan-hang-tmcp-a-chau.htm)
- Vốn chủ sở hữu **hợp nhất báo cáo** là **104.013.132 triệu VND** tại 30/09, lợi nhuận sau thuế **hợp nhất** lũy kế 9 tháng là **13.311.703 triệu VND**. Giá chia cho giá trị sổ sách tham chiếu dùng mẫu số tháng 9 cho P/B khoảng **1,172 lần**, chỉ là phép đối chiếu có điều kiện. Bản nghiên cứu FY2025 giữ **15.524.699 triệu VND** cho kịch bản lợi nhuận đã được nghiệm thu trong phạm vi đó. Chi phí vốn chủ **15%** là giả định cơ sở của mô hình cũ. Vốn phổ thông đủ điều kiện, lợi nhuận bền vững và khả năng phân phối vốn còn cần đối chiếu quyền hưởng lợi, quỹ, bộ đệm vốn và nhu cầu vốn tăng trưởng. Chưa có giá trị hợp lý được chốt. [BCTC hợp nhất Q3 ACB](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/ACB_Baocaotaichinh_Q3_2026_Hopnhat.pdf)

## 3. Phiên bản kế nhiệm và quyết định CIO

Đã đưa công cụ kiểm tra nhất quán vào `tools/scoring/verify-current-parity.mjs`. Công cụ đọc đúng blob generator đã nghỉ dùng từ Git, kiểm tra SHA-256 rồi chạy chế độ kiểm tra. Kết quả `CURRENT_PARITY_PASS`. Verifier phê duyệt hiện tại vẫn thực thi bộ pin cũ. Bước tiếp là phát hành verifier và danh sách pin phiên bản kế nhiệm, chạy kiểm tra cho đúng danh sách đó và trình CIO phê duyệt phiên bản. Dự thảo kèm hash triển khai, mục đích, mã và cutoff. Chưa có hash dataset và assessment ACB để lập yêu cầu duyệt chấm điểm hoàn chỉnh.

CLI `check` trả `BLOCKED` với `SCORING_DATABASE_BYTES_NOT_LOCAL`, `NO_REGISTERED_TICKER_MAPPING_ADAPTER` và `NO_EXACT_TICKER_SCORING_AUTHORITY`. Cả 26 kiểm thử CLI/rollout đạt. Không chấm điểm và không ghi DB hoạt động.

**CIO review.** Hồ sơ hiện đủ để xem xét hướng nghiệm thu adapter BANK và phiên bản thực thi kế nhiệm. Hồ sơ chấm điểm chỉ được trình sau khi admission, S4, S1–S5 và các cổng M1/rủi ro được ràng buộc với đúng bộ dữ liệu ACB.
