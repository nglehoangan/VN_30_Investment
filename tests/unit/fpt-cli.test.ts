// @vitest-environment node
import { it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, statSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

it('runs an offline private capture, checks integrity and refuses overwrites without touching DB', () => {
  const directory = mkdtempSync(join(tmpdir(),'vn30-fpt-cli-'));
  try {
    const fixture = join(directory,'fixture.json'), output = join(directory,'output');
    const database = join(directory,'must-not-exist.sqlite');
    writeFileSync(fixture,JSON.stringify([
      {url:'https://fpt.com/vi/nha-dau-tu',status:200,mediaType:'text/html',
        bodyBase64:Buffer.from('<a href="/api/media/FPT_BCTC_TEST.pdf">test</a>').toString('base64')},
      {url:'https://fpt.com/api/media/FPT_BCTC_TEST.pdf',status:200,mediaType:'application/pdf',
        bodyBase64:Buffer.from('%PDF-1.7\nTEST ONLY').toString('base64')},
    ]));
    const run = () => spawnSync(process.execPath,['scripts/collect-fpt.mjs','--output',output,'--offline',fixture],
      {encoding:'utf8',timeout:15_000,env:{...process.env,DATABASE_URL:`file:${database}`}});
    expect(run().status).toBe(0);
    const body = readFileSync(join(output,'manifest.json'));
    expect(createHash('sha256').update(body).digest('hex')).toBe(readFileSync(join(output,'manifest.sha256'),'utf8').trim());
    const manifest = JSON.parse(body.toString());
    expect(manifest.mode).toBe('OFFLINE_FIXTURE'); expect(manifest.batch.completion).toBe('PARTIAL');
    expect(manifest.captures).toHaveLength(2);
    expect(statSync(join(output,'manifest.json')).mode & 0o777).toBe(0o600);
    expect(run().status).toBe(1);
    expect(readFileSync(join(output,'manifest.json'))).toEqual(body);
    expect(existsSync(database)).toBe(false);
  } finally { rmSync(directory,{recursive:true,force:true}); }
}, 20_000);
