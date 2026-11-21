# ACB — Hồ sơ bằng chứng công khai cho FH-LIQ và FH-STRESS

Phạm vi hợp nhất ACB, bảng kỳ hạn 30/09/2026, ngày chốt đánh giá 30/10/2026. Dùng cùng [BANK binding và dataset](ACB_BANK_SCORING_REFERENCE.json). [Cầu nối 30 ngày](ACB_FH_30_DAY_LIQUIDITY_BRIDGE.md) là mô hình gốc. [Danh mục nguồn và SHA-256](ACB_FH_PUBLIC_EVIDENCE_SOURCES.json) ghim cả dữ liệu sẵn có lẫn hai công bố mới lưu.

## Bằng chứng bổ sung

- **Q3, thuyết minh V.8 và V.9.** Vay NHNN là **800,176 tỷ đồng**, repo KBNN **1.371,044 tỷ**, so với **31.152,220 tỷ** và **1.805,161 tỷ** cuối 2025. Đây là số dư tại hai ngày quan sát. V.9 tách tổng tiền gửi TCTD khác **120.248,508 tỷ** và vay TCTD khác **44.520,381 tỷ**, trong đó vay chiết khấu/tái chiết khấu **8.746,113 tỷ** và vay cầm cố/thế chấp **10.962,000 tỷ**. Thuyết minh này giúp nhận diện kênh tài trợ đã dùng, nhưng không phân rã riêng dòng gộp **130.358,815 tỷ** đến một tháng hoặc định lượng phần tài sản bảo đảm có thể tái sử dụng. Giảm vay NHNN tại hai mốc cũng chưa cho thấy mức sử dụng trong tháng. [BCTC Q3 gốc](https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%203/ACB_Baocaotaichinh_Q3_2026_Hopnhat.pdf)
- **VSDC, 10/09.** ACB12412 đáo hạn ngày 30/10, với gốc **1 tỷ đồng** và lãi **50 triệu đồng** mỗi trái phiếu. Đây là lịch thanh toán của mã cụ thể. Vẫn cần khối lượng dư nợ đến hạn của lô và kết quả phát hành hoặc hạn mức thay thế để xác minh dòng tiền ròng. Không đưa lịch trả nợ lần thứ hai vào bảng kỳ hạn; không dùng coupon 5% của khoản cũ làm giá vốn mới. [Thông báo VSDC](https://vsdc.vn/vi/ad1/200149)
- **ACB, 27/10.** Ngân hàng công bố huy động thành công khoản vay hợp vốn quốc tế **500 triệu USD**, CASA khoảng **22%**, và tiền gửi khách hàng tăng **3,4%** trong Q3. Đây là bằng chứng về khả năng tiếp cận một kênh vốn và diễn biến số dư. Công bố chưa cho số tiền khả dụng bổ sung trong 30 ngày, ngày giá trị, phần hạn mức còn rút, điều kiện rút và phần đã phản ánh vào bảng kỳ hạn. Không cộng khoản USD hoặc suy ra tỷ lệ tái tục từ tăng trưởng số dư. [Công bố ACB](https://acb.com.vn/ve-chung-toi/kqkd-acb-9-thang-2026-tin-dung-tang-11-5-fitchratings-nang-xep-hang-tin-nhiem-len-bb-trien-vong-on-dinh)

## Tác động đến assessment

**FH-LIQ — OPEN.** Giữ nguyên nguồn bù tăng thêm chưa xác minh. Với 75% tái tục của từng nhóm TCTD và giấy tờ có giá, tiền gửi khách hàng trong bucket cần duy trì **33,71%** để hòa vốn trước nguồn bù mới. Nếu chỉ duy trì 25%, cần **19.646,650 tỷ đồng** bổ sung. Dữ liệu mới chưa chọn được kịch bản đại diện. Phần Chính phủ H1 **7.079,574 tỷ đồng** ngoài danh sách bảo đảm công bố vẫn chỉ dùng cho độ nhạy H1.

**FH-STRESS — OPEN.** Với giả định huy động được toàn bộ **19.646,650 tỷ đồng** trong 30 ngày, phụ phí hằng năm 1/2/4 điểm phần trăm cho chi phí tăng thêm trước thuế lần lượt **16,15 / 32,30 / 64,59 tỷ đồng**, tính theo 30/365. Nếu giảm tương ứng vốn tự có và giữ RWA hợp nhất H1 **845.674,174 tỷ đồng**, CAR giảm khoảng **0,19 / 0,38 / 0,76 điểm cơ bản**. Phép thử chỉ đo phụ phí trong giả định huy động được. Bán tài sản cần giá giao dịch và giá trị ghi sổ để đo lỗ. Haircut repo làm giảm số tiền vay được. Chưa có căn cứ chọn chi phí thực tế, xác định tổn thất bán tài sản hoặc tính CAR Q3 sau stress. [Mô hình vốn H1](ACB_RESILIENCE_AND_CAPITAL_REVERSE_STRESS.md)

## Tài liệu cần theo dõi

| Tài liệu và nơi tìm | Điều kiện dùng để chốt |
| --- | --- |
| Bản hỏi đáp 9M26 của ACB, công bố hoặc xác nhận từ đầu mối khoản vay hợp vốn | Ngày giải ngân, phần hạn mức còn rút, điều kiện và phần tiền có thể dùng trong tháng đầu. Đối chiếu với bảng Q3 để tránh tính trùng. [ACB IR](https://acb.com.vn/nha-dau-tu) |
| Kết quả phát hành trái phiếu/CD và công bố thanh toán từng mã | Đối chiếu phát hành thực nhận và ngày giá trị với lịch đáo hạn. Nếu công bố chỉ có số dư hoặc lịch, giữ tỷ lệ tái tục dưới dạng độ nhạy. [HNX CBIS](https://cbonds.hnx.vn/to-chuc-phat-hanh/thong-tin-phat-hanh) · [VSDC](https://vsdc.vn/vi/s-detail/45171) |
| BCTC hợp nhất kiểm toán FY2026 khi công bố, cùng phụ lục thanh khoản hoặc tài sản bảo đảm nếu có | Rà thuyết minh tương ứng 10.1, 15, 34.2 của H1. Tìm tình trạng cầm cố, quyền repo/bán, haircut và phần đã nằm trong dòng tiền 30 ngày. Số tại 31/12 là bằng chứng của kỳ mới. Chỉ dùng cho Q3 khi nguồn có số so sánh Q3 hoặc cầu nối được xác minh. [Kho BCTC ACB](https://acb.com.vn/nha-dau-tu/bao-cao-tai-chinh) |

Cả hai rubric giữ band mở. M1 tiếp tục ghi review CLOSED, riskOutcome PENDING trong phạm vi quyết định hiện có. Hồ sơ này bổ sung bằng chứng nghiên cứu.
