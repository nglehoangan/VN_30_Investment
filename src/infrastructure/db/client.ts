import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/client";
import type { DatabaseConfig } from "../config/database";
import { prepareDatabaseFile } from "./files";
import { DataIntegrityError } from "@/shared/errors";
export async function openDatabase(config: DatabaseConfig): Promise<PrismaClient> {
  prepareDatabaseFile(config);
  const client = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: config.url }), log: [] });
  try {
    await client.$connect();
    await client.$executeRawUnsafe("PRAGMA foreign_keys = ON");
    await client.$executeRawUnsafe("PRAGMA recursive_triggers = ON");
    // DELETE mode for this single-user foundation; no unsupported WAL backup claim.
    await client.$queryRawUnsafe("PRAGMA journal_mode = DELETE");
    await client.$executeRawUnsafe("PRAGMA busy_timeout = 5000");
    return client;
  } catch (error) {
    await client.$disconnect();
    throw new DataIntegrityError({ cause: error });
  }
}
