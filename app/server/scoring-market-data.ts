import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { realpathSync } from "node:fs";
import { PrismaClient } from "@/infrastructure/db/generated/client";
import { assertPrivateLocation, loadDatabaseConfig } from "@/infrastructure/config/database";
import { latestDirectMarketPrices } from "@/infrastructure/repositories/direct-market-prices";

export async function withScoringReadDatabase<T>(read: (db: PrismaClient, projectDirectory: string) => Promise<T>) {
  const config = loadDatabaseConfig(process.env, process.cwd());
  const file = realpathSync(config.filePath);
  assertPrivateLocation(file, config.projectDirectory);
  const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: file, readonly: true, fileMustExist: true }) });
  try {
    return await read(db, config.projectDirectory);
  } finally {
    await db.$disconnect();
  }
}

export async function readScoringMarketDate(ticker: string) {
  return withScoringReadDatabase(async db => {
    const [price] = await latestDirectMarketPrices(db, [ticker], new Date().toISOString());
    return price?.asOfDate ?? null;
  }).catch(() => null);
}
