import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { realpathSync } from "node:fs";
import { PrismaClient } from "@/infrastructure/db/generated/client";
import { assertPrivateLocation, loadDatabaseConfig } from "@/infrastructure/config/database";
import type { CurrentPublishedCard } from "@/ports/current-publication";
import { ACB_PUBLICATION_ID, acbPublications } from "@/infrastructure/source-admission/acb-publication";

export async function readAcbPublishedScore(): Promise<CurrentPublishedCard | null> {
  const config = loadDatabaseConfig(process.env, process.cwd());
  const file = realpathSync(config.filePath);
  assertPrivateLocation(file, config.projectDirectory);
  const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: file, readonly: true, fileMustExist: true }) });
  try {
    return await acbPublications(db, config.projectDirectory).find(ACB_PUBLICATION_ID);
  } finally {
    await db.$disconnect();
  }
}
