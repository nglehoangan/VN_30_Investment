# M3/M4 — xác nhận nguồn dữ liệu của chủ sở hữu

**Ghi nhận16/11/2026 — chỉ thị chủ sở hữu, áp dụng cho các lần kiểm chứng M3/M4 về sau.** Đây là phụ lục hướng dẫn nguồn dữ liệu; giữ nguyên bản policy/authority đã duyệt để replay.

## Xác nhận đã nhận

Chủ sở hữu xác nhận: các file đang dùng đều được lấy từ nguồn thật; các website/API đã được chủ sở hữu kiểm tra. Không yêu cầu lặp lại việc chứng minh chúng là nguồn thật. Nguyên văn được lưu trong JSON cùng tên; không tự tạo message ID hoặc thời điểm gửi chính xác.

Phạm vi là các file/website/API đã được owner kiểm tra và đưa vào dự án, bao gồm retained VNM hiện đang xử lý. Ghi nhận này không tự xác nhận một URL/file chưa từng được xem xét trong tương lai.

## Hành vi bắt buộc khi kiểm chứng

1. **Mặc định tái sử dụng nguồn đã xác nhận.** Đọc xác nhận này trước khi nêu blocker về tính có thật/xuất xứ hoặc yêu cầu owner gửi/tải lại nguồn. Không hỏi lại owner đã kiểm tra website/API chưa.
2. Dùng file và observation thật **đã giữ** để kiểm thử integration. “Kiểm chứng bằng dữ liệu thật” nghĩa là phần mềm đọc/chuẩn hóa/admit/consume đúng dữ liệu đó, không phải bắt owner chứng minh nguồn thật lần nữa.
3. Giữ source URLs, original receipts và hashes hiện có làm lineage; không dựng thêm per-file/per-fact approval hoặc bắt thực hiện lại source discovery/acquisition chỉ để tái tạo chứng cứ.
4. Nếu adapter chưa hỗ trợ caption/schema/catalog, hoặc consumer chưa nhận CURRENT_ONLY, ghi là **khoảng trống triển khai**. Không suy thành thiếu báo cáo, nguồn không thật hoặc cần owner xác nhận lại.
5. Chỉ mở lại vấn đề nguồn khi có mâu thuẫn/thay đổi cụ thể, chẳng hạn hash thay đổi, issuer không khớp hoặc một input mới ngoài phạm vi. Nêu đúng file/fact/lỗi; giữ phần không bị ảnh hưởng.

## Phần vẫn kiểm tra để tránh tính sai

- Mã/issuer, báo cáo/revision, kỳ và cột so sánh, hợp nhất/riêng và attribution.
- Caption/cell, đơn vị, dấu, missing/null/zero, công thức và chuyển đổi số.
- Tính toàn vẹn bytes so với hash đã giữ; không sửa hoặc xóa nguồn để làm test xanh.
- Ghi/đọc DB cô lập, idempotence, conflict handling, replay và phạm vi sử dụng CURRENT_ONLY/PIT.

Đây là kiểm tra **tính đúng của việc sử dụng dữ liệu**, không phải xét lại xác nhận của owner về nguồn. Không đồng nhất “nguồn thật” với “mọi mapping/đơn vị/phép tính đều đúng”.

Existing Standing Authority per Version/source roles tiếp tục được tái sử dụng, không xin lại từng PDF/fact. Xác nhận nguồn này không tự tạo HUMAN adoption, trusted executable binding, approval17fact VNM, historical PIT hoặc production activation; đó là những quyết định khác, không được bịa để vượt validator.

Khi giải thích validation cho owner, dùng cách nói: “Kiểm tra phần mềm xử lý đúng dữ liệu đã xác nhận”, tránh lặp lại yêu cầu “chứng minh đây là nguồn thật”.
