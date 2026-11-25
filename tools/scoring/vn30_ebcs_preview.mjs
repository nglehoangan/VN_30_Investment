#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const root = resolve(import.meta.dirname, '../..');

try {
  const { values } = parseArgs({ options: {
    ticker: { type: 'string', multiple: true },
    cutoff: { type: 'string', multiple: true },
    input: { type: 'string', multiple: true },
    'universe-version': { type: 'string', multiple: true },
  } });
  if (values.ticker?.length !== 1 || !/^[A-Z0-9]{3}$/.test(values.ticker[0]) ||
      values.cutoff?.length !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(values.cutoff[0]) ||
      values.input?.length !== 1) {
    throw new Error('Required: --ticker ACB --cutoff 2026-10-30 --input <research-preview-packet.json>');
  }

  const bytes = readFileSync(values.input[0]);
  const packet = JSON.parse(bytes);
  if (packet?.contract === 'vn30-m3-public-successor-v1-PROPOSED') {
    if (values['universe-version']?.length !== 1) throw new Error('SUCCESSOR_UNIVERSE_VERSION_REQUIRED');
    const result = JSON.parse(execFileSync('python3', ['-B', 'tools/scoring/vn30_structural_disclosure.py',
      '--ticker', values.ticker[0], '--cutoff', values.cutoff[0],
      '--universe-version', values['universe-version'][0], '--packet', resolve(values.input[0]),
      '--lane', 'ebcs-replay'], { cwd: root, encoding: 'utf8' }));
    if (result.contract !== packet.contract || result.productionAuthority !== 'NONE') {
      throw new Error('SUCCESSOR_EBCS_AUTHORITY_MISMATCH');
    }
    console.log(JSON.stringify({ ...result, packetSha256: createHash('sha256').update(bytes).digest('hex') }));
  } else {
    if (packet?.contract !== 'ebcs-research-preview-input-v1') {
      throw new Error('EBCS_PREVIEW_PACKET_REQUIRED');
    }
    const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
    const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
    const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
    const loader = createJiti(import.meta.url, {
      alias: { '@': resolve(root, 'src') }, fsCache: false,
    });
    const { previewEvidenceBasedScore } = await loader.import(
      resolve(root, 'src/domain/current-scoring/evidence-based-preview.ts'));
    const { snapshotHash } = await loader.import(
      resolve(root, 'src/infrastructure/fundamentals/snapshot-hash.ts'));
    const result = previewEvidenceBasedScore(packet.input, packet.conservativeAssessments, snapshotHash);
    if (result.ticker !== values.ticker[0] || result.cutoff !== values.cutoff[0]) {
      throw new Error('EBCS_PREVIEW_SCOPE_MISMATCH');
    }
    console.log(JSON.stringify({
      ...result, packetSha256: createHash('sha256').update(bytes).digest('hex'),
    }, null, 2));
  }
} catch (error) {
  const reasons = error.issues?.map(issue => issue.reason);
  console.error(reasons?.length ? reasons.join('\n') : error.message);
  process.exitCode = 1;
}
