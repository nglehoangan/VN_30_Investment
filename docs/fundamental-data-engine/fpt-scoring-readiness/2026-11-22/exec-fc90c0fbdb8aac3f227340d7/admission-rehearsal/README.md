# Kiểm thử tiếp nhận dữ kiện FPT trên SQLite cô lập

Đã ánh xạ 9 dữ kiện BCTC hợp nhất Q3/2026 qua adapter hiện có. Bộ kiểm thử ghi và đọc lại đủ 9 giá trị trong bảng tạm trên bản sao SQLite, xác nhận chạy lại không tạo dòng trùng và từ chối dữ kiện sai mã, sai giá trị, sai phạm vi hoặc sau ngày chốt. Ngày 15/11/2026 được dùng cho lần kiểm thử này. [Kết quả](RESULT.json)

Luồng tiếp nhận chính thức trả về `CURRENT_CATALOG_NOT_BOUND`. Registry V6 chưa đăng ký catalog ánh xạ FPT, và bước đọc lại qua trình đọc bộ dữ liệu trả về `NO_DATASET_BOUND`. Bản sao không có bản ghi tiếp nhận hay bộ dữ liệu FPT sau lần chạy. Hash SQLite chính được xác nhận giữ nguyên.

Một điều kiện tiếp nhận khác được xác định khi đọc mã nguồn. Luồng hiện tại kiểm tra tên tài liệu có nhãn “soát xét”. Tên gốc của BCTC hợp nhất Q3/2026 trong biên nhận Vietstock không có nhãn này. Cần áp dụng loại tài liệu đủ điều kiện theo quy tắc tiếp nhận hoặc cập nhật quy tắc có thẩm quyền nếu kỳ Q3 thuộc phạm vi được phép. Giữ nguyên tên tài liệu gốc.

Sau khi đăng ký catalog và xác định tài liệu đủ điều kiện, chạy lại tiếp nhận, tạo bộ dữ liệu với giá gốc và số cổ phiếu đủ điều kiện tại ngày chốt, rồi đọc lại qua luồng chính thức. Sau khi đọc thành công mới gắn bằng chứng từng rubric, kiểm tra phạm vi N/R và chạy `prepare`. Kết quả nghiên cứu hiện có được giữ trong hồ sơ bàn giao.

## Chạy lại từ thư mục gốc dự án

```sh
fpt_rehearsal_dir=$(mktemp -d /tmp/fpt-admission.XXXXXX)
sqlite3 -readonly data/vn30.sqlite ".backup '${fpt_rehearsal_dir}/isolated.sqlite'"
node --experimental-sqlite docs/fundamental-data-engine/fpt-scoring-readiness/2026-11-22/exec-fc90c0fbdb8aac3f227340d7/admission-rehearsal/replay.mjs "${fpt_rehearsal_dir}/isolated.sqlite"
```

## Kết quả sau khi đăng ký catalog

Registry V7 dành cho lần chạy cô lập đăng ký catalog FPT bán niên 2026 và giữ nguyên cổng tiếp nhận hiện có. Báo cáo hợp nhất bán niên kết thúc ngày 30/06/2026 có báo cáo soát xét tại trang PDF 7 và tên gốc Vietstock có “Soát xét”. PDF được khôi phục với SHA-256 trùng biên nhận đã lưu. Các dữ kiện dùng cột 30/06/2026 hoặc lũy kế 01/01–30/06/2026 trên các trang 8, 10, 12 và 13. [Biên nhận và dữ kiện](FPT_H1_REVIEWED_CELLS.json)

Luồng chính thức `CurrentFinancialAdmissions.ingest` và `consume` đã ghi và đọc lại đúng cả 9 dữ kiện trên bản sao SQLite. Nạp lại trả cùng ID. Bản SQLite chính giữ nguyên. Q3 tiếp tục giữ phân loại theo nguồn gốc. [Kết quả chạy lại](H1_RESULT.json)

Ngày chốt 15/11/2026 được giữ để so sánh với lần thử trước. Đây là Chủ nhật và trình ghép dữ liệu hiện yêu cầu ngày của giá gốc trùng ngày chốt. Dữ liệu CaféF FPT lưu trong dự án hiện kết thúc ngày 31/12/2025. Chưa ghép bộ dữ liệu định giá. Bước đó cần xác định phiên chốt có bằng chứng giá gốc và số cổ phiếu đủ điều kiện cùng ngày.

Dùng lệnh tạo bản sao ở trên và chạy `replay-h1.mjs` thay cho `replay.mjs` để kiểm thử lần đăng ký này.

## Ghép và đọc lại bộ dữ liệu tại phiên 13/11/2026

Đã tiếp nhận giá đóng cửa gốc của FPT qua luồng CaféF hiện có và đọc lại bộ dữ liệu trên SQLite cô lập. Bộ dữ liệu gồm 9 dữ kiện BCTC bán niên soát xét, giá 50.100 VND/cổ phiếu và 1.885.727.648 cổ phiếu lưu hành. Thuyết minh 22 của BCTC Q3, trang PDF 44, xác nhận số cổ phiếu tại 30/09. Nghị quyết ngày 06/10 xác nhận đợt tăng vốn có hiệu lực 30/09, đã nằm trong số dư gốc. Lịch Vietstock rà soát ghi một sự kiện cổ tức tiền mặt sau ngày chốt. Số cổ phiếu được chuyển tiếp theo tài liệu đã rà, với giới hạn phạm vi công bố ghi trong hồ sơ. [Kết quả đọc lại](FPT_CUTOFF_RESULT.json) · [Đối chiếu số cổ phiếu](FPT_CUTOFF_SHARE_REVIEW.json)

Lần chạy dùng `replay-cutoff.mjs` với một bản sao SQLite mới. Tệp host lịch sử được kiểm chứng đúng hash từ Git và chỉ hiện diện trong thư mục tạm. Không khôi phục tệp vào thư mục dự án. Phạm vi đọc lại là 9 dữ kiện đã đăng ký. Việc chứng nhận phạm vi M3, gắn bằng chứng rubric và chấm điểm thuộc cổng kế tiếp. [Kiểm tra cổng chấm điểm](FPT_CUTOFF_SCORING_CHECK.json)

## Bàn giao bằng chứng cho 23 rubric

[FPT_CUTOFF_RUBRIC_HANDOFF.json](FPT_CUTOFF_RUBRIC_HANDOFF.json) liên kết ID/hashes dữ kiện lưu trong SQLite cô lập và giá/số cổ phiếu với các rubric tương ứng. Cả 23 rubric đều có tài liệu nghiên cứu, danh sách chủ đề bắt buộc và trạng thái theo kỳ. Các dữ kiện bán niên hỗ trợ một phần các chủ đề. Điểm và trạng thái của cột FY2025 và 9T2026 giữ đúng phạm vi gốc.

N/R được biểu diễn trong mô hình chung khi thiếu bằng chứng hoặc đánh giá. Category chứa N/R và tổng điểm chính thức đều rỗng. Phạm vi N/R giới hạn để cấp kết quả chính thức cần phương pháp theo mã. Nhánh đang có trong scoring worker dành cho ACB. Hồ sơ ghi 5 N/R ở nền FY2025, 15 ở cột cập nhật 9T2026 và 0 N/R được phê duyệt theo một phương pháp giới hạn của FPT.

Bước kiểm tra dữ liệu cho scorer hiện yêu cầu lịch sử đã tiếp nhận và dư nợ đã chuẩn hóa. Adapter bổ sung hiện khóa lịch sử VNM, dùng ngữ cảnh ngành RETAIL và một số đầu vào Q3. Cần triển khai binding TECHNOLOGY của FPT theo cùng hợp đồng và xác nhận từng topic trước khi lập bản đánh giá chính thức. Điểm nghiên cứu và các ID từ bản sao chưa phải đầu vào được cổng chính thức công nhận. [Kết quả prepare chẩn đoán](FPT_CUTOFF_PREPARE_DIAGNOSTIC.json)

## Đầu vào dành cho binding TECHNOLOGY

[FPT_TECHNOLOGY_INPUTS.json](FPT_TECHNOLOGY_INPUTS.json) đã đối chiếu đủ 88 dữ kiện có trạng thái qualified trong bản ghi tiếp nhận lịch sử FPT `reviewed-vn30-20261019-FPT`, bao gồm bốn cửa sổ FY2022–FY2025. Tệp giữ ID/hash bản ghi lịch sử và ID bộ dữ liệu tại phiên 13/11/2026.

Bộ kiểm tra nợ hiện hành chấp nhận `REPORTED_BORROWINGS` với ngành TECHNOLOGY và giá trị 18.449.527.497.052 VND tại 30/06/2026. Thuyết minh 24 ghi 1.003.635.638.154 VND nợ dài hạn đến hạn đã nằm trong vay ngắn hạn. Hai cấu phần thuê tài chính đã nằm trong vay ngắn và dài hạn tương ứng. Biên nhận giữ phạm vi dư nợ báo cáo. Kiểm thử từ chối mã sai và giá trị vay ngắn hạn bị thay đổi.

Đã đối chiếu danh sách chủ đề chính xác của 23 rubric với phương pháp đang chạy và kiểm tra hash tài liệu nghiên cứu. Giá 50.100 VND là dữ kiện ứng viên cho topic `VAL-PRIMARY.price`. Các topic formal vẫn đang mở. Script `replay-technology-inputs.mjs` đọc bản sao SQLite ở chế độ chỉ đọc. Kết quả là hồ sơ đầu vào dành cho binding, chưa đăng ký adapter hay tạo reference của bộ chấm điểm.

## Kiểm thử adapter chuẩn bị hồ sơ TECHNOLOGY

[FPT_TECHNOLOGY_PREPARE_CANDIDATE.json](FPT_TECHNOLOGY_PREPARE_CANDIDATE.json) ghim adapter, đầu vào và mã bộ dữ liệu đúng phạm vi FPT tại 13/11/2026. Adapter kiểm tra hash, đọc dữ kiện từ SQLite, chạy lại phép kiểm tra dư nợ, đối chiếu lịch sử và danh sách topic. Kiểm thử từ chối ticker khác, cutoff khác và hash đầu vào sai. [Kết quả chạy lại](FPT_TECHNOLOGY_ADAPTER_REPLAY.json)

Đây là adapter chuẩn bị hồ sơ, gọi bằng `replay-adapter.mjs` trên bản SQLite cô lập đã có đúng bộ dữ liệu. Hồ sơ ứng viên chưa có reference `CurrentPurposeScoringConsumer`, bản đánh giá chủ đề chính thức hay các biên bản review cần để chạy `prepare`. Registry dùng cho chấm điểm chính thức không thay đổi.

## Một hồ sơ cho lần chuẩn bị tiếp theo

[FPT_PREPARE_WORKPACK.json](FPT_PREPARE_WORKPACK.json) đối chiếu 83 chủ đề của 23 rubric. Hồ sơ ghi 1 ứng viên từ bộ dữ liệu, 71 chủ đề có căn cứ nghiên cứu cần luận giải chính thức, và 11 khoảng trống trọng yếu. Mỗi dòng ghi dữ kiện hoặc phần còn thiếu và đường dẫn đã kiểm tra hash. Trạng thái này là đánh giá mức sẵn sàng của bằng chứng, chưa gán điểm hoặc chấp nhận topic chính thức.

Bản ghi quyền thực thi current-purpose dùng trong lần VNM đã được đối chiếu để xem khả năng tái sử dụng. Trong 24 tệp được ghim, 4 tệp có hash khác và 1 tệp đã bị xoá. Hồ sơ ghi chính xác các tệp và hash. Quyền thực thi phải được ràng buộc với phiên bản thực tế. Quyền chạy điểm theo mã chỉ xác định được sau khi `prepare` tạo hash. Hồ sơ đã ghi thêm các cổng reference, assessment, M1 và review với điều kiện cụ thể.

## Binding FPT đọc lại qua CurrentPurposeScoringConsumer

[FPT_SCORING_CONSUMER_READBACK.json](FPT_SCORING_CONSUMER_READBACK.json) lưu reference, ID biên nhận tiếp nhận và mã bộ dữ liệu gốc. Adapter FPT tạo bản ghi enrichment trên bản SQLite cô lập. Consumer dùng chính reference này để đọc 9 dữ kiện hiện hành, 1 dữ kiện dư nợ báo cáo đủ điều kiện và 88 dữ kiện lịch sử. Rehearsal dùng lại bảng và xác thực của consumer hiện có.

Kiểm thử gồm replay trên bản sao SQLite mới với đúng đồng hồ đã lưu, gọi lặp có cùng ID và đúng một biên nhận, từ chối sai hash reference, ticker và ngày chốt. Kết quả lần chạy trên bản sao mới trùng từng byte với biên nhận đã lưu. SQLite chính giữ nguyên.

Để tái lập, tạo bản sao rồi chạy `replay-cutoff.mjs <bản sao> --replay-retained-clock` và `replay-scoring-consumer.mjs <bản sao>` từ thư mục gốc. Thay đổi ở consumer dùng các kiểu giao diện tối thiểu cho các dependency đọc dữ liệu để nhận adapter FPT. Hash tệp consumer đã đổi và được ghi lại trong biên nhận. Phiên bản thực thi chính thức phải ghim hash mới. Kiểm tra TypeScript toàn dự án còn lỗi ở module ACB và ba import script đã thiếu. Hai tệp sửa cho tích hợp FPT không xuất hiện trong chẩn đoán TypeScript.
