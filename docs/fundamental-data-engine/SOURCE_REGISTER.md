# Fundamental source register

## FPT Corporation — FPT

Recorded: 2026-10-09. Owner requested retaining these links for future financial-report collection after the public browsing trial. This entry records source discovery, not production-data acceptance or permission for an unattended bulk collection job.

| Purpose | URL |
|---|---|
| Financial-report section supplied by owner | https://fpt.com/vi/nha-dau-tu/bao-cao-thuong-nien#tai-chinh |
| Investor landing page; tested report discovery | https://fpt.com/vi/nha-dau-tu |
| Tested sample: consolidated financial statements Q2/2026 | https://fpt.com/api/media/20260727_FPT_BCTC_hop_nhat_Quy_2_2026_8d6b7fdefb.pdf |

Trial result: public investor page and linked PDF opened without authentication. The sample PDF has 47 pages. The financial-report tab was not fully exposed by the static page reader; the report link was discovered on the investor landing page. Retain the landing page for discovering new reports; the sample PDF URL identifies one report only.

Text extraction: the browsing tool returned no extracted PDF text. Reliable table extraction and any OCR requirement remain unverified. No financial values have been accepted from this trial.

Publication provenance: authoritative publication date/time and timezone remain unverified. The date embedded in the file name must not become a publication timestamp. Future captures must independently retain actual retrieval/ingestion times and any evidenced public disclosure date.

Issuer scope: this source is FPT Corporation (Công ty Cổ phần FPT). The earlier `fptonline.net` sample belongs to FPT Online (Công ty Cổ phần Dịch vụ Trực tuyến FPT) and must not supply canonical observations for FPT.

Before scheduled collection, qualify website access/retention conditions, tab/pagination discovery, bounded retrieval and retry behavior, original-document preservation, and report/issuer/period identity. No API entitlement, complete historical/VN30 coverage, PIT readiness or DI gate PASS is inferred from public accessibility. No credentials are needed for the tested public links. The trial did not write to the production database.

## VN30 issuer source survey — 2026-10-09

Cấu hình nguồn có thể đọc bằng máy: [issuer-sources.json](./issuer-sources.json). Đây là đầu vào cho bộ thu thập sau này; chưa triển khai crawler hoặc lịch chạy từ khảo sát này. Các nguồn chưa xác minh được lưu với trạng thái cần xử lý, không coi là tải tự động thành công.

Phạm vi 30 mã lấy theo bảng phân bổ [SSIAM VN30 ETF](https://ssiam.com.vn/en/fund-information-vn30), ghi ngày 31/08/2026, kiểm tra ngày 09/10/2026. Đây là đối chiếu phục vụ tìm nguồn, chưa thay thế danh sách thành phần HOSE được phê duyệt của engine. [Factsheet HOSE tháng 08/2026](https://staticfile.hsx.vn/Uploads/UploadDocuments/2487402/Form_Factsheet_MCIndices_VN_T08.2026.pdf) chưa mở được bằng công cụ; xác minh thành phần chính thức còn chờ.

| Mã | Trang nguồn | Kết quả | Quan sát |
|---|---|---|---|
| ACB | [Asia Commercial Bank](https://acb.com.vn/nha-dau-tu/bao-cao-tai-chinh) | Cần render nội dung động | Trang danh mục cần nội dung động; PDF mẫu riêng đã mở, 99 trang, có văn bản. |
| BID | [BIDV](https://bidv.com.vn/vn/quan-he-nha-dau-tu/thong-tin-tai-chinh) | Cần render nội dung động | Trang công khai; danh sách tài liệu còn placeholder động. |
| BSR | [Binh Son Refining and Petrochemical](https://bsr.com.vn/bao-cao) | Chưa mở được bằng công cụ | Tìm thấy trang chính thức trong chỉ mục tìm kiếm; lần mở trực tiếp lỗi 502 hoặc lỗi công cụ. |
| CTG | [VietinBank](https://investor.vietinbank.vn/vi/periodicreports.aspx) | Có liên kết báo cáo | Danh sách báo cáo riêng/hợp nhất đọc được; mở một liên kết mẫu gặp lỗi công cụ. |
| FPT | [FPT Corporation](https://fpt.com/vi/nha-dau-tu) | Đã mở PDF mẫu | Trang nhà đầu tư và PDF mẫu mở được; tab tài chính cần xử lý nội dung động. |
| GAS | [PV GAS](https://www.pvgas.com.vn/bai-viet/category/bao-cao-tai-chinh) | Có liên kết báo cáo | Danh mục, bài Q2/2026 và liên kết PDF Việt/Anh đọc được; lần mở tệp đính kèm lỗi công cụ. |
| GVR | [Vietnam Rubber Group](https://vrg.vn/quan-he-co-dong/bao-cao-tai-chinh/) | Có liên kết báo cáo | Danh mục và trang năm 2026 có liên kết báo cáo riêng/hợp nhất; chưa mở PDF mẫu. |
| HDB | [HDBank](https://hdbank.com.vn/vi/investor/thong-tin-nha-dau-tu/bao-cao-tai-chinh) | Cần kiểm tra chuyển hướng | Chuyển tới đường dẫn bản tin nhà đầu tư; chưa xác nhận danh sách và PDF báo cáo. |
| HPG | [Hoa Phat Group](https://www.hoaphat.com.vn/quan-he-co-dong/bao-cao-tai-chinh) | Có liên kết báo cáo | Danh sách và URL PDF đọc được; PDF bán niên mẫu vượt giới hạn công cụ: 22.266.273 byte. |
| LPB | [LPBank](https://lpbank.com.vn/nha-dau-tu/) | Chưa mở được bằng công cụ | Trang chính thức được tìm thấy qua chỉ mục; mở trực tiếp timeout/lỗi công cụ. |
| MBB | [Military Commercial Joint Stock Bank](https://www.mbbank.com.vn/Investor/bao-cao-tai-chinh/0/0//documents) | Cần render nội dung động | Trang đúng mục báo cáo tài chính; tên báo cáo và file còn placeholder, chưa lấy được URL PDF. |
| MCH | [Masan Consumer](https://masanconsumer.com/quan-he-co-dong/thong-tin-tai-chinh/) | Đã mở PDF mẫu | Danh sách và PDF hợp nhất bán niên 2026 mở được, 69 trang. |
| MSN | [Masan Group](https://www.masangroup.com/vi/investor-relations/) | Có liên kết báo cáo | Danh sách và URL PDF đọc được; PDF bán niên mẫu vượt giới hạn công cụ: 27.847.457 byte. |
| MWG | [Mobile World Investment Corporation](https://mwg.vn/bao-cao) | Cần render nội dung động | Trang báo cáo có bộ chọn năm; danh sách chưa được render trong công cụ, chưa lấy được PDF. |
| SAB | [SABECO](https://sabeco.com.vn/2025-2) | Có liên kết báo cáo | Trang năm 2025 mở được; đường dẫn danh mục tổng thử nghiệm lỗi. Cần tìm thêm trang năm mới. |
| SHB | [Saigon Hanoi Bank](https://www.shb.com.vn/category/nha-dau-tu/bao-cao-tai-chinh/) | Đã mở PDF mẫu | Danh mục, bài bán niên và PDF hợp nhất mở được, 57 trang. |
| SSB | [SeABank](https://www.seabank.com.vn/tin-tuc/nha-dau-tu/bao-cao-tai-chinh) | Có danh sách; cần lấy link tệp | Danh sách và bài báo cáo hợp nhất bán niên 2026 đọc được; chưa xác định URL tệp PDF. |
| SSI | [SSI Securities Corporation](https://www.ssi.com.vn/quan-he-nha-dau-tu/bao-cao-tai-chinh) | Có danh sách; cần lấy link tệp | Tên báo cáo theo kỳ và phân trang đọc được; chưa xác định URL tệp mẫu. |
| STB | [Sacombank](https://www.sacombank.com.vn/trang-chu/nha-dau-tu/bao-cao.html) | Cần render nội dung động | Đúng mục báo cáo tài chính; bộ chọn năm chưa render danh sách. Không suy ra công ty thiếu báo cáo. |
| TCB | [Techcombank](https://techcombank.com/nha-dau-tu/thong-tin-tai-chinh/bao-cao-tai-chinh-vas) | Cần render nội dung động | Trang VAS có bộ lọc động; chỉ mục thấy báo cáo nhưng lần mở trực tiếp chưa có các mục. IFRS phải tách riêng. |
| TCX | [Techcom Securities](https://www.tcbs.com.vn/nha-dau-tu/) | Đã mở PDF mẫu | Trang của chính tổ chức phát hành TCX và PDF Q2/2026 mở được, 63 trang. |
| VCB | [Vietcombank](https://www.vietcombank.com.vn/vi-VN/Nha-dau-tu) | Mới xác minh trang nhà đầu tư | Mở được trang quan hệ nhà đầu tư; chưa xác nhận đường dẫn danh mục tài chính và PDF cụ thể. |
| VHM | [Vinhomes](https://vinhomes.vn/en/bao-cao-tai-chinh) | Chưa mở được bằng công cụ | Trang tài chính chính thức tìm được qua chỉ mục; lần mở trực tiếp lỗi, bản tiếng Việt trả 403. |
| VIB | [Vietnam International Bank](https://www.vib.com.vn/vn/nha-dau-tu) | Chưa mở được bằng công cụ | Trang nhà đầu tư chính thức trả 403; bài công bố tài chính được tìm thấy trong chỉ mục. Cần xác nhận danh mục PDF. |
| VIC | [Vingroup](https://vingroup.net/quan-he-co-dong/bao-cao-tai-chinh) | Cần render nội dung động | Mở được danh mục và bộ chọn năm; trang năm 2026 chưa hiển thị các URL báo cáo trong công cụ. |
| VJC | [Vietjet Air](https://ir.vietjetair.com/Home/Menu/bao-cao-tai-chinh-quy) | Chưa mở được bằng công cụ | URL danh mục quý được dẫn trong văn bản công bố của chính VJC; lần mở trực tiếp gặp lỗi công cụ. |
| VNM | [Vinamilk](https://www.vinamilk.com.vn/investor/reports/financial) | Chưa mở được bằng công cụ | Đường dẫn tài chính tìm được qua tìm kiếm; các lần mở trực tiếp lỗi. Cần xác nhận đường dẫn sau đổi website. |
| VPB | [VPBank](https://www.vpbank.com.vn/quan-he-nha-dau-tu/bao-cao-tai-chinh) | Cần render nội dung động | Trang có bộ chọn năm; chỉ mục thấy tên báo cáo nhưng công cụ chưa render danh sách/PDF. |
| VPL | [Vinpearl](https://vinpearl.com/vi/bao-cao-tai-chinh) | Đã mở PDF mẫu | Danh sách riêng/hợp nhất và PDF hợp nhất Q2/2026 mở được, 57 trang. |
| VRE | [Vincom Retail](https://ir.vincom.com.vn/bao-cao-tai-chinh-va-tom-tat-ket-qua-kinh-doanh/) | Đã mở PDF mẫu | Dù có thông báo cần JavaScript, danh sách và PDF hợp nhất bán niên 2026 mở được, 48 trang. |

### Nguồn bổ sung từ các danh sách VN30 khác thời điểm

Giữ riêng bốn mã ngoài bảng đối chiếu trên để tránh bỏ sót khi xác minh lại thành phần chính thức.

| Mã | Trang nguồn | Kết quả | Quan sát |
|---|---|---|---|
| BVH | [Bao Viet Holdings](https://www.baoviet.com.vn/vi/bao-cao-tai-chinh) | Có danh sách; cần lấy link tệp | Danh sách đọc được; chưa mở tệp mẫu. Ngày hiển thị có thể là ngày chuyển hệ thống, chưa xác minh ngày công bố. |
| POW | [PV Power](https://pvpower.vn/vi/tag/bao-cao-tai-chinh-10.htm) | Có liên kết báo cáo | Trang danh mục mở được; tìm thấy các bài Q1, Q2 và bán niên 2026. |
| PLX | [Petrolimex](https://www.petrolimex.com.vn/quan-he-nha-dau-tu.html) | Có liên kết báo cáo | Trang nhà đầu tư của Tập đoàn mở được; có báo cáo hợp nhất bán niên. Không dùng báo cáo công ty con. |
| TPB | [TPBank](https://tpb.vn/nha-dau-tu/bao-cao-tai-chinh) | Cần render nội dung động | Mở được trang báo cáo tài chính; chưa xác minh các URL tài liệu trong nội dung động. |

### Tài liệu mẫu đã kiểm tra

| Mã | Tài liệu | Kết quả |
|---|---|---|
| ACB | [PDF mẫu](https://acb.com.vn/acbwebsite/files/ACB-FS2025-Consol-VN_searchable.pdf) | 99 trang; công cụ trả văn bản |
| FPT | [PDF mẫu](https://fpt.com/api/media/20260727_FPT_BCTC_hop_nhat_Quy_2_2026_8d6b7fdefb.pdf) | 47 trang; công cụ không trả văn bản trích xuất |
| HPG | [PDF mẫu](https://file.hoaphat.com.vn/hoaphat-com-vn/2026/08/20260828-hpg-bctc-hop-nhat-soat-xet-6-thang-2026-va-giai-trinh-1-2.pdf) | Vượt giới hạn kích thước công cụ; chưa mở nội dung |
| MCH | [PDF mẫu](https://masanconsumer.com/wp-content/uploads/2026/08/110.-MSC-Consol-Audited-1H2026-VN.pdf) | 69 trang; công cụ không trả văn bản trích xuất |
| MSN | [PDF mẫu](https://www.masangroup.com/wp-content/uploads/2026/08/03.-MSN-Consol-HY26-VN-quality.pdf) | Vượt giới hạn kích thước công cụ; chưa mở nội dung |
| SHB | [PDF mẫu](https://www.shb.com.vn/wp-content/uploads/2026/08/hop-nhat-30.6.26-1.pdf) | 57 trang; công cụ không trả văn bản trích xuất |
| TCX | [PDF mẫu](https://www.tcbs.com.vn/wp-content/uploads/2026/07/TCBS-Bao-cao-tai-chinh-QII.2026.pdf) | 63 trang; công cụ không trả văn bản trích xuất |
| VPL | [PDF mẫu](https://statics.vinpearl.com/20260827%20-%20VPL%20-%20BCTC%20hop%20nhat%20Quy%202%202026.pdf) | 57 trang; công cụ không trả văn bản trích xuất |
| VRE | [PDF mẫu](https://ir.vincom.com.vn/wp-content/uploads/2026/08/Bao-cao-tai-chinh-hop-nhat-ban-nien-soat-xet-2026.pdf) | 48 trang; công cụ không trả văn bản trích xuất |

Kiểm tra bằng tìm kiếm công khai, đọc trang và mở một số tệp đính kèm; chưa xác minh render trình duyệt, toàn bộ lịch sử, phân trang hay trích bảng. Lỗi fetch/403/timeout hoặc giới hạn tệp phản ánh lần thử bằng công cụ, không chứng minh website ngừng hoạt động. Lỗi chứng chỉ trong phép thử HTTP cục bộ chưa thể quy cho máy chủ doanh nghiệp.

Bộ thu thập cần dùng URL danh mục để tìm tài liệu mới; PDF mẫu chỉ thuộc một kỳ. Cần xử lý trang động, phân trang, redirect, retry và tải có giới hạn phù hợp trước khi bật lịch. Giữ báo cáo riêng/hợp nhất, VAS/IFRS và bản ký/searchable thành các tài liệu có định danh rõ ràng. Không suy ra ngày công bố từ tên file, ngày crawl của tìm kiếm hay ngày chuyển hệ thống. Chưa ghi giá trị tài chính vào sản xuất, xác nhận PIT/DI hoặc điều kiện lưu giữ từ khảo sát này.
