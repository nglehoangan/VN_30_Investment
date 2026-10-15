import { describe, expect, it } from "vitest";
import { loadConfig } from "@/infrastructure/config/environment";
import { ValidationError, ConfigurationError, NotFoundError, ConflictError, DataIntegrityError, ExternalProviderError, toPublicError } from "@/shared/errors";
const id = "00000000-0000-4000-8000-000000000001";
describe("configuration", () => {
  it("defaults only missing LOG_LEVEL and excludes unrelated secrets", () => {
    const config = loadConfig({ API_KEY: "key-canary", PASSWORD: "password-canary" });
    expect(config).toEqual({ logLevel: "info" });
    expect(Object.isFrozen(config)).toBe(true);
  });
  it.each(["debug", "info", "warn", "error", "silent"])("accepts %s", level => {
    expect(loadConfig({ LOG_LEVEL: level }).logLevel).toBe(level);
  });
  it.each(["", "INFO", " info", "key-secret-canary"])("rejects invalid config without echoing %s", value => {
    try { loadConfig({ LOG_LEVEL: value }); expect.fail("Expected configuration failure"); }
    catch (error) {
      expect(error).toBeInstanceOf(ConfigurationError);
      if (error instanceof ConfigurationError) {
        expect(error.issues[0]).toMatchObject({ field: "LOG_LEVEL", reason: "Value is not an allowed option" });
        expect(error.issues[0].expected).toContain("unset defaults to info");
        expect(JSON.stringify(error)).not.toContain("canary");
        expect(error.cause).toBeUndefined();
      }
    }
  });
});
describe("safe errors", () => {
  const cause = new Error("SELECT password FROM credentials at /private/secret-canary; OTP=123456");
  it.each([
    [new ValidationError([{ field: "name", reason: "Required", expected: "String" }]), "VALIDATION_ERROR"],
    [new NotFoundError({ cause }), "NOT_FOUND"],
    [new ConflictError({ cause }), "CONFLICT"],
    [new DataIntegrityError({ cause }), "DATA_INTEGRITY_ERROR"],
    [new ExternalProviderError({ cause }), "EXTERNAL_PROVIDER_ERROR"],
    [new ConfigurationError([]), "CONFIGURATION_ERROR"],
    [cause, "INTERNAL_ERROR"],
    [{ code: "CONFLICT", message: "password-canary" }, "INTERNAL_ERROR"],
    [null, "INTERNAL_ERROR"],
  ])("maps error to fixed public category %#", (error, code) => {
    const view = toPublicError(error, id);
    expect(view.code).toBe(code);
    expect(view.correlationId).toBe(id);
    expect(Object.keys(view).sort()).toEqual(["code", "correlationId", "message"]);
    expect(JSON.stringify(view)).not.toMatch(/secret|canary|SELECT|123456|private/);
  });
  it("omits arbitrary correlation text and does not read unknown messages", () => {
    const error = { get message() { throw new Error("must not be read"); } };
    expect(toPublicError(error, "secret-canary\npassword")).not.toHaveProperty("correlationId");
  });
  it("copies and freezes field issues rather than retaining mutable extra data", () => {
    const issue = { field: "name", reason: "Required", expected: "String", secret: "canary" };
    const error = new ValidationError([issue]); issue.field = "changed";
    expect(error.issues[0].field).toBe("name");
    expect(Object.isFrozen(error.issues[0])).toBe(true);
    expect(JSON.stringify(error)).not.toContain("canary");
  });
});
