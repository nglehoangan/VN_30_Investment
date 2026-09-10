import "server-only";
import { loadDatabaseConfig } from "@/infrastructure/config/database";
import { loadConfig } from "@/infrastructure/config/environment";
import { createLogger, consoleSink } from "@/infrastructure/logging/logger";
import { runtime } from "./runtime";
let logger: ReturnType<typeof createLogger> | undefined;
export function initializeServer() {
  if (logger) return logger;
  try {
    const config = loadConfig(process.env);
    loadDatabaseConfig(process.env, process.cwd());
    logger = createLogger({ level: config.logLevel, clock: runtime.clock, sink: consoleSink });
    logger.log("info", "application.started");
    return logger;
  } catch (error) {
    createLogger({ level: "error", clock: runtime.clock, sink: consoleSink }).log("error", "application.failed", { error });
    throw error;
  }
}
export function reportServerError(error: unknown) {
  initializeServer().log("error", "request.failed", { error, correlationId: runtime.ids.next() });
}
