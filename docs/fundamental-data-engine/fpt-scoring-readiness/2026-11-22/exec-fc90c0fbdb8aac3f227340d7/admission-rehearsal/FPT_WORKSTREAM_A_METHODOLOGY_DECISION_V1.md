# FPT Workstream A · quyết định phương pháp v1

**PASS_WITH_LIMITATIONS** · TECHNOLOGY · chốt kinh tế 13/11/2026 · đề xuất chưa hiệu lực.

| Phạm vi | Có điểm | Điểm / trọng số đã chấm | N/R |
|---|---:|---:|---:|
| V8 chính thức | 2/23 | 5/10 | 21 |
| Ứng viên đạt xác thực cấu trúc theo phương pháp hiện hành | 3/23 | 5/12 | 20 |
| Mô phỏng RESEARCH_ONLY nếu chấp nhận quy tắc H1 | 4/23 | 8/17 | 19 |

Ứng viên hiện hành giữ BQ-MOAT 3/6, IC-IND 2/4 và RG-UNC 0/2 bảo thủ. Điểm 0 dựa vào biên độ bất định đã phản biện. Danh sách ứng viên chưa có quyền chấm chính thức kế nhiệm. Mô phỏng thêm GQ-HIST 3/5, phụ thuộc phê duyệt H1 và kiểm chứng nguồn đến từng cặp EPS trong bộ kế nhiệm. 14 mục từng có điểm FY2025 vẫn không đủ căn cứ hiện hành ngay cả khi giả lập H1. Năm mục đã N/R ở FY2025 cũng giữ nguyên. Không tính điểm /100.

## Phạm vi kiểm tra

Dùng [bảng lịch sử và nguồn FY2025](../FPT_23_RUBRIC_FY2025_RESEARCH_SCORECARD.md), [chủ đề và chứng cứ đã lưu](FPT_PREPARE_WORKPACK.json), [cầu nối FTEL](../FPT_BQ_EQ_INVESTED_CAPITAL_BRIDGE_2026-11-23.md), [các phép thử định giá hiện hành](FPT_SEGM_V11_RECOVERY.md) và [ma trận Workstream A](FPT_WORKSTREAM_A_RECONCILIATION.md). Đối chiếu topic và band với M3, registry `src/domain/scoring/methodology.ts`, điều kiện hành động doanh nghiệp §3A.6 và nguyên tắc tương đương ngành §18. Chưa thấy lỗi đọc caption, đơn vị, kỳ hoặc giá trị khiến điểm bị mất. Bằng chứng 9T công bố trước mốc kinh tế, nhưng dùng đối chiếu nghiên cứu nếu nằm ngoài bộ dữ liệu V8. Hồ sơ hiện hành dùng chứng cứ CURRENT_ONLY với đồng hồ tiếp nhận giữ nguyên. Không đủ căn cứ cấp Historical PIT.

## H1 · Điều chỉnh có phạm vi cho GQ-HIST

**Đề xuất văn bản.** Với rubric GQ-HIST, kiểm tra khả năng so sánh ở chính chuỗi lịch sử dùng để chấm. Khi có thay đổi phạm vi hợp nhất trọng yếu sau chuỗi, cho phép dùng chuỗi đã kiểm chứng đến kỳ cuối cùng đồng nhất nếu chuỗi có ít nhất ba năm tăng trưởng, từng cặp EPS do doanh nghiệp điều chỉnh quyền hoặc được đối chiếu từ sự kiện đã được xác minh, và có đối chiếu doanh thu, lợi nhuận và chất lượng dòng tiền cùng phạm vi. Ghi rõ ngày cuối chuỗi và kết quả rà sự kiện sau chuỗi. Tách M&A trọng yếu nếu định lượng được. Nếu chưa tách được, chỉ chọn band được bảo vệ sau khi xét tín hiệu phản chứng, không kết luận tăng trưởng hữu cơ. Nếu chứng cứ sau chuỗi phủ định luận điểm kinh tế hoặc hai band còn khả dĩ sau phản biện, giữ N/R thay vì tự động chuyển điểm. Phân loại đề xuất là thẩm định lịch sử tại ngày chốt, không dùng để suy tăng trưởng EPS sau thay đổi phạm vi.

**Ràng buộc thực thi nếu duyệt.** Thay kiểm tra toàn hồ sơ bằng phán quyết đủ điều kiện gắn với **GQ-HIST**, hash chuỗi, bằng chứng điều chỉnh và sự kiện FTEL. Không đổi flag toàn cục hoặc áp phán quyết này cho CA-PSV, định giá, phân phối, pha loãng hay M1. Giữ số điểm và band M3 hiện hành. Không tạo đường chấm lịch sử PIT nếu thiếu receipt. Xác minh thực tế trước khi trình thay đổi executable.

**Mô phỏng.** Các cặp EPS 4.661/3.847, 4.944/4.052 và 5.216/4.292 cho CAGR **21,57%**. Bỏ cặp đầu hoặc cuối cho **21,77%** và **21,59%**. Các số hợp nhất FY2022–25 cho CAGR doanh thu **16,79%** và LNST cổ đông mẹ **20,87%**. FCF giảm từ **8,43** xuống **5,04 nghìn tỷ VND** trong FY2025, mua lại chưa bóc đủ, và FCF 9T2026 âm khi FTEL đổi phạm vi. Những phản chứng này giới hạn band ở **Moderate value-creating trend, 3/5** trong mô phỏng. Biến động cửa sổ EPS chỉ kiểm tra hiệu ứng chọn kỳ và không xử lý ảnh hưởng M&A. CIO phải yêu cầu kiểm chứng từng cặp nguồn và đánh giá phản chứng trước khi ứng viên có thể chuyển sang hồ sơ chính thức.

## H2 · Tiêu chuẩn tối thiểu và điều kiện đưa vào hồ sơ

**Đề xuất văn bản.** Mỗi topic có thể dùng chứng cứ trực tiếp hoặc phép đo tương đương được phương pháp ngành cho phép khi có mô tả đại lượng kinh tế, cùng kỳ và phạm vi, sai lệch còn lại, nguồn gốc và phản chứng. Chấp nhận chứng cứ bất lợi cho chính topic đó nếu phản ánh được đại lượng cần đo. Chỉ chốt điểm bảo thủ ở đáy band thấp nhất còn được chứng cứ ủng hộ sau kiểm tra band liền kề. Nếu một topic có thể làm đổi band nhưng chưa được xác lập, giữ N/R. Không đòi một tài liệu duy nhất, không coi thiếu thông tin là bằng chứng cho mức thấp, và không dùng tương đương để thay giá, số cổ phiếu, dòng tiền chuẩn hóa hay bằng chứng veto bắt buộc. Bảng dưới định nghĩa phép kiểm cụ thể và điều kiện N/R. H2 làm rõ cách áp dụng §18, chưa đủ để thêm bất kỳ điểm nào trong mô phỏng FPT.

**Điều kiện chuyển hồ sơ.** Phải khóa theo đúng mã, ngày chốt kinh tế, đồng hồ kiến thức, các nguồn và ngày công bố, phương pháp/phạm vi đã duyệt, dataset, executable và đánh giá topic. Hai biên bản chuẩn bị và phản biện được chấp nhận theo đúng hash. Quyền thực thi chấm và quyền công bố được xác nhận riêng. Không phá V8, thay đổi chuẩn PIT, đổi band/trọng số hoặc mở cổng quyết định bằng điểm nghiên cứu.

## Ma trận 15 rubric từng có điểm FY2025 chưa qua Workstream A

Cột cuối ghi kiểm thử phản chứng, độ ổn định band và điều kiện N/R. Điểm sau dấu mũi tên là **mô phỏng**. Riêng GQ-HIST thuộc H1, các dòng khác áp dụng H2 hoặc giữ nguyên quy tắc trực tiếp đã có.

| Rubric, điểm FY25 | Nguyên lý và band M3 | Bằng chứng trực tiếp tối thiểu và đối chiếu tương đương đề xuất | Phản chứng, độ nhạy và kết luận |
|---|---|---|---|
| BQ-EQ 5 | Tạo giá trị trên vốn · Good economics | NOPAT và vốn vận hành bình quân cùng phạm vi so với chi phí vốn; cầu nối hai vế vốn tài trợ và vốn vận hành khi từng điều chỉnh có căn cứ. | Thử phân loại tiền gửi, thuế và mức vốn lưu động mở kỳ chưa tách. Không đủ cận cho số dư nội bộ FTEL, nên band lịch sử chưa chuyển được → N/R. |
| BQ-CASH 3 | Chuyển lợi nhuận thành tiền · Adequate realization with material qualifications | Cầu nối CFO với lợi nhuận, vốn lưu động, khoản một lần, vốn hóa và chi tiền đầu tư; dùng nhiều quý cùng phạm vi thay một FY khi có bao phủ mùa vụ. | CFO/FCF FY dương, FCF bán niên/9T âm; phải thử chu kỳ thu tiền và capex duy trì. Cầu nối chưa đủ → N/R. |
| BQ-RES 3 | Chịu sốc vận hành · Balanced resilience | Doanh thu tập trung và phản ứng của biên/giá khi sốc; biên theo mảng qua sự kiện cầu hoặc lương đã định lượng là phép đo tương đương. | Biên IT ổn định chưa tách mix, giữ giá và sốc; biên có thể ổn do cơ cấu hoặc dự án. Thiếu phép thử phân biệt → N/R. |
| FH-BS 3 | Đệm bảng cân đối · Adequate | Vốn, dư nợ/thuê, dự phòng/tuổi nợ và nguồn tài trợ cùng kỳ; kiểm tra thu hồi sau kỳ hoặc dự phòng và chất lượng đối tác có thể bổ trợ. | Thử loại tiền hạn chế và tăng khấu trừ phải thu. H1 có nợ và phải thu tổng, còn thiếu nối vốn và chất lượng phải thu cùng kỳ được tiếp nhận → N/R. |
| FH-LIQ 2 | Đáp ứng nghĩa vụ đúng hạn · Adequate with material refinancing dependence | Bao phủ nghĩa vụ gốc/lãi và chi bắt buộc theo các mốc có nguy cơ thiếu hụt; dùng cận thấp dòng tiền hoặc hạn mức cam kết rút kịp thay lịch từng khoản nếu đủ bao phủ. | Thử haircut và chậm thu; 25%/50% tiền gửi khả dụng cho hai dấu trong thử nghiệm hiện tại. Không có cận đủ dùng → N/R. |
| GQ-HIST 3 | Chất lượng tăng trưởng lịch sử · Moderate value-creating trend | Chuỗi tăng trưởng và EPS điều chỉnh theo cặp cùng cơ sở; H1 cho phép đánh giá cửa sổ trước FTEL cùng rà soát sự kiện mới. | Độ nhạy cửa sổ và FCF giảm đã kiểm. Quy tắc hiện tại vẫn thiếu comparability rộng hơn → mô phỏng **3/5** theo H1. |
| GQ-FWD 3 | Độ nhìn thấy tăng trưởng tương lai · Moderate visibility | Đơn hàng/doanh thu, suất sinh lời triển khai, nguồn vốn và tiến độ; đoàn hệ hợp đồng đã thực hiện cùng dữ liệu nhân sự/tài trợ có thể thay dự báo đầy đủ. | Thử tỷ lệ chuyển đổi và chậm triển khai khi CFO yếu. Đơn hàng tăng chưa chốt khả năng giao và tài trợ → N/R. |
| IC-POS 2 | Vị thế cạnh tranh · Competitive | Thị phần, chi phí tương đối và phân phối cùng phân khúc; dữ liệu thắng/gia hạn hợp đồng với mẫu rõ cùng năng suất giao hàng là phương án tương đương. | Thử đổi mẫu số và mix dịch vụ. Khách lớn hoặc hiện diện địa lý thiếu mẫu chuẩn về vị thế/chi phí → N/R. |
| IC-CYCLE 1 | Bất đối xứng chu kỳ · Balanced normalized forward asymmetry | Nhu cầu và khả năng chịu đựng theo chu kỳ; đơn hàng hoãn/hủy, công suất và biên trong một giai đoạn giảm cầu có thể thay số chu kỳ ngành rộng. | Tăng trưởng IT quốc tế giảm tốc; cần lượng hóa phản ứng lợi nhuận, công suất và sức chịu tài trợ → N/R. |
| VAL-RET 2 | Lợi suất 5 năm · 8% to below 12% | Giá và cổ phiếu ngày chốt, mẫu số chuẩn hóa, tăng trưởng, phân phối, pha loãng và giá thoát. Dùng mô hình dòng tiền trên mỗi cổ phiếu hoặc EPS tương đương có chuẩn hóa. | Thử trường hợp suy giảm, chi trả thấp, pha loãng và bội số thoát. IRR 11% thuộc phép thử FY2025 trên giá cũ; 2026 thiếu mẫu số đủ điều kiện → N/R. |
| VAL-MOS 1 | Bất đối xứng giá trị bảo thủ · Thin/meaningful downside | Giá trị bảo thủ trên cùng cơ sở cổ phiếu, kịch bản xấu, bảng cân đối; cho phép biên an toàn qua nhiều cách định giá khi chung mẫu số chuẩn hóa. | Dải chuyển đổi tiền và tài trợ cho cả hai phía so với giá. Dải minh họa chưa tạo được một giá trị bảo thủ đã phản biện → N/R. |
| RG-GOV 3 | Bảo vệ cổ đông và chất lượng giám sát · Generally sound | Công bố, giao dịch liên quan, cổ đông thiểu số và kiểm toán; đối chiếu hồ sơ giám sát thực tế theo giao dịch với nghị quyết/biên bản quyền biểu quyết. | Thử giao dịch trọng yếu có xung đột hoặc điều khoản chưa rõ. Công bố có thật nhưng việc xử lý và tác động thiểu số chưa được gắn đủ → N/R. |
| RG-RISK 2 | Rủi ro còn lại sau giảm thiểu · ELEVATED_CONTROLLED | Xác định rủi ro, biện pháp thực tế, hiệu quả, kênh riêng và kết luận M1 khớp; hedge/giảm thiểu đã đối chiếu kỳ hạn có thể cung cấp phép đo theo từng kênh. | Thử FX, nhân lực và công nghệ riêng; hedge lịch sử chưa chứng minh hiệu lực hiện hành, M1 chưa có kết luận residual risk phù hợp → N/R. |
| CA-DIST 1 | Phân phối bền vững sau tái đầu tư · Disciplined distribution/retention | Dòng tiền cấp mẹ, nhu cầu tái đầu tư, phân phối/mua lại nếu có và sức chống chịu; cầu EBITDA/CFO hợp nhất chỉ dùng khi chứng minh khả năng chuyển tiền đến cấp mẹ. | Thử giảm nguồn chuyển tiền FTEL trong khi phải giữ vốn và trả nợ. BCTC riêng FY2025 chưa bảo vệ band hiện hành → N/R. |
| CA-PSV 1 | Tăng giá trị thực trên mỗi cổ phiếu · Real per-share compounding | EPS hoặc dòng tiền trên cổ phiếu đã điều chỉnh quyền, chu kỳ và thay đổi phạm vi; hai thước đo độc lập cùng basis giúp chống lệch một kỳ. | EPS lịch sử tăng nhưng thiếu chuỗi kinh tế trên mỗi cổ phiếu sau FTEL và kiểm chứng toàn chu kỳ. H1 không mở điều kiện điểm tối đa → N/R. |

## Quyết định CIO và tác động VN30

1. Duyệt hoặc bác H1 cho thử nghiệm một mã FPT ở ngày 13/11/2026. Nếu duyệt, chỉ áp sau khi khóa chứng cứ từng cặp EPS, phản chứng M&A/dòng tiền, rollback và regression trên cả trường hợp có và thiếu điều chỉnh quyền. Sau đó trình đúng hash của phương pháp/executable và assessment kế nhiệm.
2. Duyệt hoặc bác H2 như checklist đánh giá, giữ điều kiện §18 và M3. Các phép tương đương trong ma trận là tiêu chí xét bằng chứng, chưa là giấy phép dùng proxy chưa được thẩm định.
3. Giữ phạm vi V8 đang có trong khi chưa có quyền kế nhiệm. Quyền publication là quyết định riêng. Workstream B nằm ngoài hồ sơ này.

Không có thay đổi hiệu lực cho mã VN30 nào. Nếu sau này dùng H1 ngoài FPT, phải đánh giá tác động cho từng mã có đứt chuỗi hợp nhất/corporate action. Không dùng dữ liệu hay phán quyết FPT cho mã khác. Hồ sơ BANK, RETAIL và các ngành khác vẫn áp dụng quy tắc riêng. Cần hồi quy scorecard đã duyệt và các trường hợp action-affected trước khi mở rộng.

## Regression và readback

- Chạy lại EBCS trên input Workstream A được khóa, kết quả RESEARCH_ONLY, 3/23, 5/12 và full score null. Tái tính mô phỏng H1 độc lập từ ba cặp EPS trên. Mô phỏng là đánh giá điều kiện và độ nhạy, chưa chạy qua executable được phê duyệt.
- 32 test Python và 209 test TypeScript đạt. Current parity và git diff --check đạt.
- SQLite mở chỉ đọc xác nhận đúng một bản FPT và hash thân V8 `4eed8f0bf117e332fb56855df7702f1026182120e04f2f91bacc3880fe446b20`. Không có bản ghi ứng viên kế nhiệm. Baseline V8, quy tắc production và quyền công bố không được sửa. Tệp này là deliverable duy nhất, chưa commit.
