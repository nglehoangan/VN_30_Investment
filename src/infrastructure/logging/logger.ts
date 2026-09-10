import type { Clock } from "@/ports/runtime";
import type { LogLevel } from "@/infrastructure/config/environment";
import { errorCode, safeCorrelationId } from "@/shared/errors";
import { instant } from "@/shared/time";
const priorities = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40, silent: 50 });
const events = ["application.started", "application.failed", "request.failed", "validation.failed", "operation.failed"] as const;
export type LogEvent = typeof events[number];
type MessageLevel = Exclude<LogLevel, "silent">;
export type LogSink = (line: string) => void;
export interface LogContext { readonly correlationId?: string; readonly error?: unknown }
/** Allowlist redaction: no raw message, payload, request, headers, environment or error object. */
export function createLogger(options: { readonly level: LogLevel; readonly clock: Clock; readonly sink: LogSink }) {
  return Object.freeze({
    log(level: MessageLevel, event: LogEvent, context: LogContext = {}): boolean {
      // Runtime checks also reject extra/untyped values that could carry secrets or log injection.
      if (!Object.hasOwn(priorities, level) || level === ("silent" as string) || !events.includes(event)) return false;
      if (priorities[level] < priorities[options.level]) return false;
      try {
        const correlationId = safeCorrelationId(context.correlationId);
        const entry = {
          timestamp: instant(options.clock.now()), level, event,
          ...(correlationId ? { correlationId } : {}),
          ...(context.error === undefined ? {} : { errorCode: errorCode(context.error) }),
        };
        options.sink(JSON.stringify(entry));
        return true;
      } catch {
        // Diagnostic sink/clock failures must not create a second application failure.
        return false;
      }
    },
  });
}
export const consoleSink: LogSink = line => { console.log(line); };
