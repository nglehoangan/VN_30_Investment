import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { loadDatabaseConfig } from '../src/infrastructure/config/database.ts';
import { prepareDatabaseFile } from '../src/infrastructure/db/files.ts';
import { toPublicError } from '../src/shared/errors/index.ts';
process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const commands = { validate: ['validate'], generate: ['generate'], migrate: ['migrate', 'deploy'], status: ['migrate', 'status'] };
const command = commands[process.argv[2]];
if (!command) throw new Error('Expected validate, generate, migrate or status');
try {
  // CLI and Next both support .env.local; explicit shell environment takes precedence.
  if (!process.argv.includes('--no-env-file') && existsSync('.env.local')) process.loadEnvFile('.env.local');
  const config = loadDatabaseConfig(process.env, process.cwd());
  if (process.argv[2] === 'migrate') prepareDatabaseFile(config);
  // New DB/journal files created by migration engine remain owner-only.
  process.umask(0o077);
  const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', ...command], {
    env: { ...process.env, DATABASE_URL: config.url }, stdio: 'inherit', timeout: 60000,
  });
  process.exitCode = result.error ? 1 : result.status ?? 1;
} catch (error) {
  console.error(JSON.stringify(toPublicError(error)));
  process.exitCode = 1;
}
