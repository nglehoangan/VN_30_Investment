import path from "node:path";
import { z } from "zod";
import { ConfigurationError } from "../../shared/errors/index.ts";
export interface DatabaseConfig {
  readonly url: string;
  readonly filePath: string;
  readonly projectDirectory: string;
}
const urlSchema = z.string().min(1).refine(value => value.startsWith("file:/") && !value.startsWith("file://") && !/[?%#\0]/.test(value));
export function databaseConfigurationError(): ConfigurationError {
  return new ConfigurationError([{ field: "DATABASE_URL", reason: "Invalid or unsafe local database location", expected: "file:/absolute/path/to/local.sqlite in a private directory outside public/build output, or unset for local data directory" }]);
}
export function assertPrivateLocation(filePath: string, projectDirectory: string): void {
  for (const directory of ["public", ".next"]) {
    const relative = path.relative(path.resolve(projectDirectory, directory), filePath);
    if (relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) throw databaseConfigurationError();
  }
}
/** Raw absolute file path after file: (no URI encoding, query parameters or remote DB). */
export function loadDatabaseConfig(environment: Readonly<Record<string, string | undefined>>, projectDirectory: string): DatabaseConfig {
  const root = path.resolve(projectDirectory);
  const supplied = environment.DATABASE_URL;
  const value = supplied === undefined ? `file:${path.join(root, "data", "vn30.sqlite")}` : supplied;
  if (!urlSchema.safeParse(value).success) throw databaseConfigurationError();
  const filePath = path.resolve(value.slice(5));
  if (!path.isAbsolute(value.slice(5)) || !/\.(?:sqlite3?|db)$/.test(filePath)) throw databaseConfigurationError();
  assertPrivateLocation(filePath, root);
  return Object.freeze({ url: `file:${filePath}`, filePath, projectDirectory: root });
}
