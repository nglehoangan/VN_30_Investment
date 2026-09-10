import { defineConfig } from "prisma/config";
import { loadDatabaseConfig } from "./src/infrastructure/config/database.ts";
const database = loadDatabaseConfig(process.env, process.cwd());
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: database.url },
});
