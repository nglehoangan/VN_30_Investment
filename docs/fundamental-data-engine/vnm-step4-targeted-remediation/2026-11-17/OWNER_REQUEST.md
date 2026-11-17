# Owner implementation instruction — 2026-11-17

Giải quyết vấn đề của các issue này

| Vấn đề | Vì sao bị block | Cách giải quyết |
| --- | --- | --- |
| Consumer scoring chưa nhận đúng dataset hiện tại | resolveCurrentDataset() đọc dữ liệu thành công, nhưng score() vẫn đi qua repository DI lịch sử. Receipt current-purpose bị từ chối với DI_ACCEPTANCE_REQUIRED. | Bổ sung đường authorization cho CURRENT_FORMAL_VALUATION, kiểm tra binding, lineage, revocation và các gate scoring hiện hữu. Giữ nguyên thời điểm biết dữ liệu; không tạo snapshot historical PIT giả. |
| Ngày hiệu lực methodology bị so với ngày dữ liệu | Methodology duyệt 17/11/2026, trong khi cutoff kinh tế là 30/10/2026. Guard hiện tại trả FUTURE_METHODOLOGY. | Tách cutoff kinh tế, thời điểm biết dữ liệu và thời điểm đánh giá. Đánh giá hiện tại bằng phương pháp có hiệu lực tại lúc đánh giá, đồng thời giữ giá/nghĩa vụ đúng cutoff. Cần sửa contract và kiểm thử; không backdate approval. |
| Bốn rubric chưa chọn được band | Các phép tính đã có chưa đủ chứng minh kết luận kinh tế mà từng rubric yêu cầu. | Hoàn thiện các cầu nối kinh tế cụ thể dưới đây từ dữ liệu đã giữ. |
| Assessment và M1 chưa được adoption hợp lệ | Có 23 hồ sơ đề xuất, nhưng chưa có bộ assessment chính thức và gate M1 có provenance phù hợp. Approval Step 3 chỉ duyệt executable. | Dùng đường HUMAN adoption thực tế hoặc hoàn thiện trusted AI adoption hiện có; không xin lại source approval hay approval từng PDF. |

This is implementation authorization, not an invented exact-content executive signature, HUMAN assessment or production activation. Markdown formatting normalized; original message identifiers/timestamps unavailable and not invented.
