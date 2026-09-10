import "server-only";
import { loadDatabaseConfig } from "@/infrastructure/config/database";
import { openDatabase } from "@/infrastructure/db/client";
import { PrismaMethodologyRegistry } from "@/infrastructure/repositories/methodology-registry";
/** Explicit lifetime for future server use cases. Nothing opens or migrates during page render. */
export async function openPersistence() {
  const client = await openDatabase(loadDatabaseConfig(process.env, process.cwd()));
  return Object.freeze({ registry: new PrismaMethodologyRegistry(client), close: () => client.$disconnect() });
}
