# Tuyến admission ACB đã đăng ký — xác minh đọc/ghi

Đã ghi nguyên văn quyết định của chủ sở hữu và dòng chuẩn hóa riêng cho verifier. Phiên bản BANK chốt đúng hash `e71155fd18a067ee5e605f0283a30f7572f4f385ab41cc6231dba60673f2e36d`, phạm vi admission ACB/HOSE tại 30/10/2026. Tuyến admission đăng ký riêng với route chấm điểm. Quyền chấm điểm và kích hoạt production không phát sinh.

Composition `app/server/acb-bank-admission.ts` ghim đăng ký, phiên bản, bộ yêu cầu BANK và nguồn S4. F1 được kiểm tra và đọc lại bằng Market Boundary. Hồ sơ cổ phần được kiểm tra lại theo mã, kỳ, phạm vi kỳ rà soát và hash PDF/tài liệu hỗ trợ. Binding yêu cầu đúng scope CAR/CET1, thời kỳ và ngày chốt. Kiểm tra hash sau khi ghi bằng lần đọc lại qua consumer.

Replay của route đã đăng ký với quyết định thật chạy thành công trên SQLite cô lập. Đọc lại 14 fact, giá 21.000 VND/cổ phần, số cổ phần 5.804.421.957. Chạy lặp và đọc query-only đạt, sai mã bị từ chối. Trong thư mục replay, tệp `scripts/cafef-standing.mjs` đã nghỉ dùng được lấy từ Git và kiểm tra đúng hash cũ. Không tái tạo tệp ở checkout hoạt động.

SQLite hoạt động đã tải cục bộ, đọc chỉ đọc thành công. Trước khi ghi, preflight phát hiện pin F1 của runtime hiện hành còn trỏ vào `scripts/cafef-standing.mjs` không có trong checkout. Cổng đó vẫn chặn materialization lên SQLite đích. SQLite hoạt động có 0 admission ACB và 0 dataset ACB. SHA-256 vẫn khớp baseline. Hash chính thức vẫn null.

Bước kỹ thuật tiếp theo là hoàn tất bộ pin F1 kế nhiệm qua cổng phiên bản, hoặc có một bản runtime hợp lệ cho đúng bộ pin đã duyệt. Sau đó chạy route đã đăng ký và xác minh lại hash ở SQLite hoạt động. Không thay receipt VNM hoặc gán hash replay làm hash chính thức.

[Route admission đã đăng ký](../bank-admission/ACB_ADMISSION_ROUTE_REGISTERED.json) · [Replay cô lập](REGISTERED_ROUTE_ISOLATED_REPLAY.json) · [Preflight SQLite đích](REGISTERED_TARGET_PREFLIGHT.json)
