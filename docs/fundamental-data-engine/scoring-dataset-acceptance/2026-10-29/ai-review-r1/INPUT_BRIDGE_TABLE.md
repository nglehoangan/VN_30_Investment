# Bảng input/bridge theo mã

Đây là bảng chuẩn bị kiểm định, không phải ScoreInput/ScoringBridgePlan đã được runtime chấp nhận. Các file theo mã giữ đủ fact ID, kỳ, scope, value, source hash, PDF links, metric operands và 23 rubric/topic slots. Nhận định và điểm chưa thực hiện được giữ null.

| Mã | Ngành | Nhóm cần đối chiếu | Có canonical hợp nhất | Có canonical standalone | Nợ cần qualification | Input chưa xác nhận | Scope trang đã xem | Đơn vị trang đã xem |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| [ACB](tickers/ACB.json) | BANK | 35 | 35 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [BID](tickers/BID.json) | BANK | 35 | 35 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [BSR](tickers/BSR.json) | ENERGY | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1 |
| [CTG](tickers/CTG.json) | BANK | 35 | 35 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [FPT](tickers/FPT.json) | TECHNOLOGY | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1 |
| [GAS](tickers/GAS.json) | UTILITIES | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1 |
| [GVR](tickers/GVR.json) | MATERIALS | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1 |
| [HDB](tickers/HDB.json) | BANK | 35 | 35 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [HPG](tickers/HPG.json) | MATERIALS | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1 |
| [LPB](tickers/LPB.json) | BANK | 35 | 0 | 35 | 0 | 0 | Chưa rõ | VND × 1000000 |
| [MBB](tickers/MBB.json) | BANK | 35 | 34 | 0 | 0 | 1 | CONSOLIDATED | VND × 1000000 |
| [MCH](tickers/MCH.json) | RETAIL | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1 |
| [MSN](tickers/MSN.json) | RETAIL | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [MWG](tickers/MWG.json) | RETAIL | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1 |
| [SAB](tickers/SAB.json) | RETAIL | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1 |
| [SHB](tickers/SHB.json) | BANK | 35 | 35 | 0 | 0 | 0 | SEPARATE_STANDALONE | VND × 1000000 |
| [SSB](tickers/SSB.json) | BANK | 35 | 35 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [SSI](tickers/SSI.json) | SECURITIES | 30 | 30 | 0 | 0 | 0 | CONSOLIDATED | VND × 1 |
| [STB](tickers/STB.json) | BANK | 35 | 35 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [TCB](tickers/TCB.json) | BANK | 35 | 35 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [TCX](tickers/TCX.json) | SECURITIES | 30 | 0 | 30 | 0 | 0 | Chưa rõ | VND × 1 |
| [VCB](tickers/VCB.json) | BANK | 35 | 35 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [VHM](tickers/VHM.json) | REAL_ESTATE | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [VIB](tickers/VIB.json) | BANK | 35 | 35 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [VIC](tickers/VIC.json) | REAL_ESTATE | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [VJC](tickers/VJC.json) | INDUSTRIAL | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1 |
| [VNM](tickers/VNM.json) | RETAIL | 40 | 37 | 0 | 3 | 0 | CONSOLIDATED | VND × 1 |
| [VPB](tickers/VPB.json) | BANK | 35 | 35 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [VPL](tickers/VPL.json) | REAL_ESTATE | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |
| [VRE](tickers/VRE.json) | REAL_ESTATE | 40 | 40 | 0 | 0 | 0 | CONSOLIDATED | VND × 1000000 |

Các con số là nhóm chỉ tiêu × kỳ trong bộ chuẩn bị, không phải số mã đã đạt scoring. Scope/đơn vị xác nhận chỉ áp dụng đúng PDF/page đã ghi trong visual-review.json. Riêng SSI và TCX, trang đã xem là FY2024; không coi đó là xác nhận đủ báo cáo mới nhất.

65 nhóm standalone đã có số liệu, cần xử lý scope và bindings. Ba nhóm VNM cần qualification tổng vay/nợ trên các thành phần đã có. MBB cần CAR/CET1 đủ điều kiện cho 30/06/2026.

Các canonical facts của 23 mã còn có trường hợp chưa ghép được đúng hash nguồn PDF với corpus giữ lại. Danh sách nằm trong input-gap-reconciliation.json; tra các cột nguồn tương ứng trước khi quyết định cần tải lại tài liệu. Không yêu cầu chủ dự án nhập lại số tiền.
