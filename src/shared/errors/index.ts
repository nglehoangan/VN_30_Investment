export const errorMessages = Object.freeze({
  VALIDATION_ERROR: "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại các trường nhập.",
  NOT_FOUND: "Không tìm thấy dữ liệu được yêu cầu.",
  CONFLICT: "Dữ liệu có xung đột. Vui lòng tải lại trước khi tiếp tục.",
  DATA_INTEGRITY_ERROR: "Không thể xác nhận tính toàn vẹn của dữ liệu.",
  EXTERNAL_PROVIDER_ERROR: "Nguồn dữ liệu bên ngoài hiện không khả dụng.",
  CONFIGURATION_ERROR: "Cấu hình ứng dụng chưa hợp lệ.",
  INTERNAL_ERROR: "Không thể hoàn tất thao tác. Vui lòng thử lại.",
});
export type ErrorCode = keyof typeof errorMessages;
export interface FieldIssue {
  readonly field: string;
  readonly reason: string;
  readonly expected: string;
}
export class AppError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode, options?: ErrorOptions) {
    super(errorMessages[code], options);
    this.name = new.target.name;
    this.code = code;
  }
}
export class ValidationError extends AppError {
  readonly issues: readonly FieldIssue[];
  constructor(issues: readonly FieldIssue[]) {
    super("VALIDATION_ERROR");
    this.issues = Object.freeze(issues.map(issue => Object.freeze({ field: issue.field, reason: issue.reason, expected: issue.expected })));
  }
}
export class NotFoundError extends AppError { constructor(options?: ErrorOptions) { super("NOT_FOUND", options); } }
export class ConflictError extends AppError { constructor(options?: ErrorOptions) { super("CONFLICT", options); } }
export class DataIntegrityError extends AppError { constructor(options?: ErrorOptions) { super("DATA_INTEGRITY_ERROR", options); } }
export class ExternalProviderError extends AppError { constructor(options?: ErrorOptions) { super("EXTERNAL_PROVIDER_ERROR", options); } }
export class ConfigurationError extends AppError {
  readonly issues: readonly FieldIssue[];
  constructor(issues: readonly FieldIssue[]) {
    super("CONFIGURATION_ERROR");
    this.issues = Object.freeze(issues.map(issue => Object.freeze({ field: issue.field, reason: issue.reason, expected: issue.expected })));
  }
}
/** Never inspect an unknown error's message, cause, stack or arbitrary serialized fields. */
export function errorCode(error: unknown): ErrorCode {
  if (error instanceof ValidationError) return "VALIDATION_ERROR";
  if (error instanceof NotFoundError) return "NOT_FOUND";
  if (error instanceof ConflictError) return "CONFLICT";
  if (error instanceof DataIntegrityError) return "DATA_INTEGRITY_ERROR";
  if (error instanceof ExternalProviderError) return "EXTERNAL_PROVIDER_ERROR";
  if (error instanceof ConfigurationError) return "CONFIGURATION_ERROR";
  return "INTERNAL_ERROR";
}
/** Only server-issued UUID correlation IDs are accepted as diagnostic metadata. */
export function safeCorrelationId(value: unknown): string | undefined {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : undefined;
}
export function toPublicError(error: unknown, correlationId?: string) {
  const code = errorCode(error);
  const id = safeCorrelationId(correlationId);
  return Object.freeze({ code, message: errorMessages[code], ...(id ? { correlationId: id } : {}) });
}
