import { mkdirSync, lstatSync, realpathSync, existsSync, openSync, closeSync } from "node:fs";
import path from "node:path";
import { assertPrivateLocation, databaseConfigurationError, type DatabaseConfig } from "../config/database.ts";
/** Creates only private empty storage; never resets, truncates or changes existing data. */
export function prepareDatabaseFile(config: DatabaseConfig): void {
  try {
    const directory = path.dirname(config.filePath);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const physicalDirectory = realpathSync(directory);
    const physicalFile = path.join(physicalDirectory, path.basename(config.filePath));
    assertPrivateLocation(physicalFile, config.projectDirectory);
    for (const name of ["public", ".next"]) {
      const root = path.join(config.projectDirectory, name);
      if (existsSync(root)) {
        const relative = path.relative(realpathSync(root), physicalFile);
        if (relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) throw databaseConfigurationError();
      }
    }
    if ((lstatSync(physicalDirectory).mode & 0o077) !== 0) throw databaseConfigurationError();
    if (!existsSync(config.filePath)) {
      const fd = openSync(config.filePath, "wx", 0o600); closeSync(fd);
    }
    const stat = lstatSync(config.filePath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || (stat.mode & 0o077) !== 0) throw databaseConfigurationError();
  } catch {
    throw databaseConfigurationError();
  }
}
