# B1 — đối chiếu nguồn công khai và snapshot mở đầu

Ngày kiểm tra: 28/10/2026. **Hoàn thành đối chiếu kỹ thuật 11/11 mã; chưa phải chấp thuận độc lập B1 cho production.**

Đã đọc trực tiếp SQLite ở chế độ read-only; kiểm tra SHA-256 snapshot và các phản hồi TCBS lịch sử; truy cập nguồn VSDC công khai. Không lấy số lượng bằng nhau làm căn cứ tạo danh tính. Ticker/ISIN và loại/sàn được kiểm tra trước; số lượng chỉ là phép đối chiếu sau đó.

| Mã | ISIN | Sàn / loại | SL 08/10 | SL 26/10 | Nguồn VSDC |
|---|---|---|---:|---:|---|
| FPT | VN000000FPT1 | HOSE / phổ thông | 220 | 220 | [Nguồn](https://vsd.vn/en/ad/167378) |
| GAS | VN000000GAS3 | HOSE / phổ thông | 200 | 200 | [Nguồn](https://vsdc.vn/vi/ad/187620) |
| HPG | VN000000HPG4 | HOSE / phổ thông | 110 | 110 | [Nguồn](https://vsdc.vn/en/ad/185065) |
| MBB | VN000000MBB5 | HOSE / phổ thông | 100 | 100 | [Nguồn](https://vsdc.vn/en/ad/180865) |
| MWG | VN000000MWG0 | HOSE / phổ thông | 100 | 100 | [Nguồn](https://vsdc.vn/en/ad/182174) |
| SSI | VN000000SSI1 | HOSE / phổ thông | 240 | 240 | [Nguồn](https://web.vsd.vn/vi/ad/76449) |
| TCB | VN000000TCB8 | HOSE / phổ thông | 100 | 100 | [Nguồn](https://www.vsd.vn/ad/139291) |
| VCB | VN000000VCB4 | HOSE / phổ thông | 100 | 100 | [Nguồn](https://vsdc.vn/vi/ad/181754) |
| VHM | VN000000VHM0 | HOSE / phổ thông | 200 | 200 | [Nguồn](https://vsd.vn/vi/ad/168428) |
| VPL | VN000000VPL5 | HOSE / phổ thông | 100 | 100 | [Nguồn](https://vsdc.vn/vi/ad/182576) |
| VRE | VN000000VRE6 | HOSE / phổ thông | 100 | 100 | [Nguồn](https://vsdc.vn/vi/ad/168328) |

## Liên kết lịch sử

Snapshot gốc có hash hợp lệ, receivedAt `2026-10-08T11:38:01.705Z`, holdingsAsOf `2026-10-08T11:38:01.650Z`. Mỗi dòng có JSON Pointer, liên kết source của bút toán mở đầu và các phản hồi TCBS lịch sử đã kiểm hash trong LINKAGE_REVIEW.json. Bút toán FPT gộp 220, nhưng snapshot gốc giữ 200 giao dịch + 20 chưa khả dụng. Không sửa bút toán hoặc coi cả 220 được giao dịch.

Sao kê 26/10 có FPT 200 giao dịch + FPT_WFT 20 chờ giao dịch. Chủ tài khoản xác nhận 20 là cổ phiếu thưởng đang sở hữu, chưa giao dịch; chưa có ngày chuyển giao dịch. Ghi nhận làm rõ này riêng, không cộng thêm 20 và không áp ngày chuyển giả định. VPL dùng thông báo VSDC chuyển sang HOSE hiệu lực 09/05/2025; không dùng hoán đổi năm 2011 để chứng minh vị thế hiện tại.

## Trạng thái B1 và phần còn thiếu

Đã giải quyết phần tra cứu ISIN/mã TCBS/sàn/loại của 11 mã và truy xuất liên kết nội bộ về snapshot 08/10. Không cần yêu cầu chủ tài khoản xin lại các mã này. Các nguồn công khai được đọc ngày 28/10, không gán thành hệ thống đã biết ngày 08/10.

B1 chính thức vẫn mở theo hợp đồng hiện hành: chưa có chứng cứ xác thực độc lập về account/subaccount/phạm vi, liên kết account→instrument và lịch sử liên tục trong khoảng 08–23/10, cùng quyết định reviewer đúng phạm vi. Hai mốc số lượng khớp nhau không chứng minh không có giao dịch giữa kỳ. Không coi báo cáo này là thay đổi chính sách hoặc chấp thuận độc lập.

Không đổi DB, source seals, runtime adapter, NAV, scoring hoặc release. B2–B7 không thay đổi. Không lưu số tài khoản/CCCD/tên chủ tài khoản/đường dẫn riêng tư trong gói này.
