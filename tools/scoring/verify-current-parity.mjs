/** Check generated scoring source against the exact retired generator. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const revision = '2351de92abdad75d930de7e3e81efac70639b091';
const historicalPath = 'scripts/generate-current-scoring.mjs';
const expectedHash = '3a3752c13137f58446ba7632d8971918ff24247e94e69eaf1d5032e301debdf5';
const bytes = execFileSync('git', ['show', revision + ':' + historicalPath], {cwd: root});
if (createHash('sha256').update(bytes).digest('hex') !== expectedHash) {
  throw Error('RETIRED_SCORING_GENERATOR_HASH_MISMATCH');
}
execFileSync(process.execPath, ['--input-type=module', '-', '--check'], {
  cwd: root, input: bytes, stdio: ['pipe', 'inherit', 'inherit'],
});
