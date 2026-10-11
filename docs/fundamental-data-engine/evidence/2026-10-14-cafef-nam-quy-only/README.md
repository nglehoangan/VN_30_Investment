# CafeF NAM/QUY-only ingestion

Owner instruction: “bỏ sử dụng luỹ kế từ api cafef đi chỉ dùng quy với nam để làm”.

Current API acquisition, retained-input loading and semantic contract certification use only NAM and QUY. The transport rejects LUYKE before an HTTP request. New registries explicitly permit NAM/QUY only; LUYKE observations cannot pass current admission even if their old semantic certificate otherwise qualifies.

YTD facts from qualified issuer/PDF evidence remain eligible under existing rules. Quarterly cash flows still require proved standalone/cumulative semantics; no automatic quarter-to-YTD substitution or annualization. Existing coverage requirements and readyForScoring=false remain in place.

Legacy LUYKE parsing and explicit historical replay flags exist solely to reproduce already sealed dated evidence. Archived producers remain bound to their original run; they are not current ingestion entry points. No historical evidence was modified.

Current policy validation: node scripts/report-cafef-nam-quy-policy.mjs. Historical compatibility: node scripts/verify-cafef-production-admission.mjs and node scripts/verify-structured-certification.mjs. All operate offline on retained evidence.
