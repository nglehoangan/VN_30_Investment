// @vitest-environment node
import { afterEach, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync, writeFileSync, readFileSync, chmodSync, mkdirSync, symlinkSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadDatabaseConfig } from "@/infrastructure/config/database";
import { prepareDatabaseFile } from "@/infrastructure/db/files";
import { ConfigurationError } from "@/shared/errors";
const roots: string[] = [];
function root() { const value = mkdtempSync(path.join(tmpdir(), "vn30-config-test-")); roots.push(value); return value; }
afterEach(() => { for (const value of roots.splice(0)) rmSync(value, { recursive: true }); });
it("resolves default relative to project root without touching the filesystem", () => {
  const directory = root(); const config = loadDatabaseConfig({}, directory);
  expect(config.filePath).toBe(path.join(directory, "data", "vn30.sqlite"));
  expect(Object.isFrozen(config)).toBe(true); expect(existsSync(path.join(directory, "data"))).toBe(false);
});
it.each(["", "postgresql://password-canary@localhost/db", "file:relative.sqlite", "file://remote/db.sqlite", "file::memory:", "file:/tmp/test.sqlite?mode=memory", "file:/tmp/a%20b.sqlite", "file:/tmp/test.sqlite#secret-canary"])("rejects unsupported database location %s without echo", value => {
  try { loadDatabaseConfig({ DATABASE_URL: value }, root()); expect.fail("Expected invalid database config"); }
  catch (error) { expect(error).toBeInstanceOf(ConfigurationError); expect(JSON.stringify(error)).not.toContain("canary"); }
});
it("rejects public/build paths even after traversal normalization", () => {
  const directory = root();
  for (const name of ["public/data.sqlite", ".next/data.sqlite", "data/../public/data.sqlite"]) {
    expect(() => loadDatabaseConfig({ DATABASE_URL: `file:${directory}/${name}` }, directory)).toThrow(ConfigurationError);
  }
});
it("creates private files without truncating existing contents", () => {
  const config = loadDatabaseConfig({}, root()); prepareDatabaseFile(config);
  expect(statSync(path.dirname(config.filePath)).mode & 0o077).toBe(0);
  expect(statSync(config.filePath).mode & 0o077).toBe(0);
  writeFileSync(config.filePath, "preserve-existing-content"); prepareDatabaseFile(config);
  expect(readFileSync(config.filePath, "utf8")).toBe("preserve-existing-content");
});
it("rejects unsafe existing permissions without silently changing or deleting the file", () => {
  const config = loadDatabaseConfig({}, root()); prepareDatabaseFile(config);
  writeFileSync(config.filePath, "unchanged"); chmodSync(config.filePath, 0o644);
  expect(() => prepareDatabaseFile(config)).toThrow(ConfigurationError);
  expect(readFileSync(config.filePath, "utf8")).toBe("unchanged");
  expect(statSync(config.filePath).mode & 0o777).toBe(0o644);
});
it("rejects a symlinked DB file", () => {
  const directory = root(); const target = path.join(directory, "target.sqlite");
  writeFileSync(target, "unchanged", { mode: 0o600 });
  symlinkSync(target, path.join(directory, "alias.sqlite"));
  const config = loadDatabaseConfig({ DATABASE_URL: `file:${directory}/alias.sqlite` }, directory);
  expect(() => prepareDatabaseFile(config)).toThrow(ConfigurationError);
  expect(readFileSync(target, "utf8")).toBe("unchanged");
});
it("rejects a data directory alias pointing into public before file creation", () => {
  const directory = root(); mkdirSync(path.join(directory, "public"), { mode: 0o700 });
  symlinkSync(path.join(directory, "public"), path.join(directory, "data"));
  expect(() => prepareDatabaseFile(loadDatabaseConfig({}, directory))).toThrow(ConfigurationError);
  expect(existsSync(path.join(directory, "public", "vn30.sqlite"))).toBe(false);
});
