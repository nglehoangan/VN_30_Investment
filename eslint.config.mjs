import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals, ...nextTypescript,
  // Immutable historical evidence is linted when authored, not rewritten by current tooling.
  // Scope is this single sealed verifier; active scripts and the rest of evidence remain checked.
  globalIgnores(["docs/fundamental-data-engine/evidence/2026-10-21-escalated-blocker-resolution/verify-engineering.mjs",".next/**", "coverage/**", "next-env.d.ts", "src/infrastructure/db/generated/**", "data/initialization-08b-*/**"]),
]);
