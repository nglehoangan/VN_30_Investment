import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

// Local CLI runtime only: TypeScript paths are not Node package aliases.
import './lib/ts-runtime.mjs';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log('node scripts/collect-fpt.mjs --output /absolute/new-directory [--report https://fpt.com/api/media/BCTC.pdf] [--offline /absolute/fixture.json]');
    return;
  }
  let output, offline;
  const reportUrls = [];
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i+1]) throw new Error('ARGUMENT_REQUIRED');
    if (args[i] === '--output' && !output) output = args[i+1];
    else if (args[i] === '--offline' && !offline) offline = args[i+1];
    else if (args[i] === '--report') reportUrls.push(args[i+1]);
    else throw new Error('UNKNOWN_OR_DUPLICATE_ARGUMENT');
  }
  if (!output || !isAbsolute(output) || existsSync(output) || (offline && !isAbsolute(offline))) {
    throw new Error('NEW_ABSOLUTE_OUTPUT_DIRECTORY_REQUIRED');
  }
  const { FptDocumentCollector } = await import('../src/infrastructure/fundamentals/fpt.ts');
  let dependencies;
  if (offline) {
    const fixture = JSON.parse(readFileSync(offline,'utf8'));
    if (!Array.isArray(fixture)) throw new Error('INVALID_OFFLINE_FIXTURE');
    dependencies = { now: () => new Date().toISOString(), sleep: async () => {},
      request: async url => {
        const row = fixture.find(r => r.url === url);
        if (!row || typeof row.bodyBase64 !== 'string') throw new Error('OFFLINE_RESOURCE_MISSING');
        return new Response(Buffer.from(row.bodyBase64,'base64'),{status:row.status,headers:{'content-type':row.mediaType}});
      } };
  }
  const collector = new FptDocumentCollector({reportUrls},dependencies);
  // Reserve a new private destination before any network access; never reads env files or DB.
  mkdirSync(output,{mode:0o700});
  const result = await collector.collect(`fpt-${randomUUID()}`);
  const body = JSON.stringify({ mode:offline ? 'OFFLINE_FIXTURE' : 'PUBLIC_HTTP',...result },null,2) + '\n';
  writeFileSync(join(output,'manifest.json'),body,{flag:'wx',mode:0o600});
  writeFileSync(join(output,'manifest.sha256'),createHash('sha256').update(body).digest('hex') + '\n',{flag:'wx',mode:0o600});
  console.log(`FPT ${result.batch.completion}; ${result.captures.length} raw captures; private manifest saved.`);
  if (result.batch.completion === 'FAILED') process.exitCode = 2;
}
main().catch(() => { console.error('FPT collection failed; no production database was accessed.'); process.exitCode = 1; });
