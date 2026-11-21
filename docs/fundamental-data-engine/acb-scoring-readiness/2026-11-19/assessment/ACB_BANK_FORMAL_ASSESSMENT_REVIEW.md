# ACB — Rà soát điều kiện chốt assessment trên BANK binding

Ngày chốt 30/10/2026, ACB/HOSE. Parent dataset `012ddaa99a1d0edd6a208e969a9d2811f01b848b44bf76d745e0dc8083056e8b`. Binding manifest `bff83724df834f2b29a7a4d0a3a3b573ab466aa2c2d4f72ab23f9b42b2825119`. Dataset hash engine đã đọc lại là `b916468f9808b2f7fed904ef5ba14913c7546cb644289bb0b0a28d3aa1152568`. [Biên nhận binding](ACB_BANK_BINDING_RECOVERY_RESULT.json)

| Rubric | Kết quả rà soát |
| --- | --- |
| RG-GOV | Nghị quyết 4490 xác nhận HĐQT duyệt phạm vi giao dịch ACB Insurance, giá theo quy định nội bộ và thông báo Ban Kiểm soát. Thuyết minh Q3 cho số dư một nhóm các bên liên quan khác. Chưa tìm được chứng cứ có thể đối chiếu thực tế giá/phí, cách xử lý xung đột, bảo vệ cổ đông thiểu số và kết luận kiểm toán liên quan cùng phạm vi. Giữ N/R. |
| VAL-PRIMARY và VAL-MOS | Mô hình nghiên cứu P/B hợp lý cho giá trị hiện tại cơ sở 17.497 đồng/cp và giá thoát năm 5 là 21.872 đồng/cp. Hai số thuộc hai thời điểm khác nhau. Cần xác lập giả định chi phí vốn, dư địa phân phối và mức giá thận trọng có căn cứ trước khi áp band chính thức. |
| CA-DIST | Số dư lợi nhuận riêng lẻ Q3 và kế hoạch cổ tức đã có. Dư địa mô phỏng tính từ vốn/RWA riêng lẻ H1 phụ thuộc biên quản trị và mức vốn được công nhận. Chưa tìm được bảng vốn/RWA riêng lẻ tại điểm xuất phát Q3 để kiểm chứng trần. |
| VAL-RET | Kịch bản cơ sở 3,25%, đề xuất nghiên cứu dưới 8%. Tại giá thoát 21.872 đồng/cp, tăng giả định cổ tức lên 1.000 đồng/cp mỗi năm vẫn chỉ cho IRR 5,51%. Với cổ tức cơ sở 450/0/686/727/771 đồng/cp, giá thoát 28.405 đồng/cp riêng nó đủ đưa IRR lên khoảng 8,37%. Vì giá thoát có thể đổi band, cần căn cứ định giá cuối kỳ để chính thức hóa band. |

Nguồn rà soát gồm [trang quản trị ACB](https://acb.com.vn/nha-dau-tu/bao-cao-quan-tri-acb), [BCTC Q3 hợp nhất](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/ACB_Baocaotaichinh_Q3_2026_Hopnhat.pdf#page=29), [BCTC riêng Q3](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/ACB_Baocaotaichinh_Q3_2026_Congtyme.pdf?ver=4c774fd0) và [bảng vốn H1](https://static2.vietstock.vn/data/HOSE/2026/BCTLATV/VN/QUY%202/ACB_BaocaoTyleAnToanVon_6T_2026.pdf?ver=4e1dacd3).

Executable đã phê duyệt và xác minh 34 pin. [Biên nhận executable](ACB_EXECUTABLE_RECOVERY_VERIFIED.json). Candidate đã gắn executable và reference mới. `prepare` chỉ ra hai đầu vào còn thiếu là assessment và review bindings. Chưa tạo `formalAssessmentHash`, `preflightHash` hay quyền score. M1 giữ CLOSED/PENDING theo quyết định đã ghi. Các band nêu trên thuộc phạm vi nghiên cứu.
