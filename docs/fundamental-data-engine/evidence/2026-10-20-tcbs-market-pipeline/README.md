# TCBS VN30 market pipeline — technical candidate

Đã nối capture thực → raw inventory → lossless normalization → capability → initialization → market snapshot → exact replay → immutable candidate → web readiness. Đây là kết quả kỹ thuật chờ independent acceptance, không phải DI14/DI15 approval.

- Chạy: `node api/tcbs-market-pipeline.mjs --refresh`; hướng dẫn và chế độ offline tại [api/README.md](../../../../api/README.md).
- Nguồn thực: đủ 30 mã, metadata 5.11/nến ngày 5.13; bảng 5.3 đối chiếu đúng ngày. Bản chụp preopen 20/10 không có `matchPrice` được giữ raw và bị từ chối làm giá đóng cửa. Ứng viên hiện tại dùng bảng hoàn tất ngày 19/10 được chỉ định rõ, không tự thay bằng refPrice hoặc zero.
- Hợp đồng EOD valuation, VND/share, multiplier1; chỉ latest completed close khớp board. Không khẳng định lịch sử điều chỉnh hoặc execution readiness. HTTP Date không được coi là quote event time.
- Chính sách thời gian: HOSE 2026, cuối tuần/ngày nghỉ cụ thể; mốc hoàn tất bảo thủ 15:00 giờ Việt Nam. EOD valuation dùng phiên gần nhất đến trước mốc hoàn tất phiên kế tiếp. Ngoài lịch đã xác thực bị chặn. Đây là policy candidate chờ review, không phải mặc định pháp lý.
- Initialization bind retained universe/security/sector master, 30 canonical financial runs, release/29–1 partition và ngoại lệ TCX. Không cần giá còn tươi để replay capability/initialization lịch sử. Market freshness được kiểm tra riêng tại thời điểm sử dụng.
- MBB vẫn deferred; TCX analytical exception ACTIVE. Không sửa accounting, scoring, ranking, Top10, quyết định hoặc production schema.
- `PIPELINE_RESULT.json`: hashes, nguồn, số mã và gate candidates; `validation/`: kết quả kiểm tra; `ARTIFACT_HASHES.json`: seal của gói review. Raw riêng tư nằm trong data, không đóng gói credentials/token.

Nguồn chính thức cho lịch/chính sách:
- [HOSE lịch nghỉ 2026](https://www.hsx.vn/vi/tin-tuc/hose-thong-bao-lich-nghi-giao-dich-nam-2026/2437411).
- [HOSE hướng dẫn giao dịch 02/2026](https://staticfile.hsx.vn/Uploads/UploadDocuments/2453338/HTGD_Quy%20dinh%20can%20biet%20khi%20GDCK%20tren%20HOSE_T2.2026.pdf).
- [TCBS securities-info](https://developers.tcbs.com.vn/docs/v1.0.0/stock/securities-info/), [TCBS daily bars](https://developers.tcbs.com.vn/docs/v1.0.0/stock/bars-long-term/).
