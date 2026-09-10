import { z } from "zod";
import { ConfigurationError, ValidationError } from "@/shared/errors";
import { parseBoundary } from "@/shared/validation/parse";
const environmentSchema = z.strictObject({
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).default("info"),
});
export type LogLevel = z.infer<typeof environmentSchema>["LOG_LEVEL"];
export interface AppConfig { readonly logLevel: LogLevel }
/** Select only owned variables. Unrelated OS/provider variables are not copied or serialized. */
export function loadConfig(environment: Readonly<Record<string, string | undefined>>): AppConfig {
  try {
    const result = parseBoundary(environmentSchema, { LOG_LEVEL: environment.LOG_LEVEL }, {
      "$": "Application environment configuration",
      LOG_LEVEL: "debug | info | warn | error | silent (unset defaults to info)",
    });
    return Object.freeze({ logLevel: result.LOG_LEVEL });
  } catch (error) {
    if (error instanceof ValidationError) throw new ConfigurationError(error.issues);
    throw new ConfigurationError([{ field: "$", reason: "Configuration could not be read", expected: "Application environment configuration" }]);
  }
}
