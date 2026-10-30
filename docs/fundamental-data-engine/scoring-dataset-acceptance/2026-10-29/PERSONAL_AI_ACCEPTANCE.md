# Nghiệm thu bằng ChatGPT cho dự án cá nhân

Chủ dự án yêu cầu dùng ChatGPT nghiệm thu, không có người nghiệm thu độc lập. Quy trình mới là **OWNER_AUTHORIZED_AI_SELF_REVIEW**. Đây là thay đổi cách review, không tự chấp thuận tính đúng đắn của dữ liệu hay quyền scoring.

## Tiêu chí nghiệm thu

| Tiêu chí | Điều kiện để PASS |
| --- | --- |
| 1. Toàn vẹn nguồn | Hash nguồn và dữ liệu khớp, liên kết PDF/JSON Pointer mở được, lỗi tải không bị che |
| 2. Danh sách mã/ngành | Đủ 30 securityId duy nhất; có căn cứ hiệu lực danh sách và phân ngành; giữ mã deferred |
| 3. Phạm vi | Xác định đúng doanh nghiệp, hợp nhất/riêng, loại báo cáo và phiên bản từ trang nguồn liên quan |
| 4. Đơn vị | Có khai báo đơn vị/tiền tệ/hệ số; phân biệt EPS, tỷ lệ và số tiền; giữ zero/null/dash |
| 5. Kỳ báo cáo | Tách thời điểm, năm, quý, lũy kế, cột hiện tại/so sánh; không tự annualize hay trộn phạm vi |
| 6. Độ phủ đầu vào | Mỗi nhóm bắt buộc theo ngành có dữ kiện đúng định nghĩa/kỳ/phạm vi; anyOf vẫn là lựa chọn thay thế |
| 7. Point-in-time | Có bằng chứng thời điểm với độ chính xác được ghi rõ; không lùi ngày biết trước ngày nhận/nhập/review |
| 8. Thị trường | Giá đúng phiên/mục đích, định danh/đơn vị rõ, kiểm tra độ mới và cơ sở điều chỉnh; shares/market cap/EV theo mô hình |
| 9. Chỉ tiêu dẫn xuất | Tính lại bằng công thức và operands được ghim; không chia mẫu số không hợp lệ hoặc trộn kỳ/phạm vi |
| 10. Định giá | Mô hình theo ngành, giả định và các kịch bản rõ; ước tính được ghi là ước tính |
| 11. Nhận định chấm điểm | Đủ 23 rubric, luận cứ và phản chứng; không điền điểm trung tính để che thiếu dữ liệu; AI không được ghi là HUMAN |
| 12. Input/bridge | Mỗi đầu vào truy ngược tới nguồn; snapshot/assessment/derivation/methodology khớp; chạy được validator thật |
| 13. Lượt kiểm tra phản biện | Mở lại nguồn, thử bác bỏ kết luận lượt lập dữ liệu; ghi expected/actual, chạy cả tình huống sai nguồn/hash/kỳ/đơn vị |
| 14. Tái lập và lỗi | Hash/kết quả tái lập được; không còn Critical/Major ảnh hưởng mục đích xin nghiệm thu |
| 15. Biên bản AI | Ghi đúng hash dataset, thời điểm, công cụ/phiên review có thể xác minh và phạm vi cho phép |

PASS chỉ khi có bằng chứng cho tiêu chí đó. FAIL/BLOCKED vẫn giữ nguyên; các trường chưa biết không được thay bằng 0, một ngày giả định hoặc điểm mặc định. Nghiệm thu từng mã không tự cấp quyền cho mã khác.

## Hai lượt làm việc

1. **Lập dữ liệu:** xây snapshot review, policy, input/bridge và issue register; ghim nguồn và hash.
2. **Kiểm tra lại:** đọc lại PDF cần thiết và dùng chương trình kiểm định khác để đối chiếu nguồn, dimensions, công thức và bindings. Ghi riêng expected/actual và các phản chứng.

Cùng một ChatGPT thực hiện hai lượt vẫn là tự kiểm tra bằng AI. Không tạo tên người review giả, không gọi đó là human independent review, không coi hai chuỗi producer/reviewer khác nhau là bằng chứng độc lập. Hồ sơ ghi rõ giới hạn này.

## Các loại thời điểm

- **Kết thúc kỳ:** ngày dữ kiện tài chính mô tả.
- **Ký/kiểm toán:** ngày lập hoặc ký văn bản; không tự là ngày công bố.
- **Tuyên bố công bố trong tài liệu:** bằng chứng tự tuyên bố của doanh nghiệp; cần đọc đúng câu và ngày, gắn đúng tài liệu/phiên bản. Cover letter có thể bao gồm nhiều báo cáo; không dùng nó để gán phạm vi cho mọi trang.
- **Nhận từ Vietstock/API:** hệ thống đã quan sát tài liệu vào thời điểm đó; không chứng minh đây là ngày công bố đầu tiên. Metadata creation/modification của PDF cũng không chứng minh thời điểm công bố.
- **Ngày hệ thống biết:** không sớm hơn các mốc bắt buộc về nhận, nhập, review và public boundary theo policy đã chọn.

Chỉ có ngày công bố thì dùng độ chính xác DATE_ONLY và ranh giới cuối ngày theo policy, không tạo timestamp chính xác giả. Nếu thiếu bằng chứng công bố, giữ unknown cho historical AS_KNOWN. Có thể dùng thời điểm quan sát để mô tả dữ liệu hiện đang giữ, nhưng không tự biến nó thành ngày công bố hoặc quyền backtest.

## Tương thích với code hiện hành

Contract `independent-di-acceptance-v1` và seal đã có được giữ nguyên. Hồ sơ mới dùng contract `personal-ai-dataset-review-criteria-v1`; không đưa JSON mới vào API cũ bằng cách đặt tên reviewer khác đi.

Scorer hiện yêu cầu `Assessment.source=HUMAN`, và acceptance repository còn yêu cầu trusted legacy independent-review binding. Trước khi đưa nhận định AI vào FORMAL scoring, cần triển khai đường dẫn governance/provenance AI có version, validator và kiểm thử riêng. Đây là việc cần sửa code; không phải thiếu tài liệu từ chủ dự án. Không tự thay đổi trọng số, rubric hay hạ các gate tài chính để né ràng buộc này.

Policy đang soạn là `readiness-policy.proposed.json`, giữ nguyên các nhóm yêu cầu và ưu tiên từ policy tài chính đã có, bổ sung quy tắc review AI và checklist mô hình. Nó là bản đề xuất, chưa được đăng ký làm native runtime authority. Không coi danh sách metric rỗng trong policy đủ dữ kiện kế toán là bằng chứng đã đủ đầu vào scoring.

## Chỉ yêu cầu bổ sung dữ kiện thật sự thiếu

Phân loại từng thiếu sót:

1. Có trong PDF/API đang giữ: trích xuất hoặc đối chiếu tiếp, không yêu cầu gửi lại.
2. Có canonical fact nhưng thiếu definition/mapping/native binding: sửa code hoặc hồ sơ mapping.
3. Có dấu vết thời điểm nhưng chưa kiểm tra: kiểm tra nguồn, không yêu cầu chủ dự án tự đoán ngày.
4. Định giá/nhận định chưa lập: ghi đây là công việc phân tích và giả định cần làm rõ.
5. Chỉ sau khi đã tra nguồn hiện có mà vẫn thiếu đúng tài liệu, kỳ hoặc dữ kiện bắt buộc mới tạo yêu cầu bổ sung, nêu rõ mã/kỳ/chỉ tiêu và kết quả tìm kiếm.

Không yêu cầu PDF sao kê tài khoản để thay thế Excel B1–B5. Quy trình này rà soát PDF báo cáo doanh nghiệp đang giữ.
