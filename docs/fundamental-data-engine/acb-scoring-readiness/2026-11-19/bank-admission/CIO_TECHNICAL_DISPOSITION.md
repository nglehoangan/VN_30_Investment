# Rà soát kỹ thuật CIO — admission BANK ACB

**Kết luận kỹ thuật đề xuất:** Đạt diễn tập admission trên SQLite cô lập cho ACB, HOSE, BANK, cutoff 30/10/2026. Kích hoạt phiên bản admission chính thức và chấm điểm vẫn **BLOCKED**.

SHA-256 của [gói rà soát](CIO_REVIEW.json) là `00efa0db7c4c37a01c50698764def7c534a878e549bbb726ef569e9eaa0583c7`. Cả năm pin trong gói khớp byte. Replay với đúng `knownAt` phát lại [receipt](ISOLATED_REPLAY.json) giống từng byte. Đọc lại 14 fact từ hai PDF, đạt chạy lặp và kiểm tra mã/ngày chốt.

- CAR 0,118 và CET1 0,115 giữ nguyên ngày 30/06/2026, phạm vi hợp nhất theo quy định và đơn vị tỷ lệ.
- Dự phòng cho vay khách hàng 8.153.076 triệu VND có đúng hai toán hạng chung và cụ thể. Fact cho vay ký quỹ đứng riêng.
- S4 thuộc phạm vi nghiên cứu, với giới hạn độ phủ được ghi trong hồ sơ.

**Điều kiện mở phiên bản chính thức.** Mã đang được ghim là runner chỉ dùng cho diễn tập, khởi tạo và ghi trực tiếp schema trong SQLite tạm. Cần ghim đầy đủ mã nguồn và schema phụ thuộc cho phiên bản BANK chạy qua đường admission có quản trị. Sau đó kiểm thử dương tính và âm tính trên nguồn thật qua registry và consumer chính thức, gồm quyền phiên bản, thu hồi, binding và đọc chỉ đọc. Gói hiện tại chưa có `datasetHash`, `assessmentHash` hoặc `approvedExecutableHash`. Không cần xin xác nhận lại từng PDF.

Biên bản này ghi nhận kết quả rà soát kỹ thuật. Quyết định của chủ sở hữu đối với phiên bản chính thức và quyền chấm điểm ACB vẫn đang chờ.
