Review Level-1 cuối cùng, chỉ ghi bằng chứng. Đọc FINAL_REVIEW.md trước.

Bộ dữ liệu được chốt bằng manifest và hash 30 shard trong DATASET_IDENTITY.json. ALL30_LEVEL1_REVALIDATION.json có toàn bộ 1.115 nhóm bắt buộc / 150 mục tiêu kỳ. Presentation OCR/API mới không tự thay thế canonical đã duyệt. Ngoại lệ của chủ dự án được giữ và ghi rõ.

Kết quả: 29 closed candidates + 1 deferred (MBB). Không thay đổi production hoặc chạy scoring. Chờ **Review Consolidated Financial Final Revalidation**.

Tái lập trong cùng repository bằng Python3, theo thứ tự: revalidate.py → finalize.py → audit_lineage.py → supplement.py → seal.py. Chạy từ repository root. Nguồn CAR VIB được giữ ở sources/VIB_CAR_20260630.pdf; nếu chưa có cần lấy URL đã chốt trong VIB_REVALIDATION.json vào đường dẫn tạm mà finalize.py chỉ định. REVIEWED_TRANSCRIPTIONS.json là kết quả kiểm ảnh nguồn, không phải một adapter suy diễn từ số tiền. Các helper chỉ ghi vào gói bằng chứng này.

EXACT_POINTER_AUDIT.json kiểm tra raw API và các JSON pointer. PROVENANCE_REVIEW.json / SOURCE_IDENTITY_REVIEW.json phân biệt nguồn đã duyệt với tài liệu OCR chưa duyệt. PERIOD_SOURCE_REVIEW.json giữ identity và source qualification cho từng kỳ. ZERO_SEMANTICS_REVIEW.json kiểm tra zero và chứng cứ cũ đã loại. Các hình render tạm không phải điều kiện replay hay admission.

ARTIFACT_HASHES.json chốt mọi file trong gói ngoại trừ chính nó. Dữ liệu hợp nhất lớn không được sao chép vào gói.
