import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadDatabaseConfig } from "@/infrastructure/config/database";
import { openDatabase } from "@/infrastructure/db/client";
import { PrismaMethodologyRegistry } from "@/infrastructure/repositories/methodology-registry";
/** No caller target or inherited DATABASE_URL: every invocation owns a new private temp directory. */
export async function testDatabase() {
  const directory = mkdtempSync(path.join(tmpdir(), "vn30-test-db-"));
  const config = loadDatabaseConfig({ DATABASE_URL: `file:${path.join(directory, "fixture data.sqlite")}` }, process.cwd());
  function migration(command: "migrate" | "status") {
    const result = spawnSync(process.execPath, ["scripts/database.mjs", command, "--no-env-file"], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_URL: config.url }, encoding: "utf8", timeout: 25000,
    });
    if (result.status !== 0) throw new Error(`Test migration ${command} failed (exit ${result.status}); test DB only`);
    return result.status;
  }
  try {
    migration("migrate");
    const client = await openDatabase(config);
    return { directory, config, client, registry: new PrismaMethodologyRegistry(client), migration,
      async close() { try { await client.$disconnect(); } finally { rmSync(directory, { recursive: true }); } },
    };
  } catch (error) { rmSync(directory, { recursive: true }); throw error; }
}
