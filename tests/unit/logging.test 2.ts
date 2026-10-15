import { describe, expect, it } from "vitest";
import { createLogger } from "@/infrastructure/logging/logger";
import { ExternalProviderError, ValidationError } from "@/shared/errors";
import { instant } from "@/shared/time";
import { fixedClock } from "../fixtures/runtime";
const clock = fixedClock(instant("2024-01-01T00:00:00.000Z"));
const id = "00000000-0000-4000-8000-000000000001";
describe("structured allowlist logging", () => {
  it("writes deterministic JSON with only permitted metadata", () => {
    const lines: string[] = [];
    const logger = createLogger({ level: "info", clock, sink: line => lines.push(line) });
    expect(logger.log("error", "operation.failed", { correlationId: id, error: new ExternalProviderError() })).toBe(true);
    expect(JSON.parse(lines[0])).toEqual({ timestamp: "2024-01-01T00:00:00.000Z", level: "error", event: "operation.failed", correlationId: id, errorCode: "EXTERNAL_PROVIDER_ERROR" });
  });
  it("drops nested secrets, broker credentials, OTP, headers and raw error/cause", () => {
    const lines: string[] = [];
    const logger = createLogger({ level: "debug", clock, sink: line => lines.push(line) });
    const context = { correlationId: "invalid-secret-canary", error: new ExternalProviderError({ cause: new Error("raw-secret-canary") }),
      password: "password-canary", otp: "otp-canary", credentials: { broker: "broker-canary" },
      headers: { Authorization: "Bearer auth-canary" }, environment: { API_KEY: "key-canary" }, payload: ["payload-canary"], message: "free-text-canary" };
    logger.log("error", "request.failed", context);
    expect(lines.join("")).not.toMatch(/canary|password|otp|broker|Authorization|API_KEY|payload|cause|stack/);
    expect(JSON.parse(lines[0])).toEqual({ timestamp: clock.now(), level: "error", event: "request.failed", errorCode: "EXTERNAL_PROVIDER_ERROR" });
  });
  it("never serializes validation details or arbitrary circular error objects", () => {
    const lines: string[] = [];
    const logger = createLogger({ level: "debug", clock, sink: line => lines.push(line) });
    logger.log("warn", "validation.failed", { error: new ValidationError([{ field: "secret-canary", reason: "secret-canary", expected: "secret-canary" }]) });
    const circular: { self?: unknown } = {}; circular.self = circular;
    expect(logger.log("error", "request.failed", { error: circular })).toBe(true);
    expect(lines.join("")).not.toContain("canary");
  });
  it("filters lower levels and supports silent", () => {
    const lines: string[] = [];
    expect(createLogger({ level: "warn", clock, sink: line => lines.push(line) }).log("info", "application.started")).toBe(false);
    expect(createLogger({ level: "silent", clock, sink: line => lines.push(line) }).log("error", "application.failed")).toBe(false);
    expect(lines).toEqual([]);
  });
  it("rejects untyped free text for event/level instead of logging it", () => {
    const lines: string[] = [];
    const logger = createLogger({ level: "debug", clock, sink: line => lines.push(line) });
    // @ts-expect-error Intentionally exercise an untyped caller at runtime.
    expect(logger.log("error", "secret-canary")).toBe(false);
    // @ts-expect-error Intentionally exercise an untyped caller at runtime.
    expect(logger.log("secret-canary", "operation.failed")).toBe(false);
    expect(lines).toEqual([]);
  });
  it("does not turn diagnostic failures into application failures", () => {
    const logger = createLogger({ level: "info", clock, sink: () => { throw new Error("sink-secret-canary"); } });
    expect(logger.log("info", "application.started")).toBe(false);
  });
});
