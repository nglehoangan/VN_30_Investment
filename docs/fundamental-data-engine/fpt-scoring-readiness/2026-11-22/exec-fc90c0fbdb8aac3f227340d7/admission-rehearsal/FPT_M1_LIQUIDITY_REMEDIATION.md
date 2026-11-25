# FPT · kiểm tra lại thanh khoản M1 tại ngày chốt 13/11/2026

Execution S1–S5 `exec-8e2bd503394673db9396b722`. Giữ nguyên bộ dữ liệu consumer với hash `0d9d6490d2fb116b208f939037578ecb43feef975dd2c93cbbd3d37d834c5b49`. Phép thử thanh khoản bổ sung dùng số dư hợp nhất Q3 tại 30/09, trình bày tách khỏi bộ dữ liệu bán niên. Kỳ hạn của bảng gốc bắt đầu tại 30/09. Bảng này chưa nối được các giao dịch từ 01/10 đến ngày chốt. [Biên bản M1](FPT_M1_DATED_ANALYST_DISPOSITION.json) · [Biên nhận bộ dữ liệu](FPT_SCORING_CONSUMER_READBACK.json)

## Bảng kỳ hạn theo thông tin đã công bố

| Nguồn hoặc nghĩa vụ | Số tiền, nghìn tỷ VND | Thời điểm và mức xác nhận |
|---|---:|---|
| Tiền và tương đương | 7,377 | Số ghi sổ. Chưa xác nhận toàn bộ khả dụng ở đơn vị có nghĩa vụ. |
| Tiền gửi kỳ hạn ngắn | 20,879 | Kỳ hạn còn lại không quá 12 tháng. Chưa thấy tách lịch đến hạn ngắn hơn hoặc phần có thể dùng đúng lúc. |
| Vay và thuê tài chính ngắn hạn | 14,316 | Đã gồm 0,492 nợ dài hạn đến hạn. Cộng khoản 0,492 thêm lần nữa sẽ đếm trùng. |
| Thuê hoạt động dưới một năm | 0,869 | Cam kết công bố, đưa vào nghĩa vụ 12 tháng. |
| Chi phí đi vay đã trả trong 9 tháng | 0,567 | Số tiền đã trả. Nhân 4/3 cho 0,756 nghìn tỷ dùng làm độ nhạy, chưa có lịch lãi theo hợp đồng. |
| Tạm ứng cổ tức đợt 1/2026 | 1,886 ước tính | 1.000 VND × 1.885.727.648 cổ phiếu, đưa vào độ nhạy dòng tiền công ty mẹ. Tách khỏi số dư vay Q3. Hồ sơ đầu kỳ chưa xác lập số thanh toán cuối cùng. |
| Hạn mức cam kết chưa rút | Chưa xác nhận | Vay ngắn hạn ngân hàng tăng 19,099 và giảm 15,730 nghìn tỷ trong 9 tháng theo thuyết minh. Đây là bằng chứng tiếp cận tín dụng đã quan sát, chưa xác nhận hạn mức còn sử dụng. |

Nguồn Q3 là trang 3, 10, 32, 40–41 và 48. Nghị quyết cổ tức ngày 27/10 được nhận diện trong danh mục công bố lưu. Mức trên mỗi cổ phiếu lấy từ hồ sơ sự kiện đã giữ, số cổ phiếu lấy từ kiểm tra ngày chốt. [BCTC và rà soát Q3](../FPT_Q3_FINANCIAL_RUBRIC_REVIEW_2026-11-23.md) · [Hồ sơ sự kiện](FPT_CUTOFF_EVENTS.json) · [Đối chiếu số cổ phiếu](FPT_CUTOFF_SHARE_REVIEW.json)

| Phép thử tĩnh trên số dư Q3 | Tiền gửi cần khả dụng | Dư/(thiếu) tại 25% | Dư/(thiếu) tại 50% | Dư/(thiếu) tại 100% |
|---|---:|---:|---:|---:|
| Gốc vay/thuê tài chính + thuê hoạt động | 37,40% | −2,589 | +2,631 | +13,070 |
| Thêm lãi ước tính | 41,02% | −3,345 | +1,875 | +12,314 |
| Thêm lãi ước tính và tạm ứng cổ tức | 50,05% | −5,230 | −0,011 | +10,428 |

Đơn vị dư/thiếu là nghìn tỷ VND. Công thức ngưỡng = (nghĩa vụ xét − tiền và tương đương ghi sổ) / tiền gửi kỳ hạn ngắn. Phép thử giả định tiền và tương đương khả dụng toàn bộ. Khi một phần không khả dụng, ngưỡng tăng tương ứng. Các phép thử chưa cộng dòng tiền hoạt động hoặc nguồn vay mới. FCF âm bán niên và 9T dùng để nhận diện rủi ro chuyển đổi tiền. Cộng toàn bộ FCF âm vào bảng đã tách lãi và thuê có nguy cơ đếm trùng.

**Disposition: Stage 0 PENDING — RISK POLICY REVIEW, hard veto PENDING.** Số liệu chứng minh có khả năng bao phủ trên số ghi sổ ở cuối cửa sổ nếu đủ tiền gửi được dùng. Chưa có căn cứ xác nhận khớp tại mốc đáo hạn trọng yếu. Chênh lệch đổi dấu ở ngưỡng khoảng một nửa tiền gửi khi tính lãi ước tính và cổ tức. Dữ kiện có thể đóng phần còn mở là bảng theo nhóm kỳ hạn cho số tiền khả dụng và nghĩa vụ tương ứng, hoặc xác nhận hạn mức cam kết chưa rút đủ bù chênh lệch ở các mốc thiếu. Chỉ cần chi tiết đủ để kết luận, không yêu cầu lịch từng hợp đồng nếu các nhóm đã đủ. Căn cứ chưa hỗ trợ chuyển sang ACTIVE. [Risk Policy §11.3](../../../../../01%20SYSTEM/RISK_POLICY_v1.0.md)
