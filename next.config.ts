import type { NextConfig } from "next";
const config: NextConfig = {
  // Local financial evidence is supplied at runtime, never packaged with the app.
  outputFileTracingExcludes: {
    "/*": ["./data/**/*", "./imports/**/*", "./exports/**/*", "./backups/**/*", "./.env*", "./api/.env*"],
  },
};
export default config;
