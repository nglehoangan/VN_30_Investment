import { mkdtempSync, rmSync, mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadDatabaseConfig } from "@/infrastructure/config/database";
import { prepareDatabaseFile } from "@/infrastructure/db/files";
import { openDatabase } from "@/infrastructure/db/client";
import { PrismaMethodologyRegistry } from "@/infrastructure/repositories/methodology-registry";
/** No caller target or inherited DATABASE_URL: every invocation owns a new private temp directory. */
export async function testDatabase(options: { foundationOnly?: boolean; portfolioOnly?: boolean; scoringOnly?: boolean } = {}) {
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
    if (options.foundationOnly || options.portfolioOnly || options.scoringOnly) {
      prepareDatabaseFile(config);
      const migrations = path.join(directory, "baseline-migrations");
      mkdirSync(path.join(migrations, "202609100001_methodology_registry"), { recursive: true });
      copyFileSync("prisma/migrations/202609100001_methodology_registry/migration.sql", path.join(migrations, "202609100001_methodology_registry/migration.sql"));
      copyFileSync("prisma/migrations/migration_lock.toml", path.join(migrations, "migration_lock.toml"));
      if (options.portfolioOnly || options.scoringOnly) {
        mkdirSync(path.join(migrations, "202609160001_portfolio_ledger"));
        copyFileSync("prisma/migrations/202609160001_portfolio_ledger/migration.sql", path.join(migrations, "202609160001_portfolio_ledger/migration.sql"));
      }
      if (options.scoringOnly) {
        mkdirSync(path.join(migrations, "202609170001_scoring_artifacts"));
        copyFileSync("prisma/migrations/202609170001_scoring_artifacts/migration.sql", path.join(migrations, "202609170001_scoring_artifacts/migration.sql"));
      }
      // Current registry clients require governance metadata even when a test intentionally stops before later domain migrations.
      mkdirSync(path.join(migrations, "202609200001_methodology_governance"));
      copyFileSync("prisma/migrations/202609200001_methodology_governance/migration.sql", path.join(migrations, "202609200001_methodology_governance/migration.sql"));
      const cliConfig = path.join(directory, "baseline.config.ts");
      writeFileSync(cliConfig, `export default ${JSON.stringify({ schema: path.resolve("prisma/schema.prisma"), migrations: { path: migrations }, datasource: { url: config.url } })};`);
      const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy", "--config", cliConfig], {
        env: { ...process.env, DATABASE_URL: config.url }, encoding: "utf8", timeout: 25000,
      });
      if (result.status !== 0) throw new Error("Isolated foundation migration failed");
    } else migration("migrate");
    const client = await openDatabase(config);
    return { directory, config, client, registry: new PrismaMethodologyRegistry(client), migration,
      async close() { try { await client.$disconnect(); } finally { rmSync(directory, { recursive: true }); } },
    };
  } catch (error) { rmSync(directory, { recursive: true }); throw error; }
}
