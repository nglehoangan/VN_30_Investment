import type { NextConfig } from "next";
const config: NextConfig = {
  // Preserve the SQLite adapter's native binding resolution in server builds.
  serverExternalPackages: ["@prisma/adapter-better-sqlite3"],
  // Local financial evidence is supplied at runtime, never packaged with the app.
  outputFileTracingExcludes: {
    "/*": ["./data/**/*", "./imports/**/*", "./exports/**/*", "./backups/**/*", "./.env*", "./api/.env*"],
  },
};
export default config;
